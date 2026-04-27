<template>
  <ThemePage>
    <section class="student-tenant-picker">
      <div class="student-tenant-picker__card">
        <h1 class="student-tenant-picker__title">{{ t('student.chooseTenantTitle') }}</h1>
        <p class="student-tenant-picker__subtitle">{{ t('student.chooseTenantSubtitle') }}</p>
        <UiAlert v-if="errorMessage" class="student-tenant-picker__alert" color="danger" variant="soft">
          {{ errorMessage }}
        </UiAlert>
        <div v-if="loading" class="student-tenant-picker__loading">
          {{ t('common.loading') }}
        </div>
        <ul v-else class="student-tenant-picker__list">
          <li v-for="tenant in tenants" :key="tenant.slug" class="student-tenant-picker__item">
            <div class="student-tenant-picker__info">
              <img
                v-if="tenant.logoUrl"
                :src="tenant.logoUrl"
                :alt="tenant.displayName || tenant.slug"
                class="student-tenant-picker__logo"
                loading="lazy"
                decoding="async"
                @error="hideImage"
              />
              <div class="student-tenant-picker__details">
                <h2>{{ tenant.displayName || tenant.slug }}</h2>
                <p class="student-tenant-picker__slug">{{ tenant.slug }}</p>
              </div>
            </div>
            <UiButton color="primary" @click="continueToTenant(tenant.slug)">
              {{ t('student.chooseTenantContinue') }}
            </UiButton>
          </li>
        </ul>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { isAxiosError } from 'axios';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import api from '@/services/api';
import { buildTenantUrl } from '@/lib/host';
import { safeRedirect } from '@/lib/safeRedirect';

interface StudentTenantSummary {
  slug: string;
  displayName?: string | null;
  logoUrl?: string | null;
}

interface StudentTenantSelectionResponse {
  nextTenant?: string | null;
  needChoice?: boolean;
  tenants?: StudentTenantSummary[] | null;
}

const { t } = useI18n();
const route = useRoute();
const tenants = ref<StudentTenantSummary[]>([]);
const loading = ref(true);
const errorMessage = ref('');

const redirectPath = computed(() => {
  const nextRaw = route.query.next;
  const redirectRaw = route.query.redirect;
  const value = Array.isArray(nextRaw)
    ? nextRaw[0]
    : typeof nextRaw === 'string'
      ? nextRaw
      : Array.isArray(redirectRaw)
        ? redirectRaw[0]
        : redirectRaw;
  return safeRedirect(typeof value === 'string' ? value : '', '/student/home');
});

const hideImage = (event: Event) => {
  const target = event.target as HTMLImageElement | null;
  if (target) {
    target.style.display = 'none';
  }
};

const continueToTenant = (slug: string) => {
  const normalized = (slug || '').trim().toLowerCase();
  if (!normalized) {
    return;
  }
  const target = buildTenantUrl(normalized, `/login?next=${encodeURIComponent(redirectPath.value)}`);
  window.location.replace(target);
};

const fetchTenants = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get<StudentTenantSelectionResponse>('/api/v1/student/tenants');
    const nextTenant = typeof data.nextTenant === 'string' ? data.nextTenant.trim().toLowerCase() : '';
    if (nextTenant) {
      continueToTenant(nextTenant);
      return;
    }
    const list = Array.isArray(data.tenants) ? data.tenants.filter((tenant): tenant is StudentTenantSummary => !!tenant?.slug) : [];
    if (list.length === 0) {
      errorMessage.value = t('student.loginNoTenants');
      tenants.value = [];
      return;
    }
    tenants.value = list.map((tenant) => ({
      slug: tenant.slug.trim().toLowerCase(),
      displayName: tenant.displayName || tenant.slug,
      logoUrl: tenant.logoUrl || ''
    }));
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      errorMessage.value = t('student.loginNoTenants');
      return;
    }
    errorMessage.value = t('student.chooseTenantError');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void fetchTenants();
});
</script>

<style scoped>
.student-tenant-picker {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 6rem);
  padding: var(--sakai-space-8) var(--sakai-space-4);
}

.student-tenant-picker__card {
  width: min(640px, 100%);
  background-color: var(--sakai-surface-0);
  border-radius: 24px;
  box-shadow: var(--sakai-shadow-lg);
  padding: var(--sakai-space-8);
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-5);
}

.student-tenant-picker__title {
  font-size: clamp(1.5rem, 2vw + 1rem, 2.25rem);
  font-weight: 700;
  margin: 0;
}

.student-tenant-picker__subtitle {
  margin: 0;
  color: var(--sakai-text-secondary);
}

.student-tenant-picker__alert {
  margin: 0;
}

.student-tenant-picker__loading {
  text-align: center;
  color: var(--sakai-text-secondary);
}

.student-tenant-picker__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-4);
}

.student-tenant-picker__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4);
  border: 1px solid var(--sakai-border-subtle);
  border-radius: 16px;
  background: var(--sakai-surface-1);
}

.student-tenant-picker__info {
  display: flex;
  align-items: center;
  gap: var(--sakai-space-4);
}

.student-tenant-picker__logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border-radius: 12px;
  background: var(--sakai-surface-0);
  border: 1px solid var(--sakai-border-subtle);
}

.student-tenant-picker__details h2 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.student-tenant-picker__slug {
  margin: 0;
  color: var(--sakai-text-secondary);
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .student-tenant-picker__card {
    padding: var(--sakai-space-6);
  }

  .student-tenant-picker__item {
    flex-direction: column;
    align-items: flex-start;
  }

  .student-tenant-picker__info {
    width: 100%;
  }

  .student-tenant-picker__details h2 {
    font-size: 1rem;
  }
}
</style>
