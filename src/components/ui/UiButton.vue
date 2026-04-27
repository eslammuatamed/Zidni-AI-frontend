<template>
  <component
    :is="componentTag"
    v-bind="$attrs"
    :to="props.to"
    :href="href"
    :type="buttonType"
    class="ui-button inline-flex items-center justify-center"
    :class="[variantClass, toneClass]"
  >
    <span
      v-if="prependIcon"
      class="ui-button__icon ui-button__icon--start inline-flex items-center justify-center"
    >
      <UiIcon :name="prependIcon" :size="18" />
    </span>
    <slot />
    <span
      v-if="appendIcon"
      class="ui-button__icon ui-button__icon--end inline-flex items-center justify-center"
    >
      <UiIcon :name="appendIcon" :size="18" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import UiIcon from "./UiIcon.vue";

export type UiVariant = "solid" | "outline" | "link" | "ghost";
export type UiTone = "primary" | "secondary" | "info" | "success" | "danger";

const props = withDefaults(
  defineProps<{
    color?: UiTone | string;
    variant?: UiVariant;
    prependIcon?: string;
    appendIcon?: string;
    to?: string | Record<string, unknown>;
    href?: string;

    buttonType?: "button" | "submit" | "reset";
  }>(),
  {
    color: "primary",
    variant: "solid",
    prependIcon: undefined,
    appendIcon: undefined,
    to: undefined,
    href: undefined,

    buttonType: "button",
  },
);

const componentTag = computed(() => {
  if (props.to) {
    return RouterLink;
  }
  if (props.href) {
    return "a";
  }
  return "button";
});

const variantClass = computed(() => `ui-button--${props.variant}`);
const toneClass = computed(() => `ui-button--tone-${props.color}`);

const prependIcon = computed(() => props.prependIcon);
const appendIcon = computed(() => props.appendIcon);
const buttonType = computed(() =>
  componentTag.value === "button" ? props.buttonType : undefined,
);
const href = computed(() =>
  componentTag.value === "a" ? props.href : undefined,
);
</script>

<style scoped>
.ui-button {
  --ui-button-color: var(--sakai-primary);
  --ui-button-gradient: var(--sakai-gradient-primary);
  --ui-button-shadow: var(--sakai-shadow-md);
  --ui-button-shadow-hover: var(--sakai-shadow-lg);
  --ui-button-solid-text: white;
  gap: var(--sakai-space-2);
  border-radius: var(--sakai-border-radius-md);
  border: none;
  font-weight: var(--sakai-font-weight-medium);
  font-size: 0.95rem;
  padding: 0.6rem 1.35rem;
  cursor: pointer;
  transition:
    transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
  text-decoration: none;
  background: transparent;
  color: var(--ui-button-color);
}

.ui-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.ui-button--tone-secondary {
  --ui-button-color: var(--sakai-secondary);
  --ui-button-gradient: var(--sakai-gradient-secondary);
}

.ui-button--tone-danger {
  --ui-button-color: var(--sakai-danger);
  --ui-button-gradient: var(--sakai-gradient-danger);
}

.ui-button--tone-success {
  --ui-button-color: var(--sakai-success);
  --ui-button-gradient: var(--sakai-gradient-success);
}

.ui-button--tone-info {
  --ui-button-color: var(--sakai-info);
  --ui-button-gradient: var(--sakai-gradient-info);
}

.ui-button--solid {
  background: var(--ui-button-gradient);
  color: var(--ui-button-solid-text);
  box-shadow: var(--ui-button-shadow);
}

.ui-button--solid:hover {
  transform: translateY(-1px);
  box-shadow: var(--ui-button-shadow-hover);
}

.ui-button--outline {
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--ui-button-color) 45%, transparent);
  color: var(--ui-button-color);
}

.ui-button--link {
  background: transparent;
  border: none;
  padding-inline: 0.25rem;
  box-shadow: none;
  color: var(--ui-button-color);
}

.ui-button--ghost {
  background: transparent;
  border: none;
  color: var(--ui-button-color);
}

.ui-button--ghost:hover {
  background: color-mix(in srgb, var(--ui-button-color) 12%, transparent);
}
</style>
