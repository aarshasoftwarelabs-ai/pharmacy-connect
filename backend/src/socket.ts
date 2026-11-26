import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from './config/env';
import { AuthUser } from './middleware/auth';

const JWT_SECRET = env.JWT_SECRET as string;

let io: SocketIOServer;

export const initializeSocket = (server: HttpServer) => {
  const allowedOrigins = env.CORS_ORIGINS === '*'
    ? '*'
    : (env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : '*');

  io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  // Require valid JWT on socket handshake for strict store room isolation
  io.use((socket, next) => {
    const authHeader = socket.handshake.headers?.authorization;
    const headerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;
    const token =
      (typeof socket.handshake.auth?.token === 'string' && socket.handshake.auth.token) ||
      headerToken;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as AuthUser | undefined;
    console.log(`🔌 Client connected to Socket: ${socket.id} (pharmacy=${user?.pharmacyId || 'none'})`);

    if (user?.userId && Number(user.userId) > 0 && !user.isStaff) {
      socket.join(`user_${user.userId}`);
    }

    // Pharmacy PC will join only the room matching its authenticated JWT pharmacy ID
    socket.on('join_pharmacy', (requestedPharmacyId?: string | number) => {
      if (!user) return;
      const targetPharmacyId =
        user.role === 'ADMIN' && Number(requestedPharmacyId) > 0
          ? Number(requestedPharmacyId)
          : Number(user.pharmacyId);

      if (!Number.isInteger(targetPharmacyId) || targetPharmacyId <= 0) {
        return;
      }

      socket.join(`pharmacy_${targetPharmacyId}`);
      console.log(`Pharmacy ${targetPharmacyId} joined their socket room.`);
    });

    // Relay mobile scans directly to the authenticated pharmacy's PC POS counter
    socket.on('mobile_scan_item', (data: any) => {
      if (!user || !data) return;
      const targetPharmacyId =
        user.role === 'ADMIN' && Number(data.pharmacyId) > 0
          ? Number(data.pharmacyId)
          : Number(user.pharmacyId);

      if (Number.isInteger(targetPharmacyId) && targetPharmacyId > 0) {
        const isolatedPayload = { ...data, pharmacyId: targetPharmacyId };
        io.to(`pharmacy_${targetPharmacyId}`).emit('mobile_item_scanned', isolatedPayload);
        console.log(`📡 Relayed mobile scan (${data.medicineName}) to pharmacy_${targetPharmacyId}`);
      }
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
