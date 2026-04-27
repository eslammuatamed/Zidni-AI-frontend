<template>
  <ThemePage :title="t('adminPaymentLogs.title')" :subtitle="t('adminPaymentLogs.subtitle')">
    <section class="admin-payment-logs">
      <UiCard class="admin-payment-logs__card" hover>
        <template #title>{{ t('adminPaymentLogs.settings.title') }}</template>
        <template #subtitle>{{ t('adminPaymentLogs.settings.subtitle') }}</template>

        <UiAlert
          v-if="settingsError"
          color="danger"
          variant="soft"
          class="admin-payment-logs__alert"
        >
          {{ settingsError }}
        </UiAlert>

        <div class="admin-payment-logs__settings">
          <form class="admin-payment-logs__settings-form" @submit.prevent="saveVodafoneSettings">
            <h3>{{ t('adminPaymentLogs.settings.vodafoneTitle') }}</h3>
            <p class="admin-payment-logs__settings-hint">
              {{ t('adminPaymentLogs.settings.vodafoneHint') }}
            </p>

            <UiInput
              v-model="vodafoneForm.walletNumber"
              :label="t('adminPaymentLogs.settings.vodafoneWalletLabel')"
              :placeholder="t('adminPaymentLogs.settings.vodafoneWalletPlaceholder')"
              :disabled="vodafoneLoading || vodafoneSaving"
            />
            <UiTextarea
              v-model="vodafoneForm.instructionsAr"
              :label="t('adminPaymentLogs.settings.vodafoneInstructionsAr')"
              :rows="3"
              :disabled="vodafoneLoading || vodafoneSaving"
            />
            <UiTextarea
              v-model="vodafoneForm.instructionsEn"
              :label="t('adminPaymentLogs.settings.vodafoneInstructionsEn')"
              :rows="3"
              :disabled="vodafoneLoading || vodafoneSaving"
            />
            <UiInput
              v-model="vodafoneForm.supportEmail"
              type="email"
              :label="t('adminPaymentLogs.settings.vodafoneSupportEmail')"
              :disabled="vodafoneLoading || vodafoneSaving"
            />
            <UiInput
              v-model="vodafoneForm.supportPhone"
              :label="t('adminPaymentLogs.settings.vodafoneSupportPhone')"
              :placeholder="t('adminPaymentLogs.settings.vodafoneSupportPhonePlaceholder')"
              :disabled="vodafoneLoading || vodafoneSaving"
            />

            <div class="admin-payment-logs__form-actions">
              <UiButton type="submit" :loading="vodafoneSaving" :disabled="vodafoneLoading || vodafoneSaving">
                {{ t('adminPaymentLogs.settings.save') }}
              </UiButton>
              <UiButton
                type="button"
                variant="link"
                color="secondary"
                :disabled="vodafoneLoading || vodafoneSaving"
                @click="resetVodafoneForm"
              >
                {{ t('adminPaymentLogs.settings.reset') }}
              </UiButton>
            </div>
          </form>

          <form class="admin-payment-logs__settings-form" @submit.prevent="savePaypalSettings">
            <h3>{{ t('adminPaymentLogs.settings.paypalTitle') }}</h3>
            <p class="admin-payment-logs__settings-hint">
              {{ t('adminPaymentLogs.settings.paypalHint') }}
            </p>

            <UiInput
              v-model="paypalForm.egpRate"
              type="number"
              step="0.0001"
              min="0"
              :label="t('adminPaymentLogs.settings.paypalEgpRateLabel')"
              :placeholder="t('adminPaymentLogs.settings.paypalRatePlaceholder')"
              :disabled="paypalLoading || paypalSaving"
            />
            <UiInput
              v-model="paypalForm.aedRate"
              type="number"
              step="0.0001"
              min="0"
              :label="t('adminPaymentLogs.settings.paypalAedRateLabel')"
              :placeholder="t('adminPaymentLogs.settings.paypalRatePlaceholder')"
              :disabled="paypalLoading || paypalSaving"
            />
            <UiInput
              v-model="paypalForm.sarRate"
              type="number"
              step="0.0001"
              min="0"
              :label="t('adminPaymentLogs.settings.paypalSarRateLabel')"
              :placeholder="t('adminPaymentLogs.settings.paypalRatePlaceholder')"
              :disabled="paypalLoading || paypalSaving"
            />

            <p class="admin-payment-logs__settings-hint">
              {{ t('adminPaymentLogs.settings.paypalClearHint') }}
            </p>

            <UiAlert
              v-if="paypalValidationError"
              color="warning"
              variant="soft"
              class="admin-payment-logs__settings-alert"
            >
              {{ paypalValidationError }}
            </UiAlert>

            <div class="admin-payment-logs__form-actions">
              <UiButton type="submit" :loading="paypalSaving" :disabled="paypalLoading || paypalSaving">
                {{ t('adminPaymentLogs.settings.save') }}
              </UiButton>
              <UiButton
                type="button"
                variant="link"
                color="secondary"
                :disabled="paypalLoading || paypalSaving"
                @click="resetPaypalForm"
              >
                {{ t('adminPaymentLogs.settings.reset') }}
              </UiButton>
            </div>
          </form>

          <form class="admin-payment-logs__settings-form" @submit.prevent="saveRegistrationSettings">
            <h3>{{ t('adminPaymentLogs.settings.registrationTitle') }}</h3>
            <p class="admin-payment-logs__settings-hint">
              {{ t('adminPaymentLogs.settings.registrationHint') }}
            </p>

            <UiCheckbox
              v-model="registrationForm.enabled"
              :label="t('adminPaymentLogs.settings.registrationEnabledLabel')"
              :disabled="registrationLoading || registrationSaving"
            />
            <UiInput
              v-model="registrationForm.whatsappNumber"
              :label="t('adminPaymentLogs.settings.registrationWhatsappLabel')"
              :placeholder="t('adminPaymentLogs.settings.registrationWhatsappPlaceholder')"
              :disabled="registrationLoading || registrationSaving"
            />

            <div class="admin-payment-logs__form-actions">
              <UiButton type="submit" :loading="registrationSaving" :disabled="registrationLoading || registrationSaving">
                {{ t('adminPaymentLogs.settings.save') }}
              </UiButton>
              <UiButton
                type="button"
                variant="link"
                color="secondary"
                :disabled="registrationLoading || registrationSaving"
                @click="resetRegistrationForm"
              >
                {{ t('adminPaymentLogs.settings.reset') }}
              </UiButton>
            </div>
          </form>
        </div>
      </UiCard>

      <UiCard class="admin-payment-logs__card" hover>
        <template #title>{{ t('adminPaymentLogs.tableTitle') }}</template>
        <template #subtitle>{{ t('adminPaymentLogs.tableSubtitle') }}</template>

        <UiAlert v-if="error" color="danger" variant="soft" class="admin-payment-logs__alert">
          {{ translateError(error) }}
        </UiAlert>

        <div class="admin-payment-logs__filters">
          <UiSelect
            :model-value="filters.method"
            :label="t('adminPaymentLogs.filters.method')"
            clearable
            @update:model-value="onSelect('method', $event)"
          >
            <option value="">{{ t('adminPaymentLogs.filters.methodAll') }}</option>
            <option v-for="option in methodOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>

          <UiSelect
            :model-value="filters.status"
            :label="t('adminPaymentLogs.filters.status')"
            clearable
            @update:model-value="onSelect('status', $event)"
          >
            <option value="">{{ t('adminPaymentLogs.filters.statusAll') }}</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </UiSelect>

          <UiInput
            v-model="filters.search"
            :label="t('adminPaymentLogs.filters.search')"
            :placeholder="t('adminPaymentLogs.filters.searchPlaceholder')"
            start-icon="SearchOutlined"
          />

          <div class="admin-payment-logs__date-range">
            <UiInput v-model="filters.dateFrom" type="date" :label="t('adminPaymentLogs.filters.dateFrom')" />
            <UiInput v-model="filters.dateTo" type="date" :label="t('adminPaymentLogs.filters.dateTo')" />
          </div>

          <div class="admin-payment-logs__actions">
            <UiButton variant="link" color="secondary" @click="resetFilters">
              {{ t('adminPaymentLogs.filters.reset') }}
            </UiButton>
            <UiButton variant="outline" prepend-icon="ReloadOutlined" @click="refresh">
              {{ t('adminPaymentLogs.filters.refresh') }}
            </UiButton>
          </div>
        </div>

        <UiTable
          class="admin-payment-logs__table"
          :headers="headers"
          :items="tableItems"
          :items-length="total"
          :page="filters.page"
          :items-per-page="filters.size"
          :sort-by="sortBy"
          :loading="loading"
          density="comfortable"
          :items-per-page-options="[10, 25, 50, 100]"
          :empty-text="t('adminPaymentLogs.empty')"
          @update:page="onPageChange"
          @update:items-per-page="onItemsPerPageChange"
          @update:sort-by="onSortChange"
        >
          <template #item.payer="{ item }">
            <div class="admin-payment-logs__cell">
              <span class="admin-payment-logs__primary">{{ item.payerName }}</span>
              <span v-if="item.payerEmail" class="admin-payment-logs__secondary">{{ item.payerEmail }}</span>
              <span v-else-if="item.payerPhone" class="admin-payment-logs__secondary">{{ item.payerPhone }}</span>
            </div>
          </template>

          <template #item.method="{ item }">
            <UiTag color="secondary" size="sm">{{ formatMethod(item.method) }}</UiTag>
          </template>

          <template #item.amount="{ item }">
            <span>{{ formatAmount(item.amount, item.currency) }}</span>
          </template>

          <template #item.status="{ item }">
            <UiTag :color="statusColor(item.status)" size="sm">{{ formatStatus(item.status) }}</UiTag>
          </template>

          <template #item.createdAt="{ item }">
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </template>

          <template #item.processedAt="{ item }">
            <span>{{ formatDateTime(item.processedAt) || '—' }}</span>
          </template>

          <template #item.details="{ item }">
            <div class="admin-payment-logs__details">
              <span v-if="item.reference" class="admin-payment-logs__details-item">
                {{ t('adminPaymentLogs.details.reference', { reference: item.reference }) }}
              </span>
              <span v-if="item.transferReference" class="admin-payment-logs__details-item">
                {{ t('adminPaymentLogs.details.transfer', { transfer: item.transferReference }) }}
              </span>
              <span v-if="item.invoiceNumber" class="admin-payment-logs__details-item">
                {{ t('adminPaymentLogs.details.invoice', { invoice: item.invoiceNumber }) }}
              </span>
              <span v-if="item.transactionId" class="admin-payment-logs__details-item">
                {{ t('adminPaymentLogs.details.transaction', { transaction: item.transactionId }) }}
              </span>
              <span v-if="item.walletNumber" class="admin-payment-logs__details-item">
                {{ t('adminPaymentLogs.details.wallet', { wallet: item.walletNumber }) }}
              </span>
              <span
                v-if="
                  !item.reference &&
                  !item.transferReference &&
                  !item.invoiceNumber &&
                  !item.transactionId &&
                  !item.walletNumber
                "
              >
                —
              </span>
            </div>
          </template>

          <template #item.notes="{ item }">
            <span>{{ item.notes || '—' }}</span>
          </template>

          <template #item.receiptUrl="{ item }">
            <a
              v-if="item.receiptUrl"
              :href="item.receiptUrl"
              class="admin-payment-logs__link"
              target="_blank"
              rel="noopener"
            >
              {{ t('adminPaymentLogs.receiptLink') }}
            </a>
            <span v-else>—</span>
          </template>

          <template #item.actions="{ item }">
            <div v-if="canReview(item)" class="admin-payment-logs__actions-cell">
              <UiButton
                size="sm"
                variant="outline"
                :loading="isActionLoading(item.id)"
                :disabled="isActionLoading(item.id)"
                @click="confirmApprove(item)"
              >
                {{ t('adminPaymentLogs.actions.approve') }}
              </UiButton>
              <UiButton
                size="sm"
                variant="link"
                color="danger"
                :disabled="isActionLoading(item.id)"
                @click="openRejectDialog(item)"
              >
                {{ t('adminPaymentLogs.actions.reject') }}
              </UiButton>
            </div>
            <span v-else>—</span>
          </template>
      </UiTable>
    </UiCard>

    <UiCard class="admin-payment-logs__card" hover>
      <template #title>{{ t('adminPaymentLogs.student.title') }}</template>
      <template #subtitle>{{ t('adminPaymentLogs.student.subtitle') }}</template>

      <UiAlert v-if="studentError" color="danger" variant="soft" class="admin-payment-logs__alert">
        {{ studentError }}
      </UiAlert>

      <div class="admin-payment-logs__student-controls">
        <UiSelect
          :model-value="studentFilters.status"
          :label="t('adminPaymentLogs.student.statusLabel')"
          @update:model-value="onStudentStatusChange"
        >
          <option v-for="option in studentStatusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </UiSelect>
        <UiButton
          variant="outline"
          prepend-icon="ReloadOutlined"
          :loading="studentLoading"
          @click="refreshStudentPayments"
        >
          {{ t('adminPaymentLogs.student.refresh') }}
        </UiButton>
      </div>

      <UiTable
        class="admin-payment-logs__table"
        :headers="studentHeaders"
        :items="studentTableItems"
        :items-length="studentTableItems.length"
        :loading="studentLoading"
        density="comfortable"
        hide-default-footer
        :empty-text="t('adminPaymentLogs.student.empty')"
      >
        <template #item.student="{ item }">
          <div class="admin-payment-logs__cell">
            <span class="admin-payment-logs__primary">
              {{ item.studentName || (item.studentId ? `#${item.studentId}` : t('adminPaymentLogs.student.unknownStudent')) }}
            </span>
            <span v-if="item.studentEmail" class="admin-payment-logs__secondary">{{ item.studentEmail }}</span>
          </div>
        </template>
        <template #item.course="{ item }">
          <div class="admin-payment-logs__cell">
            <span class="admin-payment-logs__primary">
              {{ item.courseTitle || (item.courseId ? `#${item.courseId}` : t('adminPaymentLogs.student.unknownCourse')) }}
            </span>
          </div>
        </template>
        <template #item.amount="{ item }">
          <span>{{ formatAmount(item.amount, item.currency) }}</span>
        </template>
        <template #item.createdAt="{ item }">
          <span>{{ formatDateTime(item.createdAt) }}</span>
        </template>
        <template #item.status="{ item }">
          <UiTag :color="studentStatusColor(item.status)" size="sm">{{ formatStudentStatus(item.status) }}</UiTag>
        </template>
        <template #item.notes="{ item }">
          <span>{{ item.notes || '—' }}</span>
        </template>
        <template #item.proofUrl="{ item }">
          <a
            v-if="item.proofUrl"
            :href="item.proofUrl"
            class="admin-payment-logs__link"
            target="_blank"
            rel="noopener"
          >
            {{ t('adminPaymentLogs.student.proofLink') }}
          </a>
          <span v-else>—</span>
        </template>
        <template #item.actions="{ item }">
          <div v-if="canReviewStudentPayment(item)" class="admin-payment-logs__actions-cell">
            <UiButton
              size="sm"
              variant="outline"
              :loading="isStudentActionLoading(item.id) && studentDialog.action === 'approve'"
              :disabled="isStudentActionLoading(item.id)"
              @click="openStudentDecision(item, 'approve')"
            >
              {{ t('adminPaymentLogs.student.actions.approve') }}
            </UiButton>
            <UiButton
              size="sm"
              variant="link"
              color="danger"
              :loading="isStudentActionLoading(item.id) && studentDialog.action === 'reject'"
              :disabled="isStudentActionLoading(item.id)"
              @click="openStudentDecision(item, 'reject')"
            >
              {{ t('adminPaymentLogs.student.actions.reject') }}
            </UiButton>
          </div>
          <span v-else>—</span>
        </template>
      </UiTable>
    </UiCard>
  </section>
  <UiDialog v-model="rejectDialog.open" :title="t('adminPaymentLogs.actions.rejectTitle')" width="480px">
    <form class="admin-payment-logs__dialog-form" @submit.prevent="submitReject">
      <p class="admin-payment-logs__dialog-summary">
        {{ rejectSummary }}
        </p>
        <UiAlert v-if="rejectDialog.error" color="danger" variant="soft">
          {{ rejectDialog.error }}
        </UiAlert>
        <UiTextarea
          v-model="rejectDialog.reason"
          :label="t('adminPaymentLogs.actions.reasonLabel')"
          :placeholder="t('adminPaymentLogs.actions.reasonPlaceholder')"
          :rows="4"
        />
        <div class="admin-payment-logs__dialog-actions">
          <UiButton type="submit" color="danger" :loading="rejectDialog.loading">
            {{ t('adminPaymentLogs.actions.rejectSubmit') }}
          </UiButton>
          <UiButton type="button" variant="link" :disabled="rejectDialog.loading" @click="closeRejectDialog">
            {{ t('common.cancel') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>
    <UiDialog v-model="studentDialog.open" :title="studentDialogTitle" width="480px">
      <form class="admin-payment-logs__dialog-form" @submit.prevent="submitStudentDecision">
        <p class="admin-payment-logs__dialog-summary">{{ studentDialogSummary }}</p>
        <UiAlert v-if="studentDialog.error" color="danger" variant="soft">{{ studentDialog.error }}</UiAlert>
        <UiTextarea
          v-model="studentDialog.notes"
          :label="t('adminPaymentLogs.student.actions.notesLabel')"
          :placeholder="t('adminPaymentLogs.student.actions.notesPlaceholder')"
          :rows="4"
        />
        <div class="admin-payment-logs__dialog-actions">
          <UiButton
            type="submit"
            :color="studentDialog.action === 'reject' ? 'danger' : 'primary'"
            :loading="studentDialog.loading"
          >
            {{ studentDialogSubmitLabel }}
          </UiButton>
          <UiButton type="button" variant="link" :disabled="studentDialog.loading" @click="closeStudentDialog">
            {{ t('adminPaymentLogs.student.actions.cancel') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { isAxiosError } from 'axios';

import UiAlert from '@/components/ui/UiAlert.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';

import {
  approveAdminPaymentLog,
  approveAdminStudentPayment,
  getAdminPaypalSettings,
  getAdminVodafoneSettings,
  listAdminPaymentLogs,
  listAdminStudentPayments,
  rejectAdminPaymentLog,
  rejectAdminStudentPayment,
  type AdminPaypalSettings,
  type AdminPaymentLogItem,
  type AdminPaymentLogsQuery,
  type AdminPaymentMethod,
  type AdminPaymentStatus,
  type AdminStudentManualPayment,
  type AdminStudentPaymentDecisionPayload,
  type AdminVodafoneSettings,
  updateAdminPaypalSettings,
  updateAdminVodafoneSettings
} from '@/api/payments';
import {
  getAdminTeacherRegistrationSettings,
  updateAdminTeacherRegistrationSettings,
  type TeacherRegistrationSettings
} from '@/api/registration';
import { fetchTeacherDetail } from '@/services/admin';
import {
  assignTenantPlanTemplate,
  listPlanTemplates,
  type PlanTemplateSummary
} from '@/services/planTemplates';
import { useToast } from '@/composables/useToast';
import { formatDateTime } from '@/utils/formatters';
import type { ManualPaymentStatus } from '@/services/student';

interface SelectOption {
  value: string;
  label: string;
}

const { t } = useI18n();
const toast = useToast();

const filters = reactive({
  method: '',
  status: '',
  search: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  size: 25,
  sortField: 'createdAt',
  sortDesc: true
});

const loading = ref(false);
const error = ref<string | null>(null);
const total = ref(0);
const items = ref<AdminPaymentLogItem[]>([]);
const settingsError = ref<string | null>(null);
const actionLoading = ref<number | null>(null);

const vodafoneLoading = ref(true);
const vodafoneSaving = ref(false);
const paypalLoading = ref(true);
const paypalSaving = ref(false);
const registrationLoading = ref(true);
const registrationSaving = ref(false);

const defaultVodafoneSettings = (): AdminVodafoneSettings => ({
  walletNumber: null,
  instructionsAr: null,
  instructionsEn: null,
  supportEmail: null,
  supportPhone: null
});

const vodafoneInitial = ref<AdminVodafoneSettings>(defaultVodafoneSettings());
const vodafoneForm = reactive({
  walletNumber: '',
  instructionsAr: '',
  instructionsEn: '',
  supportEmail: '',
  supportPhone: ''
});

const paypalInitialRates = reactive<{ egp: number | null; aed: number | null; sar: number | null }>({
  egp: null,
  aed: null,
  sar: null
});
const paypalForm = reactive({
  egpRate: '',
  aedRate: '',
  sarRate: ''
});
const paypalValidationError = ref<string | null>(null);

const registrationInitial = ref<TeacherRegistrationSettings>({ enabled: false, whatsappNumber: null });
const registrationForm = reactive({
  enabled: false,
  whatsappNumber: ''
});

const rejectDialog = reactive({
  open: false,
  item: null as AdminPaymentLogItem | null,
  reason: '',
  loading: false,
  error: ''
});

const studentFilters = reactive({
  status: 'PENDING_REVIEW' as ManualPaymentStatus
});

const studentPayments = ref<AdminStudentManualPayment[]>([]);
const studentLoading = ref(false);
const studentError = ref<string | null>(null);
const studentActionLoading = ref<number | null>(null);

const studentDialog = reactive({
  open: false,
  action: 'approve' as 'approve' | 'reject',
  payment: null as AdminStudentManualPayment | null,
  notes: '',
  loading: false,
  error: ''
});

const toNullable = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeSlug = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed.toLowerCase() : null;
};

const normalizePlanCode = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed.toLowerCase() : null;
};

const normalizeVodafoneSettings = (settings?: AdminVodafoneSettings | null): AdminVodafoneSettings => ({
  walletNumber: settings?.walletNumber ?? null,
  instructionsAr: settings?.instructionsAr ?? null,
  instructionsEn: settings?.instructionsEn ?? null,
  supportEmail: settings?.supportEmail ?? null,
  supportPhone: settings?.supportPhone ?? null
});

const setVodafoneForm = (settings: AdminVodafoneSettings) => {
  vodafoneForm.walletNumber = settings.walletNumber?.trim() ?? '';
  vodafoneForm.instructionsAr = settings.instructionsAr?.trim() ?? '';
  vodafoneForm.instructionsEn = settings.instructionsEn?.trim() ?? '';
  vodafoneForm.supportEmail = settings.supportEmail?.trim() ?? '';
  vodafoneForm.supportPhone = settings.supportPhone?.trim() ?? '';
};

const applyVodafoneSettings = (settings?: AdminVodafoneSettings | null) => {
  const normalized = normalizeVodafoneSettings(settings);
  vodafoneInitial.value = { ...normalized };
  setVodafoneForm(normalized);
};

const parseRate = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const candidate = Number(value.trim());
    return Number.isFinite(candidate) ? candidate : null;
  }
  return null;
};

