import landingEn from '@/locales/landing.en.json';
import landingAr from '@/locales/landing.ar.json';

export const landingMessages = {
  en: {
    landing: landingEn
  },
  ar: {
    landing: landingAr
  }
} as const;

export type LandingMessageSchema = typeof landingEn;
