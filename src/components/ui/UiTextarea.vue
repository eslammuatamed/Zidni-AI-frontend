<template>
  <label class="ui-field">
    <span v-if="label" class="ui-field__label">{{ label }}</span>
    <textarea
      class="ui-textarea"
      :class="{ 'ui-textarea--error': Boolean(error) }"
      v-bind="$attrs"
      :rows="rows"
      :value="modelValue"
      @input="onInput"
    ></textarea>
    <span v-if="hint" class="ui-field__hint">{{ hint }}</span>
    <span v-if="error" class="ui-field__error">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    label?: string;
    hint?: string;
    error?: string;
    rows?: number;
  }>(),
  {
    modelValue: '',
    label: '',
    hint: '',
    error: '',
    rows: 3
  }
);

const emit = defineEmits<{ 'update:modelValue': [value: string | number | null] }>();

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
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

.ui-textarea {
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid var(--sakai-border-color);
  padding: 0.75rem 1rem;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--sakai-text-color);
  background: var(--sakai-surface-card);
  resize: vertical;
  min-height: calc(1.5rem * 3);
  box-shadow: var(--sakai-shadow-sm);
  transition: all var(--sakai-transition-duration) var(--sakai-transition-ease);
  width: 100%;
  outline: none;
}

.ui-textarea:hover:not(:disabled):not([readonly]) {
  border-color: var(--sakai-primary-400);
  background: var(--sakai-surface-ground);
}

.ui-textarea:focus:not(:disabled):not([readonly]) {
  border-color: var(--sakai-primary);
  background: var(--sakai-surface-card);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.ui-textarea--error {
  border-color: var(--sakai-danger) !important;
}

.ui-textarea--error:focus {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sakai-danger) 12%, transparent) !important;
}

.ui-textarea:disabled {
  background: var(--sakai-surface-ground);
  opacity: 0.7;
  cursor: not-allowed;
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
