<template>
  <UiCard hover>
    <template #title>{{ title }}</template>
    <template v-if="subtitle" #subtitle>{{ subtitle }}</template>
    <div class="analytics-chart-card__body">
      <UiSkeleton v-if="loading" height="200" animation="wave" />
      <TheLineChart
        v-else-if="values.length"
        :data="chartData"
        :categories="labels"
        variant="full"
        :height="200"
      />
      <p v-else class="analytics-chart-card__empty">{{ emptyLabel }}</p>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";
import TheLineChart, {
  type ChartSeries,
} from "@/components/dashboard/TheLineChart.vue";

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    values: number[];
    labels: string[];
    loading?: boolean;
    emptyLabel: string;
    seriesName?: string;
  }>(),
  {
    subtitle: "",
    loading: false,
    seriesName: "",
  },
);

const chartData = computed<ChartSeries[]>(() => [
  {
    name: props.seriesName || props.title,
    data: props.values,
  },
]);
</script>

<style scoped>
.analytics-chart-card__body {
  width: 100%;
}

.analytics-chart-card__empty {
  margin: 0;
  padding: var(--sakai-space-3);
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
  text-align: center;
}
</style>
