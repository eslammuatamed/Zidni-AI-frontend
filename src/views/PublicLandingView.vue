<template>
  <ThemePage class="public-landing__page" :style="{'--theme-page-bg': '#f4f5fe'}">
  <div class="public-landing">
    <template v-if="landing">
      <TeacherPublicTabs
        :slug="slug"
        :branding="landing.branding"
        :courses="visibleCourses"
      />
      <LandingRenderer
        :sections="displaySections"
        :branding="landing.branding"
        :layout="landing.layout"
        :courses="visibleCourses"
        :assets="landing.assets"
        :offers="landing.offers"
        :testimonials="landing.testimonials"
        :faqs="landing.faqs"
      />
    </template>
    <div v-else class="public-landing__loading">
      <div class="public-landing__loading-hero">
        <UiSkeleton height="3.25rem" />
        <UiSkeleton height="1.25rem" />
        <UiSkeleton width="12rem" height="2.75rem" shape="pill" />
      </div>
      <div class="public-landing__loading-grid">
        <div v-for="index in 3" :key="`landing-skeleton-${index}`" class="public-landing__loading-card">
          <UiSkeleton height="10.5rem" />
          <UiSkeleton height="1.15rem" />
          <UiSkeleton height="0.9rem" />
        </div>
      </div>
    </div>
  </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LandingRenderer from '@/components/landing/LandingRenderer.vue';
import TeacherPublicTabs from '@/components/landing/TeacherPublicTabs.vue';
import { fetchPublicLanding, type LandingSection, type PublicLandingResponse } from '@/services/landing';
import api from '@/services/api';
import { useTenantStore } from '@/stores/tenant';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import { withPlaceholder } from '@/utils/placeholders';
import { isPreviewEnabled } from '@/utils/preview';
import { getStoredTenantSlug } from '@/utils/tenantStorage';

const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();

type RawLandingResponse = PublicLandingResponse & Record<string, unknown>;
type RawLandingSection = Partial<LandingSection> & Record<string, unknown>;

const landing = ref<PublicLandingResponse | null>(null);

interface PublicLandingCourse {
  id?: string | number;
  title?: string;
  description?: string;
  subtitle?: string;
  type?: string;
  tags?: unknown;
  thumbnailUrl?: string;
  coverUrl?: string;
  imageUrl?: string;
  bannerUrl?: string;
  [key: string]: unknown;
}

const courses = ref<any[]>([]);
const coursesFeatureEnabled = ref(true);
const loading = ref(false);

const slug = computed(() => {
  const paramSlug = route.params.slug as string | undefined;
  if (paramSlug) {
    return paramSlug;
  }
  const stored = getStoredTenantSlug().raw;
  return tenantStore.branding?.slug || stored || 'demo';
});

const pageKey = computed(() => {
  const paramPage = route.params.page as string | undefined;
  const queryPage = route.query.page as string | undefined;
  return (paramPage || queryPage || 'home').toLowerCase();
});

const isPreview = computed(() => isPreviewEnabled(route.query.preview));

const displaySections = computed(() => {
  if (!landing.value) return [] as PublicLandingResponse['sections'];
  const sections = landing.value.sections || [];
  return coursesFeatureEnabled.value ? sections : sections.filter((section) => section.kind !== 'courses');
});

const visibleCourses = computed(() => (coursesFeatureEnabled.value ? courses.value : []));

async function loadLanding() {
  if (!slug.value) return;
  loading.value = true;
  try {
    let data: PublicLandingResponse | null = null;
    if (!isPreview.value) {
      data = tenantStore.getCachedLanding(slug.value, pageKey.value) || null;
    }
    if (!data) {
      data = await fetchPublicLanding(slug.value, pageKey.value, isPreview.value);
    }
    const normalized = normalizeLandingResponse(data as RawLandingResponse);
    landing.value = normalized;
    await maybeLoadCourses(normalized.courses as any[] | undefined);
    applyTheme(data.branding);
    updateMeta(data);
    if (!isPreview.value) {
      tenantStore.cacheLanding(slug.value, data);
    }
  } catch (error) {
    console.warn('Failed to load landing page', error);
    if (route.name !== 'tenant-public-landing') {
      router.replace({ name: 'tenant-public-landing' });
    }
  } finally {
    loading.value = false;
  }
}

