import { Player } from "../../domain/entities/Player.js";
import { Room } from "../../domain/entities/Room.js";

function createCode(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
}

export class RoomService {
  constructor() {
    this.roomsByCode = new Map();
    this.playerRoomMap = new Map();
  }

  createRoom(socketId, playerName, settings) {
    if (!playerName?.trim()) {
      throw new Error("Player name is required.");
    }

    const roomId = crypto.randomUUID();
    const roomCode = createCode();
    const room = new Room(roomId, roomCode, settings);
    const player = new Player(crypto.randomUUID(), playerName.trim(), socketId, true);
    room.addPlayer(player);
    this.roomsByCode.set(roomCode, room);
    this.playerRoomMap.set(player.id, roomCode);
    return { room, player };
  }

  joinRoom(socketId, roomCode, playerName) {
    if (!playerName?.trim()) {
      throw new Error("Player name is required.");
    }

    const room = this.getRoom(roomCode);
    if (!room) {
      throw new Error("Room not found.");
    }

    if (room.toState().round.phase !== "waiting") {
      throw new Error("Game already started in this room.");
    }

    const player = new Player(crypto.randomUUID(), playerName.trim(), socketId);
    room.addPlayer(player);
    this.playerRoomMap.set(player.id, roomCode);
    return { room, player };
  }

  getRoom(roomCode) {
    return this.roomsByCode.get(roomCode) ?? null;
  }

  removePlayer(playerId) {
    const roomCode = this.playerRoomMap.get(playerId);
    if (!roomCode) {
      return null;
    }

    const room = this.getRoom(roomCode);
    this.playerRoomMap.delete(playerId);

    if (!room) {
      return null;
    }

    room.removePlayer(playerId);

    if (room.listPlayers().length === 0) {
      this.roomsByCode.delete(roomCode);
      return null;
    }

    return room;
  }

  getPublicRooms() {
    return [...this.roomsByCode.values()]
      .filter((room) => room.settings.visibility === "public")
      .map((room) => room.toSummary());
  }
}
