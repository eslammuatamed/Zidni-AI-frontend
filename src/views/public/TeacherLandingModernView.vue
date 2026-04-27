<template>
  <template v-if="landing">
    <div class="teacher-landing__wrapper" :dir="pageDirection" :lang="activeLocale">
      <div class="teacher-landing__background" aria-hidden="true"></div>
      <div class="teacher-landing__halo teacher-landing__halo--one" aria-hidden="true" />
      <div class="teacher-landing__halo teacher-landing__halo--two" aria-hidden="true" />
      <div class="teacher-landing__halo teacher-landing__halo--three" aria-hidden="true" />
      <ThemeProvider :hero-image="selectedBg || undefined" :style="landingThemeStyle">
        <header class="teacher-landing__header" :class="{ 'teacher-landing__header--compact': isHeaderCompact }">
          <div class="teacher-landing__header-inner teacher-landing__container">
            <div class="teacher-landing__brand">
              <div class="teacher-landing__brand-avatar">
                <img
                  v-if="brandAvatarUrl"
                  :src="brandAvatarUrl"
                  :alt="landing.teacher.displayName || landing.teacher.slug"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  @error="handleBrandAvatarError"
                />
                <span v-else class="teacher-landing__brand-avatar-fallback">
                  {{ brandInitials }}
                </span>
              </div>
              <span class="teacher-landing__brand-name">{{ landing.teacher.displayName }}</span>
              <span v-if="landing.teacher.headline" class="teacher-landing__brand-tagline">{{ landing.teacher.headline }}</span>
            </div>
            <nav class="teacher-landing__nav teacher-landing__nav--desktop" :aria-label="t('teacherLanding.navigation.label')">
              <a href="#hero" class="teacher-landing__nav-link">
                {{ t('teacherLanding.navigation.home') }}
              </a>
              <a href="#features" class="teacher-landing__nav-link">
                {{ t('teacherLanding.navigation.about') }}
              </a>
              <a href="#courses" class="teacher-landing__nav-link">
                {{ t('teacherLanding.navigation.courses') }}
              </a>

            </nav>
            <div class="teacher-landing__header-actions">
              <RouterLink
                v-if="canEditLanding"
                :to="editLandingRoute"
                class="teacher-landing__edit"
              >
                {{ t('teacherLanding.navigation.edit') }}
              </RouterLink>
              <button
                type="button"
                class="teacher-landing__language"
                :aria-label="languageToggleAria"
                @click="toggleLanguage"
              >
                <span aria-hidden="true">{{ languageToggleShortLabel }}</span>
                <span class="sr-only">{{ languageToggleAria }}</span>
              </button>
              <button
                v-if="canEditLanding && teacherLandingUrl"
                type="button"
                class="teacher-landing__share-copy teacher-landing__nav-cta--desktop"
                :class="{ 'is-copied': copyStatus === 'success' }"
                @click="copyLandingUrl"
                :title="copyButtonLabel"
              >
                {{ copyButtonLabel }}
              </button>
              <RouterLink
                :to="studentRegisterRoute"
                class="teacher-landing__nav-cta teacher-landing__nav-cta--primary teacher-landing__nav-cta--desktop"
                @click="trackLandingEvent('nav_register')"
              >
                {{ t('teacherLanding.navigation.register') }}
              </RouterLink>
              <button
                type="button"
                class="teacher-landing__nav-cta teacher-landing__nav-cta--ghost teacher-landing__nav-cta--desktop"
                @click="onTrackedLoginClick('nav_login')"
              >
                {{ t('teacherLanding.navigation.login') }}
              </button>
              <button
                type="button"
                class="teacher-landing__hamburger"
                :aria-label="t('teacherLanding.navigation.menu')"
                :aria-expanded="mobileMenuOpen"
                @click="mobileMenuOpen = !mobileMenuOpen"
              >
                <span v-if="!mobileMenuOpen" class="teacher-landing__hamburger-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                </span>
                <span v-else class="teacher-landing__hamburger-icon teacher-landing__hamburger-icon--close" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
              </button>
            </div>
            <Teleport to="body">
              <Transition name="teacher-landing-drawer-backdrop">
                <div
                  v-show="mobileMenuOpen"
                  class="teacher-landing__drawer-backdrop"
                  role="presentation"
                  @click="mobileMenuOpen = false"
                />
              </Transition>
              <Transition :name="pageDirection === 'rtl' ? 'teacher-landing-drawer-panel-rtl' : 'teacher-landing-drawer-panel'">
                <aside
                  v-show="mobileMenuOpen"
                  class="teacher-landing__drawer"
                  :class="{ 'teacher-landing__drawer--rtl': pageDirection === 'rtl' }"
                  role="dialog"
                  :aria-label="t('teacherLanding.navigation.label')"
                  aria-modal="true"
                >
                  <nav class="teacher-landing__drawer-nav">
                    <a href="#hero" class="teacher-landing__nav-link" @click="mobileMenuOpen = false">{{ t('teacherLanding.navigation.home') }}</a>
                    <a href="#features" class="teacher-landing__nav-link" @click="mobileMenuOpen = false">{{ t('teacherLanding.navigation.about') }}</a>
                    <a href="#courses" class="teacher-landing__nav-link" @click="mobileMenuOpen = false">{{ t('teacherLanding.navigation.courses') }}</a>

                    <RouterLink
                      v-if="assistantLinkAvailable"
                      :to="assistantLoginRoute"
                      class="teacher-landing__nav-link"
                      @click="mobileMenuOpen = false"
                    >
                      {{ t('teacherLanding.navigation.assistant') }}
                    </RouterLink>
                    <button type="button" class="teacher-landing__nav-link" @click="onMobileLoginClick">
                      {{ t('teacherLanding.navigation.login') }}
                    </button>
                    <RouterLink :to="studentRegisterRoute" class="teacher-landing__nav-link teacher-landing__nav-link--cta" @click="mobileMenuOpen = false">
                      {{ t('teacherLanding.navigation.register') }}
                    </RouterLink>
                    <RouterLink
                      v-if="canEditLanding"
                      :to="editLandingRoute"
                      class="teacher-landing__nav-link teacher-landing__nav-link--ghost"
                      @click="mobileMenuOpen = false"
                    >
                      {{ t('teacherLanding.navigation.edit') }}
                    </RouterLink>
                  </nav>
                </aside>
              </Transition>
            </Teleport>
          </div>
        </header>

    <div class="teacher-landing__layout">
      <main class="teacher-landing__content">
        <div class="teacher-landing">
      <template v-for="sectionKey in sectionOrder" :key="sectionKey">
        <section
          v-if="sectionKey === 'hero'"
          id="hero"
          class="teacher-landing__section teacher-landing__section--hero"
        >
          <div class="teacher-landing__modern-hero teacher-landing__container">
            <div class="teacher-landing__modern-hero-text">
              <p v-if="heroSubtitle" class="teacher-landing__modern-kicker">{{ heroSubtitle }}</p>
              <h1 class="teacher-landing__modern-title">
                {{ heroTitle }}
                <span class="teacher-landing__modern-underline" aria-hidden="true"></span>
              </h1>
              <p v-if="heroDescription || profileBio" class="teacher-landing__modern-description">
                {{ heroDescription || profileBio }}
              </p>
              <div class="teacher-landing__modern-actions">
                <RouterLink
                  v-if="primaryCtaAction === 'register'"
                  :to="studentRegisterRoute"
                  class="teacher-landing__modern-btn teacher-landing__modern-btn--primary"
                  @click="trackLandingEvent('hero_primary_register')"
                >
                  {{ primaryCtaText }}
                </RouterLink>
                <button
                  v-else-if="primaryCtaAction === 'login'"
                  type="button"
                  class="teacher-landing__modern-btn teacher-landing__modern-btn--primary"
                  @click="onTrackedLoginClick('hero_primary_login')"
                >
                  {{ primaryCtaText }}
                </button>
                <a
                  v-else-if="cta.href"
                  :href="cta.href"
                  class="teacher-landing__modern-btn teacher-landing__modern-btn--primary"
                  @click="handleExploreLessonsClick"
                >
                  {{ primaryCtaText }}
                </a>
                <RouterLink
                  v-if="secondaryCta === 'register'"
                  :to="studentRegisterRoute"
                  class="teacher-landing__modern-btn teacher-landing__modern-btn--outline"
                  @click="trackLandingEvent('hero_secondary_register')"
                >
                  {{ t('teacherLanding.navigation.register') }}
                </RouterLink>
                <button
                  v-else
                  type="button"
                  class="teacher-landing__modern-btn teacher-landing__modern-btn--outline"
                  @click="onTrackedLoginClick('hero_secondary_login')"
                >
                  {{ t('teacherLanding.navigation.login') }}
                </button>
              </div>
              <p v-if="heroSection?.quoteAuthor" class="teacher-landing__modern-quote-author">
                - {{ heroSection.quoteAuthor }}
              </p>
              <div v-if="heroStats.length" class="teacher-landing__modern-stats">
                <div v-for="(stat, index) in heroStats" :key="`modern-hero-stat-${index}`" class="teacher-landing__modern-stat">
                  <div class="teacher-landing__modern-stat-number">{{ stat.value }}</div>
                  <div class="teacher-landing__modern-stat-label">{{ stat.label }}</div>
                </div>
              </div>
            </div>
            <div class="teacher-landing__modern-hero-media">
              <img
                v-if="heroImageSrc"
                :src="heroImageSrc"
                :alt="landing.teacher.displayName || landing.teacher.slug"
                class="teacher-landing__modern-hero-image"
                loading="eager"
                decoding="async"
                fetchpriority="high"
              />
            </div>
          </div>
          <div class="teacher-landing__hero-shell teacher-landing__hero-shell--legacy">
            <div class="teacher-landing__cover" :style="coverStyle">
              <picture v-if="coverImage" class="teacher-landing__cover-picture">
                <source v-if="coverSources.lg" media="(min-width: 1441px)" :srcset="coverSources.lg" />
                <source v-if="coverSources.md" media="(min-width: 769px)" :srcset="coverSources.md" />
                <source v-if="coverSources.sm" media="(max-width: 768px)" :srcset="coverSources.sm" />
                <img
                  :src="coverImage"
                  alt=""
                  class="teacher-landing__cover-image"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                />
              </picture>
              <div class="teacher-landing__cover-overlay" aria-hidden="true"></div>
              <div class="teacher-landing__cover-glow" aria-hidden="true"></div>
            </div>
            <div class="teacher-landing__profile-card">
              <div class="teacher-landing__profile-header">
                <div class="teacher-landing__profile-avatar">
                  <img
                    v-if="brandAvatarUrl"
                    :src="brandAvatarUrl"
                    :alt="landing.teacher.displayName || landing.teacher.slug"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="high"
                    @error="handleBrandAvatarError"
                  />
                  <span v-else class="teacher-landing__profile-avatar-fallback">
                    {{ brandInitials }}
                  </span>
                </div>
                <div class="teacher-landing__profile-main">
                  <p class="teacher-landing__profile-name">{{ landing.teacher.displayName }}</p>
                  <p v-if="profileHeadline" class="teacher-landing__profile-headline">{{ profileHeadline }}</p>
                </div>
                <div class="teacher-landing__profile-actions">
                  <RouterLink
                    v-if="primaryCtaAction === 'register'"
                    :to="studentRegisterRoute"
                    class="teacher-landing__profile-cta teacher-landing__profile-cta--primary"
                    @click="trackLandingEvent('hero_primary_register')"
                  >
                    {{ primaryCtaText }}
                  </RouterLink>
                  <button
                    v-else-if="primaryCtaAction === 'login'"
                    type="button"
                    class="teacher-landing__profile-cta teacher-landing__profile-cta--primary"
                    @click="onTrackedLoginClick('hero_primary_login')"
                  >
                    {{ primaryCtaText }}
                  </button>
                  <a
                    v-else-if="cta.href"
                    :href="cta.href"
                    class="teacher-landing__profile-cta teacher-landing__profile-cta--primary"
                    @click="handleExploreLessonsClick"
                  >
                    {{ primaryCtaText }}
                  </a>
                  <RouterLink
                    v-if="secondaryCta === 'register'"
                    :to="studentRegisterRoute"
                    class="teacher-landing__profile-cta teacher-landing__profile-cta--ghost"
                    @click="trackLandingEvent('hero_secondary_register')"
                  >
                    {{ t('teacherLanding.navigation.register') }}
                  </RouterLink>
                  <button
                    v-else
                    type="button"
                    class="teacher-landing__profile-cta teacher-landing__profile-cta--ghost"
                    @click="onTrackedLoginClick('hero_secondary_login')"
                  >
                    {{ t('teacherLanding.navigation.login') }}
                  </button>
                </div>
                <div v-if="canEditLanding && teacherLandingUrl" class="teacher-landing__profile-link">
                  <span class="teacher-landing__profile-link-label">{{ t('teacherLanding.share.label') }}</span>
                  <div class="teacher-landing__profile-link-actions">
                    <a
                      :href="teacherLandingUrl"
                      target="_blank"
                      rel="noopener"
                      class="teacher-landing__profile-link-url"
                      :title="teacherLandingUrl"
                    >
                      {{ teacherLandingDisplayHost }}
                    </a>
                    <button
                      type="button"
                      class="teacher-landing__profile-link-copy"
                      :class="{ 'is-copied': copyStatus === 'success' }"
                      @click="copyLandingUrl"
                      :title="copyButtonLabel"
                    >
                      <span class="teacher-landing__profile-link-copy-text">{{ copyButtonLabel }}</span>
                    </button>
                    <details class="teacher-landing__profile-share" @toggle="onShareToggle">
                      <summary
                        class="teacher-landing__profile-share-toggle"
                        :aria-label="t('teacherLanding.share.shareAria')"
                      >
                        {{ t('teacherLanding.share.share') }}
                      </summary>
                      <div class="teacher-landing__profile-share-menu">
                        <a
                          v-for="item in shareLinks"
                          :key="item.id"
                          :href="item.href"
                          target="_blank"
                          rel="noopener"
                          class="teacher-landing__profile-share-link"
                        >
                          {{ item.label }}
                        </a>
                        <button
                          v-if="qrImageSrc"
                          type="button"
                          class="teacher-landing__profile-share-link teacher-landing__profile-share-link--button"
                          @click.prevent="toggleQrPanel"
                        >
                          {{ t('teacherLanding.share.qr') }}
                        </button>
                        <div v-if="qrPanelOpen && qrImageSrc" class="teacher-landing__profile-qr">
                          <img :src="qrImageSrc" :alt="t('teacherLanding.share.qrAlt')" />
                          <span class="teacher-landing__profile-qr-hint">{{ t('teacherLanding.share.qrHint') }}</span>
                        </div>
                      </div>
                    </details>
                    <span class="sr-only" aria-live="polite">{{ copyStatusMessage }}</span>
                  </div>
                </div>
              </div>
              <p v-if="profileBio" class="teacher-landing__profile-bio">{{ profileBio }}</p>
              <ul v-if="heroHighlights.length" class="teacher-landing__profile-highlights">
                <li v-for="(highlight, index) in heroHighlights" :key="`hero-highlight-${index}`">
                  {{ highlight }}
                </li>
              </ul>
              <div v-if="heroStats.length" class="teacher-landing__profile-stats">
                <div v-for="(stat, index) in heroStats" :key="`hero-stat-${index}`" class="teacher-landing__profile-stat">
                  <span class="teacher-landing__profile-stat-value">{{ stat.value }}</span>
                  <span class="teacher-landing__profile-stat-label">{{ stat.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          v-else-if="sectionKey === 'about'"
          id="features"
          class="teacher-landing__section teacher-landing__section--about teacher-landing__section--features"
        >
          <div class="teacher-landing__container teacher-landing__modern-section">
            <div class="teacher-landing__modern-heading">
              <p v-if="aboutSection?.subtitle" class="teacher-landing__modern-kicker">{{ aboutSection?.subtitle }}</p>
              <h2 class="teacher-landing__modern-section-title">
                {{ aboutSection?.title || t('teacherLanding.navigation.about') }}
              </h2>
              <p v-if="aboutSection?.description || profileBio" class="teacher-landing__modern-section-description">
                {{ aboutSection?.description || profileBio }}
              </p>
            </div>
            <div class="teacher-landing__modern-features">
              <article v-for="feature in featuresList" :key="feature.title" class="teacher-landing__modern-feature-card">
                <div class="teacher-landing__modern-feature-icon" aria-hidden="true">{{ feature.icon }}</div>
                <h3 class="teacher-landing__modern-feature-title">{{ feature.title }}</h3>
                <p v-if="feature.description" class="teacher-landing__modern-feature-description">{{ feature.description }}</p>
              </article>
            </div>
          </div>
          <TeacherAbout class="teacher-landing__legacy-block" :teacher="landing.teacher" :section="aboutSection" />
        </section>
        <section
          v-else-if="sectionKey === 'courses'"
          id="courses"
          class="teacher-landing__section teacher-landing__section--panel teacher-landing__section--courses"
        >
          <div class="teacher-landing__container teacher-landing__modern-section teacher-landing__modern-section--center teacher-landing__legacy-block">
            <div class="teacher-landing__modern-heading teacher-landing__modern-heading--center">
              <h2 class="teacher-landing__modern-section-title">{{ t('teacherLanding.navigation.courses') }}</h2>
              <p v-if="heroHighlights.length" class="teacher-landing__modern-section-description">
                {{ heroHighlights[0] }}
              </p>
            </div>
            <div class="teacher-landing__modern-courses">
              <article
                v-for="course in featuredCourses"
                :key="course.id || course.title"
                class="teacher-landing__modern-course-card"
              >
                <div class="teacher-landing__modern-course-media">
                  <img
                    :src="course.image"
                    :alt="course.title"
                    class="teacher-landing__modern-course-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div class="teacher-landing__modern-course-body">
                  <span v-if="course.level" class="teacher-landing__modern-course-level">{{ course.level }}</span>
                  <h3 class="teacher-landing__modern-course-title">{{ course.title }}</h3>
                  <p v-if="course.subtitle" class="teacher-landing__modern-course-subtitle">{{ course.subtitle }}</p>
                  <div class="teacher-landing__modern-course-meta">
                    <span class="teacher-landing__modern-course-stars" aria-hidden="true">*****</span>
                    <span class="teacher-landing__modern-course-rating">({{ course.ratingLabel }})</span>
                  </div>
                  <div class="teacher-landing__modern-course-footer">
                    <div class="teacher-landing__modern-course-price">{{ course.priceLabel }}</div>
                    <button
                      type="button"
                      class="teacher-landing__modern-course-cta"
                      @click="onCourseAnalytics(course.raw)"
                    >
                      {{ primaryCtaText }}
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
          <div class="teacher-landing__panel">
            <TeacherLessonsGrid
              :courses="courses"
              :teacher-slug="landing.teacher.slug"
              :loading="loading"
              @course-click="onCourseAnalytics"
            />
          </div>
        </section>
        <section
          v-else-if="sectionKey === 'contact'"
          id="contact"
          class="teacher-landing__section teacher-landing__section--contact"
        >
          <div class="teacher-landing__container teacher-landing__modern-section teacher-landing__modern-section--center">
            <div class="teacher-landing__modern-heading teacher-landing__modern-heading--center">
              <span class="teacher-landing__badge teacher-landing__badge--soft" style="align-self: center; margin-bottom: 1rem;">{{ t('teacherLanding.contact.badge') }}</span>
              <h2 class="teacher-landing__modern-section-title">{{ contactTitle }}</h2>
              <p class="teacher-landing__modern-section-description">{{ contactSubtitle }}</p>
            </div>
            <div class="teacher-landing__modern-actions" style="justify-content: center;">
                <RouterLink
                  v-if="contactCtaAction === 'register'"
                  :to="studentRegisterRoute"
                  class="teacher-landing__modern-btn teacher-landing__modern-btn--primary"
                  @click="trackLandingEvent('contact_register')"
                >
                  {{ contactCtaText }}
                </RouterLink>
                <button
                  v-else-if="contactCtaAction === 'login'"
                  type="button"
                  class="teacher-landing__modern-btn teacher-landing__modern-btn--primary"
                  @click="onTrackedLoginClick('contact_login')"
                >
                  {{ contactCtaText }}
                </button>
                <a
                  v-else-if="contactCtaAction === 'custom' && contactCtaHref"
                  :href="contactCtaHref"
                  class="teacher-landing__modern-btn teacher-landing__modern-btn--primary"
                  target="_blank"
                  rel="noopener"
                  @click="trackLandingEvent('contact_custom')"
                >
                  {{ contactCtaText }}
                </a>
            </div>
          </div>
        </section>

      </template>
        </div>
      </main>
    </div>
    <footer class="teacher-landing__footer teacher-landing__modern-footer">
      <div class="teacher-landing__container teacher-landing__footer-grid">
        <section class="teacher-landing__footer-brand">
          <div class="teacher-landing__footer-logo">
            <div class="teacher-landing__brand-avatar">
              <img
                v-if="brandAvatarUrl"
                :src="brandAvatarUrl"
                :alt="landing.teacher.displayName || landing.teacher.slug"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                @error="handleBrandAvatarError"
              />
              <span v-else class="teacher-landing__brand-avatar-fallback">
                {{ brandInitials }}
              </span>
            </div>
            <div class="teacher-landing__footer-title-group">
              <h3 class="teacher-landing__footer-title">{{ landing.teacher.displayName }}</h3>
              <p v-if="profileHeadline" class="teacher-landing__footer-subtitle">{{ profileHeadline }}</p>
            </div>
          </div>
          <p class="teacher-landing__footer-text">
            {{ profileBio }}
          </p>
          <form class="teacher-landing__footer-newsletter" @submit.prevent="onNewsletterSubmit">
            <input
              type="email"
              class="teacher-landing__footer-input"
              :placeholder="t('teacherLanding.contact.subtitle')"
              required
            />
            <button type="submit" class="teacher-landing__footer-submit">
              {{ t('teacherLanding.navigation.register') }}
            </button>
          </form>
          <div v-if="footerSocialLinks.length" class="teacher-landing__footer-socials">
            <a
              v-for="item in footerSocialLinks"
              :key="`footer-social-${item.href}`"
              :href="item.href"
              target="_blank"
              rel="noopener"
              class="teacher-landing__footer-social"
              :aria-label="item.label"
            >
              {{ item.short }}
            </a>
          </div>
          <div class="teacher-landing__footer-actions">
            <RouterLink
              :to="studentRegisterRoute"
              class="teacher-landing__footer-cta teacher-landing__footer-cta--primary"
              @click="trackLandingEvent('footer_register')"
            >
              {{ t('teacherLanding.navigation.register') }}
            </RouterLink>
            <button
              type="button"
              class="teacher-landing__footer-cta teacher-landing__footer-cta--ghost"
              @click="onTrackedLoginClick('footer_login')"
            >
              {{ t('teacherLanding.navigation.login') }}
            </button>
          </div>
        </section>
        <section class="teacher-landing__footer-column">
          <h4 class="teacher-landing__footer-heading">{{ t('teacherLanding.navigation.courses') }}</h4>
          <ul class="teacher-landing__footer-list">
            <li v-for="course in featuredCourses" :key="`footer-course-${course.id || course.title}`">
              <a href="#courses" class="teacher-landing__footer-link">{{ course.title }}</a>
            </li>
          </ul>
        </section>
        <section class="teacher-landing__footer-column">
          <h4 class="teacher-landing__footer-heading">{{ t('teacherLanding.navigation.contact') }}</h4>
          <ul class="teacher-landing__footer-list">
            <li><a href="#hero" class="teacher-landing__footer-link">{{ t('teacherLanding.navigation.home') }}</a></li>
            <li><a href="#features" class="teacher-landing__footer-link">{{ t('teacherLanding.navigation.about') }}</a></li>
            <li><a href="#courses" class="teacher-landing__footer-link">{{ t('teacherLanding.navigation.courses') }}</a></li>
            <li v-if="assistantLinkAvailable">
              <RouterLink :to="assistantLoginRoute" class="teacher-landing__footer-link">
                {{ t('teacherLanding.navigation.assistant') }}
              </RouterLink>
            </li>
          </ul>
        </section>
      </div>
      <div class="teacher-landing__copyright">
        © 2026 {{ landing.teacher.displayName }}. {{ t('teacherLanding.meta.suffix') }}
      </div>
    </footer>
    <div v-if="showFloatingActions" class="teacher-landing__floating-actions">
      <RouterLink
        :to="studentRegisterRoute"
        class="teacher-landing__floating-action teacher-landing__floating-action--primary"
        @click="trackLandingEvent('floating_register')"
      >
        {{ t('teacherLanding.navigation.register') }}
      </RouterLink>
      <button
        type="button"
        class="teacher-landing__floating-action"
        @click="onTrackedLoginClick('floating_login')"
      >
        {{ t('teacherLanding.navigation.login') }}
      </button>
    </div>
      </ThemeProvider>
    </div>
  </template>
  <div v-else class="teacher-landing__state">
    <div v-if="loading" class="teacher-landing__loader">{{ t('teacherLanding.states.loading') }}</div>
    <div v-else class="teacher-landing__error">{{ t('teacherLanding.states.error') }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ThemeProvider from '@/components/teacherLanding/ThemeProvider.vue';
import TeacherAbout from '@/components/teacherLanding/TeacherAbout.vue';
import TeacherLessonsGrid from '@/components/teacherLanding/TeacherLessonsGrid.vue';

import { useAuthStore } from '@/stores/auth';
import { useTeacherLandingStore } from '@/stores/teacherLanding';
import { useTenantStore } from '@/stores/tenant';
import { buildTenantUrl } from '@/lib/host';
import { TEACHER_LANDING_DEFAULT_BG } from '@/constants/teacherLandingBackground';
import { LOCALE_STORAGE_KEY, loadLocaleMessages, type SupportedLocale } from '@/plugins/i18n';
import { classifyHost } from '@/utils/tenantHost';
import { withCacheBusting } from '@/utils/cacheBusting';
import type {
  TeacherLandingCourse,
  TeacherLandingPublicResponse,
  TeacherLandingSection,
  TeacherLandingSeo,
  TeacherLandingSocial,
  TeacherLandingTeacherInfo,
  TeacherLandingTestimonial
} from '@/services/teacherLanding.api';

const store = useTeacherLandingStore();
const tenantStore = useTenantStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

const brandAvatarError = ref(false);
const mobileMenuOpen = ref(false);
const copyStatus = ref<'idle' | 'success' | 'error'>('idle');
const copyResetTimer = ref<number | null>(null);
const qrPanelOpen = ref(false);

const hostInfo = computed(() => classifyHost());

const slug = computed(() => {
  const teacherSlug = route.params.teacherSlug as string | undefined;
  if (typeof teacherSlug === 'string' && teacherSlug.trim().length > 0) {
    return teacherSlug.trim();
  }

  const slugParam = route.params.slug as string | undefined;
  if (typeof slugParam === 'string' && slugParam.trim().length > 0) {
    return slugParam.trim();
  }

  const storeSlug = (tenantStore.slug || '').trim();
  if (storeSlug) {
    return storeSlug;
  }

  const hostSlug = (hostInfo.value.tenantSlug || '').trim();
  if (hostSlug) {
    return hostSlug;
  }

  return '';
});

const normalizeLocale = (value: string): SupportedLocale => (value === 'en' ? 'en' : 'ar');

const activeLocale = computed(() => normalizeLocale(locale.value));
const pageDirection = computed(() => (activeLocale.value === 'ar' ? 'rtl' : 'ltr'));

const languageToggleAria = computed(() =>
  activeLocale.value === 'ar'
    ? t('teacherLanding.language.switchToEnglish')
    : t('teacherLanding.language.switchToArabic')
);

const languageToggleShortLabel = computed(() =>
  activeLocale.value === 'ar'
    ? t('teacherLanding.language.shortEnglish')
    : t('teacherLanding.language.shortArabic')
);

const landingSlug = computed(() => {
  return (
    ensureString(store.data?.teacher?.slug, '') ||
    ensureString(slug.value, '')
  );
});

const perTenantLocaleKey = computed(() => {
  const slugValue = landingSlug.value;
  if (!slugValue) {
    return LOCALE_STORAGE_KEY;
  }
  return `${LOCALE_STORAGE_KEY}::teacher-landing::${slugValue.toLowerCase()}`;
});

const persistLocale = (value: SupportedLocale) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(perTenantLocaleKey.value, value);
};

const applyDocumentLanguage = (lang: SupportedLocale) => {
  if (typeof document === 'undefined') {
    return;
  }
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  const body = document.body;
  if (body) {
    body.setAttribute('lang', lang);
    body.setAttribute('dir', dir);
    body.classList.toggle('teacher-landing-body-rtl', dir === 'rtl');
  }
};

const toggleLanguage = async () => {
  const next: SupportedLocale = activeLocale.value === 'ar' ? 'en' : 'ar';
  await loadLocaleMessages(next);
  locale.value = next;
};

const resolvePreferredLocale = (): SupportedLocale | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = window.localStorage.getItem(perTenantLocaleKey.value);
  if (stored) {
    return normalizeLocale(stored);
  }
  const brandingLocale = ensureString(
    (tenantStore.branding?.branding as Record<string, unknown> | undefined)?.defaultLocale as string | undefined,
    ''
  );
  if (brandingLocale) {
    return normalizeLocale(brandingLocale);
  }
  return null;
};

const applyPreferredLocale = async () => {
  const preferred = resolvePreferredLocale();
  if (!preferred || preferred === activeLocale.value) {
    return;
  }
  await loadLocaleMessages(preferred);
  locale.value = preferred;
};

watch(
  activeLocale,
  (value) => {
    persistLocale(value);
    applyDocumentLanguage(value);
  },
  { immediate: true }
);

const studentRegisterRoute = computed(() => ({
  name: 'student-register',
  query: {
    tenant: slug.value
  }
}));

const editLandingRoute = computed(() => ({
  name: 'teacher-landing-content'
}));

const assistantLoginRoute = computed(() => {
  const slugValue = slug.value.trim();
  if (slugValue) {
    return { name: 'assistant-login', query: { tenant: slugValue } };
  }
  return { name: 'assistant-login' };
});

const redirectToStudentLogin = () => {
  const slugValue = slug.value.trim();
  if (!slugValue) {
    return;
  }
  const target = buildTenantUrl(slugValue, '/login');
  window.location.href = target;
};

function onMobileLoginClick() {
  mobileMenuOpen.value = false;
  redirectToStudentLogin();
}

const onTrackedLoginClick = (eventName: string) => {
  trackLandingEvent(eventName);
  redirectToStudentLogin();
};

const assistantLinkAvailable = computed(() => Boolean(slug.value.trim()));

const DEFAULT_COURSES_HASH = '#courses';

const fallbackLanding = computed<TeacherLandingPublicResponse>(() => {
  const heroHighlights = [
    t('teacherLanding.defaults.hero.highlights.interactive'),
    t('teacherLanding.defaults.hero.highlights.mentors'),
    t('teacherLanding.defaults.hero.highlights.projects')
  ].filter(Boolean);

  const heroStats = [
    {
      label: t('teacherLanding.defaults.hero.stats.students.label'),
      value: t('teacherLanding.defaults.hero.stats.students.value')
    },
    {
      label: t('teacherLanding.defaults.hero.stats.sessions.label'),
      value: t('teacherLanding.defaults.hero.stats.sessions.value')
    }
  ].filter((stat) => stat.label && stat.value);

  const aboutHighlights = [
    t('teacherLanding.defaults.about.highlights.curriculum'),
    t('teacherLanding.defaults.about.highlights.support'),
    t('teacherLanding.defaults.about.highlights.outcomes')
  ].filter(Boolean);

  const courses: TeacherLandingCourse[] = [
    {
      id: 'default-lesson-physics',
      type: 'course',
      title: t('teacherLanding.defaults.lessons.physics.title'),
      subtitle: t('teacherLanding.defaults.lessons.physics.subtitle'),
      tags: [
        t('teacherLanding.defaults.lessons.physics.tags.0'),
        t('teacherLanding.defaults.lessons.physics.tags.1')
      ].filter(Boolean)
    },
    {
      id: 'default-lesson-chemistry',
      type: 'course',
      title: t('teacherLanding.defaults.lessons.chemistry.title'),
      subtitle: t('teacherLanding.defaults.lessons.chemistry.subtitle'),
      tags: [
        t('teacherLanding.defaults.lessons.chemistry.tags.0'),
        t('teacherLanding.defaults.lessons.chemistry.tags.1')
      ].filter(Boolean)
    },
    {
      id: 'default-lesson-math',
      type: 'course',
      title: t('teacherLanding.defaults.lessons.math.title'),
      subtitle: t('teacherLanding.defaults.lessons.math.subtitle'),
      tags: [
        t('teacherLanding.defaults.lessons.math.tags.0'),
        t('teacherLanding.defaults.lessons.math.tags.1')
      ].filter(Boolean)
    }
  ].filter((course) => course.title);

  const testimonials: TeacherLandingTestimonial[] = [
    {
      id: 1,
      author: t('teacherLanding.defaults.testimonials.omar.author'),
      quote: t('teacherLanding.defaults.testimonials.omar.quote')
    },
    {
      id: 2,
      author: t('teacherLanding.defaults.testimonials.salma.author'),
      quote: t('teacherLanding.defaults.testimonials.salma.quote')
    }
  ].filter((item) => item.author && item.quote);

  return {
    teacher: {
      id: 0,
      slug: slug.value || 'demo-teacher',
      displayName: t('teacherLanding.defaults.teacherName'),
      headline: t('teacherLanding.defaults.teacherHeadline'),
      bio: t('teacherLanding.defaults.teacherBio'),
      photoUrl: '',
      avatarUrl: '',
      updatedAt: new Date(0).toISOString()
    },
    sections: [
      {
        type: 'hero',
        title: t('teacherLanding.defaults.hero.title'),
        subtitle: t('teacherLanding.defaults.hero.subtitle'),
        description: t('teacherLanding.defaults.hero.description'),
        ctaText: t('teacherLanding.defaults.hero.ctaText'),
        ctaHref: DEFAULT_COURSES_HASH,
        highlights: heroHighlights,
        stats: heroStats
      },
      {
        type: 'about',
        title: t('teacherLanding.defaults.about.title'),
        subtitle: t('teacherLanding.defaults.about.subtitle'),
        description: t('teacherLanding.defaults.about.description'),
        highlights: aboutHighlights
      }
    ],
    courses,
    social: null,
    seo: {
      title: t('teacherLanding.defaults.seo.title'),
      description: t('teacherLanding.defaults.seo.description')
    },
    testimonials
  };
});
const BLOCKED_EXTERNAL_IMAGE_HOSTS = ['facebook.com', 'fbcdn.net'];

function isBlockedExternalImage(candidate: string): boolean {
  try {
    const parsed = new URL(candidate, 'http://localhost');
    const hostname = parsed.hostname.toLowerCase();
    return BLOCKED_EXTERNAL_IMAGE_HOSTS.some((blocked) =>
      hostname === blocked || hostname.endsWith(`.${blocked}`)
    );
  } catch (error) {
    return false;
  }
}

function ensureString(value: string | null | undefined, fallback = ''): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return value;
    }
  }
  return fallback;
}

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || '';

