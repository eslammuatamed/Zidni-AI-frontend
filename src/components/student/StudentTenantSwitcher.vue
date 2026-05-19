<template>
  <div
    ref="rootRef"
    class="student-tenant-switcher"
    :class="{
      'student-tenant-switcher--embedded': embedded,
      'is-open': panelVisible
    }"
  >
    <button
      v-if="!embedded"
      type="button"
      class="student-tenant-switcher__trigger"
      @click="togglePanel"
    >
      <UiIcon name="ClusterOutlined" :size="16" />
      <span class="student-tenant-switcher__trigger-label">
        {{ currentTeacherLabel || t('student.tenantSwitcher.triggerLabel') }}
      </span>
      <UiIcon :name="panelVisible ? 'UpOutlined' : 'DownOutlined'" :size="14" />
    </button>

    <transition name="student-tenant-switcher">
      <section
        v-if="panelVisible"
        class="student-tenant-switcher__panel"
        role="dialog"
        :aria-label="t('student.tenantSwitcher.title')"
      >
        <header class="student-tenant-switcher__header">
          <h3>{{ t('student.tenantSwitcher.title') }}</h3>
          <p>{{ t('student.tenantSwitcher.subtitle') }}</p>
        </header>

        <div class="student-tenant-switcher__search">
          <UiIcon name="SearchOutlined" :size="16" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="search"
            :placeholder="t('student.tenantSwitcher.searchPlaceholder')"
            @keydown.stop
          />
        </div>

        <div v-if="loading" class="student-tenant-switcher__state">{{ t('common.loading') }}…</div>
        <div v-else-if="error" class="student-tenant-switcher__state student-tenant-switcher__state--error">
          {{ errorMessage }}
        </div>
        <div v-else-if="!filteredLinks.length" class="student-tenant-switcher__state">
          <p>{{ links.length ? t('student.tenantSwitcher.noResults') : t('student.tenantSwitcher.emptyState') }}</p>
          <p v-if="!links.length" class="student-tenant-switcher__hint">
            {{ t('student.tenantSwitcher.linkHelp') }}
          </p>
        </div>
        <ul v-else class="student-tenant-switcher__list">
          <li v-for="link in filteredLinks" :key="link.teacherId" class="student-tenant-switcher__item">
            <div class="student-tenant-switcher__item-meta">
              <strong>{{ link.teacherName || link.teacherSlug }}</strong>
              <span class="student-tenant-switcher__slug">{{ link.teacherSlug }}</span>
            </div>
            <div class="student-tenant-switcher__item-actions">
              <UiBadge v-if="link.primary" color="primary" variant="soft">
                {{ t('student.tenantSwitcher.primaryTag') }}
              </UiBadge>
              <UiBadge v-if="isCurrent(link)" color="info" variant="soft">
                {{ t('student.tenantSwitcher.currentTag') }}
              </UiBadge>
              <UiButton
                class="student-tenant-switcher__manage"
                variant="ghost"
                size="sm"
                :disabled="!link.teacherSlug"
                @click="openLanding(link)"
              >
                {{ t('student.tenantSwitcher.manageAction') }}
              </UiButton>
              <UiButton
                size="sm"
                color="primary"
                :disabled="switchingId === link.teacherId"
                @click="logoutAndOpen(link)"
              >
                <span v-if="switchingId === link.teacherId">{{ t('common.loading') }}…</span>
                <span v-else>{{ t('nav.logout') }}</span>
              </UiButton>
            </div>
          </li>
        </ul>
      </section>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { useStudentStore } from '@/stores/student';
import { useAchievementsStore } from '@/stores/achievements';
import { useNotificationStore } from '@/stores/notifications';
import UiBadge from '@/components/ui/UiBadge.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import { listStudentLinks } from '@/api/studentLinks';
import type { StudentLink } from '@/api/studentLinks';
import { getStoredTenantSlug } from '@/utils/tenantStorage';
import { buildTenantUrl, extractTenant } from '@/lib/host';
import { switchTenant as switchTenantMembership } from '@/services/tenantMembership';

