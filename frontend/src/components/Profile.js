import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = ({ onLogout }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    phone: '',
    realName: '',
    nickname: '',
    avatar: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从后端获取用户信息
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('http://localhost:5000/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data.user) {
            setUserInfo({
              username: response.data.user.username || '',
              email: response.data.user.email || '',
              phone: response.data.user.phone || '',
              realName: response.data.user.realName || '',
              nickname: response.data.user.nickname || '',
              avatar: response.data.user.avatar || ''
            });
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        setMessage('获取用户信息失败');
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put('http://localhost:5000/api/profile', {
        email: userInfo.email,
        phone: userInfo.phone,
        realName: userInfo.realName,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage('个人信息保存成功！');
      setIsError(false);
      setIsEditing(false);
      
      // 更新本地状态
      if (response.data.user) {
        setUserInfo(prev => ({
          ...prev,
          email: response.data.user.email,
          phone: response.data.user.phone,
          realName: response.data.user.realName,
          nickname: response.data.user.nickname,
          avatar: response.data.user.avatar
        }));
      }
      
    } catch (error) {
      console.error('保存用户信息失败:', error);
      setMessage(error.response?.data?.message || '保存失败，请重试');
      setIsError(true);
    } finally {
      setLoading(false);
      // 3秒后清除消息
      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage('');
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleBackHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="App">
        <div className="profile-container">
          <div className="text-center">
            <p>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="profile-container">
        <div className="header">
          <h1>个人中心</h1>
          <div>
            <button onClick={handleBackHome} className="btn btn-secondary">
              返回首页
            </button>
            <button onClick={handleLogout} className="btn btn-danger">
              退出登录
            </button>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h3>基本信息</h3>
            
            {/* 头像区域 */}
            <div className="avatar-section">
              <div className="avatar-container">
                {userInfo.avatar ? (
                  <img src={userInfo.avatar} alt="头像" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    <span className="avatar-icon">👤</span>
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="avatar-edit">
                  <label>头像URL:</label>
                  <input
                    type="url"
                    name="avatar"
                    value={userInfo.avatar}
                    onChange={handleInputChange}
                    placeholder="请输入头像图片链接"
                  />
                </div>
              )}
            </div>
            
            <div className="info-grid">
              <div className="info-item">
                <label>用户名:</label>
                <span>{userInfo.username || '未设置'}</span>
              </div>

              <div className="info-item">
                <label>昵称:</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="nickname"
                    value={userInfo.nickname}
                    onChange={handleInputChange}
                    placeholder="请输入昵称"
                  />
                ) : (
                  <span>{userInfo.nickname || '未设置'}</span>
                )}
              </div>

              <div className="info-item">
                <label>真实姓名:</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="realName"
                    value={userInfo.realName}
                    onChange={handleInputChange}
                    placeholder="请输入真实姓名"
                  />
                ) : (
                  <span>{userInfo.realName || '未设置'}</span>
                )}
              </div>

              <div className="info-item">
                <label>手机号:</label>
                <span>{userInfo.phone || '未绑定'}</span>
              </div>

              <div className="info-item">
                <label>邮箱:</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={userInfo.email}
                    onChange={handleInputChange}
                    placeholder="请输入邮箱地址"
                  />
                ) : (
                  <span>{userInfo.email || '未设置'}</span>
                )}
              </div>
            </div>

            <div className="action-buttons">
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="btn">
                    保存
                  </button>
                  <button onClick={handleCancel} className="btn btn-secondary">
                    取消
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="btn">
                  编辑信息
                </button>
              )}
            </div>

            {message && (
              <div className={isError ? 'error text-center' : 'success text-center'}>
                {message}
              </div>
            )}
          </div>

          <div className="profile-section">
            <h3>考试记录</h3>
            <div className="exam-records">
              <div className="record-item">
                <span className="record-type">面试</span>
                <span className="record-date">2025年9月24日</span>
                <span className="record-status pending">待参加</span>
              </div>
              <div className="record-item">
                <span className="record-type">笔试</span>
                <span className="record-date">2025年9月20日</span>
                <span className="record-status completed">已完成</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;