<template>
  <component
    :is="componentTag"
    v-bind="$attrs"
    :to="props.to"
    :type="buttonType"
    class="muse-button"
    :class="[variantClass, toneClass]"
  >
    <span v-if="prependIcon" class="muse-button__icon muse-button__icon--start">
      <muse-icon :name="prependIcon" :size="18" />
    </span>
    <slot />
    <span v-if="appendIcon" class="muse-button__icon muse-button__icon--end">
      <muse-icon :name="appendIcon" :size="18" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import MuseIcon from '@/components/MuseIcon.vue';

type MuseVariant = 'solid' | 'outline' | 'link';
type MuseTone = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

const props = withDefaults(
  defineProps<{
    color?: MuseTone | string;
    variant?: MuseVariant;
    prependIcon?: string;
    appendIcon?: string;
    to?: string | Record<string, unknown>;
    buttonType?: 'button' | 'submit' | 'reset';
  }>(),
  {
    color: 'primary',
    variant: 'solid',
    prependIcon: undefined,
    appendIcon: undefined,
    to: undefined,
    buttonType: 'button'
  }
);

const componentTag = computed(() => (props.to ? RouterLink : 'button'));

const variantClass = computed(() => `muse-button--${props.variant}`);
const toneClass = computed(() => `muse-button--tone-${props.color}`);

const prependIcon = computed(() => props.prependIcon);
const appendIcon = computed(() => props.appendIcon);
const buttonType = computed(() => (componentTag.value === 'button' ? props.buttonType : undefined));
</script>

<style scoped>
.muse-button {
  --muse-button-color: var(--muse-primary);
  --muse-button-gradient: var(--muse-gradient-primary);
  --muse-button-shadow: var(--muse-shadow-button);
  --muse-button-shadow-hover: var(--muse-shadow-button-hover);
  --muse-button-solid-text: var(--muse-surface);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: var(--muse-radius-md);
  border: none;
  font-weight: var(--muse-font-semibold);
  font-size: 0.95rem;
  padding: 0.6rem 1.25rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  text-decoration: none;
  background: transparent;
  color: var(--muse-button-color);
}

.muse-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.muse-button--tone-secondary {
  --muse-button-color: var(--muse-secondary);
  --muse-button-gradient: var(--muse-gradient-secondary);
  --muse-button-shadow: 0 20px 27px color-mix(in srgb, var(--muse-secondary) 24%, rgba(0, 0, 0, 0.12));
  --muse-button-shadow-hover: 0 28px 45px color-mix(in srgb, var(--muse-secondary) 28%, rgba(0, 0, 0, 0.16));
}

.muse-button--tone-danger {
  --muse-button-color: var(--muse-danger);
  --muse-button-gradient: var(--muse-gradient-danger);
  --muse-button-shadow: 0 20px 27px color-mix(in srgb, var(--muse-danger) 24%, rgba(0, 0, 0, 0.16));
  --muse-button-shadow-hover: 0 28px 45px color-mix(in srgb, var(--muse-danger) 28%, rgba(0, 0, 0, 0.2));
}

.muse-button--tone-success {
  --muse-button-color: var(--muse-success);
  --muse-button-gradient: var(--muse-gradient-success);
  --muse-button-shadow: 0 20px 27px color-mix(in srgb, var(--muse-success) 22%, rgba(0, 0, 0, 0.16));
  --muse-button-shadow-hover: 0 28px 45px color-mix(in srgb, var(--muse-success) 26%, rgba(0, 0, 0, 0.2));
}

.muse-button--tone-warning {
  --muse-button-color: var(--muse-warning);
  --muse-button-gradient: var(--muse-gradient-warning);
  --muse-button-solid-text: var(--muse-text-heading);
  --muse-button-shadow: 0 20px 27px color-mix(in srgb, var(--muse-warning) 22%, rgba(0, 0, 0, 0.16));
  --muse-button-shadow-hover: 0 28px 45px color-mix(in srgb, var(--muse-warning) 26%, rgba(0, 0, 0, 0.2));
}

.muse-button--tone-info {
  --muse-button-color: var(--muse-info);
  --muse-button-gradient: var(--muse-gradient-info);
  --muse-button-shadow: 0 20px 27px color-mix(in srgb, var(--muse-info) 22%, rgba(0, 0, 0, 0.16));
  --muse-button-shadow-hover: 0 28px 45px color-mix(in srgb, var(--muse-info) 26%, rgba(0, 0, 0, 0.2));
}

.muse-button--solid {
  background: var(--muse-button-gradient);
  color: var(--muse-button-solid-text);
  box-shadow: var(--muse-button-shadow);
}

.muse-button--solid:hover {
  transform: translateY(-2px);
  box-shadow: var(--muse-button-shadow-hover);
}

.muse-button--outline {
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--muse-button-color) 45%, transparent);
  color: var(--muse-button-color);
}

.muse-button--link {
  background: transparent;
  border: none;
  padding-inline: 0.25rem;
  box-shadow: none;
  color: var(--muse-button-color);
}

.muse-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
