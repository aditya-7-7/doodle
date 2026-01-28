import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CANVAS_SIZE, DEFAULT_VIEWPORT_WIDTH_RATIO, FALLBACK_VIEWPORT_WIDTH, FALLBACK_VIEWPORT_HEIGHT } from '../constants';

interface ViewportContextValue {
    zoom: number;
    panX: number;
    panY: number;
    setZoom: (zoom: number) => void;
    setPan: (panX: number, panY: number) => void;
    resetView: () => void;
}

const ViewportContext = createContext<ViewportContextValue | null>(null);

export function ViewportProvider({ children }: { children: ReactNode }) {
    // center the canvas in the viewport
    // for canvas center to appear at viewport center
    // panx equals viewportwidth divided by 2 minus canvascenter
    const CANVAS_CENTER = CANVAS_SIZE / 2;

    // calculate initial pan based on window size
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth * DEFAULT_VIEWPORT_WIDTH_RATIO : FALLBACK_VIEWPORT_WIDTH;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : FALLBACK_VIEWPORT_HEIGHT;

    const INITIAL_PAN_X = (viewportWidth / 2) - CANVAS_CENTER;
    const INITIAL_PAN_Y = (viewportHeight / 2) - CANVAS_CENTER;

    const [zoom, setZoom] = useState(1);
    const [panX, setPanXState] = useState(INITIAL_PAN_X);
    const [panY, setPanYState] = useState(INITIAL_PAN_Y);

    const setPan = useCallback((x: number, y: number) => {
        setPanXState(x);
        setPanYState(y);
    }, []);

    const resetView = useCallback(() => {
        // recalculate center based on current window size
        const CANVAS_CENTER = CANVAS_SIZE / 2;
        const currentViewportWidth = typeof window !== 'undefined' ? window.innerWidth * DEFAULT_VIEWPORT_WIDTH_RATIO : FALLBACK_VIEWPORT_WIDTH;
        const currentViewportHeight = typeof window !== 'undefined' ? window.innerHeight : FALLBACK_VIEWPORT_HEIGHT;

        const centerPanX = (currentViewportWidth / 2) - CANVAS_CENTER;
        const centerPanY = (currentViewportHeight / 2) - CANVAS_CENTER;

        setZoom(1);
        setPan(centerPanX, centerPanY);
    }, [setPan]);

    return (
        <ViewportContext.Provider value={{ zoom, panX, panY, setZoom, setPan, resetView }}>
            {children}
        </ViewportContext.Provider>
    );
}

export function useViewport() {
    const context = useContext(ViewportContext);
    if (!context) {
        throw new Error('useViewport must be used within ViewportProvider');
    }
    return context;
}
