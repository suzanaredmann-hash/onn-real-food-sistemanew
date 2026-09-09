"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Unit, ProductType } from "@prisma/client";

export type IngredientLineInput = {
  ingredientId: string;
  quantity: number;
  unit: Unit;
};

export type StepInput = {
  instructionText: string;
};

export type SaveProductInput = {
  id?: string;
  sku?: string;
  name: string;
  type: ProductType;
  /** Omitido quando quem salva não é administradora — o preço não muda. */
  price?: number;
  /** Idem pro custo de embalagem. */
  packagingCost?: number;
  ingredients: IngredientLineInput[];
  steps: StepInput[];
  /** Pra onde voltar depois de salvar — Fichas Técnicas (admin) ou Receitas. */
  redirectTo?: string;
};

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // remove acentos (combining marks) após normalizar
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "PRODUTO"
  );
}

async function generateUniqueSku(name: string): Promise<string> {
  const base = slugify(name);
  let sku = base;
  let suffix = 1;
  while (await db.product.findUnique({ where: { sku } })) {
    suffix += 1;
    sku = `${base}-${suffix}`;
  }
  return sku;
}

export async function saveProduct(input: SaveProductInput) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  // Preço e custo de embalagem são dados financeiros — só a administradora
  // pode defini-los ou alterá-los, mesmo que esse action seja chamado a
  // partir da tela de Receitas (que não expõe esses campos no formulário).
  const price = isAdmin ? input.price : undefined;
  const packagingCost = isAdmin ? input.packagingCost : undefined;

  const sku = input.sku?.trim() || (input.id ? undefined : await generateUniqueSku(input.name));

  const product = await db.product.upsert({
    where: { id: input.id ?? "__new__" },
    update: {
      ...(sku ? { sku } : {}),
      name: input.name,
      type: input.type,
      ...(price !== undefined ? { price } : {}),
    },
    create: {
      sku: sku!,
      name: input.name,
      type: input.type,
      price: price ?? null,
    },
  });

  const existingRecipe = await db.recipe.findFirst({
    where: { productId: product.id },
  });

  if (existingRecipe) {
    await db.$transaction([
      db.recipeIngredient.deleteMany({ where: { recipeId: existingRecipe.id } }),
      db.recipeStep.deleteMany({ where: { recipeId: existingRecipe.id } }),
      db.recipe.update({
        where: { id: existingRecipe.id },
        data: {
          ...(packagingCost !== undefined ? { packagingCost } : {}),
          ingredients: {
            create: input.ingredients.map((line) => ({
              ingredientId: line.ingredientId,
              quantity: line.quantity,
              unit: line.unit,
            })),
          },
          steps: {
            create: input.steps.map((step, index) => ({
              stepNumber: index + 1,
              instructionText: step.instructionText,
            })),
          },
        },
      }),
    ]);
  } else {
    await db.recipe.create({
      data: {
        productId: product.id,
        packagingCost: packagingCost ?? 0,
        ingredients: {
          create: input.ingredients.map((line) => ({
            ingredientId: line.ingredientId,
            quantity: line.quantity,
            unit: line.unit,
          })),
        },
        steps: {
          create: input.steps.map((step, index) => ({
            stepNumber: index + 1,
            instructionText: step.instructionText,
          })),
        },
      },
    });
  }

  const redirectTo = input.redirectTo ?? "/fichas-tecnicas";
  revalidatePath("/fichas-tecnicas");
  revalidatePath("/receitas");
  redirect(redirectTo);
}

export async function deleteProduct(id: string) {
  await db.product.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/fichas-tecnicas");
  revalidatePath("/receitas");
}

export async function createIngredient(name: string, unit: Unit) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nome do ingrediente é obrigatório");
  const ingredient = await db.ingredient.create({ data: { name: trimmed, unit } });
  revalidatePath("/fichas-tecnicas");
  revalidatePath("/receitas");
  return ingredient;
}
