<template>
  <ThemePage
    :title="pageTitle"
    :subtitle="courseSubtitle"
    class="min-[1025px]:[&_.theme-page__sidebar]:basis-[21.875rem]"
  >
    <template #actions>
      <UiButton
        variant="solid"
        color="primary"
        :prepend-icon="savingAction === 'publish' ? 'pi pi-spin pi-spinner' : 'CheckCircleOutlined'"
        :disabled="isSaving"
        @click="setActiveAndSave(true, 'publish')"
      >
        {{ t("courses.publishCourse") }}
      </UiButton>
      <UiButton
        variant="soft"
        color="primary"
        :prepend-icon="savingAction === 'draft' ? 'pi pi-spin pi-spinner' : undefined"
        :disabled="isSaving"
        @click="setActiveAndSave(false, 'draft')"
      >
        {{ t("courses.saveAsDraft") }}
      </UiButton>
      <UiButton
        variant="outline"
        color="neutral"
        prepend-icon="CloseOutlined"
        :disabled="isSaving"
        @click="handleCancel"
      >
        {{ t("common.cancel") }}
      </UiButton>
    </template>

    <div v-if="course" class="course-editor flex flex-col gap-5">
      <UiCollapsibleSection
        :title="t('courses.basicInfoSection')"
        icon="Information"
        default-open
      >
          <div class="mb-4">
            <UiTag
              :color="form.active ? 'success' : 'neutral'"
              variant="soft"
              pill
              :start-icon="form.active ? 'CheckCircleOutlined' : 'ClockCircleOutlined'"
            >
              {{ visibilityAlert.heading }}
            </UiTag>
          </div>
          <form class="grid gap-4" @submit.prevent="saveInfo">
            <UiInput
              v-model="form.title"
              :label="t('courses.courseTitle')"
              required
            />
            <UiTextarea
              v-model="form.description"
              :label="t('courses.descriptionLabel')"
              :rows="3"
            />
            <UiSelect
              :model-value="form.type"
              :label="t('courses.typeLabel')"
              @update:model-value="onCourseTypeChange"
            >
              <option
                v-for="option in courseTypes"
                :key="option.value"
                :value="option.value"
              >
                {{ option.title }}
              </option>
            </UiSelect>
            <UiInput v-model="form.faq" :label="t('courses.faq')" />
          </form>
      </UiCollapsibleSection>

      <UiCollapsibleSection
        :title="t('courses.goalsRequirementsSection')"
        icon="CheckCircleOutlined"
      >
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-2">
            <span class="block text-sm font-semibold text-content-tertiary text-start mb-2">{{
              t("courses.whatYouWillLearn")
            }}</span>
            <div class="flex items-center gap-2">
              <UiInput
                v-model="whatYouWillLearnItem"
                class="flex-1 min-w-0"
                :placeholder="t('courses.whatYouWillLearnPlaceholder')"
                @keyup.enter.prevent="addItemToArr"
              />
              <UiButton
                variant="soft"
                color="primary"
                prepend-icon="PlusOutlined"
                :disabled="!whatYouWillLearnItem"
                @click="addItemToArr"
              >
                {{ t("courses.addLearnItem") }}
              </UiButton>
            </div>
            <div
              v-if="whatYouWillLearnArray.length"
              class="flex flex-wrap gap-2"
            >
              <UiTag
                v-for="(item, index) in whatYouWillLearnArray"
                :key="index"
                color="primary"
                variant="soft"
                dismissible
                :dismiss-label="t('courses.removeLearnItem')"
                @dismiss="removeItem(index)"
              >
                {{ item.learnText }}
              </UiTag>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <span class="block text-sm font-semibold text-content-tertiary text-start mb-2">{{
              t("courses.courseRequirements")
            }}</span>
            <QuillEditor
              v-model:content="form.courseRequirements"
              contentType="html"
            />
          </div>

          <UiInput
            v-model="form.targetAudience"
            :label="t('courses.targetAudience')"
          />
        </div>
      </UiCollapsibleSection>

      <UiCollapsibleSection
        :title="t('courses.visualMediaSection')"
        icon="VideoCameraOutlined"
      >
        <div class="flex flex-col gap-5">
            <section
              class="flex flex-col gap-3 p-4 rounded-sakai-lg [border:1px_solid_color-mix(in_srgb,var(--sakai-border-color)_75%,transparent)] bg-[color-mix(in_srgb,var(--sakai-surface)_95%,var(--sakai-primary)_5%)]"
            >
              <header class="flex flex-col gap-1 text-content-tertiary">
                <h4 class="m-0 text-[0.95rem] font-semibold text-content">
                  {{ t("courses.thumbnailLabel") }}
                </h4>
                <p class="m-0 text-[0.85rem]">{{ t("courses.thumbnailHint") }}</p>
              </header>
              <div
                v-if="thumbnailPreviewUrl"
                class="flex flex-col gap-2 rounded-sakai-md overflow-hidden [border:1px_solid_color-mix(in_srgb,var(--sakai-border-color)_65%,transparent)] bg-[color-mix(in_srgb,var(--sakai-surface)_92%,var(--sakai-primary)_6%)]"
              >
                <img
                  :src="thumbnailPreviewUrl"
                  :alt="form.title || t('courses.thumbnailAlt')"
                  class="w-full aspect-video object-cover bg-[color-mix(in_srgb,var(--sakai-border-color)_40%,transparent)]"
                />
                <div class="flex flex-wrap gap-2 justify-end pt-0 px-2 pb-2">
                  <UiButton
                    variant="link"
                    size="sm"
                    color="primary"
                    :disabled="!thumbnailPreviewUrl"
                    @click.prevent="openThumbnailPreview"
                  >
                    {{ t("courses.thumbnailPreviewAction") }}
                  </UiButton>
                  <UiButton
                    variant="link"
                    size="sm"
                    color="danger"
                    @click.prevent="clearThumbnail"
                  >
                    {{ t("courses.thumbnailRemoveAction") }}
                  </UiButton>
                </div>
              </div>
              <UiAlert v-else variant="soft" color="info">
                {{ t("courses.thumbnailEmpty") }}
              </UiAlert>
              <UiInput
                v-model="form.thumbnailUrl"
                :label="t('courses.thumbnailUrlLabel')"
              />
              <UiFileUpload
                v-model="thumbnailFiles"
                :label="t('courses.thumbnailUploadLabel')"
                :hint="t('courses.thumbnailUploadHint')"
                accept="image/*"
                :disabled="thumbnailState.uploading"
                icon="PictureOutlined"
                @change="onThumbnailSelected"
                @remove="onThumbnailRemoved"
              />
              <UiProgressBar
                v-if="thumbnailState.uploading"
                :value="thumbnailState.progress"
                color="info"
                :label="t('courses.thumbnailUploading')"
              />
              <UiAlert
                v-if="thumbnailState.error"
                variant="soft"
                color="danger"
              >
                {{ thumbnailState.error }}
              </UiAlert>
            </section>
            <div class="lesson-editor__upload">
              <label class="lesson-editor__field-label">
                {{ t("courses.CourseIntro") }}</label
              >
              <UiSelect
                :model-value="courseIntroVideoSource"
                :label="t('courses.previewVideo')"
                @update:model-value="onCourseIntroVideoSourceChange"
              >
                <option value="youtube">{{ t("courses.lessonYoutube") }}</option>
                <option value="bunny">Bunny</option>
              </UiSelect>
              <UiInput
                v-if="courseIntroVideoSource === 'youtube'"
                v-model="form.previewVideo"
                :label="t('courses.lessonYoutubeLabel')"
                placeholder="https://youtu.be/..."
                :hint="lessonYoutubeHint"
                @blur="onCourseIntroYoutubeBlur"
              />
              <template v-else>
                <UiFileUpload
                  v-model="courseIntroVideoFiles"
                  :label="courseIntroVideoTexts.uploadLabel"
                  :hint="courseIntroVideoTexts.hint"
                  :disabled="courseIntroVideoState.uploading"
                  :button-label="courseIntroVideoTexts.browse"
                  accept="video/mp4,video/quicktime,video/x-matroska,video/webm,video/x-msvideo"
                  @change="onCourseIntroVideoChange"
                />
                <UiAlert
                  v-if="courseIntroVideoState.uploading"
                  color="info"
                  variant="soft"
                >
                  <div class="lesson-editor__upload-progress">
                    <span>{{ courseIntroVideoTexts.uploading }}</span>
                    <span
                      v-if="courseIntroVideoState.progress > 0"
                      class="lesson-editor__upload-progress-value"
                    >
                      {{ courseIntroVideoState.progress }}%
                    </span>
                  </div>
                  <UiProgressBar
                    :value="courseIntroVideoState.progress"
                    color="info"
                  />
                </UiAlert>
                <UiAlert
                  v-else-if="courseIntroVideoState.error"
                  color="danger"
                  variant="soft"
                >
                  {{ courseIntroVideoState.error }}
                </UiAlert>
                <UiAlert
                  v-else-if="form.previewVideoPlaybackUrl"
                  color="success"
                  variant="soft"
                  class="lesson-editor__upload-alert"
                >
                  <span>{{ courseIntroVideoTexts.uploaded }}</span>
                  <UiButton
                    variant="link"
                    color="primary"
                    @click.prevent="openCourseIntroVideo"
                  >
                    {{ courseIntroVideoTexts.preview }}
                  </UiButton>
                  <UiButton
                    variant="link"
                    color="danger"
                    @click.prevent="clearCourseIntroVideo"
                  >
                    {{ courseIntroVideoTexts.remove }}
                  </UiButton>
                </UiAlert>
                <UiAlert
                  v-else
                  color="info"
                  variant="soft"
                  class="lesson-editor__empty-alert"
                >
                  {{ courseIntroVideoTexts.empty }}
                </UiAlert>
                <UiAlert
                  v-if="courseIntroVideoState.warning"
                  color="warning"
                  variant="soft"
                >
                  {{ courseIntroVideoState.warning }}
                </UiAlert>
                <UiAlert
                  v-if="lessonVideoStatusMeta(form.previewVideoStatus)?.banner"
                  :color="
                    lessonVideoStatusMeta(form.previewVideoStatus)?.color ||
                    'info'
                  "
                  variant="soft"
                  class="lesson-editor__status"
                >
                  <div class="lesson-editor__status-title">
                    {{
                      lessonVideoStatusMeta(form.previewVideoStatus)?.banner
                        ?.title
                    }}
                  </div>
                  <p class="lesson-editor__status-description">
                    {{
                      lessonVideoStatusMeta(form.previewVideoStatus)?.banner
                        ?.description
                    }}
                  </p>
                </UiAlert>
                <div
                  v-if="lessonVideoStatusMeta(form.previewVideoStatus)?.banner"
                  class="lesson-editor__video-placeholder"
                >
                  {{
                    lessonVideoStatusMeta(form.previewVideoStatus)?.banner
                      ?.placeholder
                  }}
                </div>
              </template>
            </div>
        </div>
      </UiCollapsibleSection>

      <UiCollapsibleSection
        :title="t('courses.courseContentSection')"
        icon="BookOutlined"
        default-open
      >
        <template #header-actions>
          <UiButton
            color="primary"
            prepend-icon="FolderAddOutlined"
            @click="openModuleDialog()"
          >
            {{ t("courses.addModule") }}
          </UiButton>
        </template>

          <UiAccordion
            v-if="moduleAccordionItems.length"
            :items="moduleAccordionItems"
            multiple
            flush
            class="[&_.ui-accordion\_\_content]:bg-transparent"
          >
            <template #header="{ item }">
              <div class="flex flex-wrap justify-between gap-3 items-start">
                <div class="flex flex-col gap-2">
                  <span class="font-semibold text-content">{{
                    item.module.title
                  }}</span>
                  <div class="flex flex-wrap gap-2">
                    <UiTag size="sm" color="secondary">
                      {{
                        t("courses.modulePositionLabel", {
                          position: item.module.position,
                        })
                      }}
                    </UiTag>
                    <UiTag size="sm" color="info">
                      {{
                        t("courses.lessonsCount", {
                          count: item.module.lessons.length,
                        })
                      }}
                    </UiTag>
                  </div>
                </div>
                <div class="inline-flex flex-wrap justify-end gap-2">
                  <UiButton
                    variant="link"
                    color="primary"
                    prepend-icon="EditOutlined"
                    @click.stop="openModuleDialog(item.module)"
                  >
                    {{ t("common.edit") }}
                  </UiButton>
                  <UiButton
                    variant="link"
                    color="danger"
                    prepend-icon="DeleteOutlined"
                    @click.stop="confirmDeleteModule(item.module)"
                  >
                    {{ t("common.delete") }}
                  </UiButton>
                </div>
              </div>
            </template>
            <template #content="{ item }">
              <div class="flex flex-col gap-4">
                <div class="flex flex-wrap justify-between items-center gap-3">
                  <p class="m-0 font-semibold text-content-tertiary">
                    {{ t("courses.lessons") }}
                  </p>
                  <UiButton
                    color="primary"
                    prepend-icon="PlusOutlined"
                    @click="goToLessonCreate(item.module)"
                  >
                    {{ t("courses.addLesson") }}
                  </UiButton>
                </div>
                <ul
                  v-if="item.module.lessons.length"
                  class="list-none p-0 m-0 flex flex-col gap-3"
                >
                  <li
                    v-for="lesson in sortedLessons(item.module.lessons)"
                    :key="lesson.id"
                    class="flex flex-col gap-4 p-4 rounded-sakai-lg bg-[color-mix(in_srgb,var(--sakai-primary)_6%,transparent)] [border:1px_solid_color-mix(in_srgb,var(--sakai-border-color)_65%,transparent)] min-[640px]:flex-row min-[640px]:items-start min-[640px]:justify-between"
                  >
                    <div class="flex flex-col gap-2 flex-auto min-w-0">
                      <span class="font-medium text-content">{{
                        lesson.title
                      }}</span>
                      <div class="flex flex-wrap gap-2 text-content-tertiary">
                        <UiTag
                          v-if="lessonVideoStatusMeta(lesson.videoStatus)"
                          size="sm"
                          :color="
                            lessonVideoStatusMeta(lesson.videoStatus)?.color ||
                            'secondary'
                          "
                        >
                          {{ lessonVideoStatusMeta(lesson.videoStatus)?.label }}
                        </UiTag>
                        <UiTag size="sm" color="neutral">
                          {{
                            t("courses.lessonPositionLabel", {
                              position: lesson.position,
                            })
                          }}
                        </UiTag>
                        <UiTag size="sm" color="neutral">
                          {{
                            t("courses.assignmentsCount", {
                              count: assignmentsCountByLesson[lesson.id] ?? 0,
                            })
                          }}
                        </UiTag>
                        <UiTag size="sm" color="info" v-if="lesson.duration">
                          {{ formatDuration(lesson.duration) }}
                        </UiTag>
                        <UiTag size="sm" color="secondary" v-if="lesson.ytId">
                          {{ t("courses.lessonYoutube") }}
                        </UiTag>
                        <UiTag size="sm" color="secondary" v-if="lesson.pdfUrl">
                          {{ t("courses.lessonPdf") }}
                        </UiTag>
                        <UiTag
                          size="sm"
                          color="secondary"
                          v-if="lesson.videoUrl"
                        >
                          {{ t("courses.lessonVideoTag") }}
                        </UiTag>
                      </div>
                      <div
                        v-if="lesson.content"
                        class="flex flex-col gap-2"
                      >
                        <h4 class="mt-0 mx-0 mb-2 text-sm font-semibold text-content-tertiary">
                          {{ t("courses.lessonContentHeading") }}
                        </h4>
                        <p class="m-0 text-content whitespace-pre-wrap">
                          {{ lesson.content }}
                        </p>
                      </div>
                      <div
                        v-if="lesson.videoUrl || lesson.ytId"
                        class="flex flex-col gap-2"
                      >
                        <h4 class="mt-0 mx-0 mb-2 text-sm font-semibold text-content-tertiary">
                          {{ t("courses.lessonVideoPreviewHeading") }}
                        </h4>
                        <UiAlert
                          v-if="
                            lessonVideoStatusMeta(lesson.videoStatus)?.banner
                          "
                          variant="soft"
                          :color="
                            lessonVideoStatusMeta(lesson.videoStatus)?.color ||
                            'info'
                          "
                          class="m-0"
                        >
                          <div class="font-semibold">
                            {{
                              lessonVideoStatusMeta(lesson.videoStatus)?.banner
                                ?.title
                            }}
                          </div>
                          <p class="mt-1 mx-0 mb-0 text-content">
                            {{
                              lessonVideoStatusMeta(lesson.videoStatus)?.banner
                                ?.description
                            }}
                          </p>
                        </UiAlert>
                        <div
                          v-if="
                            lessonVideoStatusMeta(lesson.videoStatus)?.banner
                          "
                          class="flex items-center justify-center min-h-[180px] max-w-[520px] p-4 rounded-sakai-md bg-[color-mix(in_srgb,var(--sakai-border-color)_25%,var(--sakai-surface)_75%)] text-content text-center font-medium"
                        >
                          {{
                            lessonVideoStatusMeta(lesson.videoStatus)?.banner
                              ?.placeholder
                          }}
                        </div>
                        <MediaVideoPlayer
                          v-else-if="lesson.videoUrl"
                          class="block w-full max-w-[480px] max-h-[320px] rounded-sakai-md border-none bg-surface shadow-sakai-sm"
                          :src="lessonVideoPlaybackUrl(lesson.videoUrl)"
                          controls
                          crossorigin="anonymous"
                          playsinline
                        />
                        <iframe
                          v-else
                          class="w-full max-w-[480px] aspect-video rounded-sakai-md border-none bg-surface shadow-sakai-sm"
                          :src="youtubeEmbed(lesson.ytId)"
                          :title="lesson.title"
                          frameborder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowfullscreen
                        ></iframe>
                      </div>
                      <div
                        v-if="lesson.pdfUrl"
                        class="flex flex-col gap-2"
                      >
                        <h4 class="mt-0 mx-0 mb-2 text-sm font-semibold text-content-tertiary">
                          {{ t("courses.lessonResourcesHeading") }}
                        </h4>
                        <a
                          class="text-sakai-primary font-medium no-underline hover:underline focus:underline"
                          :href="lesson.pdfUrl"
                          target="_blank"
                          rel="noopener"
                        >
                          {{ t("courses.lessonPdfLinkText") }}
                        </a>
                      </div>
                    </div>
                    <div class="inline-flex flex-wrap gap-2 justify-end">
                      <UiButton
                        variant="link"
                        color="primary"
                        prepend-icon="EditOutlined"
                        @click.stop="goToLessonEdit(item.module, lesson)"
                      >
                        {{ t("common.edit") }}
                      </UiButton>
                      <UiButton
                        variant="link"
                        color="secondary"
                        prepend-icon="FileTextOutlined"
                        @click.stop="openAssignments(lesson)"
                      >
                        {{ t("teacher.assignments.title") }}
                      </UiButton>
                      <UiButton
                        variant="link"
                        color="danger"
                        prepend-icon="DeleteOutlined"
                        @click.stop="confirmDeleteLesson(item.module, lesson)"
                      >
                        {{ t("common.delete") }}
                      </UiButton>
                    </div>
                  </li>
                </ul>
                <UiAlert v-else color="info" variant="soft">
                  {{ t("courses.noLessons") }}
                </UiAlert>
              </div>
            </template>
          </UiAccordion>

          <UiAlert v-else color="info" variant="soft">
            {{ t("courses.noModules") }}
          </UiAlert>
      </UiCollapsibleSection>
    </div>

    <div v-else class="grid gap-3">
      <UiSkeleton height="24px" />
      <UiSkeleton height="280px" />
    </div>

    <template #sidebar>
      <!-- Sections 3-4 fill this: Pricing + Additional Settings cards. -->
      <UiCard :title="t('courses.pricingSection')">
            <UiInput
              :model-value="form.price"
              type="number"
              :label="t('courses.priceLabel')"
              @update:model-value="onPriceChange"
            />
            <UiSelect
              :model-value="form.currency"
              :label="t('courses.currencyLabel')"
              @update:model-value="onCurrencyChange"
            >
              <option
                v-for="option in currencyOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.title }}
              </option>
            </UiSelect>
            <div class="mb-4">
              <UiCheckbox
                v-model="form.useModulePricing"
                :label="t('courses.useModulePricingLabel')"
              />
            </div>
      </UiCard>
      <UiCard :title="t('courses.additionalSettingsSection')">
            <UiInput
              v-model="form.instructor"
              :label="t('courses.instructor')"
            />
            <UiSelect
              v-model="form.level"
              :label="t('courses.levelLabel')"
              clearable
              :clear-label="t('common.clear')"
            >
              <option
                v-for="level in courseLevels"
                :key="level.value"
                :value="level.value"
              >
                {{ level.title }}
              </option>
            </UiSelect>
            <UiSelect
              v-model="form.language"
              :label="t('courses.languageLabel')"
              clearable
              :clear-label="t('common.clear')"
            >
              <option
                v-for="language in courseLanguages"
                :key="language.value"
                :value="language.value"
              >
                {{ language.title }}
              </option>
            </UiSelect>
            <UiInput v-model="form.duration" :label="t('courses.duration')" />
            <UiSwitch
              v-model="form.certificateInfo"
              :label="t('courses.certificateInfo')"
            />
      </UiCard>
    </template>

    <UiDialog v-model="moduleDialog.open" :title="moduleDialogTitle">
      <form
        id="module-dialog-form"
        class="grid gap-4"
        @submit.prevent="submitModule"
      >
        <UiInput
          v-model="moduleDialog.form.title"
          :label="t('courses.moduleTitleLabel')"
          :error="
            moduleDialogAttempt && !moduleFormValid
              ? t('courses.moduleTitleRequired')
              : ''
          "
          required
          autofocus
        />
        <UiInput
          :model-value="moduleDialog.form.position"
          type="number"
          min="1"
          :label="t('courses.positionLabel')"
          @update:model-value="onModulePositionChange"
        />
        <p class="m-0 text-[0.8rem] text-content-tertiary">
          {{ t("courses.modulePositionHelp") }}
        </p>
        <div class="mt-4 mb-4">
          <UiCheckbox
            v-model="moduleDialog.form.priced"
            :label="t('courses.modulePricedLabel')"
          />
        </div>
        <div v-if="moduleDialog.form.priced" class="grid grid-cols-2 gap-4 mb-4">
          <UiInput
            v-model.number="moduleDialog.form.price"
            type="number"
            :label="t('courses.priceLabel')"
          />
          <UiSelect
            v-model="moduleDialog.form.priceCurrency"
            :label="t('courses.currencyLabel')"
          >
            <option
              v-for="option in currencyOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.title }}
            </option>
          </UiSelect>
        </div>
      </form>
      <template #footer>
        <UiButton variant="link" color="secondary" @click="closeModuleDialog">
          {{ t("common.cancel") }}
        </UiButton>
        <UiButton
          button-type="submit"
          color="primary"
          :disabled="!moduleFormValid"
          form="module-dialog-form"
        >
          {{ t("common.save") }}
        </UiButton>
      </template>
    </UiDialog>

    <TeacherAssignmentsDialog
      v-model="assignmentsDialog.open"
      :course-id="courseId"
      :lesson-id="assignmentsDialog.lessonId"
      :lesson-title="assignmentsDialog.lessonTitle"
    />
  </ThemePage>
