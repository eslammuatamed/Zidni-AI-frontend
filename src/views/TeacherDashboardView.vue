<!--
  TeacherDashboardView.vue presents the teacher-facing home dashboard with
  progress insights, quick navigation, and onboarding tasks. It now consumes
  shared Pinia stores to cache the teacher profile and dashboard metrics while
  surfacing inline loading, error, and contextual guidance states.
-->
<template>
  <ThemePage>
    <div class="teacher-dashboard flex flex-col gap-6">
      <div
        v-if="profileError || overviewError || activityError"
        class="teacher-dashboard__alerts flex flex-col gap-3"
        role="status"
      >
        <UiAlert
          v-if="profileError"
          class="teacher-dashboard__alert"
          color="danger"
          variant="soft"
        >
          <div class="teacher-dashboard__alert-content flex items-center justify-between gap-3 flex-wrap">
            <span>{{ t("teacher.profileLoadError") }}</span>
            <UiButton
              size="sm"
              variant="link"
              color="danger"
              @click="reloadProfile"
            >
              {{ t("teacher.retryAction") }}
            </UiButton>
          </div>
        </UiAlert>
        <UiAlert
          v-if="overviewError"
          class="teacher-dashboard__alert"
          color="warning"
          variant="soft"
        >
          <div class="teacher-dashboard__alert-content flex items-center justify-between gap-3 flex-wrap">
            <span>{{ t("teacher.metricsLoadError") }}</span>
            <UiButton
              size="sm"
              variant="link"
              color="warning"
              @click="void reloadMetrics()"
            >
              {{ t("teacher.retryAction") }}
            </UiButton>
          </div>
        </UiAlert>
        <UiAlert
          v-if="activityError"
          class="teacher-dashboard__alert"
          color="info"
          variant="soft"
        >
          <div class="teacher-dashboard__alert-content flex items-center justify-between gap-3 flex-wrap">
            <span>{{ t("teacher.activityLoadError") }}</span>
            <UiButton
              size="sm"
              variant="link"
              color="info"
              @click="reloadActivity"
            >
              {{ t("teacher.retryAction") }}
            </UiButton>
          </div>
        </UiAlert>
      </div>

      <div class="teacher-dashboard__toolbar flex items-center justify-end gap-3 flex-wrap">
        <UiButton
          size="sm"
          variant="ghost"
          color="neutral"
          prepend-icon="ReloadOutlined"
          :disabled="isRefreshing"
          @click="void refreshAll()"
        >
          {{ t("teacher.refreshDashboard") }}
        </UiButton>
        <span v-if="lastUpdatedLabel" class="teacher-dashboard__toolbar-meta text-[0.85rem] text-content-tertiary">
          {{ lastUpdatedLabel }}
        </span>
      </div>

      <div class="teacher-dashboard__metrics grid gap-3 grid-cols-6">
        <template v-if="showMetricsSkeleton">
          <UiCard
            v-for="index in 5"
            :key="`metrics-skeleton-${index}`"
            class="teacher-dashboard__metric-skeleton flex flex-col gap-3 p-4"
          >
            <UiSkeleton height="0.9rem" width="65%" />
            <UiSkeleton height="2.5rem" width="45%" />
            <UiSkeleton height="0.75rem" width="75%" />
          </UiCard>
        </template>
        <template v-else>
          <UiStatCard
            :label="t('teacher.profileCompleteness')"
            :value="`${profileCompleteness}%`"
            icon="DashboardOutlined"
            color="primary"
            :secondary-stat="t('teacher.profileCompletenessHint')"
          />
          <UiStatCard
            :label="t('teacher.activeStudents')"
            :value="formatNumber(safeOverview.activeStudents ?? 0)"
            icon="UserSwitchOutlined"
            color="info"
            :secondary-stat="t('teacher.activeStudentsHint')"
          />
          <UiStatCard
            :label="t('teacher.newEnrollments')"
            :value="formatNumber(safeOverview.totalEnrollments ?? 0)"
            icon="TeamOutlined"
            color="success"
            :secondary-stat="t('teacher.newEnrollmentsHint')"
          />
          <UiStatCard
            :label="t('teacher.completionRate')"
            :value="formatPercent(safeOverview.completionRate ?? 0)"
            icon="PieChartOutlined"
            color="warning"
            :secondary-stat="t('teacher.completionRateHint')"
          />
          <UiStatCard
            :label="t('teacher.paymentMethodsConfigured')"
            :value="formatNumber(paymentMethodsCount)"
            icon="CreditCardOutlined"
            :color="paymentMethodsTone"
            :secondary-stat="t('teacher.paymentMethodsConfiguredHint')"
          />
          <UiStatCard
            :label="t('teacher.totalViews')"
            :value="formatNumber(viewsSummarySafe.totalViews)"
            icon="EyeOutlined"
            color="primary"
          />
          <UiAlert
            v-if="showPaymentMethodsWarning"
            class="teacher-dashboard__payments-warning col-span-full"
            color="warning"
            variant="soft"
          >
            {{ t("teacher.paymentMethodsConfiguredWarning") }}
          </UiAlert>
        </template>
      </div>

      <UiCard class="teacher-dashboard__welcome" hover>
        <template #title>{{ t("teacher.dashboard") }}</template>
        <template #subtitle>
          <span class="teacher-dashboard__welcome-subtitle text-content-tertiary">
            {{
              t("teacher.welcome", {
                name: profile?.name || t("teacher.dashboard"),
              })
            }}
          </span>
        </template>
        <div v-if="isProfilePending" class="teacher-dashboard__bio-skeleton flex flex-col gap-2">
          <UiSkeleton height="1rem" width="80%" />
          <UiSkeleton height="1rem" width="60%" />
        </div>
        <p v-else class="teacher-dashboard__bio m-0 text-content-secondary leading-[var(--sakai-line-height-lg)]">
          {{ profile?.bio || t("teacher.bioPlaceholder") }}
        </p>
        <div class="teacher-dashboard__quick-links flex flex-wrap gap-3">
          <UiButton
            v-for="link in quickLinks"
            :key="link.id"
            :color="link.color"
            :prepend-icon="link.icon"
            @click="link.action()"
          >
            {{ link.label }}
          </UiButton>
        </div>
      </UiCard>

      <div dir="rtl" class="teacher-dashboard__content grid gap-5 [grid-template-columns:minmax(0,1fr)_minmax(0,2fr)]">
        <UiCard
          class="teacher-dashboard__insights [grid-column:1] [grid-row:1]"
          :title="t('teacher.insightsTitle')"
          :subtitle="t('teacher.insightsSubtitle')"
          hover
        >
          <div class="teacher-dashboard__insights-grid flex flex-wrap gap-5 items-center justify-between">
            <div class="teacher-dashboard__progress flex items-center gap-4">
              <UiProgressCircle
                :value="profileCompleteness"
                :size="112"
                color="primary"
              >
                {{ profileCompleteness }}%
              </UiProgressCircle>
              <div class="teacher-dashboard__progress-meta flex flex-col gap-2">
                <span class="teacher-dashboard__progress-label text-[0.85rem] text-content-tertiary uppercase tracking-[0.08em]">{{
                  t("teacher.profileCompleteness")
                }}</span>
                <span class="teacher-dashboard__progress-value text-[1.75rem] font-semibold"
                  >{{ profileCompleteness }}%</span
                >
              </div>
            </div>
            <div
              v-if="showMetricsSkeleton"
              class="teacher-dashboard__sparkline-skeleton flex-[1_1_200px]"
            >
              <UiSkeleton height="72px" />
            </div>
            <div
              v-else-if="sparklinePointString"
              class="teacher-dashboard__sparkline flex-[1_1_200px] text-primary"
              aria-hidden="true"
            >
              <svg viewBox="0 0 100 36" preserveAspectRatio="none">
                <polygon
                  v-if="sparklineAreaPoints"
                  class="teacher-dashboard__sparkline-area"
                  :points="sparklineAreaPoints"
                />
                <polyline
                  class="teacher-dashboard__sparkline-line"
                  :points="sparklinePointString"
                />
                <g class="teacher-dashboard__sparkline-points">
                  <circle
                    v-for="(point, index) in sparklineCoordinates"
                    :key="index"
                    :cx="point.x"
                    :cy="point.y"
                    r="2.5"
                  />
                </g>
              </svg>
            </div>
          </div>
          <UiAlert color="info" variant="soft">
            {{ t("teacher.insightsHint") }}
          </UiAlert>
        </UiCard>

        <UiCard
          class="teacher-dashboard__next [grid-column:1] [grid-row:2]"
          :title="t('teacher.nextStepsTitle')"
          :subtitle="t('teacher.nextStepsSubtitle')"
          hover
        >
          <ul class="teacher-dashboard__steps list-none m-0 p-0 flex flex-col gap-4">
            <li
              v-for="step in nextSteps"
              :key="step.id"
              class="teacher-dashboard__step flex flex-wrap justify-between items-center gap-3"
            >
              <div class="teacher-dashboard__step-info flex items-center gap-3">
                <UiAvatar :icon="step.icon" size="sm" />
                <div class="teacher-dashboard__step-copy">
                  <span class="teacher-dashboard__step-title font-semibold text-content">{{
                    step.title
                  }}</span>
                  <span
                    v-if="step.description"
                    class="teacher-dashboard__step-description block text-content-tertiary text-[0.85rem]"
                    >{{ step.description }}</span
                  >
                </div>
              </div>
              <UiButton
                v-if="step.action"
                variant="link"
                color="primary"
                @click="step.action()"
              >
                {{ t("teacher.goToAction") }}
              </UiButton>
            </li>
          </ul>
        </UiCard>

        <UiCard
          class="teacher-dashboard__plan-usage [grid-column:2] [grid-row:1] flex flex-col gap-4"
          :title="planUsageTitle"
          :subtitle="planUsageSubtitle"
          hover
        >
          <UiAlert v-if="usageError" color="warning" variant="soft">
            {{ planUsageErrorMessage }}
          </UiAlert>
          <div
            v-else-if="usageLoading"
            class="teacher-dashboard__plan-usage-skeleton grid gap-3"
          >
            <UiSkeleton height="1rem" width="50%" />
            <UiSkeleton height="2.5rem" />
            <UiSkeleton height="2.5rem" />
          </div>
          <div
            v-else-if="usageSummary"
            class="teacher-dashboard__plan-usage-grid flex flex-col gap-4"
          >
            <div class="teacher-dashboard__plan-usage-header flex items-center justify-between gap-3 flex-wrap">
              <div>
                <span class="teacher-dashboard__plan-usage-plan font-semibold text-content">
                  {{
                    usageSummary.planName ||
                    usageSummary.planCode ||
                    planUsagePlanFallback
                  }}
                </span>
                <span class="teacher-dashboard__plan-usage-resolution ml-2 text-content-secondary text-[0.9rem]">
                  {{ planUsageMaxResolutionLabel }}
                  {{
                    usageSummary.maxResolutionHeight
                      ? `${usageSummary.maxResolutionHeight}p`
                      : planUsageUnlimitedLabel
                  }}
                </span>
                <span class="teacher-dashboard__plan-usage-resolution ml-2 text-content-secondary text-[0.9rem]">
                  {{ planUsageMaxDurationLabel }}
                  {{
                    usageSummary.maxVideoDurationMinutes
                      ? `${formatNumber(usageSummary.maxVideoDurationMinutes)} ${planUsageMinuteShort}`
                      : planUsageDefaultLabel
                  }}
                </span>
                <span
                  v-if="usageSummary.resolutionPolicy"
                  class="teacher-dashboard__plan-usage-resolution ml-2 text-content-secondary text-[0.9rem]"
                >
                  {{ planUsageResolutionPolicyLabel }}
                  {{ formatResolutionPolicy(usageSummary.resolutionPolicy) }}
                </span>
              </div>
            </div>
            <UiAlert v-if="storageWarning" color="warning" variant="soft">
              {{ storageWarning }}
            </UiAlert>
            <UiAlert v-if="storageSizeWarning" color="warning" variant="soft">
              {{ storageSizeWarning }}
            </UiAlert>
            <UiAlert v-if="streamingWarning" color="warning" variant="soft">
              {{ streamingWarning }}
            </UiAlert>

            <div class="teacher-dashboard__plan-usage-item flex flex-col gap-2">
              <div class="teacher-dashboard__plan-usage-label font-medium text-content">
                {{ planUsageStorageLabel }}
              </div>
              <UiProgressBar :value="storageUsagePercent" color="primary">
                <div class="teacher-dashboard__plan-usage-meta flex gap-2 justify-between text-[0.85rem] text-content-secondary">
                  <span>{{
                    formatDurationSeconds(usageSummary.storageSecondsUsed)
                  }}</span>
                  <span>
                    /
                    {{
                      usageSummary.storageSecondsLimit !== null
                        ? formatDurationSeconds(
                            usageSummary.storageSecondsLimit,
                          )
                        : planUsageUnlimitedLabel
                    }}
                  </span>
                </div>
              </UiProgressBar>
              <div
                v-if="storageRemainingLabel"
                class="teacher-dashboard__plan-usage-remaining text-[0.8rem] text-content-tertiary"
              >
                {{ storageRemainingLabel }}
              </div>
            </div>

            <div class="teacher-dashboard__plan-usage-item flex flex-col gap-2">
              <div class="teacher-dashboard__plan-usage-label font-medium text-content">
                {{ planUsageStorageSizeLabel }}
              </div>
              <UiProgressBar :value="storageSizeUsagePercent" color="secondary">
                <div class="teacher-dashboard__plan-usage-meta flex gap-2 justify-between text-[0.85rem] text-content-secondary">
                  <span>{{ formatBytes(usageSummary.storageBytesUsed) }}</span>
                  <span>
                    /
                    {{
                      usageSummary.storageBytesLimit !== null
                        ? formatBytes(usageSummary.storageBytesLimit)
                        : planUsageUnlimitedLabel
                    }}
                  </span>
                </div>
              </UiProgressBar>
              <div
                v-if="storageSizeRemainingLabel"
                class="teacher-dashboard__plan-usage-remaining text-[0.8rem] text-content-tertiary"
              >
                {{ storageSizeRemainingLabel }}
              </div>
            </div>

            <div class="teacher-dashboard__plan-usage-item flex flex-col gap-2">
              <div class="teacher-dashboard__plan-usage-label font-medium text-content">
                {{ planUsageStreamingLabel }}
              </div>
              <UiProgressBar :value="streamingUsagePercent" color="info">
                <div class="teacher-dashboard__plan-usage-meta flex gap-2 justify-between text-[0.85rem] text-content-secondary">
                  <span>{{
                    formatMinutes(usageSummary.streamingMinutesUsed)
                  }}</span>
                  <span>
                    /
                    {{
                      usageSummary.streamingMinutesLimit !== null
                        ? formatMinutes(usageSummary.streamingMinutesLimit)
                        : planUsageUnlimitedLabel
                    }}
                  </span>
                </div>
              </UiProgressBar>
              <div
                v-if="streamingRemainingLabel"
                class="teacher-dashboard__plan-usage-remaining text-[0.8rem] text-content-tertiary"
              >
                {{ streamingRemainingLabel }}
              </div>
            </div>

            <div class="teacher-dashboard__plan-trends flex flex-col gap-3 mt-2">
              <div class="teacher-dashboard__plan-trends-header">
                {{ planUsageTrendsTitle }}
              </div>
              <UiAlert v-if="trendsError" color="warning" variant="soft">
                {{ planUsageTrendsErrorMessage }}
              </UiAlert>
              <div
                v-else-if="trendsLoading"
                class="teacher-dashboard__plan-trends-skeleton grid gap-3"
              >
                <UiSkeleton height="96px" />
                <UiSkeleton height="96px" />
              </div>
              <div
                v-else-if="trendPoints.length"
                class="teacher-dashboard__plan-trends-grid grid gap-4"
              >
                <div class="teacher-dashboard__plan-trend flex flex-col gap-2">
                  <span class="teacher-dashboard__plan-trend-label">{{
                    planUsageStorageTrendLabel
                  }}</span>
                  <UiChart
                    :values="storageTrendValues"
                    :labels="trendLabels"
                    stroke="var(--sakai-primary)"
                  />
                </div>
                <div class="teacher-dashboard__plan-trend flex flex-col gap-2">
                  <span class="teacher-dashboard__plan-trend-label">{{
                    planUsageStreamingTrendLabel
                  }}</span>
                  <UiChart
                    :values="streamingTrendValues"
                    :labels="trendLabels"
                    stroke="var(--sakai-info)"
                  />
                </div>
              </div>
              <p v-else class="teacher-dashboard__plan-trends-empty m-0 text-[0.85rem] text-content-tertiary">
                {{ planUsageTrendsEmptyMessage }}
              </p>
            </div>
          </div>
        </UiCard>

        <UiCard
          class="teacher-dashboard__views [grid-column:2] [grid-row:2] flex flex-col gap-4"
          :title="viewsCardTitle"
          :subtitle="viewsCardSubtitle"
          hover
        >
          <div
            v-if="showViewsSkeleton"
            class="teacher-dashboard__views-skeleton flex flex-col gap-3"
          >
            <UiSkeleton height="1rem" width="45%" />
            <UiSkeleton height="2.25rem" width="35%" />
            <UiSkeleton height="1rem" width="60%" />
          </div>
          <UiAlert v-else-if="viewsError" color="warning" variant="soft">
            <div class="teacher-dashboard__views-alert flex items-center justify-between gap-3 flex-wrap">
              <span>{{ viewsErrorMessage }}</span>
              <UiButton
                v-if="showViewsRetry"
                size="sm"
                variant="link"
                color="warning"
                @click="void teacherViewsStore.loadSummary()"
              >
                {{ viewsRetryLabel }}
              </UiButton>
            </div>
          </UiAlert>
          <div v-else class="teacher-dashboard__views-content flex flex-col gap-4">
            <div class="teacher-dashboard__views-stats">
              <div class="teacher-dashboard__views-stat">
                <span class="teacher-dashboard__views-value">{{
                  formatNumber(viewsSummarySafe.totalViews)
                }}</span>
                <span class="teacher-dashboard__views-label">{{
                  viewsTotalLabel
                }}</span>
              </div>
              <div class="teacher-dashboard__views-stat">
                <span class="teacher-dashboard__views-value">{{
                  formatNumber(viewsSummarySafe.landingViews)
                }}</span>
                <span class="teacher-dashboard__views-label">{{
                  viewsLandingLabel
                }}</span>
              </div>
              <div class="teacher-dashboard__views-stat">
                <span class="teacher-dashboard__views-value">{{
                  formatNumber(viewsSummarySafe.profileViews)
                }}</span>
                <span class="teacher-dashboard__views-label">{{
                  viewsProfileLabel
                }}</span>
              </div>
              <div class="teacher-dashboard__views-stat">
                <span class="teacher-dashboard__views-value">{{
                  formatNumber(viewsSummarySafe.courseViews)
                }}</span>
                <span class="teacher-dashboard__views-label">{{
                  viewsCourseLabel
                }}</span>
              </div>
            </div>
            <div class="teacher-dashboard__views-courses flex flex-col gap-2">
              <span class="teacher-dashboard__views-title">{{
                viewsTopCoursesTitle
              }}</span>
              <ul
                v-if="viewsSummarySafe.topCourses.length"
                class="teacher-dashboard__views-list list-none p-0 m-0 flex flex-col gap-2"
              >
                <li
                  v-for="course in viewsSummarySafe.topCourses"
                  :key="course.courseId"
                >
                  <span class="teacher-dashboard__views-course">{{
                    course.title
                  }}</span>
                  <span class="teacher-dashboard__views-count">{{
                    formatNumber(course.views)
                  }}</span>
                </li>
              </ul>
              <p v-else class="teacher-dashboard__views-empty m-0 text-content-tertiary">
                {{ viewsEmptyLabel }}
              </p>
            </div>
          </div>
        </UiCard>

        <UiCard
          v-if="teacherAssistantsEnabled"
          class="teacher-dashboard__assistants-card [grid-column:1] [grid-row:3] flex flex-col gap-5"
          :title="t('teacher.assistantsDashboard.title')"
          :subtitle="t('teacher.assistantsDashboard.subtitle')"
          hover
        >
          <div class="teacher-dashboard__assistants-content flex flex-col gap-4">
            <div
              v-if="assistantsSummaryLoading"
              class="teacher-dashboard__assistants-skeleton grid gap-3"
            >
              <UiSkeleton height="1rem" width="60%" />
              <UiSkeleton height="2.25rem" width="35%" />
              <UiSkeleton height="1rem" width="50%" />
            </div>
            <UiAlert
              v-else-if="assistantsSummaryError"
              color="warning"
              variant="soft"
            >
              {{ t("teacher.assistantsDashboard.loadError") }}
            </UiAlert>
            <div v-else>
              <div class="teacher-dashboard__assistants-grid">
                <div class="teacher-dashboard__assistants-stat flex flex-col gap-1">
                  <span class="teacher-dashboard__assistants-value">{{
                    formatNumber(assistantCount)
                  }}</span>
                  <span class="teacher-dashboard__assistants-label">{{
                    t("teacher.assistantsDashboard.teamLabel")
                  }}</span>
                  <span class="teacher-dashboard__assistants-summary">
                    {{
                      t("teacher.assistantsDashboard.teamSummary", {
                        count: assistantCount,
                      })
                    }}
                  </span>
                </div>
                <div class="teacher-dashboard__assistants-stat flex flex-col gap-1">
                  <span class="teacher-dashboard__assistants-value">{{
                    formatNumber(assistantRoleCount)
                  }}</span>
                  <span class="teacher-dashboard__assistants-label">{{
                    t("teacher.assistantsDashboard.rolesLabel")
                  }}</span>
                  <span class="teacher-dashboard__assistants-summary">
                    {{
                      t("teacher.assistantsDashboard.rolesSummary", {
                        count: assistantRoleCount,
                      })
                    }}
                  </span>
                </div>
              </div>
              <p
                v-if="assistantCount === 0"
                class="teacher-dashboard__assistants-empty m-0 text-[0.9rem] text-content-tertiary"
              >
                {{ t("teacher.assistantsDashboard.empty") }}
              </p>
            </div>
          </div>
          <div class="teacher-dashboard__assistants-actions flex flex-wrap gap-3">
            <UiButton
              size="sm"
              color="primary"
              prepend-icon="UserSwitchOutlined"
              @click="goToAssistantTeam"
            >
              {{ t("teacher.assistantsDashboard.manageTeam") }}
            </UiButton>
            <UiButton
              size="sm"
              variant="ghost"
              color="neutral"
              prepend-icon="IdcardOutlined"
              @click="goToAssistantRoles"
            >
              {{ t("teacher.assistantsDashboard.manageRoles") }}
            </UiButton>
            <UiButton
              size="sm"
              variant="link"
              color="primary"
              :disabled="assistantsRefreshing || assistantsSummaryLoading"
              @click="refreshAssistantsSummary"
            >
              {{
                assistantsRefreshing
                  ? t("teacher.assistantsDashboard.refreshing")
                  : t("teacher.assistantsDashboard.refresh")
              }}
            </UiButton>
          </div>
        </UiCard>
        <UiCard
          class="teacher-dashboard__activity [grid-column:2] [grid-row:3] flex flex-col gap-5"
          :title="t('teacher.activityTitle')"
          :subtitle="t('teacher.activitySubtitle')"
          hover
        >
          <div
            v-if="showActivitySkeleton"
            class="teacher-dashboard__activity-skeleton flex flex-col gap-3"
          >
            <div
              v-for="index in 3"
              :key="`activity-skeleton-${index}`"
              class="teacher-dashboard__activity-skeleton-row flex flex-col gap-2"
            >
              <UiSkeleton height="0.9rem" width="55%" />
              <UiSkeleton height="0.8rem" width="40%" />
            </div>
          </div>
          <template v-else>
            <div class="teacher-dashboard__activity-section flex flex-col gap-3">
              <div class="teacher-dashboard__activity-header flex items-center justify-between gap-3 flex-wrap">
                <h3>{{ t("teacher.upcomingSessions") }}</h3>
                <UiButton
                  size="sm"
                  variant="link"
                  color="info"
                  @click="goToLiveSessions"
                >
                  {{ t("teacher.activityViewAllSessions") }}
                </UiButton>
              </div>
              <ul class="teacher-dashboard__activity-list list-none m-0 p-0 flex flex-col gap-3">
                <li
                  v-for="session in upcomingSessions"
                  :key="session.id"
                  class="teacher-dashboard__activity-item"
                >
                  <div>
                    <span class="teacher-dashboard__activity-title block font-medium text-content">{{
                      session.title
                    }}</span>
                    <span class="teacher-dashboard__activity-meta block text-[0.85rem] text-content-tertiary">{{
                      formatDateTime(session.scheduledAt)
                    }}</span>
                  </div>
                  <UiBadge variant="soft" color="primary">{{
                    session.courseTitle
                  }}</UiBadge>
                </li>
                <li
                  v-if="!upcomingSessions.length"
                  class="teacher-dashboard__activity-empty"
                >
                  {{ t("teacher.noSessions") }}
                </li>
              </ul>
            </div>
            <div class="teacher-dashboard__activity-section flex flex-col gap-3">
              <div class="teacher-dashboard__activity-header flex items-center justify-between gap-3 flex-wrap">
                <h3>{{ t("teacher.upcomingAssignments") }}</h3>
                <UiButton
                  size="sm"
                  variant="link"
                  color="primary"
                  @click="goToLearning"
                >
                  {{ t("teacher.activityReviewAssignments") }}
                </UiButton>
              </div>
              <ul class="teacher-dashboard__activity-list list-none m-0 p-0 flex flex-col gap-3">
                <li
                  v-for="assignment in upcomingAssignments"
                  :key="assignment.id"
                  class="teacher-dashboard__activity-item"
                >
                  <div>
                    <span class="teacher-dashboard__activity-title block font-medium text-content">{{
                      assignment.title
                    }}</span>
                    <span class="teacher-dashboard__activity-meta block text-[0.85rem] text-content-tertiary">{{
                      formatDateTime(assignment.dueAt)
                    }}</span>
                  </div>
                  <UiBadge variant="outline" color="warning">{{
                    assignment.courseTitle
                  }}</UiBadge>
                </li>
                <li
                  v-if="!upcomingAssignments.length"
                  class="teacher-dashboard__activity-empty"
                >
                  {{ t("teacher.noAssignments") }}
                </li>
              </ul>
            </div>
          </template>
        </UiCard>
      </div>

      <UiCard
        class="teacher-dashboard__account"
        :title="t('teacher.accountCardTitle')"
        hover
      >
        <div class="teacher-dashboard__account-list flex flex-col gap-3 mb-4">
          <div class="teacher-dashboard__account-row flex justify-between items-center gap-3 border-b pb-3">
            <span class="teacher-dashboard__account-label">{{
              t("teacher.accountStatus")
            }}</span>
            <UiBadge
              :color="isAccountActive ? 'success' : 'warning'"
              :variant="isAccountActive ? 'soft' : 'outline'"
            >
              {{
                isAccountActive
                  ? t("teacher.accountStatusActive")
                  : t("teacher.accountStatusPending")
              }}
            </UiBadge>
          </div>
          <div class="teacher-dashboard__account-row flex justify-between items-center gap-3 border-b pb-3">
            <span class="teacher-dashboard__account-label">{{
              t("teacher.subjectFocus")
            }}</span>
            <span
              class="teacher-dashboard__account-value font-semibold"
              :class="{
                'teacher-dashboard__account-value--muted': !profile?.subject,
              }"
            >
              {{ profile?.subject || t("teacher.subjectUnset") }}
            </span>
          </div>
          <div class="teacher-dashboard__account-row flex justify-between items-center gap-3 border-b pb-3">
            <span class="teacher-dashboard__account-label">{{
              t("teacher.profileCompleteness")
            }}</span>
            <span class="teacher-dashboard__account-value font-semibold"
              >{{ profileCompleteness }}%</span
            >
          </div>
        </div>
        <UiButton color="danger" prepend-icon="LogoutOutlined" @click="logout">
          {{ t("nav.logout") }}
        </UiButton>
      </UiCard>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import {
  useTeacherProfileStore,
  type TeacherProfileMissingField,
} from "@/stores/teacherProfile";
import { useTeacherDashboardStore } from "@/stores/teacherDashboard";
import { useTeacherActivityStore } from "@/stores/teacherActivity";
import { useFeaturesStore } from "@/stores/features";
import { useTeacherAssistantsStore } from "@/stores/teacherAssistants";
import { useSubscriptionStore } from "@/stores/subscription";
import { useTeacherUsageStore } from "@/stores/teacherUsage";
import { useTeacherViewsStore } from "@/stores/teacherViews";
import { useVisibilityRefresh } from "@/composables/useVisibilityRefresh";
import { FEATURE } from "@/constants/featureCatalog";
import UiCard from "@/components/ui/UiCard.vue";
import UiStatCard from "@/components/ui/UiStatCard.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiBadge from "@/components/ui/UiBadge.vue";
import UiAlert from "@/components/ui/UiAlert.vue";
import UiProgressCircle from "@/components/ui/UiProgressCircle.vue";
import UiProgressBar from "@/components/ui/UiProgressBar.vue";
import UiAvatar from "@/components/ui/UiAvatar.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";
import UiChart from "@/components/ui/UiChart.vue";

