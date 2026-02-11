import { verify } from '../auth/jwt.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import RoomMessage from '../models/RoomMessage.js';
import DirectMessage from '../models/DirectMessage.js';

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

    // users join their own private group to receive direct messages
    socket.join(`user:${socket.user.id}`)

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
    socket.on('room:send', async ({ roomId, message }, callback) => {
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
          userId: socket.user.id,
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

    socket.on('user:list', async (_, callback) => {
      try {
        const userId = socket.user.id;
        const sent = await DirectMessage.distinct('targetId', { userId });
        const received = await DirectMessage.distinct('userId', { targetId: userId });
        const userIds = [...new Set([...sent.map(String), ...received.map(String)])];
        const users = await User.find({ _id: { $in: userIds } }, 'username');
        callback({ success: true, users });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('user:join', async (targetId, callback) => {
      try {
        const messages = await DirectMessage.find({
          $or: [
            { userId: socket.user.id, targetId },
            { userId: targetId, targetId: socket.user.id }
          ]
        }).sort({ dateSent: 1 }).lean();
        const user = await User.findById(targetId);
        if (!user) {
          return callback({ error: 'User not found' });
        }
        callback({ success: true, targetId, username: user.username, messages });
      } catch (err) {
        callback({ error: err.message });
      }
    })

    // Send a message directly to user
    socket.on('user:send', async ({ userId, message }, callback) => {
      try {
        const user = await User.findById(userId);
        if (!user) {
          return callback({ error: 'User not found' });
        }

        const newMessage = await DirectMessage.create({
          userId: socket.user.id,
          user: socket.user.username,
          targetId: user.id,
          target: user.username,
          message
        });

        const messageData = {
          userId: socket.user.id,
          user: newMessage.user,
          message: newMessage.message,
          dateSent: newMessage.dateSent
        };

        // Send to private user group
        appChannel.to(`user:${user.id}`).emit('user:message', messageData);
        // Also send to the sender so they see their own message
        appChannel.to(`user:${socket.user.id}`).emit('user:message', messageData);

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
