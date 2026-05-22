# ccusage-dashboard

基于 [ccusage](https://ccusage.com/) 的本地用量仪表板，通过 Web 界面查看 Claude Code / Codex / OpenCode 等 AI 编程工具的 Token 用量和费用分析。

## 功能

- **总览页** — 费用/Token 统计卡片、费用趋势图、模型分布饼图
- **日/周/月报** — Token 趋势面积图、费用柱状+累计折线图、详细数据表格（可展开模型明细）
- **会话报告** — 按会话列出用量，支持展开模型 breakdown
- **计费块** — 活跃块实时监控、消耗率/预测、60 秒自动刷新
- **全局工具切换** — 顶部切换全部 / Claude / Codex / OpenCode，按工具筛选数据
- **日期范围筛选** — 自定义起止日期、离线模式
- **Redis 缓存** — 60 秒过期，减少重复 CLI 调用
- **中文界面**

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Ant Design 6 + Recharts 3 |
| 后端 | Express 5（serve 静态文件 + API） |
| 缓存 | Redis（ioredis） |
| 数据源 | ccusage CLI（本地 JSONL 文件） |

## 环境要求

- Node.js >= 22
- npm >= 10
- Redis >= 6
- ccusage >= 20（`npm install -g ccusage` 或 `bunx ccusage`）

## 快速开始

```bash
# 1. 克隆项目
cd ~/projects
git clone <repo-url> ccusage-dashboard
cd ccusage-dashboard

# 2. 安装依赖
npm install

# 3. 启动（生产模式，自动构建 + 单进程）
./ccusage.sh start
```

访问 http://localhost:3001

## 管理脚本

```bash
./ccusage.sh start     # 构建前端 + 启动生产服务器
./ccusage.sh stop      # 停止服务器
./ccusage.sh restart   # 重启（先 stop 再 start）
./ccusage.sh status    # 查看运行状态
./ccusage.sh logs      # 查看日志
```

## 开发模式

如果需要热更新开发：

```bash
npm run dev
```

这会同时启动 Vite 开发服务器（5173）和 Express API 服务器（3001），前端请求自动代理到后端。

## 项目结构

```
ccusage-dashboard/
├── server/
│   ├── index.js              # Express 入口（serve 静态 + API）
│   └── routes/
│       └── ccusage.js        # ccusage CLI 执行 + 数据标准化 + Redis 缓存
├── src/
│   ├── main.jsx
│   ├── App.jsx               # ConfigProvider + Router + AgentProvider
│   ├── api/ccusage.js        # 前端 API 客户端
│   ├── contexts/
│   │   └── AgentContext.jsx   # 全局工具切换上下文
│   ├── hooks/
│   │   └── useCcusageData.js # 数据获取 hook
│   ├── pages/                # 6 个页面组件
│   ├── components/           # 布局、图表、表格、筛选器
│   └── utils/                # 格式化工具函数
├── ccusage.sh                # 管理脚本
└── package.json
```

## API

所有接口前缀 `/api/ccusage`，支持 `agent`、`since`、`until`、`offline` 查询参数。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/ccusage/daily` | 日报数据 |
| GET | `/api/ccusage/weekly` | 周报数据 |
| GET | `/api/ccusage/monthly` | 月报数据 |
| GET | `/api/ccusage/session` | 会话数据 |
| GET | `/api/ccusage/blocks` | 计费块数据 |
| GET | `/api/ccusage/blocks/active` | 当前活跃块 |
| GET | `/api/health` | 健康检查 |

响应头 `X-Cache: HIT/MISS` 标识缓存状态。

## 部署

### 系统服务（systemd）

创建 `/etc/systemd/system/ccusage-dashboard.service`：

```ini
[Unit]
Description=ccusage-dashboard
After=network.target redis.service

[Service]
Type=simple
User=<YOUR_USERNAME>
WorkingDirectory=/path/to/ccusage-dashboard
ExecStart=/usr/bin/env node server/index.js
Environment=PORT=3001
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ccusage-dashboard
sudo systemctl status ccusage-dashboard
```

### 自定义端口

通过环境变量修改：

```bash
PORT=8080 ./ccusage.sh start
```

或在 systemd service 文件中设置 `Environment=PORT=8080`。

### Nginx 反向代理

如需通过域名或 80 端口访问：

```nginx
server {
    listen 80;
    server_name ccusage.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 配置项

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3001 | 服务端口 |
| `REDIS_URL` | redis://127.0.0.1:6379 | Redis 连接地址 |
| `CCUSAGE_PATH` | 自动检测 | ccusage 可执行文件路径 |
