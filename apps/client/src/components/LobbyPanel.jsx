import { DEFAULT_ROOM_SETTINGS } from "@skribbl-clone/shared";
import { useMemo, useState } from "react";

const panelClass = "rounded-2xl border-4 border-black bg-white p-6 shadow-lg";
const labelClass = "mb-4 grid gap-2 text-xl text-gray-900";
const inputClass =
  "w-full rounded-xl border-2 border-gray-800 bg-yellow-50 px-4 py-3 text-lg text-gray-900 shadow-md outline-none transition focus:border-black";
const buttonClass =
  "rounded-xl border-4 border-black px-5 py-3 text-xl text-gray-900 shadow-md transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50";

export default function LobbyPanel({ publicRooms, onCreateRoom, onJoinRoom }) {
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [settings, setSettings] = useState(DEFAULT_ROOM_SETTINGS);

  const canSubmit = useMemo(() => playerName.trim().length >= 2, [playerName]);

  return (
    <div className="min-h-screen bg-yellow-50 px-4 py-6 md:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 rounded-2xl border-4 border-black bg-crayon-yellow p-6 shadow-lg md:p-8">
        <div>
          <p className="mb-2 text-base uppercase tracking-[0.2em] text-gray-800">Web3Task Assignment</p>
          <h1 className="m-0 max-w-3xl text-4xl leading-none text-gray-900 md:text-6xl">
            Multiplayer drawing chaos with chunky crayon energy.
          </h1>
          <p className="mt-4 max-w-3xl text-2xl text-gray-800">
            Create a room, invite friends, draw in real time, and race to guess the word before the timer runs out.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className={panelClass}>
            <h2 className="m-0 text-3xl text-gray-900">Create room</h2>
            <p className="mt-2 mb-5 text-xl text-gray-700">Spin up a bright little lobby and set the rules before everyone joins.</p>
            <label className={labelClass}>
              Name
              <input
                className={inputClass}
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Enter your name"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClass}>
                Players
                <input
                  className={inputClass}
                  type="number"
                  min="2"
                  max="12"
                  value={settings.maxPlayers}
                  onChange={(event) => setSettings({ ...settings, maxPlayers: Number(event.target.value) })}
                />
              </label>
              <label className={labelClass}>
                Rounds
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  max="10"
                  value={settings.totalRounds}
                  onChange={(event) => setSettings({ ...settings, totalRounds: Number(event.target.value) })}
                />
              </label>
              <label className={labelClass}>
                Draw time
                <input
                  className={inputClass}
                  type="number"
                  min="20"
                  max="240"
                  value={settings.drawTimeSeconds}
                  onChange={(event) => setSettings({ ...settings, drawTimeSeconds: Number(event.target.value) })}
                />
              </label>
              <label className={labelClass}>
                Word choices
                <input
                  className={inputClass}
                  type="number"
                  min="2"
                  max="5"
                  value={settings.wordChoices}
                  onChange={(event) => setSettings({ ...settings, wordChoices: Number(event.target.value) })}
                />
              </label>
            </div>

            <div className="mb-5 grid gap-4">
              <label className="flex items-center gap-3 rounded-xl border-2 border-gray-800 bg-crayon-green px-4 py-3 text-xl text-gray-900 shadow-md">
                <input
                  className="h-5 w-5 accent-crayon-orange"
                  type="checkbox"
                  checked={settings.hintsEnabled}
                  onChange={(event) => setSettings({ ...settings, hintsEnabled: event.target.checked })}
                />
                Hints enabled
              </label>

              <select
                className={inputClass}
                value={settings.visibility}
                onChange={(event) => setSettings({ ...settings, visibility: event.target.value })}
              >
                <option value="public">Public room</option>
                <option value="private">Private room</option>
              </select>
            </div>

            <button
              className={`${buttonClass} w-full bg-crayon-orange`}
              disabled={!canSubmit}
              onClick={() => onCreateRoom({ playerName, settings })}
            >
              Create room
            </button>
          </div>

          <div className={panelClass}>
            <h2 className="m-0 text-3xl text-gray-900">Join room</h2>
            <p className="mt-2 mb-5 text-xl text-gray-700">Hop into a match with a room code or grab an open public lobby.</p>
            <label className={labelClass}>
              Name
              <input
                className={inputClass}
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Enter your name"
              />
            </label>
            <label className={labelClass}>
              Room code
              <input
                className={inputClass}
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
              />
            </label>
            <button
              className={`${buttonClass} w-full bg-crayon-blue text-white`}
              disabled={!canSubmit || !joinCode.trim()}
              onClick={() => onJoinRoom({ playerName, roomCode: joinCode })}
            >
              Join with code
            </button>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="m-0 text-2xl text-gray-900">Open public rooms</h3>
                <span className="rounded-xl border-2 border-black bg-crayon-red px-3 py-1 text-lg text-white shadow-md">
                  {publicRooms.length}
                </span>
              </div>
              {publicRooms.length === 0 ? (
                <p className="m-0 rounded-xl border-2 border-gray-800 bg-yellow-50 px-4 py-3 text-xl text-gray-700 shadow-md">
                  No public rooms yet. Create the first one.
                </p>
              ) : (
                publicRooms.map((room) => (
                  <button
                    key={room.roomId}
                    className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border-4 border-black bg-crayon-green px-4 py-3 text-left text-xl text-gray-900 shadow-md"
                    onClick={() => onJoinRoom({ playerName, roomCode: room.roomCode })}
                  >
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
