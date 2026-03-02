# 飞书 API 配额耗尽：诊断与修复指南

> 本文档为 AI Agent 提供完整的上下文和操作步骤，用于诊断和修复飞书 API 月度配额被意外耗尽的问题。
> 你可以将下方的 [Agent 修复 Prompt](#agent-修复-prompt) 直接发给你的 AI 助手执行。

---

## 问题现象

飞书开放平台 API 月度调用量（免费额度 50,000 次）被耗尽，但用户几乎没有主动使用飞书机器人。

## 根因

OpenClaw Gateway 内置了一个 **health check 定时器**，每 **60 秒**对所有已启用的 channel 执行一次健康探测（`probeAccount`）。

飞书插件的探测实现是调用 `GET /open-apis/bot/v3/info`——这是一个 REST API 调用，**每次都计入飞书月度配额**。

### 消耗速度

| 场景 | 每小时调用 | 每天（16h 运行） | 每月（28 天） |
|---|---|---|---|
| 单台机器 | ~60 | ~960 | ~26,880 |
| 两台机器（同一 App） | ~120 | ~1,920 | ~53,760 |

> 如果 probe 失败触发重试，实际调用量可能更高。

### 关键点

- 这是 **OpenClaw 框架行为**，不是飞书插件特有的。所有 channel（Slack、Discord 等）都有 health check，但其他 channel 的 probe 通常不消耗有限配额。
- Health check 和**消息接收互相独立**。飞书消息通过 WebSocket 长连接实时推送，不依赖 health check。
- 禁用 health check 或禁用飞书 channel **不会影响**已建立的 WebSocket 消息接收（但禁用 channel 会同时断开 WebSocket）。

## 解决方案

### 方案 A：不使用飞书 → 禁用飞书 channel

如果你当前不通过飞书和 AI 对话，直接禁用：

```bash
# 查看当前飞书配置状态
openclaw channels status feishu

# 禁用飞书 channel
openclaw config set channels.feishu.enabled false

# 重启网关
openclaw gateway restart
```

需要时随时重新启用：
```bash
openclaw config set channels.feishu.enabled true
openclaw gateway restart
```

### 方案 B：多台机器 → 只保留一台启用飞书

如果你有多台机器运行 OpenClaw 且共用同一个飞书 App ID，在不需要飞书的机器上禁用：

```bash
# 在不需要飞书的机器上执行
openclaw config set channels.feishu.enabled false
openclaw gateway restart
```

### 方案 C：保持飞书启用 → 了解配额消耗

如果你需要飞书且只有一台机器，月消耗约 27,000 次（50,000 配额的 54%），通常不会超限。注意：

- 不要在多台机器上用同一个 App ID 同时启用飞书
- 如果有其他应用也在使用同一个飞书 App 的 API，需要合计考虑

---

## Agent 修复 Prompt

> 将以下内容直接发送给你的 AI 助手即可。

```
我的飞书 API 月度配额（50,000 次）被意外耗尽了，但我几乎没有使用飞书机器人。

这是一个已知问题：OpenClaw Gateway 每 60 秒对所有启用的 channel 执行 health check，飞书插件的 health check 会调用 bot/v3/info API，每次计入月度配额。单台机器每月消耗约 27,000 次，两台机器共用同一个 App 就会超限。

请帮我排查和修复：

1. 运行 `openclaw channels status` 查看飞书是否启用
2. 如果我不需要飞书对话功能，运行：
   - `openclaw config set channels.feishu.enabled false`
   - `openclaw gateway restart`
3. 如果我有多台机器运行 OpenClaw，检查是否都启用了飞书，在不需要的机器上禁用
4. 如果我需要保留飞书，确认只有一台机器启用即可（单台不会超限）

修复后用 `openclaw channels status` 确认飞书状态。
```

---

## 参考

- OpenClaw health check 源码：`gateway-cli` 中的 `HEALTH_REFRESH_INTERVAL_MS = 60000`
- 飞书 probe 实现：`extensions/feishu/src/probe.ts`（调用 `GET /open-apis/bot/v3/info`）
- 飞书开放平台 API 配额查看：[飞书开放平台](https://open.feishu.cn/app) → 你的应用 → 应用使用
