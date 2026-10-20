import { fileURLToPath } from "node:url";
import {
  createPost,
  deletePost,
  listPosts,
  toVscodeUrl,
} from "../../../scripts/lib/create-post.mjs";

const send = (res, code, obj) => {
  res.statusCode = code;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
};

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try {
    return JSON.parse(Buffer.concat(chunks).toString() || "{}");
  } catch {
    return {};
  }
}

/** 写作助手：本地开发工具栏 + 配套 API（仅 dev server，不进入线上产物）。 */
export default function writingTools() {
  return {
    name: "writing-tools",
    hooks: {
      "astro:config:setup": ({ addDevToolbarApp, config }) => {
        const entrypoint = fileURLToPath(
          new URL("./src/integrations/writing-tools/app.js", config.root)
        ).replaceAll("\\", "/");
        addDevToolbarApp({
          id: "writing-tools",
          name: "写作助手",
          icon: "✏️",
          entrypoint,
        });
      },
      "astro:server:setup": ({ server }) => {
        server.middlewares.use("/_writing", async (req, res) => {
          // 挂载点前缀已被剥离，这里的路径形如 "/new-post"
          if (req.method === "POST" && req.url?.startsWith("/new-post")) {
            const { title } = await readJson(req);
            const result = createPost(title);
            if (!result.ok) {
              send(res, result.slug ? 409 : 400, result);
              return;
            }
            send(res, 200, {
              ...result,
              previewUrl: `/posts/${result.slug}/`,
              vscodeUrl: toVscodeUrl(result.absPath),
            });
            return;
          }
          if (req.method === "POST" && req.url?.startsWith("/delete-post")) {
            const { slug } = await readJson(req);
            const result = deletePost(slug);
            send(res, result.ok ? 200 : 400, result);
            return;
          }
          if (req.method === "GET" && req.url?.startsWith("/posts")) {
            send(res, 200, {
              posts: listPosts().map(p => ({
                ...p,
                previewUrl: `/posts/${p.slug}/`,
              })),
            });
            return;
          }
          send(res, 404, { error: "unknown endpoint" });
        });
      },
    },
  };
}
