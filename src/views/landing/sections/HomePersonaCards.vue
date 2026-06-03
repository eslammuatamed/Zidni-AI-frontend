<template>
  <section
    id="solutions"
    class="home-personas scroll-mt-[72px] flex flex-col items-center gap-8 bg-white px-4 py-12 sm:px-6 lg:px-20 lg:py-20"
  >
    <div
      class="home-personas__heading flex w-full flex-col items-center gap-4 text-center"
    >
      <h2
        class="m-0 text-2xl font-extrabold leading-[1.1] text-sakai-accent sm:text-3xl lg:text-4xl"
      >
        {{ t('landing.home.personas.title') }}
      </h2>
      <p
        class="m-0 max-w-[640px] text-base font-medium leading-6 text-content-secondary"
      >
        {{ t('landing.home.personas.subtitle') }}
      </p>
    </div>

    <div
      class="home-personas__grid grid w-full max-w-[1280px] grid-cols-1 gap-8 md:grid-cols-3"
    >
      <article
        v-for="persona in personas"
        :key="persona.id"
        class="home-personas__card flex flex-col items-start gap-3 rounded-2xl bg-[#f8fafc] p-8 [border:1px_solid_#f1f5f9]"
      >
        <div
          class="home-personas__icon flex h-14 w-14 items-center justify-center rounded-xl"
          :class="persona.iconBg"
        >
          <img
            :src="persona.icon"
            alt=""
            class="h-6 w-auto"
            loading="lazy"
            decoding="async"
          />
        </div>
        <h3
          class="m-0 pt-3 text-2xl font-bold leading-8"
          :class="persona.titleColor"
        >
          {{ t(`landing.home.personas.items.${persona.id}.title`) }}
        </h3>
        <p
          class="m-0 flex-1 pb-5 text-base font-medium leading-6 text-content-secondary"
        >
          {{ t(`landing.home.personas.items.${persona.id}.description`) }}
        </p>
        <a
          :href="ctaHref"
          :target="ctaExternal ? '_blank' : undefined"
          :rel="ctaExternal ? 'noopener' : undefined"
          class="home-personas__cta inline-flex w-full items-center justify-center rounded-lg py-3 text-base font-semibold no-underline transition-opacity hover:opacity-85"
          :class="
            persona.primary
              ? 'bg-sakai-primary text-white'
              : 'text-sakai-primary [border:1px_solid_rgb(var(--sakai-primary-rgb))]'
          "
        >
          {{ t(`landing.home.personas.items.${persona.id}.cta`) }}
        </a>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import { useRegistrationCta } from './useRegistrationCta';
import iconCreator from '@/assets/landing/icon-persona-creator.svg';
import iconAcademy from '@/assets/landing/icon-persona-academy.svg';
import iconCoach from '@/assets/landing/icon-persona-coach.svg';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

// All three CTAs share the registration destination for now — no per-persona
// onboarding flows exist yet (see migration_notes.md).
const { ctaHref, ctaExternal } = useRegistrationCta(() =>
  t('landing.home.nav.whatsappMessage'),
);

const personas = [
  {
    id: 'creator',
    icon: iconCreator,
    iconBg: 'bg-[#cffafe]',
    titleColor: 'text-sakai-accent',
    primary: true,
  },
  {
    id: 'academy',
    icon: iconAcademy,
    iconBg: 'bg-[#dbeafe]',
    titleColor: 'text-sakai-primary',
    primary: false,
  },
  {
    id: 'coach',
    icon: iconCoach,
    iconBg: 'bg-[#e0e7ff]',
    titleColor: 'text-sakai-primary',
    primary: false,
  },
] as const;
</script>
