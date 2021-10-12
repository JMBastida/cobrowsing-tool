/**
 * Test huge amount of client connections
 * launch: node scripts/testing/socket-connections.js abc123abc123abc123abc123 2000
 */

const { io } = require("socket.io-client");
const CONFIG = require('../../config');

if (
  !process.argv[2] || !process.argv[2].length || 
  !process.argv[3] || !process.argv[3].length || 
  !process.argv[4] || !process.argv[4].length
  ) {
  console.log('Add an entityId, total clients and emit interval in ms to process: node scripts/testing/socket-connections.js abc123abc123abc123abc123 2000 100');
  process.exit(0);
}

const MAX_CLIENTS = process.argv[3];
const TEST_ENTITY_ID = process.argv[2];
const EMIT_INTERVAL_IN_MS = process.argv[4];
const URL = CONFIG.API_BASE_URL;
const CLIENT_CREATION_INTERVAL_IN_MS = 10;
const options = {
  path: '/ws/',
  forceNew: true,
  transports: ["websocket"],
  query: `sessionId=${''}&entityId=${TEST_ENTITY_ID}&location=testingLocation`,
};

let clientCount = 0;
let lastReport = new Date().getTime();
let packetsSinceLastReport = 0;

const createClient = () => {
  const socket = io(URL, options);

  setInterval(() => {
    socket.emit("test-emit");
  }, EMIT_INTERVAL_IN_MS);

  socket.on('test-emit-back', () => {
    packetsSinceLastReport++;
  });

  socket.on("disconnect", (reason) => {
    console.log(`disconnect due to ${reason}`);
  });

  if (++clientCount < MAX_CLIENTS) {
    setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS);
  }
};

createClient();

const printReport = () => {
  const now = new Date().getTime();
  const durationSinceLastReport = (now - lastReport) / 1000;
  const packetsPerSeconds = (
    packetsSinceLastReport / durationSinceLastReport
  ).toFixed(2);

  console.log(
    `client count: ${clientCount} ; average packets received per second: ${packetsPerSeconds}`
  );

  packetsSinceLastReport = 0;
  lastReport = now;
};

setInterval(printReport, 5000);