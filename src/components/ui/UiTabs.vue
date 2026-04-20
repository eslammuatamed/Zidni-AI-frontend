<template>
  <div class="ui-tabs flex flex-col gap-4" :class="[`ui-tabs--${variant}`, { 'ui-tabs--grow': grow }]">
    <div class="ui-tabs__nav">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="ui-tabs__item"
        :class="{ 'is-active': tab.value === modelValue }"
        type="button"
        @click="select(tab.value)"
      >
        <span>{{ tab.label }}</span>
        <span v-if="tab.badge" class="ui-tabs__badge">{{ tab.badge }}</span>
      </button>
    </div>
    <div class="ui-tabs__content mt-0">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface TabItem {
  label: string;
  value: string | number;
  badge?: string | number;
}

import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    tabs: TabItem[];
    variant?: 'underline' | 'pill';
    grow?: boolean;
  }>(),
  {
    variant: 'underline',
    grow: false
  }
);

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>();

const select = (value: string | number) => emit('update:modelValue', value);
const modelValue = computed(() => props.modelValue);
</script>

<style scoped>
.ui-tabs__nav {
  display: flex;
  gap: var(--sakai-space-2);
  border-bottom: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
}

.ui-tabs--grow .ui-tabs__nav {
  width: 100%;
}

.ui-tabs--grow .ui-tabs__item {
  flex: 1;
  justify-content: center;
}

.ui-tabs__item {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
  padding: 0.75rem 1.25rem;
  border: none;
  background: transparent;
  font: inherit;
  color: var(--sakai-text-color-tertiary);
  border-radius: var(--sakai-border-radius-pill);
  cursor: pointer;
  position: relative;
  transition: color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-tabs--underline .ui-tabs__item.is-active {
  color: var(--sakai-primary-700);
}

.ui-tabs--underline .ui-tabs__item.is-active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -1px;
  width: 60%;
  height: 3px;
  background: var(--sakai-primary);
  border-radius: var(--sakai-border-radius-pill);
  transform: translateX(-50%);
}

.ui-tabs--pill .ui-tabs__item {
  border-radius: var(--sakai-border-radius-pill);
  background: transparent;
}

.ui-tabs--pill .ui-tabs__item.is-active {
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  color: var(--sakai-primary-700);
}

.ui-tabs__badge {
  font-size: 0.75rem;
  background: color-mix(in srgb, var(--sakai-primary) 16%, transparent);
  color: var(--sakai-primary-700);
  border-radius: var(--sakai-border-radius-pill);
  padding: 0.1rem 0.45rem;
}
</style>
