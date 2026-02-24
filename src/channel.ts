/**
 * Feishu ChannelPlugin + ChannelDock — core channel integration.
 */

import type {
  ChannelAccountSnapshot,
  ChannelDock,
  ChannelPlugin,
  ClawdbotConfig,
} from "clawdbot/plugin-sdk";
import {
  applyAccountNameToChannelSection,
  DEFAULT_ACCOUNT_ID,
  deleteAccountFromConfigSection,
  formatPairingApproveHint,
  migrateBaseNameToDefaultAccount,
  normalizeAccountId,
  PAIRING_APPROVED_MESSAGE,
  setAccountEnabledInConfigSection,
} from "./sdk.js";

import {
  listFeishuAccountIds,
  resolveDefaultFeishuAccountId,
  resolveFeishuAccount,
} from "./accounts.js";
import type { ResolvedFeishuAccount } from "./types.js";
import { FeishuConfigJsonSchema } from "./config-json-schema.js";
import { feishuOnboardingAdapter } from "./onboarding.js";
import { probeFeishu } from "./probe.js";
import { sendTextMessage, sendMediaMessage } from "./send.js";
import { collectFeishuStatusIssues } from "./status-issues.js";
import { startFeishuProvider } from "./receive.js";

import * as Lark from "@larksuiteoapi/node-sdk";

const meta = {
  id: "feishu",
  label: "Feishu",
  selectionLabel: "Feishu (飞书)",
  docsPath: "/channels/feishu",
  docsLabel: "feishu",
  blurb: "Feishu (Lark) messaging platform with Bot WebSocket API.",
  aliases: ["lark", "fs"],
  order: 85,
  quickstartAllowFrom: true,
};

function normalizeFeishuMessagingTarget(raw: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^(feishu|lark|fs):/i, "");
}

/** Resolve the Lark SDK domain enum from our config value. */
function resolveLarkDomain(domain?: string): typeof Lark.Domain.Feishu | typeof Lark.Domain.Lark {
  return domain === "lark" ? Lark.Domain.Lark : Lark.Domain.Feishu;
}

/** Create a Feishu Lark.Client for an account. */
function createFeishuClient(account: ResolvedFeishuAccount): InstanceType<typeof Lark.Client> {
  return new Lark.Client({
    appId: account.appId,
    appSecret: account.appSecret,
    domain: resolveLarkDomain(account.config.domain),
    appType: Lark.AppType.SelfBuild,
  });
}

export const feishuDock: ChannelDock = {
  id: "feishu",
  capabilities: {
    chatTypes: ["direct", "group"],
    media: true,
    blockStreaming: true,
  },
  outbound: { textChunkLimit: 4000 },
  config: {
    resolveAllowFrom: ({ cfg, accountId }) =>
      (resolveFeishuAccount({ cfg: cfg as ClawdbotConfig, accountId }).config.allowFrom ?? []).map(
        (entry) => String(entry),
      ),
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .map((entry) => entry.replace(/^(feishu|lark|fs):/i, ""))
        .map((entry) => entry.toLowerCase()),
  },
  groups: {
    resolveRequireMention: () => true,
  },
  threading: {
    resolveReplyToMode: () => "off",
  },
};

