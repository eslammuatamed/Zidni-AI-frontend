<template>
  <header
    class="home-nav sticky top-0 z-50 bg-white/80 backdrop-blur-[12px] shadow-[0_1px_2px_0_rgb(0_0_0_/_0.05)] [border-bottom:1px_solid_#f1f5f9]"
  >
    <div
      class="home-nav__inner mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-20"
    >
      <RouterLink
        to="/"
        class="home-nav__brand flex shrink-0 items-baseline gap-1.5 text-2xl font-bold uppercase leading-none no-underline"
        :aria-label="t('landing.home.nav.logoAria')"
      >
        <span class="text-[#06b6d4]">zidni</span>
        <span class="text-[#1e3a8a]">Ai</span>
      </RouterLink>

      <nav
        class="home-nav__links hidden items-center gap-8 md:flex"
        :aria-label="t('landing.home.nav.primaryLabel')"
      >
        <template v-for="item in navItems" :key="item.id">
          <RouterLink
            v-if="item.to"
            :to="item.to"
            class="home-nav__link text-base font-medium text-sakai-brand-deepest no-underline transition-colors hover:text-sakai-primary"
          >
            {{ item.label }}
          </RouterLink>
          <a
            v-else
            :href="item.href"
            class="home-nav__link text-base no-underline transition-colors"
            :class="
              activeSection === item.id
                ? 'pb-1 font-bold text-sakai-primary [border-bottom:2px_solid_rgb(var(--sakai-primary-rgb))]'
                : 'font-medium text-sakai-brand-deepest hover:text-sakai-primary'
            "
            :aria-current="activeSection === item.id ? 'true' : undefined"
          >
            {{ item.label }}
          </a>
        </template>
      </nav>

      <div class="home-nav__actions flex items-center gap-3 lg:gap-6">
        <button
          type="button"
          class="home-nav__language flex items-center gap-2 bg-transparent p-0 font-semibold text-sakai-primary transition-opacity hover:opacity-75"
          :aria-label="t('landing.home.nav.languageAria')"
          @click="toggleLanguage"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            class="h-6 w-6"
            aria-hidden="true"
          >
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M8 3H9C7.05 8.84 7.05 15.16 9 21H8"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M15 3C16.95 8.84 16.95 15.16 15 21"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M3 16V15C8.84 16.95 15.16 16.95 21 15V16"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M3 9C8.84 7.05 15.16 7.05 21 9"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="text-base leading-none">{{
            t('landing.home.nav.langShort')
          }}</span>
        </button>

        <a
          :href="teacherLoginHref"
          class="home-nav__profile hidden h-10 w-10 items-center justify-center rounded-full bg-[#d2d8e8] text-sakai-primary no-underline shadow-[0_4px_10px_rgb(0_0_0_/_0.05)] transition-opacity hover:opacity-80 sm:flex"
          :aria-label="t('landing.home.nav.profileAria')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            class="h-6 w-6"
            aria-hidden="true"
          >
            <path
              d="M12.16 10.87C12.06 10.86 11.94 10.86 11.83 10.87C9.45 10.79 7.56 8.84 7.56 6.44C7.56 3.99 9.54 2 12 2C14.45 2 16.44 3.99 16.44 6.44C16.43 8.84 14.54 10.79 12.16 10.87Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M7.16 14.56C4.74 16.18 4.74 18.82 7.16 20.43C9.91 22.27 14.42 22.27 17.17 20.43C19.59 18.81 19.59 16.17 17.17 14.56C14.43 12.73 9.92 12.73 7.16 14.56Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </a>

        <a
          v-if="contactHref"
          :href="contactHref"
          target="_blank"
          rel="noopener"
          class="home-nav__cta hidden items-center justify-center rounded-lg bg-sakai-primary px-6 py-2 text-base font-semibold text-white no-underline shadow-[0_10px_15px_rgb(165_243_252_/_0.2),0_4px_3px_rgb(165_243_252_/_0.6)] transition-opacity hover:opacity-90 md:inline-flex"
        >
          {{ t('landing.home.nav.cta') }}
        </a>

        <button
          ref="navToggleRef"
          type="button"
          class="home-nav__toggle flex h-10 w-10 items-center justify-center rounded-lg bg-transparent text-sakai-brand-deepest md:hidden"
          :aria-expanded="navOpen"
          :aria-label="
            navOpen
              ? t('landing.home.nav.closeMenu')
              : t('landing.home.nav.openMenu')
          "
          aria-controls="home-nav-mobile"
          @click="navOpen = !navOpen"
        >
          <svg
            v-if="!navOpen"
            viewBox="0 0 24 24"
            class="h-6 w-6"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M4 6.75A.75.75 0 0 1 4.75 6h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 6.75Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 12Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.75-.75Z"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
            <path
              fill="currentColor"
              d="M6.22 5.22a.75.75 0 0 1 1.06 0L12 9.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 11l4.72 4.72a.75.75 0 0 1-1.06 1.06L12 12.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L10.94 11 6.22 6.28a.75.75 0 0 1 0-1.06Z"
            />
          </svg>
        </button>
      </div>
    </div>

    <nav
      v-if="navOpen"
      id="home-nav-mobile"
      class="home-nav__mobile flex flex-col gap-1 px-4 pb-4 md:hidden"
      :aria-label="t('landing.home.nav.primaryLabel')"
    >
      <template v-for="item in navItems" :key="item.id">
        <RouterLink
          v-if="item.to"
          :to="item.to"
          class="home-nav__mobile-link rounded-lg px-3 py-2.5 text-base font-medium text-sakai-brand-deepest no-underline"
          @click="navOpen = false"
        >
          {{ item.label }}
        </RouterLink>
        <a
          v-else
          :href="item.href"
          class="home-nav__mobile-link rounded-lg px-3 py-2.5 text-base no-underline"
          :class="
            activeSection === item.id
              ? 'bg-sakai-primary/5 font-bold text-sakai-primary'
              : 'font-medium text-sakai-brand-deepest'
          "
          @click="navOpen = false"
        >
          {{ item.label }}
        </a>
      </template>
      <a
        :href="teacherLoginHref"
        class="home-nav__mobile-link rounded-lg px-3 py-2.5 text-base font-medium text-sakai-brand-deepest no-underline sm:hidden"
        @click="navOpen = false"
      >
        {{ t('landing.home.nav.signIn') }}
      </a>
      <a
        v-if="contactHref"
        :href="contactHref"
        target="_blank"
        rel="noopener"
        class="home-nav__mobile-cta mt-2 inline-flex items-center justify-center rounded-lg bg-sakai-primary px-6 py-2.5 text-base font-semibold text-white no-underline"
        @click="navOpen = false"
      >
        {{ t('landing.home.nav.cta') }}
      </a>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import { loadLocaleMessages, type SupportedLocale } from '@/plugins/i18n';
