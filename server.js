const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);

const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

//comment
let roomData = {
  "hlihbjhl-k": {
    messages: [
      { message: "hi", sender: "inki" },
      { message: "hi", sender: "inki" },
    ],
    members: ["ashu", "heera", "nina"],
    createdBy: "ashish singh",
    roomId: "hlihbjhl-k",
  },
};

const io = new Server(server, {
  cors: {
    origin: "https://baatein-byashish.netlify.app",
  },
});

io.on("connection", (socket) => {
  console.log("user [" + socket.id + "] connected to socket");

  socket.on("create room", ({ newRoomId, userName }) => {
    const newRoomDataObject = {
      messages: [],
      members: [],
      createdBy: userName,
      roomId: newRoomId,
    };

    roomData[newRoomId] = newRoomDataObject;
    socket.emit("room created", { newRoomId });
  });

  socket.on("join room", ({ roomId, userName }) => {
    if (roomData[roomId]) {
      socket.join(roomId);

      if (!roomData[roomId].members.some((member) => member === userName))
        roomData[roomId].members.push(userName);

      socket.emit("room joined", { roomData: roomData[roomId] });
      socket.to(roomId).emit("update active users", {
        updatedMembers: roomData[roomId].members,
      });

      console.log("hi");
    } else {
      socket.emit("can not join", {
        reason:
          "room does not exists. Please create new room or type correct room id",
      });
    }
  });

  socket.on("send message", ({ roomId, sender, message }) => {
    console.log(roomId, sender, message);
    console.log(roomData[roomId]);
    console.log();
    console.log();
    console.log();

    roomData[roomId].messages.push({ message, sender });
    socket.to(roomId).emit("recieve message", { message, sender });
  });
});

server.listen(process.env.PORT || 8000, () => {
  console.log("listening on *:8000", process.env.PORT);
});