const formatRateInput = (rate: number) => {
  if (!Number.isFinite(rate)) {
    return '';
  }
  return rate.toString();
};

const normalizePaypalFormRate = (
  value: string,
  labelKey: string
): { valid: boolean; value: number | null } => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: true, value: null };
  }
  const candidate = Number(trimmed);
  if (!Number.isFinite(candidate) || candidate <= 0) {
    paypalValidationError.value = t('adminPaymentLogs.settings.paypalInvalidFor', {
      field: t(labelKey as any),
      sample: '0.0315'
    });
    return { valid: false, value: null };
  }
  return { valid: true, value: Number(candidate.toFixed(6)) };
};

const applyPaypalSettings = (settings?: AdminPaypalSettings | null) => {
  paypalInitialRates.egp = parseRate(settings?.egyptianPoundToUsdRate ?? null);
  paypalInitialRates.sar = parseRate(settings?.saudiRiyalToUsdRate ?? null);
  paypalInitialRates.aed = parseRate(settings?.uaeDirhamToUsdRate ?? null);
  paypalForm.egpRate = paypalInitialRates.egp != null ? formatRateInput(paypalInitialRates.egp) : '';
  paypalForm.sarRate = paypalInitialRates.sar != null ? formatRateInput(paypalInitialRates.sar) : '';
  paypalForm.aedRate = paypalInitialRates.aed != null ? formatRateInput(paypalInitialRates.aed) : '';
};

