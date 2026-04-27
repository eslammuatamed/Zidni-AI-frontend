<template>
  <div class="teacher-template teacher-template--classic">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: unknown;
}>();
defineOptions({ name: 'TeacherTemplateClassic' });
</script>
