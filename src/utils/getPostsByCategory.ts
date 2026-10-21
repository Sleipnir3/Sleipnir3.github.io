import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { categoryToSlug } from "./categorySlug";

/**
 * Returns posts belonging to the given category slug:
 *
 * - Drafts and scheduled posts are excluded via `postFilter()`
 * - Sorted by `order` ascending; posts with the same `order` fall back to
 *   `pubDatetime` descending (newest first)
 */
export function getPostsByCategory(
  posts: CollectionEntry<"posts">[],
  categorySlug: string
) {
  return posts
    .filter(postFilter)
    .filter(post => categoryToSlug(post.data.category) === categorySlug)
    .sort((a, b) => {
      const orderDiff = a.data.order - b.data.order;
      if (orderDiff !== 0) return orderDiff;
      return (
        Math.floor(new Date(b.data.pubDatetime).getTime() / 1000) -
        Math.floor(new Date(a.data.pubDatetime).getTime() / 1000)
      );
    });
}
