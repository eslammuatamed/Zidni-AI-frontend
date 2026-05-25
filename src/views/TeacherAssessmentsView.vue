<template>
  <ThemePage :title="t('assessments.title')" :subtitle="t('assessments.subtitle')">
    <template #actions>
      <UiButton color="primary" prepend-icon="PlusOutlined" @click="showCreate = true">
        {{ t('assessments.createAssessment') }}
      </UiButton>
    </template>

    <section class="mt-4">
      <UiCard hover>
        <!-- Filter bar -->
        <div class="flex flex-col gap-3 min-[720px]:flex-row min-[720px]:items-end">
          <div class="min-[720px]:flex-1">
            <UiInput
              v-model="search"
              appearance="search"
              :placeholder="t('assessments.searchPlaceholder')"
              :aria-label="t('assessments.searchPlaceholder')"
              clearable
            />
          </div>
        </div>

        <!-- Desktop table (≥721px) -->
        <div v-if="filteredAssessments.length" class="hidden min-[721px]:block">
          <UiTable
            :headers="headers"
            :items="pagedAssessments"
            :empty-text="t('assessments.empty')"
          >
            <template #item.type="{ item }">
              <UiTag color="secondary" variant="soft">{{ item.type.toUpperCase() }}</UiTag>
            </template>
            <template #item.actions="{ item }">
              <div class="flex flex-wrap items-center gap-1">
                <UiButton
                  size="sm"
                  variant="link"
                  color="primary"
                  @click="goToAssessment(item)"
                >
                  {{ t('common.edit') }}
                </UiButton>
                <UiButton
                  size="sm"
                  variant="link"
                  color="danger"
                  @click="confirmDelete(item)"
                >
                  {{ t('common.delete') }}
                </UiButton>
              </div>
            </template>
          </UiTable>
        </div>

        <!-- Mobile list (<721px) -->
        <div class="grid gap-3 min-[721px]:hidden" role="list">
          <article
            v-for="item in pagedAssessments"
            :key="item.id"
            class="grid gap-3 rounded-sakai-lg p-4 bg-surface-card [border:1px_solid_color-mix(in_srgb,var(--sakai-border-color)_70%,transparent)]"
            role="listitem"
          >
            <header class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="m-0 text-base font-semibold text-content-strong">{{ item.title }}</h3>
              <UiTag color="secondary" variant="soft">{{ item.type.toUpperCase() }}</UiTag>
            </header>
            <dl class="grid gap-3">
              <div class="grid gap-1">
                <dt class="text-xs font-semibold text-content-tertiary">{{ t('assessments.tableCourse') }}</dt>
                <dd class="m-0 font-medium">{{ item.courseTitle }}</dd>
              </div>
              <div class="grid gap-1">
                <dt class="text-xs font-semibold text-content-tertiary">{{ t('assessments.tableDuration') }}</dt>
                <dd class="m-0 font-medium">{{ item.durationMinutes }}</dd>
              </div>
              <div class="grid gap-1">
                <dt class="text-xs font-semibold text-content-tertiary">{{ t('assessments.tableQuestions') }}</dt>
                <dd class="m-0 font-medium">{{ item.questionCount }}</dd>
              </div>
            </dl>
            <div class="flex flex-wrap gap-2">
              <UiButton size="sm" variant="outline" color="primary" @click="goToAssessment(item)">
                {{ t('common.edit') }}
              </UiButton>
              <UiButton size="sm" variant="outline" color="danger" @click="confirmDelete(item)">
                {{ t('common.delete') }}
              </UiButton>
            </div>
          </article>
        </div>

        <UiPagination
          v-if="filteredAssessments.length"
          :current-page="currentPage"
          :total-items="filteredAssessments.length"
          :page-size="pageSize"
          :prev-label="t('common.previous')"
          :next-label="t('common.next')"
          @update:current-page="currentPage = $event"
        >
          <template #info="{ from, to, total }">
            {{
              t('pagination.showing', {
                from,
                to,
                total,
                entity: t('assessments.assessmentsEntity'),
              })
            }}
          </template>
        </UiPagination>
      </UiCard>

      <UiDialog v-model="showCreate" :title="t('assessments.createAssessment')" width="520px">
        <form class="grid gap-4" @submit.prevent="createAssessment">
          <UiSelect
            :model-value="createForm.courseId ?? ''"
            :label="t('assessments.course')"
            required
            @update:model-value="onCourseChange"
          >
            <option value="" disabled>{{ t('assessments.course') }}</option>
            <option
              v-for="course in courses"
              :key="course.id"
              :value="course.id"
            >
              {{ course.title }}
            </option>
          </UiSelect>

          <UiInput
            v-model="createForm.title"
            :label="t('assessments.assessmentName')"
            required
          />

          <div class="grid gap-4 min-[640px]:grid-cols-2">
            <UiSelect
              :model-value="createForm.type"
              :label="t('assessments.mode')"
              @update:model-value="onTypeChange"
            >
              <option
                v-for="option in assessmentTypes"
                :key="option.value"
                :value="option.value"
              >
                {{ option.title }}
              </option>
            </UiSelect>

            <UiInput
              :model-value="createForm.durationMinutes"
              type="number"
              min="1"
              :label="t('assessments.duration')"
              @update:model-value="onDurationChange"
            />
          </div>

          <div class="grid gap-4 min-[640px]:grid-cols-2">
            <UiInput
              :model-value="createForm.maxAttempts"
              type="number"
              min="1"
              :label="t('assessments.maxAttempts')"
              @update:model-value="(value) => (createForm.maxAttempts = Math.max(1, Number(value ?? 1)))"
            />
            <UiCheckbox
              v-model="createForm.revealAnswersAfterGrading"
              :label="t('assessments.revealAnswersAfterGrading')"
            />
          </div>

          <UiInput
            v-if="isExternalForm"
            v-model="createForm.embedUrl"
            :label="t('assessments.embedUrlLabel')"
            :placeholder="'https://docs.google.com/forms/d/e/.../viewform?embedded=true'"
            :helper-text="t('assessments.embedUrlHint')"
            required
          />

          <UiAlert
            v-if="isExternalForm"
            variant="outline"
            color="primary"
            class="grid gap-2"
          >
            <p class="m-0 font-semibold">{{ t('assessments.embedHowToTitle') }}</p>
            <ol class="m-0 ps-5 grid gap-1 text-content-secondary">
              <li>{{ t('assessments.embedHowToStep1') }}</li>
              <li>{{ t('assessments.embedHowToStep2') }}</li>
              <li>{{ t('assessments.embedHowToStep3') }}</li>
            </ol>
          </UiAlert>

          <div class="flex flex-wrap justify-end gap-3 mt-4">
            <UiButton variant="link" color="secondary" @click.prevent="showCreate = false">
              {{ t('common.cancel') }}
            </UiButton>
            <UiButton button-type="submit" color="primary">
              {{ t('common.save') }}
            </UiButton>
          </div>
        </form>
      </UiDialog>

      <UiDialog v-model="showDelete" :title="t('assessments.deleteTitle')" width="420px">
        <p class="m-0 text-content-secondary leading-[var(--sakai-line-height-lg)]">{{ t('assessments.deleteConfirm') }}</p>
        <div class="flex flex-wrap justify-end gap-3 mt-4">
          <UiButton variant="link" color="secondary" @click="showDelete = false">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton color="danger" @click="deleteAssessment">
            {{ t('common.delete') }}
          </UiButton>
        </div>
      </UiDialog>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAssessmentsStore } from '@/stores/assessments';
