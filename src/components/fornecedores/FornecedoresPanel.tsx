"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Unit } from "@prisma/client";
import { createSupplier, addSupplierPrice, addPurchase } from "@/app/fornecedores/actions";
import { formatCurrency } from "@/lib/utils";

type Supplier = { id: string; name: string; contactName: string | null; phone: string | null; email: string | null };
type Ingredient = { id: string; name: string; unit: Unit };
type PriceRow = {
  id: string;
  supplierId: string;
  supplierName: string;
  ingredientId: string;
  ingredientName: string;
  pricePerUnit: number;
  unit: Unit;
  validFrom: string;
};
type PurchaseRow = {
  id: string;
  supplierName: string;
  ingredientName: string;
  quantity: number;
  unit: Unit;
  totalCost: number;
  purchasedAt: string;
};

const unitLabels: Record<Unit, string> = { G: "g", ML: "ml", UNIT: "un" };

export function FornecedoresPanel({
  suppliers,
  ingredients,
  currentPrices,
  purchases,
}: {
  suppliers: Supplier[];
  ingredients: Ingredient[];
  currentPrices: PriceRow[];
  purchases: PurchaseRow[];
}) {
  const byIngredient = useMemo(() => {
    const map = new Map<string, PriceRow[]>();
    for (const price of currentPrices) {
      const list = map.get(price.ingredientId) ?? [];
      list.push(price);
      map.set(price.ingredientId, list);
    }
    return map;
  }, [currentPrices]);

  return (
    <div className="flex flex-col gap-8">
      <Section title="Fornecedores cadastrados">
        <SupplierTable suppliers={suppliers} />
        <NewSupplierForm />
      </Section>

      <Section title="Comparação de preço por ingrediente">
        <div className="flex flex-col gap-4">
          {ingredients.map((ingredient) => {
            const rows = (byIngredient.get(ingredient.id) ?? []).sort(
              (a, b) => a.pricePerUnit - b.pricePerUnit
            );
            return (
              <div key={ingredient.id} className="onn-card p-4">
                <p className="mb-2 text-sm font-medium text-[#14162e]">{ingredient.name}</p>
                {rows.length === 0 ? (
                  <p className="text-sm text-zinc-400">Sem cotação registrada.</p>
                ) : (
                  <ul className="flex flex-col gap-1 text-sm text-zinc-600">
                    {rows.map((row, i) => (
                      <li key={row.id} className="flex items-center gap-2">
                        <span className={i === 0 ? "font-medium text-[#14162e]" : ""}>
                          {row.supplierName}: {formatCurrency(row.pricePerUnit)}/{unitLabels[row.unit]}
                        </span>
                        {i === 0 && (
                          <span className="rounded-full bg-[#E1F34C]/50 px-2 py-0.5 text-xs font-medium text-[#4b5400]">
                            melhor preço
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        <NewPriceForm suppliers={suppliers} ingredients={ingredients} />
      </Section>

      <Section title="Histórico de compras">
        <PurchaseTable purchases={purchases} />
        <NewPurchaseForm suppliers={suppliers} ingredients={ingredients} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-[#14162e]">{title}</h2>
      {children}
    </section>
  );
}

function SupplierTable({ suppliers }: { suppliers: Supplier[] }) {
  if (suppliers.length === 0) {
    return <p className="mb-3 text-sm text-zinc-400">Nenhum fornecedor ainda.</p>;
  }
  return (
    <div className="onn-card mb-3 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-2">Nome</th>
            <th className="px-4 py-2">Contato</th>
            <th className="px-4 py-2">Telefone</th>
            <th className="px-4 py-2">Email</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id} className="border-t border-zinc-100">
              <td className="px-4 py-2 font-medium text-[#14162e]">{s.name}</td>
              <td className="px-4 py-2">{s.contactName ?? "—"}</td>
              <td className="px-4 py-2">{s.phone ?? "—"}</td>
              <td className="px-4 py-2">{s.email ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewSupplierForm() {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await createSupplier({ name, contactName, phone, email });
    setName("");
    setContactName("");
    setPhone("");
    setEmail("");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
      <input placeholder="Contato" value={contactName} onChange={(e) => setContactName(e.target.value)} className="input" />
      <input placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
      <button
        type="submit"
        disabled={isSubmitting}
        className="onn-btn-primary"
      >
        Adicionar fornecedor
      </button>
    </form>
  );
}

function NewPriceForm({ suppliers, ingredients }: { suppliers: Supplier[]; ingredients: Ingredient[] }) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedIngredient = ingredients.find((i) => i.id === ingredientId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supplierId || !ingredientId || !pricePerUnit) return;
    setIsSubmitting(true);
    await addSupplierPrice({
      supplierId,
      ingredientId,
      pricePerUnit: Number(pricePerUnit),
      unit: selectedIngredient?.unit ?? Unit.G,
    });
    setPricePerUnit("");
    setIsSubmitting(false);
  }

  if (suppliers.length === 0 || ingredients.length === 0) {
    return <p className="mt-3 text-sm text-zinc-400">Cadastre um fornecedor e um ingrediente pra registrar cotações.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-2">
      <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input">
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select value={ingredientId} onChange={(e) => setIngredientId(e.target.value)} className="input">
        {ingredients.map((i) => (
          <option key={i.id} value={i.id}>{i.name}</option>
        ))}
      </select>
      <input
        type="number"
        step="0.0001"
        min="0"
        placeholder={`Preço por ${selectedIngredient ? unitLabels[selectedIngredient.unit] : "unidade"}`}
        value={pricePerUnit}
        onChange={(e) => setPricePerUnit(e.target.value)}
        className="input w-40"
        required
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="onn-btn-primary"
      >
        Registrar cotação
      </button>
    </form>
  );
}

function PurchaseTable({ purchases }: { purchases: PurchaseRow[] }) {
  if (purchases.length === 0) {
    return <p className="mb-3 text-sm text-zinc-400">Nenhuma compra registrada ainda.</p>;
  }
  return (
    <div className="onn-card mb-3 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-2">Data</th>
            <th className="px-4 py-2">Fornecedor</th>
            <th className="px-4 py-2">Ingrediente</th>
            <th className="px-4 py-2">Quantidade</th>
            <th className="px-4 py-2">Custo total</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((p) => (
            <tr key={p.id} className="border-t border-zinc-100">
              <td className="px-4 py-2">{new Date(p.purchasedAt).toLocaleDateString("pt-BR")}</td>
              <td className="px-4 py-2">{p.supplierName}</td>
              <td className="px-4 py-2">{p.ingredientName}</td>
              <td className="px-4 py-2">{p.quantity} {unitLabels[p.unit]}</td>
              <td className="px-4 py-2">{formatCurrency(p.totalCost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewPurchaseForm({ suppliers, ingredients }: { suppliers: Supplier[]; ingredients: Ingredient[] }) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedIngredient = ingredients.find((i) => i.id === ingredientId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supplierId || !ingredientId || !quantity || !totalCost) return;
    setIsSubmitting(true);
    await addPurchase({
      supplierId,
      ingredientId,
      quantity: Number(quantity),
      unit: selectedIngredient?.unit ?? Unit.G,
      totalCost: Number(totalCost),
    });
    setQuantity("");
    setTotalCost("");
    setIsSubmitting(false);
  }

  if (suppliers.length === 0 || ingredients.length === 0) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="input">
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select value={ingredientId} onChange={(e) => setIngredientId(e.target.value)} className="input">
        {ingredients.map((i) => (
          <option key={i.id} value={i.id}>{i.name}</option>
        ))}
      </select>
      <input
        type="number"
        step="0.001"
        min="0"
        placeholder={`Quantidade (${selectedIngredient ? unitLabels[selectedIngredient.unit] : ""})`}
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="input w-40"
        required
      />
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Custo total (R$)"
        value={totalCost}
        onChange={(e) => setTotalCost(e.target.value)}
        className="input w-36"
        required
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="onn-btn-primary"
      >
        Registrar compra
      </button>
    </form>
  );
}
