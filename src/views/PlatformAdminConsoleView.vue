<template>
  <ThemePage class="theme-page--admin" :title="t('adminEnglishLab.title')" :subtitle="t('adminEnglishLab.subtitle')">
    <section class="english-lab-admin">
      <aside class="english-lab-admin__sidebar">
        <UiCard class="english-lab-admin__panel" hover>
          <template #title>{{ t('adminEnglishLab.teachers.title') }}</template>
          <div class="english-lab-admin__search">
            <UiInput
              v-model="teacherSearch"
              :label="t('adminEnglishLab.teachers.searchLabel')"
              :placeholder="t('adminEnglishLab.teachers.searchPlaceholder')"
              clearable
            />
          </div>
          <UiAlert v-if="teacherError" color="danger" variant="soft">
            {{ teacherError }}
          </UiAlert>
          <div v-else-if="loadingTeachers" class="english-lab-admin__skeleton">
            <UiSkeleton v-for="index in 4" :key="index" height="48px" animation="wave" />
          </div>
          <ul v-else class="english-lab-admin__teacher-list" role="list">
            <li v-if="!filteredTeachers.length" class="english-lab-admin__teacher-empty">
              {{ t('adminEnglishLab.teachers.empty') }}
            </li>
            <li
              v-for="teacher in filteredTeachers"
              :key="teacher.id"
              :class="[
                'english-lab-admin__teacher-item',
                { 'is-active': teacher.id === selectedTeacherId }
              ]"
            >
              <button type="button" class="english-lab-admin__teacher-button" @click="selectTeacher(teacher.id)">
                <span class="english-lab-admin__teacher-name">{{ teacher.name || teacher.slug }}</span>
                <span class="english-lab-admin__teacher-meta">
                  {{ teacher.slug }} · {{ teacher.plan }}
                </span>
              </button>
            </li>
          </ul>
        </UiCard>
      </aside>

      <div class="english-lab-admin__content">
        <UiCard class="english-lab-admin__panel" hover>
          <template #title>
            {{ selectedTeacher ? selectedTeacher.name || selectedTeacher.slug : t('adminEnglishLab.editor.emptyTitle') }}
          </template>
          <template v-if="selectedTeacher" #subtitle>
            {{ t('adminEnglishLab.editor.subtitle', { slug: selectedTeacher.slug, plan: selectedTeacher.plan }) }}
          </template>

          <div v-if="!selectedTeacher" class="english-lab-admin__empty">
            <p>{{ t('adminEnglishLab.editor.emptyMessage') }}</p>
          </div>

          <div v-else class="english-lab-admin__form">
            <UiAlert v-if="overridesError" color="danger" variant="soft" class="english-lab-admin__alert">
              {{ overridesError }}
            </UiAlert>
            <div v-else-if="loadingOverrides" class="english-lab-admin__skeleton">
              <UiSkeleton v-for="index in 3" :key="index" height="48px" animation="wave" />
            </div>
            <form v-else class="english-lab-admin__feature-form" @submit.prevent="saveOverrides">
              <section class="english-lab-admin__section">
                <header class="english-lab-admin__section-header">
                  <h4>{{ t('adminEnglishLab.editor.upgradeTitle') }}</h4>
                  <p>{{ t('adminEnglishLab.editor.upgradeHint') }}</p>
                </header>
                <div class="english-lab-admin__feature english-lab-admin__feature--upgrade">
                  <div class="english-lab-admin__feature-header">
                    <UiSwitch
                      :model-value="featureValue(teacherSubscriptionFeature.code)"
                      :label="teacherSubscriptionFeature.label"
                      :disabled="saving"
                      @update:model-value="(value) => setOverride(teacherSubscriptionFeature.code, value)"
                    />
                    <UiButton
                      type="button"
                      variant="link"
                      size="sm"
                      color="primary"
                      :disabled="saving || !isOverrideSet(teacherSubscriptionFeature.code)"
                      @click="clearOverride(teacherSubscriptionFeature.code)"
                    >
                      {{ t('adminEnglishLab.editor.clearOverride') }}
                    </UiButton>
                  </div>
                  <small class="english-lab-admin__feature-meta">
                    {{ featureMeta(teacherSubscriptionFeature.code) }}
                  </small>
                </div>
              </section>

              <section class="english-lab-admin__section">
                <header class="english-lab-admin__section-header">
                  <h4>{{ t('adminEnglishLab.editor.sectionTitle') }}</h4>
                  <p>{{ t('adminEnglishLab.editor.sectionHint') }}</p>
                </header>
                <div v-for="feature in englishLabFeatures" :key="feature.code" class="english-lab-admin__feature">
                  <div class="english-lab-admin__feature-header">
                    <UiSwitch
                      :model-value="featureValue(feature.code)"
                      :label="feature.label"
                      :disabled="saving"
                      @update:model-value="(value) => setOverride(feature.code, value)"
                    />
                    <UiButton
                      type="button"
                      variant="link"
                      size="sm"
                      color="primary"
                      :disabled="saving || !isOverrideSet(feature.code)"
                      @click="clearOverride(feature.code)"
                    >
                      {{ t('adminEnglishLab.editor.clearOverride') }}
                    </UiButton>
                  </div>
                  <small class="english-lab-admin__feature-meta">{{ featureMeta(feature.code) }}</small>
                </div>
              </section>
              <div class="english-lab-admin__actions">
                <UiButton
                  type="button"
                  variant="link"
                  color="secondary"
                  :disabled="!hasChanges || saving"
                  @click="resetForm"
                >
                  {{ t('common.cancel') }}
                </UiButton>
                <UiButton type="submit" color="primary" :disabled="!hasChanges" :loading="saving">
                  {{ t('common.save') }}
                </UiButton>
              </div>
            </form>
          </div>
        </UiCard>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import UiButton from '@/components/ui/UiButton.vue';
