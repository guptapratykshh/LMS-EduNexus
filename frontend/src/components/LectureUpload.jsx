import React, { useState } from 'react';
import axios from 'axios';

const LectureUpload = ({ courseId, onUpload }) => {
  const [lectureData, setLectureData] = useState({
    title: '',
    description: '',
    video: null,
    duration: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setLectureData({ ...lectureData, video: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', lectureData.title);
      formData.append('description', lectureData.description);
      formData.append('duration', lectureData.duration);
      if (lectureData.video) {
        formData.append('video', lectureData.video);
      }

      const response = await axios.post(`/api/courses/${courseId}/lectures`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Lecture uploaded:', response.data);
      setSuccess('Lecture uploaded successfully!');
      setLectureData({ title: '', description: '', video: null, duration: '' });
      
      // Hide the upload form after success
      const uploadForm = document.getElementById('lecture-upload-form');
      if (uploadForm) {
        uploadForm.style.display = 'none';
      }
      
      if (onUpload) onUpload();
    } catch (error) {
      console.error('Error uploading lecture:', error);
      setError(error.response?.data?.message || 'Failed to upload lecture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lecture-upload">
      <h3>Upload Lecture</h3>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Lecture Title</label>
          <input
            type="text"
            value={lectureData.title}
            onChange={(e) => setLectureData({ ...lectureData, title: e.target.value })}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={lectureData.description}
            onChange={(e) => setLectureData({ ...lectureData, description: e.target.value })}
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label>Video File</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
          />
        </div>
        
        <div className="form-group">
          <label>Duration (e.g., 10:30)</label>
          <input
            type="text"
            value={lectureData.duration}
            onChange={(e) => setLectureData({ ...lectureData, duration: e.target.value })}
            placeholder="0:00"
          />
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Lecture'}
        </button>
      </form>
    </div>
  );
};

export default LectureUpload;

