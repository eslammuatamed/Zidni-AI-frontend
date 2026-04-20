<template>
  <ThemePage :title="t('certificates.teacher.title')" :subtitle="t('certificates.teacher.subtitle')">
    <section class="certificates-grid grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
      <UiCard class="certificates-card min-h-[320px]" :title="t('certificates.teacher.formTitle')" hover>
        <form class="certificates-form flex flex-col gap-4" @submit.prevent="generate">
          <label class="certificates-field flex flex-col gap-2 font-medium">
            <span>{{ t('certificates.teacher.template') }}</span>
            <select v-model="form.templateKey" required>
              <option v-for="template in templates" :key="template.value" :value="template.value">
                {{ template.label }}
              </option>
            </select>
          </label>

          <label class="certificates-field flex flex-col gap-2 font-medium">
            <span>{{ t('certificates.teacher.studentSearch') }}</span>
            <input
              v-model="studentSearch"
              type="search"
              :placeholder="t('certificates.teacher.studentSearchPlaceholder')"
            />
          </label>

          <label class="certificates-field flex flex-col gap-2 font-medium">
            <span>{{ t('certificates.teacher.student') }}</span>
            <select v-model.number="form.studentId" :disabled="studentsLoading || !students.length" required>
              <option value="" disabled>
                {{ studentsLoading ? t('certificates.teacher.loadingStudents') : t('certificates.teacher.studentPlaceholder') }}
              </option>
              <option v-for="student in students" :key="student.studentId" :value="student.studentId">
                {{ formatStudentLabel(student) }}
              </option>
            </select>
            <small v-if="!studentsLoading && !students.length" class="certificates-field__hint text-content-tertiary text-[0.85rem]">
              {{ t('certificates.teacher.noStudents') }}
            </small>
          </label>

          <label class="certificates-field flex flex-col gap-2 font-medium">
            <span>{{ t('certificates.teacher.course') }}</span>
            <select v-model.number="form.courseId" required>
              <option value="" disabled>{{ t('certificates.teacher.coursePlaceholder') }}</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.title }}
              </option>
            </select>
          </label>

          <label class="certificates-field flex flex-col gap-2 font-medium">
            <span>{{ t('certificates.teacher.issueDate') }}</span>
            <input v-model="form.issueDate" type="date" required />
          </label>

          <UiAlert v-if="studentsError" color="danger" variant="soft">
            {{ studentsError }}
          </UiAlert>

          <UiAlert v-if="error" color="danger" variant="soft">
            {{ error }}
          </UiAlert>

          <UiButton type="submit" color="primary" :disabled="loading">
            {{ loading ? t('common.loading') : t('certificates.teacher.generate') }}
          </UiButton>
        </form>
      </UiCard>

      <UiCard v-if="result" class="certificates-card min-h-[320px]" :title="t('certificates.teacher.resultTitle')" hover>
        <div class="certificates-result flex flex-col gap-3">
          <div>
            <h3>{{ result.studentName }}</h3>
            <p>{{ result.courseName }}</p>
          </div>
          <div class="certificates-meta flex flex-col gap-[0.35rem] text-content-tertiary">
            <span>{{ t('certificates.teacher.issuedAt') }}: {{ formatDate(result.issuedAt) }}</span>
            <span>{{ t('certificates.teacher.verificationCode') }}: {{ result.verificationCode }}</span>
          </div>
          <div class="certificates-actions flex gap-2">
            <UiButton color="secondary" @click="download(result.id)">
              {{ t('certificates.teacher.download') }}
            </UiButton>
          </div>
        </div>
      </UiCard>

      <UiCard
        class="certificates-card min-h-[320px]"
        :title="t('certificates.teacher.listTitle')"
        :subtitle="t('certificates.teacher.listSubtitle')"
        hover
      >
        <template #actions>
          <UiButton size="sm" variant="outline" :disabled="certificatesLoading" @click="loadCertificates">
            {{ t('common.refresh') }}
          </UiButton>
        </template>

        <UiAlert v-if="certificatesError" color="danger" variant="soft">
          {{ certificatesError }}
        </UiAlert>

        <UiTable
          v-else
          :headers="certificateHeaders"
          :items="certificateRows"
          :loading="certificatesLoading"
          density="comfortable"
          :empty-text="t('certificates.teacher.listEmpty')"
        >
          <template #item.issuedAt="{ item }">
            {{ formatDate(item.issuedAt) }}
          </template>
          <template #item.verificationCode="{ item }">
            <span>{{ item.verificationCode || '—' }}</span>
          </template>
          <template #item.actions="{ item }">
            <div class="certificates-table-actions flex flex-wrap justify-end gap-2">
              <UiButton size="sm" variant="outline" color="primary" @click="download(item.id)">
                {{ t('certificates.teacher.download') }}
              </UiButton>
              <UiButton
                v-if="item.qrCode"
                size="sm"
                variant="link"
                color="secondary"
                :href="item.qrCode"
                target="_blank"
                rel="noopener"
              >
                {{ t('certificates.teacher.verifyLink') }}
              </UiButton>
            </div>
          </template>
        </UiTable>
      </UiCard>
    </section>
  </ThemePage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemePage from '@/layout/theme/ThemePage.vue';
