<template>
  <ThemePage
    :title="pageTitle"
    :subtitle="pageSubtitle"
    class="min-[1025px]:[&_.theme-page__sidebar]:basis-[21.875rem]"
  >
    <template #actions>
      <UiButton
        variant="solid"
        color="primary"
        :disabled="!formValid || lessonPdfState.uploading || lessonVideoState.uploading"
        @click="saveLesson"
      >
        {{ t('common.save') }}
      </UiButton>
      <UiButton variant="outline" color="neutral" @click="handleCancel">
        {{ t('common.cancel') }}
      </UiButton>
    </template>

    <div v-if="isLoading" class="grid gap-4">
      <UiSkeleton height="24px" width="40%" />
      <UiSkeleton height="320px" />
    </div>

    <div v-else class="lesson-editor flex flex-col gap-5">
      <UiCollapsibleSection
        :title="t('courses.lessonDetailsSectionTitle')"
        icon="Information"
        default-open
      >
        <div class="flex flex-col gap-4">
          <UiInput
            v-model="form.title"
            :label="t('courses.lessonTitleLabel')"
            :error="attempted && !formValid ? t('courses.lessonTitleRequired') : ''"
            required
          />
          <UiTextarea
            v-model="form.content"
            :label="t('courses.lessonContentLabel')"
            :placeholder="t('courses.lessonContentPlaceholder')"
            :rows="4"
          />
          <p
            class="m-0 text-sm"
            :class="lessonContentOutOfRange ? 'text-warning' : 'text-content-tertiary'"
            aria-live="polite"
          >
            {{ lessonContentHint }}
          </p>
        </div>
      </UiCollapsibleSection>

      <UiCollapsibleSection
        :title="t('courses.lessonVideoSectionTitle')"
        icon="VideoCameraOutlined"
        default-open
      >
        <div class="flex flex-col gap-4">
          <UiInput
            v-model="form.ytId"
            :label="t('courses.lessonYoutubeLabel')"
            placeholder="https://youtu.be/..."
            :hint="lessonYoutubeHint"
            @blur="onLessonYoutubeBlur"
          />
          <div class="flex flex-col gap-3">
            <label class="block text-sm font-semibold text-content-tertiary text-start">{{ lessonVideoTexts.label }}</label>
            <UiFileUpload
              v-model="lessonVideoFiles"
              :label="lessonVideoTexts.uploadLabel"
              :hint="lessonVideoTexts.hint"
              :disabled="lessonVideoState.uploading"
              :button-label="lessonVideoTexts.browse"
              accept="video/mp4,video/quicktime,video/x-matroska,video/webm,video/x-msvideo"
              @change="onLessonVideoChange"
            />
            <UiAlert v-if="lessonVideoState.uploading" color="info" variant="soft">
              <div class="flex items-center justify-between gap-2 font-medium text-content">
                <span>{{ lessonVideoTexts.uploading }}</span>
                <span v-if="lessonVideoState.progress > 0" class="text-sakai-primary">
                  {{ lessonVideoState.progress }}%
                </span>
              </div>
              <UiProgressBar :value="lessonVideoState.progress" color="info" />
            </UiAlert>
            <UiAlert v-else-if="lessonVideoState.error" color="danger" variant="soft">
              {{ lessonVideoState.error }}
            </UiAlert>
            <UiAlert v-else-if="form.videoUrl" color="success" variant="soft" class="flex flex-wrap gap-2 items-center">
              <span>{{ lessonVideoTexts.uploaded }}</span>
              <UiButton variant="link" color="primary" @click.prevent="openLessonVideo">
                {{ lessonVideoTexts.preview }}
              </UiButton>
              <UiButton variant="link" color="danger" @click.prevent="clearLessonVideo">
                {{ lessonVideoTexts.remove }}
              </UiButton>
            </UiAlert>
            <UiAlert v-else color="info" variant="soft" class="m-0">
              {{ lessonVideoTexts.empty }}
            </UiAlert>
            <UiAlert v-if="lessonVideoState.warning" color="warning" variant="soft">
              {{ lessonVideoState.warning }}
            </UiAlert>
            <div v-if="lessonVideoStatusMeta(form.videoStatus)">
              <UiTag
                :color="lessonVideoStatusMeta(form.videoStatus)?.color"
                variant="soft"
                pill
                :start-icon="videoStatusIcon(form.videoStatus)"
              >
                {{ lessonVideoStatusMeta(form.videoStatus)?.label }}
              </UiTag>
            </div>
          </div>
        </div>
      </UiCollapsibleSection>

      <UiCollapsibleSection
        :title="t('courses.lessonResourcesHeading')"
        icon="FileTextOutlined"
      >
        <div class="flex flex-col gap-3">
          <label class="block text-sm font-semibold text-content-tertiary text-start">{{ lessonPdfTexts.label }}</label>
          <UiFileUpload
            v-model="lessonPdfFiles"
            :label="lessonPdfTexts.uploadLabel"
            :hint="lessonPdfTexts.hint"
            :disabled="lessonPdfState.uploading"
            :button-label="lessonPdfTexts.browse"
            accept="application/pdf"
            @change="onLessonPdfChange"
          />
          <UiAlert v-if="lessonPdfState.uploading" color="info" variant="soft">
            <div class="flex items-center justify-between gap-2 font-medium text-content">
              <span>{{ lessonPdfTexts.uploading }}</span>
              <span v-if="lessonPdfState.progress > 0" class="text-sakai-primary">
                {{ lessonPdfState.progress }}%
              </span>
            </div>
            <UiProgressBar :value="lessonPdfState.progress" color="info" />
          </UiAlert>
          <UiAlert v-else-if="lessonPdfState.error" color="danger" variant="soft">
            {{ lessonPdfState.error }}
          </UiAlert>
          <UiAlert v-else-if="form.pdfUrl" color="success" variant="soft" class="flex flex-wrap gap-2 items-center">
            <span>{{ lessonPdfTexts.uploaded }}</span>
            <UiButton variant="link" color="primary" @click.prevent="openLessonPdf">
              {{ lessonPdfTexts.preview }}
            </UiButton>
            <UiButton variant="link" color="danger" @click.prevent="clearLessonPdf">
              {{ lessonPdfTexts.remove }}
            </UiButton>
          </UiAlert>
          <UiAlert v-else color="info" variant="soft" class="m-0">
            {{ lessonPdfTexts.empty }}
          </UiAlert>
        </div>
      </UiCollapsibleSection>

      <UiCollapsibleSection
        v-if="aiTeacherEnabled"
        :title="t('courses.lessonAiAssistantSectionTitle')"
        icon="MessageOutlined"
        default-open
      >
        <div class="flex flex-col gap-4">
          <UiAlert color="info" variant="soft" class="m-0">
            {{ t('courses.lessonAiAssistantHint') }}
          </UiAlert>
          <TeacherLessonAiAssistant
            :lesson-id="existingLessonId"
            :lesson-title="form.title"
            :lesson-content="form.content"
          />
          <section
            class="flex flex-col gap-3 p-4 rounded-sakai-lg [border:1px_solid_color-mix(in_srgb,var(--sakai-primary)_25%,transparent)] bg-[color-mix(in_srgb,var(--sakai-primary)_10%,var(--sakai-surface)_90%)]"
            aria-labelledby="lesson-ai-guide"
          >
            <h4 id="lesson-ai-guide" class="m-0 text-[0.95rem] font-semibold text-sakai-primary">
              {{ t('courses.lessonAiAssistantGuideTitle') }}
            </h4>
            <ol class="flex flex-col gap-2 m-0 ps-5 text-content">
              <li
                v-for="(step, index) in aiGuideSteps"
                :key="index"
                class="flex flex-col gap-1 leading-[1.4]"
              >
                <span class="font-semibold text-content">
                  {{ t('courses.lessonAiAssistantGuideStepLabel', { step: index + 1 }) }}
                </span>
                <span>{{ step }}</span>
              </li>
            </ol>
            <p class="m-0 text-sm text-content-tertiary">
              {{ t('courses.lessonAiAssistantGuideReminder') }}
            </p>
          </section>
        </div>
      </UiCollapsibleSection>
    </div>

    <template #sidebar>
      <UiCard v-if="!isLoading" :title="t('courses.lessonProgressHeading')">
        <UiProgressBar
          class="w-full"
          :value="lessonProgressPercent"
          color="primary"
          :label="t('courses.lessonProgressHeading')"
        />
        <ul class="flex flex-col gap-3 m-0 p-0 list-none">
          <li v-for="section in lessonProgressSections" :key="section.key">
            <div class="flex items-center justify-between gap-3">
              <span class="font-medium text-content">{{ section.label }}</span>
              <UiTag size="sm" :color="section.tagColor">{{ section.statusLabel }}</UiTag>
            </div>
            <p class="m-0 text-sm text-content-tertiary leading-[1.4]">{{ section.description }}</p>
          </li>
        </ul>
      </UiCard>
      <UiCard v-if="!isLoading" :title="t('courses.lessonSchedulingSectionTitle')">
        <UiInput
          :model-value="form.position"
          type="number"
          min="1"
          :label="t('courses.lessonPositionLabel')"
          @update:model-value="onLessonPositionChange"
        />
        <UiInput
          :model-value="form.duration"
          type="number"
          min="0"
          :label="t('courses.lessonDurationLabel')"
          disabled
        />
        <p class="m-0 text-sm text-content-tertiary">{{ t('courses.lessonDurationSystemHint') }}</p>
      </UiCard>
    </template>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiCollapsibleSection from '@/components/ui/UiCollapsibleSection.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiProgressBar from '@/components/ui/UiProgressBar.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiFileUpload from '@/components/ui/UiFileUpload.vue';
