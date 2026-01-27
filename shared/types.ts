/**
 * Shared Types - Used by both Client and Server
 * Single source of truth for all shared type definitions
 */

// ============================================
// Socket Event Names
// ============================================
export enum SocketEvents {
    // Room Events
    ROOM_CREATE = 'room:create',
    ROOM_CREATED = 'room:created',
    ROOM_JOIN = 'room:join',
    ROOM_JOINED = 'room:joined',
    ROOM_LEAVE = 'room:leave',
    ROOM_USER_JOINED = 'room:user-joined',
    ROOM_USER_LEFT = 'room:user-left',
    ROOM_KICK = 'room:kick',
    ROOM_KICKED = 'room:kicked',
    ROOM_UPDATE_PRIVACY = 'room:update-privacy',
    ROOM_SETTINGS_UPDATED = 'room:settings-updated',
    ROOM_ERROR = 'room:error',

    // Draw Events
    DRAW_STROKE = 'draw:stroke',
    DRAW_ERASE = 'draw:erase',
    DRAW_CLEAR = 'draw:clear',
    DRAW_SHAPE = 'draw:shape',
    DRAW_TEXT = 'draw:text',

    // Cursor Events
    CURSOR_MOVE = 'cursor:move',
    CURSOR_UPDATE = 'cursor:update',

    // History Events
    HISTORY_UNDO = 'history:undo',
    HISTORY_REDO = 'history:redo',
    HISTORY_UNDO_PERSONAL = 'history:undo-personal',
    HISTORY_REDO_PERSONAL = 'history:redo-personal',
    HISTORY_SYNC = 'history:sync',

    // Canvas Events
    CANVAS_LOAD = 'canvas:load',
    CANVAS_SNAPSHOT = 'canvas:snapshot',
    CANVAS_SNAPSHOT_REQUEST = 'canvas:snapshot-request',
}

// ============================================
// Room Types
// ============================================
export interface RoomSettings {
    isPrivate: boolean;
    password?: string;
    passwordPlain?: string;
    canvasWidth: number;
    canvasHeight: number;
    maxUsers: number;
}

export interface Room {
    _id?: string;
    code: string;
    name: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    creatorSessionId: string;
    creatorUserId?: string;
    settings: RoomSettings;
}

export interface RoomMember {
    _id?: string;
    roomId: string;
    sessionId: string;
    userId?: string;
    displayName: string;
    color: string;
    isAdmin: boolean;
    joinedAt: Date | string;
    lastSeenAt: Date | string;
    isKicked: boolean;
    isOnline: boolean;
}

// ============================================
// Drawing Types
// ============================================
export type ToolType = 'brush' | 'eraser' | 'line' | 'shapes' | 'text';
export type ShapeType = 'rect' | 'circle' | 'triangle' | 'diamond' | 'line';
export type OperationType = 'stroke' | 'erase' | 'clear' | 'shape' | 'text';

export interface Point {
    x: number;
    y: number;
}

export interface StrokeData {
    points: number[][];
    color: string;
    width: number;
}

export interface EraseData {
    x: number;
    y: number;
    size: number;
}

export interface ShapeData {
    shapeType: ShapeType;
    start: Point;
    end: Point;
    color: string;
    width: number;
    fill?: string;
}

export interface TextData {
    text: string;
    position: Point;
    fontSize: number;
    fontColor: string;
}

export interface DrawingOperation {
    _id?: string;
    roomId: string;
    sessionId: string;
    sequenceNumber: number;
    type: OperationType | string;
    data: StrokeData | EraseData | ShapeData | TextData | null | any;
    timestamp: Date | string;
    isUndone: boolean;
}

export interface CanvasSnapshot {
    _id?: string;
    roomId: string;
    imageData: string;
    sequenceNumber: number;
    createdAt: Date | string;
}

// ============================================
// Cursor Type
// ============================================
export interface UserCursor {
    sessionId: string;
    displayName: string;
    x: number;
    y: number;
    color: string;
}

// ============================================
// Socket Payloads
// ============================================
export interface CreateRoomPayload {
    sessionId: string;
    displayName: string;
    roomName: string;
    settings?: Partial<RoomSettings>;
}

export interface JoinRoomPayload {
    sessionId: string;
    displayName: string;
    roomCode: string;
    password?: string;
}

export interface DrawCommandPayload {
    commands: number[][];
}

export interface CursorMovePayload {
    x: number;
    y: number;
}

// ============================================
// Constants
// ============================================
export const COLORS = [
    '#000000', // Black
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Purple
    '#FF69B4', // Pink
    '#FFA500', // Orange
    '#FFFFFF', // White
];

export const STROKE_WIDTHS = [2, 4, 6, 8, 12, 16, 24];
