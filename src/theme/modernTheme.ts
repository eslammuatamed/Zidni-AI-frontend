/*
 * UNUSED THEME — not registered in src/plugins/vuetify.ts as of the
 * `redesign` branch. This file exports a Vuetify theme variant with an
 * Indigo + Slate palette that is intentionally different from the active
 * `mathGuru` / `mathGuruDark` themes (deep blue brand).
 *
 * If a future task activates this theme, migrate its colors to the
 * --sakai-* design tokens in src/theme/sakai/tokens.scss before
 * registering it. Do not consume this file's raw hex values directly.
 */
import type { ThemeDefinition } from 'vuetify'

export const modernTheme: ThemeDefinition = {
    dark: false,
    colors: {
        background: '#F8F9FA', // Very light grey background
        surface: '#FFFFFF',
        primary: '#4F46E5', // Indigo 600 - Modern look
        'primary-darken-1': '#4338CA',
        secondary: '#64748B', // Slate 500
        error: '#EF4444',
        info: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        'on-background': '#0F172A',
        'on-surface': '#1E293B',
        // Custom neutrals if needed
        'surface-variant': '#F1F5F9',
        'on-surface-variant': '#64748B',
    },
    variables: {
        'border-color': '#E2E8F0',
        'border-opacity': 1,
        'high-emphasis-opacity': 0.87,
        'medium-emphasis-opacity': 0.60,
        'disabled-opacity': 0.38,
        'idle-opacity': 0.04,
        'hover-opacity': 0.04,
        'focus-opacity': 0.12,
        'selected-opacity': 0.08,
        'activated-opacity': 0.12,
        'pressed-opacity': 0.12,
        'dragged-opacity': 0.08,
        'theme-kbd': '#212529',
        'theme-on-kbd': '#FFFFFF',
        'theme-code': '#F5F5F5',
        'theme-on-code': '#000000',
    }
}

export const modernDarkTheme: ThemeDefinition = {
    dark: true,
    colors: {
        background: '#0F172A', // Slate 900
        surface: '#1E293B', // Slate 800
        primary: '#6366F1', // Indigo 500
        'primary-darken-1': '#4F46E5',
        secondary: '#94A3B8', // Slate 400
        error: '#F87171',
        info: '#60A5FA',
        success: '#34D399',
        warning: '#FBBF24',
        'on-background': '#F8FAFC',
        'on-surface': '#F1F5F9',
        'surface-variant': '#334155',
        'on-surface-variant': '#94A3B8',
    },
    variables: {
        'border-color': '#334155',
        'border-opacity': 1,
    }
}
