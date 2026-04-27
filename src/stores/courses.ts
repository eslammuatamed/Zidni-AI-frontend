import { defineStore } from 'pinia';
import api from '@/services/api';
import { getStoredTenantSlug, normalizeTenantSlug, sanitizeTenantSlug } from '@/utils/tenantStorage';

const DEFAULT_CURRENCY = 'EGP';
// Axios interprets 0 as “no timeout”; helpful for large file uploads on slow links
const NO_TIMEOUT = 0;

const normalizeCurrencyValue = (currency?: string | null) => {
  if (typeof currency === 'string' && currency.trim().length > 0) {
    return currency.trim().toUpperCase();
  }
  return DEFAULT_CURRENCY;
};

export interface CourseSummary {
  id: number;
  title: string;
  type: string;
  price: number;
  currency: string;
  active: boolean;
  active1?: string;
  thumbnailUrl?: string;
  level?: string;
  language?: string;
  certificateInfo?: boolean;
  courseRequirements?: string;
  faq?: string;
  instructor?: string;
  previewVideo?: string;
  previewVideoBunnyId?: string | null;
  previewVideoStatus?: LessonVideoStatus | null;
  targetAudience?: string;
  whatYouWillLearn?: [];

}

export type LessonVideoStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface LessonVideoMetadata {
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface LessonPayload {
  id: number;
  title: string;
  content?: string | null;
  ytId?: string;
  pdfUrl?: string;
  videoUrl?: string | null;
  videoStorageKey?: string | null;
  bunnyVideoId?: string | null;
  videoStatus?: LessonVideoStatus | null;
  duration?: number;
  position: number;
}

export interface ModulePayload {
  id: number;
  title: string;
  position: number;
  lessons: LessonPayload[];
}

export interface CourseTeacher {
  id: number;
  name?: string;
  subject?: string;
  photoUrl?: string;
  bio?: string;
}

export interface CourseDetail extends CourseSummary {
  description?: string;
  previewVideoBunnyId?: string | null;
  previewVideoStatus?: LessonVideoStatus | null;
  modules: ModulePayload[];
  teacher?: CourseTeacher | null;
}

interface ReorderItem {
  id: number;
  position: number;
}

const sortLessons = (lessons: LessonPayload[]) =>
  [...lessons].sort((a, b) => a.position - b.position);

const normalizeLesson = (lesson: LessonPayload): LessonPayload => ({
  ...lesson,
  content: lesson.content ?? '',
  videoUrl: lesson.videoUrl ?? null,
  videoStorageKey: lesson.videoStorageKey ?? null,
  bunnyVideoId: lesson.bunnyVideoId ?? null,
  videoStatus: lesson.videoStatus ?? (lesson.videoUrl ? 'READY' : null)
});

const normalizeModule = (module: ModulePayload): ModulePayload => ({
  ...module,
  lessons: sortLessons((module.lessons || []).map((lesson) => normalizeLesson(lesson)))
});

const normalizeCourseDetail = (course: CourseDetail): CourseDetail => ({
  ...course,
  currency: normalizeCurrencyValue(course.currency),
  previewVideoBunnyId: course.previewVideoBunnyId ?? null,
  previewVideoStatus: course.previewVideoStatus ?? null,
  modules: (course.modules || [])
    .map(normalizeModule)
    .sort((a, b) => a.position - b.position)
});

const normalizeCourseSummary = (course: CourseSummary): CourseSummary => ({
  ...course,
  currency: normalizeCurrencyValue(course.currency),
  previewVideoBunnyId: course.previewVideoBunnyId ?? null,
  previewVideoStatus: course.previewVideoStatus ?? null
});

type UploadProgressEvent = { loaded: number; total?: number | null };

const logUploadProgress = (label: string, progress: number) => {
  console.debug(`[upload ${label}] ${progress}%`);
};

const createUploadProgressHandler = (
  label: string,
  onProgress?: (progress: number) => void
) =>
  (event: UploadProgressEvent) => {
    const total = event.total ?? 0;
    if (total <= 0) {
      onProgress?.(0);
      logUploadProgress(label, 0);
      return;
    }
    const progress = Math.min(100, Math.max(0, Math.floor((event.loaded / total) * 100)));
    onProgress?.(progress);
    logUploadProgress(label, progress);
  };

const finalizeUploadProgress = (label: string, onProgress?: (progress: number) => void) => {
  if (onProgress) {
    onProgress(100);
  }
  logUploadProgress(label, 100);
};

interface CourseWritePayload {
  title: string;
  type: string;
  price: number;
  currency?: string | null;
  description?: string;
  thumbnailUrl?: string | null;
  level?: string | null;
  language?: string | null;
  active?: boolean;
  // courseOverview: string | null;
  instructor: string | null;
  faq: string | null;
  certificateInfo: boolean;
  duration: string | null;
  targetAudience: string | null;
  previewVideo?: string | null;
  previewVideoBunnyId?: string | null;
  whatYouWillLearn: any | null;
  courseRequirements: string | null;
  // refundPolicy: string | null;
  // curriculum: string | null;
}

export const useCoursesStore = defineStore('courses', {
  state: () => ({
    list: [] as CourseSummary[],
    current: null as CourseDetail | null,
    loading: false,
    error: ''
  }),
  actions: {
    async fetchCourses() {
      this.loading = true;
      try {
        const { data } = await api.get<CourseSummary[]>('/v1/teacher/courses');
        this.list = data.map((course) => normalizeCourseSummary(course));
      } catch (error) {
        this.error = 'FETCH_FAILED';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async fetchCourse(courseId: number) {
      this.loading = true;
      try {
        const { data } = await api.get<CourseDetail>(`/v1/teacher/courses/${courseId}`);
        this.current = normalizeCourseDetail(data);
        const summary = this.list.find((course) => course.id === courseId);
        if (summary) {
          summary.title = data.title;
          summary.type = data.type;
          summary.price = data.price;
          summary.currency = normalizeCurrencyValue(data.currency);
          summary.thumbnailUrl = data.thumbnailUrl;
          summary.level = data.level;
          summary.language = data.language;
          summary.active = data.active;
          summary.previewVideo = data.previewVideo;
          summary.previewVideoBunnyId = data.previewVideoBunnyId ?? null;
          summary.previewVideoStatus = data.previewVideoStatus ?? null;
        }
      } finally {
        this.loading = false;
      }
    },
    async createCourse(payload: CourseWritePayload) {
      const requestPayload: CourseWritePayload = {
        ...payload,
        currency: normalizeCurrencyValue(payload.currency)
      };
      const { data } = await api.post<CourseDetail>('/v1/teacher/courses', requestPayload);
      const normalized = normalizeCourseDetail(data);
      const summary: CourseSummary = {
        id: normalized.id,
        title: normalized.title,
        type: normalized.type,
        price: normalized.price,
        currency: normalized.currency,
        active: normalized.active,
        thumbnailUrl: normalized.thumbnailUrl,
        level: normalized.level,
        language: normalized.language,
        previewVideo: normalized?.previewVideo,
        previewVideoBunnyId: normalized?.previewVideoBunnyId ?? null,
        previewVideoStatus: normalized?.previewVideoStatus ?? null
      };
      this.list.unshift(summary);
      this.current = normalized;
      return normalized.id;
    },
    async addModule(courseId: number, payload: { title: string; position?: number }) {
      const { data } = await api.post<ModulePayload>(
        `/v1/teacher/courses/${courseId}/modules`,
        payload
      );
      if (this.current) {
        this.current.modules.push(normalizeModule(data));
        this.current.modules.sort((a, b) => a.position - b.position);
      }
      return data.id;
    },
    async deleteModule(courseId: number, moduleId: number) {
      await api.delete(`/v1/teacher/courses/${courseId}/modules/${moduleId}`);
      if (this.current) {
        this.current.modules = this.current.modules.filter((module) => module.id !== moduleId);
      }
    },
    async updateCourse(courseId: number, payload: CourseWritePayload) {
      const { data } = await api.put<CourseDetail>(`/v1/teacher/courses/${courseId}`, payload);
      this.current = normalizeCourseDetail(data);
      const summary = this.list.find((course) => course.id === courseId);
      if (summary) {
        summary.title = data.title;
        summary.type = data.type;
        summary.price = data.price;
        summary.currency = normalizeCurrencyValue(data.currency);
        summary.thumbnailUrl = data.thumbnailUrl;
        summary.level = data.level;
        summary.language = data.language;
        summary.active = data.active;
        summary.previewVideo = data.previewVideo;
        summary.previewVideoBunnyId = data.previewVideoBunnyId ?? null;
        summary.previewVideoStatus = data.previewVideoStatus ?? null;
      }
    },
    async deleteCourse(courseId: number) {
      this.loading = true;
      try {
        await api.delete(`/v1/teacher/courses/${courseId}`);
        this.list = this.list.filter((course) => course.id !== courseId);
        if (this.current?.id === courseId) {
          this.current = null;
        }
      } catch (error) {
        this.error = 'DELETE_FAILED';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async addLesson(
      courseId: number,
      moduleId: number,
      payload: {
        title: string;
        content?: string;
        ytId?: string;
        pdfUrl?: string;
        videoUrl?: string | null;
        videoStorageKey?: string | null;
        duration?: number;
        position?: number;
      }
    ) {
      const { data } = await api.post<LessonPayload>(
        `/v1/teacher/courses/${courseId}/modules/${moduleId}/lessons`,
        payload
      );
      const module = this.current?.modules.find((m) => m.id === moduleId);
      if (module) {
        module.lessons.push(normalizeLesson(data));
        module.lessons.sort((a, b) => a.position - b.position);
      }
      return data.id;
    },
    async updateModule(courseId: number, moduleId: number, payload: { title: string; position?: number }) {
      const { data } = await api.put<ModulePayload>(
        `/v1/teacher/courses/${courseId}/modules/${moduleId}`,
        payload
      );
      if (this.current) {
        const index = this.current.modules.findIndex((module) => module.id === moduleId);
        if (index !== -1) {
          this.current.modules.splice(index, 1, normalizeModule(data));
          this.current.modules.sort((a, b) => a.position - b.position);
        }
      }
      return data;
    },
    async removeModule(courseId: number, moduleId: number) {
      await api.delete(`/v1/teacher/courses/${courseId}/modules/${moduleId}`);
      if (this.current) {
        this.current.modules = this.current.modules.filter((module) => module.id !== moduleId);
      }
    },
    async reorderModules(courseId: number, items: ReorderItem[]) {
      await api.post(`/v1/teacher/courses/${courseId}/modules/reorder`, { items });
      if (this.current && Array.isArray(items)) {
        const map = new Map(items.map((item) => [item.id, item.position]));
        this.current.modules = this.current.modules
          .map((module) =>
            map.has(module.id) ? { ...module, position: map.get(module.id)! } : module
          )
          .sort((a, b) => a.position - b.position);
      }
    },

    async updateLesson(
      courseId: number,
      moduleId: number,
      lessonId: number,
      payload: {
        title: string;
        content?: string;
        ytId?: string;
        pdfUrl?: string;
        videoUrl?: string | null;
        videoStorageKey?: string | null;
        duration?: number;
        position?: number;
      }
    ) {
      const { data } = await api.put<LessonPayload>(
        `/v1/teacher/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
        payload
      );
      const module = this.current?.modules.find((m) => m.id === moduleId);
      if (module) {
        const index = module.lessons.findIndex((lesson) => lesson.id === lessonId);
        if (index !== -1) {
          module.lessons.splice(index, 1, normalizeLesson(data));
          module.lessons.sort((a, b) => a.position - b.position);
        }
      }
      return data;
    },
    async removeLesson(courseId: number, moduleId: number, lessonId: number) {
      await api.delete(`/v1/teacher/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
      const module = this.current?.modules.find((m) => m.id === moduleId);
      if (module) {
        module.lessons = module.lessons.filter((lesson) => lesson.id !== lessonId);
      }
    },

    async uploadLessonPdf(file: File, onProgress?: (progress: number) => void) {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post<{ url: string; key?: string }>(
        '/v1/teacher/courses/content/upload',
        formData,
        {
          timeout: NO_TIMEOUT,
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: createUploadProgressHandler('lesson-pdf', onProgress)
        }
      );

      finalizeUploadProgress('lesson-pdf', onProgress);

      return data;
    },

    async uploadLessonVideo(
      courseId: number,
      moduleId: number,
      lessonId: number,
      file: File,
      onProgress?: (progress: number) => void,
      metadata?: LessonVideoMetadata
    ) {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata?.durationSeconds) {
        formData.append('durationSeconds', String(metadata.durationSeconds));
      }
      if (metadata?.width) {
        formData.append('videoWidth', String(metadata.width));
      }
      if (metadata?.height) {
        formData.append('videoHeight', String(metadata.height));
      }

      const { data } = await api.post<{
        lessonId: number;
        bunnyVideoId: string;
        videoUrl?: string;
        status?: string;
        warning?: string;
      }>(
        `/v1/teacher/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/video`,
        formData,
        {
          timeout: NO_TIMEOUT,
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: createUploadProgressHandler('lesson-video', onProgress)
        }
      );
      finalizeUploadProgress('lesson-video', onProgress);
      return data;
    },

    async uploadCoursePreviewVideo(
      courseId: number,
      file: File,
      onProgress?: (progress: number) => void,
      metadata?: LessonVideoMetadata
    ) {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata?.durationSeconds) {
        formData.append('durationSeconds', String(metadata.durationSeconds));
      }
      if (metadata?.width) {
        formData.append('videoWidth', String(metadata.width));
      }
      if (metadata?.height) {
        formData.append('videoHeight', String(metadata.height));
      }

      const { data } = await api.post<{
        courseId: number;
        bunnyVideoId: string;
        videoUrl?: string;
        status?: string;
        warning?: string;
      }>(
        `/v1/teacher/courses/${courseId}/preview-video`,
        formData,
        {
          timeout: NO_TIMEOUT,
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: createUploadProgressHandler('course-preview-video', onProgress)
        }
      );

      finalizeUploadProgress('course-preview-video', onProgress);
      return data;
    },

    async reorderLessons(courseId: number, moduleId: number, items: ReorderItem[]) {
      await api.post(`/v1/teacher/courses/${courseId}/modules/${moduleId}/lessons/reorder`, { items });
      const module = this.current?.modules.find((m) => m.id === moduleId);
      if (module && Array.isArray(items)) {
        const map = new Map(items.map((item) => [item.id, item.position]));
        module.lessons = module.lessons
          .map((lesson) =>
            map.has(lesson.id) ? { ...lesson, position: map.get(lesson.id)! } : lesson
          )
          .sort((a, b) => a.position - b.position);
      }

    }
  }
});
