// Design System for RunAlert

export const colors = {
  // Primary colors
  primary: '#2563EB',    // Blue-600
  primaryDark: '#1D4ED8', // Blue-700
  primaryLight: '#3B82F6', // Blue-500
  
  // Status colors
  success: '#10B981',    // Emerald-500
  warning: '#F59E0B',    // Amber-500
  error: '#EF4444',      // Red-500
  info: '#3B82F6',       // Blue-500
  
  // Grayscale
  black: '#000000',
  gray900: '#111827',
  gray800: '#1F2937',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  white: '#FFFFFF',
};

export const typography = {
  // Font sizes (px)
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px
  base: '1rem',    // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  
  // Font weights
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const spacing = {
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  32: '8rem',      // 128px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem',   // 8px
  xl: '0.75rem',  // 12px
  '2xl': '1rem',  // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

// Message priority levels
export const messagePriority = {
  low: {
    bg: colors.gray100,
    text: colors.gray800,
    border: colors.gray300,
    icon: 'ℹ️',
  },
  normal: {
    bg: colors.white,
    text: colors.gray900,
    border: colors.gray200,
    icon: '📢',
  },
  high: {
    bg: '#FEF3C7', // Amber-50
    text: colors.gray900,
    border: '#FCD34D', // Amber-300
    icon: '⚠️',
  },
  critical: {
    bg: '#FEE2E2', // Red-50
    text: colors.gray900,
    border: colors.error,
    icon: '🚨',
  },
};

// Animation
export const transition = {
  DEFAULT: 'all 0.2s ease-in-out',
  transform: 'transform 0.2s ease-in-out',
  opacity: 'opacity 0.2s ease-in-out',
  colors: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out',
};

// Z-index values
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Export all design tokens as a single object
export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  messagePriority,
  transition,
  zIndex,
  breakpoints,
};
