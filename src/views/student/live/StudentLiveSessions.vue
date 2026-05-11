<template>
  <ThemePage :title="t('live.student.titlePage')" :subtitle="t('live.student.subtitle')">
    <section class="student-live" dir="ltr">
      <v-row class="fill-height">
        <v-col>
          <v-sheet height="64">
            <v-toolbar flat>
              <v-btn
                class="me-4"
                color="grey-darken-2"
                variant="outlined"
                @click="setToday"
              >
                Today
              </v-btn>
              <v-btn
                color="grey-darken-2"
                size="small"
                variant="text"
                icon
                @click="prev"
              >
                prev
                <v-icon size="small"> mdi-chevron-left </v-icon>
              </v-btn>
              <v-btn
                color="grey-darken-2"
                size="small"
                variant="text"
                icon
                @click="next"
              >
                next
                <v-icon size="small"> mdi-chevron-right </v-icon>
              </v-btn>
              <v-toolbar-title v-if="calendar">
                {{ calendar.title }}
              </v-toolbar-title>
              <v-menu location="bottom end">
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="grey-darken-2"
                    variant="outlined"
                    v-bind="props"
                  >
                    <span>{{ typeToLabel[type] }}</span>
                    <v-icon end> mdi-menu-down </v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item @click="type = 'day'">
                    <v-list-item-title>Day</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="type = 'week'">
                    <v-list-item-title>Week</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="type = 'month'">
                    <v-list-item-title>Month</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="type = '4day'">
                    <v-list-item-title>4 days</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-toolbar>
          </v-sheet>
          <v-sheet height="600">
            <v-calendar
              ref="calendar"
              v-model="focus"
              :event-color="getEventColor"
              :events="events"
              :type="type"
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
              <v-card min-width="350px" max-width="400px" elevation="4" class="rounded-lg">
                <div :class="`bg-${selectedEvent.color} text-white pa-4`">
                  <div class="text-h6 font-weight-bold">{{ selectedEvent.name }}</div>
                  <div class="text-subtitle-2 opacity-80 mt-1" v-if="selectedEvent.scheduledAt">
                    {{ new Date(selectedEvent.scheduledAt).toLocaleString() }}
                  </div>
                </div>
                
                <v-card-text class="pa-4 pt-4">
                  <v-list density="compact" class="pa-0">
                    <v-list-item class="px-0" v-if="selectedEvent.courseTitle">
                      <template v-slot:prepend>
                        <v-icon color="medium-emphasis" class="me-3">mdi-book-open-variant</v-icon>
                      </template>
                      <v-list-item-title class="font-weight-medium">Course</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedEvent.courseTitle }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item class="px-0" v-if="selectedEvent.assignedInstructorName">
                      <template v-slot:prepend>
                        <v-icon color="medium-emphasis" class="me-3">mdi-account-tie</v-icon>
                      </template>
                      <v-list-item-title class="font-weight-medium">Instructor</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedEvent.assignedInstructorName }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item class="px-0" v-if="selectedEvent.durationMinutes">
                      <template v-slot:prepend>
                        <v-icon color="medium-emphasis" class="me-3">mdi-clock-outline</v-icon>
                      </template>
                      <v-list-item-title class="font-weight-medium">Duration</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedEvent.durationMinutes }} mins</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item class="px-0" v-if="selectedEvent.provider">
                      <template v-slot:prepend>
                        <v-icon color="medium-emphasis" class="me-3">mdi-video</v-icon>
                      </template>
                      <v-list-item-title class="font-weight-medium">Provider</v-list-item-title>
                      <v-list-item-subtitle class="text-capitalize">{{ selectedEvent.provider }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item class="px-0" v-if="selectedEvent.registrationStatus">
                      <template v-slot:prepend>
                        <v-icon color="medium-emphasis" class="me-3">mdi-information</v-icon>
                      </template>
                      <v-list-item-title class="font-weight-medium">Status</v-list-item-title>
                      <v-list-item-subtitle class="text-capitalize">{{ selectedEvent.registrationStatus }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>

                  <div v-if="selectedEvent.displayJoinUrl" class="mt-4 pt-4 border-t">
                    <div class="text-caption text-medium-emphasis mb-1">Join Link</div>
                    <a :href="getAbsoluteUrl(selectedEvent.displayJoinUrl)" target="_blank" class="text-primary text-decoration-none text-body-2" style="word-break: break-all;">
                      {{ selectedEvent.displayJoinUrl }}
                    </a>
                  </div>
                </v-card-text>

                <v-card-actions class="px-4 pb-4 pt-0 d-flex flex-wrap gap-2">
                  <UiButton
                    size="sm"
                    color="primary"
                    variant="solid"
                    :disabled="selectedEvent.registrationStatus === 'registered' || selectedEvent.registrationStatus === 'banned'"
                    @click="register(selectedEvent)"
                  >
                    {{ t('live.student.register') }}
                  </UiButton>
                  <UiButton
                    size="sm"
                    color="secondary"
                    variant="outline"
                    :disabled="!selectedEvent.canJoin"
                    @click="join(selectedEvent)"
                  >
                    {{ t('live.student.join') }}
                  </UiButton>
                  <UiButton
                    v-if="liveSessionsChatEnabled"
                    size="sm"
                    color="secondary"
                    variant="link"
                    @click="openChat(selectedEvent)"
                  >
                    {{ t('live.student.openChat') }}
                  </UiButton>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="grey-darken-1"
                    variant="text"
                    @click="selectedOpen = false"
                  >
                    Close
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
import { useToast } from "@/composables/useToast";
import { useFeaturesStore } from '@/stores/features';
import { FEATURE } from '@/constants/featureCatalog';
import { useRouter } from 'vue-router';
import {
  listStudentSessions,
  registerForSession,
  joinSession,
  type StudentLiveSession,
} from "@/api/live";

const { t } = useI18n();
const toast = useToast();
const featuresStore = useFeaturesStore();
const router = useRouter();

const calendar = ref<any>(null);
const focus = ref("");
const type = ref<any>("month");
const selectedEvent = ref<any>({});
const selectedElement = ref<any>(null);
const selectedOpen = ref(false);
const events = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const liveSessionsChatEnabled = computed(() => featuresStore.hasFeature(FEATURE.liveSessionsChat));

const typeToLabel: Record<string, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
  "4day": "4 Days",
};

let currentRange = { start: { date: '' }, end: { date: '' } };

function getAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return "#";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
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

function prev() {
  if (calendar.value) calendar.value.prev();
}

function next() {
  if (calendar.value) calendar.value.next();
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
      const startD = session.scheduledAt ? new Date(session.scheduledAt) : new Date();
      const endD = new Date(startD.getTime() + session.durationMinutes * 60000);

      let color = "primary";
      if (session.status === "live") color = "success";
      if (session.status === "ended") color = "grey";
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
    toast.success(t('live.student.registerSuccess'));
    await loadEvents();
    if (selectedEvent.value && selectedEvent.value.sessionId === session.sessionId) {
        selectedOpen.value = false;
    }
  } catch (err: unknown) {
    toast.error(t('live.student.registerError'));
  }
}

async function join(session: StudentLiveSession) {
  try {
    const view = await joinSession(session.sessionId);
    toast.success(t('live.student.joinSuccess'));
    if (view.joinUrl) {
      window.open(view.joinUrl, '_blank');
    }
    await loadEvents();
  } catch (err: unknown) {
    toast.error(t('live.student.joinError'));
  }
}

function openChat(session: StudentLiveSession) {
  router.push({ name: 'student-live-chat', query: { sessionId: String(session.sessionId) } });
}
</script>