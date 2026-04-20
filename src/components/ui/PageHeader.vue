<template>
  <div class="mb-4 flex justify-space-between items-center flex-wrap">
    <div>
      <div v-if="breadcrumbs && breadcrumbs.length" class="flex items-center mb-1 text-caption text-medium-emphasis">
        <template v-for="(item, i) in breadcrumbs" :key="i">
           <router-link :to="item.to" class="text-medium-emphasis text-decoration-none hover:text-sakai-primary">{{ item.title }}</router-link>
           <v-icon icon="pi pi-angle-right" size="x-small" class="mx-1" v-if="i < breadcrumbs.length -1"></v-icon>
        </template>
      </div>
      <h1 class="text-h4 font-weight-bold">{{ title }}</h1>
      <p v-if="subtitle" class="text-body-1 text-medium-emphasis mb-0 mt-1">{{ subtitle }}</p>
    </div>
    <div class="flex items-center gap-2 mt-2 mt-sm-0">
      <slot name="actions"></slot>
    </div>
  </div>
  <v-divider v-if="divider" class="mb-6"></v-divider>
</template>

<script setup lang="ts">
import { type RouteLocationRaw } from 'vue-router';

withDefaults(defineProps<{
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ title: string; to: RouteLocationRaw }>;
  divider?: boolean;
}>(), {
  divider: true
});
</script>
