<!--
  SidebarUpgradeCard.vue renders the "upgrade plan" call-to-action at the
  bottom of the authenticated shell sidebar. Gating (auth.isTeacher +
  teacherPlanUpgradeEnabled) lives in the parent shell — this component renders
  unconditionally and assumes it should be shown when mounted.
-->
<template>
  <RouterLink
    :to="{ name: 'teacher-plan-upgrade' }"
    class="sidebar-upgrade-card"
    :class="{ 'sidebar-upgrade-card--collapsed': collapsed }"
    :title="t('nav.teacherUpgradePlan')"
    :aria-label="t('nav.teacherUpgradePlan')"
  >
    <span class="sidebar-upgrade-card__icon" aria-hidden="true">
      <UiIcon name="ArrowUpOutlined" :size="18" />
    </span>
    <template v-if="!collapsed">
      <span class="sidebar-upgrade-card__body">
        <span class="sidebar-upgrade-card__title">{{
          t('nav.teacherUpgradePlan')
        }}</span>
        <span class="sidebar-upgrade-card__plan">{{ planLabel }}</span>
      </span>
      <span class="sidebar-upgrade-card__chevron" aria-hidden="true">
        <UiIcon :name="chevronIcon" :size="16" />
      </span>
    </template>
  </RouterLink>
</template>

<script setup lang="ts">
// NOTE: Parent passes @click via attribute fallthrough to the RouterLink root.
// Keep this template single-root — multi-root would silently break that behavior.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiIcon from '@/components/ui/UiIcon.vue';

defineProps<{
  collapsed: boolean;
  planLabel: string;
}>();

const { t, locale } = useI18n();
const chevronIcon = computed(() =>
  locale.value === 'ar' ? 'ArrowLeftOutlined' : 'ArrowRightOutlined'
);
</script>

<style scoped>
.sidebar-upgrade-card {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3) var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-gradient-brand);
  color: var(--sakai-text-color-inverse);
  text-decoration: none;
  box-shadow: var(--sakai-shadow-md);
  transition:
    transform var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.sidebar-upgrade-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--sakai-shadow-lg);
}

.sidebar-upgrade-card:focus-visible {
  outline: none;
  box-shadow: var(--sakai-shadow-lg), var(--sakai-shadow-focus);
}

.sidebar-upgrade-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--sakai-border-radius-md);
  background: var(--sakai-white-alpha-18);
  flex-shrink: 0;
}

.sidebar-upgrade-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.sidebar-upgrade-card__title {
  font-weight: var(--sakai-font-weight-semibold);
  font-size: 0.875rem;
  line-height: 1.2;
}

.sidebar-upgrade-card__plan {
  font-size: 0.75rem;
  line-height: 1.3;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-upgrade-card__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.85;
}

.sidebar-upgrade-card--collapsed {
  padding: var(--sakai-space-2);
  justify-content: center;
}

.sidebar-upgrade-card--collapsed .sidebar-upgrade-card__icon {
  width: 2rem;
  height: 2rem;
}
</style>
