<template>
  <section
    id="home"
    class="home-hero scroll-mt-[72px] flex flex-col items-center gap-12 bg-white px-4 py-12 sm:px-6 lg:gap-[104px] lg:px-20 lg:py-20"
  >
    <div
      class="home-hero__intro flex w-full max-w-[1280px] flex-col items-center justify-center gap-10 lg:gap-16"
    >
      <div
        class="home-hero__copy flex w-full flex-col items-center gap-6 text-center"
      >
        <h1
          class="m-0 max-w-[1100px] text-3xl font-extrabold uppercase leading-tight text-sakai-primary sm:text-4xl lg:text-5xl lg:leading-[1.25]"
        >
          {{ t('landing.home.hero.title') }}
        </h1>
        <p
          class="m-0 max-w-[900px] text-base font-medium leading-[1.6] text-content-secondary sm:text-lg lg:text-xl"
        >
          {{ t('landing.home.hero.subtitle') }}
        </p>
      </div>

      <div
        class="home-hero__actions flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
      >
        <a
          :href="primaryCtaHref"
          :target="primaryCtaExternal ? '_blank' : undefined"
          :rel="primaryCtaExternal ? 'noopener' : undefined"
          class="home-hero__cta-primary inline-flex h-12 w-full items-center justify-center rounded-lg bg-sakai-primary px-6 text-base font-semibold text-white no-underline shadow-[0_10px_15px_rgb(165_243_252_/_0.2),0_4px_3px_rgb(165_243_252_/_0.6)] transition-opacity hover:opacity-90 sm:w-auto"
        >
          {{ t('landing.home.hero.primaryCta') }}
        </a>
        <!-- No demo video exists yet — links to the "How it works" flow section
             as an interim target (see migration_notes.md). -->
        <a
          href="#flow"
          class="home-hero__cta-secondary inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#e8e8ea] px-6 text-lg font-semibold text-[#6d6d6d] no-underline transition-opacity hover:opacity-80 sm:w-auto"
        >
          {{ t('landing.home.hero.secondaryCta') }}
        </a>
      </div>
    </div>

    <div
      class="home-hero__mockup w-full max-w-[1280px] overflow-hidden rounded-2xl shadow-[0_0_12.5px_rgb(0_0_0_/_0.25)] sm:rounded-[30px]"
    >
      <img
        :src="heroMockup"
        :alt="t('landing.home.hero.mockupAlt')"
        class="block h-auto w-full"
        decoding="async"
        fetchpriority="high"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import { useRegistrationCta } from './useRegistrationCta';
import heroMockup from '@/assets/landing/hero-dashboard-mockup.webp';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

const { ctaHref: primaryCtaHref, ctaExternal: primaryCtaExternal } =
  useRegistrationCta(() => t('landing.home.nav.whatsappMessage'));
</script>
