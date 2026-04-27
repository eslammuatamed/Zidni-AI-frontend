import api from '@/services/api';

export type ManualPaymentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUCCESS'
  | 'FAILED';
export type ManualPaymentMethod =
  | 'bank'
  | 'cash'
  | 'transfer'
  | 'instapay'
  | 'vodafone_cash'
  | 'paypal'
  | 'paymob'
  | 'custom_link'
  | 'other';
export type PaymentGateway = 'VODAFONE_CASH' | 'PAYPAL' | 'PAYMOB';

export interface StudentProfile {
  id: number;
  email: string;
  name: string;
  phone?: string;
  status: string;
  preferences?: Record<string, unknown>;
  verified: boolean;
  teacherSlug?: string | null;
  verificationToken?: string | null;
}

export interface StudentRegistrationPayload {
  email: string;
  name: string;
  phone?: string;
  password: string;
  preferences?: Record<string, unknown>;
}

export interface StudentVerificationPayload {
  token: string;
  email?: string;
}

export interface ManualPaymentPayload {
  courseId: number;
  amount: number;
  currency?: string;
  method: ManualPaymentMethod;
  gateway?: PaymentGateway | null;
  proofImageUrl?: string;
  proofUrl?: string;
  proofKey?: string;
  notes?: string;
  transferReference?: string;
  offerCode?: string;
}

export interface ManualPaymentDecisionPayload {
  status: ManualPaymentStatus;
  notes?: string;
}

const normalizeManualPaymentStatusForApi = (
  status: ManualPaymentStatus
): ManualPaymentStatus => {
  if (!status) {
    return status;
  }

  const normalized = String(status)
    .trim()
    .replace(/[-\s]+/g, '_')
    .toUpperCase();

  if (normalized === 'PENDING') {
    return 'PENDING_REVIEW';
  }

  return normalized as ManualPaymentStatus;
};

export interface ManualPaymentView {
  id: number;
  courseId: number;
  courseTitle: string;
  amount: number;
  amountMinor?: number | null;
  currency?: string | null;
  method: ManualPaymentMethod;
  gateway?: PaymentGateway | null;
  proofUrl?: string;
  proofKey?: string;
  status: ManualPaymentStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  gatewayTxId?: string | null;
  merchantOrderId?: string | null;
  source?: string | null;
  offerCode?: string | null;
  studentId?: number | null;
  studentName?: string | null;
  studentEmail?: string | null;
}

export interface ManualPaymentMethodDetails {
  enabled: boolean;
  accountNumber?: string | null;
  iban?: string | null;
  accountHolderName?: string | null;
  bankName?: string | null;
  bankDetails?: string | null;
  instructionsAr?: string | null;
  instructionsEn?: string | null;
}

export interface ManualPaymentCustomLink {
  enabled: boolean;
  url?: string | null;
  instructionsAr?: string | null;
  instructionsEn?: string | null;
}

export interface StudentManualPaymentOptions {
  bankTransfer: ManualPaymentMethodDetails;
  instaPay: ManualPaymentMethodDetails;
  vodafoneCash: ManualPaymentMethodDetails;
  customLink: ManualPaymentCustomLink;
}

