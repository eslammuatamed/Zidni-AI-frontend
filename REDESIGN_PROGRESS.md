# Redesign Progress — Branch: `redesign`

## Overview

This is a Phase 1 redesign of the **Teacher Dashboard homepage + the shared authenticated shell** for the Zidni AI multi-tenant ed-tech platform. Source of truth is the Figma file at <https://www.figma.com/design/3uYLOeStRXZSI74x0Wk77U/Zidni-AI?node-id=518-590> — node `518:590` ("الرئيسية"). All work happens on the `redesign` branch and is not pushed/committed until explicitly told. The core philosophy: **the new color palette (deep blue brand `#1B2FAC`, Figma slate text, refined state colors) is the authoritative brand identity across the ENTIRE platform**, not just redesigned pages — pages outside the redesign scope will hue-shift automatically and that is CORRECT, not a bug. They will get their own structural redesign in later phases.

## Hard Rules (Carried Across All Sessions)

These rules must NEVER be violated:

- **Don't push, don't commit** unless explicitly told.
- **Don't add features without backing data, route, or store**. If Figma shows a control that has no destination in the codebase, SKIP it (record in `REDESIGN_BACKLOG.md` if the feature might be built later).
- **Don't reduce sidebar nav count** — keep all ~20 items from `buildTeacherNavModel` and the inline computeds.
- **Don't move user identity** from topbar avatar menu to sidebar. The avatar menu stays in the topbar.
- **Don't delete `UiChart`** — it's used by other pages outside this redesign.
- **Don't touch orphaned files**: `src/layout/AppShellTeacher.vue` / `AppShellStudent.vue` / `AppShellAdmin.vue` / `AppShellAssistant.vue` (dead — not imported anywhere; the real shell is `ThemeAppShell.vue`). Same for `src/theme/modernTheme.ts` (registered nowhere). All listed in `REDESIGN_BACKLOG.md`.
- **Don't touch landing pages**: `LandingHome.vue`, teacher-landing templates, `src/styles/landing/variables.css` (`--nabta-*` tokens). They're on a separate redesign track with their own Figma.
- **Don't touch Vuetify component internals** (UiDialog, v-btn, etc.). Only the surrounding wrappers / templates.
- **New brand colors are platform-wide**: pages outside the redesign scope that hue-shift cyan→deep-blue are correct. Don't add them to a "fix later" backlog as if they're bugs.
- **Tailwind utilities required for all new styling**; convert existing CSS to Tailwind only when SAFE (no behavior change, no `:deep()` selectors, no dynamic JS-computed styles).
- **All colors via tokens** (`var(--sakai-*)` / Tailwind utilities like `bg-sakai-primary`). Never hardcode hex.
- **RTL conventions**:
  - Use logical CSS properties (`margin-inline-start/end`, `ms-/me-/ps-/pe-`, `inset-inline-start/end`, `start-/end-`) for layout that should follow reading direction.
  - Use **PHYSICAL** positioning (`right`, `left`) for VISUAL conventions that don't flip with reading direction — notification dots stay top-right in both LTR and RTL (like iOS/Android/Figma).
- **Dark mode must work for every change**. The `[data-theme='dark']` block in `tokens.scss` has overrides for all the redesigned tokens.
- **New components only when extraction clearly improves the code**. Don't extract for the sake of it. Three new components so far: `SidebarUpgradeCard.vue`, `TheLineChart.vue`, `KpiMetricCard.vue` — all under `src/components/dashboard/`.
- **Stop and ask before major decisions**. Present 2-4 numbered options with a recommended default; never make architectural choices unilaterally.

## Tech Stack Reminders

- **Vue 3.4** Composition API with `<script setup>`; **Pinia**; **Vue Router 4**; **Vuetify 3**; **Tailwind 3.4** (`corePlugins.preflight: false` — no input/button reset); **Sass**; **vue-i18n** (Arabic + English, RTL via `dir="rtl"` on `<html>`).
- **ApexCharts 5.12.0** + **vue3-apexcharts 1.11.1** — installed, registered globally. `TheLineChart` wrapper consumed by Section 5 Insights card; `UiProgressCircle` (post-Section 5 refactor) uses `radialBar` directly.
- **The real shell**: `src/layout/theme/ThemeAppShell.vue`. This is the **only** mounted shell — `App.vue` routes every authenticated view through it. Per-role nav is split:
  - Teacher: `src/layout/theme/buildTeacherNavItems.ts` (`buildTeacherNavModel` function)
  - Student / admin / guest-teacher / assistant: **inline computeds inside `ThemeAppShell.vue`**, not separate files. The standalone `buildStudentNavItems.ts` / `buildAdminNavItems.ts` / `buildAssistantNavItems.ts` are dead (only imported by orphaned `AppShell*.vue` files).
- **Dashboard view**: `src/views/TeacherDashboardView.vue` (route `/teacher/home`).
- **Tokens**: `src/theme/sakai/tokens.scss`. The legacy `src/styles/theme.css` is deprecated (header comment says so).
- **Tailwind config**: `tailwind.config.cjs`. Custom breakpoints match Vuetify: `sm: 600`, `md: 960`, `lg: 1280`, `xl: 1920`.
- **Data stores** consumed by the dashboard (untouchable contract): `auth`, `tenant`, `teacherProfile`, `teacherDashboard`, `teacherActivity`, `teacherUsage`, `teacherViews`, `teacherAssistants`, `subscription`, `features`, `featureSync`, `notifications`, `landingInquiries`.

## Color System (Part A — COMPLETED)

