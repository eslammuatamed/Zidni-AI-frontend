<template>
  <component :is="resolvedComponent" />
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { defineAsyncComponent } from 'vue';
import { classifyHost } from '@/utils/tenantHost';
import { useTenantStore } from '@/stores/tenant';

const LandingHome = defineAsyncComponent(() => import('@/views/landing/LandingHome.vue'));
const TeacherLandingView = defineAsyncComponent(() => import('@/views/public/TeacherLandingView.vue'));

const hostInfo = computed(() => classifyHost());
const tenantStore = useTenantStore();

watchEffect(() => {
  if (typeof window === 'undefined') {
    return;
  }
  if (hostInfo.value.isTenantHost && hostInfo.value.tenantSlug) {
    tenantStore.setSlug(hostInfo.value.tenantSlug);
  }
});

const resolvedComponent = computed(() => (hostInfo.value.isTenantHost ? TeacherLandingView : LandingHome));
</script>
