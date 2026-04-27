<template>
  <div class="landing-home" :dir="pageDirection" :lang="locale">
    <a href="#contact" class="floating-cta cta-button">{{ floatingCtaLabel }}</a>

    <header ref="headerRef" class="landing-header sticky top-0 z-50">
      <div class="landing-header__inner">
        <div class="landing-header__brand">
          <img
            :src="brandLogoSrc"
            :alt="brandLogoLabel"
            class="landing-header__logo"
            decoding="async"
            loading="lazy"
          />
          <!-- <h1 class="landing-header__brand-name">{{ brandName }}</h1> -->
        </div>
        <button
          ref="navToggleRef"
          type="button"
          class="landing-header__toggle"
          :aria-expanded="isMenuOpen"
          :aria-label="navToggleLabel"
          aria-controls="landing-primary-navigation"
          @click="toggleMenu"
          @keydown="handleToggleKeydown"
        >
          <span class="sr-only">{{ navToggleLabel }}</span>
          <svg v-if="!isMenuOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M4 6.75A.75.75 0 0 1 4.75 6h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 6.75Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 12Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.75-.75Z"
            />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M6.22 5.22a.75.75 0 0 1 1.06 0L12 9.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 11l4.72 4.72a.75.75 0 0 1-1.06 1.06L12 12.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L10.94 11 6.22 6.28a.75.75 0 0 1 0-1.06Z"
            />
          </svg>
        </button>
        <nav
          ref="navRef"
          id="landing-primary-navigation"
          class="landing-header__nav"
          :class="{ 'landing-header__nav--open': isMenuOpen }"
          :aria-label="primaryNavLabel"
          @keydown="handleNavKeydown"
        >
          <ul class="landing-header__menu">
            <li class="landing-header__language-item">
              <button
                type="button"
                class="landing-header__language"
                :aria-label="languageToggleAria"
                @click="toggleLanguage"
              >
                <span aria-hidden="true">{{ languageToggleShortLabel }}</span>
                <span class="sr-only">{{ languageToggleAria }}</span>
              </button>
            </li>
            <li v-for="item in navItems" :key="item.href">
              <a
                :href="item.href"
                class="landing-header__link text-gray-600 hover:text-blue-600 font-medium"
                @click="handleNavLinkClick"
              >
                {{ item.label }}
              </a>
            </li>
            <li>
              <a
                :href="teacherLoginHref"
                class="landing-header__link text-gray-600 hover:text-blue-600 font-medium"
                @click="handleNavLinkClick"
              >
                {{ teacherLoginLabel }}
              </a>
            </li>
            <li v-if="teacherRegisterHref">
              <a
                :href="teacherRegisterHref"
                class="landing-header__link text-gray-600 hover:text-blue-600 font-medium"
                target="_blank"
                rel="noopener"
                @click="handleNavLinkClick"
              >
                {{ teacherRegisterLabel }}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main>
      <section id="home" class="hero-section text-white relative overflow-hidden">
        <div v-for="particle in heroParticles" :key="particle.id" class="particle" :style="particle.style" />
        <div class="container mx-auto px-4 text-center" data-aos="fade-up">
          <h2 class="text-5xl md:text-6xl font-bold mb-6 leading-tight">{{ heroTitle }}</h2>
          <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            {{ heroSubtitle }}
          </p>
          <div class="flex justify-center gap-6 flex-wrap">
            <a
              v-if="teacherRegisterHref"
              :href="teacherRegisterHref"
              class="bg-white text-blue-900 px-10 py-4 rounded-full font-semibold cta-button shadow-lg hero-primary-cta"
              target="_blank"
              rel="noopener"
            >
              {{ heroPrimaryCta }}
            </a>
            <a
              :href="teacherLoginHref"
              class="bg-transparent border-2 border-white text-white px-10 py-4 rounded-full font-semibold cta-button hover:bg-white hover:text-blue-900 hero-secondary-cta"
            >
              {{ heroSecondaryCta }}
            </a>
          </div>
        </div>
        <canvas ref="heroCanvas" class="hero-canvas" aria-hidden="true"></canvas>
      </section>

      <section id="features" class="py-24 bg-white">
        <div class="container mx-auto px-4">
          <h2 class="section-title text-4xl md:text-5xl font-bold text-center mb-12 text-gray-800" data-aos="fade-up">
            {{ featuresTitle }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article
              v-for="feature in features"
              :key="feature.title"
              class="bg-gray-50 p-8 rounded-2xl shadow-lg text-center feature-card"
              data-aos="fade-up"
              :data-aos-delay="feature.delay"
            >
              <div class="text-5xl mb-4" aria-hidden="true">{{ feature.icon }}</div>
              <h3 class="text-2xl font-semibold mb-4 text-blue-900">{{ feature.title }}</h3>
              <p class="text-gray-600">
                {{ feature.description }}
              </p>
            </article>
          </div>
        </div>
      </section>

      <section class="py-20 bg-gray-100">
        <div class="container mx-auto px-4">
          <h2 class="section-title text-4xl font-bold text-center mb-12 text-gray-800" data-aos="fade-up">
            {{ statsTitle }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article
              v-for="stat in stats"
              :key="stat.label"
              class="stats-box"
              data-aos="zoom-in"
              :data-aos-delay="stat.delay"
            >
              <h3 class="text-3xl font-bold">{{ stat.value }}</h3>
              <p class="text-lg">{{ stat.label }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="testimonials" class="py-20 bg-white">
        <div class="container mx-auto px-4">
          <h2 class="section-title text-4xl font-bold text-center mb-12 text-gray-800" data-aos="fade-up">
            {{ testimonialsTitle }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article
              v-for="testimonial in testimonials"
              :key="testimonial.author"
              class="bg-gray-50 p-8 rounded-2xl shadow-lg testimonial-card"
              data-aos="fade-up"
              :data-aos-delay="testimonial.delay"
            >
              <p class="text-gray-600 mb-4">"{{ testimonial.quote }}"</p>
              <p class="font-semibold text-blue-900">{{ testimonial.author }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="contact" class="py-20 bg-gray-100">
        <div class="container mx-auto px-4">
          <h2 class="section-title text-4xl font-bold text-center mb-12 text-gray-800" data-aos="fade-up">
            {{ contactTitle }}
          </h2>
          <div class="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-lg" data-aos="fade-up" data-aos-delay="100">
            <p class="text-center text-gray-600 mb-6">
              {{ contactIntro }}
            </p>
            <form class="space-y-6" @submit.prevent="handleSubmit">
              <div>
                <label for="contact-name" class="block text-gray-700 font-medium mb-2">
                  {{ contactFormLabels.name }}
                </label>
                <input
                  id="contact-name"
                  v-model="formName"
                  type="text"
                  class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                  :aria-label="contactFormLabels.name"
                  autocomplete="name"
                />
              </div>
              <div>
                <label for="contact-phone" class="block text-gray-700 font-medium mb-2">
                  {{ contactFormLabels.phone }}
                </label>
                <div class="flex flex-col gap-3 sm:flex-row">
                  <div class="sm:w-40">
                    <label for="contact-phone-country" class="sr-only">
                      {{ contactFormLabels.phoneCountryCode }}
                    </label>
                    <select
                      id="contact-phone-country"
                      v-model="formPhoneCountryCode"
                      class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      :aria-label="contactFormLabels.phoneCountryCode"
                    >
                      <option v-for="option in phoneCountryOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                  </div>
                  <div class="flex-1">
                    <input
                      id="contact-phone"
                      v-model="formPhone"
                      type="tel"
                      class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                      :aria-label="contactFormLabels.phone"
                      inputmode="tel"
                      autocomplete="tel"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label for="contact-email" class="block text-gray-700 font-medium mb-2">
                  {{ contactFormLabels.email }}
                </label>
                <input
                  id="contact-email"
                  v-model="formEmail"
                  type="email"
                  class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                  :aria-label="contactFormLabels.email"
                  autocomplete="email"
                />
              </div>
              <div>
                <label for="contact-message" class="block text-gray-700 font-medium mb-2">
                  {{ contactFormLabels.message }}
                </label>
                <textarea
                  id="contact-message"
                  v-model="formMessage"
                  rows="5"
                  class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                  :aria-label="contactFormLabels.message"
                ></textarea>
              </div>
              <button
                type="submit"
                class="w-full bg-blue-900 text-white px-6 py-3 rounded-full font-semibold cta-button hover:bg-blue-700 disabled:opacity-60"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? contactFormLabels.submitting : contactFormLabels.submit }}
              </button>
            </form>
          </div>

        </div>
      </section>
    </main>

    <footer class="bg-gray-800 text-white py-12">
      <div class="container mx-auto px-4">
        <div class="footer-social">
          <a
            href="https://www.linkedin.com/company/zidni-ai"
            class="text-white hover:text-blue-300"
            :aria-label="footerSocialLabels.linkedin"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M24 4.56v14.88A4.56 4.56 0 0 1 19.44 24H4.56A4.56 4.56 0 0 1 0 19.44V4.56A4.56 4.56 0 0 1 4.56 0h14.88A4.56 4.56 0 0 1 24 4.56zM8.8 18.4h2.4v-7.2h-2.4v7.2zm1.2-8.4a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm7.2 8.4h2.4v-4.08c0-2.16-1.44-3.6-3.36-3.6-1.44 0-2.64 1.2-3.12 2.4h-.24v-2.16h-2.4v7.44h2.4v-3.84c0-1.2.96-2.16 2.16-2.16 1.2 0 2.16.96 2.16 2.16V18.4z"
              />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/zidniai/"
            class="text-white hover:text-blue-300"
            :aria-label="footerSocialLabels.facebook"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2.04c-5.52 0-10 4.48-10 10 0 4.44 3.68 8.12 8.24 8.96v-6.32H7.56v-2.64h2.68V9.84c0-2.64 1.6-4.08 3.92-4.08 1.12 0 2.08.08 2.36.12v2.76h-1.6c-1.28 0-1.52.6-1.52 1.48v1.92h3.04l-.4 2.64h-2.64v6.32c4.56-.84 8.24-4.52 8.24-8.96 0-5.52-4.48-10-10-10z"
              />
            </svg>
          </a>
        </div>

        <div v-if="footerContacts.length" class="footer-layout">
          <div class="footer-contact-column">
            <article v-for="contact in footerContacts" :key="contact.key" class="footer-contact">
              <h3 class="footer-contact__name">{{ contact.name }}</h3>
              <ul class="footer-contact__list">
                <li class="footer-contact__name">
                  <span class="footer-contact__label">{{ footerPhoneLabel }}</span>
                  <a :href="contact.phoneHref" class="footer-link footer-contact__value">{{ contact.phone }}</a>
                </li>
                <li v-if="contact.email" class="footer-contact__name">
                  <span class="footer-contact__label">{{ footerEmailLabel }}</span>
                  <a :href="contact.emailHref" class="footer-link footer-contact__value">{{ contact.email }}</a>
                </li>
                <li class="footer-contact__name">
                  <span class="footer-contact__label">{{ footerAddressLabel }}</span>
                  <span class="footer-contact__value">{{ contact.address }}</span>
                </li>
              </ul>
            </article>
          </div>
          <aside class="footer-qr">
            <span class="footer-qr__banner">{{ footerQrTitle }}</span>
            <div class="footer-qr__image-wrapper">
              <img :src="footerQrSrc" :alt="footerQrAlt" class="footer-qr__image" />
            </div>
            <p class="footer-qr__hint">{{ footerQrHint }}</p>
          </aside>
        </div>

        <p class="footer-rights">{{ footerRights }}</p>

      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { landingMessages } from './messages';
import type { LandingMessageSchema } from './messages';
import { LOCALE_STORAGE_KEY, loadLocaleMessages, type SupportedLocale } from '@/plugins/i18n';
import { useToast } from '@/composables/useToast';
import { submitLandingInquiry } from '@/services/landingInquiries';
import { PHONE_COUNTRY_CODES } from '@/constants/countryCodes';
import { buildAppUrl } from '@/lib/host';
import { buildWhatsappHref, getTeacherRegistrationSettingsCached } from '@/api/registration';
import '@/styles/landing-tailwind.css';

type Testimonial = {
  quote: string;
  author: string;
  delay: number;
};

type StatCard = {
  value: string;
  label: string;
  delay: number;
};

type FeatureCard = {
  icon: string;
  title: string;
  description: string;
  delay: number;
};

type Particle = {
  id: string;
  style: Record<string, string>;
};

type Star = {
  x: number;
  y: number;
  size: number;
  speed: number;
};

declare global {
  interface Window {
    AOS?: { init: (options?: Record<string, unknown>) => void; refreshHard?: () => void };
  }
}

const { t, tm, locale } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages
});

const fallbackLanding = landingMessages.en.landing as LandingMessageSchema;
const toast = useToast();

const featureKeys = ['teachers', 'students', 'admins'] as const;
type FeatureKey = (typeof featureKeys)[number];
const featureIcons: Record<FeatureKey, string> = {
  teachers: '👩‍🏫',
  students: '🎓',
  admins: '🏫'
};

const statKeys = ['activeUsers', 'satisfaction', 'support'] as const;
type StatKey = (typeof statKeys)[number];

const testimonialKeys = ['ahmed', 'sara', 'khaled'] as const;
type TestimonialKey = (typeof testimonialKeys)[number];

const normalizeLocale = (value: string): SupportedLocale => (value === 'en' ? 'en' : 'ar');

const pageDirection = computed(() => (normalizeLocale(locale.value) === 'ar' ? 'rtl' : 'ltr'));

const brandName = computed(() => t('landing.zidniLanding.brandName'));
const brandLogoLabel = computed(() => t('landing.zidniLanding.aria.logo'));
// const brandLogoSrc = new URL('@/assets/logo.svg', import.meta.url).href;

const brandLogoSources: Record<SupportedLocale, string> = {
  ar: new URL('@/assets/logo.ar.svg', import.meta.url).href,
  en: new URL('@/assets/logo.en.svg', import.meta.url).href
};
const brandLogoSrc = computed(() => {
  const currentLocale = normalizeLocale(locale.value);
  return brandLogoSources[currentLocale] ?? brandLogoSources.en;
});
const floatingCtaLabel = computed(() => t('landing.zidniLanding.floatingCta'));

const heroTitle = computed(() => t('landing.zidniLanding.hero.title'));
const heroSubtitle = computed(() => t('landing.zidniLanding.hero.subtitle'));
const heroPrimaryCta = computed(() => t('landing.zidniLanding.hero.primaryCta'));
const heroSecondaryCta = computed(() => t('landing.zidniLanding.hero.secondaryCta'));

const navItems = computed(() => [
  { href: '#home', label: t('landing.zidniLanding.nav.home') },
  { href: '#features', label: t('landing.zidniLanding.nav.features') },
  { href: '#testimonials', label: t('landing.zidniLanding.nav.testimonials') },
  { href: '#contact', label: t('landing.zidniLanding.nav.contact') }
]);

const primaryNavLabel = computed(() => t('landing.zidniLanding.nav.primaryLabel'));
const teacherLoginLabel = computed(() => t('landing.zidniLanding.nav.teacherLogin'));
const teacherRegisterLabel = computed(() => t('landing.zidniLanding.nav.teacherRegister'));

const teacherLoginHref = computed(() => buildAppUrl('/teacher/login'));
const teacherRegisterHref = ref('');

const featuresTitle = computed(() => t('landing.zidniLanding.features.title'));
const features = computed<FeatureCard[]>(() => {
  const localized = tm('landing.zidniLanding.features.items') as
    | LandingMessageSchema['zidniLanding']['features']['items']
    | null;

  return featureKeys.map((key, index) => {
    const fallbackItem = fallbackLanding.zidniLanding.features.items[key];
    const content = localized?.[key] ?? fallbackItem;

    return {
      icon: featureIcons[key],
      title: content?.title ?? fallbackItem.title,
      description: content?.description ?? fallbackItem.description,
      delay: (index + 1) * 100
    } satisfies FeatureCard;
  });
});

const statsTitle = computed(() => t('landing.zidniLanding.stats.title'));
const stats = computed<StatCard[]>(() => {
  const localized = tm('landing.zidniLanding.stats.items') as
    | LandingMessageSchema['zidniLanding']['stats']['items']
    | null;

  return statKeys.map((key, index) => {
    const fallbackItem = fallbackLanding.zidniLanding.stats.items[key];
    const content = localized?.[key] ?? fallbackItem;

    return {
      value: content?.value ?? fallbackItem.value,
      label: content?.label ?? fallbackItem.label,
      delay: index * 120
    } satisfies StatCard;
  });
});

const testimonialsTitle = computed(() => t('landing.zidniLanding.testimonials.title'));
const testimonials = computed<Testimonial[]>(() => {
  const localized = tm('landing.zidniLanding.testimonials.items') as
    | LandingMessageSchema['zidniLanding']['testimonials']['items']
    | null;

  return testimonialKeys.map((key, index) => {
    const fallbackItem = fallbackLanding.zidniLanding.testimonials.items[key];
    const content = localized?.[key] ?? fallbackItem;

    return {
      quote: content?.quote ?? fallbackItem.quote,
      author: content?.author ?? fallbackItem.author,
      delay: 120 + index * 60
    } satisfies Testimonial;
  });
});

const contactTitle = computed(() => t('landing.zidniLanding.contact.title'));
const contactIntro = computed(() => t('landing.zidniLanding.contact.intro'));

const contactFormLabels = computed(() => ({
  name: t('landing.zidniLanding.contact.form.nameLabel'),
  phone: t('landing.zidniLanding.contact.form.phoneLabel'),
  phoneCountryCode: t('landing.zidniLanding.contact.form.phoneCountryCodeLabel'),
  email: t('landing.zidniLanding.contact.form.emailLabel'),
  message: t('landing.zidniLanding.contact.form.messageLabel'),
  submit: t('landing.zidniLanding.contact.form.submit'),
  submitting: t('landing.zidniLanding.contact.form.submitting')
}));

const contactMessages = computed(() => ({
  required: t('landing.zidniLanding.contact.messages.required'),
  invalidEmail: t('landing.zidniLanding.contact.messages.invalidEmail'),
  success: t('landing.zidniLanding.contact.messages.success'),
  error: t('landing.zidniLanding.contact.messages.error')
}));

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const footerContactKeys = ['uae', 'eg'] as const;
type FooterContactKey = (typeof footerContactKeys)[number];

type FooterContact = {
  key: FooterContactKey;
  name: string;
  phone: string;
  phoneHref: string;
  email: string;
  emailHref: string;
  address: string;
};

const sanitizeTelHref = (value: string) => {
  const normalized = value.replace(/[^+0-9]/g, '');
  return normalized ? `tel:${normalized}` : '#';
};

const sanitizeMailHref = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? `mailto:${trimmed}` : '#';
};

