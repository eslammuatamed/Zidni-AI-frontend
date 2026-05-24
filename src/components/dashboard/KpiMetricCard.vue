<!--
  KpiMetricCard.vue renders one KPI tile for the teacher dashboard. Layout is
  two rows: top (tinted icon tile + label), bottom (large value). There is no
  delta/trend prop — none of the dashboard's data sources (teacherDashboard,
  teacherProfile, teacherViews) expose period-over-period comparisons, and
  inventing them was out of scope.

  Tone is driven by two CSS variables resolved from existing --sakai-* tokens,
  so light/dark modes adapt automatically (--kpi-tone-soft uses existing
  *-surface/*-tint tokens which already have dark overrides in tokens.scss).
-->
<template>
  <article class="kpi-card" :class="`kpi-card--tone-${tone}`">
    <header class="kpi-card__header">
      <h3 class="kpi-card__label">{{ label }}</h3>
      <span class="kpi-card__icon" aria-hidden="true">
        <UiIcon :name="icon" :size="16" />
      </span>
    </header>
    <p class="kpi-card__value">{{ value }}</p>
  </article>
</template>

<script setup lang="ts">
import UiIcon from '@/components/ui/UiIcon.vue';

type KpiTone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

withDefaults(
  defineProps<{
    label: string;
    value: string;
    icon: string;
    tone?: KpiTone;
  }>(),
  {
    tone: 'primary',
  },
);
</script>

<style scoped>
.kpi-card {
  --kpi-tone-color: var(--sakai-primary);
  --kpi-tone-soft: var(--sakai-primary-tint-12);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-5);
  background-color: var(--sakai-surface-card);
  border: 1px solid var(--sakai-border-color);
  border-radius: var(--sakai-border-radius-md);
  box-shadow: var(--sakai-shadow-sm);
  transition:
    transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
  min-height: 7.5rem;
}

.kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--sakai-shadow-md);
}

.kpi-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.kpi-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--sakai-border-radius-md);
  background-color: var(--kpi-tone-soft);
  color: var(--kpi-tone-color);
  flex-shrink: 0;
}

.kpi-card__label {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color-tertiary);
  /* Anchor text to the reading-start edge: right in RTL, left in LTR. */
  text-align: start;
}

.kpi-card__value {
  margin: 0;
  font-size: 1.75rem;
  font-weight: var(--sakai-font-weight-bold);
  color: var(--sakai-text-color-strong);
  font-variant-numeric: tabular-nums;
  text-align: start;
  line-height: 1.1;
}

.kpi-card--tone-primary {
  --kpi-tone-color: var(--sakai-primary);
  --kpi-tone-soft: var(--sakai-primary-tint-12);
}

.kpi-card--tone-info {
  --kpi-tone-color: var(--sakai-info);
  --kpi-tone-soft: var(--sakai-info-soft);
}

.kpi-card--tone-success {
  --kpi-tone-color: var(--sakai-success);
  --kpi-tone-soft: var(--sakai-success-soft);
}

.kpi-card--tone-warning {
  --kpi-tone-color: var(--sakai-warning);
  --kpi-tone-soft: var(--sakai-warning-soft);
}

.kpi-card--tone-danger {
  --kpi-tone-color: var(--sakai-danger);
  --kpi-tone-soft: var(--sakai-danger-soft);
}
</style>