const normalizeRegistrationSettings = (settings?: TeacherRegistrationSettings | null): TeacherRegistrationSettings => ({
  enabled: settings?.enabled ?? false,
  whatsappNumber: settings?.whatsappNumber ?? null
});

const setRegistrationForm = (settings: TeacherRegistrationSettings) => {
  registrationForm.enabled = settings.enabled;
  registrationForm.whatsappNumber = settings.whatsappNumber?.trim() ?? '';
};

const applyRegistrationSettings = (settings?: TeacherRegistrationSettings | null) => {
  const normalized = normalizeRegistrationSettings(settings);
  registrationInitial.value = { ...normalized };
  setRegistrationForm(normalized);
};

const reportSettingsError = (key: string) => {
  const message = t(key as any);
  if (!settingsError.value) {
    settingsError.value = message;
  }
  toast.error(message);
};

const loadVodafoneSettings = async () => {
  vodafoneLoading.value = true;
  try {
    const data = await getAdminVodafoneSettings();
    applyVodafoneSettings(data);
  } catch (err) {
    console.error('[AdminPaymentLogs] failed to load Vodafone settings', err);
    applyVodafoneSettings(null);
    reportSettingsError('adminPaymentLogs.settings.loadingError');
  } finally {
    vodafoneLoading.value = false;
  }
};

