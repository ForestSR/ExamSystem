import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Interview from './components/Interview';
import Profile from './components/Profile';
import Interviewee from './components/Interviewee';
import Interviewer from './components/Interviewer';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token) {
      setIsLoggedIn(true);
      setUserRole(role || 'interviewee');
    }
  }, []);

  const handleLogin = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    setIsLoggedIn(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setUserRole('');
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={<Home isLoggedIn={isLoggedIn} userRole={userRole} />}
          />
          <Route
            path="/login"
            element={
              isLoggedIn ? 
              <Navigate to="/profile" /> : 
              <Login onLogin={handleLogin} />
            }
          />
          <Route
            path="/profile"
            element={
              isLoggedIn ? 
              <Profile onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            }
          />
          <Route
            path="/interview"
            element={
              isLoggedIn ? 
              <Interview onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            }
          />
          <Route
            path="/interviewee"
            element={
              isLoggedIn ? 
              <Interviewee onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            }
          />
          <Route
            path="/interviewer"
            element={
              isLoggedIn ? 
              <Interviewer onLogout={handleLogout} /> : 
              <Navigate to="/login" />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;