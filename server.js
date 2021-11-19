const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);

const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

//comment
let messages = {
  "hlihbjhl-k": [
    { message: "hi", sender: "inki" },
    { message: "hi", sender: "inki" },
  ],
};

let joinedClients = {
  "hlihbjhl-k": ["ashu", "heera", "nina"],
};

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("user [" + socket.id + "] connected to socket");

  socket.on("join room", ({ roomId, userName }) => {
    console.log("inside join room...");
    console.log(userName, roomId);

    if (!joinedClients[roomId]) joinedClients[roomId] = [userName];
    else joinedClients[roomId] = [userName, ...joinedClients[roomId]];

    socket.join(roomId);
    if (!messages[roomId]) socket.emit("joined room", { messages: 0 });
    else
      socket.emit("joined room", {
        messages: messages[roomId],
      });

    console.log(joinedClients[roomId]);

    io.to(roomId).emit("update active users", {
      activeUsers: joinedClients[roomId],
    });
  });

  socket.on("text to room", ({ message, sender, roomId }) => {
    console.log(sender, message, roomId);

    if (messages[roomId] === undefined)
      messages[roomId] = [{ message, sender }];
    else messages[roomId] = [...messages[roomId], { message, sender }];
    io.to(roomId).emit("recieved message", { messages: messages[roomId] });
  });

  socket.on("leave room", ({ roomId, userName }) => {
    joinedClients[roomId] = joinedClients[roomId].filter(
      (client) => client !== userName
    );
    io.to(roomId).emit("update active users", {
      activeUsers: joinedClients[roomId],
    });
  });
});

server.listen(process.env.PORT || 8000, () => {
  console.log("listening on *:8000", process.env.PORT);
});
