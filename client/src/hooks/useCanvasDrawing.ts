import { useCallback, useRef, useState } from 'react';
import { socketService, canvasService } from '../services';
import { useCanvasStore, useUserStore } from '../stores';
import { useViewport } from '../contexts';
import { SocketEvents, COLORS } from '../types';
import { useShapeDrawing } from './tools/useShapeDrawing';
import { usePanning } from './tools/usePanning';

interface UseCanvasDrawingReturn {
    canvasRef: (node: HTMLCanvasElement | null) => void;
    overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
    containerRef: React.RefObject<HTMLDivElement>;
    handlePointerDown: (e: React.PointerEvent) => void;
    handlePointerMove: (e: React.PointerEvent) => void;
    handlePointerUp: (e: React.PointerEvent) => void;
    handleWheel: (e: React.WheelEvent) => void;
    textPosition: { x: number; y: number } | null;
    setTextPosition: (pos: { x: number; y: number } | null) => void;
    textInput: string;
    setTextInput: (text: string) => void;
    handleTextSubmit: () => void;
    fillColor: string | null;
    setFillColor: (color: string | null) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    isPanning: boolean;
}

export function useCanvasDrawing(): UseCanvasDrawingReturn {
    const canvasNodeRef = useRef<HTMLCanvasElement | null>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
    const strokePointsRef = useRef<number[][]>([]);

    // refs for touch based panning
    const touchHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
    const isTouchPanningRef = useRef(false);

    // callback ref for canvas element
    const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
        canvasNodeRef.current = node;
        if (node) {
            canvasService.setCanvas(node);
            canvasService.clear();
        }
    }, []);

    // get stuff from stores
    const { currentTool, currentShape, strokeColor, strokeWidth, setIsDrawing, isDrawing } = useCanvasStore();
    const { color } = useUserStore();
    const { zoom, panX, panY, setPan } = useViewport();

    // local state for text tool and fill color
    const [textPosition, setTextPositionState] = useState<{ x: number; y: number } | null>(null);
    const [textInput, setTextInputState] = useState('');
    const [fillColor, setFillColorState] = useState<string | null>(null);
    const [fontSize, setFontSizeState] = useState(24);

    const setTextPosition = useCallback((pos: { x: number; y: number } | null) => setTextPositionState(pos), []);
    const setTextInput = useCallback((text: string) => setTextInputState(text), []);
    const setFillColor = useCallback((c: string | null) => setFillColorState(c), []);
    const setFontSize = useCallback((size: number) => setFontSizeState(size), []);

    // use the extracted hooks for shapes and panning
    const { clearOverlay, drawShapePreview, drawLinePreview } = useShapeDrawing({
        overlayCanvasRef,
        strokeColor,
        strokeWidth,
        currentShape,
    });

    const { isPanning, handlePanStart, handlePanMove, handlePanEnd } = usePanning({
        panX,
        panY,
        setPan,
    });

    // handles when finger or mouse goes down
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button === 2) return; // ignore right click

        // middle mouse button pans on desktop
        if (e.button === 1) {
            e.preventDefault();
            handlePanStart(e.clientX, e.clientY);
            return;
        }

        if (e.button !== 0) return; // only handle left click

        const point = canvasService.normalizePoint(e.clientX, e.clientY, zoom, panX, panY, containerRef.current?.getBoundingClientRect());

        // for touch screens we start a timer to detect hold for panning
        if (e.pointerType === 'touch') {
            touchStartPosRef.current = { x: e.clientX, y: e.clientY };
            isTouchPanningRef.current = false;

            // clear any existing timer first
            if (touchHoldTimerRef.current) {
                clearTimeout(touchHoldTimerRef.current);
            }

            // if they hold for 300ms we switch to pan mode
            touchHoldTimerRef.current = setTimeout(() => {
                if (touchStartPosRef.current) {
                    isTouchPanningRef.current = true;
                    handlePanStart(touchStartPosRef.current.x, touchStartPosRef.current.y);
                    // stop any drawing that might have started
                    setIsDrawing(false);
                    lastPointRef.current = null;
                    strokePointsRef.current = [];
                }
            }, 300);
        }

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
    }, [currentTool, setIsDrawing, setTextPosition, zoom, panX, panY, handlePanStart]);

    // handles finger or mouse movement
    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        // check if we should be panning on touch
        if (e.pointerType === 'touch' && touchStartPosRef.current) {
            const moveThreshold = 10; // pixels of movement allowed before cancelling pan
            const dx = e.clientX - touchStartPosRef.current.x;
            const dy = e.clientY - touchStartPosRef.current.y;

            // if they moved too much before the timer finished cancel pan mode
            if (!isTouchPanningRef.current && (Math.abs(dx) > moveThreshold || Math.abs(dy) > moveThreshold)) {
                if (touchHoldTimerRef.current) {
                    clearTimeout(touchHoldTimerRef.current);
                    touchHoldTimerRef.current = null;
                }
            }

            // if we are in touch pan mode do the panning
            if (isTouchPanningRef.current) {
                handlePanMove(e.clientX, e.clientY, true); // force pan mode
                return;
            }
        }

        // middle mouse button panning for desktop users
        const isMiddleButtonPressed = !!(e.buttons & 4);
        if (handlePanMove(e.clientX, e.clientY, isMiddleButtonPressed)) {
            return;
        }

        const point = canvasService.normalizePoint(e.clientX, e.clientY, zoom, panX, panY, containerRef.current?.getBoundingClientRect());
        socketService.emit(SocketEvents.CURSOR_MOVE, { x: point.x, y: point.y, color });

        // show preview while drawing shapes or lines
        if ((currentTool === 'shapes' || currentTool === 'line') && isDrawing && shapeStartRef.current) {
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
            strokePointsRef.current.push([point.x, point.y]);
            canvasService.sendDrawCommand([0, lastPointRef.current.x, lastPointRef.current.y, point.x, point.y, colorIndex, strokeWidth], strokeColor);
        } else if (currentTool === 'eraser') {
            canvasService.eraseLine(lastPointRef.current.x, lastPointRef.current.y, point.x, point.y, strokeWidth);
            canvasService.sendDrawCommand([1, lastPointRef.current.x, lastPointRef.current.y, point.x, point.y, strokeWidth]);
            strokePointsRef.current.push([point.x, point.y]);
        }

        lastPointRef.current = point;
    }, [currentTool, isDrawing, color, strokeColor, strokeWidth, zoom, panX, panY, handlePanMove, drawShapePreview, drawLinePreview]);

    // wheel handler does nothing for now since zoom is disabled
    const handleWheel = useCallback((_e: React.WheelEvent) => {
        // zoom is disabled so this function is empty on purpose
    }, []);

    // handles when finger or mouse is lifted
    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        // clear the touch timer
        if (touchHoldTimerRef.current) {
            clearTimeout(touchHoldTimerRef.current);
            touchHoldTimerRef.current = null;
        }

        // if we were panning on touch end it now
        if (e.pointerType === 'touch' && isTouchPanningRef.current) {
            isTouchPanningRef.current = false;
            touchStartPosRef.current = null;
            handlePanEnd();
            return;
        }

        touchStartPosRef.current = null;

        if (isPanning && (e.button === 1 || e.button === 0)) {
            handlePanEnd();
            return;
        }

        const point = canvasService.normalizePoint(e.clientX, e.clientY, zoom, panX, panY, containerRef.current?.getBoundingClientRect());

        // finish drawing a line
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
                color: strokeColor,
            });

            shapeStartRef.current = null;
            setIsDrawing(false);
            return;
        }

        // finish drawing a shape
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
                fillColor: fillColor || undefined,
                color: strokeColor,
            });

            shapeStartRef.current = null;
            setIsDrawing(false);
            return;
        }

        // end of stroke for brush or eraser
        if (strokePointsRef.current.length > 1) {
            const colorIndex = COLORS.indexOf(strokeColor);
            socketService.emit('draw:stroke-end', {
                points: strokePointsRef.current,
                colorIndex,
                width: strokeWidth,
                tool: currentTool,
                color: strokeColor,
            });
        }

        setIsDrawing(false);
        lastPointRef.current = null;
        strokePointsRef.current = [];
    }, [setIsDrawing, strokeColor, strokeWidth, currentTool, currentShape, clearOverlay, fillColor, isPanning, handlePanEnd, zoom, panX, panY]);

    // handles submitting text to the canvas
    const handleTextSubmit = useCallback(() => {
        if (!textPosition || !textInput.trim()) return;

        const canvas = canvasService.getCanvas();
        const ctx = canvasService.getContext();
        let textWidthNorm = 0;

        if (ctx && canvas) {
            const scaleFactor = canvas.width / canvas.offsetWidth;
            const scaledFontSize = fontSize * scaleFactor;
            ctx.font = `${scaledFontSize}px Inter, sans-serif`;
            textWidthNorm = ctx.measureText(textInput).width / canvas.width;
        } else {
            textWidthNorm = (textInput.length * fontSize * 0.6) / 1920;
        }

        const textHeightNorm = fontSize / 1080;
        const halfWidth = textWidthNorm / 2;
        const padding = 0.02;

        let x = textPosition.x;
        let y = textPosition.y;

        // figure out where to put the text so it stays on screen
        const leftThreshold = padding + halfWidth;
        const rightThreshold = 1 - padding - halfWidth;

        if (textPosition.x < leftThreshold) {
            x = Math.max(padding, textPosition.x);
        } else if (textPosition.x > rightThreshold) {
            x = Math.min(1 - padding - textWidthNorm, textPosition.x - textWidthNorm);
        } else {
            x = textPosition.x - halfWidth;
        }

        if (y < textHeightNorm + padding) y = textHeightNorm + padding;
        if (y > 1 - padding) y = 1 - padding;

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
    }, [strokeColor, textInput, textPosition, fontSize, setTextInput, setTextPosition]);

    return {
        canvasRef, overlayCanvasRef, containerRef,
        handlePointerDown, handlePointerMove, handlePointerUp, handleWheel,
        textPosition, setTextPosition, textInput, setTextInput, handleTextSubmit,
        fillColor, setFillColor, fontSize, setFontSize,
        isPanning,
    };
}