const props = withDefaults(
  defineProps<{ embedded?: boolean; autoOpen?: boolean }>(),
  { embedded: false, autoOpen: false }
);

const emit = defineEmits<{
  (e: 'switched', link: StudentLink): void;
  (e: 'links-loaded', links: StudentLink[]): void;
}>();

const { t } = useI18n();
const auth = useAuthStore();
const studentStore = useStudentStore();
const achievementsStore = useAchievementsStore();
const notificationStore = useNotificationStore();

const rootRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const open = ref(false);
const links = ref<StudentLink[]>([]);
const loading = ref(false);
const error = ref('');
const searchQuery = ref('');
const switchingId = ref<number | null>(null);

const panelVisible = computed(() => props.embedded || open.value);
const currentTenant = computed(() => getStoredTenantSlug().normalized);

const errorMessage = computed(() => {
  if (!error.value) return '';
  if (error.value === 'unavailable') {
    return t('student.tenantSwitcher.unavailable');
  }
  return t('student.tenantSwitcher.error');
});

const currentTeacherLabel = computed(() => {
  const tenantSlug = currentTenant.value;
  const match = links.value.find((item) => item.teacherSlug === tenantSlug);
  return match?.teacherName || match?.teacherSlug || '';
});

const filteredLinks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return links.value;
  }
  return links.value.filter((link) => {
    return (
      link.teacherName?.toLowerCase().includes(query) ||
      link.teacherSlug?.toLowerCase().includes(query)
    );
  });
});

const ensureLinksLoaded = async () => {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    const data = await listStudentLinks();
    links.value = Array.isArray(data) ? data : [];
    emit('links-loaded', links.value);
  } catch (err: any) {
    links.value = [];
    emit('links-loaded', links.value);
    if (err?.response?.status === 404 || err?.response?.status === 403) {
      error.value = 'unavailable';
    } else {
      error.value = 'generic';
      console.error('[StudentTenantSwitcher] failed to load links', err);
    }
  } finally {
    loading.value = false;
  }
};

const closePanel = () => {
  open.value = false;
};

const togglePanel = async () => {
  open.value = !open.value;
  if (open.value) {
    await ensureLinksLoaded();
    await nextTick();
    focusSearch();
  }
};

const handleDocumentClick = (event: MouseEvent) => {
  if (!open.value || props.embedded) return;
  const root = rootRef.value;
  if (!root) return;
  if (event.target instanceof Node && !root.contains(event.target)) {
    closePanel();
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (props.embedded) return;
  if (event.key === 'Escape' && open.value) {
    closePanel();
  }
};

const isCurrent = (link: StudentLink) => {
  if (!link) return false;
  if (auth.teacherId != null && link.teacherId === auth.teacherId) {
    return true;
  }
  if (link.teacherSlug && currentTenant.value) {
    return link.teacherSlug.toLowerCase() === currentTenant.value;
  }
  return false;
};

const focusSearch = () => {
  if (!panelVisible.value) return;
  if (!searchInputRef.value) return;
  searchInputRef.value.focus({ preventScroll: true });
};

const openLanding = (link: StudentLink) => {
  if (!link.teacherSlug) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }
  const base = window.location.origin.replace(/\/$/, '');
  const url = `${base}/teacher/${link.teacherSlug}`;
  window.open(url, '_blank', 'noopener');
};

const logoutAndOpen = async (link: StudentLink) => {
  if (!link?.teacherSlug || typeof window === 'undefined') {
    return;
  }
  switchingId.value = link.teacherId;
  try {
    if (link.teacherSlug) {
      await switchTenantMembership(link.teacherSlug);
    }
    await auth.logout();
  } catch (err) {
    console.error('[StudentTenantSwitcher] failed to logout for tenant switch', err);
  } finally {
    const target = buildTenantUrl(link.teacherSlug, '/');
    window.location.replace(target);
    switchingId.value = null;
  }
};

watch(
  () => props.embedded,
  async (embeddedMode) => {
    if (embeddedMode) {
      await ensureLinksLoaded();
      await nextTick();
      focusSearch();
    }
  },
  { immediate: true }
);

