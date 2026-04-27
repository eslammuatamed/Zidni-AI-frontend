import { defineStore } from 'pinia';
import {
  createFaq,
  deleteFaq,
  listFaqs,
  listTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  updateFaq,
  type FaqPayload,
  type FaqResponse,
  type TestimonialPayload,
  type TestimonialResponse
} from '@/services/landingContent';

export const useLandingContentStore = defineStore('landingContent', {
  state: () => ({
    testimonials: [] as TestimonialResponse[],
    faqs: [] as FaqResponse[],
    loading: false,
    error: ''
  }),
  actions: {
    async fetchAll() {
      this.loading = true;
      this.error = '';
      try {
        const [testimonials, faqs] = await Promise.all([listTestimonials(), listFaqs()]);
        this.testimonials = testimonials;
        this.faqs = faqs;
      } catch (error) {
        console.warn('Failed to load landing content', error);
        this.error = 'LOAD_FAILED';
      } finally {
        this.loading = false;
      }
    },
    async createTestimonial(payload: TestimonialPayload) {
      const created = await createTestimonial(payload);
      this.testimonials = [...this.testimonials, created].sort((a, b) => a.position - b.position);
      return created;
    },
    async updateTestimonial(id: number, payload: TestimonialPayload) {
      const updated = await updateTestimonial(id, payload);
      this.testimonials = this.testimonials
        .map((item) => (item.id === id ? updated : item))
        .sort((a, b) => a.position - b.position);
      return updated;
    },
    async deleteTestimonial(id: number) {
      await deleteTestimonial(id);
      this.testimonials = this.testimonials.filter((item) => item.id !== id);
    },
    async createFaq(payload: FaqPayload) {
      const created = await createFaq(payload);
      this.faqs = [...this.faqs, created].sort((a, b) => a.position - b.position);
      return created;
    },
    async updateFaq(id: number, payload: FaqPayload) {
      const updated = await updateFaq(id, payload);
      this.faqs = this.faqs.map((item) => (item.id === id ? updated : item)).sort((a, b) => a.position - b.position);
      return updated;
    },
    async deleteFaq(id: number) {
      await deleteFaq(id);
      this.faqs = this.faqs.filter((item) => item.id !== id);
    }
  }
});
