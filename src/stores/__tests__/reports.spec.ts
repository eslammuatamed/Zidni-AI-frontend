import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

import api from '@/services/api';
import { useReportsStore, type ReportSummary } from '@/stores/reports';

const apiMock = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe('reports store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const buildReport = (overrides?: Partial<ReportSummary>): ReportSummary => ({
    id: overrides?.id ?? 1,
    type: overrides?.type ?? 'enrollment',
    format: overrides?.format ?? 'csv',
    status: overrides?.status ?? 'completed',
    startDate: overrides?.startDate ?? '2024-01-01',
    endDate: overrides?.endDate ?? '2024-01-31',
    deliverToEmail: overrides?.deliverToEmail ?? null,
    downloadUrl: overrides?.downloadUrl ?? '/static/report.csv',
    requestedAt: overrides?.requestedAt ?? '2024-01-01T00:00:00Z',
    completedAt: overrides?.completedAt ?? '2024-01-01T01:00:00Z',
    failureReason: overrides?.failureReason ?? null
  });

  it('loads reports and sorts by requested date', async () => {
    apiMock.get.mockResolvedValueOnce({
      data: [
        buildReport({ id: 2, requestedAt: '2024-01-02T00:00:00Z' }),
        buildReport({ id: 3, requestedAt: '2024-02-01T00:00:00Z' })
      ]
    });
    const store = useReportsStore();
    await store.fetchReports();
    expect(store.list).toHaveLength(2);
    expect(store.list[0].id).toBe(3);
  });

  it('appends newly requested reports', async () => {
    const store = useReportsStore();
    store.list = [buildReport({ id: 1, requestedAt: '2024-01-01T00:00:00Z' })];
    apiMock.post.mockResolvedValueOnce({
      data: buildReport({ id: 5, requestedAt: '2024-03-01T00:00:00Z' })
    });
    const created = await store.requestReport({ type: 'revenue', format: 'pdf', startDate: '2024-03-01', endDate: '2024-03-31' });
    expect(created.id).toBe(5);
    expect(store.list[0].id).toBe(5);
    expect(apiMock.post).toHaveBeenCalledWith('/v1/teacher/reports', {
      type: 'revenue',
      format: 'pdf',
      startDate: '2024-03-01',
      endDate: '2024-03-31'
    });
  });
});
