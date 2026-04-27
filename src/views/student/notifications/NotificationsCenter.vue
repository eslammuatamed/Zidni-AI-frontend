<template>
  <ThemePage :title="t('notifications.studentTitle')" :subtitle="t('notifications.historyTitle')">
    <section class="notifications-center">
      <UiCard class="notifications-center__filters" :title="t('notifications.filters.title')">
        <div class="notifications-center__filters-grid">
          <UiSelect v-model="filters.type" :label="t('notifications.filters.type')">
            <option value="all">{{ t('notifications.filters.allTypes') }}</option>
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>
          <UiSelect v-model="filters.status" :label="t('notifications.filters.status')">
            <option value="all">{{ t('notifications.filters.allStatus') }}</option>
            <option value="unread">{{ t('notifications.status.unread') }}</option>
            <option value="read">{{ t('notifications.status.read') }}</option>
          </UiSelect>
          <UiInput v-model="filters.from" type="date" :label="t('notifications.filters.from')" />
          <UiInput v-model="filters.to" type="date" :label="t('notifications.filters.to')" />
        </div>
        <div class="notifications-center__filters-actions">
          <UiButton variant="ghost" color="neutral" prepend-icon="ReloadOutlined" @click="resetFilters">
            {{ t('notifications.filters.reset') }}
          </UiButton>
          <div class="notifications-center__summary" role="status" aria-live="polite">
            <span class="notifications-center__summary-label">{{ t('notifications.filters.unreadLabel') }}</span>
            <span class="notifications-center__summary-value">{{ notifications.unreadCount }}</span>
          </div>
        </div>
      </UiCard>

      <UiCard :title="t('notifications.historyTitle')" hover>
        <template #actions>
          <div class="notifications-center__actions">
            <UiButton variant="outline" color="primary" prepend-icon="ReloadOutlined" @click="refresh">
              {{ t('notifications.refresh') }}
            </UiButton>
            <div class="notifications-center__pagination" v-if="totalPages > 1">
              <UiButton
                variant="text"
                color="primary"
                size="sm"
                :disabled="filters.page === 0 || notifications.loading"
                @click="prevPage"
              >
                <UiIcon name="LeftOutlined" :size="14" />
              </UiButton>
              <span>
                {{ t('notifications.pagination', { current: filters.page + 1, total: totalPages }) }}
              </span>
              <UiButton
                variant="text"
                color="primary"
                size="sm"
                :disabled="!hasNextPage || notifications.loading"
                @click="nextPage"
              >
                <UiIcon name="RightOutlined" :size="14" />
              </UiButton>
            </div>
          </div>
        </template>

        <template v-if="notifications.loading">
          <div class="notifications-center__loading">
            <UiSkeleton v-for="index in 4" :key="index" height="72px" animation="pulse" rounded />
          </div>
        </template>
        <template v-else-if="hasNotifications">
          <UiList density="comfortable" divided>
            <UiListItem v-for="item in notifications.items" :key="item.id" align="start">
              <template #leading>
                <UiTag :color="typeTone(item.type)" size="sm" pill>
                  {{ resolveTypeLabel(item.type) }}
                </UiTag>
              </template>
               <template #title>
                 <div class="notifications-center__title">
                   <span>{{ notificationMessage(item) }}</span>
                   <small v-if="notificationNote(item.context)" class="notifications-center__note">
                     {{ t('notifications.reasonLabel') }}: {{ notificationNote(item.context) }}
                   </small>
                 </div>
               </template>
              <template #meta>
                <time :datetime="item.createdAt">{{ formatDateTime(item.createdAt) }}</time>
              </template>
               <template #actions>
                  <UiButton
                    v-if="item.status === 'unread'"
                    variant="link"
                    color="primary"
                    prepend-icon="CheckCircleOutlined"
                    @click="markRead(item.id)"
                  >
                    {{ t('notifications.markRead') }}
                  </UiButton>
                  <UiButton
                    v-if="item.type === 'payment' && notificationStatus(item.context) === 'REJECTED'"
                    variant="outline"
                    color="primary"
                    size="sm"
                    @click="resubmitFromNotification(item.context)"
                  >
                    {{ t('student.resubmitPaymentAction') }}
                  </UiButton>
               </template>
            </UiListItem>
          </UiList>
        </template>
        <template v-else>
          <div class="notifications-center__empty">
            <UiIcon name="NotificationOutlined" :size="40" />
            <p>{{ t('notifications.empty') }}</p>
          </div>
        </template>
      </UiCard>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notifications';
import { useToast } from '@/composables/useToast';
import { useRouter } from 'vue-router';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiList from '@/components/ui/UiList.vue';
import UiListItem from '@/components/ui/UiListItem.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';

import type { NotificationType, NotificationStatus } from '@/api/notifications';
import { parseNotificationContext } from '@/utils/notifications';

const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const notifications = useNotificationStore();

const filters = reactive({
  type: 'all' as NotificationType | 'all',
  status: 'all' as NotificationStatus | 'all',
  from: '',
  to: '',
  page: 0,
  size: 20
});

const typeOptions = computed(() => [
  { value: 'course', label: t('notifications.types.course') },
  { value: 'payment', label: t('notifications.types.payment') },
  { value: 'exam', label: t('notifications.types.exam') },
  { value: 'live_session', label: t('notifications.types.liveSession') },
  { value: 'tutoring', label: t('notifications.types.tutoring') },
  { value: 'system', label: t('notifications.types.system') }
]);

