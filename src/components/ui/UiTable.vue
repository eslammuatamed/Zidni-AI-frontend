<template>
  <div class="ui-table-container w-full overflow-x-auto bg-surface-card rounded-sakai-xl shadow-sakai-sm [border:1px_solid_var(--sakai-border-color)]" :class="containerClasses" :style="containerStyle">
    <table class="ui-table w-full border-collapse text-left text-[0.925rem]">
      <thead class="ui-table__head">
        <tr>
          <th
            v-for="header in headers"
            :key="header.key"
            class="ui-table__th"
            :style="{ textAlign: header.align || 'start' }"
          >
            {{ header.title }}
          </th>
        </tr>
      </thead>
      <tbody class="ui-table__body">
        <template v-if="loading">
          <tr v-for="i in skeletonRowsComputed" :key="i">
            <td v-for="header in headers" :key="header.key" class="ui-table__td">
              <UiSkeleton height="1.2rem" width="80%" />
            </td>
          </tr>
        </template>
        <template v-else-if="items && items.length > 0">
          <tr v-for="(item, index) in items" :key="index" class="ui-table__tr">
            <td
              v-for="header in headers"
              :key="header.key"
              class="ui-table__td"
              :style="{ textAlign: header.align || 'start' }"
            >
              <slot :name="`item.${header.key}`" :item="item" :index="index">
                {{ (item as any)[header.key] }}
              </slot>
            </td>
          </tr>
        </template>
        <template v-else>
          <tr>
            <td :colspan="headers.length" class="ui-table__empty-cell px-8 py-16">
              <div class="ui-table__empty flex flex-col items-center justify-center gap-3 text-content-tertiary">
                <slot name="no-data">
                  <UiIcon name="InfoCircleOutlined" :size="24" />
                  <span class="font-medium">{{ emptyText || 'No records found' }}</span>
                </slot>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
      <tfoot v-if="$slots.footer">
        <tr>
          <td :colspan="headers.length">
            <slot name="footer" />
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';

export interface UiTableHeader {
  title: string;
  key: string;
  value?: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
}

const props = withDefaults(
  defineProps<{
    headers: UiTableHeader[];
    items: unknown[];
    striped?: boolean;
    hover?: boolean;
    loading?: boolean;
    loadingText?: string;
    emptyText?: string;
    stickyHeader?: boolean;
    maxHeight?: string | number;
    bordered?: boolean;
    skeletonRows?: number;
  }>(),
  {
    striped: true,
    hover: true,
    loading: false,
    loadingText: 'Loading records…',
    emptyText: 'No records found',
    stickyHeader: false,
    maxHeight: undefined,
    bordered: false,
    skeletonRows: 4
  }
);

const containerClasses = computed(() => ({
  'ui-table-container--bordered': props.bordered,
  'ui-table-container--sticky': props.stickyHeader,
  'ui-table-container--striped': props.striped,
  'ui-table-container--hover': props.hover
}));

const containerStyle = computed(() => {
  if (!props.maxHeight) return undefined;
  const size = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
  return { maxHeight: size, overflowY: 'auto' as const };
});

const skeletonRowsComputed = computed(() => Math.max(props.skeletonRows, 1));
</script>

<style scoped>

.ui-table__th {
  padding: 1rem 1.25rem;
  background: var(--sakai-surface-ground);
  color: var(--sakai-text-color-secondary);
  font-weight: var(--sakai-font-weight-semibold);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--sakai-border-color);
  white-space: nowrap;
}

.ui-table-container--sticky .ui-table__th {
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  z-index: 10;
  /* Safari fix for sticky borders */
  background-clip: padding-box;
}

.ui-table__td {
  padding: 1rem 1.25rem;
  color: var(--sakai-text-color);
  border-bottom: 1px solid color-mix(in srgb, var(--sakai-border-color) 60%, transparent);
  transition: background-color 0.2s;
}

.ui-table-container--striped .ui-table__tr:nth-child(even) .ui-table__td {
  background: color-mix(in srgb, var(--sakai-primary) 3%, transparent);
}

.ui-table-container--hover .ui-table__tr:hover .ui-table__td {
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
}


.ui-table-container--bordered {
  border: 1px solid var(--sakai-border-color);
}
</style>
