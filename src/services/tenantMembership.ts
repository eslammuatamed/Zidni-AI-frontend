import api from '@/services/api';

export interface TenantMembership {
  tenantId: string;
  teacherId: number;
  academyName: string | null;
  role: 'STUDENT' | 'TEACHER_ASSISTANT' | 'OBSERVER';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

export interface TenantEnrollment {
  id: string;
}

export const fetchMemberships = async (): Promise<TenantMembership[]> => {
  const { data } = await api.get<TenantMembership[]>('/api/v1/me/tenants');
  return data;
};

export const joinTenant = async (tenantId: string): Promise<TenantMembership> => {
  const { data } = await api.post<TenantMembership>(`/api/v1/tenants/${tenantId}/memberships/join`);
  return data;
};

export const switchTenant = async (tenantId: string): Promise<void> => {
  await api.post('/api/v1/auth/switch-tenant', { tenantId });
};

export const enrollInCourse = async (courseId: number): Promise<TenantEnrollment> => {
  const { data } = await api.post<TenantEnrollment>(`/api/v1/courses/${courseId}/enroll`);
  return data;
};
