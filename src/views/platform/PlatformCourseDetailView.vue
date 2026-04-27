<template>
  <ThemePage>
    <div class="platform-course-detail">
      <div v-if="loading" class="platform-course-detail__loading">
        <UiSkeleton height="220px" border-radius="24px" />
        <UiSkeleton height="28px" />
        <UiSkeleton height="18px" width="60%" />
        <UiSkeleton height="18px" width="45%" />
        <UiSkeleton height="44px" border-radius="12px" />
      </div>

      <UiAlert v-else-if="error" color="danger" variant="soft" class="platform-course-detail__alert">
        <span>{{ t('platform.courseDetail.notFound') }}</span>
        <UiButton :to="{ name: 'platform-courses' }" variant="outline" color="primary">
          {{ t('platform.courseDetail.backToCatalog') }}
        </UiButton>
      </UiAlert>

      <article v-else-if="course" class="platform-course-detail__card">
        <div class="platform-course-detail__cover" :style="coverStyle"></div>
        <header class="platform-course-detail__header">
          <UiBadge v-if="course.type" color="primary" variant="soft">{{ formatType(course.type) }}</UiBadge>
          <UiBadge v-if="course.level" color="secondary" variant="outline">{{ formatLevel(course.level) }}</UiBadge>
        </header>
        <h1>{{ course.title }}</h1>
        <p class="platform-course-detail__meta">
          <span>{{ t('platform.courseDetail.teacherBy', { name: course.teacher.name }) }}</span>
          <span v-if="course.language">• {{ course.language.toUpperCase() }}</span>
          <span v-if="course.createdAt">• {{ formatDate(course.createdAt) }}</span>
        </p>
        <p v-if="course.description" class="platform-course-detail__description">{{ course.description }}</p>
        <div class="platform-course-detail__cta">
          <UiButton :to="course.ctaRoute" color="primary" variant="solid">
            {{ t('platform.courseDetail.enrollCta') }}
          </UiButton>
          <div class="platform-course-detail__price" v-if="course.price != null">
            <span>{{ priceLabel }}</span>
          </div>
        </div>
        <section class="platform-course-detail__teacher" aria-labelledby="platform-course-teacher">
          <h2 id="platform-course-teacher">{{ t('platform.courseDetail.teacherSection') }}</h2>
          <div class="platform-course-detail__teacher-card">
            <div class="platform-course-detail__teacher-avatar">{{ teacherInitials }}</div>
            <div>
              <h3>{{ course.teacher.name }}</h3>
              <p class="platform-course-detail__teacher-stats">
                <span v-if="course.teacher.rating != null">
                  <UiIcon name="StarFilled" :size="16" />
                  {{ course.teacher.rating.toFixed(1) }}
                </span>
                <span v-if="course.teacher.ratingCount != null">
                  {{ t('platform.courseDetail.reviewCount', { count: course.teacher.ratingCount }) }}
                </span>
              </p>
              <UiButton :to="course.teacher.slug ? `/teacher/${course.teacher.slug}` : course.ctaRoute" variant="link">
                {{ t('platform.courseDetail.viewTeacher') }}
              </UiButton>
            </div>
          </div>
        </section>
      </article>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import { fetchPlatformCourseDetail, type PlatformCourseDetail } from '@/services/platformCatalog';
import { withPlaceholder } from '@/utils/placeholders';

const route = useRoute();
const { t, locale } = useI18n();

const course = ref<PlatformCourseDetail | null>(null);
const loading = ref(true);
const error = ref(false);

const courseId = computed(() => Number(route.params.id));

const coverStyle = computed(() => ({
  backgroundImage: `url(${withPlaceholder(course.value?.thumbnailUrl, 'course')})`
}));
const priceLabel = computed(() => {
  if (course.value?.price == null) return '';
  const currency = locale.value === 'ar' ? 'ج.م ' : '$';
  return currency + course.value.price.toLocaleString();
});
const teacherInitials = computed(() => {
  if (!course.value) return '';
  return course.value.teacher.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
});

