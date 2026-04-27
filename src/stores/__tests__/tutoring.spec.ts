import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTutoringStore } from '@/stores/tutoring';

const serviceMocks = {
  fetchTeacherAvailability: vi.fn(),
  createTeacherAvailability: vi.fn(),
  updateTeacherAvailability: vi.fn(),
  deleteTeacherAvailability: vi.fn(),
  fetchTeacherSessions: vi.fn(),
  fetchTeacherSession: vi.fn(),
  updateTeacherNotes: vi.fn(),
  completeTeacherSession: vi.fn(),
  submitTeacherReview: vi.fn(),
  fetchTeacherPayments: vi.fn(),
  decideTutoringPayment: vi.fn(),
  fetchStudentAvailability: vi.fn(),
  bookTutoringSession: vi.fn(),
  fetchStudentSessions: vi.fn(),
  fetchStudentSession: vi.fn(),
  submitTutoringPayment: vi.fn(),
  uploadTutoringProof: vi.fn(),
  submitStudentReview: vi.fn()
};

vi.mock('@/services/tutoring', () => serviceMocks);

describe('tutoring store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    Object.values(serviceMocks).forEach((mock) => mock.mockReset());
  });

  it('loads teacher availability and clears errors', async () => {
    serviceMocks.fetchTeacherAvailability.mockResolvedValueOnce([
      { id: 2, startAt: '2024-05-02T10:00:00Z', endAt: '2024-05-02T11:00:00Z', timeZone: 'UTC', booked: false, durationMinutes: 60 },
      { id: 1, startAt: '2024-05-01T09:00:00Z', endAt: '2024-05-01T10:00:00Z', timeZone: 'UTC', booked: true, durationMinutes: 60 }
    ]);

    const store = useTutoringStore();
    await store.loadTeacherAvailability();

    expect(store.teacherAvailability).toHaveLength(2);
    expect(store.error).toBeNull();
  });

  it('sets error when teacher availability fails to load', async () => {
    serviceMocks.fetchTeacherAvailability.mockRejectedValueOnce({ response: { status: 500 } });

    const store = useTutoringStore();
    await store.loadTeacherAvailability();

    expect(store.error).toBe('server');
    expect(store.teacherAvailability).toEqual([]);
  });

  it('adds availability and keeps sorted order', async () => {
    const store = useTutoringStore();
    store.teacherAvailability = [
      {
        id: 1,
        startAt: '2024-05-02T10:00:00Z',
        endAt: '2024-05-02T11:00:00Z',
        timeZone: 'UTC',
        booked: false,
        durationMinutes: 60
      } as any
    ];
    serviceMocks.createTeacherAvailability.mockResolvedValueOnce({
      id: 2,
      startAt: '2024-05-01T09:00:00Z',
      endAt: '2024-05-01T10:00:00Z',
      timeZone: 'UTC',
      currency: 'AED',
      booked: false,
      durationMinutes: 60
    });

    await store.addAvailability({
      startAt: '2024-05-01T09:00:00Z',
      endAt: '2024-05-01T10:00:00Z',
      timeZone: 'UTC',
      currency: 'AED'
    });

    expect(serviceMocks.createTeacherAvailability).toHaveBeenCalledWith({
      startAt: '2024-05-01T09:00:00Z',
      endAt: '2024-05-01T10:00:00Z',
      timeZone: 'UTC',
      currency: 'AED'
    });
    expect(store.teacherAvailability[0].id).toBe(2);
  });

  it('books student session and reloads list', async () => {
    const store = useTutoringStore();
    serviceMocks.bookTutoringSession.mockResolvedValueOnce({ id: 10 });
    serviceMocks.fetchStudentSessions.mockResolvedValueOnce([{ id: 10 }]);

    await store.bookSession({ slotId: 5 });

    expect(serviceMocks.bookTutoringSession).toHaveBeenCalledWith({ slotId: 5 });
    expect(serviceMocks.fetchStudentSessions).toHaveBeenCalled();
  });

  it('decides payment and refreshes sessions', async () => {
    const store = useTutoringStore();
    serviceMocks.decideTutoringPayment.mockResolvedValueOnce({ id: 3 });
    serviceMocks.fetchTeacherPayments.mockResolvedValueOnce([]);
    serviceMocks.fetchTeacherSessions.mockResolvedValueOnce([]);

    await store.decidePayment(3, { status: 'approved' });

    expect(serviceMocks.decideTutoringPayment).toHaveBeenCalledWith(3, { status: 'approved' });
    expect(serviceMocks.fetchTeacherPayments).toHaveBeenCalled();
    expect(serviceMocks.fetchTeacherSessions).toHaveBeenCalled();
  });

  it('uploads proof and stores result', async () => {
    const store = useTutoringStore();
    serviceMocks.uploadTutoringProof.mockResolvedValueOnce({ key: 'file-key', url: 'https://proof' });

    const result = await store.uploadProof(new File(['data'], 'proof.png'));

    expect(result?.key).toBe('file-key');
    expect(store.proofUploadResult?.url).toBe('https://proof');
  });
});
