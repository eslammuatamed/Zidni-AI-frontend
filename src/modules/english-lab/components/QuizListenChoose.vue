<template>
  <section class="quiz" v-if="items.length">
    <header class="quiz__header">
      <div>
        <h2 class="quiz__title">{{ t('labEnglish.quiz.listenChoose.title') }}</h2>
        <p class="quiz__subtitle">{{ t('labEnglish.quiz.listenChoose.subtitle') }}</p>
      </div>
      <div class="quiz__score" role="status">
        {{ t('labEnglish.quiz.score', { current: score, total: items.length }) }}
      </div>
    </header>

    <div v-if="!isComplete && currentItem" class="quiz__content">
      <div class="quiz__prompt">
        <TtsButton :text="currentItem.englishWord" @spoken="onSpoken" />
        <button class="quiz__replay" type="button" @click="speakPrompt">
          {{ t('labEnglish.buttons.replay') }}
        </button>
      </div>

      <div class="quiz__grid" role="group" :aria-label="t('labEnglish.quiz.listenChoose.options')">
        <button
          v-for="option in currentItem.options"
          :key="option.id"
          type="button"
          class="quiz__option"
          :class="optionClass(option.id)"
          :disabled="isChecking"
          @click="selectOption(option.id)"
        >
          <span class="sr-only">
            {{ t('labEnglish.accessibility.quizOption', { word: option.englishWord }) }}
          </span>
          <img :src="option.imagePath" :alt="option.englishWord" loading="lazy" />
        </button>
      </div>

      <p v-if="feedback" class="quiz__feedback" role="alert">{{ feedback }}</p>
    </div>

    <div v-else class="quiz__results">
      <h3>{{ t('labEnglish.quiz.listenChoose.completeTitle') }}</h3>
      <p>{{ t('labEnglish.quiz.listenChoose.completeSubtitle', { score: score, total: items.length }) }}</p>
      <button type="button" class="quiz__retry" @click="restart">
        {{ t('labEnglish.buttons.retry') }}
      </button>
    </div>
  </section>

  <p v-else class="quiz__empty">{{ t('labEnglish.quiz.listenChoose.empty') }}</p>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TtsButton from './TtsButton.vue';
import type { QuizItemDto } from '../services/englishLabApi';

const props = defineProps<{
  items: QuizItemDto[];
}>();

const emit = defineEmits<{ answered: [payload: { vocabId: string; correct: boolean }]; complete: [] }>();

const { t } = useI18n();

const index = ref(0);
const score = ref(0);
const isChecking = ref(false);
const lastSelection = ref<string | null>(null);
const feedback = ref('');

const items = computed(() => props.items ?? []);
const currentItem = computed(() => items.value[index.value]);
const isComplete = computed(() => index.value >= items.value.length);

const optionClass = (id: string) => {
  if (lastSelection.value !== id) {
    return {};
  }
  const correct = id === currentItem.value?.vocabId;
  return {
    'quiz__option--correct': correct,
    'quiz__option--incorrect': !correct
  };
};

const clearFeedback = () => {
  feedback.value = '';
  lastSelection.value = null;
};

const next = () => {
  if (index.value < items.value.length - 1) {
    index.value += 1;
    clearFeedback();
    isChecking.value = false;
  } else {
    index.value = items.value.length;
    isChecking.value = false;
    emit('complete');
  }
};

const selectOption = (optionId: string) => {
  if (isChecking.value || !currentItem.value) {
    return;
  }
  isChecking.value = true;
  lastSelection.value = optionId;
  const isCorrect = optionId === currentItem.value.vocabId;
  if (isCorrect) {
    score.value += 1;
    feedback.value = t('labEnglish.quiz.listenChoose.correct');
  } else {
    feedback.value = t('labEnglish.quiz.listenChoose.incorrect', {
      answer: currentItem.value.englishWord
    });
  }
  emit('answered', { vocabId: currentItem.value.vocabId, correct: isCorrect });
  setTimeout(() => {
    next();
  }, 1200);
};

const restart = () => {
  index.value = 0;
  score.value = 0;
  clearFeedback();
  isChecking.value = false;
};

const speakPrompt = () => {
  if (!currentItem.value) return;
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  if (!supported) return;
  const utterance = new SpeechSynthesisUtterance(currentItem.value.englishWord);
  utterance.lang = 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

const onSpoken = () => {};

onMounted(() => {
  if (currentItem.value) {
    setTimeout(() => speakPrompt(), 300);
  }
});

watch(index, () => {
  if (currentItem.value) {
    setTimeout(() => speakPrompt(), 300);
  }
});

watch(
  () => props.items,
  () => {
    restart();
  }
);
</script>

<style scoped>
.quiz {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.quiz__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.quiz__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.quiz__subtitle {
  margin: 0.25rem 0 0;
  color: var(--muse-text-muted, #475569);
}

.quiz__score {
  font-weight: 600;
  color: var(--muse-primary, #2563eb);
}

.quiz__prompt {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quiz__replay {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--muse-border, #d1d5db);
  background: var(--muse-surface, #fff);
  cursor: pointer;
}

.quiz__grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.quiz__option {
  position: relative;
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 0;
  background: var(--muse-surface, #fff);
  box-shadow: var(--muse-shadow-sm, 0 2px 8px rgba(15, 23, 42, 0.1));
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.quiz__option img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.quiz__option:hover:not(:disabled),
.quiz__option:focus-visible {
  transform: translateY(-2px);
  box-shadow: var(--muse-shadow-md, 0 6px 16px rgba(15, 23, 42, 0.16));
  outline: none;
}

.quiz__option--correct {
  border-color: var(--muse-success, #16a34a);
}

.quiz__option--incorrect {
  border-color: var(--muse-danger, #dc2626);
  opacity: 0.85;
}

.quiz__feedback {
  font-weight: 600;
  color: var(--muse-primary, #2563eb);
}

.quiz__footer {
  display: flex;
  justify-content: center;
}

.quiz__retry {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: var(--muse-primary, #2563eb);
  color: #fff;
  border: none;
  cursor: pointer;
}

.quiz__empty {
  text-align: center;
  color: var(--muse-text-muted, #64748b);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
