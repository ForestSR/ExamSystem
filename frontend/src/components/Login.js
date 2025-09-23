import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const response = await axios.post(`http://localhost:5000${endpoint}`, formData);
      
      setMessage(response.data.message);
      setIsError(false);
      
      if (!isRegister && response.data.token) {
        onLogin(response.data.token);
      } else if (isRegister) {
        // 注册成功后切换到登录
        setTimeout(() => {
          setIsRegister(false);
          setMessage('');
        }, 2000);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || '网络错误');
      setIsError(true);
    }
  };

  return (
    <div className="login-container">
      <h1 className="text-center">公考面试系统</h1>
      <h2 className="text-center">{isRegister ? '注册' : '登录'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>用户名:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>密码:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" className="btn">
          {isRegister ? '注册' : '登录'}
        </button>
        
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage('');
            setFormData({ username: '', password: '' });
          }}
        >
          {isRegister ? '已有账号？登录' : '没有账号？注册'}
        </button>
      </form>
      
      {message && (
        <div className={isError ? 'error' : 'success'}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Login;