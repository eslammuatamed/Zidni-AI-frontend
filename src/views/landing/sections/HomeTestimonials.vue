<template>
  <!--
    Static content for now: the existing landingContent store/API
    (/v1/teacher/landing/content/testimonials) is teacher/tenant-scoped and not
    suitable for the platform marketing page. Needs a platform-level
    testimonials API with author, role badge, metric, and avatar fields —
    see migration_notes.md.
  -->
  <section
    id="testimonials"
    class="home-testimonials scroll-mt-[72px] bg-white px-4 py-12 sm:px-6 lg:px-20 lg:py-20"
  >
    <div
      class="home-testimonials__grid mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-8 md:grid-cols-3"
    >
      <article
        v-for="item in testimonials"
        :key="item.id"
        class="home-testimonials__card flex flex-col gap-6 rounded-2xl bg-[#f8fafc] p-8 shadow-[0_1px_1px_rgb(0_0_0_/_0.05)] [border:1px_solid_#f1f5f9]"
      >
        <div class="flex items-center gap-4">
          <span
            class="inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-full shadow-[0_1px_2px_0_rgb(0_0_0_/_0.05)] [border:2px_solid_white]"
          >
            <img
              :src="item.avatar"
              :alt="t(`landing.home.testimonials.items.${item.id}.author`)"
              class="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </span>
          <div class="flex flex-col">
            <span class="text-base font-semibold leading-6 text-sakai-primary">
              {{ t(`landing.home.testimonials.items.${item.id}.author`) }}
            </span>
            <span
              class="flex items-center gap-1 text-xs font-semibold uppercase leading-4 text-sakai-primary"
            >
              <img
                :src="iconVerified"
                alt=""
                class="h-3 w-auto shrink-0"
                loading="lazy"
                decoding="async"
              />
              {{ t(`landing.home.testimonials.items.${item.id}.role`) }}
            </span>
          </div>
        </div>

        <blockquote
          class="m-0 flex-1 text-base font-medium italic leading-[26px] text-content-secondary"
        >
          {{ t(`landing.home.testimonials.items.${item.id}.quote`) }}
        </blockquote>

        <p class="m-0 flex items-baseline gap-2">
          <span class="text-2xl font-semibold leading-8 text-sakai-primary">
            {{ t(`landing.home.testimonials.items.${item.id}.metric`) }}
          </span>
          <span class="text-sm leading-5 text-[#94a3b8]">
            {{ t(`landing.home.testimonials.items.${item.id}.metricLabel`) }}
          </span>
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import iconVerified from '@/assets/landing/icon-verified.svg';
import avatar1 from '@/assets/landing/testimonial-avatar-1.webp';
import avatar2 from '@/assets/landing/testimonial-avatar-2.webp';
import avatar3 from '@/assets/landing/testimonial-avatar-3.webp';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

const testimonials = [
  { id: 'sarah', avatar: avatar1 },
  { id: 'james', avatar: avatar2 },
  { id: 'elena', avatar: avatar3 },
] as const;
</script>
