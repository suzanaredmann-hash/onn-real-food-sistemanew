import Link from "next/link";
import { db } from "@/lib/db";
import { computeRecipeCost, getCurrentIngredientPriceMap } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

export default async function ProdutosPage() {
  const [products, priceMap] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: {
        recipes: {
          orderBy: { version: "desc" },
          take: 1,
          include: { ingredients: { include: { ingredient: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    getCurrentIngredientPriceMap(),
  ]);

  const rows = products.map((product) => {
    const recipe = product.recipes[0];
    const cost = recipe
      ? computeRecipeCost(
          {
            packagingCost: Number(recipe.packagingCost),
            productPrice: Number(product.price),
            ingredients: recipe.ingredients.map((line) => ({
              quantity: Number(line.quantity),
              ingredientId: line.ingredientId,
              ingredientName: line.ingredient.name,
            })),
          },
          priceMap
        )
      : null;
    return { product, cost };
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Produtos &amp; fichas técnicas
          </h1>
          <p className="text-sm text-zinc-500">
            CMV e margem calculados a partir do preço atual dos ingredientes.
          </p>
        </div>
        <Link
          href="/produtos/novo"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Novo produto
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2">Produto</th>
              <th className="px-4 py-2">Preço</th>
              <th className="px-4 py-2">CMV</th>
              <th className="px-4 py-2">Margem</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, cost }) => (
              <tr key={product.id} className="border-t border-zinc-100">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {product.name}
                  <div className="text-xs text-zinc-400">{product.sku}</div>
                </td>
                <td className="px-4 py-3">{formatCurrency(Number(product.price))}</td>
                <td className="px-4 py-3">
                  {cost ? formatCurrency(cost.cmv) : "sem ficha técnica"}
                  {cost && cost.missingPrices.length > 0 && (
                    <div className="text-xs text-amber-600">
                      sem preço: {cost.missingPrices.join(", ")}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {cost ? (
                    <span
                      className={
                        cost.margin >= 0 ? "text-emerald-600" : "text-red-600"
                      }
                    >
                      {formatCurrency(cost.margin)} ({cost.marginPercent.toFixed(0)}%)
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/produtos/${product.id}`}
                    className="text-zinc-500 hover:text-zinc-900"
                  >
                    editar
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
