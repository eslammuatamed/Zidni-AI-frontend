import { defineStore } from 'pinia';
import type {
  ManualPaymentPayload,
  ManualPaymentView,
  EnrollmentView,
  StudentProfile,
  NotificationView,
  StudentVodafoneSettings
} from '@/services/student';
import {
  getStudentEnrollments,
  getStudentManualPayments,
  getStudentProfile,
  submitManualPayment,
  updateStudentProfile,
  getStudentNotifications,
  uploadPaymentProof,
  getStudentVodafoneSettings
} from '@/services/student';

export const useStudentStore = defineStore('student', {
  state: () => ({
    profile: null as StudentProfile | null,
    enrollments: [] as EnrollmentView[],
    payments: [] as ManualPaymentView[],
    notifications: [] as NotificationView[],
    vodafoneSettings: null as StudentVodafoneSettings | null,
    loading: false,
    error: ''
  }),
  actions: {
    async fetchProfile() {
      this.loading = true;
      try {
        this.profile = await getStudentProfile();
        return this.profile;
      } finally {
        this.loading = false;
      }
    },
    async updateProfile(payload: Partial<StudentProfile>) {
      this.profile = await updateStudentProfile(payload);
      return this.profile;
    },
    async fetchEnrollments() {
      this.enrollments = await getStudentEnrollments();
    },
    async fetchPayments() {
      this.payments = await getStudentManualPayments();
    },
    async fetchNotifications() {
      this.notifications = await getStudentNotifications();
    },
    async fetchVodafoneSettings() {
      const settings = await getStudentVodafoneSettings();
      this.vodafoneSettings = settings;
      return settings;
    },
    async submitPayment(payload: ManualPaymentPayload) {
      const payment = await submitManualPayment(payload);
      this.payments = [payment, ...this.payments];
      return payment;
    },
    async uploadProof(file: File) {
      return uploadPaymentProof(file);
    },
    clear() {
      this.profile = null;
      this.enrollments = [];
      this.payments = [];
      this.notifications = [];
      this.vodafoneSettings = null;
      this.error = '';
    }
  }
});
