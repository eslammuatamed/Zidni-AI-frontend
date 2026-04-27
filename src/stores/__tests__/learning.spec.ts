import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLearningStore } from '@/stores/learning';

const serviceMocks = {
  fetchStudentProgress: vi.fn(),
  updateStudentProgress: vi.fn(),
  fetchCourseProgress: vi.fn(),
  fetchStudentAssignments: vi.fn(),
  submitAssignment: vi.fn(),
  fetchTeacherAssignments: vi.fn(),
  createTeacherAssignment: vi.fn(),
  fetchAssignmentSubmissions: vi.fn(),
  gradeSubmission: vi.fn(),
  createTeacherThread: vi.fn(),
  createStudentThread: vi.fn(),
  postTeacherMessage: vi.fn(),
  postStudentMessage: vi.fn(),
  fetchCourseThreads: vi.fn(),
  createResource: vi.fn(),
  fetchResources: vi.fn()
};

vi.mock('@/services/learning', () => serviceMocks);

describe('learning store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    Object.values(serviceMocks).forEach((mock) => mock.mockReset());
  });

  it('loads student progress and handles error state', async () => {
    serviceMocks.fetchStudentProgress.mockResolvedValueOnce([
      { lessonId: 1, status: 'in_progress', lessonTitle: 'Intro', courseId: 3, courseTitle: 'Math' }
    ]);

    const store = useLearningStore();
    await store.loadStudentProgress();

    expect(store.studentProgress).toHaveLength(1);
    expect(store.error).toBeNull();

    serviceMocks.fetchStudentProgress.mockRejectedValueOnce({ response: { status: 403 } });
    await store.loadStudentProgress();
    expect(store.error).toBe('forbidden');
    expect(store.studentProgress).toEqual([]);
  });

  it('updates lesson progress and merges entries', async () => {
    const store = useLearningStore();
    store.studentProgress = [
      {
        lessonId: 1,
        status: 'not_started',
        lessonTitle: 'Intro',
        courseId: 1,
        courseTitle: 'Course'
      } as any
    ];
    serviceMocks.updateStudentProgress.mockResolvedValueOnce({
      lessonId: 1,
      status: 'completed',
      lessonTitle: 'Intro',
      courseId: 1,
      courseTitle: 'Course'
    });

    const progress = await store.setLessonProgress({ lessonId: 1, status: 'completed' });

    expect(progress.status).toBe('completed');
    expect(store.studentProgress[0].status).toBe('completed');
  });

  it('creates assignment and reloads teacher assignments', async () => {
    const store = useLearningStore();
    serviceMocks.createTeacherAssignment.mockResolvedValueOnce({ id: 5, courseId: 2 });
    serviceMocks.fetchTeacherAssignments.mockResolvedValue([]);

    await store.createAssignment({ lessonId: 10, title: 'Essay' });

    expect(serviceMocks.createTeacherAssignment).toHaveBeenCalled();
    expect(serviceMocks.fetchTeacherAssignments).toHaveBeenCalled();
  });

  it('adds resource and reloads list', async () => {
    const store = useLearningStore();
    serviceMocks.createResource.mockResolvedValueOnce({ id: 1, courseId: 2 });
    serviceMocks.fetchResources.mockResolvedValueOnce([{ id: 1, courseId: 2 }]);

    await store.addResource({ courseId: 2, title: 'Slides', resourceType: 'link', url: 'https://example.com' });

    expect(serviceMocks.createResource).toHaveBeenCalled();
    expect(serviceMocks.fetchResources).toHaveBeenCalledWith(2, 'teacher');
  });

  it('creates thread using correct role', async () => {
    const store = useLearningStore();
    serviceMocks.createTeacherThread.mockResolvedValueOnce({ id: 1 });
    serviceMocks.createStudentThread.mockResolvedValueOnce({ id: 2 });

    await store.createThread('teacher', { courseId: 1, title: 'T', message: 'M' });
    await store.createThread('student', { courseId: 1, title: 'S', message: 'M' });

    expect(serviceMocks.createTeacherThread).toHaveBeenCalled();
    expect(serviceMocks.createStudentThread).toHaveBeenCalled();
  });

  it('posts message with proper service', async () => {
    const store = useLearningStore();
    serviceMocks.postTeacherMessage.mockResolvedValueOnce({});
    serviceMocks.postStudentMessage.mockResolvedValueOnce({});

    await store.postMessage('teacher', 1, 'Hello');
    await store.postMessage('student', 2, 'Hi');

    expect(serviceMocks.postTeacherMessage).toHaveBeenCalledWith(1, 'Hello');
    expect(serviceMocks.postStudentMessage).toHaveBeenCalledWith(2, 'Hi');
  });
});
