<template>
  <Teleport to="body">
    <transition name="ui-dialog">
      <div v-if="modelValue" class="ui-dialog__overlay" @click="handleOverlay">
        <div class="ui-dialog" :style="dialogStyle" @click.stop>
          <header class="ui-dialog__header">
            <h3 class="ui-dialog__title m-0 text-[1.25rem] font-bold text-content">{{ title }}</h3>
            <button v-if="closable" class="ui-dialog__close" type="button" @click="close">
              <UiIcon name="CloseOutlined" :size="16" />
            </button>
          </header>
          <div class="ui-dialog__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="ui-dialog__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import UiIcon from './UiIcon.vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    width?: string;
    closable?: boolean;
    maskClosable?: boolean;
  }>(),
  {
    modelValue: false,
    title: '',
    width: '480px',
    closable: true,
    maskClosable: true
  }
);

const emit = defineEmits<{ 'update:modelValue': [value: boolean]; hide: []; close: [] }>();

const dialogStyle = computed(() => ({ '--ui-dialog-width': props.width }));
const title = computed(() => props.title);
const closable = computed(() => props.closable);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

watch(
  () => props.modelValue,
  (value, previous) => {
    if (previous && !value) {
      emit('hide');
    }
  }
);

const handleOverlay = () => {
  if (props.maskClosable) {
    close();
  }
};
</script>

<style scoped>
.ui-dialog__overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--sakai-text-color) 40%, transparent);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: var(--sakai-space-4);
}

.ui-dialog {
  width: min(100%, var(--ui-dialog-width, 520px));
  max-height: 90vh;
  background: var(--sakai-surface-card);
  border-radius: var(--sakai-border-radius-2xl);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--sakai-border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: dialog-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dialog-slide-up {
  from {
    transform: translateY(20px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.ui-dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-5) var(--sakai-space-6) var(--sakai-space-4);
  background: color-mix(in srgb, var(--sakai-surface-card) 98%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
}

.ui-dialog__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--sakai-text-color-tertiary);
  border-radius: var(--sakai-border-radius-full);
  cursor: pointer;
  transition: all 0.2s;
}

.ui-dialog__close:hover {
  background: var(--sakai-surface-alt);
  color: var(--sakai-danger);
}

.ui-dialog__body {
  overflow-y: auto;
  padding: var(--sakai-space-6);
  max-height: calc(90vh - 10rem);
  color: var(--sakai-text-color-secondary);
  line-height: 1.6;
}

.ui-dialog__footer {
  padding: var(--sakai-space-4) var(--sakai-space-6);
  background: var(--sakai-surface-alt);
  border-top: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}

.ui-dialog-enter-active,
.ui-dialog-leave-active {
  transition: opacity 0.25s ease;
}

.ui-dialog-enter-from,
.ui-dialog-leave-to {
  opacity: 0;
}
</style>
