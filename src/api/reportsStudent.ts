import api from '@/services/api';

export interface StudentReportsSeriesPoint {
  period: string;
  value: number;
}

export interface StudentProgressSeriesResponse {
  bucket: 'week' | 'month' | string;
  points: StudentReportsSeriesPoint[];
}

export interface StudentEngagementSeriesResponse {
  metric: 'watchTime' | 'liveSeconds' | string;
  points: StudentReportsSeriesPoint[];
}

export interface StudentProgressSeriesParams {
  from?: string;
  to?: string;
  bucket?: 'week' | 'month';
}

export interface StudentEngagementSeriesParams {
  from?: string;
  to?: string;
  metric: 'watchTime' | 'liveSeconds';
}

export async function getProgressSeries(params: StudentProgressSeriesParams = {}) {
  const { data } = await api.get<StudentProgressSeriesResponse>('/student/reports/series/progress', {
    params
  });
  return data;
}

export async function getEngagementSeries(params: StudentEngagementSeriesParams) {
  const { data } = await api.get<StudentEngagementSeriesResponse>('/student/reports/series/engagement', {
    params
  });
  return data;
}

export default {
  getProgressSeries,
  getEngagementSeries
};
