<template>
  <ThemePage class="theme-page--admin" :title="t('adminPlanBuilder.title')" :subtitle="t('adminPlanBuilder.subtitle')">
    <section class="plan-builder flex flex-col gap-6">
      <div class="plan-builder__grid grid gap-6 items-start [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        <UiCard class="plan-builder__panel flex flex-col gap-4" hover>
          <template #title>{{ t('adminPlanBuilder.templates.title') }}</template>
          <template #subtitle>{{ t('adminPlanBuilder.templates.subtitle') }}</template>

          <UiSkeleton v-if="loading" height="200" animation="wave" />
          <UiAlert v-else-if="loadError" color="danger" variant="soft">{{ loadError }}</UiAlert>

          <ul v-else class="plan-builder__template-list flex flex-col gap-3 m-0 p-0 list-none" role="list">
            <li
              v-for="template in templates"
              :key="templateKey(template)"
              :class="['plan-builder__template-item', { 'is-active': templateKey(template) === selectedTemplateId }]"
            >
              <button type="button" class="plan-builder__template-button flex w-full bg-transparent border-none px-4 py-3 flex-col items-start gap-2 cursor-pointer" @click="selectTemplate(template)">
                <span class="plan-builder__template-name font-semibold">{{ template.displayName }}</span>
                <UiTag size="sm" color="primary">{{ template.code }} · v{{ template.version }}</UiTag>
                <UiTag
                  size="sm"
                  :color="template.status === 'PUBLISHED' ? 'success' : 'warning'"
                  variant="soft"
                >
                  {{ template.status === 'PUBLISHED' ? t('adminPlanBuilder.status.published') : t('adminPlanBuilder.status.draft') }}
                </UiTag>
              </button>
            </li>
          </ul>

          <template #actions>
            <div class="plan-builder__template-actions flex gap-2 justify-end">
              <UiButton
                size="sm"
                variant="secondary"
                :disabled="!selectedTemplate || cloning"
                :loading="cloning"
                @click="cloneSelected"
              >
                {{ t('adminPlanBuilder.templates.clone') }}
              </UiButton>
              <UiButton
                size="sm"
                variant="secondary"
                :disabled="!selectedTemplate || exportLoading"
                :loading="exportLoading"
                @click="exportSelected"
              >
                {{ t('adminPlanBuilder.templates.export') }}
              </UiButton>
              <UiButton
                size="sm"
                variant="secondary"
                :disabled="importLoading"
                :loading="importLoading"
                @click="triggerImport"
              >
                {{ t('adminPlanBuilder.templates.import') }}
              </UiButton>
              <UiButton
                size="sm"
                :disabled="!selectedTemplate || publishing || selectedTemplate.status === 'PUBLISHED'"
                :loading="publishing"
                @click="publishSelected"
              >
                {{ t('adminPlanBuilder.templates.publish') }}
              </UiButton>
            </div>
            <input
              ref="importInputRef"
              type="file"
              accept="application/json"
              class="plan-builder__import-input hidden"
              @change="handleImportFile"
            />
          </template>
        </UiCard>

        <UiCard class="plan-builder__panel flex flex-col gap-4" hover>
          <template #title>
            {{ selectedTemplate?.displayName || t('adminPlanBuilder.editor.emptyTitle') }}
          </template>
          <template v-if="selectedTemplate" #subtitle>
            {{ t('adminPlanBuilder.editor.subtitle', { code: selectedTemplate.code, version: selectedTemplate.version }) }}
          </template>

          <div v-if="!selectedTemplate" class="plan-builder__empty flex items-center justify-center min-h-[200px] text-center">
            <p>{{ t('adminPlanBuilder.editor.emptyHelp') }}</p>
          </div>

          <div v-else class="plan-builder__editor flex flex-col gap-6">
            <UiAlert
              v-if="isTemplateReadOnly"
              color="info"
              variant="soft"
            >
              {{ t('adminPlanBuilder.editor.publishedReadOnly') }}
            </UiAlert>

            <div class="plan-builder__form-grid grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
              <UiInput
                v-model="templateForm.displayName"
                :label="t('adminPlanBuilder.editor.fields.displayName')"
                :disabled="isTemplateReadOnly"
              />
              <UiInput
                v-model="templateForm.billingPeriod"
                :label="t('adminPlanBuilder.editor.fields.billingPeriod')"
                :disabled="isTemplateReadOnly"
              />
              <UiInput
                v-model.number="templateForm.price"
                type="number"
                :label="t('adminPlanBuilder.editor.fields.price')"
                :placeholder="t('adminPlanBuilder.editor.fields.pricePlaceholder')"
                :disabled="isTemplateReadOnly"
              />
              <UiInput
                v-model="templateForm.currency"
                :label="t('adminPlanBuilder.editor.fields.currency')"
                :disabled="isTemplateReadOnly"
                maxlength="8"
              />
              <UiInput
                v-model="templateForm.region"
                :label="t('adminPlanBuilder.editor.fields.region')"
                :disabled="isTemplateReadOnly"
              />
            </div>

            <section class="plan-builder__feature-grid">
              <header>
                <h4>{{ t('adminPlanBuilder.features.title') }}</h4>
                <p>{{ t('adminPlanBuilder.features.subtitle') }}</p>
              </header>
              <UiAlert
                v-if="teacherScopedOptions.length"
                color="info"
                variant="outline"
                class="plan-builder__teacher-scoped-alert col-span-full"
              >
                {{
                  t('adminPlanBuilder.features.teacherScopedNotice', {
                    features: teacherScopedFeatureLabels.join(', ')
                  })
                }}
              </UiAlert>
              <UiSwitch
                v-for="featureCode in featureCatalog"
                :key="featureCode"
                v-model="templateForm.features[featureCode]"
                :label="featureLabel(featureCode)"
                :disabled="isTemplateReadOnly"
              />
            </section>

            <section class="plan-builder__entitlements flex flex-col gap-3">
              <header>
                <h4>{{ t('adminPlanBuilder.entitlements.title') }}</h4>
                <p>{{ t('adminPlanBuilder.entitlements.subtitle') }}</p>
              </header>
              <div class="plan-builder__entitlement-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
                <template v-for="entitlementKey in entitlementCatalog" :key="entitlementKey">
                  <UiSelect
                    v-if="isResolutionPolicyEntitlement(entitlementKey)"
                    v-model="templateForm.entitlements[entitlementKey]"
                    :label="entitlementLabel(entitlementKey)"
                    :disabled="isTemplateReadOnly"
                  >
                    <option value="" disabled>{{ t('adminPlanBuilder.entitlements.placeholder') }}</option>
                    <option v-for="option in RESOLUTION_POLICY_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </UiSelect>
                  <UiInput
                    v-else
                    v-model.number="templateForm.entitlements[entitlementKey]"
                    type="number"
                    :label="entitlementLabel(entitlementKey)"
                    :placeholder="t('adminPlanBuilder.entitlements.placeholder')"
                    :disabled="isTemplateReadOnly"
                  />
                </template>
              </div>
            </section>

            <section class="plan-builder__marketing flex flex-col gap-3">
              <header>
                <h4>{{ t('adminPlanBuilder.marketing.title') }}</h4>
                <p>{{ t('adminPlanBuilder.marketing.subtitle') }}</p>
              </header>
              <div class="plan-builder__marketing-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                <article
                  v-for="localeKey in marketingLocales"
                  :key="localeKey"
                  class="plan-builder__marketing-card"
                >
                  <header class="plan-builder__marketing-header">
                    <h5>{{ marketingLocaleLabel(localeKey) }}</h5>
                  </header>
                  <UiInput
                    v-model="templateForm.marketingCopy[localeKey].tagline"
                    :label="t('adminPlanBuilder.marketing.fields.tagline')"
                    :disabled="isTemplateReadOnly"
                  />
                  <UiTextarea
                    v-model="templateForm.marketingCopy[localeKey].bestFor"
                    :label="t('adminPlanBuilder.marketing.fields.bestFor')"
                    :rows="3"
                    :disabled="isTemplateReadOnly"
                  />
                  <UiTextarea
                    :model-value="getMarketingIncludesText(localeKey)"
                    :label="t('adminPlanBuilder.marketing.fields.includes')"
                    :rows="3"
                    :disabled="isTemplateReadOnly"
                    :placeholder="t('adminPlanBuilder.marketing.includesPlaceholder')"
                    @update:model-value="(value) => updateMarketingIncludes(localeKey, value)"
                  />
                  <p class="plan-builder__marketing-help">
                    {{ t('adminPlanBuilder.marketing.includesHelp') }}
                  </p>
                </article>
              </div>
            </section>

            <section class="plan-builder__pricing flex flex-col gap-3">
              <header>
                <h4>{{ t('adminPlanBuilder.pricing.title') }}</h4>
                <p>{{ t('adminPlanBuilder.pricing.subtitle') }}</p>
              </header>

              <UiAlert v-if="pricingError" color="danger" variant="soft">
                {{ pricingError }}
              </UiAlert>

              <div v-else-if="pricingLoading" class="plan-builder__pricing-skeleton grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                <UiSkeleton
                  v-for="country in supportedCountries"
                  :key="country.code"
                  height="132px"
                  animation="wave"
                />
              </div>

              <div v-else class="plan-builder__pricing-grid grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
                <article
                  v-for="country in supportedCountries"
                  :key="country.code"
                  class="plan-builder__pricing-card"
                >
                  <header class="plan-builder__pricing-header flex items-center justify-between gap-2">
                    <h5>{{ t(`adminPlanBuilder.pricing.countries.${country.code}`) }}</h5>
                    <UiTag size="sm" color="primary">{{ country.currency }}</UiTag>
                  </header>
                  <UiInput
                    v-model="pricingForms[country.code].amountMajor"
                    type="number"
                    inputmode="decimal"
                    :step="pricingAmountStep(pricingForms[country.code].currency)"
                    :label="
                      t('adminPlanBuilder.pricing.fields.amount', {
                        currency: pricingForms[country.code].currency
                      })
                    "
                  />
                  <UiSwitch
                    v-model="pricingForms[country.code].active"
                    :label="t('adminPlanBuilder.pricing.fields.active')"
                  />
                  <UiInput
                    v-model="pricingForms[country.code].stripePriceId"
                    :label="t('adminPlanBuilder.pricing.fields.stripePriceId')"
                    :placeholder="t('adminPlanBuilder.pricing.fields.stripePlaceholder')"
                  />
                  <p v-if="pricingForms[country.code].formattedAmount" class="plan-builder__pricing-meta">
                    {{
                      t('adminPlanBuilder.pricing.formatted', {
                        value: pricingForms[country.code].formattedAmount
                      })
                    }}
                  </p>
                  <p v-if="pricingForms[country.code].lastUpdated" class="plan-builder__pricing-meta">
                    {{
                      t('adminPlanBuilder.pricing.lastUpdated', {
                        value: formatDateTime(pricingForms[country.code].lastUpdated)
                      })
                    }}
                  </p>
                  <UiAlert
                    v-if="!pricingForms[country.code].active"
                    color="warning"
                    variant="soft"
                    class="plan-builder__pricing-warning m-0"
                  >
                    {{
                      t('adminPlanBuilder.pricing.inactiveHint', {
                        country: t(`adminPlanBuilder.pricing.countries.${country.code}`)
                      })
                    }}
                  </UiAlert>
                  <UiAlert v-if="pricingForms[country.code].error" color="danger" variant="soft">
                    {{ pricingForms[country.code].error }}
                  </UiAlert>
                  <div class="plan-builder__pricing-actions flex justify-end">
                    <UiButton
                      type="button"
                      color="primary"
                      :loading="pricingForms[country.code].saving"
                      :disabled="
                        pricingForms[country.code].saving || !hasAmountValue(pricingForms[country.code])
                      "
                      @click="savePricingForCountry(country.code)"
                    >
                      {{ t('adminPlanBuilder.pricing.saveButton') }}
                    </UiButton>
                  </div>
                </article>
              </div>
            </section>

            <div class="plan-builder__actions flex justify-end gap-3">
              <UiButton
                color="secondary"
                variant="link"
                :disabled="isTemplateReadOnly || !hasChanges || saving"
                @click="resetForm"
              >
                {{ t('common.cancel') }}
              </UiButton>
              <UiButton
                :disabled="isTemplateReadOnly || !hasChanges"
                :loading="saving"
                color="primary"
                @click="saveTemplate"
              >
                {{ t('common.save') }}
              </UiButton>
            </div>
          </div>
        </UiCard>

        <UiCard class="plan-builder__panel flex flex-col gap-4" hover>
          <template #title>{{ t('adminPlanBuilder.assignment.title') }}</template>
          <template #subtitle>{{ t('adminPlanBuilder.assignment.subtitle') }}</template>

          <form class="plan-builder__assignment flex flex-col gap-4" @submit.prevent="assignPlan">
            <UiSwitch v-model="assignmentForm.bulkMode" :label="t('adminPlanBuilder.assignment.bulkMode')" />
            <UiSelect
              v-if="!assignmentForm.bulkMode"
              v-model="assignmentForm.tenantSlug"
              :label="t('adminPlanBuilder.assignment.tenant')"
              :disabled="loadingTeachers || teacherOptions.length === 0"
              required
            >
              <option value="" disabled>
                {{
                  loadingTeachers
                    ? t('adminPlanBuilder.assignment.loadingTeachers')
                    : t('adminPlanBuilder.assignment.tenantPlaceholder')
                }}
              </option>
              <option v-for="teacher in teacherOptions" :key="teacher.slug" :value="teacher.slug">
                {{ teacher.name || teacher.slug }} · {{ teacher.slug }}
              </option>
            </UiSelect>
            <UiTextarea
              v-else
              v-model="assignmentForm.bulkSlugs"
              :rows="4"
              :label="t('adminPlanBuilder.assignment.bulkSlugs')"
              :placeholder="t('adminPlanBuilder.assignment.bulkPlaceholder')"
              required
            />
            <UiSwitch
              v-if="assignmentForm.bulkMode"
              v-model="assignmentForm.dryRun"
              :label="t('adminPlanBuilder.assignment.dryRun')"
            />
            <UiAlert v-if="teacherLoadError" color="warning" variant="soft">{{ teacherLoadError }}</UiAlert>
            <UiAlert v-else-if="!loadingTeachers && teacherOptions.length === 0" color="info" variant="soft">
              {{ t('adminPlanBuilder.assignment.noTeachers') }}
            </UiAlert>
            <UiSwitch v-model="assignmentForm.pinned" :label="t('adminPlanBuilder.assignment.pinned')" />
            <UiSelect v-model="assignmentForm.templateKey" :label="t('adminPlanBuilder.assignment.plan')" required>
              <option value="" disabled>{{ t('adminPlanBuilder.assignment.placeholder') }}</option>
              <option
                v-for="template in availableAssignmentTemplates"
                :key="templateKey(template)"
                :value="templateKey(template)"
              >
                {{ template.displayName }} · {{ template.code }} v{{ template.version }}
              </option>
            </UiSelect>
            <UiInput
              v-model="assignmentForm.effectiveFrom"
              type="date"
              :label="t('adminPlanBuilder.assignment.effectiveFrom')"
            />
            <UiInput
              v-model="assignmentForm.effectiveTo"
              type="date"
              :label="t('adminPlanBuilder.assignment.effectiveTo')"
            />
            <div class="plan-builder__assignment-actions flex justify-end gap-2">
              <UiButton type="submit" color="primary" :loading="assigning">
                {{ t('adminPlanBuilder.assignment.submit') }}
              </UiButton>
            </div>
          </form>
          <div class="plan-builder__assignment-preview flex flex-col gap-3">
            <UiAlert v-if="assignmentPreviewError" color="warning" variant="soft">
              {{ assignmentPreviewError }}
            </UiAlert>
            <UiAlert v-else-if="assignmentPreviewLoading" color="info" variant="soft">
              {{ t('adminPlanBuilder.assignment.loadingPreview') }}
            </UiAlert>
            <div v-else-if="assignmentPreview" class="plan-builder__assignment-preview-grid">
              <div>
                <strong>{{ t('adminPlanBuilder.assignment.preview.students') }}</strong>
                <div>
                  {{ assignmentPreview.studentCount }} / {{ assignmentPreview.studentLimit ?? 'Unlimited' }}
                </div>
              </div>
              <div>
                <strong>{{ t('adminPlanBuilder.assignment.preview.instructors') }}</strong>
                <div>
                  {{ assignmentPreview.instructorCount }} / {{ assignmentPreview.instructorLimit ?? 'Unlimited' }}
                </div>
              </div>
                <div>
                  <strong>{{ t('adminPlanBuilder.assignment.preview.storage') }}</strong>
                  <div>
                    {{ assignmentPreview.storageSecondsUsed }}s /
                    {{ assignmentPreview.storageSecondsLimit ?? 'Unlimited' }}s
                  </div>
                </div>
                <div>
                  <strong>{{ t('adminPlanBuilder.assignment.preview.storageSize') }}</strong>
                  <div>
                    {{ formatBytes(assignmentPreview.storageBytesUsed) }} /
                    {{
                      assignmentPreview.storageBytesLimit !== null
                        ? formatBytes(assignmentPreview.storageBytesLimit)
                        : t('adminPlanBuilder.assignment.preview.unlimited')
                    }}
                  </div>
                </div>
                <div>
                  <strong>{{ t('adminPlanBuilder.assignment.preview.streaming') }}</strong>
                  <div>
                    {{ assignmentPreview.streamingMinutesUsed }} /
                    {{ assignmentPreview.streamingMinutesLimit ?? 'Unlimited' }} min
                </div>
              </div>
              <UiAlert
                v-if="assignmentPreview.warnings.length"
                color="warning"
                variant="soft"
                class="plan-builder__assignment-preview-warning col-span-full"
              >
                <ul>
                  <li v-for="warning in assignmentPreview.warnings" :key="warning">{{ warning }}</li>
                </ul>
              </UiAlert>
            </div>
          </div>

          <div v-if="bulkAssignResult" class="plan-builder__bulk-actions flex justify-end">
            <UiButton size="sm" variant="secondary" @click="exportBulkAssignCsv">
              {{ t('adminPlanBuilder.assignment.exportBulkCsv') }}
            </UiButton>
          </div>

          <UiAlert v-if="bulkAssignResult?.dryRun" color="info" variant="soft">
            {{ t('adminPlanBuilder.assignment.dryRunSuccess') }}
          </UiAlert>

          <UiAlert
            v-if="bulkAssignResult && bulkAssignResult.errors.length"
            color="warning"
            variant="soft"
            class="plan-builder__bulk-errors mt-3"
          >
            <strong>{{ t('adminPlanBuilder.assignment.bulkIssues') }}</strong>
            <ul>
              <li v-for="error in bulkAssignResult.errors" :key="error.tenantSlug">
                {{ error.tenantSlug }} — {{ error.error }}
              </li>
            </ul>
          </UiAlert>

          <div v-if="bulkAssignResult?.previews?.length" class="plan-builder__bulk-preview mt-3 flex flex-col gap-2">
            <h4>{{ t('adminPlanBuilder.assignment.previewResults') }}</h4>
            <ul class="plan-builder__bulk-preview-list list-none p-0 m-0 flex flex-col gap-2">
              <li v-for="preview in bulkAssignResult.previews" :key="preview.tenantSlug">
                <strong>{{ preview.tenantSlug }}</strong>
                  <span>
                    {{ preview.studentCount }} students /
                    {{ preview.studentLimit ?? 'Unlimited' }}
                    - {{ preview.storageSecondsUsed }}s storage /
                    {{ preview.storageSecondsLimit ?? 'Unlimited' }}s
                    - {{ formatBytes(preview.storageBytesUsed) }} storage size /
                    {{
                      preview.storageBytesLimit !== null
                        ? formatBytes(preview.storageBytesLimit)
                        : 'Unlimited'
                    }}
                    - {{ preview.streamingMinutesUsed }} min /
                    {{ preview.streamingMinutesLimit ?? 'Unlimited' }} min
                  </span>
                <ul v-if="preview.warnings.length" class="plan-builder__bulk-preview-warnings">
                  <li v-for="warning in preview.warnings" :key="warning">{{ warning }}</li>
                </ul>
              </li>
            </ul>
          </div>
        </UiCard>

        <UiCard class="plan-builder__panel flex flex-col gap-4" hover>
          <template #title>{{ t('adminPlanBuilder.assignmentList.title') }}</template>
          <template #subtitle>{{ t('adminPlanBuilder.assignmentList.subtitle') }}</template>

          <UiSkeleton v-if="assignmentsLoading" height="160" animation="wave" />
          <UiAlert v-else-if="assignmentsError" color="danger" variant="soft">{{ assignmentsError }}</UiAlert>
          <UiAlert v-else-if="assignments.length === 0" color="info" variant="soft">
            {{ t('adminPlanBuilder.assignmentList.empty') }}
          </UiAlert>

          <div v-if="!assignmentsLoading && !assignmentsError && assignments.length > 0" class="plan-builder__assignment-list-actions flex justify-end mb-3">
            <UiButton size="sm" variant="secondary" @click="exportAssignmentsCsv">
              {{ t('adminPlanBuilder.assignmentList.exportCsv') }}
            </UiButton>
          </div>

          <ul v-if="!assignmentsLoading && !assignmentsError && assignments.length > 0" class="plan-builder__assignment-list flex flex-col gap-4 p-0 m-0 list-none" role="list">
            <li
              v-for="assignment in assignments"
              :key="`${assignment.teacherSlug || assignment.teacherId || 'unknown'}::${assignment.version}`"
              class="plan-builder__assignment-list-item"
            >
              <div class="plan-builder__assignment-list-header flex items-start justify-between gap-4">
                <div class="plan-builder__assignment-tenant flex flex-col gap-[0.15rem]">
                  <span class="plan-builder__assignment-tenant-name font-semibold">
                    {{ assignment.teacherName || assignment.teacherSlug || '—' }}
                  </span>
                  <small class="plan-builder__assignment-tenant-slug">
                    {{ assignment.teacherSlug || '—' }}
                  </small>
                </div>
                <UiTag size="sm" :color="assignmentStatusColor(assignment.status)" variant="soft">
                  {{ assignmentStatusLabel(assignment.status) }}
                </UiTag>
              </div>

              <dl class="plan-builder__assignment-meta grid gap-3 m-0 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                <div>
                  <dt>{{ t('adminPlanBuilder.assignmentList.columns.plan') }}</dt>
                  <dd>{{ assignment.planCode }} · v{{ assignment.version }}</dd>
                </div>
                <div>
                  <dt>{{ t('adminPlanBuilder.assignmentList.columns.effectiveFrom') }}</dt>
                  <dd>{{ formatDate(assignment.effectiveFrom) }}</dd>
                </div>
                <div>
                  <dt>{{ t('adminPlanBuilder.assignmentList.columns.effectiveTo') }}</dt>
                  <dd>
                    {{ assignment.effectiveTo ? formatDate(assignment.effectiveTo) : t('adminPlanBuilder.assignmentList.noEndDate') }}
                  </dd>
                </div>
                <div>
                  <dt>{{ t('adminPlanBuilder.assignmentList.columns.lastUpdated') }}</dt>
                  <dd>{{ formatDateTime(assignment.updatedAt) }}</dd>
                </div>
                <div>
                  <dt>{{ t('adminPlanBuilder.assignmentList.columns.pinned') }}</dt>
                  <dd>{{ assignment.pinned ? t('adminPlanBuilder.assignmentList.values.yes') : t('adminPlanBuilder.assignmentList.values.no') }}</dd>
                </div>
              </dl>

              <div class="plan-builder__assignment-controls flex justify-end">
                <UiButton
                  size="sm"
                  variant="link"
                  color="danger"
                  :disabled="!assignment.teacherSlug"
                  @click="openEndDialog(assignment)"
                >
                  {{ t('adminPlanBuilder.assignmentList.actions.end') }}
                </UiButton>
              </div>
            </li>
          </ul>
        </UiCard>

        <UiCard class="plan-builder__panel flex flex-col gap-4" hover>
          <template #title>{{ t('adminPlanBuilder.audit.title') }}</template>
          <template #subtitle>{{ t('adminPlanBuilder.audit.subtitle') }}</template>

          <form class="plan-builder__audit-filters grid gap-3 mb-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]" @submit.prevent="applyPlanAuditFilters">
            <UiInput v-model="planAuditFilters.planCode" :label="t('adminPlanBuilder.audit.filters.planCode')" :placeholder="t('adminPlanBuilder.audit.filters.planPlaceholder')" />
            <UiInput v-model="planAuditFilters.teacherSlug" :label="t('adminPlanBuilder.audit.filters.teacherSlug')" :placeholder="t('adminPlanBuilder.audit.filters.teacherPlaceholder')" />
            <UiInput
              v-model="planAuditFilters.from"
              type="datetime-local"
              appearance="datetime"
              :label="t('adminPlanBuilder.audit.filters.from')"
            />
            <UiInput
              v-model="planAuditFilters.to"
              type="datetime-local"
              appearance="datetime"
              :label="t('adminPlanBuilder.audit.filters.to')"
            />
            <div class="plan-builder__audit-actions flex items-center justify-end gap-2">
              <UiButton type="submit" size="sm" variant="link">{{ t('adminPlanBuilder.audit.filters.apply') }}</UiButton>
              <UiButton type="button" size="sm" variant="link" color="secondary" @click="resetPlanAuditFilters">
                {{ t('adminPlanBuilder.audit.filters.reset') }}
              </UiButton>
            </div>
          </form>

          <UiAlert v-if="planAuditError" color="warning" variant="soft">{{ planAuditError }}</UiAlert>

          <UiTable
            :headers="planAuditHeaders"
            :items="planAuditItems"
            :loading="planAuditLoading"
            density="comfortable"
            class="plan-builder__audit-table mt-4"
            :empty-text="t('adminPlanBuilder.audit.empty')"
          >
            <template #item.actor="{ item }">
              <div class="plan-builder__audit-actor flex flex-col gap-[0.25rem]">
                <UiTag size="sm" color="primary" variant="soft">{{ item.actorType || t('adminPlanBuilder.reconciliation.unknown') }}</UiTag>
                <span v-if="item.actorName">{{ item.actorName }}</span>
                <small v-else-if="item.actorId">#{{ item.actorId }}</small>
              </div>
            </template>
            <template #item.entity="{ item }">
              <div class="plan-builder__audit-entity flex flex-col gap-[0.25rem]">
                <span>{{ item.entityType || '—' }}</span>
                <small v-if="item.entityId">#{{ item.entityId }}</small>
              </div>
            </template>
            <template #item.createdAt="{ item }">
              {{ formatDateTime(item.createdAt) }}
            </template>
            <template #item.actions="{ item }">
              <UiButton size="sm" variant="link" @click="openPlanAuditDetail(item)">
                {{ t('adminPlanBuilder.audit.columns.actions') }}
              </UiButton>
            </template>
          </UiTable>

          <div v-if="planAuditTotal > 0" class="plan-builder__audit-footer">
            <span>
              {{ t('adminPlanBuilder.audit.pagination.summary', {
                from: planAuditPage * planAuditSize + 1,
                to: Math.min(planAuditPage * planAuditSize + planAuditSize, planAuditTotal),
                total: planAuditTotal
              }) }}
            </span>
            <div class="plan-builder__audit-pager flex gap-2">
              <UiButton
                size="sm"
                variant="link"
                :disabled="planAuditPage === 0 || planAuditLoading"
                @click="changePlanAuditPage(planAuditPage - 1)"
              >
                {{ t('adminPlanBuilder.audit.pagination.prev') }}
              </UiButton>
              <UiButton
                size="sm"
                variant="link"
                :disabled="planAuditPage >= planAuditTotalPages - 1 || planAuditLoading"
                @click="changePlanAuditPage(planAuditPage + 1)"
              >
                {{ t('adminPlanBuilder.audit.pagination.next') }}
              </UiButton>
            </div>
          </div>
        </UiCard>

        <UiCard class="plan-builder__panel flex flex-col gap-4" hover>
          <template #title>{{ t('adminPlanBuilder.reconciliation.title') }}</template>
          <template #subtitle>{{ t('adminPlanBuilder.reconciliation.subtitle') }}</template>

          <UiAlert v-if="reconciliationError" color="warning" variant="soft">
            {{ reconciliationError }}
          </UiAlert>
          <UiSkeleton v-else-if="reconciliationLoading" height="120" animation="wave" />
          <div v-else class="plan-builder__reconciliation flex flex-col gap-2">
            <div>
              <strong>{{ t('adminPlanBuilder.reconciliation.status') }}:</strong>
              <span>{{ reconciliationStatus?.status || t('adminPlanBuilder.reconciliation.unknown') }}</span>
            </div>
            <div>
              <strong>{{ t('adminPlanBuilder.reconciliation.lastStarted') }}:</strong>
              <span>{{ reconciliationStatus?.lastStartedAt ? formatDateTime(reconciliationStatus.lastStartedAt) : '—' }}</span>
            </div>
            <div>
              <strong>{{ t('adminPlanBuilder.reconciliation.lastCompleted') }}:</strong>
              <span>{{ reconciliationStatus?.lastCompletedAt ? formatDateTime(reconciliationStatus.lastCompletedAt) : '—' }}</span>
            </div>
            <div>
              <strong>{{ t('adminPlanBuilder.reconciliation.teachersUpdated') }}:</strong>
              <span>{{ reconciliationStatus?.teachersUpdated ?? '—' }}</span>
            </div>
            <div>
              <strong>{{ t('adminPlanBuilder.reconciliation.totalRows') }}:</strong>
              <span>{{ reconciliationStatus?.totalRows ?? '—' }}</span>
            </div>
            <UiAlert v-if="reconciliationStatus?.errorMessage" color="danger" variant="soft">
              {{ reconciliationStatus.errorMessage }}
            </UiAlert>
          </div>
        </UiCard>

        <UiCard class="plan-builder__panel flex flex-col gap-4" hover>
          <template #title>{{ t('adminPlanBuilder.backfill.title') }}</template>
          <template #subtitle>{{ t('adminPlanBuilder.backfill.subtitle') }}</template>

          <div class="plan-builder__backfill-actions flex justify-end">
            <UiButton size="sm" variant="secondary" :loading="backfillRunning" @click="triggerBackfill">
              {{ t('adminPlanBuilder.backfill.run') }}
            </UiButton>
          </div>

          <UiAlert v-if="backfillError" color="warning" variant="soft">
            {{ backfillError }}
          </UiAlert>
          <UiSkeleton v-else-if="backfillLoading" height="140" animation="wave" />
          <div v-else class="plan-builder__reconciliation flex flex-col gap-2">
            <div>
              <strong>{{ t('adminPlanBuilder.backfill.status') }}:</strong>
              <span>{{ backfillStatus?.status || t('adminPlanBuilder.reconciliation.unknown') }}</span>
            </div>
            <div>
              <strong>{{ t('adminPlanBuilder.backfill.lastStarted') }}:</strong>
              <span>{{ backfillStatus?.lastStartedAt ? formatDateTime(backfillStatus.lastStartedAt) : 'â€”' }}</span>
            </div>
            <div>
              <strong>{{ t('adminPlanBuilder.backfill.lastCompleted') }}:</strong>
              <span>{{ backfillStatus?.lastCompletedAt ? formatDateTime(backfillStatus.lastCompletedAt) : 'â€”' }}</span>
            </div>
            <div>
              <strong>{{ t('adminPlanBuilder.backfill.processed') }}:</strong>
              <span>{{ backfillStatus?.processed ?? 'â€”' }}</span>
            </div>
            <div>
              <strong>{{ t('adminPlanBuilder.backfill.updated') }}:</strong>
              <span>{{ backfillStatus?.updated ?? 'â€”' }}</span>
            </div>
            <div>
              <strong>{{ t('adminPlanBuilder.backfill.skipped') }}:</strong>
              <span>{{ backfillStatus?.skipped ?? 'â€”' }}</span>
            </div>
            <UiAlert v-if="backfillStatus?.errorMessage" color="danger" variant="soft">
              {{ backfillStatus.errorMessage }}
            </UiAlert>
          </div>
        </UiCard>
      </div>
    </section>
  </ThemePage>

  <UiDialog
    v-model="endDialog.open"
    :title="endDialog.assignment
      ? t('adminPlanBuilder.assignmentEnd.title', {
          tenant: endDialog.assignment.teacherName || endDialog.assignment.teacherSlug || t('adminPlanBuilder.assignmentEnd.unknownTenant'),
          plan: `${endDialog.assignment.planCode} · v${endDialog.assignment.version}`
        })
      : t('adminPlanBuilder.assignmentEnd.titleFallback')"
    width="460px"
    @hide="closeEndDialog"
  >
    <template #default>
      <p class="plan-builder__assignment-end-description">
        {{ t('adminPlanBuilder.assignmentEnd.description') }}
      </p>
      <UiAlert v-if="endDialog.error" color="danger" variant="soft">{{ endDialog.error }}</UiAlert>
      <UiInput
        v-model="endDialog.effectiveTo"
        type="date"
        :label="t('adminPlanBuilder.assignmentEnd.effectiveTo')"
        :disabled="endDialog.submitting"
      />
      <p class="plan-builder__assignment-end-help">{{ t('adminPlanBuilder.assignmentEnd.help') }}</p>
    </template>
    <template #footer>
      <UiButton variant="link" color="secondary" :disabled="endDialog.submitting" @click="closeEndDialog">
        {{ t('adminPlanBuilder.assignmentEnd.cancel') }}
      </UiButton>
      <UiButton color="danger" :loading="endDialog.submitting" @click="submitEndDialog">
        {{ t('adminPlanBuilder.assignmentEnd.submit') }}
      </UiButton>
    </template>
  </UiDialog>

  <UiDialog v-model="planAuditDialog.open" :title="t('adminPlanBuilder.audit.detail.title')" width="640px">
    <div v-if="selectedPlanAuditItem" class="plan-builder__audit-detail">
      <dl>
        <div>
          <dt>{{ t('adminPlanBuilder.audit.detail.action') }}</dt>
          <dd>{{ selectedPlanAuditItem.action || '—' }}</dd>
        </div>
        <div>
          <dt>{{ t('adminPlanBuilder.audit.detail.actor') }}</dt>
          <dd>{{ selectedPlanAuditItem.actorName || selectedPlanAuditItem.actorType || '—' }}</dd>
        </div>
        <div>
          <dt>{{ t('adminPlanBuilder.audit.detail.entity') }}</dt>
          <dd>{{ selectedPlanAuditItem.entityType || '—' }}</dd>
        </div>
        <div>
          <dt>{{ t('adminPlanBuilder.audit.detail.created') }}</dt>
          <dd>{{ formatDateTime(selectedPlanAuditItem.createdAt) }}</dd>
        </div>
      </dl>
      <div class="plan-builder__audit-payload">
        <h4>{{ t('adminPlanBuilder.audit.detail.payload') }}</h4>
        <pre>{{ formatPayload(selectedPlanAuditItem.payload) }}</pre>
      </div>
    </div>
    <div v-else class="plan-builder__audit-empty">
      {{ t('adminPlanBuilder.audit.detail.empty') }}
    </div>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiSelect from '@/components/ui/UiSelect.vue';
