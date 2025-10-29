const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const { auth, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Get all assignments for a course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('instructor', 'name email');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single assignment
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('submissions.student', 'name email');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper middleware for file upload with Cloudinary
const tryUpload = async (req, res, next) => {
  try {
    await new Promise((resolve) => {
      upload.single('file')(req, res, (err) => {
        if (err) {
          console.log('Upload error:', err.message);
        }
        resolve();
      });
    });
    next();
  } catch (error) {
    console.log('Upload error ignored:', error.message);
    next();
  }
};

// Get all assignments (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('course', 'title description instructor')
      .populate('instructor', 'name email')
      .populate('submissions.student', 'name email')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create assignment (instructor only)
router.post('/', auth, authorize('instructor', 'admin'), tryUpload, async (req, res) => {
  try {
    console.log('Creating assignment...');
    console.log('Request body:', req.body);
    console.log('File exists:', !!req.file);
    console.log('User:', req.user);
    
    const { title, description, courseId, dueDate } = req.body;
    
    if (!title || !courseId) {
      return res.status(400).json({ message: 'Title and Course ID are required' });
    }
    
    // Handle file upload with Cloudinary
    let fileUrl = '';
    let cloudinaryPublicId = '';
    
    if (req.file) {
      // Log everything to understand what CloudinaryStorage returns
      console.log('=== CLOUDINARY FILE OBJECT ===');
      console.log('req.file:', JSON.stringify(req.file, null, 2));
      console.log('req.file.all_keys:', Object.keys(req.file));
      
      // Try all possible properties
      fileUrl = req.file.path || 
                req.file.url || 
                req.file.secure_url || 
                req.file.filename || 
                '';
      
      cloudinaryPublicId = req.file.public_id || 
                          req.file.filename || 
                          req.file.originalname || 
                          '';
      
      // If we have public_id but not complete URL, construct it
      if (cloudinaryPublicId && !fileUrl.includes('http')) {
        fileUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${cloudinaryPublicId}`;
      }
      
      console.log('Final fileUrl:', fileUrl);
      console.log('Final publicId:', cloudinaryPublicId);
    }
    
    const assignment = new Assignment({
      title,
      description,
      course: courseId,
      instructor: req.user._id,
      fileUrl: fileUrl,
      cloudinaryPublicId: cloudinaryPublicId,
      dueDate: dueDate ? new Date(dueDate) : undefined
    });
    
    console.log('Saving assignment...');
    await assignment.save();
    console.log('Assignment saved successfully');
    
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit assignment (student only)
router.post('/:id/submit', auth, authorize('student'), tryUpload, async (req, res) => {
  try {
    console.log('Submitting assignment...');
    console.log('File:', req.file);
    
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === req.user._id.toString()
    );
    
    // Handle file URL - use Cloudinary
    let fileUrl = '';
    if (req.file) {
      console.log('=== STUDENT FILE UPLOAD ===');
      console.log('req.file:', JSON.stringify(req.file, null, 2));
      
      // Try all possible properties
      fileUrl = req.file.path || 
                req.file.url || 
                req.file.secure_url || 
                req.file.filename || 
                '';
      
      // If we have public_id but not complete URL, construct it
      const publicId = req.file.public_id || req.file.filename;
      if (publicId && !fileUrl.includes('http')) {
        fileUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${publicId}`;
      }
      
      console.log('Final fileUrl:', fileUrl);
    }
    
    if (existingSubmission) {
      existingSubmission.fileUrl = fileUrl;
      existingSubmission.cloudinaryPublicId = req.file ? req.file.originalname : '';
      existingSubmission.submittedAt = new Date();
      existingSubmission.status = 'submitted';
      await assignment.save();
      return res.json({ message: 'Assignment updated', assignment });
    }
    
    assignment.submissions.push({
      student: req.user._id,
      fileUrl: fileUrl,
      cloudinaryPublicId: req.file ? req.file.originalname : '',
      status: 'submitted'
    });
    
    await assignment.save();
    res.json({ message: 'Assignment submitted', assignment });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Grade assignment (instructor only)
router.put('/:id/grade/:submissionId', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    const submission = assignment.submissions.id(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    submission.grade = req.body.grade;
    submission.feedback = req.body.feedback;
    submission.status = 'graded';
    
    await assignment.save();
    res.json({ message: 'Assignment graded', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