function resolveAssetAgainstApiBase(candidate: string): string {
  if (!candidate) {
    return candidate;
  }

  const normalized = candidate.trim();

  if (
    normalized.startsWith('@/') ||
    normalized.startsWith('src/') ||
    normalized.startsWith('assets/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../')
  ) {
    return normalized;
  }

  if (/^(?:https?:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }

  if (!apiBaseUrl) {
    return normalized;
  }

  try {
    return new URL(normalized, apiBaseUrl).toString();
  } catch (error) {
    console.warn('[TeacherLandingView] unable to resolve asset against API base', error);
    return normalized;
  }
}

function ensureAssetUrl(value: string | null | undefined, fallback = ''): string {
  const candidate = ensureString(value, '').trim();
  if (!candidate) {
    return ensureString(fallback, '').trim();
  }
  if (isBlockedExternalImage(candidate)) {
    return ensureString(fallback, '').trim();
  }

  return resolveAssetAgainstApiBase(candidate);
}

function ensureList(values: Array<string | null | undefined> | undefined, fallback?: string[]): string[] {
  const items = (values ?? [])
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
  if (items.length) {
    return items;
  }
  return fallback ? [...fallback] : [];
}

function ensureStats(
  values: TeacherLandingSection['stats'] | undefined,
  fallback?: TeacherLandingSection['stats']
): TeacherLandingSection['stats'] {
  const stats = (values ?? [])
    .map((stat) => ({
      label: ensureString(stat?.label, ''),
      value: ensureString(stat?.value, '')
    }))
    .filter((stat) => stat.label && stat.value);
  if (stats.length) {
    return stats;
  }
  return fallback ? [...fallback] : [];
}

function hasSectionContent(section: TeacherLandingSection | undefined) {
  if (!section) {
    return false;
  }
  const textFields = [
    section.title,
    section.subtitle,
    section.description,
    section.ctaText,
    section.imageUrl,
    section.quoteAuthor
  ];
  const hasText = textFields.some((field) => typeof field === 'string' && field.trim().length > 0);
  const hasHighlights = section.highlights?.some((item) => typeof item === 'string' && item.trim().length > 0);
  const hasStats = section.stats?.some(
    (stat) =>
      (typeof stat?.label === 'string' && stat.label.trim().length > 0) ||
      (typeof stat?.value === 'string' && stat.value.trim().length > 0)
  );
  return hasText || hasHighlights || hasStats;
}

function normalizeSection(
  section: TeacherLandingSection | undefined,
  fallback?: TeacherLandingSection
): TeacherLandingSection | undefined {
  if (!fallback && !section) {
    return undefined;
  }
  const base = fallback ? { ...fallback } : ({} as TeacherLandingSection);
  if (!section) {
    return {
      ...base,
      highlights: base.highlights ?? [],
      stats: base.stats ?? []
    };
  }
  const normalized: TeacherLandingSection = {
    ...base,
    ...section,
    title: ensureString(section.title, ensureString(base.title, '')),
    subtitle: ensureString(section.subtitle, ensureString(base.subtitle, '')),
    description: ensureString(section.description, ensureString(base.description, '')),
    ctaText: ensureString(section.ctaText, ensureString(base.ctaText, '')),
    ctaHref: ensureString(section.ctaHref, base.ctaHref || '#'),
    imageUrl: ensureAssetUrl(section.imageUrl, ensureAssetUrl(base.imageUrl, '')),
    quoteAuthor: ensureString(section.quoteAuthor, ensureString(base.quoteAuthor, '')),
    highlights: ensureList(section.highlights, base.highlights),
    stats: ensureStats(section.stats, base.stats)
  };
  if (!normalized.type && base.type) {
    normalized.type = base.type;
  }
  return normalized;
}

function normalizeTeacher(
  teacher: TeacherLandingTeacherInfo,
  fallback: TeacherLandingTeacherInfo
): TeacherLandingTeacherInfo {
  return {
    id: teacher?.id ?? fallback.id,
    slug: ensureString(teacher?.slug, fallback.slug),
    displayName: ensureString(teacher?.displayName, fallback.displayName || ''),
    headline: ensureString(teacher?.headline, fallback.headline || ''),
    bio: ensureString(teacher?.bio, fallback.bio || ''),
    photoUrl: ensureAssetUrl(teacher?.photoUrl, ensureAssetUrl(fallback.photoUrl, '')),
    avatarUrl: ensureAssetUrl(teacher?.avatarUrl, ensureAssetUrl(fallback.avatarUrl, '')),
    updatedAt: teacher?.updatedAt ?? fallback.updatedAt ?? null
  };
}

function normalizeSeo(seo?: TeacherLandingSeo | null, fallback?: TeacherLandingSeo | null): TeacherLandingSeo | null {
  if (!seo && !fallback) {
    return null;
  }
  const base = fallback ?? {};
  const title = ensureString(seo?.title, ensureString(base.title, ''));
  const description = ensureString(seo?.description, ensureString(base.description, ''));
  if (!title && !description) {
    return null;
  }
  return { title, description };
}

function normalizeCourses(
  courses: TeacherLandingCourse[] | undefined,
  fallbackCourses: TeacherLandingCourse[]
): TeacherLandingCourse[] {
  const normalized = (courses ?? [])
    .filter((course) => ensureString(course?.title, '').length > 0)
    .map((course) => ({
      ...course,
      currency: course.currency ? course.currency.toUpperCase() : course.currency
    }));
  return normalized.length ? normalized : fallbackCourses;
}



const landing = computed<TeacherLandingPublicResponse>(() => {
  const fallback = fallbackLanding.value;
  const remote = store.data;

  if (!remote) {
    return fallback;
  }

  const remoteSections = remote.sections ?? [];
  const fallbackHero = fallback.sections.find((section) => section.type === 'hero');
  const fallbackAbout = fallback.sections.find((section) => section.type === 'about');
  const remoteHero = remoteSections.find((section) => section?.type === 'hero');
  const remoteAbout = remoteSections.find((section) => section?.type === 'about');

  const normalizedHero =
    (hasSectionContent(remoteHero) ? normalizeSection(remoteHero, fallbackHero) : fallbackHero) ?? fallbackHero;
  const normalizedAbout =
    (hasSectionContent(remoteAbout) ? normalizeSection(remoteAbout, fallbackAbout) : fallbackAbout) ?? fallbackAbout;

  const additionalSections = remoteSections
    .filter((section) => {
      const type = section?.type;
      return type && !['hero', 'about'].includes(type);
    })
    .map((section) => normalizeSection(section))
    .filter((section): section is TeacherLandingSection => Boolean(section));

  return {
    teacher: normalizeTeacher(remote.teacher, fallback.teacher),
    sections: [normalizedHero, normalizedAbout, ...additionalSections].filter(Boolean) as TeacherLandingSection[],
    courses: normalizeCourses(remote.courses, fallback.courses),
    social: remote.social ?? fallback.social,
    seo: normalizeSeo(remote.seo, fallback.seo),
    testimonials: remote.testimonials ?? fallback.testimonials
  };
});

const COURSE_TYPE_SEGMENTS = ['course', 'record', 'live', 'blend', 'cohort', 'bootcamp'];

const courses = computed(() =>
  landing.value.courses.filter((course) => {
    const normalizedType = ensureString(course.type, '').trim().toLowerCase();
    if (!normalizedType) {
      return true;
    }

    if (COURSE_TYPE_SEGMENTS.some((segment) => normalizedType.includes(segment))) {
      return true;
    }

    const tags = Array.isArray(course.tags) ? course.tags : [];
    return tags.some((tag) => {
      const normalizedTag = ensureString(tag as string | null | undefined, '').toLowerCase();
      return COURSE_TYPE_SEGMENTS.some((segment) => normalizedTag.includes(segment));
    });
  })
);

const loading = computed(() => store.loading);

const brandAvatarUrl = computed(() => {
  const candidate =
    landing.value.teacher.photoUrl?.trim() || landing.value.teacher.avatarUrl?.trim() || '';
  if (!candidate || brandAvatarError.value) {
    return '';
  }
  return withCacheBusting(candidate, landing.value.teacher.updatedAt ?? undefined);
});

const brandInitials = computed(() => {
  const source = landing.value.teacher.displayName || landing.value.teacher.slug || '';
  return source
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
    .trim() || '?';
});

watch(
  () => [landing.value.teacher.photoUrl, landing.value.teacher.avatarUrl, landing.value.teacher.updatedAt],
  () => {
    brandAvatarError.value = false;
  }
);

function handleBrandAvatarError() {
  brandAvatarError.value = true;
}

const heroSection = computed<TeacherLandingSection | undefined>(() =>
  landing.value.sections.find((section) => section.type === 'hero')
);
const aboutSection = computed<TeacherLandingSection | undefined>(() =>
  landing.value.sections.find((section) => section.type === 'about')
);
const contactSection = computed<TeacherLandingSection | undefined>(() =>
  landing.value.sections.find((section) => section.type === 'contact')
);

const DEFAULT_SECTION_ORDER = ['hero', 'about', 'courses'];
const sectionOrder = computed(() => {
  const ordered = landing.value.sections
    .map((section) => ensureString(section.type, '').trim().toLowerCase())
    .filter((type) => type.length);
  const unique = Array.from(new Set(ordered));
  return [...unique, ...DEFAULT_SECTION_ORDER.filter((type) => !unique.includes(type))];
});

type HeroCtaAction = 'register' | 'login' | 'custom';
type ContactCtaAction = 'register' | 'login' | 'custom';

const profileHeadline = computed(() =>
  ensureString(
    landing.value.teacher.headline,
    ensureString(heroSection.value?.subtitle, '')
  )
);

const profileBio = computed(() =>
  ensureString(
    landing.value.teacher.bio,
    ensureString(aboutSection.value?.description, ensureString(heroSection.value?.description, ''))
  )
);

const heroTitle = computed(() =>
  ensureString(
    heroSection.value?.title,
    ensureString(landing.value.teacher.displayName, landing.value.teacher.slug)
  )
);

const heroSubtitle = computed(() =>
  ensureString(heroSection.value?.subtitle, ensureString(landing.value.teacher.headline, ''))
);

const heroDescription = computed(() =>
  ensureString(heroSection.value?.description, ensureString(profileBio.value, ''))
);

const heroImageSrc = computed(() => {
  const cover = ensureAssetUrl(heroSection.value?.imageUrl, '');
  if (cover) {
    return withCacheBusting(cover, landing.value.teacher.updatedAt ?? undefined);
  }
  if (brandAvatarUrl.value) {
    return brandAvatarUrl.value;
  }
  return selectedBg.value || '';
});

const contactTitle = computed(() =>
  ensureString(
    contactSection.value?.title,
    t('teacherLanding.contact.title', { name: landing.value.teacher.displayName })
  )
);

const contactSubtitle = computed(() =>
  ensureString(contactSection.value?.subtitle, t('teacherLanding.contact.subtitle'))
);

const contactCtaText = computed(() =>
  ensureString(contactSection.value?.ctaText, t('teacherLanding.contact.register'))
);

const contactCtaAction = computed<ContactCtaAction>(() => {
  const action = ensureString(contactSection.value?.ctaAction, '');
  return action === 'login' || action === 'custom' ? action : 'register';
});

const contactCtaHref = computed(() => ensureString(contactSection.value?.ctaHref, ''));

const heroHighlights = computed(() => {
  const highlights = (heroSection.value?.highlights ?? aboutSection.value?.highlights ?? []) as Array<string | null>;
  return highlights
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length)
    .slice(0, 6);
});

