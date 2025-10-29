import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Assignments = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    file: null,
    dueDate: ''
  });

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/assignments/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setNewAssignment({ ...newAssignment, file: e.target.files[0] });
  };

  const handleSubmitAssignment = async (assignmentId) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', document.getElementById(`file-${assignmentId}`).files[0]);

      await axios.post(`/api/assignments/${assignmentId}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Assignment submitted successfully!');
      fetchAssignments();
    } catch (error) {
      alert('Failed to submit assignment');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', newAssignment.title);
      formData.append('description', newAssignment.description);
      formData.append('courseId', courseId);
      formData.append('dueDate', newAssignment.dueDate);
      if (newAssignment.file) {
        formData.append('file', newAssignment.file);
      }

      console.log('Creating assignment with:', {
        title: newAssignment.title,
        courseId: courseId
      });

      const response = await axios.post('/api/assignments', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Assignment created:', response.data);
      alert('Assignment created successfully!');
      setShowUpload(false);
      setNewAssignment({ title: '', description: '', file: null, dueDate: '' });
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert(error.response?.data?.message || 'Failed to create assignment. Check console for details.');
    }
  };

  if (loading) return <div className="loading">Loading assignments...</div>;

  return (
    <div className="assignments-page">
      <div className="assignments-header">
        <h2>Course Assignments</h2>
        {user?.role === 'instructor' && (
          <button onClick={() => setShowUpload(!showUpload)} className="btn btn-primary">
            + Create Assignment
          </button>
        )}
      </div>

      {showUpload && user?.role === 'instructor' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Create New Assignment</h3>
          <form onSubmit={handleCreateAssignment}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Attachment (Optional)</label>
              <input type="file" onChange={handleFileChange} />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="datetime-local"
                value={newAssignment.dueDate}
                onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Assignment</button>
          </form>
        </div>
      )}

      {assignments.length === 0 ? (
        <p>No assignments yet.</p>
      ) : (
        <div className="assignments-list">
          {assignments.map(assignment => (
            <div key={assignment._id} className="card">
              <h3>{assignment.title}</h3>
              <p>{assignment.description}</p>
              {assignment.dueDate && (
                <p>Due: {new Date(assignment.dueDate).toLocaleString()}</p>
              )}
              
              {/* Show original assignment file to instructors and students */}
              {assignment.fileUrl && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '5px', border: '1px solid #bae6fd' }}>
                  <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#0369a1' }}>📎 Assignment File:</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <a href={assignment.fileUrl} download className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                      📥 Download Assignment
                    </a>
                    <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                      🔗 View File
                    </a>
                  </div>
                  
                  {/* Display assignment file preview */}
                  {assignment.fileUrl.includes('.pdf') || assignment.fileUrl.match(/pdf/i) ? (
                    <iframe 
                      src={assignment.fileUrl} 
                      width="100%" 
                      height="400px" 
                      style={{ marginTop: '1rem', border: '1px solid #ddd', borderRadius: '5px' }}
                      title="Assignment Preview"
                    />
                  ) : assignment.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || assignment.fileUrl.includes('image/') ? (
                    <img 
                      src={assignment.fileUrl} 
                      alt="Assignment Preview" 
                      style={{ marginTop: '1rem', maxWidth: '100%', maxHeight: '300px', borderRadius: '5px', border: '1px solid #ddd' }}
                    />
                  ) : null}
                </div>
              )}
              
              {user?.role === 'instructor' && (
                <div style={{ marginTop: '1rem' }}>
                  <a 
                    href={`/assignment/${assignment._id}/submissions`}
                    className="btn btn-primary"
                  >
                    View Submissions ({assignment.submissions?.length || 0})
                  </a>
                </div>
              )}
              
              {user?.role === 'student' && (
                <div style={{ marginTop: '1rem' }}>
                  {/* Check if already submitted */}
                  {assignment.submissions?.find(sub => sub.student === user._id || sub.student === user._id.toString() || sub.student?._id === user._id) ? (
                    <div>
                      <p style={{ color: '#059669', fontWeight: '600', marginBottom: '1rem' }}>
                        ✅ Assignment Submitted
                      </p>
                      {/* Show submitted file if available */}
                      {assignment.submissions?.find(sub => sub.student === user._id || sub.student === user._id.toString() || sub.student?._id === user._id)?.fileUrl && (
                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '5px' }}>
                          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Your Submission:</p>
                          <a 
                            href={assignment.submissions?.find(sub => sub.student === user._id || sub.student === user._id.toString() || sub.student?._id === user._id)?.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                          >
                            📄 View Your File
                          </a>
                        </div>
                      )}
                      {/* Re-submit option */}
                      <details style={{ marginTop: '1rem' }}>
                        <summary style={{ cursor: 'pointer', color: '#666' }}>Re-submit Assignment</summary>
                        <div style={{ marginTop: '1rem' }}>
                          <input type="file" id={`file-${assignment._id}`} className="form-group" />
                          <button 
                            onClick={() => handleSubmitAssignment(assignment._id)}
                            className="btn btn-primary"
                          >
                            Submit Again
                          </button>
                        </div>
                      </details>
                    </div>
                  ) : (
                    <div>
                      <input type="file" id={`file-${assignment._id}`} className="form-group" />
                      <button 
                        onClick={() => handleSubmitAssignment(assignment._id)}
                        className="btn btn-success"
                      >
                        Submit Assignment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Assignments;

