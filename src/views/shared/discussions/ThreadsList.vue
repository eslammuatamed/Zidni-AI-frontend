<template>
  <UiCard class="discussions-threads" :title="t('discussions.threads.title')">
    <div class="discussions-threads__filters">
      <UiInput
        v-model="filters.q"
        class="discussions-threads__search"
        :placeholder="t('discussions.threads.searchPlaceholder')"
        @keyup.enter="applySearch"
      />
      <UiSelect
        v-if="lessonOptions?.length"
        class="discussions-threads__lessons"
        :model-value="filters.lessonId ?? ''"
        :label="t('discussions.threads.lessonFilter')"
        @update:model-value="onLessonChange"
      >
        <option value="">{{ t('discussions.threads.allLessons') }}</option>
        <option v-for="option in lessonOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </UiSelect>
      <UiButton class="discussions-threads__apply" color="primary" variant="outline" @click="applySearch">
        {{ t('discussions.actions.filter') }}
      </UiButton>
    </div>

    <UiAlert v-if="!courseId" color="info" class="discussions-threads__empty">
      {{ t('discussions.threads.pickCourse') }}
    </UiAlert>

    <div v-else class="discussions-threads__list" :class="{ 'is-loading': loading }">
      <UiAlert v-if="errorMessage" color="danger" class="discussions-threads__error">
        {{ errorMessage }}
      </UiAlert>
      <UiAlert v-else-if="!loading && !threads.length" color="info" class="discussions-threads__empty">
        {{ t('discussions.threads.empty') }}
      </UiAlert>
      <button
        v-for="thread in threads"
        v-else
        :key="thread.id"
        type="button"
        class="discussions-threads__item"
        :class="{ 'is-active': thread.id === modelValue }"
        @click="selectThread(thread)"
      >
        <div class="discussions-threads__item-header">
          <h3 class="discussions-threads__item-title">{{ thread.title }}</h3>
          <UiBadge color="secondary">{{ thread.messageCount }}</UiBadge>
        </div>
        <p class="discussions-threads__item-meta">
          <span>{{ thread.createdByName }}</span>
          <span>•</span>
          <span>{{ formatDate(thread.createdAt) }}</span>
        </p>
        <p v-if="thread.lessonTitle" class="discussions-threads__item-lesson">{{ thread.lessonTitle }}</p>
      </button>
    </div>

    <div v-if="total > size && courseId" class="discussions-threads__pagination">
      <UiButton
        class="discussions-threads__page"
        variant="link"
        :disabled="page === 0 || loading"
        @click="previousPage"
      >
        {{ t('discussions.actions.previous') }}
      </UiButton>
      <span>{{ page + 1 }} / {{ totalPages }}</span>
      <UiButton
        class="discussions-threads__page"
        variant="link"
        :disabled="page >= totalPages - 1 || loading"
        @click="nextPage"
      >
        {{ t('discussions.actions.next') }}
      </UiButton>
    </div>

    <form v-if="courseId" class="discussions-threads__form" @submit.prevent="submitThread">
      <UiAlert v-if="formError" color="danger" class="discussions-threads__error">
        {{ formError }}
      </UiAlert>
      <UiInput v-model="form.title" :label="t('discussions.form.title')" required />
      <UiSelect
        v-if="lessonOptions?.length"
        :model-value="form.lessonId ?? ''"
        :label="t('discussions.form.lesson')"
        @update:model-value="onFormLessonChange"
      >
        <option value="">{{ t('discussions.form.lessonPlaceholder') }}</option>
        <option v-for="option in lessonOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </UiSelect>
      <UiButton
        class="discussions-threads__submit"
        button-type="submit"
        color="primary"
        :disabled="form.submitting"
      >
        {{ t('discussions.form.createThread') }}
      </UiButton>
    </form>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineExpose, defineProps, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import type { DiscussionThread } from '@/api/discussions';
import { createThread, listThreads } from '@/api/discussions';

interface LessonOption {
  value: number;
  label: string;
}

const props = defineProps<{
  courseId?: number | null;
  lessonOptions?: LessonOption[];
  modelValue?: number | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
  (e: 'select', value: DiscussionThread | null): void;
  (e: 'created', value: DiscussionThread): void;
}>();

const { t } = useI18n();

const loading = ref(false);
const threads = ref<DiscussionThread[]>([]);
const errorMessage = ref<string | null>(null);
const page = ref(0);
const size = ref(20);
const total = ref(0);

const filters = reactive<{ q: string; lessonId: number | null }>({ q: '', lessonId: null });

