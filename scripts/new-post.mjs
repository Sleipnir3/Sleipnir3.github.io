import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import slugify from "slugify";

const POSTS_DIR = "src/content/posts";

const title = process.argv[2]?.trim();
if (!title) {
  console.error('Usage: npm run new "文章标题"');
  process.exit(1);
}

let slug = slugify(title, { lower: true, strict: true });
if (!slug) {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  slug = `post-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  console.warn(`⚠ 无法从标题生成 slug，已使用 "${slug}"。建议将文件重命名为英文 slug(它会出现在 URL 中)。`);
}

const filePath = join(POSTS_DIR, `${slug}.md`);
if (existsSync(filePath)) {
  console.error(`✗ 文件已存在: ${filePath}`);
  process.exit(1);
}

const now = new Date();
const pad = n => String(n).padStart(2, "0");
const pubDatetime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}+08:00`;

const content = `---
title: ${title}
pubDatetime: ${pubDatetime}
draft: true
tags:
  - others
description: ""
---

## Table of contents

## 背景

<!-- 为什么写这篇？遇到了什么问题？ -->

## 正文

\`\`\`csharp file="Example.cs"
var x = 1; // [!code highlight]
\`\`\`

> [!note]
> 需要强调的补充说明可以放在提示块里。

<!-- 上面是代码块和提示块示例，发布前替换或删除。更多语法见 docs/WRITING.md -->

## 总结

<!-- 读者看完应该带走什么？ -->
`;

writeFileSync(filePath, content);
console.log(`✓ 已创建 ${filePath}`);
console.log(`  运行 npx astro dev 后在 http://localhost:4321/posts/${slug}/ 预览`);
console.log(`  写作指南与语法速查见 docs/WRITING.md`);
console.log(`  发布前记得填写 description 并移除 draft: true`);