const heroStats = computed(() => {
  const stats = heroSection.value?.stats ?? [];
  return stats
    .map((stat) => ({
      label: stat?.label ? String(stat.label).trim() : '',
      value: stat?.value ? String(stat.value).trim() : ''
    }))
    .filter((stat) => stat.label && stat.value)
    .slice(0, 4);
});

const DEFAULT_FEATURE_ICONS = ['⏱️', '💸', '🎓', '🧑‍🏫', '📚', '🧩'];

const featuresList = computed(() => {
  const highlightSource = aboutSection.value?.highlights ?? heroSection.value?.highlights ?? heroHighlights.value;
  const normalized = (highlightSource ?? [])
    .map((item) => ensureString(item, '').trim())
    .filter((item) => item.length)
    .slice(0, 6);

  if (!normalized.length) {
    return [
      {
        icon: DEFAULT_FEATURE_ICONS[0],
        title: t('teacherLanding.defaults.hero.highlights.interactive'),
        description: t('teacherLanding.defaults.about.highlights.curriculum')
      },
      {
        icon: DEFAULT_FEATURE_ICONS[1],
        title: t('teacherLanding.defaults.hero.highlights.mentors'),
        description: t('teacherLanding.defaults.about.highlights.support')
      },
      {
        icon: DEFAULT_FEATURE_ICONS[2],
        title: t('teacherLanding.defaults.hero.highlights.projects'),
        description: t('teacherLanding.defaults.about.highlights.outcomes')
      }
    ];
  }

  return normalized.map((title, index) => ({
    icon: DEFAULT_FEATURE_ICONS[index % DEFAULT_FEATURE_ICONS.length],
    title,
    description: ''
  }));
});

