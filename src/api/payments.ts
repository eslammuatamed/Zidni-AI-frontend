import api from '@/services/api';
import type { ManualPaymentMethod, ManualPaymentStatus, PaymentGateway } from '@/services/student';
import type { PagedResult, StudentSummary } from '@/services/teacherRegistrations';

export interface CourseSummary {
  id: number;
  title: string;
}

export interface TeacherManualPaymentItem {
  paymentId: number;
  teacherId: number;
  teacherName?: string | null;
  student: StudentSummary;
  course: CourseSummary;
  amount: number;
  amountMinor?: number | null;
  currency?: string | null;
  method: ManualPaymentMethod;
  gateway?: PaymentGateway | null;
  status: ManualPaymentStatus;
  proofUrl?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  proofKey?: string | null;
  gatewayTxId?: string | null;
  merchantOrderId?: string | null;
}

export interface TutoringSessionSummary {
  id: number;
}

export interface TeacherTutoringPaymentItem {
  paymentId: number;
  session: TutoringSessionSummary;
  student: StudentSummary;
  amount: number;
  currency?: string | null;
  method: ManualPaymentMethod;
  status: ManualPaymentStatus;
  proofUrl?: string | null;
  reviewedBy?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

export interface TeacherManualPaymentsQuery {
  studentId?: number | null;
  courseId?: number | null;
  status?: ManualPaymentStatus | '' | null;
  method?: ManualPaymentMethod | '' | null;
  gateway?: PaymentGateway | '' | null;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sortField?: string;
  sortDesc?: boolean;
}

export interface TeacherTutoringPaymentsQuery {
  status?: ManualPaymentStatus | '' | null;
  method?: ManualPaymentMethod | '' | null;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sortField?: string;
  sortDesc?: boolean;
}

const buildManualParams = (query: TeacherManualPaymentsQuery = {}, format?: 'csv') => {
  const params: Record<string, unknown> = {};
  const page = Math.max((query.page ?? 1) - 1, 0);
  const size = query.size ?? 25;
  params.page = page;
  params.size = size;

  if (query.courseId) {
    params.courseId = query.courseId;
  }
  if (query.studentId) {
    params.studentId = query.studentId;
  }
  if (query.status) {
    params.status = query.status;
  }
  if (query.method) {
    params.method = query.method;
  }
  if (query.gateway) {
    params.gateway = query.gateway;
  }
  if (query.search && query.search.trim().length > 0) {
    params.q = query.search.trim();
  }
  if (query.dateFrom) {
    params.dateFrom = query.dateFrom;
  }
  if (query.dateTo) {
    params.dateTo = query.dateTo;
  }
  const sortField = query.sortField || 'createdAt';
  const sortOrder = query.sortDesc === false ? 'asc' : 'desc';
  params.sort = `${sortField},${sortOrder}`;
  if (format) {
    params.format = format;
  }
  return params;
};

const buildTutoringParams = (query: TeacherTutoringPaymentsQuery = {}, format?: 'csv') => {
  const params: Record<string, unknown> = {};
  const page = Math.max((query.page ?? 1) - 1, 0);
  const size = query.size ?? 25;
  params.page = page;
  params.size = size;

  if (query.status) {
    params.status = query.status;
  }
  if (query.method) {
    params.method = query.method;
  }
  if (query.search && query.search.trim().length > 0) {
    params.q = query.search.trim();
  }
  if (query.dateFrom) {
    params.dateFrom = query.dateFrom;
  }
  if (query.dateTo) {
    params.dateTo = query.dateTo;
  }
  const sortField = query.sortField || 'submittedAt';
  const sortOrder = query.sortDesc === false ? 'asc' : 'desc';
  params.sort = `${sortField},${sortOrder}`;
  if (format) {
    params.format = format;
  }
  return params;
};

export async function listManualPayments(query: TeacherManualPaymentsQuery = {}) {
  const params = buildManualParams(query);
  const { data } = await api.get<PagedResult<TeacherManualPaymentItem>>('/teacher/payments/manual', {
    params
  });
  return data;
}

export async function listTutoringPayments(query: TeacherTutoringPaymentsQuery = {}) {
  const params = buildTutoringParams(query);
  const { data } = await api.get<PagedResult<TeacherTutoringPaymentItem>>(
    '/teacher/payments/tutoring',
    { params }
  );
  return data;
}

export async function approveManualPayment(
  paymentId: number,
  payload: { notes?: string | null } = {}
) {
  const { data } = await api.patch<TeacherManualPaymentItem>(
    `/teacher/payments/manual/${paymentId}/approve`,
    payload
  );
  return data;
}

export async function rejectManualPayment(
  paymentId: number,
  payload: { notes?: string | null } = {}
) {
  const { data } = await api.patch<TeacherManualPaymentItem>(
    `/teacher/payments/manual/${paymentId}/reject`,
    payload
  );
  return data;
}

export async function approveTutoringPayment(
  paymentId: number,
  payload: { notes?: string | null } = {}
) {
  const { data } = await api.patch<TeacherTutoringPaymentItem>(
    `/teacher/payments/tutoring/${paymentId}/approve`,
    payload
  );
  return data;
}

export async function rejectTutoringPayment(
  paymentId: number,
  payload: { notes?: string | null } = {}
) {
  const { data } = await api.patch<TeacherTutoringPaymentItem>(
    `/teacher/payments/tutoring/${paymentId}/reject`,
    payload
  );
  return data;
}

export async function exportManualPaymentsCsv(query: TeacherManualPaymentsQuery = {}) {
  const params = buildManualParams(query, 'csv');
  const { data } = await api.get('/teacher/payments/manual', {
    params,
    responseType: 'blob',
    headers: {
      Accept: 'text/csv'
    }
  });
  return data as Blob;
}

export type AdminPaymentMethod = 'vodafone_cash' | 'paypal' | (string & Record<never, never>);

export type AdminPaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | (string & Record<never, never>);

export interface AdminPaymentLogItem {
  id: number;
  reference: string;
  method: AdminPaymentMethod;
  status: AdminPaymentStatus | string;
  amount: number;
  currency: string;
  payerName: string;
  payerEmail?: string | null;
  payerPhone?: string | null;
  invoiceNumber?: string | null;
  transferReference?: string | null;
  walletNumber?: string | null;
  transactionId?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  createdAt: string;
  processedAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AdminPaymentLogsQuery {
  method?: AdminPaymentMethod | '' | null;
  status?: AdminPaymentStatus | '' | null;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  sortField?: string;
  sortDesc?: boolean;
}

export interface AdminDecisionPayload {
  reason?: string | null;
}

export interface AdminVodafoneSettings {
  walletNumber?: string | null;
  instructionsAr?: string | null;
  instructionsEn?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
}

export interface UpdateAdminVodafoneSettingsPayload {
  walletNumber?: string | null;
  instructionsAr?: string | null;
  instructionsEn?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
}

export interface AdminPaypalSettings {
  egyptianPoundToUsdRate?: number | null;
  saudiRiyalToUsdRate?: number | null;
  uaeDirhamToUsdRate?: number | null;
}

export interface AdminStudentManualPayment {
  id: number;
  courseId: number;
  courseTitle: string;
  amount: number;
  amountMinor?: number | null;
  currency?: string | null;
  method: ManualPaymentMethod;
  gateway?: PaymentGateway | null;
  proofUrl?: string | null;
  proofKey?: string | null;
  status: ManualPaymentStatus;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  notes?: string | null;
  gatewayTxId?: string | null;
  merchantOrderId?: string | null;
  studentId?: number | null;
  studentName?: string | null;
  studentEmail?: string | null;
}

export interface AdminStudentPaymentDecisionPayload {
  notes?: string | null;
}

export interface UpdateAdminPaypalSettingsPayload {
  egyptianPoundToUsdRate?: number | null;
  saudiRiyalToUsdRate?: number | null;
  uaeDirhamToUsdRate?: number | null;
}

const buildAdminPaymentParams = (query: AdminPaymentLogsQuery = {}) => {
  const params: Record<string, unknown> = {};
  const page = Math.max((query.page ?? 1) - 1, 0);
  const size = query.size ?? 25;
  params.page = page;
  params.size = size;

  if (query.method) {
    params.method = query.method;
  }
  if (query.status) {
    params.status = query.status;
  }
  if (query.search && query.search.trim().length > 0) {
    params.q = query.search.trim();
  }
  if (query.dateFrom) {
    params.dateFrom = query.dateFrom;
  }
  if (query.dateTo) {
    params.dateTo = query.dateTo;
  }

  const sortField = query.sortField || 'createdAt';
  const sortOrder = query.sortDesc === false ? 'asc' : 'desc';
  params.sort = `${sortField},${sortOrder}`;

  return params;
};

export async function listAdminPaymentLogs(query: AdminPaymentLogsQuery = {}) {
  const params = buildAdminPaymentParams(query);
  const { data } = await api.get<PagedResult<AdminPaymentLogItem>>('/admin/payments/logs', {
    params
  });
  return data;
}

export async function approveAdminPaymentLog(id: number) {
  const { data } = await api.post<AdminPaymentLogItem>(`/admin/payments/logs/${id}/approve`);
  return data;
}

export async function rejectAdminPaymentLog(id: number, payload: AdminDecisionPayload) {
  const body = payload ?? {};
  const { data } = await api.post<AdminPaymentLogItem>(`/admin/payments/logs/${id}/reject`, body);
  return data;
}

export async function getAdminVodafoneSettings() {
  const { data } = await api.get<AdminVodafoneSettings>('/admin/settings/payments');
  return data;
}

export async function updateAdminVodafoneSettings(payload: UpdateAdminVodafoneSettingsPayload) {
  const body = payload ?? {};
  const { data } = await api.post<AdminVodafoneSettings>('/admin/settings/payments', body);
  return data;
}

export async function getAdminPaypalSettings() {
  const { data } = await api.get<AdminPaypalSettings>('/admin/settings/payments/paypal');
  return data;
}

export async function updateAdminPaypalSettings(payload: UpdateAdminPaypalSettingsPayload) {
  const body = payload ?? {};
  const { data } = await api.post<AdminPaypalSettings>('/admin/settings/payments/paypal', body);
  return data;
}

export async function listAdminStudentPayments(status?: ManualPaymentStatus | string | null) {
  const params: Record<string, string> = {};
  if (status) {
    params.status = status.toString();
  }
  const { data } = await api.get<AdminStudentManualPayment[]>('/admin/student-payments', {
    params
  });
  return data;
}

const normalizeDecisionPayload = (payload?: AdminStudentPaymentDecisionPayload) => {
  if (!payload) {
    return {};
  }
  const notes = payload.notes?.trim();
  return notes && notes.length > 0 ? { notes } : {};
};

export async function approveAdminStudentPayment(
  id: number,
  payload?: AdminStudentPaymentDecisionPayload
) {
  const body = normalizeDecisionPayload(payload);
  const { data } = await api.patch<AdminStudentManualPayment>(
    `/admin/student-payments/${id}/approve`,
    body
  );
  return data;
}

export async function rejectAdminStudentPayment(
  id: number,
  payload?: AdminStudentPaymentDecisionPayload
) {
  const body = normalizeDecisionPayload(payload);
  const { data } = await api.patch<AdminStudentManualPayment>(
    `/admin/student-payments/${id}/reject`,
    body
  );
  return data;
}

export async function exportTutoringPaymentsCsv(query: TeacherTutoringPaymentsQuery = {}) {
  const params = buildTutoringParams(query, 'csv');
  const { data } = await api.get('/teacher/payments/tutoring', {
    params,
    responseType: 'blob',
    headers: {
      Accept: 'text/csv'
    }
  });
  return data as Blob;
}

export default {
  listManualPayments,
  listTutoringPayments,
  approveManualPayment,
  rejectManualPayment,
  approveTutoringPayment,
  rejectTutoringPayment,
  exportManualPaymentsCsv,
  exportTutoringPaymentsCsv
};
