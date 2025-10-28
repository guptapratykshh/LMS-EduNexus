const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// Configure multer for Cloudinary upload
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file type
    let resourceType = 'auto';
    if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    } else if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.mimetype.includes('pdf')) {
      resourceType = 'raw';
    }
    
    const params = {
      folder: 'edunexus/assignments',
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'mp4', 'mov', 'avi'],
      use_filename: true,
      unique_filename: true,
      overwrite: false
    };
    
    console.log('Cloudinary params:', JSON.stringify(params, null, 2));
    return params;
  }
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };

