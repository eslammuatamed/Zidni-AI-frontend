import { computed, onMounted, ref } from 'vue';
import { buildAppUrl } from '@/lib/host';
import {
  buildWhatsappHref,
  getTeacherRegistrationSettingsCached,
} from '@/api/registration';

/**
 * Shared CTA destination for the marketing home sections.
 *
 * Resolves the teacher-registration WhatsApp link (cached settings call) and
 * falls back to the teacher login page until it loads or when it fails.
 *
 * @param message - lazy getter for the localized WhatsApp prefill message
 */
export function useRegistrationCta(message: () => string) {
  const registerHref = ref('');

  const ctaHref = computed(
    () => registerHref.value || buildAppUrl('/teacher/login'),
  );
  const ctaExternal = computed(() => Boolean(registerHref.value));

  onMounted(async () => {
    try {
      const settings = await getTeacherRegistrationSettingsCached();
      registerHref.value = buildWhatsappHref(
        settings.whatsappNumber,
        message(),
      );
    } catch (error) {
      console.warn(
        '[useRegistrationCta] failed to load registration settings',
        error,
      );
    }
  });

  return { ctaHref, ctaExternal };
}
