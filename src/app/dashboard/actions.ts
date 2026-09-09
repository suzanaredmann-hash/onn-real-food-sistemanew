"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createTask(title: string) {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Título obrigatório");

  const last = await db.task.findFirst({ orderBy: { orderIndex: "desc" } });
  const task = await db.task.create({
    data: { title: trimmed, orderIndex: (last?.orderIndex ?? -1) + 1 },
  });
  revalidatePath("/dashboard");
  return { id: task.id, title: task.title, status: task.status, orderIndex: task.orderIndex };
}

export async function toggleTaskStatus(id: string, status: "TODO" | "DONE") {
  await db.task.update({ where: { id }, data: { status } });
  revalidatePath("/dashboard");
}

export async function updateTaskTitle(id: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) return;
  await db.task.update({ where: { id }, data: { title: trimmed } });
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  await db.task.delete({ where: { id } });
  revalidatePath("/dashboard");
}

export async function reorderTasks(orderedIds: string[]) {
  await db.$transaction(
    orderedIds.map((id, index) =>
      db.task.update({ where: { id }, data: { orderIndex: index } })
    )
  );
  revalidatePath("/dashboard");
}
