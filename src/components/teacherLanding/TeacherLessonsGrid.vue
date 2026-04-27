<template>
  <section class="teacher-lessons" id="courses">
    <div class="teacher-lessons__header">
      <div class="teacher-lessons__badge">{{ t('teacherLanding.lessons.badge') }}</div>
      <h2 class="teacher-lessons__title">{{ t('teacherLanding.lessons.title') }}</h2>
      <p class="teacher-lessons__subtitle">{{ t('teacherLanding.lessons.subtitle') }}</p>
    </div>
    <div v-if="loading" class="teacher-lessons__grid teacher-lessons__grid--skeleton">
      <article v-for="index in 4" :key="`skeleton-${index}`" class="teacher-lessons__card teacher-lessons__card--skeleton">
        <div class="teacher-lessons__media">
          <div class="teacher-lessons__skeleton teacher-lessons__skeleton--media"></div>
        </div>
        <div class="teacher-lessons__body">
          <div class="teacher-lessons__skeleton teacher-lessons__skeleton--title"></div>
          <div class="teacher-lessons__skeleton teacher-lessons__skeleton--subtitle"></div>
          <div class="teacher-lessons__skeleton teacher-lessons__skeleton--meta"></div>
        </div>
      </article>
    </div>
    <div v-else-if="courses.length" class="teacher-lessons__grid">
      <article
        v-for="(course, index) in courses"
        :key="course.id || course.title || index"
        class="teacher-lessons__card"
        role="button"
        tabindex="0"
        @click="onCourseClick(course)"
        @keydown.enter.prevent="onCourseClick(course)"
        @keydown.space.prevent="onCourseClick(course)"
      >
        <div class="teacher-lessons__media">
          <img :src="courseImage(course)" :alt="course.title || t('teacherLanding.lessons.title')" loading="lazy" />
        </div>
        <div class="teacher-lessons__body">
          <h3 class="teacher-lessons__lesson-title">{{ course.title }}</h3>
          <p v-if="course.subtitle" class="teacher-lessons__lesson-subtitle">{{ course.subtitle }}</p>
          <div v-if="courseDetails(course).length" class="teacher-lessons__details">
            <div v-for="detail in courseDetails(course)" :key="detail.label" class="teacher-lessons__detail">
              <span class="teacher-lessons__detail-label">{{ detail.label }}</span>
              <span class="teacher-lessons__detail-value">{{ detail.value }}</span>
            </div>
          </div>
          <div class="teacher-lessons__meta">
            <span v-for="tag in (course.tags || [])" :key="tag" class="teacher-lessons__tag">{{ tag }}</span>
            <span v-if="course.price != null" class="teacher-lessons__price">{{ formatPrice(course) }}</span>
          </div>
          <button type="button" class="teacher-lessons__cta">{{ ctaLabel(course) }}</button>
        </div>
      </article>
    </div>
    <div v-else class="teacher-lessons__empty">
      <p>{{ t('teacherLanding.lessons.empty') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { TeacherLandingCourse } from '@/services/teacherLanding.api';
import { withPlaceholder } from '@/utils/placeholders';

const props = defineProps<{
  courses: TeacherLandingCourse[];
  teacherSlug: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: 'course-click', course: TeacherLandingCourse): void;
}>();

const router = useRouter();
const { t, locale } = useI18n();

const courses = computed<TeacherLandingCourse[]>(() => props.courses);
const loading = computed(() => Boolean(props.loading));

function courseImage(course: TeacherLandingCourse) {
  return withPlaceholder(course.coverUrl, 'course');
}

function ensureIdentifier(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return String(value);
  }

  return '';
}

function resolveCourseIdentifier(course: TeacherLandingCourse): string {
  const record = course as Record<string, unknown> | null | undefined;
  const candidates = [
    course?.id ?? null,
    record?.['courseId'] ?? null,
    record?.['slug'] ?? null
  ];

  for (const candidate of candidates) {
    const identifier = ensureIdentifier(candidate ?? '');
    if (identifier) {
      return identifier;
    }
  }

  return '';
}

function onCourseClick(course: TeacherLandingCourse) {
  const courseId = resolveCourseIdentifier(course);
  const teacherSlug = ensureIdentifier(props.teacherSlug);

  if (!courseId || !teacherSlug) {
    return;
  }
  emit('course-click', course);
  trackLandingEvent('course_click', {
    id: ensureIdentifier(courseId),
    title: ensureIdentifier(course?.title)
  });

  router.push({
    name: 'public-course-detail',
    params: {
      slug: teacherSlug,
      courseId
    }
  });
}

