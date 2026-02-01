/**
 * Feishu API connectivity probe.
 *
 * Validates credentials by fetching a tenant_access_token.
 */

import type { FeishuProbeResult } from "./types.js";

/**
 * Probe the Feishu API by fetching tenant_access_token.
 * This is the standard way to validate appId + appSecret.
 */
export async function probeFeishu(
  appId: string,
  appSecret: string,
  timeoutMs = 5000,
): Promise<FeishuProbeResult> {
  if (!appId?.trim() || !appSecret?.trim()) {
    return { ok: false, error: "Missing appId or appSecret", elapsedMs: 0 };
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Use the internal tenant_access_token endpoint to validate credentials
    const response = await fetch(
      "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: appId.trim(),
          app_secret: appSecret.trim(),
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);
    const elapsedMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        elapsedMs,
      };
    }

    const data = (await response.json()) as {
      code?: number;
      msg?: string;
      tenant_access_token?: string;
      expire?: number;
    };

    if (data.code !== 0) {
      return {
        ok: false,
        error: data.msg || `API error code: ${data.code}`,
        elapsedMs,
      };
    }

    // Credentials are valid if we got a token
    return {
      ok: true,
      elapsedMs,
      // Note: We don't have bot info from this endpoint,
      // but credentials are verified
    };
  } catch (err) {
    clearTimeout(timeout);
    const elapsedMs = Date.now() - startTime;

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return { ok: false, error: `Request timed out after ${timeoutMs}ms`, elapsedMs };
      }
      return { ok: false, error: err.message, elapsedMs };
    }

    return { ok: false, error: String(err), elapsedMs };
  }
}
