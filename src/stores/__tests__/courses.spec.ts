import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCoursesStore } from '@/stores/courses';
import api from '@/services/api';
import type { AxiosProgressEvent } from 'axios';

vi.mock('@/services/api');
const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

mockedApi.get = vi.fn();
mockedApi.post = vi.fn();

describe('courses store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
  });

  it('fetches courses list', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Course', type: 'recorded', price: 0, currency: 'EGP', active: true }
      ]
    });
    const store = useCoursesStore();

    await store.fetchCourses();

    expect(store.list).toHaveLength(1);
    expect(store.list[0].title).toBe('Course');
    expect(store.list[0].currency).toBe('EGP');
  });

  it('creates course and sets current', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        id: 5,
        title: 'New Course',
        type: 'recorded',
        price: 0,
        currency: 'EGP',
        active: true,
        modules: []
      }
    });
    const store = useCoursesStore();

    const id = await store.createCourse({ title: 'New Course', type: 'recorded', price: 0 });

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/v1/teacher/courses',
      expect.objectContaining({ currency: 'EGP' })
    );
    expect(id).toBe(5);
    expect(store.current?.title).toBe('New Course');
    expect(store.current?.currency).toBe('EGP');
  });

  it('uploads lesson video and returns storage data', async () => {
    const uploadMock = vi.fn();
    mockedApi.post.mockImplementationOnce((_url, _payload, config) => {
      uploadMock(config?.onUploadProgress);
      config?.onUploadProgress?.({ loaded: 5, total: 10 } as AxiosProgressEvent);
      return Promise.resolve({ data: { lessonId: 3, bunnyVideoId: 'vid-123', videoUrl: 'https://cdn.example/video.m3u8' } });
    });
    const store = useCoursesStore();

    const progressSpy = vi.fn();
    const result = await store.uploadLessonVideo(1, 2, 3, new File(['video'], 'lesson.mp4'), progressSpy);

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/v1/teacher/courses/1/modules/2/lessons/3/video',
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }),
        onUploadProgress: expect.any(Function),
        timeout: 0
      })
    );
    expect(result.videoUrl).toBe('https://cdn.example/video.m3u8');
    expect(result.bunnyVideoId).toBe('vid-123');
    expect(uploadMock).toHaveBeenCalledWith(expect.any(Function));
    expect(progressSpy).toHaveBeenCalledWith(50);
    expect(progressSpy).toHaveBeenLastCalledWith(100);
  });

  it('does not add auth headers even when legacy data exists in localStorage', async () => {
    const originalWindow = globalThis.window;
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'edtech_role') return 'TEACHER';
        if (key === 'edtech_tenant_raw') return 'DemoTenant';
        if (key === 'edtech_tenant') return 'demo-tenant';
        return null;
      })
    } as unknown as Storage;

    (globalThis as any).window = { localStorage: localStorageMock };

    mockedApi.post.mockResolvedValueOnce({ data: { lessonId: 3, bunnyVideoId: 'vid-123' } });

    const store = useCoursesStore();
    await store.uploadLessonVideo(1, 2, 3, new File(['video'], 'lesson.mp4'));

    const headers = mockedApi.post.mock.calls[0][2]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(headers['X-Tenant']).toBeUndefined();

    (globalThis as any).window = originalWindow;
  });

  it('does not set tenant headers when platform admin uploads video', async () => {
    const originalWindow = globalThis.window;
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === 'edtech_role') return 'PLATFORM_ADMIN';
        return null;
      })
    } as unknown as Storage;

    (globalThis as any).window = { localStorage: localStorageMock };

    mockedApi.post.mockResolvedValueOnce({ data: { lessonId: 3, bunnyVideoId: 'vid-789' } });

    const store = useCoursesStore();
    await store.uploadLessonVideo(1, 2, 3, new File(['video'], 'lesson.mp4'));

    const headers = mockedApi.post.mock.calls[0][2]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(headers['X-Tenant']).toBeUndefined();

    (globalThis as any).window = originalWindow;
  });
});
