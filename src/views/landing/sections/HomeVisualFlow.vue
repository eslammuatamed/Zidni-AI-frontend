<template>
  <section
    id="flow"
    class="home-flow scroll-mt-[72px] bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-20 lg:py-20"
  >
    <div
      class="home-flow__steps mx-auto flex w-full max-w-[1280px] flex-col gap-16 lg:gap-32"
    >
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="home-flow__step flex flex-col items-center gap-8 lg:flex-row lg:justify-between lg:gap-12"
      >
        <div
          class="home-flow__copy flex w-full flex-col gap-4 lg:max-w-[431px]"
          :class="index % 2 === 1 ? 'lg:order-2' : ''"
        >
          <span
            class="text-5xl font-semibold leading-none lg:text-6xl"
            :class="step.numberColor"
          >
            {{ step.number }}
          </span>
          <h3
            class="m-0 text-2xl font-extrabold leading-9 text-sakai-accent lg:text-3xl"
          >
            {{ t(`landing.home.flow.steps.${step.id}.title`) }}
          </h3>
          <p
            class="m-0 text-base font-medium leading-[26px] text-content-secondary"
          >
            {{ t(`landing.home.flow.steps.${step.id}.description`) }}
          </p>
        </div>
        <div
          class="home-flow__media w-full overflow-hidden rounded-2xl shadow-[4px_4px_20px_0_rgb(0_0_0_/_0.15)] lg:max-w-[755px]"
          :class="index % 2 === 1 ? 'lg:order-1' : ''"
        >
          <img
            :src="step.image"
            :alt="t(`landing.home.flow.steps.${step.id}.title`)"
            class="block aspect-[755/431] h-auto w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { landingMessages } from '@/views/landing/messages';
import imgCreate from '@/assets/landing/flow-step-create.webp';
import imgPublish from '@/assets/landing/flow-step-publish.webp';
import imgEarn from '@/assets/landing/flow-step-earn.webp';

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local',
  messages: landingMessages,
});

const steps = [
  {
    id: 'create',
    number: '01',
    numberColor: 'text-sakai-primary',
    image: imgCreate,
  },
  {
    id: 'publish',
    number: '02',
    numberColor: 'text-[#2563eb]',
    image: imgPublish,
  },
  { id: 'earn', number: '03', numberColor: 'text-[#4f46e5]', image: imgEarn },
] as const;
</script>
