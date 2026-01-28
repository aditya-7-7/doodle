// server types
// re exports shared types and adds server specific types

import { Socket } from 'socket.io';

// re export everything from shared types
// path server src types to shared up 3 levels
export * from '../../../shared/types';

// ============================================
// server only types
// ============================================

// extended socket with custom properties for room and session tracking
export interface ExtendedSocket extends Socket {
    sessionId?: string;
    roomCode?: string;
    displayName?: string;
}
