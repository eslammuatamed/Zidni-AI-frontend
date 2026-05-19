import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  LessonProgress,
  LessonProgressPayload,
  CourseProgressSummary,
  Assignment,
  AssignmentAttachment,
  AssignmentRequestPayload,
  AssignmentSubmission,
  AssignmentSubmissionPayload,
  AssignmentGradePayload,
  DiscussionThread,
  DiscussionThreadPayload,
  DiscussionMessage,
  CourseResource,
  CourseResourcePayload,
  CourseContent
} from '@/services/learning';
import {
  fetchStudentProgress,
  updateStudentProgress,
  fetchCourseProgress,
  fetchStudentAssignments,
  submitAssignment,
  fetchTeacherAssignments,
  createTeacherAssignment,
  updateTeacherAssignment,
  deleteTeacherAssignment,
  uploadAssignmentAttachment,
  uploadStudentAssignmentAttachment,
  fetchAssignmentSubmissions,
  gradeSubmission,
  createTeacherThread,
  createStudentThread,
  postTeacherMessage,
  postStudentMessage,
  fetchCourseThreads,
  createResource,
  fetchResources,
  fetchCourseContent
} from '@/services/learning';

export type LearningError = 'network' | 'unauthorized' | 'forbidden' | 'server';

function mapError(status?: number): LearningError {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status && status >= 500) return 'server';
  return 'network';
}