export interface StudentVodafoneSettings {
  walletNumber: string | null;
  instructionsAr: string | null;
  instructionsEn: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface StudentCourseSummary {
  id: number;
  title: string;
  type: string;
  price: number;
  currency?: string | null;
  thumbnailUrl?: string;
  level?: string;
  language?: string;
  active?: boolean;
}

export interface EnrollmentView {
  id: number;
  courseId: number;
  courseTitle: string;
  status: string;
  startAt?: string;
  endAt?: string;
  progress?: number;
  teacherId: number;
  teacherName?: string;
  teacherPhotoUrl?: string;
  teacherSubject?: string;
  teacherActive?: boolean;
  source?: string | null;
  offerCode?: string | null;
  studentId?: number;
  studentName?: string;
  studentEmail?: string;
}

export interface NotificationView {
  id: number;
  type: string;
  status: string;
  message: string;
  createdAt: string;
}

export async function registerStudent(payload: StudentRegistrationPayload) {
  const { data } = await api.post<StudentProfile>('/v1/students/register', payload);
  return data;
}

export async function verifyStudent(
  payload: StudentVerificationPayload,
  options?: { tenant?: string; studentId?: string | number; tenantHeader?: string }
) {
  const params: Record<string, string | number> = {};
  if (options?.tenant) {
    params.tenant = options.tenant;
  }
  if (options?.studentId) {
    params.studentId = options.studentId;
  }

  const { data } = await api.post<StudentProfile>('/v1/students/verify', payload, {
    params: Object.keys(params).length > 0 ? params : undefined
  });
  return data;
}

export async function getStudentProfile() {
  const { data } = await api.get<StudentProfile>('/v1/students/me');
  return data;
}

export async function updateStudentProfile(payload: Partial<StudentProfile>) {
  const { data } = await api.put<StudentProfile>('/v1/students/me', payload);
  return data;
}

export async function getStudentManualPayments() {
  const { data } = await api.get<ManualPaymentView[]>('/v1/students/payments');
  return data;
}

export async function getStudentCourses() {
  const { data } = await api.get<StudentCourseSummary[]>('/v1/students/courses');
  return data;
}

export async function submitManualPayment(payload: ManualPaymentPayload) {
  const requestBody = {
    courseId: payload.courseId,
    method: payload.method,
    gateway: payload.gateway ?? null,
    amount: payload.amount,
    currency: (payload.currency ?? 'EGP').toUpperCase(),
    proofImageUrl: payload.proofImageUrl ?? payload.proofUrl,
    proofKey: payload.proofKey,
    notes: payload.notes,
    transferReference: payload.transferReference,
    offerCode: payload.offerCode
  };
  const { data } = await api.post<ManualPaymentView>('/v1/students/payments', requestBody);
  return data;
}

export async function uploadPaymentProof(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<UploadResult>('/v1/students/payments/proof', formData);
  return data;
}


export async function getStudentManualPaymentOptions() {
  const { data } = await api.get<StudentManualPaymentOptions>('/v1/students/payments/manual/options');
  return data;
}

export async function getStudentVodafoneSettings() {
  const { data } = await api.get<StudentVodafoneSettings>('/v1/students/payments/vodafone/settings');
  return data;
}

export async function getStudentEnrollments() {
  const { data } = await api.get<EnrollmentView[]>('/v1/students/enrollments');
  return data;
}

export async function getTeacherManualPayments(status: ManualPaymentStatus) {
  const { data } = await api.get<ManualPaymentView[]>('/v1/teacher/payments', { params: { status } });
  return data;
}

export async function reviewManualPayment(paymentId: number, payload: ManualPaymentDecisionPayload) {
  const { data } = await api.post<ManualPaymentView>(`/v1/teacher/payments/${paymentId}/decision`, {
    ...payload,
    status: normalizeManualPaymentStatusForApi(payload.status)
  });
  return data;
}

export async function reviewManualPaymentsBulk(payload: { paymentIds: number[]; status: ManualPaymentStatus; notes?: string }) {
  const { data } = await api.post<ManualPaymentView[]>('/v1/teacher/payments/bulk-decision', {
    ...payload,
    status: normalizeManualPaymentStatusForApi(payload.status)
  });
  return data;
}

export async function getTeacherEnrollments() {
  const { data } = await api.get<EnrollmentView[]>('/v1/teacher/enrollments');
  return data;
}

export interface TeacherEnrollmentUpdatePayload {
  courseId?: number;
  status?: string;
  startAt?: string;
  endAt?: string;
}

export async function updateTeacherEnrollment(enrollmentId: number, payload: TeacherEnrollmentUpdatePayload) {
  const { data } = await api.patch<EnrollmentView>(`/v1/teacher/enrollments/${enrollmentId}`, payload);
  return data;
}

export async function getStudentNotifications() {
  const { data } = await api.get<NotificationView[]>('/v1/students/notifications');
  return data;
}
