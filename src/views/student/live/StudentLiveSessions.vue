<template>
  <ThemePage :title="t('live.student.titlePage')" :subtitle="t('live.student.subtitle')">
    <template #actions>
      <UiButton variant="outline" color="secondary" prepend-icon="ReloadOutlined" @click="loadSessions">
        {{ t('common.refresh') }}
      </UiButton>
    </template>

    <section class="student-live">
      <UiCard class="student-live__card" hover>
        <div class="student-live__filters">
          <UiSelect v-model="filters.courseId" :label="t('live.student.filterCourse')" clearable>
            <option value="">{{ t('live.student.allCourses') }}</option>
            <option v-for="course in courses" :key="course.id" :value="String(course.id)">{{ course.title }}</option>
          </UiSelect>
        </div>

        <UiTable :items="sessions" :headers="headers" :loading="loading" density="comfortable">
          <template #item.scheduledAt="{ item }">
            {{ item.scheduledAt ? formatDateTime(item.scheduledAt) : t('live.student.unscheduled') }}
          </template>
          <template #item.actions="{ item }">
            <div class="student-live__actions">
              <UiButton
                size="sm"
                color="primary"
                variant="solid"
                :disabled="item.registrationStatus === 'registered' || item.registrationStatus === 'banned'"
                @click="register(item)"
              >
                {{ t('live.student.register') }}
              </UiButton>
              <UiButton
                size="sm"
                color="secondary"
                variant="outline"
                :disabled="!item.canJoin"
                @click="join(item)"
              >
                {{ t('live.student.join') }}
              </UiButton>
               <UiButton
 
                v-if="liveSessionsChatEnabled"
                size="sm"
                color="secondary"
                variant="link"
                @click="openChat(item)"
              >
                {{ t('live.student.openChat') }}
              </UiButton>
 
            </div>
          </template>
        </UiTable>

        <UiAlert v-if="error" color="danger" variant="soft">{{ error }}</UiAlert>
        <UiAlert v-else-if="!loading && !sessions.length" color="neutral" variant="soft">
          {{ t('live.student.emptyState') }}
        </UiAlert>
      </UiCard>
    </section>
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
import { useCoursesStore } from '@/stores/courses';
import { useTenantStore } from '@/stores/tenant';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';
import { useRouter } from 'vue-router';
 
import { useToast } from '@/composables/useToast';
import {
  listStudentSessions,
  registerForSession,
  joinSession,
  type StudentLiveSession,
  type StudentLiveSessionsPage
} from '@/api/live';
import { formatDateTime } from '@/utils/formatters';

const { t } = useI18n();
const toast = useToast();
const coursesStore = useCoursesStore();
const tenantStore = useTenantStore();
const featuresStore = useFeaturesStore();
const router = useRouter();
 

const sessions = ref<StudentLiveSession[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const filters = reactive({ courseId: '' });

const headers = computed<UiTableHeader[]>(() => [
  { key: 'title', label: t('live.student.sessionTitle') },
  { key: 'courseTitle', label: t('live.student.course') },
  { key: 'scheduledAt', label: t('live.student.scheduledAt') },
  { key: 'registrationStatus', label: t('live.student.status') },
  { key: 'actions', label: t('common.actions'), sortable: false }
]);

const courses = computed(() => coursesStore.list);
 const liveSessionsChatEnabled = computed(() => featuresStore.hasFeature(FEATURE.liveSessionsChat));
 

watch(
  () => filters.courseId,
  () => loadSessions()
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
    const query: Parameters<typeof listStudentSessions>[0] = { page: 0, size: 100 };
    if (filters.courseId) {
      query.courseId = Number(filters.courseId);
    }
    const data: StudentLiveSessionsPage = await listStudentSessions(query);
    sessions.value = data.items;
  } catch (err: unknown) {
    error.value = t('live.student.loadError');
  } finally {
    loading.value = false;
  }
}

async function register(session: StudentLiveSession) {
  try {
    await registerForSession(session.sessionId);
    toast.success(t('live.student.registerSuccess'));
    await loadSessions();
  } catch (err: unknown) {
    toast.error(t('live.student.registerError'));
  }
}

async function join(session: StudentLiveSession) {
  try {
    const view = await joinSession(session.sessionId);
    toast.success(t('live.student.joinSuccess'));
    if (view.joinUrl) {
      window.open(view.joinUrl, '_blank');
    }
    await loadSessions();
  } catch (err: unknown) {
    toast.error(t('live.student.joinError'));
  }
}
 
function openChat(session: StudentLiveSession) {
  router.push({ name: 'student-live-chat', query: { sessionId: String(session.sessionId) } });
}
 
</script>

<style scoped>
.student-live {
  margin-top: 16px;
}

.student-live__card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.student-live__filters {
  display: flex;
  gap: 16px;
}

.student-live__actions {
  display: flex;
  gap: 8px;
}
</style>