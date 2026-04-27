<template>
  <section class="teacher-public-tabs">
    <header class="teacher-public-tabs__hero" :style="heroStyle">
       <div class="teacher-public-tabs__hero-body">
        <div class="teacher-public-tabs__hero-content">
          <span v-if="teacherSubject" class="teacher-public-tabs__hero-pill">{{ teacherSubject }}</span>
          <h1 class="teacher-public-tabs__hero-title">{{ heroTitle }}</h1>
          <p v-if="heroSubtitle" class="teacher-public-tabs__hero-subtitle">{{ heroSubtitle }}</p>
          <div v-if="heroHighlights.length" class="teacher-public-tabs__hero-highlights">
            <span
              v-for="(highlight, index) in heroHighlights"
              :key="`hero-highlight-${index}-${highlight}`"
              class="teacher-public-tabs__hero-chip"
            >
              <UiIcon name="CheckCircleOutlined" :size="16" />
              <span>{{ highlight }}</span>
            </span>
          </div>
          <div v-if="heroCtaLabel" class="teacher-public-tabs__hero-actions">
            <UiButton class="teacher-public-tabs__hero-cta" color="primary" size="lg" @click="onHeroCta">
              {{ heroCtaLabel }}
            </UiButton>
          </div>
          <figure v-if="heroQuote" class="teacher-public-tabs__hero-quote">
            <blockquote>“{{ heroQuote }}”</blockquote>
            <figcaption v-if="heroQuoteAuthor">— {{ heroQuoteAuthor }}</figcaption>
          </figure>
        </div>
        <aside class="teacher-public-tabs__hero-profile">
          <div class="teacher-public-tabs__hero-photo">
            <img :src="teacherPhoto" :alt="teacherName" loading="lazy" />
          </div>
          <div class="teacher-public-tabs__hero-card">
            <h2 class="teacher-public-tabs__hero-name">{{ teacherName }}</h2>
            <p v-if="teacherTagline" class="teacher-public-tabs__hero-tagline">{{ teacherTagline }}</p>
            <p v-else-if="teacherStorySnippet" class="teacher-public-tabs__hero-tagline">{{ teacherStorySnippet }}</p>
            <div v-if="heroStats.length" class="teacher-public-tabs__hero-stat-grid">
              <div
                v-for="stat in heroStats"
                :key="`hero-stat-${stat.label}`"
                class="teacher-public-tabs__hero-stat"
              >
                <span class="teacher-public-tabs__hero-stat-value">{{ stat.value }}</span>
                <span class="teacher-public-tabs__hero-stat-label">{{ stat.label }}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </header>

    <div v-if="supportingStats.length || supportingHighlights.length" class="teacher-public-tabs__summary">
      <div v-if="supportingStats.length" class="teacher-public-tabs__stats">
        <div
          v-for="stat in supportingStats"
 
          :key="`${stat.label}-${stat.value}`"
          class="teacher-public-tabs__stat"
        >
          <span class="teacher-public-tabs__stat-value">{{ stat.value }}</span>
          <span class="teacher-public-tabs__stat-label">{{ stat.label }}</span>
        </div>
      </div>
       <ul v-if="supportingHighlights.length" class="teacher-public-tabs__highlights">
        <li
          v-for="(highlight, index) in supportingHighlights"
          :key="`supporting-highlight-${index}-${highlight}`"
          class="teacher-public-tabs__highlight"
        >
 
          <UiIcon name="CheckCircleOutlined" :size="18" />
          <span>{{ highlight }}</span>
        </li>
      </ul>
    </div>

    <section v-if="lessons.length" class="teacher-public-tabs__lessons">
      <header class="teacher-public-tabs__lessons-header">
        <h3>{{ t('publicLandingTabs.lessonsTitle') }}</h3>
        <p>{{ t('publicLandingTabs.lessonsSubtitle') }}</p>
      </header>
      <div class="teacher-public-tabs__lessons-grid">
        <article
          v-for="lesson in lessons"
          :key="lesson.key"
          class="teacher-public-tabs__lesson"
          @click="onLessonClick"
        >
          <h4 class="teacher-public-tabs__lesson-title">{{ lesson.title }}</h4>
          <p v-if="lesson.description" class="teacher-public-tabs__lesson-description">{{ lesson.description }}</p>
          <span class="teacher-public-tabs__lesson-cta">{{ t('publicLandingTabs.lessonsCta') }}</span>
        </article>
      </div>
    </section>

    <UiTabs
      v-model="activeTab"
      class="teacher-public-tabs__nav"
      :tabs="tabItems"
      variant="pill"
      grow
    />

    <section v-if="activeTab === 'about'" class="teacher-public-tabs__panel">
      <UiCard>
        <template #title>{{ t('publicLandingTabs.aboutTitle') }}</template>
        <p v-if="teacherBio" class="teacher-public-tabs__bio">{{ teacherBio }}</p>
        <p v-else class="teacher-public-tabs__empty">{{ t('publicLandingTabs.aboutEmpty') }}</p>
      </UiCard>
    </section>

    <section v-else-if="activeTab === 'work'" class="teacher-public-tabs__panel">
      <UiCard>
        <template #title>{{ t('publicLandingTabs.workTitle') }}</template>
        <div v-if="courses && courses.length" class="teacher-public-tabs__courses">
          <article v-for="course in courses" :key="course.id || course.title" class="teacher-public-tabs__course">
            <div class="teacher-public-tabs__course-thumb" :style="courseThumbnailStyle(course)"></div>
            <div class="teacher-public-tabs__course-body">
              <h3 class="teacher-public-tabs__course-title">{{ course.title }}</h3>
              <p v-if="course.description" class="teacher-public-tabs__course-description">{{ course.description }}</p>
            </div>
          </article>
        </div>
        <p v-else class="teacher-public-tabs__empty">{{ t('publicLandingTabs.workEmpty') }}</p>
      </UiCard>
    </section>

    <section v-else-if="activeTab === 'register'" class="teacher-public-tabs__panel">
      <UiCard>
        <template #title>{{ t('publicLandingTabs.registerTitle') }}</template>
        <p class="teacher-public-tabs__helper">{{ t('publicLandingTabs.registerDescription', { teacher: teacherName }) }}</p>
        <UiButton color="primary" size="lg" class="teacher-public-tabs__action" @click="goToAuth('register')">
          {{ t('publicLandingTabs.registerAction') }}
        </UiButton>
      </UiCard>
    </section>

    <section v-else-if="activeTab === 'login'" class="teacher-public-tabs__panel">
      <UiCard>
        <template #title>{{ t('publicLandingTabs.loginTitle') }}</template>
        <p class="teacher-public-tabs__helper">{{ t('publicLandingTabs.loginDescription', { teacher: teacherName }) }}</p>
        <UiButton color="secondary" size="lg" class="teacher-public-tabs__action" @click="goToAuth('login')">
          {{ t('publicLandingTabs.loginAction') }}
        </UiButton>
      </UiCard>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { setStoredTenantSlug } from '@/utils/tenantStorage';
