import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const Interviewee = ({ onLogout }) => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [message, setMessage] = useState('');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (peerRef.current) {
        peerRef.current.destroy();
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
        role: 'interviewee'
      });
      
      setIsInRoom(true);
      setMessage(`已加入房间: ${roomId}`);
    });

    socketRef.current.on('user-joined', ({ socketId, role }) => {
      if (role === 'interviewer') {
        setMessage('面试官已加入，正在连接...');
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
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    stopCamera();
    setIsInRoom(false);
    setRoomId('');
    setMessage('已离开房间');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
      <div className="interview-container interviewee-container" style={{ maxWidth: '900px' }}>
        <div className="header">
          <h1>面试者界面</h1>
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
              <p>请输入房间号加入面试</p>
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
                加入房间
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
              <p className="interview-tips">面试进行中，请保持专注</p>
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
                <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1rem' }}>面试官视频</h3>
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
  );
};

export default Interviewee;
