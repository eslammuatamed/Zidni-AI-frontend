<!--
  ThemeAppShell.vue builds the primary authenticated layout, including the
  sidebar navigation, global top bar, and responsive drawer behavior. Props: none.
  It derives navigation items from user role/feature flags and exposes slots for
  page content while managing layout direction and localization state.
-->
<template>
  <a
    class="theme-skip-link"
    href="#main-content"
    @click.prevent="focusMainContent"
    @keydown.enter.prevent="focusMainContent"
    @keydown.space.prevent="focusMainContent"
  >
    {{ t("nav.skipToContent") }}
  </a>
  <div class="theme-app-shell" :class="shellClasses" :dir="direction">
    <aside
      id="theme-app-shell-sidebar"
      ref="sidebarRef"
      class="theme-app-shell__sidebar"
      :aria-hidden="isMobile && !drawer"
      :inert="isMobile && !drawer"
    >
      <button
        v-if="isMobile"
        class="theme-app-shell__close"
        type="button"
        @click="drawer = false"
      >
        <UiIcon name="CloseOutlined" :size="18" />
      </button>
      <div class="theme-app-shell__logo">
        <div class="theme-app-shell__brand-mark">{{ brandInitials }}</div>
        <div class="theme-app-shell__brand-copy" v-if="!collapsed || isMobile">
          <span class="theme-app-shell__brand-name">{{ brandName }}</span>
          <span v-if="brandTagline" class="theme-app-shell__brand-tagline">{{
            brandTagline
          }}</span>
        </div>
      </div>
      <div class="theme-app-shell__sidebar-scroll">
        <div
          v-if="showTeacherDowngradeBanner"
          class="theme-app-shell__sidebar-alert"
          role="status"
          aria-live="polite"
        >
          <button
            class="theme-app-shell__sidebar-alert-dismiss"
            type="button"
            :aria-label="t('common.close')"
            @click="dismissTeacherDowngradeBanner"
          >
            <UiIcon name="CloseOutlined" :size="12" />
          </button>
          <p class="theme-app-shell__sidebar-alert-title">
            {{ t("nav.teacherDowngradeTitle") }}
          </p>
          <p class="theme-app-shell__sidebar-alert-body">
            {{ t("nav.teacherDowngradeBody") }}
          </p>
          <p
            v-if="teacherDowngradeLabels.length"
            class="theme-app-shell__sidebar-alert-caption"
          >
            {{ t("nav.teacherDowngradeModules") }}
          </p>
          <ul
            v-if="teacherDowngradeLabels.length"
            class="theme-app-shell__sidebar-alert-list"
            role="list"
          >
            <li v-for="label in teacherDowngradeLabels" :key="label">
              {{ label }}
            </li>
          </ul>
        </div>
        <nav class="theme-app-shell__nav" :aria-label="t('nav.mainNavigation')">
          <UiAlert
            v-if="assistantSuppressedNavItems.length"
            class="theme-app-shell__nav-alert"
            color="info"
            variant="soft"
          >
            <p class="theme-app-shell__nav-alert-title">
              {{ t("assistant.nav.featuresDisabledTitle") }}
            </p>
            <p class="theme-app-shell__nav-alert-body">
              {{ t("assistant.nav.featuresDisabledDescription") }}
            </p>
            <ul class="theme-app-shell__nav-alert-list" role="list">
              <li v-for="item in assistantSuppressedNavItems" :key="item.id">
                {{ item.label }}
              </li>
            </ul>
          </UiAlert>
          <template v-for="item in navItems" :key="navItemKey(item)">
            <RouterLink
              v-if="item.to"
              :to="item.to"
              class="theme-app-shell__nav-item"
              :class="{ 'is-active': isNavActive(item.to) }"
              :title="item.label"
              :aria-label="collapsed && !isMobile ? item.label : undefined"
              :aria-current="isNavActive(item.to) ? 'page' : undefined"
              @click="handleNavigate"
            >
              <span class="theme-app-shell__nav-icon">
                <UiIcon :name="item.icon" :size="18" />
              </span>
              <span v-if="!collapsed || isMobile">{{ item.label }}</span>
              <span
                v-if="item.badge && (!collapsed || isMobile)"
                class="theme-app-shell__badge"
                >{{ item.badge }}</span
              >
            </RouterLink>
            <a
              v-else-if="item.href"
              :href="item.href"
              class="theme-app-shell__nav-item"
              :target="item.external ? '_blank' : undefined"
              :rel="item.external ? 'noreferrer noopener' : undefined"
              :title="item.label"
              :aria-label="collapsed && !isMobile ? item.label : undefined"
              @click="handleNavigate"
            >
              <span class="theme-app-shell__nav-icon">
                <UiIcon :name="item.icon" :size="18" />
              </span>
              <span v-if="!collapsed || isMobile">{{ item.label }}</span>
              <span
                v-if="item.badge && (!collapsed || isMobile)"
                class="theme-app-shell__badge"
                >{{ item.badge }}</span
              >
            </a>
            <button
              v-else
              type="button"
              class="theme-app-shell__nav-item"
              :title="item.label"
              :aria-label="collapsed && !isMobile ? item.label : undefined"
              @click="handleNavAction(item.action)"
            >
              <span class="theme-app-shell__nav-icon">
                <UiIcon :name="item.icon" :size="18" />
              </span>
              <span v-if="!collapsed || isMobile">{{ item.label }}</span>
              <span
                v-if="item.badge && (!collapsed || isMobile)"
                class="theme-app-shell__badge"
                >{{ item.badge }}</span
              >
            </button>
          </template>
        </nav>
      </div>

      <div
        v-if="auth.isTeacher && teacherPlanUpgradeEnabled"
        class="theme-app-shell__sidebar-upgrade"
      >
        <RouterLink
          :to="{ name: 'teacher-plan-upgrade' }"
          class="theme-app-shell__upgrade-button"
          :class="{ 'is-collapsed': collapsed && !isMobile }"
          :title="t('nav.teacherUpgradePlan')"
          :aria-label="t('nav.teacherUpgradePlan')"
          @click="handleNavigate"
        >
          <span class="theme-app-shell__nav-icon">
            <UiIcon name="ArrowUpOutlined" :size="18" />
          </span>
          <span v-if="!collapsed || isMobile">{{
            t("nav.teacherUpgradePlan")
          }}</span>
        </RouterLink>
        <p v-if="!collapsed || isMobile" class="theme-app-shell__plan-label">
          {{ t("nav.teacherCurrentPlan", { plan: teacherPlanDisplay }) }}
        </p>
      </div>
    </aside>

    <div class="theme-app-shell__body">
      <header class="theme-app-shell__topbar">
        <div class="theme-topbar__meta">
          <button
            v-if="isMobile"
            ref="drawerToggle"
            class="theme-icon-button"
            type="button"
            :aria-label="t('nav.toggleSidebar')"
            aria-haspopup="true"
            :aria-expanded="drawer"
            aria-controls="theme-app-shell-sidebar"
            @click="toggleDrawer"
          >
            <UiIcon name="MenuOutlined" />
          </button>
          <button
            v-else
            class="theme-icon-button"
            type="button"
            :aria-label="t('nav.toggleSidebar')"
            :title="sidebarToggleTitle"
            :aria-expanded="!collapsed"
            aria-controls="theme-app-shell-sidebar"
            @click="toggleSidebar"
          >
            <UiIcon :name="sidebarToggleIcon" />
          </button>
          <div class="theme-topbar__heading">
            <nav
              v-if="breadcrumbs.length"
              class="theme-app-shell__breadcrumbs"
              aria-label="breadcrumbs"
            >
              <RouterLink
                v-for="(crumb, index) in breadcrumbs"
                :key="`${crumb.title}-${index}`"
                :to="crumb.to || route.fullPath"
                :class="{ 'is-active': index === breadcrumbs.length - 1 }"
              >
                <span>{{ crumb.title }}</span>
                <UiIcon
                  v-if="index < breadcrumbs.length - 1"
                  name="RightOutlined"
                  :size="14"
                />
              </RouterLink>
            </nav>
            <!-- <p v-if="userSubtitle" class="theme-topbar__subtitle">{{ userSubtitle }}</p> -->
          </div>
        </div>

        <div class="theme-topbar__search" role="search">
          <UiIcon name="SearchOutlined" :size="18" />
          <input
            v-model="searchQuery"
            class="theme-topbar__search-input"
            type="search"
            :placeholder="t('nav.searchPlaceholder')"
            :aria-label="t('nav.searchPlaceholder')"
          />
        </div>

        <div class="theme-topbar__actions">
          <StudentTenantSwitcher
            v-if="showStudentTenantSwitcher"
            class="theme-topbar__tenant-switcher"
          />
          <button
            class="theme-icon-button"
            type="button"
            :aria-label="languageToggleTitle"
            :title="languageToggleTitle"
            @click="toggleLanguage"
          >
            <UiIcon name="GlobalOutlined" />
            <span>{{ languageLabel }}</span>
          </button>
          <button
            class="theme-icon-button"
            type="button"
            :aria-label="themeToggleTitle"
            :title="themeToggleTitle"
            :aria-pressed="themeStore.isDark"
            @click="themeStore.toggleTheme()"
          >
            <UiIcon :name="themeToggleIcon" />
            <span>{{ themeToggleNextLabel }}</span>
          </button>
          <RouterLink
            v-if="
              notificationsUnifiedEnabled && (auth.isTeacher || auth.isStudent)
            "
            class="theme-icon-button theme-icon-button--notification"
            :to="
              auth.isTeacher
                ? '/teacher/notifications'
                : '/student/notifications'
            "
            :aria-label="t('notifications.historyTitle')"
          >
            <span
              v-if="showNotificationsBadge"
              class="theme-icon-badge"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {{ notificationsBadgeLabel }}
            </span>
            <UiIcon name="BellOutlined" />
          </RouterLink>
          <button
            v-if="canAccessTeacherLandingContent"
            class="theme-icon-button"
            type="button"
            :aria-label="t('nav.settings')"
            :title="t('nav.settings')"
            @click="handleSettingsClick"
          >
            <UiIcon name="SettingOutlined" />
          </button>
          <div class="theme-topbar__user" ref="userMenuRef">
            <button
              v-if="hasUserMenu"
              class="theme-topbar__user-toggle"
              type="button"
              :aria-label="t('nav.profile')"
              aria-haspopup="menu"
              :aria-expanded="userMenuOpen ? 'true' : 'false'"
              @click="toggleUserMenu"
              @keydown.escape.stop.prevent="closeUserMenu"
            >
              <div class="theme-topbar__avatar">{{ brandInitials }}</div>
              <div class="theme-topbar__user-meta">
                <span class="theme-topbar__user-name">{{
                  headerUserName
                }}</span>
                <span class="theme-topbar__user-role">{{ authRoleLabel }}</span>
              </div>
            </button>
            <div v-else class="theme-topbar__user-display">
              <div class="theme-topbar__avatar">{{ brandInitials }}</div>
              <div class="theme-topbar__user-meta">
                <span class="theme-topbar__user-name">{{
                  headerUserName
                }}</span>
                <span class="theme-topbar__user-role">{{ authRoleLabel }}</span>
              </div>
            </div>
            <transition name="theme-topbar__user-menu">
              <div
                v-if="hasUserMenu && userMenuOpen"
                class="theme-topbar__user-menu"
                role="menu"
              >
                <ul class="theme-topbar__user-menu-list">
                  <li v-for="item in userMenuItems" :key="item.id">
                    <RouterLink
                      v-if="item.to"
                      :to="item.to"
                      class="theme-topbar__user-menu-link"
                      role="menuitem"
                      @click="handleUserMenuNavigate"
                    >
                      {{ item.label }}
                    </RouterLink>
                    <button
                      v-else
                      type="button"
                      class="theme-topbar__user-menu-action"
                      role="menuitem"
                      @click="handleUserMenuAction(item)"
                    >
                      {{ item.label }}
                    </button>
                  </li>
                </ul>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        ref="mainContentRef"
        class="theme-app-shell__content max-w-7xl mx-auto w-full"
        tabindex="-1"
      >
        <slot />
      </main>

      <footer class="theme-app-shell__footer">
        <!-- <span class="theme-app-shell__footer-copy">&copy; {{ currentYear }} {{ brandName }}</span> -->
        <div v-if="auth.isTeacher" class="theme-topbar__footer-links">
          <UiButton
            variant="link"
            color="secondary"
            @click="handleNavAction('open-teacher-terms')"
          >
            {{ t("nav.teacherTerms") }}
          </UiButton>
        </div>
        <div class="theme-app-shell__footer-powered">
          <img
            src="@/assets/logo.svg"
            alt="Zidni AI logo"
            class="theme-app-shell__footer-logo"
            loading="lazy"
          />
          <span>Powered by Zidni AI</span>
        </div>
      </footer>
    </div>

    <div
      v-if="drawer && isMobile"
      class="theme-app-shell__overlay"
      @click="closeDrawer"
    ></div>
    <UiDialog
      v-model="termsDialogOpen"
      :title="t('teacher.terms.title')"
      width="780px"
    >
      <div class="teacher-terms">
        <p class="teacher-terms__welcome">{{ t("teacher.terms.welcome") }}</p>
        <p class="teacher-terms__intro">{{ t("teacher.terms.intro") }}</p>
        <div class="teacher-terms__sections">
          <section
            v-for="section in termsSections"
            :key="section.title"
            class="teacher-terms__section"
          >
            <h4 class="teacher-terms__section-title">{{ section.title }}</h4>
            <p v-if="section.body" class="teacher-terms__section-body">
              {{ section.body }}
            </p>
            <ul
              v-if="section.items?.length"
              class="teacher-terms__section-list"
            >
              <li v-for="item in section.items" :key="item">{{ item }}</li>
            </ul>
          </section>
        </div>
        <p class="teacher-terms__closing">{{ t("teacher.terms.closing") }}</p>
        <div class="teacher-terms__actions">
          <UiButton
            variant="link"
            color="secondary"
            @click="termsDialogOpen = false"
          >
            {{ t("common.close") }}
          </UiButton>
        </div>
      </div>
    </UiDialog>
    <AdminAlertOverlay />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { isNavigationFailure, useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useTenantStore } from "@/stores/tenant";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notifications";
