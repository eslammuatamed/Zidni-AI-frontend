<template>
  <transition name="ui-toast">
    <div v-if="visible" class="ui-toast" :class="toastClasses">
      <UiIcon :name="icon" :size="18" />
      <div class="ui-toast__content">
        <strong v-if="title">{{ title }}</strong>
        <slot>{{ message }}</slot>
      </div>
      <button v-if="closable" class="ui-toast__close" type="button" @click="$emit('close')">
        <UiIcon name="CloseOutlined" :size="16" />
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiIcon from './UiIcon.vue';

type UiToastType = 'info' | 'success' | 'warning' | 'danger';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    message?: string;
    type?: UiToastType;
    title?: string;
    closable?: boolean;
    inline?: boolean;
  }>(),
  {
    visible: false,
    message: '',
    type: 'info',
    title: '',
    closable: true,
    inline: false
  }
);

const icon = computed(() => {
  switch (props.type) {
    case 'success':
      return 'CheckCircleOutlined';
    case 'warning':
      return 'Warning';
    case 'danger':
      return 'StopOutlined';
    default:
      return 'Information';
  }
});

const type = computed(() => props.type);
const title = computed(() => props.title);
const visible = computed(() => props.visible);
const closable = computed(() => props.closable);
const message = computed(() => props.message);
const toastClasses = computed(() => [
  `ui-toast--${props.type}`,
  { 'ui-toast--inline': props.inline }
]);
</script>

<style scoped>
.ui-toast {
  position: fixed;
  right: var(--sakai-space-6);
  bottom: var(--sakai-space-6);
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3) var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface-card);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  box-shadow: var(--sakai-shadow-lg);
  color: var(--sakai-text-color);
  z-index: 1200;
}

.ui-toast--inline {
  position: relative;
  right: auto;
  bottom: auto;
  width: auto;
}

.ui-toast--success {
  border-color: color-mix(in srgb, var(--sakai-success) 45%, transparent);
}

.ui-toast--warning {
  border-color: color-mix(in srgb, var(--sakai-warning) 45%, transparent);
}

.ui-toast--danger {
  border-color: color-mix(in srgb, var(--sakai-danger) 45%, transparent);
}

.ui-toast__content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  max-width: min(360px, 60vw);
}

.ui-toast__close {
  border: none;
  background: transparent;
  color: var(--sakai-text-color-tertiary);
  padding: 0.3rem;
  border-radius: var(--sakai-border-radius-md);
  cursor: pointer;
}

.ui-toast-enter-active,
.ui-toast-leave-active {
  transition: opacity var(--sakai-transition-duration) var(--sakai-transition-ease),
    transform var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-toast-enter-from,
.ui-toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
