<template>
  <ThemePage
    class="teacher-landing-content__page"
    :title="t('nav.teacherLandingContent')"
    :subtitle="t('landingContent.branding.subtitle')"
    :class="{
      'public-course--rtl coursedetailsRtl': isRtl,
      'public-course--sticky': stickyCtaVisible,
    }"
  >
    <UiTabs
      v-model="activeTab"
      :tabs="tabItems"
      variant="underline"
      grow
      class="teacher-landing-content__tabs"
    />
    <section class="teacher-landing-content">
      <div
        v-show="activeTab === 'preview'"
        class="teacher-landing-content__panel teacher-landing-content__panel--preview"
      >
        <UiCard
          v-if="landingPreviewUrl"
          class="teacher-landing-content__card teacher-landing-content__card--preview"
          hover
        >
          <template #title>{{ t("landingContent.preview.title") }}</template>
          <template #subtitle>{{
            t("landingContent.preview.subtitle")
          }}</template>
          <div class="teacher-landing-preview__toolbar">
            <UiSegmentedControl
              v-model="previewDevice"
              :options="previewDeviceOptions"
              size="sm"
              full-width
              class="teacher-landing-preview__device-toggle"
            />
            <UiButton
              variant="ghost"
              color="secondary"
              :disabled="!landingPublicUrl"
              @click="openCopyDialog"
            >
              {{ t("landingContent.preview.copyLink") }}
            </UiButton>
            <UiButton
              variant="link"
              color="secondary"
              :href="landingPreviewUrl"
              target="_blank"
              rel="noopener"
              append-icon="ArrowUpRightOutlined"
            >
              {{ t("landingContent.preview.openInNewTab") }}
            </UiButton>
          </div>
          <div
            class="teacher-landing-preview"
            :class="[`teacher-landing-preview--${previewDevice}`]"
          >
            <iframe
              :key="previewRefreshKey"
              class="teacher-landing-preview__frame"
              :src="landingPreviewUrl"
              loading="lazy"
              referrerpolicy="no-referrer"
              allowfullscreen
            />
          </div>
        </UiCard>
        <UiCard
          v-else
          class="teacher-landing-content__card teacher-landing-content__card--preview"
          hover
        >
          <template #title>{{ t("landingContent.preview.title") }}</template>
          <div class="teacher-landing-preview__empty">
            <p class="teacher-landing-preview__empty-main">
              {{ t("landingContent.preview.unavailable") }}
            </p>
            <p class="teacher-landing-preview__empty-hint">
              {{ t("landingContent.preview.unavailableHint") }}
            </p>
          </div>
        </UiCard>
      </div>

      <div
        v-show="activeTab === 'branding'"
        class="teacher-landing-content__panel teacher-landing-content__panel--branding"
      >
        <UiCard
          class="teacher-landing-content__card teacher-landing-content__card--wide"
          hover
        >
          <template #title>{{ t("landingContent.branding.title") }}</template>
          <template #subtitle>{{
            t("landingContent.branding.subtitle")
          }}</template>
          <form class="teacher-landing-branding" @submit.prevent="saveBranding">
            <div class="teacher-landing-branding__grid">
              <section class="teacher-landing-branding__section">
                <header class="teacher-landing-branding__section-header">
                  <button
                    type="button"
                    class="teacher-landing-branding__section-toggle"
                    :aria-expanded="isBrandingSectionOpen('general')"
                    @click="toggleBrandingSection('general')"
                  >
                    <UiIcon
                      name="DownOutlined"
                      class="teacher-landing-branding__section-chevron"
                      :class="{ 'is-open': isBrandingSectionOpen('general') }"
                      :size="16"
                    />
                    <h3>{{ t("landingContent.branding.generalTitle") }}</h3>
                  </button>
                </header>
                <div
                  v-show="isBrandingSectionOpen('general')"
                  class="teacher-landing-branding__section-body"
                >
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.generalHint") }}
                  </p>
                  <UiInput
                    v-model="brandingForm.name"
                    :label="t('landingContent.branding.name')"
                    required
                  />
                  <UiInput
                    v-model="brandingForm.subject"
                    :label="t('landingContent.branding.subject')"
                  />
                  <UiInput
                    v-model="brandingForm.tagline"
                    :label="t('landingContent.branding.tagline')"
                  />
                  <UiSelect
                    v-model="brandingForm.defaultLocale"
                    :label="t('landingContent.branding.defaultLanguageLabel')"
                  >
                    <option value="en">
                      {{ t("landingContent.branding.defaultLanguageEn") }}
                    </option>
                    <option value="ar">
                      {{ t("landingContent.branding.defaultLanguageAr") }}
                    </option>
                  </UiSelect>
                  <UiTextarea
                    v-model="brandingForm.bio"
                    :rows="3"
                    :label="t('landingContent.branding.bio')"
                  />
                  <div class="teacher-landing-branding__photo">
                    <div
                      v-if="brandingForm.photoUrl"
                      class="teacher-landing-branding__photo-preview"
                    >
                      <UiAvatar
                        :src="photoPreviewSrc"
                        :name="brandingForm.name"
                        size="lg"
                      />
                      <UiButton
                        variant="link"
                        color="danger"
                        size="sm"
                        :disabled="photoUploading"
                        @click.prevent="clearPhoto"
                      >
                        {{ t("landingContent.branding.removePhoto") }}
                      </UiButton>
                    </div>
                    <UiFileUpload
                      v-model="photoFiles"
                      :label="t('landingContent.branding.photoUploadLabel')"
                      :hint="t('landingContent.branding.photoUploadHint')"
                      accept="image/*"
                      :disabled="photoUploading"
                      icon="CameraOutlined"
                      @change="onPhotoSelected"
                      @remove="onPhotoRemoved"
                    />
                  </div>
                </div>
              </section>

              <section
                class="teacher-landing-branding__section teacher-landing-branding__section--colors"
              >
                <header class="teacher-landing-branding__section-header">
                  <button
                    type="button"
                    class="teacher-landing-branding__section-toggle"
                    :aria-expanded="isBrandingSectionOpen('colors')"
                    @click="toggleBrandingSection('colors')"
                  >
                    <UiIcon
                      name="DownOutlined"
                      class="teacher-landing-branding__section-chevron"
                      :class="{ 'is-open': isBrandingSectionOpen('colors') }"
                      :size="16"
                    />
                    <h3>{{ t("landingContent.branding.colorsTitle") }}</h3>
                  </button>
                </header>
                <div
                  v-show="isBrandingSectionOpen('colors')"
                  class="teacher-landing-branding__section-body"
                >
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.colorsHint") }}
                  </p>
                  <div class="teacher-landing-branding__field-grid">
                    <UiInput
                      v-model="brandingForm.colors.primary"
                      type="color"
                      :label="t('landingContent.branding.colors.primary')"
                    />
                    <UiInput
                      v-model="brandingForm.colors.secondary"
                      type="color"
                      :label="t('landingContent.branding.colors.secondary')"
                    />
                  </div>
                  <UiInput
                    v-model="brandingForm.colors.accent"
                    type="color"
                    :label="t('landingContent.branding.colors.accent')"
                  />
                  <div class="teacher-landing-branding__colors-preview">
                    <span class="teacher-landing-branding__colors-label">
                      {{ t("landingContent.branding.colorsPreviewLabel") }}
                    </span>
                    <div class="teacher-landing-branding__colors-swatches">
                      <span
                        class="teacher-landing-branding__color-swatch"
                        :style="{
                          background: brandingForm.colors.primary || '#2563eb',
                        }"
                      ></span>
                      <span
                        class="teacher-landing-branding__color-swatch"
                        :style="{
                          background:
                            brandingForm.colors.secondary || '#0ea5e9',
                        }"
                      ></span>
                      <span
                        class="teacher-landing-branding__color-swatch"
                        :style="{
                          background: brandingForm.colors.accent || '#f59e0b',
                        }"
                      ></span>
                    </div>
                    <span
                      class="teacher-landing-branding__colors-chip"
                      :style="{
                        background: `linear-gradient(135deg, ${
                          brandingForm.colors.primary || '#2563eb'
                        }, ${brandingForm.colors.secondary || '#0ea5e9'})`,
                      }"
                    >
                      {{ t("landingContent.branding.colorsPreviewChip") }}
                    </span>
                  </div>
                </div>
              </section>
              
              <section
                class="teacher-landing-branding__section teacher-landing-branding__section--template"
              >
                <header class="teacher-landing-branding__section-header">
                  <button
                    type="button"
                    class="teacher-landing-branding__section-toggle"
                    :aria-expanded="isBrandingSectionOpen('template')"
                    @click="toggleBrandingSection('template')"
                  >
                    <UiIcon
                      name="DownOutlined"
                      class="teacher-landing-branding__section-chevron"
                      :class="{ 'is-open': isBrandingSectionOpen('template') }"
                      :size="16"
                    />
                    <h3>{{ t("landingContent.branding.templateTitle") }}</h3>
                  </button>
                </header>
                <div
                  v-show="isBrandingSectionOpen('template')"
                  class="teacher-landing-branding__section-body"
                >
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.templateHint") }}
                  </p>
                  <div class="teacher-landing-template-grid">
                    <button
                      v-for="option in templateOptions"
                      :key="option.value"
                      type="button"
                      class="teacher-landing-template-card"
                      :class="{
                        'is-active': brandingForm.template === option.value,
                      }"
                      @click="brandingForm.template = option.value"
                    >
                      <span class="teacher-landing-template-title">{{
                        option.label
                      }}</span>
                      <span
                        class="teacher-landing-template-preview"
                        :class="`teacher-landing-template-preview--${option.value}`"
                      ></span>
                    </button>
                  </div>
                </div>
              </section>

              <section class="teacher-landing-branding__section">
                <header class="teacher-landing-branding__section-header">
                  <button
                    type="button"
                    class="teacher-landing-branding__section-toggle"
                    :aria-expanded="isBrandingSectionOpen('hero')"
                    @click="toggleBrandingSection('hero')"
                  >
                    <UiIcon
                      name="DownOutlined"
                      class="teacher-landing-branding__section-chevron"
                      :class="{ 'is-open': isBrandingSectionOpen('hero') }"
                      :size="16"
                    />
                    <h3>{{ t("landingContent.branding.heroTitle") }}</h3>
                  </button>
                </header>
                <div
                  v-show="isBrandingSectionOpen('hero')"
                  class="teacher-landing-branding__section-body"
                >
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.heroHint") }}
                  </p>
                  <UiInput
                    v-model="brandingForm.heroTitle"
                    :label="t('landingContent.branding.heroHeadline')"
                  />
                  <UiTextarea
                    v-model="brandingForm.heroSubtitle"
                    :rows="3"
                    :label="t('landingContent.branding.heroSubtitle')"
                  />
                  <UiInput
                    v-model="brandingForm.heroImageUrl"
                    :label="t('landingContent.branding.heroImage')"
                  />
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.heroImageHint") }}
                  </p>
                  <div class="teacher-landing-branding__image">
                    <div
                      v-if="brandingForm.heroImageUrl"
                      class="teacher-landing-branding__image-preview"
                    >
                      <img
                        :src="heroImagePreviewSrc"
                        :alt="brandingForm.heroTitle || brandingForm.name"
                      />
                      <UiButton
                        variant="link"
                        color="danger"
                        size="sm"
                        :disabled="heroImageUploading"
                        @click.prevent="clearHeroImage"
                      >
                        {{ t("landingContent.branding.removeHeroImage") }}
                      </UiButton>
                    </div>
                    <UiFileUpload
                      v-model="heroImageFiles"
                      :label="t('landingContent.branding.heroImageUploadLabel')"
                      :hint="t('landingContent.branding.heroImageUploadHint')"
                      accept="image/*"
                      :disabled="heroImageUploading"
                      icon="PictureOutlined"
                      @change="onHeroImageSelected"
                      @remove="onHeroImageRemoved"
                    />
                  </div>
                  <UiSelect
                    v-model="brandingForm.coverTheme"
                    :label="t('landingContent.branding.coverThemeTitle')"
                  >
                    <option
                      v-for="option in coverThemeOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </UiSelect>
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.coverThemeHint") }}
                  </p>
                  <div class="teacher-landing-branding__field-grid">
                    <UiInput
                      v-model="brandingForm.heroQuote"
                      :label="t('landingContent.branding.heroQuote')"
                    />
                    <UiInput
                      v-model="brandingForm.heroQuoteAuthor"
                      :label="t('landingContent.branding.heroQuoteAuthor')"
                    />
                  </div>
                  <div class="teacher-landing-branding__field-grid">
                    <UiInput
                      v-model="brandingForm.ctaLabel"
                      :label="t('landingContent.branding.ctaLabel')"
                    />
                    <UiSelect
                      v-model="brandingForm.ctaAction"
                      :label="t('landingContent.branding.ctaAction')"
                    >
                      <option value="register">
                        {{ t("landingContent.branding.ctaOptions.register") }}
                      </option>
                      <option value="login">
                        {{ t("landingContent.branding.ctaOptions.login") }}
                      </option>
                      <option value="custom">
                        {{ t("landingContent.branding.ctaOptions.custom") }}
                      </option>
                    </UiSelect>
                  </div>
                  <UiInput
                    v-if="brandingForm.ctaAction === 'custom'"
                    v-model="brandingForm.ctaUrl"
                    :label="t('landingContent.branding.ctaUrl')"
                  />
                </div>
              </section>
              <!-- 
              <section class="teacher-landing-branding__section">
                <header class="teacher-landing-branding__section-header">
                  <button
                    type="button"
                    class="teacher-landing-branding__section-toggle"
                    :aria-expanded="isBrandingSectionOpen('colorSwitcher')"
                    @click="toggleBrandingSection('colorSwitcher')"
                  >
                    <UiIcon
                      name="DownOutlined"
                      class="teacher-landing-branding__section-chevron"
                      :class="{
                        'is-open': isBrandingSectionOpen('colorSwitcher'),
                      }"
                      :size="16"
                    />
                    <h3>لون الصفحة</h3>
                  </button>
                </header>
                <div
                  v-show="isBrandingSectionOpen('colorSwitcher')"
                  class="teacher-landing-branding__section-body"
                >
                  <div class="radio-toolbar">
                    <input
                      type="radio"
                      id="radioApple"
                      value="#2196f3"
                      v-model="brandingForm.colors.primary"
                    />
                    <label for="radioApple" class="blueLabel">Blue</label>

                    <input
                      type="radio"
                      id="radioBanana"
                      v-model="brandingForm.colors.primary"
                      value="#673ab7"
                    />
                    <label for="radioBanana" class="purpleLabel">Purple</label>

                    <input
                      type="radio"
                      id="radioOrange"
                      v-model="brandingForm.colors.primary"
                      value="#ff9800"
                    />
                    <label for="radioOrange" class="orangeLabel">Orange</label>

                    <input
                      type="radio"
                      id="radioBrown"
                      v-model="brandingForm.colors.primary"
                      value="#795548"
                    />
                    <label for="radioBrown" class="brownLabel">Brown</label>

                    <input
                      type="radio"
                      id="radiogreen"
                      v-model="brandingForm.colors.primary"
                      value="#00e676"
                    />
                    <label for="radiogreen" class="greenLabel">Green</label>

                    <input
                      type="radio"
                      id="radiopink"
                      v-model="brandingForm.colors.primary"
                      value="#e91e63"
                    />
                    <label for="radiopink" class="pinkLabel">Pink</label>

                    <input
                      type="radio"
                      id="radioRed"
                      v-model="brandingForm.colors.primary"
                      value="#ff0000"
                    />
                    <label for="radioRed" class="redLabel">Red</label>
                    <input
                      type="radio"
                      id="radioTeal"
                      v-model="brandingForm.colors.primary"
                      value="#009688"
                    />
                    <label for="radioTeal" class="tealLabel">Teal</label>
                    <input
                      type="radio"
                      id="radioYellow"
                      v-model="brandingForm.colors.primary"
                      value="#efd510"
                    />
                    <label for="radioYellow" class="yellowLabel">Yellow</label>
                    <input
                      type="radio"
                      id="radiobluegrey"
                      v-model="brandingForm.colors.primary"
                      value="#607d8b"
                    />
                    <label for="radiobluegrey" class="bluegreyLabel"
                      >Blue Grey</label
                    >
                    <input
                      type="radio"
                      id="radioBlack"
                      v-model="brandingForm.colors.primary"
                      value="#a2c11c"
                    />
                    <label for="radioBlack" class="blackLabel"
                      >Dark Green</label
                    >
                    <input
                      type="radio"
                      id="radioTurquoise"
                      v-model="brandingForm.colors.primary"
                      value="#00aaa0"
                    />
                    <label for="radioTurquoise" class="TurquoiseLabel"
                      >Turquoise</label
                    >
                  </div>
                </div>
              </section> -->

              <section class="teacher-landing-branding__section">
                <header class="teacher-landing-branding__section-header">
                  <button
                    type="button"
                    class="teacher-landing-branding__section-toggle"
                    :aria-expanded="isBrandingSectionOpen('highlights')"
                    @click="toggleBrandingSection('highlights')"
                  >
                    <UiIcon
                      name="DownOutlined"
                      class="teacher-landing-branding__section-chevron"
                      :class="{
                        'is-open': isBrandingSectionOpen('highlights'),
                      }"
                      :size="16"
                    />
                    <h3>{{ t("landingContent.branding.highlightsTitle") }}</h3>
                  </button>
                  <UiButton
                    v-if="canAddHighlight"
                    variant="outline"
                    color="secondary"
                    size="sm"
                    @click.prevent="addHighlight"
                  >
                    {{ t("landingContent.branding.addHighlight") }}
                  </UiButton>
                </header>
                <div
                  v-show="isBrandingSectionOpen('highlights')"
                  class="teacher-landing-branding__section-body"
                >
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.highlightsHint") }}
                  </p>
                  <div class="teacher-landing-branding__list">
                    <div
                      v-for="(highlight, index) in brandingForm.highlights"
                      :key="`highlight-${index}`"
                      class="teacher-landing-branding__list-item"
                    >
                      <UiInput
                        v-model="brandingForm.highlights[index]"
                        :label="
                          t('landingContent.branding.highlightLabel', {
                            index: index + 1,
                          })
                        "
                      />
                      <UiButton
                        v-if="brandingForm.highlights.length > 1"
                        variant="link"
                        color="danger"
                        size="sm"
                        @click.prevent="removeHighlight(index)"
                      >
                        {{ t("landingContent.branding.remove") }}
                      </UiButton>
                    </div>
                  </div>
                </div>
              </section>

              <section class="teacher-landing-branding__section">
                <header class="teacher-landing-branding__section-header">
                  <button
                    type="button"
                    class="teacher-landing-branding__section-toggle"
                    :aria-expanded="isBrandingSectionOpen('stats')"
                    @click="toggleBrandingSection('stats')"
                  >
                    <UiIcon
                      name="DownOutlined"
                      class="teacher-landing-branding__section-chevron"
                      :class="{ 'is-open': isBrandingSectionOpen('stats') }"
                      :size="16"
                    />
                    <h3>{{ brandingStatsTitle }}</h3>
                  </button>
                  <UiButton
                    v-if="canAddStat"
                    variant="outline"
                    color="secondary"
                    size="sm"
                    @click.prevent="addStat"
                  >
                    {{ t("landingContent.branding.addStat") }}
                  </UiButton>
                </header>
                <div
                  v-show="isBrandingSectionOpen('stats')"
                  class="teacher-landing-branding__section-body"
                >
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.statsHint") }}
                  </p>
                  <div class="teacher-landing-branding__list">
                    <div
                      v-for="(stat, index) in brandingForm.stats"
                      :key="`stat-${index}`"
                      class="teacher-landing-branding__list-item teacher-landing-branding__list-item--two-columns"
                    >
                      <UiInput
                        v-model="stat.label"
                        :label="
                          t('landingContent.branding.statLabel', {
                            index: index + 1,
                          })
                        "
                      />
                      <UiInput
                        v-model="stat.value"
                        :label="
                          t('landingContent.branding.statValue', {
                            index: index + 1,
                          })
                        "
                      />
                      <UiButton
                        v-if="brandingForm.stats.length > 1"
                        variant="link"
                        color="danger"
                        size="sm"
                        class="teacher-landing-branding__list-remove"
                        @click.prevent="removeStat(index)"
                      >
                        {{ t("landingContent.branding.remove") }}
                      </UiButton>
                    </div>
                  </div>
                </div>
              </section>

              <!-- <section class="teacher-landing-branding__section">
                <header class="teacher-landing-branding__section-header">
                  <button
                    type="button"
                    class="teacher-landing-branding__section-toggle"
                    :aria-expanded="isBrandingSectionOpen('lessons')"
                    @click="toggleBrandingSection('lessons')"
                  >
                    <UiIcon
                      name="DownOutlined"
                      class="teacher-landing-branding__section-chevron"
                      :class="{ 'is-open': isBrandingSectionOpen('lessons') }"
                      :size="16"
                    />
                    <h3>{{ t("landingContent.branding.lessonsTitle") }}</h3>
                  </button>
                  <UiButton
                    v-if="canAddCourse"
                    variant="outline"
                    color="secondary"
                    size="sm"
                    @click.prevent="addLesson"
                  >
                    {{ t("landingContent.branding.addLesson") }}
                  </UiButton>
                </header>
                <div
                  v-show="isBrandingSectionOpen('lessons')"
                  class="teacher-landing-branding__section-body"
                >
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.lessonsHint") }}
                  </p>
                  <div class="teacher-landing-branding__list">
                    <div
                      v-for="(lesson, index) in brandingForm.courses"
                      :key="`lesson-${index}`"
                      class="teacher-landing-branding__list-item"
                    >
                      <UiInput
                        v-model="lesson.title"
                        :label="
                          t('landingContent.branding.lessonTitle', {
                            index: index + 1,
                          })
                        "
                      />
                      <UiTextarea
                        v-model="lesson.description"
                        :rows="2"
                        :label="
                          t('landingContent.branding.lessonDescription', {
                            index: index + 1,
                          })
                        "
                      />
                      <UiInput
                        v-model="lesson.coverUrl"
                        :label="
                          t('landingContent.branding.lessonCover', {
                            index: index + 1,
                          })
                        "
                      />
                      <div
                        class="teacher-landing-branding__image teacher-landing-branding__image--compact"
                      >
                        <div
                          v-if="lesson.coverUrl"
                          class="teacher-landing-branding__image-preview teacher-landing-branding__image-preview--compact"
                        >
                          <img
                            :src="
                              withCacheBusting(
                                lesson.coverUrl,
                                previewRefreshKey
                              )
                            "
                            :alt="lesson.title"
                          />
                          <UiButton
                            variant="link"
                            color="danger"
                            size="sm"
                            :disabled="courseCoverUploading[index]"
                            @click.prevent="clearCourseCover(index)"
                          >
                            {{ t("landingContent.branding.removeLessonCover") }}
                          </UiButton>
                        </div>
                        <UiFileUpload
                          v-model="courseCoverFiles[index]"
                          :label="
                            t(
                              'landingContent.branding.lessonCoverUploadLabel',
                              { index: index + 1 }
                            )
                          "
                          :hint="
                            t('landingContent.branding.lessonCoverUploadHint')
                          "
                          accept="image/*"
                          :disabled="courseCoverUploading[index]"
                          icon="PictureOutlined"
                          @change="(files: File[]) => onCourseCoverSelected(index, files)"
                          @remove="() => onCourseCoverRemoved(index)"
                        />
                      </div>
                      <UiInput
                        v-model="lesson.tags"
                        :label="
                          t('landingContent.branding.lessonTags', {
                            index: index + 1,
                          })
                        "
                      />
                      <UiInput
                        v-model="lesson.price"
                        type="number"
                        min="0"
                        step="0.01"
                        :label="
                          t('landingContent.branding.lessonPrice', {
                            index: index + 1,
                          })
                        "
                      />
                      <UiButton
                        v-if="brandingForm.courses.length > 1"
                        variant="link"
                        color="danger"
                        size="sm"
                        @click.prevent="removeLesson(index)"
                      >
                        {{ t("landingContent.branding.remove") }}
                      </UiButton>
                    </div>
                  </div>
                </div>
              </section> -->
              <!-- <section class="teacher-landing-branding__section">
                <header class="teacher-landing-branding__section-header">
                  <button
                    type="button"
                    class="teacher-landing-branding__section-toggle"
                    :aria-expanded="isBrandingSectionOpen('contact')"
                    @click="toggleBrandingSection('contact')"
                  >
                    <UiIcon
                      name="DownOutlined"
                      class="teacher-landing-branding__section-chevron"
                      :class="{ 'is-open': isBrandingSectionOpen('contact') }"
                      :size="16"
                    />
                    <h3>{{ t("landingContent.branding.contactTitle") }}</h3>
                  </button>
                </header>
                <div
                  v-show="isBrandingSectionOpen('contact')"
                  class="teacher-landing-branding__section-body"
                >
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.contactHint") }}
                  </p>
                  <UiInput
                    v-model="brandingForm.contactTitle"
                    :label="t('landingContent.branding.contactTitleLabel')"
                  />
                  <UiTextarea
                    v-model="brandingForm.contactSubtitle"
                    :rows="2"
                    :label="t('landingContent.branding.contactSubtitle')"
                  />
                  <div class="teacher-landing-branding__field-grid">
                    <UiInput
                      v-model="brandingForm.contactCtaLabel"
                      :label="t('landingContent.branding.contactCtaLabel')"
                    />
                    <UiSelect
                      v-model="brandingForm.contactCtaAction"
                      :label="t('landingContent.branding.contactCtaAction')"
                    >
                      <option value="register">
                        {{ t("landingContent.branding.ctaOptions.register") }}
                      </option>
                      <option value="login">
                        {{ t("landingContent.branding.ctaOptions.login") }}
                      </option>
                      <option value="custom">
                        {{ t("landingContent.branding.ctaOptions.custom") }}
                      </option>
                    </UiSelect>
                  </div>
                  <UiInput
                    v-if="brandingForm.contactCtaAction === 'custom'"
                    v-model="brandingForm.contactCtaUrl"
                    :label="t('landingContent.branding.contactCtaUrl')"
                  />
                </div>
              </section> -->
              <section class="teacher-landing-branding__section">
                <header class="teacher-landing-branding__section-header">
                  <button
                    type="button"
                    class="teacher-landing-branding__section-toggle"
                    :aria-expanded="isBrandingSectionOpen('footerContact')"
                    @click="toggleBrandingSection('footerContact')"
                  >
                    <UiIcon
                      name="DownOutlined"
                      class="teacher-landing-branding__section-chevron"
                      :class="{
                        'is-open': isBrandingSectionOpen('footerContact'),
                      }"
                      :size="16"
                    />
                    <h3>
                      {{ t("landingContent.branding.footerContactTitle") }}
                    </h3>
                  </button>
                </header>
                <div
                  v-show="isBrandingSectionOpen('footerContact')"
                  class="teacher-landing-branding__section-body"
                >
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.footerContactHint") }}
                  </p>
                  <div class="teacher-landing-branding__field-grid">
                    <UiInput
                      v-model="brandingForm.footerContact.whatsapp"
                      :label="t('landingContent.footerContact.whatsapp')"
                    />
                    <UiInput
                      v-model="brandingForm.footerContact.phone"
                      :label="t('landingContent.footerContact.phone')"
                    />
                    <UiInput
                      v-model="brandingForm.footerContact.email"
                      :label="t('landingContent.footerContact.email')"
                    />
                    <UiInput
                      v-model="brandingForm.footerContact.website"
                      :label="t('landingContent.footerContact.website')"
                    />
                    <UiInput
                      v-model="brandingForm.footerContact.facebook"
                      :label="t('landingContent.footerContact.facebook')"
                    />
                    <UiInput
                      v-model="brandingForm.footerContact.instagram"
                      :label="t('landingContent.footerContact.instagram')"
                    />
                    <UiInput
                      v-model="brandingForm.footerContact.linkedin"
                      :label="t('landingContent.footerContact.linkedin')"
                    />
                    <UiInput
                      v-model="brandingForm.footerContact.telegram"
                      :label="t('landingContent.footerContact.telegram')"
                    />
                  </div>
                </div>
              </section>
              <section class="teacher-landing-branding__section">
                <header class="teacher-landing-branding__section-header">
                  <button
                    type="button"
                    class="teacher-landing-branding__section-toggle"
                    :aria-expanded="isBrandingSectionOpen('seo')"
                    @click="toggleBrandingSection('seo')"
                  >
                    <UiIcon
                      name="DownOutlined"
                      class="teacher-landing-branding__section-chevron"
                      :class="{ 'is-open': isBrandingSectionOpen('seo') }"
                      :size="16"
                    />
                    <h3>{{ t("landingContent.branding.seoSectionTitle") }}</h3>
                  </button>
                </header>
                <div
                  v-show="isBrandingSectionOpen('seo')"
                  class="teacher-landing-branding__section-body"
                >
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.seoHint") }}
                  </p>
                  <UiInput
                    v-model="brandingForm.seoTitle"
                    :label="t('landingContent.branding.seoTitleLabel')"
                  />
                  <UiTextarea
                    v-model="brandingForm.seoDescription"
                    :rows="3"
                    :label="t('landingContent.branding.seoDescriptionLabel')"
                  />
                  <UiInput
                    v-model="brandingForm.seoOgImage"
                    :label="t('landingContent.branding.seoOgImageLabel')"
                  />
                  <p class="teacher-landing-branding__hint">
                    {{ t("landingContent.branding.seoOgImageHint") }}
                  </p>
                </div>
              </section>
            </div>
            <div class="teacher-landing-content__actions">
              <UiBadge
                v-if="isDirty"
                color="warning"
                variant="soft"
                class="teacher-landing-content__dirty-badge"
              >
                {{ t("landingContent.unsavedBadge") }}
              </UiBadge>
              <UiButton
                variant="outline"
                color="secondary"
                :href="landingPreviewUrl"
                target="_blank"
                rel="noopener"
                :disabled="!landingPreviewUrl"
              >
                {{ t("landingContent.preview.openInNewTab") }}
              </UiButton>
              <UiButton
                button-type="submit"
                color="primary"
                :loading="brandingSaving"
                :disabled="photoUploading || !isDirty"
              >
                {{ t("landingContent.branding.actions.save") }}
              </UiButton>
              <UiButton
                variant="link"
                color="secondary"
                :disabled="brandingSaving"
                @click="resetBranding"
              >
                {{ t("landingContent.branding.actions.reset") }}
              </UiButton>
            </div>
          </form>
        </UiCard>
      </div>

      <div
        v-show="activeTab === 'content'"
        class="teacher-landing-content__panel teacher-landing-content__panel--content"
      >
        <UiCard class="teacher-landing-content__card" hover>
          <template #title>{{
            t("landingContent.testimonials.title")
          }}</template>
          <form
            class="teacher-landing-content__form"
            @submit.prevent="saveTestimonial"
          >
            <UiInput
              v-model="testimonialForm.author"
              :label="t('landingContent.testimonials.author')"
              required
            />
            <UiTextarea
              v-model="testimonialForm.quote"
              :label="t('landingContent.testimonials.quote')"
              :rows="3"
              required
            />
            <UiInput
              v-model="testimonialForm.locale"
              :label="t('landingContent.locale')"
              maxlength="5"
            />
            <UiInput
              :model-value="testimonialForm.position"
              type="number"
              min="1"
              :label="t('landingContent.position')"
              @update:model-value="onTestimonialPositionChange"
            />
            <div class="teacher-landing-content__actions">
              <UiButton button-type="submit" color="primary">
                {{
                  testimonialForm.id
                    ? t("common.save")
                    : t("landingContent.add")
                }}
              </UiButton>
              <UiButton
                variant="link"
                color="secondary"
                @click="resetTestimonial"
                >{{ t("landingContent.reset") }}</UiButton
              >
            </div>
          </form>
          <ul class="teacher-landing-content__list">
            <li
              v-for="item in testimonials"
              :key="item.id"
              class="teacher-landing-content__item"
            >
              <div class="teacher-landing-content__item-text">
                <strong>{{ item.author }}</strong>
                <p>{{ item.quote }}</p>
              </div>
              <div class="teacher-landing-content__item-actions">
                <UiButton
                  variant="link"
                  color="primary"
                  prepend-icon="EditOutlined"
                  @click="editTestimonial(item)"
                >
                  {{ t("common.edit") }}
                </UiButton>
                <UiButton
                  variant="link"
                  color="danger"
                  prepend-icon="DeleteOutlined"
                  @click="deleteTestimonial(item.id)"
                >
                  {{ t("common.delete") }}
                </UiButton>
              </div>
            </li>
          </ul>
        </UiCard>

        <UiCard class="teacher-landing-content__card" hover>
          <template #title>{{ t("landingContent.faqs.title") }}</template>
          <form class="teacher-landing-content__form" @submit.prevent="saveFaq">
            <UiInput
              v-model="faqForm.question"
              :label="t('landingContent.faqs.question')"
              required
            />
            <UiTextarea
              v-model="faqForm.answer"
              :label="t('landingContent.faqs.answer')"
              :rows="3"
              required
            />
            <UiInput
              v-model="faqForm.locale"
              :label="t('landingContent.locale')"
              maxlength="5"
            />
            <UiInput
              :model-value="faqForm.position"
              type="number"
              min="1"
              :label="t('landingContent.position')"
              @update:model-value="onFaqPositionChange"
            />
            <div class="teacher-landing-content__actions">
              <UiButton button-type="submit" color="primary">
                {{ faqForm.id ? t("common.save") : t("landingContent.add") }}
              </UiButton>
              <UiButton variant="link" color="secondary" @click="resetFaq">{{
                t("landingContent.reset")
              }}</UiButton>
            </div>
          </form>
          <ul class="teacher-landing-content__list">
            <li
              v-for="item in faqs"
              :key="item.id"
              class="teacher-landing-content__item"
            >
              <div class="teacher-landing-content__item-text">
                <strong>{{ item.question }}</strong>
                <p>{{ item.answer }}</p>
              </div>
              <div class="teacher-landing-content__item-actions">
                <UiButton
                  variant="link"
                  color="primary"
                  prepend-icon="EditOutlined"
                  @click="editFaq(item)"
                >
                  {{ t("common.edit") }}
                </UiButton>
                <UiButton
                  variant="link"
                  color="danger"
                  prepend-icon="DeleteOutlined"
                  @click="deleteFaq(item.id)"
                >
                  {{ t("common.delete") }}
                </UiButton>
              </div>
            </li>
          </ul>
        </UiCard>
      </div>
    </section>

    <UiDialog
      v-model="copyDialogOpen"
      :title="t('landingContent.preview.copyDialogTitle')"
      width="480px"
    >
      <div class="teacher-landing-preview__copy-dialog">
        <UiInput
          :model-value="landingPublicUrl"
          :label="t('landingContent.preview.copyDialogLabel')"
          readonly
        />
        <div class="teacher-landing-preview__copy-actions">
          <UiButton
            color="primary"
            :disabled="!landingPublicUrl"
            @click="copyLandingUrl"
          >
            {{ t("landingContent.preview.copyDialogAction") }}
          </UiButton>
          <UiButton
            variant="ghost"
            color="secondary"
            @click="copyDialogOpen = false"
          >
            {{ t("landingContent.preview.copyDialogClose") }}
          </UiButton>
        </div>
      </div>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import {
  computed,
  reactive,
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useLandingContentStore } from "@/stores/landingContent";
import { useTeacherProfileStore } from "@/stores/teacherProfile";
import { useTeacherLandingStore } from "@/stores/teacherLanding";
import type {
  FaqResponse,
  TestimonialResponse,
} from "@/services/landingContent";
import { useRouter } from "vue-router";
import UiCard from "@/components/ui/UiCard.vue";
import UiTabs from "@/components/ui/UiTabs.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiTextarea from "@/components/ui/UiTextarea.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiSelect from "@/components/ui/UiSelect.vue";
import UiFileUpload from "@/components/ui/UiFileUpload.vue";
import UiAvatar from "@/components/ui/UiAvatar.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiBadge from "@/components/ui/UiBadge.vue";
import UiSegmentedControl from "@/components/ui/UiSegmentedControl.vue";
import UiDialog from "@/components/ui/UiDialog.vue";
import { useToast } from "@/composables/useToast";
import {
  updateCurrentTeacherProfile,
  uploadTeacherAvatar,
  type TeacherProfileDetail,
} from "@/services/teacher";
import {
  fetchTeacherLandingSettings,
  updateTeacherLandingSettings,
  uploadTeacherLandingImage,
  type TeacherLandingSettingsRequest,
  type TeacherLandingSettingsResponse,
} from "@/services/teacherLanding.api";
import { useAuthStore } from "@/stores/auth";
import { withCacheBusting } from "@/utils/cacheBusting";
import { buildTenantUrl } from "@/lib/host";

