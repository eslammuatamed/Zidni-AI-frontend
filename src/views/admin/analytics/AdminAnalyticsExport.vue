<template>
  <ThemePage :title="t('analytics.export.title')" :subtitle="t('analytics.export.subtitle')">
    <section class="admin-analytics-export">
      <UiAlert v-if="error" color="danger" variant="soft">
        {{ error }}
      </UiAlert>

      <UiCard class="admin-analytics-export__card" hover>
        <template #title>{{ t('analytics.export.title') }}</template>
        <template #subtitle>{{ t('analytics.export.description') }}</template>

        <form class="admin-analytics-export__form" @submit.prevent="onSubmit">
          <UiInput
            v-model="form.startDate"
            type="date"
            :label="t('analytics.export.form.from')"
            required
          />
          <UiInput
            v-model="form.endDate"
            type="date"
            :label="t('analytics.export.form.to')"
            required
          />

          <UiSelect :model-value="form.type" :label="t('analytics.export.form.type')" @update:model-value="onTypeChange">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>

          <UiSelect
            :model-value="form.format"
            :label="t('analytics.export.form.format')"
            @update:model-value="onFormatChange"
          >
            <option v-for="option in formatOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>

          <UiInput
            v-model="form.deliverToEmail"
            type="email"
            :label="t('analytics.export.form.email')"
            placeholder="admin@example.com"
          />

          <div class="admin-analytics-export__actions">
            <UiButton
              button-type="submit"
              prepend-icon="DownloadOutlined"
              :disabled="loading"
            >
              {{ t('analytics.export.form.submit') }}
            </UiButton>
          </div>
        </form>
      </UiCard>

      <UiCard class="admin-analytics-export__card" hover>
        <template #title>{{ t('analytics.export.status.title') }}</template>
        <div v-if="lastExport" class="admin-analytics-export__status">
          <UiAlert :color="statusTone" variant="soft">
            {{ statusLabel }}
          </UiAlert>
          <ul class="admin-analytics-export__details">
            <li>
              <strong>{{ t('analytics.export.form.from') }}:</strong>
              <span>{{ formatDate(lastExport.startDate) }}</span>
            </li>
            <li>
              <strong>{{ t('analytics.export.form.to') }}:</strong>
              <span>{{ formatDate(lastExport.endDate) }}</span>
            </li>
            <li>
              <strong>{{ t('analytics.export.form.type') }}:</strong>
              <span>{{ resolveTypeLabel(lastExport.type) }}</span>
            </li>
            <li>
              <strong>{{ t('analytics.export.form.format') }}:</strong>
              <span>{{ resolveFormatLabel(lastExport.format) }}</span>
            </li>
          </ul>
          <div class="admin-analytics-export__status-actions">
            <UiButton
              v-if="lastExport.downloadUrl && lastExport.status === 'completed'"
              :href="lastExport.downloadUrl"
              target="_blank"
              rel="noopener"
              prepend-icon="DownloadOutlined"
            >
              {{ t('analytics.export.status.download') }}
            </UiButton>
            <UiButton
              variant="outline"
              color="secondary"
              prepend-icon="ReloadOutlined"
              :disabled="loading || !lastExport"
              @click="refreshStatus"
            >
              {{ t('analytics.export.form.refresh') }}
            </UiButton>
          </div>
        </div>
        <p v-else class="admin-analytics-export__empty">
          {{ t('analytics.export.empty') }}
        </p>
      </UiCard>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiButton from '@/components/ui/UiButton.vue';
import {
  requestAnalyticsExport,
  getAnalyticsExport,
  type AdminAnalyticsExportPayload,
  type AdminAnalyticsExportResponse,
  type AdminReportFormat,
  type AdminReportType
} from '@/api/analyticsAdmin';

const { t, locale } = useI18n();

const today = new Date();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);

const form = reactive<AdminAnalyticsExportPayload & { deliverToEmail: string | null }>(
  {
    type: 'revenue',
    format: 'csv',
    startDate: toIsoDate(thirtyDaysAgo),
    endDate: toIsoDate(today),
    deliverToEmail: ''
  }
);

const loading = ref(false);
const error = ref('');
const lastExport = ref<AdminAnalyticsExportResponse | null>(null);