const form = reactive<{ title: string; lessonId: number | null; submitting: boolean }>({
  title: '',
  lessonId: null,
  submitting: false
});
const formError = ref<string | null>(null);

const totalPages = computed(() => {
  if (total.value === 0) return 1;
  return Math.ceil(total.value / size.value);
});

watch(
  () => props.courseId,
  () => {
    filters.q = '';
    filters.lessonId = null;
    page.value = 0;
    threads.value = [];
    if (!props.courseId) {
      total.value = 0;
      emit('update:modelValue', null);
      emit('select', null);
      form.lessonId = null;
      form.title = '';
      formError.value = null;
      return;
    }
    refresh();
  },
  { immediate: true }
);

async function refresh() {
  if (!props.courseId) {
    return;
  }
  loading.value = true;
  errorMessage.value = null;
  try {
    const response = await listThreads({
      courseId: props.courseId,
      lessonId: filters.lessonId === null ? undefined : filters.lessonId,
      q: filters.q || undefined,
      page: page.value,
      size: size.value
    });
    threads.value = response.items;
    total.value = response.total;
    if (threads.value.length && !threads.value.some((thread) => thread.id === props.modelValue)) {
      const first = threads.value[0];
      emit('update:modelValue', first.id);
      emit('select', first);
    }
    if (!threads.value.length) {
      emit('update:modelValue', null);
      emit('select', null);
    }
  } catch (error: any) {
    console.error('[ThreadsList] failed to load threads', error);
    errorMessage.value = t('discussions.errors.loadThreads');
    threads.value = [];
    total.value = 0;
    emit('update:modelValue', null);
    emit('select', null);
  } finally {
    loading.value = false;
  }
}

function applySearch() {
  page.value = 0;
  refresh();
}

function onLessonChange(value: string | number) {
  if (value === '' || value === null) {
    filters.lessonId = null;
  } else {
    filters.lessonId = Number(value);
  }
  applySearch();
}

function onFormLessonChange(value: string | number) {
  if (value === '' || value === null) {
    form.lessonId = null;
  } else {
    form.lessonId = Number(value);
  }
}

function selectThread(thread: DiscussionThread) {
  emit('update:modelValue', thread.id);
  emit('select', thread);
}

async function submitThread() {
  if (!props.courseId || !form.title.trim()) {
    return;
  }
  formError.value = null;
  form.submitting = true;
  try {
    const thread = await createThread({
      courseId: props.courseId,
      title: form.title,
      lessonId: form.lessonId
    });
    threads.value = [thread, ...threads.value];
    total.value += 1;
    form.title = '';
    form.lessonId = null;
    emit('created', thread);
    selectThread(thread);
  } catch (error: any) {
    console.error('[ThreadsList] failed to create thread', error);
    formError.value = t('discussions.errors.createThread');
  } finally {
    form.submitting = false;
  }
}

function previousPage() {
  if (page.value === 0) return;
  page.value -= 1;
  refresh();
}

function nextPage() {
  if (page.value >= totalPages.value - 1) return;
  page.value += 1;
  refresh();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

defineExpose({ refresh });
</script>

<style scoped>
.discussions-threads {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.discussions-threads__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
}

.discussions-threads__search {
  flex: 1 1 240px;
}

.discussions-threads__lessons {
  min-width: 200px;
}

.discussions-threads__apply {
  align-self: center;
}

.discussions-threads__list {
  display: grid;
  gap: 0.75rem;
}

.discussions-threads__list.is-loading {
  opacity: 0.6;
  pointer-events: none;
}

.discussions-threads__item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border: 1px solid var(--ui-border-color, #e0e0e0);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: transparent;
}

.discussions-threads__item:hover {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

.discussions-threads__item.is-active {
  border-color: var(--primary-color, #1677ff);
  box-shadow: 0 4px 16px rgba(22, 119, 255, 0.24);
}

.discussions-threads__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.discussions-threads__item-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.discussions-threads__item-meta {
  display: flex;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--ui-text-muted, #6b7280);
  margin: 0;
}

.discussions-threads__item-lesson {
  font-size: 0.85rem;
  color: var(--ui-text-muted, #6b7280);
  margin: 0;
}

.discussions-threads__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.discussions-threads__form {
  display: grid;
  gap: 0.75rem;
}

.discussions-threads__submit {
  justify-self: flex-start;
}

.discussions-threads__empty {
  text-align: center;
}

.discussions-threads__error {
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .discussions-threads__filters {
    flex-direction: column;
    align-items: stretch;
  }

  .discussions-threads__apply {
    align-self: stretch;
  }
}
</style>