</template>

<script setup lang="ts">
import { reactive, computed, watch, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useCoursesStore } from "@/stores/courses";
import { useTeacherUsageStore } from "@/stores/teacherUsage";
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import type {
  ModulePayload,
  LessonPayload,
  LessonVideoStatus,
} from "@/stores/courses";
import api from "@/services/api";
import { buildAuthenticatedMediaUrl } from "@/utils/media";
import { getHttpStatus, isAuthorizationError } from "@/utils/httpError";
import {
  LESSON_UPLOAD_MAX_SIZE_MB,
  LESSON_UPLOAD_MAX_SIZE_BYTES,
  extractLessonUploadLimitMb,
  resolveLessonUploadLimitMb,
} from "@/constants/uploads";
import {
  extractVideoMetadata,
  MAX_LESSON_VIDEO_DURATION_SECONDS,
} from "@/utils/videoMetadata";
import ThemePage from "@/layout/theme/ThemePage.vue";
import UiAlert from "@/components/ui/UiAlert.vue";

import UiAccordion from "@/components/ui/UiAccordion.vue";
import type { UiAccordionItem } from "@/components/ui/UiAccordion.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiDialog from "@/components/ui/UiDialog.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UiTextarea from "@/components/ui/UiTextarea.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";
import UiTag from "@/components/ui/UiTag.vue";
import UiFileUpload from "@/components/ui/UiFileUpload.vue";
import UiProgressBar from "@/components/ui/UiProgressBar.vue";
import UiSwitch from "@/components/ui/UiSwitch.vue";
import UiCheckbox from "@/components/ui/UiCheckbox.vue";
import UiCollapsibleSection from "@/components/ui/UiCollapsibleSection.vue";
import { useToast } from "@/composables/useToast";
import MediaVideoPlayer from "@/components/media/MediaVideoPlayer.vue";
import TeacherAssignmentsDialog from "@/components/teacher/assignments/TeacherAssignmentsDialog.vue";
import { useLearningStore } from "@/stores/learning";