function formatCoursePrice(course: TeacherLandingCourse): string {
  if (typeof course.price !== 'number' || Number.isNaN(course.price)) {
    return t('teacherLanding.hero.cta');
  }
  const currency = ensureString(course.currency, 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat(activeLocale.value || 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(course.price);
  } catch (error) {
    return `${course.price} ${currency}`;
  }
}

function resolveCourseImage(course: TeacherLandingCourse): string {
  const cover = ensureAssetUrl(course.coverUrl, '');
  if (cover) {
    return cover;
  }
  if (heroImageSrc.value) {
    return heroImageSrc.value;
  }
  return selectedBg.value || '';
}

const featuredCourses = computed(() => {
  const items = courses.value.slice(0, 3);
  if (!items.length) {
    return [] as Array<{
      id: string | null | undefined;
      title: string;
      subtitle: string;
      level: string;
      ratingLabel: string;
      priceLabel: string;
      image: string;
      raw: TeacherLandingCourse;
    }>;
  }

  return items.map((course, index) => ({
    id: course.id,
    title: course.title,
    subtitle: ensureString(course.subtitle, ''),
    level: ensureString(course.type, t('teacherLanding.navigation.courses')),
    ratingLabel: '5.0',
    priceLabel: formatCoursePrice(course),
    image: resolveCourseImage(course),
    raw: course
  }));
});




  
function scrollToSection(hash: string) {
  if (typeof document === 'undefined' || !hash?.startsWith('#')) {
    return false;
  }
  const target = document.querySelector(hash);
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

function routerPushSafe(to: Parameters<typeof router.push>[0]) {
  return router.push(to).catch(() => undefined);
}

function handleExploreLessonsClick(event: Event) {
  const href = cta.value.href;
  if (!href) {
    return;
  }
  trackLandingEvent('hero_primary_custom');
  if (href.startsWith('#')) {
    event.preventDefault();
    if (scrollToSection(href) && typeof window !== 'undefined') {
      const pageTitle = typeof document !== 'undefined' ? document.title : '';
      window.history.replaceState(null, pageTitle, href);
    }
  }
}

const cta = computed(() => ({
  text: heroSection.value?.ctaText,
  href: heroSection.value?.ctaHref || DEFAULT_COURSES_HASH
}));

const primaryCtaText = computed(() =>
  ensureString(cta.value.text, t('teacherLanding.hero.cta'))
);

const primaryCtaAction = computed<HeroCtaAction>(() => {
  const action = heroSection.value?.ctaAction;
  if (action === 'login' || action === 'custom') {
    return action;
  }
  return 'register';
});

const secondaryCta = computed<'register' | 'login'>(() =>
  primaryCtaAction.value === 'login' ? 'register' : 'login'
);

const resolveContactHref = (key: keyof TeacherLandingSocial, rawValue: unknown): string => {
  const candidate = ensureString(rawValue as string | null | undefined, '');
  if (!candidate) {
    return '';
  }

  if (key === 'whatsapp') {
    if (/^https?:\/\//i.test(candidate)) {
      return candidate;
    }
    const digits = candidate.replace(/[^\d]/g, '');
    if (!digits) {
      return '';
    }
    return `https://wa.me/${digits}`;
  }

  return candidate;
};

const contactLinks = computed(() => {
  const social = landing.value.social;
  if (!social) {
    return [] as Array<{ href: string; label: string }>;
  }
  const map: Array<[keyof TeacherLandingSocial, string]> = [
    ['whatsapp', 'teacherLanding.social.whatsapp'],
    ['telegram', 'teacherLanding.social.telegram'],
    ['youtube', 'teacherLanding.social.youtube'],
    ['website', 'teacherLanding.social.website'],
    ['facebook', 'teacherLanding.social.facebook'],
    ['instagram', 'teacherLanding.social.instagram'],
    ['tiktok', 'teacherLanding.social.tiktok']
  ];
  return map
    .map(([key, labelKey]) => {
      const href = resolveContactHref(key, social[key]);
      if (!href) return null;
      return {
        href,
        label: t(labelKey)
      };
    })
    .filter((item): item is { href: string; label: string } => Boolean(item));
});

function getSocialShort(item: { href: string; label: string }): string {
  const label = ensureString(item.label, '').toLowerCase();
  if (label.includes('whatsapp')) return 'WA';
  if (label.includes('telegram')) return 'TG';
  if (label.includes('youtube')) return 'YT';
  if (label.includes('facebook')) return 'FB';
  if (label.includes('instagram')) return 'IG';
  if (label.includes('tiktok')) return 'TT';
  if (label.includes('website')) return 'WB';

  try {
    const hostname = new URL(item.href, 'http://localhost').hostname.toLowerCase();
    if (hostname.includes('wa.me') || hostname.includes('whatsapp')) return 'WA';
    if (hostname.includes('t.me') || hostname.includes('telegram')) return 'TG';
    if (hostname.includes('youtu')) return 'YT';
    if (hostname.includes('facebook')) return 'FB';
    if (hostname.includes('instagram')) return 'IG';
    if (hostname.includes('tiktok')) return 'TT';
  } catch (error) {
    // fall through to default
  }

  return ensureString(item.label, '?').slice(0, 2).toUpperCase();
}

const footerSocialLinks = computed(() => {
  return contactLinks.value.slice(0, 5).map((item) => ({
    ...item,
    short: getSocialShort(item)
  }));
});

function onNewsletterSubmit() {
  trackLandingEvent('footer_newsletter_submit');
  void routerPushSafe(studentRegisterRoute.value);
}

const JSON_LD_SCRIPT_ID = 'teacher-landing-jsonld';

const setMetaElement = (attribute: 'name' | 'property', key: string, content: string) => {
  if (typeof document === 'undefined' || !key) {
    return;
  }
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const removeMetaElement = (attribute: 'name' | 'property', key: string) => {
  if (typeof document === 'undefined') {
    return;
  }
  const element = document.querySelector(`meta[${attribute}="${key}"]`);
  if (element?.parentNode) {
    element.parentNode.removeChild(element);
  }
};

const updateSeoMeta = (value: TeacherLandingPublicResponse) => {
  if (typeof document === 'undefined') {
    return;
  }
  const teacherName = ensureString(value.teacher.displayName, value.teacher.slug);
  const fallbackTitle = teacherName
    ? `${teacherName} - ${t('teacherLanding.meta.suffix')}`
    : t('teacherLanding.meta.suffix');
  const title = ensureString(value.seo?.title, fallbackTitle);
  document.title = title;

  const description = ensureString(
    value.seo?.description,
    ensureString(value.teacher.bio, ensureString(value.teacher.headline, ''))
  );

  if (description) {
    setMetaElement('name', 'description', description);
  } else {
    removeMetaElement('name', 'description');
  }

  if (title) {
    setMetaElement('property', 'og:title', title);
  }
  if (description) {
    setMetaElement('property', 'og:description', description);
  } else {
    removeMetaElement('property', 'og:description');
  }
  setMetaElement('property', 'og:type', 'website');
  setMetaElement('name', 'twitter:card', 'summary_large_image');
  if (typeof window !== 'undefined') {
    setMetaElement('property', 'og:url', `${window.location.origin}${window.location.pathname}`);
  }

  const brandingData = (tenantStore.branding?.branding ?? {}) as Record<string, unknown>;
  const brandingSeo = (brandingData.seo ?? {}) as Record<string, unknown>;
  const valueSeo = (value.seo ?? {}) as Record<string, unknown>;
  const brandingOgImage = ensureString(
    (valueSeo.ogImage as string | undefined) ||
      (valueSeo.image as string | undefined) ||
      (brandingSeo.ogImage as string | undefined) ||
      (brandingSeo.image as string | undefined) ||
      (brandingData.ogImage as string | undefined),
    ''
  );
  const ogImage = ensureString(brandingOgImage, ensureString(brandAvatarUrl.value, ensureString(selectedBg.value, '')));
  if (ogImage) {
    setMetaElement('property', 'og:image', ogImage);
    setMetaElement('name', 'twitter:image', ogImage);
  } else {
    removeMetaElement('property', 'og:image');
    removeMetaElement('name', 'twitter:image');
  }
  if (title) {
    setMetaElement('name', 'twitter:title', title);
  }
  if (description) {
    setMetaElement('name', 'twitter:description', description);
  } else {
    removeMetaElement('name', 'twitter:description');
  }
};

const updateJsonLdMeta = (value: TeacherLandingPublicResponse, courseItems: TeacherLandingCourse[]) => {
  if (typeof document === 'undefined') {
    return;
  }

  const existing = document.getElementById(JSON_LD_SCRIPT_ID) as HTMLScriptElement | null;
  const script = existing ?? document.createElement('script');
  script.type = 'application/ld+json';
  script.id = JSON_LD_SCRIPT_ID;

  const organizationName = ensureString(value.teacher.displayName, value.teacher.slug);
  const description = ensureString(
    value.seo?.description,
    ensureString(value.teacher.bio, ensureString(value.teacher.headline, ''))
  );
  const pageUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const organization: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organizationName || undefined,
    description: description || undefined,
    url: pageUrl || undefined,
    logo: ensureString(brandAvatarUrl.value, '') || undefined
  };

  const social = value.social;
  const sameAs = social
    ? (Object.keys(social) as Array<keyof TeacherLandingSocial>)
        .map((key) => resolveContactHref(key, social[key]))
        .filter((href) => ensureString(href, '').length > 0)
    : [];
  if (sameAs.length > 0) {
    organization.sameAs = sameAs;
  }

  const personName = ensureString(value.teacher.displayName, value.teacher.slug);
  const personDescription = ensureString(value.teacher.bio, value.teacher.headline);
  const personImage = ensureString(value.teacher.photoUrl, value.teacher.avatarUrl ?? '');
  const person: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personName || undefined,
    description: personDescription || undefined,
    jobTitle: ensureString(value.teacher.headline, '') || undefined,
    url: pageUrl || undefined,
    image: personImage || undefined,
    worksFor: organizationName ? { '@type': 'Organization', name: organizationName } : undefined
  };
  if (sameAs.length > 0) {
    person.sameAs = sameAs;
  }

  const courseElements = courseItems
    .filter((course) => ensureString(course?.title, '').length > 0)
    .map((course, index) => ({
      '@type': 'Course',
      name: ensureString(course.title, ''),
      description: ensureString(course.subtitle, ''),
      position: index + 1
    }));

  const payload: Array<Record<string, unknown>> = [organization, person];

  if (courseElements.length > 0) {
    payload.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: organizationName ? `${organizationName} Courses` : undefined,
      itemListElement: courseElements
    });
  }

  script.textContent = JSON.stringify(payload.length === 1 ? payload[0] : payload, null, 2);

  if (!existing) {
    document.head.appendChild(script);
  }
};

