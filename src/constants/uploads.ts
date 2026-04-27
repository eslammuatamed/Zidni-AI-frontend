import { isAxiosError } from 'axios';

const DEFAULT_LESSON_UPLOAD_MAX_SIZE_MB = 1024;
const MEGABYTE_IN_BYTES = 1024 * 1024;

const coercePositiveNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
};

const bytesToMegabytes = (value: number) =>
  Math.max(1, Math.round(value / MEGABYTE_IN_BYTES));

const parseEnvUploadLimit = (): number | null => {
  const raw = import.meta.env?.VITE_LESSON_UPLOAD_MAX_SIZE_MB;
  return coercePositiveNumber(raw);
};

/**
 * Maximum lesson media upload size in megabytes.
 *
 * This mirrors the default Spring Boot multipart upload limit configured in
 * edtech/app/src/main/resources/application.yml via the
 * SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE environment variable and can be
 * overridden per environment via the VITE_LESSON_UPLOAD_MAX_SIZE_MB build
 * variable.
 */
export const LESSON_UPLOAD_MAX_SIZE_MB =
  parseEnvUploadLimit() ?? DEFAULT_LESSON_UPLOAD_MAX_SIZE_MB;

export const LESSON_UPLOAD_MAX_SIZE_BYTES = LESSON_UPLOAD_MAX_SIZE_MB * MEGABYTE_IN_BYTES;

const extractLimitFromString = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const mbMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:MB|MiB)/i);
  if (mbMatch) {
    const candidate = Number(mbMatch[1]);
    if (Number.isFinite(candidate) && candidate > 0) {
      return Math.round(candidate);
    }
  }

  const parenthesesMatches = [...trimmed.matchAll(/\((\d{4,})\)/g)];
  if (parenthesesMatches.length) {
    const numbers = parenthesesMatches
      .map((match) => Number(match[1]))
      .filter((num) => Number.isFinite(num) && num > 0);
    if (numbers.length) {
      return bytesToMegabytes(Math.min(...numbers));
    }
  }

  const numericMatches = [...trimmed.matchAll(/\b(\d{4,})\b/g)];
  if (numericMatches.length) {
    const numbers = numericMatches
      .map((match) => Number(match[1]))
      .filter((num) => Number.isFinite(num) && num > 0);
    if (numbers.length) {
      return bytesToMegabytes(Math.min(...numbers));
    }
  }

  return null;
};

const extractLimitFromHeaders = (headers: Record<string, unknown>): number | null => {
  const headerCandidates: Array<{ key: string; unit: 'mb' | 'bytes' }> = [
    { key: 'x-upload-limit-mb', unit: 'mb' },
    { key: 'x-upload-max-size-mb', unit: 'mb' },
    { key: 'x-max-upload-size-mb', unit: 'mb' },
    { key: 'x-upload-limit', unit: 'bytes' },
    { key: 'x-max-upload-size', unit: 'bytes' }
  ];

  for (const { key, unit } of headerCandidates) {
    const raw = headers[key];
    const candidate = coercePositiveNumber(raw);
    if (!candidate) {
      continue;
    }
    if (unit === 'mb') {
      return Math.round(candidate);
    }
    return bytesToMegabytes(candidate);
  }

  return null;
};

const extractLimitFromData = (data: unknown): number | null => {
  if (data === null || data === undefined) {
    return null;
  }

  if (typeof data === 'string') {
    return extractLimitFromString(data);
  }

  if (typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const dataCandidates: Array<{ key: string; unit: 'mb' | 'bytes' }> = [
      { key: 'maxFileSizeMb', unit: 'mb' },
      { key: 'maxUploadSizeMb', unit: 'mb' },
      { key: 'maxFileSize', unit: 'bytes' },
      { key: 'maxUploadSize', unit: 'bytes' },
      { key: 'limitMb', unit: 'mb' },
      { key: 'limit', unit: 'bytes' }
    ];

    for (const { key, unit } of dataCandidates) {
      if (key in record) {
        const candidate = coercePositiveNumber(record[key]);
        if (!candidate) {
          continue;
        }
        if (unit === 'mb') {
          return Math.round(candidate);
        }
        return bytesToMegabytes(candidate);
      }
    }

    if (typeof record.message === 'string') {
      const limit = extractLimitFromString(record.message);
      if (limit) {
        return limit;
      }
    }

    if (typeof record.error === 'string') {
      const limit = extractLimitFromString(record.error);
      if (limit) {
        return limit;
      }
    }
  }

  return null;
};

const extractLimitFromErrorObject = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const withMessage = error as { message?: unknown };
  if (typeof withMessage.message === 'string') {
    return extractLimitFromString(withMessage.message);
  }

  return null;
};

export const extractLessonUploadLimitMb = (error: unknown): number | null => {
  if (isAxiosError(error)) {
    const response = error.response;
    if (response) {
      const limitFromHeaders = extractLimitFromHeaders(
        (response.headers ?? {}) as Record<string, unknown>
      );
      if (limitFromHeaders) {
        return limitFromHeaders;
      }

      const limitFromData = extractLimitFromData(response.data);
      if (limitFromData) {
        return limitFromData;
      }

      if (typeof response.statusText === 'string') {
        const limit = extractLimitFromString(response.statusText);
        if (limit) {
          return limit;
        }
      }
    }
  }

  const limitFromErrorObject = extractLimitFromErrorObject(error);
  if (limitFromErrorObject) {
    return limitFromErrorObject;
  }

  if (error instanceof Error && error.message) {
    return extractLimitFromString(error.message);
  }

  return null;
};

export const resolveLessonUploadLimitMb = (limit?: number | null): number => {
  const candidate = coercePositiveNumber(limit);
  if (candidate) {
    return Math.round(candidate);
  }
  return LESSON_UPLOAD_MAX_SIZE_MB;
};
