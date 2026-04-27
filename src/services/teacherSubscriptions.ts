import api from '@/services/api';

const COUNTRY_HEADER_NAME = (import.meta.env.VITE_COUNTRY_HEADER ?? 'X-Country').trim() || 'X-Country';

const normalizeCountryCode = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim().toUpperCase();
  return trimmed || null;
};

type RequestOptions = {
  country?: string | null;
};

const buildRequestConfig = (options?: RequestOptions) => {
  const normalizedCountry = normalizeCountryCode(options?.country ?? null);
  if (!normalizedCountry) {
    return undefined;
  }
  return {
    headers: {
      [COUNTRY_HEADER_NAME]: normalizedCountry
    }
  } as const;
};

export interface VodafoneCashRequestPayload {
  planCode: string;
}

export interface VodafoneCashRequestResponse {
  paymentRequestId: number;
  invoiceNo: string;
  planCode: string;
  amountMinor: number;
  currency: string;
  walletNumber: string | null;
  instructionsAr: string | null;
  instructionsEn: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
}

export interface PaypalCreateOrderPayload {
  planCode: string;
  paypalOrderId?: string | null;
}

export interface PaypalCreateOrderResponse {
  paymentRequestId: number;
  planCode: string;
  amountMinor: number;
  currency: string;
  paypalAmountMinor: number | null;
  paypalCurrency: string | null;
  fxRateUsed: number | string | null;
  orderId: string;
  approveUrl: string;
}

export interface PaymobCreatePaymentResponse {
  iframeUrl: string;
  paymentRequestId: number;
  provider: string;
}

export interface SubscriptionView {
  id: number;
  planCode: string;
  country: string | null;
  currency: string | null;
  amountMinor: number;
  paymentMethod: string;
  status: string;
  startsAt: string;
  endsAt: string;
  cancelAt: string | null;
}

export interface TeacherSubscriptionSummary {
  currentSubscription: SubscriptionView | null;
  pendingRequests: PaymentRequestView[];
}

export interface PaymobPaymentStatusResponse {
  merchantOrderId: string | null;
  providerOrderId: string | null;
  status: string;
  amountCents: number | null;
  currency: string | null;
  transactionId: string | null;
  paidAt?: string | null;
}

export interface PaymentRequestView {
  id: number;
  invoiceNo: string | null;
  planCode: string;
  country: string | null;
  currency: string | null;
  amountMinor: number | null;
  amountUsdMinor: number | null;
  paypalCurrency: string | null;
  fxRateUsed: number | string | null;
  method: string;
  status: string;
  receiptUrl: string | null;
  transferReference: string | null;
  notes: string | null;
  paypalOrderId: string | null;
  payerEmail: string | null;
  captureId: string | null;
  captureStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createVodafonePaymentRequest(
  payload: VodafoneCashRequestPayload,
  options?: RequestOptions
): Promise<VodafoneCashRequestResponse> {
  const { data } = await api.post<VodafoneCashRequestResponse>(
    '/api/payments/vodafone/create-request',
    payload,
    buildRequestConfig(options)
  );
  return data;
}

export async function uploadVodafoneReceipt(payload: {
  paymentRequestId: number;
  file: File;
  transferReference?: string | null;
  notes?: string | null;
}): Promise<PaymentRequestView> {
  const formData = new FormData();
  formData.append('paymentRequestId', String(payload.paymentRequestId));
  formData.append('file', payload.file);
  if (payload.transferReference) {
    formData.append('transferReference', payload.transferReference);
  }
  if (payload.notes) {
    formData.append('notes', payload.notes);
  }

  const { data } = await api.post<PaymentRequestView>(
    '/api/payments/vodafone/upload-receipt',
    formData
  );
  return data;
}

export async function createPaypalOrder(
  payload: PaypalCreateOrderPayload,
  options?: RequestOptions
): Promise<PaypalCreateOrderResponse> {
  const { data } = await api.post<PaypalCreateOrderResponse>(
    '/api/payments/paypal/create-order',
    payload,
    buildRequestConfig(options)
  );
  return data;
}

export async function createPaymobPayment(
  payload: { planCode: string },
  options?: RequestOptions
): Promise<PaymobCreatePaymentResponse> {
  const { data } = await api.post<PaymobCreatePaymentResponse>(
    '/api/payments/paymob/create',
    payload,
    buildRequestConfig(options)
  );
  return data;
}

export async function fetchPaymobPaymentStatus(
  merchantOrderId: string,
  verificationParams?: Record<string, string | null | undefined>
): Promise<PaymobPaymentStatusResponse> {
  const params: Record<string, string> = { merchantOrderId };
  if (verificationParams) {
    for (const [key, value] of Object.entries(verificationParams)) {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          params[key] = trimmed;
        }
      }
    }
  }
  const { data } = await api.get<PaymobPaymentStatusResponse>('/api/payments/paymob/status', {
    params
  });
  return data;
}

export async function fetchTeacherSubscriptionSummary(): Promise<TeacherSubscriptionSummary> {
  const { data } = await api.get<TeacherSubscriptionSummary>('/api/teacher/subscriptions/current');
  return data;
}
