<template>
  <section v-if="hasContent" class="teacher-about">
    <div class="teacher-about__container">
      <div class="teacher-about__badge">{{ t('teacherLanding.about.badge') }}</div>
      <h2 class="teacher-about__title">{{ title }}</h2>
      <p v-if="subtitle" class="teacher-about__subtitle">{{ subtitle }}</p>
      <p v-if="description" class="teacher-about__description">{{ description }}</p>
      <ul v-if="highlights.length" class="teacher-about__highlights">
        <li v-for="item in highlights" :key="item">{{ item }}</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TeacherLandingSection, TeacherLandingTeacherInfo } from '@/services/teacherLanding.api';

const props = defineProps<{
  teacher: TeacherLandingTeacherInfo;
  section?: TeacherLandingSection;
}>();

const { t } = useI18n();

const title = computed(() => props.section?.title || props.teacher.displayName || '');
const subtitle = computed(() => props.section?.subtitle || props.teacher.headline || '');
const description = computed(() => props.section?.description || props.teacher.bio || '');
const highlights = computed(() => props.section?.highlights?.filter(Boolean) ?? []);

const hasContent = computed(() => Boolean(title.value || description.value || highlights.value.length));
</script>

<style scoped>
.teacher-about {
  padding: clamp(3rem, 6vw, 4.5rem) 1.5rem;
}

.teacher-about__container {
  max-width: 980px;
  margin: 0 auto;
  padding: clamp(2.5rem, 5vw, 3.5rem);
  border-radius: 1.75rem;
  background: linear-gradient(135deg, var(--teacher-color-surface), rgba(248,250,252,0.9));
  box-shadow: 0 26px 48px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.18);
  display: grid;
  gap: 1.5rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.teacher-about__container::before {
  content: '';
  position: absolute;
  inset: -35% 20% auto 20%;
  height: 70%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.18), transparent 65%);
  filter: blur(24px);
  opacity: 0.8;
  pointer-events: none;
}

.teacher-about__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.35rem 1.1rem;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.14);
  color: var(--teacher-color-primary);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
  z-index: 1;
}

.teacher-about__title {
  margin: 0;
  font-size: clamp(2.0rem, 4.2vw, 2.6rem);
  z-index: 1;
  color: var(--teacher-color-text-primary);
  font-weight: 700;
}

.teacher-about__subtitle {
  margin: 0;
  color: var(--teacher-color-text-secondary);
  font-size: 1.1rem;
  z-index: 1;
}

.teacher-about__description {
  margin: 0 auto;
  color: var(--teacher-color-text-secondary);
  font-size: 1rem;
  line-height: 1.8;
  max-width: 52ch;
  z-index: 1;
}

.teacher-about__highlights {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  z-index: 1;
}

.teacher-about__highlights li {
  position: relative;
  padding: 1rem 1.25rem 1rem 3.25rem;
  color: var(--teacher-color-text-primary);
  text-align: left;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 18px 30px rgba(15, 23, 42, 0.08);
  font-weight: 600;
}

.teacher-about__highlights li::before {
  content: '';
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--teacher-color-secondary), var(--teacher-color-accent));
  position: absolute;
  top: 50%;
  left: 1.1rem;
  transform: translateY(-50%);
  box-shadow: 0 0 0 6px rgba(14, 165, 233, 0.16);
}
</style>
