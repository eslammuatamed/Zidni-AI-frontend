<template>
  <nav class="category-selector" :aria-label="categoryNavLabel">
    <ul>
      <li v-for="category in categories" :key="category">
        <button
          type="button"
          class="category-selector__pill"
          :class="{ 'category-selector__pill--active': modelValue === category }"
          :aria-pressed="modelValue === category"
          @click="select(category)"
          @keyup.enter.prevent="select(category)"
          @keyup.space.prevent="select(category)"
        >
          {{ labelFor(category) }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  categories: string[];
  modelValue: string | null;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string]; select: [value: string] }>();

const { t } = useI18n();

const categoryNavLabel = computed(() => t('labEnglish.accessibility.categoryNav'));

const labelFor = (category: string) => t(`labEnglish.categories.${category}` as const, category);

const select = (category: string) => {
  emit('update:modelValue', category);
  emit('select', category);
};
</script>

<style scoped>
.category-selector {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.category-selector ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-selector__pill {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--muse-border, #d1d5db);
  background: var(--muse-surface, #ffffff);
  color: var(--muse-text, #111827);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.category-selector__pill:hover,
.category-selector__pill:focus-visible {
  background: var(--muse-primary-50, #e0f2fe);
  color: var(--muse-primary-700, #1d4ed8);
  box-shadow: var(--muse-shadow-sm, 0 3px 8px rgba(30, 64, 175, 0.15));
  outline: none;
}

.category-selector__pill--active {
  background: var(--muse-primary, #2563eb);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35);
}
</style>
