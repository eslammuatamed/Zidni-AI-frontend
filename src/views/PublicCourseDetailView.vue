<template>
  <div
    class="ltrContent"
    :class="{
      'public-course--rtl coursedetailsRtl': isRtl,
      'public-course--sticky': stickyCtaVisible,
    }"
  >
    <div class="navbar-area">
      <div class="container-fluid">
        <div class="top-header">
          <!-- <a class="navbar-brand" href="index.html">
          <img
            :src="'http://app-test.72.61.18.248.nip.io/src/assets/logo.ar.svg'"
            class="landing-header__logo details-logo"
            decoding="async"
            loading="lazy"
          />
        </a> -->
          <!-- <ul class="list-wrap m-0 p-0">
          <li class="socials">
            <a href="/#"><i class="pi pi-facebook"></i></a
            ><a href="/#"><i class="pi pi-twitter"></i></a
            ><a href="/#"><i class="pi pi-whatsapp"></i></a
            ><a href="/#"><i class="pi pi-linkedin"></i></a
            ><a href="/#"><i class="pi pi-youtube"></i></a>
          </li>
        </ul> -->
          <ul class="main-menu">
            <li>
              <RouterLink :to="teacherLandingHref">
                {{ t("teacherLanding.navigation.home") }}
              </RouterLink>
            </li>
            <li>
              <!-- <RouterLink
                :to="`/teacher/${routeValue}#courses`"
                class="topHeaderActionBtn"
                @click="trackLandingEvent('footer_register')"
              >
                {{ t("courses.coursesNav") }}
              </RouterLink> -->
              <a href="#customFooter">{{ t("courses.coursesNav") }}</a>
            </li>
            <!-- <li><a href="#">Instructors</a></li>
          <li><a href="#">Blog</a></li> -->
            <li>
              <a href="#customFooter">{{ t("courses.aboutNav") }}</a>
            </li>
            <li>
              <a href="#customFooter">{{ t("courses.contactNav") }}</a>
            </li>
            <li>
              <!-- <a href="#">{{ t("teacherLanding.navigation.assistant") }}</a> -->
              <RouterLink
                v-if="assistantLinkAvailable"
                :to="assistantLoginRoute"
              >
                {{ t("teacherLanding.navigation.assistant") }}
              </RouterLink>
            </li>
          </ul>
          <div>
            <button
              type="button"
              class="topHeaderActionBtn greenAction"
              @click="onTrackedLoginClick('footer_login')"
            >
              {{ t("teacherLanding.navigation.login") }}
            </button>
            <RouterLink
              :to="studentRegisterRoute"
              class="topHeaderActionBtn"
              @click="trackLandingEvent('footer_register')"
            >
              {{ t("teacherLanding.navigation.register") }}
            </RouterLink>
            <!-- <a href="register.html" class="sign-in">
            <i class="ri-login-box-line"></i>
            En
          </a> -->
            <button
              type="button"
              class="landing-header__language"
              :aria-label="languageToggleAria"
              @click="toggleLanguage"
            >
              {{ t("courses.languageNa") }}
            </button>
          </div>
          <button
            type="button"
            class="top-header__menu-toggle"
            :aria-expanded="topHeaderMenuOpen"
            :aria-label="t('teacherLanding.navigation.menu')"
            @click="topHeaderMenuOpen = !topHeaderMenuOpen"
          >
            <i :class="topHeaderMenuOpen ? 'pi pi-times' : 'pi pi-bars'"></i>
          </button>
        </div>
        <div v-show="topHeaderMenuOpen" class="top-header__mobile-panel">
          <RouterLink :to="teacherLandingHref" @click="topHeaderMenuOpen = false">
            {{ t("teacherLanding.navigation.home") }}
          </RouterLink>
          <a href="#customFooter" @click="topHeaderMenuOpen = false">{{
            t("courses.coursesNav")
          }}</a>
          <a href="#customFooter" @click="topHeaderMenuOpen = false">{{
            t("courses.aboutNav")
          }}</a>
          <a href="#customFooter" @click="topHeaderMenuOpen = false">{{
            t("courses.contactNav")
          }}</a>
          <RouterLink
            v-if="assistantLinkAvailable"
            :to="assistantLoginRoute"
            @click="topHeaderMenuOpen = false"
          >
            {{ t("teacherLanding.navigation.assistant") }}
          </RouterLink>
          <button
            type="button"
            class="topHeaderActionBtn greenAction"
            @click="
              topHeaderMenuOpen = false;
              onTrackedLoginClick('footer_login');
            "
          >
            {{ t("teacherLanding.navigation.login") }}
          </button>
          <RouterLink
            :to="studentRegisterRoute"
            class="topHeaderActionBtn"
            @click="
              topHeaderMenuOpen = false;
              trackLandingEvent('footer_register');
            "
          >
            {{ t("teacherLanding.navigation.register") }}
          </RouterLink>
          <button
            type="button"
            class="landing-header__language top-header__mobile-language"
            :aria-label="languageToggleAria"
            @click="
              topHeaderMenuOpen = false;
              toggleLanguage();
            "
          >
            {{ t("courses.languageNa") }}
          </button>
        </div>
      </div>
    </div>

    <div class="page-title-area page-title-area-details">
      <div class="container-fluid">
        <div class="page-shape-wrap">
          <div class="page-title-content">
            <ul>
              <li>
                <a href="#"> {{ t("courses.courseBreadCrumb") }} </a>
              </li>

              <li class="active">{{ t("courses.courseDetailsBreadCrumb") }}</li>
            </ul>
            <h2>{{ course?.title }}</h2>
            <p>{{ course?.description }}</p>
            <div class="course-statistics">
              <h6 class="mt-2 mb-0 statusBtns">
                <a href="#" class="btn btn-primary btn-sm m-1"
                  >{{ t("courses.courseType") }} : {{ course?.type }}</a
                ><a
                  href="javascript:void(0);"
                  class="btn btn-secondary btn-sm m-1"
                >
                  {{ t("courses.courseLevel") }}: {{ course?.level }}</a
                ><a
                  data-v-759f00b9=""
                  href="javascript:void(0);"
                  class="btn btn-info btn-sm m-1"
                >
                  {{ t("courses.courseLanguage") }}: {{ course?.language }}</a
                >
              </h6>
            </div>
            <!-- <v-rating v-model="rating" length="5" size="32" /> -->

            <div class="courseMetaDa">
              <ul class="courses__item-meta list-wrap">
                <li>
                  <div class="author">
                    <!-- <a href="/course-details#">
                    <img
                      src="https://preview.sprukomarket.com/html/listing/eudica/Eudica/assets/images/users/female/25.jpg"
                      class="brround avatar-xxl"
                      alt="user"
                    /> </a> -->
                    <UiAvatar
                      :src="teacherAvatarSrc"
                      :name="teacher?.name"
                      size="md"
                    />
                    <span>{{ course?.instructor || teacher?.name }}</span>
                  </div>
                </li>
                <li><i class="pi pi-book"></i> {{ course?.stats?.lessons }}</li>
                <li><i class="pi pi-clock"></i> {{ course?.duration }}h</li>
                <!-- <li><i class="flaticon-user-1"></i> 18</li> -->
                <li>
                  <!-- <span
                  v-for="star in 5"
                  :key="star"
                  class="star"
                  :class="{ active: star <= course?.reviews?.count }"
                >
                  ★
                </span> -->
                  <div class="rating">
                    <i
                      v-for="star in 5"
                      :key="star"
                      :class="{ active: star <= course?.reviews?.count }"
                      class="pi pi-star-fill"
                    ></i>
                    <!-- <i class="pi pi-star-fill"></i>
                  <i class="pi pi-star-fill"></i>
                  <i class="pi pi-star-fill"></i>
                  <i class="pi pi-star-fill"></i> -->
                    <span class="rating-count"
                      >({{ course?.reviews?.count }})</span
                    >
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="courseMainContent">
      <div class="container-fluid">
        <div class="row">
          <div class="col-xl-8 col-lg-8 col-md-12">
            <div class="rightContentTabs">
              <v-sheet elevation="2">
                <v-tabs v-model="tab" inset class="mb-2">
                  <v-tab value="one">{{
                    t("courses.courseInformation")
                  }}</v-tab>
                  <!-- <v-tab value="two">Curriculum</v-tab> -->
                  <v-tab value="three">{{ t("courses.courseReviews") }}</v-tab>
                  <!-- <v-tab value="four">Ratings</v-tab> -->
                  <!-- <v-tab value="five">Refund / Policy Info</v-tab> -->
                </v-tabs>

                <v-tabs-window v-model="tab">
                  <v-tabs-window-item value="one">
                    <v-sheet class="pa-5">
                      <div class="sectionBlock">
                        <h3 class="card-title mb-3 font-weight-bold">
                          {{ t("courses.whatYouWillLearn") }}
                        </h3>
                        <hr />
                        <div class="row">
                          <div
                            v-for="learn in sortedCoursesLast"
                            :key="learn"
                            class="col-6"
                          >
                            <div class="learn-item">
                              <i class="pi pi-check"></i>
                              <h3 class="learn-title">
                                {{ learn?.learnText }}
                              </h3>
                            </div>
                          </div>
                        </div>

                        <!-- <div v-html="course?.whatYouWillLearn"></div> -->
                      </div>
                      <div class="sectionBlock">
                        <h3 class="card-title mb-3 font-weight-bold">
                          {{ t("courses.Description") }}
                        </h3>
                        <hr />
                        <p>{{ course?.description }}</p>
                      </div>
                      <div class="sectionBlock">
                        <h3 class="card-title mb-3 font-weight-bold">
                          {{ t("courses.Requirements") }}
                        </h3>
                        <hr />
                        <p v-html="course?.courseRequirements"></p>
                      </div>

                      <div class="sectionBlock">
                        <h3 class="card-title mb-3 font-weight-bold">
                          {{ t("courses.Topics") }}
                        </h3>
                        <hr />
                        <UiAccordion
                          v-if="curriculumItems.length"
                          class="public-course__curriculum"
                          :items="curriculumItems"
                          multiple
                          :collapsible="true"
                        >
                          <template #content="{ item }">
                            <p class="public-course__module-description">
                              {{ item.content }}
                            </p>
                          </template>
                        </UiAccordion>
                      </div>
                      <div class="sectionBlock">
                        <h3 class="card-title mb-3 font-weight-bold">
                          {{ t("courses.courseHasCertificate") }}
                        </h3>
                        <p>
                          {{ course?.certificateInfo == "true" ? "yes" : "no" }}
                        </p>

                        <hr />
                      </div>
                    </v-sheet>
                  </v-tabs-window-item>
                  <!-- <v-tabs-window-item value="two">
                  <v-sheet class="pa-5">
                    <UiAccordion
                      v-if="curriculumItems.length"
                      class="public-course__curriculum"
                      :items="curriculumItems"
                      multiple
                      :collapsible="true"
                    >
                      <template #content="{ item }">
                        <p class="public-course__module-description">
                          {{ item.content }}
                        </p>
                      </template>
                    </UiAccordion>
                  </v-sheet>
                </v-tabs-window-item> -->
                  <v-tabs-window-item value="three">
                    <v-sheet class="pa-5">
                      <section class="public-course__section">
                        <h2 class="public-course__section-title">
                          {{ t("publicCourse.reviewsTitle") }}
                        </h2>
                        <div
                          v-if="course.reviews?.count"
                          class="public-course__reviews-summary"
                        >
                          <UiIcon name="StarFilled" color="warning" />
                          <span>
                            {{ course.reviews.rating?.toFixed(1) ?? "0.0" }} ·
                            {{
                              t("publicCourse.reviewsCount", {
                                count: course.reviews.count,
                              })
                            }}
                          </span>
                        </div>
                        <p v-else class="public-course__empty">
                          {{ t("publicCourse.reviewsEmpty") }}
                        </p>
                        <CourseReviewsList
                          v-if="reviewsFeatureEnabled && course"
                          class="public-course__reviews-list"
                          :course-id="course.id"
                          :tenant-slug="slug"
                          :preview="isPreview"
                          :show-summary="false"
                        />
                      </section>
                    </v-sheet>
                  </v-tabs-window-item>
                  <!-- <v-tabs-window-item value="four">
                  <v-sheet class="pa-5">
                    <v-progress-linear
                      color="teal"
                      :model-value="course?.reviews?.rating"
                      rounded
                    ></v-progress-linear>
                  </v-sheet>
                </v-tabs-window-item> -->
                  <v-tabs-window-item value="five">
                    <v-sheet class="pa-5">
                      <div v-html="course?.refundPolicy"></div>
                    </v-sheet>
                  </v-tabs-window-item>
                </v-tabs-window>
              </v-sheet>
            </div>
          </div>
          <div class="col-xl-4 col-lg-4 col-md-12">
            <v-dialog v-model="dialog" max-width="960">
              <v-card class="public-course-preview-dialog">
                <v-card-title class="public-course-preview-dialog__header">
                  <div class="public-course-preview-dialog__copy">
                    <h3 class="public-course-preview-dialog__title">
                      {{ t("courses.CourseIntro") }}
                    </h3>
                  </div>
                  <button
                    type="button"
                    class="public-course-preview-dialog__close"
                    @click="closeDialog"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </v-card-title>

                <v-card-text class="public-course-preview-dialog__body">
                  <div class="public-course-preview-dialog__frame">
                    <iframe
                      v-if="coursePreviewYoutubeEmbedUrl"
                      class="public-course-preview-dialog__embed"
                      :src="coursePreviewYoutubeEmbedUrl"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowfullscreen
                    ></iframe>
                    <MediaVideoPlayer
                      v-else-if="coursePreviewVideoPlayerUrl"
                      class="public-course-preview-player public-course-preview-dialog__player"
                      :src="coursePreviewVideoPlayerUrl"
                      controls
                      playsinline
                      crossorigin="anonymous"
                    />
                    <UiAlert v-else color="info" variant="soft">
                      {{ t("courses.CourseIntro") }}
                    </UiAlert>
                  </div>
                </v-card-text>
              </v-card>
            </v-dialog>
            <!-- <div class="coursePreview">
            <div class="courses-video-img">
              <img :src="course?.thumbnailUrl" alt="Image" />

              <div class="video-play">
                <a @click="dialog = true" class="video-btn popup-youtube">
                  <i class="pi pi-play"></i>
                </a>
              </div>
            </div>
          </div> -->

            <div class="course-price">
              <div class="card">
                <div class="card-body">
                  <div class="coursePreview">
                    <div class="courses-video-img public-course-preview-card">
                      <img
                        class="public-course-preview-card__image"
                        :src="course?.thumbnailUrl || teacherAvatarSrc"
                        alt="Image"
                      />

                      <div class="public-course-preview-card__veil"></div>
                      <div class="public-course-preview-card__content">
                        <h4 class="public-course-preview-card__title">
                          {{ t("courses.CourseIntro") }}
                        </h4>
                        <p class="public-course-preview-card__meta">
                          {{ coursePreviewKindLabel }}
                        </p>
                      </div>

                      <div class="video-play">
                        <button
                          v-if="hasCoursePreviewVideo"
                          type="button"
                          @click="dialog = true"
                          class="video-btn popup-youtube public-course-preview-card__play"
                        >
                          <i class="pi pi-play"></i>
                        </button>
                        <div
                          v-else
                          class="public-course-preview-card__empty"
                        >
                          {{ t("courses.CourseIntro") }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mb-5">
                    <div class="text-dark mb-2 coursePricing">
                      <h4 class="price">
                        <strong>{{ t("courses.Costs") }}:</strong
                        >{{ course?.currency }}{{ course?.price }}
                      </h4>
                      <!-- <strong class="text-dark font-weight-semibold h1">Costs:</strong><span class="font-weight-normal">{{course?.currency}}</span><span class="text-dark font-weight-semibold h1">{{course?.price}}</span>  -->

                      <!-- <span class="text-muted h3 font-weight-normal ms-1"
                      ><span class="strike-text">$155</span></span
                    > -->
                    </div>

                    <!-- <p class="text-danger">
                    <i class="fe fe-clock me-1"></i> 5 days to left of this
                    Price
                  </p> -->
                  </div>
                  <div class="">
                    <!-- <a
                    href="javascript:void(0);"
                    class="btn btn-primary btn-lg btn-block"
                    >Buy Now</a
                  > -->
                    <!-- <UiButton
                    v-if="course"
                    class="btn btn-secondary btn-lg btn-block"

                    :loading="enrollmentLoading"
                    @click="handleEnrollmentCta"
                  >
                    {{ enrollmentCtaLabel }}
                  </UiButton> -->
                    <UiButton
                      v-if="course"
                      class="btn btn-secondary btn-lg btn-block btnEEnrolll"
                      :loading="enrollmentLoading"
                      @click="handleEnrollmentCta"
                    >
                      {{ enrollmentCtaLabel }}
                    </UiButton>
                    <!-- <a
                      @click="handleEnrollmentCta"
                      href="javascript:void(0);"
                      class="btn btn-secondary btn-lg btn-block"
                      >{{ t("courses.Enroll") }}</a
                    > -->
                    <!-- <a
                    href="javascript:void(0);"
                    class="btn btn-info btn-lg btn-block"
                    >Trail Now</a
                  > -->
                  </div>
                </div>
              </div>
            </div>
            <!-- 
          <div class="courseInstructo">
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">Course Instructor</h3>
              </div>
              <div class="card-body item-user">
                <div class="profile-pic mb-0">
                  <div>
                    <a href="userprofile.html" class="text-dark"
                      ><h4 class="mt-3 mb-1 font-semibold">
                        {{ course?.instructor }}
                      </h4></a
                    >
                    <span class="text-content-muted">Member Since November 2008</span>
                  </div>
                  <h6 class="mt-2 mb-0 statusBtns">
                    <a href="profile.html" class="btn btn-primary btn-sm m-1"
                      >See All Course</a
                    >
                    <a
                      href="javascript:void(0);"
                      class="btn btn-secondary btn-sm m-1"
                      >1245 Views</a
                    >
                    <a
                      href="javascript:void(0);"
                      class="btn btn-info btn-sm m-1"
                      >850 Courses</a
                    >
                  </h6>
                </div>
              </div>
            </div>
          </div> -->
            <div class="courseInstructo">
              <div class="card">
                <div class="card-header">
                  <h3 class="card-title">
                    {{ t("publicCourse.offersTitle") }}
                  </h3>
                </div>
                <div class="card-body item-user">
                  <div class="product-tags clearfix">
                    <section class="public-course__section">
                      <!-- <h2                                                                                         > -->
                      <ul
                        v-if="course?.offers?.length"
                        class="public-course__offers"
                      >
                        <li
                          v-for="offer in course?.offers"
                          :key="offer.code"
                          class="public-course__offer"
                        >
                          <UiTag
                            color="secondary"
                            variant="solid"
                            pill
                            size="sm"
                            >{{ offer.code }}</UiTag
                          >
                          <div class="public-course__offer-body">
                            <p class="public-course__offer-value">
                              {{ formatOfferValue(offer) }}
                            </p>
                            <p
                              v-if="offer.validUntil"
                              class="public-course__offer-meta"
                            >
                              {{
                                t("publicCourse.offerValidUntil", {
                                  date: formatDate(offer.validUntil),
                                })
                              }}
                            </p>
                          </div>
                        </li>
                      </ul>
                      <p v-else class="public-course__empty">
                        {{ t("publicCourse.offersEmpty") }}
                      </p>
                    </section>
                    <div class="text-center my-3">
                      <UiButton
                        variant="outline"
                        color="secondary"
                        class="public-course__sticky-share"
                        prepend-icon="pi-share-alt"
                        :aria-label="t('publicCourse.share')"
                        :disabled="sharing"
                        @click="handleShare"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer
      :footerSocialLinks="footerSocialLinks"
      :footerPhoneLink="footerPhoneLink"
      :featuredCourses="featuredCourses"
      :teacherSlug="teacherLandingSlug"
      :academyName="academyName"
      :aboutText="footerAboutText"
    />
  </div>

  <!-- <ThemePage>
    <div
      class="public-course"
      :class="{
        'public-course--rtl': isRtl,
        'public-course--sticky': stickyCtaVisible,
      }"
      :style="themeStyle"
    >
      <section
        v-if="course && teacher"
        class="public-course__hero"
        :class="{ 'public-course__hero--image': Boolean(courseHeroImage) }"
        :style="heroStyle"
        ref="heroSection"
      >
        <div class="public-course__hero-inner">
          <UiButton
            variant="link"
            color="secondary"
            class="public-course__back"
            prepend-icon="ArrowLeftOutlined"
            @click="goBack"
          >
            {{ t("publicCourse.back") }}
          </UiButton>
          <div v-if="heroBanner" class="public-course__hero-banner">
            <span class="public-course__hero-banner-icon">
              <UiIcon :name="heroBanner.icon" :size="18" />
            </span>
            <div class="public-course__hero-banner-body">
              <p class="public-course__hero-banner-title">
                {{ heroBanner.title }}
              </p>
              <p class="public-course__hero-banner-meta">
                {{ heroBanner.meta }}
              </p>
            </div>
            <UiButton
              v-if="heroBanner.action"
              variant="link"
              color="secondary"
              size="sm"
              class="public-course__hero-banner-cta"
              @click="heroBanner.action?.()"
            >
              {{ heroBanner.actionLabel }}
            </UiButton>
          </div>
          <div class="public-course__hero-body">
            <div class="public-course__hero-main">
              <div class="public-course__chips">
                <UiTag
                  v-if="course.type"
                  color="secondary"
                  variant="solid"
                  pill
                  size="sm"
                >
                  {{ course.type }}
                </UiTag>
                <UiTag
                  v-if="course.level"
                  color="primary"
                  variant="soft"
                  pill
                  size="sm"
                >
                  {{ course.level }}
                </UiTag>
                <UiTag
                  v-if="course.language"
                  color="primary"
                  variant="outline"
                  pill
                  size="sm"
                >
                  {{ course.language.toUpperCase() }}
                </UiTag>
                <UiTag color="secondary" variant="soft" pill size="sm">
                  {{ priceLabel }}
                </UiTag>
              </div>
              <h1 class="public-course__title">{{ course.title }}</h1>
              <p class="public-course__summary">
                {{ course.description || t("publicCourse.noDescription") }}
              </p>
              <div class="public-course__hero-footer">
                <div class="public-course__cta">
                  <UiButton
                    v-if="course"
                    color="primary"
                    size="lg"
                    :loading="enrollmentLoading"
                    @click="handleEnrollmentCta"
                  >
                    {{ enrollmentCtaLabel }}
                  </UiButton>
                  <UiButton
                    v-if="course.cta?.liveRoute"
                    variant="tonal"
                    color="primary"
                    size="lg"
                    @click="navigateTo(course.cta.liveRoute)"
                  >
                    {{ t("publicCourse.cta.live") }}
                  </UiButton>
                  <UiButton
                    v-if="course.cta?.tutoringRoute"
                    variant="soft"
                    color="secondary"
                    size="lg"
                    @click="navigateTo(course.cta.tutoringRoute)"
                  >
                    {{ t("publicCourse.cta.tutoring") }}
                  </UiButton>
                  <UiButton
                    v-if="course && teacher"
                    variant="outline"
                    color="secondary"
                    size="lg"
                    prepend-icon="ShoppingCartOutlined"
                    @click="handleSubscriptionCta"
                  >
                    {{ t("publicCourse.cta.subscribe") }}
                  </UiButton>
                  <UiButton
                    v-if="course"
                    variant="link"
                    color="secondary"
                    size="md"
                    class="public-course__share"
                    prepend-icon="ShareAltOutlined"
                    :disabled="sharing"
                    @click="handleShare"
                  >
                    {{ t("publicCourse.share") }}
                  </UiButton>
                </div>
                <div class="public-course__stats">
                  <div
                    v-for="item in statsItems"
                    :key="item.key"
                    class="public-course__stat"
                  >
                    <span class="public-course__stat-icon">
                      <UiIcon :name="item.icon" :size="22" />
                    </span>
                    <div class="public-course__stat-body">
                      <span class="public-course__stat-value">{{
                        item.value
                      }}</span>
                      <span class="public-course__stat-label">{{
                        item.label
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <aside class="public-course__teacher">
              <p class="public-course__teacher-header">
                {{ t("publicCourse.teacherHeader") }}
              </p>
              <TeacherLandingHeader
                :teacher="teacherHeader || teacher"
                :landing-href="teacherLandingHref"
                :register-href="teacherRegisterHref"
                :aria-label="t('teacherLanding.navigation.label')"
              />
              <div
                v-if="course.reviews?.count"
                class="public-course__reviews public-course__reviews--hero"
              >
                <UiIcon name="StarFilled" color="warning" />
                <span>
                  {{ course.reviews.rating?.toFixed(1) ?? "0.0" }} ·
                  {{
                    t("publicCourse.reviewsCount", {
                      count: course.reviews.count,
                    })
                  }}
                </span>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <div class="public-course__content">
        <div v-if="loading && !course" class="public-course__loading">
          <div class="public-course__loading-hero">
            <UiSkeleton height="2.75rem" />
            <UiSkeleton height="1.25rem" />
            <UiSkeleton width="11rem" height="2.5rem" shape="pill" />
          </div>
          <div class="public-course__loading-section">
            <UiSkeleton height="1.5rem" />
            <UiSkeleton height="10rem" />
          </div>
        </div>
        <UiAlert
          v-else-if="notFound"
          color="warning"
          variant="soft"
          class="public-course__alert"
        >
          <div class="public-course__alert-content">
            <div class="public-course__alert-text">
              <p class="public-course__alert-title">
                {{ t("publicCourse.notFound.title") }}
              </p>
              <p class="public-course__alert-description">
                {{ t("publicCourse.notFound.description") }}
              </p>
            </div>
            <UiButton size="md" color="primary" variant="soft" @click="goBack">
              {{ t("publicCourse.back") }}
            </UiButton>
          </div>
        </UiAlert>
        <UiAlert
          v-else-if="error"
          color="danger"
          variant="soft"
          class="public-course__alert"
        >
          {{ t("publicCourse.loadError") }}
        </UiAlert>
        <template v-else-if="course && teacher">
          <section
            v-if="highlightItems.length"
            class="public-course__section public-course__section--accent"
          >
            <h2 class="public-course__section-title">
              {{ t("publicCourse.glanceTitle") }}
            </h2>
            <div class="public-course__highlights">
              <article
                v-for="item in highlightItems"
                :key="item.key"
                class="public-course__highlight"
              >
                <span class="public-course__highlight-icon">
                  <UiIcon :name="item.icon" :size="24" />
                </span>
                <div class="public-course__highlight-body">
                  <p class="public-course__highlight-label">{{ item.label }}</p>
                  <p class="public-course__highlight-value">{{ item.value }}</p>
                  <p
                    v-if="item.description"
                    class="public-course__highlight-description"
                  >
                    {{ item.description }}
                  </p>
                </div>
              </article>
            </div>
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">
              {{ t("publicCourse.aboutTitle") }}
            </h2>
            <p class="public-course__section-text">
              {{ course.description || t("publicCourse.noDescription") }}
            </p>
          </section>
          <section ref="curriculumSection" class="public-course__section">
            <h2 class="public-course__section-title">
              {{ t("publicCourse.curriculumTitle") }}
            </h2>
            <UiAccordion
              v-if="curriculumItems.length"
              class="public-course__curriculum"
              :items="curriculumItems"
              multiple
              :collapsible="true"
            >
              <template #content="{ item }">
                <p class="public-course__module-description">
                  {{ item.content }}
                </p>
              </template>
            </UiAccordion>
            <p v-else class="public-course__empty">
              {{ t("publicCourse.curriculumEmpty") }}
            </p>
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">
              {{ t("publicCourse.nextLivesTitle") }}
            </h2>
            <ul
              v-if="course.nextLiveSessions?.length"
              class="public-course__list public-course__list--timeline"
            >
              <li
                v-for="session in course.nextLiveSessions"
                :key="session.id"
                class="public-course__list-item"
              >
                <UiIcon name="CalendarOutlined" />
                <div class="public-course__list-content">
                  <p class="public-course__list-title">{{ session.title }}</p>
                  <p class="public-course__list-meta">
                    {{ formatDateTime(session.scheduledAt) }} ·
                    {{ formatDuration(session.durationMinutes) }}
                  </p>
                </div>
                <UiButton
                  class="public-course__list-action"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  prepend-icon="CalendarOutlined"
                  :loading="calendarDownloadId === session.id"
                  :aria-label="t('publicCourse.liveAddToCalendar')"
                  @click="downloadLiveSessionCalendar(session)"
                >
                  {{ t("publicCourse.liveAddToCalendar") }}
                </UiButton>
              </li>
            </ul>
            <p v-else class="public-course__empty">
              {{ t("publicCourse.nextLivesEmpty") }}
            </p>
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">
              {{ t("publicCourse.offersTitle") }}
            </h2>
            <ul v-if="course.offers?.length" class="public-course__offers">
              <li
                v-for="offer in course.offers"
                :key="offer.code"
                class="public-course__offer"
              >
                <UiTag color="secondary" variant="solid" pill size="sm">{{
                  offer.code
                }}</UiTag>
                <div class="public-course__offer-body">
                  <p class="public-course__offer-value">
                    {{ formatOfferValue(offer) }}
                  </p>
                  <p v-if="offer.validUntil" class="public-course__offer-meta">
                    {{
                      t("publicCourse.offerValidUntil", {
                        date: formatDate(offer.validUntil),
                      })
                    }}
                  </p>
                </div>
              </li>
            </ul>
            <p v-else class="public-course__empty">
              {{ t("publicCourse.offersEmpty") }}
            </p>
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">
              {{ t("publicCourse.samplesTitle") }}
            </h2>
            <div
              v-if="course.sampleLessons?.length"
              class="public-course__samples"
            >
              <article
                v-for="sample in course.sampleLessons"
                :key="sample.lessonId"
                class="public-course__sample"
              >
                <div class="public-course__sample-video" v-if="sample.ytId">
                  <iframe
                    :src="youtubeEmbed(sample.ytId)"
                    :title="sample.title"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    loading="lazy"
                    allowfullscreen
                    referrerpolicy="strict-origin-when-cross-origin"
                  ></iframe>
                </div>
                <h3 class="public-course__sample-title">{{ sample.title }}</h3>
                <p
                  v-if="sample.durationMinutes"
                  class="public-course__sample-meta"
                >
                  {{ formatDuration(sample.durationMinutes) }}
                </p>
              </article>
            </div>
            <p v-else class="public-course__empty">
              {{ t("publicCourse.samplesEmpty") }}
            </p>
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">
              {{ t("publicCourse.reviewsTitle") }}
            </h2>
            <div
              v-if="course.reviews?.count"
              class="public-course__reviews-summary"
            >
              <UiIcon name="StarFilled" color="warning" />
              <span>
                {{ course.reviews.rating?.toFixed(1) ?? "0.0" }} ·
                {{
                  t("publicCourse.reviewsCount", {
                    count: course.reviews.count,
                  })
                }}
              </span>
            </div>
            <p v-else class="public-course__empty">
              {{ t("publicCourse.reviewsEmpty") }}
            </p>
            <CourseReviewsList
              v-if="reviewsFeatureEnabled && course"
              class="public-course__reviews-list"
              :course-id="course.id"
              :tenant-slug="slug"
              :preview="isPreview"
              :show-summary="false"
            />
          </section>
          <section class="public-course__section">
            <h2 class="public-course__section-title">
              {{ t("publicCourse.teacherTitle") }}
            </h2>
            <div class="public-course__teacher-card">
              <UiAvatar
                :src="teacherAvatarSrc"
                :name="teacher.name"
                size="lg"
              />
              <div>
                <p class="public-course__teacher-name">{{ teacher.name }}</p>
                <p
                  v-if="teacher.subject"
                  class="public-course__teacher-subject"
                >
                  {{ teacher.subject }}
                </p>
                <p
                  v-if="teacher.tagline"
                  class="public-course__teacher-tagline"
                >
                  {{ teacher.tagline }}
                </p>
              </div>
            </div>
          </section>
        </template>
      </div>
      <Transition name="public-course__sticky-transition">
        <div
          v-if="course && teacher && stickyCtaVisible"
          class="public-course__sticky-cta"
        >
          <div class="public-course__sticky-info">
            <p class="public-course__sticky-title">{{ course.title }}</p>
            <p class="public-course__sticky-price">{{ priceLabel }}</p>
          </div>
          <div class="public-course__sticky-actions">
            <UiButton
              variant="outline"
              color="secondary"
              class="public-course__sticky-share"
              prepend-icon="ShareAltOutlined"
              :aria-label="t('publicCourse.share')"
              :disabled="sharing"
              @click="handleShare"
            />
            <UiButton
              color="primary"
              size="md"
              :loading="enrollmentLoading"
              @click="handleEnrollmentCta"
            >
              {{ enrollmentCtaLabel }}
            </UiButton>
          </div>
        </div>
      </Transition>
    </div>
  </ThemePage> -->
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  LOCALE_STORAGE_KEY,
  loadLocaleMessages,
  type SupportedLocale,
} from "@/plugins/i18n";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import UiAlert from "@/components/ui/UiAlert.vue";
import UiAvatar from "@/components/ui/UiAvatar.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";
import UiTag from "@/components/ui/UiTag.vue";
import UiAccordion, {
  type UiAccordionItem,
} from "@/components/ui/UiAccordion.vue";
import TeacherLandingHeader from "@/components/teacherLanding/TeacherLandingHeader.vue";
import CourseReviewsList from "@/views/shared/reviews/CourseReviewsList.vue";
import Footer from "@/views/shared/Footer.vue";

import api from "@/services/api";
import { buildTenantUrl } from "@/lib/host";
import { useAuthStore } from "@/stores/auth";
import { useTenantStore } from "@/stores/tenant";
import { useFeaturesStore } from "@/stores/features";
import { FEATURE } from "@/constants/featureCatalog";
import { useStudentCheckoutStore } from "@/stores/studentCheckout";
import { getStudentCourses } from "@/services/student";
import { withPlaceholder } from "@/utils/placeholders";
import { withCacheBusting } from "@/utils/cacheBusting";
import { buildAuthenticatedMediaUrl } from "@/utils/media";
import { isPreviewEnabled } from "@/utils/preview";
import { getStoredTenantSlug } from "@/utils/tenantStorage";
import { useToast } from "@/composables/useToast";
import MediaVideoPlayer from "@/components/media/MediaVideoPlayer.vue";
import {
  fetchPublicTeacherLanding,
  type TeacherLandingCourse,
  type TeacherLandingFooterContact,
  type TeacherLandingPublicResponse,
} from "@/services/teacherLanding.api";

interface PublicCoursePreviewResponse {
  course: {
    id: number;
    title: string;
    type: string;
    price: number;
    currency?: string;
    level?: string;
    language?: string;
    thumbnailUrl?: string;
    description?: string;
    previewVideo?: string | null;
    stats: { modules: number; lessons: number; durationMinutes: number };
    reviews: { rating: number | null; count: number };
    offers: Array<{
      code: string;
      type: string;
      value: number;
      validUntil?: string | null;
    }>;
    nextLiveSessions: Array<{
      id: number;
      title: string;
      scheduledAt: string;
      durationMinutes?: number | null;
    }>;
    sampleLessons: Array<{
      lessonId: number;
      title: string;
      durationMinutes?: number | null;
      ytId?: string | null;
    }>;
    modules: Array<{ id: number; title: string; lessons: number }>;
    cta: { enrollRoute?: string; liveRoute?: string; tutoringRoute?: string };
  };
  teacher: {
    id: number;
    slug: string;
    name: string;
    subject?: string;
    tagline?: string | null;
    photoUrl?: string;
    branding?: Record<string, unknown> | null;
    landingUpdatedAt?: string | null;
  };
  seo: { title: string; description?: string | null };
}

interface HeroBannerConfig {
  icon: string;
  title: string;
  meta: string;
  action?: (() => void) | null;
  actionLabel?: string;
}

const { t, locale } = useI18n();
const tab = ref("one");
const route = useRoute();
const router = useRouter();
const tenantStore = useTenantStore();
const featuresStore = useFeaturesStore();
const checkoutStore = useStudentCheckoutStore();
const auth = useAuthStore();
const toast = useToast();
const rating = ref(3);
const ratingNew = ref(3);
const response = ref<PublicCoursePreviewResponse | null>(null);
const teacherLanding = ref<TeacherLandingPublicResponse | null>(null);
const loading = ref(false);
const error = ref(false);
const enrollmentLoading = ref(false);
const hasEnrollmentData = ref(false);
const courseEnrolled = ref(false);
const sharing = ref(false);
const calendarDownloadId = ref<number | null>(null);
const curriculumSection = ref<HTMLElement | null>(null);
const heroSection = ref<HTMLElement | null>(null);
const notFound = ref(false);
let sortedCoursesLast = [];
const stickyCtaVisible = ref(false);
const heroInView = ref(true);
const isStickyBreakpoint = ref(false);
const topHeaderMenuOpen = ref(false);
const dialog = ref(false);
const videoPlayer = ref(null);
let heroObserver: IntersectionObserver | null = null;
let stickyMediaQuery: MediaQueryList | null = null;
let removeMediaListener: (() => void) | null = null;
let mediaQueryChangeListener: ((event: MediaQueryListEvent) => void) | null =
  null;
const assistantLinkAvailable = computed(() => Boolean(slug.value.trim()));
const assistantLoginRoute = computed(() => {
  const slugValue = slug.value.trim();
  if (slugValue) {
    return { name: "assistant-login", query: { tenant: slugValue } };
  }
  return { name: "assistant-login" };
});
function handleStickyBreakpointChange(
  event: MediaQueryListEvent | MediaQueryList
) {
  isStickyBreakpoint.value = event.matches;
  updateStickyVisibility();
}

function updateStickyVisibility() {
  stickyCtaVisible.value = isStickyBreakpoint.value || !heroInView.value;
}

function attachHeroObserver(element: HTMLElement | null) {
  heroObserver?.disconnect();

  if (
    typeof window === "undefined" ||
    typeof IntersectionObserver === "undefined"
  ) {
    return;
  }

  if (!element) {
    heroInView.value = true;
    updateStickyVisibility();
    return;
  }

  heroObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.length) {
        return;
      }
      heroInView.value = entries[0].isIntersecting;
      updateStickyVisibility();
    },
    { threshold: 0.2 }
  );

  heroObserver.observe(element);
}

