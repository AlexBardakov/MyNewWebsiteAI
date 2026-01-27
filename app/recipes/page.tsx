import { prisma } from "@/lib/prisma";
import RecipesClient from "@/components/recipes-client";

export const metadata = {
  title: "Рецепты с сыром | Сыроварня Four Kings",
  description: "Вдохновляйтесь рецептами с лучшими фермерскими сырами.",
};

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    where: { isActive: true },
    include: {
        category: true,
        recipeProducts: { include: { product: true } }
    },
    orderBy: { createdAt: 'desc' },
  });

  const categories = await prisma.recipeCategory.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <RecipesClient initialRecipes={recipes} categories={categories} />
  );
}