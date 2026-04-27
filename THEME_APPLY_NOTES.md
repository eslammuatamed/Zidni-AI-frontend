# Sakai Theme Application Notes

## Stage 1 refresh (2025-09-21)
- Completed the Stage 1 audit (see `ui-ux-change-plan.md`) cataloguing the remaining teacher/admin/public views that still rely on Vuetify/Argon markup.
- Logged the adapter backlog required for Stage 2 (`UiAccordion`, `UiTag`, `UiList`, segmented controls, progress/avatars/skeletons, file upload, radio/slider inputs, toast bridge, and table/form enhancements).
- Expanded `style-files/assets.json` to cover the full Sakai icon catalog, landing illustrations, and additional Lato/Inter font weights ahead of the marketing refresh.

## Views updated in this pass
- `HomeView.vue` &rarr; hero, feature grid, featured courses, and CTA now draw colors, shadows, and spacing from the Sakai token set.
- `StudentDashboardView.vue` &rarr; dashboard analytics, tables, and forms migrated to Sakai tokens and gradients.
- `TeacherDashboardView.vue` &rarr; sparkline and dashboard layout refreshed to the new palette.
- `TeacherAssessmentsView.vue` &rarr; assessments table and dialogs rebuilt with `ThemePage`, `UiTable`, and form adapters.

- `AssessmentBuilderView.vue` &rarr; builder workspace redesigned with `ThemePage`, `UiCard`, drag-and-drop question tiles, Sakai form inputs, and UiDialog-powered attempt overrides.
- `AssessmentPlayerView.vue` &rarr; student player now uses `ThemePage`, tokenized progress display, UiTextarea inputs, and UiDialog results without Vuetify widgets.
- `CourseListView.vue` &rarr; teacher course catalog now renders grid-based `UiCard` tiles, loading skeletons, and an empty state using Sakai spacing tokens.
- `StudentAssessmentsView.vue` &rarr; student-facing assessments table, last attempt alert, and refresh actions themed with `ThemePage`, `UiTable`, and tokenized badges.
- `StudentLearningView.vue` &rarr; learning workspace rebuilt with `ThemePage`, `UiTabs`, `UiCard` sections, and Ui form adapters covering progress, assignments, discussions, and resources.
- `StudentAchievementsView.vue` &rarr; certificate timeline, leaderboard, and badge showcase now render with themed UiCard layouts, UiTabs period filters, and UiTable styling.
- `StudentLiveSessionsView.vue` &rarr; upcoming and past live session cards leverage UiCard grids, UiAlert feedback, and UiButton link handling consistent with the Sakai tokens.

 - **Stage 2 – Step 2 (teacher/admin retheme)**
 
  - `CourseEditorView.vue` → module/lesson accordions, dialogs, and resource lists rebuilt with `ThemePage`, `UiAccordion`, `UiDialog`, `UiSelect`, and `UiTag` plus tokenized state styling.
  - `TeacherDashboardView.vue` → instructor KPIs, progress rings, avatars, and quick actions migrated to `UiProgressCircle`, `UiAvatar`, and Sakai layout utilities.
  - `TeacherEnrollmentsView.vue` → enrollment and payments data tables now use `UiTable`, `UiSegmentedControl`, `UiProgressBar`, and themed bulk-action toolbars.
  - `TeacherLearningView.vue` → grading tabs, dialogs, and resource management adopt `UiTabs`, `UiCard`, `UiDialog`, `UiSelect`, `UiTable`, and toast-driven feedback.
  - `TeacherLiveSessionsView.vue` → live session scheduler, status badges, and attendance tables converted to `UiTable`, `UiCard`, `UiDialog`, and `UiTag` patterns.
  - `TeacherTutoringView.vue` → availability/sessions/payments flows rewritten with `UiTable`, `UiDialog`, `UiSlider`, `UiRadioGroup`, and `useToast` notifications.
  - `TeacherOffersView.vue` → offers grid and pricing dialogs leverage `UiCard`, `UiTable`, `UiSelect`, and tokenized number inputs.
  - `TeacherQuestionBanksView.vue` → bank accordion, option editors, and tagging rely on `UiAccordion`, `UiCheckbox`, `UiCard`, and dialog adapters.
  - `TeacherReportsView.vue` → report generator/history now themed with `UiCard`, `UiTable`, `UiSelect`, and status tags.
 - `TeacherNotificationsView.vue` → broadcast composer and inbox adopt `UiCard`, `UiTextarea`, `UiSelect`, and tag badges for delivery states.
 
- `TeacherLandingContentView.vue` → marketing content manager rebuilt on `UiCard` stacks, `UiInput`/`UiTextarea` controls, and inline themed actions.
- `PlatformAdminConsoleView.vue` → admin console sidebar, teacher lifecycle forms, domain/backups panels, and overview metrics migrated to `ThemePage`, `UiCard`, `UiInput`, `UiSelect`, `UiTag`, and sticky layout utilities.

