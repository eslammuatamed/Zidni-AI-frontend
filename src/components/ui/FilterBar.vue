<template>
  <div class="filter-bar flex flex-col flex-md-row gap-3 align-start align-md-center mb-4">
    <!-- Search -->
    <div class="filter-bar__search flex-grow-1 w-100" style="max-width: 400px">
      <UiInput
        :model-value="search"
        @update:model-value="$emit('update:search', $event)"
        :placeholder="searchPlaceholder"
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
        density="compact"
        @click:clear="$emit('update:search', '')"
      />
    </div>

    <!-- Filters Slot -->
    <div class="filter-bar__filters flex flex-wrap gap-2 items-center flex-grow-1">
      <slot />
    </div>

    <!-- Actions/Reset -->
    <div class="filter-bar__actions flex items-center gap-2 ms-auto">
      <slot name="actions" />
      
      <UiButton
        v-if="hasActiveFilters"
        variant="text"
        color="error"
        size="small"
        prepend-icon="mdi-filter-off"
        @click="$emit('reset')"
      >
        {{ t('common.reset') }}
      </UiButton>
    </div>
  </div>
  
  <!-- Active Chips Row (Optional) -->
  <div v-if="$slots.chips || chips.length > 0" class="filter-bar__chips flex flex-wrap gap-2 mb-4">
     <slot name="chips">
        <v-chip
          v-for="(chip, index) in chips"
          :key="index"
          closable
          size="small"
          color="primary"
          @click:close="$emit('remove-chip', chip)"
        >
          {{ chip.label }}
        </v-chip>
     </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UiInput from '@/components/ui/UiInput.vue';
import UiButton from '@/components/ui/UiButton.vue';

const props = withDefaults(defineProps<{
  search?: string;
  searchPlaceholder?: string;
  chips?: Array<{ label: string; value: any }>;
  hasActiveFilters?: boolean;
}>(), {
  search: '',
  searchPlaceholder: 'Search...',
  chips: () => [],
  hasActiveFilters: false
});

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'reset'): void;
  (e: 'remove-chip', chip: any): void;
}>();

const { t } = useI18n();
</script>
