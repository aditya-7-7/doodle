// canvas configuration constants
export const CANVAS_SIZE = 8000;
export const CANVAS_WIDTH = CANVAS_SIZE;
export const CANVAS_HEIGHT = CANVAS_SIZE;

// zoom configuration
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 5.0;
export const ZOOM_STEP = 0.2;

// pan configuration
export const PAN_DAMPING = 0.6; // 60 percent sensitivity for smoother control

// viewport estimation for initial centering when window is unavailable
export const DEFAULT_VIEWPORT_WIDTH_RATIO = 0.7; // canvas area is about 70 percent of window width
export const FALLBACK_VIEWPORT_WIDTH = 1344;
export const FALLBACK_VIEWPORT_HEIGHT = 1080;
