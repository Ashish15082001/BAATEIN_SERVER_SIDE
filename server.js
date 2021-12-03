const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);

const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

//comment
const ValidRooms = {
  asdasdsaasd: true,
};

const socketHistory = {
  clientId: {
    currentSocket: "socket object",
    joinedRooms: ["room1", "room2", ["..."]],
  },
};

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  socket.emit("store socket id", { socketId: socket.id });

  console.log(socket.id, ` connected`);
  socket.on("create room", ({ newRoomId, clientId }) => {
    ValidRooms[newRoomId] = true;
    socket.join(newRoomId);

    socketHistory[clientId] = {
      currentSocket: socket,
      joinedRooms: [newRoomId],
    };

    console.log("new room = ", newRoomId);
    console.log("client id = ", clientId);

    socket.emit("room created", { newRoomId });
  });

  socket.on("join room", ({ roomId, userName, clientId }) => {
    if (ValidRooms[roomId]) {
      socket.join(roomId);

      socketHistory[clientId] = {
        currentSocket: socket,
        joinedRooms: [roomId],
      };

      console.log("joined room = ", roomId);
      console.log("clientId = ", clientId);

      socket.emit("room joined", {
        roomId,
        userName,
      });
      socket.to(roomId).emit("new user joined", { userName });
    } else {
      socket.emit("can not join", {
        reason:
          "room does not exists. Please create new room or type correct room id",
      });
    }
  });

  socket.on("new message", ({ roomId, sender, message }) => {
    console.log(roomId, sender, message);
    socket.to(roomId).emit("store new message", { message, sender });
  });

  socket.on("notify", ({ recieverSocketID, title, userName, email }) => {
    console.log("notify event...");
    io.to(recieverSocketID).emit("new notification", {
      title,
      userName,
      email,
    });
  });

  socket.on("have i joined any room", ({ clientId }) => {
    if (socketHistory[clientId]) {
      const joinedRooms = socketHistory[clientId].joinedRooms;
      const oldScocket = socketHistory[clientId].currentSocket;

      socketHistory[clientId].currentSocket = socket;

      for (const roomId of joinedRooms) {
        oldScocket.leave(roomId);
        socket.join(roomId);
      }
    }
  });
});

server.listen(process.env.PORT || 8000, () => {
  console.log("listening on *:8000", process.env.PORT);
});
