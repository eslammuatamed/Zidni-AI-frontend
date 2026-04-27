<template>
  <section class="landing-courses">
    <div class="landing-courses__inner">
      <header class="landing-section-heading">
        <h2 class="landing-section-heading__title">{{ title }}</h2>
      </header>
      <div v-if="courses.length" class="landing-courses__grid">
        <article
          v-for="course in courses"
          :key="course.id"
          class="landing-course-card"
          role="button"
          tabindex="0"
          @click="onCourseClick(course)"
          @keydown.enter.prevent="onCourseClick(course)"
        >
          <div class="landing-course-card__media" :style="courseMedia(course)"></div>
          <div class="landing-course-card__body">
            <h3 class="landing-course-card__title">{{ course.title }}</h3>
            <UiTag v-if="course.type" color="primary" size="sm" class="landing-course-card__tag">
              {{ course.type }}
            </UiTag>
          </div>
        </article>
      </div>
      <div v-else class="landing-courses__empty">
        <UiIcon name="BookOutlined" :size="36" />
        <p>{{ t('landing.noCourses') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { withPlaceholder } from '@/utils/placeholders';
import { useRoute, useRouter } from 'vue-router';
import UiTag from '@/components/ui/UiTag.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { useTenantStore } from '@/stores/tenant';
import { isPreviewEnabled } from '@/utils/preview';
import { getStoredTenantSlug, setStoredTenantSlug } from '@/utils/tenantStorage';

interface LandingCourse {
  id: number;
  title: string;
  type?: string;
  thumbnailUrl?: string;
}

const props = defineProps<{ config: Record<string, any>; courses: LandingCourse[] }>();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

const title = computed(() => props.config?.title || t('courses.title'));

const tenantSlug = computed(
  () => (route.params.slug as string) || tenantStore.branding?.slug || getStoredTenantSlug().raw || 'demo'
);
const isPreview = computed(() => isPreviewEnabled(route.query.preview));

const courses = computed(() => props.courses || []);

const courseMedia = (course: LandingCourse) => {
  const image = withPlaceholder(course.thumbnailUrl, 'course');
  return {
    '--course-media-image': `url(${image})`
  } as Record<string, string>;
};

function onCourseClick(course: LandingCourse) {
  if (isPreview.value) {
    router
      .push({
        name: 'public-course-detail',
        params: { slug: tenantSlug.value, courseId: course.id },
        query: { preview: '1' }
      })
      .catch(() => undefined);
    return;
  }

  setStoredTenantSlug(tenantSlug.value);
  router
    .push({ name: 'login-student', params: { tenant: tenantSlug.value } })
    .catch(() => undefined);
}
</script>

<style scoped>
.landing-courses {
  padding-block: clamp(var(--sakai-space-10), 7vw, calc(var(--sakai-space-12) + var(--sakai-space-2)));
  background: transparent;
}

.landing-courses__inner {
  width: min(100%, calc(var(--sakai-container-max) + var(--sakai-space-6)));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
}

.landing-courses__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--sakai-space-5);
}

.landing-course-card {
  display: grid;
  grid-template-rows: 180px auto;
  border-radius: var(--landing-radius, var(--sakai-border-radius-xl));
  background: var(--landing-surface, var(--sakai-surface-card));
  border: 1px solid var(--landing-border, color-mix(in srgb, var(--sakai-border-color) 70%, transparent));
  box-shadow: var(--landing-shadow, var(--sakai-shadow-sm));
  text-decoration: none;
  color: inherit;
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.landing-course-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--landing-shadow-hover, var(--sakai-shadow-md));
}

.landing-course-card__media {
  position: relative;
  border-radius: var(--landing-radius, var(--sakai-border-radius-xl))
    var(--landing-radius, var(--sakai-border-radius-xl)) 0 0;
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
  background-image: var(--course-media-image);
  background-size: cover;
  background-position: center;
}

.landing-course-card__body {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-5);
}

.landing-course-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.landing-course-card__tag {
  justify-self: flex-start;
}

.landing-courses__empty {
  display: grid;
  place-items: center;
  gap: var(--sakai-space-3);
  padding: calc(var(--sakai-space-8) + var(--sakai-space-4));
  border-radius: var(--landing-radius, var(--sakai-border-radius-xl));
  border: 1px dashed var(--landing-border, color-mix(in srgb, var(--sakai-border-color) 65%, transparent));
  background: var(--landing-surface-soft, rgba(255, 255, 255, 0.7));
  color: var(--sakai-text-color-secondary);
}
</style>
