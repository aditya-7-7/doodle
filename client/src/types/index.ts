// Socket Event Names (mirror server types)
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
    HISTORY_SYNC = 'history:sync',

    // Canvas Events
    CANVAS_LOAD = 'canvas:load',
    CANVAS_SNAPSHOT = 'canvas:snapshot',
}

// Room interfaces
export interface RoomSettings {
    isPrivate: boolean;
    password?: string;
    canvasWidth: number;
    canvasHeight: number;
    maxUsers: number;
}

export interface Room {
    _id: string;
    code: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    creatorSessionId: string;
    creatorUserId?: string;
    settings: RoomSettings;
}

export interface RoomMember {
    _id: string;
    roomId: string;
    sessionId: string;
    userId?: string;
    displayName: string;
    color: string;
    isAdmin: boolean;
    joinedAt: string;
    lastSeenAt: string;
    isKicked: boolean;
}

// Drawing types
export type ToolType = 'brush' | 'eraser' | 'shapes' | 'text' | 'select';
export type ShapeType = 'rect' | 'circle' | 'line';

export interface Point {
    x: number;
    y: number;
}

export interface DrawingOperation {
    _id: string;
    roomId: string;
    sessionId: string;
    sequenceNumber: number;
    type: string;
    data: any;
    timestamp: string;
    isUndone: boolean;
}

// Cursor type
export interface UserCursor {
    sessionId: string;
    displayName: string;
    x: number;
    y: number;
    color: string;
}

// Color palette
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

export const CANVAS_SIZES = [
    { name: 'HD', width: 1920, height: 1080 },
    { name: 'Square', width: 1080, height: 1080 },
    { name: '4K', width: 3840, height: 2160 },
    { name: 'Portrait', width: 1080, height: 1920 },
];