const clearJsonLdScript = () => {
  if (typeof document === 'undefined') {
    return;
  }
  const existing = document.getElementById(JSON_LD_SCRIPT_ID);
  existing?.parentNode?.removeChild(existing);
};

async function load() {
  if (!slug.value) {
    return;
  }
  try {
    await store.load(slug.value, { force: true });
  } catch (error) {
    console.warn('[TeacherLandingView] failed to load landing', error);
  }

  try {
    await tenantStore.fetchBranding(slug.value);
    await applyPreferredLocale();
  } catch (error) {
    console.warn('[TeacherLandingView] failed to load tenant branding', error);
  }
}

watch(slug, async (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug) {
    await load();
  }
});

onMounted(async () => {
  await load();
});

const selectedBg = ref<string | null>(TEACHER_LANDING_DEFAULT_BG);
const isHeaderCompact = ref(false);
const showFloatingActions = ref(false);

const landingThemeStyle = computed<Record<string, string>>(() => {
  const colors = (tenantStore.branding?.branding?.colors ?? {}) as Record<string, string>;
  const primary = ensureString(colors.primary, '').trim();
  const secondary = ensureString(colors.secondary, '').trim();
  const accent = ensureString(colors.accent, '').trim();
  const resolvedSecondary = secondary || primary;
  const style: Record<string, string> = {};

  if (primary) {
    style['--teacher-color-primary'] = primary;
  }
  if (resolvedSecondary) {
    style['--teacher-color-secondary'] = resolvedSecondary;
  }
  if (accent) {
    style['--teacher-color-accent'] = accent;
  }
  if (primary || resolvedSecondary) {
    const gradientStart = primary || resolvedSecondary;
    const gradientEnd = resolvedSecondary || primary;
    style['--teacher-gradient'] = `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`;
  }

  return style;
});

const coverImage = computed(() => {
  const candidate = selectedBg.value || '';
  return ensureString(candidate, '');
});

const coverSources = computed(() => {
  const original = coverImage.value;
  if (!original || !/\/original\./i.test(original)) {
    return { lg: '', md: '', sm: '' };
  }
  const buildVariant = (size: string) => original.replace(/\/original\./i, `/${size}.`);
  return {
    lg: buildVariant('1920'),
    md: buildVariant('1440'),
    sm: buildVariant('1024')
  };
});

const coverStyle = computed(() => {
  return {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0))`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };
});

const teacherLandingUrl = computed(() => {
  const slugValue = landingSlug.value;
  if (!slugValue) {
    return '';
  }
  if (typeof window !== 'undefined') {
    const { host, isGlobalAppHost } = hostInfo.value;
    if (host && !isGlobalAppHost) {
      return `${window.location.protocol}//${host}/`;
    }
  }
  return buildTenantUrl(slugValue, '/');
});

const teacherLandingDisplayHost = computed(() => {
  const url = teacherLandingUrl.value;
  if (!url) {
    return '';
  }
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch (error) {
    return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
});

const copyButtonLabel = computed(() => {
  if (copyStatus.value === 'success') {
    return t('teacherLanding.share.copied');
  }
  if (copyStatus.value === 'error') {
    return t('teacherLanding.share.copyFailed');
  }
  return t('teacherLanding.share.copy');
});

const copyStatusMessage = computed(() => {
  if (copyStatus.value === 'success') {
    return t('teacherLanding.share.copied');
  }
  if (copyStatus.value === 'error') {
    return t('teacherLanding.share.copyFailed');
  }
  return '';
});

const clearCopyStatusTimer = () => {
  if (copyResetTimer.value === null) {
    return;
  }
  if (typeof window !== 'undefined') {
    window.clearTimeout(copyResetTimer.value);
  }
  copyResetTimer.value = null;
};

const setCopyStatus = (status: 'success' | 'error') => {
  copyStatus.value = status;
  clearCopyStatusTimer();
  if (typeof window !== 'undefined') {
    copyResetTimer.value = window.setTimeout(() => {
      copyStatus.value = 'idle';
      copyResetTimer.value = null;
    }, 2200);
  }
};

const fallbackCopy = (value: string) => {
  if (typeof document === 'undefined') {
    throw new Error('document unavailable');
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const success = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!success) {
    throw new Error('copy failed');
  }
};

const copyLandingUrl = async () => {
  const url = teacherLandingUrl.value;
  if (!url) {
    return;
  }
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      fallbackCopy(url);
    }
    setCopyStatus('success');
  } catch (error) {
    console.warn('[TeacherLandingView] failed to copy url', error);
    setCopyStatus('error');
  }
};

