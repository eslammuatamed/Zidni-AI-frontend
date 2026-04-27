<template>
  <div class="progress-badge" role="status">
    <div class="progress-badge__count">
      <span class="progress-badge__value">{{ mastered }}</span>
      <span class="progress-badge__label">{{ t('labEnglish.progress.mastered') }}</span>
    </div>
    <div class="progress-badge__divider" aria-hidden="true"></div>
    <div class="progress-badge__percent">
      <span class="progress-badge__value">{{ completion }}%</span>
      <span class="progress-badge__label">{{ t('labEnglish.progress.complete') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    mastered?: number;
    total?: number;
  }>(),
  {
    mastered: 0,
    total: 0
  }
);

const { t } = useI18n();

const completion = computed(() => {
  if (!props.total) {
    return 0;
  }
  return Math.round((props.mastered / props.total) * 100);
});
</script>

<style scoped>
.progress-badge {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(14, 165, 233, 0.12));
  color: var(--muse-text, #0f172a);
  font-size: 0.85rem;
}

.progress-badge__count,
.progress-badge__percent {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.progress-badge__value {
  font-weight: 700;
  font-size: 1.15rem;
}

.progress-badge__label {
  font-size: 0.75rem;
  color: var(--muse-text-muted, #475569);
}

.progress-badge__divider {
  width: 1px;
  height: 24px;
  background: rgba(148, 163, 184, 0.35);
}
</style>
