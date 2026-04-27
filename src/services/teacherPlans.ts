import api from '@/services/api';

export interface TeacherPlanMarketingContent {
  tagline: string | null;
  bestFor: string | null;
  includes: string[];
}

export interface TeacherPlanPricing {
  code: string;
  name: string | null;
  description: string | null;
  amountMinor: number | null;
  currency: string | null;
  formattedAmount: string | null;
  marketingCopy?: Record<string, TeacherPlanMarketingContent> | null;
}

export interface TeacherPricingResponse {
  country: string | null;
  currency: string | null;
  plans: TeacherPlanPricing[];
  availablePaymentMethods: string[];
}

const COUNTRY_QUERY_PARAM = 'country';
const COUNTRY_HEADER_NAME = (import.meta.env.VITE_COUNTRY_HEADER ?? 'X-Country').trim() || 'X-Country';
const DEFAULT_PRICING_COUNTRY = 'EG';
const TARGET_CURRENCY = 'EGP';

export async function fetchTeacherPricing(countryOverride?: string | null): Promise<TeacherPricingResponse> {
  void countryOverride;

  const config = {
    params: {
      [COUNTRY_QUERY_PARAM]: DEFAULT_PRICING_COUNTRY
    },
    headers: {
      [COUNTRY_HEADER_NAME]: DEFAULT_PRICING_COUNTRY
    }
  };

  const { data } = await api.get<TeacherPricingResponse>('/public/pricing', config);

  return {
    country: DEFAULT_PRICING_COUNTRY,
    currency: TARGET_CURRENCY,
    plans: data.plans.map((plan) => {
      const amountMinor = typeof plan.amountMinor === 'number' ? plan.amountMinor : null;
      const formattedAmount =
        amountMinor !== null
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: TARGET_CURRENCY,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(amountMinor / 100)
          : plan.formattedAmount;

      return {
        ...plan,
        currency: TARGET_CURRENCY,
        formattedAmount
      };
    }),
    availablePaymentMethods: data.availablePaymentMethods
  };
}

export function getPersistedTeacherPricingCountry(): string | null {
  return DEFAULT_PRICING_COUNTRY;
}
