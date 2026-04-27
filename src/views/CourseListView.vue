<template>
  <ThemePage :title="t('courses.title')" :subtitle="t('courses.subtitle')">
    <template #actions>
      <UiButton
        color="primary"
        prepend-icon="FolderAddOutlined"
        @click="createCourse"
      >
        {{ t("courses.new") }}
      </UiButton>
    </template>

    <section
      v-if="!loading && courses.length"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      aria-label="course catalog"
    >
      <UiCard
        v-for="course in courses"
        :key="course.id"
        class="course-list__card"
        hover
        role="button"
        tabindex="0"
        :aria-label="course.title"
        @click="editCourse(course.id)"
        @keyup.enter.prevent="editCourse(course.id)"
        @keyup.space.prevent="editCourse(course.id)"
      >
        <article class="course-card">
          <div class="course-card__media">
            <img
              :src="courseImage(course)"
              :alt="course.title || t('courses.untitled')"
            />
          </div>
          <div class="course-card__body">
            <div class="course-card__header">
              <h3 class="course-card__title">{{ course.title }}</h3>
              <UiBadge color="secondary">{{ course.type }}</UiBadge>
            </div>
            <p class="course-card__meta">
              {{ course.level || t("courses.levelDefault") }}
            </p>
            <div class="course-card__footer">
              <span class="course-card__price">{{ formatPrice(course) }}</span>
              <UiIcon name="RightOutlined" class="course-card__arrow" />
            </div>
          </div>
          <div class="course-card__actions" @click.stop>
            <UiButton
              size="sm"
              variant="outline"
              color="secondary"
              prepend-icon="EyeOutlined"
              @click="viewCourse(course.id)"
            >
              {{ t("courses.actions.view") }}
            </UiButton>
            <UiButton
              size="sm"
              variant="outline"
              color="primary"
              prepend-icon="EditOutlined"
              @click="editCourse(course.id)"
            >
              {{ t("courses.actions.edit") }}
            </UiButton>
            <UiButton
              size="sm"
              variant="outline"
              color="danger"
              prepend-icon="DeleteOutlined"
              :disabled="deletingCourseId === course.id"
              @click="confirmDeleteCourse(course)"
            >
              {{
                deletingCourseId === course.id
                  ? t("common.deleting")
                  : t("courses.actions.delete")
              }}
            </UiButton>
          </div>
        </article>
      </UiCard>
    </section>

    <section
      v-else-if="loading"
      class="course-list course-list--loading"
      aria-live="polite"
      aria-busy="true"
    >
      <UiCard
        v-for="placeholder in 6"
        :key="placeholder"
        class="course-list__card course-list__card--loading"
        aria-hidden="true"
      >
        <article class="course-card course-card--loading">
          <UiSkeleton height="190px" border-radius="24px" animation="wave" />
          <div class="course-card__body">
            <UiSkeleton height="24px" width="70%" animation="wave" />
            <UiSkeleton height="16px" width="50%" animation="wave" />
            <UiSkeleton height="20px" width="60%" animation="wave" />
          </div>
          <div class="course-card__actions">
            <UiSkeleton
              height="36px"
              width="112px"
              shape="pill"
              animation="wave"
            />
            <UiSkeleton
              height="36px"
              width="96px"
              shape="pill"
              animation="wave"
            />
            <UiSkeleton
              height="36px"
              width="104px"
              shape="pill"
              animation="wave"
            />
          </div>
        </article>
      </UiCard>
    </section>

    <UiCard v-else class="course-list__empty" aria-live="polite">
      <div class="course-list__empty-content">
        <UiIcon name="FolderOutlined" class="course-list__empty-icon" />
        <h3>{{ t("courses.empty") }}</h3>
        <p>{{ t("courses.subtitle") }}</p>
        <UiButton
          color="primary"
          prepend-icon="FolderAddOutlined"
          @click="createCourse"
        >
          {{ t("courses.new") }}
        </UiButton>
      </div>
    </UiCard>
  </ThemePage>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useCoursesStore, type CourseSummary } from "@/stores/courses";
import { useI18n } from "vue-i18n";
import { withPlaceholder } from "@/utils/placeholders";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";

const router = useRouter();
const store = useCoursesStore();
const { t, locale } = useI18n();

const courses = computed(() => store.list);
const loading = computed(() => store.loading);
const deletingCourseId = ref<number | null>(null);

onMounted(async () => {
  if (!store.list.length) {
    await store.fetchCourses();
  }
});

