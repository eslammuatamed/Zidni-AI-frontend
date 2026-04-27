import { defineStore } from 'pinia';
import {
  fetchAssistantRoles,
  createAssistantRole,
  updateAssistantRole,
  deleteAssistantRole,
  fetchAssistants,
  createAssistant,
  updateAssistant,
  deleteAssistant,
  fetchAssistantInsights,
  type AssistantRole,
  type AssistantAccount,
  type AssistantRolePayload,
  type AssistantPayload,
  type AssistantInsights,
  type AssistantPersonaInsight,
  type AssistantCoverageInsight
} from '@/services/teacherAssistants';

export interface AssistantPermissionOption {
  id: string;
  labelKey: string;
  descriptionKey: string;
}

export interface AssistantRoleUsage {
  id: number;
  name: string;
  persona: string | null;
  permissions: string[];
  assistantCount: number;
}

export interface AssistantsSummary {
  totalAssistants: number;
  activeAssistants: number;
  inactiveAssistants: number;
  pendingAssistants: number;
  disabledAssistants: number;
  unassignedAssistants: number;
  totalRoles: number;
  rolesWithoutMembers: number;
  lastUpdatedAt: number | null;
}

export const ASSISTANT_PERMISSION_OPTIONS: AssistantPermissionOption[] = [
  {
    id: 'courses.manage',
    labelKey: 'teacher.assistants.permissions.courses.label',
    descriptionKey: 'teacher.assistants.permissions.courses.description'
  },
  {
    id: 'students.view',
    labelKey: 'teacher.assistants.permissions.students.label',
    descriptionKey: 'teacher.assistants.permissions.students.description'
  },
  {
    id: 'registrations.manage',
    labelKey: 'teacher.assistants.permissions.registrations.label',
    descriptionKey: 'teacher.assistants.permissions.registrations.description'
  },
  {
    id: 'assessments.manage',
    labelKey: 'teacher.assistants.permissions.assessments.label',
    descriptionKey: 'teacher.assistants.permissions.assessments.description'
  },
  {
    id: 'tutoring.manage',
    labelKey: 'teacher.assistants.permissions.tutoring.label',
    descriptionKey: 'teacher.assistants.permissions.tutoring.description'
  },
  {
    id: 'reports.view',
    labelKey: 'teacher.assistants.permissions.reports.label',
    descriptionKey: 'teacher.assistants.permissions.reports.description'
  },
  {
    id: 'communications.manage',
    labelKey: 'teacher.assistants.permissions.communications.label',
    descriptionKey: 'teacher.assistants.permissions.communications.description'
  }
];

const CACHE_TTL_MS = 2 * 60 * 1000;

const EMPTY_INSIGHTS: AssistantInsights = {
  personas: [],
  coverage: [],
  automation: [],
  collaboration: [],
  performance: []
};

const normalizePermissions = (permissions: unknown): string[] => {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return permissions.filter((permission): permission is string => typeof permission === 'string' && permission.length > 0);
};

const normalizeRole = (role: AssistantRole): AssistantRole => ({
  ...role,
  persona: typeof role.persona === 'string' && role.persona.length ? role.persona : null,
  permissions: normalizePermissions(role.permissions)
});

const normalizeAssistant = (assistant: AssistantAccount): AssistantAccount => {
  const normalizedRole = assistant.role ? normalizeRole(assistant.role) : null;
  let resolvedRoleId: number | null = null;
  if (typeof assistant.roleId === 'number' && Number.isFinite(assistant.roleId)) {
    resolvedRoleId = assistant.roleId;
  } else if (normalizedRole?.id != null) {
    resolvedRoleId = normalizedRole.id;
  }

  const status = typeof assistant.status === 'string' ? assistant.status : null;

  return {
    ...assistant,
    role: normalizedRole,
    roleId: resolvedRoleId,
    status
  };
};

interface AssistantsState {
  roles: AssistantRole[];
  rolesLoading: boolean;
  rolesError: string;
  rolesLoadedAt: number | null;
  assistants: AssistantAccount[];
  assistantsLoading: boolean;
  assistantsError: string;
  assistantsLoadedAt: number | null;
  insights: AssistantInsights;
  insightsLoading: boolean;
  insightsError: string;
  insightsLoadedAt: number | null;
}

