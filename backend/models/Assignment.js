const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: String,
  cloudinaryPublicId: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  grade: Number,
  feedback: String,
  status: {
    type: String,
    enum: ['pending', 'submitted', 'graded'],
    default: 'pending'
  }
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: String,
  cloudinaryPublicId: String,
  dueDate: Date,
  submissions: [submissionSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);

