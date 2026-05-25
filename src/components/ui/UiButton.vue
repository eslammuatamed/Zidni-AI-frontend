<template>
  <component
    :is="componentTag"
    v-bind="$attrs"
    :to="props.to"
    :href="href"
    :type="buttonType"
    class="ui-button inline-flex items-center justify-center"
    :class="[variantClass, toneClass, sizeClass]"
  >
    <span
      v-if="prependIcon"
      class="ui-button__icon ui-button__icon--start inline-flex items-center justify-center"
    >
      <UiIcon :name="prependIcon" :size="iconSize" />
    </span>
    <slot />
    <span
      v-if="appendIcon"
      class="ui-button__icon ui-button__icon--end inline-flex items-center justify-center"
    >
      <UiIcon :name="appendIcon" :size="iconSize" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import UiIcon from "./UiIcon.vue";

export type UiVariant = "solid" | "outline" | "link" | "ghost" | "soft";
export type UiSize = "xs" | "sm" | "md" | "lg";
export type UiTone =
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "danger"
  | "neutral";

const props = withDefaults(
  defineProps<{
    color?: UiTone | string;
    variant?: UiVariant;
    size?: UiSize;
    prependIcon?: string;
    appendIcon?: string;
    to?: string | Record<string, unknown>;
    href?: string;

    buttonType?: "button" | "submit" | "reset";
  }>(),
  {
    color: "primary",
    variant: "solid",
    size: "md",
    prependIcon: undefined,
    appendIcon: undefined,
    to: undefined,
    href: undefined,

    buttonType: "button",
  },
);

const ICON_SIZE_BY_BUTTON: Record<UiSize, number> = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
};

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
const sizeClass = computed(() => `ui-button--size-${props.size}`);
const iconSize = computed(() => ICON_SIZE_BY_BUTTON[props.size] ?? 18);

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
  /* Size-driven metrics (md defaults; overridden by .ui-button--size-* below).
     Padding is sourced from vars so variant rules like --link can still
     override the inline padding independently of the chosen size. */
  --ui-button-pad-y: 0.6rem;
  --ui-button-pad-x: 1.35rem;
  --ui-button-font-size: 0.95rem;
  gap: var(--sakai-space-2);
  border-radius: var(--sakai-border-radius-md);
  border: none;
  font-weight: var(--sakai-font-weight-medium);
  font-size: var(--ui-button-font-size);
  padding: var(--ui-button-pad-y) var(--ui-button-pad-x);
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

/* Size scale. md is the base (values match the legacy fixed padding, so
   call sites that omit `size` are visually unchanged). */
.ui-button--size-xs {
  --ui-button-pad-y: 0.25rem;
  --ui-button-pad-x: 0.65rem;
  --ui-button-font-size: 0.75rem;
  gap: var(--sakai-space-1);
}

.ui-button--size-sm {
  --ui-button-pad-y: 0.4rem;
  --ui-button-pad-x: 0.9rem;
  --ui-button-font-size: 0.85rem;
}

.ui-button--size-lg {
  --ui-button-pad-y: 0.8rem;
  --ui-button-pad-x: 1.75rem;
  --ui-button-font-size: 1.05rem;
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

.ui-button--tone-neutral {
  --ui-button-color: var(--sakai-text-color);
  --ui-button-gradient: var(--sakai-text-color-strong);
  --ui-button-solid-text: var(--sakai-surface-card);
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

/* Soft (tonal) variant: persistent low-opacity tint of the tone color, no
   border, no shadow. Works for any tone via --ui-button-color. */
.ui-button--soft {
  background: color-mix(in srgb, var(--ui-button-color) 10%, transparent);
  color: var(--ui-button-color);
  border: none;
  box-shadow: none;
}

.ui-button--soft:hover {
  background: color-mix(in srgb, var(--ui-button-color) 15%, transparent);
}

/* Neutral tone uses the surface border + text tokens rather than a brand color,
   so the outline reads as a quiet, non-branded affordance. */
.ui-button--outline.ui-button--tone-neutral {
  border-color: var(--sakai-border-color);
  color: var(--sakai-text-color);
}

.ui-button--outline.ui-button--tone-neutral:hover {
  background: color-mix(in srgb, var(--sakai-text-color-tertiary) 6%, transparent);
}

.ui-button--link.ui-button--tone-neutral:hover {
  color: var(--sakai-text-color-strong);
}
</style>
