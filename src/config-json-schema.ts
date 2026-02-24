/**
 * Feishu config JSON Schema for Clawdbot plugin validation.
 * This avoids Zod instance compatibility issues between plugin and host.
 */

const feishuAccountJsonSchema = {
  type: "object" as const,
  properties: {
    name: { type: "string" as const },
    enabled: { type: "boolean" as const },
    appId: { type: "string" as const },
    appSecret: { type: "string" as const },
    domain: {
      type: "string" as const,
      enum: ["feishu", "lark"],
      description: "feishu = 国内版 (default), lark = 国际版",
    },
    connectionMode: {
      type: "string" as const,
      enum: ["websocket", "webhook"],
      description: "websocket = long connection (default, feishu only), webhook = HTTP callback (required for Lark)",
    },
    webhookPort: { type: "number" as const },
    webhookPath: { type: "string" as const },
    encryptKey: { type: "string" as const },
    verificationToken: { type: "string" as const },
    dmPolicy: {
      type: "string" as const,
      enum: ["pairing", "allowlist", "open", "disabled"],
    },
    allowFrom: {
      type: "array" as const,
      items: { oneOf: [{ type: "string" as const }, { type: "number" as const }] },
    },
    thinkingThresholdMs: { type: "number" as const },
    botNames: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    mediaMaxMb: { type: "number" as const },
  },
  additionalProperties: true,
};

export const FeishuConfigJsonSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  type: "object" as const,
  properties: {
    ...feishuAccountJsonSchema.properties,
    accounts: {
      type: "object" as const,
      additionalProperties: feishuAccountJsonSchema,
    },
    defaultAccount: { type: "string" as const },
  },
  additionalProperties: true,
};
