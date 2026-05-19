<template>
  <ThemePage :title="t('learning.student.nav')">
    <template #meta>
      <div class="learning-page__meta">
        <div class="learning-page__filters">
          <UiSelect
            class="learning-page__course"
            :model-value="selectedCourseId ?? ''"
            :label="t('learning.student.courseFilter')"
            @update:model-value="(val) => onSelectCourse(String(val || ''))"
          >
            <option value="">{{ t("learning.student.courseFilter") }}</option>
            <option
              v-for="course in courseOptions"
              :key="course.id"
              :value="course.id"
            >
              {{ course.title
              }}{{ course.accessible || course.useModulePricing ? "" : " 🔒" }}
            </option>
          </UiSelect>
          <UiTabs
            class="learning-page__tabs"
            :tabs="tabItems"
            :model-value="tab"
            variant="pill"
            grow
            @update:model-value="onTabChange"
          />
        </div>
        <div v-if="focusControlsVisible" class="learning-page__toggles">
          <UiSwitch
            class="learning-page__focus-toggle"
            :model-value="focusMode"
            :label="t('learning.student.focusMode')"
            @update:model-value="setFocusMode"
          />
          <p class="learning-page__focus-hint">
            {{ t("learning.student.focusModeHelper") }}
          </p>
        </div>
      </div>
    </template>

    <UiToast
      :visible="snackbar.show"
      :type="snackbar.tone"
      :message="snackbar.message"
      @close="snackbar.show = false"
    />

    <section v-if="tab === 'content'" class="learning-content">
      <UiCard :title="t('learning.student.contentTitle')">
        <UiAlert v-if="!selectedCourseId" color="info">
          {{ t("learning.student.selectCoursePrompt") }}
        </UiAlert>
        <UiAlert v-else-if="!courseContentModules.length" color="info">
          {{ t("learning.student.noContent") }}
        </UiAlert>
        <div
          v-else
          class="learning-content__layout"
          :class="{ 'learning-content__layout--focus': isFocusModeActive }"
        >
          <div
            v-if="isFocusModeActive && focusOutlineVisible"
            class="learning-content__outline-backdrop"
            @click="closeFocusOutline"
          ></div>
          <aside
            class="learning-content__outline"
            :class="{
              'learning-content__outline--hidden':
                isFocusModeActive && !focusOutlineVisible,
              'learning-content__outline--floating':
                isFocusModeActive && focusOutlineVisible,
            }"
          >
            <div
              v-if="isFocusModeActive"
              class="learning-content__outline-actions"
            >
              <UiButton
                variant="link"
                color="secondary"
                prepend-icon="CloseOutlined"
                @click="closeFocusOutline"
              >
                {{ t("learning.student.focusHideOutline") }}
              </UiButton>
            </div>
            <UiAccordion
              class="learning-content__accordion"
              :items="contentAccordionItems"
              multiple
            >
              <template #header="{ item }">
                <div
                  class="learning-content__module-header"
                  @click.capture="onModuleHeaderClick(item.module, $event)"
                >
                  <div class="learning-content__module-info">
                    <h3>
                      {{ item.module.title
                      }}<span v-if="item.module.accessible === false"> 🔒</span>
                    </h3>
                    <p>
                      {{
                        t("courses.lessonsCount", {
                          count: item.module.lessons.length,
                        })
                      }}
                    </p>
                  </div>
                  <UiTag size="sm" color="secondary">
                    {{
                      t("courses.modulePositionLabel", {
                        position: item.module.position,
                      })
                    }}
                  </UiTag>
                </div>
              </template>
              <template #content="{ item }">
                <ul
                  v-if="item.module.lessons.length"
                  class="learning-content__lessons"
                >
                  <li
                    v-for="lesson in item.module.lessons"
                    :key="lesson.id"
                    :class="[
                      'learning-content__lesson',
                      {
                        'learning-content__lesson--active':
                          lesson.id === selectedLessonId,
                      },
                    ]"
                  >
                    <button
                      type="button"
                      class="learning-content__lesson-button"
                      @click="onSelectLesson(lesson.id)"
                    >
                      <div class="learning-content__lesson-info">
                        <span class="learning-content__lesson-title">{{
                          lesson.title
                        }}</span>
                        <span
                          v-if="lesson.duration"
                          class="learning-content__lesson-meta"
                        >
                          {{ formatLessonDuration(lesson.duration) }}
                        </span>
                      </div>
                      <UiTag
                        size="sm"
                        class="learning-content__lesson-status"
                        :color="
                          statusColors[lesson.status as LessonProgressStatus] ||
                          'neutral'
                        "
                      >
                        {{
                          progressStatusLabels[
                            lesson.status as LessonProgressStatus
                          ] || lesson.status
                        }}
                      </UiTag>
                    </button>
                  </li>
                </ul>
                <UiAlert v-else color="info" variant="soft">
                  {{ t("courses.noLessons") }}
                </UiAlert>
              </template>
            </UiAccordion>
          </aside>
          <div class="learning-content__viewer">
            <template v-if="activeLesson">
              <header class="learning-content__viewer-header">
                <div class="learning-content__viewer-titles">
                  <p
                    class="learning-content__viewer-module"
                    v-if="activeLessonModule"
                  >
                    {{ activeLessonModule.title }}
                  </p>
                  <h3 class="learning-content__viewer-title">
                    {{ activeLesson.title }}
                  </h3>
                </div>
                <div class="learning-content__viewer-actions">
                  <div class="learning-content__viewer-navigation">
                    <UiButton
                      class="learning-content__viewer-action"
                      variant="outline"
                      color="secondary"
                      prepend-icon="ArrowLeftOutlined"
                      :disabled="
                        !activeLesson || !previousLesson || formSubmitting
                      "
                      @click="goToAdjacentLesson('previous')"
                    >
                      {{ t("learning.student.previousLesson") }}
                    </UiButton>
                    <UiButton
                      class="learning-content__viewer-action"
                      variant="outline"
                      color="secondary"
                      append-icon="ArrowRightOutlined"
                      :disabled="!activeLesson || !nextLesson || formSubmitting"
                      @click="goToAdjacentLesson('next')"
                    >
                      {{ t("learning.student.nextLesson") }}
                    </UiButton>
                  </div>
                  <UiButton
                    v-if="isFocusModeActive"
                    class="learning-content__outline-toggle"
                    variant="outline"
                    color="secondary"
                    :prepend-icon="
                      focusOutlineVisible
                        ? 'MenuFoldOutlined'
                        : 'MenuUnfoldOutlined'
                    "
                    @click="toggleFocusOutline"
                  >
                    {{
                      focusOutlineVisible
                        ? t("learning.student.focusHideOutline")
                        : t("learning.student.focusShowOutline")
                    }}
                  </UiButton>
                  <UiTag
                    size="sm"
                    class="learning-content__viewer-status"
                    :color="statusColors[activeLesson.status]"
                  >
                    {{
                      progressStatusLabels[activeLesson.status] ||
                      activeLesson.status
                    }}
                  </UiTag>
                </div>
              </header>
              <div class="learning-content__viewer-controls">
                <div
                  v-if="moduleProgress"
                  class="learning-content__module-progress"
                >
                  <UiProgressBar
                    class="learning-content__module-progress-bar"
                    :value="moduleProgress.percent"
                    color="info"
                    :show-value="false"
                  >
                    <div class="learning-content__module-progress-text">
                      <span>{{
                        t("learning.student.moduleProgressLabel")
                      }}</span>
                      <span>
                        {{
                          t("learning.student.moduleProgressValue", {
                            completed: moduleProgress.completed,
                            total: moduleProgress.total,
                          })
                        }}
                      </span>
                    </div>
                  </UiProgressBar>
                </div>
                <div class="learning-content__viewer-actions-group">
                  <UiButton
                    class="learning-content__viewer-action"
                    variant="outline"
                    color="primary"
                    prepend-icon="PlayCircleOutlined"
                    :disabled="
                      !activeLesson ||
                      progressUpdating ||
                      activeLessonProgressStatus === 'in_progress'
                    "
                    @click="onQuickProgressUpdate('in_progress')"
                  >
                    {{ t("learning.student.markInProgress") }}
                  </UiButton>
                  <UiButton
                    class="learning-content__viewer-action"
                    color="success"
                    prepend-icon="CheckCircleOutlined"
                    :disabled="
                      !activeLesson ||
                      progressUpdating ||
                      activeLessonProgressStatus === 'completed'
                    "
                    @click="onQuickProgressUpdate('completed')"
                  >
                    {{ t("learning.student.markComplete") }}
                  </UiButton>
                  <UiButton
                    class="learning-content__viewer-action learning-content__viewer-action--reset"
                    variant="link"
                    color="secondary"
                    :disabled="
                      !activeLesson ||
                      progressUpdating ||
                      activeLessonProgressStatus === 'not_started'
                    "
                    @click="onQuickProgressUpdate('not_started')"
                  >
                    {{ t("learning.student.resetProgress") }}
                  </UiButton>
                </div>
              </div>
              <div class="learning-content__viewer-body">
                <section
                  v-if="hasActiveLessonVideo"
                  class="learning-content__viewer-section"
                >
                  <h4>{{ t("learning.student.lessonVideoTitle") }}</h4>
                  <UiAlert
                    v-if="effectiveStreamingBlocked"
                    color="warning"
                    variant="soft"
                  >
                    {{ t("learning.student.streamingBlocked") }}
                  </UiAlert>
                  <div class="learning-content__video">
                    <MediaVideoPlayer
                      v-if="
                        canRenderLessonVideoPlayer && activeLessonVideoStreamUrl
                      "
                      ref="lessonVideoRef"
                      class="learning-content__video-player"
                      :src="lessonVideoElementSrc"
                      controls
                      controlslist="nodownload noplaybackrate noremoteplayback"
                      disablepictureinpicture
                      crossorigin="anonymous"
                      @contextmenu.prevent
                      preload="metadata"
                      playsinline
                    />
                    <iframe
                      v-else-if="
                        canRenderLessonVideoPlayer && activeLessonVideoEmbedUrl
                      "
                      :src="activeLessonVideoEmbedUrl"
                      title="Lesson video"
                      loading="lazy"
                      frameborder="0"
                      allow="
                        accelerometer;
                        autoplay;
                        clipboard-write;
                        encrypted-media;
                        gyroscope;
                        picture-in-picture;
                      "
                      allowfullscreen
                    />
                  </div>
                </section>
                <section
                  v-if="hasActiveLessonPdf"
                  class="learning-content__viewer-section"
                >
                  <h4>{{ t("learning.student.lessonResourcesTitle") }}</h4>
                  <UiButton
                    variant="link"
                    color="primary"
                    prepend-icon="ExportOutlined"
                    :href="activeLessonPdfUrl ?? undefined"
                    target="_blank"
                    rel="noopener"
                  >
                    {{ t("learning.student.lessonAttachmentButton") }}
                  </UiButton>
                </section>
                <UiAlert
                  v-if="!hasActiveLessonVideo && !hasActiveLessonPdf"
                  color="info"
                  variant="soft"
                >
                  {{ t("learning.student.lessonContentEmpty") }}
                </UiAlert>
                <section
                  class="learning-content__viewer-section learning-content__notes"
                >
                  <div class="learning-content__notes-header">
                    <h4>{{ t("learning.student.lessonNotesTitle") }}</h4>
                    <UiButton
                      variant="link"
                      color="secondary"
                      :disabled="!hasLessonNotes"
                      @click="clearActiveLessonNotes"
                    >
                      {{ t("learning.student.lessonNotesClear") }}
                    </UiButton>
                  </div>
                  <UiTextarea
                    v-model="lessonNotesDraft"
                    :rows="5"
                    :placeholder="t('learning.student.lessonNotesPlaceholder')"
                  />
                  <p class="learning-content__notes-helper">
                    {{ t("learning.student.lessonNotesHelper") }}
                  </p>
                </section>
                <section
                  v-if="aiStudentEnabled"
                  class="learning-content__viewer-section learning-content__ai"
                >
                  <StudentLessonAiPanel
                    :lesson-title="activeLesson?.title || ''"
                    :initial-source="lessonNotesDraft"
                  />
                </section>
              </div>
            </template>
            <UiAlert v-else color="info" variant="soft">
              {{ t("learning.student.lessonPlaceholder") }}
            </UiAlert>
          </div>
        </div>
      </UiCard>
    </section>

    <section v-else-if="tab === 'progress'" class="learning-progress">
      <UiCard
        class="learning-progress__summary"
        :title="t('learning.student.progressSummary')"
      >
        <div v-if="learning.courseProgress" class="learning-progress__overview">
          <div
            class="learning-progress__circle"
            :style="{
              '--progress-value': `${Math.round(learning.courseProgress.progressPercent ?? 0)}%`,
            }"
          >
            <span
              >{{
                Math.round(learning.courseProgress.progressPercent ?? 0)
              }}%</span
            >
          </div>
          <div class="learning-progress__details">
            <h3 class="learning-progress__course">
              {{ learning.courseProgress.courseTitle }}
            </h3>
            <p class="learning-progress__meta">
              {{
                t("learning.student.lessonsCompleted", {
                  completed: learning.courseProgress.completedLessons,
                  total: learning.courseProgress.totalLessons,
                })
              }}
            </p>
          </div>
        </div>
        <UiAlert v-else color="info">
          {{ t("learning.student.selectCoursePrompt") }}
        </UiAlert>
      </UiCard>

      <UiCard
        class="learning-progress__recommendations"
        :title="t('learning.student.recommendationsTitle')"
      >
        <UiAlert v-if="!recommendations.length" color="info">
          {{ t("learning.student.recommendationsEmpty") }}
        </UiAlert>
        <ul v-else class="learning-progress__recommendations-list">
          <li
            v-for="item in recommendations"
            :key="item.lessonId"
            class="learning-progress__recommendations-item"
          >
            <div class="learning-progress__recommendations-header">
              <h3>{{ item.lessonTitle }}</h3>
              <UiTag size="sm" :color="statusColors[item.status]">{{
                item.statusLabel
              }}</UiTag>
            </div>
            <p
              v-if="item.moduleTitle"
              class="learning-progress__recommendations-module"
            >
              {{
                t("learning.student.recommendationModule", {
                  module: item.moduleTitle,
                })
              }}
            </p>
            <p
              v-if="item.updatedAt"
              class="learning-progress__recommendations-meta"
            >
              {{
                t("learning.student.recommendationUpdated", {
                  date: formatDateTime(item.updatedAt),
                })
              }}
            </p>
            <UiButton
              variant="link"
              color="primary"
              prepend-icon="PlayCircleOutlined"
              @click="
                goToLessonFromRecommendation(item.lessonId, item.courseId)
              "
            >
              {{ t("learning.student.recommendationAction") }}
            </UiButton>
          </li>
        </ul>
      </UiCard>

      <UiCard
        class="learning-progress__table-card"
        :title="t('learning.student.lessonProgress')"
      >
        <div
          v-if="courseProgressItems.length"
          class="learning-progress__filters"
        >
          <UiInput
            v-model="progressSearch"
            class="learning-progress__search"
            :label="t('learning.student.progressSearchLabel')"
            :placeholder="t('learning.student.progressSearchPlaceholder')"
            clearable
          />
          <UiSelect
            v-model="progressStatusFilter"
            class="learning-progress__status-filter"
            :label="t('learning.student.progressStatusFilterLabel')"
          >
            <option value="all">
              {{ t("learning.student.progressStatusAll") }}
            </option>
            <option
              v-for="status in progressStatuses"
              :key="status.value"
              :value="status.value"
            >
              {{ status.label }}
            </option>
          </UiSelect>
        </div>
        <UiAlert v-if="!filteredProgress.length" color="info">
          {{ t("learning.student.noProgress") }}
        </UiAlert>
        <template v-else>
          <UiTable
            class="learning-progress__table"
            :headers="progressHeaders"
            :items="filteredProgress"
            density="comfortable"
          >
            <template #item.status="{ item }">
              <UiSelect
                class="learning-progress__status"
                :model-value="progressSelections[item.lessonId]"
                :disabled="progressUpdating"
                @update:model-value="
                  (value) =>
                    onProgressStatusChange(item.lessonId, value as string)
                "
              >
                <option
                  v-for="status in progressStatuses"
                  :key="status.value"
                  :value="status.value"
                >
                  {{ status.label }}
                </option>
              </UiSelect>
            </template>
            <template #item.updatedAt="{ item }">
              <span v-if="item.updatedAt">{{
                formatDateTime(item.updatedAt)
              }}</span>
              <span v-else>—</span>
            </template>
          </UiTable>
          <div class="learning-progress__list" role="list">
            <article
              v-for="item in filteredProgress"
              :key="item.lessonId"
              class="learning-progress__list-item"
              role="listitem"
            >
              <header class="learning-progress__list-header">
                <h3>{{ item.lessonTitle }}</h3>
                <span v-if="item.updatedAt">{{
                  formatDateTime(item.updatedAt)
                }}</span>
              </header>
              <div class="learning-progress__list-field">
                <label>{{ t("learning.student.progressStatusHeader") }}</label>
                <UiSelect
                  :model-value="progressSelections[item.lessonId]"
                  :disabled="progressUpdating"
                  @update:model-value="
                    (value) =>
                      onProgressStatusChange(item.lessonId, value as string)
                  "
                >
                  <option
                    v-for="status in progressStatuses"
                    :key="status.value"
                    :value="status.value"
                  >
                    {{ status.label }}
                  </option>
                </UiSelect>
              </div>
            </article>
          </div>
        </template>
      </UiCard>
    </section>

    <section v-else-if="tab === 'assignments'" class="learning-assignments">
      <UiCard :title="t('learning.student.assignmentList')">
        <div
          v-if="courseAssignments.length"
          class="learning-assignments__filters"
        >
          <UiInput
            v-model="assignmentSearch"
            class="learning-assignments__search"
            :label="t('learning.student.assignmentSearchLabel')"
            :placeholder="t('learning.student.assignmentSearchPlaceholder')"
            clearable
          />
          <UiSelect
            v-model="assignmentDueFilter"
            class="learning-assignments__due-filter"
            :label="t('learning.student.assignmentDueFilterLabel')"
          >
            <option value="all">
              {{ t("learning.student.assignmentDueFilterAll") }}
            </option>
            <option value="upcoming">
              {{ t("learning.student.assignmentDueFilterUpcoming") }}
            </option>
            <option value="past_due">
              {{ t("learning.student.assignmentDueFilterPast") }}
            </option>
            <option value="no_due">
              {{ t("learning.student.assignmentDueFilterNoDue") }}
            </option>
          </UiSelect>
        </div>
        <UiAlert v-if="!filteredAssignments.length" color="info">
          {{ t("learning.student.noAssignments") }}
        </UiAlert>
        <template v-else>
          <UiTable
            class="learning-assignments__table"
            :headers="assignmentHeaders"
            :items="filteredAssignments"
            density="comfortable"
          >
            <template #item.courseTitle="{ item }">
              <span>{{ item.courseTitle }}</span>
            </template>
            <template #item.lessonTitle="{ item }">
              <span>{{ item.lessonTitle }}</span>
            </template>
            <template #item.dueAt="{ item }">
              <span v-if="item.dueAt">{{ formatDateTime(item.dueAt) }}</span>
              <span v-else>—</span>
            </template>
            <template #item.maxScore="{ item }">
              <span v-if="item.maxScore != null">{{ item.maxScore }}</span>
              <span v-else>—</span>
            </template>
            <template #item.attachmentUrl="{ item }">
              <a
                v-if="item.attachmentUrl"
                :href="item.attachmentUrl"
                class="learning-assignments__attachment-link"
                target="_blank"
                rel="noopener"
              >
                {{ t("learning.student.assignmentAttachmentLink") }}
              </a>
              <span v-else>—</span>
            </template>
            <template #item.createdAt="{ item }">
              <span>{{ formatDateTime(item.createdAt) }}</span>
            </template>
            <template #item.actions="{ item }">
              <UiButton
                variant="link"
                color="primary"
                prepend-icon="UploadOutlined"
                @click="openSubmissionDialog(item)"
              >
                {{ t("learning.student.submitWork") }}
              </UiButton>
            </template>
          </UiTable>
          <div class="learning-assignments__list" role="list">
            <article
              v-for="assignment in filteredAssignments"
              :key="assignment.id"
              class="learning-assignments__list-item"
              role="listitem"
            >
              <header class="learning-assignments__list-header">
                <h3>{{ assignment.title }}</h3>
                <span v-if="assignment.dueAt">{{
                  formatDateTime(assignment.dueAt)
                }}</span>
              </header>
              <p
                v-if="assignment.description"
                class="learning-assignments__list-description"
              >
                {{ assignment.description }}
              </p>
              <dl class="learning-assignments__details">
                <div class="learning-assignments__detail">
                  <dt>{{ t("learning.student.assignmentCourse") }}</dt>
                  <dd>{{ assignment.courseTitle }}</dd>
                </div>
                <div class="learning-assignments__detail">
                  <dt>{{ t("learning.student.assignmentLesson") }}</dt>
                  <dd>{{ assignment.lessonTitle }}</dd>
                </div>
                <div class="learning-assignments__detail">
                  <dt>{{ t("learning.student.assignmentMaxScore") }}</dt>
                  <dd>
                    <span v-if="assignment.maxScore != null">{{
                      assignment.maxScore
                    }}</span>
                    <span v-else>—</span>
                  </dd>
                </div>
                <div class="learning-assignments__detail">
                  <dt>{{ t("learning.student.assignmentAssigned") }}</dt>
                  <dd>{{ formatDateTime(assignment.createdAt) }}</dd>
                </div>
                <div class="learning-assignments__detail">
                  <dt>{{ t("learning.student.assignmentAttachment") }}</dt>
                  <dd>
                    <a
                      v-if="assignment.attachmentUrl"
                      :href="assignment.attachmentUrl"
                      target="_blank"
                      rel="noopener"
                    >
                      {{ t("learning.student.assignmentAttachmentLink") }}
                    </a>
                    <span v-else>—</span>
                  </dd>
                </div>
              </dl>
              <UiButton
                class="learning-assignments__list-action"
                color="primary"
                prepend-icon="UploadOutlined"
                @click="openSubmissionDialog(assignment)"
              >
                {{ t("learning.student.submitWork") }}
              </UiButton>
            </article>
          </div>
        </template>
      </UiCard>
    </section>

    <section v-else-if="tab === 'discussions'" class="learning-discussions">
      <UiAlert v-if="!discussionsEnabled" color="info">
        {{ t("discussions.flags.disabled") }}
      </UiAlert>
      <UiAlert v-else-if="!selectedCourseId" color="info">
        {{ t("discussions.threads.pickCourse") }}
      </UiAlert>
      <div v-else class="learning-discussions__grid">
        <ThreadsList
          ref="threadsListRef"
          class="learning-discussions__threads"
          v-model="selectedThreadId"
          :course-id="selectedCourseId"
          :lesson-options="lessonOptions"
          @select="onSelectDiscussionThread"
          @created="onThreadCreated"
        />
        <ThreadView
          class="learning-discussions__messages"
          :thread="activeDiscussionThread"
          :disabled="formSubmitting"
          @message-sent="onMessageSent"
        />
      </div>
    </section>

    <section v-else-if="tab === 'reviews'" class="learning-reviews">
      <UiAlert v-if="!reviewsEnabled" color="info">
        {{ t("reviews.flags.disabled") }}
      </UiAlert>
      <UiAlert v-else-if="!selectedCourseId" color="info">
        {{ t("reviews.shared.selectCourse") }}
      </UiAlert>
      <div v-else class="learning-reviews__grid">
        <CourseReviewForm
          class="learning-reviews__form"
          :course-id="selectedCourseId"
          @submitted="onReviewSubmitted"
          @error="onReviewError"
        />
        <CourseReviewsList
          class="learning-reviews__list"
          :course-id="selectedCourseId"
          :refresh-key="reviewsRefreshKey"
          @error="onReviewsError"
        />
      </div>
    </section>

    <section v-else class="learning-resources">
      <UiCard :title="t('learning.student.resourcesTitle')">
        <div v-if="courseResources.length" class="learning-resources__filters">
          <UiInput
            v-model="resourceSearch"
            class="learning-resources__search"
            :label="t('learning.student.resourcesSearchLabel')"
            :placeholder="t('learning.student.resourcesSearchPlaceholder')"
            clearable
          />
          <UiSelect
            v-model="resourceTypeFilter"
            class="learning-resources__type-filter"
            :label="t('learning.student.resourcesTypeFilterLabel')"
          >
            <option value="all">
              {{ t("learning.student.resourcesTypeAll") }}
            </option>
            <option
              v-for="type in resourceTypeOptions"
              :key="type"
              :value="type"
            >
              {{ t(`learning.resourceType.${type}`) || type }}
            </option>
          </UiSelect>
        </div>
        <UiAlert v-if="!filteredResources.length" color="info">
          {{ t("learning.student.noResources") }}
        </UiAlert>
        <ul v-else class="learning-resources__list">
          <li
            v-for="resource in filteredResources"
            :key="resource.id"
            class="learning-resources__item"
          >
            <div class="learning-resources__details">
              <h3>{{ resource.title }}</h3>
              <p>{{ resource.lessonTitle || resource.courseTitle }}</p>
              <span>{{
                t(`learning.resourceType.${resource.resourceType}`)
              }}</span>
            </div>
            <UiButton
              v-if="resource.resourceType === 'embed'"
              variant="link"
              color="primary"
              append-icon="PlayCircleOutlined"
              button-type="button"
              @click.prevent="openEmbeddedResource(resource)"
            >
              {{ t("learning.student.openEmbedded") }}
            </UiButton>
            <UiButton
              v-else
              variant="link"
              color="primary"
              append-icon="ExportOutlined"
              :href="resource.url"
              target="_blank"
              rel="noopener"
            >
              {{ t("common.preview") }}
            </UiButton>
          </li>
        </ul>
      </UiCard>
    </section>

    <UiDialog
      v-model="embeddedResourceDialog"
      :title="
        activeEmbeddedResource?.title ||
        t('learning.student.embeddedDialogTitle')
      "
      width="960px"
      @close="closeEmbeddedResource"
    >
      <template v-if="activeEmbeddedResource">
        <p class="learning-embed__hint">
          {{ t("learning.student.embeddedDialogHint") }}
        </p>
        <div class="learning-embed__frame-wrapper">
          <iframe
            class="learning-embed__frame"
            :src="activeEmbeddedResource.url"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>
      </template>
    </UiDialog>

    <UiDialog
      v-model="submissionDialog"
      :title="selectedAssignment?.title || t('learning.student.assignmentList')"
      width="480px"
    >
      <template v-if="selectedAssignment">
        <form class="learning-dialog__form" @submit.prevent="submitAssignment">
          <UiInput
            v-model="submissionForm.fileUrl"
            :label="t('learning.student.submissionUrl')"
          />
          <UiInput
            v-model="submissionForm.fileKey"
            :label="t('learning.student.submissionKey')"
          />
          <UiTextarea
            v-model="submissionForm.notes"
            :label="t('learning.student.submissionNotes')"
            :rows="4"
          />
          <div class="learning-dialog__actions">
            <UiButton
              variant="link"
              color="secondary"
              @click.prevent="closeSubmissionDialog"
            >
              {{ t("common.cancel") }}
            </UiButton>
            <UiButton
              button-type="submit"
              color="primary"
              :disabled="formSubmitting"
            >
              {{ t("learning.student.submitAction") }}
            </UiButton>
          </div>
        </form>
      </template>
    </UiDialog>

    <section class="learning-certificates">
      <UiCard :title="t('certificates.student.title')">
        <div class="learning-certificates__body">
          <div v-if="!certificateItems.length" class="empty-state">
            <UiIcon
              name="SafetyCertificateOutlined"
              :size="32"
              class="text-content-muted"
            />
            <p>{{ t("certificates.student.empty") }}</p>
          </div>
          <div v-else class="learning-certificates__list">
            <div
              v-for="certificate in certificateItems"
              :key="certificate.id"
              class="learning-certificates__item"
            >
              <div class="learning-certificates__info">
                <span class="learning-certificates__title">{{
                  certificate.courseTitle
                }}</span>
                <small class="learning-certificates__date">{{
                  formatCertificateDate(certificate.issuedAt)
                }}</small>
              </div>
              <UiButton
                size="xs"
                variant="outline"
                color="primary"
                :href="certificate.downloadUrl"
                target="_blank"
                rel="noopener"
              >
                {{ t("certificates.student.download") }}
              </UiButton>
            </div>
            <UiButton
              variant="link"
              color="secondary"
              size="sm"
              class="learning-certificates__view"
              @click="router.push({ name: 'student-achievements' })"
            >
              {{ t("certificates.student.viewAll") }}
            </UiButton>
          </div>
        </div>
      </UiCard>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { FEATURE } from "@/constants/featureCatalog";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onActivated,
  reactive,
  ref,
  toRaw,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "@/services/api";
