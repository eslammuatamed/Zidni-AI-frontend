<template>
  <ThemePage :title="t('learning.teacher.nav')" :subtitle="t('learning.teacher.manageResources')">
    <template #actions>
      <div class="teacher-learning__toolbar flex flex-wrap items-center justify-between gap-4">
        <UiSelect
          :model-value="selectedCourseId"
          :label="t('learning.teacher.courseFilter')"
          clearable
          @update:model-value="onCourseChange"
        >
          <option value="">{{ t('learning.teacher.courseFilter') }}</option>
          <option v-for="course in courseOptions" :key="course.id" :value="course.id">{{ course.title }}</option>
        </UiSelect>
        <div class="teacher-learning__toolbar-actions inline-flex flex-wrap gap-3">
          <UiButton color="primary" prepend-icon="PlusOutlined" @click="goToCreateAssignment">
            {{ t('learning.teacher.newAssignment') }}
          </UiButton>
          <UiButton color="secondary" variant="outline" prepend-icon="MessageOutlined" @click="tab = 'discussions'">
            {{ t('learning.teacher.manageDiscussions') }}
          </UiButton>
          <UiButton
            v-if="reviewsEnabled"
            color="secondary"
            variant="outline"
            prepend-icon="StarOutlined"
            @click="tab = 'reviews'"
          >
            {{ t('learning.teacher.manageReviews') }}
          </UiButton>
          <UiButton color="secondary" variant="outline" prepend-icon="FolderOutlined" @click="tab = 'resources'">
            {{ t('learning.teacher.manageResources') }}
          </UiButton>
        </div>
      </div>
    </template>

    <UiTabs v-model="tab" :tabs="tabItems" />

    <section v-if="tab === 'assignments'" class="teacher-learning__grid grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
      <UiCard :title="t('learning.teacher.assignmentsTitle')" hover>
        <template v-if="!filteredAssignments.length">
          <UiAlert color="info" variant="soft">{{ t('learning.teacher.noAssignments') }}</UiAlert>
        </template>
        <template v-else>
          <UiTable :headers="assignmentHeaders" :items="filteredAssignments" density="comfortable">
            <template #item.title="{ item }">
              <div class="teacher-learning__table-title flex flex-col gap-1">
                <strong>{{ item.title }}</strong>
                <span class="teacher-learning__table-subtitle text-content-tertiary text-[0.85rem]">{{ item.lessonTitle }}</span>
              </div>
            </template>
            <template #item.dueAt="{ item }">
              <span v-if="item.dueAt">{{ formatDateTime(item.dueAt) }}</span>
              <span v-else class="teacher-learning__empty text-content-tertiary">—</span>
            </template>
            <template #item.maxScore="{ item }">
              <span>{{ item.maxScore }}</span>
            </template>
            <template #item.attachments="{ item }">
              <span v-if="!item.attachments?.length" class="text-content-tertiary">—</span>
              <ul v-else class="list-none p-0 m-0 flex flex-col gap-1">
                <li v-for="attachment in item.attachments" :key="attachment.fileKey">
                  <a
                    :href="attachment.fileUrl"
                    target="_blank"
                    rel="noopener"
                    class="text-[0.85rem] inline-flex items-center gap-1"
                  >
                    <UiIcon name="PaperClipOutlined" :size="12" />
                    <span>{{ attachment.fileName }}</span>
                    <span class="text-content-tertiary">({{ formatAttachmentSize(attachment.fileSizeBytes) }})</span>
                  </a>
                </li>
              </ul>
            </template>
            <template #item.actions="{ item }">
              <div class="teacher-learning__table-actions flex flex-wrap gap-2">
                <UiButton
                  variant="link"
                  color="primary"
                  prepend-icon="EyeOutlined"
                  @click="openSubmissions(item)"
                >
                  {{ t('teacher.assignments.viewSubmissions') }}
                </UiButton>
                <UiButton
                  variant="link"
                  color="secondary"
                  prepend-icon="EditOutlined"
                  @click="goToAssignmentEditor(item)"
                >
                  {{ t('common.edit') }}
                </UiButton>
                <UiButton
                  variant="link"
                  color="danger"
                  prepend-icon="DeleteOutlined"
                  :disabled="deletingAssignmentId === item.id"
                  @click="confirmDeleteAssignment(item)"
                >
                  {{ deletingAssignmentId === item.id ? t('common.deleting') : t('common.delete') }}
                </UiButton>
              </div>
            </template>
          </UiTable>
        </template>
      </UiCard>
    </section>

    <section v-else-if="tab === 'discussions'" class="teacher-learning__discussions flex flex-col gap-5">
      <UiAlert v-if="!discussionsEnabled" color="info" variant="soft">
        {{ t('discussions.flags.disabled') }}
      </UiAlert>
      <UiAlert v-else-if="!selectedCourseId" color="info" variant="soft">
        {{ t('discussions.threads.pickCourse') }}
      </UiAlert>
      <div v-else class="teacher-learning__discussions-grid grid gap-5 [grid-template-columns:minmax(0,22rem)_minmax(0,1fr)]">
        <ThreadsList
          ref="threadsListRef"
          class="teacher-learning__discussions-list w-full"
          v-model="selectedThreadId"
          :course-id="selectedCourseId"
          :lesson-options="lessonOptions"
          @select="onSelectDiscussionThread"
          @created="onThreadCreated"
        />
        <ThreadView
          class="teacher-learning__discussions-view w-full"
          :thread="activeDiscussionThread"
          :disabled="formSubmitting"
          @message-sent="onMessageSent"
        />
      </div>
    </section>

    <section v-else-if="tab === 'reviews'" class="teacher-learning__reviews flex flex-col gap-5">
      <UiAlert v-if="!reviewsEnabled" color="info" variant="soft">
        {{ t('reviews.flags.disabled') }}
      </UiAlert>
      <UiAlert v-else-if="!selectedCourseId" color="info" variant="soft">
        {{ t('reviews.shared.selectCourse') }}
      </UiAlert>
      <div v-else class="teacher-learning__reviews-grid grid gap-5 [grid-template-columns:minmax(0,24rem)_minmax(0,1fr)]">
        <UiCard class="teacher-learning__reviews-card w-full" :title="t('learning.teacher.reviewsSummaryTitle')" hover>
          <div v-if="reviewsSummary.count" class="teacher-learning__reviews-summary flex flex-col gap-3">
            <div class="teacher-learning__reviews-average">
              <UiIcon name="StarFilled" />
              <strong>{{ reviewsSummary.average?.toFixed(1) ?? '0.0' }}</strong>
            </div>
            <p class="teacher-learning__reviews-meta m-0 text-content-tertiary">
              {{ t('learning.teacher.reviewsSummaryMeta', { count: reviewsSummary.count }) }}
            </p>
          </div>
          <UiAlert v-else color="info" variant="soft">
            {{ t('learning.teacher.reviewsEmpty') }}
          </UiAlert>
        </UiCard>
        <CourseReviewsList
          class="teacher-learning__reviews-list w-full"
          :course-id="selectedCourseId"
          :show-summary="false"
          @summary="onTeacherReviewsSummary"
          @error="onTeacherReviewsError"
        />
      </div>

    </section>

    <section v-else class="teacher-learning__grid grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
      <UiAlert v-if="resourcesRestricted" color="warning" variant="soft">
        {{ t('learning.teacher.resourceRestricted') }}
      </UiAlert>
      <template v-else>
        <UiCard :title="t('learning.teacher.resourceFormTitle')" hover>
          <form class="teacher-learning__form grid gap-4" @submit.prevent="createResource">
            <UiInput v-model="newResource.title" :label="t('learning.teacher.resourceTitle')" required />
            <UiTextarea
              v-model="newResource.description"
              :label="t('learning.teacher.resourceDescription')"
              :rows="3"
            />
            <UiSelect
              :model-value="newResource.lessonId"
              :label="t('learning.teacher.resourceLesson')"
              clearable
              @update:model-value="onResourceLessonChange"
            >
              <option value="">{{ t('learning.teacher.resourceLesson') }}</option>
              <option v-for="lesson in lessonOptions" :key="lesson.value" :value="lesson.value">{{ lesson.label }}</option>
            </UiSelect>
            <UiSelect
              :model-value="newResource.resourceType"
              :label="t('learning.teacher.resourceType')"
              @update:model-value="onResourceTypeChange"
            >
              <option v-for="type in resourceTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
            </UiSelect>
            <UiInput
              v-if="!isFileResource"
              v-model="newResource.url"
              :label="t('learning.teacher.resourceUrl')"
              :required="!isFileResource"
            />
            <p v-if="isEmbedResource" class="teacher-learning__resource-hint -mt-2 mb-0 text-content-tertiary text-[0.9rem]">
              {{ t('learning.teacher.resourceEmbedHint') }}
            </p>
            <UiFileUpload
              v-else
              v-model="resourceFiles"
              :label="t('learning.teacher.resourceFileLabel')"
              :hint="t('learning.teacher.resourceFileHint')"
              :disabled="formSubmitting"
              @change="onResourceFileChange"
              @remove="onResourceFileRemoved"
            />
            <UiButton button-type="submit" color="primary" :loading="formSubmitting">
              {{ t('learning.teacher.saveResource') }}
            </UiButton>
          </form>
        </UiCard>

        <UiCard :title="t('learning.teacher.resourceListTitle')" hover>
          <template v-if="!filteredResources.length">
            <UiAlert color="info" variant="soft">{{ t('learning.teacher.noResources') }}</UiAlert>
          </template>
          <template v-else>
            <ul class="teacher-learning__resources list-none p-0 m-0 flex flex-col gap-3">
              <li v-for="resource in filteredResources" :key="resource.id" class="teacher-learning__resource flex justify-between items-center gap-3">
                <div class="teacher-learning__resource-info flex flex-col gap-1">
                  <span class="teacher-learning__resource-title font-semibold">{{ resource.title }}</span>
                  <span class="teacher-learning__resource-meta text-[0.85rem] text-content-tertiary">
                    {{ resource.lessonTitle || resource.courseTitle }} · {{ t(`learning.resourceType.${resource.resourceType}`) }}
                  </span>
                </div>
                <UiButton
                  variant="link"
                  color="primary"
                  append-icon="ExportOutlined"
                  :href="resource.url"
                  target="_blank"
                >
                  {{ t('student.viewProof') }}
                </UiButton>
              </li>
            </ul>
          </template>
        </UiCard>
      </template>
    </section>

    <TeacherSubmissionsDialog
      v-model="submissionsDialogOpen"
      :assignment="selectedAssignment"
    />
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import TeacherSubmissionsDialog from '@/components/teacher/assignments/TeacherSubmissionsDialog.vue';
import { useLearningStore } from '@/stores/learning';
import { useCoursesStore } from '@/stores/courses';
import { useTenantStore } from '@/stores/tenant';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';
import type {
  Assignment,
  CourseResourcePayload,
  ResourceType
} from '@/services/learning';
import { formatFileSize } from '@/utils/formatters';
import type { DiscussionThread } from '@/api/discussions';
import { useToast } from '@/composables/useToast';
import UiTabs from '@/components/ui/UiTabs.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiFileUpload from '@/components/ui/UiFileUpload.vue';
import ThreadsList from '@/views/shared/discussions/ThreadsList.vue';
import ThreadView from '@/views/shared/discussions/ThreadView.vue';
import CourseReviewsList from '@/views/shared/reviews/CourseReviewsList.vue';