const { t } = useI18n();
const activeTab = ref<string>("branding");
const tabItems = computed(() => [
  { label: t("landingContent.tabs.branding"), value: "branding" },
  { label: t("landingContent.tabs.content"), value: "content" },
  { label: t("landingContent.tabs.preview"), value: "preview" },
]);

const previewDevice = ref<"desktop" | "tablet" | "mobile">("desktop");
const previewDeviceOptions = computed(() => [
  { label: t("landingContent.preview.deviceDesktop"), value: "desktop" },
  { label: t("landingContent.preview.deviceTablet"), value: "tablet" },
  { label: t("landingContent.preview.deviceMobile"), value: "mobile" },
]);
const copyDialogOpen = ref(false);

const BRANDING_SECTION_IDS = [
  "general",
  "colors",
  "template",
  "hero",
  "highlights",
  "stats",
  "lessons",
  "social",
  "footerContact",
  "contact",
  "seo",
] as const;
const brandingSectionsOpen = ref<Record<string, boolean>>(
  Object.fromEntries(BRANDING_SECTION_IDS.map((id) => [id, true]))
);
function toggleBrandingSection(id: string) {
  brandingSectionsOpen.value = {
    ...brandingSectionsOpen.value,
    [id]: !brandingSectionsOpen.value[id],
  };
}
function isBrandingSectionOpen(id: string) {
  return Boolean(brandingSectionsOpen.value[id]);
}