import { useCoursesStore, type LessonPayload, type ModulePayload, type LessonVideoStatus } from '@/stores/courses';
import { useFeaturesStore, FEATURE } from '@/stores/features';
import { useTeacherUsageStore } from '@/stores/teacherUsage';
import TeacherLessonAiAssistant from '@/components/ai/TeacherLessonAiAssistant.vue';
import api from '@/services/api';
import { buildAuthenticatedMediaUrl } from '@/utils/media';
import { getHttpStatus, isAuthorizationError } from '@/utils/httpError';
import {
  LESSON_UPLOAD_MAX_SIZE_MB,
  LESSON_UPLOAD_MAX_SIZE_BYTES,
  extractLessonUploadLimitMb,
  resolveLessonUploadLimitMb
} from '@/constants/uploads';
import { extractVideoMetadata, MAX_LESSON_VIDEO_DURATION_SECONDS } from '@/utils/videoMetadata';

const route = useRoute();
const router = useRouter();
const { t, te } = useI18n();
const store = useCoursesStore();
const features = useFeaturesStore();
const usageStore = useTeacherUsageStore();
const { summary: usageSummary } = storeToRefs(usageStore);

const courseId = Number(route.params.courseId);
const moduleId = Number(route.params.moduleId);
const rawLessonId = route.params.lessonId;
const lessonId = computed(() => {
  if (typeof rawLessonId === 'string') {
    const value = Number(rawLessonId);
    return Number.isFinite(value) ? value : null;
  }
  return null;
});

