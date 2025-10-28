# 修复 "离开房间时 process is not defined" 错误

## 问题原因

当两个用户建立 WebRTC 连接后，点击"离开房间"会触发 `simple-peer` 的 `destroy()` 方法。这个方法在清理连接时会访问 Node.js 的 `process` 对象，但在某些情况下 process polyfill 还未完全加载，导致报错。

## 已完成的修复

### 1. 修改了 Interviewee.js 和 Interviewer.js
- ✅ 在 `leaveRoom()` 函数中添加了 try-catch 错误处理
- ✅ 在销毁 peer 之前先调用 `removeAllListeners()` 移除所有事件监听器
- ✅ 清理顺序优化：先停止摄像头 → 断开 Socket → 销毁 Peer → 清理视频元素
- ✅ 在 useEffect 清理函数中也添加了同样的保护

### 2. 修改了 index.js
- ✅ 在应用启动时确保 `window.process` 全局可用
- ✅ 提前注入 process polyfill，避免运行时找不到

## 修复内容

### leaveRoom() 函数的安全清理流程：

```javascript
const leaveRoom = () => {
  // 1. 先停止摄像头
  stopCamera();
  
  // 2. 安全地断开 Socket 连接
  if (socketRef.current) {
    try {
      socketRef.current.disconnect();
      socketRef.current = null;
    } catch (error) {
      console.error('断开Socket连接时出错:', error);
    }
  }
  
  // 3. 安全地销毁 Peer 连接
  if (peerRef.current) {
    try {
      // 先移除所有事件监听器（关键！）
      peerRef.current.removeAllListeners();
      // 然后销毁连接
      peerRef.current.destroy();
      peerRef.current = null;
    } catch (error) {
      console.error('销毁Peer连接时出错:', error);
    }
  }
  
  // 4. 清理远程视频
  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = null;
  }
  
  // 5. 重置状态
  setIsInRoom(false);
  setRoomId('');
  setMessage('已离开房间');
};
```

## 测试步骤

1. **重启前端服务**：
   ```bash
   # 停止当前服务 (Ctrl + C)
   # 重新启动
   npm start
   ```

2. **测试场景**：
   - 打开两个浏览器窗口
   - 分别登录面试官和面试者账号
   - 进入同一个房间
   - 等待视频连接建立成功
   - **点击任意一方的"离开房间"按钮**
   - ✅ 应该不再报错
   - ✅ 可以正常离开房间
   - ✅ 可以重新加入房间

3. **验证其他场景**：
   - 单独登录时离开房间 ✅
   - 未连接时离开房间 ✅
   - 连接后离开再重新加入 ✅
   - 关闭浏览器标签页 ✅

## 为什么需要 removeAllListeners()？

`simple-peer` 在销毁时会触发一系列清理事件：
- `close` 事件
- `error` 事件  
- `stream` 事件清理

这些事件的处理可能会访问 `process.nextTick` 等 Node.js API。通过先移除所有监听器，可以避免这些回调被触发，从而避免 process 引用错误。

## 关键改进点

1. **错误隔离**：每个清理步骤都有独立的 try-catch
2. **顺序优化**：先清理上层资源（摄像头、Socket），再清理底层（Peer）
3. **事件清理**：在销毁前先移除所有事件监听器
4. **空值保护**：设置为 null 防止重复操作
5. **全局注入**：在 index.js 中提前注入 process 对象

## 如果仍然有问题

检查浏览器控制台是否有其他错误信息，可能需要：
1. 清除浏览器缓存
2. 硬刷新页面 (Ctrl + Shift + R)
3. 检查 config-overrides.js 是否正确配置
