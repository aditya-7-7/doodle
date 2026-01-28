# Doodle - Collaborative Canvas

Real-time collaborative drawing canvas application built with React, Node.js, and Socket.io.

![Doodle Demo](client/public/logo.png)

## Features

- 🎨 **Drawing Tools**: Brush, eraser, shapes (rectangle, circle, triangle, diamond), text
- 🔄 **Real-time Sync**: See others draw live with WebSocket
- 👥 **User Indicators**: Cursor positions and user colors
- ↩️ **Global Undo/Redo**: Shared history across all users
- 💾 **Persistence**: Auto-save and restore canvas state via MongoDB
- 🔐 **Room System**: Create/join private or public rooms with password protection
- 📱 **Responsive**: Touch-based panning on mobile devices

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Zustand |
| **Backend** | Node.js, Express, Socket.io, MongoDB, Mongoose |
| **Real-time** | WebSocket via Socket.io |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (React + Vite)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Pages     │  │  Components │  │   Hooks     │  │      Services       │ │
│  │ LandingPage │  │  Toolbar    │  │useCanvasDraw│  │  socketService      │ │
│  │ RoomPage    │  │  CanvasArea │  │useRoomSocket│  │  canvasService      │ │
│  └─────────────┘  │  RoomHeader │  │usePanning   │  │  sessionService     │ │
│                   └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         Zustand Stores                                  ││
│  │   roomStore (room state)  │  canvasStore (tool state)  │  userStore    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ WebSocket (Socket.io)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVER (Node.js + Express)                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         WebSocketService                                ││
│  │   Manages Socket.io connections, CORS, event routing                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────────┐│
│  │       Handlers          │  │                Services                    ││
│  │  roomHandler            │  │  RoomService (room CRUD, auth)             ││
│  │  drawHandler            │  │  DrawService (operations, history)         ││
│  │  cursorHandler          │  └─────────────────────────────────────────────┘│
│  │  historyHandler         │                                                │
│  └─────────────────────────┘                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      Mongoose Models                                    ││
│  │  Room  │  RoomMember  │  DrawingOperation  │  CanvasSnapshot            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Mongoose ODM
                                      ▼
                        ┌─────────────────────────────┐
                        │      MongoDB Atlas          │
                        │  rooms, operations, etc.    │
                        └─────────────────────────────┘
```

### Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          DRAWING OPERATION FLOW                          │
└──────────────────────────────────────────────────────────────────────────┘

User draws on canvas
        │
        ▼
┌─────────────────┐     emit('draw')      ┌─────────────────┐
│  useCanvasDraw  │ ───────────────────▶  │   drawHandler   │
│  (client hook)  │                       │   (server)      │
└─────────────────┘                       └─────────────────┘
        │                                         │
        │ local render                            │ save to DB
        ▼                                         ▼
┌─────────────────┐                       ┌─────────────────┐
│  Canvas Element │                       │  DrawService    │
│  (immediate)    │                       │  (MongoDB)      │
└─────────────────┘                       └─────────────────┘
                                                  │
                                                  │ broadcast to room
                                                  ▼
                                          ┌─────────────────┐
                                          │  Other Clients  │
                                          │  (real-time)    │
                                          └─────────────────┘
```

### Room Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            ROOM LIFECYCLE                                │
└──────────────────────────────────────────────────────────────────────────┘

CREATE ROOM                    JOIN ROOM                    LEAVE ROOM
     │                              │                            │
     ▼                              ▼                            ▼
┌──────────┐                 ┌──────────────┐             ┌──────────────┐
│RoomForm  │                 │JoinRoomModal │             │ disconnect   │
│(client)  │                 │(if private)  │             │ event        │
└──────────┘                 └──────────────┘             └──────────────┘
     │                              │                            │
     │ emit room:create             │ emit room:join             │ auto
     ▼                              ▼                            ▼
┌──────────┐                 ┌──────────────┐             ┌──────────────┐
│RoomService│                │RoomService   │             │RoomService   │
│createRoom │                │joinRoom      │             │leaveRoom     │
└──────────┘                 │validatePass  │             │cleanup       │
     │                       └──────────────┘             └──────────────┘
     │ save to MongoDB              │                            │
     ▼                              ▼                            ▼
