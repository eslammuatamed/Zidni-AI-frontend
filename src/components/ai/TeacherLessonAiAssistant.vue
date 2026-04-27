<template>
  <section class="teacher-lesson-ai">
    <header class="teacher-lesson-ai__header">
      <div>
        <h4>{{ t('ai.teacher.panelTitle') }}</h4>
        <p class="teacher-lesson-ai__description">{{ t('ai.teacher.panelSubtitle') }}</p>
      </div>
      <span class="teacher-lesson-ai__badge">{{ t('ai.common.poweredByGemini') }}</span>
    </header>
    <div v-if="hasLessonContext" class="teacher-lesson-ai__stats">
      <div class="teacher-lesson-ai__stat">
        <span class="teacher-lesson-ai__stat-label">{{ t('ai.teacher.stats.wordCount') }}</span>
        <strong>{{ lessonStats.wordCount }}</strong>
      </div>
      <div class="teacher-lesson-ai__stat">
        <span class="teacher-lesson-ai__stat-label">{{ t('ai.teacher.stats.objectives') }}</span>
        <strong>{{ lessonStats.objectives }}</strong>
      </div>
      <div class="teacher-lesson-ai__stat">
        <span class="teacher-lesson-ai__stat-label">{{ t('ai.teacher.stats.readTime') }}</span>
        <strong>{{ lessonStats.readTime }}</strong>
      </div>
    </div>

    <UiAlert v-if="!hasLessonContext" color="info" variant="soft" class="teacher-lesson-ai__notice">
      {{ t('ai.teacher.requiresSavedLesson') }}
    </UiAlert>

    <template v-else>
      <UiTabs v-if="hasTeacherAiTools" v-model="activeTab" :tabs="tabItems" variant="pill" />

      <div v-if="activeTab === 'summary' && summaryEnabled" class="teacher-lesson-ai__section">
        <div class="teacher-lesson-ai__form-grid">
          <UiInput
            v-model="summaryForm.lessonTitle"
            :label="t('ai.teacher.summary.lessonTitle')"
            @update:model-value="summaryDirty = true"
          />
          <UiTextarea
            v-model="summaryForm.lessonBody"
            :rows="4"
            :label="t('ai.teacher.summary.lessonBody')"
            @update:model-value="summaryDirty = true"
          />
          <UiTextarea
            v-model="summaryForm.objectivesText"
            :rows="3"
            :label="t('ai.teacher.summary.objectives')"
            :placeholder="t('ai.teacher.summary.objectivesHint')"
            @update:model-value="summaryDirty = true"
          />
          <UiInput
            v-model="summaryForm.audience"
            :label="t('ai.teacher.summary.audience')"
            @update:model-value="summaryDirty = true"
          />
          <UiInput
            v-model="summaryForm.language"
            :label="t('ai.teacher.summary.language')"
            :placeholder="t('ai.common.languagePlaceholder')"
            @update:model-value="summaryDirty = true"
          />
          <UiCheckbox
            v-model="summaryForm.includeKeyTakeaways"
            :label="t('ai.teacher.summary.includeTakeaways')"
            @update:model-value="summaryDirty = true"
          />
        </div>
        <div class="teacher-lesson-ai__quick">
          <span class="teacher-lesson-ai__quick-label">{{ t('ai.teacher.quick.audience') }}</span>
          <div class="teacher-lesson-ai__quick-row">
            <button
              v-for="preset in audiencePresets"
              :key="`summary-audience-${preset}`"
              type="button"
              class="teacher-lesson-ai__chip"
              @click="applyAudiencePreset(preset)"
            >
              {{ preset }}
            </button>
          </div>
          <span class="teacher-lesson-ai__quick-label">{{ t('ai.teacher.quick.language') }}</span>
          <div class="teacher-lesson-ai__quick-row">
            <button
              v-for="preset in languagePresets"
              :key="`summary-language-${preset}`"
              type="button"
              class="teacher-lesson-ai__chip"
              @click="applySummaryLanguagePreset(preset)"
            >
              {{ preset }}
            </button>
          </div>
        </div>
        <div class="teacher-lesson-ai__actions">
          <UiButton
            variant="link"
            color="secondary"
            @click="syncSummaryFromLesson"
            :disabled="summaryLoading || !summaryEnabled"
          >
            {{ t('ai.teacher.syncFromLesson') }}
          </UiButton>
          <div class="teacher-lesson-ai__actions-group">
            <UiButton
              variant="ghost"
              color="secondary"
              :disabled="summaryLoading || !summaryEnabled"
              @click="resetSummaryForm"
            >
              {{ t('ai.teacher.clearForm') }}
            </UiButton>
            <UiButton color="primary" :disabled="summaryLoading || !summaryEnabled" @click="runSummary">
              {{
                summaryLoading ? t('ai.common.generating') : t('ai.teacher.summary.generate')
              }}
            </UiButton>
          </div>
        </div>
        <UiAlert v-if="summaryError" color="danger" variant="soft">{{ summaryError }}</UiAlert>
        <div v-if="summaryResult" class="teacher-lesson-ai__result">
          <header class="teacher-lesson-ai__result-header">
            <h5>{{ t('ai.teacher.summary.resultTitle') }}</h5>
            <div class="teacher-lesson-ai__result-actions">
              <UiButton
                variant="link"
                color="secondary"
                :disabled="downloadSummaryLoading || !summaryEnabled"
                @click="downloadSummaryPdf"
              >
                {{
                  downloadSummaryLoading
                    ? t('ai.common.downloading')
                    : t('ai.teacher.summary.downloadPdf')
                }}
              </UiButton>
              <UiButton variant="link" color="primary" @click="copyText(summaryResult.summary)">
                {{ t('ai.common.copy') }}
              </UiButton>
            </div>
          </header>
          <p class="teacher-lesson-ai__summary-text">{{ summaryResult.summary }}</p>
          <div v-if="summaryResult.keyTakeaways.length" class="teacher-lesson-ai__takeaways">
            <h6>{{ t('ai.teacher.summary.takeawaysTitle') }}</h6>
            <ul>
              <li v-for="item in summaryResult.keyTakeaways" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'rewrite' && rewriteEnabled" class="teacher-lesson-ai__section">
        <div class="teacher-lesson-ai__form-grid">
          <UiInput
            v-model="rewriteForm.lessonTitle"
            :label="t('ai.teacher.rewrite.lessonTitle')"
            @update:model-value="rewriteDirty = true"
          />
          <UiTextarea
            v-model="rewriteForm.originalContent"
            :rows="4"
            :label="t('ai.teacher.rewrite.originalContent')"
            @update:model-value="rewriteDirty = true"
          />
          <UiInput
            v-model="rewriteForm.desiredTone"
            :label="t('ai.teacher.rewrite.desiredTone')"
            :placeholder="t('ai.teacher.rewrite.desiredToneHint')"
            @update:model-value="rewriteDirty = true"
          />
          <UiInput
            v-model="rewriteForm.audienceFocus"
            :label="t('ai.teacher.rewrite.audienceFocus')"
            :placeholder="t('ai.teacher.rewrite.audienceFocusHint')"
            @update:model-value="rewriteDirty = true"
          />
          <UiInput
            v-model="rewriteForm.language"
            :label="t('ai.teacher.rewrite.language')"
            :placeholder="t('ai.common.languagePlaceholder')"
            @update:model-value="rewriteDirty = true"
          />
        </div>
        <div class="teacher-lesson-ai__quick">
          <span class="teacher-lesson-ai__quick-label">{{ t('ai.teacher.quick.tone') }}</span>
          <div class="teacher-lesson-ai__quick-row">
            <button
              v-for="preset in tonePresets"
              :key="`rewrite-tone-${preset}`"
              type="button"
              class="teacher-lesson-ai__chip"
              @click="applyTonePreset(preset)"
            >
              {{ preset }}
            </button>
          </div>
          <span class="teacher-lesson-ai__quick-label">{{ t('ai.teacher.quick.audience') }}</span>
          <div class="teacher-lesson-ai__quick-row">
            <button
              v-for="preset in audiencePresets"
              :key="`rewrite-audience-${preset}`"
              type="button"
              class="teacher-lesson-ai__chip"
              @click="applyRewriteAudiencePreset(preset)"
            >
              {{ preset }}
            </button>
          </div>
        </div>
        <div class="teacher-lesson-ai__actions">
          <UiButton
            variant="link"
            color="secondary"
            @click="syncRewriteFromLesson"
            :disabled="rewriteLoading || !rewriteEnabled"
          >
            {{ t('ai.teacher.syncFromLesson') }}
          </UiButton>
          <div class="teacher-lesson-ai__actions-group">
            <UiButton
              variant="ghost"
              color="secondary"
              :disabled="rewriteLoading || !rewriteEnabled"
              @click="resetRewriteForm"
            >
              {{ t('ai.teacher.clearForm') }}
            </UiButton>
            <UiButton color="primary" :disabled="rewriteLoading || !rewriteEnabled" @click="runRewrite">
              {{
                rewriteLoading ? t('ai.common.generating') : t('ai.teacher.rewrite.generate')
              }}
            </UiButton>
          </div>
        </div>
        <UiAlert v-if="rewriteError" color="danger" variant="soft">{{ rewriteError }}</UiAlert>
        <div v-if="rewriteResult" class="teacher-lesson-ai__result">
          <header class="teacher-lesson-ai__result-header">
            <h5>{{ t('ai.teacher.rewrite.resultTitle') }}</h5>
            <div class="teacher-lesson-ai__result-meta">
              <UiTag v-if="rewriteResult.tone" color="secondary" size="sm">{{ rewriteResult.tone }}</UiTag>
              <UiTag v-if="rewriteResult.language" color="secondary" size="sm">{{ rewriteResult.language }}</UiTag>
            </div>
            <div class="teacher-lesson-ai__result-actions">
              <UiButton variant="link" color="primary" @click="copyText(rewriteResult.rewrittenContent)">
                {{ t('ai.common.copy') }}
              </UiButton>
            </div>
          </header>
          <p class="teacher-lesson-ai__summary-text">{{ rewriteResult.rewrittenContent }}</p>
          <UiAlert v-if="rewriteResult.rationale" color="info" variant="soft">
            {{ rewriteResult.rationale }}
          </UiAlert>
        </div>
      </div>

      <div v-else-if="activeTab === 'adapt' && adaptationEnabled" class="teacher-lesson-ai__section">
        <div class="teacher-lesson-ai__form-grid">
          <UiInput
            v-model="adaptationForm.lessonTitle"
            :label="t('ai.teacher.adapt.lessonTitle')"
            @update:model-value="adaptationDirty = true"
          />
          <UiTextarea
            v-model="adaptationForm.sourceContent"
            :rows="4"
            :label="t('ai.teacher.adapt.sourceContent')"
            @update:model-value="adaptationDirty = true"
          />
          <UiInput
            v-model="adaptationForm.targetLevel"
            :label="t('ai.teacher.adapt.targetLevel')"
            :placeholder="t('ai.teacher.adapt.targetLevelHint')"
            @update:model-value="adaptationDirty = true"
          />
          <UiInput
            v-model="adaptationForm.culturalContext"
            :label="t('ai.teacher.adapt.culturalContext')"
            :placeholder="t('ai.teacher.adapt.culturalContextHint')"
            @update:model-value="adaptationDirty = true"
          />
          <UiInput
            v-model="adaptationForm.language"
            :label="t('ai.teacher.adapt.language')"
            :placeholder="t('ai.common.languagePlaceholder')"
            @update:model-value="adaptationDirty = true"
          />
        </div>
        <div class="teacher-lesson-ai__quick">
          <span class="teacher-lesson-ai__quick-label">{{ t('ai.teacher.quick.level') }}</span>
          <div class="teacher-lesson-ai__quick-row">
            <button
              v-for="preset in levelPresets"
              :key="`adapt-level-${preset}`"
              type="button"
              class="teacher-lesson-ai__chip"
              @click="applyLevelPreset(preset)"
            >
              {{ preset }}
            </button>
          </div>
          <span class="teacher-lesson-ai__quick-label">{{ t('ai.teacher.quick.language') }}</span>
          <div class="teacher-lesson-ai__quick-row">
            <button
              v-for="preset in languagePresets"
              :key="`adapt-language-${preset}`"
              type="button"
              class="teacher-lesson-ai__chip"
              @click="applyAdaptationLanguagePreset(preset)"
            >
              {{ preset }}
            </button>
          </div>
        </div>
        <div class="teacher-lesson-ai__actions">
          <UiButton
            variant="link"
            color="secondary"
            @click="syncAdaptationFromLesson"
            :disabled="adaptationLoading || !adaptationEnabled"
          >
            {{ t('ai.teacher.syncFromLesson') }}
          </UiButton>
          <div class="teacher-lesson-ai__actions-group">
            <UiButton
              variant="ghost"
              color="secondary"
              :disabled="adaptationLoading || !adaptationEnabled"
              @click="resetAdaptationForm"
            >
              {{ t('ai.teacher.clearForm') }}
            </UiButton>
            <UiButton color="primary" :disabled="adaptationLoading || !adaptationEnabled" @click="runAdaptation">
              {{
                adaptationLoading ? t('ai.common.generating') : t('ai.teacher.adapt.generate')
              }}
            </UiButton>
          </div>
        </div>
        <UiAlert v-if="adaptationError" color="danger" variant="soft">{{ adaptationError }}</UiAlert>
        <div v-if="adaptationResult" class="teacher-lesson-ai__result">
          <header class="teacher-lesson-ai__result-header">
            <h5>{{ t('ai.teacher.adapt.resultTitle') }}</h5>
            <div class="teacher-lesson-ai__result-meta">
              <UiTag v-if="adaptationResult.readingLevel" color="secondary" size="sm">
                {{ adaptationResult.readingLevel }}
              </UiTag>
              <UiTag v-if="adaptationResult.language" color="secondary" size="sm">
                {{ adaptationResult.language }}
              </UiTag>
            </div>
            <div class="teacher-lesson-ai__result-actions">
              <UiButton variant="link" color="primary" @click="copyText(adaptationResult.adaptedContent)">
                {{ t('ai.common.copy') }}
              </UiButton>
            </div>
          </header>
          <p class="teacher-lesson-ai__summary-text">{{ adaptationResult.adaptedContent }}</p>
          <UiAlert v-if="adaptationResult.differentiationTips" color="info" variant="soft">
            {{ adaptationResult.differentiationTips }}
          </UiAlert>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/composables/useToast';
