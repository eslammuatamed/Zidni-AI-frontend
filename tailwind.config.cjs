/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Match Vuetify breakpoints so responsive migrations are 1:1
      // Vuetify: sm=600, md=960, lg=1280, xl=1920
      // Tailwind defaults: sm=640, md=768, lg=1024, xl=1280
      screens: {
        sm: '600px',
        md: '960px',
        lg: '1280px',
        xl: '1920px'
      },
      fontFamily: {
        sans: ['var(--sakai-font-family-base)', 'sans-serif']
      },
      colors: {
        // Namespaced as sakai-* to avoid collision with Vuetify's text-primary / text-secondary
        // Use: text-sakai-primary, bg-sakai-primary, text-sakai-primary/50, etc.
        'sakai-primary': {
          DEFAULT: 'rgb(var(--sakai-primary-rgb) / <alpha-value>)',
          50:  'var(--sakai-primary-50)',
          100: 'var(--sakai-primary-100)',
          200: 'var(--sakai-primary-200)',
          300: 'var(--sakai-primary-300)',
          400: 'var(--sakai-primary-400)',
          500: 'rgb(var(--sakai-primary-rgb) / <alpha-value>)',
          600: 'var(--sakai-primary-600)',
          700: 'var(--sakai-primary-700)',
          800: 'var(--sakai-primary-800)',
          900: 'var(--sakai-primary-900)',
          contrast: 'var(--sakai-primary-contrast)'
        },
        'sakai-secondary': {
          DEFAULT: 'rgb(var(--sakai-secondary-rgb) / <alpha-value>)',
          400: '#60a5fa',
          500: 'rgb(var(--sakai-secondary-rgb) / <alpha-value>)',
          600: '#2563eb',
          700: '#1d4ed8'
        },
        // Accent (purple) — used sparingly for emphasis chips
        'sakai-accent': {
          DEFAULT: 'rgb(var(--sakai-accent-rgb) / <alpha-value>)',
          contrast: 'var(--sakai-accent-contrast)',
          soft: 'var(--sakai-accent-soft)'
        },
        // Brand gradient stops — used in upgrade card / brand mark / banners
        'sakai-brand-deep':    'var(--sakai-brand-deep)',
        'sakai-brand-deepest': 'var(--sakai-brand-deepest)',
        success: 'rgb(var(--sakai-success-rgb) / <alpha-value>)',
        info: 'rgb(var(--sakai-info-rgb) / <alpha-value>)',
        warning: 'rgb(var(--sakai-warning-rgb) / <alpha-value>)',
        danger: 'rgb(var(--sakai-danger-rgb) / <alpha-value>)',
        // Soft state surfaces (flat, Figma-derived; distinct from color-mix *-surface tokens)
        'success-soft': 'var(--sakai-success-soft)',
        'info-soft':    'var(--sakai-info-soft)',
        'warning-soft': 'var(--sakai-warning-soft)',
        'danger-soft':  'var(--sakai-danger-soft)',
        // Surface tokens — used as bg-surface, bg-surface-card etc.
        surface: {
          DEFAULT: 'var(--sakai-surface)',
          page:    'var(--sakai-surface-page)',
          alt:     'var(--sakai-surface-alt)',
          card:    'var(--sakai-surface-card)',
          section: 'var(--sakai-surface-section)',
          muted:   'var(--sakai-surface-muted)'
        },
        // Foreground/text tokens
        content: {
          DEFAULT:   'rgb(var(--sakai-text-color-rgb) / <alpha-value>)',
          strong:    'var(--sakai-text-color-strong)',
          secondary: 'var(--sakai-text-color-secondary)',
          tertiary:  'var(--sakai-text-color-tertiary)',
          muted:     'var(--sakai-text-color-muted)',
          inverse:   'var(--sakai-text-color-inverse)'
        },
        // KPI delta semantics + decorative dots
        'delta-up':   'var(--sakai-delta-up)',
        'delta-down': 'var(--sakai-delta-down)',
        'dot-red':    'var(--sakai-dot-red)',
        'dot-blue':   'var(--sakai-dot-blue)',
        // Border token
        border: 'var(--sakai-border-color)'
      },
      // Namespaced to avoid overriding Tailwind defaults (rounded-lg, shadow-md
      // differ in value and are used in landing pages with Tailwind intent)
      borderRadius: {
        'sakai-sm': 'var(--sakai-border-radius-sm)',
        'sakai-md': 'var(--sakai-border-radius-md)',
        'sakai-lg': 'var(--sakai-border-radius-lg)',
        'sakai-xl': 'var(--sakai-border-radius-xl)',
        pill: 'var(--sakai-border-radius-pill)'
      },
      boxShadow: {
        'sakai-sm': 'var(--sakai-shadow-sm)',
        'sakai-md': 'var(--sakai-shadow-md)',
        'sakai-lg': 'var(--sakai-shadow-lg)',
        'sakai-focus': 'var(--sakai-shadow-focus)'
      },
      // Gradient backgrounds — surface-hero is also a gradient, excluded from colors
      backgroundImage: {
        'gradient-primary': 'var(--sakai-gradient-primary)',
        'gradient-secondary': 'var(--sakai-gradient-secondary)',
        'gradient-success': 'var(--sakai-gradient-success)',
        'gradient-info': 'var(--sakai-gradient-info)',
        'gradient-warning': 'var(--sakai-gradient-warning)',
        'gradient-danger': 'var(--sakai-gradient-danger)',
        'gradient-brand':      'var(--sakai-gradient-brand)',
        'gradient-brand-soft': 'var(--sakai-gradient-brand-soft)',
        'surface-hero': 'var(--sakai-surface-hero)'
      }
    }
  },
  corePlugins: {
    preflight: false
  },
  plugins: []
};
