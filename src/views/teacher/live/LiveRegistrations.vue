<template>
  <UiDialog :model-value="open" :title="dialogTitle" width="720px" @update:model-value="onClose">
    <section class="registrations">
      <header class="registrations__header">
        <UiButton variant="outline" color="secondary" size="sm" prepend-icon="ReloadOutlined" @click="load">
          {{ t('common.refresh') }}
        </UiButton>
        <div class="registrations__meta" v-if="summary">
          <UiTag color="primary" size="sm">
            {{ t('live.teacher.registeredCount', { count: registrations.length }) }}
          </UiTag>
        </div>
      </header>

      <UiTable
        :items="registrations"
        :headers="headers"
        :loading="loading"
        density="comfortable"
        class="registrations__table"
      >
        <template #item.joinCount="{ item }">
          <span class="registrations__count">{{ item.joinCount }}</span>
        </template>
        <template #item.attended="{ item }">
          <UiTag :color="item.attended ? 'success' : 'neutral'" size="sm">
            {{ item.attended ? t('live.teacher.attendedYes') : t('live.teacher.attendedNo') }}
          </UiTag>
        </template>
      </UiTable>

      <UiAlert v-if="error" color="danger" variant="soft">{{ error }}</UiAlert>
    </section>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import type { LiveSessionRegistration, TeacherAttendanceSummary } from '@/api/live';
import { listTeacherRegistrations, getAttendanceSummary } from '@/api/live';

const props = defineProps<{
  open: boolean;
  sessionId: number | null;
  sessionTitle?: string;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const { t } = useI18n();
const loading = ref(false);
const registrations = ref<LiveSessionRegistration[]>([]);
const summary = ref<TeacherAttendanceSummary | null>(null);
const error = ref<string | null>(null);

const headers = computed<UiTableHeader[]>(() => [
  { key: 'studentName', label: t('live.teacher.student') },
  { key: 'studentEmail', label: t('live.teacher.email') },
  { key: 'status', label: t('live.teacher.status') },
  { key: 'joinCount', label: t('live.teacher.joins') },
  { key: 'attended', label: t('live.teacher.attended') }
]);

const dialogTitle = computed(() => props.sessionTitle ?? t('live.teacher.registrationsTitle'));

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      load();
    }
  }
);

onMounted(() => {
  if (props.open) {
    load();
  }
});

async function load() {
  if (!props.sessionId) {
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const [rows, summaryData] = await Promise.all([
      listTeacherRegistrations(props.sessionId),
      getAttendanceSummary(props.sessionId)
    ]);
    registrations.value = rows;
    summary.value = summaryData;
  } catch (err) {
    error.value = t('live.teacher.loadRegistrationsError');
  } finally {
    loading.value = false;
  }
}

function onClose() {
  emit('close');
}
</script>

<style scoped>
.registrations {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.registrations__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.registrations__table {
  max-height: 360px;
  overflow-y: auto;
}

.registrations__count {
  font-variant-numeric: tabular-nums;
}
</style>