interface QuickLink {
  id: string;
  label: string;
  icon: string;
  color: "primary" | "secondary" | "success" | "info" | "warning" | "danger";
  action: () => void;
}

interface NextStep {
  id: string;
  title: string;
  description?: string;
  icon: string;
  action?: () => void;
}

interface SparklinePoint {
  x: number;
  y: number;
}

const SPARKLINE_WIDTH = 100;
const SPARKLINE_HEIGHT = 36;

const { t, te, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const profileStore = useTeacherProfileStore();
const dashboardStore = useTeacherDashboardStore();
const activityStore = useTeacherActivityStore();
const featuresStore = useFeaturesStore();
const assistantsStore = useTeacherAssistantsStore();
const subscriptionStore = useSubscriptionStore();
const usageStore = useTeacherUsageStore();
const teacherViewsStore = useTeacherViewsStore();

const teacherAssistantsEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.teacherAssistants),
);
const planUsageTitle = computed(() =>
  translateTeacher("teacher.planUsageTitle", "Plan usage"),
);
const planUsageSubtitle = computed(() =>
  translateTeacher(
    "teacher.planUsageSubtitle",
    "Monitor storage and streaming limits for your plan.",
  ),
);
const planUsageErrorMessage = computed(() =>
  translateTeacher(
    "teacher.planUsageError",
    "We couldn't load your current usage. Please refresh to try again.",
  ),
);
const planUsagePlanFallback = computed(() =>
  translateTeacher("teacher.planUsagePlanFallback", "Plan"),
);
const planUsageMaxResolutionLabel = computed(() =>
  translateTeacher("teacher.planUsageMaxResolution", "Max resolution:"),
);
const planUsageMaxDurationLabel = computed(() =>
  translateTeacher("teacher.planUsageMaxDuration", "Max duration:"),
);
const planUsageResolutionPolicyLabel = computed(() =>
  translateTeacher("teacher.planUsageResolutionPolicy", "Resolution policy:"),
);
const planUsageUnlimitedLabel = computed(() =>
  translateTeacher("teacher.planUsageUnlimited", "Unlimited"),
);
const planUsageDefaultLabel = computed(() =>
  translateTeacher("teacher.planUsageDefault", "Default"),
);
const planUsageStorageLabel = computed(() =>
  translateTeacher("teacher.planUsageVideoStorage", "Video storage"),
);
const planUsageStorageSizeLabel = computed(() =>
  translateTeacher("teacher.planUsageVideoStorageSize", "Video storage size"),
);
const planUsageStreamingLabel = computed(() =>
  translateTeacher("teacher.planUsageStreamingMinutes", "Streaming minutes"),
);
const planUsageTrendsTitle = computed(() =>
  translateTeacherWithParams(
    "teacher.planUsageTrendsTitle",
    "Usage trends (last {months} months)",
    { months: 6 },
  ),
);
const planUsageTrendsErrorMessage = computed(() =>
  translateTeacher(
    "teacher.planUsageTrendsError",
    "We couldn't load usage trends yet.",
  ),
);
const planUsageTrendsEmptyMessage = computed(() =>
  translateTeacher("teacher.planUsageTrendsEmpty", "No trend data yet."),
);
const planUsageStorageTrendLabel = computed(() =>
  translateTeacher("teacher.planUsageStorageTrendLabel", "Storage (hours)"),
);
const planUsageStreamingTrendLabel = computed(() =>
  translateTeacher(
    "teacher.planUsageStreamingTrendLabel",
    "Streaming (minutes)",
  ),
);
const planUsageMinuteShort = computed(() =>
  translateTeacher("teacher.planUsageMinuteShort", "min"),
);
const planUsageHourShort = computed(() =>
  translateTeacher("teacher.planUsageHourShort", "h"),
);
const viewsCardTitle = computed(() =>
  translateTeacher("teacher.viewsCardTitle", "Profile & course views"),
);
const viewsCardSubtitle = computed(() =>
  translateTeacher(
    "teacher.viewsCardSubtitle",
    "Realtime view activity from the last 30 days.",
  ),
);
const viewsTotalLabel = computed(() =>
  translateTeacher("teacher.viewsTotalLabel", "Total views"),
);
const viewsLandingLabel = computed(() =>
  translateTeacher("teacher.viewsLandingLabel", "Landing"),
);
const viewsProfileLabel = computed(() =>
  translateTeacher("teacher.viewsProfileLabel", "Profile"),
);
const viewsCourseLabel = computed(() =>
  translateTeacher("teacher.viewsCourseLabel", "Course pages"),
);
const viewsTopCoursesTitle = computed(() =>
  translateTeacher("teacher.viewsTopCoursesTitle", "Top courses"),
);
const viewsEmptyLabel = computed(() =>
  translateTeacher("teacher.viewsEmpty", "No views yet."),
);
const viewsUnauthorizedLabel = computed(() =>
  translateTeacher(
    "teacher.viewsUnauthorized",
    "Sign in again to see your view analytics.",
  ),
);
const viewsLoadErrorLabel = computed(() =>
  translateTeacher(
    "teacher.viewsLoadError",
    "We couldn't load view analytics. Try again.",
  ),
);
const viewsRetryLabel = computed(() =>
  translateTeacher("teacher.viewsRetry", "Retry"),
);

