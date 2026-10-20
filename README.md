# Cyberlex Ω - 环形世界

个人博客，关于 Unity 技术与架构的深度思考。基于 [Astro](https://astro.build) 构建，主题为 [AstroPaper](https://github.com/satnaing/astro-paper)。

- 站点：https://sleipnir3.github.io/
- 部署：GitHub Actions → GitHub Pages（见 `.github/workflows/deploy.yml`）

## 环境要求

- Node.js >= 22.12.0
- npm

## 常用命令

| 命令                     | 说明                                     |
| ------------------------ | ---------------------------------------- |
| `npm install`            | 安装依赖                                 |
| `npm run new "标题"`     | 新建草稿文章（自动填充 frontmatter）     |
| `npm run dev`            | 启动本地开发服务器（localhost:4321）     |
| `npm run publish "说明"` | 提交全部变更并推送，自动触发部署         |
| `npm run build`          | 类型检查、构建，并生成 Pagefind 搜索索引 |
| `npm run preview`        | 本地预览构建产物                         |
| `npm run lint`           | ESLint 检查                              |
| `npm run format`         | Prettier 格式化                          |
| `npm run format:check`   | 检查格式                                 |

## 写作

1. `npm run new "文章标题"` 创建草稿（`draft: true`，仅本地可见，自带文章骨架模板）
2. `npx astro dev` 边写边预览；发布前填写 `description` 并移除 `draft: true`
3. `npm run publish "说明"` 推送上线

完整的写作流程与语法速查（目录、代码块文件名/高亮、提示块、图片等）见 [docs/WRITING.md](docs/WRITING.md)。

文章位于 `src/content/posts/`，支持 Markdown / MDX。站点配置（标题、作者、社交链接等）在 `astro-paper.config.ts`。

## License

[MIT](LICENSE) — 基于 [AstroPaper](https://github.com/satnaing/astro-paper) 主题修改。