Brand pivot: cyan `#06B6D4` → deep blue `#1B2FAC` (and full ramp rebuilt around it). State colors refined to Figma hues (success `#0FB271`, danger `#EC003F`). Slate text scale refined (`text-color-secondary: #314158`, `text-color-tertiary: #62748E`). New tokens added: `--sakai-accent` (purple `#673DE7`), `--sakai-brand-deep` / `--sakai-brand-deepest` (gradient stops), `--sakai-surface-page` (`#F7F9FC`) / `-muted` (`#F1F5F9`), `--sakai-text-color-strong` (`#0F172B`), `--sakai-*-soft` tokens (flat soft state surfaces), `--sakai-gradient-brand` / `-brand-soft`, `--sakai-delta-up` / `-down`, `--sakai-dot-red` / `-blue`. All have dark-mode overrides. Vuetify `mathGuruTheme` + `mathGuruDarkTheme` aligned to the new brand (info lifted to `#60A5FA` in dark for AA contrast). `modernTheme.ts` left untouched but gained a documentation comment noting it's unused.

Files involved:
- `src/theme/sakai/tokens.scss` — token source of truth
- `tailwind.config.cjs` — utility exposure (`sakai-primary` ramp fixed to use vars; new `surface.page/muted`, `content.strong`, `*-soft`, `delta-*`, `dot-*` utilities; `gradient-brand` background-image entries)
- `src/plugins/vuetify.ts` — `mathGuru` + `mathGuruDark` brand hex aligned to tokens
- `src/theme/modernTheme.ts` — dead-code header comment only

All 114 files in the codebase that use `--sakai-*` / `--brand-*` tokens hue-shift automatically through the cascade. No view-level edits required for the color migration itself.

## Chart Library (Part B — COMPLETED + in use)

- `apexcharts@5.12.0` + `vue3-apexcharts@1.11.1` installed (caret-pinned).
- **Plugin**: `src/plugins/apexcharts.ts` (re-exports VueApexCharts to match the vuetify/i18n pattern).
- **Registration**: `app.use(VueApexCharts)` in `src/main.ts`.
- **Wrapper**: `src/components/dashboard/TheLineChart.vue`. Typed `ChartSeries[]` data + `categories[]` props + optional `title`/`height`. **Now consumed** by the Section 5 Insights card. Extended during Section 5 with two new props (`surface: 'light' | 'dark'`, `compact: boolean`) — defaults preserve the original behavior.
- Wrapper reads brand + text colors from live CSS vars (`getComputedStyle(document.documentElement).getPropertyValue('--sakai-X')`), re-evaluates on theme toggle by touching `themeStore.isDark` inside the computed, uses ApexCharts' built-in `theme: 'dark' | 'light'` for tooltips, and `yaxis.opposite: true` in RTL (Apex doesn't truly mirror chart direction; data still flows LTR per common chart convention).

## Mid-Phase Migrations

Cross-cutting changes applied during the section work that affect more than just one redesign section. Surfaced + approved mid-flight, executed in their own gates.

### Typography Migration (during Section 4)

- Font architecture audit revealed clean single-source-of-truth: `--sakai-font-family-base` used at body level (`src/theme/sakai/base.scss:22`, `src/styles/main.scss:10`) + `tailwind.config.cjs` `sans` utility. Zero hardcoded font names outside the token. Landing pages isolated via their own `<ThemeProvider>`.
- Swapped `--sakai-font-family-base` from `'IBM Plex Sans Arabic'` to `'Plus Jakarta Sans', 'Noto Sans Arabic', sans-serif`.
- `index.html` Google Fonts URL extended to load Plus Jakarta Sans (300-800) + Noto Sans Arabic (300-800) alongside the existing IBM Plex (300-700 retained as fallback safety).
- Entire authenticated app flipped via inheritance. Landing pages, mono blocks, Bootstrap regions unaffected.
- Visual QA re-passed on Sections 1-3 under new font.

### Number Formatting Fix (during Section 4)

- Discovered mid-QA: KPI cards mixed Latin (0-9) and Eastern Arabic (٠-٩) digits because `formatNumber` used `Intl.NumberFormat('ar-EG')` under Arabic locale.
- Policy decision: Latin digits for ALL numeric displays regardless of UI locale (matches Figma + analytics convention + tabular-nums compatibility).
- One-line fix in `src/views/TeacherDashboardView.vue`: hardcoded `Intl.NumberFormat` to `'en-US'`. Cascades to ~25 call sites in the file (KPI cards, plan usage labels, views card, top courses, assistants).
- Dates remain locale-aware (Arabic month names, relative time) via separate `Intl.DateTimeFormat` call sites that retain `localeTag`.
- Added inline comment explaining the deliberate hardcoded `'en-US'`.
- Backlog entry "Phase: Number formatting consolidation" lists 17 other views using inline number formatters with various locale patterns — needs a shared utility (`src/utils/formatNumber.ts`) and migration in a dedicated phase.

## Visual Redesign Progress (Part C)

### COMPLETED Sections

#### Section 1 — Sidebar

- Removed nav-item hover `translateX` slide (Figma is flat).
- Removed nav-item `is-active` `box-shadow` (Figma is flat).
- Brand mark unchanged structurally — multi-tenant initials computation (`brandInitials` from `tenantStore.branding.name`) preserved; only the visual treatment (gradient via `--sakai-gradient-brand`, shadow via `--brand-mark-shadow`) updates through tokens.
- **Upgrade card extracted** to `src/components/dashboard/SidebarUpgradeCard.vue`. Dark gradient (`--sakai-gradient-brand`), white text + arrow icon + RTL-aware chevron, hover lift, focus ring. Parent shell passes `@click="handleNavigate"` via attribute fallthrough to the RouterLink root — component template MUST remain single-root (comment in file).
- Section groupings (Figma "القائمة الرئيسية" / "التفضيلات") SKIPPED per rule — nav model is flat, no groupings to map to.
- Files touched: `src/layout/theme/ThemeAppShell.vue` (template upgrade-block + script import), `src/theme/sakai/layout.scss` (2 line removals), new `SidebarUpgradeCard.vue`, `REDESIGN_BACKLOG.md` (cleanup notes added).
- **Visual QA: passed**.

