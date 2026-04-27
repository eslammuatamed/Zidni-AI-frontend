<template>
  <v-data-table
    v-bind="$attrs"
    :headers="headers"
    :items="items"
    class="argon-table muse-table"
    :class="tableClasses"
  >
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps" />
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface TableHeader {
  title: string;
  key: string;
  value?: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
}

const props = withDefaults(
  defineProps<{
    headers: TableHeader[];
    items: unknown[];
    dense?: boolean;
    striped?: boolean;
    hover?: boolean;
  }>(),
  {
    dense: false,
    striped: true,
    hover: true
  }
);

const tableClasses = computed(() => ({
  'argon-table--dense muse-table--dense': props.dense,
  'argon-table--striped muse-table--striped': props.striped,
  'argon-table--hover muse-table--hover': props.hover
}));

const headers = computed(() => props.headers);
const items = computed(() => props.items);
</script>

<style scoped>
.muse-table {
  --muse-table-hover: rgba(24, 144, 255, 0.08);
  --muse-table-striped: rgba(24, 144, 255, 0.04);
}

.muse-table--hover table tbody tr:hover {
  background-color: var(--muse-table-hover) !important;
}

.muse-table--striped table tbody tr:nth-child(even) {
  background-color: var(--muse-table-striped) !important;
}

.muse-table--dense table tbody tr td,
.muse-table--dense table thead tr th {
  padding-top: 0.5rem !important;
  padding-bottom: 0.5rem !important;
}
</style>