import { useLearningStore } from "@/stores/learning";
import { useStudentStore } from "@/stores/student";
import { useAchievementsStore } from "@/stores/achievements";
import { useTenantStore } from "@/stores/tenant";
import { useFeaturesStore } from "@/stores/features";
import { useAuthStore } from "@/stores/auth";
import { getStoredTenantSlug } from "@/utils/tenantStorage";
import { buildAuthenticatedMediaUrl } from "@/utils/media";
import { getHttpStatus } from "@/utils/httpError";
import { useVisibilityRefresh } from "@/composables/useVisibilityRefresh";
import { withCacheBusting } from "@/utils/cacheBusting";
import type {
  Assignment,
  CourseContentLesson,
  CourseContentModule,
  CourseResource,
  LessonProgress,
  LessonProgressStatus,
} from "@/services/learning";
import { reportLessonStreaming } from "@/services/learning";
import type { ManualPaymentStatus } from "@/services/student";
import type { DiscussionThread } from "@/api/discussions";
import UiDialog from "@/components/ui/UiDialog.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiTabs from "@/components/ui/UiTabs.vue";
import UiToast from "@/components/ui/UiToast.vue";
import UiTextarea from "@/components/ui/UiTextarea.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiProgressBar from "@/components/ui/UiProgressBar.vue";
import UiAccordion, {
  type UiAccordionItem,
} from "@/components/ui/UiAccordion.vue";
import UiTag from "@/components/ui/UiTag.vue";
import UiSwitch from "@/components/ui/UiSwitch.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import StudentLessonAiPanel from "@/components/ai/StudentLessonAiPanel.vue";
import MediaVideoPlayer from "@/components/media/MediaVideoPlayer.vue";
import ThreadsList from "@/views/shared/discussions/ThreadsList.vue";
import ThreadView from "@/views/shared/discussions/ThreadView.vue";
import CourseReviewForm from "@/views/student/reviews/CourseReviewForm.vue";
import CourseReviewsList from "@/views/shared/reviews/CourseReviewsList.vue";

