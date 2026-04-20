<template>
  <section class="ui-card" :class="{ 'ui-card--hover': hover }">
    <header v-if="hasHeader" class="ui-card__header">
      <div class="ui-card__titles flex flex-col gap-2">
        <slot name="title">
          <h3 v-if="title" class="ui-card__title m-0 text-[1.05rem] font-semibold text-content">{{ title }}</h3>
        </slot>
        <slot name="subtitle">
          <p v-if="subtitle" class="ui-card__subtitle m-0 text-content-tertiary text-[0.9rem]">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="ui-card__actions flex items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <div class="ui-card__body p-5 flex flex-col gap-4">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    hover?: boolean;
  }>(),
  {
    hover: false
  }
);

const slots = useSlots();

const hasHeader = computed(() => Boolean(props.title || props.subtitle || slots.title || slots.subtitle || slots.actions));
const hover = computed(() => props.hover);
const title = computed(() => props.title);
const subtitle = computed(() => props.subtitle);
</script>

<style scoped>
.ui-card {
  background: var(--sakai-surface-card);
  border-radius: var(--sakai-border-radius-xl);
  box-shadow: var(--sakai-shadow-md);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 85%, transparent);
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-card--hover:hover {
  transform: translateY(-3px);
  box-shadow: var(--sakai-shadow-lg);
}

.ui-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4) var(--sakai-space-5) var(--sakai-space-3);
  border-bottom: 1px solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
}

</style>
