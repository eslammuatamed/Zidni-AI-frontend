import { defineStore } from 'pinia';
import { isAxiosError } from 'axios';
import {
  createOffer,
  deleteOffer,
  getOffer,
  listOffers,
  updateOffer,
  type OfferFilters,
  type OfferPayload,
  type OfferResponse,
  type OfferStatus
} from '@/api/offers';

export type StatusFilter = OfferStatus | 'ALL';

interface OffersState {
  items: OfferResponse[];
  total: number;
  page: number;
  size: number;
  loading: boolean;
  error: string;
  featureEnabled: boolean;
  current: OfferResponse | null;
  currentLoading: boolean;
  currentError: string;
  filters: {
    q: string;
    status: StatusFilter;
    from: string | null;
    to: string | null;
  };
}

export const useOffersStore = defineStore('offers', {
  state: (): OffersState => ({
    items: [],
    total: 0,
    page: 0,
    size: 20,
    loading: false,
    error: '',
    featureEnabled: true,
    current: null,
    currentLoading: false,
    currentError: '',
    filters: {
      q: '',
      status: 'ALL',
      from: null,
      to: null
    }
  }),
  actions: {
    async fetch(filters: Partial<OfferFilters> = {}) {
      if (this.loading) return;
      this.loading = true;
      this.error = '';

      const merged: OfferFilters = {
        q: filters.q ?? this.filters.q ?? undefined,
        status: filters.status ?? this.filters.status,
        from: filters.from ?? this.filters.from ?? undefined,
        to: filters.to ?? this.filters.to ?? undefined,
        page: filters.page ?? this.page,
        size: filters.size ?? this.size
      };

      try {
        const page = await listOffers(merged);
        this.featureEnabled = true;
        this.items = page.items;
        this.total = page.total;
        this.page = page.page;
        this.size = page.size;
        this.filters.q = merged.q ?? '';
        this.filters.status = (merged.status ?? 'ALL') as StatusFilter;
        this.filters.from = merged.from ?? null;
        this.filters.to = merged.to ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.featureEnabled = false;
          this.items = [];
          this.total = 0;
          this.error = '';
        } else {
          this.error = 'LOAD_FAILED';
          throw error;
        }
      } finally {
        this.loading = false;
      }
    },
    async create(payload: OfferPayload & { code: string }) {
      const created = await createOffer(payload);
      await this.fetch({ page: 0 });
      this.current = created;
      return created;
    },
    async update(offerId: number, payload: OfferPayload) {
      const updated = await updateOffer(offerId, payload);
      this.items = this.items.map((item) => (item.id === updated.id ? updated : item));
      if (this.current && this.current.id === updated.id) {
        this.current = updated;
      }
      return updated;
    },
    async remove(offerId: number) {
      await deleteOffer(offerId);
      this.items = this.items.filter((item) => item.id !== offerId);
      this.total = Math.max(this.total - 1, 0);
      if (this.current && this.current.id === offerId) {
        this.current = null;
      }
    },
    clearCurrent() {
      this.current = null;
      this.currentError = '';
    },
    async load(offerId: number) {
      this.currentLoading = true;
      this.currentError = '';
      try {
        const offer = await getOffer(offerId);
        this.current = offer;
        return offer;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          this.currentError = 'NOT_FOUND';
        } else {
          this.currentError = 'LOAD_FAILED';
        }
        throw error;
      } finally {
        this.currentLoading = false;
      }
    }
  }
});
