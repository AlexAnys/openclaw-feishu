/**
 * Feishu (Lark) channel plugin for Clawdbot/OpenClaw.
 *
 * Connects Feishu bots via WebSocket long-connection (no public server required).
 */

import type { ClawdbotPluginApi } from "clawdbot/plugin-sdk";

import { emptyPluginConfigSchema } from "./src/sdk-compat.js";

import { feishuDock, feishuPlugin } from "./src/channel.js";
import { setFeishuRuntime } from "./src/runtime.js";

const plugin = {
  id: "feishu",
  name: "Feishu",
  description: "Feishu (Lark) channel plugin — WebSocket long-connection bot",

  // This plugin registers a channel whose config lives under channels.feishu.*.
  // Plugin-level config (plugins.entries.*.config) is intentionally empty.
  configSchema: emptyPluginConfigSchema(),

  register(api: ClawdbotPluginApi) {
    setFeishuRuntime(api.runtime);
    api.registerChannel({ plugin: feishuPlugin, dock: feishuDock });
  },
};

export default plugin;
