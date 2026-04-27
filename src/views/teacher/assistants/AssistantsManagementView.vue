<template>
  <ThemePage :title="t('teacher.assistants.title')" :subtitle="t('teacher.assistants.subtitle')">
    <div class="assistants-management">
      <section id="assistant-overview" ref="assistantOverviewSection" class="assistants-management__section">
        <UiCard class="assistants-management__card assistants-management__overview" hover>
          <template #title>{{ t('teacher.assistants.summary.title') }}</template>
          <template #subtitle>{{ t('teacher.assistants.summary.subtitle') }}</template>
          <template #actions>
            <UiButton
              size="sm"
              variant="ghost"
              color="neutral"
              :disabled="summaryRefreshing || store.rolesLoading || store.assistantsLoading"
              @click="refreshOverview"
            >
              <span v-if="summaryRefreshing" class="loader"></span>
              <span>
                {{
                  summaryRefreshing
                    ? t('teacher.assistants.summary.refreshing')
                    : t('teacher.assistants.summary.refresh')
                }}
              </span>
            </UiButton>
          </template>
          <p class="assistants-management__summary-meta">
            {{ summaryLastUpdated }}
          </p>
          <div class="assistants-management__summary-grid">
            <div v-for="card in summaryCards" :key="card.key" class="assistants-management__summary-stat">
              <span class="assistants-management__summary-value">{{ formatNumber(card.value) }}</span>
              <span class="assistants-management__summary-label">{{ card.label }}</span>
              <span class="assistants-management__summary-description">{{ card.description }}</span>
            </div>
          </div>
          <div class="assistants-management__persona-distribution">
            <div class="assistants-management__persona-distribution-header">
              <h4>{{ t('teacher.assistants.summary.personasTitle') }}</h4>
              <span class="assistants-management__persona-distribution-meta">
                {{ t('teacher.assistants.summary.personasSubtitle') }}
              </span>
            </div>
            <p
              v-if="coverageLoading && !hasPersonaDistributionData"
              class="assistants-management__persona-distribution-empty"
            >
              {{ t('teacher.assistants.summary.personasLoading') }}
            </p>
            <p
              v-else-if="!personaDistribution.length"
              class="assistants-management__persona-distribution-empty"
            >
              {{ t('teacher.assistants.summary.personasEmpty') }}
            </p>
            <div v-else class="assistants-management__persona-grid">
              <div
                v-for="persona in personaDistribution"
                :key="persona.key"
                class="assistants-management__persona-card"
              >
                <div class="assistants-management__persona-card-header">
                  <UiTag size="sm" class="assistants-management__persona-tag" :color="persona.color">
                    {{ persona.label }}
                  </UiTag>
                </div>
                <p class="assistants-management__persona-count">
                  {{
                    t('teacher.assistants.summary.personasRoles', {
                      count: formatNumber(persona.roleCount)
                    })
                  }}
                </p>
                <p class="assistants-management__persona-count">
                  {{
                    t('teacher.assistants.summary.personasAssistants', {
                      count: formatNumber(persona.assistantCount)
                    })
                  }}
                </p>
              </div>
            </div>
          </div>
          <div class="assistants-management__coverage">
            <div class="assistants-management__coverage-header">
              <h4>{{ t('teacher.assistants.summary.coverage.title') }}</h4>
              <span class="assistants-management__coverage-meta">
                {{ t('teacher.assistants.summary.coverage.subtitle') }}
              </span>
            </div>
            <UiAlert
              v-if="coverageError"
              class="assistants-management__alert"
              color="danger"
              variant="soft"
            >
              {{ t('teacher.assistants.summary.coverage.error') }}
            </UiAlert>
            <template v-else>
              <UiAlert
                v-for="warning in coverageWarnings"
                :key="warning.key"
                class="assistants-management__alert"
                color="warning"
                variant="soft"
              >
                {{ warning.warning }}
              </UiAlert>
              <UiAlert
                v-if="!coverageWarnings.length && coverageSuccessMessage"
                class="assistants-management__alert"
                color="success"
                variant="soft"
              >
                {{ coverageSuccessMessage }}
              </UiAlert>
              <p v-if="coverageLoading" class="assistants-management__coverage-loading">
                {{ t('teacher.assistants.summary.coverage.loading') }}
              </p>
              <div v-else-if="coverageHasData" class="assistants-management__coverage-grid">
                <div
                  v-for="item in coverageView"
                  :key="item.key"
                  class="assistants-management__coverage-item"
                >
                  <div class="assistants-management__coverage-item-header">
                    <span class="assistants-management__coverage-area">{{ item.areaLabel }}</span>
                    <UiTag size="sm" :color="item.tagColor">{{ item.statusLabel }}</UiTag>
                  </div>
                  <p class="assistants-management__coverage-support">
                    {{
                      t('teacher.assistants.summary.coverage.support', {
                        assistants: formatNumber(item.assistantCount),
                        roles: formatNumber(item.roleCount)
                      })
                    }}
                  </p>
                </div>
              </div>
              <p v-else class="assistants-management__coverage-empty">
                {{ t('teacher.assistants.summary.coverage.empty') }}
              </p>
            </template>
          </div>
          <div class="assistants-management__summary-access">
            <div class="assistants-management__summary-access-header">
              <h4>{{ t('teacher.assistants.summary.accessTitle') }}</h4>
              <span class="assistants-management__summary-access-meta">
                {{
                  t('teacher.assistants.summary.rolesCoverage', {
                    available: formatNumber(summarySnapshot.totalRoles),
                    uncovered: formatNumber(summarySnapshot.rolesWithoutMembers)
                  })
                }}
              </span>
            </div>
            <ul class="assistants-management__summary-access-list" role="list">
              <li
                v-for="role in roleAccessList"
                :key="role.id"
                class="assistants-management__summary-access-item"
              >
                <div class="assistants-management__summary-access-item-header">
                  <div class="assistants-management__summary-access-name-group">
                    <span class="assistants-management__summary-access-name">{{ role.name }}</span>
                    <UiTag size="sm" class="assistants-management__persona-tag" :color="role.personaColor">
                      {{ role.personaLabel }}
                    </UiTag>
                  </div>
                  <span class="assistants-management__summary-access-count">
                    {{ t('teacher.assistants.summary.accessAssistants', { count: role.assistantCount }) }}
                  </span>
                </div>
                <div v-if="role.appShellOptions.length" class="assistants-management__app-shell-tags">
                  <UiTag v-for="option in role.appShellOptions" :key="option" size="sm" color="primary">
                    {{ option }}
                  </UiTag>
                </div>
                <p v-else class="assistants-management__app-shell-empty">
                  {{ t('teacher.assistants.summary.accessEmptyRole') }}
                </p>
              </li>
              <li v-if="!roleAccessList.length" class="assistants-management__summary-access-empty">
                {{ t('teacher.assistants.summary.accessEmpty') }}
              </li>
            </ul>
          </div>
          <div class="assistants-management__automation">
            <div class="assistants-management__section-header">
              <h4>{{ t('teacher.assistants.summary.automation.title') }}</h4>
              <span class="assistants-management__section-meta">
                {{ t('teacher.assistants.summary.automation.subtitle') }}
              </span>
            </div>
            <p v-if="!automationView.length" class="assistants-management__phase-empty">
              {{ t('teacher.assistants.summary.automation.empty') }}
            </p>
            <div v-else class="assistants-management__automation-grid">
              <div v-for="entry in automationView" :key="entry.key" class="assistants-management__automation-card">
                <div class="assistants-management__automation-card-header">
                  <UiTag size="sm" class="assistants-management__persona-tag" :color="entry.personaColor">
                    {{ entry.personaLabel }}
                  </UiTag>
                  <span class="assistants-management__automation-template">{{ entry.templateName }}</span>
                </div>
                <p class="assistants-management__automation-sla">
                  {{ t('teacher.assistants.summary.automation.sla', { duration: entry.slaLabel }) }}
                </p>
                <p v-if="entry.reminderLabels.length" class="assistants-management__automation-reminders">
                  {{
                    t('teacher.assistants.summary.automation.reminders', {
                      channels: entry.reminderLabels.join(', ')
                    })
                  }}
                </p>
                <p class="assistants-management__automation-calendar">
                  {{
                    entry.calendarSyncEnabled
                      ? t('teacher.assistants.summary.automation.calendarEnabled')
                      : t('teacher.assistants.summary.automation.calendarDisabled')
                  }}
                </p>
                <ul v-if="entry.checklist.length" class="assistants-management__automation-checklist">
                  <li v-for="item in entry.checklist" :key="item">{{ item }}</li>
                </ul>
                <dl class="assistants-management__automation-stats">
                  <div>
                    <dt>{{ t('teacher.assistants.summary.automation.metrics.active') }}</dt>
                    <dd>{{ formatNumber(entry.activeAssistants) }}</dd>
                  </div>
                  <div>
                    <dt>{{ t('teacher.assistants.summary.automation.metrics.pending') }}</dt>
                    <dd>{{ formatNumber(entry.pendingAssistants) }}</dd>
                  </div>
                  <div>
                    <dt>{{ t('teacher.assistants.summary.automation.metrics.backlog') }}</dt>
                    <dd>{{ formatNumber(entry.backlogTasks) }}</dd>
                  </div>
                  <div>
                    <dt>{{ t('teacher.assistants.summary.automation.metrics.rebalance') }}</dt>
                    <dd>{{ entry.nextRebalanceLabel }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
          <div class="assistants-management__collaboration">
            <div class="assistants-management__section-header">
              <h4>{{ t('teacher.assistants.summary.collaboration.title') }}</h4>
              <span class="assistants-management__section-meta">
                {{ t('teacher.assistants.summary.collaboration.subtitle') }}
              </span>
            </div>
            <p v-if="!collaborationView.length" class="assistants-management__phase-empty">
              {{ t('teacher.assistants.summary.collaboration.empty') }}
            </p>
            <div v-else class="assistants-management__collaboration-grid">
              <div v-for="entry in collaborationView" :key="entry.key" class="assistants-management__collaboration-card">
                <div class="assistants-management__collaboration-card-header">
                  <UiTag size="sm" class="assistants-management__persona-tag" :color="entry.personaColor">
                    {{ entry.personaLabel }}
                  </UiTag>
                  <span class="assistants-management__collaboration-threads">
                    {{ t('teacher.assistants.summary.collaboration.threads', { count: formatNumber(entry.activeThreads) }) }}
                  </span>
                </div>
                <p class="assistants-management__collaboration-mentions">
                  {{
                    t('teacher.assistants.summary.collaboration.mentions', {
                      count: formatNumber(entry.mentionsLastWeek)
                    })
                  }}
                </p>
                <p class="assistants-management__collaboration-audit">
                  {{
                    t('teacher.assistants.summary.collaboration.auditTrail', {
                      count: formatNumber(entry.auditEvents)
                    })
                  }}
                </p>
                <p v-if="entry.presence.length" class="assistants-management__collaboration-presence">
                  {{
                    t('teacher.assistants.summary.collaboration.presence', {
                      names: entry.presence.join(', ')
                    })
                  }}
                </p>
                <p class="assistants-management__collaboration-flags">
                  {{
                    entry.realtimePresenceEnabled
                      ? t('teacher.assistants.summary.collaboration.realtime')
                      : t('teacher.assistants.summary.collaboration.offline')
                  }}
                  ·
                  {{
                    entry.notesEnabled
                      ? t('teacher.assistants.summary.collaboration.notesEnabled')
                      : t('teacher.assistants.summary.collaboration.notesDisabled')
                  }}
                </p>
              </div>
            </div>
          </div>
          <div class="assistants-management__performance">
            <div class="assistants-management__section-header">
              <h4>{{ t('teacher.assistants.summary.performance.title') }}</h4>
              <span class="assistants-management__section-meta">
                {{ t('teacher.assistants.summary.performance.subtitle') }}
              </span>
            </div>
            <p v-if="!performanceView.length" class="assistants-management__phase-empty">
              {{ t('teacher.assistants.summary.performance.empty') }}
            </p>
            <div v-else class="assistants-management__performance-grid">
              <div v-for="entry in performanceView" :key="entry.key" class="assistants-management__performance-card">
                <div class="assistants-management__performance-header">
                  <UiTag size="sm" class="assistants-management__persona-tag" :color="entry.personaColor">
                    {{ entry.personaLabel }}
                  </UiTag>
                  <span class="assistants-management__performance-trend">{{ entry.trendLabel }}</span>
                </div>
                <div class="assistants-management__performance-scores">
                  <div>
                    <span class="assistants-management__performance-score">{{ entry.currentScore.toFixed(1) }}</span>
                    <span class="assistants-management__performance-label">{{ t('teacher.assistants.summary.performance.current') }}</span>
                  </div>
                  <div>
                    <span class="assistants-management__performance-delta">{{ entry.deltaLabel }}</span>
                    <span class="assistants-management__performance-label">{{ t('teacher.assistants.summary.performance.delta') }}</span>
                  </div>
                  <div>
                    <span class="assistants-management__performance-score">{{ entry.baselineScore.toFixed(1) }}</span>
                    <span class="assistants-management__performance-label">{{ t('teacher.assistants.summary.performance.baseline') }}</span>
                  </div>
                </div>
                <dl class="assistants-management__performance-stats">
                  <div>
                    <dt>{{ t('teacher.assistants.summary.performance.completed') }}</dt>
                    <dd>{{ formatNumber(entry.completedTasks) }}</dd>
                  </div>
                  <div>
                    <dt>{{ t('teacher.assistants.summary.performance.overdue') }}</dt>
                    <dd>{{ formatNumber(entry.overdueTasks) }}</dd>
                  </div>
                  <div>
                    <dt>{{ t('teacher.assistants.summary.performance.utilization') }}</dt>
                    <dd>{{ entry.utilizationLabel }}</dd>
                  </div>
                </dl>
                <p
                  class="assistants-management__performance-coaching"
                  :class="{
                    'assistants-management__performance-coaching--recommended': entry.coachingRecommended
                  }"
                >
                  {{
                    entry.coachingRecommended
                      ? t('teacher.assistants.summary.performance.coachingNeeded')
                      : t('teacher.assistants.summary.performance.coachingHealthy')
                  }}
                </p>
              </div>
            </div>
          </div>
        </UiCard>
      </section>

      <div class="assistants-management__filters-bar">
        <UiSelect
          v-model="personaFilter"
          :label="t('teacher.assistants.filters.persona.label')"
          class="assistants-management__filters-select"
        >
          <option v-for="option in personaFilterOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </UiSelect>
        <p class="assistants-management__filters-hint">
          {{ t('teacher.assistants.filters.persona.hint') }}
        </p>
      </div>

      <section id="assistant-roles" ref="assistantRolesSection" class="assistants-management__section">
        <UiCard class="assistants-management__card" hover>
          <template #title>{{ t('teacher.assistants.roles.title') }}</template>
          <template #subtitle>{{ t('teacher.assistants.roles.subtitle') }}</template>
          <template #actions>
            <UiButton color="primary" prepend-icon="PlusOutlined" @click="openRoleDialog()">
              {{ t('teacher.assistants.roles.add') }}
            </UiButton>
          </template>
          <UiAlert
            v-if="store.rolesError"
            class="assistants-management__alert"
            color="danger"
            variant="soft"
          >
            <span>{{ t('teacher.assistants.roles.loadError') }}</span>
            <UiButton variant="link" color="primary" @click="reloadRoles">
              {{ t('common.retry') }}
            </UiButton>
          </UiAlert>
          <UiTable
            :headers="roleHeaders"
            :items="filteredRoleRows"
            :loading="store.rolesLoading"
            density="comfortable"
          >
            <template #item.persona="{ item }">
              <UiTag size="sm" class="assistants-management__persona-tag" :color="item.personaColor">
                {{ item.personaLabel }}
              </UiTag>
            </template>
            <template #item.permissions="{ item }">
              <div class="assistants-management__permissions">
                <UiTag v-for="permission in item.permissions" :key="permission" size="sm" color="secondary">
                  {{ resolvePermissionLabel(permission) }}
                </UiTag>
              </div>
            </template>
            <template #item.appShell="{ item }">
              <div v-if="item.appShellOptions.length" class="assistants-management__app-shell-tags">
                <UiTag v-for="option in item.appShellOptions" :key="option" size="sm" color="primary">
                  {{ option }}
                </UiTag>
              </div>
              <span v-else class="assistants-management__app-shell-empty">
                {{ t('teacher.assistants.roles.appShell.empty') }}
              </span>
            </template>
            <template #item.assistants="{ item }">
              <span>{{ item.assistants }}</span>
            </template>
            <template #item.actions="{ item }">
              <div class="assistants-management__row-actions">
                <UiButton
                  size="sm"
                  variant="link"
                  color="primary"
                  prepend-icon="EditOutlined"
                  @click="openRoleDialog(item.id)"
                >
                  {{ t('common.edit') }}
                </UiButton>
                <UiButton
                  size="sm"
                  variant="link"
                  color="danger"
                  prepend-icon="DeleteOutlined"
                  @click="confirmDeleteRole(item.id)"
                >
                  {{ t('common.delete') }}
                </UiButton>
              </div>
            </template>
            <template #empty>
              <p class="assistants-management__empty">
                {{
                  personaFilter === 'ALL'
                    ? t('teacher.assistants.roles.empty')
                    : t('teacher.assistants.roles.emptyFiltered')
                }}
              </p>
            </template>
          </UiTable>
          <div class="assistants-management__list" role="list">
            <article
              v-for="item in filteredRoleRows"
              :key="item.id"
              class="assistants-management__list-item"
              role="listitem"
            >
              <header class="assistants-management__list-header">
                <h3>{{ item.name }}</h3>
                <UiTag size="sm" class="assistants-management__persona-tag" :color="item.personaColor">
                  {{ item.personaLabel }}
                </UiTag>
              </header>
              <div class="assistants-management__list-field">
                <label>{{ t('teacher.assistants.roles.table.members') }}</label>
                <span>{{ item.assistants }}</span>
              </div>
              <div class="assistants-management__list-field">
                <label>{{ t('teacher.assistants.roles.table.permissions') }}</label>
                <div class="assistants-management__permissions">
                  <UiTag v-for="permission in item.permissions" :key="permission" size="sm" color="secondary">
                    {{ resolvePermissionLabel(permission) }}
                  </UiTag>
                </div>
              </div>
              <div class="assistants-management__list-field">
                <label>{{ t('teacher.assistants.roles.table.appShell') }}</label>
                <div v-if="item.appShellOptions.length" class="assistants-management__app-shell-tags">
                  <UiTag v-for="option in item.appShellOptions" :key="option" size="sm" color="primary">
                    {{ option }}
                  </UiTag>
                </div>
                <span v-else class="assistants-management__app-shell-empty">
                  {{ t('teacher.assistants.roles.appShell.empty') }}
                </span>
              </div>
              <div class="assistants-management__list-actions">
                <UiButton
                  size="sm"
                  variant="link"
                  color="primary"
                  prepend-icon="EditOutlined"
                  @click="openRoleDialog(item.id)"
                >
                  {{ t('common.edit') }}
                </UiButton>
                <UiButton
                  size="sm"
                  variant="link"
                  color="danger"
                  prepend-icon="DeleteOutlined"
                  @click="confirmDeleteRole(item.id)"
                >
                  {{ t('common.delete') }}
                </UiButton>
              </div>
            </article>
          </div>
        </UiCard>
      </section>

      <section id="assistant-team" ref="assistantTeamSection" class="assistants-management__section">
        <UiCard class="assistants-management__card" hover>
          <template #title>{{ t('teacher.assistants.team.title') }}</template>
          <template #subtitle>{{ t('teacher.assistants.team.subtitle') }}</template>
          <template #actions>
            <UiButton color="primary" prepend-icon="UserAddOutlined" @click="openAssistantDialog()">
              {{ t('teacher.assistants.team.add') }}
            </UiButton>
          </template>
          <UiAlert
            v-if="store.assistantsError"
            class="assistants-management__alert"
            color="danger"
            variant="soft"
          >
            <span>{{ t('teacher.assistants.team.loadError') }}</span>
            <UiButton variant="link" color="primary" @click="reloadAssistants">
              {{ t('common.retry') }}
            </UiButton>
          </UiAlert>
          <UiTable
            :headers="assistantHeaders"
            :items="filteredAssistantRows"
            :loading="store.assistantsLoading"
            density="comfortable"
          >
            <template #item.role="{ item }">
              <span>{{ item.role }}</span>
            </template>
            <template #item.status="{ item }">
              <UiTag size="sm" :color="item.statusColor">{{ item.statusLabel }}</UiTag>
            </template>
            <template #item.actions="{ item }">
              <div class="assistants-management__row-actions">
                <UiButton
                  size="sm"
                  variant="link"
                  color="primary"
                  prepend-icon="EditOutlined"
                  @click="openAssistantDialog(item.id)"
                >
                  {{ t('common.edit') }}
                </UiButton>
                <UiButton
                  size="sm"
                  variant="link"
                  color="danger"
                  prepend-icon="DeleteOutlined"
                  @click="confirmDeleteAssistant(item.id)"
                >
                  {{ t('common.delete') }}
                </UiButton>
              </div>
            </template>
            <template #empty>
              <p class="assistants-management__empty">
                {{
                  personaFilter === 'ALL'
                    ? t('teacher.assistants.team.empty')
                    : t('teacher.assistants.team.emptyFiltered')
                }}
              </p>
            </template>
          </UiTable>
          <div class="assistants-management__list" role="list">
            <article
              v-for="item in filteredAssistantRows"
              :key="item.id"
              class="assistants-management__list-item"
              role="listitem"
            >
              <header class="assistants-management__list-header">
                <h3>{{ item.name }}</h3>
                <UiTag size="sm" :color="item.statusColor">{{ item.statusLabel }}</UiTag>
              </header>
              <div class="assistants-management__list-field">
                <label>{{ t('teacher.assistants.team.table.email') }}</label>
                <span>{{ item.email }}</span>
              </div>
              <div class="assistants-management__list-field">
                <label>{{ t('teacher.assistants.team.table.role') }}</label>
                <span>{{ item.role }}</span>
              </div>
              <div class="assistants-management__list-actions">
                <UiButton
                  size="sm"
                  variant="link"
                  color="primary"
                  prepend-icon="EditOutlined"
                  @click="openAssistantDialog(item.id)"
                >
                  {{ t('common.edit') }}
                </UiButton>
                <UiButton
                  size="sm"
                  variant="link"
                  color="danger"
                  prepend-icon="DeleteOutlined"
                  @click="confirmDeleteAssistant(item.id)"
                >
                  {{ t('common.delete') }}
                </UiButton>
              </div>
            </article>
          </div>
        </UiCard>
      </section>
    </div>

    <UiDialog v-model="roleDialog.open" :title="roleDialogTitle" width="520px">
      <form class="assistants-management__form" @submit.prevent="submitRoleDialog">
        <UiInput v-model="roleDialog.form.name" :label="t('teacher.assistants.roles.form.name')" required />
        <UiTextarea
          v-model="roleDialog.form.description"
          :label="t('teacher.assistants.roles.form.description')"
          :rows="3"
        />
        <UiRadioGroup
          v-model="roleDialog.form.persona"
          name="assistant-role-persona"
          :label="t('teacher.assistants.roles.form.persona.label')"
          :hint="t('teacher.assistants.roles.form.persona.hint')"
          :options="personaRadioOptions"
          @change="onPersonaChange"
        />
        <fieldset class="assistants-management__fieldset">
          <legend>{{ t('teacher.assistants.roles.form.permissions') }}</legend>
          <p class="assistants-management__hint">{{ t('teacher.assistants.roles.form.permissionsHint') }}</p>
          <div class="assistants-management__permissions-grid">
            <UiCheckbox
              v-for="option in permissionOptions"
              :key="option.id"
              v-model="roleDialog.form.permissionsMap[option.id]"
              :label="t(option.labelKey)"
              :description="t(option.descriptionKey)"
            />
          </div>
          <div class="assistants-management__app-shell-preview">
            <h4 class="assistants-management__app-shell-heading">
              {{ t('teacher.assistants.roles.appShell.previewTitle') }}
            </h4>
            <p class="assistants-management__hint">
              {{ t('teacher.assistants.roles.appShell.previewDescription') }}
            </p>
            <div v-if="roleDialogAppShellOptions.length" class="assistants-management__app-shell-tags">
              <UiTag v-for="option in roleDialogAppShellOptions" :key="option" size="sm" color="primary">
                {{ option }}
              </UiTag>
            </div>
            <p v-else class="assistants-management__app-shell-empty">
              {{ t('teacher.assistants.roles.appShell.previewEmpty') }}
            </p>
          </div>
        </fieldset>
        <div v-if="roleDialog.error" class="assistants-management__error">{{ roleDialog.error }}</div>
        <div class="assistants-management__dialog-actions">
          <UiButton type="button" variant="ghost" color="neutral" @click="closeRoleDialog">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton type="submit" color="primary" :disabled="roleDialog.submitting">
            <span v-if="roleDialog.submitting" class="loader"></span>
            <span v-else>{{ roleDialog.submitLabel }}</span>
          </UiButton>
        </div>
      </form>
    </UiDialog>

    <UiDialog v-model="assistantDialog.open" :title="assistantDialogTitle" width="520px">
      <form class="assistants-management__form" @submit.prevent="submitAssistantDialog">
        <UiInput v-model="assistantDialog.form.name" :label="t('teacher.assistants.team.form.name')" required />
        <UiInput v-model="assistantDialog.form.email" type="email" :label="t('teacher.assistants.team.form.email')" required />
        <UiInput
          v-model="assistantDialog.form.username"
          :label="t('teacher.assistants.team.form.username')"
          required
          autocomplete="username"
        />
        <UiInput
          v-if="assistantDialog.requirePassword"
          v-model="assistantDialog.form.password"
          type="password"
          :label="t('teacher.assistants.team.form.password')"
          autocomplete="new-password"
          :required="assistantDialog.requirePassword"
        />
        <UiSelect
          v-model="assistantDialog.form.roleId"
          :label="t('teacher.assistants.team.form.role')"
          :placeholder="t('teacher.assistants.team.form.rolePlaceholder')"
          clearable
        >
          <option v-for="role in store.roles" :key="role.id" :value="role.id">{{ role.name }}</option>
        </UiSelect>
        <div v-if="assistantDialog.error" class="assistants-management__error">{{ assistantDialog.error }}</div>
        <div class="assistants-management__dialog-actions">
          <UiButton type="button" variant="ghost" color="neutral" @click="closeAssistantDialog">
            {{ t('common.cancel') }}
          </UiButton>
          <UiButton type="submit" color="primary" :disabled="assistantDialog.submitting">
            <span v-if="assistantDialog.submitting" class="loader"></span>
            <span v-else>{{ assistantDialog.submitLabel }}</span>
          </UiButton>
        </div>
      </form>
    </UiDialog>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiTable, { type UiTableHeader } from '@/components/ui/UiTable.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiRadioGroup from '@/components/ui/UiRadioGroup.vue';
