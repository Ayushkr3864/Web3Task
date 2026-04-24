import cors from "cors";
import express from "express";

export function createApp(roomService) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/rooms/public", (_req, res) => {
    res.json({ rooms: roomService.getPublicRooms() });
  });

  return app;
}
