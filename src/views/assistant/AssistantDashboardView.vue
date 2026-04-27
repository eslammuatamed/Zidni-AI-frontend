<template>
  <ThemePage :title="t('assistant.dashboard.title')" :subtitle="t('assistant.dashboard.subtitle')">
    <template v-if="assistantName" #meta>
      <p class="assistant-dashboard__identity">
        <UiIcon name="UserOutlined" :size="16" />
        <span class="assistant-dashboard__identity-text">
          {{ t('assistant.dashboard.signedInAs', { name: assistantName }) }}
        </span>
      </p>
    </template>
    <div class="assistant-dashboard">
      <UiCard class="assistant-dashboard__card" hover>
        <template #title>{{ t('assistant.dashboard.linksTitle') }}</template>
        <template #subtitle>{{ t('assistant.dashboard.linksSubtitle') }}</template>
        <UiAlert
          v-if="showFeatureErrorAlert"
          color="warning"
          variant="soft"
          class="assistant-dashboard__links-alert"
        >
          <div class="assistant-dashboard__alert">
            <span class="assistant-dashboard__alert-message">
              {{ t('assistant.dashboard.featuresLoadError') }}
            </span>
            <UiButton
              variant="outline"
              color="primary"
              size="sm"
              :disabled="retryingFeatures || featuresStore.loading"
              @click="retryFeatureLoad"
            >
              {{ t('common.retry') }}
            </UiButton>
          </div>
        </UiAlert>
        <UiAlert
          v-else-if="blockedFeatureLinks.length"
          color="info"
          variant="soft"
          class="assistant-dashboard__links-alert"
        >
          <div class="assistant-dashboard__disabled-alert">
            <p class="assistant-dashboard__disabled-message">
              {{ t('assistant.dashboard.featuresDisabled', { count: blockedFeatureLinks.length }) }}
            </p>
            <p class="assistant-dashboard__disabled-intro">
              {{ t('assistant.dashboard.featuresDisabledListIntro') }}
            </p>
            <ul class="assistant-dashboard__disabled-links" role="list">
              <li
                v-for="link in blockedFeatureLinkDetails"
                :key="link.id"
                class="assistant-dashboard__disabled-link"
              >
                <span class="assistant-dashboard__disabled-link-title">{{ link.label }}</span>
                <span class="assistant-dashboard__disabled-link-description">{{ link.description }}</span>
              </li>
            </ul>
          </div>
        </UiAlert>
        <div v-if="isQuickLinksLoading" class="assistant-dashboard__links-loading" role="status">
          <UiSkeleton
            v-for="placeholder in skeletonPlaceholderCount"
            :key="placeholder"
            height="60px"
            animation="wave"
          />
        </div>
        <ul v-if="quickLinks.length" class="assistant-dashboard__links" role="list">
          <li v-for="link in quickLinks" :key="link.id" class="assistant-dashboard__link-item">
            <div class="assistant-dashboard__link-meta">
              <UiIcon :name="link.icon" :size="22" />
              <div class="assistant-dashboard__link-copy">
                <span class="assistant-dashboard__link-title">{{ link.label }}</span>
                <p class="assistant-dashboard__link-description">{{ link.description }}</p>
              </div>
            </div>
            <div class="assistant-dashboard__link-action">
              <UiButton size="sm" color="primary" @click="openLink(link.target)">
                {{ t('assistant.dashboard.open') }}
              </UiButton>
            </div>
          </li>
        </ul>
        <div v-else-if="showQuickLinksEmptyState" class="assistant-dashboard__empty">
          <h3 class="assistant-dashboard__empty-title">{{ quickLinksEmptyState.title }}</h3>
          <p class="assistant-dashboard__empty-description">{{ quickLinksEmptyState.description }}</p>
          <UiButton
            v-if="showAccessRefreshAction"
            class="assistant-dashboard__empty-action"
            variant="outline"
            color="primary"
            size="sm"
            :disabled="refreshingAccess"
            @click="refreshAccess"
          >
            {{ refreshingAccess ? t('common.loading') : t('assistant.dashboard.refreshAccess') }}
          </UiButton>
        </div>
      </UiCard>

      <UiCard class="assistant-dashboard__card" hover>
        <template #title>{{ t('assistant.dashboard.permissionsTitle') }}</template>
        <template #subtitle>{{ t('assistant.dashboard.permissionsSubtitle') }}</template>
        <ul v-if="permissionDetails.length" class="assistant-dashboard__permissions" role="list">
          <li v-for="permission in permissionDetails" :key="permission.id" class="assistant-dashboard__permission">
            <span class="assistant-dashboard__permission-label">{{ permission.label }}</span>
            <p class="assistant-dashboard__permission-description">{{ permission.description }}</p>
          </li>
        </ul>
        <div v-else class="assistant-dashboard__empty">
          <h3 class="assistant-dashboard__empty-title">{{ permissionsEmptyState.title }}</h3>
          <p class="assistant-dashboard__empty-description">{{ permissionsEmptyState.description }}</p>
          <UiButton
            v-if="showAccessRefreshAction"
            class="assistant-dashboard__empty-action"
            variant="outline"
            color="primary"
            size="sm"
            :disabled="refreshingAccess"
            @click="refreshAccess"
          >
            {{ refreshingAccess ? t('common.loading') : t('assistant.dashboard.refreshAccess') }}
          </UiButton>
        </div>
      </UiCard>

      <UiCard class="assistant-dashboard__card" hover>
        <template #title>{{ t('assistant.dashboard.helpTitle') }}</template>
        <template #subtitle>{{ t('assistant.dashboard.helpSubtitle') }}</template>
        <p class="assistant-dashboard__help">{{ t('assistant.dashboard.helpDescription') }}</p>
      </UiCard>
    </div>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import { useAuthStore } from '@/stores/auth';
