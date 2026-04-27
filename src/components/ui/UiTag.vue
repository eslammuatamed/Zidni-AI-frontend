<template>
  <span
    class="ui-tag"
    :class="[
      `ui-tag--${props.variant}`,
      `ui-tag--tone-${props.color}`,
      `ui-tag--size-${props.size}`,
      { 'ui-tag--rounded': props.rounded, 'ui-tag--pill': props.pill }
    ]"
  >
    <span v-if="resolvedStartIcon" class="ui-tag__icon ui-tag__icon--start">
      <UiIcon :name="resolvedStartIcon" :size="iconSize" />
    </span>
    <slot />
    <span v-if="resolvedEndIcon && !props.dismissible" class="ui-tag__icon ui-tag__icon--end">
      <UiIcon :name="resolvedEndIcon" :size="iconSize" />
    </span>
    <button
      v-if="props.dismissible"
      type="button"
      class="ui-tag__dismiss"
      :aria-label="props.dismissLabel"
      @click="onDismiss"
    >
      <UiIcon name="CloseOutlined" :size="12" />
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiIcon from '@/components/ui/UiIcon.vue';

type UiTagTone = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';
type UiTagVariant = 'solid' | 'soft' | 'outline';
type UiTagSize = 'sm' | 'md';

const props = withDefaults(
  defineProps<{
    color?: UiTagTone;
    variant?: UiTagVariant;
    size?: UiTagSize;
    rounded?: boolean;
    pill?: boolean;
    startIcon?: string;
    endIcon?: string;
    dismissible?: boolean;
    dismissLabel?: string;
  }>(),
  {
    color: 'primary',
    variant: 'soft',
    size: 'md',
    rounded: false,
    pill: false,
    startIcon: undefined,
    endIcon: undefined,
    dismissible: false,
    dismissLabel: 'Remove'
  }
);

const emit = defineEmits<{ (e: 'dismiss'): void }>();

const iconSize = computed(() => (props.size === 'sm' ? 12 : 14));

const resolvedStartIcon = computed(() => props.startIcon);
const resolvedEndIcon = computed(() => props.endIcon);

const onDismiss = () => {
  emit('dismiss');
};
</script>

<style scoped>
.ui-tag {
  --ui-tag-bg: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  --ui-tag-border: color-mix(in srgb, var(--sakai-primary) 45%, transparent);
  --ui-tag-color: var(--sakai-primary-700);
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
  border-radius: var(--sakai-border-radius-md);
  padding: 0.2rem 0.65rem;
  font-size: 0.85rem;
  font-weight: var(--sakai-font-weight-medium);
  color: var(--ui-tag-color);
  background: var(--ui-tag-bg);
  border: 1px solid var(--ui-tag-border);
  line-height: 1.3;
}

.ui-tag--rounded {
  border-radius: var(--sakai-border-radius-lg);
}

.ui-tag--pill {
  border-radius: var(--sakai-border-radius-pill);
}

.ui-tag--size-sm {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
}

.ui-tag--size-sm .ui-tag__icon {
  margin-inline-start: -0.1rem;
}

.ui-tag--soft {
  background: var(--ui-tag-bg);
  border-color: color-mix(in srgb, var(--ui-tag-border) 55%, transparent);
}

.ui-tag--solid {
  background: var(--ui-tag-color);
  color: var(--sakai-primary-contrast, #fff);
  border-color: transparent;
}

.ui-tag--outline {
  background: transparent;
  border-color: var(--ui-tag-border);
}

.ui-tag--tone-secondary {
  --ui-tag-bg: color-mix(in srgb, var(--sakai-secondary) 12%, transparent);
  --ui-tag-border: color-mix(in srgb, var(--sakai-secondary) 45%, transparent);
  --ui-tag-color: var(--sakai-secondary-600, var(--sakai-secondary));
}

.ui-tag--tone-success {
  --ui-tag-bg: color-mix(in srgb, var(--sakai-success) 14%, transparent);
  --ui-tag-border: color-mix(in srgb, var(--sakai-success) 45%, transparent);
  --ui-tag-color: #15803d;
}

.ui-tag--tone-info {
  --ui-tag-bg: color-mix(in srgb, var(--sakai-info) 14%, transparent);
  --ui-tag-border: color-mix(in srgb, var(--sakai-info) 45%, transparent);
  --ui-tag-color: #1d4ed8;
}

.ui-tag--tone-warning {
  --ui-tag-bg: color-mix(in srgb, var(--sakai-warning) 18%, transparent);
  --ui-tag-border: color-mix(in srgb, var(--sakai-warning) 55%, transparent);
  --ui-tag-color: #b45309;
}

.ui-tag--tone-danger {
  --ui-tag-bg: color-mix(in srgb, var(--sakai-danger) 18%, transparent);
  --ui-tag-border: color-mix(in srgb, var(--sakai-danger) 55%, transparent);
  --ui-tag-color: #b91c1c;
}

.ui-tag--tone-neutral {
  --ui-tag-bg: color-mix(in srgb, var(--sakai-border-color) 45%, transparent);
  --ui-tag-border: color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
  --ui-tag-color: var(--sakai-text-color-secondary);
}

.ui-tag--solid.ui-tag--tone-neutral {
  background: var(--sakai-text-color-secondary);
  color: var(--sakai-surface);
}

.ui-tag__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.ui-tag__dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0.1rem;
  border-radius: var(--sakai-border-radius-sm);
  transition: background-color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-tag__dismiss:hover {
  background: color-mix(in srgb, currentColor 14%, transparent);
}
</style>
