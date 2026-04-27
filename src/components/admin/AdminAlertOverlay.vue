<template>
  <transition name="admin-alert-overlay">
    <div v-if="alert" class="admin-alert-overlay">
      <div
        class="admin-alert-overlay__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-alert-overlay-title"
        aria-describedby="admin-alert-overlay-message"
      >
        <UiIcon name="WarningOutlined" class="admin-alert-overlay__icon" aria-hidden="true" />
        <h2 id="admin-alert-overlay-title" class="admin-alert-overlay__title">
          {{ t('notifications.adminAlert.title') }}
        </h2>
        <p class="admin-alert-overlay__intro">
          {{ t('notifications.adminAlert.body') }}
        </p>
        <p id="admin-alert-overlay-message" class="admin-alert-overlay__message">
          {{ alert.message }}
        </p>
        <UiButton color="primary" size="lg" class="admin-alert-overlay__action" @click="acknowledge">
          {{ t('notifications.adminAlert.dismiss') }}
        </UiButton>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/stores/notifications';
import UiButton from '@/components/ui/UiButton.vue';
import UiIcon from '@/components/ui/UiIcon.vue';

const { t } = useI18n();
const notifications = useNotificationStore();

const alert = computed(() => notifications.activeAdminAlert);

const acknowledge = async () => {
  await notifications.acknowledgeAdminAlert();
};
</script>

<style scoped>
.admin-alert-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 2200;
}

.admin-alert-overlay__dialog {
  max-width: 520px;
  width: 100%;
  background: var(--theme-surface, #ffffff);
  color: var(--theme-on-surface, #111827);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.25);
}

.admin-alert-overlay__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(234, 88, 12, 0.12);
  color: #ea580c;
  font-size: 28px;
  margin-bottom: 16px;
}

.admin-alert-overlay__title {
  font-size: 1.75rem;
  margin-bottom: 8px;
  font-weight: 700;
}

.admin-alert-overlay__intro {
  margin: 0 auto 16px;
  font-size: 1rem;
  color: rgba(17, 24, 39, 0.75);
}

.admin-alert-overlay__message {
  margin: 0 auto 24px;
  font-size: 1.2rem;
  line-height: 1.6;
  font-weight: 600;
  color: #111827;
  word-break: break-word;
}

.admin-alert-overlay__action {
  min-width: 180px;
}

.admin-alert-overlay-enter-active,
.admin-alert-overlay-leave-active {
  transition: opacity 0.25s ease;
}

.admin-alert-overlay-enter-from,
.admin-alert-overlay-leave-to {
  opacity: 0;
}
</style>