┌──────────┐                 ┌──────────────┐             ┌──────────────┐
│Room model│                 │RoomMember    │             │broadcast     │
│created   │                 │added         │             │user:left     │
└──────────┘                 └──────────────┘             └──────────────┘
```

### State Management

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CLIENT STATE ARCHITECTURE                        │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           Zustand Stores                                │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│     roomStore       │    canvasStore      │        userStore            │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ • roomId            │ • selectedTool      │ • currentUser               │
│ • roomName          │ • strokeColor       │ • allUsers                  │
│ • isPrivate         │ • strokeWidth       │ • cursors                   │
│ • members           │ • fillColor         │                             │
│ • isConnected       │ • selectedShape     │                             │
└─────────────────────┴─────────────────────┴─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           React Components                              │
│   Subscribe to stores using hooks: useRoomStore, useCanvasStore, etc.   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `room:create` | Client → Server | Create a new room |
| `room:join` | Client → Server | Join existing room |
| `room:leave` | Client → Server | Leave current room |
| `room:state` | Server → Client | Full room state sync |
| `draw` | Client → Server | Send drawing operation |
| `draw:sync` | Server → Client | Broadcast drawing to others |
| `cursor:move` | Client → Server | Update cursor position |
| `cursor:update` | Server → Client | Broadcast cursor positions |
| `history:undo` | Client → Server | Undo last operation |
| `history:redo` | Client → Server | Redo operation |
| `history:sync` | Server → Client | Sync history state |

### Database Schema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           MongoDB Collections                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│     rooms       │     │   roommembers    │     │ drawingoperations   │
├─────────────────┤     ├──────────────────┤     ├─────────────────────┤
│ _id             │◄────│ roomId           │     │ _id                 │
│ roomId (unique) │     │ odcketId         │     │ roomId              │
│ name            │     │ odername         │     │ type (brush/shape)  │
│ isPrivate       │     │ color            │     │ data (JSON)         │
│ passwordHash    │     │ joinedAt         │     │ userId              │
│ createdAt       │     └──────────────────┘     │ timestamp           │
└─────────────────┘                              │ isUndone            │
                                                 └─────────────────────┘

┌─────────────────────┐
│  canvassnapshots    │
├─────────────────────┤
│ _id                 │
│ roomId              │
│ imageData (base64)  │
│ timestamp           │
└─────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Installation

```bash
# clone the repository
git clone https://github.com/aditya-7-7/doodle.git
cd collaborative-canvas

# install root dependencies
npm install

# install client dependencies
cd client && npm install && cd ..

# install server dependencies
cd server && npm install && cd ..
```

### Environment Setup

Create `.env` files in the following locations:

**Server (`server/.env`):**
```env
PORT=4000
MONGODB_URI=mongodb+srv://your-connection-string
CLIENT_URL=http://localhost:3000
```

**Client (`client/.env`):**
```env
VITE_SERVER_URL=http://localhost:4000
```

### Running the Application

```bash
# from root directory run both client and server
npm run dev
```

This will start:
- Client at `http://localhost:3000`
- Server at `http://localhost:4000`

## Project Structure

```
collaborative-canvas/
├── client/                 # react frontend
│   ├── public/            # static assets
│   └── src/
│       ├── components/    # ui components
│       │   ├── room/      # room-specific (Toolbar, Canvas, Header)
│       │   ├── toolbar/   # toolbar popovers (BrushSettings, ShapeSettings)
│       │   └── ui/        # reusable (Button, Input, RoomForm)
│       ├── hooks/         # custom react hooks
│       │   ├── tools/     # tool-specific (usePanning, useShapeDrawing)
│       │   ├── useCanvasDrawing.ts
│       │   └── useRoomSocket.ts
│       ├── services/      # api and socket services
│       ├── stores/        # zustand state stores
│       ├── theme/         # design tokens (colors, spacing)
│       └── pages/         # page components
├── server/                 # node.js backend
│   └── src/
│       ├── handlers/      # socket event handlers
│       ├── models/        # mongoose models
│       ├── services/      # business logic
│       └── config/        # database configuration
└── shared/                 # shared types between client and server
    └── types.ts           # TypeScript interfaces and enums
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both client and server in development mode |
| `npm run dev:client` | Run only the client |
| `npm run dev:server` | Run only the server |

## Deployment

### Frontend (Vercel/Netlify)

1. Connect your GitHub repository
2. Set build command: `cd client && npm run build`
3. Set output directory: `client/dist`
4. Add environment variable: `VITE_SERVER_URL=https://your-server-url.com`

### Backend (Render/Railway)

1. Connect your GitHub repository
2. Set build command: `cd server && npm install`
3. Set start command: `cd server && npm start`
4. Add environment variables:
   - `PORT=4000`
   - `MONGODB_URI=your-mongodb-connection-string`
   - `CLIENT_URL=https://your-frontend-url.com`