const aiTeacherEnabled = computed(() => features.hasFeature(FEATURE.aiTeacher));
const maxVideoDurationSeconds = computed(() => {
  const minutes = usageSummary.value?.maxVideoDurationMinutes ?? null;
  if (typeof minutes === 'number' && minutes > 0) {
    return Math.round(minutes * 60);
  }
  return MAX_LESSON_VIDEO_DURATION_SECONDS;
});
const aiGuideSteps = computed(() => [
  t('courses.lessonAiAssistantGuideSteps.open'),
  t('courses.lessonAiAssistantGuideSteps.review'),
  t('courses.lessonAiAssistantGuideSteps.refine')
]);
const course = computed(() => store.current);
const module = computed<ModulePayload | null>(() =>
  course.value?.modules.find((item) => item.id === moduleId) ?? null
);
const existingLesson = computed<LessonPayload | null>(() => {
  if (!module.value || lessonId.value === null) {
    return null;
  }
  return module.value.lessons.find((lesson) => lesson.id === lessonId.value) ?? null;
});
const existingLessonId = computed(() => existingLesson.value?.id ?? null);
const isEditMode = computed(() => existingLessonId.value !== null);

const form = reactive({
  title: '',
  content: '',
  ytId: '',
  pdfUrl: '',
  videoUrl: null as string | null,
  videoStorageKey: null as string | null,
  bunnyVideoId: null as string | null,
  videoStatus: null as LessonVideoStatus | null,
  duration: null as number | null,
  position: 1 as number | null
});

const lessonVideoFiles = ref<File[]>([]);
const lessonPdfFiles = ref<File[]>([]);
const lessonVideoState = reactive({ uploading: false, error: '', warning: '', progress: 0 });
const lessonPdfState = reactive({ uploading: false, error: '', progress: 0 });
const attempted = ref(false);

// Unsaved-changes guard (Course Editor parity). `syncingForm` suppresses the
// dirty flag while resetForm populates from the loaded lesson; any later user
// edit flips `isDirty` true and powers the Cancel confirm in handleCancel.
const isDirty = ref(false);
const syncingForm = ref(false);

watch(
  form,
  () => {
    if (syncingForm.value) return;
    isDirty.value = true;
  },
  { deep: true }
);

const LESSON_CONTENT_RECOMMENDED_MIN = 120;
const LESSON_CONTENT_RECOMMENDED_MAX = 600;

const lessonContentLength = computed(() => form.content.trim().length);
const lessonContentOutOfRange = computed(
  () =>
    lessonContentLength.value > 0 &&
    (lessonContentLength.value < LESSON_CONTENT_RECOMMENDED_MIN ||
      lessonContentLength.value > LESSON_CONTENT_RECOMMENDED_MAX)
);

const translateCourseString = (key: string, fallback: string) => (te(key) ? t(key) : fallback);

const LESSON_VIDEO_TOO_LARGE_FALLBACK =
  'The video exceeds the {size} MB upload limit. Try compressing it or choose a smaller file.';
const LESSON_PDF_TOO_LARGE_FALLBACK =
  'The PDF exceeds the {size} MB upload limit. Try compressing it or choose a smaller file.';