import UiTabs from '@/components/ui/UiTabs.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { withPlaceholder } from '@/utils/placeholders';
import { buildTenantUrl } from '@/lib/host';

interface CoursePreview {
  id?: number | string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
}

const props = defineProps<{
  slug: string;
  branding?: Record<string, any> | null;
  courses?: CoursePreview[] | null;
}>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const brandingSource = computed(() => {
  const root = props.branding;
  if (root && typeof root === 'object') {
    const nested = (root as Record<string, any>).branding;
    if (nested && typeof nested === 'object') {
      return nested as Record<string, any>;
    }
    return root as Record<string, any>;
  }
  return {} as Record<string, any>;
});

const teacherName = computed(
  () => props.branding?.name || brandingSource.value.name || t('publicLandingTabs.fallbackName')
);
const teacherSubject = computed(
  () => props.branding?.subject || brandingSource.value.subject || ''
);
const teacherTagline = computed(() => {
  const source = brandingSource.value;
  if (typeof source.tagline === 'string' && source.tagline.trim().length) {
    return source.tagline;
  }
  return props.branding?.tagline || '';
});
const teacherBio = computed(() => {
  const source = brandingSource.value;
  if (typeof source.bio === 'string' && source.bio.trim().length) {
    return source.bio;
  }
  return props.branding?.bio || '';
});

 const teacherStorySnippet = computed(() => {
  const bio = teacherBio.value;
  if (!bio) return '';
  if (bio.length <= 140) {
    return bio;
  }
  return `${bio.slice(0, 137).trimEnd()}…`;
});

 
const courses = computed(() => props.courses || []);