import { useLandingInquiriesStore } from "@/stores/landingInquiries";
import { useFeaturesStore } from "@/stores/features";
import { useFeatureSyncStore } from "@/stores/featureSync";
import { useTeacherProfileStore } from "@/stores/teacherProfile";
import { useStudentStore } from "@/stores/student";
import { useSubscriptionStore } from "@/stores/subscription";
import { useSubscriptionUpdatesStore } from "@/stores/subscriptionUpdates";
import { FEATURE } from "@/constants/featureCatalog";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiAlert from "@/components/ui/UiAlert.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiDialog from "@/components/ui/UiDialog.vue";
import StudentTenantSwitcher from "@/components/student/StudentTenantSwitcher.vue";
import { LOCALE_STORAGE_KEY, loadLocaleMessages } from "@/plugins/i18n";
import { useTheme } from "vuetify";
import { useThemeStore } from "@/stores/theme";
import type { SupportedLocale } from "@/plugins/i18n";
import type { FeatureCode } from "@/constants/featureCatalog";
import type { RouteLocationRaw } from "vue-router";
import {
  buildTeacherNavModel,
  type NavItem,
  type TeacherNavSuppressedItem,
} from "./buildTeacherNavItems";
import AdminAlertOverlay from "@/components/admin/AdminAlertOverlay.vue";

const SUPPORTED_LOCALES: SupportedLocale[] = ["ar", "en"];

/**
 * Normalizes a stored locale value against the supported locales list.
 *
 * @param value Raw value obtained from storage.
 * @returns A supported locale when the value matches, otherwise undefined.
 */
const resolveLocale = (value: unknown): SupportedLocale | undefined => {
  if (typeof value === "string") {
    return SUPPORTED_LOCALES.find((item) => item === value) as
      | SupportedLocale
      | undefined;
  }
  return undefined;
};

const tenantStore = useTenantStore();
const auth = useAuthStore();
const notifications = useNotificationStore();
const landingInquiries = useLandingInquiriesStore();
const teacherProfileStore = useTeacherProfileStore();
const studentStore = useStudentStore();
const route = useRoute();
const router = useRouter();
const { t, tm, locale } = useI18n();
const featuresStore = useFeaturesStore();
const featureSync = useFeatureSyncStore();
const subscriptionStore = useSubscriptionStore();
const subscriptionUpdates = useSubscriptionUpdatesStore();
const themeStore = useThemeStore();
const vuetifyTheme = useTheme();

type UserMenuItem = {
  id: string;
  label: string;
  to?: RouteLocationRaw;
  action?: () => void | Promise<void>;
};

type TermsSection = {
  title: string;
  body?: string;
  items?: string[];
};

const userMenuRef = ref<HTMLElement | null>(null);
const userMenuOpen = ref(false);

const navigateTo = (target: RouteLocationRaw) => {
  router.push(target).catch((error) => {
    if (!isNavigationFailure(error)) {
      console.warn("[theme] failed to navigate", error);
    }
  });
};

const teacherPaymentSettingsAvailable = computed(() => auth.isTeacher);
const canAccessTeacherLandingContent = computed(() => auth.isTeacher);

const handleSettingsClick = () => {
  if (!canAccessTeacherLandingContent.value) {
    return;
  }
  navigateTo({ name: "teacher-landing-content" });
};

const buildLogoutAction = async () => {
  const target: RouteLocationRaw = auth.isStudent
    ? { name: "login-student" }
    : auth.isAssistant
      ? { name: "assistant-login" }
      : { name: "login-teacher" };
  await auth.logout();
  try {
    await router.replace(target);
  } catch (error) {
    if (!isNavigationFailure(error)) {
      console.warn("[theme] failed to redirect after logout", error);
    }
  }
};

const userMenuItems = computed<UserMenuItem[]>(() => {
  const items: UserMenuItem[] = [];

  if (teacherPaymentSettingsAvailable.value) {
    items.push({
      id: "payments",
      label: t("nav.teacherPaymentSettings"),
      to: { name: "teacher-payment-settings" },
    });
    items.push({
      id: "landing",
      label: t("nav.teacherLandingContent"),
      to: { name: "teacher-landing-content" },
    });
  }

  if (auth.isAuthenticated) {
    items.push({
      id: "logout",
      label: t("nav.logout"),
      action: buildLogoutAction,
    });
  }

  return items;
});

const hasUserMenu = computed(() => userMenuItems.value.length > 0);

