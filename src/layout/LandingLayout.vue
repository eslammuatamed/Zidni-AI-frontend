<template>
  <div v-if="isHomeRoute" class="landing-layout__raw">
    <slot />
  </div>
  <div v-else class="landing-layout" :dir="direction">
    <a class="landing-skip-link" href="#landing-main">
      {{ t('landing.skip_to_content') }}
    </a>
    <button
      v-if="navOpen"
      class="landing-nav__overlay"
      type="button"
      :aria-label="t('landing.nav.close')"
      tabindex="-1"
      @click="closeNav"
    />

    <header class="landing-header">
      <div class="landing-container landing-header__content">
        <RouterLink to="/" class="landing-logo" aria-label="Nabta home">
          <span>Nabta</span>
          <span class="landing-logo__dot" aria-hidden="true"></span>
        </RouterLink>

        <button
          ref="navToggle"
          class="landing-nav__toggle"
          type="button"
          :aria-expanded="navOpen"
          :aria-label="t('landing.nav.toggle')"
          aria-controls="landing-primary-nav"
          @click="toggleNav"
        >
          <span class="landing-nav__toggle-line" aria-hidden="true"></span>
          <span class="landing-nav__toggle-line" aria-hidden="true"></span>
          <span class="landing-nav__toggle-line" aria-hidden="true"></span>
        </button>

        <nav
          ref="navMenu"
          id="landing-primary-nav"
          :class="['landing-nav', { 'landing-nav--open': navOpen }]"
          aria-label="Main navigation"
        >
          <a
            v-for="item in navItems"
            :key="item.href"
            :class="[
              'landing-nav__link',
              { 'landing-nav__link--active': activeSection === item.id }
            ]"
            :href="item.href"
            :aria-current="activeSection === item.id ? 'true' : undefined"
            @click="closeNav"
          >
            {{ item.label }}
          </a>
          <RouterLink class="landing-nav__link landing-nav__link--muted" to="/login/student" @click="closeNav">
            {{ t('landing.nav.sign_in') }}
          </RouterLink>
          <a
            v-if="whatsappHref"
            class="landing-nav__cta"
            :href="whatsappHref"
            target="_blank"
            rel="noopener"
            @click="closeNav"
          >
            {{ t('landing.nav.cta') }}
          </a>
        </nav>
      </div>
    </header>

    <main id="landing-main" class="landing-main" tabindex="-1">
      <slot />
    </main>

    <footer class="landing-footer">
      <div class="landing-container landing-footer__content">
        <p class="landing-footer__text">
          © {{ currentYear }} Nabta. {{ t('landing.footer.text') }}
        </p>
        <div class="landing-footer__links">
          <RouterLink
            v-for="link in footerLinks"
            :key="link.to"
            class="landing-footer__link"
            :to="link.to"
          >
            {{ link.label }}
          </RouterLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import { buildWhatsappHref, getTeacherRegistrationSettingsCached } from '@/api/registration';
import '@/styles/landing/variables.css';
import '@/styles/landing/layout.css';
import '@/styles/landing/sections.css';
import '@/styles/landing/rtl.css';

const { t, locale } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages
});

const navOpen = ref(false);
const direction = computed(() => (locale.value.startsWith('ar') ? 'rtl' : 'ltr'));
const whatsappHref = ref('');

const sectionIds = ['integrations', 'reports', 'testimonials'] as const;
type SectionId = (typeof sectionIds)[number];

const navLabels: Record<SectionId, string> = {
  integrations: 'landing.nav.integrations',
  reports: 'landing.nav.reports',
  testimonials: 'landing.nav.testimonials'
};

const navItems = computed(() =>
  sectionIds.map((id) => ({
    id,
    href: `#${id}`,
    label: t(navLabels[id])
  }))
);

const navMenu = ref<HTMLElement | null>(null);
const navToggle = ref<HTMLButtonElement | null>(null);
const originalBodyOverflow = ref<string | null>(null);
const activeSection = ref<SectionId | null>(sectionIds[0]);

