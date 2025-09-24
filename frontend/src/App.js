import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Interview from './components/Interview';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={<Home isLoggedIn={isLoggedIn} />}
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;