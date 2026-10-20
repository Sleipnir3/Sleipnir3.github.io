import { createPost } from "./lib/create-post.mjs";

const title = process.argv[2]?.trim();
if (!title) {
  console.error('Usage: npm run new "文章标题"');
  process.exit(1);
}

const result = createPost(title);

if (!result.ok) {
  console.error(`✗ ${result.error}`);
  process.exit(1);
}

if (result.fallback) {
  console.warn(
    `⚠ 无法从标题生成 slug，已使用 "${result.slug}"。建议将文件重命名为英文 slug(它会出现在 URL 中)。`
  );
}

console.log(`✓ 已创建 ${result.filePath}`);
console.log(
  `  运行 npx astro dev 后在 http://localhost:4321/posts/${result.slug}/ 预览`
);
console.log(`  写作指南与语法速查见 docs/WRITING.md`);
console.log(`  发布前记得填写 description 并移除 draft: true`);
