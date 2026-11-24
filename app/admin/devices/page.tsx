/**
 * Устройства, вошедшие в Android-приложение админа. Если телефон потерян или
 * больше не используется — «Отключить»: ключ этого устройства перестаёт работать,
 * а чтобы снова пользоваться приложением, нужно войти паролем заново.
 */
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone } from "lucide-react";
import { revokeDevice } from "./actions";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Asia/Tomsk",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminDevicesPage() {
  const devices = await prisma.appDevice.findMany({ orderBy: [{ revokedAt: "asc" }, { createdAt: "desc" }] });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Приложение: устройства</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Телефоны, на которых выполнен вход в приложение админа. Потерянный телефон отключите —
          его доступ сразу прекратится.
        </p>
      </div>

      {devices.length === 0 && (
        <p className="text-muted-foreground">Пока ни одного устройства. Войдите в приложение паролем админки.</p>
      )}

      <div className="space-y-3">
        {devices.map((d) => (
          <Card key={d.id} className={d.revokedAt ? "opacity-60" : ""}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {d.name}
                    {d.revokedAt ? <Badge variant="outline">Отключено</Badge> : <Badge>Активно</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <div>Вход: {fmt.format(d.createdAt)}</div>
                    {d.lastSeenAt && <div>Последний раз на связи: {fmt.format(d.lastSeenAt)}</div>}
                    {d.revokedAt && <div>Отключено: {fmt.format(d.revokedAt)}</div>}
                  </div>
                </div>
              </div>
              {!d.revokedAt && (
                <form action={revokeDevice.bind(null, d.id)}>
                  <Button variant="destructive" size="sm" className="w-full sm:w-auto">Отключить</Button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
