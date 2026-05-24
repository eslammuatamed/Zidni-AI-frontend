# Redesign Backlog

Tracks deferred work during the dashboard + shell redesign on branch `redesign`. The new color palette (deep blue brand, refined slate text, new state colors) is the authoritative brand identity across the ENTIRE platform — not just redesigned pages. Backlog items below are structural/layout work or cleanup, NOT color reversions.

## Phase 2 — Architecture (note for future dashboard work)

Phase 2 established 4 reusable building blocks for future dashboard surfaces (student dashboard, admin dashboard, etc.):
- `@/utils/formatNumber` — shared `formatNumber` + `formatPercent` with the Latin-digits-everywhere policy.
- `@/composables/useTeacherTranslations` — wraps `useI18n` with key+fallback semantics. Generalizable: rename the composable + extract the placeholder substitution into a generic helper for other namespaces.
- `@/composables/useTeacherDashboardActions` — navigation actions tied to teacher routes. Pattern transfers directly: create a `useStudentDashboardActions` / `useAdminDashboardActions` for parallel surfaces.
- `@/composables/useTeacherDashboardRefresh` — cross-card refresh orchestration (state + actions). The pattern (single composable owns `isRefreshing` + `refreshAll` + per-section refresh state) transfers to any dashboard with multi-store refresh needs.

When a new dashboard surface starts (student or admin), prefer the same extraction pattern: composables for cross-cutting concerns, one self-contained component per card, view is a slim composition root.

## Phase: Auth pages restyle

- [ ] AdminLoginView and other auth pages need layout/structure restyling to match the new brand visual language (the colors are already correct via tokens).

## Phase: TeacherPlanUpgradeView restyle

- [ ] Full page restyle to match new design system. Note: phone link uses `--sakai-primary-600` (`#162a69`, the new brand) — if link affordance needs reinforcement, solve via underline / hover / icon, NOT by changing color.

## Phase: Landing pages redesign (separate Figma in progress)

- [ ] `LandingHome.vue` uses hardcoded `#1e3a8a` + `#06b6d4` — migrate to tokens when landing Figma is finalized. These are the only remaining hardcoded brand hexes in the active codebase.
- [ ] Teacher-landing templates (6 files) use hardcoded `#22c55e` — migrate to `--sakai-success` when landing Figma is finalized.
- [ ] `src/styles/landing/variables.css` (`--nabta-*` namespace) — decide whether to consolidate into `--sakai-*` tokens during landing redesign.

## Cleanup / cross-cutting

