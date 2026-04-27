<template>
  <ThemePage :title="t('platformMessages.title')" :subtitle="t('platformMessages.subtitle')">
    <section class="platform-messages">
      <UiCard class="platform-messages__panel" hover>
        <header class="platform-messages__header">
          <div>
            <h2>{{ t('platformMessages.tableTitle') }}</h2>
            <p>{{ t('platformMessages.tableSubtitle') }}</p>
          </div>
          <UiButton
            variant="ghost"
            color="primary"
            size="sm"
            :loading="loading"
            class="platform-messages__refresh"
            @click="reload"
          >
            {{ t('platformMessages.refresh') }}
          </UiButton>
        </header>

        <UiAlert v-if="loadError" color="danger" variant="soft" class="platform-messages__alert">
          {{ loadError }}
        </UiAlert>

        <UiTable
          :headers="headers"
          :items="inquiries"
          :loading="loading"
          density="comfortable"
          :empty-text="t('platformMessages.empty')"
        >
          <template #item.name="{ item }">
            <div class="platform-messages__sender">
              <span class="platform-messages__sender-name">{{ item.name }}</span>
              <small v-if="item.teacherName" class="platform-messages__sender-meta">
                {{ t('platformMessages.teacherLabel', { name: item.teacherName }) }}
              </small>
              <small v-else-if="item.teacherSlug" class="platform-messages__sender-meta">
                {{ t('platformMessages.teacherSlugLabel', { slug: item.teacherSlug }) }}
              </small>
            </div>
          </template>

          <template #item.email="{ item }">
            <span>{{ item.email || '—' }}</span>
          </template>

          <template #item.phone="{ item }">
            <span>{{ item.phone || '—' }}</span>
          </template>

          <template #item.createdAt="{ item }">
            {{ formatDateTime(item.createdAt) }}
          </template>

          <template #item.actions="{ item }">
            <div class="platform-messages__actions">
              <UiButton size="sm" variant="link" @click="openDetail(item.id)">
                {{ t('platformMessages.actions.view') }}
              </UiButton>
              <UiButton size="sm" variant="link" color="danger" @click="confirmDelete(item)">
                {{ t('platformMessages.actions.delete') }}
              </UiButton>
            </div>
          </template>
        </UiTable>

        <footer v-if="total > 0" class="platform-messages__footer">
          <span>
            {{
              t('platformMessages.pagination.summary', {
                from: pageStart,
                to: pageEnd,
                total
              })
            }}
          </span>
          <div class="platform-messages__pager">
            <UiButton
              variant="link"
              size="sm"
              :disabled="page === 0 || loading"
              @click="changePage(page - 1)"
            >
              {{ t('platformMessages.pagination.prev') }}
            </UiButton>
            <UiButton
              variant="link"
              size="sm"
              :disabled="isLastPage || loading"
              @click="changePage(page + 1)"
            >
              {{ t('platformMessages.pagination.next') }}
            </UiButton>
          </div>
        </footer>
      </UiCard>
    </section>
  </ThemePage>

  <UiDialog v-model="detailDialog.open" :title="detailDialogTitle" width="640px" @hide="closeDetail">
    <div v-if="detailDialog.loading" class="platform-messages__dialog-loading">
      <UiSkeleton v-for="index in 3" :key="index" height="32px" />
    </div>
    <div v-else-if="detailDialog.error" class="platform-messages__dialog-error">
      <UiAlert color="danger" variant="soft">
        {{ detailDialog.error }}
      </UiAlert>
    </div>
    <div v-else-if="detailDialog.inquiry" class="platform-messages__dialog">
      <section class="platform-messages__dialog-section">
        <dl>
          <div>
            <dt>{{ t('platformMessages.detail.sentAt') }}</dt>
            <dd>{{ formatDateTime(detailDialog.inquiry.createdAt) }}</dd>
          </div>
          <div>
            <dt>{{ t('platformMessages.detail.email') }}</dt>
            <dd>{{ detailDialog.inquiry.email || t('platformMessages.detail.emptyValue') }}</dd>
          </div>
          <div>
            <dt>{{ t('platformMessages.detail.phone') }}</dt>
            <dd>{{ detailDialog.inquiry.phone || t('platformMessages.detail.emptyValue') }}</dd>
          </div>
          <div>
            <dt>{{ t('platformMessages.detail.teacher') }}</dt>
            <dd>
              <template v-if="detailDialog.inquiry.teacherName">
                {{ detailDialog.inquiry.teacherName }}
              </template>
              <template v-else-if="detailDialog.inquiry.teacherSlug">
                {{ detailDialog.inquiry.teacherSlug }}
              </template>
              <template v-else>
                {{ t('platformMessages.detail.noTeacher') }}
              </template>
            </dd>
          </div>
          <div>
            <dt>{{ t('platformMessages.detail.route') }}</dt>
            <dd>
              {{ detailDialog.inquiry.route || t('platformMessages.detail.noRoute') }}
            </dd>
          </div>
        </dl>
      </section>
      <section class="platform-messages__dialog-section">
        <h4>{{ t('platformMessages.detail.message') }}</h4>
        <p class="platform-messages__dialog-message">{{ detailDialog.inquiry.message }}</p>
      </section>
    </div>
  </UiDialog>

  <UiDialog v-model="deleteDialog.open" :title="t('platformMessages.confirmDeleteTitle')" width="420px">
    <p class="platform-messages__confirm-text">{{ t('platformMessages.confirmDeleteMessage') }}</p>
    <template #footer>
      <div class="platform-messages__confirm-actions">
        <UiButton variant="link" color="secondary" :disabled="deleteDialog.loading" @click="closeDelete">
          {{ t('common.cancel') }}
        </UiButton>
        <UiButton color="danger" :loading="deleteDialog.loading" @click="performDelete">
          {{ t('platformMessages.actions.delete') }}
        </UiButton>
      </div>
    </template>
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
import { useToast } from '@/composables/useToast';
import { formatDateTime } from '@/utils/formatters';
import {
  deleteLandingInquiry,
  fetchLandingInquiry,
  fetchLandingInquiries,
  type LandingInquiry
} from '@/services/landingInquiries';

