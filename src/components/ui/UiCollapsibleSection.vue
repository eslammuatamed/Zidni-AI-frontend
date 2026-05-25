<!--
  UiCollapsibleSection.vue is a standalone collapsible card used to group form
  sections (e.g. the course editor's Basic Info / Goals / Visual Media / Course
  Content sections). Unlike UiAccordion — which renders one grouped container
  with internal dividers — each UiCollapsibleSection is its own card with its
  own chrome, so several can sit in a column with gaps between them.

  Chrome mirrors the Figma "CollapsibleSection": white surface-card, 1px border
  (--sakai-border-color === #e2e8f0), --sakai-shadow-sm, and a header with a
  tinted icon tile (KPI-card pattern, --sakai-primary-tint-12), title, optional
  badge, and a chevron that rotates when open. All colors come from --sakai-*
  tokens, so light/dark adapt automatically; the header uses logical flex
  spacing (gap / justify-between / text-align: start) so it mirrors in RTL.

  Supports both controlled (v-model) and uncontrolled (default-open) usage.
-->
<template>
  <section
    class="bg-surface-card rounded-sakai-lg shadow-sakai-sm overflow-hidden [border:1px_solid_var(--sakai-border-color)]"
  >
    <button
      type="button"
      class="w-full flex items-center justify-between gap-4 py-4 px-5 bg-transparent border-none cursor-pointer text-start text-content font-[inherit] transition-colors duration-150 ease-in-out hover:bg-[color-mix(in_srgb,var(--sakai-primary)_6%,transparent)]"
      :class="{ '[border-bottom:1px_solid_color-mix(in_srgb,var(--sakai-border-color)_70%,transparent)]': isOpen }"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      @click="toggle"
    >
      <span class="flex items-center gap-3 min-w-0">
        <span
          v-if="icon"
          class="inline-flex items-center justify-center w-7 h-7 rounded-sakai-md bg-[var(--sakai-primary-tint-12)] text-sakai-primary shrink-0"
          aria-hidden="true"
        >
          <UiIcon :name="icon" :size="16" />
        </span>
        <span class="flex flex-col gap-[0.1rem] min-w-0 text-start">
          <span
            class="text-[0.9375rem] font-bold text-content-strong leading-[var(--sakai-line-height-sm,1.4)]"
            >{{ title }}</span
          >
          <span
            v-if="subtitle"
            class="text-[0.8125rem] text-content-tertiary"
          >{{ subtitle }}</span>
        </span>
        <span
          v-if="hasBadge"
          class="shrink-0 py-1 px-[0.6rem] rounded-sakai-md bg-[var(--sakai-primary-tint-12)] text-sakai-primary text-xs font-bold leading-tight whitespace-nowrap"
        >{{ badge }}</span>
      </span>
      <span class="flex items-center gap-2 shrink-0">
        <span
          v-if="$slots['header-actions']"
          @click.stop
        >
          <slot name="header-actions" />
        </span>
        <UiIcon
          name="DownOutlined"
          class="transition-transform duration-150 ease-in-out"
          :class="isOpen ? '-rotate-180 text-sakai-primary' : 'text-content-tertiary'"
          :size="16"
        />
      </span>
    </button>
    <transition
      enter-active-class="transition-all duration-150 ease-in-out"
      leave-active-class="transition-all duration-150 ease-in-out"
      enter-from-class="opacity-0 -translate-y-1"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-show="isOpen"
        :id="panelId"
        class="p-5"
        role="region"
      >
        <slot />
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId } from "vue";
import UiIcon from "@/components/ui/UiIcon.vue";

const props = withDefaults(
  defineProps<{
    title: string;
    icon?: string;
    /** Controlled open state. Omit to use uncontrolled `defaultOpen`. */
    modelValue?: boolean;
    defaultOpen?: boolean;
    badge?: string | number;
    subtitle?: string;
  }>(),
  {
    icon: "",
    modelValue: undefined,
    defaultOpen: false,
    badge: undefined,
    subtitle: "",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const panelId = useId();
const internalOpen = ref(props.defaultOpen);
const isControlled = computed(() => props.modelValue !== undefined);
const isOpen = computed(() =>
  isControlled.value ? Boolean(props.modelValue) : internalOpen.value,
);
const hasBadge = computed(
  () => props.badge !== undefined && props.badge !== null && props.badge !== "",
);

const toggle = () => {
  const next = !isOpen.value;
  if (isControlled.value) {
    emit("update:modelValue", next);
  } else {
    internalOpen.value = next;
  }
};
</script>
