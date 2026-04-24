import { useEffect, useMemo, useState } from "react";
import CanvasBoard from "./components/CanvasBoard.jsx";
import LobbyPanel from "./components/LobbyPanel.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { useGameSocket } from "./hooks/useGameSocket.js";

export default function App() {
  const {
    playerId,
    roomState,
    publicRooms,
    wordOptions,
    error,
    clearError,
    createRoom,
    joinRoom,
    toggleReady,
    startGame,
    chooseWord,
    sendStroke,
    undoStroke,
    clearCanvas,
    sendGuess,
    sendChat,
  } = useGameSocket();

  const [selectedWord, setSelectedWord] = useState("");
  const currentDrawerId = roomState?.round.currentDrawerId ?? "";
  const isDrawer = currentDrawerId === playerId;

  useEffect(() => {
    if (roomState?.round.phase === "round-ended" || roomState?.round.phase === "game-ended") {
      setSelectedWord("");
    }
  }, [roomState?.round.phase]);

  const pageTitle = useMemo(() => {
    if (!roomState) {
      return "Skribbl Clone";
    }

    if (roomState.round.phase === "game-ended") {
      const winner = roomState.players.find((player) => player.id === roomState.winnerId);
      return winner ? `${winner.name} wins` : "Game over";
    }

    return roomState.round.phase === "waiting" ? "Lobby" : "Match in progress";
  }, [roomState]);

  if (!roomState) {
    return (
      <>
        {error && (
          <div className="toast" onClick={clearError}>
            {error}
          </div>
        )}
        <LobbyPanel publicRooms={publicRooms} onCreateRoom={createRoom} onJoinRoom={joinRoom} />
      </>
    );
  }

  return (
    <div className="shell game-shell">
      {error && (
        <div className="toast" onClick={clearError}>
          {error}
        </div>
      )}

      <header className="game-header">
        <div>
          <p className="eyebrow">React + Node.js + Socket.IO</p>
          <h1>{pageTitle}</h1>
        </div>
        <div className="status-stack">
          <span>Players: {roomState.players.length}</span>
          <span>Phase: {roomState.round.phase}</span>
        </div>
      </header>

      <main className="game-grid">
        <CanvasBoard roomState={roomState} isDrawer={isDrawer} onSendStroke={sendStroke} onUndo={undoStroke} onClear={clearCanvas} />
        <Sidebar
          roomState={roomState}
          playerId={playerId}
          wordOptions={wordOptions}
          selectedWord={selectedWord}
          onChooseWord={(roomCode, word) => {
            setSelectedWord(word);
            chooseWord(roomCode, word);
          }}
          onToggleReady={toggleReady}
          onStartGame={startGame}
          onSendGuess={sendGuess}
          onSendChat={sendChat}
        />
      </main>
    </div>
  );
}
