import { useMemo, useState } from "react";

function sortPlayers(players) {
  return [...players].sort((first, second) => second.score - first.score);
}

const panelClass = "rounded-2xl border-4 border-black bg-white p-5 shadow-lg";
const buttonClass =
  "rounded-xl border-4 border-black px-4 py-3 text-xl text-gray-900 shadow-md transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50";

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
    <aside className="grid gap-4">
      <div className={panelClass}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-base uppercase tracking-[0.2em] text-crayon-blue">Room Code</span>
          <strong className="rounded-xl border-2 border-black bg-crayon-orange px-3 py-1 text-xl text-white shadow-md">
            {roomState.roomCode}
          </strong>
        </div>
        <h2 className="mt-3 mb-1 text-3xl text-gray-900">{roomState.round.phase === "waiting" ? "Lobby" : "Live match"}</h2>
        <p className="m-0 text-xl text-gray-700">
          Round {roomState.round.roundNumber || 1} • {roomState.round.remainingSeconds}s left
        </p>
        <div className="my-4 rounded-2xl border-4 border-gray-800 bg-yellow-50 px-4 py-4 text-center text-2xl tracking-[0.12em] text-gray-900 shadow-md">
          {roomState.round.maskedWord || "Waiting for the round to begin"}
        </div>

        {wordOptions.length > 0 && (
          <div className="grid gap-3">
            <p className="m-0 text-xl text-gray-700">Choose a word to start drawing.</p>
            {wordOptions.map((word) => (
              <button
                key={word}
                className={`${buttonClass} bg-crayon-yellow`}
                onClick={() => onChooseWord(roomState.roomCode, word)}
              >
                {word}
              </button>
            ))}
          </div>
        )}

        {selectedWord && isDrawer && roomState.round.phase === "drawing" && (
          <div className="mt-4 rounded-2xl border-4 border-gray-800 bg-crayon-green px-4 py-3 text-center text-2xl text-gray-900 shadow-md">
            Your word: {selectedWord}
          </div>
        )}

        {roomState.round.phase === "waiting" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button className={`${buttonClass} bg-crayon-green`} onClick={() => onToggleReady(roomState.roomCode)}>
              {me?.isReady ? "Unready" : "Ready up"}
            </button>
            <button
              className={`${buttonClass} bg-crayon-red text-white`}
              onClick={() => onStartGame(roomState.roomCode)}
              disabled={!canStart}
            >
              Start game
            </button>
          </div>
        )}
      </div>

      <div className={panelClass}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-2xl text-gray-900">Leaderboard</h3>
          {roomState.winnerId && (
            <span className="rounded-xl border-2 border-black bg-crayon-yellow px-3 py-1 text-lg text-gray-900 shadow-md">
              Winner decided
            </span>
          )}
        </div>
        <div className="mt-4 grid gap-3">
          {leaderboard.map((player) => (
            <div
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-gray-800 bg-yellow-50 px-4 py-3 text-xl text-gray-900 shadow-md"
              key={player.id}
            >
              <span>
                {player.name}
                {player.isHost ? " (Host)" : ""}
              </span>
              <strong>{player.score}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className={`${panelClass} min-h-[320px]`}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-2xl text-gray-900">Chat</h3>
          <span className="rounded-xl border-2 border-black bg-crayon-blue px-3 py-1 text-lg text-white shadow-md">
            {currentDrawer ? `${currentDrawer.name} is drawing` : "Waiting"}
          </span>
        </div>

        <div className="mt-4 mb-4 grid max-h-[280px] gap-3 overflow-auto pr-1">
          {roomState.chat.map((entry) => (
            <div
              key={entry.id}
              className={`grid gap-1 rounded-2xl border-2 px-4 py-3 text-lg shadow-md ${
                entry.kind === "correct-guess"
                  ? "border-black bg-crayon-green text-gray-900"
                  : "border-gray-800 bg-yellow-50 text-gray-900"
              }`}
            >
              <strong>{entry.playerName}</strong>
              <span>{entry.text}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            className="w-full rounded-xl border-2 border-gray-800 bg-yellow-50 px-4 py-3 text-xl text-gray-900 shadow-md outline-none transition focus:border-black"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={isDrawer ? "Send a chat message" : "Type your guess"}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitMessage();
              }
            }}
          />
          <button className={`${buttonClass} bg-crayon-orange`} onClick={submitMessage}>
            Send
          </button>
        </div>
      </div>
    </aside>
  );
}
