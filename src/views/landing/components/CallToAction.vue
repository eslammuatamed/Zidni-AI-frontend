<template>
  <section class="landing-cta" aria-labelledby="landing-cta-title">
    <div class="landing-container landing-cta__content">
      <h2 id="landing-cta-title" class="landing-cta__title">
        {{ t('landing.cta.title') }}
      </h2>
      <p class="landing-cta__body">
        {{ t('landing.cta.body') }}
      </p>
      <a
        v-if="whatsappHref"
        class="landing-cta__button"
        :href="whatsappHref"
        target="_blank"
        rel="noopener"
      >
        {{ t('landing.cta.button') }}
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { buildWhatsappHref, getTeacherRegistrationSettingsCached } from '@/api/registration';

const { t } = useI18n({ useScope: 'parent' });
const whatsappHref = ref('');

onMounted(async () => {
  try {
    const settings = await getTeacherRegistrationSettingsCached();
    whatsappHref.value = buildWhatsappHref(settings.whatsappNumber, t('landing.nav.whatsappMessage'));
  } catch (error) {
    console.warn('[LandingCta] failed to load registration settings', error);
  }
});
</script>