async function maybeLoadCourses(initialCourses?: any[]) {
  if (!landing.value) return;
  const providedCourses = Array.isArray(initialCourses)
    ? initialCourses
    : Array.isArray((landing.value as RawLandingResponse).courses)
      ? ((landing.value as RawLandingResponse).courses as any[])
      : null;

  if (providedCourses && providedCourses.length > 0) {
    const normalizedCourses = normalizeCourses(providedCourses);
    courses.value = normalizedCourses;
    coursesFeatureEnabled.value = normalizedCourses.length > 0;
    return;
  }

  const hasCoursesSection = landing.value.sections?.some((section) => section.kind === 'courses');
  if (!hasCoursesSection) {
    courses.value = [];
    return;
  }
  try {
    const { data } = await api.get(`/public/tenants/${slug.value}/courses`, {
      params: { page: 0, size: 6, preview: isPreview.value ? 1 : 0 }
    });
    const allowedCourseTypes = new Set(['recorded', 'live', 'blended']);
    const items = Array.isArray(data.items) ? data.items : [];
    const filteredCourses = items.filter((course: any) => {
      if (!course || typeof course !== 'object') {
        return false;
      }
      const normalizedType = typeof course.type === 'string' ? course.type.trim().toLowerCase() : '';
      if (!normalizedType) {
        return true;
      }
      return allowedCourseTypes.has(normalizedType);
    });
    const normalizedCourses = normalizeCourses(filteredCourses);
    courses.value = normalizedCourses;
    coursesFeatureEnabled.value = normalizedCourses.length > 0;
  } catch (error) {
    console.warn('Failed to load courses', error);
    if ((error as any)?.response?.status === 404) {
      coursesFeatureEnabled.value = false;
      courses.value = [];
    }
  }
}

function normalizeLandingResponse(raw: RawLandingResponse): PublicLandingResponse {
  const normalizedSections = Array.isArray(raw.sections)
    ? (raw.sections as RawLandingSection[])
        .map((section, index) => normalizeSection(section, index))
        .filter(Boolean)
        .map((section) => section as LandingSection)
    : [];

  return {
    ...raw,
    sections: normalizedSections
  } as PublicLandingResponse;
}

function normalizeCourses(rawCourses?: any[] | null) {
  if (!Array.isArray(rawCourses)) {
    return [] as PublicLandingCourse[];
  }

  return rawCourses
    .map((course, index) => normalizeCourse(course as PublicLandingCourse | null, index))
    .filter((course): course is PublicLandingCourse => course !== null);
}

function normalizeCourse(course: PublicLandingCourse | null, index: number): PublicLandingCourse | null {
  if (!course || typeof course !== 'object') {
    return null;
  }

  const rawId = course.id ?? (course as Record<string, unknown>)['courseId'] ?? (course as Record<string, unknown>)['slug'];
  const id = typeof rawId === 'string' || typeof rawId === 'number' ? rawId : index;

  const titleCandidates = [course.title, (course as Record<string, unknown>)['name']];
  const resolvedTitle = titleCandidates.find((value) => typeof value === 'string' && value.trim().length) as string | undefined;
  const title = resolvedTitle ? resolvedTitle.trim() : `Course ${index + 1}`;

  const descriptionCandidates = [course.description, course.subtitle, (course as Record<string, unknown>)['summary']];
  const resolvedDescription = descriptionCandidates.find(
    (value) => typeof value === 'string' && value.trim().length
  ) as string | undefined;

  const thumbnailCandidates = [course.thumbnailUrl, course.coverUrl, course.imageUrl, course.bannerUrl];
  const resolvedThumbnail = thumbnailCandidates.find(
    (value) => typeof value === 'string' && value.trim().length
  ) as string | undefined;

  const rawType = typeof course.type === 'string' && course.type.trim().length ? course.type.trim() : '';
  const tags = Array.isArray(course.tags)
    ? course.tags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => tag.length > 0)
    : [];
  const typeSource = rawType || tags[0] || '';
  const type = typeSource
    ? typeSource
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .split(' ')
        .filter((segment) => segment.length > 0)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';

  return {
    ...course,
    id,
    title,
    description: resolvedDescription,
    thumbnailUrl: resolvedThumbnail,
    type
  } as PublicLandingCourse;
}

