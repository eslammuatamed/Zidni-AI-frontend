import { defineStore } from 'pinia';
import api from '@/services/api';

export interface ReportSummary {
  id: number;
  type: 'enrollment' | 'revenue';
  format: 'csv' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startDate: string;
  endDate: string;
  deliverToEmail?: string | null;
  downloadUrl?: string | null;
  requestedAt: string;
  completedAt?: string | null;
  failureReason?: string | null;
}

export interface ReportRequestInput {
  type: 'enrollment' | 'revenue';
  format: 'csv' | 'pdf';
  startDate: string;
  endDate: string;
  deliverToEmail?: string | null;
}

interface State {
  list: ReportSummary[];
  loading: boolean;
  error: string;
}

export const useReportsStore = defineStore('reports', {
  state: (): State => ({
    list: [],
    loading: false,
    error: ''
  }),
  actions: {
    async fetchReports() {
      this.loading = true;
      this.error = '';
      try {
        const { data } = await api.get<ReportSummary[]>('/v1/teacher/reports');
  this.list = data.sort((a: { requestedAt: string }, b: { requestedAt: string }) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      } catch (error) {
        this.error = 'FETCH_FAILED';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async requestReport(payload: ReportRequestInput) {
      const { data } = await api.post<ReportSummary>('/v1/teacher/reports', payload);
      this.upsert(data);
      return data;
    },
    async refreshReport(reportId: number) {
      const { data } = await api.get<ReportSummary>(`/v1/teacher/reports/${reportId}`);
      this.upsert(data);
      return data;
    },
    upsert(report: ReportSummary) {
      const index = this.list.findIndex((item) => item.id === report.id);
      if (index >= 0) {
        this.list.splice(index, 1, report);
      } else {
        this.list.unshift(report);
      }
      this.list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    }
  }
});
