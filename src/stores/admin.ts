import { defineStore } from 'pinia';
import {
  addTeacherDomain,
  createTeacher,
  createTeacherAccount,
  deleteTeacher,
  deleteTeacherAccount,
  disableTeacherDevice,
  fetchBackups,
  fetchOverview,
  fetchTeacherDetail,
  fetchTeacherSummaries,
  listTeacherAccounts,
  listTeacherDevices,
  listTeacherDomains,
  recountTeacherDevices,
  removeTeacherDomain,
  sendTeacherAccountReset,
  TeacherAccountCredentialsPayload,
  TeacherAccount,
  TeacherAdmin,
  TeacherDeviceSummary,
  TeacherDomain,
  TeacherEntitlements,
  TeacherSummary,
  TeacherSummaryFilters,
  triggerBackup,
  updateTeacherAccount,
  updateTeacherAccountStatus,
  updateTeacherLifecycle,
  updateTeacherSlug,
  verifyTeacherDomain,
  CreateTeacherPayload,
  TeacherProfile,
  PlatformOverview,
  BackupJob
} from '@/services/admin';
import { parsePlanQuotaError, type PlanQuotaErrorDetails } from '@/utils/planQuota';

function normalizeTeacherFilters(filters?: TeacherSummaryFilters): TeacherSummaryFilters | undefined {
  if (!filters) {
    return undefined;
  }

  const normalized: TeacherSummaryFilters = {};
  if (filters.search && filters.search.trim().length > 0) {
    normalized.search = filters.search.trim();
  }
  if (filters.status) {
    normalized.status = filters.status;
  }
  if (filters.plan && filters.plan.trim().length > 0) {
    normalized.plan = filters.plan.trim();
  }

  return hasActiveFilters(normalized) ? normalized : undefined;
}

