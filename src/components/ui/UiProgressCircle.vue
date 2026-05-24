<!--
  UiProgressCircle renders a ring progress indicator backed by ApexCharts'
  radialBar. The optional ringColor / trackColor props give call sites direct
  control without :deep() coupling. The default slot remains supported — when
  present it overlays the chart and ApexCharts' built-in label is hidden.
-->
<template>
  <div
    class="ui-progress-circle relative inline-flex items-center justify-center"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    role="progressbar"
    :aria-valuenow="clampedValue"
    :aria-valuemin="props.min"
    :aria-valuemax="props.max"
  >
    <VueApexCharts
      type="radialBar"
      :height="props.size"
      :width="props.size"
      :options="chartOptions"
      :series="series"
    />
    <div
      v-if="$slots.default"
      class="ui-progress-circle__label absolute inset-0 flex items-center justify-center font-semibold text-content pointer-events-none"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import type { ApexOptions } from 'apexcharts';
import VueApexCharts from 'vue3-apexcharts';
import { useThemeStore } from '@/stores/theme';

type UiProgressTone = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';

const props = withDefaults(
  defineProps<{
    value?: number;
    min?: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    color?: UiProgressTone;
    ringColor?: string;
    trackColor?: string;
    showValue?: boolean;
    animate?: boolean;
    format?: (value: number) => string;
  }>(),
  {
    value: 0,
    min: 0,
    max: 100,
    size: 140,
    strokeWidth: 12,
    color: 'primary',
    ringColor: undefined,
    trackColor: undefined,
    showValue: true,
    animate: true,
    format: undefined
  }
);

const slots = useSlots();
const themeStore = useThemeStore();

const TONE_VARS: Record<UiProgressTone, string> = {
  primary: '--sakai-primary',
  secondary: '--sakai-secondary',
  success: '--sakai-success',
  info: '--sakai-info',
  warning: '--sakai-warning',
  danger: '--sakai-danger'
};

const readCssVar = (name: string, fallback: string) => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

// Accepts a literal CSS color (hex, rgb(a), hsl, color-mix, ...) or a single
// var(--name[, fallback]) reference — and resolves the var to its current
// computed value so ApexCharts can inline it into SVG attributes safely.
const resolveColor = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  const varMatch = trimmed.match(/^var\(\s*(--[^,)]+?)(?:\s*,\s*([^)]+))?\s*\)$/);
  if (varMatch) {
    return readCssVar(varMatch[1].trim(), varMatch[2]?.trim() || '');
  }
  return trimmed;
};

const normalizedRange = computed(() => Math.max(props.max - props.min, 1));
const clampedValue = computed(() => Math.min(Math.max(props.value ?? 0, props.min), props.max));
const percentage = computed(() => ((clampedValue.value - props.min) / normalizedRange.value) * 100);
const series = computed(() => [percentage.value]);

const ringStrokeColor = computed(() => {
  // Touch themeStore.isDark so this re-evaluates on theme toggle and re-reads
  // any token whose value depends on the dark-mode override block.
  void themeStore.isDark;
  const resolved = resolveColor(props.ringColor);
  if (resolved) return resolved;
  return readCssVar(TONE_VARS[props.color], '#1b2fac');
});

const trackStrokeColor = computed(() => {
  void themeStore.isDark;
  const resolved = resolveColor(props.trackColor);
  if (resolved) return resolved;
  // Match the prior default: 55%-mixed border color.
  return `color-mix(in srgb, ${readCssVar('--sakai-border-color', '#e2e8f0')} 55%, transparent)`;
});

const labelColor = computed(() => {
  void themeStore.isDark;
  return readCssVar('--sakai-text-color', '#1f2937');
});

// Map strokeWidth (px) to ApexCharts' hollow.size (% of container) so the ring
// keeps an equivalent visual thickness across the existing call sites.
const hollowSize = computed(() => {
  const ratio = Math.max(0, (props.size - props.strokeWidth * 2) / props.size);
  return `${Math.round(ratio * 100)}%`;
});

const displayValue = computed(() => {
  if (props.format) {
    return props.format(clampedValue.value);
  }
  return `${Math.round(percentage.value)}%`;
});

const showDataLabel = computed(() => !slots.default && props.showValue);

const chartOptions = computed<ApexOptions>(() => ({
  chart: {
    type: 'radialBar',
    sparkline: { enabled: true },
    animations: {
      enabled: props.animate,
      dynamicAnimation: { enabled: true, speed: 350 }
    },
    fontFamily: 'inherit',
    background: 'transparent'
  },
  colors: [ringStrokeColor.value],
  stroke: { lineCap: 'round' },
  plotOptions: {
    radialBar: {
      hollow: {
        size: hollowSize.value,
        background: 'transparent'
      },
      track: {
        background: trackStrokeColor.value,
        strokeWidth: '100%',
        margin: 0
      },
      dataLabels: {
        show: showDataLabel.value,
        name: { show: false },
        value: {
          show: showDataLabel.value,
          fontSize: `${Math.max(12, Math.round(props.size * 0.18))}px`,
          fontWeight: 600,
          color: labelColor.value,
          offsetY: 8,
          formatter: () => displayValue.value
        }
      }
    }
  }
}));
</script>

<style scoped>
/* No internal element styling — ApexCharts renders the ring + track. */
</style>
