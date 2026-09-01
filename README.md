# SPP · 供应商预审平台（GitHub Pages 发布版）

> **Supplier Pre-Assessment Platform** — 渐进式 Web 应用（PWA），专为供应链合规审核与现场评估打造，支持完全离线使用、断点续填与局域网数据同步。

## 项目说明

本仓库为「供应商预审平台」的 GitHub Pages 发布版本。所有 PWA 资源（manifest、Service Worker、应用图标、离线回退页、应用 Shell 与懒加载库）已按单仓发布规范整理，可直接通过 GitHub Pages 或任意静态 HTTP 服务部署。

- **零后端运行**：完全运行在浏览器，所有审核问卷、供应商档案与现场照片均存储在浏览器 IndexedDB 中；
- **完全离线**：安装 PWA 后可断网使用，自动缓存 App Shell 与历史数据；
- **本地导出**：Word / PDF / Excel 报表在客户端生成，不依赖任何外部服务；
- **可选局域网同步**：在受信任局域网内可与 PC 服务端配对同步（仅需 HTTPS 或 localhost）。

## 目录结构

```
SPP/
├── index.html               # 应用入口（GitHub Pages 根）
├── register-sw.js           # Service Worker 注册脚本（按部署子目录自适应）
├── manifest.json            # Web App Manifest
├── app.bundle.js            # 应用主脚本（构建产物）
├── app.bundle.css           # 应用主样式（构建产物）
├── favicon.svg / favicon.jpg
├── lib/                     # 离线懒加载依赖（xlsx / jspdf / leaflet 等）
├── src/                     # 标准化的源代码目录（兼容 GitHub Pages 子路径）
│   ├── index.html           # 源代码版入口（路径相对）
│   ├── css/                 # 主样式
│   ├── js/                  # 主脚本
│   ├── icons/               # 应用图标
│   ├── images/              # 图片资源
│   ├── pwa/                 # Service Worker + 离线页 + manifest
│   ├── lib/                 # 离线懒加载依赖
│   ├── assets/              # 字体、静态 JSON
│   └── screenshots/         # 商店截图（PWA 描述）
└── pwa/                     # 兼容旧路径（manifest/offline/sw 等冗余备份，可选）
```

## 本地运行

任选一种静态服务器启动 SPP 目录：

```bash
# Node.js 简易服务
npx serve SPP
# Python 简易服务
cd SPP && python -m http.server 8080
```

然后访问：

http://localhost:3000（serve 默认端口）

或：

http://localhost:8080/

> 说明：Service Worker 仅在安全上下文（https、localhost、127.0.0.1）注册；通过 file:// 直接打开 index.html 时将自动降级为普通网页模式，离线缓存不可用。

## 部署到 GitHub Pages

1. 在 GitHub 创建新仓库（例如 `spp`），将本 SPP 目录的内容推送到 `main` 分支；
2. 进入仓库 `Settings → Pages`，将部署源设为 `main` 分支根目录（`/`）；
3. 等待 GitHub Actions / Pages 构建完成后，访问：

```
https://<用户名>.github.io/<仓库名>/
```

即可获得完整的 PWA 体验（含安装、离线缓存、本地通知）。

## PWA 合规性

- HTTPS：生产环境必须通过 HTTPS 提供（GitHub Pages 默认提供）；
- Web App Manifest：包含完整的应用名称、图标、主题色、快捷方式；
- Service Worker：已实现 App Shell 预缓存 + SWR + 离线回退 + Background Sync + 本地通知；
- 响应式设计：默认 mobile-first，桌面/平板/手机全适配。

## 反馈与许可证

本仓库作为离线审核工具发布，可作为内部部署或二次开发起点。如需商业授权请联系项目作者。
