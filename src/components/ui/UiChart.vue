<template>
  <div class="ui-chart w-full max-w-full flex flex-col gap-3" :style="{ '--ui-chart-height': `${height}px` }">
    <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none">
      <defs>
        <linearGradient id="uiChartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="stroke" stop-opacity="0.35" />
          <stop offset="100%" :stop-color="stroke" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path
        v-if="fill"
        class="ui-chart__area"
        :d="areaPath"
        fill="url(#uiChartGradient)"
      />
      <polyline
        class="ui-chart__line"
        :points="linePoints"
        :stroke="stroke"
        fill="none"
      />
      <g v-for="(point, index) in normalizedPoints" :key="index">
        <circle
          class="ui-chart__dot"
          :cx="point.x"
          :cy="point.y"
          :r="3"
          :fill="stroke"
        />
      </g>
    </svg>
    <div v-if="labels.length" class="ui-chart__labels grid [grid-template-columns:repeat(auto-fit,minmax(40px,1fr))] text-[0.8rem] text-content-tertiary text-center">
      <span v-for="(label, index) in labels" :key="index">{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    values: number[];
    labels?: string[];
    height?: number;
    stroke?: string;
    fill?: boolean;
  }>(),
  {
    values: () => [],
    labels: () => [],
    height: 140,
    stroke: 'var(--sakai-primary)',
    fill: true
  }
);

const width = 240;

const max = computed(() => (props.values.length ? Math.max(...props.values) : 0));
const min = computed(() => (props.values.length ? Math.min(...props.values) : 0));

const normalizedPoints = computed(() => {
  const range = max.value === min.value ? 1 : max.value - min.value;
  return props.values.map((value, index) => {
    const x = (index / Math.max(props.values.length - 1, 1)) * width;
    const y = props.height - ((value - min.value) / range) * props.height;
    return { x, y };
  });
});

const linePoints = computed(() => normalizedPoints.value.map((point) => `${point.x},${point.y}`).join(' '));

const areaPath = computed(() => {
  if (!normalizedPoints.value.length) return '';
  const pathPoints = normalizedPoints.value.map((point) => `${point.x},${point.y}`).join(' ');
  return `M0,${props.height} L ${pathPoints} L ${width},${props.height} Z`;
});

const labels = computed(() => props.labels);
const stroke = computed(() => props.stroke);
const height = computed(() => props.height);
const fill = computed(() => props.fill);
</script>

<style scoped>
.ui-chart svg {
  width: 100%;
  height: var(--ui-chart-height, 140px);
}

.ui-chart__line {
  stroke-width: 3;
  stroke-linecap: round;
}

.ui-chart__area {
  stroke: none;
}

.ui-chart__dot {
  stroke: var(--sakai-surface-card);
  stroke-width: 2;
}

</style>
