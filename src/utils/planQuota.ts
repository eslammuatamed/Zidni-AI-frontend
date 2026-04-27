import { isAxiosError } from 'axios';

export interface PlanQuotaErrorDetails {
  code: string;
  message: string;
  plan?: string;
  limit?: number;
  suggestion?: string;
}

export function parsePlanQuotaError(error: unknown): PlanQuotaErrorDetails | null {
  if (!isAxiosError(error) || !error.response?.data) {
    return null;
  }
  const data = error.response.data as {
    code?: string;
    message?: string;
    details?: { plan?: string; limitType?: string; limit?: number; suggestion?: string };
  };

  if (!data.code || typeof data.code !== 'string' || !data.code.startsWith('PLAN_QUOTA_')) {
    return null;
  }

  return {
    code: data.code,
    message: typeof data.message === 'string' ? data.message : data.code,
    plan: data.details?.plan,
    limit: typeof data.details?.limit === 'number' ? data.details.limit : undefined,
    suggestion: typeof data.details?.suggestion === 'string' ? data.details.suggestion : undefined
  };
}