const templateOptions = computed(() => [
  { value: "modern", label: t("landingContent.branding.templates.modern") },
  { value: "minimal", label: t("landingContent.branding.templates.minimal") },
  { value: "classic", label: t("landingContent.branding.templates.classic") },
]);

const coverThemeOptions = computed(() => [
  { value: "", label: t("landingContent.branding.coverThemeNone") },
  { value: "c1", label: t("landingContent.branding.coverThemeC1") },
  { value: "c3", label: t("landingContent.branding.coverThemeC3") },
]);

const COVER_THEME_PREFIX = "theme:";
const extractCoverThemeFromImageUrl = (value: string | null | undefined) => {
  const candidate = (value ?? "").trim();
  if (!candidate.startsWith(COVER_THEME_PREFIX)) {
    return "";
  }
  const theme = candidate.slice(COVER_THEME_PREFIX.length).trim();
  return theme && theme.startsWith("c") ? theme : "";
};

const landingContentStore = useLandingContentStore();
const teacherProfileStore = useTeacherProfileStore();
const teacherLandingStore = useTeacherLandingStore();
const router = useRouter();
const { faqs, testimonials } = storeToRefs(landingContentStore);
const toast = useToast();
const auth = useAuthStore();

type CtaAction = "register" | "login" | "custom";

