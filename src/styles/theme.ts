/**
 * Centralized Design System for GrokiPedia
 * Ensures consistent theming across all components
 */

export const theme = {
  colors: {
    // Background colors
    bg: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      tertiary: '#2a2a2a',
      hover: '#3a3a3a',
    },
    // Text colors
    text: {
      primary: '#e5e5e5',
      secondary: '#888',
      tertiary: '#666',
      disabled: '#444',
    },
    // Border colors
    border: {
      default: '#1a1a1a',
      light: '#2a2a2a',
      medium: '#3a3a3a',
    },
    // Accent colors
    accent: {
      blue: '#3b82f6',
      blueLight: '#60a5fa',
      blueDark: '#2563eb',
      green: '#10b981',
      greenLight: '#34d399',
      red: '#ef4444',
      redLight: '#f87171',
      yellow: '#f59e0b',
      yellowLight: '#fbbf24',
      purple: '#8b5cf6',
      orange: '#f97316',
      pink: '#ec4899',
    },
    // Source type colors
    sourceType: {
      academic: { text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      government: { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
      news: { text: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
      ngo: { text: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
      blog: { text: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' },
      social: { text: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
      other: { text: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' },
    },
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      serif: '"Playfair Display", Georgia, serif',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
} as const;

// Helper function to get color classes
export const getColorClasses = (type: keyof typeof theme.colors.sourceType) => {
  const colors = theme.colors.sourceType[type];
  return {
    text: colors.text,
    bg: colors.bg,
    className: `text-[${colors.text}] bg-[${colors.bg}]`,
  };
};