function bindStickyMediaQuery() {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return;
  }

  removeMediaListener?.();
  mediaQueryChangeListener = null;

  stickyMediaQuery = window.matchMedia("(max-width: 768px)");
  handleStickyBreakpointChange(stickyMediaQuery);

  mediaQueryChangeListener = (event: MediaQueryListEvent) =>
    handleStickyBreakpointChange(event);

  if (typeof stickyMediaQuery.addEventListener === "function") {
    stickyMediaQuery.addEventListener("change", mediaQueryChangeListener);
    removeMediaListener = () => {
      if (stickyMediaQuery && mediaQueryChangeListener) {
        stickyMediaQuery.removeEventListener(
          "change",
          mediaQueryChangeListener
        );
      }
      removeMediaListener = null;
    };
  } else if (typeof stickyMediaQuery.addListener === "function") {
    stickyMediaQuery.addListener(mediaQueryChangeListener);
    removeMediaListener = () => {
      if (stickyMediaQuery && mediaQueryChangeListener) {
        stickyMediaQuery.removeListener(mediaQueryChangeListener);
      }
      removeMediaListener = null;
    };
  }
}
const closeDialog = () => {
  dialog.value = false;
  // if (videoPlayer.value) {
  //   videoPlayer.value.pause();
  //   videoPlayer.value.currentTime = 0;
  // }
};
const onTrackedLoginClick = (eventName: string) => {
  trackLandingEvent(eventName);
  redirectToStudentLogin();
};