type ToastInput = "success" | "error" | "warning" | "info";
type ToastTone = "success" | "danger" | "warning" | "info";

const FOCUS_MODE_STORAGE_KEY = "student-learning-focus-mode";
const LESSON_NOTES_STORAGE_KEY = "student-learning-lesson-notes";

const { t } = useI18n();
const learning = useLearningStore();
const studentStore = useStudentStore();
const achievementsStore = useAchievementsStore();
const tenantStore = useTenantStore();
const featuresStore = useFeaturesStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const aiStudentEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.aiStudent),
);

const snackbar = reactive({
  show: false,
  tone: "success" as ToastTone,
  message: "",
});
const tab = ref<
  | "content"
  | "progress"
  | "assignments"
  | "discussions"
  | "reviews"
  | "resources"
>("content");
const selectedCourseId = ref<number | null>(null);
const selectedLessonId = ref<number | null>(null);
const pendingLessonId = ref<number | null>(null);
const pendingCourseFromRoute = ref<number | null>(null);
const teacherCourses = ref<
  Array<{ id: number; title: string; useModulePricing?: boolean }>
>([]);
const submissionDialog = ref(false);
const selectedAssignment = ref<Assignment | null>(null);
const selectedThreadId = ref<number | null>(null);
const formSubmitting = ref(false);
const progressUpdating = ref(false);
const threadsListRef = ref<InstanceType<typeof ThreadsList> | null>(null);
const activeDiscussionThread = ref<DiscussionThread | null>(null);
const reviewsRefreshKey = ref(0);
const focusMode = ref(false);
const focusOutlineVisible = ref(false);
const lessonNotes = reactive<Partial<Record<number, string>>>({});
const lessonNotesDraft = ref("");
const learningRefreshInFlight = ref(false);
const isInitialLoadComplete = ref(false);
const lessonVideoRef = ref<InstanceType<typeof MediaVideoPlayer> | null>(null);
const lessonVideoElement = computed(
  () => lessonVideoRef.value?.getVideoElement() ?? null,
);
const hlsInstance = ref<HlsInstance | null>(null);

