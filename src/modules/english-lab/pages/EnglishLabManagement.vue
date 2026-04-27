<template>
  <ThemePage :title="t('labEnglish.management.title')" :subtitle="t('labEnglish.management.subtitle')">
    <template #actions>
      <UiButton
        v-if="labEnabled"
        color="primary"
        prepend-icon="PlusOutlined"
        @click="openCreate"
      >
        {{ t('labEnglish.management.addAssignment') }}
      </UiButton>
    </template>

    <UiAlert v-if="!labEnabled" color="warning" variant="soft">
      {{ t('labEnglish.management.disabled') }}
    </UiAlert>

    <section v-else class="lab-management">
      <UiCard class="lab-management__card" hover>
        <template #title>
          {{ t('labEnglish.management.assignmentsTitle') }}
        </template>

        <p v-if="assignmentsError" class="lab-management__error">
          {{ t(assignmentsError) }}
        </p>

        <UiTable
          v-else
          :headers="tableHeaders"
          :items="tableItems"
          :loading="assignmentsLoading"
          density="comfortable"
          class="lab-management__table"
        >
          <template #item.categoryLabel="{ item }">
            <span>{{ item.categoryLabel }}</span>
          </template>
          <template #item.dueDateLabel="{ item }">
            <span>{{ item.dueDateLabel }}</span>
          </template>
          <template #item.updatedLabel="{ item }">
            <span>{{ item.updatedLabel }}</span>
          </template>
          <template #item.actions="{ item }">
            <div class="lab-management__actions">
              <UiButton size="sm" variant="outline" color="primary" @click="openEdit(item.id)">
                {{ t('common.edit') }}
              </UiButton>
              <UiButton size="sm" variant="outline" color="danger" @click="confirmDelete(item.id)">
                {{ t('common.delete') }}
              </UiButton>
            </div>
          </template>
        </UiTable>

        <p v-if="!assignmentsLoading && !tableItems.length" class="lab-management__empty">
          {{ t('labEnglish.management.emptyState') }}
        </p>
      </UiCard>
    </section>

    <UiDialog
      v-model="dialog.open"
      :title="dialog.id ? t('labEnglish.management.editTitle') : t('labEnglish.management.createTitle')"
      width="520px"
    >
      <form class="lab-management__form" @submit.prevent="saveAssignment">
        <UiInput v-model="dialog.title" :label="t('labEnglish.management.fields.title')" required />

        <UiSelect
          :model-value="dialog.category"
          :label="t('labEnglish.management.fields.category')"
          required
          @update:model-value="onCategoryChange"
        >
          <option v-if="!categoryOptions.length" disabled>
            {{ t('labEnglish.management.noCategories') }}
          </option>
          <option
            v-for="option in categoryOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </UiSelect>

        <UiInput
          v-model="dialog.dueDate"
          type="date"
          :label="t('labEnglish.management.fields.dueDate')"
        />

        <UiTextarea
          v-model="dialog.instructions"
          :label="t('labEnglish.management.fields.instructions')"
          :placeholder="t('labEnglish.management.instructionsPlaceholder')"
          rows="4"
        />

        <div class="lab-management__form-actions">
          <UiButton variant="link" color="secondary" @click.prevent="closeDialog">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton button-type="submit" color="primary" :loading="saving" :disabled="!canSubmit">
            {{ t('common.save') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model="confirm.open" :title="t('labEnglish.management.deleteTitle')" width="420px">
      <p class="lab-management__confirm">{{ confirm.body }}</p>
      <div class="lab-management__form-actions">
        <UiButton variant="link" color="secondary" @click="confirm.open = false">
          {{ t('common.cancel') }}
        </UiButton>
        <UiButton color="danger" :loading="confirm.loading" @click="deleteAssignment">
          {{ t('common.delete') }}
        </UiButton>
      </div>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import { useEnglishLabStore } from '../store/englishLab.store';
import { useAuthStore } from '@/stores/auth';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';
import { useToast } from '@/composables/useToast';

const { t, locale } = useI18n();
const labStore = useEnglishLabStore();
const auth = useAuthStore();
const features = useFeaturesStore();
const toast = useToast();

const dialog = reactive({
  open: false,
  id: null as number | null,
  title: '',
  category: '',
  dueDate: '',
  instructions: ''
});

const confirm = reactive({
  open: false,
  assignmentId: null as number | null,
  title: '',
  loading: false,
  get body() {
    return t('labEnglish.management.deleteBody', { title: this.title });
  }
});

const saving = ref(false);

const labEnabled = computed(() => features.hasFeature(FEATURE.englishLab));

const assignmentsLoading = computed(
  () => labStore.assignmentsState.loading && !labStore.assignmentsState.loaded
);

const assignmentsError = computed(() => labStore.assignmentsState.error);

const categoryFeatureMap: Record<string, string> = {
  animals: FEATURE.englishLabAnimals,
  fruits: FEATURE.englishLabFruits,
  actions: FEATURE.englishLabActions,
  bodyParts: FEATURE.englishLabBody,
  emotions: FEATURE.englishLabEmotions
};

const categoryOptions = computed(() =>
  labStore.categories
    .filter((category) => {
      const feature = categoryFeatureMap[category];
      if (!feature) {
        return true;
      }
      return features.hasFeature(feature as any);
    })
    .map((category) => ({
      value: category,
      label: t(`labEnglish.categories.${category}` as const, category)
    }))
);

const tableHeaders = computed(() => [
  { key: 'title', title: t('labEnglish.management.table.title') },
  { key: 'categoryLabel', title: t('labEnglish.management.table.category') },
  { key: 'dueDateLabel', title: t('labEnglish.management.table.dueDate') },
  { key: 'updatedLabel', title: t('labEnglish.management.table.updated') },
  { key: 'actions', title: t('common.actions'), sortable: false }
]);

const tableItems = computed(() =>
  labStore.assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    category: assignment.category,
    categoryLabel: t(`labEnglish.categories.${assignment.category}` as const, assignment.category),
    dueDateLabel: assignment.dueDate
      ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(assignment.dueDate))
      : t('labEnglish.labels.noDueDate'),
    updatedLabel: new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(assignment.updatedAt)),
    instructions: assignment.instructions
  }))
);

