import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomSocket, useCanvasDrawing } from '../hooks';
import { useRoomStore, useUserStore } from '../stores';
import { socketService, canvasService } from '../services';
import { SocketEvents } from '../types';
import { Toolbar, CanvasArea, UsersSidebar, RoomHeader, JoinRoomModal } from '../components/room';

export default function RoomPage() {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const { room, members } = useRoomStore();
    const { sessionId } = useUserStore();

    // custom hooks for socket and drawing logic
    const { isConnected, fps, latency, showJoinForm, joinName, setJoinName, joinPassword, setJoinPassword, joinError, handleJoinSubmit } = useRoomSocket(roomCode);
    const { canvasRef, overlayCanvasRef, containerRef, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, textPosition, setTextPosition, textInput, setTextInput, handleTextSubmit, fillColor, setFillColor, fontSize, setFontSize, isPanning } = useCanvasDrawing();

    // get current users admin status
    const currentMember = members.find(m => m.sessionId === sessionId);
    const isAdmin = currentMember?.isAdmin || false;

    // action handlers
    const handleUndo = useCallback(() => socketService.emit(SocketEvents.HISTORY_UNDO), []);
    const handleRedo = useCallback(() => socketService.emit(SocketEvents.HISTORY_REDO), []);
    const handleUndoPersonal = useCallback(() => socketService.emit(SocketEvents.HISTORY_UNDO_PERSONAL), []);
    const handleRedoPersonal = useCallback(() => socketService.emit(SocketEvents.HISTORY_REDO_PERSONAL), []);

    const handleClear = useCallback(() => {
        if (confirm('Clear the entire canvas?')) {
            canvasService.clear();
            socketService.emit(SocketEvents.DRAW_CLEAR);
        }
    }, []);

    const handleExport = useCallback(() => {
        const dataUrl = canvasService.toDataURL();
        if (dataUrl) {
            const link = document.createElement('a');
            link.download = `${room?.name || 'canvas'}.png`;
            link.href = dataUrl;
            link.click();
        }
    }, [room?.name]);

    const handleShare = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
    }, []);

    const handleKick = useCallback((targetSessionId: string) => {
        if (confirm('Kick this user?')) {
            socketService.emit(SocketEvents.ROOM_KICK, { targetSessionId });
        }
    }, []);

    const handleLeave = useCallback(() => {
        if (confirm('Leave this room?')) navigate('/');
    }, [navigate]);

    // show join form for users opening shared links
    if (showJoinForm) {
        return (
            <JoinRoomModal
                roomCode={roomCode || ''}
                joinName={joinName}
                setJoinName={setJoinName}
                joinPassword={joinPassword}
                setJoinPassword={setJoinPassword}
                joinError={joinError}
                onSubmit={handleJoinSubmit}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <RoomHeader
                room={room}
                roomCode={roomCode || ''}
                isConnected={isConnected}
                fps={fps}
                latency={latency}
                isAdmin={isAdmin}
                onShare={handleShare}
                onExport={handleExport}
                onLeave={handleLeave}
            />

            <div className="flex flex-1 overflow-hidden">
                <Toolbar
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onUndoPersonal={handleUndoPersonal}
                    onRedoPersonal={handleRedoPersonal}
                    onClear={handleClear}
                    fillColor={fillColor}
                    setFillColor={setFillColor}
                    fontSize={fontSize}
                    setFontSize={setFontSize}
                />

                <CanvasArea
                    canvasRef={canvasRef}
                    overlayCanvasRef={overlayCanvasRef}
                    containerRef={containerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onWheel={handleWheel}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    textPosition={textPosition}
                    textInput={textInput}
                    setTextInput={setTextInput}
                    onTextSubmit={handleTextSubmit}
                    onTextCancel={() => setTextPosition(null)}
                    isPanning={isPanning}
                />

                <UsersSidebar
                    members={members}
                    currentSessionId={sessionId}
                    isAdmin={isAdmin}
                    onKick={handleKick}
                />
            </div>
        </div>
    );
}