const footerPhoneLabel = computed(() => t('landing.zidniLanding.footer.phoneLabel'));
const footerEmailLabel = computed(() => t('landing.zidniLanding.footer.emailLabel'));
const footerAddressLabel = computed(() => t('landing.zidniLanding.footer.addressLabel'));
const footerContacts = computed<FooterContact[]>(() => {
  const localized = tm('landing.zidniLanding.footer.contacts') as
    | LandingMessageSchema['zidniLanding']['footer']['contacts']
    | null;
  const fallbackContacts = fallbackLanding.zidniLanding.footer.contacts;

  return footerContactKeys
    .map((key) => {
      const fallbackEntry = fallbackContacts?.[key];
      const localizedEntry = localized?.[key];

      const name = localizedEntry?.name ?? fallbackEntry?.name ?? '';
      const phone = localizedEntry?.phone ?? fallbackEntry?.phone ?? '';
      const email = localizedEntry?.email ?? fallbackEntry?.email ?? '';
      const address = localizedEntry?.address ?? fallbackEntry?.address ?? '';

      if (!name && !phone && !email && !address) {
        return null;
      }

      return {
        key,
        name,
        phone,
        phoneHref: sanitizeTelHref(phone),
        email,
        emailHref: sanitizeMailHref(email),
        address,
      } satisfies FooterContact;
    })
    .filter((entry): entry is FooterContact => entry !== null);
});
const currentYear = new Date().getFullYear();
const footerRights = computed(() =>
  locale.value === 'ar'
    ? '© 2025 Zidni AI. جميع الحقوق محفوظة.'
    : '© 2025 Zidni AI. All rights reserved.'
);
const footerSocialLabels = computed(() => ({
  linkedin: t('landing.zidniLanding.footer.social.linkedin'),
  facebook: t('landing.zidniLanding.footer.social.facebook'),
  twitter: t('landing.zidniLanding.footer.social.twitter')
}));
const footerQrTitle = computed(() => t('landing.zidniLanding.footer.qr.title'));
const footerQrHint = computed(() => t('landing.zidniLanding.footer.qr.hint'));
const footerQrAlt = computed(() => t('landing.zidniLanding.footer.qr.alt'));
const footerQrSrc = new URL('@/assets/qr-code.png', import.meta.url).href;

