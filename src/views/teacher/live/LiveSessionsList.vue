<template>
  <ThemePage :title="t('live.teacher.titlePage')" :subtitle="t('live.teacher.subtitle')">
    <template #actions>
      <div class="live-actions">
        <UiButton variant="outline" color="secondary" prepend-icon="ReloadOutlined" @click="loadSessions">
          {{ t('common.refresh') }}
        </UiButton>
        <UiButton color="primary" prepend-icon="VideoCameraAddOutlined" @click="openCreate">
          {{ t('live.teacher.newSession') }}
        </UiButton>
      </div>
    </template>

    <section class="live-content">
      <UiCard class="live-card" hover>
        <div class="live-filters">
          <UiSelect v-model="filters.courseId" :label="t('live.teacher.filterCourse')" clearable>
            <option value="">{{ t('live.teacher.allCourses') }}</option>
            <option v-for="course in courses" :key="course.id" :value="String(course.id)">{{ course.title }}</option>
          </UiSelect>
        </div>

        <UiTable :items="sessions" :headers="headers" :loading="loading" density="comfortable">
          <template #item.scheduledAt="{ item }">
            {{ item.scheduledAt ? formatDateTime(item.scheduledAt) : t('live.teacher.unscheduled') }}
          </template>
          <template #item.status="{ item }">
            <UiTag size="sm" :color="statusColor(item.status)">
              {{ statusLabel(item.status) }}
            </UiTag>
          </template>
          <template #item.actions="{ item }">
            <div class="live-row-actions">
              <UiButton size="sm" variant="link" color="primary" @click="openRegistrations(item)">
                {{ t('live.teacher.viewRegistrations') }}
              </UiButton>
              <UiButton size="sm" variant="link" color="secondary" @click="openEdit(item)">
                {{ t('common.edit') }}
              </UiButton>
              <UiButton size="sm" variant="link" color="danger" @click="confirmDelete(item)">
                {{ t('common.delete') }}
              </UiButton>
              <UiButton size="sm" variant="link" color="primary" @click="summarize(item)">
                {{ t('live.teacher.summarizeAttendance') }}
              </UiButton>
              <UiButton
                v-if="liveSessionsChatEnabled"
                size="sm"
                variant="link"
                color="secondary"
                prepend-icon="MessageOutlined"
                @click="openModeration(item)"
              >
                {{ t('live.teacher.openModeration') }}
              </UiButton>
 
            </div>
          </template>
        </UiTable>

        <div class="live-list" role="list">
          <article v-for="item in sessions" :key="item.id" class="live-list__item" role="listitem">
            <header class="live-list__header">
              <h3>{{ item.title }}</h3>
              <UiTag size="sm" :color="statusColor(item.status)">
                {{ statusLabel(item.status) }}
              </UiTag>
            </header>
            <div class="live-list__field">
              <label>{{ t('live.teacher.course') }}</label>
              <span>{{ item.courseTitle }}</span>
            </div>
            <div class="live-list__field">
              <label>{{ t('live.teacher.scheduledAt') }}</label>
              <span>{{ item.scheduledAt ? formatDateTime(item.scheduledAt) : t('live.teacher.unscheduled') }}</span>
            </div>
            <div class="live-list__field">
              <label>{{ t('live.teacher.registered') }}</label>
              <span>{{ item.registeredCount }}</span>
            </div>
            <div class="live-list__actions">
              <UiButton size="sm" variant="link" color="primary" @click="openRegistrations(item)">
                {{ t('live.teacher.viewRegistrations') }}
              </UiButton>
              <UiButton size="sm" variant="link" color="secondary" @click="openEdit(item)">
                {{ t('common.edit') }}
              </UiButton>
              <UiButton size="sm" variant="link" color="danger" @click="confirmDelete(item)">
                {{ t('common.delete') }}
              </UiButton>
              <UiButton size="sm" variant="link" color="primary" @click="summarize(item)">
                {{ t('live.teacher.summarizeAttendance') }}
              </UiButton>
              <UiButton
                v-if="liveSessionsChatEnabled"
                size="sm"
                variant="link"
                color="secondary"
                prepend-icon="MessageOutlined"
                @click="openModeration(item)"
              >
                {{ t('live.teacher.openModeration') }}
              </UiButton>
            </div>
          </article>
        </div>

        <UiAlert v-if="error" color="danger" variant="soft">{{ error }}</UiAlert>
        <UiAlert v-else-if="!loading && !sessions.length" color="neutral" variant="soft">
          {{ t('live.teacher.emptyState') }}
        </UiAlert>
      </UiCard>
    </section>

    <LiveSessionForm
      :open="showForm"
      :mode="formMode"
      :session="activeSession"
      @close="closeForm"
      @create="handleCreate"
      @update="handleUpdate"
    />

    <LiveRegistrations
      :open="showRegistrations"
      :session-id="activeSession?.id ?? null"
      :session-title="activeSession?.title"
      @close="closeRegistrations"
    />
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTag from '@/components/ui/UiTag.vue';
import { useCoursesStore } from '@/stores/courses';
import { useTenantStore } from '@/stores/tenant';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';
import { useRouter } from 'vue-router';
 