import UiTabs from '@/components/ui/UiTabs.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTag from '@/components/ui/UiTag.vue';
import { useFeaturesStore, FEATURE } from '@/stores/features';
import {
  generateLessonSummary,
  exportLessonSummaryPdf,
  rewriteLesson,
  adaptLesson,
  type LessonSummaryResult,
  type LessonRewriteResult,
  type LessonAdaptationResult
} from '@/services/ai';

const props = defineProps<{
  lessonId: number | null;
  lessonTitle: string;
  lessonContent: string;
}>();

const { t } = useI18n();
const toast = useToast();

const activeTab = ref<'summary' | 'rewrite' | 'adapt'>('summary');

const featuresStore = useFeaturesStore();

const summaryEnabled = computed(() => featuresStore.hasFeature(FEATURE.teacherSummarizer));
const rewriteEnabled = computed(() => featuresStore.hasFeature(FEATURE.teacherRewriter));
const adaptationEnabled = computed(() => featuresStore.hasFeature(FEATURE.teacherLevelAdapter));

const tabItems = computed(() => {
  const items: Array<{ value: 'summary' | 'rewrite' | 'adapt'; label: string }> = [];
  if (summaryEnabled.value) {
    items.push({ value: 'summary', label: t('ai.teacher.tabs.summary') });
  }
  if (rewriteEnabled.value) {
    items.push({ value: 'rewrite', label: t('ai.teacher.tabs.rewrite') });
  }
  if (adaptationEnabled.value) {
    items.push({ value: 'adapt', label: t('ai.teacher.tabs.adapt') });
  }
  return items;
});

