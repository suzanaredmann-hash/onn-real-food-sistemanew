"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createEvent(data: { name: string; venue: string; eventDate: string }) {
  const name = data.name.trim();
  if (!name) throw new Error("Nome do evento é obrigatório");
  if (!data.eventDate) throw new Error("Data do evento é obrigatória");

  const session = await auth();

  await db.event.create({
    data: {
      name,
      venue: data.venue.trim() || null,
      eventDate: new Date(data.eventDate),
      createdById: session?.user?.id,
    },
  });
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
}

export async function updateEventStatus(id: string, status: "PLANNED" | "OPEN" | "CLOSED") {
  await db.event.update({
    where: { id },
    data: { status, closedAt: status === "CLOSED" ? new Date() : null },
  });
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
}

export async function deleteEvent(id: string) {
  await db.event.delete({ where: { id } });
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
}
