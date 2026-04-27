import api from '@/services/api';

export interface LandingInquiryPayload {
  name: string;
  email?: string;
  phone?: string;
  message: string;
  route?: string;
  teacherSlug?: string;
}

export interface LandingInquiry {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  message: string;
  teacherSlug?: string | null;
  teacherName?: string | null;
  route?: string | null;
  createdAt: string;
  readAt?: string | null;
}

export interface LandingInquiryPage {
  items: LandingInquiry[];
  total: number;
  page: number;
  size: number;
}

export interface LandingInquiryListParams {
  page?: number;
  size?: number;
}

export interface LandingInquiryUnreadCountResponse {
  unreadCount: number;
}

export async function submitLandingInquiry(payload: LandingInquiryPayload): Promise<void> {
  await api.post('/api/public/landing/inquiries', payload);
}

export async function fetchLandingInquiries(
  params: LandingInquiryListParams
): Promise<LandingInquiryPage> {
  const { data } = await api.get<LandingInquiryPage>('/api/v1/platform/landing/inquiries', {
    params
  });
  return data;
}

export async function fetchLandingInquiry(inquiryId: number): Promise<LandingInquiry> {
  const { data } = await api.get<LandingInquiry>(`/api/v1/platform/landing/inquiries/${inquiryId}`);
  return data;
}

export async function deleteLandingInquiry(inquiryId: number): Promise<void> {
  await api.delete(`/api/v1/platform/landing/inquiries/${inquiryId}`);
}

export async function fetchTeacherLandingInquiries(
  params: LandingInquiryListParams
): Promise<LandingInquiryPage> {
  const { data } = await api.get<LandingInquiryPage>('/api/v1/teacher/landing/inquiries', { params });
  return data;
}

export async function fetchTeacherLandingInquiry(inquiryId: number): Promise<LandingInquiry> {
  const { data } = await api.get<LandingInquiry>(`/api/v1/teacher/landing/inquiries/${inquiryId}`);
  return data;
}

export async function fetchTeacherLandingInquiryUnreadCount(): Promise<LandingInquiryUnreadCountResponse> {
  const { data } = await api.get<LandingInquiryUnreadCountResponse>(
    '/api/v1/teacher/landing/inquiries/unread-count'
  );
  return data;
}
