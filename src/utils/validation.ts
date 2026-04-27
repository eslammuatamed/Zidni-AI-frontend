const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string): boolean => {
  if (!value) {
    return false;
  }
  return EMAIL_PATTERN.test(value.trim());
};
