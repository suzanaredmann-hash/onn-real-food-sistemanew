"use client";

import { useState, type FormEvent } from "react";
import { Unit, ProductType } from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";
import {
  saveProduct,
  createIngredient,
  type IngredientLineInput,
  type StepInput,
} from "@/app/produtos/actions";

type IngredientOption = { id: string; name: string; unit: Unit };

type InitialData = {
  id: string;
  sku: string;
  name: string;
  type: ProductType;
  price: number;
  packagingCost: number;
  ingredients: IngredientLineInput[];
  steps: StepInput[];
};

const unitLabels: Record<Unit, string> = { G: "g", ML: "ml", UNIT: "un" };

export function ProductForm({
  ingredientOptions,
  initialData,
}: {
  ingredientOptions: IngredientOption[];
  initialData?: InitialData;
}) {
  const [options, setOptions] = useState(ingredientOptions);
  const [sku, setSku] = useState(initialData?.sku ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [type, setType] = useState<ProductType>(initialData?.type ?? ProductType.SMOOTHIE);
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [packagingCost, setPackagingCost] = useState(
    initialData?.packagingCost?.toString() ?? "0"
  );
  const [ingredientLines, setIngredientLines] = useState<IngredientLineInput[]>(
    initialData?.ingredients ?? []
  );
  const [steps, setSteps] = useState<StepInput[]>(initialData?.steps ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addIngredientLine() {
    if (options.length === 0) return;
    setIngredientLines((lines) => [
      ...lines,
      { ingredientId: options[0].id, quantity: 0, unit: options[0].unit },
    ]);
  }

  function updateIngredientLine(index: number, patch: Partial<IngredientLineInput>) {
    setIngredientLines((lines) =>
      lines.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  }

  function removeIngredientLine(index: number) {
    setIngredientLines((lines) => lines.filter((_, i) => i !== index));
  }

  async function handleCreateIngredient(index: number) {
    const name = window.prompt("Nome do novo ingrediente:");
    if (!name) return;
    const unit = window.prompt("Unidade (g, ml ou un):", "g")?.toLowerCase();
    const unitEnum: Unit = unit === "ml" ? Unit.ML : unit === "un" ? Unit.UNIT : Unit.G;
    const created = await createIngredient(name, unitEnum);
    setOptions((current) => [...current, created]);
    updateIngredientLine(index, { ingredientId: created.id, unit: created.unit });
  }

  function addStep() {
    setSteps((current) => [...current, { instructionText: "" }]);
  }

  function updateStep(index: number, instructionText: string) {
    setSteps((current) =>
      current.map((s, i) => (i === index ? { instructionText } : s))
    );
  }

  function removeStep(index: number) {
    setSteps((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (ingredientLines.length === 0) {
      setError("Adicione pelo menos um ingrediente.");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveProduct({
        id: initialData?.id,
        sku,
        name,
        type,
        price: Number(price),
        packagingCost: Number(packagingCost),
        ingredients: ingredientLines,
        steps,
      });
    } catch (err) {
      setIsSubmitting(false);
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar o produto."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="SKU">
          <input
            required
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Tipo">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ProductType)}
            className="input"
          >
            <option value={ProductType.SMOOTHIE}>Smoothie</option>
            <option value={ProductType.SANDUICHE}>Sanduíche</option>
          </select>
        </Field>
        <Field label="Nome" className="col-span-2">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Preço de venda (R$)">
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Custo de embalagem (R$)">
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={packagingCost}
            onChange={(e) => setPackagingCost(e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#14162e]">
            Ficha técnica — ingredientes
          </h2>
          <button
            type="button"
            onClick={addIngredientLine}
            className="flex items-center gap-1 text-sm text-onn-primary hover:text-[#14162e]"
          >
            <Plus size={14} /> Adicionar ingrediente
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {ingredientLines.map((line, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={line.ingredientId}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    handleCreateIngredient(index);
                    return;
                  }
                  const opt = options.find((o) => o.id === e.target.value);
                  updateIngredientLine(index, {
                    ingredientId: e.target.value,
                    unit: opt?.unit ?? line.unit,
                  });
                }}
                className="input flex-1"
              >
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
                <option value="__new__">+ Novo ingrediente...</option>
              </select>
              <input
                type="number"
                step="0.001"
                min="0"
                value={line.quantity}
                onChange={(e) =>
                  updateIngredientLine(index, { quantity: Number(e.target.value) })
                }
                className="input w-24"
              />
              <span className="w-8 text-sm text-zinc-500">
                {unitLabels[line.unit]}
              </span>
              <button
                type="button"
                onClick={() => removeIngredientLine(index)}
                className="text-zinc-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {ingredientLines.length === 0 && (
            <p className="text-sm text-zinc-400">Nenhum ingrediente ainda.</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#14162e]">
            Modo de preparo
          </h2>
          <button
            type="button"
            onClick={addStep}
            className="flex items-center gap-1 text-sm text-onn-primary hover:text-[#14162e]"
          >
            <Plus size={14} /> Adicionar passo
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-5 text-sm text-zinc-400">{index + 1}.</span>
              <input
                value={step.instructionText}
                onChange={(e) => updateStep(index, e.target.value)}
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="text-zinc-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {steps.length === 0 && (
            <p className="text-sm text-zinc-400">Nenhum passo ainda.</p>
          )}
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="onn-btn-primary self-start">
        {isSubmitting ? "Salvando..." : "Salvar produto"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      {children}
    </div>
  );
}