const profile = ref<TeacherProfileDetail | null>(null);
const rawBranding = ref<Record<string, any>>({});
const landingSettings = ref<TeacherLandingSettingsResponse | null>(null);
const landingSettingsLoaded = ref(false);
const landingSettingsLoading = ref(false);
let landingSettingsTeacherId: number | null = null;
let currentTeacherId: number | null = null;

const brandingForm = reactive({
  name: "",
  subject: "",
  bio: "",
  photoUrl: "",
  tagline: "",
  defaultLocale: "en",
  template: "modern" as "modern" | "minimal" | "classic",
  heroTitle: "",
  heroSubtitle: "",
  heroImageUrl: "",
  coverTheme: "c3",
  heroQuote: "",
  heroQuoteAuthor: "",
  ctaLabel: "",
  ctaAction: "register" as CtaAction,
  ctaUrl: "",
  contactTitle: "",
  contactSubtitle: "",
  contactCtaLabel: "",
  contactCtaAction: "register" as CtaAction,
  contactCtaUrl: "",
  colors: {
    primary: "",
    secondary: "",
    accent: "",
  },
  highlights: [""] as string[],
  stats: [{ label: "", value: "" }] as Array<{ label: string; value: string }>,
  courses: [
    { title: "", description: "", coverUrl: "", tags: "", price: "" },
  ] as Array<{
    title: string;
    description: string;
    coverUrl: string;
    tags: string;
    price: string;
  }>,
  social: {
    whatsapp: "",
    telegram: "",
    youtube: "",
    website: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    phone: "",
  },
  footerContact: {
    whatsapp: "",
    phone: "",
    email: "",
    website: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    telegram: "",
  },
  seoTitle: "",
  seoDescription: "",
  seoOgImage: "",
});

const brandingSaving = ref(false);
const brandingSnapshot = ref<string>("");
function serializeBranding() {
  return JSON.stringify({
    ...brandingForm,
    social: { ...brandingForm.social },
    footerContact: { ...brandingForm.footerContact },
    colors: { ...brandingForm.colors },
    highlights: [...brandingForm.highlights],
    stats: brandingForm.stats.map((s) => ({ ...s })),
    courses: brandingForm.courses.map((c) => ({ ...c })),
  });
}
function updateBrandingSnapshot() {
  brandingSnapshot.value = serializeBranding();
}
const isDirty = computed(
  () =>
    brandingSnapshot.value !== "" &&
    serializeBranding() !== brandingSnapshot.value
);
const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
  if (!isDirty.value) return;
  event.preventDefault();
  (event as any).returnValue = "";
};
const onChangeColor = (event: any) => {
  brandingForm.colors.primary = event.target.value;
  console.log("Selected:", brandingForm.colors.primary);
};
const redirectToLogin = async () => {
  await router.replace({
    name: "teacher-login",
    query: { next: router.currentRoute.value.fullPath },
  });
};
const photoFiles = ref<File[]>([]);
const photoUploading = ref(false);
const heroImageFiles = ref<File[]>([]);
const heroImageUploading = ref(false);
const courseCoverFiles = reactive<Record<number, File[]>>({});
const courseCoverUploading = reactive<Record<number, boolean>>({});
const previewRefreshKey = ref(0);
const photoPreviewSrc = computed(() => {
  const base = brandingForm.photoUrl.trim();
  if (!base) {
    return "";
  }
  const version =
    landingSettings.value?.teacher?.updatedAt ??
    landingSettings.value?.updatedAt ??
    null;
  return withCacheBusting(base, version ?? undefined);
});
const heroImagePreviewSrc = computed(() => {
  const base = brandingForm.heroImageUrl.trim();
  if (!base) {
    return "";
  }
  return withCacheBusting(base, previewRefreshKey.value);
});

const MAX_HIGHLIGHTS = 6;
const MAX_STATS = 4;
const MAX_COURSES = 6;

const canAddHighlight = computed(
  () => brandingForm.highlights.length < MAX_HIGHLIGHTS
);
const canAddStat = computed(() => brandingForm.stats.length < MAX_STATS);
const canAddCourse = computed(() => brandingForm.courses.length < MAX_COURSES);

const brandingStatsTitle = computed(() => {
  const fallbackName = t("landingContent.branding.statsFallbackName");
  const teacherName =
    [
      brandingForm.name,
      profile.value?.name,
      landingSettings.value?.teacher.displayName,
    ]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .find((value) => value.length) || fallbackName;

  return t("landingContent.branding.statsTitle", { teacher: teacherName });
});

const landingPreviewUrl = computed(() => {
  const slug = (
    profile.value?.slug ||
    landingSettings.value?.teacher.slug ||
    ""
  ).trim();
  if (!slug) {
    return "";
  }
  const encodedSlug = encodeURIComponent(slug);
  if (typeof window !== "undefined" && window.location?.origin) {
    try {
      return new URL(
        `/teacher/${encodedSlug}`,
        window.location.origin
      ).toString();
    } catch (error) {
      console.warn("Failed to build absolute preview URL", error);
    }
  }
  return `/teacher/${encodedSlug}`;
});

