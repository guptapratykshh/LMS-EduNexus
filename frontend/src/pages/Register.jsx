import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    const result = await register(formData.name, formData.email, formData.password, formData.role);
    
    if (result.success) {
      // Redirect based on user role
      if (formData.role === 'student') {
        navigate('/student');
      } else if (formData.role === 'instructor') {
        navigate('/instructor');
      } else if (formData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo"></div>
          <h1>EDUNEXUS LMS</h1>
          <p>Create Your Account</p>
        </div>
        
        <div className="auth-body">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password (min. 6 characters)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div className="form-group">
              <label>I am a</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{ 
                  borderColor: formData.role === 'admin' ? '#dc2626' : undefined,
                  borderWidth: formData.role === 'admin' ? '2px' : undefined
                }}
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="admin" style={{ color: '#dc2626', fontWeight: 'bold' }}>🔐 Admin (Full Access)</option>
              </select>
              {formData.role === 'admin' && (
                <small style={{ color: '#dc2626', fontWeight: '600', display: 'block', marginTop: '0.5rem' }}>
                  ⚠️ Admin has full control - Use responsibly
                </small>
              )}
            </div>
            
            <button type="submit" className="btn btn-primary">Register</button>
          </form>
          
          <p className="auth-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
          
          <div className="auth-footer">
            <p>Join EduNexus Community</p>
            <p>Your gateway to quality education</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

