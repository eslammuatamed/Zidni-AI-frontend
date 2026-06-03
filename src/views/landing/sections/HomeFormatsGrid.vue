<template>
  <section
    id="formats"
    class="home-formats scroll-mt-[72px] flex flex-col items-center justify-center gap-8 bg-white px-4 py-12 sm:px-6 lg:gap-[45px] lg:px-20 lg:py-20"
  >
    <h2
      class="m-0 max-w-[1100px] text-center text-3xl font-extrabold leading-[1.1] tracking-[-1.2px] text-[#1e3a8a] sm:text-4xl lg:text-5xl"
    >
      {{ t('landing.home.formats.title') }}
    </h2>
    <p
      class="m-0 max-w-[980px] text-center text-base font-medium leading-[1.6] text-content-secondary lg:text-lg"
    >
      {{ t('landing.home.formats.subtitle') }}
    </p>

    <div
      class="home-formats__grid grid w-full max-w-[1280px] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
    >
      <article
        v-for="format in formats"
        :key="format.id"
        class="home-formats__card flex flex-col gap-6"
      >
        <div
          class="home-formats__media aspect-[225/161] w-full overflow-hidden rounded-es-[32px] rounded-se-[32px] bg-[#f8fafc]"
        >
          <img
            :src="format.image"
            :alt="t(`landing.home.formats.items.${format.id}.title`)"
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="flex flex-col gap-2">
          <h3
            class="m-0 flex items-center gap-2 text-lg font-bold leading-[1.5] text-sakai-primary"
          >
            {{ t(`landing.home.formats.items.${format.id}.title`) }}
            <img
              :src="iconSendSquare"
              alt=""
              class="h-6 w-6"
              loading="lazy"
              decoding="async"
            />
          </h3>
          <p class="m-0 text-sm leading-[1.5] text-content-tertiary">
            {{ t(`landing.home.formats.items.${format.id}.description`) }}
          </p>
        </div>
      </article>
    </div>

    <a
      :href="ctaHref"
      :target="ctaExternal ? '_blank' : undefined"
      :rel="ctaExternal ? 'noopener' : undefined"
      class="home-formats__cta inline-flex h-12 items-center justify-center rounded-lg bg-sakai-primary px-8 text-base font-semibold text-white no-underline shadow-[0_10px_15px_rgb(165_243_252_/_0.2),0_4px_3px_rgb(165_243_252_/_0.6)] transition-opacity hover:opacity-90"
    >
      {{ t('landing.home.formats.cta') }}
    </a>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import { useRegistrationCta } from './useRegistrationCta';
import iconSendSquare from '@/assets/landing/icon-send-square.svg';
import imgCourses from '@/assets/landing/format-online-courses.webp';
import imgCoaching from '@/assets/landing/format-coaching.webp';
import imgDownloads from '@/assets/landing/format-digital-downloads.webp';
import imgMemberships from '@/assets/landing/format-memberships.webp';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

const { ctaHref, ctaExternal } = useRegistrationCta(() =>
  t('landing.home.nav.whatsappMessage'),
);

const formats = [
  { id: 'courses', image: imgCourses },
  { id: 'coaching', image: imgCoaching },
  { id: 'downloads', image: imgDownloads },
  { id: 'memberships', image: imgMemberships },
] as const;
</script>
