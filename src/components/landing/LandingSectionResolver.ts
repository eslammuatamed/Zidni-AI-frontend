import HeroSection from '@/components/landing/sections/HeroSection.vue';
import CoursesSection from '@/components/landing/sections/CoursesSection.vue';
import TestimonialsSection from '@/components/landing/sections/TestimonialsSection.vue';
import FeaturesSection from '@/components/landing/sections/FeaturesSection.vue';
import FaqSection from '@/components/landing/sections/FaqSection.vue';
import CtaSection from '@/components/landing/sections/CtaSection.vue';
import OffersSection from '@/components/landing/sections/OffersSection.vue';

export const sectionRegistry: Record<string, any> = {
  hero: HeroSection,
  courses: CoursesSection,
  testimonials: TestimonialsSection,
  offers: OffersSection,
  features: FeaturesSection,
  faq: FaqSection,
  cta: CtaSection,
  custom: HeroSection
};
