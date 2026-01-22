import React, { useState, useMemo, useCallback, memo } from 'react';

interface RoomFormProps {
    displayName: string;
    onDisplayNameChange: (value: string) => void;
    canvasName: string;
    onCanvasNameChange: (value: string) => void;
    isPrivate: boolean;
    onPrivateChange: (value: boolean) => void;
    password: string;
    onPasswordChange: (value: string) => void;
    onCreateRoom: () => void;
    roomCode: string;
    onRoomCodeChange: (value: string) => void;
    joinPassword: string;
    onJoinPasswordChange: (value: string) => void;
    onJoinRoom: () => void;
    isLoading: boolean;
    error: string;
}

// Memoized input component
const GradientInput = memo<React.InputHTMLAttributes<HTMLInputElement>>(props => (
    <div className="room-form-input-wrapper">
        <div className="room-form-input-glow animated-gradient-fast" />
        <input {...props} className={`room-form-input relative z-10 ${props.className || ''}`} />
    </div>
));

// Constants
const PAD = 4, STRETCH = 8, COMPRESS = 5;
const SLIDE_MS = 300, BOUNCE_MS = 150, SETTLE_MS = 150;

// Pre-computed style objects
const baseSlider = { position: 'absolute' as const, top: PAD, bottom: PAD };
const idleTransition = 'all 0.35s cubic-bezier(0.4,0,0.2,1)';
const slideTransition = 'all 0.4s ease-out';
const bounceTransition = 'all 0.2s cubic-bezier(0.33,1,0.68,1)';
const panelTransition = 'opacity 0.25s ease, transform 0.25s ease';
const passwordTransition = 'max-height 0.2s ease, opacity 0.2s ease';

type Phase = 'idle' | 'sliding' | 'bounce' | 'settled';
type Dir = 'left' | 'right' | null;
type Tab = 'create' | 'join';

