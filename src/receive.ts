/**
 * Feishu message receive handler.
 *
 * Supports two connection modes:
 * - WebSocket: SDK's WSClient long connection (feishu only, default)
 * - Webhook: HTTP server for event callbacks (required for Lark)
 */

import * as Lark from "@larksuiteoapi/node-sdk";
import * as http from "http";
import type { ClawdbotConfig } from "clawdbot/plugin-sdk";

import type { ResolvedFeishuAccount } from "./types.js";
import { isDuplicate } from "./dedup.js";
import { shouldRespondInGroup } from "./group-filter.js";
import { sendTextMessage, updateMessage, deleteMessage } from "./send.js";
import { sendMediaMessage } from "./send.js";
import { getFeishuRuntime } from "./runtime.js";

/** Options for the Feishu provider. */
export type FeishuProviderOptions = {
  account: ResolvedFeishuAccount;
  config: ClawdbotConfig;
  log: {
    info: (msg: string) => void;
    error: (msg: string) => void;
    debug?: (msg: string) => void;
  };
  abortSignal?: AbortSignal;
  statusSink?: (patch: Record<string, unknown>) => void;
};

/** Resolve the Lark SDK domain from config. */
function resolveLarkDomain(domain?: string): typeof Lark.Domain.Feishu | typeof Lark.Domain.Lark {
  return domain === "lark" ? Lark.Domain.Lark : Lark.Domain.Feishu;
}

