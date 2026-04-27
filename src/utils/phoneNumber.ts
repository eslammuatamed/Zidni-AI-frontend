import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();
const DEFAULT_REGION = 'ZZ';

export interface NormalizedPhoneInput {
  phoneCountryCode: string;
  phoneNumber: string;
  e164: string;
}

export class PhoneNumberValidationError extends Error {
  constructor(message = 'Invalid phone number') {
    super(message);
    this.name = 'PhoneNumberValidationError';
  }
}

export function normalizePhoneInput(countryCode: string, phoneNumber: string): NormalizedPhoneInput {
  const sanitizedCountryCode = sanitizeCountryCode(countryCode);
  const sanitizedNumber = sanitizePhoneNumber(phoneNumber);

  if (!sanitizedCountryCode || !sanitizedNumber) {
    throw new PhoneNumberValidationError();
  }

  try {
    const parsed = phoneUtil.parseAndKeepRawInput(`${sanitizedCountryCode}${sanitizedNumber}`, DEFAULT_REGION);
    if (!phoneUtil.isValidNumber(parsed)) {
      throw new PhoneNumberValidationError();
    }

    const phoneCountryCode = `+${parsed.getCountryCode()}`;
    const e164 = phoneUtil.format(parsed, PhoneNumberFormat.E164);
    const nationalNumber = phoneUtil.getNationalSignificantNumber(parsed);

    return {
      phoneCountryCode,
      phoneNumber: nationalNumber,
      e164
    };
  } catch (error) {
    if (error instanceof PhoneNumberValidationError) {
      throw error;
    }
    throw new PhoneNumberValidationError();
  }
}

export function isPhoneNumberValid(countryCode: string, phoneNumber: string): boolean {
  try {
    normalizePhoneInput(countryCode, phoneNumber);
    return true;
  } catch (error) {
    return false;
  }
}

function sanitizeCountryCode(value: string): string {
  if (!value) {
    return '';
  }

  const digitsOnly = value.replace(/[^0-9]/g, '');
  if (!digitsOnly) {
    return '';
  }

  const withoutInternationalPrefix = digitsOnly.replace(/^0+/, '');
  if (!withoutInternationalPrefix) {
    return '';
  }

  return `+${withoutInternationalPrefix}`;
}

function sanitizePhoneNumber(value: string): string {
  if (!value) {
    return '';
  }
  return value.replace(/[^0-9]/g, '');
}