const landingPublicUrl = computed(() => {
  const slug = (
    profile.value?.slug ||
    landingSettings.value?.teacher.slug ||
    ""
  ).trim();
  if (!slug) {
    return "";
  }
  return buildTenantUrl(slug, "/");
});

const openCopyDialog = () => {
  if (!landingPublicUrl.value) {
    toast.warning(t("landingContent.preview.copyDialogMissing"));
    return;
  }
  copyDialogOpen.value = true;
};

const fallbackCopy = (value: string) => {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
};

const copyLandingUrl = async () => {
  const url = landingPublicUrl.value;
  if (!url) {
    toast.warning(t("landingContent.preview.copyDialogMissing"));
    return;
  }
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      fallbackCopy(url);
    }
    toast.success(t("landingContent.preview.copyDialogSuccess"));
  } catch (error) {
    console.warn("[TeacherLandingContent] failed to copy landing url", error);
    toast.error(t("landingContent.preview.copyDialogError"));
  }
};

const testimonialForm = reactive<{
  id?: number;
  author: string;
  quote: string;
  locale?: string;
  position?: number;
}>({
  author: "",
  quote: "",
  locale: "",
  position: undefined,
});

const faqForm = reactive<{
  id?: number;
  question: string;
  answer: string;
  locale?: string;
  position?: number;
}>({
  question: "",
  answer: "",
  locale: "",
  position: undefined,
});

function cloneRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return {} as Record<string, any>;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return { ...(value as Record<string, any>) };
  }
}

function resolveBrandingSource(value: unknown) {
  if (!value || typeof value !== "object") {
    return {} as Record<string, any>;
  }
  const root = value as Record<string, any>;
  const nested = root.branding;
  if (nested && typeof nested === "object") {
    return nested as Record<string, any>;
  }
  return root;
}

function ensureBrandingDestination(base: Record<string, any>) {
  if (!base.branding || typeof base.branding !== "object") {
    base.branding = {};
  }
  return base.branding as Record<string, any>;
}

function setArray<T>(target: T[], values: T[]) {
  target.splice(0, target.length, ...values);
}

function populateBranding(detail: TeacherProfileDetail) {
  profile.value = detail;
  rawBranding.value = cloneRecord(detail.branding ?? {});
  photoFiles.value = [];

  brandingForm.name = detail.name || "";
  brandingForm.subject = detail.subject ?? "";
  brandingForm.bio = detail.bio ?? "";
  brandingForm.photoUrl = detail.photoUrl ?? "";

  const source = resolveBrandingSource(rawBranding.value);
  brandingForm.tagline =
    typeof source.tagline === "string" ? source.tagline : "";
  const defaultLocaleRaw =
    typeof source.defaultLocale === "string"
      ? source.defaultLocale
      : typeof source.locale === "string"
      ? source.locale
      : "";
  const normalizedLocale = defaultLocaleRaw.trim().toLowerCase();
  brandingForm.defaultLocale = normalizedLocale === "ar" ? "ar" : "en";
  const colors = (source.colors as Record<string, unknown> | undefined) || {};
  brandingForm.colors.primary =
    typeof colors.primary === "string" ? colors.primary : "";
  brandingForm.colors.secondary =
    typeof colors.secondary === "string" ? colors.secondary : "";
  brandingForm.colors.accent =
    typeof colors.accent === "string" ? colors.accent : "";

  const hero = (source.hero as Record<string, any>) || {};
  brandingForm.heroTitle =
    typeof hero.title === "string" ? hero.title : detail.name || "";
  brandingForm.heroSubtitle =
    typeof hero.subtitle === "string" ? hero.subtitle : "";
  const heroImageValue = typeof hero.imageUrl === "string" ? hero.imageUrl : "";
  const heroThemeFromImage = extractCoverThemeFromImageUrl(heroImageValue);
  brandingForm.coverTheme =
    typeof hero.coverTheme === "string" ? hero.coverTheme : heroThemeFromImage;
  brandingForm.heroImageUrl = heroThemeFromImage ? "" : heroImageValue;
  brandingForm.heroQuote =
    typeof hero.quote === "string" ? hero.quote : hero.testimonial || "";
  brandingForm.heroQuoteAuthor =
    typeof hero.quoteAuthor === "string"
      ? hero.quoteAuthor
      : hero.testimonialAuthor || "";
  brandingForm.ctaLabel =
    typeof hero.ctaLabel === "string"
      ? hero.ctaLabel
      : hero.cta || hero.actionLabel || "";
  const actionRaw = (hero.ctaAction ||
    hero.action ||
    (hero.ctaUrl || hero.href ? "custom" : "register")) as CtaAction;
  brandingForm.ctaAction =
    actionRaw === "login" || actionRaw === "custom" ? actionRaw : "register";
  brandingForm.ctaUrl =
    typeof hero.ctaUrl === "string" ? hero.ctaUrl : hero.href || "";

  const highlightValues = Array.isArray(source.highlights)
    ? source.highlights.filter(
        (item: unknown): item is string => typeof item === "string"
      )
    : [];
  if (!highlightValues.length) highlightValues.push("");
  setArray(brandingForm.highlights, highlightValues);

  const statValues = Array.isArray(source.stats)
    ? source.stats
        .map((item: any) => {
          if (!item || typeof item !== "object") return null;
          const label = typeof item.label === "string" ? item.label : "";
          const value =
            typeof item.value === "string" || typeof item.value === "number"
              ? String(item.value)
              : "";
          return { label, value };
        })
        .filter(
          (item): item is { label: string; value: string } => item !== null
        )
    : [];
  if (!statValues.length) statValues.push({ label: "", value: "" });
  setArray(brandingForm.stats, statValues);

  const lessonValues = Array.isArray(source.courses)
    ? source.courses
        .map((item: any) => {
          if (!item || typeof item !== "object") return null;
          const title = typeof item.title === "string" ? item.title : "";
          const description =
            typeof item.description === "string" ? item.description : "";
          const coverUrl =
            typeof item.coverUrl === "string" ? item.coverUrl : "";
          const tags = Array.isArray(item.tags)
            ? item.tags
                .filter(
                  (tag: unknown): tag is string => typeof tag === "string"
                )
                .join(", ")
            : "";
          const price =
            item.price !== null && item.price !== undefined && item.price !== ""
              ? String(item.price)
              : "";
          return { title, description, coverUrl, tags, price };
        })
        .filter(
          (
            item
          ): item is {
            title: string;
            description: string;
            coverUrl: string;
            tags: string;
            price: string;
          } => item !== null
        )
    : [];
  if (!lessonValues.length) {
    lessonValues.push({
      title: "",
      description: "",
      coverUrl: "",
      tags: "",
      price: "",
    });
  }
  setArray(brandingForm.courses, lessonValues);
  const seo = (source.seo as Record<string, unknown> | undefined) || {};
  brandingForm.seoTitle = typeof seo.title === "string" ? seo.title : "";
  brandingForm.seoDescription =
    typeof seo.description === "string" ? seo.description : "";
  brandingForm.seoOgImage =
    typeof seo.ogImage === "string"
      ? seo.ogImage
      : typeof seo.image === "string"
      ? seo.image
      : "";
  updateBrandingSnapshot();
}