const qrImageSrc = computed(() => {
  const url = teacherLandingUrl.value;
  if (!url) {
    return '';
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
});

const onShareToggle = (event: Event) => {
  const target = event.target as HTMLDetailsElement | null;
  if (!target?.open) {
    qrPanelOpen.value = false;
  }
};

const toggleQrPanel = () => {
  qrPanelOpen.value = !qrPanelOpen.value;
};

const canEditLanding = computed(() => {
  if (!auth.isTeacherLike) {
    return false;
  }
  const authSlug = ensureString(auth.tenantSlug ?? '', '').toLowerCase();
  const pageSlug = ensureString(landingSlug.value, '').toLowerCase();
  if (!authSlug || !pageSlug) {
    return false;
  }
  return authSlug === pageSlug;
});

const shareMessage = computed(() =>
  t('teacherLanding.share.message', { teacher: landing.value.teacher.displayName || landing.value.teacher.slug })
);

const shareLinks = computed(() => {
  const url = teacherLandingUrl.value;
  if (!url) {
    return [];
  }
  const encodedUrl = encodeURIComponent(url);
  const encodedMessage = encodeURIComponent(shareMessage.value);
  return [
    {
      id: 'whatsapp',
      label: t('teacherLanding.share.whatsapp'),
      href: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`
    },
    {
      id: 'telegram',
      label: t('teacherLanding.share.telegram'),
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`
    },
    {
      id: 'x',
      label: t('teacherLanding.share.x'),
      href: `https://x.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`
    }
  ];
});

function resolveBackgroundAsset(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const candidate = raw.trim();
  if (!candidate) {
    return null;
  }

  if (isBlockedExternalImage(candidate)) {
    return null;
  }

  if (/^(?:https?:)?\/\//i.test(candidate) || candidate.startsWith('data:') || candidate.startsWith('blob:')) {
    return candidate;
  }

  if (candidate.startsWith('/')) {
    return candidate;
  }

  const withoutAlias = candidate
    .replace(/^@\/assets\//, '')
    .replace(/^src\/assets\//, '')
    .replace(/^assets\//, '')
    .replace(/^\.\//, '');

  if (!withoutAlias) {
    return null;
  }

  try {
    return new URL(`../../assets/${withoutAlias}`, import.meta.url).href;
  } catch (error) {
    console.warn(`[TeacherLandingView] unable to resolve background image "${candidate}"`, error);
    return null;
  }
}

watch(
  () => landing.value,
  (value) => {
    updateSeoMeta(value);
  },
  { immediate: true }
);

watch(
  () => [landing.value, courses.value] as const,
  ([landingValue, courseItems]) => {
    updateJsonLdMeta(landingValue, courseItems);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearJsonLdScript();
});

onBeforeUnmount(() => {
  clearCopyStatusTimer();
});

watch(
  () => activeLocale.value,
  () => {
    updateSeoMeta(landing.value);
    updateJsonLdMeta(landing.value, courses.value);
  }
);

watch(
  () => brandAvatarError.value,
  () => {
    updateSeoMeta(landing.value);
    updateJsonLdMeta(landing.value, courses.value);
  }
);

watch(
  () => heroSection.value?.imageUrl,
  (imageUrl) => {
    const resolved = resolveBackgroundAsset(imageUrl);
    selectedBg.value = resolved ?? TEACHER_LANDING_DEFAULT_BG;
    updateSeoMeta(landing.value);
    updateJsonLdMeta(landing.value, courses.value);
  },
  { immediate: true }
);

const floatingContact = computed(() => {
  const order: Array<keyof TeacherLandingSocial> = ['whatsapp', 'telegram', 'website', 'facebook', 'instagram'];
  const social = landing.value.social;
  if (!social) return null;
  for (const key of order) {
    const href = resolveContactHref(key, social[key]);
    if (href) {
      return {
        href,
        label: t(`teacherLanding.social.${key}`)
      };
    }
  }
  return null;
});

const onCourseAnalytics = (course: TeacherLandingCourse) => {
  trackLandingEvent('course_click', {
    id: ensureString(course?.id, ''),
    title: ensureString(course?.title, '')
  });

  const courseId = ensureString(course?.id, '');
  const teacherSlug = ensureString(landing.value.teacher.slug, '');
  if (!courseId || !teacherSlug) {
    return;
  }

  void routerPushSafe({
    name: 'public-course-detail',
    params: {
      slug: teacherSlug,
      courseId
    }
  });
};

const trackLandingEvent = (eventName: string, payload: Record<string, string> = {}) => {
  if (typeof window === 'undefined') {
    return;
  }
  const dataLayer = (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({ event: eventName, ...payload });
  }
};

const handleScroll = () => {
  if (typeof window === 'undefined') {
    return;
  }
  isHeaderCompact.value = window.scrollY > 24;
  showFloatingActions.value = window.scrollY > 320;
};

onMounted(() => {
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});

</script>

<style scoped>
.teacher-landing__background {
  position: fixed;
  inset: 0;
  /* primary background image comes from the CSS variable (set by the component) */
  background-image:
    linear-gradient(180deg, rgba(15, 23, 42, 0.02) 0%, transparent 60%),
    radial-gradient(circle at 14% 12%, color-mix(in srgb, var(--teacher-color-primary) 12%, transparent), transparent 52%),
    radial-gradient(circle at 86% 10%, color-mix(in srgb, var(--teacher-color-secondary) 12%, transparent), transparent 56%),
    radial-gradient(circle at 28% 85%, color-mix(in srgb, var(--teacher-color-accent) 10%, transparent), transparent 60%),
    #f4f5fe;
  /* temporarily set to 0 to ensure visibility while debugging stacking contexts */
  z-index: 0;
}

.teacher-landing__background::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(90deg, rgba(15, 23, 42, 0.02) 0.5px, transparent 0.5px),
    linear-gradient(180deg, rgba(15, 23, 42, 0.02) 0.5px, transparent 0.5px),
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.5), transparent 55%),
    radial-gradient(circle at 80% 60%, rgba(255, 255, 255, 0.35), transparent 60%);
  background-size: 26px 26px, 26px 26px, auto, auto;
  opacity: 0.45;
  pointer-events: none;
}

.teacher-landing__halo {
  position: fixed;
  border-radius: 999px;
  filter: blur(80px);
  opacity: 0.4;
  z-index: -2;
}

.teacher-landing__halo--one {
  width: 28rem;
  height: 28rem;
  top: -12rem;
  right: -8rem;
  background: radial-gradient(circle, color-mix(in srgb, var(--teacher-color-primary) 45%, transparent), transparent 65%);
}

.teacher-landing__halo--two {
  width: 22rem;
  height: 22rem;
  bottom: 10vh;
  left: -6rem;
  background: radial-gradient(circle, color-mix(in srgb, var(--teacher-color-secondary) 40%, transparent), transparent 60%);
}

.teacher-landing__halo--three {
  width: 18rem;
  height: 18rem;
  top: 28vh;
  right: 12vw;
  background: radial-gradient(circle, color-mix(in srgb, var(--teacher-color-accent) 32%, transparent), transparent 70%);
}

.teacher-landing__wrapper {
  position: relative;
  min-height: 100vh;
  font-family: var(--sakai-font-family-base);
  color: var(--teacher-color-text-primary, #0f172a);
  --teacher-surface: rgba(255, 255, 255, 0.95);
  --teacher-surface-strong: rgba(255, 255, 255, 0.98);
  --teacher-border: rgba(15, 23, 42, 0.08);
  --teacher-shadow: 0 4px 16px rgba(4, 6, 24, 0.08);
}

.teacher-landing__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2rem;
  max-width: 1320px;
  margin: 0 auto;
  padding: clamp(1.5rem, 3vw, 2rem) clamp(1.25rem, 3vw, 2rem) clamp(3rem, 6vw, 4rem);
  align-items: start;
}

.teacher-landing__content {
  min-width: 0;
}

[dir='rtl'] .teacher-landing__content {
  order: 1;
}

.teacher-landing__header,
.teacher-landing {
  --teacher-header-height: clamp(4rem, 8vw, 4.75rem);

}

.teacher-landing__header {
  position: sticky;
  top: 0;
  z-index: 30;
  /* make header slightly transparent so hero art can be visible */
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--teacher-border);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  min-height: var(--teacher-header-height);

}

.teacher-landing__header--compact {
  --teacher-header-height: 3.5rem;
}

.teacher-landing__header-inner {
  max-width: 1320px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem clamp(1.25rem, 3vw, 2rem);
}

.teacher-landing__header--compact .teacher-landing__header-inner {
  padding: 0.6rem clamp(1.25rem, 3vw, 2rem);
}

.teacher-landing__header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.teacher-landing__edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.95rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: var(--teacher-color-text-primary, #0f172a);
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(15, 23, 42, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.teacher-landing__edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.12);
}

.teacher-landing__edit:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.2);
}

.teacher-landing__language {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.25);
  background: rgba(241, 245, 249, 0.85);
  color: var(--teacher-color-primary, #2563eb);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.teacher-landing__language:hover,
.teacher-landing__language:focus-visible {
  background: rgba(37, 99, 235, 0.18);
  color: var(--teacher-color-primary, #1d4ed8);
  outline: none;
  box-shadow: 0 0 0 3px rgba(191, 219, 254, 0.55);
}

.teacher-landing__brand {
  display: grid;
  gap: 0.15rem;
  align-items: center;
  grid-template-columns: auto 1fr;
}

.teacher-landing__brand-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.85rem;
  margin-right: 0.75rem;
  background: linear-gradient(135deg, var(--teacher-color-primary, #2563eb), var(--teacher-color-secondary, #0ea5e9));
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.35);
  overflow: hidden;
  position: relative;
  grid-row: span 2;
}

.teacher-landing__header--compact .teacher-landing__brand-avatar {
  width: 2.1rem;
  height: 2.1rem;
  margin-right: 0.6rem;
  border-radius: 0.7rem;
}

.teacher-landing__brand-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.teacher-landing__brand-avatar-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
  text-transform: uppercase;
}

.teacher-landing__brand-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--teacher-color-text-primary, #1f2937);
  grid-column: 2;

}

.teacher-landing__header--compact .teacher-landing__brand-name {
  font-size: 1rem;
}

.teacher-landing__brand-tagline {
  font-size: 0.9rem;
  color: var(--teacher-color-text-secondary, #64748b);
  grid-column: 2;
}

.teacher-landing__header--compact .teacher-landing__brand-tagline {
  font-size: 0.8rem;
}
.teacher-landing__nav {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.35rem;
  border-radius: 999px;
  background: rgba(241, 245, 249, 0.75);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);

}

.teacher-landing__header--compact .teacher-landing__nav-link {
  padding: 0.45rem 0.95rem;
  font-size: 0.9rem;
}

.teacher-landing__nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.55rem 1.2rem;

  border-radius: 999px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  color: var(--teacher-color-text-primary, #111827);
  transition: color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

}

.teacher-landing__nav-link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.9);
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: -1;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.teacher-landing__nav-link:hover {
  color: var(--teacher-color-primary, #2563eb);
  transform: translateY(-1px);
}

.teacher-landing__nav-link:hover::after {
  opacity: 1;
}

.teacher-landing__nav-link:focus-visible {
  outline: none;
  color: var(--teacher-color-primary, #2563eb);
  transform: translateY(-1px);
}

.teacher-landing__nav-link:focus-visible::after {

  opacity: 1;
}

.teacher-landing__nav-link--cta {
  background: linear-gradient(135deg, var(--teacher-color-primary, #2563eb), var(--teacher-color-secondary, #0ea5e9));
  color: #fff;
  border-radius: 0.9rem;
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.22);
}

.teacher-landing__nav-link--cta::after {
  display: none;
}

.teacher-landing__nav-link--cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.3);
}

.teacher-landing__nav-link--cta:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.7), 0 0 0 6px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);

}

.teacher-landing__nav-link--ghost {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.4);
  color: var(--teacher-color-text-primary, #111827);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.teacher-landing__nav-link--ghost::after {
  background: rgba(255, 255, 255, 0.95);
}

.teacher-landing__nav-link--ghost:hover {
  color: var(--teacher-color-primary, #2563eb);
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.12);
}

.teacher-landing__nav-link--ghost:focus-visible {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.35);
}

.teacher-landing {
  position: relative;
  display: grid;
  gap: clamp(2rem, 5vw, 4rem);
  padding: 0;
  max-width: 100%;
  margin: 0;
  font-family: inherit; /* inherit Poppins from ThemeProvider */
}

.teacher-landing__section {
  position: relative;
  display: grid;
  gap: 1.5rem;
  scroll-margin-top: calc(var(--teacher-header-height) + 1rem);

}

.teacher-landing__section--hero {
  padding: 0;
}

.teacher-landing__hero-shell {
  display: grid;
  gap: 0;
}

.teacher-landing__cover {
  height: clamp(10rem, 30vw, 18rem);
  border-radius: 2.2rem;
  overflow: hidden;
  position: relative;
  box-shadow: 0 1.5rem 3.5rem rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.teacher-landing__cover-picture {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.teacher-landing__cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.teacher-landing__cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.35), transparent 65%);
  z-index: 1;
}

.teacher-landing__cover-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.35), transparent 55%);
  mix-blend-mode: screen;
  z-index: 2;
}

.teacher-landing__profile-card {
  background: var(--teacher-surface-strong);
  border-radius: 1.6rem;
  padding: clamp(1.75rem, 4vw, 2.5rem);
  box-shadow: var(--teacher-shadow);
  border: 1px solid var(--teacher-border);
  margin-top: clamp(-4rem, -10vw, -3rem);
  backdrop-filter: blur(6px);
}

.teacher-landing__profile-header {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  align-items: center;
}

