<template>
  <section class="ui-stat-card" :class="[toneClass, variantClass, { 'ui-stat-card--hover': isHover }]">
    <div class="ui-stat-card__meta">
      <div class="ui-stat-card__info">
        <div class="ui-stat-card__label">{{ label }}</div>
        <div class="ui-stat-card__value">{{ value }}</div>
      </div>
      <div class="ui-stat-card__icon">
        <slot name="icon">
          <UiIcon :name="iconName" :size="iconSize" />
        </slot>
      </div>
    </div>
    <div v-if="descriptionText || $slots.default" class="ui-stat-card__description">
      <slot>{{ descriptionText }}</slot>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiIcon from './UiIcon.vue';

type UiTone = 'primary' | 'info' | 'success' | 'warning' | 'danger';

const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    icon?: string;
    color?: UiTone | string;
    description?: string;
    hover?: boolean;
    variant?: 'default' | 'soft';
  }>(),
  {
    icon: 'DashboardOutlined',
    color: 'primary',
    description: '',
    hover: true,
    variant: 'default'
  }
);

const isHover = computed(() => props.hover);
const iconName = computed(() => props.icon);
const iconSize = computed(() => props.variant === 'soft' ? 32 : 28);
const descriptionText = computed(() => props.description);
const toneClass = computed(() => `ui-stat-card--tone-${props.color}`);
const variantClass = computed(() => `ui-stat-card--${props.variant}`);
</script>

<style scoped>
.ui-stat-card {
  --ui-stat-color: var(--sakai-primary);
  --ui-stat-gradient: var(--sakai-gradient-primary);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-5);
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface-card);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
  box-shadow: var(--sakai-shadow-md);
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-stat-card--hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 32px 45px color-mix(in srgb, var(--ui-stat-color) 20%, rgba(0, 0, 0, 0.18));
}

.ui-stat-card__meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.ui-stat-card__info {
  flex: 1;
  min-width: 0; /* Allow text to be flexible */
}

.ui-stat-card__label {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-tertiary);
  font-weight: var(--sakai-font-weight-medium);
}

.ui-stat-card__value {
  font-size: 1.5rem;
  font-weight: var(--sakai-font-weight-bold);
  color: var(--sakai-text-color);
}

.ui-stat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--sakai-border-radius-lg);
  display: grid;
  place-items: center;
  color: var(--sakai-primary-contrast);
  background: var(--ui-stat-gradient);
  box-shadow: 0 12px 30px color-mix(in srgb, var(--ui-stat-color) 28%, rgba(0, 0, 0, 0.18));
}

.ui-stat-card__description {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.ui-stat-card--tone-primary {
  --ui-stat-color: var(--sakai-primary);
  --ui-stat-gradient: var(--sakai-gradient-primary);
}

.ui-stat-card--tone-info {
  --ui-stat-color: var(--sakai-info);
  --ui-stat-gradient: var(--sakai-gradient-info);
}

.ui-stat-card--tone-success {
  --ui-stat-color: var(--sakai-success);
  --ui-stat-gradient: var(--sakai-gradient-success);
}

.ui-stat-card--tone-warning {
  --ui-stat-color: var(--sakai-warning);
  --ui-stat-gradient: var(--sakai-gradient-warning);
}

.ui-stat-card--tone-danger {
  --ui-stat-color: var(--sakai-danger);
  --ui-stat-gradient: var(--sakai-gradient-danger);
}

/* ── Soft / Modernize-style variant ─────────────────────────────────── */
.ui-stat-card--soft {
  background: color-mix(in srgb, var(--ui-stat-color) 10%, white);
  border-color: color-mix(in srgb, var(--ui-stat-color) 22%, transparent);
  box-shadow: none;
  align-items: center;
  text-align: center;
  padding: var(--sakai-space-5) var(--sakai-space-4);
  min-height: 170px;
}

.ui-stat-card--soft .ui-stat-card__meta {
  flex-direction: column-reverse;
  align-items: center;
  justify-content: center;
  gap: var(--sakai-space-4);
  width: 100%;
}

.ui-stat-card--soft .ui-stat-card__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sakai-space-1);
}

/* Large circular icon container — matches Modernize illustration style */
.ui-stat-card--soft .ui-stat-card__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--ui-stat-color) 14%, white);
  color: var(--ui-stat-color);
  box-shadow: none;
}

.ui-stat-card--soft .ui-stat-card__label {
  color: var(--ui-stat-color);
  font-size: 0.9rem;
  text-transform: none;
  letter-spacing: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.ui-stat-card--soft .ui-stat-card__value {
  color: var(--ui-stat-color);
  font-size: 1.6rem;
  font-weight: var(--sakai-font-weight-bold);
  line-height: 1.1;
}

/* Hide description — Modernize cards show only icon/label/value */
.ui-stat-card--soft .ui-stat-card__description {
  display: none;
}

.ui-stat-card--soft.ui-stat-card--hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px color-mix(in srgb, var(--ui-stat-color) 20%, transparent);
}
</style>
