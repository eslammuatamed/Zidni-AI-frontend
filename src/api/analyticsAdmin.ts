import api from '@/services/api';

export interface AdminAnalyticsOverviewResponse {
  totalTeachers: number;
  activeTeachers: number;
  totalStudents: number;
  activeStudents: number;
  totalRevenueManual: number;
  totalRevenueTutoring: number;
  avgRatingPlatform: number;
  liveSessionsCount: number;
  paymentsPending: number;
}

export interface AdminAnalyticsOverviewParams {
  from?: string;
  to?: string;
}

export interface AdminAnalyticsSeriesParams {
  from?: string;
  to?: string;
  bucket?: 'month';
}

export interface AdminAnalyticsTeacherSeriesPoint {
  month: string;
  totalTeachers: number;
  activeTeachers: number;
}

export interface AdminAnalyticsTeacherSeriesResponse {
  points: AdminAnalyticsTeacherSeriesPoint[];
}

export interface AdminAnalyticsStudentSeriesPoint {
  month: string;
  totalStudents: number;
  activeStudents: number;
}

export interface AdminAnalyticsStudentSeriesResponse {
  points: AdminAnalyticsStudentSeriesPoint[];
}

export interface AdminAnalyticsRevenueSeriesPoint {
  month: string;
  manualRevenue: number;
  tutoringRevenue: number;
}

export interface AdminAnalyticsRevenueSeriesResponse {
  points: AdminAnalyticsRevenueSeriesPoint[];
}

export type AdminReportType = 'enrollment' | 'revenue';
export type AdminReportFormat = 'csv' | 'pdf';

export interface AdminAnalyticsExportPayload {
  type: AdminReportType;
  format: AdminReportFormat;
  startDate: string;
  endDate: string;
  deliverToEmail?: string | null;
}

export interface AdminAnalyticsExportResponse {
  id: number;
  type: AdminReportType;
  format: AdminReportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startDate: string;
  endDate: string;
  deliverToEmail?: string | null;
  downloadUrl?: string | null;
  requestedAt: string;
  completedAt?: string | null;
  failureReason?: string | null;
}

export async function getOverview(params: AdminAnalyticsOverviewParams = {}) {
  const { data } = await api.get<AdminAnalyticsOverviewResponse>('/admin/analytics/overview', {
    params
  });
  return data;
}

export async function getTeacherSeries(params: AdminAnalyticsSeriesParams = {}) {
  const { data } = await api.get<AdminAnalyticsTeacherSeriesResponse>('/admin/analytics/series/teachers', {
    params
  });
  return data;
}

export async function getStudentSeries(params: AdminAnalyticsSeriesParams = {}) {
  const { data } = await api.get<AdminAnalyticsStudentSeriesResponse>('/admin/analytics/series/students', {
    params
  });
  return data;
}

export async function getRevenueSeries(params: AdminAnalyticsSeriesParams = {}) {
  const { data } = await api.get<AdminAnalyticsRevenueSeriesResponse>('/admin/analytics/series/revenue', {
    params
  });
  return data;
}

export async function requestAnalyticsExport(payload: AdminAnalyticsExportPayload) {
  const { data } = await api.post<AdminAnalyticsExportResponse>('/admin/analytics/export', payload);
  return data;
}

export async function getAnalyticsExport(id: number) {
  const { data } = await api.get<AdminAnalyticsExportResponse>(`/admin/analytics/export/${id}`);
  return data;
}

export default {
  getOverview,
  getTeacherSeries,
  getStudentSeries,
  getRevenueSeries,
  requestAnalyticsExport,
  getAnalyticsExport
};
