import { createServer } from "node:http";
import { Server } from "socket.io";
import { RoomService } from "./application/services/RoomService.js";
import { registerSocketHandlers } from "./infrastructure/socket/registerSocketHandlers.js";
import { createApp } from "./presentation/http/app.js";

const port = Number(process.env.PORT ?? 3001);
const roomService = new RoomService();
const app = createApp(roomService);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? "*",
  },
});

registerSocketHandlers(io, roomService);

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
