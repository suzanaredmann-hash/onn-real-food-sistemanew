export type RecipeIngredientLine = {
  quantity: number;
  pricePerUnit: number;
};

/** Custo dos ingredientes de uma receita: soma(quantidade × preço unitário do ingrediente). */
export function calculateIngredientsCost(lines: RecipeIngredientLine[]): number {
  return lines.reduce((total, line) => total + line.quantity * line.pricePerUnit, 0);
}

/** CMV = custo dos ingredientes + custo de embalagem. */
export function calculateCmv(ingredientsCost: number, packagingCost: number): number {
  return ingredientsCost + packagingCost;
}

/** Margem = preço de venda - CMV. */
export function calculateMargin(price: number, cmv: number): number {
  return price - cmv;
}

/** Margem percentual sobre o preço de venda. */
export function calculateMarginPercent(price: number, cmv: number): number {
  if (price === 0) return 0;
  return (calculateMargin(price, cmv) / price) * 100;
}
