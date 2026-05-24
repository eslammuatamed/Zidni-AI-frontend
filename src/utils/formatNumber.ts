/**
 * Number formatting utilities for the dashboard / analytics surface.
 *
 * Policy: numeric values always render in Latin digits (0-9) regardless of UI
 * locale. Dates remain locale-aware (Arabic month names etc.) — those use
 * Intl.DateTimeFormat at their respective call sites and are NOT covered here.
 */

export interface FormatNumberOptions {
  // Reserved for future extension (precision, separator overrides, etc.).
  // Current impl always uses 'en-US' Latin digits per dashboard policy.
}

export interface FormatPercentOptions {
  // Reserved for future extension (precision override).
  // Current impl rounds to nearest integer.
}

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

export function formatNumber(value: number, _options?: FormatNumberOptions): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  try {
    return NUMBER_FORMATTER.format(safeValue);
  } catch (error) {
    console.warn('[formatNumber] failed to format', error);
    return String(safeValue);
  }
}

export function formatPercent(value: number, _options?: FormatPercentOptions): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${Math.round(safeValue)}%`;
}
