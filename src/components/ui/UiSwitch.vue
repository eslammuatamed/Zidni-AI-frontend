<template>
  <label class="ui-switch" :class="{ 'ui-switch--checked': modelValue }">
    <input
      class="ui-switch__control absolute opacity-0 pointer-events-none"
      type="checkbox"
      :checked="modelValue"
      @change="onChange"
    />
    <span class="ui-switch__track">
      <span class="ui-switch__thumb"></span>
    </span>
    <span v-if="label" class="ui-switch__label font-medium text-content">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    label?: string;
  }>(),
  {
    modelValue: false,
    label: ''
  }
);

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const modelValue = computed(() => props.modelValue);
const label = computed(() => props.label);

const onChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
};
</script>

<style scoped>
.ui-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2-5);
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;
}

.ui-switch__track {
  --switch-width: 2.5rem;
  --switch-height: 1.4rem;
  --switch-padding: 3px;
  position: relative;
  width: var(--switch-width);
  height: var(--switch-height);
  border-radius: 999px;
  background: var(--sakai-surface-alt);
  border: 1px solid var(--sakai-border-color);
  transition: all var(--sakai-transition-duration) var(--sakai-transition-ease);
  display: flex;
  align-items: center;
}

.ui-switch:hover .ui-switch__track {
  border-color: var(--sakai-primary-400);
}

.ui-switch--checked .ui-switch__track {
  background: var(--sakai-primary);
  border-color: var(--sakai-primary);
}

.ui-switch:focus-within .ui-switch__track {
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.ui-switch__thumb {
  position: absolute;
  left: var(--switch-padding);
  width: calc(var(--switch-height) - (var(--switch-padding) * 2));
  height: calc(var(--switch-height) - (var(--switch-padding) * 2));
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.ui-switch--checked .ui-switch__thumb {
  transform: translateX(calc(var(--switch-width) - var(--switch-height)));
}

</style>
