import api from '@/services/api';

export interface TestimonialPayload {
  author: string;
  quote: string;
  locale?: string;
  position?: number;
}

export interface FaqPayload {
  question: string;
  answer: string;
  locale?: string;
  position?: number;
}

export interface TestimonialResponse extends TestimonialPayload {
  id: number;
  position: number;
}

export interface FaqResponse extends FaqPayload {
  id: number;
  position: number;
}

export async function listTestimonials() {
  const { data } = await api.get<TestimonialResponse[]>('/v1/teacher/landing/content/testimonials');
  return data;
}

export async function createTestimonial(payload: TestimonialPayload) {
  const { data } = await api.post<TestimonialResponse>('/v1/teacher/landing/content/testimonials', payload);
  return data;
}

export async function updateTestimonial(id: number, payload: TestimonialPayload) {
  const { data } = await api.put<TestimonialResponse>(`/v1/teacher/landing/content/testimonials/${id}`, payload);
  return data;
}

export async function deleteTestimonial(id: number) {
  await api.delete(`/v1/teacher/landing/content/testimonials/${id}`);
}

export async function listFaqs() {
  const { data } = await api.get<FaqResponse[]>('/v1/teacher/landing/content/faqs');
  return data;
}

export async function createFaq(payload: FaqPayload) {
  const { data } = await api.post<FaqResponse>('/v1/teacher/landing/content/faqs', payload);
  return data;
}

export async function updateFaq(id: number, payload: FaqPayload) {
  const { data } = await api.put<FaqResponse>(`/v1/teacher/landing/content/faqs/${id}`, payload);
  return data;
}

export async function deleteFaq(id: number) {
  await api.delete(`/v1/teacher/landing/content/faqs/${id}`);
}
