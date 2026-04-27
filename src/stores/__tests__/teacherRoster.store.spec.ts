import { createPinia, setActivePinia } from 'pinia';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { useTeacherRosterStore } from '@/stores/teacherRoster';
import {
  fetchTeacherStudents,
  fetchTeacherGroups,
  fetchGroupMembers,
  createTeacherGroup,
  updateTeacherGroup,
  deleteTeacherGroup,
  addGroupMembers,
  removeGroupMember
} from '@/services/teacherRoster';
import type { AxiosError } from 'axios';

vi.mock('@/services/teacherRoster', () => ({
  fetchTeacherStudents: vi.fn(),
  fetchTeacherGroups: vi.fn(),
  fetchGroupMembers: vi.fn(),
  createTeacherGroup: vi.fn(),
  updateTeacherGroup: vi.fn(),
  deleteTeacherGroup: vi.fn(),
  addGroupMembers: vi.fn(),
  removeGroupMember: vi.fn()
}));

const mockedFetchTeacherStudents = vi.mocked(fetchTeacherStudents);
const mockedFetchTeacherGroups = vi.mocked(fetchTeacherGroups);
const mockedFetchGroupMembers = vi.mocked(fetchGroupMembers);
const mockedCreateTeacherGroup = vi.mocked(createTeacherGroup);
const mockedUpdateTeacherGroup = vi.mocked(updateTeacherGroup);
const mockedDeleteTeacherGroup = vi.mocked(deleteTeacherGroup);
const mockedAddGroupMembers = vi.mocked(addGroupMembers);
const mockedRemoveGroupMember = vi.mocked(removeGroupMember);

describe('teacher roster store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockedFetchTeacherStudents.mockReset();
    mockedFetchTeacherGroups.mockReset();
    mockedFetchGroupMembers.mockReset();
    mockedCreateTeacherGroup.mockReset();
    mockedUpdateTeacherGroup.mockReset();
    mockedDeleteTeacherGroup.mockReset();
    mockedAddGroupMembers.mockReset();
    mockedRemoveGroupMember.mockReset();

    mockedFetchTeacherStudents.mockResolvedValue({
      items: [
        { studentId: 1, name: 'Alice', email: 'alice@example.com', status: 'active', joinedAt: '2024-01-01T00:00:00Z' }
      ],
      total: 1,
      page: 0,
      size: 20
    });

    mockedFetchTeacherGroups.mockResolvedValue({
      items: [
        { id: 10, name: 'Cohort A', description: 'Morning', capacity: 5, membersCount: 2, createdAt: '2024-01-01T00:00:00Z' }
      ],
      total: 1,
      page: 0,
      size: 10
    });

    mockedFetchGroupMembers.mockResolvedValue({
      items: [
        { studentId: 1, name: 'Alice', email: 'alice@example.com', joinedAt: '2024-01-02T00:00:00Z' }
      ],
      total: 1,
      page: 0,
      size: 10
    });
  });

  it('loads students and updates pagination state', async () => {
    const store = useTeacherRosterStore();

    await store.loadStudents({ search: 'ali', status: 'active', page: 0 });

    expect(mockedFetchTeacherStudents).toHaveBeenCalledWith({ search: 'ali', status: 'active', page: 0, size: 20 });
    expect(store.students).toHaveLength(1);
    expect(store.studentsTotal).toBe(1);
    expect(store.studentsPage).toBe(0);
    expect(store.featureEnabled).toBe(true);
  });

  it('marks feature disabled when API returns 404', async () => {
    const store = useTeacherRosterStore();
    const error = new Error('not found') as AxiosError;
    // @ts-expect-error partial mock
    error.response = { status: 404 };
    mockedFetchTeacherStudents.mockRejectedValueOnce(error);

    await store.loadStudents();

    expect(store.featureEnabled).toBe(false);
    expect(store.students).toHaveLength(0);
  });

  it('creates, updates, and deletes groups while keeping active selection in sync', async () => {
    const store = useTeacherRosterStore();
    await store.loadGroups();

    mockedCreateTeacherGroup.mockResolvedValue({
      id: 11,
      name: 'Cohort B',
      description: null,
      capacity: null,
      membersCount: 0,
      createdAt: '2024-02-01T00:00:00Z'
    });

    await store.createGroup({ name: 'Cohort B' });
    expect(store.groups).toHaveLength(2);
    expect(store.groupsTotal).toBe(2);

    store.activeGroup = store.groups[0];
    const originalId = store.groups[0].id;
    mockedUpdateTeacherGroup.mockResolvedValue({
      ...store.groups[0],
      description: 'Updated'
    });

    await store.updateGroup(originalId, { description: 'Updated' });
    expect(store.groups[0].description).toBe('Updated');
    expect(store.activeGroup?.description).toBe('Updated');

    mockedDeleteTeacherGroup.mockResolvedValue();
    await store.deleteGroup(originalId);
    expect(store.groups.some((group) => group.id === originalId)).toBe(false);
    expect(store.groupsTotal).toBe(1);
    expect(store.activeGroup).toBeNull();
  });

  it('loads and mutates group members', async () => {
    const store = useTeacherRosterStore();
    await store.loadGroups();

    const groupId = store.groups[0].id;
    await store.loadMembers(groupId);
    expect(mockedFetchGroupMembers).toHaveBeenCalledWith(groupId, { page: 0, size: 10 });
    expect(store.membersTotal).toBe(1);

    mockedAddGroupMembers.mockResolvedValue([
      { studentId: 2, name: 'Bob', email: 'bob@example.com', joinedAt: '2024-01-03T00:00:00Z' }
    ]);
    mockedFetchGroupMembers.mockResolvedValueOnce({
      items: [
        { studentId: 1, name: 'Alice', email: 'alice@example.com', joinedAt: '2024-01-02T00:00:00Z' },
        { studentId: 2, name: 'Bob', email: 'bob@example.com', joinedAt: '2024-01-03T00:00:00Z' }
      ],
      total: 2,
      page: 0,
      size: 10
    });
    mockedFetchTeacherGroups.mockResolvedValueOnce({
      items: [
        { id: groupId, name: 'Cohort A', description: 'Morning', capacity: 5, membersCount: 3, createdAt: '2024-01-01T00:00:00Z' }
      ],
      total: 1,
      page: 0,
      size: 10
    });

    await store.addMembers(groupId, { studentIds: [2] });
    expect(mockedAddGroupMembers).toHaveBeenCalledWith(groupId, { studentIds: [2] });
    expect(store.membersTotal).toBe(2);
    expect(store.groups[0].membersCount).toBe(3);

    mockedRemoveGroupMember.mockResolvedValue();
    mockedFetchGroupMembers.mockResolvedValueOnce({
      items: [
        { studentId: 1, name: 'Alice', email: 'alice@example.com', joinedAt: '2024-01-02T00:00:00Z' }
      ],
      total: 1,
      page: 0,
      size: 10
    });
    mockedFetchTeacherGroups.mockResolvedValueOnce({
      items: [
        { id: groupId, name: 'Cohort A', description: 'Morning', capacity: 5, membersCount: 1, createdAt: '2024-01-01T00:00:00Z' }
      ],
      total: 1,
      page: 0,
      size: 10
    });

    await store.removeMember(groupId, 2);
    expect(mockedRemoveGroupMember).toHaveBeenCalledWith(groupId, 2);
    expect(store.membersTotal).toBe(1);
    expect(store.groups[0].membersCount).toBe(1);
  });
});