const { t } = useI18n();
const toast = useToast();

const inquiries = ref<LandingInquiry[]>([]);
const loading = ref(false);
const loadError = ref<string | null>(null);
const page = ref(0);
const size = ref(25);
const total = ref(0);

const headers = computed(() => [
  { title: t('platformMessages.columns.name'), key: 'name' },
  { title: t('platformMessages.columns.email'), key: 'email' },
  { title: t('platformMessages.columns.phone'), key: 'phone' },
  { title: t('platformMessages.columns.createdAt'), key: 'createdAt' },
  { title: t('platformMessages.columns.actions'), key: 'actions', align: 'end' }
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

const deleteDialog = reactive({
  open: false,
  loading: false,
  inquiry: null as LandingInquiry | null
});

const detailDialogTitle = computed(() => {
  if (!detailDialog.inquiry) {
    return t('platformMessages.detail.title');
  }
  return t('platformMessages.detail.titleWithName', { name: detailDialog.inquiry.name });
});

const loadInquiries = async () => {
  loading.value = true;
  loadError.value = null;
  try {
    const response = await fetchLandingInquiries({ page: page.value, size: size.value });

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
  } catch (error) {
    console.error('[platform] failed to load landing inquiries', error);
    loadError.value = t('platformMessages.errors.load');
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
    detailDialog.inquiry = await fetchLandingInquiry(inquiryId);
  } catch (error) {
    console.error('[platform] failed to load landing inquiry detail', error);
    detailDialog.error = t('platformMessages.errors.detail');
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

const confirmDelete = (inquiry: LandingInquiry) => {
  deleteDialog.inquiry = inquiry;
  deleteDialog.open = true;
  deleteDialog.loading = false;
};

const closeDelete = () => {
  deleteDialog.open = false;
  deleteDialog.inquiry = null;
  deleteDialog.loading = false;
};

const performDelete = async () => {
  if (!deleteDialog.inquiry) {
    return;
  }

  deleteDialog.loading = true;
  try {
    await deleteLandingInquiry(deleteDialog.inquiry.id);
    toast.success(t('platformMessages.notifications.deleted'));

    const remaining = total.value - 1;
    const maxIndex = page.value * size.value;
    if (page.value > 0 && remaining <= maxIndex) {
      page.value = Math.max(page.value - 1, 0);
    }

    if (detailDialog.inquiry?.id === deleteDialog.inquiry.id) {
      closeDetail();
    }

    closeDelete();
    await loadInquiries();
  } catch (error) {
    console.error('[platform] failed to delete landing inquiry', error);
    toast.error(t('platformMessages.errors.delete'));
    deleteDialog.loading = false;
  }
};

onMounted(() => {
  loadInquiries();
});
</script>

<style scoped>
.platform-messages {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

.platform-messages__panel {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.platform-messages__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sakai-space-4);
}

.platform-messages__header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--sakai-text-strong);
}

.platform-messages__header p {
  margin: 0.25rem 0 0;
  color: var(--sakai-text-muted);
}

.platform-messages__refresh {
  align-self: center;
}

.platform-messages__alert {
  margin-top: -0.5rem;
}

.platform-messages__sender {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.platform-messages__sender-name {
  font-weight: 600;
  color: var(--sakai-text-strong);
}

.platform-messages__sender-meta {
  color: var(--sakai-text-muted);
}

.platform-messages__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-2);
}

.platform-messages__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sakai-space-4);
  font-size: 0.9rem;
  color: var(--sakai-text-muted);
}

.platform-messages__pager {
  display: flex;
  gap: var(--sakai-space-2);
}

.platform-messages__dialog-loading {
  display: grid;
  gap: var(--sakai-space-3);
}

.platform-messages__dialog-error {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.platform-messages__dialog {
  display: grid;
  gap: var(--sakai-space-5);
}

.platform-messages__dialog-section {
  display: grid;
  gap: var(--sakai-space-3);
}

.platform-messages__dialog-section dl {
  display: grid;
  gap: var(--sakai-space-3);
}

.platform-messages__dialog-section dt {
  font-weight: 600;
  color: var(--sakai-text-strong);
}

.platform-messages__dialog-section dd {
  margin: 0;
  color: var(--sakai-text-color);
}

.platform-messages__dialog-message {
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  padding: var(--sakai-space-4);
  line-height: 1.6;
  white-space: pre-line;
}

.platform-messages__confirm-text {
  margin: 0 0 var(--sakai-space-4);
  color: var(--sakai-text-color);
}

.platform-messages__confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}
</style>
