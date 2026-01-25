import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService, sessionService, canvasService } from '../services';
import { useRoomStore, useUserStore, useCanvasStore } from '../stores';
import { SocketEvents, COLORS } from '../types';

interface UseRoomSocketReturn {
    isConnected: boolean;
    fps: number;
    latency: number;
    showJoinForm: boolean;
    joinName: string;
    setJoinName: (name: string) => void;
    joinPassword: string;
    setJoinPassword: (password: string) => void;
    joinError: string;
    handleJoinSubmit: (e: React.FormEvent) => void;
}

export function useRoomSocket(roomCode: string | undefined): UseRoomSocketReturn {
    const navigate = useNavigate();
    const { setRoom, setMembers, addMember, removeMember, setError } = useRoomStore();
    const { sessionId, displayName, setColor, setIsAdmin, initialize, setDisplayName } = useUserStore();
    const { updateRemoteCursor, removeRemoteCursor, clearRemoteCursors } = useCanvasStore();

    const [isConnected, setIsConnected] = useState(false);
    const [fps, setFps] = useState(0);
    const [latency, setLatency] = useState(0);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [joinName, setJoinName] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [joinError, setJoinError] = useState('');

    const replayOperation = useCallback((op: any) => {
        const d = op.data;
        const color = COLORS[d?.colorIndex] || '#000000';
        switch (op.type) {
            case 'stroke': d?.points?.forEach((p: number[], i: number, arr: number[][]) => i < arr.length - 1 && canvasService.drawLine(p[0], p[1], arr[i + 1][0], arr[i + 1][1], color, d.width || 3)); break;
            case 'erase': d?.points?.forEach((p: number[]) => canvasService.erase(p[0], p[1], d.size || 20)); break;
            case 'shape': canvasService.drawShape(d.shapeType, d.startX, d.startY, d.endX, d.endY, color, d.width || 3); break;
            case 'text': canvasService.drawText(d.text, d.x, d.y, d.fontSize || 24, color); break;
            case 'clear': canvasService.clear(); break;
        }
    }, []);

    const executeDrawCommand = useCallback((cmd: number[]) => {
        const type = cmd[0];
        if (type === 0) canvasService.drawLine(cmd[1], cmd[2], cmd[3], cmd[4], COLORS[cmd[5] || 0], cmd[6] || 3);
        else if (type === 1) canvasService.erase(cmd[1], cmd[2], cmd[3] || 20);
    }, []);

    // Initialize and connect
    useEffect(() => {
        initialize();

        const joinedKey = `joined_room_${roomCode}`;
        const hasJoinedThisRoom = sessionStorage.getItem(joinedKey);

        if (!hasJoinedThisRoom) {
            setShowJoinForm(true);
            return;
        }

        const storedName = displayName || sessionService.getDisplayName();
        if (!storedName) {
            setShowJoinForm(true);
            return;
        }

        clearRemoteCursors();
        const storedPassword = sessionStorage.getItem(`room_password_${roomCode}`);
        const socket = socketService.connect();

        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        socket.on(SocketEvents.ROOM_JOINED, (data: any) => {
            setRoom(data.room);
            setMembers(data.members);
            const me = data.members.find((m: any) => m.sessionId === sessionId);
            if (me) { setColor(me.color); setIsAdmin(me.isAdmin); }
            // Use whenReady to ensure canvas is initialized before drawing
            canvasService.whenReady(() => {
                canvasService.clear();
                const replay = () => data.operations?.forEach((op: any) => replayOperation(op));
                data.snapshot ? canvasService.loadImage(data.snapshot).then(replay) : replay();
            });
        });

        socket.on(SocketEvents.ROOM_USER_JOINED, (data: any) => data.members ? setMembers(data.members) : addMember(data.member));
        socket.on(SocketEvents.ROOM_USER_LEFT, (data: any) => {
            data.members ? setMembers(data.members) : removeMember(data.sessionId);
            removeRemoteCursor(data.sessionId);
        });

        socket.on(SocketEvents.DRAW_STROKE, (data: any) => {
            if (data.sessionId !== sessionId) data.commands.forEach((cmd: number[]) => executeDrawCommand(cmd));
        });

        socket.on(SocketEvents.DRAW_SHAPE, (data: any) => {
            if (data.sessionId !== sessionId) canvasService.drawShape(data.shapeType, data.startX, data.startY, data.endX, data.endY, COLORS[data.colorIndex] || '#000000', data.width);
        });

        socket.on(SocketEvents.DRAW_TEXT, (data: any) => {
            if (data.sessionId !== sessionId) canvasService.drawText(data.text, data.x, data.y, data.fontSize || 24, COLORS[data.colorIndex] || '#000000');
        });

        socket.on(SocketEvents.DRAW_CLEAR, () => canvasService.clear());

        socket.on(SocketEvents.CURSOR_UPDATE, (data: any) => {
            if (data.sessionId !== sessionId) updateRemoteCursor({ sessionId: data.sessionId, displayName: data.displayName, x: data.x, y: data.y, color: data.color });
        });

        socket.on(SocketEvents.HISTORY_SYNC, (data: any) => {
            canvasService.clear();
            data.operations?.forEach((op: any) => replayOperation(op));
        });

        socket.on(SocketEvents.ROOM_KICKED, (data: any) => {
            if (data.targetSessionId === sessionId) { alert('You have been kicked from the room'); navigate('/'); }
        });

        socket.on(SocketEvents.ROOM_ERROR, (data: any) => {
            setError(data.message);
            if (data.message === 'Room not found') navigate('/');
        });

        socket.on(SocketEvents.CANVAS_SNAPSHOT_REQUEST, () => {
            const imageData = canvasService.toDataURL();
            if (imageData) socket.emit(SocketEvents.CANVAS_SNAPSHOT, { imageData });
        });

        socket.on(SocketEvents.ROOM_SETTINGS_UPDATED, (data: any) => {
            if (data.room) setRoom(data.room);
        });

        socket.emit(SocketEvents.ROOM_JOIN, { sessionId: sessionService.getSessionId(), displayName: storedName, roomCode, password: storedPassword || undefined });

        return () => {
            [SocketEvents.ROOM_JOINED, SocketEvents.ROOM_USER_JOINED, SocketEvents.ROOM_USER_LEFT, SocketEvents.DRAW_STROKE, SocketEvents.DRAW_SHAPE, SocketEvents.DRAW_TEXT, SocketEvents.DRAW_CLEAR, SocketEvents.CURSOR_UPDATE, SocketEvents.HISTORY_SYNC, SocketEvents.ROOM_KICKED, SocketEvents.ROOM_ERROR, SocketEvents.CANVAS_SNAPSHOT_REQUEST, SocketEvents.ROOM_SETTINGS_UPDATED, 'connect', 'disconnect'].forEach(e => socket.off(e));
            socketService.disconnect();
        };
    }, [roomCode, displayName]);

    // FPS counter
    useEffect(() => {
        let frameCount = 0, lastTime = performance.now();
        const measureFps = () => { frameCount++; const now = performance.now(); if (now - lastTime >= 1000) { setFps(frameCount); frameCount = 0; lastTime = now; } return requestAnimationFrame(measureFps); };
        const animId = requestAnimationFrame(measureFps);
        return () => cancelAnimationFrame(animId);
    }, []);

    // Latency ping
    useEffect(() => {
        const ping = () => { const start = Date.now(); socketService.getSocket()?.emit('ping', {}, () => setLatency(Date.now() - start)); };
        ping(); const interval = setInterval(ping, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleJoinSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!joinName.trim()) { setJoinError('Please enter your display name'); return; }

        sessionService.setDisplayName(joinName.trim());
        setJoinError('');
        const socket = socketService.connect();

        const cleanup = () => { socket.off(SocketEvents.ROOM_JOINED, onSuccess); socket.off(SocketEvents.ROOM_ERROR, onError); };

        const onSuccess = () => {
            sessionStorage.setItem(`joined_room_${roomCode}`, 'true');
            if (joinPassword) sessionStorage.setItem(`room_password_${roomCode}`, joinPassword);
            setDisplayName(joinName.trim());
            setShowJoinForm(false);
            cleanup();
        };

        const onError = (data: any) => { setJoinError(data.message || 'Failed to join room'); cleanup(); };

        socket.on(SocketEvents.ROOM_JOINED, onSuccess);
        socket.on(SocketEvents.ROOM_ERROR, onError);
        socket.emit(SocketEvents.ROOM_JOIN, { sessionId: sessionService.getSessionId(), displayName: joinName.trim(), roomCode, password: joinPassword || undefined });
    }, [joinName, joinPassword, roomCode, setDisplayName]);

    return { isConnected, fps, latency, showJoinForm, joinName, setJoinName, joinPassword, setJoinPassword, joinError, handleJoinSubmit };
}
