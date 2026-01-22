import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Clock, ChefHat } from "lucide-react";

export const metadata = {
  title: "Рецепты с сыром | Сырная лавка",
  description: "Вдохновляйтесь нашими рецептами с лучшими фермерскими сырами.",
};

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    // ИСПРАВЛЕНИЕ: Добавлен 'mx-auto' для центрирования
    <div className="container mx-auto py-12 px-4 md:px-0">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-primary">Рецепты</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          От простых закусок до изысканных блюд. Узнайте, как раскрыть вкус наших сыров по-новому.
        </p>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recipes.map((recipe) => (
          <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="group block">
            <div className="h-full flex flex-col overflow-hidden rounded-2xl border-none bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              {/* Обложка */}
              <div className="relative aspect-[4/3] overflow-hidden bg-secondary/30">
                {recipe.coverUrl || recipe.previewImageUrl ? (
                  <Image
                    src={recipe.coverUrl || recipe.previewImageUrl || ""}
                    alt={recipe.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ChefHat className="h-12 w-12 opacity-20" />
                  </div>
                )}
                {/* Категория */}
                {recipe.category && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-sm text-foreground hover:bg-white">
                      {recipe.category.name}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Контент */}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                  {recipe.title}
                </h3>

                {recipe.shortDescription && (
                  <p className="text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {recipe.shortDescription}
                  </p>
                )}

                <div className="mt-auto pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>20 мин</span>
                  </div>
                  <span className="font-medium text-primary group-hover:underline">Читать рецепт →</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {recipes.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          Пока рецептов нет. Загляните позже! 🍳
        </div>
      )}
    </div>
  );
}