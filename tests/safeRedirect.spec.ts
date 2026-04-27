import { describe, expect, it } from 'vitest';
import { safeRedirect } from '@/lib/safeRedirect';

describe('safeRedirect', () => {
  it('returns fallback for empty values', () => {
    expect(safeRedirect('', '/teacher/home')).toBe('/teacher/home');
  });

  it('blocks external urls', () => {
    expect(safeRedirect('http://evil.com', '/teacher/home')).toBe('/teacher/home');
  });

  it('rejects login loops', () => {
    expect(safeRedirect('/teacher/login?x=1', '/teacher/home')).toBe('/teacher/home');
  });

  it('keeps valid internal paths', () => {
    expect(safeRedirect('/teacher/home', '/teacher/dashboard')).toBe('/teacher/home');
  });
});