- [ ] Dead code: `src/layout/AppShellTeacher.vue`, `AppShellStudent.vue`, `AppShellAdmin.vue`, `AppShellAssistant.vue` — orphaned per Step 1 analysis.
- [ ] Dead code: `src/theme/modernTheme.ts` — registered nowhere as of branch `redesign`.
- [ ] Dead code: `src/layout/theme/buildStudentNavItems.ts`, `buildAdminNavItems.ts`, `buildAssistantNavItems.ts` — only imported by the orphaned `AppShell*.vue` files above. `ThemeAppShell.vue` uses inline `computed` nav definitions for student/admin/assistant roles and only imports `buildTeacherNavModel`.
- [ ] Dead CSS: `.theme-app-shell__nav-group` class in `src/theme/sakai/layout.scss` is never rendered — the nav model is a flat array with no section labels.
- [ ] Undefined tokens referenced in `TeacherPlanUpgradeView.vue`: `--sakai-font-size-xs` and `--sakai-warning-600`. Define them in `tokens.scss` OR replace usages with defined tokens.
- [ ] Dead computed: `themeToggleNextLabel` in `src/layout/theme/ThemeAppShell.vue` is no longer referenced after Section 2 (theme toggle dropped its trailing text label per Figma). Remove the computed.
- [ ] Audit all route definitions for breadcrumb coverage. The new breadcrumbs logic falls back to "no second crumb" when neither a nav model match, `route.meta.title`, nor a derived `nav.{routeName}` key resolves. This is correct behavior (prevents English leakage), but some routes may silently show only the home crumb when they could show a meaningful localized title. Sweep `src/router/index.ts` and ensure every authenticated route either: (a) has a matching nav model entry, (b) has `route.meta.title` set to a translatable i18n key, or (c) follows the kebab→camel `route-name → nav.X` key convention so the breadcrumb computed can derive a translation.
- [ ] Orphaned i18n keys after Section 3 (KPI cards dropped `secondary-stat` per Figma): `teacher.profileCompletenessHint`, `teacher.activeStudentsHint`, `teacher.newEnrollmentsHint`, `teacher.completionRateHint`, `teacher.paymentMethodsConfiguredHint`. Remove from `src/locales/ar.json` and `src/locales/en.json` (and any other locale files) once nothing else references them.
- [ ] Orphan after Section 4: `quickLinks` computed in `src/views/TeacherDashboardView.vue` — no consumer after the welcome card was simplified per Figma.
- [ ] Orphan after Section 4: `QuickLink` interface in `src/views/TeacherDashboardView.vue`.
- [ ] Orphan after Section 4: `goToCourses` / `goToTutoring` / `goToQuestionBanks` / `goToAssessments` helpers in `src/views/TeacherDashboardView.vue` — exclusive to `quickLinks`; other `goTo*` helpers (`goToLiveSessions`, `goToLearning`, `goToReports`, `goToBranding`, `goToAssistantTeam`, `goToAssistantRoles`) are shared with Next Steps / Activity / Assistants cards and stay in use.
- [ ] Orphan after Section 4: `teacher.bioPlaceholder` in `src/locales/en.json` and `src/locales/ar.json`.
- [ ] Orphan after Section 4: `teacher.quickLinkCompleteProfile` in `src/locales/en.json` and `src/locales/ar.json`.
- [ ] Orphan after Section 4: `teacher.quickLinkAssignments` in `src/locales/en.json` and `src/locales/ar.json`.
- [ ] Orphan after Section 5: `sparklineCoordinates`, `sparklinePointString`, `sparklineAreaPoints` computeds in `src/views/TeacherDashboardView.vue` — `sparklineData` is still used (feeds the new line chart), but the SVG-coordinate transforms are dead after the hand-rolled SVG sparkline was replaced by `TheLineChart`.
- [ ] Orphan after Section 5: `teacher.insightsHint` in `src/locales/en.json` and `src/locales/ar.json` — `UiAlert` hint dropped from the redesigned Insights card.
- [ ] Orphan after Section 9: `teacher.assistantsDashboard.teamSummary` and `teacher.assistantsDashboard.rolesSummary` in `src/locales/en.json` and `src/locales/ar.json` — secondary summary lines dropped from the Assistants card per D1 (redundant with the uppercase label above). Stats now show only value + label (matching Section 8 Views card pattern).
- [x] ~~Orphan after Section 6: `formatResolutionPolicy` helper + `planUsageMaxResolutionLabel` / `planUsageResolutionPolicyLabel` / `planUsageDefaultLabel` computeds in `TeacherDashboardView.vue`~~ **Resolved**: deleted during Phase 2 Plan usage extraction (Component #9). The helper had no consumers after Section 6's metadata simplification; deletion was clean.
- [ ] Orphan i18n keys still pending deletion from locale files (Section 6 — locale-file cleanup only, code consumers all removed): `teacher.planUsageMaxResolution`, `teacher.planUsageResolutionPolicy`, `teacher.planUsageResolutionPolicyBlock`, `teacher.planUsageResolutionPolicyDownscale`, `teacher.planUsageResolutionPolicyAllow`, `teacher.planUsageDefault` in `src/locales/en.json` and `src/locales/ar.json`.
- [x] ~~Technical debt from Section 5: `src/views/TeacherDashboardView.vue` uses `:deep()` selectors targeting `UiProgressCircle`'s internal BEM classes...~~ **Resolved**: `UiProgressCircle` refactored to use ApexCharts `radialBar`. It now exposes `ringColor` and `trackColor` props; the Insights card uses them directly. The `:deep()` rules were removed from `TeacherDashboardView.vue`'s scoped CSS.
- [ ] Technical debt from Section 6: `src/views/TeacherDashboardView.vue` uses a `:deep(.ui-progress__track)` selector to boost track contrast for Plan usage progress bars on the white card surface (the default `color-mix(... 55%, transparent)` track was too subtle on this card). Couples the view to `UiProgressBar`'s internal class name. Future cleanup: either add a `trackColor` prop to `UiProgressBar` (analogous to the post-Section 5 `UiProgressCircle` refactor), or expose a less-translucent default track style via a new variant prop.
- [x] ~~`UiChart` legacy component~~ **Fully retired in Phase 2d**. AdminAnalytics + StudentReports migrated to `TheLineChart` (variant `"full"`) via the new `AnalyticsChartCard.vue` wrapper. `src/components/ui/UiChart.vue` deleted. Project is now 100% ApexCharts.

## Phase: Course views analytics drill-down

- [ ] Section 8 Top Courses card has no "view all" link to a course-views analytics page because no such route exists in `src/router/index.ts` (existing teacher routes go to `/teacher/courses` which is the generic course list, NOT a views-sorted ranking — link there would mislead). When a dedicated course-analytics or views-drilldown route exists, add a "view all" link to the Top Courses sub-heading per Figma frame `518:834` (button "عرض الكل ←").

## Phase: Quick-create session/event from dashboard

- [ ] Figma frame `518:928` shows an "إضافة حدث جديد" (Add new event) full-width CTA at the bottom of the Timeline/Activity card. Currently SKIPPED in Section 7 because no `create-session` / `new-session` route exists in `src/router/index.ts` (existing teacher live routes are limited to `/teacher/live-sessions` list view, `/teacher/live-moderation`, `/teacher/live-polls`). When a deep-linkable session-create flow exists (either a dedicated route or a sharable dialog state), wire the CTA into the Activity card bottom per Figma. Optionally extend to also create assignments inline.

## Phase: AI assistant feature

- [ ] When teacher-side AI assistant route/feature is built, add the topbar pill (Figma frame 518:590 shows it: `bg #EFF6FF`, `border rgba(219, 234, 254, 0.6)`, 10px radius, text in `--sakai-primary`, AI icon). Currently SKIPPED because there is no teacher-side AI route — only the `aiTeacher` / `aiStudent` / `aiFreeTrial` feature flags gating internal features. Student side already has `/assistant` → `StudentAssistantView` (route name `student-assistant`), which could host an analogous pill in the student shell when that gets restyled.

## Phase: Number formatting consolidation

**Status: actionable** — the shared utility now exists (created in Phase 2a). Remaining work is migration of the listed views.

- [x] ~~Create `src/utils/formatNumber.ts`~~ **Done in Phase 2a**: exports `formatNumber` + `formatPercent` with hardcoded `'en-US'` locale (Latin digits policy). `formatCurrency` not yet exported — add when a consumer needs it.
- [ ] Migrate the views below to import from `@/utils/formatNumber` and remove their inline `Intl.NumberFormat(localeTag.value)` definitions.

  Already migrated via Phase 2 extraction (consumed by extracted dashboard components):
  - [x] `src/views/TeacherDashboardView.vue` (and all extracted dashboard components consume `@/utils/formatNumber`).

  Same bug pattern (`Intl.NumberFormat(localeTag.value)` with `ar-EG`/`en-US` swap), needs migration:
  - [ ] `src/views/admin/analytics/AdminAnalytics.vue`
  - [ ] `src/views/TeacherPaymentsView.vue`
  - [ ] `src/views/CourseListView.vue`
  - [ ] `src/views/PublicCoursesView.vue`
  - [ ] `src/views/StudentTeacherCoursesView.vue`
  - [ ] `src/views/PublicCourseDetailView.vue`

  Other inline formatters (using `undefined` locale, `'en-US'`, or `toFixed`), needs unification:
  - [ ] `src/views/StudentTutoringView.vue`
  - [ ] `src/views/student/checkout/TutoringCheckoutPanel.vue`
  - [ ] `src/views/TeacherTutoringView.vue`
  - [ ] `src/views/admin/moderation/AdminCoursesModeration.vue`
  - [ ] `src/views/admin/ops/AdminPaymentLogs.vue`
  - [ ] `src/views/TeacherPlanUpgradeView.vue`
  - [ ] `src/views/TeacherPlanCheckoutView.vue`
  - [ ] `src/views/admin/AdminPlanBuilder.vue`
  - [ ] `src/views/TeacherAssessmentAttemptsView.vue`
  - [ ] `src/views/teacher/reports/TeacherReportsOverview.vue`

## Phase 1 fixes during redesign work

These are pre-existing bugs fixed during the dashboard + shell redesign because they were highly visible in the redesigned UI and would have undermined the rebrand if left. Not scope creep — bug squashes recorded for traceability.

- Fixed: breadcrumb labels falling back to raw English route names (e.g. `"teacher dashboard"`) on the home route instead of translated nav labels. Root cause in `ThemeAppShell.vue` `breadcrumbs` computed: the active nav match equaled the home item, the duplicate-push guard rejected it, then the `else if` fallback used `route.name.replace(/[-_]/g, " ")`. Fix: detect `activeNav === homeItem` and stop; for non-home routes with no nav match, attempt `te()` on `route.meta.title` then on a derived `nav.X` camelCase key, and skip entirely if neither translates.
- Fixed: breadcrumb separator icon (`RightOutlined`) did not flip in RTL. Fix: locale-driven `breadcrumbSeparatorIcon` computed that returns `LeftOutlined` for `ar` and `RightOutlined` for `en`.
- Fixed: entire Plan usage card rendered in English under Arabic locale because ALL `teacher.planUsage*` keys were missing from `src/locales/ar.json` — `translateTeacher(key, fallback)` was returning the in-code English fallback strings. Also discovered: `planUsageVideoStorageSize` was missing from BOTH locale files, so the "Video storage size" label was an untranslatable in-code fallback even under English. Fix: added 21 Arabic translations under `teacher.*` in `ar.json` (Title, Subtitle, Error, PlanFallback, MaxDuration, Unlimited, VideoStorage, VideoStorageSize, StreamingMinutes, Remaining, RemainingThisMonth, TrendsTitle, TrendsError, TrendsEmpty, StorageTrendLabel, StreamingTrendLabel, LimitReached, Critical, Warning, MinuteShort, HourShort) plus added `planUsageVideoStorageSize` to `en.json`. The 6 D3-orphan keys (`MaxResolution`, `ResolutionPolicy`, `ResolutionPolicyBlock`, `ResolutionPolicyDownscale`, `ResolutionPolicyAllow`, `Default`) were intentionally NOT translated — they're orphans from Section 6's metadata simplification.
- Fixed: entire Profile & course views card was missing ALL 11 `teacher.views*` i18n keys from BOTH `ar.json` AND `en.json`. Same pattern as the Plan usage gap — `translateTeacher(key, fallback)` returned in-code English fallback strings for every locale. Arabic users saw all-English text; English users saw the unchecked fallbacks. Fix: added `viewsCardTitle`, `viewsCardSubtitle`, `viewsTotalLabel`, `viewsLandingLabel`, `viewsProfileLabel`, `viewsCourseLabel`, `viewsTopCoursesTitle`, `viewsEmpty`, `viewsUnauthorized`, `viewsLoadError`, `viewsRetry` to both locale files under `teacher.*`.

## Monitoring (not actions)

- Watch for user feedback on link affordances across the app, now that brand color is darker than legacy cyan. Solve via interaction states if needed, never by reverting brand color.

## Notes

- Typography migrated to Plus Jakarta Sans + Noto Sans Arabic (Figma-faithful) during Section 4. IBM Plex Sans Arabic remains loaded as a fallback. The legacy `src/styles/theme.css` token alias also flips automatically since it references `--sakai-font-family-base`.
