import { create } from 'zustand';
import { DrawingOperation } from '../types';

interface HistoryState {
    operations: DrawingOperation[];
    canUndo: boolean;
    canRedo: boolean;

    // Actions
    setOperations: (operations: DrawingOperation[]) => void;
    addOperation: (operation: DrawingOperation) => void;
    updateOperation: (id: string, updates: Partial<DrawingOperation>) => void;
    setCanUndo: (canUndo: boolean) => void;
    setCanRedo: (canRedo: boolean) => void;
    reset: () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
    operations: [],
    canUndo: false,
    canRedo: false,

    setOperations: (operations) => set({
        operations,
        canUndo: operations.some(op => !op.isUndone),
        canRedo: operations.some(op => op.isUndone),
    }),

    addOperation: (operation) => set((state) => {
        const newOps = [...state.operations, operation];
        return {
            operations: newOps,
            canUndo: true,
        };
    }),

    updateOperation: (id, updates) => set((state) => ({
        operations: state.operations.map(op =>
            op._id === id ? { ...op, ...updates } : op
        ),
    })),

    setCanUndo: (canUndo) => set({ canUndo }),

    setCanRedo: (canRedo) => set({ canRedo }),

    reset: () => set({
        operations: [],
        canUndo: false,
        canRedo: false,
    }),
}));
