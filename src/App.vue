<!--
  App.vue renders the root application shell and swaps between the themed
  layout wrapper and a plain container depending on the active route metadata.
  Props: none. Relies on router meta fields (disableShell) to decide layout.
-->
<template>
  <component :is="layout">
    <router-view v-if="bootstrapped" />
    <div v-else class="app-splash">
      <span class="app-splash__spinner" aria-hidden="true"></span>
    </div>
  </component>
  <UiToastHost />
  <DevTenantBanner v-if="showDevBanner" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import LandingLayout from '@/layout/LandingLayout.vue';
import TeacherLandingLayout from '@/layout/TeacherLandingLayout.vue';
import ThemeAppShell from '@/layout/theme/ThemeAppShell.vue';
import UiToastHost from '@/components/ui/UiToastHost.vue';
import { useAuthStore } from '@/stores/auth';
import DevTenantBanner from '@/components/dev/DevTenantBanner.vue';

const route = useRoute();
const auth = useAuthStore();
const showDevBanner = import.meta.env.DEV === true;
const bootstrapped = computed(() => auth.initialized);

/**
 * Determines which layout component should be rendered for the current route.
 * Routes can opt out of the theme shell by setting `meta.disableShell` to true,
 * and marketing routes can request the `landing` layout via route metadata.
 *
 * @returns Either the themed shell, the Nabta landing layout, or a bare `div` wrapper.
 */
const defaultLayout = computed(() => {
  if (route.meta.disableShell) {
    return 'div';
  }

  if (!auth.isAuthenticated) {
    return 'div';
  }

  return ThemeAppShell;
});

const layout = computed(() => {
  if (route.meta.layout === 'landing') {
    return LandingLayout;
  }

  if (route.meta.layout === 'teacherLanding') {
    return TeacherLandingLayout;
  }

  return defaultLayout.value;
});

</script>
<style lang="scss">
.app-splash {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
}

.app-splash__spinner {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 0.25rem solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  border-top-color: var(--sakai-primary);
  animation: app-splash-spin 1s linear infinite;
}

@keyframes app-splash-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
