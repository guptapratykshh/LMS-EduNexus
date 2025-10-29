import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const InstructorDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch once auth is ready and user is loaded
    if (!authLoading) {
      fetchMyCourses();
    }
  }, [authLoading]);

  // Refresh courses when navigating to this page
  const handleCourseAdded = () => {
    fetchMyCourses();
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Course deleted successfully!');
      fetchMyCourses(); // Refresh the list
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(error.response?.data?.message || 'Failed to delete course');
    }
  };

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }
      
      // Use the dedicated endpoint to get my courses
      const response = await axios.get('/api/courses/instructor/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`Found ${response.data.length} courses for instructor`);
      setMyCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="loading">Loading...</div>;
  if (loading) return <div className="loading">Loading your courses...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{ justifyContent: 'center' }}>
        <h1>My Courses</h1>
      </div>
      
      {myCourses.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any courses yet.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {myCourses.map(course => (
            <div key={course._id} className="course-card">
              <h3>{course.title}</h3>
              <p className="course-description">{course.description}</p>
              <div className="course-meta">
                <span>Status: {course.status}</span>
                <span>{course.enrollments?.length || 0} students</span>
              </div>
              <div className="course-actions">
                <Link to={`/course/${course._id}`} className="btn btn-primary">
                  View Course
                </Link>
                <Link to={`/edit-course/${course._id}`} className="btn btn-secondary">
                  Edit Course
                </Link>
                <Link to={`/chat/${course._id}`} className="btn btn-secondary">
                  Chat
                </Link>
                <Link to={`/course/${course._id}/assignments`} className="btn btn-secondary">
                  Assignments
                </Link>
                <button 
                  onClick={() => handleDeleteCourse(course._id, course.title)}
                  className="btn btn-danger delete-btn"
                  title="Delete Course"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;

