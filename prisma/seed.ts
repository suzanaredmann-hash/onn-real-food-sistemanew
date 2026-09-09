import { PrismaClient, ProductType, Unit } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("onn2024", 10);
  const admin = await db.user.upsert({
    where: { email: "susana@onnrealfood.com" },
    update: { name: "Suzana" },
    create: {
      name: "Suzana",
      email: "susana@onnrealfood.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const ingredients = await Promise.all(
    [
      { name: "Morango congelado", unit: Unit.G },
      { name: "Manga congelada", unit: Unit.G },
      { name: "Água de coco", unit: Unit.ML },
      { name: "Leite", unit: Unit.ML },
      { name: "Hortelã", unit: Unit.G },
      { name: "Limão", unit: Unit.UNIT },
      { name: "Pão integral", unit: Unit.UNIT },
      { name: "Peito de frango desfiado", unit: Unit.G },
    ].map((i) => db.ingredient.upsert({ where: { name: i.name }, update: {}, create: i }))
  );

  const [morango, manga, aguaCoco, leite, hortela, limao, pao, frango] = ingredients;

  const supplier1 = await db.supplier.upsert({
    where: { id: "seed-supplier-1" },
    update: {},
    create: {
      id: "seed-supplier-1",
      name: "Distribuidora Frutas Congeladas SP",
      contactName: "Carlos",
      phone: "11999990000",
    },
  });

  const supplier2 = await db.supplier.upsert({
    where: { id: "seed-supplier-2" },
    update: {},
    create: {
      id: "seed-supplier-2",
      name: "Atacadão Hortifruti",
      contactName: "Marina",
      phone: "11988880000",
    },
  });

  // SupplierPrice não tem constraint única (cada cotação é uma linha nova de
  // propósito) — `skipDuplicates` não pega isso, então guardamos manualmente
  // pra rodar o seed de novo não duplicar as cotações de exemplo.
  const hasSupplierPrices = (await db.supplierPrice.count()) > 0;
  if (!hasSupplierPrices) {
    await db.supplierPrice.createMany({
      data: [
        { supplierId: supplier1.id, ingredientId: morango.id, pricePerUnit: 0.028, unit: Unit.G },
        { supplierId: supplier2.id, ingredientId: morango.id, pricePerUnit: 0.031, unit: Unit.G },
        { supplierId: supplier1.id, ingredientId: manga.id, pricePerUnit: 0.019, unit: Unit.G },
        { supplierId: supplier2.id, ingredientId: manga.id, pricePerUnit: 0.021, unit: Unit.G },
      ],
    });
  }

  const smoothieMorango = await db.product.upsert({
    where: { sku: "SM-MORANGO" },
    update: {},
    create: {
      sku: "SM-MORANGO",
      name: "Smoothie Morango",
      type: ProductType.SMOOTHIE,
      price: 18.0,
    },
  });

  const smoothieManga = await db.product.upsert({
    where: { sku: "SM-MANGA" },
    update: {},
    create: {
      sku: "SM-MANGA",
      name: "Smoothie Manga",
      type: ProductType.SMOOTHIE,
      price: 18.0,
    },
  });

  const sanduicheFrango = await db.product.upsert({
    where: { sku: "SD-FRANGO" },
    update: {},
    create: {
      sku: "SD-FRANGO",
      name: "Sanduíche de Frango",
      type: ProductType.SANDUICHE,
      price: 16.0,
    },
  });

  await db.base.createMany({
    data: [
      { name: "Água de coco" },
      { name: "Leite" },
      { name: "Limão" },
      { name: "Hortelã" },
    ],
    skipDuplicates: true,
  });

  const existingRecipe = await db.recipe.findFirst({ where: { productId: smoothieMorango.id } });
  if (!existingRecipe) {
    await db.recipe.create({
      data: {
        productId: smoothieMorango.id,
        packagingCost: 0.8,
        ingredients: {
          create: [
            { ingredientId: morango.id, quantity: 150, unit: Unit.G },
            { ingredientId: aguaCoco.id, quantity: 100, unit: Unit.ML },
            { ingredientId: hortela.id, quantity: 2, unit: Unit.G },
          ],
        },
        steps: {
          create: [
            { stepNumber: 1, instructionText: "Bater 150g de morango congelado com 100ml de água de coco." },
            { stepNumber: 2, instructionText: "Adicionar folhas de hortelã e bater mais 10 segundos." },
            { stepNumber: 3, instructionText: "Servir em copo de 300ml." },
          ],
        },
      },
    });
  }

  const existingRecipeManga = await db.recipe.findFirst({ where: { productId: smoothieManga.id } });
  if (!existingRecipeManga) {
    await db.recipe.create({
      data: {
        productId: smoothieManga.id,
        packagingCost: 0.8,
        ingredients: {
          create: [
            { ingredientId: manga.id, quantity: 150, unit: Unit.G },
            { ingredientId: leite.id, quantity: 100, unit: Unit.ML },
            { ingredientId: limao.id, quantity: 1, unit: Unit.UNIT },
          ],
        },
        steps: {
          create: [
            { stepNumber: 1, instructionText: "Bater 150g de manga congelada com 100ml de leite." },
            { stepNumber: 2, instructionText: "Espremer o suco de 1 limão e bater mais 10 segundos." },
            { stepNumber: 3, instructionText: "Servir em copo de 300ml." },
          ],
        },
      },
    });
  }

  const existingRecipeSanduiche = await db.recipe.findFirst({ where: { productId: sanduicheFrango.id } });
  if (!existingRecipeSanduiche) {
    await db.recipe.create({
      data: {
        productId: sanduicheFrango.id,
        packagingCost: 0.5,
        ingredients: {
          create: [
            { ingredientId: pao.id, quantity: 2, unit: Unit.UNIT },
            { ingredientId: frango.id, quantity: 120, unit: Unit.G },
          ],
        },
        steps: {
          create: [
            { stepNumber: 1, instructionText: "Montar o sanduíche com 2 fatias de pão integral e 120g de frango desfiado." },
            { stepNumber: 2, instructionText: "Embalar e etiquetar com a data de produção." },
          ],
        },
      },
    });
  }

  const hasTasks = (await db.task.count()) > 0;
  if (!hasTasks) {
    await db.task.createMany({
      data: [
        { title: "Confirmar fornecedor de morango pra próximo evento", orderIndex: 0 },
        { title: "Fechar cardápio do evento de sábado", orderIndex: 1 },
        { title: "Atualizar ficha técnica do sanduíche de frango", orderIndex: 2 },
      ],
    });
  }

  console.log("Seed concluído. Login: susana@onnrealfood.com / onn2024");
  console.log("Admin:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
