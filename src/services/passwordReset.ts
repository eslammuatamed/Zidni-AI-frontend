import api from '@/services/api';

export type PasswordResetRole = 'TEACHER' | 'TEACHER_ASSISTANT' | 'STUDENT';

export interface PasswordResetTokenInfo {
  email: string;
  role: PasswordResetRole;
  expiresAt: string;
}

export const requestPasswordReset = (payload: { email: string; role: PasswordResetRole }) => {
  return api.post('/api/v1/auth/password/forgot', payload);
};

export const fetchPasswordResetToken = (token: string) => {
  return api.get<PasswordResetTokenInfo>(`/api/v1/auth/password/tokens/${encodeURIComponent(token)}`);
};

export const completePasswordReset = (payload: { token: string; password: string }) => {
  return api.post('/api/v1/auth/password/reset', payload);
};
