<template>
  <section
    id="ai"
    class="home-ai scroll-mt-[72px] flex flex-col gap-10 bg-white px-4 py-12 sm:px-6 lg:gap-16 lg:px-20 lg:py-20"
  >
    <div
      class="home-ai__heading mx-auto grid w-full max-w-[1280px] grid-cols-1 items-end gap-6 lg:grid-cols-2"
    >
      <h2
        class="m-0 text-3xl font-semibold leading-[1.1] text-[#191c1d] sm:text-4xl lg:text-5xl"
      >
        {{ t('landing.home.ai.title') }}
      </h2>
      <p
        class="m-0 text-base font-normal capitalize leading-7 text-[#444651] lg:ps-[26px] lg:text-lg lg:[border-inline-start:2px_solid_rgb(30_58_138_/_0.2)]"
      >
        {{ t('landing.home.ai.subtitle') }}
      </p>
    </div>

    <div
      class="home-ai__grid mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 md:grid-cols-3"
    >
      <article
        v-for="feature in features"
        :key="feature.id"
        class="home-ai__card flex flex-col rounded-xl bg-white p-[17px] shadow-[0_4px_16px_0_rgb(30_58_138_/_0.05)] [border:1px_solid_rgb(30_58_138_/_0.1)]"
      >
        <div
          class="mb-6 h-48 w-full overflow-hidden rounded-lg bg-[#edeeef] [border:1px_solid_rgb(197_197_211_/_0.3)]"
        >
          <img
            :src="feature.image"
            :alt="t(`landing.home.ai.items.${feature.id}.title`)"
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="flex flex-col gap-2">
          <span
            class="home-ai__tag inline-flex w-fit items-center rounded-pill bg-[#d5e4f8] px-[5px] py-[3px] text-xs font-medium leading-4 text-[#0e1d2b] [border:1px_solid_rgb(100_168_254_/_0.2)]"
          >
            {{ t(`landing.home.ai.items.${feature.id}.tag`) }}
          </span>
          <h3
            class="m-0 flex items-center gap-1 text-2xl font-semibold leading-8 text-[#191c1d]"
          >
            <img
              :src="feature.icon"
              alt=""
              class="h-[18px] w-auto"
              loading="lazy"
              decoding="async"
            />
            {{ t(`landing.home.ai.items.${feature.id}.title`) }}
          </h3>
          <p class="m-0 pt-2 text-base leading-6 text-[#444651]">
            {{ t(`landing.home.ai.items.${feature.id}.description`) }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import imgBuilder from '@/assets/landing/ai-course-builder.webp';
import imgQuiz from '@/assets/landing/ai-quiz-generator.webp';
import imgAssistant from '@/assets/landing/ai-smart-assistant.webp';
import iconBuilder from '@/assets/landing/icon-ai-builder.svg';
import iconQuiz from '@/assets/landing/icon-ai-quiz.svg';
import iconAssistant from '@/assets/landing/icon-ai-assistant.svg';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

const features = [
  { id: 'builder', image: imgBuilder, icon: iconBuilder },
  { id: 'quiz', image: imgQuiz, icon: iconQuiz },
  { id: 'assistant', image: imgAssistant, icon: iconAssistant },
] as const;
</script>
