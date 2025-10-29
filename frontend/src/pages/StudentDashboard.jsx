import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user]);

  const fetchEnrolledCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('All courses:', response.data);
      console.log('Current user ID:', user?._id);
      
      // Filter for enrolled courses with proper ID matching
      const enrolled = response.data.filter(course => {
        if (!course.enrollments || course.enrollments.length === 0) return false;
        
        // Try different ID formats
        const userId = user?._id;
        const enrolledIds = course.enrollments;
        
        // Check if any enrollment matches user ID
        return enrolledIds.some(enrollment => {
          const enrollmentId = enrollment?._id || enrollment;
          return enrollmentId === userId || 
                 enrollmentId?.toString() === userId?.toString() ||
                 enrollmentId?._id === userId ||
                 enrollmentId?._id?.toString() === userId?.toString();
        });
      });
      
      console.log('Enrolled courses:', enrolled);
      setEnrolledCourses(enrolled);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading your courses...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{ justifyContent: 'center' }}>
        <h1>My Enrolled Courses</h1>
      </div>
      
      {enrolledCourses.length === 0 ? (
        <div className="empty-state">
          <p>You haven't enrolled in any courses yet.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {enrolledCourses.map(course => (
            <div key={course._id} className="course-card">
              <h3>{course.title}</h3>
              <p className="course-description">{course.description}</p>
              <div className="course-meta">
                <span>By {course.instructor?.name}</span>
                <span>{course.lectures?.length || 0} lectures</span>
              </div>
              <div className="course-actions">
                <Link to={`/course/${course._id}`} className="btn btn-primary">
                  Continue Learning
                </Link>
                <Link to={`/chat/${course._id}`} className="btn btn-secondary">
                  Chat
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