const loadPaypalSettings = async () => {
  paypalLoading.value = true;
  try {
    const data = await getAdminPaypalSettings();
    applyPaypalSettings(data);
  } catch (err) {
    console.error('[AdminPaymentLogs] failed to load PayPal settings', err);
    applyPaypalSettings(null);
    reportSettingsError('adminPaymentLogs.settings.loadingError');
  } finally {
    paypalLoading.value = false;
  }
};

const loadRegistrationSettings = async () => {
  registrationLoading.value = true;
  try {
    const data = await getAdminTeacherRegistrationSettings();
    applyRegistrationSettings(data);
  } catch (err) {
    console.error('[AdminPaymentLogs] failed to load registration settings', err);
    applyRegistrationSettings(null);
    reportSettingsError('adminPaymentLogs.settings.loadingError');
  } finally {
    registrationLoading.value = false;
  }
};

const loadPaymentSettings = async () => {
  settingsError.value = null;
  await Promise.all([loadVodafoneSettings(), loadPaypalSettings(), loadRegistrationSettings()]);
};

const resetVodafoneForm = () => {
  setVodafoneForm(vodafoneInitial.value);
  toast.info(t('adminPaymentLogs.settings.vodafoneReset'));
};

const resetPaypalForm = () => {
  paypalValidationError.value = null;
  paypalForm.egpRate = paypalInitialRates.egp != null ? formatRateInput(paypalInitialRates.egp) : '';
  paypalForm.sarRate = paypalInitialRates.sar != null ? formatRateInput(paypalInitialRates.sar) : '';
  paypalForm.aedRate = paypalInitialRates.aed != null ? formatRateInput(paypalInitialRates.aed) : '';
  toast.info(t('adminPaymentLogs.settings.paypalReset'));
};

