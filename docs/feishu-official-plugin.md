# 飞书官方插件安装指南

> 飞书团队推出的 OpenClaw 官方插件（`feishu-openclaw-plugin`），能让 OpenClaw 以**你的身份**操作飞书，覆盖文档、多维表格、日历、任务等场景。
>
> 📖 完整图文教程：[飞书官方文章](https://www.feishu.cn/content/article/7613711414611463386)

---

## 它能做什么？

| 类别 | 能力 |
|---|---|
| 💬 消息 | 读取群聊/单聊历史、发送/回复消息、消息搜索、图片/文件下载 |
| 📄 文档 | 创建、读取、编辑云文档 |
| 📊 多维表格 | 创建/管理数据表、字段、记录（增删改查、批量操作、高级筛选）、视图 |
| 📅 日历 | 日历管理、日程创建/查询/修改/删除/搜索、参会人管理、忙闲查询 |
| ✅ 任务 | 任务创建/查询/更新/完成、清单管理、子任务、评论 |

核心差异：以**用户身份**（OAuth 授权）操作，不是以机器人身份。你说一句话，它能直接帮你写文档、建表格、约日程。

---

## 快速安装（4 步）

### 前提

- 已安装 OpenClaw 并正常运行
- 已在飞书开放平台创建好应用（机器人）并配置好权限

> ⚠️ **飞书官方插件和 OpenClaw 内置插件互斥，只能启用一个。** 安装官方插件时会自动禁用内置插件，无需手动处理。如果安装后出现 `duplicate plugin id` 报错，说明两个插件同时存在，运行 `rm -rf ~/.openclaw/extensions/feishu && openclaw gateway restart` 即可修复。

### 第一步：创建飞书应用 & 配置权限

如果已有飞书应用，可以沿用。如需新建：

1. 登录 [飞书开放平台](https://open.feishu.cn/app) → 创建企业自建应用
2. 添加**机器人**能力
3. 进入**权限管理** → **批量导入/导出权限** → 在"导入"页签粘贴官方提供的权限 JSON（见[官方文章](https://www.feishu.cn/content/article/7613711414611463386)中的完整权限列表）
4. **创建版本** → **发布**
5. 记下 **App ID** 和 **App Secret**

### 第二步：安装插件

在终端依次执行：

```bash
npm config set registry https://registry.npmjs.org

curl -o /tmp/feishu-openclaw-plugin-onboard-cli.tgz \
  https://sf3-cn.feishucdn.com/obj/open-platform-opendoc/4d184b1ba733bae2423a89e196a2ef8f_QATOjKH1WN.tgz

npm install /tmp/feishu-openclaw-plugin-onboard-cli.tgz -g

rm /tmp/feishu-openclaw-plugin-onboard-cli.tgz

feishu-plugin-onboard install
```

安装过程中会提示输入 App ID 和 App Secret（如果之前已关联飞书应用，可选沿用）。

### 第三步：启动 & 配置事件订阅

```bash
openclaw gateway run
```

看到日志中出现插件监听事件的提示，说明启动成功。

然后去飞书开放平台，配置**事件订阅**：
1. 选择**使用长连接接收事件**
2. 添加事件：`im.message.receive_v1`（接收消息）
3. **创建版本** → **发布**

### 第四步：配对 & 授权

1. 在飞书中给机器人发消息，获取配对码
2. 终端执行：`openclaw pairing approve feishu <配对码>`
3. 点击授权卡片完成 OAuth 授权（让 OpenClaw 能以你的身份操作飞书）

> 💡 也可以之后在对话框中输入 `/feishu auth` 批量完成授权。

---

## 验证安装

```bash
# 确认插件状态
openclaw plugins list
# feishu-openclaw-plugin → loaded
# feishu → disabled（内置插件已自动禁用）
```

在对话框中输入 `/feishu start`，返回版本号 = 安装成功 ✅

---

## 日常维护

| 操作 | 命令 |
|---|---|
| 更新插件 | `feishu-plugin-onboard update` |
| 检查配置 | `/feishu doctor`（对话框）或 `feishu-plugin-onboard doctor`（终端） |
| 自动修复 | `feishu-plugin-onboard doctor --fix` |
| 查看版本信息 | `feishu-plugin-onboard info` |
| 批量授权 | 对话框输入 `/feishu auth` |

---

## 常见问题

**Q: 安装后报 `cannot find module xxx`？**
进入插件安装目录，运行 `npm install` 补装依赖。

**Q: 如何开启流式输出？**
```bash
openclaw config set channels.feishu.streaming true
```

**Q: 之前装过飞书 MCP 怎么办？**
告诉你的 AI 助手"移除飞书 MCP"，避免功能冲突。

**Q: 升级 OpenClaw 后官方插件被覆盖了？**
升级 OpenClaw 后需要手动确认内置插件已禁用：`openclaw plugins list` 检查 `feishu` 是否 disabled。如果变回 loaded，重新运行 `feishu-plugin-onboard install`。

---

> 更多问题和详细排查，请参考[飞书官方文章](https://www.feishu.cn/content/article/7613711414611463386)或在本项目 [Issues](https://github.com/AlexAnys/openclaw-feishu/issues) 中反馈。
