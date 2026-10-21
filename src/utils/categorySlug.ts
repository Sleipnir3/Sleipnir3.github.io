import { slugifyStr } from "./slugify";

/**
 * 分类名 → URL slug 映射表。
 *
 * 新增分类时建议在此登记英文 slug，保证 URL 干净稳定；
 * 未登记的分类回退到 slugifyStr（中文会保留原字符，进入 URL 时会被编码）。
 */
const CATEGORY_SLUGS: Record<string, string> = {
  未分类: "uncategorized",
};

/** 将分类名转换为 URL slug。 */
export function categoryToSlug(category: string): string {
  return CATEGORY_SLUGS[category] ?? slugifyStr(category);
}
