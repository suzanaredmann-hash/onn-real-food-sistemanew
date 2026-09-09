import { db } from "@/lib/db";
import {
  calculateIngredientsCost,
  calculateCmv,
  calculateMargin,
  calculateMarginPercent,
} from "@/lib/calculations/cmv";

export type IngredientPriceMap = Map<string, number>;

/**
 * Busca TODAS as cotações de uma vez e reduz pro menor preço vigente por
 * ingrediente (vigente = validFrom mais recente de cada fornecedor).
 * Uma única query, reaproveitável pra qualquer quantidade de receitas —
 * evita 1 round-trip ao banco por ingrediente por receita (N+1).
 */
export async function getCurrentIngredientPriceMap(): Promise<IngredientPriceMap> {
  const prices = await db.supplierPrice.findMany({
    orderBy: { validFrom: "desc" },
    select: { ingredientId: true, supplierId: true, pricePerUnit: true },
  });

  const latestBySupplierPerIngredient = new Map<string, number>();
  const bestPerIngredient: IngredientPriceMap = new Map();

  for (const price of prices) {
    const supplierKey = `${price.ingredientId}::${price.supplierId}`;
    if (latestBySupplierPerIngredient.has(supplierKey)) continue;
    latestBySupplierPerIngredient.set(supplierKey, 1);

    const value = Number(price.pricePerUnit);
    const current = bestPerIngredient.get(price.ingredientId);
    if (current === undefined || value < current) {
      bestPerIngredient.set(price.ingredientId, value);
    }
  }

  return bestPerIngredient;
}

export type RecipeCost = {
  ingredientsCost: number;
  packagingCost: number;
  cmv: number;
  margin: number | null;
  marginPercent: number | null;
  missingPrices: string[];
};

type RecipeForCost = {
  packagingCost: number;
  productPrice: number | null;
  ingredients: { quantity: number; ingredientId: string; ingredientName: string }[];
};

/** Calcula o custo de uma receita já carregada, sem fazer nenhuma query. */
export function computeRecipeCost(
  recipe: RecipeForCost,
  priceMap: IngredientPriceMap
): RecipeCost {
  const missingPrices: string[] = [];
  const lines = recipe.ingredients.map((line) => {
    const price = priceMap.get(line.ingredientId);
    if (price === undefined) missingPrices.push(line.ingredientName);
    return { quantity: line.quantity, pricePerUnit: price ?? 0 };
  });

  const ingredientsCost = calculateIngredientsCost(lines);
  const cmv = calculateCmv(ingredientsCost, recipe.packagingCost);
  // Sem preço de venda definido ainda (produto criado pela tela de Receitas,
  // aguardando a administradora definir o preço nas Fichas Técnicas).
  const margin = recipe.productPrice === null ? null : calculateMargin(recipe.productPrice, cmv);
  const marginPercent =
    recipe.productPrice === null ? null : calculateMarginPercent(recipe.productPrice, cmv);

  return { ingredientsCost, packagingCost: recipe.packagingCost, cmv, margin, marginPercent, missingPrices };
}

/** Conveniência pra uma única receita (ex: página de edição) — ainda 2 queries, não N+1. */
export async function getRecipeCost(recipeId: string): Promise<RecipeCost> {
  const [recipe, priceMap] = await Promise.all([
    db.recipe.findUniqueOrThrow({
      where: { id: recipeId },
      include: { product: true, ingredients: { include: { ingredient: true } } },
    }),
    getCurrentIngredientPriceMap(),
  ]);

  return computeRecipeCost(
    {
      packagingCost: Number(recipe.packagingCost),
      productPrice: recipe.product.price === null ? null : Number(recipe.product.price),
      ingredients: recipe.ingredients.map((line) => ({
        quantity: Number(line.quantity),
        ingredientId: line.ingredientId,
        ingredientName: line.ingredient.name,
      })),
    },
    priceMap
  );
}
