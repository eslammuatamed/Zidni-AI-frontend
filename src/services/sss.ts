import api from './api';

export interface AuthResponse {
  token?: string;
  role: 'TEACHER' | 'STUDENT' | 'PLATFORM_ADMIN' | string;
  tenantSlug?: string;
  teacherId?: number;
  studentId?: number;
  assistantId?: number;
  assistantRoleId?: number;
  assistantName?: string | null;
  assistantPermissions?: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export class AuthService {
  static async login(payload: LoginPayload, tenantSlug?: string) {
    const requestConfig = tenantSlug
      ? { params: { tenant: tenantSlug.trim().toLowerCase() } }
      : undefined;

    const { data } = await api.post<AuthResponse>('/api/v1/auth/login', payload, requestConfig);
    return data;
  }

  static async me() {
    const { data } = await api.get<AuthResponse>('/api/v1/auth/me');
    return data;
  }

  static clearAuth() {
    // maintained for backwards compatibility
  }
}

export default AuthService;
