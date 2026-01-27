import mongoose, { Schema, Document } from 'mongoose';
import { Room as IRoom, RoomSettings } from '../types';

export interface RoomDocument extends Omit<IRoom, '_id'>, Document { }

const RoomSettingsSchema = new Schema<RoomSettings>({
    isPrivate: { type: Boolean, default: false },
    password: { type: String, default: null },  // Hashed
    passwordPlain: { type: String, default: null },  // Plain for admin
    canvasWidth: { type: Number, default: 8000 },
    canvasHeight: { type: Number, default: 8000 },
    maxUsers: { type: Number, default: 10 },
}, { _id: false });

const RoomSchema = new Schema<RoomDocument>({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    creatorSessionId: {
        type: String,
        required: true
    },
    creatorUserId: {
        type: String,
        default: null  // For future OAuth
    },
    settings: {
        type: RoomSettingsSchema,
        default: () => ({})
    },
}, {
    timestamps: true
});

// Generate unique room code
RoomSchema.statics.generateCode = function (): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const Room = mongoose.model<RoomDocument>('Room', RoomSchema);
