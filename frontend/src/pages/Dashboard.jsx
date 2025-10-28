import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched courses:', response.data);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading courses...</div>;

  return (
    <div className="dashboard">
      <h1>Browse Courses</h1>
      <p>Discover and enroll in courses to enhance your learning journey.</p>
      
      {user?.role === 'student' && (
        <div className="dashboard-alert">
          <Link to="/student">View Your Enrolled Courses</Link>
        </div>
      )}
      
      {user?.role === 'instructor' && (
        <div className="dashboard-alert">
          <Link to="/instructor">Manage Your Courses</Link>
        </div>
      )}
      
      {user?.role === 'admin' && (
        <div className="dashboard-alert">
          <Link to="/admin">Admin Panel</Link>
        </div>
      )}

      <div className="courses-grid">
        {courses.length === 0 ? (
          <p>No courses available</p>
        ) : (
          courses.map(course => (
            <div key={course._id} className="course-card">
              <h3>{course.title}</h3>
              <p className="course-description">{course.description}</p>
              <div className="course-meta">
                <span>By {course.instructor?.name}</span>
                <span>{course.lectures?.length || 0} lectures</span>
              </div>
              <Link to={`/course/${course._id}`} className="btn btn-primary">
                View Course
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;

