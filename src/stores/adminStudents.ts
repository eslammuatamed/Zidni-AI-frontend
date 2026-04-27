import { defineStore } from 'pinia';
import {
  fetchAdminStudents,
  fetchAdminStudentDetail,
  updateAdminStudentStatus,
  disableAdminStudentDevice,
  enableAdminStudentDevice,
  resetAdminStudentDevice,
  upsertAdminStudentLink,
  removeAdminStudentLink,
  type AdminStudentDetail,
  type AdminStudentLinkPayload,
  type AdminStudentSummary,
  type StudentListParams
} from '@/services/adminStudents';
import { isAxiosError } from 'axios';

interface AdminStudentFilters {
  status: string;
  teacherId?: number;
  q: string;
}

function toErrorCode(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (message) {
      return String(message).toUpperCase();
    }
  }
  return fallback;
}

export const useAdminStudentsStore = defineStore('admin-students', {
  state: () => ({
    students: [] as AdminStudentSummary[],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    loading: false,
    loadingDetail: false,
    error: null as string | null,
    filters: { status: '', teacherId: undefined, q: '' } as AdminStudentFilters,
    selectedStudent: null as AdminStudentDetail | null
  }),
  actions: {
    async loadStudents(params?: StudentListParams) {
      this.loading = true;
      this.error = null;
      try {
        const nextFilters: AdminStudentFilters = {
          status: params?.status ?? this.filters.status,
          teacherId: params?.teacherId ?? this.filters.teacherId,
          q: params?.q ?? this.filters.q
        };
        const query: StudentListParams = {
          status: nextFilters.status || undefined,
          q: nextFilters.q || undefined,
          page: params?.page ?? this.page,
          size: params?.size ?? this.size
        };
        if (nextFilters.teacherId != null) {
          query.teacherId = nextFilters.teacherId;
        }
        const response = await fetchAdminStudents(query);
        this.students = response.items;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.filters.status = nextFilters.status;
        this.filters.teacherId = nextFilters.teacherId;
        this.filters.q = nextFilters.q;
      } catch (error) {
        this.error = toErrorCode(error, 'STUDENTS_LOAD_FAILED');
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async selectStudent(id: number) {
      this.loadingDetail = true;
      this.error = null;
      try {
        const detail = await fetchAdminStudentDetail(id);
        this.selectedStudent = detail;
        this.updateSummary(detail);
      } catch (error) {
        this.error = toErrorCode(error, 'STUDENT_DETAIL_FAILED');
        throw error;
      } finally {
        this.loadingDetail = false;
      }
    },
    async updateStatus(status: string) {
      if (!this.selectedStudent) return;
      this.loadingDetail = true;
      this.error = null;
      try {
        const detail = await updateAdminStudentStatus(this.selectedStudent.id, status);
        this.selectedStudent = detail;
        this.updateSummary(detail);
      } catch (error) {
        this.error = toErrorCode(error, 'STUDENT_STATUS_UPDATE_FAILED');
        throw error;
      } finally {
        this.loadingDetail = false;
      }
    },
    async disableDevice() {
      if (!this.selectedStudent) return;
      this.loadingDetail = true;
      this.error = null;
      try {
        const detail = await disableAdminStudentDevice(this.selectedStudent.id);
        this.selectedStudent = detail;
        this.updateSummary(detail);
      } catch (error) {
        this.error = toErrorCode(error, 'STUDENT_DEVICE_DISABLE_FAILED');
        throw error;
      } finally {
        this.loadingDetail = false;
      }
    },
    async enableDevice() {
      if (!this.selectedStudent) return;
      this.loadingDetail = true;
      this.error = null;
      try {
        const detail = await enableAdminStudentDevice(this.selectedStudent.id);
        this.selectedStudent = detail;
        this.updateSummary(detail);
      } catch (error) {
        this.error = toErrorCode(error, 'STUDENT_DEVICE_ENABLE_FAILED');
        throw error;
      } finally {
        this.loadingDetail = false;
      }
    },
    async resetDevice() {
      if (!this.selectedStudent) return;
      this.loadingDetail = true;
      this.error = null;
      try {
        const detail = await resetAdminStudentDevice(this.selectedStudent.id);
        this.selectedStudent = detail;
        this.updateSummary(detail);
      } catch (error) {
        this.error = toErrorCode(error, 'STUDENT_DEVICE_RESET_FAILED');
        throw error;
      } finally {
        this.loadingDetail = false;
      }
    },
    async upsertLink(payload: AdminStudentLinkPayload) {
      if (!this.selectedStudent) return;
      this.loadingDetail = true;
      this.error = null;
      try {
        const detail = await upsertAdminStudentLink(this.selectedStudent.id, payload);
        this.selectedStudent = detail;
        this.updateSummary(detail);
      } catch (error) {
        this.error = toErrorCode(error, 'STUDENT_LINK_UPDATE_FAILED');
        throw error;
      } finally {
        this.loadingDetail = false;
      }
    },
    async removeLink(teacherId: number) {
      if (!this.selectedStudent) return;
      this.loadingDetail = true;
      this.error = null;
      try {
        const detail = await removeAdminStudentLink(this.selectedStudent.id, teacherId);
        this.selectedStudent = detail;
        this.updateSummary(detail);
      } catch (error) {
        this.error = toErrorCode(error, 'STUDENT_LINK_REMOVE_FAILED');
        throw error;
      } finally {
        this.loadingDetail = false;
      }
    },
    resetFilters() {
      this.filters = { status: '', teacherId: undefined, q: '' };
      this.page = 0;
    },
    clearError() {
      this.error = null;
    },
    async changePage(page: number) {
      await this.loadStudents({ page });
    },
    async changeSize(size: number) {
      this.size = size;
      await this.loadStudents({ page: 0, size });
    },
    updateSummary(detail: AdminStudentDetail) {
      const index = this.students.findIndex((student) => student.id === detail.id);
      const summary: AdminStudentSummary = {
        id: detail.id,
        name: detail.name,
        email: detail.email,
        phone: detail.phone,
        status: detail.status,
        joinedAt: detail.joinedAt,
        verifiedAt: detail.verifiedAt,
        primaryTeacher: detail.primaryTeacher,
        linkCount: detail.linkCount,
        deviceRegistered: detail.deviceRegistered,
        deviceDisabled: detail.deviceDisabled,
        deviceLastSeen: detail.deviceLastSeen
      };
      if (index >= 0) {
        this.students.splice(index, 1, summary);
      }
      if (this.selectedStudent && this.selectedStudent.id === detail.id) {
        this.selectedStudent = detail;
      }
    }
  }
});
