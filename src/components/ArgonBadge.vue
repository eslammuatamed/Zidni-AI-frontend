<template>
  <span class="muse-badge" :class="[variantClass, colorClass]">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type MuseVariant = 'solid' | 'soft' | 'outline';
type MuseTone = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'secondary';

const props = withDefaults(
  defineProps<{
    color?: MuseTone | string;
    variant?: MuseVariant;
  }>(),
  {
    color: 'primary',
    variant: 'soft'
  }
);

const variantClass = computed(() => `muse-badge--${props.variant}`);
const colorClass = computed(() => `muse-badge--${props.color}`);
</script>

<style scoped>
.muse-badge {
  --muse-badge-color: var(--muse-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-weight: var(--muse-font-semibold);
  font-size: 0.75rem;
  padding: 0.15rem 0.6rem;
  border: 1px solid transparent;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.muse-badge--danger {
  --muse-badge-color: var(--muse-danger);
}

.muse-badge--success {
  --muse-badge-color: var(--muse-success);
}

.muse-badge--warning {
  --muse-badge-color: var(--muse-warning);
}

.muse-badge--info {
  --muse-badge-color: var(--muse-info);
}

.muse-badge--secondary {
  --muse-badge-color: var(--muse-secondary);
}

.muse-badge--solid {
  background: var(--muse-badge-color);
  color: var(--muse-surface);
}

.muse-badge--soft {
  background: color-mix(in srgb, var(--muse-badge-color) 16%, transparent);
  color: var(--muse-badge-color);
}

.muse-badge--outline {
  background: transparent;
  border-color: color-mix(in srgb, var(--muse-badge-color) 38%, transparent);
  color: var(--muse-badge-color);
}
</style>
