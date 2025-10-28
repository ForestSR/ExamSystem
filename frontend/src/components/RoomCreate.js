import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RoomCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    roomId: '',
    interviewTime: ''
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
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/rooms/create',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setMessage(response.data.message);
      setIsError(false);
      
      // 创建成功后跳转到面试官界面
      setTimeout(() => {
        navigate(`/interviewer?room=${formData.roomId}`);
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || '创建房间失败');
      setIsError(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
      <div className="login-container">
        <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/')}
            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
          >
            ← 返回首页
          </button>
        </div>

        <h1 className="text-center">创建面试房间</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>房间号:</label>
            <input
              type="text"
              name="roomId"
              value={formData.roomId}
              onChange={handleChange}
              placeholder="请输入房间号（如：ROOM001）"
              required
            />
          </div>
          
          <div className="form-group">
            <label>面试时间:</label>
            <input
              type="datetime-local"
              name="interviewTime"
              value={formData.interviewTime}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="btn">
            创建房间
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/interviewer')}
          >
            直接进入面试
          </button>
        </form>
        
        {message && (
          <div className={isError ? 'error' : 'success'}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomCreate;
