import { useState } from 'react';
import { Share2, Download, LogOut, Lock, Unlock, Check } from 'lucide-react';
import { Room } from '../../types';
import { Button } from '../ui/Button';
import { PrivacyPopover } from './PrivacyPopover';

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
    const [linkCopied, setLinkCopied] = useState(false);

    const password = room?.settings?.passwordPlain;
    const isPrivate = room?.settings?.isPrivate;

    const handleShare = () => {
        onShare();
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    return (
        <header className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 flex items-center justify-between relative">
            {/* Left: Room info */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
                <div className="min-w-0">
                    <h1 className="font-semibold text-gray-900 text-sm sm:text-base m-0 flex items-center gap-1 sm:gap-2">
                        <span className="truncate max-w-[80px] sm:max-w-[200px]">{room?.name || 'Loading...'}</span>

                        {/* Lock icon - clickable for admins */}
                        <div className="relative flex-shrink-0">
                            <button
                                onClick={() => isAdmin && setShowPasswordPopover(!showPasswordPopover)}
                                className={`p-1 rounded border-none bg-transparent flex items-center transition-colors hover:bg-gray-100 ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                                title={isAdmin ? (isPrivate ? 'Click to view/change privacy' : 'Click to make private') : (isPrivate ? 'Private room' : 'Public room')}
                            >
                                {isPrivate ? (
                                    <Lock className={`w-3 h-3 sm:w-4 sm:h-4 ${isAdmin ? 'text-indigo-500' : 'text-gray-400'}`} />
                                ) : (
                                    <Unlock className={`w-3 h-3 sm:w-4 sm:h-4 ${isAdmin ? 'text-green-500' : 'text-gray-400'}`} />
                                )}
                            </button>

                            {/* Privacy popover */}
                            <PrivacyPopover
                                show={showPasswordPopover}
                                isPrivate={!!isPrivate}
                                password={password}
                                isAdmin={isAdmin}
                                onClose={() => setShowPasswordPopover(false)}
                            />
                        </div>
                    </h1>
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="hidden sm:inline font-mono">{roomCode}</span>
                        <span>{fps} FPS</span>
                        <span>{latency}ms</span>
                    </div>
                </div>
            </div>

            {/* Center: Logo - smaller on mobile */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
                <img
                    src="/logo.png"
                    alt="Collaborative Canvas"
                    className="h-8 sm:h-10 lg:h-12"
                />
            </div>

            {/* Right: Actions - icon only on mobile */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="secondary" onClick={handleShare} className="hover:bg-gray-100" title="Share">
                    {linkCopied ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Share2 className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Share'}</span>
                </Button>

                <Button variant="secondary" onClick={onExport} className="hover:bg-gray-100" title="Export">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </Button>

                <Button variant="danger" onClick={onLeave} className="hover:bg-red-50" title="Leave">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Leave</span>
                </Button>
            </div>
        </header>
    );
}