import { useTeacherAssistantsStore, ASSISTANT_PERMISSION_OPTIONS } from '@/stores/teacherAssistants';
import type { AssistantRolePayload, AssistantPayload } from '@/services/teacherAssistants';
import { useToast } from '@/composables/useToast';
import { useFeaturesStore } from '@/stores/features';
import { FEATURE, type FeatureCode } from '@/constants/featureCatalog';
import { formatDateTime, formatRelativeTimeToNow } from '@/utils/formatters';

interface AssistantAppShellOptionConfig {
  id: string;
  labelKey: string;
  permissions?: string[];
  features?: FeatureCode[];
}

const ASSISTANT_APP_SHELL_OPTION_CONFIG: AssistantAppShellOptionConfig[] = [
  { id: 'courses', labelKey: 'courses.title', permissions: ['courses.manage'] },
  {
    id: 'students',
    labelKey: 'nav.teacherStudents',
    permissions: ['students.view'],
    features: [FEATURE.teacherRosterGroups]
  },
  { id: 'liveSessions', labelKey: 'nav.teacherLiveSessions', features: [FEATURE.liveSessionsCore] },
  { id: 'liveModeration', labelKey: 'nav.teacherLiveModeration', features: [FEATURE.liveSessionsChat] },
  { id: 'livePolls', labelKey: 'nav.teacherLivePolls', features: [FEATURE.liveSessionsPolls] },
  { id: 'tutoring', labelKey: 'nav.teacherTutoring', permissions: ['tutoring.manage'] },
  {
    id: 'assessments',
    labelKey: 'nav.teacherAssessments',
    permissions: ['assessments.manage']
  },
  {
    id: 'questionBanks',
    labelKey: 'nav.teacherQuestionBanks',
    permissions: ['assessments.manage']
  },
  {
    id: 'enrollments',
    labelKey: 'nav.teacherEnrollments',
    permissions: ['registrations.manage']
  },
  {
    id: 'registrations',
    labelKey: 'nav.teacherRegistrations',
    permissions: ['registrations.manage'],
    features: [FEATURE.teacherRegsPayments]
  },
  {
    id: 'payments',
    labelKey: 'nav.teacherPayments',
    permissions: ['registrations.manage'],
    features: [FEATURE.teacherRegsPayments]
  },
  {
    id: 'reports',
    labelKey: 'nav.teacherReports',
    permissions: ['reports.view'],
    features: [FEATURE.reportsTeacher]
  },
  { id: 'offers', labelKey: 'nav.teacherOffers', features: [FEATURE.offers] },
  { id: 'englishLab', labelKey: 'nav.teacherEnglishLab', features: [FEATURE.englishLab] },
  {
    id: 'badges',
    labelKey: 'nav.teacherBadges',
    permissions: ['courses.manage'],
    features: [FEATURE.badges]
  },
  {
    id: 'notifications',
    labelKey: 'nav.teacherNotifications',
    permissions: ['communications.manage'],
    features: [FEATURE.notificationsUnified]
  }
];

