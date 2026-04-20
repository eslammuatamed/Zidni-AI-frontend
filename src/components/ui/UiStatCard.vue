<template>
  <section class="ui-stat-card" :class="[toneClass, { 'ui-stat-card--hover': isHover }]">
    <div v-if="trend" class="ui-stat-card__trend flex items-center gap-1">
      <UiIcon :name="trendIcon" :size="13" :class="trendColorClass" />
      <span :class="trendColorClass">{{ trend.value }}%</span>
    </div>
    <div class="ui-stat-card__icon">
      <slot name="icon">
        <UiIcon :name="iconName" :size="24" />
      </slot>
    </div>
    <div class="flex flex-col items-center gap-1 text-center">
      <div class="ui-stat-card__label uppercase text-[0.75rem] tracking-[0.08em] text-content-tertiary font-medium">{{ label }}</div>
      <div class="ui-stat-card__value text-[2rem] font-bold text-content leading-none">{{ value }}</div>
    </div>
    <div v-if="secondaryStat" class="ui-stat-card__secondary text-center text-[0.8rem] text-content-tertiary leading-snug">
      {{ secondaryStat }}
    </div>
    <div v-if="trend?.period" class="text-center text-[0.7rem] text-content-muted">{{ trend.period }}</div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiIcon from './UiIcon.vue';

type UiTone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

interface TrendData {
  direction: 'up' | 'down' | 'neutral';
  value: number | string;
  period?: string;
}

const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    icon?: string;
    color?: UiTone | string;
    hover?: boolean;
    secondaryStat?: string;
    trend?: TrendData;
  }>(),
  {
    icon: 'DashboardOutlined',
    color: 'primary',
    hover: true,
  }
);

const isHover = computed(() => props.hover);
const iconName = computed(() => props.icon);
const toneClass = computed(() => `ui-stat-card--tone-${props.color}`);
const trendIcon = computed(() => {
  if (!props.trend) return '';
  if (props.trend.direction === 'up') return 'ArrowUpOutlined';
  if (props.trend.direction === 'down') return 'ArrowDownOutlined';
  return 'MinusOutlined';
});
const trendColorClass = computed(() => {
  if (!props.trend) return '';
  if (props.trend.direction === 'up') return 'text-[var(--sakai-success)]';
  if (props.trend.direction === 'down') return 'text-[var(--sakai-danger)]';
  return 'text-content-muted';
});
</script>

<style scoped>
.ui-stat-card {
  --ui-stat-color: var(--sakai-primary);
  --ui-stat-bg: color-mix(in srgb, var(--ui-stat-color) 6%, var(--sakai-surface-card));
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-5);
  min-height: 170px;
  border-radius: var(--sakai-border-radius-xl);
  background: var(--ui-stat-bg);
  border: 1px solid color-mix(in srgb, var(--ui-stat-color) 20%, var(--sakai-border-color));
  box-shadow: var(--sakai-shadow-sm);
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-stat-card--hover:hover {
  transform: translateY(-3px);
  box-shadow: var(--sakai-shadow-md);
}

.ui-stat-card__trend {
  position: absolute;
  inset-inline-end: var(--sakai-space-4);
  top: var(--sakai-space-4);
  font-size: 0.75rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.ui-stat-card__icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--ui-stat-color);
  background: color-mix(in srgb, var(--ui-stat-color) 18%, var(--sakai-surface-card));
}

.ui-stat-card--tone-primary { --ui-stat-color: var(--sakai-primary); }
.ui-stat-card--tone-info    { --ui-stat-color: var(--sakai-info); }
.ui-stat-card--tone-success { --ui-stat-color: var(--sakai-success); }
.ui-stat-card--tone-warning { --ui-stat-color: var(--sakai-warning); }
.ui-stat-card--tone-danger  { --ui-stat-color: var(--sakai-danger); }
</style>
