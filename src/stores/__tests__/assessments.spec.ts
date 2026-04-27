import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAssessmentsStore } from '@/stores/assessments';

const mockServices = {
  fetchQuestionBanks: vi.fn(),
  fetchQuestionBank: vi.fn(),
  createQuestionBank: vi.fn(),
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
  fetchAssessments: vi.fn(),
  fetchAssessment: vi.fn(),
  createAssessment: vi.fn(),
  updateAssessment: vi.fn(),
  deleteAssessment: vi.fn(),
  addAssessmentItem: vi.fn(),
  updateAssessmentItem: vi.fn(),
  deleteAssessmentItem: vi.fn(),
  fetchAssessmentAttempts: vi.fn(),
  fetchAssessmentAttempt: vi.fn(),
  overrideAssessmentAttempt: vi.fn(),
  fetchStudentAssessments: vi.fn(),
  fetchStudentAssessment: vi.fn(),
  submitStudentAttempt: vi.fn()
};

vi.mock('@/services/assessments', () => mockServices);

describe('assessments store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    Object.values(mockServices).forEach((fn) => fn.mockReset());
  });

  it('loads question banks', async () => {
    mockServices.fetchQuestionBanks.mockResolvedValueOnce([
      {
        id: 1,
        name: 'Bank',
        description: 'Desc',
        questionCount: 2,
        updatedAt: '2024-05-01T00:00:00Z',
        tags: []
      }
    ]);
    mockServices.fetchQuestionBank.mockResolvedValueOnce({
      id: 1,
      name: 'Bank',
      description: 'Desc',
      updatedAt: '2024-05-01T00:00:00Z',
      questions: []
    });
    const store = useAssessmentsStore();

    await store.loadBanks();

    expect(store.banks).toHaveLength(1);
    expect(store.banks[0].name).toBe('Bank');
  });

  it('creates assessment and sets current', async () => {
    mockServices.createAssessment.mockResolvedValueOnce({
      id: 10,
      title: 'Quiz 1',
      type: 'quiz',
      courseId: 5,
      courseTitle: 'Math',
      durationMinutes: 15,
      maxScore: 0,
      items: []
    });

    const store = useAssessmentsStore();
    const id = await store.createAssessment({ courseId: 5, title: 'Quiz 1' });

    expect(id).toBe(10);
    expect(store.currentAssessment?.title).toBe('Quiz 1');
  });

  it('overrides attempt and refreshes list', async () => {
    mockServices.overrideAssessmentAttempt.mockResolvedValueOnce({
      id: 7,
      assessmentId: 2,
      studentId: 3,
      studentName: 'Student',
      autoScore: 5,
      manualScore: 2,
      status: 'graded',
      submittedAt: '2024-05-01T00:00:00Z',
      questions: []
    });
    mockServices.fetchAssessmentAttempts.mockResolvedValue([]);

    const store = useAssessmentsStore();
    await store.overrideAttempt(2, 7, { manualScore: 7 });

    expect(mockServices.fetchAssessmentAttempts).toHaveBeenCalledWith(2);
    expect(store.currentAttempt?.id).toBe(7);
  });

  it('submits student attempt and stores result', async () => {
    mockServices.submitStudentAttempt.mockResolvedValueOnce({
      attemptId: 4,
      assessmentId: 9,
      autoScore: 6,
      manualScore: 1,
      status: 'graded',
      submittedAt: '2024-05-01T00:00:00Z'
    });

    const store = useAssessmentsStore();
    const result = await store.submitStudentAttempt(9, { answers: [] });

    expect(result.attemptId).toBe(4);
    expect(store.lastStudentAttempt?.status).toBe('graded');
  });
});
