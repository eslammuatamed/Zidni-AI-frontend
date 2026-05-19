<template>
  <div class="attachment-uploader">
    <UiFileUpload
      v-model="selectedFiles"
      multiple
      :label="t('teacher.assignments.upload.dropHint')"
      :button-label="t('teacher.assignments.upload.browse')"
      :hint="t('teacher.assignments.upload.sizeHint')"
      :disabled="anyUploading"
      @change="onChange"
    />
    <UiAlert v-if="lastError" color="danger" variant="soft">
      {{ lastError }}
    </UiAlert>
    <AssignmentAttachmentList
      :attachments="attachments"
      :uploading="uploadingMap"
      @remove="onRemove"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UiFileUpload from '@/components/ui/UiFileUpload.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import AssignmentAttachmentList from '@/components/shared/assignments/AssignmentAttachmentList.vue';
import { useLearningStore } from '@/stores/learning';
import { handleApiError } from '@/composables/useApiError';
import type { AssignmentAttachment } from '@/services/learning';

const props = defineProps<{
  attachments: AssignmentAttachment[];
}>();

const emit = defineEmits<{
  'update:attachments': [value: AssignmentAttachment[]];
}>();

const { t } = useI18n();
const learning = useLearningStore();

const selectedFiles = ref<File[]>([]);
const uploadingMap = ref<Record<string, number>>({});
const lastError = ref('');

const anyUploading = computed(() => Object.keys(uploadingMap.value).length > 0);

async function onChange(files: File[]) {
  if (!files.length) return;
  lastError.value = '';
  for (const file of files) {
    if (file.name in uploadingMap.value) continue;
    uploadingMap.value = { ...uploadingMap.value, [file.name]: 0 };
    try {
      const attachment = await learning.uploadAttachment(file, (progress) => {
        uploadingMap.value = { ...uploadingMap.value, [file.name]: progress };
      });
      emit('update:attachments', [...props.attachments, attachment]);
    } catch (error) {
      lastError.value = handleApiError(error, {
        fallback: t('teacher.assignments.upload.failed', { name: file.name }),
        useToast: false
      });
    } finally {
      const next = { ...uploadingMap.value };
      delete next[file.name];
      uploadingMap.value = next;
    }
  }
  selectedFiles.value = [];
}

function onRemove(index: number) {
  emit(
    'update:attachments',
    props.attachments.filter((_, i) => i !== index)
  );
}
</script>

<style scoped>
.attachment-uploader {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}
</style>
