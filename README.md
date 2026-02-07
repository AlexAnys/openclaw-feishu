# feishu-openclaw

飞书 × OpenClaw 保姆级配置指南 & 社区支持  
**让每个人都能用飞书接入 AI 助手，不管你是不是技术背景。**

---

## 致社区

感谢大家一直以来的支持与信任 🙏

本项目最初是为了让飞书用户能更方便地接入 AI 助手——从独立桥接、到 npm 插件，再到一路踩坑填坑，这些都是大家的反馈推着走过来的。

现在 OpenClaw 已经内置了官方飞书插件（`@openclaw/feishu`），功能更完整、维护更及时。**这是件好事**——说明飞书 + AI 这条路走通了，社区的需求被看到了。

**本项目会继续为大家服务：**

- 🎯 为非技术背景的伙伴提供**最友好的配置入口**
- 🔄 为老用户提供**保姆级迁移指南**
- 🆕 为新用户提供**从零开始的新手教程**
- 🔧 **常见问题答疑** & 排查清单——官方文档没覆盖到的坑，这里帮你踩
- 🌉 独立桥接模式依然可用（进阶场景）

遇到问题随时开 Issue，我们一起解决。

---

## 📋 目录

- [从旧版迁移到官方插件（保姆级）](#-从旧版迁移到官方插件保姆级)
- [新手教程：从零配置飞书 AI 机器人](#-新手教程从零配置飞书-ai-机器人)
- [常见问题 & 排查清单](#-常见问题--排查清单)
- [进阶配置参考](#-进阶配置参考)
- [独立桥接模式（进阶用户）](#-独立桥接模式进阶用户)
- [更新日志](#-更新日志)
- [链接](#-链接)

---

## 🔄 从旧版迁移到官方插件（保姆级）

> 适用于：之前使用本项目（独立桥接或 npm 插件）的老用户。  
> 两种方式任选其一，效果一样。

### 迁移前须知

- ✅ 你之前创建的飞书应用（机器人）**可以继续用**，不需要重新创建
- ✅ App ID 和 App Secret 不变
- ✅ 迁移后聊天记录不受影响（记录在飞书端）
- ⚠️ 迁移过程中机器人会短暂离线（几分钟）

---

### 方式一：通过 OpenClaw 升级（推荐，最省事）

如果你的 OpenClaw 版本 ≥ 2026.2，升级后官方飞书插件已经内置，只需要：

#### 1. 升级 OpenClaw

```bash
openclaw update
```

升级完成后会自动重启网关。

#### 2. 添加飞书渠道

```bash
openclaw channels add
```

选择 **Feishu** → 粘贴你的 **App ID** → 粘贴你的 **App Secret**。

> App ID 和 App Secret 在哪？之前可能保存在 `~/.clawdbot/secrets/feishu_app_secret`，可以 `cat` 查看。  
> 如果找不到，去 [飞书开放平台](https://open.feishu.cn/app) → 你的应用 → **凭证与基础信息** 重新复制。

#### 3. 补全飞书应用权限

官方插件支持图片、文件、流式输出等更多功能，需要在飞书开放平台补几个权限：

1. 打开 [飞书开放平台](https://open.feishu.cn/app) → 进入你的应用
2. 进入 **权限管理** → 点击 **批量导入**
3. 粘贴以下内容一键导入：

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "docs:document.content:read",
      "event:ip_list",
      "im:chat",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.group_msg",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource",
      "sheets:spreadsheet",
      "wiki:wiki:readonly"
    ],
    "user": [
      "aily:file:read",
      "aily:file:write",
      "im:chat.access_event.bot_p2p_chat:read"
    ]
  }
}
```

> 已有的权限会自动跳过，不会重复添加。

4. 导入后 → **创建新版本** → **发布**（让新权限生效）

#### 4. 清理旧插件/桥接

```bash
# 移除旧的 npm 插件（如果装过）
openclaw plugins remove feishu-openclaw 2>/dev/null

# 停掉旧的桥接服务（如果用过独立桥接）
launchctl unload ~/Library/LaunchAgents/com.clawdbot.feishu-bridge.plist 2>/dev/null

# 重启网关
openclaw gateway restart
```

然后跳到下方 [验证](#验证) 确认一切正常。

---

### 方式二：手动安装插件 + 配置

适用于不想整体升级 OpenClaw、只想加飞书的情况。

#### 1. 准备好你的飞书凭证

- **App ID**：格式如 `cli_xxxxxxxxx`
- **App Secret**

> 之前可能保存在 `~/.clawdbot/secrets/feishu_app_secret`，可以 `cat` 查看。  
> 如果找不到，去 [飞书开放平台](https://open.feishu.cn/app) → 你的应用 → **凭证与基础信息** 重新复制。

#### 2. 补全飞书应用权限

（同方式一的第 3 步，权限 JSON 一样，这里不重复粘贴——往上翻到方式一的权限 JSON 复制即可。）

1. [飞书开放平台](https://open.feishu.cn/app) → 你的应用 → **权限管理** → **批量导入** → 粘贴上方 JSON
2. 导入后 → **创建新版本** → **发布**

#### 3. 安装并配置

```bash
# 安装官方飞书插件
openclaw plugins install @openclaw/feishu

# 添加飞书渠道（交互式引导）
openclaw channels add
#    → 选择 Feishu
#    → 粘贴 App ID
#    → 粘贴 App Secret

# 移除旧的 npm 插件（如果装过）
openclaw plugins remove feishu-openclaw 2>/dev/null

# 停掉旧的桥接服务（如果用过独立桥接）
launchctl unload ~/Library/LaunchAgents/com.clawdbot.feishu-bridge.plist 2>/dev/null

# 重启网关
openclaw gateway restart
```

---

### 验证

```bash
# 查看日志，确认飞书连接成功
openclaw logs --follow
```

日志中看到类似 `feishu ws connected` 或 `feishu provider ready` 就说明连上了。

在飞书里给机器人发一条消息，正常收到回复 = 迁移完成 🎉

> **配对授权**：如果机器人回复了一个配对码，在终端运行：
> ```bash
> openclaw pairing approve feishu <配对码>
> ```
> 授权后就能正常对话了。这是一次性操作。

### 迁移后清理（可选）

稳定运行几天后，可以清理旧文件：

```bash
# 删除旧的 launchd 配置（桥接用户）
rm -f ~/Library/LaunchAgents/com.clawdbot.feishu-bridge.plist

# 旧的桥接项目文件夹可以归档或删除
# （建议先保留一段时间，确认没问题再删）
```

---

## 🚀 新手教程：从零配置飞书 AI 机器人

> 适用于：第一次使用 OpenClaw + 飞书的新用户。  
> 前提：已安装 OpenClaw 并正常运行（`openclaw gateway status` 能看到状态）。  
> 预计耗时：15–20 分钟。

### 第一步：创建飞书应用（机器人）

1. 打开 [飞书开放平台](https://open.feishu.cn/app)，用飞书账号登录
2. 点击 **创建企业自建应用**
3. 填写应用名称（随意，比如 "我的 AI 助手"）和描述
4. 选一个图标（可以之后改）

### 第二步：启用机器人能力

进入你刚创建的应用：

1. 左侧菜单找到 **应用能力** > **机器人**
2. **开启**机器人能力
3. 给机器人起个名字

### 第三步：配置权限

1. 左侧菜单进入 **权限管理**
2. 点击 **批量导入**
3. 粘贴以下 JSON（一键导入所有需要的权限）：

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "docs:document.content:read",
      "event:ip_list",
      "im:chat",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.group_msg",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource",
      "sheets:spreadsheet",
      "wiki:wiki:readonly"
    ],
    "user": [
      "aily:file:read",
      "aily:file:write",
      "im:chat.access_event.bot_p2p_chat:read"
    ]
  }
}
```

### 第四步：配置事件订阅

> ⚠️ 这一步**必须在 OpenClaw 网关启动后**再做，否则保存会失败。  
> 先做第五、六步，回来再做这一步也可以。

1. 左侧菜单进入 **事件与回调** > **事件配置**
2. 请求方式选择：**使用长连接接收事件**（这是关键！不需要公网服务器）
3. 添加事件：搜索 `im.message.receive_v1`（接收消息），勾选添加

### 第五步：记下凭证

在应用的 **凭证与基础信息** 页面，复制：

- **App ID**（格式如 `cli_xxxxxxxxx`）
- **App Secret**

> ❗ App Secret 很重要，请妥善保管，不要分享。

### 第六步：发布应用

1. 左侧菜单 **版本管理与发布**
2. **创建版本** → 填写版本说明 → 提交
3. 等待审批（企业内部应用通常自动通过，几秒到几分钟）

### 第七步：在 OpenClaw 中配置飞书

打开 **终端（Terminal）**：

```bash
# 1. 安装飞书插件
openclaw plugins install @openclaw/feishu

# 2. 添加飞书渠道（交互式，跟着提示走）
openclaw channels add
# 选择 Feishu → 粘贴 App ID → 粘贴 App Secret

# 3. 重启网关
openclaw gateway restart

# 4. 查看日志，确认连接成功
openclaw logs --follow
```

### 第八步：发消息测试

1. 在飞书里搜索你的机器人名字，打开对话
2. 发一条消息，比如"你好"
3. 如果机器人回复了**配对码**，在终端运行：

```bash
openclaw pairing approve feishu <配对码>
```

4. 授权后再发一条消息，收到正常回复 = 配置完成 🎉

> **回来补第四步**：如果你先跳过了事件订阅，现在网关已启动，回到飞书开放平台把第四步做完，保存后重启网关（`openclaw gateway restart`）。

### 第九步（可选）：让机器人开机自启

```bash
openclaw gateway install
```

这样电脑重启后机器人也会自动上线。

---

## 🔧 常见问题 & 排查清单

> 遇到问题先看这里。如果没找到答案，欢迎开 [Issue](https://github.com/AlexAnys/openclaw-feishu/issues)。

### 机器人完全没反应（收不到消息）

按顺序检查：

1. **网关在运行吗？**
   ```bash
   openclaw gateway status
   ```
   如果没运行：`openclaw gateway restart`

2. **飞书应用发布了吗？**  
   去飞书开放平台 → 你的应用 → 版本管理，确认有已发布的版本

3. **事件订阅配置了吗？**
   - 是否选了 **"使用长连接接收事件"**（不是 Webhook）
   - 是否添加了事件 `im.message.receive_v1`

4. **权限够吗？**  
   至少需要：`im:message`、`im:message.p2p_msg:readonly`、`im:message:send_as_bot`

5. **看日志**：
   ```bash
   openclaw logs --follow
   ```
   发一条消息，看日志有没有反应

### 时断时续（有时能回复，有时没反应）

常见原因：

- **网络波动**：飞书 WebSocket 断开后通常会自动重连，但如果你的网络不稳定（尤其是 VPN/代理环境），可能频繁断连
- **网关重启**：检查是否有什么在反复触发网关重启
  ```bash
  # 查看最近的网关日志
  openclaw logs | grep -i "restart\|reconnect\|disconnect"
  ```
- **DNS 问题**：如果你在国内使用代理，确保 `open.feishu.cn` 走直连（不走代理）

### 发图片 / 发文件，AI 看不到

1. **检查权限**：必须有 `im:resource` 权限
2. 在飞书开放平台补权限后，记得 **创建新版本 → 发布**
3. 重启网关：`openclaw gateway restart`

### AI 说生成了图片，但飞书没收到

1. 确认有 `im:resource` 权限（用于上传图片到飞书）
2. 检查日志中有没有 upload 相关的错误

### 群聊中机器人不回复

1. 默认需要 **@机器人** 才会回复
2. 确认机器人已被添加到群聊
3. 检查 `groupPolicy` 配置（见[进阶配置](#群组配置)）

### 回复特别慢

- 这通常是 AI 模型的响应速度决定的，和飞书插件关系不大
- 可以开启**流式输出**（默认已开启），让回复逐步显示而不是等全部生成后一次发送
- 如果超过 30 秒无回复，检查日志看是不是模型调用出错

### "Unknown model" 错误

- 通常发生在模型配置变更后，重启网关即可：
  ```bash
  openclaw gateway restart
  ```

### 配对码是什么？怎么用？

首次和机器人对话时，出于安全考虑，机器人会回复一个配对码（一串字母数字）。你需要在终端"批准"这个配对：

```bash
openclaw pairing approve feishu <配对码>
```

批准后这个飞书用户就可以正常和机器人对话了。这是一次性操作。

### Lark（国际版）用户

如果你用的是 Lark 而不是飞书，需要在配置中指定域名：

```json5
{
  channels: {
    feishu: {
      domain: "lark"
    }
  }
}
```

---

## 📚 进阶配置参考

### 配置文件位置

```
~/.openclaw/openclaw.json
```

### 基础配置示例

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxxxxxxxx",
          appSecret: "你的AppSecret",
          botName: "我的AI助手",
        },
      },
    },
  },
}
```

### 群组配置

**默认行为**：所有群组允许，但必须 @机器人。

**特定群组无需 @（直接回复所有消息）**：

```json5
{
  channels: {
    feishu: {
      groups: {
        oc_你的群组ID: { requireMention: false },
      },
    },
  },
}
```

**只允许特定用户在群组中使用**：

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["ou_用户1", "ou_用户2"],
    },
  },
}
```

> 获取群组 ID（`oc_xxx`）/ 用户 ID（`ou_xxx`）：给机器人发消息后看日志 `openclaw logs --follow`。

### 流式输出

默认开启。机器人会边生成边更新消息，而不是等全部写完再发。

```json5
{
  channels: {
    feishu: {
      streaming: true,       // 流式卡片输出（默认 true）
      blockStreaming: true,   // 块级流式（默认 true）
    },
  },
}
```

如需关闭（等完整回复后一次性发送）：设 `streaming: false`。

### 多 Agent 路由

一个飞书机器人可以对接多个不同的 AI Agent（比如不同的人聊不同的Agent）：

```json5
{
  bindings: [
    {
      agentId: "main",
      match: { channel: "feishu", peer: { kind: "dm", id: "ou_用户A" } },
    },
    {
      agentId: "另一个agent",
      match: { channel: "feishu", peer: { kind: "group", id: "oc_某群组" } },
    },
  ],
}
```

### 访问控制策略

| 策略 (`dmPolicy`) | 行为 |
|---|---|
| `"pairing"` | **默认**。新用户收到配对码，管理员批准后可对话 |
| `"allowlist"` | 仅白名单用户可对话 |
| `"open"` | 允许所有人对话 |
| `"disabled"` | 禁止私聊 |

### 常用命令速查

| 命令 | 说明 |
|---|---|
| `openclaw gateway status` | 查看网关状态 |
| `openclaw gateway restart` | 重启网关 |
| `openclaw gateway install` | 安装为开机自启服务 |
| `openclaw logs --follow` | 实时查看日志 |
| `openclaw pairing list feishu` | 查看待授权配对 |
| `openclaw pairing approve feishu <CODE>` | 批准配对 |
| `openclaw plugins list` | 查看已安装插件 |

---

## 🌉 独立桥接模式（进阶用户）

> 适用于：需要**进程隔离**（桥接崩溃不影响网关）或有**特殊定制需求**的用户。  
> 大多数用户使用官方插件即可，无需桥接。

### 插件 vs 桥接

| | 官方插件 | 独立桥接（本项目） |
|---|---|---|
| 安装方式 | `openclaw plugins install` | `git clone` + `npm install` |
| 进程 | 和网关同进程 | 独立进程 |
| 崩溃影响 | 可能影响网关 | **互不影响** |
| 维护 | 随 OpenClaw 更新 | 需自行维护 |
| 适合场景 | 日常使用 | 生产 / 隔离部署 |

### 快速启动

```bash
# 克隆项目
git clone https://github.com/AlexAnys/feishu-openclaw.git
cd feishu-openclaw

# 安装依赖
npm install

# 配置凭证
mkdir -p ~/.clawdbot/secrets
echo "你的AppSecret" > ~/.clawdbot/secrets/feishu_app_secret
chmod 600 ~/.clawdbot/secrets/feishu_app_secret

# 启动
FEISHU_APP_ID=cli_xxxxxxxxx node bridge.mjs
```

### 设为开机自启（launchd）

```bash
# 生成服务配置
node setup-service.mjs

# 加载服务
launchctl load ~/Library/LaunchAgents/com.clawdbot.feishu-bridge.plist

# 查看状态
launchctl list | grep feishu
```

### 桥接日志

```
~/.clawdbot/logs/feishu-bridge.out.log   # 正常输出
~/.clawdbot/logs/feishu-bridge.err.log   # 错误日志
```

### 调试模式

```bash
# 在项目目录创建 .env 文件
echo "FEISHU_BRIDGE_DEBUG=1" > .env

# 重启后查看详细日志
tail -n 200 ~/.clawdbot/logs/feishu-bridge.err.log
```

### 桥接工作原理

```
飞书用户 ←→ 飞书云端 ←→ 桥接脚本（你的电脑） ←→ OpenClaw 网关
```

桥接使用飞书的 **WebSocket 长连接**接收消息——不需要公网 IP、不需要域名、不需要内网穿透。

---

## 📝 更新日志

### 2026.02 — 定位转型

本项目从独立桥接/插件转型为 **飞书 × OpenClaw 配置指南 & 社区支持中心**。

OpenClaw 已内置官方飞书插件（`@openclaw/feishu`），本项目继续为社区提供：保姆级教程、迁移指南、常见问题答疑。

### 2026.02.02 — 媒体功能大更新（桥接模式）

- ✅ 飞书传图 → AI 能看图
- ✅ 飞书传视频/文件 → 桥接可接收下载
- ✅ AI 生图 → 自动回传飞书
- ✅ 列表格式修复
- ✅ 本地文件发送白名单安全控制

### 2025.2.1

同步更新飞书插件，适配 OpenClaw。

---

## 🔗 链接

- 📖 [OpenClaw 官方文档](https://docs.openclaw.ai)
- 💬 [OpenClaw 社区 Discord](https://discord.com/invite/clawd)
- 🐛 [本项目 Issues（提问 & 反馈）](https://github.com/AlexAnys/openclaw-feishu/issues)
- 🔌 [GitHub: openclaw-feishu](https://github.com/AlexAnys/openclaw-feishu)（本项目）
- 🌉 [GitHub: feishu-openclaw](https://github.com/AlexAnys/feishu-openclaw)（独立桥接）
- 📦 [npm: feishu-openclaw](https://www.npmjs.com/package/feishu-openclaw)

---

## 常见问题（快问快答）

**Q: 需要服务器吗？**  
不需要。飞书用 WebSocket 长连接，你的电脑（Mac / Windows / Linux）直接连飞书云端，不需要公网 IP。

**Q: 电脑关机了怎么办？**  
机器人会离线。开机后自动重连（如果配了开机自启）。要 24/7 在线可以用一台常开的机器（Mac Mini、NAS、云服务器等）。

**Q: 飞书免费版能用吗？**  
可以。自建应用和机器人功能对所有飞书版本开放。

**Q: 能同时接 Telegram / 微信等其他渠道吗？**  
可以。OpenClaw 原生支持多渠道，飞书只是其中之一，互不影响。

**Q: 用了官方插件后，这个项目还有用吗？**  
有。本项目持续提供配置教程、排查指南和社区答疑，遇到问题随时来这里找解决方案。

---

## License

MIT
