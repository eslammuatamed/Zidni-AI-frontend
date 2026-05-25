# Redesign Backlog

Tracks deferred work during the dashboard + shell redesign on branch `redesign`. The new color palette (deep blue brand, refined slate text, new state colors) is the authoritative brand identity across the ENTIRE platform — not just redesigned pages. Backlog items below are structural/layout work or cleanup, NOT color reversions.

## Phase 2 — Architecture (note for future dashboard work)

Phase 2 established 4 reusable building blocks for future dashboard surfaces (student dashboard, admin dashboard, etc.):
- `@/utils/formatNumber` — shared `formatNumber` + `formatPercent` with the Latin-digits-everywhere policy.
- `@/composables/useTeacherTranslations` — wraps `useI18n` with key+fallback semantics. Generalizable: rename the composable + extract the placeholder substitution into a generic helper for other namespaces.
- `@/composables/useTeacherDashboardActions` — navigation actions tied to teacher routes. Pattern transfers directly: create a `useStudentDashboardActions` / `useAdminDashboardActions` for parallel surfaces.
- `@/composables/useTeacherDashboardRefresh` — cross-card refresh orchestration (state + actions). The pattern (single composable owns `isRefreshing` + `refreshAll` + per-section refresh state) transfers to any dashboard with multi-store refresh needs.

When a new dashboard surface starts (student or admin), prefer the same extraction pattern: composables for cross-cutting concerns, one self-contained component per card, view is a slim composition root.

## Phase: Index Pages redesign (branch `redesign`, in progress)

Redesign of INDEX/LIST surfaces (data tables: page header + filter bar + table + pagination) to the Figma pattern at node `574:745` (Live Sessions, "الجلسات المباشرة"). Reference page first (`src/views/teacher/live/LiveSessionsList.vue`), then propagation. Adopt-or-enhance existing primitives; no upfront shared "DataIndexPage" component.

**Foundation primitives (Phase 1, Sub-step 1 — DONE; additive; vue-tsc clean against the 176-error baseline):**
- `UiTag` gained `dot?: boolean` (leading status dot; color via `currentColor`). Additive — 0 existing usages affected.
- `UiButton` gained `size?: 'xs'|'sm'|'md'|'lg'` (default `md` = legacy metrics). Additive — see latent-intent item below.
- New `src/components/ui/UiPagination.vue` (1-indexed, MUI-style page model, RTL-aware logical layout, optional size selector, `#info` scoped slot for i18n).

**DEFERRED — Index Pages Phase 3 Sub-batch B2** (discovery done this session; the audit dossier in the chat transcript is the source of truth). 2 simple-list pages remain, same `LiveSessionsList` vocabulary; both need hand-rolled prev/next pagination → `UiPagination`. Est. 1–2 Claude Code turns.
- [ ] `src/views/teacher/TeacherLandingMessagesView.vue` — 522 LOC, **190 scoped-CSS lines** incl. a responsive table↔list switch (`:deep`), hand-rolled pagination, a composite name + message-snippet cell, 1 row action (view). Namespace `teacherLandingMessages.*`; add a `*Entity` key for `pagination.showing`.
- [ ] `src/views/teacher/audit/TeacherAudit.vue` — 497 LOC, 93 scoped-CSS lines, filter form (search + entityType + 2 dates), hand-rolled pagination, composite actor/entity cells, 1 `UiTag` (actor), 1 row action (view). Namespace `adminOps.audit.*`; add a `*Entity` key.

**DEFERRED — Deep visual QA on Phase 3 B1 pages.** Light QA passed (2026-05-25); deep QA pending for `TeacherAssessmentsView`, `TeacherCertificatesView`, `OffersList`: filter behavior under data load, pagination edge cases (last page, empty-filter result), RTL + dark + mobile (<720/721px) spot-checks. Note: Offers pagination now actually works (previously dead `UiTable` props).