#### Section 2 — Topbar

- Container: height `4.5rem`, padding `1rem 2rem`, removed soft `box-shadow` (flat).
- Drawer toggle / theme toggle / settings icon / notifications bell / new landing-inquiries: all converted to `theme-icon-button--square` modifier — 32×32 px, 12px radius, icon-only.
- Theme toggle dropped its trailing text label (`themeToggleNextLabel` computed is now dead — in cleanup backlog).
- Notifications bell: counter `<span>` replaced by `<span class="theme-icon-dot theme-icon-dot--red">` — 6×6 pixel-pinned dot with white halo, anchored to **physical** `top: 6px; right: 6px;` (visual convention, not reading direction). Counter still exposed to screen readers via `notificationsAriaLabel`.
- **New landing-inquiries button** promoted to topbar (mirrors the existing sidebar nav item). Gated by `v-if="auth.isTeacher"`, dot uses `--sakai-dot-blue` (= `--sakai-info`). Sidebar nav item NOT removed.
- AI Assistant pill SKIPPED — no teacher-side AI route exists; only `aiTeacher` / `aiStudent` / `aiFreeTrial` feature flags that gate internal features. Recorded in `REDESIGN_BACKLOG.md` "Phase: AI assistant feature" with Figma specs preserved for future implementation.
- Search input: filled `--sakai-surface-muted` bg, fixed-ish `flex: 0 1 17.5rem` (280px), trailing search icon (DOM order: input first, icon last → trails in both directions naturally). WebKit search-input UA chrome stripped via `-webkit-appearance: none` + pseudo-element resets.
- Language toggle: now displays the CURRENT language native name (`العربية` / `English`), not the toggle target. Icon position swapped to trailing.
- Avatar pill compacted: 32px initials avatar + name (with max-width + ellipsis) + chevron. Role label moved out of the pill into a new `theme-topbar__user-menu-header` div at the top of the dropdown menu.
- Breadcrumbs: pre-existing bug fixed where the home route showed `"teacher dashboard"` (raw English fallback). Now: if `activeNav === homeItem`, stop after the home crumb; otherwise try `te()` on `route.meta.title` then derived `nav.{routeName}` camelCase key, skip the second crumb if neither translates. Separator chevron flips for RTL via `breadcrumbSeparatorIcon` computed (`LeftOutlined` for Arabic, `RightOutlined` for English).
- Files touched: `src/theme/sakai/layout.scss` (topbar container), `src/layout/theme/ThemeAppShell.vue` (template + script + scoped CSS), `REDESIGN_BACKLOG.md` (Phase: AI assistant feature section + 2 fix records under "Phase 1 fixes during redesign work").
- **Visual QA: passed** (5 fixes applied after the first QA pass: search bg, dot position, dot size, breadcrumb translation, RTL separator).

#### Section 3 — KPI Cards

- **Extracted** `src/components/dashboard/KpiMetricCard.vue`. Props: `label: string`, `value: string`, `icon: string`, `tone?: 'primary' | 'info' | 'success' | 'warning' | 'danger'`.
- **Two-row layout**: top row uses `flex justify-between` with DOM order `<label>, <icon>` so the label anchors to the reading-start side (right in RTL, left in LTR) and the icon tile anchors to the reading-end side — matches Figma's RTL render exactly. Label + value both use `text-align: start`.
- Icon tile: 32×32 px, 12px radius, tone-tinted bg (`--kpi-tone-soft` driven by tone modifier — uses existing `--sakai-*-soft` tokens for info/success/warning/danger and `--sakai-primary-tint-12` for primary). Icon color via `--kpi-tone-color`.
- Card chrome: `bg-surface-card`, 1px `border-border`, `shadow-sakai-sm`, 12px radius, padding 20px, min-height 7.5rem. Hover lifts -3px with shadow upgrade.
- Value: 28px bold, `--sakai-text-color-strong`, `font-variant-numeric: tabular-nums`.
- **6× `UiStatCard` swapped to `KpiMetricCard`** in `TeacherDashboardView.vue`. `secondary-stat` prop dropped entirely (5 orphaned `*Hint` i18n keys recorded in backlog).
- **NO delta indicators on any card** — verified by reading the three data sources directly: `TeacherReportsOverviewResponse`, `TeacherViewSummaryResponse`, and the `profileCompleteness` getter expose zero period-over-period fields. Adding deltas would require inventing data, which is forbidden.
- Skeleton count fixed `5 → 6`. Skeleton silhouette restyled to match the new card (icon-tile + label top, value bottom).
- Grid wrapper: `grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`. 6 cards = 4 on row 1 + 2 wrapping to row 2 anchored to inline-start. Three scoped `@media` queries for `.teacher-dashboard__metrics` removed (replaced by Tailwind responsive utilities).
- `UiStatCard` left untouched (still used by other views in the app).
- Dynamic `paymentMethodsTone` (`'danger'` when count = 0, `'primary'` otherwise) preserved and passed to `:tone`.
- `showPaymentMethodsWarning` `<UiAlert>` kept inside the grid via `col-span-full`.
- Files touched: new `KpiMetricCard.vue`, `src/views/TeacherDashboardView.vue` (template metrics block + imports + scoped CSS), `REDESIGN_BACKLOG.md` (orphaned `*Hint` i18n keys added).
- **Visual QA: passed**.