const MIN_PASSWORD_LENGTH = 8;

const { t } = useI18n();
const route = useRoute();
const store = useTeacherAssistantsStore();
const featuresStore = useFeaturesStore();
const { success: showSuccessToast, error: showErrorToast } = useToast();

const assistantOverviewSection = ref<HTMLElement | null>(null);
const assistantRolesSection = ref<HTMLElement | null>(null);
const assistantTeamSection = ref<HTMLElement | null>(null);

let highlightTimer: ReturnType<typeof setTimeout> | null = null;

const highlightSection = (section: HTMLElement | null, shouldScroll = true) => {
  if (!section) {
    return;
  }

  if (shouldScroll) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  section.classList.add('assistants-management__section--highlight');

  if (highlightTimer) {
    if (typeof window !== 'undefined') {
      window.clearTimeout(highlightTimer);
    } else {
      clearTimeout(highlightTimer);
    }
  }

  const clearHighlight = () => {
    section.classList.remove('assistants-management__section--highlight');
    highlightTimer = null;
  };

  if (typeof window !== 'undefined') {
    highlightTimer = window.setTimeout(clearHighlight, 1600);
  } else {
    highlightTimer = setTimeout(clearHighlight, 1600);
  }
};

const scrollToHash = (hash: string | undefined | null) => {
  if (!hash) {
    return;
  }

  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;

  if (normalized === 'assistant-overview') {
    highlightSection(assistantOverviewSection.value);
  } else if (normalized === 'assistant-roles') {
    highlightSection(assistantRolesSection.value);
  } else if (normalized === 'assistant-team') {
    highlightSection(assistantTeamSection.value);
  }
};

