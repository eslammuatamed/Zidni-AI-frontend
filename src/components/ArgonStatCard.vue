<template>
  <section class="muse-stat-card" :class="[toneClass, { 'muse-stat-card--hover': isHover } ]">
    <div class="muse-stat-card__meta">
      <div>
        <div class="muse-stat-card__label">{{ label }}</div>
        <div class="muse-stat-card__value">{{ value }}</div>
      </div>
      <div class="muse-stat-card__icon">
        <slot name="icon">
          <muse-icon :name="iconName" :size="28" />
        </slot>
      </div>
    </div>
    <div v-if="descriptionText || $slots.default" class="muse-stat-card__description">
      <slot>{{ descriptionText }}</slot>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MuseIcon from '@/components/MuseIcon.vue';

type MuseTone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    icon?: string;
    color?: MuseTone | string;
    description?: string;
    hover?: boolean;
  }>(),
  {
    icon: 'DashboardOutlined',
    color: 'primary',
    description: '',
    hover: true
  }
);

const isHover = computed(() => props.hover);
const iconName = computed(() => props.icon);
const descriptionText = computed(() => props.description);
const toneClass = computed(() => `muse-stat-card--tone-${props.color}`);
</script>

<style scoped>
.muse-stat-card {
  --muse-stat-color: var(--muse-primary);
  --muse-stat-gradient: var(--muse-gradient-primary);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.3rem;
  border-radius: var(--muse-radius-xl);
  background: var(--muse-surface);
  border: 1px solid var(--muse-border);
  box-shadow: var(--muse-shadow-base);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.muse-stat-card--hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 32px 45px color-mix(in srgb, var(--muse-stat-color) 20%, rgba(0, 0, 0, 0.18));
}

.muse-stat-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.muse-stat-card__label {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--muse-text-muted);
  font-weight: var(--muse-font-semibold);
}

.muse-stat-card__value {
  font-size: 1.5rem;
  font-weight: var(--muse-font-bold);
  color: var(--muse-text-heading);
}

.muse-stat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--muse-radius-lg);
  display: grid;
  place-items: center;
  color: var(--muse-surface);
  background: var(--muse-stat-gradient);
  box-shadow: 0 12px 30px color-mix(in srgb, var(--muse-stat-color) 28%, rgba(0, 0, 0, 0.18));
}

.muse-stat-card__description {
  font-size: 0.85rem;
  color: var(--muse-text-muted);
}

.muse-stat-card--tone-primary {
  --muse-stat-color: var(--muse-primary);
  --muse-stat-gradient: var(--muse-gradient-primary);
}

.muse-stat-card--tone-info {
  --muse-stat-color: var(--muse-info);
  --muse-stat-gradient: var(--muse-gradient-info);
}

.muse-stat-card--tone-success {
  --muse-stat-color: var(--muse-success);
  --muse-stat-gradient: var(--muse-gradient-success);
}

.muse-stat-card--tone-warning {
  --muse-stat-color: var(--muse-warning);
  --muse-stat-gradient: var(--muse-gradient-warning);
}

.muse-stat-card--tone-danger {
  --muse-stat-color: var(--muse-danger);
  --muse-stat-gradient: var(--muse-gradient-danger);
}
</style>
