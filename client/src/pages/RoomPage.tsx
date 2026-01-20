import { useEffect, useCallback, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Palette, Users, Share2, Undo2, Redo2, Trash2,
    MousePointer2, Pencil, Eraser, Download, LogOut,
    Square, Circle, Minus, Type, X, Lock
} from 'lucide-react';
import { socketService, sessionService, canvasService } from '../services';
import { useRoomStore, useUserStore, useCanvasStore } from '../stores';
import { SocketEvents, COLORS, STROKE_WIDTHS, ShapeType } from '../types';

export default function RoomPage() {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);  // For shape preview
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
    const strokePointsRef = useRef<number[][]>([]);

    const { room, members, setRoom, setMembers, addMember, removeMember, setError } = useRoomStore();
    const { sessionId, displayName, color, setColor, setIsAdmin, initialize, setDisplayName } = useUserStore();
    const {
        currentTool, currentShape, strokeColor, strokeWidth,
        setCurrentTool, setCurrentShape, setStrokeColor, setStrokeWidth,
        remoteCursors, updateRemoteCursor, removeRemoteCursor, clearRemoteCursors,
        setIsDrawing, isDrawing
    } = useCanvasStore();

    const [showShareModal, setShowShareModal] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [showShapePicker, setShowShapePicker] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [textPosition, setTextPosition] = useState<{ x: number, y: number } | null>(null);
    const [fps, setFps] = useState(0);
    const [latency, setLatency] = useState(0);

    // Join form state (for users opening shared links)
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [joinName, setJoinName] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [joinError, setJoinError] = useState('');

    // Get current user's admin status
    const currentMember = members.find(m => m.sessionId === sessionId);
    const isAdmin = currentMember?.isAdmin || false;

    // Replay a drawing operation
    const replayOperation = useCallback((op: any) => {
        if (op.type === 'stroke' && op.data) {
            const points = op.data.points;
            for (let i = 0; i < points.length - 1; i++) {
                canvasService.drawLine(
                    points[i][0], points[i][1],
                    points[i + 1][0], points[i + 1][1],
                    COLORS[op.data.colorIndex] || '#000000',
                    op.data.width || 3
                );
            }
        } else if (op.type === 'erase' && op.data) {
            const points = op.data.points || [];
            for (const point of points) {
                canvasService.erase(point[0], point[1], op.data.size || 20);
            }
        } else if (op.type === 'shape' && op.data) {
            canvasService.drawShape(
                op.data.shapeType,
                op.data.startX, op.data.startY,
                op.data.endX, op.data.endY,
                COLORS[op.data.colorIndex] || '#000000',
                op.data.width || 3
            );
        } else if (op.type === 'text' && op.data) {
            canvasService.drawText(
                op.data.text,
                op.data.x, op.data.y,
                op.data.fontSize || 24,
                COLORS[op.data.colorIndex] || '#000000'
            );
        } else if (op.type === 'clear') {
            canvasService.clear();
        }
    }, []);

    // Initialize user and connect to room
    useEffect(() => {
        initialize();

        // Get displayName from store or directly from localStorage (for page refresh)
        const storedName = displayName || sessionService.getDisplayName();
        if (!storedName) {
            // No display name - show join form for shared links
            setShowJoinForm(true);
            return;
        }

        // Clear any stale cursors from previous sessions
        clearRemoteCursors();

        const socket = socketService.connect();

        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        socket.on(SocketEvents.ROOM_JOINED, (data: any) => {
            setRoom(data.room);
            setMembers(data.members);

            const me = data.members.find((m: any) => m.sessionId === sessionId);
            if (me) {
                setColor(me.color);
                setIsAdmin(me.isAdmin);
            }

            canvasService.clear();

            if (data.snapshot && canvasService.getCanvas()) {
                canvasService.loadImage(data.snapshot).then(() => {
                    if (data.operations) {
                        data.operations.forEach((op: any) => replayOperation(op));
                    }
                });
            } else if (data.operations) {
                data.operations.forEach((op: any) => replayOperation(op));
            }
        });

        // Use full members list from server for guaranteed sync
        socket.on(SocketEvents.ROOM_USER_JOINED, (data: any) => {
            if (data.members) {
                setMembers(data.members);  // Use full list from server
            } else {
                addMember(data.member);    // Fallback to incremental add
            }
        });
        socket.on(SocketEvents.ROOM_USER_LEFT, (data: any) => {
            if (data.members) {
                setMembers(data.members);  // Use full list from server
            } else {
                removeMember(data.sessionId);
            }
            removeRemoteCursor(data.sessionId);
        });

        socket.on(SocketEvents.DRAW_STROKE, (data: any) => {
            if (data.sessionId !== sessionId) {
                data.commands.forEach((cmd: number[]) => executeDrawCommand(cmd));
            }
        });

        socket.on(SocketEvents.DRAW_SHAPE, (data: any) => {
            if (data.sessionId !== sessionId) {
                canvasService.drawShape(data.shapeType, data.startX, data.startY, data.endX, data.endY, COLORS[data.colorIndex] || '#000000', data.width);
            }
        });

        socket.on(SocketEvents.DRAW_TEXT, (data: any) => {
            if (data.sessionId !== sessionId) {
                canvasService.drawText(data.text, data.x, data.y, data.fontSize || 24, COLORS[data.colorIndex] || '#000000');
            }
        });

        socket.on(SocketEvents.DRAW_CLEAR, () => canvasService.clear());

        socket.on(SocketEvents.CURSOR_UPDATE, (data: any) => {
            if (data.sessionId !== sessionId) {
                updateRemoteCursor({ sessionId: data.sessionId, displayName: data.displayName, x: data.x, y: data.y, color: data.color });
            }
        });

        socket.on(SocketEvents.HISTORY_SYNC, (data: any) => {
            socket.emit(SocketEvents.ROOM_JOIN, { sessionId: sessionService.getSessionId(), displayName, roomCode });
        });

        socket.on(SocketEvents.ROOM_KICKED, (data: any) => {
            if (data.targetSessionId === sessionId) {
                alert('You have been kicked from the room');
                navigate('/');
            }
        });

        socket.on(SocketEvents.ROOM_ERROR, (data: any) => {
            setError(data.message);
            if (data.message === 'Room not found') navigate('/');
        });

        socket.emit(SocketEvents.ROOM_JOIN, { sessionId: sessionService.getSessionId(), displayName: storedName, roomCode });

        // Cleanup - remove all listeners before disconnecting
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off(SocketEvents.ROOM_JOINED);
            socket.off(SocketEvents.ROOM_USER_JOINED);
            socket.off(SocketEvents.ROOM_USER_LEFT);
            socket.off(SocketEvents.DRAW_STROKE);
            socket.off(SocketEvents.DRAW_SHAPE);
            socket.off(SocketEvents.DRAW_TEXT);
            socket.off(SocketEvents.DRAW_CLEAR);
            socket.off(SocketEvents.CURSOR_UPDATE);
            socket.off(SocketEvents.HISTORY_SYNC);
            socket.off(SocketEvents.ROOM_KICKED);
            socket.off(SocketEvents.ROOM_ERROR);
            socketService.disconnect();
        };
    }, [roomCode, displayName]);

    useEffect(() => {
        if (canvasRef.current) {
            canvasService.setCanvas(canvasRef.current);
            canvasService.clear();
        }
    }, [canvasRef.current]);

    // FPS counter
    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        let animId: number;

        const measureFps = () => {
            frameCount++;
            const now = performance.now();
            if (now - lastTime >= 1000) {
                setFps(frameCount);
                frameCount = 0;
                lastTime = now;
            }
            animId = requestAnimationFrame(measureFps);
        };
        animId = requestAnimationFrame(measureFps);

        return () => cancelAnimationFrame(animId);
    }, []);

    // Latency ping (every 5 seconds)
    useEffect(() => {
        const ping = () => {
            const start = Date.now();
            const socket = socketService.getSocket();
            if (socket) {
                socket.emit('ping', {}, () => {
                    setLatency(Date.now() - start);
                });
            }
        };
        ping();
        const interval = setInterval(ping, 5000);
        return () => clearInterval(interval);
    }, []);

    const executeDrawCommand = useCallback((cmd: number[]) => {
        const type = cmd[0];
        if (type === 0) canvasService.drawLine(cmd[1], cmd[2], cmd[3], cmd[4], COLORS[cmd[5] || 0], cmd[6] || 3);
        else if (type === 1) canvasService.erase(cmd[1], cmd[2], cmd[3] || 20);
    }, []);

    // Clear overlay canvas
    const clearOverlay = () => {
        if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
    };

    // Draw shape preview on overlay
    const drawShapePreview = (startX: number, startY: number, endX: number, endY: number) => {
        if (!overlayCanvasRef.current) return;
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (!ctx) return;

        clearOverlay();

        const sX = startX * overlayCanvasRef.current.width;
        const sY = startY * overlayCanvasRef.current.height;
        const eX = endX * overlayCanvasRef.current.width;
        const eY = endY * overlayCanvasRef.current.height;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        if (currentShape === 'rect') {
            ctx.strokeRect(sX, sY, eX - sX, eY - sY);
        } else if (currentShape === 'circle') {
            const radius = Math.sqrt(Math.pow(eX - sX, 2) + Math.pow(eY - sY, 2));
            ctx.arc(sX, sY, radius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (currentShape === 'line') {
            ctx.moveTo(sX, sY);
            ctx.lineTo(eX, eY);
            ctx.stroke();
        }
    };

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        const point = canvasService.normalizePoint(e.clientX, e.clientY);

        if (currentTool === 'text') {
            setTextPosition(point);
            return;
        }

        if (currentTool === 'shapes') {
            shapeStartRef.current = point;
            setIsDrawing(true);
            return;
        }

        if (currentTool !== 'brush' && currentTool !== 'eraser') return;

        setIsDrawing(true);
        lastPointRef.current = point;
        strokePointsRef.current = [[point.x, point.y]];
    }, [currentTool, setIsDrawing]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        const point = canvasService.normalizePoint(e.clientX, e.clientY);

        socketService.emit(SocketEvents.CURSOR_MOVE, { x: point.x, y: point.y, color });

        if (currentTool === 'shapes' && isDrawing && shapeStartRef.current) {
            drawShapePreview(shapeStartRef.current.x, shapeStartRef.current.y, point.x, point.y);
            return;
        }

        if (!isDrawing || !lastPointRef.current) return;

        const colorIndex = COLORS.indexOf(strokeColor);

        if (currentTool === 'brush') {
            canvasService.drawLine(lastPointRef.current.x, lastPointRef.current.y, point.x, point.y, strokeColor, strokeWidth);
            canvasService.sendDrawCommand([0, lastPointRef.current.x, lastPointRef.current.y, point.x, point.y, colorIndex, strokeWidth]);
            strokePointsRef.current.push([point.x, point.y]);
        } else if (currentTool === 'eraser') {
            canvasService.erase(point.x, point.y, strokeWidth * 3);
            canvasService.sendDrawCommand([1, point.x, point.y, strokeWidth * 3]);
            strokePointsRef.current.push([point.x, point.y]);
        }

        lastPointRef.current = point;
    }, [isDrawing, currentTool, strokeColor, strokeWidth, color, currentShape]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        const point = canvasService.normalizePoint(e.clientX, e.clientY);

        if (currentTool === 'shapes' && shapeStartRef.current) {
            clearOverlay();
            const colorIndex = COLORS.indexOf(strokeColor);

            // Draw final shape on main canvas
            canvasService.drawShape(currentShape, shapeStartRef.current.x, shapeStartRef.current.y, point.x, point.y, strokeColor, strokeWidth);

            // Send and save shape
            socketService.emit(SocketEvents.DRAW_SHAPE, {
                shapeType: currentShape,
                startX: shapeStartRef.current.x,
                startY: shapeStartRef.current.y,
                endX: point.x,
                endY: point.y,
                colorIndex,
                width: strokeWidth,
            });

            shapeStartRef.current = null;
            setIsDrawing(false);
            return;
        }

        if (strokePointsRef.current.length > 1) {
            const colorIndex = COLORS.indexOf(strokeColor);
            socketService.emit('draw:stroke-end', {
                points: strokePointsRef.current,
                colorIndex,
                width: strokeWidth,
                tool: currentTool,
            });
        }

        setIsDrawing(false);
        lastPointRef.current = null;
        strokePointsRef.current = [];
    }, [setIsDrawing, strokeColor, strokeWidth, currentTool, currentShape]);

    const handleTextSubmit = () => {
        if (!textPosition || !textInput.trim()) return;

        const colorIndex = COLORS.indexOf(strokeColor);
        canvasService.drawText(textInput, textPosition.x, textPosition.y, 24, strokeColor);

        socketService.emit(SocketEvents.DRAW_TEXT, {
            text: textInput,
            x: textPosition.x,
            y: textPosition.y,
            fontSize: 24,
            colorIndex,
        });

        setTextInput('');
        setTextPosition(null);
    };

    const handleUndo = () => socketService.emit(SocketEvents.HISTORY_UNDO);
    const handleRedo = () => socketService.emit(SocketEvents.HISTORY_REDO);
    const handleClear = () => {
        if (confirm('Clear the entire canvas?')) {
            canvasService.clear();
            socketService.emit(SocketEvents.DRAW_CLEAR);
        }
    };

    const handleExport = () => {
        const dataUrl = canvasService.toDataURL();
        if (dataUrl) {
            const link = document.createElement('a');
            link.download = `${room?.name || 'canvas'}.png`;
            link.href = dataUrl;
            link.click();
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowShareModal(true);
        setTimeout(() => setShowShareModal(false), 2000);
    };

    const handleKick = (targetSessionId: string) => {
        if (confirm('Kick this user?')) {
            socketService.emit(SocketEvents.ROOM_KICK, { targetSessionId });
        }
    };

    const handleLeave = () => {
        if (confirm('Leave this room?')) navigate('/');
    };

    // Handler for join form submission (shared links)
    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinName.trim()) {
            setJoinError('Please enter your display name');
            return;
        }

        // Save to localStorage via sessionService (for persistence)
        sessionService.setDisplayName(joinName.trim());

        // Update the user store state using the hook's setter (triggers re-render and useEffect)
        setDisplayName(joinName.trim());

        // Hide the form - the useEffect will now detect displayName and connect
        setShowJoinForm(false);
        setJoinError('');
    };

    // Show join form for users opening shared links
    if (showJoinForm) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Palette className="w-8 h-8 text-indigo-600" />
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Join Room
                            </h1>
                        </div>
                        <p className="text-gray-600 text-sm">
                            Enter your name to join room <span className="font-mono font-bold text-indigo-600">{roomCode}</span>
                        </p>
                    </div>

                    <form onSubmit={handleJoinSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Display Name
                            </label>
                            <input
                                type="text"
                                value={joinName}
                                onChange={(e) => setJoinName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                autoFocus
                                maxLength={50}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Lock className="w-4 h-4 inline mr-1" />
                                Room Password (if required)
                            </label>
                            <input
                                type="password"
                                value={joinPassword}
                                onChange={(e) => setJoinPassword(e.target.value)}
                                placeholder="Leave empty if public room"
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                        </div>

                        {joinError && (
                            <p className="text-red-500 text-sm">{joinError}</p>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition"
                        >
                            Join Room
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                        >
                            Go to Home
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                        <Palette className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-gray-800">{room?.name || 'Loading...'}</h1>
                        <p className="text-xs text-gray-500">Code: {roomCode}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Performance Metrics */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-xs text-gray-500">
                        <span>{fps} FPS</span>
                        <span className="text-gray-300">|</span>
                        <span>{latency}ms</span>
                    </div>

                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{members.length}</span>
                    </div>
                    <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-lg" title="Share"><Share2 className="w-5 h-5 text-gray-600" /></button>
                    <button onClick={handleExport} className="p-2 hover:bg-gray-100 rounded-lg" title="Export"><Download className="w-5 h-5 text-gray-600" /></button>
                    <button onClick={handleLeave} className="p-2 hover:bg-red-50 rounded-lg" title="Leave"><LogOut className="w-5 h-5 text-red-500" /></button>
                </div>
            </header>

            <div className="flex-1 flex">
                {/* Toolbar */}
                <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-1">
                    <ToolButton icon={<Pencil className="w-5 h-5" />} active={currentTool === 'brush'} onClick={() => setCurrentTool('brush')} title="Brush" />
                    <ToolButton icon={<Eraser className="w-5 h-5" />} active={currentTool === 'eraser'} onClick={() => setCurrentTool('eraser')} title="Eraser" />

                    {/* Shape tools with dropdown */}
                    <div className="relative">
                        <ToolButton
                            icon={currentShape === 'rect' ? <Square className="w-5 h-5" /> : currentShape === 'circle' ? <Circle className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                            active={currentTool === 'shapes'}
                            onClick={() => { setCurrentTool('shapes'); setShowShapePicker(!showShapePicker); }}
                            title="Shapes"
                        />
                        {showShapePicker && currentTool === 'shapes' && (
                            <div className="absolute left-full top-0 ml-2 bg-white shadow-lg rounded-lg border p-2 flex gap-1 z-50">
                                <button onClick={() => { setCurrentShape('rect'); setShowShapePicker(false); }} className={`p-2 rounded ${currentShape === 'rect' ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}><Square className="w-4 h-4" /></button>
                                <button onClick={() => { setCurrentShape('circle'); setShowShapePicker(false); }} className={`p-2 rounded ${currentShape === 'circle' ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}><Circle className="w-4 h-4" /></button>
                                <button onClick={() => { setCurrentShape('line'); setShowShapePicker(false); }} className={`p-2 rounded ${currentShape === 'line' ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}><Minus className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>

                    <ToolButton icon={<Type className="w-5 h-5" />} active={currentTool === 'text'} onClick={() => setCurrentTool('text')} title="Text" />

                    <div className="w-8 h-px bg-gray-200 my-2" />

                    <button onClick={handleUndo} className="p-2 hover:bg-gray-100 rounded-lg" title="Undo"><Undo2 className="w-5 h-5 text-gray-600" /></button>
                    <button onClick={handleRedo} className="p-2 hover:bg-gray-100 rounded-lg" title="Redo"><Redo2 className="w-5 h-5 text-gray-600" /></button>

                    <div className="w-8 h-px bg-gray-200 my-2" />
                    <button onClick={handleClear} className="p-2 hover:bg-red-50 rounded-lg" title="Clear"><Trash2 className="w-5 h-5 text-red-500" /></button>

                    <div className="flex-1" />

                    {/* Stroke Width */}
                    <div className="flex flex-col gap-1">
                        {STROKE_WIDTHS.slice(0, 4).map((w) => (
                            <button key={w} onClick={() => setStrokeWidth(w)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${strokeWidth === w ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}>
                                <div className="rounded-full bg-gray-800" style={{ width: w, height: w }} />
                            </button>
                        ))}
                    </div>

                    <div className="w-8 h-px bg-gray-200 my-2" />

                    {/* Colors */}
                    <div className="flex flex-col gap-1">
                        {COLORS.slice(0, 6).map((c) => (
                            <button key={c} onClick={() => setStrokeColor(c)} className={`w-8 h-8 rounded-lg border-2 ${strokeColor === c ? 'border-indigo-500 scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </aside>

                {/* Canvas Area */}
                <main className="flex-1 relative overflow-hidden bg-gray-100" ref={containerRef}>
                    <canvas ref={canvasRef} width={1920} height={1080} className="absolute inset-0 w-full h-full bg-white shadow-inner cursor-crosshair" style={{ touchAction: 'none' }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} />
                    <canvas ref={overlayCanvasRef} width={1920} height={1080} className="absolute inset-0 w-full h-full pointer-events-none" style={{ touchAction: 'none' }} />

                    {/* Text Input Modal */}
                    {textPosition && (
                        <div className="absolute z-50 bg-white shadow-xl rounded-lg p-3 border" style={{ left: `${textPosition.x * 100}%`, top: `${textPosition.y * 100}%`, transform: 'translate(-50%, -100%)' }}>
                            <div className="flex gap-2">
                                <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()} placeholder="Enter text..." className="px-3 py-2 border rounded-lg text-sm" autoFocus />
                                <button onClick={handleTextSubmit} className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm">Add</button>
                                <button onClick={() => setTextPosition(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}

                    {/* Remote Cursors */}
                    {Array.from(remoteCursors.values()).map((cursor) => (
                        <div key={cursor.sessionId} className="absolute pointer-events-none" style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%`, transform: 'translate(-4px, -4px)' }}>
                            <MousePointer2 className="w-5 h-5" style={{ color: cursor.color, fill: cursor.color }} />
                            <span className="absolute left-5 top-0 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap" style={{ backgroundColor: cursor.color }}>{cursor.displayName}</span>
                        </div>
                    ))}
                </main>

                {/* Users Sidebar */}
                <aside className="w-48 bg-white border-l border-gray-200 p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Online ({members.length})</h3>
                    <div className="space-y-2">
                        {members.map((member) => (
                            <div key={member.sessionId} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 group">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                                <span className="text-sm text-gray-700 truncate flex-1">
                                    {member.displayName}{member.sessionId === sessionId && ' (You)'}
                                </span>
                                {member.isAdmin && <span className="text-xs text-indigo-500">Admin</span>}
                                {isAdmin && member.sessionId !== sessionId && (
                                    <button onClick={() => handleKick(member.sessionId)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded" title="Kick">
                                        <X className="w-3 h-3 text-red-500" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>
            </div>

            {showShareModal && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white rounded-lg shadow-lg">Link copied!</div>
            )}
        </div>
    );
}

function ToolButton({ icon, active, onClick, title }: { icon: React.ReactNode; active: boolean; onClick: () => void; title: string }) {
    return (
        <button onClick={onClick} className={`p-2 rounded-lg transition-all ${active ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`} title={title}>
            {icon}
        </button>
    );
}