const redirectToStudentLogin = () => {
  const slugValue = slug.value.trim();
  if (!slugValue) {
    return;
  }
  const target = buildTenantUrl(slugValue, "/login");
  window.location.href = target;
};

/* load social and phone and user courses */

const trackLandingEvent = (
  eventName: string,
  payload: Record<string, string> = {}
) => {
  if (typeof window === "undefined") {
    return;
  }
  const dataLayer = (
    window as unknown as { dataLayer?: Array<Record<string, unknown>> }
  ).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({ event: eventName, ...payload });
  }
};
const studentRegisterRoute = computed(() => ({
  name: "student-register",
  query: {
    tenant: slug.value,
  },
}));

const toggleLanguage = async () => {
  const current = normalizeLocale(locale.value);
  const next: SupportedLocale = current === "ar" ? "en" : "ar";
  await loadLocaleMessages(next);
  locale.value = next;
};
let routeValue = "";
const normalizeLocale = (value: string): SupportedLocale =>
  value === "en" ? "en" : "ar";

const localePhoneCountryDefaults: Record<SupportedLocale, string> = {
  ar: "+971",
  en: "+1",
};

const slug = computed(
  () =>
    (route.params.slug as string) ||
    tenantStore.branding?.slug ||
    getStoredTenantSlug().raw ||
    "demo"
);
const isPreview = computed(() => isPreviewEnabled(route.query.preview));
const courseId = computed(() => Number(route.params.courseId));

const course = computed<PublicCoursePreviewResponse["course"] | null>(
  () => response.value?.course ?? null
);

function extractYoutubeId(value?: string | null) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const patterns = [
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/(?:watch\?v=|embed\/|shorts\/)([\w-]{11})/i,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return "";
}

const coursePreviewYoutubeId = computed(() =>
  extractYoutubeId(course.value?.previewVideo ?? null)
);
const coursePreviewYoutubeEmbedUrl = computed(() =>
  coursePreviewYoutubeId.value
    ? youtubeEmbed(coursePreviewYoutubeId.value)
    : ""
);
const coursePreviewVideoPlayerUrl = computed(() => {
  if (coursePreviewYoutubeId.value) {
    return "";
  }
  return buildAuthenticatedMediaUrl(course.value?.previewVideo ?? null) ?? "";
});
const coursePreviewKindLabel = computed(() =>
  coursePreviewYoutubeId.value ? "YouTube" : "Bunny Stream"
);
const hasCoursePreviewVideo = computed(
  () =>
    Boolean(coursePreviewYoutubeEmbedUrl.value) ||
    Boolean(coursePreviewVideoPlayerUrl.value)
);
console.log("66");
const sortedCourses = computed(() => {
  return course?.value?.whatYouWillLearn;
});
console.log(sortedCourses);
sortedCoursesLast = computed(() => {
  if (!Array.isArray(sortedCourses?.value)) return []; // fallback on first render
  return [...sortedCourses?.value].sort((a, b) => a.ordered - b.ordered);
});
console.log(sortedCoursesLast);
// const sortedShatYouWillLearnArray = sortedCoursesLast.value;
// const whatYouWillLearns = course?.value;
// console.log(whatYouWillLearns);
// const sortedLearnItems = computed(() => {
//   return [...whatYouWillLearns].sort((a, b) => a.age - b.age)
// })
const courseCurrency = computed(() =>
  (course.value?.currency || "EGP").toUpperCase()
);
const teacher = computed<PublicCoursePreviewResponse["teacher"] | null>(
  () => response.value?.teacher ?? null
);

const teacherHeader = computed(() => {
  const value = teacher.value;
  if (!value) {
    return null;
  }
  return {
    ...value,
    avatarUrl: value.photoUrl,
    updatedAt: value.landingUpdatedAt ?? null,
  };
});

const teacherAvatarSrc = computed(() => {
  const base = teacher.value?.photoUrl?.trim() || "";
  if (!base) {
    return "";
  }
  return withCacheBusting(base, teacher.value?.landingUpdatedAt ?? null);
});
const teacherLandingHref = computed(() => {
  const teacherValue = teacher.value;
  if (!teacherValue?.slug) {
    return "";
  }
  return router.resolve({
    name: "public-teacher-landing",
    params: { teacherSlug: teacherValue.slug },
    }).href;
});
const teacherLandingSlug = computed(
  () => teacherLanding.value?.teacher.slug || teacher.value?.slug || slug.value
);
const academyName = computed(
  () =>
    teacherLanding.value?.teacher.displayName ||
    teacher.value?.name ||
    teacherLandingSlug.value
);
const footerAboutText = computed(
  () =>
    teacherLanding.value?.teacher.bio ||
    teacherLanding.value?.sections.find((section) => section.type === "about")
      ?.description ||
    teacher.value?.tagline ||
    ""
);
const featuredCourses = computed<TeacherLandingCourse[]>(
  () => teacherLanding.value?.courses ?? []
);

const resolveFooterContactHref = (
  key: keyof TeacherLandingFooterContact,
  rawValue: unknown
): string => {
  const candidate = typeof rawValue === "string" ? rawValue.trim() : "";
  if (!candidate) {
    return "";
  }
  if (key === "whatsapp") {
    const digits = candidate.replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  }
  if (key === "phone") {
    const digits = candidate.replace(/[^\d]/g, "");
    return digits ? `tel:${digits}` : "";
  }
  if (key === "email") {
    return candidate.includes("@") ? `mailto:${candidate}` : "";
  }
  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }
  return `https://${candidate.replace(/^\/+/, "")}`;
};

const footerContactLinks = computed(() => {
  const contact = teacherLanding.value?.footerContact;
  if (!contact) {
    return [] as Array<{
      href: string;
      label: string;
      value: string;
      key: string;
    }>;
  }
  const map: Array<[keyof TeacherLandingFooterContact, string]> = [
    ["whatsapp", "teacherLanding.footerContact.whatsapp"],
    ["phone", "teacherLanding.footerContact.phone"],
    ["email", "teacherLanding.footerContact.email"],
    ["website", "teacherLanding.footerContact.website"],
    ["facebook", "teacherLanding.footerContact.facebook"],
    ["instagram", "teacherLanding.footerContact.instagram"],
    ["linkedin", "teacherLanding.footerContact.linkedin"],
    ["telegram", "teacherLanding.footerContact.telegram"],
  ];
  return map
    .map(([key, labelKey]) => {
      const value = typeof contact[key] === "string" ? contact[key]!.trim() : "";
      if (!value) return null;
      return {
        href: resolveFooterContactHref(key, value),
        label: t(labelKey),
        value,
        key: String(key),
      };
    })
    .filter(
      (
        item
      ): item is { href: string; label: string; value: string; key: string } =>
        Boolean(item)
    );
});

const footerSocialLinks = computed(() =>
  footerContactLinks.value.filter((item) =>
    ["whatsapp", "website", "facebook", "instagram", "linkedin", "telegram"].includes(item.key)
  )
);

const footerPhoneLink = computed(
  () => footerContactLinks.value.find((item) => item.key === "phone") ?? null
);
const teacherRegisterHref = computed(
  () =>
    router.resolve({
      name: "student-register",
      query: { tenant: slug.value },
    }).href
);
const nextLiveSession = computed<NextLiveSession | null>(
  () => course.value?.nextLiveSessions?.[0] ?? null
);
const isRtl = computed(() => locale.value === "ar");
const reviewsFeatureEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.reviews)
);
const enrollmentCtaLabel = computed(() => {
  if (auth.isStudent && hasEnrollmentData.value && courseEnrolled.value) {
    return t("publicCourse.cta.continue");
  }
  return t("publicCourse.cta.enroll");
});

const themeStyle = computed(() => {
  const branding =
    (teacher.value?.branding as Record<string, any> | undefined) || {};
  const colors = (branding.colors as Record<string, string> | undefined) || {};
  return {
    "--public-primary": colors.primary || "var(--sakai-primary-600)",
    "--public-secondary": colors.secondary || "var(--sakai-secondary-500)",
  } as Record<string, string>;
});

const courseHeroImage = computed(() =>
  withPlaceholder(course.value?.thumbnailUrl ?? null, "course")
);

const heroStyle = computed(() => ({
  "--public-course-hero-gradient": `linear-gradient(135deg, ${themeStyle.value["--public-primary"]}, ${themeStyle.value["--public-secondary"]})`,
  // "--public-course-hero-image": `url(${courseHeroImage.value})`,
}));

const heroBanner = computed<HeroBannerConfig | null>(() => {
  const courseValue = course.value;
  if (!courseValue) {
    return null;
  }

  const nextLive = nextLiveSession.value;
  if (nextLive) {
    const parts: string[] = [formatDateTime(nextLive.scheduledAt)];
    const relative = formatRelativeTimeToNow(nextLive.scheduledAt);
    if (relative) {
      parts.push(t("publicCourse.heroBanner.startsIn", { relative }));
    }

    return {
      icon: "CalendarOutlined",
      title: t("publicCourse.heroBanner.nextLiveTitle"),
      meta: parts.join(" · "),
      action: courseValue.cta?.liveRoute
        ? () => navigateTo(courseValue.cta?.liveRoute)
        : null,
      actionLabel: courseValue.cta?.liveRoute
        ? t("publicCourse.heroBanner.nextLiveAction")
        : undefined,
    };
  }

  const hasOnDemand = Boolean(
    courseValue.modules?.length || courseValue.sampleLessons?.length
  );
  return {
    icon: "PlayCircleOutlined",
    title: t("publicCourse.heroBanner.noLiveTitle"),
    meta: t("publicCourse.heroBanner.noLiveDescription"),
    action: hasOnDemand ? () => scrollToCurriculum() : null,
    actionLabel: hasOnDemand
      ? t("publicCourse.heroBanner.noLiveAction")
      : undefined,
  };
});

const managedMeta = new Map<
  string,
  { previous: string | null; created: boolean }
>();
const managedLinks = new Map<
  string,
  { previous: string | null; created: boolean }
>();

const originalTheme =
  typeof window !== "undefined"
    ? {
        primary: getComputedStyle(document.documentElement)
          .getPropertyValue("--ed-primary")
          .trim(),
        secondary: getComputedStyle(document.documentElement)
          .getPropertyValue("--ed-secondary")
          .trim(),
      }
    : { primary: "", secondary: "" };

const originalTitle = typeof document !== "undefined" ? document.title : "";

const activeThemeOverrides: { primary?: string; secondary?: string } = {};

