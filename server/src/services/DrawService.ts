import { DrawingOperation, CanvasSnapshot } from '../models';
import { OperationType } from '../types';

class DrawService {
    private static instance: DrawService;
    private sequenceCounters: Map<string, number> = new Map();

    private constructor() { }

    public static getInstance(): DrawService {
        if (!DrawService.instance) {
            DrawService.instance = new DrawService();
        }
        return DrawService.instance;
    }

    // Get next sequence number for a room
    public async getNextSequence(roomId: string): Promise<number> {
        // Try from cache first
        let seq = this.sequenceCounters.get(roomId);

        if (seq === undefined) {
            // Load from database
            const lastOp = await DrawingOperation.findOne({ roomId }).sort({ sequenceNumber: -1 });
            seq = lastOp ? lastOp.sequenceNumber : 0;
        }

        seq += 1;
        this.sequenceCounters.set(roomId, seq);
        return seq;
    }

    // Save a drawing operation
    public async saveOperation(
        roomId: string,
        sessionId: string,
        type: OperationType,
        data: any
    ): Promise<any> {
        const sequenceNumber = await this.getNextSequence(roomId);

        const operation = await DrawingOperation.create({
            roomId,
            sessionId,
            sequenceNumber,
            type,
            data,
            timestamp: new Date(),
            isUndone: false,
        });

        // Create snapshot every 50 operations
        if (sequenceNumber % 50 === 0) {
            console.log(`📸 Snapshot should be created at sequence ${sequenceNumber}`);
            // Snapshot creation is triggered by client sending canvas state
        }

        return operation.toObject();
    }

    // Get all non-undone operations for a room
    public async getOperations(roomId: string, sinceSequence: number = 0): Promise<any[]> {
        const operations = await DrawingOperation.find({
            roomId,
            sequenceNumber: { $gt: sinceSequence },
            isUndone: false,
        }).sort({ sequenceNumber: 1 });

        return operations.map(op => op.toObject());
    }

    // Undo last operation
    public async undo(roomId: string): Promise<any | null> {
        const lastOp = await DrawingOperation.findOne({
            roomId,
            isUndone: false,
        }).sort({ sequenceNumber: -1 });

        if (lastOp) {
            lastOp.isUndone = true;
            await lastOp.save();
            return lastOp.toObject();
        }
        return null;
    }

    // Redo last undone operation
    public async redo(roomId: string): Promise<any | null> {
        const lastUndone = await DrawingOperation.findOne({
            roomId,
            isUndone: true,
        }).sort({ sequenceNumber: -1 });

        if (lastUndone) {
            lastUndone.isUndone = false;
            await lastUndone.save();
            return lastUndone.toObject();
        }
        return null;
    }

    // Save canvas snapshot
    public async saveSnapshot(roomId: string, imageData: string): Promise<void> {
        const seq = this.sequenceCounters.get(roomId) || 0;

        await CanvasSnapshot.create({
            roomId,
            imageData,
            sequenceNumber: seq,
        });

        // Keep only last 5 snapshots
        const snapshots = await CanvasSnapshot.find({ roomId }).sort({ createdAt: -1 }).skip(5);
        for (const old of snapshots) {
            await old.deleteOne();
        }
    }

    // Get latest snapshot
    public async getLatestSnapshot(roomId: string): Promise<any | null> {
        const snapshot = await CanvasSnapshot.findOne({ roomId }).sort({ createdAt: -1 });
        return snapshot?.toObject() || null;
    }

    // Clear all operations (for clear canvas)
    public async clearOperations(roomId: string, sessionId: string): Promise<number> {
        const seq = await this.getNextSequence(roomId);

        // Add clear operation to history
        await DrawingOperation.create({
            roomId,
            sessionId,
            sequenceNumber: seq,
            type: 'clear',
            data: null,
            timestamp: new Date(),
            isUndone: false,
        });

        return seq;
    }
}

export const drawService = DrawService.getInstance();
