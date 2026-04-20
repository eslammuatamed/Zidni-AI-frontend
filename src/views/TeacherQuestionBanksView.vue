<template>
  <ThemePage :title="t('assessments.banksTitle')" :subtitle="banks.length ? t('assessments.banksSubtitle') : ''">
    <template #actions>
      <UiButton color="primary" prepend-icon="PlusOutlined" @click="openBankDialog()">
        {{ t('assessments.createBank') }}
      </UiButton>
    </template>

    <div class="teacher-banks grid gap-6">
      <aside class="teacher-banks__sidebar grid gap-4">
        <UiCard hover>
          <div class="teacher-banks__sidebar-header flex justify-between items-center gap-3">
            <h3>{{ t('assessments.banksTitle') }}</h3>
            <UiButton variant="outline" color="secondary" prepend-icon="ReloadOutlined" @click="reloadBanks">
              {{ t('assessments.refreshBanks') }}
            </UiButton>
          </div>
          <div class="teacher-banks__sidebar-controls grid gap-3">
            <UiInput
              v-model="bankSearch"
              appearance="search"
              clearable
              :placeholder="t('assessments.searchBanksPlaceholder')"
            />
            <UiSelect :model-value="bankSort" :label="t('assessments.sortLabel')" @update:model-value="onSortChange">
              <option value="recent">{{ t('assessments.sortOptions.recent') }}</option>
              <option value="alphabetical">{{ t('assessments.sortOptions.alphabetical') }}</option>
              <option value="questions">{{ t('assessments.sortOptions.questions') }}</option>
            </UiSelect>
          </div>
          <div v-if="availableTags.length || hasActiveFilters" class="teacher-banks__filters grid gap-2">
            <div class="teacher-banks__filters-header flex items-center justify-between text-[0.9rem] text-content-secondary">
              <span v-if="availableTags.length">{{ t('assessments.filterTagsLabel') }}</span>
              <UiButton
                v-if="hasActiveFilters"
                variant="link"
                color="secondary"
                prepend-icon="CloseCircleOutlined"
                @click="clearAllFilters"
              >
                {{ t('assessments.clearFilters') }}
              </UiButton>
            </div>
            <div v-if="availableTags.length" class="teacher-banks__tag-filters flex flex-wrap gap-2">
              <button
                v-for="tag in availableTags"
                :key="`filter-${tag}`"
                type="button"
                class="teacher-banks__filter-toggle"
                :aria-pressed="isTagActive(tag)"
                @click="toggleTagFilter(tag)"
              >
                <UiTag
                  :color="isTagActive(tag) ? 'primary' : 'secondary'"
                  :variant="isTagActive(tag) ? 'solid' : 'soft'"
                  size="sm"
                >
                  #{{ tag }}
                </UiTag>
              </button>
            </div>
          </div>
          <UiAlert v-if="banksError" color="danger" variant="soft">
            {{ errorMessage(banksError) }}
          </UiAlert>
          <div v-if="loadingBanks" class="teacher-banks__skeleton grid gap-3">
            <UiSkeleton v-for="index in 4" :key="index" height="48px" />
          </div>
          <template v-else>
            <ul v-if="sortedBanks.length" class="teacher-banks__list list-none p-0 m-0 grid gap-2">
              <li
                v-for="bank in sortedBanks"
                :key="bank.id"
                :class="['teacher-banks__item', { 'is-active': bank.id === selectedBankId }]"
                @click="selectBank(bank.id)"
              >
                <div class="teacher-banks__item-title font-semibold text-content">{{ bank.name || t('assessments.untitledBank') }}</div>
                <div class="teacher-banks__item-meta flex flex-col gap-2 text-content-tertiary text-[0.9rem]">
                  <span>{{ questionCountLabel(bank.questionCount) }}</span>
                  <span>{{ bankUpdatedLabel(bank.updatedAt) }}</span>
                  <div v-if="bank.tags.length" class="teacher-banks__item-tags flex flex-wrap gap-2">
                    <UiTag v-for="tag in bank.tags" :key="`${bank.id}-${tag}`" color="secondary" size="sm">
                      #{{ tag }}
                    </UiTag>
                  </div>
                </div>
              </li>
            </ul>
            <div v-else class="teacher-banks__empty text-center py-6 px-4 text-content-tertiary">{{ banksEmptyLabel }}</div>
          </template>
        </UiCard>
      </aside>

      <section class="teacher-banks__content grid gap-5">
        <UiCard hover>
          <template #title>
            {{ selectedBank?.name || t('assessments.selectPrompt') }}
          </template>
          <template #actions>
            <div v-if="selectedBank" class="teacher-banks__content-actions flex items-center gap-3">
              <UiTag color="primary" variant="soft" size="sm">
                {{ questionCountLabel(selectedBankQuestionCount) }}
              </UiTag>
              <UiButton variant="link" color="primary" prepend-icon="EditOutlined" @click="openBankDialog(selectedBank)">
                {{ t('common.edit') }}
              </UiButton>
              <UiButton
                variant="link"
                color="danger"
                prepend-icon="DeleteOutlined"
                @click="requestDeleteBank(selectedBank)"
              >
                {{ t('common.delete') }}
              </UiButton>
            </div>
          </template>

          <UiAlert v-if="bankError" color="danger" variant="soft">
            {{ errorMessage(bankError) }}
          </UiAlert>
          <div v-else-if="loadingBank" class="teacher-banks__skeleton grid gap-3">
            <UiSkeleton height="220px" />
            <UiSkeleton height="24px" />
          </div>
          <div v-else-if="selectedBank" class="teacher-banks__details grid gap-4">
            <div class="teacher-banks__details-header grid gap-3">
              <div class="teacher-banks__details-actions flex flex-wrap gap-2 justify-end">
                <UiButton color="primary" prepend-icon="PlusOutlined" @click="openQuestionDialog()">
                  {{ t('assessments.addQuestion') }}
                </UiButton>
                <UiButton
                  v-if="aiQuestionGeneratorEnabled"
                  variant="link"
                  color="primary"
                  prepend-icon="RobotOutlined"
                  @click="openAiDialog"
                >
                  {{ t('assessments.ai.openGenerator') }}
                </UiButton>
              </div>
              <div class="teacher-banks__details-filters grid gap-3">
                <UiInput
                  v-model="questionSearch"
                  appearance="search"
                  clearable
                  :placeholder="t('assessments.searchQuestionsPlaceholder')"
                />
                <UiSelect
                  :model-value="questionTypeFilter"
                  :label="t('assessments.questionTypeFilter')"
                  @update:model-value="onQuestionTypeFilterChange"
                >
                  <option value="all">{{ t('assessments.questionTypeAll') }}</option>
                  <option v-for="option in questionTypeItems" :key="option.value" :value="option.value">
                    {{ option.title }}
                  </option>
                </UiSelect>
                <UiSelect
                  :model-value="questionSort"
                  :label="t('assessments.questionSortLabel')"
                  @update:model-value="onQuestionSortChange"
                >
                  <option value="recent">{{ t('assessments.questionSort.recent') }}</option>
                  <option value="points_desc">{{ t('assessments.questionSort.pointsHigh') }}</option>
                  <option value="points_asc">{{ t('assessments.questionSort.pointsLow') }}</option>
                </UiSelect>
              </div>
            </div>
            <p v-if="selectedBank.description" class="teacher-banks__description m-0 text-content-secondary">
              {{ selectedBank.description }}
            </p>
            <p class="teacher-banks__bank-meta m-0 text-content-tertiary text-[0.9rem]">{{ bankUpdatedLabel(selectedBank.updatedAt) }}</p>
            <p class="teacher-banks__bank-meta m-0 text-content-tertiary text-[0.9rem]">
              {{ t('assessments.questionsShown', { shown: filteredQuestionCount, total: selectedBankQuestionCount }) }}
            </p>
            <div v-if="selectedBankTags.length" class="teacher-banks__tag-group flex flex-wrap gap-2">
              <UiTag v-for="tag in selectedBankTags" :key="`detail-tag-${tag}`" color="secondary" size="sm">
                #{{ tag }}
              </UiTag>
            </div>
            <UiAlert v-if="!selectedBank.questions.length" color="info" variant="soft">
              {{ t('assessments.noQuestions') }}
            </UiAlert>
            <UiAlert
              v-else-if="!questionAccordionItems.length"
              color="info"
              variant="soft"
            >
              {{ t('assessments.noQuestionsMatchFilters') }}
            </UiAlert>
            <UiAccordion
              v-else
              :items="questionAccordionItems"
              multiple
            >
              <template #header="{ item }">
                <div class="teacher-banks__question-header grid gap-2">
                  <span class="teacher-banks__question-title font-semibold text-content">{{ item.title }}</span>
                  <div class="teacher-banks__question-meta flex gap-3 text-[0.85rem] text-content-tertiary">
                    <span>{{ item.typeLabel }}</span>
                    <span>{{ item.points }} {{ t('assessments.pointsLabel') }}</span>
                  </div>
                  <div v-if="item.tags.length" class="teacher-banks__question-tags flex flex-wrap gap-2">
                    <UiTag v-for="tag in item.tags" :key="`${item.id}-${tag}`" color="secondary" size="sm">
                      #{{ tag }}
                    </UiTag>
                  </div>
                </div>
              </template>
              <template #content="{ item }">
                <div class="teacher-banks__question-body grid gap-4">
                  <div class="teacher-banks__question-actions flex flex-wrap gap-2 justify-end">
                    <UiButton
                      variant="link"
                      color="primary"
                      prepend-icon="EditOutlined"
                      @click="openQuestionDialog(item.question)"
                    >
                      {{ t('common.edit') }}
                    </UiButton>
                    <UiButton
                      variant="link"
                      color="danger"
                      prepend-icon="DeleteOutlined"
                      @click="requestDeleteQuestion(item.question)"
                    >
                      {{ t('common.delete') }}
                    </UiButton>
                  </div>
                  <div v-if="item.question.currentVersion?.options?.length" class="teacher-banks__options grid gap-2">
                    <div
                      v-for="(option, index) in item.question.currentVersion?.options"
                      :key="option.id"
                      :class="['teacher-banks__option', { 'is-correct': option.correct }]"
                    >
                      <div class="teacher-banks__option-text flex gap-2 text-content">
                        <strong>{{ getDisplayOptionLabel(option.label, option.key, index) }}.</strong>
                        <span>{{ option.text }}</span>
                      </div>
                      <UiTag v-if="option.correct" color="success" size="sm">
                        {{ t('assessments.correctAnswer') }}
                      </UiTag>
                    </div>
                  </div>
                  <div v-else class="teacher-banks__freeform text-content-tertiary">
                    {{ t('assessments.freeFormAnswer') }}
                  </div>
                  <p class="teacher-banks__version-meta text-content-tertiary text-[0.85rem]">
                    {{ t('assessments.versionCreated', { date: formatTimestamp(item.question.currentVersion?.createdAt) }) }}
                  </p>
                  <div v-if="item.question.history.length > 1" class="teacher-banks__history grid gap-2">
                    <h4>{{ t('assessments.versionHistory') }}</h4>
                    <ul class="teacher-banks__history-list list-none p-0 m-0 grid gap-2">
                      <li v-for="version in item.question.history" :key="version.id">
                        <div class="teacher-banks__history-row flex justify-between gap-2 text-[0.9rem] text-content">
                          <span>
                            {{ questionTypeLabel(version.type) }} · {{ version.points }} {{ t('assessments.pointsLabel') }}
                          </span>
                          <UiTag
                            v-if="version.id === item.question.currentVersion?.id"
                            color="primary"
                            size="sm"
                            variant="soft"
                          >
                            {{ t('assessments.versionCurrent') }}
                          </UiTag>
                        </div>
                        <small>{{ t('assessments.versionCreated', { date: formatTimestamp(version.createdAt) }) }}</small>
                      </li>
                    </ul>
                  </div>
                </div>
              </template>
            </UiAccordion>
          </div>
          <div v-else class="teacher-banks__placeholder text-center py-6 px-4 text-content-tertiary">{{ t('assessments.selectPrompt') }}</div>
        </UiCard>
      </section>
    </div>

    <UiDialog
      v-model="bankDialog.open"
      :title="bankDialog.mode === 'edit' ? t('assessments.editBank') : t('assessments.createBank')"
      width="480px"
    >
      <form class="teacher-banks__form grid gap-4" @submit.prevent="submitBank">
        <UiAlert v-if="bankDialog.error" color="danger" variant="soft">{{ bankDialog.error }}</UiAlert>
        <UiInput v-model="bankDialog.name" :label="t('assessments.bankName')" required />
        <UiTextarea v-model="bankDialog.description" :label="t('assessments.bankDescription')" :rows="3" />
        <div class="teacher-banks__dialog-actions flex justify-end gap-3">
          <UiButton variant="link" color="secondary" @click="closeBankDialog">{{ t('assessments.cancel') }}</UiButton>
          <UiButton button-type="submit" color="primary" :disabled="bankDialog.loading">
            {{ t('assessments.save') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model="bankDeleteDialog.open" :title="t('assessments.deleteBankTitle')" width="420px">
      <div class="teacher-banks__dialog-body grid gap-3">
        <UiAlert v-if="bankDeleteDialog.error" color="danger" variant="soft">{{ bankDeleteDialog.error }}</UiAlert>
        <p>{{ t('assessments.deleteBankConfirm', { name: bankDeleteDialog.name }) }}</p>
      </div>
      <template #footer>
        <div class="teacher-banks__dialog-actions flex justify-end gap-3">
          <UiButton variant="link" color="secondary" @click="closeBankDelete">{{ t('assessments.cancel') }}</UiButton>
          <UiButton color="danger" :disabled="bankDeleteDialog.loading" @click="confirmDeleteBank">
            {{ t('assessments.delete') }}
          </UiButton>
        </div>
      </template>
    </UiDialog>

    <UiDialog v-model="aiDialog.open" :title="t('assessments.ai.dialogTitle')" width="980px">
      <div class="teacher-banks__ai-layout grid gap-4">
        <form class="teacher-banks__form grid gap-4 teacher-banks__ai-form content-start" @submit.prevent="submitAiGeneration">
          <UiAlert v-if="aiDialog.error" color="danger" variant="soft">{{ aiDialog.error }}</UiAlert>
          <UiInput v-model="aiDialog.subject" :label="t('assessments.ai.subject')" required />
          <UiTextarea
            v-model="aiDialog.sourceMaterial"
            :rows="4"
            :label="t('assessments.ai.sourceMaterial')"
            :placeholder="t('assessments.ai.sourceHint')"
            required
          />
          <UiTextarea
            v-model="aiDialog.objectivesText"
            :rows="2"
            :label="t('assessments.ai.objectives')"
            :placeholder="t('assessments.ai.objectivesHint')"
          />
          <div class="teacher-banks__ai-grid grid gap-3">
            <UiInput
              v-model.number="aiDialog.questionCount"
              type="number"
              min="1"
              max="10"
              :label="t('assessments.ai.questionCount')"
            />
            <UiInput
              v-model="aiDialog.difficulty"
              :label="t('assessments.ai.difficulty')"
              :placeholder="t('assessments.ai.difficultyHint')"
            />
            <UiInput
              v-model="aiDialog.language"
              :label="t('assessments.ai.language')"
              :placeholder="t('ai.common.languagePlaceholder')"
            />
          </div>
          <div class="teacher-banks__ai-presets">
            <span>{{ t('assessments.ai.quickDifficulty') }}</span>
            <div class="teacher-banks__ai-chip-row flex flex-wrap gap-2">
              <button
                v-for="preset in aiDifficultyPresets"
                :key="`ai-difficulty-${preset}`"
                type="button"
                class="teacher-banks__ai-chip"
                @click="applyAiDifficulty(preset)"
              >
                {{ preset }}
              </button>
            </div>
          </div>
          <div class="teacher-banks__dialog-actions flex justify-end gap-3">
            <UiButton variant="link" color="secondary" @click="closeAiDialog">{{ t('assessments.cancel') }}</UiButton>
            <UiButton button-type="submit" color="primary" :disabled="aiDialog.loading">
              {{ aiDialog.loading ? t('ai.common.generating') : t('assessments.ai.generate') }}
            </UiButton>
          </div>
        </form>
        <div class="teacher-banks__ai-panel">
          <div class="teacher-banks__ai-results-header flex justify-between items-start gap-3">
            <div>
              <h4>{{ t('assessments.ai.resultsTitle', { count: aiDialog.result?.questions.length ?? 0 }) }}</h4>
              <p class="teacher-banks__ai-results-meta">
                {{ aiResultMeta }}
              </p>
            </div>
          </div>
          <div v-if="aiDialog.loading" class="teacher-banks__ai-loading">
            {{ t('ai.common.generating') }}
          </div>
          <p v-else-if="!aiDialog.result || !aiDialog.result.questions.length" class="teacher-banks__ai-empty m-0 text-content-secondary">
            {{ t('assessments.ai.emptyResults') }}
          </p>
          <ul v-else class="teacher-banks__ai-list grid gap-3 m-0 p-0 list-none">
            <li v-for="question in aiDialog.result.questions" :key="question.stem" class="teacher-banks__ai-item">
              <div class="teacher-banks__ai-content flex flex-col gap-2">
                <strong>{{ question.stem }}</strong>
                <p class="teacher-banks__ai-meta">{{ formatGeneratedMeta(question) }}</p>
                <ul v-if="question.options.length" class="teacher-banks__ai-options m-0 pl-4 grid gap-1">
                  <li v-for="option in question.options" :key="option.key">
                    <strong>{{ option.key }}.</strong>
                    <span>{{ option.text }}</span>
                  </li>
                </ul>
                <p v-if="question.explanation" class="teacher-banks__ai-explanation m-0 text-content-secondary italic">{{ question.explanation }}</p>
              </div>
              <UiButton variant="outline" color="primary" @click="useGeneratedQuestion(question)">
                {{ t('assessments.ai.useQuestion') }}
              </UiButton>
            </li>
          </ul>
        </div>
      </div>
    </UiDialog>

    <UiDialog
      v-model="questionDialog.open"
      :title="questionDialog.mode === 'edit' ? t('assessments.editQuestion') : t('assessments.addQuestion')"
      width="720px"
    >
      <form class="teacher-banks__form grid gap-4" @submit.prevent="submitQuestion">
        <UiAlert v-if="questionDialog.error" color="danger" variant="soft">{{ questionDialog.error }}</UiAlert>
        <UiInput v-model="questionDialog.stem" :label="t('assessments.questionStem')" required />
        <UiSelect
          :model-value="questionDialog.type"
          :label="t('assessments.questionType')"
          @update:model-value="onQuestionTypeChange"
        >
          <option v-for="option in questionTypeItems" :key="option.value" :value="option.value">{{ option.title }}</option>
        </UiSelect>
        <UiInput
          :model-value="questionDialog.points"
          type="number"
          min="1"
          :label="t('assessments.questionPoints')"
          @update:model-value="onQuestionPointsChange"
        />
        <UiSwitch
          v-model="questionDialog.shuffle"
          :label="t('assessments.shuffleOptions')"
          :disabled="questionDialog.type === 'short' || questionDialog.type === 'truefalse'"
        />

        <div v-if="questionDialog.type === 'mcq_single'" class="teacher-banks__option-editor grid gap-3">
          <div
            v-for="(option, index) in questionDialog.options"
            :key="option.key"
            class="teacher-banks__option-editor-row grid gap-3 items-center [grid-template-columns:auto_1fr_1fr_auto]"
          >
            <UiInput
              v-model="option.label"
              :label="t('assessments.optionLabel', { index: index + 1 })"
              class="teacher-banks__option-field w-full teacher-banks__option-field--label max-w-[120px]"
            />
            <UiInput
              v-model="option.text"
              :label="t('assessments.optionText')"
              class="teacher-banks__option-field w-full"
            />
            <UiButton
              variant="link"
              color="danger"
              prepend-icon="DeleteOutlined"
              :disabled="questionDialog.options.length <= 2"
              @click.prevent="removeOption(index)"
            >
              {{ t('common.delete') }}
            </UiButton>
          </div>
          <UiRadioGroup
            :model-value="questionDialog.singleCorrectKey"
            :options="radioOptionChoices"
            :label="t('assessments.correctAnswer')"
            orientation="horizontal"
            @update:model-value="onSingleCorrectChange"
          />
          <UiButton variant="link" color="primary" prepend-icon="PlusOutlined" @click.prevent="addOption">
            {{ t('assessments.addOption') }}
          </UiButton>
        </div>

        <div v-else-if="questionDialog.type === 'mcq_multi'" class="teacher-banks__option-editor grid gap-3">
          <div
            v-for="(option, index) in questionDialog.options"
            :key="option.key"
            class="teacher-banks__option-editor-row grid gap-3 items-center [grid-template-columns:auto_1fr_1fr_auto]"
          >
            <UiCheckbox v-model="option.correct" />
            <UiInput
              v-model="option.label"
              :label="t('assessments.optionLabel', { index: index + 1 })"
              class="teacher-banks__option-field w-full teacher-banks__option-field--label max-w-[120px]"
            />
            <UiInput
              v-model="option.text"
              :label="t('assessments.optionText')"
              class="teacher-banks__option-field w-full"
            />
            <UiButton
              variant="link"
              color="danger"
              prepend-icon="DeleteOutlined"
              :disabled="questionDialog.options.length <= 2"
              @click.prevent="removeOption(index)"
            >
              {{ t('common.delete') }}
            </UiButton>
          </div>
          <UiButton variant="link" color="primary" prepend-icon="PlusOutlined" @click.prevent="addOption">
            {{ t('assessments.addOption') }}
          </UiButton>
        </div>

        <UiRadioGroup
          v-else-if="questionDialog.type === 'truefalse'"
          :model-value="questionDialog.singleCorrectKey"
          :options="trueFalseOptions"
          :label="t('assessments.trueFalseLabel')"
          orientation="horizontal"
          @update:model-value="onSingleCorrectChange"
        />

        <UiAlert v-else color="info" variant="soft">{{ t('assessments.shortAnswerHint') }}</UiAlert>

        <div class="teacher-banks__dialog-actions flex justify-end gap-3">
          <UiButton variant="link" color="secondary" @click="closeQuestionDialog">{{ t('assessments.cancel') }}</UiButton>
          <UiButton button-type="submit" color="primary" :disabled="questionDialog.loading">
            {{ t('assessments.save') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model="questionDeleteDialog.open" :title="t('assessments.deleteQuestionTitle')" width="420px">
      <div class="teacher-banks__dialog-body grid gap-3">
        <UiAlert v-if="questionDeleteDialog.error" color="danger" variant="soft">
          {{ questionDeleteDialog.error }}
        </UiAlert>
        <p>{{ t('assessments.deleteQuestionConfirm', { title: questionDeleteDialog.stem }) }}</p>
      </div>
      <template #footer>
        <div class="teacher-banks__dialog-actions flex justify-end gap-3">
          <UiButton variant="link" color="secondary" @click="closeQuestionDelete">{{ t('assessments.cancel') }}</UiButton>
          <UiButton color="danger" :disabled="questionDeleteDialog.loading" @click="confirmDeleteQuestion">
            {{ t('assessments.delete') }}
          </UiButton>
        </div>
      </template>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import axios from 'axios';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useAssessmentsStore, type AssessmentError } from '@/stores/assessments';
import type { QuestionDetailResponse, QuestionType, QuestionBankDetailResponse } from '@/services/assessments';
import { useFeaturesStore, FEATURE } from '@/stores/features';
import type { QuestionGenerationResult, GeneratedQuestion } from '@/services/ai';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiAccordion from '@/components/ui/UiAccordion.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import UiRadioGroup from '@/components/ui/UiRadioGroup.vue';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';

interface OptionForm {
  key: string;
  label: string;
  text: string;
  correct: boolean;
}

const { t } = useI18n();
const assessments = useAssessmentsStore();
const features = useFeaturesStore();
const { banks, selectedBankId, selectedBank, loadingBanks, loadingBank, banksError, bankError } =
  storeToRefs(assessments);

const aiQuestionGeneratorEnabled = computed(
  () => features.hasFeature(FEATURE.aiTeacher) && features.hasFeature(FEATURE.teacherQuestionGenerator)
);

type BankSort = 'recent' | 'alphabetical' | 'questions';

const bankSearch = ref('');
const bankSort = ref<BankSort>('recent');
const tagFilters = ref<string[]>([]);
const questionSearch = ref('');
const questionTypeFilter = ref<'all' | QuestionType>('all');
const questionSort = ref<'recent' | 'points_desc' | 'points_asc'>('recent');

const normalizedSearch = computed(() => bankSearch.value.trim().toLowerCase());

const availableTags = computed(() => {
  const tagSet = new Set<string>();
  banks.value.forEach((bank) => {
    (bank.tags || []).forEach((tag) => {
      if (tag) {
        tagSet.add(tag);
      }
    });
  });
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
});

const filteredBanks = computed(() => {
  const query = normalizedSearch.value;
  const activeTags = tagFilters.value;
  return banks.value.filter((bank) => {
    const tags = bank.tags || [];
    const matchesSearch =
      !query ||
      [bank.name, bank.description, ...tags].some((value) =>
        (value || '').toString().toLowerCase().includes(query)
      );
    const matchesTags = !activeTags.length || activeTags.every((tag) => tags.includes(tag));
    return matchesSearch && matchesTags;
  });
});

const parseUpdatedAt = (value?: string | null) => {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortedBanks = computed(() => {
  const list = filteredBanks.value.slice();
  switch (bankSort.value) {
    case 'alphabetical':
      return list.sort((a, b) => {
        const nameA = (a.name || '').toLocaleLowerCase();
        const nameB = (b.name || '').toLocaleLowerCase();
        if (nameA === nameB) {
          return parseUpdatedAt(b.updatedAt) - parseUpdatedAt(a.updatedAt);
        }
        return nameA.localeCompare(nameB);
      });
    case 'questions':
      return list.sort((a, b) => {
        if (b.questionCount === a.questionCount) {
          return parseUpdatedAt(b.updatedAt) - parseUpdatedAt(a.updatedAt);
        }
        return b.questionCount - a.questionCount;
      });
    case 'recent':
    default:
      return list.sort((a, b) => parseUpdatedAt(b.updatedAt) - parseUpdatedAt(a.updatedAt));
  }
});

const hasActiveFilters = computed(() => Boolean(normalizedSearch.value) || tagFilters.value.length > 0);

const banksEmptyLabel = computed(() => {
  if (!banks.value.length) {
    return t('assessments.noBanks');
  }
  return hasActiveFilters.value ? t('assessments.noBanksMatchFilters') : t('assessments.noBanks');
});

const selectedBankTags = computed(() => selectedBank.value?.tags ?? []);
const selectedBankQuestionCount = computed(() => selectedBank.value?.questions.length ?? 0);
const filteredQuestionCount = computed(() => questionAccordionItems.value.length);

const questionTypeItems = computed(() => [
  { value: 'mcq_single' as QuestionType, title: t('assessments.types.MCQ_SINGLE') },
  { value: 'mcq_multi' as QuestionType, title: t('assessments.types.MCQ_MULTI') },
  { value: 'truefalse' as QuestionType, title: t('assessments.types.TRUEFALSE') },
  { value: 'short' as QuestionType, title: t('assessments.types.SHORT') }
]);

const trueFalseOptions = computed(() => [
  { value: 'true', label: t('assessments.trueLabel') },
  { value: 'false', label: t('assessments.falseLabel') }
]);

const questionAccordionItems = computed(() => {
  if (!selectedBank.value) {
    return [] as Array<{
      value: number;
      id: number;
      title: string;
      typeLabel: string;
      points: number;
      tags: string[];
      question: QuestionDetailResponse;
    }>;
  }
  const normalizedSearchTerm = questionSearch.value.trim().toLowerCase();
  let list = selectedBank.value.questions.slice();
  if (normalizedSearchTerm) {
    list = list.filter((question) => {
      const stem = question.currentVersion?.stem || '';
      return stem.toLowerCase().includes(normalizedSearchTerm);
    });
  }
  if (questionTypeFilter.value !== 'all') {
    list = list.filter((question) => question.currentVersion?.type === questionTypeFilter.value);
  }
  if (questionSort.value === 'points_desc') {
    list.sort((a, b) => (b.currentVersion?.points ?? 0) - (a.currentVersion?.points ?? 0));
  } else if (questionSort.value === 'points_asc') {
    list.sort((a, b) => (a.currentVersion?.points ?? 0) - (b.currentVersion?.points ?? 0));
  } else {
    list.sort(
      (a, b) => parseUpdatedAt(b.currentVersion?.createdAt) - parseUpdatedAt(a.currentVersion?.createdAt)
    );
  }
  return list.map((question, index) => ({
    value: question.id,
    id: question.id,
    title: question.currentVersion?.stem || questionFallback(index + 1),
    typeLabel: questionTypeLabel(question.currentVersion?.type),
    points: question.currentVersion?.points ?? 0,
    tags: question.tags,
    question
  }));
});

const radioOptionChoices = computed(() =>
  questionDialog.options.map((option) => ({ value: option.key, label: option.label || option.key.toUpperCase() }))
);

watch(availableTags, (tags) => {
  const allowed = new Set(tags);
  if (tagFilters.value.some((tag) => !allowed.has(tag))) {
    tagFilters.value = tagFilters.value.filter((tag) => allowed.has(tag));
  }
});

watch(
  () => selectedBankId.value,
  () => {
    questionSearch.value = '';
    questionTypeFilter.value = 'all';
    questionSort.value = 'recent';
  }
);

const bankDialog = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  bankId: null as number | null,
  name: '',
  description: '',
  loading: false,
  error: ''
});

const bankDeleteDialog = reactive({
  open: false,
  bankId: null as number | null,
  name: '',
  loading: false,
  error: ''
});

const questionDialog = reactive({
  open: false,
  mode: 'create' as 'create' | 'edit',
  bankId: 0,
  questionId: null as number | null,
  stem: '',
  type: 'mcq_single' as QuestionType,
  points: 1,
  shuffle: true,
  options: [] as OptionForm[],
  singleCorrectKey: '',
  loading: false,
  error: ''
});

const aiDialog = reactive({
  open: false,
  bankId: null as number | null,
  subject: '',
  sourceMaterial: '',
  objectivesText: '',
  language: '',
  questionCount: 3,
  difficulty: '',
  loading: false,
  error: '',
  result: null as QuestionGenerationResult | null
});

const questionDeleteDialog = reactive({
  open: false,
  bankId: null as number | null,
  questionId: null as number | null,
  stem: '',
  loading: false,
  error: ''
});

onMounted(async () => {
  if (!banks.value.length) {
    await assessments.loadBanks();
  }
});

const isTagActive = (tag: string) => tagFilters.value.includes(tag);

const selectBank = async (id: number) => {
  await assessments.selectBank(id);
};

const reloadBanks = async () => {
  await assessments.loadBanks();
};

const toggleTagFilter = (tag: string) => {
  if (isTagActive(tag)) {
    tagFilters.value = tagFilters.value.filter((value) => value !== tag);
  } else {
    tagFilters.value = [...tagFilters.value, tag];
  }
};

const clearAllFilters = () => {
  bankSearch.value = '';
  tagFilters.value = [];
};

const onSortChange = (value: string | number | null) => {
  const normalized = value ? String(value) : 'recent';
  if (normalized === 'alphabetical' || normalized === 'questions' || normalized === 'recent') {
    bankSort.value = normalized as BankSort;
  } else {
    bankSort.value = 'recent';
  }
};

const onQuestionTypeFilterChange = (value: string | number | null) => {
  questionTypeFilter.value = (value ? String(value) : 'all') as 'all' | QuestionType;
};

const onQuestionSortChange = (value: string | number | null) => {
  const normalized = value ? String(value) : 'recent';
  if (normalized === 'points_desc' || normalized === 'points_asc' || normalized === 'recent') {
    questionSort.value = normalized as typeof questionSort.value;
  } else {
    questionSort.value = 'recent';
  }
};

const questionCountLabel = (count: number) => t('assessments.questionsCount', { count });

const bankUpdatedLabel = (value?: string | null) => t('assessments.bankUpdatedAt', { value: formatTimestamp(value) });

const openAiDialog = () => {
  const bank = selectedBank.value;
  if (!bank || !aiQuestionGeneratorEnabled.value) {
    return;
  }
  aiDialog.open = true;
  aiDialog.bankId = bank.id;
  aiDialog.subject = bank.name || '';
  aiDialog.sourceMaterial = bank.description || '';
  aiDialog.objectivesText = selectedBankTags.value.join(', ');
  aiDialog.language = '';
  aiDialog.questionCount = 3;
  aiDialog.difficulty = '';
  aiDialog.error = '';
  aiDialog.result = null;
};

const closeAiDialog = () => {
  aiDialog.open = false;
  aiDialog.bankId = null;
};

const aiDifficultyPresets = ['Easy', 'Medium', 'Hard'];

const applyAiDifficulty = (value: string) => {
  aiDialog.difficulty = value;
};

const aiResultMeta = computed(() => {
  const provider = aiDialog.result?.providerModel;
  const language = aiDialog.result?.language;
  const parts: string[] = [];
  if (provider) {
    parts.push(t('assessments.ai.providerLabel', { provider }));
  }
  if (language) {
    parts.push(t('assessments.ai.languageLabel', { language }));
  }
  return parts.length ? parts.join(' · ') : t('assessments.ai.resultsMetaFallback');
});

const submitAiGeneration = async () => {
  if (!aiDialog.bankId) {
    return;
  }
  aiDialog.loading = true;
  aiDialog.error = '';
  try {
    const questionCount = clamp(
      Number.isFinite(aiDialog.questionCount) ? aiDialog.questionCount : 3,
      1,
      10
    );
    aiDialog.result = await assessments.generateAiQuestions(aiDialog.bankId, {
      subject: aiDialog.subject || selectedBank.value?.name || '',
      sourceMaterial: aiDialog.sourceMaterial,
      learningObjectives: tokenizeList(aiDialog.objectivesText),
      language: aiDialog.language || undefined,
      questionCount,
      difficulty: aiDialog.difficulty || undefined
    });
  } catch (error) {
    console.error('[assessments] failed to generate AI questions', error);
    aiDialog.error = resolveAiError(error);
  } finally {
    aiDialog.loading = false;
  }
};

const useGeneratedQuestion = (question: GeneratedQuestion) => {
  const bank = selectedBank.value;
  if (!bank) {
    return;
  }
  resetQuestionDialog();
  aiDialog.open = false;
  questionDialog.mode = 'create';
  questionDialog.bankId = bank.id;
  questionDialog.questionId = null;
  questionDialog.stem = question.stem;
  const type = mapGeneratedType(question.type);
  questionDialog.type = type;
  questionDialog.points = 1;
  questionDialog.shuffle = type !== 'truefalse' && type !== 'short';
  const options = buildOptionForms(question, type);
  questionDialog.options = options;
  applyCorrectAnswers(type, options, question.answerKey);
  questionDialog.error = '';
  questionDialog.loading = false;
  ensureQuestionOptionsForType(questionDialog.type);
  questionDialog.open = true;
};

const questionFallback = (id: number | null | undefined) =>
  t('assessments.questionFallback', { position: id ?? '?' });

const defaultOptionLabel = (index: number) => {
  if (index < 26) {
    return String.fromCharCode(65 + index);
  }
  const prefix = Math.floor(index / 26);
  const suffix = index % 26;
  return `${String.fromCharCode(65 + prefix - 1)}${String.fromCharCode(65 + suffix)}`;
};

const getDisplayOptionLabel = (label: string | null | undefined, key: string | null | undefined, index: number) => {
  if (label && !/^opt_[a-z0-9]+$/i.test(label)) {
    return label;
  }
  if (key === 'true') {
    return t('assessments.trueLabel');
  }
  if (key === 'false') {
    return t('assessments.falseLabel');
  }
  return defaultOptionLabel(index);
};

const generateOptionKey = () => `opt_${Math.random().toString(36).slice(2, 10)}`;

const ensureQuestionOptionsForType = (type: QuestionType) => {
  if (type === 'mcq_single' || type === 'mcq_multi') {
    if (!questionDialog.options.length) {
      questionDialog.options.push(
        {
          key: generateOptionKey(),
          label: defaultOptionLabel(0),
          text: '',
          correct: true
        },
        {
          key: generateOptionKey(),
          label: defaultOptionLabel(1),
          text: '',
          correct: false
        }
      );
    }
    questionDialog.options.forEach((option, index) => {
      if (!option.label) {
        option.label = defaultOptionLabel(index);
      }
    });
    if (type === 'mcq_single') {
      if (
        !questionDialog.singleCorrectKey ||
        !questionDialog.options.some((option) => option.key === questionDialog.singleCorrectKey)
      ) {
        const selected = questionDialog.options.find((option) => option.correct) || questionDialog.options[0];
        questionDialog.singleCorrectKey = selected?.key ?? '';
      }
      questionDialog.options.forEach((option) => {
        option.correct = option.key === questionDialog.singleCorrectKey;
      });
    }
    if (type !== 'short' && type !== 'truefalse' && questionDialog.mode === 'create') {
      questionDialog.shuffle = true;
    }
  } else if (type === 'truefalse') {
    const trueLabel = t('assessments.trueLabel');
    const falseLabel = t('assessments.falseLabel');
    const trueOption = questionDialog.options.find((option) => option.key === 'true');
    const falseOption = questionDialog.options.find((option) => option.key === 'false');
    const correctKey = ['true', 'false'].includes(questionDialog.singleCorrectKey)
      ? questionDialog.singleCorrectKey
      : trueOption?.correct
        ? 'true'
        : falseOption?.correct
          ? 'false'
          : 'true';
    questionDialog.options = [
      {
        key: 'true',
        label: trueLabel,
        text: trueOption?.text || trueLabel,
        correct: correctKey === 'true'
      },
      {
        key: 'false',
        label: falseLabel,
        text: falseOption?.text || falseLabel,
        correct: correctKey === 'false'
      }
    ];
    questionDialog.singleCorrectKey = correctKey;
    questionDialog.shuffle = false;
  } else {
    questionDialog.options = [];
    questionDialog.singleCorrectKey = '';
    questionDialog.shuffle = false;
  }
};

watch(
  () => questionDialog.type,
  (type) => {
    ensureQuestionOptionsForType(type);
  },
  { immediate: true }
);

watch(
  () => questionDialog.singleCorrectKey,
  (value) => {
    if (questionDialog.type === 'mcq_single' || questionDialog.type === 'truefalse') {
      questionDialog.options.forEach((option) => {
        option.correct = option.key === value;
      });
    }
  }
);

const onQuestionTypeChange = (value: string | number | null) => {
  questionDialog.type = (value ? String(value) : 'mcq_single') as QuestionType;
  ensureQuestionOptionsForType(questionDialog.type);
};

const onQuestionPointsChange = (value: string | number | null) => {
  const parsed = Number(value);
  questionDialog.points = Number.isNaN(parsed) ? 1 : Math.max(1, parsed);
};

const onSingleCorrectChange = (value: string | number | boolean) => {
  questionDialog.singleCorrectKey = String(value);
};

const openBankDialog = (bank?: QuestionBankDetailResponse | null) => {
  bankDialog.mode = bank ? 'edit' : 'create';
  bankDialog.bankId = bank?.id ?? null;
  bankDialog.name = bank?.name || '';
  bankDialog.description = bank?.description || '';
  bankDialog.error = '';
  bankDialog.loading = false;
  bankDialog.open = true;
};

const closeBankDialog = () => {
  bankDialog.open = false;
  bankDialog.mode = 'create';
  bankDialog.bankId = null;
  bankDialog.name = '';
  bankDialog.description = '';
  bankDialog.loading = false;
  bankDialog.error = '';
};

const submitBank = async () => {
  bankDialog.error = '';
  const name = bankDialog.name.trim();
  const description = bankDialog.description.trim();
  if (!name) {
    bankDialog.error = t('assessments.validation.bankName');
    return;
  }
  bankDialog.loading = true;
  try {
    if (bankDialog.mode === 'edit' && bankDialog.bankId) {
      await assessments.editBank(bankDialog.bankId, {
        name,
        description: description ? description : null
      });
    } else {
      await assessments.createBank({
        name,
        description: description ? description : undefined
      });
    }
    closeBankDialog();
  } catch (error) {
    console.error('[assessments] failed to save question bank', error);
    bankDialog.error = t('assessments.errors.saveBank');
  } finally {
    bankDialog.loading = false;
  }
};

const requestDeleteBank = (bank: QuestionBankDetailResponse) => {
  bankDeleteDialog.open = true;
  bankDeleteDialog.bankId = bank.id;
  bankDeleteDialog.name = bank.name || t('assessments.untitledBank');
  bankDeleteDialog.error = '';
  bankDeleteDialog.loading = false;
};

const closeBankDelete = () => {
  bankDeleteDialog.open = false;
  bankDeleteDialog.bankId = null;
  bankDeleteDialog.name = '';
  bankDeleteDialog.loading = false;
  bankDeleteDialog.error = '';
};

const confirmDeleteBank = async () => {
  if (!bankDeleteDialog.bankId) {
    return;
  }
  bankDeleteDialog.loading = true;
  bankDeleteDialog.error = '';
  try {
    await assessments.removeBank(bankDeleteDialog.bankId);
    closeBankDelete();
  } catch (error) {
    console.error('[assessments] failed to delete question bank', error);
    bankDeleteDialog.error = t('assessments.errors.deleteBank');
  } finally {
    bankDeleteDialog.loading = false;
  }
};

const resetQuestionDialog = () => {
  questionDialog.open = false;
  questionDialog.mode = 'create';
  questionDialog.bankId = 0;
  questionDialog.questionId = null;
  questionDialog.stem = '';
  questionDialog.type = 'mcq_single';
  questionDialog.points = 1;
  questionDialog.shuffle = true;
  questionDialog.options = [];
  questionDialog.singleCorrectKey = '';
  questionDialog.loading = false;
  questionDialog.error = '';
  ensureQuestionOptionsForType(questionDialog.type);
};

const openQuestionDialog = (question?: QuestionDetailResponse) => {
  const bank = selectedBank.value;
  if (!bank) {
    return;
  }
  questionDialog.mode = question ? 'edit' : 'create';
  questionDialog.bankId = bank.id;
  questionDialog.questionId = question?.id ?? null;
  const version = question?.currentVersion;
  questionDialog.stem = version?.stem ?? '';
  questionDialog.type = version?.type ?? 'mcq_single';
  questionDialog.points = version?.points ?? 1;
  questionDialog.shuffle = version?.shuffle ?? (questionDialog.type !== 'truefalse' && questionDialog.type !== 'short');
  questionDialog.options =
    version?.options?.map((option, index) => ({
      key: option.key,
      label: getDisplayOptionLabel(option.label, option.key, index),
      text: option.text,
      correct: option.correct
    })) ?? [];
  questionDialog.singleCorrectKey =
    questionDialog.type === 'mcq_single' || questionDialog.type === 'truefalse'
      ? questionDialog.options.find((option) => option.correct)?.key ?? ''
      : '';
  questionDialog.error = '';
  questionDialog.loading = false;
  questionDialog.open = true;
  ensureQuestionOptionsForType(questionDialog.type);
};

const closeQuestionDialog = () => {
  resetQuestionDialog();
};

const addOption = () => {
  if (questionDialog.type !== 'mcq_single' && questionDialog.type !== 'mcq_multi') {
    return;
  }
  const index = questionDialog.options.length;
  questionDialog.options.push({
    key: generateOptionKey(),
    label: defaultOptionLabel(index),
    text: '',
    correct: questionDialog.type === 'mcq_single' ? index === 0 : false
  });
  if (questionDialog.type === 'mcq_single' && !questionDialog.singleCorrectKey) {
    questionDialog.singleCorrectKey = questionDialog.options[0]?.key ?? '';
  }
};

const removeOption = (index: number) => {
  if (questionDialog.options.length <= 2) {
    return;
  }
  const [removed] = questionDialog.options.splice(index, 1);
  if (
    (questionDialog.type === 'mcq_single' || questionDialog.type === 'truefalse') &&
    removed.key === questionDialog.singleCorrectKey
  ) {
    questionDialog.singleCorrectKey = questionDialog.options[0]?.key ?? '';
  }
};

const requestDeleteQuestion = (question: QuestionDetailResponse) => {
  const bank = selectedBank.value;
  if (!bank) {
    return;
  }
  const index = bank.questions.findIndex((item) => item.id === question.id);
  questionDeleteDialog.open = true;
  questionDeleteDialog.bankId = bank.id;
  questionDeleteDialog.questionId = question.id;
  questionDeleteDialog.stem =
    question.currentVersion?.stem || questionFallback(index >= 0 ? index + 1 : question.id);
  questionDeleteDialog.error = '';
  questionDeleteDialog.loading = false;
};

const closeQuestionDelete = () => {
  questionDeleteDialog.open = false;
  questionDeleteDialog.bankId = null;
  questionDeleteDialog.questionId = null;
  questionDeleteDialog.stem = '';
  questionDeleteDialog.loading = false;
  questionDeleteDialog.error = '';
};

const confirmDeleteQuestion = async () => {
  if (!questionDeleteDialog.bankId || !questionDeleteDialog.questionId) {
    return;
  }
  questionDeleteDialog.loading = true;
  questionDeleteDialog.error = '';
  try {
    await assessments.removeQuestion(questionDeleteDialog.bankId, questionDeleteDialog.questionId);
    closeQuestionDelete();
  } catch (error) {
    console.error('[assessments] failed to delete question', error);
    questionDeleteDialog.error = t('assessments.errors.deleteQuestion');
  } finally {
    questionDeleteDialog.loading = false;
  }
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const tokenizeList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const mapGeneratedType = (raw?: string | null): QuestionType => {
  switch ((raw || '').toUpperCase()) {
    case 'MCQ_MULTI':
      return 'mcq_multi';
    case 'TRUEFALSE':
      return 'truefalse';
    case 'SHORT':
      return 'short';
    default:
      return 'mcq_single';
  }
};

const parseAnswerKeys = (value?: string | null) =>
  (value || '')
    .split(/[\s,;]+/)
    .map((key) => key.trim().toUpperCase())
    .filter((key) => key.length > 0);

const buildFallbackOptions = (type: QuestionType) => {
  if (type === 'truefalse') {
    return [
      { key: 'true', text: t('assessments.trueLabel') },
      { key: 'false', text: t('assessments.falseLabel') }
    ];
  }
  return [] as Array<{ key: string; text: string }>;
};

const buildOptionForms = (question: GeneratedQuestion, type: QuestionType): OptionForm[] => {
  const answers = parseAnswerKeys(question.answerKey);
  const source = question.options.length ? question.options : buildFallbackOptions(type);
  return source.map((option, index) => {
    const key = (option.key || defaultOptionLabel(index)).trim();
    const label = option.key?.trim() || defaultOptionLabel(index);
    const normalized = key.toUpperCase();
    const isCorrect = answers.includes(normalized);
    return {
      key,
      label,
      text: option.text,
      correct: isCorrect
    };
  });
};

const applyCorrectAnswers = (
  type: QuestionType,
  options: OptionForm[],
  answerKey?: string | null
) => {
  const answers = parseAnswerKeys(answerKey);
  if (type === 'mcq_single' || type === 'truefalse') {
    const match = options.find((option) => answers.includes(option.key.toUpperCase())) || options[0];
    questionDialog.singleCorrectKey = match?.key ?? '';
    options.forEach((option) => {
      option.correct = option.key === questionDialog.singleCorrectKey;
    });
  } else if (type === 'mcq_multi') {
    questionDialog.singleCorrectKey = '';
    options.forEach((option) => {
      option.correct = answers.includes(option.key.toUpperCase());
    });
    if (!options.some((option) => option.correct) && options.length) {
      options[0].correct = true;
    }
  } else {
    questionDialog.singleCorrectKey = '';
    options.forEach((option) => {
      option.correct = false;
    });
  }
};

const formatGeneratedMeta = (question: GeneratedQuestion) => {
  const parts: string[] = [];
  if (question.difficulty) {
    parts.push(t('assessments.ai.difficultyLabel', { difficulty: question.difficulty }));
  }
  const normalizedType = mapGeneratedType(question.type);
  parts.push(questionTypeLabel(normalizedType));
  if (question.answerKey) {
    parts.push(t('assessments.ai.answerKeyLabel', { answer: question.answerKey }));
  }
  return parts.join(' · ');
};

const resolveAiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return t('ai.common.limitReached');
    }
    if (error.response?.status === 403) {
      return t('ai.common.forbidden');
    }
    if (error.response?.status === 400) {
      return t('ai.common.invalidRequest');
    }
  }
  return t('ai.common.genericError');
};

