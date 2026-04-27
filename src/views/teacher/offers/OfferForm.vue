<template>
  <form class="offer-form" @submit.prevent="handleSubmit">
    <UiInput
      v-if="mode === 'create'"
      v-model="form.code"
      :label="t('offers.form.code')"
      maxlength="32"
      required
    />

    <UiInput v-model="form.name" :label="t('offers.form.name')" required />

    <UiTextarea v-model="form.description" :label="t('offers.form.description')" :rows="3" />

    <UiSelect
      :model-value="form.publishMode"
      :label="t('offers.form.publishMode')"
      @update:model-value="onPublishModeChange"
    >
      <option v-for="option in publishModeOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </UiSelect>

    <UiSelect :model-value="form.type" :label="t('offers.form.type')" @update:model-value="onTypeChange">
      <option v-for="option in typeOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </UiSelect>

    <UiSelect
      :model-value="form.applicability"
      :label="t('offers.form.applicability')"
      :disabled="form.type === 'BUNDLE'"
      @update:model-value="onApplicabilityChange"
    >
      <option v-for="option in applicabilityOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </UiSelect>

    <UiInput
      v-if="form.type === 'PERCENTAGE'"
      :model-value="form.percentage ?? ''"
      type="number"
      min="1"
      max="100"
      step="1"
      :label="t('offers.form.percentage')"
      required
      @update:model-value="onPercentageChange"
    />

    <UiInput
      v-if="form.type === 'FIXED'"
      :model-value="form.amount ?? ''"
      type="number"
      min="0"
      step="0.01"
      :label="t('offers.form.amount')"
      required
      @update:model-value="onAmountChange"
    />

    <UiInput
      v-if="form.type === 'BUNDLE'"
      :model-value="form.bundlePrice ?? ''"
      type="number"
      min="0"
      step="0.01"
      :label="t('offers.form.bundlePrice')"
      required
      @update:model-value="onBundlePriceChange"
    />

    <UiInput
      v-model="form.validFrom"
      type="datetime-local"
      appearance="datetime"
      :label="t('offers.form.validFrom')"
      required
    />

    <UiInput
      v-model="form.validUntil"
      type="datetime-local"
      appearance="datetime"
      :label="t('offers.form.validUntil')"
    />

    <UiSelect
      v-if="requiresCourses"
      :model-value="courseIdsValue"
      :label="t('offers.form.courses')"
      multiple
      clearable
      @update:model-value="onCourseIdsChange"
    >
      <option v-for="course in courses" :key="course.id" :value="String(course.id)">
        {{ course.title }}
      </option>
    </UiSelect>

    <div class="offer-form__actions">
      <UiButton type="button" variant="link" color="secondary" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UiButton>
      <UiButton button-type="submit" color="primary" :disabled="props.submitting">
        {{ t('common.save') }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiButton from '@/components/ui/UiButton.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import type {
  OfferApplicability,
  OfferPayload,
  OfferPublishMode,
  OfferResponse,
  OfferType
} from '@/api/offers';

type CourseOption = {
  id: number;
  title: string;
};

interface FormState {
  code: string;
  name: string;
  description: string;
  publishMode: OfferPublishMode;
  type: OfferType;
  applicability: OfferApplicability;
  percentage: number | null;
  amount: number | null;
  bundlePrice: number | null;
  validFrom: string;
  validUntil: string;
  courseIds: number[];
}

const props = defineProps<{
  mode: 'create' | 'edit';
  offer?: OfferResponse | null;
  courses: CourseOption[];
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'submit', payload: OfferPayload & { code?: string }): void;
}>();

const { t } = useI18n();

const form = reactive<FormState>({
  code: '',
  name: '',
  description: '',
  publishMode: 'PUBLIC',
  type: 'PERCENTAGE',
  applicability: 'ALL_COURSES',
  percentage: null,
  amount: null,
  bundlePrice: null,
  validFrom: '',
  validUntil: '',
  courseIds: []
});

const typeOptions = computed(() => [
  { value: 'PERCENTAGE', label: t('offers.types.percentage') },
  { value: 'FIXED', label: t('offers.types.fixed') },
  { value: 'BUNDLE', label: t('offers.types.bundle') }
]);

const publishModeOptions = computed(() => [
  { value: 'PUBLIC', label: t('offers.publishMode.public') },
  { value: 'PRIVATE', label: t('offers.publishMode.private') }
]);

const applicabilityOptions = computed(() => [
  { value: 'ALL_COURSES', label: t('offers.applicability.all') },
  { value: 'SPECIFIC_COURSES', label: t('offers.applicability.specific') }
]);

