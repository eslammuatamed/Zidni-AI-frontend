<template>
  <v-layout class="bg-background rounded-md h-screen overflow-hidden">
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail && !mobile"
      permanent
      @click="rail = false"
      class="app-shell-drawer app-drawer-dark"
      width="280"
      elevation="0"
    >
      <div class="flex flex-col h-100">
        <!-- Logo Area -->
        <div class="px-4 py-4 flex items-center gap-3 drawer-divider-b">
          <v-avatar
            rounded
            size="40"
            class="font-weight-bold text-subtitle-2 brand-logo-mark"
          >
            {{ brandInitials }}
          </v-avatar>
          <div
            v-if="!rail || mobile"
            class="flex flex-col overflow-hidden transition-swing"
          >
            <span class="text-subtitle-1 font-weight-bold text-truncate">{{
              brandName
            }}</span>
            <span
              v-if="brandTagline"
              class="text-caption text-medium-emphasis text-truncate"
              >{{ brandTagline }}</span
            >
          </div>
          <v-spacer v-if="!rail && !mobile"></v-spacer>
          <v-btn
            v-if="!mobile && !rail"
            icon="pi pi-chevron-left"
            variant="text"
            density="comfortable"
            size="small"
            @click.stop="rail = true"
          ></v-btn>
        </div>

        <!-- Navigation Items -->
        <v-list class="flex-grow-1 px-3 py-4" nav density="comfortable">
          <v-list-subheader
            v-if="!rail || mobile"
            class="text-uppercase text-caption font-weight-bold drawer-text-muted mb-1 px-2"
            >{{ t("nav.mainNavigation") }}</v-list-subheader
          >
          <template v-for="(item, i) in navItems" :key="i">
            <v-list-item
              v-if="item.to"
              :to="item.to"
              :prepend-icon="getIcon(item.icon)"
              :title="!rail ? item.label : undefined"
              rounded="lg"
              class="mb-1"
              active-class="nav-item-active"
              :value="item.to"
            >
              <template v-if="rail" #default></template>
              <!-- Hide text in rail mode explicitly if needed, but rail prop handles it -->
              <template v-if="item.badge" #append>
                <v-badge
                  v-if="!rail"
                  :content="item.badge"
                  color="error"
                  inline
                ></v-badge>
              </template>
            </v-list-item>
            <v-list-item
              v-else-if="item.href"
              :href="item.href"
              :target="item.external ? '_blank' : undefined"
              :prepend-icon="getIcon(item.icon)"
              :title="!rail ? item.label : undefined"
              rounded="lg"
              class="mb-1"
            ></v-list-item>
          </template>
        </v-list>

        <!-- User Profile -->
        <div class="px-3 py-2 drawer-divider-t mt-auto">
          <v-menu
            v-model="userMenuOpen"
            :close-on-content-click="false"
            location="top start"
            origin="bottom start"
          >
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                rounded="lg"
                nav
                lines="one"
                class="px-2"
              >
                <template #prepend>
                  <v-avatar size="36" class="user-avatar-mini">
                    {{ brandInitials }}
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium text-white">{{
                  headerUserName
                }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption drawer-text-muted">{{
                  t("nav.student")
                }}</v-list-item-subtitle>
                <template #append>
                  <v-icon
                    icon="pi pi-ellipsis-v"
                    size="small"
                    class="drawer-text-muted"
                  ></v-icon>
                </template>
              </v-list-item>
            </template>
            <v-card min-width="200" rounded="lg" elevation="2">
              <v-list density="compact" nav>
                <v-list-item
                  prepend-icon="pi pi-sign-out"
                  :title="t('nav.logout')"
                  @click="handleLogout"
                ></v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- App Bar — Modernize layout: identity LEFT · search RIGHT -->
    <v-app-bar flat height="64" class="app-bar-styled">
      <!-- Mobile nav toggle -->
      <v-app-bar-nav-icon
        v-if="mobile"
        @click="drawer = !drawer"
        class="ms-1 flex-shrink-0"
      ></v-app-bar-nav-icon>

      <!-- User identity chip -->
      <div class="header-identity ms-3">
        <v-avatar size="36" class="user-avatar-mini flex-shrink-0">{{
          brandInitials
        }}</v-avatar>
        <div class="d-none d-md-flex flex-col ms-2">
          <span class="header-user-name">{{ headerUserName }}</span>
          <span class="header-user-role">{{ t("nav.student") }}</span>
        </div>
      </div>

      <!-- Utility icons -->
      <div class="flex items-center ms-2">
        <StudentTenantSwitcher v-if="showStudentTenantSwitcher" />
        <v-btn
          v-if="notificationsUnifiedEnabled"
          icon
          size="small"
          variant="text"
          rounded="lg"
          to="/student/notifications"
        >
          <v-badge
            v-if="showNotificationsBadge"
            :content="notificationsBadgeLabel"
            color="error"
            dot
          >
            <v-icon icon="pi pi-bell" size="18"></v-icon>
          </v-badge>
          <v-icon v-else icon="pi pi-bell" size="18"></v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          variant="text"
          rounded="lg"
          @click="themeStore.toggleTheme()"
        >
          <v-icon
            :icon="themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon'"
            size="18"
          ></v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          variant="text"
          rounded="lg"
          @click="toggleLanguage"
        >
          <UiIcon name="GlobalOutlined" :size="18" />
        </v-btn>
      </div>

      <v-spacer></v-spacer>

      <!-- Search — right side -->
      <div class="d-none d-sm-flex items-center me-4" style="width: 240px">
        <v-text-field
          v-model="searchQuery"
          :placeholder="t('nav.searchPlaceholder')"
          prepend-inner-icon="pi pi-search"
          variant="outlined"
          density="compact"
          hide-details
          rounded="lg"
          bg-color="surface"
          class="w-100"
        ></v-text-field>
      </div>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container fluid class="pa-6 h-100">
        <slot />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useTenantStore } from "@/stores/tenant";
