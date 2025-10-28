import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const Interviewer = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  // 面试流程状态
  const [currentStage, setCurrentStage] = useState(0);
  const [scores, setScores] = useState({
    selfIntroduction: 0,
    resumeQA: 0,
    professionalKnowledge: 0
  });
  const [tempScore, setTempScore] = useState(0);
  const [showFinalScore, setShowFinalScore] = useState(false);

  const stages = [
    { id: 'selfIntroduction', name: '自我介绍', key: 'selfIntroduction' },
    { id: 'resumeQA', name: '简历内容提问', key: 'resumeQA' },
    { id: 'professionalKnowledge', name: '专业知识考察', key: 'professionalKnowledge' }
  ];

  // 停止摄像头
  const stopCamera = useCallback(() => {
    console.log('正在关闭摄像头...');
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log('摄像头轨道已停止:', track.kind);
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
      console.log('清除video srcObject');
    }
    
    setIsCameraOn(false);
    setCameraError('');
  }, []);

  // 组件卸载时关闭摄像头
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // 当video元素准备好且有流时，设置srcObject
  useEffect(() => {
    if (isCameraOn && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(error => {
        console.log('视频播放失败:', error.message);
      });
    }
  }, [isCameraOn]);

  const startCamera = async () => {
    try {
      setCameraError('');
      
      if (streamRef.current) {
        stopCamera();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        }, 
        audio: false 
      });
      
      streamRef.current = stream;
      setIsCameraOn(true);
      
    } catch (error) {
      console.error('摄像头访问失败:', error);
      setCameraError(`无法访问摄像头: ${error.message}`);
      setIsCameraOn(false);
    }
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleLogout = useCallback(() => {
    stopCamera();
    setTimeout(() => {
      onLogout();
    }, 200);
  }, [stopCamera, onLogout]);

  // 保存当前阶段评分
  const handleSaveScore = () => {
    if (tempScore === 0) {
      alert('请先为当前阶段评分！');
      return;
    }

    const currentStageKey = stages[currentStage].key;
    setScores(prev => ({
      ...prev,
      [currentStageKey]: tempScore
    }));
    alert(`${stages[currentStage].name}评分已保存：${tempScore}分`);
  };

  // 进入下一阶段
  const handleNextStage = () => {
    const currentStageKey = stages[currentStage].key;
    
    if (scores[currentStageKey] === 0) {
      alert('请先为当前阶段评分后才能进入下一阶段！');
      return;
    }

    if (currentStage < stages.length - 1) {
      setCurrentStage(currentStage + 1);
      setTempScore(0);
    } else {
      // 最后一个阶段，显示总评分
      finishInterview();
    }
  };

  // 完成面试
  const finishInterview = () => {
    const currentStageKey = stages[currentStage].key;
    
    if (scores[currentStageKey] === 0) {
      alert('请先为当前阶段评分后才能结束面试！');
      return;
    }

    setShowFinalScore(true);
  };

  // 计算总分
  const calculateTotalScore = () => {
    const total = scores.selfIntroduction + scores.resumeQA + scores.professionalKnowledge;
    return (total / 3).toFixed(2);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#ffffff' }}>
      {/* 侧边栏 */}
      <div className="interviewer-sidebar">
        <h2>面试流程</h2>
        <div className="stages-list">
          {stages.map((stage, index) => (
            <div 
              key={stage.id} 
              className={`stage-item ${currentStage === index ? 'active' : ''} ${scores[stage.key] > 0 ? 'completed' : ''}`}
            >
              <div className="stage-number">{index + 1}</div>
              <div className="stage-info">
                <h4>{stage.name}</h4>
                {scores[stage.key] > 0 && (
                  <span className="stage-score">得分: {scores[stage.key]}分</span>
                )}
                {currentStage === index && scores[stage.key] === 0 && (
                  <span className="stage-status">进行中...</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="score-section">
          <h3>当前阶段评分</h3>
          <p className="current-stage-name">{stages[currentStage].name}</p>
          <div className="score-input-group">
            <input
              type="number"
              min="0"
              max="100"
              value={tempScore}
              onChange={(e) => setTempScore(Number(e.target.value))}
              placeholder="输入分数(0-100)"
              className="score-input"
            />
            <span className="score-unit">分</span>
          </div>
          <button 
            onClick={handleSaveScore}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            保存评分
          </button>
        </div>

        <div className="navigation-buttons">
          {currentStage < stages.length - 1 ? (
            <button 
              onClick={handleNextStage}
              className="btn"
              style={{ width: '100%' }}
            >
              进入下一阶段 →
            </button>
          ) : (
            <button 
              onClick={finishInterview}
              className="btn btn-success"
              style={{ width: '100%' }}
            >
              结束面试
            </button>
          )}
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="interview-container interviewer-container">
          <div className="header">
            <div>
              <button
                onClick={() => navigate('/')}
                className="btn btn-secondary"
                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', marginRight: '1rem' }}
              >
                ← 返回首页
              </button>
              <h1 style={{ display: 'inline-block', margin: 0 }}>面试官界面</h1>
            </div>
            <button onClick={handleLogout} className="btn btn-danger">
              退出登录
            </button>
          </div>

          <div className="video-container">
            <h3>我的视频</h3>
            {isCameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  height: 'auto',
                  minHeight: '300px',
                  border: '2px solid #007bff',
                  borderRadius: '8px',
                  backgroundColor: '#000',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                maxWidth: '400px',
                height: '300px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ddd',
                borderRadius: '8px',
                margin: '0 auto',
                fontSize: '16px',
                color: '#666'
              }}>
                摄像头未开启
              </div>
            )}
          </div>

          <div className="text-center">
            <button 
              onClick={toggleCamera} 
              className={`btn ${isCameraOn ? 'btn-danger' : ''}`}
              style={{ fontSize: '16px', padding: '10px 20px' }}
            >
              {isCameraOn ? '关闭摄像头' : '开启摄像头'}
            </button>
          </div>

          {cameraError && (
            <div className="error text-center" style={{ marginTop: '1rem' }}>
              {cameraError}
            </div>
          )}
        </div>
      </div>

      {/* 总评分弹窗 */}
      {showFinalScore && (
        <div className="modal-overlay" onClick={() => setShowFinalScore(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>面试总评</h2>
            <div className="final-scores">
              <div className="score-item">
                <span>自我介绍：</span>
                <strong>{scores.selfIntroduction}分</strong>
              </div>
              <div className="score-item">
                <span>简历内容提问：</span>
                <strong>{scores.resumeQA}分</strong>
              </div>
              <div className="score-item">
                <span>专业知识考察：</span>
                <strong>{scores.professionalKnowledge}分</strong>
              </div>
              <div className="score-divider"></div>
              <div className="score-item total-score">
                <span>总评分：</span>
                <strong className="total-score-value">{calculateTotalScore()}分</strong>
              </div>
            </div>
            <div className="modal-buttons">
              <button 
                onClick={() => {
                  setShowFinalScore(false);
                  navigate('/');
                }}
                className="btn"
              >
                完成并返回首页
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interviewer;