import UiSwitch from '@/components/ui/UiSwitch.vue';
import UiDialog from '@/components/ui/UiDialog.vue';
import UiTextarea from '@/components/ui/UiTextarea.vue';
import UiTable from '@/components/ui/UiTable.vue';
import ThemePage from '@/layout/theme/ThemePage.vue';
import { useToast } from '@/composables/useToast';
import {
  FEATURE,
  FEATURE_LABELS,
  ENTITLEMENT,
  ENTITLEMENT_LABELS,
  isFeatureCode,
  type EntitlementKey
} from '@/constants/featureCatalog';
import {
  assignTenantPlanTemplate,
  bulkAssignTenantPlanTemplate,
  clonePlanTemplate,
  exportPlanTemplate,
  importPlanTemplate,
  listPlanTemplates,
  listPlanTemplateAssignments,
  listPlanAuditLogs,
  previewTenantPlanAssignment,
  publishPlanTemplate,
  updatePlanTemplate,
  endTenantPlanTemplateAssignment,
  type PlanTemplateSummary,
  type PlanTemplateAssignmentSummary,
  type PlanTemplateMarketingContent,
  type PlanTemplateExportResponse,
  type PlanAssignmentPreviewResponse,
  type BulkAssignTenantPlanResponse,
  type BulkAssignTenantPlanResult
} from '@/services/planTemplates';
import { listAdminFeatures } from '@/services/adminFeatures';
import { fetchTeacherSummaries, type TeacherSummary } from '@/services/admin';
import {
  fetchAdminPlanPricing,
  updateAdminPlanPrice,
  type AdminPlanPricing
} from '@/services/adminPlanPricing';
import {
  fetchVideoStorageReconciliationStatus,
  fetchVideoStorageSizeBackfillStatus,
  triggerVideoStorageSizeBackfill,
  type VideoStorageReconciliationStatus,
  type VideoStorageSizeBackfillStatus
} from '@/services/adminVideoUsage';
import type { AuditLogEntry, PageResponse } from '@/api/adminOps';

