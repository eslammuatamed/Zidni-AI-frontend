<template>
  <UiDialog v-model="internalOpen" :title="dialogTitle" width="520px">
    <form class="award-dialog" @submit.prevent="submit">
      <UiSelect v-model="badgeIdModel" :label="t('badges.awardDialog.badgeLabel')" :disabled="!hasBadges" required>
        <option disabled value="">{{ t('badges.awardDialog.badgePlaceholder') }}</option>
        <option v-for="badge in props.badges" :key="badge.id" :value="String(badge.id)">
          {{ badge.name }}
        </option>
      </UiSelect>

      <UiInput
        v-model="studentSearch"
        :label="t('badges.awardDialog.studentSearch')"
        :placeholder="t('badges.awardDialog.studentSearchPlaceholder')"
        :disabled="studentsLoading || !hasBadges"
      />

      <UiSelect
        v-model="studentIdModel"
        :label="t('badges.awardDialog.studentLabel')"
        :disabled="studentsLoading || !students.length"
        :hint="studentSelectHint"
        required
      >
        <option disabled value="">
          {{ studentsLoading ? t('badges.awardDialog.loadingStudents') : t('badges.awardDialog.studentPlaceholder') }}
        </option>
        <option v-for="student in students" :key="student.studentId" :value="String(student.studentId)">
          {{ formatStudentLabel(student) }}
        </option>
      </UiSelect>
      <p v-if="!studentsLoading && !students.length" class="award-dialog__empty">
        {{ t('badges.awardDialog.noStudents') }}
      </p>

      <UiTextarea v-model="metadata" :label="t('badges.awardDialog.metadata')" :rows="3" />

      <div class="award-dialog__actions">
        <UiButton type="button" variant="ghost" color="neutral" @click="close">
          {{ t('common.cancel') }}
        </UiButton>
        <UiButton type="submit" color="primary" :loading="loading" :disabled="!canSubmit">
          {{ t('badges.awardDialog.submit') }}
        </UiButton>
      </div>
    </form>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import { useToast } from '@/composables/useToast';

import type { TeacherBadge } from '@/api/badges';
import { fetchTeacherStudents, type StudentListItem } from '@/services/teacherRoster';

interface AwardBadgeSubmitPayload {
  badgeId: number;
  studentId: number;
  metadata?: string;
}

const props = defineProps<{
  modelValue: boolean;
  badges: TeacherBadge[];
  selectedBadgeId?: number | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:selectedBadgeId', value: number | null): void;
  (e: 'submit', payload: AwardBadgeSubmitPayload): void;
}>();

const { t } = useI18n();
const toast = useToast();

const metadata = ref('');
const badgeId = ref<number | null>(props.selectedBadgeId ?? null);
const studentId = ref<number | null>(null);
const students = ref<StudentListItem[]>([]);
const studentsLoading = ref(false);
const studentSearch = ref('');

const internalOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const loading = computed(() => props.loading === true);
const hasBadges = computed(() => props.badges.length > 0);
const selectedBadge = computed(() => props.badges.find((badge) => badge.id === badgeId.value) ?? null);

const dialogTitle = computed(() =>
  selectedBadge.value
    ? t('badges.awardDialog.titleWithName', { name: selectedBadge.value.name })
    : t('badges.awardDialog.title')
);

const badgeIdModel = computed({
  get: () => (badgeId.value != null ? String(badgeId.value) : ''),
  set: (value: string) => {
    const next = value ? Number(value) : null;
    badgeId.value = next;
    emit('update:selectedBadgeId', next);
  }
});

const studentIdModel = computed({
  get: () => (studentId.value != null ? String(studentId.value) : ''),
  set: (value: string) => {
    studentId.value = value ? Number(value) : null;
  }
});

const studentSelectHint = computed(() =>
  studentsLoading.value ? t('badges.awardDialog.loadingStudents') : ''
);

const canSubmit = computed(() => Boolean(!loading.value && badgeId.value && studentId.value));

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let latestSearchToken = 0;

const resetForm = () => {
  metadata.value = '';
  studentId.value = null;
  studentSearch.value = '';
  students.value = [];
  studentsLoading.value = false;
  latestSearchToken++;
};

const ensureBadgeSelection = () => {
  if (!props.badges.length) {
    badgeId.value = null;
    emit('update:selectedBadgeId', null);
    return;
  }
  if (badgeId.value == null || !props.badges.some((badge) => badge.id === badgeId.value)) {
    const fallback = props.selectedBadgeId ?? props.badges[0]?.id ?? null;
    badgeId.value = fallback ?? null;
    emit('update:selectedBadgeId', badgeId.value);
  }
};

const loadStudents = async (search: string) => {
  if (!hasBadges.value) {
    students.value = [];
    studentsLoading.value = false;
    return;
  }
  const token = ++latestSearchToken;
  studentsLoading.value = true;
  try {
    const page = await fetchTeacherStudents({ search: search || undefined, page: 0, size: 50 });
    if (latestSearchToken !== token) {
      return;
    }
    students.value = page.items;
    if (studentId.value && !page.items.some((student) => student.studentId === studentId.value)) {
      studentId.value = null;
    }
  } catch (error) {
    console.error(error);
    if (latestSearchToken === token) {
      toast.error({ detail: t('badges.awardDialog.studentsFailed') });
      students.value = [];
    }
  } finally {
    if (latestSearchToken === token) {
      studentsLoading.value = false;
    }
  }
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      ensureBadgeSelection();
      metadata.value = '';
      studentId.value = null;
      studentSearch.value = '';
      loadStudents('');
    } else {
      resetForm();
    }
  }
);

watch(
  () => props.selectedBadgeId,
  (next) => {
    if (next !== undefined) {
      badgeId.value = next ?? null;
    }
  }
);

watch(
  () => props.badges,
  () => {
    ensureBadgeSelection();
  },
  { deep: true }
);

watch(
  studentSearch,
  (value) => {
    if (!internalOpen.value) return;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      loadStudents(value.trim());
    }, 300);
  }
);

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});

const close = () => {
  internalOpen.value = false;
};

const formatStudentLabel = (student: StudentListItem) =>
  student.email ? `${student.name} (${student.email})` : student.name;

const submit = () => {
  if (!badgeId.value || !studentId.value) {
    return;
  }
  const payload: AwardBadgeSubmitPayload = {
    badgeId: badgeId.value,
    studentId: studentId.value,
    metadata: metadata.value.trim() || undefined
  };
  emit('submit', payload);
};
</script>

<style scoped>
.award-dialog {
  display: grid;
  gap: var(--sakai-space-4);
}

.award-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}

.award-dialog__empty {
  margin: 0;
  font-size: 0.9rem;
  color: var(--sakai-text-color-tertiary);
}
</style>
