<template>
  <transition name="dev-tenant-banner-fade">
    <div
      v-if="visible"
      class="dev-tenant-banner"
      :class="{ 'dev-tenant-banner--error': errorMessage }"
      role="status"
    >
      <span class="dev-tenant-banner__item">
        <strong>Host:</strong>
        <span>{{ host }}</span>
      </span>
      <span class="dev-tenant-banner__item">
        <strong>Derived tenant:</strong>
        <span>{{ derivedTenant ?? '∅ (app scope)' }}</span>
      </span>
      <span class="dev-tenant-banner__item">
        <strong>/auth/me:</strong>
        <template v-if="loading">loading…</template>
        <template v-else-if="errorMessage">{{ errorMessage }}</template>
        <template v-else-if="me">
          <code>{{ me.sub }}</code>
          <span v-if="me.tenant_id">(tenant: {{ me.tenant_id }})</span>
          <span v-if="me.roles?.length">roles: {{ me.roles.join(', ') }}</span>
        </template>
        <template v-else>anonymous</template>
      </span>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import api from '@/services/api';

type MeResponse = {
  sub: string;
  tenant_id?: string;
  roles?: string[];
};

const isBrowser = typeof window !== 'undefined';
const isDev = import.meta.env.DEV === true;
const host = isBrowser ? window.location.hostname : '';
const derivedTenant = computed(() => {
  if (!isBrowser) {
    return null;
  }
  const hostname = window.location.hostname;
  if (!hostname) {
    return null;
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  const devSuffix = `.${import.meta.env.VITE_DEV_DOMAIN_BASE ?? '127.0.0.1.nip.io'}`;
  if (!hostname.endsWith(devSuffix)) {
    return null;
  }
  const label = hostname.slice(0, -devSuffix.length);
  if (!label || label === 'app' || label === 'www') {
    return null;
  }
  const tenantCandidate = label.split('.')[0]?.trim();
  return tenantCandidate?.length ? tenantCandidate : null;
});

const visible = computed(() => isDev && isBrowser);
const loading = ref(false);
const me = ref<MeResponse | null>(null);
const errorMessage = ref<string | null>(null);

onMounted(async () => {
  if (!visible.value || !isBrowser) {
    return;
  }
  loading.value = true;
  try {
    const { data } = await api.get<MeResponse>('/api/v1/auth/me');
    me.value = data;
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = 'unreachable';
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.dev-tenant-banner {
  position: fixed;
  z-index: 2000;
  bottom: 1rem;
  right: 1rem;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: rgba(25, 118, 210, 0.95);
  color: #fff;
  font-size: 0.85rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(6px);
}

.dev-tenant-banner--error {
  background: rgba(198, 40, 40, 0.95);
}

.dev-tenant-banner__item {
  display: inline-flex;
  gap: 0.35rem;
  align-items: baseline;
}

.dev-tenant-banner__item strong {
  font-weight: 600;
}

.dev-tenant-banner__item code {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 0.1rem 0.25rem;
  font-size: 0.8rem;
}

.dev-tenant-banner-fade-enter-active,
.dev-tenant-banner-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dev-tenant-banner-fade-enter-from,
.dev-tenant-banner-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
