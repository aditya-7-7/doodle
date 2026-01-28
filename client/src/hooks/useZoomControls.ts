import { useCallback } from 'react';
import { calculateZoomPan, clampZoom, getContainerCenter } from '../utils/coordinateTransform';

interface UseZoomControlsProps {
    zoom: number;
    panX: number;
    panY: number;
    containerRef: React.RefObject<HTMLElement>;
    setZoom: (zoom: number) => void;
    setPan: (panX: number, panY: number) => void;
    zoomMin?: number;
    zoomMax?: number;
    zoomStep?: number;
}

interface UseZoomControlsReturn {
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleResetView: () => void;
    handleWheelZoom: (deltaY: number, clientX: number, clientY: number) => void;
}

// reusable hook for zoom and pan controls
// extracts zoom logic for use in zoomcontrols and other components
export function useZoomControls({
    zoom,
    panX,
    panY,
    containerRef,
    setZoom,
    setPan,
    zoomMin = 0.1,
    zoomMax = 5,
    zoomStep = 0.25,
}: UseZoomControlsProps): UseZoomControlsReturn {

    const handleZoomIn = useCallback(() => {
        if (!containerRef.current) return;

        const newZoom = clampZoom(zoom + zoomStep, zoomMin, zoomMax);
        const center = getContainerCenter(containerRef.current);
        const newPan = calculateZoomPan(center, { x: panX, y: panY }, zoom, newZoom);

        setZoom(newZoom);
        setPan(newPan.x, newPan.y);
    }, [zoom, panX, panY, containerRef, setZoom, setPan, zoomMin, zoomMax, zoomStep]);

    const handleZoomOut = useCallback(() => {
        if (!containerRef.current) return;

        const newZoom = clampZoom(zoom - zoomStep, zoomMin, zoomMax);
        const center = getContainerCenter(containerRef.current);
        const newPan = calculateZoomPan(center, { x: panX, y: panY }, zoom, newZoom);

        setZoom(newZoom);
        setPan(newPan.x, newPan.y);
    }, [zoom, panX, panY, containerRef, setZoom, setPan, zoomMin, zoomMax, zoomStep]);

    const handleResetView = useCallback(() => {
        setZoom(1);
        setPan(0, 0);
    }, [setZoom, setPan]);

    const handleWheelZoom = useCallback((deltaY: number, clientX: number, clientY: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const focusPoint = {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };

        // zoom in for negative delta scroll up zoom out for positive
        const zoomDelta = deltaY < 0 ? zoomStep : -zoomStep;
        const newZoom = clampZoom(zoom + zoomDelta, zoomMin, zoomMax);

        if (newZoom !== zoom) {
            const newPan = calculateZoomPan(focusPoint, { x: panX, y: panY }, zoom, newZoom);
            setZoom(newZoom);
            setPan(newPan.x, newPan.y);
        }
    }, [zoom, panX, panY, containerRef, setZoom, setPan, zoomMin, zoomMax, zoomStep]);

    return {
        handleZoomIn,
        handleZoomOut,
        handleResetView,
        handleWheelZoom,
    };
}
