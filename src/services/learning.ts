import api from '@/services/api';

export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type AssignmentSubmissionStatus = 'submitted' | 'resubmission_requested' | 'graded';
export type ResourceType = 'link' | 'file' | 'embed';

export interface LessonProgress {
  lessonId: number;
  lessonTitle: string;
  courseId: number;
  courseTitle: string;
  status: LessonProgressStatus;
  updatedAt?: string;
  completedAt?: string;
}

export interface LessonProgressPayload {
  lessonId: number;
  status: LessonProgressStatus;
}

export interface CourseProgressSummary {
  courseId: number;
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

export interface AssignmentAttachment {
  id: number | null;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  attachmentType: string;
  position: number;
}

export interface Assignment {
  id: number;
  lessonId: number;
  lessonTitle: string;
  courseId: number;
  courseTitle: string;
  teacherId: number;
  title: string;
  description: string;
  dueAt: string;
  maxScore: number;
  attachments: AssignmentAttachment[];
  createdAt: string;
  // Student-only fields — present on student endpoints, null/undefined on teacher endpoints.
  submissionId?: number | null;
  submissionStatus?: AssignmentSubmissionStatus | null;
  submittedAt?: string | null;
  gradedAt?: string | null;
  score?: number | null;
  feedback?: string | null;
}

export interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  studentName: string;
  status: AssignmentSubmissionStatus;
  attachments: AssignmentAttachment[];
  submittedAt: string;
  gradedAt?: string | null;
  score?: number | null;
  feedback?: string | null;
  gradedBy?: number | null;
  gradedByName?: string | null;
}

export interface AssignmentRequestPayload {
  lessonId: number;
  title: string;
  description: string;
  dueAt: string;
  maxScore: number;
  attachments: AssignmentAttachment[];
}

export interface AssignmentSubmissionPayload {
  assignmentId: number;
  attachments: AssignmentAttachment[];
  notes: string;
}

export interface AssignmentGradePayload {
  status: AssignmentSubmissionStatus;
  score: number;
  feedback: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total?: number | null;
}

export interface DiscussionThread {
  id: number;
  courseId: number;
  courseTitle: string;
  lessonId?: number;
  lessonTitle?: string;
  title: string;
  createdBy: string;
  createdByTeacher: boolean;
  createdAt: string;
  messages: DiscussionMessage[];
}

export interface DiscussionMessage {
  id: number;
  threadId: number;
  author: 'student' | 'teacher' | 'system';
  studentId?: number;
  teacherId?: number;
  authorName: string;
  message: string;
  createdAt: string;
}

export interface DiscussionThreadPayload {
  courseId: number;
  lessonId?: number;
  title: string;
  message: string;
}

export interface DiscussionMessagePayload {
  threadId: number;
  message: string;
}

export interface CourseResource {
  id: number;
  courseId: number;
  courseTitle: string;
  lessonId?: number;
  lessonTitle?: string;
  title: string;
  description?: string;
  resourceType: ResourceType;
  url: string;
  createdAt: string;
}

export interface CourseContentLesson {
  id: number;
  title: string;
  position: number;
  status: LessonProgressStatus;
  duration?: number | null;
  videoUrl?: string | null;
  ytId?: string | null;
  pdfUrl?: string | null;
  streamingBlocked?: boolean | null;
}

export interface CourseContentModule {
  id: number;
  title: string;
  position: number;
  accessible?: boolean;
  lockedReason?: string | null;
  lessons: CourseContentLesson[];
}

export interface CourseContent {
  courseId: number;
  courseTitle: string;
  modules: CourseContentModule[];
}

export interface LessonStreamingPayload {
  minutesWatched: number;
}

export interface CourseResourcePayload {
  courseId: number;
  lessonId?: number;
  title: string;
  description?: string;
  resourceType: ResourceType;
  url?: string;
  file?: File;
}

export async function fetchStudentProgress(courseId?: number) {
  const params = typeof courseId === 'number' ? { courseId } : undefined;
  const { data } = await api.get<LessonProgress[]>('/api/v1/students/learning/progress', { params });
  return data;
}

export async function updateStudentProgress(payload: LessonProgressPayload) {
  const { data } = await api.post<LessonProgress>('/api/v1/students/learning/progress', payload);
  return data;
}

export async function fetchCourseProgress(courseId: number) {
  const { data } = await api.get<CourseProgressSummary>(`/api/v1/students/learning/courses/${courseId}/progress`);
  return data;
}

export async function fetchStudentAssignments(courseId?: number) {
  const params = typeof courseId === 'number' ? { courseId } : undefined;
  const { data } = await api.get<Assignment[]>('/api/v1/students/learning/assignments', { params });
  return data;
}

export async function submitAssignment(assignmentId: number, payload: AssignmentSubmissionPayload) {
  const { data } = await api.post<AssignmentSubmission>(`/api/v1/students/learning/assignments/${assignmentId}/submit`, payload);
  return data;
}

