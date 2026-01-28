// color palette
// centralized color constants extracted from roomheader toolbar and canvasarea

// primary colors
export const colors = {
    // indigo purple primary brand color
    indigo: {
        50: '#eef2ff',
        100: '#e0e7ff',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
    },

    // green success public room
    green: {
        50: '#f0fdf4',
        500: '#22c55e',
        600: '#16a34a',
    },

    // red danger errors leave
    red: {
        50: '#fef2f2',
        400: '#f87171',
        500: '#ef4444',
    },

    // gray neutral
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

    // base
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
} as const;

// gradients
export const gradients = {
    primaryIndigo: 'linear-gradient(135deg, #818cf8, #6366f1)',
    primaryGreen: 'linear-gradient(135deg, #22c55e, #16a34a)',
    sliderTrack: 'linear-gradient(90deg, #818cf8, #6366f1)',
    colorWheel: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
} as const;

// semantic color names mapped to palette
export const semanticColors = {
    // backgrounds
    bgPrimary: colors.white,
    bgSecondary: colors.gray[50],
    bgTertiary: colors.gray[100],

    // text
    textPrimary: colors.gray[800],
    textSecondary: colors.gray[600],
    textTertiary: colors.gray[500],
    textMuted: colors.gray[400],

    // borders
    borderLight: colors.gray[200],
    borderDefault: colors.gray[300],

    // interactive states
    hoverBg: colors.gray[100],
    activeBg: colors.indigo[100],
    activeText: colors.indigo[600],

    // status
    success: colors.green[500],
    error: colors.red[500],
    warning: '#f59e0b',
    info: colors.indigo[500],

    // connection status
    connected: colors.green[500],
    disconnected: colors.red[500],
} as const;

export type ColorKey = keyof typeof colors;
export type GradientKey = keyof typeof gradients;