const requiresCourses = computed(
  () => form.applicability === 'SPECIFIC_COURSES' || form.type === 'BUNDLE'
);

const courseIdsValue = computed(() => form.courseIds.map((id) => String(id)));

const formatForInput = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const toIso = (value: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const resetForm = () => {
  form.code = '';
  form.name = '';
  form.description = '';
  form.publishMode = 'PUBLIC';
  form.type = 'PERCENTAGE';
  form.applicability = 'ALL_COURSES';
  form.percentage = null;
  form.amount = null;
  form.bundlePrice = null;
  form.validFrom = formatForInput(new Date().toISOString());
  form.validUntil = '';
  form.courseIds = [];
};

const populateFromOffer = (offer: OfferResponse) => {
  form.code = offer.code;
  form.name = offer.name;
  form.description = offer.description || '';
  form.publishMode = offer.publishMode ?? 'PUBLIC';
  form.type = offer.type;
  form.applicability = offer.type === 'BUNDLE' ? 'SPECIFIC_COURSES' : offer.applicability;
  form.percentage = offer.percentage ?? null;
  form.amount = offer.amount ?? null;
  form.bundlePrice = offer.bundlePrice ?? null;
  form.validFrom = formatForInput(offer.validFrom);
  form.validUntil = offer.validUntil ? formatForInput(offer.validUntil) : '';
  form.courseIds = offer.courses?.map((course) => course.id) ?? [];
};

watch(
  () => [props.mode, props.offer],
  () => {
    if (props.mode === 'edit' && props.offer) {
      populateFromOffer(props.offer);
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const onTypeChange = (value: string | number | string[] | null) => {
  const nextType = Array.isArray(value) ? (value[0] as OfferType) : (value as OfferType);
  if (!nextType) return;

  form.type = nextType;

  if (nextType !== 'PERCENTAGE') {
    form.percentage = null;
  }
  if (nextType !== 'FIXED') {
    form.amount = null;
  }
  if (nextType !== 'BUNDLE') {
    form.bundlePrice = null;
  } else {
    form.applicability = 'SPECIFIC_COURSES';
  }
};

const onPublishModeChange = (value: string | number | string[] | null) => {
  const next = Array.isArray(value) ? (value[0] as OfferPublishMode) : (value as OfferPublishMode);
  form.publishMode = next ?? 'PUBLIC';
};

const onApplicabilityChange = (value: string | number | string[] | null) => {
  if (form.type === 'BUNDLE') {
    form.applicability = 'SPECIFIC_COURSES';
    return;
  }
  const next = Array.isArray(value) ? (value[0] as OfferApplicability) : (value as OfferApplicability);
  form.applicability = next ?? 'ALL_COURSES';
};

const onPercentageChange = (value: string | number | null) => {
  const parsed = Number(value);
  form.percentage = Number.isNaN(parsed) ? null : Math.min(Math.max(parsed, 1), 100);
};

const onAmountChange = (value: string | number | null) => {
  const parsed = Number(value);
  form.amount = Number.isNaN(parsed) ? null : Math.max(parsed, 0);
};

const onBundlePriceChange = (value: string | number | null) => {
  const parsed = Number(value);
  form.bundlePrice = Number.isNaN(parsed) ? null : Math.max(parsed, 0);
};

const onCourseIdsChange = (value: string[] | string | number | null) => {
  if (Array.isArray(value)) {
    form.courseIds = value.map((entry) => Number(entry));
  } else if (value == null || value === '') {
    form.courseIds = [];
  } else {
    form.courseIds = [Number(value)];
  }
};

const handleSubmit = () => {
  const payload: OfferPayload & { code?: string } = {
    name: form.name,
    description: form.description || undefined,
    publishMode: form.publishMode,
    type: form.type,
    applicability: form.applicability,
    percentage: form.type === 'PERCENTAGE' ? form.percentage ?? undefined : undefined,
    amount: form.type === 'FIXED' ? form.amount ?? undefined : undefined,
    bundlePrice: form.type === 'BUNDLE' ? form.bundlePrice ?? undefined : undefined,
    validFrom: toIso(form.validFrom),
    validUntil: form.validUntil ? toIso(form.validUntil) : undefined,
    courseIds: requiresCourses.value ? form.courseIds : undefined
  };

  if (props.mode === 'create') {
    payload.code = form.code;
  }

  emit('submit', payload);
};
</script>

<style scoped>
.offer-form {
  display: grid;
  gap: var(--sakai-space-4);
}

.offer-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-2);
}
</style>
