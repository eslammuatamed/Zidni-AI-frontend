import { effectScope, watch } from 'vue';
import { createI18n } from 'vue-i18n';
import ar from '@/locales/ar.json';
import en from '@/locales/en.json';

export type SupportedLocale = 'ar' | 'en';

export const LOCALE_STORAGE_KEY = 'sakai-preferred-locale';

type LocaleMessages = Record<string, unknown>;

const DEFAULT_LOCALE: SupportedLocale = 'ar';

const resolveStartingLocale = (): SupportedLocale => {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') {
      return stored;
    }

    const browserLanguage = window.navigator.language?.toLowerCase() ?? '';
    if (browserLanguage.startsWith('ar')) {
      return 'ar';
    }
  }

  return 'ar';
};

const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  // Fall back to English when Arabic keys are missing
  fallbackLocale: 'en',
  // Reduce noisy console warnings for missing/fallback keys
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    [DEFAULT_LOCALE]: ar,
    en
  }
});

const localeLoaders: Record<SupportedLocale, () => Promise<{ default: LocaleMessages }>> = {
  ar: async () => ({ default: ar as LocaleMessages }),
  en: () => import('@/locales/en.json')
};

const loadedLocales = new Set<SupportedLocale>([DEFAULT_LOCALE, 'en']);

export const loadLocaleMessages = async (locale: SupportedLocale): Promise<void> => {
  if (loadedLocales.has(locale)) {
    return;
  }

  const loader = localeLoaders[locale];
  if (!loader) {
    throw new Error(`Unsupported locale requested: ${locale}`);
  }

  const messages = await loader();
  i18n.global.setLocaleMessage(locale, messages.default);
  loadedLocales.add(locale);
};

effectScope().run(() => {
  watch(
    () => i18n.global.locale.value as SupportedLocale,
    (next) => {
      if (next === 'ar' || next === 'en') {
        void loadLocaleMessages(next);
      }
    },
    { immediate: true }
  );
});

export { resolveStartingLocale };

export default i18n;
