<template>
  <nav
    v-if="totalItems > 0"
    class="ui-pagination flex flex-wrap items-center justify-between gap-4"
    :aria-label="ariaLabel"
  >
    <!-- Reading-start cluster: optional page-size selector + range info -->
    <div class="flex flex-wrap items-center gap-3">
      <div v-if="showSizeSelector" class="flex items-center gap-2">
        <span class="text-sm text-content-tertiary">{{ pageSizeLabel }}</span>
        <UiSelect
          v-model="internalSize"
          class="min-w-[4.5rem]"
          :disabled="disabled"
        >
          <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">{{ opt }}</option>
        </UiSelect>
      </div>
      <span class="text-sm text-content-tertiary">
        <slot
          name="info"
          :from="from"
          :to="to"
          :total="totalItems"
          :page="currentPage"
          :page-count="pageCount"
        >
          Showing {{ from }} to {{ to }} of {{ totalItems }}
        </slot>
      </span>
    </div>

    <!-- Reading-end cluster: prev · numbered pages · next (DOM order flips under dir=rtl) -->
    <div class="flex items-center gap-1.5">
      <UiButton
        size="sm"
        variant="outline"
        color="neutral"
        :disabled="disabled || isFirst"
        :aria-label="prevLabel"
        @click="goPrev"
      >
        {{ prevLabel }}
      </UiButton>

      <template v-for="item in pageItems" :key="item.key">
        <span
          v-if="item.type === 'ellipsis'"
          class="select-none px-2 text-content-tertiary"
          aria-hidden="true"
        >…</span>
        <UiButton
          v-else
          size="sm"
          :variant="item.value === currentPage ? 'solid' : 'outline'"
          :color="item.value === currentPage ? 'primary' : 'neutral'"
          :disabled="disabled"
          class="min-w-[2.25rem] justify-center"
          :aria-current="item.value === currentPage ? 'page' : undefined"
          @click="goTo(item.value as number)"
        >
          {{ item.value }}
        </UiButton>
      </template>

      <UiButton
        size="sm"
        variant="outline"
        color="neutral"
        :disabled="disabled || isLast"
        :aria-label="nextLabel"
        @click="goNext"
      >
        {{ nextLabel }}
      </UiButton>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiSelect from '@/components/ui/UiSelect.vue';

interface PageItem {
  key: string;
  type: 'page' | 'ellipsis';
  value?: number;
}

const props = withDefaults(
  defineProps<{
    /** 1-indexed current page. */
    currentPage: number;
    totalItems: number;
    pageSize: number;
    /** When provided (non-empty), renders a per-page size selector. */
    pageSizeOptions?: number[];
    /** Page numbers shown on each side of the current page. */
    siblingCount?: number;
    disabled?: boolean;
    prevLabel?: string;
    nextLabel?: string;
    pageSizeLabel?: string;
    ariaLabel?: string;
  }>(),
  {
    pageSizeOptions: () => [],
    siblingCount: 1,
    disabled: false,
    prevLabel: 'Previous',
    nextLabel: 'Next',
    pageSizeLabel: 'Per page',
    ariaLabel: 'Pagination',
  },
);

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void;
  (e: 'update:pageSize', size: number): void;
}>();

const range = (start: number, end: number): number[] =>
  Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);

const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.totalItems / Math.max(1, props.pageSize))),
);

const from = computed(() =>
  props.totalItems === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1,
);
const to = computed(() => Math.min(props.currentPage * props.pageSize, props.totalItems));

const isFirst = computed(() => props.currentPage <= 1);
const isLast = computed(() => props.currentPage >= pageCount.value);

/** MUI-style page model: first + last always shown, current ± siblingCount, ellipsis for gaps. */
const pageItems = computed<PageItem[]>(() => {
  const total = pageCount.value;
  const current = Math.min(Math.max(1, props.currentPage), total);
  const sib = Math.max(0, props.siblingCount);
  const totalNumbers = sib * 2 + 5;

  if (total <= totalNumbers) {
    return range(1, total).map((n) => ({ key: `page-${n}`, type: 'page', value: n }));
  }

  const leftSibling = Math.max(current - sib, 1);
  const rightSibling = Math.min(current + sib, total);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;
  const items: PageItem[] = [];

  if (!showLeftDots && showRightDots) {
    const leftCount = 3 + 2 * sib;
    range(1, leftCount).forEach((n) => items.push({ key: `page-${n}`, type: 'page', value: n }));
    items.push({ key: 'right-dots', type: 'ellipsis' });
    items.push({ key: `page-${total}`, type: 'page', value: total });
  } else if (showLeftDots && !showRightDots) {
    const rightCount = 3 + 2 * sib;
    items.push({ key: 'page-1', type: 'page', value: 1 });
    items.push({ key: 'left-dots', type: 'ellipsis' });
    range(total - rightCount + 1, total).forEach((n) =>
      items.push({ key: `page-${n}`, type: 'page', value: n }),
    );
  } else {
    items.push({ key: 'page-1', type: 'page', value: 1 });
    items.push({ key: 'left-dots', type: 'ellipsis' });
    range(leftSibling, rightSibling).forEach((n) =>
      items.push({ key: `page-${n}`, type: 'page', value: n }),
    );
    items.push({ key: 'right-dots', type: 'ellipsis' });
    items.push({ key: `page-${total}`, type: 'page', value: total });
  }

  return items;
});

const goTo = (page: number) => {
  if (props.disabled) return;
  const clamped = Math.min(Math.max(1, page), pageCount.value);
  if (clamped !== props.currentPage) emit('update:currentPage', clamped);
};
const goPrev = () => goTo(props.currentPage - 1);
const goNext = () => goTo(props.currentPage + 1);

const showSizeSelector = computed(
  () => Array.isArray(props.pageSizeOptions) && props.pageSizeOptions.length > 0,
);

const internalSize = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', Number(val)),
});
</script>