#### Section 4 — Welcome card

- Welcome card fully restructured per Figma: dropped `UiCard` chrome + bio + all 6–9 quick-link pills entirely.
- Replaced with a bare greeting block (`<h1>` heading + wave emoji + tagline) between toolbar and metrics grid.
- Vertical order changed: alerts → toolbar → greeting → metrics → rest.
- Fixed pre-existing bug: `"Welcome, Dashboard!"` name fallback. Now uses two distinct i18n keys (`teacher.welcomeBack` with name interpolation, `teacher.welcomeBackAnonymous` without). Structural impossibility of the bug recurring.
- First-name extraction via `profile?.name?.trim().split(/\s+/)[0] || auth.user?.firstName`.
- Emoji 👋 placed AFTER the heading text (reads as trailing accent in both LTR and RTL via DOM order swap; no CSS direction tricks needed).
- 3 new i18n keys added per locale: `teacher.welcomeBack`, `teacher.welcomeBackAnonymous`, `teacher.welcomeTagline`.
- Next Steps card untouched (absorbs the onboarding-action role the quick-link pills used to play).
- No skeleton during profile loading (graceful intermediate text is fine).
- Files touched: `src/views/TeacherDashboardView.vue`, `src/locales/en.json`, `src/locales/ar.json`.
- **Visual QA: passed**.

#### Section 5 — Insights card

- Insights card hybridized between Figma's "Setup the academy" card (kept the progress circle) and "Smart Insights" card (adopted the dark gradient surface + white text).
- Replaced `UiCard` wrapper with inline `<div>` using `bg-gradient-brand-soft`, `text-white`, `rounded-[14px]`, `p-6`, `border border-white/10`.
- Replaced the hand-rolled SVG sparkline with `TheLineChart` wrapper (ApexCharts).
- `TheLineChart` wrapper extended with two new props: `surface: 'light' | 'dark'` (default `'light'`) and `compact: boolean` (default `false`). Backward-compatible — defaults preserve existing behavior.
  - `surface='dark'` overrides text/border colors to white tones, switches series color to `--sakai-primary-300` (lighter brand shade) for contrast on dark gradient.
  - `compact=true` hides axes, grid, legend, markers — produces a clean pulse-style line.
- Progress circle on dark surface: used `:deep()` workaround in scoped CSS targeting `UiProgressCircle`'s internal BEM classes (`.ui-progress-circle__value` → `--sakai-primary-300`, `.ui-progress-circle__track` → `rgba(255,255,255,0.15)`). Slot content wrapped in `<span class="text-white">`. `UiProgressCircle.vue` itself was NOT modified. Logged technical debt in backlog about `:deep()` coupling to internal class names.
- Dropped the `UiAlert` hint entirely (`teacher.insightsHint` orphaned).
- Sparkline data shape converted: `chartSeries: [{ name: t('teacher.insightsTitle'), data: sparklineData }]`, `chartCategories: ['', '', '', '']`.
- `sparklineData` computed preserved (feeds the chart). `sparklineCoordinates`, `sparklinePointString`, `sparklineAreaPoints` computeds are orphaned (in backlog).
- Card height not fixed — let it size to content.
- **Post-Section 5 update**: `UiProgressCircle.vue` was subsequently refactored to use ApexCharts `radialBar` (replaced the hand-rolled SVG), exposing `ringColor` / `trackColor` props. The Insights card was updated to use those props directly; the `:deep()` workaround in scoped CSS was removed. The technical-debt entry in the backlog is marked resolved.
- Files touched: `src/components/dashboard/TheLineChart.vue`, `src/views/TeacherDashboardView.vue`, `src/components/ui/UiProgressCircle.vue` (post-Section 5).
- **Visual QA: passed**.

#### Section 6 — Plan usage card

- Card now uses `UiCard` with `#title` slot to inline the plan-name brand chip (`bg-sakai-primary/10 text-sakai-primary`) directly with the title heading — chip reads as a peer of the title, not a floating element.
- 3 usage rows wrapped in a single `divide-y divide-border/40` cluster with `py-3` per row + `first:pt-0 last:pb-0`. Subtle dividers create rhythm without heavy framing.
- Per-row inline status: limited shows `"used / limit"` (tabular-nums); unlimited shows combined `"used • ∞ Unlimited"` inline (kills the orphan used-value text from the previous QA round).
- Unlimited rows display a 12px dashed-border ghost track (`h-3 rounded-full border border-dashed border-border/50`) instead of UiProgressBar — preserves row rhythm without faking a 0% bar.
- Bar meta (used/limit) moved OUT of UiProgressBar's slot to the row's header line; `UiProgressBar :show-value="false"` so bars show only the colored fill.
- Scoped `:deep(.ui-progress__track)` override sets the track to `var(--sakai-border-color)` (full opacity, not 55% mixed) — boosts track contrast on the white card surface. Coupling to UiProgressBar internal class name logged as Section 6 technical debt in backlog.
- Mid-phase chart wrapper extension: `TheLineChart`'s `compact: boolean` prop converted to `variant: 'full' | 'minimal' | 'sparkline'` (default `'full'`). Section 5 caller migrated to `variant="sparkline"` with identical visual output.
- Mini-trend charts migrated from `UiChart` to `TheLineChart` with `variant="minimal" :height="180"` — smooth Apex curves, x-axis month labels + y-axis scale labels visible, no grid/legend, small markers (2px), tooltip active. Trends loading skeleton bumped from 96px → 180px to match.
- `UiChart` import removed from `TeacherDashboardView.vue` (component still used by `AdminAnalytics.vue` + `StudentReports.vue` — kept in repo).
- Plan metadata trimmed per D3: kept `maxVideoDurationMinutes` as a small meta line below the subtitle (only renders when set); dropped `maxResolution` + `resolutionPolicy` entirely (plan-admin details with no daily-workflow relevance). 6 i18n keys + `formatResolutionPolicy` helper + 3 computeds orphaned to backlog.
- Trends section visually separated from usage cluster by a subtle `border-t border-border/40 pt-6 mt-6`.
- **Pre-existing fix surfaced during Section 6 QA**: 21 missing Arabic `teacher.planUsage*` i18n keys added to `ar.json`; `planUsageVideoStorageSize` added to BOTH locale files (was missing from both). Logged under "Phase 1 fixes during redesign work" in backlog.
- 3 new computeds added: `isStorageUnlimited`, `isStorageSizeUnlimited`, `isStreamingUnlimited` (limit null/0 → unlimited branch). 2 new chart series computeds: `storageTrendSeries`, `streamingTrendSeries` (wrap existing values in `ChartSeries[]` shape).
- Files touched: `src/views/TeacherDashboardView.vue`, `src/components/dashboard/TheLineChart.vue`, `src/locales/ar.json`, `src/locales/en.json`.
- **Visual QA: passed**.