import { buildAppUrl } from '@/lib/host';
import {
  buildWhatsappHref,
  getTeacherRegistrationSettingsCached,
} from '@/api/registration';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

const { locale: globalLocale } = useI18n({ useScope: 'global' });

const normalizeLocale = (value: string): SupportedLocale =>
  value === 'en' ? 'en' : 'ar';

const toggleLanguage = async () => {
  const next: SupportedLocale =
    normalizeLocale(globalLocale.value) === 'ar' ? 'en' : 'ar';
  await loadLocaleMessages(next);
  globalLocale.value = next;
};

const navOpen = ref(false);

// Anchor items scroll-spy sections on this page; route items navigate to
// standalone pages (routes ship with their upcoming page tasks).
const sectionIds = ['home', 'solutions'] as const;
type SectionId = (typeof sectionIds)[number];

interface NavItem {
  id: string;
  label: string;
  href?: string;
  to?: string;
}

const navItems = computed<NavItem[]>(() => [
  { id: 'home', href: '#home', label: t('landing.home.nav.home') },
  { id: 'solutions', href: '#solutions', label: t('landing.home.nav.solutions') },
  { id: 'pricing', to: '/pricing', label: t('landing.home.nav.pricing') },
  { id: 'resources', to: '/resources', label: t('landing.home.nav.resources') },
]);

const activeSection = ref<SectionId>('home');

const teacherLoginHref = computed(() => buildAppUrl('/teacher/login'));
const contactHref = ref('');

let sectionObserver: IntersectionObserver | null = null;

const updateActiveSection = (entries: IntersectionObserverEntry[]) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

  if (visible.length > 0) {
    const sectionId = visible[0].target.id as SectionId;
    if (sectionIds.includes(sectionId)) {
      activeSection.value = sectionId;
    }
    return;
  }

  if (typeof window !== 'undefined' && window.scrollY < 120) {
    activeSection.value = 'home';
  }
};

const setupSectionObserver = () => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }

  sectionObserver?.disconnect();
  sectionObserver = new IntersectionObserver(updateActiveSection, {
    root: null,
    rootMargin: '-45% 0px -45% 0px',
    threshold: [0.1, 0.25, 0.5, 0.75, 1],
  });

  sectionIds.forEach((id) => {
    const section = document.getElementById(id);
    if (section) {
      sectionObserver?.observe(section);
    }
  });
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && navOpen.value) {
    navOpen.value = false;
  }
};

watch(globalLocale, () => {
  navOpen.value = false;
});

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown);
  setupSectionObserver();

  try {
    const settings = await getTeacherRegistrationSettingsCached();
    contactHref.value = buildWhatsappHref(
      settings.whatsappNumber,
      t('landing.home.nav.whatsappMessage'),
    );
  } catch (error) {
    console.warn('[HomeNavBar] failed to load registration settings', error);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  sectionObserver?.disconnect();
});
</script>
