import api from '@/services/api';

export interface VideoStorageReconciliationStatus {
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  status: string | null;
  totalRows: number | null;
  teachersUpdated: number | null;
  errorMessage: string | null;
  updatedAt: string | null;
}

export interface VideoStorageSizeBackfillStatus {
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  status: string | null;
  processed: number | null;
  updated: number | null;
  skipped: number | null;
  errorMessage: string | null;
  updatedAt: string | null;
}

export interface VideoStorageSizeBackfillResponse {
  processed: number;
  updated: number;
  skipped: number;
  reconciled: boolean;
}

export async function fetchVideoStorageReconciliationStatus() {
  const { data } = await api.get<VideoStorageReconciliationStatus>('/api/v1/admin/video-usage/reconciliation');
  return data;
}

export async function fetchVideoStorageSizeBackfillStatus() {
  const { data } = await api.get<VideoStorageSizeBackfillStatus>('/api/v1/admin/video-usage/backfill-status');
  return data;
}

export async function triggerVideoStorageSizeBackfill(params?: {
  batchSize?: number;
  maxRecords?: number;
  reconcile?: boolean;
}) {
  const { data } = await api.post<VideoStorageSizeBackfillResponse>('/api/v1/admin/video-usage/backfill-size', null, {
    params: {
      batchSize: params?.batchSize ?? 200,
      maxRecords: params?.maxRecords ?? 2000,
      reconcile: params?.reconcile ?? false
    }
  });
  return data;
}
