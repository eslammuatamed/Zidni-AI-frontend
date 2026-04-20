<template>
  <label class="ui-checkbox" :class="checkboxClasses">
    <input
      class="ui-checkbox__control absolute opacity-0 pointer-events-none"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="onChange"
    />
    <span class="ui-checkbox__box">
      <svg
        class="ui-checkbox__mark"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </span>
    <span v-if="$slots.default || label" class="ui-checkbox__label">
      <span class="ui-checkbox__text font-medium text-content"><slot>{{ label }}</slot></span>
      <small v-if="description" class="ui-checkbox__description text-content-muted text-[0.825rem] leading-[1.4]">{{ description }}</small>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    label?: string;
    description?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: false,
    label: '',
    description: '',
    disabled: false
  }
);

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const checkboxClasses = computed(() => ({
  'ui-checkbox--checked': props.modelValue,
  'ui-checkbox--disabled': props.disabled
}));

const onChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
};
</script>

<style scoped>
.ui-checkbox {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--sakai-space-2-5);
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;
  transition: opacity var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-checkbox__box {
  flex-shrink: 0;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: var(--sakai-border-radius-md);
  border: 1.5px solid var(--sakai-border-color);
  background: var(--sakai-surface-card);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all var(--sakai-transition-duration) var(--sakai-transition-ease);
  color: white;
  margin-top: 0.15rem;
}

.ui-checkbox:hover:not(.ui-checkbox--disabled) .ui-checkbox__box {
  border-color: var(--sakai-primary-400);
  background: var(--sakai-surface-ground);
}

.ui-checkbox--checked .ui-checkbox__box {
  background: var(--sakai-primary);
  border-color: var(--sakai-primary);
}

.ui-checkbox:focus-within .ui-checkbox__box {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.ui-checkbox__mark {
  width: 12px;
  height: 12px;
  transform: scale(0.5);
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.12, 0.4, 0.29, 1.46);
}

.ui-checkbox--checked .ui-checkbox__mark {
  transform: scale(1);
  opacity: 1;
}

.ui-checkbox__label {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-0-5);
}


.ui-checkbox--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