const submitQuestion = async () => {
  const bankId = questionDialog.bankId;
  if (!bankId) {
    return;
  }
  questionDialog.error = '';
  const stem = questionDialog.stem.trim();
  if (!stem) {
    questionDialog.error = t('assessments.validation.stem');
    return;
  }
  const points = Number.isFinite(questionDialog.points) ? questionDialog.points : 0;
  if (!points || points <= 0) {
    questionDialog.error = t('assessments.validation.pointsPositive');
    return;
  }

  let optionsPayload: { key: string; label?: string | null; text: string }[] | null = null;
  let correctOptionKeys: string[] | null = null;
  if (questionDialog.type === 'mcq_single' || questionDialog.type === 'mcq_multi') {
    if (questionDialog.options.length < 2) {
      questionDialog.error = t('assessments.validation.options');
      return;
    }
    if (questionDialog.type === 'mcq_single') {
      if (
        !questionDialog.singleCorrectKey ||
        !questionDialog.options.some((option) => option.key === questionDialog.singleCorrectKey)
      ) {
        questionDialog.error = t('assessments.validation.correctRequired');
        return;
      }
      correctOptionKeys = [questionDialog.singleCorrectKey];
    } else {
      const correctKeys = questionDialog.options.filter((option) => option.correct).map((option) => option.key);
      if (!correctKeys.length) {
        questionDialog.error = t('assessments.validation.correctRequired');
        return;
      }
      correctOptionKeys = correctKeys;
    }
    for (const option of questionDialog.options) {
      if (!option.text.trim()) {
        questionDialog.error = t('assessments.validation.optionText');
        return;
      }
    }
    optionsPayload = questionDialog.options.map((option) => ({
      key: option.key,
      label: option.label,
      text: option.text.trim()
    }));
  } else if (questionDialog.type === 'truefalse') {
    optionsPayload = questionDialog.options.map((option) => ({
      key: option.key,
      label: option.label,
      text: option.text
    }));
    correctOptionKeys = [questionDialog.singleCorrectKey || 'true'];
  }

  questionDialog.loading = true;
  try {
    if (questionDialog.mode === 'edit' && questionDialog.questionId) {
      await assessments.editQuestion(bankId, questionDialog.questionId, {
        stem,
        type: questionDialog.type,
        points,
        shuffle: questionDialog.type === 'short' ? false : questionDialog.shuffle,
        options: questionDialog.type === 'short' ? null : optionsPayload,
        correctOptionKeys: questionDialog.type === 'short' ? null : correctOptionKeys
      });
    } else {
      await assessments.addQuestion(bankId, {
        stem,
        type: questionDialog.type,
        points,
        shuffle: questionDialog.type === 'short' ? false : questionDialog.shuffle,
        options: questionDialog.type === 'short' ? null : optionsPayload ?? [],
        correctOptionKeys: questionDialog.type === 'short' ? null : correctOptionKeys ?? []
      });
    }
    resetQuestionDialog();
  } catch (error) {
    console.error('[assessments] failed to save question', error);
    questionDialog.error = t('assessments.errors.saveQuestion');
  } finally {
    questionDialog.loading = false;
  }
};

