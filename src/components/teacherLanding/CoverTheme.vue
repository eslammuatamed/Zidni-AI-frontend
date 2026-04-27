<template>
  <div class="cover-theme" :class="`cover-theme--${theme}`" aria-hidden="true">
    <div v-if="theme === 'c1'" class="cover-theme__floating">
      <div class="cover-theme__text">
        <span
          v-for="(letter, index) in letters"
          :key="`cover-float-${index}`"
          class="cover-theme__letter"
          :style="{ '--delay': `${index * 80}ms` }"
        >
          {{ letter === ' ' ? '\u00A0' : letter }}
        </span>
      </div>
      <div v-if="subtitle" class="cover-theme__subtext">
        <span
          v-for="(letter, index) in subtitleLetters"
          :key="`cover-float-sub-${index}`"
          class="cover-theme__letter cover-theme__letter--sub"
          :style="{ '--delay': `${index * 60 + 600}ms` }"
        >
          {{ letter === ' ' ? '\u00A0' : letter }}
        </span>
      </div>
    </div>

    <div v-else class="cover-theme__glow">
      <div class="cover-theme__glow-bg"></div>
      <div class="cover-theme__glow-content">
        <div class="cover-theme__reveal" :style="{ '--delay': '0ms' }">
          {{ title }}
        </div>
        <div v-if="subtitle" class="cover-theme__reveal cover-theme__reveal--sub" :style="{ '--delay': '800ms' }">
          {{ subtitle }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';

type CoverThemeId = 'c1' | 'c2' | 'c3';

const props = defineProps<{
  theme: CoverThemeId;
  title: string;
  subtitle?: string;
}>();

const letters = computed(() => (props.title || '').split(''));
const subtitle = computed(() => (props.subtitle || '').trim());
const subtitleLetters = computed(() => subtitle.value.split(''));
</script>

<style scoped>
.cover-theme {
  position: absolute;
  inset: 0;
  background: #050505;
  color: #ffffff;
  display: grid;
  place-items: center;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  font-family: 'Space Grotesk', 'Segoe UI', system-ui, -apple-system, sans-serif;
}

.cover-theme__text {
  font-size: clamp(3rem, 12vw, 9rem);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.cover-theme__subtext {
  margin-top: 1.25rem;
  font-size: clamp(1.6rem, 4.5vw, 4rem);
  letter-spacing: 0.08em;
  text-transform: none;
  text-align: center;
}

.cover-theme__letter--sub {
  font-weight: 500;
}

.cover-theme__letter {
  display: inline-block;
  opacity: 0;
  transform: translateY(80px) rotateX(60deg);
  animation: coverThemeFloat 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
  animation-delay: var(--delay);
}

.cover-theme__glow {
  width: 100%;
  height: 100%;
  position: relative;
}

.cover-theme__glow-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(66, 133, 244, 0.38) 0%, transparent 45%),
    radial-gradient(circle at 80% 70%, rgba(234, 67, 53, 0.38) 0%, transparent 55%),
    radial-gradient(circle at 50% 50%, rgba(52, 168, 83, 0.28) 0%, transparent 60%);
  filter: blur(80px);
  opacity: 0.7;
  animation: coverThemePulse 20s infinite;
}

.cover-theme__glow-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  place-items: center;
  text-align: center;
  font-size: clamp(3rem, 12vw, 9rem);
  line-height: 1.05;
  padding: 0 1.5rem;
}

.cover-theme__reveal {
  opacity: 0;
  transform: translateY(80px);
  animation: coverThemeReveal 1.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  animation-delay: var(--delay);
}

.cover-theme__reveal--sub {
  font-size: 0.7em;
  margin-top: 1.25rem;
}

@keyframes coverThemeFloat {
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes coverThemeReveal {
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes coverThemePulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-theme__letter,
  .cover-theme__reveal,
  .cover-theme__glow-bg {
    animation: none;
    transition: none;
    opacity: 1;
    transform: none;
  }
}
</style>
