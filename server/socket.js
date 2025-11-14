const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Project = require('./model/Project');
const ChatMessage = require('./model/ChatMessage');

const memberPopulate = {
  path: 'members.user',
  select: 'username displayName avatarUrl status lastActiveAt',
};

async function getProjectForMember(projectId, userId) {
  return Project.findOne({ _id: projectId, 'members.user': userId });
}

async function updatePresence(projectId, userId, presence) {
  const project = await getProjectForMember(projectId, userId);
  if (!project) return null;
  project.members = project.members.map((member) => {
    if (member.user.toString() === userId.toString()) {
      member.presence = presence;
      member.lastActiveAt = new Date();
    }
    return member;
  });
  await project.save();
  return Project.findById(projectId).populate(memberPopulate);
}

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL?.split(',') || '*',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    socket.projects = new Set();

    socket.on('joinProject', async ({ projectId }) => {
      if (!projectId) return;
      const project = await getProjectForMember(projectId, socket.userId);
      if (!project) return;
      socket.join(projectId);
      socket.projects.add(projectId);
      const populated = await updatePresence(projectId, socket.userId, 'viewing');
      if (populated) {
        io.to(projectId).emit('presence:update', populated.members);
      }
    });

    socket.on('leaveProject', async ({ projectId }) => {
      if (!projectId) return;
      socket.leave(projectId);
      socket.projects.delete(projectId);
      const populated = await updatePresence(projectId, socket.userId, 'offline');
      if (populated) {
        io.to(projectId).emit('presence:update', populated.members);
      }
    });

    socket.on('presence:update', async ({ projectId, status }) => {
      if (!projectId) return;
      const allowed = ['offline', 'viewing', 'editing'];
      const nextStatus = allowed.includes(status) ? status : 'viewing';
      const populated = await updatePresence(projectId, socket.userId, nextStatus);
      if (populated) {
        io.to(projectId).emit('presence:update', populated.members);
      }
    });

    socket.on('chat:message', async ({ projectId, message }) => {
      if (!projectId || !message?.trim()) return;
      const project = await getProjectForMember(projectId, socket.userId);
      if (!project) return;
      const chatMessage = await ChatMessage.create({
        project: projectId,
        sender: socket.userId,
        message: message.trim(),
      });
      const populated = await chatMessage.populate('sender', 'displayName username avatarUrl');
      io.to(projectId).emit('chat:message', populated);
    });

    socket.on('disconnect', async () => {
      await Promise.all(
        Array.from(socket.projects).map(async (projectId) => {
          const populated = await updatePresence(projectId, socket.userId, 'offline');
          if (populated) {
            io.to(projectId).emit('presence:update', populated.members);
          }
        })
      ).catch(() => {});
    });
  });

  return io;
}

module.exports = initSocket;
