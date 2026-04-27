<template>
  <article
    class="picture-card"
    :class="{
      'picture-card--active': active,
      'picture-card--disabled': disabled,
      'picture-card--speaking': speaking
    }"
    role="button"
    :tabindex="disabled ? -1 : 0"
    :aria-disabled="disabled ? 'true' : 'false'"
    :aria-pressed="active ? 'true' : 'false'"
    :aria-label="ariaLabel"
    @click="handleSelect"
    @keyup.enter.prevent="handleSelect"
    @keyup.space.prevent="handleSelect"
  >
    <div class="picture-card__image" :style="{ backgroundImage: imageBackground }">
      <img :src="vocab.imagePath" :alt="imageAlt" loading="lazy" />
    </div>
    <div class="picture-card__labels">
      <strong class="picture-card__english">{{ vocab.englishWord }}</strong>
      <span class="picture-card__arabic">{{ vocab.arabicWord }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { VocabularyItemDto } from '../services/englishLabApi';

const props = withDefaults(
  defineProps<{
    vocab: VocabularyItemDto;
    active?: boolean;
    disabled?: boolean;
    category?: string;
    speakOnSelect?: boolean;
  }>(),
  {
    active: false,
    disabled: false,
    speakOnSelect: true
  }
);

const emit = defineEmits<{ select: [id: string]; spoken: [id: string] }>();

const { t } = useI18n();

const speaking = ref(false);

const ariaLabel = computed(() =>
  t('labEnglish.accessibility.vocabCard', {
    english: props.vocab.englishWord,
    arabic: props.vocab.arabicWord
  })
);

const imageAlt = computed(() =>
  t('labEnglish.accessibility.vocabImage', { word: props.vocab.englishWord })
);

const imageBackground = computed(() => `url('${props.vocab.imagePath}')`);

const isSupported = computed(
  () => typeof window !== 'undefined' && 'speechSynthesis' in window
);

const speakWord = () => {
  if (!props.speakOnSelect || !isSupported.value) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(props.vocab.englishWord);
  utterance.lang = 'en-US';
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.onstart = () => {
    speaking.value = true;
  };
  utterance.onend = () => {
    speaking.value = false;
    emit('spoken', props.vocab.id);
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

const handleSelect = () => {
  if (props.disabled) {
    return;
  }
  speakWord();
  emit('select', props.vocab.id);
};
</script>

<style scoped>
.picture-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 16px;
  background: var(--muse-surface, #ffffff);
  border: 2px solid transparent;
  box-shadow: var(--muse-shadow-sm, 0 1px 4px rgba(15, 23, 42, 0.1));
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.picture-card:focus-visible {
  outline: 2px solid var(--muse-primary, #2563eb);
  outline-offset: 4px;
}

.picture-card:hover:not(.picture-card--disabled) {
  transform: translateY(-2px);
  box-shadow: var(--muse-shadow-md, 0 4px 12px rgba(15, 23, 42, 0.12));
}

.picture-card--active {
  border-color: var(--muse-primary, #2563eb);
  box-shadow: var(--muse-shadow-md, 0 4px 12px rgba(37, 99, 235, 0.24));
}

.picture-card--speaking {
  border-color: var(--muse-success, #16a34a);
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.15);
}

.picture-card--disabled {
  cursor: not-allowed;
  opacity: 0.65;
  box-shadow: none;
}

.picture-card__image {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picture-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picture-card__labels {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.picture-card__english {
  font-size: 1.125rem;
  color: var(--muse-text, #111827);
}

.picture-card__arabic {
  font-size: 0.95rem;
  color: var(--muse-text-muted, #4b5563);
}
</style>
