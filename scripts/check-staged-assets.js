const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const forbiddenExtensions = new Set([
  ".png",
  ".gif",
  ".jpg",
  ".jpeg",
  ".psd",
  ".ai",
  ".fig",
  ".mov",
  ".avi",
  ".mkv",
]);
const maximumAssetBytes = 5 * 1024 * 1024;

const stagedFiles = execFileSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
  { encoding: "utf8" }
).split("\0").filter(Boolean);

const failures = [];
for (const file of stagedFiles) {
  if (!file.startsWith("assets/") || !fs.existsSync(file)) continue;

  const extension = path.extname(file).toLowerCase();
  const size = fs.statSync(file).size;
  if (forbiddenExtensions.has(extension)) {
    failures.push(`${file}: 请先转换为 WebP、MP4 或 WebM，再提交。`);
  }
  if (size > maximumAssetBytes) {
    failures.push(`${file}: ${(size / 1024 / 1024).toFixed(1)} MB，超过 5 MB 的公开素材上限。`);
  }
}

if (failures.length) {
  console.error("公开素材检查未通过：\n" + failures.join("\n"));
  process.exit(1);
}
