import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { categoryToSlug } from "./categorySlug";

export type Category = {
  /** URL 中使用的 slug */
  category: string;
  /** 用于展示的原始分类名 */
  categoryName: string;
  /** 该分类下的文章数 */
  count: number;
};

/**
 * Builds a de-duplicated category list from posts.
 *
 * - Drafts and scheduled posts are excluded via `postFilter()`
 * - `category` is the slug used in URLs; `categoryName` is the original label for display
 * - Sorted by post count descending, then by name
 */
export function getUniqueCategories(
  posts: CollectionEntry<"posts">[]
): Category[] {
  const categories = new Map<string, Category>();

  posts.filter(postFilter).forEach(post => {
    const slug = categoryToSlug(post.data.category);
    const existing = categories.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      categories.set(slug, {
        category: slug,
        categoryName: post.data.category,
        count: 1,
      });
    }
  });

  return [...categories.values()].sort(
    (a, b) => b.count - a.count || a.categoryName.localeCompare(b.categoryName)
  );
}
