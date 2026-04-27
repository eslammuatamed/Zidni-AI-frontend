<template>
  <label class="ui-field">
    <span v-if="props.label" class="ui-field__label">{{ props.label }}</span>
    <div class="ui-input" :class="inputClasses">
      <span v-if="hasPrefix" class="ui-input__addon ui-input__addon--start">
        <slot name="prefix">
          <UiIcon v-if="resolvedStartIcon" :name="resolvedStartIcon" :size="16" />
        </slot>
      </span>
      <input
        class="ui-input__control"
        v-bind="$attrs"
        :type="inputType"
        :value="inputValue"
        :disabled="props.disabled"
        :readonly="props.readonly"
        @input="onInput"
        @change="onNativeChange"
        @blur="onBlur"
        @focus="onFocus"
      />
      <button
        v-if="showClear"
        type="button"
        class="ui-input__clear"
        :aria-label="props.clearLabel"
        @click="clearValue"
      >
        <UiIcon name="CloseOutlined" :size="14" />
      </button>
      <span v-if="hasSuffix" class="ui-input__addon ui-input__addon--end">
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
import { computed, useSlots } from 'vue';
import UiIcon from '@/components/ui/UiIcon.vue';

type UiInputAppearance = 'default' | 'date' | 'time' | 'datetime' | 'search';

type ModelValue = string | number | null;

const props = withDefaults(
  defineProps<{
    modelValue?: ModelValue;
    type?: string;
    label?: string;
    hint?: string;
    error?: string;
    startIcon?: string;
    endIcon?: string;
    clearable?: boolean;
    clearLabel?: string;
    disabled?: boolean;
    readonly?: boolean;
    appearance?: UiInputAppearance;
  }>(),
  {
    modelValue: '',
    type: 'text',
    label: '',
    hint: '',
    error: '',
    startIcon: undefined,
    endIcon: undefined,
    clearable: false,
    clearLabel: 'Clear input',
    disabled: false,
    readonly: false,
    appearance: 'default'
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: ModelValue): void;
  (e: 'change', value: ModelValue): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'clear'): void;
}>();

const slots = useSlots();

const inputType = computed(() => props.type ?? 'text');
const inputValue = computed(() => props.modelValue ?? '');

const isDateAppearance = computed(
  () => props.appearance === 'date' || props.appearance === 'datetime' || inputType.value === 'date' || inputType.value === 'datetime-local'
);
const isTimeAppearance = computed(
  () => props.appearance === 'time' || props.appearance === 'datetime' || inputType.value === 'time'
);

const resolvedStartIcon = computed(() => {
  if (props.startIcon) return props.startIcon;
  if (props.appearance === 'search') return 'SearchOutlined';
  if (isDateAppearance.value) return 'CalendarOutlined';
  if (isTimeAppearance.value) return 'ClockCircleOutlined';
  return undefined;
});

const resolvedEndIcon = computed(() => props.endIcon);

const hasPrefix = computed(() => Boolean(resolvedStartIcon.value) || Boolean(slots.prefix));
const hasSuffix = computed(() => Boolean(resolvedEndIcon.value) || Boolean(slots.suffix));

const showClear = computed(
  () => props.clearable && !props.disabled && !props.readonly && `${inputValue.value}`.length > 0
);

const inputClasses = computed(() => ({
  'ui-input--error': Boolean(props.error),
  'ui-input--with-prefix': hasPrefix.value,
  'ui-input--with-suffix': hasSuffix.value,
  'ui-input--disabled': props.disabled,
  'ui-input--readonly': props.readonly
}));

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const onNativeChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('change', target.value);
};

const onBlur = (event: FocusEvent) => {
  emit('blur', event);
};

const onFocus = (event: FocusEvent) => {
  emit('focus', event);
};

const clearValue = () => {
  emit('update:modelValue', '');
  emit('change', '');
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

.ui-input {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface-card);
  border: 1px solid var(--sakai-border-color);
  transition: all var(--sakai-transition-duration) var(--sakai-transition-ease);
  box-shadow: var(--sakai-shadow-sm);
}

.ui-input:hover:not(.ui-input--disabled):not(.ui-input--readonly) {
  border-color: var(--sakai-primary-400);
  background: var(--sakai-surface-ground);
}

.ui-input:focus-within:not(.ui-input--disabled):not(.ui-input--readonly) {
  border-color: var(--sakai-primary);
  background: var(--sakai-surface-card);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.ui-input--error {
  border-color: var(--sakai-danger) !important;
}

.ui-input--error:focus-within {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sakai-danger) 12%, transparent) !important;
}

.ui-input--disabled {
  background: var(--sakai-surface-ground);
  opacity: 0.7;
  cursor: not-allowed;
}

.ui-input__control {
  flex: 1;
  padding: 0.7rem 1rem;
  border: none;
  background: transparent;
  color: var(--sakai-text-color);
  font-size: 0.95rem;
  font-family: inherit;
  width: 100%;
  outline: none;
  min-width: 0;
}

.ui-input__control::placeholder {
  color: var(--sakai-text-color-tertiary);
}

.ui-input__addon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sakai-text-color-tertiary);
  padding-inline: 0.75rem;
  pointer-events: none;
}

.ui-input__addon--start {
  padding-inline-end: 0;
}

.ui-input__addon--end {
  padding-inline-start: 0;
}

.ui-input__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--sakai-text-color-tertiary);
  border-radius: var(--sakai-border-radius-md);
  margin-inline-end: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.ui-input__clear:hover {
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
