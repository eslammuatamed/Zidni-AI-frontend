<template>
  <UiCard
    class="teacher-dashboard__plan-usage md:col-span-12 flex flex-col"
    hover
  >
    <template #title>
      <div class="flex items-center justify-between gap-3 flex-wrap w-full">
        <h3 class="m-0 text-[1.05rem] font-semibold text-content">
          {{ planUsageTitle }}
        </h3>
        <span
          v-if="usageSummary"
          class="inline-flex items-center px-2.5 py-1 rounded-md bg-sakai-primary/10 text-sakai-primary text-[0.8rem] font-semibold"
        >
          {{
            usageSummary.planName ||
            usageSummary.planCode ||
            planUsagePlanFallback
          }}
        </span>
      </div>
    </template>
    <template #subtitle>
      <p class="m-0 text-content-tertiary text-[0.9rem]">
        {{ planUsageSubtitle }}
      </p>
    </template>

    <UiAlert v-if="usageError" color="warning" variant="soft">
      {{ planUsageErrorMessage }}
    </UiAlert>
    <div
      v-else-if="usageLoading"
      class="teacher-dashboard__plan-usage-skeleton grid gap-3"
    >
      <UiSkeleton height="1rem" width="50%" />
      <UiSkeleton height="2.5rem" />
      <UiSkeleton height="2.5rem" />
    </div>
    <div v-else-if="usageSummary" class="flex flex-col">
      <p
        v-if="usageSummary.maxVideoDurationMinutes"
        class="text-[0.8rem] text-content-tertiary m-0"
      >
        {{ planUsageMaxDurationLabel }}
        {{ formatNumber(usageSummary.maxVideoDurationMinutes) }}
        {{ planUsageMinuteShort }}
      </p>

      <UiAlert
        v-if="storageWarning"
        color="warning"
        variant="soft"
        class="mt-3"
      >
        {{ storageWarning }}
      </UiAlert>
      <UiAlert
        v-if="storageSizeWarning"
        color="warning"
        variant="soft"
        class="mt-3"
      >
        {{ storageSizeWarning }}
      </UiAlert>
      <UiAlert
        v-if="streamingWarning"
        color="warning"
        variant="soft"
        class="mt-3"
      >
        {{ streamingWarning }}
      </UiAlert>

      <div class="mt-5 divide-y divide-border/40">
        <div
          class="teacher-dashboard__plan-usage-item flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-medium text-content">
              {{ planUsageStorageLabel }}
            </span>
            <span
              v-if="!isStorageUnlimited"
              class="text-[0.8rem] text-content-secondary font-medium tabular-nums"
            >
              {{ formatDurationSeconds(usageSummary.storageSecondsUsed) }} /
              {{ formatDurationSeconds(usageSummary.storageSecondsLimit ?? 0) }}
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 text-[0.8rem] text-content-secondary"
            >
              <span class="tabular-nums">
                {{ formatDurationSeconds(usageSummary.storageSecondsUsed) }}
              </span>
              <span class="text-content-tertiary" aria-hidden="true">•</span>
              <span class="font-medium inline-flex items-center gap-1">
                <span aria-hidden="true">∞</span>
                {{ planUsageUnlimitedLabel }}
              </span>
            </span>
          </div>
          <UiProgressBar
            v-if="!isStorageUnlimited"
            :value="storageUsagePercent"
            color="primary"
            :show-value="false"
          />
          <div
            v-else
            class="h-3 rounded-full border border-dashed border-border/50"
            aria-hidden="true"
          />
          <div
            v-if="storageRemainingLabel"
            class="text-[0.75rem] text-content-tertiary"
          >
            {{ storageRemainingLabel }}
          </div>
        </div>

        <div
          class="teacher-dashboard__plan-usage-item flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-medium text-content">
              {{ planUsageStorageSizeLabel }}
            </span>
            <span
              v-if="!isStorageSizeUnlimited"
              class="text-[0.8rem] text-content-secondary font-medium tabular-nums"
            >
              {{ formatBytes(usageSummary.storageBytesUsed) }} /
              {{ formatBytes(usageSummary.storageBytesLimit ?? 0) }}
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 text-[0.8rem] text-content-secondary"
            >
              <span class="tabular-nums">
                {{ formatBytes(usageSummary.storageBytesUsed) }}
              </span>
              <span class="text-content-tertiary" aria-hidden="true">•</span>
              <span class="font-medium inline-flex items-center gap-1">
                <span aria-hidden="true">∞</span>
                {{ planUsageUnlimitedLabel }}
              </span>
            </span>
          </div>
          <UiProgressBar
            v-if="!isStorageSizeUnlimited"
            :value="storageSizeUsagePercent"
            color="secondary"
            :show-value="false"
          />
          <div
            v-else
            class="h-3 rounded-full border border-dashed border-border/50"
            aria-hidden="true"
          />
          <div
            v-if="storageSizeRemainingLabel"
            class="text-[0.75rem] text-content-tertiary"
          >
            {{ storageSizeRemainingLabel }}
          </div>
        </div>

        <div
          class="teacher-dashboard__plan-usage-item flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-medium text-content">
              {{ planUsageStreamingLabel }}
            </span>
            <span
              v-if="!isStreamingUnlimited"
              class="text-[0.8rem] text-content-secondary font-medium tabular-nums"
            >
              {{ formatMinutes(usageSummary.streamingMinutesUsed) }} /
              {{ formatMinutes(usageSummary.streamingMinutesLimit ?? 0) }}
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 text-[0.8rem] text-content-secondary"
            >
              <span class="tabular-nums">
                {{ formatMinutes(usageSummary.streamingMinutesUsed) }}
              </span>
              <span class="text-content-tertiary" aria-hidden="true">•</span>
              <span class="font-medium inline-flex items-center gap-1">
                <span aria-hidden="true">∞</span>
                {{ planUsageUnlimitedLabel }}
              </span>
            </span>
          </div>
          <UiProgressBar
            v-if="!isStreamingUnlimited"
            :value="streamingUsagePercent"
            color="info"
            :show-value="false"
          />
          <div
            v-else
            class="h-3 rounded-full border border-dashed border-border/50"
            aria-hidden="true"
          />
          <div
            v-if="streamingRemainingLabel"
            class="text-[0.75rem] text-content-tertiary"
          >
            {{ streamingRemainingLabel }}
          </div>
        </div>
      </div>

      <div
        class="border-t border-border/40 pt-6 mt-6 flex flex-col gap-4"
      >
        <div
          class="text-[0.85rem] font-semibold text-content-secondary uppercase tracking-[0.08em]"
        >
          {{ planUsageTrendsTitle }}
        </div>
        <UiAlert v-if="trendsError" color="warning" variant="soft">
          {{ planUsageTrendsErrorMessage }}
        </UiAlert>
        <div
          v-else-if="trendsLoading"
          class="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]"
        >
          <UiSkeleton height="180px" />
          <UiSkeleton height="180px" />
        </div>
        <div
          v-else-if="trendPoints.length"
          class="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]"
        >
          <div class="flex flex-col gap-2">
            <span
              class="text-[0.75rem] text-content-tertiary uppercase tracking-[0.08em]"
            >
              {{ planUsageStorageTrendLabel }}
            </span>
            <TheLineChart
              :data="storageTrendSeries"
              :categories="trendLabels"
              variant="minimal"
              :height="180"
            />
          </div>
          <div class="flex flex-col gap-2">
            <span
              class="text-[0.75rem] text-content-tertiary uppercase tracking-[0.08em]"
            >
              {{ planUsageStreamingTrendLabel }}
            </span>
            <TheLineChart
              :data="streamingTrendSeries"
              :categories="trendLabels"
              variant="minimal"
              :height="180"
            />
          </div>
        </div>
        <p v-else class="m-0 text-[0.85rem] text-content-tertiary">
          {{ planUsageTrendsEmptyMessage }}
        </p>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useTeacherUsageStore } from "@/stores/teacherUsage";