import { useThemeStore } from "@/stores/theme";
import { useFeaturesStore } from "@/stores/features";
import { useStudentStore } from "@/stores/student";
import { useNotificationStore } from "@/stores/notifications";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import { useRouter, useRoute } from "vue-router";
import { buildStudentNavItems } from "@/layout/theme/buildStudentNavItems";
import StudentTenantSwitcher from "@/components/student/StudentTenantSwitcher.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import { FEATURE } from "@/constants/featureCatalog";
import { loadLocaleMessages, LOCALE_STORAGE_KEY } from "@/plugins/i18n";
import { iconMap } from "@/constants/iconMap";

const { t, locale } = useI18n();
const auth = useAuthStore();
const tenantStore = useTenantStore();
const themeStore = useThemeStore();
const featuresStore = useFeaturesStore();
const studentStore = useStudentStore();
const notifications = useNotificationStore();
const { mobile } = useDisplay();
const router = useRouter();
const route = useRoute();

const drawer = ref(!mobile.value);
const rail = ref(false);
const searchQuery = ref("");
const userMenuOpen = ref(false);
const hasStoredLocale = ref(false);

const brandName = computed(() => tenantStore.branding?.name || "Zidni AI");
const brandTagline = computed(() => tenantStore.branding?.branding?.tagline);
const brandInitials = computed(() => {
  const source = brandName.value;
  const letters = source
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() || "");
  return letters.slice(0, 2).join("") || "ZA";
});

const headerUserName = computed(
  () => studentStore.profile?.name?.trim() || brandName.value,
);

const notificationsUnifiedEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.notificationsUnified),
);
const notificationsCount = computed(() => notifications.unreadCount);
const showNotificationsBadge = computed(() => notificationsCount.value > 0);
const notificationsBadgeLabel = computed(() =>
  notificationsCount.value > 99 ? "99+" : String(notificationsCount.value),
);

const multiTeacherStudentEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.multiTeacherStudent),
);
const showStudentTenantSwitcher = computed(
  () => multiTeacherStudentEnabled.value && auth.isStudent,
);

const navContext = computed(() => ({
  t,
  isStudent: auth.isStudent,
  isTeacher: auth.isTeacher,
  studentReportsEnabled: featuresStore.hasFeature(FEATURE.reportsStudent),
  badgesEnabled: featuresStore.hasFeature(FEATURE.badges),
  notificationsUnifiedEnabled: notificationsUnifiedEnabled.value,
  notificationsBadgeLabel: notificationsBadgeLabel.value,
  englishLabEnabled: featuresStore.hasFeature(FEATURE.englishLab),
  offersEnabled: featuresStore.hasFeature(FEATURE.offers),
}));

const navItems = computed(() => buildStudentNavItems(navContext.value));

const pageTitle = computed(() => {
  // Simplified title logic or use route meta
  return route.meta.title ? t(route.meta.title as string) : brandName.value;
});

const getIcon = (iconName: string) => {
  if (iconName in iconMap) return iconMap[iconName];
  if (iconName.startsWith("pi ")) return iconName;
  if (iconName.startsWith("pi-")) return `pi ${iconName}`;
  const lower = iconName.toLowerCase();
  const match = Object.keys(iconMap).find((key) => key.toLowerCase() === lower);
  return match ? iconMap[match] : "pi pi-circle";
};

