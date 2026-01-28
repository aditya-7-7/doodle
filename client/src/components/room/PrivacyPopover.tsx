import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { socketService } from '../../services';
import { SocketEvents } from '../../types';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

interface PrivacyPopoverProps {
    show: boolean;
    isPrivate: boolean;
    password?: string;
    isAdmin: boolean;
    onClose: () => void;
}

// privacy popover component
// extracted from RoomHeader (manages room privacy settings)
export function PrivacyPopover({ show, isPrivate, password, isAdmin, onClose }: PrivacyPopoverProps) {
    const [showPasswordText, setShowPasswordText] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const { copied: copyConfirm, copyToClipboard } = useCopyToClipboard();

    if (!show || !isAdmin) return null;

    const handleTogglePrivacy = () => {
        if (isPrivate) {
            // making public just toggle
            socketService.emit(SocketEvents.ROOM_UPDATE_PRIVACY, { isPrivate: false });
            onClose();
        } else {
            // making private need password
            if (!newPassword.trim()) {
                alert('Please enter a password to make the room private');
                return;
            }
            socketService.emit(SocketEvents.ROOM_UPDATE_PRIVACY, { isPrivate: true, password: newPassword.trim() });
            setNewPassword('');
            onClose();
        }
    };

    const handleCopyPassword = () => {
        if (password) {
            copyToClipboard(password);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Popover */}
            <div className="absolute top-full left-0 mt-2 bg-white shadow-xl rounded-xl border border-gray-200 p-4 z-50 min-w-[260px]">
                {/* Header */}
                <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    {isPrivate ? (
                        <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    ) : (
                        <Unlock className="w-3.5 h-3.5 text-green-500" />
                    )}
                    Room Privacy
                </div>

                {isPrivate && password ? (
                    <>
                        {/* Show password section */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="text-[11px] text-gray-500 mb-2 uppercase tracking-wide">
                                Current Password
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[15px] flex-1 text-gray-800 font-medium">
                                    {showPasswordText ? password : '•'.repeat(password.length)}
                                </span>
                                <button
                                    onClick={() => setShowPasswordText(!showPasswordText)}
                                    className="p-2 bg-white border border-gray-200 cursor-pointer rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
                                    title={showPasswordText ? 'Hide password' : 'Show password'}
                                >
                                    {showPasswordText ? (
                                        <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                                    ) : (
                                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={handleCopyPassword}
                                className={`mt-2 text-sm bg-transparent border-none cursor-pointer font-medium transition-colors ${copyConfirm ? 'text-green-500' : 'text-indigo-500 hover:text-indigo-600'
                                    }`}
                            >
                                {copyConfirm ? '✓ Copied!' : '📋 Copy password'}
                            </button>
                        </div>

                        {/* Toggle to public */}
                        <Button variant="primary" gradient="green" onClick={handleTogglePrivacy} className="w-full">
                            <Unlock className="w-4 h-4" />
                            Make Public
                        </Button>
                    </>
                ) : (
                    <>
                        {/* Input for new password */}
                        <div className="mb-3">
                            <div className="text-[11px] text-gray-500 mb-2 uppercase tracking-wide">
                                Set Password
                            </div>
                            <Input
                                type="text"
                                placeholder="Enter password..."
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                fullWidth
                            />
                        </div>

                        {/* Toggle to private */}
                        <Button variant="primary" gradient="indigo" onClick={handleTogglePrivacy} className="w-full">
                            <Lock className="w-4 h-4" />
                            Make Private
                        </Button>
                    </>
                )}
            </div>
        </>
    );
}