import { useTeacherTranslations } from "@/composables/useTeacherTranslations";
import { formatNumber, formatPercent } from "@/utils/formatNumber";
import UiCard from "@/components/ui/UiCard.vue";
import UiAlert from "@/components/ui/UiAlert.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";
import UiProgressBar from "@/components/ui/UiProgressBar.vue";
import TheLineChart, {
  type ChartSeries,
} from "@/components/dashboard/TheLineChart.vue";

const { locale, translateTeacher, translateTeacherWithParams } =
  useTeacherTranslations();

const usageStore = useTeacherUsageStore();
const {
  summary: usageSummary,
  loading: usageLoading,
  error: usageError,
  trends: trendPoints,
  trendsLoading,
  trendsError,
} = storeToRefs(usageStore);

const localeTag = computed(() => (locale.value === "ar" ? "ar-EG" : "en-US"));

// i18n label computeds
const planUsageTitle = computed(() =>
  translateTeacher("teacher.planUsageTitle", "Plan usage"),
);
const planUsageSubtitle = computed(() =>
  translateTeacher(
    "teacher.planUsageSubtitle",
    "Monitor storage and streaming limits for your plan.",
  ),
);
const planUsageErrorMessage = computed(() =>
  translateTeacher(
    "teacher.planUsageError",
    "We couldn't load your current usage. Please refresh to try again.",
  ),
);
const planUsagePlanFallback = computed(() =>
  translateTeacher("teacher.planUsagePlanFallback", "Plan"),
);
const planUsageMaxDurationLabel = computed(() =>
  translateTeacher("teacher.planUsageMaxDuration", "Max duration:"),
);
const planUsageUnlimitedLabel = computed(() =>
  translateTeacher("teacher.planUsageUnlimited", "Unlimited"),
);
const planUsageStorageLabel = computed(() =>
  translateTeacher("teacher.planUsageVideoStorage", "Video storage"),
);
const planUsageStorageSizeLabel = computed(() =>
  translateTeacher("teacher.planUsageVideoStorageSize", "Video storage size"),
);
const planUsageStreamingLabel = computed(() =>
  translateTeacher("teacher.planUsageStreamingMinutes", "Streaming minutes"),
);
const planUsageTrendsTitle = computed(() =>
  translateTeacherWithParams(
    "teacher.planUsageTrendsTitle",
    "Usage trends (last {months} months)",
    { months: 6 },
  ),
);
const planUsageTrendsErrorMessage = computed(() =>
  translateTeacher(
    "teacher.planUsageTrendsError",
    "We couldn't load usage trends yet.",
  ),
);
const planUsageTrendsEmptyMessage = computed(() =>
  translateTeacher("teacher.planUsageTrendsEmpty", "No trend data yet."),
);
const planUsageStorageTrendLabel = computed(() =>
  translateTeacher("teacher.planUsageStorageTrendLabel", "Storage (hours)"),
);
const planUsageStreamingTrendLabel = computed(() =>
  translateTeacher(
    "teacher.planUsageStreamingTrendLabel",
    "Streaming (minutes)",
  ),
);
const planUsageMinuteShort = computed(() =>
  translateTeacher("teacher.planUsageMinuteShort", "min"),
);
const planUsageHourShort = computed(() =>
  translateTeacher("teacher.planUsageHourShort", "h"),
);

