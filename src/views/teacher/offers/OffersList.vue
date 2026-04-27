<template>
  <ThemePage :title="t('offers.title')" :subtitle="t('offers.subtitle')">
    <template #actions>
      <UiButton
        color="primary"
        prepend-icon="PlusOutlined"
        :disabled="!offersEnabled"
        @click="openCreate"
      >
        {{ t('offers.new') }}
      </UiButton>
    </template>

    <section class="offers-list" :class="{ 'offers-list--disabled': !offersEnabled }">
      <UiAlert
        v-if="!offersEnabled"
        color="warning"
        variant="soft"
        class="offers-list__disabled"
      >
        {{ t('offers.disabled') }}
      </UiAlert>

      <UiCard class="offers-list__filters" hover>
        <header class="offers-list__filters-header">
          <h2>{{ t('offers.filters.title') }}</h2>
          <UiButton variant="link" color="secondary" prepend-icon="ReloadOutlined" @click="resetFilters">
            {{ t('common.reset') }}
          </UiButton>
        </header>
        <div class="offers-list__filters-grid">
          <UiInput
            v-model="filters.search"
            :label="t('offers.filters.search')"
            appearance="search"
            :placeholder="t('offers.filters.searchPlaceholder')"
          />
          <UiSelect :model-value="filters.status" :label="t('offers.filters.status')" @update:model-value="onStatusChange">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>
          <UiInput
            v-model="filters.from"
            type="datetime-local"
            appearance="datetime"
            :label="t('offers.filters.validFrom')"
          />
          <UiInput
            v-model="filters.to"
            type="datetime-local"
            appearance="datetime"
            :label="t('offers.filters.validUntil')"
          />
        </div>
      </UiCard>

      <UiTable
        class="offers-list__table"
        :headers="headers"
        :items="store.items"
        :items-length="store.total"
        :page="currentPage"
        :items-per-page="filters.size"
        :items-per-page-options="[10, 20, 50]"
        :loading="store.loading"
        density="comfortable"
        @update:page="onPageChange"
        @update:items-per-page="onItemsPerPageChange"
      >
        <template #item.code="{ item }">
          <span class="offers-list__code">{{ item.code }}</span>
        </template>
        <template #item.type="{ item }">
          <UiTag size="sm" color="secondary">{{ readableType(item.type) }}</UiTag>
        </template>
        <template #item.applicability="{ item }">
          <span>{{ readableApplicability(item) }}</span>
        </template>
        <template #item.valid="{ item }">
          <div class="offers-list__valid">
            <span>{{ formatDate(item.validFrom) }}</span>
            <span v-if="item.validUntil" class="offers-list__valid-until">{{ formatDate(item.validUntil) }}</span>
            <span v-else class="offers-list__valid-until">∞</span>
          </div>
        </template>
        <template #item.status="{ item }">
          <UiTag :color="statusColor(item.status)" size="sm">{{ readableStatus(item.status) }}</UiTag>
        </template>
        <template #item.actions="{ item }">
          <div class="offers-list__row-actions">
            <UiButton
              variant="link"
              color="primary"
              size="sm"
              prepend-icon="EditOutlined"
              @click="openEdit(item)"
            >
              {{ t('common.edit') }}
            </UiButton>
            <UiButton
              variant="link"
              color="danger"
              size="sm"
              prepend-icon="DeleteOutlined"
              @click="remove(item)"
            >
              {{ t('common.delete') }}
            </UiButton>
          </div>
        </template>
        <template #empty>
          <UiAlert variant="soft" color="info">{{ t('offers.empty') }}</UiAlert>
        </template>
      </UiTable>
    </section>

  </ThemePage>
</template>

<script setup lang="ts">
import { FEATURE } from '@/constants/featureCatalog';
import { computed, reactive, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiTag from '@/components/ui/UiTag.vue';
import { useToast } from '@/composables/useToast';
import { useOffersStore, type StatusFilter } from '@/stores/offers';
import { useFeaturesStore } from '@/stores/features';
import type { OfferResponse, OfferStatus, OfferType } from '@/api/offers';

const router = useRouter();
const { t, locale } = useI18n();
const toast = useToast();
const store = useOffersStore();
const features = useFeaturesStore();
const offersEnabled = computed(() => features.hasFeature(FEATURE.offers));

const filters = reactive({
  search: '',
  status: 'ALL' as StatusFilter,
  from: '',
  to: '',
  size: 20
});

const currentPage = ref(1);

const headers = computed(() => [
  { title: t('offers.table.code'), key: 'code' },
  { title: t('offers.table.name'), key: 'name' },
  { title: t('offers.table.type'), key: 'type' },
  { title: t('offers.table.applicability'), key: 'applicability' },
  { title: t('offers.table.valid'), key: 'valid' },
  { title: t('offers.table.status'), key: 'status' },
  { title: t('offers.table.actions'), key: 'actions', sortable: false }
]);

const statusOptions = computed(() => [
  { value: 'ALL', label: t('offers.filters.statusAll') },
  { value: 'CURRENT', label: t('offers.status.current') },
  { value: 'UPCOMING', label: t('offers.status.upcoming') },
  { value: 'EXPIRED', label: t('offers.status.expired') }
]);

let searchTimer: number | undefined;
let suppressFetch = false;

const toIso = (value: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale.value);
};

