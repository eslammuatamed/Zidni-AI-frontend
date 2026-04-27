import { http } from '@/lib/http';
import { toLandingVM, type LandingVM } from './content.adapter';

function resolveTeacherIdentifier(teacherId?: string): string | undefined {
  if (typeof teacherId !== 'string') {
    return undefined;
  }
  const trimmed = teacherId.trim();
  return trimmed || undefined;
}

export async function fetchLandingContent(teacherId?: string): Promise<LandingVM> {
  const resolved = resolveTeacherIdentifier(teacherId) ?? 'demo-teacher';
  const url = `/public/v1/teachers/${resolved}/landing`;
  try {
    const relativeUrl = url.startsWith('/') ? url.slice(1) : url;
    const { data } = await http.get(relativeUrl, {
      headers: { 'Accept-Language': 'ar' }
    });
    return toLandingVM(data);
  } catch {
    return toLandingVM({});
  }
}