const heroConfig = computed(() => (brandingSource.value.hero as Record<string, any>) || {});

const themeColors = computed(() => {
  const colors = (brandingSource.value.colors as Record<string, any>) || {};
  return {
    primary: typeof colors.primary === 'string' ? colors.primary : 'var(--sakai-primary-600)',
    secondary: typeof colors.secondary === 'string' ? colors.secondary : 'var(--sakai-secondary-500)',
    accent: typeof colors.accent === 'string' ? colors.accent : 'var(--sakai-info-500)'
  };
});

const heroGradient = computed(() => {
  const heroColors = (heroConfig.value.colors as Record<string, any>) || (heroConfig.value.background as Record<string, any>) || {};
  const start =
    typeof heroColors.start === 'string'
      ? heroColors.start
      : typeof heroColors.from === 'string'
        ? heroColors.from
        : themeColors.value.primary;
  const end =
    typeof heroColors.end === 'string'
      ? heroColors.end
      : typeof heroColors.to === 'string'
        ? heroColors.to
        : themeColors.value.secondary;
  return { start, end };
});

const heroStyle = computed(() => ({
  '--teacher-hero-gradient': `linear-gradient(120deg, ${heroGradient.value.start}, ${heroGradient.value.end})`
}));

const heroTitle = computed(() => {
  const hero = heroConfig.value;
  if (typeof hero.title === 'string' && hero.title.trim().length) {
    return hero.title.trim();
  }
  if (typeof brandingSource.value.headline === 'string' && brandingSource.value.headline.trim().length) {
    return brandingSource.value.headline.trim();
  }
  return teacherName.value;
});

const heroSubtitle = computed(() => {
  const hero = heroConfig.value;
  const subtitle =
    (typeof hero.subtitle === 'string' && hero.subtitle.trim()) ||
    (typeof hero.description === 'string' && hero.description.trim());
  if (subtitle) return subtitle;
  return teacherTagline.value;
});

const heroQuote = computed(() => {
  const hero = heroConfig.value;
  const quote =
    (typeof hero.quote === 'string' && hero.quote.trim()) ||
    (typeof hero.testimonial === 'string' && hero.testimonial.trim());
  return quote || '';
});

const heroQuoteAuthor = computed(() => {
  const hero = heroConfig.value;
  const author =
    (typeof hero.quoteAuthor === 'string' && hero.quoteAuthor.trim()) ||
    (typeof hero.testimonialAuthor === 'string' && hero.testimonialAuthor.trim());
  return author || '';
});

const heroCtaAction = computed<'register' | 'login' | 'custom'>(() => {
  const hero = heroConfig.value;
  const raw =
    (typeof hero.ctaAction === 'string' && hero.ctaAction.trim().toLowerCase()) ||
    (typeof hero.action === 'string' && hero.action.trim().toLowerCase());
  if (raw === 'login' || raw === 'custom') return raw;
  return 'register';
});

const heroCtaUrl = computed(() => {
  const hero = heroConfig.value;
  const raw =
    (typeof hero.ctaUrl === 'string' && hero.ctaUrl.trim()) ||
    (typeof hero.href === 'string' && hero.href.trim());
  return raw || '';
});

const heroCtaLabel = computed(() => {
  const hero = heroConfig.value;
  const raw =
    (typeof hero.ctaLabel === 'string' && hero.ctaLabel.trim()) ||
    (typeof hero.cta === 'string' && hero.cta.trim()) ||
    (typeof hero.actionLabel === 'string' && hero.actionLabel.trim());
  if (raw && raw.length) return raw;
  if (hero.hideDefaultCta === true || hero.hideCta === true) return '';
   const action = heroCtaAction.value;
  if (action === 'login') {
    return t('publicLandingTabs.loginAction');
  }
  if (action === 'register') {
    return t('publicLandingTabs.registerAction');
  }
  return '';
 
});

const teacherPhoto = computed(() => {
  const source = brandingSource.value;
  const assets = (source.assets as Record<string, any>) || {};
  const candidates = [
    props.branding?.photoUrl,
    source.photoUrl,
    assets.hero,
    assets.profile,
    props.branding?.branding?.photoUrl,
    props.branding?.branding?.assets?.hero
  ];
  const resolved = candidates.find((value) => typeof value === 'string' && value.trim().length) as string | undefined;
  return withPlaceholder(resolved, 'hero');
});