function hasActiveFilters(filters?: TeacherSummaryFilters): boolean {
  if (!filters) {
    return false;
  }
  return Boolean(
    (filters.search && filters.search.length > 0) ||
      filters.status ||
      (filters.plan && filters.plan.length > 0)
  );
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    teachers: [] as TeacherSummary[],
    teacherTotalCount: 0,
    selectedTeacher: null as TeacherAdmin | null,
    overview: null as PlatformOverview | null,
    backups: [] as BackupJob[],
    loadingTeachers: false,
    loadingTeacherDetail: false,
    loadingDevices: false,
    loadingAccounts: false,
    loadingOverview: false,
    loadingBackups: false,
    error: null as string | null,
    errorDetails: null as string | null,
    quotaDetails: null as PlanQuotaErrorDetails | null
  }),
  actions: {
    async loadTeachers(filters?: TeacherSummaryFilters) {
      this.loadingTeachers = true;
      this.error = null;
      this.errorDetails = null;
      this.quotaDetails = null;
      try {
        const normalizedFilters = normalizeTeacherFilters(filters);
        this.teachers = await fetchTeacherSummaries(normalizedFilters);
        if (!hasActiveFilters(normalizedFilters)) {
          this.teacherTotalCount = this.teachers.length;
        } else if (this.teacherTotalCount === 0) {
          this.teacherTotalCount = this.teachers.length;
        }
      } catch (error) {
        this.error = 'TEACHERS_LOAD_FAILED';
        throw error;
      } finally {
        this.loadingTeachers = false;
      }
    },
    async createTeacher(payload: CreateTeacherPayload) {
      this.error = null;
      this.errorDetails = null;
      try {
        const created = await createTeacher(payload);
        this.insertTeacherSummary(created);
        return created;
      } catch (error) {
        this.error = 'TEACHER_CREATE_FAILED';
        throw error;
      }
    },
    async deleteTeacher(id: number) {
      this.error = null;
      this.errorDetails = null;
      try {
        await deleteTeacher(id);
        this.teachers = this.teachers.filter((teacher) => teacher.id !== id);
        if (this.selectedTeacher?.id === id) {
          this.selectedTeacher = null;
        }
        if (this.teacherTotalCount > 0) {
          this.teacherTotalCount -= 1;
        }
      } catch (error) {
        this.error = 'TEACHER_DELETE_FAILED';
        throw error;
      }
    },
    async selectTeacher(id: number) {
      this.loadingTeacherDetail = true;
      this.error = null;
      this.errorDetails = null;
      this.quotaDetails = null;
      try {
        const detail = await fetchTeacherDetail(id);

        if (!detail.domains || detail.domains.length === 0) {
          detail.domains = await listTeacherDomains(id);
        }

        if (!detail.deviceSummary) {
          detail.deviceSummary = await listTeacherDevices(id);
        }

        if (!detail.accounts) {
          detail.accounts = await this.loadAccountsFor(id);
        }

        this.selectedTeacher = detail;
        this.updateSummary(detail);
      } catch (error) {
        this.error = 'TEACHER_DETAIL_FAILED';
        throw error;
      } finally {
        this.loadingTeacherDetail = false;
      }
    },
    async loadAccountsFor(teacherId: number) {
      this.loadingAccounts = true;
      try {
        return await listTeacherAccounts(teacherId);
      } finally {
        this.loadingAccounts = false;
      }
    },
    async updateTeacher(payload: {
      plan?: string;
      active?: boolean;
      entitlements?: TeacherEntitlements;
      name?: string;
      subject?: string;
      phoneCountryCode?: string;
      phoneNumber?: string;
      studentMultiDeviceLoginEnabled?: boolean;
      usageOverrides?: import('@/services/admin').TeacherUsageOverrides | null;
    }) {
      if (!this.selectedTeacher) {
        return;
      }

      this.loadingTeacherDetail = true;
      this.error = null;
      this.errorDetails = null;
      this.quotaDetails = null;

      try {
        const normalizedPayload = {
          ...payload,
          phoneCountryCode: payload.phoneCountryCode?.trim(),
          phoneNumber: payload.phoneNumber?.trim()
        } as typeof payload;
        if (!normalizedPayload.phoneCountryCode) {
          delete normalizedPayload.phoneCountryCode;
        }
        if (!normalizedPayload.phoneNumber) {
          delete normalizedPayload.phoneNumber;
        }
        const updated = await updateTeacherLifecycle(this.selectedTeacher.id, normalizedPayload);

        if (!updated.domains || updated.domains.length === 0) {
          updated.domains = this.selectedTeacher.domains;
        }

        if (!updated.deviceSummary) {
          updated.deviceSummary = this.selectedTeacher.deviceSummary;
        }

        if (!updated.accounts) {
          updated.accounts = this.selectedTeacher.accounts;
        }

        this.selectedTeacher = updated;
        this.updateSummary(updated);
      } catch (error) {
        const quotaError = parsePlanQuotaError(error);
        if (quotaError) {
          this.error = quotaError.code;
          this.errorDetails = quotaError.suggestion || quotaError.message;
          this.quotaDetails = quotaError;
          return;
        }
        this.error = 'TEACHER_UPDATE_FAILED';
        this.errorDetails = null;
        throw error;
      } finally {
        this.loadingTeacherDetail = false;
      }
    },
    async updateSlug(newSlug: string) {
      if (!this.selectedTeacher) {
        return;
      }

      this.loadingTeacherDetail = true;
      this.error = null;
      this.errorDetails = null;
      this.quotaDetails = null;

      try {
        const updated = await updateTeacherSlug(this.selectedTeacher.id, newSlug);

        if (!updated.domains || updated.domains.length === 0) {
          updated.domains = this.selectedTeacher.domains;
        }

        if (!updated.deviceSummary) {
          updated.deviceSummary = this.selectedTeacher.deviceSummary;
        }

        if (!updated.accounts) {
          updated.accounts = this.selectedTeacher.accounts;
        }

        this.selectedTeacher = updated;
        this.updateSummary(updated);
      } catch (error) {
        this.error = 'TEACHER_SLUG_FAILED';
        this.errorDetails = null;
        throw error;
      } finally {
        this.loadingTeacherDetail = false;
      }
    },
    async refreshDevices() {
      if (!this.selectedTeacher) {
        return;
      }

      this.loadingDevices = true;
      try {
        const summary = await recountTeacherDevices(this.selectedTeacher.id);
        this.selectedTeacher.deviceSummary = summary;
      } catch (error) {
        this.error = 'TEACHER_DEVICES_FAILED';
        throw error;
      } finally {
        this.loadingDevices = false;
      }
    },
    async disableDevice(deviceId: number) {
      if (!this.selectedTeacher) {
        return;
      }

      this.loadingDevices = true;
      try {
        const summary = await disableTeacherDevice(this.selectedTeacher.id, deviceId);
        this.selectedTeacher.deviceSummary = summary;
      } catch (error) {
        this.error = 'TEACHER_DEVICES_FAILED';
        throw error;
      } finally {
        this.loadingDevices = false;
      }
    },
    async addDomain(domain: string) {
      if (!this.selectedTeacher) {
        return;
      }
      const created = await addTeacherDomain(this.selectedTeacher.id, domain);
      this.selectedTeacher.domains = [...this.selectedTeacher.domains, created];
    },
    async verifyDomain(domainId: number, token: string) {
      if (!this.selectedTeacher) {
        return;
      }
      const verified = await verifyTeacherDomain(this.selectedTeacher.id, domainId, token);
      this.selectedTeacher.domains = this.selectedTeacher.domains.map((domain) =>
        domain.id === domainId ? verified : domain
      );
    },
    async removeDomain(domainId: number) {
      if (!this.selectedTeacher) {
        return;
      }
      await removeTeacherDomain(this.selectedTeacher.id, domainId);
      this.selectedTeacher.domains = this.selectedTeacher.domains.filter((domain) => domain.id !== domainId);
    },
    async updateAccount(accountId: number, enabled: boolean) {
      if (!this.selectedTeacher) {
        return;
      }
      const updated = await updateTeacherAccountStatus(this.selectedTeacher.id, accountId, enabled);
      this.applyAccountUpdate(updated);
    },
    async resetAccount(accountId: number) {
      if (!this.selectedTeacher) {
        return;
      }
      const updated = await sendTeacherAccountReset(this.selectedTeacher.id, accountId);
      this.applyAccountUpdate(updated);
    },
    async createTeacherAccount(payload: { email: string; password: string }) {
      if (!this.selectedTeacher) {
        return;
      }
      try {
        const account = await createTeacherAccount(this.selectedTeacher.id, payload);
        this.applyAccountUpdate(account);
      } catch (error) {
        this.error = 'TEACHER_ACCOUNT_CREATE_FAILED';
        throw error;
      }
    },
    async updateTeacherAccountCredentials(accountId: number, payload: TeacherAccountCredentialsPayload) {
      if (!this.selectedTeacher) {
        return;
      }
      try {
        const account = await updateTeacherAccount(this.selectedTeacher.id, accountId, payload);
        this.applyAccountUpdate(account);
      } catch (error) {
        this.error = 'TEACHER_ACCOUNT_UPDATE_FAILED';
        throw error;
      }
    },
    async deleteTeacherAccount(accountId: number) {
      if (!this.selectedTeacher) {
        return;
      }
      try {
        await deleteTeacherAccount(this.selectedTeacher.id, accountId);
        if (this.selectedTeacher.accounts) {
          this.selectedTeacher.accounts = this.selectedTeacher.accounts.filter((item) => item.id !== accountId);
        }
        if (this.selectedTeacher) {
          this.selectedTeacher.userAccountCount = Math.max(
            0,
            (this.selectedTeacher.accounts?.length ?? 0)
          );
        }
      } catch (error) {
        this.error = 'TEACHER_ACCOUNT_DELETE_FAILED';
        throw error;
      }
    },
    async refreshOverview() {
      this.loadingOverview = true;
      this.error = null;
      this.errorDetails = null;
      try {
        this.overview = await fetchOverview();
      } catch (error) {
        this.error = 'OVERVIEW_FAILED';
        this.errorDetails = null;
        throw error;
      } finally {
        this.loadingOverview = false;
      }
    },
    async refreshBackups(limit = 10) {
      this.loadingBackups = true;
      this.error = null;
      this.errorDetails = null;
      try {
        this.backups = await fetchBackups(limit);
      } catch (error) {
        this.error = 'BACKUPS_FAILED';
        this.errorDetails = null;
        throw error;
      } finally {
        this.loadingBackups = false;
      }
    },
    async runBackup(requestedBy?: string) {
      this.loadingBackups = true;
      try {
        const job = await triggerBackup(requestedBy);
        this.backups = [job, ...this.backups];
        await this.refreshOverview();
        return job;
      } finally {
        this.loadingBackups = false;
      }
    },
    updateSummary(detail: TeacherAdmin) {
      const summary: TeacherSummary = {
        id: detail.id,
        slug: detail.slug,
        name: detail.name,
        subject: detail.subject,
        plan: detail.plan,
        active: detail.active
      };
      const index = this.teachers.findIndex((teacher) => teacher.id === detail.id);
      if (index >= 0) {
        this.teachers.splice(index, 1, summary);
      } else {
        this.teachers.push(summary);
      }
      this.teacherTotalCount = Math.max(this.teacherTotalCount, this.teachers.length);
    },
    insertTeacherSummary(profile: TeacherProfile) {
      const summary: TeacherSummary = {
        id: profile.id,
        slug: profile.slug,
        name: profile.name,
        subject: profile.subject,
        plan: profile.plan,
        active: profile.active
      };
      this.teachers = [...this.teachers, summary];
      this.teacherTotalCount = Math.max(this.teacherTotalCount, this.teachers.length);
    },
    applyAccountUpdate(account: TeacherAccount) {
      if (!this.selectedTeacher) {
        return;
      }
      if (!this.selectedTeacher.accounts) {
        this.selectedTeacher.accounts = [];
      }
      const index = this.selectedTeacher.accounts.findIndex((item) => item.id === account.id);
      if (index >= 0) {
        this.selectedTeacher.accounts.splice(index, 1, account);
      } else {
        this.selectedTeacher.accounts = [...this.selectedTeacher.accounts, account];
      }
      this.selectedTeacher.userAccountCount = this.selectedTeacher.accounts.length;
    }
  }
});