import { useFeaturesStore } from '@/stores/features';
import { ASSISTANT_PERMISSION_OPTIONS } from '@/stores/teacherAssistants';
import { FEATURE, type FeatureCode } from '@/constants/featureCatalog';

type AssistantPermission = string;

interface AssistantQuickLinkDefinition {
  id: string;
  permissionId: AssistantPermission;
  icon: string;
  target: RouteLocationRaw;
  labelKey: string;
  descriptionKey: string;
  featureCode?: FeatureCode;
}

interface AssistantQuickLink {
  id: string;
  icon: string;
  target: RouteLocationRaw;
  label: string;
  description: string;
}

interface AssistantQuickLinkEvaluation {
  definition: AssistantQuickLinkDefinition;
  hasPermission: boolean;
  requiresFeature: boolean;
  featureEnabled: boolean;
  missingFeature: boolean;
  pendingFeature: boolean;
  visible: boolean;
}

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const featuresStore = useFeaturesStore();

const assistantName = computed(() => (auth.assistantName || '').trim());
const hasAssignedRole = computed(() => auth.assistantRoleId != null);

const quickLinkDefinitions: AssistantQuickLinkDefinition[] = [
  {
    id: 'courses',
    permissionId: 'courses.manage',
    icon: 'ReadOutlined',
    target: { name: 'assistant-courses' },
    labelKey: 'assistant.dashboard.links.courses.title',
    descriptionKey: 'assistant.dashboard.links.courses.description'
  },
  {
    id: 'assessments',
    permissionId: 'assessments.manage',
    icon: 'FileTextOutlined',
    target: { name: 'assistant-assessments' },
    labelKey: 'assistant.dashboard.links.assessments.title',
    descriptionKey: 'assistant.dashboard.links.assessments.description'
  },
  {
    id: 'students',
    permissionId: 'students.view',
    icon: 'TeamOutlined',
    target: { name: 'assistant-students' },
    labelKey: 'assistant.dashboard.links.students.title',
    descriptionKey: 'assistant.dashboard.links.students.description',
    featureCode: FEATURE.teacherRosterGroups
  },
  {
    id: 'registrations',
    permissionId: 'registrations.manage',
    icon: 'SolutionOutlined',
    target: { name: 'assistant-enrollments' },
    labelKey: 'assistant.dashboard.links.registrations.title',
    descriptionKey: 'assistant.dashboard.links.registrations.description',
    featureCode: FEATURE.teacherRegsPayments
  },
  {
    id: 'payments',
    permissionId: 'registrations.manage',
    icon: 'DollarOutlined',
    target: { name: 'assistant-payments' },
    labelKey: 'assistant.dashboard.links.payments.title',
    descriptionKey: 'assistant.dashboard.links.payments.description',
    featureCode: FEATURE.teacherRegsPayments
  },
  {
    id: 'tutoring',
    permissionId: 'tutoring.manage',
    icon: 'MessageOutlined',
    target: { name: 'assistant-tutoring' },
    labelKey: 'assistant.dashboard.links.tutoring.title',
    descriptionKey: 'assistant.dashboard.links.tutoring.description'
  },
  {
    id: 'reports',
    permissionId: 'reports.view',
    icon: 'LineChartOutlined',
    target: { name: 'assistant-reports' },
    labelKey: 'assistant.dashboard.links.reports.title',
    descriptionKey: 'assistant.dashboard.links.reports.description',
    featureCode: FEATURE.reportsTeacher
  },
  {
    id: 'communications',
    permissionId: 'communications.manage',
    icon: 'NotificationOutlined',
    target: { name: 'assistant-notifications' },
    labelKey: 'assistant.dashboard.links.communications.title',
    descriptionKey: 'assistant.dashboard.links.communications.description',
    featureCode: FEATURE.notificationsUnified
  },
  {
    id: 'certificates',
    permissionId: 'students.view',
    icon: 'SafetyCertificateOutlined',
    target: { name: 'assistant-certificates' },
    labelKey: 'assistant.dashboard.links.certificates.title',
    descriptionKey: 'assistant.dashboard.links.certificates.description'
  }
];

