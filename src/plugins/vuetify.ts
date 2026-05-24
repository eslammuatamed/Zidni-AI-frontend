import { h } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import '@/styles/theme.css';

const LIGHT_SURFACE = '#ffffff';
const LIGHT_ON_SURFACE = '#1f2937';

const museTheme = {
  dark: false,
  colors: {
    background: '#f4f7ff',
    surface: LIGHT_SURFACE,
    primary: '#1890ff',
    'primary-darken-1': '#096dd9',
    secondary: '#b37feb',
    info: '#13c2c2',
    success: '#52c41a',
    warning: '#fad914',
    danger: '#f5222d',
    'on-background': '#141414',
    'on-surface': LIGHT_ON_SURFACE
  }
};

// Vuetify needs static hex values at boot — these mirror the brand tokens in
// src/theme/sakai/tokens.scss. Keep in sync when the brand changes.
const mathGuruTheme = {
  dark: false,
  colors: {
    primary: '#1b2fac',   // --sakai-primary-500
    secondary: '#162a69', // --sakai-brand-deep (= primary-600)
    surface: LIGHT_SURFACE,
    background: '#ffffff',
    onMedia: '#ffffff',
    'on-surface': LIGHT_ON_SURFACE
  }
};

const mathGuruDarkTheme = {
  dark: true,
  colors: {
    background: '#0f172a',
    surface: '#111c34',
    primary: '#4a5dd6',   // dark --sakai-primary-500 (lifted indigo-400-ish)
    secondary: '#1b2553', // dark --sakai-brand-deep
    info: '#60a5fa',      // dark --sakai-info (lifted blue-400)
    success: '#15ce82',   // dark --sakai-success
    warning: '#f59e0b',   // --sakai-warning (no dark override)
    danger: '#ff4d6f',    // dark --sakai-danger
    'on-background': '#e2e8f0',
    'on-surface': '#e2e8f0'
  }
};

const theme = {
  defaultTheme: 'mathGuru',
  themes: {
    museLight: museTheme,
    mathGuru: mathGuruTheme,
    mathGuruDark: mathGuruDarkTheme
  },
  variations: {
    colors: ['primary', 'secondary', 'info', 'success', 'warning', 'danger'],
    lighten: 2,
    darken: 2
  }
};

const defaults = {
  VAppBar: {
    elevation: 0
  },
  VBtn: {
    variant: 'flat',
    color: 'primary',
    elevation: 0,
    rounded: 'lg',
    minWidth: 148
  },
  VTextField: {
    variant: 'outlined',
    color: 'primary',
    density: 'compact'
  },
  VSelect: {
    variant: 'outlined',
    color: 'primary',
    density: 'compact'
  },
  VTextarea: {
    variant: 'outlined',
    color: 'primary',
    density: 'compact'
  },
  VDataTable: {
    density: 'compact',
    fixedHeader: true
  },
  VNavigationDrawer: {
    elevation: 0
  }
};

const display = {
  mobileBreakpoint: 'sm',
  thresholds: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920
  }
};

const iconAliases = {
  cancel: 'pi pi-ban',
  checkboxIndeterminate: 'pi pi-minus-square',
  checkboxOff: 'pi pi-square',
  checkboxOn: 'pi pi-check-square',
  clear: 'pi pi-times',
  close: 'pi pi-times',
  collapse: 'pi pi-chevron-up',
  complete: 'pi pi-check',
  delete: 'pi pi-trash',
  dropdown: 'pi pi-chevron-down',
  edit: 'pi pi-pencil',
  error: 'pi pi-exclamation-triangle',
  expand: 'pi pi-chevron-down',
  file: 'pi pi-file',
  menu: 'pi pi-bars',
  minus: 'pi pi-minus',
  plus: 'pi pi-plus',
  sort: 'pi pi-sort-alt',
  success: 'pi pi-check-circle',
  warning: 'pi pi-exclamation-triangle'
} as const;

type PrimeIconProps = {
  tag?: string;
  icon?: string;
  class?: string;
  style?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
};

const primeIconSet = {
  component: (props: PrimeIconProps) =>
    h(props.tag ?? 'i', {
      class: [
        'v-icon',
        props.class,
        props.icon
      ].filter(Boolean),
      style: props.style,
      ...(props.attrs ?? {})
    })
};

export default createVuetify({
  theme,
  defaults,
  display,
  icons: {
    defaultSet: 'prime',
    aliases: iconAliases,
    sets: {
      prime: primeIconSet
    }
  }
});
