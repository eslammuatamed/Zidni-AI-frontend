<template>
  <ThemePage
    :title="t('live.student.titlePage')"
    :subtitle="t('live.student.subtitle')"
  >
    <section class="student-live" dir="ltr">
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
                class="rounded-xl overflow-hidden [border:1px_solid_var(--sakai-border-color)]"
              >
                <!-- Header -->
                <div
                  :class="`bg-${selectedEvent.color} text-white pa-5 relative`"
                >
                  <div class="relative z-10">
                    <div class="d-flex align-center justify-space-between mb-2">
                      <v-chip
                        v-if="selectedEvent.registrationStatus"
                        size="x-small"
                        class="font-weight-bold text-uppercase"
                        color="white"
                        variant="flat"
                        :class="`text-${selectedEvent.color}`"
                      >
                        {{ selectedEvent.registrationStatus }}
                      </v-chip>
                      <v-chip
                        v-else
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
                        v-if="selectedEvent.courseTitle"
                        class="opacity-80 text-body-2 d-block mb-1"
                        >{{ selectedEvent.courseTitle }}</span
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
                    <div
                      class="flex items-start gap-3 col-span-2 sm:col-span-1"
                      v-if="selectedEvent.assignedInstructorName"
                    >
                      <v-avatar
                        color="primary"
                        variant="tonal"
                        rounded="lg"
                        size="40"
                        class="shrink-0"
                      >
                        <UiIcon name="UserOutlined" :size="20" />
                      </v-avatar>
                      <div class="flex flex-col overflow-hidden">
                        <span class="text-xs text-medium-emphasis truncate">{{
                          t("live.details.instructor")
                        }}</span>
                        <span
                          class="text-sm font-weight-medium text-high-emphasis truncate"
                          :title="selectedEvent.assignedInstructorName"
                        >
                          {{ selectedEvent.assignedInstructorName }}
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
                    v-if="selectedEvent.displayJoinUrl"
                    class="mt-5 p-3 rounded-lg [border:1px_solid_var(--sakai-border-color)] flex flex-col gap-2"
                  >
                    <div
                      class="text-xs font-weight-medium text-medium-emphasis flex items-center gap-1"
                    >
                      <UiIcon name="ExportOutlined" :size="14" />
                      {{ t("live.details.joinLink") }}
                    </div>
                    <a
                      :href="getAbsoluteUrl(selectedEvent.displayJoinUrl)"
                      target="_blank"
                      class="text-sm font-weight-bold text-primary hover:underline break-all"
                    >
                      {{ selectedEvent.displayJoinUrl }}
                    </a>
                  </div>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions class="pa-4 bg-surface-alt d-flex gap-2">
                  <UiButton
                    size="sm"
                    color="primary"
                    variant="solid"
                    class="flex-1"
                    :disabled="!selectedEvent.canJoin"
                    @click="join(selectedEvent)"
                  >
                    {{ t("live.student.join") }}
                  </UiButton>
                  <UiButton
                    v-if="liveSessionsChatEnabled"
                    size="sm"
                    color="secondary"
                    variant="outline"
                    class="flex-1 text-nowrap"
                    @click="openChat(selectedEvent)"
                  >
                    {{ t("live.student.openChat") }}
                  </UiButton>
                  <v-btn
                    color="medium-emphasis"
                    variant="text"
                    class="flex-1"
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
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import { useToast } from "@/composables/useToast";
import { useFeaturesStore } from "@/stores/features";
import { FEATURE } from "@/constants/featureCatalog";
import { useRouter } from "vue-router";
import {
  listStudentSessions,
  registerForSession,
  joinSession,
  type StudentLiveSession,
} from "@/api/live";

const { t, locale } = useI18n();
const toast = useToast();
const featuresStore = useFeaturesStore();
const router = useRouter();

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

const liveSessionsChatEnabled = computed(() =>
  featuresStore.hasFeature(FEATURE.liveSessionsChat),
);

const typeToLabel = computed<Record<string, string>>(() => ({
  month: t("live.calendar.month"),
  week: t("live.calendar.week"),
  day: t("live.calendar.day"),
  "5day": t("live.calendar.fiveDays"),
}));

let currentRange = { start: { date: "" }, end: { date: "" } };

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

async function loadEvents() {
  if (!currentRange.start.date || !currentRange.end.date) return;
  const query = {
    from: `${currentRange.start.date}T00:00:00Z`,
    to: `${currentRange.end.date}T23:59:59Z`,
  };

  loading.value = true;
  error.value = null;
  try {
    const data = await listStudentSessions(query);
    events.value = data.items.map((session) => {
      const startD = session.scheduledAt
        ? new Date(session.scheduledAt)
        : new Date();
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
    error.value = t("live.student.loadError");
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}

async function updateRange({
  start,
  end,
}: {
  start: { date: string };
  end: { date: string };
}) {
  currentRange = { start, end };
  await loadEvents();
}

async function register(session: StudentLiveSession) {
  try {
    await registerForSession(session.sessionId);
    toast.success(t("live.student.registerSuccess"));
    await loadEvents();
    if (
      selectedEvent.value &&
      selectedEvent.value.sessionId === session.sessionId
    ) {
      selectedOpen.value = false;
    }
  } catch (err: unknown) {
    toast.error(t("live.student.registerError"));
  }
}

async function join(session: StudentLiveSession) {
  try {
    const view = await joinSession(session.sessionId);
    toast.success(t("live.student.joinSuccess"));
    if (view.joinUrl) {
      window.open(getAbsoluteUrl(view.joinUrl), "_blank");
    }
    await loadEvents();
  } catch (err: unknown) {
    toast.error(t("live.student.joinError"));
  }
}

function openChat(session: StudentLiveSession) {
  router.push({
    name: "student-live-chat",
    query: { sessionId: String(session.sessionId) },
  });
}
</script>
