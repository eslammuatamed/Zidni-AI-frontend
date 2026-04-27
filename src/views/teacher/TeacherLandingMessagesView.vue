<template>
  <ThemePage :title="t('teacherLandingMessages.title')" :subtitle="t('teacherLandingMessages.subtitle')">
    <section class="teacher-landing-messages">
      <UiCard class="teacher-landing-messages__panel" hover>
        <header class="teacher-landing-messages__header">
          <div>
            <h2>{{ t('teacherLandingMessages.tableTitle') }}</h2>
            <p>{{ t('teacherLandingMessages.tableSubtitle') }}</p>
          </div>
          <UiButton
            variant="ghost"
            color="primary"
            size="sm"
            :loading="loading"
            class="teacher-landing-messages__refresh"
            @click="reload"
          >
            {{ t('teacherLandingMessages.refresh') }}
          </UiButton>
        </header>

        <UiAlert v-if="loadError" color="danger" variant="soft" class="teacher-landing-messages__alert">
          {{ loadError }}
        </UiAlert>

        <UiTable
          :headers="headers"
          :items="inquiries"
          :loading="loading"
          density="comfortable"
          :empty-text="t('teacherLandingMessages.empty')"
        >
          <template #item.name="{ item }">
            <div class="teacher-landing-messages__sender">
              <span class="teacher-landing-messages__sender-name">{{ item.name }}</span>
              <small v-if="item.message" class="teacher-landing-messages__sender-meta">
                {{ truncateMessage(item.message) }}
              </small>
            </div>
          </template>

          <template #item.phone="{ item }">
            <span>{{ item.phone || t('teacherLandingMessages.detail.emptyValue') }}</span>
          </template>

          <template #item.createdAt="{ item }">
            {{ formatDateTime(item.createdAt) }}
          </template>

          <template #item.status="{ item }">
            <span
              class="teacher-landing-messages__status"
              :class="{ 'is-unread': !item.readAt }"
            >
              {{ item.readAt ? t('teacherLandingMessages.status.read') : t('teacherLandingMessages.status.new') }}
            </span>
          </template>

          <template #item.actions="{ item }">
            <div class="teacher-landing-messages__actions">
              <UiButton size="sm" variant="link" @click="openDetail(item.id)">
                {{ t('teacherLandingMessages.actions.view') }}
              </UiButton>
            </div>
          </template>
        </UiTable>

        <div class="teacher-landing-messages__list" role="list">
          <article
            v-for="item in inquiries"
            :key="item.id"
            class="teacher-landing-messages__list-item"
            role="listitem"
          >
            <header class="teacher-landing-messages__list-header">
              <h3>{{ item.name }}</h3>
              <span
                class="teacher-landing-messages__status"
                :class="{ 'is-unread': !item.readAt }"
              >
                {{ item.readAt ? t('teacherLandingMessages.status.read') : t('teacherLandingMessages.status.new') }}
              </span>
            </header>
            <div class="teacher-landing-messages__list-field">
              <label>{{ t('teacherLandingMessages.columns.phone') }}</label>
              <span>{{ item.phone || t('teacherLandingMessages.detail.emptyValue') }}</span>
            </div>
            <div class="teacher-landing-messages__list-field">
              <label>{{ t('teacherLandingMessages.columns.createdAt') }}</label>
              <span>{{ formatDateTime(item.createdAt) }}</span>
            </div>
            <div v-if="item.message" class="teacher-landing-messages__list-field">
              <label>{{ t('teacherLandingMessages.detail.message') }}</label>
              <span>{{ truncateMessage(item.message) }}</span>
            </div>
            <div class="teacher-landing-messages__list-actions">
              <UiButton size="sm" variant="link" @click="openDetail(item.id)">
                {{ t('teacherLandingMessages.actions.view') }}
              </UiButton>
            </div>
          </article>
        </div>

        <footer v-if="total > 0" class="teacher-landing-messages__footer">
          <span>
            {{
              t('teacherLandingMessages.pagination.summary', {
                from: pageStart,
                to: pageEnd,
                total
              })
            }}
          </span>
          <div class="teacher-landing-messages__pager">
            <UiButton
              variant="link"
              size="sm"
              :disabled="page === 0 || loading"
              @click="changePage(page - 1)"
            >
              {{ t('teacherLandingMessages.pagination.prev') }}
            </UiButton>
            <UiButton
              variant="link"
              size="sm"
              :disabled="isLastPage || loading"
              @click="changePage(page + 1)"
            >
              {{ t('teacherLandingMessages.pagination.next') }}
            </UiButton>
          </div>
        </footer>
      </UiCard>
    </section>
  </ThemePage>

  <UiDialog v-model="detailDialog.open" :title="detailDialogTitle" width="640px" @hide="closeDetail">
    <div v-if="detailDialog.loading" class="teacher-landing-messages__dialog-loading">
      <UiSkeleton v-for="index in 3" :key="index" height="32px" />
    </div>
    <div v-else-if="detailDialog.error" class="teacher-landing-messages__dialog-error">
      <UiAlert color="danger" variant="soft">
        {{ detailDialog.error }}
      </UiAlert>
    </div>
    <div v-else-if="detailDialog.inquiry" class="teacher-landing-messages__dialog">
      <section class="teacher-landing-messages__dialog-section">
        <dl>
          <div>
            <dt>{{ t('teacherLandingMessages.detail.sentAt') }}</dt>
            <dd>{{ formatDateTime(detailDialog.inquiry.createdAt) }}</dd>
          </div>
          <div>
            <dt>{{ t('teacherLandingMessages.detail.phone') }}</dt>
            <dd>{{ detailDialog.inquiry.phone || t('teacherLandingMessages.detail.emptyValue') }}</dd>
          </div>
          <div>
            <dt>{{ t('teacherLandingMessages.detail.email') }}</dt>
            <dd>{{ detailDialog.inquiry.email || t('teacherLandingMessages.detail.emptyValue') }}</dd>
          </div>
          <div>
            <dt>{{ t('teacherLandingMessages.detail.route') }}</dt>
            <dd>
              {{ detailDialog.inquiry.route || t('teacherLandingMessages.detail.noRoute') }}
            </dd>
          </div>
        </dl>
      </section>
      <section class="teacher-landing-messages__dialog-section">
        <h4>{{ t('teacherLandingMessages.detail.message') }}</h4>
        <p class="teacher-landing-messages__dialog-message">{{ detailDialog.inquiry.message }}</p>
      </section>
    </div>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import { formatDateTime } from '@/utils/formatters';
