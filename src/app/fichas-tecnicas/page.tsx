import Link from "next/link";
import { db } from "@/lib/db";
import { computeRecipeCost, getCurrentIngredientPriceMap } from "@/lib/pricing";
import { formatCurrency, cn } from "@/lib/utils";
import { FileSpreadsheet } from "lucide-react";

export default async function FichasTecnicasPage() {
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="mb-8 flex items-center justify-between gap-4 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-onn-primary">
            <FileSpreadsheet size={22} />
          </span>
          <div>
            <h1 className="font-display text-4xl tracking-[-0.02em] sm:text-5xl">
              Fichas técnicas
            </h1>
            <p className="mt-1 text-sm text-[#14162e]/70">
              CMV e margem a partir do preço atual dos ingredientes. Só
              visível pra administradora.
            </p>
          </div>
        </div>
        <Link href="/fichas-tecnicas/novo" className="onn-btn-primary shrink-0">
          Novo produto
        </Link>
      </div>

      <div className="onn-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-400">
            <tr>
              <th className="px-5 py-3 font-medium">Produto</th>
              <th className="px-5 py-3 font-medium">Preço</th>
              <th className="px-5 py-3 font-medium">CMV</th>
              <th className="px-5 py-3 font-medium">Margem</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, cost }) => (
              <tr key={product.id} className="border-t border-zinc-100">
                <td className="px-5 py-3.5 font-medium text-[#14162e]">
                  {product.name}
                  <div className="text-xs font-normal text-zinc-400">{product.sku}</div>
                </td>
                <td className="px-5 py-3.5 text-zinc-600">{formatCurrency(Number(product.price))}</td>
                <td className="px-5 py-3.5 text-zinc-600">
                  {cost ? formatCurrency(cost.cmv) : "sem ficha técnica"}
                  {cost && cost.missingPrices.length > 0 && (
                    <div className="text-xs text-amber-600">
                      sem preço: {cost.missingPrices.join(", ")}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {cost ? (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        cost.margin >= 0
                          ? "bg-[#E1F34C]/40 text-[#4b5400]"
                          : "bg-red-50 text-red-600"
                      )}
                    >
                      {formatCurrency(cost.margin)} ({cost.marginPercent.toFixed(0)}%)
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/fichas-tecnicas/${product.id}`}
                    className="text-zinc-400 hover:text-onn-primary"
                  >
                    editar
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-zinc-400">
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
