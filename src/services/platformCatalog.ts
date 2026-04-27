import api from '@/services/api';

export interface PlatformTeacherSummary {
  id: number;
  slug: string;
  name: string;
  subject?: string;
  rating?: number;
  ratingCount?: number;
  branding?: Record<string, unknown>;
  photoUrl?: string;
  landingRoute: string;
}

export interface PlatformCourseTeacher {
  id: number;
  slug: string;
  name: string;
  rating?: number;
  ratingCount?: number;
}

export interface PlatformCourseSummary {
  id: number;
  title: string;
  type?: string;
  price?: number;
  level?: string;
  language?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  teacher: PlatformCourseTeacher;
  ctaRoute: string;
}

export interface PlatformCourseDetail extends PlatformCourseSummary {
  description?: string;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TeacherListParams {
  q?: string;
  subject?: string;
  language?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CourseListParams {
  q?: string;
  subject?: string;
  level?: string;
  language?: string;
  type?: string;
  priceMin?: number;
  priceMax?: number;
  teacherSlug?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export async function fetchPlatformTeachers(params: TeacherListParams) {
  const { data } = await api.get<PageResponse<PlatformTeacherSummary>>('/api/platform/catalog/teachers', {
    params
  });
  return data;
}

export async function fetchPlatformCourses(params: CourseListParams) {
  const { data } = await api.get<PageResponse<PlatformCourseSummary>>('/api/platform/catalog/courses', {
    params
  });
  return data;
}

export async function fetchPlatformCourseDetail(courseId: number) {
  const { data } = await api.get<PlatformCourseDetail>(`/api/platform/catalog/courses/${courseId}`);
  return data;
}