const termsDialogOpen = ref(false);
const termsSections = computed(
  () => tm("teacher.terms.sections") as TermsSection[],
);

const closeUserMenu = () => {
  userMenuOpen.value = false;
};

const toggleUserMenu = () => {
  if (!hasUserMenu.value) {
    return;
  }
  userMenuOpen.value = !userMenuOpen.value;
};

const handleUserMenuNavigate = () => {
  closeUserMenu();
};

const handleUserMenuAction = (item: UserMenuItem) => {
  if (item.action) {
    void item.action();
  }
  closeUserMenu();
};

const handleNavAction = (action?: NavItem["action"]) => {
  if (!action) {
    return;
  }
  if (action === "open-teacher-terms") {
    termsDialogOpen.value = true;
    handleNavigate();
  }
};

const handleDocumentClick = (event: MouseEvent) => {
  if (!userMenuOpen.value) {
    return;
  }
  const target = event.target as Node | null;
  if (userMenuRef.value && target && !userMenuRef.value.contains(target)) {
    closeUserMenu();
  }
};

const handleDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeUserMenu();
  }
};

onMounted(() => {
  if (typeof document === "undefined") {
    return;
  }
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);
});

onBeforeUnmount(() => {
  if (typeof document === "undefined") {
    return;
  }
  document.removeEventListener("click", handleDocumentClick);
  document.removeEventListener("keydown", handleDocumentKeydown);
});

const applyVuetifyTheme = (name: string) => {
  if ("change" in vuetifyTheme && typeof vuetifyTheme.change === "function") {
    vuetifyTheme.change(name);
    return;
  }
  vuetifyTheme.global.name.value = name;
};

watch(
  () => themeStore.vuetifyThemeName,
  (name) => {
    applyVuetifyTheme(name);
  },
  { immediate: true },
);

const storedLocale =
  typeof window !== "undefined"
    ? window.localStorage.getItem(LOCALE_STORAGE_KEY)
    : null;
const normalizedStoredLocale = resolveLocale(storedLocale);

const hasStoredLocale = ref(Boolean(normalizedStoredLocale));
if (normalizedStoredLocale && locale.value !== normalizedStoredLocale) {
  void loadLocaleMessages(normalizedStoredLocale).then(() => {
    locale.value = normalizedStoredLocale;
  });
}

const SIDEBAR_STORAGE_KEY = "edtech:sidebar-collapsed";

const readStoredSidebarState = (): boolean | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
};

const persistSidebarState = (value: boolean) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
};

const drawer = ref(false);
const collapsed = ref(readStoredSidebarState() ?? false);
const isMobile = ref(false);
const sidebarRef = ref<HTMLElement | null>(null);
const drawerToggle = ref<HTMLButtonElement | null>(null);
const mainContentRef = ref<HTMLElement | null>(null);
const initialDirection =
  typeof document !== "undefined"
    ? document.documentElement.dir || document.body.getAttribute("dir") || "ltr"
    : "ltr";
const direction = ref<"ltr" | "rtl">(
  initialDirection === "rtl" ? "rtl" : "ltr",
);

const isRtl = computed(() => direction.value === "rtl");
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const shellClasses = computed(() => ({
  "is-sidebar-open": drawer.value && isMobile.value,
  "is-sidebar-collapsed": collapsed.value && !isMobile.value,
  "is-rtl": isRtl.value,
}));
const searchQuery = ref("");

const toggleSidebar = () => {
  if (isMobile.value) {
    toggleDrawer();
    return;
  }
  collapsed.value = !collapsed.value;
};

const sidebarToggleIcon = computed(() => {
  if (collapsed.value) {
    return isRtl.value ? "DoubleLeftOutlined" : "DoubleRightOutlined";
  }
  return isRtl.value ? "DoubleRightOutlined" : "DoubleLeftOutlined";
});

const sidebarToggleTitle = computed(() =>
  collapsed.value ? t("nav.expandSidebar") : t("nav.collapseSidebar"),
);

const languageToggleTitle = computed(() => t("nav.toggleLanguage"));

const themeToggleIcon = computed(() =>
  themeStore.isDark ? "SunOutlined" : "MoonOutlined",
);
const themeToggleTitle = computed(() =>
  themeStore.isDark ? t("nav.switchToLight") : t("nav.switchToDark"),
);
const themeToggleNextLabel = computed(() =>
  themeStore.isDark ? t("nav.lightModeLabel") : t("nav.darkModeLabel"),
);

/**
 * Returns focus to the drawer toggle button after the drawer closes to ensure
 * keyboard users maintain their navigation context.
 */
const focusDrawerToggle = () => {
  nextTick(() => {
    drawerToggle.value?.focus();
  });
};

const focusMainContent = () => {
  nextTick(() => {
    const element = mainContentRef.value;
    if (!element) {
      return;
    }
    element.focus({ preventScroll: true });
    if (typeof element.scrollIntoView === "function") {
      const behavior = prefersReducedMotion() ? "auto" : "smooth";
      element.scrollIntoView({ behavior, block: "start", inline: "nearest" });
    }
  });
};

/**
 * Removes focus from any element within the sidebar so that assistive
 * technologies do not keep the sidebar in the tab order when it is hidden.
 */
const resetSidebarFocus = () => {
  if (typeof document === "undefined") {
    return;
  }
  const activeElement = document.activeElement as HTMLElement | null;
  if (activeElement && sidebarRef.value?.contains(activeElement)) {
    activeElement.blur();
  }
};

/**
 * Closes the navigation drawer and clears focus when it is open on mobile.
 */
const teardownDrawerFocusTrap = () => {
  if (drawerFocusCleanup) {
    drawerFocusCleanup();
    drawerFocusCleanup = null;
  }
};

const closeDrawer = () => {
  if (!drawer.value) {
    return;
  }
  teardownDrawerFocusTrap();
  resetSidebarFocus();
  drawer.value = false;
};

/**
 * Toggles the visibility of the mobile navigation drawer, closing it when open
 * and opening it when hidden.
 */
const toggleDrawer = () => {
  if (drawer.value) {
    closeDrawer();
  } else {
    drawer.value = true;
  }
};

const mediaQuery =
  typeof window !== "undefined"
    ? window.matchMedia("(max-width: 991px)")
    : null;

let previousBodyOverflow: string | null = null;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let drawerFocusCleanup: (() => void) | null = null;

const getFocusableElements = (root: HTMLElement | null) => {
  if (!root) {
    return [] as HTMLElement[];
  }

  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("tabindex") !== "-1" &&
      element.offsetParent !== null,
  );
};

const setupDrawerFocusTrap = () => {
  if (!isMobile.value) {
    return;
  }

  if (typeof document === "undefined") {
    return;
  }

  const container = sidebarRef.value;
  if (!container) {
    return;
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(container);
    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      }
      return;
    }

    if (active === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  container.addEventListener("keydown", handleKeydown);

  drawerFocusCleanup = () => {
    container.removeEventListener("keydown", handleKeydown);
  };

  nextTick(() => {
    const focusable = getFocusableElements(container);
    if (focusable.length) {
      focusable[0].focus({ preventScroll: true });
    }
  });
};

const lockBodyScroll = () => {
  if (typeof document === "undefined") {
    return;
  }
  const body = document.body;
  if (!body) {
    return;
  }
  if (previousBodyOverflow === null) {
    previousBodyOverflow = body.style.overflow || "";
  }
  body.style.overflow = "hidden";
};

const unlockBodyScroll = () => {
  if (typeof document === "undefined") {
    return;
  }
  const body = document.body;
  if (!body) {
    return;
  }
  if (previousBodyOverflow !== null) {
    body.style.overflow = previousBodyOverflow;
    previousBodyOverflow = null;
  }
};

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if ((event.key === "Escape" || event.key === "Esc") && drawer.value) {
    event.preventDefault();
    closeDrawer();
  }
};

/**
 * Updates the responsive breakpoint flag based on the current media query
 * match, enabling mobile-specific layout behaviors.
 */
const updateBreakpoint = () => {
  isMobile.value = mediaQuery ? mediaQuery.matches : false;
};

/**
 * Applies document language and direction attributes for the chosen locale and
 * synchronizes utility CSS classes that depend on RTL/LTR state.
 *
 * @param lang Locale code that determines the direction metadata.
 */
const applyDirection = (lang: string) => {
  const nextDir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = nextDir;
    const body = document.body;
    if (body) {
      body.setAttribute("dir", nextDir);
      body.setAttribute("lang", lang);
      body.classList.toggle("is-rtl", nextDir === "rtl");
    }
  }
  direction.value = nextDir;
};

/**
 * Saves the selected locale to storage so the shell can restore language and
 * direction preferences across sessions.
 *
 * @param value Locale code to store.
 */
const persistLocale = (value: string) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
  }
  hasStoredLocale.value = true;
};

let hasInitializedLocaleWatch = false;

onMounted(() => {
  updateBreakpoint();
  mediaQuery?.addEventListener("change", updateBreakpoint);
  if (typeof document !== "undefined") {
    document.addEventListener("keydown", handleGlobalKeydown);
  }
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener("change", updateBreakpoint);
  if (typeof document !== "undefined") {
    document.removeEventListener("keydown", handleGlobalKeydown);
  }
  featureSync.disconnect();
  subscriptionUpdates.disconnect();
  notifications.disconnect();
  unlockBodyScroll();
  teardownDrawerFocusTrap();
});

