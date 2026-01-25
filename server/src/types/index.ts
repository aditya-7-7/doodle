import { Socket } from 'socket.io';

// Room Types
export interface RoomSettings {
    isPrivate: boolean;
    password?: string;  // Hashed for verification
    passwordPlain?: string;  // Plain text for admin display
    canvasWidth: number;
    canvasHeight: number;
    maxUsers: number;
}

export interface Room {
    _id?: string;
    code: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    creatorSessionId: string;
    creatorUserId?: string;  // For future OAuth
    settings: RoomSettings;
}

// Member Types
export interface RoomMember {
    _id?: string;
    roomId: string;
    sessionId: string;
    userId?: string;  // For future OAuth
    displayName: string;
    color: string;
    isAdmin: boolean;
    joinedAt: Date;
    lastSeenAt: Date;
    isKicked: boolean;
    isOnline: boolean;
}

// Drawing Operation Types
export type OperationType = 'stroke' | 'erase' | 'clear' | 'shape' | 'text';
export type ShapeType = 'rect' | 'circle' | 'line';

export interface StrokeData {
    points: number[][];  // [[x, y], [x, y], ...] normalized 0-1
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
    start: { x: number; y: number };
    end: { x: number; y: number };
    color: string;
    width: number;
    fill?: string;
}

export interface TextData {
    text: string;
    position: { x: number; y: number };
    fontSize: number;
    fontColor: string;
}

export interface DrawingOperation {
    _id?: string;
    roomId: string;
    sessionId: string;
    sequenceNumber: number;
    type: OperationType;
    data: StrokeData | EraseData | ShapeData | TextData | null;
    timestamp: Date;
    isUndone: boolean;
}

// Canvas Snapshot
export interface CanvasSnapshot {
    _id?: string;
    roomId: string;
    imageData: string;
    sequenceNumber: number;
    createdAt: Date;
}

// Socket Event Payloads
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
    commands: number[][];  // Batched commands
}

export interface CursorMovePayload {
    x: number;  // Normalized 0-1
    y: number;
}

// Extended Socket with custom properties
export interface ExtendedSocket extends Socket {
    sessionId?: string;
    roomCode?: string;
    displayName?: string;
}

// Event Names
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
    CANVAS_SNAPSHOT_REQUEST = 'canvas:snapshot-request',  // Server requests snapshot from client
}
