<template>
  <div class="landing-renderer" :class="layoutClass">
    <component
      v-for="section in orderedSections"
      :is="resolve(section.kind)"
      :key="section.id ?? `${section.kind}-${section.position}`"
      :config="section.data"
      :courses="section.kind === 'courses' ? courses : undefined"
      :assets="assetsFor(section.kind)"
      :offers="offers"
      :testimonials="testimonials"
      :faqs="faqs"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { sectionRegistry } from '@/components/landing/LandingSectionResolver';
import type {
  LandingAsset,
  LandingFaq,
  LandingOffer,
  LandingSection,
  LandingTestimonial
} from '@/services/landing';

const props = defineProps<{
  sections: LandingSection[];
  branding?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  courses?: any[];
  assets?: LandingAsset[];
  offers?: LandingOffer[];
  testimonials?: LandingTestimonial[];
  faqs?: LandingFaq[];
}>();

const orderedSections = computed(() =>
  (props.sections || [])
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0))
);

const layoutClass = computed(() => {
  const name = (props.layout?.name as string | undefined) || '';
  return name ? `layout-${name}` : '';
});

const resolve = (kind: string) => sectionRegistry[kind] || sectionRegistry.hero;

const assetsFor = (section: string) =>
  (props.assets || []).filter((asset) => {
    const metadata = asset.metadata as Record<string, unknown> | undefined;
    const sectionValue = metadata ? (metadata['section'] as string | undefined) : undefined;
    const sectionKey = typeof sectionValue === 'string' ? sectionValue.toLowerCase() : undefined;
    return sectionKey ? sectionKey === section.toLowerCase() : false;
  });
</script>

<style scoped>
.landing-renderer {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-12);
  width: min(100%, calc(var(--sakai-container-max) + var(--sakai-space-8)));
  margin: 0 auto;
}
</style>