const highlights = computed(() => {
  const raw = brandingSource.value.highlights;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  return [];
});

 const heroHighlights = computed(() => highlights.value.slice(0, 3));
const supportingHighlights = computed(() => highlights.value.slice(3));
 
const lessons = computed(() => {
  const raw = brandingSource.value.courses;
  if (!Array.isArray(raw)) {
    return [] as Array<{ key: string; title: string; description: string }>;
  }
  return raw
    .map((course, index) => {
      if (!course || typeof course !== 'object') return null;
      const title = typeof course.title === 'string' ? course.title.trim() : '';
      const description = typeof course.description === 'string' ? course.description.trim() : '';
      if (!title && !description) return null;
      return {
        key: (course.id as string | number | undefined)?.toString() || `${title || 'course'}-${index}`,
        title,
        description
      };
    })
    .filter((course): course is { key: string; title: string; description: string } => course !== null)
    .slice(0, 6);
});

const teacherStats = computed(() => {
  const stats = brandingSource.value.stats;
  if (!Array.isArray(stats)) {
    return [] as Array<{ label: string; value: string | number }>;
  }
  return stats
    .map((stat) => {
      if (!stat) return null;
      const label = typeof stat.label === 'string' ? stat.label : '';
      const value = typeof stat.value === 'string' || typeof stat.value === 'number' ? stat.value : '';
      if (!label || value === '') return null;
      return { label, value };
    })
    .filter((item): item is { label: string; value: string | number } => item !== null);
});

const heroStats = computed(() => teacherStats.value.slice(0, 3));
const supportingStats = computed(() => teacherStats.value.slice(3));

const tabItems = computed(() => [
  { label: t('publicLandingTabs.aboutTab'), value: 'about' },
  { label: t('publicLandingTabs.workTab'), value: 'work', badge: courses.value.length || undefined },
  { label: t('publicLandingTabs.registerTab'), value: 'register' },
  { label: t('publicLandingTabs.loginTab'), value: 'login' }
]);

const activeTab = ref(resolveTab(route.query.action));

watch(
  () => route.query.action,
  (next) => {
    activeTab.value = resolveTab(next);
  }
);

watch(
  () => props.slug,
  () => {
    syncQuery(activeTab.value);
  }
);

watch(
  activeTab,
  (next) => {
    syncQuery(next);
  },
  { immediate: true }
);

function resolveTab(action: unknown): 'about' | 'work' | 'register' | 'login' {
  const value = Array.isArray(action) ? action[0] : action;
  if (value === 'work' || value === 'register' || value === 'login') {
    return value;
  }
  return 'about';
}

function syncQuery(tab: 'about' | 'work' | 'register' | 'login') {
  const currentQuery = route.query;
  const nextQuery: Record<string, any> = { ...currentQuery };

  if (tab === 'register' || tab === 'login') {
    nextQuery.action = tab;
    nextQuery.tenant = props.slug;
  } else {
    if ('action' in nextQuery) delete nextQuery.action;
    if (nextQuery.tenant === props.slug) {
      delete nextQuery.tenant;
    }
  }

  if (!areQueriesEqual(currentQuery, nextQuery)) {
    router.replace({
      name: route.name || undefined,
      params: route.params,
      query: nextQuery,
      hash: route.hash
    }).catch(() => undefined);
  }
}

function areQueriesEqual(a: Record<string, any>, b: Record<string, any>) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => {
    const aValue = a[key];
    const bValue = b[key];
    if (Array.isArray(aValue) || Array.isArray(bValue)) {
      const aArray = Array.isArray(aValue) ? aValue : [aValue];
      const bArray = Array.isArray(bValue) ? bValue : [bValue];
      if (aArray.length !== bArray.length) return false;
      return aArray.every((value, index) => value === bArray[index]);
    }
    return aValue === bValue;
  });
}

function onHeroCta() {
  if (!heroCtaLabel.value) return;
  const action = heroCtaAction.value;
  if (action === 'custom') {
    const url = heroCtaUrl.value;
    if (!url) return;
    if (/^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener');
      return;
    }
    router.push(url).catch(() => undefined);
    return;
  }
  goToAuth(action);
}