const languageToggleAria = computed(() =>
  normalizeLocale(locale.value) === 'ar'
    ? t('landing.zidniLanding.language.switchToEnglish')
    : t('landing.zidniLanding.language.switchToArabic')
);

const languageToggleShortLabel = computed(() =>
  normalizeLocale(locale.value) === 'ar'
    ? t('landing.zidniLanding.language.shortEnglish')
    : t('landing.zidniLanding.language.shortArabic')
);

const heroParticles: Particle[] = [
  { id: 'particle-1', style: { width: '2.5rem', height: '2.5rem', top: '2.5rem', left: '5rem' } },
  { id: 'particle-2', style: { width: '2rem', height: '2rem', top: '10rem', right: '7rem', animationDelay: '2s' } },
  {
    id: 'particle-3',
    style: { width: '3rem', height: '3rem', bottom: '4rem', left: '12rem', animationDelay: '4s' }
  }
];

const englishPhoneCountryLabels = fallbackLanding.phoneCountryCodes;
type PhoneCountryCodeMessageKey = keyof LandingMessageSchema['phoneCountryCodes'];

const phoneCountryOptions = computed(() => {
  const normalizedLocaleValue = normalizeLocale(locale.value);
  return PHONE_COUNTRY_CODES.map((option) => {
    const nameKey = option.nameKey.split('.').pop() as PhoneCountryCodeMessageKey | undefined;
    const englishLabel = nameKey ? englishPhoneCountryLabels?.[nameKey] : undefined;
    const localizedLabel = t(option.nameKey);
    const displayLabel = normalizedLocaleValue === 'en' ? englishLabel ?? localizedLabel : localizedLabel;
    return {
      value: option.value,
      label: `${option.value} · ${displayLabel}`
    };
  });
});

