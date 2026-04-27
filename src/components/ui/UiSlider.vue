<template>
  <label class="ui-slider" :class="[`ui-slider--tone-${props.color}`, { 'ui-slider--disabled': props.disabled }]">
    <div class="ui-slider__header">
      <span v-if="props.label" class="ui-slider__label">{{ props.label }}</span>
      <span v-if="props.showValue" class="ui-slider__value">{{ displayValue }}</span>
    </div>
    <input
      class="ui-slider__control"
      type="range"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :value="clampedValue"
      :disabled="props.disabled"
      :style="sliderStyle"
      @input="onInput"
      @change="onChange"
    />
    <span v-if="props.hint" class="ui-slider__hint">{{ props.hint }}</span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UiSliderTone = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    hint?: string;
    disabled?: boolean;
    showValue?: boolean;
    color?: UiSliderTone;
    format?: (value: number) => string;
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    label: '',
    hint: '',
    disabled: false,
    showValue: true,
    color: 'primary',
    format: undefined
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'change', value: number): void;
  (e: 'input', value: number): void;
}>();

const normalizedRange = computed(() => Math.max(props.max - props.min, 1));
const clampedValue = computed(() => Math.min(Math.max(props.modelValue ?? props.min, props.min), props.max));
const percentage = computed(() => ((clampedValue.value - props.min) / normalizedRange.value) * 100);

const sliderStyle = computed(() => ({ '--slider-percent': `${percentage.value}%` }));

const displayValue = computed(() => {
  if (props.format) {
    return props.format(clampedValue.value);
  }
  return `${Math.round(clampedValue.value)}`;
});

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = Number(target.value);
  emit('update:modelValue', value);
  emit('input', value);
};

const onChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = Number(target.value);
  emit('change', value);
};
</script>

<style scoped>
.ui-slider {
  display: grid;
  gap: var(--sakai-space-2);
  --slider-color: var(--sakai-primary);
}

.ui-slider--tone-secondary {
  --slider-color: var(--sakai-secondary);
}

.ui-slider--tone-success {
  --slider-color: var(--sakai-success);
}

.ui-slider--tone-info {
  --slider-color: var(--sakai-info);
}

.ui-slider--tone-warning {
  --slider-color: var(--sakai-warning);
}

.ui-slider--tone-danger {
  --slider-color: var(--sakai-danger);
}

.ui-slider--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.ui-slider__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--sakai-text-color);
  font-weight: var(--sakai-font-weight-medium);
  font-size: 0.9rem;
}

.ui-slider__value {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.ui-slider__control {
  appearance: none;
  width: 100%;
  height: 0.55rem;
  border-radius: var(--sakai-border-radius-pill);
  background: linear-gradient(
      to right,
      var(--slider-color) 0%,
      var(--slider-color) var(--slider-percent),
      color-mix(in srgb, var(--sakai-border-color) 70%, transparent) var(--slider-percent),
      color-mix(in srgb, var(--sakai-border-color) 70%, transparent) 100%
    );
  outline: none;
  transition: background 0.2s ease;
}

.ui-slider__control::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--sakai-surface);
  border: 2px solid var(--slider-color);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--slider-color) 35%, transparent);
  cursor: pointer;
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-slider__control::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--sakai-surface);
  border: 2px solid var(--slider-color);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--slider-color) 35%, transparent);
  cursor: pointer;
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-slider__control:focus-visible::-webkit-slider-thumb,
.ui-slider__control:focus-visible::-moz-range-thumb {
  transform: scale(1.05);
}

.ui-slider__hint {
  font-size: 0.8rem;
  color: var(--sakai-text-color-tertiary);
}
</style>