const hasTeacherAiTools = computed(() => tabItems.value.length > 0);
const audiencePresets = ['Elementary', 'Middle School', 'High School', 'Adult Learners'];
const languagePresets = ['English', 'Arabic'];
const tonePresets = ['Friendly', 'Professional', 'Encouraging', 'Concise'];
const levelPresets = ['Grade 3-5', 'Grade 6-8', 'Grade 9-12', 'College'];

watch(
  tabItems,
  (items) => {
    if (!items.some((item) => item.value === activeTab.value)) {
      activeTab.value = items[0]?.value ?? 'summary';
    }
  },
  { immediate: true }
);

const hasLessonContext = computed(() => typeof props.lessonId === 'number' && props.lessonId > 0);

const summaryForm = reactive({
  lessonTitle: '',
  lessonBody: '',
  objectivesText: '',
  audience: '',
  language: '',
  includeKeyTakeaways: true
});
const rewriteForm = reactive({
  lessonTitle: '',
  originalContent: '',
  desiredTone: '',
  language: '',
  audienceFocus: ''
});
const adaptationForm = reactive({
  lessonTitle: '',
  sourceContent: '',
  targetLevel: '',
  language: '',
  culturalContext: ''
});

const lessonStats = computed(() => {
  const body = (props.lessonContent || '').trim();
  const words = body ? body.split(/\s+/).length : 0;
  const objectives = tokenizeList(summaryForm.objectivesText).length;
  const minutes = Math.max(1, Math.round(words / 180));
  return {
    wordCount: words.toLocaleString(),
    objectives: objectives || 0,
    readTime: t('ai.teacher.stats.minutes', { count: minutes })
  };
});