// Co-located formatters
const formatMinutes = (value: number) =>
  `${formatNumber(Math.max(0, Math.round(value)))} ${planUsageMinuteShort.value}`;

const formatDurationSeconds = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${formatNumber(hours)}${planUsageHourShort.value} ${formatNumber(minutes)}${planUsageMinuteShort.value}`;
  }
  return `${formatNumber(minutes)}${planUsageMinuteShort.value}`;
};

const formatBytes = (bytes: number) => {
  const safe = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  if (safe === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(safe) / Math.log(1024)),
  );
  const value = safe / 1024 ** index;
  const rounded =
    value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${formatNumber(rounded)} ${units[index]}`;
};

const formatRemainingSeconds = (seconds: number) => {
  const safe = Math.max(0, Math.round(seconds));
  if (safe <= 0) return `0${planUsageMinuteShort.value}`;
  return formatDurationSeconds(safe);
};

const formatMonthLabel = (value: string) => {
  if (!value) {
    return "";
  }
  const [year, month] = value.split("-").map((part) => Number(part));
  if (!year || !month) {
    return value;
  }
  try {
    return new Intl.DateTimeFormat(localeTag.value, { month: "short" }).format(
      new Date(year, month - 1, 1),
    );
  } catch (error) {
    return value;
  }
};

// Trend series + categories
const trendLabels = computed(() =>
  trendPoints.value.map((point) => formatMonthLabel(point.month)),
);
const storageTrendValues = computed(() =>
  trendPoints.value.map((point) =>
    Number((point.storageSeconds / 3600).toFixed(2)),
  ),
);
const streamingTrendValues = computed(() =>
  trendPoints.value.map((point) =>
    Math.max(0, Math.round(point.streamingMinutes)),
  ),
);

const storageTrendSeries = computed<ChartSeries[]>(() => [
  {
    name: planUsageStorageTrendLabel.value,
    data: storageTrendValues.value,
  },
]);

const streamingTrendSeries = computed<ChartSeries[]>(() => [
  {
    name: planUsageStreamingTrendLabel.value,
    data: streamingTrendValues.value,
  },
]);

// Unlimited gates
const isStorageUnlimited = computed(() => {
  const limit = usageSummary.value?.storageSecondsLimit;
  return limit === null || limit === undefined || limit <= 0;
});

const isStorageSizeUnlimited = computed(() => {
  const limit = usageSummary.value?.storageBytesLimit;
  return limit === null || limit === undefined || limit <= 0;
});

const isStreamingUnlimited = computed(() => {
  const limit = usageSummary.value?.streamingMinutesLimit;
  return limit === null || limit === undefined || limit <= 0;
});

// Percentage computeds
const storageUsagePercent = computed(() => {
  const used = usageSummary.value?.storageSecondsUsed ?? 0;
  const limit = usageSummary.value?.storageSecondsLimit;
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
});