const LESSON_UPLOAD_FORBIDDEN_FALLBACK =
  "You don't have permission to upload files right now. Please refresh the page and try again.";

const formatUploadTooLargeMessage = (key: string, fallback: string, limit?: number | null) => {
  const effectiveLimit = resolveLessonUploadLimitMb(limit);
  return translateCourseString(key, fallback).replace('{size}', effectiveLimit.toString());
};

const getSaveLessonBeforeUploadMessage = () =>
  te('courses.saveLessonBeforeUpload')
    ? t('courses.saveLessonBeforeUpload')
    : 'Please save the lesson before uploading a video';

const buildUploadErrorMessage = (
  error: unknown,
  options: {
    tooLargeKey: string;
    tooLargeFallback: string;
    forbiddenMessage: string;
    uploadFailedMessage: string;
  }
) => {
  const saveLessonBeforeUploadMessage = getSaveLessonBeforeUploadMessage();

  if (error instanceof Error && error.message === saveLessonBeforeUploadMessage) {
    return saveLessonBeforeUploadMessage;
  }

  if (isPayloadTooLargeError(error)) {
    const detectedLimit = extractLessonUploadLimitMb(error);
    return formatUploadTooLargeMessage(
      options.tooLargeKey,
      options.tooLargeFallback,
      detectedLimit
    );
  }

  if (isAuthorizationError(error)) {
    return options.forbiddenMessage;
  }

  return options.uploadFailedMessage;
};

const lessonContentHint = computed(() =>
  t('courses.lessonContentHint', {
    min: LESSON_CONTENT_RECOMMENDED_MIN,
    max: LESSON_CONTENT_RECOMMENDED_MAX,
    count: lessonContentLength.value
  })
);

const lessonYoutubeHint = computed(() =>
  translateCourseString(
    'courses.lessonYoutubeHint',
    'Paste the full YouTube link or ID (e.g. https://youtu.be/abcd1234efg).'
  )
);

const lessonVideoTexts = computed(() => ({
  label: translateCourseString('courses.lessonVideoLabel', 'Lesson video'),
  uploadLabel: translateCourseString('courses.lessonVideoUploadLabel', 'Drag a video here or click to upload'),
  browse: translateCourseString('courses.lessonVideoBrowse', 'Select video'),
  hint: translateCourseString(
    'courses.lessonVideoHint',
    'Accepted formats: MP4, MOV, MKV, WEBM, or AVI.'
  ),
  uploading: translateCourseString('courses.lessonVideoUploading', 'Uploading video...'),
  uploaded: translateCourseString('courses.lessonVideoUploaded', 'Video uploaded.'),
  preview: translateCourseString('courses.lessonVideoPreview', 'Open link'),
  remove: translateCourseString('courses.lessonVideoRemove', 'Remove video'),
  uploadFailed: translateCourseString(
    'courses.lessonVideoUploadFailed',
    "We couldn't upload the video. Please try again."
  ),
  forbidden: translateCourseString(
    'courses.lessonUploadForbidden',
    LESSON_UPLOAD_FORBIDDEN_FALLBACK
  ),
  tooLarge: formatUploadTooLargeMessage(
    'courses.lessonVideoTooLarge',
    LESSON_VIDEO_TOO_LARGE_FALLBACK
  ),
  empty: translateCourseString(
    'courses.lessonVideoEmpty',
    'No video uploaded yet. Add one to give learners a walkthrough.'
  )
}));

const lessonVideoStatusMap = computed(() => {
  return {
    UPLOADING: {
      label: translateCourseString('courses.lessonVideoStatusUploading', 'Uploading video'),
      color: 'info'
    },
    PROCESSING: {
      label: translateCourseString('courses.lessonVideoStatusProcessing', 'Processing video'),
      color: 'warning'
    },
    READY: {
      label: translateCourseString('courses.lessonVideoStatusReady', 'Ready to watch'),
      color: 'success'
    },
    FAILED: {
      label: translateCourseString(
        'courses.lessonVideoStatusFailed',
        'Processing failed — please re-upload the video'
      ),
      color: 'danger'
    }
  } as Record<LessonVideoStatus, { label: string; color: string }>;
});

const lessonVideoStatusMeta = (status?: LessonVideoStatus | null) =>
  (status ? lessonVideoStatusMap.value[status] : null) ?? null;

// Icon paired with the read-only video-status pill (tone comes from meta.color).
const videoStatusIcon = (status?: LessonVideoStatus | null) => {
  switch (status) {
    case 'READY':
      return 'CheckCircleOutlined';
    case 'FAILED':
      return 'Warning';
    case 'UPLOADING':
    case 'PROCESSING':
      return 'ClockCircleOutlined';
    default:
      return undefined;
  }
};

