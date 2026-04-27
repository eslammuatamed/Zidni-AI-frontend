import api from '@/services/api';

export interface TeacherVideoUsageSummary {
  planCode: string | null;
  planName: string | null;
  storageSecondsUsed: number;
  storageSecondsLimit: number | null;
  storageBytesUsed: number;
  storageBytesLimit: number | null;
  streamingMinutesUsed: number;
  streamingMinutesLimit: number | null;
  maxResolutionHeight: number | null;
  maxVideoDurationMinutes: number | null;
  resolutionPolicy: string | null;
  storageWarningPercent: number | null;
  storageCriticalPercent: number | null;
  streamingWarningPercent: number | null;
  streamingCriticalPercent: number | null;
  storageGraceDays: number | null;
  streamingGraceDays: number | null;
}

export interface TeacherUsageTrendPoint {
  month: string;
  storageSeconds: number;
  streamingMinutes: number;
}

export interface TeacherUsageTrendResponse {
  points: TeacherUsageTrendPoint[];
}

export async function fetchTeacherVideoUsageSummary() {
  const { data } = await api.get<TeacherVideoUsageSummary>('/api/v1/teacher/usage/video');
  return data;
}

export async function fetchTeacherUsageTrends(months = 6) {
  const { data } = await api.get<TeacherUsageTrendResponse>('/api/v1/teacher/usage/video/trends', {
    params: { months }
  });
  return data;
}
