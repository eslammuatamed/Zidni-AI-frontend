import { setActivePinia, createPinia } from 'pinia';
import { useAdminStore } from '@/stores/admin';
import {
  fetchTeacherSummaries,
  fetchTeacherDetail,
  listTeacherDomains,
  updateTeacherLifecycle,
  updateTeacherSlug,
  fetchOverview,
  fetchBackups,
  triggerBackup
} from '@/services/admin';

vi.mock('@/services/admin');

const mockedFetchTeacherSummaries = vi.mocked(fetchTeacherSummaries);
const mockedFetchTeacherDetail = vi.mocked(fetchTeacherDetail);
const mockedListTeacherDomains = vi.mocked(listTeacherDomains);
const mockedUpdateTeacherLifecycle = vi.mocked(updateTeacherLifecycle);
const mockedUpdateTeacherSlug = vi.mocked(updateTeacherSlug);
const mockedFetchOverview = vi.mocked(fetchOverview);
const mockedFetchBackups = vi.mocked(fetchBackups);
const mockedTriggerBackup = vi.mocked(triggerBackup);

describe('admin store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const entitlements = {
      studentLimit: 100,
      courseLimit: 10,
      lessonVideoLimit: 50,
      staffAccountLimit: 1,
      deviceLimit: 2,
      activationKeysEnabled: false,
      modules: {
        courses: true,
        assessments: false,
        tutoring: false,
        analytics: false,
        certifications: false
      }
    };
    mockedFetchTeacherSummaries.mockResolvedValue([
      { id: 1, slug: 'alpha', name: 'Alpha', subject: 'Math', plan: 'free', active: true }
    ]);
    mockedFetchTeacherDetail.mockResolvedValue({
      id: 1,
      slug: 'alpha',
      name: 'Alpha',
      subject: 'Math',
      phoneCountryCode: '+1',
      phoneNumber: '00000000000',
      plan: 'free',
      active: true,
      flags: {},
      entitlements,
      studentCount: 0,
      userAccountCount: 0,
      deviceCount: 0,
      deviceSummary: { limit: null, activeCount: 0, totalCount: 0, limitReached: false, nearLimit: false, devices: [] },
      accounts: [],

      domains: [],
      bio: '',
      photoUrl: ''
    });
    mockedListTeacherDomains.mockResolvedValue([{ id: 10, domain: 'alpha.example.com', verified: false, verificationToken: 'tok' }]);
    mockedUpdateTeacherLifecycle.mockResolvedValue({
      id: 1,
      slug: 'alpha',
      name: 'Alpha',
      subject: 'Science',
      phoneCountryCode: '+1',
      phoneNumber: '00000000000',
      plan: 'pro',
      active: false,
      flags: { feature: true },
      entitlements,
      studentCount: 0,
      userAccountCount: 0,
      deviceCount: 0,
      deviceSummary: { limit: null, activeCount: 0, totalCount: 0, limitReached: false, nearLimit: false, devices: [] },
      accounts: [],

      domains: [{ id: 10, domain: 'alpha.example.com', verified: false, verificationToken: 'tok' }]
    });
    mockedUpdateTeacherSlug.mockResolvedValue({
      id: 1,
      slug: 'alpha-new',
      name: 'Alpha',
      subject: 'Science',
      phoneCountryCode: '+1',
      phoneNumber: '00000000000',
      plan: 'pro',
      active: false,
      flags: { feature: true },
       entitlements,
      studentCount: 0,
      userAccountCount: 0,
      deviceCount: 0,
      deviceSummary: { limit: null, activeCount: 0, totalCount: 0, limitReached: false, nearLimit: false, devices: [] },
      accounts: [],

      domains: [{ id: 10, domain: 'alpha.example.com', verified: false, verificationToken: 'tok' }]
    });
    mockedFetchOverview.mockResolvedValue({
      teacherCount: 1,
      activeTeacherCount: 1,
      studentCount: 2,
      courseCount: 3,
      databaseSizeBytes: 1024,
      lastBackupAt: new Date().toISOString(),
      lastBackupStatus: 'COMPLETED'
    });
    mockedFetchBackups.mockResolvedValue([
      {
        id: 1,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        storageKey: 'backup.zip'
      }
    ]);
    mockedTriggerBackup.mockResolvedValue({
      id: 2,
      status: 'RUNNING',
      createdAt: new Date().toISOString(),
      storageKey: 'new-backup.zip'
    });
  });

  it('loads teachers, selects detail, updates lifecycle and slug, and manages backups', async () => {
    const store = useAdminStore();

    await store.loadTeachers();
    expect(mockedFetchTeacherSummaries).toHaveBeenCalled();
    expect(store.teachers).toHaveLength(1);
    expect(store.teacherTotalCount).toBe(1);

    await store.selectTeacher(1);
    expect(mockedFetchTeacherDetail).toHaveBeenCalledWith(1);
    expect(store.selectedTeacher?.domains[0].domain).toBe('alpha.example.com');

    await store.updateTeacher({ plan: 'pro', active: false, subject: 'Science' });
    expect(mockedUpdateTeacherLifecycle).toHaveBeenCalled();
    expect(store.selectedTeacher?.plan).toBe('pro');
    expect(store.teachers[0].plan).toBe('pro');
    expect(store.teachers[0].active).toBe(false);

    await store.updateSlug('alpha-new');
    expect(mockedUpdateTeacherSlug).toHaveBeenCalledWith(1, 'alpha-new');
    expect(store.teachers[0].slug).toBe('alpha-new');

    await store.refreshOverview();
    expect(store.overview?.databaseSizeBytes).toBe(1024);

    await store.refreshBackups();
    expect(store.backups).toHaveLength(1);

    await store.runBackup('tester');
    expect(mockedTriggerBackup).toHaveBeenCalledWith('tester');
    expect(store.backups[0].id).toBe(2);
  });
});
