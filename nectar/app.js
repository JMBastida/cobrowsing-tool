const http = require('http');
const cors = require('cors');
const log4js = require('log4js');
const express = require('express');
const SocketIo = require('socket.io');
const CONFIG = require('./config');
const database = require('./src/shared/database/mongo');

let io;

const logger = log4js.getLogger('SERVER');
logger.level = 'debug';

const app = express();

function handleOrigin(origin, callback) {
  // if (
  //   CONFIG.ENVIRONMENT === 'PRODUCTION' &&
  //   (!origin || origin.toLowerCase().includes('localhost'))
  //   ) callback(new Error(`Not allowed CORS. Origin: ${origin}`));
  // else callback(null, true);
  callback(null, true);
}

app.use(cors({ origin: handleOrigin }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/public/media', express.static(`${__dirname}/public/media`));
app.use('/public/fonts', express.static(`${__dirname}/public/fonts`));

app.set('view engine', 'ejs');
app.set('port', CONFIG.PORT);

let server;
database.connect().then(() => {
  const appRoutes = require('./src/routes/app-routes');
  const libRoutes = require('./src/routes/lib-routes');
  const viewRoutes = require('./src/routes/view-routes');
  const socketModule = require('./src/modules/public/socket');
  const dbInitializer = require('./src/shared/database/initializer');
  dbInitializer.initialize();
  app.use('/api', appRoutes);
  app.use('/v', viewRoutes);
  app.use('/p', libRoutes);
  app.get(/.*/, (req, res) => res.status(404).send());
  server = http.createServer(app);
  // Listen on 0.0.0.0 to accept connections from other containers
  server.listen(CONFIG.PORT, '0.0.0.0', () => {
    logger.info(`Node server listening on http://localhost:${CONFIG.PORT}`);
  });
  io = SocketIo(
    server,
    {
      path: '/ws/',
      cors: {
        origin: handleOrigin,
        methods: ['GET', 'POST', 'PUT', 'HEAD', 'PATCH', 'DELETE', 'OPTIONS']
      },
    }
  );
  socketModule.init(io);
});
