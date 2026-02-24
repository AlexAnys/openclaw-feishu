/**
 * Feishu channel plugin — type definitions.
 */

/** Feishu/Lark domain. "feishu" = 国内版, "lark" = 国际版. */
export type FeishuDomain = "feishu" | "lark";

/** Connection mode. "websocket" = long connection (feishu only), "webhook" = HTTP callback. */
export type FeishuConnectionMode = "websocket" | "webhook";

/** Per-account configuration stored in clawdbot.json channels.feishu */
export type FeishuAccountConfig = {
  /** Optional display name for this account. */
  name?: string;
  /** If false, do not start this Feishu account. Default: true. */
  enabled?: boolean;
  /** Feishu App ID (cli_xxx). */
  appId?: string;
  /** Feishu App Secret. */
  appSecret?: string;
  /** Feishu/Lark domain. Default: "feishu". */
  domain?: FeishuDomain;
  /** Connection mode. Default: "websocket". Lark requires "webhook". */
  connectionMode?: FeishuConnectionMode;
  /** Webhook server port (only for webhook mode). Default: 3000. */
  webhookPort?: number;
  /** Webhook URL path (only for webhook mode). Default: "/feishu/events". */
  webhookPath?: string;
  /** Encrypt key for webhook event verification (optional). */
  encryptKey?: string;
  /** Verification token for webhook event verification (optional). */
  verificationToken?: string;
  /** Direct message access policy (default: pairing). */
  dmPolicy?: "pairing" | "allowlist" | "open" | "disabled";
  /** Allowlist for DM senders (Feishu open_id or union_id). */
  allowFrom?: Array<string | number>;
  /** "Thinking…" placeholder threshold in milliseconds. 0 to disable. */
  thinkingThresholdMs?: number;
  /** Bot name aliases used for group-chat address detection. */
  botNames?: string[];
  /** Max inbound media size in MB. */
  mediaMaxMb?: number;
};

/** Top-level Feishu config section (channels.feishu). */
export type FeishuConfig = {
  /** Multi-account map. */
  accounts?: Record<string, FeishuAccountConfig>;
  /** Default account ID when multiple accounts exist. */
  defaultAccount?: string;
} & FeishuAccountConfig;

/** How the appId/appSecret were resolved. */
export type FeishuTokenSource = "config" | "plugin" | "none";

/** Resolved account ready for use. */
export type ResolvedFeishuAccount = {
  accountId: string;
  name?: string;
  enabled: boolean;
  appId: string;
  appSecret: string;
  tokenSource: FeishuTokenSource;
  config: FeishuAccountConfig;
};

/** Result of sending a message via Feishu API. */
export type FeishuSendResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
};

/** Feishu probe result. */
export type FeishuProbeResult = {
  ok: boolean;
  bot?: { name?: string; openId?: string };
  error?: string;
  elapsedMs: number;
};

/** Media type classification. */
export type FeishuMediaType = "image" | "video" | "audio" | "file";
