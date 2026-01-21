// lib/db.ts

// Добавляем фигурные скобки { }, так как это именованный экспорт
import { prisma } from "@/lib/prisma";

export const db = prisma;