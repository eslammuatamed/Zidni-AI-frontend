<template>
  <ThemePage :title="t('nav.teacherReports')" :subtitle="t('reports.requestTitle')">
    <section class="teacher-reports grid gap-6">
      <UiCard class="teacher-reports__card grid gap-4" hover>
        <template #title>{{ t('reports.requestTitle') }}</template>
        <form class="teacher-reports__form grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" @submit.prevent="submitReport">
          <UiSelect :model-value="form.type" :label="t('reports.type')" @update:model-value="onTypeChange">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ option.title }}</option>
          </UiSelect>
          <UiSelect :model-value="form.format" :label="t('reports.format')" @update:model-value="onFormatChange">
            <option v-for="option in formatOptions" :key="option.value" :value="option.value">{{ option.title }}</option>
          </UiSelect>
          <UiInput v-model="form.startDate" type="date" :label="t('reports.startDate')" required />
          <UiInput v-model="form.endDate" type="date" :label="t('reports.endDate')" required />
          <UiInput
            v-model="form.deliverToEmail"
            :label="t('reports.deliverToEmail')"
            :placeholder="t('reports.deliverToPlaceholder')"
          />
          <div class="teacher-reports__actions flex justify-end col-span-full">
            <UiButton button-type="submit" color="primary" :disabled="reports.loading">
              {{ t('reports.requestButton') }}
            </UiButton>
          </div>
          <UiAlert v-if="error" color="danger" variant="soft">{{ error }}</UiAlert>
        </form>
      </UiCard>

      <UiCard hover>
        <template #title>{{ t('reports.historyTitle') }}</template>
        <UiTable
          :headers="headers"
          :items="reports.list"
          :loading="reports.loading"
          density="comfortable"
        >
          <template #item.status="{ item }">
            <UiTag :color="statusColor(item.status)" size="sm">{{ t(`reports.status.${item.status}`) }}</UiTag>
          </template>
          <template #item.downloadUrl="{ item }">
            <UiButton
              v-if="item.downloadUrl && item.status === 'completed'"
              variant="link"
              color="primary"
              prepend-icon="DownloadOutlined"
              :href="item.downloadUrl"
              target="_blank"
            >
              {{ t('reports.download') }}
            </UiButton>
            <span v-else>—</span>
          </template>
          <template #item.completedAt="{ item }">
            {{ formatDateTime(item.completedAt) }}
          </template>
          <template #item.requestedAt="{ item }">
            {{ formatDateTime(item.requestedAt) }}
          </template>
        </UiTable>
      </UiCard>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useReportsStore, type ReportRequestInput } from '@/stores/reports';
import UiCard from '@/components/ui/UiCard.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiTag from '@/components/ui/UiTag.vue';

const { t, locale } = useI18n();
const reports = useReportsStore();
const error = ref('');

const today = new Date();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);

const form = reactive<ReportRequestInput>({
  type: 'enrollment',
  format: 'csv',
  startDate: thirtyDaysAgo.toISOString().slice(0, 10),
  endDate: today.toISOString().slice(0, 10),
  deliverToEmail: ''
});

const typeOptions = computed(() => [
  { title: t('reports.types.enrollment'), value: 'enrollment' },
  { title: t('reports.types.revenue'), value: 'revenue' }
]);

const formatOptions = computed(() => [
  { title: t('reports.formats.csv'), value: 'csv' },
  { title: t('reports.formats.pdf'), value: 'pdf' }
]);

const headers = computed(() => [
  { title: t('reports.type'), key: 'type' },
  { title: t('reports.format'), key: 'format' },
  { title: t('reports.statusLabel'), key: 'status' },
  { title: t('reports.startDate'), key: 'startDate' },
  { title: t('reports.endDate'), key: 'endDate' },
  { title: t('reports.requestedAt'), key: 'requestedAt' },
  { title: t('reports.completedAt'), key: 'completedAt' },
  { title: t('reports.downloadColumn'), key: 'downloadUrl', sortable: false }
]);

onMounted(async () => {
  try {
    await reports.fetchReports();
  } catch (e) {
    error.value = t('reports.loadFailed');
  }
});

const onTypeChange = (value: string | number | null) => {
  form.type = (value ? String(value) : 'enrollment') as ReportRequestInput['type'];
};

const onFormatChange = (value: string | number | null) => {
  form.format = (value ? String(value) : 'csv') as ReportRequestInput['format'];
};

const submitReport = async () => {
  error.value = '';
  if (new Date(form.startDate) > new Date(form.endDate)) {
    error.value = t('reports.validation.range');
    return;
  }
  try {
    await reports.requestReport({ ...form, deliverToEmail: form.deliverToEmail || undefined });
    await reports.fetchReports();
  } catch (e) {
    error.value = t('reports.requestFailed');
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'processing':
      return 'info';
    default:
      return 'secondary';
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch (error) {
    return new Date(value).toLocaleString(locale.value);
  }
};
</script>
