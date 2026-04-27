<template>
  <div class="minimal-wrapper" :class="patternClass" :dir="pageDirection" :lang="activeLocale">
    <ThemeProvider
      :primary-color="branding?.branding?.colors?.primary"
      :secondary-color="branding?.branding?.colors?.secondary"
      :accent-color="branding?.branding?.colors?.accent"
      :font-family="branding?.branding?.fontFamily"
    >
      <!-- Minimal Header -->
      <header class="minimal-header">
        <div class="minimal-container header-inner">
          <div class="brand">
            <img v-if="brandAvatarUrl" :src="brandAvatarUrl" class="brand-avatar" :alt="landing.teacher.displayName" />
            <span v-else class="brand-initials">{{ brandInitials }}</span>
            <span class="brand-name">{{ landing.teacher.displayName }}</span>
          </div>
          <nav class="minimal-nav">
             <a href="#about">{{ t('teacherLanding.navigation.about') || 'About' }}</a>
             <a href="#courses">{{ t('teacherLanding.navigation.courses') || 'Courses' }}</a>
             <a href="#contact">{{ t('teacherLanding.navigation.contact') || 'Contact' }}</a>
             <button v-if="landing.social" class="btn btn-outline btn-sm">{{ t('teacherLanding.navigation.login') || 'Login' }}</button>
          </nav>
        </div>
      </header>

      <!-- Minimal Hero -->
      <section class="minimal-hero" id="hero">
        <div class="minimal-container hero-inner">
           <h1 class="hero-title">{{ heroSection?.title }}</h1>
           <p class="hero-subtitle">{{ heroSection?.subtitle }}</p>
           <p v-if="heroSection?.description" class="hero-desc">{{ heroSection?.description }}</p>
           <div class="hero-actions" v-if="heroSection?.ctaActions !== 'none'">
              <a :href="heroSection?.ctaHref || '#'" class="btn btn-primary btn-lg">{{ heroSection?.ctaText }}</a>
           </div>
        </div>
      </section>

      <!-- Minimal About -->
      <section class="minimal-section" id="about" v-if="aboutSection">
        <div class="minimal-container">
           <h2 class="section-title">{{ aboutSection.title }}</h2>
           <p class="section-desc">{{ aboutSection.description }}</p>
           <div class="highlights-grid" v-if="aboutSection.highlights && aboutSection.highlights.length">
              <div v-for="h in aboutSection.highlights" :key="h" class="highlight-card">
                 {{ h }}
              </div>
           </div>
        </div>
      </section>

      <!-- Minimal Courses -->
      <section class="minimal-section bg-gray" id="courses" v-if="courses && courses.length">
        <div class="minimal-container">
           <h2 class="section-title">{{ t('teacherLanding.navigation.courses') || 'Courses' }}</h2>
           <div class="courses-grid">
              <div v-for="course in courses" :key="course.id" class="course-card">
                 <div class="course-cover-wrapper" v-if="course.coverUrl">
                    <img :src="course.coverUrl" class="course-cover" :alt="course.title" />
                 </div>
                 <div class="course-body">
                    <h3>{{ course.title }}</h3>
                    <p>{{ course.description || course.subtitle }}</p>
                    <div class="course-footer">
                       <span class="price" v-if="course.price">{{ course.price }}</span>
                       <a href="#" class="btn btn-sm btn-outline">{{ t('teacherLanding.navigation.register') || 'Enroll' }}</a>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <!-- Minimal Contact -->
      <section class="minimal-section" id="contact" v-if="contactSection">
         <div class="minimal-container text-center">
            <h2 class="section-title">{{ contactSection.title }}</h2>
            <p>{{ contactSection.subtitle }}</p>
            <div class="contact-actions">
               <a :href="contactSection.ctaHref || '#'" class="btn btn-primary">{{ contactSection.ctaText }}</a>
            </div>
         </div>
      </section>
      
      <!-- Footer -->
      <footer class="minimal-footer">
         <div class="minimal-container">
            <div class="footer-copy">
               &copy; {{ new Date().getFullYear() }} {{ landing.teacher.displayName }}.
            </div>
         </div>
      </footer>
    </ThemeProvider>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemeProvider from '@/components/teacherLanding/ThemeProvider.vue';
import type { TeacherLandingPublicResponse } from '@/services/teacherLanding.api';
import { withCacheBusting } from '@/utils/cacheBusting';

