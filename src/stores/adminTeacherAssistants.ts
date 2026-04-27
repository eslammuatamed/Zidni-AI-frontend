import { defineStore } from 'pinia';
import {
  createTeacherAssistantAdmin,
  createTeacherAssistantRoleAdmin,
  deleteTeacherAssistantAdmin,
  deleteTeacherAssistantRoleAdmin,
  listTeacherAssistantRolesAdmin,
  listTeacherAssistantsAdmin,
  updateTeacherAssistantAdmin,
  updateTeacherAssistantRoleAdmin
} from '@/services/admin';
import type {
  AssistantAccount,
  AssistantPayload,
  AssistantRole,
  AssistantRolePayload
} from '@/services/teacherAssistants';

interface AdminTeacherAssistantsState {
  teacherId: number | null;
  roles: AssistantRole[];
  assistants: AssistantAccount[];
  rolesLoading: boolean;
  assistantsLoading: boolean;
  rolesError: string | null;
  assistantsError: string | null;
  lastLoadedAt: number | null;
}

export const useAdminTeacherAssistantsStore = defineStore('admin-teacher-assistants', {
  state: (): AdminTeacherAssistantsState => ({
    teacherId: null,
    roles: [],
    assistants: [],
    rolesLoading: false,
    assistantsLoading: false,
    rolesError: null,
    assistantsError: null,
    lastLoadedAt: null
  }),
  getters: {
    roleById: (state) => (id: number | null | undefined) => {
      if (id == null) {
        return undefined;
      }
      return state.roles.find((role) => role.id === id);
    }
  },
  actions: {
    reset() {
      this.teacherId = null;
      this.roles = [];
      this.assistants = [];
      this.rolesError = null;
      this.assistantsError = null;
      this.lastLoadedAt = null;
    },
    async initialize(teacherId: number, force = false) {
      if (this.teacherId !== teacherId) {
        this.teacherId = teacherId;
        this.roles = [];
        this.assistants = [];
        this.lastLoadedAt = null;
        force = true;
      }
      await Promise.all([this.loadRoles(force), this.loadAssistants(force)]);
      this.lastLoadedAt = Date.now();
    },
    async loadRoles(force = false) {
      if (!this.teacherId) {
        return;
      }
      if (this.roles.length > 0 && !force) {
        return;
      }
      this.rolesLoading = true;
      this.rolesError = null;
      try {
        this.roles = await listTeacherAssistantRolesAdmin(this.teacherId);
      } catch (error) {
        console.error('[admin-teacher-assistants] failed to load roles', error);
        this.rolesError = 'ROLES_LOAD_FAILED';
        throw error;
      } finally {
        this.rolesLoading = false;
      }
    },
    async loadAssistants(force = false) {
      if (!this.teacherId) {
        return;
      }
      if (this.assistants.length > 0 && !force) {
        return;
      }
      this.assistantsLoading = true;
      this.assistantsError = null;
      try {
        this.assistants = await listTeacherAssistantsAdmin(this.teacherId);
      } catch (error) {
        console.error('[admin-teacher-assistants] failed to load assistants', error);
        this.assistantsError = 'ASSISTANTS_LOAD_FAILED';
        throw error;
      } finally {
        this.assistantsLoading = false;
      }
    },
    async refreshAll() {
      if (!this.teacherId) {
        return;
      }
      await Promise.all([this.loadRoles(true), this.loadAssistants(true)]);
      this.lastLoadedAt = Date.now();
    },
    async createRole(payload: AssistantRolePayload) {
      if (!this.teacherId) {
        throw new Error('Teacher not selected');
      }
      const role = await createTeacherAssistantRoleAdmin(this.teacherId, payload);
      this.roles = [...this.roles, role].sort((a, b) => a.name.localeCompare(b.name));
      return role;
    },
    async updateRole(roleId: number, payload: AssistantRolePayload) {
      if (!this.teacherId) {
        throw new Error('Teacher not selected');
      }
      const updated = await updateTeacherAssistantRoleAdmin(this.teacherId, roleId, payload);
      this.roles = this.roles
        .map((role) => (role.id === updated.id ? updated : role))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.assistants = this.assistants.map((assistant) => {
        if (assistant.roleId === updated.id) {
          return {
            ...assistant,
            role: {
              id: updated.id,
              name: updated.name,
              permissions: updated.permissions
            }
          };
        }
        return assistant;
      });
      return updated;
    },
    async deleteRole(roleId: number) {
      if (!this.teacherId) {
        throw new Error('Teacher not selected');
      }
      await deleteTeacherAssistantRoleAdmin(this.teacherId, roleId);
      this.roles = this.roles.filter((role) => role.id !== roleId);
      this.assistants = this.assistants.map((assistant) => {
        if (assistant.roleId === roleId) {
          return {
            ...assistant,
            roleId: null,
            role: null
          };
        }
        return assistant;
      });
    },
    async createAssistant(payload: AssistantPayload) {
      if (!this.teacherId) {
        throw new Error('Teacher not selected');
      }
      const assistant = await createTeacherAssistantAdmin(this.teacherId, payload);
      this.assistants = [...this.assistants, assistant].sort((a, b) => a.name.localeCompare(b.name));
      return assistant;
    },
    async updateAssistant(assistantId: number, payload: AssistantPayload) {
      if (!this.teacherId) {
        throw new Error('Teacher not selected');
      }
      const updated = await updateTeacherAssistantAdmin(this.teacherId, assistantId, payload);
      this.assistants = this.assistants
        .map((assistant) => (assistant.id === updated.id ? updated : assistant))
        .sort((a, b) => a.name.localeCompare(b.name));
      return updated;
    },
    async deleteAssistant(assistantId: number) {
      if (!this.teacherId) {
        throw new Error('Teacher not selected');
      }
      await deleteTeacherAssistantAdmin(this.teacherId, assistantId);
      this.assistants = this.assistants.filter((assistant) => assistant.id !== assistantId);
    }
  }
});