import { useCoursesStore } from '@/stores/courses';
import { useI18n } from 'vue-i18n';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';
import UiPagination from '@/components/ui/UiPagination.vue';

const store = useAssessmentsStore();
const coursesStore = useCoursesStore();
const router = useRouter();
const { t } = useI18n();

const showCreate = ref(false);
const showDelete = ref(false);
const toDelete = ref<number | null>(null);
const createForm = reactive({
  courseId: null as number | null,
  title: '',
  type: 'quiz',
  durationMinutes: 10,
  embedUrl: '',
  maxAttempts: 1,
  revealAnswersAfterGrading: true
});

const search = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const headers = computed(() => [
  { title: t('assessments.tableName'), key: 'title' },
  { title: t('assessments.tableCourse'), key: 'courseTitle' },
  { title: t('assessments.tableType'), key: 'type' },
  { title: t('assessments.tableDuration'), key: 'durationMinutes' },
  { title: t('assessments.tableQuestions'), key: 'questionCount' },
  { title: '', key: 'actions', sortable: false }
]);

// Client-side search (the store loads all assessments — no server pagination).
const filteredAssessments = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return store.assessments;
  return store.assessments.filter(
    (item) =>
      (item.title?.toLowerCase().includes(q) ?? false) ||
      (item.courseTitle?.toLowerCase().includes(q) ?? false)
  );
});

const pagedAssessments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredAssessments.value.slice(start, start + pageSize.value);
});

watch(search, () => {
  currentPage.value = 1;
});

const assessmentTypes = computed(() => [
  { title: t('assessments.type.quiz'), value: 'quiz' },
  { title: t('assessments.type.exam'), value: 'exam' },
  { title: t('assessments.type.external_form'), value: 'external_form' }
]);

const courses = computed(() => coursesStore.list);

const isExternalForm = computed(() => createForm.type === 'external_form');

onMounted(async () => {
  await Promise.all([store.loadAssessments(), coursesStore.fetchCourses()]);
});

const createAssessment = async () => {
  if (!createForm.courseId || !createForm.title) return;
  if (isExternalForm.value && !createForm.embedUrl.trim()) return;
  const id = await store.createAssessment({
    courseId: createForm.courseId,
    title: createForm.title,
    type: createForm.type,
    durationMinutes: createForm.durationMinutes,
    embedUrl: isExternalForm.value ? createForm.embedUrl.trim() : null,
    maxAttempts: createForm.maxAttempts,
    revealAnswersAfterGrading: createForm.revealAnswersAfterGrading
  });
  showCreate.value = false;
  createForm.courseId = null;
  createForm.title = '';
  createForm.type = 'quiz';
  createForm.durationMinutes = 10;
  createForm.embedUrl = '';
  createForm.maxAttempts = 1;
  createForm.revealAnswersAfterGrading = true;
  router.push({ name: 'teacher-assessment-builder', params: { assessmentId: id } });
};

const goToAssessment = (item: { id: number }) => {
  router.push({ name: 'teacher-assessment-builder', params: { assessmentId: item.id } });
};

const confirmDelete = (item: { id: number }) => {
  toDelete.value = item.id;
  showDelete.value = true;
};

const deleteAssessment = async () => {
  if (toDelete.value != null) {
    await store.deleteAssessment(toDelete.value);
  }
  showDelete.value = false;
  toDelete.value = null;
};

const onCourseChange = (value: string | number | null) => {
  if (value === null || value === '') {
    createForm.courseId = null;
  } else {
    createForm.courseId = Number(value);
  }
};

const onTypeChange = (value: string | number | null) => {
  createForm.type = typeof value === 'string' ? value : String(value || 'quiz');
  if (createForm.type !== 'external_form') {
    createForm.embedUrl = '';
  }
};

const onDurationChange = (value: string | number | null) => {
  const parsed = Number(value);
  createForm.durationMinutes = Number.isNaN(parsed) ? 1 : Math.max(1, parsed);
};
</script>