function applyLandingSettings(settings: TeacherLandingSettingsResponse | null) {
  landingSettings.value = settings;
  previewRefreshKey.value += 1;
  if (!settings) {
    return;
  }
  const teacher = settings.teacher;
  if (teacher) {
    if (teacher.displayName) brandingForm.name = teacher.displayName;
    if (teacher.headline) brandingForm.subject = teacher.headline;
    if (teacher.bio) brandingForm.bio = teacher.bio;
    const remotePhoto = teacher.photoUrl || teacher.avatarUrl;
    if (remotePhoto) brandingForm.photoUrl = remotePhoto;
  }
  if (settings.template) {
    brandingForm.template = settings.template;
  }
  if (settings.themePrimary) {
    brandingForm.colors.primary = settings.themePrimary;
  }
  if (settings.themeSecondary) {
    brandingForm.colors.secondary = settings.themeSecondary;
  }

  const heroSection = settings.sections?.find(
    (section) => section?.type?.toLowerCase() === "hero"
  );
  if (heroSection) {
    if (heroSection.title) brandingForm.heroTitle = heroSection.title;
    if (heroSection.subtitle) {
      brandingForm.heroSubtitle = heroSection.subtitle;
      brandingForm.tagline = heroSection.subtitle;
    }
    const heroImageValue = heroSection.imageUrl || "";
    const heroThemeFromImage = extractCoverThemeFromImageUrl(heroImageValue);
    brandingForm.coverTheme =
      typeof heroSection.coverTheme === "string"
        ? heroSection.coverTheme
        : heroThemeFromImage;
    brandingForm.heroImageUrl = heroThemeFromImage ? "" : heroImageValue;
    if (heroSection.description)
      brandingForm.heroQuote = heroSection.description;
    if (heroSection.quoteAuthor)
      brandingForm.heroQuoteAuthor = heroSection.quoteAuthor;
    if (heroSection.ctaText) brandingForm.ctaLabel = heroSection.ctaText;
    const action =
      heroSection.ctaAction === "login" || heroSection.ctaAction === "custom"
        ? heroSection.ctaAction
        : "register";
    brandingForm.ctaAction = action as CtaAction;
    brandingForm.ctaUrl =
      action === "custom" && heroSection.ctaHref ? heroSection.ctaHref : "";
    const heroHighlights =
      heroSection.highlights?.filter((item): item is string => Boolean(item)) ??
      [];
    if (heroHighlights.length) {
      setArray(brandingForm.highlights, heroHighlights);
    } else {
      setArray(brandingForm.highlights, [""]);
    }
    const stats =
      heroSection.stats
        ?.map((item) => ({
          label: item?.label ? String(item.label) : "",
          value: item?.value ? String(item.value) : "",
        }))
        .filter((item) => item.label && item.value) ?? [];
    if (stats.length) {
      setArray(brandingForm.stats, stats);
    } else {
      setArray(brandingForm.stats, [{ label: "", value: "" }]);
    }
  }
  if (!heroSection) {
    setArray(brandingForm.highlights, [""]);
    setArray(brandingForm.stats, [{ label: "", value: "" }]);
    brandingForm.heroImageUrl = "";
    brandingForm.coverTheme = "";
  }
  const aboutSection = settings.sections?.find(
    (section) => section?.type?.toLowerCase() === "about"
  );
  if (aboutSection) {
    if (aboutSection.title) brandingForm.name = aboutSection.title;
    if (aboutSection.subtitle) brandingForm.tagline = aboutSection.subtitle;
    if (aboutSection.description) brandingForm.bio = aboutSection.description;
  }
  const contactSection = settings.sections?.find(
    (section) => section?.type?.toLowerCase() === "contact"
  );
  if (contactSection) {
    brandingForm.contactTitle = contactSection.title || "";
    brandingForm.contactSubtitle = contactSection.subtitle || "";
    brandingForm.contactCtaLabel = contactSection.ctaText || "";
    const contactAction =
      contactSection.ctaAction === "login" ||
      contactSection.ctaAction === "custom"
        ? contactSection.ctaAction
        : "register";
    brandingForm.contactCtaAction = contactAction as CtaAction;
    brandingForm.contactCtaUrl =
      contactAction === "custom" && contactSection.ctaHref
        ? contactSection.ctaHref
        : "";
  } else {
    brandingForm.contactTitle = "";
    brandingForm.contactSubtitle = "";
    brandingForm.contactCtaLabel = "";
    brandingForm.contactCtaAction = "register";
    brandingForm.contactCtaUrl = "";
  }
  const lessonEntries =
    settings.courses
      ?.map((lesson) => ({
        title: lesson.title || "",
        description: lesson.subtitle || "",
        coverUrl: lesson.coverUrl || "",
        tags: (lesson.tags || [])
          .filter((tag): tag is string => Boolean(tag))
          .join(", "),
        price: lesson.price != null ? String(lesson.price) : "",
      }))
      .filter((lesson) => lesson.title.length) ?? [];
  if (lessonEntries.length) {
    setArray(brandingForm.courses, lessonEntries.slice(0, MAX_COURSES));
  } else {
    setArray(brandingForm.courses, [
      { title: "", description: "", coverUrl: "", tags: "", price: "" },
    ]);
  }
  const social = settings.social;
  brandingForm.social.whatsapp = social?.whatsapp || "";
  brandingForm.social.telegram = social?.telegram || "";
  brandingForm.social.youtube = social?.youtube || "";
  brandingForm.social.website = social?.website || "";
  brandingForm.social.facebook = social?.facebook || "";
  brandingForm.social.instagram = social?.instagram || "";
  brandingForm.social.tiktok = social?.tiktok || "";
  brandingForm.social.phone =
    social?.phone || settings.footerContact?.phone || "";
  const footerContact = settings.footerContact;
  brandingForm.footerContact.whatsapp = footerContact?.whatsapp || "";
  brandingForm.footerContact.phone = footerContact?.phone || "";
  brandingForm.footerContact.email = footerContact?.email || "";
  brandingForm.footerContact.website = footerContact?.website || "";
  brandingForm.footerContact.facebook = footerContact?.facebook || "";
  brandingForm.footerContact.instagram = footerContact?.instagram || "";
  brandingForm.footerContact.linkedin = footerContact?.linkedin || "";
  brandingForm.footerContact.telegram = footerContact?.telegram || "";
  const seo = settings.seo;
  brandingForm.seoTitle = seo?.title || "";
  brandingForm.seoDescription = seo?.description || "";
  brandingForm.seoOgImage = seo?.ogImage || seo?.image || "";
  updateBrandingSnapshot();
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function buildBrandingPayload() {
  const base = cloneRecord(rawBranding.value);
  const nested = ensureBrandingDestination(base);

  nested.tagline = brandingForm.tagline.trim();
  nested.defaultLocale = brandingForm.defaultLocale === "ar" ? "ar" : "en";
  const colorPayload = {
    primary: emptyToNull(brandingForm.colors.primary) ?? undefined,
    secondary: emptyToNull(brandingForm.colors.secondary) ?? undefined,
    accent: emptyToNull(brandingForm.colors.accent) ?? undefined,
  };
  if (Object.values(colorPayload).some(Boolean)) {
    nested.colors = colorPayload;
  } else if (nested.colors) {
    delete nested.colors;
  }

  const hero = (
    typeof nested.hero === "object" && nested.hero !== null
      ? { ...nested.hero }
      : {}
  ) as Record<string, any>;
  hero.title = brandingForm.heroTitle.trim();
  hero.subtitle = brandingForm.heroSubtitle.trim();
  hero.quote = brandingForm.heroQuote.trim();
  hero.quoteAuthor = brandingForm.heroQuoteAuthor.trim();
  hero.ctaLabel = brandingForm.ctaLabel.trim();
  hero.cta = hero.ctaLabel;
  hero.actionLabel = hero.ctaLabel;
  hero.ctaAction = brandingForm.ctaAction;
  hero.action = brandingForm.ctaAction;
  const heroImageUrl = brandingForm.heroImageUrl.trim();
  if (heroImageUrl) {
    hero.imageUrl = heroImageUrl;
  } else {
    delete hero.imageUrl;
  }
  const coverTheme = brandingForm.coverTheme.trim();
  if (coverTheme) {
    hero.coverTheme = coverTheme;
  } else {
    delete hero.coverTheme;
  }
  if (brandingForm.ctaAction === "custom") {
    const url = brandingForm.ctaUrl.trim();
    hero.ctaUrl = url;
    hero.href = url;
  } else {
    delete hero.ctaUrl;
    delete hero.href;
  }
  nested.hero = hero;

  nested.highlights = brandingForm.highlights
    .map((item) => item.trim())
    .filter((item, index) => item.length && index < MAX_HIGHLIGHTS);

  nested.stats = brandingForm.stats
    .map((stat, index) => ({
      label: stat.label.trim(),
      value: stat.value.trim(),
      position: index + 1,
    }))
    .filter((stat) => stat.label.length && stat.value.length)
    .slice(0, MAX_STATS);

  nested.courses = brandingForm.courses
    .map((lesson) => ({
      title: lesson.title.trim(),
      description: lesson.description.trim(),
    }))
    .filter((lesson) => lesson.title.length || lesson.description.length)
    .slice(0, MAX_COURSES);

  const seo = (
    typeof nested.seo === "object" && nested.seo !== null
      ? { ...nested.seo }
      : {}
  ) as Record<string, any>;
  seo.title = brandingForm.seoTitle.trim();
  seo.description = brandingForm.seoDescription.trim();
  const seoOgImage = brandingForm.seoOgImage.trim();
  if (seoOgImage) {
    seo.ogImage = seoOgImage;
  } else {
    delete seo.ogImage;
  }
  if (seo.title || seo.description || seo.ogImage) {
    nested.seo = seo;
  } else if (nested.seo) {
    delete nested.seo;
  }

  base.branding = nested;
  base.tagline = brandingForm.tagline.trim();

  return base;
}

function buildLandingSettingsPayload(): TeacherLandingSettingsRequest {
  const slug = profile.value?.slug || landingSettings.value?.teacher.slug || "";
  const highlights = brandingForm.highlights
    .map((item) => item.trim())
    .filter((item, index) => item.length && index < MAX_HIGHLIGHTS);
  const stats = brandingForm.stats
    .map((stat, index) => ({
      label: stat.label.trim(),
      value: stat.value.trim(),
      position: index + 1,
    }))
    .filter((stat) => stat.label.length && stat.value.length)
    .slice(0, MAX_STATS);
  const heroAction = brandingForm.ctaAction;
  let ctaHref: string | undefined;
  if (heroAction === "login") {
    ctaHref = slug ? `/login?next=/teacher/${slug}/lesson/preview` : "/login";
  } else if (heroAction === "custom") {
    ctaHref = brandingForm.ctaUrl.trim() || undefined;
  } else {
    ctaHref = "#courses";
  }
  const coverTheme = brandingForm.coverTheme.trim();
  const heroImageUrl = brandingForm.heroImageUrl.trim();
  const heroSection = {
    type: "hero",
    title: brandingForm.heroTitle.trim(),
    subtitle: brandingForm.heroSubtitle.trim() || brandingForm.tagline.trim(),
    description: brandingForm.heroQuote.trim(),
    ctaText: brandingForm.ctaLabel.trim(),
    ctaHref,
    ctaAction: heroAction,
    imageUrl:
      emptyToNull(
        coverTheme ? `${COVER_THEME_PREFIX}${coverTheme}` : heroImageUrl
      ) ?? undefined,
    coverTheme: emptyToNull(coverTheme) ?? undefined,
    quoteAuthor: brandingForm.heroQuoteAuthor.trim() || undefined,
    highlights,
    stats,
  };
  const aboutSection = {
    type: "about",
    title: brandingForm.name.trim() || profile.value?.name || "",
    subtitle: brandingForm.tagline.trim(),
    description: brandingForm.bio.trim(),
    highlights,
  };
  const contactAction = brandingForm.contactCtaAction;
  const contactHref =
    contactAction === "custom"
      ? brandingForm.contactCtaUrl.trim() || undefined
      : undefined;
  const contactSection = {
    type: "contact",
    title: brandingForm.contactTitle.trim(),
    subtitle: brandingForm.contactSubtitle.trim(),
    ctaText: brandingForm.contactCtaLabel.trim(),
    ctaAction: contactAction,
    ctaHref: contactHref,
  };
  const courses = brandingForm.courses
    .map((lesson) => {
      const title = lesson.title.trim();
      if (!title.length) return null;
      const subtitle = lesson.description.trim();
      const coverUrl = lesson.coverUrl.trim();
      const tags = lesson.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag, index) => tag.length && index < 6);
      const priceRaw = lesson.price.trim();
      const priceValue = priceRaw.length
        ? Number.parseFloat(priceRaw)
        : undefined;
      return {
        id: title.toLowerCase().replace(/\s+/g, "-"),
        title,
        subtitle,
        coverUrl: coverUrl || undefined,
        tags,
        price:
          priceValue != null && !Number.isNaN(priceValue)
            ? priceValue
            : undefined,
      };
    })
    .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson))
    .slice(0, MAX_COURSES);

  return {
    teacher: {
      displayName: emptyToNull(brandingForm.name) ?? undefined,
      headline: emptyToNull(brandingForm.subject) ?? undefined,
      bio: emptyToNull(brandingForm.bio) ?? undefined,
      photoUrl: emptyToNull(brandingForm.photoUrl) ?? undefined,
      avatarUrl: emptyToNull(brandingForm.photoUrl) ?? undefined,
    },

    template: brandingForm.template,
    themePrimary: emptyToNull(brandingForm.colors.primary) ?? undefined,
    themeSecondary: emptyToNull(brandingForm.colors.secondary) ?? undefined,
    footerContact: {
      whatsapp: emptyToNull(brandingForm.footerContact.whatsapp) ?? undefined,
      phone:
        emptyToNull(brandingForm.footerContact.phone) ??
        emptyToNull(brandingForm.social.phone) ??
        undefined,
      email: emptyToNull(brandingForm.footerContact.email) ?? undefined,
      website: emptyToNull(brandingForm.footerContact.website) ?? undefined,
      facebook: emptyToNull(brandingForm.footerContact.facebook) ?? undefined,
      instagram: emptyToNull(brandingForm.footerContact.instagram) ?? undefined,
      linkedin: emptyToNull(brandingForm.footerContact.linkedin) ?? undefined,
      telegram: emptyToNull(brandingForm.footerContact.telegram) ?? undefined,
    },

    sections: [heroSection, aboutSection, contactSection],
    courses,
    social: {
      whatsapp: emptyToNull(brandingForm.social.whatsapp) ?? undefined,
      telegram: emptyToNull(brandingForm.social.telegram) ?? undefined,
      youtube: emptyToNull(brandingForm.social.youtube) ?? undefined,
      website: emptyToNull(brandingForm.social.website) ?? undefined,
      facebook: emptyToNull(brandingForm.social.facebook) ?? undefined,
      instagram: emptyToNull(brandingForm.social.instagram) ?? undefined,
      tiktok: emptyToNull(brandingForm.social.tiktok) ?? undefined,
      phone: emptyToNull(brandingForm.social.phone) ?? undefined,
    },
    seo: {
      title: emptyToNull(brandingForm.seoTitle) ?? undefined,
      description: emptyToNull(brandingForm.seoDescription) ?? undefined,
      ogImage: emptyToNull(brandingForm.seoOgImage) ?? undefined,
    },
  };
}

