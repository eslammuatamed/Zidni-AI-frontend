import { isAxiosError } from 'axios';
import { useToast } from '@/composables/useToast';

interface HandleApiErrorOptions {
  fallback?: string;
  useToast?: boolean;
  summary?: string;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Please double-check your request and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to complete that action.',
  404: 'We could not find what you were looking for.',
  409: 'Another update happened at the same time. Refresh and try again.',
  422: 'Some fields need your attention before we can continue.',
  429: 'We are receiving too many requests. Wait a moment and retry.',
  500: 'Something went wrong on our side. Please try again shortly.'
};

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

const sanitizeMessage = (value?: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const resolveApiErrorMessage = (error: unknown, fallback?: string): string => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status && STATUS_MESSAGES[status]) {
      return STATUS_MESSAGES[status];
    }

    const message =
      sanitizeMessage((error.response?.data as Record<string, unknown> | undefined)?.message) ??
      sanitizeMessage(error.response?.statusText);

    if (message) {
      return message;
    }
  }

  const nativeMessage =
    sanitizeMessage((error as { message?: string } | null | undefined)?.message) ?? sanitizeMessage(fallback);

  return nativeMessage ?? DEFAULT_MESSAGE;
};

export const handleApiError = (error: unknown, options: HandleApiErrorOptions = {}): string => {
  const message = resolveApiErrorMessage(error, options.fallback);

  if (options.useToast !== false) {
    try {
      const toast = useToast();
      toast.error({
        detail: message,
        summary: options.summary ?? 'Request failed'
      });
    } catch (toastError) {
      console.warn('[api-error] toast unavailable', toastError);
      console.warn('[api-error]', message, error);
    }
  }

  return message;
};

export default handleApiError;