const priceLabel = computed(() => {
  const amount = course.value?.price ?? 0;
  const currency = courseCurrency.value;
  try {
    return new Intl.NumberFormat(locale.value === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch (err) {
    return `${currency} ${amount}`;
  }
});

interface HighlightItem {
  key: string;
  icon: string;
  label: string;
  value: string;
  description?: string;
}

const statsItems = computed(() => {
  const stats = course.value?.stats;
  if (!stats) return [];
  return [
    {
      key: "modules",
      label: t("publicCourse.stats.modules"),
      value: String(stats.modules),
      icon: "BookOutlined",
    },
    {
      key: "lessons",
      label: t("publicCourse.stats.lessons"),
      value: String(stats.lessons),
      icon: "SolutionOutlined",
    },
    {
      key: "duration",
      label: t("publicCourse.stats.duration"),
      value:
        stats.durationMinutes > 0
          ? `${stats.durationMinutes} ${t("publicCourse.minutesSuffix")}`
          : "—",
      icon: "ClockCircleOutlined",
    },
  ];
});

const highlightItems = computed<HighlightItem[]>(() => {
  const items: HighlightItem[] = [];
  const stats = course.value?.stats;

  if (stats) {
    items.push({
      key: "structure",
      icon: "BookOutlined",
      label: t("publicCourse.highlight.structureLabel"),
      value: t("publicCourse.highlight.structureValue", {
        modules: stats.modules,
        lessons: stats.lessons,
      }),
      description: t("publicCourse.highlight.structureDescription"),
    });

    if (stats.durationMinutes > 0) {
      const durationLabel = formatDuration(stats.durationMinutes);
      items.push({
        key: "duration",
        icon: "ClockCircleOutlined",
        label: t("publicCourse.highlight.durationLabel"),
        value: durationLabel,
        description: t("publicCourse.highlight.durationDescription", {
          duration: durationLabel,
        }),
      });
    }
  }

  const nextLive = course.value?.nextLiveSessions?.[0];
  if (nextLive) {
    items.push({
      key: "live",
      icon: "CalendarOutlined",
      label: t("publicCourse.highlight.liveLabel"),
      value: formatDateTime(nextLive.scheduledAt),
      description: nextLive.durationMinutes
        ? t("publicCourse.highlight.liveDescriptionDuration", {
            duration: formatDuration(nextLive.durationMinutes),
          })
        : t("publicCourse.highlight.liveDescription"),
    });
  }

  if (course.value?.reviews?.count) {
    items.push({
      key: "reviews",
      icon: "StarOutlined",
      label: t("publicCourse.highlight.reviewsLabel"),
      value: `${course.value.reviews.rating?.toFixed(1) ?? "0.0"} / 5`,
      description: t("publicCourse.highlight.reviewsDescription", {
        count: course.value.reviews.count,
      }),
    });
  }

  const activeOffer = course.value?.offers?.[0];
  if (activeOffer) {
    items.push({
      key: "offers",
      icon: "TagOutlined",
      label: t("publicCourse.highlight.offersLabel"),
      value: formatOfferValue(activeOffer),
      description: activeOffer.validUntil
        ? t("publicCourse.highlight.offersDescription", {
            date: formatDate(activeOffer.validUntil),
          })
        : t("publicCourse.highlight.offersOpen"),
    });
  }

  if (course.value?.sampleLessons?.length) {
    items.push({
      key: "samples",
      icon: "PlayCircleOutlined",
      label: t("publicCourse.highlight.samplesLabel"),
      value: t("publicCourse.highlight.samplesValue", {
        count: course.value.sampleLessons.length,
      }),
      description: t("publicCourse.highlight.samplesDescription"),
    });
  }

  return items;
});

const curriculumItems = computed<UiAccordionItem[]>(() => {
  const modules = course.value?.modules ?? [];
  return modules.map((module, index) => ({
    value: module.id ?? index,
    title: module.title,
    subtitle: t("publicCourse.moduleLessons", { count: module.lessons }),
    content: t("publicCourse.moduleDescription", { count: module.lessons }),
  }));
});

function youtubeEmbed(ytId: string | undefined | null) {
  if (!ytId) return "";
  return `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`;
}

function scrollToCurriculum() {
  if (typeof window === "undefined") {
    return;
  }

  requestAnimationFrame(() => {
    curriculumSection.value?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

function formatDuration(minutes?: number | null) {
  if (!minutes) {
    return t("publicCourse.durationFallback");
  }
  return `${minutes} ${t("publicCourse.minutesSuffix")}`;
}

function formatDateTime(value: string) {
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat(locale.value === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch (err) {
    return value;
  }
}

function formatRelativeTimeToNow(value: string) {
  try {
    const target = new Date(value);
    if (Number.isNaN(target.getTime())) {
      return "";
    }

    const diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) {
      return "";
    }
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;

    const rtf = new Intl.RelativeTimeFormat(
      locale.value === "ar" ? "ar-EG" : "en-US",
      {
        numeric: "auto",
      }
    );

    if (Math.abs(diffMs) >= day) {
      return rtf.format(Math.round(diffMs / day), "day");
    }

    if (Math.abs(diffMs) >= hour) {
      return rtf.format(Math.round(diffMs / hour), "hour");
    }

    return rtf.format(Math.round(diffMs / minute), "minute");
  } catch (err) {
    return "";
  }
}

function formatIcsDate(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function sanitizeFilename(value: string) {
  const sanitized = value
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80)
    .replace(/\.$/, "");

  return sanitized || "event";
}

function formatDate(value: string) {
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat(locale.value === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
    }).format(date);
  } catch (err) {
    return value;
  }
}

function formatOfferValue(offer: { type: string; value: number }) {
  if (offer.type === "PERCENTAGE") {
    return t("publicCourse.offerPercentage", { value: offer.value });
  }
  if (offer.type === "BUNDLE") {
    return t("publicCourse.offerBundle", {
      price: formatCurrency(offer.value),
    });
  }
  return t("publicCourse.offerFixed", { amount: formatCurrency(offer.value) });
}

function formatCurrency(amount: number) {
  const currency = courseCurrency.value;
  try {
    return new Intl.NumberFormat(locale.value === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch (err) {
    return `${currency} ${amount}`;
  }
}

function navigateTo(target?: string) {
  if (!target) return;
  router.push(target);
}

async function refreshEnrollmentStatus() {
  if (!auth.isStudent || !course.value?.id) {
    hasEnrollmentData.value = false;
    courseEnrolled.value = false;
    return;
  }
  enrollmentLoading.value = true;
  hasEnrollmentData.value = false;
  try {
    const catalog = await getStudentCourses();
    const matched = catalog.find((item) => item.id === course.value?.id);
    courseEnrolled.value = Boolean(matched?.active);
    hasEnrollmentData.value = true;
  } catch (err) {
    console.warn("Failed to load enrollment status", err);
    courseEnrolled.value = false;
  } finally {
    enrollmentLoading.value = false;
  }
}

async function handleShare() {
  if (!course.value || typeof window === "undefined" || sharing.value) {
    return;
  }

  const url = window.location.href;
  const title = course.value.title;
  const shareText = teacher.value?.name
    ? t("publicCourse.shareMessage", {
        course: course.value.title,
        teacher: teacher.value.name,
      })
    : course.value.title;

  sharing.value = true;

  try {
    const shareNavigator = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };

    if (typeof shareNavigator.share === "function") {
      await shareNavigator.share({ title, text: shareText, url });
      return;
    }

    await copyToClipboard(url);
    toast.success({ detail: t("publicCourse.shareCopied") });
    return;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return;
    }

    try {
      await copyToClipboard(url);
      toast.success({ detail: t("publicCourse.shareCopied") });
    } catch (copyError) {
      console.warn("Failed to share course", copyError);
      toast.error({ detail: t("publicCourse.shareError") });
    }
  } finally {
    sharing.value = false;
  }
}

type NextLiveSession =
  PublicCoursePreviewResponse["course"]["nextLiveSessions"][number];

async function downloadLiveSessionCalendar(session: NextLiveSession) {
  if (!course.value || typeof document === "undefined") {
    return;
  }

  if (!session?.scheduledAt) {
    toast.error({ detail: t("publicCourse.liveCalendarError") });
    return;
  }

  calendarDownloadId.value = session.id;

  try {
    const start = new Date(session.scheduledAt);
    if (Number.isNaN(start.getTime())) {
      throw new Error("Invalid date");
    }

    const durationMinutes =
      session.durationMinutes && session.durationMinutes > 0
        ? session.durationMinutes
        : 60;
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    const dtStamp = formatIcsDate(new Date());
    const dtStart = formatIcsDate(start);
    const dtEnd = formatIcsDate(end);

    const description = course.value.description
      ? escapeIcsText(course.value.description)
      : "";
    const summary = escapeIcsText(`${course.value.title} – ${session.title}`);
    const location = escapeIcsText(t("publicCourse.liveCalendarLocation"));

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Zidni AI//PublicCourse//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${session.id}@Zidni AI.app`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : null,
      `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean) as string[];

    const blob = new Blob([`${lines.join("\r\n")}\r\n`], {
      type: "text/calendar;charset=utf-8",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${sanitizeFilename(
      `${course.value.title} - ${session.title}`
    )}.ics`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    const href = link.href;
    link.remove();
    URL.revokeObjectURL(href);

    toast.success({ detail: t("publicCourse.liveCalendarDownloaded") });
  } catch (err) {
    console.warn("Failed to download calendar event", err);
    toast.error({ detail: t("publicCourse.liveCalendarError") });
  } finally {
    calendarDownloadId.value = null;
  }
}

function handleEnrollmentCta() {
  if (!course.value) {
    return;
  }
  if (auth.isStudent) {
    if (courseEnrolled.value) {
      router.push({
        name: "student-learning",
        query: { courseId: String(course.value.id) },
      });
      return;
    }
    startCheckout();
    return;
  }

  if (auth.isTeacher) {
    router.push({ name: "teacher-courses" });
    return;
  }

  router.push({
    name: "login-student-fallback",
    query: { next: route.fullPath },
  });
}

function handleSubscriptionCta() {
  if (!course.value || !teacher.value) {
    return;
  }
  if (!auth.isStudent) {
    const tenantSlug = slug.value?.trim();
    if (tenantSlug) {
      router.push({
        name: "login-student",
        params: { tenant: tenantSlug },
        query: { next: route.fullPath },
      });
    } else {
      router.push({
        name: "login-student-fallback",
        query: { next: route.fullPath },
      });
    }
    return;
  }
  if (hasEnrollmentData.value && courseEnrolled.value) {
    router.push({
      name: "student-learning",
      query: { courseId: String(course.value.id) },
    });
    return;
  }
  startCheckout();
}

function startCheckout() {
  if (!course.value || !teacher.value) {
    return;
  }
  checkoutStore.setItems([
    {
      courseId: course.value.id,
      qty: 1,
      title: course.value.title,
      price: course.value.price,
      currency: course.value.currency ?? null,
    },
  ]);
  router.push({
    name: "student-checkout",
    query: { slug: teacher.value.slug },
  });
}

function goBack() {
  if (router.hasRoute("public-course-list")) {
    router.push({
      name: "public-course-list",
      params: { slug: slug.value },
      query: isPreview.value ? { preview: "1" } : undefined,
    });
    return;
  }
  router.push({
    name: "public-teacher-landing",
    params: { teacherSlug: slug.value },
    query: isPreview.value ? { preview: "1" } : undefined,
  });
}

async function loadCourse() {
  if (!slug.value || Number.isNaN(courseId.value)) {
    return;
  }
  loading.value = true;
  error.value = false;
  notFound.value = false;
  try {
    const params = isPreview.value ? { preview: 1 } : undefined;
    const { data } = await api.get<PublicCoursePreviewResponse>(
      `/public/tenants/${slug.value}/courses/${courseId.value}`,
      { params }
    );
    response.value = {
      ...data,
      course: {
        ...data.course,
        currency: data.course?.currency
          ? data.course.currency.toUpperCase()
          : data.course?.currency,
      },
    };
    updateMeta(data);
    applyBranding(data.teacher.branding as Record<string, unknown> | undefined);
    await refreshEnrollmentStatus();
  } catch (err: any) {
    console.warn("Failed to load public course", err);
    response.value = null;
    if (err?.response?.status === 404) {
      notFound.value = true;
      error.value = false;
    } else {
      error.value = true;
    }
    resetHead();
    restoreBranding();
  } finally {
    loading.value = false;
  }
}

async function loadTeacherLandingFooter() {
  if (!slug.value) {
    teacherLanding.value = null;
    return;
  }
  try {
    teacherLanding.value = await fetchPublicTeacherLanding(slug.value);
  } catch (err) {
    teacherLanding.value = null;
    console.warn("Failed to load teacher landing footer", err);
  }
}

function applyBranding(branding?: Record<string, unknown>) {
  if (typeof document === "undefined") return;

  restoreBranding();

  if (!branding) return;
  const colors = (branding.colors as Record<string, string> | undefined) || {};
  if (colors.primary) {
    document.documentElement.style.setProperty("--ed-primary", colors.primary);
    activeThemeOverrides.primary = colors.primary;
  }
  if (colors.secondary) {
    document.documentElement.style.setProperty(
      "--ed-secondary",
      colors.secondary
    );
    activeThemeOverrides.secondary = colors.secondary;
  }
}

function updateMeta(data: PublicCoursePreviewResponse) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  document.title = data.seo?.title || data.course.title;
  const description = data.seo?.description || data.course.description || "";
  setMeta("description", description);
  setMeta("og:title", data.seo?.title || data.course.title);
  setMeta("og:description", description);
  const image = withPlaceholder(data.course.thumbnailUrl || "", "course");
  setMeta("og:image", image);
  setMeta("twitter:image", image);
  setMeta("twitter:title", data.seo?.title || data.course.title);
  setMeta("twitter:description", description);
  setLink(
    "canonical",
    `${window.location.origin}/teacher/${data.teacher.slug}/courses/${data.course.id}`
  );
}

function setMeta(name: string, content: string) {
  if (!content || typeof document === "undefined") return;
  let tag = document.head.querySelector(
    `meta[name="${name}"]`
  ) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
    if (!managedMeta.has(name)) {
      managedMeta.set(name, { previous: null, created: true });
    }
  } else if (!managedMeta.has(name)) {
    managedMeta.set(name, {
      previous: tag.getAttribute("content"),
      created: false,
    });
  }
  tag.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  if (!href || typeof document === "undefined") return;
  let link = document.head.querySelector(
    `link[rel="${rel}"]`
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
    if (!managedLinks.has(rel)) {
      managedLinks.set(rel, { previous: null, created: true });
    }
  } else if (!managedLinks.has(rel)) {
    managedLinks.set(rel, {
      previous: link.getAttribute("href"),
      created: false,
    });
  }
  link.setAttribute("href", href);
}
// const socialItemsInLocalStorage = ref([]);
onMounted(async () => {
  window.scrollTo(0, 0);
  routeValue = route.fullPath.split("/")[1];
  console.log(route.fullPath);
  bindStickyMediaQuery();
  if (heroSection.value) {
    attachHeroObserver(heroSection.value);
  }

  if (!tenantStore.branding) {
    await tenantStore.fetchBranding(slug.value);
  }
  await loadTeacherLandingFooter();
  await loadCourse();

  // const stored = localStorage.getItem("footerSocialLinksInStorage");
  // socialItemsInLocalStorage.value = stored ? JSON.parse(stored) : [];
  // console.log(socialItemsInLocalStorage);
});

onBeforeUnmount(() => {
  resetHead();
  restoreBranding();
  heroObserver?.disconnect();
  heroObserver = null;
  removeMediaListener?.();
  mediaQueryChangeListener = null;
  stickyMediaQuery = null;
});

watch(
  () => route.fullPath,
  async () => {
    await loadTeacherLandingFooter();
    await loadCourse();
  }
);

watch(
  () => heroSection.value,
  (element) => {
    if (typeof window === "undefined") {
      return;
    }
    attachHeroObserver(element);
  },
  { flush: "post" }
);

watch(
  () => auth.isStudent,
  async (isStudent) => {
    if (isStudent) {
      await refreshEnrollmentStatus();
    } else {
      hasEnrollmentData.value = false;
      courseEnrolled.value = false;
    }
  }
);

watch(
  () => course.value,
  (value) => {
    if (!value) {
      heroInView.value = true;
      updateStickyVisibility();
    }
  }
);

async function copyToClipboard(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard not supported");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const successful = document.execCommand("copy");
    if (!successful) {
      throw new Error("Copy command was unsuccessful");
    }
  } finally {
    textarea.remove();
  }
}

function restoreBranding() {
  if (typeof document === "undefined") return;
  const style = document.documentElement.style;

  if (activeThemeOverrides.primary) {
    if (originalTheme.primary) {
      style.setProperty("--ed-primary", originalTheme.primary);
    } else {
      style.removeProperty("--ed-primary");
    }
    delete activeThemeOverrides.primary;
  }

  if (activeThemeOverrides.secondary) {
    if (originalTheme.secondary) {
      style.setProperty("--ed-secondary", originalTheme.secondary);
    } else {
      style.removeProperty("--ed-secondary");
    }
    delete activeThemeOverrides.secondary;
  }
}

function resetHead() {
  if (typeof document === "undefined") return;

  managedMeta.forEach((entry, name) => {
    const tag = document.head.querySelector(
      `meta[name="${name}"]`
    ) as HTMLMetaElement | null;
    if (!tag) {
      return;
    }

    if (entry.created) {
      tag.remove();
    } else if (entry.previous !== null) {
      tag.setAttribute("content", entry.previous);
    } else {
      tag.removeAttribute("content");
    }
  });

  managedLinks.forEach((entry, rel) => {
    const link = document.head.querySelector(
      `link[rel="${rel}"]`
    ) as HTMLLinkElement | null;
    if (!link) {
      return;
    }

    if (entry.created) {
      link.remove();
    } else if (entry.previous) {
      link.setAttribute("href", entry.previous);
    } else {
      link.removeAttribute("href");
    }
  });

  managedMeta.clear();
  managedLinks.clear();

  if (originalTitle) {
    document.title = originalTitle;
  }
}
</script>

<style scoped>
.ltrContent {
  direction: ltr;
}
.coursedetailsRtl .page-title-area-details .page-title-content,
.coursedetailsRtl .page-title-area-details .list-wrap {
  text-align: right;
  direction: rtl;
}

.coursedetailsRtl .page-title-area-details .page-title-content,
.coursedetailsRtl .page-title-area-details .list-wrap {
  text-align: right;
  direction: rtl;
}
.coursedetailsRtl .page-title-area-details .courses__item-meta li i {
  margin-right: auto;
  margin-left: 7px;
}
.learn-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30px;
}
.learn-item i {
  min-width: 16px;
  height: 16px;
  display: inline-block;
  background-color: #25a18e;
  color: #fff;
  line-height: 16px;
  text-align: center;
  border-radius: 50%;
  font-size: 7px;
  font-weight: bold;
  margin-right: 10px;
}
.coursedetailsRtl .learn-item i {
  margin-left: 10px;
  margin-right: initial;
}
.coursedetailsRtl .coursePricing .price strong {
  margin-right: auto;
  margin-left: 15px;
}
.learn-item .learn-title {
  margin: 0;
  font-weight: bold;
  color: #061e43;
  font-size: 16px;
  height: 40px;
  overflow: hidden;
}
.topHeaderActionBtn {
  background-color: #0d6efd;
  padding: 8px 20px;
  border-radius: 50px;
  color: #fff;
  font-weight: bold;
  margin: 0 10px;
  font-size: 14px;
}
.greenAction.topHeaderActionBtn {
  background-color: #04bc53;
}
.ui-avatar {
  background: #fff;
}
.container-fluid {
  padding-left: 30px !important;
  padding-right: 30px !important;
  max-width: 1270px;
}
.ui-accordion {
  border: 0;
  box-shadow: none;
  border-radius: 5px !important;
}
::v-deep(.ui-accordion__header) {
  background: #ffffffc4;
  border-radius: 5px !important;
}
::v-deep(.ui-accordion__title) {
  font-weight: bold;
  color: #061e43;
}

::v-deep(.ui-accordion__item) {
  border: 0 !important;
}

