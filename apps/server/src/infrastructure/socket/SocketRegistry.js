export class SocketRegistry {
  constructor() {
    this.socketToPlayerId = new Map();
    this.playerToSocketId = new Map();
  }

  register(socketId, playerId) {
    this.socketToPlayerId.set(socketId, playerId);
    this.playerToSocketId.set(playerId, socketId);
  }

  getPlayerId(socketId) {
    return this.socketToPlayerId.get(socketId) ?? null;
  }

  getSocketId(playerId) {
    return this.playerToSocketId.get(playerId) ?? null;
  }

  removeBySocketId(socketId) {
    const playerId = this.socketToPlayerId.get(socketId);
    if (!playerId) {
      return null;
    }

    this.socketToPlayerId.delete(socketId);
    this.playerToSocketId.delete(playerId);
    return playerId;
  }
}
