<template>
  <label class="ui-field ui-datetime-picker">
    <span v-if="label" class="ui-field__label">{{ label }}</span>
    <div class="ui-datetime-picker__control" :class="controlClasses">
      <div class="ui-datetime-picker__segment">
        <UiIcon name="CalendarOutlined" :size="16" />
        <input
          ref="dateInput"
          class="ui-datetime-picker__input"
          type="date"
          :value="datePart"
          :min="minDate"
          :max="maxDate"
          :required="required"
          :disabled="disabled"
          :readonly="readonly"
          @input="onDateInput"
          @change="onDateChange"
          @blur="onDateBlur"
          @focus="onDateFocus"
        />
      </div>
      <span class="ui-datetime-picker__separator">{{ separatorLabel }}</span>
      <div class="ui-datetime-picker__segment">
        <UiIcon name="ClockCircleOutlined" :size="16" />
        <input
          ref="timeInput"
          class="ui-datetime-picker__input"
          type="time"
          :value="timePart"
          :step="timeStep"
          :required="required"
          :disabled="disabled"
          :readonly="readonly"
          @input="onTimeInput"
          @change="onTimeChange"
          @blur="onTimeBlur"
          @focus="onTimeFocus"
        />
      </div>
      <button
        v-if="showClear"
        type="button"
        class="ui-datetime-picker__clear"
        :aria-label="resolvedClearLabel"
        @click="clearValue"
      >
        <UiIcon name="CloseOutlined" :size="14" />
      </button>
      <button
        v-if="showConfirm"
        type="button"
        class="ui-datetime-picker__confirm"
        :aria-label="resolvedConfirmLabel"
        @click="confirmValue"
      >
        {{ resolvedConfirmLabel }}
      </button>
    </div>
    <span v-if="hint" class="ui-field__hint">{{ hint }}</span>
    <span v-if="error" class="ui-field__error">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiIcon from '@/components/ui/UiIcon.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    label?: string;
    hint?: string;
    error?: string;
    clearable?: boolean;
    clearLabel?: string;
    confirmLabel?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    minDate?: string;
    maxDate?: string;
    timeStep?: number;
  }>(),
  {
    modelValue: '',
    label: '',
    hint: '',
    error: '',
    clearable: false,
    clearLabel: '',
    confirmLabel: '',
    disabled: false,
    readonly: false,
    required: false,
    minDate: undefined,
    maxDate: undefined,
    timeStep: 60,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
}>();

const { t, locale } = useI18n();

const resolvedClearLabel = computed(() => props.clearLabel || t('common.clear') || 'Clear');
const resolvedConfirmLabel = computed(() => props.confirmLabel || t('common.done') || 'Done');

const datePart = ref('');
const timePart = ref('');

const dateInput = ref<HTMLInputElement | null>(null);
const timeInput = ref<HTMLInputElement | null>(null);

const separatorLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, { hour: 'numeric' }).resolvedOptions().hour12 ? '·' : '•'
);

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      datePart.value = '';
      timePart.value = '';
      return;
    }
    const [date, time] = value.split('T');
    if (date) {
      datePart.value = date;
    }
    if (time) {
      timePart.value = time.slice(0, 5);
    }
  },
  { immediate: true }
);

const controlClasses = computed(() => ({
  'ui-datetime-picker__control--error': Boolean(props.error),
  'ui-datetime-picker__control--disabled': props.disabled,
  'ui-datetime-picker__control--readonly': props.readonly,
}));

const showClear = computed(
  () => props.clearable && !props.disabled && !props.readonly && Boolean(datePart.value || timePart.value)
);

const showConfirm = computed(() => !props.disabled && !props.readonly);

function normalizedValue() {
  if (!datePart.value) {
    return '';
  }
  const time = timePart.value || '00:00';
  return `${datePart.value}T${time}`;
}

function updateValue(triggerChange = false) {
  const value = normalizedValue();
  emit('update:modelValue', value);
  if (triggerChange) {
    emit('change', value);
  }
}

function onDateInput(event: Event) {
  const target = event.target as HTMLInputElement;
  datePart.value = target.value;
  updateValue();
}

function onDateChange() {
  updateValue(true);
}

function onTimeInput(event: Event) {
  const target = event.target as HTMLInputElement;
  timePart.value = target.value;
  updateValue();
}

function onTimeChange() {
  updateValue(true);
}

function onDateBlur(event: FocusEvent) {
  emit('blur', event);
}

function onTimeBlur(event: FocusEvent) {
  emit('blur', event);
}

function onDateFocus(event: FocusEvent) {
  emit('focus', event);
}

function onTimeFocus(event: FocusEvent) {
  emit('focus', event);
}

function clearValue() {
  datePart.value = '';
  timePart.value = '';
  updateValue(true);
  if (dateInput.value) {
    dateInput.value.focus();
  }
}

function confirmValue() {
  updateValue(true);
}
</script>

<style scoped>
.ui-datetime-picker {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.ui-datetime-picker__control {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: 0.65rem 1rem;
  background: var(--sakai-surface-card);
  border: 1px solid var(--sakai-border-color);
  border-radius: var(--sakai-border-radius-lg);
  box-shadow: var(--sakai-shadow-sm);
  transition: all var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-datetime-picker__control:focus-within:not(.ui-datetime-picker__control--disabled):not(.ui-datetime-picker__control--readonly) {
  border-color: var(--sakai-primary);
  background: var(--sakai-surface-card);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.ui-datetime-picker__control--error {
  border-color: var(--sakai-danger) !important;
}

.ui-datetime-picker__control--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--sakai-surface-ground);
}

.ui-datetime-picker__segment {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2-5);
  color: var(--sakai-text-color-secondary);
  flex: 1;
}

.ui-datetime-picker__input {
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--sakai-text-color);
  outline: none;
  width: 100%;
  cursor: pointer;
}

.ui-datetime-picker__input:disabled {
  cursor: not-allowed;
}

.ui-datetime-picker__separator {
  color: var(--sakai-text-color-tertiary);
  font-size: 1.25rem;
  font-weight: var(--sakai-font-weight-bold);
  line-height: 1;
  padding-bottom: 2px;
}

.ui-datetime-picker__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  border: none;
  background: transparent;
  color: var(--sakai-text-color-tertiary);
  border-radius: var(--sakai-border-radius-full);
  cursor: pointer;
  transition: all 0.2s;
}

.ui-datetime-picker__clear:hover {
  background: var(--sakai-surface-alt);
  color: var(--sakai-danger);
}

.ui-datetime-picker__confirm {
  border: none;
  background: var(--sakai-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--sakai-border-radius-md);
  font-weight: var(--sakai-font-weight-semibold);
  font-size: 0.875rem;
  cursor: pointer;
  margin-inline-start: auto;
  transition: all 0.2s;
  box-shadow: var(--sakai-shadow-sm);
}

.ui-datetime-picker__confirm:hover {
  background: var(--sakai-primary-600);
  transform: translateY(-1px);
  box-shadow: var(--sakai-shadow-md);
}

.ui-datetime-picker__confirm:active {
  transform: translateY(0);
}

@media (max-width: 640px) {
  .ui-datetime-picker__control {
    flex-wrap: wrap;
    gap: var(--sakai-space-3);
  }

  .ui-datetime-picker__separator {
    display: none;
  }

  .ui-datetime-picker__confirm {
    width: 100%;
    margin-inline-start: 0;
  }
}
</style>