.coursePricing .price {
  margin-bottom: 18px;
  font-weight: 600;
  font-size: 25px;
  text-align: center;
}
.coursePricing .price strong {
  font-weight: 400;
  font-size: 16px;
  color: #5a7093;
  margin-right: 15px;
}
.product-tags a {
  margin-right: 5px;
  margin-bottom: 5px;
  padding: 5px 10px;
  border-radius: 3px;
  color: #6987ab;
  font-size: 12px;
  border: 1px solid #e0e8f3;
}
.public-course {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-8);

  padding-block: clamp(
    var(--sakai-space-8),
    7vw,
    calc(var(--sakai-space-12) + var(--sakai-space-4))
  );
  padding-inline: clamp(var(--sakai-space-4), 6vw, var(--sakai-space-8));
  background: var(--sakai-surface-section);
  min-height: 100vh;
  padding: 0;
}

.public-course--rtl {
  direction: rtl;
}

.public-course--sticky {
  padding-bottom: calc(var(--sakai-space-12) + 5rem);
}

.public-course__hero {
  position: relative;
  border-radius: var(--sakai-border-radius-xl);
  overflow: hidden;
  color: var(--sakai-text-color-inverse);
  box-shadow: var(--sakai-shadow-lg);
  width: min(100%, 1120px);
  margin: 0 auto;
}

.public-course__hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--public-course-hero-gradient, var(--sakai-surface-hero));
  opacity: 0.94;
}

.public-course__hero--image::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--sakai-overlay-strong) 70%, transparent),
      transparent
    ),
    var(--public-course-hero-image, none);
  background-size: cover;
  background-position: center;
  filter: saturate(1.05);
}

.public-course__hero-inner {
  position: relative;
  display: grid;
  gap: var(--sakai-space-5);
  padding: clamp(
    var(--sakai-space-7),
    7vw,
    calc(var(--sakai-space-10) + var(--sakai-space-2))
  );
  width: min(100%, 1120px);
  margin: 0 auto;
}

.public-course__hero-banner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--sakai-space-3);
  align-items: center;
  padding: var(--sakai-space-3) var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid
    color-mix(in srgb, var(--sakai-text-color-inverse) 25%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 20%, transparent);
  backdrop-filter: blur(12px);
  box-shadow: var(--sakai-shadow-sm);
}

.public-course__hero-banner-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--sakai-border-radius-full);
  background: color-mix(in srgb, var(--public-primary) 22%, transparent);
  color: var(--public-primary);
}

.public-course__hero-banner-body {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.public-course__hero-banner-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-course__hero-banner-meta {
  margin: 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 70%, transparent);
}

.public-course__hero-banner-cta {
  font-weight: var(--sakai-font-weight-medium);
  white-space: nowrap;
}

.public-course__back {
  justify-self: flex-start;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 85%, transparent);
}

.public-course__hero-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(var(--sakai-space-6), 6vw, var(--sakai-space-10));
  align-items: start;
}

.public-course__hero-main {
  display: grid;
  gap: var(--sakai-space-4);
  max-width: 720px;
}

.public-course__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
}

.public-course__title {
  margin: 0;
  font-size: clamp(2.25rem, 4vw, 3rem);
  font-weight: var(--sakai-font-weight-bold);
}

.public-course__summary {
  margin: 0;
  font-size: 1.05rem;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 82%, transparent);
  line-height: var(--sakai-line-height-lg);
}

.public-course__hero-footer {
  display: grid;
  gap: var(--sakai-space-5);
  align-items: start;
}

.public-course__cta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
  align-items: center;
}

.public-course__share {
  margin-inline-start: auto;
  font-weight: var(--sakai-font-weight-medium);
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 85%, transparent);
}

.public-course--rtl .public-course__share {
  margin-inline-start: 0;
  margin-inline-end: auto;
}

.public-course__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--sakai-space-4);
}

.public-course__stat {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-surface-card) 18%, transparent);
  backdrop-filter: blur(6px);
  box-shadow: var(--sakai-shadow-sm);
}

.public-course__stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--sakai-border-radius-full);
  background: color-mix(in srgb, var(--sakai-surface-card) 35%, transparent);
  color: var(--public-primary);
}

.public-course__stat-body {
  display: grid;
  gap: 0.25rem;
}

.public-course__stat-value {
  font-size: 1.5rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-course__stat-label {
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 75%, transparent);
}

.public-course__section--accent {
  background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--public-primary) 20%, transparent),
      color-mix(in srgb, var(--public-secondary) 12%, transparent)
    ),
    var(--sakai-surface-card);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 45%, transparent);
}

.public-course__highlights {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.public-course__highlight {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-surface-card) 65%, transparent);
  box-shadow: var(--sakai-shadow-sm);
}

.public-course__highlight-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--sakai-border-radius-full);
  background: color-mix(in srgb, var(--public-primary) 18%, transparent);
  color: var(--public-primary);
}

.public-course__highlight-body {
  display: grid;
  gap: 0.35rem;
}

.public-course__highlight-label {
  margin: 0;
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-secondary);
}

.public-course__highlight-value {
  margin: 0;
  font-size: 1.2rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.public-course__highlight-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--sakai-text-color-secondary);
}

.public-course__teacher {
  display: grid;
  gap: var(--sakai-space-4);
  align-content: start;
}

.public-course__teacher-header {
  margin: 0;
  font-size: 0.75rem;
  font-weight: var(--sakai-font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 70%, transparent);
}

.public-course__teacher-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-course__teacher-subject,
.public-course__teacher-tagline {
  margin: 0;
  color: color-mix(in srgb, var(--sakai-text-color-inverse) 78%, transparent);
}

.public-course__reviews {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  margin-top: var(--sakai-space-2);
  font-weight: var(--sakai-font-weight-medium);
}

.public-course__reviews--hero {
  margin: 0;
}

.public-course__content {
  display: grid;
  gap: var(--sakai-space-7);
  width: min(100%, 1120px);
  margin: 0 auto;
}

.public-course__loading {
  display: grid;
  gap: var(--sakai-space-6);
}

.public-course__loading-hero {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-6);
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface-card);
}

.public-course__loading-section {
  display: grid;
  gap: var(--sakai-space-3);
}

.public-course__alert {
  justify-self: center;
  max-width: 640px;
}

.public-course__alert-content {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.public-course__alert-text {
  display: grid;
  gap: var(--sakai-space-2);
}

.public-course__alert-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
  font-size: 1.1rem;
}

.public-course__alert-description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: var(--sakai-line-height-lg);
}

@media (min-width: 640px) {
  .public-course__alert-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.public-course__section {
  display: grid;
  gap: var(--sakai-space-3);
  padding: clamp(var(--sakai-space-5), 5vw, var(--sakai-space-7));
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface-card);
  box-shadow: var(--sakai-shadow-sm);
}

.public-course__section-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-course__section-text {
  margin: 0;
  line-height: var(--sakai-line-height-lg);
  color: var(--sakai-text-color-secondary);
}

.public-course__offers,
.public-course__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--sakai-space-3);
}

.public-course__empty {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.public-course__list-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--sakai-space-3);
  align-items: center;
  padding: var(--sakai-space-4);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  border-radius: var(--sakai-border-radius-lg);
}

.public-course__list-content {
  display: grid;
  gap: 0.35rem;
}

.public-course__list-action {
  justify-self: flex-end;
}

.public-course__list-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.public-course__list-meta {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.public-course__list--timeline {
  position: relative;
  padding-inline-start: calc(var(--sakai-space-3) + 1.5rem);
  border-inline-start: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 65%, transparent);
}

.public-course--rtl .public-course__list--timeline {
  border-inline-start: none;
  border-inline-end: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 65%, transparent);
  padding-inline-start: 0;
  padding-inline-end: calc(var(--sakai-space-3) + 1.5rem);
}

.public-course__list--timeline .public-course__list-item {
  position: relative;
}

.public-course__list--timeline .public-course__list-item::before {
  content: "";
  position: absolute;
  width: 0.85rem;
  height: 0.85rem;
  border-radius: var(--sakai-border-radius-full);
  background: var(--public-primary);
  inset-block-start: 50%;
  transform: translateY(-50%);
  inset-inline-start: calc(-1 * 1.5rem);
}

.public-course--rtl
  .public-course__list--timeline
  .public-course__list-item::before {
  inset-inline-start: auto;
  inset-inline-end: calc(-1 * 1.5rem);
}

@media (max-width: 640px) {
  .public-course__list-item {
    grid-template-columns: auto 1fr;
    align-items: flex-start;
  }

  .public-course__list-action {
    grid-column: 2 / 3;
    justify-self: flex-start;
    margin-block-start: var(--sakai-space-2);
  }
}

.public-course__curriculum {
  display: grid;
  gap: var(--sakai-space-3);
}

.public-course__module-description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: var(--sakai-line-height-md);
}

.public-course__offer {
  display: flex;
  gap: var(--sakai-space-3);
  align-items: center;
  padding: var(--sakai-space-4);
  border: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  border-radius: var(--sakai-border-radius-lg);
}

.public-course__offer-body {
  display: grid;
  gap: var(--sakai-space-1);
}

.public-course__offer-value {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.public-course__offer-meta {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.public-course__samples {
  display: grid;
  gap: var(--sakai-space-4);
}

.public-course__sample {
  display: grid;
  gap: var(--sakai-space-2);
}

.public-course__sample-video {
  position: relative;
  padding-top: 56.25%;
  border-radius: var(--sakai-border-radius-lg);
  overflow: hidden;
  background: color-mix(in srgb, var(--public-secondary) 25%, transparent);
}

.public-course__sample-video iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.public-course__sample-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.public-course__sample-meta {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.public-course__reviews-summary {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  font-weight: var(--sakai-font-weight-medium);
}

.public-course__reviews-list {
  margin-top: var(--sakai-space-3);
}

.public-course__teacher-card {
  display: flex;
  gap: var(--sakai-space-4);
  align-items: center;
}

.public-course__sticky-cta {
  position: fixed;
  inset-inline: 0;
  inset-block-end: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4) var(--sakai-space-5);
  background: color-mix(in srgb, var(--sakai-surface-card) 92%, transparent);
  border-top: 1px solid
    color-mix(in srgb, var(--sakai-border-color) 50%, transparent);
  box-shadow: 0 -12px 32px color-mix(in srgb, var(--sakai-shadow-color) 12%, transparent);
  z-index: 30;
  backdrop-filter: blur(14px);
}

.public-course__sticky-info {
  display: grid;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.public-course__sticky-title {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.public-course__sticky-price {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.public-course__sticky-actions {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
}

.public-course__sticky-share {
  padding: 0.55rem;
  min-width: 2.75rem;
}

.public-course__sticky-transition-enter-active,
.public-course__sticky-transition-leave-active {
  transition: transform 0.24s ease, opacity 0.24s ease;
}

.public-course__sticky-transition-enter-from,
.public-course__sticky-transition-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 768px) {
  .public-course__hero-body {
    grid-template-columns: 1fr;
  }

  .public-course__hero-banner {
    grid-template-columns: auto 1fr;
    align-items: start;
    gap: var(--sakai-space-2);
  }

  .public-course__hero-banner-cta {
    grid-column: 1 / -1;
    justify-self: flex-start;
    padding-inline: 0;
    margin-top: var(--sakai-space-2);
  }

  .public-course__share {
    width: 100%;
    margin-inline-start: 0;
    justify-content: center;
  }

  .public-course__teacher {
    grid-template-columns: auto 1fr;
  }
}

@media (max-width: 767px) {
  .public-course__hero {
    border-radius: 24px;
  }

  .public-course__hero-inner {
    padding: 20px 16px;
    gap: 16px;
  }

  .public-course__title {
    font-size: clamp(1.8rem, 8vw, 2.35rem);
  }

  .public-course__summary {
    font-size: 0.96rem;
  }

  .public-course__cta > * {
    width: 100%;
    justify-content: center;
  }

  .public-course__stats,
  .public-course__highlights {
    grid-template-columns: 1fr;
  }

  .public-course__teacher-card {
    align-items: flex-start;
  }

  .public-course__section {
    padding: 18px 16px;
  }

  .public-course__sticky-cta {
    flex-direction: column;
    align-items: stretch;
    padding: 14px 16px;
    gap: 12px;
  }

  .public-course__sticky-actions {
    width: 100%;
  }

  .public-course__sticky-share,
  .public-course__sticky-actions > :not(.public-course__sticky-share) {
    flex: 1 1 auto;
  }
}

@media (max-width: 480px) {
  .public-course__hero-inner {
    padding: 18px 14px;
  }

  .public-course__hero-banner {
    padding: 12px;
  }

  .public-course__hero-banner-title {
    font-size: 0.9rem;
  }

  .public-course__hero-banner-meta {
    font-size: 0.8rem;
  }

  .public-course__teacher-card {
    flex-direction: column;
  }

  .public-course__sticky-title {
    white-space: normal;
  }
}

@media (min-width: 992px) {
  .public-course__hero-footer {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    align-items: stretch;
  }
}
</style>
<style scoped>
.top-header .list-wrap {
  padding: 0;
  list-style-type: none;
  margin: 0;
}
.top-header .list-wrap .socials {
  margin-top: 0;
}
.top-header .main-menu {
  padding: 0;
  margin: 0;
  display: flex;
  list-style-type: none;
}
.top-header .main-menu a {
  font-weight: bold;
  color: #061e43;
  margin-right: 40px;
  font-size: 16px;
}
.top-header .sign-in {
  font-weight: bold;
  color: #061e43;
  font-size: 16px;
}
.top-header .socials i {
  display: inline-block;
  text-align: center;
  color: #061e43;
  font-size: 20px;
  margin-right: 10px;
  border-right: 1px solid #000;
  padding-right: 20px;
  width: auto;
  height: auto;
  line-height: initial;
  background-color: transparent;
  border-radius: 0;
}
.top-header .socials a:last-child i {
  border: 0 !important;
}
.rightContentTabs .v-sheet {
  background: transparent;
  box-shadow: none !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.navbar-area {
  position: relative;

  background: #fff;
}
.navbar-area .container-fluid {
  padding-left: 30px;
  padding-right: 30px;
}
.sectionBlock {
  margin-bottom: 50px;
}
.sectionBlock hr {
  display: block;
  width: 100%;
  height: 1px;
  background: #061e43;
  margin: 15px 0 30px 0;
}
.ui-accordion {
  background-color: transparent;
}
.courses__item-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 22px;
  margin: 15px 0;
}
.courses__item-meta li {
  display: flex;
  align-items: center;
  color: #b2bdcd;
}
.courses__item-meta li .author {
  display: flex;
  align-items: center;
  gap: 10px;
}
.courses__item-meta li a {
  color: #b2bdcd;
}
.courses__item-meta li i {
  color: #fff;
  font-size: 18px;
  margin-top: -1px;
  margin-right: 7px;
}
.courses__item-meta li .rating {
  display: flex;
  align-items: center;
}
.courses__item-meta li .rating i {
  font-size: 15px;
  margin: 0 5px 0 0;
  color: #94a3b882;
}
.courses__item-meta li .rating i.active {
  color: #f8bc24;
}

.courses__item-meta li .rating-count {
  margin-left: 5px;
}
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
}
.top-header__menu-toggle {
  display: none;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(6, 30, 67, 0.14);
  border-radius: 12px;
  background: #fff;
  color: #061e43;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.top-header__mobile-panel {
  display: none;
}
@media (max-width: 991px) {
  .navbar-area .container-fluid {
    padding-left: 16px;
    padding-right: 16px;
  }

  .top-header {
    gap: 12px;
    justify-content: space-between;
  }

  .top-header .main-menu,
  .top-header > div:last-of-type {
    display: none;
  }

  .top-header__menu-toggle {
    display: inline-flex;
  }

  .top-header__mobile-panel {
    display: grid;
    gap: 10px;
    padding: 14px 0 6px;
    border-top: 1px solid rgba(148, 163, 184, 0.22);
  }

  .top-header__mobile-panel a,
  .top-header__mobile-panel .topHeaderActionBtn,
  .top-header__mobile-panel .top-header__mobile-language {
    width: 100%;
    margin: 0;
  }

  .top-header__mobile-panel a {
    display: flex;
    align-items: center;
    min-height: 44px;
    color: #061e43;
    font-weight: 700;
    text-decoration: none;
  }

  .top-header__mobile-language {
    text-align: center;
  }
}
@media (max-width: 480px) {
  .top-header__mobile-panel a,
  .landing-header__language,
  .topHeaderActionBtn {
    font-size: 13px;
  }
}
.details-logo {
  height: 80px;
}
.courseMainContent {
  margin: 30px 0;
}
.page-title-area {
  background-color: #061e43;
  position: relative;
  z-index: 1;
  overflow: hidden;
}
.page-title-content {
  position: relative;
  z-index: 1;
  max-width: 700px;
  margin: auto;
  text-align: center;
  padding-top: 30px;
  padding-bottom: 30px;
}
.page-title-area-details .page-title-content {
  text-align: left;
  max-width: 100%;
}
.page-title-area-details p {
  color: #fff;
}
.page-title-content h2 {
  margin-top: 10px;
  font-size: 50px;
  color: #fff;
}
.page-title-content ul {
  padding-left: 0;
  list-style-type: none;
  margin-bottom: 0;
  direction: ltr;
}
.page-title-content ul li {
  display: inline-block;
  position: relative;
  font-size: 16px;
  padding-right: 15px;
  margin-left: 15px;
}
.page-title-content ul li:first-child {
  margin-left: 0;
}
.page-title-content ul li::before {
  content: "";
  position: absolute;
  top: 5px;
  right: -3px;
  background-color: #fff;
  width: 1px;
  height: 15px;
  transform: rotate(15deg);
}
.page-title-content ul li.active::before,
.page-title-area-details .page-title-content ul.list-wrap li::before {
  display: none;
}
.page-title-content ul li a {
  color: #fff;
}
.coursePreview {
  margin-bottom: 30px;
}
.page-title-content ul li:last-child {
  padding-right: 0;
}
.page-title-content ul li.active {
  color: #fff;
}
.courses-video-img {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
}
.courses-video-img img {
  width: 100%;
  height: 350px;
  margin: auto;
  object-fit: cover;
  display: block;
}
.courses-video-img .video-play {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  display: flex;
}
.public-course-preview-card {
  min-height: 350px;
  background: #061e43;
  box-shadow: 0 24px 60px rgba(6, 30, 67, 0.18);
}
.public-course-preview-card__image {
  transform: scale(1.01);
  transition: transform 0.45s ease;
}
.public-course-preview-card:hover .public-course-preview-card__image {
  transform: scale(1.06);
}
.public-course-preview-card__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(6, 30, 67, 0.08) 0%, rgba(6, 30, 67, 0.7) 100%),
    linear-gradient(135deg, rgba(13, 110, 253, 0.24), rgba(4, 188, 83, 0.12));
}
.public-course-preview-card__content {
  position: absolute;
  inset-inline: 1.4rem;
  bottom: 1.4rem;
  z-index: 2;
  color: #fff;
  display: grid;
  gap: 0.45rem;
  max-width: 70%;
}
.public-course-preview-card__badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  backdrop-filter: blur(12px);
}
.public-course-preview-card__title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 800;
  color: #fff;
}
.public-course-preview-card__meta {
  margin: 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.95rem;
}
.public-course-preview-card__play {
  top: auto;
  border: 0;
}
.public-course-preview-card__empty {
  position: relative;
  z-index: 2;
  padding: 0.75rem 1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-weight: 700;
  backdrop-filter: blur(12px);
}
.video-btn {
  display: inline-block;
  width: 80px;
  height: 80px;
  line-height: 80px;
  text-align: center;
  border-radius: 0;
  color: #fd9519;
  position: relative;
  top: 3px;
  z-index: 1;
  background-color: #061e43;
  border-radius: 50%;
  transition: all ease 0.5s;
  cursor: pointer;
}
.video-btn::after,
.video-btn::before {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  z-index: -1;
  bottom: 0;
  left: 0;
  border-radius: 0;
  border-radius: 50%;
  transition: all ease 0.5s;
  animation: ripple 1.6s ease-out infinite;
  background-color: #061e43;
}
.video-btn i {
  font-size: 42px;
  color: #fff;
  position: absolute;
  top: 0;
  left: 1px;
  justify-content: center;
  align-items: center;
  display: flex;
  width: 100%;
  height: 100%;
}
.public-course-preview-dialog {
  border-radius: 28px !important;
  overflow: hidden;
  background: #071a38;
  color: #fff;
}
.public-course-preview-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0.75rem;
}
.public-course-preview-dialog__copy {
  display: grid;
  gap: 0.2rem;
}
.public-course-preview-dialog__eyebrow {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.68);
}
.public-course-preview-dialog__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
}
.public-course-preview-dialog__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.public-course-preview-dialog__body {
  padding: 0 1.25rem 1.25rem !important;
}
.public-course-preview-dialog__frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 22px;
  overflow: hidden;
  background: #000;
}
.public-course-preview-dialog__embed,
.public-course-preview-dialog__player {
  width: 100%;
  height: 100%;
  display: block;
}

