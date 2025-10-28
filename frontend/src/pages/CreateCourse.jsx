import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CreateCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    status: 'draft'
  });
  const [lectureData, setLectureData] = useState({
    title: '',
    description: '',
    video: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/courses', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Wait a moment for the course to be fully saved
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to instructor dashboard to see the new course
      navigate('/instructor');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-course">
      <h1>Create New Course</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleCreateCourse} className="course-form">
        <div className="form-group">
          <label>Course Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows="5"
          />
        </div>
        
        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
        </div>
        
        <div className="form-group">
          <label>Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Course'}
        </button>
      </form>
    </div>
  );
};

export default CreateCourse;