const { t } = useI18n();
const learning = useLearningStore();
const courses = useCoursesStore();
const tenantStore = useTenantStore();
const featuresStore = useFeaturesStore();
const toast = useToast();
const router = useRouter();

const submissionsDialogOpen = ref(false);
const selectedAssignment = ref<Assignment | null>(null);

function openSubmissions(assignment: Assignment) {
  selectedAssignment.value = assignment;
  submissionsDialogOpen.value = true;
}

function goToAssignmentEditor(assignment: Assignment) {
  router.push({
    name: 'teacher-assignment-edit-global',
    params: { assignmentId: String(assignment.id) }
  });
}

function goToCreateAssignment() {
  router.push({ name: 'teacher-assignment-create-global' });
}

const tab = ref<'assignments' | 'discussions' | 'reviews' | 'resources'>('assignments');
const selectedCourseId = ref<number | null>(null);
const selectedThreadId = ref<number | null>(null);
const formSubmitting = ref(false);
const threadsListRef = ref<InstanceType<typeof ThreadsList> | null>(null);
const activeDiscussionThread = ref<DiscussionThread | null>(null);
const deletingAssignmentId = ref<number | null>(null);
const resourcesRestricted = ref(false);

const discussionsEnabled = computed(() => featuresStore.hasFeature(FEATURE.discussions));
const reviewsEnabled = computed(() => featuresStore.hasFeature(FEATURE.reviews));
const reviewsSummary = reactive({ average: null as number | null, count: 0 });