const storageSizeUsagePercent = computed(() => {
  const used = usageSummary.value?.storageBytesUsed ?? 0;
  const limit = usageSummary.value?.storageBytesLimit;
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
});

const streamingUsagePercent = computed(() => {
  const used = usageSummary.value?.streamingMinutesUsed ?? 0;
  const limit = usageSummary.value?.streamingMinutesLimit;
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
});

// Remaining text + label computeds
const storageRemainingText = computed(() => {
  const used = usageSummary.value?.storageSecondsUsed ?? 0;
  const limit = usageSummary.value?.storageSecondsLimit;
  if (!limit || limit <= 0) return "";
  return formatRemainingSeconds(limit - used);
});

const storageSizeRemainingText = computed(() => {
  const used = usageSummary.value?.storageBytesUsed ?? 0;
  const limit = usageSummary.value?.storageBytesLimit;
  if (!limit || limit <= 0) return "";
  return formatBytes(limit - used);
});

const streamingRemainingText = computed(() => {
  const used = usageSummary.value?.streamingMinutesUsed ?? 0;
  const limit = usageSummary.value?.streamingMinutesLimit;
  if (!limit || limit <= 0) return "";
  return formatMinutes(Math.max(0, limit - used));
});

const storageRemainingLabel = computed(() => {
  if (!storageRemainingText.value) return "";
  return translateTeacherWithParams(
    "teacher.planUsageRemaining",
    "{value} remaining",
    { value: storageRemainingText.value },
  );
});

const storageSizeRemainingLabel = computed(() => {
  if (!storageSizeRemainingText.value) return "";
  return translateTeacherWithParams(
    "teacher.planUsageRemaining",
    "{value} remaining",
    { value: storageSizeRemainingText.value },
  );
});

const streamingRemainingLabel = computed(() => {
  if (!streamingRemainingText.value) return "";
  return translateTeacherWithParams(
    "teacher.planUsageRemainingThisMonth",
    "{value} remaining this month",
    { value: streamingRemainingText.value },
  );
});

// Threshold + warning logic
const resolveThreshold = (
  value: number | null | undefined,
  fallback: number,
) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
};

const buildUsageWarning = (
  label: string,
  percent: number,
  limit: number | null,
  warningThreshold: number,
  criticalThreshold: number,
) => {
  if (!limit || limit <= 0) return "";
  if (percent >= 100) {
    return translateTeacherWithParams(
      "teacher.planUsageLimitReached",
      "{label} limit reached ({percent} used)",
      { label, percent: formatPercent(percent) },
    );
  }
  if (percent >= criticalThreshold) {
    return translateTeacherWithParams(
      "teacher.planUsageCritical",
      "{label} usage is very high ({percent} used)",
      { label, percent: formatPercent(percent) },
    );
  }
  if (percent >= warningThreshold) {
    return translateTeacherWithParams(
      "teacher.planUsageWarning",
      "{label} usage is approaching the limit ({percent} used)",
      { label, percent: formatPercent(percent) },
    );
  }
  return "";
};

const storageWarning = computed(() => {
  if (!usageSummary.value) return "";
  const warning = resolveThreshold(
    usageSummary.value.storageWarningPercent,
    80,
  );
  const critical = resolveThreshold(
    usageSummary.value.storageCriticalPercent,
    90,
  );
  return buildUsageWarning(
    planUsageStorageLabel.value,
    storageUsagePercent.value,
    usageSummary.value.storageSecondsLimit,
    warning,
    critical,
  );
});

const storageSizeWarning = computed(() => {
  if (!usageSummary.value) return "";
  const warning = resolveThreshold(
    usageSummary.value.storageWarningPercent,
    80,
  );
  const critical = resolveThreshold(
    usageSummary.value.storageCriticalPercent,
    90,
  );
  return buildUsageWarning(
    planUsageStorageSizeLabel.value,
    storageSizeUsagePercent.value,
    usageSummary.value.storageBytesLimit,
    warning,
    critical,
  );
});

const streamingWarning = computed(() => {
  if (!usageSummary.value) return "";
  const warning = resolveThreshold(
    usageSummary.value.streamingWarningPercent,
    80,
  );
  const critical = resolveThreshold(
    usageSummary.value.streamingCriticalPercent,
    90,
  );
  return buildUsageWarning(
    planUsageStreamingLabel.value,
    streamingUsagePercent.value,
    usageSummary.value.streamingMinutesLimit,
    warning,
    critical,
  );
});
</script>

<style scoped>
/* Plan usage progress track — boost contrast on white card surface */
/* Couples to UiProgressBar's internal class name; scoped to this card only. */
.teacher-dashboard__plan-usage-item :deep(.ui-progress__track) {
  background: var(--sakai-border-color);
}
</style>
