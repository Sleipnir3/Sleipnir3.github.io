# 写作指南

从灵感到发布的完整流程，以及本站支持的 Markdown 扩展语法速查。

## 写作流程

```bash
# 1. 新建草稿（想到选题就先占坑，草稿仅本地可见，零成本）
npm run new "文章标题"

# 2. 启动预览，边写边看（草稿也会显示）
npx astro dev

# 3. 编辑 src/content/posts/<slug>.md
#    - 填 description（发布前必填）
#    - 按模板结构写正文，删去示例内容

# 4. 发布：删除 draft: true，然后
npm run publish "新增文章：文章标题"
```

预览地址：`http://localhost:4321/posts/<slug>/`

> 中文标题无法生成英文 slug 时，脚本会回退为时间戳命名并给出警告，
> 建议把文件重命名为有意义的英文 slug（它会出现在 URL 里）。

## frontmatter 字段

| 字段           | 必填 | 说明                                             |
| -------------- | ---- | ------------------------------------------------ |
| `title`        | ✓    | 文章标题                                         |
| `pubDatetime`  | ✓    | 发布时间，脚本自动生成（`+08:00`）               |
| `description`  | ✓    | 一句话说清文章解决什么问题，用于列表摘要和 SEO   |
| `tags`         |      | 标签数组，**先从已有标签里选**，避免同义标签分裂 |
| `draft`        |      | `true` 时仅本地可见；发布前删除                  |
| `featured`     |      | `true` 时进入首页"精选"                          |
| `modDatetime`  |      | 修改旧文章时手动更新为当前时间                   |
| `ogImage`      |      | 自定义分享图，默认自动生成                       |
| `canonicalURL` |      | 原文在他处首发时填写原文链接                     |
| `hideEditPost` |      | `true` 时隐藏"编辑此页"入口                      |

## 语法速查

### 目录

正文开头写一行（标题文字必须是 `Table of contents`），自动生成可折叠目录：

```markdown
## Table of contents
```

### 代码块

````markdown
```csharp file="DoubleBuffer.cs"
var writeBuffer = _isWritingToA ? _bufferA : _bufferB; // [!code highlight]
```
````

- `file="文件名"`：代码块左上角显示文件名标签（自定义 transformer）
- 行尾 `// [!code highlight]`：高亮该行
- 行尾 `// [!code ++]` / `// [!code --]`：diff 标注（绿/红行）
- `// [!code word:关键字]`：高亮指定词

### 提示块（Callout）

```markdown
> [!note]
> 补充说明。

> [!tip]
> 实用技巧。

> [!warning]
> 需要警惕的坑。
```

支持 `note` / `tip` / `important` / `warning` / `caution`。

### 图片

图片放 `public/images/`，正文引用：

```markdown
![架构示意图](/images/my-post/arch.png)
```

### 折叠长目录

`## Table of contents` 生成的目录默认折叠，无需额外操作。

## 维护旧文章

1. 直接编辑 `src/content/posts/` 下的文件
2. 把 `modDatetime` 更新为当前时间（格式同 `pubDatetime`），文章会显示"已更新"
3. `npm run publish "更新文章：xxx"`

## 检查与排错

- `npm run build`：类型检查 + 构建，frontmatter 缺字段会在这里报错
- 预览 404：确认 `draft` 已删除且 `pubDatetime` 不是未来时间
- 部署：`npm run publish` 后由 GitHub Actions 自动构建，几分钟后生效
