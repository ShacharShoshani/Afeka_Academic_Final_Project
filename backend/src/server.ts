import { createServer } from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { initSocketServer } from './socket/socket.js';

const httpServer = createServer(app);
initSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
    console.log(`Livin API running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});
