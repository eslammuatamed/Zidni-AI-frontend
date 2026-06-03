<template>
  <section
    id="integrations"
    class="home-integrations scroll-mt-[72px] flex flex-col gap-10 bg-[#f8fafc] px-4 py-12 sm:px-6 lg:gap-16 lg:px-20 lg:py-20"
  >
    <h2
      class="m-0 text-center text-xl font-bold uppercase leading-8 text-sakai-primary lg:text-2xl"
    >
      {{ t('landing.home.integrations.title') }}
    </h2>
    <div
      class="home-integrations__logos flex flex-wrap items-center justify-center gap-8 lg:gap-16"
    >
      <div v-for="logo in logos" :key="logo.id" class="flex items-center gap-3">
        <img
          :src="logo.image"
          :alt="logo.name"
          class="h-10 w-auto lg:h-14"
          loading="lazy"
          decoding="async"
        />
        <span
          class="text-lg font-semibold leading-6 text-[#334155]/50 lg:text-2xl"
          >{{ logo.name }}</span
        >
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import logoChatgpt from '@/assets/landing/logo-chatgpt.svg';
import logoNotion from '@/assets/landing/logo-notion.svg';
import logoZapier from '@/assets/landing/logo-zapier.svg';
import logoSlack from '@/assets/landing/logo-slack.svg';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

// Product names are not translated.
const logos = [
  { id: 'chatgpt', name: 'ChatGPT', image: logoChatgpt },
  { id: 'notion', name: 'Notion', image: logoNotion },
  { id: 'zapier', name: 'Zapier', image: logoZapier },
  { id: 'slack', name: 'Slack', image: logoSlack },
] as const;
</script>