const lessonPdfTexts = computed(() => ({
  label: translateCourseString('courses.lessonPdfLabel', 'Lesson attachment (PDF)'),
  uploadLabel: translateCourseString('courses.lessonPdfUploadLabel', 'Drag a PDF here or click to upload'),
  browse: translateCourseString('courses.lessonPdfBrowse', 'Select PDF'),
  hint: translateCourseString('courses.lessonPdfHint', 'Only PDF files are supported.'),
  uploading: translateCourseString('courses.lessonPdfUploading', 'Uploading PDF...'),
  uploaded: translateCourseString('courses.lessonPdfUploaded', 'PDF uploaded.'),
  preview: translateCourseString('courses.lessonPdfPreview', 'Open attachment'),
  remove: translateCourseString('courses.lessonPdfRemove', 'Remove attachment'),
  uploadFailed: translateCourseString(
    'courses.lessonPdfUploadFailed',
    "We couldn't upload the PDF. Please try again."
  ),
  forbidden: translateCourseString('courses.lessonUploadForbidden', LESSON_UPLOAD_FORBIDDEN_FALLBACK),
  tooLarge: formatUploadTooLargeMessage(
    'courses.lessonPdfTooLarge',
    LESSON_PDF_TOO_LARGE_FALLBACK
  ),
  empty: translateCourseString(
    'courses.lessonPdfEmpty',
    'No PDF attached yet. Share worksheets or readings to guide learners.'
  )
}));

const isPayloadTooLargeError = (error: unknown) => getHttpStatus(error) === 413;

interface LessonProgressSection {
  key: string;
  label: string;
  description: string;
  statusLabel: string;
  tagColor: 'success' | 'warning' | 'danger' | 'info';
  complete: boolean;
  optional: boolean;
  weight: number;
}

const LESSON_PROGRESS_OPTIONAL_WEIGHT = 0.5;

const lessonProgressSections = computed<LessonProgressSection[]>(() => {
  const detailsComplete =
    form.title.trim().length > 0 &&
    lessonContentLength.value >= LESSON_CONTENT_RECOMMENDED_MIN &&
    !lessonContentOutOfRange.value;
  const mediaComplete = Boolean(
    form.videoUrl || form.bunnyVideoId || form.pdfUrl || form.ytId.trim()
  );
  const schedulingComplete = (() => {
    const duration = form.duration;
    const position = form.position;
    const hasDuration = typeof duration === 'number' && duration > 0;
    const hasPosition = typeof position === 'number' && position > 0;
    return hasDuration && hasPosition;
  })();

  const sections: Array<{
    key: string;
    labelKey: string;
    descriptionKey: string;
    descriptionFallback: string;
    complete: boolean;
    optional?: boolean;
  }> = [
    {
      key: 'details',
      labelKey: 'courses.lessonProgressDetails',
      descriptionKey: detailsComplete
        ? 'courses.lessonProgressDetailsHintDone'
        : 'courses.lessonProgressDetailsHint',
      descriptionFallback: detailsComplete
        ? 'Great! Learners will see the title and summary in the module list.'
        : 'Add a clear title and summary so learners know what to expect.',
      complete: detailsComplete
    },
    {
      key: 'media',
      labelKey: 'courses.lessonProgressMedia',
      descriptionKey: mediaComplete
        ? 'courses.lessonProgressMediaHintDone'
        : 'courses.lessonProgressMediaHint',
      descriptionFallback: mediaComplete
        ? 'Media is ready. Learners can watch or download supporting resources.'
        : 'Attach at least one video or PDF so students can review materials.',
      complete: mediaComplete,
      optional: false
    },
    {
      key: 'schedule',
      labelKey: 'courses.lessonProgressSchedule',
      descriptionKey: schedulingComplete
        ? 'courses.lessonProgressScheduleHintDone'
        : 'courses.lessonProgressScheduleHint',
      descriptionFallback: schedulingComplete
        ? 'Timing and order are set for this lesson.'
        : 'Set duration and position to help learners plan their time.',
      complete: schedulingComplete,
      optional: true
    }
  ];

  const completeLabel = translateCourseString('courses.lessonProgressComplete', 'Complete');
  const optionalLabel = translateCourseString('courses.lessonProgressOptional', 'Optional');
  const incompleteLabel = translateCourseString('courses.lessonProgressIncomplete', 'Needs attention');

  return sections.map((section) => {
    const label = translateCourseString(section.labelKey, section.key);
    const description = translateCourseString(section.descriptionKey, section.descriptionFallback);
    const statusLabel = section.complete
      ? completeLabel
      : section.optional
        ? optionalLabel
        : incompleteLabel;
    const tagColor: LessonProgressSection['tagColor'] = section.complete
      ? 'success'
      : section.optional
        ? 'warning'
        : 'danger';

    return {
      key: section.key,
      label,
      description,
      statusLabel,
      tagColor,
      complete: section.complete,
      optional: Boolean(section.optional),
      weight: section.optional ? LESSON_PROGRESS_OPTIONAL_WEIGHT : 1
    } satisfies LessonProgressSection;
  });
});