const resetRegistrationForm = () => {
  setRegistrationForm(registrationInitial.value);
  toast.info(t('adminPaymentLogs.settings.registrationReset'));
};

const saveVodafoneSettings = async () => {
  if (vodafoneLoading.value) {
    return;
  }
  vodafoneSaving.value = true;
  try {
    const payload = {
      walletNumber: toNullable(vodafoneForm.walletNumber),
      instructionsAr: toNullable(vodafoneForm.instructionsAr),
      instructionsEn: toNullable(vodafoneForm.instructionsEn),
      supportEmail: toNullable(vodafoneForm.supportEmail),
      supportPhone: toNullable(vodafoneForm.supportPhone)
    };
    const data = await updateAdminVodafoneSettings(payload);
    applyVodafoneSettings(data);
    settingsError.value = null;
    toast.success(t('adminPaymentLogs.settings.vodafoneSaved'));
  } catch (err) {
    console.error('[AdminPaymentLogs] failed to update Vodafone settings', err);
    toast.error(t('adminPaymentLogs.settings.vodafoneSaveError'));
  } finally {
    vodafoneSaving.value = false;
  }
};

const savePaypalSettings = async () => {
  if (paypalLoading.value) {
    return;
  }
  paypalValidationError.value = null;
  const egp = normalizePaypalFormRate(paypalForm.egpRate, 'adminPaymentLogs.settings.paypalEgpRateLabel');
  if (!egp.valid) {
    return;
  }
  const sar = normalizePaypalFormRate(paypalForm.sarRate, 'adminPaymentLogs.settings.paypalSarRateLabel');
  if (!sar.valid) {
    return;
  }
  const aed = normalizePaypalFormRate(paypalForm.aedRate, 'adminPaymentLogs.settings.paypalAedRateLabel');
  if (!aed.valid) {
    return;
  }

  paypalSaving.value = true;
  try {
    const payload = {
      egyptianPoundToUsdRate: egp.value,
      saudiRiyalToUsdRate: sar.value,
      uaeDirhamToUsdRate: aed.value
    };
    const data = await updateAdminPaypalSettings(payload);
    applyPaypalSettings(data);
    settingsError.value = null;
    if (payload.egyptianPoundToUsdRate == null && payload.saudiRiyalToUsdRate == null && payload.uaeDirhamToUsdRate == null) {
      toast.success(t('adminPaymentLogs.settings.paypalCleared'));
    } else {
      toast.success(t('adminPaymentLogs.settings.paypalSaved'));
    }
  } catch (err) {
    console.error('[AdminPaymentLogs] failed to update PayPal rate', err);
    toast.error(t('adminPaymentLogs.settings.paypalSaveError'));
  } finally {
    paypalSaving.value = false;
  }
};

const saveRegistrationSettings = async () => {
  if (registrationLoading.value) {
    return;
  }
  registrationSaving.value = true;
  try {
    const payload = {
      enabled: registrationForm.enabled,
      whatsappNumber: toNullable(registrationForm.whatsappNumber)
    };
    const data = await updateAdminTeacherRegistrationSettings(payload);
    applyRegistrationSettings(data);
    settingsError.value = null;
    toast.success(t('adminPaymentLogs.settings.registrationSaved'));
  } catch (err) {
    console.error('[AdminPaymentLogs] failed to update registration settings', err);
    toast.error(t('adminPaymentLogs.settings.registrationSaveError'));
  } finally {
    registrationSaving.value = false;
  }
};

const methodOptions = computed<SelectOption[]>(() => [
  { value: 'vodafone_cash', label: t('adminPaymentLogs.methods.vodafone') },
  { value: 'paypal', label: t('adminPaymentLogs.methods.paypal') }
]);

const statusOptions = computed<SelectOption[]>(() => [
  { value: 'pending', label: t('adminPaymentLogs.statusLabels.pending') },
  { value: 'processing', label: t('adminPaymentLogs.statusLabels.processing') },
  { value: 'completed', label: t('adminPaymentLogs.statusLabels.completed') },
  { value: 'failed', label: t('adminPaymentLogs.statusLabels.failed') },
  { value: 'refunded', label: t('adminPaymentLogs.statusLabels.refunded') }
]);

const studentStatusOptions = computed<SelectOption[]>(() => [
  { value: 'PENDING_REVIEW', label: t('adminPaymentLogs.student.statusOptions.PENDING_REVIEW') },
  { value: 'APPROVED', label: t('adminPaymentLogs.student.statusOptions.APPROVED') },
  { value: 'REJECTED', label: t('adminPaymentLogs.student.statusOptions.REJECTED') }
]);

const headers = computed(() => [
  { title: t('adminPaymentLogs.table.payer'), key: 'payer', sortable: true },
  { title: t('adminPaymentLogs.table.method'), key: 'method', sortable: true },
  { title: t('adminPaymentLogs.table.amount'), key: 'amount', sortable: true },
  { title: t('adminPaymentLogs.table.status'), key: 'status', sortable: true },
  { title: t('adminPaymentLogs.table.createdAt'), key: 'createdAt', sortable: true },
  { title: t('adminPaymentLogs.table.processedAt'), key: 'processedAt', sortable: true },
  { title: t('adminPaymentLogs.table.details'), key: 'details' },
  { title: t('adminPaymentLogs.table.notes'), key: 'notes' },
  { title: t('adminPaymentLogs.table.receipt'), key: 'receiptUrl' },
  { title: t('adminPaymentLogs.table.actions'), key: 'actions', sortable: false }
]);

const studentHeaders = computed(() => [
  { title: t('adminPaymentLogs.student.table.student'), key: 'student' },
  { title: t('adminPaymentLogs.student.table.course'), key: 'course' },
  { title: t('adminPaymentLogs.student.table.amount'), key: 'amount', sortable: true },
  { title: t('adminPaymentLogs.student.table.createdAt'), key: 'createdAt', sortable: true },
  { title: t('adminPaymentLogs.student.table.status'), key: 'status', sortable: true },
  { title: t('adminPaymentLogs.student.table.notes'), key: 'notes' },
  { title: t('adminPaymentLogs.student.table.proof'), key: 'proofUrl' },
  { title: t('adminPaymentLogs.student.table.actions'), key: 'actions', sortable: false }
]);

const sortBy = computed(() => [
  {
    key: filters.sortField,
    order: filters.sortDesc ? 'desc' : 'asc'
  }
]);

