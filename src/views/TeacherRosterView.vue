<template>
  <ThemePage :title="t('roster.title')" :subtitle="t('roster.subtitle')">
    <template #actions>
      <UiButton
        v-if="activeTab === 'groups' && isRosterFeatureEnabled"
        color="primary"
        prepend-icon="PlusOutlined"
        @click="openCreateGroup()"
      >
        {{ t('roster.createGroup') }}
      </UiButton>
    </template>

    <UiAlert v-if="!isRosterFeatureEnabled" color="warning" variant="soft" class="teacher-roster__alert mt-4">
      {{ t('roster.disabledMessage') }}
    </UiAlert>

    <div v-else class="teacher-roster flex flex-col gap-6">
      <UiTabs v-model="activeTab" :tabs="tabItems" variant="underline" />

      <UiAlert
        v-if="quotaWarning"
        color="warning"
        variant="soft"
        class="teacher-roster__alert mt-4"
      >
        <p>{{ quotaWarningMessage }}</p>
        <p>{{ quotaWarningSuggestion }}</p>
      </UiAlert>

      <section v-if="activeTab === 'students'" class="teacher-roster__section flex flex-col gap-4">
        <UiCard class="teacher-roster__card flex flex-col gap-4" :title="t('roster.studentsTitle')" :subtitle="t('roster.studentsSubtitle')">
          <div class="teacher-roster__filters grid gap-4 items-end [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            <UiInput
              v-model="studentSearch"
              :label="t('roster.searchLabel')"
              :placeholder="t('roster.searchPlaceholder')"
              start-icon="SearchOutlined"
              @keyup.enter="applyStudentFilters"
            />
            <UiSelect
              :model-value="studentStatus"
              :label="t('roster.statusFilter')"
              clearable
              @update:model-value="onStatusChange"
            >
              <option value="">{{ t('roster.allStatuses') }}</option>
              <option v-for="option in studentStatusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </UiSelect>
            <UiButton variant="link" color="secondary" @click="resetStudentFilters">
              {{ t('roster.resetFilters') }}
        </UiButton>
      </div>

      <div v-if="showBulkStudentsBar" class="teacher-roster__bulk-bar">
        <div class="teacher-roster__bulk-info flex flex-col gap-1">
          <strong>{{ t('bulk.studentsSelected', { count: selectedStudentCount }) }}</strong>
          <span>{{ t('bulk.studentsHint') }}</span>
        </div>
        <div class="teacher-roster__bulk-actions flex flex-wrap gap-2">
          <UiButton
            size="sm"
            variant="outline"
            :disabled="bulkContextLoading"
            @click="openBulkEnrollFromSelection"
          >
            {{ t('bulk.actionEnroll') }}
          </UiButton>
          <UiButton
            size="sm"
            variant="outline"
            :disabled="bulkContextLoading"
            @click="openBulkLiveFromSelection"
          >
            {{ t('bulk.actionRegisterLive') }}
          </UiButton>
          <UiButton
            size="sm"
            color="primary"
            :disabled="bulkContextLoading"
            @click="openBulkTutoringFromSelection"
          >
            {{ t('bulk.actionAssignTutoring') }}
          </UiButton>
        </div>
      </div>

      <UiTable
        :headers="studentHeaders"
        :items="store.students"
        :loading="store.studentsLoading"
        class="teacher-roster__table teacher-roster__table--students w-full"
            item-value="studentId"
            show-select
            v-model:selected="selectedStudents"
            density="comfortable"
            :empty-text="t('roster.studentsEmpty')"
          >
            <template #item.name="{ item }">
              <div class="teacher-roster__student-name flex flex-col">
                <span>{{ item.name }}</span>
                <span class="teacher-roster__student-email text-[0.85rem] text-content-secondary">{{ item.email }}</span>
              </div>
            </template>
            <template #item.status="{ item }">
              <UiBadge :color="statusColor(item.status)">
                {{ statusLabel(item.status) }}
              </UiBadge>
            </template>
            <template #item.device="{ item }">
              <UiBadge :color="deviceStatusColor(item)">
                {{ deviceStatusLabel(item) }}
              </UiBadge>
            </template>
            <template #item.joinedAt="{ item }">
              {{ formatDateTime(item.joinedAt) }}
            </template>
            <template #item.actions="{ item }">
              <div class="teacher-roster__device-actions inline-flex flex-wrap gap-2 justify-end">
                <UiButton
                  size="xs"
                  variant="link"
                  color="danger"
                  :disabled="item.deviceDisabled"
                  @click="disableStudentDevice(item)"
                >
                  {{ t('roster.device.disable') }}
                </UiButton>
                <UiButton
                  size="xs"
                  variant="link"
                  color="success"
                  :disabled="!item.deviceDisabled"
                  @click="enableStudentDevice(item)"
                >
                  {{ t('roster.device.enable') }}
                </UiButton>
                <UiButton
                  size="xs"
                  variant="link"
                  :disabled="!item.deviceRegistered"
                  @click="resetStudentDevice(item)"
                >
                  {{ t('roster.device.reset') }}
                </UiButton>
              </div>
            </template>
          </UiTable>

          <div class="teacher-roster__list teacher-roster__list--students" role="list">
            <article
              v-for="item in store.students"
              :key="item.studentId"
              class="teacher-roster__list-item"
              role="listitem"
            >
              <header class="teacher-roster__list-header flex flex-wrap items-center justify-between gap-2">
                <div class="teacher-roster__student-name flex flex-col">
                  <span>{{ item.name }}</span>
                  <span class="teacher-roster__student-email text-[0.85rem] text-content-secondary">{{ item.email }}</span>
                </div>
                <UiBadge :color="statusColor(item.status)">
                  {{ statusLabel(item.status) }}
                </UiBadge>
              </header>
              <div class="teacher-roster__list-field grid gap-2">
                <label>{{ t('roster.device.column') }}</label>
                <UiBadge :color="deviceStatusColor(item)">
                  {{ deviceStatusLabel(item) }}
                </UiBadge>
              </div>
              <div class="teacher-roster__list-field grid gap-2">
                <label>{{ t('roster.joinedColumn') }}</label>
                <span>{{ formatDateTime(item.joinedAt) }}</span>
              </div>
              <div class="teacher-roster__list-actions flex flex-wrap gap-2">
                <UiButton
                  size="sm"
                  variant="link"
                  color="danger"
                  :disabled="item.deviceDisabled"
                  @click="disableStudentDevice(item)"
                >
                  {{ t('roster.device.disable') }}
                </UiButton>
                <UiButton
                  size="sm"
                  variant="link"
                  color="success"
                  :disabled="!item.deviceDisabled"
                  @click="enableStudentDevice(item)"
                >
                  {{ t('roster.device.enable') }}
                </UiButton>
                <UiButton
                  size="sm"
                  variant="link"
                  :disabled="!item.deviceRegistered"
                  @click="resetStudentDevice(item)"
                >
                  {{ t('roster.device.reset') }}
                </UiButton>
              </div>
            </article>
          </div>

          <div class="teacher-roster__footer flex justify-between items-center text-[0.9rem] text-content-tertiary">
            <span>
              {{ t('roster.studentsSummary', {
                from: firstStudentIndex,
                to: lastStudentIndex,
                total: store.studentsTotal
              }) }}
            </span>
            <div class="teacher-roster__pager inline-flex gap-2">
              <UiButton
                variant="link"
                size="sm"
                :disabled="store.studentsPage === 0 || store.studentsLoading"
                @click="changeStudentPage(store.studentsPage - 1)"
              >
                {{ t('roster.prev') }}
              </UiButton>
              <UiButton
                variant="link"
                size="sm"
                :disabled="isLastStudentPage || store.studentsLoading"
                @click="changeStudentPage(store.studentsPage + 1)"
              >
                {{ t('roster.next') }}
              </UiButton>
            </div>
          </div>

          <div class="teacher-roster__selection text-[0.85rem] text-content-secondary" v-if="selectedStudents.length">
            {{ t('roster.selectedCount', { count: selectedStudents.length }) }}
          </div>
        </UiCard>
      </section>

      <section v-else class="teacher-roster__section flex flex-col gap-4">
        <UiCard class="teacher-roster__card flex flex-col gap-4" :title="t('roster.groupsTitle')" :subtitle="t('roster.groupsSubtitle')">
          <div class="teacher-roster__filters grid gap-4 items-end [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            <UiInput
              v-model="groupQuery"
              :label="t('roster.searchGroups')"
              :placeholder="t('roster.groupPlaceholder')"
              start-icon="SearchOutlined"
              @keyup.enter="applyGroupFilters"
            />
            <UiButton variant="link" color="secondary" @click="resetGroupFilters">
              {{ t('roster.resetFilters') }}
            </UiButton>
          </div>

          <UiTable
            :headers="groupHeaders"
            :items="store.groups"
            :loading="store.groupsLoading"
            class="teacher-roster__table teacher-roster__table--groups w-full"
            density="comfortable"
            :empty-text="t('roster.groupsEmpty')"
          >
            <template #item.name="{ item }">
              <div class="teacher-roster__group-name flex flex-col gap-[0.25rem]">
                <span class="teacher-roster__group-title font-semibold">{{ item.name }}</span>
                <span v-if="item.description" class="teacher-roster__group-description text-[0.85rem] text-content-tertiary">{{ item.description }}</span>
              </div>
            </template>
            <template #item.members="{ item }">
              <span>
                {{ item.membersCount }}
                <span v-if="item.capacity">/ {{ item.capacity }}</span>
              </span>
            </template>
            <template #item.createdAt="{ item }">
              {{ formatDateTime(item.createdAt) }}
            </template>
            <template #item.actions="{ item }">
              <div class="teacher-roster__group-actions inline-flex gap-2">
            <UiButton variant="link" size="sm" @click="openMembers(item)">
              {{ t('roster.viewMembers') }}
            </UiButton>
            <UiButton variant="link" size="sm" color="secondary" @click="openEditGroup(item)">
              {{ t('roster.editGroup') }}
            </UiButton>
            <template v-if="bulkFeatureEnabled">
              <UiButton variant="link" size="sm" color="primary" @click="openBulkEnrollForGroup(item)">
                {{ t('bulk.actionEnrollShort') }}
              </UiButton>
              <UiButton variant="link" size="sm" color="primary" @click="openBulkLiveForGroup(item)">
                {{ t('bulk.actionRegisterLiveShort') }}
              </UiButton>
              <UiButton variant="link" size="sm" color="primary" @click="openBulkTutoringForGroup(item)">
                {{ t('bulk.actionTutoringShort') }}
              </UiButton>
            </template>
            <UiButton variant="link" size="sm" color="danger" @click="confirmDeleteGroup(item)">
              {{ t('roster.deleteGroup') }}
            </UiButton>
          </div>
        </template>
          </UiTable>

          <div class="teacher-roster__footer flex justify-between items-center text-[0.9rem] text-content-tertiary">
            <span>
              {{ t('roster.groupsSummary', {
                from: firstGroupIndex,
                to: lastGroupIndex,
                total: store.groupsTotal
              }) }}
            </span>
            <div class="teacher-roster__pager inline-flex gap-2">
              <UiButton
                variant="link"
                size="sm"
                :disabled="store.groupsPage === 0 || store.groupsLoading"
                @click="changeGroupPage(store.groupsPage - 1)"
              >
                {{ t('roster.prev') }}
              </UiButton>
              <UiButton
                variant="link"
                size="sm"
                :disabled="isLastGroupPage || store.groupsLoading"
                @click="changeGroupPage(store.groupsPage + 1)"
              >
                {{ t('roster.next') }}
              </UiButton>
            </div>
          </div>
        </UiCard>
      </section>
    </div>

    <UiDialog v-model="showGroupForm" :title="groupFormTitle" width="520px">
      <form class="teacher-roster__dialog-form flex flex-col gap-4" @submit.prevent="submitGroupForm">
        <UiInput v-model="groupForm.name" :label="t('roster.groupName')" required maxlength="120" />
        <UiTextarea v-model="groupForm.description" :label="t('roster.groupDescription')" :rows="3" maxlength="2000" />
        <UiInput
          v-model.number="groupForm.capacity"
          :label="t('roster.groupCapacity')"
          type="number"
          min="1"
          :hint="t('roster.capacityHint')"
        />
        <div class="teacher-roster__dialog-actions flex justify-end gap-2">
          <UiButton variant="link" color="secondary" @click.prevent="closeGroupForm">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton button-type="submit" color="primary" :loading="groupSaving">
            {{ editingGroup ? t('common.save') : t('common.create') }}
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog
      v-model="showMembers"
      :title="store.activeGroup ? store.activeGroup.name : ''"
      width="720px"
    >
      <template v-if="store.activeGroup">
        <div class="teacher-roster__members-toolbar flex flex-col gap-4 mb-4">
          <div class="teacher-roster__members-meta flex gap-2 items-center">
            <UiBadge color="primary">
              {{ t('roster.membersCount', { count: store.activeGroup.membersCount }) }}
            </UiBadge>
            <span v-if="store.activeGroup.capacity" class="teacher-roster__capacity-pill">
              {{ t('roster.capacityBadge', { capacity: store.activeGroup.capacity }) }}
            </span>
          </div>
          <div class="teacher-roster__members-actions flex flex-wrap gap-2">
            <UiInput
              v-model="memberQuery"
              :placeholder="t('roster.searchMembersPlaceholder')"
              start-icon="SearchOutlined"
              @keyup.enter="applyMemberSearch"
            />
            <UiButton color="primary" prepend-icon="UserAddOutlined" @click="openAddMembers">
              {{ t('roster.addStudentsButton') }}
            </UiButton>
          </div>
        </div>

        <UiTable
          :headers="memberHeaders"
          :items="store.members"
          :loading="store.membersLoading"
          density="comfortable"
          class="teacher-roster__table w-full"
          :empty-text="t('roster.membersEmpty')"
        >
          <template #item.joinedAt="{ item }">
            {{ formatDateTime(item.joinedAt) }}
          </template>
          <template #item.actions="{ item }">
            <UiButton variant="link" size="sm" color="danger" @click="removeMember(item)">
              {{ t('roster.removeMember') }}
            </UiButton>
          </template>
        </UiTable>

        <div class="teacher-roster__footer flex justify-between items-center text-[0.9rem] text-content-tertiary">
          <span>
            {{ t('roster.membersSummary', {
              from: firstMemberIndex,
              to: lastMemberIndex,
              total: store.membersTotal
            }) }}
          </span>
          <div class="teacher-roster__pager inline-flex gap-2">
            <UiButton
              variant="link"
              size="sm"
              :disabled="store.membersPage === 0 || store.membersLoading"
              @click="changeMemberPage(store.membersPage - 1)"
            >
              {{ t('roster.prev') }}
            </UiButton>
            <UiButton
              variant="link"
              size="sm"
              :disabled="isLastMemberPage || store.membersLoading"
              @click="changeMemberPage(store.membersPage + 1)"
            >
              {{ t('roster.next') }}
            </UiButton>
          </div>
        </div>
      </template>
    </UiDialog>

    <UiDialog v-model="showAddMembers" :title="t('roster.addStudentsTitle')" width="520px">
      <div class="teacher-roster__dialog-form flex flex-col gap-4">
        <UiSelect
          v-model="membersSelection"
          multiple
          :label="t('roster.addStudentsSelect')"
          :hint="t('roster.addStudentsHint')"
        >
          <option
            v-for="student in availableStudents"
            :key="student.studentId"
            :value="student.studentId"
          >
            {{ student.name }} — {{ student.email }}
          </option>
        </UiSelect>
        <div class="teacher-roster__dialog-actions flex justify-end gap-2">
          <UiButton variant="link" color="secondary" @click="closeAddMembers">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton
            color="primary"
            :disabled="!membersSelection.length"
            :loading="addMembersLoading"
            @click="submitAddMembers"
          >
            {{ t('roster.confirmAddStudents') }}
          </UiButton>
        </div>
      </div>
    </UiDialog>

    <UiDialog v-model="bulkEnrollState.open" :title="t('bulk.enrollTitle')" width="640px" @hide="closeBulkEnroll">
      <div class="teacher-roster__bulk-dialog flex flex-col gap-4">
        <p v-if="contextSummary" class="teacher-roster__bulk-context m-0 text-content-secondary">{{ contextSummary }}</p>

        <template v-if="bulkEnrollState.result">
          <div class="teacher-roster__bulk-summary-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
            <div>
              <span>{{ t('bulk.summary.total') }}</span>
              <strong>{{ bulkEnrollState.result.summary.total }}</strong>
            </div>
            <div>
              <span>{{ t('bulk.summary.success') }}</span>
              <strong>{{ bulkEnrollState.result.summary.success }}</strong>
            </div>
            <div>
              <span>{{ t('bulk.summary.skipped') }}</span>
              <strong>{{ bulkEnrollState.result.summary.skipped }}</strong>
            </div>
            <div>
              <span>{{ t('bulk.summary.failed') }}</span>
              <strong>{{ bulkEnrollState.result.summary.failed }}</strong>
            </div>
          </div>

          <table class="teacher-roster__bulk-table w-full border-collapse">
            <thead>
              <tr>
                <th>{{ t('bulk.result.student') }}</th>
                <th>{{ t('bulk.result.status') }}</th>
                <th>{{ t('bulk.result.reason') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in bulkEnrollState.result.items" :key="`enroll-${item.studentId}`">
                <td>{{ studentDisplayName(item.studentId) }}</td>
                <td>
                  <UiBadge :color="bulkStatusColor(item.status)">
                    {{ t(`bulk.status.${item.status}`) }}
                  </UiBadge>
                </td>
                <td>{{ formatReason(item.reason) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="teacher-roster__dialog-actions flex justify-end gap-2">
            <UiButton variant="link" color="secondary" @click="closeBulkEnroll">
              {{ t('common.close') }}
            </UiButton>
            <UiButton
              variant="outline"
              color="primary"
              @click="exportBulkResultCsv(bulkEnrollState.result, 'bulk-enroll.csv')"
            >
              {{ t('bulk.exportCsv') }}
            </UiButton>
          </div>
        </template>

        <template v-else>
          <form class="teacher-roster__bulk-form" @submit.prevent="submitBulkEnroll">
            <UiSelect
              v-model="bulkEnrollState.courseId"
              :label="t('bulk.selectCourse')"
              required
            >
              <option v-for="course in coursesStore.list" :key="course.id" :value="course.id">
                {{ course.title }}
              </option>
            </UiSelect>
            <div class="teacher-roster__dialog-actions flex justify-end gap-2">
              <UiButton variant="link" color="secondary" @click.prevent="closeBulkEnroll">
                {{ t('common.cancel') }}
              </UiButton>
              <UiButton button-type="submit" color="primary" :loading="bulkEnrollState.loading">
                {{ t('bulk.submit') }}
              </UiButton>
            </div>
          </form>
        </template>
      </div>
    </UiDialog>

    <UiDialog v-model="bulkLiveState.open" :title="t('bulk.liveTitle')" width="640px" @hide="closeBulkLive">
      <div class="teacher-roster__bulk-dialog flex flex-col gap-4">
        <p v-if="contextSummary" class="teacher-roster__bulk-context m-0 text-content-secondary">{{ contextSummary }}</p>

        <template v-if="bulkLiveState.result">
          <div class="teacher-roster__bulk-summary-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
            <div>
              <span>{{ t('bulk.summary.total') }}</span>
              <strong>{{ bulkLiveState.result.summary.total }}</strong>
            </div>
            <div>
              <span>{{ t('bulk.summary.success') }}</span>
              <strong>{{ bulkLiveState.result.summary.success }}</strong>
            </div>
            <div>
              <span>{{ t('bulk.summary.skipped') }}</span>
              <strong>{{ bulkLiveState.result.summary.skipped }}</strong>
            </div>
            <div>
              <span>{{ t('bulk.summary.failed') }}</span>
              <strong>{{ bulkLiveState.result.summary.failed }}</strong>
            </div>
          </div>

          <table class="teacher-roster__bulk-table w-full border-collapse">
            <thead>
              <tr>
                <th>{{ t('bulk.result.student') }}</th>
                <th>{{ t('bulk.result.status') }}</th>
                <th>{{ t('bulk.result.reason') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in bulkLiveState.result.items" :key="`live-${item.studentId}`">
                <td>{{ studentDisplayName(item.studentId) }}</td>
                <td>
                  <UiBadge :color="bulkStatusColor(item.status)">
                    {{ t(`bulk.status.${item.status}`) }}
                  </UiBadge>
                </td>
                <td>{{ formatReason(item.reason) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="teacher-roster__dialog-actions flex justify-end gap-2">
            <UiButton variant="link" color="secondary" @click="closeBulkLive">
              {{ t('common.close') }}
            </UiButton>
            <UiButton
              variant="outline"
              color="primary"
              @click="exportBulkResultCsv(bulkLiveState.result, 'bulk-live.csv')"
            >
              {{ t('bulk.exportCsv') }}
            </UiButton>
          </div>
        </template>

        <template v-else>
          <form class="teacher-roster__bulk-form" @submit.prevent="submitBulkLive">
            <UiSelect
              v-model="bulkLiveState.sessionId"
              :label="t('bulk.selectSession')"
              required
            >
              <option v-for="session in bulkLiveState.sessions" :key="session.id" :value="session.id">
                {{ session.title }} — {{ formatDateTime(session.scheduledAt) }}
              </option>
            </UiSelect>
            <div class="teacher-roster__dialog-actions flex justify-end gap-2">
              <UiButton variant="link" color="secondary" @click.prevent="closeBulkLive">
                {{ t('common.cancel') }}
              </UiButton>
              <UiButton button-type="submit" color="primary" :loading="bulkLiveState.loading">
                {{ t('bulk.submit') }}
              </UiButton>
            </div>
          </form>
        </template>
      </div>
    </UiDialog>

    <UiDialog v-model="bulkTutoringState.open" :title="t('bulk.tutoringTitle')" width="720px" @hide="closeBulkTutoring">
      <div class="teacher-roster__bulk-dialog flex flex-col gap-4">
        <p v-if="contextSummary" class="teacher-roster__bulk-context m-0 text-content-secondary">{{ contextSummary }}</p>
        <UiAlert color="info" variant="soft">{{ t('bulk.tutoringConstraint') }}</UiAlert>

        <template v-if="bulkTutoringState.result">
          <div class="teacher-roster__bulk-summary-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
            <div>
              <span>{{ t('bulk.summary.total') }}</span>
              <strong>{{ bulkTutoringState.result.summary.total }}</strong>
            </div>
            <div>
              <span>{{ t('bulk.summary.success') }}</span>
              <strong>{{ bulkTutoringState.result.summary.success }}</strong>
            </div>
            <div>
              <span>{{ t('bulk.summary.skipped') }}</span>
              <strong>{{ bulkTutoringState.result.summary.skipped }}</strong>
            </div>
            <div>
              <span>{{ t('bulk.summary.failed') }}</span>
              <strong>{{ bulkTutoringState.result.summary.failed }}</strong>
            </div>
          </div>

          <table class="teacher-roster__bulk-table w-full border-collapse">
            <thead>
              <tr>
                <th>{{ t('bulk.result.student') }}</th>
                <th>{{ t('bulk.result.status') }}</th>
                <th>{{ t('bulk.result.reason') }}</th>
                <th>{{ t('bulk.result.sessionId') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in bulkTutoringState.result.items" :key="`tutor-${item.studentId}`">
                <td>{{ studentDisplayName(item.studentId) }}</td>
                <td>
                  <UiBadge :color="bulkStatusColor(item.status)">
                    {{ t(`bulk.status.${item.status}`) }}
                  </UiBadge>
                </td>
                <td>{{ formatReason(item.reason) }}</td>
                <td>{{ item.extra?.sessionId ?? '—' }}</td>
              </tr>
            </tbody>
          </table>

          <div class="teacher-roster__dialog-actions flex justify-end gap-2">
            <UiButton variant="link" color="secondary" @click="closeBulkTutoring">
              {{ t('common.close') }}
            </UiButton>
            <UiButton
              variant="outline"
              color="primary"
              @click="exportBulkResultCsv(bulkTutoringState.result, 'bulk-tutoring.csv')"
            >
              {{ t('bulk.exportCsv') }}
            </UiButton>
          </div>
        </template>

        <template v-else>
          <div class="teacher-roster__bulk-mode flex justify-start">
            <UiRadioGroup
              v-model="bulkTutoringState.mode"
              :options="[
                { value: 'perStudent', label: t('bulk.mode.perStudent') },
                { value: 'pairing', label: t('bulk.mode.pairing') }
              ]"
            />
          </div>

          <div v-if="bulkTutoringState.mode === 'perStudent'" class="teacher-roster__bulk-assignments flex flex-col gap-3">
            <div
              v-for="pair in bulkTutoringState.pairs"
              :key="`pair-${pair.studentId}`"
              class="teacher-roster__bulk-assignment-row grid gap-3 items-center [grid-template-columns:minmax(160px,1fr)_minmax(220px,1.2fr)]"
            >
              <span class="teacher-roster__bulk-student font-semibold">{{ studentDisplayName(pair.studentId) }}</span>
              <UiSelect v-model="pair.slotId" :label="t('bulk.selectSlot')" required>
                <option
                  v-for="slot in bulkTutoringState.availableSlots"
                  :key="slot.id"
                  :value="slot.id"
                >
                  {{ formatDateTime(slot.startAt) }} - {{ formatDateTime(slot.endAt) }} ({{ slot.timeZone }})
                </option>
              </UiSelect>
            </div>
          </div>

          <div v-else class="teacher-roster__bulk-pairing flex flex-col gap-3">
            <p class="teacher-roster__bulk-note m-0 text-content-secondary">
              {{ t('bulk.pairingNote', { count: contextStudentCount }) }}
            </p>
            <UiSelect v-model="bulkTutoringState.pairingSlotIds" :label="t('bulk.selectMultipleSlots')" multiple>
              <option v-for="slot in bulkTutoringState.availableSlots" :key="slot.id" :value="slot.id">
                {{ formatDateTime(slot.startAt) }} - {{ formatDateTime(slot.endAt) }} ({{ slot.timeZone }})
              </option>
            </UiSelect>
          </div>

          <div class="teacher-roster__dialog-actions flex justify-end gap-2">
            <UiButton variant="link" color="secondary" @click.prevent="closeBulkTutoring">
              {{ t('common.cancel') }}
            </UiButton>
            <UiButton button-type="button" color="primary" :loading="bulkTutoringState.loading" @click="submitBulkTutoring">
              {{ t('bulk.submit') }}
            </UiButton>
          </div>
        </template>
      </div>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiTabs from '@/components/ui/UiTabs.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable from '@/components/ui/UiTable.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiRadioGroup from '@/components/ui/UiRadioGroup.vue';
import { useTeacherRosterStore } from '@/stores/teacherRoster';
import { useToast } from '@/composables/useToast';
import { useTenantStore } from '@/stores/tenant';
import { useFeaturesStore } from '@/stores/features';
import { useSubscriptionStore } from '@/stores/subscription';
import { useVisibilityRefresh } from '@/composables/useVisibilityRefresh';
import { FEATURE } from '@/constants/featureCatalog';
import { useCoursesStore } from '@/stores/courses';
import type { CourseSummary } from '@/stores/courses';
import type { GroupDto, GroupMemberDto, StudentListItem } from '@/services/teacherRoster';
import { fetchGroupMembers } from '@/services/teacherRoster';
import { bulkEnrollStudents, bulkRegisterLiveSessions, bulkAssignTutoring, type BulkOperationResult, type TutoringMode } from '@/services/teacherBulk';
import { fetchTeacherLiveSessions, type LiveSessionSummary } from '@/services/liveSessions';
import { fetchTeacherAvailability, type AvailabilitySlot } from '@/services/tutoring';
import type { AxiosError } from 'axios';

const { t } = useI18n();
const toast = useToast();
const store = useTeacherRosterStore();
const tenantStore = useTenantStore();
const featuresStore = useFeaturesStore();
const coursesStore = useCoursesStore();
const subscriptionStore = useSubscriptionStore();
const { summary: subscriptionSummary } = storeToRefs(subscriptionStore);

const rosterRefreshInFlight = ref(false);
const lastSubscriptionSignature = ref<string | null>(null);

const buildSubscriptionSignature = (summary: unknown) => {
  const current = (summary as {
    currentSubscription?: { id?: number | string; status?: string; endsAt?: string | null } | null;
  })?.currentSubscription;
  if (!current) {
    return 'none';
  }
  const id = current.id ?? 'none';
  const status = current.status ?? 'unknown';
  const endsAt = current.endsAt ?? 'none';
  return `${id}:${status}:${endsAt}`;
};

const refreshRosterData = async (reason: string) => {
  if (rosterRefreshInFlight.value) {
    return;
  }
  rosterRefreshInFlight.value = true;
  try {
    console.info('[TeacherRosterView] refreshing roster after %s', reason);
    const tasks: Promise<unknown>[] = [
      featuresStore.refresh().catch((error) => {
        console.error('[TeacherRosterView] failed to refresh features while updating roster', error);
      }),
      store
        .loadStudents()
        .catch((error) => console.error('[TeacherRosterView] failed to reload students', error))
    ];

    if (featuresStore.hasFeature(FEATURE.teacherRosterGroups)) {
      tasks.push(
        store
          .loadGroups()
          .catch((error) => console.error('[TeacherRosterView] failed to reload groups', error))
      );
    }

    await Promise.allSettled(tasks);
  } finally {
    rosterRefreshInFlight.value = false;
  }
};

useVisibilityRefresh(
  (reason) => {
    console.debug('[TeacherRosterView] visibility refresh triggered by %s', reason);
    void refreshRosterData(reason);
  },
  {
    includeActivated: true,
    throttleMs: 500
  }
);

const activeTab = ref<'students' | 'groups'>('students');

const studentSearch = ref('');
const studentStatus = ref('');
const groupQuery = ref('');
const memberQuery = ref('');

const selectedStudents = ref<Array<number | string>>([]);

const showGroupForm = ref(false);
const showMembers = ref(false);
const showAddMembers = ref(false);
const editingGroup = ref<GroupDto | null>(null);
const groupSaving = ref(false);
const addMembersLoading = ref(false);
const membersSelection = ref<number[]>([]);

const groupForm = reactive({
  name: '',
  description: '',
  capacity: null as number | null
});

type BulkContext =
  | { kind: 'students'; studentIds: number[]; students: StudentListItem[] }
  | { kind: 'group'; groupId: number; groupName: string; members: GroupMemberDto[]; memberCount: number };

interface TutoringAssignmentRow {
  studentId: number;
  slotId: number | null;
}

const bulkContext = ref<BulkContext | null>(null);
const bulkContextLoading = ref(false);

const bulkEnrollState = reactive({
  open: false,
  loading: false,
  courseId: null as number | null,
  result: null as BulkOperationResult | null
});

const bulkLiveState = reactive({
  open: false,
  loading: false,
  sessionId: null as number | null,
  sessions: [] as LiveSessionSummary[],
  sessionsLoading: false,
  result: null as BulkOperationResult | null
});

const bulkTutoringState = reactive({
  open: false,
  loading: false,
  mode: 'perStudent' as TutoringMode,
  availableSlots: [] as AvailabilitySlot[],
  slotsLoading: false,
  result: null as BulkOperationResult | null,
  pairs: [] as TutoringAssignmentRow[],
  pairingSlotIds: [] as number[]
});

const studentHeaders = computed(() => [
  { title: t('roster.nameColumn'), key: 'name', sortable: false },
  { title: t('roster.statusColumn'), key: 'status', sortable: false },
  { title: t('roster.device.column'), key: 'device', sortable: false },
  { title: t('roster.joinedColumn'), key: 'joinedAt', sortable: false },
  { title: t('roster.device.actions'), key: 'actions', sortable: false }
]);

const groupHeaders = computed(() => [
  { title: t('roster.groupNameColumn'), key: 'name', sortable: false },
  { title: t('roster.membersColumn'), key: 'members', sortable: false },
  { title: t('roster.createdColumn'), key: 'createdAt', sortable: false },
  { title: '', key: 'actions', sortable: false }
]);

const memberHeaders = computed(() => [
  { title: t('roster.memberNameColumn'), key: 'name', sortable: false },
  { title: t('roster.memberEmailColumn'), key: 'email', sortable: false },
  { title: t('roster.memberJoinedColumn'), key: 'joinedAt', sortable: false },
  { title: '', key: 'actions', sortable: false }
]);

const studentStatusOptions = computed(() => [
  { value: 'pending_verification', label: t('roster.status.pending_verification') },
  { value: 'active', label: t('roster.status.active') },
  { value: 'suspended', label: t('roster.status.suspended') },
  { value: 'deleted', label: t('roster.status.deleted') }
]);

const isRosterFeatureEnabled = computed(() => featuresStore.hasFeature(FEATURE.teacherRosterGroups));
const tabItems = computed(() => {
  const items = [
    { label: t('roster.tabStudents'), value: 'students', badge: store.studentsTotal || undefined }
  ];
  if (isRosterFeatureEnabled.value) {
    items.push({ label: t('roster.tabGroups'), value: 'groups', badge: store.groupsTotal || undefined });
  }
  return items;
});

const bulkFeatureEnabled = computed(() => featuresStore.hasFeature(FEATURE.teacherBulkOps));
const liveSessionsFeatureEnabled = computed(() => featuresStore.hasFeature(FEATURE.liveSessionsCore));

const selectedStudentIds = computed(() =>
  selectedStudents.value
    .map((value) => (typeof value === 'string' ? Number.parseInt(value, 10) : Number(value)))
    .filter((id) => Number.isFinite(id)) as number[]
);

const selectedStudentCount = computed(() => selectedStudentIds.value.length);

const showBulkStudentsBar = computed(() => bulkFeatureEnabled.value && selectedStudentIds.value.length > 0);

const studentNameLookup = computed(() => {
  const lookup = new Map<number, string>();
  store.students.forEach((student) => lookup.set(student.studentId, student.name));
  const context = bulkContext.value;
  if (context?.kind === 'students') {
    context.students.forEach((student) => lookup.set(student.studentId, student.name));
  } else if (context?.kind === 'group') {
    context.members.forEach((member) => lookup.set(member.studentId, member.name));
  }
  return lookup;
});

const contextStudentCount = computed(() => {
  const context = bulkContext.value;
  if (!context) return 0;
  return context.kind === 'students' ? context.studentIds.length : context.members.length;
});

const contextSummary = computed(() => {
  const context = bulkContext.value;
  if (!context) return '';
  if (context.kind === 'students') {
    return t('bulk.contextSelectedStudents', { count: context.studentIds.length });
  }
  return t('bulk.contextGroup', { name: context.groupName, count: context.members.length });
});

const isLastStudentPage = computed(() => {
  const totalPages = Math.ceil(store.studentsTotal / store.studentsSize) || 1;
  return store.studentsPage >= totalPages - 1;
});

const isLastGroupPage = computed(() => {
  const totalPages = Math.ceil(store.groupsTotal / store.groupsSize) || 1;
  return store.groupsPage >= totalPages - 1;
});

const isLastMemberPage = computed(() => {
  const totalPages = Math.ceil(store.membersTotal / store.membersSize) || 1;
  return store.membersPage >= totalPages - 1;
});

const firstStudentIndex = computed(() => (store.studentsTotal === 0 ? 0 : store.studentsPage * store.studentsSize + 1));
const lastStudentIndex = computed(() => Math.min(store.studentsTotal, (store.studentsPage + 1) * store.studentsSize));
const firstGroupIndex = computed(() => (store.groupsTotal === 0 ? 0 : store.groupsPage * store.groupsSize + 1));
const lastGroupIndex = computed(() => Math.min(store.groupsTotal, (store.groupsPage + 1) * store.groupsSize));
const firstMemberIndex = computed(() => (store.membersTotal === 0 ? 0 : store.membersPage * store.membersSize + 1));
const lastMemberIndex = computed(() => Math.min(store.membersTotal, (store.membersPage + 1) * store.membersSize));

const quotaWarning = computed(() => store.quotaWarning);
const quotaPlanName = computed(() => {
  const planKey = quotaWarning.value?.plan?.toLowerCase();
  if (!planKey) {
    return '';
  }
  const translationKey = `adminConsole.planOptions.${planKey}`;
  const translated = t(translationKey);
  return translated === translationKey ? quotaWarning.value?.plan || '' : translated;
});
const quotaWarningMessage = computed(() => {
  if (!quotaWarning.value) {
    return '';
  }
  const planLabel = quotaPlanName.value || quotaWarning.value.plan || '';
  const limit = quotaWarning.value.limit && quotaWarning.value.limit > 0 ? quotaWarning.value.limit : '—';
  return t('roster.planQuotaWarning', { plan: planLabel, limit });
});
const quotaWarningSuggestion = computed(() => {
  if (!quotaWarning.value) {
    return '';
  }
  return quotaWarning.value.suggestion || t('roster.planQuotaSuggestion');
});

const availableStudents = computed(() => {
  const currentMemberIds = new Set(store.members.map((member) => member.studentId));
  return store.students.filter((student) => !currentMemberIds.has(student.studentId));
});

const groupFormTitle = computed(() => (editingGroup.value ? t('roster.editGroupTitle') : t('roster.createGroupTitle')));

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const statusLabel = (status: string) => t(`roster.status.${status}`, status);

const statusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'pending_verification':
      return 'warning';
    case 'suspended':
      return 'secondary';
    case 'deleted':
      return 'danger';
    default:
      return 'info';
  }
};

const deviceStatusLabel = (student: StudentListItem) => {
  if (student.deviceDisabled) return t('roster.device.disabled');
  if (student.deviceRegistered) return t('roster.device.registered');
  return t('roster.device.none');
};

const deviceStatusColor = (student: StudentListItem) => {
  if (student.deviceDisabled) return 'danger';
  if (student.deviceRegistered) return 'success';
  return 'warning';
};

const bulkStatusColor = (status: 'success' | 'skipped' | 'failed') => {
  switch (status) {
    case 'success':
      return 'success';
    case 'skipped':
      return 'warning';
    default:
      return 'danger';
  }
};

const applyStudentFilters = async () => {
  try {
    await store.loadStudents({ search: studentSearch.value.trim(), status: studentStatus.value || undefined, page: 0 });
  } catch (error) {
    toast.error(t('roster.loadFailed'));
    console.error('Failed to load students', error);
  }
};

const resetStudentFilters = () => {
  studentSearch.value = '';
  studentStatus.value = '';
  applyStudentFilters();
};

const changeStudentPage = async (page: number) => {
  if (page < 0) return;
  try {
    await store.loadStudents({ page });
  } catch (error) {
    toast.error(t('roster.loadFailed'));
  }
};

const onStatusChange = (value: string | number | null) => {
  studentStatus.value = typeof value === 'string' ? value : '';
  applyStudentFilters();
};

const disableStudentDevice = async (student: StudentListItem) => {
  try {
    await store.disableStudentDevice(student.studentId);
    toast.success(t('roster.device.disabledToast'));
  } catch (error) {
    toast.error(t('roster.device.error'));
    console.error('Failed to disable student device', error);
  }
};

const enableStudentDevice = async (student: StudentListItem) => {
  try {
    await store.enableStudentDevice(student.studentId);
    toast.success(t('roster.device.enabledToast'));
  } catch (error) {
    toast.error(t('roster.device.error'));
    console.error('Failed to enable student device', error);
  }
};

const resetStudentDevice = async (student: StudentListItem) => {
  try {
    await store.resetStudentDevice(student.studentId);
    toast.success(t('roster.device.resetToast'));
  } catch (error) {
    toast.error(t('roster.device.error'));
    console.error('Failed to reset student device', error);
  }
};

const applyGroupFilters = async () => {
  try {
    await store.loadGroups({ q: groupQuery.value.trim(), page: 0 });
  } catch (error) {
    toast.error(t('roster.loadGroupsFailed'));
    console.error('Failed to load groups', error);
  }
};

const resetGroupFilters = () => {
  groupQuery.value = '';
  applyGroupFilters();
};

const changeGroupPage = async (page: number) => {
  if (page < 0) return;
  try {
    await store.loadGroups({ page });
  } catch (error) {
    toast.error(t('roster.loadGroupsFailed'));
  }
};

const changeMemberPage = async (page: number) => {
  if (page < 0 || !store.activeGroup) return;
  try {
    await store.loadMembers(store.activeGroup.id, { page });
  } catch (error) {
    toast.error(t('roster.loadMembersFailed'));
  }
};

const applyMemberSearch = async () => {
  if (!store.activeGroup) return;
  try {
    await store.loadMembers(store.activeGroup.id, { q: memberQuery.value.trim(), page: 0 });
  } catch (error) {
    toast.error(t('roster.loadMembersFailed'));
  }
};

const openCreateGroup = () => {
  editingGroup.value = null;
  groupForm.name = '';
  groupForm.description = '';
  groupForm.capacity = null;
  showGroupForm.value = true;
};

const openEditGroup = (group: GroupDto) => {
  editingGroup.value = group;
  groupForm.name = group.name;
  groupForm.description = group.description || '';
  groupForm.capacity = group.capacity ?? null;
  showGroupForm.value = true;
};

const closeGroupForm = () => {
  showGroupForm.value = false;
  groupSaving.value = false;
};

const submitGroupForm = async () => {
  groupSaving.value = true;
  const payload = {
    name: groupForm.name.trim(),
    description: groupForm.description.trim() || undefined,
    capacity: groupForm.capacity ?? undefined
  };
  try {
    if (editingGroup.value) {
      await store.updateGroup(editingGroup.value.id, payload);
      toast.success(t('roster.groupUpdated'));
    } else {
      await store.createGroup(payload);
      toast.success(t('roster.groupCreated'));
    }
    closeGroupForm();
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 409) {
      toast.error(t('roster.groupDuplicate'));
      return;
    }
    if (status === 422) {
      toast.error(t('roster.groupCapacityError'));
      return;
    }
    toast.error(t('roster.groupSaveFailed'));
    console.error('Failed to save group', error);
  } finally {
    groupSaving.value = false;
  }
};

const confirmDeleteGroup = async (group: GroupDto) => {
  const confirmed = window.confirm(t('roster.deleteConfirm', { name: group.name }));
  if (!confirmed) return;
  try {
    await store.deleteGroup(group.id);
    toast.success(t('roster.groupDeleted'));
  } catch (error) {
    toast.error(t('roster.deleteFailed'));
    console.error('Failed to delete group', error);
  }
};

const openMembers = async (group: GroupDto) => {
  store.activeGroup = group;
  memberQuery.value = '';
  membersSelection.value = [];
  showMembers.value = true;
  try {
    await store.loadMembers(group.id, { page: 0 });
  } catch (error) {
    toast.error(t('roster.loadMembersFailed'));
  }
};

const removeMember = async (member: GroupMemberDto) => {
  if (!store.activeGroup) return;
  const confirmed = window.confirm(t('roster.removeConfirm', { name: member.name }));
  if (!confirmed) return;
  try {
    await store.removeMember(store.activeGroup.id, member.studentId);
    toast.success(t('roster.memberRemoved'));
  } catch (error) {
    toast.error(t('roster.removeFailed'));
    console.error('Failed to remove member', error);
  }
};

const openAddMembers = async () => {
  if (!store.activeGroup) return;
  membersSelection.value = [];
  showAddMembers.value = true;
  if (!store.students.length) {
    try {
      await store.loadStudents();
    } catch (error) {
      toast.error(t('roster.loadFailed'));
    }
  }
};

const closeAddMembers = () => {
  showAddMembers.value = false;
  addMembersLoading.value = false;
};

const submitAddMembers = async () => {
  if (!store.activeGroup || !membersSelection.value.length) return;
  addMembersLoading.value = true;
  try {
    await store.addMembers(store.activeGroup.id, { studentIds: membersSelection.value });
    toast.success(t('roster.membersAdded'));
    closeAddMembers();
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 422) {
      toast.error(t('roster.capacityExceeded'));
    } else if (status === 400) {
      toast.error(t('roster.invalidStudent'));
    } else {
      toast.error(t('roster.addMembersFailed'));
      console.error('Failed to add members', error);
    }
  } finally {
    addMembersLoading.value = false;
  }
};

const fetchAllGroupMembers = async (groupId: number) => {
  const members: GroupMemberDto[] = [];
  let page = 0;
  const size = 200;
  // guard to avoid infinite loops
  for (let attempts = 0; attempts < 20; attempts += 1) {
    const response = await fetchGroupMembers(groupId, { page, size });
    members.push(...response.items);
    if (members.length >= response.total) {
      break;
    }
    page += 1;
  }
  return members;
};

const getContextStudents = (context: BulkContext) => {
  if (context.kind === 'students') {
    return context.students.map((student) => ({
      id: student.studentId,
      name: student.name,
      email: student.email
    }));
  }
  return context.members.map((member) => ({
    id: member.studentId,
    name: member.name,
    email: member.email
  }));
};

const buildStudentsContext = () => {
  const ids = selectedStudentIds.value;
  if (!ids.length) {
    toast.info(t('bulk.noStudentsSelected'));
    return null;
  }
  const uniqueIds = Array.from(new Set(ids));
  const students: StudentListItem[] = [];
  uniqueIds.forEach((id) => {
    const match = store.students.find((student) => student.studentId === id);
    if (match) {
      students.push(match);
    }
  });
  if (students.length !== uniqueIds.length) {
    toast.error(t('bulk.selectionOutOfSync'));
    return null;
  }
  return { kind: 'students', studentIds: uniqueIds, students } as BulkContext;
};

const buildGroupContext = async (group: GroupDto) => {
  bulkContextLoading.value = true;
  try {
    const members = await fetchAllGroupMembers(group.id);
    return {
      kind: 'group',
      groupId: group.id,
      groupName: group.name,
      members,
      memberCount: group.membersCount
    } as BulkContext;
  } catch (error) {
    toast.error(t('bulk.loadGroupMembersFailed'));
    console.error('Failed to load group members', error);
    return null;
  } finally {
    bulkContextLoading.value = false;
  }
};

const ensureCoursesLoaded = async () => {
  if (!coursesStore.list.length) {
    try {
      await coursesStore.fetchCourses();
    } catch (error) {
      toast.error(t('bulk.loadCoursesFailed'));
      throw error;
    }
  }
};

const ensureLiveSessionsLoaded = async () => {
  if (!liveSessionsFeatureEnabled.value) {
    bulkLiveState.sessions = [];
    return;
  }
  if (bulkLiveState.sessionsLoading) return;
  bulkLiveState.sessionsLoading = true;
  try {
    bulkLiveState.sessions = await fetchTeacherLiveSessions();
  } catch (error) {
    toast.error(t('bulk.loadSessionsFailed'));
    throw error;
  } finally {
    bulkLiveState.sessionsLoading = false;
  }
};

const ensureAvailabilityLoaded = async () => {
  if (bulkTutoringState.slotsLoading) return;
  bulkTutoringState.slotsLoading = true;
  try {
    const slots = await fetchTeacherAvailability();
    bulkTutoringState.availableSlots = slots.filter((slot) => !slot.booked);
  } catch (error) {
    toast.error(t('bulk.loadSlotsFailed'));
    throw error;
  } finally {
    bulkTutoringState.slotsLoading = false;
  }
};

const handleBulkError = (error: unknown) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  const message = axiosError?.response?.data?.message || axiosError?.message || t('bulk.genericError');
  toast.error(message);
  console.error('Bulk operation failed', error);
};

const resetBulkEnroll = () => {
  bulkEnrollState.loading = false;
  bulkEnrollState.courseId = null;
  bulkEnrollState.result = null;
};

const resetBulkLive = () => {
  bulkLiveState.loading = false;
  bulkLiveState.sessionId = null;
  bulkLiveState.result = null;
};

const resetBulkTutoring = (context?: BulkContext | null) => {
  bulkTutoringState.loading = false;
  bulkTutoringState.result = null;
  bulkTutoringState.mode = 'perStudent';
  bulkTutoringState.pairingSlotIds = [];
  if (context) {
    const students = getContextStudents(context);
    bulkTutoringState.pairs = students.map((student) => ({ studentId: student.id, slotId: null }));
  } else {
    bulkTutoringState.pairs = [];
  }
};

const closeBulkEnroll = () => {
  bulkEnrollState.open = false;
  resetBulkEnroll();
};

const closeBulkLive = () => {
  bulkLiveState.open = false;
  resetBulkLive();
};

const closeBulkTutoring = () => {
  bulkTutoringState.open = false;
  resetBulkTutoring(null);
};

const successToast = (result: BulkOperationResult) => {
  toast.success(
    t('bulk.successToast', {
      success: result.summary.success,
      skipped: result.summary.skipped,
      failed: result.summary.failed
    })
  );
};

const openBulkEnrollFromSelection = async () => {
  if (!bulkFeatureEnabled.value) {
    toast.info(t('bulk.featureDisabled'));
    return;
  }
  const context = buildStudentsContext();
  if (!context) return;
  bulkContext.value = context;
  resetBulkEnroll();
  try {
    await ensureCoursesLoaded();
    bulkEnrollState.open = true;
    if (coursesStore.list.length === 1) {
      bulkEnrollState.courseId = coursesStore.list[0].id;
    }
  } catch {
    // error handled above
  }
};

const openBulkEnrollForGroup = async (group: GroupDto) => {
  if (!bulkFeatureEnabled.value) {
    toast.info(t('bulk.featureDisabled'));
    return;
  }
  const context = await buildGroupContext(group);
  if (!context) return;
  if (!context.members.length) {
    toast.warning(t('bulk.emptyGroup'));
  }
  bulkContext.value = context;
  resetBulkEnroll();
  try {
    await ensureCoursesLoaded();
    bulkEnrollState.open = true;
    if (coursesStore.list.length === 1) {
      bulkEnrollState.courseId = coursesStore.list[0].id;
    }
  } catch {
    // handled in ensureCoursesLoaded
  }
};

const submitBulkEnroll = async () => {
  if (!bulkContext.value) return;
  if (!bulkEnrollState.courseId) {
    toast.error(t('bulk.selectCourseRequired'));
    return;
  }
  const payload: Record<string, unknown> = {
    courseId: bulkEnrollState.courseId
  };
  if (bulkContext.value.kind === 'students') {
    payload.studentIds = bulkContext.value.studentIds;
  } else {
    payload.groupId = bulkContext.value.groupId;
  }
  bulkEnrollState.loading = true;
  try {
    const result = await bulkEnrollStudents(payload as any);
    bulkEnrollState.result = result;
    successToast(result);
    if (bulkContext.value.kind === 'students') {
      selectedStudents.value = [];
    }
  } catch (error) {
    handleBulkError(error);
  } finally {
    bulkEnrollState.loading = false;
  }
};

const openBulkLiveFromSelection = async () => {
  if (!bulkFeatureEnabled.value || !liveSessionsFeatureEnabled.value) {
    toast.info(t('bulk.featureDisabled'));
    return;
  }
  const context = buildStudentsContext();
  if (!context) return;
  bulkContext.value = context;
  resetBulkLive();
  try {
    await ensureLiveSessionsLoaded();
    if (!bulkLiveState.sessions.length) {
      toast.warning(t('bulk.noSessionsAvailable'));
      return;
    }
    bulkLiveState.open = true;
  } catch {
    // handled in ensureLiveSessionsLoaded
  }
};

const openBulkLiveForGroup = async (group: GroupDto) => {
  if (!bulkFeatureEnabled.value || !liveSessionsFeatureEnabled.value) {
    toast.info(t('bulk.featureDisabled'));
    return;
  }
  const context = await buildGroupContext(group);
  if (!context) return;
  bulkContext.value = context;
  resetBulkLive();
  try {
    await ensureLiveSessionsLoaded();
    if (!bulkLiveState.sessions.length) {
      toast.warning(t('bulk.noSessionsAvailable'));
      return;
    }
    bulkLiveState.open = true;
  } catch {
    // handled earlier
  }
};

const submitBulkLive = async () => {
  if (!bulkContext.value) return;
  if (!bulkLiveState.sessionId) {
    toast.error(t('bulk.selectSessionRequired'));
    return;
  }
  const payload: Record<string, unknown> = {
    sessionId: bulkLiveState.sessionId
  };
  if (bulkContext.value.kind === 'students') {
    payload.studentIds = bulkContext.value.studentIds;
  } else {
    payload.groupId = bulkContext.value.groupId;
  }
  bulkLiveState.loading = true;
  try {
    const result = await bulkRegisterLiveSessions(payload as any);
    bulkLiveState.result = result;
    successToast(result);
    if (bulkContext.value.kind === 'students') {
      selectedStudents.value = [];
    }
  } catch (error) {
    handleBulkError(error);
  } finally {
    bulkLiveState.loading = false;
  }
};

const initializeTutoringAssignments = (context: BulkContext) => {
  const students = getContextStudents(context);
  bulkTutoringState.pairs = students.map((student) => ({ studentId: student.id, slotId: null }));
  bulkTutoringState.pairingSlotIds = [];
};

const openBulkTutoringFromSelection = async () => {
  if (!bulkFeatureEnabled.value) {
    toast.info(t('bulk.featureDisabled'));
    return;
  }
  const context = buildStudentsContext();
  if (!context) return;
  bulkContext.value = context;
  resetBulkTutoring(context);
  try {
    await ensureAvailabilityLoaded();
    bulkTutoringState.open = true;
  } catch {
    // handled
  }
};

const openBulkTutoringForGroup = async (group: GroupDto) => {
  if (!bulkFeatureEnabled.value) {
    toast.info(t('bulk.featureDisabled'));
    return;
  }
  const context = await buildGroupContext(group);
  if (!context) return;
  bulkContext.value = context;
  resetBulkTutoring(context);
  try {
    await ensureAvailabilityLoaded();
    bulkTutoringState.open = true;
  } catch {
    // handled
  }
};

const submitBulkTutoring = async () => {
  if (!bulkContext.value) return;
  const context = bulkContext.value;
  const studentIds = context.kind === 'students' ? context.studentIds : context.members.map((member) => member.studentId);
  if (!studentIds.length) {
    toast.warning(t('bulk.noStudentsSelected'));
    return;
  }
  const payload: Record<string, unknown> = {
    mode: bulkTutoringState.mode
  };
  if (bulkTutoringState.mode === 'perStudent') {
    const missing = bulkTutoringState.pairs.some((pair) => !pair.slotId);
    if (missing) {
      toast.error(t('bulk.slotRequiredPerStudent'));
      return;
    }
    const slotIds = bulkTutoringState.pairs.map((pair) => pair.slotId as number);
    const uniqueSlots = new Set(slotIds);
    if (uniqueSlots.size !== slotIds.length) {
      toast.error(t('bulk.duplicateSlotSelection'));
      return;
    }
    payload.pairs = bulkTutoringState.pairs.map((pair) => ({ studentId: pair.studentId, slotId: pair.slotId }));
  } else {
    if (bulkTutoringState.pairingSlotIds.length !== studentIds.length) {
      toast.error(t('bulk.slotCountMismatch', { expected: studentIds.length }));
      return;
    }
    const uniqueSlots = new Set(bulkTutoringState.pairingSlotIds);
    if (uniqueSlots.size !== bulkTutoringState.pairingSlotIds.length) {
      toast.error(t('bulk.duplicateSlotSelection'));
      return;
    }
    payload.studentIds = studentIds;
    payload.slotIds = bulkTutoringState.pairingSlotIds;
  }
  bulkTutoringState.loading = true;
  try {
    const result = await bulkAssignTutoring(payload as any);
    bulkTutoringState.result = result;
    successToast(result);
    if (context.kind === 'students') {
      selectedStudents.value = [];
    }
  } catch (error) {
    handleBulkError(error);
  } finally {
    bulkTutoringState.loading = false;
  }
};

const exportBulkResultCsv = (result: BulkOperationResult, filename: string) => {
  const rows = result.items.map((item) => {
    const name = studentNameLookup.value.get(item.studentId) ?? `#${item.studentId}`;
    const reason = item.reason ?? '';
    const sessionId = typeof item.extra?.sessionId === 'number' ? item.extra.sessionId : '';
    return [item.studentId, name, item.status, reason, sessionId];
  });
  const header = ['studentId', 'name', 'status', 'reason', 'sessionId'];
  const csvContent = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const studentDisplayName = (studentId: number) => studentNameLookup.value.get(studentId) ?? `#${studentId}`;

const formatReason = (reason?: string | null) => {
  if (!reason) return t('bulk.noReason');
  const key = `bulk.reasons.${reason}`;
  const translated = t(key);
  return translated === key ? reason : translated;
};

onMounted(async () => {
  studentSearch.value = store.studentsSearch;
  studentStatus.value = store.studentsStatus;
  groupQuery.value = store.groupsQuery;
  memberQuery.value = store.membersQuery;
  await featuresStore.ensureLoaded().catch((error) => {
    console.warn('[TeacherRosterView] failed to ensure features on mount', error);
  });
  if (activeTab.value === 'students') {
    try {
      await store.loadStudents();
    } catch (error) {
      toast.error(t('roster.loadFailed'));
    }
    try {
      await store.loadGroups();
    } catch (error) {
      if (isRosterFeatureEnabled.value) {
        toast.error(t('roster.loadGroupsFailed'));
      }
    }
  } else {
    try {
      await store.loadGroups();
    } catch (error) {
      toast.error(t('roster.loadGroupsFailed'));
    }
  }
});

onActivated(() => {
  void refreshRosterData('activated');
});

watch(
  () => bulkTutoringState.mode,
  () => {
    if (bulkContext.value) {
      resetBulkTutoring(bulkContext.value);
    }
  }
);

watch(
  () => bulkContext.value,
  (context) => {
    if (context && bulkTutoringState.open) {
      resetBulkTutoring(context);
    }
  }
);

watch(bulkFeatureEnabled, (enabled) => {
  if (!enabled) {
    closeBulkEnroll();
    closeBulkLive();
    closeBulkTutoring();
  }
});

watch(liveSessionsFeatureEnabled, (enabled) => {
  if (!enabled) {
    closeBulkLive();
  }
});

watch(
  subscriptionSummary,
  (summary) => {
    const signature = buildSubscriptionSignature(summary);
    if (lastSubscriptionSignature.value === null) {
      lastSubscriptionSignature.value = signature;
      return;
    }
    if (signature === lastSubscriptionSignature.value) {
      return;
    }
    lastSubscriptionSignature.value = signature;
    void refreshRosterData('subscription-update');
  },
  { deep: true }
);

watch(activeTab, async (tab) => {
  if (!isRosterFeatureEnabled.value) {
    return;
  }
  if (tab === 'students' && !store.students.length && !store.studentsLoading) {
    try {
      await store.loadStudents();
    } catch (error) {
      toast.error(t('roster.loadFailed'));
    }
  }
  if (tab === 'groups' && !store.groups.length && !store.groupsLoading) {
    try {
      await store.loadGroups();
    } catch (error) {
      toast.error(t('roster.loadGroupsFailed'));
    }
  }
});
</script>

<style scoped>
.teacher-roster__bulk-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding: var(--sakai-space-4);
  border: 1px solid var(--sakai-border-color);
  border-radius: var(--sakai-border-radius-md);
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
  gap: var(--sakai-space-3);
}

.teacher-roster__bulk-summary-grid > div {
  padding: var(--sakai-space-3);
  border: 1px solid var(--sakai-border-color);
  border-radius: var(--sakai-border-radius-md);
  background: var(--sakai-surface-accent);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.teacher-roster__bulk-summary-grid span {
  font-size: 0.8rem;
  color: var(--sakai-text-color-secondary);
}

.teacher-roster__bulk-summary-grid strong {
  font-size: 1.1rem;
}

.teacher-roster__bulk-table th,
.teacher-roster__bulk-table td {
  padding: var(--sakai-space-3);
  border-bottom: 1px solid var(--sakai-border-color);
  text-align: left;
}

.teacher-roster__list {
  display: none;
  gap: var(--sakai-space-3);
}

.teacher-roster__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.teacher-roster__list-field label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-muted);
}

.teacher-roster__capacity-pill {
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  border-radius: var(--sakai-border-radius-pill);
  background: color-mix(in srgb, var(--sakai-primary) 12%, transparent);
  color: var(--sakai-primary-700);
}

@media (max-width: 768px) {
  .teacher-roster__table--students {
    display: none;
  }

  .teacher-roster__list--students {
    display: grid;
  }
}
</style>