const reloadRoles = () => {
  void store.loadRoles(true);
};

const reloadAssistants = () => {
  void store.loadAssistants(true);
};

const permissionOptions = ASSISTANT_PERMISSION_OPTIONS;

type AssistantPersonaOptionValue = 'TEACHING_ASSISTANT' | 'SECRETARY' | 'CONTENT_CREATOR' | 'CUSTOM';
type AssistantPersonaTagColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';
type PersonaFilterValue = AssistantPersonaOptionValue | 'ALL' | 'UNASSIGNED';

interface AssistantPersonaOption {
  value: AssistantPersonaOptionValue;
  labelKey: string;
  descriptionKey: string;
  defaultPermissions: string[];
  tagColor: AssistantPersonaTagColor;
}

const ASSISTANT_PERSONA_OPTIONS: AssistantPersonaOption[] = [
  {
    value: 'TEACHING_ASSISTANT',
    labelKey: 'teacher.assistants.roles.persona.teachingAssistant.label',
    descriptionKey: 'teacher.assistants.roles.persona.teachingAssistant.description',
    defaultPermissions: ['courses.manage', 'assessments.manage', 'students.view', 'reports.view'],
    tagColor: 'primary'
  },
  {
    value: 'SECRETARY',
    labelKey: 'teacher.assistants.roles.persona.secretary.label',
    descriptionKey: 'teacher.assistants.roles.persona.secretary.description',
    defaultPermissions: ['registrations.manage', 'communications.manage', 'students.view'],
    tagColor: 'info'
  },
  {
    value: 'CONTENT_CREATOR',
    labelKey: 'teacher.assistants.roles.persona.contentCreator.label',
    descriptionKey: 'teacher.assistants.roles.persona.contentCreator.description',
    defaultPermissions: ['courses.manage', 'communications.manage'],
    tagColor: 'success'
  },
  {
    value: 'CUSTOM',
    labelKey: 'teacher.assistants.roles.persona.custom.label',
    descriptionKey: 'teacher.assistants.roles.persona.custom.description',
    defaultPermissions: [],
    tagColor: 'neutral'
  }
];

const personaOptionLookup = new Map(
  ASSISTANT_PERSONA_OPTIONS.map((option) => [option.value, option])
);

const DEFAULT_PERSONA_VALUE: AssistantPersonaOptionValue = 'TEACHING_ASSISTANT';

const isAssistantPersonaOptionValue = (value: unknown): value is AssistantPersonaOptionValue =>
  typeof value === 'string' && personaOptionLookup.has(value as AssistantPersonaOptionValue);

