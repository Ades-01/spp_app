/* ============================================================================
 * register-sw.js —— Service Worker 注册脚本（SPP 单仓发布版）
 * ----------------------------------------------------------------------------
 * 跨浏览器渐进增强：
 *   - 不支持 Service Worker（部分旧版 Safari/WebView）→ 静默降级为普通网页模式
 *   - 仅安全上下文（https / localhost / 127.0.0.1 / [::1]）注册，其余环境忽略
 *   - 捕获安装中（installing）新版本，就绪后提示用户刷新升级
 *   - 已被旧 SW 控制时，向 waiting worker 发送 SKIP_WAITING 立即接管
 * 路径按发布子目录自适应：GitHub Pages 默认位于 /<repo>/>/，原项目则位于 /。
 * ==========================================================================*/
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;   // 渐进增强：不支持则普通网页运行

  function isSecureContext() {
    return window.isSecureContext === true
      || location.protocol === 'https:'
      || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  }
  if (!isSecureContext()) return;

  // sw.js 物理位于 src/pwa/，运行时注册路径按当前页面的目录计算。
  function computeSwUrl() {
    var path = window.location.pathname;
    var base = path.substring(0, path.lastIndexOf('/') + 1); // 保留末尾斜杠
    return base + 'pwa/sw.js';
  }

  function computeScope() {
    var path = window.location.pathname;
    var base = path.substring(0, path.lastIndexOf('/') + 1);
    return base;
  }

  window.addEventListener('load', function () {
    var swUrl = computeSwUrl();
    var scope = computeScope();
    navigator.serviceWorker.register(swUrl, { scope: scope })
      .then(function (registration) {
        console.log('[PWA] Service Worker 注册成功，作用域:', registration.scope);
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        registration.addEventListener('updatefound', function () {
          var newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function () {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (typeof window.PWA !== 'undefined' && window.PWA.onNewWorkerReady) {
                window.PWA.onNewWorkerReady(registration);
              }
            }
          });
        });
      })
      .catch(function (err) {
        console.warn('[PWA] Service Worker 注册失败（应用仍可正常使用）:', err);
      });
  });
})();