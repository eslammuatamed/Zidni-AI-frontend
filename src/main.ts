import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import i18n, { loadLocaleMessages, resolveStartingLocale } from './plugins/i18n';
import VueApexCharts from './plugins/apexcharts';
import '@/theme/sakai/index.scss';
import './styles/main.scss';
import '@/assets/css/overlays.css';
import './styles/tailwind-base.css';
import 'primeicons/primeicons.css';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiStatCard from '@/components/ui/UiStatCard.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { useAuthStore } from '@/stores/auth';
import { getTenantFromHost } from '@/utils/tenant';

const bootstrap = async () => {
  const app = createApp(App);

  const pinia = createPinia();
  app.use(pinia);

  const auth = useAuthStore(pinia);
  try {
    await auth.ensureSessionHydrated();
  } catch (error) {
    console.warn('[main] unable to hydrate session', error);
  }

  app.use(router);
  app.use(vuetify);
  app.use(VueApexCharts);

  const startingLocale = resolveStartingLocale();
  await loadLocaleMessages(startingLocale);
  i18n.global.locale.value = startingLocale;

  app.use(i18n);
  app.component('ThemePage', ThemePage);
  app.component('UiButton', UiButton);
  app.component('UiCard', UiCard);
  app.component('UiAlert', UiAlert);
  app.component('UiBadge', UiBadge);
  app.component('UiStatCard', UiStatCard);
  app.component('UiTable', UiTable);
  app.component('UiIcon', UiIcon);

  const redirect = sessionStorage.getItem('postLoginRedirect');
  const host = window.location.host;
  const currentTenant = getTenantFromHost(host);
  const normalizedRedirect = redirect && redirect.startsWith('/') ? redirect : null;
  if (normalizedRedirect && currentTenant && auth.isTeacher && auth.isAuthenticated) {
    sessionStorage.removeItem('postLoginRedirect');
    await router.replace(normalizedRedirect);
  }

  await router.isReady();

  app.mount('#app');
};

void bootstrap();
