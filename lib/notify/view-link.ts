/**
 * Ссылки «без пароля» на 4 часа: из уведомления во ВКонтакте сразу открыть
 * заказ или сертификат с контактами покупателя, не входя в админку.
 *
 * Безопасность:
 *   - ссылка — это подписанный токен (JWT, HS256) с видом объекта, его id и сроком 4 часа;
 *     подделать или продлить её без секрета сервера нельзя;
 *   - ключ подписи ОТДЕЛЬНЫЙ от ключа админ-сессии (выводится из JWT_SECRET через HMAC
 *     с другой «солью»), поэтому такой токен нельзя подставить вместо cookie админки —
 *     он даёт доступ ТОЛЬКО к просмотру одного конкретного заказа/сертификата;
 *   - страница по ссылке только показывает данные (ничего не меняет), закрыта от
 *     индексации и не кэшируется; превью ссылки во ВКонтакте отключено (dont_parse_links).
 *
 * Персональные данные по-прежнему не покидают наш сервер: во ВКонтакте уходит только
 * обезличенная сводка и сама ссылка.
 */
import { createHmac } from "crypto";
import { SignJWT, jwtVerify, errors } from "jose";

export type ViewLinkKind = "order" | "cert";

/** Сколько живёт ссылка (просьба заказчика: 4 часа). */
export const VIEW_LINK_TTL_HOURS = 4;

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://fourkings.ru").replace(/\/+$/, "");
}

function linkKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET не задан или короче 32 символов");
  }
  // Отдельный ключ только для ссылок просмотра — не совпадает с ключом админ-сессии.
  return new Uint8Array(createHmac("sha256", secret).update("four-kings:view-link:v1").digest());
}

/** Полный URL вида https://fourkings.ru/o/<токен> */
export async function createViewLink(kind: ViewLinkKind, id: string): Promise<string> {
  const token = await new SignJWT({ k: kind, id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${VIEW_LINK_TTL_HOURS}h`)
    .sign(linkKey());
  return `${siteUrl()}/o/${token}`;
}

export type ViewLinkCheck =
  | { status: "ok"; kind: ViewLinkKind; id: string; expiresAt: Date }
  | { status: "expired" }
  | { status: "invalid" };

export async function verifyViewLink(token: string): Promise<ViewLinkCheck> {
  try {
    const { payload } = await jwtVerify(token, linkKey(), { algorithms: ["HS256"] });
    const kind = payload.k;
    const id = payload.id;
    if ((kind === "order" || kind === "cert") && typeof id === "string" && id.length > 0 && payload.exp) {
      return { status: "ok", kind, id, expiresAt: new Date(payload.exp * 1000) };
    }
    return { status: "invalid" };
  } catch (e) {
    if (e instanceof errors.JWTExpired) return { status: "expired" };
    return { status: "invalid" };
  }
}