function formatPrice(course: TeacherLandingCourse) {
  const amount = Number(course.price ?? 0);
  if (!Number.isFinite(amount)) return '';
  const currency = (course.currency || 'EGP').toUpperCase();
  try {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount}`;
  }
}

const detailLabels = computed(() => ({
  duration: t('teacherLanding.lessons.detailDuration'),
  lectures: t('teacherLanding.lessons.detailLectures')
}));

function findTagMatch(tags: string[], matcher: RegExp) {
  const match = tags.find((tag) => matcher.test(tag));
  return match ? match.trim() : '';
}

function courseDetails(course: TeacherLandingCourse) {
  const tags = Array.isArray(course.tags) ? course.tags.map((tag) => String(tag)) : [];
  const duration = findTagMatch(tags, /\b\d+\s*(?:h|hr|hour|hours|min|minute|minutes|س|ساعة|ساعات|د)\b/i);
  const lectures = findTagMatch(tags, /\b\d+\s*(?:lecture|lectures|lesson|lessons|محاضرة|محاضرات|درس|دروس)\b/i);
  const details: Array<{ label: string; value: string }> = [];
  if (duration) {
    details.push({ label: detailLabels.value.duration, value: duration });
  }
  if (lectures) {
    details.push({ label: detailLabels.value.lectures, value: lectures });
  }
  return details;
}

function ctaLabel(course: TeacherLandingCourse) {
  const amount = Number(course.price ?? 0);
  if (Number.isFinite(amount) && amount === 0) {
    return t('teacherLanding.lessons.ctaFree');
  }
  return t('teacherLanding.lessons.cta');
}

function trackLandingEvent(eventName: string, payload: Record<string, string>) {
  if (typeof window === 'undefined') {
    return;
  }
  const dataLayer = (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({ event: eventName, ...payload });
  }
}
</script>

<style scoped>
.teacher-lessons {
  padding: clamp(3.5rem, 7vw, 5rem) 1.5rem;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.04), transparent 45%);
}

.teacher-lessons__header {
  text-align: center;
  display: grid;
  gap: 0.85rem;
  margin-bottom: clamp(2rem, 6vw, 3rem);
}

.teacher-lessons__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 1.1rem;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.12);
  color: var(--teacher-color-secondary);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.teacher-lessons__title {
  margin: 0;
  font-size: clamp(2.1rem, 4.5vw, 2.8rem);
}

.teacher-lessons__subtitle {
  margin: 0;
  color: var(--teacher-color-text-secondary);
  max-width: 60ch;
  margin-inline: auto;
}

.teacher-lessons__grid {
  display: grid;
  gap: 1.75rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.teacher-lessons__grid--skeleton {
  pointer-events: none;
}

.teacher-lessons__card {
  position: relative;
  background: linear-gradient(180deg, var(--teacher-color-surface), rgba(248, 250, 252, 0.92));
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.10);
  cursor: pointer;
  display: grid;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.teacher-lessons__card--skeleton {
  cursor: default;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
}

.teacher-lessons__card--skeleton::after {
  display: none;
}

.teacher-lessons__card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent, rgba(59, 130, 246, 0.1));
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.teacher-lessons__card:hover {
  transform: translateY(-6px);
  box-shadow: 0 34px 64px rgba(15, 23, 42, 0.18);
}

.teacher-lessons__card:hover::after {
  opacity: 1;
}

.teacher-lessons__card:focus-visible {
  outline: none;
  transform: translateY(-6px);
  box-shadow: 0 34px 64px rgba(15, 23, 42, 0.18);
}

.teacher-lessons__card:focus-visible::after {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .teacher-lessons__card:hover,
  .teacher-lessons__card:focus-visible {
    transform: none;
  }

  .teacher-lessons__card:hover .teacher-lessons__media img,
  .teacher-lessons__card:focus-visible .teacher-lessons__media img {
    transform: none;
  }
}

.teacher-lessons__media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: rgba(59, 130, 246, 0.12);
}

.teacher-lessons__media::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.35), transparent 60%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.teacher-lessons__card:hover .teacher-lessons__media::before {
  opacity: 1;
}

.teacher-lessons__card:focus-visible .teacher-lessons__media::before {
  opacity: 1;

}

.teacher-lessons__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.teacher-lessons__card:hover .teacher-lessons__media img {
  transform: scale(1.05);
}

.teacher-lessons__card:focus-visible .teacher-lessons__media img {
  transform: scale(1.05);

}

.teacher-lessons__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 2.25rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.7), rgba(14, 165, 233, 0.6));
}

.teacher-lessons__body {
  position: relative;
  padding: 1.75rem;
  display: grid;
  gap: 0.85rem;
}

.teacher-lessons__details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.teacher-lessons__detail {
  display: flex;
  gap: 0.35rem;
  align-items: baseline;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  font-size: 0.75rem;
  color: var(--teacher-color-text-secondary);
}

.teacher-lessons__detail-label {
  font-weight: 600;
}

.teacher-lessons__detail-value {
  font-weight: 700;
  color: var(--teacher-color-text-primary);
}

.teacher-lessons__lesson-title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--teacher-color-text-primary);
}

.teacher-lessons__lesson-subtitle {
  margin: 0;
  color: var(--teacher-color-text-secondary);
  min-height: 2.4rem;
}

.teacher-lessons__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
}

.teacher-lessons__tag {
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--teacher-color-primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.teacher-lessons__price {
  margin-left: auto;
  font-weight: 700;
  color: var(--teacher-color-primary);
}

.teacher-lessons__cta {
  justify-self: start;
  border: none;
  border-radius: 999px;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
  background: rgba(37, 99, 235, 0.12);
  color: var(--teacher-color-primary);
}

.teacher-lessons__skeleton {
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.7), rgba(248, 250, 252, 0.95), rgba(226, 232, 240, 0.7));
  background-size: 200% 100%;
  animation: teacher-lessons-skeleton 1.4s ease infinite;
}

.teacher-lessons__skeleton--media {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.teacher-lessons__skeleton--title {
  height: 1.2rem;
  width: 70%;
}

.teacher-lessons__skeleton--subtitle {
  height: 0.9rem;
  width: 85%;
}

.teacher-lessons__skeleton--meta {
  height: 0.9rem;
  width: 55%;
}

@keyframes teacher-lessons-skeleton {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.teacher-lessons__empty {
  text-align: center;
  color: var(--teacher-color-text-secondary);
  padding: 3rem 1rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.2);
}
</style>