const localePhoneCountryDefaults: Record<SupportedLocale, string> = {
  ar: '+971',
  en: '+1'
};

const fallbackPhoneCountryCode = PHONE_COUNTRY_CODES[0]?.value ?? '';

const resolvedDefaultPhoneCountryCode = computed(() => {
  const normalized = normalizeLocale(locale.value);
  const preferred = localePhoneCountryDefaults[normalized];

  if (preferred && PHONE_COUNTRY_CODES.some((option) => option.value === preferred)) {
    return preferred;
  }

  return fallbackPhoneCountryCode;
});

const formName = ref('');
const formPhoneCountryCode = ref('');
const formPhone = ref('');
const formEmail = ref('');
const formMessage = ref('');
const isSubmitting = ref(false);

watch(
  resolvedDefaultPhoneCountryCode,
  (next) => {
    formPhoneCountryCode.value = next;
  },
  { immediate: true }
);

const headerRef = ref<HTMLElement | null>(null);
const navToggleRef = ref<HTMLButtonElement | null>(null);
const navRef = ref<HTMLElement | null>(null);
const isMenuOpen = ref(false);

const navToggleOpenLabel = computed(() => t('landing.zidniLanding.nav.openMenu'));
const navToggleCloseLabel = computed(() => t('landing.zidniLanding.nav.closeMenu'));
const navToggleLabel = computed(() =>
  isMenuOpen.value ? navToggleCloseLabel.value : navToggleOpenLabel.value
);

