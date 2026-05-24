<template>
  <div class="teacher-dashboard__greeting flex flex-col gap-1 items-start">
    <div class="teacher-dashboard__greeting-heading flex items-center gap-5">
      <h1 class="text-xl leading-7 font-bold text-content-strong m-0">
        {{ welcomeGreeting }}
      </h1>
      <span class="text-2xl leading-8" aria-hidden="true">👋</span>
    </div>
    <p class="text-[13px] leading-normal text-content-tertiary m-0">
      {{ t("teacher.welcomeTagline") }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useTeacherProfileStore } from "@/stores/teacherProfile";
import { useAuthStore } from "@/stores/auth";
import { useTeacherTranslations } from "@/composables/useTeacherTranslations";

const { t } = useTeacherTranslations();

const profileStore = useTeacherProfileStore();
const auth = useAuthStore();

const { profile } = storeToRefs(profileStore);

const firstName = computed(() => {
  const fromProfile = profile.value?.name?.trim().split(/\s+/)[0];
  if (fromProfile) return fromProfile;
  const fromAuth = (auth.user as { firstName?: string } | null)?.firstName?.trim();
  return fromAuth || "";
});

const welcomeGreeting = computed(() =>
  firstName.value
    ? t("teacher.welcomeBack", { name: firstName.value })
    : t("teacher.welcomeBackAnonymous"),
);
</script>
