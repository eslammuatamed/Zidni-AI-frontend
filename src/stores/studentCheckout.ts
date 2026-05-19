import { defineStore } from 'pinia';
import { validateOffer, type OfferValidationItem, type OfferValidationResponse } from '@/api/offers';

export interface CheckoutItem {
  courseId: number;
  qty: number;
  title?: string;
  price?: number;
  currency?: string | null;
  useModulePricing?: boolean;
}

export interface OfferValidationState extends OfferValidationResponse {
  code: string;
}

function toPayloadItems(items: CheckoutItem[]): OfferValidationItem[] {
  return items
    .filter((item) => item.courseId != null && item.qty > 0)
    .map((item) => ({ courseId: item.courseId, qty: item.qty }));
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    if (response?.data && typeof response.data === 'object' && 'message' in response.data) {
      const message = (response.data as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
    }
  }
  return 'UNKNOWN_ERROR';
}

export const useStudentCheckoutStore = defineStore('studentCheckout', {
  state: () => ({
    items: [] as CheckoutItem[],
    validation: null as OfferValidationState | null,
    loading: false,
    error: ''
  }),
  getters: {
    hasItems: (state) => state.items.length > 0
  },
  actions: {
    setItems(items: CheckoutItem[]) {
      this.items = items.filter((item) => item.courseId != null && item.qty > 0);
      this.validation = null;
      this.error = '';
    },
    clear() {
      this.items = [];
      this.validation = null;
      this.error = '';
    },
    clearValidation() {
      this.validation = null;
      this.error = '';
    },
    async applyCode(teacherSlug: string, rawCode: string): Promise<OfferValidationResponse | null> {
      const code = rawCode.trim();
      if (!code) {
        this.error = 'EMPTY_CODE';
        this.validation = null;
        return null;
      }
      const payloadItems = toPayloadItems(this.items);
      if (payloadItems.length === 0) {
        this.error = 'NO_ITEMS';
        this.validation = null;
        return null;
      }

      this.loading = true;
      this.error = '';
      try {
        const response = await validateOffer(teacherSlug, code, payloadItems);
        this.validation = { ...response, code };
        if (!response.valid) {
          this.error = response.message || 'INVALID_CODE';
        }
        return response;
      } catch (error) {
        this.validation = null;
        this.error = extractErrorMessage(error);
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
