import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Users, Sparkles, ArrowRight, Plus, LogIn, Lock, Unlock } from 'lucide-react';
import { sessionService, socketService } from '../services';
import { useUserStore } from '../stores';
import { SocketEvents } from '../types';

export default function LandingPage() {
    const navigate = useNavigate();
    const { setDisplayName, initialize } = useUserStore();

    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [roomName, setRoomName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');
    const [recentRooms, setRecentRooms] = useState<any[]>([]);

    useEffect(() => {
        initialize();
        setRecentRooms(sessionService.getRecentRooms());
        // Don't auto-populate displayName - let users enter fresh name each time
    }, []);

    const handleCreateRoom = () => {
        if (!name.trim()) { setError('Please enter your name'); return; }
        if (isPrivate && !password.trim()) { setError('Please enter a password for private room'); return; }

        setIsCreating(true);
        setError('');
        setDisplayName(name.trim());

        const socket = socketService.connect();

        socket.once(SocketEvents.ROOM_CREATED, (data: any) => {
            setIsCreating(false);
            sessionService.addRecentRoom(data.room.code, data.room.name);
            navigate(`/room/${data.room.code}`);
        });

        socket.once(SocketEvents.ROOM_ERROR, (data: any) => {
            setIsCreating(false);
            setError(data.message || 'Failed to create room');
        });

        socket.emit(SocketEvents.ROOM_CREATE, {
            sessionId: sessionService.getSessionId(),
            displayName: name.trim(),
            roomName: roomName.trim() || 'Untitled Canvas',
            settings: {
                isPrivate,
                password: isPrivate ? password : null,
            },
        });
    };

    const handleJoinRoom = () => {
        if (!name.trim()) { setError('Please enter your name'); return; }
        if (!roomCode.trim()) { setError('Please enter a room code'); return; }

        setIsJoining(true);
        setError('');
        setDisplayName(name.trim());

        const socket = socketService.connect();

        socket.once(SocketEvents.ROOM_JOINED, (data: any) => {
            setIsJoining(false);
            sessionService.addRecentRoom(data.room.code, data.room.name);
            navigate(`/room/${data.room.code}`);
        });

        socket.once(SocketEvents.ROOM_ERROR, (data: any) => {
            setIsJoining(false);
            setError(data.message || 'Failed to join room');
        });

        socket.emit(SocketEvents.ROOM_JOIN, {
            sessionId: sessionService.getSessionId(),
            displayName: name.trim(),
            roomCode: roomCode.trim().toUpperCase(),
            password: joinPassword || undefined,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                            <Palette className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Doodle
                        </h1>
                    </div>
                    <p className="text-lg text-gray-600 max-w-md mx-auto">
                        Real-time collaborative drawing canvas. Create, share, and draw together.
                    </p>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
                    <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm">
                        <Users className="w-5 h-5 text-indigo-500" />
                        <span className="text-gray-700">Draw with friends in real-time</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <span className="text-gray-700">Shapes, colors, and brushes</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-white/20 shadow-sm">
                        <ArrowRight className="w-5 h-5 text-pink-500" />
                        <span className="text-gray-700">Global undo/redo history</span>
                    </div>
                </div>

                {/* Name Input */}
                <div className="max-w-md mx-auto mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Display Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all bg-white/80" maxLength={50} />
                </div>

                {/* Error */}
                {error && <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

                {/* Cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {/* Create Room */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-100 rounded-lg"><Plus className="w-5 h-5 text-indigo-600" /></div>
                            <h2 className="text-xl font-semibold text-gray-800">Create New Room</h2>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">Start a new canvas and invite others to join.</p>

                        <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Room name (optional)"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 mb-3 bg-white/80" maxLength={100} />

                        {/* Private Toggle */}
                        <div className="flex items-center gap-3 mb-3">
                            <button onClick={() => setIsPrivate(!isPrivate)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${isPrivate ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                <span className="text-sm">{isPrivate ? 'Private' : 'Public'}</span>
                            </button>
                        </div>

                        {isPrivate && (
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Room password"
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 mb-3 bg-white/80" />
                        )}

                        <button onClick={handleCreateRoom} disabled={isCreating}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            {isCreating ? <span className="animate-pulse">Creating...</span> : <><Plus className="w-4 h-4" /> Create Room</>}
                        </button>
                    </div>

                    {/* Join Room */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg"><LogIn className="w-5 h-5 text-purple-600" /></div>
                            <h2 className="text-xl font-semibold text-gray-800">Join Room</h2>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">Enter a room code to join an existing canvas.</p>

                        <input type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} placeholder="Room code (e.g. ABC123)"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 mb-3 bg-white/80 uppercase tracking-wider" maxLength={10} />

                        <input type="password" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} placeholder="Password (if private)"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 mb-3 bg-white/80" />

                        <button onClick={handleJoinRoom} disabled={isJoining}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            {isJoining ? <span className="animate-pulse">Joining...</span> : <><LogIn className="w-4 h-4" /> Join Room</>}
                        </button>
                    </div>
                </div>

                {/* Recent Rooms */}
                {recentRooms.length > 0 && (
                    <div className="max-w-2xl mx-auto mt-8">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Recent Rooms</h3>
                        <div className="flex flex-wrap gap-2">
                            {recentRooms.map((room) => (
                                <button key={room.code} onClick={() => { setRoomCode(room.code); setJoinPassword(''); }}
                                    className="px-4 py-2 bg-white/60 hover:bg-white rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-indigo-300 flex items-center gap-2">
                                    <span className="font-medium">{room.code}</span>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-500 truncate max-w-[120px]">{room.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
