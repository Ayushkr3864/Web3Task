import { DEFAULT_ROOM_SETTINGS } from "@skribbl-clone/shared";
import { useMemo, useState } from "react";

export default function LobbyPanel({ publicRooms, onCreateRoom, onJoinRoom }) {
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [settings, setSettings] = useState(DEFAULT_ROOM_SETTINGS);

  const canSubmit = useMemo(() => playerName.trim().length >= 2, [playerName]);

  return (
    <div className="shell landing-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Web3Task Assignment</p>
          <h1>Multiplayer drawing game with a clean full-stack structure.</h1>
          <p className="hero-copy">
            Create a room, invite friends, draw in real time, and race to guess the word before the timer runs out.
          </p>
        </div>

        <div className="panel-grid">
          <div className="panel">
            <h2>Create room</h2>
            <label>
              Name
              <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Enter your name" />
            </label>

            <div className="settings-grid">
              <label>
                Players
                <input
                  type="number"
                  min="2"
                  max="12"
                  value={settings.maxPlayers}
                  onChange={(event) => setSettings({ ...settings, maxPlayers: Number(event.target.value) })}
                />
              </label>
              <label>
                Rounds
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.totalRounds}
                  onChange={(event) => setSettings({ ...settings, totalRounds: Number(event.target.value) })}
                />
              </label>
              <label>
                Draw time
                <input
                  type="number"
                  min="20"
                  max="240"
                  value={settings.drawTimeSeconds}
                  onChange={(event) => setSettings({ ...settings, drawTimeSeconds: Number(event.target.value) })}
                />
              </label>
              <label>
                Word choices
                <input
                  type="number"
                  min="2"
                  max="5"
                  value={settings.wordChoices}
                  onChange={(event) => setSettings({ ...settings, wordChoices: Number(event.target.value) })}
                />
              </label>
            </div>

            <div className="inline-controls">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.hintsEnabled}
                  onChange={(event) => setSettings({ ...settings, hintsEnabled: event.target.checked })}
                />
                Hints enabled
              </label>

              <select value={settings.visibility} onChange={(event) => setSettings({ ...settings, visibility: event.target.value })}>
                <option value="public">Public room</option>
                <option value="private">Private room</option>
              </select>
            </div>

            <button disabled={!canSubmit} onClick={() => onCreateRoom({ playerName, settings })}>
              Create room
            </button>
          </div>

          <div className="panel">
            <h2>Join room</h2>
            <label>
              Name
              <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Enter your name" />
            </label>
            <label>
              Room code
              <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="ABC123" />
            </label>
            <button disabled={!canSubmit || !joinCode.trim()} onClick={() => onJoinRoom({ playerName, roomCode: joinCode })}>
              Join with code
            </button>

            <div className="room-list">
              <div className="room-list-header">
                <h3>Open public rooms</h3>
                <span>{publicRooms.length}</span>
              </div>
              {publicRooms.length === 0 ? (
                <p className="muted">No public rooms yet. Create the first one.</p>
              ) : (
                publicRooms.map((room) => (
                  <button key={room.roomId} className="room-row" onClick={() => onJoinRoom({ playerName, roomCode: room.roomCode })}>
                    <span>
                      <strong>{room.roomCode}</strong> by {room.hostName}
                    </span>
                    <span>
                      {room.playerCount}/{room.maxPlayers}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
