import api from '@/services/api';

export interface TeacherProfile {
  id: number;
  slug: string;
  name: string;
  subject?: string | null;
  phoneCountryCode: string;
  phoneNumber: string;
  plan: string;
  bio?: string | null;
  photoUrl?: string | null;
  active: boolean;
  verificationToken?: string | null;
}

export interface TeacherProfileDetail extends TeacherProfile {
  branding?: Record<string, unknown> | null;
  flags?: Record<string, unknown> | null;
  rating?: number | null;
  ratingCount?: number | null;
}

export interface TeacherUpdatePayload {
  name: string;
  subject?: string | null;
  phoneCountryCode?: string;
  phoneNumber?: string;
  bio?: string | null;
  photoUrl?: string | null;
  branding?: Record<string, unknown> | null;
  flags?: Record<string, unknown> | null;
}

export interface TeacherRegistrationPayload {
  slug?: string | null;
  name: string;
  subject?: string;
  plan?: string;
  phoneCountryCode: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export interface TeacherVerificationPayload {
  token: string;
}

export interface TeacherManualPaymentMethodForm {
  enabled: boolean;
  accountNumber?: string | null;
  iban?: string | null;
  accountHolderName?: string | null;
  bankName?: string | null;
  bankDetails?: string | null;
  instructionsAr?: string | null;
  instructionsEn?: string | null;
}

export interface TeacherManualPaymentCustomLinkForm {
  enabled: boolean;
  url?: string | null;
  instructionsAr?: string | null;
  instructionsEn?: string | null;
}

export interface TeacherManualPaymentSettingsPayload {
  bankTransfer: TeacherManualPaymentMethodForm;
  instaPay: TeacherManualPaymentMethodForm;
  vodafoneCash: TeacherManualPaymentMethodForm;
  customLink: TeacherManualPaymentCustomLinkForm;
}

export interface TeacherManualPaymentSettingsResponse {
  settings: TeacherManualPaymentSettingsPayload;
  updatedAt?: string | null;
}

export async function registerTeacher(payload: TeacherRegistrationPayload) {
  const { data } = await api.post<TeacherProfile>('/api/v1/public/teachers/register', {
    slug: payload.slug ?? null,
    name: payload.name,
    subject: payload.subject ?? null,
    plan: payload.plan ?? null,
    phoneCountryCode: payload.phoneCountryCode,
    phoneNumber: payload.phoneNumber,
    email: payload.email,
    password: payload.password
  });
  return data;
}

export async function verifyTeacher(payload: TeacherVerificationPayload) {
  const { data } = await api.post<TeacherProfile>('/api/v1/public/teachers/verify', payload);
  return data;
}

export async function isTeacherSlugAvailable(slug: string) {
  const { data } = await api.get<boolean>(`/api/v1/public/teachers/slug/${encodeURIComponent(slug)}/available`);
  return data;
}

export async function getCurrentTeacherProfile() {
  const { data } = await api.get<TeacherProfileDetail>('/api/v1/teacher/me');
  return data;
}

export async function updateCurrentTeacherProfile(payload: TeacherUpdatePayload) {
  const { data } = await api.put<TeacherProfileDetail>('/api/v1/teacher/me', payload);
  return data;
}

export async function uploadTeacherAvatar(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<{ url: string; key: string }>('/api/v1/teacher/me/avatar', formData);
  return data;
}


export async function getTeacherManualPaymentSettings() {
  const { data } = await api.get<TeacherManualPaymentSettingsResponse>('/api/v1/teacher/payments/manual-settings');
  return data;
}

export async function updateTeacherManualPaymentSettings(payload: TeacherManualPaymentSettingsPayload) {
  const { data } = await api.put<TeacherManualPaymentSettingsResponse>('/api/v1/teacher/payments/manual-settings', payload);
  return data;
}

