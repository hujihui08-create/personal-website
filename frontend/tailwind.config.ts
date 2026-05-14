import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-bg)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-bg)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-bg)',
        },
        background: {
          DEFAULT: 'var(--color-bg)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
        },
        border: {
          light: 'var(--color-border-light)',
          medium: 'var(--color-border-medium)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      spacing: {
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        'card-hero': 'var(--shadow-card-hero)',
        'card-hover': 'var(--shadow-card-hover)',
        'card-strong': 'var(--shadow-card-strong)',
        'focus-ring': 'var(--shadow-focus-ring)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        standard: 'var(--easing-standard)',
      },
      zIndex: {
        base: 'var(--z-base)',
        nav: 'var(--z-nav)',
        dropdown: 'var(--z-dropdown)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
      },
    },
  },
  plugins: [],
} satisfies Config