export async function uploadStudentAssignmentAttachment(
  file: File,
  onProgress?: (progress: number) => void
) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<AssignmentAttachment>(
    '/api/v1/students/learning/assignments/upload',
    formData,
    {
      timeout: 0,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event: UploadProgressEvent) => {
        const total = event.total ?? 0;
        if (total <= 0) {
          onProgress?.(0);
          return;
        }
        const progress = Math.min(100, Math.max(0, Math.floor((event.loaded / total) * 100)));
        onProgress?.(progress);
      }
    }
  );
  return data;
}

export async function fetchTeacherAssignments(courseId?: number) {
  const params = typeof courseId === 'number' ? { courseId } : undefined;
  const { data } = await api.get<Assignment[]>('/api/v1/teacher/learning/assignments', { params });
  return data;
}

export async function uploadAssignmentAttachment(
  file: File,
  onProgress?: (progress: number) => void
) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<AssignmentAttachment>(
    '/api/v1/teacher/learning/assignments/upload',
    formData,
    {
      timeout: 0,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event: UploadProgressEvent) => {
        const total = event.total ?? 0;
        if (total <= 0) {
          onProgress?.(0);
          return;
        }
        const progress = Math.min(100, Math.max(0, Math.floor((event.loaded / total) * 100)));
        onProgress?.(progress);
      }
    }
  );
  return data;
}

export async function createTeacherAssignment(payload: AssignmentRequestPayload) {
  const { data } = await api.post<Assignment>('/api/v1/teacher/learning/assignments', payload);
  return data;
}

export async function updateTeacherAssignment(assignmentId: number, payload: AssignmentRequestPayload) {
  const { data } = await api.put<Assignment>(`/api/v1/teacher/learning/assignments/${assignmentId}`, payload);
  return data;
}

export async function deleteTeacherAssignment(assignmentId: number) {
  await api.delete(`/api/v1/teacher/learning/assignments/${assignmentId}`);
}

export async function fetchAssignmentSubmissions(assignmentId: number) {
  const { data } = await api.get<AssignmentSubmission[]>(`/api/v1/teacher/learning/assignments/${assignmentId}/submissions`);
  return data;
}

export async function gradeSubmission(submissionId: number, payload: AssignmentGradePayload) {
  const { data } = await api.post<AssignmentSubmission>(`/api/v1/teacher/learning/submissions/${submissionId}/grade`, payload);
  return data;
}

export async function createTeacherThread(payload: DiscussionThreadPayload) {
  const { data } = await api.post<DiscussionThread>('/api/v1/teacher/learning/discussions', payload);
  return data;
}

export async function createStudentThread(payload: DiscussionThreadPayload) {
  const { data } = await api.post<DiscussionThread>('/api/v1/students/learning/discussions', payload);
  return data;
}

export async function postTeacherMessage(threadId: number, message: string) {
  const { data } = await api.post<DiscussionMessage>(`/api/v1/teacher/learning/discussions/${threadId}/messages`, {
    threadId,
    message
  });
  return data;
}

export async function postStudentMessage(threadId: number, message: string) {
  const { data } = await api.post<DiscussionMessage>(`/api/v1/students/learning/discussions/${threadId}/messages`, {
    threadId,
    message
  });
  return data;
}

export async function fetchCourseThreads(courseId: number, role: 'teacher' | 'student') {
  const path =
    role === 'teacher'
      ? `/api/v1/teacher/learning/courses/${courseId}/threads`
      : `/api/v1/students/learning/threads/${courseId}`;
  const { data } = await api.get<DiscussionThread[]>(path);
  return data;
}

export async function createResource(payload: CourseResourcePayload) {
  if (import.meta.env.DEV) {
    console.debug('[learning] createResource payload', {
      hasFile: Boolean(payload.file),
      isFileInstance: typeof File !== 'undefined' ? payload.file instanceof File : null,
      resourceType: payload.resourceType,
      keys: payload && typeof payload === 'object' ? Object.keys(payload) : null
    });
  }
  if (payload.file) {
    const formData = new FormData();
    formData.append('file', payload.file);
    if (payload.url) {
      formData.append('url', payload.url);
    }
    const { data } = await api.post<CourseResource>('/api/v1/teacher/learning/resources', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  }

  const { file, ...rest } = payload;
  // Rely on the interceptor to attach auth/tenant headers.
  const { data } = await api.post<CourseResource>('/api/v1/teacher/learning/resources', rest);
  return data;
}

export async function fetchResources(courseId: number, role: 'teacher' | 'student') {
  const base = role === 'teacher' ? '/api/v1/teacher/learning/resources' : '/api/v1/students/learning/resources';
  const config = { params: { courseId } };
  const { data } = await api.get<CourseResource[]>(base, config);
  return data;
}

export async function fetchCourseContent(courseId: number) {
  const { data } = await api.get<CourseContent>(`/api/v1/students/learning/courses/${courseId}/content`);
  return data;
}

export async function reportLessonStreaming(lessonId: number, minutesWatched: number) {
  const payload: LessonStreamingPayload = { minutesWatched };
  await api.post(`/api/v1/students/learning/lessons/${lessonId}/streaming`, payload);
}
