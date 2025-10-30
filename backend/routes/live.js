const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const LiveSession = require('../models/LiveSession');
const Course = require('../models/Course');

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

// Create a live session (instructor or admin)
router.post('/', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { courseId, title, description, scheduledAt, durationMinutes } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role === 'instructor' && String(course.instructor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the course instructor can schedule live sessions' });
    }

    const session = await LiveSession.create({
      course: courseId,
      instructor: req.user._id,
      title,
      description,
      scheduledAt,
      durationMinutes: durationMinutes || 60,
      roomCode: generateRoomCode(),
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// List sessions for a course (any enrolled user or instructor/admin)
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const sessions = await LiveSession.find({ course: req.params.courseId })
      .populate('instructor', 'name email')
      .sort({ scheduledAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// List active/live sessions (admin)
router.get('/active', auth, authorize('admin'), async (req, res) => {
  try {
    const sessions = await LiveSession.find({ status: 'live' })
      .populate('course', 'title')
      .populate('instructor', 'name email')
      .sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update status (start/end/cancel)
router.patch('/:id/status', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { status } = req.body; // 'scheduled' | 'live' | 'ended' | 'cancelled'
    const session = await LiveSession.findById(req.params.id).populate('course', 'instructor');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (req.user.role === 'instructor' && String(session.instructor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the session instructor can update status' });
    }

    session.status = status;
    await session.save();

    // Notify room via Socket.io if available
    if (global.io) {
      global.io.to(session.roomCode).emit('live:status', { sessionId: session._id, status });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join a session (track participant and return roomCode)
router.post('/:id/join', auth, async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (!session.participants.some((p) => String(p) === String(req.user._id))) {
      session.participants.push(req.user._id);
      await session.save();
    }

    res.json({ roomCode: session.roomCode, status: session.status });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