const summaryDirty = ref(false);
const rewriteDirty = ref(false);
const adaptationDirty = ref(false);

const summaryState = reactive<{ loading: boolean; error: string; result: LessonSummaryResult | null }>(
  { loading: false, error: '', result: null }
);
const rewriteState = reactive<{ loading: boolean; error: string; result: LessonRewriteResult | null }>(
  { loading: false, error: '', result: null }
);
const adaptationState = reactive<{
  loading: boolean;
  error: string;
  result: LessonAdaptationResult | null;
}>({ loading: false, error: '', result: null });

const downloadSummaryLoading = ref(false);

watch(
  () => props.lessonId,
  () => {
    syncSummaryFromLesson();
    syncRewriteFromLesson();
    syncAdaptationFromLesson();
    summaryForm.objectivesText = '';
    summaryForm.audience = '';
    summaryForm.language = '';
    summaryForm.includeKeyTakeaways = true;
    rewriteForm.desiredTone = '';
    rewriteForm.language = '';
    rewriteForm.audienceFocus = '';
    adaptationForm.targetLevel = '';
    adaptationForm.language = '';
    adaptationForm.culturalContext = '';
    summaryState.result = null;
    rewriteState.result = null;
    adaptationState.result = null;
  },
  { immediate: true }
);

watch(
  () => [props.lessonTitle, props.lessonContent],
  () => {
    if (!summaryDirty.value) {
      syncSummaryFromLesson();
    }
    if (!rewriteDirty.value) {
      syncRewriteFromLesson();
    }
    if (!adaptationDirty.value) {
      syncAdaptationFromLesson();
    }
  }
);

