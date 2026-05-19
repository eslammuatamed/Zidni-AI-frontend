<template>
  <UiAlert v-if="!attachments.length && !uploading" color="info" variant="soft">
    {{ t('teacher.assignments.upload.empty') }}
  </UiAlert>
  <ul v-else class="attachment-list">
    <li
      v-for="(attachment, index) in attachments"
      :key="`${attachment.fileKey}-${index}`"
      class="attachment-list__item"
    >
      <div class="attachment-list__meta">
        <a
          :href="attachment.fileUrl"
          target="_blank"
          rel="noopener"
          class="attachment-list__name"
        >
          <UiIcon name="PaperClipOutlined" :size="14" />
          <span>{{ attachment.fileName }}</span>
        </a>
        <span class="attachment-list__size">
          {{ formatFileSize(attachment.fileSizeBytes) }}
        </span>
      </div>
      <UiButton
        v-if="removable"
        variant="link"
        color="danger"
        size="sm"
        prepend-icon="DeleteOutlined"
        @click.prevent="emit('remove', index)"
      >
        {{ t('teacher.assignments.upload.remove') }}
      </UiButton>
    </li>
    <li
      v-for="entry in uploadingEntries"
      :key="`uploading-${entry.name}`"
      class="attachment-list__item attachment-list__item--uploading"
    >
      <div class="attachment-list__meta">
        <span class="attachment-list__name">
          <UiIcon name="LoadingOutlined" :size="14" />
          <span>{{ entry.name }}</span>
        </span>
        <span class="attachment-list__size">{{ entry.progress }}%</span>
      </div>
      <UiProgressBar :value="entry.progress" color="info" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiProgressBar from '@/components/ui/UiProgressBar.vue';
import { formatFileSize } from '@/utils/formatters';
import type { AssignmentAttachment } from '@/services/learning';

const props = withDefaults(
  defineProps<{
    attachments: AssignmentAttachment[];
    removable?: boolean;
    uploading?: Record<string, number> | null;
  }>(),
  {
    removable: true,
    uploading: null
  }
);

const emit = defineEmits<{
  remove: [index: number];
}>();

const { t } = useI18n();

const uploadingEntries = computed(() =>
  props.uploading
    ? Object.entries(props.uploading).map(([name, progress]) => ({ name, progress }))
    : []
);
</script>

<style scoped>
.attachment-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.attachment-list__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
  padding: var(--sakai-space-2) var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-md);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
  background: color-mix(in srgb, var(--sakai-surface) 96%, transparent);
}

.attachment-list__item--uploading {
  flex-direction: column;
  align-items: stretch;
}

.attachment-list__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
  width: 100%;
}

.attachment-list__name {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
}

.attachment-list__size {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}
</style>
