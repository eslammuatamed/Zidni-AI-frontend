<template>
  <UiCard class="teacher-map" :title="t('landing.admin.tenants')">
    <div class="teacher-map__search">
      <UiInput
        v-model="search"
        :label="t('landing.admin.searchTeacher')"
        type="search"
      />
    </div>
    <ul class="teacher-map__list">
      <li
        v-for="teacher in filteredTeachers"
        :key="teacher.id"
        class="teacher-map__item"
        :class="{ 'is-active': currentTenant === teacher.slug }"
      >
        <button type="button" @click="switchTenant(teacher.slug)">
          <div class="teacher-map__item-meta">
            <span class="teacher-map__name">{{ teacher.name }}</span>
            <span class="teacher-map__slug">{{ teacher.slug }}</span>
          </div>
          <UiBadge v-if="currentTenant === teacher.slug" color="primary" variant="soft">
            {{ t('landing.admin.active') }}
          </UiBadge>
        </button>
      </li>
    </ul>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UiCard from '@/components/ui/UiCard.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiBadge from '@/components/ui/UiBadge.vue';
import api from '@/services/api';
import { useTenantStore } from '@/stores/tenant';
import { getStoredTenantSlug, setStoredTenantSlug } from '@/utils/tenantStorage';

interface TeacherItem {
  id: number;
  name: string;
  slug: string;
}

const emit = defineEmits<{
  (e: 'change', slug: string): void;
}>();

const store = useTenantStore();
const { t } = useI18n();
const teachers = ref<TeacherItem[]>([]);
const search = ref('');

const currentTenant = computed(() => store.branding?.slug || getStoredTenantSlug().raw || 'demo');

onMounted(async () => {
  try {
    const { data } = await api.get('/api/platform/catalog/teachers');
    teachers.value = data;
  } catch (error) {
    console.warn('Failed to load teachers', error);
  }
});

const filteredTeachers = computed(() => {
  if (!search.value) return teachers.value;
  return teachers.value.filter((teacher) =>
    teacher.name.toLowerCase().includes(search.value.toLowerCase()) ||
    teacher.slug.toLowerCase().includes(search.value.toLowerCase())
  );
});

async function switchTenant(slug: string) {
  setStoredTenantSlug(slug);
  await store.fetchBranding(slug);
  emit('change', slug);
}
</script>

<style scoped>
.teacher-map {
  gap: var(--sakai-space-4);
}

.teacher-map__search {
  display: flex;
}

.teacher-map__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-3);
}

.teacher-map__item button {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sakai-space-3);
  padding: var(--sakai-space-3) var(--sakai-space-4);
  border: 1px solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  border-radius: var(--sakai-border-radius-lg);
  background: var(--sakai-surface);
  color: inherit;
  cursor: pointer;
  transition: border-color var(--sakai-transition-duration) var(--sakai-transition-ease),
    box-shadow var(--sakai-transition-duration) var(--sakai-transition-ease);
}

.teacher-map__item button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--sakai-primary) 65%, transparent);
  outline-offset: 2px;
}

.teacher-map__item button:hover {
  border-color: color-mix(in srgb, var(--sakai-primary) 40%, transparent);
  box-shadow: var(--sakai-shadow-sm);
}

.teacher-map__item.is-active button {
  border-color: color-mix(in srgb, var(--sakai-primary) 45%, transparent);
  box-shadow: var(--sakai-shadow-md);
}

.teacher-map__item-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sakai-space-1);
  text-align: left;
}

.teacher-map__name {
  font-weight: var(--sakai-font-weight-medium);
  color: var(--sakai-text-color);
}

.teacher-map__slug {
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}
</style>
