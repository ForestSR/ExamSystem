# 公考系统-面试子系统

基于MERN技术栈开发的简洁公考面试系统。

## 项目结构

```
Exam_new/
├── backend/                # 后端服务器
│   ├── server.js          # 主服务器文件
│   ├── package.json       # 后端依赖配置
│   └── .env              # 环境变量
└── frontend/              # 前端应用
    ├── public/
    │   └── index.html    # HTML模板
    ├── src/
    │   ├── components/   # React组件
    │   │   ├── Login.js  # 登录/注册组件
    │   │   └── Interview.js # 面试组件
    │   ├── App.js       # 主应用组件
    │   ├── App.css      # 样式文件
    │   └── index.js     # 入口文件
    └── package.json     # 前端依赖配置
```

## 功能特性

1. **用户认证系统**
   - 用户注册和登录
   - JWT令牌认证
   - 密码加密存储

2. **面试功能**
   - 摄像头开启/关闭
   - 实时视频预览
   - 面试状态显示

3. **数据库集成**
   - MongoDB数据存储
   - 用户信息管理

## 数据库要求

项目使用MongoDB数据库，您需要：

1. **安装MongoDB**
   - 下载并安装MongoDB Community Server
   - 官方下载地址：https://www.mongodb.com/try/download/community
   - 选择Windows版本下载

2. **启动MongoDB服务**
   - 安装后，MongoDB通常会自动启动服务
   - 如需手动启动，运行：`net start MongoDB`

3. **数据库连接**
   - 默认连接地址：`mongodb://127.0.0.1:27017/exam_interview`
   - 数据库名称：`exam_interview`
   - 无需手动创建数据库，应用启动时会自动创建

## 安装和运行

### 后端启动

```bash
cd backend
npm install
npm start
```

服务器将在 http://localhost:5000 启动

### 前端启动

```bash
cd frontend
npm install
npm start
```

前端将在 http://localhost:3000 启动

## 使用说明

1. 确保MongoDB服务正在运行
2. 启动后端服务器
3. 启动前端应用
4. 在浏览器中打开 http://localhost:3000
5. 注册新用户或使用现有账户登录
6. 进入面试页面，可以开启/关闭摄像头

## 技术栈

- **前端**: React 18, React Router, Axios
- **后端**: Node.js, Express.js
- **数据库**: MongoDB, Mongoose
- **认证**: JWT, bcryptjs
- **其他**: CORS, dotenv

## 注意事项

- 摄像头功能需要HTTPS或localhost环境
- 首次使用需要允许浏览器访问摄像头权限
- 确保MongoDB服务正常运行
- 项目设计为最简化结构，便于理解和扩展