const persistLocale = (value: SupportedLocale) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
};

const applyDocumentLanguage = (lang: SupportedLocale) => {
  if (typeof document === 'undefined') {
    return;
  }
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  const body = document.body;
  if (body) {
    body.setAttribute('lang', lang);
    body.setAttribute('dir', dir);
    body.classList.toggle('landing-body-rtl', dir === 'rtl');
  }
};

const toggleLanguage = async () => {
  const current = normalizeLocale(locale.value);
  const next: SupportedLocale = current === 'ar' ? 'en' : 'ar';
  await loadLocaleMessages(next);
  locale.value = next;
};

watch(
  () => locale.value,
  (value) => {
    const normalized = normalizeLocale(value);
    persistLocale(normalized);
    applyDocumentLanguage(normalized);
  },
  { immediate: true }
);

const heroCanvas = ref<HTMLCanvasElement | null>(null);
let canvasContext: CanvasRenderingContext2D | null = null;
let stars: Star[] = [];
let animationFrameId = 0;
let resizeHandler: (() => void) | null = null;
let escapeHandler: ((event: KeyboardEvent) => void) | null = null;
let outsideClickHandler: ((event: MouseEvent) => void) | null = null;
const originalBodyOverflow = ref<string | null>(null);

const lockBodyScroll = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (originalBodyOverflow.value === null) {
    originalBodyOverflow.value = document.body.style.overflow || '';
  }

  document.body.style.overflow = 'hidden';
};

const restoreBodyScroll = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (originalBodyOverflow.value !== null) {
    document.body.style.overflow = originalBodyOverflow.value;
    originalBodyOverflow.value = null;
  }
};

const focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getNavFocusableItems = () => {
  const navElement = navRef.value;
  if (!navElement) {
    return [] as HTMLElement[];
  }

  return Array.from(navElement.querySelectorAll<HTMLElement>(focusableSelectors));
};

const focusFirstNavItem = () => {
  const [firstItem] = getNavFocusableItems();
  firstItem?.focus();
};

const closeMenu = (options: { focusToggle?: boolean } = {}) => {
  isMenuOpen.value = false;
  if (options.focusToggle) {
    void nextTick(() => {
      navToggleRef.value?.focus();
    });
  }
};

const toggleMenu = (event?: MouseEvent) => {
  event?.stopPropagation();
  if (isMenuOpen.value) {
    closeMenu({ focusToggle: true });
    if (event?.detail !== 0 && event?.currentTarget instanceof HTMLElement) {
      event.currentTarget.blur();
    }
    return;
  }

  isMenuOpen.value = true;
  void nextTick(() => {
    focusFirstNavItem();
  });
};

const handleNavLinkClick = () => {
  closeMenu();
};

const handleToggleKeydown = (event: KeyboardEvent) => {
  if (!isMenuOpen.value || event.key !== 'Tab' || event.shiftKey) {
    return;
  }

  const [firstItem] = getNavFocusableItems();
  if (firstItem) {
    event.preventDefault();
    firstItem.focus();
  }
};

