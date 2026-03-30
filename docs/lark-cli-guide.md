# Lark CLI：让你的 AI Agent 操作飞书

> 飞书官方于 2026-03-28 开源了 [Lark CLI](https://github.com/larksuite/cli)（MIT），一行命令调飞书 2500+ API，内置 19 个 AI Agent Skills。
>
> 装好之后，你只需要用自然语言告诉 AI 你想做什么，它就能直接帮你操作飞书。

---

## 你的 Agent 能帮你做什么？

| 领域 | 能力 | 你说 → Agent 帮你做 |
|------|------|---------------------|
| 💬 消息 | 发消息、建群、搜群、搜消息、下载媒体 | "帮我搜一下项目组的群" |
| 📄 文档 | 创建/读写/搜索文档 | "搜一下飞书里关于 OKR 的文档" |
| 📊 多维表格 | 表/字段/记录/视图/仪表盘/数据聚合 | "帮我在多维表格里加一条记录" |
| 📈 电子表格 | 创建/读写/追加/导出 | "把这个表格的数据拉出来" |
| 📅 日历 | 日程查询、建活动、忙闲查询 | "帮我看看今天有什么日程" |
| 📧 邮箱 | 浏览/搜索/发/回复邮件 | "看看飞书邮箱最近有什么邮件" |
| ✅ 任务 | 创建/查询/完成任务 | "帮我建个飞书任务" |
| 📚 知识库 | 空间/节点管理 | "找一下知识库里的文档" |
| 👤 通讯录 | 按姓名/邮箱/手机搜人 | "飞书里搜一下张三的联系方式" |
| 🎥 会议 | 搜录制、查会议纪要/转写 | "找一下昨天的妙记，把内容拉出来" |
| 📁 云空间 | 上传下载文件、权限管理 | "帮我把这个文件传到飞书云空间" |

**11 个业务领域，200+ 命令**——装好之后，直接跟你的 AI 说就行。

---

## 安装：告诉你的 Agent 一句话

**复制下面这段话，发给你的 AI Agent（OpenClaw / Claude Code / Cursor 等）：**

```
帮我安装飞书 Lark CLI。
参考这个指南：https://github.com/AlexAnys/openclaw-feishu/blob/main/docs/lark-cli-guide.md
```

Agent 会自动完成安装和配置，然后给你一个授权链接。

**你只需要做一件事**：在浏览器中打开链接 → 用飞书账号确认 → 完成 ✅

> ⏱ 授权链接 10 分钟内有效。过期了让 Agent 重新生成一个就行。
>
> 🔄 日常使用无感。如果超过 7 天没用，让 Agent 重新走一次授权即可。

---

## 以下内容供 Agent 参考

> **写给 AI Agent**：当用户让你安装 Lark CLI 时，按以下步骤执行。用户只需要做一步——在浏览器中点击授权链接。

### 背景知识

**Lark CLI** 是飞书官方开源的命令行工具（[larksuite/cli](https://github.com/larksuite/cli)），npm 分发，Go 编写，macOS / Linux / Windows 全平台支持。

**三层命令体系**：
- **Shortcuts**（`+` 前缀）：高频操作封装，如 `lark-cli docs +search`、`lark-cli calendar +agenda`，对 Agent 最友好
- **API Commands**：1:1 映射飞书 Open API 端点，如 `lark-cli calendar events list`
- **Raw API**：`lark-cli api GET /open-apis/...`，可调 2500+ 任意端点

**AI Agent Skills**：配套 19 个 Skill 文件（覆盖 base/calendar/contact/doc/drive/im/mail/sheets/task/vc/wiki 等），安装后 symlink 到 Claude Code、OpenClaw、Cursor 等 Agent 框架，让 Agent 了解飞书 API 的使用模式和最佳实践。

**认证**：OAuth 2.0 Device Flow。CLI 可以自动创建飞书应用 + 完成授权，用户只需在浏览器中确认。

### 安装步骤

```bash
# 1. 安装 CLI
npm install -g @larksuite/cli

# 2. 创建飞书应用并配置
#    ⚠️ 此命令会阻塞，输出一个浏览器链接
#    把链接发给用户，用户在浏览器中确认后命令自动完成
lark-cli config init --new

# 3. 发起 OAuth 授权
lark-cli auth login --domain all --no-wait --json
# 输出 JSON，包含：
#   verification_url — 发给用户，在浏览器中打开
#   device_code — 用于步骤 5

# 4. 把 verification_url 发给用户，等待用户在浏览器中确认授权

# 5. 用户授权后，用 device_code 完成登录
lark-cli auth login --device-code "DEVICE_CODE_FROM_STEP_3"
# → OK: 登录成功!

# 6. 验证
lark-cli doctor
# 所有检查项应为 pass

# 7. 安装 AI Agent Skills
npx skills add larksuite/cli -y -g
```

**注意事项**：
- 步骤 2 必须在步骤 3 之前完成，否则会报 `not configured`
- 步骤 2 的 `--new` 会阻塞等待用户浏览器操作，建议后台运行并提取链接
- 步骤 3 的 `--no-wait` 立即返回 JSON，不阻塞
- 步骤 5 必须等用户完成浏览器授权后执行，否则超时
- 授权链接 10 分钟有效，过期重新执行步骤 3
- 如果用户提供了已有的飞书 App ID 和 Secret，步骤 2 改为：`echo "SECRET" | lark-cli config init --app-id cli_xxx --app-secret-stdin --brand feishu`

### 安装后可用的命令速查

```bash
# 搜索文档
lark-cli docs +search --query "关键词" --format pretty

# 读取文档全文
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

# 查看 API 参数定义
lark-cli schema <service.resource.method> --format pretty
```

**常用 flags**：`--format pretty|table|csv|json` · `--dry-run` · `--page-all` · `--as user|bot`

### Token 续期

Access Token 2 小时（自动续期），Refresh Token 7 天。过期后重新执行 `lark-cli auth login --domain all`。

---

## 相关链接

- [Lark CLI GitHub](https://github.com/larksuite/cli) — 源码 & 完整文档
- [飞书开放平台](https://open.feishu.cn) — API 文档
- [openclaw-feishu](https://github.com/AlexAnys/openclaw-feishu) — 飞书 × OpenClaw 配置指南（本项目）
