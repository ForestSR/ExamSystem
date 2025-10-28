import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const Interviewee = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // 停止摄像头的回调函数
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
    console.log('摄像头状态设置为关闭');
  }, []);

  // 组件卸载时关闭摄像头
  useEffect(() => {
    return () => {
      console.log('组件卸载，关闭摄像头');
      stopCamera();
    };
  }, [stopCamera]);

  // 当video元素准备好且有流时，设置srcObject
  useEffect(() => {
    if (isCameraOn && streamRef.current && videoRef.current) {
      console.log('设置video srcObject - useEffect');
      videoRef.current.srcObject = streamRef.current;
      
      videoRef.current.play().catch(error => {
        console.log('视频播放失败:', error.message);
      });
    }
  }, [isCameraOn]);

  const startCamera = async () => {
    try {
      setCameraError('');
      console.log('正在请求摄像头权限...');
      
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
      
      console.log('摄像头流获取成功:', stream);
      console.log('视频轨道数量:', stream.getVideoTracks().length);
      
      streamRef.current = stream;
      setIsCameraOn(true);
      
      console.log('摄像头状态设置为开启，video元素将被渲染');
      
    } catch (error) {
      console.error('摄像头访问失败:', error);
      setCameraError(`无法访问摄像头: ${error.message}`);
      setIsCameraOn(false);
    }
  };

  const handleLogout = useCallback(() => {
    console.log('退出登录，先关闭摄像头');
    stopCamera();
    setTimeout(() => {
      onLogout();
    }, 200);
  }, [stopCamera, onLogout]);

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
      <div className="interview-container interviewee-container">
        <div className="header">
          <div>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', marginRight: '1rem' }}
            >
              ← 返回首页
            </button>
            <h1 style={{ display: 'inline-block', margin: 0 }}>面试者界面</h1>
          </div>
          <button onClick={handleLogout} className="btn btn-danger">
            退出登录
          </button>
        </div>

        <div className="interview-info">
          <p>💡 提示：请保持良好的光线和网络连接，确保面试官能清晰看到您</p>
        </div>

        <div className="video-container">
          <h3>视频预览</h3>
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
              onLoadedMetadata={() => {
                console.log('视频元数据已加载');
                console.log('视频尺寸:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
              }}
              onError={(e) => {
                console.error('视频播放错误:', e);
                setCameraError('视频播放失败');
              }}
              onLoadStart={() => console.log('开始加载视频')}
              onCanPlay={() => console.log('视频可以播放')}
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

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h3>面试状态</h3>
          <p>摄像头状态: <strong style={{ color: isCameraOn ? '#28a745' : '#dc3545' }}>
            {isCameraOn ? '已开启' : '已关闭'}
          </strong></p>
          <p className="interview-tips">
            📌 面试流程：自我介绍 → 简历内容提问 → 专业知识考察
          </p>
        </div>
      </div>
    </div>
  );
};

export default Interviewee;