import { useToast } from '@/composables/useToast';
import { useVisibilityRefresh } from '@/composables/useVisibilityRefresh';
import { FEATURE, FEATURE_LABELS } from '@/constants/featureCatalog';
import { fetchTeacherSummaries, type TeacherSummary } from '@/services/admin';
import {
  fetchTenantOverrides,
  updateTenantOverrides,
  type TenantOverrideSnapshot
} from '@/services/tenantOverrides';

const { t } = useI18n();
const toast = useToast();

const englishLabFeatureCodes = [
  FEATURE.englishLab,
  FEATURE.englishLabAnimals,
  FEATURE.englishLabFruits,
  FEATURE.englishLabActions,
  FEATURE.englishLabBody,
  FEATURE.englishLabEmotions
] as const;

const overrideFeatureCodes = [
  FEATURE.teacherSubscriptions,
  ...englishLabFeatureCodes
] as const;

type OverrideFeatureCode = (typeof overrideFeatureCodes)[number];
type EnglishLabFeatureCode = (typeof englishLabFeatureCodes)[number];

const teacherSubscriptionFeature = {
  code: FEATURE.teacherSubscriptions as OverrideFeatureCode,
  label: FEATURE_LABELS[FEATURE.teacherSubscriptions] || FEATURE.teacherSubscriptions
};

const englishLabFeatures = englishLabFeatureCodes.map((code) => ({
  code,
  label: FEATURE_LABELS[code] || code
}));

const teachers = ref<TeacherSummary[]>([]);
const loadingTeachers = ref(false);
const teacherError = ref<string | null>(null);
const teacherSearch = ref('');
const selectedTeacherId = ref<number | null>(null);

const overrides = ref<Record<string, boolean>>({});
const effective = ref<Record<string, boolean>>({});

const formOverrides = reactive<Record<OverrideFeatureCode, boolean | null>>(
  Object.fromEntries(overrideFeatureCodes.map((code) => [code, null])) as Record<OverrideFeatureCode, boolean | null>
);

