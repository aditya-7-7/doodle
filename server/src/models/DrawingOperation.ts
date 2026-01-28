import mongoose, { Schema, Document } from 'mongoose';
import { DrawingOperation as IDrawingOperation } from '../types';

export interface DrawingOperationDocument extends Omit<IDrawingOperation, '_id'>, Document { }

const DrawingOperationSchema = new Schema<DrawingOperationDocument>({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true
    },
    sequenceNumber: {
        type: Number,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['stroke', 'erase', 'clear', 'shape', 'text']
    },
    data: {
        type: Schema.Types.Mixed,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isUndone: {
        type: Boolean,
        default: false,
        index: true
    },
});

// compound index for ordering operations
DrawingOperationSchema.index({ roomId: 1, sequenceNumber: -1 });
DrawingOperationSchema.index({ roomId: 1, isUndone: 1, sequenceNumber: -1 });

export const DrawingOperation = mongoose.model<DrawingOperationDocument>('DrawingOperation', DrawingOperationSchema);
