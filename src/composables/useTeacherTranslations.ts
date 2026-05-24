import { useI18n } from 'vue-i18n';

/**
 * Teacher dashboard translation helpers.
 *
 * `translateTeacher(key, fallback)` — return the i18n value if the key resolves
 *   under the current locale; otherwise return the inline fallback string.
 *
 * `translateTeacherWithParams(key, fallback, params)` — same, with the addition
 *   that an unresolved fallback string also gets manual substitution for the
 *   common placeholders `{value}`, `{months}`, `{label}`, `{percent}` so the
 *   user-visible text reads correctly even when the key is absent.
 *
 * Returns `t`, `te`, `locale` from `useI18n()` as well, so callers can use a
 * single composable invocation for everything they need from vue-i18n.
 */
export function useTeacherTranslations() {
  const { t, te, locale } = useI18n();

  const translateTeacher = (key: string, fallback: string): string =>
    te(key) ? t(key) : fallback;

  const translateTeacherWithParams = (
    key: string,
    fallback: string,
    params: Record<string, unknown>,
  ): string =>
    te(key)
      ? t(key, params)
      : fallback
          .replace('{value}', String(params.value ?? ''))
          .replace('{months}', String(params.months ?? ''))
          .replace('{label}', String(params.label ?? ''))
          .replace('{percent}', String(params.percent ?? ''));

  return { t, te, locale, translateTeacher, translateTeacherWithParams };
}
