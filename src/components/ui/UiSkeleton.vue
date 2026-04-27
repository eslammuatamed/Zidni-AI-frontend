<template>
  <div class="ui-skeleton" :class="[`ui-skeleton--${props.shape}`, `ui-skeleton--${props.animation}`]" :style="rootStyle">
    <template v-if="props.lines > 1">
      <span
        v-for="line in props.lines"
        :key="line"
        class="ui-skeleton__line"
        :style="lineStyle(line)"
      ></span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UiSkeletonShape = 'rect' | 'pill' | 'circle';
type UiSkeletonAnimation = 'pulse' | 'wave' | 'none';

const props = withDefaults(
  defineProps<{
    width?: string | number;
    height?: string | number;
    shape?: UiSkeletonShape;
    animation?: UiSkeletonAnimation;
    lines?: number;
  }>(),
  {
    width: '100%',
    height: '1rem',
    shape: 'rect',
    animation: 'pulse',
    lines: 1
  }
);

const toCssSize = (value: string | number) => (typeof value === 'number' ? `${value}px` : value);

const rootStyle = computed(() => ({
  width: toCssSize(props.width),
  height: props.lines > 1 ? 'auto' : toCssSize(props.height)
}));

const lineStyle = (line: number) => ({
  width: '100%',
  height: toCssSize(props.height),
  opacity: line === props.lines ? 0.85 : 1
});
</script>

<style scoped>
.ui-skeleton {
  display: inline-flex;
  flex-direction: column;
  gap: 0.5rem;
  border-radius: var(--sakai-border-radius-md);
  background: color-mix(in srgb, var(--sakai-border-color) 35%, transparent);
  overflow: hidden;
  position: relative;
}

.ui-skeleton--pill {
  border-radius: var(--sakai-border-radius-pill);
}

.ui-skeleton--circle {
  border-radius: 50%;
  width: min(var(--skeleton-size, 3rem), 100%);
  height: min(var(--skeleton-size, 3rem), 100%);
}

.ui-skeleton__line {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: color-mix(in srgb, var(--sakai-border-color) 35%, transparent);
}

.ui-skeleton--pulse::after,
.ui-skeleton--wave::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--sakai-white-alpha-18) 100%, transparent),
    transparent
  );
  transform: translateX(-100%);
}

.ui-skeleton--pulse::after {
  animation: ui-skeleton-pulse 1.5s ease-in-out infinite;
}

.ui-skeleton--wave::after {
  animation: ui-skeleton-wave 1.5s linear infinite;
}

.ui-skeleton--none::after {
  display: none;
}

@keyframes ui-skeleton-pulse {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes ui-skeleton-wave {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
</style>
