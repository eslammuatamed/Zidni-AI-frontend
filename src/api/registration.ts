import api from '@/services/api';

export interface TeacherRegistrationSettings {
  enabled: boolean;
  whatsappNumber: string | null;
}

export interface UpdateTeacherRegistrationSettingsPayload {
  enabled: boolean;
  whatsappNumber: string | null;
}

export const getTeacherRegistrationSettings = async (): Promise<TeacherRegistrationSettings> => {
  const { data } = await api.get<TeacherRegistrationSettings>('/api/public/teacher-registration');
  return data;
};

let cachedRegistrationSettings: Promise<TeacherRegistrationSettings> | null = null;

export const getTeacherRegistrationSettingsCached = async (): Promise<TeacherRegistrationSettings> => {
  if (!cachedRegistrationSettings) {
    cachedRegistrationSettings = getTeacherRegistrationSettings().catch((error) => {
      cachedRegistrationSettings = null;
      throw error;
    });
  }
  return cachedRegistrationSettings;
};

export const buildWhatsappHref = (whatsappNumber: string | null | undefined, message: string): string => {
  const raw = whatsappNumber ?? '';
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) {
    return '';
  }
  const trimmedMessage = (message || '').trim();
  if (!trimmedMessage) {
    return `https://wa.me/${digits}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(trimmedMessage)}`;
};

export const getAdminTeacherRegistrationSettings = async (): Promise<TeacherRegistrationSettings> => {
  const { data } = await api.get<TeacherRegistrationSettings>('/api/admin/settings/registration');
  return data;
};

export const updateAdminTeacherRegistrationSettings = async (
  payload: UpdateTeacherRegistrationSettingsPayload
): Promise<TeacherRegistrationSettings> => {
  const body = {
    enabled: payload.enabled,
    whatsappNumber: payload.whatsappNumber
  };
  const { data } = await api.post<TeacherRegistrationSettings>('/api/admin/settings/registration', body);
  return data;
};