const handleNavKeydown = (event: KeyboardEvent) => {
  if (!isMenuOpen.value || event.key !== 'Tab') {
    return;
  }

  const focusableItems = getNavFocusableItems();
  if (focusableItems.length === 0) {
    return;
  }

  const firstItem = focusableItems[0];
  const lastItem = focusableItems[focusableItems.length - 1];
  const activeElement = document.activeElement as HTMLElement | null;

  if (event.shiftKey) {
    if (activeElement === firstItem || !navRef.value?.contains(activeElement)) {
      event.preventDefault();
      navToggleRef.value?.focus();
    }
    return;
  }

  if (activeElement === lastItem) {
    event.preventDefault();
    navToggleRef.value?.focus();
  }
};

const ensureStylesheet = (id: string, href: string) =>
  new Promise<void>((resolve) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });

const ensureScript = (id: string, src: string) =>
  new Promise<void>((resolve) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });

const ensureAos = async () => {
  await ensureStylesheet('landing-aos-css', 'https://unpkg.com/aos@2.3.1/dist/aos.css');
  await ensureScript('landing-aos-js', 'https://unpkg.com/aos@2.3.1/dist/aos.js');
  window.AOS?.init({ duration: 800, once: true });
};

const createStar = (): Star => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  size: Math.random() * 1.8 + 0.4,
  speed: Math.random() * 0.4 + 0.1
});

const drawStars = () => {
  if (!canvasContext) {
    return;
  }
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvasContext.clearRect(0, 0, width, height);
  canvasContext.fillStyle = 'rgba(255, 255, 255, 0.75)';

  stars.forEach((star) => {
    canvasContext.beginPath();
    canvasContext.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    canvasContext.fill();
    star.y += star.speed;
    if (star.y > height) {
      star.y = -star.size;
      star.x = Math.random() * width;
    }
  });

  animationFrameId = window.requestAnimationFrame(drawStars);
};

const setupHeroCanvas = () => {
  if (!heroCanvas.value) {
    return;
  }
  const canvas = heroCanvas.value;
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }
  canvasContext = context;
  canvasContext.setTransform(1, 0, 0, 1, 0, 0);
  canvasContext.scale(dpr, dpr);
  stars = Array.from({ length: Math.max(200, Math.round(width / 5)) }, createStar);

  window.cancelAnimationFrame(animationFrameId);
  drawStars();
};

const submitContactForm = async () => {
  const name = formName.value.trim();
  const phoneCountryCode = formPhoneCountryCode.value.trim();
  const phoneNumber = formPhone.value.trim();
  const phone = phoneNumber ? `${phoneCountryCode} ${phoneNumber}`.trim() : '';
  const email = formEmail.value.trim();
  const message = formMessage.value.trim();

  if (!name || !phoneCountryCode || !phoneNumber || !email || !message) {
    toast.warning(contactMessages.value.required);
    return;
  }

  if (!emailPattern.test(email)) {
    toast.warning(contactMessages.value.invalidEmail);
    return;
  }

  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;

  try {
    const route =
      typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : undefined;

    await submitLandingInquiry({
      name,
      phone,
      email,
      message,
      route
    });

    toast.success(contactMessages.value.success);
    formName.value = '';
    formPhoneCountryCode.value = resolvedDefaultPhoneCountryCode.value;
    formPhone.value = '';
    formEmail.value = '';
    formMessage.value = '';
  } catch (error) {
    console.error('[landing] contact submission failed', error);
    toast.error(contactMessages.value.error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleSubmit = async () => {
  await submitContactForm();
};

onMounted(async () => {
  await ensureAos();
  await nextTick();
  window.AOS?.refreshHard?.();
  setupHeroCanvas();
  try {
    const settings = await getTeacherRegistrationSettingsCached();
    teacherRegisterHref.value = buildWhatsappHref(settings.whatsappNumber, t('landing.zidniLanding.nav.whatsappMessage'));
  } catch (error) {
    console.warn('[LandingHome] failed to load registration settings', error);
  }

  resizeHandler = () => {
    window.cancelAnimationFrame(animationFrameId);
    setupHeroCanvas();
    if (window.innerWidth > 960 && isMenuOpen.value) {
      closeMenu();
    }
  };
  window.addEventListener('resize', resizeHandler);

  escapeHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isMenuOpen.value) {
      event.preventDefault();
      closeMenu({ focusToggle: true });
    }
  };
  document.addEventListener('keydown', escapeHandler);

  outsideClickHandler = (event: MouseEvent) => {
    if (!isMenuOpen.value) {
      return;
    }

    const headerElement = headerRef.value;
    if (!headerElement) {
      return;
    }

    const eventPath = typeof event.composedPath === 'function' ? event.composedPath() : undefined;
    const clickInsideHeader = eventPath ? eventPath.includes(headerElement) : headerElement.contains(event.target as Node);

    if (!clickInsideHeader) {
      closeMenu();
    }
  };
  document.addEventListener('click', outsideClickHandler);
});

onBeforeUnmount(() => {
  window.cancelAnimationFrame(animationFrameId);
  canvasContext = null;
  stars = [];

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  if (escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }
  if (outsideClickHandler) {
    document.removeEventListener('click', outsideClickHandler);
    outsideClickHandler = null;
  }
  restoreBodyScroll();
});

watch(isMenuOpen, (open) => {
  if (open) {
    lockBodyScroll();
    return;
  }
  restoreBodyScroll();
});
</script>

<style scoped>
/* IBM Plex Sans Arabic is loaded globally */

:global(body) {
  font-family: var(--sakai-font-family-base);
  scroll-behavior: smooth;
  background-color: #f8fafc;
}

.landing-home {
  background-color: #f8fafc;
  color: #1f2937;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.container {
  width: min(1120px, 92%);
  margin: 0 auto;
}

.landing-header {
  width: 100%;
  height: var(--sakai-topbar-height);
  display: flex;
  align-items: center;
  padding: 0 var(--sakai-space-5);
  background: var(--sakai-surface-card);
  border-bottom: 0.0625rem solid var(--sakai-border-color);
  box-shadow: 0 0.0625rem 0 rgba(15, 23, 42, 0.04);
}

.landing-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  width: min(1120px, 100%);
  margin: 0 auto;
  height: 100%;
  padding-block: 0;
  padding-inline: var(--sakai-space-4);
}