- **Stage 2 – Step 3 (public marketing retheme)**
  - `PublicLandingView.vue` → loading states now use `UiSkeleton` placeholders and the landing renderer is constrained to the Sakai container width while delegating to themed section components.
  - `PublicCourseDetailView.vue` → hero, teacher spotlight, and curriculum migrated to gradient-backed Sakai layouts with `UiTag` badges, `UiAvatar`, skeleton loading, and `UiAccordion` lesson disclosure.
  - Landing sections under `src/components/landing/sections/*` → hero, features, courses, offers, testimonials, FAQ, and CTA sections rebuilt with gradient tokens, `UiButton`, `UiTag`, `UiAccordion`, and grid utilities in place of Vuetify widgets.
 
- **Stage 3 – Polish & QA**
  - `StudentTutoringView.vue` → migrated the student booking, payment, and review workflows to `UiCard`, `UiTable`, `UiDialog`, `UiFileUpload`, and `UiSlider` patterns with toast-driven feedback, skeleton loading, and responsive two-column layouts.
  - `StudentNotificationsView.vue` → replaced Vuetify lists with themed `UiCard`, `UiList`, and `UiTag` chips, added loading skeletons, and wired toast error handling for refresh/mark-read actions.
  - Introduced `UiList.vue`/`UiListItem.vue` adapters so notification and future activity feeds share the Sakai spacing, dividers, and density controls.

 
- Auth surfaces (`StudentLoginView.vue`, `StudentRegisterView.vue`, `StudentVerifyView.vue`, `TeacherLoginView.vue`, `PlatformAdminLoginView.vue`) share the new global `.auth-*` styles defined in `src/styles/main.scss`.

## Theme primitives
- Global theme entry point: `src/theme/sakai/index.scss` (tokens, base reset, layout scaffolding, utilities).
- App-level helpers: `src/styles/main.scss` now re-exports Sakai-friendly utilities for auth layouts and dashboard grids.
- Layout wrappers: `src/layout/theme/ThemeAppShell.vue`, `src/layout/theme/ThemePage.vue`.

## UI adapters
Registered in `src/main.ts` (global components) and authored under `src/components/ui/`:
 - `UiButton`, `UiCard`, `UiAlert`, `UiBadge`, `UiStatCard`, `UiTable`, `UiInput`, `UiTextarea`, `UiSelect`, `UiSwitch`, `UiTabs`, `UiDialog`, `UiToast`, `UiIcon`, `UiChart`.

 - Adapter foundation extended in Stage 2 / Step 1 with:
 
  - **Containers**: `UiAccordion`, `UiSegmentedControl`, `UiToastHost`.
  - **Display**: `UiTag`, `UiAvatar`, `UiSkeleton`, `UiProgressBar`, `UiProgressCircle`.
  - **Inputs**: `UiFileUpload`, `UiRadioGroup`, `UiSlider`, upgraded `UiTable`, `UiInput`, and `UiSelect` date/time affordances.
  - **Feedback**: new `useToast` composable powering multi-toast queues with Sakai tokens.

 - Additional adapters in Stage 2 / Step 2:
  - **Inputs**: `UiCheckbox` supporting teacher question bank multi-answer workflows.
- Stage 3 adds the **List** primitives: `UiList` and `UiListItem` for notification feeds, settings panels, and marketing bullet lists.
 
- Adapters wrap Vuetify/inline markup with Sakai-compliant classes, gradients, and spacing.

## PrimeVue shims
Local stubs located in `src/vendor/primevue/` mirror the APIs for future package drops (buttons, dialogs, tables, dropdowns, etc.).
Step 1 now includes shims for accordion, avatar, skeleton, progress, slider, radio, file upload, and toast services so PrimeVue imports remain drop-in compatible.
The icon sprite placeholder lives at `src/vendor/primeicons/primeicons.css`.

## Vite / TS path aliases
Declared in both `vite.config.ts` and `tsconfig.json`:
- `'primevue/*'` &rarr; `'@/vendor/primevue/*'`
- `'primeicons/*'` &rarr; `'@/vendor/primeicons/*'`

## Asset manifest
`style-files/assets.json` now exposes `fonts`, `images`, and `misc` arrays that list every required font (Lato/Inter), theme icon placeholder, and landing illustration. Create the matching directories under `style-files/` and drop the assets before shipping the themed build.

## Post-install checklist (manual)
1. Copy the assets referenced in `style-files/assets.json` into the project prior to deployment.
2. When registry access returns, install upstream packages and remove the local shims:
   ```bash
   pnpm add primevue primeicons primeflex @primeuix/themes
   ```
   Afterwards, drop the `'primevue/*'` alias so imports resolve to the real package.
3. Re-run `pnpm build` / QA flows to validate integration once dependencies are available.