watch(
  () => props.autoOpen,
  async (value) => {
    if (!props.embedded && value) {
      open.value = true;
      await ensureLinksLoaded();
      await nextTick();
      focusSearch();
    }
  },
  { immediate: true }
);

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true);
  document.addEventListener('keydown', handleEscape);
  if (props.embedded) {
    ensureLinksLoaded();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick, true);
  document.removeEventListener('keydown', handleEscape);
});

defineExpose({
  open: async () => {
    if (props.embedded) return;
    open.value = true;
    await ensureLinksLoaded();
    await nextTick();
    focusSearch();
  },
  close: closePanel,
  refresh: ensureLinksLoaded,
  focusSearch
});
</script>

<style scoped>
.student-tenant-switcher {
  position: relative;
  display: inline-flex;
  align-items: stretch;
}

.student-tenant-switcher--embedded {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.student-tenant-switcher__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
  padding: 0.5rem 0.75rem;
  border-radius: var(--sakai-border-radius-pill);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  background: var(--sakai-surface-alt);
  color: var(--sakai-text-color);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: var(--sakai-font-weight-medium);
  transition: background-color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.student-tenant-switcher__trigger:hover,
.student-tenant-switcher.is-open .student-tenant-switcher__trigger {
  background: color-mix(in srgb, var(--sakai-primary) 10%, var(--sakai-surface-alt));
  color: var(--sakai-primary-600);
}

.student-tenant-switcher__trigger-label {
  max-width: 9.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-tenant-switcher__panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  inset-inline-start: 0;
  z-index: 1100;
  min-width: 18rem;
  max-width: 24rem;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface-card);
  box-shadow: var(--sakai-shadow-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
}

.student-tenant-switcher--embedded .student-tenant-switcher__panel {
  position: static;
  min-width: 0;
  max-width: none;
  box-shadow: none;
  border: 1px dashed color-mix(in srgb, var(--sakai-border-color) 65%, transparent);
}

.student-tenant-switcher__header {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
}

.student-tenant-switcher__header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--sakai-font-weight-semibold);
  color: var(--sakai-text-color);
}

.student-tenant-switcher__header p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.student-tenant-switcher__search {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-2);
  padding: 0.4rem 0.75rem;
  border-radius: var(--sakai-border-radius-lg);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 70%, transparent);
  background: var(--sakai-surface);
}

.student-tenant-switcher__search input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: var(--sakai-text-color);
}

.student-tenant-switcher__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.student-tenant-switcher__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-3);
}

.student-tenant-switcher__item-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.student-tenant-switcher__item-meta strong {
  color: var(--sakai-text-color);
  font-size: 0.95rem;
  font-weight: var(--sakai-font-weight-semibold);
}

.student-tenant-switcher__slug {
  font-size: 0.75rem;
  color: var(--sakai-text-color-tertiary);
}

.student-tenant-switcher__item-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--sakai-space-2);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.student-tenant-switcher__manage {
  color: var(--sakai-text-color-secondary);
}

.student-tenant-switcher__state {
  text-align: center;
  color: var(--sakai-text-color-tertiary);
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-2);
}

.student-tenant-switcher__state--error {
  color: var(--sakai-danger);
}

.student-tenant-switcher__hint {
  font-size: 0.8rem;
  color: var(--sakai-text-color-tertiary);
}

.student-tenant-switcher-enter-active,
.student-tenant-switcher-leave-active {
  transition: opacity var(--sakai-transition-duration) var(--sakai-transition-ease),
    transform var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.student-tenant-switcher-enter-from,
.student-tenant-switcher-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 640px) {
  .student-tenant-switcher__panel {
    inset-inline-start: auto;
    inset-inline-end: 0;
  }

  .student-tenant-switcher__trigger-label {
    max-width: 6.5rem;
  }

  .student-tenant-switcher__item {
    flex-direction: column;
    align-items: flex-start;
  }

  .student-tenant-switcher__item-actions {
    justify-content: flex-start;
  }
}
</style>
