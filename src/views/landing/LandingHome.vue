<template>
  <div
    class="landing-home bg-white font-sans text-content"
    :dir="pageDirection"
    :lang="normalizedLocale"
  >
    <HomeNavBar />
    <main>
      <HomeHero />
      <HomePersonaCards />
      <HomeFormatsGrid />
      <HomeWhyZidni />
      <HomeAiFeatures />
      <HomeVisualFlow />
      <HomeRegionalReach />
      <HomeFinalCta />
      <HomeTestimonials />
      <HomeIntegrations />
      <HomeNewsletter />
    </main>
    <HomeFooter />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { LOCALE_STORAGE_KEY, type SupportedLocale } from '@/plugins/i18n';
import HomeNavBar from './sections/HomeNavBar.vue';
import HomeHero from './sections/HomeHero.vue';
import HomePersonaCards from './sections/HomePersonaCards.vue';
import HomeFormatsGrid from './sections/HomeFormatsGrid.vue';
import HomeWhyZidni from './sections/HomeWhyZidni.vue';
import HomeAiFeatures from './sections/HomeAiFeatures.vue';
import HomeVisualFlow from './sections/HomeVisualFlow.vue';
import HomeRegionalReach from './sections/HomeRegionalReach.vue';
import HomeFinalCta from './sections/HomeFinalCta.vue';
import HomeTestimonials from './sections/HomeTestimonials.vue';
import HomeIntegrations from './sections/HomeIntegrations.vue';
import HomeNewsletter from './sections/HomeNewsletter.vue';
import HomeFooter from './sections/HomeFooter.vue';

const { locale } = useI18n({ useScope: 'global' });

const normalizeLocale = (value: string): SupportedLocale =>
  value === 'en' ? 'en' : 'ar';

const normalizedLocale = computed(() => normalizeLocale(locale.value));
const pageDirection = computed(() =>
  normalizedLocale.value === 'ar' ? 'rtl' : 'ltr',
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
};

watch(
  normalizedLocale,
  (value) => {
    persistLocale(value);
    applyDocumentLanguage(value);
  },
  { immediate: true },
);
</script>
