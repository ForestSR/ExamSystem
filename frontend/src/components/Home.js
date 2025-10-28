import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = ({ isLoggedIn, userRole }) => {
  const navigate = useNavigate();

  const handleMenuClick = (path) => {
    if (!isLoggedIn && (path === '/feedback' || path === '/suggestions' || path === '/written-exam' || path === '/interview')) {
      navigate('/login');
    } else if (path === '/interview') {
      // 根据用户角色跳转到对应的面试入口
      if (userRole === 'interviewer') {
        navigate('/interviewer');
      } else {
        navigate('/interviewee');
      }
    } else if (path === '/login') {
      navigate('/login');
    } else if (path === '/profile') {
      navigate('/profile');
    } else {
      // 其他功能暂未实现，显示提示
      alert('功能正在开发中，敬请期待！');
    }
  };

  return (
    <div className="home-container">
      {/* 头部区域 */}
      <header className="home-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🏛️</div>
            <h1 className="system-title">公务员考试系统</h1>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-login"
              onClick={() => handleMenuClick(isLoggedIn ? '/profile' : '/login')}
            >
              {isLoggedIn ? '个人中心' : '注册/登录'}
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="home-main">
        <div className="welcome-section">
          <h2 className="welcome-title">欢迎使用公务员考试系统</h2>
          <p className="welcome-subtitle">专业、高效、便捷的在线考试平台</p>
        </div>

        {/* 功能入口区域 */}
        <div className="function-grid">
          <div className="function-card" onClick={() => handleMenuClick('/written-exam')}>
            <div className="function-icon">📝</div>
            <h3>笔试入口</h3>
            <p>在线笔试考试</p>
          </div>

          <div className="function-card active" onClick={() => handleMenuClick('/interview')}>
            <div className="function-icon">🎥</div>
            <h3>面试入口</h3>
            <p>视频面试系统</p>
          </div>

          <div className="function-card" onClick={() => handleMenuClick('/feedback')}>
            <div className="function-icon">💬</div>
            <h3>问题反馈</h3>
            <p>意见和建议</p>
          </div>

          <div className="function-card" onClick={() => handleMenuClick('/suggestions')}>
            <div className="function-icon">💡</div>
            <h3>意见建议</h3>
            <p>系统改进建议</p>
          </div>
        </div>
      </main>

      {/* 底部区域 */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="contact-info">
            <h4>联系方式</h4>
            <p>📧 邮箱：admin@exam-system.com</p>
            <p>📞 电话：400-123-4567</p>
            <p>🕒 服务时间：周一至周五 9:00-18:00</p>
          </div>
          <div className="footer-links">
            <p>© 2025 公务员考试系统 All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;