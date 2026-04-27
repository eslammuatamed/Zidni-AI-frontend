<template>
  <div class="teacher-landing-layout">
    <div class="teacher-landing-layout__background" :style="backgroundStyle" aria-hidden="true" />
    <div class="teacher-landing-layout__halo teacher-landing-layout__halo--one" aria-hidden="true" />
    <div class="teacher-landing-layout__halo teacher-landing-layout__halo--two" aria-hidden="true" />
    <div class="teacher-landing-layout__halo teacher-landing-layout__halo--three" aria-hidden="true" />
    <div class="teacher-landing-layout__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface TeacherLandingLayoutProps {
  /**
   * Optional background image that will be applied to the fixed backdrop.
   */
  backgroundImage?: string | null;
}

const props = defineProps<TeacherLandingLayoutProps>();

const backgroundStyle = computed(() => {
  if (!props.backgroundImage) {
    return {} as Record<string, string>;
  }

  return {
    ['--teacher-landing-bg-image']: `url('${props.backgroundImage}')`,
    backgroundImage: `url('${props.backgroundImage}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } as Record<string, string>;
});
</script>

<style scoped>
.teacher-landing-layout {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.teacher-landing-layout__background {
  position: fixed;
  inset: 0;
  background-image: var(--teacher-landing-bg-image),
    linear-gradient(180deg, rgba(15, 23, 42, 0.03) 0%, transparent 55%),
    radial-gradient(circle at 18% 16%, rgba(59, 130, 246, 0.12), transparent 45%),
    radial-gradient(circle at 82% 12%, rgba(14, 165, 233, 0.12), transparent 48%),
    radial-gradient(circle at 24% 82%, rgba(14, 116, 144, 0.08), transparent 55%),
    #f8fafc;
  pointer-events: none;
  z-index: 0;
}

.teacher-landing-layout__halo {
  position: fixed;
  border-radius: 999px;
  filter: blur(80px);
  opacity: 0.55;
  pointer-events: none;
  z-index: -2;
}

.teacher-landing-layout__halo--one {
  width: 28rem;
  height: 28rem;
  top: -12rem;
  right: -8rem;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent 65%);
}

.teacher-landing-layout__halo--two {
  width: 22rem;
  height: 22rem;
  bottom: 10vh;
  left: -6rem;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.35), transparent 60%);
}

.teacher-landing-layout__halo--three {
  width: 18rem;
  height: 18rem;
  top: 28vh;
  right: 12vw;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.28), transparent 70%);
}

.teacher-landing-layout__content {
  position: relative;
  z-index: 1;
}
</style>
