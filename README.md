# feishu-openclaw

[![npm version](https://img.shields.io/npm/v/feishu-openclaw.svg)](https://www.npmjs.com/package/feishu-openclaw)

> **🆕 2026.2.1**：v0.3.1 双构建架构，完整支持 OpenClaw / Clawdbot  
> 如果觉得有帮到你，欢迎🌟支持，让更多人看到

飞书 × AI 助手插件 — 无需服务器  
Feishu × AI Assistant plugin — no server required

---

## 🤖 一键安装 / One-Click Install

### OpenClaw

**复制以下内容发给你的 OpenClaw：**

```
帮我安装飞书插件: https://github.com/AlexAnys/openclaw-feishu
```

OpenClaw 会自动安装、配置、重启，然后需要 App ID和 Secrect，在下方创建机器人后拿到发给它，然后配置事件订阅发布机器人应用更新，就可以测试啦。

### Clawdbot

**复制以下内容发给你的 Clawdbot：**

```
帮我安装飞书插件: https://github.com/AlexAnys/openclaw-feishu
```

---

## ⚠️ 你必须做的事 / What You Must Do

### 创建飞书机器人（约 5 分钟）

1. [飞书开放平台](https://open.feishu.cn/app) → **创建企业自建应用**
2. 添加「**机器人**」能力
3. **权限配置** → 开启：
   - `im:message`（发消息）
   - `im:message.group_at_msg`（群聊@消息）
   - `im:message.group_msg`（群聊消息）
   - `im:message.p2p_msg`（私聊消息）
4. **版本管理** → 创建版本 → 发布上线
5. 记下 **App ID** (`cli_xxx`) 和 **App Secret**
6. Openclaw/clawdbot 一键安装插件后，需要 Appid 和 App Secret 时发给它

### ⚠️ 事件订阅：必须在配置好 ID/Secret 后再设置

飞书要求先验证凭据才能配置「长连接」，所以顺序是：

```
安装插件 → 配置 App ID/Secret → 重启 Gateway → 再去飞书配置长连接
```

配置好 ID/Secret 并重启 Gateway 后，再去飞书开放平台：
1. **事件与回调** → 添加 `im.message.receive_v1`
2. **订阅方式** → 选择 **「使用长连接接收事件」** ⚠️ 不是 Webhook！
3. **版本管理** → 创建版本 → 发布上线
4. 测试：飞书私聊或群里@机器人

---

## 📦 安装方式 / Install Methods

| 方式 | 说明 | 链接 |
|------|------|------|
| **① 一键安装** | 复制上方内容给 OpenClaw / Clawdbot | 本页 ⬆️ |
| **② npm 命令** | `openclaw plugins install feishu-openclaw` | [npm](https://www.npmjs.com/package/feishu-openclaw) |
| **③ 独立桥接** | 独立进程，生产/隔离部署 | [feishu-openclaw](https://github.com/AlexAnys/feishu-openclaw) |

### 插件 vs 桥接

| | 插件 (①②) | 桥接 (③) |
|---|---|---|
| 进程 | 1 个（内置 Gateway） | 2 个（独立） |
| 崩溃 | 影响 Gateway | 互不影响 |
| 适合 | 日常使用 | 生产环境 |

---

## 🔧 手动配置 / Manual Config

如果没用一键安装，手动配置：

### OpenClaw

```bash
openclaw plugins install feishu-openclaw
openclaw config set channels.feishu.enabled true --json
openclaw config set channels.feishu.appId "cli_你的AppID"
openclaw config set channels.feishu.appSecret "你的AppSecret"
openclaw gateway restart
```

### Clawdbot

```bash
clawdbot plugins install feishu-openclaw
clawdbot config set channels.feishu.enabled true --json
clawdbot config set channels.feishu.appId "cli_你的AppID"
clawdbot config set channels.feishu.appSecret "你的AppSecret"
clawdbot gateway restart
```

---

## ❗ 常见问题 / Troubleshooting

### 收不到消息？

| 检查项 | 说明 |
|--------|------|
| 应用已发布 | 不是草稿状态 |
| 用「长连接」 | **不是 Webhook** |
| 权限已开启 | 三个 im 权限 |
| 配置顺序对 | 先配 ID/Secret，再去飞书配长连接 |

### 报错 `unknown channel id: feishu`？

这是 doctor 检查的 warning，**不影响实际运行**。只要 `openclaw status` 显示 `Feishu: ON | OK` 就是正常的。

### 报错 `not configured`？

**必须用 `appSecret`，不支持 `appSecretPath`**：

```bash
# ✅ 正确
openclaw config set channels.feishu.appSecret "你的secret"

# ❌ 错误
openclaw config set channels.feishu.appSecretPath "/path/to/file"
```

### 群聊不回复？

@机器人，或消息末尾加问号。

---

## 特点 / Features

- ✅ 无需服务器 — WebSocket 长连接
- ✅ 双环境支持 — OpenClaw / Clawdbot
- ✅ 私聊 + 群聊
- ✅ 图片文件收发
- ✅ 多账号支持

---

## 链接 / Links

- 📦 [npm: feishu-openclaw](https://www.npmjs.com/package/feishu-openclaw)
- 🔌 [GitHub: openclaw-feishu](https://github.com/AlexAnys/openclaw-feishu) (本项目)
- 🌉 [GitHub: feishu-openclaw](https://github.com/AlexAnys/feishu-openclaw) (桥接)
- 📖 [OpenClaw 文档](https://docs.openclaw.ai)
- 📖 [Clawdbot 文档](https://docs.clawd.bot)

## License

MIT
