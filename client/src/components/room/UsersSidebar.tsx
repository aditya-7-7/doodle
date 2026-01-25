import { CSSProperties, useState } from 'react';
import { X, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { RoomMember } from '../../types';

interface UsersSidebarProps {
    members: RoomMember[];
    currentSessionId: string;
    isAdmin: boolean;
    onKick: (sessionId: string) => void;
}

const bgColor = (c: string): CSSProperties => ({ backgroundColor: c });

export function UsersSidebar({ members, currentSessionId, isAdmin, onKick }: UsersSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <>
            {/* Toggle button - always visible */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-l-lg p-2 shadow-md hover:bg-gray-50 transition-all ${isCollapsed ? 'translate-x-0' : 'translate-x-0'}`}
                style={{ right: isCollapsed ? 0 : 192 }}
                title={isCollapsed ? 'Show users' : 'Hide users'}
            >
                {isCollapsed ? (
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-600">{members.length}</span>
                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </div>
                ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
            </button>

            {/* Sidebar */}
            <aside className={`bg-white border-l border-gray-200 p-4 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 p-0 overflow-hidden opacity-0' : 'w-48 opacity-100'}`}>
                <h3 className="text-sm font-medium text-gray-500 mb-3 whitespace-nowrap">Online ({members.length})</h3>
                <div className="space-y-2">
                    {members.map((member) => (
                        <div key={member.sessionId} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 group whitespace-nowrap">
                            <div className="w-3 h-3 rounded-full shrink-0" style={bgColor(member.color)} />
                            <span className="text-sm text-gray-700 truncate flex-1">
                                {member.displayName}{member.sessionId === currentSessionId && ' (You)'}
                            </span>
                            {member.isAdmin && <span className="text-xs text-indigo-500">Admin</span>}
                            {isAdmin && member.sessionId !== currentSessionId && (
                                <button onClick={() => onKick(member.sessionId)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded shrink-0" title="Kick">
                                    <X className="w-3 h-3 text-red-500" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </aside>
        </>
    );
}