watch(
  isMobile,
  (value) => {
    if (value) {
      closeDrawer();
      collapsed.value = false;
    } else {
      drawer.value = true;
      teardownDrawerFocusTrap();
      const stored = readStoredSidebarState();
      if (stored !== null) {
        collapsed.value = stored;
      }
      unlockBodyScroll();
    }
  },
  { immediate: true },
);

watch(collapsed, (value) => {
  if (!isMobile.value) {
    persistSidebarState(value);
  }
});

watch(
  () => auth.role,
  (role) => {
    if (role === "TEACHER") {
      void teacherProfileStore.load();
      return;
    }
    if (role === "STUDENT" && !studentStore.profile) {
      void studentStore
        .fetchProfile()
        .catch((error) =>
          console.warn(
            "[theme] unable to load student profile for header",
            error,
          ),
        );
    }
  },
  { immediate: true },
);

const currentBrand = computed(() => tenantStore.branding);

/**
 * Checks whether the requested feature flag is enabled for the active tenant.
 *
 * @param code Feature identifier from the feature catalog.
 * @returns True when the feature is available.
 */
const hasFeature = (code: string) => featuresStore.hasFeature(code);
const featuresUnauthorized = computed(
  () => featuresStore.error === "features.errors.unauthorized",
);
const assistantPermissionSet = computed<Set<string> | null>(() => {
  if (!auth.isAssistant) {
    return null;
  }
  return new Set((auth.assistantPermissions || []) as string[]);
});

const assistantCanBypassFeature = (permission?: string) => {
  if (!permission) {
    return false;
  }
  if (!auth.isAssistant) {
    return false;
  }
  if (!featuresUnauthorized.value) {
    return false;
  }
  const permissions = assistantPermissionSet.value;
  if (!permissions) {
    return false;
  }
  return permissions.has(permission);
};

const teacherRosterEnabled = computed(
  () =>
    assistantCanBypassFeature("students.view") ||
    hasFeature(FEATURE.teacherRosterGroups),
);
const liveSessionsCoreEnabled = computed(() =>
  hasFeature(FEATURE.liveSessionsCore),
);
const liveSessionsChatEnabled = computed(() =>
  hasFeature(FEATURE.liveSessionsChat),
);
const liveSessionsPollsEnabled = computed(() =>
  hasFeature(FEATURE.liveSessionsPolls),
);
const teacherAssistantsEnabled = computed(() =>
  hasFeature(FEATURE.teacherAssistants),
);
const teacherRegsPaymentsEnabled = computed(
  () =>
    assistantCanBypassFeature("registrations.manage") ||
    hasFeature(FEATURE.teacherRegsPayments),
);
const teacherPlanUpgradeEnabled = computed(() =>
  hasFeature(FEATURE.teacherSubscriptions),
);
const teacherReportsEnabled = computed(
  () =>
    assistantCanBypassFeature("reports.view") ||
    hasFeature(FEATURE.reportsTeacher),
);
const studentReportsEnabled = computed(() =>
  hasFeature(FEATURE.reportsStudent),
);
const platformSyndicationEnabled = computed(() =>
  hasFeature(FEATURE.platformSyndication),
);
const adminModerationEnabled = computed(() =>
  hasFeature(FEATURE.adminModeration),
);
const adminOpsEnabled = computed(() => hasFeature(FEATURE.adminOps));
const analyticsPlatformEnabled = computed(() =>
  hasFeature(FEATURE.analyticsPlatform),
);
const englishLabEnabled = computed(() => hasFeature(FEATURE.englishLab));

const offersEnabled = computed(() => hasFeature(FEATURE.offers));
const examWorkflowsEnabled = computed(() => hasFeature(FEATURE.examWorkflows));

const multiTeacherStudentEnabled = computed(() =>
  hasFeature(FEATURE.multiTeacherStudent),
);
const showStudentTenantSwitcher = computed(
  () => multiTeacherStudentEnabled.value && auth.isStudent,
);

const notificationsUnifiedEnabled = computed(
  () =>
    assistantCanBypassFeature("communications.manage") ||
    hasFeature(FEATURE.notificationsUnified),
);
const badgesEnabled = computed(
  () =>
    assistantCanBypassFeature("courses.manage") || hasFeature(FEATURE.badges),
);

const teacherFeaturesToTrack: FeatureCode[] = [
  FEATURE.teacherRosterGroups,
  FEATURE.teacherAssistants,
  FEATURE.teacherRegsPayments,
  FEATURE.teacherSubscriptions,
  FEATURE.liveSessionsCore,
  FEATURE.liveSessionsChat,
  FEATURE.liveSessionsPolls,
  FEATURE.reportsTeacher,
  FEATURE.offers,
  FEATURE.notificationsUnified,
  FEATURE.badges,
  FEATURE.englishLab,
];

const TEACHER_FEATURE_NAV_KEYS: Partial<Record<FeatureCode, string[]>> = {
  [FEATURE.teacherRosterGroups]: ["nav.teacherStudents"],
  [FEATURE.teacherAssistants]: ["nav.teacherAssistants"],
  [FEATURE.teacherRegsPayments]: [
    "nav.teacherRegistrations",
    "nav.teacherPayments",
  ],
  [FEATURE.teacherSubscriptions]: ["nav.teacherUpgradePlan"],
  [FEATURE.liveSessionsCore]: ["nav.teacherLiveSessions"],
  [FEATURE.liveSessionsChat]: ["nav.teacherLiveModeration"],
  [FEATURE.liveSessionsPolls]: ["nav.teacherLivePolls"],
  [FEATURE.reportsTeacher]: ["nav.teacherReports"],
  [FEATURE.offers]: ["nav.teacherOffers"],
  [FEATURE.notificationsUnified]: ["nav.teacherNotifications"],
  [FEATURE.badges]: ["nav.teacherBadges"],
  [FEATURE.englishLab]: ["nav.teacherEnglishLab"],
};

const teacherFeatureSnapshot = new Map<FeatureCode, boolean>();
let hasSeededTeacherFeatures = false;
const lostTeacherFeatureCodes = ref<FeatureCode[]>([]);
const teacherDowngradeVisible = ref(false);

watch(
  () => teacherFeaturesToTrack.map((code) => featuresStore.hasFeature(code)),
  () => {
    if (featuresStore.audience !== "secure") {
      if (
        hasSeededTeacherFeatures ||
        teacherFeatureSnapshot.size > 0 ||
        lostTeacherFeatureCodes.value.length > 0 ||
        teacherDowngradeVisible.value
      ) {
        teacherFeatureSnapshot.clear();
        lostTeacherFeatureCodes.value = [];
        teacherDowngradeVisible.value = false;
        hasSeededTeacherFeatures = false;
      }
      return;
    }

    const lostCodes: FeatureCode[] = [];
    const regainedCodes: FeatureCode[] = [];

    for (const code of teacherFeaturesToTrack) {
      const next = featuresStore.hasFeature(code);
      const previous = teacherFeatureSnapshot.get(code);

      if (hasSeededTeacherFeatures) {
        if (previous && !next) {
          lostCodes.push(code);
        } else if (!previous && next) {
          regainedCodes.push(code);
        }
      }

      teacherFeatureSnapshot.set(code, next);
    }

    if (!hasSeededTeacherFeatures) {
      hasSeededTeacherFeatures = true;
      return;
    }

    const lostSet = new Set(lostTeacherFeatureCodes.value);

    if (regainedCodes.length) {
      for (const code of regainedCodes) {
        lostSet.delete(code);
      }
    }

    if (lostCodes.length) {
      for (const code of lostCodes) {
        lostSet.add(code);
      }
    }

    lostTeacherFeatureCodes.value = Array.from(lostSet);

    if (lostCodes.length) {
      teacherDowngradeVisible.value = true;
    } else if (lostSet.size === 0) {
      teacherDowngradeVisible.value = false;
    }
  },
  { immediate: true },
);

watch(
  () => featuresStore.audience,
  (audience) => {
    if (audience !== "secure") {
      teacherFeatureSnapshot.clear();
      lostTeacherFeatureCodes.value = [];
      teacherDowngradeVisible.value = false;
      hasSeededTeacherFeatures = false;
    }
  },
);

watch(
  () => auth.isTeacher,
  (isTeacher) => {
    if (!isTeacher) {
      lostTeacherFeatureCodes.value = [];
      teacherDowngradeVisible.value = false;
      teacherFeatureSnapshot.clear();
      hasSeededTeacherFeatures = false;
      landingInquiries.unreadCount = 0;
    }
    if (isTeacher) {
      void landingInquiries.refreshUnreadCount();
    }
  },
);

const notificationsCount = computed(() =>
  notificationsUnifiedEnabled.value ? notifications.unreadCount : 0,
);
const showNotificationsBadge = computed(() => notificationsCount.value > 0);
const notificationsBadgeLabel = computed(() => {
  if (!showNotificationsBadge.value) {
    return "";
  }
  const count = notificationsCount.value;
  return count > 99 ? "99+" : String(count);
});

const landingInquiryBadgeLabel = computed(() => {
  const count = landingInquiries.unreadCount ?? 0;
  if (count <= 0) {
    return null;
  }
  return count > 99 ? "99+" : String(count);
});

