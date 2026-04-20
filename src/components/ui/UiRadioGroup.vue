<template>
  <fieldset class="ui-radio-group flex flex-col gap-2 p-0 border-0 m-0" :class="[`ui-radio-group--${props.orientation}`]" :disabled="props.disabled">
    <legend v-if="props.label" class="ui-radio-group__legend">{{ props.label }}</legend>
    <div class="ui-radio-group__options grid gap-2">
      <label
        v-for="option in normalizedOptions"
        :key="option.valueKey"
        class="ui-radio-group__option"
        :class="{
          'is-selected': isSelected(option.value),
          'is-disabled': option.disabled || props.disabled
        }"
      >
        <input
          class="ui-radio-group__input absolute opacity-0 pointer-events-none"
          type="radio"
          :name="props.name"
          :value="option.value"
          :checked="isSelected(option.value)"
          :disabled="option.disabled || props.disabled"
          @change="onSelect(option.value)"
        />
        <span class="ui-radio-group__control"></span>
        <span v-if="option.icon" class="ui-radio-group__media inline-flex items-center justify-center">
          <img :src="option.icon" :alt="option.iconAlt || option.label" />
        </span>
        <div
          v-else-if="option.logos?.length"
          class="ui-radio-group__media cardsLogos inline-flex items-center justify-center"
          aria-hidden="true"
        >
          <img v-for="logo in option.logos" :key="logo.src" :src="logo.src" :alt="logo.alt" />
        </div>
        <span class="ui-radio-group__label">
          <span>{{ option.label }}</span>
          <small v-if="option.description">{{ option.description }}</small>
        </span>
      </label>
    </div>
    <span v-if="props.hint" class="ui-radio-group__hint">{{ props.hint }}</span>
    <span v-if="props.error" class="ui-radio-group__error">{{ props.error }}</span>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type RadioValue = string | number | boolean;

export interface UiRadioOption {
  label: string;
  value: RadioValue;
  description?: string;
  disabled?: boolean;
  icon?: string | null;
  iconAlt?: string | null;
  logos?: { src: string; alt: string }[];
}

const props = withDefaults(
  defineProps<{
    modelValue?: RadioValue | null;
    options: UiRadioOption[];
    name?: string;
    label?: string;
    hint?: string;
    error?: string;
    orientation?: 'vertical' | 'horizontal';
    disabled?: boolean;
  }>(),
  {
    modelValue: null,
    options: () => [],
    name: undefined,
    label: '',
    hint: '',
    error: '',
    orientation: 'vertical',
    disabled: false
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: RadioValue): void; (e: 'change', value: RadioValue): void }>();

const normalizedOptions = computed(() =>
  props.options.map((option, index) => ({
    ...option,
    valueKey: `${index}-${String(option.value)}`
  }))
);

const isSelected = (value: RadioValue) => props.modelValue === value;

const onSelect = (value: RadioValue) => {
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<style scoped>
.ui-radio-group__legend {
  font-size: 0.875rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
  margin-bottom: var(--sakai-space-1);
  margin-inline-start: 0.125rem;
}

.ui-radio-group--horizontal .ui-radio-group__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
}

.ui-radio-group__option {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: 0.75rem 1rem;
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface-card);
  border: 1px solid var(--sakai-border-color);
  cursor: pointer;
  transition: all var(--sakai-transition-duration) var(--sakai-transition-ease);
  position: relative;
  box-shadow: var(--sakai-shadow-sm);
}

.ui-radio-group__option:hover:not(.is-disabled) {
  border-color: var(--sakai-primary-400);
  background: var(--sakai-surface-ground);
}

.ui-radio-group__option.is-selected {
  border-color: var(--sakai-primary);
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
}

.ui-radio-group__option:focus-within {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.ui-radio-group__control {
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  border: 1.5px solid var(--sakai-border-color);
  background: white;
  position: relative;
  flex-shrink: 0;
  transition: all var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-radio-group__option.is-selected .ui-radio-group__control {
  border-color: var(--sakai-primary);
  border-width: 5px;
}

.ui-radio-group__media img {
  display: block;
  max-height: 24px;
}

.ui-radio-group__label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--sakai-text-color);
}

.ui-radio-group__label span {
  font-weight: var(--sakai-font-weight-medium);
  font-size: 0.95rem;
}

.ui-radio-group__label small {
  color: var(--sakai-text-color-muted);
  font-size: 0.825rem;
  line-height: 1.4;
}

.ui-radio-group__hint,
.ui-radio-group__error {
  font-size: 0.75rem;
  margin-top: 0.125rem;
  margin-inline-start: 0.125rem;
}

.ui-radio-group__hint {
  color: var(--sakai-text-color-muted);
}

.ui-radio-group__error {
  color: var(--sakai-danger);
  font-weight: var(--sakai-font-weight-medium);
}

.ui-radio-group__option.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
