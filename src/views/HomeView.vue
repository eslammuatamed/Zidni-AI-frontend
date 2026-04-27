<template>
  <ThemePage>
  <div class="home">
    <section class="hero" :style="heroStyle">
      <div class="hero-overlay"></div>
      <div class="content">
        <h1>{{ t('landing.heroTitle') }}</h1>
        <p class="lead">{{ t('landing.heroSubtitle') }}</p>
        <UiButton color="primary" class="home__hero-btn">{{ t('landing.cta') }}</UiButton>
      </div>
      <div class="branding" v-if="branding">
        <p class="teacher-name">{{ branding.name }}</p>
        <p class="teacher-subject" v-if="branding.subject">{{ branding.subject }}</p>
        <p v-if="branding.branding?.tagline" class="teacher-tagline">{{ branding.branding?.tagline }}</p>
      </div>
    </section>

    <section class="features" v-if="featureItems.length">
      <div class="features-inner">
        <header class="section-heading">
          <h2>{{ t('landing.featuresTitle') }}</h2>
          <p v-if="featuresSubtitle" class="section-subtitle">{{ featuresSubtitle }}</p>
        </header>
        <div class="features-grid">
          <article v-for="item in featureItems" :key="item.title" class="feature-card">
            <div class="feature-icon">
              <UiIcon :name="item.icon" :size="28" />
            </div>
            <h3 class="feature-title">{{ item.title }}</h3>
            <p class="feature-description">{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="courses">
      <div class="courses-inner">
        <header class="section-heading">
          <h2>{{ t('courses.title') }}</h2>
          <p class="section-subtitle">{{ t('courses.subtitle') }}</p>
        </header>

        <UiAlert v-if="loadError" color="danger" variant="soft" class="mb-4">
          {{ t('landing.coursesError') }}
        </UiAlert>

        <div v-if="isLoading" class="courses-grid">
          <div v-for="index in 3" :key="`skeleton-${index}`" class="course-card course-card--loading">
            <div class="course-skeleton__image"></div>
            <div class="course-skeleton__text"></div>
            <div class="course-skeleton__text course-skeleton__text--short"></div>
          </div>
        </div>

        <div v-else-if="courses.length" class="courses-grid">
          <article v-for="course in courses" :key="course.id" class="course-card">
            <div class="course-image" :style="{ backgroundImage: `url(${courseImage(course)})` }"></div>
            <div class="course-body">
              <h3 class="course-title">{{ course.title }}</h3>
              <UiBadge v-if="course.type" color="primary" variant="soft" class="course-type">
                {{ course.type }}
              </UiBadge>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <UiIcon name="BookOutlined" :size="42" />
          </div>
          <p>{{ t('landing.noCourses') }}</p>
        </div>
      </div>
    </section>

    <section v-if="ctaTitle" class="cta">
      <div class="cta-card">
        <div>
          <h2>{{ ctaTitle }}</h2>
          <p>{{ ctaSubtitle }}</p>
        </div>
        <UiButton color="primary" class="cta-action">
          {{ t('landing.cta') }}
        </UiButton>
      </div>
    </section>
  </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTenantStore } from '@/stores/tenant';
import api from '@/services/api';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { getStoredTenantSlug } from '@/utils/tenantStorage';
import { withPlaceholder } from '@/utils/placeholders';

const tenantStore = useTenantStore();
const { t, te } = useI18n();

const branding = computed(() => tenantStore.branding);
const courses = ref<Array<{ id: number; title: string; type: string; thumbnailUrl?: string }>>([]);
const isLoading = ref(false);
const loadError = ref(false);

