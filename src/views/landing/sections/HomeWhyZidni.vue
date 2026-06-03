<template>
  <section
    id="why"
    class="home-why scroll-mt-[72px] flex flex-col items-center gap-12 bg-[#f8fafc] px-4 py-12 sm:px-6 lg:gap-[72px] lg:px-20 lg:py-20"
  >
    <div
      class="home-why__heading flex w-full flex-col items-center gap-4 text-center lg:gap-6"
    >
      <h2
        class="m-0 text-3xl font-bold leading-[1.2] tracking-[1px] text-[#0b1c30] lg:text-[40px]"
      >
        {{ t('landing.home.why.title') }}
      </h2>
      <p class="m-0 text-lg font-normal text-[#444651] lg:text-2xl">
        {{ t('landing.home.why.subtitle') }}
      </p>
    </div>

    <div
      class="home-why__grid grid w-full max-w-[1280px] grid-cols-1 gap-6 lg:grid-cols-3"
    >
      <!-- Card: Made for the modern learner (wide, text + image) -->
      <article
        class="home-why__card flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgb(0_0_0_/_0.1)] [border:1px_solid_rgb(197_197_211_/_0.3)] md:flex-row lg:col-span-2 lg:h-[381px]"
      >
        <div class="flex flex-1 flex-col gap-3 p-8">
          <h3 class="m-0 text-2xl font-bold tracking-[1px] text-sakai-primary">
            {{ t('landing.home.why.learner.title') }}
          </h3>
          <p class="m-0 text-base leading-[1.6] text-[#444651]">
            {{ t('landing.home.why.learner.description') }}
          </p>
          <ul class="m-0 list-disc ps-6 text-base leading-[1.6] text-[#444651]">
            <li>{{ t('landing.home.why.learner.points.dashboard') }}</li>
            <li>{{ t('landing.home.why.learner.points.mobileApp') }}</li>
            <li>{{ t('landing.home.why.learner.points.dripContent') }}</li>
            <li>{{ t('landing.home.why.learner.points.quizzes') }}</li>
          </ul>
        </div>
        <div class="relative h-64 w-full md:h-auto md:flex-1">
          <img
            :src="imgLearner"
            :alt="t('landing.home.why.learner.title')"
            class="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div
            class="absolute inset-0 bg-[#1e3a8a]/20 mix-blend-multiply"
            aria-hidden="true"
          ></div>
        </div>
      </article>

      <!-- Card: More time for what matters (tall, image + text) -->
      <article
        class="home-why__card flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgb(0_0_0_/_0.1)] [border:1px_solid_rgb(197_197_211_/_0.3)] lg:row-span-2"
      >
        <div class="relative min-h-[200px] w-full flex-1">
          <img
            :src="imgInstructor"
            :alt="t('landing.home.why.time.title')"
            class="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div
            class="absolute inset-0 bg-[#1e3a8a]/20 mix-blend-multiply"
            aria-hidden="true"
          ></div>
        </div>
        <div class="flex flex-col gap-3 p-8">
          <h3 class="m-0 text-2xl font-bold tracking-[1px] text-sakai-primary">
            {{ t('landing.home.why.time.title') }}
          </h3>
          <p class="m-0 text-base leading-[1.6] text-[#444651]">
            {{ t('landing.home.why.time.description') }}
          </p>
        </div>
      </article>

      <!-- Card: Business growth that lasts (text + inset analytics image) -->
      <article
        class="home-why__card flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgb(0_0_0_/_0.1)] [border:1px_solid_rgb(197_197_211_/_0.3)]"
      >
        <div class="flex flex-col gap-3 px-8 pb-4 pt-8">
          <h3 class="m-0 text-2xl font-bold tracking-[1px] text-sakai-primary">
            {{ t('landing.home.why.growth.title') }}
          </h3>
          <p class="m-0 text-base leading-[1.6] text-[#444651]">
            {{ t('landing.home.why.growth.description') }}
          </p>
        </div>
        <div class="flex flex-1 items-end justify-center px-8 py-4">
          <div
            class="relative h-full min-h-[180px] w-full overflow-hidden rounded-xl shadow-[0_-4px_20px_rgb(0_0_0_/_0.1)]"
          >
            <img
              :src="imgAnalytics"
              :alt="t('landing.home.why.growth.title')"
              class="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div
              class="absolute inset-0 bg-[#1e3a8a]/20 mix-blend-multiply"
              aria-hidden="true"
            ></div>
          </div>
        </div>
      </article>

      <!-- Card: Made to adapt and evolve (image + text) -->
      <article
        class="home-why__card flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgb(0_0_0_/_0.1)] [border:1px_solid_rgb(197_197_211_/_0.3)]"
      >
        <div class="relative h-48 w-full">
          <img
            :src="imgDynamicUi"
            :alt="t('landing.home.why.adapt.title')"
            class="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div
            class="absolute inset-0 bg-[#1e3a8a]/20 mix-blend-multiply"
            aria-hidden="true"
          ></div>
        </div>
        <div class="flex flex-col gap-3 p-8">
          <h3 class="m-0 text-2xl font-bold tracking-[1px] text-sakai-primary">
            {{ t('landing.home.why.adapt.title') }}
          </h3>
          <p class="m-0 text-base leading-[1.6] text-[#444651]">
            {{ t('landing.home.why.adapt.description') }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import imgLearner from '@/assets/landing/why-modern-learner.webp';
import imgInstructor from '@/assets/landing/why-instructor.webp';
import imgAnalytics from '@/assets/landing/why-analytics.webp';
import imgDynamicUi from '@/assets/landing/why-dynamic-ui.webp';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});
</script>
