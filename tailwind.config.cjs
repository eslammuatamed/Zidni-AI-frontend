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
          300: '#a5b4fc',
          400: '#818cf8',
          500: 'rgb(var(--sakai-primary-rgb) / <alpha-value>)',
          600: '#4f46e5',
          700: '#4338ca',
          contrast: 'var(--sakai-primary-contrast)'
        },
        'sakai-secondary': {
          DEFAULT: 'rgb(var(--sakai-secondary-rgb) / <alpha-value>)',
          400: '#22d3ee',
          500: 'rgb(var(--sakai-secondary-rgb) / <alpha-value>)',
          600: '#0891b2',
          700: '#0e7490'
        },
        success: 'rgb(var(--sakai-success-rgb) / <alpha-value>)',
        info: 'rgb(var(--sakai-info-rgb) / <alpha-value>)',
        warning: 'rgb(var(--sakai-warning-rgb) / <alpha-value>)',
        danger: 'rgb(var(--sakai-danger-rgb) / <alpha-value>)',
        // Surface tokens — used as bg-surface, bg-surface-card etc.
        surface: {
          DEFAULT: 'var(--sakai-surface)',
          alt: 'var(--sakai-surface-alt)',
          card: 'var(--sakai-surface-card)',
          section: 'var(--sakai-surface-section)'
        },
        // Foreground/text tokens
        content: {
          DEFAULT: 'rgb(var(--sakai-text-color-rgb) / <alpha-value>)',
          secondary: 'var(--sakai-text-color-secondary)',
          tertiary: 'var(--sakai-text-color-tertiary)',
          muted: 'var(--sakai-text-color-muted)',
          inverse: 'var(--sakai-text-color-inverse)'
        },
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
        'surface-hero': 'var(--sakai-surface-hero)'
      }
    }
  },
  corePlugins: {
    preflight: false
  },
  plugins: []
};
