<template>
  <ThemePage :title="detail?.title || t('videos.detailTitle')" :subtitle="detail?.teacher?.name">
    <section class="video-detail">
      <UiAlert v-if="loading" color="info" variant="soft">{{ t('videos.loading') }}</UiAlert>
      <UiAlert v-else-if="error" color="danger" variant="soft">{{ error }}</UiAlert>
      <div v-else-if="detail" class="video-detail__content">
        <div class="video-detail__media">
          <div v-if="detail.videoUrl" class="video-detail__video">
            <iframe
              v-if="isEmbeddable(detail.videoUrl)"
              :src="buildEmbedUrl(detail.videoUrl)"
              frameborder="0"
              allowfullscreen
            ></iframe>
            <a v-else :href="detail.videoUrl" target="_blank" rel="noopener" class="video-detail__link">
              {{ t('videos.openExternal') }}
            </a>
          </div>
          <div v-else class="video-detail__placeholder">
            <MuseIcon name="PlayCircleOutlined" size="2x" />
          </div>
        </div>
        <div class="video-detail__info">
          <UiTag :color="statusColor(detail.status)" size="sm">{{ statusLabel(detail.status) }}</UiTag>
          <p class="video-detail__meta">
            <span>{{ formatDate(detail.publishedAt) }}</span>
            <span v-if="detail.locale">{{ detail.locale.toUpperCase() }}</span>
          </p>
          <p class="video-detail__description">{{ detail.description || t('videos.noDescription') }}</p>
          <div v-if="detail.tags.length" class="video-detail__tags">
            <UiTag v-for="tag in detail.tags" :key="tag" size="sm">#{{ tag }}</UiTag>
          </div>
          <div class="video-detail__cta" v-if="cta">
            <UiButton :to="cta.href" color="primary" variant="outline">{{ cta.label }}</UiButton>
          </div>
        </div>
      </div>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTag from '@/components/ui/UiTag.vue';
import UiButton from '@/components/ui/UiButton.vue';
import MuseIcon from '@/components/MuseIcon.vue';
import { fetchPublicVideo, type PublicationDetail } from '@/services/syndication';

const { t } = useI18n();
const route = useRoute();

const loading = ref(false);
const error = ref('');
const detail = ref<PublicationDetail | null>(null);

const statusColor = (status: PublicationDetail['status']) => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'unpublished':
      return 'secondary';
    default:
      return 'warning';
  }
};

const statusLabel = (status: PublicationDetail['status']) => {
  switch (status) {
    case 'approved':
      return t('syndication.status.approved');
    case 'rejected':
      return t('syndication.status.rejected');
    case 'unpublished':
      return t('syndication.status.unpublished');
    default:
      return t('syndication.status.pending');
  }
};

const cta = computed(() => {
  if (!detail.value || !detail.value.teacher) {
    return null;
  }
  const source = detail.value.sourceRef as Record<string, unknown> | undefined;
  if (detail.value.sourceKind === 'course_lesson' && source?.courseId) {
    return {
      href: `/${detail.value.teacher.slug}/courses/${source.courseId}`,
      label: t('videos.visitCourse')
    };
  }
  if (detail.value.sourceKind === 'live_recording' && source?.liveSessionId) {
    return {
      href: `/${detail.value.teacher.slug}`,
      label: t('videos.visitTeacher')
    };
  }
  if (detail.value.sourceKind === 'external_url' && detail.value.videoUrl) {
    return {
      href: detail.value.videoUrl,
      label: t('videos.openExternal')
    };
  }
  return {
    href: `/${detail.value.teacher.slug}`,
    label: t('videos.visitTeacher')
  };
});

const formatDate = (value?: string | null) => {
  if (!value) {
    return t('videos.notPublished');
  }
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const isEmbeddable = (url: string) => {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
};

const buildEmbedUrl = (url: string) => {
  if (url.includes('youtube.com/watch?v=')) {
    const id = new URL(url).searchParams.get('v');
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes('vimeo.com/')) {
    const id = url.split('vimeo.com/')[1];
    return `https://player.vimeo.com/video/${id}`;
  }
  return url;
};

async function loadDetail() {
  loading.value = true;
  error.value = '';
  try {
    const id = Number(route.params.id);
    detail.value = await fetchPublicVideo(id);
  } catch (err) {
    detail.value = null;
    error.value = t('videos.notFound');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
.video-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.video-detail__content {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.video-detail__media {
  display: flex;
  justify-content: center;
  align-items: center;
}

.video-detail__video {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  border-radius: var(--muse-radius-lg);
  overflow: hidden;
  background: #000;
}

.video-detail__video iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.video-detail__placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--muse-surface) 80%, var(--muse-primary) 20%);
  border-radius: var(--muse-radius-lg);
  color: var(--muse-primary);
}

.video-detail__info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.video-detail__meta {
  display: flex;
  gap: 0.75rem;
  color: var(--muse-text-muted);
}

.video-detail__description {
  white-space: pre-line;
}

.video-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.video-detail__cta {
  margin-top: 1rem;
}

.video-detail__link {
  color: var(--muse-primary);
  font-weight: var(--muse-font-semibold);
}
</style>
