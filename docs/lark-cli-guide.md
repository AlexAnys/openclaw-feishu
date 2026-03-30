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

## 安装：一句话搞定

> **前提**：你需要一个飞书自建应用的 App ID 和 App Secret。
> 如果你已经在用飞书插件/桥接，可以复用同一个应用。
> 如果还没有，参考 [创建飞书应用](../README.md#第一步创建飞书应用机器人)。

**把下面这段话发给你的 OpenClaw Agent：**

```
帮我安装飞书 Lark CLI。
我的飞书 App ID 是 cli_xxxxxxxxx，App Secret 是 xxxxxxxxx。
安装完成后给我一个授权链接，我去浏览器里点一下就行。
```

Agent 会自动完成安装、配置、发起 OAuth，然后给你一个授权链接。你**点击链接 → 在飞书里确认授权** → 完成。整个过程你只需要做这一步。

> ⏱ 授权链接 10 分钟内有效。过期了让 Agent 重新生成一个就行。
>
> 🔄 Token 有效期：Access Token 2 小时（自动续期），Refresh Token 7 天。超过 7 天没用的话，让 Agent 重新走一次授权。

---

## 进阶：给 Agent 的技术参考

> 以下内容面向 AI Agent 和有技术背景的用户。普通用户不需要阅读——让你的 Agent 参考即可。

### 安装步骤（Agent 执行）

```bash
# 1. 安装 CLI
npm install -g @larksuite/cli

# 2. 配置飞书应用（从 stdin 读 secret，不暴露在进程列表）
echo "APP_SECRET" | lark-cli config init --app-id cli_xxxxxxxxx --app-secret-stdin --brand feishu

# 3. 发起 OAuth 授权（全部域权限）
lark-cli auth login --domain all --no-wait --json
# → 输出 JSON 含 verification_url 和 device_code
# → 把 verification_url 给用户，让用户在浏览器中打开并确认授权

# 4. 用户授权后，用 device_code 完成登录
lark-cli auth login --device-code "DEVICE_CODE_FROM_STEP_3"
# → OK: 登录成功!

# 5. 验证
lark-cli doctor
# → 全部 pass

# 6. 安装 AI Agent Skills（19 个，覆盖所有业务域）
npx skills add larksuite/cli -y -g
```

> **关键点**：第 3 步 `--no-wait` 会立即返回 JSON（不阻塞），第 4 步需要等用户完成浏览器授权后才能执行。Agent 应该把授权链接发给用户，等用户确认后再执行第 4 步。

### 如果没有飞书应用

用户没有 App ID / App Secret 时，CLI 可以帮忙创建：

```bash
lark-cli config init --new
# 会输出一个浏览器链接，用户打开后在飞书开放平台创建应用
```

### 命令体系

```bash
# Shortcuts — 最常用的操作，人和 Agent 都友好
lark-cli calendar +agenda
lark-cli docs +search --query "OKR" --format pretty
lark-cli contact +search-user --query "张三"
lark-cli docs +fetch --doc "文档URL或token"
lark-cli im +chat-search --query "项目组"
lark-cli task +get-my-tasks
lark-cli mail +triage --max 5
lark-cli vc +search --start "2026-03-25"

# API Commands — 1:1 映射飞书端点
lark-cli calendar events list --params '{"calendar_id":"primary"}'

# Raw API — 直接调 2500+ 任意端点
lark-cli api GET /open-apis/calendar/v4/calendars
```

### 常用 flags

```bash
--format pretty|table|csv|json   # 输出格式（默认 json）
--dry-run                        # 预览请求，不实际执行
--page-all                       # 自动翻页
--as user|bot                    # 身份切换
```

### 查看 API 参数定义

```bash
lark-cli schema calendar.events.list --format pretty
```

---

## 相关链接

- [Lark CLI GitHub](https://github.com/larksuite/cli) — 源码 & 完整文档
- [飞书开放平台](https://open.feishu.cn) — API 文档 & 应用管理
- [openclaw-feishu](https://github.com/AlexAnys/openclaw-feishu) — 飞书 × OpenClaw 保姆级配置指南（本项目）