let notesSaveTimeout: number | undefined;

type HlsInstance = {
  destroy(): void;
  loadSource(source: string): void;
  attachMedia(media: HTMLVideoElement): void;
};

type HlsConstructor = {
  new (config?: Record<string, unknown>): HlsInstance;
  isSupported(): boolean;
};

const isStudentLoggedIn = computed(
  () => authStore.isAuthenticated && authStore.isStudent,
);

const submissionForm = reactive({
  fileUrl: "",
  fileKey: "",
  notes: "",
});

const progressSelections = reactive<Record<number, string>>({});

const progressStatuses = [
  { value: "not_started", label: t("learning.progressStatus.not_started") },
  { value: "in_progress", label: t("learning.progressStatus.in_progress") },
  { value: "completed", label: t("learning.progressStatus.completed") },
];

const progressSearch = ref("");
const progressStatusFilter = ref<"all" | LessonProgressStatus>("all");

const progressHeaders = [
  { title: t("learning.student.lessonTitle"), key: "lessonTitle" },
  { title: t("learning.student.progressStatusHeader"), key: "status" },
  { title: t("learning.student.progressUpdated"), key: "updatedAt" },
];

const assignmentHeaders = [
  { title: t("learning.student.assignmentTitle"), key: "title" },
  { title: t("learning.student.assignmentCourse"), key: "courseTitle" },
  { title: t("learning.student.assignmentLesson"), key: "lessonTitle" },
  { title: t("learning.student.assignmentDue"), key: "dueAt" },
  { title: t("learning.student.assignmentMaxScore"), key: "maxScore" },
  {
    title: t("learning.student.assignmentAttachment"),
    key: "attachmentUrl",
    sortable: false,
  },
  { title: t("learning.student.assignmentAssigned"), key: "createdAt" },
  { title: t("common.actions"), key: "actions", sortable: false },
];

const assignmentSearch = ref("");
const assignmentDueFilter = ref<"all" | "upcoming" | "past_due" | "no_due">(
  "all",
);

const discussionsEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.discussions),
);
const reviewsEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.reviews),
);

const tabItems = computed(() => {
  const items: { value: typeof tab.value; label: string }[] = [
    { value: "content", label: t("learning.student.contentTab") },
    { value: "progress", label: t("learning.student.progressTab") },
    { value: "assignments", label: t("learning.student.assignmentsTab") },
  ];
  if (discussionsEnabled.value) {
    items.push({
      value: "discussions",
      label: t("learning.student.discussionsTab"),
    });
  }
  if (reviewsEnabled.value) {
    items.push({ value: "reviews", label: t("learning.student.reviewsTab") });
  }

  items.push({ value: "resources", label: t("learning.student.resourcesTab") });
  return items;
});

watch(
  discussionsEnabled,
  (enabled) => {
    if (!enabled && tab.value === "discussions") {
      tab.value = "content";
    }
  },
  { immediate: true },
);

watch(
  reviewsEnabled,
  (enabled) => {
    if (!enabled && tab.value === "reviews") {
      tab.value = "content";
    }
  },
  { immediate: true },
);

const accessibleCourseIds = computed(() => {
  const ids = new Set<number>();
  studentStore.enrollments.forEach((enrollment) => {
    if (enrollment.status === "active" || enrollment.status === "trial") {
      ids.add(enrollment.courseId);
    }
  });
  return ids;
});

const isManualPaymentPending = (status: ManualPaymentStatus) => {
  const value = String(status ?? "").toUpperCase();
  return value === "PENDING_REVIEW" || value === "PENDING";
};

const pendingPaymentCourseIds = computed(() => {
  const ids = new Set<number>();
  studentStore.payments.forEach((payment) => {
    if (isManualPaymentPending(payment.status)) {
      ids.add(payment.courseId);
    }
  });
  return ids;
});

const courseOptions = computed(() => {
  const seen = new Set<number>();
  const options: Array<{
    id: number;
    title: string;
    accessible: boolean;
    pendingPayment: boolean;
    useModulePricing?: boolean;
  }> = [];

  const appendOption = (course: {
    id: number;
    title: string;
    useModulePricing?: boolean;
  }) => {
    if (course.id == null || seen.has(course.id)) {
      return;
    }
    seen.add(course.id);
    options.push({
      id: course.id,
      title: course.title,
      accessible: accessibleCourseIds.value.has(course.id),
      pendingPayment: pendingPaymentCourseIds.value.has(course.id),
      useModulePricing: course.useModulePricing,
    });
  };

  teacherCourses.value.forEach(appendOption);
  studentStore.enrollments.forEach((enrollment) =>
    appendOption({
      id: enrollment.courseId,
      title: enrollment.courseTitle,
      useModulePricing: enrollment.useModulePricing,
    }),
  );

  return options.sort((a, b) => {
    if (a.accessible !== b.accessible) {
      return a.accessible ? -1 : 1;
    }
    return a.title.localeCompare(b.title);
  });
});

const courseProgressItems = computed(() => {
  if (!selectedCourseId.value) return learning.studentProgress;
  return learning.studentProgress.filter(
    (progress) => progress.courseId === selectedCourseId.value,
  );
});

const filteredProgress = computed(() => {
  const searchTerm = progressSearch.value.trim().toLowerCase();
  const statusFilter = progressStatusFilter.value;
  return courseProgressItems.value.filter((progress) => {
    if (statusFilter !== "all" && progress.status !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const title = progress.lessonTitle?.toLowerCase() ?? "";
      return title.includes(searchTerm);
    }
    return true;
  });
});

const courseAssignments = computed(() => {
  if (!selectedCourseId.value) return learning.studentAssignments;
  return learning.studentAssignments.filter(
    (assignment) => assignment.courseId === selectedCourseId.value,
  );
});

const filteredAssignments = computed(() => {
  const searchTerm = assignmentSearch.value.trim().toLowerCase();
  const dueFilter = assignmentDueFilter.value;
  const now = Date.now();
  return courseAssignments.value.filter((assignment) => {
    const dueAt = assignment.dueAt
      ? new Date(assignment.dueAt).getTime()
      : null;
    if (dueFilter === "upcoming" && !(dueAt != null && dueAt >= now)) {
      return false;
    }
    if (dueFilter === "past_due" && !(dueAt != null && dueAt < now)) {
      return false;
    }
    if (dueFilter === "no_due" && dueAt != null) {
      return false;
    }
    if (searchTerm) {
      const haystack =
        `${assignment.title} ${assignment.description ?? ""}`.toLowerCase();
      return haystack.includes(searchTerm);
    }
    return true;
  });
});

const resourceSearch = ref("");
const resourceTypeFilter = ref<"all" | string>("all");
const embeddedResourceDialog = ref(false);
const activeEmbeddedResource = ref<CourseResource | null>(null);

const courseResources = computed(() => {
  if (!selectedCourseId.value) return learning.courseResources;
  return learning.courseResources.filter(
    (resource) => resource.courseId === selectedCourseId.value,
  );
});

const resourceTypeOptions = computed(() => {
  const types = new Set<string>();
  courseResources.value.forEach((resource) => {
    if (resource.resourceType) {
      types.add(resource.resourceType);
    }
  });
  return Array.from(types).sort((a, b) => a.localeCompare(b));
});

const filteredResources = computed(() => {
  const searchTerm = resourceSearch.value.trim().toLowerCase();
  const typeFilter = resourceTypeFilter.value;
  return courseResources.value.filter((resource) => {
    if (typeFilter !== "all" && resource.resourceType !== typeFilter) {
      return false;
    }
    if (searchTerm) {
      const haystack =
        `${resource.title} ${resource.lessonTitle ?? ""} ${resource.courseTitle ?? ""}`.toLowerCase();
      return haystack.includes(searchTerm);
    }
    return true;
  });
});

const openEmbeddedResource = (resource: CourseResource) => {
  activeEmbeddedResource.value = resource;
  embeddedResourceDialog.value = true;
};

const closeEmbeddedResource = () => {
  embeddedResourceDialog.value = false;
  activeEmbeddedResource.value = null;
};

const lessonOptions = computed(() =>
  courseProgressItems.value.map((progress) => ({
    value: progress.lessonId,
    label: progress.lessonTitle,
  })),
);

const courseContentModules = computed(
  () => learning.courseContent?.modules ?? [],
);

const focusControlsVisible = computed(
  () => tab.value === "content" && courseContentModules.value.length > 0,
);
const isFocusModeActive = computed(
  () => focusMode.value && focusControlsVisible.value,
);

const findLessonInModules = (
  lessonId: number,
): { lesson: CourseContentLesson; module: CourseContentModule } | null => {
  for (const module of courseContentModules.value) {
    const lesson = module.lessons.find((item) => item.id === lessonId);
    if (lesson) {
      return { lesson, module };
    }
  }
  return null;
};

const recommendations = computed(() => {
  const priority: Record<LessonProgressStatus, number> = {
    not_started: 0,
    in_progress: 1,
    completed: 2,
  };

  const items = courseProgressItems.value
    .filter((item) => item.status !== "completed")
    .map((item) => {
      const match = findLessonInModules(item.lessonId);
      return {
        lessonId: item.lessonId,
        courseId: item.courseId,
        lessonTitle: item.lessonTitle,
        moduleTitle: match?.module.title ?? "",
        status: item.status as LessonProgressStatus,
        statusLabel:
          progressStatusLabels.value[item.status as LessonProgressStatus] ||
          item.status,
        updatedAt: item.updatedAt ?? null,
      };
    });

  items.sort((a, b) => {
    const priorityDiff = priority[a.status] - priority[b.status];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    if (a.updatedAt && b.updatedAt) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (a.updatedAt) {
      return -1;
    }
    if (b.updatedAt) {
      return 1;
    }
    return a.lessonTitle.localeCompare(b.lessonTitle);
  });

  return items.slice(0, 3);
});

const setFocusMode = (value: boolean) => {
  if (value && !focusControlsVisible.value) {
    return;
  }
  focusMode.value = value;
};

const toggleFocusOutline = () => {
  focusOutlineVisible.value = !focusOutlineVisible.value;
};

const closeFocusOutline = () => {
  focusOutlineVisible.value = false;
};

const hasLessonNotes = computed(() => Boolean(lessonNotesDraft.value.trim()));

