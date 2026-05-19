<template>
  <article class="student-assignment-card">
    <header class="student-assignment-card__header">
      <div class="student-assignment-card__title-block">
        <h3 class="student-assignment-card__title">{{ assignment.title }}</h3>
        <p class="student-assignment-card__meta">
          {{ assignment.lessonTitle }}
        </p>
      </div>
      <UiTag size="sm" :color="statusColor">
        {{ t(`teacher.assignments.status.${statusKey}`) }}
      </UiTag>
    </header>

    <p v-if="assignment.description" class="student-assignment-card__description">
      {{ assignment.description }}
    </p>

    <dl class="student-assignment-card__details">
      <div class="student-assignment-card__detail">
        <dt>{{ t('student.assignments.columns.dueAt') }}</dt>
        <dd>
          <span v-if="assignment.dueAt">{{ formatDateTime(assignment.dueAt) }}</span>
          <span v-else class="student-assignment-card__muted">
            {{ t('student.assignments.due.noDueDate') }}
          </span>
        </dd>
      </div>
      <div class="student-assignment-card__detail">
        <dt>{{ t('student.assignments.columns.maxScore') }}</dt>
        <dd>{{ assignment.maxScore }}</dd>
      </div>
      <div v-if="isSubmitted" class="student-assignment-card__detail">
        <dt>{{ t('student.assignments.result.submittedAt') }}</dt>
        <dd>{{ formatDateTime(assignment.submittedAt ?? '') }}</dd>
      </div>
      <div v-if="isGraded" class="student-assignment-card__detail">
        <dt>{{ t('student.assignments.columns.score') }}</dt>
        <dd class="student-assignment-card__score">
          {{ assignment.score ?? 0 }} / {{ assignment.maxScore }}
        </dd>
      </div>
      <div
        v-if="assignment.attachments?.length"
        class="student-assignment-card__detail student-assignment-card__detail--full"
      >
        <dt>{{ t('student.assignments.columns.attachments') }}</dt>
        <dd>
          <AssignmentAttachmentList
            :attachments="assignment.attachments"
            :removable="false"
          />
        </dd>
      </div>
    </dl>

    <UiAlert
      v-if="showFeedback"
      :color="feedbackColor"
      variant="soft"
      class="student-assignment-card__feedback"
    >
      <strong class="student-assignment-card__feedback-heading">
        {{ t('student.assignments.result.feedback') }}
      </strong>
      <p class="student-assignment-card__feedback-body">
        {{ assignment.feedback }}
      </p>
    </UiAlert>

    <footer v-if="primaryAction" class="student-assignment-card__actions">
      <UiButton
        :color="primaryAction.color"
        :prepend-icon="primaryAction.icon"
        @click="onPrimaryAction"
      >
        {{ primaryAction.label }}
      </UiButton>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiButton from '@/components/ui/UiButton.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import AssignmentAttachmentList from '@/components/shared/assignments/AssignmentAttachmentList.vue';
import { formatDateTime } from '@/utils/formatters';
import type { Assignment } from '@/services/learning';

const props = defineProps<{
  assignment: Assignment;
}>();

const emit = defineEmits<{
  submit: [assignment: Assignment];
}>();

const { t } = useI18n();

const status = computed(() => props.assignment.submissionStatus ?? null);

const statusKey = computed(() => {
  const value = status.value;
  if (value === 'resubmission_requested') return 'resubmissionRequested';
  if (value === null) return 'notSubmitted';
  return value;
});

const statusColor = computed<'info' | 'warning' | 'success' | 'secondary'>(() => {
  const value = status.value;
  if (value === 'graded') return 'success';
  if (value === 'resubmission_requested') return 'warning';
  if (value === 'submitted') return 'info';
  return 'secondary';
});

const isSubmitted = computed(
  () => status.value !== null && Boolean(props.assignment.submittedAt)
);
const isGraded = computed(() => status.value === 'graded');

const showFeedback = computed(() => {
  if (!props.assignment.feedback) return false;
  return status.value === 'resubmission_requested' || status.value === 'graded';
});

const feedbackColor = computed<'warning' | 'success'>(() =>
  status.value === 'graded' ? 'success' : 'warning'
);

type Action = {
  label: string;
  color: 'primary';
  icon: string;
};

const primaryAction = computed<Action | null>(() => {
  const value = status.value;
  if (value === null) {
    return {
      label: t('student.assignments.actions.submit'),
      color: 'primary',
      icon: 'UploadOutlined'
    };
  }
  if (value === 'resubmission_requested') {
    return {
      label: t('student.assignments.actions.resubmit'),
      color: 'primary',
      icon: 'UploadOutlined'
    };
  }
  return null;
});

function onPrimaryAction() {
  if (!primaryAction.value) return;
  emit('submit', props.assignment);
}
</script>

<style scoped>
.student-assignment-card {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
  background: color-mix(in srgb, var(--sakai-surface) 96%, transparent);
}

.student-assignment-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.student-assignment-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.student-assignment-card__meta {
  margin: var(--sakai-space-1) 0 0;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.student-assignment-card__description {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  line-height: 1.5;
}

.student-assignment-card__details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--sakai-space-3);
  margin: 0;
}

.student-assignment-card__detail {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.student-assignment-card__detail--full {
  grid-column: 1 / -1;
}

.student-assignment-card__detail dt {
  font-size: 0.8rem;
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.student-assignment-card__detail dd {
  margin: 0;
  color: var(--sakai-text-color);
  font-size: 0.95rem;
}

.student-assignment-card__score {
  font-weight: var(--sakai-font-weight-semibold);
}

.student-assignment-card__muted {
  color: var(--sakai-text-color-tertiary);
}

.student-assignment-card__feedback {
  margin: 0;
}

.student-assignment-card__feedback-heading {
  display: block;
  font-size: 0.85rem;
  margin-bottom: var(--sakai-space-1);
  color: var(--sakai-text-color);
}

.student-assignment-card__feedback-body {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
  color: var(--sakai-text-color);
}

.student-assignment-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}
</style>
