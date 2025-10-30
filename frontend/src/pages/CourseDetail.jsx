import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LectureUpload from '../components/LectureUpload';
import VideoModal from '../components/VideoModal';

const CourseDetail = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    // Reset state when course ID changes
    setCourse(null);
    setLoading(true);
    setIsEnrolled(false);
    
    // Fetch course data when auth is loaded
    if (!authLoading) {
      fetchCourse();
    }
  }, [id, authLoading, user]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(response.data);
      
      // Check if enrolled - handle populated objects or simple IDs
      if (response.data.enrollments && response.data.enrollments.length > 0 && user) {
        const userId = user?._id?.toString();
        console.log('🔍 Checking enrollment for user:', userId);
        console.log('📋 Course enrollments:', JSON.stringify(response.data.enrollments, null, 2));
        
        const enrolled = response.data.enrollments.some(enrollment => {
          // Handle both populated object {_id: '...'} and simple string ID
          const enrollmentId = (enrollment?._id || enrollment)?.toString();
          const isEnrolled = enrollmentId === userId;
          console.log('Comparing enrollmentId:', enrollmentId, 'with userId:', userId, '->', isEnrolled);
          return isEnrolled;
        });
        
        console.log('✅ Final enrollment status:', enrolled);
        setIsEnrolled(enrolled);
      } else {
        console.log('ℹ️ No enrollments found or user not loaded');
        setIsEnrolled(false);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/courses/${id}/enroll`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Enrollment successful:', response.data);
      alert('Successfully enrolled in course!');
      
      // Refresh the course data to get updated enrollments
      setLoading(true);
      const courseResponse = await axios.get(`/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourse(courseResponse.data);
      
      // Now user should be in enrollments
      const userId = user?._id?.toString();
      if (courseResponse.data.enrollments && courseResponse.data.enrollments.length > 0) {
        const enrolled = courseResponse.data.enrollments.some(enrollment => {
          const enrollmentId = (enrollment?._id || enrollment)?.toString();
          return enrollmentId === userId;
        });
        console.log('✅ Enrollment status after enroll:', enrolled);
        setIsEnrolled(enrolled);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error enrolling:', error);
      const errorMessage = error.response?.data?.message || 'Failed to enroll in course';
      alert(errorMessage);
      setLoading(false);
    }
  };

  const handleDeleteLecture = async (lectureId, lectureTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${lectureTitle}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/courses/${id}/lectures/${lectureId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Lecture deleted successfully!');
      fetchCourse();
    } catch (error) {
      console.error('Error deleting lecture:', error);
      alert(error.response?.data?.message || 'Failed to delete lecture');
    }
  };

  if (loading) return <div className="loading">Loading course...</div>;
  if (!course) return <div>Course not found</div>;

  const isInstructor = course.instructor?._id === user?._id || course.instructor === user?._id;

  return (
    <div className="course-detail">
      <div className="course-header">
        <h1>{course.title}</h1>
        <p className="course-description">{course.description}</p>
        <div className="course-info">
          <span>Instructor: {course.instructor?.name}</span>
          <span>Lectures: {course.lectures?.length || 0}</span>
        </div>
        
        <div className="course-actions">
          {isEnrolled && !isInstructor && (
            <>
              <Link to={`/chat/${course._id}`} className="btn btn-secondary">
                💬 Chat with Instructor
              </Link>
              <Link to={`/course/${course._id}/assignments`} className="btn btn-secondary">
                📝 Assignments
              </Link>
              <Link to={`/course/${course._id}/live`} className="btn btn-secondary">
                📺 Live Classes
              </Link>
            </>
          )}
          {isInstructor && (
            <>
              <Link to={`/edit-course/${course._id}`} className="btn btn-secondary">
                Edit Course
              </Link>
              <Link to={`/course/${course._id}/assignments`} className="btn btn-secondary">
                View Assignments
              </Link>
              <Link to={`/course/${course._id}/live`} className="btn btn-secondary">
                📅 Schedule Live
              </Link>
            </>
          )}
        </div>
        
        {!loading && !authLoading && !isEnrolled && !isInstructor && user?.role === 'student' && (
          <button onClick={handleEnroll} className="btn btn-primary">
            Enroll in Course
          </button>
        )}
      </div>

      {(isEnrolled || isInstructor) && (
        <div className="lectures-section">
          <div className="lectures-header">
            <h2>Course Lectures ({course.lectures?.length || 0})</h2>
            {isInstructor && (
              <button 
                onClick={() => {
                  const uploadForm = document.getElementById('lecture-upload-form');
                  uploadForm.style.display = uploadForm.style.display === 'none' ? 'block' : 'none';
                }}
                className="btn btn-primary"
              >
                + Add Lecture
              </button>
            )}
          </div>
          
          {isInstructor && (
            <div id="lecture-upload-form" style={{ display: 'none', marginBottom: '2rem' }}>
              <LectureUpload courseId={course._id} onUpload={fetchCourse} />
            </div>
          )}
          {course.lectures?.length === 0 ? (
            <p>No lectures uploaded yet.</p>
          ) : (
            <div className="lectures-list">
              {course.lectures?.map((lecture, index) => (
                <div key={lecture._id || index} className="lecture-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{lecture.title}</h3>
                    {isInstructor && (
                      <button
                        onClick={() => handleDeleteLecture(lecture._id, lecture.title)}
                        className="btn btn-danger"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                        title="Delete Lecture"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <p>{lecture.description}</p>
                  {lecture.videoUrl ? (
                    lecture.videoUrl.includes('too large') || lecture.videoUrl.includes('Cloudinary needed') ? (
                      <div style={{ padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '5px' }}>
                        <p style={{ color: '#92400e', fontWeight: '600' }}>⚠️ Video File Too Large</p>
                        <p style={{ color: '#78350f' }}>{lecture.videoUrl}</p>
                        <p style={{ color: '#92400e', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          For large video files, please configure Cloudinary for proper storage.
                        </p>
                      </div>
                    ) : lecture.videoUrl.startsWith('data:video/') || lecture.videoUrl.startsWith('http://') || lecture.videoUrl.startsWith('https://') ? (
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => setSelectedVideo(lecture.videoUrl)}
                          className="btn btn-primary video-play-btn"
                          style={{ padding: '0.4rem 0.9rem', fontSize: '0.9rem', lineHeight: 1, display: 'inline-block', width: 'auto' }}
                        >
                          ▶️ Play Video
                        </button>
                        {lecture.duration && (
                          <span style={{
                            color: '#374151',
                            fontSize: '0.85rem',
                            background: '#eef2ff',
                            border: '1px solid #dbeafe',
                            padding: '2px 8px',
                            borderRadius: '9999px'
                          }}>
                            {lecture.duration}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: '#999', fontStyle: 'italic' }}>No video available</p>
                    )
                  ) : (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>No video available</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {selectedVideo && (
        <VideoModal 
          videoUrl={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </div>
  );
};

export default CourseDetail;

