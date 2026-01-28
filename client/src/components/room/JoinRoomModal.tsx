import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Boxes } from '../ui/InteractiveGrid';

interface JoinRoomModalProps {
    roomCode: string;
    joinName: string;
    setJoinName: (name: string) => void;
    joinPassword: string;
    setJoinPassword: (password: string) => void;
    joinError: string;
    onSubmit: (e: React.FormEvent) => void;
}

// memoized gradient input same as roomform
const GradientInput = memo<React.InputHTMLAttributes<HTMLInputElement>>(props => (
    <div className="room-form-input-wrapper">
        <div className="room-form-input-glow animated-gradient-fast" />
        <input {...props} className={`room-form-input relative z-10 ${props.className || ''}`} />
    </div>
));

export function JoinRoomModal({ roomCode, joinName, setJoinName, joinPassword, setJoinPassword, joinError, onSubmit }: JoinRoomModalProps) {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
            {/* Interactive grid background - same as landing page */}
            <Boxes />

            {/* Form container */}
            <div className="relative z-10">
                <form onSubmit={onSubmit} className="room-form">
                    <h2 className="room-form-title">Join Room</h2>
                    <p className="text-center text-sm text-gray-600 mb-4">
                        Join room <span className="font-mono font-bold text-indigo-600">{roomCode}</span>
                    </p>

                    <div className="room-form-fields">
                        <GradientInput
                            placeholder="Display Name"
                            value={joinName}
                            onChange={e => setJoinName(e.target.value)}
                            maxLength={50}
                            autoFocus
                        />

                        <div className="flex items-center gap-2 text-sm text-gray-600 -mb-2">
                            <Lock className="w-4 h-4" />
                            <span>Password (if private room)</span>
                        </div>
                        <GradientInput
                            placeholder="Leave empty if public"
                            type="password"
                            value={joinPassword}
                            onChange={e => setJoinPassword(e.target.value)}
                        />

                        {joinError && <div className="room-form-error">{joinError}</div>}

                        <button type="submit" className="room-form-btn animated-gradient">
                            Join Room
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="room-form-btn bg-gray-200 text-gray-700 [text-shadow:none]"
                        >
                            Go to Home
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
