<template>
  <ThemePage :title="t('badges.teacher.title')" :subtitle="t('badges.teacher.subtitle')">
    <template #actions>
      <UiButton variant="outline" color="primary" prepend-icon="TrophyOutlined" @click="openAward()">
        {{ t('badges.teacher.awardAction') }}
      </UiButton>
      <UiButton color="primary" prepend-icon="PlusOutlined" @click="openCreate">
        {{ t('badges.teacher.create') }}
      </UiButton>
    </template>

    <section class="badges-list">
      <UiCard hover class="badges-list__card">
        <template #title>{{ t('badges.teacher.tableTitle') }}</template>
        <div class="badges-list__table-wrapper">
          <UiTable
          :headers="badgeHeaders"
          :items="badges"
          :items-length="badgePage.total"
          :page="badgePage.page + 1"
          :items-per-page="badgePage.size"
          :items-per-page-options="[10, 20, 50]"
          :loading="badgesLoading"
          density="comfortable"
          @update:page="onBadgePageChange"
          @update:items-per-page="onBadgeSizeChange"
        >
          <template #item.icon="{ item }">
            <div class="badges-list__badge-icon">
              <UiIcon v-if="!item.iconUrl" name="TrophyOutlined" :size="32" />
              <img v-else :src="item.iconUrl" :alt="item.name" loading="lazy" />
            </div>
          </template>
          <template #item.name="{ item }">
            <div class="badges-list__badge-name">
              <span class="badges-list__badge-title">{{ item.name }}</span>
            </div>
          </template>
          <template #item.description="{ item }">
            <span class="badges-list__badge-description">
              {{ item.description || t('badges.teacher.noDescription') }}
            </span>
          </template>
          <template #item.rule="{ item }">
            <UiTag size="sm" color="secondary">
              {{ t('badges.teacher.ruleCourseCompletions', { count: item.rule?.threshold ?? 1 }) }}
            </UiTag>
          </template>
          <template #item.actions="{ item }">
            <div class="badges-list__actions">
              <UiButton variant="link" size="sm" @click="selectBadge(item)">
                {{ t('badges.teacher.viewAwards') }}
              </UiButton>
              <UiButton variant="link" color="primary" size="sm" @click="openAward(item)">
                {{ t('badges.teacher.awardAction') }}
              </UiButton>
              <UiButton variant="link" size="sm" @click="openEdit(item)">
                {{ t('common.edit') }}
              </UiButton>
              <UiButton variant="link" color="danger" size="sm" @click="confirmDelete(item)">
                {{ t('common.delete') }}
              </UiButton>
            </div>
          </template>
            <template #empty>
              <UiAlert variant="soft" color="info">{{ t('badges.teacher.empty') }}</UiAlert>
            </template>
          </UiTable>
        </div>
      </UiCard>

      <UiCard v-if="selectedBadge" hover class="badges-list__card">
        <template #title>
          {{ t('badges.teacher.assignmentsTitle', { name: selectedBadge.name }) }}
        </template>
        <template #actions>
          <UiButton color="primary" size="sm" prepend-icon="PlusOutlined" @click="openAward(selectedBadge)">
            {{ t('badges.teacher.awardAction') }}
          </UiButton>
        </template>
        <div class="badges-list__table-wrapper">
          <UiTable
          :headers="assignmentHeaders"
          :items="assignments"
          :items-length="assignmentPage.total"
          :page="assignmentPage.page + 1"
          :items-per-page="assignmentPage.size"
          :items-per-page-options="[10, 20, 50]"
          :loading="assignmentsLoading"
          density="comfortable"
          @update:page="onAssignmentPageChange"
          @update:items-per-page="onAssignmentSizeChange"
        >
          <template #item.student="{ item }">
            <div class="badges-list__student">
              <span class="badges-list__student-name">{{ item.studentName || t('badges.teacher.unknownStudent') }}</span>
              <span v-if="item.studentEmail" class="badges-list__student-email">{{ item.studentEmail }}</span>
            </div>
          </template>
          <template #item.earnedAt="{ item }">
            {{ formatDateTime(item.earnedAt) }}
          </template>
          <template #item.metadata="{ item }">
            <span v-if="item.metadata">{{ item.metadata }}</span>
            <span v-else class="badges-list__metadata-empty">{{ t('badges.teacher.noMetadata') }}</span>
          </template>
          <template #item.actions="{ item }">
            <UiButton
              variant="link"
              color="danger"
              size="sm"
              prepend-icon="DeleteOutlined"
              @click="revoke(item)"
            >
              {{ t('badges.teacher.revokeAction') }}
            </UiButton>
          </template>
            <template #empty>
              <UiAlert variant="soft" color="info">{{ t('badges.teacher.noAssignments') }}</UiAlert>
            </template>
          </UiTable>
        </div>
      </UiCard>
      <UiCard v-else hover>
        <template #title>{{ t('badges.teacher.assignmentsPlaceholderTitle') }}</template>
        <p class="badges-list__placeholder">{{ t('badges.teacher.assignmentsPlaceholder') }}</p>
      </UiCard>
    </section>

    <UiDialog v-model="createDialogOpen" :title="t('badges.teacher.createTitle')" width="540px">
      <BadgeForm :loading="dialogLoading" @submit="createBadge" />
    </UiDialog>

    <UiDialog v-model="editDialog.open" :title="t('badges.teacher.editTitle')" width="540px">
      <BadgeForm :badge="editDialog.badge" :loading="dialogLoading" @submit="updateBadge" />
    </UiDialog>

    <AwardBadgeDialog
      v-model="awardDialog.open"
      :badges="badges"
      :selected-badge-id="awardDialog.badgeId"
      :loading="awardDialog.loading"
      @update:selected-badge-id="(value) => (awardDialog.badgeId = value)"
      @submit="submitAward"
    />
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { useToast } from '@/composables/useToast';

