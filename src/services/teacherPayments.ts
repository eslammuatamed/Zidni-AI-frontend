import type {
  CourseSummary,
  TeacherManualPaymentItem,
  TeacherManualPaymentsQuery,
  TeacherTutoringPaymentItem,
  TeacherTutoringPaymentsQuery
} from '@/api/payments';
import {
  exportManualPaymentsCsv as exportManualPaymentsCsvApi,
  exportTutoringPaymentsCsv as exportTutoringPaymentsCsvApi,
  listManualPayments,
  listTutoringPayments
} from '@/api/payments';
export type {
  CourseSummary,
  TeacherManualPaymentItem,
  TeacherManualPaymentsQuery,
  TeacherTutoringPaymentItem,
  TeacherTutoringPaymentsQuery
};

export async function fetchTeacherManualPayments(query: TeacherManualPaymentsQuery) {
  return listManualPayments(query);
}

export async function exportTeacherManualPaymentsCsv(query: TeacherManualPaymentsQuery) {
  return exportManualPaymentsCsvApi(query);
}

export async function fetchTeacherTutoringPayments(query: TeacherTutoringPaymentsQuery) {
  return listTutoringPayments(query);
}

export async function exportTeacherTutoringPaymentsCsv(query: TeacherTutoringPaymentsQuery) {
  return exportTutoringPaymentsCsvApi(query);
}