.teacher-landing__profile-avatar {
  width: clamp(4.5rem, 10vw, 5.75rem);
  height: clamp(4.5rem, 10vw, 5.75rem);
  border-radius: 1.5rem;
  background: linear-gradient(135deg, var(--teacher-color-primary, #2563eb), var(--teacher-color-secondary, #0ea5e9));
  display: grid;
  place-items: center;
  overflow: hidden;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.28);
  position: relative;
}

.teacher-landing__profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.teacher-landing__profile-avatar-fallback {
  color: #fff;
  font-weight: 700;
  font-size: 1.4rem;
  text-transform: uppercase;
}

.teacher-landing__profile-main {
  display: grid;
  gap: 0.35rem;
}

.teacher-landing__profile-name {
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2rem);
  font-weight: 700;
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__profile-headline {
  margin: 0;
  color: var(--teacher-color-text-secondary, #475569);
  font-size: 1rem;
}

.teacher-landing__profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-self: end;
  grid-column: 2;
}

.teacher-landing__profile-link {
  margin-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--teacher-color-text-secondary, #475569);
  font-size: 0.85rem;
  grid-column: 2;
}

.teacher-landing__profile-link-label {
  font-weight: 600;
  letter-spacing: 0.01em;
}

.teacher-landing__profile-link-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.teacher-landing__profile-link-url {
  font-weight: 600;
  color: var(--teacher-color-primary, #2563eb);
  text-decoration: none;
  padding: 0.4rem 0.65rem;
  border-radius: 0.8rem;
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 10%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--teacher-color-primary, #2563eb) 18%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.teacher-landing__profile-link-url:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px color-mix(in srgb, var(--teacher-color-primary, #2563eb) 12%, transparent);
}

.teacher-landing__profile-link-copy {
  border: none;
  background: var(--teacher-gradient, linear-gradient(135deg, #2563eb, #0ea5e9));
  color: #fff;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.teacher-landing__profile-link-copy:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px color-mix(in srgb, var(--teacher-color-primary, #2563eb) 20%, transparent);
}

.teacher-landing__profile-link-copy.is-copied {
  background: linear-gradient(135deg, #16a34a, #22c55e);
}

.teacher-landing__profile-link-copy:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--teacher-color-primary, #2563eb) 55%, transparent);
  outline-offset: 2px;
}

.teacher-landing__profile-share {
  position: relative;
}

.teacher-landing__profile-share-toggle {
  border: 1px solid color-mix(in srgb, var(--teacher-color-primary, #2563eb) 20%, transparent);
  background: rgba(255, 255, 255, 0.85);
  color: var(--teacher-color-primary, #2563eb);
  border-radius: 999px;
  padding: 0.45rem 0.95rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
  list-style: none;
}

.teacher-landing__profile-share-toggle::-webkit-details-marker {
  display: none;
}

.teacher-landing__profile-share-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 20px color-mix(in srgb, var(--teacher-color-primary, #2563eb) 16%, transparent);
}

.teacher-landing__profile-share-toggle:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--teacher-color-primary, #2563eb) 55%, transparent);
  outline-offset: 2px;
}

.teacher-landing__profile-share-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  inset-inline-start: 0;
  display: grid;
  gap: 0.35rem;
  padding: 0.6rem;
  min-width: 180px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 18px 28px rgba(15, 23, 42, 0.12);
  z-index: 10;
}

.teacher-landing__profile-share-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.65rem;
  border-radius: 0.75rem;
  color: var(--teacher-color-text-primary, #0f172a);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.teacher-landing__profile-share-link--button {
  border: none;
  background: transparent;
  cursor: pointer;
}

.teacher-landing__profile-share-link:hover,
.teacher-landing__profile-share-link:focus-visible {
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 12%, transparent);
  color: var(--teacher-color-primary, #2563eb);
  transform: translateY(-1px);
}

.teacher-landing__profile-qr {
  display: grid;
  justify-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.5rem 0.2rem;
}

.teacher-landing__profile-qr img {
  width: 160px;
  height: 160px;
  border-radius: 0.75rem;
  background: #fff;
  padding: 0.35rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.teacher-landing__profile-qr-hint {
  font-size: 0.75rem;
  color: var(--teacher-color-text-secondary, #64748b);
  text-align: center;
}

.teacher-landing__profile-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.teacher-landing__profile-cta--primary {
  background: var(--teacher-color-primary, #2563eb);
  color: #fff;
  box-shadow: 0 1rem 2rem rgba(37, 99, 235, 0.2);
}

.teacher-landing__profile-cta--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 1.25rem 2.5rem rgba(37, 99, 235, 0.25);
}

.teacher-landing__profile-cta--ghost {
  border: 1px solid rgba(37, 99, 235, 0.2);
  color: var(--teacher-color-primary, #2563eb);
  background: rgba(255, 255, 255, 0.8);
}

.teacher-landing__profile-cta--ghost:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 1);
}

.teacher-landing__profile-bio {
  margin: 1.25rem 0 0;
  color: var(--teacher-color-text-secondary, #475569);
  line-height: 1.7;
}

.teacher-landing__profile-highlights {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.teacher-landing__profile-highlights li {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--teacher-color-primary, #2563eb);
  font-weight: 600;
  font-size: 0.85rem;
}

.teacher-landing__profile-stats {
  margin-top: 1.75rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.teacher-landing__profile-stat {
  background: rgba(15, 23, 42, 0.03);
  border-radius: 1rem;
  padding: 0.85rem 1rem;
  display: grid;
  gap: 0.25rem;
}

.teacher-landing__profile-stat-value {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__profile-stat-label {
  font-size: 0.85rem;
  color: var(--teacher-color-text-secondary, #64748b);
}

.teacher-landing__section--card {
  background: var(--teacher-surface-strong);
  border-radius: 1.75rem;
  padding: clamp(2rem, 4vw, 3rem);
  box-shadow: var(--teacher-shadow);
  border: 1px solid var(--teacher-border);
  overflow: hidden;
}

.teacher-landing__section--card::before {
  content: '';
  position: absolute;
  inset: -40% 10% auto 10%;
  height: 65%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 65%);
  filter: blur(20px);
  opacity: 0.75;
  pointer-events: none;
}

.teacher-landing__section--panel {
  padding: clamp(1.5rem, 4vw, 2.5rem);
}

.teacher-landing__panel {
  background: var(--teacher-surface);
  border-radius: 2rem;
  border: 1px solid var(--teacher-border);
  overflow: hidden;
  box-shadow: var(--teacher-shadow);
  position: relative;
  isolation: isolate;
}

.teacher-landing__panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(59, 130, 246, 0.08), transparent 45%);
  z-index: -1;
}

.teacher-landing__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--teacher-color-primary, #1d4ed8);
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 12%, #ffffff);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.teacher-landing__badge--soft {
  color: var(--teacher-color-secondary, #0f766e);
  background: rgba(15, 118, 110, 0.12);
}

.teacher-landing__section--contact {
  display: none !important;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(14, 116, 144, 0.08));
  border-radius: 2rem;
  padding: clamp(2.5rem, 4vw, 3.25rem);
  border: 1px solid color-mix(in srgb, var(--teacher-color-primary, #2563eb) 18%, transparent);
  box-shadow: 0 1.5rem 3rem rgba(37, 99, 235, 0.08);
  position: relative;
  overflow: hidden;
}

.teacher-landing__section--contact::before,
.teacher-landing__section--contact::after {
  content: '';
  position: absolute;
  width: clamp(12rem, 30vw, 18rem);
  height: clamp(12rem, 32vw, 18rem);
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.5;
  pointer-events: none;
}

.teacher-landing__section--contact::before {
  top: -25%;
  right: -15%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent 60%);
}

.teacher-landing__section--contact::after {
  bottom: -35%;
  left: -10%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.35), transparent 60%);
}

.teacher-landing__contact {
  display: grid;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  align-items: start;
}

.teacher-landing__contact-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.5rem);
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__contact-subtitle {
  margin: 0.75rem 0 0;
  font-size: 1rem;
  color: var(--teacher-color-text-secondary, #475569);
  line-height: 1.6;
}

.teacher-landing__contact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.teacher-landing__contact-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9rem 1.8rem;
  border-radius: 0.9rem;
  background: var(--teacher-color-primary, #2563eb);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 1.25rem 2.6rem rgba(37, 99, 235, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.teacher-landing__contact-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 1.75rem 3.5rem rgba(37, 99, 235, 0.25);
}

.teacher-landing__contact-cta:focus-visible {
  outline: none;
  transform: translateY(-1px);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.75), 0 0 0 6px rgba(37, 99, 235, 0.35);
}


.teacher-landing__contact-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  color: var(--teacher-color-primary, #1d4ed8);
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(37, 99, 235, 0.24);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.teacher-landing__contact-secondary:hover {
  background: rgba(255, 255, 255, 0.75);
  transform: translateY(-2px);
}

.teacher-landing__contact-secondary:focus-visible {
  outline: none;
  background: rgba(255, 255, 255, 0.85);
  transform: translateY(-1px);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.75), 0 0 0 6px rgba(37, 99, 235, 0.25);
}

.teacher-landing__contact-links {
  list-style: none;
  padding: 1.5rem;
  margin: 0;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: grid;
  gap: 1rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.teacher-landing__contact-link {
  display: grid;
  gap: 0.3rem;
  text-decoration: none;
  color: inherit;
  position: relative;
  padding: 0.75rem 1.5rem 0.75rem 0;
  border-radius: 0.9rem;
  transition: color 0.2s ease, box-shadow 0.2s ease;
}

.teacher-landing__contact-link-label {
  font-weight: 700;
  color: var(--teacher-color-text-primary, #0f172a);
}

.teacher-landing__contact-link-url {
  font-size: 0.85rem;
  color: var(--teacher-color-text-secondary, #475569);
  word-break: break-all;
}

.teacher-landing__contact-link::after {
  content: '->';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  color: var(--teacher-color-primary, #2563eb);
}

.teacher-landing__contact-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.28);
}

.teacher-landing__floating-contact {
  position: fixed;
  bottom: clamp(1.5rem, 4vw, 2.5rem);
  right: clamp(1.25rem, 4vw, 2.25rem);
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  background: #fff;
  color: #16a34a;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.18);
  z-index: 40;
}

.teacher-landing__floating-actions {
  position: fixed;
  bottom: clamp(1.25rem, 4vw, 2.4rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.18);
  z-index: 39;
  flex-wrap: wrap;
  justify-content: center;
}

.teacher-landing__floating-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.2);
  background: rgba(255, 255, 255, 0.7);
  color: var(--teacher-color-primary, #2563eb);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.teacher-landing__floating-action:hover,
.teacher-landing__floating-action:focus-visible {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.95);
}

.teacher-landing__floating-action--primary {
  background: var(--teacher-color-primary, #2563eb);
  color: #fff;
  border-color: transparent;
}

.teacher-landing__floating-action--ghost {
  border-color: rgba(15, 118, 110, 0.25);
  color: var(--teacher-color-secondary, #0f766e);
}

.teacher-landing__floating-contact-icon {
  width: 1.6rem;
  height: 1.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.teacher-landing__floating-contact-icon svg {
  width: 1.4rem;
  height: 1.4rem;
}

.teacher-landing__floating-contact-label {
  font-size: 0.95rem;
}

.teacher-landing__floating-contact-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
}

[dir='rtl'] .teacher-landing__floating-contact {
  right: auto;
  left: clamp(1.25rem, 4vw, 2.25rem);
}

[dir='rtl'] .teacher-landing__floating-actions {
  left: 50%;
  transform: translateX(-50%);
}

.teacher-landing__state {
  min-height: 60vh;
  display: grid;
  place-items: center;
  color: var(--teacher-color-text-secondary, #6b7280);
  font-size: 1.1rem;
}

.teacher-landing__loader {
  animation: pulse 1.2s ease-in-out infinite;
}

.teacher-landing__hamburger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  padding: 0;
  border: none;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 12%, transparent);
  color: var(--teacher-color-primary, #2563eb);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.teacher-landing__hamburger:hover,
.teacher-landing__hamburger:focus-visible {
  background: color-mix(in srgb, var(--teacher-color-primary, #2563eb) 20%, transparent);
}

.teacher-landing__hamburger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--teacher-color-primary, #2563eb);
}

.teacher-landing__hamburger-icon {
  display: block;
  line-height: 0;
}

.teacher-landing__drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}

.teacher-landing__drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 9999;
  width: min(320px, 85vw);
  padding: 1.5rem;
  background: var(--teacher-color-surface, #fff);
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
  overflow-y: auto;
}

.teacher-landing__drawer--rtl {
  right: auto;
  left: 0;
  box-shadow: 8px 0 24px rgba(0, 0, 0, 0.12);
}

.teacher-landing__drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 2rem;
}

.teacher-landing__drawer-nav .teacher-landing__nav-link {
  display: flex;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
}

.teacher-landing-drawer-backdrop-enter-active,
.teacher-landing-drawer-backdrop-leave-active {
  transition: opacity 0.2s ease;
}

.teacher-landing-drawer-backdrop-enter-from,
.teacher-landing-drawer-backdrop-leave-to {
  opacity: 0;
}

.teacher-landing-drawer-panel-enter-active,
.teacher-landing-drawer-panel-leave-active {
  transition: transform 0.25s ease;
}

.teacher-landing-drawer-panel-enter-from,
.teacher-landing-drawer-panel-leave-to {
  transform: translateX(100%);
}

.teacher-landing-drawer-panel-rtl-enter-active,
.teacher-landing-drawer-panel-rtl-leave-active {
  transition: transform 0.25s ease;
}

.teacher-landing-drawer-panel-rtl-enter-from,
.teacher-landing-drawer-panel-rtl-leave-to {
  transform: translateX(-100%);
}

@media (max-width: 1024px) {
  .teacher-landing__layout {
    padding: clamp(1.25rem, 4vw, 2rem);
  }
}

@media (max-width: 768px) {
  .teacher-landing__nav--desktop {
    display: none;
  }

  .teacher-landing__hamburger {
    display: flex;
  }

  .teacher-landing__header-inner {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .teacher-landing__header-actions {
    width: auto;
    margin-left: auto;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 0.5rem;
  }

  .teacher-landing__language {
    width: 3rem;
    height: 3rem;
  }

  .teacher-landing {
    padding: 0;
  }

  .teacher-landing__section--card {
    padding: 1.75rem;
  }

  .teacher-landing__brand-icon {
    margin-right: 0.5rem;
  }

  .teacher-landing__cover {
    border-radius: 1.6rem;
  }

  .teacher-landing__profile-card {
    margin-top: -2.5rem;
  }

  .teacher-landing__profile-header {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .teacher-landing__profile-actions {
    justify-self: start;
    grid-column: 1;
  }

  .teacher-landing__profile-link {
    grid-column: 1;
  }

  .teacher-landing__floating-contact-label {
    display: none;
  }

  .teacher-landing__floating-contact {
    padding: 0.7rem;
  }
}

@media (prefers-reduced-motion: no-preference) {
  :global(html) {
    scroll-behavior: smooth;
  }
}

@media (prefers-reduced-motion: reduce) {
  :global(html) {
    scroll-behavior: auto;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

/* Modern Coursespace-style overrides */
.teacher-landing__wrapper {
  --modern-primary: #2563eb;
  --modern-dark: #1a1a1a;
  --modern-light: #f8f9fa;
  --modern-orange: #ff6b35;
  --modern-gray: #6c757d;
  background: white;
  color: #222;
}

.teacher-landing__container {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 0 24px;
}

.teacher-landing__header {
  position: sticky;
  top: 0;
  z-index: 120;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.06);
}

.teacher-landing__header-inner {
  min-height: 76px;
}

.teacher-landing__brand {
  gap: 0.75rem;
}

.teacher-landing__brand-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--modern-dark);
}

.teacher-landing__brand-tagline {
  color: var(--modern-gray);
}

.teacher-landing__nav-link {
  font-weight: 600;
  color: var(--modern-dark);
}

.teacher-landing__nav-link::after {
  background: var(--modern-primary);
}

.teacher-landing__nav-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.4rem;
  border-radius: 999px;
  font-weight: 700;
  border: 2px solid transparent;
  transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
}

.teacher-landing__nav-cta--primary {
  background: var(--modern-primary);
  color: white;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
}

.teacher-landing__nav-cta--ghost {
  border-color: var(--modern-primary);
  color: var(--modern-primary);
  background: transparent;
}

.teacher-landing__nav-cta:hover,
.teacher-landing__nav-cta:focus-visible {
  transform: translateY(-1px);
}

.teacher-landing__share-copy {
  padding: 0.68rem 1.1rem;
  border-radius: 999px;
  border: 2px dashed rgba(37, 99, 235, 0.45);
  background: white;
  color: var(--modern-primary);
  font-weight: 800;
}

.teacher-landing__share-copy.is-copied {
  border-style: solid;
  background: rgba(37, 99, 235, 0.12);
}

.teacher-landing__section--hero {
  padding: 110px 0 90px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.teacher-landing__modern-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 64px;
  align-items: center;
}

.teacher-landing__modern-kicker {
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--modern-primary);
  margin-bottom: 1rem;
}

.teacher-landing__modern-title {
  font-size: clamp(2.6rem, 4.8vw, 3.9rem);
  line-height: 1.05;
  margin: 0 0 1.2rem;
  color: var(--modern-dark);
  position: relative;
}

.teacher-landing__modern-underline {
  display: inline-block;
  width: 128px;
  height: 6px;
  border-radius: 4px;
  background: var(--modern-primary);
  vertical-align: middle;
  margin-left: 10px;
}

.teacher-landing__modern-description {
  font-size: 1.1rem;
  color: #4b5563;
  max-width: 56ch;
  margin-bottom: 2.2rem;
}

.teacher-landing__modern-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2.8rem;
}

.teacher-landing__modern-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.95rem 2.1rem;
  border-radius: 999px;
  font-size: 1.05rem;
  font-weight: 800;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, color 180ms ease;
}

.teacher-landing__modern-btn--primary {
  background: var(--modern-primary);
  color: white;
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.22);
}

.teacher-landing__modern-btn--outline {
  background: transparent;
  border-color: var(--modern-primary);
  color: var(--modern-primary);
}

.teacher-landing__modern-btn:hover,
.teacher-landing__modern-btn:focus-visible {
  transform: translateY(-2px);
}

.teacher-landing__modern-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 2.4rem;
}

.teacher-landing__modern-stat-number {
  font-size: 2.6rem;
  font-weight: 900;
  color: var(--modern-primary);
  line-height: 1;
}

.teacher-landing__modern-stat-label {
  margin-top: 0.35rem;
  color: var(--modern-gray);
  font-weight: 600;
}

.teacher-landing__modern-hero-media {
  position: relative;
}

.teacher-landing__modern-hero-image {
  width: 100%;
  border-radius: 18px;
  object-fit: cover;
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.18);
}

.teacher-landing__hero-shell--legacy,
.teacher-landing__legacy-block {
  display: none;
}

.teacher-landing__modern-section {
  padding: 110px 0;
}

.teacher-landing__modern-section--center,
.teacher-landing__modern-heading--center {
  text-align: center;
}

.teacher-landing__modern-heading {
  max-width: 780px;
  margin-bottom: 3.2rem;
}

.teacher-landing__modern-heading--center {
  margin-left: auto;
  margin-right: auto;
}

.teacher-landing__modern-section-title {
  font-size: clamp(2.1rem, 4vw, 2.8rem);
  margin: 0 0 1rem;
  color: var(--modern-dark);
}

.teacher-landing__modern-section-description {
  color: #4b5563;
  font-size: 1.08rem;
}

.teacher-landing__modern-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.8rem;
}

.teacher-landing__modern-feature-card {
  background: #f8fffb;
  padding: 2.1rem 1.9rem;
  border-radius: 18px;
  text-align: center;
  border: 1px solid rgba(37, 99, 235, 0.08);
  box-shadow: 0 14px 32px rgba(37, 99, 235, 0.08);
}

.teacher-landing__modern-feature-icon {
  font-size: 2.4rem;
  margin-bottom: 1rem;
}

.teacher-landing__modern-feature-title {
  font-size: 1.2rem;
  margin-bottom: 0.6rem;
  color: var(--modern-dark);
}

.teacher-landing__modern-feature-description {
  color: var(--modern-gray);
}

.teacher-landing__section--courses {
  background: var(--modern-light);
}

.teacher-landing__modern-courses {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
}

.teacher-landing__modern-course-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  text-align: left;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.12);
  transition: transform 220ms ease, box-shadow 220ms ease;
}