const featureItems = computed(() => {
  const definitions = [
    { icon: 'VideoCameraOutlined', titleKey: 'landing.features.live', descriptionKey: 'landing.features.liveDescription' },
    { icon: 'AuditOutlined', titleKey: 'landing.features.assessments', descriptionKey: 'landing.features.assessmentsDescription' },
    { icon: 'SafetyOutlined', titleKey: 'landing.features.branding', descriptionKey: 'landing.features.brandingDescription' },
    { icon: 'SafetyCertificateOutlined', titleKey: 'landing.features.support', descriptionKey: 'landing.features.supportDescription' }
  ];

  return definitions
    .map((item) => ({
      icon: item.icon,
      title: te(item.titleKey) ? t(item.titleKey) : '',
      description: te(item.descriptionKey) ? t(item.descriptionKey) : ''
    }))
    .filter((item) => item.title && item.description);
});

const featuresSubtitle = computed(() => (te('landing.featuresSubtitle') ? t('landing.featuresSubtitle') : ''));
const ctaTitle = computed(() => (te('landing.ctaTitle') ? t('landing.ctaTitle') : ''));
const ctaSubtitle = computed(() => (te('landing.ctaSubtitle') ? t('landing.ctaSubtitle') : ''));
const slug = computed(() => branding.value?.slug || getStoredTenantSlug().raw || 'demo');

let isActive = true;

async function loadCourses() {
  if (!isActive) return;
  isLoading.value = true;
  loadError.value = false;
  try {
    const tenant = slug.value;
    const { data } = await api.get(`/api/public/tenants/${tenant}/courses`, {
      params: { page: 0, size: 6 }
    });
    if (!isActive) {
      return;
    }
    courses.value = data.items || [];
  } catch (error) {
    if (!isActive) {
      return;
    }
    loadError.value = true;
    courses.value = [];
    console.warn('Failed to load courses', error);
  } finally {
    if (isActive) {
      isLoading.value = false;
    }
  }
}

function courseImage(course: { thumbnailUrl?: string }) {
  return withPlaceholder(course.thumbnailUrl, 'course');
}

onMounted(loadCourses);

watch(
  () => branding.value?.slug,
  (next, prev) => {
    if (next && next !== prev) {
      loadCourses();
    }
  }
);

onBeforeUnmount(() => {
  isActive = false;
});

const heroStyle = computed(() => {
  const colors = branding.value?.branding?.colors as Record<string, string> | undefined;
  const start = colors?.primary || 'var(--sakai-primary)';
  const end = colors?.secondary || 'var(--sakai-secondary)';
  return {
    '--hero-start': start,
    '--hero-end': end,
    background: `linear-gradient(135deg, ${start}, ${end})`
  } as Record<string, string>;
});
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  padding: clamp(4rem, 8vw, 6rem) clamp(1.5rem, 6vw, 3rem) 6rem;
}

.hero {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: clamp(2rem, 6vw, 4rem);
  padding: clamp(3rem, 5vw, 5rem);
  border-radius: 28px;
  color: var(--sakai-text-color-inverse);
  box-shadow: var(--sakai-shadow-hero);
  background: linear-gradient(
    135deg,
    var(--hero-start, var(--sakai-primary-600)),
    var(--hero-end, var(--sakai-secondary-500))
  );
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, var(--sakai-white-alpha-25) 0%, transparent 55%),
    radial-gradient(circle at 80% 0%, var(--sakai-white-alpha-18) 0%, transparent 45%);
  opacity: 0.9;
  pointer-events: none;
}

.content {
  position: relative;
  z-index: 1;
  max-width: 36rem;
}

.content h1 {
  font-size: clamp(2.4rem, 4vw, 3.4rem);
  margin-bottom: 1rem;
  line-height: 1.1;
}

.content .lead {
  font-size: 1.15rem;
  line-height: 1.6;
  opacity: 0.92;
  margin: 0;
}

.home__hero-btn {
  margin-top: 1.75rem;
}

.branding {
  position: relative;
  z-index: 1;
  align-self: stretch;
  justify-self: end;
  background: var(--sakai-white-alpha-10);
  border-radius: 20px;
  padding: 1.75rem;
  backdrop-filter: blur(16px);
  max-width: 320px;
}

