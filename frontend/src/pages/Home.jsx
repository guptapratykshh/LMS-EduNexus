import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to EduNexus</h1>
      <p>Your Mini Learning Management System</p>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/login" className="btn btn-primary" style={{ marginRight: '1rem' }}>
          Login
        </Link>
        <Link to="/register" className="btn btn-secondary">
          Register
        </Link>
      </div>
    </div>
  );
};

export default Home;

