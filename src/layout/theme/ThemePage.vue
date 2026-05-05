<!--
  ThemePage.vue structures interior views with a standardized heading region,
  optional sidebar, and contextual metadata slots. Props: title, subtitle, and
  badge strings that populate the page header; slots expose badge, actions,
  meta, sidebar, and default content areas.
-->
<template>
  <section class="theme-page w-full">
    <header v-if="hasHeader" class="theme-page__header">
      <div class="theme-page__heading">
        <div class="theme-page__headline">
          <slot name="badge">
            <span v-if="badge" class="theme-chip">{{ badge }}</span>
          </slot>
          <h2 v-if="title" class="theme-page__title">{{ title }}</h2>
          <p v-if="subtitle" class="theme-page__subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions" class="theme-page__actions">
          <slot name="actions" />
        </div>
      </div>
      <div v-if="$slots.meta" class="theme-page__meta">
        <slot name="meta" />
      </div>
    </header>
    <div class="theme-page__body w-full">
      <main class="theme-page__main w-full">
        <slot />
      </main>
      <aside v-if="$slots.sidebar" class="theme-page__sidebar">
        <slot name="sidebar" />
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    badge?: string;
  }>(),
  {
    title: "",
    subtitle: "",
    badge: "",
  },
);

const slots = useSlots();

/**
 * Determines whether the page header should be rendered based on provided
 * props or named slots.
 *
 * @returns True when any heading content is available.
 */
const hasHeader = computed(() =>
  Boolean(
    props.title ||
    props.subtitle ||
    props.badge ||
    slots.badge ||
    slots.actions ||
    slots.meta,
  ),
);
/**
 * Returns the reactive page title so child components can access it in the
 * template.
 *
 * @returns Title string for the header element.
 */
const title = computed(() => props.title);
/**
 * Exposes the optional subtitle text passed to the component.
 *
 * @returns Subtitle string shown beneath the main heading.
 */
const subtitle = computed(() => props.subtitle);
/**
 * Provides the badge copy that appears above the heading when supplied.
 *
 * @returns Badge label string or an empty string when unset.
 */
const badge = computed(() => props.badge);
</script>

<style scoped>
.theme-page__meta {
  display: grid;
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-4);
}
</style>