### REMAINING Sections (in order)

#### Section 7 — Activity card

- Two sub-sections: "Upcoming sessions" (from `teacherActivityStore.upcomingSessions`) and "Upcoming assignments" (from `teacherActivityStore.upcomingAssignments`).
- Restyle to Figma's cleaner row layout: colored dot + time + title + subtitle.
- **SKIP** "Add new event" button — no backing route/action exists. Don't invent.

#### Section 8 — Top courses card

- Bind to `teacherViewsStore.summary.topCourses[]`. Each entry has `courseId`, `title`, `views`.
- Render only columns that exist in the data — Figma may show "instructor name" or other fields the API doesn't provide. Omit those.
- Preserve `teacherViewsStore` binding and loading/error states.

#### Section 9 — Assistants summary card

- Gated by `featuresStore.hasFeature(FEATURE.teacherAssistants)` — preserve the gate.
- Restyle surface to Figma; keep all data bindings to `teacherAssistantsStore` (`assistantCount`, `assistantRoleCount`).
- Preserve refresh/loading/error states.

#### Section 10 — Next Steps card

- Intentionally untouched during Section 4 (Welcome card) — it absorbed the contextual-onboarding role the dropped quick-link pills used to play. Schedule as the final card-content section now that it's the only visually inconsistent block left on the dashboard.
- Preserve all existing `nextSteps` computed logic and bindings: missing profile fields (bio / subject / photo), create-assignment nudges, invite-assistant nudges, review-reports prompts.
- Style alignment with KPI cards / Plan usage card chrome — keep informational tone, don't compete with the Insights card visual focal point.
- No data shape changes; restyling only.

#### Section 11 — Dashboard Grid Layout Optimization

- **Initial Section 11 implementation** (Option B from the audit): converted content grid from `md:grid-cols-2` to **`md:grid-cols-12`** — 12-column system unlocks mixed ratios via clean divisors (4/6/8 = 33/50/67 splits).
- **Post-Phase-2 grid tweak** (applied after Phase 2 component extraction): Insights + Assistants paired vertically inside a wrapper div; Next Steps grown to `lg:col-span-8`; standalone Assistants row eliminated. Eliminates the half-empty row when Assistants is enabled.
- **Final visual rhythm**:
  - **Row 1**: Next Steps (`md:col-span-6 lg:col-span-8`) │ Wrapper (`md:col-span-6 lg:col-span-4 flex flex-col gap-5`) containing Insights stacked above Assistants (`v-if="teacherAssistantsEnabled"`).
  - **Row 2**: Plan usage (`md:col-span-12`). Full-width — trends 2-up grid needs the room.
  - **Row 3**: Top Courses (`md:col-span-6 lg:col-span-4`) │ Activity (`md:col-span-6 lg:col-span-8`). Activity is the denser card — gets the wider lg slot.
- **md fallback**: clean 50/50 throughout. Asymmetric 67/33 only activates at lg+ where there's room for variety.
- **Mobile (`<960px`)**: all cards stack 1-up via `grid-cols-1` base. Inside the wrapper, Insights stacks above Assistants (or alone if gated off).
- **Assistants gated off**: wrapper renders only Insights and sizes to its content. No empty grid slot.
- **KPI grid** (top of dashboard) unchanged per scope decision — 4+2 wrap at lg accepted as future content-trim opportunity.
- **Files touched (initial)**: `src/views/TeacherDashboardView.vue` only.
- **Files touched (post-Phase-2 tweak)**: view template restructure + col-span class adjustments inside `TeacherDashboardNextSteps.vue` (col-span 4 → 8 at lg), `TeacherDashboardInsights.vue` + `TeacherDashboardAssistants.vue` (col-span classes removed — components are now wrapped, no longer direct grid items).
- **Visual QA: passed** at sm / md / lg / xl viewports.

## Backlog

The file `REDESIGN_BACKLOG.md` at the project root tracks ALL deferred work and orphaned items. Categories:

