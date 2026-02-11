import { verify } from '../auth/jwt.js';
import Room from '../models/Room.js';
import RoomMessage from '../models/RoomMessage.js';

export function registerAppChannel(io) {
  const appChannel = io.of('/app');

  appChannel.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));

    try {
      socket.user = verify(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  appChannel.on('connection', (socket) => {
    console.log(`${socket.user.username} connected`);

    socket.emit('profile', {
      username: socket.user.username
    });

    // Get all rooms
    socket.on('room:list', async (data, callback) => {
      try {
        const rooms = await Room.find();
        callback({ success: true, rooms });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    // Join a room
    socket.on('room:join', async (roomId, callback) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) {
          return callback({ error: 'Room not found' });
        }

        socket.join(roomId);

        // Get recent messages for this room
        const messages = await RoomMessage.find({ roomId })
          .sort({ timestamp: 1 })
          .lean();

        callback({
          success: true,
          roomId,
          roomName: room.name,
          messages: messages
        });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    // Leave a room
    socket.on('room:leave', (roomId, callback) => {
      socket.leave(roomId);
      if (callback) callback({ success: true, roomId });
    });

    // Send a message to a room
    socket.on('message:send', async ({ roomId, message }, callback) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) {
          return callback({ error: 'Room not found' });
        }

        const newMessage = await RoomMessage.create({
          roomId: roomId,
          room: room.name,
          userId: socket.user.id,
          user: socket.user.username,
          message
        });

        const messageData = {
          user: newMessage.user,
          message: newMessage.message,
          dateSent: newMessage.dateSent
        };

        // Broadcast to all users in the room
        appChannel.to(roomId).emit('room:message', messageData);

        callback({ success: true, message: messageData });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`${socket.user.username} disconnected`);
    });
  });
}
