<template>
  <UiCard class="landing-list">
    <template #title>
      <div class="landing-list__header">
        <h3>{{ t('landing.admin.pages') }}</h3>
        <p>{{ t('landing.admin.selectPrompt') }}</p>
      </div>
    </template>
    <template #actions>
      <UiButton color="primary" prepend-icon="PlusOutlined" @click="$emit('create')">
        {{ t('landing.admin.newPage') }}
      </UiButton>
    </template>

    <div class="landing-list__filters">
      <UiInput
        v-model="filters.route"
        :label="t('landing.admin.filterRoute')"
        @keyup.enter="emitFilter"
      />
      <UiSelect v-model="filters.status" :label="t('landing.admin.filterStatus')">
        <option value="">—</option>
        <option v-for="item in statusItems" :key="item.value" :value="item.value">
          {{ item.title }}
        </option>
      </UiSelect>
      <UiButton class="landing-list__apply" color="primary" button-type="button" @click="emitFilter">
        {{ t('common.apply') }}
      </UiButton>
    </div>

    <div class="landing-list__table-wrapper">
      <UiTable
        class="landing-list__table"
        :headers="headers"
        :items="items"
        :loading="loading"
        density="comfortable"
        @click:row="(_, row) => $emit('select', row.item)"
      >
        <template #item.status="{ item }">
          <UiBadge :color="item.status === 'published' ? 'success' : 'warning'">
            {{ item.status }}
          </UiBadge>
        </template>
        <template #item.current="{ item }">
          <span class="landing-list__current" :class="{ 'is-active': item.current }">
            <UiIcon :name="item.current ? 'CheckCircleOutlined' : 'StopOutlined'" :size="16" />
          </span>
        </template>
        <template #item.actions="{ item }">
          <UiButton variant="link" color="primary" append-icon="ExportOutlined" @click.stop="$emit('preview', item)">
            {{ t('common.preview') }}
          </UiButton>
        </template>
      </UiTable>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import type { LandingPageSummary } from '@/services/landing';

const props = defineProps<{
  items: LandingPageSummary[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'filter', filters: { route?: string; status?: string }): void;
  (e: 'select', page: LandingPageSummary): void;
  (e: 'create'): void;
  (e: 'preview', page: LandingPageSummary): void;
}>();

const { t } = useI18n();

const headers = [
  { title: t('landing.admin.route'), key: 'route', width: 140 },
  { title: t('landing.admin.status'), key: 'status', width: 120 },
  { title: t('landing.admin.version'), key: 'version', width: 80 },
  { title: t('landing.admin.current'), key: 'current', width: 80 },
  { title: t('landing.admin.updatedAt'), key: 'updatedAt', width: 180 },
  { title: '', key: 'actions', width: 120 }
];

const statusItems = [
  { title: t('landing.admin.statusDraft'), value: 'draft' },
  { title: t('landing.admin.statusPublished'), value: 'published' }
];

const filters = reactive<{ route?: string; status?: string }>({});

const emitFilter = () => emit('filter', { ...filters });
</script>

<style scoped>
.landing-list {
  gap: var(--sakai-space-5);
}

.landing-list__header {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.landing-list__header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.landing-list__header p {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.landing-list__filters {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: end;
}

.landing-list__apply {
  justify-self: start;
}

.landing-list__table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.landing-list__table {
  width: 100%;
  min-width: 540px;
}

.landing-list__current {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  color: var(--sakai-text-color-tertiary);
  transition: background-color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.landing-list__current.is-active {
  background: color-mix(in srgb, var(--sakai-success) 18%, transparent);
  color: var(--sakai-success);
}

@media (max-width: 768px) {
  .landing-list__filters {
    grid-template-columns: 1fr;
  }
}
</style>
