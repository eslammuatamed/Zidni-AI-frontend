import { describe, it, expect } from 'vitest';
import i18n, { loadLocaleMessages } from '@/plugins/i18n';

describe('i18n configuration', () => {
  it('defaults to Arabic locale', () => {
    expect(i18n.global.locale.value).toBe('ar');
    expect(i18n.global.t('landing.cta')).toBe('سجل الآن');
  });

  it('lazily loads English locale on demand', async () => {
    await loadLocaleMessages('en');
    i18n.global.locale.value = 'en';
    expect(i18n.global.t('landing.cta')).toBe('Get Started');
  });
});
