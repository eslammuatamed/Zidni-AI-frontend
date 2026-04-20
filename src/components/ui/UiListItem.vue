<template>
  <li
    class="ui-list-item grid grid-cols-[auto_1fr_auto] gap-4 py-3 px-0 text-content"
    :class="itemClasses"
    :tabindex="props.clickable ? 0 : undefined"
    :role="props.clickable ? 'button' : undefined"
    @click="handleClick"
    @keydown.enter.prevent="handleKeyDown"
    @keydown.space.prevent="handleKeyDown"
  >
    <div v-if="$slots.leading" class="ui-list-item__leading flex items-center justify-center w-10">
      <slot name="leading" />
    </div>
    <div class="ui-list-item__content flex flex-col gap-2">
      <div class="ui-list-item__header flex justify-between items-baseline gap-3">
        <div class="ui-list-item__title font-medium text-content leading-[1.4]">
          <slot name="title">
            <slot />
          </slot>
        </div>
        <div v-if="$slots.meta" class="ui-list-item__meta text-content-tertiary text-[0.85rem]">
          <slot name="meta" />
        </div>
      </div>
      <div v-if="$slots.subtitle" class="ui-list-item__subtitle text-content-tertiary text-[0.9rem]">
        <slot name="subtitle" />
      </div>
      <div v-if="$slots.description" class="ui-list-item__description text-content-secondary text-[0.9rem]">
        <slot name="description" />
      </div>
    </div>
    <div v-if="$slots.actions" class="ui-list-item__actions flex items-center gap-2">
      <slot name="actions" />
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UiListItemAlign = 'center' | 'start';

const props = withDefaults(
  defineProps<{
    clickable?: boolean;
    align?: UiListItemAlign;
  }>(),
  {
    clickable: false,
    align: 'center'
  }
);

const emit = defineEmits<{ (event: 'click', payload: MouseEvent | KeyboardEvent): void }>();

const itemClasses = computed(() => ({
  'ui-list-item--clickable': props.clickable,
  'items-start': props.align === 'start',
  'items-center': props.align !== 'start'
}));

const handleClick = (event: MouseEvent) => {
  if (!props.clickable) {
    return;
  }
  emit('click', event);
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.clickable) {
    return;
  }
  emit('click', event);
};
</script>

<style scoped>
.ui-list-item--clickable {
  cursor: pointer;
  transition: background-color var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.ui-list-item--clickable:hover {
  background: color-mix(in srgb, var(--sakai-primary) 8%, transparent);
}

@media (max-width: 640px) {
  .ui-list-item {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .ui-list-item__leading,
  .ui-list-item__actions {
    justify-content: flex-start;
  }

  .ui-list-item__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