- **Cleanup / cross-cutting** — dead code (orphaned shells, `modernTheme`, dead nav-builder files, dead `.theme-app-shell__nav-group` CSS, dead `themeToggleNextLabel` computed), undefined tokens, route breadcrumb coverage audit, orphaned i18n keys (Sections 3-5 `*Hint` keys, Section 4 `quickLink*` + `bioPlaceholder`, Section 5 `insightsHint`), Section 4 orphans (`quickLinks` computed + `QuickLink` interface + 4 exclusive `goTo*` helpers), Section 5 orphans (3 sparkline-coordinate computeds).
- **Phase: Number formatting consolidation** — 17 views still use inline `Intl.NumberFormat` with various locale patterns. Needs a shared utility (`src/utils/formatNumber.ts`) and migration in a dedicated phase.
- **Phase: Auth pages restyle** — layout/structure only; colors are already correct via tokens.
- **Phase: TeacherPlanUpgradeView restyle** — full page restyle; phone link uses the new dark brand color.
- **Phase: Landing pages redesign** — separate Figma in progress; do NOT migrate landing files into the dashboard redesign scope.
- **Phase: AI assistant feature** — when the teacher-side AI route is built, add the topbar pill per Figma specs already documented.
- **Phase 1 fixes during redesign work** — records of pre-existing bugs squashed during the redesign (breadcrumb fallback + RTL separator).
- **Notes** — typography migration record (Plus Jakarta Sans + Noto Sans Arabic adopted as platform body font; IBM Plex retained as fallback).
- **Monitoring (not actions)** — link affordances after the brand-color darkening.

**The next session should read `REDESIGN_BACKLOG.md` but NOT act on backlog items unless the user explicitly requests.**

## Workflow Conventions (Carried Forward)

1. **Discovery first**: for each section, read the relevant template + scoped CSS + data sources + Figma node before proposing changes. Produce a per-element redesign plan in a table (Element | Current | Figma target | Tokens | Risk/Verdict). STOP and wait for approval before any code change.
2. **Implement after approval**: edit in surgical chunks, show diffs broken by file or by concern (not one giant blob), run `vue-tsc --noEmit` to confirm clean, do a mental verification walkthrough covering light + dark + RTL + responsive + per role where applicable.
3. **Section visual QA gate**: after implementation, STOP and wait for the user's visual QA before starting the next section. Fixes from QA happen on the same section; only proceed to the next section once the current one is signed off.
4. **Decisions presented as numbered options** (2-4 choices) with a recommended default labeled. Never make architectural decisions unilaterally — surface them.
5. **No commit, no push, ever**, unless explicitly told otherwise. The user reviews and pushes manually.
6. **Honest discovery over assertion**: when comparing Figma to code, do a true side-by-side. Don't write "Same — keep" without verifying. Surface real differences. Flag ambiguity (e.g., "is this second notification icon the landing-inquiries inbox, or something new?") and ask.
7. **Tokens stay clean**: changes to `tokens.scss` and `tailwind.config.cjs` require user safety-pass approval (grep for affected files outside the redesign scope before editing).

## Reusable Capabilities

- **`TheLineChart`** at `src/components/dashboard/TheLineChart.vue` exposes `surface: 'light' | 'dark'` + `variant: 'full' | 'minimal' | 'sparkline'` props. **API change in Section 6**: `compact: boolean` was replaced by `variant` (enum). Variants: `full` = axes + grid + legend + markers + tooltip (default); `minimal` = axes + tooltip only, no grid/legend/markers (use for mini-trends with month/scale label context); `sparkline` = pure pulse-style line, no chrome (use for ultra-minimal callouts like the Insights card). Default `variant="full"` preserves the original full-chrome behavior for bare callers.
- **`UiProgressCircle`** at `src/components/ui/UiProgressCircle.vue` (post-Section 5 refactor) is ApexCharts-backed and exposes `ringColor` / `trackColor` props for dark-surface use cases (replaces the prior `:deep()` workaround pattern). Default tone-based colors and the slot pattern are preserved — no breaking changes for existing callers.
- **`KpiMetricCard`** at `src/components/dashboard/KpiMetricCard.vue` (Section 3) — reusable KPI tile with 5 tones, label/value/icon props, dark-mode aware.
- **`SidebarUpgradeCard`** at `src/components/dashboard/SidebarUpgradeCard.vue` (Section 1) — sidebar promo card with attribute fallthrough for navigation. Single-root template constraint documented in file.

## Phase 2 — Refactor (Component Extraction + Chart Migration)

**Status: COMPLETED.**

Goals:
- Extract every dashboard section from monolithic `TeacherDashboardView.vue` (2492 lines) into self-contained components.
- Migrate all charts project-wide to ApexCharts via the `TheLineChart` wrapper.
- Retire legacy `UiChart.vue`.

### Phase 2a — Pre-extraction prep

- `src/utils/formatNumber.ts` created — shared `formatNumber` + `formatPercent` (Latin digits policy hardcoded `'en-US'`).
- `src/composables/useTeacherDashboardActions.ts` created — 10 `goTo*` navigation helpers (single `useRouter()` invocation; consumed by each component that needs navigation).
- `src/composables/useTeacherTranslations.ts` created — wraps `useI18n()` and exposes `t, te, locale, translateTeacher, translateTeacherWithParams`.
- View consumers updated to use these utilities.

### Phase 2b — Dashboard component extraction (10 components in `src/components/dashboard/`)