function syncSummaryFromLesson() {
  summaryForm.lessonTitle = props.lessonTitle ?? '';
  summaryForm.lessonBody = props.lessonContent ?? '';
  summaryDirty.value = false;
}

function syncRewriteFromLesson() {
  rewriteForm.lessonTitle = props.lessonTitle ?? '';
  rewriteForm.originalContent = props.lessonContent ?? '';
  rewriteDirty.value = false;
}

function syncAdaptationFromLesson() {
  adaptationForm.lessonTitle = props.lessonTitle ?? '';
  adaptationForm.sourceContent = props.lessonContent ?? '';
  adaptationDirty.value = false;
}

function resetSummaryForm() {
  syncSummaryFromLesson();
  summaryForm.objectivesText = '';
  summaryForm.audience = '';
  summaryForm.language = '';
  summaryForm.includeKeyTakeaways = true;
}

function resetRewriteForm() {
  syncRewriteFromLesson();
  rewriteForm.desiredTone = '';
  rewriteForm.language = '';
  rewriteForm.audienceFocus = '';
}

function resetAdaptationForm() {
  syncAdaptationFromLesson();
  adaptationForm.targetLevel = '';
  adaptationForm.language = '';
  adaptationForm.culturalContext = '';
}

function applyAudiencePreset(value: string) {
  summaryForm.audience = value;
  summaryDirty.value = true;
}

