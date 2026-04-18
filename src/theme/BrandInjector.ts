import api from '@/services/api';

export interface BrandingTheme {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  radius: string;
  shadow: string;
}

export interface BrandingTypography {
  fontFamily: string;
}

export interface BrandingAssets {
  logoUrl?: string | null;
  heroUrl?: string | null;
  faviconUrl?: string | null;
}

export interface BrandingSeo {
  title?: string | null;
  tagline?: string | null;
}

export interface BrandingConfig {
  theme: BrandingTheme;
  typography: BrandingTypography;
  assets: BrandingAssets;
  seo: BrandingSeo;
  rtlPreferred?: boolean;
}

const DEFAULT_BRANDING: BrandingConfig = {
  theme: {
    primary: '#2c7be5',
    secondary: '#6c757d',
    accent: '#00c2a8',
    bg: '#ffffff',
    text: '#111111',
    radius: '12px',
    shadow: '0 10px 20px rgba(0, 0, 0, 0.07)'
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  assets: {
    logoUrl: null,
    heroUrl: null,
    faviconUrl: null
  },
  seo: {
    title: null,
    tagline: null
  },
  rtlPreferred: false
};

const CSS_VAR_MAP: Record<string, (branding: BrandingConfig) => string> = {
  '--color-primary': (branding) => branding.theme.primary,
  '--color-secondary': (branding) => branding.theme.secondary,
  '--color-accent': (branding) => branding.theme.accent,
  '--color-bg': (branding) => branding.theme.bg,
  '--color-text': (branding) => branding.theme.text,
  '--radius-base': (branding) => branding.theme.radius,
  '--shadow-md': (branding) => branding.theme.shadow
};

const FONT_VAR = '--font-family-base';

const hexToRgbChannels = (hex: string): string => {
  const match = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return '0 0 0';
  return `${parseInt(match[1], 16)} ${parseInt(match[2], 16)} ${parseInt(match[3], 16)}`;
};

const normalizeHex = (value?: string | null, fallback?: string) => {
  if (typeof value !== 'string') return fallback ?? '';
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback ?? '';
};

const mergeBranding = (payload?: Partial<BrandingConfig> | null): BrandingConfig => {
  if (!payload) {
    return { ...DEFAULT_BRANDING };
  }
  const theme = payload.theme ?? {};
  const typography = payload.typography ?? {};
  const assets = payload.assets ?? {};
  const seo = payload.seo ?? {};
  return {
    theme: {
      primary: normalizeHex(theme.primary, DEFAULT_BRANDING.theme.primary),
      secondary: normalizeHex(theme.secondary, DEFAULT_BRANDING.theme.secondary),
      accent: normalizeHex(theme.accent, DEFAULT_BRANDING.theme.accent),
      bg: normalizeHex(theme.bg, DEFAULT_BRANDING.theme.bg),
      text: normalizeHex(theme.text, DEFAULT_BRANDING.theme.text),
      radius: theme.radius?.trim() || DEFAULT_BRANDING.theme.radius,
      shadow: theme.shadow?.trim() || DEFAULT_BRANDING.theme.shadow
    },
    typography: {
      fontFamily: typography.fontFamily?.trim() || DEFAULT_BRANDING.typography.fontFamily
    },
    assets: {
      logoUrl: assets.logoUrl ?? null,
      heroUrl: assets.heroUrl ?? null,
      faviconUrl: assets.faviconUrl ?? null
    },
    seo: {
      title: seo.title ?? DEFAULT_BRANDING.seo.title,
      tagline: seo.tagline ?? DEFAULT_BRANDING.seo.tagline
    },
    rtlPreferred: Boolean(payload.rtlPreferred)
  };
};

export async function fetchBranding(): Promise<BrandingConfig> {
  try {
    const { data } = await api.get<BrandingConfig>('/branding/current');
    return mergeBranding(data);
  } catch (error) {
    console.warn('[BrandInjector] Failed to load branding', error);
    return { ...DEFAULT_BRANDING };
  }
}

export function applyCssVars(branding: BrandingConfig): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  Object.entries(CSS_VAR_MAP).forEach(([key, resolve]) => {
    root.style.setProperty(key, resolve(branding));
  });
  const legacyMap: Record<string, string> = {
    '--sakai-primary': branding.theme.primary,
    '--sakai-primary-rgb': hexToRgbChannels(branding.theme.primary),
    '--sakai-secondary': branding.theme.secondary,
    '--sakai-secondary-rgb': hexToRgbChannels(branding.theme.secondary),
    '--sakai-text-color': branding.theme.text,
    '--sakai-text-color-rgb': hexToRgbChannels(branding.theme.text),
    '--sakai-border-radius-md': branding.theme.radius,
    '--sakai-border-radius-pill': branding.theme.radius,
    '--sakai-shadow-md': branding.theme.shadow,
    '--sakai-surface': branding.theme.bg,
    '--sakai-surface-rgb': hexToRgbChannels(branding.theme.bg),
    '--sakai-surface-alt': branding.theme.bg,
    '--sakai-border-color': branding.theme.secondary
  };
  Object.entries(legacyMap).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  if (branding.typography.fontFamily) {
    root.style.setProperty(FONT_VAR, branding.typography.fontFamily);
  }
}

export function applyAssets(assets: BrandingAssets): void {
  if (typeof document === 'undefined') return;
  if (assets.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = assets.faviconUrl;
  }
  const html = document.documentElement;
  if (assets.logoUrl) {
    html.setAttribute('data-brand-logo', assets.logoUrl);
  } else {
    html.removeAttribute('data-brand-logo');
  }
  if (assets.heroUrl) {
    html.setAttribute('data-brand-hero', assets.heroUrl);
  } else {
    html.removeAttribute('data-brand-hero');
  }
}

export function applyDirection(rtl: boolean): void {
  if (typeof document === 'undefined') return;
  const dir = rtl ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.body?.classList.toggle('rtl', rtl);
  document.body?.setAttribute('dir', dir);
}

export const BRANDING_DEFAULTS = { ...DEFAULT_BRANDING };