const lessonProgressPercent = computed(() => {
  const sections = lessonProgressSections.value;
  if (!sections.length) return 0;
  const totalWeight = sections.reduce((total, section) => total + section.weight, 0);
  const completedWeight = sections.reduce(
    (sum, section) => sum + (section.complete ? section.weight : 0),
    0
  );
  if (totalWeight <= 0) return 0;
  return Math.round((completedWeight / totalWeight) * 100);
});

const formValid = computed(() => form.title.trim().length > 0 && module.value !== null);

const pageTitle = computed(() =>
  isEditMode.value ? t('courses.editLessonTitle') : t('courses.createLessonTitle')
);
const pageSubtitle = computed(() => module.value?.title || t('courses.modules'));
const isLoading = computed(() => store.loading || !module.value);

interface UploadProgressEvent {
  loaded: number;
  total?: number | null;
}

const createUploadProgressHandler = (
  onProgress?: (progress: number) => void
) =>
  (event: UploadProgressEvent) => {
    const total = event.total ?? 0;
    if (total <= 0) {
      onProgress?.(0);
      return;
    }
    const progress = Math.min(100, Math.max(0, Math.floor((event.loaded / total) * 100)));
    onProgress?.(progress);
  };

type LessonUploadKind = 'pdf' | 'video';

const uploadLessonAsset = async (
  lessonIdValue: number | null,
  file: File,
  kind: LessonUploadKind,
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData();
  formData.append('file', file);

  const requestUrls: string[] = [];
  if (lessonIdValue !== null) {
    if (kind === 'video') {
      requestUrls.push(
        `/v1/teacher/courses/${courseId}/modules/${moduleId}/lessons/${lessonIdValue}/video`
      );
    }
    requestUrls.push(`/lessons/${lessonIdValue}/files/${kind}`);
  }
  const legacyUrl =
    kind === 'video'
      ? '/v1/teacher/courses/content/upload-video'
      : '/v1/teacher/courses/content/upload';
  requestUrls.push(legacyUrl);

  let lastError: unknown = null;
  for (const url of requestUrls) {
    try {
      const { data } = await api.post<{ url: string; key?: string }>(url, formData, {
        // Disable Axios timeout so large uploads can complete on slow connections
        timeout: 0,
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: createUploadProgressHandler(onProgress)
      });
      if (onProgress) {
        onProgress(100);
      }
      logUploadProgress(`lesson-${kind}`, 100);
      return data;
    } catch (error) {
      lastError = error;
      const status = getHttpStatus(error);
      if (status !== 404) {
        throw error;
      }
      onProgress?.(0);
      logUploadProgress(`lesson-${kind}`, 0);
    }
  }

  throw lastError ?? new Error('Upload failed');
};

const performLessonVideoUpload = async (
  file: File,
  onProgress?: (progress: number) => void,
  metadata?: { durationSeconds?: number | null; width?: number | null; height?: number | null }
) => {
  if (typeof store.uploadLessonVideo === 'function') {
    if (existingLessonId.value === null) {
      const message = getSaveLessonBeforeUploadMessage();
      throw new Error(message);
    }
    return store.uploadLessonVideo(courseId, moduleId, existingLessonId.value, file, onProgress, metadata);
  }

  return uploadLessonAsset(existingLessonId.value, file, 'video', onProgress);
};

const performLessonPdfUpload = async (file: File, onProgress?: (progress: number) => void) => {
  if (typeof store.uploadLessonPdf === 'function') {
    return store.uploadLessonPdf(file, onProgress);
  }

  return uploadLessonAsset(existingLessonId.value, file, 'pdf', onProgress);
};

const resetLessonVideoState = () => {
  lessonVideoFiles.value = [];
  lessonVideoState.uploading = false;
  lessonVideoState.error = '';
  lessonVideoState.warning = '';
  lessonVideoState.progress = 0;
};

const resetLessonPdfState = () => {
  lessonPdfFiles.value = [];
  lessonPdfState.uploading = false;
  lessonPdfState.error = '';
  lessonPdfState.progress = 0;
};

const patchExistingLesson = (patch: Partial<LessonPayload>) => {
  if (existingLessonId.value === null) {
    return;
  }
  const moduleRef = store.current?.modules.find((item) => item.id === moduleId);
  if (!moduleRef) {
    return;
  }
  const lessonRef = moduleRef.lessons.find((lesson) => lesson.id === existingLessonId.value);
  if (!lessonRef) {
    return;
  }
  Object.assign(lessonRef, patch);
};

