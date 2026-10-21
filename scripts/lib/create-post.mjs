import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import slugify from "slugify";

export const POSTS_DIR = "src/content/posts";

const pad = n => String(n).padStart(2, "0");

function timestampSlug() {
  const now = new Date();
  return `post-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export function nowDatetime() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}+08:00`;
}

/** 从标题生成 slug；中文标题无法生成时回退为时间戳。 */
export function toSlug(title) {
  const slug = slugify(title, { lower: true, strict: true });
  if (slug) return { slug, fallback: false };
  return { slug: timestampSlug(), fallback: true };
}

export function buildPostContent(title) {
  return `---
title: ${title}
pubDatetime: ${nowDatetime()}
draft: true
category: ""
order: 0
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
}

/**
 * 创建草稿文章。
 * @returns {{ ok: true, slug: string, filePath: string, absPath: string, fallback: boolean }
 *         | { ok: false, error: string }}
 */
export function createPost(title) {
  if (!title?.trim()) return { ok: false, error: "标题不能为空" };

  const { slug, fallback } = toSlug(title.trim());
  const filePath = join(POSTS_DIR, `${slug}.md`);
  if (existsSync(filePath)) {
    return { ok: false, error: `文件已存在: ${filePath}`, slug };
  }

  writeFileSync(filePath, buildPostContent(title.trim()));
  return { ok: true, slug, filePath, absPath: resolve(filePath), fallback };
}

/** 极简 frontmatter 解析，只取列表页需要的字段。 */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const get = key => {
    const r = m[1].match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
    return r ? r[1].trim().replace(/^["']|["']$/g, "") : undefined;
  };
  return {
    title: get("title"),
    draft: /^draft:\s*true\s*$/m.test(m[1]),
    description: get("description"),
  };
}

/** 列出所有文章及其发布状态。 */
export function listPosts() {
  return readdirSync(POSTS_DIR)
    .filter(f => f.endsWith(".md") && !f.startsWith("_"))
    .sort()
    .map(file => {
      const slug = file.replace(/\.md$/, "");
      const fm = parseFrontmatter(readFileSync(join(POSTS_DIR, file), "utf8"));
      return {
        slug,
        title: fm.title ?? slug,
        draft: fm.draft ?? false,
        hasDescription: Boolean(fm.description?.trim()),
      };
    });
}

/** 拼 VS Code 协议链接（浏览器跳转可直接唤回并打开文件）。 */
export function toVscodeUrl(absPath) {
  return `vscode://file/${absPath.split(sep).join("/")}`;
}

/**
 * 删除草稿文章（仅限 draft: true，已发布文章拒绝删除）。
 * @returns {{ ok: true, slug: string } | { ok: false, error: string }}
 */
export function deletePost(slug) {
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return { ok: false, error: "非法的 slug" };
  }
  const filePath = join(POSTS_DIR, `${slug}.md`);
  if (!existsSync(filePath)) {
    return { ok: false, error: `文件不存在: ${filePath}` };
  }
  const fm = parseFrontmatter(readFileSync(filePath, "utf8"));
  if (!fm.draft) {
    return { ok: false, error: "只能删除草稿（draft: true）的文章" };
  }
  rmSync(filePath);
  return { ok: true, slug };
}
