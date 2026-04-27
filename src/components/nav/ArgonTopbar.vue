<template>
  <header class="ant-layout-header header-dashboard">
    <div class="header-meta">
      <button v-if="showMenuButton" class="icon-button" type="button" @click="$emit('toggle-drawer')">
        <muse-icon name="MenuOutlined" />
      </button>
      <div class="header-text">
        <nav v-if="breadcrumbs.length" class="ant-breadcrumb">
          <span
            v-for="(crumb, index) in breadcrumbs"
            :key="`${crumb.title}-${index}`"
            class="ant-breadcrumb-link"
          >
            <RouterLink v-if="crumb.to" :to="crumb.to">{{ crumb.title }}</RouterLink>
            <span v-else>{{ crumb.title }}</span>
            <span v-if="index < breadcrumbs.length - 1" class="ant-breadcrumb-separator">/</span>
          </span>
        </nav>
        <h1 class="header-title">{{ resolvedPageTitle }}</h1>
        <p v-if="userSubtitle" class="header-subtitle">{{ userSubtitle }}</p>
      </div>
    </div>

    <div class="header-search">
      <muse-icon name="SearchOutlined" />
      <input
        v-model="query"
        :placeholder="searchPlaceholder"
        type="search"
        class="search-input"
      />
    </div>

    <div class="header-actions">
      <button class="language-button" type="button" @click="handleToggleLanguage">
        <muse-icon name="GlobalOutlined" />
        <span>{{ languageLabel }}</span>
      </button>
      <button class="icon-button" type="button">
        <span class="badge-dot"></span>
        <muse-icon name="BellOutlined" />
      </button>
      <button class="icon-button" type="button">
        <muse-icon name="SettingOutlined" />
      </button>
      <div class="user-menu">
        <div class="user-avatar">{{ userInitials }}</div>
        <div class="user-info">
          <span class="user-name">{{ userName }}</span>
          <span class="user-role">{{ userRoleLabel }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import MuseIcon from '@/components/MuseIcon.vue';

interface Breadcrumb {
  title: string;
  to?: string;
}

const props = withDefaults(
  defineProps<{
    breadcrumbs: Breadcrumb[];
    showMenuButton?: boolean;
    searchPlaceholder?: string;
    userName?: string;
    userRole?: string;
    userInitials?: string;
    pageTitle?: string;
  }>(),
  {
    breadcrumbs: () => [],
    showMenuButton: false,
    searchPlaceholder: 'Search',
    userName: 'Guest',
    userRole: '',
    userInitials: 'U',
    pageTitle: ''
  }
);

const emit = defineEmits<{ 'toggle-language': [] }>();

const { t, locale } = useI18n();

const query = ref('');

const handleToggleLanguage = () => emit('toggle-language');

const userRoleLabel = computed(() => {
  if (props.userRole === 'TEACHER') return t('nav.teacher');
  if (props.userRole === 'STUDENT') return t('nav.student');
  if (props.userRole === 'PLATFORM_ADMIN') return t('nav.platformAdmin');
  return t('nav.profile');
});

const breadcrumbs = computed(() => props.breadcrumbs);
const showMenuButton = computed(() => props.showMenuButton);
const searchPlaceholder = computed(() => props.searchPlaceholder || t('nav.searchPlaceholder'));
const userName = computed(() => props.userName);
const userInitials = computed(() => props.userInitials);
const languageLabel = computed(() => (locale.value === 'ar' ? 'EN' : 'AR'));
const resolvedPageTitle = computed(() => {
  if (props.pageTitle) {
    return props.pageTitle;
  }
  const crumbs = breadcrumbs.value;
  if (crumbs.length) {
    return crumbs[crumbs.length - 1]?.title ?? t('nav.home');
  }
  return t('nav.home');
});
const userSubtitle = computed(() => {
  if (props.userRole === 'TEACHER' || props.userRole === 'STUDENT') {
    const name = userName.value?.trim();
    if (name) {
      return `${userRoleLabel.value} · ${name}`;
    }
    return userRoleLabel.value;
  }
  return '';
});
</script>

<style scoped>
.header-dashboard {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  background: transparent;
  padding: 1.5rem 2rem;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: var(--muse-font-bold);
  color: var(--muse-text-heading);
}

.header-subtitle {
  margin: 0;
  color: var(--muse-text-muted);
  font-size: 0.9rem;
}

.ant-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--muse-text-muted);
}

.ant-breadcrumb-link a {
  color: inherit;
}

.ant-breadcrumb-separator {
  color: var(--muse-border);
}

.header-search {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 420px;
  background: var(--muse-surface);
  border-radius: 999px;
  padding: 0.4rem 1rem;
  box-shadow: var(--muse-shadow-base);
  border: 1px solid var(--muse-border);
}

.search-input {
  border: none;
  flex: 1;
  font-size: 0.95rem;
  outline: none;
  padding-left: 0.75rem;
  color: var(--muse-text-heading);
  background: transparent;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.language-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: var(--muse-radius-lg);
  border: 1px solid color-mix(in srgb, var(--muse-primary) 35%, transparent);
  background: color-mix(in srgb, var(--muse-primary) 12%, transparent);
  color: var(--muse-primary);
  font-weight: var(--muse-font-semibold);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: none;
}

.language-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--muse-shadow-base);
}

.language-button :deep(svg) {
  width: 18px;
  height: 18px;
}

.icon-button {
  position: relative;
  border: none;
  background: var(--muse-surface);
  border-radius: var(--muse-radius-md);
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  box-shadow: var(--muse-shadow-base);
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.icon-button:hover {
  box-shadow: 0 12px 30px color-mix(in srgb, var(--muse-primary) 18%, rgba(0, 0, 0, 0.14));
}

.badge-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  background: var(--muse-danger);
  border-radius: 50%;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0.75rem;
  border-radius: var(--muse-radius-lg);
  background: var(--muse-surface);
  box-shadow: var(--muse-shadow-base);
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: var(--muse-radius-lg);
  background: var(--muse-gradient-primary);
  color: var(--muse-surface);
  display: grid;
  place-items: center;
  font-weight: var(--muse-font-bold);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: var(--muse-font-semibold);
  color: var(--muse-text-heading);
}

.user-role {
  font-size: 0.8rem;
  color: var(--muse-text-muted);
}

@media (max-width: 768px) {
  .header-dashboard {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem 1.25rem;
  }

  .header-meta {
    width: 100%;
  }

  .header-search {
    width: 100%;
    max-width: none;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
