import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/login" className="navbar-brand">
          🎓 EduNexus
        </Link>
        
        {isAuthenticated ? (
          <div className="navbar-menu">
            <span className="navbar-user">Welcome, {user?.name}</span>
            <span className="navbar-role">({user?.role})</span>
            
            {user?.role === 'student' && (
              <>
                <Link to="/dashboard" className="navbar-link">Browse Courses</Link>
                <Link to="/student" className="navbar-link">My Courses</Link>
              </>
            )}
            {user?.role === 'instructor' && (
              <>
                <Link to="/instructor" className="navbar-link">My Courses</Link>
                <Link to="/create-course" className="navbar-link">Create Course</Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="navbar-link">Admin Panel</Link>
            )}
            
            <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '10px', padding: '5px 15px', fontSize: '14px' }}>Logout</button>
          </div>
        ) : (
          <div className="navbar-menu">
            <Link to="/login" className="navbar-link">Login</Link>
            <Link to="/register" className="navbar-link">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

