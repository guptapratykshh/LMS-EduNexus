import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    status: 'draft'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({
        title: response.data.title,
        description: response.data.description,
        category: response.data.category,
        status: response.data.status
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/courses/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/instructor');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.title) return <div className="loading">Loading...</div>;

  return (
    <div className="create-course">
      <h1>Edit Course</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleUpdate} className="course-form">
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
          {loading ? 'Updating...' : 'Update Course'}
        </button>
      </form>
    </div>
  );
};

export default EditCourse;