watch(
  () => [notificationsUnifiedEnabled.value, auth.isAuthenticated],
  ([enabled, authenticated]) => {
    if (enabled && authenticated) {
      notifications.fetchForCurrentUser();
      notifications.connect();
    } else {
      notifications.disconnect();
      notifications.clear();
    }
  },
  { immediate: true },
);

watch(
  () => auth.isAuthenticated,
  (authenticated) => {
    if (!authenticated) {
      subscriptionStore.clear();
      subscriptionUpdates.disconnect();
    }
  },
);

const tenantSlug = computed(() => {
  if (tenantStore.slug) {
    return tenantStore.slug;
  }
  if (tenantStore.branding?.slug) {
    return tenantStore.branding.slug;
  }
  return "";
});

const ensureSidebarFeatureContext = async () => {
  const slug = (tenantSlug.value || "").trim().toLowerCase();
  const tenant = slug || null;
  const role = auth.role ?? undefined;
  const audience = auth.isAuthenticated ? "secure" : "public";

  try {
    await featuresStore.ensureLoaded({ tenant, role, audience });
  } catch (error) {
    console.warn("[theme] unable to ensure feature context for sidebar", error);
  }
};

watch(
  () => [auth.isAuthenticated, auth.role, tenantSlug.value],
  ([authenticated, role, slug]) => {
    const normalizedSlug = (slug || "").trim().toLowerCase();
    if (
      !authenticated ||
      !normalizedSlug ||
      (role !== "TEACHER" && role !== "STUDENT")
    ) {
      featureSync.disconnect();
      return;
    }
    featureSync.connect(normalizedSlug);
  },
  { immediate: true },
);

watch(
  () => [auth.isAuthenticated, auth.role, tenantSlug.value],
  () => {
    void ensureSidebarFeatureContext();
  },
  { immediate: true },
);

watch(
  () => [auth.isAuthenticated, auth.teacherId, auth.role, tenantSlug.value],
  ([authenticated, teacherId, role]) => {
    if (
      authenticated &&
      teacherId &&
      (role === "TEACHER" || role === "TEACHER_ASSISTANT")
    ) {
      subscriptionUpdates.connect();
      if (!subscriptionStore.summary) {
        void subscriptionStore.loadSubscription();
      }
    } else {
      subscriptionUpdates.disconnect();
    }
  },
  { immediate: true },
);

const buildSubscriptionSignature = () => {
  const summary = subscriptionStore.summary;
  if (!summary) {
    return "";
  }
  const current = summary.currentSubscription;
  const currentSignature = current
    ? [
        current.planCode ?? "",
        current.status ?? "",
        current.cancelAt ?? "",
        current.endsAt ?? "",
        current.startsAt ?? "",
      ].join("|")
    : "none";
  const pendingSignature = (summary.pendingRequests || [])
    .map((request) =>
      [
        request.id ?? 0,
        request.planCode ?? "",
        request.status ?? "",
        request.updatedAt ?? "",
        request.captureStatus ?? "",
      ].join("|"),
    )
    .join(";");
  return `${currentSignature}::${pendingSignature}`;
};

const subscriptionContextSignature = computed(buildSubscriptionSignature);
const isRefreshingTeacherSubscriptionContext = ref(false);

const refreshTeacherSubscriptionContext = async () => {
  if (isRefreshingTeacherSubscriptionContext.value) {
    return;
  }
  isRefreshingTeacherSubscriptionContext.value = true;
  try {
    await Promise.allSettled([
      (async () => {
        try {
          await featuresStore.refresh();
        } catch (error) {
          console.warn(
            "[theme] failed to refresh features after subscription update",
            error,
          );
        }
      })(),
      (async () => {
        try {
          await teacherProfileStore.load(true);
        } catch (error) {
          console.warn(
            "[theme] failed to refresh teacher profile after subscription update",
            error,
          );
        }
      })(),
    ]);
  } finally {
    isRefreshingTeacherSubscriptionContext.value = false;
  }
};

watch(
  () => [
    auth.isTeacher || auth.isAssistant,
    subscriptionContextSignature.value,
  ],
  ([isTeacherOrAssistant, signature], previous) => {
    const previousSignature = Array.isArray(previous) ? previous[1] : undefined;
    if (!isTeacherOrAssistant) {
      return;
    }
    if (!signature || signature === previousSignature) {
      return;
    }
    void refreshTeacherSubscriptionContext();
  },
  { immediate: false },
);

/**
 * Builds the public teacher landing page URL when the authenticated user is a
 * teacher with an assigned tenant slug.
 *
 * @returns The route path to the teacher landing page or an empty string.
 */
const teacherLandingUrl = computed(() => {
  if (!auth.isTeacher) {
    return "";
  }
  const slug = tenantSlug.value;
  if (!slug) {
    return "";
  }
  return `/teacher/${slug}`;
});

/**
 * Resolves the primary dashboard destination based on the authenticated role.
 *
 * @returns Default landing route for teachers, students, or guests.
 */
const homeDestination = computed(() => {
  if (auth.isTeacher) {
    return "/teacher";
  }
  if (auth.isAssistant) {
    return "/assistant";
  }
  if (auth.isStudent) {
    return "/student/learning";
  }
  return "/";
});

const teacherPlanCode = computed(() => {
  const subscriptionPlan = (
    subscriptionStore.currentSubscription?.planCode || ""
  )
    .toString()
    .toLowerCase()
    .trim();
  if (subscriptionPlan) {
    return subscriptionPlan;
  }

  const profilePlan = (teacherProfileStore.profile?.plan || "")
    .toLowerCase()
    .trim();
  if (profilePlan) {
    return profilePlan;
  }

  const featurePlan = (featuresStore.plan || "").toLowerCase().trim();
  if (featurePlan) {
    return featurePlan;
  }

  return "";
});
const teacherNavModel = computed(() =>
  buildTeacherNavModel({
    t,
    isTeacher: auth.isTeacher,
    isAssistant: auth.isAssistant,
    assistantPermissions: assistantPermissionSet.value,
    featuresUnauthorized: featuresUnauthorized.value,
    teacherLandingUrl: teacherLandingUrl.value,
    teacherRosterEnabled: teacherRosterEnabled.value,
    liveSessionsCoreEnabled: liveSessionsCoreEnabled.value,
    liveSessionsChatEnabled: liveSessionsChatEnabled.value,
    liveSessionsPollsEnabled: liveSessionsPollsEnabled.value,
    teacherAssistantsEnabled: teacherAssistantsEnabled.value,
    teacherRegsPaymentsEnabled: teacherRegsPaymentsEnabled.value,
    teacherPaymentSettingsAvailable: teacherPaymentSettingsAvailable.value,
    teacherReportsEnabled: teacherReportsEnabled.value,
    offersEnabled: offersEnabled.value,
    adminOpsEnabled: adminOpsEnabled.value,
    englishLabEnabled: englishLabEnabled.value,
    badgesEnabled: badgesEnabled.value,
    notificationsUnifiedEnabled: notificationsUnifiedEnabled.value,
    examWorkflowsEnabled: examWorkflowsEnabled.value,
    notificationsBadgeLabel: notificationsBadgeLabel.value,
    landingInquiryBadgeLabel: landingInquiryBadgeLabel.value,
  }),
);

const teacherNavItems = computed<NavItem[]>(() => teacherNavModel.value.items);

const assistantSuppressedNavItems = computed<TeacherNavSuppressedItem[]>(() => {
  if (!auth.isAssistant) {
    return [];
  }
  return teacherNavModel.value.suppressed.filter(
    (entry) => entry.reason === "feature-disabled",
  );
});

