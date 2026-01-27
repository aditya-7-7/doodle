/**
 * Canvas Coordinate Transform Utilities
 * Centralized functions for converting between screen and canvas coordinates
 * 
 * These are pure functions that can be used anywhere coordinate transforms are needed.
 */

interface ViewportState {
    zoom: number;
    panX: number;
    panY: number;
}

interface Point {
    x: number;
    y: number;
}

/**
 * Convert screen coordinates to canvas coordinates
 * Takes into account zoom and pan offsets
 * 
 * @param screenX - X position relative to canvas element
 * @param screenY - Y position relative to canvas element  
 * @param viewport - Current zoom and pan state
 * @returns Canvas coordinates { x, y }
 */
export function screenToCanvas(screenX: number, screenY: number, viewport: ViewportState): Point {
    const { zoom, panX, panY } = viewport;
    return {
        x: (screenX - panX) / zoom,
        y: (screenY - panY) / zoom,
    };
}

/**
 * Convert canvas coordinates to screen coordinates
 * Takes into account zoom and pan offsets
 * 
 * @param canvasX - X position in canvas space
 * @param canvasY - Y position in canvas space
 * @param viewport - Current zoom and pan state
 * @returns Screen coordinates { x, y }
 */
export function canvasToScreen(canvasX: number, canvasY: number, viewport: ViewportState): Point {
    const { zoom, panX, panY } = viewport;
    return {
        x: canvasX * zoom + panX,
        y: canvasY * zoom + panY,
    };
}

/**
 * Get mouse position relative to canvas element from a mouse event
 * 
 * @param event - Mouse event
 * @param canvasRect - Canvas bounding rect
 * @returns Screen coordinates relative to canvas { x, y }
 */
export function getMousePosition(event: MouseEvent | React.MouseEvent, canvasRect: DOMRect): Point {
    return {
        x: event.clientX - canvasRect.left,
        y: event.clientY - canvasRect.top,
    };
}

/**
 * Calculate new pan position to keep a point stable during zoom
 * 
 * @param focusPoint - The point that should remain stable (screen coords)
 * @param currentPan - Current pan offset { x, y }
 * @param oldZoom - Previous zoom level
 * @param newZoom - New zoom level
 * @returns New pan offset { x, y }
 */
export function calculateZoomPan(
    focusPoint: Point,
    currentPan: Point,
    oldZoom: number,
    newZoom: number
): Point {
    const scaleFactor = newZoom / oldZoom;
    return {
        x: focusPoint.x - (focusPoint.x - currentPan.x) * scaleFactor,
        y: focusPoint.y - (focusPoint.y - currentPan.y) * scaleFactor,
    };
}

/**
 * Clamp zoom value to min/max bounds
 * 
 * @param zoom - Proposed zoom value
 * @param min - Minimum zoom (default 0.1)
 * @param max - Maximum zoom (default 5)
 * @returns Clamped zoom value
 */
export function clampZoom(zoom: number, min = 0.1, max = 5): number {
    return Math.min(max, Math.max(min, zoom));
}

/**
 * Get the center point of a container element
 * 
 * @param container - Container element
 * @returns Center point { x, y }
 */
export function getContainerCenter(container: HTMLElement): Point {
    const rect = container.getBoundingClientRect();
    return {
        x: rect.width / 2,
        y: rect.height / 2,
    };
}
