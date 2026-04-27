import api from '@/services/api';

export interface CertificateGenerateRequest {
  studentId: number;
  courseId: number;
  issueDate?: string | null;
  templateKey?: string | null;
}

export interface CertificateIssueResponse {
  id: number;
  studentName: string;
  courseName: string;
  teacherName: string;
  pdfUrl: string;
  verificationCode: string;
  issuedAt: string;
}

export interface CertificateVerificationResponse {
  verificationCode?: string | null;
  studentName?: string | null;
  courseName?: string | null;
  teacherName?: string | null;
  issuedAt?: string | null;
  valid: boolean;
}

export interface TeacherCertificateResponse {
  id: number;
  studentName: string | null;
  courseName: string | null;
  pdfUrl: string;
  qrCode: string | null;
  verificationCode: string | null;
  issuedAt: string;
}

export async function generateCertificate(payload: CertificateGenerateRequest) {
  const { data } = await api.post<CertificateIssueResponse>('/certificates/generate', payload);
  return data;
}

export async function fetchStudentCertificates() {
  const { data } = await api.get('/certificates/student');
  return data;
}

export async function fetchTeacherCertificates() {
  const { data } = await api.get<TeacherCertificateResponse[]>('/certificates/teacher');
  return data;
}

export async function verifyCertificate(code: string) {
  const { data } = await api.get<CertificateVerificationResponse>(`/certificates/verify/${encodeURIComponent(code)}`);
  return data;
}