const loadingOverrides = ref(false);
const overridesError = ref<string | null>(null);
const saving = ref(false);
const adminRefreshInFlight = ref(false);

const normalizedTeachers = computed(() => {
  return [...teachers.value].sort((a, b) => {
    const nameA = (a.name || a.slug).toLowerCase();
    const nameB = (b.name || b.slug).toLowerCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return a.slug.localeCompare(b.slug);
  });
});

const filteredTeachers = computed(() => {
  const query = teacherSearch.value.trim().toLowerCase();
  if (!query) {
    return normalizedTeachers.value;
  }
  return normalizedTeachers.value.filter((teacher) => {
    return (
      teacher.slug.toLowerCase().includes(query) ||
      (teacher.name && teacher.name.toLowerCase().includes(query)) ||
      (teacher.subject && teacher.subject.toLowerCase().includes(query))
    );
  });
});

const selectedTeacher = computed(() => {
  if (selectedTeacherId.value == null) {
    return null;
  }
  return teachers.value.find((teacher) => teacher.id === selectedTeacherId.value) ?? null;
});

const hasChanges = computed(() => {
  return overrideFeatureCodes.some((code) => {
    const initial = Object.prototype.hasOwnProperty.call(overrides.value, code)
      ? overrides.value[code]
      : null;
    const current = formOverrides[code] ?? null;
    return current !== (initial ?? null);
  });
});

const overrideLabel = (value: boolean) =>
  value ? t('adminEnglishLab.status.enabled') : t('adminEnglishLab.status.disabled');

const featureValue = (code: OverrideFeatureCode) => {
  const overrideValue = formOverrides[code];
  if (overrideValue === null || overrideValue === undefined) {
    return Boolean(effective.value[code]);
  }
  return Boolean(overrideValue);
};

const isOverrideSet = (code: OverrideFeatureCode) => formOverrides[code] !== null && formOverrides[code] !== undefined;

const featureMeta = (code: OverrideFeatureCode) => {
  if (isOverrideSet(code)) {
    return t('adminEnglishLab.editor.overrideLabel', {
      value: overrideLabel(Boolean(formOverrides[code]))
    });
  }
  return t('adminEnglishLab.editor.planLabel', {
    value: overrideLabel(Boolean(effective.value[code]))
  });
};

const applySnapshotToForm = (snapshot: TenantOverrideSnapshot | null) => {
  overrides.value = snapshot?.overrides ?? {};
  effective.value = snapshot?.effective ?? {};
  overrideFeatureCodes.forEach((code) => {
    if (snapshot?.overrides && Object.prototype.hasOwnProperty.call(snapshot.overrides, code)) {
      formOverrides[code] = snapshot.overrides[code];
    } else {
      formOverrides[code] = null;
    }
  });
};

const resetForm = () => {
  applySnapshotToForm({ teacherId: selectedTeacher?.id ?? 0, overrides: overrides.value, effective: effective.value });
};

const setOverride = (code: OverrideFeatureCode, value: boolean) => {
  formOverrides[code] = value;
};

const clearOverride = (code: OverrideFeatureCode) => {
  formOverrides[code] = null;
};

const selectTeacher = (teacherId: number) => {
  if (selectedTeacherId.value === teacherId) {
    return;
  }
  selectedTeacherId.value = teacherId;
};

const loadTeachers = async () => {
  loadingTeachers.value = true;
  teacherError.value = null;
  try {
    teachers.value = await fetchTeacherSummaries();
    if (teachers.value.length > 0 && selectedTeacherId.value == null) {
      selectedTeacherId.value = teachers.value[0].id;
    }
  } catch (error) {
    console.error('[english-lab-admin] failed to load teachers', error);
    teacherError.value = t('adminEnglishLab.teachers.loadError');
  } finally {
    loadingTeachers.value = false;
  }
};