import {
  listTeacherBadges,
  createTeacherBadge,
  updateTeacherBadge,
  deleteTeacherBadge,
  listBadgeAssignments,
  awardBadge,
  revokeBadge,
  type TeacherBadge,
  type TeacherBadgeCreatePayload,
  type BadgeAssignment
} from '@/api/badges';

import BadgeForm from './BadgeForm.vue';
import AwardBadgeDialog from './AwardBadgeDialog.vue';

const { t } = useI18n();
const toast = useToast();

const badges = ref<TeacherBadge[]>([]);
const badgesLoading = ref(false);
const badgePage = reactive({ page: 0, size: 10, total: 0 });

const assignments = ref<BadgeAssignment[]>([]);
const assignmentsLoading = ref(false);
const assignmentPage = reactive({ page: 0, size: 10, total: 0 });

const selectedBadgeId = ref<number | null>(null);

const createDialogOpen = ref(false);
const editDialog = reactive<{ open: boolean; badge: TeacherBadge | null }>({ open: false, badge: null });
const awardDialog = reactive<{ open: boolean; badgeId: number | null; loading: boolean }>({
  open: false,
  badgeId: null,
  loading: false
});
const dialogLoading = ref(false);

const badgeHeaders = computed(() => [
  { title: t('badges.table.icon'), key: 'icon', sortable: false },
  { title: t('badges.table.name'), key: 'name' },
  { title: t('badges.table.description'), key: 'description' },
  { title: t('badges.table.rule'), key: 'rule' },
  { title: t('badges.table.actions'), key: 'actions', sortable: false }
]);

const assignmentHeaders = computed(() => [
  { title: t('badges.teacher.assignmentStudent'), key: 'student' },
  { title: t('badges.teacher.assignmentEarnedAt'), key: 'earnedAt' },
  { title: t('badges.teacher.assignmentMetadata'), key: 'metadata' },
  { title: t('badges.teacher.assignmentActions'), key: 'actions', sortable: false }
]);

const selectedBadge = computed(() => badges.value.find((badge) => badge.id === selectedBadgeId.value) || null);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const loadBadges = async () => {
  badgesLoading.value = true;
  try {
    const page = await listTeacherBadges({ page: badgePage.page, size: badgePage.size });
    badges.value = page.items;
    badgePage.total = page.total;
    if (page.items.length === 0) {
      selectedBadgeId.value = null;
    } else if (!selectedBadge.value) {
      selectedBadgeId.value = page.items[0]?.id ?? null;
    }
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('badges.teacher.loadFailed') });
  } finally {
    badgesLoading.value = false;
  }
};

const loadAssignments = async () => {
  const badgeId = selectedBadgeId.value;
  if (!badgeId) {
    assignments.value = [];
    assignmentPage.total = 0;
    return;
  }
  assignmentsLoading.value = true;
  try {
    const page = await listBadgeAssignments(badgeId, {
      page: assignmentPage.page,
      size: assignmentPage.size
    });
    assignments.value = page.items;
    assignmentPage.total = page.total;
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('badges.teacher.assignmentsFailed') });
  } finally {
    assignmentsLoading.value = false;
  }
};

watch(selectedBadgeId, () => {
  assignmentPage.page = 0;
  loadAssignments();
});