const resetForm = (moduleValue: ModulePayload, lessonValue: LessonPayload | null) => {
  syncingForm.value = true;
  attempted.value = false;
  resetLessonVideoState();
  resetLessonPdfState();

  if (lessonValue) {
    form.title = lessonValue.title;
    form.content = lessonValue.content || '';
    form.ytId = formatYoutubeDisplay(lessonValue.ytId || '');
    form.pdfUrl = lessonValue.pdfUrl || '';
    form.videoUrl = lessonValue.videoUrl ?? null;
    form.videoStorageKey = lessonValue.videoStorageKey ?? null;
    form.bunnyVideoId = lessonValue.bunnyVideoId ?? null;
    form.videoStatus = lessonValue.videoStatus ?? null;
    form.duration = lessonValue.duration ?? null;
    form.position = lessonValue.position;
  } else {
    form.title = '';
    form.content = '';
    form.ytId = '';
    form.pdfUrl = '';
    form.videoUrl = null;
    form.videoStorageKey = null;
    form.bunnyVideoId = null;
    form.videoStatus = null;
    form.duration = null;
    form.position = moduleValue.lessons.length + 1;
  }
  // Release the guard after the populated values flush, so only later user
  // edits mark the form dirty.
  nextTick(() => {
    syncingForm.value = false;
  });
};

watch(
  [module, existingLesson],
  ([moduleValue, lessonValue]) => {
    if (moduleValue) {
      resetForm(moduleValue, lessonValue);
    }
  },
  { immediate: true }
);