**RESOLVED (Phase 3 Batch B) — `pagination.showing` is now generic.** `pagination.showing` was refactored to "Showing {from} to {to} of {total} **{entity}**" / "عرض {from} إلى {to} من {total} **{entity}**"; each caller passes an entity noun. Entity keys added: `live.teacher.sessionsEntity` ("جلسة"/"sessions"), `assessments.assessmentsEntity` ("اختبار"/"assessments"), `offers.offersEntity` ("عرض ترويجي"/"offers" — AR disambiguated from "عرض"=display). Reference page `LiveSessionsList` `#info` updated to pass `entity`. Future propagation pages just add their own `<ns>.xEntity` key.

**Backlog items opened during this track:**

- [ ] **Migrate remaining `UiBadge` usages to `UiTag`** (Q4: standardize on `UiTag`, eventually deprecate `UiBadge`). `TeacherAssessmentsView.vue` (×2) **DONE** in Phase 3 Batch B. **~21 other consumers remain** project-wide (e.g. `AssessmentBuilderView`, `CourseListView`, `StudentDashboardView`, `TeacherRosterView`, `StudentAssessmentsView`, checkout panels, landing/admin lists, `PlatformCourseCard`, …) — migrate opportunistically as each is touched in its own track; only delete `UiBadge.vue` once all are migrated (verify before delete).

- [ ] **`UiButton size` latent-intent surfacing (accepted as intentional, Option A).** Before Phase 1, `size` was a dead no-op (fell through to the DOM); every `<UiButton size=…>` rendered at `md`. Making `size` real changes the rendered size of **236 of 240 usages across 57 files** (217× `sm` + 11× `xs` shrink; 8× `lg` grow; 3× `md` unchanged; 1× out-of-spec `size="small"` in `FilterBar.vue` safely falls back to `md`). **HIGH-regression-risk files (recently visually QA-approved) needing spot QA:** the 6 dashboard card components (`TeacherDashboardActivity`, `…Alerts`, `…Assistants`, `…NextSteps`, `…Toolbar`, `…TopCourses`) + `CourseEditorView.vue`. The remaining ~49 files are older/not-recently-QA'd; the shrink is likely the latent intent (table-row action links, hand-rolled pagination buttons) and is accepted wholesale. Group-1 spot-QA targets flagged by the user: `CourseEditorView.vue:166,175` (thumbnail Preview/Remove) + `TeacherDashboardActivity.vue:29,88` (View all sessions / Review assignments). Landing/public `lg`-grow usages (`TeacherPublicTabs`, `PublicCourseDetailView`) deferred to the landing track.

- [ ] **Pre-existing `UiButton` invalid prop usages (NOT caused by the `size` change; not blocking).** These pass values outside the component's API (valid variants: `solid|outline|link|ghost|soft`; valid sizes: `xs|sm|md|lg`) — leftover Vuetify vocabulary. They render with the base/fallback style today and are unaffected by the `size` work. Fix opportunistically as each file is touched in future tracks:
  - `src/components/ui/FilterBar.vue:26` — `variant="text"` + `size="small"` (+ `color="error"`) — legacy Vuetify-based FilterBar (not reused by the index track).
  - `src/views/admin/AdminPlanBuilder.vue:34,43,52,471,532,726` — `variant="secondary"` (tone-as-variant).
  - `src/views/admin/ops/AdminAudit.vue:54` and `src/views/teacher/audit/TeacherAudit.vue:41` — `variant="secondary"`.
  - `src/views/PublicCourseDetailView.vue:758` and `src/views/PublicCoursesView.vue:36,84,90` — `variant="tonal"` (Vuetify) — landing/public track.
  - `src/views/teacher/notifications/NotificationsCenter.vue:38,50` and `src/views/student/notifications/NotificationsCenter.vue:38,50` — `variant="text"` (icon-only buttons).

- [ ] **Decide whether to convert `CourseListView` from card-grid to the table pattern** (Q6). This is a UX decision, not a restyle — the courses index is the only list rendered as a `UiCard` grid rather than a `UiTable`. Defer until the index-pages pattern is proven on the reference page; revisit during Phase 4 (outliers).

