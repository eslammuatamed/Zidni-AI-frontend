import api from '@/services/api';

export type LivePollKind = 'single' | 'multi' | 'mcq' | string;

export interface LivePollOptionPayload {
  text: string;
  position?: number | null;
}

export interface TeacherLivePollCreatePayload {
  question: string;
  kind: LivePollKind;
  options: LivePollOptionPayload[];
  settings?: Record<string, unknown> | null;
}

export interface LivePollOption {
  id: number;
  text: string;
  position: number;
  voteCount?: number;
}

export interface TeacherLivePoll {
  pollId: number;
  sessionId: number;
  question: string;
  kind: LivePollKind;
  settings?: Record<string, unknown> | null;
  options: LivePollOption[];
  totalResponses: number;
}

export interface TeacherLivePollResults extends TeacherLivePoll {}

export interface StudentLivePoll {
  pollId: number;
  sessionId: number;
  question: string;
  kind: LivePollKind;
  options: LivePollOption[];
  responded: boolean;
  selectedOptionIds: number[];
}

export interface StudentLivePollsResponse {
  items: StudentLivePoll[];
}

export interface StudentLivePollRespondPayload {
  selectedOptionIds: number[];
}

export async function createTeacherPoll(sessionId: number, payload: TeacherLivePollCreatePayload) {
  const { data } = await api.post<TeacherLivePoll>(`/teacher/live/sessions/${sessionId}/polls`, payload);
  return data;
}

export async function listTeacherPolls(sessionId: number) {
  const { data } = await api.get<TeacherLivePoll[]>(`/teacher/live/sessions/${sessionId}/polls`);
  return data;
}

export async function getTeacherPollResults(pollId: number) {
  const { data } = await api.get<TeacherLivePollResults>(`/teacher/live/polls/${pollId}/results`);
  return data;
}

export async function listStudentPolls(sessionId: number) {
  const { data } = await api.get<StudentLivePollsResponse>(`/live/sessions/${sessionId}/polls`);
  return data;
}

export async function respondToPoll(pollId: number, payload: StudentLivePollRespondPayload) {
  const { data } = await api.post<StudentLivePoll>(`/live/polls/${pollId}/respond`, payload);
  return data;
}
