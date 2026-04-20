<!--
  UiToastHost.vue renders toast notifications stacked in the viewport corner.
  Props: none. It consumes messages from the global toast composable and emits
  close events by delegating to the composable API.
-->
<template>
  <div class="ui-toast-host fixed right-6 bottom-6 grid gap-3 z-[1300]">
    <UiToast
      v-for="toast in toasts"
      :key="toast.id"
      :visible="true"
      :type="toast.severity"
      :title="toast.summary"
      :message="toast.detail"
      :closable="toast.closable"
      inline
      @close="dismiss(toast.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import UiToast from '@/components/ui/UiToast.vue';
import { useToast } from '@/composables/useToast';

const toast = useToast();
/**
 * Derives the reactive toast collection exposed by the toast composable.
 *
 * @returns The latest list of toast descriptors ready for rendering.
 */
const toasts = computed(() => toast.messages.value);

/**
 * Removes a toast notification using its identifier when the user dismisses it.
 *
 * @param id Unique toast identifier provided by the composable.
 */
const dismiss = (id: number) => {
  toast.remove(id);
};
</script>
