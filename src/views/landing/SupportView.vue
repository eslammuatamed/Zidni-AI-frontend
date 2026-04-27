<template>
  <LegalPage page-key="support_page" />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import LegalPage from './components/LegalPage.vue';
import { landingMessages } from './messages';

useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages
});
</script>
