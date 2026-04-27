<template>
  <header class="teacher-landing__header" v-if="teacher">
    <div class="teacher-landing__header-inner">
      <div class="teacher-landing__brand">
        <div class="teacher-landing__brand-avatar">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="teacher.name || teacher.slug"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            @error="handleAvatarError"
          />
          <span v-else class="teacher-landing__brand-avatar-fallback">{{ initials }}</span>
        </div>
        <span class="teacher-landing__brand-name">{{ teacher.name }}</span>
        <span v-if="subtitle" class="teacher-landing__brand-tagline">{{ subtitle }}</span>
      </div>
      <nav
        v-if="navLinks.length || registerHref"
        class="teacher-landing__nav"
        :aria-label="ariaLabel"
      >
        <a
          v-for="link in navLinks"
          :key="link.key"
          :href="link.href"
          class="teacher-landing__nav-link"
        >
          {{ link.label }}
        </a>
        <a
          v-if="registerHref"
          :href="registerHref"
          class="teacher-landing__nav-link teacher-landing__nav-link--cta"
        >
          {{ t('teacherLanding.navigation.register') }}
        </a>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { withCacheBusting } from '@/utils/cacheBusting';

interface TeacherLandingHeaderProps {
  teacher: {
    name: string;
    slug: string;
    tagline?: string | null;
    subject?: string | null;
    photoUrl?: string | null;
    avatarUrl?: string | null;
    updatedAt?: string | null;
  };
  landingHref?: string;
  registerHref?: string;
  ariaLabel?: string;
}

const props = defineProps<TeacherLandingHeaderProps>();
const { t } = useI18n();

const avatarError = ref(false);

const avatarUrl = computed(() => {
  if (avatarError.value) {
    return '';
  }
  const base = props.teacher.photoUrl?.trim() || props.teacher.avatarUrl?.trim() || '';
  if (!base) {
    return '';
  }
  return withCacheBusting(base, props.teacher.updatedAt ?? undefined);
});

const subtitle = computed(() => props.teacher.tagline?.trim() || props.teacher.subject?.trim() || '');

const initials = computed(() => {
  const source = props.teacher.name || props.teacher.slug || '';
  const parts = source
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean);
  return (parts.slice(0, 2).join('') || '?') as string;
});

const baseLandingHref = computed(() => {
  if (!props.landingHref) {
    return '';
  }
  const [base] = props.landingHref.split('#');
  return base;
});

const navLinks = computed(() => {
  const base = baseLandingHref.value;
  if (!base) {
    return [] as Array<{ key: string; label: string; href: string }>;
  }

  return [
    { key: 'about', label: t('teacherLanding.navigation.about'), href: `${base}#about` },
    { key: 'courses', label: t('teacherLanding.navigation.courses'), href: `${base}#courses` },
    { key: 'contact', label: t('teacherLanding.navigation.contact'), href: `${base}#contact` }
  ];
});

const registerHref = computed(() => props.registerHref || '');

const ariaLabel = computed(() => props.ariaLabel || t('teacherLanding.navigation.label'));

watch(
  () => [props.teacher.photoUrl, props.teacher.avatarUrl, props.teacher.updatedAt],
  () => {
    avatarError.value = false;
  }
);

function handleAvatarError() {
  avatarError.value = true;
}
</script>

<style scoped>
.teacher-landing__header {
  width: 100%;
}

.teacher-landing__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(1.5rem, 3vw, 3.5rem);
  width: 100%;
  padding: clamp(1rem, 2vw, 1.5rem) clamp(1.5rem, 4vw, 3rem);
  border-radius: 1.5rem;
  background: color-mix(in srgb, var(--sakai-surface-card) 60%, transparent);
  box-shadow: 0 20px 45px color-mix(in srgb, var(--sakai-shadow-color, rgba(15, 23, 42, 0.12)) 100%, transparent);
  backdrop-filter: blur(14px);
}

.teacher-landing__brand {
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1.5rem);
  min-width: 0;
}

.teacher-landing__brand-avatar {
  display: grid;
  place-items: center;
  width: clamp(3.25rem, 6vw, 4rem);
  height: clamp(3.25rem, 6vw, 4rem);
  border-radius: 1rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--sakai-primary-color, var(--public-primary, #2563eb)) 12%, transparent);
  color: var(--sakai-primary-color-contrast, #fff);
  font-size: clamp(1.15rem, 2.4vw, 1.5rem);
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-landing__brand-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-landing__brand-avatar-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: inherit;
}

.teacher-landing__brand-name {
  font-size: clamp(1.25rem, 2.6vw, 1.8rem);
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.teacher-landing__brand-tagline {
  font-size: clamp(0.9rem, 1.8vw, 1.05rem);
  color: color-mix(in srgb, var(--sakai-text-color) 70%, transparent);
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-landing__nav {
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1.5rem);
  flex-wrap: wrap;
}

.teacher-landing__nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-medium);
  color: color-mix(in srgb, var(--sakai-text-color) 72%, transparent);
  text-decoration: none;
  transition: color 0.2s ease, background 0.2s ease;
}

.teacher-landing__nav-link:hover,
.teacher-landing__nav-link:focus-visible {
  color: var(--sakai-text-color);
  background: color-mix(in srgb, var(--sakai-primary-color, var(--public-primary, #2563eb)) 12%, transparent);
}

.teacher-landing__nav-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--sakai-primary-color, var(--public-primary, #2563eb)) 25%, transparent);
}

.teacher-landing__nav-link--cta {
  padding: 0.6rem 1rem;
  background: var(--sakai-primary-color, var(--public-primary, #2563eb));
  color: var(--sakai-primary-color-contrast, #fff);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--sakai-primary-color, rgba(37, 99, 235, 0.45)) 45%, transparent);
}

.teacher-landing__nav-link--cta:hover,
.teacher-landing__nav-link--cta:focus-visible {
  color: var(--sakai-primary-color-contrast, #fff);
  background: color-mix(in srgb, var(--sakai-primary-color, var(--public-primary, #2563eb)) 88%, white 12%);
}

@media (max-width: 900px) {
  .teacher-landing__header-inner {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .teacher-landing__brand {
    justify-content: center;
  }

  .teacher-landing__nav {
    justify-content: center;
  }
}
</style>
