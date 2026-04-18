<template>
  <v-layout class="rounded-md h-screen overflow-hidden">
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
      elevation="0"
      class="app-drawer-dark"
      width="280"
    >
      <div class="flex items-center pa-4 gap-3 drawer-divider-b">
        <div
          class="brand-logo-mark flex items-center justify-center rounded-lg flex-shrink-0"
        >
          <v-icon icon="pi pi-graduation-cap" color="white" size="18"></v-icon>
        </div>
        <div
          v-if="!rail"
          class="text-subtitle-1 font-weight-bold text-white text-truncate"
        >
          Zidni AI
        </div>
      </div>

      <v-list density="compact" nav class="px-2">
        <v-list-subheader
          class="text-uppercase text-caption font-weight-bold drawer-text-muted mb-2"
          v-if="!rail"
        >
          {{ t("nav.mainNavigation") }}
        </v-list-subheader>

        <template v-for="(item, i) in navItems" :key="i">
          <v-list-item
            v-if="item.to"
            :to="item.to"
            :prepend-icon="getIcon(item.icon)"
            :title="item.label"
            rounded="lg"
            active-class="nav-item-active"
            class="mb-1"
          >
            <template v-if="item.badge" v-slot:append>
              <v-badge color="error" :content="item.badge" inline></v-badge>
            </template>
          </v-list-item>
          <v-list-item
            v-else-if="item.href"
            :href="item.href"
            :prepend-icon="getIcon(item.icon)"
            :title="item.label"
            :target="item.external ? '_blank' : undefined"
            rounded="lg"
            class="mb-1"
          >
            <template v-if="item.external" v-slot:append>
              <v-icon size="small" icon="pi pi-external-link"></v-icon>
            </template>
          </v-list-item>
        </template>
      </v-list>

      <template v-slot:append>
        <div class="pa-3 drawer-divider-t">
          <v-btn
            block
            variant="text"
            class="drawer-collapse-btn"
            v-if="!rail"
            @click="toggleRail"
          >
            <v-icon start icon="pi pi-angle-double-left"></v-icon>
            Collapse
          </v-btn>
          <v-btn
            icon
            variant="text"
            class="drawer-collapse-btn"
            v-else
            @click="toggleRail"
          >
            <v-icon icon="pi pi-angle-double-right"></v-icon>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar — Modernize layout: identity LEFT · search RIGHT -->
    <v-app-bar flat height="64" class="app-bar-styled">
      <!-- Mobile nav toggle -->
      <v-app-bar-nav-icon
        variant="text"
        @click.stop="drawer = !drawer"
        class="d-md-none ms-1 flex-shrink-0"
      ></v-app-bar-nav-icon>

      <!-- User identity chip with dropdown -->
      <v-menu min-width="220px" location="bottom start">
        <template v-slot:activator="{ props }">
          <div
            class="header-identity ms-3"
            v-bind="props"
            style="cursor: pointer"
          >
            <v-avatar class="user-avatar-mini flex-shrink-0" size="36">
              <span class="text-subtitle-2 font-weight-bold">{{
                userInitials
              }}</span>
            </v-avatar>
            <div class="d-none d-md-flex flex-col ms-2">
              <span class="header-user-name">{{ auth.user?.name }}</span>
              <span class="header-user-role">{{ auth.user?.email }}</span>
            </div>
            <v-icon
              icon="pi pi-chevron-down"
              size="12"
              class="d-none d-md-flex ms-2 header-user-role"
            ></v-icon>
          </div>
        </template>
        <v-card rounded="lg" elevation="2">
          <v-list density="compact" nav>
            <v-list-item
              prepend-icon="pi pi-wallet"
              :title="t('nav.teacherPaymentSettings')"
              to="/teacher/payments/manual-settings"
            ></v-list-item>
            <v-list-item
              prepend-icon="pi pi-cog"
              :title="t('nav.settings')"
              to="/teacher/settings"
            ></v-list-item>
            <v-divider class="my-1"></v-divider>
            <v-list-item
              prepend-icon="pi pi-sign-out"
              :title="t('nav.logout')"
              @click="auth.logout()"
              color="error"
            ></v-list-item>
          </v-list>
        </v-card>
      </v-menu>

      <!-- Utility icons -->
      <div class="flex items-center ms-2">
        <v-btn
          icon
          size="small"
          variant="text"
          rounded="lg"
          to="/teacher/notifications"
        >
          <v-badge
            v-if="notificationsBadgeLabel"
            color="error"
            :content="notificationsBadgeLabel"
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
          @click="themeStore.toggleTheme"
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
          <v-icon icon="pi pi-globe" size="18"></v-icon>
        </v-btn>
      </div>

      <v-spacer></v-spacer>

      <!-- Search — right side -->
      <div class="d-none d-sm-flex items-center me-4" style="width: 240px">
        <v-text-field
          prepend-inner-icon="pi pi-search"
          :placeholder="t('nav.searchPlaceholder') || 'Search...'"
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
import { ref, computed, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { useI18n } from "vue-i18n";
import { buildTeacherNavItems } from "./theme/buildTeacherNavItems"; // Reusing existing logic
import { useFeaturesStore } from "@/stores/features";
import { useNotificationStore } from "@/stores/notifications";
import { useTenantStore } from "@/stores/tenant";
import { loadLocaleMessages, LOCALE_STORAGE_KEY } from "@/plugins/i18n";

const auth = useAuthStore();
const themeStore = useThemeStore();
const featuresStore = useFeaturesStore();
const notificationStore = useNotificationStore();
const { t, locale } = useI18n();
const tenantStore = useTenantStore();

const hasStoredLocale = ref(false);

const drawer = ref(true);
const rail = ref(false);

const toggleRail = () => {
  rail.value = !rail.value;
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

const userInitials = computed(() => {
  const name = auth.user?.name || "";
  return name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
});

const notificationsBadgeLabel = computed(() => {
  // Assuming logic for badge label exists in store or just count
  return notificationStore.unreadCount > 0
    ? String(notificationStore.unreadCount)
    : null;
});

import { FEATURE } from "@/constants/featureCatalog";

// ...

// Construct Context for Nav Items
const navContext = computed(() => ({
  t,
  isTeacher: auth.isTeacher,
  isAssistant: auth.isAssistant,
  assistantPermissions: auth.assistantPermissions
    ? new Set(auth.assistantPermissions)
    : null,
  featuresUnauthorized: false, // Default logic
  teacherLandingUrl: "#", // Placeholder or real URL
  teacherRosterEnabled: featuresStore.hasFeature(FEATURE.teacherRosterGroups),
  liveSessionsCoreEnabled: featuresStore.hasFeature(FEATURE.liveSessionsCore),
  liveSessionsChatEnabled: featuresStore.hasFeature(FEATURE.liveSessionsChat),
  liveSessionsPollsEnabled: featuresStore.hasFeature(FEATURE.liveSessionsPolls),
  teacherAssistantsEnabled: featuresStore.hasFeature(FEATURE.teacherAssistants),
  teacherRegsPaymentsEnabled: featuresStore.hasFeature(
    FEATURE.teacherRegsPayments,
  ),
  teacherPaymentSettingsAvailable: true,
  teacherReportsEnabled: featuresStore.hasFeature(FEATURE.reportsTeacher),
  offersEnabled: featuresStore.hasFeature(FEATURE.offers),
  adminOpsEnabled: featuresStore.hasFeature(FEATURE.adminOps),
  englishLabEnabled: false, // Check feature flag if needed
  badgesEnabled: featuresStore.hasFeature(FEATURE.badges),
  notificationsUnifiedEnabled: featuresStore.hasFeature(
    FEATURE.notificationsUnified,
  ),
  examWorkflowsEnabled: false,
  notificationsBadgeLabel: notificationsBadgeLabel.value,
}));

const navItems = computed(() => {
  // We need to cast the context to any because some properties might be missing or different in types
  return buildTeacherNavItems(navContext.value as any);
});

import { iconMap } from "@/constants/iconMap";

// ...

// Icon mapping helper
const getIcon = (iconName: string) => {
  if (iconName in iconMap) return iconMap[iconName];
  if (iconName.startsWith("pi ")) return iconName;
  if (iconName.startsWith("pi-")) return `pi ${iconName}`;
  const lower = iconName.toLowerCase();
  const match = Object.keys(iconMap).find((key) => key.toLowerCase() === lower);
  return match ? iconMap[match] : "pi pi-circle";
};

if (typeof window !== "undefined") {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  hasStoredLocale.value = stored === "ar" || stored === "en";
}

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

.app-drawer-dark :deep(.v-list-subheader) {
  color: rgba(255, 255, 255, 0.4) !important;
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

/* ─── Collapse Button ──────────────────────────────────── */
.drawer-collapse-btn {
  color: rgba(255, 255, 255, 0.55) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 8px !important;
}

.drawer-collapse-btn:hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
  color: white !important;
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

/* ─── App Bar ──────────────────────────────────────────── */
.app-bar-styled {
  background-color: rgb(var(--v-theme-background)) !important;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06) !important;
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
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Utilities ────────────────────────────────────────── */
.gap-3 {
  gap: 12px;
}
</style>
