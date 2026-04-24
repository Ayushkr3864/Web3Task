export class Player {
  constructor(id, name, socketId, isHost = false) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.isHost = isHost;
    this.score = 0;
    this.isReady = false;
    this.hasGuessedCorrectly = false;
    this.isConnected = true;
  }

  setReady(isReady) {
    this.isReady = isReady;
  }

  resetRoundState() {
    this.hasGuessedCorrectly = false;
  }

  markGuessedCorrectly() {
    this.hasGuessedCorrectly = true;
  }

  addScore(points) {
    this.score += points;
  }

  toSnapshot() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isHost: this.isHost,
      isReady: this.isReady,
      hasGuessedCorrectly: this.hasGuessedCorrectly,
      isConnected: this.isConnected,
    };
  }
}
