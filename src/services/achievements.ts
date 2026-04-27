import api from './api';

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

export interface CertificateView {
  id: number;
  courseId: number;
  courseTitle: string;
  pdfUrl: string;
  qrCode: string;
  issuedAt: string;
}

export interface StudentBadgeView {
  id: number;
  name: string;
  iconUrl?: string;
  description?: string;
  earnedAt: string;
}

export interface LeaderboardEntryView {
  studentId: number;
  studentName: string;
  rank: number;
  points: number;
}

export interface LeaderboardSnapshot {
  period: LeaderboardPeriod;
  entries: LeaderboardEntryView[];
}

export interface StudentAchievementsPayload {
  certificates: CertificateView[];
  badges: StudentBadgeView[];
  leaderboard: LeaderboardSnapshot;
}

export async function fetchStudentAchievements(
  period: LeaderboardPeriod = 'alltime',
  limit = 10
): Promise<StudentAchievementsPayload> {
  const { data } = await api.get<StudentAchievementsPayload>('/v1/students/achievements', {
    params: { period, limit }
  });
  return data;
}