const tableItems = computed(() => items.value);
const studentTableItems = computed(() => studentPayments.value);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  loadPaymentSettings();
});

watch(
  () => [paypalForm.egpRate, paypalForm.aedRate, paypalForm.sarRate],
  () => {
    paypalValidationError.value = null;
  }
);

const SORT_FIELD_MAP: Record<string, string> = {
  payer: 'payerName',
  method: 'method',
  amount: 'amount',
  status: 'status',
  createdAt: 'createdAt',
  processedAt: 'processedAt'
};

const buildQuery = (): AdminPaymentLogsQuery => ({
  method: (filters.method || undefined) as AdminPaymentMethod | undefined,
  status: (filters.status || undefined) as AdminPaymentStatus | undefined,
  search: filters.search || undefined,
  dateFrom: filters.dateFrom || undefined,
  dateTo: filters.dateTo || undefined,
  page: filters.page,
  size: filters.size,
  sortField: SORT_FIELD_MAP[filters.sortField] ?? filters.sortField,
  sortDesc: filters.sortDesc
});

const fetchLogs = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await listAdminPaymentLogs(buildQuery());
    total.value = data.total;
    items.value = data.items;
  } catch (err) {
    console.error('[AdminPaymentLogs] failed to load payment logs', err);
    if (isAxiosError(err)) {
      const responseData = err.response?.data as { code?: string; message?: string } | undefined;
      const candidate =
        responseData?.code ||
        responseData?.message ||
        err.response?.statusText ||
        err.code ||
        err.message;
      error.value = typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : 'generic';
    } else {
      error.value = (err as Error)?.message ?? 'generic';
    }
    toast.error(translateError(error.value));
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  await fetchLogs();
};

const fetchStudentPayments = async () => {
  studentLoading.value = true;
  studentError.value = null;
  try {
    const data = await listAdminStudentPayments(studentFilters.status);
    studentPayments.value = data;
  } catch (err) {
    console.error('[AdminPaymentLogs] failed to load student payments', err);
    studentError.value = t('adminPaymentLogs.student.loadError');
    toast.error(studentError.value);
  } finally {
    studentLoading.value = false;
  }
};

const refreshStudentPayments = async () => {
  await fetchStudentPayments();
};

const resetFilters = () => {
  filters.method = '';
  filters.status = '';
  filters.search = '';
  filters.dateFrom = '';
  filters.dateTo = '';
  filters.page = 1;
  filters.size = 25;
  filters.sortField = 'createdAt';
  filters.sortDesc = true;
};

const onSelect = (field: 'method' | 'status', value: string | null) => {
  filters[field] = value ?? '';
  filters.page = 1;
};

const onPageChange = (page: number) => {
  filters.page = page;
};

const onItemsPerPageChange = (size: number) => {
  filters.size = size;
  filters.page = 1;
};

const onSortChange = (sort: { key: string; order: 'asc' | 'desc' }[]) => {
  const [first] = sort;
  if (!first) {
    filters.sortField = 'createdAt';
    filters.sortDesc = true;
    return;
  }
  filters.sortField = first.key;
  filters.sortDesc = first.order !== 'asc';
};

const formatAmount = (amount: number, currency?: string | null) => {
  if (!Number.isFinite(amount)) {
    return String(amount ?? '—');
  }
  const normalizedCurrency = currency?.trim();
  if (!normalizedCurrency) {
    return amount.toFixed(2);
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.warn('[AdminPaymentLogs] unable to format amount', error);
    return `${amount.toFixed(2)} ${normalizedCurrency}`;
  }
};

const formatMethod = (method: string) => {
  if (method === 'vodafone_cash') {
    return t('adminPaymentLogs.methods.vodafone');
  }
  if (method === 'paypal') {
    return t('adminPaymentLogs.methods.paypal');
  }
  return method.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const statusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'processing':
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    case 'refunded':
      return 'secondary';
    default:
      return 'info';
  }
};

const formatStatus = (status: string) => {
  const key = `adminPaymentLogs.statusLabels.${status}`;
  const translated = t(key as any);
  if (translated !== key) {
    return translated;
  }
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const studentStatusColor = (status: ManualPaymentStatus) => {
  const normalized = String(status ?? '').toUpperCase();
  switch (normalized) {
    case 'APPROVED':
    case 'SUCCESS':
      return 'success';
    case 'REJECTED':
    case 'FAILED':
      return 'danger';
    default:
      return 'warning';
  }
};

const formatStudentStatus = (status: ManualPaymentStatus) => {
  const normalized = String(status ?? '').toUpperCase();
  const key = `adminPaymentLogs.student.statusLabels.${normalized}`;
  const translated = t(key as any);
  if (translated !== key) {
    return translated;
  }
  return normalized.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const translateError = (code: string | null) => {
  if (!code) {
    return t('adminPaymentLogs.errors.generic');
  }
  const key = `errors.${code}`;
  const translated = t(key as any);
  if (translated !== key) {
    return translated;
  }
  const scopedKey = `adminPaymentLogs.errors.${code}`;
  const scoped = t(scopedKey as any);
  return scoped !== scopedKey ? scoped : t('adminPaymentLogs.errors.generic');
};

const parseNumericId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseStringValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }
  return null;
};

const normalizeDateForApi = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const asDate = new Date(trimmed);
  if (!Number.isNaN(asDate.getTime())) {
    return asDate.toISOString();
  }
  const iso = `${trimmed}T00:00:00Z`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
};

const metadataString = (metadata: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const candidate = parseStringValue(metadata[key]);
    if (candidate) {
      return candidate;
    }
  }
  return null;
};

const metadataNumber = (metadata: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const candidate = parseNumericId(metadata[key]);
    if (candidate != null) {
      return candidate;
    }
  }
  return null;
};

const metadataDate = (metadata: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const candidate = normalizeDateForApi(parseStringValue(metadata[key]));
    if (candidate) {
      return candidate;
    }
  }
  return null;
};

const resolveTeacherSlug = async (teacherId: number): Promise<string | null> => {
  if (teacherSlugCache.has(teacherId)) {
    return teacherSlugCache.get(teacherId) ?? null;
  }
  try {
    const teacher = await fetchTeacherDetail(teacherId);
    const slug = normalizeSlug(teacher.slug);
    teacherSlugCache.set(teacherId, slug);
    return slug;
  } catch (error) {
    console.error('[AdminPaymentLogs] failed to resolve teacher slug', error);
    teacherSlugCache.set(teacherId, null);
    return null;
  }
};

const populatePlanTemplateCache = (templates: PlanTemplateSummary[]) => {
  planTemplateCache.clear();
  templates
    .filter((template) => template.status === 'PUBLISHED')
    .forEach((template) => {
      const key = normalizePlanCode(template.code);
      if (!key) {
        return;
      }
      const existing = planTemplateCache.get(key);
      if (!existing || template.version > existing.version) {
        planTemplateCache.set(key, template);
      }
    });
};

