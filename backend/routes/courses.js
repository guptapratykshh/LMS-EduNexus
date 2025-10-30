const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { cloudinary, upload } = require('../config/cloudinary');

// Use Cloudinary upload middleware for lectures
const uploadMiddleware = upload.single('video');

// Get all courses (published only for students, all for instructors)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    // Students only see published courses, instructors and admins see all
    if (req.user.role === 'student') {
      query = { status: 'published' };
    }
    // If no query is set, it will return all courses for instructors/admin
    
    const courses = await Course.find(query)
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get courses by instructor
router.get('/instructor/my-courses', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single course
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('lectures')
      // Ensure enrollments are fully available so client can reliably detect membership
      .populate('enrollments', '_id name email role');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create course (instructor only)
router.post('/', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { title, description, category, price, status } = req.body;
    
    const course = new Course({
      title,
      description,
      category,
      price,
      instructor: req.user._id,
      status: status || 'published' // Default to published so courses are visible
    });
    
    await course.save();
    
    // Update user's createdCourses array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdCourses: course._id }
    });
    
    // Populate instructor data before sending
    await course.populate('instructor', 'name email');
    
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course
router.put('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    Object.assign(course, req.body);
    await course.save();
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete course
router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await course.deleteOne();
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload lecture video with Cloudinary
router.post('/:id/lectures', auth, authorize('instructor', 'admin'), uploadMiddleware, async (req, res) => {
  try {
    console.log('Uploading lecture to Cloudinary...');
    console.log('Request body:', req.body);
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.path})` : 'No file');
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get Cloudinary URL from req.file.path (uploaded by multer-cloudinary)
    let videoUrl = '';
    let videoFilename = '';
    
    if (req.file) {
      videoUrl = req.file.path; // This is the Cloudinary URL
      videoFilename = req.file.filename;
      console.log('Video uploaded to Cloudinary:', videoUrl);
    }
    
    const lecture = {
      title: req.body.title,
      description: req.body.description,
      videoUrl: videoUrl,
      cloudinaryPublicId: videoFilename,
      duration: req.body.duration || '0:00'
    };
    
    console.log('Saving lecture...');
    course.lectures.push(lecture);
    await course.save();
    
    console.log('Lecture saved successfully with Cloudinary URL');
    res.status(201).json(course);
  } catch (error) {
    console.error('Error uploading lecture:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete lecture from course
router.delete('/:courseId/lectures/:lectureId', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Remove lecture from array
    course.lectures = course.lectures.filter(
      lecture => lecture._id.toString() !== req.params.lectureId
    );
    
    await course.save();
    res.json({ message: 'Lecture deleted successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Enroll in course
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Convert to string for comparison
    const userId = req.user._id.toString();
    const enrollmentIds = course.enrollments.map(id => id.toString());
    
    // Check if already enrolled
    if (enrollmentIds.includes(userId)) {
      return res.status(400).json({ message: 'Already enrolled' });
    }
    
    // Add user to enrollments
    course.enrollments.push(req.user._id);
    await course.save();
    
    // Update user's enrolled courses
    await User.findByIdAndUpdate(req.user._id, {
      $push: { enrolledCourses: course._id }
    });
    
    // Populate before sending
    await course.populate('instructor', 'name email');
    
    res.json({ message: 'Enrolled successfully', course });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all video lectures across all courses (admin only)
router.get('/lectures/all', auth, authorize('admin'), async (req, res) => {
  try {
    // Find all courses
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .select('title instructor lectures')
      .sort({ createdAt: -1 });
    
    console.log('📹 Found courses:', courses.length);
    
    // Flatten all lectures from all courses
    const allLectures = courses.flatMap(course => {
      if (course.lectures && course.lectures.length > 0) {
        return course.lectures.map(lecture => ({
          ...lecture.toObject(),
          courseTitle: course.title,
          courseId: course._id,
          instructorName: course.instructor?.name,
          instructorEmail: course.instructor?.email
        }));
      }
      return [];
    });
    
    console.log('📹 Total lectures found:', allLectures.length);
    
    // Sort by createdAt (newest first)
    allLectures.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
    
    res.json(allLectures);
  } catch (error) {
    console.error('📹 Error fetching lectures:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

