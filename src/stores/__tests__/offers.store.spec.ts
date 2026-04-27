import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOffersStore } from '../offers';
import type { OfferPage, OfferPayload, OfferResponse } from '@/offers';

const listOffersMock = vi.fn<Promise<OfferPage>, any[]>();
const createOfferMock = vi.fn<Promise<OfferResponse>, [OfferPayload & { code: string }]>();
const updateOfferMock = vi.fn<Promise<OfferResponse>, [number, OfferPayload]>();
const deleteOfferMock = vi.fn<Promise<void>, [number]>();

vi.mock('@/api/offers', () => ({
  listOffers: listOffersMock,
  createOffer: createOfferMock,
  updateOffer: updateOfferMock,
  deleteOffer: deleteOfferMock
}));

describe('offers store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    listOffersMock.mockReset();
    createOfferMock.mockReset();
    updateOfferMock.mockReset();
    deleteOfferMock.mockReset();
  });

  it('loads offers from API', async () => {
    const store = useOffersStore();
    const sample: OfferResponse = {
      id: 1,
      code: 'SPRING',
      name: 'Spring Offer',
      description: 'Discount',
      publishMode: 'PUBLIC',
      type: 'PERCENTAGE',
      applicability: 'ALL_COURSES',
      percentage: 20,
      amount: null,
      bundlePrice: null,
      validFrom: new Date().toISOString(),
      validUntil: null,
      status: 'CURRENT',
      courses: []
    };
    listOffersMock.mockResolvedValue({ items: [sample], total: 1, page: 0, size: 20 });

    await store.fetch({ page: 0 });

    expect(store.items).toHaveLength(1);
    expect(store.items[0].code).toBe('SPRING');
    expect(store.page).toBe(0);
    expect(store.total).toBe(1);
    expect(store.loading).toBe(false);
  });

  it('creates offers and reloads first page', async () => {
    const store = useOffersStore();
    const basePayload: OfferPayload = {
      name: 'New Offer',
      description: 'Promo',
      publishMode: 'PUBLIC',
      type: 'PERCENTAGE',
      applicability: 'ALL_COURSES',
      percentage: 15,
      amount: undefined,
      bundlePrice: undefined,
      validFrom: new Date().toISOString(),
      validUntil: undefined,
      courseIds: undefined
    };
    const payload = { ...basePayload, code: 'NEW' };
    const response: OfferResponse = {
      id: 2,
      code: 'NEW',
      name: 'New Offer',
      description: 'Promo',
      publishMode: 'PUBLIC',
      type: 'PERCENTAGE',
      applicability: 'ALL_COURSES',
      percentage: 15,
      amount: null,
      bundlePrice: null,
      validFrom: basePayload.validFrom!,
      validUntil: null,
      status: 'UPCOMING',
      courses: []
    };
    createOfferMock.mockResolvedValue(response);
    listOffersMock.mockResolvedValue({ items: [response], total: 1, page: 0, size: 20 });

    await store.create(payload);

    expect(createOfferMock).toHaveBeenCalledWith(payload);
    expect(listOffersMock).toHaveBeenCalled();
    expect(store.items[0].id).toBe(2);
  });

  it('updates existing offers in place', async () => {
    const store = useOffersStore();
    store.items = [
      {
        id: 3,
        code: 'OLD',
        name: 'Old Offer',
        description: null,
        publishMode: 'PUBLIC',
        type: 'PERCENTAGE',
        applicability: 'ALL_COURSES',
        percentage: 5,
        amount: null,
        bundlePrice: null,
        validFrom: new Date().toISOString(),
        validUntil: null,
        status: 'CURRENT',
        courses: []
      }
    ];
    const updated: OfferResponse = { ...store.items[0], name: 'Updated Offer', percentage: 25 };
    updateOfferMock.mockResolvedValue(updated);

    await store.update(3, {
      name: 'Updated Offer',
      description: null,
      publishMode: 'PUBLIC',
      type: 'PERCENTAGE',
      applicability: 'ALL_COURSES',
      percentage: 25,
      amount: undefined,
      bundlePrice: undefined,
      validFrom: store.items[0].validFrom,
      validUntil: undefined,
      courseIds: undefined
    });

    expect(store.items[0].name).toBe('Updated Offer');
    expect(store.items[0].percentage).toBe(25);
  });

  it('removes offers locally', async () => {
    const store = useOffersStore();
    store.items = [
      {
        id: 5,
        code: 'REMOVE',
        name: 'Remove me',
        description: null,
        publishMode: 'PUBLIC',
        type: 'PERCENTAGE',
        applicability: 'ALL_COURSES',
        percentage: 10,
        amount: null,
        bundlePrice: null,
        validFrom: new Date().toISOString(),
        validUntil: null,
        status: 'CURRENT',
        courses: []
      }
    ];
    store.total = 1;

    deleteOfferMock.mockResolvedValue();
    await store.remove(5);

    expect(deleteOfferMock).toHaveBeenCalledWith(5);
    expect(store.items).toHaveLength(0);
    expect(store.total).toBe(0);
  });
});
