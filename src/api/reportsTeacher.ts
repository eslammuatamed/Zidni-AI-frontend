import api from '@/services/api';

export interface TeacherReportsOverviewResponse {
  totalEnrollments: number;
  activeStudents: number;
  revenueManual: number;
  revenueTutoring: number;
  avgCourseRating: number;
  completionRate: number;
  paymentMethodCount: number;
}

export interface TeacherReportsOverviewParams {
  from?: string;
  to?: string;
}

export async function getOverview(params: TeacherReportsOverviewParams = {}) {
  const { data } = await api.get<TeacherReportsOverviewResponse>('/teacher/reports/overview', {
    params
  });
  return data;
}

export default {
  getOverview
};
