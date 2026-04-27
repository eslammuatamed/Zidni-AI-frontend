<template>
  <div class="teacher-template teacher-template--minimal">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: unknown;
}>();
defineOptions({ name: 'TeacherTemplateMinimal' });
</script>
