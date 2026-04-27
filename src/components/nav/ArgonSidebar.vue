<template>
  <div class="dashboard-sidebar" :class="[{ 'dashboard-sidebar--mobile': isMobile, 'dashboard-sidebar--rtl': isRtl }]">
    <transition name="sidebar-slide">
      <aside
        v-if="!isMobile || drawer"
        class="ant-layout-sider sider-primary"
        :class="[
          collapsed ? 'ant-layout-sider-collapsed' : '',
          sidebarThemeClass,
          isMobile ? 'ant-layout-sider-white' : ''
        ]"
      >
        <div class="ant-layout-sider-children">
          <div class="brand" :class="{ 'brand--collapsed': collapsed && !isMobile }">
            <div class="brand-logo" aria-hidden="true">
              <span>{{ brandInitials }}</span>
            </div>
            <div v-if="!collapsed || isMobile" class="brand-copy">
              <span class="brand-name">{{ brandName }}</span>
              <span v-if="brandTagline" class="brand-tagline">{{ brandTagline }}</span>
            </div>
          </div>

          <hr />

          <nav class="ant-menu ant-menu-inline">
            <ul>
              <li
                v-for="item in navItems"
                :key="item.to || item.href || item.label"
                class="ant-menu-item"
                :class="{ 'ant-menu-item-selected': isActive(item) }"
              >
                <RouterLink
                  v-if="!item.external"
                  :to="item.to || '/'"
                  class="router-link"
                  @click="handleNavigate"
                >
                  <span class="icon"><muse-icon :name="item.icon" /></span>
                  <span v-if="!collapsed || isMobile" class="label">{{ item.label }}</span>
                  <span v-if="item.badge && (!collapsed || isMobile)" class="badge">{{ item.badge }}</span>
                </RouterLink>
                <a
                  v-else
                  :href="item.href || item.to || '#'"
                  class="router-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click="handleNavigate"
                >
                  <span class="icon"><muse-icon :name="item.icon" /></span>
                  <span v-if="!collapsed || isMobile" class="label">{{ item.label }}</span>
                  <span v-if="item.badge && (!collapsed || isMobile)" class="badge">{{ item.badge }}</span>
                </a>
              </li>
            </ul>
          </nav>

          
        </div>
      </aside>
    </transition>

    <transition name="sidebar-fade">
      <div v-if="isMobile && drawer" class="sidebar-overlay" @click="drawer = false"></div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import MuseIcon from '@/components/MuseIcon.vue';

interface NavItem {
  label: string;
  to?: string;
  href?: string;
  icon?: string;
  badge?: string;
  external?: boolean;
}

const props = withDefaults(
  defineProps<{
    open: boolean;
    navItems: NavItem[];
    brandInitials: string;
    brandName: string;
    brandTagline?: string;
    isMobile: boolean;
    collapsed?: boolean;
    isRtl?: boolean;
  }>(),
  {
    collapsed: false,
    isRtl: false
  }
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:collapsed': [value: boolean];
  navigate: [];
}>();

const { t } = useI18n();
const route = useRoute();

const drawer = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
});

const collapsed = computed({
  get: () => props.collapsed,
  set: (value: boolean) => emit('update:collapsed', value)
});

const navItems = computed(() => props.navItems);
const isMobile = computed(() => props.isMobile);
const isRtl = computed(() => props.isRtl ?? false);

const normalizePath = (value: string) => {
  if (value === '/') return '/';
  return value.replace(/\/+$/, '');
};

const isActive = (item: NavItem) => {
  if (!item.to || item.external) return false;
  const target = normalizePath(item.to);
  const currentPath = normalizePath(route.path);

  if (target === '/') {
    return currentPath === '/';
  }

  if (currentPath === target) {
    return true;
  }

  if (!currentPath.startsWith(`${target}/`)) {
    return false;
  }

  const hasMoreSpecificMatch = navItems.value.some((entry) => {
    if (!entry.to || entry.to === item.to) return false;
    const candidate = normalizePath(entry.to);
    if (!candidate.startsWith(`${target}/`)) return false;
    return currentPath === candidate || currentPath.startsWith(`${candidate}/`);
  });

  return !hasMoreSpecificMatch;
};

const handleNavigate = () => {
  emit('navigate');
};

const brandInitials = computed(() => props.brandInitials);
const brandName = computed(() => props.brandName);
const brandTagline = computed(() => props.brandTagline);

const sidebarThemeClass = computed(() => {
  if (isMobile.value) return 'ant-layout-sider-white';
  return '';
});
</script>