import { useToast } from '@/composables/useToast';
import {
  listTeacherSessions,
  createTeacherSession,
  updateTeacherSession,
  deleteTeacherSession,
  summarizeAttendance,
  type TeacherLiveSession,
  type TeacherLiveSessionCreatePayload,
  type TeacherLiveSessionUpdatePayload,
  type TeacherLiveSessionsPage,
  type LiveSessionStatus
} from '@/api/live';
import LiveSessionForm from './LiveSessionForm.vue';
import LiveRegistrations from './LiveRegistrations.vue';
import { formatDateTime } from '@/utils/formatters';

const { t } = useI18n();
const toast = useToast();
const coursesStore = useCoursesStore();
const tenantStore = useTenantStore();
const featuresStore = useFeaturesStore();
const router = useRouter();
 

const sessions = ref<TeacherLiveSession[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const showForm = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const activeSession = ref<TeacherLiveSession | null>(null);
const showRegistrations = ref(false);

const filters = reactive({ courseId: '' });

const headers = computed<UiTableHeader[]>(() => [
  { key: 'title', label: t('live.teacher.sessionTitle') },
  { key: 'courseTitle', label: t('live.teacher.course') },
  { key: 'scheduledAt', label: t('live.teacher.scheduledAt') },
  { key: 'status', label: t('live.teacher.status') },
  { key: 'registeredCount', label: t('live.teacher.registered') },
  { key: 'actions', label: t('common.actions'), sortable: false }
]);

const courses = computed(() => coursesStore.list);
const liveSessionsChatEnabled = computed(() => featuresStore.hasFeature(FEATURE.liveSessionsChat));
 

watch(
  () => filters.courseId,
  () => {
    loadSessions();
  }
);

onMounted(async () => {
  if (!coursesStore.list.length) {
    await coursesStore.fetchCourses().catch(() => {
      /* ignore */
    });
  }
  loadSessions();
});

async function loadSessions() {
  loading.value = true;
  error.value = null;
  try {
    const query: Parameters<typeof listTeacherSessions>[0] = { page: 0, size: 100 };
    if (filters.courseId) {
      query.courseId = Number(filters.courseId);
    }
    const data: TeacherLiveSessionsPage = await listTeacherSessions(query);
    sessions.value = data.items;
  } catch (err: unknown) {
    error.value = t('live.teacher.loadError');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  formMode.value = 'create';
  activeSession.value = null;
  showForm.value = true;
}

function openEdit(session: TeacherLiveSession) {
  formMode.value = 'edit';
  activeSession.value = session;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
}

async function handleCreate(payload: TeacherLiveSessionCreatePayload) {
  try {
    await createTeacherSession(payload);
    toast.success(t('live.teacher.createSuccess'));
    showForm.value = false;
    await loadSessions();
  } catch (err: unknown) {
    toast.error(t('live.teacher.createError'));
  }
}

async function handleUpdate(payload: TeacherLiveSessionUpdatePayload) {
  if (!activeSession.value) {
    return;
  }
  try {
    await updateTeacherSession(activeSession.value.id, payload);
    toast.success(t('live.teacher.updateSuccess'));
    showForm.value = false;
    await loadSessions();
  } catch (err: unknown) {
    toast.error(t('live.teacher.updateError'));
  }
}

function openRegistrations(session: TeacherLiveSession) {
  activeSession.value = session;
  showRegistrations.value = true;
}

function closeRegistrations() {
  showRegistrations.value = false;
}

async function confirmDelete(session: TeacherLiveSession) {
  if (!window.confirm(t('live.teacher.deleteConfirm', { title: session.title }))) {
    return;
  }
  try {
    await deleteTeacherSession(session.id);
    toast.success(t('live.teacher.deleteSuccess'));
    await loadSessions();
  } catch (err: unknown) {
    toast.error(t('live.teacher.deleteError'));
  }
}

async function summarize(session: TeacherLiveSession) {
  try {
    await summarizeAttendance(session.id);
    toast.success(t('live.teacher.summarizeSuccess'));
  } catch (err: unknown) {
    toast.error(t('live.teacher.summarizeError'));
  }
}

 function openModeration(session: TeacherLiveSession) {
  router.push({ name: 'teacher-live-moderation', query: { sessionId: String(session.id) } });
}

 
function statusColor(status: LiveSessionStatus) {
  switch (status) {
    case 'live':
      return 'success';
    case 'ended':
      return 'neutral';
    case 'cancelled':
      return 'danger';
    default:
      return 'primary';
  }
}

function statusLabel(status: LiveSessionStatus) {
  return t(`live.teacher.statusLabel.${status}`);
}
</script>

<style scoped>
.live-actions {
  display: flex;
  gap: 12px;
}

.live-content {
  margin-top: 16px;
}

.live-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.live-filters {
  display: flex;
  gap: 16px;
}

.live-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.live-list {
  display: none;
  gap: var(--sakai-space-3);
}

.live-list__item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.live-list__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
}

.live-list__header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.live-list__field {
  display: grid;
  gap: var(--sakai-space-2);
}

.live-list__field label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-muted);
}

.live-list__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

@media (max-width: 1024px) {
  .live-card :deep(.ui-table-container) {
    display: none;
  }

  .live-list {
    display: grid;
  }
}
</style>