async function loadBranding(force = false): Promise<number | null> {
  try {
    const detail = await teacherProfileStore.fetchProfile(force);
    const activeProfile = detail ?? teacherProfileStore.profile ?? null;
    if (!activeProfile) {
      return null;
    }

    populateBranding(activeProfile);

    const slug =
      typeof activeProfile.slug === "string" ? activeProfile.slug.trim() : "";
    const normalizedSlug = slug ? slug.toLowerCase() : "";
    const teacherId =
      typeof activeProfile.id === "number" ? activeProfile.id : null;

    if (teacherId != null) {
      currentTeacherId = teacherId;
    }

    const needsTenantSync =
      (normalizedSlug && normalizedSlug !== (auth.tenantSlug ?? "")) ||
      (teacherId != null && auth.teacherId !== teacherId);

    if (needsTenantSync) {
      try {
        await auth.setTenantContext({
          teacherSlug: slug || undefined,
          teacherId,
        });
      } catch (error) {
        console.warn(
          "[TeacherLanding] failed to sync auth tenant context",
          error
        );
      }
    }

    return teacherId;
  } catch (error) {
    console.error("Failed to load teacher branding", error);
    return null;
  }
}

async function loadLandingSettingsForTeacher(
  teacherId: number,
  options: { force?: boolean } = {}
) {
  if (landingSettingsLoading.value) {
    return;
  }
  if (
    !options.force &&
    landingSettingsLoaded.value &&
    landingSettingsTeacherId === teacherId
  ) {
    return;
  }

  landingSettingsLoading.value = true;
  landingSettingsLoaded.value = false;
  try {
    const settings = await fetchTeacherLandingSettings(teacherId);
    applyLandingSettings(settings);
    landingSettingsLoaded.value = true;
    landingSettingsTeacherId = teacherId;
  } catch (error) {
    landingSettingsTeacherId = null;
    console.warn("Failed to load landing settings", error);
  } finally {
    landingSettingsLoading.value = false;
  }
}

async function saveBranding() {
  console.log(brandingForm.colors.primary);
  if (!profile.value) return;
  brandingSaving.value = true;
  try {
    const payload = {
      name: brandingForm.name.trim() || profile.value.name,
      subject: emptyToNull(brandingForm.subject),
      bio: emptyToNull(brandingForm.bio),
      photoUrl: emptyToNull(brandingForm.photoUrl),
      branding: buildBrandingPayload(),
      flags: profile.value.flags ?? null,
    };
    const updated = await updateCurrentTeacherProfile(payload);
    populateBranding(updated);
    let updatedSettings: TeacherLandingSettingsResponse | null = null;
    if (auth.teacherId != null) {
      const landingPayload = buildLandingSettingsPayload();
      updatedSettings = await updateTeacherLandingSettings(
        auth.teacherId,
        landingPayload
      );
      applyLandingSettings(updatedSettings);
    }
    const refreshedProfile = await teacherProfileStore.fetchProfile(true);
    if (refreshedProfile) {
      populateBranding(refreshedProfile);
    }
    const targetSlug =
      updatedSettings?.teacher.slug ||
      refreshedProfile?.slug ||
      updated.slug ||
      profile.value?.slug ||
      "";
    if (targetSlug) {
      teacherLandingStore.invalidate(targetSlug);
    }
    toast.success(t("landingContent.branding.success"));
  } catch (error) {
    console.error("Failed to update branding", error);
    toast.error(t("landingContent.branding.error"));
  } finally {
    brandingSaving.value = false;
  }
}

async function onPhotoSelected(files: File[]) {
  if (!files.length) {
    return;
  }
  const [file] = files;
  photoUploading.value = true;
  try {
    const result = await uploadTeacherAvatar(file);
    brandingForm.photoUrl = result.url ?? "";
    await teacherProfileStore.fetchProfile(true).catch((error) => {
      console.warn(
        "[TeacherLanding] Failed to refresh profile after avatar upload",
        error
      );
    });
    const slug =
      profile.value?.slug || landingSettings.value?.teacher?.slug || "";
    if (slug) {
      teacherLandingStore.invalidate(slug);
    }
    toast.success(t("landingContent.branding.photoUploadSuccess"));
  } catch (error) {
    console.error("Failed to upload teacher photo", error);
    toast.error(t("landingContent.branding.photoUploadError"));
  } finally {
    photoUploading.value = false;
    photoFiles.value = [];
  }
}

function onPhotoRemoved() {
  photoFiles.value = [];
}

async function onHeroImageSelected(files: File[]) {
  if (!files.length) {
    return;
  }
  if (auth.teacherId == null) {
    toast.error(t("landingContent.branding.heroImageUploadError"));
    return;
  }
  const [file] = files;
  heroImageUploading.value = true;
  try {
    const result = await uploadTeacherLandingImage(auth.teacherId, file);
    brandingForm.heroImageUrl = result.url ?? "";
    previewRefreshKey.value += 1;
    toast.success(t("landingContent.branding.heroImageUploadSuccess"));
  } catch (error) {
    console.error("Failed to upload hero image", error);
    toast.error(t("landingContent.branding.heroImageUploadError"));
  } finally {
    heroImageUploading.value = false;
    heroImageFiles.value = [];
  }
}

function onHeroImageRemoved() {
  heroImageFiles.value = [];
}

function clearHeroImage() {
  brandingForm.heroImageUrl = "";
  heroImageFiles.value = [];
}

async function onCourseCoverSelected(index: number, files: File[]) {
  if (!files.length) {
    return;
  }
  if (auth.teacherId == null) {
    toast.error(t("landingContent.branding.lessonCoverUploadError"));
    return;
  }
  const [file] = files;
  courseCoverUploading[index] = true;
  try {
    const result = await uploadTeacherLandingImage(auth.teacherId, file);
    brandingForm.courses[index].coverUrl = result.url ?? "";
    previewRefreshKey.value += 1;
    toast.success(t("landingContent.branding.lessonCoverUploadSuccess"));
  } catch (error) {
    console.error("Failed to upload lesson cover", error);
    toast.error(t("landingContent.branding.lessonCoverUploadError"));
  } finally {
    courseCoverUploading[index] = false;
    courseCoverFiles[index] = [];
  }
}

function onCourseCoverRemoved(index: number) {
  courseCoverFiles[index] = [];
}

function clearCourseCover(index: number) {
  brandingForm.courses[index].coverUrl = "";
  courseCoverFiles[index] = [];
}

function clearPhoto() {
  brandingForm.photoUrl = "";
  photoFiles.value = [];
}

function resetBranding() {
  if (!profile.value) return;
  rawBranding.value = cloneRecord(profile.value.branding ?? {});
  populateBranding(profile.value);
  applyLandingSettings(landingSettings.value);
}

function addHighlight() {
  if (!canAddHighlight.value) return;
  brandingForm.highlights.push("");
}

function removeHighlight(index: number) {
  if (brandingForm.highlights.length <= 1) return;
  brandingForm.highlights.splice(index, 1);
}

function addStat() {
  if (!canAddStat.value) return;
  brandingForm.stats.push({ label: "", value: "" });
}

function removeStat(index: number) {
  if (brandingForm.stats.length <= 1) return;
  brandingForm.stats.splice(index, 1);
}

function addLesson() {
  if (!canAddCourse.value) return;
  brandingForm.courses.push({
    title: "",
    description: "",
    coverUrl: "",
    tags: "",
    price: "",
  });
}

function removeLesson(index: number) {
  if (brandingForm.courses.length <= 1) return;
  brandingForm.courses.splice(index, 1);
}

const TEACHER_ROLES = new Set([
  "TEACHER",
  "TEACHER_ASSISTANT",
  "PLATFORM_ADMIN",
]);
const hasTeacherAccess = (role: string | null | undefined): boolean =>
  role != null && TEACHER_ROLES.has(role);
const isTeacherReady = computed(
  () => auth.initialized && hasTeacherAccess(auth.role)
);
const bootstrapInFlight = ref<Promise<void> | null>(null);

const bootstrapLanding = async (
  forceProfile = false,
  forceSettings = false
) => {
  if (bootstrapInFlight.value) {
    await bootstrapInFlight.value;
    return;
  }

  bootstrapInFlight.value = (async () => {
    const hydratedTeacherId = await loadBranding(forceProfile);
    const effectiveTeacherId =
      hydratedTeacherId ??
      profile.value?.id ??
      landingSettingsTeacherId ??
      null;

    if (effectiveTeacherId == null) {
      console.warn(
        "[TeacherLanding] unable to resolve teacher identifier during bootstrap"
      );
      if (!hasTeacherAccess(auth.role)) {
        console.info(
          "[TeacherLanding] redirecting to login due to missing teacher role"
        );
        await redirectToLogin();
        return;
      }
      if (teacherProfileStore.error === "UNAUTHORIZED") {
        console.info(
          "[TeacherLanding] redirecting to login due to missing session"
        );
        await redirectToLogin();
        return;
      }
      if (auth.initialized && auth.isAuthenticated && auth.teacherId == null) {
        console.warn(
          "[TeacherLanding] authenticated session missing teacher id"
        );
        toast.error(t("landingContent.branding.error"));
      }
      return;
    }

    currentTeacherId = effectiveTeacherId;

    await Promise.allSettled([
      loadLandingSettingsForTeacher(effectiveTeacherId, {
        force: forceSettings,
      }),
      landingContentStore.fetchAll(),
    ]);
  })();

  try {
    await bootstrapInFlight.value;
  } finally {
    bootstrapInFlight.value = null;
  }
};

watch(
  isTeacherReady,
  (ready) => {
    if (!ready) {
      return;
    }
    void bootstrapLanding(true, true);
  },
  { immediate: true }
);

watch(
  () => auth.teacherId,
  (teacherId) => {
    if (
      teacherId == null ||
      teacherId === currentTeacherId ||
      !hasTeacherAccess(auth.role)
    ) {
      return;
    }
    void bootstrapLanding(true, true);
  }
);

onMounted(() => {
  void auth.ensureSessionHydrated();
  window.addEventListener("beforeunload", beforeUnloadHandler);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", beforeUnloadHandler);
});

onBeforeRouteLeave((_to, _from, next) => {
  if (!isDirty.value) {
    next();
    return;
  }
  const leave = window.confirm(t("landingContent.unsavedLeaveConfirm"));
  if (leave) {
    next();
  } else {
    next(false);
  }
});

const onTestimonialPositionChange = (value: string | number | null) => {
  const parsed = Number(value);
  testimonialForm.position = Number.isNaN(parsed) ? undefined : parsed;
};

async function saveTestimonial() {
  const payload = {
    author: testimonialForm.author,
    quote: testimonialForm.quote,
    locale: testimonialForm.locale || undefined,
    position: testimonialForm.position,
  };
  if (testimonialForm.id) {
    await landingContentStore.updateTestimonial(testimonialForm.id, payload);
  } else {
    await landingContentStore.createTestimonial(payload);
  }
  resetTestimonial();
}

function editTestimonial(item: TestimonialResponse) {
  Object.assign(testimonialForm, item);
}

