import config from './constants/config.js';
import app from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const port = config.PORT || 2000;

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(' New client connected:', socket.id);

  socket.on('user_connected', (userId) => {
    console.log(` User connected: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(` Socket disconnected: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`server is running on: http://localhost:${port}`);
});