const toPersonaOptionValue = (persona: string | null | undefined): AssistantPersonaOptionValue => {
  if (!persona) {
    return 'CUSTOM';
  }
  const normalized = persona.toUpperCase();
  return isAssistantPersonaOptionValue(normalized) ? (normalized as AssistantPersonaOptionValue) : 'CUSTOM';
};

const resolvePersonaOption = (persona: string | null | undefined): AssistantPersonaOption => {
  const value = toPersonaOptionValue(persona);
  return personaOptionLookup.get(value) ?? personaOptionLookup.get('CUSTOM')!;
};

const resolvePersonaLabel = (persona: string | null | undefined) => {
  const option = resolvePersonaOption(persona);
  return t(option.labelKey);
};

const resolvePersonaColor = (persona: string | null | undefined): AssistantPersonaTagColor => {
  return resolvePersonaOption(persona).tagColor;
};

const personaRadioOptions = computed(() =>
  ASSISTANT_PERSONA_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
    description: t(option.descriptionKey)
  }))
);

const personaFilter = ref<PersonaFilterValue>('ALL');

const personaFilterOptions = computed(() => {
  const baseOptions = ASSISTANT_PERSONA_OPTIONS.map((option) => ({
    value: option.value as PersonaFilterValue,
    label: t(option.labelKey)
  }));
  return [
    { value: 'ALL' as PersonaFilterValue, label: t('teacher.assistants.filters.persona.all') },
    ...baseOptions,
    { value: 'UNASSIGNED' as PersonaFilterValue, label: t('teacher.assistants.filters.persona.unassigned') }
  ];
});

const roleHeaders = computed<UiTableHeader[]>(() => [
  { key: 'name', label: t('teacher.assistants.roles.table.name') },
  { key: 'persona', label: t('teacher.assistants.roles.table.persona') },
  { key: 'permissions', label: t('teacher.assistants.roles.table.permissions') },
  { key: 'appShell', label: t('teacher.assistants.roles.table.appShell') },
  { key: 'assistants', label: t('teacher.assistants.roles.table.members'), align: 'center' },
  { key: 'actions', label: t('teacher.assistants.roles.table.actions'), align: 'right' }
]);

const assistantHeaders = computed<UiTableHeader[]>(() => [
  { key: 'name', label: t('teacher.assistants.team.table.name') },
  { key: 'email', label: t('teacher.assistants.team.table.email') },
  { key: 'role', label: t('teacher.assistants.team.table.role') },
  { key: 'status', label: t('teacher.assistants.team.table.status'), align: 'center' },
  { key: 'actions', label: t('teacher.assistants.team.table.actions'), align: 'right' }
]);

const assistantsByRole = computed<Record<number, number>>(() => {
  return store.assistants.reduce<Record<number, number>>((acc, assistant) => {
    if (assistant.roleId != null) {
      acc[assistant.roleId] = (acc[assistant.roleId] || 0) + 1;
    }
    return acc;
  }, {});
});

const summaryRefreshing = ref(false);

const summarySnapshot = computed(() => store.assistantsSummary);

const summaryCards = computed(() => {
  const summary = summarySnapshot.value;
  const awaitingAccess =
    summary.pendingAssistants + summary.inactiveAssistants + summary.disabledAssistants;

  return [
    {
      key: 'total',
      value: summary.totalAssistants,
      label: t('teacher.assistants.summary.totalAssistants.label'),
      description: t('teacher.assistants.summary.totalAssistants.description', {
        count: summary.totalAssistants
      })
    },
    {
      key: 'active',
      value: summary.activeAssistants,
      label: t('teacher.assistants.summary.activeAssistants.label'),
      description: t('teacher.assistants.summary.activeAssistants.description', {
        count: summary.activeAssistants
      })
    },
    {
      key: 'awaiting',
      value: awaitingAccess,
      label: t('teacher.assistants.summary.awaitingAssistants.label'),
      description: t('teacher.assistants.summary.awaitingAssistants.description', {
        count: awaitingAccess
      })
    },
    {
      key: 'unassigned',
      value: summary.unassignedAssistants,
      label: t('teacher.assistants.summary.unassignedAssistants.label'),
      description: t('teacher.assistants.summary.unassignedAssistants.description', {
        count: summary.unassignedAssistants
      })
    }
  ];
});

const summaryLastUpdated = computed(() => {
  const { lastUpdatedAt } = summarySnapshot.value;
  if (!lastUpdatedAt) {
    return t('teacher.assistants.summary.neverUpdated');
  }

  return t('teacher.assistants.summary.lastUpdated', {
    relative: formatRelativeTimeToNow(lastUpdatedAt),
    date: formatDateTime(lastUpdatedAt)
  });
});

const personaInsights = computed(() => store.personaInsights);

const personaDistribution = computed(() =>
  personaInsights.value
    .map((insight) => {
      const assistantCount = Number(insight.assistantCount ?? 0);
      const roleCount = Number(insight.roleCount ?? 0);
      const persona = insight.persona ?? null;
      return {
        key: persona ?? 'CUSTOM',
        personaValue: toPersonaOptionValue(persona),
        label: resolvePersonaLabel(persona),
        color: resolvePersonaColor(persona),
        assistantCount,
        roleCount
      };
    })
    .sort((a, b) => {
      if (b.assistantCount !== a.assistantCount) {
        return b.assistantCount - a.assistantCount;
      }
      if (b.roleCount !== a.roleCount) {
        return b.roleCount - a.roleCount;
      }
      return a.label.localeCompare(b.label);
    })
);

const hasPersonaDistributionData = computed(() =>
  personaDistribution.value.some((entry) => entry.assistantCount > 0 || entry.roleCount > 0)
);

const coverageInsights = computed(() => store.coverageInsights);

const normalizeCoverageArea = (area: string | null | undefined) => {
  if (!area || typeof area !== 'string') {
    return 'content';
  }
  const normalized = area.toLowerCase();
  return normalized;
};

const coverageView = computed(() =>
  coverageInsights.value
    .map((insight) => {
      const areaKey = normalizeCoverageArea(insight.area);
      const assistantCount = Number(insight.assistantCount ?? 0);
      const roleCount = Number(insight.roleCount ?? 0);
      let statusKey: 'covered' | 'rolesOnly' | 'uncovered';
      let tagColor: AssistantPersonaTagColor;
      if (assistantCount > 0) {
        statusKey = 'covered';
        tagColor = 'success';
      } else if (roleCount > 0) {
        statusKey = 'rolesOnly';
        tagColor = 'warning';
      } else {
        statusKey = 'uncovered';
        tagColor = 'danger';
      }
      const areaLabel = t(`teacher.assistants.summary.coverage.areas.${areaKey}`);
      const warning = assistantCount > 0
        ? ''
        : roleCount > 0
          ? t('teacher.assistants.summary.coverage.warningNoAssistant', { area: areaLabel })
          : t('teacher.assistants.summary.coverage.warningNoRole', { area: areaLabel });
      return {
        key: areaKey,
        areaLabel,
        assistantCount,
        roleCount,
        statusKey,
        statusLabel: t(`teacher.assistants.summary.coverage.status.${statusKey}`),
        tagColor,
        warning
      };
    })
    .sort((a, b) => a.areaLabel.localeCompare(b.areaLabel))
);

const coverageWarnings = computed(() => coverageView.value.filter((entry) => entry.warning));

const coverageComplete = computed(
  () => coverageView.value.length > 0 && coverageWarnings.value.length === 0
);

const coverageLoading = computed(() => store.insightsLoading && !store.insightsLoadedAt);

const coverageError = computed(() => store.insightsError);

const coverageHasData = computed(() => coverageView.value.length > 0);

const coverageSuccessMessage = computed(() =>
  coverageComplete.value ? t('teacher.assistants.summary.coverage.complete') : ''
);

const automationInsights = computed(() => store.automationInsights);

const reminderChannelLabel = (channel: string) => {
  if (!channel) {
    return '';
  }
  const normalized = channel.toLowerCase();
  const key = `teacher.assistants.summary.automation.channels.${normalized}`;
  const translated = t(key);
  return translated === key ? channel : translated;
};

const formatDurationFromMinutes = (minutes: number) => {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return t('teacher.assistants.summary.automation.durationImmediate');
  }
  const wholeMinutes = Math.round(minutes);
  const hours = Math.floor(wholeMinutes / 60);
  const remaining = wholeMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(t('teacher.assistants.summary.automation.hours', { count: hours }));
  }
  if (remaining > 0) {
    parts.push(t('teacher.assistants.summary.automation.minutes', { count: remaining }));
  }
  return parts.join(' ');
};

