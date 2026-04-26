# Skribbl Clone Assignment

A full-stack multiplayer drawing and guessing game built for the Web3Task internship assignment.

## Stack

- Frontend: React + JSX + Vite
- Backend: Node.js + Express + Socket.IO
- Shared contracts: local workspace package for socket event names and default settings

## Folder Structure

```text
.
├── apps
│   ├── client
│   │   ├── src
│   │   │   ├── components
│   │   │   ├── hooks
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── index.html
│   │   └── vite.config.js
│   └── server
│       └── src
│           ├── application
│           ├── domain
│           ├── infrastructure
│           ├── presentation
│           └── main.js
├── packages
│   └── shared
└── package.json
```

## Architecture

### Backend

- `domain`
  - Holds core business logic like `Room`, `Player`, and `WordBank`.
- `application`
  - Coordinates use cases through `RoomService`.
- `infrastructure`
  - Handles Socket.IO connection management and event wiring.
- `presentation`
  - Exposes lightweight HTTP endpoints like `/health` and `/rooms/public`.

### Frontend

- `hooks/useGameSocket.js`
  - Owns the real-time socket connection and all client-server event calls.
- `components/LobbyPanel.jsx`
  - Create room and join room flows.
- `components/CanvasBoard.jsx`
  - Live drawing canvas with color, size, eraser, undo, and clear actions.
- `components/Sidebar.jsx`
  - Lobby controls, scoreboard, word selection, and chat/guess feed.

## Features Implemented

- Create public or private rooms
- Join with room code
- Lobby with ready-up flow
- Host-only game start
- Turn-based round progression
- Word selection for the active drawer
- Real-time drawing sync
- Guess handling and scoring
- Leaderboard and winner state
- Chat and guess feed
- Hint reveal over time
- Undo and clear canvas actions

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run both apps

```bash
npm run dev
```

### 3. Open the app

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Environment

Create these if you want custom ports or origins.

### Backend

```bash
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

### Frontend

```bash
VITE_SERVER_URL=http://localhost:3001
```

## Production Deployment

Live deployment:

- Frontend: `https://web3-task-client.vercel.app/`
- Backend: `https://web3task-ydj0.onrender.com/`

Make sure the frontend `VITE_SERVER_URL` points to the deployed backend and the backend `CLIENT_ORIGIN` points to the deployed frontend origin.

## Core Real-Time Flow

### Drawing

1. The drawer paints on the canvas.
2. The client emits stroke updates through Socket.IO.
3. The server stores the latest stroke state in the `Room` aggregate.
4. Updated room state is broadcast to everyone in the room.
5. All clients redraw the canvas from shared stroke data.

### Game State

1. Host creates a room and players join.
2. Players ready up in the lobby.
3. Host starts the game.
4. Server rotates the drawer, creates word options, starts timers, and updates scores.
5. When time ends or everyone guesses correctly, the next round begins automatically.

## Assignment Note

The codebase uses JavaScript on the backend and JSX on the frontend, with a clean layered structure so the game logic is easy to explain during the walkthrough.