const { t, locale } = useI18n();
const toast = useToast();

interface FeatureOption {
  code: string;
  name: string;
}

type MarketingLocale = 'en' | 'ar';
const MARKETING_LOCALES: MarketingLocale[] = ['en', 'ar'];

type MarketingCopyForm = {
  tagline: string;
  bestFor: string;
  includes: string[];
};

const SUPPORTED_COUNTRIES = ['EG'] as const;
type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];
const COUNTRY_CURRENCY: Record<SupportedCountry, string> = {
  EG: 'EGP'
};

const RESOLUTION_POLICY_OPTIONS = computed(() => [
  { value: 'block', label: t('adminPlanBuilder.editor.fields.resolutionPolicy.block') },
  { value: 'downscale', label: t('adminPlanBuilder.editor.fields.resolutionPolicy.downscale') },
  { value: 'allow', label: t('adminPlanBuilder.editor.fields.resolutionPolicy.allow') }
]);

interface PricingFormState {
  currency: string;
  amountMajor: string;
  active: boolean;
  stripePriceId: string;
  formattedAmount: string | null;
  lastUpdated: string | null;
  saving: boolean;
  error: string | null;
}

const FALLBACK_FEATURE_OPTIONS: FeatureOption[] = [
  { code: FEATURE.teacherAssistants, name: FEATURE_LABELS[FEATURE.teacherAssistants] }
];

