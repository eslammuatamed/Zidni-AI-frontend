import api from '@/services/api';

export interface StudentLink {
  teacherId: number;
  teacherSlug: string;
  teacherName: string;
  primary: boolean;
}

export async function listStudentLinks() {
  const { data } = await api.get<StudentLink[]>('/student/links');
  return data;
}

export default {
  listStudentLinks
};
