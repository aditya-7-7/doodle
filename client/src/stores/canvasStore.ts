import { create } from 'zustand';
import { ToolType, UserCursor, COLORS, STROKE_WIDTHS, ShapeType } from '../types';

interface CanvasState {
    // Tool settings
    currentTool: ToolType;
    currentShape: ShapeType;
    strokeColor: string;
    strokeWidth: number;
    fillColor: string | null;

    // Canvas state
    isDrawing: boolean;
    canvasWidth: number;
    canvasHeight: number;

    // Remote cursors
    remoteCursors: Map<string, UserCursor>;

    // Actions
    setCurrentTool: (tool: ToolType) => void;
    setCurrentShape: (shape: ShapeType) => void;
    setStrokeColor: (color: string) => void;
    setStrokeWidth: (width: number) => void;
    setFillColor: (color: string | null) => void;
    setIsDrawing: (drawing: boolean) => void;
    setCanvasSize: (width: number, height: number) => void;
    updateRemoteCursor: (cursor: UserCursor) => void;
    removeRemoteCursor: (sessionId: string) => void;
    clearRemoteCursors: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
    currentTool: 'brush',
    currentShape: 'rect',
    strokeColor: COLORS[0],
    strokeWidth: STROKE_WIDTHS[1],
    fillColor: null,
    isDrawing: false,
    canvasWidth: 1920,
    canvasHeight: 1080,
    remoteCursors: new Map(),

    setCurrentTool: (currentTool) => set({ currentTool }),

    setCurrentShape: (currentShape) => set({ currentShape }),

    setStrokeColor: (strokeColor) => set({ strokeColor }),

    setStrokeWidth: (strokeWidth) => set({ strokeWidth }),

    setFillColor: (fillColor) => set({ fillColor }),

    setIsDrawing: (isDrawing) => set({ isDrawing }),

    setCanvasSize: (canvasWidth, canvasHeight) => set({ canvasWidth, canvasHeight }),

    updateRemoteCursor: (cursor) => set((state) => {
        const newCursors = new Map(state.remoteCursors);
        newCursors.set(cursor.sessionId, cursor);
        return { remoteCursors: newCursors };
    }),

    removeRemoteCursor: (sessionId) => set((state) => {
        const newCursors = new Map(state.remoteCursors);
        newCursors.delete(sessionId);
        return { remoteCursors: newCursors };
    }),

    clearRemoteCursors: () => set({ remoteCursors: new Map() }),
}));