const schemaOrg = computed(() => {
  if (!course.value) return '';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.value.title,
    description: course.value.description,
    inLanguage: course.value.language,
    provider: {
      '@type': 'Person',
      name: course.value.teacher.name,
      url: `${window.location.origin}/teacher/${course.value.teacher.slug}`
    }
  });
});

const schemaScriptEl = ref<HTMLScriptElement | null>(null);

watch(schemaOrg, (value) => {
  schemaScriptEl.value = upsertJsonLd('platform-course-schema', value);
});

onMounted(async () => {
  await loadCourse();
});

onBeforeUnmount(() => {
  if (schemaScriptEl.value?.parentNode) {
    schemaScriptEl.value.parentNode.removeChild(schemaScriptEl.value);
  }
  schemaScriptEl.value = null;
});

async function loadCourse() {
  loading.value = true;
  error.value = false;
  try {
    const data = await fetchPlatformCourseDetail(courseId.value);
    course.value = data;
    document.title = `${data.title} — ${t('platform.courseDetail.metaSuffix')}`;
    setMeta('description', data.description || '');
    setMeta('og:title', data.title);
    setMeta('og:description', data.description || '');
    const ogImage = withPlaceholder(data.thumbnailUrl, 'course');
    setMeta('og:image', ogImage);
  } catch (err) {
    console.warn('[platform] failed to load course detail', err);
    error.value = true;
    course.value = null;
  } finally {
    loading.value = false;
  }
}

function formatType(value?: string) {
  if (!value) return '';
  return t(`platform.courses.types.${value.toLowerCase()}`, value);
}

function formatLevel(value?: string) {
  if (!value) return '';
  return t(`platform.courses.levels.${value.toLowerCase()}`, value);
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function setMeta(name: string, content: string) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertJsonLd(id: string, json: string) {
  if (typeof window === 'undefined') return null;
  let script = document.head.querySelector(`script[data-json-ld="${id}"]`) as HTMLScriptElement | null;
  if (!json) {
    if (script?.parentNode) {
      script.parentNode.removeChild(script);
    }
    return null;
  }
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-json-ld', id);
    document.head.appendChild(script);
  }
  script.textContent = json;
  return script;
}
</script>

<style scoped>
.platform-course-detail {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 6vw, 3rem) clamp(3rem, 6vw, 4rem);
  background: var(--sakai-surface-section);
  min-height: 100vh;
}

.platform-course-detail__card {
  background: var(--sakai-surface-card);
  border-radius: 1.75rem;
  padding: clamp(2rem, 4vw, 3rem);
  box-shadow: var(--sakai-shadow-lg);
  display: grid;
  gap: 1.5rem;
}

.platform-course-detail__cover {
  aspect-ratio: 16 / 9;
  border-radius: 1.25rem;
  background-size: cover;
  background-position: center;
}

.platform-course-detail__header {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.platform-course-detail h1 {
  margin: 0;
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  color: var(--sakai-text-strong);
}

.platform-course-detail__meta {
  margin: 0;
  color: var(--sakai-text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.platform-course-detail__description {
  margin: 0;
  color: var(--sakai-text-color);
  line-height: 1.6;
}

.platform-course-detail__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.platform-course-detail__price {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--sakai-text-strong);
}

.platform-course-detail__teacher {
  display: grid;
  gap: 1rem;
}

.platform-course-detail__teacher-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
}

.platform-course-detail__teacher-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--sakai-primary) 18%, transparent);
  color: var(--sakai-primary-contrast);
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.platform-course-detail__teacher h3 {
  margin: 0 0 0.25rem;
  color: var(--sakai-text-strong);
}

.platform-course-detail__teacher-stats {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin: 0 0 0.5rem;
  color: var(--sakai-text-muted);
}

.platform-course-detail__alert {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.platform-course-detail__loading {
  display: grid;
  gap: 1rem;
}
</style>