import {
  fetchTeacherLandingInquiry,
  fetchTeacherLandingInquiries,
  type LandingInquiry
} from '@/services/landingInquiries';
import { useLandingInquiriesStore } from '@/stores/landingInquiries';

const { t } = useI18n();
const landingInquiries = useLandingInquiriesStore();

const inquiries = ref<LandingInquiry[]>([]);
const loading = ref(false);
const loadError = ref<string | null>(null);
const page = ref(0);
const size = ref(25);
const total = ref(0);

const headers = computed(() => [
  { title: t('teacherLandingMessages.columns.name'), key: 'name' },
  { title: t('teacherLandingMessages.columns.phone'), key: 'phone' },
  { title: t('teacherLandingMessages.columns.createdAt'), key: 'createdAt' },
  { title: t('teacherLandingMessages.columns.status'), key: 'status' },
  { title: t('teacherLandingMessages.columns.actions'), key: 'actions', align: 'end' }
]);

const totalPages = computed(() => {
  if (!size.value || total.value === 0) {
    return 0;
  }
  return Math.ceil(total.value / size.value);
});

const isLastPage = computed(() => totalPages.value === 0 || page.value >= totalPages.value - 1);

const pageStart = computed(() => {
  if (total.value === 0) {
    return 0;
  }
  return page.value * size.value + 1;
});

const pageEnd = computed(() => {
  if (total.value === 0) {
    return 0;
  }
  return Math.min(total.value, pageStart.value + inquiries.value.length - 1);
});

const detailDialog = reactive({
  open: false,
  loading: false,
  inquiry: null as LandingInquiry | null,
  error: ''
});

const detailDialogTitle = computed(() => {
  if (!detailDialog.inquiry) {
    return t('teacherLandingMessages.detail.title');
  }
  return t('teacherLandingMessages.detail.titleWithName', { name: detailDialog.inquiry.name });
});

const truncateMessage = (message: string) => {
  const trimmed = message.trim();
  if (trimmed.length <= 80) {
    return trimmed;
  }
  return `${trimmed.slice(0, 80)}...`;
};