const persistLessonNotes = () => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const rawNotes = toRaw(lessonNotes);
    window.localStorage.setItem(
      LESSON_NOTES_STORAGE_KEY,
      JSON.stringify(rawNotes),
    );
  } catch (error) {
    console.error("Failed to persist lesson notes", error);
  }
};

const scheduleNotesPersist = () => {
  if (typeof window === "undefined") {
    return;
  }
  if (notesSaveTimeout) {
    window.clearTimeout(notesSaveTimeout);
  }
  notesSaveTimeout = window.setTimeout(() => {
    persistLessonNotes();
    notesSaveTimeout = undefined;
  }, 280);
};

const loadLessonNotes = () => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const stored = window.localStorage.getItem(LESSON_NOTES_STORAGE_KEY);
    if (!stored) {
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object") {
      Object.entries(parsed as Record<string, unknown>).forEach(
        ([key, value]) => {
          const lessonId = Number(key);
          if (!Number.isFinite(lessonId) || typeof value !== "string") {
            return;
          }
          lessonNotes[lessonId] = value;
        },
      );
    }
  } catch (error) {
    console.error("Failed to load lesson notes", error);
  }
};

const clearActiveLessonNotes = () => {
  if (!activeLesson.value) {
    return;
  }
  lessonNotesDraft.value = "";
  showToast(t("learning.student.lessonNotesCleared"), "info");
};

const shouldIgnoreShortcut = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target) {
    return false;
  }
  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
};

const handleKeydown = (event: KeyboardEvent) => {
  if (shouldIgnoreShortcut(event)) {
    return;
  }
  if ((event.key === "f" || event.key === "F") && event.shiftKey) {
    if (!focusControlsVisible.value) {
      return;
    }
    event.preventDefault();
    setFocusMode(!focusMode.value);
    return;
  }
  if (event.key === "Escape" && isFocusModeActive.value) {
    event.preventDefault();
    if (focusOutlineVisible.value) {
      focusOutlineVisible.value = false;
    } else {
      focusMode.value = false;
    }
  }
};

const activeLesson = computed<CourseContentLesson | null>(() => {
  if (selectedLessonId.value == null) {
    return null;
  }
  return findLessonInModules(selectedLessonId.value)?.lesson ?? null;
});

const activeLessonModule = computed<CourseContentModule | null>(() => {
  if (selectedLessonId.value == null) {
    return null;
  }
  return findLessonInModules(selectedLessonId.value)?.module ?? null;
});

const lessonProgressMap = computed<Record<number, LessonProgress>>(() => {
  const map: Record<number, LessonProgress> = {};
  learning.studentProgress.forEach((item) => {
    map[item.lessonId] = item;
  });
  return map;
});

const activeLessonProgressStatus = computed<LessonProgressStatus>(() => {
  if (!activeLesson.value) {
    return "not_started";
  }
  return (
    lessonProgressMap.value[activeLesson.value.id]?.status ?? "not_started"
  );
});

const lessonEntries = computed(() =>
  courseContentModules.value.flatMap((module) =>
    module.lessons.map((lesson) => ({ lesson, module })),
  ),
);

const previousLesson = computed(() => {
  if (!selectedLessonId.value) {
    return null;
  }
  const entries = lessonEntries.value;
  const currentIndex = entries.findIndex(
    (entry) => entry.lesson.id === selectedLessonId.value,
  );
  if (currentIndex <= 0) {
    return null;
  }
  return entries[currentIndex - 1] ?? null;
});

const nextLesson = computed(() => {
  if (!selectedLessonId.value) {
    return null;
  }
  const entries = lessonEntries.value;
  const currentIndex = entries.findIndex(
    (entry) => entry.lesson.id === selectedLessonId.value,
  );
  if (currentIndex === -1 || currentIndex >= entries.length - 1) {
    return null;
  }
  return entries[currentIndex + 1] ?? null;
});

const moduleProgress = computed(() => {
  const module = activeLessonModule.value;
  if (!module || module.lessons.length === 0) {
    return null;
  }
  const completed = module.lessons.filter(
    (lesson) => lessonProgressMap.value[lesson.id]?.status === "completed",
  ).length;
  const total = module.lessons.length;
  const percent = Math.round((completed / total) * 100);
  return { completed, total, percent };
});

const normalizeUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const buildYoutubeEmbedUrl = (value?: string | null) => {
  const normalized = normalizeUrl(value);
  if (!normalized) {
    return null;
  }

  const idPattern = /^[\w-]{11}$/;
  if (idPattern.test(normalized)) {
    return `https://www.youtube-nocookie.com/embed/${normalized}?rel=0&modestbranding=1`;
  }

  const patterns = [
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/(?:watch\?v=|embed\/|shorts\/)([\w-]{11})/i,
    /youtube-nocookie\.com\/embed\/([\w-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1`;
    }
  }

  return null;
};

const rawLessonVideoUrl = computed(() =>
  normalizeUrl(activeLesson.value?.videoUrl),
);
const activeLessonVideoStreamUrl = computed(() =>
  buildAuthenticatedMediaUrl(rawLessonVideoUrl.value),
);
const activeLessonVideoEmbedUrl = computed(() =>
  buildYoutubeEmbedUrl(
    activeLesson.value?.ytId ?? activeLesson.value?.videoUrl,
  ),
);
const isLessonVideoHls = computed(() =>
  /\.m3u8(?=$|\?)/i.test(activeLessonVideoStreamUrl.value ?? ""),
);
const lessonVideoElementSrc = computed(() =>
  isLessonVideoHls.value
    ? undefined
    : (activeLessonVideoStreamUrl.value ?? undefined),
);
const streamingBlocked = ref(false);
const hasActiveLessonVideoSource = computed(() =>
  Boolean(activeLessonVideoEmbedUrl.value || activeLessonVideoStreamUrl.value),
);
const serverStreamingBlocked = computed(() =>
  Boolean(activeLesson.value?.streamingBlocked),
);
const effectiveStreamingBlocked = computed(
  () => streamingBlocked.value || serverStreamingBlocked.value,
);
const canRenderLessonVideoPlayer = computed(
  () => hasActiveLessonVideoSource.value && !effectiveStreamingBlocked.value,
);
const hasActiveLessonVideo = computed(
  () => hasActiveLessonVideoSource.value || effectiveStreamingBlocked.value,
);
const streamingBufferSeconds = ref(0);
const streamingTimerId = ref<number | null>(null);
const streamingLessonId = ref<number | null>(null);
const STREAMING_PING_INTERVAL_MS = 15000;

const flushStreamingBuffer = async (force = false) => {
  const lessonId = streamingLessonId.value ?? activeLesson.value?.id ?? null;
  if (!lessonId || effectiveStreamingBlocked.value) {
    streamingBufferSeconds.value = 0;
    return;
  }
  let minutesToSend = Math.floor(streamingBufferSeconds.value / 60);
  if (force && streamingBufferSeconds.value > 0 && minutesToSend === 0) {
    minutesToSend = 1;
  }
  if (minutesToSend <= 0) {
    return;
  }
  streamingBufferSeconds.value -= minutesToSend * 60;
  try {
    await reportLessonStreaming(lessonId, minutesToSend);
  } catch (error) {
    const status = getHttpStatus(error);
    if (status === 429) {
      streamingBlocked.value = true;
      snackbar.message =
        "Streaming limit reached for this teacher plan. Please try again later.";
      snackbar.tone = "warning";
      snackbar.show = true;
      const element = lessonVideoElement.value;
      if (element && !element.paused) {
        try {
          element.pause();
        } catch {
          /* ignore */
        }
      }
    }
  }
};

const startStreamingTimer = () => {
  if (streamingTimerId.value || typeof window === "undefined") {
    return;
  }
  if (!streamingLessonId.value) {
    streamingLessonId.value = activeLesson.value?.id ?? null;
  }
  streamingTimerId.value = window.setInterval(() => {
    const element = lessonVideoElement.value;
    if (
      !element ||
      element.paused ||
      element.ended ||
      effectiveStreamingBlocked.value
    ) {
      return;
    }
    streamingBufferSeconds.value += STREAMING_PING_INTERVAL_MS / 1000;
    if (streamingBufferSeconds.value >= 60) {
      void flushStreamingBuffer(false);
    }
  }, STREAMING_PING_INTERVAL_MS);
};

const stopStreamingTimer = async (flush = false) => {
  if (streamingTimerId.value && typeof window !== "undefined") {
    window.clearInterval(streamingTimerId.value);
  }
  streamingTimerId.value = null;
  if (flush) {
    await flushStreamingBuffer(true);
  } else {
    streamingBufferSeconds.value = 0;
  }
  if (!flush) {
    streamingLessonId.value = null;
  }
};

const rawLessonPdfUrl = computed(() =>
  normalizeUrl(activeLesson.value?.pdfUrl),
);
const activeLessonPdfUrl = computed(() =>
  buildAuthenticatedMediaUrl(rawLessonPdfUrl.value),
);
const hasActiveLessonPdf = computed(() => Boolean(activeLessonPdfUrl.value));

const loadHlsLibrary = async (): Promise<HlsConstructor | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  const { Hls } = window as unknown as { Hls?: HlsConstructor };
  if (Hls) {
    return Hls;
  }

  try {
    const module = await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/hls.js@1.5.14/dist/hls.min.mjs"
    );
    const resolved =
      (module as { default?: HlsConstructor; Hls?: HlsConstructor }).default ??
      (module as { Hls?: HlsConstructor }).Hls ??
      null;
    return resolved ?? null;
  } catch (error) {
    console.warn("[learning] unable to load HLS playback library", error);
    return null;
  }
};

const resetLessonVideoElement = () => {
  const element = lessonVideoElement.value;
  if (!element) return;
  try {
    element.pause();
  } catch {
    /* ignore */
  }
  element.removeAttribute("src");
  try {
    element.load();
  } catch {
    /* ignore */
  }
};

const detachHls = () => {
  if (!hlsInstance.value) return;
  try {
    hlsInstance.value.destroy();
  } catch {
    /* ignore */
  }
  hlsInstance.value = null;
};

const videoSetupState = reactive({
  running: false,
  pending: false,
  waitForTick: false,
});

const setupLessonVideo = async () => {
  const url = activeLessonVideoStreamUrl.value;
  const element = lessonVideoElement.value;
  detachHls();
  resetLessonVideoElement();

  if (!url || !element) {
    return;
  }

  if (isLessonVideoHls.value) {
    if (element.canPlayType("application/vnd.apple.mpegurl")) {
      element.src = url;
      return;
    }

    const HlsLib = await loadHlsLibrary();
    if (HlsLib?.isSupported()) {
      const instance = new HlsLib({
        // Do not send credentials on cross-origin HLS requests because
        // CDN responses use a wildcard Access-Control-Allow-Origin header,
        // which fails when credentials are included.
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.withCredentials = false;
        },
      });
      instance.loadSource(url);
      instance.attachMedia(element);
      hlsInstance.value = instance;
      return;
    }
  }

  element.src = url;
};

const requestLessonVideoSetup = async (waitForTick = false) => {
  videoSetupState.pending = true;
  videoSetupState.waitForTick = videoSetupState.waitForTick || waitForTick;
  if (videoSetupState.running) return;

  videoSetupState.running = true;
  try {
    while (videoSetupState.pending) {
      const shouldWait = videoSetupState.waitForTick;
      videoSetupState.pending = false;
      videoSetupState.waitForTick = false;
      if (shouldWait) {
        await nextTick();
        await nextTick();
      }
      await setupLessonVideo();
    }
  } finally {
    videoSetupState.running = false;
  }
};

const streamingListenersCleanup = ref<null | (() => void)>(null);

const attachStreamingListeners = (element: HTMLVideoElement | null) => {
  if (streamingListenersCleanup.value) {
    streamingListenersCleanup.value();
    streamingListenersCleanup.value = null;
  }
  if (!element) return;

  const onPlay = () => {
    if (effectiveStreamingBlocked.value) {
      try {
        element.pause();
      } catch {
        /* ignore */
      }
      return;
    }
    startStreamingTimer();
  };
  const onPause = () => {
    void stopStreamingTimer(true);
  };
  const onEnded = () => {
    void stopStreamingTimer(true);
  };

  element.addEventListener("play", onPlay);
  element.addEventListener("pause", onPause);
  element.addEventListener("ended", onEnded);

  streamingListenersCleanup.value = () => {
    element.removeEventListener("play", onPlay);
    element.removeEventListener("pause", onPause);
    element.removeEventListener("ended", onEnded);
  };
};

interface ContentAccordionItem extends UiAccordionItem {
  module: CourseContentModule;
}

const contentAccordionItems = computed<ContentAccordionItem[]>(() =>
  courseContentModules.value.map((module) => ({
    value: module.id,
    title: module.title,
    module,
  })),
);

const progressStatusLabels = computed<Record<LessonProgressStatus, string>>(
  () => {
    const labels = {} as Record<LessonProgressStatus, string>;
    progressStatuses.forEach((status) => {
      labels[status.value as LessonProgressStatus] = status.label;
    });
    return labels;
  },
);

const statusColors: Record<
  LessonProgressStatus,
  "neutral" | "info" | "success"
> = {
  not_started: "neutral",
  in_progress: "info",
  completed: "success",
};

watch(
  [lessonVideoElement, activeLessonVideoStreamUrl],
  () => {
    void requestLessonVideoSetup();
    attachStreamingListeners(lessonVideoElement.value);
  },
  { immediate: true },
);

watch(
  selectedLessonId,
  () => {
    void requestLessonVideoSetup(true);
    streamingBlocked.value = false;
    streamingBufferSeconds.value = 0;
    void stopStreamingTimer(true);
    streamingLessonId.value = null;
  },
  { immediate: false },
);

watch(effectiveStreamingBlocked, (blocked) => {
  if (blocked) {
    void stopStreamingTimer(false);
  }
});

watch(
  () => courseContentModules.value,
  (modules) => {
    if (!modules.length) {
      pendingLessonId.value = null;
    }
    if (!selectedCourseId.value || !modules.length) {
      selectedLessonId.value = null;
      return;
    }
    if (pendingLessonId.value != null) {
      const pendingExists = modules.some((module) =>
        module.lessons.some((lesson) => lesson.id === pendingLessonId.value),
      );
      if (pendingExists) {
        selectedLessonId.value = pendingLessonId.value;
        pendingLessonId.value = null;
        return;
      }
    }
    if (selectedLessonId.value != null) {
      const stillExists = modules.some((module) =>
        module.lessons.some((lesson) => lesson.id === selectedLessonId.value),
      );
      if (stillExists) {
        return;
      }
    }
    const firstModule = modules.find((module) => module.lessons.length > 0);
    selectedLessonId.value = firstModule ? firstModule.lessons[0].id : null;
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  detachHls();
  void stopStreamingTimer(true);
  if (streamingListenersCleanup.value) {
    streamingListenersCleanup.value();
    streamingListenersCleanup.value = null;
  }
});

watch(focusMode, (value) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(FOCUS_MODE_STORAGE_KEY, value ? "1" : "0");
  }
  if (!value) {
    focusOutlineVisible.value = false;
  }
});

watch(isFocusModeActive, (active) => {
  if (!active) {
    focusOutlineVisible.value = false;
  }
});

watch(
  selectedLessonId,
  (lessonId) => {
    if (lessonId == null) {
      lessonNotesDraft.value = "";
      return;
    }
    lessonNotesDraft.value = lessonNotes[lessonId] ?? "";
  },
  { immediate: true },
);

watch(lessonNotesDraft, (value) => {
  if (!activeLesson.value) {
    return;
  }
  const lessonId = activeLesson.value.id;
  const trimmed = value.trim();
  if (!trimmed) {
    if (lessonNotes[lessonId] !== undefined) {
      delete lessonNotes[lessonId];
      scheduleNotesPersist();
    }
    return;
  }
  if (lessonNotes[lessonId] === value) {
    return;
  }
  lessonNotes[lessonId] = value;
  scheduleNotesPersist();
});

watch(
  () => courseContentModules.value.length,
  (length) => {
    if (length === 0 && selectedCourseId.value != null) {
      focusMode.value = false;
      focusOutlineVisible.value = false;
    }
  },
);

let toastTimeout: number | undefined;

const showToast = (message: string, tone: ToastInput = "success") => {
  const toneMap: Record<ToastInput, ToastTone> = {
    success: "success",
    error: "danger",
    warning: "warning",
    info: "info",
  };
  if (toastTimeout) {
    window.clearTimeout(toastTimeout);
    toastTimeout = undefined;
  }
  snackbar.message = message;
  snackbar.tone = toneMap[tone];
  snackbar.show = true;
  toastTimeout = window.setTimeout(() => {
    snackbar.show = false;
    toastTimeout = undefined;
  }, 3200);
};

const loadStudentLearningData = async () => {
  if (!isStudentLoggedIn.value) {
    learning.clear();
    studentStore.clear();
    selectedCourseId.value = null;
    return;
  }
  try {
    await Promise.all([
      studentStore.fetchEnrollments(),
      studentStore.fetchPayments(),
    ]);
    await Promise.all([
      learning.loadStudentProgress(),
      learning.loadStudentAssignments(),
    ]);
    syncProgressSelections();
  } catch (error) {
    console.error("Failed to load student learning data", error);
    showToast(t("learning.student.courseLoadFailed"), "error");
  }
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const certificateItems = computed(() =>
  (achievementsStore.data?.certificates ?? [])
    .slice(0, 3)
    .map((certificate) => ({
      ...certificate,
      downloadUrl: withCacheBusting(certificate.pdfUrl),
    })),
);

const formatCertificateDate = (value?: string | null) => {
  if (!value) return "â€”";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    date,
  );
};

const formatLessonDuration = (duration?: number | null) => {
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

const onSelectLesson = (lessonId: number) => {
  const match = findLessonInModules(lessonId);
  if (!match) {
    return;
  }
  selectedLessonId.value = match.lesson.id;
  if (isFocusModeActive.value) {
    focusOutlineVisible.value = false;
  }
};

const goToAdjacentLesson = (direction: "previous" | "next") => {
  const target =
    direction === "previous" ? previousLesson.value : nextLesson.value;
  if (!target) {
    return;
  }
  onSelectLesson(target.lesson.id);
};

const onQuickProgressUpdate = async (status: LessonProgressStatus) => {
  if (!activeLesson.value || progressUpdating.value) {
    return;
  }
  if (activeLessonProgressStatus.value === status) {
    return;
  }
  await updateProgress(activeLesson.value.id, status);
};

const onTabChange = (value: string | number) => {
  tab.value = value as typeof tab.value;
};

const redirectToPaymentPage = (courseId: number) => {
  router.push({
    name: "student-checkout",
    query: { courseId: courseId.toString() },
  });
};

const onSelectCourse = (value: string | number | null) => {
  const previous = selectedCourseId.value;
  if (value === null || value === "") {
    selectedCourseId.value = null;
    return;
  }
  const courseId = Number(value);
  if (Number.isNaN(courseId)) {
    return;
  }

  const courseOption = courseOptions.value.find((c) => c.id === courseId);
  if (
    !accessibleCourseIds.value.has(courseId) &&
    !courseOption?.useModulePricing
  ) {
    if (pendingPaymentCourseIds.value.has(courseId)) {
      showToast(t("learning.student.paymentPendingRedirect"), "info");
    } else {
      showToast(t("learning.student.paymentRequired"), "warning");
    }
    redirectToPaymentPage(courseId);
    if (previous !== undefined) {
      selectedCourseId.value = previous;
    }
    return;
  }
  selectedCourseId.value = courseId;
};

const onModuleHeaderClick = (module: CourseContentModule, event: Event) => {
  if (module.accessible === false) {
    event.stopPropagation();
    event.preventDefault();
    if (selectedCourseId.value) {
      redirectToPaymentPage(selectedCourseId.value);
    }
  }
};

const goToLessonFromRecommendation = async (
  lessonId: number,
  courseId: number,
) => {
  if (selectedCourseId.value !== courseId) {
    pendingLessonId.value = lessonId;
    onSelectCourse(courseId);
  } else {
    onSelectLesson(lessonId);
  }
  tab.value = "content";
  await nextTick();
  if (isFocusModeActive.value) {
    focusOutlineVisible.value = false;
  }
};

const parseCourseIdQuery = (value: unknown): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null || raw === "") {
    return null;
  }
  const courseId = Number(raw);
  return Number.isFinite(courseId) ? courseId : null;
};

watch(
  () => route.query.courseId,
  (value) => {
    const courseId = parseCourseIdQuery(value);
    if (courseId == null) {
      pendingCourseFromRoute.value = null;
      return;
    }
    if (!isInitialLoadComplete.value) {
      pendingCourseFromRoute.value = courseId;
      return;
    }
    pendingCourseFromRoute.value = null;
    onSelectCourse(courseId);
  },
  { immediate: true },
);

watch(
  () => isInitialLoadComplete.value,
  (completed) => {
    if (completed && pendingCourseFromRoute.value != null) {
      const courseId = pendingCourseFromRoute.value;
      pendingCourseFromRoute.value = null;
      onSelectCourse(courseId);
    }
  },
);

const onProgressStatusChange = (
  lessonId: number,
  value: string | number | null,
) => {
  const normalized = value === null ? "" : String(value);
  if (!normalized) {
    return;
  }
  progressSelections[lessonId] = normalized;
  updateProgress(lessonId, normalized);
};

const updateProgress = async (lessonId: number, status: string) => {
  progressUpdating.value = true;
  formSubmitting.value = true;
  try {
    await learning.setLessonProgress({ lessonId, status: status as any });
    showToast(t("learning.student.progressUpdatedMessage"));
    if (selectedCourseId.value) {
      await learning.loadCourseProgress(selectedCourseId.value);
    }
  } catch (error) {
    console.error(error);
    showToast(t("learning.student.progressUpdateFailed"), "error");
  } finally {
    progressUpdating.value = false;
    formSubmitting.value = false;
  }
};

const openSubmissionDialog = (assignment: Assignment) => {
  selectedAssignment.value = assignment;
  submissionForm.fileUrl = "";
  submissionForm.fileKey = "";
  submissionForm.notes = "";
  submissionDialog.value = true;
};

const closeSubmissionDialog = () => {
  submissionDialog.value = false;
  selectedAssignment.value = null;
};

const submitAssignment = async () => {
  if (!selectedAssignment.value) return;
  formSubmitting.value = true;
  try {
    await learning.submitStudentAssignment(selectedAssignment.value.id, {
      fileUrl: submissionForm.fileUrl || undefined,
      fileKey: submissionForm.fileKey || undefined,
      notes: submissionForm.notes || undefined,
    });
    showToast(t("learning.student.assignmentSubmitted"));
    submissionDialog.value = false;
  } catch (error) {
    console.error(error);
    showToast(t("learning.student.assignmentFailed"), "error");
  } finally {
    formSubmitting.value = false;
  }
};

const onSelectDiscussionThread = (thread: DiscussionThread | null) => {
  activeDiscussionThread.value = thread;
};

const onThreadCreated = (thread: DiscussionThread) => {
  activeDiscussionThread.value = thread;
  showToast(t("discussions.form.created"));
};

const onMessageSent = () => {
  showToast(t("discussions.view.messageSent"));
  threadsListRef.value?.refresh();
};

const onReviewSubmitted = () => {
  showToast(t("reviews.student.submitSuccess"));
  reviewsRefreshKey.value += 1;
};

const onReviewError = (message: string) => {
  showToast(message, "error");
};

const onReviewsError = (message: string) => {
  showToast(message, "error");
};

const syncProgressSelections = () => {
  const next: Record<number, string> = {};
  courseProgressItems.value.forEach((item) => {
    next[item.lessonId] = item.status;
  });
  Object.keys(progressSelections).forEach((key) => {
    if (!(Number(key) in next)) {
      delete progressSelections[Number(key)];
    }
  });
  Object.assign(progressSelections, next);
};

watch(
  () => courseProgressItems.value,
  () => {
    syncProgressSelections();
  },
  { immediate: true },
);

watch(submissionDialog, (open) => {
  if (!open) {
    selectedAssignment.value = null;
  }
});

watch(selectedCourseId, async (courseId) => {
  if (!courseId) {
    learning.courseProgress = null;
    learning.courseContent = null;
    selectedThreadId.value = null;
    activeDiscussionThread.value = null;
    pendingLessonId.value = null;
    focusOutlineVisible.value = false;
    return;
  }
  if (!isStudentLoggedIn.value) {
    learning.courseProgress = null;
    learning.courseContent = null;
    selectedThreadId.value = null;
    activeDiscussionThread.value = null;
    pendingLessonId.value = null;
    focusOutlineVisible.value = false;
    return;
  }
  formSubmitting.value = true;
  learning.courseContent = null;
  try {
    await Promise.all([
      learning.loadStudentProgress(courseId),
      learning.loadCourseProgress(courseId),
      learning.loadStudentAssignments(courseId),
      learning.loadResources(courseId, "student"),
      learning.loadCourseContent(courseId),
    ]);
    selectedThreadId.value = null;
    activeDiscussionThread.value = null;
    syncProgressSelections();
  } catch (error) {
    console.error(error);
    showToast(t("learning.student.courseLoadFailed"), "error");
  } finally {
    formSubmitting.value = false;
  }
});

watch(
  selectedCourseId,
  (courseId) => {
    const current = route.query.courseId;
    const currentValue = Array.isArray(current) ? current[0] : current;
    const normalized = courseId != null ? String(courseId) : undefined;
    if (normalized === currentValue || (!normalized && currentValue == null)) {
      return;
    }
    const nextQuery = { ...route.query } as any;
    if (normalized) {
      nextQuery.courseId = normalized;
    } else {
      delete nextQuery.courseId;
    }
    router.replace({ query: nextQuery }).catch((error) => {
      console.error("Failed to sync courseId query", error);
    });
  },
  { flush: "post" },
);

const loadTeacherCourses = async () => {
  try {
    const slug =
      tenantStore.branding?.slug || getStoredTenantSlug().raw || "demo";
    const { data } = await api.get(`/public/tenants/${slug}/courses`, {
      params: { page: 0, size: 100 },
    });
    const items = data?.items || [];
    teacherCourses.value = items.map((course: any) => ({
      id: course.id,
      title: course.title,
      useModulePricing: course.useModulePricing,
    }));
  } catch (error) {
    const status = (error as any)?.response?.status;
    if (status === 404) {
      teacherCourses.value = [];
      return;
    }
    console.error("Failed to load teacher courses", error);
    showToast(t("learning.student.courseListFailed"), "error");
  }
};

const refreshLearningData = async (reason: string) => {
  if (learningRefreshInFlight.value) {
    return;
  }
  learningRefreshInFlight.value = true;
  try {
    console.info(
      "[StudentLearningView] refreshing learning data after %s",
      reason,
    );
    if (!tenantStore.branding) {
      await tenantStore.fetchBranding();
    }
    await loadTeacherCourses();
    await loadStudentLearningData();
  } catch (error) {
    console.error(
      "[StudentLearningView] failed to refresh learning surface",
      error,
    );
  } finally {
    learningRefreshInFlight.value = false;
    isInitialLoadComplete.value = true;
  }
};

useVisibilityRefresh(
  (reason) => {
    console.debug(
      "[StudentLearningView] visibility refresh triggered by %s",
      reason,
    );
    void refreshLearningData(reason);
  },
  {
    includeActivated: true,
    throttleMs: 500,
  },
);

watch(
  courseOptions,
  (options) => {
    const routeCourseId = parseCourseIdQuery(route.query.courseId);
    if (routeCourseId != null) {
      const hasRouteCourse = options.some(
        (option) => option.id === routeCourseId,
      );
      if (hasRouteCourse) {
        return;
      }
    }
    if (pendingCourseFromRoute.value != null) {
      return;
    }
    const next = options.find((option) => option.accessible) || null;
    const nextId = next ? next.id : null;
    if (selectedCourseId.value !== null) {
      const stillAccessible = options.some(
        (option) => option.id === selectedCourseId.value && option.accessible,
      );
      if (stillAccessible) {
        return;
      }
    }
    if (selectedCourseId.value !== nextId) {
      selectedCourseId.value = nextId;
    }
  },
  { immediate: true },
);

watch(isStudentLoggedIn, async (loggedIn) => {
  if (!loggedIn) {
    learning.clear();
    studentStore.clear();
    selectedCourseId.value = null;
    return;
  }
  await loadStudentLearningData();
});

onMounted(async () => {
  if (typeof window !== "undefined") {
    const storedFocus = window.localStorage.getItem(FOCUS_MODE_STORAGE_KEY);
    focusMode.value = storedFocus === "1";
    loadLessonNotes();
    window.addEventListener("keydown", handleKeydown);
  }
  achievementsStore.load("alltime", 3).catch(() => {});
  await refreshLearningData("mounted");
});

onBeforeUnmount(() => {
  if (toastTimeout) {
    window.clearTimeout(toastTimeout);
  }
  if (notesSaveTimeout) {
    window.clearTimeout(notesSaveTimeout);
    notesSaveTimeout = undefined;
    persistLessonNotes();
  }
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeydown);
  }
});

onActivated(() => {
  void refreshLearningData("activated");
});
</script>

<style lang="scss" scoped>
@use "@/theme/sakai/mixins" as *;

.learning-page__meta {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
}

.learning-certificates {
  margin-top: var(--sakai-space-6);
}

.learning-certificates__body {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.learning-certificates__list {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.learning-certificates__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-2);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid var(--sakai-border-color);
  background: var(--sakai-surface-alt);
}

.learning-certificates__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.learning-certificates__title {
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.learning-certificates__date {
  font-size: 0.75rem;
  color: var(--sakai-text-color-secondary);
}

.learning-certificates__view {
  align-self: flex-start;
  padding-inline-start: 0;
}

.learning-page__filters {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: var(--sakai-space-4);
  min-width: 0; /* Safari flex fix */
}

.learning-page__course {
  max-width: min(100%, 22rem);
  flex-shrink: 0;
}

.learning-page__toggles {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 65%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.learning-page__focus-toggle {
  justify-content: space-between;
}

.learning-page__focus-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.learning-page__tabs :deep(.ui-tabs__content) {
  display: none;
}

.learning-page__tabs {
  width: 100%;
}

.learning-page__tabs :deep(.ui-tabs__nav) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  gap: var(--sakai-space-2);
  padding-block-end: var(--sakai-space-1);
  padding-inline: var(--sakai-space-1);
}

.learning-page__tabs :deep(.ui-tabs.ui-tabs--grow .ui-tabs__item) {
  width: 100%;
}

@media (min-width: 768px) {
  .learning-page__meta {
    gap: var(--sakai-space-4);
  }

  .learning-page__filters {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap; /* Allow wrapping on Safari */
  }

  .learning-page__course {
    flex: 0 0 22rem;
    min-width: 0;
  }

  .learning-page__tabs {
    flex: 1 1 auto;
    min-width: 0; /* Prevent overflow on Safari */
    max-width: 100%;
  }

  .learning-page__tabs :deep(.ui-tabs__nav) {
    display: flex;
    overflow: visible;
    gap: var(--sakai-space-2);
    padding-inline: 0;
    flex-wrap: wrap; /* Allow tabs to wrap if needed */
  }

  .learning-page__tabs :deep(.ui-tabs.ui-tabs--grow .ui-tabs__item) {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
  }
}

.learning-content {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.learning-content__layout {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  min-height: 0;
}

/* تحسين إضافي للـ desktop (لما يبقى row) */
@media (min-width: 1024px) {
  .learning-content__outline {
    min-height: 0;
  }
}

.learning-content__layout--focus {
  position: relative;
}

.learning-content__accordion {
  flex: 1 1 auto;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-inline-end: 0.5rem;
  @include sakai-scrollbar;
}

.learning-content__outline {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  flex: 1 1 auto;
  min-width: 0;
}

.learning-content__outline-actions {
  display: flex;
  justify-content: flex-end;
}

.learning-content__outline--hidden {
  display: none;
}

.learning-content__outline--floating {
  position: absolute;
  inset: var(--sakai-space-4) auto var(--sakai-space-4) var(--sakai-space-4);
  max-width: min(22rem, 90vw);
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface-card);
  box-shadow: var(--sakai-shadow-xl);
  padding: var(--sakai-space-4);
  z-index: 6;
  overflow-y: auto;
}

.learning-content__outline-backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--sakai-neutral-900) 30%, transparent);
  z-index: 5;
}

.learning-content__viewer {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  background: var(--sakai-surface);
}

.learning-content__viewer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.learning-content__viewer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
}

.learning-content__viewer-navigation {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

.learning-content__viewer-controls {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.learning-content__viewer-actions-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
  align-items: center;
}

.learning-content__viewer-action {
  flex-shrink: 0;
}

.learning-content__viewer-action--reset {
  margin-inline-start: auto;
}

.learning-content__module-progress-text {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--sakai-space-2);
  font-size: 0.9rem;
  color: var(--sakai-text-color-secondary);
}

.learning-content__module-progress-text span:first-child {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
}

.learning-content__outline-toggle {
  white-space: nowrap;
}

.learning-content__viewer-titles {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.learning-content__viewer-module {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-tertiary);
}

.learning-content__viewer-title {
  margin: 0;
  color: var(--sakai-text-color);
  font-weight: var(--sakai-font-weight-semibold);
}

.learning-content__viewer-body {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.learning-content__viewer-section {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.learning-content__notes {
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 65%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  padding: var(--sakai-space-4);
  background: color-mix(in srgb, var(--sakai-surface-card) 97%, transparent);
}

.learning-content__notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
  flex-wrap: wrap;
}

.learning-content__notes-helper {
  margin: 0;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.learning-content__viewer-section h4 {
  margin: 0;
  font-size: var(--sakai-font-size-md);
  font-weight: var(--sakai-font-weight-semibold);
}

.learning-content__video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--sakai-border-radius-lg);
  overflow: hidden;
  background: color-mix(in srgb, var(--sakai-border-color) 40%, transparent);
}

.learning-content__video iframe,
.learning-content__video video {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.learning-content__video video {
  background: #000;
  object-fit: cover;
}

.learning-content__materials {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.learning-content__materials iframe {
  width: 100%;
  height: 20rem;
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface-stronger);
}

.learning-content__materials-link {
  align-self: flex-start;
}

.learning-content__lesson-button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--sakai-border-radius-md);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease;
}

.learning-content__lesson-button:hover,
.learning-content__lesson-button:focus-visible {
  background: color-mix(in srgb, var(--sakai-primary-color) 10%, transparent);
  border-color: color-mix(in srgb, var(--sakai-primary-color) 40%, transparent);
  outline: none;
}

.learning-content__lesson-status {
  pointer-events: none;
}

.learning-content__lesson--active .learning-content__lesson-button {
  background: color-mix(in srgb, var(--sakai-primary-color) 12%, transparent);
  border-color: color-mix(in srgb, var(--sakai-primary-color) 50%, transparent);
}

.learning-content__accordion :deep(.ui-accordion__content) {
  background: transparent;
}

.learning-content__module-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.learning-content__module-info {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.learning-content__module-info h3 {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.learning-content__module-info p {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: var(--sakai-font-size-sm);
}

.learning-content__lessons {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.learning-content__lesson {
  padding: 0;
  background: transparent;
}

.learning-content__lesson-info {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.learning-content__lesson-title {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
}

.learning-content__lesson-meta {
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-tertiary);
}

.learning-content__lesson-button:focus-visible .learning-content__lesson-title {
  text-decoration: underline;
}

.learning-progress {
  display: grid;
  gap: var(--sakai-space-6);
}

@media (min-width: 960px) {
  .learning-progress {
    grid-template-columns: minmax(0, 22rem) minmax(0, 1fr);
    align-items: flex-start;
  }
}

.learning-progress__summary :deep(.ui-card__body),
.learning-progress__table-card :deep(.ui-card__body) {
  gap: var(--sakai-space-5);
}

.learning-progress__overview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sakai-space-5);
}

.learning-progress__circle {
  --progress-value: 0%;
  position: relative;
  width: calc(var(--sakai-space-12) * 1.25);
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: conic-gradient(
    var(--sakai-primary) var(--progress-value),
    color-mix(in srgb, var(--sakai-border-color) 35%, transparent)
      var(--progress-value)
  );
  display: grid;
  place-items: center;
  color: var(--sakai-primary-700);
  font-weight: var(--sakai-font-weight-semibold);
  box-shadow: var(--sakai-shadow-sm);
}

.learning-progress__circle::after {
  content: "";
  position: absolute;
  inset: var(--sakai-space-4);
  background: var(--sakai-surface-card);
  border-radius: 50%;
}

.learning-progress__circle span {
  position: relative;
  font-size: var(--sakai-font-size-xl);
}

.learning-progress__details {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.learning-progress__course {
  margin: 0;
  font-size: var(--sakai-font-size-lg);
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.learning-progress__meta {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
}

.learning-progress__table {
  overflow-x: auto;
}

.learning-progress__table :deep(table) {
  min-width: calc(var(--sakai-space-12) * 9);
}

.learning-progress__filters {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.learning-progress__search {
  flex: 1 1 auto;
}

.learning-progress__status-filter {
  flex: 0 0 auto;
  min-width: 12rem;
}

@media (min-width: 768px) {
  .learning-progress__filters {
    flex-direction: row;
    align-items: flex-end;
  }
}

.learning-progress__status {
  min-width: 12rem;
}

.learning-progress__recommendations {
  position: relative;
}

.learning-progress__recommendations-list {
  display: grid;
  gap: var(--sakai-space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.learning-progress__recommendations-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 65%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 95%, transparent);
}

.learning-progress__recommendations-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.learning-progress__recommendations-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.learning-progress__recommendations-module,
.learning-progress__recommendations-meta {
  margin: 0;
  font-size: 0.9rem;
  color: var(--sakai-text-color-tertiary);
}

.learning-progress__recommendations-module {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-secondary);
}

.learning-progress__recommendations :deep(.ui-button--link) {
  align-self: flex-start;
}

.learning-progress__list {
  display: none;
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-4);
}

.learning-progress__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.learning-progress__list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
}

.learning-progress__list-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.learning-progress__list-header span {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.learning-progress__list-field {
  display: grid;
  gap: var(--sakai-space-2);
}

.learning-progress__list-field label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-muted);
}

.learning-assignments {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.learning-assignments__filters {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.learning-assignments__search {
  flex: 1 1 auto;
}

.learning-assignments__due-filter {
  flex: 0 0 auto;
  min-width: 12rem;
}

@media (min-width: 768px) {
  .learning-assignments__filters {
    flex-direction: row;
    align-items: flex-end;
  }
}

.learning-assignments__table {
  overflow-x: auto;
}

.learning-assignments__table :deep(table) {
  min-width: calc(var(--sakai-space-12) * 13);
}

.learning-assignments__list {
  display: none;
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-4);
}

.learning-assignments__attachment-link {
  color: var(--sakai-color-primary-600);
  font-weight: var(--sakai-font-weight-medium);
}

.learning-assignments__details {
  display: grid;
  gap: var(--sakai-space-2);
}

.learning-assignments__detail {
  display: grid;
  gap: var(--sakai-space-1);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  font-size: 0.9rem;
}

.learning-assignments__detail dt {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-weight: var(--sakai-font-weight-medium);
}

.learning-assignments__detail dd {
  margin: 0;
  text-align: end;
}

.learning-assignments__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.learning-assignments__list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
}

.learning-assignments__list-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.learning-assignments__list-header span {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.learning-assignments__list-description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.learning-assignments__list-action {
  justify-content: center;
}

.learning-discussions {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

.learning-discussions__grid {
  display: grid;
  gap: var(--sakai-space-6);
  grid-template-columns: minmax(0, 22rem) minmax(0, 1fr);
}

.learning-discussions__threads,
.learning-discussions__messages {
  width: 100%;
}

.learning-reviews {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

.learning-reviews__grid {
  display: grid;
  gap: var(--sakai-space-6);
  grid-template-columns: minmax(0, 24rem) minmax(0, 1fr);
}

.learning-reviews__form,
.learning-reviews__list {
  width: 100%;
}

@media (min-width: 1024px) {
  .learning-content__layout {
    flex-direction: row;
    align-items: flex-start;
  }

  .learning-content__accordion {
    flex: 0 0 22rem;
    max-height: calc(100vh - 220px);
  }

  .learning-content__outline {
    flex: 0 0 22rem;
    position: sticky;
    top: 1.5rem;
  }
}

@media (max-width: 768px) {
  .learning-page__tabs :deep(.ui-tabs__nav) {
    grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
    padding-inline: 0;
  }

  .learning-content__accordion {
    max-height: none;
  }

  .learning-content__viewer {
    padding: var(--sakai-space-3);
  }

  .learning-content__viewer-header {
    flex-direction: column;
    align-items: stretch;
  }

  .learning-content__viewer-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .learning-content__viewer-navigation {
    width: 100%;
  }

  .learning-content__viewer-navigation :deep(.ui-button) {
    width: 100%;
    justify-content: center;
  }

  .learning-content__outline-toggle {
    width: 100%;
    justify-content: center;
  }

  .learning-content__viewer-actions-group {
    width: 100%;
  }

  .learning-content__viewer-actions-group :deep(.ui-button) {
    width: 100%;
    justify-content: center;
  }

  .learning-content__viewer-action--reset {
    margin-inline-start: 0;
  }

  .learning-content__module-progress-text {
    flex-direction: column;
    align-items: flex-start;
  }

  .learning-content__lesson-button {
    flex-direction: column;
    align-items: flex-start;
  }

  .learning-content__lesson-status {
    align-self: flex-start;
  }

  .learning-progress__table,
  .learning-assignments__table {
    display: none;
  }

  .learning-progress__list,
  .learning-assignments__list {
    display: grid;
  }
}

@media (max-width: 1024px) {
  .learning-discussions__grid {
    grid-template-columns: 1fr;
  }

  .learning-reviews__grid {
    grid-template-columns: 1fr;
  }
}

.learning-resources {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.learning-resources__filters {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.learning-resources__search {
  flex: 1 1 auto;
}

.learning-resources__type-filter {
  flex: 0 0 auto;
  min-width: 12rem;
}

@media (min-width: 768px) {
  .learning-resources__filters {
    flex-direction: row;
    align-items: flex-end;
  }
}

.learning-resources__list {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.learning-resources__item {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  background: var(--sakai-surface);
}

@media (min-width: 720px) {
  .learning-resources__item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.learning-resources__details {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.learning-resources__details h3 {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.learning-resources__details p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.learning-resources__details span {
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-tertiary);
}

.learning-embed__hint {
  margin: 0 0 var(--sakai-space-3);
  color: var(--sakai-text-color-secondary);
}

.learning-embed__frame-wrapper {
  position: relative;
  padding-top: 56.25%;
  border-radius: var(--sakai-border-radius-lg);
  overflow: hidden;
  background: var(--sakai-surface-muted);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
}

.learning-embed__frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.learning-dialog__form {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.learning-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}
</style>
