<template>
  <ThemePage :title="t('adminOps.alerts.title')" :subtitle="t('adminOps.alerts.subtitle')">
    <section class="admin-alerts">
      <UiCard class="admin-alerts__card" hover>
        <template #title>{{ t('adminOps.alerts.form.title') }}</template>
        <template #subtitle>{{ t('adminOps.alerts.form.subtitle') }}</template>

        <form class="admin-alerts__form" @submit.prevent="submit">
          <UiAlert v-if="formError" color="danger" variant="soft" class="admin-alerts__alert">
            {{ formError }}
          </UiAlert>

          <UiTextarea
            v-model="form.message"
            :label="t('adminOps.alerts.form.messageLabel')"
            :placeholder="t('adminOps.alerts.form.messagePlaceholder')"
            :rows="4"
            required
          />

          <div class="admin-alerts__audience">
            <UiSwitch v-model="form.sendToAll" :label="t('adminOps.alerts.form.sendToAll')" />
            <p class="admin-alerts__hint">
              {{ audienceSummary }}
            </p>
          </div>

          <div class="admin-alerts__select-group">
            <label class="admin-alerts__select-label" :class="{ 'is-disabled': form.sendToAll }">
              {{ t('adminOps.alerts.form.recipientsLabel') }}
            </label>
            <UiSkeleton v-if="loadingTeachers" height="42px" radius="12px" />
            <UiSelect
              v-else
              v-model="form.teacherIds"
              multiple
              :disabled="form.sendToAll"
              :placeholder="t('adminOps.alerts.form.recipientsPlaceholder')"
              class="admin-alerts__select"
            >
              <option v-for="option in teacherOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </UiSelect>
          </div>

          <div v-if="selectedTeachers.length" class="admin-alerts__selected">
            <h3>{{ t('adminOps.alerts.form.selectedTitle', { count: selectedTeachers.length }) }}</h3>
            <ul>
              <li v-for="teacher in selectedTeachers" :key="teacher.id">
                <span class="admin-alerts__selected-name">{{ teacher.name }}</span>
                <small class="admin-alerts__selected-meta">{{ teacher.slug }}</small>
              </li>
            </ul>
          </div>

          <div class="admin-alerts__actions">
            <UiButton type="submit" color="primary" :loading="submitting">
              {{ t('adminOps.alerts.actions.send') }}
            </UiButton>
            <UiButton type="button" variant="link" color="secondary" @click="resetForm">
              {{ t('adminOps.alerts.actions.reset') }}
            </UiButton>
          </div>
        </form>
      </UiCard>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import { fetchTeacherSummaries, type TeacherSummary } from '@/services/admin';
import { sendAdminAlert, type AdminAlertRequest } from '@/api/adminOps';
import { useToast } from '@/composables/useToast';

const { t } = useI18n();
const toast = useToast();

const form = reactive({
  message: '',
  teacherIds: [] as number[],
  sendToAll: true
});

const formError = ref('');
const submitting = ref(false);
const loadingTeachers = ref(false);
const teachers = ref<TeacherSummary[]>([]);

const teacherOptions = computed(() =>
  teachers.value
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((teacher) => ({
      value: teacher.id,
      label: `${teacher.name} (${teacher.slug})`
    }))
);

const activeTeacherCount = computed(() => teachers.value.filter((teacher) => teacher.active).length);

const selectedTeachers = computed(() => {
  if (form.sendToAll) {
    return [] as TeacherSummary[];
  }
  const selectedIds = new Set(form.teacherIds);
  return teachers.value.filter((teacher) => selectedIds.has(teacher.id));
});

const audienceSummary = computed(() => {
  if (form.sendToAll) {
    return activeTeacherCount.value > 0
      ? t('adminOps.alerts.form.allTeachersHint', { count: activeTeacherCount.value })
      : t('adminOps.alerts.form.noTeachers');
  }
  return form.teacherIds.length > 0
    ? t('adminOps.alerts.form.selectedHint', { count: form.teacherIds.length })
    : t('adminOps.alerts.form.recipientsHint');
});

const loadTeachers = async () => {
  loadingTeachers.value = true;
  formError.value = '';
  try {
    teachers.value = await fetchTeacherSummaries();
  } catch (error) {
    console.warn('[admin-alerts] failed to load teachers', error);
    toast.error({ detail: t('adminOps.alerts.errors.loadTeachers') });
  } finally {
    loadingTeachers.value = false;
  }
};

const resetForm = () => {
  form.message = '';
  form.teacherIds = [];
  form.sendToAll = true;
  formError.value = '';
};

const submit = async () => {
  formError.value = '';
  const message = form.message.trim();
  if (!message) {
    formError.value = t('adminOps.alerts.form.messageRequired');
    return;
  }
  if (form.sendToAll) {
    if (activeTeacherCount.value === 0) {
      formError.value = t('adminOps.alerts.form.noTeachers');
      return;
    }
  } else if (form.teacherIds.length === 0) {
    formError.value = t('adminOps.alerts.form.recipientsRequired');
    return;
  }

  const payload: AdminAlertRequest = {
    message
  };

  if (!form.sendToAll) {
    payload.teacherIds = Array.from(new Set(form.teacherIds));
  }

  submitting.value = true;
  try {
    const result = await sendAdminAlert(payload);
    if (result.recipients <= 0) {
      toast.warning({ detail: t('adminOps.alerts.toast.noRecipients') });
      return;
    }
    const successMessage =
      result.recipients === 1
        ? t('adminOps.alerts.toast.sentSingle')
        : t('adminOps.alerts.toast.sentMultiple', { count: result.recipients });
    toast.success({ detail: successMessage });
    form.message = '';
    if (!form.sendToAll) {
      form.teacherIds = [];
    }
  } catch (error) {
    console.warn('[admin-alerts] failed to send alert', error);
    toast.error({ detail: t('adminOps.alerts.toast.failed') });
  } finally {
    submitting.value = false;
  }
};

watch(
  () => form.sendToAll,
  (value) => {
    if (value) {
      form.teacherIds = [];
    }
  }
);

onMounted(loadTeachers);
</script>

<style scoped>
.admin-alerts {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin-alerts__card {
  max-width: 720px;
  margin: 0 auto;
}

.admin-alerts__form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin-alerts__alert {
  margin-top: -8px;
}

.admin-alerts__audience {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-alerts__hint {
  margin: 0;
  font-size: 0.95rem;
  color: rgba(17, 24, 39, 0.65);
}

.admin-alerts__select-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-alerts__select-label {
  font-weight: 600;
  color: rgba(17, 24, 39, 0.85);
}

.admin-alerts__select-label.is-disabled {
  opacity: 0.6;
}

.admin-alerts__select {
  min-height: 42px;
}

.admin-alerts__selected {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 16px;
  padding: 16px 20px;
  background: rgba(241, 245, 249, 0.5);
}

.admin-alerts__selected h3 {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 600;
}

.admin-alerts__selected ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.admin-alerts__selected li {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.admin-alerts__selected-name {
  font-weight: 600;
}

.admin-alerts__selected-meta {
  font-size: 0.85rem;
  color: rgba(30, 41, 59, 0.65);
}

.admin-alerts__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 640px) {
  .admin-alerts__card {
    margin: 0;
  }

  .admin-alerts__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