const loadInquiries = async () => {
  loading.value = true;
  loadError.value = null;
  try {
    const response = await fetchTeacherLandingInquiries({ page: page.value, size: size.value });

    if (response.items.length === 0 && response.total > 0 && page.value > 0) {
      const lastPage = Math.max(Math.ceil(response.total / response.size) - 1, 0);
      if (lastPage !== page.value) {
        page.value = lastPage;
        await loadInquiries();
        return;
      }
    }

    inquiries.value = response.items;
    total.value = response.total;
    size.value = response.size;
    void landingInquiries.refreshUnreadCount();
  } catch (error) {
    console.error('[teacher] failed to load landing inquiries', error);
    loadError.value = t('teacherLandingMessages.errors.load');
  } finally {
    loading.value = false;
  }
};

const reload = () => {
  if (!loading.value) {
    loadInquiries();
  }
};

const changePage = (nextPage: number) => {
  const normalized = Math.max(nextPage, 0);
  if (normalized === page.value) {
    return;
  }
  page.value = normalized;
  loadInquiries();
};

const openDetail = async (inquiryId: number) => {
  detailDialog.open = true;
  detailDialog.loading = true;
  detailDialog.error = '';
  try {
    const inquiry = await fetchTeacherLandingInquiry(inquiryId);
    detailDialog.inquiry = inquiry;
    const index = inquiries.value.findIndex((item) => item.id === inquiry.id);
    if (index >= 0) {
      inquiries.value.splice(index, 1, inquiry);
    }
    void landingInquiries.refreshUnreadCount();
  } catch (error) {
    console.error('[teacher] failed to load landing inquiry detail', error);
    detailDialog.error = t('teacherLandingMessages.errors.detail');
  } finally {
    detailDialog.loading = false;
  }
};

const closeDetail = () => {
  detailDialog.open = false;
  detailDialog.loading = false;
  detailDialog.inquiry = null;
  detailDialog.error = '';
};

onMounted(() => {
  loadInquiries();
});
</script>

<style scoped>
.teacher-landing-messages {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

.teacher-landing-messages__panel {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.teacher-landing-messages__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sakai-space-4);
}

.teacher-landing-messages__header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--sakai-text-strong);
}

.teacher-landing-messages__header p {
  margin: 0.25rem 0 0;
  color: var(--sakai-text-muted);
}

.teacher-landing-messages__refresh {
  align-self: center;
}

.teacher-landing-messages__alert {
  margin-top: -0.5rem;
}

.teacher-landing-messages__sender {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.teacher-landing-messages__sender-name {
  font-weight: 600;
  color: var(--sakai-text-strong);
}

.teacher-landing-messages__sender-meta {
  color: var(--sakai-text-muted);
  font-size: 0.85rem;
}

.teacher-landing-messages__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sakai-border-radius-pill);
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  font-weight: var(--sakai-font-weight-semibold);
  background: color-mix(in srgb, var(--sakai-surface-alt) 70%, transparent);
  color: var(--sakai-text-muted);
}

.teacher-landing-messages__status.is-unread {
  background: color-mix(in srgb, var(--sakai-primary) 18%, transparent);
  color: var(--sakai-primary-700);
}

.teacher-landing-messages__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-2);
}

.teacher-landing-messages__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sakai-space-4);
  font-size: 0.9rem;
  color: var(--sakai-text-muted);
}

.teacher-landing-messages__pager {
  display: flex;
  gap: var(--sakai-space-2);
}

.teacher-landing-messages__dialog-loading {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-landing-messages__dialog-error {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.teacher-landing-messages__dialog {
  display: grid;
  gap: var(--sakai-space-5);
}

.teacher-landing-messages__dialog-section {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-landing-messages__dialog-section dl {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-landing-messages__dialog-section dt {
  font-weight: 600;
  color: var(--sakai-text-strong);
}

.teacher-landing-messages__dialog-section dd {
  margin: 0;
  color: var(--sakai-text-color);
}

.teacher-landing-messages__dialog-message {
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  padding: var(--sakai-space-4);
  line-height: 1.6;
  white-space: pre-line;
}

.teacher-landing-messages__list {
  display: none;
  gap: var(--sakai-space-3);
}

.teacher-landing-messages__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.teacher-landing-messages__list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
}

.teacher-landing-messages__list-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-landing-messages__list-field {
  display: grid;
  gap: var(--sakai-space-2);
}

.teacher-landing-messages__list-field label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-muted);
}

.teacher-landing-messages__list-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1024px) {
  .teacher-landing-messages :deep(.ui-table-container) {
    display: none;
  }

  .teacher-landing-messages__list {
    display: grid;
  }
}
</style>
