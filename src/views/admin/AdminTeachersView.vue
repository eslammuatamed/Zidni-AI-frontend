<template>
  <ThemePage class="theme-page--admin" :title="t('adminTeachers.title')" :subtitle="t('adminTeachers.subtitle')">
    <section class="admin-teachers flex flex-col gap-6">
      <UiCard hover>
        <template #title>{{ t('adminTeachers.tableTitle') }}</template>
        <template #subtitle>{{ t('adminTeachers.tableSubtitle') }}</template>

        <UiAlert v-if="store.error" color="danger" variant="soft" class="admin-teachers__alert mb-4">
          {{ translateError(store.error) }}
        </UiAlert>

        <div class="admin-teachers__toolbar grid gap-4 items-end mb-5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          <UiInput
            v-model="filters.search"
            :label="t('adminTeachers.filters.search')"
            :placeholder="t('adminTeachers.filters.searchPlaceholder')"
            start-icon="SearchOutlined"
            @keyup.enter="applyFilters"
          />

          <UiSelect
            :model-value="filters.status"
            :label="t('adminTeachers.filters.status')"
            @update:model-value="onStatusChange"
          >
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>

          <UiSelect
            :model-value="filters.plan"
            :label="t('adminTeachers.filters.plan')"
            @update:model-value="onPlanChange"
          >
            <option v-for="option in planOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>

          <UiButton variant="link" color="secondary" @click="resetFilters">
            {{ t('adminTeachers.filters.reset') }}
          </UiButton>

          <UiButton color="primary" class="admin-teachers__create" @click="openCreateDialog">
            {{ t('adminTeachers.actions.addTeacher') }}
          </UiButton>
        </div>

        <UiTable
          :headers="headers"
          :items="store.teachers"
          :loading="store.loadingTeachers"
          class="admin-teachers__table"
          :empty-text="t('adminTeachers.empty')"
        >
          <template #item.teacher="{ item }">
            <div class="admin-teachers__teacher flex flex-col gap-[0.125rem]">
              <span class="admin-teachers__teacher-name font-semibold text-content">{{ (item as any).name }}</span>
              <small class="admin-teachers__teacher-meta text-content-secondary">
                {{ (item as any).slug }} · {{ (item as any).plan.toUpperCase() }}
                <template v-if="(item as any).subject"> · {{ (item as any).subject }}</template>
              </small>
            </div>
          </template>

          <template #item.status="{ item }">
            <UiTag :color="(item as any).active ? 'success' : 'danger'">
              {{ (item as any).active ? t('adminTeachers.status.active') : t('adminTeachers.status.disabled') }}
            </UiTag>
          </template>

          <template #item.actions="{ item }">
            <div class="admin-teachers__actions flex gap-2 justify-end">
              <UiButton size="sm" variant="link" @click="openDetail((item as any).id)">
                {{ t('adminTeachers.actions.manage') }}
              </UiButton>
              <UiButton size="sm" variant="link" color="danger" @click="confirmDeleteTeacher((item as any).id, (item as any).name)">
                {{ t('adminTeachers.actions.delete') }}
              </UiButton>
            </div>
          </template>
        </UiTable>
      </UiCard>
    </section>

    <UiDialog v-model="createDialog.open" :title="t('adminTeachers.create.title')" width="640px">
      <form class="admin-teachers__form grid gap-4" @submit.prevent="submitCreate">
        <UiInput
          v-model="createDialog.form.slug"
          :label="t('adminTeachers.create.slug')"
          :hint="t('teacher.slugInvalid')"
          :title="t('teacher.slugInvalid')"
          required
          minlength="5"
          pattern="^[a-z0-9-]{5,50}$"
        />
        <UiInput v-model="createDialog.form.name" :label="t('adminTeachers.create.name')" required />
        <UiInput v-model="createDialog.form.subject" :label="t('adminTeachers.create.subject')" />
        <UiSelect v-model="createDialog.form.phoneCountryCode" :label="t('adminTeachers.create.phoneCountryCode')" required>
          <option v-for="option in phoneCountryOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </UiSelect>
        <UiInput
          v-model="createDialog.form.phoneNumber"
          :label="t('adminTeachers.create.phoneNumber')"
          required
          inputmode="numeric"
          maxlength="20"
        />
        <UiSelect v-model="createDialog.form.plan" :label="t('adminTeachers.create.plan')">
          <option v-for="option in planOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </UiSelect>
        <UiInput v-model="createDialog.form.email" type="email" :label="t('adminTeachers.create.email')" required />
        <UiInput v-model="createDialog.form.password" type="password" :label="t('adminTeachers.create.password')" required />

        <div class="admin-teachers__dialog-actions flex justify-end gap-3 mt-4">
          <UiButton type="button" variant="link" @click="closeCreateDialog">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton type="submit" color="primary" :loading="createDialog.submitting">
            {{ t('adminTeachers.create.submit') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog
      v-model="detailDialog.open"
      :title="detailTitle"
      width="760px"
      @hide="closeDetail"
    >
      <div v-if="store.loadingTeacherDetail" class="admin-teachers__loading grid gap-3 p-6">
        <UiSkeleton v-for="n in 4" :key="n" height="32px" />
      </div>
      <div v-else-if="selectedTeacher" class="admin-teachers__detail">
        <UiAlert v-if="store.error" color="danger" variant="soft" class="admin-teachers__alert mb-4">
          {{ translateError(store.error) }}
        </UiAlert>

        <section class="admin-teachers__section flex flex-col gap-4 mb-6">
          <header class="admin-teachers__section-header flex items-center justify-between gap-3 mb-2">
            <h3>{{ t('adminTeachers.detail.overview') }}</h3>
            <UiTag :color="teacherForm.active ? 'success' : 'danger'">
              {{ teacherForm.active ? t('adminTeachers.status.active') : t('adminTeachers.status.disabled') }}
            </UiTag>
          </header>
          <form class="admin-teachers__form grid gap-4" @submit.prevent="submitUpdateTeacher">
            <UiInput v-model="teacherForm.name" :label="t('adminTeachers.detail.name')" required />
            <UiInput v-model="teacherForm.subject" :label="t('adminTeachers.detail.subject')" />
            <UiSelect v-model="teacherForm.phoneCountryCode" :label="t('adminTeachers.detail.phoneCountryCode')" required>
              <option v-for="option in phoneCountryOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </UiSelect>
            <UiInput
              v-model="teacherForm.phoneNumber"
              :label="t('adminTeachers.detail.phoneNumber')"
              required
              inputmode="numeric"
              maxlength="20"
            />
            <UiSelect v-model="teacherForm.plan" :label="t('adminTeachers.detail.plan')">
              <option v-for="option in planOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </UiSelect>
            <UiSwitch v-model="teacherForm.active" :label="t('adminTeachers.detail.active')" />
            <UiSwitch
              v-model="teacherForm.studentMultiDeviceLoginEnabled"
              :label="t('adminTeachers.detail.studentMultiDeviceLoginEnabled')"
              :hint="t('adminTeachers.detail.studentMultiDeviceLoginHint')"
            />

            <div class="admin-teachers__dialog-actions flex justify-end gap-3 mt-4">
              <UiButton type="submit" color="primary" :loading="detailDialog.submitting">
                {{ t('adminTeachers.detail.save') }}
              </UiButton>
            </div>
          </form>

          <form class="admin-teachers__form admin-teachers__form--inline" @submit.prevent="submitSlugUpdate">
            <UiInput
              v-model="slugForm"
              :label="t('adminTeachers.detail.slug')"
              :hint="t('teacher.slugInvalid')"
              :title="t('teacher.slugInvalid')"
              required
              minlength="5"
              pattern="^[a-z0-9-]{5,50}$"
            />
            <UiButton type="submit" variant="outline" :loading="detailDialog.slugSubmitting">
              {{ t('adminTeachers.detail.updateSlug') }}
            </UiButton>
          </form>

          <dl class="admin-teachers__meta grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
            <div>
              <dt>{{ t('adminTeachers.detail.joined') }}</dt>
              <dd>{{ formatDate(selectedTeacher.joinDate) }}</dd>
            </div>
            <div>
              <dt>{{ t('adminTeachers.detail.studentCount') }}</dt>
              <dd>{{ selectedTeacher.studentCount }}</dd>
            </div>
            <div>
              <dt>{{ t('adminTeachers.detail.accountCount') }}</dt>
              <dd>{{ selectedTeacher.userAccountCount }}</dd>
            </div>
            <div>
              <dt>{{ t('adminTeachers.detail.deviceCount') }}</dt>
              <dd>{{ selectedTeacher.deviceCount }}</dd>
            </div>
          </dl>
        </section>

        <section class="admin-teachers__section flex flex-col gap-4 mb-6">
          <header class="admin-teachers__section-header flex items-center justify-between gap-3 mb-2">
            <h3>{{ t('adminTeachers.overrides.title') }}</h3>
            <UiSwitch v-model="usageOverridesEnabled" :label="t('adminTeachers.overrides.switch')" />
          </header>
          <UiAlert color="info" variant="soft">
            {{ t('adminTeachers.overrides.alert') }}
          </UiAlert>
          <div v-if="usageOverridesEnabled" class="admin-teachers__form grid gap-4 admin-teachers__usage-overrides [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
            <UiInput
              v-model.number="usageOverridesForm.storageWarningPercent"
              type="number"
              min="0"
              max="100"
              :label="t('adminTeachers.overrides.storageWarning')"
              placeholder="e.g. 80"
            />
            <UiInput
              v-model.number="usageOverridesForm.storageCriticalPercent"
              type="number"
              min="0"
              max="100"
              :label="t('adminTeachers.overrides.storageCritical')"
              placeholder="e.g. 90"
            />
            <UiInput
              v-model.number="usageOverridesForm.streamingWarningPercent"
              type="number"
              min="0"
              max="100"
              :label="t('adminTeachers.overrides.streamingWarning')"
              placeholder="e.g. 80"
            />
            <UiInput
              v-model.number="usageOverridesForm.streamingCriticalPercent"
              type="number"
              min="0"
              max="100"
              :label="t('adminTeachers.overrides.streamingCritical')"
              placeholder="e.g. 90"
            />
            <UiInput
              v-model.number="usageOverridesForm.storageGraceDays"
              type="number"
              min="0"
              max="31"
              :label="t('adminTeachers.overrides.storageGrace')"
              placeholder="e.g. 7"
            />
            <UiInput
              v-model.number="usageOverridesForm.streamingGraceDays"
              type="number"
              min="0"
              max="31"
              :label="t('adminTeachers.overrides.streamingGrace')"
              placeholder="e.g. 7"
            />
          </div>
          <p v-else class="admin-teachers__help m-0 text-sm text-content-tertiary">{{ t('adminTeachers.overrides.help') }}</p>
        </section>

        <section class="admin-teachers__section flex flex-col gap-4 mb-6">
          <header class="admin-teachers__section-header flex items-center justify-between gap-3 mb-2">
            <h3>{{ t('adminTeachers.accounts.title') }}</h3>
            <UiButton
              v-if="!selectedTeacher.accounts || selectedTeacher.accounts.length === 0"
              size="sm"
              variant="outline"
              @click="openAccountCreate"
            >
              {{ t('adminTeachers.accounts.add') }}
            </UiButton>
          </header>
          <div v-if="selectedTeacher.accounts && selectedTeacher.accounts.length" class="admin-teachers__accounts flex flex-col gap-3">
            <article v-for="account in selectedTeacher.accounts" :key="account.id" class="admin-teachers__account">
              <div class="admin-teachers__account-info">
                <h4>{{ account.email }}</h4>
                <small>{{ lastActivity(account) }}</small>
              </div>
              <div class="admin-teachers__account-actions flex items-center gap-3 flex-wrap justify-end">
                <UiSwitch
                  :model-value="account.enabled"
                  :label="account.enabled ? t('adminTeachers.accounts.enabled') : t('adminTeachers.accounts.disabled')"
                  @update:model-value="toggleAccount(account, $event)"
                />
                <UiButton size="sm" variant="link" @click="openAccountEdit(account)">
                  {{ t('adminTeachers.accounts.edit') }}
                </UiButton>
                <UiButton size="sm" variant="link" color="warning" @click="sendAccountReset(account)">
                  {{ t('adminTeachers.accounts.reset') }}
                </UiButton>
                <UiButton size="sm" variant="link" color="danger" @click="confirmDeleteAccount(account)">
                  {{ t('adminTeachers.accounts.delete') }}
                </UiButton>
              </div>
            </article>
          </div>
          <p v-else class="admin-teachers__accounts-empty">
            {{ t('adminTeachers.accounts.empty') }}
          </p>
        </section>

        <AdminTeacherAssistantsPanel :teacher-id="selectedTeacher.id" />

        <footer class="admin-teachers__danger-zone flex justify-end pt-5 border-t border-border">
          <UiButton color="danger" variant="outline" @click="confirmDeleteTeacher(selectedTeacher.id, selectedTeacher.name)">
            {{ t('adminTeachers.detail.deleteTeacher') }}
          </UiButton>
        </footer>
      </div>
      <div v-else class="admin-teachers__empty-detail text-content-tertiary text-center p-[3rem] italic">
        {{ t('adminTeachers.detail.empty') }}
      </div>
    </UiDialog>

    <UiDialog v-model="accountCreateDialog.open" :title="t('adminTeachers.accounts.addTitle')" width="480px">
      <form class="admin-teachers__form grid gap-4" @submit.prevent="submitCreateAccount">
        <UiInput v-model="accountCreateDialog.email" type="email" :label="t('adminTeachers.accounts.email')" required />
        <UiInput v-model="accountCreateDialog.password" type="password" :label="t('adminTeachers.accounts.password')" required />
        <div class="admin-teachers__dialog-actions flex justify-end gap-3 mt-4">
          <UiButton type="button" variant="link" @click="closeAccountCreate">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton type="submit" color="primary" :loading="accountCreateDialog.submitting">
            {{ t('adminTeachers.accounts.addSubmit') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model="accountEditDialog.open" :title="t('adminTeachers.accounts.editTitle')" width="480px">
      <form class="admin-teachers__form grid gap-4" @submit.prevent="submitAccountEdit">
        <UiInput v-model="accountEditDialog.email" type="email" :label="t('adminTeachers.accounts.email')" required />
        <UiInput v-model="accountEditDialog.password" type="password" :label="t('adminTeachers.accounts.newPassword')" />
        <p class="admin-teachers__help m-0 text-sm text-content-tertiary">{{ t('adminTeachers.accounts.passwordHelp') }}</p>
        <div class="admin-teachers__dialog-actions flex justify-end gap-3 mt-4">
          <UiButton type="button" variant="link" @click="closeAccountEdit">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton type="submit" color="primary" :loading="accountEditDialog.submitting">
            {{ t('adminTeachers.accounts.editSubmit') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAdminStore } from '@/stores/admin';
import { useToast } from '@/composables/useToast';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSelect, { type SelectValue } from '@/components/ui/UiSelect.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import AdminTeacherAssistantsPanel from '@/components/admin/AdminTeacherAssistantsPanel.vue';
import { formatDateTime } from '@/utils/formatters';
import type { TeacherAccount, TeacherUsageOverrides } from '@/services/admin';
import { PHONE_COUNTRY_CODES } from '@/constants/countryCodes';
import { normalizePhoneInput, PhoneNumberValidationError } from '@/utils/phoneNumber';

const { t } = useI18n();
const store = useAdminStore();
const toast = useToast();

const SLUG_PATTERN = /^[a-z0-9-]{5,50}$/;
const normalizeSlug = (value: string) =>
  (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

const filters = reactive({
  status: '',
  plan: '',
  search: ''
});

const headers = computed<UiTableHeader[]>(() => [
  { key: 'teacher', title: t('adminTeachers.columns.teacher') },
  { key: 'plan', title: t('adminTeachers.columns.plan') },
  { key: 'status', title: t('adminTeachers.columns.status') },
  { key: 'actions', title: t('adminTeachers.columns.actions'), sortable: false, align: 'end' }
]);

const statusOptions = computed(() => [
  { value: '', label: t('adminTeachers.filters.statusAll') },
  { value: 'active', label: t('adminTeachers.status.active') },
  { value: 'disabled', label: t('adminTeachers.status.disabled') }
]);

const planOptions = computed(() => [
  { value: '', label: t('adminTeachers.filters.planAll') },
  { value: 'free', label: t('admin.planOptions.free') },
  { value: 'basic', label: t('admin.planOptions.basic') },
  { value: 'medim', label: t('admin.planOptions.medim') },
  { value: 'pro', label: t('admin.planOptions.pro') },
  { value: 'enterprise', label: t('admin.planOptions.enterprise') }
]);

const createDialog = reactive({
  open: false,
  submitting: false,
  form: {
    slug: '',
    name: '',
    subject: '',
    phoneCountryCode: '+1',
    phoneNumber: '',
    plan: 'free',
    email: '',
    password: ''
  }
});

const detailDialog = reactive({
  open: false,
  submitting: false,
  slugSubmitting: false
});

const accountCreateDialog = reactive({
  open: false,
  submitting: false,
  email: '',
  password: ''
});

const accountEditDialog = reactive({
  open: false,
  submitting: false,
  accountId: null as number | null,
  email: '',
  password: '',
  originalEmail: ''
});

const teacherForm = reactive({
  name: '',
  subject: '',
  phoneCountryCode: '+1',
  phoneNumber: '',
  plan: 'free',
  active: true,
  studentMultiDeviceLoginEnabled: false
});

const slugForm = ref('');
const usageOverridesEnabled = ref(false);
const usageOverridesForm = reactive({
  storageWarningPercent: null as number | null,
  storageCriticalPercent: null as number | null,
  streamingWarningPercent: null as number | null,
  streamingCriticalPercent: null as number | null,
  storageGraceDays: null as number | null,
  streamingGraceDays: null as number | null
});

const selectedTeacher = computed(() => store.selectedTeacher);
const detailTitle = computed(() => selectedTeacher.value?.name || t('adminTeachers.detail.title'));
const phoneCountryOptions = computed(() =>
  PHONE_COUNTRY_CODES.map((option) => ({
    value: option.value,
    label: `${option.value} · ${t(option.nameKey)}`
  }))
);

watch(
  () => createDialog.form.slug,
  (value) => {
    const normalized = normalizeSlug(value);
    if (normalized !== value) {
      createDialog.form.slug = normalized;
    }
  }
);

watch(slugForm, (value) => {
  const normalized = normalizeSlug(value);
  if (normalized !== value) {
    slugForm.value = normalized;
  }
});

watch(selectedTeacher, (teacher) => {
  if (!teacher) {
    teacherForm.name = '';
    teacherForm.subject = '';
    teacherForm.phoneCountryCode = '+1';
    teacherForm.phoneNumber = '';
    teacherForm.plan = 'free';
    teacherForm.active = true;
    teacherForm.studentMultiDeviceLoginEnabled = false;
    slugForm.value = '';
    usageOverridesEnabled.value = false;
    resetUsageOverridesForm();
    return;
  }
  teacherForm.name = teacher.name ?? '';
  teacherForm.subject = teacher.subject ?? '';
  teacherForm.phoneCountryCode = teacher.phoneCountryCode || '+1';
  teacherForm.phoneNumber = teacher.phoneNumber || '';
  teacherForm.plan = teacher.plan ?? 'free';
  teacherForm.active = teacher.active;
  teacherForm.studentMultiDeviceLoginEnabled = Boolean(teacher.studentMultiDeviceLoginEnabled);
  slugForm.value = teacher.slug;
  const overrides = teacher.usageOverrides ?? null;
  usageOverridesEnabled.value = hasUsageOverrides(overrides);
  applyUsageOverridesForm(overrides);
});

onMounted(async () => {
  if (!store.teachers.length) {
    await store.loadTeachers().catch(() => {
      /* ignore */
    });
  }
});

async function applyFilters() {
  await store
    .loadTeachers({
      search: filters.search || undefined,
      status: filters.status ? (filters.status as 'active' | 'disabled') : undefined,
      plan: filters.plan || undefined
    })
    .catch(() => {
      toast.error(translateError(store.error));
    });
}

function onStatusChange(value: SelectValue) {
  filters.status = String(value || '');
  applyFilters();
}

function onPlanChange(value: SelectValue) {
  filters.plan = String(value || '');
  applyFilters();
}

function resetFilters() {
  filters.status = '';
  filters.plan = '';
  filters.search = '';
  applyFilters();
}

function openCreateDialog() {
  createDialog.open = true;
  createDialog.form = {
    slug: '',
    name: '',
    subject: '',
    phoneCountryCode: '+1',
    phoneNumber: '',
    plan: 'free',
    email: '',
    password: ''
  };
}

function closeCreateDialog() {
  createDialog.open = false;
}

async function submitCreate() {
  if (createDialog.submitting) {
    return;
  }
  let normalizedPhone;
  try {
    normalizedPhone = normalizePhoneInput(createDialog.form.phoneCountryCode, createDialog.form.phoneNumber);
  } catch (error) {
    if (error instanceof PhoneNumberValidationError) {
      toast.error(t('adminTeachers.errors.phoneInvalid'));
    } else {
      toast.error(translateError(store.error));
    }
    return;
  }
  const normalizedSlug = normalizeSlug(createDialog.form.slug);
  if (!SLUG_PATTERN.test(normalizedSlug)) {
    toast.error(t('teacher.slugInvalid'));
    createDialog.form.slug = normalizedSlug;
    return;
  }

  createDialog.submitting = true;
  try {
    const payload = {
      slug: normalizedSlug,
      name: createDialog.form.name.trim(),
      subject: createDialog.form.subject.trim() || undefined,
      phoneCountryCode: normalizedPhone.phoneCountryCode,
      phoneNumber: normalizedPhone.phoneNumber,
      plan: createDialog.form.plan || undefined,
      email: createDialog.form.email.trim(),
      password: createDialog.form.password
    };
    createDialog.form.phoneCountryCode = normalizedPhone.phoneCountryCode;
    createDialog.form.phoneNumber = normalizedPhone.phoneNumber;
    const created = await store.createTeacher(payload);
    toast.success(t('adminTeachers.notifications.created', { name: created.name }));
    closeCreateDialog();
    await applyFilters();
    if (created?.id) {
      openDetail(created.id);
    }
  } catch (error) {
    toast.error(translateError(store.error));
  } finally {
    createDialog.submitting = false;
  }
}

async function openDetail(id: number) {
  detailDialog.open = true;
  detailDialog.submitting = false;
  detailDialog.slugSubmitting = false;
  await store.selectTeacher(id).catch(() => {
    toast.error(translateError(store.error));
  });
}

function closeDetail() {
  detailDialog.open = false;
  store.selectedTeacher = null;
}

async function submitUpdateTeacher() {
  if (!selectedTeacher.value) {
    return;
  }
  let normalizedPhone;
  try {
    normalizedPhone = normalizePhoneInput(teacherForm.phoneCountryCode, teacherForm.phoneNumber);
  } catch (error) {
    if (error instanceof PhoneNumberValidationError) {
      toast.error(t('adminTeachers.errors.phoneInvalid'));
    } else {
      toast.error(translateError(store.error));
    }
    return;
  }
  detailDialog.submitting = true;
  try {
    await store.updateTeacher({
      name: teacherForm.name.trim(),
      subject: teacherForm.subject.trim() || undefined,
      phoneCountryCode: normalizedPhone.phoneCountryCode,
      phoneNumber: normalizedPhone.phoneNumber,
      plan: teacherForm.plan,
      active: teacherForm.active,
      studentMultiDeviceLoginEnabled: teacherForm.studentMultiDeviceLoginEnabled,
      usageOverrides: buildUsageOverridesPayload()
    });
    teacherForm.phoneCountryCode = normalizedPhone.phoneCountryCode;
    teacherForm.phoneNumber = normalizedPhone.phoneNumber;
    toast.success(t('adminTeachers.notifications.updated', { name: teacherForm.name }));
  } catch (error) {
    toast.error(translateError(store.error));
  } finally {
    detailDialog.submitting = false;
  }
}

async function submitSlugUpdate() {
  if (!selectedTeacher.value || !slugForm.value) {
    return;
  }
  const normalizedSlug = normalizeSlug(slugForm.value);
  if (!SLUG_PATTERN.test(normalizedSlug)) {
    toast.error(t('teacher.slugInvalid'));
    slugForm.value = normalizedSlug;
    return;
  }

  detailDialog.slugSubmitting = true;
  try {
    slugForm.value = normalizedSlug;
    await store.updateSlug(normalizedSlug);
    toast.success(t('adminTeachers.notifications.slugUpdated'));
    await applyFilters();
  } catch (error) {
    toast.error(translateError(store.error));
  } finally {
    detailDialog.slugSubmitting = false;
  }
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }
  return formatDateTime(value);
}

function lastActivity(account: TeacherAccount) {
  if (!account.lastActivity) {
    return t('adminTeachers.accounts.noActivity');
  }
  return t('adminTeachers.accounts.lastActive', { date: formatDateTime(account.lastActivity) });
}

function openAccountCreate() {
  accountCreateDialog.open = true;
  accountCreateDialog.email = '';
  accountCreateDialog.password = '';
}

function closeAccountCreate() {
  accountCreateDialog.open = false;
}

async function submitCreateAccount() {
  if (!accountCreateDialog.email || !accountCreateDialog.password) {
    return;
  }
  accountCreateDialog.submitting = true;
  try {
    await store.createTeacherAccount({
      email: accountCreateDialog.email.trim(),
      password: accountCreateDialog.password
    });
    toast.success(t('adminTeachers.notifications.accountCreated'));
    closeAccountCreate();
  } catch (error) {
    toast.error(translateError(store.error));
  } finally {
    accountCreateDialog.submitting = false;
  }
}

function openAccountEdit(account: TeacherAccount) {
  accountEditDialog.open = true;
  accountEditDialog.accountId = account.id;
  accountEditDialog.email = account.email;
  accountEditDialog.originalEmail = account.email;
  accountEditDialog.password = '';
}

function closeAccountEdit() {
  accountEditDialog.open = false;
  accountEditDialog.accountId = null;
  accountEditDialog.email = '';
  accountEditDialog.password = '';
  accountEditDialog.originalEmail = '';
}

async function submitAccountEdit() {
  if (!selectedTeacher.value || accountEditDialog.accountId == null) {
    return;
  }
  const payload: { email?: string; password?: string } = {};
  const normalizedEmail = accountEditDialog.email.trim();
  if (normalizedEmail && normalizedEmail !== accountEditDialog.originalEmail) {
    payload.email = normalizedEmail;
  }
  if (accountEditDialog.password && accountEditDialog.password.trim().length > 0) {
    payload.password = accountEditDialog.password.trim();
  }
  if (!payload.email && !payload.password) {
    closeAccountEdit();
    return;
  }
  accountEditDialog.submitting = true;
  try {
    await store.updateTeacherAccountCredentials(accountEditDialog.accountId, payload);
    toast.success(t('adminTeachers.notifications.accountUpdated'));
    closeAccountEdit();
  } catch (error) {
    toast.error(translateError(store.error));
  } finally {
    accountEditDialog.submitting = false;
  }
}

async function toggleAccount(account: TeacherAccount, enabled: boolean) {
  if (!selectedTeacher.value) {
    return;
  }
  const previous = account.enabled;
  await store.updateAccount(account.id, enabled).catch(() => {
    toast.error(translateError(store.error));
    store.applyAccountUpdate({ ...account, enabled: previous });
  });
}

async function sendAccountReset(account: TeacherAccount) {
  await store
    .resetAccount(account.id)
    .then(() => {
      toast.success(t('adminTeachers.notifications.accountReset'));
    })
    .catch(() => {
      toast.error(translateError(store.error));
    });
}

async function confirmDeleteAccount(account: TeacherAccount) {
  if (!window.confirm(t('adminTeachers.accounts.confirmDelete', { email: account.email }))) {
    return;
  }
  await store.deleteTeacherAccount(account.id).then(() => {
    toast.success(t('adminTeachers.notifications.accountDeleted'));
  }).catch(() => {
    toast.error(translateError(store.error));
  });
}

async function confirmDeleteTeacher(id: number, name: string) {
  if (!window.confirm(t('adminTeachers.confirmDeleteTeacher', { name }))) {
    return;
  }
  await store.deleteTeacher(id).then(() => {
    toast.success(t('adminTeachers.notifications.deleted', { name }));
    closeDetail();
    applyFilters();
  }).catch(() => {
    toast.error(translateError(store.error));
  });
}

function translateError(code: string | null | undefined) {
  if (!code) {
    return t('adminTeachers.errors.generic');
  }
  const key = `errors.${code}`;
  const translated = t(key);
  return translated === key ? t('adminTeachers.errors.generic') : translated;
}

function hasUsageOverrides(overrides?: TeacherUsageOverrides | null) {
  if (!overrides) {
    return false;
  }
  return Object.values(overrides).some((value) => value !== null && value !== undefined);
}

function resetUsageOverridesForm() {
  usageOverridesForm.storageWarningPercent = null;
  usageOverridesForm.storageCriticalPercent = null;
  usageOverridesForm.streamingWarningPercent = null;
  usageOverridesForm.streamingCriticalPercent = null;
  usageOverridesForm.storageGraceDays = null;
  usageOverridesForm.streamingGraceDays = null;
}

function applyUsageOverridesForm(overrides?: TeacherUsageOverrides | null) {
  if (!overrides) {
    resetUsageOverridesForm();
    return;
  }
  usageOverridesForm.storageWarningPercent = overrides.storageWarningPercent ?? null;
  usageOverridesForm.storageCriticalPercent = overrides.storageCriticalPercent ?? null;
  usageOverridesForm.streamingWarningPercent = overrides.streamingWarningPercent ?? null;
  usageOverridesForm.streamingCriticalPercent = overrides.streamingCriticalPercent ?? null;
  usageOverridesForm.storageGraceDays = overrides.storageGraceDays ?? null;
  usageOverridesForm.streamingGraceDays = overrides.streamingGraceDays ?? null;
}

function normalizeOverrideValue(value: number | null) {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function buildUsageOverridesPayload(): TeacherUsageOverrides | null {
  if (!usageOverridesEnabled.value) {
    return {
      storageWarningPercent: null,
      storageCriticalPercent: null,
      streamingWarningPercent: null,
      streamingCriticalPercent: null,
      storageGraceDays: null,
      streamingGraceDays: null
    };
  }
  return {
    storageWarningPercent: normalizeOverrideValue(usageOverridesForm.storageWarningPercent),
    storageCriticalPercent: normalizeOverrideValue(usageOverridesForm.storageCriticalPercent),
    streamingWarningPercent: normalizeOverrideValue(usageOverridesForm.streamingWarningPercent),
    streamingCriticalPercent: normalizeOverrideValue(usageOverridesForm.streamingCriticalPercent),
    storageGraceDays: normalizeOverrideValue(usageOverridesForm.storageGraceDays),
    streamingGraceDays: normalizeOverrideValue(usageOverridesForm.streamingGraceDays)
  };
}
</script>

<style scoped>
.admin-teachers__section-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.admin-teachers__form--inline {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--sakai-space-3);
  align-items: end;
}

.admin-teachers__meta dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--sakai-text-color-tertiary);
  font-weight: 700;
  letter-spacing: 0.05em;
}

.admin-teachers__meta dd {
  margin: 0.125rem 0 0;
  font-weight: 600;
  color: var(--sakai-text-color);
}

.admin-teachers__account {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  background: var(--sakai-surface-ground);
  border-radius: var(--sakai-border-radius-xl);
  border: 1px solid var(--sakai-border-color);
  transition: border-color 0.2s;
}

.admin-teachers__account:hover {
  border-color: var(--sakai-primary-300);
}

.admin-teachers__account-info h4 {
  margin: 0;
  font-size: 1.05rem;
}

.admin-teachers__account-info small {
  color: var(--sakai-text-color-tertiary);
}
</style>
