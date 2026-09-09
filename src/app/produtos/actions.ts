"use server";

import { db } from "@/lib/db";
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
  sku: string;
  name: string;
  type: ProductType;
  price: number;
  packagingCost: number;
  ingredients: IngredientLineInput[];
  steps: StepInput[];
};

export async function saveProduct(input: SaveProductInput) {
  const product = await db.product.upsert({
    where: { id: input.id ?? "__new__" },
    update: { sku: input.sku, name: input.name, type: input.type, price: input.price },
    create: { sku: input.sku, name: input.name, type: input.type, price: input.price },
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
          packagingCost: input.packagingCost,
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
        packagingCost: input.packagingCost,
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

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function deleteProduct(id: string) {
  await db.product.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/produtos");
}

export async function createIngredient(name: string, unit: Unit) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nome do ingrediente é obrigatório");
  const ingredient = await db.ingredient.create({ data: { name: trimmed, unit } });
  revalidatePath("/produtos");
  return ingredient;
}