type DialogMode = "create" | "edit";
const editorVal = ref("");
const route = useRoute();
const router = useRouter();
const { t, te } = useI18n();
const store = useCoursesStore();
const usageStore = useTeacherUsageStore();
const learningStore = useLearningStore();
const { summary: usageSummary } = storeToRefs(usageStore);
const courseId = Number(route.params.courseId);
const toast = useToast();

const assignmentsDialog = reactive({
  open: false,
  lessonId: null as number | null,
  lessonTitle: ''
});

const openAssignments = (lesson: LessonPayload) => {
  assignmentsDialog.lessonId = lesson.id;
  assignmentsDialog.lessonTitle = lesson.title;
  assignmentsDialog.open = true;
};

const assignmentsCountByLesson = computed<Record<number, number>>(() => {
  const counts: Record<number, number> = {};
  for (const assignment of learningStore.teacherAssignments) {
    if (assignment.courseId !== courseId) continue;
    counts[assignment.lessonId] = (counts[assignment.lessonId] ?? 0) + 1;
  }
  return counts;
});
const course = computed(() => store.current);
const pageTitle = computed(() => course.value?.title || t("courses.untitled"));
const courseSubtitle = computed(
  () => course.value?.description || t("courses.subtitle")
);
const SUPPORTED_COURSE_CURRENCIES = ["EGP", "AED", "SAR", "USD"] as const;

const selectedFile = ref(null);
const videoUrl = ref(null);
const error = ref("");

// Validation rules
const maxSizeMB = 50;
const allowedTypes = ["video/mp4", "video/webm", "video/ogg"];

function handleFileChange(event: any) {
  error.value = "";
  const file = event.target.files[0];

  if (!file) return;

  // ✅ Type validation
  if (!allowedTypes.includes(file.type)) {
    error.value = "Only MP4, WebM, and OGG videos are allowed.";
    return;
  }

  // ✅ Size validation
  if (file.size > maxSizeMB * 1024 * 1024) {
    error.value = `File must be smaller than ${maxSizeMB}MB.`;
    return;
  }

  selectedFile.value = file;
  uploadVideo();
  // Preview
  // videoUrl.value = URL.createObjectURL(file);
}

async function uploadVideo() {
  console.log(courseId);
  if (!selectedFile.value) return;

  const formData = new FormData();
  formData.append("file", selectedFile.value);
  ///api/v1/teacher/courses/{courseId}/preview-video
  try {
    await fetch(`/api/v1/teacher/courses/${courseId}/preview-video`, {
      method: "POST",
      body: formData,
    });

    alert("Upload successful!");
  } catch (err) {
    error.value = "Upload failed.";
    console.log(err);
  }
}
const maxVideoDurationSeconds = computed(() => {
  const minutes = usageSummary.value?.maxVideoDurationMinutes ?? null;
  if (typeof minutes === "number" && minutes > 0) {
    return Math.round(minutes * 60);
  }
  return MAX_LESSON_VIDEO_DURATION_SECONDS;
});

const resolveCurrency = (value?: string | number | null) => {
  const raw =
    typeof value === "number"
      ? String(value)
      : typeof value === "string"
      ? value
      : "";
  const normalized = raw.trim().toUpperCase();
  return SUPPORTED_COURSE_CURRENCIES.includes(
    normalized as (typeof SUPPORTED_COURSE_CURRENCIES)[number]
  )
    ? normalized
    : SUPPORTED_COURSE_CURRENCIES[0];
};
const currencyOptions = computed(() => [
  { title: t("courses.currencyOptionEGP"), value: "EGP" },
  { title: t("courses.currencyOptionAED"), value: "AED" },
  { title: t("courses.currencyOptionSAR"), value: "SAR" },
  { title: t("courses.currencyOptionUSD"), value: "USD" },
]);

