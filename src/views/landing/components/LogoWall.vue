<template>
  <section class="landing-section landing-logo-wall" aria-labelledby="landing-logo-wall-title">
    <div class="landing-container">
      <header class="landing-section__header">
        <h2 id="landing-logo-wall-title" class="landing-section__title">
          {{ t('landing.logos.title') }}
        </h2>
      </header>
      <div class="landing-logo-wall__grid">
        <div v-for="logo in logos" :key="logo" class="landing-logo-wall__item">
          {{ logo }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, tm } = useI18n({ useScope: 'parent' });

const logos = computed(() => tm('landing.logos.items') as string[]);
</script>
