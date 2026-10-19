import { execSync } from "node:child_process";

const message = process.argv.slice(2).join(" ").trim();
if (!message) {
  console.error('Usage: npm run publish "提交说明"');
  process.exit(1);
}

const run = cmd => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

if (!execSync("git status --porcelain").toString().trim()) {
  console.log("没有需要发布的变更。");
  process.exit(0);
}

run("git add -A");
run(`git commit -m ${JSON.stringify(message)}`);
run("git push");
console.log("✓ 已推送,GitHub Actions 将自动构建部署。");
