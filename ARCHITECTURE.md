# Collaborative Canvas - Architecture Documentation

## System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Browser["Browser/Mobile"]
        React["React App"]
        Canvas["HTML5 Canvas"]
    end
    
    subgraph "Hosting"
        Vercel["Vercel (Frontend)"]
        Render["Render (Backend)"]
    end
    
    subgraph "Server Layer"
        Express["Express.js Server"]
        SocketIO["Socket.IO WebSocket"]
        Handlers["Event Handlers"]
    end
    
    subgraph "Data Layer"
        MongoDB["MongoDB Atlas"]
        Operations["Drawing Operations"]
        Snapshots["Canvas Snapshots"]
        Rooms["Room Documents"]
    end
    
    Browser --> Vercel
    Vercel --> React
    React --> SocketIO
    SocketIO --> Render
    Render --> Express
    Express --> Handlers
    Handlers --> MongoDB
    MongoDB --> Operations
    MongoDB --> Snapshots
    MongoDB --> Rooms
```

---

## Client Architecture

```mermaid
graph LR
    subgraph "Pages"
        HomePage["HomePage"]
        RoomPage["RoomPage"]
    end
    
    subgraph "Components"
        CanvasArea["CanvasArea"]
        Toolbar["Toolbar"]
        Sidebar["Sidebar"]
        Header["Header"]
    end
    
    subgraph "Hooks"
        useCanvasDrawing["useCanvasDrawing"]
        useRoomSocket["useRoomSocket"]
        useViewport["useViewport"]
    end
    
    subgraph "Services"
        canvasService["canvasService"]
        socketService["socketService"]
        sessionService["sessionService"]
    end
    
    subgraph "Stores (Zustand)"
        canvasStore["canvasStore"]
        userStore["userStore"]
        roomStore["roomStore"]
    end
    
    RoomPage --> CanvasArea
    RoomPage --> Toolbar
    RoomPage --> Sidebar
    RoomPage --> Header
    
    CanvasArea --> useCanvasDrawing
    RoomPage --> useRoomSocket
    CanvasArea --> useViewport
    
    useCanvasDrawing --> canvasService
    useRoomSocket --> socketService
    
    useCanvasDrawing --> canvasStore
    RoomPage --> userStore
    RoomPage --> roomStore
```

---

## Server Architecture

```mermaid
graph TB
    subgraph "Entry Point"
        Server["server.ts"]
    end
    
    subgraph "Services"
        WebSocketService["WebSocketService"]
        DrawService["DrawService"]
        RoomService["RoomService"]
    end
    
    subgraph "Handlers"
        RoomHandler["roomHandler"]
        DrawHandler["drawHandler"]
        HistoryHandler["historyHandler"]
    end
    
    subgraph "Models (Mongoose)"
        Room["Room"]
        DrawingOperation["DrawingOperation"]
        CanvasSnapshot["CanvasSnapshot"]
    end
    
    Server --> WebSocketService
    WebSocketService --> RoomHandler
    WebSocketService --> DrawHandler
    WebSocketService --> HistoryHandler
    
    RoomHandler --> RoomService
    DrawHandler --> DrawService
    HistoryHandler --> DrawService
    
    RoomService --> Room
    DrawService --> DrawingOperation
    DrawService --> CanvasSnapshot
```

---

## WebSocket Event Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant MongoDB
    participant OtherClients
    
    Note over Client,OtherClients: Room Join Flow
    Client->>Server: ROOM_JOIN {roomCode, username}
    Server->>MongoDB: Find/Create Room
    MongoDB-->>Server: Room Data
    Server->>MongoDB: Get Operations
    MongoDB-->>Server: Operations List
    Server-->>Client: ROOM_JOINED {room, operations}
    Server->>OtherClients: ROOM_USER_JOINED {user}
    
    Note over Client,OtherClients: Drawing Flow
    Client->>Server: DRAW_STROKE {data}
    Server->>MongoDB: Save Operation
    MongoDB-->>Server: Saved
    Server->>OtherClients: DRAW_STROKE {data}
    
    Note over Client,OtherClients: Undo/Redo Flow
    Client->>Server: HISTORY_UNDO
    Server->>MongoDB: Mark Last Op Undone
    Server->>MongoDB: Get Active Operations
    Server-->>Client: HISTORY_SYNC {operations}
    Server->>OtherClients: HISTORY_SYNC {operations}
```

