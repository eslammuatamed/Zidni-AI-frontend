<template>
  <ThemePage :title="t('badges.student.title')" :subtitle="t('badges.student.subtitle')">
    <section class="student-badges">
      <UiCard :title="t('badges.student.collectionTitle')" hover>
        <template v-if="loading">
          <div class="student-badges__loading">
            <UiSkeleton v-for="index in 4" :key="index" height="72px" animation="pulse" rounded />
          </div>
        </template>
        <template v-else-if="items.length">
          <UiList density="comfortable" divided>
            <UiListItem v-for="badge in items" :key="badge.id" align="start">
              <template #leading>
                <div class="student-badges__icon" aria-hidden="true">
                  <UiIcon v-if="!badge.iconUrl" name="TrophyOutlined" :size="24" />
                  <img v-else :src="badge.iconUrl" :alt="badge.name" loading="lazy" />
                </div>
              </template>
              <template #title>
                {{ badge.name }}
              </template>
              <template #description>
                <p v-if="badge.description">{{ badge.description }}</p>
                <p class="student-badges__earned">
                  {{ t('badges.student.earnedAt', { date: formatDate(badge.earnedAt) }) }}
                </p>
                <p v-if="badge.metadata" class="student-badges__metadata">
                  {{ badge.metadata }}
                </p>
              </template>
            </UiListItem>
          </UiList>
        </template>
        <template v-else>
          <div class="student-badges__empty">
            <UiIcon name="TrophyOutlined" :size="48" />
            <p>{{ t('badges.student.empty') }}</p>
          </div>
        </template>
      </UiCard>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import UiCard from '@/components/ui/UiCard.vue';
import UiList from '@/components/ui/UiList.vue';
import UiListItem from '@/components/ui/UiListItem.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import UiSkeleton from '@/components/ui/UiSkeleton.vue';

import { listStudentBadges, type StudentBadgeItem } from '@/api/badges';
import { useToast } from '@/composables/useToast';

const { t } = useI18n();
const toast = useToast();

const items = ref<StudentBadgeItem[]>([]);
const loading = ref(false);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });

const load = async () => {
  loading.value = true;
  try {
    items.value = await listStudentBadges();
  } catch (error) {
    console.error(error);
    toast.error({ detail: t('badges.student.loadFailed') });
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.student-badges {
  display: grid;
  gap: var(--sakai-space-6);
}

.student-badges__loading {
  display: grid;
  gap: var(--sakai-space-4);
}

.student-badges__icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: var(--sakai-radius-md);
  background: var(--sakai-surface-color-muted);
  overflow: hidden;
}

.student-badges__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.student-badges__earned {
  margin: var(--sakai-space-2) 0 0;
  font-size: 0.85rem;
  color: var(--sakai-text-color-tertiary);
}

.student-badges__metadata {
  margin: var(--sakai-space-1) 0 0;
  font-size: 0.85rem;
  color: var(--sakai-text-color-secondary);
}

.student-badges__empty {
  display: grid;
  gap: var(--sakai-space-3);
  justify-items: center;
  padding: var(--sakai-space-10) var(--sakai-space-4);
  color: var(--sakai-text-color-tertiary);
}

.student-badges__empty p {
  margin: 0;
  font-size: 0.95rem;
}
</style>