const statusColor = (status: OfferStatus) => {
  switch (status) {
    case 'CURRENT':
      return 'success';
    case 'UPCOMING':
      return 'info';
    case 'EXPIRED':
      return 'danger';
    default:
      return 'secondary';
  }
};

const readableStatus = (status: OfferStatus) => {
  switch (status) {
    case 'CURRENT':
      return t('offers.status.current');
    case 'UPCOMING':
      return t('offers.status.upcoming');
    case 'EXPIRED':
      return t('offers.status.expired');
    default:
      return status;
  }
};

const readableType = (type: OfferType) => {
  switch (type) {
    case 'PERCENTAGE':
      return t('offers.types.percentage');
    case 'FIXED':
      return t('offers.types.fixed');
    case 'BUNDLE':
      return t('offers.types.bundle');
    default:
      return type;
  }
};

const readableApplicability = (offer: OfferResponse) => {
  if (offer.type === 'BUNDLE') {
    return t('offers.applicability.bundle');
  }
  return offer.applicability === 'ALL_COURSES'
    ? t('offers.applicability.all')
    : t('offers.applicability.specific');
};

const buildQuery = (overrides: { page?: number; size?: number } = {}) => ({
  q: filters.search || undefined,
  status: filters.status,
  from: toIso(filters.from),
  to: toIso(filters.to),
  page: overrides.page ?? Math.max(currentPage.value - 1, 0),
  size: overrides.size ?? filters.size
});

const fetchOffers = async (overrides: { page?: number; size?: number } = {}) => {
  if (!offersEnabled.value) {
    return;
  }
  try {
    await store.fetch(buildQuery(overrides));
    currentPage.value = store.page + 1;
    filters.size = store.size;
  } catch (error) {
    if (offersEnabled.value) {
      toast.error(t('offers.loadFailed'));
    }
  }
};

const debounceFetch = () => {
  if (searchTimer) {
    window.clearTimeout(searchTimer);
  }
  searchTimer = window.setTimeout(() => {
    if (offersEnabled.value) {
      fetchOffers();
    }
  }, 300);
};

watch(
  () => filters.status,
  () => {
    if (suppressFetch) return;
    currentPage.value = 1;
    fetchOffers({ page: 0 });
  }
);

watch(
  () => [filters.from, filters.to],
  () => {
    if (suppressFetch) return;
    currentPage.value = 1;
    fetchOffers({ page: 0 });
  }
);

watch(
  () => filters.search,
  () => {
    if (suppressFetch) return;
    currentPage.value = 1;
    debounceFetch();
  }
);

watch(
  offersEnabled,
  (enabled) => {
    if (enabled) {
      currentPage.value = 1;
      fetchOffers({ page: 0 });
    }
  }
);

const onStatusChange = (value: string | number | string[] | null) => {
  if (Array.isArray(value)) {
    filters.status = (value[0] as StatusFilter) ?? 'ALL';
  } else if (value == null || value === '') {
    filters.status = 'ALL';
  } else {
    filters.status = value as StatusFilter;
  }
};

const onPageChange = (page: number) => {
  const targetPage = Math.max(Number(page) || 1, 1);
  currentPage.value = targetPage;
  fetchOffers({ page: targetPage - 1 });
};

const onItemsPerPageChange = (size: number) => {
  filters.size = Number(size) || 20;
  currentPage.value = 1;
  fetchOffers({ page: 0, size: filters.size });
};

const resetFilters = () => {
  suppressFetch = true;
  filters.search = '';
  filters.status = 'ALL';
  filters.from = '';
  filters.to = '';
  filters.size = 20;
  currentPage.value = 1;
  suppressFetch = false;
  fetchOffers({ page: 0, size: filters.size });
};

const openCreate = () => {
  router.push({ name: 'teacher-offers-create' });
};

const openEdit = (offer: OfferResponse) => {
  router.push({ name: 'teacher-offers-edit', params: { id: offer.id } });
};

const remove = async (offer: OfferResponse) => {
  if (!window.confirm(t('offers.confirmDelete', { name: offer.name }))) {
    return;
  }
  try {
    await store.remove(offer.id);
    await fetchOffers({ page: Math.max(currentPage.value - 1, 0) });
    toast.success(t('offers.deleted'));
  } catch (error) {
    toast.error(t('offers.deleteFailed'));
  }
};

onMounted(async () => {
  await features.ensureLoaded();
  await fetchOffers({ page: 0 });
});
</script>

<style scoped>
.offers-list {
  display: grid;
  gap: var(--sakai-space-6);
}

.offers-list--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.offers-list__disabled {
  margin-bottom: var(--sakai-space-4);
}

.offers-list__filters {
  display: grid;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-6);
}

.offers-list__filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.offers-list__filters-grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.offers-list__table {
  overflow-x: auto;
}

.offers-list__row-actions {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
}

.offers-list__valid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.offers-list__valid-until {
  color: var(--sakai-color-text-subtle);
  font-size: 0.85rem;
}

.offers-list__code {
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
