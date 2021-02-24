const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const redis = require("redis");

const { COMMAND_ENQUEUE, COMMAND_PROCESSED } = require("./constants");

/* Server declaration */
const app = express();
const apiServer = new (class Server {
  constructor() {}

  async run(websocketPort, apiPort) {
    /* Initialization */
    app.use(express.static(__dirname));
    app.use(cors({ origin: "http://localhost:3000", credentials: true }));
    app.use(express.json());
    const server = http.createServer(app);

    const redisClient = redis.createClient();
    redisClient.on("connect", () => {
      console.log("Redis client connected");
    });
    redisClient.on("error", (err) => {
      console.log("Redis client error", err);
    });

    const io = socketIo.listen(server, { path: "/betEvents" });
    io.on("connection", async (socket) => {
      console.log("Web socket connected with id", socket.id);

      /* Ensure to isolate new connected socket */
      socket.join(socket.id);

      /* Listening for client websocket events (bets submit) */
      socket.on("SubmitBets", (data) => {
        console.log("Received a new bets submit", data);

        const { command, count, mid } = data;
        if (command != COMMAND_ENQUEUE || !count || !mid) return;

        /* Store data to redis queue */
        for (let i = 1; i <= count; i++) {
          const dataToStore = `${socket.id}:${mid}:${i}`;
          redisClient.rpush("commandToProcess", dataToStore);
        }
      });

      /* Handle socket disconnection */
      socket.on("disconnect", () => {
        console.log("Socket with id", socket.id, "disconnected");
        socket.disconnect(true);
      });

      /* Endpoint in charge of sending bet results through websocket */
      app.post("/bet", (req, res) => {
        const { command, cid, idx, mid } = req.body;
        if (command != COMMAND_PROCESSED || !idx || !mid)
          return res.sendStatus(400);

        const payload = { command, result: { idx }, mid };
        socket.to(cid).emit("BetProcessed", payload);
        return res.sendStatus(201);
      });
    });

    server.listen(websocketPort, () => {
      console.log(`Websocket listening on port ${websocketPort}`);
    });

    app.listen(apiPort, () => {
      console.log(`API listening on port ${apiPort}`);
    });
  }
})();

/* Running server */
apiServer.run(1111, 2222).catch((err) => {
  console.log(`Backend API error ${err}`);
});
