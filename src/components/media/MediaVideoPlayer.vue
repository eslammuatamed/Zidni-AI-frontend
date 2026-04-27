<template>
  <video ref="videoEl" v-bind="$attrs"></video>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { HlsInstance } from '@/utils/hls';
import { setupVideoSource } from '@/utils/hls';

const props = defineProps<{ src?: string | null }>();

const videoEl = ref<HTMLVideoElement | null>(null);
const hlsInstance = ref<HlsInstance | null>(null);

const destroyPlayer = () => {
  if (hlsInstance.value) {
    hlsInstance.value.destroy();
    hlsInstance.value = null;
  }
};

const applySource = async (source: string | null) => {
  await nextTick();
  const instance = await setupVideoSource(videoEl.value, source, destroyPlayer);
  if (instance) {
    hlsInstance.value = instance;
  }
};

watch(
  () => props.src ?? null,
  (value) => {
    applySource(value);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  destroyPlayer();
});

const getVideoElement = () => videoEl.value;

defineExpose({
  getVideoElement
});
</script>
