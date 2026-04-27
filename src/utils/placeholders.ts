import logoPlaceholder from '@/assets/placeholders/logo-placeholder.svg';
import heroPlaceholder from '@/assets/placeholders/hero-placeholder.svg';
import coursePlaceholder from '@/assets/zidnicourse.jpg';

type PlaceholderType = 'logo' | 'hero' | 'course';

const PLACEHOLDER_MAP: Record<PlaceholderType, string> = {
  logo: logoPlaceholder,
  hero: heroPlaceholder,
  course: coursePlaceholder
};

export const withPlaceholder = (value: string | null | undefined, type: PlaceholderType): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length) {
      return trimmed;
    }
  }
  return PLACEHOLDER_MAP[type];
};
