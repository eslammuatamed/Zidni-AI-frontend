<template>
  <section class="teacher-hero">
    <div class="teacher-hero__backdrop" aria-hidden="true" />
    <div class="teacher-hero__orb teacher-hero__orb--one" aria-hidden="true" />
    <div class="teacher-hero__orb teacher-hero__orb--two" aria-hidden="true" />
    <div class="teacher-hero__orb teacher-hero__orb--three" aria-hidden="true" />
    <div class="teacher-hero__container">
      <div class="teacher-hero__content">
        <p v-if="headline" class="teacher-hero__eyebrow">{{ headline }}</p>
        <h1 class="teacher-hero__title">{{ title }}</h1>
        <p v-if="subtitle" class="teacher-hero__subtitle">{{ subtitle }}</p>
        <p v-if="description" class="teacher-hero__description">{{ description }}</p>
        <div v-if="cta.text || contactLabel" class="teacher-hero__actions">
          <a v-if="cta.text" :href="cta.href" class="teacher-hero__cta teacher-hero__cta--primary" :aria-label="cta.text">{{ cta.text }}</a>
          <a v-if="contactLabel" href="#contact" class="teacher-hero__cta teacher-hero__cta--ghost" aria-label="contact teacher">{{ contactLabel }}</a>
        </div>
        <ul v-if="highlights.length" class="teacher-hero__highlights">
          <li v-for="highlight in highlights" :key="highlight">{{ highlight }}</li>
        </ul>
        <div v-if="stats.length" class="teacher-hero__stats">
          <div v-for="stat in stats" :key="stat.label" class="teacher-hero__stat">
            <span class="teacher-hero__stat-value">{{ stat.value }}</span>
            <span class="teacher-hero__stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>
        <div class="teacher-hero__media" aria-hidden="true">
        <div class="teacher-hero__media-inner">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="title"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            @error="handleImageError"
          />
          <div v-else class="teacher-hero__media-placeholder">
            <span>{{ initials }}</span>
          </div>
        </div>
        <!-- <div v-if="socialLinks.length" class="teacher-hero__social">
          <a v-for="item in socialLinks" :key="item.href" :href="item.href" target="_blank" rel="noopener" class="teacher-hero__social-link">
            {{ item.label }}
          </a>
        </div> -->
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  TeacherLandingSection,
  TeacherLandingSocial,
  TeacherLandingTeacherInfo
} from '@/services/teacherLanding.api';
import { withCacheBusting } from '@/utils/cacheBusting';

const props = defineProps<{
  teacher: TeacherLandingTeacherInfo;
  section?: TeacherLandingSection;
  social?: TeacherLandingSocial | null;
}>();

const { t } = useI18n();

const title = computed(() => props.section?.title || props.teacher.displayName || '');
const headline = computed(() => props.teacher.headline?.trim() || '');

const fallbackSubtitle = computed(() => props.teacher.bio?.trim() || '');

const subtitle = computed(() => {
  const rawSubtitle = props.section?.subtitle?.trim() || props.teacher.headline?.trim() || '';
  if (!rawSubtitle) {
    return fallbackSubtitle.value;
  }

  if (headline.value && rawSubtitle.localeCompare(headline.value, undefined, { sensitivity: 'base' }) === 0) {
    return fallbackSubtitle.value;
  }

  return rawSubtitle;
});

const description = computed(() => props.section?.description || '');

const highlights = computed(() => props.section?.highlights?.filter(Boolean) ?? []);
const stats = computed(() => props.section?.stats?.filter((stat) => stat?.label && stat?.value) ?? []);
const contactLabel = computed(() => t('teacherLanding.hero.contact'));

const rawImageUrl = computed(() => props.teacher.photoUrl || props.teacher.avatarUrl || '');
const hasImageError = ref(false);

watch([rawImageUrl, () => props.teacher.updatedAt], () => {
  hasImageError.value = false;
});

const imageUrl = computed(() => {
  if (hasImageError.value) {
    return '';
  }
  const trimmed = rawImageUrl.value.trim();
  if (!trimmed) {
    return '';
  }
  return withCacheBusting(trimmed, props.teacher.updatedAt ?? undefined);
});

