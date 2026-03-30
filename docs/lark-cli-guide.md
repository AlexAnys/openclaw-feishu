# Lark CLI：让 AI Agent 操作飞书全量能力

> 2026 年 3 月 28 日，飞书官方开源了 [Lark CLI](https://github.com/larksuite/cli)（MIT 协议）——一个命令行工具，**一行命令调用飞书 2500+ API**，覆盖消息、文档、多维表格、日历、邮箱、任务、知识库等 11 个业务领域，并内置 19 个 AI Agent Skills。
>
> 这意味着：**你的 AI Agent（OpenClaw、Claude Code、Cursor 等）现在可以直接操作飞书的几乎所有功能。**

---

## 它能做什么？

| 领域 | 能力 | 示例命令 |
|------|------|----------|
| 💬 消息 | 发消息、建群、搜群、搜消息、下载媒体 | `lark-cli im +chat-search --query "项目组"` |
| 📄 文档 | 创建/读写/搜索文档 | `lark-cli docs +search --query "周报"` |
| 📊 多维表格 | 表/字段/记录/视图/仪表盘/数据聚合 | `lark-cli base +record-list --app "..." --table "..."` |
| 📈 电子表格 | 创建/读写/追加/导出 | `lark-cli sheets +read --url "..."` |
| 📅 日历 | 日程查询、建活动、忙闲查询 | `lark-cli calendar +agenda` |
| 📧 邮箱 | 浏览/搜索/发/回复邮件 | `lark-cli mail +triage --max 5` |
| ✅ 任务 | 创建/查询/完成任务 | `lark-cli task +get-my-tasks` |
| 📚 知识库 | 空间/节点管理 | `lark-cli wiki spaces get_node --params '...'` |
| 👤 通讯录 | 按姓名/邮箱/手机搜人 | `lark-cli contact +search-user --query "张三"` |
| 🎥 会议 | 搜录制、查会议纪要/转写 | `lark-cli vc +search --start "2026-03-25"` |
| 📁 云空间 | 上传下载文件、权限管理 | `lark-cli drive +upload --file "./report.pdf"` |

三层命令体系，覆盖从简单到复杂的所有场景：

```bash
# Shortcuts — 人和 AI 都友好
lark-cli calendar +agenda
lark-cli docs +search --query "OKR"

# API Commands — 1:1 映射飞书端点
lark-cli calendar events list --params '{"calendar_id":"primary"}'

# Raw API — 直接调 2500+ 任意端点
lark-cli api GET /open-apis/calendar/v4/calendars
```

---

## 和桥接/插件的关系

| | 桥接/插件 | Lark CLI |
|---|---|---|
| **解决什么** | 飞书 ↔ AI 实时对话 | AI 主动操作飞书 |
| **方向** | 双向消息转发 | Agent → 飞书（单向操作） |
| **认证** | App（tenant token） | OAuth 用户身份 |
| **典型场景** | 在飞书里和 AI 聊天 | 让 AI 帮你查日历、读文档、搜妙记 |

**两者互补**：桥接让你在飞书里和 AI 对话，Lark CLI 让 AI 主动帮你操作飞书里的一切。

---

## 快速上手

### 适用环境

- macOS / Linux（Windows 也支持）
- Node.js ≥ 16
- 一个飞书自建应用（可以复用桥接/插件的那个）

### 第一步：安装

```bash
# 安装 CLI
npm install -g @larksuite/cli

# 验证
lark-cli --version
# → lark-cli version 1.0.0
```

### 第二步：配置飞书应用

如果你已经有飞书自建应用（比如桥接/插件用的那个），直接复用：

```bash
# 方式一：用已有 App（推荐）
# 从 stdin 读取 App Secret，避免暴露在进程列表
echo "你的AppSecret" | lark-cli config init --app-id cli_xxxxxxxxx --app-secret-stdin --brand feishu
```

如果没有飞书应用，CLI 可以帮你创建一个：

```bash
# 方式二：创建新应用（会打开浏览器）
lark-cli config init --new
```

### 第三步：OAuth 登录（需要用户手动操作）

```bash
# 发起授权（请求全部域的权限）
lark-cli auth login --domain all --no-wait --json
```

这会输出一个 JSON，里面有 `verification_url`。**在浏览器中打开这个链接，用飞书账号确认授权。**

> ⏱ 链接 10 分钟内有效。如果过期，重新执行上面的命令。

授权确认后，用返回的 `device_code` 完成登录：

```bash
lark-cli auth login --device-code "上面返回的device_code"
# → OK: 登录成功! 用户: 你的名字
```

验证状态：

```bash
lark-cli auth status
# 确认 tokenStatus: "valid"

lark-cli doctor
# 全部 pass 就没问题
```

### 第四步：安装 AI Agent Skills（推荐）

```bash
# 安装全部 19 个 Skills
npx skills add larksuite/cli -y -g
```

Skills 会 symlink 到 Claude Code、OpenClaw、Cursor 等主流 Agent 框架，让 Agent 了解飞书 API 的最佳实践和使用模式。

---

## 让 AI Agent 帮你操作

上面的安装和授权完成后，你可以直接让 AI Agent 通过 `exec` 工具调用 `lark-cli`。

**对 OpenClaw / Claude Code 用户**：只需要像平时一样对话，Agent 会自动调用 `lark-cli` 命令。

实测可用的场景（2026-03-30 验证）：

```
你："帮我看看今天飞书有什么日程"
→ Agent 执行: lark-cli calendar +agenda

你："搜一下飞书里关于 OKR 的文档"
→ Agent 执行: lark-cli docs +search --query "OKR" --format pretty

你："找一下昨天的妙记"
→ Agent 执行: lark-cli docs +search --query "文字记录" --format pretty
→ Agent 执行: lark-cli docs +fetch --doc "文档URL"

你："搜一下飞书里叫张三的人"
→ Agent 执行: lark-cli contact +search-user --query "张三"
```

---

## Token 有效期

| Token | 有效期 | 说明 |
|-------|--------|------|
| Access Token | 2 小时 | CLI 会自动用 Refresh Token 续期 |
| Refresh Token | 7 天 | 过期后需重新 `auth login` |

日常使用基本无感。如果超过 7 天没用，重新执行一次 `lark-cli auth login --domain all` 即可。

---

## 实用技巧

```bash
# 输出格式：json（默认）/ table / csv / pretty
lark-cli docs +search --query "周报" --format table

# 预览请求（不实际执行）
lark-cli im +messages-send --chat-id "oc_xxx" --text "test" --dry-run

# 自动翻页
lark-cli base +record-list --app "..." --table "..." --page-all

# 查看某个 API 的参数定义
lark-cli schema calendar.events.list --format pretty
```

---

## 相关链接

- [Lark CLI GitHub](https://github.com/larksuite/cli) — 源码 & 文档
- [飞书开放平台](https://open.feishu.cn) — API 文档 & 应用管理
- [feishu-openclaw 桥接](https://github.com/AlexAnys/feishu-openclaw) — 飞书 ↔ AI 实时对话
- [openclaw-feishu 插件](https://github.com/AlexAnys/openclaw-feishu) — 一键安装插件版
