import api from '@/services/api';

export interface AdminPlanCountryPrice {
  country: string;
  currency: string | null;
  amountMinor: number;
  active: boolean;
  formattedAmount: string | null;
  stripePriceId: string | null;
  updatedAt: string | null;
}

export interface AdminPlanPricing {
  planCode: string;
  planName: string;
  prices: AdminPlanCountryPrice[];
}

export interface UpdateAdminPlanPricePayload {
  currency: string;
  amountMinor: number;
  active?: boolean;
  stripePriceId?: string | null;
}

export async function fetchAdminPlanPricing(): Promise<AdminPlanPricing[]> {
  const { data } = await api.get<AdminPlanPricing[]>('/api/v1/admin/plan-pricing');
  return data;
}

export async function fetchAdminPlanPricingByCode(planCode: string): Promise<AdminPlanPricing> {
  const { data } = await api.get<AdminPlanPricing>(`/api/v1/admin/plan-pricing/${encodeURIComponent(planCode)}`);
  return data;
}

export async function updateAdminPlanPrice(
  planCode: string,
  country: string,
  payload: UpdateAdminPlanPricePayload
): Promise<AdminPlanPricing> {
  const { data } = await api.put<AdminPlanPricing>(
    `/api/v1/admin/plan-pricing/${encodeURIComponent(planCode)}/${encodeURIComponent(country)}`,
    payload
  );
  return data;
}