const questionTypeLabel = (type?: string | null) => {
  const normalized = (type || 'UNKNOWN').toUpperCase();
  const key = `assessments.types.${normalized}`;
  const translated = t(key);
  return translated === key ? normalized : translated;
};

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
};

const errorMessage = (kind: AssessmentError | null) => {
  if (!kind) {
    return '';
  }
  const key = `assessments.errors.${kind}`;
  const translated = t(key);
  return translated === key ? t('assessments.errors.network') : translated;
};
</script>

<style scoped>
.teacher-banks__filter-toggle {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.teacher-banks__filter-toggle:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--sakai-primary) 55%, transparent);
  outline-offset: 2px;
  border-radius: var(--sakai-border-radius-lg);
}

.teacher-banks__item {
  padding: var(--sakai-space-3);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  display: grid;
  gap: var(--sakai-space-2);
  cursor: pointer;
  transition: border-color var(--sakai-transition-duration) var(--sakai-transition-ease),
    background-color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.teacher-banks__item:hover {
  border-color: color-mix(in srgb, var(--sakai-primary) 35%, transparent);
}

.teacher-banks__item.is-active {
  border-color: var(--sakai-primary);
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
}

.teacher-banks__option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
}

.teacher-banks__option.is-correct {
  border-color: var(--sakai-success);
  background: color-mix(in srgb, var(--sakai-success) 12%, transparent);
}

