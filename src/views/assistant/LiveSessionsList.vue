<template>
  <ThemePage
    :title="t('live.teacher.titlePage')"
    :subtitle="t('live.teacher.subtitle')"
  >
    <section class="live-content" dir="ltr">
      <v-row class="fill-height">
        <v-col>
          <v-sheet height="64" color="transparent">
            <v-toolbar flat color="transparent">
              <v-btn
                class="me-4"
                color="primary"
                variant="outlined"
                @click="setToday"
              >
                {{ t("live.calendar.today") }}
              </v-btn>
              <v-btn size="small" variant="text" icon @click="prev">
                {{ t("live.calendar.prev") }}
              </v-btn>
              <v-btn size="small" variant="text" icon @click="next">
                {{ t("live.calendar.next") }}
              </v-btn>
              <v-toolbar-title v-if="calendar">
                {{ calendar.title }}
              </v-toolbar-title>
              <v-menu location="bottom end">
                <template v-slot:activator="{ props }">
                  <v-btn color="primary" variant="outlined" v-bind="props">
                    <span>{{ typeToLabel[type] }}</span>
                    <v-icon end> mdi-menu-down </v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item @click="type = 'day'">
                    <v-list-item-title>{{
                      t("live.calendar.day")
                    }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="type = 'week'">
                    <v-list-item-title>{{
                      t("live.calendar.week")
                    }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="type = 'month'">
                    <v-list-item-title>{{
                      t("live.calendar.month")
                    }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="type = '5day'">
                    <v-list-item-title>{{
                      t("live.calendar.fiveDays")
                    }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-toolbar>
          </v-sheet>
          <v-sheet height="600" color="transparent">
            <v-calendar
              ref="calendar"
              v-model="focus"
              :event-color="getEventColor"
              :events="events"
              :type="type === '5day' ? 'custom-daily' : type"
              :start="type === '5day' ? focusDate : undefined"
              :end="type === '5day' ? focusPlus4Days : undefined"
              :first-day-of-week="6"
              color="primary"
              @change="updateRange"
              @click:date="viewDay"
              @click:event="showEvent"
              @click:more="viewDay"
            ></v-calendar>
            <v-menu
              v-model="selectedOpen"
              :activator="selectedElement"
              :close-on-content-click="false"
              location="end"
            >
              <v-card
                min-width="350px"
                max-width="400px"
                elevation="4"
                class="rounded-xl overflow-hidden border border-border"
              >
                <!-- Header -->
                <div
                  :class="`bg-${selectedEvent.color} text-white pa-5 relative`"
                >
                  <div class="relative z-10">
                    <div class="d-flex align-center justify-space-between mb-2">
                      <v-chip
                        size="x-small"
                        class="font-weight-bold text-uppercase"
                        color="white"
                        variant="flat"
                        :class="`text-${selectedEvent.color}`"
                      >
                        {{ selectedEvent.status }}
                      </v-chip>
                    </div>
                    <div class="text-h6 font-weight-bold mb-1 leading-tight">
                      <span
                        v-if="selectedEvent.courseId"
                        class="opacity-80 text-body-2 d-block mb-1"
                        >{{ selectedEvent.courseId }}</span
                      >
                      {{ selectedEvent.name }}
                    </div>
                    <div
                      class="text-caption opacity-90 d-flex align-center gap-1 mt-2"
                      v-if="selectedEvent.scheduledAt"
                    >
                      <UiIcon name="CalendarOutlined" :size="14" />
                      {{ formatDate(selectedEvent.scheduledAt) }}
                    </div>
                  </div>
                </div>

                <v-card-text class="pa-5">
                  <div class="grid grid-cols-2 gap-y-5 gap-x-4">
                    <!-- Module -->
                    <div
                      class="flex items-start gap-3 col-span-2 sm:col-span-1"
                      v-if="selectedEvent.moduleId"
                    >
                      <v-avatar
                        color="primary"
                        variant="tonal"
                        rounded="lg"
                        size="40"
                        class="shrink-0"
                      >
                        <UiIcon name="AppstoreOutlined" :size="20" />
                      </v-avatar>
                      <div class="flex flex-col overflow-hidden">
                        <span class="text-xs text-medium-emphasis truncate">{{
                          t("live.details.module")
                        }}</span>
                        <span
                          class="text-sm font-weight-medium text-high-emphasis truncate"
                          :title="selectedEvent.moduleId"
                        >
                          {{ selectedEvent.moduleId }}
                        </span>
                      </div>
                    </div>

                    <!-- Students -->
                    <div
                      class="flex items-start gap-3 col-span-2 sm:col-span-1"
                      v-if="selectedEvent.studentCount !== undefined"
                    >
                      <v-avatar
                        color="primary"
                        variant="tonal"
                        rounded="lg"
                        size="40"
                        class="shrink-0"
                      >
                        <UiIcon name="TeamOutlined" :size="20" />
                      </v-avatar>
                      <div class="flex flex-col overflow-hidden">
                        <span class="text-xs text-medium-emphasis truncate">{{
                          t("live.details.students")
                        }}</span>
                        <span
                          class="text-sm font-weight-medium text-high-emphasis truncate"
                        >
                          {{ selectedEvent.studentCount }}
                        </span>
                      </div>
                    </div>

                    <!-- Duration -->
                    <div
                      class="flex items-start gap-3 col-span-2 sm:col-span-1"
                      v-if="selectedEvent.durationMinutes"
                    >
                      <v-avatar
                        color="primary"
                        variant="tonal"
                        rounded="lg"
                        size="40"
                        class="shrink-0"
                      >
                        <UiIcon name="ClockCircleOutlined" :size="20" />
                      </v-avatar>
                      <div class="flex flex-col overflow-hidden">
                        <span class="text-xs text-medium-emphasis truncate">{{
                          t("live.details.duration")
                        }}</span>
                        <span
                          class="text-sm font-weight-medium text-high-emphasis truncate"
                        >
                          {{ selectedEvent.durationMinutes }}
                          {{ t("live.details.durationMins") }}
                        </span>
                      </div>
                    </div>

                    <!-- Provider -->
                    <div
                      class="flex items-start gap-3 col-span-2 sm:col-span-1"
                      v-if="selectedEvent.provider"
                    >
                      <v-avatar
                        color="primary"
                        variant="tonal"
                        rounded="lg"
                        size="40"
                        class="shrink-0"
                      >
                        <UiIcon name="VideoCameraOutlined" :size="20" />
                      </v-avatar>
                      <div class="flex flex-col overflow-hidden">
                        <span class="text-xs text-medium-emphasis truncate">{{
                          t("live.details.provider")
                        }}</span>
                        <span
                          class="text-sm font-weight-medium text-high-emphasis text-capitalize truncate"
                        >
                          {{ selectedEvent.provider }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Join Link -->
                  <div
                    v-if="selectedEvent.joinUrl"
                    class="mt-5 p-3 rounded-lg border border-border flex flex-col gap-2"
                  >
                    <div
                      class="text-xs font-weight-medium text-medium-emphasis flex items-center gap-1"
                    >
                      <UiIcon name="ExportOutlined" :size="14" />
                      {{ t("live.details.joinLink") }}
                    </div>
                    <a
                      :href="getAbsoluteUrl(selectedEvent.joinUrl)"
                      target="_blank"
                      class="text-sm font-weight-bold text-primary hover:underline break-all"
                    >
                      {{ selectedEvent.joinUrl }}
                    </a>
                  </div>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions
                  class="pa-4 bg-surface-alt d-flex flex-wrap gap-2"
                >
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    variant="text"
                    @click="selectedOpen = false"
                  >
                    {{ t("live.details.close") }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
          </v-sheet>
        </v-col>
      </v-row>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import ThemePage from "@/layout/theme/ThemePage.vue";
import { useToast } from "@/composables/useToast";
import { listInstructorLiveSessions } from "@/api/live";

const { t, locale } = useI18n();
const toast = useToast();

function formatDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale.value, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const calendar = ref<any>(null);
const focus = ref("");
const type = ref<any>("month");
const selectedEvent = ref<any>({});
const selectedElement = ref<any>(null);
const selectedOpen = ref(false);
const events = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const typeToLabel = computed<Record<string, string>>(() => ({
  month: t("live.calendar.month"),
  week: t("live.calendar.week"),
  day: t("live.calendar.day"),
  "5day": t("live.calendar.fiveDays"),
}));

function getAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return "#";
  return url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `https://${url}`;
}

onMounted(() => {
  if (calendar.value) {
    calendar.value.checkChange();
  }
});

function viewDay(nativeEvent: Event, { date }: { date: string }) {
  focus.value = date;
  type.value = "day";
}

function getEventColor(event: any) {
  return event.color || "primary";
}

function setToday() {
  focus.value = "";
}

function toLocalISOString(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
}

const focusDate = computed(() => {
  const d = focus.value ? new Date(focus.value) : new Date();
  return toLocalISOString(d);
});

const focusPlus4Days = computed(() => {
  const d = focus.value ? new Date(focus.value) : new Date();
  d.setDate(d.getDate() + 4);
  return toLocalISOString(d);
});

function prev() {
  if (type.value === "5day") {
    const d = focus.value ? new Date(focus.value) : new Date();
    d.setDate(d.getDate() - 5);
    focus.value = toLocalISOString(d);
  } else if (calendar.value) {
    calendar.value.prev();
  }
}

function next() {
  if (type.value === "5day") {
    const d = focus.value ? new Date(focus.value) : new Date();
    d.setDate(d.getDate() + 5);
    focus.value = toLocalISOString(d);
  } else if (calendar.value) {
    calendar.value.next();
  }
}

function showEvent(nativeEvent: Event, { event }: { event: any }) {
  const open = () => {
    selectedEvent.value = event;
    selectedElement.value = nativeEvent.target as HTMLElement;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => (selectedOpen.value = true)),
    );
  };
  if (selectedOpen.value) {
    selectedOpen.value = false;
    requestAnimationFrame(() => requestAnimationFrame(() => open()));
  } else {
    open();
  }
  nativeEvent.stopPropagation();
}

async function updateRange({
  start,
  end,
}: {
  start: { date: string };
  end: { date: string };
}) {
  // Use dates compatible with the expected query
  const query = {
    from: `${start.date}T00:00:00Z`,
    to: `${end.date}T23:59:59Z`,
  };

  loading.value = true;
  error.value = null;
  try {
    const data = await listInstructorLiveSessions(query);
    events.value = data.items.map((session) => {
      const startD = new Date(session.scheduledAt);
      const endD = new Date(startD.getTime() + session.durationMinutes * 60000);

      let color = "primary";
      if (session.status === "live") color = "success";
      if (session.status === "ended") color = "surface-variant";
      if (session.status === "cancelled") color = "error";

      return {
        ...session,
        name: session.title,
        start: startD,
        end: endD,
        color: color,
        timed: true,
      };
    });
  } catch (err: unknown) {
    error.value = t("live.teacher.loadError");
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}
</script>
