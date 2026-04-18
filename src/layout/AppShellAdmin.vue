<template>
  <v-layout class="bg-background rounded rounded-md h-screen overflow-hidden">
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail && !mobile"
      permanent
      @click="rail = false"
      class="border-e app-shell-drawer"
      width="280"
      color="surface"
      elevation="0"
    >
      <div class="flex flex-col h-100">
        <!-- Logo Area -->
        <div class="px-4 py-4 flex items-center gap-3 border-b">
           <v-avatar color="primary" variant="tonal" rounded size="40" class="font-weight-bold text-h6">
              {{ brandInitials }}
           </v-avatar>
           <div v-if="!rail || mobile" class="flex flex-col overflow-hidden transition-swing">
              <span class="text-subtitle-1 font-weight-bold text-truncate">{{ brandName }}</span>
              <span v-if="brandTagline" class="text-caption text-medium-emphasis text-truncate">{{ brandTagline }}</span>
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
             <template v-for="(item, i) in navItems" :key="i">
                <v-list-item
                  v-if="item.to"
                  :to="item.to"
                  :prepend-icon="getIcon(item.icon)"
                  :title="!rail ? item.label : undefined"
                  rounded="lg"
                  class="mb-1"
                  color="primary"
                  :value="item.to"
                >
                   <template v-if="rail" #default></template>
                   <template v-if="item.badge" #append>
                      <v-badge v-if="!rail" :content="item.badge" color="error" inline></v-badge>
                   </template> 
                </v-list-item>
             </template>
        </v-list>

        <!-- User Profile -->
        <div class="px-3 py-2 border-t mt-auto">
            <v-menu v-model="userMenuOpen" :close-on-content-click="false" location="top start" origin="bottom start">
                <template #activator="{ props }">
                    <v-list-item
                        v-bind="props"
                        rounded="lg"
                        nav
                        lines="one"
                        class="px-2"
                    >
                        <template #prepend>
                            <v-avatar color="secondary" variant="tonal" size="36">
                                {{ brandInitials }}
                            </v-avatar>
                        </template>
                        <v-list-item-title class="font-weight-medium">{{ headerUserName }}</v-list-item-title>
                        <v-list-item-subtitle class="text-caption">{{ t('nav.platformAdmin') }}</v-list-item-subtitle>
                        <template #append>
                           <v-icon icon="pi pi-ellipsis-v" size="small" color="medium-emphasis"></v-icon>
                        </template>
                    </v-list-item>
                </template>
                <v-card min-width="200" rounded="lg" elevation="2">
                    <v-list density="compact" nav>
                         <v-list-item prepend-icon="pi pi-sign-out" :title="t('nav.logout')" @click="handleLogout"></v-list-item>
                    </v-list>
                </v-card>
            </v-menu>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar flat border-b color="background" height="64" class="px-4">
        <v-app-bar-nav-icon v-if="mobile" @click="drawer = !drawer"></v-app-bar-nav-icon>
        
        <div class="d-none d-md-flex items-center ml-2">
            <span class="text-h6 font-weight-bold">{{ pageTitle }}</span>
        </div>
        <v-badge content="Admin" color="error" class="ml-4" inline></v-badge>

        <v-spacer></v-spacer>

        <!-- Actions -->
        <div class="flex items-center gap-2">
            <v-btn icon min-width="40" height="40" rounded="lg" variant="text" @click="toggleLanguage">
                <UiIcon name="GlobalOutlined" :size="20" />
            </v-btn>
            <v-btn icon min-width="40" height="40" rounded="lg" variant="text" @click="themeStore.toggleTheme()">
                 <v-icon :icon="themeStore.isDark ? 'pi pi-sun' : 'pi pi-moon'"></v-icon>
            </v-btn>
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
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore } from '@/stores/tenant';
import { useThemeStore } from '@/stores/theme';
import { useFeaturesStore } from '@/stores/features';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify';
import { useRouter, useRoute } from 'vue-router';
import { buildAdminNavItems } from '@/layout/theme/buildAdminNavItems';
import UiIcon from '@/components/ui/UiIcon.vue';
import { FEATURE } from '@/constants/featureCatalog';
import { loadLocaleMessages } from '@/plugins/i18n';
import { iconMap } from '@/constants/iconMap';

const { t, locale } = useI18n();
const auth = useAuthStore();
const tenantStore = useTenantStore();
const themeStore = useThemeStore();
const featuresStore = useFeaturesStore();
const { mobile } = useDisplay();
const router = useRouter();
const route = useRoute();

const drawer = ref(!mobile.value);
const rail = ref(false);
const userMenuOpen = ref(false);

const brandName = computed(() => tenantStore.branding?.name || 'Zidni AI');
const brandTagline = computed(() => tenantStore.branding?.branding?.tagline);
const brandInitials = computed(() => {
  const source = brandName.value;
  const letters = source.split(/\s+/).filter(Boolean).map(w => w[0]?.toUpperCase() || '');
  return letters.slice(0, 2).join('') || 'ZA';
});

const headerUserName = computed(() => 'Administrator');

const navContext = computed(() => ({
  t,
  isPlatformAdmin: true, // Should be checked via auth but if we are here we assume admin or auth.isPlatformAdmin
  platformSyndicationEnabled: featuresStore.hasFeature(FEATURE.platformSyndication),
  analyticsPlatformEnabled: featuresStore.hasFeature(FEATURE.analyticsPlatform),
  adminModerationEnabled: featuresStore.hasFeature(FEATURE.adminModeration),
  adminOpsEnabled: featuresStore.hasFeature(FEATURE.adminOps)
}));

const navItems = computed(() => buildAdminNavItems(navContext.value));

const pageTitle = computed(() => {
   return route.meta.title ? t(route.meta.title as string) : brandName.value;
});

const getIcon = (iconName: string) => {
  if (iconName in iconMap) return iconMap[iconName];
  if (iconName.startsWith('pi ')) return iconName;
  if (iconName.startsWith('pi-')) return `pi ${iconName}`;
  const lower = iconName.toLowerCase();
  const match = Object.keys(iconMap).find((key) => key.toLowerCase() === lower);
  return match ? iconMap[match] : 'pi pi-circle';
};

const handleLogout = async () => {
    await auth.logout();
    router.replace({ name: 'login-teacher' }); // Default login
};

const toggleLanguage = async () => {
  const nextLocale = locale.value === 'ar' ? 'en' : 'ar';
  await loadLocaleMessages(nextLocale);
  locale.value = nextLocale;
};
</script>

<style scoped>
.app-shell-drawer {
    transition: width 0.2s;
}
.border-b {
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.border-t {
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.gap-3 { gap: 12px; }
.gap-2 { gap: 8px; }
</style>
