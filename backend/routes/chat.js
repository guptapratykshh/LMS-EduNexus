const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Course = require('../models/Course');
const { auth, authorize } = require('../middleware/auth');

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

// Get all chats across all courses (admin only)
router.get('/all', auth, authorize('admin'), async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate('course', 'title instructor')
      .populate('messages.sender', 'name email')
      .sort({ updatedAt: -1 });
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all messages across all chats (admin only)
router.get('/messages/all', auth, authorize('admin'), async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate('course', 'title instructor')
      .populate('messages.sender', 'name email');
    
    // Flatten all messages from all chats
    const allMessages = chats.flatMap(chat => 
      chat.messages.map(msg => ({
        ...msg.toObject(),
        courseTitle: chat.course?.title || 'Unknown Course',
        courseId: chat.course?._id || null
      }))
    );
    
    // Sort by timestamp (newest first)
    allMessages.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
    
    res.json(allMessages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