1. **`TeacherDashboardAlerts.vue`** — 3 conditional error alerts (profile / overview / activity) with reload helpers + 4 store re-imports. Self-contained.
2. **`TeacherDashboardGreeting.vue`** — welcome heading with `firstName` + `welcomeGreeting` computeds.
3. **`TeacherDashboardToolbar.vue`** — refresh button + `lastUpdated` relative-time label. Consumes the cross-card refresh composable.
4. **`TeacherDashboardKpiGrid.vue`** — 6 KPI cards via existing `KpiMetricCard`. Co-located: `safeOverview`, `overviewFallback`, `showMetricsSkeleton`, `paymentMethods*` computeds.
5. **`TeacherDashboardTopCourses.vue`** — 4-stat cluster + Top courses ordinal list. Co-located: 11 view-related i18n label computeds + `viewsSummarySafe`, `showViewsSkeleton`, `viewsErrorMessage`.
6. **`TeacherDashboardActivity.vue`** — timeline with sessions + assignments. Co-located: `getSessionDotTone`, `getAssignmentDotTone`, `formatActivityDateTime`, dashed-connector scoped CSS.
7. **`TeacherDashboardInsights.vue`** — dark gradient card with progress ring + sparkline. Co-located: `sparklineData`, `chartSeries`, `chartCategories`, `showMetricsSkeleton`.
8. **`TeacherDashboardAssistants.vue`** — 2 stats + 3 actions, gated by `teacherAssistantsEnabled`. Consumes the refresh composable for `assistantsRefreshing` + `refreshAssistantsSummary`.
9. **`TeacherDashboardPlanUsage.vue`** — largest component (~644 LOC). Co-located: 16 i18n label computeds (3 Section 6 orphans deleted in same diff), 7 formatters, 3 unlimited gate computeds, 3 percentage computeds, 3 remaining-text + 3 remaining-label computeds, 2 trend series + warning logic, `:deep(.ui-progress__track)` scoped CSS.
10. **`TeacherDashboardNextSteps.vue`** — `nextSteps` computed with 4-5 store deps (profile / dashboard / features / activity / assistants), 10 branches, evergreen fallback. Co-located: `pushProfileStep` helper, `NextStep` interface.

### Phase 2 architectural decision — Cross-card refresh composable

Toolbar coupling surfaced during Batch 1: `refreshAll` + `isRefreshing` + `lastUpdated` touch 5-6 stores, plus `assistantsRefreshing` is shared mutable state between Toolbar (read via `isRefreshing`) and Assistants (write via the manual refresh button).

**Resolution**: created `src/composables/useTeacherDashboardRefresh.ts` hosting:
- `isRefreshing` (aggregates 7 reactive sources)
- `lastUpdated` + `lastUpdatedLabel` (max of 5 `loadedAt` timestamps; locale-aware relative-time formatter)
- `assistantsRefreshing` ref (shared mutable state)
- `refreshAll()` (6-store fan-out)
- `refreshAssistantsSummary()` (Assistants-card retry/refresh)

Toolbar + Assistants both consume this composable. View no longer holds refresh orchestration state.

### Phase 2c — Project-wide chart migration

- **`AdminAnalytics.vue`**: 3 charts (teachers / students / revenue) migrated `UiChart` → `TheLineChart` `variant="full"` via new `AnalyticsChartCard.vue` wrapper (v-for over chart configs).
- **`StudentReports.vue`**: 2 charts (progress + engagement) migrated via the same `AnalyticsChartCard`.

### Phase 2d — UiChart retirement

- Confirmed zero remaining consumers.
- Deleted `src/components/ui/UiChart.vue`.
- **Project is 100% ApexCharts** (`TheLineChart` for line/area variants; `UiProgressCircle` for radial).

### Post-Phase-2 cleanup pass

After Phase 2 main work, a cleanup pass removed:
- Commented-out account card block (53 lines of HTML comment in `TeacherDashboardView.vue` template).
- Orphan interfaces: `QuickLink`, `SparklinePoint`, `SPARKLINE_*` constants.
- Orphan computeds: `quickLinks` (98 lines), `pageSubtitle`, `localeTag` (view-level), `dateTimeFormatter`, `formatDateTime`, `sparklineCoordinates` / `sparklinePointString` / `sparklineAreaPoints`, `isAccountActive`, `logout`.
- Orphan feature-flag computeds at the view level: `teacherReportsEnabled`, `liveSessionsEnabled` (consumed only by `quickLinks` orphan; live in each consuming component now).
- Orphan store destructures (chains from `quickLinks` deletion: `missingFields`, `profile`, `profileCompleteness`, `overview`, `upcomingAssignments`).
- Unused imports: `useRouter`, `useAuthStore`, `useTeacherDashboardActions`, `useTeacherTranslations`, `useTeacherDashboardRefresh`, `formatNumber`, `formatPercent`, `UiCard`, `UiButton`, `UiBadge`, `UiAlert`, `UiSkeleton`.

### Final LOC ledger

- **`TeacherDashboardView.vue`: 2492 → 312 lines (−87.5%)**.
- **10 dashboard components** created in `src/components/dashboard/`.
- **3 composables + 1 utility** created (Phase 2a + the refresh composable).
- **1 chart wrapper** (`AnalyticsChartCard.vue`) for shared analytics chart usage.
- **`UiChart.vue` retired**.
- **Net project**: +298 LOC (modest growth, justified by clean component separation + reusable infrastructure consumable by future student / admin dashboards).

## Course Editor Redesign Track (COMPLETED)

- **View:** `src/views/CourseEditorView.vue`
- **Sections completed:** 9 (+ Field Redistribution pass) + Tailwind migration pass + Vuetify `.border` collision project-wide fix
- **Line delta:** 3,225 → 2,548 (−677, −21%) including the Tailwind migration
- **New component:** `src/components/ui/UiCollapsibleSection.vue` (reusable standalone collapsible card primitive)
- **DS extensions:** `UiButton` gained `variant="soft"` (tonal fill) + `color="neutral"` (neutral tone) — additive, now available app-wide
- **i18n keys added:** 15 new keys × 2 locales (section headers, sidebar titles, action bar, toasts, `courseTitle`, widget keys) + 2 i18n bug fixes (`lessonDurationSystemHint` added to AR, `faq` AR corrected)