const automationView = computed(() =>
  automationInsights.value.map((entry) => {
    const reminders = Array.isArray(entry.reminderChannels) ? entry.reminderChannels : [];
    const checklist = Array.isArray(entry.checklist) ? entry.checklist.filter(Boolean) : [];
    const persona = entry.persona ?? null;
    return {
      key: persona ?? 'CUSTOM',
      persona,
      personaLabel: resolvePersonaLabel(persona),
      personaColor: resolvePersonaColor(persona),
      templateName: entry.templateName,
      checklist,
      slaMinutes: Number(entry.slaMinutes ?? 0),
      slaLabel: formatDurationFromMinutes(Number(entry.slaMinutes ?? 0)),
      reminderLabels: reminders.map((channel) => reminderChannelLabel(channel)).filter(Boolean),
      calendarSyncEnabled: Boolean(entry.calendarSyncEnabled),
      activeAssistants: Number(entry.activeAssistants ?? 0),
      pendingAssistants: Number(entry.pendingAssistants ?? 0),
      backlogTasks: Number(entry.backlogTasks ?? 0),
      nextRebalanceLabel: formatDurationFromMinutes(Number(entry.nextRebalanceMinutes ?? 0))
    };
  })
);

const collaborationInsights = computed(() => store.collaborationInsights);

const collaborationView = computed(() =>
  collaborationInsights.value.map((entry) => {
    const persona = entry.persona ?? null;
    const presence = Array.isArray(entry.presence) ? entry.presence.filter(Boolean) : [];
    return {
      key: persona ?? 'CUSTOM',
      persona,
      personaLabel: resolvePersonaLabel(persona),
      personaColor: resolvePersonaColor(persona),
      activeThreads: Number(entry.activeThreads ?? 0),
      mentionsLastWeek: Number(entry.mentionsLastWeek ?? 0),
      auditEvents: Number(entry.auditEvents ?? 0),
      presence,
      realtimePresenceEnabled: Boolean(entry.realtimePresenceEnabled),
      notesEnabled: Boolean(entry.notesEnabled)
    };
  })
);

const performanceInsights = computed(() => store.performanceInsights);

const performanceTrendLabel = (trend: string) => {
  const normalized = (trend || 'FLAT').toLowerCase();
  const key = `teacher.assistants.summary.performance.trend.${normalized}`;
  const translated = t(key);
  return translated === key ? trend : translated;
};

const formatPercentage = (value: number, options?: Intl.NumberFormatOptions) => {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0
  });
  return formatter.format(value);
};

const formatDeltaPercentage = (value: number) => {
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'always'
  });
  return formatter.format(value / 100);
};

