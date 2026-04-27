# Zidni AI English Lab (SPA)

This module provides the Vue 3 implementation for the Zidni AI English Lab experience. It offers category browsing, vocabulary grids with bilingual labels, listen-and-choose quizzes, and lightweight progress tracking.

## Structure

```
src/modules/english-lab/
  components/
  pages/
  services/
  store/
```

The module relies on the core app shell for theming, routing guards, and feature flag resolution.

## Usage

1. Ensure the backend `/api/lab/english` endpoints are available and the `englishLab` feature flags are enabled for your tenant.
2. Mount the app and navigate to `/english-lab`.
3. Provide media assets under `public/assets/english-lab/images/...` (see notes below).

## Placeholder Media

Vocabulary rows reference placeholder image paths such as `/assets/english-lab/images/animals/elephant.jpg`. When real media is ready, drop them into `public/assets/english-lab/images/<category>/`.

Suggested filenames:

- Animals: `elephant.jpg`, `lion.jpg`, `camel.jpg`, `panda.jpg`
- Fruits: `apple.jpg`, `banana.jpg`, `orange.jpg`, `mango.jpg`
- Actions: `run.jpg`, `jump.jpg`, `write.jpg`, `listen.jpg`

## Components

- `PictureCard.vue` – image tile with bilingual labels and click-to-speak behaviour.
- `CategorySelector.vue` – pill-style selector with keyboard support.
- `ProgressBadge.vue` – shows mastered counts and completion percentages.
- `VocabGrid.vue` – responsive grid layout for vocabulary cards.
- `QuizListenChoose.vue` – listen-and-choose quiz implementation.
- `TtsButton.vue` – wrapper for browser speech synthesis support messaging.

## Pages

- `EnglishLabHome.vue`
- `CategoryPage.vue`
- `QuizPage.vue`

Each page is feature-aware and will surface upsell messaging when the tenant lacks access.

## Tests

Vitest component specs live alongside their components under `components/__tests__`.

## Screenshots

_Add screenshots here once media assets are available._
