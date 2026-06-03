<template>
  <section
    id="cta"
    class="home-cta scroll-mt-[72px] bg-white px-4 py-12 sm:px-6 lg:px-20 lg:py-20"
  >
    <div
      class="home-cta__panel relative mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8 overflow-hidden rounded-3xl bg-[linear-gradient(162deg,#ecfeff_0%,#eff6ff_100%)] p-8 shadow-[0_1px_2px_0_rgb(0_0_0_/_0.05)] [border:1px_solid_#cffafe] sm:p-12 lg:p-16"
    >
      <div
        class="pointer-events-none absolute inset-px opacity-5"
        :style="{
          backgroundImage: `url(${ctaPattern})`,
          backgroundSize: '67px 100px',
        }"
        aria-hidden="true"
      ></div>

      <h2
        class="relative m-0 text-center text-3xl font-extrabold leading-[1.1] text-sakai-accent sm:text-4xl lg:text-6xl lg:leading-[1]"
      >
        {{ t('landing.home.cta.title') }}
      </h2>
      <p
        class="relative m-0 max-w-[672px] text-center text-base font-medium leading-[1.6] text-content-secondary lg:text-xl"
      >
        {{ t('landing.home.cta.subtitle') }}
      </p>

      <div
        class="relative flex w-full flex-col items-center justify-center gap-4 pt-4 sm:flex-row"
      >
        <a
          :href="primaryHref"
          :target="primaryExternal ? '_blank' : undefined"
          :rel="primaryExternal ? 'noopener' : undefined"
          class="home-cta__primary inline-flex w-full items-center justify-center rounded-lg bg-sakai-primary px-12 py-5 text-lg font-semibold text-white no-underline shadow-[0_20px_12.5px_rgb(165_243_252_/_0.25),0_8px_5px_rgb(165_243_252_/_0.25)] transition-opacity hover:opacity-90 sm:w-auto lg:text-xl"
        >
          {{ t('landing.home.cta.primaryCta') }}
        </a>
        <a
          :href="secondaryHref"
          :target="secondaryExternal ? '_blank' : undefined"
          :rel="secondaryExternal ? 'noopener' : undefined"
          class="home-cta__secondary inline-flex w-full items-center justify-center rounded-lg bg-white px-12 py-5 text-lg font-semibold text-sakai-accent no-underline shadow-[0_1px_1px_rgb(0_0_0_/_0.05)] transition-opacity hover:opacity-80 [border:1px_solid_#e2e8f0] sm:w-auto lg:text-xl"
        >
          {{ t('landing.home.cta.secondaryCta') }}
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import { useRegistrationCta } from './useRegistrationCta';
import ctaPattern from '@/assets/landing/cta-pattern.png';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

const { ctaHref: primaryHref, ctaExternal: primaryExternal } =
  useRegistrationCta(() => t('landing.home.nav.whatsappMessage'));
const { ctaHref: secondaryHref, ctaExternal: secondaryExternal } =
  useRegistrationCta(() => t('landing.home.cta.strategyCallMessage'));
</script>
