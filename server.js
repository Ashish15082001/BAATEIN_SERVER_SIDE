const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);

const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

//this is array containing all valid rooms available to join or already created by any user.
const validRooms = {
  asdasdsaasd: true,
};

/*
this object  stores socket history, which comes in need when user gets new socketid (when user refreshes web page or login).

key 'clientId' is provided by client / user which helps in checking if client was already joined to some rooms, but with older socketId.

socketId may change but clientId remains same, hence it helps in identifying clients.
*/
const socketHistory = {
  clientId: {
    currentSocket: "socket object",
    joinedRooms: ["room1", "room2", ["..."]],
  },
};

/*
  whenever client gets new socketId, other clients having old socketId can have problems sending data to other client which has new socketId.
  
  hence, whenever any client A wants to communicate with other clent B, and A has old socketId od B, then this object is refrenced to find new socketId.

  here, 'socketId' key has refrence to 'clientId' key's value (in socketHistory object), where value of 'socketId' key is equal to 'clientId' key's value having new socketId of same client.
*/
const oldSocketIds = {
  socketId: "pointer to clientId object obove, whose currentSocket is latest",
};

const io = new Server(server, {
  cors: {
    origin: "https://baatein-by-ashishsingh.netlify.app",
  },
});

io.on("connection", (socket) => {
  // when connection is established between client and server( through socket), that client is passed the socketId assigned by server to this client.
  socket.emit("store socket id", { socketId: socket.id });

  // this function runs when client requests to create a room.
  socket.on("create room", ({ newRoomId, clientId }) => {
    // newRoomId , supplied by client gets inserted in object, socketHistory object gets new data and client is joined to that room.

    validRooms[newRoomId] = true;
    socketHistory[clientId].joinedRooms.push(newRoomId);
    socket.join(newRoomId);

    socket.emit("room created", { newRoomId });
  });

  // this function runs when client requests to join a room.
  socket.on("join room", ({ roomId, userName, clientId }) => {
    // client is joined to room only if supplied room id is valid (available in validRooms object)
    if (validRooms[roomId]) {
      socket.join(roomId);
      socketHistory[clientId].joinedRooms.push(roomId);

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

  // this function runs when any user wants to send message to room.
  socket.on(
    "new room message",
    ({ roomId, sender, senderEmail, message, date, time }) => {
      socket.to(roomId).emit("store new room message", {
        roomId,
        sender,
        senderEmail,
        message,
        date,
        time,
      });
    }
  );

  // if client is old, or the client was already joined to some rooms then it is joined to those rooms.
  socket.on("have i joined any room", ({ clientId }) => {
    console.log("before entering if statement", clientId);

    // is false when user has not created or joined any room.
    if (socketHistory[clientId]) {
      const joinedRooms = socketHistory[clientId].joinedRooms;
      const oldScocket = socketHistory[clientId].currentSocket;

      oldSocketIds[oldScocket.id] = socketHistory[clientId];
      socketHistory[clientId].currentSocket = socket;

      console.log("after entering if statement", clientId);

      for (const roomId of joinedRooms) {
        oldScocket.leave(roomId);
        socket.join(roomId);
      }
    } else socketHistory[clientId] = { currentSocket: socket, joinedRooms: [] };
  });

  // this function runs when any user wants to notify other client.
  socket.on(
    "notify",
    ({ recieverSocketID, title, description, payload, isSilent }) => {
      // recieverSocketID may be incorrect, as socketId gets chenged on every login and refresh, hence it is cumplulsary to check if if this socketId is latest or old. If is is old (by checking in oldSocketIds) then new socketId is  taken from oldSocketIds object.
      if (oldSocketIds[recieverSocketID])
        recieverSocketID = oldSocketIds[recieverSocketID].currentSocket.id;

      io.to(recieverSocketID).emit("new notification", {
        title,
        description,
        payload,
        isSilent,
      });
    }
  );
});

server.listen(process.env.PORT || 8000, () => {
  console.log("listening on *:8000", process.env.PORT);
});
