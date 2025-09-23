import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Interview from './components/Interview';
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
            path="/login"
            element={
              isLoggedIn ? 
              <Navigate to="/interview" /> : 
              <Login onLogin={handleLogin} />
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
            path="/"
            element={<Navigate to={isLoggedIn ? "/interview" : "/login"} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;