const tabItems = computed(() => {
  const items: { label: string; value: typeof tab.value }[] = [
    { label: t('learning.teacher.assignmentsTab'), value: 'assignments' }
  ];
  if (discussionsEnabled.value) {
    items.push({ label: t('learning.teacher.discussionsTab'), value: 'discussions' });
  }
  if (reviewsEnabled.value) {
    items.push({ label: t('learning.teacher.reviewsTab'), value: 'reviews' });
  }
  items.push({ label: t('learning.teacher.resourcesTab'), value: 'resources' });
  return items;
});


watch(
  discussionsEnabled,
  (enabled) => {
    if (!enabled && tab.value === 'discussions') {
      tab.value = 'assignments';
    }
  },
  { immediate: true }
);

watch(
  reviewsEnabled,
  (enabled) => {
    if (!enabled && tab.value === 'reviews') {
      tab.value = 'assignments';
    }
  },
  { immediate: true }
);

const newResource = reactive({
  title: '',
  description: '',
  lessonId: null as number | null,
  resourceType: 'link',
  url: '',
  file: null as File | null
});

const resourceFiles = ref<File[]>([]);
const isFileResource = computed(() => newResource.resourceType === 'file');
const isEmbedResource = computed(() => newResource.resourceType === 'embed');

const resourceTypes = [
  { value: 'link', label: t('learning.resourceType.link') },
  { value: 'file', label: t('learning.resourceType.file') },
  { value: 'embed', label: t('learning.resourceType.embed') }
];

