// app/admin/products/quantity-input.tsx
"use client";

import { Input } from "@/components/ui/input";
import { useState, useTransition } from "react";
import { updateProductQuantity } from "./actions";
import { toast } from "sonner";

export function QuantityInput({
  productId,
  initialQuantity,
}: {
  productId: string;
  initialQuantity: number;
}) {
  const [val, setVal] = useState(initialQuantity.toString());
  const [isPending, startTransition] = useTransition();

  const handleBlur = () => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setVal(initialQuantity.toString());
      return;
    }
    // Отправляем запрос только если значение изменилось
    if (num !== initialQuantity) {
      startTransition(async () => {
        const res = await updateProductQuantity(productId, num);
        if (res?.error) {
          toast.error(res.error);
          setVal(initialQuantity.toString());
        } else {
          toast.success("Остаток сохранен");
        }
      });
    }
  };

  return (
    <Input
      type="number"
      className="w-20 h-8"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      disabled={isPending}
    />
  );
}