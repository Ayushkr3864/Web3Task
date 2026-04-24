import { useMemo, useState } from "react";

function sortPlayers(players) {
  return [...players].sort((first, second) => second.score - first.score);
}

export default function Sidebar({
  roomState,
  playerId,
  wordOptions,
  selectedWord,
  onChooseWord,
  onToggleReady,
  onStartGame,
  onSendGuess,
  onSendChat,
}) {
  const [message, setMessage] = useState("");
  const me = roomState.players.find((player) => player.id === playerId);
  const currentDrawer = roomState.players.find((player) => player.id === roomState.round.currentDrawerId);
  const leaderboard = useMemo(() => sortPlayers(roomState.players), [roomState.players]);
  const isHost = me?.isHost;
  const isDrawer = currentDrawer?.id === playerId;
  const canStart =
    isHost &&
    roomState.players.length >= 2 &&
    roomState.players.every((player) => player.isHost || player.isReady);

  const submitMessage = () => {
    const nextMessage = message.trim();
    if (!nextMessage) {
      return;
    }

    if (roomState.round.phase === "drawing" && !isDrawer) {
      onSendGuess(roomState.roomCode, nextMessage);
    } else {
      onSendChat(roomState.roomCode, nextMessage);
    }

    setMessage("");
  };

  return (
    <aside className="sidebar">
      <div className="panel">
        <div className="room-badge-row">
          <span className="eyebrow">Room Code</span>
          <strong>{roomState.roomCode}</strong>
        </div>
        <h2>{roomState.round.phase === "waiting" ? "Lobby" : "Live match"}</h2>
        <p className="muted">
          Round {roomState.round.roundNumber || 1} • {roomState.round.remainingSeconds}s left
        </p>
        <div className="word-banner">{roomState.round.maskedWord || "Waiting for the round to begin"}</div>

        {wordOptions.length > 0 && (
          <div className="word-picker">
            <p className="muted">Choose a word to start drawing.</p>
            {wordOptions.map((word) => (
              <button key={word} onClick={() => onChooseWord(roomState.roomCode, word)}>
                {word}
              </button>
            ))}
          </div>
        )}

        {selectedWord && isDrawer && roomState.round.phase === "drawing" && (
          <div className="drawer-note">Your word: {selectedWord}</div>
        )}

        {roomState.round.phase === "waiting" && (
          <div className="lobby-actions">
            <button onClick={() => onToggleReady(roomState.roomCode)}>
              {me?.isReady ? "Unready" : "Ready up"}
            </button>
            <button onClick={() => onStartGame(roomState.roomCode)} disabled={!canStart}>
              Start game
            </button>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="room-list-header">
          <h3>Leaderboard</h3>
          {roomState.winnerId && <span>Winner decided</span>}
        </div>
        <div className="leaderboard">
          {leaderboard.map((player) => (
            <div className="leader-row" key={player.id}>
              <span>
                {player.name}
                {player.isHost ? " (Host)" : ""}
              </span>
              <strong>{player.score}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel chat-panel">
        <div className="room-list-header">
          <h3>Chat</h3>
          <span>{currentDrawer ? `${currentDrawer.name} is drawing` : "Waiting"}</span>
        </div>

        <div className="chat-feed">
          {roomState.chat.map((entry) => (
            <div key={entry.id} className={`chat-entry ${entry.kind}`}>
              <strong>{entry.playerName}</strong>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>

        <div className="chat-compose">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={isDrawer ? "Send a chat message" : "Type your guess"}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitMessage();
              }
            }}
          />
          <button onClick={submitMessage}>Send</button>
        </div>
      </div>
    </aside>
  );
}
