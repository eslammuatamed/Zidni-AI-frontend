<template>
  <div class="muse-alert" :class="[variantClass, colorClass]">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type MuseVariant = 'solid' | 'soft' | 'outline';
type MuseTone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

const props = withDefaults(
  defineProps<{
    color?: MuseTone | string;
    variant?: MuseVariant;
  }>(),
  {
    color: 'info',
    variant: 'soft'
  }
);

const variantClass = computed(() => `muse-alert--${props.variant}`);
const colorClass = computed(() => `muse-alert--${props.color}`);
</script>

<style scoped>
.muse-alert {
  --muse-alert-color: var(--muse-info);
  border-radius: var(--muse-radius-lg);
  padding: 1rem 1.25rem;
  font-weight: var(--muse-font-semibold);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid transparent;
}

.muse-alert--primary {
  --muse-alert-color: var(--muse-primary);
}

.muse-alert--secondary {
  --muse-alert-color: var(--muse-secondary);
}

.muse-alert--success {
  --muse-alert-color: var(--muse-success);
}

.muse-alert--warning {
  --muse-alert-color: var(--muse-warning);
}

.muse-alert--danger {
  --muse-alert-color: var(--muse-danger);
}

.muse-alert--soft {
  background: color-mix(in srgb, var(--muse-alert-color) 12%, transparent);
  color: var(--muse-alert-color);
}

.muse-alert--solid {
  background: var(--muse-alert-color);
  color: var(--muse-surface);
  box-shadow: var(--muse-shadow-base);
}

.muse-alert--outline {
  background: transparent;
  border-color: color-mix(in srgb, var(--muse-alert-color) 35%, transparent);
  color: var(--muse-alert-color);
}
</style>
