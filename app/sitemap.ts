import type { MetadataRoute } from "next";

/**
 * Карта сайта для Яндекса и Google: https://fourkings.ru/sitemap.xml
 * (на неё ссылается public/robots.txt; раньше файла не было — поисковики получали 404).
 *
 * Товары и рецепты открываются окнами внутри /catalog и /recipes, отдельных страниц у них
 * нет — поэтому в карте только сами разделы. Админка, корзина, оформление и служебные
 * ссылки закрыты в robots.txt.
 */
const SITE = "https://fourkings.ru";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    page("/catalog", 1.0, "daily"),
    page("/cheese-plate", 0.8, "daily"),
    page("/recipes", 0.7, "weekly"),
    page("/certificates", 0.6, "monthly"),
    page("/delivery", 0.6, "monthly"),
    page("/about", 0.5, "monthly"),
    page("/oferta", 0.2, "yearly"),
    page("/privacy", 0.2, "yearly"),
  ];
}
