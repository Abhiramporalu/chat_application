const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Message = require('./models/Message');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://poralaabhiram_db_user:YkD118HtFULjUyYw@cluster0.7bahe6y.mongodb.net/adverayze_chat?appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// REST API
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }).limit(300);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Socket.io Real-Time Handling
io.on('connection', (socket) => {

  socket.on('sendMessage', async (data) => {
    try {
      const { content, senderId } = data;
      const newMessage = new Message({
        content,
        senderId,
      });
      await newMessage.save();
      
      io.emit('receiveMessage', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('deleteMessageForMe', async ({ messageId, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message) {
        if (!message.deletedForUsers.includes(userId)) {
          message.deletedForUsers.push(userId);
          await message.save();
        }
        // Send back an ack directly to the requesting client
        socket.emit('messageDeletedForMe', { messageId });
      }
    } catch (error) {
      console.error('Error deleting message for me:', error);
    }
  });

  socket.on('deleteMessageForEveryone', async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message) {
        message.isDeletedForEveryone = true;
        await message.save();
        io.emit('messageDeletedForEveryone', { messageId });
      }
    } catch (error) {
      console.error('Error deleting message for everyone:', error);
    }
  });

  socket.on('togglePinMessage', async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message) {
        message.isPinned = !message.isPinned;
        await message.save();
        io.emit('messagePinnedToggled', message);
      }
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  });

  socket.on('disconnect', () => {
    // Optionally handle disconnects quietly here
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