const openCreate = () => {
  createDialogOpen.value = true;
};

const createBadge = async (payload: TeacherBadgeCreatePayload) => {
  dialogLoading.value = true;
  try {
    await createTeacherBadge(payload);
    createDialogOpen.value = false;
    toast.success(t('badges.teacher.createSuccess'));
    await loadBadges();
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('badges.teacher.createFailed') });
  } finally {
    dialogLoading.value = false;
  }
};

const openEdit = (badge: TeacherBadge) => {
  editDialog.badge = badge;
  editDialog.open = true;
};

const updateBadge = async (payload: TeacherBadgeCreatePayload) => {
  if (!editDialog.badge) return;
  dialogLoading.value = true;
  try {
    await updateTeacherBadge(editDialog.badge.id, payload);
    editDialog.open = false;
    toast.success(t('badges.teacher.updateSuccess'));
    await loadBadges();
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('badges.teacher.updateFailed') });
  } finally {
    dialogLoading.value = false;
  }
};

const confirmDelete = async (badge: TeacherBadge) => {
  if (!window.confirm(t('badges.teacher.deleteConfirm', { name: badge.name }))) {
    return;
  }
  try {
    await deleteTeacherBadge(badge.id);
    toast.success(t('badges.teacher.deleteSuccess'));
    await loadBadges();
    if (selectedBadgeId.value === badge.id) {
      selectedBadgeId.value = badges.value[0]?.id ?? null;
    }
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('badges.teacher.deleteFailed') });
  }
};

const selectBadge = (badge: TeacherBadge) => {
  selectedBadgeId.value = badge.id;
};

const openAward = (badge?: TeacherBadge | null) => {
  const target = badge ?? selectedBadge.value ?? badges.value[0] ?? null;
  awardDialog.badgeId = target?.id ?? null;
  awardDialog.open = true;
  awardDialog.loading = false;
};

const submitAward = async (payload: { badgeId: number; studentId: number; metadata?: string | null }) => {
  if (!payload.badgeId) return;
  awardDialog.loading = true;
  try {
    await awardBadge(payload.badgeId, {
      studentId: payload.studentId,
      metadata: payload.metadata ?? undefined
    });
    toast.success(t('badges.teacher.awardSuccess'));
    awardDialog.open = false;
    selectedBadgeId.value = payload.badgeId;
    await loadAssignments();
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('badges.teacher.awardFailed') });
  } finally {
    awardDialog.loading = false;
  }
};

const revoke = async (assignment: BadgeAssignment) => {
  if (!selectedBadge.value) return;
  if (!window.confirm(t('badges.teacher.revokeConfirm', { name: assignment.studentName || assignment.studentId }))) {
    return;
  }
  try {
    await revokeBadge(selectedBadge.value.id, assignment.studentId);
    toast.success(t('badges.teacher.revokeSuccess'));
    await loadAssignments();
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('badges.teacher.revokeFailed') });
  }
};

const onBadgePageChange = (page: number) => {
  badgePage.page = Math.max(Number(page) - 1, 0);
  loadBadges();
};

const onBadgeSizeChange = (size: number) => {
  badgePage.size = Number(size) || 10;
  badgePage.page = 0;
  loadBadges();
};

const onAssignmentPageChange = (page: number) => {
  assignmentPage.page = Math.max(Number(page) - 1, 0);
  loadAssignments();
};

const onAssignmentSizeChange = (size: number) => {
  assignmentPage.size = Number(size) || 10;
  assignmentPage.page = 0;
  loadAssignments();
};

onMounted(async () => {
  await loadBadges();
  await loadAssignments();
});
</script>

<style scoped>
.badges-list {
  display: grid;
  gap: var(--sakai-space-6);
}

.badges-list > * {
  min-width: 0;
}

@media (min-width: 992px) {
  .badges-list {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    align-items: start;
  }
}

.badges-list__card {
  height: 100%;
}

.badges-list__table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.badges-list__table-wrapper :deep(table) {
  min-width: 640px;
}

.badges-list__badge-icon {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sakai-border-radius-md);
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
  overflow: hidden;
}

.badges-list__badge-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badges-list__badge-name {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.badges-list__badge-title {
  font-weight: 600;
}

.badges-list__badge-description {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
}

.badges-list__actions {
  display: inline-flex;
  gap: var(--sakai-space-2);
  flex-wrap: wrap;
}

.badges-list__student {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.badges-list__student-name {
  font-weight: 600;
}

.badges-list__student-email {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.badges-list__metadata-empty {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.badges-list__placeholder {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
}
</style>
