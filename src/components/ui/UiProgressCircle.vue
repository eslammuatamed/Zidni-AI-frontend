<template>
  <div
    class="ui-progress-circle relative inline-flex items-center justify-center"
    :class="`ui-progress-circle--tone-${props.color}`"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    role="progressbar"
    :aria-valuenow="clampedValue"
    :aria-valuemin="props.min"
    :aria-valuemax="props.max"
  >
    <svg :viewBox="`0 0 120 120`" class="ui-progress-circle__svg -rotate-90">
      <circle class="ui-progress-circle__track" cx="60" cy="60" :r="radius" :stroke-width="props.strokeWidth" />
      <circle
        class="ui-progress-circle__value"
        cx="60"
        cy="60"
        :r="radius"
        :stroke-width="props.strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <div v-if="props.showValue || $slots.default" class="ui-progress-circle__label absolute inset-0 flex items-center justify-center font-semibold text-content">
      <slot>{{ displayValue }}</slot>
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
    size?: number;
    strokeWidth?: number;
    color?: UiProgressTone;
    showValue?: boolean;
    format?: (value: number) => string;
  }>(),
  {
    value: 0,
    min: 0,
    max: 100,
    size: 140,
    strokeWidth: 12,
    color: 'primary',
    showValue: true,
    format: undefined
  }
);

const normalizedRange = computed(() => Math.max(props.max - props.min, 1));
const clampedValue = computed(() => Math.min(Math.max(props.value ?? 0, props.min), props.max));
const percentage = computed(() => ((clampedValue.value - props.min) / normalizedRange.value) * 100);

const radius = computed(() => 60 - props.strokeWidth / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => ((100 - percentage.value) / 100) * circumference.value);

const displayValue = computed(() => {
  if (props.format) {
    return props.format(clampedValue.value);
  }
  return `${Math.round(percentage.value)}%`;
});
</script>

<style scoped>
.ui-progress-circle__track {
  fill: none;
  stroke: color-mix(in srgb, var(--sakai-border-color) 55%, transparent);
}

.ui-progress-circle__value {
  fill: none;
  stroke: var(--sakai-primary);
  stroke-linecap: round;
  transition: stroke-dashoffset var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-progress-circle--tone-secondary .ui-progress-circle__value {
  stroke: var(--sakai-secondary);
}

.ui-progress-circle--tone-success .ui-progress-circle__value {
  stroke: var(--sakai-success);
}

.ui-progress-circle--tone-info .ui-progress-circle__value {
  stroke: var(--sakai-info);
}

.ui-progress-circle--tone-warning .ui-progress-circle__value {
  stroke: var(--sakai-warning);
}

.ui-progress-circle--tone-danger .ui-progress-circle__value {
  stroke: var(--sakai-danger);
}

</style>
