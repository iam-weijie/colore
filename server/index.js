const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;
const io = new Server(server);
app.use(express.json());

const connectedUsers = new Map();

app.post("/dispatch", (req, res) => {
  const { userId, type, notification, content } = req.body;

  const socket = connectedUsers.get(userId);

  if (socket) {
    socket.emit("notification", { type, notification, content });
    return res.status(200).json({ success: true });
  } else {
    return res.status(202).json({ success: false, message: "User offline" });
  }
});

io.on("connection", (socket) => {
  console.log("a connection was made");
  const userId = socket.handshake.query.id;

  if (userId) {
    connectedUsers.set(userId, socket);

    socket.on("disconnect", () => {
      connectedUsers.delete(userId);
    });
  }
});

server.listen(port, () => {
  console.log(`server running at http://localhost:${port}`);
});
