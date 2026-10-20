const esc = s =>
  String(s).replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]
  );

const CSS = `
  .wt { font-size: 13px; line-height: 1.5; min-width: 320px; max-width: 420px; }
  .wt h2 { font-size: 14px; font-weight: 600; margin: 0 0 8px; }
  .wt h3 { font-size: 12px; font-weight: 600; opacity: .7; margin: 14px 0 6px; }
  .wt-form { display: flex; gap: 6px; }
  .wt-form input {
    flex: 1; min-width: 0; padding: 6px 8px; font-size: 13px;
    color: inherit; background: rgba(127,127,127,.12);
    border: 1px solid rgba(127,127,127,.35); border-radius: 6px; outline: none;
  }
  .wt-form input:focus { border-color: rgba(120,160,255,.8); }
  .wt-btn {
    padding: 6px 10px; font-size: 13px; white-space: nowrap; cursor: pointer;
    color: #fff; background: #6d28d9; border: none; border-radius: 6px;
  }
  .wt-btn:hover { background: #7c3aed; }
  .wt-btn:disabled { opacity: .5; cursor: default; }
  .wt-msg { margin-top: 8px; font-size: 12px; }
  .wt-msg.err { color: #f87171; }
  .wt-result {
    margin-top: 8px; padding: 8px; border-radius: 6px;
    background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.35);
  }
  .wt-result .wt-actions { display: flex; gap: 8px; margin-top: 6px; }
  .wt-link {
    display: inline-block; padding: 4px 8px; font-size: 12px; border-radius: 5px;
    color: inherit; text-decoration: none;
    background: rgba(127,127,127,.15); border: 1px solid rgba(127,127,127,.35);
  }
  .wt-link:hover { background: rgba(127,127,127,.3); }
  .wt-list { list-style: none; margin: 0; padding: 0; max-height: 220px; overflow-y: auto; }
  .wt-list li {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 2px; border-top: 1px solid rgba(127,127,127,.15);
  }
  .wt-list li:first-child { border-top: none; }
  .wt-badge {
    flex-shrink: 0; padding: 1px 6px; font-size: 11px; border-radius: 999px;
  }
  .wt-badge.draft { color: #fbbf24; background: rgba(251,191,36,.15); }
  .wt-badge.pub { color: #4ade80; background: rgba(74,222,128,.12); }
  .wt-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wt-warn { flex-shrink: 0; color: #f87171; font-size: 11px; }
  .wt-empty { opacity: .6; font-size: 12px; }
  .wt-del {
    flex-shrink: 0; padding: 3px 7px; font-size: 12px; cursor: pointer;
    color: #f87171; background: none;
    border: 1px solid rgba(248,113,113,.4); border-radius: 5px;
  }
  .wt-del:hover { background: rgba(248,113,113,.15); }
  .wt-del:disabled { opacity: .4; cursor: default; }
`;

export default {
  id: "writing-tools",
  name: "写作助手",
  icon: "✏️",

  init(canvas) {
    const win = document.createElement("astro-dev-toolbar-window");
    win.innerHTML = `
      <style>${CSS}</style>
      <div class="wt">
        <h2>✏️ 写作助手</h2>
        <form class="wt-form">
          <input type="text" placeholder="输入文章标题，回车新建草稿…" autocomplete="off" />
          <button class="wt-btn" type="submit">新建文章</button>
        </form>
        <div class="wt-msg" hidden></div>
        <div class="wt-result" hidden></div>
        <h3>文章列表</h3>
        <ul class="wt-list"><li class="wt-empty">加载中…</li></ul>
      </div>
    `;
    canvas.appendChild(win);

    const form = win.querySelector(".wt-form");
    const input = win.querySelector("input");
    const button = win.querySelector(".wt-btn");
    const msg = win.querySelector(".wt-msg");
    const result = win.querySelector(".wt-result");
    const list = win.querySelector(".wt-list");

    const showMsg = (text, isErr) => {
      msg.textContent = text;
      msg.className = isErr ? "wt-msg err" : "wt-msg";
      msg.hidden = !text;
    };

    async function refreshList() {
      try {
        const res = await fetch("/_writing/posts");
        const { posts } = await res.json();
        if (!posts.length) {
          list.innerHTML = `<li class="wt-empty">还没有文章</li>`;
          return;
        }
        list.innerHTML = posts
          .map(
            p => `
            <li>
              <span class="wt-badge ${p.draft ? "draft" : "pub"}">${p.draft ? "草稿" : "已发布"}</span>
              <span class="wt-name" title="${esc(p.slug)}">${esc(p.title)}</span>
              ${!p.hasDescription ? `<span class="wt-warn">缺 description</span>` : ""}
              <a class="wt-link" href="${esc(p.previewUrl)}" target="_blank" rel="noreferrer">预览</a>
              ${p.draft ? `<button class="wt-del" data-slug="${esc(p.slug)}" data-title="${esc(p.title)}">删除</button>` : ""}
            </li>`
          )
          .join("");
      } catch {
        list.innerHTML = `<li class="wt-empty">列表加载失败</li>`;
      }
    }

    list.addEventListener("click", async e => {
      const btn = e.target.closest(".wt-del");
      if (!btn) return;
      const { slug, title } = btn.dataset;
      if (!window.confirm(`确定删除草稿「${title}」？\n此操作不可恢复。`)) return;
      btn.disabled = true;
      try {
        const res = await fetch("/_writing/delete-post", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json();
        if (!data.ok) {
          showMsg(`✗ ${data.error}`, true);
          btn.disabled = false;
          return;
        }
        showMsg(`✓ 已删除 ${slug}.md`, false);
        refreshList();
      } catch {
        showMsg("✗ 请求失败，请检查 dev server 日志", true);
        btn.disabled = false;
      }
    });

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) {
        showMsg("请输入标题", true);
        return;
      }
      button.disabled = true;
      showMsg("创建中…", false);
      result.hidden = true;
      try {
        const res = await fetch("/_writing/new-post", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title }),
        });
        const data = await res.json();
        if (!data.ok) {
          showMsg(`✗ ${data.error}`, true);
          return;
        }
        showMsg("", false);
        input.value = "";
        result.innerHTML = `
          ✓ 已创建 <b>${esc(data.slug)}.md</b>${data.fallback ? "（slug 为时间戳，建议重命名）" : ""}
          <div class="wt-actions">
            <a class="wt-link" href="${esc(data.vscodeUrl)}">在 VS Code 打开</a>
            <a class="wt-link" href="${esc(data.previewUrl)}" target="_blank" rel="noreferrer">预览文章</a>
          </div>
        `;
        result.hidden = false;
        refreshList();
        // 自动唤回 VS Code 并打开新文件（浏览器首次会询问，允许后无缝）
        window.location.href = data.vscodeUrl;
      } catch {
        showMsg("✗ 请求失败，请检查 dev server 日志", true);
      } finally {
        button.disabled = false;
        input.focus();
      }
    });

    refreshList();
  },
};