function onLessonClick() {
  goToAuth('login');
}

function goToAuth(action: 'register' | 'login') {
  if (props.slug) {
    setStoredTenantSlug(props.slug);
  }
  if (action === 'register') {
    router.push({ name: 'student-register', query: { tenant: props.slug } }).catch(() => undefined);
    return;
  }
  if (props.slug) {
    window.location.href = buildTenantUrl(props.slug, '/login');
    return;
  }
  router.push({ name: 'login-student-fallback' }).catch(() => undefined);
}

function courseThumbnailStyle(course: CoursePreview) {
  const image = withPlaceholder(course.thumbnailUrl, 'course');
  return { backgroundImage: `url(${image})` };
}
</script>

<style scoped>
.teacher-public-tabs {
  display: grid;
  gap: var(--sakai-space-6);
}

.teacher-public-tabs__hero {
  position: relative;
 
  padding: clamp(var(--sakai-space-7), 8vw, var(--sakai-space-10));
  border-radius: var(--landing-radius, var(--sakai-border-radius-xl));
  background: var(--teacher-hero-gradient, var(--sakai-surface-hero));
  color: var(--sakai-text-color-inverse);
  overflow: hidden;
  box-shadow: var(--landing-shadow-hover, var(--sakai-shadow-lg));
 }

.teacher-public-tabs__hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(80% 120% at 10% 10%, rgba(255, 255, 255, 0.22), transparent 70%);
  mix-blend-mode: screen;
  pointer-events: none;
}

.teacher-public-tabs__hero-body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: clamp(var(--sakai-space-6), 6vw, var(--sakai-space-9));
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  align-items: stretch;
}

.teacher-public-tabs__hero-content {
  display: grid;
  gap: var(--sakai-space-4);
  max-width: 40rem;
  align-content: start;
}

.teacher-public-tabs__hero-pill {
  display: inline-flex;
  align-self: flex-start;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--sakai-text-color-inverse) 22%, transparent);
  color: var(--sakai-text-color-inverse);
  font-size: 0.75rem;
  font-weight: var(--sakai-font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.teacher-public-tabs__hero-title {
  margin: 0;
  font-size: clamp(2.45rem, 4.5vw, 3.4rem);
  font-weight: var(--sakai-font-weight-bold);
  line-height: 1.05;
}

.teacher-public-tabs__hero-subtitle {
  margin: 0;
  font-size: clamp(1.05rem, 2.3vw, 1.4rem);
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 86%, transparent);
  line-height: 1.65;
}

.teacher-public-tabs__hero-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

.teacher-public-tabs__hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--sakai-text-color-inverse) 16%, transparent);
  color: var(--sakai-text-color-inverse);
  font-size: 0.85rem;
}

.teacher-public-tabs__hero-chip :deep(svg) {
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 80%, transparent);
}

.teacher-public-tabs__hero-actions {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
}

.teacher-public-tabs__hero-cta {
  box-shadow: var(--sakai-shadow-md);
}

.teacher-public-tabs__hero-quote {
  margin: var(--sakai-space-2) 0 0;
  display: grid;
  gap: var(--sakai-space-2);
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 76%, transparent);
}

.teacher-public-tabs__hero-quote blockquote {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.6;
  font-style: italic;
}

.teacher-public-tabs__hero-quote figcaption {
  font-size: 0.9rem;
  opacity: 0.8;
}

.teacher-public-tabs__hero-profile {
  display: grid;
  gap: var(--sakai-space-4);
  align-content: start;
}

.teacher-public-tabs__hero-photo {
  position: relative;
  display: flex;
  justify-content: center;
}

.teacher-public-tabs__hero-photo::after {
  content: '';
  position: absolute;
  inset: 8%;
  border-radius: var(--sakai-border-radius-xl);
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.24), transparent 70%);
  filter: blur(0.5rem);
  z-index: 0;
}

.teacher-public-tabs__hero-photo img {
  position: relative;
  z-index: 1;
  width: min(100%, 340px);
  border-radius: var(--sakai-border-radius-xl);
  box-shadow: var(--sakai-shadow-xl);
}

