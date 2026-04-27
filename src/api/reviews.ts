import api from '@/services/api';

export interface CourseReview {
  id: number;
  courseId: number;
  studentId: number;
  studentName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface CourseReviewListResponse {
  items: CourseReview[];
  total: number;
  page: number;
  size: number;
  averageRating: number | null;
  reviewCount: number;
}

export interface CourseReviewFilters {
  page?: number;
  size?: number;
  tenantSlug?: string | null;
  preview?: boolean;
}

export interface SubmitCourseReviewPayload {
  rating: number;
  comment?: string | null;
}

export async function submitStudentCourseReview(courseId: number, payload: SubmitCourseReviewPayload) {
  const body: SubmitCourseReviewPayload = {
    rating: payload.rating,
    comment: payload.comment?.trim() ? payload.comment.trim() : undefined
  };
  const { data } = await api.post<CourseReview>(`/student/courses/${courseId}/reviews`, body);
  return data;
}

export async function fetchStudentCourseReview(courseId: number) {
  const { data } = await api.get<CourseReview>(`/student/courses/${courseId}/my-review`);
  return data;
}

export async function listCourseReviews(courseId: number, filters: CourseReviewFilters = {}) {
  const params: Record<string, unknown> = {
    page: filters.page ?? 0,
    size: filters.size ?? 5
  };

  if (typeof filters.preview === 'boolean') {
    params.preview = filters.preview ? 1 : 0;
  }

  const slug = filters.tenantSlug?.trim();
  const endpoint = slug
    ? `/public/tenants/${slug}/courses/${courseId}/reviews`
    : `/courses/${courseId}/reviews`;

  const { data } = await api.get<CourseReviewListResponse>(endpoint, { params });
  return data;
}

export default {
  submitStudentCourseReview,
  fetchStudentCourseReview,
  listCourseReviews
};
