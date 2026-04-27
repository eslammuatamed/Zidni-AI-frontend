<template>
  <section class="landing-hero" aria-labelledby="landing-hero-title">
    <div class="landing-container landing-hero__content">
      <div class="landing-hero__copy">
        <p class="landing-hero__eyebrow">{{ t('landing.hero.eyebrow') }}</p>
        <h1 id="landing-hero-title" class="landing-hero__title">
          {{ t('landing.hero.title') }}
        </h1>
        <p class="landing-hero__subtitle">
          {{ t('landing.hero.subtitle') }}
        </p>
        <div class="landing-hero__actions">
          <a
            v-if="whatsappHref"
            class="landing-hero__primary"
            :href="whatsappHref"
            target="_blank"
            rel="noopener"
          >
            {{ t('landing.hero.cta_primary') }}
          </a>
          <RouterLink class="landing-hero__secondary" to="/login/student">
            {{ t('landing.hero.cta_secondary') }}
            <span aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </div>

      <div class="landing-hero__visual" aria-hidden="true">
        <div class="landing-hero__visual-frame">
          <div class="landing-hero__visual-bars">
            <span class="landing-hero__visual-bar"></span>
            <span class="landing-hero__visual-bar"></span>
            <span class="landing-hero__visual-bar"></span>
            <span class="landing-hero__visual-bar"></span>
          </div>
          <div class="landing-hero__visual-bars">
            <span class="landing-hero__visual-bar"></span>
            <span class="landing-hero__visual-bar"></span>
            <span class="landing-hero__visual-bar"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="landing-hero__wave" aria-hidden="true">
      <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,60 C180,20 360,0 540,20 C720,40 900,100 1080,100 C1260,100 1340,80 1440,40 L1440,140 L0,140 Z"
          fill="var(--nabta-white)"
        />
      </svg>
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
    console.warn('[LandingHeroSection] failed to load registration settings', error);
  }
});
</script>




