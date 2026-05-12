export const DEFAULT_CHECKOUT_CURRENCY = 'EGP';

export const normalizeCheckoutCurrency = (value?: string | null) => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
};

export const resolveCheckoutCurrency = (
  ...candidates: Array<string | null | undefined>
) => {
  for (const candidate of candidates) {
    const currency = normalizeCheckoutCurrency(candidate);
    if (currency) {
      return currency;
    }
  }
  return DEFAULT_CHECKOUT_CURRENCY;
};

export const formatCheckoutMoney = (
  amount: number | null | undefined,
  currency: string | null | undefined,
  locale: string
) => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '-';
  }

  const resolvedCurrency = resolveCheckoutCurrency(currency);
  const formatterLocale = locale === 'ar' ? 'ar' : 'en-US';

  try {
    return new Intl.NumberFormat(formatterLocale, {
      style: 'currency',
      currency: resolvedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    return `${resolvedCurrency} ${amount.toFixed(2)}`;
  }
};