export const useTeacherAssistantsStore = defineStore('teacher-assistants', {
  state: (): AssistantsState => ({
    roles: [],
    rolesLoading: false,
    rolesError: '',
    rolesLoadedAt: null,
    assistants: [],
    assistantsLoading: false,
    assistantsError: '',
    assistantsLoadedAt: null,
    insights: EMPTY_INSIGHTS,
    insightsLoading: false,
    insightsError: '',
    insightsLoadedAt: null
  }),
  getters: {
    roleById: (state) => (id: number | null | undefined) => {
      if (id == null) {
        return undefined;
      }
      return state.roles.find((role) => role.id === id);
    },
    personaInsights(state): AssistantPersonaInsight[] {
      return state.insights.personas ?? [];
    },
    coverageInsights(state): AssistantCoverageInsight[] {
      return state.insights.coverage ?? [];
    },
    automationInsights(state): AssistantInsights['automation'] {
      return state.insights.automation ?? [];
    },
    collaborationInsights(state): AssistantInsights['collaboration'] {
      return state.insights.collaboration ?? [];
    },
    performanceInsights(state): AssistantInsights['performance'] {
      return state.insights.performance ?? [];
    },
    roleUsage(state): AssistantRoleUsage[] {
      const counts = state.assistants.reduce<Map<number, number>>((acc, assistant) => {
        if (assistant.roleId != null) {
          acc.set(assistant.roleId, (acc.get(assistant.roleId) || 0) + 1);
        }
        return acc;
      }, new Map());

      return state.roles.map((role) => ({
        id: role.id,
        name: role.name,
        persona: role.persona ?? null,
        permissions: role.permissions || [],
        assistantCount: counts.get(role.id) || 0
      }));
    },
    assistantsSummary(state): AssistantsSummary {
      const summary: AssistantsSummary = {
        totalAssistants: state.assistants.length,
        activeAssistants: 0,
        inactiveAssistants: 0,
        pendingAssistants: 0,
        disabledAssistants: 0,
        unassignedAssistants: 0,
        totalRoles: state.roles.length,
        rolesWithoutMembers: 0,
        lastUpdatedAt: null
      };

      let latestTimestamp = Math.max(state.assistantsLoadedAt ?? 0, state.rolesLoadedAt ?? 0);
      summary.lastUpdatedAt = latestTimestamp > 0 ? latestTimestamp : null;

      for (const assistant of state.assistants) {
        const status = (assistant.status || 'active').toLowerCase();
        if (status === 'inactive') {
          summary.inactiveAssistants += 1;
        } else if (status === 'pending') {
          summary.pendingAssistants += 1;
        } else if (status === 'disabled') {
          summary.disabledAssistants += 1;
        } else {
          summary.activeAssistants += 1;
        }

        if (assistant.roleId == null) {
          summary.unassignedAssistants += 1;
        }
      }

      const roleMembers = state.assistants.reduce<Map<number, number>>((acc, assistant) => {
        if (assistant.roleId != null) {
          acc.set(assistant.roleId, (acc.get(assistant.roleId) || 0) + 1);
        }
        return acc;
      }, new Map());

      summary.rolesWithoutMembers = state.roles.reduce((count, role) => {
        return roleMembers.get(role.id) ? count : count + 1;
      }, 0);

      const insightsLoadedAt = state.insightsLoadedAt ?? 0;
      if (insightsLoadedAt > 0) {
        summary.lastUpdatedAt = summary.lastUpdatedAt
          ? Math.max(summary.lastUpdatedAt, insightsLoadedAt)
          : insightsLoadedAt;
      }

      return summary;
    }
  },
  actions: {
    isRolesCacheFresh() {
      return this.rolesLoadedAt !== null && Date.now() - this.rolesLoadedAt < CACHE_TTL_MS;
    },
    isAssistantsCacheFresh() {
      return this.assistantsLoadedAt !== null && Date.now() - this.assistantsLoadedAt < CACHE_TTL_MS;
    },
    isInsightsCacheFresh() {
      return this.insightsLoadedAt !== null && Date.now() - this.insightsLoadedAt < CACHE_TTL_MS;
    },
    async loadRoles(force = false) {
      if (this.rolesLoading) {
        return;
      }
      if (!force && this.roles.length && this.isRolesCacheFresh()) {
        return;
      }
      this.rolesLoading = true;
      this.rolesError = '';
      try {
        const roles = await fetchAssistantRoles();
        this.roles = Array.isArray(roles) ? roles.map(normalizeRole) : [];
        this.rolesLoadedAt = Date.now();
      } catch (error) {
        console.error('[teacher-assistants] failed to load roles', error);
        this.rolesError = 'LOAD_FAILED';
      } finally {
        this.rolesLoading = false;
      }
    },
    async loadAssistants(force = false) {
      if (this.assistantsLoading) {
        return;
      }
      if (!force && this.assistants.length && this.isAssistantsCacheFresh()) {
        return;
      }
      this.assistantsLoading = true;
      this.assistantsError = '';
      try {
        const assistants = await fetchAssistants();
        this.assistants = Array.isArray(assistants) ? assistants.map(normalizeAssistant) : [];
        this.assistantsLoadedAt = Date.now();
      } catch (error) {
        console.error('[teacher-assistants] failed to load assistants', error);
        this.assistantsError = 'LOAD_FAILED';
      } finally {
        this.assistantsLoading = false;
      }
    },
    async loadInsights(force = false) {
      if (this.insightsLoading) {
        return;
      }
      if (!force && (this.insights.personas.length || this.insights.coverage.length) && this.isInsightsCacheFresh()) {
        return;
      }
      this.insightsLoading = true;
      this.insightsError = '';
      try {
        const insights = await fetchAssistantInsights();
        this.insights = {
          personas: Array.isArray(insights?.personas) ? insights.personas : [],
          coverage: Array.isArray(insights?.coverage) ? insights.coverage : [],
          automation: Array.isArray(insights?.automation) ? insights.automation : [],
          collaboration: Array.isArray(insights?.collaboration) ? insights.collaboration : [],
          performance: Array.isArray(insights?.performance) ? insights.performance : []
        };
        this.insightsLoadedAt = Date.now();
      } catch (error) {
        console.error('[teacher-assistants] failed to load insights', error);
        this.insightsError = 'LOAD_FAILED';
        if (!this.insights.personas.length && !this.insights.coverage.length) {
          this.insights = EMPTY_INSIGHTS;
        }
      } finally {
        this.insightsLoading = false;
      }
    },
    async refreshAll() {
      await Promise.all([this.loadRoles(true), this.loadAssistants(true), this.loadInsights(true)]);
    },
    async createRole(payload: AssistantRolePayload) {
      const created = normalizeRole(await createAssistantRole(payload));
      this.roles = [...this.roles, created];
      this.rolesLoadedAt = Date.now();
      await this.loadInsights(true);
      return created;
    },
    async updateRole(roleId: number, payload: AssistantRolePayload) {
      const updated = normalizeRole(await updateAssistantRole(roleId, payload));
      this.roles = this.roles.map((role) => (role.id === roleId ? updated : role));
      this.assistants = this.assistants.map((assistant) =>
        assistant.roleId === roleId ? { ...assistant, role: updated } : assistant
      );
      this.rolesLoadedAt = Date.now();
      await this.loadInsights(true);
      return updated;
    },
    async deleteRole(roleId: number) {
      await deleteAssistantRole(roleId);
      this.roles = this.roles.filter((role) => role.id !== roleId);
      this.assistants = this.assistants.map((assistant) =>
        assistant.roleId === roleId ? { ...assistant, roleId: null, role: null } : assistant
      );
      this.rolesLoadedAt = Date.now();
      this.assistantsLoadedAt = Date.now();
      await this.loadInsights(true);
    },
    async createAssistant(payload: AssistantPayload) {
      const created = normalizeAssistant(await createAssistant(payload));
      this.assistants = [...this.assistants, created];
      this.assistantsLoadedAt = Date.now();
      await this.loadInsights(true);
      return created;
    },
    async updateAssistant(assistantId: number, payload: AssistantPayload) {
      const updated = normalizeAssistant(await updateAssistant(assistantId, payload));
      this.assistants = this.assistants.map((assistant) =>
        assistant.id === assistantId ? updated : assistant
      );
      this.assistantsLoadedAt = Date.now();
      await this.loadInsights(true);
      return updated;
    },
    async deleteAssistant(assistantId: number) {
      await deleteAssistant(assistantId);
      this.assistants = this.assistants.filter((assistant) => assistant.id !== assistantId);
      this.assistantsLoadedAt = Date.now();
      await this.loadInsights(true);
    }
  }
});