export const useLearningStore = defineStore('learning', () => {
  const studentProgress = ref<LessonProgress[]>([]);
  const courseProgress = ref<CourseProgressSummary | null>(null);
  const studentAssignments = ref<Assignment[]>([]);
  const teacherAssignments = ref<Assignment[]>([]);
  const assignmentSubmissions = ref<AssignmentSubmission[]>([]);
  const courseThreads = ref<DiscussionThread[]>([]);
  const courseResources = ref<CourseResource[]>([]);
  const courseContent = ref<CourseContent | null>(null);
  const loading = ref(false);
  const error = ref<LearningError | null>(null);

  async function loadStudentProgress(courseId?: number) {
    loading.value = true;
    error.value = null;
    try {
      studentProgress.value = await fetchStudentProgress(courseId);
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      error.value = mapError(status);
      studentProgress.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function setLessonProgress(payload: LessonProgressPayload) {
    const progress = await updateStudentProgress(payload);
  const index = studentProgress.value.findIndex((item: { lessonId: number }) => item.lessonId === progress.lessonId);
    if (index >= 0) {
      studentProgress.value.splice(index, 1, progress);
    } else {
      studentProgress.value.push(progress);
    }
    return progress;
  }

  async function loadCourseProgress(courseId: number) {
    courseProgress.value = await fetchCourseProgress(courseId);
    return courseProgress.value;
  }

  async function loadStudentAssignments(courseId?: number) {
    studentAssignments.value = await fetchStudentAssignments(courseId);
  }

  async function submitStudentAssignment(assignmentId: number, payload: AssignmentSubmissionPayload) {
    const submission = await submitAssignment(assignmentId, payload);
    await loadStudentAssignments();
    return submission;
  }

  async function loadTeacherAssignments(courseId?: number) {
    teacherAssignments.value = await fetchTeacherAssignments(courseId);
  }

  async function createAssignment(payload: AssignmentRequestPayload) {
    const assignment = await createTeacherAssignment(payload);
    await loadTeacherAssignments();
    return assignment;
  }

  async function updateAssignment(assignmentId: number, payload: AssignmentRequestPayload) {
    const assignment = await updateTeacherAssignment(assignmentId, payload);
    await loadTeacherAssignments();
    return assignment;
  }

  async function deleteAssignment(assignmentId: number) {
    await deleteTeacherAssignment(assignmentId);
    await loadTeacherAssignments();
  }

  async function uploadAttachment(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<AssignmentAttachment> {
    return uploadAssignmentAttachment(file, onProgress);
  }

  async function uploadStudentAttachment(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<AssignmentAttachment> {
    return uploadStudentAssignmentAttachment(file, onProgress);
  }

  // After saving an assignment we navigate back to the course editor and need
  // to re-open the assignments dialog at the lesson the teacher was editing.
  // Set this from the editor route, consume it from CourseEditorView.
  const pendingAssignmentsDialogLessonId = ref<number | null>(null);
  function setPendingAssignmentsDialog(lessonId: number | null) {
    pendingAssignmentsDialogLessonId.value = lessonId;
  }
  function consumePendingAssignmentsDialog(): number | null {
    const value = pendingAssignmentsDialogLessonId.value;
    pendingAssignmentsDialogLessonId.value = null;
    return value;
  }

  async function loadAssignmentSubmissions(assignmentId: number) {
    assignmentSubmissions.value = await fetchAssignmentSubmissions(assignmentId);
  }

  function clearAssignmentSubmissions() {
    assignmentSubmissions.value = [];
  }

  async function gradeAssignment(submissionId: number, payload: AssignmentGradePayload) {
    const submission = await gradeSubmission(submissionId, payload);
  const index = assignmentSubmissions.value.findIndex((item: { id: number }) => item.id === submissionId);
    if (index >= 0) {
      assignmentSubmissions.value.splice(index, 1, submission);
    }
    return submission;
  }

  async function createThread(role: 'teacher' | 'student', payload: DiscussionThreadPayload) {
    const thread = role === 'teacher' ? await createTeacherThread(payload) : await createStudentThread(payload);
    return thread;
  }

  async function postMessage(role: 'teacher' | 'student', threadId: number, message: string) {
    const msg = role === 'teacher' ? await postTeacherMessage(threadId, message) : await postStudentMessage(threadId, message);
    return msg;
  }

  async function loadThreads(courseId: number, role: 'teacher' | 'student') {
    courseThreads.value = await fetchCourseThreads(courseId, role);
  }

  async function addResource(payload: CourseResourcePayload) {
    const resource = await createResource(payload);
    await loadResources(payload.courseId, 'teacher');
    return resource;
  }

  async function loadResources(
    courseId: number,
    role: 'teacher' | 'student'
  ): Promise<LearningError | null> {
    try {
      courseResources.value = await fetchResources(courseId, role);
      error.value = null;
      return null;
    } catch (err: any) {
      const status = err?.response?.status as number | undefined;
      const mapped = mapError(status);
      error.value = mapped;
      if (mapped === 'forbidden') {
        courseResources.value = [];
        return mapped;
      }
      throw err;
    }
  }

  async function loadCourseContent(courseId: number) {
    courseContent.value = await fetchCourseContent(courseId);
  }

  function clear() {
    studentProgress.value = [];
    courseProgress.value = null;
    studentAssignments.value = [];
    teacherAssignments.value = [];
    assignmentSubmissions.value = [];
    courseThreads.value = [];
    courseResources.value = [];
    courseContent.value = null;
    error.value = null;
  }

  return {
    studentProgress,
    courseProgress,
    studentAssignments,
    teacherAssignments,
    assignmentSubmissions,
    courseThreads,
    courseResources,
    courseContent,
    loading,
    error,
    loadStudentProgress,
    setLessonProgress,
    loadCourseProgress,
    loadStudentAssignments,
    submitStudentAssignment,
    loadTeacherAssignments,
    createAssignment,
    loadAssignmentSubmissions,
    clearAssignmentSubmissions,
    gradeAssignment,
    createThread,
    postMessage,
    loadThreads,
    addResource,
    loadResources,
    loadCourseContent,
    updateAssignment,
    deleteAssignment,
    uploadAttachment,
    uploadStudentAttachment,
    pendingAssignmentsDialogLessonId,
    setPendingAssignmentsDialog,
    consumePendingAssignmentsDialog,
    clear
  };
});