const {
  profile,
  loading: profileLoading,
  error: profileError,
  profileCompleteness,
  missingFields,
  loadedAt: profileLoadedAt,
} = storeToRefs(profileStore);
const {
  overview,
  loading: overviewLoading,
  error: overviewError,
  loadedAt: overviewLoadedAt,
} = storeToRefs(dashboardStore);
const {
  upcomingSessions,
  upcomingAssignments,
  loading: activityLoading,
  error: activityError,
  loadedAt: activityLoadedAt,
} = storeToRefs(activityStore);
const {
  roles: assistantRoles,
  rolesLoading: assistantRolesLoading,
  rolesError: assistantRolesError,
  rolesLoadedAt: assistantRolesLoadedAt,
  assistants: assistantAccounts,
  assistantsLoading: assistantAccountsLoading,
  assistantsError: assistantAccountsError,
  assistantsLoadedAt: assistantAccountsLoadedAt,
} = storeToRefs(assistantsStore);
const { summary: subscriptionSummary } = storeToRefs(subscriptionStore);
const {
  summary: usageSummary,
  loading: usageLoading,
  error: usageError,
  trends: trendPoints,
  trendsLoading,
  trendsError,
} = storeToRefs(usageStore);
const {
  summary: viewsSummary,
  loading: viewsLoading,
  error: viewsError,
} = storeToRefs(teacherViewsStore);

