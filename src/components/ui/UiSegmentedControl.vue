<template>
  <div class="ui-segmented" :class="[{ 'ui-segmented--full': props.fullWidth }, `ui-segmented--${props.size}`]">
    <button
      v-for="option in normalizedOptions"
      :key="option.valueKey"
      type="button"
      class="ui-segmented__option"
      :class="{
        'is-active': isActive(option.value),
        'is-disabled': option.disabled
      }"
      :disabled="option.disabled"
      @click="selectOption(option.value)"
    >
      <span class="ui-segmented__label inline-flex items-center justify-center gap-2">
        <UiIcon v-if="option.icon" :name="option.icon" :size="iconSize" />
        <span>{{ option.label }}</span>
      </span>
      <small v-if="option.description" class="ui-segmented__description text-[0.7rem] text-content-tertiary">{{ option.description }}</small>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiIcon from '@/components/ui/UiIcon.vue';

type SegmentedValue = string | number;

export interface UiSegmentedOption {
  label: string;
  value: SegmentedValue;
  icon?: string;
  description?: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue?: SegmentedValue | null;
    options: UiSegmentedOption[];
    size?: 'sm' | 'md';
    fullWidth?: boolean;
  }>(),
  {
    modelValue: null,
    options: () => [],
    size: 'md',
    fullWidth: false
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: SegmentedValue): void; (e: 'change', value: SegmentedValue): void }>();

const normalizedOptions = computed(() =>
  props.options.map((option, index) => ({
    ...option,
    valueKey: `${index}-${String(option.value)}`
  }))
);

const iconSize = computed(() => (props.size === 'sm' ? 14 : 16));

const isActive = (value: SegmentedValue) => props.modelValue === value;

const selectOption = (value: SegmentedValue) => {
  if (props.modelValue === value) {
    return;
  }
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<style scoped>
.ui-segmented {
  display: inline-grid;
  grid-auto-flow: column;
  align-items: stretch;
  background: color-mix(in srgb, var(--sakai-primary) 10%, transparent);
  border-radius: var(--sakai-border-radius-pill);
  padding: 0.25rem;
  gap: 0.25rem;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--sakai-primary) 25%, transparent);
}

.ui-segmented--full {
  display: grid;
  width: 100%;
}

.ui-segmented--sm {
  padding: 0.2rem;
}

.ui-segmented__option {
  border: none;
  background: transparent;
  border-radius: var(--sakai-border-radius-pill);
  color: var(--sakai-text-color-tertiary);
  display: grid;
  gap: 0.15rem;
  align-content: center;
  padding: 0.45rem 0.9rem;
  font-size: 0.9rem;
  font-weight: var(--sakai-font-weight-medium);
  cursor: pointer;
  transition: all var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-segmented--sm .ui-segmented__option {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
}

.ui-segmented__option.is-disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.ui-segmented__option:hover:not(.is-active):not(.is-disabled) {
  background: color-mix(in srgb, var(--sakai-primary) 18%, transparent);
  color: var(--sakai-text-color-secondary);
}

.ui-segmented__option.is-active {
  background: var(--sakai-surface);
  color: var(--sakai-primary);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--sakai-primary) 22%, transparent);
}

</style>
