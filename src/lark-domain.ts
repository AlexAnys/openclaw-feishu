/**
 * Shared Lark SDK domain resolver.
 */

import * as Lark from "@larksuiteoapi/node-sdk";
import type { FeishuDomain } from "./types.js";

/** Resolve the Lark SDK domain enum from our config string. */
export function resolveLarkDomain(domain?: FeishuDomain | string): typeof Lark.Domain.Feishu | typeof Lark.Domain.Lark {
  return domain === "lark" ? Lark.Domain.Lark : Lark.Domain.Feishu;
}
