import { db } from "@/lib/db";
import { FornecedoresPanel } from "@/components/fornecedores/FornecedoresPanel";

export default async function FornecedoresPage() {
  const [suppliers, ingredients, allPrices, purchases] = await Promise.all([
    db.supplier.findMany({ orderBy: { name: "asc" } }),
    db.ingredient.findMany({ orderBy: { name: "asc" } }),
    db.supplierPrice.findMany({
      include: { supplier: true, ingredient: true },
      orderBy: { validFrom: "desc" },
    }),
    db.purchase.findMany({
      include: { supplier: true, ingredient: true },
      orderBy: { purchasedAt: "desc" },
      take: 20,
    }),
  ]);

  // Preço vigente = cotação mais recente de cada fornecedor por ingrediente
  const latestKey = (supplierId: string, ingredientId: string) => `${supplierId}::${ingredientId}`;
  const seen = new Set<string>();
  const currentPrices = allPrices.filter((p) => {
    const key = latestKey(p.supplierId, p.ingredientId);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <h1 className="mb-1 text-2xl font-semibold text-[#14162e]">Fornecedores</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Cadastro, comparação de preço por ingrediente e histórico de compras.
      </p>
      <FornecedoresPanel
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name, contactName: s.contactName, phone: s.phone, email: s.email }))}
        ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
        currentPrices={currentPrices.map((p) => ({
          id: p.id,
          supplierId: p.supplierId,
          supplierName: p.supplier.name,
          ingredientId: p.ingredientId,
          ingredientName: p.ingredient.name,
          pricePerUnit: Number(p.pricePerUnit),
          unit: p.unit,
          validFrom: p.validFrom.toISOString(),
        }))}
        purchases={purchases.map((p) => ({
          id: p.id,
          supplierName: p.supplier.name,
          ingredientName: p.ingredient.name,
          quantity: Number(p.quantity),
          unit: p.unit,
          totalCost: Number(p.totalCost),
          purchasedAt: p.purchasedAt.toISOString(),
        }))}
      />
    </div>
  );
}
