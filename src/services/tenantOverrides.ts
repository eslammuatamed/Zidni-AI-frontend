import api from '@/services/api';

export interface TenantOverrideSnapshot {
  teacherId: number;
  overrides: Record<string, boolean>;
  effective: Record<string, boolean>;
}

export async function fetchTenantOverrides(teacherId: number): Promise<TenantOverrideSnapshot> {
  const { data } = await api.get<TenantOverrideSnapshot>(`/api/v1/admin/tenants/${teacherId}/overrides`);
  return {
    teacherId: data.teacherId,
    overrides: data.overrides ?? {},
    effective: data.effective ?? {}
  };
}

export async function updateTenantOverrides(
  teacherId: number,
  overrides: Record<string, boolean>
): Promise<TenantOverrideSnapshot> {
  const { data } = await api.put<TenantOverrideSnapshot>(`/api/v1/admin/tenants/${teacherId}/overrides`, {
    features: overrides
  });
  return {
    teacherId: data.teacherId,
    overrides: data.overrides ?? {},
    effective: data.effective ?? {}
  };
}