async function deleteTestimonial(id: number) {
  if (!confirm(t("landingContent.confirmDelete"))) return;
  await landingContentStore.deleteTestimonial(id);
  if (testimonialForm.id === id) {
    resetTestimonial();
  }
}

function resetTestimonial() {
  Object.assign(testimonialForm, {
    id: undefined,
    author: "",
    quote: "",
    locale: "",
    position: undefined,
  });
}

const onFaqPositionChange = (value: string | number | null) => {
  const parsed = Number(value);
  faqForm.position = Number.isNaN(parsed) ? undefined : parsed;
};

async function saveFaq() {
  const payload = {
    question: faqForm.question,
    answer: faqForm.answer,
    locale: faqForm.locale || undefined,
    position: faqForm.position,
  };
  if (faqForm.id) {
    await landingContentStore.updateFaq(faqForm.id, payload);
  } else {
    await landingContentStore.createFaq(payload);
  }
  resetFaq();
}

function editFaq(item: FaqResponse) {
  Object.assign(faqForm, item);
}

async function deleteFaq(id: number) {
  if (!confirm(t("landingContent.confirmDelete"))) return;
  await landingContentStore.deleteFaq(id);
  if (faqForm.id === id) {
    resetFaq();
  }
}

function resetFaq() {
  Object.assign(faqForm, {
    id: undefined,
    question: "",
    answer: "",
    locale: "",
    position: undefined,
  });
}
</script>

<style scoped>
.radio-toolbar {
  margin: 10px;
}

.radio-toolbar input[type="radio"] {
  opacity: 0;
  position: fixed;
  width: 0;
}

.radio-toolbar label {
  display: inline-block;
  background-color: #ddd;
  padding: 0;
  font-family: sans-serif, Arial;
  font-size: 16px;
  border: 2px solid transparent;
  border-radius: 4px;
  margin: 10px;
  font-weight: bold;
  width: 120px;
  height: 90px;
  line-height: 90px;
  text-align: center;
}

.radio-toolbar label.blueLabel {
  background-color: #2196f3;
  color: #fff;
}
.radio-toolbar label.purpleLabel {
  background-color: #673ab7;
  color: #fff;
}
.radio-toolbar label.orangeLabel {
  background-color: #ff9800;
  color: #fff;
}
.radio-toolbar label.brownLabel {
  background-color: #795548;
  color: #fff;
}

.radio-toolbar label.greenLabel {
  background-color: #00e676;
  color: #fff;
}
.radio-toolbar label.pinkLabel {
  background-color: #e91e63;
  color: #fff;
}
.radio-toolbar label.redLabel {
  background-color: #ff0000;
  color: #fff;
}
.radio-toolbar label.tealLabel {
  background-color: #009688;
  color: #fff;
}
.radio-toolbar label.yellowLabel {
  background-color: #efd510;
  color: #fff;
}
.radio-toolbar label.bluegreyLabel {
  background-color: #607d8b;
  color: #fff;
}
.radio-toolbar label.blackLabel {
  background-color: #a2c11c;
  color: #fff;
}
.radio-toolbar label.TurquoiseLabel {
  background-color: #00aaa0;
  color: #fff;
}

/* .radio-toolbar label:hover {
  background-color: #dfd;
} */

/* .radio-toolbar input[type="radio"]:focus + label {
  border: 2px dashed #444;
} */

.radio-toolbar input[type="radio"]:checked + label {
  /* background-color: #bfb; */
  border-color: #000;
}

.teacher-landing-content__tabs {
  margin-bottom: var(--sakai-space-2);
}

.teacher-landing-content__page :deep(.theme-page) {
  background: #f4f5fe;
  border-radius: var(--sakai-border-radius-xl);
  padding: clamp(var(--sakai-space-5), 4vw, var(--sakai-space-8));
  font-family: var(--sakai-font-family-base);
}

.teacher-landing-content__page :deep(.theme-page__header) {
  margin-bottom: var(--sakai-space-6);
}

.teacher-landing-content__page :deep(.ui-card) {
  border-radius: 1.5rem;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 4px 16px rgba(4, 6, 24, 0.08);
}

.teacher-landing-content__page :deep(.ui-tabs__nav),
.teacher-landing-content__page :deep(.ui-tabs__list) {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 0.35rem;
}

.teacher-landing-content__page :deep(.ui-tabs__item) {
  border-radius: 999px;
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-landing-content {
  display: grid;
  gap: var(--sakai-space-6);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.teacher-landing-content__panel {
  grid-column: 1 / -1;
  display: grid;
  gap: var(--sakai-space-6);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  align-content: start;
}

.teacher-landing-content__panel--preview,
.teacher-landing-content__panel--branding {
  grid-template-columns: 1fr;
}

.teacher-landing-content__card {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-landing-content__card--preview {
  grid-column: 1 / -1;
}

.teacher-landing-content__card--wide {
  grid-column: 1 / -1;
}

.teacher-landing-preview__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sakai-space-3);
  margin-bottom: var(--sakai-space-3);
}

.teacher-landing-preview__copy-dialog {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-landing-preview__copy-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
  justify-content: flex-end;
}

.teacher-landing-preview__device-toggle {
  max-width: 240px;
}

.teacher-landing-preview {
  position: relative;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  border-radius: var(--sakai-border-radius-xl);
  overflow: hidden;
  background: color-mix(in srgb, var(--sakai-surface-card) 92%, transparent);
  box-shadow: var(--sakai-shadow-md);
  transition: max-width var(--sakai-transition-duration)
    var(--sakai-transition-ease);
}

.teacher-landing-preview--tablet {
  max-width: 768px;
  box-shadow: var(--sakai-shadow-lg);
}

.teacher-landing-preview--mobile {
  max-width: 375px;
  aspect-ratio: 9 / 16;
  min-height: 520px;
  box-shadow: var(--sakai-shadow-lg);
}

.teacher-landing-preview__frame {
  width: 100%;
  height: 100%;
  border: none;
}

.teacher-landing-preview__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sakai-space-3);
  min-height: 200px;
  padding: var(--sakai-space-6);
  border-radius: var(--sakai-border-radius-xl);
  border: 1px dashed
    color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  color: var(--sakai-text-color-tertiary);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
  text-align: center;
}

.teacher-landing-preview__empty-main {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-landing-preview__empty-hint {
  margin: 0;
  font-size: 0.9rem;
  max-width: 36ch;
  line-height: 1.5;
}

.teacher-landing-content__form {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-landing-content__actions {
  display: flex;
  gap: var(--sakai-space-3);
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
}

.teacher-landing-content__dirty-badge {
  margin-inline-end: auto;
}

.teacher-landing-content__actions :deep(.ui-button) {
  white-space: nowrap;
}

.teacher-landing-content__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-landing-content__item {
  display: grid;
  gap: var(--sakai-space-2);
  padding: var(--sakai-space-3);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  border-radius: var(--sakai-border-radius-lg);
}

.teacher-landing-content__item-text {
  display: grid;
  gap: var(--sakai-space-1);
}

.teacher-landing-content__item-actions {
  display: flex;
  gap: var(--sakai-space-2);
}

.teacher-landing-branding {
  display: grid;
  gap: var(--sakai-space-5);
}

.teacher-landing-branding__grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: 1fr;
}

.teacher-landing-branding__section {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 94%, transparent);
}

.teacher-landing-branding__section--colors {
  background: color-mix(in srgb, var(--sakai-secondary) 8%, transparent);
}

.teacher-landing-branding__section--template {
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
}

.teacher-landing-branding__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.teacher-landing-branding__section-toggle {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  flex: 1;
  min-width: 0;
}

.teacher-landing-branding__section-toggle:hover {
  color: var(--sakai-primary-700);
}

.teacher-landing-branding__section-toggle:focus-visible {
  outline: 2px solid var(--sakai-primary);
  outline-offset: 2px;
  border-radius: var(--sakai-border-radius-md);
}

.teacher-landing-branding__section-chevron {
  flex-shrink: 0;
  transition: transform var(--sakai-transition-duration)
    var(--sakai-transition-ease);
  color: var(--sakai-text-color-tertiary);
}

.teacher-landing-branding__section-chevron.is-open {
  transform: rotate(-180deg);
  color: var(--sakai-primary);
}

.teacher-landing-branding__section-body {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-landing-template-grid {
  display: grid;
  gap: var(--sakai-space-3);
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.teacher-landing-template-card {
  display: grid;
  gap: var(--sakai-space-2);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
  cursor: pointer;
  text-align: left;
  transition: transform var(--sakai-transition-duration)
      var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease),
    border-color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.teacher-landing-template-card.is-active {
  border-color: var(--sakai-primary);
  box-shadow: var(--sakai-shadow-md);
}

.teacher-landing-template-card:focus-visible {
  outline: 2px solid var(--sakai-primary);
  outline-offset: 2px;
}

.teacher-landing-template-title {
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-landing-template-preview {
  height: 70px;
  border-radius: var(--sakai-border-radius-md);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: linear-gradient(135deg, #e2e8f0, #f8fafc);
}

.teacher-landing-template-preview--modern {
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
}

.teacher-landing-template-preview--minimal {
  background: #ffffff;
}

.teacher-landing-template-preview--classic {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-style: dashed;
}

.teacher-landing-branding__hint {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.teacher-landing-branding__field-grid {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-landing-branding__colors-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sakai-space-2);
  padding: var(--sakai-space-2);
  border-radius: var(--sakai-border-radius-md);
  background: color-mix(in srgb, var(--sakai-surface-card) 85%, transparent);
  border: 1px dashed
    color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
}

.teacher-landing-branding__colors-label {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-landing-branding__colors-swatches {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
}

.teacher-landing-branding__color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
}

.teacher-landing-branding__colors-chip {
  margin-inline-start: auto;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  color: #fff;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  box-shadow: var(--sakai-shadow-sm);
  white-space: nowrap;
}

.teacher-landing-branding__photo {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-landing-branding__photo-preview {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-3);
}

.teacher-landing-branding__image {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-landing-branding__image--compact {
  gap: var(--sakai-space-2);
}

.teacher-landing-branding__image-preview {
  display: grid;
  gap: var(--sakai-space-2);
}

.teacher-landing-branding__image-preview img {
  width: 100%;
  max-height: 220px;
  border-radius: var(--sakai-border-radius-md);
  object-fit: cover;
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
}

.teacher-landing-branding__image-preview--compact img {
  max-height: 160px;
}

@media (min-width: 720px) {
  .teacher-landing-branding__field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.teacher-landing-branding__list {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-landing-branding__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-md);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.teacher-landing-branding__list-item--two-columns {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  align-items: end;
}

.teacher-landing-branding__list-remove {
  justify-self: flex-end;
}

@media (max-width: 640px) {
  .teacher-landing-branding__section {
    padding: var(--sakai-space-3);
  }

  .teacher-landing-content__actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .teacher-landing-content__item {
    padding: var(--sakai-space-3);
  }

  .teacher-landing-branding__colors-chip {
    margin-inline-start: 0;
  }
}

@media (max-width: 768px) {
  .teacher-landing-content__actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .teacher-landing-content__actions :deep(.ui-button) {
    flex: 1 1 auto;
  }

  .teacher-landing-branding__list-item--two-columns {
    grid-template-columns: 1fr;
  }
}
</style>