function applySummaryLanguagePreset(value: string) {
  summaryForm.language = value;
  summaryDirty.value = true;
}

function applyTonePreset(value: string) {
  rewriteForm.desiredTone = value;
  rewriteDirty.value = true;
}

function applyRewriteAudiencePreset(value: string) {
  rewriteForm.audienceFocus = value;
  rewriteDirty.value = true;
}

function applyLevelPreset(value: string) {
  adaptationForm.targetLevel = value;
  adaptationDirty.value = true;
}

function applyAdaptationLanguagePreset(value: string) {
  adaptationForm.language = value;
  adaptationDirty.value = true;
}

const summaryResult = computed(() => summaryState.result);
const summaryError = computed(() => summaryState.error);
const summaryLoading = computed(() => summaryState.loading);

const rewriteResult = computed(() => rewriteState.result);
const rewriteError = computed(() => rewriteState.error);
const rewriteLoading = computed(() => rewriteState.loading);

const adaptationResult = computed(() => adaptationState.result);
const adaptationError = computed(() => adaptationState.error);
const adaptationLoading = computed(() => adaptationState.loading);

const summaryPayload = computed(() => ({
  lessonTitle: summaryForm.lessonTitle.trim() || props.lessonTitle || '',
  lessonBody: summaryForm.lessonBody.trim() || props.lessonContent || '',
  objectives: tokenizeList(summaryForm.objectivesText),
  audience: summaryForm.audience.trim() || undefined,
  language: summaryForm.language.trim() || undefined,
  includeKeyTakeaways: summaryForm.includeKeyTakeaways
}));

const rewritePayload = computed(() => ({
  lessonTitle: rewriteForm.lessonTitle.trim() || props.lessonTitle || '',
  originalContent: rewriteForm.originalContent.trim() || props.lessonContent || '',
  desiredTone: rewriteForm.desiredTone.trim() || undefined,
  language: rewriteForm.language.trim() || undefined,
  audienceFocus: rewriteForm.audienceFocus.trim() || undefined
}));

const adaptationPayload = computed(() => ({
  lessonTitle: adaptationForm.lessonTitle.trim() || props.lessonTitle || '',
  sourceContent: adaptationForm.sourceContent.trim() || props.lessonContent || '',
  targetLevel: adaptationForm.targetLevel.trim() || '',
  language: adaptationForm.language.trim() || undefined,
  culturalContext: adaptationForm.culturalContext.trim() || undefined
}));

async function runSummary() {
  if (!hasLessonContext.value) {
    return;
  }
  if (!summaryEnabled.value) {
    summaryState.error = t('ai.common.forbidden');
    return;
  }
  summaryState.loading = true;
  summaryState.error = '';
  try {
    summaryState.result = await generateLessonSummary(props.lessonId!, summaryPayload.value);
  } catch (error) {
    summaryState.error = resolveError(error);
  } finally {
    summaryState.loading = false;
  }
}

async function downloadSummaryPdf() {
  if (!hasLessonContext.value) {
    return;
  }
  if (!summaryEnabled.value) {
    summaryState.error = t('ai.common.forbidden');
    return;
  }
  if (!summaryResult.value) {
    return;
  }
  downloadSummaryLoading.value = true;
  try {
    const payload = {
      lessonTitle: summaryPayload.value.lessonTitle,
      summary: summaryResult.value.summary,
      keyTakeaways: summaryResult.value.keyTakeaways,
      language: summaryResult.value.language || summaryPayload.value.language
    };
    const blob = await exportLessonSummaryPdf(props.lessonId!, payload);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lesson-summary-${props.lessonId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    summaryState.error = resolveError(error);
  } finally {
    downloadSummaryLoading.value = false;
  }
}

async function runRewrite() {
  if (!hasLessonContext.value) {
    return;
  }
  if (!rewriteEnabled.value) {
    rewriteState.error = t('ai.common.forbidden');
    return;
  }
  rewriteState.loading = true;
  rewriteState.error = '';
  try {
    rewriteState.result = await rewriteLesson(props.lessonId!, rewritePayload.value);
  } catch (error) {
    rewriteState.error = resolveError(error);
  } finally {
    rewriteState.loading = false;
  }
}

async function runAdaptation() {
  if (!hasLessonContext.value) {
    return;
  }
  if (!adaptationEnabled.value) {
    adaptationState.error = t('ai.common.forbidden');
    return;
  }
  if (!adaptationPayload.value.targetLevel) {
    adaptationState.error = t('ai.teacher.adapt.targetLevelRequired');
    return;
  }
  adaptationState.loading = true;
  adaptationState.error = '';
  try {
    adaptationState.result = await adaptLesson(props.lessonId!, adaptationPayload.value);
  } catch (error) {
    adaptationState.error = resolveError(error);
  } finally {
    adaptationState.loading = false;
  }
}

function tokenizeList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function resolveError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return t('ai.common.limitReached');
    }
    if (error.response?.status === 403) {
      return t('ai.common.forbidden');
    }
  }
  return t('ai.common.genericError');
}