export const RoomForm: React.FC<RoomFormProps> = ({
    displayName, onDisplayNameChange, canvasName, onCanvasNameChange,
    isPrivate, onPrivateChange, password, onPasswordChange, onCreateRoom,
    roomCode, onRoomCodeChange, joinPassword, onJoinPasswordChange, onJoinRoom,
    isLoading, error,
}) => {
    const [tab, setTab] = useState<Tab>('create');
    const [dir, setDir] = useState<Dir>(null);
    const [phase, setPhase] = useState<Phase>('idle');

    const isJoin = tab === 'join';
    const isIdle = phase === 'idle' || phase === 'settled';

    const switchTab = useCallback((t: Tab) => {
        if (t === tab) return;
        setDir(t === 'join' ? 'right' : 'left');
        setTab(t);
        setPhase('sliding');
        setTimeout(() => {
            setPhase('bounce');
            setTimeout(() => {
                setPhase('settled');
                setTimeout(() => { setDir(null); setPhase('idle'); }, SETTLE_MS);
            }, BOUNCE_MS);
        }, SLIDE_MS);
    }, [tab]);

    const slider = useMemo<React.CSSProperties>(() => {
        if (isIdle) return {
            ...baseSlider,
            left: isJoin ? `calc(50% + ${PAD}px)` : PAD,
            width: `calc(50% - ${PAD * 2}px)`,
            borderRadius: 6,
            transition: idleTransition,
        };
        if (phase === 'sliding') return {
            ...baseSlider,
            left: dir === 'right' ? `calc(50% - ${STRETCH}% + ${PAD}px)` : PAD,
            width: `calc(50% + ${STRETCH}% - ${PAD * 2}px)`,
            borderRadius: 50,
            transition: slideTransition,
        };
        return {
            ...baseSlider,
            left: dir === 'right' ? `calc(50% + ${PAD}px + ${COMPRESS}%)` : PAD,
            width: `calc(50% - ${PAD * 2}px - ${COMPRESS}%)`,
            borderRadius: dir === 'right' ? '45px 6px 6px 45px' : '6px 45px 45px 6px',
            transition: bounceTransition,
        };
    }, [phase, dir, isJoin, isIdle]);

    const createPanel = useMemo<React.CSSProperties>(() => ({
        position: !isJoin ? 'relative' : 'absolute',
        top: 0, left: 0, right: 0,
        opacity: !isJoin ? 1 : 0,
        transform: !isJoin ? 'translateX(0)' : 'translateX(20px)',
        transition: panelTransition,
        pointerEvents: !isJoin ? 'auto' : 'none',
        visibility: !isJoin ? 'visible' : 'hidden',
    }), [isJoin]);

    const joinPanel = useMemo<React.CSSProperties>(() => ({
        position: isJoin ? 'relative' : 'absolute',
        top: 0, left: 0, right: 0,
        opacity: isJoin ? 1 : 0,
        transform: isJoin ? 'translateX(0)' : 'translateX(-20px)',
        transition: panelTransition,
        pointerEvents: isJoin ? 'auto' : 'none',
        visibility: isJoin ? 'visible' : 'hidden',
    }), [isJoin]);

    const passwordStyle = useMemo<React.CSSProperties>(() => ({
        maxHeight: isPrivate ? 60 : 0,
        opacity: isPrivate ? 1 : 0,
        overflow: 'hidden',
        transition: passwordTransition,
    }), [isPrivate]);

    const btnClass = `room-form-btn animated-gradient${isLoading ? ' opacity-60 cursor-not-allowed' : ''}`;

    return (
        <div className="room-form">
            <div className="room-form-tabs relative" style={{ overflow: 'hidden' }}>
                <div className="animated-gradient" style={slider} />
                <button
                    className={`room-form-tab relative z-10 ${!isJoin ? 'text-white' : 'text-gray-700 hover:text-gray-900'}`}
                    style={{ background: 'transparent', textShadow: !isJoin ? '0 1px 2px rgba(0,0,0,0.2)' : 'none' }}
                    onClick={() => switchTab('create')}
                >Create Room</button>
                <button
                    className={`room-form-tab relative z-10 ${isJoin ? 'text-white' : 'text-gray-700 hover:text-gray-900'}`}
                    style={{ background: 'transparent', textShadow: isJoin ? '0 1px 2px rgba(0,0,0,0.2)' : 'none' }}
                    onClick={() => switchTab('join')}
                >Join Room</button>
            </div>

            <div style={{ position: 'relative' }}>
                <div style={createPanel}>
                    <h2 className="room-form-title">Create Room</h2>
                    <div className="room-form-fields">
                        <GradientInput placeholder="Display Name" value={displayName} onChange={e => onDisplayNameChange(e.target.value)} maxLength={50} />
                        <GradientInput placeholder="Canvas Name" value={canvasName} onChange={e => onCanvasNameChange(e.target.value)} maxLength={100} />
                        <div className="room-form-toggle-container">
                            <span className={!isPrivate ? 'text-gray-800' : 'text-gray-400'}>Public</span>
                            <button type="button" className={`room-form-toggle-btn ${isPrivate ? 'animated-gradient' : 'bg-white'}`} onClick={() => onPrivateChange(!isPrivate)}>
                                <span className="room-form-toggle-knob" style={{ left: isPrivate ? 26 : 2, backgroundColor: isPrivate ? '#fff' : '#9ca3af' }} />
                            </button>
                            <span className={isPrivate ? 'text-gray-800' : 'text-gray-400'}>Private</span>
                        </div>
                        <div style={passwordStyle}>
                            <GradientInput placeholder="Room Password" type="password" value={password} onChange={e => onPasswordChange(e.target.value)} />
                        </div>
                        {error && <div className="room-form-error">{error}</div>}
                        <button className={btnClass} onClick={onCreateRoom} disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Room'}
                        </button>
                    </div>
                </div>

                <div style={joinPanel}>
                    <h2 className="room-form-title">Join Room</h2>
                    <div className="room-form-fields">
                        <GradientInput placeholder="Display Name" value={displayName} onChange={e => onDisplayNameChange(e.target.value)} maxLength={50} />
                        <GradientInput placeholder="Room Code (e.g. ABC123)" value={roomCode} onChange={e => onRoomCodeChange(e.target.value.toUpperCase())} maxLength={10} className="uppercase tracking-wider" />
                        <GradientInput placeholder="Password (if private)" type="password" value={joinPassword} onChange={e => onJoinPasswordChange(e.target.value)} />
                        {error && <div className="room-form-error">{error}</div>}
                        <button className={btnClass} onClick={onJoinRoom} disabled={isLoading}>
                            {isLoading ? 'Joining...' : 'Join Room'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomForm;
