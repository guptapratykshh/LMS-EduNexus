import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseDetail from './pages/CourseDetail';
import CreateCourse from './pages/CreateCourse';
import Chat from './pages/Chat';
import Assignments from './pages/Assignments';
import EditCourse from './pages/EditCourse';
import Submissions from './pages/Submissions';
import LiveSchedule from './pages/LiveSchedule';
import LiveRoom from './pages/LiveRoom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <div className="container">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/instructor"
          element={
            <ProtectedRoute allowedRoles={['instructor']}>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/course/:id"
          element={
            <ProtectedRoute>
              <CourseDetail />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/create-course"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <CreateCourse />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/chat/:courseId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/course/:courseId/assignments"
          element={
            <ProtectedRoute>
              <Assignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course/:id/live"
          element={
            <ProtectedRoute>
              <LiveSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live/:sessionId"
          element={
            <ProtectedRoute>
              <LiveRoom />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/edit-course/:id"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <EditCourse />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/assignment/:id/submissions"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <Submissions />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