.teacher-name {
  font-weight: 700;
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.teacher-subject,
.teacher-tagline {
  margin: 0;
  opacity: 0.85;
}

.teacher-tagline {
  margin-top: 0.5rem;
  font-size: 0.95rem;
}

.features {
  background: linear-gradient(180deg, color-mix(in srgb, var(--sakai-primary) 8%, transparent), transparent);
  padding: 0 0 1rem;
}

.features-inner,
.courses-inner,
.cta-card {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

.features-inner {
  padding: 0 clamp(1.5rem, 5vw, 2.5rem);
}

.features-grid {
  margin-top: clamp(1.5rem, 3vw, 2.5rem);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.section-heading h2 {
  font-size: clamp(2rem, 3vw, 2.6rem);
  margin: 0;
}

.section-subtitle {
  margin-top: 0.5rem;
  color: color-mix(in srgb, var(--sakai-text-color) 72%, transparent);
  max-width: 36rem;
}


.feature-card {
  height: 100%;
  border-radius: 22px;
  padding: 1.75rem;
  background: color-mix(in srgb, var(--sakai-surface) 85%, transparent);
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 30px -20px color-mix(in srgb, var(--sakai-primary) 45%, color-mix(in srgb, var(--sakai-text-color) 25%, transparent));
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  color: var(--sakai-primary);
  margin-bottom: 1rem;
}

.feature-title {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.feature-description {
  margin: 0;
  color: color-mix(in srgb, var(--sakai-text-color) 75%, transparent);
  line-height: 1.6;
}


.courses {
  padding: 0 clamp(1.5rem, 5vw, 3rem);
}

.courses-inner {
  background: var(--sakai-surface);
  border-radius: 28px;
  padding: clamp(2.5rem, 5vw, 3.5rem);
  box-shadow: 0 40px 70px -60px color-mix(
      in srgb,
      var(--sakai-primary) 50%,
      color-mix(in srgb, var(--sakai-text-color) 35%, transparent)
    );
}

.courses-grid {
  margin-top: clamp(1.25rem, 2.2vw, 2rem);
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.course-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 22px;
  background: color-mix(in srgb, var(--sakai-surface) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 10%, transparent);
  box-shadow: var(--sakai-shadow-md);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.course-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 35px -18px color-mix(in srgb, var(--sakai-primary) 35%, color-mix(in srgb, var(--sakai-text-color) 35%, transparent));
}

.course-card--loading {
  gap: 0;
  pointer-events: none;
}

.course-image {
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height: 180px;
}

.course-body {
  padding: 1.5rem;
}

.course-title {
  font-size: 1.15rem;
  margin: 0 0 0.75rem;
  color: var(--sakai-text-color);
}

.course-type {
  align-self: flex-start;
}

.course-skeleton__image {
  height: 180px;
  border-radius: 22px 22px 0 0;
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.course-skeleton__text {
  height: 14px;
  margin: 12px 1.5rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--sakai-primary) 10%, transparent);
}

.course-skeleton__text--short {
  width: 45%;
}

.empty-state {
  margin-top: 2.5rem;
  text-align: center;
  color: color-mix(in srgb, var(--sakai-text-color) 70%, transparent);
  display: grid;
  gap: 0.75rem;
  justify-items: center;
}

.empty-icon {
  color: var(--sakai-primary);
}

.cta {
  padding: 0 clamp(1.5rem, 5vw, 3rem);
}

.cta-card {
  background: linear-gradient(135deg, var(--sakai-secondary), var(--sakai-primary));
  border-radius: 28px;
  padding: clamp(3rem, 5vw, 4rem);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: var(--sakai-text-color-inverse);
  box-shadow: var(--sakai-shadow-hero);
}

.cta-action {
  align-self: flex-start;
}

.cta-card h2 {
  margin: 0 0 0.75rem;
  font-size: clamp(2rem, 3vw, 2.6rem);
}

.cta-card p {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.6;
  opacity: 0.9;
}

@media (min-width: 900px) {
  .cta-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .cta-card div {
    max-width: 520px;
  }
}

@media (max-width: 600px) {
  .branding {
    justify-self: stretch;
    max-width: none;
  }
}
</style>
