<template>
  <span class="ui-badge" :class="[variantClass, colorClass]">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UiVariant = 'solid' | 'soft' | 'outline';
type UiTone = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'secondary';

const props = withDefaults(
  defineProps<{
    color?: UiTone | string;
    variant?: UiVariant;
  }>(),
  {
    color: 'primary',
    variant: 'soft'
  }
);

const variantClass = computed(() => `ui-badge--${props.variant}`);
const colorClass = computed(() => `ui-badge--${props.color}`);
</script>

<style scoped>
.ui-badge {
  --ui-badge-color: var(--sakai-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sakai-border-radius-pill);
  font-weight: var(--sakai-font-weight-semibold);
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid transparent;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ui-badge--danger {
  --ui-badge-color: var(--sakai-danger);
}

.ui-badge--success {
  --ui-badge-color: var(--sakai-success);
}

.ui-badge--warning {
  --ui-badge-color: var(--sakai-warning);
}

.ui-badge--info {
  --ui-badge-color: var(--sakai-info);
}

.ui-badge--secondary {
  --ui-badge-color: var(--sakai-secondary);
}

.ui-badge--solid {
  background: var(--ui-badge-color);
  color: var(--sakai-primary-contrast);
}

.ui-badge--soft {
  background: color-mix(in srgb, var(--ui-badge-color) 16%, transparent);
  color: var(--ui-badge-color);
}

.ui-badge--outline {
  background: transparent;
  border-color: color-mix(in srgb, var(--ui-badge-color) 38%, transparent);
  color: var(--ui-badge-color);
}
</style>
