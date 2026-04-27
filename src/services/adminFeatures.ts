import api from '@/services/api';

export interface AdminFeatureSummary {
  code: string;
  name: string;
  description: string;
  category: string;
  defaultEnabled: boolean;
  teacherScoped: boolean;
}

export async function listAdminFeatures(): Promise<AdminFeatureSummary[]> {
  const { data } = await api.get<AdminFeatureSummary[]>('/api/v1/admin/features');
  return data.map((feature) => ({
    ...feature,
    teacherScoped: Boolean(feature.teacherScoped)
  }));
}