.teacher-banks__ai-panel {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 65%, transparent);
  background: var(--sakai-surface);
  min-height: 320px;
  max-height: min(70vh, 720px);
  overflow: auto;
}

.teacher-banks__ai-presets {
  display: grid;
  gap: var(--sakai-space-2);
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-md);
  border: 1px dashed color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  color: var(--sakai-text-color-secondary);
  font-size: var(--sakai-font-size-sm);
}

.teacher-banks__ai-chip {
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 30%, transparent);
  border-radius: var(--sakai-border-radius-pill);
  padding: 0.3rem 0.75rem;
  background: var(--sakai-surface);
  color: var(--sakai-text-color);
  font-size: var(--sakai-font-size-sm);
  cursor: pointer;
}

.teacher-banks__ai-loading {
  padding: var(--sakai-space-3);
  border-radius: var(--sakai-border-radius-md);
  background: color-mix(in srgb, var(--sakai-primary) 10%, transparent);
  color: var(--sakai-text-color-secondary);
  font-size: var(--sakai-font-size-sm);
}

.teacher-banks__ai-results-meta {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: var(--sakai-font-size-sm);
}

.teacher-banks__ai-item {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 55%, transparent);
  border-radius: var(--sakai-border-radius-md);
  background: var(--sakai-surface);
}

.teacher-banks__ai-item > .ui-button {
  align-self: flex-end;
}

.teacher-banks__ai-meta {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: var(--sakai-font-size-sm);
}

@media (min-width: 768px) {
  .teacher-banks__ai-layout {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    align-items: start;
  }
  .teacher-banks__ai-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .teacher-banks__details-header {
    grid-template-columns: minmax(0, 1fr);
  }
  .teacher-banks__details-filters {
    grid-template-columns: 1.4fr 1fr 1fr;
  }
  .teacher-banks__ai-item {
    flex-direction: row;
    align-items: flex-start;
  }
  .teacher-banks__ai-item > .ui-button {
    margin-left: auto;
  }
}

@media (min-width: 1024px) {
  .teacher-banks {
    grid-template-columns: 320px 1fr;
  }
}
</style>
