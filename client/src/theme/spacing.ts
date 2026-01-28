// spacing and sizing constants
// centralized dimension values extracted from components

// spacing scale based on 4px grid
export const spacing = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
} as const;

// border radius
export const radius = {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    full: 9999,
} as const;

// component sizes
export const sizes = {
    // toolbar
    toolButton: 30,
    toolButtonRadius: 6,
    colorButton: 22,
    sidebar: 48,

    // icons
    iconSm: 12,
    iconMd: 16,
    iconLg: 20,
    iconXl: 24,

    // inputs
    inputHeight: 40,
    buttonHeight: 40,

    // popovers
    popoverMinWidth: 200,
    popoverPadding: 16,

    // logo
    logoHeight: 48,

    // zoom controls
    zoomButton: 40,
} as const;

// z index scale
export const zIndex = {
    base: 0,
    dropdown: 10,
    overlay: 40,
    modal: 50,
    popover: 50,
    tooltip: 60,
} as const;

// typography
export const fontSize = {
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 24,
} as const;

export const fontWeight = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
} as const;

// timing
export const timing = {
    fast: 150,
    normal: 200,
    slow: 300,
    copyFeedback: 2000,
} as const;

// shadow
export const shadow = {
    sm: '0 1px 3px rgba(0,0,0,0.15)',
    md: '0 2px 8px rgba(0,0,0,0.15)',
    lg: '0 10px 25px rgba(0,0,0,0.15)',
    xl: '0 10px 40px rgba(0,0,0,0.15)',

    // color specific shadows
    indigo: '0 2px 8px rgba(99, 102, 241, 0.3)',
    indigoHover: '0 4px 12px rgba(99, 102, 241, 0.4)',
    green: '0 2px 8px rgba(34, 197, 94, 0.3)',
    greenHover: '0 4px 12px rgba(34, 197, 94, 0.4)',
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
