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

**1.下载并解压MongoDB安装包**
   - MongoDB安装包下载地址：https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-5.0.30.zip
   - 下载并解压压缩包

**2.配置**
   - 将bin目录地址添加到系统环境变量
   - 命令提示符输入下面的命令验证是否配置成功
   ```bash
   mongo --version
   ```
   - 在`mongodb-win32-x86_64-windows-5.0.30`目录下创建`data`文件夹，`logs`文件夹，和`conf`文件夹
   - 在`data`目录下创建`db`文件夹
   - 在`logs`目录下创建`mongodb.log`文件
   - 在`conf`目录下创建配置文件mongodb.conf
   - 用记事本打开`mongodb.conf`，添加以下内容，注意`dbPath`和`path`路径的修改
   ```bash
   storage:
      dbPath: D:\Downloads\mongodb-win32-x86_64-windows-5.0.30\data\db
   systemLog:
      destination: file
      path: D:\Downloads\mongodb-win32-x86_64-windows-5.0.30\logs\mongodb.log
      logAppend: true
   net:
      port: 27017
      bindIp: 0.0.0.0
   ```

**3.启动MongoDB服务**
   ```bash
   mongod -f <mongodb.conf的文件地址>
   ```
   例如我的是
   ```bash
   mongod -f D:\Downloads\mongodb-win32-x86_64-windows-5.0.30\conf\mongodb.conf
   ```

**4.数据库连接**
   - 默认连接地址：`mongodb://127.0.0.1:27017/exam_interview`
   - 数据库名称：`exam_interview`
   - 无需手动创建数据库，应用启动时会自动创建
  
**5.数据库可视化**
   - 下载MongoDB Compass。下载地址：https://www.mongodb.com/try/download/compass
   - 点击`MongoDBCompass.exe`启动
   - 点击`Add new connection`添加连接，不用配置直接保存即可自动连接
  
**6.安装依赖（最好以管理员身份运行终端）**
   ```bash
      cd backend
      npm install
      npm install socket.io-client simple-peer
   ```
   ```bash
      cd frontend
      npm install
      npm install socket.io
   ```

## 启动程序

### MongoDB启动
```bash
mongod -f <mongodb.conf的文件地址>
```

### 后端启动

```bash
cd backend
npm start
```

服务器将在 http://localhost:5000 启动

### 前端启动

```bash
cd frontend
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