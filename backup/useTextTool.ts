import { useState, useCallback } from 'react';
import { canvasService, socketService } from '../../services';
import { SocketEvents, COLORS } from '../../types';

interface UseTextToolReturn {
    textPosition: { x: number; y: number } | null;
    textInput: string;
    fontSize: number;
    setTextPosition: (pos: { x: number; y: number } | null) => void;
    setTextInput: (text: string) => void;
    setFontSize: (size: number) => void;
    handleTextSubmit: (strokeColor: string) => void;
}

/**
 * Hook for text tool state and submission
 * Extracted from useCanvasDrawing for better modularity
 */
export function useTextTool(): UseTextToolReturn {
    const [textPosition, setTextPositionState] = useState<{ x: number; y: number } | null>(null);
    const [textInput, setTextInputState] = useState('');
    const [fontSize, setFontSizeState] = useState(24);

    const setTextPosition = useCallback((pos: { x: number; y: number } | null) => setTextPositionState(pos), []);
    const setTextInput = useCallback((text: string) => setTextInputState(text), []);
    const setFontSize = useCallback((size: number) => setFontSizeState(size), []);

    const handleTextSubmit = useCallback((strokeColor: string) => {
        if (!textPosition || !textInput.trim()) return;

        // Get actual text width using canvas measurement
        const canvas = canvasService.getCanvas();
        const ctx = canvasService.getContext();
        let textWidthNorm = 0;

        if (ctx && canvas) {
            const scaleFactor = canvas.width / canvas.offsetWidth;
            const scaledFontSize = fontSize * scaleFactor;
            ctx.font = `${scaledFontSize}px Inter, sans-serif`;
            const textWidthPx = ctx.measureText(textInput).width;
            textWidthNorm = textWidthPx / canvas.width;
        } else {
            // Fallback estimation
            textWidthNorm = (textInput.length * fontSize * 0.6) / 1920;
        }

        const textHeightNorm = fontSize / 1080;
        const halfWidth = textWidthNorm / 2;
        const padding = 0.02;

        let x = textPosition.x;
        let y = textPosition.y;

        // Smart horizontal positioning
        const leftThreshold = padding + halfWidth;
        const rightThreshold = 1 - padding - halfWidth;

        if (textPosition.x < leftThreshold) {
            x = Math.max(padding, textPosition.x);
        } else if (textPosition.x > rightThreshold) {
            x = Math.min(1 - padding - textWidthNorm, textPosition.x - textWidthNorm);
        } else {
            x = textPosition.x - halfWidth;
        }

        // Clamp Y position
        if (y < textHeightNorm + padding) {
            y = textHeightNorm + padding;
        }
        if (y > 1 - padding) {
            y = 1 - padding;
        }

        const colorIndex = COLORS.indexOf(strokeColor);
        canvasService.drawText(textInput, x, y, fontSize, strokeColor);

        socketService.emit(SocketEvents.DRAW_TEXT, {
            text: textInput,
            x,
            y,
            fontSize,
            colorIndex,
            color: strokeColor,
        });

        setTextInput('');
        setTextPosition(null);
    }, [textInput, textPosition, fontSize, setTextInput, setTextPosition]);

    return {
        textPosition,
        textInput,
        fontSize,
        setTextPosition,
        setTextInput,
        setFontSize,
        handleTextSubmit,
    };
}
