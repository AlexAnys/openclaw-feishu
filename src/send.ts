/**
 * Send messages to Feishu — text and media.
 */

import type * as Lark from "@larksuiteoapi/node-sdk";

import type { FeishuSendResult } from "./types.js";
import {
  cleanupTemp,
  downloadToTempFile,
  getFileExtension,
  getMediaType,
  uploadFile,
  uploadImage,
} from "./media.js";

/** Resolve the correct receive_id_type based on ID prefix. */
function resolveReceiveIdType(id: string): "chat_id" | "open_id" | "union_id" {
  if (id.startsWith("ou_")) return "open_id";
  if (id.startsWith("on_")) return "union_id";
  return "chat_id";
}

/**
 * Send a text message to a Feishu chat.
 */
export async function sendTextMessage(
  client: InstanceType<typeof Lark.Client>,
  chatId: string,
  text: string,
  replyToId?: string,
): Promise<FeishuSendResult> {
  if (!chatId?.trim()) {
    return { ok: false, error: "No chat_id provided" };
  }

  try {
    if (replyToId) {
      const res = await client.im.message.reply({
        path: { message_id: replyToId },
        data: {
          content: JSON.stringify({ text }),
          msg_type: "text",
        },
      });
      return { ok: true, messageId: res?.data?.message_id ?? "" };
    }

    const res = await client.im.message.create({
      params: { receive_id_type: resolveReceiveIdType(chatId.trim()) },
      data: {
        receive_id: chatId.trim(),
        msg_type: "text",
        content: JSON.stringify({ text }),
      },
    });
    return { ok: true, messageId: res?.data?.message_id ?? "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send a media message (image, video, audio, or file) to a Feishu chat.
 * Falls back to text + URL on failure.
 */
export async function sendMediaMessage(
  client: InstanceType<typeof Lark.Client>,
  chatId: string,
  mediaUrl: string,
  text?: string,
  replyToId?: string,
): Promise<FeishuSendResult> {
  if (!chatId?.trim()) {
    return { ok: false, error: "No chat_id provided" };
  }
  if (!mediaUrl?.trim()) {
    return { ok: false, error: "No media URL provided" };
  }

  let tempPath: string | null = null;
  let isTemp = false;

  try {
    const downloaded = await downloadToTempFile(mediaUrl);
    tempPath = downloaded.path;
    isTemp = downloaded.isTemp;

    const mediaType = getMediaType(mediaUrl);
    const extension = getFileExtension(mediaUrl);
    const filename = `file_${Date.now()}.${extension}`;

    let msgType: string;
    let content: string;

    if (mediaType === "image") {
      const imageKey = await uploadImage(client, tempPath);
      msgType = "image";
      content = JSON.stringify({ image_key: imageKey });
    } else if (mediaType === "video") {
      const fileKey = await uploadFile(client, tempPath, filename, "mp4");
      msgType = "media";
      const mediaContent: Record<string, unknown> = { file_key: fileKey };
      content = JSON.stringify(mediaContent);
    } else if (mediaType === "audio") {
      const fileKey = await uploadFile(client, tempPath, filename, "opus");
      msgType = "audio";
      content = JSON.stringify({ file_key: fileKey });
    } else {
      const fileKey = await uploadFile(client, tempPath, filename, "stream");
      msgType = "file";
      content = JSON.stringify({ file_key: fileKey });
    }

    // Send the media message
    if (replyToId) {
      await client.im.message.reply({
        path: { message_id: replyToId },
        data: { content, msg_type: msgType },
      });
    } else {
      await client.im.message.create({
        params: { receive_id_type: resolveReceiveIdType(chatId.trim()) },
        data: { receive_id: chatId.trim(), content, msg_type: msgType },
      });
    }

    // Send accompanying text as separate message if provided
    if (text?.trim()) {
      await client.im.message.create({
        params: { receive_id_type: resolveReceiveIdType(chatId.trim()) },
        data: {
          receive_id: chatId.trim(),
          content: JSON.stringify({ text }),
          msg_type: "text",
        },
      });
    }

    return { ok: true };
  } catch (err) {
    // Fallback: send as text with URL
    try {
      const fallbackText = text ? `${text}\n${mediaUrl}` : mediaUrl;
      const res = await client.im.message.create({
        params: { receive_id_type: resolveReceiveIdType(chatId.trim()) },
        data: {
          receive_id: chatId.trim(),
          content: JSON.stringify({ text: fallbackText }),
          msg_type: "text",
        },
      });
      return { ok: true, messageId: res?.data?.message_id ?? "" };
    } catch (fallbackErr) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  } finally {
    if (tempPath) cleanupTemp(tempPath, isTemp);
  }
}

/**
 * Update an existing message (e.g., replace "Thinking…" placeholder).
 */
export async function updateMessage(
  client: InstanceType<typeof Lark.Client>,
  messageId: string,
  text: string,
): Promise<FeishuSendResult> {
  try {
    await client.im.message.update({
      path: { message_id: messageId },
      data: {
        msg_type: "text",
        content: JSON.stringify({ text }),
      },
    });
    return { ok: true, messageId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Delete a message (e.g., remove "Thinking…" placeholder).
 */
export async function deleteMessage(
  client: InstanceType<typeof Lark.Client>,
  messageId: string,
): Promise<void> {
  try {
    await client.im.message.delete({ path: { message_id: messageId } });
  } catch {
    // Best-effort cleanup
  }
}
