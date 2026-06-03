# Home Page Redesign — Migration Notes

> Scope: platform marketing home (`/` on the platform host and `/landing`), redesigned
> from Figma file `Zidni-AI` node `45:13` (June 2026). Branch: `redesign`.

## 1. Architecture

`src/views/landing/LandingHome.vue` went from a 1,805-line monolith (template + canvas
animation + inquiry form + scoped styles) to a ~70-line composition shell. All sections
live in `src/views/landing/sections/`:

| Component               | Figma node | Anchor id                                                                         |
| ----------------------- | ---------- | --------------------------------------------------------------------------------- |
| `HomeNavBar.vue`        | 35:1513    | — (sticky header)                                                                 |
| `HomeHero.vue`          | 35:1391    | `#home`                                                                           |
| `HomePersonaCards.vue`  | 35:1125    | `#solutions`                                                                      |
| `HomeFormatsGrid.vue`   | 231:1402   | `#formats`                                                                        |
| `HomeWhyZidni.vue`      | 265:255    | `#why`                                                                            |
| `HomeAiFeatures.vue`    | 267:411    | `#ai`                                                                             |
| `HomeVisualFlow.vue`    | 35:1228    | `#flow`                                                                           |
| `HomeRegionalReach.vue` | 269:560    | `#reach`                                                                          |
| `HomeFinalCta.vue`      | 35:1499    | `#cta`                                                                            |
| `HomeTestimonials.vue`  | 35:1270    | `#testimonials`                                                                   |
| `HomeIntegrations.vue`  | 35:1162    | `#integrations`                                                                   |
| `HomeNewsletter.vue`    | 360:2190   | `#newsletter`                                                                     |
| `HomeFooter.vue`        | 35:1336    | —                                                                                 |
| `useRegistrationCta.ts` | —          | shared CTA composable (WhatsApp registration link with `/teacher/login` fallback) |

⚠️ Do **not** confuse with `src/views/landing/components/` — those are the _tenant_
landing sections consumed by `LandingSectionResolver`/`LandingRenderer` and were left
untouched on purpose.

`src/layout/LandingLayout.vue`: `isHomeRoute` now also covers the `landing` route name,
fixing the pre-existing **double header/footer** on `/landing` (the page renders its own
`HomeNavBar`/`HomeFooter`). The layout (still Nabta-branded, legacy CSS) now only
chromes the legal pages — see §5.

## 2. New static sections that need dynamic data / backend APIs

| Section                           | What's static                                                                | API needed                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HomeTestimonials`                | All 3 cards (names, quotes, metrics, avatars) from i18n + bundled images     | **Platform-level** testimonials API with `author`, `roleBadge`, `metric`, `metricLabel`, `avatarUrl`. The existing `landingContent` store (`/v1/teacher/landing/content/testimonials`) is **teacher/tenant-scoped** and unsuitable for the platform page; its `TestimonialResponse` also lacks role/metric/avatar fields. |
| `HomeNewsletter`                  | Whole form; submit shows an informational toast only                         | Newsletter subscription endpoint (email + locale). Consider reusing `landingInquiries` infra or a dedicated `/v1/platform/newsletter` route.                                                                                                                                                                              |
| `HomePersonaCards`                | All three CTAs share the registration WhatsApp link                          | Per-persona onboarding flows/routes if product wants distinct funnels.                                                                                                                                                                                                                                                    |
| `HomeRegionalReach`               | Country chip list hard-coded                                                 | Optional: countries list from config if it should vary.                                                                                                                                                                                                                                                                   |
| `HomeIntegrations`                | Logo wall (4 logos bundled)                                                  | Optional CMS list if integrations will grow.                                                                                                                                                                                                                                                                              |
| Nav links `Pricing` / `Resources` | Placeholder `#pricing` / `#resources` anchors (no such sections/pages exist) | Pricing page & resources/blog hub. Same applies to footer links: Pricing, Documentation, Case Studies, Community, About Us, Careers (all `#`). Footer social buttons have no destinations specified in the design (`#`).                                                                                                  |
| Hero "Watch Demo"                 | Links to `#flow` (How-it-works) as interim target                            | Demo video asset/modal.                                                                                                                                                                                                                                                                                                   |
| Final CTA "Book a Strategy Call"  | WhatsApp link with a strategy-call message                                   | Calendly/booking integration if desired.                                                                                                                                                                                                                                                                                  |

## 3. SASS/CSS → Tailwind migration log

- **`LandingHome.vue`**: scoped `<style>` block (line 1078+) deleted; template fully
  rebuilt with inline Tailwind utilities (token classes: `text-sakai-primary`,
  `text-sakai-accent`, `text-content-secondary`, `rounded-pill`, etc.; arbitrary values
  for one-off Figma colors; `[border:…]` arbitrary-property shorthand per the
  Vuetify `.border` collision rule).
