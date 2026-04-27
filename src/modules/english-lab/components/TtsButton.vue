<template>
  <button
    class="tts-button"
    type="button"
    :aria-label="ariaLabel"
    :title="tooltip"
    :disabled="!isSupported"
    @click="handleClick"
  >
    <slot>{{ defaultLabel }}</slot>
  </button>
  <p v-if="!isSupported" class="tts-button__notice" role="status">
    {{ unsupportedMessage }}
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    text: string;
    ariaLabelKey?: string;
    voiceLang?: string;
    rate?: number;
    pitch?: number;
  }>(),
  {
    voiceLang: 'en-US',
    rate: 1,
    pitch: 1
  }
);

const emit = defineEmits<{ spoken: [] }>();

const { t } = useI18n();

const isSupported = computed(() => typeof window !== 'undefined' && 'speechSynthesis' in window);

const defaultLabel = computed(() => t('labEnglish.buttons.speak'));
const ariaLabel = computed(() => t(props.ariaLabelKey || 'labEnglish.accessibility.speakWord'));
const unsupportedMessage = computed(() => t('labEnglish.tooltips.ttsUnsupported'));
const tooltip = computed(() => (isSupported.value ? ariaLabel.value : unsupportedMessage.value));

const handleClick = () => {
  if (!isSupported.value) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(props.text);
  utterance.lang = props.voiceLang;
  utterance.rate = props.rate;
  utterance.pitch = props.pitch;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  emit('spoken');
};
</script>

<style scoped>
.tts-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--muse-border, #dfe3e6);
  background: var(--muse-surface, #fff);
  color: var(--muse-text, #2d2d2d);
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.tts-button:focus-visible {
  outline: 2px solid var(--muse-primary, #2563eb);
  outline-offset: 2px;
}

.tts-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.tts-button:hover:not(:disabled) {
  background: var(--muse-surface-raised, #f7f9fc);
  box-shadow: var(--muse-shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.1));
}

.tts-button__notice {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--muse-text-muted, #6b7280);
}
</style>
