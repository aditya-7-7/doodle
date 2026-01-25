import { useState } from 'react';
import { Palette, Share2, Download, LogOut, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { Room, SocketEvents } from '../../types';
import { socketService } from '../../services';

interface RoomHeaderProps {
    room: Room | null;
    roomCode: string;
    isConnected: boolean;
    fps: number;
    latency: number;
    isAdmin: boolean;
    onShare: () => void;
    onExport: () => void;
    onLeave: () => void;
}

export function RoomHeader({ room, roomCode, isConnected, fps, latency, isAdmin, onShare, onExport, onLeave }: RoomHeaderProps) {
    const [showPasswordPopover, setShowPasswordPopover] = useState(false);
    const [showPasswordText, setShowPasswordText] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const password = room?.settings?.passwordPlain;
    const isPrivate = room?.settings?.isPrivate;

    const handleTogglePrivacy = () => {
        if (!isAdmin) return;

        if (isPrivate) {
            // Making public - just toggle
            socketService.emit(SocketEvents.ROOM_UPDATE_PRIVACY, { isPrivate: false });
            setShowPasswordPopover(false);
        } else {
            // Making private - need password
            if (!newPassword.trim()) {
                alert('Please enter a password to make the room private');
                return;
            }
            socketService.emit(SocketEvents.ROOM_UPDATE_PRIVACY, { isPrivate: true, password: newPassword.trim() });
            setNewPassword('');
            setShowPasswordPopover(false);
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Palette className="w-6 h-6 text-indigo-600" />
                <div>
                    <h1 className="font-semibold text-gray-800 flex items-center gap-2">
                        {room?.name || 'Loading...'}

                        {/* Lock icon - clickable for admins */}
                        <div className="relative">
                            <button
                                onClick={() => isAdmin && setShowPasswordPopover(!showPasswordPopover)}
                                className={`p-1 rounded ${isAdmin ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-default'}`}
                                title={isAdmin ? (isPrivate ? 'Click to view/change privacy' : 'Click to make private') : (isPrivate ? 'Private room' : 'Public room')}
                            >
                                {isPrivate ? (
                                    <Lock className={`w-4 h-4 ${isAdmin ? 'text-indigo-500' : 'text-gray-400'}`} />
                                ) : (
                                    <Unlock className={`w-4 h-4 ${isAdmin ? 'text-green-500' : 'text-gray-400'}`} />
                                )}
                            </button>

                            {/* Privacy popover - only for admins */}
                            {showPasswordPopover && isAdmin && (
                                <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-lg border p-3 z-50 min-w-[220px]">
                                    <div className="text-xs text-gray-500 mb-2">Room Privacy</div>

                                    {isPrivate && password ? (
                                        <>
                                            {/* Show password section */}
                                            <div className="mb-3">
                                                <div className="text-xs text-gray-400 mb-1">Current Password</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm flex-1">
                                                        {showPasswordText ? password : '•'.repeat(password.length)}
                                                    </span>
                                                    <button
                                                        onClick={() => setShowPasswordText(!showPasswordText)}
                                                        className="p-1 hover:bg-gray-100 rounded"
                                                        title={showPasswordText ? 'Hide password' : 'Show password'}
                                                    >
                                                        {showPasswordText ? (
                                                            <EyeOff className="w-4 h-4 text-gray-500" />
                                                        ) : (
                                                            <Eye className="w-4 h-4 text-gray-500" />
                                                        )}
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(password);
                                                    }}
                                                    className="mt-1 text-xs text-indigo-600 hover:underline"
                                                >
                                                    Copy password
                                                </button>
                                            </div>
                                            <hr className="my-2" />
                                            {/* Toggle to public */}
                                            <button
                                                onClick={handleTogglePrivacy}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg"
                                            >
                                                <Unlock className="w-4 h-4" />
                                                Make Public
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Input for new password */}
                                            <div className="mb-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-2 py-1 text-sm border rounded"
                                                />
                                            </div>
                                            {/* Toggle to private */}
                                            <button
                                                onClick={handleTogglePrivacy}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            >
                                                <Lock className="w-4 h-4" />
                                                Make Private
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-mono">{roomCode}</span>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span>{fps} FPS</span>
                        <span>{latency}ms</span>
                    </div>
                </div>
            </div>

            {/* Click outside to close popover */}
            {showPasswordPopover && (
                <div className="fixed inset-0 z-40" onClick={() => setShowPasswordPopover(false)} />
            )}

            <div className="flex items-center gap-2">
                <button onClick={onShare} className="px-3 py-1.5 flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Share2 className="w-4 h-4" />
                    Share
                </button>
                <button onClick={onExport} className="px-3 py-1.5 flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Download className="w-4 h-4" />
                    Export
                </button>
                <button onClick={onLeave} className="px-3 py-1.5 flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">
                    <LogOut className="w-4 h-4" />
                    Leave
                </button>
            </div>
        </header>
    );
}