.teacher-public-tabs__hero-card {
  margin-top: calc(var(--sakai-space-4) * -1);
  padding: var(--sakai-space-5);
  border-radius: var(--sakai-border-radius-xl);
  background: var(--landing-surface-soft, rgba(255, 255, 255, 0.8));
  backdrop-filter: blur(12px);
  border: 1px solid var(--landing-border, rgba(15, 23, 42, 0.08));
  box-shadow: var(--landing-shadow, var(--sakai-shadow-md));
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-public-tabs__hero-name {

  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 70%, transparent);
}

 .teacher-public-tabs__hero-tagline {
  margin: 0;
  font-size: 0.95rem;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 78%, transparent);
  line-height: 1.6;
}

.teacher-public-tabs__hero-stat-grid {
  display: grid;
  gap: var(--sakai-space-3);
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.teacher-public-tabs__hero-stat {
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-text-color-inverse) 12%, transparent);
  display: grid;
  gap: 0.35rem;
}

.teacher-public-tabs__hero-stat-value {
  font-size: 1.2rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-public-tabs__hero-stat-label {
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 75%, transparent);

}

.teacher-public-tabs__summary {
  display: grid;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-5);
  border-radius: var(--sakai-border-radius-xl);
  background: var(--landing-surface-soft, rgba(255, 255, 255, 0.85));
  border: 1px solid var(--landing-border, rgba(15, 23, 42, 0.08));
  box-shadow: var(--landing-shadow, var(--sakai-shadow-sm));
}

.teacher-public-tabs__stats {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.teacher-public-tabs__stat {
  display: grid;
  gap: 0.35rem;
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: var(--landing-surface, var(--sakai-surface));
  box-shadow: var(--landing-shadow, var(--sakai-shadow-xs));
  text-align: center;
}

.teacher-public-tabs__stat-value {
  font-size: 1.35rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-primary-700);
}

.teacher-public-tabs__stat-label {
  font-size: 0.9rem;
  color: var(--sakai-text-color-secondary);
}

.teacher-public-tabs__highlights {
  display: grid;
  gap: var(--sakai-space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.teacher-public-tabs__highlight {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  color: var(--sakai-text-color-secondary);
}

.teacher-public-tabs__lessons {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-public-tabs__lessons-header h3 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-public-tabs__lessons-header p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.teacher-public-tabs__lessons-grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.teacher-public-tabs__lesson {
  display: grid;
  gap: var(--sakai-space-2);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid var(--landing-border, color-mix(in srgb, var(--sakai-border-color) 70%, transparent));
  background: var(--landing-surface, var(--sakai-surface-card));
  cursor: pointer;
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.teacher-public-tabs__lesson:hover {
  transform: translateY(-4px);
  box-shadow: var(--landing-shadow-hover, var(--sakai-shadow-md));
}

.teacher-public-tabs__lesson-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.teacher-public-tabs__lesson-description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: 1.5;
}

.teacher-public-tabs__lesson-cta {
  font-size: 0.85rem;
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-primary-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.teacher-public-tabs__panel {
  display: block;
}

.teacher-public-tabs__bio {
  margin: 0 0 var(--sakai-space-4);
  color: var(--sakai-text-color-secondary);

  line-height: 1.6;
}

.teacher-public-tabs__empty {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
}

.teacher-public-tabs__courses {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-public-tabs__course {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: minmax(120px, 160px) 1fr;
  align-items: center;
}

.teacher-public-tabs__course-thumb {
  width: 100%;
  padding-top: 62.5%;
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  background-size: cover;
  background-position: center;
}

.teacher-public-tabs__course-body {
  display: grid;
  gap: var(--sakai-space-2);
}

.teacher-public-tabs__course-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-public-tabs__course-description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: 1.5;
}

.teacher-public-tabs__helper {
  margin: 0 0 var(--sakai-space-4);
  color: var(--sakai-text-color-secondary);
  line-height: 1.5;
}

.teacher-public-tabs__action {
  justify-self: flex-start;
}

@media (max-width: 768px) {
  .teacher-public-tabs__hero {
    padding: var(--sakai-space-6);
   }

  .teacher-public-tabs__hero-card {
    margin-top: 0;
 
  }

  .teacher-public-tabs__course {
    grid-template-columns: 1fr;
  }

  .teacher-public-tabs__course-thumb {
    padding-top: 56%;
  }
}
</style>
