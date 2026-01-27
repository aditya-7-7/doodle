/**
 * Color Palette
 * Centralized color constants extracted from RoomHeader, Toolbar, and CanvasArea
 */

// Primary colors
export const colors = {
    // Indigo/Purple (Primary brand color)
    indigo: {
        50: '#eef2ff',
        100: '#e0e7ff',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
    },

    // Green (Success, public room)
    green: {
        50: '#f0fdf4',
        500: '#22c55e',
        600: '#16a34a',
    },

    // Red (Danger, errors, leave)
    red: {
        50: '#fef2f2',
        400: '#f87171',
        500: '#ef4444',
    },

    // Gray (Neutral)
    gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
    },

    // Base
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
} as const;

// Gradients
export const gradients = {
    primaryIndigo: 'linear-gradient(135deg, #818cf8, #6366f1)',
    primaryGreen: 'linear-gradient(135deg, #22c55e, #16a34a)',
    sliderTrack: 'linear-gradient(90deg, #818cf8, #6366f1)',
    colorWheel: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
} as const;

// Semantic color names (mapped to palette)
export const semanticColors = {
    // Backgrounds
    bgPrimary: colors.white,
    bgSecondary: colors.gray[50],
    bgTertiary: colors.gray[100],

    // Text
    textPrimary: colors.gray[800],
    textSecondary: colors.gray[600],
    textTertiary: colors.gray[500],
    textMuted: colors.gray[400],

    // Borders
    borderLight: colors.gray[200],
    borderDefault: colors.gray[300],

    // Interactive states
    hoverBg: colors.gray[100],
    activeBg: colors.indigo[100],
    activeText: colors.indigo[600],

    // Status
    success: colors.green[500],
    error: colors.red[500],
    warning: '#f59e0b',
    info: colors.indigo[500],

    // Connection status
    connected: colors.green[500],
    disconnected: colors.red[500],
} as const;

export type ColorKey = keyof typeof colors;
export type GradientKey = keyof typeof gradients;
