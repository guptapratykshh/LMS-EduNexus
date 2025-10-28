# Quick Setup Guide

## Prerequisites
- Node.js installed
- MongoDB connection string (already provided)

## Steps

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with:
```
PORT=5000
MONGODB_URI=mongodb+srv://aryansingh:aryanmongodb@cluster0.7shqalg.mongodb.net/edunexus
JWT_SECRET=your_super_secret_jwt_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

Then start the server:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Start the development server:
```bash
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### 4. Register and Test

1. Go to http://localhost:3000/register
2. Register as Student, Instructor, or Admin
3. Login and explore the features

## Notes

- For Cloudinary integration, sign up at https://cloudinary.com (free tier available)
- The MongoDB database is already configured
- Socket.io is ready for real-time chat

## Troubleshooting

If you encounter any issues:
1. Make sure both servers are running
2. Check that MongoDB connection is working
3. Verify environment variables are set correctly
4. Clear browser cache if needed

