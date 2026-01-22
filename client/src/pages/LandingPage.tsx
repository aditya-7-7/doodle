import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService, socketService } from '../services';
import { useUserStore } from '../stores';
import { SocketEvents } from '../types';
import { Boxes } from '../components/ui/InteractiveGrid';
import { RoomForm } from '../components/ui/RoomForm';

export default function LandingPage() {
    const navigate = useNavigate();
    const { setDisplayName, initialize } = useUserStore();

    const [form, setForm] = useState({
        displayName: '',
        canvasName: '',
        roomCode: '',
        password: '',
        joinPassword: '',
    });
    const [isPrivate, setIsPrivate] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { initialize(); }, []);

    // Form field handlers
    const updateField = (field: keyof typeof form) => (value: string) => {
        setForm(f => ({ ...f, [field]: value }));
        setError('');
    };

    // Create room handler
    const handleCreateRoom = useCallback(() => {
        const { displayName, canvasName, password } = form;

        if (!displayName.trim()) return setError('Please enter your display name');
        if (isPrivate && !password.trim()) return setError('Please enter a password');

        setIsLoading(true);
        setError('');
        setDisplayName(displayName.trim());

        const socket = socketService.connect();

        const cleanup = () => {
            socket.off(SocketEvents.ROOM_CREATED, onSuccess);
            socket.off(SocketEvents.ROOM_ERROR, onError);
        };

        const onSuccess = (data: any) => {
            setIsLoading(false);
            sessionService.addRecentRoom(data.room.code, data.room.name);
            sessionStorage.setItem(`joined_room_${data.room.code}`, 'true');
            cleanup();
            navigate(`/room/${data.room.code}`);
        };

        const onError = (data: any) => {
            setIsLoading(false);
            setError(data.message || 'Failed to create room');
            cleanup();
        };

        socket.on(SocketEvents.ROOM_CREATED, onSuccess);
        socket.on(SocketEvents.ROOM_ERROR, onError);

        socket.emit(SocketEvents.ROOM_CREATE, {
            sessionId: sessionService.getSessionId(),
            displayName: displayName.trim(),
            roomName: canvasName.trim() || 'Untitled Canvas',
            settings: { isPrivate, password: isPrivate ? password : null },
        });
    }, [form, isPrivate, setDisplayName, navigate]);

    // Join room handler
    const handleJoinRoom = useCallback(() => {
        const { displayName, roomCode, joinPassword } = form;

        if (!displayName.trim()) return setError('Please enter your display name');
        if (!roomCode.trim()) return setError('Please enter a room code');

        setIsLoading(true);
        setError('');
        setDisplayName(displayName.trim());

        const socket = socketService.connect();

        const cleanup = () => {
            socket.off(SocketEvents.ROOM_JOINED, onSuccess);
            socket.off(SocketEvents.ROOM_ERROR, onError);
        };

        const onSuccess = (data: any) => {
            setIsLoading(false);
            sessionService.addRecentRoom(data.room.code, data.room.name);
            sessionStorage.setItem(`joined_room_${data.room.code}`, 'true');
            cleanup();
            navigate(`/room/${data.room.code}`);
        };

        const onError = (data: any) => {
            setIsLoading(false);
            setError(data.message || 'Failed to join room');
            cleanup();
        };

        socket.on(SocketEvents.ROOM_JOINED, onSuccess);
        socket.on(SocketEvents.ROOM_ERROR, onError);

        socket.emit(SocketEvents.ROOM_JOIN, {
            sessionId: sessionService.getSessionId(),
            displayName: displayName.trim(),
            roomCode: roomCode.trim(),
            password: joinPassword || undefined,
        });
    }, [form, setDisplayName, navigate]);

    return (
        <div className="min-h-screen bg-white relative">
            <Boxes />

            {/* Header */}
            <header className="relative z-20 p-6 pointer-events-none">
                <div className="pointer-events-auto w-fit">
                    <img src="/logo.png" alt="Doodle Logo" className="h-12" />
                </div>
            </header>

            {/* Main Content */}
            <main className="relative container mx-auto px-6 py-8 pointer-events-none">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-12 min-h-[70vh] pointer-events-none">

                    {/* Left - Demo Image */}
                    <div className="flex-1 max-w-2xl pointer-events-none">
                        <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100 pointer-events-auto relative z-10">
                            <div className="bg-gray-50 rounded-lg px-4 py-2 mb-4 inline-block">
                                <span className="text-sm text-gray-600">Real-time Collaboration Demo</span>
                            </div>
                            <img src="/Gemini_Generated_Image_39esh339esh339es.png" alt="Demo" className="w-full h-auto rounded-lg" />
                        </div>
                    </div>

                    {/* Right - Flip Card Form */}
                    <div className="pointer-events-auto relative z-10">
                        <RoomForm
                            displayName={form.displayName}
                            onDisplayNameChange={updateField('displayName')}
                            canvasName={form.canvasName}
                            onCanvasNameChange={updateField('canvasName')}
                            isPrivate={isPrivate}
                            onPrivateChange={setIsPrivate}
                            password={form.password}
                            onPasswordChange={updateField('password')}
                            onCreateRoom={handleCreateRoom}
                            roomCode={form.roomCode}
                            onRoomCodeChange={updateField('roomCode')}
                            joinPassword={form.joinPassword}
                            onJoinPasswordChange={updateField('joinPassword')}
                            onJoinRoom={handleJoinRoom}
                            isLoading={isLoading}
                            error={error}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