const handleImageError = () => {
  hasImageError.value = true;
};

const initials = computed(() => {
  const source = props.teacher.displayName || props.teacher.slug || '';
  return source
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
});

const DEFAULT_COURSES_HASH = '#courses';

const cta = computed(() => {
  const text = props.section?.ctaText || t('teacherLanding.hero.cta');
  const href = props.section?.ctaHref || DEFAULT_COURSES_HASH;
  return {
    text,
    href
  };
});

const socialLinks = computed(() => {
  if (!props.social) return [] as Array<{ href: string; label: string }>;
  const entries: Array<{ href: string; label: string }> = [];
  const map: Array<[keyof TeacherLandingSocial, string]> = [
    ['whatsapp', 'teacherLanding.social.whatsapp'],
    ['telegram', 'teacherLanding.social.telegram'],
    ['youtube', 'teacherLanding.social.youtube'],
    ['website', 'teacherLanding.social.website'],
    ['facebook', 'teacherLanding.social.facebook'],
    ['instagram', 'teacherLanding.social.instagram'],
    ['tiktok', 'teacherLanding.social.tiktok']
  ];
  map.forEach(([key, labelKey]) => {
    const value = props.social?.[key];
    if (value) {
      entries.push({ href: value, label: t(labelKey) });
    }
  });
  return entries;
});
</script>

<style scoped>
.teacher-hero {
  position: relative;
  padding: clamp(5rem, 10vw, 7rem) 1.5rem clamp(4rem, 8vw, 6rem);
  overflow: hidden;
  min-height: clamp(520px, 82vh, 700px);
  color: var(--teacher-color-surface, #fff);
}

:root[dir='rtl'] .teacher-hero {
  /* ensure overlay look is mirrored in RTL environments */
  --hero-gradient-direction: 225deg;
}

:root:not([dir='rtl']) .teacher-hero {
  --hero-gradient-direction: 45deg;
}

.teacher-hero__backdrop {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.14), rgba(14, 165, 233, 0.12));
  opacity: 0.85;
}

.teacher-hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.65;
  pointer-events: none;
}

.teacher-hero__orb--one {
  width: clamp(16rem, 28vw, 22rem);
  height: clamp(16rem, 28vw, 22rem);
  top: -18%;
  right: -10%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.6), transparent 70%);
}

.teacher-hero__orb--two {
  width: clamp(12rem, 24vw, 18rem);
  height: clamp(12rem, 24vw, 18rem);
  bottom: -10%;
  left: 5%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.5), transparent 70%);
}

.teacher-hero__orb--three {
  width: clamp(10rem, 22vw, 16rem);
  height: clamp(10rem, 22vw, 16rem);
  top: 35%;
  right: 15%;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.35), transparent 70%);
}

.teacher-hero__container {
  position: relative;
  display: grid;
  gap: clamp(2rem, 4.2vw, 3.5rem);
  /* slightly larger left column and slightly smaller media column for better balance */
  grid-template-columns: minmax(0, 1.2fr) minmax(220px, 0.8fr);
  align-items: center;
  max-width: 1180px;
  margin: 0 auto;
  z-index: 2;
}

.teacher-hero__content {
  display: grid;
  gap: 1.2rem;
}

.teacher-hero__eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--teacher-color-secondary);
  font-weight: 700;
}

.teacher-hero__title {
  font-size: clamp(2.6rem, 5.4vw, 3.6rem);
  line-height: 1.04;
  margin: 0;
  color: #000;
  font-weight: 700;
}

.teacher-hero__subtitle {
  font-size: 1.2rem;
  color: var(--teacher-color-text-secondary);
  margin: 0;
}

.teacher-hero__description {
  font-size: 1.05rem;
  color: var(--teacher-color-text-secondary);
  line-height: 1.85;
  max-width: 52ch;
}

.teacher-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 0.75rem;
}

.teacher-hero__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.86rem 1.7rem;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.25s cubic-bezier(.2,.9,.25,1), box-shadow 0.25s cubic-bezier(.2,.9,.25,1), background-color 0.2s ease;
}

