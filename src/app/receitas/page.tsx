import { db } from "@/lib/db";

const unitLabels: Record<string, string> = { G: "g", ML: "ml", UNIT: "un" };

export default async function ReceitasPage() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      recipes: {
        orderBy: { version: "desc" },
        take: 1,
        include: {
          ingredients: { include: { ingredient: true } },
          steps: { orderBy: { stepNumber: "asc" } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="mb-1 text-2xl font-semibold text-[#14162e]">Receitas</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Gramagem, modo de preparo e embalagem de cada produto.
      </p>

      <div className="flex flex-col gap-4">
        {products.map((product) => {
          const recipe = product.recipes[0];
          return (
            <div key={product.id} className="onn-card p-5">
              <h2 className="text-base font-semibold text-[#14162e]">{product.name}</h2>
              {!recipe ? (
                <p className="mt-2 text-sm text-zinc-400">Sem receita cadastrada ainda.</p>
              ) : (
                <div className="mt-3 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Ingredientes
                    </p>
                    <ul className="flex flex-col gap-1 text-sm text-zinc-700">
                      {recipe.ingredients.map((line) => (
                        <li key={line.id}>
                          {line.ingredient.name} — {Number(line.quantity)}
                          {unitLabels[line.unit] ?? ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Modo de preparo
                    </p>
                    <ol className="flex flex-col gap-1 text-sm text-zinc-700">
                      {recipe.steps.map((step) => (
                        <li key={step.id}>
                          {step.stepNumber}. {step.instructionText}
                        </li>
                      ))}
                      {recipe.steps.length === 0 && (
                        <li className="text-zinc-400">Sem modo de preparo cadastrado.</li>
                      )}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {products.length === 0 && (
          <p className="text-sm text-zinc-400">Nenhum produto cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
