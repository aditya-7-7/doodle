// Session service for managing local user identity
// OAuth-ready: supports future userId alongside sessionId

const SESSION_ID_KEY = 'doodle_session_id';
const DISPLAY_NAME_KEY = 'doodle_display_name';
const RECENT_ROOMS_KEY = 'doodle_recent_rooms';

interface RecentRoom {
    code: string;
    name: string;
    lastVisited: string;
}

class SessionService {
    private static instance: SessionService;

    private constructor() { }

    public static getInstance(): SessionService {
        if (!SessionService.instance) {
            SessionService.instance = new SessionService();
        }
        return SessionService.instance;
    }

    // Get or create session ID - uses sessionStorage for per-tab isolation
    // This ensures each browser tab is treated as a separate user
    public getSessionId(): string {
        // First check sessionStorage (per-tab)
        let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
        if (!sessionId) {
            // Generate new unique ID for this tab
            sessionId = crypto.randomUUID();
            sessionStorage.setItem(SESSION_ID_KEY, sessionId);
        }
        return sessionId;
    }

    // Get display name
    public getDisplayName(): string | null {
        return localStorage.getItem(DISPLAY_NAME_KEY);
    }

    // Set display name
    public setDisplayName(name: string): void {
        localStorage.setItem(DISPLAY_NAME_KEY, name);
    }

    // Get identifier for server
    public getIdentifier(): { sessionId: string } {
        return { sessionId: this.getSessionId() };
    }

    // Recent rooms management
    public getRecentRooms(): RecentRoom[] {
        const stored = localStorage.getItem(RECENT_ROOMS_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
    }

    public addRecentRoom(code: string, name: string): void {
        const rooms = this.getRecentRooms();

        // Remove if exists
        const filtered = rooms.filter(r => r.code !== code);

        // Add to front
        filtered.unshift({
            code,
            name,
            lastVisited: new Date().toISOString(),
        });

        // Keep only last 10
        const trimmed = filtered.slice(0, 10);

        localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(trimmed));
    }

    public removeRecentRoom(code: string): void {
        const rooms = this.getRecentRooms();
        const filtered = rooms.filter(r => r.code !== code);
        localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(filtered));
    }

    public clearSession(): void {
        sessionStorage.removeItem(SESSION_ID_KEY);
        localStorage.removeItem(DISPLAY_NAME_KEY);
        localStorage.removeItem(RECENT_ROOMS_KEY);
    }
}

export const sessionService = SessionService.getInstance();