function normalizeSection(section: RawLandingSection, index: number): LandingSection | null {
  if (!section || typeof section !== 'object') {
    return null;
  }

  const id = typeof section.id === 'number' ? section.id : null;
  const kindSource = typeof section.kind === 'string' ? section.kind : typeof section.type === 'string' ? section.type : '';
  const kind = kindSource?.trim() || 'hero';
  const position = typeof section.position === 'number'
    ? section.position
    : typeof section.order === 'number'
      ? section.order
      : index;

  let data: Record<string, unknown>;
  if (section.data && typeof section.data === 'object') {
    data = { ...(section.data as Record<string, unknown>) };
  } else {
    const {
      id: _id,
      kind: _kind,
      type: _type,
      position: _position,
      order: _order,
      data: _data,
      ...rest
    } = section;
    data = { ...rest } as Record<string, unknown>;
  }

  return {
    id,
    kind,
    position,
    data
  };
}

function applyTheme(branding?: Record<string, unknown>) {
  if (!branding) return;
  const colors = (branding.colors as Record<string, string> | undefined) || {};
  document.documentElement.style.setProperty('--ed-primary', colors.primary || 'var(--sakai-primary)');
  document.documentElement.style.setProperty('--ed-secondary', colors.secondary || 'var(--sakai-secondary)');
}

function updateMeta(data: PublicLandingResponse) {
  const seo = (data.seo as Record<string, string> | undefined) || {};
  const branding = (data.branding as Record<string, any> | undefined) || {};
  const title = seo.title || (brandingTitle.value ?? 'EdTech Platform');
  const description = seo.description || branding.tagline || '';
  const image = withPlaceholder(seo.ogImage || branding.logoUrl || '', 'logo');
  document.title = title;
  setMeta('description', description);
  setMeta('og:title', title);
  setMeta('og:description', description);
  setMeta('og:type', 'website');
  if (image) {
    setMeta('og:image', image);
    setMeta('twitter:image', image);
  }
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setLink('canonical', `${window.location.origin}${router.currentRoute.value.fullPath}`);
}

const brandingTitle = computed(() => tenantStore.branding?.name);

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

function setLink(rel: string, href: string) {
  if (!href) return;
  let tag = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

onMounted(async () => {
  if (!tenantStore.branding) {
    await tenantStore.fetchBranding(slug.value);
  }
  await loadLanding();
});

watch(
  () => [route.fullPath, tenantStore.branding?.slug],
  async () => {
    await loadLanding();
  }
);
</script>

<style scoped>
.public-landing {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-10);
  padding-block: clamp(var(--sakai-space-10), 8vw, calc(var(--sakai-space-12) + var(--sakai-space-4)));
  padding-inline: clamp(var(--sakai-space-4), 6vw, var(--sakai-space-8));
  background: #f4f5fe;
  font-family: var(--sakai-font-family-base);
  --landing-surface: #ffffff;
  --landing-surface-soft: rgba(255, 255, 255, 0.85);
  --landing-border: rgba(15, 23, 42, 0.08);
  --landing-shadow: 0 4px 16px rgba(4, 6, 24, 0.08);
  --landing-shadow-hover: 0 16px 30px rgba(4, 6, 24, 0.12);
  --landing-radius: 1.5rem;
  min-height: 100vh;
}

.public-landing__page :deep(.ui-card) {
  border-radius: 1.5rem;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 4px 16px rgba(4, 6, 24, 0.08);
}

.public-landing__loading {
  width: min(100%, calc(var(--sakai-container-max) + var(--sakai-space-6)));
  margin: 0 auto;
  display: grid;
  gap: var(--sakai-space-6);
}

.public-landing__loading-hero {
  display: grid;
  gap: var(--sakai-space-4);
  padding: clamp(var(--sakai-space-6), 6vw, var(--sakai-space-9));
  border-radius: var(--sakai-border-radius-xl);
  background: color-mix(in srgb, var(--sakai-primary) 14%, transparent);
  box-shadow: var(--sakai-shadow-md);
}

.public-landing__loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--sakai-space-5);
}

.public-landing__loading-card {
  display: grid;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-5);
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface-card);
  box-shadow: var(--sakai-shadow-sm);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
}
</style>
