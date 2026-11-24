#!/usr/bin/env node
/**
 * Помощник настройки уведомлений во ВКонтакте. Запуск на сервере из папки проекта:
 *
 *   node scripts/vk-setup.mjs          — проверить ключ и показать беседы/диалоги сообщества
 *                                        с их номерами (peer_id) для VK_PEER_IDS
 *   node scripts/vk-setup.mjs --test   — отправить пробное сообщение во все VK_PEER_IDS
 *
 * Берёт VK_GROUP_TOKEN и VK_PEER_IDS из переменных окружения или из файла .env
 * в текущей папке. Ключ на экран не выводит.
 */
import fs from "node:fs";

function readEnvFile() {
  const out = {};
  if (!fs.existsSync(".env")) return out;
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(VK_[A-Z_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const fileEnv = readEnvFile();
const env = (k) => process.env[k] || fileEnv[k] || "";
const token = env("VK_GROUP_TOKEN");
const peers = env("VK_PEER_IDS").split(",").map((s) => s.trim()).filter(Boolean);
const apiBase = (env("VK_API_BASE") || "https://api.vk.com/method").replace(/\/+$/, "");

async function vk(method, params) {
  const body = new URLSearchParams({ access_token: token, v: "5.199", ...params });
  const res = await fetch(`${apiBase}/${method}`, { method: "POST", body, signal: AbortSignal.timeout(15000) });
  const json = await res.json();
  if (json.error) throw new Error(`${json.error.error_code}: ${json.error.error_msg}`);
  return json.response;
}

async function main() {
  if (!token) {
    console.error("Не задан VK_GROUP_TOKEN (в .env или в окружении). См. docs/env.md.");
    process.exit(1);
  }

  if (process.argv.includes("--test")) {
    if (peers.length === 0) {
      console.error("Не задан VK_PEER_IDS. Сначала запустите без --test и возьмите номер беседы.");
      process.exit(1);
    }
    for (const peer of peers) {
      try {
        await vk("messages.send", {
          peer_id: peer,
          random_id: String(Math.floor(Math.random() * 2_000_000_000) + 1),
          message: "✅ Проверка: уведомления сайта Four Kings работают.",
          dont_parse_links: "1",
        });
        console.log(`✓ отправлено в ${peer}`);
      } catch (e) {
        console.error(`✗ ${peer}: ${e.message}`);
        process.exitCode = 1;
      }
    }
    return;
  }

  const groups = await vk("groups.getById", {});
  const group = (groups.groups || groups)[0];
  console.log(`Ключ рабочий. Сообщество: «${group.name}» (id ${group.id})\n`);

  const conv = await vk("messages.getConversations", { count: "50", extended: "1" });
  const names = new Map((conv.profiles || []).map((p) => [p.id, `${p.first_name} ${p.last_name}`]));
  if (!conv.items.length) {
    console.log("Диалогов пока нет. Добавьте сообщество в беседу (или напишите сообществу) и запустите снова.");
    return;
  }
  console.log("peer_id       тип       название");
  for (const { conversation: c } of conv.items) {
    const id = c.peer.id;
    const type = c.peer.type === "chat" ? "беседа" : c.peer.type === "user" ? "человек" : c.peer.type;
    const title = c.chat_settings?.title || names.get(id) || "";
    console.log(`${String(id).padEnd(13)} ${type.padEnd(9)} ${title}`);
  }
  console.log("\nНужный номер (или несколько через запятую) впишите в .env: VK_PEER_IDS=2000000001");
  if (peers.length) console.log(`Сейчас в VK_PEER_IDS: ${peers.join(", ")}`);
}

main().catch((e) => {
  console.error("Ошибка:", e.message);
  process.exit(1);
});
