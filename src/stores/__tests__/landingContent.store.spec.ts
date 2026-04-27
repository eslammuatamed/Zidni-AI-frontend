import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLandingContentStore } from '../landingContent';
import type {
  FaqPayload,
  FaqResponse,
  TestimonialPayload,
  TestimonialResponse
} from '@/services/landingContent';

const listTestimonialsMock = vi.fn<Promise<TestimonialResponse[]>, []>();
const listFaqsMock = vi.fn<Promise<FaqResponse[]>, []>();
const createTestimonialMock = vi.fn<Promise<TestimonialResponse>, [TestimonialPayload]>();
const updateTestimonialMock = vi.fn<Promise<TestimonialResponse>, [number, TestimonialPayload]>();
const deleteTestimonialMock = vi.fn<Promise<void>, [number]>();
const createFaqMock = vi.fn<Promise<FaqResponse>, [FaqPayload]>();
const updateFaqMock = vi.fn<Promise<FaqResponse>, [number, FaqPayload]>();
const deleteFaqMock = vi.fn<Promise<void>, [number]>();

vi.mock('@/services/landingContent', () => ({
  listTestimonials: listTestimonialsMock,
  listFaqs: listFaqsMock,
  createTestimonial: createTestimonialMock,
  updateTestimonial: updateTestimonialMock,
  deleteTestimonial: deleteTestimonialMock,
  createFaq: createFaqMock,
  updateFaq: updateFaqMock,
  deleteFaq: deleteFaqMock
}));

describe('landing content store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    listTestimonialsMock.mockReset();
    listFaqsMock.mockReset();
    createTestimonialMock.mockReset();
    updateTestimonialMock.mockReset();
    deleteTestimonialMock.mockReset();
    createFaqMock.mockReset();
    updateFaqMock.mockReset();
    deleteFaqMock.mockReset();
  });

  it('fetches testimonials and faqs together', async () => {
    const store = useLandingContentStore();
    listTestimonialsMock.mockResolvedValue([
      { id: 1, author: 'Noor', quote: 'رائع', locale: 'ar', position: 1 }
    ]);
    listFaqsMock.mockResolvedValue([
      { id: 2, question: 'كيف؟', answer: 'بسهولة', locale: 'ar', position: 1 }
    ]);

    await store.fetchAll();

    expect(store.testimonials).toHaveLength(1);
    expect(store.faqs).toHaveLength(1);
    expect(store.loading).toBe(false);
    expect(store.error).toBe('');
  });

  it('creates testimonial and keeps list sorted', async () => {
    const store = useLandingContentStore();
    store.testimonials = [{ id: 1, author: 'Ali', quote: 'Nice', locale: 'ar', position: 2 }];
    const payload: TestimonialPayload = { author: 'Sara', quote: 'Awesome', locale: 'ar', position: 1 };
    const response: TestimonialResponse = { id: 2, author: 'Sara', quote: 'Awesome', locale: 'ar', position: 1 };
    createTestimonialMock.mockResolvedValue(response);

    await store.createTestimonial(payload);

    expect(store.testimonials[0].id).toBe(2);
    expect(store.testimonials[1].id).toBe(1);
  });

  it('updates faq and keeps order', async () => {
    const store = useLandingContentStore();
    store.faqs = [
      { id: 10, question: 'Q1', answer: 'A1', locale: 'ar', position: 1 },
      { id: 11, question: 'Q2', answer: 'A2', locale: 'ar', position: 2 }
    ];
    const payload: FaqPayload = { question: 'Q2 updated', answer: 'A2 updated', locale: 'ar', position: 3 };
    const response: FaqResponse = { id: 11, question: 'Q2 updated', answer: 'A2 updated', locale: 'ar', position: 3 };
    updateFaqMock.mockResolvedValue(response);

    await store.updateFaq(11, payload);

    expect(store.faqs[1].question).toBe('Q2 updated');
    expect(store.faqs[1].position).toBe(3);
  });

  it('deletes testimonial and faq', async () => {
    const store = useLandingContentStore();
    store.testimonials = [{ id: 5, author: 'Layla', quote: 'Great', locale: 'ar', position: 1 }];
    store.faqs = [{ id: 6, question: 'Q', answer: 'A', locale: 'ar', position: 1 }];

    deleteTestimonialMock.mockResolvedValue();
    deleteFaqMock.mockResolvedValue();

    await store.deleteTestimonial(5);
    await store.deleteFaq(6);

    expect(store.testimonials).toHaveLength(0);
    expect(store.faqs).toHaveLength(0);
  });
});
