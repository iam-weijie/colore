const dotenv = require("dotenv");
const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const cors = require("cors");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const server = createServer(app);
const port = process.env.EXPO_PUBLIC_SERVER_PORT || 3000;
const io = new Server(server, {
  cors: {
    origin: process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(express.json());

const connectedUsers = new Map();

app.post("/dispatch", (req, res) => {
  const { userId, type, notification, content } = req.body;

  if (!userId || !type || !notification) {
  return res.status(400).json({ success: false, message: "Missing fields" });
}

  const socket = connectedUsers.get(userId);

  if (socket) {
    socket.emit("notification", { type, notification, content });
    return res.status(200).json({ success: true });
  } else {
    return res
      .status(202)
      .json({ success: false, message: `User ${userId} is offline` });
  }
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.id;
  console.log(`${userId} made a connection`);

  if (userId) {
    connectedUsers.set(userId, socket);

    socket.on("disconnect", (reason) => {
      console.log(`${userId} disconnected: ${reason}`);
      connectedUsers.delete(userId);
    });
  }
});

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