const lastSubscriptionSignature = ref<string | null>(null);
const subscriptionRefreshInFlight = ref(false);

const pageSubtitle = computed(() => t("teacher.profileCompletenessHint"));

const STALE_RELOAD_LEEWAY = 10 * 1000;

const refreshIfStale = async () => {
  if (profileStore.isCacheStale(STALE_RELOAD_LEEWAY)) {
    void profileStore.load(true);
  }
  if (dashboardStore.isCacheStale(STALE_RELOAD_LEEWAY)) {
    try {
      await featuresStore.ensureLoaded();
    } catch (error) {
      console.warn(
        "[TeacherDashboardView] failed to ensure feature snapshot while refreshing",
        error,
      );
    }
    void dashboardStore.loadOverview(true);
  }
  if (activityStore.isCacheStale(STALE_RELOAD_LEEWAY)) {
    void activityStore.load(true);
  }
  void subscriptionStore.loadSubscription(true);
  void usageStore.loadSummary();
  void usageStore.loadTrends();
  void teacherViewsStore.loadSummary();
  if (!dashboardStore.isCacheStale(STALE_RELOAD_LEEWAY)) {
    void featuresStore.ensureLoaded().catch((error) => {
      console.warn(
        "[TeacherDashboardView] failed to ensure feature snapshot while refreshing",
        error,
      );
    });
  }
  if (teacherAssistantsEnabled.value) {
    if (!assistantsStore.isRolesCacheFresh()) {
      void assistantsStore.loadRoles(true);
    }
    if (!assistantsStore.isAssistantsCacheFresh()) {
      void assistantsStore.loadAssistants(true);
    }
  }
};

