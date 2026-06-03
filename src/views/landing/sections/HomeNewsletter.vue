<template>
  <!--
    Static UI: there is no newsletter-subscription API yet (see
    migration_notes.md). Submitting shows an informational toast.
  -->
  <section
    id="newsletter"
    class="home-newsletter scroll-mt-[72px] bg-white px-4 py-12 sm:px-6 lg:px-20 lg:py-20"
  >
    <div
      class="home-newsletter__panel relative mx-auto flex w-full max-w-[1280px] flex-col items-center overflow-hidden rounded-[32px] px-4 py-10 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.1),0_1px_2px_-1px_rgb(0_0_0_/_0.1)] sm:px-10"
    >
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute inset-0 bg-[#06b6d4]/20"></div>
        <img
          :src="newsletterBg"
          alt=""
          class="absolute inset-0 h-full w-full object-cover opacity-50"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div
        class="relative flex w-full max-w-[640px] flex-col items-center gap-12"
      >
        <div class="flex flex-col items-center gap-4 text-center">
          <span
            class="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_1px_1.5px_rgb(0_0_0_/_0.1),0_1px_1px_rgb(0_0_0_/_0.1)] [border:0.8px_solid_#f1f5f9]"
          >
            <img
              :src="iconMail"
              alt=""
              class="h-8 w-8"
              loading="lazy"
              decoding="async"
            />
          </span>
          <h2
            class="m-0 text-2xl font-extrabold leading-[1.3] tracking-[-0.9px] text-[#1d3989] lg:text-[32px]"
          >
            {{ t('landing.home.newsletter.title') }}
          </h2>
          <p class="m-0 text-base font-normal text-[#64748b]">
            {{ t('landing.home.newsletter.subtitle') }}
          </p>
        </div>

        <form
          class="flex w-full flex-col gap-3 sm:flex-row"
          @submit.prevent="handleSubscribe"
        >
          <input
            v-model="email"
            type="email"
            required
            :placeholder="t('landing.home.newsletter.placeholder')"
            :aria-label="t('landing.home.newsletter.placeholder')"
            class="home-newsletter__input min-w-0 flex-1 rounded-[14px] bg-[#f8fafc] px-5 py-[19px] font-[inherit] text-base text-content shadow-[0_1px_3px_0_rgb(0_0_0_/_0.1),0_1px_2px_-1px_rgb(0_0_0_/_0.1)] [border:0.8px_solid_#e2e8f0] placeholder:text-[#90a1b9] focus:outline-none focus:ring-2 focus:ring-sakai-primary/40"
          />
          <button
            type="submit"
            class="home-newsletter__submit inline-flex h-14 items-center justify-center gap-1.5 rounded-[14px] bg-[#1d3989] px-6 text-base font-bold text-white shadow-[0_4px_3px_rgb(0_0_0_/_0.1),0_2px_2px_rgb(0_0_0_/_0.1)] transition-opacity hover:opacity-90"
          >
            {{ t('landing.home.newsletter.cta') }}
            <img
              :src="iconSend"
              alt=""
              class="h-4 w-4"
              loading="lazy"
              decoding="async"
            />
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import { useToast } from '@/composables/useToast';
import newsletterBg from '@/assets/landing/newsletter-bg.webp';
import iconMail from '@/assets/landing/icon-newsletter-mail.svg';
import iconSend from '@/assets/landing/icon-newsletter-send.svg';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

const toast = useToast();
const email = ref('');

const handleSubscribe = () => {
  // No backend endpoint yet — inform the visitor instead of silently dropping.
  toast.info(t('landing.home.newsletter.comingSoon'));
  email.value = '';
};
</script>
