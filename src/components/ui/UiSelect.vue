<template>
  <label class="ui-field">
    <span v-if="props.label" class="ui-field__label">{{ props.label }}</span>
    <div class="ui-select" :class="selectClasses">
      <span v-if="hasPrefix" class="ui-select__addon ui-select__addon--start">
        <slot name="prefix">
          <UiIcon v-if="resolvedStartIcon" :name="resolvedStartIcon" :size="16" />
        </slot>
      </span>
      <select
        ref="selectRef"
        class="ui-select__control"
        v-bind="$attrs"
        v-model="internalValue"
        :multiple="isMultiple"
        :disabled="props.disabled"
        @blur="onBlur"
        @focus="onFocus"
        @mousedown="onMousedown"
      >
        <slot />
      </select>
      <button
        v-if="showClear"
        type="button"
        class="ui-select__clear"
        :aria-label="props.clearLabel"
        @click="clearSelection"
      >
        <UiIcon name="CloseOutlined" :size="14" />
      </button>
      <span v-if="hasSuffix" class="ui-select__addon ui-select__addon--end">
        <slot name="suffix">
          <UiIcon v-if="resolvedEndIcon" :name="resolvedEndIcon" :size="16" />
        </slot>
      </span>
    </div>
    <span v-if="props.hint" class="ui-field__hint">{{ props.hint }}</span>
    <span v-if="props.error" class="ui-field__error">{{ props.error }}</span>
  </label>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, useSlots } from 'vue';
import UiIcon from '@/components/ui/UiIcon.vue';

export type SelectValue = string | number | null | Array<string | number>;
type UiSelectAppearance = 'default' | 'date' | 'time' | 'datetime';

const props = withDefaults(
  defineProps<{
    modelValue?: SelectValue;
    label?: string;
    hint?: string;
    error?: string;
    startIcon?: string;
    endIcon?: string;
    clearable?: boolean;
    clearLabel?: string;
    disabled?: boolean;
    appearance?: UiSelectAppearance;
    multiple?: boolean;
  }>(),
  {
    modelValue: '',
    label: '',
    hint: '',
    error: '',
    startIcon: undefined,
    endIcon: undefined,
    clearable: false,
    clearLabel: 'Clear selection',
    disabled: false,
    appearance: 'default',
    multiple: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: SelectValue): void;
  (e: 'change', value: SelectValue): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'clear'): void;
}>();

const slots = useSlots();
const attrs = useAttrs();
const selectRef = ref<HTMLSelectElement | null>(null);

const isMultiple = computed(() => props.multiple || Boolean(attrs.multiple));

const internalValue = computed({
  get: () => {
    if (isMultiple.value) {
      if (Array.isArray(props.modelValue)) {
        return props.modelValue;
      }
      return props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '' ? [props.modelValue] : [];
    }
    return props.modelValue ?? '';
  },
  set: (val) => {
    emit('update:modelValue', val);
    emit('change', val);
  }
});

const resolvedStartIcon = computed(() => {
  if (props.startIcon) return props.startIcon;
  const app = props.appearance;
  if (app === 'date' || app === 'datetime') return 'CalendarOutlined';
  if (app === 'time') return 'ClockCircleOutlined';
  return undefined;
});

const resolvedEndIcon = computed(() => props.endIcon ?? 'DownOutlined');

const hasPrefix = computed(() => Boolean(resolvedStartIcon.value) || Boolean(slots.prefix));
const hasSuffix = computed(() => Boolean(resolvedEndIcon.value) || Boolean(slots.suffix));

const showClear = computed(() => {
  if (!props.clearable || props.disabled) return false;
  if (isMultiple.value) {
    return Array.isArray(internalValue.value) && internalValue.value.length > 0;
  }
  return internalValue.value !== '' && internalValue.value !== null;
});

const selectClasses = computed(() => ({
  'ui-select--error': Boolean(props.error),
  'ui-select--with-prefix': hasPrefix.value,
  'ui-select--with-suffix': hasSuffix.value,
  'ui-select--disabled': props.disabled
}));



const onBlur = (event: FocusEvent) => emit('blur', event);
const onFocus = (event: FocusEvent) => emit('focus', event);

const onMousedown = (event: MouseEvent) => {
  if (!isMultiple.value || props.disabled) return;

  const target = event.target as HTMLElement;
  if (target.tagName !== 'OPTION') return;

  event.preventDefault();

  const option = target as HTMLOptionElement;
  const realValue = '_value' in option ? (option as any)._value : option.value;

  const currentValues = Array.isArray(internalValue.value) ? [...internalValue.value] : [];
  const index = currentValues.findIndex(v => v === realValue || String(v) === String(realValue));

  if (index === -1) {
    currentValues.push(realValue);
  } else {
    currentValues.splice(index, 1);
  }

  internalValue.value = currentValues;

  if (selectRef.value) {
    selectRef.value.focus();
  }
};

const clearSelection = () => {
  if (isMultiple.value) {
    internalValue.value = [];
  } else {
    internalValue.value = '';
  }
  emit('clear');
};
</script>

<style scoped>
.ui-field {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1-5);
}

.ui-field__label {
  font-size: 0.875rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
  margin-inline-start: 0.125rem;
}

.ui-select {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface-card);
  border: 1px solid var(--sakai-border-color);
  transition: all var(--sakai-transition-duration) var(--sakai-transition-ease);
  box-shadow: var(--sakai-shadow-sm);
  overflow: hidden;
}

.ui-select:hover:not(.ui-select--disabled) {
  border-color: var(--sakai-primary-400);
  background: var(--sakai-surface-ground);
}

.ui-select:focus-within:not(.ui-select--disabled) {
  border-color: var(--sakai-primary);
  background: var(--sakai-surface-card);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.ui-select--error {
  border-color: var(--sakai-danger) !important;
}

.ui-select--error:focus-within {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sakai-danger) 12%, transparent) !important;
}

.ui-select--disabled {
  background: var(--sakai-surface-ground);
  opacity: 0.7;
  cursor: not-allowed;
}

.ui-select__control {
  appearance: none;
  flex: 1;
  border: none;
  outline: none;
  padding: 0.7rem 2.5rem 0.7rem 1rem;
  background: transparent;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--sakai-text-color);
  cursor: pointer;
  width: 100%;
}

.ui-select__control[multiple] {
  height: auto;
  padding-right: 1rem;
}

.ui-select__addon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sakai-text-color-tertiary);
  padding-inline: 0.75rem;
  pointer-events: none;
}

.ui-select__addon--start {
  padding-inline-end: 0;
}

.ui-select__addon--end {
  position: absolute;
  right: 0.75rem;
  pointer-events: none;
}

.ui-select__clear {
  position: absolute;
  right: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--sakai-text-color-tertiary);
  cursor: pointer;
  border-radius: var(--sakai-border-radius-md);
  transition: all 0.2s;
}

.ui-select__clear:hover {
  background: var(--sakai-danger-100);
  color: var(--sakai-danger-600);
}

.ui-field__hint,
.ui-field__error {
  font-size: 0.75rem;
  margin-top: 0.125rem;
  margin-inline-start: 0.125rem;
}

.ui-field__hint {
  color: var(--sakai-text-color-muted);
}

.ui-field__error {
  color: var(--sakai-danger);
  font-weight: var(--sakai-font-weight-medium);
}
</style>
