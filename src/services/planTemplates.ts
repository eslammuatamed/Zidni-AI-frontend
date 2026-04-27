import api from '@/services/api';
import type { EntitlementKey, FeatureCode } from '@/constants/featureCatalog';
import type { AuditLogEntry, PageResponse } from '@/api/adminOps';

export interface PlanTemplateFeatureToggle {
  featureCode: FeatureCode;
  enabled: boolean;
}

export interface PlanTemplateEntitlementValue {
  entitlementKey: EntitlementKey;
  value: string | number | boolean | null;
}

export interface PlanTemplateMarketingContent {
  tagline: string | null;
  bestFor: string | null;
  includes: string[];
}

export interface PlanTemplateSummary {
  code: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED';
  displayName: string;
  billingPeriod: string | null;
  price: number | null;
  currency: string | null;
  region: string | null;
  marketingCopy: Record<string, PlanTemplateMarketingContent>;
  features: PlanTemplateFeatureToggle[];
  entitlements: PlanTemplateEntitlementValue[];
}

export interface UpdatePlanTemplatePayload {
  displayName?: string;
  billingPeriod?: string | null;
  price?: number | null;
  currency?: string | null;
  region?: string | null;
  features: Record<string, boolean>;
  entitlements: Record<EntitlementKey, string | number | boolean | null>;
  marketingCopy: Record<string, PlanTemplateMarketingContent>;
}

export interface ClonePlanTemplatePayload {
  displayName?: string;
  sourceVersion: number;
}

export interface PublishPlanTemplatePayload {
  version: number;
}

export interface AssignTenantPlanPayload {
  tenantSlug: string;
  planCode: string;
  version: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  pinned?: boolean | null;
}

export interface EndTenantPlanPayload {
  tenantSlug: string;
  effectiveTo?: string | null;
}

export interface BulkAssignTenantPlanPayload {
  tenantSlugs: string[];
  planCode: string;
  version: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  pinned?: boolean | null;
  dryRun?: boolean | null;
}

export interface BulkAssignTenantPlanError {
  tenantSlug: string;
  error: string;
}

export interface BulkAssignTenantPlanResult {
  tenantSlug: string;
  assigned: boolean;
  status: string;
  error?: string | null;
}

export interface BulkAssignTenantPlanResponse {
  total: number;
  successCount: number;
  errors: BulkAssignTenantPlanError[];
  results: BulkAssignTenantPlanResult[];
  previews: PlanAssignmentPreviewResponse[];
  dryRun: boolean;
}

export interface PlanTemplateExportResponse {
  planCode: string;
  version: number;
  displayName: string | null;
  billingPeriod: string | null;
  price: number | null;
  currency: string | null;
  region: string | null;
  marketingCopy: Record<string, PlanTemplateMarketingContent>;
  features: Record<string, boolean>;
  entitlements: Record<string, string | number | boolean | null>;
}

export interface PlanTemplateImportRequest {
  planCode: string;
  version?: number | null;
  displayName?: string | null;
  billingPeriod?: string | null;
  price?: number | null;
  currency?: string | null;
  region?: string | null;
  marketingCopy?: Record<string, PlanTemplateMarketingContent>;
  features?: Record<string, boolean>;
  entitlements?: Record<string, string | number | boolean | null>;
}

export interface PlanAssignmentPreviewRequest {
  planCode: string;
  version: number;
}

export interface PlanAssignmentPreviewResponse {
  tenantSlug: string;
  planCode: string;
  version: number;
  studentCount: number;
  studentLimit: number | null;
  instructorCount: number;
  instructorLimit: number | null;
  storageSecondsUsed: number;
  storageSecondsLimit: number | null;
  storageBytesUsed: number;
  storageBytesLimit: number | null;
  streamingMinutesUsed: number;
  streamingMinutesLimit: number | null;
  warnings: string[];
}

export interface PlanTemplateAssignmentSummary {
  teacherId: number | null;
  teacherSlug: string | null;
  teacherName: string | null;
  planCode: string;
  version: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
  effectiveFrom: string;
  effectiveTo: string | null;
  updatedAt: string;
  pinned: boolean;
}

export async function listPlanTemplates(): Promise<PlanTemplateSummary[]> {
  const { data } = await api.get<PlanTemplateSummary[]>('/api/v1/admin/plan-templates');
  return data;
}

