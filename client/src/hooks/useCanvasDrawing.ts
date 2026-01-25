import { useCallback, useRef, useState } from 'react';
import { socketService, canvasService } from '../services';
import { useCanvasStore, useUserStore } from '../stores';
import { SocketEvents, COLORS } from '../types';

interface UseCanvasDrawingReturn {
    canvasRef: (node: HTMLCanvasElement | null) => void;  // Callback ref
    overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
    containerRef: React.RefObject<HTMLDivElement>;
    handlePointerDown: (e: React.PointerEvent) => void;
    handlePointerMove: (e: React.PointerEvent) => void;
    handlePointerUp: (e: React.PointerEvent) => void;
    textPosition: { x: number; y: number } | null;
    setTextPosition: (pos: { x: number; y: number } | null) => void;
    textInput: string;
    setTextInput: (text: string) => void;
    handleTextSubmit: () => void;
    fillColor: string | null;
    setFillColor: (color: string | null) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
}

export function useCanvasDrawing(): UseCanvasDrawingReturn {
    // Callback ref - called when canvas element mounts/unmounts
    const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
        if (node) {
            canvasService.setCanvas(node);
            canvasService.clear();
        }
    }, []);

    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
    const strokePointsRef = useRef<number[][]>([]);

    const { currentTool, currentShape, strokeColor, strokeWidth, setIsDrawing, isDrawing } = useCanvasStore();
    const { color } = useUserStore();

    // Local state for text and shapes
    const [textPosition, setTextPositionState] = useState<{ x: number; y: number } | null>(null);
    const [textInput, setTextInputState] = useState('');
    const [fillColor, setFillColorState] = useState<string | null>(null);
    const [fontSize, setFontSizeState] = useState(24);

    const setTextPosition = useCallback((pos: { x: number; y: number } | null) => setTextPositionState(pos), []);
    const setTextInput = useCallback((text: string) => setTextInputState(text), []);
    const setFillColor = useCallback((c: string | null) => setFillColorState(c), []);
    const setFontSize = useCallback((size: number) => setFontSizeState(size), []);

    const clearOverlay = useCallback(() => {
        overlayCanvasRef.current?.getContext('2d')?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }, []);

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

        if (currentShape === 'rect') {
            ctx.strokeRect(sX, sY, eX - sX, eY - sY);
        } else if (currentShape === 'circle') {
            const radius = Math.sqrt(Math.pow(eX - sX, 2) + Math.pow(eY - sY, 2));
            ctx.arc(sX, sY, radius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (currentShape === 'triangle') {
            const midX = (sX + eX) / 2;
            ctx.moveTo(midX, sY);
            ctx.lineTo(eX, eY);
            ctx.lineTo(sX, eY);
            ctx.closePath();
            ctx.stroke();
        } else if (currentShape === 'diamond') {
            const centerX = (sX + eX) / 2;
            const centerY = (sY + eY) / 2;
            ctx.moveTo(centerX, sY);
            ctx.lineTo(eX, centerY);
            ctx.lineTo(centerX, eY);
            ctx.lineTo(sX, centerY);
            ctx.closePath();
            ctx.stroke();
        }
    }, [clearOverlay, strokeColor, strokeWidth, currentShape]);

    // Draw line preview on overlay canvas
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
    }, [clearOverlay, strokeColor, strokeWidth]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        const point = canvasService.normalizePoint(e.clientX, e.clientY);

        if (currentTool === 'text') {
            setTextPosition(point);
            return;
        }

        if (currentTool === 'shapes' || currentTool === 'line') {
            shapeStartRef.current = point;
            setIsDrawing(true);
            return;
        }

        if (currentTool !== 'brush' && currentTool !== 'eraser') return;

        setIsDrawing(true);
        lastPointRef.current = point;
        strokePointsRef.current = [[point.x, point.y]];
    }, [currentTool, setIsDrawing, setTextPosition]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        const point = canvasService.normalizePoint(e.clientX, e.clientY);

        socketService.emit(SocketEvents.CURSOR_MOVE, { x: point.x, y: point.y, color });

        if ((currentTool === 'shapes' || currentTool === 'line') && isDrawing && shapeStartRef.current) {
            // For line tool, draw a line preview; for shapes, draw shape preview
            if (currentTool === 'line') {
                drawLinePreview(shapeStartRef.current.x, shapeStartRef.current.y, point.x, point.y);
            } else {
                drawShapePreview(shapeStartRef.current.x, shapeStartRef.current.y, point.x, point.y);
            }
            return;
        }

        if (!isDrawing || !lastPointRef.current) return;

        const colorIndex = COLORS.indexOf(strokeColor);

        if (currentTool === 'brush') {
            canvasService.drawLine(lastPointRef.current.x, lastPointRef.current.y, point.x, point.y, strokeColor, strokeWidth);
            canvasService.sendDrawCommand([0, lastPointRef.current.x, lastPointRef.current.y, point.x, point.y, colorIndex, strokeWidth]);
            strokePointsRef.current.push([point.x, point.y]);
        } else if (currentTool === 'eraser') {
            canvasService.erase(point.x, point.y, strokeWidth * 3);
            canvasService.sendDrawCommand([1, point.x, point.y, strokeWidth * 3]);
            strokePointsRef.current.push([point.x, point.y]);
        }

        lastPointRef.current = point;
    }, [isDrawing, currentTool, strokeColor, strokeWidth, color, drawShapePreview, drawLinePreview]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        const point = canvasService.normalizePoint(e.clientX, e.clientY);

        // Handle line tool
        if (currentTool === 'line' && shapeStartRef.current) {
            clearOverlay();
            const colorIndex = COLORS.indexOf(strokeColor);

            canvasService.drawShape('line', shapeStartRef.current.x, shapeStartRef.current.y, point.x, point.y, strokeColor, strokeWidth);

            socketService.emit(SocketEvents.DRAW_SHAPE, {
                shapeType: 'line',
                startX: shapeStartRef.current.x,
                startY: shapeStartRef.current.y,
                endX: point.x,
                endY: point.y,
                colorIndex,
                width: strokeWidth,
                fillColorIndex: -1,
            });

            shapeStartRef.current = null;
            setIsDrawing(false);
            return;
        }

        if (currentTool === 'shapes' && shapeStartRef.current) {
            clearOverlay();
            const colorIndex = COLORS.indexOf(strokeColor);
            const fillColorIndex = fillColor ? COLORS.indexOf(fillColor) : -1;

            canvasService.drawShape(currentShape, shapeStartRef.current.x, shapeStartRef.current.y, point.x, point.y, strokeColor, strokeWidth, fillColor || undefined);

            socketService.emit(SocketEvents.DRAW_SHAPE, {
                shapeType: currentShape,
                startX: shapeStartRef.current.x,
                startY: shapeStartRef.current.y,
                endX: point.x,
                endY: point.y,
                colorIndex,
                width: strokeWidth,
                fillColorIndex,
            });

            shapeStartRef.current = null;
            setIsDrawing(false);
            return;
        }

        if (strokePointsRef.current.length > 1) {
            const colorIndex = COLORS.indexOf(strokeColor);
            socketService.emit('draw:stroke-end', {
                points: strokePointsRef.current,
                colorIndex,
                width: strokeWidth,
                tool: currentTool,
            });
        }

        setIsDrawing(false);
        lastPointRef.current = null;
        strokePointsRef.current = [];
    }, [setIsDrawing, strokeColor, strokeWidth, currentTool, currentShape, clearOverlay, fillColor]);

    const handleTextSubmit = useCallback(() => {
        if (!textPosition || !textInput.trim()) return;

        const colorIndex = COLORS.indexOf(strokeColor);
        canvasService.drawText(textInput, textPosition.x, textPosition.y, fontSize, strokeColor);

        socketService.emit(SocketEvents.DRAW_TEXT, {
            text: textInput,
            x: textPosition.x,
            y: textPosition.y,
            fontSize: fontSize,
            colorIndex,
        });

        setTextInput('');
        setTextPosition(null);
    }, [strokeColor, textInput, textPosition, fontSize, setTextInput, setTextPosition]);

    return {
        canvasRef, overlayCanvasRef, containerRef,
        handlePointerDown, handlePointerMove, handlePointerUp,
        textPosition, setTextPosition, textInput, setTextInput, handleTextSubmit,
        fillColor, setFillColor, fontSize, setFontSize,
    };
}
