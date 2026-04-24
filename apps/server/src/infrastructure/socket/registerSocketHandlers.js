import { CLIENT_EVENTS, SERVER_EVENTS } from "@skribbl-clone/shared";
import { SocketRegistry } from "./SocketRegistry.js";

function emitRoomState(io, roomCode, state) {
  io.to(roomCode).emit(SERVER_EVENTS.ROOM_STATE, state);
}

function emitPublicRooms(io, roomService) {
  io.emit(SERVER_EVENTS.ROOM_LIST, { rooms: roomService.getPublicRooms() });
}

function attachRoomHooks(io, roomService, registry, room) {
  room.setHooks({
    onStateChange: (state) => {
      emitRoomState(io, room.roomCode, state);
      if (state.round.phase === "game-ended") {
        emitPublicRooms(io, roomService);
      }
    },
    onRoundStarted: (updatedRoom) => {
      io.to(updatedRoom.roomCode).emit(SERVER_EVENTS.ROUND_STARTED, {
        state: updatedRoom.toState(),
        wordOptions: [],
      });

      const drawer = updatedRoom.getCurrentDrawer();
      if (!drawer) {
        return;
      }

      const socketId = registry.getSocketId(drawer.id);
      if (!socketId) {
        return;
      }

      io.to(socketId).emit(SERVER_EVENTS.ROUND_STARTED, {
        state: updatedRoom.toState(),
        wordOptions: updatedRoom.getWordOptionsForDrawer(drawer.id),
      });
    },
  });
}

export function registerSocketHandlers(io, roomService) {
  const registry = new SocketRegistry();

  io.on("connection", (socket) => {
    socket.emit(SERVER_EVENTS.ROOM_LIST, { rooms: roomService.getPublicRooms() });

    socket.on(CLIENT_EVENTS.ROOM_CREATE, ({ playerName, settings }) => {
      try {
        const { room, player } = roomService.createRoom(socket.id, playerName, settings);
        attachRoomHooks(io, roomService, registry, room);
        registry.register(socket.id, player.id);
        socket.join(room.roomCode);
        socket.emit(SERVER_EVENTS.ROOM_CREATED, { playerId: player.id, state: room.toState() });
        emitPublicRooms(io, roomService);
      } catch (error) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, { message: error.message });
      }
    });

    socket.on(CLIENT_EVENTS.ROOM_JOIN, ({ roomCode, playerName }) => {
      try {
        const { room, player } = roomService.joinRoom(socket.id, roomCode.toUpperCase(), playerName);
        attachRoomHooks(io, roomService, registry, room);
        registry.register(socket.id, player.id);
        socket.join(room.roomCode);
        socket.emit(SERVER_EVENTS.ROOM_CREATED, { playerId: player.id, state: room.toState() });
        emitRoomState(io, room.roomCode, room.toState());
        emitPublicRooms(io, roomService);
      } catch (error) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, { message: error.message });
      }
    });

    socket.on(CLIENT_EVENTS.ROOM_TOGGLE_READY, ({ roomCode }) => {
      const playerId = registry.getPlayerId(socket.id);
      const room = playerId ? roomService.getRoom(roomCode) : null;
      if (!playerId || !room) {
        return;
      }

      room.toggleReady(playerId);
    });

    socket.on(CLIENT_EVENTS.ROOM_START_GAME, ({ roomCode }) => {
      try {
        const playerId = registry.getPlayerId(socket.id);
        const room = playerId ? roomService.getRoom(roomCode) : null;
        if (!playerId || !room) {
          return;
        }

        if (!room.canStartGame(playerId)) {
          throw new Error("Only the host can start after all players are ready.");
        }

        room.startGame();
        emitPublicRooms(io, roomService);
      } catch (error) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, { message: error.message });
      }
    });

    socket.on(CLIENT_EVENTS.ROUND_CHOOSE_WORD, ({ roomCode, word }) => {
      try {
        const playerId = registry.getPlayerId(socket.id);
        const room = playerId ? roomService.getRoom(roomCode) : null;
        if (!playerId || !room) {
          return;
        }

        room.chooseWord(playerId, word);
      } catch (error) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, { message: error.message });
      }
    });

    socket.on(CLIENT_EVENTS.DRAW_STROKE, ({ roomCode, stroke }) => {
      const playerId = registry.getPlayerId(socket.id);
      const room = playerId ? roomService.getRoom(roomCode) : null;
      if (!playerId || !room) {
        return;
      }
      room.addStroke(playerId, stroke);
    });

    socket.on(CLIENT_EVENTS.DRAW_UNDO, ({ roomCode }) => {
      const playerId = registry.getPlayerId(socket.id);
      const room = playerId ? roomService.getRoom(roomCode) : null;
      if (!playerId || !room) {
        return;
      }
      room.undoStroke(playerId);
    });

    socket.on(CLIENT_EVENTS.DRAW_CLEAR, ({ roomCode }) => {
      const playerId = registry.getPlayerId(socket.id);
      const room = playerId ? roomService.getRoom(roomCode) : null;
      if (!playerId || !room) {
        return;
      }
      room.clearCanvas(playerId);
    });

    socket.on(CLIENT_EVENTS.CHAT_GUESS, ({ roomCode, text }) => {
      const playerId = registry.getPlayerId(socket.id);
      const room = playerId ? roomService.getRoom(roomCode) : null;
      if (!playerId || !room) {
        return;
      }

      const message = room.submitGuess(playerId, text);
      io.to(roomCode).emit(SERVER_EVENTS.CHAT_MESSAGE, message);
    });

    socket.on(CLIENT_EVENTS.CHAT_MESSAGE, ({ roomCode, text }) => {
      try {
        const playerId = registry.getPlayerId(socket.id);
        const room = playerId ? roomService.getRoom(roomCode) : null;
        if (!playerId || !room) {
          return;
        }

        const message = room.addChatMessage(playerId, text);
        io.to(roomCode).emit(SERVER_EVENTS.CHAT_MESSAGE, message);
      } catch (error) {
        socket.emit(SERVER_EVENTS.GAME_ERROR, { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      const playerId = registry.removeBySocketId(socket.id);
      if (!playerId) {
        return;
      }

      const room = roomService.removePlayer(playerId);
      if (room) {
        emitRoomState(io, room.roomCode, room.toState());
      }
      emitPublicRooms(io, roomService);
    });
  });
}
