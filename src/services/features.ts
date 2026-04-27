import api from '@/services/api';
import type { EntitlementKey, FeatureCode } from '@/constants/featureCatalog';

export interface ResolvedFeaturesResponse {
  features: Partial<Record<FeatureCode, boolean>>;
  plan: string;
  version: number;
  entitlements: Partial<Record<EntitlementKey, unknown>>;
  fallback?: boolean;
}

export async function fetchResolvedFeatures(): Promise<ResolvedFeaturesResponse> {
  const { data } = await api.get<ResolvedFeaturesResponse>('/api/v1/features');
  return data;
}
