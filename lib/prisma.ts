import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // В production логируем ТОЛЬКО ошибки. Раньше стояло log: ['query'],
    // из-за чего каждый SQL-запрос сыпался в stdout → pm2 out.log → забивал
    // диск (одна из причин падений старого сервера от нехватки места).
    // В dev оставляем 'query' для отладки.
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['query', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;