# Argon Theme Notes

The SPA now ships with an Argon-inspired visual system layered on top of Vuetify.
Use the following entry points when updating the look and feel:

- `src/styles/argon.css` – defines CSS variables for the Argon palette, radii, shadows and small utility helpers.
- `src/styles/argon-overrides.scss` – global Vuetify overrides for cards, buttons, inputs, tables, alerts, tabs and navigation chrome.
- `src/styles/main.scss` – imports the theme assets and exposes layout utilities that the new components rely on.
- `src/plugins/vuetify.ts` – registers the Argon color tokens and component defaults with Vuetify.
- `src/layouts/ArgonShell.vue` – application shell composed of the Argon sidebar and topbar components.
- `src/components/nav/ArgonSidebar.vue` / `src/components/nav/ArgonTopbar.vue` – reusable navigation elements that handle responsive behaviour.
- `src/components/Argon*.vue` – shared UI primitives (cards, buttons, badges, alerts, tables, stat cards) that follow the dashboard style.

When extending the theme stick to the CSS variables defined in `argon.css` so tenant branding changes continue to work.
Each override is RTL-aware; ensure any new surface respects `document.documentElement.dir`.