const permissionSet = computed(() => new Set((auth.assistantPermissions || []) as AssistantPermission[]));
const availableFeatures = computed(() => new Set(featuresStore.listFeatureCodes()));

const featureError = computed(() => featuresStore.featureError);
const hasAttemptedFeatureLoad = computed(() => featuresStore.hasAttemptedSecureLoad);
const awaitingInitialFeatureDecision = computed(
  () => !hasAttemptedFeatureLoad.value
);

const quickLinkEvaluations = computed<AssistantQuickLinkEvaluation[]>(() =>
  quickLinkDefinitions.map((definition) => {
    const hasPermission = permissionSet.value.has(definition.permissionId);
    const featureCode = definition.featureCode;
    const requiresFeature = Boolean(featureCode);
    const pendingFeature =
      requiresFeature && hasPermission && awaitingInitialFeatureDecision.value;
    const featureEnabled =
      !requiresFeature ||
      Boolean(featureError.value || (featureCode && availableFeatures.value.has(featureCode)));
    const missingFeature = Boolean(
      requiresFeature &&
        featureCode &&
        hasAttemptedFeatureLoad.value &&
        !featureError.value &&
        !availableFeatures.value.has(featureCode)
    );
    const visible =
      hasPermission &&
      !pendingFeature &&
      (!requiresFeature || featureEnabled) &&
      !missingFeature;
    return {
      definition,
      hasPermission,
      requiresFeature,
      featureEnabled,
      missingFeature,
      pendingFeature,
      visible
    };
  })
);

const quickLinks = computed<AssistantQuickLink[]>(() =>
  quickLinkEvaluations.value
    .filter((link) => link.visible)
    .map((link) => ({
      id: link.definition.id,
      icon: link.definition.icon,
      target: link.definition.target,
      label: t(link.definition.labelKey),
      description: t(link.definition.descriptionKey)
    }))
);

const blockedFeatureLinks = computed(() =>
  quickLinkEvaluations.value.filter(
    (link) => link.hasPermission && link.requiresFeature && link.missingFeature
  )
);

const blockedFeatureLinkDetails = computed(() =>
  blockedFeatureLinks.value.map((link) => ({
    id: link.definition.id,
    label: t(link.definition.labelKey),
    description: t(link.definition.descriptionKey)
  }))
);

const pendingQuickLinkCount = computed(() =>
  quickLinkEvaluations.value.filter((link) => link.pendingFeature).length
);

const isQuickLinksLoading = computed(() => pendingQuickLinkCount.value > 0);

const skeletonPlaceholderCount = computed(() => Math.max(pendingQuickLinkCount.value, 1));

const showFeatureErrorAlert = computed(
  () => Boolean(featureError.value) && hasAttemptedFeatureLoad.value
);

const showQuickLinksEmptyState = computed(
  () => !quickLinks.value.length && !isQuickLinksLoading.value
);

const quickLinksEmptyState = computed(() => {
  if (blockedFeatureLinks.value.length) {
    return {
      title: t('assistant.dashboard.featuresDisabledTitle'),
      description: t('assistant.dashboard.featuresDisabledDescription')
    };
  }
  if (showFeatureErrorAlert.value) {
    return {
      title: t('assistant.dashboard.featuresLoadErrorTitle'),
      description: t('assistant.dashboard.featuresLoadErrorDescription')
    };
  }
  if (hasAssignedRole.value) {
    return {
      title: t('assistant.dashboard.roleAssignedEmptyTitle'),
      description: t('assistant.dashboard.roleAssignedEmptyDescription')
    };
  }
  return {
    title: t('assistant.dashboard.emptyTitle'),
    description: t('assistant.dashboard.emptyDescription')
  };
});

const retryingFeatures = ref(false);
const refreshingAccess = ref(false);

const retryFeatureLoad = async () => {
  if (retryingFeatures.value) {
    return;
  }
  retryingFeatures.value = true;
  try {
    await featuresStore.refresh();
  } catch (error) {
    console.warn('[assistant-dashboard] failed to refresh features', error);
  } finally {
    retryingFeatures.value = false;
  }
};