import UiCard from '@/components/ui/UiCard.vue';
import UiButton from '@/components/ui/UiButton.vue';
import UiAlert from '@/components/ui/UiAlert.vue';
import UiTable from '@/components/ui/UiTable.vue';
import {
  fetchTeacherCertificates,
  generateCertificate,
  type CertificateIssueResponse,
  type TeacherCertificateResponse
} from '@/services/certificates';
import { fetchTeacherStudents, type StudentListItem } from '@/services/teacherRoster';
import { useCoursesStore } from '@/stores/courses';

const { t } = useI18n();
const coursesStore = useCoursesStore();

const templates = computed(() => [
  { value: 'classic', label: t('certificates.teacher.templates.classic') }
]);

const form = reactive({
  templateKey: 'classic',
  studentId: '' as unknown as number,
  courseId: '' as unknown as number,
  issueDate: new Date().toISOString().slice(0, 10)
});

const students = ref<StudentListItem[]>([]);
const studentsLoading = ref(false);
const studentsError = ref('');
const studentSearch = ref('');
const loading = ref(false);
const error = ref('');
const result = ref<CertificateIssueResponse | null>(null);
const certificates = ref<TeacherCertificateResponse[]>([]);
const certificatesLoading = ref(false);
const certificatesError = ref('');

const courses = computed(() => coursesStore.list);
const certificateHeaders = computed(() => [
  { key: 'studentName', title: t('certificates.teacher.listColumns.student') },
  { key: 'courseName', title: t('certificates.teacher.listColumns.course') },
  { key: 'issuedAt', title: t('certificates.teacher.listColumns.issuedAt') },
  { key: 'verificationCode', title: t('certificates.teacher.listColumns.code') },
  { key: 'actions', title: t('certificates.teacher.listColumns.actions'), sortable: false, align: 'end' }
]);
const certificateRows = computed(() => certificates.value);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let latestSearchToken = 0;

const normalizeStudents = (items: StudentListItem[]) =>
  items.map((student) => ({
    ...student,
    studentId: student.studentId ?? (student as StudentListItem & { id?: number }).id ?? student.studentId
  }));

const formatStudentLabel = (student: StudentListItem) => {
  const name = student.name?.trim();
  return name ? `${name} — ${student.email}` : student.email;
};

const loadStudents = async (search: string) => {
  const token = ++latestSearchToken;
  studentsLoading.value = true;
  studentsError.value = '';
  try {
    const response = await fetchTeacherStudents({ search: search || undefined, page: 0, size: 200 });
    if (latestSearchToken !== token) return;
    students.value = normalizeStudents(response.items || []);
    if (form.studentId && !students.value.some((student) => student.studentId === Number(form.studentId))) {
      form.studentId = '' as unknown as number;
    }
  } catch (err) {
    console.error('[certificates] load students failed', err);
    if (latestSearchToken === token) {
      students.value = [];
      studentsError.value = t('certificates.teacher.studentsFailed');
    }
  } finally {
    if (latestSearchToken === token) {
      studentsLoading.value = false;
    }
  }
};

const loadOptions = async () => {
  await coursesStore.fetchCourses();
  await loadStudents('');
};

onMounted(() => {
  loadOptions().catch((err) => {
    console.error('[certificates] load options failed', err);
  });
  loadCertificates();
});

watch(studentSearch, (value) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    loadStudents(value);
  }, 300);
});

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});

const generate = async () => {
  loading.value = true;
  error.value = '';
  try {
    result.value = await generateCertificate({
      studentId: Number(form.studentId),
      courseId: Number(form.courseId),
      issueDate: form.issueDate,
      templateKey: form.templateKey
    });
    loadCertificates();
  } catch (err) {
    console.error('[certificates] generate failed', err);
    error.value = t('certificates.teacher.error');
  } finally {
    loading.value = false;
  }
};

const loadCertificates = async () => {
  certificatesLoading.value = true;
  certificatesError.value = '';
  try {
    certificates.value = await fetchTeacherCertificates();
  } catch (err) {
    console.error('[certificates] load teacher certificates failed', err);
    certificates.value = [];
    certificatesError.value = t('certificates.teacher.listError');
  } finally {
    certificatesLoading.value = false;
  }
};

const download = (id: number) => {
  window.open(`/api/certificates/download/${id}`, '_blank');
};

const formatDate = (value: string) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return value;
  }
};
</script>

<style scoped>
.certificates-field select,
.certificates-field input {
  padding: 0.65rem 0.75rem;
  border-radius: var(--sakai-border-radius-md);
  border: 0.0625rem solid color-mix(in srgb, var(--sakai-border-color) 80%, transparent);
  background: var(--sakai-surface);
  font: inherit;
}

.certificates-result h3 {
  margin: 0;
  font-size: 1.2rem;
}

.certificates-result p {
  margin: 0;
  color: var(--sakai-text-color-secondary);
}
</style>
