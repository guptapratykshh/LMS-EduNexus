const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { auth } = require('../middleware/auth');

// Get chat for a course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    let chat = await Chat.findOne({ course: req.params.courseId });
    
    if (!chat) {
      chat = new Chat({ course: req.params.courseId, messages: [] });
      await chat.save();
    }
    
    await chat.populate('messages.sender', 'name email');
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add message to chat (Socket.io handles real-time, this is for persistence)
router.post('/course/:courseId/message', auth, async (req, res) => {
  try {
    let chat = await Chat.findOne({ course: req.params.courseId });
    
    if (!chat) {
      chat = new Chat({ course: req.params.courseId, messages: [] });
    }
    
    const message = {
      sender: req.user._id,
      senderName: req.user.name,
      text: req.body.text
    };
    
    chat.messages.push(message);
    await chat.save();
    
    // Emit to Socket.io if available
    if (global.io) {
      global.io.to(req.params.courseId).emit('receive_message', message);
    }
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