- [ ] **Make `formatDateTime` globally locale-aware.** `src/utils/formatters.ts` gained an optional `locale?` param (default `undefined` = unchanged) during the reference-page build; only `LiveSessionsList` passes it (`ar-u-nu-latn` for the Latin-digits policy). The 8+ other callers still render dates in the **browser-default** locale, so dates show in English under an Arabic UI elsewhere. Dedicated pass: refactor `formatDateTime` to read the app i18n locale internally (import the i18n instance) + apply the Latin-digits policy centrally, then QA across all callers (same discipline as the `UiButton size` surfacing).

- [ ] **Orphaned i18n keys `live.teacher.repeatedCopy`** ("نسخة مكررة" / "Copy") **and `live.teacher.repeatSource`** ("الأصل" / "Source"). The duplicate-copy and repeat-source status tags they fed were replaced (D2) by title-adjacent icons (`CopyOutlined` / `ShareAltOutlined`) using new tooltip keys (`live.teacher.duplicateCopyTooltip` / `live.teacher.repeatSourceTooltip`). No `t()` references remain (verified). Remove both from `ar.json` + `en.json` once confirmed no other surface needs them. (The data flags `item.repeatedCopy` / `item.repeatSource` are unrelated and still in use for the icon `v-if`s.)

## Phase: Session Editor redesign (branch `redesign`, COMPLETED 2026-05-25)

**Track extraction DONE:** `LiveSessionForm.vue` dialog → dedicated `TeacherSessionEditorView.vue` page; consumer migrated; old dialog deleted (Batch 3). The sub-items below remain open.

Extracts "Schedule a new session" from the `LiveSessionForm` dialog into a dedicated full-page editor (`src/views/teacher/live/TeacherSessionEditorView.vue`) at `/teacher/live-sessions/create` + `/teacher/live-sessions/:sessionId/edit`, matching the Course/Lesson editor pattern (`ThemePage` + `UiCollapsibleSection` + sidebar `UiCard`s + `isDirty`/Cancel-confirm reusing `courses.cancelConfirmUnsaved`). Teacher-only (assistant/student LiveSessions have no create/edit). Figma node `577:1438`. No backend changes; all `LiveSessionForm` bindings + submit logic preserved byte-identical. Edit route loads via `getTeacherSession(id)` + `listTeacherRegistrations(id)`.

**Figma-only fields SKIPPED (require backend / data-model additions before UI):**
- `language` (presentation language — لغة التقديم)
- `category` (session category — التصنيف; distinct from the existing required `courseId`)
- `targetAudience` (audience selector — الجمهور المستهدف; distinct from the existing `studentIds` list)
- `coverImage` (cover image upload — صورة الغلاف; the "Cover image" section was omitted entirely per D4)
- `topics` (session topics/agenda — the original "Topics & schedule" section; repurposed to "Scheduling & Recurrence" to host existing recurrence fields)

Each needs an API / data-model decision before UI implementation.

**Deviations from the Batch-1 spec (flagged; byte-identical-preserving):**
- `moduleId` kept as a number `UiInput` (not a courseId-dependent `UiSelect`) — course-list items aren't guaranteed to carry `modules` and the dialog used a free number input; a dependent select needs confirmed per-course module data (out of no-new-data scope).
- Recurrence controls kept as the dialog had them — `isRecurring` (both modes) + independent `repeatEnabled` (create-only) + `repeatCount`/`repeatInterval` (when `repeatEnabled`) — rather than nesting `repeatEnabled` under `isRecurring`, which would change field reachability.
- `description` is now **required** (canSave gate + Figma `*`); the dialog allowed empty. Binding unchanged (`description.trim() || undefined`).

**Follow-ups:** Batch 2 = migrate `LiveSessionsList` create button + row Edit → `router.push`. Batch 3 = delete `LiveSessionForm.vue` after confirming zero references (its scoped CSS goes with it).