const loadOverrides = async (teacherId: number) => {
  loadingOverrides.value = true;
  overridesError.value = null;
  try {
    const snapshot = await fetchTenantOverrides(teacherId);
    applySnapshotToForm(snapshot);
  } catch (error) {
    console.error('[english-lab-admin] failed to load overrides', error);
    overridesError.value = t('adminEnglishLab.editor.loadError');
    applySnapshotToForm(null);
  } finally {
    loadingOverrides.value = false;
  }
};

const saveOverrides = async () => {
  if (!selectedTeacher.value) {
    return;
  }
  saving.value = true;
  try {
    const payload: Record<string, boolean> = { ...overrides.value };
    overrideFeatureCodes.forEach((code) => {
      delete payload[code];
    });
    overrideFeatureCodes.forEach((code) => {
      const value = formOverrides[code];
      if (value !== null && value !== undefined) {
        payload[code] = value;
      }
    });
    const snapshot = await updateTenantOverrides(selectedTeacher.value.id, payload);
    applySnapshotToForm(snapshot);
    toast.success({ detail: t('adminEnglishLab.editor.saveSuccess') });
    void refreshAdminConsole('save-overrides');
  } catch (error) {
    console.error('[english-lab-admin] failed to save overrides', error);
    toast.error({ detail: t('adminEnglishLab.editor.saveError') });
  } finally {
    saving.value = false;
  }
};

const refreshAdminConsole = async (reason: string) => {
  if (adminRefreshInFlight.value) {
    return;
  }
  adminRefreshInFlight.value = true;
  try {
    console.info('[PlatformAdminConsole] refreshing admin console after %s', reason);
    await loadTeachers();
    if (selectedTeacherId.value != null) {
      await loadOverrides(selectedTeacherId.value);
    }
  } catch (error) {
    console.error('[PlatformAdminConsole] failed to refresh admin console', error);
  } finally {
    adminRefreshInFlight.value = false;
  }
};

useVisibilityRefresh(
  (reason) => {
    console.debug('[PlatformAdminConsole] visibility refresh triggered by %s', reason);
    void refreshAdminConsole(reason);
  },
  {
    includeActivated: true,
    throttleMs: 500
  }
);

watch(selectedTeacherId, (teacherId) => {
  if (teacherId == null) {
    return;
  }
  void loadOverrides(teacherId);
});

onMounted(() => {
  void refreshAdminConsole('mounted');
});
</script>

<style scoped>
.english-lab-admin {
  display: grid;
  grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  gap: var(--sakai-space-6);
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .english-lab-admin {
    grid-template-columns: 1fr;
  }
}

.english-lab-admin__panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.english-lab-admin__search {
  margin-bottom: 1rem;
}

.english-lab-admin__teacher-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.english-lab-admin__teacher-empty {
  color: var(--color-text-muted);
  padding: 0.5rem 0;
}

.english-lab-admin__teacher-item {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.english-lab-admin__teacher-item.is-active {
  box-shadow: 0 0 0 2px var(--color-primary-200);
}

.english-lab-admin__teacher-button {
  width: 100%;
  text-align: left;
  padding: 0.75rem;
  background: none;
  border: 1px solid var(--color-border-subtle);
  border-radius: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.english-lab-admin__teacher-item.is-active .english-lab-admin__teacher-button {
  border-color: var(--color-primary-400);
  background-color: var(--color-primary-50);
}

.english-lab-admin__teacher-button:hover {
  border-color: var(--color-primary-300);
}

.english-lab-admin__teacher-name {
  display: block;
  font-weight: 600;
}

.english-lab-admin__teacher-meta {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin-top: 0.125rem;
}

.english-lab-admin__content {
  min-width: 0;
}

.english-lab-admin__empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.english-lab-admin__form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.english-lab-admin__alert {
  margin-bottom: 1rem;
}

.english-lab-admin__section-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.english-lab-admin__section-header h4 {
  margin: 0;
}

.english-lab-admin__section-header p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.english-lab-admin__feature {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.english-lab-admin__feature-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.english-lab-admin__feature-meta {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.english-lab-admin__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.english-lab-admin__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
