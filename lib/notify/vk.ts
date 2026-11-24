/**
 * Отправка сообщений во ВКонтакте от имени сообщества магазина.
 *
 * Настройка (переменные окружения, см. docs/env.md):
 *   VK_GROUP_TOKEN — ключ доступа сообщества с правом «Сообщения сообщества»;
 *   VK_PEER_IDS    — кому слать, через запятую: id беседы (2000000001, …) и/или
 *                    id пользователей. Узнать: node scripts/vk-setup.mjs
 *
 * Серверы ВКонтакте находятся в РФ, но мы всё равно отправляем ТОЛЬКО обезличенные
 * сводки (решение заказчика, 24.11.2026): контакты покупателя — по ссылке на наш сайт.
 *
 * Ошибки отправки не роняют оформление заказа: пишем в лог и идём дальше.
 */
import { randomInt } from "crypto";

const VK_API_VERSION = "5.199";

export async function sendVkMessage(text: string): Promise<void> {
  const token = process.env.VK_GROUP_TOKEN;
  const peers = (process.env.VK_PEER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!token || peers.length === 0) {
    console.error("VK: не заданы VK_GROUP_TOKEN / VK_PEER_IDS — уведомление не отправлено.");
    return;
  }

  const apiBase = (process.env.VK_API_BASE || "https://api.vk.com/method").replace(/\/+$/, "");

  await Promise.all(
    peers.map(async (peer) => {
      const body = new URLSearchParams({
        access_token: token,
        v: VK_API_VERSION,
        peer_id: peer,
        random_id: String(randomInt(1, 2_147_483_647)), // защита ВК от дублей
        message: text,
        dont_parse_links: "1", // без превью ссылки: ВК не будет сам открывать нашу страницу
        disable_mentions: "1",
      });
      try {
        const res = await fetch(`${apiBase}/messages.send`, {
          method: "POST",
          body,
          signal: AbortSignal.timeout(10_000),
        });
        const json = (await res.json()) as { error?: { error_code: number; error_msg: string } };
        if (json.error) {
          console.error(`VK: ошибка отправки в ${peer}: ${json.error.error_code} ${json.error.error_msg}`);
        }
      } catch (e) {
        console.error(`VK: не удалось отправить в ${peer}:`, e instanceof Error ? e.message : e);
      }
    }),
  );
}
