<template>
   <div class="teacher-theme" :style="heroStyle">
    <div class="teacher-theme__texture" aria-hidden="true" />

    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TEACHER_LANDING_DEFAULT_BG } from '@/constants/teacherLandingBackground';

// Accept an optional heroImage prop (URL or local asset path). If provided,
// it will override the CSS variable --teacher-hero-bg-image used by the hero.
const props = defineProps<{
  heroImage?: string;
}>();

const toCssUrl = (value: string) => `url('${value.replace(/'/g, "\\'")}')`;

const heroStyle = computed(() => {
  const background = props.heroImage?.trim() ?? '';
  if (!background) {
    return {
      ['--teacher-hero-bg-image']: 'none',
      backgroundImage: 'none',
      backgroundColor: '#f8fafc'
    };
  }

  const cssUrl = toCssUrl(background);
  return {
    ['--teacher-hero-bg-image']: cssUrl,
    backgroundImage: cssUrl,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

.teacher-theme {
  /* Core color tokens taken from the provided theme */
  --teacher-color-primary: #2563eb; /* blue */
  --teacher-color-secondary: #0ea5e9; /* cyan */
  --teacher-color-accent: #f59e0b; /* amber */
  --teacher-color-surface: rgba(255, 255, 255, 0.92);
  --teacher-color-text-primary: #0f172a;
  --teacher-color-text-secondary: #475569;
  --teacher-gradient: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(14, 165, 233, 0.85));
  /* default hero background (used by the hero when no custom image provided) */
  --teacher-hero-bg-image: v-bind(defaultHeroBackgroundCss);
  /* hero tokens (used by TeacherHero) */
  --teacher-hero-radius: 24px;
  --teacher-hero-photo-shadow: 0 24px 56px rgba(15, 23, 42, 0.22);
  --teacher-hero-photo-glow: 0 28px 80px rgba(6, 182, 212, 0.08);
  /* logical offsets for RTL-aware positioning (used by components) */
  --teacher-orb-offset-inline-start: 5%;
  --teacher-orb-offset-inline-end: -10%;

  font-family: 'Cairo', 'Noto Sans Arabic', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.45;

  background: radial-gradient(circle at top right, rgba(14, 165, 233, 0.16), transparent 55%),
    radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.12), transparent 45%), #f8fafc;
  color: var(--teacher-color-text-primary);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.teacher-theme__texture {
  position: absolute;
  inset: -40vh -20vw;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(14, 116, 144, 0.05) 35%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}

.teacher-theme :deep(*) {
  position: relative;
  z-index: 1;
 
}
</style>
