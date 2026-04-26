import { useEffect, useMemo, useState } from "react";
import CanvasBoard from "./components/CanvasBoard.jsx";
import LobbyPanel from "./components/LobbyPanel.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { useGameSocket } from "./hooks/useGameSocket.js";

const toastClass =
  "fixed top-4 right-4 z-20 cursor-pointer rounded-2xl border-4 border-black bg-crayon-red px-4 py-3 text-lg text-white shadow-lg";

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
          <div className={toastClass} onClick={clearError}>
            {error}
          </div>
        )}
        <LobbyPanel publicRooms={publicRooms} onCreateRoom={createRoom} onJoinRoom={joinRoom} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 px-4 py-6 md:px-8">
      {error && (
        <div className={toastClass} onClick={clearError}>
          {error}
        </div>
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 rounded-2xl border-4 border-black bg-crayon-blue px-6 py-5 text-white shadow-lg md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-base uppercase tracking-[0.2em] text-yellow-100">React + Node.js + Socket.IO</p>
            <h1 className="m-0 text-4xl leading-none md:text-5xl">{pageTitle}</h1>
          </div>
          <div className="grid gap-1 rounded-2xl border-2 border-black bg-yellow-50 px-4 py-3 text-right text-lg text-gray-900 shadow-md">
            <span>Players: {roomState.players.length}</span>
            <span>Phase: {roomState.round.phase}</span>
          </div>
        </header>

        <main className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
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
    </div>
  );
}