const courseTypes = computed(() => [
  { title: t("courses.typeRecorded"), value: "recorded" },
  { title: t("courses.typeLive"), value: "live" },
  { title: t("courses.typeBlended"), value: "blended" },
]);
const courseLevels = computed(() => [
  { title: t("courses.levelDefault"), value: "" },
  { title: t("courses.levelBeginner"), value: "beginner" },
  { title: t("courses.levelIntermediate"), value: "intermediate" },
  { title: t("courses.levelAdvanced"), value: "advanced" },
]);
const courseLanguages = computed(() => [
  { title: t("courses.languageDefault"), value: "" },
  { title: t("courses.languageArabic"), value: "ar" },
  { title: t("courses.languageEnglish"), value: "en" },
  { title: t("courses.languageFrench"), value: "fr" },
  { title: t("courses.languageSpanish"), value: "es" },
]);
const form = reactive({
  title: "",
  description: "",
  // courseOverview: "",
  instructor: "",
  faq: "",
  certificateInfo: false,
  duration: "",
  targetAudience: "",
  previewVideo: "",
  previewVideoPlaybackUrl: "",
  previewVideoBunnyId: null as string | null,
  previewVideoStatus: null as LessonVideoStatus | null,
  type: "recorded",
  price: 0,
  currency: resolveCurrency(),
  useModulePricing: false,
  level: "",
  language: "",
  thumbnailUrl: "",
  active: false,
  whatYouWillLearn: [],
  courseRequirements: "",
  // refundPolicy: "",
  // curriculum: "",
});

const visibilityAlert = computed(() => {
  if (form.active) {
    return {
      state: "published",
      heading: t("courses.visibilityPublishedLabel"),
      message: t("courses.visibilityPublishedNotice"),
    } as const;
  }

  return {
    state: "draft",
    heading: t("courses.visibilityDraftLabel"),
    message: t("courses.visibilityDraftNotice"),
  } as const;
});

const LESSON_CONTENT_RECOMMENDED_MIN = 120;
const LESSON_CONTENT_RECOMMENDED_MAX = 600;

const moduleDialog = reactive({
  open: false,
  mode: "create" as DialogMode,
  moduleId: null as number | null,
  form: {
    title: "",
    position: 1 as number | null,
    priced: false,
    price: 0 as number | null,
    priceCurrency: resolveCurrency(),
  },
});

const lessonDialog = reactive({
  open: false,
  mode: "create" as DialogMode,
  moduleId: null as number | null,
  lessonId: null as number | null,
  form: {
    title: "",
    content: "",
    ytId: "",
    pdfUrl: "",
    videoUrl: null as string | null,
    videoStorageKey: null as string | null,
    bunnyVideoId: null as string | null,
    videoStatus: null as LessonVideoStatus | null,
    duration: null as number | null,
    position: 1 as number | null,
  },
});

const thumbnailFiles = ref<File[]>([]);
const thumbnailState = reactive({
  uploading: false,
  error: "",
  progress: 0,
});
const thumbnailVersion = ref<number | null>(null);

const moduleDialogAttempt = ref(false);
const lessonDialogAttempt = ref(false);

const lessonVideoFiles = ref<File[]>([]);
const lessonVideoState = reactive({
  uploading: false,
  error: "",
  warning: "",
  progress: 0,
});
const courseIntroVideoFiles = ref<File[]>([]);
const courseIntroVideoState = reactive({
  uploading: false,
  error: "",
  warning: "",
  progress: 0,
});
const courseIntroVideoSource = ref<"youtube" | "bunny">("youtube");
function removeItem(index: any) {
  whatYouWillLearnArray.value.splice(index, 1);
}
const whatYouWillLearnItem = ref<any>("");
const whatYouWillLearnArray = ref<any>([]);

function addItemToArr() {
  const text = whatYouWillLearnItem.value?.trim();
  if (!text) return;

  // Auto-order by insertion; the order field is no longer surfaced to users.
  whatYouWillLearnArray.value.push({
    learnText: text,
    ordered: whatYouWillLearnArray.value.length + 1,
  });

  whatYouWillLearnItem.value = "";
}

const lessonPdfFiles = ref<File[]>([]);
const lessonPdfState = reactive({
  uploading: false,
  error: "",
  progress: 0,
});

const thumbnailPreviewUrl = computed(() => {
  const trimmed = form.thumbnailUrl.trim();
  if (!trimmed) {
    return "";
  }
  const preview = buildAuthenticatedMediaUrl(trimmed, {
    version: thumbnailVersion.value,
  });
  return preview || trimmed;
});

watch(
  () => form.thumbnailUrl,
  (next, prev) => {
    const nextTrimmed = (next ?? "").trim();
    const prevTrimmed = (prev ?? "").trim();
    if (nextTrimmed === prevTrimmed) {
      return;
    }
    thumbnailVersion.value = nextTrimmed ? Date.now() : null;
  },
  { immediate: true }
);

const translateCourseString = (key: string, fallback: string) =>
  te(key) ? t(key) : fallback;

const LESSON_VIDEO_TOO_LARGE_FALLBACK =
  "The video exceeds the {size} MB upload limit. Try compressing it or choose a smaller file.";
const LESSON_PDF_TOO_LARGE_FALLBACK =
  "The PDF exceeds the {size} MB upload limit. Try compressing it or choose a smaller file.";
const LESSON_UPLOAD_FORBIDDEN_FALLBACK =
  "You don't have permission to upload files right now. Please refresh the page and try again.";

const formatUploadTooLargeMessage = (
  key: string,
  fallback: string,
  limit?: number | null
) => {
  const effectiveLimit = resolveLessonUploadLimitMb(limit);
  return translateCourseString(key, fallback).replace(
    "{size}",
    effectiveLimit.toString()
  );
};