@media (max-width: 767px) {
  .public-course-preview-card__content {
    max-width: 100%;
    inset-inline: 1rem;
    bottom: 1rem;
  }

  .public-course-preview-card,
  .courses-video-img img {
    height: 280px;
  }

  .video-btn {
    width: 68px;
    height: 68px;
    line-height: 68px;
  }

  .video-btn i {
    font-size: 34px;
  }
}

@media (max-width: 767px) {
  .public-course-preview-card {
    min-height: 280px;
    border-radius: 22px;
  }

  .public-course-preview-card__title {
    font-size: 1.15rem;
  }

  .public-course-preview-card__meta {
    font-size: 0.88rem;
  }

  .public-course-preview-dialog {
    border-radius: 22px !important;
  }

  .public-course-preview-dialog__header {
    padding: 1rem 1rem 0.5rem;
  }

  .public-course-preview-dialog__body {
    padding: 0 1rem 1rem !important;
  }
}

@media (max-width: 480px) {
  .public-course-preview-card,
  .courses-video-img img {
    height: 220px;
  }

  .public-course-preview-card__content {
    inset-inline: 0.85rem;
    bottom: 0.85rem;
    gap: 0.35rem;
  }

  .public-course-preview-dialog__title {
    font-size: 1.05rem;
  }

  .video-btn {
    width: 60px;
    height: 60px;
    line-height: 60px;
  }

  .video-btn i {
    font-size: 30px;
  }
}
@keyframes ripple {
  0%,
  35% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: scale(2);
  }
}

.card {
  position: relative;
  margin-bottom: 1.5rem;
  width: 100%;
}
.card {
  position: relative;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-direction: column;
  flex-direction: column;
  min-width: 0;
  word-wrap: break-word;
  background-color: #fff;
  background-clip: border-box;
  border: 1px solid #e0e8f3;
  border-radius: 3px;
}
.card-body {
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  margin: 0;
  padding: 1.5rem 1.5rem;
  position: relative;
  height: 100%;
}
.mb-5,
.my-5 {
  margin-bottom: 1.5rem !important;
}
.text-dark {
  color: #2e384d !important;
}
.mb-2,
.my-2 {
  margin-bottom: 0.5rem !important;
}
.strike-text {
  text-decoration: line-through;
}
.text-danger {
  color: #f84242 !important;
}
.btn-primary {
  color: #fff;
  background-color: #ec296b !important;
  border-color: #ec296b !important;
}
.btn-info {
  color: #fff;
  background-color: #0d6efd !important;
  border-color: #0d6efd !important;
}
.btn-secondary {
  color: #fff;
  background-color: #061e43 !important;
  border-color: #061e43 !important;
}
.btnEEnrolll.btn-secondary{
    background: #061e43 !important;
    width: 100%;
}
.course-statistics .btn-secondary {
  color: #fff;
  background-color: #04bc53 !important;
  border-color: #04bc53 !important;
}
.btn-block {
  display: block;
  text-align: center;
  text-decoration: none;
  padding: 10px 0;
  margin-bottom: 10px;
  font-weight: bold;
}
.card-header:first-child {
  border-radius: calc(0.25rem - 1px) calc(0.25rem - 1px) 0 0;
}
.card-header {
  background: 0 0;
  padding: 0.5rem 1.5rem;
  display: -ms-flexbox;
  display: flex;
  min-height: 3.5rem;
  -ms-flex-align: center;
  align-items: center;
  margin-bottom: 0;
  border-bottom: 1px solid #e0e8f3;
}
.card-title {
  font-size: 20px;
  color: #061e43;
  font-weight: bold !important;
}
.profile-pic {
  text-align: center;
}
.avatar-xxl {
  width: 50px;
  height: 50px;
  line-height: 50px;
  font-size: 2rem;
  margin: auto;
}
.brround {
  border-radius: 50%;
}
.btn-group-sm > .btn,
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.33333333;
  border-radius: 3px;
}

.statusBtns .btn {
  margin: 0 5px 0 0;
}
.course-statistics {
  margin: 30px 0;
}
.v-tabs--inset.v-tabs--horizontal {
  background-color: transparent;
  background: transparent !important;
  box-shadow: none !important;
}
.v-slide-group {
  border-radius: 0 !important;
}
.v-tabs--inset .v-tab.v-tab.v-btn {
  background: transparent;
  font-weight: bold;
  color: #061e43;
  padding: 5px 0;
  margin: 0;
}
.v-tab-item--selected {
  background: transparent !important;
  color: #061e43 !important;
  box-shadow: none !important;
  border-bottom: 2px solid #061e43;
  border-radius: 0 !important;
}