export async function updatePlanTemplate(
  planCode: string,
  version: number,
  payload: UpdatePlanTemplatePayload
): Promise<PlanTemplateSummary> {
  const { data } = await api.put<PlanTemplateSummary>(
    `/api/v1/admin/plan-templates/${planCode}/versions/${version}`,
    payload
  );
  return data;
}

export async function clonePlanTemplate(
  planCode: string,
  payload: ClonePlanTemplatePayload
): Promise<PlanTemplateSummary> {
  const { data } = await api.post<PlanTemplateSummary>(
    `/api/v1/admin/plan-templates/${planCode}/versions`,
    payload
  );
  return data;
}

export async function publishPlanTemplate(
  planCode: string,
  payload: PublishPlanTemplatePayload
): Promise<PlanTemplateSummary> {
  const { data } = await api.post<PlanTemplateSummary>(
    `/api/v1/admin/plan-templates/${planCode}/versions/${payload.version}/publish`,
    {}
  );
  return data;
}

export async function assignTenantPlanTemplate(payload: AssignTenantPlanPayload): Promise<void> {
  await api.put(`/api/v1/admin/tenants/${payload.tenantSlug}/plan`, {
    planCode: payload.planCode,
    version: payload.version,
    effectiveFrom: payload.effectiveFrom ?? null,
    effectiveTo: payload.effectiveTo ?? null,
    pinned: payload.pinned ?? null
  });
}

export async function endTenantPlanTemplateAssignment(payload: EndTenantPlanPayload): Promise<void> {
  await api.post(`/api/v1/admin/tenants/${payload.tenantSlug}/plan/end`, {
    effectiveTo: payload.effectiveTo ?? null
  });
}

export async function listPlanTemplateAssignments(
  planCode: string,
  version?: number
): Promise<PlanTemplateAssignmentSummary[]> {
  const { data } = await api.get<PlanTemplateAssignmentSummary[]>(
    `/api/v1/admin/plan-templates/${planCode}/assignments`,
    {
      params: version ? { version } : undefined
    }
  );
  return data;
}

export async function bulkAssignTenantPlanTemplate(
  payload: BulkAssignTenantPlanPayload
): Promise<BulkAssignTenantPlanResponse> {
  const { data } = await api.post<BulkAssignTenantPlanResponse>('/api/v1/admin/tenants/plan/bulk', {
    tenantSlugs: payload.tenantSlugs,
    planCode: payload.planCode,
    version: payload.version,
    effectiveFrom: payload.effectiveFrom ?? null,
    effectiveTo: payload.effectiveTo ?? null,
    pinned: payload.pinned ?? null,
    dryRun: payload.dryRun ?? null
  });
  return data;
}

export interface PlanAuditQuery {
  planCode?: string;
  teacherSlug?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export async function listPlanAuditLogs(query?: PlanAuditQuery): Promise<PageResponse<AuditLogEntry>> {
  const params = {
    planCode: query?.planCode,
    teacherSlug: query?.teacherSlug,
    from: query?.from,
    to: query?.to,
    page: query?.page ?? 0,
    size: query?.size ?? 20
  };
  const { data } = await api.get<PageResponse<AuditLogEntry>>('/api/v1/admin/plan-templates/audit', { params });
  return data;
}

export async function previewTenantPlanAssignment(
  tenantSlug: string,
  payload: PlanAssignmentPreviewRequest
): Promise<PlanAssignmentPreviewResponse> {
  const { data } = await api.post<PlanAssignmentPreviewResponse>(`/api/v1/admin/tenants/${tenantSlug}/plan/preview`, {
    planCode: payload.planCode,
    version: payload.version
  });
  return data;
}

export async function exportPlanTemplate(planCode: string, version: number): Promise<PlanTemplateExportResponse> {
  const { data } = await api.get<PlanTemplateExportResponse>(
    `/api/v1/admin/plan-templates/${planCode}/versions/${version}/export`
  );
  return data;
}

export async function importPlanTemplate(payload: PlanTemplateImportRequest): Promise<PlanTemplateSummary> {
  const { data } = await api.post<PlanTemplateSummary>('/api/v1/admin/plan-templates/import', payload);
  return data;
}
