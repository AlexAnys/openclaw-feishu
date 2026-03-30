# Lark CLI：让你的 AI Agent 操作飞书

> 飞书官方于 2026-03-28 开源了 [Lark CLI](https://github.com/larksuite/cli)（MIT），一行命令调飞书 2500+ API，内置 19 个 AI Agent Skills。
>
> 装好之后，你只需要用自然语言告诉 AI 你想做什么，它就能直接帮你操作飞书。

---

## 你的 Agent 能帮你做什么？

装好 Lark CLI 后，这些事情**直接跟你的 AI 说就行**：

| 你说 | Agent 帮你做 |
|------|-------------|
| "帮我看看今天飞书有什么日程" | 查询日历日程 |
| "搜一下飞书里关于 OKR 的文档" | 搜索并展示文档列表 |
| "找一下昨天的妙记，把内容拉出来" | 搜索妙记 → 读取智能纪要全文 |
| "飞书里搜一下张三的联系方式" | 通讯录搜人 |
| "查一下上周的会议录制" | 搜索会议纪要和转写 |
| "帮我在多维表格里加一条记录" | 操作多维表格 |
| "看看飞书邮箱最近有什么邮件" | 浏览/搜索邮件 |
| "帮我建个飞书任务" | 创建任务、设提醒 |

覆盖消息、文档、多维表格、电子表格、日历、邮箱、任务、知识库、通讯录、会议、云空间 —— **11 个业务领域，200+ 命令**。

### 和飞书插件的关系

| | 飞书插件/桥接 | Lark CLI |
|---|---|---|
| **做什么** | 在飞书里和 AI 对话 | 让 AI 帮你操作飞书 |
| **方向** | 飞书 ↔ AI（双向对话） | AI → 飞书（主动操作） |
| **典型场景** | 给机器人发消息，AI 回复 | "帮我搜文档""帮我读妙记" |

**两者互补**，可以同时使用。

---

## 安装：告诉你的 Agent 一句话

Lark CLI 完全独立，**不需要 OpenClaw，不需要提前创建飞书应用**。

**复制下面这段话，发给你的 AI Agent（OpenClaw / Claude Code / Cursor 等）：**

```
帮我安装飞书 Lark CLI。
参考这个指南：https://github.com/AlexAnys/openclaw-feishu/blob/main/docs/lark-cli-guide.md
```

> 💡 如果你已经有飞书自建应用（比如在用飞书插件/桥接），可以补一句 `我的飞书 App ID 是 cli_xxx，Secret 是 xxx`，Agent 会复用它。没有也没关系，Agent 会帮你从零创建。

**你只需要做的事**：Agent 会给你 1~2 个授权链接，在浏览器中打开 → 用飞书账号确认 → 完成 ✅

> ⏱ 授权链接 10 分钟内有效。过期了让 Agent 重新生成一个就行。
>
> 🔄 Token 有效期：Access Token 2 小时（自动续期），Refresh Token 7 天。超过 7 天没用的话，让 Agent 重新走一次授权即可。

---

## 以下内容供 Agent 参考

> **写给 AI Agent**：当用户让你安装 Lark CLI 时，请参考以下内容完成安装。用户只需要做一步：点击授权链接。其余步骤由你执行。

### 背景知识

**Lark CLI 是什么**：飞书官方开源的命令行工具（[larksuite/cli](https://github.com/larksuite/cli)），通过 npm 分发，Go 编写，支持 macOS / Linux / Windows。

**三层命令体系**：
- **Shortcuts**（`+` 前缀）：高频操作的封装，如 `lark-cli docs +search`、`lark-cli calendar +agenda`，对 Agent 最友好
- **API Commands**：1:1 映射飞书 Open API 端点，如 `lark-cli calendar events list`
- **Raw API**：`lark-cli api GET /open-apis/...`，可调用 2500+ 任意端点

**AI Agent Skills**：CLI 配套 19 个 Skill 文件（覆盖 base/calendar/contact/doc/drive/im/mail/sheets/task/vc/wiki 等），通过 `npx skills` 安装后会 symlink 到 Claude Code、OpenClaw、Cursor 等 Agent 框架的 skills 目录，让 Agent 了解飞书 API 的使用模式。

**认证方式**：OAuth 2.0 Device Flow。CLI 生成一个验证链接，用户在浏览器中授权，CLI 获得用户身份的 Access Token。底层需要一个飞书自建应用，但 `config init --new` 可以帮用户从零创建，无需手动操作飞书开放平台。

**凭据复用**：如果用户已经在使用飞书插件/桥接（如 `@openclaw/feishu` 或 `feishu-openclaw`），可以复用同一个飞书应用的 App ID 和 App Secret。Agent 可以尝试从 OpenClaw 配置（`~/.openclaw/openclaw.json` 的 `channels.feishu.accounts`）中读取已有凭据。

### 安装步骤

```bash
# 1. 安装 CLI
npm install -g @larksuite/cli

# 2. 配置飞书应用（二选一）

#    情况 A：用户提供了 App ID 和 Secret（或从 openclaw 配置中读取到）
echo "APP_SECRET" | lark-cli config init --app-id cli_xxxxxxxxx --app-secret-stdin --brand feishu

#    情况 B：用户没有飞书应用（默认走这条路）
#    ⚠️ 此命令会阻塞，输出一个浏览器链接，用户打开后在飞书开放平台确认创建应用
#    用户确认后命令自动完成，应用凭证自动保存
lark-cli config init --new

# 3. 发起 OAuth 授权
lark-cli auth login --domain all --no-wait --json
# 输出 JSON，包含：
#   verification_url — 给用户在浏览器中打开
#   device_code — 后续用于完成登录
# ⚠️ --no-wait 立即返回，不阻塞

# 4. 把 verification_url 发给用户，等待用户在浏览器中完成授权

# 5. 用户授权后，用 device_code 完成登录
lark-cli auth login --device-code "DEVICE_CODE_FROM_STEP_3"
# → OK: 登录成功!

# 6. 验证连接
lark-cli doctor
# 所有检查项应为 pass

# 7. 安装 AI Agent Skills
npx skills add larksuite/cli -y -g
```

**关键注意事项**：
- 步骤 2 必须在步骤 3 之前，否则会报 `not configured` 错误
- 情况 B（`--new`）会阻塞等待用户浏览器操作，建议 Agent 在后台运行并提取链接给用户
- 步骤 3 的 `--no-wait` 立即返回 JSON，不阻塞进程
- 步骤 5 必须等用户完成浏览器授权后才能执行，否则会超时
- 授权链接 10 分钟有效，过期需重新执行步骤 3
- 用户全程只需要 1~2 次浏览器确认（没有应用=2 次，已有应用=1 次）

### 安装后可用的命令速查

```bash
# 搜索文档
lark-cli docs +search --query "关键词" --format pretty

# 读取文档内容
lark-cli docs +fetch --doc "文档URL或token"

# 查日历
lark-cli calendar +agenda

# 搜人
lark-cli contact +search-user --query "姓名"

# 搜群
lark-cli im +chat-search --query "群名"

# 搜会议/妙记
lark-cli vc +search --start "2026-03-25" --end "2026-03-31"

# 查任务
lark-cli task +get-my-tasks

# 操作多维表格
lark-cli base +record-list --app "app_token" --table "table_id"

# 查看命令参数定义
lark-cli schema <service.resource.method> --format pretty
```

**常用 flags**：
- `--format pretty|table|csv|json` — 输出格式（默认 json）
- `--dry-run` — 预览请求，不实际执行
- `--page-all` — 自动翻页获取全部结果
- `--as user|bot` — 切换执行身份

### Token 续期

- Access Token 有效期 2 小时，CLI 会自动用 Refresh Token 续期
- Refresh Token 有效期 7 天，过期后需重新执行 `lark-cli auth login --domain all`

---

## 相关链接

- [Lark CLI GitHub](https://github.com/larksuite/cli) — 源码 & 完整文档
- [飞书开放平台](https://open.feishu.cn) — API 文档 & 应用管理
- [openclaw-feishu](https://github.com/AlexAnys/openclaw-feishu) — 飞书 × OpenClaw 保姆级配置指南（本项目）