export const feishuPlugin: ChannelPlugin<ResolvedFeishuAccount> = {
  id: "feishu",
  meta,
  onboarding: feishuOnboardingAdapter,
  capabilities: {
    chatTypes: ["direct", "group"],
    media: true,
    reactions: false,
    threads: false,
    polls: false,
    nativeCommands: false,
    blockStreaming: true,
  },
  reload: { configPrefixes: ["channels.feishu"] },
  configSchema: { schema: FeishuConfigJsonSchema },
  config: {
    listAccountIds: (cfg) => listFeishuAccountIds(cfg as ClawdbotConfig),
    resolveAccount: (cfg, accountId) =>
      resolveFeishuAccount({ cfg: cfg as ClawdbotConfig, accountId }),
    defaultAccountId: (cfg) => resolveDefaultFeishuAccountId(cfg as ClawdbotConfig),
    setAccountEnabled: ({ cfg, accountId, enabled }) =>
      setAccountEnabledInConfigSection({
        cfg: cfg as ClawdbotConfig,
        sectionKey: "feishu",
        accountId,
        enabled,
        allowTopLevel: true,
      }),
    deleteAccount: ({ cfg, accountId }) =>
      deleteAccountFromConfigSection({
        cfg: cfg as ClawdbotConfig,
        sectionKey: "feishu",
        accountId,
        clearBaseFields: ["appId", "appSecret", "name"],
      }),
    isConfigured: (account) => Boolean(account.appId?.trim() && account.appSecret?.trim()),
    describeAccount: (account): ChannelAccountSnapshot => ({
      accountId: account.accountId,
      name: account.name,
      enabled: account.enabled,
      configured: Boolean(account.appId?.trim() && account.appSecret?.trim()),
      tokenSource: account.tokenSource,
    }),
    resolveAllowFrom: ({ cfg, accountId }) =>
      (resolveFeishuAccount({ cfg: cfg as ClawdbotConfig, accountId }).config.allowFrom ?? []).map(
        (entry) => String(entry),
      ),
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .map((entry) => entry.replace(/^(feishu|lark|fs):/i, ""))
        .map((entry) => entry.toLowerCase()),
  },
  security: {
    resolveDmPolicy: ({ cfg, accountId, account }) => {
      const resolvedAccountId = accountId ?? account.accountId ?? DEFAULT_ACCOUNT_ID;
      const useAccountPath = Boolean(
        (cfg as ClawdbotConfig).channels?.feishu?.accounts?.[resolvedAccountId],
      );
      const basePath = useAccountPath
        ? `channels.feishu.accounts.${resolvedAccountId}.`
        : "channels.feishu.";
      return {
        policy: account.config.dmPolicy ?? "pairing",
        allowFrom: account.config.allowFrom ?? [],
        policyPath: `${basePath}dmPolicy`,
        allowFromPath: basePath,
        approveHint: formatPairingApproveHint("feishu"),
        normalizeEntry: (raw) => raw.replace(/^(feishu|lark|fs):/i, ""),
      };
    },
  },
  groups: {
    resolveRequireMention: () => true,
  },
  threading: {
    resolveReplyToMode: () => "off",
  },
  messaging: {
    normalizeTarget: normalizeFeishuMessagingTarget,
    targetResolver: {
      looksLikeId: (raw) => {
        const trimmed = raw.trim();
        if (!trimmed) return false;
        // Feishu chat IDs look like oc_xxxxx or ou_xxxxx
        return /^(oc|ou|on)_[a-f0-9]+$/i.test(trimmed) || /^[a-f0-9]{20,}$/i.test(trimmed);
      },
      hint: "<chatId>",
    },
  },
  directory: {
    self: async () => null,
    listPeers: async ({ cfg, accountId, query, limit }) => {
      const account = resolveFeishuAccount({ cfg: cfg as ClawdbotConfig, accountId });
      const q = query?.trim().toLowerCase() || "";
      const peers = Array.from(
        new Set(
          (account.config.allowFrom ?? [])
            .map((entry) => String(entry).trim())
            .filter((entry) => Boolean(entry) && entry !== "*")
            .map((entry) => entry.replace(/^(feishu|lark|fs):/i, "")),
        ),
      )
        .filter((id) => (q ? id.toLowerCase().includes(q) : true))
        .slice(0, limit && limit > 0 ? limit : undefined)
        .map((id) => ({ kind: "user", id }) as const);
      return peers;
    },
    listGroups: async () => [],
  },
  setup: {
    resolveAccountId: ({ accountId }) => normalizeAccountId(accountId),
    applyAccountName: ({ cfg, accountId, name }) =>
      applyAccountNameToChannelSection({
        cfg: cfg as ClawdbotConfig,
        channelKey: "feishu",
        accountId,
        name,
      }),
    validateInput: ({ accountId, input }) => {
      if (!input.appId && !input.appSecret) {
        return "Feishu requires appId and appSecret.";
      }
      return null;
    },
    applyAccountConfig: ({ cfg, accountId, input }) => {
      const namedConfig = applyAccountNameToChannelSection({
        cfg: cfg as ClawdbotConfig,
        channelKey: "feishu",
        accountId,
        name: input.name,
      });
      const next =
        accountId !== DEFAULT_ACCOUNT_ID
          ? migrateBaseNameToDefaultAccount({
              cfg: namedConfig,
              channelKey: "feishu",
            })
          : namedConfig;

      if (accountId === DEFAULT_ACCOUNT_ID) {
        return {
          ...next,
          channels: {
            ...next.channels,
            feishu: {
              ...next.channels?.feishu,
              enabled: true,
              ...(input.appId ? { appId: input.appId } : {}),
              ...(input.appSecret ? { appSecret: input.appSecret } : {}),
            },
          },
        } as ClawdbotConfig;
      }
      const feishuCfg = (next.channels?.feishu ?? {}) as Record<string, unknown>;
      const accountsCfg = (feishuCfg.accounts ?? {}) as Record<string, unknown>;
      const existingAccount = (accountsCfg[accountId] ?? {}) as Record<string, unknown>;
      return {
        ...next,
        channels: {
          ...((next.channels ?? {}) as Record<string, unknown>),
          feishu: {
            ...feishuCfg,
            enabled: true,
            accounts: {
              ...accountsCfg,
              [accountId]: {
                ...existingAccount,
                enabled: true,
                ...(input.appId ? { appId: input.appId } : {}),
                ...(input.appSecret ? { appSecret: input.appSecret } : {}),
              },
            },
          },
        },
      } as ClawdbotConfig;
    },
  },
  pairing: {
    idLabel: "feishuUserId",
    normalizeAllowEntry: (entry) => entry.replace(/^(feishu|lark|fs):/i, ""),
    notifyApproval: async ({ cfg, id }) => {
      const account = resolveFeishuAccount({ cfg: cfg as ClawdbotConfig });
      if (!account.appId || !account.appSecret) {
        throw new Error("Feishu credentials not configured");
      }
      const client = createFeishuClient(account);
      await sendTextMessage(client, id, PAIRING_APPROVED_MESSAGE);
    },
  },
  outbound: {
    deliveryMode: "direct",
    chunker: (text, limit) => {
      if (!text) return [];
      if (limit <= 0 || text.length <= limit) return [text];
      const chunks: string[] = [];
      let remaining = text;
      while (remaining.length > limit) {
        const window = remaining.slice(0, limit);
        const lastNewline = window.lastIndexOf("\n");
        const lastSpace = window.lastIndexOf(" ");
        let breakIdx = lastNewline > 0 ? lastNewline : lastSpace;
        if (breakIdx <= 0) breakIdx = limit;
        const rawChunk = remaining.slice(0, breakIdx);
        const chunk = rawChunk.trimEnd();
        if (chunk.length > 0) chunks.push(chunk);
        const brokeOnSeparator = breakIdx < remaining.length && /\s/.test(remaining[breakIdx]);
        const nextStart = Math.min(remaining.length, breakIdx + (brokeOnSeparator ? 1 : 0));
        remaining = remaining.slice(nextStart).trimStart();
      }
      if (remaining.length) chunks.push(remaining);
      return chunks;
    },
    chunkerMode: "text",
    textChunkLimit: 4000,
    sendText: async ({ to, text, accountId, cfg }) => {
      const account = resolveFeishuAccount({
        accountId: accountId ?? undefined,
        cfg: cfg as ClawdbotConfig,
      });
      if (!account.appId || !account.appSecret) {
        return { channel: "feishu", ok: false, messageId: "", error: new Error("Feishu credentials not configured") };
      }
      const client = createFeishuClient(account);
      const result = await sendTextMessage(client, to, text);
      return {
        channel: "feishu",
        ok: result.ok,
        messageId: result.messageId ?? "",
        error: result.error ? new Error(result.error) : undefined,
      };
    },
    sendMedia: async ({ to, text, mediaUrl, accountId, cfg }) => {
      const account = resolveFeishuAccount({
        accountId: accountId ?? undefined,
        cfg: cfg as ClawdbotConfig,
      });
      if (!account.appId || !account.appSecret) {
        return { channel: "feishu", ok: false, messageId: "", error: new Error("Feishu credentials not configured") };
      }
      const client = createFeishuClient(account);
      const result = await sendMediaMessage(client, to, mediaUrl ?? "", text);
      return {
        channel: "feishu",
        ok: result.ok,
        messageId: result.messageId ?? "",
        error: result.error ? new Error(result.error) : undefined,
      };
    },
  },
  status: {
    defaultRuntime: {
      accountId: DEFAULT_ACCOUNT_ID,
      running: false,
      lastStartAt: null,
      lastStopAt: null,
      lastError: null,
    },
    collectStatusIssues: collectFeishuStatusIssues,
    buildChannelSummary: ({ snapshot }) => ({
      configured: snapshot.configured ?? false,
      tokenSource: snapshot.tokenSource ?? "none",
      running: snapshot.running ?? false,
      mode: snapshot.mode ?? "websocket",
      lastStartAt: snapshot.lastStartAt ?? null,
      lastStopAt: snapshot.lastStopAt ?? null,
      lastError: snapshot.lastError ?? null,
      probe: snapshot.probe,
      lastProbeAt: snapshot.lastProbeAt ?? null,
    }),
    probeAccount: async ({ account, timeoutMs }) =>
      probeFeishu(account.appId, account.appSecret, timeoutMs, account.config.domain),
    buildAccountSnapshot: ({ account, runtime }) => {
      const configured = Boolean(account.appId?.trim() && account.appSecret?.trim());
      return {
        accountId: account.accountId,
        name: account.name,
        enabled: account.enabled,
        configured,
        tokenSource: account.tokenSource,
        running: runtime?.running ?? false,
        lastStartAt: runtime?.lastStartAt ?? null,
        lastStopAt: runtime?.lastStopAt ?? null,
        lastError: runtime?.lastError ?? null,
        mode: account.config.connectionMode ?? "websocket",
        domain: account.config.domain ?? "feishu",
        lastInboundAt: runtime?.lastInboundAt ?? null,
        lastOutboundAt: runtime?.lastOutboundAt ?? null,
        dmPolicy: account.config.dmPolicy ?? "pairing",
        appId: account.appId ? `${account.appId.slice(0, 8)}...` : undefined,
      };
    },
  },
  gateway: {
    startAccount: async (ctx) => {
      const account = ctx.account;
      let feishuBotLabel = "";

      try {
        const probe = await probeFeishu(account.appId, account.appSecret, 3000, account.config.domain);
        const name = probe.ok ? probe.bot?.name?.trim() : null;
        if (name) feishuBotLabel = ` (${name})`;
        ctx.setStatus({ accountId: account.accountId, bot: probe.bot });
      } catch {
        // Ignore probe errors during startup
      }

      ctx.log?.info(
        `[${account.accountId}] Starting Feishu provider${feishuBotLabel}`,
      );

      const provider = startFeishuProvider({
        account,
        config: ctx.cfg as ClawdbotConfig,
        log: {
          info: (msg) => ctx.log?.info(msg),
          error: (msg) => ctx.log?.error(msg),
        },
        abortSignal: ctx.abortSignal,
        statusSink: (patch) =>
          ctx.setStatus({ accountId: ctx.accountId, ...patch }),
      });

      return provider;
    },
  },
};
