"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation"; // <-- Добавляем импорт
import { loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

// Расширяем начальное состояние
const initialState = {
  error: "",
  success: false,
};

export default function AdminLoginPage() {
  const router = useRouter(); // <-- Инициализируем роутер
  const [state, action, isPending] = useActionState(loginAction, initialState);

  // Следим за состоянием через эффект
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }

    // Если логин прошел успешно — делаем редирект!
    if (state?.success) {
      router.push("/admin");
    }
  }, [state, router]);

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