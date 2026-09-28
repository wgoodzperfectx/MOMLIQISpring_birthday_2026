# 给妈妈的小宇宙

基于 React、Three.js 与 Hyper3D 模型制作的生日花园。支持鼠标与触摸旋转、缩放，以及三封加密信件。

## 本地运行

```bash
npm install
npm run dev
```

## 信件隐私

公开仓库只保存 `public/letters.enc.json` 密文。信件原文和家庭暗号保存在本机 `.private/`，该目录已被 Git 忽略。

修改 `.private/letters.json` 后，运行以下命令重新生成密文：

```bash
npm run encrypt:letters
```

请不要提交 `.private/`，也不要把暗号写入源码或 GitHub Actions。

## 部署

推送到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。
