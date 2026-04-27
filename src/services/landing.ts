import api from '@/services/api';

export interface LandingPageSummary {
  id: number;
  route: string;
  status: string;
  version: number;
  enabled: boolean;
  current: boolean;
  updatedAt?: string;
  publishedAt?: string;
  sectionCount: number;
}

export interface LandingPageDetail extends LandingPageSummary {
  seo: Record<string, unknown>;
  layout: Record<string, unknown>;
  createdAt?: string;
  sections: LandingSection[];
  assets: LandingAsset[];
}

export interface LandingSection {
  id: number | null;
  kind: string;
  position: number;
  data: Record<string, unknown>;
}

export interface LandingAsset {
  id: number | null;
  kind: string;
  url: string;
  alt?: string;
  metadata?: Record<string, unknown>;
}

export interface LandingAssetCreatePayload {
  kind: string;
  url: string;
  alt?: string;
  metadata?: Record<string, unknown>;
}

export interface LandingAssetUpdatePayload {
  kind?: string;
  url?: string;
  alt?: string;
  metadata?: Record<string, unknown>;
}

export interface LandingOfferCourseRef {
  id: number;
  title: string;
}

export interface LandingOffer {
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED' | 'BUNDLE';
  applicability: 'ALL_COURSES' | 'SPECIFIC_COURSES';
  percentage?: number;
  amount?: number;
  bundlePrice?: number;
  validFrom?: string;
  validUntil?: string;
  courses?: LandingOfferCourseRef[];
}

export interface LandingTestimonial {
  id: number;
  author: string;
  quote: string;
  locale?: string;
  position: number;
}

export interface LandingFaq {
  id: number;
  question: string;
  answer: string;
  locale?: string;
  position: number;
}

export interface LandingListResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreatePagePayload {
  route: string;
  enabled?: boolean;
  seo?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  copyFromCurrent?: boolean;
  sections?: Array<{ kind: string; position?: number; data?: Record<string, unknown> }>;
}

export interface UpdatePagePayload {
  enabled?: boolean;
  seo?: Record<string, unknown>;
  layout?: Record<string, unknown>;
}

export interface UpdateSectionPayload {
  position?: number;
  data?: Record<string, unknown>;
}

export async function listPages(params: {
  route?: string;
  status?: string;
  page?: number;
  size?: number;
  sort?: string;
}) {
  const { data } = await api.get<LandingListResponse<LandingPageSummary>>('/api/v1/landing/pages', { params });
  return data;
}

export async function createPage(payload: CreatePagePayload) {
  const { data } = await api.post<LandingPageDetail>('/api/v1/landing/pages', payload);
  return data;
}

export async function getPage(pageId: number) {
  const { data } = await api.get<LandingPageDetail>(`/api/v1/landing/pages/${pageId}`);
  return data;
}

export async function updatePage(pageId: number, payload: UpdatePagePayload) {
  const { data } = await api.put<LandingPageDetail>(`/api/v1/landing/pages/${pageId}`, payload);
  return data;
}

export async function deletePage(pageId: number) {
  await api.delete(`/api/v1/landing/pages/${pageId}`);
}

export async function addSection(pageId: number, payload: { kind: string; position?: number; data?: Record<string, unknown> }) {
  const { data } = await api.post(`/api/v1/landing/pages/${pageId}/sections`, payload);
  return data;
}

export async function updateSection(pageId: number, sectionId: number, payload: UpdateSectionPayload) {
  const { data } = await api.put(`/api/v1/landing/pages/${pageId}/sections/${sectionId}`, payload);
  return data;
}

export async function deleteSection(pageId: number, sectionId: number) {
  await api.delete(`/api/v1/landing/pages/${pageId}/sections/${sectionId}`);
}

export async function publishPage(pageId: number) {
  const { data } = await api.post(`/api/v1/landing/pages/${pageId}/publish`);
  return data;
}

export async function addAsset(pageId: number, payload: LandingAssetCreatePayload) {
  const { data } = await api.post<LandingAsset>(`/api/v1/landing/pages/${pageId}/assets`, payload);
  return data;
}

export async function updateAsset(pageId: number, assetId: number, payload: LandingAssetUpdatePayload) {
  const { data } = await api.put<LandingAsset>(`/api/v1/landing/pages/${pageId}/assets/${assetId}`, payload);
  return data;
}

export async function deleteAsset(pageId: number, assetId: number) {
  await api.delete(`/api/v1/landing/pages/${pageId}/assets/${assetId}`);
}

export interface PublicLandingResponse {
  slug: string;
  route: string;
  preview: boolean;
  branding?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  publishedAt?: string;
  sections: LandingSection[];
  assets: LandingAsset[];
  offers?: LandingOffer[];
  testimonials?: LandingTestimonial[];
  faqs?: LandingFaq[];
  courses?: Array<Record<string, unknown>>;
}

export async function fetchPublicLanding(slug: string, page: string, preview = false) {
  const { data } = await api.get<PublicLandingResponse>(`/public/tenant/${slug}/landing`, {
    params: {
      page,
      preview: preview ? 1 : 0
    }
  });
  return data;
}