const buildSubscriptionSignature = (summary: unknown) => {
  const current = (
    summary as {
      currentSubscription?: {
        id?: number | string;
        status?: string;
        endsAt?: string | null;
      } | null;
    }
  )?.currentSubscription;
  if (!current) {
    return "none";
  }
  const id = current.id ?? "none";
  const status = current.status ?? "unknown";
  const endsAt = current.endsAt ?? "none";
  return `${id}:${status}:${endsAt}`;
};

const refreshAfterSubscriptionChange = async (reason: string) => {
  if (subscriptionRefreshInFlight.value) {
    return;
  }
  subscriptionRefreshInFlight.value = true;
  try {
    console.info(
      "[TeacherDashboardView] refreshing dashboard after subscription change (%s)",
      reason,
    );
    const featureRefresh = featuresStore.refresh().catch((error) => {
      console.error(
        "[TeacherDashboardView] failed to refresh feature snapshot after subscription update",
        error,
      );
    });
    const tasks: Promise<unknown>[] = [
      profileStore.load(true),
      activityStore.load(true),
      featureRefresh.then(() => dashboardStore.loadOverview(true)),
      usageStore.loadSummary(true),
      usageStore.loadTrends(true),
    ];
    if (teacherAssistantsEnabled.value) {
      tasks.push(assistantsStore.refreshAll());
    }
    await Promise.allSettled(tasks);
  } finally {
    subscriptionRefreshInFlight.value = false;
  }
};

watch(
  teacherAssistantsEnabled,
  (enabled) => {
    if (!enabled) {
      return;
    }
    void assistantsStore.loadRoles();
    void assistantsStore.loadAssistants();
  },
  { immediate: true },
);

watch(
  subscriptionSummary,
  (summary) => {
    const signature = buildSubscriptionSignature(summary);
    if (lastSubscriptionSignature.value === null) {
      lastSubscriptionSignature.value = signature;
      return;
    }
    if (signature === lastSubscriptionSignature.value) {
      return;
    }
    lastSubscriptionSignature.value = signature;
    void refreshAfterSubscriptionChange("summary-updated");
  },
  { deep: true },
);

onMounted(async () => {
  try {
    await featuresStore.ensureLoaded();
  } catch (error) {
    console.warn(
      "[TeacherDashboardView] failed to ensure feature snapshot on mount",
      error,
    );
  }
  void profileStore.load();
  void dashboardStore.loadOverview();
  void activityStore.load();
  void subscriptionStore.loadSubscription();
  void usageStore.loadSummary();
  void usageStore.loadTrends();
  void teacherViewsStore.loadSummary();
  teacherViewsStore.connect();
});

onUnmounted(() => {
  teacherViewsStore.disconnect();
});

useVisibilityRefresh(
  (reason) => {
    console.debug(
      "[TeacherDashboardView] visibility refresh triggered by %s",
      reason,
    );
    void refreshIfStale();
    void subscriptionStore.loadSubscription(true);
  },
  {
    includeActivated: true,
    throttleMs: 500,
  },
);

const localeTag = computed(() => (locale.value === "ar" ? "ar-EG" : "en-US"));

const translateTeacher = (key: string, fallback: string) =>
  te(key) ? t(key) : fallback;
const translateTeacherWithParams = (
  key: string,
  fallback: string,
  params: Record<string, unknown>,
) =>
  te(key)
    ? t(key, params)
    : fallback
        .replace("{value}", String(params.value ?? ""))
        .replace("{months}", String(params.months ?? ""))
        .replace("{label}", String(params.label ?? ""))
        .replace("{percent}", String(params.percent ?? ""));

const formatNumber = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(localeTag.value).format(safeValue);
  } catch (error) {
    console.warn("[TeacherDashboardView] failed to format number", error);
    return String(safeValue);
  }
};

const viewsSummarySafe = computed(() => ({
  landingViews: viewsSummary.value?.landingViews ?? 0,
  profileViews: viewsSummary.value?.profileViews ?? 0,
  courseViews: viewsSummary.value?.courseViews ?? 0,
  totalViews: viewsSummary.value?.totalViews ?? 0,
  topCourses: viewsSummary.value?.topCourses ?? [],
}));

const showViewsSkeleton = computed(
  () => viewsLoading.value && !viewsSummary.value,
);
const viewsErrorMessage = computed(() =>
  viewsError.value === "UNAUTHORIZED"
    ? viewsUnauthorizedLabel.value
    : viewsLoadErrorLabel.value,
);
const showViewsRetry = computed(() => viewsError.value !== "UNAUTHORIZED");

const formatMinutes = (value: number) =>
  `${formatNumber(Math.max(0, Math.round(value)))} ${planUsageMinuteShort.value}`;

const formatDurationSeconds = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${formatNumber(hours)}${planUsageHourShort.value} ${formatNumber(minutes)}${planUsageMinuteShort.value}`;
  }
  return `${formatNumber(minutes)}${planUsageMinuteShort.value}`;
};

const formatBytes = (bytes: number) => {
  const safe = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  if (safe === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(safe) / Math.log(1024)),
  );
  const value = safe / 1024 ** index;
  const rounded =
    value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${formatNumber(rounded)} ${units[index]}`;
};

