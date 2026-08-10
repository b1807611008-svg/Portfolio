# 素材管理

## 线上资源

`assets/` 只放 GitHub Pages 实际加载的优化文件：图片使用 WebP，视频使用 MP4 或 WebM。公开资源单个文件不超过 5 MB；详情页图片通过 `srcset` 根据显示宽度选择合适版本。

原始 PNG、GIF、JPG、设计源文件和高分辨率录屏不再放入此仓库。当前的原始备份位于仓库外的 `../Portfolio-source-assets`，因此不会被编辑器或 Git 扫描。

## 提交保护

首次在本地启用检查：

```sh
sh scripts/enable-git-hooks.sh
```

提交时，`.githooks/pre-commit` 会拦截 `assets/` 下的原始图像格式、设计源文件，以及超过 5 MB 的新增或修改资源。

## Git LFS

不要对 GitHub Pages 实际引用的 `assets/` 文件使用 Git LFS：Pages 不会将 LFS 对象作为站点静态资源提供。若需要协作保留 PSD、Figma 导出或原始录屏，请使用单独的源文件仓库并在那个仓库中配置 Git LFS，或继续使用 `Portfolio-source-assets` / 云盘备份。

## 一次性清理历史

当前工作区已移走原始素材，但旧提交中的大对象仍会保留在 `.git` 中。完成并推送本次优化资源后，使用一个新的镜像克隆执行历史重写；这会改变所有提交哈希，必须先通知协作者并确认备份存在：

```sh
git clone --mirror "$(git remote get-url origin)" Portfolio-clean.git
cd Portfolio-clean.git
git filter-repo --path-glob 'assets/**/*.png' --path-glob 'assets/**/*.gif' --path-glob 'assets/**/*.jpg' --path-glob 'assets/**/*.jpeg' --invert-paths
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force --mirror
```

安装 `git-filter-repo` 后再执行上述命令。历史重写和强制推送不会由本项目的脚本自动完成。
