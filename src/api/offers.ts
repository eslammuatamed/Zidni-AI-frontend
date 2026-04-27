import api from '@/services/api';

export type OfferStatus = 'CURRENT' | 'UPCOMING' | 'EXPIRED';
export type OfferType = 'PERCENTAGE' | 'FIXED' | 'BUNDLE';
export type OfferApplicability = 'ALL_COURSES' | 'SPECIFIC_COURSES';
export type OfferPublishMode = 'PUBLIC' | 'PRIVATE';

export interface OfferCourseSummary {
  id: number;
  title: string;
}

export interface OfferResponse {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  publishMode: OfferPublishMode;
  type: OfferType;
  applicability: OfferApplicability;
  percentage?: number | null;
  amount?: number | null;
  bundlePrice?: number | null;
  validFrom: string;
  validUntil?: string | null;
  status: OfferStatus;
  courses?: OfferCourseSummary[];
}

export interface OfferFilters {
  q?: string;
  status?: OfferStatus | 'ALL';
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface OfferPage {
  items: OfferResponse[];
  total: number;
  page: number;
  size: number;
}

export interface OfferPayload {
  name: string;
  description?: string;
  publishMode: OfferPublishMode;
  type: OfferType;
  applicability: OfferApplicability;
  percentage?: number;
  amount?: number;
  bundlePrice?: number;
  validFrom: string;
  validUntil?: string;
  courseIds?: number[];
}

export interface OfferValidationItem {
  courseId: number;
  qty: number;
}

export interface OfferValidationResponse {
  valid: boolean;
  type: string;
  currency: string;
  subtotal: number;
  discount: number;
  total: number;
  appliedCourses: number[];
  message?: string | null;
}

const buildFilters = (filters: OfferFilters) => {
  const params: Record<string, unknown> = {};
  if (filters.q) {
    params.q = filters.q;
  }
  if (filters.status && filters.status !== 'ALL') {
    params.status = filters.status;
  }
  if (filters.from) {
    params.from = filters.from;
  }
  if (filters.to) {
    params.to = filters.to;
  }
  if (typeof filters.page === 'number') {
    params.page = filters.page;
  }
  if (typeof filters.size === 'number') {
    params.size = filters.size;
  }
  return params;
};

export async function listOffers(filters: OfferFilters = {}) {
  const params = buildFilters(filters);
  const { data } = await api.get<OfferPage>('/teacher/offers', { params });
  return data;
}

export async function getOffer(offerId: number) {
  const { data } = await api.get<OfferResponse>(`/teacher/offers/${offerId}`);
  return data;
}

export async function createOffer(payload: OfferPayload & { code: string }) {
  const { data } = await api.post<OfferResponse>('/teacher/offers', payload);
  return data;
}

export async function updateOffer(offerId: number, payload: OfferPayload) {
  const { data } = await api.patch<OfferResponse>(`/teacher/offers/${offerId}`, payload);
  return data;
}

export async function deleteOffer(offerId: number) {
  await api.delete(`/teacher/offers/${offerId}`);
}

export async function validateOffer(
  teacherSlug: string,
  code: string,
  items: OfferValidationItem[]
) {
  const { data } = await api.post<OfferValidationResponse>('/public/offers/validate', {
    teacherSlug,
    code,
    items
  });
  return data;
}

export default {
  listOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  validateOffer
};
