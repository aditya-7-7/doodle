import mongoose, { Schema, Document } from 'mongoose';
import { CanvasSnapshot as ICanvasSnapshot } from '../types';

export interface CanvasSnapshotDocument extends Omit<ICanvasSnapshot, '_id'>, Document { }

const CanvasSnapshotSchema = new Schema<CanvasSnapshotDocument>({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    imageData: {
        type: String,
        required: true  // Base64 canvas.toDataURL()
    },
    sequenceNumber: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

// Index for getting latest snapshot
CanvasSnapshotSchema.index({ roomId: 1, createdAt: -1 });

export const CanvasSnapshot = mongoose.model<CanvasSnapshotDocument>('CanvasSnapshot', CanvasSnapshotSchema);
