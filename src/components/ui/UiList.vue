<template>
  <ul class="ui-list list-none m-0 flex flex-col gap-0" :class="listClasses">
    <slot />
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type UiListDensity = 'default' | 'comfortable' | 'compact';

const props = withDefaults(
  defineProps<{
    density?: UiListDensity;
    divided?: boolean;
    inset?: boolean;
    padded?: boolean;
  }>(),
  {
    density: 'default',
    divided: false,
    inset: false,
    padded: true
  }
);

const listClasses = computed(() => ({
  'py-2': props.padded,
  'p-0': !props.padded,
  'ps-3 pe-3': props.inset,
  'ui-list--divided': props.divided,
  'ui-list--density-comfortable': props.density === 'comfortable',
  'ui-list--density-compact': props.density === 'compact',
}));
</script>

<style scoped>
.ui-list--divided :deep(.ui-list-item + .ui-list-item) {
  border-top: 1px solid color-mix(in srgb, var(--sakai-border-color) 75%, transparent);
}

.ui-list--density-comfortable :deep(.ui-list-item) {
  padding-block: var(--sakai-space-4);
}

.ui-list--density-compact :deep(.ui-list-item) {
  padding-block: var(--sakai-space-2);
}
</style>