const focusableSelectors =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusableNavItems = () => {
  const navElement = navMenu.value;
  if (!navElement) {
    return [] as HTMLElement[];
  }

  return Array.from(
    navElement.querySelectorAll<HTMLElement>(focusableSelectors)
  );
};

const footerLinks = computed(() => [
  { to: '/privacy', label: t('landing.footer.privacy') },
  { to: '/terms', label: t('landing.footer.terms') },
  { to: '/support', label: t('landing.footer.support') }
]);

const lockBodyScroll = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (originalBodyOverflow.value === null) {
    originalBodyOverflow.value = document.body.style.overflow || '';
  }

  document.body.style.overflow = 'hidden';
};

const restoreBodyScroll = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (originalBodyOverflow.value !== null) {
    document.body.style.overflow = originalBodyOverflow.value;
    originalBodyOverflow.value = null;
  }
};

const toggleNav = () => {
  navOpen.value = !navOpen.value;
};

const closeNav = () => {
  navOpen.value = false;
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!navOpen.value) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeNav();
    nextTick(() => {
      navToggle.value?.focus();
    });
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const focusable = getFocusableNavItems();
  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

const route = useRoute();
// LandingHome renders its own header/footer (HomeNavBar/HomeFooter sections),
// so both home routes opt out of this layout's chrome to avoid double headers.
const isHomeRoute = computed(
  () => route.name === 'tenant-public-landing' || route.name === 'landing'
);

watch(
  () => route.fullPath,
  () => {
    navOpen.value = false;
  }
);

watch(locale, async () => {
  if (isHomeRoute.value) {
    return;
  }
  navOpen.value = false;
  await nextTick();
  setupSectionObserver();
});

watch(navOpen, async (isOpen, wasOpen) => {
  if (isHomeRoute.value) {
    return;
  }
  if (isOpen) {
    lockBodyScroll();
    await nextTick();
    const [first] = getFocusableNavItems();
    first?.focus();
    return;
  }

  if (wasOpen) {
    restoreBodyScroll();
    await nextTick();
    navToggle.value?.focus();
  }
});

let sectionObserver: IntersectionObserver | null = null;

const updateActiveSection = (entries: IntersectionObserverEntry[]) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => {
      const ratioDelta = b.intersectionRatio - a.intersectionRatio;
      if (Math.abs(ratioDelta) > 0.001) {
        return ratioDelta;
      }

      return a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1;
    });

  if (visible.length > 0) {
    const sectionId = visible[0].target.id as SectionId;
    activeSection.value = sectionIds.includes(sectionId) ? sectionId : activeSection.value;
    return;
  }

  if (typeof window !== 'undefined' && window.scrollY < 120) {
    activeSection.value = sectionIds[0];
  }
};

const setupSectionObserver = () => {
  if (isHomeRoute.value) {
    sectionObserver?.disconnect();
    return;
  }
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }

  sectionObserver?.disconnect();
  sectionObserver = new IntersectionObserver(updateActiveSection, {
    root: null,
    rootMargin: '-45% 0px -45% 0px',
    threshold: [0.1, 0.25, 0.5, 0.75, 1]
  });

  sectionIds.forEach((id) => {
    const section = document.getElementById(id);
    if (section) {
      sectionObserver?.observe(section);
    }
  });
};

onMounted(() => {
  if (!isHomeRoute.value) {
    document.addEventListener('keydown', handleKeydown);
    setupSectionObserver();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  sectionObserver?.disconnect();
  restoreBodyScroll();
});

watch(isHomeRoute, (isHome) => {
  if (isHome) {
    document.removeEventListener('keydown', handleKeydown);
    sectionObserver?.disconnect();
    restoreBodyScroll();
  } else {
    document.addEventListener('keydown', handleKeydown);
    setupSectionObserver();
  }
});

const currentYear = new Date().getFullYear();

onMounted(async () => {
  try {
    const settings = await getTeacherRegistrationSettingsCached();
    whatsappHref.value = buildWhatsappHref(settings.whatsappNumber, t('landing.nav.whatsappMessage'));
  } catch (error) {
    console.warn('[LandingLayout] failed to load registration settings', error);
  }
});
</script>

<style scoped>
.landing-layout__raw {
  min-height: 100vh;
}
</style>

