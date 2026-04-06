const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isDeletedForEveryone: {
    type: Boolean,
    default: false,
  },
  deletedForUsers: {
    type: [String],
    default: [],
  },
  isPinned: {
    type: Boolean,
    default: false,
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
