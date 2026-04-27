<template>
  <form class="badge-form" @submit.prevent="submit">
    <div class="badge-form__icon">
      <UiFileUpload
        v-model="iconFiles"
        :label="t('badges.form.iconLabel')"
        :hint="iconUploadHint"
        accept="image/*"
        :disabled="iconUploading"
        @change="onIconFilesChange"
        @remove="onIconFilesRemoved"
      >
        <strong>{{ t('badges.form.iconLabel') }}</strong>
        <span>{{ iconUploadHint }}</span>
      </UiFileUpload>
      <div v-if="form.iconUrl" class="badge-form__preview">
        <img :src="form.iconUrl" :alt="t('badges.form.iconPreviewAlt')" loading="lazy" />
        <UiButton type="button" variant="ghost" size="sm" @click="clearIcon" :disabled="iconUploading">
          {{ t('badges.form.iconRemove') }}
        </UiButton>
      </div>
      <p v-if="iconUploading" class="badge-form__icon-status">{{ t('badges.form.iconUploading') }}</p>
      <p v-else-if="iconUploadError" class="badge-form__icon-error">{{ iconUploadError }}</p>
    </div>
    <UiInput v-model="form.name" :label="t('badges.form.name')" required maxlength="120" />
    <UiTextarea v-model="form.description" :label="t('badges.form.description')" :rows="3" maxlength="500" />
    <UiInput
      v-model.number="form.threshold"
      :label="t('badges.form.threshold')"
      type="number"
      min="1"
      required
    />
    <UiButton type="submit" color="primary" :loading="loading" :disabled="iconUploading">
      {{ submitLabel }}
    </UiButton>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiFileUpload from '@/components/ui/UiFileUpload.vue';
import { useToast } from '@/composables/useToast';

import { uploadBadgeIcon, type TeacherBadge, type TeacherBadgeCreatePayload } from '@/api/badges';

interface FormState {
  name: string;
  iconUrl: string;
  description: string;
  threshold: number;
}

const props = defineProps<{
  badge?: TeacherBadge | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', payload: TeacherBadgeCreatePayload): void;
}>();

const { t } = useI18n();
const toast = useToast();

const form = reactive<FormState>({
  name: '',
  iconUrl: '',
  description: '',
  threshold: 1
});

const iconFiles = ref<File[]>([]);
const iconUploading = ref(false);
const iconUploadError = ref('');

const loading = computed(() => props.loading === true);

const submitLabel = computed(() =>
  props.badge ? t('badges.form.updateAction') : t('badges.form.createAction')
);

const iconUploadHint = computed(() => t('badges.form.iconHint'));

watch(
  () => props.badge,
  (badge) => {
    if (badge) {
      form.name = badge.name ?? '';
      form.iconUrl = badge.iconUrl ?? '';
      form.description = badge.description ?? '';
      form.threshold = badge.rule?.threshold ?? 1;
    } else {
      form.name = '';
      form.iconUrl = '';
      form.description = '';
      form.threshold = 1;
    }
    iconUploadError.value = '';
    iconFiles.value = [];
  },
  { immediate: true }
);

const submit = () => {
  const payload: TeacherBadgeCreatePayload = {
    name: form.name.trim(),
    iconUrl: form.iconUrl.trim() || undefined,
    description: form.description.trim() || undefined,
    rule: {
      type: 'COURSE_COMPLETIONS',
      threshold: Math.max(1, Number.isFinite(form.threshold) ? Math.floor(form.threshold) : 1)
    }
  };
  emit('submit', payload);
};

const clearIcon = () => {
  form.iconUrl = '';
  iconFiles.value = [];
};

const onIconFilesChange = async (files: File[]) => {
  iconUploadError.value = '';
  if (!files.length) {
    return;
  }
  const [file] = files;
  if (!file) {
    return;
  }
  iconUploading.value = true;
  try {
    const result = await uploadBadgeIcon(file);
    form.iconUrl = result.url;
    toast.success(t('badges.form.iconUploadSuccess'));
  } catch (error) {
    console.error(error);
    iconUploadError.value = t('badges.form.iconUploadFailed');
    toast.error({ detail: iconUploadError.value });
  } finally {
    iconUploading.value = false;
    iconFiles.value = [];
  }
};

const onIconFilesRemoved = () => {
  iconFiles.value = [];
};
</script>

<style scoped>
.badge-form {
  display: grid;
  gap: var(--sakai-space-5);
}

.badge-form__icon {
  display: grid;
  gap: var(--sakai-space-3);
}

.badge-form__preview {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-3);
}

.badge-form__preview img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: var(--sakai-border-radius-md);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  background: var(--sakai-surface);
}

.badge-form__icon-status {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.badge-form__icon-error {
  margin: 0;
  color: var(--sakai-danger);
  font-size: 0.9rem;
}
</style>
