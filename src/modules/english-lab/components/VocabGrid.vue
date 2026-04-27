<template>
  <div class="vocab-grid" role="list">
    <PictureCard
      v-for="item in items"
      :key="item.id"
      role="listitem"
      class="vocab-grid__card"
      :vocab="item"
      :active="selected?.includes(item.id)"
      :disabled="disabledIds?.includes(item.id)"
      @select="onSelect(item.id)"
      @spoken="$emit('spoken', item)"
    />
  </div>
</template>

<script setup lang="ts">
import PictureCard from './PictureCard.vue';
import type { VocabularyItemDto } from '../services/englishLabApi';

const props = defineProps<{
  items: VocabularyItemDto[];
  selected?: string[];
  disabledIds?: string[];
}>();

const emit = defineEmits<{ select: [id: string]; spoken: [item: VocabularyItemDto] }>();

const onSelect = (id: string) => {
  emit('select', id);
};
</script>

<style scoped>
.vocab-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.vocab-grid__card {
  width: 100%;
}
</style>
