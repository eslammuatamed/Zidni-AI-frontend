<!--
  TheLineChart.vue wraps vue3-apexcharts with project conventions:
   - Reads brand + text colors from the live --sakai-* CSS variables at render
     time, so dark-mode toggles repaint without rebuild.
   - Mirrors the y-axis to the opposite side under RTL (Arabic locale).
   - Theme-aware tooltip (light/dark) follows the theme store.
  Props are intentionally minimal; we'll layer config knobs only when a real
  dashboard section needs them.
-->
<template>
  <div class="the-line-chart" :dir="dir">
    <h4 v-if="title" class="the-line-chart__title">{{ title }}</h4>
    <VueApexCharts
      type="area"
      :height="height"
      :options="chartOptions"
      :series="data"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ApexOptions } from 'apexcharts';
import VueApexCharts from 'vue3-apexcharts';
import { useThemeStore } from '@/stores/theme';

export interface ChartSeries {
  name: string;
  data: number[];
}

export type ChartVariant = 'full' | 'minimal' | 'sparkline';

const props = withDefaults(
  defineProps<{
    data: ChartSeries[];
    categories: string[];
    title?: string;
    height?: number | string;
    surface?: 'light' | 'dark';
    variant?: ChartVariant;
  }>(),
  {
    title: '',
    height: 280,
    surface: 'light',
    variant: 'full'
  }
);

const themeStore = useThemeStore();
const { locale } = useI18n();

const dir = computed<'rtl' | 'ltr'>(() => (locale.value === 'ar' ? 'rtl' : 'ltr'));

const readCssVar = (name: string, fallback: string) => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

const chartColors = computed(() => {
  // Touching themeStore.isDark makes this computed re-evaluate on theme toggle.
  void themeStore.isDark;
  return {
    primary: readCssVar('--sakai-primary', '#1b2fac'),
    primaryLight: readCssVar('--sakai-primary-300', '#7d8ce4'),
    success: readCssVar('--sakai-success', '#0fb271'),
    info: readCssVar('--sakai-info', '#3b82f6'),
    text: readCssVar('--sakai-text-color', '#1f2937'),
    textMuted: readCssVar('--sakai-text-color-tertiary', '#62748e'),
    border: readCssVar('--sakai-border-color', '#e2e8f0')
  };
});

const chartOptions = computed<ApexOptions>(() => {
  const colors = chartColors.value;
  const isRtl = dir.value === 'rtl';
  const isDarkSurface = props.surface === 'dark';
  const isSparkline = props.variant === 'sparkline';
  const isMinimal = props.variant === 'minimal';
  const showGrid = props.variant === 'full';
  const showLegend = props.variant === 'full';
  const showAxisLabels = !isSparkline;

  // Dark-surface overrides: when the chart sits on a dark gradient card in light
  // mode, the CSS vars stay tuned for "dark text on light bg" — substitute
  // white-tone text + a lighter brand series color for legibility.
  const textColor = isDarkSurface ? 'rgba(255, 255, 255, 0.92)' : colors.text;
  const textMutedColor = isDarkSurface ? 'rgba(255, 255, 255, 0.65)' : colors.textMuted;
  const borderColor = isDarkSurface ? 'rgba(255, 255, 255, 0.15)' : colors.border;
  const primarySeries = isDarkSurface ? colors.primaryLight : colors.primary;
  const palette = [primarySeries, colors.success, colors.info];

  return {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
      background: 'transparent'
    },
    theme: { mode: themeStore.isDark ? 'dark' : 'light' },
    colors: palette.slice(0, Math.max(1, props.data.length)),
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    grid: {
      show: showGrid,
      borderColor: borderColor,
      strokeDashArray: 4,
      padding: { left: 8, right: 8 }
    },
    xaxis: {
      categories: props.categories,
      labels: {
        show: showAxisLabels,
        style: { colors: textMutedColor, fontSize: '12px' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        show: showAxisLabels,
        style: { colors: textMutedColor, fontSize: '12px' }
      },
      opposite: isRtl
    },
    tooltip: {
      theme: isDarkSurface || themeStore.isDark ? 'dark' : 'light',
      style: { fontFamily: 'inherit', fontSize: '12px' }
    },
    legend: {
      show: showLegend,
      labels: { colors: textColor },
      itemMargin: { horizontal: 12 }
    },
    markers: { size: isSparkline ? 0 : isMinimal ? 2 : 3, strokeWidth: 0 }
  };
});
</script>

<style scoped>
.the-line-chart {
  width: 100%;
}

.the-line-chart__title {
  margin: 0 0 var(--sakai-space-2);
  font-size: var(--sakai-font-size-md);
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}
</style>
