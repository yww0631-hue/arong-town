# 阿绒小镇：源码与 GitHub 发布流程

本项目有两个入口：现有 Sites 预览使用 `app/page.tsx`；独立网站使用 `portable/main.tsx`。两者复用同一套游戏组件和图片。独立入口不需要 ChatGPT、Sites 登录、API 密钥、数据库或后端。

## 交付内容

- `arong-source.zip`：完整源码、图片、依赖锁文件、GitHub Actions 自动发布配置。
- `arong-static.zip`：已经构建的静态网站（index.html、assets、images），适合直接上传静态空间；无需安装 Node。
- 当前包含：电视入口、像素小镇、五个房间、面包车、商业街、周边店、服装店、照相馆。服装选择和收藏记录保存在各自浏览器本地，不跨设备同步。
- 周边店目前是展示与原图查看，没有支付或下单功能。

## 方式一：GitHub Desktop 上传源码并自动发布（推荐）

1. 解压 `arong-source.zip`。不要把 zip 本身作为网站文件上传。
2. 在 GitHub Desktop 选择 File → New repository，创建名为 `arong-town` 的本地仓库，默认分支用 `main`。
3. 把解压目录里的全部内容复制到仓库根目录，确认根目录直接有 `package.json`、`pnpm-lock.yaml`、`portable`、`public`，以及隐藏目录 `.github/workflows/pages.yml`。不要多套一层文件夹。
4. 在 GitHub Desktop 提交（Commit to main），然后 Publish repository。若使用 GitHub Free，创建公开仓库时取消 Keep this code private。公开仓库中的源码和图片也会公开。
5. 在 GitHub 仓库网页打开 Settings → Pages → Build and deployment → Source，选择 **GitHub Actions**。
6. 打开 Actions → **Publish Arong to GitHub Pages** → Run workflow，分支选 main。首次上传时如果 Pages 尚未设置导致失败，完成第5步后重新运行即可。
7. 等待 build 和 deploy 都变绿。在 Settings → Pages 点击 Visit site。该页面显示的地址才是你的实际独立网站地址。
8. 后续修改源码并推送 main，会自动重新构建发布。

工作流已经包含 Node 24、pnpm 11.19.0、安装锁定依赖、静态构建、上传和发布。无需填写任何访问令牌。资源使用相对路径，适用于普通仓库的子目录地址。

## 方式二：直接发布已构建静态文件（不用安装依赖）

1. 新建一个公开 GitHub 仓库，例如 `arong-static`。
2. 解压 `arong-static.zip`，通过 GitHub Desktop 将里面的全部内容提交到仓库根目录。必须直接看到 `index.html`、`assets/`、`images/` 和 `.nojekyll`。
3. Settings → Pages → Source 选择 **Deploy from a branch**，Branch 选择 main，Folder 选择 / (root)，点 Save。
4. 等待发布完成，在 Pages 页面打开 Visit site。

静态包也可上传到任意支持 HTML 静态文件的托管服务。不要在文件管理器中双击 index.html 作为运行验证，浏览器对 file:// 模块有限制，应使用网站服务访问。

## 本地开发（源码包）

安装 Node.js 24 和 pnpm 11.19.0，在项目目录运行：

```sh
npm install -g pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm dev:pages
```

浏览器打开命令输出的本地地址。构建独立网站：

```sh
pnpm build:pages
```

输出目录为 `pages-dist/`。不要上传 node_modules、.git、.env、.sites-runtime 或凭据。

## 常改的位置

- `components/YarnTown.tsx`：小镇、商业街、进门和乘车。
- `components/MerchShop.tsx`：年轻店员对话、商品原图、陈列位置。
- `components/PixelMerch.tsx`：五种像素商品的图集显示区域。
- `components/ClothingShop.tsx`、`OutfitContext.tsx`：试衣与外观保存。
- `components/PhotoStudio.tsx`：照相馆对话和照片查看。
- `public/images/merch-*.png`、`merch-charms.jpg`：此次周边素材。
- `app/globals.css`：样式。
- `vite.pages.config.ts`：独立网站构建配置。

## 排查

- GitHub 显示 README 而不是游戏：没有启用 Pages，或看的是仓库页面。打开 Settings → Pages → Visit site。
- 404：等待部署完成，核对 main 和根目录、Pages 的发布来源以及工作流结果。
- 图片空白：保持 images 目录完整及大小写不变；独立入口用 build:pages，不要把原始 TSX 当成静态网页上传。
- 自动发布失败：在 Actions 打开失败步骤。确认已启用 Pages，分支是 main，仓库允许 Actions。
- 国内或特定网络无法访问 github.io：GitHub Pages 的域名可达性取决于访问者网络；更换托管服务或使用自有域名需要另行配置，不能保证所有网络均可访问。

本次提供文件和发布流程，GitHub 仓库及最终地址由你发布后生成。

官方文档：
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
