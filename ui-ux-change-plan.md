# UI/UX Change Plan

## Stage 1 – Audit & Preparation (2025-09-21)
- Reviewed every surface under `src/views/**` and marketing partials to catalogue remaining Vuetify/Argon usage.
- Logged the migration scope per screen and mapped the adapters/utilities needed to finish the Sakai rollout.
- Refreshed the asset manifest so the creative team can stage icons, fonts, and landing illustrations ahead of implementation.

### View audit – pending re-theme (Stage 2 focus)
| Surface | Current theme usage | Primary gaps / required work | Stage |
| --- | --- | --- | --- |
 | `StudentTutoringView.vue` | Mirrors teacher tutoring UX with Vuetify widgets. | Apply the same tutoring adapters (`UiTable`, `UiDialog`, `UiToast`, `UiFileUpload`, status chips) and align typography/spacing with tokens. | Stage 3 ✅ |
| `StudentNotificationsView.vue` | Notification feed still uses Vuetify card/list/chip stack. | Introduce a compact `UiCard` + `UiList` layout with `UiTag` badges and themed action buttons. | Stage 3 ✅ |

 
### View audit – previously themed surfaces (Stage 3 polish)
| Surface | Current theme usage | Stage 3 focus |
| --- | --- | --- |
| `AssessmentBuilderView.vue` | Builder workspace already migrated to `UiCard`, `UiTabs`, `UiDialog`. | Verify drag/drop affordances against Sakai spacing and RTL handling. |
| `AssessmentPlayerView.vue` | Player leverages Ui form controls and dialogs. | Validate typography scale and progress indicators across breakpoints. |
| `CourseListView.vue` | Course catalog uses themed cards, skeletons, and empty states. | Confirm hover/selection states and teacher filters in RTL/mobile. |
| `HomeView.vue` | Marketing hero + feature grid use Sakai utilities. | Finalize hero illustration swap once assets land and tighten copy spacing. |
| `PlatformAdminLoginView.vue` | Auth surface already on shared auth shell + Ui inputs. | QA backgrounds + gradient overlays after asset refresh. |
| `StudentAchievementsView.vue` | Tabs/cards/tables ported to Ui components. | Audit badge gradients and timeline spacing on tablet. |
| `StudentAssessmentsView.vue` | Assessment list built with `UiTable` + themed alerts. | Ensure pagination + empty states meet contrast requirements. |
| `StudentDashboardView.vue` | Dashboard uses ThemePage, Ui cards, and toast utilities. | Validate skeleton-to-loaded transitions and quick action icons. |
| `StudentLearningView.vue` | Workspace rebuilt with `UiTabs`, `UiCard`, `UiTable`. | Review long content scrolling + sticky headers for responsiveness. |
| `StudentLiveSessionsView.vue` | Upcoming/past sessions render via Ui cards + alerts. | Confirm timezone badges + CTA buttons on small screens. |
| `StudentLoginView.vue` | Shared auth shell + Ui inputs already themed. | Update hero artwork per new asset set when available. |
| `StudentRegisterView.vue` | Uses Ui inputs/selects + auth shell. | Accessibility review for helper text and error messaging. |
| `StudentVerifyView.vue` | Themed verification flow with Ui inputs + badges. | Validate OTP spacing and timer alignment on mobile. |
| `TeacherAssessmentsView.vue` | Listing + dialogs already on Ui adapters. | Light regression sweep once shared adapters evolve. |

### Component & utility backlog
 - _(Complete)_ **UiList + UiListItem** abstraction now powers notification feeds and future list surfaces.

### Layout and theming support
 
- Extend `ThemePage` with full-width/hero variants for public marketing pages and add section spacing utilities mirroring the Sakai landing reference.
- Introduce marketing grid/stack helpers (e.g., `theme-landing__grid`, `theme-landing__pillars`) to keep landing sections consistent without Vuetify rows/cols.
- Provide tokenized gradient/background helpers so landing heroes and dashboard stats consume the new asset set cleanly.

### Asset preparation
- `style-files/assets.json` now enumerates the full icon catalog, landing illustrations, and Lato/Inter font weights required by the Sakai theme.
- Creative can pre-stage files under `style-files/theme-icons/`, `style-files/illustrations/landing/`, and `style-files/fonts/**` prior to the Stage 2 implementation.

## Completed Tasks
- Vendored the Sakai theme foundation (tokens, mixins, utilities) and wired the global stylesheet plus the ThemeAppShell/ThemePage layout wrappers into the SPA entry point.
- Established the offline UI adapter layer (`UiButton`, `UiInput`, `UiSelect`, `UiTable`, `UiCard`, `UiDialog`, `UiTabs`, `UiToast`, `UiIcon`, `UiChart`, etc.) alongside PrimeVue shims and registered them globally.
- Rebuilt the student-facing experience—dashboards, assessments, learning workspace, achievements, and live sessions—around ThemePage sections and UiCard/UiTable/UiTabs patterns.
- Rethemed assessment creation and delivery flows (`AssessmentBuilderView.vue`, `AssessmentPlayerView.vue`, `TeacherAssessmentsView.vue`, `StudentAssessmentsView.vue`) with Sakai form adapters, dialogs, and progress styling.
- Completed Stage 2 – Step 2 by retheming the full teacher/admin suite (`CourseEditorView.vue`, `TeacherDashboardView.vue`, `TeacherEnrollmentsView.vue`, `TeacherLearningView.vue`, `TeacherLiveSessionsView.vue`, `TeacherTutoringView.vue`, `TeacherOffersView.vue`, `TeacherQuestionBanksView.vue`, `TeacherReportsView.vue`, `TeacherNotificationsView.vue`, `TeacherLandingContentView.vue`, `PlatformAdminConsoleView.vue`) onto `ThemePage`, Sakai Ui adapters, and the new `UiCheckbox` input.
 - Completed Stage 2 – Step 3 by rebuilding `PublicLandingView.vue`, `PublicCourseDetailView.vue`, and the marketing landing sections around Sakai gradients, `UiSkeleton` loading states, `UiTag` badges, `UiAccordion` lesson disclosure, and containerized layouts.
 
- Documented coverage in `THEME_APPLY_NOTES.md` and outlined required assets within `style-files/assets.json`.

### Stage 2 – Step 1 (adapter foundation)
- Delivered new adapters: `UiAccordion`, `UiSegmentedControl`, `UiTag`, `UiProgressBar`, `UiProgressCircle`, `UiAvatar`, `UiSkeleton`, `UiFileUpload`, `UiRadioGroup`, and `UiSlider`.
- Upgraded existing inputs/tables (`UiInput`, `UiSelect`, `UiTable`) with date/time affordances, loading overlays, and enhanced density controls.
- Added `UiToastHost` + `useToast` composable for centralized Sakai toast queues and wired the host into `App.vue`.
- Expanded PrimeVue shim layer with exports for accordion, avatar, skeleton, progress, slider, radio, and file upload to mirror upstream APIs.
 
## Stage 3 – Polish & QA (2025-09-22)
- Rethemed the remaining student surfaces (`StudentTutoringView.vue`, `StudentNotificationsView.vue`) to use the Sakai layouts, adapters, and toast system.
- Added loading skeletons, responsive layouts, and toast/error handling to the student tutoring, payments, and notification flows.
- Delivered the reusable `UiList` / `UiListItem` adapters for notification feeds, replacing the last Vuetify lists.

## Upcoming Stages
- Final asset swaps once creative delivers the Sakai illustrations/fonts listed in `style-files/assets.json`.
- Regression QA across auth, dashboard, and marketing flows after installing upstream PrimeVue packages.
 