**Bugs fixed during track:**
1. Course title field mislabeled "My Courses" → new `courses.courseTitle` key
2. `courses.faq` AR was "التعليمات" → "الأسئلة الشائعة"
3. Vuetify `.border` CSS collision (project-wide, **24 occurrences fixed across 14 files** including dashboard surfaces)
4. `divide-y` dividers rendering invisible (3 dashboard surfaces fixed)
5. `--sakai-shadow-xs` + `--sakai-surface-color` undefined tokens fixed
6. `--sakai-surface-100` token undefined (4 occurrences in `AssistantsManagementView` fixed; broader pattern logged to backlog)

**Constraints honored:** No backend/store/route changes; no new/removed fields; all `form.*` bindings byte-identical throughout.

**Section breakdown:**
- Section 1: Layout shell (`ThemePage` 2-zone with `#sidebar` slot, `UiCollapsibleSection` component)
- Section 2: Top action bar (Publish + Save as draft + Cancel in `#actions` slot)
- Field Redistribution pass: re-homed fields into correct sections (structural only)
- Sections 3–8 (batched): Pricing card, Additional Settings card, Basic Info, Goals & Requirements, Visual Media, Course Content (visual restyle with DS vocabulary)
- Section 9: Cleanup (dead CSS, dead script, console.logs, commented blocks)
- Tailwind migration pass: **557 lines scoped CSS eliminated across 4 files**
- Vuetify `.border` collision fix: 24 occurrences project-wide

## Lesson + Assignment Editor Redesign Track (COMPLETED)

- **Views:** `src/views/LessonEditorView.vue`, `src/views/TeacherAssignmentEditorView.vue`, `src/components/teacher/assignments/TeacherAssignmentsDialog.vue`
- **Total line delta:** 2,124 → 1,784 (−340 across 3 components)
- **Components touched:** 3 Vue components + `en.json` + `ar.json` + `REDESIGN_BACKLOG.md`
- **Zero scoped `<style>` blocks remain** in any of the three
- **i18n keys added:** 5 (`lessonVideoSectionTitle`, `lessonAiAssistantSectionTitle`, `lessonVideoTooLong`, `editor.detailsSectionTitle`, `editor.contextSectionTitle`) — full ar/en parity

**Bugs fixed during track:**
1. `courses.lessonVideoTooLong` missing from both locales (was English-only fallback)
2. `goBack` assistant-route bug — assistants on `assistant-lesson-*` routes were bounced to teacher course route; now path-aware
3. READY video status pill visibility — previously had no banner, now surfaces as a success pill
4. RTL AI guide — physical `padding-left` → logical `ps-5`

**Batch breakdown:**
- Batch 1: Lesson layout shell + redistribution (`ThemePage` `#sidebar` + main slots, 4 `UiCollapsibleSection`s, action bar, `isDirty`)
- Batch 2: Lesson content restyle (`UiTag` status pill, DS field vocabulary, section rhythm harmonization)
- Batch 3: Lesson cleanup (scoped CSS elimination, 2 bug fixes, console cleanup, dead code removal)
- Batch 4: Assignment page redesign (single column, 3 `UiCollapsibleSection`s with cross-course gate, action bar, reorder fix to put Course & lesson FIRST in cross-course mode)
- Batch 5: `TeacherAssignmentsDialog` restyle (module-modal vocabulary, 9 scoped rules migrated)

**Course Editor patterns reused:** `ThemePage` `#actions` (Save + Cancel) & `#sidebar` slots, `UiCollapsibleSection` field grouping, `UiCard` sidebar cards, `isDirty` + `window.confirm` guard, `UiTag` soft pill for status, 350px sidebar override, route-aware navigation, module-modal `UiDialog` chrome.

## Standing Rules — Institutional Memory (active for all future work)

Established during the Course Editor + Lesson/Assignment tracks; now apply to all subsequent project work:

1. **Tailwind 3 first.** All styling via Tailwind utilities inline. Scoped `<style>` is a last resort. Use `before:`/`after:`, `[&_.deep__class]:`, arbitrary values, arbitrary properties, data-attribute variants, animations, and logical properties instead of falling back to scoped CSS.
2. **Vuetify `.border` collision avoidance.** NEVER use the bare `border` utility with a Tailwind color (e.g. `border border-border`, `border border-white/10`). Vuetify defines `.border` with `!important` color + style and silently overrides Tailwind. Use shorthand: `[border:1px_solid_TOKEN]` / `[border:1px_dashed_TOKEN]`. Directional borders (`border-t/b/s/e`) collide too — use `[border-top:1px_solid_TOKEN]` etc.
3. **Logical RTL properties.** Use `ms-/me-`, `start-/end-`, `ps-/pe-`, `inset-inline-start/end-`, `text-start/end`. Never physical left/right unless it is a visual convention anchor (e.g. notification dots).
4. **Custom breakpoints.** This project's `sm` is 600px, not Tailwind's default. Use `min-[Npx]:` / `max-[Npx]:` for arbitrary breakpoints (e.g. `min-[1025px]:`, `min-[720px]:`).
5. **Backlog discipline.** Orphans logged to `REDESIGN_BACKLOG.md`, never deleted silently. Verify before delete (the `LESSON_*_FALLBACK` constants case proved this gate matters).
6. **Hard rules from Phase 1 still apply:** no commits/pushes, color tokens only (no hardcoded hex), no Vuetify internals touched, dark mode + RTL must work for every change, no features without backing data/route.

## Currently Awaiting

**All completed redesign tracks current. Course Editor + Lesson/Assignment Editor finished. Phase 2 (Dashboard extraction) complete. No active in-flight work.**

Branch `redesign` is ready for review and manual push by the user.

Note: REMAINING Sections list above (Sections 7-10) reflects the original deferred-work scope as drafted; those sections were completed during the same session as Section 11. Implementation details live in the git history. Next surfaces (student dashboard, admin dashboard, auth pages, landing pages) follow their own tracks per the backlog.