const assignmentHeaders = [
  { title: t('learning.teacher.assignmentTitleHeader'), key: 'title' },
  { title: t('teacher.assignments.columns.course'), key: 'courseTitle' },
  { title: t('learning.teacher.assignmentDueHeader'), key: 'dueAt' },
  { title: t('teacher.assignments.columns.maxScore'), key: 'maxScore' },
  { title: t('teacher.assignments.columns.attachments'), key: 'attachments' },
  { title: t('common.actions'), key: 'actions', sortable: false }
];

const courseOptions = computed(() => courses.list);

const lessonOptions = computed(() => {
  if (!selectedCourseId.value || !courses.current || courses.current.id !== selectedCourseId.value) {
    return [] as { value: number; label: string }[];
  }
  const options: { value: number; label: string }[] = [];
  courses.current.modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      options.push({ value: lesson.id, label: `${module.title} – ${lesson.title}` });
    });
  });
  return options;
});

const filteredAssignments = computed(() => {
  if (!selectedCourseId.value) return learning.teacherAssignments;
  return learning.teacherAssignments.filter((assignment) => assignment.courseId === selectedCourseId.value);
});

const filteredResources = computed(() => {
  if (!selectedCourseId.value) return learning.courseResources;
  return learning.courseResources.filter((resource) => resource.courseId === selectedCourseId.value);
});

const showToast = (message: string, tone: 'success' | 'error' | 'warning' = 'success') => {
  if (tone === 'error') {
    toast.error(message);
  } else if (tone === 'warning') {
    toast.warning(message);
  } else {
    toast.success(message);
  }
};

const onCourseChange = (value: string | number | null) => {
  if (value === null || value === '' || value === undefined) {
    selectedCourseId.value = null;
    courses.current = null;
    return;
  }
  selectedCourseId.value = Number(value);
};

const onResourceLessonChange = (value: string | number | null) => {
  newResource.lessonId = value === null || value === '' ? null : Number(value);
};

const onResourceTypeChange = (value: string | number | null) => {
  const next = value ? (String(value) as typeof newResource.resourceType) : 'link';
  newResource.resourceType = next;
  if (next === 'file') {
    newResource.url = '';
  } else {
    newResource.file = null;
    resourceFiles.value = [];
  }
};

const onResourceFileChange = (files: File[]) => {
  resourceFiles.value = files.slice(0, 1);
  newResource.file = resourceFiles.value[0] ?? null;
};

