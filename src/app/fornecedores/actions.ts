"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Unit } from "@prisma/client";

export async function createSupplier(data: {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
}) {
  await db.supplier.create({ data });
  revalidatePath("/fornecedores");
}

export async function addSupplierPrice(data: {
  supplierId: string;
  ingredientId: string;
  pricePerUnit: number;
  unit: Unit;
}) {
  await db.supplierPrice.create({ data });
  revalidatePath("/fornecedores");
  revalidatePath("/fichas-tecnicas");
}

export async function addPurchase(data: {
  supplierId: string;
  ingredientId: string;
  quantity: number;
  unit: Unit;
  totalCost: number;
}) {
  await db.purchase.create({ data });
  revalidatePath("/fornecedores");
}
