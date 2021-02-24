const redis = require("redis");
const fetch = require("node-fetch");
const worker = require("worker_threads");
const yargs = require("yargs");

const { COMMAND_PROCESSED } = require("../api/constants");
/* 300ms <= PROCESSED_DELAY <= 500 */
const PROCESS_DELAY = 300 + Math.random() * 200;

const apiUrl = "http://localhost:2222";
const endpoint = "/bet";

const redisClient = redis.createClient();
redisClient.on("error", (err) => {
  console.log("Redis client error", err);
});

if (worker.isMainThread) {
  const nbWorkers = yargs.argv.instances;
  for (let i = 0; i < nbWorkers; i++) {
    new worker.Worker(__filename);
  }
  console.log(nbWorkers, "workers launched");
} else {
  processBetEvents();
}

function processBetEvents() {
  redisClient.blpop("commandToProcess", 0, (_, item) => {
    const bet = item[1];

    /* Simulate bet process (delay) */
    setTimeout(async () => {
      const command = COMMAND_PROCESSED;
      const betInfos = bet.split(":");
      const cid = betInfos[0],
        mid = betInfos[1],
        idx = betInfos[2];

      const reqBody = { command, idx, cid, mid };
      await fetch(apiUrl + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
      processBetEvents();
    }, PROCESS_DELAY);
  });
}