watch(
  () => ({ course: course.value, loading: store.loading }),
  ({ course: courseValue, loading }) => {
    if (!loading && courseValue && !module.value) {
      goBack();
    } else if (!loading && isEditMode.value && module.value && !existingLesson.value) {
      goBack();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (!course.value || course.value.id !== courseId) {
    await store.fetchCourse(courseId);
  }
  void usageStore.loadSummary();
});

function extractYoutubeId(value?: string | null) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const patterns = [
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/(?:watch\?v=|embed\/|shorts\/)([\w-]{11})/i
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

function formatYoutubeDisplay(value?: string | null) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
  const id = extractYoutubeId(trimmed);
  if (id && /^[\w-]{11}$/.test(id)) {
    return `https://youtu.be/${id}`;
  }
  return trimmed;
}

const onLessonYoutubeBlur = () => {
  form.ytId = formatYoutubeDisplay(form.ytId);
};

const onLessonVideoChange = async (files: File[]) => {
  if (!files.length || lessonVideoState.uploading) {
    return;
  }
  const [file] = files;
  if (!file) return;
  lessonVideoState.error = '';
  lessonVideoState.warning = '';
  lessonVideoState.progress = 0;
  if (file.size > LESSON_UPLOAD_MAX_SIZE_BYTES) {
    lessonVideoState.error = formatUploadTooLargeMessage(
      'courses.lessonVideoTooLarge',
      LESSON_VIDEO_TOO_LARGE_FALLBACK,
      LESSON_UPLOAD_MAX_SIZE_MB
    );
    return;
  }
  const metadata = await extractVideoMetadata(file).catch(() => ({
    durationSeconds: null,
    width: null,
    height: null
  }));
  if (metadata.durationSeconds && metadata.durationSeconds > maxVideoDurationSeconds.value) {
    const maxMinutes = Math.round(maxVideoDurationSeconds.value / 60);
    lessonVideoState.error = translateCourseString(
      'courses.lessonVideoTooLong',
      `The video exceeds the ${maxMinutes}-minute limit. Please upload a shorter video.`
    );
    return;
  }
  if (!form.duration && metadata.durationSeconds) {
    form.duration = metadata.durationSeconds;
  }
  lessonVideoState.uploading = true;
  try {
    const result = await performLessonVideoUpload(file, (progress) => {
      lessonVideoState.progress = progress;
    }, metadata);
    lessonVideoState.warning = result.warning ?? '';
    const uploadedUrl = (result.videoUrl ?? result.url ?? '').trim();
    form.videoUrl = uploadedUrl || null;
    form.videoStorageKey = null;
    form.bunnyVideoId = result.bunnyVideoId ?? null;
    form.videoStatus = (result.status as LessonVideoStatus | undefined) ?? 'PROCESSING';
    if (uploadedUrl || form.bunnyVideoId) {
      patchExistingLesson({
        videoUrl: uploadedUrl || null,
        videoStorageKey: null,
        bunnyVideoId: form.bunnyVideoId,
        videoStatus: form.videoStatus
      });
    }
  } catch (error) {
    console.error('[LessonEditor] Failed to upload lesson video', error);
    const saveLessonBeforeUploadMessage = getSaveLessonBeforeUploadMessage();
    if (error instanceof Error && error.message === saveLessonBeforeUploadMessage) {
      lessonVideoState.error = saveLessonBeforeUploadMessage;
      lessonVideoState.warning = '';
      return;
    }
    lessonVideoState.error = buildUploadErrorMessage(error, {
      tooLargeKey: 'courses.lessonVideoTooLarge',
      tooLargeFallback: LESSON_VIDEO_TOO_LARGE_FALLBACK,
      forbiddenMessage: lessonVideoTexts.value.forbidden,
      uploadFailedMessage: lessonVideoTexts.value.uploadFailed
    });
    lessonVideoState.warning = '';
    lessonVideoState.progress = 0;
  } finally {
    lessonVideoFiles.value = [];
    lessonVideoState.uploading = false;
    lessonVideoState.progress = 0;
  }
};

const onLessonPdfChange = async (files: File[]) => {
  if (!files.length || lessonPdfState.uploading) {
    return;
  }
  const [file] = files;
  if (!file) return;
  lessonPdfState.error = '';
  lessonPdfState.progress = 0;
  if (file.size > LESSON_UPLOAD_MAX_SIZE_BYTES) {
    lessonPdfState.error = formatUploadTooLargeMessage(
      'courses.lessonPdfTooLarge',
      LESSON_PDF_TOO_LARGE_FALLBACK,
      LESSON_UPLOAD_MAX_SIZE_MB
    );
    return;
  }
  lessonPdfState.uploading = true;
  try {
    const result = await performLessonPdfUpload(file, (progress) => {
      lessonPdfState.progress = progress;
    });
    const uploadedUrl = (result.url ?? '').trim();
    form.pdfUrl = uploadedUrl;
    if (uploadedUrl) {
      patchExistingLesson({ pdfUrl: uploadedUrl });
    }
  } catch (error) {
    console.error('[LessonEditor] Failed to upload lesson PDF', error);
    lessonPdfState.error = buildUploadErrorMessage(error, {
      tooLargeKey: 'courses.lessonPdfTooLarge',
      tooLargeFallback: LESSON_PDF_TOO_LARGE_FALLBACK,
      forbiddenMessage: lessonPdfTexts.value.forbidden,
      uploadFailedMessage: lessonPdfTexts.value.uploadFailed
    });
    lessonPdfState.progress = 0;
  } finally {
    lessonPdfFiles.value = [];
    lessonPdfState.uploading = false;
    lessonPdfState.progress = 0;
  }
};

const clearLessonVideo = () => {
  form.videoUrl = null;
  form.videoStorageKey = null;
  form.bunnyVideoId = null;
  form.videoStatus = null;
  lessonVideoState.error = '';
  lessonVideoState.warning = '';
  patchExistingLesson({
    videoUrl: null,
    videoStorageKey: null,
    bunnyVideoId: null,
    videoStatus: null
  });
};

const clearLessonPdf = () => {
  form.pdfUrl = '';
  resetLessonPdfState();
  patchExistingLesson({ pdfUrl: '' });
};

const openLessonVideo = () => {
  if (!form.videoUrl) {
    return;
  }
  const playbackUrl = buildAuthenticatedMediaUrl(form.videoUrl);
  if (!playbackUrl) {
    return;
  }
  if (typeof window !== 'undefined') {
    window.open(playbackUrl, '_blank', 'noopener');
  }
};

const openLessonPdf = () => {
  if (!form.pdfUrl) {
    return;
  }
  const pdfUrl = buildAuthenticatedMediaUrl(form.pdfUrl);
  if (!pdfUrl) {
    return;
  }
  if (typeof window !== 'undefined') {
    window.open(pdfUrl, '_blank', 'noopener');
  }
};

const sanitizedPosition = (value: number | null | undefined) =>
  value && value > 0 ? Math.floor(value) : undefined;
const onLessonPositionChange = (value: string | number | null) => {
  const parsed = Number(value);
  form.position = Number.isFinite(parsed) ? parsed : null;
};

const goBack = () => {
  const courseRoute = route.path.startsWith('/assistant/')
    ? 'assistant-course'
    : 'teacher-course';
  router.push({ name: courseRoute, params: { courseId } });
};

const handleCancel = () => {
  if (isDirty.value && !window.confirm(t('courses.cancelConfirmUnsaved'))) {
    return;
  }
  goBack();
};

const saveLesson = async () => {
  attempted.value = true;
  if (!formValid.value || !module.value) {
    return;
  }
  const youtubeId = extractYoutubeId(form.ytId);
  const payload = {
    title: form.title.trim(),
    content: form.content.trim() || undefined,
    ytId: youtubeId || undefined,
    pdfUrl: form.pdfUrl.trim() || undefined,
    videoUrl: form.videoUrl,
    videoStorageKey: form.videoStorageKey,
    bunnyVideoId: form.bunnyVideoId || undefined,
    position: sanitizedPosition(form.position)
  };

  if (isEditMode.value && existingLessonId.value !== null) {
    await store.updateLesson(courseId, moduleId, existingLessonId.value, payload);
  } else {
    await store.addLesson(courseId, moduleId, payload);
  }
  isDirty.value = false;
  goBack();
};
</script>
