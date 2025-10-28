const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// MongoDB连接
mongoose.connect('mongodb://127.0.0.1:27017/exam_interview', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 用户模型
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  realName: { type: String, default: '' },
  nickname: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['interviewee', 'interviewer'], default: 'interviewee' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 房间模型
const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  interviewTime: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['interviewee', 'interviewer'] },
    joinedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', roomSchema);

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '需要登录' });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: '无效令牌' });
    }
    req.user = user;
    next();
  });
};

// 注册接口
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, phone, role } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建新用户
    const user = new User({
      username,
      password: hashedPassword,
      phone: phone || '',
      role: role || 'interviewee'
    });

    await user.save();
    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 登录接口
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '用户不存在' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: '密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ 
      message: '登录成功',
      token,
      role: user.role,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取用户信息
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ 
      message: '获取用户信息成功', 
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        realName: user.realName,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 更新用户信息
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { phone, email, realName, nickname, avatar } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        phone: phone || '',
        email: email || '',
        realName: realName || '',
        nickname: nickname || '',
        avatar: avatar || ''
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ 
      message: '用户信息更新成功', 
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        phone: updatedUser.phone,
        email: updatedUser.email,
        realName: updatedUser.realName,
        nickname: updatedUser.nickname,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 创建房间
app.post('/api/rooms/create', authenticateToken, async (req, res) => {
  try {
    const { roomId, interviewTime } = req.body;
    
    if (!roomId || !interviewTime) {
      return res.status(400).json({ message: '房间号和面试时间不能为空' });
    }

    // 检查房间号是否已存在
    const existingRoom = await Room.findOne({ roomId });
    if (existingRoom) {
      return res.status(400).json({ message: '房间号已存在' });
    }

    // 创建新房间
    const room = new Room({
      roomId,
      interviewTime: new Date(interviewTime),
      createdBy: req.user.userId,
      participants: [{
        userId: req.user.userId,
        role: req.user.role
      }]
    });

    await room.save();
    res.status(201).json({ message: '房间创建成功', room });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 获取房间信息
app.get('/api/rooms/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId }).populate('createdBy', 'username');
    
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }

    res.json({ message: '获取房间信息成功', room });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// 加入房间
app.post('/api/rooms/join', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.body;
    
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: '房间不存在' });
    }

    // 检查用户是否已在房间中
    const alreadyJoined = room.participants.some(
      p => p.userId.toString() === req.user.userId
    );

    if (!alreadyJoined) {
      room.participants.push({
        userId: req.user.userId,
        role: req.user.role
      });
      await room.save();
    }

    res.json({ message: '加入房间成功', room });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 加入房间
  socket.on('join-room', ({ roomId, userId, role }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', { userId, role, socketId: socket.id });
    console.log(`用户 ${userId} (${role}) 加入房间 ${roomId}`);
  });

  // WebRTC 信令 - offer
  socket.on('offer', ({ roomId, offer, to }) => {
    socket.to(to).emit('offer', { offer, from: socket.id });
  });

  // WebRTC 信令 - answer
  socket.on('answer', ({ roomId, answer, to }) => {
    socket.to(to).emit('answer', { answer, from: socket.id });
  });

  // WebRTC 信令 - ice candidate
  socket.on('ice-candidate', ({ roomId, candidate, to }) => {
    socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log('MongoDB连接地址: mongodb://127.0.0.1:27017/exam_interview');
});