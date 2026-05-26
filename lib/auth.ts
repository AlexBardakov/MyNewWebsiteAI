// lib/auth.ts
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

// Жёсткое требование: JWT_SECRET ОБЯЗАН быть задан в env.
// Раньше здесь был fallback `|| "default-secret"`, при котором отсутствие переменной
// приводило к тихой компрометации админки (любой мог подписать токен «default-secret»).
// Теперь — fail fast при старте процесса: лучше не запуститься, чем работать дырявым.
const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    "JWT_SECRET не задан или короче 32 символов. " +
    "Задайте надёжный секрет в переменных окружения перед запуском приложения."
  );
}
const SECRET_KEY = new TextEncoder().encode(rawSecret);

export async function signSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h") // Сессия живет 24 часа
    .sign(SECRET_KEY);

  return token;
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}