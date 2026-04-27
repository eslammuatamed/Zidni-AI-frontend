<template>
  <v-layout class="rounded rounded-md h-screen">
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
      elevation="0"
      border="e"
      width="280"
    >
      <div class="flex items-center justify-center pa-4">
         <div class="text-h6 font-weight-bold text-sakai-secondary">ASSISTANT</div>
      </div>

      <v-list density="compact" nav class="px-2">
        <v-list-subheader class="text-uppercase text-caption font-weight-bold text-medium-emphasis mb-2" v-if="!rail">
          {{ t('nav.mainNavigation') }}
        </v-list-subheader>

        <template v-for="(item, i) in navItems" :key="i">
           <v-list-item
              v-if="item.to"
              :to="item.to"
              :prepend-icon="getIcon(item.icon)"
              :title="item.label"
              rounded="lg"
              active-class="bg-secondary text-white"
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
           <v-list-item
              v-else-if="item.action"
              :prepend-icon="getIcon(item.icon)"
              :title="item.label"
              rounded="lg"
              class="mb-1"
              @click="handleNavAction(item.action)"
           />
        </template>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
           <v-btn block variant="tonal" color="secondary" v-if="!rail" @click="toggleRail">
             <v-icon start icon="pi pi-angle-double-left"></v-icon>
             Collapse
           </v-btn>
           <v-btn icon variant="text" v-else @click="toggleRail">
             <v-icon icon="pi pi-angle-double-right"></v-icon>
           </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar flat border="b" color="background" class="px-4">
       <!-- Mobile Toggle -->
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer" class="d-md-none"></v-app-bar-nav-icon>

      <v-spacer></v-spacer>

      <!-- Search -->
      <v-text-field
        prepend-inner-icon="pi pi-search"
        placeholder="Search..."
        variant="outlined"
        density="compact"
        hide-details
        class="mr-4 mw-300 hidden-sm-and-down"
        bg-color="surface"
        rounded="lg"
      ></v-text-field>

      <!-- Language -->
      <v-btn icon variant="text" @click="toggleLanguage">
        <v-icon icon="pi pi-globe"></v-icon>
      </v-btn>

       <!-- Theme Toggle -->
      <v-btn icon variant="text" @click="themeStore.toggleTheme">
         <v-icon :icon="themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon'"></v-icon>
      </v-btn>

      <!-- Notifications -->
      <v-btn icon variant="text" class="mr-2" to="/assistant/notifications">
        <v-badge v-if="notificationsBadgeLabel" color="error" :content="notificationsBadgeLabel" dot>
          <v-icon icon="pi pi-bell"></v-icon>
        </v-badge>
        <v-icon v-else icon="pi pi-bell"></v-icon>
      </v-btn>

       <!-- User Menu -->
      <v-menu min-width="200px" rounded offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-avatar color="secondary" size="38">
              <span class="text-h6 text-white">{{ userInitials }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-card width="250">
          <v-list-item
            class="pt-4 pb-2"
          >
             <template v-slot:prepend>
               <v-avatar color="secondary" size="40">
                  <span class="text-white text-h6">{{ userInitials }}</span>
               </v-avatar>
             </template>
             <v-list-item-title class="font-weight-bold">{{ auth.user?.name }} (Assistant)</v-list-item-title>
             <v-list-item-subtitle>{{ auth.user?.email }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider></v-divider>
          <v-list density="compact" nav>
            <v-list-item prepend-icon="pi pi-sign-out" :title="t('nav.logout')" value="logout" @click="auth.logout()" color="error"></v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container fluid class="pa-6 h-100">
         <slot />
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useI18n } from 'vue-i18n';
import { buildAssistantNavItems } from './theme/buildAssistantNavItems';
import { useFeaturesStore } from '@/stores/features';
import { useNotificationStore } from '@/stores/notifications';
import { FEATURE } from '@/constants/featureCatalog';
import { iconMap } from '@/constants/iconMap';
import { useTenantStore } from '@/stores/tenant';
import { loadLocaleMessages, LOCALE_STORAGE_KEY } from '@/plugins/i18n';

const auth = useAuthStore();
const router = useRouter();
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
}

const resolveDefaultLocale = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('ar')) return 'ar';
  if (normalized.startsWith('en')) return 'en';
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
  const nextLocale = locale.value === 'ar' ? 'en' : 'ar';
  await loadLocaleMessages(nextLocale);
  locale.value = nextLocale;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  }
  hasStoredLocale.value = true;
};

const userInitials = computed(() => {
  const name = auth.user?.name || '';
  return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
});

const notificationsBadgeLabel = computed(() => {
   return notificationStore.unreadCount > 0 ? String(notificationStore.unreadCount) : null;
});

// Construct Context for Nav Items
const navContext = computed(() => ({
  t,
  isAssistant: true, 
  assistantPermissions: auth.assistantPermissions ? new Set(auth.assistantPermissions) : new Set(),
  featuresUnauthorized: false, // Or logic to determine this
  teacherRosterEnabled: featuresStore.hasFeature(FEATURE.teacherRosterGroups),
  teacherRegsPaymentsEnabled: featuresStore.hasFeature(FEATURE.teacherRegsPayments),
  teacherReportsEnabled: featuresStore.hasFeature(FEATURE.reportsTeacher),
  notificationsUnifiedEnabled: featuresStore.hasFeature(FEATURE.notificationsUnified),
  notificationsBadgeLabel: notificationsBadgeLabel.value
}));

const navItems = computed(() => {
  return buildAssistantNavItems(navContext.value);
});

const handleNavAction = async (action: 'logout') => {
  if (action !== 'logout') return;
  await auth.logout();
  try {
    await router.replace({ name: 'assistant-login' });
  } catch (error) {}
};

// Icon mapping helper
const getIcon = (iconName: string) => {
  if (iconName in iconMap) return iconMap[iconName];
  if (iconName.startsWith('pi ')) return iconName;
  if (iconName.startsWith('pi-')) return `pi ${iconName}`;
  const lower = iconName.toLowerCase();
  const match = Object.keys(iconMap).find((key) => key.toLowerCase() === lower);
  return match ? iconMap[match] : 'pi pi-circle';
};

if (typeof window !== 'undefined') {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  hasStoredLocale.value = stored === 'ar' || stored === 'en';
}

watch(
  () => tenantStore.branding?.branding?.defaultLocale as string | undefined,
  (value) => {
    void applyDefaultLocale(value ?? null);
  },
  { immediate: true }
);

</script>

<style scoped>
.mw-300 {
  max-width: 300px;
}
</style>
