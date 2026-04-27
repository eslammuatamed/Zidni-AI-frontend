<template>
  <div class="ui-alert" :class="[variantClass, colorClass]">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UiVariant = 'solid' | 'soft' | 'outline';
type UiTone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

const props = withDefaults(
  defineProps<{
    color?: UiTone | string;
    variant?: UiVariant;
  }>(),
  {
    color: 'info',
    variant: 'soft'
  }
);

const variantClass = computed(() => `ui-alert--${props.variant}`);
const colorClass = computed(() => `ui-alert--${props.color}`);
</script>

<style scoped>
.ui-alert {
  --ui-alert-color: var(--sakai-info);
  border-radius: var(--sakai-border-radius-lg);
  padding: var(--sakai-space-4);
  font-weight: var(--sakai-font-weight-medium);
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  border: 1px solid transparent;
}

.ui-alert--primary {
  --ui-alert-color: var(--sakai-primary);
}

.ui-alert--success {
  --ui-alert-color: var(--sakai-success);
}

.ui-alert--warning {
  --ui-alert-color: var(--sakai-warning);
}

.ui-alert--danger {
  --ui-alert-color: var(--sakai-danger);
}

.ui-alert--soft {
  background: color-mix(in srgb, var(--ui-alert-color) 12%, transparent);
  color: var(--ui-alert-color);
}

.ui-alert--solid {
  background: var(--ui-alert-color);
  color: var(--sakai-primary-contrast);
  box-shadow: var(--sakai-shadow-md);
}

.ui-alert--outline {
  background: transparent;
  border-color: color-mix(in srgb, var(--ui-alert-color) 35%, transparent);
  color: var(--ui-alert-color);
}
</style>
