<template>
  <section
    id="reach"
    class="home-reach scroll-mt-[72px] relative flex flex-col items-center justify-center gap-2 overflow-hidden bg-[linear-gradient(120deg,rgb(27_47_172_/_0.15)_0%,rgb(27_47_172_/_0.06)_100%)] px-4 py-16 sm:px-6 lg:min-h-[700px] lg:px-20 lg:py-20"
  >
    <!-- Floating country chips: decorative absolute positions on lg+, a wrapped row on smaller screens -->
    <ul
      class="home-reach__chips m-0 flex list-none flex-wrap items-center justify-center gap-3 p-0 pb-8 lg:pointer-events-none lg:absolute lg:inset-0 lg:block lg:pb-0"
      aria-hidden="true"
    >
      <li
        v-for="chip in chips"
        :key="chip.id"
        class="inline-flex items-center gap-2 rounded-pill bg-white px-4 py-2 shadow-[0_10px_12.5px_rgb(30_58_138_/_0.08)] [border:1px_solid_#dae2fd]"
        :class="chip.position"
      >
        <span class="text-2xl leading-none">{{ chip.flag }}</span>
        <span class="text-base font-semibold tracking-[0.6px] text-[#131b2e]">
          {{ t(`landing.home.reach.countries.${chip.id}`) }}
        </span>
      </li>
    </ul>

    <div
      class="home-reach__content relative flex max-w-[924px] flex-col items-center gap-6 text-center"
    >
      <h2
        class="m-0 bg-[linear-gradient(90deg,#1b2fac_0%,#0b1346_100%)] bg-clip-text text-3xl font-bold leading-[1.2] tracking-[-0.96px] text-transparent sm:text-4xl lg:text-5xl"
      >
        {{ t('landing.home.reach.title') }}
      </h2>
      <p
        class="m-0 max-w-[650px] text-base font-normal leading-[1.6] text-[#444651] lg:text-lg"
      >
        {{ t('landing.home.reach.subtitle') }}
      </p>
      <a
        :href="ctaHref"
        :target="ctaExternal ? '_blank' : undefined"
        :rel="ctaExternal ? 'noopener' : undefined"
        class="home-reach__cta mt-4 inline-flex items-center justify-center rounded-lg bg-sakai-primary px-8 py-4 text-base font-semibold text-white no-underline transition-opacity hover:opacity-90"
      >
        {{ t('landing.home.reach.cta') }}
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import { useRegistrationCta } from './useRegistrationCta';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

const { ctaHref, ctaExternal } = useRegistrationCta(() =>
  t('landing.home.nav.whatsappMessage'),
);

// lg+ positions approximate the Figma scatter; chips collapse into a flex row below lg.
const chips = [
  {
    id: 'saudiArabia',
    flag: '🇸🇦',
    position: 'lg:absolute lg:start-[45%] lg:top-[75px] lg:-rotate-[4.6deg]',
  },
  {
    id: 'uae',
    flag: '🇦🇪',
    position: 'lg:absolute lg:end-[210px] lg:top-[136px] lg:rotate-[9.24deg]',
  },
  {
    id: 'egypt',
    flag: '🇪🇬',
    position: 'lg:absolute lg:start-[190px] lg:top-[125px] lg:rotate-[2.3deg]',
  },
  {
    id: 'qatar',
    flag: '🇶🇦',
    position: 'lg:absolute lg:end-[184px] lg:top-[58%] lg:-rotate-[9.24deg]',
  },
  {
    id: 'kuwait',
    flag: '🇰🇼',
    position: 'lg:absolute lg:start-[48%] lg:bottom-[75px] lg:-rotate-[2.3deg]',
  },
  {
    id: 'morocco',
    flag: '🇲🇦',
    position: 'lg:absolute lg:end-[299px] lg:bottom-[121px] lg:rotate-[4.6deg]',
  },
  {
    id: 'jordan',
    flag: '🇯🇴',
    position: 'lg:absolute lg:start-[184px] lg:top-[66%] lg:rotate-[9.24deg]',
  },
] as const;
</script>
