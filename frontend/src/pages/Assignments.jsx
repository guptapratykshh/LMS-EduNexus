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
      console.log('=== FETCHING ASSIGNMENTS ===');
      console.log('Course ID:', courseId);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/assignments/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Assignments fetched:', response.data);
      console.log('Number of assignments:', response.data.length);
      
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      console.error('Error details:', error.response?.data);
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
            <div key={assignment._id} className="card" style={{ border: '2px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', backgroundColor: '#fff' }}>
              <h3>{assignment.title}</h3>
              {assignment.description && <p style={{ color: '#666', marginTop: '0.5rem' }}>{assignment.description}</p>}
              {assignment.dueDate && (
                <p style={{ color: '#dc2626', fontWeight: '600', marginTop: '0.5rem' }}>
                  Due: {new Date(assignment.dueDate).toLocaleString()}
                </p>
              )}
              
              {/* Show uploaded assignment file if available */}
              {assignment.fileUrl && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '5px', border: '1px solid #bae6fd' }}>
                  <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#0369a1' }}>📎 Assignment File:</p>
                  <a 
                    href={assignment.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                  >
                    📄 View/Download File
                  </a>
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
              
              {user?.role === 'student' && (() => {
                // Check if current user has already submitted
                const userSubmission = assignment.submissions?.find(sub => {
                  const subStudentId = sub.student?._id?.toString() || sub.student?.toString() || sub.student;
                  const currentUserId = user._id?.toString();
                  console.log('Checking submission:', { subStudentId, currentUserId, match: subStudentId === currentUserId });
                  return subStudentId === currentUserId || 
                         subStudentId?.substring(0, 24) === currentUserId?.substring(0, 24);
                });
                const isSubmitted = !!userSubmission;
                console.log('Assignment submission status:', { assignmentId: assignment._id, isSubmitted, submissionsCount: assignment.submissions?.length });

                return (
                  <div style={{ marginTop: '1rem' }}>
                    {isSubmitted ? (
                      <div>
                        <div style={{ padding: '1rem', backgroundColor: '#d1fae5', borderRadius: '8px', border: '2px solid #059669', marginBottom: '1rem' }}>
                          <p style={{ color: '#059669', fontWeight: '700', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                            ✅ Assignment Submitted
                          </p>
                          {userSubmission.fileUrl && (
                            <div style={{ marginTop: '1rem' }}>
                              <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#065f46' }}>Your Submission:</p>
                              <a 
                                href={userSubmission.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{ marginRight: '1rem' }}
                              >
                                📄 View Your File
                              </a>
                              <button
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this submission?')) {
                                    try {
                                      const token = localStorage.getItem('token');
                                      await axios.delete(`/api/assignments/${assignment._id}/submissions/${userSubmission._id}`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      alert('Submission deleted successfully!');
                                      fetchAssignments();
                                    } catch (error) {
                                      alert('Failed to delete submission');
                                    }
                                  }
                                }}
                                className="btn btn-danger"
                              >
                                🗑️ Delete Submission
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Re-submit option */}
                        <details style={{ marginTop: '1rem' }}>
                          <summary style={{ cursor: 'pointer', color: '#666', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '5px' }}>
                            Want to submit a different file? Click to re-submit
                          </summary>
                          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '5px' }}>
                            <input type="file" id={`resubmit-file-${assignment._id}`} className="form-group" />
                            <button 
                              onClick={async () => {
                                const fileInput = document.getElementById(`resubmit-file-${assignment._id}`);
                                if (!fileInput.files[0]) {
                                  alert('Please select a file first');
                                  return;
                                }
                                try {
                                  const token = localStorage.getItem('token');
                                  const formData = new FormData();
                                  formData.append('file', fileInput.files[0]);

                                  await axios.post(`/api/assignments/${assignment._id}/submit`, formData, {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                      'Content-Type': 'multipart/form-data'
                                    }
                                  });

                                  alert('Assignment re-submitted successfully!');
                                  fetchAssignments();
                                } catch (error) {
                                  alert('Failed to re-submit assignment');
                                }
                              }}
                              className="btn btn-primary"
                              style={{ marginTop: '0.5rem' }}
                            >
                              Submit New File
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
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Assignments;

