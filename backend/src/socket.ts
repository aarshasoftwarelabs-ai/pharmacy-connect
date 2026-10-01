import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export const initializeSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Adjust this for production (e.g., specific domains)
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket: ${socket.id}`);

    // Pharmacy PC will join a room specific to its pharmacy ID
    socket.on('join_pharmacy', (pharmacyId: string) => {
      socket.join(`pharmacy_${pharmacyId}`);
      console.log(`Pharmacy ${pharmacyId} joined their socket room.`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected from Socket: ${socket.id}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};
