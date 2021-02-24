const io = require("socket.io-client");
const yargs = require("yargs");

const nbMessages = yargs.argv.messages,
  nbSockets = yargs.argv.sockets,
  count = yargs.argv.count;

console.log(
  `Stress test started: ${nbSockets} sockets up, each sending ${nbMessages} messages to process ${count} bets`
);

stressTest(nbMessages, nbSockets, count);

/* Stress test process */
async function stressTest(nbMessages, nbSockets, count) {
  let sockets = [];
  /* Initialize sockets */
  for (let j = 0; j < nbSockets; j++) {
    const socket = io.connect("http://localhost:1111", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      path: "/betEvents",
    });
    sockets.push(socket);
  }

  const startDate = new Date().getTime();

  /* Send `nbMessages` of `count` bets on each socket */
  let mid = 1;
  for (let i = 0; i < nbMessages; i++) {
    const ioBody = { command: "enqueue", count, mid };
    sockets.forEach((socket) => {
      socket.emit("SubmitBets", ioBody);
    });
    mid++;
  }

  /* This promises array allows to wait for all bets from all sockets to be processed */
  let promises = [];
  sockets.forEach((socket) => {
    promises.push(listenBetProcessed(socket, 0));
  });
  try {
    console.log("Processing bets, please wait...");
    await Promise.all(promises);
    console.log("All bets have been processed :)");
  } catch (err) {
    console.log("An error occured while processing bets:", err);
  } finally {
    const endDate = new Date().getTime();
    console.log("Time to process bets:", (endDate - startDate) / 1000, " s");
    process.exit(0);
  }
}

async function listenBetProcessed(socket, nbProcessedBet) {
  return new Promise((resolve) => {
    socket.on("BetProcessed", () => {
      nbProcessedBet++;
      if (nbProcessedBet == count * nbMessages)
        resolve(); /* count * nbMessages allows to resolve promise once all messages for a given socket have be processed */
    });
  });
}