const teacherScopedOptions = ref<FeatureOption[]>([]);
const teacherScopedCodes = computed(() => new Set(teacherScopedOptions.value.map((option) => option.code)));
const teacherScopedFeatureLabels = computed(() => teacherScopedOptions.value.map((option) => option.name));

const templates = ref<PlanTemplateSummary[]>([]);
const loading = ref(true);
const loadError = ref<string | null>(null);
const saving = ref(false);
const cloning = ref(false);
const publishing = ref(false);
const assigning = ref(false);
const importInputRef = ref<HTMLInputElement | null>(null);
const selectedTemplateId = ref<string>('');

const pricingIndex = ref<Map<string, AdminPlanPricing>>(new Map());
const pricingLoading = ref(false);
const pricingError = ref<string | null>(null);

const createPricingState = (currency: string): PricingFormState => ({
  currency,
  amountMajor: '',
  active: false,
  stripePriceId: '',
  formattedAmount: null,
  lastUpdated: null,
  saving: false,
  error: null
});

const pricingForms = reactive<Record<SupportedCountry, PricingFormState>>(
  SUPPORTED_COUNTRIES.reduce((acc, code) => {
    acc[code] = createPricingState(COUNTRY_CURRENCY[code]);
    return acc;
  }, {} as Record<SupportedCountry, PricingFormState>)
);

const assignments = ref<PlanTemplateAssignmentSummary[]>([]);
const assignmentsLoading = ref(false);
const assignmentsError = ref<string | null>(null);

const featureOptions = ref<FeatureOption[]>([]);
const featureCatalog = computed(() => featureOptions.value.map((item) => item.code));
const entitlementCatalog = computed<EntitlementKey[]>(() => Object.values(ENTITLEMENT) as EntitlementKey[]);

const supportedCountries = SUPPORTED_COUNTRIES.map((code) => ({
  code,
  currency: COUNTRY_CURRENCY[code]
}));

const getFractionDigits = (currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).resolvedOptions().maximumFractionDigits;
  } catch (error) {
    console.warn('[plan-builder] Unable to resolve fraction digits for currency', currency, error);
    return 2;
  }
};

const convertMinorToMajor = (amountMinor: number | null | undefined, currency: string) => {
  if (amountMinor === null || amountMinor === undefined) {
    return null;
  }
  const digits = getFractionDigits(currency);
  return amountMinor / Math.pow(10, digits);
};

const formatMajorFromMinor = (amountMinor: number | null | undefined, currency: string) => {
  const major = convertMinorToMajor(amountMinor, currency);
  if (major === null) {
    return '';
  }
  const digits = getFractionDigits(currency);
  return major.toFixed(digits);
};

const parseMajorAmount = (value: string, currency: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = Number.parseFloat(trimmed.replace(/,/g, ''));
  if (!Number.isFinite(normalized)) {
    return null;
  }
  const digits = getFractionDigits(currency);
  const factor = Math.pow(10, digits);
  return Math.round(normalized * factor);
};

const pricingAmountStep = (currency: string) => {
  const digits = getFractionDigits(currency);
  if (digits <= 0) {
    return '1';
  }
  return `0.${'0'.repeat(digits - 1)}1`;
};

const hasAmountValue = (state: PricingFormState) => state.amountMajor.trim().length > 0;