---

## Undo/Redo Architecture

```mermaid
graph TB
    subgraph "Operation Storage"
        DB[(MongoDB)]
        Op1["Op 1: isUndone=false"]
        Op2["Op 2: isUndone=false"]
        Op3["Op 3: isUndone=true"]
        Op4["Op 4: isUndone=false"]
    end
    
    subgraph "Global Undo/Redo"
        GU["Global Undo"]
        GR["Global Redo"]
    end
    
    subgraph "Personal Undo/Redo"
        PU["Personal Undo"]
        PR["Personal Redo"]
    end
    
    GU -->|"Finds last active op (any user)"| DB
    GR -->|"Finds oldest undone op (any user)"| DB
    PU -->|"Finds last active op (YOUR sessionId)"| DB
    PR -->|"Finds oldest undone op (YOUR sessionId)"| DB
    
    DB --> Op1
    DB --> Op2
    DB --> Op3
    DB --> Op4
```

### Undo/Redo Logic

| Type | Undo | Redo |
|------|------|------|
| **Global** | Last active op from ANY user → `isUndone=true` | Oldest undone op from ANY user → `isUndone=false` |
| **Personal** | Last active op from YOUR session → `isUndone=true` | Oldest undone op from YOUR session → `isUndone=false` |

---

## Data Models

### DrawingOperation
```typescript
{
  roomId: string,
  sessionId: string,      // Who drew it
  sequenceNumber: number, // Order in timeline
  type: 'stroke' | 'shape' | 'text' | 'clear',
  data: {
    points?: Point[],     // For strokes
    shape?: ShapeData,    // For shapes
    text?: TextData,      // For text
  },
  isUndone: boolean,      // Undo flag
  timestamp: Date
}
```

### Room
```typescript
{
  code: string,           // 6-char unique code
  name: string,
  createdBy: string,      // sessionId of creator
  users: [{
    sessionId: string,
    username: string,
    isAdmin: boolean
  }],
  createdAt: Date
}
```

### CanvasSnapshot
```typescript
{
  roomId: string,
  imageData: string,      // Base64 PNG
  sequenceNumber: number, // Snapshot point
  createdAt: Date
}
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **State Management** | Zustand |
| **Canvas** | HTML5 Canvas API |
| **Real-time** | Socket.IO |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Render |

---

## File Structure

```
collaborative-canvas/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── room/          # Room-specific (Toolbar, Canvas, Sidebar)
│   │   │   ├── toolbar/       # Toolbar content panels
│   │   │   └── ui/            # Reusable UI components
│   │   ├── contexts/          # React contexts (Viewport)
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Route pages
│   │   ├── services/          # API/Socket services
│   │   ├── stores/            # Zustand stores
│   │   └── types/             # TypeScript types
│   └── package.json
│
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── handlers/          # Socket event handlers
│   │   ├── models/            # Mongoose models
│   │   ├── services/          # Business logic
│   │   └── types/             # TypeScript types
│   └── package.json
│
└── package.json               # Root package (concurrently runs both)
```

---

## Deployment Flow

```mermaid
graph LR
    Dev["Local Development"]
    Git["GitHub Repository"]
    
    subgraph "Auto Deploy"
        Vercel["Vercel"]
        Render["Render"]
    end
    
    Prod["Production"]
    
    Dev -->|"git push"| Git
    Git -->|"Webhook"| Vercel
    Git -->|"Webhook"| Render
    Vercel -->|"client/"| Prod
    Render -->|"server/"| Prod
```

| Service | Branch | Root Directory | Build Command |
|---------|--------|----------------|---------------|
| Vercel | master | `client/` | `npm run build` |
| Render | master | `server/` | `npm run build` |