/** Start the Feishu provider (WebSocket or Webhook). Returns a stop function. */
export function startFeishuProvider(options: FeishuProviderOptions): { stop: () => void } {
  const { account, config, log, statusSink } = options;
  const { appId, appSecret } = account;
  const thinkingThresholdMs = account.config.thinkingThresholdMs ?? 2500;
  const botNames = account.config.botNames;
  const connectionMode = account.config.connectionMode ?? "websocket";
  const domain = account.config.domain ?? "feishu";

  log.info(`[feishu:${account.accountId}] Starting ${connectionMode} provider (appId=${appId}, domain=${domain})`);

  const sdkDomain = resolveLarkDomain(domain);

  const sdkConfig = {
    appId,
    appSecret,
    domain: sdkDomain,
    appType: Lark.AppType.SelfBuild,
  };

  const client = new Lark.Client(sdkConfig);

  const messageHandler = async (data: Record<string, unknown>) => {
    try {
      await handleIncomingMessage(data, {
        client,
        account,
        config,
        log,
        thinkingThresholdMs,
        botNames,
        statusSink,
      });
    } catch (err) {
      log.error(
        `[feishu:${account.accountId}] Message handler error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const dispatcher = new Lark.EventDispatcher({
    encryptKey: account.config.encryptKey || undefined,
    verificationToken: account.config.verificationToken || undefined,
  }).register({
    "im.message.receive_v1": messageHandler,
  });

  if (connectionMode === "webhook") {
    return startWebhookProvider({ account, dispatcher, log, statusSink });
  }

  // Default: WebSocket mode
  const wsClient = new Lark.WSClient({
    ...sdkConfig,
    loggerLevel: Lark.LoggerLevel.info,
  });

  wsClient.start({ eventDispatcher: dispatcher });

  log.info(`[feishu:${account.accountId}] WebSocket client started`);
  statusSink?.({ running: true, lastStartAt: Date.now(), mode: "websocket" });

  const stop = () => {
    log.info(`[feishu:${account.accountId}] Stopping WebSocket provider`);
    // Lark SDK WSClient doesn't expose a clean stop method;
    // rely on abort signal and GC.
    statusSink?.({ running: false, lastStopAt: Date.now() });
  };

  return { stop };
}

/** Start the Webhook HTTP server for receiving Lark/Feishu event callbacks. */
function startWebhookProvider(opts: {
  account: ResolvedFeishuAccount;
  dispatcher: Lark.EventDispatcher;
  log: FeishuProviderOptions["log"];
  statusSink?: (patch: Record<string, unknown>) => void;
}): { stop: () => void } {
  const { account, dispatcher, log, statusSink } = opts;
  const port = account.config.webhookPort ?? 3000;
  const webhookPath = account.config.webhookPath ?? "/feishu/events";

  const webhookHandler = Lark.adaptDefault(webhookPath, dispatcher, { autoChallenge: true });
  const server = http.createServer((req, res) => {
    Promise.resolve(webhookHandler(req, res)).catch((err) => {
      log.error(
        `[feishu:${account.accountId}] Webhook handler error: ${err instanceof Error ? err.message : String(err)}`,
      );
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    });
  });

  server.listen(port, () => {
    log.info(`[feishu:${account.accountId}] Webhook server listening on port ${port}, path ${webhookPath}`);
    statusSink?.({ running: true, lastStartAt: Date.now(), mode: "webhook" });
  });

  server.on("error", (err) => {
    log.error(`[feishu:${account.accountId}] Webhook server error: ${err.message}`);
    statusSink?.({ running: false, lastError: err.message });
  });

  const stop = () => {
    log.info(`[feishu:${account.accountId}] Stopping Webhook server`);
    server.close();
    statusSink?.({ running: false, lastStopAt: Date.now() });
  };

  return { stop };
}

/** Internal handler context. */
type MessageHandlerContext = {
  client: InstanceType<typeof Lark.Client>;
  account: ResolvedFeishuAccount;
  config: ClawdbotConfig;
  log: FeishuProviderOptions["log"];
  thinkingThresholdMs: number;
  botNames?: string[];
  statusSink?: (patch: Record<string, unknown>) => void;
};

/** Handle a single incoming Feishu message event. */
async function handleIncomingMessage(
  data: Record<string, unknown>,
  ctx: MessageHandlerContext,
): Promise<void> {
  const message = (data as { message?: Record<string, unknown> }).message;
  if (!message) return;

  const chatId = message.chat_id as string | undefined;
  if (!chatId) return;

  const messageId = message.message_id as string | undefined;
  if (isDuplicate(messageId)) return;

  // Only handle text messages for now
  const messageType = message.message_type as string | undefined;
  if (messageType !== "text" || !message.content) return;

  let text: string;
  try {
    const parsed = JSON.parse(message.content as string) as { text?: string };
    text = (parsed.text ?? "").trim();
  } catch {
    return;
  }
  if (!text) return;

  const chatType = message.chat_type as string | undefined;
  const sender = (data as { sender?: { sender_id?: { open_id?: string } } }).sender;
  const senderId = sender?.sender_id?.open_id ?? "";

  // Group chat: check filter
  if (chatType === "group") {
    const mentions = Array.isArray(message.mentions) ? (message.mentions as unknown[]) : [];
    text = text.replace(/@_user_\d+\s*/g, "").trim();
    if (!text || !shouldRespondInGroup(text, mentions, ctx.botNames)) return;
  }

  ctx.statusSink?.({ lastInboundAt: Date.now() });

  const sessionKey = `feishu:${chatType === "p2p" ? senderId : chatId}`;

  ctx.log.info(`[feishu:${ctx.account.accountId}] Received from ${senderId}: ${text.slice(0, 80)}`);

  // Dispatch via Clawdbot runtime
  const runtime = getFeishuRuntime();
  const channel = (runtime as Record<string, unknown>).channel as
    | { reply?: { dispatchReplyWithBufferedBlockDispatcher?: (opts: unknown) => Promise<unknown> } }
    | undefined;

  if (!channel?.reply?.dispatchReplyWithBufferedBlockDispatcher) {
    ctx.log.error(`[feishu:${ctx.account.accountId}] dispatchReplyWithBufferedBlockDispatcher not available`);
    return;
  }

  // Build inbound context
  const inboundCtx = {
    Body: text,
    RawBody: text,
    CommandBody: text,
    From: senderId,
    To: chatId,
    SessionKey: sessionKey,
    AccountId: ctx.account.accountId,
    MessageSid: messageId,
    ChatType: chatType === "p2p" ? "direct" : "group",
    ConversationLabel: chatId,
    SenderId: senderId,
    CommandAuthorized: true,
    Provider: "feishu",
    Surface: "feishu",
    OriginatingChannel: "feishu",
    OriginatingTo: chatId,
    DeliveryContext: {
      channel: "feishu",
      to: chatId,
      accountId: ctx.account.accountId,
    },
  };

  // "Thinking…" placeholder logic
  let placeholderId = "";
  let done = false;
  const timer =
    ctx.thinkingThresholdMs > 0
      ? setTimeout(async () => {
          if (done) return;
          try {
            const res = await ctx.client.im.message.create({
              params: { receive_id_type: "chat_id" },
              data: {
                receive_id: chatId,
                msg_type: "text",
                content: JSON.stringify({ text: "正在思考…" }),
              },
            });
            placeholderId = res?.data?.message_id ?? "";
          } catch {
            // Ignore placeholder failures
          }
        }, ctx.thinkingThresholdMs)
      : null;

  try {
    await channel.reply.dispatchReplyWithBufferedBlockDispatcher({
      ctx: inboundCtx,
      cfg: (runtime as { config?: { loadConfig?: () => ClawdbotConfig } }).config?.loadConfig?.() ?? ctx.config,
      replyResolver: null,
      dispatcherOptions: {
        deliver: async (payload: unknown) => {
          done = true;
          if (timer) clearTimeout(timer);

          const p = payload as { text?: string; body?: string; mediaUrl?: string; mediaUrls?: string[] } | string;
          const replyText = typeof p === "string" ? p : (p?.text ?? p?.body ?? "");
          const mediaUrl = typeof p === "string" ? undefined : (p?.mediaUrl ?? p?.mediaUrls?.[0]);

          // Skip empty / NO_REPLY
          const trimmed = (replyText || "").trim();
          if ((!trimmed || trimmed === "NO_REPLY" || trimmed.endsWith("NO_REPLY")) && !mediaUrl) {
            if (placeholderId) await deleteMessage(ctx.client, placeholderId);
            return;
          }

          ctx.statusSink?.({ lastOutboundAt: Date.now() });

          try {
            if (mediaUrl) {
              if (placeholderId) {
                await deleteMessage(ctx.client, placeholderId);
                placeholderId = "";
              }
              await sendMediaMessage(ctx.client, chatId, mediaUrl, replyText);
            } else if (placeholderId) {
              // Update the "Thinking…" placeholder
              await updateMessage(ctx.client, placeholderId, replyText);
              placeholderId = "";
            } else {
              await sendTextMessage(ctx.client, chatId, replyText);
            }
          } catch (err) {
            ctx.log.error(
              `[feishu:${ctx.account.accountId}] Failed to send reply: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        },
        onError: (err: Error) => {
          done = true;
          if (timer) clearTimeout(timer);
          ctx.log.error(`[feishu:${ctx.account.accountId}] Dispatcher error: ${err.message}`);
          // Clean up placeholder
          if (placeholderId) {
            deleteMessage(ctx.client, placeholderId).catch(() => {});
          }
        },
      },
    });
  } catch (err) {
    done = true;
    if (timer) clearTimeout(timer);
    ctx.log.error(
      `[feishu:${ctx.account.accountId}] Dispatch error: ${err instanceof Error ? err.message : String(err)}`,
    );
    if (placeholderId) {
      await deleteMessage(ctx.client, placeholderId);
    }
  }
}

// For tests only: allow unit/integration tests to call internal logic without starting a real WS client.
// This is intentionally not part of the public plugin API.
export const __internal = {
  handleIncomingMessage,
};
