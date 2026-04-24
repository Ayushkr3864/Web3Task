export const SERVER_EVENTS = {
  ROOM_CREATED: "room:created",
  ROOM_STATE: "room:state",
  ROOM_LIST: "room:list",
  ROUND_STARTED: "round:started",
  CHAT_MESSAGE: "chat:message",
  GAME_ERROR: "game:error",
};

export const CLIENT_EVENTS = {
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_TOGGLE_READY: "room:toggle-ready",
  ROOM_START_GAME: "room:start-game",
  ROUND_CHOOSE_WORD: "round:choose-word",
  DRAW_STROKE: "draw:stroke",
  DRAW_UNDO: "draw:undo",
  DRAW_CLEAR: "draw:clear",
  CHAT_GUESS: "chat:guess",
  CHAT_MESSAGE: "chat:message",
};