**Spawned during Batch-1 QA fixes:**
- [ ] **Migrate the 7 native `<UiSelect multiple>` consumers to `UiMultiSelect`** (closed-by-default chip dropdown, built this batch): `TeacherQuestionBanksView`, `TeacherRosterView` (×2), `CourseEditorView`, `StudentLearningView`, `admin/ops/AdminAlerts`, `teacher/offers/OfferForm`. Each needs its own visual QA pass during its respective track. (`LiveSessionForm` also uses one but is deleted in Batch 3.) `UiSelect` itself is untouched — native single-select unaffected.
- [ ] **Session Editor `moduleId` — defensive local modules snapshot.** The dependent module select reads `coursesStore.current.modules` directly (shared course-detail slot). Optional hardening: keep a local snapshot keyed by courseId instead, defensive against multi-tab / concurrent-edit edge cases. Single-tab navigation (the common case) is unaffected.
- [ ] **`UiMultiSelect` searchable mode.** Deferred — add a filter input inside the panel when a consumer needs 100+ options. Not needed by the Session Editor's student list today.
- [ ] **Orphaned `live.teacher.*` i18n keys (logged per Rule 5, not deleted).** After the `LiveSessionForm` deletion + audit, these have zero `t()` consumers — remove from `ar.json` + `en.json` once confirmed no other surface needs them: `createTitle`, `editTitle` (old dialog title keys; the editor uses `liveSession.editor.title`/`updateSession`). Pre-existing orphans surfaced during the same audit (not caused by this track): `courseLabel`, `scheduledAtLabel`. (`repeatedCopy` + `repeatSource` already logged under the Index Pages track's orphan item.)

## Phase: Course Editor redesign (branch `redesign`, in progress)

Restyle/restructure of `CourseEditorView.vue` **body only** (ThemeAppShell + topbar untouched — already redesigned in Dashboard Phase 1). Section-by-section; see REDESIGN_PROGRESS.md. No backend/store/route changes — restyle + restructure + re-home existing fields only.

Decisions locked: full 3-zone restructure (settings sidebar + main accordion); Publish / Save-draft / Cancel action bar (Section 2); lg (1024px) stack breakpoint; 350px sidebar.

Figma-only fields — **SKIP** (no backend, per D4): subtitle, main category, subcategory, discounted price.
Code-only fields — **KEEP & re-home** (per D5): currency, module-pricing toggle, FAQ, course type, target audience, status alert.

Sections 3-8 (visual restyle batch) — done: DS-components-as-is (no global overrides, no `:deep`). B.2 certificate checkbox→`UiSwitch`; B.3 removed Basic-Info card-in-card + status banner→compact `UiTag` pill (success/neutral, driven by `form.active`) + dropped the stray modules-subtitle `h3`; B.4 rebuilt "ما سوف تتعلمه" as a `UiTag` chip input (single field + add button, auto-order, removable chips — `whatYouWillLearn[]` shape unchanged); B.6 removed Course-Content card-in-card (modules `UiCard`→ section `#header-actions` + `flush` accordion). B.1/B.5 fields already used DS components (no change beyond a spacing-stack wrapper). 2 pre-existing bugs fixed: course-title now uses new `courses.courseTitle` key; `courses.faq` AR corrected "التعليمات"→"الأسئلة الشائعة".

Section 9 (cleanup) — **DONE** (402 lines removed, `CourseEditorView.vue` 3349→2946; vue-tsc clean):
- [x] ~~Dead scoped CSS~~ removed: `.course-editor__form-status*`, `__form-header`, `__form-title`, `.form-control`, `.btn-add-item`, commented `.course-editor`, orphan `.course-editor__main`, commented `.course-editor__sidebar` + commented `@media (max-width:960px)` — **plus** the adjacent pre-redesign `.course-editor__visibility-*` cluster (confirmed dead, removed in the same contiguous block).
- [x] ~~Dead script~~ removed: `learnItem`, `arrayItemsLast`, `addLearnitemToArray`; `whatYouWillLearnItemOrder` was already gone.
- [x] ~~Commented dead-template holding area~~ removed (was lines 75–234).
- [x] ~~Stale import~~ `UploadVideo` removed (only referenced by the deleted commented block).
- [x] ~~Raw-HTML "What you'll learn" widget~~ **Rebuilt in B.4** (chip pattern).
- [x] ~~Card-in-card (Basic Info + Course Content)~~ **Removed in B.3 + B.6**.
- [x] ~~`saveInfo` debug~~ removed (`console.log(unique)` + the dead `loggedValue` debug object + its log) and the `course`-watch `whatYouWillLearn` debug logs.
- [ ] **Pre-existing debug `console.log` left intentionally** (outside the redesign-touched code, flagged not removed): `console.log(courseId)`, `console.log(err)` (inside a `catch` — removing risks an unused `err`/empty catch; wants proper error handling), and a `console.log("------1----------")` in a module helper. Sweep these in a general debug-log cleanup.

Field Redistribution Pass (done) — structural move only, no restyle; all 16 `v-model="form.*"` bindings preserved verbatim, vue-tsc clean. Resulting homes: Basic Info (title, description, type, faq, + active switch & Save staying until Section 2); Goals & Requirements (whatYouWillLearn, courseRequirements, targetAudience); Visual Media (thumbnail, intro video); Pricing sidebar card (price, currency, useModulePricing); Additional Settings sidebar card (instructor, level, language, duration, certificate). Commented dead template blocks relocated intact into a marked "DEAD CODE" holding area in Basic Info (still slated for Section 9 removal).

Pre-existing bugs surfaced during redistribution (NOT fixed — out of structural scope):
- [ ] **Course-title field mislabeled**: the title input (`v-model="form.title"`) uses `:label="t('courses.title')"`, but `courses.title` = "دوراتي" / "My Courses" (the course-list page heading). The course-name field reads "My Courses". Fix needs a NEW dedicated key (e.g. `courses.courseTitleLabel`) — cannot repurpose `courses.title` (the listing page legitimately uses it). Address in Section 5 (Basic Info styling) or as a Phase-1 fix.
- [ ] **FAQ label locale mismatch**: `courses.faq` = "التعليمات" (Instructions) in `ar.json` but "FAQ" in `en.json`. Same field (`form.faq`); reconcile the two locales (pick Instructions vs FAQ) in Section 5.
- [ ] **Instructor select migration (D7)**: Figma renders instructor as a dropdown; kept as free-text `UiInput` for now — no instructor/teacher list endpoint confirmed. Migrate to a `UiSelect` once a teacher-list source exists (needs backend/store support — out of current no-backend scope).

Section 2 (Top action bar) — done: replaced the header back-link with a 3-action bar (Publish / Save as draft / Cancel) in `ThemePage`'s `#actions` slot; Publish/Draft set `form.active` then reuse `saveInfo()` with action-specific toasts; removed the `form.active` switch + Save button from Basic Info (status banner kept as read-only indicator); added `isSaving`/`savingAction` (spinner on clicked button) + best-effort `isDirty` (deep watch on `form`, guarded by save/sync) for the Cancel guard. Follow-ups:
- [ ] **Add a proper unsaved-changes dialog primitive** to replace the `window.confirm` in the Course Editor cancel flow (D2.3). No confirm composable exists project-wide today.
- [ ] **Add breadcrumb support to `ThemePage`** (prop or `#breadcrumb` slot) so views can show "الدورات › …" per Figma. The only existing breadcrumb (`PageHeader.vue`) is Vuetify-based and incompatible with the redesigned `ThemePage` (D2.5).
- [ ] Dirty tracking covers `form.*` only; edits to the `whatYouWillLearn` list (separate `whatYouWillLearnArray` ref) do not mark the form dirty. Wire it in when the widget is rebuilt in Section 6.
- Note: `UiButton` gained `variant="soft"` (tonal fill, any tone) and `color="neutral"` (border/text tokens, non-branded) — additive, now available project-wide.

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

## Project pattern: Tailwind-first styling + Vuetify `.border` collision

**Standing rule (2026-05-25):** default styling is Tailwind 3 utilities inline on the element; scoped `<style>` is a last resort. When touching a file with scoped CSS, migrate it opportunistically. Also recorded in standing project memory (`tailwind-first-styling-rule`, `vuetify-border-class-collision`) so it applies to all future work.

### The Vuetify `.border` collision (important — affects all border work)

Vuetify CSS (imported globally via `vuetify/styles`) ships border **utility** classes with everything `!important`, and the app runs Tailwind with `corePlugins.preflight = false` (only `@tailwind components/utilities`, no base reset). Cascade proof from the built bundle:

```css
.border{border-width:1px}                                   /* Tailwind: width only */
.border,.border-thin{border-width:thin!important;
  border-style:solid!important;
  border-color:rgba(var(--v-border-color),var(--v-border-opacity))!important}  /* Vuetify wins */
.border-border{border-color:var(--sakai-border-color)}      /* Tailwind: NON-important → loses */
```

So `class="border border-border"` (or any Tailwind border-color) renders **Vuetify's** themed border color (`--v-border-color` @ ~12% → faint gray), not the intended token. Same for `.border-t/-b/-s/-e`. And `border-style:solid!important` also overrides `border-dashed` → **dashed borders render solid**. Safe Tailwind border classes (NOT defined by Vuetify): `border-2/4/8`, `border-x/-y/-l/-r`, `border-0/-none`, and the `before:`/`[&_…]`-prefixed variants.

**Required convention — use the arbitrary-property shorthand (bypasses the `.border` class entirely):**
- `border border-border` → `[border:1px_solid_var(--sakai-border-color)]`
- `border border-white/10` → `[border:1px_solid_rgb(255_255_255_/_0.1)]`
- `border border-dashed border-border/50` → `[border:1px_dashed_color-mix(in_srgb,var(--sakai-border-color)_50%,transparent)]`
- `border-t border-border/40` → `[border-top:1px_solid_color-mix(in_srgb,var(--sakai-border-color)_40%,transparent)]`

### Related: `divide-y` dividers were invisible (same preflight root cause)

`divide-y` sets `border-*-width` only; with preflight off there is no `border-style: solid`, and `divide-{color}/opacity` on the var-based `border` token emits no color. Result: dividers rendered nothing. Fix: `divide-y divide-solid divide-[color-mix(in_srgb,var(--sakai-border-color)_40%,transparent)]`.

### Project-wide fix landed (2026-05-25)

Audited all of `src/`; fixed **16 affected border occurrences** (Vuetify color override) + **3 `divide-y`** dividers across: `TeacherDashboardInsights`, `TeacherDashboardPlanUsage` (incl. the dashed unlimited-usage bars rendering solid — latent Section 6 bug), `TeacherDashboardTopCourses`, `TeacherDashboardNextSteps`, `UiTable`, `TeacherAssessmentAttemptsView`, `assistant/LiveSessionsList`, `admin/AdminTeachersView`, `StudentAssessmentsView`, `student/live/StudentLiveSessions`, `StudentDashboardView`. Build + vue-tsc baseline clean; each rule verified in dist CSS.

- [ ] **Deferred — undefined `surface-100` token (4 occurrences):** `src/views/teacher/assistants/AssistantsManagementView.vue:1011,1015,1019,1023` use `border-b border-surface-100`. Neither the Tailwind class `surface-100` nor the CSS var `--sakai-surface-100` is defined anywhere (the var is also referenced unresolved in several admin views). Needs a target-color decision before migrating (likely `var(--sakai-border-color)` for a row separator).
- [ ] **Bare-border, no explicit color (left as-is, verify intent):** `AppShellAdmin.vue:9,16,57` (intentional Vuetify utility usage) and `LandingHome.vue:205,223,236,253,267` (separate landing track; loads its own preflight).

### Longer-term fix (proposal — not implemented)

- **Primary (zero-risk, adopted):** standardize on the `[border:…]` shorthand convention above.
- **Optional global (medium-risk):** a `main.scss` layer loaded after `vuetify/styles` that drops the `!important` *color* on Vuetify's public `.border*` utilities (keep width/style) so Tailwind border-color works normally — requires a Vuetify-component regression sweep.
- **Avoid:** Tailwind `important: true` (blanket `!important` on all utilities) and migrating off Vuetify (Phase-1 rule forbids touching Vuetify internals; long-term only).

## Phase: Resolve undefined `--sakai-surface-100` token references

The token `--sakai-surface-100` is referenced but **undefined project-wide** (no definition in `tokens.scss` or anywhere in `src/`/`node_modules`). Discovered during the Vuetify `.border` collision audit. Files with unresolved `var(--sakai-surface-100)` references in scoped CSS:

- [ ] `src/components/ai/StudentLessonAiPanel.vue`
- [ ] `src/components/ai/TeacherLessonAiAssistant.vue`
- [ ] `src/views/admin/analytics/AdminAnalyticsExport.vue`
- [ ] `src/views/admin/analytics/AdminAnalytics.vue`
- [ ] `src/views/admin/moderation/AdminCoursesModeration.vue`
- [ ] `src/views/admin/ops/AdminAudit.vue`
- [ ] `src/views/admin/ops/AdminBackups.vue`

Each reference currently renders as the CSS var default (effectively transparent/none — most are used as `color-mix(... var(--sakai-surface-100))` backgrounds, so the mix falls back oddly). Either:
a) Define `--sakai-surface-100` in `tokens.scss` with intended value (verify what each consumer expected — likely a subtle background tint), or
b) Migrate each reference to an existing defined token per its actual intent.

