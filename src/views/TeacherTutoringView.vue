<template>
  <ThemePage :title="t('tutoring.teacher.nav')" :subtitle="t('tutoring.teacher.availabilityTitle')">
    <template #meta>
      <div class="teacher-tutoring__summary">
        <div class="teacher-tutoring__summary-grid">
          <UiStatCard
            class="teacher-tutoring__summary-card"
            color="info"
            icon="CalendarOutlined"
            :label="t('tutoring.teacher.overviewNextSession')"
            :value="nextSessionLabel"
            :secondary-stat="nextSessionDescription"
          />
          <UiStatCard
            class="teacher-tutoring__summary-card"
            color="success"
            icon="TeamOutlined"
            :label="t('tutoring.teacher.overviewTodayBookings')"
            :value="confirmedTodayCount.toString()"
            :secondary-stat="t('tutoring.teacher.overviewTodayBookingsHint')"
          />
          <UiStatCard
            class="teacher-tutoring__summary-card"
            color="warning"
            icon="DollarOutlined"
            :label="t('tutoring.teacher.overviewExpectedRevenue')"
            :value="projectedRevenueDisplay"
            :secondary-stat="t('tutoring.teacher.overviewExpectedRevenueHint', { count: upcomingSessionCount })"
          />
        </div>
        <div class="teacher-tutoring__summary-actions">
          <UiButton color="primary" prepend-icon="PlusOutlined" @click="openSlotDialog()">
            {{ t('tutoring.teacher.addSlot') }}
          </UiButton>
          <UiButton variant="outline" color="secondary" prepend-icon="ReloadOutlined" @click="refreshAll">
            {{ t('common.refresh') }}
          </UiButton>
        </div>
      </div>
    </template>

    <section class="teacher-tutoring">
      <div class="teacher-tutoring__column teacher-tutoring__column--main">
        <UiCard :title="t('tutoring.teacher.availabilityTitle')" hover>
          <form class="teacher-tutoring__filters" @submit.prevent="applyAvailabilityFilters">
            <UiSelect v-model="availabilityView" :label="t('tutoring.teacher.viewMode')">
              <option value="agenda">{{ t('tutoring.teacher.viewAgenda') }}</option>
              <option value="list">{{ t('tutoring.teacher.viewList') }}</option>
            </UiSelect>
            <UiInput v-model="availabilityFilters.from" type="date" :label="t('tutoring.teacher.filterFrom')" />
            <UiInput v-model="availabilityFilters.to" type="date" :label="t('tutoring.teacher.filterTo')" />
            <UiInput
              v-model.number="availabilityFilters.size"
              type="number"
              min="1"
              max="50"
              :label="t('tutoring.teacher.filterPageSize')"
            />
            <div class="teacher-tutoring__filters-actions">
              <UiButton type="submit" color="primary" :loading="availabilityLoading">
                {{ t('common.apply') }}
              </UiButton>
            </div>
          </form>

          <UiAlert v-if="store.error" color="danger" variant="soft">{{ t(`tutoring.errors.${store.error}`) }}</UiAlert>

          <div v-if="availabilityView === 'agenda'" class="teacher-tutoring__agenda">
            <template v-if="agendaGroups.length">
              <div v-for="group in agendaGroups" :key="group.key" class="teacher-tutoring__agenda-day">
                <h4>{{ group.label }}</h4>
                <div class="teacher-tutoring__agenda-slots">
                  <UiCard
                    v-for="slot in group.slots"
                    :key="slot.id"
                    class="teacher-tutoring__agenda-slot"
                    :class="{
                      'teacher-tutoring__agenda-slot--booked': slot.booked,
                      'teacher-tutoring__agenda-slot--available': !slot.booked
                    }"
                  >
                    <header class="teacher-tutoring__agenda-slot-header">
                      <div class="teacher-tutoring__agenda-slot-time">
                        <UiIcon name="ClockCircleOutlined" :size="18" />
                        <div>
                          <span>{{ formatTeacherTime(slot) }}</span>
                          <small>{{ formatLocalTime(slot) }}</small>
                        </div>
                      </div>
                      <UiTag :color="slot.booked ? 'warning' : 'success'" size="sm">
                        {{ slot.booked ? t('tutoring.teacher.slotBooked') : t('tutoring.teacher.slotAvailable') }}
                      </UiTag>
                    </header>
                    <div class="teacher-tutoring__agenda-slot-meta">
                      <span>
                        <UiIcon name="HourglassOutlined" :size="16" />
                        {{ t('tutoring.teacher.durationLabel', { minutes: slot.durationMinutes }) }}
                      </span>
                      <span>
                        <UiIcon name="DollarOutlined" :size="16" />
                        <span v-if="hasSlotRate(slot)">{{ formatSlotRate(slot) }}</span>
                        <UiTag v-else color="neutral" size="sm">{{ t('tutoring.teacher.rateUnset') }}</UiTag>
                      </span>
                    </div>
                    <div class="teacher-tutoring__agenda-actions">
                      <UiButton
                        variant="link"
                        color="primary"
                        size="sm"
                        prepend-icon="EditOutlined"
                        :disabled="slot.booked"
                        @click="openSlotDialog(slot)"
                      >
                        {{ t('common.edit') }}
                      </UiButton>
                      <UiButton
                        variant="link"
                        color="danger"
                        size="sm"
                        prepend-icon="DeleteOutlined"
                        :disabled="slot.booked"
                        @click="removeSlot(slot.id)"
                      >
                        {{ t('common.delete') }}
                      </UiButton>
                      <UiTag v-if="slot.booked" color="warning" size="sm">{{ t('tutoring.teacher.slotBooked') }}</UiTag>
                    </div>
                  </UiCard>
                </div>
              </div>
            </template>
            <UiAlert v-else color="info" variant="soft">{{ t('tutoring.teacher.noAvailability') }}</UiAlert>
          </div>

          <template v-else>
            <UiTable
              class="teacher-tutoring__table"
              :headers="availabilityHeaders"
              :items="store.teacherAvailability.items"
              density="comfortable"
              :loading="availabilityLoading"
            >
              <template #item.startAt="{ item }">
                <div class="teacher-tutoring__slot-meta">
                  <span>{{ formatTeacherTime(item) }}</span>
                  <small>{{ formatLocalTime(item) }}</small>
                </div>
              </template>
              <template #item.hourlyRate="{ item }">
                <span>{{ formatSlotRate(item) }}</span>
              </template>
              <template #item.booked="{ item }">
                <UiTag :color="item.booked ? 'info' : 'success'" size="sm">
                  {{ item.booked ? t('tutoring.teacher.slotBooked') : t('tutoring.teacher.slotAvailable') }}
                </UiTag>
              </template>
              <template #item.actions="{ item }">
                <div class="teacher-tutoring__row-actions">
                  <UiButton variant="link" color="primary" prepend-icon="EditOutlined" :disabled="item.booked" @click="openSlotDialog(item)">
                    {{ t('common.edit') }}
                  </UiButton>
                  <UiButton variant="link" color="danger" prepend-icon="DeleteOutlined" :disabled="item.booked" @click="removeSlot(item.id)">
                    {{ t('common.delete') }}
                  </UiButton>
                </div>
              </template>
            </UiTable>
            <div
              class="teacher-tutoring__list teacher-tutoring__list--availability"
              role="list"
            >
              <article
                v-for="slot in store.teacherAvailability.items"
                :key="slot.id"
                class="teacher-tutoring__list-item"
                role="listitem"
              >
                <header class="teacher-tutoring__list-header">
                  <div class="teacher-tutoring__list-times">
                    <strong>{{ formatTeacherTime(slot) }}</strong>
                    <span>{{ formatLocalTime(slot) }}</span>
                  </div>
                  <UiTag :color="slot.booked ? 'info' : 'success'" size="sm">
                    {{ slot.booked ? t('tutoring.teacher.slotBooked') : t('tutoring.teacher.slotAvailable') }}
                  </UiTag>
                </header>
                <dl class="teacher-tutoring__list-grid">
                  <div>
                    <dt>{{ t('assessments.tableDuration') }}</dt>
                    <dd>{{ slot.durationMinutes }} {{ t('publicCourse.minutesSuffix') }}</dd>
                  </div>
                  <div>
                    <dt>{{ t('tutoring.teacher.hourlyRate') }}</dt>
                    <dd>{{ formatSlotRate(slot) }}</dd>
                  </div>
                </dl>
                <div class="teacher-tutoring__list-actions">
                  <UiButton
                    variant="outline"
                    color="primary"
                    size="sm"
                    prepend-icon="EditOutlined"
                    :disabled="slot.booked"
                    @click="openSlotDialog(slot)"
                  >
                    {{ t('common.edit') }}
                  </UiButton>
                  <UiButton
                    variant="outline"
                    color="danger"
                    size="sm"
                    prepend-icon="DeleteOutlined"
                    :disabled="slot.booked"
                    @click="removeSlot(slot.id)"
                  >
                    {{ t('common.delete') }}
                  </UiButton>
                </div>
              </article>
            </div>
            <div class="teacher-tutoring__pagination" v-if="store.teacherAvailability.total > store.teacherAvailability.size">
              <UiButton
                variant="link"
                color="secondary"
                :disabled="store.teacherAvailability.page === 0"
                @click="changeAvailabilityPage(store.teacherAvailability.page - 1)"
              >
                {{ t('common.previous') }}
              </UiButton>
              <span>{{ pageSummary(store.teacherAvailability) }}</span>
              <UiButton
                variant="link"
                color="secondary"
                :disabled="(store.teacherAvailability.page + 1) * store.teacherAvailability.size >= store.teacherAvailability.total"
                @click="changeAvailabilityPage(store.teacherAvailability.page + 1)"
              >
                {{ t('common.next') }}
              </UiButton>
            </div>
          </template>
        </UiCard>

        <UiCard :title="t('tutoring.teacher.sessionsTitle')" hover>
          <form class="teacher-tutoring__filters" @submit.prevent="applySessionFilters">
            <UiSelect v-model="sessionFilters.status" :label="t('tutoring.teacher.statusFilter')">
              <option value="">{{ t('common.all') }}</option>
              <option value="pending">{{ t('tutoring.status.pending') }}</option>
              <option value="confirmed">{{ t('tutoring.status.confirmed') }}</option>
              <option value="completed">{{ t('tutoring.status.completed') }}</option>
              <option value="cancelled">{{ t('tutoring.status.cancelled') }}</option>
            </UiSelect>
            <UiInput v-model="sessionFilters.from" type="date" :label="t('tutoring.teacher.filterFrom')" />
            <UiInput v-model="sessionFilters.to" type="date" :label="t('tutoring.teacher.filterTo')" />
            <UiInput
              v-model.number="sessionFilters.size"
              type="number"
              min="1"
              max="50"
              :label="t('tutoring.teacher.filterPageSize')"
            />
            <div class="teacher-tutoring__filters-actions">
              <UiButton type="submit" color="primary" :loading="sessionsLoading">
                {{ t('common.apply') }}
              </UiButton>
            </div>
          </form>

          <template v-if="!store.teacherSessions.items.length">
            <UiAlert color="info" variant="soft">{{ t('tutoring.teacher.noSessions') }}</UiAlert>
          </template>
          <template v-else>
          <UiTable
              class="teacher-tutoring__table"
              :headers="sessionHeaders"
              :items="store.teacherSessions.items"
              density="comfortable"
              :loading="sessionsLoading"
            >
              <template #item.slot="{ item }">
                <div class="teacher-tutoring__slot-meta">
                  <span>{{ formatTeacherTime(item.slot) }}</span>
                  <small>{{ formatLocalTime(item.slot) }}</small>
                </div>
              </template>
              <template #item.status="{ item }">
                <UiTag :color="statusColor(item.status)" size="sm">{{ t(`tutoring.status.${item.status}`) }}</UiTag>
              </template>
              <template #item.latestPayment="{ item }">
                <div v-if="item.latestPayment" class="teacher-tutoring__slot-meta">
                  <span>{{ formatPaymentAmount(item.latestPayment, item.slot) }}</span>
                  <UiTag :color="paymentStatusColor(item.latestPayment.status)" size="sm">
                    {{ t(`tutoring.paymentStatus.${item.latestPayment.status}`) }}
                  </UiTag>
                </div>
                <span v-else>—</span>
              </template>
              <template #item.actions="{ item }">
                <UiButton variant="link" color="primary" prepend-icon="EyeOutlined" @click="openSession(item.id)">
                  {{ t('tutoring.teacher.viewSession') }}
                </UiButton>
              </template>
            </UiTable>
            <div class="teacher-tutoring__list" role="list">
              <article
                v-for="session in store.teacherSessions.items"
                :key="session.id"
                class="teacher-tutoring__list-item"
                role="listitem"
              >
                <header class="teacher-tutoring__list-header">
                  <div class="teacher-tutoring__list-titles">
                    <strong>{{ session.studentName }}</strong>
                    <span>{{ session.studentEmail }}</span>
                  </div>
                  <UiTag :color="session.status === 'completed' ? 'success' : session.status === 'pending' ? 'warning' : 'info'" size="sm">
                    {{ t(`tutoring.status.${session.status}`) }}
                  </UiTag>
                </header>
                <dl class="teacher-tutoring__list-grid">
                  <div>
                    <dt>{{ t('tutoring.teacher.startAt') }}</dt>
                    <dd>{{ formatTeacherTime(session.slot) }}</dd>
                  </div>
                  <div>
                    <dt>{{ t('assessments.tableDuration') }}</dt>
                    <dd>{{ session.durationMinutes }} {{ t('publicCourse.minutesSuffix') }}</dd>
                  </div>
                  <div>
                    <dt>{{ t('student.tableAmount') }}</dt>
                    <dd>{{ formatSlotRate(session) }}</dd>
                  </div>
                </dl>
                <div class="teacher-tutoring__list-actions">
                  <UiButton
                    variant="outline"
                    color="primary"
                    size="sm"
                    prepend-icon="EyeOutlined"
                    @click="selectSession(session)"
                  >
                    {{ t('tutoring.teacher.viewDetails') }}
                  </UiButton>
                </div>
              </article>
            </div>
            <div class="teacher-tutoring__pagination" v-if="store.teacherSessions.total > store.teacherSessions.size">
              <UiButton
                variant="link"
                color="secondary"
                :disabled="store.teacherSessions.page === 0"
                @click="changeSessionPage(store.teacherSessions.page - 1)"
              >
                {{ t('common.previous') }}
              </UiButton>
              <span>{{ pageSummary(store.teacherSessions) }}</span>
              <UiButton
                variant="link"
                color="secondary"
                :disabled="(store.teacherSessions.page + 1) * store.teacherSessions.size >= store.teacherSessions.total"
                @click="changeSessionPage(store.teacherSessions.page + 1)"
              >
                {{ t('common.next') }}
              </UiButton>
            </div>
          </template>
        </UiCard>
      </div>

      <aside class="teacher-tutoring__column teacher-tutoring__column--side">
        <UiCard :title="t('tutoring.teacher.paymentsTitle')" hover>
          <template v-if="!store.teacherPayments.length">
            <UiAlert color="info" variant="soft">{{ t('tutoring.teacher.noPayments') }}</UiAlert>
          </template>
          <template v-else>
            <ul class="teacher-tutoring__payments">
              <li v-for="payment in store.teacherPayments" :key="payment.id" class="teacher-tutoring__payment-item">
                <article class="teacher-tutoring__payment-card">
                  <header class="teacher-tutoring__payment-head">
                    <div class="teacher-tutoring__payment-icon">
                      <UiIcon name="CreditCardOutlined" :size="18" />
                    </div>
                    <div class="teacher-tutoring__payment-info">
                      <strong>#{{ payment.id }}</strong>
                      <span>{{ formatPaymentAmount(payment) }}</span>
                    </div>
                    <UiTag :color="paymentStatusColor(payment.status)" size="sm">
                      {{ t(`tutoring.paymentStatus.${payment.status}`) }}
                    </UiTag>
                  </header>
                  <div class="teacher-tutoring__payment-meta">
                    <span>
                      <UiIcon name="SwapOutlined" :size="14" />
                      {{ paymentMethodLabel(payment.method) }}
                    </span>
                    <span>
                      <UiIcon name="CalendarOutlined" :size="14" />
                      {{ formatPaymentTimestamp(payment.submittedAt) }}
                    </span>
                  </div>
                  <footer class="teacher-tutoring__payment-actions">
                    <UiButton
                      variant="outline"
                      color="primary"
                      size="sm"
                      prepend-icon="CheckCircleOutlined"
                      @click="openPaymentDecision(payment)"
                    >
                      {{ t('tutoring.teacher.reviewPayment') }}
                    </UiButton>
                  </footer>
                </article>
              </li>
            </ul>
          </template>
        </UiCard>
      </aside>
    </section>

    <UiDialog v-model="slotDialog" :title="editingSlot ? t('tutoring.teacher.editSlot') : t('tutoring.teacher.addSlot')" width="500px">
      <form class="teacher-tutoring__form" @submit.prevent="saveSlot">
        <UiDateTimePicker v-model="slotForm.startAt" :label="t('tutoring.teacher.startAt')" clearable required />
        <UiDateTimePicker v-model="slotForm.endAt" :label="t('tutoring.teacher.endAt')" clearable required />
        <UiInput v-model="slotForm.timeZone" :label="t('tutoring.teacher.timeZone')" required />
        <UiSelect v-model="slotForm.currency" :label="t('tutoring.teacher.currencyLabel')" required>
          <option v-for="option in currencyOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </UiSelect>
        <UiInput
          :model-value="slotForm.hourlyRate"
          type="number"
          min="0"
          step="0.5"
          :label="t('tutoring.teacher.hourlyRate')"
          @update:model-value="onHourlyRateChange"
        >
          <template #suffix>{{ slotCurrencyDisplay }}</template>
        </UiInput>
        <div class="teacher-tutoring__dialog-actions">
          <UiButton variant="link" color="secondary" @click="slotDialog = false">{{ t('common.cancel') }}</UiButton>
          <UiButton button-type="submit" color="primary" :disabled="formSubmitting">
            {{ editingSlot ? t('common.update') : t('common.create') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model="sessionDialog" :title="sessionDialogTitle" width="680px">
      <template v-if="store.teacherSelectedSession">
        <div class="teacher-tutoring__session">
          <div class="teacher-tutoring__session-header">
            <div class="teacher-tutoring__session-meta">
              <span class="teacher-tutoring__session-student">{{ store.teacherSelectedSession.studentName }}</span>
              <span class="teacher-tutoring__session-email">{{ store.teacherSelectedSession.studentEmail }}</span>
            </div>
            <UiTag :color="statusColor(store.teacherSelectedSession.status)" size="sm">
              {{ t(`tutoring.status.${store.teacherSelectedSession.status}`) }}
            </UiTag>
          </div>
          <div class="teacher-tutoring__session-row">
            <strong>{{ t('tutoring.teacher.slotWindow') }}</strong>
            <span>
              {{ formatTeacherTime(store.teacherSelectedSession.slot) }} ·
              {{ formatLocalTime(store.teacherSelectedSession.slot) }}
            </span>
          </div>
          <div v-if="store.teacherSelectedSession.joinUrl" class="teacher-tutoring__session-row">
            <strong>{{ t('tutoring.teacher.joinLink') }}</strong>
            <UiButton variant="link" color="primary" append-icon="ExportOutlined" :href="store.teacherSelectedSession.joinUrl" target="_blank">
              {{ store.teacherSelectedSession.joinUrl }}
            </UiButton>
          </div>
          <div v-if="store.teacherSelectedSession.latestPayment" class="teacher-tutoring__session-row">
            <strong>{{ t('tutoring.teacher.paymentLabel') }}</strong>
            <span>
              {{ formatPaymentAmount(store.teacherSelectedSession.latestPayment, store.teacherSelectedSession.slot) }} ·
              {{ t(`tutoring.paymentStatus.${store.teacherSelectedSession.latestPayment.status}`) }}
            </span>
          </div>
          <UiTextarea v-model="notes" :label="t('tutoring.teacher.notesLabel')" :rows="4" @blur="saveNotes" />
          <div class="teacher-tutoring__session-actions">
            <UiButton v-if="store.teacherSelectedSession.status === 'pending'" color="primary" @click="openConfirmDialog">
              {{ t('tutoring.teacher.confirmSession') }}
            </UiButton>
            <UiButton v-if="store.teacherSelectedSession.status === 'confirmed'" color="primary" @click="markComplete">
              {{ t('tutoring.teacher.completeSession') }}
            </UiButton>
            <UiButton
              v-if="store.teacherSelectedSession.status === 'pending' || store.teacherSelectedSession.status === 'confirmed'"
              color="secondary"
              variant="outline"
              @click="openCancelDialog"
            >
              {{ t('tutoring.teacher.cancelSession') }}
            </UiButton>
            <UiButton color="secondary" variant="outline" @click="submitTeacherReview">
              {{ t('tutoring.teacher.leaveReview') }}
            </UiButton>
          </div>
          <UiSlider :model-value="teacherReview.rating" :min="1" :max="5" :step="1" color="secondary" :label="t('tutoring.teacher.reviewRating')" @update:model-value="onReviewRatingChange" />
          <UiTextarea v-model="teacherReview.comment" :label="t('tutoring.teacher.reviewComment')" :rows="3" />
        </div>
      </template>
      <template #footer>
        <UiButton variant="link" color="secondary" @click="sessionDialog = false">{{ t('common.close') }}</UiButton>
      </template>
    </UiDialog>

    <UiDialog v-model="paymentDialog" :title="paymentDialogTitle" width="520px">
      <template v-if="selectedPayment">
        <div class="teacher-tutoring__payment">
          <div class="teacher-tutoring__payment-row">
            <span class="teacher-tutoring__payment-label">{{ t('tutoring.teacher.paymentAmount') }}</span>
            <span>{{ formatPaymentAmount(selectedPayment) }}</span>
          </div>
          <div class="teacher-tutoring__payment-row">
            <span class="teacher-tutoring__payment-label">{{ t('tutoring.teacher.paymentStatus') }}</span>
            <UiTag :color="paymentStatusColor(selectedPayment.status)" size="sm">
              {{ t(`tutoring.paymentStatus.${selectedPayment.status}`) }}
            </UiTag>
          </div>
          <UiRadioGroup :model-value="paymentDecision.status" :options="decisionOptions" :label="t('tutoring.teacher.decisionLabel')" orientation="horizontal" @update:model-value="onPaymentStatusChange" />
          <UiSelect v-if="paymentDecision.status === 'approved'" :model-value="paymentDecision.provider" :label="t('tutoring.teacher.providerLabel')" @update:model-value="onPaymentProviderChange">
            <option v-for="option in providers" :key="option.value" :value="option.value">{{ option.label }}</option>
          </UiSelect>
          <UiInput
            v-if="paymentDecision.status === 'approved'"
            v-model="paymentDecision.joinUrl"
            :label="t('tutoring.teacher.joinUrlLabel')"
          />
          <UiTextarea v-model="paymentDecision.notes" :label="t('tutoring.teacher.decisionNotes')" :rows="3" />
        </div>
      </template>
      <template #footer>
        <div class="teacher-tutoring__dialog-actions">
          <UiButton variant="link" color="secondary" @click="paymentDialog = false">{{ t('common.cancel') }}</UiButton>
          <UiButton color="primary" :disabled="formSubmitting" @click="submitPaymentDecision">
            {{ t('tutoring.teacher.submitDecision') }}
          </UiButton>
        </div>
      </template>
    </UiDialog>

    <UiDialog v-model="confirmDialog" :title="t('tutoring.teacher.confirmDialogTitle')" width="420px">
      <form class="teacher-tutoring__form" @submit.prevent="confirmSelectedSession">
        <UiSelect v-model="confirmForm.provider" :label="t('tutoring.teacher.providerLabel')" required>
          <option v-for="option in providers" :key="option.value" :value="option.value">{{ option.label }}</option>
        </UiSelect>
        <UiInput v-model="confirmForm.joinUrl" type="url" :label="t('tutoring.teacher.joinUrlLabel')" required />
        <div class="teacher-tutoring__dialog-actions">
          <UiButton variant="link" color="secondary" @click="confirmDialog = false">{{ t('common.cancel') }}</UiButton>
          <UiButton button-type="submit" color="primary" :disabled="formSubmitting">
            {{ t('common.confirm') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model="cancelDialog" :title="t('tutoring.teacher.cancelDialogTitle')" width="420px">
      <form class="teacher-tutoring__form" @submit.prevent="cancelSelectedSession">
        <UiTextarea v-model="cancelForm.reason" :label="t('tutoring.teacher.cancelReason')" :rows="3" />
        <div class="teacher-tutoring__dialog-actions">
          <UiButton variant="link" color="secondary" @click="cancelDialog = false">{{ t('common.cancel') }}</UiButton>
          <UiButton button-type="submit" color="danger" :disabled="formSubmitting">
            {{ t('tutoring.teacher.cancelSession') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTutoringStore } from '@/stores/tutoring';
import { useToast } from '@/composables/useToast';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiSlider from '@/components/ui/UiSlider.vue';
import UiRadioGroup from '@/components/ui/UiRadioGroup.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiStatCard from '@/components/ui/UiStatCard.vue';
import UiDateTimePicker from '@/components/ui/UiDateTimePicker.vue';
import ThemePage from '@/layout/theme/ThemePage.vue';
import type { AvailabilitySlot, TutoringPayment, TutoringSession } from '@/services/tutoring';

const { t } = useI18n();
const store = useTutoringStore();
const toast = useToast();

const DEFAULT_TUTORING_CURRENCY = 'EGP';

const currencyOptions = computed(() => [
  { label: t('courses.currencyOptionEGP'), value: 'EGP' },
  { label: t('courses.currencyOptionAED'), value: 'AED' },
  { label: t('courses.currencyOptionSAR'), value: 'SAR' }
]);

const availabilityFilters = reactive({ from: '', to: '', size: 10, page: 0 });
const sessionFilters = reactive({ status: '', from: '', to: '', size: 10, page: 0 });
const availabilityView = ref<'agenda' | 'list'>('agenda');
const availabilityLoading = ref(false);
const sessionsLoading = ref(false);
const slotDialog = ref(false);
const sessionDialog = ref(false);
const paymentDialog = ref(false);
const confirmDialog = ref(false);
const cancelDialog = ref(false);
const formSubmitting = ref(false);
const editingSlot = ref<AvailabilitySlot | null>(null);
const selectedPayment = ref<TutoringPayment | null>(null);
const notes = ref('');
const teacherReview = reactive({ rating: 5, comment: '' });
const confirmForm = reactive({ provider: 'zoom', joinUrl: '' });
const cancelForm = reactive({ reason: '' });

const slotForm = reactive({
  startAt: '',
  endAt: '',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  hourlyRate: null as number | null,
  currency: DEFAULT_TUTORING_CURRENCY
});

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const parseDateTimeLocal = (value: string): DateTimeParts | null => {
  if (!value) {
    return null;
  }
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) {
    return null;
  }
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const [hourStr, minuteStr] = timePart.split(':');
  if (!yearStr || !monthStr || !dayStr || !hourStr || !minuteStr) {
    return null;
  }
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) {
    return null;
  }
  return { year, month, day, hour, minute };
};

const isValidTimeZone = (value: string) => {
  if (!value) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch (error) {
    return false;
  }
};

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const lookup = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {} as Record<string, string>);
  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second || '0')
  );
  return (asUtc - date.getTime()) / 60000;
};