::v-deep(.v-tab__slider) {
  border-radius: 0 !important;
  background-color: transparent !important;
}
.v-tabs-window {
  min-height: 600px;
  padding: 20px 0;
}
</style>
<style scoped>
:deep(.v-sheet ul) {
  padding-left: 20px !important;
}
:root,
[data-bs-theme="light"] {
  --bs-blue: #0d6efd;
  --bs-indigo: #6610f2;
  --bs-purple: #6f42c1;
  --bs-pink: #d63384;
  --bs-red: #dc3545;
  --bs-orange: #fd7e14;
  --bs-yellow: #ffc107;
  --bs-green: #198754;
  --bs-teal: #20c997;
  --bs-cyan: #0dcaf0;
  --bs-black: #000;
  --bs-white: #fff;
  --bs-gray: #6c757d;
  --bs-gray-dark: #343a40;
  --bs-gray-100: #f8f9fa;
  --bs-gray-200: #e9ecef;
  --bs-gray-300: #dee2e6;
  --bs-gray-400: #ced4da;
  --bs-gray-500: #adb5bd;
  --bs-gray-600: #6c757d;
  --bs-gray-700: #495057;
  --bs-gray-800: #343a40;
  --bs-gray-900: #212529;
  --bs-primary: #0d6efd;
  --bs-secondary: #6c757d;
  --bs-success: #198754;
  --bs-info: #0dcaf0;
  --bs-warning: #ffc107;
  --bs-danger: #dc3545;
  --bs-light: #f8f9fa;
  --bs-dark: #212529;
  --bs-primary-rgb: 13, 110, 253;
  --bs-secondary-rgb: 108, 117, 125;
  --bs-success-rgb: 25, 135, 84;
  --bs-info-rgb: 13, 202, 240;
  --bs-warning-rgb: 255, 193, 7;
  --bs-danger-rgb: 220, 53, 69;
  --bs-light-rgb: 248, 249, 250;
  --bs-dark-rgb: 33, 37, 41;
  --bs-primary-text-emphasis: #052c65;
  --bs-secondary-text-emphasis: #2b2f32;
  --bs-success-text-emphasis: #0a3622;
  --bs-info-text-emphasis: #055160;
  --bs-warning-text-emphasis: #664d03;
  --bs-danger-text-emphasis: #58151c;
  --bs-light-text-emphasis: #495057;
  --bs-dark-text-emphasis: #495057;
  --bs-primary-bg-subtle: #cfe2ff;
  --bs-secondary-bg-subtle: #e2e3e5;
  --bs-success-bg-subtle: #d1e7dd;
  --bs-info-bg-subtle: #cff4fc;
  --bs-warning-bg-subtle: #fff3cd;
  --bs-danger-bg-subtle: #f8d7da;
  --bs-light-bg-subtle: #fcfcfd;
  --bs-dark-bg-subtle: #ced4da;
  --bs-primary-border-subtle: #9ec5fe;
  --bs-secondary-border-subtle: #c4c8cb;
  --bs-success-border-subtle: #a3cfbb;
  --bs-info-border-subtle: #9eeaf9;
  --bs-warning-border-subtle: #ffe69c;
  --bs-danger-border-subtle: #f1aeb5;
  --bs-light-border-subtle: #e9ecef;
  --bs-dark-border-subtle: #adb5bd;
  --bs-white-rgb: 255, 255, 255;
  --bs-black-rgb: 0, 0, 0;
  --bs-font-sans-serif: system-ui, -apple-system, "Segoe UI", Roboto,
    "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --bs-font-monospace: SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  --bs-gradient: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.15),
    rgba(255, 255, 255, 0)
  );
  --bs-body-font-family: var(--bs-font-sans-serif);
  --bs-body-font-size: 1rem;
  --bs-body-font-weight: 400;
  --bs-body-line-height: 1.5;
  --bs-body-color: #212529;
  --bs-body-color-rgb: 33, 37, 41;
  --bs-body-bg: #fff;
  --bs-body-bg-rgb: 255, 255, 255;
  --bs-emphasis-color: #000;
  --bs-emphasis-color-rgb: 0, 0, 0;
  --bs-secondary-color: rgba(33, 37, 41, 0.75);
  --bs-secondary-color-rgb: 33, 37, 41;
  --bs-secondary-bg: #e9ecef;
  --bs-secondary-bg-rgb: 233, 236, 239;
  --bs-tertiary-color: rgba(33, 37, 41, 0.5);
  --bs-tertiary-color-rgb: 33, 37, 41;
  --bs-tertiary-bg: #f8f9fa;
  --bs-tertiary-bg-rgb: 248, 249, 250;
  --bs-heading-color: inherit;
  --bs-link-color: #0d6efd;
  --bs-link-color-rgb: 13, 110, 253;
  --bs-link-decoration: underline;
  --bs-link-hover-color: #0a58ca;
  --bs-link-hover-color-rgb: 10, 88, 202;
  --bs-code-color: #d63384;
  --bs-highlight-color: #212529;
  --bs-highlight-bg: #fff3cd;
  --bs-border-width: 1px;
  --bs-border-style: solid;
  --bs-border-color: #dee2e6;
  --bs-border-color-translucent: rgba(0, 0, 0, 0.175);
  --bs-border-radius: 0.375rem;
  --bs-border-radius-sm: 0.25rem;
  --bs-border-radius-lg: 0.5rem;
  --bs-border-radius-xl: 1rem;
  --bs-border-radius-xxl: 2rem;
  --bs-border-radius-2xl: var(--bs-border-radius-xxl);
  --bs-border-radius-pill: 50rem;
  --bs-box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  --bs-box-shadow-sm: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  --bs-box-shadow-lg: 0 1rem 3rem rgba(0, 0, 0, 0.175);
  --bs-box-shadow-inset: inset 0 1px 2px rgba(0, 0, 0, 0.075);
  --bs-focus-ring-width: 0.25rem;
  --bs-focus-ring-opacity: 0.25;
  --bs-focus-ring-color: rgba(13, 110, 253, 0.25);
  --bs-form-valid-color: #198754;
  --bs-form-valid-border-color: #198754;
  --bs-form-invalid-color: #dc3545;
  --bs-form-invalid-border-color: #dc3545;
}
[data-bs-theme="dark"] {
  color-scheme: dark;
  --bs-body-color: #dee2e6;
  --bs-body-color-rgb: 222, 226, 230;
  --bs-body-bg: #212529;
  --bs-body-bg-rgb: 33, 37, 41;
  --bs-emphasis-color: #fff;
  --bs-emphasis-color-rgb: 255, 255, 255;
  --bs-secondary-color: rgba(222, 226, 230, 0.75);
  --bs-secondary-color-rgb: 222, 226, 230;
  --bs-secondary-bg: #343a40;
  --bs-secondary-bg-rgb: 52, 58, 64;
  --bs-tertiary-color: rgba(222, 226, 230, 0.5);
  --bs-tertiary-color-rgb: 222, 226, 230;
  --bs-tertiary-bg: #2b3035;
  --bs-tertiary-bg-rgb: 43, 48, 53;
  --bs-primary-text-emphasis: #6ea8fe;
  --bs-secondary-text-emphasis: #a7acb1;
  --bs-success-text-emphasis: #75b798;
  --bs-info-text-emphasis: #6edff6;
  --bs-warning-text-emphasis: #ffda6a;
  --bs-danger-text-emphasis: #ea868f;
  --bs-light-text-emphasis: #f8f9fa;
  --bs-dark-text-emphasis: #dee2e6;
  --bs-primary-bg-subtle: #031633;
  --bs-secondary-bg-subtle: #161719;
  --bs-success-bg-subtle: #051b11;
  --bs-info-bg-subtle: #032830;
  --bs-warning-bg-subtle: #332701;
  --bs-danger-bg-subtle: #2c0b0e;
  --bs-light-bg-subtle: #343a40;
  --bs-dark-bg-subtle: #1a1d20;
  --bs-primary-border-subtle: #084298;
  --bs-secondary-border-subtle: #41464b;
  --bs-success-border-subtle: #0f5132;
  --bs-info-border-subtle: #087990;
  --bs-warning-border-subtle: #997404;
  --bs-danger-border-subtle: #842029;
  --bs-light-border-subtle: #495057;
  --bs-dark-border-subtle: #343a40;
  --bs-heading-color: inherit;
  --bs-link-color: #6ea8fe;
  --bs-link-hover-color: #8bb9fe;
  --bs-link-color-rgb: 110, 168, 254;
  --bs-link-hover-color-rgb: 139, 185, 254;
  --bs-code-color: #e685b5;
  --bs-highlight-color: #dee2e6;
  --bs-highlight-bg: #664d03;
  --bs-border-color: #495057;
  --bs-border-color-translucent: rgba(255, 255, 255, 0.15);
  --bs-form-valid-color: #75b798;
  --bs-form-valid-border-color: #75b798;
  --bs-form-invalid-color: #ea868f;
  --bs-form-invalid-border-color: #ea868f;
}
*,
::after,
::before {
  box-sizing: border-box;
}
@media (prefers-reduced-motion: no-preference) {
  :root {
    scroll-behavior: smooth;
  }
}
body {
  margin: 0;
  font-family: var(--bs-body-font-family);
  font-size: var(--bs-body-font-size);
  font-weight: var(--bs-body-font-weight);
  line-height: var(--bs-body-line-height);
  color: var(--bs-body-color);
  text-align: var(--bs-body-text-align);
  background-color: var(--bs-body-bg);
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: #fff0;
}
hr {
  margin: 1rem 0;
  color: inherit;
  border: 0;
  border-top: var(--bs-border-width) solid;
  opacity: 0.25;
}
.h1,
.h2,
.h3,
.h4,
.h5,
.h6,
h1,
h2,
h3,
h4,
h5,
h6 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-weight: 500;
  line-height: 1.2;
  color: var(--bs-heading-color);
}
.h1,
h1 {
  font-size: calc(1.375rem + 1.5vw);
}
@media (min-width: 1200px) {
  .h1,
  h1 {
    font-size: 2.5rem;
  }
}
.h2,
h2 {
  font-size: calc(1.325rem + 0.9vw);
}
@media (min-width: 1200px) {
  .h2,
  h2 {
    font-size: 2rem;
  }
}
.h3,
h3 {
  font-size: calc(1.3rem + 0.6vw);
}
@media (min-width: 1200px) {
  .h3,
  h3 {
    font-size: 1.75rem;
  }
}
.h4,
h4 {
  font-size: calc(1.275rem + 0.3vw);
}
@media (min-width: 1200px) {
  .h4,
  h4 {
    font-size: 1.5rem;
  }
}
.h5,
h5 {
  font-size: 1.25rem;
}
.h6,
h6 {
  font-size: 1rem;
}
p {
  margin-top: 0;
  margin-bottom: 1rem;
}
abbr[title] {
  -webkit-text-decoration: underline dotted;
  text-decoration: underline dotted;
  cursor: help;
  -webkit-text-decoration-skip-ink: none;
  text-decoration-skip-ink: none;
}
address {
  margin-bottom: 1rem;
  font-style: normal;
  line-height: inherit;
}
ol,
ul {
  padding-left: 2rem;
}
dl,
ol,
ul {
  margin-top: 0;
  margin-bottom: 1rem;
}
ol ol,
ol ul,
ul ol,
ul ul {
  margin-bottom: 0;
}
dt {
  font-weight: 700;
}
dd {
  margin-bottom: 0.5rem;
  margin-left: 0;
}
blockquote {
  margin: 0 0 1rem;
}
b,
strong {
  font-weight: bolder;
}
.small,
small {
  font-size: 0.875em;
}
.mark,
mark {
  padding: 0.1875em;
  color: var(--bs-highlight-color);
  background-color: var(--bs-highlight-bg);
}
sub,
sup {
  position: relative;
  font-size: 0.75em;
  line-height: 0;
  vertical-align: baseline;
}
sub {
  bottom: -0.25em;
}
sup {
  top: -0.5em;
}
a {
  color: rgba(var(--bs-link-color-rgb), var(--bs-link-opacity, 1));
}
a:hover {
  --bs-link-color-rgb: var(--bs-link-hover-color-rgb);
}
a:not([href]):not([class]),
a:not([href]):not([class]):hover {
  color: inherit;
  text-decoration: none;
}
code,
kbd,
pre,
samp {
  font-family: var(--bs-font-monospace);
  font-size: 1em;
}
pre {
  display: block;
  margin-top: 0;
  margin-bottom: 1rem;
  overflow: auto;
  font-size: 0.875em;
}
pre code {
  font-size: inherit;
  color: inherit;
  word-break: normal;
}
code {
  font-size: 0.875em;
  color: var(--bs-code-color);
  word-wrap: break-word;
}
a > code {
  color: inherit;
}
kbd {
  padding: 0.1875rem 0.375rem;
  font-size: 0.875em;
  color: var(--bs-body-bg);
  background-color: var(--bs-body-color);
  border-radius: 0.25rem;
}
kbd kbd {
  padding: 0;
  font-size: 1em;
}
figure {
  margin: 0 0 1rem;
}
img,
svg {
  vertical-align: middle;
}
table {
  caption-side: bottom;
  border-collapse: collapse;
}
caption {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  color: var(--bs-secondary-color);
  text-align: left;
}
th {
  text-align: inherit;
  text-align: -webkit-match-parent;
}
tbody,
td,
tfoot,
th,
thead,
tr {
  border-color: inherit;
  border-style: solid;
  border-width: 0;
}
label {
  display: inline-block;
}
button {
  border-radius: 0;
}
button:focus:not(:focus-visible) {
  outline: 0;
}
button,
input,
optgroup,
select,
textarea {
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}
button,
select {
  text-transform: none;
}
[role="button"] {
  cursor: pointer;
}
select {
  word-wrap: normal;
}
select:disabled {
  opacity: 1;
}
[list]:not([type="date"]):not([type="datetime-local"]):not([type="month"]):not(
    [type="week"]
  ):not([type="time"])::-webkit-calendar-picker-indicator {
  display: none !important;
}
[type="button"],
[type="reset"],
[type="submit"],
button {
  -webkit-appearance: button;
}
[type="button"]:not(:disabled),
[type="reset"]:not(:disabled),
[type="submit"]:not(:disabled),
button:not(:disabled) {
  cursor: pointer;
}
::-moz-focus-inner {
  padding: 0;
  border-style: none;
}
textarea {
  resize: vertical;
}
fieldset {
  min-width: 0;
  padding: 0;
  margin: 0;
  border: 0;
}
legend {
  float: left;
  width: 100%;
  padding: 0;
  margin-bottom: 0.5rem;
  line-height: inherit;
  font-size: calc(1.275rem + 0.3vw);
}
@media (min-width: 1200px) {
  legend {
    font-size: 1.5rem;
  }
}
legend + * {
  clear: left;
}
::-webkit-datetime-edit-day-field,
::-webkit-datetime-edit-fields-wrapper,
::-webkit-datetime-edit-hour-field,
::-webkit-datetime-edit-minute,
::-webkit-datetime-edit-month-field,
::-webkit-datetime-edit-text,
::-webkit-datetime-edit-year-field {
  padding: 0;
}
::-webkit-inner-spin-button {
  height: auto;
}
[type="search"] {
  -webkit-appearance: textfield;
  outline-offset: -2px;
}
[type="search"]::-webkit-search-cancel-button {
  cursor: pointer;
  filter: grayscale(1);
}
::-webkit-search-decoration {
  -webkit-appearance: none;
}
::-webkit-color-swatch-wrapper {
  padding: 0;
}
::-webkit-file-upload-button {
  font: inherit;
  -webkit-appearance: button;
}
::file-selector-button {
  font: inherit;
  -webkit-appearance: button;
}
output {
  display: inline-block;
}
iframe {
  border: 0;
}
summary {
  display: list-item;
  cursor: pointer;
}
progress {
  vertical-align: baseline;
}
[hidden] {
  display: none !important;
}
.lead {
  font-size: 1.25rem;
  font-weight: 300;
}
.display-1 {
  font-weight: 300;
  line-height: 1.2;
  font-size: calc(1.625rem + 4.5vw);
}
@media (min-width: 1200px) {
  .display-1 {
    font-size: 5rem;
  }
}
.display-2 {
  font-weight: 300;
  line-height: 1.2;
  font-size: calc(1.575rem + 3.9vw);
}
@media (min-width: 1200px) {
  .display-2 {
    font-size: 4.5rem;
  }
}
.display-3 {
  font-weight: 300;
  line-height: 1.2;
  font-size: calc(1.525rem + 3.3vw);
}
@media (min-width: 1200px) {
  .display-3 {
    font-size: 4rem;
  }
}
.display-4 {
  font-weight: 300;
  line-height: 1.2;
  font-size: calc(1.475rem + 2.7vw);
}
@media (min-width: 1200px) {
  .display-4 {
    font-size: 3.5rem;
  }
}
.display-5 {
  font-weight: 300;
  line-height: 1.2;
  font-size: calc(1.425rem + 2.1vw);
}
@media (min-width: 1200px) {
  .display-5 {
    font-size: 3rem;
  }
}
.display-6 {
  font-weight: 300;
  line-height: 1.2;
  font-size: calc(1.375rem + 1.5vw);
}
@media (min-width: 1200px) {
  .display-6 {
    font-size: 2.5rem;
  }
}
.list-unstyled {
  padding-left: 0;
  list-style: none;
}
.list-inline {
  padding-left: 0;
  list-style: none;
}
.list-inline-item {
  display: inline-block;
}
.list-inline-item:not(:last-child) {
  margin-right: 0.5rem;
}
.initialism {
  font-size: 0.875em;
  text-transform: uppercase;
}
.blockquote {
  margin-bottom: 1rem;
  font-size: 1.25rem;
}
.blockquote > :last-child {
  margin-bottom: 0;
}
.blockquote-footer {
  margin-top: -1rem;
  margin-bottom: 1rem;
  font-size: 0.875em;
  color: #6c757d;
}
.blockquote-footer::before {
  content: "— ";
}
.img-fluid {
  max-width: 100%;
  height: auto;
}
.img-thumbnail {
  padding: 0.25rem;
  background-color: var(--bs-body-bg);
  border: var(--bs-border-width) solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  max-width: 100%;
  height: auto;
}
.figure {
  display: inline-block;
}
.figure-img {
  margin-bottom: 0.5rem;
  line-height: 1;
}
.figure-caption {
  font-size: 0.875em;
  color: var(--bs-secondary-color);
}
.container,
.container-fluid,
.container-lg,
.container-md,
.container-sm,
.container-xl,
.container-xxl {
  --bs-gutter-x: 1.5rem;
  --bs-gutter-y: 0;
  width: 100%;
  padding-right: calc(var(--bs-gutter-x) * 0.5);
  padding-left: calc(var(--bs-gutter-x) * 0.5);
  margin-right: auto;
  margin-left: auto;
}
@media (min-width: 576px) {
  .container,
  .container-sm {
    max-width: 540px;
  }
}
@media (min-width: 768px) {
  .container,
  .container-md,
  .container-sm {
    max-width: 720px;
  }
}
@media (min-width: 992px) {
  .container,
  .container-lg,
  .container-md,
  .container-sm {
    max-width: 960px;
  }
}
@media (min-width: 1200px) {
  .container,
  .container-lg,
  .container-md,
  .container-sm,
  .container-xl {
    max-width: 1140px;
  }
}
@media (min-width: 1400px) {
  .container,
  .container-lg,
  .container-md,
  .container-sm,
  .container-xl,
  .container-xxl {
    max-width: 1320px;
  }
}
:root {
  --bs-breakpoint-xs: 0;
  --bs-breakpoint-sm: 576px;
  --bs-breakpoint-md: 768px;
  --bs-breakpoint-lg: 992px;
  --bs-breakpoint-xl: 1200px;
  --bs-breakpoint-xxl: 1400px;
}
.row {
  --bs-gutter-x: 1.5rem;
  --bs-gutter-y: 0;
  display: flex;
  flex-wrap: wrap;
  margin-top: calc(-1 * var(--bs-gutter-y));
  margin-right: calc(-0.5 * var(--bs-gutter-x));
  margin-left: calc(-0.5 * var(--bs-gutter-x));
}
.row > * {
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
  padding-right: calc(var(--bs-gutter-x) * 0.5);
  padding-left: calc(var(--bs-gutter-x) * 0.5);
  margin-top: var(--bs-gutter-y);
}
.col {
  flex: 1 0 0%;
}
.row-cols-auto > * {
  flex: 0 0 auto;
  width: auto;
}
.row-cols-1 > * {
  flex: 0 0 auto;
  width: 100%;
}
.row-cols-2 > * {
  flex: 0 0 auto;
  width: 50%;
}
.row-cols-3 > * {
  flex: 0 0 auto;
  width: 33.33333333%;
}
.row-cols-4 > * {
  flex: 0 0 auto;
  width: 25%;
}
.row-cols-5 > * {
  flex: 0 0 auto;
  width: 20%;
}
.row-cols-6 > * {
  flex: 0 0 auto;
  width: 16.66666667%;
}
.col-auto {
  flex: 0 0 auto;
  width: auto;
}
.col-1 {
  flex: 0 0 auto;
  width: 8.33333333%;
}
.col-2 {
  flex: 0 0 auto;
  width: 16.66666667%;
}
.col-3 {
  flex: 0 0 auto;
  width: 25%;
}
.col-4 {
  flex: 0 0 auto;
  width: 33.33333333%;
}
.col-5 {
  flex: 0 0 auto;
  width: 41.66666667%;
}
.col-6 {
  flex: 0 0 auto;
  width: 50%;
}
.col-7 {
  flex: 0 0 auto;
  width: 58.33333333%;
}
.col-8 {
  flex: 0 0 auto;
  width: 66.66666667%;
}
.col-9 {
  flex: 0 0 auto;
  width: 75%;
}
.col-10 {
  flex: 0 0 auto;
  width: 83.33333333%;
}
.col-11 {
  flex: 0 0 auto;
  width: 91.66666667%;
}
.col-12 {
  flex: 0 0 auto;
  width: 100%;
}
.offset-1 {
  margin-left: 8.33333333%;
}
.offset-2 {
  margin-left: 16.66666667%;
}
.offset-3 {
  margin-left: 25%;
}
.offset-4 {
  margin-left: 33.33333333%;
}
.offset-5 {
  margin-left: 41.66666667%;
}
.offset-6 {
  margin-left: 50%;
}
.offset-7 {
  margin-left: 58.33333333%;
}
.offset-8 {
  margin-left: 66.66666667%;
}
.offset-9 {
  margin-left: 75%;
}
.offset-10 {
  margin-left: 83.33333333%;
}
.offset-11 {
  margin-left: 91.66666667%;
}
.g-0,
.gx-0 {
  --bs-gutter-x: 0;
}
.g-0,
.gy-0 {
  --bs-gutter-y: 0;
}
.g-1,
.gx-1 {
  --bs-gutter-x: 0.25rem;
}
.g-1,
.gy-1 {
  --bs-gutter-y: 0.25rem;
}
.g-2,
.gx-2 {
  --bs-gutter-x: 0.5rem;
}
.g-2,
.gy-2 {
  --bs-gutter-y: 0.5rem;
}
.g-3,
.gx-3 {
  --bs-gutter-x: 1rem;
}
.g-3,
.gy-3 {
  --bs-gutter-y: 1rem;
}
.g-4,
.gx-4 {
  --bs-gutter-x: 1.5rem;
}
.g-4,
.gy-4 {
  --bs-gutter-y: 1.5rem;
}
.g-5,
.gx-5 {
  --bs-gutter-x: 3rem;
}
.g-5,
.gy-5 {
  --bs-gutter-y: 3rem;
}
@media (min-width: 576px) {
  .col-sm {
    flex: 1 0 0%;
  }
  .row-cols-sm-auto > * {
    flex: 0 0 auto;
    width: auto;
  }
  .row-cols-sm-1 > * {
    flex: 0 0 auto;
    width: 100%;
  }
  .row-cols-sm-2 > * {
    flex: 0 0 auto;
    width: 50%;
  }
  .row-cols-sm-3 > * {
    flex: 0 0 auto;
    width: 33.33333333%;
  }
  .row-cols-sm-4 > * {
    flex: 0 0 auto;
    width: 25%;
  }
  .row-cols-sm-5 > * {
    flex: 0 0 auto;
    width: 20%;
  }
  .row-cols-sm-6 > * {
    flex: 0 0 auto;
    width: 16.66666667%;
  }
  .col-sm-auto {
    flex: 0 0 auto;
    width: auto;
  }
  .col-sm-1 {
    flex: 0 0 auto;
    width: 8.33333333%;
  }
  .col-sm-2 {
    flex: 0 0 auto;
    width: 16.66666667%;
  }
  .col-sm-3 {
    flex: 0 0 auto;
    width: 25%;
  }
  .col-sm-4 {
    flex: 0 0 auto;
    width: 33.33333333%;
  }
  .col-sm-5 {
    flex: 0 0 auto;
    width: 41.66666667%;
  }
  .col-sm-6 {
    flex: 0 0 auto;
    width: 50%;
  }
  .col-sm-7 {
    flex: 0 0 auto;
    width: 58.33333333%;
  }
  .col-sm-8 {
    flex: 0 0 auto;
    width: 66.66666667%;
  }
  .col-sm-9 {
    flex: 0 0 auto;
    width: 75%;
  }
  .col-sm-10 {
    flex: 0 0 auto;
    width: 83.33333333%;
  }
  .col-sm-11 {
    flex: 0 0 auto;
    width: 91.66666667%;
  }
  .col-sm-12 {
    flex: 0 0 auto;
    width: 100%;
  }
  .offset-sm-0 {
    margin-left: 0;
  }
  .offset-sm-1 {
    margin-left: 8.33333333%;
  }
  .offset-sm-2 {
    margin-left: 16.66666667%;
  }
  .offset-sm-3 {
    margin-left: 25%;
  }
  .offset-sm-4 {
    margin-left: 33.33333333%;
  }
  .offset-sm-5 {
    margin-left: 41.66666667%;
  }
  .offset-sm-6 {
    margin-left: 50%;
  }
  .offset-sm-7 {
    margin-left: 58.33333333%;
  }
  .offset-sm-8 {
    margin-left: 66.66666667%;
  }
  .offset-sm-9 {
    margin-left: 75%;
  }
  .offset-sm-10 {
    margin-left: 83.33333333%;
  }
  .offset-sm-11 {
    margin-left: 91.66666667%;
  }
  .g-sm-0,
  .gx-sm-0 {
    --bs-gutter-x: 0;
  }
  .g-sm-0,
  .gy-sm-0 {
    --bs-gutter-y: 0;
  }
  .g-sm-1,
  .gx-sm-1 {
    --bs-gutter-x: 0.25rem;
  }
  .g-sm-1,
  .gy-sm-1 {
    --bs-gutter-y: 0.25rem;
  }
  .g-sm-2,
  .gx-sm-2 {
    --bs-gutter-x: 0.5rem;
  }
  .g-sm-2,
  .gy-sm-2 {
    --bs-gutter-y: 0.5rem;
  }
  .g-sm-3,
  .gx-sm-3 {
    --bs-gutter-x: 1rem;
  }
  .g-sm-3,
  .gy-sm-3 {
    --bs-gutter-y: 1rem;
  }
  .g-sm-4,
  .gx-sm-4 {
    --bs-gutter-x: 1.5rem;
  }
  .g-sm-4,
  .gy-sm-4 {
    --bs-gutter-y: 1.5rem;
  }
  .g-sm-5,
  .gx-sm-5 {
    --bs-gutter-x: 3rem;
  }
  .g-sm-5,
  .gy-sm-5 {
    --bs-gutter-y: 3rem;
  }
}
@media (min-width: 768px) {
  .col-md {
    flex: 1 0 0%;
  }
  .row-cols-md-auto > * {
    flex: 0 0 auto;
    width: auto;
  }
  .row-cols-md-1 > * {
    flex: 0 0 auto;
    width: 100%;
  }
  .row-cols-md-2 > * {
    flex: 0 0 auto;
    width: 50%;
  }
  .row-cols-md-3 > * {
    flex: 0 0 auto;
    width: 33.33333333%;
  }
  .row-cols-md-4 > * {
    flex: 0 0 auto;
    width: 25%;
  }
  .row-cols-md-5 > * {
    flex: 0 0 auto;
    width: 20%;
  }
  .row-cols-md-6 > * {
    flex: 0 0 auto;
    width: 16.66666667%;
  }
  .col-md-auto {
    flex: 0 0 auto;
    width: auto;
  }
  .col-md-1 {
    flex: 0 0 auto;
    width: 8.33333333%;
  }
  .col-md-2 {
    flex: 0 0 auto;
    width: 16.66666667%;
  }
  .col-md-3 {
    flex: 0 0 auto;
    width: 25%;
  }
  .col-md-4 {
    flex: 0 0 auto;
    width: 33.33333333%;
  }
  .col-md-5 {
    flex: 0 0 auto;
    width: 41.66666667%;
  }
  .col-md-6 {
    flex: 0 0 auto;
    width: 50%;
  }
  .col-md-7 {
    flex: 0 0 auto;
    width: 58.33333333%;
  }
  .col-md-8 {
    flex: 0 0 auto;
    width: 66.66666667%;
  }
  .col-md-9 {
    flex: 0 0 auto;
    width: 75%;
  }
  .col-md-10 {
    flex: 0 0 auto;
    width: 83.33333333%;
  }
  .col-md-11 {
    flex: 0 0 auto;
    width: 91.66666667%;
  }
  .col-md-12 {
    flex: 0 0 auto;
    width: 100%;
  }
  .offset-md-0 {
    margin-left: 0;
  }
  .offset-md-1 {
    margin-left: 8.33333333%;
  }
  .offset-md-2 {
    margin-left: 16.66666667%;
  }
  .offset-md-3 {
    margin-left: 25%;
  }
  .offset-md-4 {
    margin-left: 33.33333333%;
  }
  .offset-md-5 {
    margin-left: 41.66666667%;
  }
  .offset-md-6 {
    margin-left: 50%;
  }
  .offset-md-7 {
    margin-left: 58.33333333%;
  }
  .offset-md-8 {
    margin-left: 66.66666667%;
  }
  .offset-md-9 {
    margin-left: 75%;
  }
  .offset-md-10 {
    margin-left: 83.33333333%;
  }
  .offset-md-11 {
    margin-left: 91.66666667%;
  }
  .g-md-0,
  .gx-md-0 {
    --bs-gutter-x: 0;
  }
  .g-md-0,
  .gy-md-0 {
    --bs-gutter-y: 0;
  }
  .g-md-1,
  .gx-md-1 {
    --bs-gutter-x: 0.25rem;
  }
  .g-md-1,
  .gy-md-1 {
    --bs-gutter-y: 0.25rem;
  }
  .g-md-2,
  .gx-md-2 {
    --bs-gutter-x: 0.5rem;
  }
  .g-md-2,
  .gy-md-2 {
    --bs-gutter-y: 0.5rem;
  }
  .g-md-3,
  .gx-md-3 {
    --bs-gutter-x: 1rem;
  }
  .g-md-3,
  .gy-md-3 {
    --bs-gutter-y: 1rem;
  }
  .g-md-4,
  .gx-md-4 {
    --bs-gutter-x: 1.5rem;
  }
  .g-md-4,
  .gy-md-4 {
    --bs-gutter-y: 1.5rem;
  }
  .g-md-5,
  .gx-md-5 {
    --bs-gutter-x: 3rem;
  }
  .g-md-5,
  .gy-md-5 {
    --bs-gutter-y: 3rem;
  }
}
@media (min-width: 992px) {
  .col-lg {
    flex: 1 0 0%;
  }
  .row-cols-lg-auto > * {
    flex: 0 0 auto;
    width: auto;
  }
  .row-cols-lg-1 > * {
    flex: 0 0 auto;
    width: 100%;
  }
  .row-cols-lg-2 > * {
    flex: 0 0 auto;
    width: 50%;
  }
  .row-cols-lg-3 > * {
    flex: 0 0 auto;
    width: 33.33333333%;
  }
  .row-cols-lg-4 > * {
    flex: 0 0 auto;
    width: 25%;
  }
  .row-cols-lg-5 > * {
    flex: 0 0 auto;
    width: 20%;
  }
  .row-cols-lg-6 > * {
    flex: 0 0 auto;
    width: 16.66666667%;
  }
  .col-lg-auto {
    flex: 0 0 auto;
    width: auto;
  }
  .col-lg-1 {
    flex: 0 0 auto;
    width: 8.33333333%;
  }
  .col-lg-2 {
    flex: 0 0 auto;
    width: 16.66666667%;
  }
  .col-lg-3 {
    flex: 0 0 auto;
    width: 25%;
  }
  .col-lg-4 {
    flex: 0 0 auto;
    width: 33.33333333%;
  }
  .col-lg-5 {
    flex: 0 0 auto;
    width: 41.66666667%;
  }
  .col-lg-6 {
    flex: 0 0 auto;
    width: 50%;
  }
  .col-lg-7 {
    flex: 0 0 auto;
    width: 58.33333333%;
  }
  .col-lg-8 {
    flex: 0 0 auto;
    width: 66.66666667%;
  }
  .col-lg-9 {
    flex: 0 0 auto;
    width: 75%;
  }
  .col-lg-10 {
    flex: 0 0 auto;
    width: 83.33333333%;
  }
  .col-lg-11 {
    flex: 0 0 auto;
    width: 91.66666667%;
  }
  .col-lg-12 {
    flex: 0 0 auto;
    width: 100%;
  }
  .offset-lg-0 {
    margin-left: 0;
  }
  .offset-lg-1 {
    margin-left: 8.33333333%;
  }
  .offset-lg-2 {
    margin-left: 16.66666667%;
  }
  .offset-lg-3 {
    margin-left: 25%;
  }
  .offset-lg-4 {
    margin-left: 33.33333333%;
  }
  .offset-lg-5 {
    margin-left: 41.66666667%;
  }
  .offset-lg-6 {
    margin-left: 50%;
  }
  .offset-lg-7 {
    margin-left: 58.33333333%;
  }
  .offset-lg-8 {
    margin-left: 66.66666667%;
  }
  .offset-lg-9 {
    margin-left: 75%;
  }
  .offset-lg-10 {
    margin-left: 83.33333333%;
  }
  .offset-lg-11 {
    margin-left: 91.66666667%;
  }
  .g-lg-0,
  .gx-lg-0 {
    --bs-gutter-x: 0;
  }
  .g-lg-0,
  .gy-lg-0 {
    --bs-gutter-y: 0;
  }
  .g-lg-1,
  .gx-lg-1 {
    --bs-gutter-x: 0.25rem;
  }
  .g-lg-1,
  .gy-lg-1 {
    --bs-gutter-y: 0.25rem;
  }
  .g-lg-2,
  .gx-lg-2 {
    --bs-gutter-x: 0.5rem;
  }
  .g-lg-2,
  .gy-lg-2 {
    --bs-gutter-y: 0.5rem;
  }
  .g-lg-3,
  .gx-lg-3 {
    --bs-gutter-x: 1rem;
  }
  .g-lg-3,
  .gy-lg-3 {
    --bs-gutter-y: 1rem;
  }
  .g-lg-4,
  .gx-lg-4 {
    --bs-gutter-x: 1.5rem;
  }
  .g-lg-4,
  .gy-lg-4 {
    --bs-gutter-y: 1.5rem;
  }
  .g-lg-5,
  .gx-lg-5 {
    --bs-gutter-x: 3rem;
  }
  .g-lg-5,
  .gy-lg-5 {
    --bs-gutter-y: 3rem;
  }
}
@media (min-width: 1200px) {
  .col-xl {
    flex: 1 0 0%;
  }
  .row-cols-xl-auto > * {
    flex: 0 0 auto;
    width: auto;
  }
  .row-cols-xl-1 > * {
    flex: 0 0 auto;
    width: 100%;
  }
  .row-cols-xl-2 > * {
    flex: 0 0 auto;
    width: 50%;
  }
  .row-cols-xl-3 > * {
    flex: 0 0 auto;
    width: 33.33333333%;
  }
  .row-cols-xl-4 > * {
    flex: 0 0 auto;
    width: 25%;
  }
  .row-cols-xl-5 > * {
    flex: 0 0 auto;
    width: 20%;
  }
  .row-cols-xl-6 > * {
    flex: 0 0 auto;
    width: 16.66666667%;
  }
  .col-xl-auto {
    flex: 0 0 auto;
    width: auto;
  }
  .col-xl-1 {
    flex: 0 0 auto;
    width: 8.33333333%;
  }
  .col-xl-2 {
    flex: 0 0 auto;
    width: 16.66666667%;
  }
  .col-xl-3 {
    flex: 0 0 auto;
    width: 25%;
  }
  .col-xl-4 {
    flex: 0 0 auto;
    width: 33.33333333%;
  }
  .col-xl-5 {
    flex: 0 0 auto;
    width: 41.66666667%;
  }
  .col-xl-6 {
    flex: 0 0 auto;
    width: 50%;
  }
  .col-xl-7 {
    flex: 0 0 auto;
    width: 58.33333333%;
  }
  .col-xl-8 {
    flex: 0 0 auto;
    width: 66.66666667%;
  }
  .col-xl-9 {
    flex: 0 0 auto;
    width: 75%;
  }
  .col-xl-10 {
    flex: 0 0 auto;
    width: 83.33333333%;
  }
  .col-xl-11 {
    flex: 0 0 auto;
    width: 91.66666667%;
  }
  .col-xl-12 {
    flex: 0 0 auto;
    width: 100%;
  }
  .offset-xl-0 {
    margin-left: 0;
  }
  .offset-xl-1 {
    margin-left: 8.33333333%;
  }
  .offset-xl-2 {
    margin-left: 16.66666667%;
  }
  .offset-xl-3 {
    margin-left: 25%;
  }
  .offset-xl-4 {
    margin-left: 33.33333333%;
  }
  .offset-xl-5 {
    margin-left: 41.66666667%;
  }
  .offset-xl-6 {
    margin-left: 50%;
  }
  .offset-xl-7 {
    margin-left: 58.33333333%;
  }
  .offset-xl-8 {
    margin-left: 66.66666667%;
  }
  .offset-xl-9 {
    margin-left: 75%;
  }
  .offset-xl-10 {
    margin-left: 83.33333333%;
  }
  .offset-xl-11 {
    margin-left: 91.66666667%;
  }
  .g-xl-0,
  .gx-xl-0 {
    --bs-gutter-x: 0;
  }
  .g-xl-0,
  .gy-xl-0 {
    --bs-gutter-y: 0;
  }
  .g-xl-1,
  .gx-xl-1 {
    --bs-gutter-x: 0.25rem;
  }
  .g-xl-1,
  .gy-xl-1 {
    --bs-gutter-y: 0.25rem;
  }
  .g-xl-2,
  .gx-xl-2 {
    --bs-gutter-x: 0.5rem;
  }
  .g-xl-2,
  .gy-xl-2 {
    --bs-gutter-y: 0.5rem;
  }
  .g-xl-3,
  .gx-xl-3 {
    --bs-gutter-x: 1rem;
  }
  .g-xl-3,
  .gy-xl-3 {
    --bs-gutter-y: 1rem;
  }
  .g-xl-4,
  .gx-xl-4 {
    --bs-gutter-x: 1.5rem;
  }
  .g-xl-4,
  .gy-xl-4 {
    --bs-gutter-y: 1.5rem;
  }
  .g-xl-5,
  .gx-xl-5 {
    --bs-gutter-x: 3rem;
  }
  .g-xl-5,
  .gy-xl-5 {
    --bs-gutter-y: 3rem;
  }
}
@media (min-width: 1400px) {
  .col-xxl {
    flex: 1 0 0%;
  }
  .row-cols-xxl-auto > * {
    flex: 0 0 auto;
    width: auto;
  }
  .row-cols-xxl-1 > * {
    flex: 0 0 auto;
    width: 100%;
  }
  .row-cols-xxl-2 > * {
    flex: 0 0 auto;
    width: 50%;
  }
  .row-cols-xxl-3 > * {
    flex: 0 0 auto;
    width: 33.33333333%;
  }
  .row-cols-xxl-4 > * {
    flex: 0 0 auto;
    width: 25%;
  }
  .row-cols-xxl-5 > * {
    flex: 0 0 auto;
    width: 20%;
  }
  .row-cols-xxl-6 > * {
    flex: 0 0 auto;
    width: 16.66666667%;
  }
  .col-xxl-auto {
    flex: 0 0 auto;
    width: auto;
  }
  .col-xxl-1 {
    flex: 0 0 auto;
    width: 8.33333333%;
  }
  .col-xxl-2 {
    flex: 0 0 auto;
    width: 16.66666667%;
  }
  .col-xxl-3 {
    flex: 0 0 auto;
    width: 25%;
  }
  .col-xxl-4 {
    flex: 0 0 auto;
    width: 33.33333333%;
  }
  .col-xxl-5 {
    flex: 0 0 auto;
    width: 41.66666667%;
  }
  .col-xxl-6 {
    flex: 0 0 auto;
    width: 50%;
  }
  .col-xxl-7 {
    flex: 0 0 auto;
    width: 58.33333333%;
  }
  .col-xxl-8 {
    flex: 0 0 auto;
    width: 66.66666667%;
  }
  .col-xxl-9 {
    flex: 0 0 auto;
    width: 75%;
  }
  .col-xxl-10 {
    flex: 0 0 auto;
    width: 83.33333333%;
  }
  .col-xxl-11 {
    flex: 0 0 auto;
    width: 91.66666667%;
  }
  .col-xxl-12 {
    flex: 0 0 auto;
    width: 100%;
  }
  .offset-xxl-0 {
    margin-left: 0;
  }
  .offset-xxl-1 {
    margin-left: 8.33333333%;
  }
  .offset-xxl-2 {
    margin-left: 16.66666667%;
  }
  .offset-xxl-3 {
    margin-left: 25%;
  }
  .offset-xxl-4 {
    margin-left: 33.33333333%;
  }
  .offset-xxl-5 {
    margin-left: 41.66666667%;
  }
  .offset-xxl-6 {
    margin-left: 50%;
  }
  .offset-xxl-7 {
    margin-left: 58.33333333%;
  }
  .offset-xxl-8 {
    margin-left: 66.66666667%;
  }
  .offset-xxl-9 {
    margin-left: 75%;
  }
  .offset-xxl-10 {
    margin-left: 83.33333333%;
  }
  .offset-xxl-11 {
    margin-left: 91.66666667%;
  }
  .g-xxl-0,
  .gx-xxl-0 {
    --bs-gutter-x: 0;
  }
  .g-xxl-0,
  .gy-xxl-0 {
    --bs-gutter-y: 0;
  }
  .g-xxl-1,
  .gx-xxl-1 {
    --bs-gutter-x: 0.25rem;
  }
  .g-xxl-1,
  .gy-xxl-1 {
    --bs-gutter-y: 0.25rem;
  }
  .g-xxl-2,
  .gx-xxl-2 {
    --bs-gutter-x: 0.5rem;
  }
  .g-xxl-2,
  .gy-xxl-2 {
    --bs-gutter-y: 0.5rem;
  }
  .g-xxl-3,
  .gx-xxl-3 {
    --bs-gutter-x: 1rem;
  }
  .g-xxl-3,
  .gy-xxl-3 {
    --bs-gutter-y: 1rem;
  }
  .g-xxl-4,
  .gx-xxl-4 {
    --bs-gutter-x: 1.5rem;
  }
  .g-xxl-4,
  .gy-xxl-4 {
    --bs-gutter-y: 1.5rem;
  }
  .g-xxl-5,
  .gx-xxl-5 {
    --bs-gutter-x: 3rem;
  }
  .g-xxl-5,
  .gy-xxl-5 {
    --bs-gutter-y: 3rem;
  }
}
</style>


<style>
.copyright__text {
  text-align: center;
}
.container-fluid {
  padding-left: 30px;
  padding-right: 30px;
  max-width: 1270px;
}
footer {
  background-color: #061e43;
  padding: 50px 0 0 0;
  color: #fff;
}
footer .fw-title {
  color: #fff;
  margin-bottom: 20px;
}
footer .list-wrap {
  list-style-type: none;
  color: #fff;
  padding-left: 0;
}
footer p {
  color: #fff;
  margin: 0;
}
.copyright__wrapper {
  border-top: 1px solid #ffffff42;
  padding: 10px 0;
}
.socials {
  margin-top: 15px;
}
.socials i {
  display: inline-block;
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  background-color: #0d6efd;
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  margin-right: 10px;
}
.footer-widget.widget_nav_menu li a {
  margin-bottom: 10px;
  display: block;
  color: #b2bdcd;
}
</style>
