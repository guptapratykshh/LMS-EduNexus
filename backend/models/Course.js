const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  videoUrl: String,
  cloudinaryPublicId: String,
  duration: String,
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    default: 'General'
  },
  price: {
    type: Number,
    default: 0
  },
  thumbnail: String,
  lectures: [lectureSchema],
  enrollments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);