const toIsoInTimeZone = (value: string, timeZone: string) => {
  const parts = parseDateTimeLocal(value);
  if (!parts) {
    return null;
  }
  const baseUtc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
  const offset = getTimeZoneOffsetMinutes(baseUtc, timeZone);
  const zoned = new Date(baseUtc.getTime() - offset * 60000);
  return zoned.toISOString();
};

const toDateTimeLocalInput = (isoString: string, timeZone: string) => {
  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const lookup = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {} as Record<string, string>);
  return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}`;
};

const providers = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'meet', label: 'Google Meet' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'jitsi', label: 'Jitsi' },
  { value: 'custom', label: t('tutoring.teacher.providerCustom') },
  { value: 'webrtc', label: 'WebRTC' }
];

const decisionOptions = computed(() => [
  { value: 'approved', label: t('tutoring.teacher.decisionApprove') },
  { value: 'rejected', label: t('tutoring.teacher.decisionReject') }
]);

const availabilityHeaders = computed(() => [
  { title: t('tutoring.teacher.slotStart'), key: 'startAt' },
  { title: t('tutoring.teacher.hourlyRate'), key: 'hourlyRate' },
  { title: t('tutoring.teacher.bookedLabel'), key: 'booked' },
  { title: t('common.actions'), key: 'actions', sortable: false }
]);

const sessionHeaders = computed(() => [
  { title: t('tutoring.teacher.sessionStudent'), key: 'studentName' },
  { title: t('tutoring.teacher.slotHeader'), key: 'slot' },
  { title: t('tutoring.teacher.statusHeader'), key: 'status' },
  { title: t('tutoring.teacher.paymentColumn'), key: 'latestPayment' },
  { title: t('common.actions'), key: 'actions', sortable: false }
]);

const sessionDialogTitle = computed(() =>
  store.teacherSelectedSession
    ? t('tutoring.teacher.sessionDetailTitle', { id: store.teacherSelectedSession.id })
    : t('tutoring.teacher.sessionsTitle')
);

const paymentDialogTitle = computed(() =>
  selectedPayment.value
    ? t('tutoring.teacher.reviewPaymentDialogTitle', { id: selectedPayment.value.id })
    : t('tutoring.teacher.paymentsTitle')
);


const agendaGroups = computed(() => {
  const groups: { key: string; label: string; slots: AvailabilitySlot[] }[] = [];
  const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' });
  store.teacherAvailability.items.forEach((slot) => {
    const key = new Date(slot.startAt).toDateString();
    let group = groups.find((item) => item.key === key);
    if (!group) {
      group = { key, label: formatter.format(new Date(slot.startAt)), slots: [] };
      groups.push(group);
    }
    group.slots.push(slot);
  });
  return groups;
});

const statusColor = (status: string) => {
  if (status === 'confirmed') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'completed') return 'info';
  if (status === 'cancelled') return 'danger';
  return 'secondary';
};

const paymentStatusColor = (status: string) => {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'warning';
};

type SlotLike = AvailabilitySlot | TutoringSession | TutoringSession['slot'];

const resolveSlot = (value: SlotLike | null | undefined): AvailabilitySlot | TutoringSession['slot'] | null => {
  if (!value) {
    return null;
  }

  if ('slot' in value) {
    return value.slot ?? null;
  }

  return value;
};

const toNumericAmount = (value: number | string | null | undefined): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatCurrencyDisplay = (
  amount: number | string | null | undefined,
  currency?: string | null
) => {
  const numeric = toNumericAmount(amount);
  if (numeric === null) {
    return '—';
  }
  const resolvedCurrency = (currency ?? DEFAULT_TUTORING_CURRENCY).toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: resolvedCurrency
    }).format(numeric);
  } catch (error) {
    return `${resolvedCurrency} ${numeric.toFixed(2)}`;
  }
};

const hasSlotRate = (value: SlotLike | null | undefined) => {
  const slot = resolveSlot(value);
  return toNumericAmount(slot?.hourlyRate ?? null) !== null;
};

const teacherCurrencyCode = computed(() => {
  const availabilityCurrency = store.teacherAvailability.items.find((slot) => slot.currency)?.currency;
  if (availabilityCurrency) {
    return availabilityCurrency.toUpperCase();
  }
  const sessionCurrency = store.teacherSessions.items.find((session) => session.slot?.currency)?.slot.currency;
  if (sessionCurrency) {
    return sessionCurrency.toUpperCase();
  }
  const selectedSessionCurrency = store.teacherSelectedSession?.slot?.currency;
  if (selectedSessionCurrency) {
    return selectedSessionCurrency.toUpperCase();
  }
  const paymentCurrency = selectedPayment.value?.currency;
  if (paymentCurrency) {
    return paymentCurrency.toUpperCase();
  }
  return DEFAULT_TUTORING_CURRENCY;
});

const slotCurrencyDisplay = computed(() => {
  const selection = slotForm.currency?.trim();
  if (selection) {
    return selection.toUpperCase();
  }
  return teacherCurrencyCode.value || DEFAULT_TUTORING_CURRENCY;
});

const formatSlotRate = (value: SlotLike | null | undefined) => {
  const slot = resolveSlot(value);
  return formatCurrencyDisplay(slot?.hourlyRate ?? null, slot?.currency ?? null);
};

const formatPaymentAmount = (
  payment: TutoringPayment | null | undefined,
  slot?: SlotLike | null | undefined
) => {
  const resolvedSlot = resolveSlot(slot ?? null);
  const amount = payment?.amount ?? null;
  const currency = payment?.currency ?? resolvedSlot?.currency ?? null;
  return formatCurrencyDisplay(amount, currency);
};

const formatPaymentTimestamp = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const paymentMethodLabel = (method?: string | null) => {
  if (!method) {
    return t('tutoring.teacher.methodLabel');
  }
  const normalized = method.toLowerCase();
  const translationKey = `tutoring.paymentMethod.${normalized}`;
  const translated = t(translationKey);
  if (translated === translationKey) {
    return method.toUpperCase();
  }
  return translated;
};

const formatWithFormatter = (
  slot: AvailabilitySlot | TutoringSession['slot'] | null,
  options: Intl.DateTimeFormatOptions
) => {
  if (!slot?.startAt) {
    return '—';
  }

  const date = new Date(slot.startAt);
  if (!Number.isFinite(date.getTime())) {
    return '—';
  }

  try {
    return new Intl.DateTimeFormat(undefined, options).format(date);
  } catch (error) {
    const fallbackOptions = { ...options };
    delete fallbackOptions.timeZone;
    return new Intl.DateTimeFormat(undefined, fallbackOptions).format(date);
  }
};

const formatTeacherTime = (slot: SlotLike) => {
  const resolved = resolveSlot(slot);
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short'
  };

  if (resolved?.timeZone) {
    options.timeZone = resolved.timeZone;
  }

  return formatWithFormatter(resolved, options);
};

const formatLocalTime = (slot: SlotLike) =>
  formatWithFormatter(resolveSlot(slot), {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const toRelativeTime = (target: Date) => {
  const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
    { amount: 4.34524, unit: 'week' },
    { amount: 12, unit: 'month' },
    { amount: Number.POSITIVE_INFINITY, unit: 'year' }
  ];

  let duration = (target.getTime() - Date.now()) / 1000;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return relativeTimeFormatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return relativeTimeFormatter.format(Math.round(duration), 'year');
};

const upcomingSessions = computed(() => {
  return store.teacherSessions.items
    .filter((session) => {
      const slot = resolveSlot(session);
      if (!slot?.startAt) {
        return false;
      }
      if (session.status === 'cancelled' || session.status === 'completed') {
        return false;
      }
      const timestamp = new Date(slot.startAt).getTime();
      return Number.isFinite(timestamp) && timestamp >= Date.now();
    })
    .sort((a, b) => {
      const first = new Date(resolveSlot(a)?.startAt ?? 0).getTime();
      const second = new Date(resolveSlot(b)?.startAt ?? 0).getTime();
      return first - second;
    });
});

const upcomingSessionCount = computed(() => upcomingSessions.value.length);

const nextUpcomingSession = computed(() => upcomingSessions.value[0] ?? null);

const nextSessionLabel = computed(() => {
  if (!nextUpcomingSession.value) {
    return t('tutoring.teacher.overviewNoUpcoming');
  }
  return formatTeacherTime(nextUpcomingSession.value.slot);
});

const nextSessionDescription = computed(() => {
  const session = nextUpcomingSession.value;
  const slot = resolveSlot(session ?? null);
  if (!slot?.startAt) {
    return t('tutoring.teacher.overviewNoUpcomingDescription');
  }
  const date = new Date(slot.startAt);
  if (!Number.isFinite(date.getTime())) {
    return t('tutoring.teacher.overviewNoUpcomingDescription');
  }
  return t('tutoring.teacher.overviewStartsIn', { relative: toRelativeTime(date) });
});

const confirmedTodayCount = computed(() => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  const startTime = start.getTime();
  const endTime = end.getTime();

  return store.teacherSessions.items.filter((session) => {
    if (session.status !== 'confirmed') {
      return false;
    }
    const slot = resolveSlot(session);
    if (!slot?.startAt) {
      return false;
    }
    const timestamp = new Date(slot.startAt).getTime();
    return Number.isFinite(timestamp) && timestamp >= startTime && timestamp <= endTime;
  }).length;
});

const projectedRevenueValue = computed(() => {
  return upcomingSessions.value.reduce((total, session) => {
    const slot = resolveSlot(session);
    const rate = toNumericAmount(slot?.hourlyRate ?? null);
    if (rate === null) {
      return total;
    }
    const durationMinutes = slot?.durationMinutes ?? 60;
    const hours = Math.max(durationMinutes / 60, 0.5);
    return total + rate * hours;
  }, 0);
});

const projectedRevenueDisplay = computed(() =>
  formatCurrencyDisplay(projectedRevenueValue.value, teacherCurrencyCode.value)
);

const showToast = (message: string, tone: 'success' | 'error' | 'warning' = 'success') => {
  if (tone === 'error') {
    toast.error(message);
  } else if (tone === 'warning') {
    toast.warning(message);
  } else {
    toast.success(message);
  }
};

const pageSummary = (state: { page: number; size: number; total: number }) => {
  const start = state.page * state.size + 1;
  const end = Math.min((state.page + 1) * state.size, state.total);
  return t('tutoring.teacher.pageSummary', { start, end, total: state.total });
};

const applyAvailabilityFilters = async () => {
  availabilityLoading.value = true;
  try {
    await store.loadTeacherAvailability({
      from: availabilityFilters.from || undefined,
      to: availabilityFilters.to || undefined,
      size: availabilityFilters.size,
      page: availabilityFilters.page
    });
  } catch (error) {
    console.error(error);
    showToast(t('tutoring.teacher.availabilityLoadFailed'), 'error');
  } finally {
    availabilityLoading.value = false;
  }
};

const changeAvailabilityPage = (page: number) => {
  availabilityFilters.page = Math.max(page, 0);
  applyAvailabilityFilters();
};

const applySessionFilters = async () => {
  sessionsLoading.value = true;
  try {
    await store.loadTeacherSessions({
      status: sessionFilters.status ? (sessionFilters.status as any) : undefined,
      from: sessionFilters.from || undefined,
      to: sessionFilters.to || undefined,
      size: sessionFilters.size,
      page: sessionFilters.page
    });
  } catch (error) {
    console.error(error);
    showToast(t('tutoring.teacher.sessionsLoadFailed'), 'error');
  } finally {
    sessionsLoading.value = false;
  }
};

const changeSessionPage = (page: number) => {
  sessionFilters.page = Math.max(page, 0);
  applySessionFilters();
};

const resetSlotForm = () => {
  slotForm.startAt = '';
  slotForm.endAt = '';
  slotForm.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  slotForm.hourlyRate = null;
  slotForm.currency = teacherCurrencyCode.value || DEFAULT_TUTORING_CURRENCY;
};

const openSlotDialog = (slot?: AvailabilitySlot) => {
  editingSlot.value = slot ?? null;
  if (slot) {
    slotForm.timeZone = slot.timeZone;
    slotForm.startAt = toDateTimeLocalInput(slot.startAt, slot.timeZone);
    slotForm.endAt = toDateTimeLocalInput(slot.endAt, slot.timeZone);
    slotForm.hourlyRate = slot.hourlyRate ?? null;
    slotForm.currency = slot.currency ? slot.currency.toUpperCase() : teacherCurrencyCode.value || DEFAULT_TUTORING_CURRENCY;
  } else {
    resetSlotForm();
  }
  slotDialog.value = true;
};

const onHourlyRateChange = (value: string | number | null) => {
  const parsed = Number(value);
  slotForm.hourlyRate = Number.isNaN(parsed) ? null : Math.max(0, parsed);
};

const saveSlot = async () => {
  if (!slotForm.startAt || !slotForm.endAt) {
    showToast(t('tutoring.teacher.slotValidation'), 'warning');
    return;
  }
  const timeZone = slotForm.timeZone.trim();
  if (!isValidTimeZone(timeZone)) {
    showToast(t('tutoring.teacher.invalidTimeZone'), 'warning');
    return;
  }
  const startIso = toIsoInTimeZone(slotForm.startAt, timeZone);
  const endIso = toIsoInTimeZone(slotForm.endAt, timeZone);
  if (!startIso || !endIso) {
    showToast(t('tutoring.teacher.slotValidation'), 'warning');
    return;
  }
  if (new Date(endIso) <= new Date(startIso)) {
    showToast(t('tutoring.teacher.slotEndBeforeStart'), 'warning');
    return;
  }
  if (new Date(startIso) <= new Date()) {
    showToast(t('tutoring.teacher.slotStartInFuture'), 'warning');
    return;
  }
  const currency = (slotForm.currency || '').trim().toUpperCase();
  if (!currency) {
    showToast(t('tutoring.teacher.currencyRequired'), 'warning');
    return;
  }
  formSubmitting.value = true;
  try {
    const payload = {
      startAt: startIso,
      endAt: endIso,
      timeZone,
      hourlyRate: slotForm.hourlyRate ?? undefined,
      currency
    };
    if (editingSlot.value) {
      await store.editAvailability(editingSlot.value.id, payload);
      showToast(t('tutoring.teacher.slotUpdated'));
    } else {
      await store.addAvailability(payload);
      showToast(t('tutoring.teacher.slotCreated'));
    }
    slotDialog.value = false;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 409) {
      showToast(t('tutoring.teacher.slotConflict'), 'error');
    } else if (status === 422) {
      showToast(t('tutoring.teacher.slotOverlap'), 'error');
    } else if (status === 400) {
      showToast(t('tutoring.teacher.slotInvalidWindow'), 'error');
    } else {
      showToast(t('tutoring.teacher.slotSaveFailed'), 'error');
    }
  } finally {
    formSubmitting.value = false;
  }
};

const removeSlot = async (slotId: number) => {
  try {
    await store.removeAvailability(slotId);
    showToast(t('tutoring.teacher.slotRemoved'));
  } catch (error) {
    console.error(error);
    showToast(t('tutoring.teacher.slotRemoveFailed'), 'error');
  }
};

const openSession = async (sessionId: number) => {
  try {
    const session = await store.loadTeacherSession(sessionId);
    if (session) {
      notes.value = session.teacherNotes || '';
      teacherReview.rating = 5;
      teacherReview.comment = '';
      sessionDialog.value = true;
    }
  } catch (error) {
    console.error(error);
    showToast(t('tutoring.teacher.sessionLoadFailed'), 'error');
  }
};

const saveNotes = async () => {
  if (!store.teacherSelectedSession) return;
  try {
    await store.saveTeacherNotes(store.teacherSelectedSession.id, notes.value);
    showToast(t('tutoring.teacher.notesSaved'));
  } catch (error) {
    console.error(error);
    showToast(t('tutoring.teacher.notesFailed'), 'error');
  }
};

const markComplete = async () => {
  if (!store.teacherSelectedSession) return;
  formSubmitting.value = true;
  try {
    await store.markSessionComplete(store.teacherSelectedSession.id);
    showToast(t('tutoring.teacher.sessionCompleted'));
  } catch (error) {
    console.error(error);
    showToast(t('tutoring.teacher.sessionCompleteFailed'), 'error');
  } finally {
    formSubmitting.value = false;
  }
};

const openConfirmDialog = () => {
  confirmForm.provider = store.teacherSelectedSession?.provider || 'zoom';
  confirmForm.joinUrl = store.teacherSelectedSession?.joinUrl || '';
  confirmDialog.value = true;
};

const confirmSelectedSession = async () => {
  if (!store.teacherSelectedSession) return;
  formSubmitting.value = true;
  try {
    await store.confirmSession(store.teacherSelectedSession.id, {
      provider: confirmForm.provider as any,
      joinUrl: confirmForm.joinUrl
    });
    confirmDialog.value = false;
    showToast(t('tutoring.teacher.sessionConfirmed'));
  } catch (error) {
    console.error(error);
    showToast(t('tutoring.teacher.sessionConfirmFailed'), 'error');
  } finally {
    formSubmitting.value = false;
  }
};

const openCancelDialog = () => {
  cancelForm.reason = '';
  cancelDialog.value = true;
};

const cancelSelectedSession = async () => {
  if (!store.teacherSelectedSession) return;
  formSubmitting.value = true;
  try {
    await store.cancelSession(store.teacherSelectedSession.id, { reason: cancelForm.reason || undefined });
    cancelDialog.value = false;
    sessionDialog.value = false;
    showToast(t('tutoring.teacher.sessionCancelled'), 'warning');
  } catch (error) {
    console.error(error);
    showToast(t('tutoring.teacher.sessionCancelFailed'), 'error');
  } finally {
    formSubmitting.value = false;
  }
};

const onReviewRatingChange = (value: number) => {
  teacherReview.rating = value;
};

const submitTeacherReview = async () => {
  if (!store.teacherSelectedSession) return;
  try {
    await store.leaveTeacherReview(store.teacherSelectedSession.id, {
      rating: teacherReview.rating,
      comment: teacherReview.comment || undefined
    });
    showToast(t('tutoring.teacher.reviewSubmitted'));
  } catch (error: any) {
    console.error(error);
    const status = error?.response?.status as number | undefined;
    if (status === 403) {
      showToast(t('tutoring.teacher.reviewForbidden'), 'error');
      return;
    }
    showToast(t('tutoring.teacher.reviewFailed'), 'error');
  }
};

const openPaymentDecision = (payment: TutoringPayment) => {
  selectedPayment.value = payment;
  paymentDecision.status = payment.status === 'pending' ? 'approved' : payment.status;
  paymentDecision.provider = payment.provider || 'zoom';
  paymentDecision.joinUrl = payment.joinUrl || '';
  paymentDecision.notes = '';
  paymentDialog.value = true;
};

const paymentDecision = reactive({
  status: 'approved' as ManualPaymentStatus,
  provider: 'zoom',
  joinUrl: '',
  notes: ''
});

type ManualPaymentStatus = 'approved' | 'rejected';

const onPaymentStatusChange = (value: string | number | boolean) => {
  paymentDecision.status = String(value) as ManualPaymentStatus;
};

const onPaymentProviderChange = (value: string | number | boolean) => {
  paymentDecision.provider = String(value);
};

const submitPaymentDecision = async () => {
  if (!selectedPayment.value) return;
  formSubmitting.value = true;
  try {
    await store.decidePayment(selectedPayment.value.id, {
      status: paymentDecision.status,
      provider: paymentDecision.status === 'approved' ? (paymentDecision.provider as any) : undefined,
      joinUrl: paymentDecision.status === 'approved' ? paymentDecision.joinUrl || undefined : undefined,
      notes: paymentDecision.notes || undefined
    });
    paymentDialog.value = false;
    showToast(t('tutoring.teacher.paymentDecided'));
  } catch (error) {
    console.error(error);
    showToast(t('tutoring.teacher.paymentDecisionFailed'), 'error');
  } finally {
    formSubmitting.value = false;
  }
};

const refreshAll = async () => {
  await Promise.all([applyAvailabilityFilters(), applySessionFilters(), store.loadTeacherPayments()]);
};

onMounted(async () => {
  availabilityLoading.value = true;
  sessionsLoading.value = true;
  try {
    await Promise.all([
      store.loadTeacherAvailability({ size: availabilityFilters.size, page: availabilityFilters.page }),
      store.loadTeacherSessions({ size: sessionFilters.size, page: sessionFilters.page }),
      store.loadTeacherPayments()
    ]);
  } catch (error) {
    console.error(error);
    showToast(t('tutoring.teacher.initialLoadFailed'), 'error');
  } finally {
    availabilityLoading.value = false;
    sessionsLoading.value = false;
  }
});
</script>

<style scoped>
.teacher-tutoring {
  display: grid;
  gap: var(--sakai-space-6);
  grid-template-columns: 1fr;
}

.teacher-tutoring__summary {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-tutoring__summary-grid {
  display: grid;
  gap: var(--sakai-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.teacher-tutoring__summary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
  justify-content: flex-start;
}

.teacher-tutoring__summary-actions :deep(.ui-button) {
  min-width: 160px;
}

.teacher-tutoring__column {
  display: grid;
  gap: var(--sakai-space-5);
}

.teacher-tutoring__filters {
  display: grid;
  gap: var(--sakai-space-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-bottom: var(--sakai-space-4);
  align-items: end;
}

.teacher-tutoring__filters-actions {
  display: flex;
  justify-content: flex-end;
}

.teacher-tutoring__filters-actions :deep(.ui-button) {
  padding-block: 0.45rem;
  padding-inline: 1rem;
  font-size: 0.9rem;
}

.teacher-tutoring__table {
  display: block;
  width: 100%;
  overflow-x: auto;
}

.teacher-tutoring__table :deep(table) {
  min-width: calc(var(--sakai-space-12) * 11);
}

.teacher-tutoring__table :deep(table tbody tr td:last-child) {
  width: 1%;
  white-space: nowrap;
}

.teacher-tutoring__list {
  display: none;
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-4);
}

.teacher-tutoring__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.teacher-tutoring__list--availability .teacher-tutoring__list-item {
  border-color: color-mix(in srgb, var(--sakai-primary) 25%, var(--sakai-border-color) 60%);
}

.teacher-tutoring__list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
}

.teacher-tutoring__list-times,
.teacher-tutoring__list-titles {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.teacher-tutoring__list-times strong,
.teacher-tutoring__list-titles strong {
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-tutoring__list-times span,
.teacher-tutoring__list-titles span {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.teacher-tutoring__list-grid {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-tutoring__list-grid div {
  display: grid;
  gap: var(--sakai-space-1);
}

.teacher-tutoring__list-grid dt {
  font-size: 0.78rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color-tertiary);
}

.teacher-tutoring__list-grid dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-tutoring__list-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

.teacher-tutoring__row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

.teacher-tutoring__slot-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.teacher-tutoring__agenda {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-tutoring__agenda-day {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-tutoring__agenda-slots {
  display: grid;
  gap: var(--sakai-space-3);
}

.teacher-tutoring__agenda-slot {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface-card);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--sakai-shadow-color) 6%, transparent);
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.teacher-tutoring__agenda-slot:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 36px color-mix(in srgb, var(--sakai-shadow-color) 14%, transparent);
}

.teacher-tutoring__agenda-slot--available {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--sakai-success) 20%, transparent) 0%,
    var(--sakai-surface-card) 55%
  );
  border-color: color-mix(in srgb, var(--sakai-success) 35%, transparent);
}

.teacher-tutoring__agenda-slot--booked {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--sakai-warning) 24%, transparent) 0%,
    var(--sakai-surface-card) 60%
  );
  border-color: color-mix(in srgb, var(--sakai-warning) 40%, transparent);
}

.teacher-tutoring__agenda-slot-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.teacher-tutoring__agenda-slot-time {
  display: flex;
  align-items: flex-start;
  gap: var(--sakai-space-2);
}

.teacher-tutoring__agenda-slot-time > div {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.teacher-tutoring__agenda-slot-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
  font-size: 0.9rem;
  color: var(--sakai-text-color-secondary);
}

.teacher-tutoring__agenda-slot-meta span {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-tutoring__agenda-slot-meta :deep(.ui-icon) {
  color: var(--sakai-text-color-tertiary);
}

.teacher-tutoring__agenda-actions {
  display: flex;
  gap: var(--sakai-space-2);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.teacher-tutoring__agenda-actions :deep(.ui-button) {
  font-weight: var(--sakai-font-weight-medium);
}

.teacher-tutoring__form {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-tutoring__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}

.teacher-tutoring__session {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-tutoring__session-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sakai-space-4);
}

.teacher-tutoring__session-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.teacher-tutoring__session-student {
  font-size: 1.05rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-tutoring__session-email {
  color: var(--sakai-text-color-tertiary);
}

.teacher-tutoring__session-row {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.teacher-tutoring__session-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
}

.teacher-tutoring__payments {
  display: grid;
  gap: var(--sakai-space-3);
  padding: 0;
  margin: 0;
  list-style: none;
}

.teacher-tutoring__payment-item {
  list-style: none;
}

.teacher-tutoring__payment-card {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-surface-card) 98%, transparent);
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 18%, var(--sakai-border-color) 65%);
  box-shadow: 0 16px 32px color-mix(in srgb, var(--sakai-primary) 12%, rgba(0, 0, 0, 0.16));
}

.teacher-tutoring__payment-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.teacher-tutoring__payment-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: var(--sakai-border-radius-lg);
  background: color-mix(in srgb, var(--sakai-primary) 16%, transparent);
  color: var(--sakai-primary);
}

.teacher-tutoring__payment-info {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
  flex: 1 1 auto;
}

.teacher-tutoring__payment-info span {
  font-weight: var(--sakai-font-weight-semibold);
}

.teacher-tutoring__payment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.teacher-tutoring__payment-meta span {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
}

.teacher-tutoring__payment-actions {
  display: flex;
  justify-content: flex-end;
}

.teacher-tutoring__payment {
  display: grid;
  gap: var(--sakai-space-4);
}

.teacher-tutoring__payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.teacher-tutoring__payment-label {
  color: var(--sakai-text-color-tertiary);
}

.teacher-tutoring__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--sakai-space-3);
}

@media (max-width: 720px) {
  .teacher-tutoring__summary-actions {
    width: 100%;
    justify-content: stretch;
  }

  .teacher-tutoring__summary-actions :deep(.ui-button) {
    flex: 1 1 auto;
  }

  .teacher-tutoring__filters {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .teacher-tutoring__filters-actions {
    justify-content: stretch;
  }

  .teacher-tutoring__filters-actions :deep(.ui-button) {
    width: 100%;
  }

  .teacher-tutoring__table {
    display: none;
  }

  .teacher-tutoring__list {
    display: grid;
  }

  .teacher-tutoring__session-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .teacher-tutoring__session-actions {
    width: 100%;
  }

  .teacher-tutoring__session-actions :deep(.ui-button) {
    flex: 1 1 auto;
  }

  .teacher-tutoring__payment-card {
    box-shadow: 0 12px 22px color-mix(in srgb, var(--sakai-primary) 12%, rgba(0, 0, 0, 0.18));
  }

  .teacher-tutoring__pagination {
    flex-direction: column;
    align-items: stretch;
    gap: var(--sakai-space-2);
  }
}

@media (min-width: 960px) {
  .teacher-tutoring {
    grid-template-columns: 2fr 1fr;
  }

  .teacher-tutoring__column--side {
    align-self: flex-start;
  }
}

@media (max-width: 640px) {
  .teacher-tutoring__summary-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .teacher-tutoring__filters {
    grid-template-columns: 1fr;
  }

  .teacher-tutoring__dialog-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>
