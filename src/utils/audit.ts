interface UnknownRecord {
  [key: string]: unknown;
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const pickString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readPath = (source: UnknownRecord, path: string[]): string | null => {
  let current: unknown = source;
  for (const segment of path) {
    if (!isRecord(current)) {
      return null;
    }
    current = current[segment];
  }
  return pickString(current);
};

const DIRECT_KEYS = [
  'assistantName',
  'assistantFullName',
  'assistant_full_name',
  'assistant_name',
  'assistantDisplayName',
  'assistant_display_name',
  'actorName',
  'actor_name',
  'performedByName',
  'performed_by_name'
];

const NESTED_PATHS: string[][] = [
  ['assistant', 'name'],
  ['assistant', 'fullName'],
  ['assistant', 'displayName'],
  ['assistant', 'profile', 'name'],
  ['assistant', 'profile', 'fullName'],
  ['assistant', 'user', 'name'],
  ['assistant', 'user', 'fullName'],
  ['actor', 'name'],
  ['actor', 'fullName'],
  ['actor', 'displayName'],
  ['performedBy', 'name'],
  ['performedBy', 'fullName']
];

const NESTED_CONTAINERS = ['metadata', 'details', 'context', 'data'];

const searchObject = (source: UnknownRecord, depth = 0): string | null => {
  if (depth > 3) {
    return null;
  }

  for (const key of DIRECT_KEYS) {
    const direct = pickString(source[key]);
    if (direct) {
      return direct;
    }
  }

  for (const path of NESTED_PATHS) {
    const nested = readPath(source, path);
    if (nested) {
      return nested;
    }
  }

  for (const key of NESTED_CONTAINERS) {
    const container = source[key];
    if (isRecord(container)) {
      const nested = searchObject(container, depth + 1);
      if (nested) {
        return nested;
      }
    }
  }

  for (const value of Object.values(source)) {
    if (isRecord(value)) {
      const nested = searchObject(value, depth + 1);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};

export const extractAssistantNameFromPayload = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  return searchObject(payload);
};

export const isAssistantActor = (actorType?: string | null): boolean =>
  (actorType || '').toUpperCase() === 'TEACHER_ASSISTANT';
