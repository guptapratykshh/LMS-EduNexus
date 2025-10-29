import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Redirect based on user role
      const userRole = result.data?.user?.role;
      if (userRole === 'student') {
        navigate('/student');
      } else if (userRole === 'instructor') {
        navigate('/instructor');
      } else if (userRole === 'admin') {
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
          <p>Learning Management Portal</p>
        </div>
        
        <div className="auth-body">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
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
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary">Log In</button>
          </form>
          
          <p className="auth-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
          
          <div className="auth-footer">
            <p>Welcome to EduNexus LMS</p>
            <p>Your one stop destination for effective learning management</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