.teacher-hero__cta--primary {
  background: linear-gradient(135deg, var(--teacher-color-primary), var(--teacher-color-secondary));
  color: #fff;
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.22);
}

.teacher-hero__cta--primary::after {
  /* subtle dark overlay to increase perceived contrast */
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.06));
  mix-blend-mode: multiply;
  pointer-events: none;
}

.teacher-hero__cta--primary:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 30px 64px rgba(37, 99, 235, 0.28);
}

.teacher-hero__cta:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.55), 0 0 0 6px rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

.teacher-hero__cta--ghost {
  background: rgba(255, 255, 255, 0.7);
  color: var(--teacher-color-primary);
  border: 1px solid rgba(37, 99, 235, 0.2);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.teacher-hero__cta--ghost:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.85);
}

.teacher-hero__cta--ghost:focus-visible {

  background: rgba(255, 255, 255, 0.85);
}

.teacher-hero__highlights {
  display: grid;
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.teacher-hero__highlights li {
  position: relative;
  padding: 0.85rem 1rem 0.85rem 3rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.22);
  font-weight: 600;
  color: var(--teacher-color-text-primary);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
}

.teacher-hero__highlights li::before {
  content: '';
  position: absolute;
  left: 1.1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--teacher-color-accent), var(--teacher-color-secondary));
  box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.2);
}

.teacher-hero__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.teacher-hero__stat {
  padding: 1.15rem 1.25rem;
  border-radius: 1.2rem;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(12px);
}

.teacher-hero__stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--teacher-color-primary);
}

.teacher-hero__stat-label {
  display: block;
  font-size: 0.85rem;
  color: var(--teacher-color-text-secondary);
}

.teacher-hero__media {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 1.5rem;
}

.teacher-hero__media::after {
  content: '';
  position: absolute;
  inset: auto;
  width: clamp(12rem, 34vw, 20rem);
  height: clamp(12rem, 34vw, 20rem);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.28), transparent 65%);
  filter: blur(36px);
  bottom: -18%;
  right: -8%;
  z-index: 0;
}

/* hero background overlay using ThemeProvider variable */
.teacher-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0.25)), var(--teacher-hero-bg-image);
  background-size: cover;
  background-position: center center;
  filter: saturate(0.95) contrast(1.02);
}

.teacher-hero__media-inner {
  position: relative;
  width: clamp(200px, 30vw, 320px);
  aspect-ratio: 4 / 5;
  border-radius: var(--teacher-hero-radius, 24px);
  overflow: hidden;
  background: rgba(255,255,255,0.04);
  box-shadow: var(--teacher-hero-photo-shadow, 0 24px 56px rgba(15,23,42,0.22)), var(--teacher-hero-photo-glow, 0 28px 80px rgba(6,182,212,0.08));
  display: grid;
  place-items: center;
  z-index: 1;
}

.teacher-hero__media-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.18);
  pointer-events: none;
}

.teacher-hero__media-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-hero__media-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 3.25rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(14, 165, 233, 0.5));
}

.teacher-hero__social {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
  z-index: 1;
}

.teacher-hero__social-link {
  padding: 0.55rem 1.05rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--teacher-color-primary);
  font-size: 0.85rem;
  text-decoration: none;
  border: 1px solid rgba(148, 163, 184, 0.24);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.teacher-hero__social-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 24px rgba(15, 23, 42, 0.12);
}

.teacher-hero__social-link:focus-visible {
  outline: none;
  transform: translateY(-1px);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
}


@media (max-width: 1024px) {
  .teacher-hero__container {
    grid-template-columns: minmax(0, 1fr);
  }

  .teacher-hero__media {
    order: -1;
  }

  .teacher-hero__content {
    text-align: center;
    align-items: center;
  }

  .teacher-hero__description {
    margin: 0 auto;
  }

  .teacher-hero__highlights {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@media (max-width: 640px) {
  .teacher-hero {
    padding: clamp(3rem, 12vw, 4rem) 1.25rem clamp(3rem, 10vw, 4.5rem);
  }

  .teacher-hero__actions {
    width: 100%;
    justify-content: center;
  }

  .teacher-hero__cta {
    flex: 1 1 auto;
    min-width: 12rem;
  }
}
</style>