<style scoped>
.dashboard-sidebar {
  position: relative;
}

.dashboard-sidebar .ant-layout-sider {
  background: var(--muse-surface);
  box-shadow: var(--muse-shadow-base);
  transition: transform 0.3s ease, opacity 0.3s ease;
  border-radius: 0;
}

.dashboard-sidebar--mobile .ant-layout-sider {
  position: fixed;
  inset: 0 auto 0 0;
  width: 250px;
  max-width: 82vw;
  z-index: 95;
}

.dashboard-sidebar--rtl.dashboard-sidebar--mobile .ant-layout-sider {
  left: auto;
  right: 0;
}

.dashboard-sidebar--mobile .ant-layout-sider.ant-layout-sider-collapsed {
  transform: translateX(-100%);
}

.dashboard-sidebar--rtl.dashboard-sidebar--mobile .ant-layout-sider.ant-layout-sider-collapsed {
  transform: translateX(100%);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--muse-text-strong) 35%, transparent);
  z-index: 90;
}

.ant-layout-sider-children {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem 0.25rem;
}

.brand-logo {
  width: 42px;
  height: 42px;
  border-radius: var(--muse-radius-md);
  background: var(--muse-gradient-primary);
  color: var(--muse-surface);
  display: grid;
  place-items: center;
  font-weight: var(--muse-font-bold);
  box-shadow: var(--muse-shadow-button);
}

.brand-name {
  font-weight: var(--muse-font-semibold);
  color: var(--muse-text-heading);
  display: block;
}

.brand-tagline {
  font-size: 0.75rem;
  color: var(--muse-text-muted);
}

.ant-menu-inline ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ant-menu-item {
  padding: 0;
}

.router-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--muse-radius-md);
  font-weight: var(--muse-font-semibold);
  color: var(--muse-text-heading);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  text-decoration: none;
}

.router-link .label {
  font-size: 0.95rem;
}

.router-link:hover,
.router-link:focus {
  text-decoration: none;

}

.router-link .icon {
  display: inline-flex;
  width: 32px;
  height: 32px;
  border-radius: var(--muse-radius-sm);
  background: var(--muse-surface-alt);
  color: var(--muse-primary);
  box-shadow: var(--muse-shadow-elevated);
  align-items: center;
  justify-content: center;
}

.router-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px color-mix(in srgb, var(--muse-primary) 18%, rgba(0, 0, 0, 0.18));
}

.ant-menu-item-selected .router-link {
  background: var(--muse-surface);
  box-shadow: var(--muse-shadow-base);
}

.ant-menu-item-selected .router-link .icon {
  background: var(--muse-gradient-primary);
  color: var(--muse-surface);
}

.badge {
  margin-left: auto;
  padding: 0.125rem 0.6rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--muse-primary) 18%, transparent);
  color: var(--muse-primary);
  font-size: 0.75rem;
}

.aside-footer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1rem 1.5rem;
  margin-top: auto;
}

.footer-box {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--muse-primary) 16%, transparent),
    color-mix(in srgb, var(--muse-secondary) 12%, transparent)
  );
  border-radius: var(--muse-radius-lg);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: var(--muse-text-heading);
}

.footer-box .icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
  border-radius: var(--muse-radius-md);
  background: var(--muse-surface);
  align-items: center;
  justify-content: center;
  box-shadow: var(--muse-shadow-base);
}

.footer-box h6 {
  margin: 0;
  font-weight: var(--muse-font-semibold);
}

.footer-box p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muse-text-soft);
}

.footer-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1rem;
  border-radius: var(--muse-radius-md);
  background: var(--muse-surface);
  color: var(--muse-primary);
  font-weight: var(--muse-font-semibold);
  text-decoration: none;
  box-shadow: var(--muse-shadow-base);
 }

.upgrade-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: var(--muse-radius-md);
  border: 1px solid color-mix(in srgb, var(--muse-primary) 35%, transparent);

  color: var(--muse-primary);
  font-weight: var(--muse-font-semibold);
  text-decoration: none;
}

.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.dashboard-sidebar--rtl .sidebar-slide-enter-from,
.dashboard-sidebar--rtl .sidebar-slide-leave-to {
  transform: translateX(20px);
}

.sidebar-fade-enter-active,
.sidebar-fade-leave-active {
  transition: opacity 0.2s ease;
}

.sidebar-fade-enter-from,
.sidebar-fade-leave-to {
  opacity: 0;
}
</style>
