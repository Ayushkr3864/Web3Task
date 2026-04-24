import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { CLIENT_EVENTS, DEFAULT_ROOM_SETTINGS, SERVER_EVENTS } from "@skribbl-clone/shared";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

export function useGameSocket() {
  const socketRef = useRef(null);
  const [playerId, setPlayerId] = useState("");
  const [roomState, setRoomState] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [wordOptions, setWordOptions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on(SERVER_EVENTS.ROOM_CREATED, ({ playerId: newPlayerId, state }) => {
      setPlayerId(newPlayerId);
      setRoomState(state);
      setError("");
    });

    socket.on(SERVER_EVENTS.ROOM_STATE, (state) => {
      setRoomState(state);
    });

    socket.on(SERVER_EVENTS.ROOM_LIST, ({ rooms }) => {
      setPublicRooms(rooms);
    });

    socket.on(SERVER_EVENTS.ROUND_STARTED, ({ state, wordOptions: nextOptions }) => {
      setRoomState(state);
      setWordOptions(nextOptions);
    });

    socket.on(SERVER_EVENTS.GAME_ERROR, ({ message }) => {
      setError(message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = (eventName, payload) => {
    socketRef.current?.emit(eventName, payload);
  };

  return {
    playerId,
    roomState,
    publicRooms,
    wordOptions,
    error,
    clearError: () => setError(""),
    createRoom: ({ playerName, settings = DEFAULT_ROOM_SETTINGS }) =>
      emit(CLIENT_EVENTS.ROOM_CREATE, { playerName, settings }),
    joinRoom: ({ roomCode, playerName }) =>
      emit(CLIENT_EVENTS.ROOM_JOIN, { roomCode: roomCode.toUpperCase(), playerName }),
    toggleReady: (roomCode) => emit(CLIENT_EVENTS.ROOM_TOGGLE_READY, { roomCode }),
    startGame: (roomCode) => emit(CLIENT_EVENTS.ROOM_START_GAME, { roomCode }),
    chooseWord: (roomCode, word) => {
      setWordOptions([]);
      emit(CLIENT_EVENTS.ROUND_CHOOSE_WORD, { roomCode, word });
    },
    sendStroke: (roomCode, stroke) => emit(CLIENT_EVENTS.DRAW_STROKE, { roomCode, stroke }),
    undoStroke: (roomCode) => emit(CLIENT_EVENTS.DRAW_UNDO, { roomCode }),
    clearCanvas: (roomCode) => emit(CLIENT_EVENTS.DRAW_CLEAR, { roomCode }),
    sendGuess: (roomCode, text) => emit(CLIENT_EVENTS.CHAT_GUESS, { roomCode, text }),
    sendChat: (roomCode, text) => emit(CLIENT_EVENTS.CHAT_MESSAGE, { roomCode, text }),
  };
}
