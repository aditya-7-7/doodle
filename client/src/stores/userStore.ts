import { create } from 'zustand';
import { sessionService } from '../services/sessionService';

interface UserState {
    sessionId: string;
    displayName: string;
    color: string;
    isAdmin: boolean;

    // Actions
    setDisplayName: (name: string) => void;
    setColor: (color: string) => void;
    setIsAdmin: (isAdmin: boolean) => void;
    initialize: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    sessionId: '',
    displayName: '',
    color: '#FF6B6B',
    isAdmin: false,

    setDisplayName: (displayName) => {
        sessionService.setDisplayName(displayName);
        set({ displayName });
    },

    setColor: (color) => set({ color }),

    setIsAdmin: (isAdmin) => set({ isAdmin }),

    initialize: () => {
        const sessionId = sessionService.getSessionId();
        const displayName = sessionService.getDisplayName() || '';
        set({ sessionId, displayName });
    },
}));