const performanceView = computed(() =>
  performanceInsights.value.map((entry) => {
    const persona = entry.persona ?? null;
    const trend = entry.trend ?? 'FLAT';
    const utilization = Number(entry.utilization ?? 0);
    return {
      key: persona ?? 'CUSTOM',
      persona,
      personaLabel: resolvePersonaLabel(persona),
      personaColor: resolvePersonaColor(persona),
      baselineScore: Number(entry.baselineScore ?? 0),
      currentScore: Number(entry.currentScore ?? 0),
      deltaPercentage: Number(entry.deltaPercentage ?? 0),
      deltaLabel: formatDeltaPercentage(Number(entry.deltaPercentage ?? 0)),
      trend,
      trendLabel: performanceTrendLabel(trend),
      coachingRecommended: Boolean(entry.coachingRecommended),
      completedTasks: Number(entry.completedTasks ?? 0),
      overdueTasks: Number(entry.overdueTasks ?? 0),
      utilization,
      utilizationLabel: formatPercentage(utilization, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    };
  })
);

const activeAssistantAppShellOptions = computed(() =>
  ASSISTANT_APP_SHELL_OPTION_CONFIG.filter((option) => {
    if (!option.features?.length) {
      return true;
    }
    return option.features.every((code) => featuresStore.hasFeature(code));
  })
);

const resolveAppShellOptionLabels = (permissions: readonly string[] | undefined | null) => {
  const permissionSet = new Set(permissions ?? []);
  return activeAssistantAppShellOptions.value
    .filter((option) => {
      if (!option.permissions?.length) {
        return true;
      }
      return option.permissions.every((permission) => permissionSet.has(permission));
    })
    .map((option) => t(option.labelKey));
};

const resolvePermissionLabel = (id: string) => {
  const option = permissionOptions.find((item) => item.id === id);
  return option ? t(option.labelKey) : id;
};

const roleRows = computed(() =>
  store.roles.map((role) => ({
    id: role.id,
    name: role.name,
    personaValue: toPersonaOptionValue(role.persona ?? null),
    personaLabel: resolvePersonaLabel(role.persona ?? null),
    personaColor: resolvePersonaColor(role.persona ?? null),
    permissions: role.permissions || [],
    appShellOptions: resolveAppShellOptionLabels(role.permissions),
    assistants: assistantsByRole.value[role.id] || 0
  }))
);

const matchesPersonaFilter = (
  candidate: AssistantPersonaOptionValue | 'UNASSIGNED',
  filter: PersonaFilterValue
) => {
  if (filter === 'ALL') {
    return true;
  }
  if (filter === 'UNASSIGNED') {
    return candidate === 'UNASSIGNED';
  }
  return candidate === filter;
};

const filteredRoleRows = computed(() => {
  const filter = personaFilter.value;
  if (filter === 'UNASSIGNED') {
    return [];
  }
  if (filter === 'ALL') {
    return roleRows.value;
  }
  return roleRows.value.filter((row) => matchesPersonaFilter(row.personaValue, filter));
});

const roleDialogSelectedPermissions = computed(() =>
  Object.entries(roleDialog.form.permissionsMap)
    .filter(([, enabled]) => enabled)
    .map(([id]) => id)
);

const roleDialogAppShellOptions = computed(() =>
  resolveAppShellOptionLabels(roleDialogSelectedPermissions.value)
);

const roleAccessList = computed(() =>
  store.roleUsage
    .map((entry) => ({
      ...entry,
      personaLabel: resolvePersonaLabel(entry.persona),
      personaColor: resolvePersonaColor(entry.persona),
      appShellOptions: resolveAppShellOptionLabels(entry.permissions)
    }))
    .sort((a, b) => {
      if (b.assistantCount !== a.assistantCount) {
        return b.assistantCount - a.assistantCount;
      }
      return a.name.localeCompare(b.name);
    })
);

const assistantRows = computed(() =>
  store.assistants.map((assistant) => {
    const role = assistant.role ?? (assistant.roleId != null ? store.roleById(assistant.roleId) : null);
    const rawStatus = (assistant.status || 'active').toLowerCase();
    const statusKey = `teacher.assistants.team.status.${rawStatus}`;
    const statusLabel = t(statusKey);
    let statusColor: 'success' | 'warning' | 'danger' | 'info' = 'success';
    if (rawStatus === 'inactive') {
      statusColor = 'warning';
    } else if (rawStatus === 'disabled') {
      statusColor = 'danger';
    } else if (rawStatus === 'pending') {
      statusColor = 'info';
    }
    const personaValue: AssistantPersonaOptionValue | 'UNASSIGNED' = role
      ? toPersonaOptionValue(role.persona ?? null)
      : 'UNASSIGNED';
    return {
      id: assistant.id,
      name: assistant.name,
      email: assistant.email,
      role: role?.name || t('teacher.assistants.team.roleUnassigned'),
      statusLabel,
      statusColor,
      personaValue
    };
  })
);

const filteredAssistantRows = computed(() => {
  const filter = personaFilter.value;
  if (filter === 'ALL') {
    return assistantRows.value;
  }
  return assistantRows.value.filter((row) => matchesPersonaFilter(row.personaValue, filter));
});

const roleDialog = reactive({
  open: false,
  submitting: false,
  editingId: null as number | null,
  error: '',
  form: {
    name: '',
    description: '',
    persona: DEFAULT_PERSONA_VALUE as AssistantPersonaOptionValue,
    permissionsMap: {} as Record<string, boolean>
  },
  get submitLabel() {
    return roleDialog.editingId ? t('teacher.assistants.roles.form.update') : t('teacher.assistants.roles.form.create');
  }
});

const applyPersonaTemplate = (value: AssistantPersonaOptionValue) => {
  const option = personaOptionLookup.get(value);
  if (!option || option.defaultPermissions.length === 0) {
    return;
  }
  const selected = new Set(option.defaultPermissions);
  roleDialog.form.permissionsMap = permissionOptions.reduce<Record<string, boolean>>((acc, optionItem) => {
    acc[optionItem.id] = selected.has(optionItem.id);
    return acc;
  }, {});
};

const setRoleDialogPersona = (value: AssistantPersonaOptionValue, applyTemplate = false) => {
  roleDialog.form.persona = value;
  if (applyTemplate) {
    applyPersonaTemplate(value);
  }
};

const onPersonaChange = (value: string | number | boolean) => {
  if (isAssistantPersonaOptionValue(value)) {
    setRoleDialogPersona(value, true);
  }
};

const assistantDialog = reactive({
  open: false,
  submitting: false,
  editingId: null as number | null,
  error: '',
  form: {
    name: '',
    email: '',
    username: '',
    password: '',
    roleId: null as number | null
  },
  get requirePassword() {
    return assistantDialog.editingId === null;
  },
  get submitLabel() {
    return assistantDialog.editingId ? t('teacher.assistants.team.form.update') : t('teacher.assistants.team.form.create');
  }
});

const resetRoleDialog = () => {
  roleDialog.form.name = '';
  roleDialog.form.description = '';
  roleDialog.form.permissionsMap = permissionOptions.reduce<Record<string, boolean>>((acc, option) => {
    acc[option.id] = false;
    return acc;
  }, {});
  setRoleDialogPersona(DEFAULT_PERSONA_VALUE, true);
  roleDialog.error = '';
  roleDialog.submitting = false;
  roleDialog.editingId = null;
};

const resetAssistantDialog = () => {
  assistantDialog.form.name = '';
  assistantDialog.form.email = '';
  assistantDialog.form.username = '';
  assistantDialog.form.password = '';
  assistantDialog.form.roleId = null;
  assistantDialog.error = '';
  assistantDialog.submitting = false;
  assistantDialog.editingId = null;
};

const roleDialogTitle = computed(() =>
  roleDialog.editingId ? t('teacher.assistants.roles.dialog.editTitle') : t('teacher.assistants.roles.dialog.createTitle')
);

const assistantDialogTitle = computed(() =>
  assistantDialog.editingId
    ? t('teacher.assistants.team.dialog.editTitle')
    : t('teacher.assistants.team.dialog.createTitle')
);

const openRoleDialog = (roleId?: number) => {
  resetRoleDialog();
  if (roleId != null) {
    const role = store.roles.find((item) => item.id === roleId);
    if (role) {
      roleDialog.form.name = role.name;
      roleDialog.form.description = role.description || '';
      roleDialog.form.permissionsMap = permissionOptions.reduce<Record<string, boolean>>((acc, option) => {
        acc[option.id] = role.permissions?.includes(option.id) ?? false;
        return acc;
      }, {});
      setRoleDialogPersona(toPersonaOptionValue(role.persona ?? null), false);
      roleDialog.editingId = role.id;
    }
  }
  roleDialog.open = true;
};

const closeRoleDialog = () => {
  roleDialog.open = false;
};

const submitRoleDialog = async () => {
  roleDialog.submitting = true;
  roleDialog.error = '';
  const isEditing = roleDialog.editingId != null;
  const permissions = Object.entries(roleDialog.form.permissionsMap)
    .filter(([, enabled]) => enabled)
    .map(([id]) => id);

  const personaValue = roleDialog.form.persona;
  const payload: AssistantRolePayload = {
    name: roleDialog.form.name.trim(),
    persona: personaValue === 'CUSTOM' ? null : personaValue,
    description: roleDialog.form.description.trim() || null,
    permissions
  };

  try {
    if (!payload.name) {
      roleDialog.error = t('teacher.assistants.roles.form.nameRequired');
      return;
    }
    const savedRole = isEditing
      ? await store.updateRole(roleDialog.editingId!, payload)
      : await store.createRole(payload);
    closeRoleDialog();
    highlightSection(assistantRolesSection.value, false);
    showSuccessToast({
      detail: t(
        isEditing ? 'teacher.assistants.roles.toast.updated' : 'teacher.assistants.roles.toast.created',
        { name: savedRole.name }
      )
    });
  } catch (error) {
    console.error('[assistants] failed to save role', error);
    roleDialog.error = t('teacher.assistants.roles.form.saveError');
    showErrorToast({ detail: roleDialog.error });
  } finally {
    roleDialog.submitting = false;
  }
};

const openAssistantDialog = (assistantId?: number) => {
  resetAssistantDialog();
  if (assistantId != null) {
    const assistant = store.assistants.find((item) => item.id === assistantId);
    if (assistant) {
      assistantDialog.form.name = assistant.name;
      assistantDialog.form.email = assistant.email;
      assistantDialog.form.username = assistant.username;
      assistantDialog.form.roleId = assistant.roleId ?? null;
      assistantDialog.editingId = assistant.id;
    }
  }
  assistantDialog.open = true;
};

const closeAssistantDialog = () => {
  assistantDialog.open = false;
};

const refreshOverview = async () => {
  if (summaryRefreshing.value) {
    return;
  }
  summaryRefreshing.value = true;
  try {
    await store.refreshAll();
    highlightSection(assistantOverviewSection.value, false);
    showSuccessToast({ detail: t('teacher.assistants.summary.refreshSuccess') });
  } catch (error) {
    console.error('[assistants] failed to refresh overview', error);
    showErrorToast({ detail: t('teacher.assistants.summary.refreshError') });
  } finally {
    summaryRefreshing.value = false;
  }
};

const submitAssistantDialog = async () => {
  assistantDialog.submitting = true;
  assistantDialog.error = '';
  const isEditing = assistantDialog.editingId != null;

  const payload: AssistantPayload = {
    name: assistantDialog.form.name.trim(),
    email: assistantDialog.form.email.trim(),
    username: assistantDialog.form.username.trim(),
    roleId: assistantDialog.form.roleId ?? null
  };

  if (assistantDialog.requirePassword) {
    const passwordValue = assistantDialog.form.password.trim();
    if (!passwordValue) {
      assistantDialog.error = t('teacher.assistants.team.form.passwordRequired');
      assistantDialog.submitting = false;
      return;
    }
    if (passwordValue.length < MIN_PASSWORD_LENGTH) {
      assistantDialog.error = t('auth.passwordMinLength', { count: MIN_PASSWORD_LENGTH });
      assistantDialog.submitting = false;
      return;
    }
    payload.password = passwordValue;
  } else {
    const passwordValue = assistantDialog.form.password.trim();
    if (passwordValue) {
      if (passwordValue.length < MIN_PASSWORD_LENGTH) {
        assistantDialog.error = t('auth.passwordMinLength', { count: MIN_PASSWORD_LENGTH });
        assistantDialog.submitting = false;
        return;
      }
      payload.password = passwordValue;
    }
  }

  try {
    if (!payload.name || !payload.email || !payload.username) {
      assistantDialog.error = t('teacher.assistants.team.form.requiredError');
      return;
    }
    const savedAssistant = isEditing
      ? await store.updateAssistant(assistantDialog.editingId!, payload)
      : await store.createAssistant(payload);
    closeAssistantDialog();
    highlightSection(assistantTeamSection.value, false);
    showSuccessToast({
      detail: t(
        isEditing ? 'teacher.assistants.team.toast.updated' : 'teacher.assistants.team.toast.created',
        { name: savedAssistant.name }
      )
    });
  } catch (error) {
    console.error('[assistants] failed to save assistant', error);
    assistantDialog.error = t('teacher.assistants.team.form.saveError');
    showErrorToast({ detail: assistantDialog.error });
  } finally {
    assistantDialog.submitting = false;
  }
};

const confirmDeleteRole = async (roleId: number) => {
  const role = store.roles.find((item) => item.id === roleId);
  if (!role) {
    return;
  }
  const confirmed = window.confirm(t('teacher.assistants.roles.deleteConfirm', { name: role.name }));
  if (!confirmed) {
    return;
  }
  try {
    await store.deleteRole(roleId);
    highlightSection(assistantRolesSection.value, false);
    showSuccessToast({ detail: t('teacher.assistants.roles.toast.deleted', { name: role.name }) });
  } catch (error) {
    console.error('[assistants] failed to delete role', error);
    showErrorToast({ detail: t('teacher.assistants.roles.form.saveError') });
  }
};

const confirmDeleteAssistant = async (assistantId: number) => {
  const assistant = store.assistants.find((item) => item.id === assistantId);
  if (!assistant) {
    return;
  }
  const confirmed = window.confirm(t('teacher.assistants.team.deleteConfirm', { name: assistant.name }));
  if (!confirmed) {
    return;
  }
  try {
    await store.deleteAssistant(assistantId);
    highlightSection(assistantTeamSection.value, false);
    showSuccessToast({ detail: t('teacher.assistants.team.toast.deleted', { name: assistant.name }) });
  } catch (error) {
    console.error('[assistants] failed to delete assistant', error);
    showErrorToast({ detail: t('teacher.assistants.team.form.saveError') });
  }
};

watch(
  () => route.hash,
  (hash, previousHash) => {
    if (hash && hash !== previousHash) {
      nextTick(() => scrollToHash(hash));
    }
  }
);

onMounted(() => {
  void store.loadRoles();
  void store.loadAssistants();
  void store.loadInsights();
  if (route.hash) {
    nextTick(() => scrollToHash(route.hash));
  }
});

onBeforeUnmount(() => {
  if (highlightTimer) {
    if (typeof window !== 'undefined') {
      window.clearTimeout(highlightTimer);
    } else {
      clearTimeout(highlightTimer);
    }
    highlightTimer = null;
  }
  assistantOverviewSection.value?.classList.remove('assistants-management__section--highlight');
  assistantRolesSection.value?.classList.remove('assistants-management__section--highlight');
  assistantTeamSection.value?.classList.remove('assistants-management__section--highlight');
});

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);
</script>