const loadPlanTemplatesCache = async (force = false) => {
  if (!force && planTemplatesLoaded) {
    return;
  }
  if (!planTemplatesPromise) {
    planTemplatesPromise = listPlanTemplates()
      .then((templates) => {
        populatePlanTemplateCache(templates);
        planTemplatesLoaded = true;
      })
      .catch((error) => {
        planTemplatesLoaded = false;
        throw error;
      })
      .finally(() => {
        planTemplatesPromise = null;
      });
  }
  await planTemplatesPromise;
};

const resolveLatestPublishedTemplate = async (
  planCode: string
): Promise<PlanTemplateSummary | null> => {
  const normalized = normalizePlanCode(planCode);
  if (!normalized) {
    return null;
  }
  await loadPlanTemplatesCache();
  let template = planTemplateCache.get(normalized);
  if (template) {
    return template;
  }
  await loadPlanTemplatesCache(true);
  template = planTemplateCache.get(normalized);
  return template ?? null;
};

const assignPlanTemplateForPayment = async (payment: AdminPaymentLogItem) => {
  const metadata = (payment.metadata ?? {}) as Record<string, unknown>;

  const teacherId =
    metadataNumber(metadata, ['teacherId', 'teacher_id', 'teacherID', 'teacher']) ?? null;
  const tenantSlugFromMetadata = normalizeSlug(
    metadataString(metadata, ['tenantSlug', 'tenant_slug', 'teacherSlug', 'teacher_slug'])
  );
  const templateKey = metadataString(metadata, [
    'templateKey',
    'planTemplateKey',
    'planTemplate',
    'template_key',
    'plan_template_key'
  ]);

  let planCode: string | null = null;
  let version: number | null = null;

  if (templateKey) {
    const [codePart, versionPart] = templateKey.split('::');
    planCode = normalizePlanCode(parseStringValue(codePart));
    version = parseNumericId(versionPart);
  }

  if (!planCode) {
    const metadataPlanCode = metadataString(metadata, [
      'planCode',
      'plan_code',
      'planTemplateCode',
      'plan_template_code',
      'plan'
    ]);
    planCode =
      normalizePlanCode(metadataPlanCode) ?? normalizePlanCode(parseStringValue(payment.reference));
  }

  if (version == null) {
    version = metadataNumber(metadata, [
      'planVersion',
      'plan_version',
      'templateVersion',
      'template_version',
      'version'
    ]);
  }

  if (teacherId == null && !tenantSlugFromMetadata) {
    console.error('[AdminPaymentLogs] missing teacher identifiers for payment', payment.id, metadata);
    throw new Error('missingMetadata');
  }

  if (!planCode) {
    console.error('[AdminPaymentLogs] missing plan code for payment', payment.id, metadata);
    throw new Error('missingMetadata');
  }

  const effectiveFrom = metadataDate(metadata, [
    'effectiveFrom',
    'effective_from',
    'planEffectiveFrom',
    'plan_effective_from'
  ]);
  const effectiveTo = metadataDate(metadata, [
    'effectiveTo',
    'effective_to',
    'planEffectiveTo',
    'plan_effective_to'
  ]);

  let tenantSlug = tenantSlugFromMetadata;
  if (!tenantSlug && teacherId != null) {
    tenantSlug = await resolveTeacherSlug(teacherId);
  }

  if (!tenantSlug) {
    console.error('[AdminPaymentLogs] unable to resolve teacher slug for payment', payment.id, teacherId);
    throw new Error('missingTeacher');
  }

  if (version == null) {
    const template = await resolveLatestPublishedTemplate(planCode);
    if (!template) {
      console.error('[AdminPaymentLogs] unable to resolve published template for plan', planCode);
      throw new Error('templateUnavailable');
    }
    planCode = normalizePlanCode(template.code);
    version = template.version;
  }

  if (version == null) {
    console.error('[AdminPaymentLogs] missing plan version for assignment', payment.id, metadata);
    throw new Error('missingMetadata');
  }

  await assignTenantPlanTemplate({
    tenantSlug,
    planCode,
    version,
    effectiveFrom,
    effectiveTo
  });
};

const isActionLoading = (id: number) => actionLoading.value === id;
const isStudentActionLoading = (id: number) => studentActionLoading.value === id;

const canReview = (item: AdminPaymentLogItem) => {
  const status = (item.status ?? '').toString().toLowerCase();
  const method = (item.method ?? '').toString().toLowerCase();
  if (method !== 'vodafone_cash') {
    return false;
  }
  return status === 'pending' || status === 'processing';
};

const resolveActionError = (err: unknown) => {
  if (isAxiosError(err)) {
    const responseData = err.response?.data as { code?: string; message?: string } | undefined;
    const candidate =
      responseData?.code ||
      responseData?.message ||
      err.response?.statusText ||
      err.code ||
      err.message;
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return translateError(candidate);
    }
  }
  if (err instanceof Error && err.message) {
    return translateError(err.message);
  }
  return translateError('generic');
};

const canReviewStudentPayment = (payment: AdminStudentManualPayment) => {
  const status = String(payment.status ?? '').toUpperCase();
  return status === 'PENDING_REVIEW';
};

const onStudentStatusChange = (value: string | null) => {
  const normalized = value && value.length > 0 ? value : 'PENDING_REVIEW';
  studentFilters.status = normalized as ManualPaymentStatus;
};

const openStudentDecision = (payment: AdminStudentManualPayment, action: 'approve' | 'reject') => {
  if (!canReviewStudentPayment(payment)) {
    return;
  }
  if (isStudentActionLoading(payment.id)) {
    return;
  }
  studentDialog.payment = payment;
  studentDialog.action = action;
  studentDialog.notes = '';
  studentDialog.error = '';
  studentDialog.open = true;
};

const closeStudentDialog = () => {
  if (studentDialog.loading) {
    return;
  }
  studentDialog.open = false;
};

const studentDialogTitle = computed(() =>
  studentDialog.action === 'approve'
    ? (t('adminPaymentLogs.student.actions.dialogTitleApprove') as string)
    : (t('adminPaymentLogs.student.actions.dialogTitleReject') as string)
);

const studentDialogSubmitLabel = computed(() =>
  studentDialog.action === 'approve'
    ? (t('adminPaymentLogs.student.actions.submitApprove') as string)
    : (t('adminPaymentLogs.student.actions.submitReject') as string)
);

const studentDialogSummary = computed(() => {
  if (!studentDialog.payment) {
    return '';
  }
  const payment = studentDialog.payment;
  const studentName = payment.studentName || (payment.studentId != null ? `#${payment.studentId}` : t('adminPaymentLogs.student.unknownStudent'));
  const courseTitle = payment.courseTitle || (payment.courseId != null ? `#${payment.courseId}` : t('adminPaymentLogs.student.unknownCourse'));
  return t('adminPaymentLogs.student.actions.summary', {
    amount: formatAmount(payment.amount, payment.currency),
    student: studentName,
    course: courseTitle
  }) as string;
});

