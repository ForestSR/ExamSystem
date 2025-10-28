import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const Interviewer = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [message, setMessage] = useState('');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  
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

  // 从URL获取房间号
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const room = params.get('room');
    if (room) {
      setRoomId(room);
    }
  }, [location]);

  useEffect(() => {
    return () => {
      // 组件卸载时的清理
      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error('停止摄像头轨道时出错:', error);
        }
      }
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (error) {
          console.error('断开Socket时出错:', error);
        }
      }
      if (peerRef.current) {
        try {
          peerRef.current.removeAllListeners();
          peerRef.current.destroy();
        } catch (error) {
          console.error('销毁Peer时出错:', error);
        }
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
      setMessage('摄像头已开启');
    } catch (error) {
      console.error('开启摄像头失败:', error);
      setMessage('无法访问摄像头，请检查权限设置');
    }
  };

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setMessage('摄像头已关闭');
  };

  const joinRoom = async () => {
    if (!roomId.trim()) {
      setMessage('请输入房间号');
      return;
    }

    if (!isCameraOn) {
      await startCamera();
    }

    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('Socket连接成功');
      const token = localStorage.getItem('token');
      const userId = JSON.parse(atob(token.split('.')[1])).userId;
      
      socketRef.current.emit('join-room', {
        roomId: roomId,
        userId: userId,
        role: 'interviewer'
      });
      
      setIsInRoom(true);
      setMessage(`已加入房间: ${roomId}`);
    });

    socketRef.current.on('user-joined', ({ socketId, role }) => {
      if (role === 'interviewee') {
        setMessage('面试者已加入，正在连接...');
        createPeerConnection(socketId, true);
      }
    });

    socketRef.current.on('offer', ({ offer, from }) => {
      setMessage('收到连接请求...');
      createPeerConnection(from, false, offer);
    });

    socketRef.current.on('answer', ({ answer }) => {
      if (peerRef.current) {
        peerRef.current.signal(answer);
      }
    });

    socketRef.current.on('ice-candidate', ({ candidate }) => {
      if (peerRef.current && candidate) {
        peerRef.current.signal(candidate);
      }
    });
  };

  const createPeerConnection = (targetSocketId, initiator, offerSignal = null) => {
    const peer = new Peer({
      initiator: initiator,
      trickle: false,
      stream: localStreamRef.current,
    });

    peer.on('signal', (signal) => {
      if (initiator) {
        socketRef.current.emit('offer', {
          roomId: roomId,
          offer: signal,
          to: targetSocketId
        });
      } else {
        socketRef.current.emit('answer', {
          roomId: roomId,
          answer: signal,
          to: targetSocketId
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        setMessage('视频连接成功！');
      }
    });

    peer.on('error', (err) => {
      console.error('Peer连接错误:', err);
      setMessage('视频连接失败，请重试');
    });

    if (offerSignal) {
      peer.signal(offerSignal);
    }

    peerRef.current = peer;
  };

  const leaveRoom = () => {
    // 先停止摄像头
    stopCamera();
    
    // 安全地断开 socket 连接
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
        socketRef.current = null;
      } catch (error) {
        console.error('断开Socket连接时出错:', error);
      }
    }
    
    // 安全地销毁 peer 连接
    if (peerRef.current) {
      try {
        // 先移除所有事件监听器
        peerRef.current.removeAllListeners();
        // 然后销毁连接
        peerRef.current.destroy();
        peerRef.current = null;
      } catch (error) {
        console.error('销毁Peer连接时出错:', error);
      }
    }
    
    // 清理远程视频
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    setIsInRoom(false);
    setRoomId('');
    setMessage('已离开房间');
    
    // 重置评分状态
    setCurrentStage(0);
    setScores({
      selfIntroduction: 0,
      resumeQA: 0,
      professionalKnowledge: 0
    });
    setTempScore(0);
    setShowFinalScore(false);
  };

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
      {/* 侧边栏 - 只在进入房间后显示 */}
      {isInRoom && (
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
      )}

      {/* 主内容区域 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="interview-container interviewer-container" style={{ maxWidth: isInRoom ? '900px' : '500px' }}>
          <div className="header">
            <h1>面试官界面</h1>
            <button className="btn btn-danger" onClick={() => {
              stopCamera();
              onLogout();
              navigate('/');
            }}>
              退出登录
            </button>
          </div>

          {!isInRoom ? (
            <div>
              <div className="interview-info">
                <p>请输入房间号开始面试</p>
              </div>

              <div className="form-group">
                <label>房间号:</label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="请输入房间号"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div className="text-center" style={{ marginTop: '1.5rem' }}>
                <button className="btn" onClick={joinRoom}>
                  进入房间
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/room/create')}>
                  创建新房间
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                  返回首页
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="interview-info">
                <p>房间号: {roomId}</p>
                <p className="interview-tips">面试进行中 - 当前阶段: {stages[currentStage].name}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1rem' }}>我的视频</h3>
                  <div className="video-container">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        maxWidth: '400px',
                        border: '2px solid #007bff',
                        borderRadius: '8px',
                        backgroundColor: '#000'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1rem' }}>面试者视频</h3>
                  <div className="video-container">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{
                        width: '100%',
                        maxWidth: '400px',
                        border: '2px solid #28a745',
                        borderRadius: '8px',
                        backgroundColor: '#000'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button 
                  className={isCameraOn ? 'btn btn-danger' : 'btn'}
                  onClick={isCameraOn ? stopCamera : startCamera}
                >
                  {isCameraOn ? '关闭摄像头' : '开启摄像头'}
                </button>
                <button className="btn btn-secondary" onClick={leaveRoom}>
                  离开房间
                </button>
              </div>
            </div>
          )}

          {message && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem',
              background: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#004085'
            }}>
              {message}
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
                  leaveRoom();
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