const handleLogout = async () => {
  await auth.logout();
  router.replace({ name: "login-student" }); // Or login-teacher, generic login
};

const resolveDefaultLocale = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith("ar")) return "ar";
  if (normalized.startsWith("en")) return "en";
  return null;
};

const applyDefaultLocale = async (value?: string | null) => {
  if (hasStoredLocale.value) return;
  const resolved = resolveDefaultLocale(value);
  if (!resolved || locale.value === resolved) return;
  await loadLocaleMessages(resolved);
  locale.value = resolved;
};

const toggleLanguage = async () => {
  const nextLocale = locale.value === "ar" ? "en" : "ar";
  await loadLocaleMessages(nextLocale);
  locale.value = nextLocale;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  }
  hasStoredLocale.value = true;
};

onMounted(() => {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    hasStoredLocale.value = stored === "ar" || stored === "en";
  }
  if (auth.isStudent && !studentStore.profile) {
    studentStore
      .fetchProfile()
      .catch((err) => console.warn("Failed to load student profile", err));
  }
});

watch(
  () => tenantStore.branding?.branding?.defaultLocale as string | undefined,
  (value) => {
    void applyDefaultLocale(value ?? null);
  },
  { immediate: true },
);
</script>

<style scoped>
/* ─── Drawer Shell ─────────────────────────────────────── */
.app-shell-drawer {
  transition: width 0.2s ease;
}

.app-drawer-dark {
  background-color: #1e3a8a !important;
}

/* ─── Logo Mark ────────────────────────────────────────── */
.brand-logo-mark {
  width: 40px;
  height: 40px;
  min-width: 40px;
  background: linear-gradient(135deg, #06b6d4 0%, #1e3a8a 100%);
  border-radius: 10px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ─── Drawer Dividers ──────────────────────────────────── */
.drawer-divider-b {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.drawer-divider-t {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* ─── Drawer Text ──────────────────────────────────────── */
.drawer-text-muted {
  color: rgba(255, 255, 255, 0.45) !important;
}

/* ─── Nav Items ────────────────────────────────────────── */
.app-drawer-dark :deep(.v-list-item) {
  color: rgba(255, 255, 255, 0.8) !important;
}

.app-drawer-dark :deep(.v-list-item .v-icon) {
  color: rgba(255, 255, 255, 0.6) !important;
  opacity: 1 !important;
}

.app-drawer-dark :deep(.v-list-item-title) {
  color: rgba(255, 255, 255, 0.85);
}

.app-drawer-dark :deep(.v-list-item:not(.v-list-item--active):hover) {
  background-color: rgba(255, 255, 255, 0.07) !important;
}

/* Active state — cyan pill */
.app-drawer-dark :deep(.v-list-item--active),
.app-drawer-dark :deep(.nav-item-active) {
  background-color: #06b6d4 !important;
  color: white !important;
}

.app-drawer-dark :deep(.v-list-item--active .v-icon),
.app-drawer-dark :deep(.nav-item-active .v-icon) {
  color: white !important;
  opacity: 1 !important;
}

.app-drawer-dark :deep(.v-list-item--active .v-list-item-title),
.app-drawer-dark :deep(.nav-item-active .v-list-item-title) {
  color: white !important;
  font-weight: 600;
}

/* ─── User Avatar ──────────────────────────────────────── */
.user-avatar-mini {
  background: linear-gradient(135deg, #06b6d4 0%, #1e3a8a 100%) !important;
  color: white !important;
  font-weight: 700;
  font-size: 13px;
}

/* ─── App Bar ──────────────────────────────────────────── */
.app-bar-styled {
  background-color: rgb(var(--v-theme-background)) !important;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05) !important;
}

/* ─── Nav Item Sizing ──────────────────────────────────── */
.app-drawer-dark :deep(.v-list-item) {
  min-height: 44px !important;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}

.app-drawer-dark :deep(.v-list-item .v-list-item__prepend .v-icon) {
  font-size: 20px !important;
  width: 20px !important;
}

.app-drawer-dark :deep(.v-list-item-title) {
  font-size: 13.5px !important;
  font-weight: 500;
  letter-spacing: 0.01em;
}

/* ─── Header Identity Chip ─────────────────────────────── */
.header-identity {
  display: flex;
  align-items: center;
  padding: 5px 10px 5px 5px;
  border-radius: 40px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface), 1);
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.header-identity:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.header-user-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
  color: rgb(var(--v-theme-on-surface));
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-user-role {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(var(--v-theme-on-surface), 0.5);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Utilities ────────────────────────────────────────── */
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
</style>