.landing-header__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.landing-header__logo {
  height: min(6rem, calc((var(--sakai-topbar-height) * 2) - var(--sakai-space-2)));
  width: auto;
  object-fit: contain;
}

.landing-header__brand-name {
  margin: 0;
  font-size: clamp(1.25rem, 2.4vw, 1.75rem);
  font-weight: var(--sakai-font-weight-bold);
  color: var(--sakai-text-color);
}

.landing-header__toggle {
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  background: transparent;
  color: #1f2937;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.landing-header__toggle:hover,
.landing-header__toggle:focus-visible {
  border-color: rgba(30, 64, 175, 0.25);
  background-color: rgba(191, 219, 254, 0.4);
  outline: none;
}

.landing-header__toggle svg {
  width: 1.75rem;
  height: 1.75rem;
}

.landing-header__nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.landing-header__menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.landing-header__menu > li {
  list-style: none;
}

.landing-header__language-item {
  display: flex;
}

.landing-header__language {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  padding: 0.35rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(30, 64, 175, 0.15);
  background: rgba(191, 219, 254, 0.35);
  color: #1e3a8a;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.landing-header__language:hover,
.landing-header__language:focus-visible {
  background: rgba(59, 130, 246, 0.2);
  color: #1e3a8a;
  outline: none;
  box-shadow: 0 0 0 3px rgba(191, 219, 254, 0.6);
}

.landing-header__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.5rem;
  border-radius: 0.75rem;
  transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.landing-header__link:focus-visible {
  outline: 2px solid rgba(96, 165, 250, 0.75);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(191, 219, 254, 0.55);
}

.floating-cta {
  position: fixed;
  inset-block-end: 20px;
  inset-inline-start: 20px;
  z-index: 100;
  background: #1e3a8a;
  color: #ffffff;
  padding: 0.75rem 1.75rem;
  border-radius: 999px;
  font-weight: 600;
  box-shadow: 0 18px 32px rgba(30, 58, 138, 0.25);
  animation: float 3s ease-in-out infinite;
  text-decoration: none;
}

.landing-home[dir='rtl'] .floating-cta {
  inset-inline-start: auto;
  inset-inline-end: 20px;
}

.hero-section {
  background: linear-gradient(135deg, #1e3a8a 0%, #06b6d4 100%);
  min-height: 80vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 4rem 1rem;
}

.hero-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="40" fill="none" stroke="%23FFFFFF" stroke-width="2" stroke-dasharray="200 60" stroke-linecap="round" opacity="0.2"/%3E%3C/svg%3E')
    no-repeat center/cover;
  opacity: 0.2;
}

.hero-section h2,
.hero-section p {
  color: #ffffff;
}

.hero-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.28;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: float 10s infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.feature-card,
.testimonial-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover,
.feature-card:focus-within,
.testimonial-card:hover,
.testimonial-card:focus-within {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.05rem;
  line-height: 1.35;
  text-align: center;
  text-decoration: none;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease, border-color 0.3s ease;
}

.cta-button:hover,
.cta-button:focus-visible {
  transform: scale(1.05);
}

.hero-primary-cta {
  background-color: #ffffff;
  color: #0f1f52;
  border: 2px solid #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22);
}

.hero-primary-cta:hover,
.hero-primary-cta:focus-visible {
  color: #0f1f52;
  background-color: #eff6ff;
  border-color: #bfdbfe;
  outline: none;
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.25);
}

.hero-secondary-cta {
  border-width: 2px;
  border-color: rgba(255, 255, 255, 0.9);
  color: #ffffff;
  background: transparent;
}

.hero-secondary-cta:hover,
.hero-secondary-cta:focus-visible {
  color: #1e3a8a;
  background-color: #ffffff;
  border-color: #ffffff;
}

.stats-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  background: linear-gradient(45deg, #06b6d4, #1e3a8a);
  color: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 12px 24px rgba(30, 58, 138, 0.2);
}

.stats-box h3,
.stats-box p {
  color: #ffffff;
  margin: 0;
}

[dir='rtl'] .section-title {
  text-align: right;
}

[dir='rtl'] .stats-box {
  align-items: flex-end;
  text-align: right;
}



.footer-social {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.footer-layout {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  margin-top: 2.5rem;
}

.footer-contact-column {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.footer-contact {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
 
.footer-contact__name {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.footer-contact__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.footer-contact__item {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  color: #ffffff;
  font-size: 0.95rem;
    margin: 0;
}

.footer-contact__label {
  font-weight: 600;
  opacity: 0.8;
  letter-spacing: 0.01em;
  min-width: 4.25rem;
  
}

.footer-contact__value {
  font-weight: 500;
  color: #ffffff;
  line-height: 1.4;
  display: inline-flex;
  justify-content: flex-start;
}

.footer-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.75rem 1.5rem 1.5rem;
  border-radius: 1.5rem;
  background: #040404;
  border: 1px solid rgba(255, 255, 255, 0.12);
  text-align: center;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.28);
}

.footer-qr__banner {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0;
  color: #ffffff;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.footer-qr__image-wrapper {
  display: inline-flex;
  padding: 1rem;
  border-radius: 1rem;
  background: #ffffff;
}

.footer-qr__image {
  width: 180px;
  height: 180px;
  object-fit: contain;
}

.footer-qr__hint {
  font-size: 0.9rem;
  opacity: 0.85;
  margin: 0;
  color: #ffffff;
  line-height: 1.4;
}

@media (min-width: 768px) {
  .footer-layout {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }

  .footer-contact-column {
    flex: -4;
  }

  .footer-qr {
    max-width: 240px;
  }

  .landing-home[dir='rtl'] .footer-layout {
    flex-direction: row-reverse;
  }

  .landing-home[dir='rtl'] .footer-contact-column {
    order: 5;
  }

  .landing-home[dir='rtl'] .footer-qr {
    order: 1;
  }
}

.landing-home[dir='ltr'] .footer-contact__item {
  justify-content: flex-start;
  text-align: left;
}

.landing-home[dir='ltr'] .footer-contact__label {
  text-align: right;
}

.landing-home[dir='rtl'] .footer-contact-column {
  align-items: flex-end;
}

.landing-home[dir='rtl'] .footer-contact {
  align-items: flex-end;
}

.landing-home[dir='rtl'] .footer-contact__name {
  text-align: right;
  width: 100%;
}

.landing-home[dir='rtl'] .footer-contact__list {
  align-items: flex-end;
  direction: rtl;
}

.landing-home[dir='rtl'] .footer-contact__item {
  justify-content: flex-end;
  text-align: right;
  flex-direction: row;
}

.landing-home[dir='rtl'] .footer-contact__label,
.landing-home[dir='rtl'] .footer-contact__value {
  text-align: right;
}

.landing-home[dir='rtl'] .footer-contact__label {
  min-width: unset;
}

.landing-home[dir='rtl'] .footer-contact__value {
  direction: ltr;
  justify-content: flex-end;
}

.landing-home[dir='rtl'] .footer-qr__banner {
  letter-spacing: 0.05em;
}

.footer-rights {
  color: #ffffff;
  font-size: 0.95rem;
  margin-top: 1.5rem;
  text-align: center;
}

.footer-link {
  color: #60a5fa;
  text-decoration: none;
}

.footer-link:hover,
.footer-link:focus-visible {
  text-decoration: underline;
}

button[disabled] {
  cursor: not-allowed;
}


.landing-home footer p {
  color: #ffffff;
}

@media (max-width: 900px) {
  .floating-cta {
    inset-inline-start: 50%;
    transform: translateX(-50%);
  }

  .landing-home[dir='rtl'] .floating-cta {
    inset-inline-end: auto;
  }
}

@media (max-width: 768px) {
  .hero-section {
    min-height: 70vh;
  }
}

@media (max-width: 960px) {
  .landing-header__inner {
    position: relative;
    gap: 0.75rem;
  }

  .landing-header__toggle {
    display: inline-flex;
  }

  .landing-header__nav {
    position: absolute;
    top: calc(100% + 0.75rem);
    right: 0;
    left: 0;
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 1rem;
    background: #ffffff;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.15);
    border: 1px solid rgba(148, 163, 184, 0.22);
    transform: translateY(-0.75rem);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
    z-index: 25;
  }

  .landing-header__nav--open {
    display: flex;
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .landing-header__menu {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .landing-header__menu > li {
    width: 100%;
  }

  .landing-header__language {
    width: 100%;
    padding: 0.9rem 1rem;
    border-radius: 0.9rem;
    justify-content: center;
  }

  .landing-header__link {
    width: 100%;
    padding: 0.9rem 1rem;
    border-radius: 0.9rem;
    background: rgba(241, 245, 249, 0.95);
  }

  .landing-header__link:focus-visible {
    outline-offset: 3px;
  }
}

@media (max-width: 640px) {
  .landing-header__brand svg {
    width: 3rem;
    height: 3rem;
  }

  .landing-header__brand h1 {
    font-size: 1.75rem;
  }

  .landing-header__nav {
    max-height: calc(100vh - 6.5rem);
    overflow-y: auto;
  }

  .hero-section {
    padding: 3.25rem 1.25rem 4.5rem;
  }

  .hero-section h2 {
    font-size: 2.25rem;
  }

  .hero-section p {
    font-size: 1.05rem;
  }

  .floating-cta {
    inset-block-end: 16px;
    font-size: 0.9rem;
    padding: 0.6rem 1.35rem;
  }

  .hero-primary-cta,
  .hero-secondary-cta {
    width: 100%;
    max-width: 18rem;
    margin-inline: auto;
  }

  #features h2,
  #testimonials h2,
  #contact h2 {
    font-size: 2.1rem;
  }

  .feature-card,
  .testimonial-card {
    padding: 1.5rem;
  }

  .stats-box {
    max-width: 18rem;
    margin-inline: auto;
    padding: 1.25rem;
  }

  .footer-contact__name {
    font-size: 0.95rem;
  }

  .footer-contact__item {
    font-size: 0.9rem;
  }

  .footer-qr {
    padding: 1.5rem 1.25rem 1.25rem;
  }

  .footer-qr__image {
    width: 150px;
    height: 150px;
  }

  .footer-qr__banner {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .landing-header__nav {
    left: 0.5rem;
    right: 0.5rem;
  }

  .floating-cta {
    width: auto;
    inset-inline-start: 50%;
    transform: translateX(-50%);
    padding: 0.55rem 1.2rem;
    max-width: min(16rem, calc(100% - 2rem));
  }

  .hero-section {
    min-height: 60vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cta-button:hover,
  .cta-button:focus-visible {
    transform: none;
  }

  .floating-cta {
    animation: none;
  }
}
</style>
