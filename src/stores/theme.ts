import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'edtech:theme-preference';

const isBrowser = typeof window !== 'undefined';

const readStoredMode = (): ThemeMode | null => {
  if (!isBrowser) {
    return null;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' || stored === 'light' ? stored : null;
};

const persistStoredMode = (value: ThemeMode | null) => {
  if (!isBrowser) {
    return;
  }
  if (value) {
    window.localStorage.setItem(STORAGE_KEY, value);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
};

const applyThemeToDom = (mode: ThemeMode) => {
  if (!isBrowser) {
    return;
  }
  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  root.classList.toggle('theme-dark', mode === 'dark');
  document.body?.classList.toggle('theme-dark', mode === 'dark');
};

export const useThemeStore = defineStore('theme', () => {
  const systemQuery = isBrowser ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const storedPreference = readStoredMode();
  const hasStoredPreference = ref(Boolean(storedPreference));

  const resolveInitialMode = (): ThemeMode => {
    if (storedPreference) {
      return storedPreference;
    }
    if (systemQuery?.matches) {
      return 'dark';
    }
    return 'light';
  };

  const mode = ref<ThemeMode>(resolveInitialMode());

  const syncWithSystem = (event?: MediaQueryList | MediaQueryListEvent) => {
    if (hasStoredPreference.value) {
      return;
    }
    const prefersDark = event ? event.matches : systemQuery?.matches;
    mode.value = prefersDark ? 'dark' : 'light';
  };

  if (systemQuery) {
    syncWithSystem(systemQuery);
    systemQuery.addEventListener('change', syncWithSystem);
  }

  const stopModeWatch = watch(
    mode,
    (value) => {
      applyThemeToDom(value);
    },
    { immediate: true }
  );

  const isDark = computed(() => mode.value === 'dark');

  const setTheme = (value: ThemeMode) => {
    mode.value = value;
    hasStoredPreference.value = true;
    persistStoredMode(value);
  };

  const useSystemPreference = () => {
    hasStoredPreference.value = false;
    persistStoredMode(null);
    syncWithSystem();
  };

  const toggleTheme = () => {
    const next = isDark.value ? 'light' : 'dark';
    setTheme(next);
  };

  const vuetifyThemeName = computed(() => (isDark.value ? 'mathGuruDark' : 'mathGuru'));

  if (import.meta.hot) {
    import.meta.hot.on('dispose', () => {
      stopModeWatch();
      systemQuery?.removeEventListener('change', syncWithSystem);
    });
  }

  return {
    mode,
    isDark,
    setTheme,
    toggleTheme,
    useSystemPreference,
    hasStoredPreference,
    vuetifyThemeName
  };
});
