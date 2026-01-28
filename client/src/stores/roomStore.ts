import { create } from 'zustand';
import { Room, RoomMember } from '../types';

interface RoomState {
    room: Room | null;
    members: RoomMember[];
    isLoading: boolean;
    error: string | null;

    // actions
    setRoom: (room: Room | null) => void;
    setMembers: (members: RoomMember[]) => void;
    addMember: (member: RoomMember) => void;
    removeMember: (sessionId: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
    room: null,
    members: [],
    isLoading: false,
    error: null,

    setRoom: (room) => set({ room }),

    setMembers: (members) => set({ members }),

    addMember: (member) => set((state) => ({
        members: [...state.members.filter(m => m.sessionId !== member.sessionId), member]
    })),

    removeMember: (sessionId) => set((state) => ({
        members: state.members.filter(m => m.sessionId !== sessionId)
    })),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    reset: () => set({
        room: null,
        members: [],
        isLoading: false,
        error: null,
    }),
}));
