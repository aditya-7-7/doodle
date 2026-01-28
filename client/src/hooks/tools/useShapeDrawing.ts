import { useCallback, RefObject } from 'react';
import { canvasService } from '../../services';
import { ShapeType } from '../../types';

interface UseShapeDrawingProps {
    overlayCanvasRef: RefObject<HTMLCanvasElement>;
    strokeColor: string;
    strokeWidth: number;
    currentShape: ShapeType;
}

interface UseShapeDrawingReturn {
    clearOverlay: () => void;
    drawShapePreview: (startX: number, startY: number, endX: number, endY: number) => void;
    drawLinePreview: (startX: number, startY: number, endX: number, endY: number) => void;
}

// hook for shape and line drawing previews on overlay canvas
// extracted from useCanvasDrawing for better modularity
export function useShapeDrawing({
    overlayCanvasRef,
    strokeColor,
    strokeWidth,
    currentShape,
}: UseShapeDrawingProps): UseShapeDrawingReturn {

    const clearOverlay = useCallback(() => {
        overlayCanvasRef.current?.getContext('2d')?.clearRect(
            0, 0,
            overlayCanvasRef.current.width,
            overlayCanvasRef.current.height
        );
    }, [overlayCanvasRef]);

    const drawShapePreview = useCallback((startX: number, startY: number, endX: number, endY: number) => {
        if (!overlayCanvasRef.current) return;
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (!ctx) return;

        clearOverlay();

        const sX = startX * overlayCanvasRef.current.width;
        const sY = startY * overlayCanvasRef.current.height;
        const eX = endX * overlayCanvasRef.current.width;
        const eY = endY * overlayCanvasRef.current.height;

        const scaledWidth = strokeWidth * canvasService.getScaleFactor();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = scaledWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        switch (currentShape) {
            case 'rect':
                ctx.strokeRect(sX, sY, eX - sX, eY - sY);
                break;
            case 'circle': {
                const radius = Math.sqrt(Math.pow(eX - sX, 2) + Math.pow(eY - sY, 2));
                ctx.arc(sX, sY, radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }
            case 'triangle': {
                const midX = (sX + eX) / 2;
                ctx.moveTo(midX, sY);
                ctx.lineTo(eX, eY);
                ctx.lineTo(sX, eY);
                ctx.closePath();
                ctx.stroke();
                break;
            }
            case 'diamond': {
                const centerX = (sX + eX) / 2;
                const centerY = (sY + eY) / 2;
                ctx.moveTo(centerX, sY);
                ctx.lineTo(eX, centerY);
                ctx.lineTo(centerX, eY);
                ctx.lineTo(sX, centerY);
                ctx.closePath();
                ctx.stroke();
                break;
            }
        }
    }, [clearOverlay, strokeColor, strokeWidth, currentShape, overlayCanvasRef]);

    const drawLinePreview = useCallback((startX: number, startY: number, endX: number, endY: number) => {
        if (!overlayCanvasRef.current) return;
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (!ctx) return;

        clearOverlay();

        const sX = startX * overlayCanvasRef.current.width;
        const sY = startY * overlayCanvasRef.current.height;
        const eX = endX * overlayCanvasRef.current.width;
        const eY = endY * overlayCanvasRef.current.height;

        const scaledWidth = strokeWidth * canvasService.getScaleFactor();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = scaledWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sX, sY);
        ctx.lineTo(eX, eY);
        ctx.stroke();
    }, [clearOverlay, strokeColor, strokeWidth, overlayCanvasRef]);

    return {
        clearOverlay,
        drawShapePreview,
        drawLinePreview,
    };
}
