import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [chats, setChats] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [videoLectures, setVideoLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [usersRes, coursesRes, assignmentsRes, chatsRes, messagesRes, lecturesRes] = await Promise.all([
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/courses', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/assignments', { headers: { Authorization: `Bearer ${token}` } }).catch((err) => { console.log('Assignments error:', err.message); return { data: [] }; }),
        axios.get('/api/chat/all', { headers: { Authorization: `Bearer ${token}` } }).catch((err) => { console.log('Chats API error:', err.message); return { data: [] }; }),
        axios.get('/api/chat/messages/all', { headers: { Authorization: `Bearer ${token}` } }).catch((err) => { console.log('Messages API error:', err.message); return { data: [] }; }),
        axios.get('/api/courses/lectures/all', { headers: { Authorization: `Bearer ${token}` } }).catch((err) => { console.log('Lectures API error:', err.message); return { data: [] }; })
      ]);
      console.log('✅ Fetched chats:', chatsRes.data?.length || 0);
      console.log('✅ Fetched messages:', messagesRes.data?.length || 0);
      console.log('✅ Fetched lectures:', lecturesRes.data?.length || 0);
      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setAssignments(assignmentsRes.data);
      setChats(chatsRes.data || []);
      setAllMessages(messagesRes.data || []);
      setVideoLectures(lecturesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Course deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const studentsCount = users.filter(u => u.role === 'student').length;
  const instructorsCount = users.filter(u => u.role === 'instructor').length;

  const totalSubmissions = assignments.reduce((acc, assignment) => acc + (assignment.submissions?.length || 0), 0);
  const totalMessages = allMessages.length;
  const totalChats = chats.length;
  const totalLectures = videoLectures.length;

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
        <h1>Admin Dashboard</h1>
      </div>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e5e7eb', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            border: 'none', 
            background: activeTab === 'overview' ? '#3b82f6' : 'transparent',
            color: activeTab === 'overview' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0',
            fontWeight: '600'
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            border: 'none', 
            background: activeTab === 'users' ? '#3b82f6' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0',
            fontWeight: '600'
          }}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            border: 'none', 
            background: activeTab === 'courses' ? '#3b82f6' : 'transparent',
            color: activeTab === 'courses' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0',
            fontWeight: '600'
          }}
        >
          Courses ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            border: 'none', 
            background: activeTab === 'assignments' ? '#3b82f6' : 'transparent',
            color: activeTab === 'assignments' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0',
            fontWeight: '600'
          }}
        >
          Assignments ({assignments.length})
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            border: 'none', 
            background: activeTab === 'submissions' ? '#3b82f6' : 'transparent',
            color: activeTab === 'submissions' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0',
            fontWeight: '600'
          }}
        >
          Submissions ({totalSubmissions})
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            border: 'none', 
            background: activeTab === 'chats' ? '#3b82f6' : 'transparent',
            color: activeTab === 'chats' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0',
            fontWeight: '600'
          }}
        >
          💬 Live Chats ({totalChats})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          style={{ 
            padding: '0.75rem 1.5rem', 
            border: 'none', 
            background: activeTab === 'videos' ? '#3b82f6' : 'transparent',
            color: activeTab === 'videos' ? 'white' : '#666',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0',
            fontWeight: '600'
          }}
        >
          🎥 Video Lectures ({totalLectures})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Users</h3>
              <p className="stat-number">{users.length}</p>
            </div>
            <div className="stat-card">
              <h3>Students</h3>
              <p className="stat-number">{studentsCount}</p>
            </div>
            <div className="stat-card">
              <h3>Instructors</h3>
              <p className="stat-number">{instructorsCount}</p>
            </div>
            <div className="stat-card">
              <h3>Total Courses</h3>
              <p className="stat-number">{courses.length}</p>
            </div>
            <div className="stat-card">
              <h3>Total Assignments</h3>
              <p className="stat-number">{assignments.length}</p>
            </div>
            <div className="stat-card">
              <h3>Total Submissions</h3>
              <p className="stat-number">{totalSubmissions}</p>
            </div>
            <div className="stat-card">
              <h3>Total Chats</h3>
              <p className="stat-number">{totalChats}</p>
            </div>
            <div className="stat-card">
              <h3>Total Messages</h3>
              <p className="stat-number">{totalMessages}</p>
            </div>
            <div className="stat-card">
              <h3>Total Lectures</h3>
              <p className="stat-number">{totalLectures}</p>
            </div>
          </div>

          <div className="admin-section" style={{ marginTop: '2rem' }}>
            <h2>Recent Courses</h2>
            <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {courses.slice(0, 6).map(course => (
                <div key={course._id} className="course-card" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', backgroundColor: '#fff' }}>
                  <h3>{course.title}</h3>
                  <p className="course-description" style={{ color: '#666', fontSize: '0.9rem' }}>{course.description?.substring(0, 100)}...</p>
                  <div className="course-meta" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.85rem', color: '#999' }}>
                    <span>By {course.instructor?.name}</span>
                    <span>{course.lectures?.length || 0} lectures</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <h2>All Users</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td><span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#e5e7eb' }}>{user.role}</span></td>
                    <td>
                      <button 
                        onClick={() => handleDeleteUser(user._id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="admin-section">
          <h2>All Courses</h2>
          <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {courses.map(course => (
              <div key={course._id} className="course-card" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#fff', position: 'relative' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>{course.title}</h3>
                <p className="course-description" style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {course.description?.substring(0, 150)}{course.description?.length > 150 ? '...' : ''}
                </p>
                <div className="course-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
                  <span>By {course.instructor?.name}</span>
                  <span>{course.lectures?.length || 0} lectures</span>
                </div>
                <button 
                  onClick={() => handleDeleteCourse(course._id, course.title)}
                  className="btn btn-danger btn-sm"
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  🗑️ Delete Course
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="admin-section">
          <h2>All Assignments</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {assignments.map(assignment => (
              <div key={assignment._id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '0.5rem', color: '#1e3a5f' }}>{assignment.title}</h3>
                    <p style={{ color: '#666', marginTop: '0.5rem', marginBottom: '1rem' }}>{assignment.description}</p>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#999', marginBottom: '1rem' }}>
                      <span>By: {assignment.instructor?.name}</span>
                      <span>Course: {assignment.course?.title}</span>
                      <span>Submissions: {assignment.submissions?.length || 0}</span>
                    </div>
                    
                    {/* Show Assignment File */}
                    {assignment.fileUrl && (
                      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                        <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#0369a1' }}>📎 Assignment File:</p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <a href={assignment.fileUrl} download className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                            📥 Download
                          </a>
                          <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                            🔗 View File
                          </a>
                        </div>
                        
                        {/* Preview for PDFs and Images */}
                        {assignment.fileUrl.includes('.pdf') || assignment.fileUrl.match(/pdf/i) ? (
                          <iframe 
                            src={assignment.fileUrl} 
                            width="100%" 
                            height="300px" 
                            style={{ marginTop: '1rem', border: '1px solid #ddd', borderRadius: '5px' }}
                            title="Assignment Preview"
                          />
                        ) : assignment.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || assignment.fileUrl.includes('image/') ? (
                          <img 
                            src={assignment.fileUrl} 
                            alt="Assignment" 
                            style={{ marginTop: '1rem', maxWidth: '100%', maxHeight: '200px', borderRadius: '5px', border: '1px solid #ddd' }}
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="admin-section">
          <h2>All Submissions</h2>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {assignments.filter(a => a.submissions?.length > 0).map(assignment => (
              <div key={assignment._id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h3 style={{ marginBottom: '1rem', color: '#1e3a5f' }}>{assignment.title}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>Course: {assignment.course?.title}</p>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {assignment.submissions?.map(submission => (
                    <div key={submission._id} style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div>
                          <p style={{ fontWeight: '600', color: '#1e3a5f' }}>👤 Student: {submission.student?.name || 'Unknown'}</p>
                          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
                        </div>
                        {submission.grade && (
                          <span style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: '600' }}>
                            Grade: {submission.grade}
                          </span>
                        )}
                      </div>
                      {submission.fileUrl && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                            📄 View File
                          </a>
                          <a href={submission.fileUrl} download className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>
                            📥 Download
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Chats Tab */}
      {activeTab === 'chats' && (
        <div className="admin-section">
          <h2>💬 Live Chat Monitoring</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Monitor all conversations between students and instructors across all courses
          </p>
          
          {/* Course Chats */}
          <h3 style={{ marginBottom: '1rem' }}>Course Chats ({chats.length})</h3>
          {chats.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic' }}>No active chats yet</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {chats.map(chat => (
                <div key={chat._id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#fff' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: '#3b82f6' }}>Course: {chat.course?.title || 'Unknown Course'}</h4>
                  <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    Messages: {chat.messages?.length || 0} | Last updated: {new Date(chat.updatedAt).toLocaleString()}
                  </p>
                  
                  {chat.messages?.length > 0 && (
                    <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto' }}>
                      {chat.messages.slice(-5).map((msg, idx) => (
                        <div key={idx} style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: msg.sender?.role === 'instructor' ? '#dbeafe' : '#f3f4f6', borderRadius: '3px' }}>
                          <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{msg.sender?.name || 'Unknown'}</p>
                          <p style={{ fontSize: '0.85rem', color: '#666' }}>{msg.text}</p>
                          <small style={{ color: '#999' }}>{new Date(msg.createdAt || msg.timestamp).toLocaleString()}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* All Messages Feed */}
          <h3 style={{ marginTop: '3rem', marginBottom: '1rem' }}>All Messages ({allMessages.length})</h3>
          {allMessages.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic' }}>No messages yet</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto' }}>
              {allMessages.slice(0, 50).map((msg, idx) => (
                <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '5px', padding: '1rem', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: '600' }}>{msg.sender?.name || 'Unknown'}</p>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>{msg.courseTitle}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem' }}>{msg.text}</p>
                  <small style={{ color: '#999' }}>{new Date(msg.createdAt || msg.timestamp).toLocaleString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Lectures Tab */}
      {activeTab === 'videos' && (
        <div className="admin-section">
          <h2>🎥 Video Lectures Monitor</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            View all video lectures uploaded by instructors across all courses
          </p>
          
          {videoLectures.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic' }}>No video lectures uploaded yet</p>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {videoLectures.map((lecture, idx) => (
                <div key={lecture._id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ marginBottom: '0.5rem', color: '#3b82f6' }}>{lecture.title}</h3>
                      <p style={{ fontSize: '0.9rem', color: '#666' }}>{lecture.description}</p>
                    </div>
                    {lecture.duration && (
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '0.85rem' }}>
                        ⏱️ {lecture.duration}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
                      <div>
                        <strong>Course:</strong> {lecture.courseTitle || 'Unknown'}
                      </div>
                      <div>
                        <strong>Instructor:</strong> {lecture.instructorName || 'Unknown'}
                      </div>
                      {lecture.cloudinaryPublicId && (
                        <div>
                          <strong>Storage ID:</strong> {lecture.cloudinaryPublicId}
                        </div>
                      )}
                    </div>
                  </div>

                  {lecture.videoUrl && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem' }}>📹 Video URL:</strong>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {lecture.videoUrl.includes('too large') || lecture.videoUrl.includes('Cloudinary needed') ? (
                          <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '5px', width: '100%' }}>
                            <p style={{ color: '#92400e', fontWeight: '600' }}>⚠️ Video File Too Large</p>
                            <p style={{ color: '#78350f', fontSize: '0.9rem' }}>{lecture.videoUrl}</p>
                          </div>
                        ) : lecture.videoUrl.startsWith('data:video/') || lecture.videoUrl.startsWith('http://') || lecture.videoUrl.startsWith('https://') ? (
                          <>
                            <a 
                              href={lecture.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-primary"
                              style={{ fontSize: '0.9rem' }}
                            >
                              ▶️ Play Video
                            </a>
                            <a 
                              href={lecture.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-secondary"
                              style={{ fontSize: '0.9rem' }}
                            >
                              🔗 Open in New Tab
                            </a>
                          </>
                        ) : (
                          <p style={{ color: '#999', fontStyle: 'italic' }}>No video URL available</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