const typeOptions = computed(() => [
  { value: 'revenue' as AdminReportType, label: t('analytics.export.types.revenue') },
  { value: 'enrollment' as AdminReportType, label: t('analytics.export.types.enrollment') }
]);

const formatOptions = computed(() => [
  { value: 'csv' as AdminReportFormat, label: t('analytics.export.formats.csv') },
  { value: 'pdf' as AdminReportFormat, label: t('analytics.export.formats.pdf') }
]);

const statusTone = computed(() => {
  if (!lastExport.value) return 'info';
  if (lastExport.value.status === 'completed') return 'success';
  if (lastExport.value.status === 'failed') return 'danger';
  return 'info';
});

const statusLabel = computed(() => {
  if (!lastExport.value) return '';
  if (lastExport.value.status === 'completed') {
    return t('analytics.export.status.completed');
  }
  if (lastExport.value.status === 'failed') {
    return t('analytics.export.status.failed');
  }
  return t('analytics.export.status.processing');
});

async function onSubmit() {
  if (!isValidRange(form.startDate, form.endDate)) {
    error.value = t('analytics.export.validation.range');
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const payload: AdminAnalyticsExportPayload = {
      type: form.type,
      format: form.format,
      startDate: form.startDate,
      endDate: form.endDate,
      deliverToEmail: form.deliverToEmail?.trim() ? form.deliverToEmail.trim() : undefined
    };
    const response = await requestAnalyticsExport(payload);
    lastExport.value = response;
  } catch (err) {
    console.error('[AdminAnalyticsExport] failed to request export', err);
    error.value = t('analytics.export.error');
  } finally {
    loading.value = false;
  }
}

async function refreshStatus() {
  if (!lastExport.value) {
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const response = await getAnalyticsExport(lastExport.value.id);
    lastExport.value = response;
  } catch (err) {
    console.error('[AdminAnalyticsExport] failed to refresh export', err);
    error.value = t('analytics.export.error');
  } finally {
    loading.value = false;
  }
}

function resolveTypeLabel(value: AdminReportType) {
  const option = typeOptions.value.find((item) => item.value === value);
  return option?.label ?? value;
}

function resolveFormatLabel(value: AdminReportFormat) {
  const option = formatOptions.value.find((item) => item.value === value);
  return option?.label ?? value;
}

function formatDate(value: string) {
  if (!value) return '';
  try {
    const formatter = new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium'
    });
    return formatter.format(new Date(value));
  } catch (err) {
    console.warn('[AdminAnalyticsExport] failed to format date', err);
    return value;
  }
}

function isValidRange(from: string, to: string) {
  if (!from || !to) return false;
  const start = new Date(from);
  const end = new Date(to);
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function onTypeChange(value: string) {
  form.type = (value as AdminReportType) ?? form.type;
}

function onFormatChange(value: string) {
  form.format = (value as AdminReportFormat) ?? form.format;
}
</script>

<style scoped>
.admin-analytics-export {
  display: grid;
  gap: var(--sakai-space-6);
  width: min(100%, 72rem);
  margin-inline: auto;
}

.admin-analytics-export__card {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
}

.admin-analytics-export__form {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 3%, var(--sakai-surface-100));
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 6%, var(--sakai-border-color));
  box-shadow: var(--sakai-shadow-sm);
}

.admin-analytics-export__actions {
  display: flex;
  justify-content: flex-end;
  grid-column: 1 / -1;
  gap: var(--sakai-space-3);
}

.admin-analytics-export__status {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.admin-analytics-export__details {
  list-style: none;
  margin: 0;
  padding: var(--sakai-space-4);
  display: grid;
  gap: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 3%, var(--sakai-surface-100));
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-primary) 6%, var(--sakai-border-color));
}

.admin-analytics-export__details li {
  display: flex;
  gap: var(--sakai-space-2);
  flex-wrap: wrap;
  align-items: baseline;
  font-size: 0.95rem;
  color: var(--sakai-text-color-secondary);
}

.admin-analytics-export__status-actions {
  display: flex;
  gap: var(--sakai-space-3);
  flex-wrap: wrap;
}

.admin-analytics-export__empty {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  padding: var(--sakai-space-3) 0;
}
</style>