const normalizedPlanCode = (code?: string | null) => (code ?? '').trim().toLowerCase();

const marketingLocales = computed(() => {
  const extras = Object.keys(templateForm.marketingCopy)
    .filter((key) => !MARKETING_LOCALES.includes(key as MarketingLocale))
    .sort((a, b) => a.localeCompare(b, locale.value));
  return [...MARKETING_LOCALES, ...extras];
});

const marketingLocaleLabel = (localeKey: string) => {
  const normalized = localeKey.toLowerCase();
  if (normalized === 'ar') {
    return t('adminPlanBuilder.marketing.locales.ar');
  }
  if (normalized === 'en') {
    return t('adminPlanBuilder.marketing.locales.en');
  }
  return localeKey;
};

const ensureMarketingEntry = (localeKey: string): MarketingCopyForm => {
  const key = localeKey.trim();
  if (!templateForm.marketingCopy[key]) {
    templateForm.marketingCopy[key] = { tagline: '', bestFor: '', includes: [] };
  }
  return templateForm.marketingCopy[key];
};

const getMarketingIncludesText = (localeKey: string) => ensureMarketingEntry(localeKey).includes.join('\n');

const updateMarketingIncludes = (localeKey: string, value: string) => {
  const entry = ensureMarketingEntry(localeKey);
  entry.includes = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const templateSnapshots = ref(new Map<string, PlanTemplateSummary>());

const teachers = ref<TeacherSummary[]>([]);
const loadingTeachers = ref(false);
const teacherLoadError = ref<string | null>(null);

const teacherOptions = computed(() => {
  return [...teachers.value].sort((a, b) => {
    const nameA = a.name?.trim() || a.slug;
    const nameB = b.name?.trim() || b.slug;
    const comparison = nameA.localeCompare(nameB);
    return comparison !== 0 ? comparison : a.slug.localeCompare(b.slug);
  });
});

const formatDate = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(date);
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const formatBytes = (bytes: number) => {
  const safe = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  if (safe === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(safe) / Math.log(1024)));
  const value = safe / 1024 ** index;
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[index]}`;
};

const formatPayload = (payload: unknown) => {
  if (!payload) {
    return 'No payload.';
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch (error) {
    return String(payload);
  }
};

const normalizeDateTimeForApi = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
};

const isoDateOnly = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10);
};

const assignmentStatusLabel = (status: PlanTemplateAssignmentSummary['status']) =>
  t(`adminPlanBuilder.assignmentList.status.${status}`);

const assignmentStatusColor = (status: PlanTemplateAssignmentSummary['status']) => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'SCHEDULED':
      return 'info';
    case 'INACTIVE':
      return 'warning';
    default:
      return 'secondary';
  }
};

const normalizeDateForApi = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const iso = `${trimmed}T00:00:00Z`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
};

const normalizeBulkSlugs = (value: string) => {
  return value
    .split(/[\s,;]+/)
    .map((slug) => slug.trim().toLowerCase())
    .filter((slug) => slug.length > 0);
};

const templateForm = reactive({
  displayName: '',
  billingPeriod: '',
  price: null as number | null,
  currency: '',
  region: '',
  features: {} as Record<string, boolean>,
  entitlements: {} as Record<EntitlementKey, number | string | null>,
  marketingCopy: {} as Record<string, MarketingCopyForm>
});

MARKETING_LOCALES.forEach((localeKey) => {
  templateForm.marketingCopy[localeKey] = { tagline: '', bestFor: '', includes: [] };
});

const assignmentForm = reactive({
  tenantSlug: '',
  templateKey: '',
  effectiveFrom: '',
  effectiveTo: '',
  pinned: false,
  bulkMode: false,
  bulkSlugs: '',
  dryRun: false
});

const assignmentPreview = ref<PlanAssignmentPreviewResponse | null>(null);
const assignmentPreviewLoading = ref(false);
const assignmentPreviewError = ref<string | null>(null);

const reconciliationStatus = ref<VideoStorageReconciliationStatus | null>(null);
const reconciliationLoading = ref(false);
const reconciliationError = ref<string | null>(null);

const backfillStatus = ref<VideoStorageSizeBackfillStatus | null>(null);
const backfillLoading = ref(false);
const backfillError = ref<string | null>(null);
const backfillRunning = ref(false);

const exportLoading = ref(false);
const importLoading = ref(false);
const importError = ref<string | null>(null);
const bulkAssignResult = ref<BulkAssignTenantPlanResponse | null>(null);

const planAuditItems = ref<AuditLogEntry[]>([]);
const planAuditLoading = ref(false);
const planAuditError = ref<string | null>(null);
const planAuditPage = ref(0);
const planAuditSize = ref(20);
const planAuditTotal = ref(0);
const planAuditFilters = reactive({
  planCode: '',
  teacherSlug: '',
  from: '',
  to: ''
});
const planAuditDialog = reactive({
  open: false,
  itemId: null as number | null
});

const endDialog = reactive({
  open: false,
  assignment: null as PlanTemplateAssignmentSummary | null,
  effectiveTo: '',
  submitting: false,
  error: null as string | null
});

const selectedTemplate = computed(() => {
  if (!selectedTemplateId.value) {
    return null;
  }
  const [code, version] = selectedTemplateId.value.split('::');
  return templates.value.find((template) => template.code === code && String(template.version) === version) ?? null;
});

const selectedPlanAuditItem = computed(() => {
  if (planAuditDialog.itemId == null) {
    return null;
  }
  return planAuditItems.value.find((item) => item.id === planAuditDialog.itemId) ?? null;
});

const planAuditTotalPages = computed(() => {
  if (planAuditTotal.value === 0) {
    return 0;
  }
  return Math.ceil(planAuditTotal.value / planAuditSize.value);
});

const isTemplateReadOnly = computed(() => selectedTemplate.value?.status === 'PUBLISHED');

const publishedTemplates = computed(() => templates.value.filter((template) => template.status === 'PUBLISHED'));
const availableAssignmentTemplates = computed(() =>
  assignmentForm.pinned ? templates.value : publishedTemplates.value
);

const planAuditHeaders = computed(() => [
  { title: t('adminPlanBuilder.audit.columns.action'), key: 'action' },
  { title: t('adminPlanBuilder.audit.columns.actor'), key: 'actor' },
  { title: t('adminPlanBuilder.audit.columns.entity'), key: 'entity' },
  { title: t('adminPlanBuilder.audit.columns.created'), key: 'createdAt' },
  { title: t('adminPlanBuilder.audit.columns.actions'), key: 'actions', sortable: false }
]);

watch(teachers, (list) => {
  if (assignmentForm.tenantSlug && !list.some((teacher) => teacher.slug === assignmentForm.tenantSlug)) {
    assignmentForm.tenantSlug = '';
  }
});

watch(
  teacherScopedOptions,
  () => {
    pruneTeacherScopedOptions();
  },
  { deep: true }
);

watch(selectedTemplate, (template) => {
  void loadAssignments(template);
  if (template?.status === 'PUBLISHED') {
    assignmentForm.templateKey = templateKey(template);
  }
  hydratePricingForms(template?.code ?? null);
  planAuditFilters.planCode = template?.code ?? '';
  planAuditPage.value = 0;
  void loadPlanAudit(true);
});

watch(
  () => planAuditDialog.open,
  (open) => {
    if (!open) {
      planAuditDialog.itemId = null;
    }
  }
);

watch(
  () => [assignmentForm.tenantSlug, assignmentForm.templateKey, assignmentForm.bulkMode],
  () => {
    void loadAssignmentPreview();
  }
);

watch(
  () => assignmentForm.bulkMode,
  (bulkMode) => {
    if (!bulkMode) {
      assignmentForm.dryRun = false;
    }
  }
);

watch(
  () => assignmentForm.pinned,
  () => {
    if (
      assignmentForm.templateKey &&
      !availableAssignmentTemplates.value.some((template) => templateKey(template) === assignmentForm.templateKey)
    ) {
      assignmentForm.templateKey = '';
    }
  }
);

watch(featureCatalog, () => {
  const template = selectedTemplate.value;
  if (template) {
    applyTemplateToForm(template);
  }
});

watch(
  () => pricingIndex.value,
  () => {
    hydratePricingForms();
  }
);

const hasChanges = computed(() => {
  const template = selectedTemplate.value;
  if (!template) {
    return false;
  }
  if (template.status === 'PUBLISHED') {
    return false;
  }
  const snapshot = templateSnapshots.value.get(templateKey(template));
  if (!snapshot) {
    return true;
  }
  return (
    snapshot.displayName !== templateForm.displayName ||
    (snapshot.billingPeriod || '') !== (templateForm.billingPeriod || '') ||
    (snapshot.currency || '') !== (templateForm.currency || '') ||
    (snapshot.region || '') !== (templateForm.region || '') ||
    (snapshot.price ?? null) !== (templateForm.price ?? null) ||
    featureCatalog.value.some((code) => normalizeBoolean(snapshot.features.find((feature) => feature.featureCode === code)?.enabled) !== normalizeBoolean(templateForm.features[code])) ||
    entitlementCatalog.value.some(
      (key) => normalizeEntitlementValue(key, snapshot.entitlements.find((entry) => entry.entitlementKey === key)?.value) !== normalizeEntitlementValue(key, templateForm.entitlements[key])
    ) ||
    marketingCopyChanged(snapshot.marketingCopy, templateForm.marketingCopy)
  );
});

const normalizeBoolean = (value: unknown) => value === true;
const normalizeEntitlementValue = (key: EntitlementKey, value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (key === 'video_resolution_policy') {
    if (typeof value !== 'string') {
      return null;
    }
    const normalized = value.trim().toLowerCase();
    return normalized.length ? normalized : null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeLocaleKey = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
};

const normalizeMarketingText = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  return trimmed;
};

const normalizeMarketingIncludes = (values?: readonly string[] | null) => {
  return (values ?? [])
    .map((item) => (item ?? '').trim())
    .filter((item): item is string => item.length > 0);
};

const normalizeMarketingFromSnapshot = (content?: PlanTemplateMarketingContent | null) => ({
  tagline: normalizeMarketingText(content?.tagline ?? null),
  bestFor: normalizeMarketingText(content?.bestFor ?? null),
  includes: normalizeMarketingIncludes(content?.includes ?? [])
});

const normalizeMarketingFromForm = (content?: MarketingCopyForm | null) => ({
  tagline: normalizeMarketingText(content?.tagline ?? ''),
  bestFor: normalizeMarketingText(content?.bestFor ?? ''),
  includes: normalizeMarketingIncludes(content?.includes ?? [])
});

const marketingCopyChanged = (
  snapshot: Record<string, PlanTemplateMarketingContent> | undefined,
  formCopy: Record<string, MarketingCopyForm>
) => {
  const snapshotMap = new Map<string, ReturnType<typeof normalizeMarketingFromSnapshot>>();
  if (snapshot) {
    Object.entries(snapshot).forEach(([key, value]) => {
      const localeKey = normalizeLocaleKey(key);
      if (!localeKey || !value) {
        return;
      }
      snapshotMap.set(localeKey, normalizeMarketingFromSnapshot(value));
    });
  }
  const formMap = new Map<string, ReturnType<typeof normalizeMarketingFromForm>>();
  Object.entries(formCopy).forEach(([key, value]) => {
    const localeKey = normalizeLocaleKey(key);
    if (!localeKey || !value) {
      return;
    }
    formMap.set(localeKey, normalizeMarketingFromForm(value));
  });
  const localeKeys = new Set<string>([...snapshotMap.keys(), ...formMap.keys()]);
  for (const localeKey of localeKeys) {
    const snapshotValue = snapshotMap.get(localeKey) ?? { tagline: '', bestFor: '', includes: [] };
    const formValue = formMap.get(localeKey) ?? { tagline: '', bestFor: '', includes: [] };
    if (snapshotValue.tagline !== formValue.tagline || snapshotValue.bestFor !== formValue.bestFor) {
      return true;
    }
    if (snapshotValue.includes.length !== formValue.includes.length) {
      return true;
    }
    for (let index = 0; index < snapshotValue.includes.length; index += 1) {
      if (snapshotValue.includes[index] !== formValue.includes[index]) {
        return true;
      }
    }
  }
  return false;
};

const defaultFeatureLabel = (code: string) => (isFeatureCode(code) ? FEATURE_LABELS[code] : code);
const featureLabel = (code: string) =>
  featureOptions.value.find((item) => item.code === code)?.name ?? defaultFeatureLabel(code);
const pruneTeacherScopedOptions = () => {
  const teacherScoped = teacherScopedCodes.value;
  if (!teacherScoped.size) {
    return;
  }
  const filtered = featureOptions.value.filter((option) => !teacherScoped.has(option.code));
  if (filtered.length !== featureOptions.value.length) {
    featureOptions.value = filtered;
  }
};
const mergeFeatureOptions = (options: FeatureOption[]) => {
  if (!options.length) {
    return;
  }
  const teacherScoped = teacherScopedCodes.value;
  const existing = new Map(
    featureOptions.value
      .filter((item) => !teacherScoped.has(item.code))
      .map((item) => [item.code.toLowerCase(), item])
  );
  let changed = false;
  for (const option of options) {
    const code = option.code?.trim();
    if (!code || teacherScoped.has(code)) {
      continue;
    }
    const key = code.toLowerCase();
    const name = option.name?.trim() || defaultFeatureLabel(code);
    const current = existing.get(key);
    if (!current) {
      existing.set(key, { code, name });
      changed = true;
    } else if (current.name !== name || current.code !== code) {
      existing.set(key, { code: current.code, name });
      changed = true;
    }
  }
  const filtered = Array.from(existing.values()).filter((item) => !teacherScoped.has(item.code));
  if (changed || filtered.length !== featureOptions.value.length) {
    featureOptions.value = filtered.sort((a, b) => a.name.localeCompare(b.name, locale.value));
  }
};
const templateKey = (template: PlanTemplateSummary) => `${template.code}::${template.version}`;

const applyTemplateToForm = (template: PlanTemplateSummary | null) => {
  if (!template) {
    templateForm.displayName = '';
    templateForm.billingPeriod = '';
    templateForm.price = null;
    templateForm.currency = '';
    templateForm.region = '';
    templateForm.features = {} as Record<string, boolean>;
    templateForm.entitlements = {} as Record<EntitlementKey, number | string | null>;
    templateForm.marketingCopy = {} as Record<string, MarketingCopyForm>;
    MARKETING_LOCALES.forEach((localeKey) => {
      templateForm.marketingCopy[localeKey] = { tagline: '', bestFor: '', includes: [] };
    });
    hydratePricingForms(null);
    return;
  }
  templateForm.displayName = template.displayName;
  templateForm.billingPeriod = template.billingPeriod ?? '';
  templateForm.price = template.price ?? null;
  templateForm.currency = template.currency ?? '';
  templateForm.region = template.region ?? '';
  mergeFeatureOptions(
    template.features.map((feature) => ({
      code: feature.featureCode,
      name: defaultFeatureLabel(feature.featureCode)
    }))
  );
  templateForm.features = featureCatalog.value.reduce<Record<string, boolean>>((acc, code) => {
    acc[code] = normalizeBoolean(template.features.find((feature) => feature.featureCode === code)?.enabled);
    return acc;
  }, {} as Record<string, boolean>);
  templateForm.entitlements = entitlementCatalog.value.reduce<Record<EntitlementKey, number | string | null>>((acc, key) => {
    const entry = template.entitlements.find((value) => value.entitlementKey === key);
    acc[key] = entry ? normalizeEntitlementValue(key, entry.value) : null;
    return acc;
  }, {} as Record<EntitlementKey, number | string | null>);
  const marketingCopy: Record<string, MarketingCopyForm> = {};
  Object.entries(template.marketingCopy ?? {}).forEach(([localeKey, content]) => {
    const normalizedKey = normalizeLocaleKey(localeKey);
    if (!normalizedKey || !content) {
      return;
    }
    const normalizedContent = normalizeMarketingFromSnapshot(content);
    marketingCopy[normalizedKey] = {
      tagline: normalizedContent.tagline,
      bestFor: normalizedContent.bestFor,
      includes: [...normalizedContent.includes]
    };
  });
  MARKETING_LOCALES.forEach((localeKey) => {
    if (!marketingCopy[localeKey]) {
      marketingCopy[localeKey] = { tagline: '', bestFor: '', includes: [] };
    }
  });
  templateForm.marketingCopy = marketingCopy;
};

const hydratePricingForms = (planCode?: string | null) => {
  const normalized = normalizedPlanCode(planCode ?? selectedTemplate.value?.code ?? null);
  const entry = normalized ? pricingIndex.value.get(normalized) ?? null : null;
  SUPPORTED_COUNTRIES.forEach((country) => {
    const state = pricingForms[country];
    const currency = COUNTRY_CURRENCY[country];
    const price = entry?.prices.find((item) => item.country?.toUpperCase() === country) ?? null;
    state.currency = currency;
    state.amountMajor = formatMajorFromMinor(price?.amountMinor ?? null, currency);
    state.active = price?.active ?? false;
    state.stripePriceId = price?.stripePriceId ?? '';
    state.formattedAmount = price?.formattedAmount ?? null;
    state.lastUpdated = price?.updatedAt ?? null;
    state.error = null;
  });
};

const updatePricingIndex = (entry: AdminPlanPricing) => {
  if (!entry?.planCode) {
    return;
  }
  const normalized = normalizedPlanCode(entry.planCode);
  if (!normalized) {
    return;
  }
  const next = new Map(pricingIndex.value);
  next.set(normalized, entry);
  pricingIndex.value = next;
};

const selectTemplate = (template: PlanTemplateSummary) => {
  selectedTemplateId.value = templateKey(template);
  applyTemplateToForm(template);
  hydratePricingForms(template.code);
};

const resetForm = () => {
  applyTemplateToForm(selectedTemplate.value);
};

const entitlementLabel = (key: EntitlementKey) => ENTITLEMENT_LABELS[key];
const isResolutionPolicyEntitlement = (key: EntitlementKey) => key === 'video_resolution_policy';

const loadPlanPricing = async () => {
  pricingLoading.value = true;
  pricingError.value = null;
  try {
    const data = await fetchAdminPlanPricing();
    const next = new Map<string, AdminPlanPricing>();
    data.forEach((entry) => {
      if (entry?.planCode) {
        next.set(normalizedPlanCode(entry.planCode), entry);
      }
    });
    pricingIndex.value = next;
    hydratePricingForms();
  } catch (error) {
    console.error('[plan-builder] unable to load plan pricing', error);
    pricingError.value = t('adminPlanBuilder.pricing.errors.loadFailed');
  } finally {
    pricingLoading.value = false;
  }
};

const loadTemplates = async () => {
  loading.value = true;
  loadError.value = null;
  try {
    const data = await listPlanTemplates();
    templates.value = data;
    mergeFeatureOptions(
      data.flatMap((template) =>
        template.features.map((feature) => ({
          code: feature.featureCode,
          name: defaultFeatureLabel(feature.featureCode)
        }))
      )
    );
    templateSnapshots.value = new Map(data.map((template) => [templateKey(template), template]));
    if (assignmentForm.templateKey) {
      const exists = data.some((template) => templateKey(template) === assignmentForm.templateKey);
      if (!exists) {
        assignmentForm.templateKey = '';
      }
    }
    if (!assignmentForm.templateKey) {
      const firstPublished = data.find((template) => template.status === 'PUBLISHED');
      if (firstPublished) {
        assignmentForm.templateKey = templateKey(firstPublished);
      }
    }
    if (!selectedTemplateId.value && data.length > 0) {
      selectTemplate(data[0]);
    } else {
      applyTemplateToForm(selectedTemplate.value);
      void loadAssignments(selectedTemplate.value);
    }
  } catch (error) {
    console.error('[plan-builder] failed to load templates', error);
    loadError.value = t('adminPlanBuilder.errors.loadFailed');
  } finally {
    loading.value = false;
  }
};

const loadTeachers = async () => {
  loadingTeachers.value = true;
  teacherLoadError.value = null;
  try {
    teachers.value = await fetchTeacherSummaries();
  } catch (error) {
    console.error('[plan-builder] unable to load teachers', error);
    teacherLoadError.value = t('adminPlanBuilder.errors.teachersLoadFailed');
    toast.error({ detail: t('adminPlanBuilder.errors.teachersLoadFailed') });
  } finally {
    loadingTeachers.value = false;
  }
};

const loadAssignmentPreview = async () => {
  assignmentPreviewError.value = null;
  assignmentPreview.value = null;
  if (assignmentForm.bulkMode) {
    return;
  }
  const tenantSlug = assignmentForm.tenantSlug.trim();
  if (!tenantSlug || !assignmentForm.templateKey) {
    return;
  }
  const [planCode, version] = assignmentForm.templateKey.split('::');
  assignmentPreviewLoading.value = true;
  try {
    assignmentPreview.value = await previewTenantPlanAssignment(tenantSlug, {
      planCode,
      version: Number(version)
    });
  } catch (error) {
    console.error('[plan-builder] unable to load assignment preview', error);
    assignmentPreviewError.value = 'Unable to load assignment preview.';
  } finally {
    assignmentPreviewLoading.value = false;
  }
};

const loadReconciliationStatus = async () => {
  reconciliationLoading.value = true;
  reconciliationError.value = null;
  try {
    reconciliationStatus.value = await fetchVideoStorageReconciliationStatus();
  } catch (error) {
    console.error('[plan-builder] unable to load reconciliation status', error);
    reconciliationError.value = 'Unable to load reconciliation status.';
  } finally {
    reconciliationLoading.value = false;
  }
};

const loadBackfillStatus = async () => {
  backfillLoading.value = true;
  backfillError.value = null;
  try {
    backfillStatus.value = await fetchVideoStorageSizeBackfillStatus();
  } catch (error) {
    console.error('[plan-builder] unable to load backfill status', error);
    backfillError.value = 'Unable to load backfill status.';
  } finally {
    backfillLoading.value = false;
  }
};

const loadFeatureCatalog = async () => {
  try {
    const features = await listAdminFeatures();
    teacherScopedOptions.value = features
      .filter((feature) => feature.teacherScoped)
      .map((feature) => ({
        code: feature.code,
        name: feature.name?.trim() || defaultFeatureLabel(feature.code)
      }));
    pruneTeacherScopedOptions();
    mergeFeatureOptions(
      features
        .filter((feature) => !feature.teacherScoped)
        .map((feature) => ({
          code: feature.code,
          name: feature.name
        }))
    );
  } catch (error) {
    console.error('[plan-builder] failed to load feature catalog', error);
  }
  if (FALLBACK_FEATURE_OPTIONS.length) {
    mergeFeatureOptions(FALLBACK_FEATURE_OPTIONS);
  }
};

const loadAssignments = async (template: PlanTemplateSummary | null) => {
  assignmentsLoading.value = true;
  assignmentsError.value = null;
  assignments.value = [];
  if (!template) {
    assignmentsLoading.value = false;
    return;
  }
  try {
    assignments.value = await listPlanTemplateAssignments(template.code, template.version);
    if (endDialog.open && (!endDialog.assignment || endDialog.assignment.planCode !== template.code || endDialog.assignment.version !== template.version)) {
      closeEndDialog();
    }
  } catch (error) {
    console.error('[plan-builder] unable to load assignments', error);
    assignmentsError.value = t('adminPlanBuilder.errors.assignmentsLoadFailed');
  } finally {
    assignmentsLoading.value = false;
  }
};

const triggerBackfill = async () => {
  if (backfillRunning.value) {
    return;
  }
  backfillRunning.value = true;
  backfillError.value = null;
  try {
    const result = await triggerVideoStorageSizeBackfill({ batchSize: 200, maxRecords: 2000, reconcile: true });
    toast.success({
      detail: t('adminPlanBuilder.backfill.success', {
        updated: result.updated,
        processed: result.processed
      })
    });
  } catch (error) {
    console.error('[plan-builder] unable to trigger backfill', error);
    backfillError.value = t('adminPlanBuilder.backfill.errors.runFailed');
    toast.error({ detail: t('adminPlanBuilder.backfill.errors.runFailed') });
  } finally {
    backfillRunning.value = false;
    void loadBackfillStatus();
  }
};

const loadPlanAudit = async (resetPage = false) => {
  if (resetPage) {
    planAuditPage.value = 0;
  }
  planAuditLoading.value = true;
  planAuditError.value = null;
  try {
    const response: PageResponse<AuditLogEntry> = await listPlanAuditLogs({
      planCode: planAuditFilters.planCode || undefined,
      teacherSlug: planAuditFilters.teacherSlug || undefined,
      from: normalizeDateTimeForApi(planAuditFilters.from),
      to: normalizeDateTimeForApi(planAuditFilters.to),
      page: planAuditPage.value,
      size: planAuditSize.value
    });
    planAuditItems.value = response.items ?? [];
    planAuditPage.value = response.page ?? planAuditPage.value;
    planAuditSize.value = response.size ?? planAuditSize.value;
    planAuditTotal.value = response.totalElements ?? planAuditItems.value.length;
  } catch (error) {
    console.error('[plan-builder] unable to load plan audit logs', error);
    planAuditError.value = 'Unable to load plan audit logs.';
  } finally {
    planAuditLoading.value = false;
  }
};

const openEndDialog = (assignment: PlanTemplateAssignmentSummary) => {
  if (!assignment.teacherSlug) {
    toast.warn({ detail: t('adminPlanBuilder.errors.missingTeacher') });
    return;
  }
  endDialog.assignment = assignment;
  endDialog.effectiveTo = isoDateOnly(assignment.effectiveTo);
  endDialog.error = null;
  endDialog.submitting = false;
  endDialog.open = true;
};

const closeEndDialog = () => {
  endDialog.open = false;
  endDialog.assignment = null;
  endDialog.effectiveTo = '';
  endDialog.error = null;
  endDialog.submitting = false;
};

const applyPlanAuditFilters = () => {
  void loadPlanAudit(true);
};

const resetPlanAuditFilters = () => {
  planAuditFilters.planCode = selectedTemplate.value?.code ?? '';
  planAuditFilters.teacherSlug = '';
  planAuditFilters.from = '';
  planAuditFilters.to = '';
  void loadPlanAudit(true);
};

const changePlanAuditPage = (next: number) => {
  if (next < 0 || next === planAuditPage.value) {
    return;
  }
  planAuditPage.value = next;
  void loadPlanAudit();
};

const openPlanAuditDetail = (item: AuditLogEntry) => {
  planAuditDialog.itemId = item.id ?? null;
  planAuditDialog.open = true;
};

const submitEndDialog = async () => {
  const assignment = endDialog.assignment;
  if (!assignment || !assignment.teacherSlug) {
    endDialog.error = t('adminPlanBuilder.errors.missingTeacher');
    return;
  }
  const trimmed = endDialog.effectiveTo.trim();
  const effectiveTo = normalizeDateForApi(trimmed || null);
  if (trimmed && !effectiveTo) {
    endDialog.error = t('adminPlanBuilder.errors.invalidDate');
    return;
  }
  endDialog.submitting = true;
  endDialog.error = null;
  try {
    await endTenantPlanTemplateAssignment({
      tenantSlug: assignment.teacherSlug,
      effectiveTo
    });
    toast.success({ detail: t('adminPlanBuilder.notifications.assignmentEnded') });
    closeEndDialog();
    await loadAssignments(selectedTemplate.value);
  } catch (error) {
    console.error('[plan-builder] unable to end assignment', error);
    endDialog.error = t('adminPlanBuilder.errors.assignmentEndFailed');
  } finally {
    endDialog.submitting = false;
  }
};

const savePricingForCountry = async (country: SupportedCountry) => {
  const template = selectedTemplate.value;
  if (!template) {
    return;
  }
  const state = pricingForms[country];
  state.error = null;
  if (!hasAmountValue(state)) {
    state.error = t('adminPlanBuilder.pricing.errors.missingAmount');
    return;
  }
  const amountMinor = parseMajorAmount(state.amountMajor, state.currency);
  if (amountMinor === null || Number.isNaN(amountMinor) || amountMinor < 0) {
    state.error = t('adminPlanBuilder.pricing.errors.invalidAmount');
    return;
  }
  state.saving = true;
  try {
    const response = await updateAdminPlanPrice(template.code, country, {
      currency: state.currency,
      amountMinor,
      active: state.active,
      stripePriceId: state.stripePriceId.trim() ? state.stripePriceId.trim() : null
    });
    updatePricingIndex(response);
    hydratePricingForms(response.planCode);
    toast.success({
      detail: t('adminPlanBuilder.pricing.notifications.updated', {
        plan: response.planName,
        country: t(`adminPlanBuilder.pricing.countries.${country}`)
      })
    });
  } catch (error) {
    console.error('[plan-builder] failed to update plan pricing', error);
    state.error = t('adminPlanBuilder.pricing.errors.updateFailed');
    toast.error({ detail: t('adminPlanBuilder.pricing.errors.updateFailed') });
  } finally {
    state.saving = false;
  }
};

const saveTemplate = async () => {
  const template = selectedTemplate.value;
  if (!template) {
    return;
  }
  if (template.status === 'PUBLISHED') {
    toast.warn({ detail: t('adminPlanBuilder.errors.publishedLocked') });
    return;
  }
  const normalizedCurrency = templateForm.currency?.trim() ?? '';
  if (normalizedCurrency.length > 8) {
    toast.error({ detail: t('adminPlanBuilder.errors.currencyTooLong') });
    return;
  }

  saving.value = true;
  try {
    const teacherScoped = teacherScopedCodes.value;
    const allowedFeatureCodes = new Set(
      [...featureCatalog.value, ...template.features.map((feature) => feature.featureCode)].filter(
        (code): code is string => !!code && !teacherScoped.has(code)
      )
    );
    const featuresPayload = Array.from(allowedFeatureCodes).reduce<Record<string, boolean>>((acc, code) => {
      const normalizedCode = code?.trim();
      if (!normalizedCode) {
        return acc;
      }
      acc[normalizedCode] = normalizeBoolean(templateForm.features[normalizedCode]);
      return acc;
    }, {} as Record<string, boolean>);
    const marketingPayload = Object.entries(templateForm.marketingCopy).reduce<Record<string, PlanTemplateMarketingContent>>(
      (acc, [localeKey, content]) => {
        const normalizedKey = normalizeLocaleKey(localeKey);
        if (!normalizedKey) {
          return acc;
        }
        const normalizedContent = normalizeMarketingFromForm(content);
        const tagline = normalizedContent.tagline || null;
        const bestFor = normalizedContent.bestFor || null;
        const includes = normalizedContent.includes;
        if (!tagline && !bestFor && includes.length === 0) {
          return acc;
        }
        acc[normalizedKey] = {
          tagline,
          bestFor,
          includes
        };
        return acc;
      },
      {} as Record<string, PlanTemplateMarketingContent>
    );
    const payload = {
      displayName: templateForm.displayName,
      billingPeriod: templateForm.billingPeriod || null,
      price: templateForm.price,
      currency: normalizedCurrency || null,
      region: templateForm.region || null,
      features: featuresPayload,
      entitlements: templateForm.entitlements,
      marketingCopy: marketingPayload
    };
    const updated = await updatePlanTemplate(template.code, template.version, payload);
    const nextTemplates = templates.value.map((item) => (templateKey(item) === templateKey(template) ? updated : item));
    templates.value = nextTemplates;
    templateSnapshots.value.set(templateKey(updated), updated);
    applyTemplateToForm(updated);
    toast.success({ detail: t('adminPlanBuilder.notifications.saved') });
  } catch (error) {
    console.error('[plan-builder] failed to save template', error);
    toast.error({ detail: t('adminPlanBuilder.errors.saveFailed') });
  } finally {
    saving.value = false;
  }
};

const cloneSelected = async () => {
  const template = selectedTemplate.value;
  if (!template) {
    return;
  }
  cloning.value = true;
  try {
    const cloned = await clonePlanTemplate(template.code, {
      sourceVersion: template.version,
      displayName: `${template.displayName} ${t('adminPlanBuilder.templates.cloneSuffix', { version: template.version + 1 })}`
    });
    await loadTemplates();
    selectTemplate(cloned);
    toast.success({ detail: t('adminPlanBuilder.notifications.cloned') });
  } catch (error) {
    console.error('[plan-builder] unable to clone template', error);
    toast.error({ detail: t('adminPlanBuilder.errors.cloneFailed') });
  } finally {
    cloning.value = false;
  }
};

const publishSelected = async () => {
  const template = selectedTemplate.value;
  if (!template) {
    return;
  }
  publishing.value = true;
  try {
    const published = await publishPlanTemplate(template.code, { version: template.version });
    await loadTemplates();
    selectTemplate(published);
    toast.success({ detail: t('adminPlanBuilder.notifications.published') });
  } catch (error) {
    console.error('[plan-builder] unable to publish template', error);
    toast.error({ detail: t('adminPlanBuilder.errors.publishFailed') });
  } finally {
    publishing.value = false;
  }
};

const exportSelected = async () => {
  const template = selectedTemplate.value;
  if (!template) {
    return;
  }
  exportLoading.value = true;
  try {
    const payload: PlanTemplateExportResponse = await exportPlanTemplate(template.code, template.version);
    const filename = `plan-${payload.planCode}-v${payload.version}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success({ detail: 'Plan template exported.' });
  } catch (error) {
    console.error('[plan-builder] export failed', error);
    toast.error({ detail: 'Unable to export plan template.' });
  } finally {
    exportLoading.value = false;
  }
};

const escapeCsvValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const downloadCsv = (filename: string, rows: Array<Array<unknown>>) => {
  const content = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportAssignmentsCsv = () => {
  if (!assignments.value.length) {
    toast.warn({ detail: 'No assignments to export.' });
    return;
  }
  const template = selectedTemplate.value;
  const filename = template
    ? `plan-assignments-${template.code}-v${template.version}.csv`
    : 'plan-assignments.csv';
  const rows = [
    ['teacherSlug', 'teacherName', 'planCode', 'version', 'status', 'effectiveFrom', 'effectiveTo', 'updatedAt', 'pinned'],
    ...assignments.value.map((assignment) => [
      assignment.teacherSlug ?? '',
      assignment.teacherName ?? '',
      assignment.planCode,
      assignment.version,
      assignment.status,
      assignment.effectiveFrom,
      assignment.effectiveTo ?? '',
      assignment.updatedAt,
      assignment.pinned ? 'yes' : 'no'
    ])
  ];
  downloadCsv(filename, rows);
};

const exportBulkAssignCsv = () => {
  const result = bulkAssignResult.value;
  if (!result) {
    toast.warn({ detail: 'No bulk assignment results to export.' });
    return;
  }
    const previews = new Map(
      (result.previews ?? []).map((preview) => [preview.tenantSlug, preview])
    );
    const rows: Array<Array<unknown>> = [
      [
        'tenantSlug',
        'status',
        'assigned',
        'error',
        'students',
        'studentLimit',
        'storageUsed',
        'storageLimit',
        'storageSizeUsed',
        'storageSizeLimit',
        'streamingUsed',
        'streamingLimit',
        'warnings'
      ]
    ];
    const results: BulkAssignTenantPlanResult[] = result.results ?? [];
    if (results.length) {
      results.forEach((item) => {
        const preview = previews.get(item.tenantSlug);
        rows.push([
        item.tenantSlug,
        item.status,
        item.assigned ? 'yes' : 'no',
        item.error ?? '',
          preview?.studentCount ?? '',
          preview?.studentLimit ?? '',
          preview?.storageSecondsUsed ?? '',
          preview?.storageSecondsLimit ?? '',
          preview?.storageBytesUsed ?? '',
          preview?.storageBytesLimit ?? '',
          preview?.streamingMinutesUsed ?? '',
          preview?.streamingMinutesLimit ?? '',
          preview?.warnings?.join('; ') ?? ''
        ]);
      });
    } else {
      result.errors?.forEach((error) => {
        rows.push([error.tenantSlug, 'FAILED', 'no', error.error ?? '', '', '', '', '', '', '', '', '', '']);
      });
    }
  const filename = `bulk-assign-results-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(filename, rows);
};

const triggerImport = () => {
  importError.value = null;
  importInputRef.value?.click();
};

const handleImportFile = async (event: Event) => {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!file) {
    return;
  }
  importLoading.value = true;
  importError.value = null;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const created = await importPlanTemplate(parsed);
    toast.success({ detail: 'Plan template imported.' });
    await loadTemplates();
    selectTemplate(created);
  } catch (error) {
    console.error('[plan-builder] import failed', error);
    importError.value = 'Unable to import plan template.';
    toast.error({ detail: importError.value });
  } finally {
    importLoading.value = false;
    if (input) {
      input.value = '';
    }
  }
};

const assignPlan = async () => {
  if (!assignmentForm.templateKey) {
    return;
  }
  assigning.value = true;
  bulkAssignResult.value = null;
  try {
    const [code, version] = assignmentForm.templateKey.split('::');
    const effectiveFrom = normalizeDateForApi(assignmentForm.effectiveFrom);
    const effectiveTo = normalizeDateForApi(assignmentForm.effectiveTo);
    if (assignmentForm.bulkMode) {
      const slugs = normalizeBulkSlugs(assignmentForm.bulkSlugs);
      if (slugs.length === 0) {
        toast.error({ detail: 'Please enter at least one teacher slug.' });
        assigning.value = false;
        return;
      }
      bulkAssignResult.value = await bulkAssignTenantPlanTemplate({
        tenantSlugs: slugs,
        planCode: code,
        version: Number(version),
        effectiveFrom,
        effectiveTo,
        pinned: assignmentForm.pinned,
        dryRun: assignmentForm.dryRun
      });
      if (bulkAssignResult.value.dryRun) {
        toast.info({
          detail: `Previewed ${bulkAssignResult.value.successCount} of ${bulkAssignResult.value.total} teachers.`
        });
      } else {
        toast.success({
          detail: `Assigned to ${bulkAssignResult.value.successCount} of ${bulkAssignResult.value.total} teachers.`
        });
        await loadAssignments(selectedTemplate.value);
      }
    } else {
      const tenantSlug = assignmentForm.tenantSlug.trim();
      if (!tenantSlug) {
        toast.error({ detail: t('adminPlanBuilder.errors.missingTeacher') });
        assigning.value = false;
        return;
      }
      await assignTenantPlanTemplate({
        tenantSlug,
        planCode: code,
        version: Number(version),
        effectiveFrom,
        effectiveTo,
        pinned: assignmentForm.pinned
      });
      toast.success({ detail: t('adminPlanBuilder.notifications.assigned') });
      await loadAssignments(selectedTemplate.value);
      void loadAssignmentPreview();
    }
  } catch (error) {
    console.error('[plan-builder] unable to assign template', error);
    toast.error({ detail: t('adminPlanBuilder.errors.assignFailed') });
  } finally {
    assigning.value = false;
  }
};

onMounted(() => {
  void loadFeatureCatalog();
  void loadTemplates();
  void loadTeachers();
  void loadPlanPricing();
  void loadReconciliationStatus();
  void loadBackfillStatus();
});
</script>

<style scoped>
.plan-builder__template-item {
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  transition: border-color 0.2s ease;
}

.plan-builder__template-item.is-active {
  border-color: var(--primary-color);
}

.plan-builder__feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  background: var(--sakai-surface-ground);
  border-radius: var(--sakai-border-radius-xl);
}

.plan-builder__marketing-card {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-5);
  border-radius: var(--sakai-border-radius-2xl);
  background-color: var(--sakai-surface-card);
  border: 1px solid var(--sakai-border-color);
  box-shadow: var(--sakai-shadow-sm);
  transition: all 0.2s;
}

.plan-builder__marketing-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--sakai-shadow-md);
  border-color: var(--sakai-primary-300);
}

.plan-builder__marketing-header h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.plan-builder__marketing-help {
  margin: 0;
  font-size: var(--sakai-font-size-xs);
  color: var(--sakai-text-color-tertiary);
}

.plan-builder__pricing-card {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-5);
  border-radius: var(--sakai-border-radius-2xl);
  border: 1px solid var(--sakai-border-color);
  background-color: var(--sakai-surface-card);
  box-shadow: var(--sakai-shadow-sm);
  transition: all 0.2s;
}

.plan-builder__pricing-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--sakai-shadow-md);
  border-color: var(--sakai-primary-300);
}

.plan-builder__pricing-meta {
  margin: 0;
  font-size: var(--sakai-font-size-sm);
  color: var(--sakai-text-color-tertiary);
}

.plan-builder__assignment-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--surface-border) 8%, transparent);
  border: 1px solid var(--surface-border);
}

.plan-builder__assignment-list-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  background-color: color-mix(in srgb, var(--surface-border) 12%, transparent);
}

.plan-builder__bulk-preview-warnings {
  margin: 0.35rem 0 0;
  padding-left: 1rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.plan-builder__audit-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
  color: var(--text-color-secondary);
}

.plan-builder__audit-detail dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.plan-builder__audit-detail dt {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.plan-builder__audit-detail dd {
  margin: 0.25rem 0 0;
  font-weight: 600;
}

.plan-builder__audit-payload pre {
  max-height: 240px;
  overflow: auto;
  background: var(--surface-card);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
}

.plan-builder__audit-empty {
  color: var(--text-color-secondary);
}

.plan-builder__assignment-tenant-slug {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.plan-builder__assignment-meta dt {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.plan-builder__assignment-meta dd {
  margin: 0;
  font-weight: 500;
}

.plan-builder__assignment-end-description {
  margin: 0 0 0.5rem;
  color: var(--text-color-secondary);
}

.plan-builder__assignment-end-help {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}
</style>