const teacherPlanDisplay = computed(() => {
  if (!teacherPlanCode.value) {
    return t("nav.teacherPlanUnknown");
  }
  const normalized = teacherPlanCode.value;
  const key = `teacher.plan${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
  const localized = t(key as any);
  return localized === key ? (featuresStore.plan ?? normalized) : localized;
});

/**
 * Admin navigation tailored for platform administrators.
 *
 * @returns Navigation entries for the platform admin console.
 */
const adminNavItems = computed<NavItem[]>(() => {
  if (!auth.isPlatformAdmin) {
    return [];
  }

  const items: NavItem[] = [
    {
      label: t("nav.platformPlansWorkspace"),
      to: "/admin/plans",
      icon: "SettingOutlined",
    },
    {
      label: t("nav.adminTeachers"),
      to: "/admin/teachers",
      icon: "IdcardOutlined",
    },
    {
      label: t("nav.adminStudents"),
      to: "/admin/students",
      icon: "TeamOutlined",
    },
    {
      label: t("nav.adminMessages"),
      to: "/admin/platform-messages",
      icon: "MailOutlined",
    },
    {
      label: t("nav.adminFeedback"),
      to: "/admin/feedback",
      icon: "MessageOutlined",
    },
  ];

  if (platformSyndicationEnabled.value) {
    items.push({
      label: t("nav.adminPublications"),
      to: "/admin/publications",
      icon: "PlaySquareOutlined",
    });
  }

  if (analyticsPlatformEnabled.value) {
    items.push({
      label: t("nav.adminAnalytics"),
      to: "/admin/analytics",
      icon: "LineChartOutlined",
    });
  }

  if (adminModerationEnabled.value) {
    items.push({
      label: t("nav.adminModeration"),
      to: "/admin/courses",
      icon: "SafetyCertificateOutlined",
    });
  }

  if (adminOpsEnabled.value) {
    items.push(
      {
        label: t("nav.adminOps"),
        to: "/admin/ops/backups",
        icon: "DatabaseOutlined",
      },
      {
        label: t("nav.adminOpsAlerts"),
        to: "/admin/ops/alerts",
        icon: "WarningOutlined",
      },
      {
        label: t("nav.adminOpsPayments"),
        to: "/admin/ops/payments",
        icon: "CreditCardOutlined",
      },
      {
        label: t("nav.adminOpsAudit"),
        to: "/admin/ops/audit",
        icon: "FileSearchOutlined",
      },
    );
  }

  return items;
});

/**
 * Student navigation entries including fallbacks for unauthenticated users.
 *
 * @returns Navigation configuration for students or login shortcuts.
 */
const studentNavItems = computed<NavItem[]>(() => {
  if (auth.isStudent) {
    const items: NavItem[] = [
      {
        label: t("nav.student"),
        to: "/student/home",
        icon: "SolutionOutlined",
      },
      {
        label: t("nav.studentTeacherCourses"),
        to: "/student/teacher-courses",
        icon: "ReadOutlined",
      },
      {
        label: t("nav.studentAssessments"),
        to: "/student/assessments",
        icon: "AuditOutlined",
      },
    ];

    if (studentReportsEnabled.value) {
      items.push({
        label: t("nav.studentReports"),
        to: "/student/reports",
        icon: "LineChartOutlined",
      });
    }

    if (badgesEnabled.value) {
      items.push({
        label: t("nav.studentBadges"),
        to: "/student/badges",
        icon: "TrophyOutlined",
      });
    }

    if (notificationsUnifiedEnabled.value) {
      items.push({
        label: t("nav.studentNotifications"),
        to: "/student/notifications",
        icon: "NotificationOutlined",
        badge: notificationsBadgeLabel.value || undefined,
      });
    }

    items.push({
      label: t("nav.studentFeedback"),
      to: "/student/feedback",
      icon: "CommentOutlined",
    });

    if (englishLabEnabled.value) {
      items.push({
        label: t("nav.studentEnglishLab"),
        to: "/student/english-lab",
        icon: "BookOutlined",
      });
    }

    if (offersEnabled.value) {
      items.push({
        label: t("nav.studentCheckout"),
        to: "/student/checkout",
        icon: "ShoppingCartOutlined",
      });
    }

    return items;
  }

  if (!auth.isTeacher) {
    return [
      {
        label: t("nav.student"),
        to: "/student/login",
        icon: "UserAddOutlined",
      },
    ];
  }

  return [];
});

/**
 * Guest navigation to help platform visitors find teacher onboarding.
 *
 * @returns Navigation entries for unauthenticated teachers.
 */
const guestTeacherNavItems = computed<NavItem[]>(() => {
  if (!auth.isTeacher && !auth.isStudent && !auth.isAssistant) {
    const slug =
      tenantSlug.value || import.meta.env.VITE_TENANT_SLUG?.trim() || "demo";
    const location: NavItem = {
      label: t("nav.teacher"),
      icon: "UserSwitchOutlined",
    };
    if (slug) {
      location.to = { name: "login-teacher", query: { tenant: slug } };
    } else {
      location.to = { name: "login-teacher" };
    }
    return [location];
  }
  return [];
});

/**
 * Produces the sidebar navigation collection tailored to the current user role
 * and enabled feature flags, including optional badges for notifications.
 *
 * @returns A fully configured navigation item list for rendering.
 */
const homeLabel = computed(() => {
  if (auth.isTeacher || auth.isPlatformAdmin) {
    return t("nav.homeTeacher");
  }
  if (auth.isAssistant) {
    return t("nav.homeAssistant");
  }
  return t("nav.home");
});

const navItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    {
      label: homeLabel.value,
      to: homeDestination.value,
      icon: "DashboardOutlined",
    },
  ];

  items.push(
    ...teacherNavItems.value,
    ...adminNavItems.value,
    ...studentNavItems.value,
    ...guestTeacherNavItems.value,
  );

  return items;
});

const teacherFallbackRoute = computed<RouteLocationRaw>(() => {
  if (!auth.isTeacher) {
    return homeDestination.value;
  }

  const teacherRoute = navItems.value.find((item) => {
    if (!item.to) {
      return false;
    }
    const target = resolveNavTarget(item.to);
    if (!target || typeof target !== "string") {
      return false;
    }
    return target === "/teacher" || target.startsWith("/teacher/");
  });

  return teacherRoute?.to ?? homeDestination.value;
});

/**
 * Normalizes a router target into a resolved route record, gracefully handling
 * undefined inputs for static navigation entries.
 *
 * @param target Optional location raw passed to navigation items.
 * @returns The resolved route location to use for comparisons.
 */
const resolveNavTarget = (target?: RouteLocationRaw) => {
  if (!target) {
    return undefined;
  }
  if (typeof target === "string") {
    return target;
  }
  const resolved = router.resolve(target);
  return resolved.path || resolved.href;
};

/**
 * Generates a unique key for navigation items so Vue can efficiently track
 * dynamic entries in the sidebar loop.
 *
 * @param item Navigation item describing the destination.
 * @returns Stable string identifier for the nav item.
 */
const navItemKey = (item: NavItem) => {
  const resolvedTarget = resolveNavTarget(item.to);
  if (resolvedTarget) {
    return `to:${resolvedTarget}`;
  }
  if (item.href) {
    return `href:${item.href}`;
  }
  return `label:${item.label}`;
};

const brandName = computed(() => currentBrand.value?.name || "Zidni AI");

const teacherDisplayName = computed(() => {
  const profileName = teacherProfileStore.profile?.name?.trim();
  if (profileName) {
    return profileName;
  }

  const cachedName = (teacherProfileStore.cachedName || "").trim();
  return cachedName || "";
});
const studentDisplayName = computed(
  () => studentStore.profile?.name?.trim() || "",
);

const headerUserName = computed(() => {
  if (auth.isTeacher) {
    return teacherDisplayName.value || brandName.value;
  }
  if (auth.isStudent) {
    return studentDisplayName.value || brandName.value;
  }
  return brandName.value;
});

const brandInitials = computed(() => {
  const source = brandName.value;
  const letters = source
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() || "");
  const initials = letters.slice(0, 2).join("");
  return initials || "ZA";
});

const brandTagline = computed(
  () => currentBrand.value?.branding?.tagline as string | undefined,
);

const authRole = computed(() => auth.role || "");

const authRoleLabel = computed(() => {
  if (authRole.value === "TEACHER") return t("nav.teacher");
  if (authRole.value === "STUDENT") return t("nav.student");
  if (authRole.value === "PLATFORM_ADMIN") return t("nav.platformAdmin");
  return t("nav.profile");
});

/**
 * Converts a router location into a normalized path string used for equality
 * checks when deciding whether a navigation entry is active.
 *
 * @param value Router location to normalize.
 * @returns String path suitable for comparisons.
 */
const normalizePath = (value: RouteLocationRaw) => {
  const resolved = resolveNavTarget(value);
  if (!resolved) {
    return "";
  }
  if (resolved === "/") return "/";
  return resolved.replace(/\/+$/, "");
};

const navHierarchy = computed(() => {
  const entries: { item: NavItem; path: string }[] = [];
  const descendantMap = new Map<string, Set<string>>();

  const registerDescendant = (parent: string, child: string) => {
    if (!descendantMap.has(parent)) {
      descendantMap.set(parent, new Set());
    }
    descendantMap.get(parent)!.add(child);
  };

  for (const item of navItems.value) {
    if (!item.to) {
      continue;
    }
    const normalized = normalizePath(item.to);
    if (!normalized) {
      continue;
    }
    entries.push({ item, path: normalized });

    if (normalized === "/") {
      continue;
    }

    registerDescendant("/", normalized);

    let cursor = normalized;
    while (cursor.lastIndexOf("/") > 0) {
      cursor = cursor.slice(0, cursor.lastIndexOf("/")) || "/";
      registerDescendant(cursor, normalized);
      if (cursor === "/") {
        break;
      }
    }
  }

  return {
    entries,
    descendantMap,
  };
});

const ensureRouteAccessible = () => {
  if (!auth.isTeacher) {
    return;
  }

  const currentPath = normalizePath(route.path);
  if (!currentPath.startsWith("/teacher")) {
    return;
  }

  const hasMatch = navHierarchy.value.entries.some(({ path }) => {
    if (!path) {
      return false;
    }
    if (currentPath === path) {
      return true;
    }
    return currentPath.startsWith(`${path}/`);
  });

  if (hasMatch) {
    return;
  }

  const fallback = teacherFallbackRoute.value;
  if (!fallback) {
    return;
  }

  const fallbackPath = normalizePath(fallback);
  if (fallbackPath === currentPath) {
    return;
  }

  router.replace(fallback).catch((error) => {
    if (!isNavigationFailure(error)) {
      console.warn(
        "[theme] failed to redirect to a supported teacher route",
        error,
      );
    }
  });
};

watch(
  navItems,
  () => {
    ensureRouteAccessible();
  },
  { deep: true },
);

watch(
  () => route.path,
  () => {
    ensureRouteAccessible();
  },
  { immediate: true },
);

watch(
  () => route.fullPath,
  () => {
    closeUserMenu();
  },
);

watch(hasUserMenu, (value) => {
  if (!value) {
    closeUserMenu();
  }
});

/**
 * Determines whether the provided navigation target should be considered
 * active for the current route, accounting for nested paths.
 *
 * @param target Optional navigation target to evaluate.
 * @returns True when the current route matches or resides within the target.
 */
const isNavActive = (target?: RouteLocationRaw) => {
  if (!target) {
    return false;
  }

  const normalizedTarget = normalizePath(target);
  if (!normalizedTarget) {
    return false;
  }
  const currentPath = normalizePath(route.path);

  if (normalizedTarget === "/") {
    return currentPath === "/";
  }

  if (currentPath === normalizedTarget) {
    return true;
  }

  if (!currentPath.startsWith(`${normalizedTarget}/`)) {
    return false;
  }

  const descendants = navHierarchy.value.descendantMap.get(normalizedTarget);
  if (!descendants || descendants.size === 0) {
    return true;
  }

  for (const candidate of descendants) {
    if (currentPath === candidate || currentPath.startsWith(`${candidate}/`)) {
      return false;
    }
  }

  return true;
};

/**
 * Builds breadcrumb items based on the active navigation entry and router
 * metadata so the top bar can show page hierarchy.
 *
 * @returns Ordered breadcrumb objects for rendering.
 */
const breadcrumbs = computed(() => {
  const crumbs: { title: string; to?: RouteLocationRaw }[] = [];
  const homeItem = navItems.value[0];
  if (homeItem) {
    crumbs.push({ title: homeItem.label, to: homeItem.to });
  }
  const activeNav = navItems.value.find((item) => isNavActive(item.to));
  const fallbackTitle =
    (route.meta?.title as string | undefined) ||
    (typeof route.name === "string"
      ? route.name.replace(/[-_]/g, " ")
      : undefined);
  if (
    activeNav &&
    (!crumbs.length || crumbs[crumbs.length - 1].title !== activeNav.label)
  ) {
    crumbs.push({ title: activeNav.label, to: activeNav.to });
  } else if (fallbackTitle) {
    crumbs.push({ title: fallbackTitle, to: route.fullPath });
  }
  return crumbs;
});

/**
 * Resolves the page title to display in the top bar using breadcrumb context
 * with a fallback to the route meta title.
 *
 * @returns Localized title string for the current view.
 */
const pageTitle = computed(() => {
  const crumbs = breadcrumbs.value;
  if (crumbs.length) {
    return crumbs[crumbs.length - 1]?.title || brandName.value;
  }
  return brandName.value;
});

const userSubtitle = computed(() => {
  if (authRole.value === "TEACHER" || authRole.value === "STUDENT") {
    const name = headerUserName.value?.trim();
    if (name) {
      return `${authRoleLabel.value} · ${name}`;
    }
    return authRoleLabel.value;
  }
  return "";
});

const currentYear = new Date().getFullYear();

/**
 * Switches between supported locales and persists the choice for future
 * sessions while reapplying direction metadata.
 */
const toggleLanguage = async () => {
  const nextLocale = locale.value === "ar" ? "en" : "ar";
  await loadLocaleMessages(nextLocale);
  locale.value = nextLocale;
};

const languageLabel = computed(() => (locale.value === "ar" ? "EN" : "AR"));

watch(
  locale,
  (value) => {
    if (!hasInitializedLocaleWatch) {
      hasInitializedLocaleWatch = true;
      applyDirection(value);
      if (normalizedStoredLocale) {
        persistLocale(value);
      }
      return;
    }

    persistLocale(value);
    applyDirection(value);
  },
  { immediate: true },
);

/**
 * Fetches tenant branding data for the current slug so the shell can display
 * contextual names, colors, and localization defaults.
 */
const loadBranding = async () => {
  try {
    await tenantStore.fetchBranding(route.params.slug as string | undefined);
  } catch (error) {
    console.warn("[theme] unable to load tenant branding for shell", error);
  } finally {
    await ensureSidebarFeatureContext();
  }
};

onMounted(() => {
  void loadBranding();
  if (auth.isTeacher) {
    void landingInquiries.refreshUnreadCount();
  }
});

watch(
  () => route.params.slug,
  () => {
    void loadBranding();
  },
);

watch(
  currentBrand,
  async (brand) => {
    const normalizedDefault = resolveLocale(brand?.branding?.defaultLocale);

    if (normalizedDefault && !hasStoredLocale.value) {
      if (locale.value !== normalizedDefault) {
        await loadLocaleMessages(normalizedDefault);
        locale.value = normalizedDefault;
      } else {
        applyDirection(normalizedDefault);
      }
    } else {
      applyDirection(locale.value);
    }

    if (typeof document === "undefined") {
      return;
    }

    const colors =
      (brand?.branding?.colors as Record<string, string> | undefined) || {};
    const computedStyles = getComputedStyle(document.documentElement);
    const primary =
      colors.primary ||
      computedStyles.getPropertyValue("--sakai-primary") ||
      "#06b6d4";
    const secondary =
      colors.secondary ||
      computedStyles.getPropertyValue("--sakai-secondary") ||
      "#1e3a8a";
    document.documentElement.style.setProperty(
      "--sakai-primary",
      primary.trim(),
    );
    document.documentElement.style.setProperty(
      "--sakai-secondary",
      secondary.trim(),
    );
    if (colors.primaryDark) {
      document.documentElement.style.setProperty(
        "--sakai-primary-700",
        colors.primaryDark,
      );
    }
  },
  { immediate: true },
);

watch(
  () => route.fullPath,
  () => {
    if (isMobile.value) {
      closeDrawer();
    }
  },
);

const teacherDowngradeLabelKeys = computed(() => {
  const keys = new Set<string>();
  for (const code of lostTeacherFeatureCodes.value) {
    const mapping = TEACHER_FEATURE_NAV_KEYS[code];
    if (!mapping) {
      continue;
    }
    for (const key of mapping) {
      keys.add(key);
    }
  }
  return Array.from(keys);
});

const teacherDowngradeLabels = computed(() =>
  teacherDowngradeLabelKeys.value.map((key) => t(key)),
);

const showTeacherDowngradeBanner = computed(
  () =>
    auth.isTeacher &&
    teacherDowngradeVisible.value &&
    (teacherDowngradeLabels.value.length > 0 ||
      lostTeacherFeatureCodes.value.length > 0),
);

const dismissTeacherDowngradeBanner = () => {
  teacherDowngradeVisible.value = false;
};

watch(drawer, (isOpen, wasOpen) => {
  if (isMobile.value) {
    if (isOpen) {
      lockBodyScroll();
      setupDrawerFocusTrap();
    } else {
      unlockBodyScroll();
      teardownDrawerFocusTrap();
    }
  }
  if (!isOpen && wasOpen && isMobile.value) {
    focusDrawerToggle();
  }
});

/**
 * Handles navigation item clicks by closing the drawer on mobile viewports to
 * return focus to the page content.
 */
const handleNavigate = () => {
  if (isMobile.value) {
    closeDrawer();
  }
  focusMainContent();
};
</script>

<style scoped>
.theme-skip-link {
  position: fixed;
  inset-inline-start: var(--sakai-space-4);
  top: var(--sakai-space-4);
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
  padding: 0.75rem 1.25rem;
  border-radius: var(--sakai-border-radius-pill);
  background: var(--sakai-primary);
  color: var(--sakai-primary-contrast);
  font-weight: var(--sakai-font-weight-semibold);
  transform: translateY(-200%);
  transition: transform var(--sakai-transition-duration)
    var(--sakai-transition-ease);
}

.theme-skip-link:focus-visible {
  transform: translateY(0);
  outline: none;
  box-shadow: var(--sakai-shadow-focus);
}

.theme-app-shell__close {
  display: none;
  align-self: flex-end;
  background: transparent;
  border: none;
  padding: 0.35rem;
  border-radius: var(--sakai-border-radius-md);
  color: var(--sakai-text-color-tertiary);
}

.theme-app-shell__badge {
  margin-inline-start: auto;
  background: color-mix(in srgb, var(--sakai-primary) 16%, transparent);
  color: var(--sakai-primary-700);
  border-radius: var(--sakai-border-radius-pill);
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.theme-app-shell__sidebar-alert {
  position: relative;
  margin: var(--sakai-space-3);
  margin-block-end: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-warning) 32%, transparent);
  background: var(--sakai-warning-surface);
  color: var(--sakai-text-color);
  padding: var(--sakai-space-3);
  box-shadow: var(--sakai-shadow-sm);
}

.theme-app-shell__sidebar-alert-title {
  margin: 0 0 0.35rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.theme-app-shell__sidebar-alert-body {
  margin: 0 0 var(--sakai-space-2);
  color: var(--sakai-text-color-secondary);
  font-size: var(--sakai-font-size-sm);
}

.teacher-terms {
  display: grid;
  gap: var(--sakai-space-3);
  color: var(--sakai-text-color);
}

.teacher-terms__welcome,
.teacher-terms__intro,
.teacher-terms__closing {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: 1.7;
}

.teacher-terms__sections {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-terms__section {
  display: grid;
  gap: var(--sakai-space-2);
}

.teacher-terms__section-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.teacher-terms__section-body {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: 1.7;
}

.teacher-terms__section-list {
  margin: 0;
  padding-inline-start: var(--sakai-space-4);
  display: grid;
  gap: var(--sakai-space-1);
  color: var(--sakai-text-color-secondary);
  line-height: 1.7;
}

.teacher-terms__actions {
  display: flex;
  justify-content: flex-end;
}

.theme-app-shell__sidebar-alert-caption {
  margin: 0 0 0.35rem;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.75rem;
  font-weight: var(--sakai-font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.theme-app-shell__sidebar-alert-list {
  margin: 0;
  padding-inline-start: calc(var(--sakai-space-3) + 0.75rem);
  display: grid;
  gap: 0.25rem;
  color: var(--sakai-text-color);
  font-size: 0.8rem;
}

.theme-app-shell__sidebar-alert-list li {
  list-style: disc;
}

.theme-app-shell__nav-alert {
  margin: 0 var(--sakai-space-3) var(--sakai-space-3);
  width: calc(100% - var(--sakai-space-6));
  border-radius: var(--sakai-border-radius-lg);
  display: grid;
  gap: var(--sakai-space-2);
}

.theme-app-shell__nav-alert-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.theme-app-shell__nav-alert-body {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.85rem;
}

.theme-app-shell__nav-alert-list {
  margin: 0;
  padding-inline-start: calc(var(--sakai-space-3) + 0.75rem);
  display: grid;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--sakai-text-color);
}

.theme-app-shell__nav-alert-list li {
  list-style: disc;
}

.theme-app-shell__sidebar-alert-dismiss {
  position: absolute;
  top: var(--sakai-space-2);
  inset-inline-end: var(--sakai-space-2);
  background: transparent;
  border: none;
  padding: 0.25rem;
  border-radius: var(--sakai-border-radius-md);
  color: var(--sakai-text-color-tertiary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.theme-app-shell__sidebar-alert-dismiss:hover {
  background: color-mix(in srgb, var(--sakai-warning) 18%, transparent);
  color: var(--sakai-text-color);
}

.theme-app-shell__sidebar-alert-dismiss:focus-visible {
  outline: 0.125rem solid var(--sakai-focus-ring-color);
  outline-offset: 0.1rem;
}

.theme-topbar__meta {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
}

.theme-topbar__heading {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.theme-topbar__subtitle {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: var(--sakai-font-size-sm);
}

.theme-topbar__search {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  background: var(--sakai-surface);
  border-radius: var(--sakai-border-radius-pill);
  border: 1px solid var(--sakai-border-color);
  padding: 0.4rem 1rem;
  box-shadow: var(--sakai-shadow-sm);
  flex: 1;
  max-width: 28rem;
  min-width: 0; /* Help Safari flex */
  margin-inline: var(--sakai-space-2);
}

.theme-topbar__search-input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.95rem;
  background: transparent;
}

.theme-topbar__actions {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  flex-shrink: 0; /* Don't squash actions on Safari */
}

.theme-topbar__tenant-switcher {
  display: inline-flex;
}

.theme-icon-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  border-radius: var(--sakai-border-radius-pill);
  border: 1px solid transparent;
  background: var(--sakai-surface-alt);
  color: var(--sakai-text-color-secondary);
  font-size: 0.85rem;
  font-weight: var(--sakai-font-weight-medium);
  cursor: pointer;
  transition: background-color var(--sakai-transition-duration)
    var(--sakai-transition-ease);
  text-decoration: none;
}

.theme-app-shell__nav-item:focus-visible,
.theme-icon-button:focus-visible,
.theme-topbar__search-input:focus-visible {
  outline: 0.125rem solid var(--sakai-focus-ring-color);
  outline-offset: 0.2rem;
}

.theme-topbar__search-input:focus-visible {
  box-shadow: none;
}

.theme-icon-button--notification {
  padding-right: 1.75rem;
}

.theme-icon-badge {
  position: absolute;
  top: 0.2rem;
  right: 0.45rem;
  min-width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  background: var(--sakai-danger);
  color: var(--sakai-primary-contrast);
  font-size: 0.75rem;
  font-weight: var(--sakai-font-weight-semibold);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.35rem;
}

.theme-icon-button:hover {
  background: color-mix(
    in srgb,
    var(--sakai-primary) 10%,
    var(--sakai-surface-alt)
  );
  color: var(--sakai-primary-600);
}

/* .theme-app-shell__content {
  scroll-margin-top: calc(var(--sakai-topbar-height) + var(--sakai-space-4));
} */

.theme-topbar__user {
  position: relative;
}

.theme-topbar__user-toggle,
.theme-topbar__user-display {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
  padding: 0.35rem 0.65rem;
  border-radius: var(--sakai-border-radius-pill);
  border: 1px solid var(--sakai-border-color); /* Fallback */
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  background: var(--sakai-surface-alt);
  transition:
    background-color var(--sakai-transition-duration)
      var(--sakai-transition-ease),
    color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.theme-topbar__user-toggle {
  cursor: pointer;
}

.theme-topbar__user-display {
  cursor: default;
}

.theme-topbar__user-toggle:focus-visible {
  outline: 0.125rem solid var(--sakai-focus-ring-color);
  outline-offset: 0.2rem;
}

.theme-topbar__user-toggle:hover {
  background: var(--sakai-primary-tint-12, #eee); /* Fallback */
  background: color-mix(
    in srgb,
    var(--sakai-primary) 10%,
    var(--sakai-surface-alt)
  );
  color: var(--sakai-primary-600);
}

.theme-topbar__user-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  inset-inline-end: 0;
  min-width: 12rem;
  padding: 0.35rem 0;
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid var(--sakai-border-color); /* Fallback */
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  background: var(--sakai-surface);
  box-shadow: 0 1.25rem 2.5rem -1.25rem rgba(15, 23, 42, 0.35);
  z-index: 1000;
}

.theme-topbar__user-menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.theme-topbar__user-menu-link,
.theme-topbar__user-menu-action {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.6rem 1rem;
  text-decoration: none;
  color: var(--sakai-text-color);
  background: transparent;
  border: none;
  font: inherit;
  cursor: pointer;
  text-align: start;
  transition:
    background-color var(--sakai-transition-duration)
      var(--sakai-transition-ease),
    color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.theme-topbar__user-menu-link:focus-visible,
.theme-topbar__user-menu-action:focus-visible {
  outline: 0.125rem solid var(--sakai-focus-ring-color);
  outline-offset: -0.1rem;
}

.theme-topbar__user-menu-link:hover,
.theme-topbar__user-menu-link:focus-visible,
.theme-topbar__user-menu-action:hover,
.theme-topbar__user-menu-action:focus-visible {
  background: var(--sakai-primary-tint-08, #f5f5f5); /* Fallback */
  background: color-mix(
    in srgb,
    var(--sakai-primary) 12%,
    var(--sakai-surface)
  );
  color: var(--sakai-primary-600);
}

.theme-topbar__user-menu-enter-active,
.theme-topbar__user-menu-leave-active {
  transition:
    opacity var(--sakai-transition-duration) var(--sakai-transition-ease),
    transform var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.theme-topbar__user-menu-enter-from,
.theme-topbar__user-menu-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

.theme-topbar__avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--sakai-gradient-primary);
  color: var(--sakai-primary-contrast);
  display: grid;
  place-items: center;
  font-weight: var(--sakai-font-weight-semibold);
}

.theme-topbar__user-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.75rem;
}

.theme-topbar__user-name {
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.theme-topbar__user-role {
  color: var(--sakai-text-color-tertiary);
}

.theme-app-shell__footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-6) var(--sakai-space-8);
  flex-wrap: wrap;
  border-top: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
}

@media (max-width: 640px) {
  .theme-app-shell__footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

.theme-app-shell__footer-copy {
  color: var(--sakai-text-color-secondary);
  font-size: 0.85rem;
}

.theme-app-shell__footer-powered {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
  color: var(--sakai-text-color-secondary);
  font-size: 0.85rem;
}

.theme-app-shell__footer-logo {
  width: 1.5rem;
  height: 1.5rem;
}

.theme-topbar__footer-links {
  display: inline-flex;
  gap: var(--sakai-space-4);
}

.theme-app-shell__overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--sakai-text-color) 28%, transparent);
  z-index: 994;
}

@media (prefers-reduced-motion: reduce) {
  .theme-skip-link,
  .theme-app-shell__nav-item,
  .theme-icon-button {
    transition: none !important;
  }

  .theme-app-shell__nav-item:hover {
    transform: none;
  }
}

@media (max-width: 991px) {
  .theme-topbar__search {
    min-width: 0;
    flex: 1 1 auto;
  }

  .theme-topbar__actions {
    flex-wrap: wrap;
  }

  .theme-app-shell__close {
    display: inline-flex;
  }
}

@media (max-width: 768px) {
  .theme-app-shell__topbar {
    flex-wrap: wrap;
    height: auto;
    align-items: stretch;
    row-gap: var(--sakai-space-3);
  }

  .theme-topbar__meta {
    flex-wrap: wrap;
    row-gap: var(--sakai-space-2);
  }

  .theme-app-shell__breadcrumbs {
    flex-wrap: wrap;
    max-width: 100%;
  }

  .theme-topbar__meta,
  .theme-topbar__search,
  .theme-topbar__actions {
    width: 100%;
  }

  .theme-topbar__search {
    margin-inline: 0;
    max-width: none;
  }

  .theme-topbar__actions {
    justify-content: flex-start;
    flex: 1 1 100%;
  }

  .theme-icon-button {
    padding: 0.35rem 0.6rem;
  }

  .theme-icon-button span {
    font-size: 0.75rem;
  }
}
</style>