const submitStudentDecision = async () => {
  if (!studentDialog.payment || studentDialog.loading) {
    return;
  }
  const notes = studentDialog.notes.trim();
  if (studentDialog.action === 'reject' && notes.length === 0) {
    studentDialog.error = t('adminPaymentLogs.student.actions.reasonRequired');
    return;
  }
  studentDialog.error = '';
  studentDialog.loading = true;
  studentActionLoading.value = studentDialog.payment.id;
  const payload: AdminStudentPaymentDecisionPayload | undefined = notes.length > 0 ? { notes } : undefined;
  try {
    if (studentDialog.action === 'approve') {
      await approveAdminStudentPayment(studentDialog.payment.id, payload);
      toast.success(t('adminPaymentLogs.student.actions.successApprove'));
    } else {
      await rejectAdminStudentPayment(studentDialog.payment.id, payload);
      toast.success(t('adminPaymentLogs.student.actions.successReject'));
    }
    studentDialog.open = false;
    await fetchStudentPayments();
  } catch (err) {
    console.error('[AdminPaymentLogs] failed to submit student payment decision', err);
    const key =
      studentDialog.action === 'approve'
        ? 'adminPaymentLogs.student.actions.errorApprove'
        : 'adminPaymentLogs.student.actions.errorReject';
    const message = t(key as any) as string;
    studentDialog.error = message;
    toast.error(message);
  } finally {
    studentDialog.loading = false;
    studentActionLoading.value = null;
  }
};

const confirmApprove = async (item: AdminPaymentLogItem) => {
  if (!canReview(item)) {
    return;
  }
  if (isActionLoading(item.id)) {
    return;
  }
  const confirmed = window.confirm(
    t('adminPaymentLogs.actions.confirmApprove', {
      payer: item.payerName || '#',
      amount: formatAmount(item.amount, item.currency)
    }) as string
  );
  if (!confirmed) {
    return;
  }
  actionLoading.value = item.id;
  try {
    const approved = await approveAdminPaymentLog(item.id);
    await assignPlanTemplateForPayment(approved ?? item);
    toast.success(t('adminPaymentLogs.actions.approveSuccess'));
  } catch (err) {
    console.error('[AdminPaymentLogs] failed to approve payment', err);
    toast.error(resolveActionError(err));
  } finally {
    actionLoading.value = null;
    await fetchLogs();
  }
};

const openRejectDialog = (item: AdminPaymentLogItem) => {
  if (!canReview(item)) {
    return;
  }
  if (isActionLoading(item.id)) {
    return;
  }
  rejectDialog.item = item;
  rejectDialog.reason = '';
  rejectDialog.error = '';
  rejectDialog.open = true;
};

const closeRejectDialog = () => {
  if (rejectDialog.loading) {
    return;
  }
  rejectDialog.open = false;
};

const rejectSummary = computed(() => {
  if (!rejectDialog.item) {
    return '';
  }
  return t('adminPaymentLogs.actions.rejectSummary', {
    payer: rejectDialog.item.payerName || '#',
    amount: formatAmount(rejectDialog.item.amount, rejectDialog.item.currency)
  }) as string;
});

const submitReject = async () => {
  if (!rejectDialog.item || rejectDialog.loading) {
    return;
  }
  const reason = rejectDialog.reason.trim();
  if (reason.length === 0) {
    rejectDialog.error = t('adminPaymentLogs.actions.reasonRequired');
    return;
  }
  rejectDialog.error = '';
  rejectDialog.loading = true;
  actionLoading.value = rejectDialog.item.id;
  try {
    await rejectAdminPaymentLog(rejectDialog.item.id, { reason });
    toast.success(t('adminPaymentLogs.actions.rejectSuccess'));
    rejectDialog.open = false;
    await fetchLogs();
  } catch (err) {
    console.error('[AdminPaymentLogs] failed to reject payment', err);
    rejectDialog.error = resolveActionError(err);
  } finally {
    rejectDialog.loading = false;
    actionLoading.value = null;
  }
};

watch(
  () => [
    filters.method,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    filters.page,
    filters.size,
    filters.sortField,
    filters.sortDesc
  ],
  () => {
    fetchLogs();
  },
  { immediate: true }
);

watch(
  () => filters.search,
  () => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    searchTimer = setTimeout(() => {
      filters.page = 1;
      fetchLogs();
    }, 300);
  }
);

watch(
  () => studentFilters.status,
  () => {
    fetchStudentPayments();
  },
  { immediate: true }
);

watch(
  () => rejectDialog.open,
  (open) => {
    if (!open) {
      rejectDialog.item = null;
      rejectDialog.reason = '';
      rejectDialog.error = '';
      rejectDialog.loading = false;
    }
  }
);

watch(
  () => studentDialog.open,
  (open) => {
    if (!open) {
      studentDialog.payment = null;
      studentDialog.notes = '';
      studentDialog.error = '';
      studentDialog.loading = false;
    }
  }
);
</script>

<style scoped>
.admin-payment-logs {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-6);
  width: min(100%, 72rem);
  margin-inline: auto;
}

.admin-payment-logs__card {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
}

.admin-payment-logs__settings {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.admin-payment-logs__settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-payment-logs__settings-form h3 {
  margin: 0;
  font-size: 1.1rem;
}

.admin-payment-logs__settings-hint {
  margin: -0.25rem 0 0;
  color: var(--theme-text-muted);
  font-size: 0.875rem;
}

.admin-payment-logs__settings-alert {
  margin-top: -0.25rem;
}

.admin-payment-logs__alert {
  margin-bottom: -0.75rem;
}

.admin-payment-logs__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  align-items: end;
}

.admin-payment-logs__date-range {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.admin-payment-logs__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.admin-payment-logs__form-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.admin-payment-logs__student-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.admin-payment-logs__table :deep(tbody tr td) {
  vertical-align: middle;
}

.admin-payment-logs__cell {
  display: flex;
  flex-direction: column;
}

.admin-payment-logs__primary {
  font-weight: 600;
}

.admin-payment-logs__secondary {
  color: var(--theme-text-muted);
  font-size: 0.875rem;
}

.admin-payment-logs__details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.admin-payment-logs__details-item {
  color: var(--theme-text-muted);
  font-size: 0.875rem;
}

.admin-payment-logs__link {
  color: var(--theme-primary-color);
  font-weight: 600;
  text-decoration: none;
}

.admin-payment-logs__link:hover {
  text-decoration: underline;
}

.admin-payment-logs__actions-cell {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.admin-payment-logs__dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-payment-logs__dialog-summary {
  margin: 0;
  color: var(--theme-text-muted);
}

.admin-payment-logs__dialog-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}
</style>
