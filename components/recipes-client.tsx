'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecipeDetailsModal, Recipe } from '@/components/recipe-details-modal';

interface RecipeCategory {
  id: string;
  name: string;
}

interface RecipesClientProps {
  initialRecipes: Recipe[];
  categories: RecipeCategory[];
}

export default function RecipesClient({ initialRecipes, categories }: RecipesClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Состояние для модального окна
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const scrollToCategory = (categoryId: string) => {
    const offset = 140;
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveCategory(categoryId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">

      {/* Меню категорий */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b shadow-sm transition-all">
        <div className="container mx-auto px-4 md:px-0">
            <div className="flex items-center h-14 overflow-x-auto no-scrollbar gap-2">
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="font-medium text-muted-foreground hover:text-primary whitespace-nowrap"
               >
                 Все
               </Button>
               <div className="h-4 w-px bg-gray-300 mx-1 flex-shrink-0" />
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => scrollToCategory(cat.id)}
                  className={cn(
                    "rounded-full whitespace-nowrap transition-all text-sm px-4",
                    activeCategory === cat.id
                      ? "bg-primary/10 text-primary font-semibold hover:bg-primary/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
        </div>
      </div>

      {/* Заголовок */}
      <div className="container mx-auto px-4 md:px-0 pt-8 md:pt-10 pb-6 md:pb-8 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 text-primary tracking-tight">
          Книга рецептов
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-lg leading-relaxed">
          Идеи для завтраков, ужинов и праздничного стола с нашими сырами.
        </p>
      </div>

      {/* Список рецептов */}
      <div className="container mx-auto px-4 md:px-0 space-y-12 md:space-y-16">

        {categories.map((category) => {
          const categoryRecipes = initialRecipes.filter(r => r.categoryId === category.id);
          if (categoryRecipes.length === 0) return null;

          return (
            <section key={category.id} id={`category-${category.id}`} className="scroll-mt-40">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900 flex items-center gap-3">
                 {category.name}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                {categoryRecipes.map((recipe) => (
                  // ВАЖНО: Убрали Link, добавили div с onClick
                  <div
                    key={recipe.id}
                    onClick={() => openRecipe(recipe)}
                    className="group block h-full cursor-pointer"
                  >
                    <div className="h-full flex flex-col overflow-hidden rounded-xl md:rounded-2xl border-none bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ring-1 ring-black/5">

                      <div className="relative aspect-[4/3] overflow-hidden bg-secondary/10">
                        {recipe.coverUrl || recipe.previewImageUrl ? (
                          <Image
                            src={recipe.coverUrl || recipe.previewImageUrl || ""}
                            alt={recipe.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground/30">
                            <ChefHat className="h-10 w-10 md:h-16 md:w-16" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-3 md:p-5">
                        <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                          {recipe.title}
                        </h3>

                        {recipe.shortDescription && (
                          <p className="text-muted-foreground text-[10px] md:text-sm line-clamp-2 md:line-clamp-3 mb-2 md:mb-4 flex-1 leading-relaxed">
                            {recipe.shortDescription}
                          </p>
                        )}

                        <div className="mt-auto pt-2 md:pt-4 border-t border-dashed border-gray-100 flex items-center justify-end">
                          <span className="text-[10px] md:text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center">
                            Читать
                            <svg className="w-3 h-3 md:w-4 md:h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Другие рецепты */}
        {initialRecipes.filter(r => !r.categoryId).length > 0 && (
            <section className="scroll-mt-40">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900">Другие рецепты</h2>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                    {initialRecipes.filter(r => !r.categoryId).map((recipe) => (
                         <div key={recipe.id} onClick={() => openRecipe(recipe)} className="group block h-full cursor-pointer">
                            <div className="h-full flex flex-col overflow-hidden rounded-xl md:rounded-2xl border-none bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ring-1 ring-black/5">
                              <div className="relative aspect-[4/3] overflow-hidden bg-secondary/10">
                                {recipe.coverUrl || recipe.previewImageUrl ? (
                                  <Image src={recipe.coverUrl || recipe.previewImageUrl || ""} alt={recipe.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-muted-foreground/30"><ChefHat className="h-10 w-10 md:h-16 md:w-16" /></div>
                                )}
                              </div>
                              <div className="flex flex-1 flex-col p-3 md:p-5">
                                <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{recipe.title}</h3>
                                {recipe.shortDescription && <p className="text-muted-foreground text-[10px] md:text-sm line-clamp-2 md:line-clamp-3 mb-2 md:mb-4 flex-1 leading-relaxed">{recipe.shortDescription}</p>}
                                <div className="mt-auto pt-2 md:pt-4 border-t border-dashed border-gray-100 flex items-center justify-end">
                                  <span className="text-[10px] md:text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform inline-flex items-center">Читать <svg className="w-3 h-3 md:w-4 md:h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></span>
                                </div>
                              </div>
                            </div>
                         </div>
                    ))}
                </div>
            </section>
        )}
      </div>

      {/* Модальное окно */}
      <RecipeDetailsModal
        recipe={selectedRecipe}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}