- **`src/styles/landing-tailwind.css`**: deleted (7 lines; only set a base font that the
  sakai token font stack already provides; only importer was `LandingHome.vue`).
- **Removed from the page** (existed in old design, absent from new Figma): star-canvas
  hero animation, floating CTA pill, on-page contact/inquiry form
  (`submitLandingInquiry` + phone country codes). The `landingInquiries`
  service/store remain in the codebase for future use.
- **Old i18n namespace `landing.zidniLanding.*`** is no longer referenced by
  `LandingHome` — candidate for cleanup after confirming no other consumers
  (`TeacherLandingView` etc. use different namespaces). New copy lives under
  `landing.home.*` in `src/locales/landing.{en,ar}.json` (CRLF + BOM of `ar.json`
  preserved). **Arabic strings are first-draft translations — need native review.**
- **NOT yet migrated**: `LandingLayout.vue` legacy CSS imports
  (`@/styles/landing/{variables,layout,sections,rtl}.css`) stay because the legal pages
  (`/privacy`, `/terms`, `/support`) and `LegalPage.vue` still style off them. Migrate
  those pages in a follow-up batch, then delete the four CSS files.

## 4. Assets (`src/assets/landing/`)

All raster assets exported from Figma and converted to **WebP** (q≈82, Pillow); icons
kept as **SVG**. Largest file is 88 KB (hero mockup, from a 680 KB PNG).

`hero-dashboard-mockup.webp`, `format-{online-courses,coaching,digital-downloads,memberships}.webp`,
`why-{modern-learner,instructor,analytics,dynamic-ui}.webp`, `ai-{course-builder,quiz-generator,smart-assistant}.webp`,
`flow-step-{create,publish,earn}.webp`, `testimonial-avatar-{1,2,3}.webp`, `newsletter-bg.webp`,
`cta-pattern.png` (67×100 tile, 4 KB), `icon-*.svg` (personas, send-square, AI cards, verified,
newsletter mail/send, footer socials), `logo-{chatgpt,notion,zapier,slack}.svg`.

Nav globe/profile icons and the hamburger are **inline SVGs** (need `currentColor`).

## 5. Design inconsistencies & open questions (from Figma audit)

1. **Brand mismatch**: design navbar/footer use a two-tone text logo `zidni Ai`
   (`#06b6d4` + `#1e3a8a`); implemented as text. `LandingLayout` (legal pages) still says
   **"Nabta"** — rebrand pending. The cyan `#06b6d4` has **no Tailwind/sakai token**
   (`--brand-accent` was overridden to blue) — used as arbitrary value.
2. **Fonts**: design mixes Plus Jakarta Sans (headings), Inter (body), and Manrope
   (AI cards). Project base font token (`--sakai-font-family-base`) is Plus Jakarta Sans —
   implemented everything on the token stack; Inter/Manrope **not** added (deliberate).
3. **Figma placeholder content**: all four "Teach in every way" cards were titled
   "Online Courses" with identical descriptions in earlier nodes (fixed per visible
   labels: Coaching, Digital Downloads, Memberships); testimonials 1 & 2 share the same
   quote (kept as-is, flagged for marketing); "Why Choose" bullet text is cut off in
   Figma ("completion c…") — completed as "completion certificates".
4. **Heading-color drift**: section headings alternate `#1b2fac`, `#673de7`, `#1e3a8a`,
   `#0b1c30`, `#191c1d`, `#1d3989` with near-duplicate navies — reproduced faithfully,
   but the design team may want to consolidate.
5. **Dev-mode gaps**: nav center links were unlabeled "Text" layers (resolved from
   rendered text: Home / Solutions / Pricing / Resources); footer `© 2024` hard-coded in
   design — implemented as dynamic year.
6. Floating country chips use **emoji flags** (render varies by OS; Windows shows
   letter codes). Consider SVG flag assets if pixel-fidelity matters.
7. The old page's **contact form** (with its `landing.zidniLanding.contact.*` copy and
   WhatsApp fallback) has no equivalent in the new design — confirm marketing accepts
   WhatsApp-only contact via "Get In Touch".

## 6. Verification

- `npx vite build` ✅ (17.6s)
- `vue-tsc --noEmit`: **0 errors** in all touched files (project-wide pre-existing
  errors in `content.adapter.ts`, `plugins/i18n.ts`, store specs are unrelated/untouched).
- RTL: all section components use logical utilities (`ps-/pe-/ms-/me-/start-/end-`,
  `rounded-se/es`); page sets `dir` on root + `documentElement` from locale.
- Responsive: mobile-first; grids collapse 4→2→1 / 3→1; nav has a hamburger menu below
  `md`; flow zigzag stacks below `lg`.
