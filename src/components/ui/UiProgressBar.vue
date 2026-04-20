<template>
  <div class="ui-progress flex flex-col gap-2" :class="[`ui-progress--tone-${props.color}`, { 'ui-progress--striped': props.striped, 'ui-progress--animated': props.animated }]">
    <div class="ui-progress__track">
      <div
        class="ui-progress__value"
        :style="barStyle"
        role="progressbar"
        :aria-valuenow="clampedValue"
        :aria-valuemin="props.min"
        :aria-valuemax="props.max"
      >
        <span v-if="props.showValue" class="ui-progress__label">{{ displayValue }}</span>
      </div>
    </div>
    <div v-if="props.label || $slots.default" class="ui-progress__meta text-[0.85rem] text-content-secondary">
      <slot>{{ props.label }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UiProgressTone = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';

const props = withDefaults(
  defineProps<{
    value?: number;
    min?: number;
    max?: number;
    label?: string;
    color?: UiProgressTone;
    showValue?: boolean;
    striped?: boolean;
    animated?: boolean;
    format?: (value: number) => string;
  }>(),
  {
    value: 0,
    min: 0,
    max: 100,
    label: '',
    color: 'primary',
    showValue: true,
    striped: false,
    animated: false,
    format: undefined
  }
);

const normalizedRange = computed(() => Math.max(props.max - props.min, 1));
const clampedValue = computed(() => Math.min(Math.max(props.value ?? 0, props.min), props.max));
const percentage = computed(() => ((clampedValue.value - props.min) / normalizedRange.value) * 100);

const barStyle = computed(() => ({ width: `${percentage.value}%` }));

const displayValue = computed(() => {
  if (props.format) {
    return props.format(clampedValue.value);
  }
  return `${Math.round(percentage.value)}%`;
});
</script>

<style scoped>
.ui-progress__track {
  position: relative;
  width: 100%;
  height: 0.75rem;
  border-radius: var(--sakai-border-radius-pill);
  background: color-mix(in srgb, var(--sakai-border-color) 55%, transparent);
  overflow: hidden;
}

.ui-progress__value {
  height: 100%;
  border-radius: inherit;
  background: var(--sakai-gradient-primary);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-inline-end: 0.5rem;
  color: var(--sakai-primary-contrast, #fff);
  font-size: 0.7rem;
  font-weight: var(--sakai-font-weight-semibold);
  transition: width var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-progress--tone-secondary .ui-progress__value {
  background: var(--sakai-gradient-secondary);
}

.ui-progress--tone-success .ui-progress__value {
  background: var(--sakai-gradient-success);
}

.ui-progress--tone-info .ui-progress__value {
  background: var(--sakai-gradient-info);
}

.ui-progress--tone-warning .ui-progress__value {
  background: var(--sakai-gradient-warning);
  color: var(--sakai-text-color);
}

.ui-progress--tone-danger .ui-progress__value {
  background: var(--sakai-gradient-danger);
}

.ui-progress--striped .ui-progress__value {
  background-image: repeating-linear-gradient(
    45deg,
    color-mix(in srgb, var(--sakai-white-alpha-25) 100%, transparent) 0,
    color-mix(in srgb, var(--sakai-white-alpha-25) 100%, transparent) 10px,
    transparent 10px,
    transparent 20px
  );
  background-size: 40px 40px;
}

.ui-progress--animated.ui-progress--striped .ui-progress__value {
  animation: ui-progress-stripes 1.2s linear infinite;
}

@keyframes ui-progress-stripes {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 40px 0;
  }
}
</style>