const hasNotifications = computed(() => notifications.items.length > 0);
const totalPages = computed(() => {
  if (!notifications.lastPageSize) return 1;
  return Math.max(1, Math.ceil(notifications.lastTotal / notifications.lastPageSize));
});
const hasNextPage = computed(() => filters.page + 1 < totalPages.value);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const typeTone = (type: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'neutral' => {
  switch (type) {
    case 'system':
      return 'info';
    case 'course':
      return 'secondary';
    case 'exam':
      return 'warning';
    case 'live_session':
      return 'primary';
    case 'payment':
      return 'success';
    case 'tutoring':
      return 'neutral';
    default:
      return 'neutral';
  }
};

const notificationNote = (context?: string | null): string | null => {
  const parsed = parseNotificationContext(context);
  const notes = typeof parsed?.notes === 'string' ? parsed.notes.trim() : '';
  return notes.length ? notes : null;
};

const notificationCourseTitle = (context?: string | null): string | null => {
  const parsed = parseNotificationContext(context);
  const title = typeof parsed?.courseTitle === 'string' ? parsed.courseTitle.trim() : '';
  return title.length ? title : null;
};

const notificationStatus = (context?: string | null): string | null => {
  const parsed = parseNotificationContext(context);
  const status = typeof parsed?.status === 'string' ? parsed.status.trim() : '';
  return status.length ? status : null;
};

const notificationCourseId = (context?: string | null): number | null => {
  const parsed = parseNotificationContext(context);
  const value = parsed?.courseId;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsedId = Number(value.trim());
    return Number.isFinite(parsedId) ? parsedId : null;
  }
  return null;
};

const notificationMessage = (notification: { type: string; message: string; context?: string | null }) => {
  if (notification.type !== 'payment') return notification.message;
  const status = notificationStatus(notification.context);
  const courseTitle = notificationCourseTitle(notification.context);
  if (status === 'APPROVED') {
    return t('notifications.paymentApproved', { course: courseTitle ?? t('student.course') });
  }
  if (status === 'REJECTED') {
    return t('notifications.paymentRejected', { course: courseTitle ?? t('student.course') });
  }
  return notification.message;
};

const resubmitFromNotification = (context?: string | null) => {
  const courseId = notificationCourseId(context);
  void router.push({ name: 'student-checkout', query: courseId ? { courseId: String(courseId) } : {} });
};

const resolveTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    system: t('notifications.types.system'),
    course: t('notifications.types.course'),
    exam: t('notifications.types.exam'),
    live_session: t('notifications.types.liveSession'),
    payment: t('notifications.types.payment'),
    tutoring: t('notifications.types.tutoring')
  };
  return map[type] ?? type;
};

const normalizeDate = (value: string, endOfDay = false) => {
  if (!value) return undefined;
  const suffix = endOfDay ? 'T23:59:59Z' : 'T00:00:00Z';
  return new Date(`${value}${suffix}`).toISOString();
};

const buildFilters = () => {
  const payload: Record<string, unknown> = {
    type: filters.type,
    status: filters.status,
    page: filters.page,
    size: filters.size
  };
  const from = normalizeDate(filters.from);
  const to = normalizeDate(filters.to, true);
  if (from) payload.from = from;
  if (to) payload.to = to;
  return payload;
};

const refresh = async () => {
  try {
    await notifications.fetch(buildFilters());
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('notifications.loadFailed') });
  }
};

const markRead = async (id: number) => {
  try {
    await notifications.markAsRead(id);
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('notifications.loadFailed') });
  }
};

const resetFilters = () => {
  filters.type = 'all';
  filters.status = 'all';
  filters.from = '';
  filters.to = '';
  filters.page = 0;
  refresh();
};

const prevPage = () => {
  if (filters.page > 0) {
    filters.page -= 1;
  }
};

const nextPage = () => {
  if (hasNextPage.value) {
    filters.page += 1;
  }
};

watch(
  () => [filters.type, filters.status, filters.from, filters.to, filters.size],
  () => {
    if (filters.page !== 0) {
      filters.page = 0;
    }
    refresh();
  }
);

watch(
  () => filters.page,
  () => {
    refresh();
  }
);

onMounted(async () => {
  await refresh();
  notifications.connect();
});
</script>

<style scoped>
.notifications-center {
  display: grid;
  gap: var(--sakai-space-6);
}

.notifications-center__filters-grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.notifications-center__filters-actions {
  margin-top: var(--sakai-space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-4);
}

.notifications-center__summary {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  font-weight: 600;
}

.notifications-center__summary-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  padding: 0 var(--sakai-space-3);
  border-radius: 999px;
  background: var(--sakai-color-primary-50);
  color: var(--sakai-color-primary-700);
}

.notifications-center__actions {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-4);
}

.notifications-center__title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notifications-center__note {
  color: var(--sakai-text-color-secondary);
  font-size: 0.85rem;
}

.notifications-center__pagination {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
}

.notifications-center__loading {
  display: grid;
  gap: var(--sakai-space-4);
}

.notifications-center__empty {
  display: grid;
  gap: var(--sakai-space-3);
  justify-items: center;
  padding: var(--sakai-space-10) var(--sakai-space-4);
  color: var(--sakai-text-color-tertiary);
}

.notifications-center__empty p {
  margin: 0;
  font-size: 0.95rem;
}
</style>
