import { isAxiosError } from 'axios';

export const getHttpStatus = (error: unknown): number | null => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    return typeof status === 'number' ? status : null;
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const candidate = (error as { status?: unknown }).status;
    if (typeof candidate === 'number') {
      return candidate;
    }
  }

  return null;
};

export const isAuthorizationError = (error: unknown): boolean => {
  const status = getHttpStatus(error);
  return status === 401 || status === 403;
};
