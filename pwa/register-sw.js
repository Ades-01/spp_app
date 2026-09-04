/* ============================================================================
 * register-sw.js —— Service Worker 注册脚本（独立分发，随 pwa/ 整体拷贝）
 * ----------------------------------------------------------------------------
 * 跨浏览器渐进增强：
 *   - 不支持 Service Worker（部分旧版 Safari/WebView）→ 静默降级为普通网页模式
 *   - 仅安全上下文（https / localhost / 127.0.0.1 / [::1]）注册，其余环境忽略
 *   - 捕获安装中（installing）新版本，就绪后提示用户刷新升级
 *   - 已被旧 SW 控制时，向 waiting worker 发送 SKIP_WAITING 立即接管
 * 作用域固定为站点根 '/'，确保拦截所有请求（无论 pwa/sw.js 位于何处）。
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

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('pwa/sw.js', { scope: './' })
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
              // 新版本已就绪：交给 pwa.js 的 toast 提示，避免重复
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
