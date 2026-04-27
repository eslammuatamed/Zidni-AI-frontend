import type {
  TeacherLandingPublicResponse,
  TeacherLandingSection,
  TeacherLandingSocial
} from '@/services/teacherLanding.api';

export type LandingVM = {
  hero: {
    mediaType: 'video' | 'image';
    videoSrc?: string;
    imageSrc?: string;
    overlay?: number;
    badgeSrc?: string;
    title: string;
    subtitle?: string;
  };
  cta: {
    primaryLabel: string;
    primaryTo: string;
    contactLabel: string;
    contactTo: string;
  };
  social?: { facebook?: string; instagram?: string; youtube?: string; x?: string };
  nav?: Array<{ label: string; to: string }>;
};

const FALLBACK_VM: LandingVM = {
  hero: {
    mediaType: 'image',
    overlay: 0.45,
    title: 'مرحبًا بك في عالم الفيزياء!',
    subtitle: 'دروس فيزياء تفاعلية أونلاين وحضوري — منهجية مبسّطة ونتائج ملموسة.'
  },
  cta: {
    primaryLabel: 'عرض الخدمات',
    primaryTo: '/ar/services',
    contactLabel: 'تواصل معي',
    contactTo: '/ar/contact'
  },
  nav: [
    { label: 'عنّي', to: '/ar/about' },
    { label: 'البرامج', to: '/ar/programs' },
    { label: 'المواد', to: '/ar/subjects' },
    { label: 'المصادر', to: '/ar/resources' },
    { label: 'المدوّنة', to: '/ar/blog' }
  ]
};

function coerceString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}

function clampOverlay(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return undefined;
  }
  return Math.min(1, Math.max(0, value));
}

function resolveHeroSection(api: TeacherLandingPublicResponse | undefined): Partial<TeacherLandingSection> {
  if (!api) {
    return {};
  }
  const sections = Array.isArray(api.sections) ? api.sections : [];
  const explicitHero = api as unknown as { hero?: TeacherLandingSection };
  if (explicitHero?.hero) {
    return explicitHero.hero;
  }
  return sections.find((section) => (section?.type ?? '').toLowerCase() === 'hero') ?? {};
}

function resolveNav(
  api: TeacherLandingPublicResponse | undefined,
  fallback: LandingVM['nav'] | undefined
): LandingVM['nav'] {
  const rawNav = Array.isArray((api as any)?.nav) ? (api as any).nav : [];
  const navFromApi = rawNav
    .map((item: any) => {
      const label = coerceString(item?.label);
      const to = coerceString(item?.to);
      if (!label || !to) {
        return undefined;
      }
      return { label, to };
    })
    .filter(Boolean) as LandingVM['nav'];

  if (navFromApi.length) {
    return navFromApi;
  }

  const sections = Array.isArray(api?.sections) ? api?.sections : [];
  const navFromSections = sections
    .map((section) => {
      const label = coerceString(section?.title);
      const anchor = coerceString(section?.type);
      if (!label || !anchor) {
        return undefined;
      }
      return { label, to: `#${anchor}` };
    })
    .filter(Boolean) as LandingVM['nav'];

  if (navFromSections.length) {
    return navFromSections;
  }

  return fallback;
}

function resolveSocial(social: TeacherLandingSocial | null | undefined): LandingVM['social'] {
  const resolved: LandingVM['social'] = {
    facebook: coerceString(social?.facebook),
    instagram: coerceString(social?.instagram),
    youtube: coerceString(social?.youtube),
    x: coerceString((social as any)?.x ?? (social as any)?.twitter ?? (social as any)?.telegram)
  };

  const hasAny = Object.values(resolved).some(Boolean);
  return hasAny ? resolved : undefined;
}

export function toLandingVM(api: any): LandingVM {
  const landingApi = api as TeacherLandingPublicResponse | undefined;
  const heroSection = resolveHeroSection(landingApi);

  const heroImage = coerceString((api?.hero && api.hero.imagePath) || heroSection?.imageUrl);
  const heroVideo = coerceString((api?.hero && api.hero.videoPath) || (heroSection as any)?.videoUrl);
  const mediaType: 'video' | 'image' = heroVideo ? 'video' : 'image';

  const overlayValue =
    clampOverlay(api?.hero?.overlay) ??
    clampOverlay((heroSection as any)?.overlay) ??
    FALLBACK_VM.hero.overlay;

  const title =
    coerceString(api?.hero?.title) ??
    coerceString(heroSection?.title) ??
    coerceString(landingApi?.teacher?.displayName) ??
    FALLBACK_VM.hero.title;

  const subtitle =
    coerceString(api?.hero?.subtitle) ??
    coerceString(heroSection?.subtitle) ??
    coerceString(heroSection?.description) ??
    FALLBACK_VM.hero.subtitle;

  const badgeSrc = coerceString(api?.hero?.awardBadgePath ?? (heroSection as any)?.badgeSrc);

  const primaryLabel =
    coerceString(api?.cta?.primary?.label) ?? coerceString(heroSection?.ctaText) ?? FALLBACK_VM.cta.primaryLabel;
  const primaryTo =
    coerceString(api?.cta?.primary?.to) ?? coerceString(heroSection?.ctaHref) ?? FALLBACK_VM.cta.primaryTo;

  const contactLabel = coerceString(api?.cta?.contact?.label) ?? FALLBACK_VM.cta.contactLabel;
  const contactTo = coerceString(api?.cta?.contact?.to) ?? FALLBACK_VM.cta.contactTo;

  const social = resolveSocial(landingApi?.social ?? api?.social);

  const nav = resolveNav(landingApi, FALLBACK_VM.nav);

  return {
    hero: {
      mediaType,
      videoSrc: heroVideo ?? undefined,
      imageSrc: heroVideo ? undefined : heroImage ?? undefined,
      overlay: overlayValue,
      badgeSrc: badgeSrc ?? undefined,
      title,
      subtitle
    },
    cta: {
      primaryLabel,
      primaryTo,
      contactLabel,
      contactTo
    },
    social,
    nav
  };
}
