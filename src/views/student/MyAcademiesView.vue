<template>
  <div class="my-academies">
    <header class="my-academies__header">
      <h1>My Academies</h1>
      <p class="my-academies__hint">
        Select an academy below to switch your active session. Only active memberships can be entered.
      </p>
    </header>

    <div v-if="loading" class="my-academies__state">Loading academies…</div>
    <div v-else-if="memberships.length === 0" class="my-academies__state">
      You have not joined any academies yet.
    </div>
    <ul v-else class="my-academies__list">
      <li v-for="membership in memberships" :key="membership.tenantId" class="my-academies__item">
        <div class="my-academies__details">
          <h2>{{ membership.academyName ?? membership.tenantId }}</h2>
          <p class="my-academies__tenant">{{ membership.tenantId }}</p>
          <p class="my-academies__status" :class="`status-${membership.status.toLowerCase()}`">
            Status: {{ membership.status }}
          </p>
        </div>
        <button
          class="my-academies__enter"
          :disabled="switching === membership.tenantId || membership.status !== 'ACTIVE'"
          @click="enterAcademy(membership)"
        >
          <span v-if="switching === membership.tenantId">Switching…</span>
          <span v-else>Enter academy</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useToast } from '@/composables/useToast';
import { fetchMemberships, type TenantMembership } from '@/services/tenantMembership';
import { useAuthStore } from '@/stores/auth';
import { buildTenantUrl } from '@/lib/host';

const memberships = ref<TenantMembership[]>([]);
const loading = ref(true);
const switching = ref<string | null>(null);
const toast = useToast();
const auth = useAuthStore();

const loadMemberships = async () => {
  loading.value = true;
  try {
    memberships.value = await fetchMemberships();
  } catch (error) {
    console.error('[academies] unable to load memberships', error);
    toast.error({ detail: 'Unable to load academies. Please try again.' });
  } finally {
    loading.value = false;
  }
};

const enterAcademy = async (membership: TenantMembership) => {
  if (membership.status !== 'ACTIVE') {
    toast.warning({ detail: 'This academy is pending approval.' });
    return;
  }
  switching.value = membership.tenantId;
  try {
    await auth.logout();
    redirectToTenant(membership.tenantId);
  } catch (error) {
    console.error('[academies] unable to switch tenant', error);
    toast.error({ detail: 'Unable to switch academies. Please try again.' });
    switching.value = null;
  }
};

const redirectToTenant = (tenantSlug: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  const target = buildTenantUrl(tenantSlug, '/');
  window.location.href = target;
};

onMounted(() => {
  loadMemberships();
});
</script>

<style scoped>
.my-academies {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.my-academies__header h1 {
  font-size: 1.75rem;
  margin: 0;
}

.my-academies__hint {
  margin: 0.25rem 0 0;
  color: var(--color-text-secondary);
}

.my-academies__state {
  padding: 1.5rem;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 0.75rem;
}

.my-academies__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.my-academies__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background-color: var(--color-surface, #fff);
}

.my-academies__details h2 {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
}

.my-academies__tenant {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.my-academies__status {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-active {
  color: var(--color-success, #1b9a59);
}

.status-pending {
  color: var(--color-warning, #c28a0e);
}

.status-suspended {
  color: var(--color-danger, #c4302b);
}

.my-academies__enter {
  background-color: var(--color-primary, #0066ff);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 600;
}

.my-academies__enter[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
