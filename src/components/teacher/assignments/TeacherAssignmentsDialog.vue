<template>
  <UiDialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="720px"
    @update:model-value="onDialogUpdate"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-3">
        <p class="m-0 text-content-tertiary text-[0.9rem]">
          {{ t('teacher.assignments.subtitle') }}
        </p>
        <UiButton
          color="primary"
          prepend-icon="PlusOutlined"
          @click="onAdd"
        >
          {{ t('teacher.assignments.add') }}
        </UiButton>
      </div>

      <UiAlert v-if="loadError" color="danger" variant="soft">
        <div class="flex items-center justify-between gap-3">
          <span>{{ loadError }}</span>
          <UiButton variant="link" color="primary" @click="loadAssignments">
            {{ t('common.retry') }}
          </UiButton>
        </div>
      </UiAlert>

      <div v-else-if="loading" class="flex flex-col gap-2">
        <UiSkeleton height="56px" />
        <UiSkeleton height="56px" />
      </div>

      <UiAlert
        v-else-if="!lessonAssignments.length"
        color="info"
        variant="soft"
      >
        {{ t('teacher.assignments.empty') }}
      </UiAlert>

      <ul v-else class="list-none m-0 p-0 flex flex-col gap-3">
        <li
          v-for="assignment in lessonAssignments"
          :key="assignment.id"
          class="flex flex-col gap-3 p-4 rounded-sakai-lg [border:1px_solid_color-mix(in_srgb,var(--sakai-border-color)_75%,transparent)] bg-[color-mix(in_srgb,var(--sakai-surface)_96%,transparent)]"
        >
          <div>
            <h4 class="m-0 text-base font-semibold text-content">
              {{ assignment.title }}
            </h4>
            <div class="flex flex-wrap gap-2 mt-2">
              <UiTag size="sm" color="info">
                {{ assignment.dueAt ? t('teacher.assignments.dueAt', { date: formatDateTime(assignment.dueAt) }) : t('teacher.assignments.noDueDate') }}
              </UiTag>
              <UiTag size="sm" color="secondary">
                {{ t('teacher.assignments.maxScoreShort', { score: assignment.maxScore }) }}
              </UiTag>
              <UiTag size="sm" color="secondary">
                {{ t('teacher.assignments.attachmentsCount', (assignment.attachments?.length ?? 0), { count: assignment.attachments?.length ?? 0 }) }}
              </UiTag>
            </div>
            <p
              v-if="assignment.description"
              class="mt-2 mx-0 mb-0 text-content-tertiary text-[0.9rem] leading-normal"
            >
              {{ assignment.description }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UiButton
              variant="link"
              color="primary"
              prepend-icon="EyeOutlined"
              @click="onViewSubmissions(assignment)"
            >
              {{ t('teacher.assignments.viewSubmissions') }}
            </UiButton>
            <UiButton
              variant="link"
              color="secondary"
              prepend-icon="EditOutlined"
              @click="onEdit(assignment)"
            >
              {{ t('teacher.assignments.edit') }}
            </UiButton>
            <UiButton
              variant="link"
              color="danger"
              prepend-icon="DeleteOutlined"
              :disabled="deletingId === assignment.id"
              @click="onDelete(assignment)"
            >
              {{ t('teacher.assignments.delete') }}
            </UiButton>
          </div>
        </li>
      </ul>
    </div>

    <template #footer>
      <UiButton variant="link" color="secondary" @click="onDialogUpdate(false)">
        {{ t('common.close') }}
      </UiButton>
    </template>
  </UiDialog>

  <TeacherSubmissionsDialog
    v-model="submissionsDialogOpen"
    :assignment="selectedAssignment"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import TeacherSubmissionsDialog from './TeacherSubmissionsDialog.vue';
import { useLearningStore } from '@/stores/learning';
import { useToast } from '@/composables/useToast';
import { handleApiError } from '@/composables/useApiError';
import { formatDateTime } from '@/utils/formatters';
import type { Assignment } from '@/services/learning';

const props = defineProps<{
  modelValue: boolean;
  courseId: number;
  lessonId: number | null;
  lessonTitle?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n();
const router = useRouter();
const learning = useLearningStore();
const toast = useToast();

const loading = ref(false);
const loadError = ref<string>('');
const deletingId = ref<number | null>(null);
const submissionsDialogOpen = ref(false);
const selectedAssignment = ref<Assignment | null>(null);

const dialogTitle = computed(() =>
  props.lessonTitle
    ? t('teacher.assignments.titleForLesson', { lesson: props.lessonTitle })
    : t('teacher.assignments.title')
);

const lessonAssignments = computed(() =>
  learning.teacherAssignments.filter(
    (assignment) => assignment.lessonId === props.lessonId
  )
);

async function loadAssignments() {
  if (!props.modelValue) return;
  loading.value = true;
  loadError.value = '';
  try {
    await learning.loadTeacherAssignments(props.courseId);
  } catch (error) {
    loadError.value = handleApiError(error, {
      fallback: t('teacher.assignments.toast.loadFailed'),
      useToast: false
    });
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      void loadAssignments();
    }
  },
  { immediate: true }
);

function onDialogUpdate(value: boolean) {
  emit('update:modelValue', value);
}

function onAdd() {
  if (props.lessonId === null) return;
  learning.setPendingAssignmentsDialog(props.lessonId);
  emit('update:modelValue', false);
  router.push({
    name: 'teacher-assignment-create',
    params: { courseId: props.courseId, lessonId: props.lessonId }
  });
}

function onEdit(assignment: Assignment) {
  learning.setPendingAssignmentsDialog(assignment.lessonId);
  emit('update:modelValue', false);
  router.push({
    name: 'teacher-assignment-edit',
    params: {
      courseId: props.courseId,
      lessonId: assignment.lessonId,
      assignmentId: assignment.id
    }
  });
}

async function onDelete(assignment: Assignment) {
  if (!window.confirm(t('teacher.assignments.confirmDelete', { title: assignment.title }))) {
    return;
  }
  deletingId.value = assignment.id;
  try {
    await learning.deleteAssignment(assignment.id);
    toast.success(t('teacher.assignments.toast.deleted'));
    await loadAssignments();
  } catch (error) {
    handleApiError(error, {
      fallback: t('teacher.assignments.errors.generic'),
      summary: t('teacher.assignments.errors.generic')
    });
  } finally {
    deletingId.value = null;
  }
}

function onViewSubmissions(assignment: Assignment) {
  selectedAssignment.value = assignment;
  submissionsDialogOpen.value = true;
}
</script>