const formatRemainingSeconds = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds));
  if (safe <= 0) return `0${planUsageMinuteShort.value}`;
  return formatDurationSeconds(safe);
};

const formatMonthLabel = (value: string) => {
  if (!value) {
    return "";
  }
  const [year, month] = value.split("-").map((part) => Number(part));
  if (!year || !month) {
    return value;
  }
  try {
    return new Intl.DateTimeFormat(localeTag.value, { month: "short" }).format(
      new Date(year, month - 1, 1),
    );
  } catch (error) {
    return value;
  }
};

const trendLabels = computed(() =>
  trendPoints.value.map((point) => formatMonthLabel(point.month)),
);
const storageTrendValues = computed(() =>
  trendPoints.value.map((point) =>
    Number((point.storageSeconds / 3600).toFixed(2)),
  ),
);
const streamingTrendValues = computed(() =>
  trendPoints.value.map((point) =>
    Math.max(0, Math.round(point.streamingMinutes)),
  ),
);

const storageUsagePercent = computed(() => {
  const used = usageSummary.value?.storageSecondsUsed ?? 0;
  const limit = usageSummary.value?.storageSecondsLimit;
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
});

const storageSizeUsagePercent = computed(() => {
  const used = usageSummary.value?.storageBytesUsed ?? 0;
  const limit = usageSummary.value?.storageBytesLimit;
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
});

const streamingUsagePercent = computed(() => {
  const used = usageSummary.value?.streamingMinutesUsed ?? 0;
  const limit = usageSummary.value?.streamingMinutesLimit;
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
});

const storageRemainingText = computed(() => {
  const used = usageSummary.value?.storageSecondsUsed ?? 0;
  const limit = usageSummary.value?.storageSecondsLimit;
  if (!limit || limit <= 0) return "";
  return formatRemainingSeconds(limit - used);
});

const storageSizeRemainingText = computed(() => {
  const used = usageSummary.value?.storageBytesUsed ?? 0;
  const limit = usageSummary.value?.storageBytesLimit;
  if (!limit || limit <= 0) return "";
  return formatBytes(limit - used);
});

const streamingRemainingText = computed(() => {
  const used = usageSummary.value?.streamingMinutesUsed ?? 0;
  const limit = usageSummary.value?.streamingMinutesLimit;
  if (!limit || limit <= 0) return "";
  return formatMinutes(Math.max(0, limit - used));
});

const storageRemainingLabel = computed(() => {
  if (!storageRemainingText.value) {
    return "";
  }
  return translateTeacherWithParams(
    "teacher.planUsageRemaining",
    "{value} remaining",
    {
      value: storageRemainingText.value,
    },
  );
});

const storageSizeRemainingLabel = computed(() => {
  if (!storageSizeRemainingText.value) {
    return "";
  }
  return translateTeacherWithParams(
    "teacher.planUsageRemaining",
    "{value} remaining",
    {
      value: storageSizeRemainingText.value,
    },
  );
});

const streamingRemainingLabel = computed(() => {
  if (!streamingRemainingText.value) {
    return "";
  }
  return translateTeacherWithParams(
    "teacher.planUsageRemainingThisMonth",
    "{value} remaining this month",
    {
      value: streamingRemainingText.value,
    },
  );
});

const resolveThreshold = (
  value: number | null | undefined,
  fallback: number,
) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
};

const buildUsageWarning = (
  label: string,
  percent: number,
  limit: number | null,
  warningThreshold: number,
  criticalThreshold: number,
) => {
  if (!limit || limit <= 0) return "";
  if (percent >= 100) {
    return translateTeacherWithParams(
      "teacher.planUsageLimitReached",
      "{label} limit reached ({percent} used)",
      { label, percent: formatPercent(percent) },
    );
  }
  if (percent >= criticalThreshold) {
    return translateTeacherWithParams(
      "teacher.planUsageCritical",
      "{label} usage is very high ({percent} used)",
      { label, percent: formatPercent(percent) },
    );
  }
  if (percent >= warningThreshold) {
    return translateTeacherWithParams(
      "teacher.planUsageWarning",
      "{label} usage is approaching the limit ({percent} used)",
      { label, percent: formatPercent(percent) },
    );
  }
  return "";
};

const storageWarning = computed(() => {
  if (!usageSummary.value) return "";
  const warning = resolveThreshold(
    usageSummary.value.storageWarningPercent,
    80,
  );
  const critical = resolveThreshold(
    usageSummary.value.storageCriticalPercent,
    90,
  );
  return buildUsageWarning(
    planUsageStorageLabel.value,
    storageUsagePercent.value,
    usageSummary.value.storageSecondsLimit,
    warning,
    critical,
  );
});

const storageSizeWarning = computed(() => {
  if (!usageSummary.value) return "";
  const warning = resolveThreshold(
    usageSummary.value.storageWarningPercent,
    80,
  );
  const critical = resolveThreshold(
    usageSummary.value.storageCriticalPercent,
    90,
  );
  return buildUsageWarning(
    planUsageStorageSizeLabel.value,
    storageSizeUsagePercent.value,
    usageSummary.value.storageBytesLimit,
    warning,
    critical,
  );
});

const streamingWarning = computed(() => {
  if (!usageSummary.value) return "";
  const warning = resolveThreshold(
    usageSummary.value.streamingWarningPercent,
    80,
  );
  const critical = resolveThreshold(
    usageSummary.value.streamingCriticalPercent,
    90,
  );
  return buildUsageWarning(
    planUsageStreamingLabel.value,
    streamingUsagePercent.value,
    usageSummary.value.streamingMinutesLimit,
    warning,
    critical,
  );
});

const formatResolutionPolicy = (policy: string) => {
  if (!policy) {
    return "";
  }
  const normalized = policy.toLowerCase();
  if (normalized === "block") {
    return translateTeacher(
      "teacher.planUsageResolutionPolicyBlock",
      normalized,
    );
  }
  if (normalized === "downscale") {
    return translateTeacher(
      "teacher.planUsageResolutionPolicyDownscale",
      normalized,
    );
  }
  if (normalized === "allow") {
    return translateTeacher(
      "teacher.planUsageResolutionPolicyAllow",
      normalized,
    );
  }
  return normalized;
};

