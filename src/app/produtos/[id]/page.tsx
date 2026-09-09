import { db } from "@/lib/db";
import { ProductForm } from "@/components/produtos/ProductForm";
import { notFound } from "next/navigation";

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "novo";

  const ingredients = await db.ingredient.findMany({ orderBy: { name: "asc" } });
  const ingredientOptions = ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
  }));

  if (isNew) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900">
          Novo produto
        </h1>
        <ProductForm ingredientOptions={ingredientOptions} />
      </div>
    );
  }

  const product = await db.product.findUnique({
    where: { id },
    include: {
      recipes: {
        include: { ingredients: true, steps: { orderBy: { stepNumber: "asc" } } },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!product) notFound();

  const recipe = product.recipes[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">
        Editar produto
      </h1>
      <ProductForm
        ingredientOptions={ingredientOptions}
        initialData={{
          id: product.id,
          sku: product.sku,
          name: product.name,
          type: product.type,
          price: Number(product.price),
          packagingCost: recipe ? Number(recipe.packagingCost) : 0,
          ingredients:
            recipe?.ingredients.map((line) => ({
              ingredientId: line.ingredientId,
              quantity: Number(line.quantity),
              unit: line.unit,
            })) ?? [],
          steps: recipe?.steps.map((s) => ({ instructionText: s.instructionText })) ?? [],
        }}
      />
    </div>
  );
}
