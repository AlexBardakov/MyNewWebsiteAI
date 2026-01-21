"use client";

import { useActionState } from "react";
import { loginAction } from "./actions"; // Создадим этот файл следующим шагом
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminLoginPage() {
  // Используем useActionState для обработки формы (Next.js 15/16 style)
  const [state, action, isPending] = useActionState(async (prev: any, formData: FormData) => {
    const result = await loginAction(prev, formData);
    if (result?.error) {
      toast.error(result.error);
    }
    return result;
  }, null);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Вход для админа</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Input
                name="password"
                type="password"
                placeholder="Введите пароль"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Вход..." : "Войти"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}