Audit consumer-by-consumer; some may want `--sakai-surface-muted`, others `--sakai-border-color`, others a new tint level. Not blocking; surfaces today render with no/odd background where surface-100 was expected. (Related: the same files / others also use undefined Tailwind `text-surface-500` / `text-surface-900` classes — same surface-scale gap, e.g. `AssistantsManagementView.vue`.)

## Phase: Lesson + Assignment editor redesign — orphaned i18n keys

Orphaned during the redesign (logged, not deleted — same discipline as prior tracks):
- [ ] `courses.lessonMediaSectionTitle` ("Lesson media & attachments" / "الوسائط والمرفقات") — orphaned in Batch 1 when the Lesson editor's single "media" section split into separate "Video" (`lessonVideoSectionTitle`) and "Resources" (`lessonResourcesHeading`) sections. No code references remain (locales-only).
- [ ] `teacher.assignments.backToList` / `teacher.assignments.backToCourse` — orphaned in Batch 4 when the Assignment editor's top "Back" link was replaced by the Save + Cancel `#actions` bar (the `backLabel` computed that consumed them was removed). No code references remain (locales-only).

Checked-but-NOT-orphaned: the lesson video-status banner keys (`lessonVideoProcessingBannerTitle/Description`, `lessonVideoProcessingPlaceholder`, `lessonVideoFailedBannerTitle/Description`, `lessonVideoFailedPlaceholder`) — LessonEditorView's banner builder was removed in Batch 3, but these remain in active use by `CourseEditorView.vue` (course-intro / lesson-video-preview banners, L1288–1311). Left untouched.

## Monitoring (not actions)

- Watch for user feedback on link affordances across the app, now that brand color is darker than legacy cyan. Solve via interaction states if needed, never by reverting brand color.

## Notes

- Typography migrated to Plus Jakarta Sans + Noto Sans Arabic (Figma-faithful) during Section 4. IBM Plex Sans Arabic remains loaded as a fallback. The legacy `src/styles/theme.css` token alias also flips automatically since it references `--sakai-font-family-base`.
