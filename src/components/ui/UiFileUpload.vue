<template>
  <div class="ui-file-upload" :class="{ 'is-dragging': isDragging, 'is-disabled': props.disabled }">
    <div
      class="ui-file-upload__dropzone"
      role="button"
      :tabindex="props.disabled ? -1 : 0"
      :aria-disabled="props.disabled ? 'true' : 'false'"
      @click="triggerFileDialog"
      @keydown.enter.prevent="triggerFileDialog"
      @keydown.space.prevent="triggerFileDialog"
      @dragover.prevent.stop="onDragOver"
      @dragleave.prevent.stop="onDragLeave"
      @drop.prevent.stop="onDrop"
    >
      <input
        ref="inputRef"
        class="ui-file-upload__input"
        type="file"
        :accept="props.accept"
        :multiple="props.multiple"
        :disabled="props.disabled"
        @change.stop="onChange"
        @click.stop
      />
      <div class="ui-file-upload__icon">
        <UiIcon :name="props.icon" :size="28" />
      </div>
      <div class="ui-file-upload__text">
        <slot>
          <strong>{{ props.label }}</strong>
          <span v-if="props.hint">{{ props.hint }}</span>
        </slot>
      </div>
      <UiButton
        v-if="props.showButton"
        variant="outline"
        color="primary"
        class="ui-file-upload__browse"
        button-type="button"
        @click.stop.prevent="triggerFileDialog"
      >
        {{ props.buttonLabel }}
      </UiButton>
    </div>

    <ul v-if="files.length" class="ui-file-upload__list">
      <li v-for="(file, index) in files" :key="`${file.name}-${index}`" class="ui-file-upload__item">
        <div class="ui-file-upload__meta">
          <span class="ui-file-upload__name">{{ file.name }}</span>
          <span class="ui-file-upload__size">{{ formatSize(file.size) }}</span>
        </div>
        <button
          type="button"
          class="ui-file-upload__remove"
          :aria-label="`Remove ${file.name}`"
          @click="removeFile(index)"
        >
          <UiIcon name="CloseOutlined" :size="14" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiButton from '@/components/ui/UiButton.vue';

type FileArray = File[];

const props = withDefaults(
  defineProps<{
    modelValue?: FileArray | null;
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    label?: string;
    hint?: string;
    icon?: string;
    showButton?: boolean;
    buttonLabel?: string;
  }>(),
  {
    modelValue: null,
    accept: '',
    multiple: false,
    disabled: false,
    label: 'Drag and drop files or browse',
    hint: '',
    icon: 'UploadOutlined',
    showButton: true,
    buttonLabel: 'Browse'
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: FileArray): void;
  (e: 'change', value: FileArray): void;
  (e: 'remove', file: File, index: number): void;
  (e: 'drop', value: FileArray): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const internalFiles = ref<FileArray>([]);

watch(
  () => props.modelValue,
  (next) => {
    if (!next) {
      internalFiles.value = [];
      return;
    }
    internalFiles.value = Array.from(next);
  },
  { immediate: true }
);

const files = computed(() => internalFiles.value);

const updateFiles = (next: FileArray) => {
  internalFiles.value = next;
  emit('update:modelValue', next);
  emit('change', next);
};

const triggerFileDialog = () => {
  if (props.disabled) return;
  inputRef.value?.click();
};

const onChange = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  const target = event.target as HTMLInputElement;
  if (!target.files) return;
  const next = props.multiple ? [...files.value, ...Array.from(target.files)] : Array.from(target.files);
  updateFiles(next);
  target.value = '';
};

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  if (props.disabled) return;
  isDragging.value = true;
};

const onDragLeave = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  isDragging.value = false;
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  if (props.disabled) return;
  const droppedFiles = event.dataTransfer?.files;
  isDragging.value = false;
  if (!droppedFiles?.length) return;
  const next = props.multiple ? [...files.value, ...Array.from(droppedFiles)] : Array.from(droppedFiles);
  updateFiles(next);
  emit('drop', next);
};

const removeFile = (index: number) => {
  const next = files.value.slice();
  const [removed] = next.splice(index, 1);
  updateFiles(next);
  if (removed) {
    emit('remove', removed, index);
  }
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / k ** i;
  return `${size.toFixed(size > 10 ? 0 : 1)} ${sizes[i]}`;
};
</script>

<style scoped>
.ui-file-upload {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.ui-file-upload__dropzone {
  border: 2px dashed var(--sakai-border-color);
  border-radius: var(--sakai-border-radius-2xl);
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sakai-space-4);
  background: var(--sakai-surface-card);
  transition: all var(--sakai-transition-duration) var(--sakai-transition-ease);
  cursor: pointer;
  position: relative;
}

.ui-file-upload__dropzone:hover {
  border-color: var(--sakai-primary);
  background: color-mix(in srgb, var(--sakai-primary) 4%, transparent);
}

.ui-file-upload.is-dragging .ui-file-upload__dropzone {
  border-color: var(--sakai-primary);
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
  transform: scale(1.01);
  border-style: solid;
}

.ui-file-upload.is-disabled .ui-file-upload__dropzone {
  cursor: not-allowed;
  opacity: 0.5;
  background: var(--sakai-surface-ground);
}

.ui-file-upload__icon {
  width: 64px;
  height: 64px;
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  color: var(--sakai-primary);
  border-radius: var(--sakai-border-radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
}

.ui-file-upload__dropzone:hover .ui-file-upload__icon {
  transform: translateY(-5px);
}

.ui-file-upload__text {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ui-file-upload__text strong {
  display: block;
  font-size: 1.1rem;
  color: var(--sakai-text-color);
  font-weight: var(--sakai-font-weight-bold);
}

.ui-file-upload__text span {
  color: var(--sakai-text-color-muted);
  font-size: 0.9rem;
}

.ui-file-upload__browse {
  margin-top: var(--sakai-space-2);
  pointer-events: none;
}

.ui-file-upload__input {
  display: none;
}

.ui-file-upload__list {
  display: grid;
  gap: var(--sakai-space-2);
  padding: 0;
  margin: 0;
  list-style: none;
}

.ui-file-upload__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface-card);
  border: 1px solid var(--sakai-border-color);
  box-shadow: var(--sakai-shadow-sm);
  gap: var(--sakai-space-4);
  animation: file-item-in 0.3s ease-out;
}

@keyframes file-item-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.ui-file-upload__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.ui-file-upload__name {
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ui-file-upload__size {
  font-size: 0.8rem;
  color: var(--sakai-text-color-muted);
}

.ui-file-upload__remove {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--sakai-text-color-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.ui-file-upload__remove:hover {
  background: var(--sakai-surface-alt);
  color: var(--sakai-danger);
  transform: rotate(90deg);
}
</style>
