'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(formData: FormData) {
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;

    if (!id || !status) return;

    await prisma.order.update({
        where: { id },
        data: { status }
    });

    revalidatePath(`/admin/orders/${id}`);
    revalidatePath(`/admin/orders`);
}