.teacher-landing__modern-course-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 26px 60px rgba(15, 23, 42, 0.16);
}

.teacher-landing__modern-course-media {
  height: 210px;
  overflow: hidden;
}

.teacher-landing__modern-course-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-landing__modern-course-body {
  padding: 1.7rem 1.8rem 1.9rem;
}

.teacher-landing__modern-course-level {
  display: inline-block;
  padding: 0.4rem 0.95rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--modern-primary);
  font-weight: 800;
  margin-bottom: 0.9rem;
}

.teacher-landing__modern-course-title {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: var(--modern-dark);
}

.teacher-landing__modern-course-subtitle {
  color: var(--modern-gray);
  margin-bottom: 0.8rem;
}

.teacher-landing__modern-course-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  color: #fbbf24;
  margin-bottom: 1.2rem;
}

.teacher-landing__modern-course-rating {
  color: var(--modern-gray);
  font-weight: 700;
}

.teacher-landing__modern-course-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
}

.teacher-landing__modern-course-price {
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--modern-primary);
}

.teacher-landing__modern-course-cta {
  border: none;
  border-radius: 999px;
  padding: 0.75rem 1.3rem;
  background: var(--modern-primary);
  color: white;
  font-weight: 800;
  cursor: pointer;
}

.teacher-landing__section--mentors {
  background: white;
}

.teacher-landing__modern-mentors {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2.1rem;
}

.teacher-landing__modern-mentor-card {
  text-align: center;
}

.teacher-landing__modern-mentor-avatar {
  width: 156px;
  height: 156px;
  margin: 0 auto 1.1rem;
  border-radius: 50%;
  overflow: hidden;
  border: 6px solid rgba(37, 99, 235, 0.12);
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.15);
}

.teacher-landing__modern-mentor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-landing__modern-mentor-name {
  font-size: 1.2rem;
  margin-bottom: 0.35rem;
  color: var(--modern-dark);
}

.teacher-landing__modern-mentor-role {
  color: var(--modern-gray);
  margin-bottom: 0.7rem;
}

.teacher-landing__modern-mentor-quote {
  color: #4b5563;
  font-style: italic;
}

.teacher-landing__section--contact {
  background: var(--modern-orange);
  color: white;
  border-radius: 0;
}

.teacher-landing__contact {
  max-width: 960px;
  margin: 0 auto;
  background: transparent;
  box-shadow: none;
  padding: 110px 24px;
}

.teacher-landing__contact-title {
  font-size: clamp(2.2rem, 4vw, 2.9rem);
}

.teacher-landing__contact-subtitle {
  color: rgba(255, 255, 255, 0.92);
}

.teacher-landing__contact-actions {
  justify-content: center;
}

.teacher-landing__contact-cta,
.teacher-landing__contact-secondary {
  border-radius: 999px;
  font-weight: 800;
}

.teacher-landing__contact-cta {
  background: white;
  color: var(--modern-orange);
}

.teacher-landing__contact-secondary {
  border-color: rgba(255, 255, 255, 0.7);
  color: white;
}

.teacher-landing__contact-links--light .teacher-landing__contact-link {
  border-color: rgba(255, 255, 255, 0.32);
  background: rgba(255, 255, 255, 0.12);
}

.teacher-landing__modern-footer {
  background: var(--modern-dark);
  color: white;
  padding: 88px 0 38px;
  margin-top: 0;
}

.teacher-landing__footer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) repeat(2, minmax(0, 0.7fr));
  gap: 2.8rem;
  align-items: start;
}

.teacher-landing__footer-logo {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1.1rem;
}

.teacher-landing__footer-title {
  font-size: 1.4rem;
  margin: 0;
}

.teacher-landing__footer-subtitle {
  margin: 0.25rem 0 0;
  color: rgba(255, 255, 255, 0.72);
}

.teacher-landing__footer-text {
  color: rgba(255, 255, 255, 0.78);
  margin-bottom: 1.6rem;
  max-width: 56ch;
}

.teacher-landing__footer-newsletter {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1rem;
  max-width: 520px;
}

.teacher-landing__footer-input {
  flex: 1;
  padding: 0.85rem 1rem;
  border-radius: 999px;
  border: none;
  outline: none;
}

.teacher-landing__footer-submit {
  padding: 0.85rem 1.2rem;
  border-radius: 999px;
  border: none;
  background: var(--modern-orange);
  color: white;
  font-weight: 800;
  cursor: pointer;
}

.teacher-landing__footer-socials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1.4rem;
}

.teacher-landing__footer-social {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.14);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.24);
  transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease;
}

.teacher-landing__footer-social:hover,
.teacher-landing__footer-social:focus-visible {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.42);
  transform: translateY(-2px);
}

.teacher-landing__footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.teacher-landing__footer-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.82rem 1.5rem;
  border-radius: 999px;
  font-weight: 800;
  border: 2px solid transparent;
  cursor: pointer;
}

.teacher-landing__footer-cta--primary {
  background: var(--modern-primary);
  color: white;
}

.teacher-landing__footer-cta--ghost {
  border-color: rgba(255, 255, 255, 0.4);
  color: white;
  background: transparent;
}

.teacher-landing__footer-heading {
  font-size: 1.05rem;
  margin: 0 0 1rem;
}

.teacher-landing__footer-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.6rem;
}

.teacher-landing__footer-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 600;
}

.teacher-landing__footer-link:hover,
.teacher-landing__footer-link:focus-visible {
  color: white;
}

.teacher-landing__copyright {
  margin-top: 3.2rem;
  padding-top: 1.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

@media (max-width: 1200px) {
  .teacher-landing__modern-hero {
    gap: 44px;
  }
}

@media (max-width: 1024px) {
  .teacher-landing__modern-hero {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .teacher-landing__modern-heading {
    margin-left: auto;
    margin-right: auto;
  }

  .teacher-landing__modern-actions,
  .teacher-landing__modern-stats {
    justify-content: center;
  }

  .teacher-landing__footer-grid {
    grid-template-columns: 1fr;
  }

  .teacher-landing__footer-newsletter {
    flex-direction: column;
  }
}

@media (max-width: 860px) {
  .teacher-landing__nav-cta--desktop {
    display: none;
  }

  .teacher-landing__modern-footer {
    padding: 72px 0 32px;
  }
}

.teacher-landing__modern-quote-author {
  font-size: 1.125rem;
  color: #666;
  font-style: italic;
  margin-top: 1rem;
}

</style>