const formatPercent = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${Math.round(safeValue)}%`;
};

const dateTimeFormatter = computed(() => {
  try {
    return new Intl.DateTimeFormat(localeTag.value, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (error) {
    console.warn(
      "[TeacherDashboardView] failed to create date formatter",
      error,
    );
    return null;
  }
});

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return t("teacher.dateTimeTbd");
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return t("teacher.dateTimeTbd");
  }
  const formatter = dateTimeFormatter.value;
  return formatter ? formatter.format(parsed) : parsed.toLocaleString();
};

const relativeTimeFormatter = computed(() => {
  try {
    return new Intl.RelativeTimeFormat(localeTag.value, { numeric: "auto" });
  } catch (error) {
    console.warn(
      "[TeacherDashboardView] failed to create relative time formatter",
      error,
    );
    return null;
  }
});

const formatRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const diff = timestamp - now;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const formatter = relativeTimeFormatter.value;

  const formatWithUnit = (
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    fallbackKey: string,
  ) => {
    if (formatter) {
      return formatter.format(Math.round(value), unit);
    }
    return t(fallbackKey, { value: Math.abs(Math.round(value)) });
  };

  if (Math.abs(diff) < minute) {
    return t("teacher.relativeTimeJustNow");
  }

  if (Math.abs(diff) < hour) {
    return formatWithUnit(
      diff / minute,
      "minute",
      "teacher.relativeTimeMinutes",
    );
  }

  if (Math.abs(diff) < day) {
    return formatWithUnit(diff / hour, "hour", "teacher.relativeTimeHours");
  }

  return formatWithUnit(diff / day, "day", "teacher.relativeTimeDays");
};

const overviewFallback = {
  totalEnrollments: 0,
  activeStudents: 0,
  revenueManual: 0,
  revenueTutoring: 0,
  avgCourseRating: 0,
  completionRate: 0,
  paymentMethodCount: 0,
};

const safeOverview = computed(() => overview.value ?? overviewFallback);

const isProfilePending = computed(() => profileLoading.value && !profile.value);
const isOverviewPending = computed(
  () => overviewLoading.value && !overview.value,
);
const showMetricsSkeleton = computed(
  () =>
    (isProfilePending.value && !profile.value) ||
    (isOverviewPending.value && !overview.value),
);
const showActivitySkeleton = computed(
  () =>
    activityLoading.value &&
    !upcomingSessions.value.length &&
    !upcomingAssignments.value.length,
);

const assistantsRefreshing = ref(false);

const isRefreshing = computed(
  () =>
    profileLoading.value ||
    overviewLoading.value ||
    activityLoading.value ||
    (teacherAssistantsEnabled.value &&
      (assistantAccountsLoading.value ||
        assistantRolesLoading.value ||
        assistantsRefreshing.value)),
);
const liveSessionsEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.liveSessionsCore),
);
const teacherReportsEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.reportsTeacher),
);

const paymentMethodsCount = computed(
  () => safeOverview.value.paymentMethodCount ?? 0,
);
const paymentMethodsTone = computed(() =>
  paymentMethodsCount.value === 0 ? "danger" : "primary",
);
const showPaymentMethodsWarning = computed(
  () =>
    paymentMethodsCount.value === 0 &&
    !showMetricsSkeleton.value &&
    teacherReportsEnabled.value &&
    !overviewLoading.value,
);

const assistantCount = computed(() => assistantAccounts.value.length);
const assistantRoleCount = computed(() => assistantRoles.value.length);
const assistantsSummaryLoading = computed(
  () => assistantAccountsLoading.value || assistantRolesLoading.value,
);
const assistantsSummaryError = computed(() =>
  Boolean(assistantAccountsError.value || assistantRolesError.value),
);

const lastUpdated = computed(() => {
  const timestamps = [
    profileLoadedAt.value,
    overviewLoadedAt.value,
    activityLoadedAt.value,
    teacherAssistantsEnabled.value ? assistantAccountsLoadedAt.value : null,
    teacherAssistantsEnabled.value ? assistantRolesLoadedAt.value : null,
  ].filter((value): value is number => typeof value === "number");

  if (!timestamps.length) {
    return null;
  }

  return Math.max(...timestamps);
});

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) {
    return "";
  }

  return t("teacher.lastUpdated", {
    value: formatRelativeTime(lastUpdated.value),
  });
});

const sparklineData = computed(() => {
  const metrics = overview.value;
  const completion =
    (metrics?.completionRate ?? 0) || profileCompleteness.value;
  const activeStudents = metrics?.activeStudents ?? 0;
  const totalEnrollments = metrics?.totalEnrollments ?? 0;

  if (!metrics || (!activeStudents && !totalEnrollments)) {
    const fallback = profileCompleteness.value;
    const floor = Math.max(10, fallback - 25);
    const mid = Math.max(20, fallback - 10);
    const high = Math.min(100, fallback + 12);
    return [floor, mid, fallback, high];
  }

  const baseline = Math.max(
    0,
    activeStudents - Math.round(totalEnrollments / 3),
  );
  const mid = Math.max(baseline, activeStudents);
  const growth = mid + Math.max(1, Math.round(totalEnrollments / 2));
  const completionPoint = Math.max(
    growth,
    Math.round(((completion || 0) / 100) * Math.max(1, mid + totalEnrollments)),
  );

  return [baseline, mid, growth, completionPoint];
});

const sparklineCoordinates = computed<SparklinePoint[]>(() => {
  const values = sparklineData.value;

  if (!values.length) {
    return [];
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? SPARKLINE_WIDTH / (values.length - 1) : 0;

  return values.map((value, index) => {
    const x = values.length > 1 ? index * step : SPARKLINE_WIDTH / 2;
    const y = SPARKLINE_HEIGHT - ((value - min) / range) * SPARKLINE_HEIGHT;
    return { x, y };
  });
});

const sparklinePointString = computed(() => {
  const points = sparklineCoordinates.value;

  if (!points.length) {
    return "";
  }

  return points.map((point) => `${point.x},${point.y}`).join(" ");
});

const sparklineAreaPoints = computed(() => {
  const points = sparklineCoordinates.value;

  if (!points.length) {
    return "";
  }

  const firstX = points[0].x;
  const lastX = points[points.length - 1].x;
  const areaPoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return `${firstX},${SPARKLINE_HEIGHT} ${areaPoints} ${lastX},${SPARKLINE_HEIGHT}`;
});

const isAccountActive = computed(() => profile.value?.active ?? false);

const goToCourses = () => router.push({ name: "teacher-courses" });
const goToLiveSessions = () => router.push({ name: "teacher-live-sessions" });
const goToTutoring = () => router.push({ name: "teacher-tutoring" });
const goToQuestionBanks = () => router.push({ name: "teacher-question-banks" });
const goToAssessments = () => router.push({ name: "teacher-assessments" });
const goToReports = () => router.push({ name: "teacher-reports" });
const goToBranding = () => router.push({ name: "teacher-landing-content" });
const goToLearning = () => router.push({ name: "teacher-learning" });
const goToAssistantTeam = () =>
  router.push({ name: "teacher-assistants", hash: "#assistant-team" });
const goToAssistantRoles = () =>
  router.push({ name: "teacher-assistants", hash: "#assistant-roles" });

const quickLinks = computed<QuickLink[]>(() => {
  const links: QuickLink[] = [
    {
      id: "courses",
      label: t("courses.title"),
      icon: "BookOutlined",
      action: goToCourses,
      color: "primary",
    },
  ];

  if (liveSessionsEnabled.value) {
    links.push({
      id: "live-sessions",
      label: t("nav.teacherLiveSessions"),
      icon: "VideoCameraOutlined",
      action: goToLiveSessions,
      color: "info",
    });
  }

  links.push(
    {
      id: "tutoring",
      label: t("nav.teacherTutoring"),
      icon: "ClockCircleOutlined",
      action: goToTutoring,
      color: "secondary",
    },
    {
      id: "assessments",
      label: t("nav.teacherAssessments"),
      icon: "AuditOutlined",
      action: goToAssessments,
      color: "success",
    },
    {
      id: "question-banks",
      label: t("nav.teacherQuestionBanks"),
      icon: "DatabaseOutlined",
      action: goToQuestionBanks,
      color: "warning",
    },
  );

  if (teacherReportsEnabled.value) {
    links.push({
      id: "reports",
      label: t("nav.teacherReports"),
      icon: "LineChartOutlined",
      action: goToReports,
      color: "success",
    });
  }

  if (overview.value && overview.value.totalEnrollments > 0) {
    const index = links.findIndex((link) => link.id === "reports");
    if (index > 1) {
      const [reportsLink] = links.splice(index, 1);
      links.splice(1, 0, reportsLink);
    }
  }

  if (missingFields.value.length) {
    links.unshift({
      id: "complete-profile",
      label: t("teacher.quickLinkCompleteProfile"),
      icon: "IdcardOutlined",
      action: goToBranding,
      color: "warning",
    });
  }

  if (
    upcomingAssignments.value.length &&
    !links.find((link) => link.id === "learning")
  ) {
    links.splice(3, 0, {
      id: "learning",
      label: t("teacher.quickLinkAssignments"),
      icon: "ReadOutlined",
      action: goToLearning,
      color: "info",
    });
  }

  if (teacherAssistantsEnabled.value) {
    links.push({
      id: "assistants",
      label: t("nav.teacherAssistants"),
      icon: "UserSwitchOutlined",
      action: goToAssistantTeam,
      color: "secondary",
    });
  }

  return links;
});

const nextSteps = computed<NextStep[]>(() => {
  const steps: NextStep[] = [];
  const missing = missingFields.value;

  const pushProfileStep = (
    field: TeacherProfileMissingField,
    id: string,
    titleKey: string,
    hintKey: string,
    icon: string,
  ) => {
    if (!missing.includes(field)) {
      return;
    }
    steps.push({
      id,
      title: t(titleKey),
      description: t(hintKey),
      icon,
      action: goToBranding,
    });
  };

  pushProfileStep(
    "bio",
    "complete-bio",
    "teacher.nextStepsCompleteBio",
    "teacher.nextStepsCompleteBioHint",
    "IdcardOutlined",
  );
  pushProfileStep(
    "subject",
    "complete-subject",
    "teacher.nextStepsCompleteSubject",
    "teacher.nextStepsCompleteSubjectHint",
    "BookOutlined",
  );
  pushProfileStep(
    "photoUrl",
    "upload-photo",
    "teacher.nextStepsUploadPhoto",
    "teacher.nextStepsUploadPhotoHint",
    "CameraOutlined",
  );

  if (
    overview.value &&
    overview.value.completionRate < 70 &&
    teacherReportsEnabled.value
  ) {
    steps.push({
      id: "review-reports",
      title: t("teacher.nextStepsReviewReports"),
      description: t("teacher.nextStepsReviewReportsHint"),
      icon: "BarChartOutlined",
      action: goToReports,
    });
  }

  if (
    liveSessionsEnabled.value &&
    overview.value &&
    (overview.value.activeStudents < 5 || overview.value.totalEnrollments < 5)
  ) {
    steps.push({
      id: "launch-live-session",
      title: t("teacher.nextStepsLaunchLiveSession"),
      description: t("teacher.nextStepsLaunchLiveSessionHint"),
      icon: "VideoCameraAddOutlined",
      action: goToLiveSessions,
    });
  }

  if (!upcomingAssignments.value.length) {
    steps.push({
      id: "create-assignment",
      title: t("teacher.nextStepsCreateAssignment"),
      description: t("teacher.nextStepsCreateAssignmentHint"),
      icon: "ReadOutlined",
      action: goToLearning,
    });
  }

  steps.push({
    id: "invite-students",
    title: t("teacher.nextStepsInvite"),
    description: t("teacher.nextStepsInviteHint"),
    icon: "UserAddOutlined",
    action: () =>
      router.push({
        name: auth.isTeacher ? "teacher-enrollments" : "student-register",
      }),
  });

  if (
    teacherAssistantsEnabled.value &&
    !assistantsSummaryLoading.value &&
    !assistantsSummaryError.value &&
    assistantCount.value === 0
  ) {
    steps.push({
      id: "invite-assistant",
      title: t("teacher.nextStepsInviteAssistant"),
      description: t("teacher.nextStepsInviteAssistantHint"),
      icon: "UserSwitchOutlined",
      action: goToAssistantTeam,
    });
  }

  const evergreen: NextStep[] = [
    {
      id: "branding",
      title: t("teacher.nextStepsBranding"),
      description: t("teacher.nextStepsBrandingHint"),
      icon: "PaletteOutlined",
      action: goToBranding,
    },
    {
      id: "welcome",
      title: t("teacher.nextStepsWelcome"),
      description: t("teacher.nextStepsWelcomeHint"),
      icon: "AlignLeftOutlined",
      action: goToBranding,
    },
  ];

  const unique: NextStep[] = [];
  const seen = new Set<string>();

  for (const step of [...steps, ...evergreen]) {
    if (seen.has(step.id)) {
      continue;
    }
    seen.add(step.id);
    unique.push(step);
    if (unique.length >= 4) {
      break;
    }
  }

  return unique;
});

const logout = async () => {
  await auth.logout();
  const target = { name: "login-teacher" } as const;
  try {
    await router.replace(target);
  } catch (error) {
    console.warn(
      "[TeacherDashboardView] failed to navigate after logout",
      error,
    );
  }
};

const reloadProfile = () => {
  void profileStore.load(true);
};

const reloadMetrics = async () => {
  try {
    await featuresStore.ensureLoaded();
  } catch (error) {
    console.warn(
      "[TeacherDashboardView] failed to ensure feature snapshot before reloading metrics",
      error,
    );
  }
  return dashboardStore.loadOverview(true);
};

const reloadActivity = () => {
  void activityStore.load(true);
};

const refreshAssistantsSummary = async () => {
  if (!teacherAssistantsEnabled.value || assistantsRefreshing.value) {
    return;
  }
  assistantsRefreshing.value = true;
  try {
    await assistantsStore.refreshAll();
  } finally {
    assistantsRefreshing.value = false;
  }
};

const refreshAll = async () => {
  const featureRefresh = featuresStore.refresh().catch((error) => {
    console.error(
      "[TeacherDashboardView] failed to refresh features during manual refresh",
      error,
    );
  });
  const tasks: Promise<unknown>[] = [
    profileStore.load(true),
    activityStore.load(true),
    featureRefresh.then(() => dashboardStore.loadOverview(true)),
    usageStore.loadSummary(true),
    usageStore.loadTrends(true),
    teacherViewsStore.loadSummary(),
  ];

  if (teacherAssistantsEnabled.value) {
    tasks.push(assistantsStore.refreshAll());
  }

  await Promise.allSettled(tasks);
};
</script>

<style scoped>
/* ── Metrics grid — responsive breakpoints ─────────────────────────── */
@media (max-width: 1280px) {
  .teacher-dashboard__metrics {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .teacher-dashboard__metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .teacher-dashboard__metrics {
    grid-template-columns: 1fr;
  }
}

/* ── Sparkline SVG — cannot be expressed as Tailwind utilities ──────── */
.teacher-dashboard__sparkline svg {
  display: block;
  width: 100%;
  height: 72px;
}

.teacher-dashboard__sparkline-area {
  fill: color-mix(in srgb, var(--sakai-primary) 18%, transparent);
}

.teacher-dashboard__sparkline-line {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.teacher-dashboard__sparkline-points circle {
  fill: currentColor;
}

/* ── Activity header h3 — scoped child element ──────────────────────── */
.teacher-dashboard__activity-header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── Activity item — hover + border-inline-start + transition ───────── */
.teacher-dashboard__activity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-3) var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-md);
  background: var(--sakai-surface-subtle);
  border-inline-start: 3px solid var(--sakai-primary);
  transition: background var(--sakai-transition-duration)
    var(--sakai-transition-ease);
}

.teacher-dashboard__activity-item:hover {
  background: var(--sakai-primary-tint-04);
}

/* ── Activity empty — color-mix background ──────────────────────────── */
.teacher-dashboard__activity-empty {
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-radius-md);
  background: color-mix(in srgb, var(--sakai-surface) 75%, transparent);
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
}

/* ── Account row — last-child pseudo-selector ───────────────────────── */
.teacher-dashboard__account-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

/* ── Account card — top accent border ──────────────────────────────── */
.teacher-dashboard__account {
  border-top: 3px solid var(--sakai-primary);
}

/* ── Account label — small uppercase ───────────────────────────────── */
.teacher-dashboard__account-label {
  font-size: 0.8rem;
  color: var(--sakai-text-color-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── Account value muted variant ───────────────────────────────────── */
.teacher-dashboard__account-value--muted {
  color: var(--sakai-text-color-tertiary);
}

/* ── Assistants grid — auto-fit columns ─────────────────────────────── */
.teacher-dashboard__assistants-grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

/* ── Assistants value / label / summary ─────────────────────────────── */
.teacher-dashboard__assistants-value {
  font-size: 2rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.teacher-dashboard__assistants-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-tertiary);
}

.teacher-dashboard__assistants-summary {
  font-size: 0.9rem;
  color: var(--sakai-text-color-secondary);
}

/* ── Plan trends header — uppercase label ───────────────────────────── */
.teacher-dashboard__plan-trends-header {
  font-size: 0.85rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Plan trends grid — auto-fit columns ────────────────────────────── */
.teacher-dashboard__plan-trends-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

/* ── Plan trend label — small uppercase ─────────────────────────────── */
.teacher-dashboard__plan-trend-label {
  font-size: 0.75rem;
  color: var(--sakai-text-color-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Views stats grid — auto-fit columns ────────────────────────────── */
.teacher-dashboard__views-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--sakai-space-4);
}

/* ── Views stat box ─────────────────────────────────────────────────── */
.teacher-dashboard__views-stat {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface-1);
  border: 1px solid var(--sakai-border-color);
}

/* ── Views value / label ────────────────────────────────────────────── */
.teacher-dashboard__views-value {
  font-size: 1.5rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-dashboard__views-label {
  font-size: 0.75rem;
  color: var(--sakai-text-color-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Views title ────────────────────────────────────────────────────── */
.teacher-dashboard__views-title {
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-semibold);
}

/* ── Views list li — flex row with surface bg ───────────────────────── */
.teacher-dashboard__views-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-2) var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-md);
  background: var(--sakai-surface-0);
  border: 1px solid var(--sakai-border-color);
}

.teacher-dashboard__views-course {
  color: var(--sakai-text-color-secondary);
}

.teacher-dashboard__views-count {
  font-weight: var(--sakai-font-weight-semibold);
}

/* ── Responsive content grid ────────────────────────────────────────── */
@media (max-width: 960px) {
  .teacher-dashboard__content {
    grid-template-columns: 1fr;
  }

  .teacher-dashboard__views,
  .teacher-dashboard__activity,
  .teacher-dashboard__plan-usage,
  .teacher-dashboard__insights,
  .teacher-dashboard__next,
  .teacher-dashboard__assistants-card {
    grid-column: 1;
    grid-row: auto;
  }

  .teacher-dashboard__alert-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .teacher-dashboard__toolbar {
    justify-content: space-between;
  }
}
</style>