async function copyText(value: string) {
  if (!value) {
    return;
  }
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    toast.success({ detail: t('ai.common.copySuccess') });
  } catch (error) {
    console.warn('[lesson-ai] copy failed', error);
    toast.error({ detail: t('ai.common.copyError') });
  }
}
</script>

<style scoped>
.teacher-lesson-ai {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 4%, var(--sakai-surface-100));
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 8%, var(--sakai-border-color));
}

.teacher-lesson-ai__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sakai-space-4);
}

.teacher-lesson-ai__description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: var(--sakai-font-size-sm);
}

.teacher-lesson-ai__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface);
  border: 1px dashed color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
}

.teacher-lesson-ai__stat {
  display: grid;
  gap: var(--sakai-space-1);
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
}

.teacher-lesson-ai__stat strong {
  font-size: 1rem;
  color: var(--sakai-text-color);
}

.teacher-lesson-ai__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
  padding: 0.35rem 0.75rem;
  border-radius: var(--sakai-border-radius-pill);
  background: color-mix(in srgb, var(--sakai-primary) 10%, transparent);
  color: var(--sakai-primary-700);
  font-size: var(--sakai-font-size-sm);
  white-space: nowrap;
}

.teacher-lesson-ai__notice {
  margin-bottom: var(--sakai-space-2);
}

.teacher-lesson-ai__section {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.teacher-lesson-ai__form-grid {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-lesson-ai__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.teacher-lesson-ai__actions-group {
  display: flex;
  gap: var(--sakai-space-2);
  align-items: center;
}

.teacher-lesson-ai__quick {
  display: grid;
  gap: var(--sakai-space-2);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-md);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
}

.teacher-lesson-ai__quick-label {
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-secondary);
}

.teacher-lesson-ai__quick-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

.teacher-lesson-ai__chip {
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 30%, transparent);
  border-radius: var(--sakai-border-radius-pill);
  padding: 0.3rem 0.75rem;
  background: var(--sakai-surface);
  color: var(--sakai-text-color);
  font-size: var(--sakai-font-size-sm);
  cursor: pointer;
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.teacher-lesson-ai__chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.teacher-lesson-ai__result {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-md);
  background: var(--sakai-surface);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
}

.teacher-lesson-ai__result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sakai-space-3);
  flex-wrap: wrap;
}

.teacher-lesson-ai__result-actions {
  display: flex;
  gap: var(--sakai-space-2);
}

.teacher-lesson-ai__result-meta {
  display: flex;
  gap: var(--sakai-space-2);
}

.teacher-lesson-ai__summary-text {
  white-space: pre-wrap;
  line-height: var(--sakai-line-height-lg);
}

.teacher-lesson-ai__takeaways ul {
  display: grid;
  gap: var(--sakai-space-2);
  padding-left: var(--sakai-space-5);
  margin: 0;
}

@media (min-width: 768px) {
  .teacher-lesson-ai__form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .teacher-lesson-ai__form-grid :deep(.ui-checkbox) {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  .teacher-lesson-ai__stats {
    grid-template-columns: 1fr;
  }
  .teacher-lesson-ai__actions {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sakai-space-2);
  }
}
</style>