const refreshAccess = async () => {
  if (refreshingAccess.value) {
    return;
  }
  refreshingAccess.value = true;
  try {
    await auth.me(true);
    await featuresStore.ensureLoaded();
  } catch (error) {
    console.warn('[assistant-dashboard] failed to refresh assistant access', error);
  } finally {
    refreshingAccess.value = false;
  }
};

const permissionDetails = computed(() =>
  ASSISTANT_PERMISSION_OPTIONS.filter((option) => permissionSet.value.has(option.id)).map((option) => ({
    id: option.id,
    label: t(option.labelKey),
    description: t(option.descriptionKey)
  }))
);

const permissionsEmptyState = computed(() => {
  if (hasAssignedRole.value) {
    return {
      title: t('assistant.dashboard.roleAssignedPermissionsEmptyTitle'),
      description: t('assistant.dashboard.roleAssignedPermissionsEmptyDescription')
    };
  }
  return {
    title: t('assistant.dashboard.permissionsEmptyTitle'),
    description: t('assistant.dashboard.permissionsEmptyDescription')
  };
});

const showAccessRefreshAction = computed(
  () => !permissionDetails.value.length && !blockedFeatureLinks.value.length
);

const openLink = async (target: RouteLocationRaw) => {
  await router.push(target);
};

onMounted(async () => {
  await featuresStore.ensureLoaded();
});
</script>

<style scoped>
.assistant-dashboard__identity {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--sakai-color-text-subtle);
}

.assistant-dashboard__identity-text {
  color: var(--sakai-color-text);
}

.assistant-dashboard {
  display: grid;
  gap: var(--sakai-space-6);
}

.assistant-dashboard__card {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.assistant-dashboard__links {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.assistant-dashboard__link-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  flex-wrap: wrap;
}

.assistant-dashboard__link-meta {
  display: flex;
  gap: var(--sakai-space-3);
  align-items: flex-start;
  flex: 1 1 16rem;
  min-width: 0;
}

.assistant-dashboard__link-copy {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
  min-width: 0;
}

.assistant-dashboard__link-title {
  font-weight: var(--sakai-font-weight-semibold);
}

.assistant-dashboard__link-description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  word-break: break-word;
}

.assistant-dashboard__link-action {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

.assistant-dashboard__link-action :deep(.ui-button) {
  white-space: nowrap;
}

.assistant-dashboard__links-loading {
  display: grid;
  gap: var(--sakai-space-3);
}

.assistant-dashboard__links-alert {
  align-items: flex-start;
  flex-wrap: wrap;
}

.assistant-dashboard__disabled-alert {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
  width: 100%;
}

.assistant-dashboard__disabled-message,
.assistant-dashboard__disabled-intro {
  margin: 0;
}

.assistant-dashboard__disabled-links {
  margin: 0;
  padding-inline-start: var(--sakai-space-5);
  display: grid;
  gap: var(--sakai-space-2);
}

.assistant-dashboard__disabled-link {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.assistant-dashboard__disabled-link-title {
  font-weight: var(--sakai-font-weight-semibold);
}

.assistant-dashboard__disabled-link-description {
  color: var(--sakai-text-color-secondary);
}

.assistant-dashboard__alert {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  flex-wrap: wrap;
  width: 100%;
}

.assistant-dashboard__alert-message {
  flex: 1 1 auto;
}

.assistant-dashboard__alert :deep(.ui-button) {
  flex: 0 0 auto;
}

@media (max-width: 600px) {
  .assistant-dashboard__link-item {
    flex-direction: column;
    align-items: stretch;
  }

  .assistant-dashboard__link-meta {
    width: 100%;
  }

  .assistant-dashboard__link-action {
    width: 100%;
    justify-content: flex-start;
  }

  .assistant-dashboard__link-action :deep(.ui-button) {
    width: 100%;
    justify-content: center;
  }
}

.assistant-dashboard__permissions {
  display: grid;
  gap: var(--sakai-space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.assistant-dashboard__permission-label {
  display: block;
  font-weight: var(--sakai-font-weight-semibold);
}

.assistant-dashboard__permission-description {
  margin: var(--sakai-space-1) 0 0;
  color: var(--sakai-text-color-secondary);
  line-height: 1.5;
}

.assistant-dashboard__empty {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
  align-items: center;
}

.assistant-dashboard__empty-title {
  margin: 0;
  font-weight: var(--sakai-font-weight-semibold);
}

.assistant-dashboard__empty-description {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}

.assistant-dashboard__empty-action {
  margin-top: var(--sakai-space-2);
}

.assistant-dashboard__help {
  margin: 0;
  color: var(--sakai-text-color-secondary);
  line-height: 1.6;
}
</style>
