import { defineStore } from 'pinia';
import type {
  AddMembersPayload,
  CreateGroupPayload,
  GroupDto,
  GroupMemberDto,
  MemberQuery,
  PagedResponse,
  StudentListItem,
  StudentQuery,
  UpdateGroupPayload
} from '@/services/teacherRoster';
import {
  addGroupMembers,
  createTeacherGroup,
  deleteTeacherGroup,
  fetchGroupMembers,
  fetchTeacherGroups,
  fetchTeacherStudents,
  disableTeacherStudentDevice,
  enableTeacherStudentDevice,
  resetTeacherStudentDevice,
  removeGroupMember,
  updateTeacherGroup
} from '@/services/teacherRoster';
import type { AxiosError } from 'axios';
import { parsePlanQuotaError, type PlanQuotaErrorDetails } from '@/utils/planQuota';

interface StudentsParams extends StudentQuery {}
interface GroupsParams {
  q?: string;
  page?: number;
  size?: number;
}

export const useTeacherRosterStore = defineStore('teacher-roster', {
  state: () => ({
    featureEnabled: true,
    students: [] as StudentListItem[],
    studentsTotal: 0,
    studentsPage: 0,
    studentsSize: 20,
    studentsLoading: false,
    studentsSearch: '',
    studentsStatus: '',
    quotaWarning: null as PlanQuotaErrorDetails | null,
    groups: [] as GroupDto[],
    groupsTotal: 0,
    groupsPage: 0,
    groupsSize: 10,
    groupsLoading: false,
    groupsQuery: '',
    members: [] as GroupMemberDto[],
    membersTotal: 0,
    membersPage: 0,
    membersSize: 10,
    membersQuery: '',
    membersLoading: false,
    activeGroup: null as GroupDto | null
  }),
  actions: {
    markDisabled() {
      this.featureEnabled = false;
      this.quotaWarning = null;
    },
    async loadStudents(params?: StudentsParams) {
      this.studentsLoading = true;
      try {
        const query: StudentsParams = {
          search: params?.search ?? this.studentsSearch,
          status: params?.status ?? this.studentsStatus,
          page: params?.page ?? this.studentsPage,
          size: params?.size ?? this.studentsSize
        };
        const response = await fetchTeacherStudents({
          ...query,
          status: query.status && query.status.length > 0 ? query.status : undefined,
          search: query.search && query.search.length > 0 ? query.search : undefined
        });
        this.featureEnabled = true;
        this.quotaWarning = null;
        this.students = response.items;
        this.studentsTotal = response.total;
        this.studentsPage = response.page;
        this.studentsSize = response.size;
        if (params?.search !== undefined) {
          this.studentsSearch = params.search;
        }
        if (params?.status !== undefined) {
          this.studentsStatus = params.status;
        }
      } catch (error) {
        const quotaError = parsePlanQuotaError(error);
        if (quotaError) {
          this.quotaWarning = quotaError;
          this.students = [];
          this.studentsTotal = 0;
          this.studentsPage = 0;
          return;
        }
        if (this.isFeatureDisabledError(error)) {
          this.markDisabled();
          this.students = [];
          this.studentsTotal = 0;
          return;
        }
        throw error;
      } finally {
        this.studentsLoading = false;
      }
    },
    async disableStudentDevice(studentId: number) {
      const updated = await disableTeacherStudentDevice(studentId);
      this.students = this.students.map((student) => (student.studentId === studentId ? updated : student));
      return updated;
    },
    async enableStudentDevice(studentId: number) {
      const updated = await enableTeacherStudentDevice(studentId);
      this.students = this.students.map((student) => (student.studentId === studentId ? updated : student));
      return updated;
    },
    async resetStudentDevice(studentId: number) {
      const updated = await resetTeacherStudentDevice(studentId);
      this.students = this.students.map((student) => (student.studentId === studentId ? updated : student));
      return updated;
    },
    async loadGroups(params?: GroupsParams) {
      this.groupsLoading = true;
      try {
        const query: GroupsParams = {
          q: params?.q ?? this.groupsQuery,
          page: params?.page ?? this.groupsPage,
          size: params?.size ?? this.groupsSize
        };
        const response = await fetchTeacherGroups({
          ...query,
          q: query.q && query.q.length > 0 ? query.q : undefined
        });
        this.featureEnabled = true;
        this.groups = response.items;
        this.groupsTotal = response.total;
        this.groupsPage = response.page;
        this.groupsSize = response.size;
        if (this.activeGroup) {
          const refreshed = this.groups.find((group: { id: number }) => group.id === this.activeGroup!.id);
          if (refreshed) {
            this.activeGroup = refreshed;
          }
        }
        if (params?.q !== undefined) {
          this.groupsQuery = params.q;
        }
      } catch (error) {
        if (this.isFeatureDisabledError(error)) {
          this.markDisabled();
          this.groups = [];
          this.groupsTotal = 0;
          return;
        }
        throw error;
      } finally {
        this.groupsLoading = false;
      }
    },
    async createGroup(payload: CreateGroupPayload) {
      const created = await createTeacherGroup(payload);
      this.groups = [created, ...this.groups];
      this.groupsTotal += 1;
      return created;
    },
    async updateGroup(groupId: number, payload: UpdateGroupPayload) {
      const updated = await updateTeacherGroup(groupId, payload);
  this.groups = this.groups.map((group: { id: number }) => (group.id === updated.id ? updated : group));
      if (this.activeGroup && this.activeGroup.id === updated.id) {
        this.activeGroup = updated;
      }
      return updated;
    },
    async deleteGroup(groupId: number) {
      await deleteTeacherGroup(groupId);
  this.groups = this.groups.filter((group: { id: number }) => group.id !== groupId);
      this.groupsTotal = Math.max(0, this.groupsTotal - 1);
      if (this.activeGroup && this.activeGroup.id === groupId) {
        this.activeGroup = null;
        this.members = [];
        this.membersTotal = 0;
      }
    },
    async loadMembers(groupId?: number, params?: MemberQuery) {
      if (!groupId && !this.activeGroup) {
        return;
      }
      const targetGroupId = groupId ?? this.activeGroup!.id;
      this.membersLoading = true;
      try {
        const query: MemberQuery = {
          q: params?.q ?? this.membersQuery,
          page: params?.page ?? this.membersPage,
          size: params?.size ?? this.membersSize
        };
        const response = await fetchGroupMembers(targetGroupId, {
          ...query,
          q: query.q && query.q.length > 0 ? query.q : undefined
        });
        this.featureEnabled = true;
        this.members = response.items;
        this.membersTotal = response.total;
        this.membersPage = response.page;
        this.membersSize = response.size;
  this.activeGroup = this.groups.find((group: { id: number }) => group.id === targetGroupId) ?? this.activeGroup;
        if (params?.q !== undefined) {
          this.membersQuery = params.q;
        }
      } catch (error) {
        if (this.isFeatureDisabledError(error)) {
          this.markDisabled();
          this.members = [];
          this.membersTotal = 0;
          return;
        }
        throw error;
      } finally {
        this.membersLoading = false;
      }
    },
    async addMembers(groupId: number, payload: AddMembersPayload) {
      const added = await addGroupMembers(groupId, payload);
      await this.loadMembers(groupId, { page: this.membersPage, size: this.membersSize, q: this.membersQuery });
      await this.loadGroups({ q: this.groupsQuery, page: this.groupsPage, size: this.groupsSize });
      return added;
    },
    async removeMember(groupId: number, studentId: number) {
      await removeGroupMember(groupId, studentId);
      await this.loadMembers(groupId, { page: this.membersPage, size: this.membersSize, q: this.membersQuery });
      await this.loadGroups({ q: this.groupsQuery, page: this.groupsPage, size: this.groupsSize });
    },
    isFeatureDisabledError(error: unknown) {
      const axiosError = error as AxiosError | undefined;
      const status = axiosError?.response?.status;
      return status === 404 || status === 403;
    }
  }
});
