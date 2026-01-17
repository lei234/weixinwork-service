# 企业微信客服消息集成系统

企业微信客服消息与 COZE 工作流集成的后端服务，实现智能客服自动回复功能。

## 功能特性

- 接收企业微信客服消息回调通知
- 消息解析与签名验证
- 集成 COZE 工作流 API 进行 AI 处理
- 自动回复客户消息
- 上下文管理：每个客户维护独立的上下文 ID（24小时TTL）
- 完整的错误处理与日志记录

## 技术栈

- **后端框架**: Node.js + Express + TypeScript
- **数据存储**: Redis（上下文管理）
- **HTTP客户端**: Axios
- **日志**: Winston

## 目录结构

```
src/
├── config/           # 配置管理
├── controllers/      # 控制器层
├── services/         # 业务逻辑层
│   ├── wechat/       # 企业微信服务
│   ├── coze/         # COZE服务
│   ├── context/      # 上下文管理
│   └── logger/       # 日志服务
├── middlewares/      # 中间件
├── interfaces/       # 接口定义
├── utils/            # 工具函数
├── constants/        # 常量定义
├── app.ts            # Express配置
└── server.ts         # 服务入口
```

## 快速开始

### 前置要求

- Node.js >= 16
- Redis 服务运行中
- 企业微信客服账号
- COZE API Key 和工作流 ID

### 安装

```bash
# 安装依赖
npm install
```

### 配置

复制 `.env.example` 为 `.env` 并填写配置：

```env
NODE_ENV=development
PORT=3000

# 企业微信配置
WECHAT_CORP_ID=your_corp_id
WECHAT_KF_SECRET=your_kf_secret
WECHAT_KF_TOKEN=your_token
WECHAT_KF_ENCODING_AES_KEY=your_encoding_aes_key

# COZE配置
COZE_API_KEY=your_api_key
COZE_API_BASE_URL=https://api.coze.cn
COZE_WORKFLOW_ID=your_workflow_id
COZE_TIMEOUT=30000

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=wechat:
```

### 运行

```bash
# 开发模式
npm run dev

# 编译
npm run build

# 生产模式
npm start
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/webhook/wechat` | GET | 企业微信 URL 验证 |
| `/webhook/wechat` | POST | 接收企业微信消息回调 |

## 企业微信配置

1. 登录企业微信管理后台
2. 进入「客服」-「开发」-「接收消息」
3. 设置回调 URL: `https://your-domain.com/webhook/wechat`
4. 填写 Token 和 EncodingAESKey

## 核心流程

```
企业微信消息 → 签名验证 → 消息解析 → 获取/创建上下文 → 调用COZE工作流 → 发送回复
```

## 上下文管理

- 每个客户（external_userid）拥有独立的上下文 ID
- 上下文存储在 Redis 中，TTL 为 24 小时
- 每次交互自动刷新 TTL
- 支持上下文复用，保持对话连贯性

## 开发

```bash
# 运行开发服务器
npm run dev

# 编译 TypeScript
npm run build
```

## 许可证

ISC
