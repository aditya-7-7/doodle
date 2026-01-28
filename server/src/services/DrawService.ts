import { DrawingOperation, CanvasSnapshot } from '../models';
import { OperationType } from '../types';

class DrawService {
    private static instance: DrawService;
    private sequenceCounters: Map<string, { seq: number; lastAccess: number }> = new Map();
    private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    private readonly STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

    private constructor() {
        // periodically clean up stale room entries
        setInterval(() => this.cleanupStaleEntries(), this.CLEANUP_INTERVAL_MS);
    }

    public static getInstance(): DrawService {
        if (!DrawService.instance) {
            DrawService.instance = new DrawService();
        }
        return DrawService.instance;
    }

    private cleanupStaleEntries(): void {
        const now = Date.now();
        for (const [roomId, data] of this.sequenceCounters.entries()) {
            if (now - data.lastAccess > this.STALE_THRESHOLD_MS) this.sequenceCounters.delete(roomId);
        }
    }

    public cleanupRoom(roomId: string): void { this.sequenceCounters.delete(roomId); }

    // get next sequence number for a room
    public async getNextSequence(roomId: string): Promise<number> {
        const now = Date.now();
        // try from cache first
        let entry = this.sequenceCounters.get(roomId);

        if (!entry) {
            // load from database
            const lastOp = await DrawingOperation.findOne({ roomId }).sort({ sequenceNumber: -1 });
            entry = { seq: lastOp ? lastOp.sequenceNumber : 0, lastAccess: now };
        }

        entry.seq += 1;
        entry.lastAccess = now;
        this.sequenceCounters.set(roomId, entry);
        return entry.seq;
    }

    public async saveOperation(roomId: string, sessionId: string, type: OperationType, data: any): Promise<{ operation: any; needsSnapshot: boolean }> {
        const sequenceNumber = await this.getNextSequence(roomId);
        const operation = await DrawingOperation.create({ roomId, sessionId, sequenceNumber, type, data, timestamp: new Date(), isUndone: false });
        return { operation: operation.toObject(), needsSnapshot: sequenceNumber % 50 === 0 };
    }

    // get all active operations for a room that havent been undone
    public async getOperations(roomId: string, sinceSequence: number = 0): Promise<any[]> {
        const operations = await DrawingOperation.find({
            roomId,
            sequenceNumber: { $gt: sinceSequence },
            isUndone: false,
        }).sort({ sequenceNumber: 1 });

        return operations.map(op => op.toObject());
    }

    // global undo undoes the last operation from any user
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

    // global redo redoes the operation that was undone most recently
    // oldest undone equals most recent undo
    public async redo(roomId: string): Promise<any | null> {
        const oldestUndone = await DrawingOperation.findOne({
            roomId,
            isUndone: true,
        }).sort({ sequenceNumber: 1 });  // ascending order to get oldest undone

        if (oldestUndone) {
            oldestUndone.isUndone = false;
            await oldestUndone.save();
            return oldestUndone.toObject();
        }
        return null;
    }

    // personal undo undoes last operation by this specific user only
    public async undoPersonal(roomId: string, sessionId: string): Promise<any | null> {
        const lastOp = await DrawingOperation.findOne({
            roomId,
            sessionId,
            isUndone: false,
        }).sort({ sequenceNumber: -1 });

        if (lastOp) {
            lastOp.isUndone = true;
            await lastOp.save();
            return lastOp.toObject();
        }
        return null;
    }

    // personal redo redoes last undone operation by this specific user
    public async redoPersonal(roomId: string, sessionId: string): Promise<any | null> {
        const oldestUndone = await DrawingOperation.findOne({
            roomId,
            sessionId,
            isUndone: true,
        }).sort({ sequenceNumber: 1 });  // oldest undone equals most recently undone

        if (oldestUndone) {
            oldestUndone.isUndone = false;
            await oldestUndone.save();
            return oldestUndone.toObject();
        }
        return null;
    }

    // save canvas snapshot for faster loading
    public async saveSnapshot(roomId: string, imageData: string): Promise<void> {
        const entry = this.sequenceCounters.get(roomId);
        const seq = entry?.seq || 0;

        await CanvasSnapshot.create({
            roomId,
            imageData,
            sequenceNumber: seq,
        });

        // keep only last 5 snapshots
        const snapshots = await CanvasSnapshot.find({ roomId }).sort({ createdAt: -1 }).skip(5);
        for (const old of snapshots) {
            await old.deleteOne();
        }
    }

    // get the latest snapshot for a room
    public async getLatestSnapshot(roomId: string): Promise<any | null> {
        const snapshot = await CanvasSnapshot.findOne({ roomId }).sort({ createdAt: -1 });
        return snapshot?.toObject() || null;
    }

    // clear all operations by adding a clear operation to history
    public async clearOperations(roomId: string, sessionId: string): Promise<number> {
        const seq = await this.getNextSequence(roomId);

        // add clear operation to history
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