const props = defineProps<{
  landing: TeacherLandingPublicResponse;
  loading?: boolean;
  branding?: any;
}>();

const { t, locale } = useI18n();
const activeLocale = computed(() => (locale.value === 'en' ? 'en' : 'ar'));
const pageDirection = computed(() => (activeLocale.value === 'ar' ? 'rtl' : 'ltr'));

const heroSection = computed(() => props.landing.sections.find(s => s.type === 'hero'));
const aboutSection = computed(() => props.landing.sections.find(s => s.type === 'about'));
const contactSection = computed(() => props.landing.sections.find(s => s.type === 'contact'));
const courses = computed(() => props.landing.courses);

const brandAvatarUrl = computed(() => {
   const url = props.landing.teacher.photoUrl || props.landing.teacher.avatarUrl;
   if (!url) return null;
   return withCacheBusting(url, props.landing.teacher.updatedAt);
});

const brandInitials = computed(() => {
  const name = props.landing.teacher.displayName || '';
  return name.slice(0, 2).toUpperCase();
});

const pattern = computed(() => {
  return props.branding?.branding?.pattern || props.landing.branding?.pattern || 'none';
});
const patternClass = computed(() => `teacher-landing-pattern--${pattern.value}`);
</script>

<style scoped>
.minimal-wrapper {
  font-family: var(--sakai-font-family-base, 'Inter', sans-serif);
  color: #333;
  line-height: 1.6;
  background-color: #fff;
  min-height: 100vh;
}
.teacher-landing-pattern--dots {
  background-image: radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}
.teacher-landing-pattern--grid {
  background-image: linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
  background-size: 30px 30px;
}
.teacher-landing-pattern--lines {
  background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px);
}
.teacher-landing-pattern--waves {
    background: radial-gradient(circle at 50% 0, rgba(0,0,0,0.05), transparent 70%);
}

.minimal-container {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
.text-center { text-align: center; }

/* Header */
.minimal-header {
  padding: 1.5rem 0;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: #111;
}
.brand-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.brand-initials {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #eee;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  color: #555;
}
.minimal-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}
.minimal-nav a {
  text-decoration: none;
  color: #555;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s;
}
.minimal-nav a:hover {
  color: var(--sakai-primary-color, #000);
}

/* Buttons */
.btn {
  display: inline-flex;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.95rem;
}
.btn-primary {
  background: var(--sakai-primary-color, #333);
  color: #fff;
}
.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-outline {
  border-color: #ddd;
  background: transparent;
  color: #333;
}
.btn-outline:hover {
  border-color: #333;
}
.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}
.btn-lg {
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
}

/* Hero */
.minimal-hero {
  padding: 8rem 0 6rem;
  text-align: center;
}
.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
  color: #111;
  letter-spacing: -0.02em;
}
.hero-subtitle {
  font-size: 1.35rem;
  color: #666;
  margin-bottom: 2.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  font-weight: 400;
}
.hero-desc {
  color: #888;
  margin-bottom: 2rem;
}

/* Sections */
.minimal-section {
  padding: 6rem 0;
}
.bg-gray {
  background: #f8f9fa;
}
.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #111;
}
.section-desc {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 3rem;
  max-width: 700px;
}
.highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}
.highlight-card {
  padding: 2rem;
  border-radius: 8px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 4px 6px rgba(0,0,0,0.02);
  font-size: 1.1rem;
  color: #444;
  line-height: 1.6;
}

/* Courses */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2.5rem;
}
.course-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid rgba(0,0,0,0.05);
}
.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}
.course-cover-wrapper {
  height: 180px;
  overflow: hidden;
  background: #f0f0f0;
}
.course-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.course-card:hover .course-cover {
  transform: scale(1.05);
}
.course-body {
  padding: 1.5rem;
}
.course-body h3 {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111;
}
.course-body p {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}
.price {
  font-weight: 700;
  color: var(--sakai-primary-color, #111);
  font-size: 1.1rem;
}

/* Footer */
.minimal-footer {
  padding: 3rem 0;
  text-align: center;
  color: #888;
  font-size: 0.9rem;
  border-top: 1px solid #eee;
}

/* RTL Override */
[dir="rtl"] .minimal-nav a {
  margin-left: 0;
  margin-right: 2rem;
}
</style>
