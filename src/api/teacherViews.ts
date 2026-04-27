import api from '@/services/api';

export interface TeacherCourseViewSummary {
  courseId: number;
  title: string;
  views: number;
}

export interface TeacherViewSummaryResponse {
  landingViews: number;
  profileViews: number;
  courseViews: number;
  totalViews: number;
  rangeStart: string;
  rangeEnd: string;
  topCourses: TeacherCourseViewSummary[];
}

export const getTeacherViewSummary = async (): Promise<TeacherViewSummaryResponse> => {
  const { data } = await api.get<TeacherViewSummaryResponse>('/api/v1/teacher/views/summary');
  return data;
};