const onResourceFileRemoved = (_file: File, _index: number) => {
  resourceFiles.value = [];
  newResource.file = null;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const formatAttachmentSize = (bytes: number) => formatFileSize(bytes);

const confirmDeleteAssignment = async (assignment: Assignment) => {
  if (!window.confirm(t('learning.teacher.assignmentDeleteConfirm', { title: assignment.title }))) {
    return;
  }
  deletingAssignmentId.value = assignment.id;
  try {
    await learning.deleteAssignment(assignment.id);
    if (selectedCourseId.value) {
      await learning.loadTeacherAssignments(selectedCourseId.value);
    } else {
      await learning.loadTeacherAssignments();
    }
    if (selectedAssignment.value?.id === assignment.id) {
      selectedAssignment.value = null;
      submissionsDialogOpen.value = false;
      learning.clearAssignmentSubmissions();
    }
    showToast(t('learning.teacher.assignmentDeleted'));
  } catch (error) {
    console.error(error);
    showToast(t('learning.teacher.assignmentDeleteFailed'), 'error');
  } finally {
    deletingAssignmentId.value = null;
  }
};

const onSelectDiscussionThread = (thread: DiscussionThread | null) => {
  activeDiscussionThread.value = thread;
};

const onThreadCreated = (thread: DiscussionThread) => {
  activeDiscussionThread.value = thread;
  showToast(t('discussions.form.created'));
};

const onMessageSent = () => {
  showToast(t('discussions.view.messageSent'));
  threadsListRef.value?.refresh();
};

const onTeacherReviewsSummary = (payload: { averageRating: number | null; reviewCount: number }) => {
  reviewsSummary.average = payload.averageRating;
  reviewsSummary.count = payload.reviewCount;
};

const onTeacherReviewsError = (message: string) => {
  showToast(message, 'error');

};

const createResource = async () => {
  if (resourcesRestricted.value) {
    showToast(t('learning.teacher.resourceRestricted'), 'warning');
    return;
  }
  if (!selectedCourseId.value) {
    showToast(t('learning.teacher.resourceValidation'), 'warning');
    return;
  }
  formSubmitting.value = true;
  try {
    const payload: Omit<CourseResourcePayload, 'url' | 'file'> = {
      courseId: selectedCourseId.value,
      lessonId: newResource.lessonId || undefined,
      title: newResource.title,
      description: newResource.description || undefined,
      resourceType: newResource.resourceType as ResourceType
    };

    if (isFileResource.value) {
      if (!newResource.file) {
        showToast(t('learning.teacher.resourceFileMissing'), 'warning');
        return;
      }
      await learning.addResource({ ...payload, file: newResource.file });
    } else {
      const url = newResource.url.trim();
      if (!url) {
        showToast(t('learning.teacher.resourceUrlMissing'), 'warning');
        return;
      }
      await learning.addResource({ ...payload, url });
    }
    await learning.loadResources(selectedCourseId.value, 'teacher');
    newResource.title = '';
    newResource.description = '';
    newResource.lessonId = null;
    newResource.resourceType = 'link';
    newResource.url = '';
    newResource.file = null;
    resourceFiles.value = [];
    showToast(t('learning.teacher.resourceSaved'));
  } catch (error) {
    console.error(error);
    showToast(t('learning.teacher.resourceFailed'), 'error');
  } finally {
    formSubmitting.value = false;
  }
};

watch(selectedCourseId, async (courseId) => {
  if (!courseId) {
    selectedThreadId.value = null;
    activeDiscussionThread.value = null;
    courses.current = null;
    resourcesRestricted.value = false;
    await learning.loadTeacherAssignments();
    return;
  }
  await courses.fetchCourse(courseId);
  resourcesRestricted.value = false;
  const [, resourceError] = await Promise.all([
    learning.loadTeacherAssignments(courseId),
    learning.loadResources(courseId, 'teacher')
  ]);
  resourcesRestricted.value = resourceError === 'forbidden';
  selectedThreadId.value = null;
  activeDiscussionThread.value = null;
});

onMounted(async () => {
  if (!tenantStore.branding) {
    await tenantStore.fetchBranding();
  }
  await courses.fetchCourses();
  if (courses.list.length) {
    selectedCourseId.value = courses.list[0].id;
  } else {
    await learning.loadTeacherAssignments();
  }
});
</script>

<style scoped>
.teacher-learning__reviews-average {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-3);
  font-size: var(--sakai-font-size-xl);
  color: var(--sakai-warning-500);
}

.teacher-learning__reviews-average :deep(svg) {
  width: 1.5rem;
  height: 1.5rem;
}

@media (max-width: 960px) {
  .teacher-learning__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .teacher-learning__discussions-grid {
    grid-template-columns: 1fr;
  }

  .teacher-learning__reviews-grid {
    grid-template-columns: 1fr;
  }
}
</style>