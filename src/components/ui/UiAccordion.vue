<template>
  <div class="ui-accordion" :class="accordionClasses">
    <div
      v-for="(item, index) in normalizedItems"
      :key="item.value"
      class="ui-accordion__item"
      :class="{
        'is-open': isOpen(item.value),
        'is-disabled': item.disabled
      }"
    >
      <button
        :id="`${accordionId}-header-${index}`"
        type="button"
        class="ui-accordion__header"
        :aria-controls="`${accordionId}-panel-${index}`"
        :aria-expanded="isOpen(item.value)"
        :disabled="item.disabled"
        @click="toggle(item.value)"
      >
        <div class="ui-accordion__header-content flex flex-col gap-[0.2rem]">
          <slot name="header" :item="item" :index="index">
            <span class="ui-accordion__title text-[1rem]">{{ item.title }}</span>
            <span v-if="item.subtitle" class="ui-accordion__subtitle text-[0.85rem] text-content-tertiary">{{ item.subtitle }}</span>
          </slot>
        </div>
        <UiIcon name="DownOutlined" class="ui-accordion__chevron" :size="16" />
      </button>
      <transition name="ui-accordion">
        <div
          v-show="isOpen(item.value)"
          :id="`${accordionId}-panel-${index}`"
          class="ui-accordion__content"
          role="region"
          :aria-labelledby="`${accordionId}-header-${index}`"
        >
          <slot name="content" :item="item" :index="index">
            <p v-if="item.content">{{ item.content }}</p>
          </slot>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import UiIcon from '@/components/ui/UiIcon.vue';

type AccordionValue = string | number;

export type UiAccordionItem<T = any> = {
  value?: AccordionValue;
  title: string;
  subtitle?: string;
  content?: string;
  disabled?: boolean;
} & T;

const props = withDefaults(
  defineProps<{
    items?: UiAccordionItem[];
    modelValue?: AccordionValue | AccordionValue[] | null;
    multiple?: boolean;
    collapsible?: boolean;
    flush?: boolean;
  }>(),
  {
    items: () => [],
    modelValue: null,
    multiple: false,
    collapsible: true,
    flush: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: AccordionValue | AccordionValue[] | null): void;
  (e: 'change', value: AccordionValue, expanded: boolean): void;
}>();

const accordionId = useId();

const normalizedItems = computed(() =>
  props.items.map((item, index) => ({
    ...item,
    value: item.value ?? index
  }))
);

const normalizedModelValue = computed<AccordionValue[]>(() => {
  const value = props.modelValue;
  if (value === null || value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
});

const internalOpen = ref<Set<AccordionValue>>(new Set(normalizedModelValue.value));

watch(
  () => normalizedModelValue.value,
  (next) => {
    if (props.modelValue === null || props.modelValue === undefined) {
      return;
    }
    internalOpen.value = new Set(next);
  }
);

const currentOpen = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return internalOpen.value;
  }
  return new Set(normalizedModelValue.value);
});

const accordionClasses = computed(() => ({
  'ui-accordion--flush': props.flush
}));

const isOpen = (value: AccordionValue) => currentOpen.value.has(value);

const emitValue = (openValues: Set<AccordionValue>) => {
  if (props.multiple) {
    emit('update:modelValue', Array.from(openValues));
    return;
  }
  const [first] = Array.from(openValues);
  emit('update:modelValue', first ?? null);
};

const toggle = (value: AccordionValue) => {
  const openValues = new Set(currentOpen.value);
  if (openValues.has(value)) {
    if (!props.collapsible && openValues.size <= 1) {
      emit('change', value, true);
      return;
    }
    openValues.delete(value);
    emitValue(openValues);
    if (props.modelValue === null || props.modelValue === undefined) {
      internalOpen.value = openValues;
    }
    emit('change', value, false);
    return;
  }

  if (!props.multiple) {
    openValues.clear();
  }
  openValues.add(value);
  emitValue(openValues);
  if (props.modelValue === null || props.modelValue === undefined) {
    internalOpen.value = openValues;
  }
  emit('change', value, true);
};
</script>

<style scoped>
.ui-accordion {
  display: flex;
  flex-direction: column;
  border-radius: var(--sakai-border-radius-xl);
  background: var(--sakai-surface-card);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  box-shadow: var(--sakai-shadow-sm);
  overflow: hidden;
}

.ui-accordion--flush {
  border: none;
  box-shadow: none;
  background: transparent;
}

.ui-accordion__item + .ui-accordion__item {
  border-top: 1px solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
}

.ui-accordion__header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sakai-space-4);
  padding: var(--sakai-space-4) var(--sakai-space-5);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--sakai-text-color);
  font-weight: var(--sakai-font-weight-medium);
  transition: background-color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-accordion__item.is-disabled .ui-accordion__header {
  cursor: not-allowed;
  opacity: 0.6;
}

.ui-accordion__header:hover {
  background: color-mix(in srgb, var(--sakai-primary) 10%, transparent);
}

.ui-accordion__item.is-open .ui-accordion__header {
  background: color-mix(in srgb, var(--sakai-primary) 14%, transparent);
}


.ui-accordion__chevron {
  transition: transform var(--sakai-transition-duration) var(--sakai-transition-ease);
  color: var(--sakai-text-color-tertiary);
}

.ui-accordion__item.is-open .ui-accordion__chevron {
  transform: rotate(-180deg);
  color: var(--sakai-primary);
}

.ui-accordion__content {
  padding: var(--sakai-space-4) var(--sakai-space-5);
  background: color-mix(in srgb, var(--sakai-primary) 6%, transparent);
  color: var(--sakai-text-color-secondary);
}

.ui-accordion-enter-active,
.ui-accordion-leave-active {
  transition: all var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-accordion-enter-from,
.ui-accordion-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