const buildUploadErrorMessage = (
  error: unknown,
  options: {
    tooLargeKey: string;
    tooLargeFallback: string;
    forbiddenMessage: string;
    uploadFailedMessage: string;
  }
) => {
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

const lessonContentLength = computed(
  () => lessonDialog.form.content.trim().length
);

type UploadProgressEvent = { loaded: number; total?: number | null };

const logUploadProgress = (kind: string, progress: number) => {
  console.debug(`[upload ${kind}] ${progress}%`);
};

const createUploadProgressHandler =
  (kind: string, onProgress?: (progress: number) => void) =>
  (event: UploadProgressEvent) => {
    const total = event.total ?? 0;
    if (total <= 0) {
      onProgress?.(0);
      logUploadProgress(kind, 0);
      return;
    }
    const progress = Math.min(
      100,
      Math.max(0, Math.floor((event.loaded / total) * 100))
    );
    onProgress?.(progress);
    logUploadProgress(kind, progress);
  };

const uploadBinaryWithProgress = async (
  url: string,
  file: File,
  kind: string,
  onProgress?: (progress: number) => void,
  metadata?: {
    durationSeconds?: number | null;
    width?: number | null;
    height?: number | null;
  }
) => {
  const formData = new FormData();
  formData.append("file", file);
  if (metadata?.durationSeconds) {
    formData.append("durationSeconds", String(metadata.durationSeconds));
  }
  if (metadata?.width) {
    formData.append("videoWidth", String(metadata.width));
  }
  if (metadata?.height) {
    formData.append("videoHeight", String(metadata.height));
  }

  const { data } = await api.post<
    { url?: string; key?: string; videoUrl?: string; bunnyVideoId?: string; status?: string; warning?: string }
  >(
    url,
    formData,
    {
      // Disable Axios timeout so large uploads can complete on slow connections
      timeout: 0,
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: createUploadProgressHandler(kind, onProgress),
    }
  );

  if (onProgress) {
    onProgress(100);
  }
  logUploadProgress(kind, 100);

  return data;
};
const lessonContentOutOfRange = computed(
  () =>
    lessonContentLength.value > 0 &&
    (lessonContentLength.value < LESSON_CONTENT_RECOMMENDED_MIN ||
      lessonContentLength.value > LESSON_CONTENT_RECOMMENDED_MAX)
);
const lessonContentHint = computed(() =>
  t("courses.lessonContentHint", {
    min: LESSON_CONTENT_RECOMMENDED_MIN,
    max: LESSON_CONTENT_RECOMMENDED_MAX,
    count: lessonContentLength.value,
  })
);

const lessonYoutubeHint = computed(() =>
  translateCourseString(
    "courses.lessonYoutubeHint",
    "Paste the full YouTube link or ID (e.g. https://youtu.be/abcd1234efg)."
  )
);

const lessonVideoTexts = computed(() => ({
  tag: translateCourseString("courses.lessonVideoTag", "Video"),
  label: translateCourseString("courses.lessonVideoLabel", "Lesson video"),
  uploadLabel: translateCourseString(
    "courses.lessonVideoUploadLabel",
    "Drag a video here or click to upload"
  ),
  browse: translateCourseString("courses.lessonVideoBrowse", "Select video"),
  hint: translateCourseString(
    "courses.lessonVideoHint",
    "Accepted formats: MP4, MOV, MKV, WEBM, or AVI."
  ),
  uploading: translateCourseString(
    "courses.lessonVideoUploading",
    "Uploading video..."
  ),
  uploaded: translateCourseString(
    "courses.lessonVideoUploaded",
    "Video uploaded."
  ),
  preview: translateCourseString("courses.lessonVideoPreview", "Open link"),
  remove: translateCourseString("courses.lessonVideoRemove", "Remove video"),
  uploadFailed: translateCourseString(
    "courses.lessonVideoUploadFailed",
    "We couldn't upload the video. Please try again."
  ),
  forbidden: translateCourseString(
    "courses.lessonUploadForbidden",
    LESSON_UPLOAD_FORBIDDEN_FALLBACK
  ),
  tooLarge: formatUploadTooLargeMessage(
    "courses.lessonVideoTooLarge",
    LESSON_VIDEO_TOO_LARGE_FALLBACK
  ),
  empty: translateCourseString(
    "courses.lessonVideoEmpty",
    "No video uploaded yet. Add one to give learners a walkthrough."
  ),
}));

const courseIntroVideoTexts = computed(() => ({
  ...lessonVideoTexts.value,
  label: t("courses.CourseIntro"),
}));

const lessonVideoStatusMap = computed(() => {
  const processingBanner = {
    title: translateCourseString(
      "courses.lessonVideoProcessingBannerTitle",
      "Video is being prepared"
    ),
    description: translateCourseString(
      "courses.lessonVideoProcessingBannerDescription",
      "Usually takes 3-5 minutes. You can keep editing the lesson and course now."
    ),
    placeholder: translateCourseString(
      "courses.lessonVideoProcessingPlaceholder",
      "Video is processing… It will play automatically once it is ready."
    ),
  };

  const failedBanner = {
    title: translateCourseString(
      "courses.lessonVideoFailedBannerTitle",
      "Processing failed"
    ),
    description: translateCourseString(
      "courses.lessonVideoFailedBannerDescription",
      "Please try uploading the video again."
    ),
    placeholder: translateCourseString(
      "courses.lessonVideoFailedPlaceholder",
      "Video is unavailable until processing completes successfully."
    ),
  };

  return {
    UPLOADING: {
      label: translateCourseString(
        "courses.lessonVideoStatusUploading",
        "Uploading video"
      ),
      color: "info",
      banner: processingBanner,
      showPlayer: false,
    },
    PROCESSING: {
      label: translateCourseString(
        "courses.lessonVideoStatusProcessing",
        "Processing video"
      ),
      color: "warning",
      banner: processingBanner,
      showPlayer: false,
    },
    READY: {
      label: translateCourseString(
        "courses.lessonVideoStatusReady",
        "Ready to watch"
      ),
      color: "success",
      showPlayer: true,
    },
    FAILED: {
      label: translateCourseString(
        "courses.lessonVideoStatusFailed",
        "Processing failed — please re-upload the video"
      ),
      color: "danger",
      banner: failedBanner,
      showPlayer: false,
    },
  } as Record<
    LessonVideoStatus,
    {
      label: string;
      color: string;
      banner?: {
        title: string;
        description: string;
        placeholder: string;
      };
      showPlayer?: boolean;
    }
  >;
});

const lessonVideoStatusMeta = (status?: LessonVideoStatus | null) =>
  (status ? lessonVideoStatusMap.value[status] : null) ?? null;

const lessonPdfTexts = computed(() => ({
  label: translateCourseString(
    "courses.lessonPdfLabel",
    "Lesson attachment (PDF)"
  ),
  uploadLabel: translateCourseString(
    "courses.lessonPdfUploadLabel",
    "Drag a PDF here or click to upload"
  ),
  browse: translateCourseString("courses.lessonPdfBrowse", "Select PDF"),
  hint: translateCourseString(
    "courses.lessonPdfHint",
    "Only PDF files are supported."
  ),
  uploading: translateCourseString(
    "courses.lessonPdfUploading",
    "Uploading PDF..."
  ),
  uploaded: translateCourseString("courses.lessonPdfUploaded", "PDF uploaded."),
  preview: translateCourseString("courses.lessonPdfPreview", "Open attachment"),
  remove: translateCourseString("courses.lessonPdfRemove", "Remove attachment"),
  uploadFailed: translateCourseString(
    "courses.lessonPdfUploadFailed",
    "We couldn't upload the PDF. Please try again."
  ),
  forbidden: translateCourseString(
    "courses.lessonUploadForbidden",
    LESSON_UPLOAD_FORBIDDEN_FALLBACK
  ),
  tooLarge: formatUploadTooLargeMessage(
    "courses.lessonPdfTooLarge",
    LESSON_PDF_TOO_LARGE_FALLBACK
  ),
  empty: translateCourseString(
    "courses.lessonPdfEmpty",
    "No PDF attached yet. Share worksheets or readings to guide learners."
  ),
}));

const isPayloadTooLargeError = (error: unknown) => getHttpStatus(error) === 413;

function extractYoutubeId(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const patterns = [
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/(?:watch\?v=|embed\/|shorts\/)([\w-]{11})/i,
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
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  const id = extractYoutubeId(trimmed);
  if (id && /^[\w-]{11}$/.test(id)) {
    return `https://youtu.be/${id}`;
  }
  return trimmed;
}

interface LessonProgressSection {
  key: string;
  label: string;
  description: string;
  statusLabel: string;
  tagColor: "success" | "warning" | "danger" | "info";
  complete: boolean;
  optional: boolean;
  weight: number;
}

const LESSON_PROGRESS_OPTIONAL_WEIGHT = 0.5;

const lessonProgressSections = computed<LessonProgressSection[]>(() => {
  const detailsComplete =
    lessonDialog.form.title.trim().length > 0 &&
    lessonContentLength.value >= LESSON_CONTENT_RECOMMENDED_MIN &&
    !lessonContentOutOfRange.value;
  const mediaComplete = Boolean(
    lessonDialog.form.videoUrl ||
      lessonDialog.form.bunnyVideoId ||
      lessonDialog.form.pdfUrl ||
      lessonDialog.form.ytId.trim()
  );
  const schedulingComplete = (() => {
    const duration = lessonDialog.form.duration;
    const position = lessonDialog.form.position;
    const hasDuration = typeof duration === "number" && duration > 0;
    const hasPosition = typeof position === "number" && position > 0;
    return hasDuration && hasPosition;
  })();

  const sections: Array<{
    key: string;
    labelKey: string;
    descriptionKey: string;
    descriptionCompleteKey?: string;
    descriptionFallback: string;
    descriptionCompleteFallback?: string;
    labelFallback: string;
    complete: boolean;
    optional: boolean;
  }> = [
    {
      key: "details",
      labelKey: "courses.lessonProgressDetails",
      descriptionKey: "courses.lessonProgressDetailsHint",
      descriptionCompleteKey: "courses.lessonProgressDetailsHintDone",
      descriptionFallback:
        "Add a clear title and summary so learners know what to expect.",
      descriptionCompleteFallback:
        "Great! Learners will see the title and summary in the module list.",
      labelFallback: "Lesson basics",
      complete: detailsComplete,
      optional: false,
    },
    {
      key: "media",
      labelKey: "courses.lessonProgressMedia",
      descriptionKey: "courses.lessonProgressMediaHint",
      descriptionCompleteKey: "courses.lessonProgressMediaHintDone",
      descriptionFallback:
        "Attach at least one video or PDF so students can review materials.",
      descriptionCompleteFallback:
        "Media is ready. Learners can watch or download supporting resources.",
      labelFallback: "Resources & media",
      complete: mediaComplete,
      optional: true,
    },
    {
      key: "schedule",
      labelKey: "courses.lessonProgressSchedule",
      descriptionKey: "courses.lessonProgressScheduleHint",
      descriptionCompleteKey: "courses.lessonProgressScheduleHintDone",
      descriptionFallback:
        "Set duration and position to help learners plan their time.",
      descriptionCompleteFallback: "Timing and order are set for this lesson.",
      labelFallback: "Publishing & order",
      complete: schedulingComplete,
      optional: true,
    },
  ];

  const optionalLabel = translateCourseString(
    "courses.lessonProgressOptional",
    "Optional"
  );
  const completeLabel = translateCourseString(
    "courses.lessonProgressComplete",
    "Complete"
  );
  const incompleteLabel = translateCourseString(
    "courses.lessonProgressIncomplete",
    "Pending"
  );

  return sections.map((section) => {
    const label = translateCourseString(
      section.labelKey,
      section.labelFallback
    );
    const description = translateCourseString(
      section.complete && section.descriptionCompleteKey
        ? section.descriptionCompleteKey
        : section.descriptionKey,
      section.complete
        ? section.descriptionCompleteFallback ?? section.descriptionFallback
        : section.descriptionFallback
    );
    const statusLabel = section.complete
      ? completeLabel
      : section.optional
      ? optionalLabel
      : incompleteLabel;
    const tagColor: LessonProgressSection["tagColor"] = section.complete
      ? "success"
      : section.optional
      ? "warning"
      : "danger";

    return {
      key: section.key,
      label,
      description,
      statusLabel,
      tagColor,
      complete: section.complete,
      optional: section.optional,
      weight: section.optional ? LESSON_PROGRESS_OPTIONAL_WEIGHT : 1,
    } satisfies LessonProgressSection;
  });
});

const lessonProgressPercent = computed(() => {
  const sections = lessonProgressSections.value;
  if (!sections.length) return 0;
  const totalWeight = sections.reduce(
    (total, section) => total + section.weight,
    0
  );
  const completedWeight = sections.reduce(
    (sum, section) => sum + (section.complete ? section.weight : 0),
    0
  );
  if (totalWeight <= 0) return 0;
  return Math.round((completedWeight / totalWeight) * 100);
});

const onLessonYoutubeBlur = () => {
  lessonDialog.form.ytId = formatYoutubeDisplay(lessonDialog.form.ytId);
};

const onCourseIntroYoutubeBlur = () => {
  form.previewVideo = formatYoutubeDisplay(form.previewVideo);
};

const resetCourseIntroVideoState = () => {
  courseIntroVideoFiles.value = [];
  courseIntroVideoState.uploading = false;
  courseIntroVideoState.error = "";
  courseIntroVideoState.warning = "";
  courseIntroVideoState.progress = 0;
};

const onCourseIntroVideoSourceChange = (value: string | number | null) => {
  const nextSource = value === "bunny" ? "bunny" : "youtube";
  if (nextSource === courseIntroVideoSource.value) {
    return;
  }
  courseIntroVideoSource.value = nextSource;
  resetCourseIntroVideoState();
  if (nextSource === "youtube") {
    form.previewVideoPlaybackUrl = "";
    form.previewVideoBunnyId = null;
    form.previewVideoStatus = null;
  } else {
    form.previewVideo = "";
  }
};

const performLessonVideoUpload = async (
  file: File,
  onProgress?: (progress: number) => void,
  metadata?: {
    durationSeconds?: number | null;
    width?: number | null;
    height?: number | null;
  }
) => {
  if (typeof store.uploadLessonVideo === "function") {
    if (courseId === null) {
      const message = te("courses.saveLessonBeforeUpload")
        ? t("courses.saveLessonBeforeUpload")
        : "Please save the lesson before uploading a video";
      throw new Error(message);
    }
    if (lessonDialog.moduleId === null || lessonDialog.lessonId === null) {
      const message = te("courses.saveLessonBeforeUpload")
        ? t("courses.saveLessonBeforeUpload")
        : "Please save the lesson before uploading a video";
      throw new Error(message);
    }
    return store.uploadLessonVideo(
      courseId,
      lessonDialog.moduleId,
      lessonDialog.lessonId,
      file,
      onProgress,
      metadata
    );
  }

  return uploadBinaryWithProgress(
    `/v1/teacher/courses/${courseId}/modules/${lessonDialog.moduleId}/lessons/${lessonDialog.lessonId}/video`,
    file,
    "lesson-video",
    onProgress,
    metadata
  );
};

const performCourseIntroVideoUpload = async (
  file: File,
  onProgress?: (progress: number) => void,
  metadata?: {
    durationSeconds?: number | null;
    width?: number | null;
    height?: number | null;
  }
) => {
  if (typeof store.uploadCoursePreviewVideo === "function") {
    return store.uploadCoursePreviewVideo(courseId, file, onProgress, metadata);
  }

  return uploadBinaryWithProgress(
    `/v1/teacher/courses/${courseId}/preview-video`,
    file,
    "course-preview-video",
    onProgress,
    metadata
  );
};

const performLessonPdfUpload = async (
  file: File,
  onProgress?: (progress: number) => void
) => {
  if (typeof store.uploadLessonPdf === "function") {
    return store.uploadLessonPdf(file, onProgress);
  }

  return uploadBinaryWithProgress(
    "/v1/teacher/courses/content/upload",
    file,
    "lesson-pdf",
    onProgress
  );
};

const performCourseThumbnailUpload = async (
  file: File,
  onProgress?: (progress: number) => void
) => {
  return uploadBinaryWithProgress(
    "/v1/teacher/courses/content/upload-image",
    file,
    "course-thumbnail",
    onProgress
  );
};

const sortedModules = computed(() =>
  course.value
    ? [...course.value.modules].sort((a, b) => a.position - b.position)
    : []
);

const sortedLessons = (lessons: LessonPayload[]) =>
  [...lessons].sort((a, b) => a.position - b.position);

const moduleFormValid = computed(
  () => moduleDialog.form.title.trim().length > 0
);
const lessonFormValid = computed(
  () =>
    lessonDialog.moduleId !== null && lessonDialog.form.title.trim().length > 0
);

const moduleDialogTitle = computed(() =>
  moduleDialog.mode === "create"
    ? t("courses.createModuleTitle")
    : t("courses.editModuleTitle")
);

const lessonDialogTitle = computed(() =>
  lessonDialog.mode === "create"
    ? t("courses.createLessonTitle")
    : t("courses.editLessonTitle")
);

interface ModuleAccordionItem extends UiAccordionItem {
  module: ModulePayload;
}

const moduleAccordionItems = computed<ModuleAccordionItem[]>(() =>
  sortedModules.value.map((module) => ({
    value: module.id,
    title: module.title,
    module,
  }))
);

const sanitizedPosition = (value: number | null | undefined) =>
  value && value > 0 ? Math.floor(value) : undefined;

const onCourseTypeChange = (value: string | number | null) => {
  form.type = typeof value === "string" ? value : String(value ?? form.type);
};

const onPriceChange = (value: string | number | null) => {
  const parsed = Number(value);
  form.price = Number.isNaN(parsed) ? 0 : parsed;
};

const onCurrencyChange = (value: string | number | null) => {
  form.currency = resolveCurrency(value);
};

const onThumbnailSelected = async (files: File[]) => {
  if (!files.length) {
    return;
  }
  const [file] = files;
  if (!file) {
    return;
  }
  thumbnailState.uploading = true;
  thumbnailState.error = "";
  thumbnailState.progress = 0;
  try {
    const result = await performCourseThumbnailUpload(file, (progress) => {
      thumbnailState.progress = progress;
    });
    const uploadedUrl = (result.url ?? "").trim();
    if (uploadedUrl) {
      form.thumbnailUrl = uploadedUrl;
      thumbnailVersion.value = Date.now();
      if (store.current && store.current.id === courseId) {
        store.current.thumbnailUrl = uploadedUrl;
      }
      const summary = store.list.find(
        (courseItem) => courseItem.id === courseId
      );
      if (summary) {
        summary.thumbnailUrl = uploadedUrl;
      }
    }
  } catch (error) {
    console.error("[CourseEditor] Failed to upload course thumbnail", error);
    thumbnailState.error = t("courses.thumbnailUploadFailed");
  } finally {
    thumbnailFiles.value = [];
    thumbnailState.uploading = false;
    thumbnailState.progress = 0;
  }
};

const onThumbnailRemoved = () => {
  thumbnailFiles.value = [];
  thumbnailState.error = "";
};

const clearThumbnail = () => {
  form.thumbnailUrl = "";
  thumbnailFiles.value = [];
  thumbnailState.error = "";
};

const openThumbnailPreview = () => {
  const preview = thumbnailPreviewUrl.value;
  if (!preview) {
    return;
  }
  if (typeof window !== "undefined") {
    window.open(preview, "_blank", "noopener");
  }
};

const onModulePositionChange = (value: string | number | null) => {
  const parsed = Number(value);
  moduleDialog.form.position = Number.isNaN(parsed)
    ? 1
    : Math.max(1, Math.floor(parsed));
};

const onLessonPositionChange = (value: string | number | null) => {
  const parsed = Number(value);
  lessonDialog.form.position = Number.isNaN(parsed)
    ? 1
    : Math.max(1, Math.floor(parsed));
};

const resetLessonVideoState = () => {
  lessonVideoFiles.value = [];
  lessonVideoState.uploading = false;
  lessonVideoState.error = "";
  lessonVideoState.warning = "";
  lessonVideoState.progress = 0;
};

const resetLessonPdfState = () => {
  lessonPdfFiles.value = [];
  lessonPdfState.uploading = false;
  lessonPdfState.error = "";
  lessonPdfState.progress = 0;
};

const hasInitializedVisibility = ref(false);
const hasUserAdjustedVisibility = ref(false);
const syncingVisibilityFromCourse = ref(false);

// Top action bar (Section 2): save-in-flight + which action triggered it, and a
// best-effort dirty flag for the Cancel unsaved-changes guard.
const isSaving = ref(false);
const savingAction = ref<"publish" | "draft" | null>(null);
const isDirty = ref(false);

watch(
  () => form.active,
  (next, prev) => {
    if (!hasInitializedVisibility.value) {
      return;
    }
    if (syncingVisibilityFromCourse.value) {
      return;
    }
    if (next !== prev) {
      hasUserAdjustedVisibility.value = true;
    }
  }
);

// Mark the form dirty on any field change, except while the store is syncing the
// form from the loaded course or while a save is in flight (those are not user
// edits). Powers the Cancel unsaved-changes confirm.
watch(
  form,
  () => {
    if (syncingVisibilityFromCourse.value || isSaving.value) {
      return;
    }
    isDirty.value = true;
  },
  { deep: true },
);

watch(
  course,
  (value) => {
    if (value) {
      //      ?: string;
      // courseRequirements?: string;
      // faq?: string;
      // instructor?: string;
      // previewVideo?: string;
      // targetAudience?: string;
      // whatYouWillLearn?: [];

      syncingVisibilityFromCourse.value = true;
      try {
        form.title = value.title;
        form.description = value.description || "";
        form.certificateInfo = value?.certificateInfo || false;
        form.courseRequirements = value?.courseRequirements || "";
        form.faq = value?.faq || "";
        form.instructor = value?.instructor || "";
        form.targetAudience = value?.targetAudience || "";
        form.whatYouWillLearn = value?.whatYouWillLearn || [];
        form.previewVideo = value?.previewVideoBunnyId ? "" : value?.previewVideo || "";
        form.previewVideoPlaybackUrl = value?.previewVideoBunnyId
          ? value?.previewVideo || ""
          : "";
        form.previewVideoBunnyId = value?.previewVideoBunnyId ?? null;
        form.previewVideoStatus = value?.previewVideoStatus ?? null;
        courseIntroVideoSource.value = value?.previewVideoBunnyId ? "bunny" : "youtube";
        for (let i = 0; i < form.whatYouWillLearn?.length; i++) {
          whatYouWillLearnArray.value.push(form.whatYouWillLearn[i]);
        }
        // whatYouWillLearnArray = value?.whatYouWillLearn
        // form.certificateInfo = value.certificateInfo;
        // certificateInfo
        form.type = value.type;
        form.price = value.price;
        form.currency = resolveCurrency(value.currency);
        form.useModulePricing = value.useModulePricing ?? false;
        form.level = value.level || "";
        form.language = value.language || "";
        form.thumbnailUrl = value.thumbnailUrl || "";
        const nextActive = value.active ?? false;
        if (!hasInitializedVisibility.value) {
          form.active = nextActive;
          hasInitializedVisibility.value = true;
        } else if (!hasUserAdjustedVisibility.value) {
          form.active = nextActive;
        }
        thumbnailState.error = "";
      } finally {
        syncingVisibilityFromCourse.value = false;
      }
      return;
    }
    syncingVisibilityFromCourse.value = false;
  },
  { immediate: true }
);

watch(
  () => moduleDialog.open,
  (isOpen) => {
    if (!isOpen) {
      resetModuleDialog();
    }
  }
);

watch(
  () => lessonDialog.open,
  (isOpen) => {
    if (!isOpen) {
      resetLessonDialog();
    }
  }
);

onMounted(async () => {
  if (!course.value || course.value.id !== courseId) {
    await store.fetchCourse(courseId);
  }
  void usageStore.loadSummary();
  void learningStore.loadTeacherAssignments(courseId);

  const pendingLessonId = learningStore.consumePendingAssignmentsDialog();
  if (pendingLessonId !== null) {
    const lesson = course.value?.modules
      .flatMap((module) => module.lessons.map((lessonItem) => ({ module, lesson: lessonItem })))
      .find((entry) => entry.lesson.id === pendingLessonId);
    if (lesson) {
      openAssignments(lesson.lesson);
    }
  }
});

const resetModuleDialog = () => {
  moduleDialog.mode = "create";
  moduleDialog.moduleId = null;
  moduleDialog.form.title = "";
  moduleDialog.form.position = Math.max(sortedModules.value.length + 1, 1);
  moduleDialog.form.priced = false;
  moduleDialog.form.price = 0;
  moduleDialog.form.priceCurrency = resolveCurrency();
  moduleDialogAttempt.value = false;
};

const resetLessonDialog = () => {
  lessonDialog.mode = "create";
  lessonDialog.moduleId = null;
  lessonDialog.lessonId = null;
  lessonDialog.form.title = "";
  lessonDialog.form.content = "";
  lessonDialog.form.ytId = "";
  lessonDialog.form.pdfUrl = "";
  lessonDialog.form.videoUrl = null;
  lessonDialog.form.videoStorageKey = null;
  lessonDialog.form.bunnyVideoId = null;
  lessonDialog.form.videoStatus = null;
  lessonDialog.form.duration = null;
  lessonDialog.form.position = 1;
  lessonDialogAttempt.value = false;
  resetLessonVideoState();
  resetLessonPdfState();
};


const openModuleDialog = (module?: ModulePayload) => {
  moduleDialogAttempt.value = false;
  if (module) {
    moduleDialog.mode = "edit";
    moduleDialog.moduleId = module.id;
    moduleDialog.form.title = module.title;
    moduleDialog.form.position = module.position;
    moduleDialog.form.priced = module.priced ?? false;
    moduleDialog.form.price = module.price ?? 0;
    moduleDialog.form.priceCurrency = resolveCurrency(module.priceCurrency);
  } else {
    moduleDialog.mode = "create";
    moduleDialog.moduleId = null;
    moduleDialog.form.title = "";
    moduleDialog.form.position = Math.max(sortedModules.value.length + 1, 1);
    moduleDialog.form.priced = false;
    moduleDialog.form.price = 0;
    moduleDialog.form.priceCurrency = resolveCurrency();
  }
  moduleDialog.open = true;
};

const closeModuleDialog = () => {
  moduleDialog.open = false;
};

const submitModule = async () => {
  moduleDialogAttempt.value = true;
  if (!moduleFormValid.value) {
    return;
  }
  const payload = {
    title: moduleDialog.form.title.trim(),
    position: sanitizedPosition(moduleDialog.form.position),
    priced: moduleDialog.form.priced,
    price: moduleDialog.form.price || 0,
    priceCurrency: moduleDialog.form.priceCurrency,
  };
  if (moduleDialog.mode === "create") {
    await store.addModule(courseId, payload);
    toast.success(t("courses.toast.moduleCreated"));
  } else if (moduleDialog.moduleId !== null) {
    await store.updateModule(courseId, moduleDialog.moduleId, payload);
    toast.success(t("courses.toast.moduleUpdated"));
  }
  moduleDialog.open = false;
};

const openLessonDialog = (module: ModulePayload, lesson?: LessonPayload) => {
  lessonDialogAttempt.value = false;
  resetLessonVideoState();
  resetLessonPdfState();
  lessonDialog.moduleId = module.id;
  if (lesson) {
    lessonDialog.mode = "edit";
    lessonDialog.lessonId = lesson.id;
    lessonDialog.form.title = lesson.title;
    lessonDialog.form.content = lesson.content || "";
    lessonDialog.form.ytId = formatYoutubeDisplay(lesson.ytId || "");
    lessonDialog.form.pdfUrl = lesson.pdfUrl || "";
    lessonDialog.form.videoUrl = lesson.videoUrl ?? null;
    lessonDialog.form.videoStorageKey = lesson.videoStorageKey ?? null;
    lessonDialog.form.bunnyVideoId = lesson.bunnyVideoId ?? null;
    lessonDialog.form.videoStatus = lesson.videoStatus ?? null;
    lessonDialog.form.duration = lesson.duration ?? null;
    lessonDialog.form.position = lesson.position;
  } else {
    lessonDialog.mode = "create";
    lessonDialog.lessonId = null;
    lessonDialog.form.title = "";
    lessonDialog.form.content = "";
    lessonDialog.form.ytId = "";
    lessonDialog.form.pdfUrl = "";
    lessonDialog.form.videoUrl = null;
    lessonDialog.form.videoStorageKey = null;
    lessonDialog.form.bunnyVideoId = null;
    lessonDialog.form.videoStatus = null;
    lessonDialog.form.duration = null;
    lessonDialog.form.position = module.lessons.length + 1;
  }
  lessonDialog.open = true;
};

const closeLessonDialog = () => {
  lessonDialog.open = false;
};

const onLessonVideoChange = async (files: File[]) => {
  if (!files.length || lessonVideoState.uploading) {
    return;
  }
  const [file] = files;
  if (!file) return;
  lessonVideoState.error = "";
  lessonVideoState.warning = "";
  lessonVideoState.progress = 0;
  if (file.size > LESSON_UPLOAD_MAX_SIZE_BYTES) {
    console.log("------1----------");
    lessonVideoState.error = formatUploadTooLargeMessage(
      "courses.lessonVideoTooLarge",
      LESSON_VIDEO_TOO_LARGE_FALLBACK,
      LESSON_UPLOAD_MAX_SIZE_MB
    );
    return;
  }
  const metadata = await extractVideoMetadata(file).catch(() => ({
    durationSeconds: null,
    width: null,
    height: null,
  }));
  if (
    metadata.durationSeconds &&
    metadata.durationSeconds > maxVideoDurationSeconds.value
  ) {
    const maxMinutes = Math.round(maxVideoDurationSeconds.value / 60);
    lessonVideoState.error = translateCourseString(
      "courses.lessonVideoTooLong",
      `The video exceeds the ${maxMinutes}-minute limit. Please upload a shorter video.`
    );
    return;
  }
  if (!lessonDialog.form.duration && metadata.durationSeconds) {
    lessonDialog.form.duration = metadata.durationSeconds;
  }
  lessonVideoState.uploading = true;
  try {
    const result = await performLessonVideoUpload(
      file,
      (progress) => {
        lessonVideoState.progress = progress;
      },
      metadata
    );
    lessonVideoState.warning = result.warning ?? "";
    if (lessonVideoState.warning) {
      toast.warning(lessonVideoState.warning);
    }
    const uploadedUrl = (result.videoUrl ?? result.url ?? "").trim();
    lessonDialog.form.videoUrl = uploadedUrl || null;
    lessonDialog.form.videoStorageKey = null;
    lessonDialog.form.bunnyVideoId = result.bunnyVideoId ?? null;
    lessonDialog.form.videoStatus =
      (result.status as LessonVideoStatus | undefined) ?? "PROCESSING";
    lessonVideoFiles.value = [];
    await store.fetchCourse(courseId).catch((error) => {
      console.warn(
        "[CourseEditor] Failed to refresh course after video upload",
        error
      );
    });
  } catch (error) {
    console.error("[CourseEditor] Failed to upload lesson video", error);
    lessonVideoState.error = buildUploadErrorMessage(error, {
      tooLargeKey: "courses.lessonVideoTooLarge",
      tooLargeFallback: LESSON_VIDEO_TOO_LARGE_FALLBACK,
      forbiddenMessage: lessonVideoTexts.value.forbidden,
      uploadFailedMessage: lessonVideoTexts.value.uploadFailed,
    });
    lessonVideoState.warning = "";
    lessonVideoState.progress = 0;
  } finally {
    lessonVideoState.uploading = false;
  }
};

const onCourseIntroVideoChange = async (files: File[]) => {
  if (!files.length || courseIntroVideoState.uploading) {
    return;
  }
  const [file] = files;
  if (!file) return;
  courseIntroVideoState.error = "";
  courseIntroVideoState.warning = "";
  courseIntroVideoState.progress = 0;
  if (file.size > LESSON_UPLOAD_MAX_SIZE_BYTES) {
    courseIntroVideoState.error = formatUploadTooLargeMessage(
      "courses.lessonVideoTooLarge",
      LESSON_VIDEO_TOO_LARGE_FALLBACK,
      LESSON_UPLOAD_MAX_SIZE_MB
    );
    return;
  }
  const metadata = await extractVideoMetadata(file).catch(() => ({
    durationSeconds: null,
    width: null,
    height: null,
  }));
  if (
    metadata.durationSeconds &&
    metadata.durationSeconds > maxVideoDurationSeconds.value
  ) {
    const maxMinutes = Math.round(maxVideoDurationSeconds.value / 60);
    courseIntroVideoState.error = translateCourseString(
      "courses.lessonVideoTooLong",
      `The video exceeds the ${maxMinutes}-minute limit. Please upload a shorter video.`
    );
    return;
  }
  courseIntroVideoState.uploading = true;
  try {
    const result = await performCourseIntroVideoUpload(
      file,
      (progress) => {
        courseIntroVideoState.progress = progress;
      },
      metadata
    );
    courseIntroVideoState.warning = result.warning ?? "";
    if (courseIntroVideoState.warning) {
      toast.warning(courseIntroVideoState.warning);
    }
    const uploadedUrl = (result.videoUrl ?? result.url ?? "").trim();
    form.previewVideo = "";
    form.previewVideoPlaybackUrl = uploadedUrl;
    form.previewVideoBunnyId = result.bunnyVideoId ?? null;
    form.previewVideoStatus =
      (result.status as LessonVideoStatus | undefined) ?? "PROCESSING";
    courseIntroVideoSource.value = "bunny";
  } catch (error) {
    console.error("[CourseEditor] Failed to upload course intro video", error);
    courseIntroVideoState.error = buildUploadErrorMessage(error, {
      tooLargeKey: "courses.lessonVideoTooLarge",
      tooLargeFallback: LESSON_VIDEO_TOO_LARGE_FALLBACK,
      forbiddenMessage: courseIntroVideoTexts.value.forbidden,
      uploadFailedMessage: courseIntroVideoTexts.value.uploadFailed,
    });
    courseIntroVideoState.warning = "";
    courseIntroVideoState.progress = 0;
  } finally {
    resetCourseIntroVideoState();
  }
};

const onLessonPdfChange = async (files: File[]) => {
  if (!files.length || lessonPdfState.uploading) {
    return;
  }
  const [file] = files;
  if (!file) return;
  lessonPdfState.error = "";
  lessonPdfState.progress = 0;
  if (file.size > LESSON_UPLOAD_MAX_SIZE_BYTES) {
    lessonPdfState.error = formatUploadTooLargeMessage(
      "courses.lessonPdfTooLarge",
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
    lessonDialog.form.pdfUrl = result.url;
    lessonPdfFiles.value = [];
    await store.fetchCourse(courseId).catch((error) => {
      console.warn(
        "[CourseEditor] Failed to refresh course after PDF upload",
        error
      );
    });
  } catch (error) {
    console.error("[CourseEditor] Failed to upload lesson PDF", error);
    lessonPdfState.error = buildUploadErrorMessage(error, {
      tooLargeKey: "courses.lessonPdfTooLarge",
      tooLargeFallback: LESSON_PDF_TOO_LARGE_FALLBACK,
      forbiddenMessage: lessonPdfTexts.value.forbidden,
      uploadFailedMessage: lessonPdfTexts.value.uploadFailed,
    });
    lessonPdfState.progress = 0;
  } finally {
    lessonPdfState.uploading = false;
  }
};

const clearLessonVideo = () => {
  lessonDialog.form.videoUrl = null;
  lessonDialog.form.videoStorageKey = null;
  lessonDialog.form.bunnyVideoId = null;
  lessonDialog.form.videoStatus = null;
  lessonVideoState.error = "";
  lessonVideoState.warning = "";
};

const clearCourseIntroVideo = () => {
  form.previewVideo = "";
  form.previewVideoPlaybackUrl = "";
  form.previewVideoBunnyId = null;
  form.previewVideoStatus = null;
  resetCourseIntroVideoState();
};

const clearLessonPdf = () => {
  lessonDialog.form.pdfUrl = "";
  resetLessonPdfState();
};

const lessonVideoPlaybackUrl = (url?: string | null) =>
  buildAuthenticatedMediaUrl(url);

const openLessonVideo = () => {
  if (!lessonDialog.form.videoUrl) {
    return;
  }
  const playbackUrl = lessonVideoPlaybackUrl(lessonDialog.form.videoUrl);
  if (!playbackUrl) {
    return;
  }
  if (typeof window !== "undefined") {
    window.open(playbackUrl, "_blank", "noopener");
  }
};

const openCourseIntroVideo = () => {
  const target =
    courseIntroVideoSource.value === "youtube"
      ? form.previewVideo.trim()
      : form.previewVideoPlaybackUrl.trim();
  if (!target) {
    return;
  }
  const playbackUrl =
    courseIntroVideoSource.value === "youtube"
      ? target
      : buildAuthenticatedMediaUrl(target);
  if (!playbackUrl) {
    return;
  }
  if (typeof window !== "undefined") {
    window.open(playbackUrl, "_blank", "noopener");
  }
};

const openLessonPdf = () => {
  if (!lessonDialog.form.pdfUrl) {
    return;
  }
  const pdfUrl = buildAuthenticatedMediaUrl(lessonDialog.form.pdfUrl);
  if (!pdfUrl) {
    return;
  }
  if (typeof window !== "undefined") {
    window.open(pdfUrl, "_blank", "noopener");
  }
};

const submitLesson = async () => {
  lessonDialogAttempt.value = true;
  if (!lessonFormValid.value || lessonDialog.moduleId === null) {
    return;
  }
  const youtubeId = extractYoutubeId(lessonDialog.form.ytId);

  const payload = {
    title: lessonDialog.form.title.trim(),
    content: lessonDialog.form.content.trim() || undefined,
    ytId: youtubeId || undefined,
    pdfUrl: lessonDialog.form.pdfUrl.trim() || undefined,
    videoUrl: lessonDialog.form.videoUrl,
    videoStorageKey: lessonDialog.form.videoStorageKey,
    bunnyVideoId: lessonDialog.form.bunnyVideoId || undefined,
    position: sanitizedPosition(lessonDialog.form.position),
  };
  if (lessonDialog.mode === "create") {
    await store.addLesson(courseId, lessonDialog.moduleId, payload);
    toast.success(t("courses.toast.lessonCreated"));
  } else if (lessonDialog.lessonId !== null) {
    await store.updateLesson(
      courseId,
      lessonDialog.moduleId,
      lessonDialog.lessonId,
      payload
    );
    toast.success(t("courses.toast.lessonUpdated"));
  }
  lessonDialog.open = false;
};

const confirmDeleteModule = async (module: ModulePayload) => {
  if (confirm(t("courses.deleteModuleConfirm", { title: module.title }))) {
    await store.removeModule(courseId, module.id);
  }
};

const confirmDeleteLesson = async (
  module: ModulePayload,
  lesson: LessonPayload
) => {
  if (confirm(t("courses.deleteLessonConfirm", { title: lesson.title }))) {
    await store.removeLesson(courseId, module.id, lesson.id);
  }
};

const goToLessonCreate = (module: ModulePayload) => {
  router.push({
    name: "teacher-lesson-create",
    params: { courseId, moduleId: module.id },
  });
};

const goToLessonEdit = (module: ModulePayload, lesson: LessonPayload) => {
  router.push({
    name: "teacher-lesson-edit",
    params: { courseId, moduleId: module.id, lessonId: lesson.id },
  });
};

const formatDuration = (duration?: number | null) => {
  if (!duration || duration <= 0) {
    return t("courses.durationNotSet");
  }
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  if (minutes > 0 && seconds > 0) {
    return t("courses.durationMinutesSeconds", { minutes, seconds });
  }
  if (minutes > 0) {
    return t("courses.durationMinutes", { minutes });
  }
  return t("courses.durationSeconds", { seconds: duration });
};

const youtubeEmbed = (value?: string | null) => {
  if (!value) return "";
  const patterns = [
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/(?:watch\?v=|embed\/|shorts\/)([\w-]{11})/i,
  ];
  let videoId = value.trim();
  for (const pattern of patterns) {
    const match = videoId.match(pattern);
    if (match && match[1]) {
      videoId = match[1];
      break;
    }
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
};

const saveInfo = async (successToastKey?: string) => {
  const seen = new Set();
  const unique = whatYouWillLearnArray?.value.filter((item) => {
    if (seen.has(item.learnText)) return false;
    seen.add(item.learnText);
    return true;
  });
  const description = form.description?.trim();
  const thumbnail = form.thumbnailUrl.trim();
  const previewVideo =
    courseIntroVideoSource.value === "youtube"
      ? formatYoutubeDisplay(form.previewVideo).trim() || null
      : null;
  const previewVideoBunnyId =
    courseIntroVideoSource.value === "bunny"
      ? form.previewVideoBunnyId || null
      : null;
  await store.updateCourse(courseId, {
    title: form.title,
    description: description && description.length ? description : undefined,
    type: form.type,
    price: form.price,
    currency: form.currency,
    useModulePricing: form.useModulePricing,
    thumbnailUrl: thumbnail ? thumbnail : null,
    level: form.level || null,
    language: form.language || null,
    active: form.active,
    // courseOverview: form.courseOverview,
    instructor: form.instructor,
    faq: form.faq,
    certificateInfo: form.certificateInfo,
    duration: form.duration,
    targetAudience: form.targetAudience,
    previewVideo,
    previewVideoBunnyId,
    whatYouWillLearn: unique,
    courseRequirements: form?.courseRequirements,
    // refundPolicy: form.refundPolicy,
    // curriculum: form.curriculum,
  });
  hasUserAdjustedVisibility.value = false;
  isDirty.value = false;
  const toastKey =
    successToastKey ??
    (form.active
      ? "courses.toast.courseSaved"
      : "courses.toast.courseSavedHidden");
  toast.success(t(toastKey));
};

// Top action bar handlers. Publish/Draft set visibility then reuse saveInfo with
// an action-specific success toast; isSaving guards re-entrancy and disables the
// bar (the dirty watch also ignores the programmatic form.active change while it
// is true).
const setActiveAndSave = async (
  active: boolean,
  action: "publish" | "draft",
) => {
  if (isSaving.value) return;
  isSaving.value = true;
  savingAction.value = action;
  form.active = active;
  try {
    await saveInfo(
      action === "publish"
        ? "courses.toast.coursePublished"
        : "courses.toast.draftSaved",
    );
  } finally {
    isSaving.value = false;
    savingAction.value = null;
  }
};

const handleCancel = () => {
  if (isDirty.value && !window.confirm(t("courses.cancelConfirmUnsaved"))) {
    return;
  }
  const listRoute = route.path.startsWith("/assistant/")
    ? "assistant-courses"
    : "teacher-courses";
  router.push({ name: listRoute });
};
</script>