const editCourse = (id: number) => {
  router.push({ name: "teacher-course", params: { courseId: id } });
};

const createCourse = async () => {
  const id = await store.createCourse({
    title: t("courses.untitled"),
    type: "recorded",
    price: 0,
  });
  router.push({ name: "teacher-course", params: { courseId: id } });
};

const viewCourse = (id: number) => {
  router.push({ name: "public-course-detail", params: { courseId: id } });
};

const courseImage = (course: CourseSummary) =>
  withPlaceholder(course.thumbnailUrl, "course");

const confirmDeleteCourse = async (course: CourseSummary) => {
  const courseTitle = course.title || t("courses.untitled");
  if (!confirm(t("courses.deleteConfirm", { title: courseTitle }))) {
    return;
  }

  deletingCourseId.value = course.id;
  try {
    await store.deleteCourse(course.id);
  } finally {
    deletingCourseId.value = null;
  }
};

const formatPrice = (course: CourseSummary) => {
  const amount = course.price || 0;
  const currency = (course.currency || "EGP").toUpperCase();
  try {
    return new Intl.NumberFormat(locale.value === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};
</script>

<style scoped>
/* .course-list {
  display: grid;
  gap: var(--sakai-space-6);
  grid-template-columns: repeat(
    auto-fit,
    minmax(calc(var(--sakai-space-12) * 4), 1fr)
  );
  grid-auto-rows: 1fr;
  align-items: stretch;
  justify-items: stretch;
} */

.course-list__card {
  cursor: pointer;
  height: 100%;
}

.course-list__card:focus-visible {
  outline: none;
  box-shadow: var(--sakai-shadow-focus);
}

.course-card {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  height: 100%;
}

.course-card__media {
  position: relative;
  overflow: hidden;
  border-radius: var(--sakai-border-radius-lg);
  aspect-ratio: 16 / 9;
  background: var(--sakai-surface-alt);
}

.course-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sakai-gradient-secondary);
  color: var(--sakai-text-color-inverse);
  font-size: var(--sakai-font-size-xl);
  font-weight: var(--sakai-font-weight-semibold);
}

.course-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  flex: 1;
}

.course-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.course-card__title {
  margin: 0;
  font-size: var(--sakai-font-size-lg);
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
  flex: 1;
}

.course-card__meta {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: var(--sakai-font-size-sm);
}

.course-card__footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  color: var(--sakai-text-color);
  font-weight: var(--sakai-font-weight-semibold);
}

.course-card__actions {
  margin-top: var(--sakai-space-4);
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
}

.course-card__price {
  font-size: var(--sakai-font-size-md);
}

.course-card__arrow {
  color: var(--sakai-text-color-muted);
  transition: transform var(--sakai-transition-duration)
    var(--sakai-transition-ease);
}

.course-list__card:hover .course-card__arrow,
.course-list__card:focus-visible .course-card__arrow {
  transform: translateX(var(--sakai-space-1));
}

/* Prevent hover elevation from visually offsetting the first card in RTL layouts */
.course-list__card.ui-card--hover:hover,
.course-list__card.ui-card--hover:focus-visible {
  transform: none;
  box-shadow: var(--sakai-shadow-lg);
}

.course-list--loading {
  display: grid;
  gap: var(--sakai-space-6);
  grid-template-columns: repeat(
    auto-fit,
    minmax(calc(var(--sakai-space-12) * 4), 1fr)
  );
  margin-top: var(--sakai-space-6);
}

.course-list__card--loading {
  cursor: default;
  pointer-events: none;
}

.course-card--loading {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.course-card--loading .course-card__body {
  gap: var(--sakai-space-3);
}

.course-card--loading .course-card__actions {
  margin-top: 0;
  display: flex;
  gap: var(--sakai-space-3);
}

.course-list__empty {
  margin-top: var(--sakai-space-6);
  text-align: center;
}

.course-list__empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sakai-space-4);
}

.course-list__empty-content h3 {
  margin: 0;
  font-size: var(--sakai-font-size-lg);
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.course-list__empty-content p {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  line-height: var(--sakai-line-height-lg);
}

.course-list__empty-icon {
  color: var(--sakai-text-color-muted);
}

@media (max-width: 768px) {
  .course-list,
  .course-list--loading {
    grid-template-columns: repeat(
      auto-fit,
      minmax(calc(var(--sakai-space-12) * 3 + var(--sakai-space-8)), 1fr)
    );
  }
}
</style>
