<template>
  <div class="teacher-template teacher-template--modern">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: unknown;
}>();
defineOptions({ name: 'TeacherTemplateModern' });
</script>
