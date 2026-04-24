import { WordBank } from "../services/WordBank.js";

const HINT_REVEAL_INTERVAL_SECONDS = 20;
const WORD_SELECTION_SECONDS = 12;

export class Room {
  constructor(roomId, roomCode, settings) {
    this.roomId = roomId;
    this.roomCode = roomCode;
    this.settings = settings;
    this.players = new Map();
    this.strokes = [];
    this.chat = [];
    this.wordBank = new WordBank();
    this.drawerOrder = [];
    this.drawerIndex = -1;
    this.currentRound = 0;
    this.phase = "waiting";
    this.currentWord = "";
    this.currentWordOptions = [];
    this.revealedIndices = [];
    this.remainingSeconds = 0;
    this.winnerId = null;
    this.roundInterval = null;
    this.wordSelectionTimeout = null;
    this.onStateChange = null;
    this.onRoundStarted = null;
  }

  setHooks(hooks) {
    this.onStateChange = hooks?.onStateChange ?? null;
    this.onRoundStarted = hooks?.onRoundStarted ?? null;
  }

  addPlayer(player) {
    if (this.players.size >= this.settings.maxPlayers) {
      throw new Error("Room is full.");
    }
    this.players.set(player.id, player);
    this.emitState();
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) {
      return;
    }

    const wasHost = player.isHost;
    this.players.delete(playerId);
    this.drawerOrder = this.drawerOrder.filter((id) => id !== playerId);

    if (wasHost) {
      const nextHost = this.listPlayers()[0];
      if (nextHost) {
        nextHost.isHost = true;
      }
    }

    if (this.players.size === 0) {
      this.stopTimers();
      return;
    }

    if (this.getCurrentDrawer()?.id === playerId && this.phase !== "waiting") {
      this.finishRound();
      return;
    }