<style scoped>
.assistants-management {
  display: grid;
  gap: var(--sakai-space-6);
}

.assistants-management__section {
  scroll-margin-top: calc(var(--sakai-space-10) + 64px);
}

.assistants-management__section--highlight .assistants-management__card {
  box-shadow: var(--sakai-shadow-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-primary) 25%, transparent);
}

.assistants-management__overview {
  gap: var(--sakai-space-5);
}

.assistants-management__summary-meta {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.assistants-management__summary-grid {
  display: grid;
  gap: var(--sakai-space-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.assistants-management__persona-distribution,
.assistants-management__coverage {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.assistants-management__persona-distribution-header,
.assistants-management__coverage-header {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.assistants-management__persona-distribution-header h4,
.assistants-management__coverage-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.assistants-management__persona-distribution-meta,
.assistants-management__coverage-meta {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.assistants-management__persona-grid {
  display: grid;
  gap: var(--sakai-space-3);
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.assistants-management__persona-card {
  padding: var(--sakai-space-3);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  border-radius: var(--sakai-border-radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
  background-color: color-mix(in srgb, var(--sakai-surface-color) 80%, transparent);
}

.assistants-management__persona-card-header {
  display: flex;
}

.assistants-management__persona-count {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.assistants-management__persona-distribution-empty,
.assistants-management__coverage-empty,
.assistants-management__coverage-loading {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
}

.assistants-management__coverage-grid {
  display: grid;
  gap: var(--sakai-space-3);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.assistants-management__coverage-item {
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: var(--sakai-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.assistants-management__coverage-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
}

.assistants-management__coverage-area {
  font-weight: var(--sakai-font-weight-semibold);
}

.assistants-management__coverage-support {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.assistants-management__section-header {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.assistants-management__section-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.assistants-management__section-meta {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.assistants-management__phase-empty {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
}

.assistants-management__automation-grid,
.assistants-management__collaboration-grid,
.assistants-management__performance-grid {
  display: grid;
  gap: var(--sakai-space-3);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.assistants-management__automation-card,
.assistants-management__collaboration-card,
.assistants-management__performance-card {
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 65%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: var(--sakai-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
  background-color: color-mix(in srgb, var(--sakai-surface-color) 70%, transparent);
}

.assistants-management__automation-card-header,
.assistants-management__collaboration-card-header,
.assistants-management__performance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
}

.assistants-management__automation-template,
.assistants-management__collaboration-threads,
.assistants-management__performance-trend {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color-secondary);
}

.assistants-management__automation-sla,
.assistants-management__automation-reminders,
.assistants-management__automation-calendar,
.assistants-management__collaboration-mentions,
.assistants-management__collaboration-audit,
.assistants-management__collaboration-presence,
.assistants-management__collaboration-flags,
.assistants-management__performance-coaching {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.assistants-management__automation-checklist {
  margin: 0;
  padding-inline-start: 1.2rem;
  display: grid;
  gap: var(--sakai-space-1);
  color: var(--sakai-text-color-secondary);
  font-size: 0.9rem;
}

.assistants-management__automation-stats,
.assistants-management__performance-stats {
  display: grid;
  gap: var(--sakai-space-2);
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  margin: 0;
}

.assistants-management__automation-stats div,
.assistants-management__performance-stats div {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.assistants-management__automation-stats dt,
.assistants-management__performance-stats dt {
  font-size: 0.8rem;
  color: var(--sakai-text-color-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.assistants-management__automation-stats dd,
.assistants-management__performance-stats dd {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.assistants-management__collaboration-flags {
  display: flex;
  gap: var(--sakai-space-1);
  align-items: center;
}

.assistants-management__performance-scores {
  display: grid;
  gap: var(--sakai-space-2);
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.assistants-management__performance-score {
  font-size: 1.4rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.assistants-management__performance-delta {
  font-size: 1.2rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-primary-600);
}

.assistants-management__performance-label {
  display: block;
  font-size: 0.75rem;
  color: var(--sakai-text-color-tertiary);
}

.assistants-management__performance-coaching {
  border-radius: var(--sakai-border-radius-sm);
  padding: var(--sakai-space-2);
  background-color: color-mix(in srgb, var(--sakai-success-100) 70%, transparent);
}

.assistants-management__performance-coaching--recommended {
  background-color: color-mix(in srgb, var(--sakai-warning-100) 70%, transparent);
  color: var(--sakai-warning-800);
  font-weight: var(--sakai-font-weight-medium);
}

.assistants-management__summary-stat {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
  padding: var(--sakai-space-3);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  border-radius: var(--sakai-border-radius-md);
  background-color: color-mix(in srgb, var(--sakai-surface-color) 60%, transparent);
}

.assistants-management__summary-value {
  font-size: 1.6rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.assistants-management__summary-label {
  font-weight: var(--sakai-font-weight-medium);
}

.assistants-management__summary-description {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.assistants-management__summary-access {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.assistants-management__summary-access-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--sakai-space-3);
}

.assistants-management__summary-access-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.assistants-management__summary-access-meta {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.assistants-management__summary-access-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.assistants-management__summary-access-item {
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: var(--sakai-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.assistants-management__summary-access-item-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sakai-space-3);
  flex-wrap: wrap;
}

.assistants-management__summary-access-name-group {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

.assistants-management__summary-access-name {
  font-weight: var(--sakai-font-weight-semibold);
}

.assistants-management__summary-access-count {
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.assistants-management__summary-access-empty {
  margin: 0;
  text-align: center;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
}

.assistants-management__summary-access-empty,
.assistants-management__summary-access-item + .assistants-management__summary-access-empty {
  border: 1px dashed color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: var(--sakai-space-4);
}

.assistants-management__filters-bar {
  margin-bottom: var(--sakai-space-6);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.assistants-management__filters-select {
  max-width: 320px;
}

.assistants-management__filters-hint {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.assistants-management__card {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.assistants-management__alert {
  justify-content: space-between;
  flex-wrap: wrap;
}

.assistants-management__alert .ui-button {
  padding-inline: 0.25rem;
}

.assistants-management__permissions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

.assistants-management__persona-tag {
  text-transform: none;
  flex-shrink: 0;
}

.assistants-management__row-actions {
  display: flex;
  gap: var(--sakai-space-2);
  justify-content: flex-end;
}

.assistants-management__empty {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  text-align: center;
  padding: var(--sakai-space-6) 0;
}

.assistants-management__form {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.assistants-management__fieldset {
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  border-radius: var(--sakai-border-radius-md);
  padding: var(--sakai-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.assistants-management__fieldset legend {
  font-weight: var(--sakai-font-weight-semibold);
  padding: 0 var(--sakai-space-2);
}

.assistants-management__hint {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
}

.assistants-management__permissions-grid {
  display: grid;
  gap: var(--sakai-space-3);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.assistants-management__app-shell-preview {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  margin-top: var(--sakai-space-3);
  padding-top: var(--sakai-space-3);
  border-top: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
}

.assistants-management__app-shell-heading {
  margin: 0;
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.assistants-management__app-shell-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

.assistants-management__app-shell-empty {
  margin: 0;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.85rem;
}

.assistants-management__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sakai-space-3);
}

.assistants-management__error {
  color: var(--sakai-danger-600);
  font-size: 0.9rem;
}

.assistants-management__list {
  display: none;
  gap: var(--sakai-space-3);
}

.assistants-management__list-item {
  display: grid;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--sakai-surface-card) 96%, transparent);
}

.assistants-management__list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-2);
}

.assistants-management__list-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.assistants-management__list-field {
  display: grid;
  gap: var(--sakai-space-2);
}

.assistants-management__list-field label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sakai-text-color-muted);
}

.assistants-management__list-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sakai-space-2);
}

@media (max-width: 1024px) {
  .assistants-management__card :deep(.ui-table-container) {
    display: none;
  }

  .assistants-management__list {
    display: grid;
  }
}
</style>
