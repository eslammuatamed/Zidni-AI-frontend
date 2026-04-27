import api from '@/services/api';
import axios from 'axios';

 
export interface TeacherLandingSectionStatistic {
  label?: string;
  value?: string;
}

export interface TeacherLandingSection {
  type?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  ctaAction?: string | null;
  imageUrl?: string;
  coverTheme?: string;
  quoteAuthor?: string;
  highlights?: string[];
  stats?: TeacherLandingSectionStatistic[];
}

export interface TeacherLandingCourse {
  id?: string | null;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  tags?: string[];
  price?: number | null;
  currency?: string | null;
  type?: string | null;
}

export interface TeacherLandingSocial {
  whatsapp?: string;
  telegram?: string;
  youtube?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  phone?: string;
}

export interface TeacherLandingFooterContact {
  whatsapp?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
}

export interface TeacherLandingSeo {
  title?: string;
  description?: string;
  ogImage?: string;
  image?: string;
}

export interface TeacherLandingTeacherInfo {
  id: number;
  slug: string;
  displayName?: string;
  headline?: string;
  bio?: string;
  photoUrl?: string | null;
  avatarUrl?: string;
  updatedAt?: string | null;
}

export interface TeacherLandingTestimonial {
  id: number;
  author: string;
  quote: string;
  locale?: string | null;
  position?: number | null;
}

export interface TeacherLandingPublicResponse {
  teacher: TeacherLandingTeacherInfo;

  template?: 'modern' | 'minimal' | 'classic';
  themePrimary?: string | null;
  themeSecondary?: string | null;
  footerContact?: TeacherLandingFooterContact | null;

  sections: TeacherLandingSection[];
  courses: TeacherLandingCourse[];
  social?: TeacherLandingSocial | null;
  seo?: TeacherLandingSeo | null;
  testimonials: TeacherLandingTestimonial[];
}

export interface TeacherLandingSettingsTeacherPayload {
  displayName?: string;
  headline?: string;
  bio?: string;
  photoUrl?: string | null;
  avatarUrl?: string;
}

export interface TeacherLandingSettingsRequest {
  teacher?: TeacherLandingSettingsTeacherPayload;

  template?: 'modern' | 'minimal' | 'classic';
  themePrimary?: string | null;
  themeSecondary?: string | null;
  footerContact?: TeacherLandingFooterContact | null;

  sections?: TeacherLandingSection[] | null;
  courses?: TeacherLandingCourse[] | null;
  social?: TeacherLandingSocial | null;
  seo?: TeacherLandingSeo | null;
}

export interface TeacherLandingSettingsResponse {
  teacher: TeacherLandingTeacherInfo;

  template?: 'modern' | 'minimal' | 'classic';
  themePrimary?: string | null;
  themeSecondary?: string | null;
  footerContact?: TeacherLandingFooterContact | null;

  sections: TeacherLandingSection[];
  courses: TeacherLandingCourse[];
  social?: TeacherLandingSocial | null;
  seo?: TeacherLandingSeo | null;
  updatedAt?: string | null;
}

export async function fetchPublicTeacherLanding(slug: string) {
  const { data } = await api.get<TeacherLandingPublicResponse>(`/public/v1/teachers/${slug}/landing`);

  return data;
}

export async function fetchPublicTeacherOffers(slug: string) {
  const { data } = await api.get(`/public/v1/teachers/${slug}/offers`);
  return data;
}

export async function fetchTeacherLandingSettings(teacherId: number) {
  const { data } = await api.get<TeacherLandingSettingsResponse>(`/v1/teachers/${teacherId}/landing-settings`);
  return data;
}

export async function updateTeacherLandingSettings(teacherId: number, payload: TeacherLandingSettingsRequest) {
  const { data } = await api.put<TeacherLandingSettingsResponse>(
    `/v1/teachers/${teacherId}/landing-settings`,
    payload
  );
  return data;
}

export async function uploadTeacherLandingImage(teacherId: number, file: File) {
  const buildFormData = () => {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  };

  try {
    const { data } = await api.post<{ url: string; key: string }>(
      `/v1/teachers/${teacherId}/landing-assets/image`,
      buildFormData()
    );
    return data;
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : null;
    if (status === 404) {
      const { data } = await api.post<{ url: string; key: string }>(
        '/v1/teacher/courses/content/upload-image',
        buildFormData()
      );
      return data;
    }
    throw error;
  }
}
