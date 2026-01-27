/**
 * Server Types
 * Re-exports shared types and adds server-specific types
 */

import { Socket } from 'socket.io';

// Re-export everything from shared types
// Path: server/src/types -> shared (up 3 levels)
export * from '../../../shared/types';

// ============================================
// Server-Only Types (Socket.io specific)
// ============================================

/**
 * Extended Socket with custom properties for room/session tracking
 */
export interface ExtendedSocket extends Socket {
    sessionId?: string;
    roomCode?: string;
    displayName?: string;
}
