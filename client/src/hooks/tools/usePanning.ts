import { useState, useCallback } from 'react';
import { PAN_DAMPING } from '../../constants';

interface UsePanningProps {
    panX: number;
    panY: number;
    setPan: (x: number, y: number) => void;
}

interface UsePanningReturn {
    isPanning: boolean;
    handlePanStart: (clientX: number, clientY: number) => void;
    handlePanMove: (clientX: number, clientY: number, isMiddleButtonPressed: boolean) => boolean;
    handlePanEnd: () => void;
}

/**
 * Hook for canvas panning with middle mouse button
 * Extracted from useCanvasDrawing for better modularity
 */
export function usePanning({ panX, panY, setPan }: UsePanningProps): UsePanningReturn {
    const [isPanning, setIsPanning] = useState(false);
    const [panStartMouse, setPanStartMouse] = useState<{ x: number; y: number } | null>(null);
    const [panStartPos, setPanStartPos] = useState<{ x: number; y: number } | null>(null);

    const handlePanStart = useCallback((clientX: number, clientY: number) => {
        setIsPanning(true);
        setPanStartMouse({ x: clientX, y: clientY });
        setPanStartPos({ x: panX, y: panY });
    }, [panX, panY]);

    const handlePanMove = useCallback((clientX: number, clientY: number, isMiddleButtonPressed: boolean): boolean => {
        if (!isPanning || !panStartMouse || !panStartPos) return false;

        // Check if middle button is still pressed
        if (!isMiddleButtonPressed) {
            setIsPanning(false);
            setPanStartMouse(null);
            setPanStartPos(null);
            return false;
        }

        const deltaX = (clientX - panStartMouse.x) * PAN_DAMPING;
        const deltaY = (clientY - panStartMouse.y) * PAN_DAMPING;
        setPan(panStartPos.x + deltaX, panStartPos.y + deltaY);
        return true;
    }, [isPanning, panStartMouse, panStartPos, setPan]);

    const handlePanEnd = useCallback(() => {
        setIsPanning(false);
        setPanStartMouse(null);
        setPanStartPos(null);
    }, []);

    return {
        isPanning,
        handlePanStart,
        handlePanMove,
        handlePanEnd,
    };
}
