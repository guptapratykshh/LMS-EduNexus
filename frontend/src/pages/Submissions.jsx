import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Submissions = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradeInput, setGradeInput] = useState({});

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignment(response.data);
    } catch (error) {
      console.error('Error fetching assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId) => {
    const grade = gradeInput[submissionId];
    const feedback = prompt('Enter feedback (optional):');

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/assignments/${id}/grade/${submissionId}`, {
        grade: parseFloat(grade),
        feedback: feedback || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAssignment();
    } catch (error) {
      console.error('Error grading:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!assignment) return <div>Assignment not found</div>;

  return (
    <div className="submissions-page">
      <h2>Assignment: {assignment.title}</h2>
      <p>{assignment.description}</p>
      
      <h3>Submissions ({assignment.submissions?.length || 0})</h3>
      
      {assignment.submissions?.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <div className="submissions-list">
          {assignment.submissions?.map((submission, index) => (
            <div key={submission._id || index} className="card">
              <h4>Student: {submission.student?.name || 'Unknown'}</h4>
              <p>Email: {submission.student?.email}</p>
              <p>Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
              <p>Status: {submission.status}</p>
              
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '5px' }}>
                {submission.fileUrl ? (
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <a href={submission.fileUrl} download className="btn btn-secondary">
                        📄 Download File
                      </a>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      {submission.fileUrl ? (
                        <>
                          {submission.fileUrl.includes('.pdf') || submission.fileUrl.match(/pdf/i) || submission.fileUrl.startsWith('data:') && submission.fileUrl.includes('pdf') ? (
                            <iframe 
                              src={submission.fileUrl} 
                              width="100%" 
                              height="500px" 
                              style={{ border: '2px solid #ddd', borderRadius: '8px' }}
                              title="PDF Viewer"
                            />
                          ) : submission.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || submission.fileUrl.includes('image/') || submission.fileUrl.startsWith('data:image/') ? (
                            <img 
                              src={submission.fileUrl} 
                              alt="Submitted File" 
                              style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '8px', border: '2px solid #ddd' }}
                            />
                          ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '2px solid #ddd' }}>
                              <p style={{ marginBottom: '1rem', color: '#666' }}>File: {submission.cloudinaryPublicId || 'Attachment'}</p>
                              <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '14px', padding: '0.5rem 1rem' }}>
                                📎 Open in New Tab
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        <p style={{ color: '#999', fontStyle: 'italic', padding: '1rem' }}>No file attached</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>No file attached to this submission</p>
                )}
              </div>
              
              {submission.grade && <p>Grade: {submission.grade}</p>}
              {submission.feedback && <p>Feedback: {submission.feedback}</p>}
              
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Enter grade (0-100)"
                  min="0"
                  max="100"
                  value={gradeInput[submission._id] || ''}
                  onChange={(e) => setGradeInput({ ...gradeInput, [submission._id]: e.target.value })}
                  style={{ width: '150px', padding: '0.5rem' }}
                />
                <button 
                  onClick={() => handleGrade(submission._id)}
                  className="btn btn-success"
                >
                  Grade Assignment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Submissions;

