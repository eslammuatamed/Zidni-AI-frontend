<template>
  <section class="muse-card" :class="{ 'muse-card--hover': hover }">
    <header v-if="hasHeader" class="muse-card__header">
      <div class="muse-card__titles">
        <slot name="title">
          <h3 v-if="title" class="muse-card__title">{{ title }}</h3>
        </slot>
        <slot name="subtitle">
          <p v-if="subtitle" class="muse-card__subtitle">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="muse-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="muse-card__body">
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
</script>

<style scoped>
.muse-card {
  background: var(--muse-surface);
  border-radius: var(--muse-radius-xl);
  box-shadow: var(--muse-shadow-base);
  border: 1px solid var(--muse-border);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.muse-card--hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 32px 45px color-mix(in srgb, var(--muse-primary) 18%, rgba(0, 0, 0, 0.16));
}

.muse-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 1.1rem 1.35rem 0.6rem;
  border-bottom: 1px solid var(--muse-border);
}

.muse-card__titles {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.muse-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: var(--muse-font-bold);
  color: var(--muse-text-heading);
}

.muse-card__subtitle {
  margin: 0;
  color: var(--muse-text-muted);
  font-size: 0.85rem;
}

.muse-card__body {
  padding: 1.3rem 1.35rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.muse-card__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
</style>