const canSubmit = computed(
  () => Boolean(dialog.title.trim()) && Boolean(dialog.category) && !saving.value
);

const resetDialog = () => {
  dialog.id = null;
  dialog.title = '';
  dialog.category = categoryOptions.value[0]?.value || '';
  dialog.dueDate = '';
  dialog.instructions = '';
};

const openCreate = () => {
  resetDialog();
  dialog.open = true;
};

const findAssignment = (id: number) =>
  labStore.assignments.find((assignment) => assignment.id === id) ?? null;

const openEdit = (id: number) => {
  const assignment = findAssignment(id);
  if (!assignment) {
    return;
  }
  dialog.id = assignment.id;
  dialog.title = assignment.title;
  dialog.category = assignment.category;
  dialog.dueDate = assignment.dueDate ?? '';
  dialog.instructions = assignment.instructions ?? '';
  dialog.open = true;
};

const closeDialog = () => {
  dialog.open = false;
  saving.value = false;
};

const onCategoryChange = (value: string) => {
  dialog.category = value;
};

const saveAssignment = async () => {
  if (!canSubmit.value) {
    return;
  }
  saving.value = true;
  try {
    await labStore.saveAssignment({
      id: dialog.id ?? undefined,
      title: dialog.title.trim(),
      category: dialog.category,
      dueDate: dialog.dueDate || null,
      instructions: dialog.instructions?.trim() || null
    });
    toast.success(
      dialog.id
        ? t('labEnglish.management.toastUpdated')
        : t('labEnglish.management.toastCreated')
    );
    closeDialog();
  } catch (error) {
    console.error('[english-lab] save assignment failed', error);
    toast.error(t('labEnglish.management.toastError'));
    saving.value = false;
  }
};

const confirmDelete = (id: number) => {
  const assignment = findAssignment(id);
  if (!assignment) {
    return;
  }
  confirm.assignmentId = assignment.id;
  confirm.title = assignment.title;
  confirm.open = true;
};

const deleteAssignment = async () => {
  if (confirm.assignmentId == null) {
    return;
  }
  confirm.loading = true;
  try {
    await labStore.removeAssignment(confirm.assignmentId);
    toast.success(t('labEnglish.management.toastDeleted'));
    confirm.open = false;
  } catch (error) {
    console.error('[english-lab] delete assignment failed', error);
    toast.error(t('labEnglish.management.toastError'));
  } finally {
    confirm.loading = false;
  }
};

onMounted(async () => {
  labStore.setUserId(auth.teacherId ?? null);
  await Promise.all([labStore.loadCategories(), labStore.loadAssignments(true)]);
  if (!dialog.category) {
    dialog.category = categoryOptions.value[0]?.value || '';
  }
});
</script>

<style scoped>
.lab-management {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.lab-management__card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.lab-management__table {
  width: 100%;
}

.lab-management__actions {
  display: flex;
  gap: 0.5rem;
}

.lab-management__empty {
  margin: 0;
  color: var(--muse-text-muted, #64748b);
  text-align: center;
}

.lab-management__error {
  color: var(--muse-danger, #dc2626);
}

.lab-management__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lab-management__form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.lab-management__confirm {
  margin-bottom: 1.5rem;
}
</style>