    this.emitState();
  }

  listPlayers() {
    return [...this.players.values()];
  }

  findPlayer(playerId) {
    return this.players.get(playerId) ?? null;
  }

  getCurrentDrawer() {
    const drawerId = this.drawerOrder[this.drawerIndex];
    return drawerId ? this.players.get(drawerId) ?? null : null;
  }

  getWordOptionsForDrawer(playerId) {
    return this.getCurrentDrawer()?.id === playerId ? [...this.currentWordOptions] : [];
  }

  toggleReady(playerId) {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error("Player not found.");
    }
    player.setReady(!player.isReady);
    this.emitState();
  }

  canStartGame(playerId) {
    const player = this.players.get(playerId);
    return (
      player?.isHost === true &&
      this.players.size >= 2 &&
      this.listPlayers().every((member) => member.isReady || member.isHost)
    );
  }

  startGame() {
    if (this.players.size < 2) {
      throw new Error("At least 2 players are required.");
    }

    this.currentRound = 1;
    this.drawerOrder = this.listPlayers().map((player) => player.id);
    this.drawerIndex = -1;
    this.winnerId = null;
    this.beginNextTurn();
  }

  chooseWord(playerId, word) {
    if (this.phase !== "word-selection") {
      throw new Error("Word selection is closed.");
    }

    const drawer = this.getCurrentDrawer();
    if (!drawer || drawer.id !== playerId) {
      throw new Error("Only the current drawer can choose a word.");
    }

    if (!this.currentWordOptions.includes(word)) {
      throw new Error("Invalid word selection.");
    }

    this.currentWord = word;
    this.revealedIndices = [];
    this.phase = "drawing";
    this.remainingSeconds = this.settings.drawTimeSeconds;
    this.strokes.length = 0;

    if (this.wordSelectionTimeout) {
      clearTimeout(this.wordSelectionTimeout);
      this.wordSelectionTimeout = null;
    }

    this.startRoundTimer();
    this.emitState();
  }

  addStroke(playerId, stroke) {
    const drawer = this.getCurrentDrawer();
    if (!drawer || drawer.id !== playerId || this.phase !== "drawing") {
      return;
    }

    const existingStrokeIndex = this.strokes.findIndex((entry) => entry.id === stroke.id);
    if (existingStrokeIndex >= 0) {
      this.strokes[existingStrokeIndex] = stroke;
    } else {
      this.strokes.push(stroke);
    }

    this.emitState();
  }

  undoStroke(playerId) {
    const drawer = this.getCurrentDrawer();
    if (!drawer || drawer.id !== playerId) {
      return;
    }
    this.strokes.pop();
    this.emitState();
  }

  clearCanvas(playerId) {
    const drawer = this.getCurrentDrawer();
    if (!drawer || drawer.id !== playerId) {
      return;
    }
    this.strokes.length = 0;
    this.emitState();
  }

  submitGuess(playerId, text) {
    const player = this.players.get(playerId);
    const drawer = this.getCurrentDrawer();

    if (!player || !drawer || this.phase !== "drawing") {
      return this.createSystemMessage("Guess ignored.");
    }

    if (drawer.id === playerId) {
      return this.createSystemMessage("Drawer cannot submit guesses.");
    }

    if (player.hasGuessedCorrectly) {
      return this.createSystemMessage(`${player.name} already guessed the word.`);
    }

    const normalizedGuess = this.normalizeWord(text);
    const normalizedWord = this.normalizeWord(this.currentWord);

    if (normalizedGuess === normalizedWord) {
      player.markGuessedCorrectly();
      player.addScore(100 + this.remainingSeconds * 2);
      drawer.addScore(60);

      const message = this.createChatMessage(player, `${player.name} guessed the word!`, "correct-guess");
      this.chat.push(message);

      const everyoneGuessed = this.listPlayers()
        .filter((entry) => entry.id !== drawer.id)
        .every((entry) => entry.hasGuessedCorrectly);

      this.emitState();

      if (everyoneGuessed) {
        this.finishRound();
      }

      return message;
    }

    const guessMessage = this.createChatMessage(player, text, "guess");
    this.chat.push(guessMessage);
    this.emitState();
    return guessMessage;
  }

  addChatMessage(playerId, text) {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error("Player not found.");
    }

    const message = this.createChatMessage(player, text, "chat");
    this.chat.push(message);
    this.emitState();
    return message;
  }

  finishRound() {
    if (this.phase === "waiting" || this.phase === "game-ended") {
      return;
    }

    this.stopTimers();
    this.phase = "round-ended";
    this.remainingSeconds = 0;
    this.emitState();

    const finishedAllRounds =
      this.currentRound >= this.settings.totalRounds &&
      this.drawerIndex >= this.drawerOrder.length - 1;

    if (finishedAllRounds) {
      this.finishGame();
      return;
    }

    setTimeout(() => {
      if (this.phase !== "game-ended") {
        this.beginNextTurn();
      }
    }, 2500);
  }

  toState() {
    return {
      roomId: this.roomId,
      roomCode: this.roomCode,
      settings: this.settings,
      players: this.listPlayers().map((player) => player.toSnapshot()),
      chat: [...this.chat.slice(-25)],
      strokes: [...this.strokes],
      round: {
        roundNumber: this.currentRound,
        currentDrawerId: this.getCurrentDrawer()?.id ?? null,
        phase: this.phase,
        maskedWord: this.getMaskedWord(),
        revealedIndices: [...this.revealedIndices],
        remainingSeconds: this.remainingSeconds,
      },
      winnerId: this.winnerId,
    };
  }

  toSummary() {
    return {
      roomId: this.roomId,
      roomCode: this.roomCode,
      visibility: this.settings.visibility,
      playerCount: this.players.size,
      maxPlayers: this.settings.maxPlayers,
      hostName: this.listPlayers().find((player) => player.isHost)?.name ?? "Unknown",
      gameStarted: this.phase !== "waiting",
    };
  }

  beginNextTurn() {
    this.stopTimers();
    this.drawerIndex += 1;

    if (this.drawerIndex >= this.drawerOrder.length) {
      this.drawerIndex = 0;
      this.currentRound += 1;
    }

    if (this.currentRound > this.settings.totalRounds) {
      this.finishGame();
      return;
    }

    this.listPlayers().forEach((player) => player.resetRoundState());
    this.strokes.length = 0;
    this.currentWord = "";
    this.revealedIndices = [];
    this.phase = "word-selection";
    this.remainingSeconds = WORD_SELECTION_SECONDS;
    this.currentWordOptions = this.wordBank.getRandomOptions(this.settings.wordChoices);
    this.emitState();
    this.onRoundStarted?.(this);

    this.wordSelectionTimeout = setTimeout(() => {
      const fallbackWord = this.currentWordOptions[0];
      if (fallbackWord && this.getCurrentDrawer()) {
        this.chooseWord(this.getCurrentDrawer().id, fallbackWord);
      }
    }, WORD_SELECTION_SECONDS * 1000);
  }

  startRoundTimer() {
    this.roundInterval = setInterval(() => {
      this.remainingSeconds -= 1;

      if (
        this.settings.hintsEnabled &&
        this.currentWord.length > 3 &&
        this.remainingSeconds > 0 &&
        this.remainingSeconds % HINT_REVEAL_INTERVAL_SECONDS === 0
      ) {
        this.revealHintLetter();
      }

      if (this.remainingSeconds <= 0) {
        this.finishRound();
        return;
      }

      this.emitState();
    }, 1000);
  }

  revealHintLetter() {
    const hiddenIndices = [...this.currentWord]
      .map((_, index) => index)
      .filter((index) => this.currentWord[index] !== " " && !this.revealedIndices.includes(index));

    if (hiddenIndices.length === 0) {
      return;
    }

    const index = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    this.revealedIndices.push(index);
  }

  finishGame() {
    this.stopTimers();
    this.phase = "game-ended";
    const winner = [...this.players.values()].sort((first, second) => second.score - first.score)[0];
    this.winnerId = winner?.id ?? null;
    this.emitState();
  }

  getMaskedWord() {
    if (!this.currentWord) {
      return "";
    }

    if (this.phase === "round-ended" || this.phase === "game-ended") {
      return this.currentWord.toUpperCase().split("").join(" ");
    }

    return [...this.currentWord]
      .map((character, index) => {
        if (character === " ") {
          return " ";
        }
        return this.revealedIndices.includes(index) ? character.toUpperCase() : "_";
      })
      .join(" ");
  }

  normalizeWord(value) {
    return value.trim().toLowerCase();
  }

  createChatMessage(player, text, kind) {
    return {
      id: crypto.randomUUID(),
      playerId: player.id,
      playerName: player.name,
      text,
      kind,
      createdAt: Date.now(),
    };
  }

  createSystemMessage(text) {
    return {
      id: crypto.randomUUID(),
      playerId: "system",
      playerName: "System",
      text,
      kind: "system",
      createdAt: Date.now(),
    };
  }

  stopTimers() {
    if (this.roundInterval) {
      clearInterval(this.roundInterval);
      this.roundInterval = null;
    }

    if (this.wordSelectionTimeout) {
      clearTimeout(this.wordSelectionTimeout);
      this.wordSelectionTimeout = null;
    }
  }

  emitState() {
    this.onStateChange?.(this.toState());
  }
}
