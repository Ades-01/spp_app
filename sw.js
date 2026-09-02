/* ============================================================================
 * Service Worker —— 供应商预审平台 PWA 核心
 * ----------------------------------------------------------------------------
 * 缓存版本：CACHE_VERSION 每次发布递增，键名版本化以支持旧缓存精确清理。
 * 策略组合：
 *   导航请求        Network First  → 断网回退缓存 index.html → 最终回退 offline.html
 *   App Shell       Cache First    （install 阶段预缓存，秒开）
 *   lib/ 懒加载库   Stale-While-Revalidate（先给缓存，后台更新）
 *   /api/ 数据接口  Network Only   （本地数据接口，不缓存）
 * 后台能力：
 *   Background Sync 事件 'spp-sync-data' → 通知页面执行局域网同步
 *   Notification 点击 → 聚焦/打开应用窗口
 *   页面 postMessage  → SKIP_WAITING 立即升级 / SHOW_NOTIFICATION 后台通知
 * 仅在安全上下文（https / localhost / 127.0.0.1）生效。
 * ==========================================================================*/
'use strict';

const CACHE_VERSION = 21;                       // 发布时递增，驱动整站缓存刷新（问卷设计器取消题目数量上限提示，改为中性无上限提示）
const CACHE = 'spp-cache-v' + CACHE_VERSION;

/* 固定采用离线优先缓存策略，避免运行时切换造成行为不一致。 */
let lastSyncTs = null;

/* App Shell：应用骨架，install 阶段预缓存。
 * 必须使用绝对路径：相对路径会以 sw.js 所在目录（/pwa/）为基准解析，
 * 导致缓存键变成 /pwa/index.html，导航 /index.html 永远 miss 而错误回退 offline.html。 */
const OFFLINE_LIBS = [
  '/lib/xlsx.full.min.js', '/lib/jspdf.umd.min.js', '/lib/jspdf.plugin.autotable.min.js',
  '/lib/html2canvas.min.js', '/lib/jszip.min.js'
];
const APP_SHELL = [
  '/index.html',
  '/pwa/offline.html',
  '/pwa/manifest.json',
  '/favicon.svg',
  '/app.bundle.css',
  '/app.bundle.js',
  '/pwa/icons/icon-192x192.png',
  '/pwa/icons/icon-512x512.png',
  '/pwa/icons/apple-touch-icon.png',
  '/pwa/icons/spp-brand.jpg'
  // 导出库（xlsx/jspdf/html2canvas）与地图底图为按需懒加载，由 SWR 策略命中后入缓存。
];

/* ---------- install：预缓存 App Shell 并立即进入等待激活 ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())           // 新版本立即生效，不等待旧页面关闭
  );
});

/* ---------- activate：清理全部旧版本缓存并接管所有客户端 ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---------- fetch：按资源类型 + 当前运行模式选择缓存策略 ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== location.origin) return;   // 其余跨域请求不拦截

  // 本地数据接口：仅网络（数据正确性优先，永不缓存）
  if (url.pathname.startsWith('/api/')) return;

  // 本地预打包离线瓦片（构建期下载的中国及周边关键层级）
  if (url.pathname.startsWith('/osm-tiles/')) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 所有应用资源统一采用离线优先策略：缓存命中立即返回，后台刷新。
  if (req.mode === 'navigate') {
    event.respondWith(offlineFirstNavigation(req));
    return;
  }
  event.respondWith(staleWhileRevalidate(req));
});

/* ---------- 离线优先缓存策略 ---------- */

// 在线优先：先网络，成功写缓存，失败回退缓存 → 离线页
function networkFirst(req) {
  return fetch(req)
    .then((res) => { cachePut(req, res.clone()); lastSyncTs = Date.now(); return res; })
    .catch(() => caches.match(req).then((hit) => hit || caches.match('/pwa/offline.html')));
}

// 离线优先（SWR）：先返回缓存，后台异步刷新并写回（未命中则走网络优先兜底）
function staleWhileRevalidate(req) {
  return caches.open(CACHE).then((cache) =>
    cache.match(req).then((cached) => {
      const fetching = fetch(req)
        .then((res) => { if (res && res.status === 200) { cache.put(req, res.clone()); lastSyncTs = Date.now(); } return res; })
        .catch(() => cached);
      return cached || fetching;
    })
  );
}

// 仅离线：完全从缓存读取，未命中返回离线页（不发起任何网络请求）
function cacheOnly(req) {
  return caches.match(req).then((hit) => hit || caches.match('/pwa/offline.html'));
}

// 仅离线导航：返回已缓存的 index.html（含查询串兼容），未命中回退离线页
function cacheOnlyNavigation(req) {
  return caches.match(req, { ignoreSearch: true })
    .then((hit) => hit || caches.match('/index.html'))
    .then((hit) => hit || caches.match('/pwa/offline.html'));
}

// 离线优先导航：先缓存后后台刷新
function offlineFirstNavigation(req) {
  return caches.open(CACHE).then((cache) =>
    cache.match(req, { ignoreSearch: true }).then((cached) => {
      const fetching = fetch(req)
        .then((res) => { if (res && res.status === 200) { cache.put(req, res.clone()); lastSyncTs = Date.now(); } return res; })
        .catch(() => cached || caches.match('/index.html').then((hit) => hit || caches.match('/pwa/offline.html')));
      return cached || fetching;
    })
  );
}

// 在线优先导航：网络优先 → 缓存 → 离线页
function networkFirstNavigation(req) {
  return fetch(req)
    .then((res) => { cachePut(req, res.clone()); lastSyncTs = Date.now(); return res; })
    .catch(() =>
      caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || caches.match('/index.html'))
        .then((hit) => hit || caches.match('/pwa/offline.html'))
    );
}

function cacheFirst(req) {
  return caches.match(req).then((cached) => {
    if (cached) return cached;
    return fetch(req).then((res) => { cachePut(req, res.clone()); return res; });
  });
}

function cachePut(req, res) {
  if (!res || res.status !== 200) return;
  caches.open(CACHE).then((c) => c.put(req, res));
}

/* ---------- Background Sync：网络恢复后触发页面执行局域网同步 ---------- */
self.addEventListener('sync', (event) => {
  if (event.tag !== 'spp-sync-data') return;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'sw-sync-request' }));
      })
  );
});

/* ---------- Push：预留服务器推送通道（当前离线架构使用本地通知） ---------- */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { /* 非 JSON 负载 */ }
  const title = data.title || '供应商预审平台';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: 'pwa/icons/icon-192x192.png',
      badge: 'pwa/icons/icon-192x192.png',
      tag: data.tag || 'spp-push',
      data: { url: (data.data && data.data.url) || '/index.html' }
    })
  );
});

/* ---------- 通知点击：聚焦已有窗口，否则新开窗口 ---------- */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const c of clients) {
          if ('focus' in c) { c.navigate(target); return c.focus(); }
        }
        return self.clients.openWindow(target);
      })
  );
});

/* ---------- 页面消息：缓存信息 / 清除缓存 / 立即升级 / 后台通知 ---------- */
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'PRECACHE_EXPORT_LIBS') {
    event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(OFFLINE_LIBS.map((url) => cache.add(url).then(() => ({ url: url, ok: true })).catch(() => ({ url: url, ok: false }))))).then((results) => {
      const payload = { type: 'PRECACHE_EXPORT_RESULT', results: results };
      if (event.ports[0]) event.ports[0].postMessage(payload);
      else self.clients.matchAll({ type: 'window' }).then((cls) => cls.forEach((c) => c.postMessage(payload)));
    }));
    return;
  }
  if (msg.type === 'GET_CACHE_INFO') {
    Promise.all([
      caches.has(CACHE) ? caches.open(CACHE).then((c) => c.keys()) : Promise.resolve([]),
      Promise.resolve([]),
      (navigator.storage && navigator.storage.estimate ? navigator.storage.estimate() : Promise.resolve({ usage: 0, quota: 0 }))
    ]).then((res) => {
      const appKeys = res[0], osmKeys = res[1], est = res[2];
      event.ports[0] ? event.ports[0].postMessage({
        type: 'CACHE_INFO', usage: est.usage || 0, quota: est.quota || 0,
        appEntries: appKeys.length, osmEntries: 0,
        lastSync: lastSyncTs ? new Date(lastSyncTs).toISOString() : null
      }) : (self.clients.matchAll({ type: 'window' }).then((cls) => cls.forEach((c) => c.postMessage({
        type: 'CACHE_INFO', usage: est.usage || 0, quota: est.quota || 0,
        appEntries: appKeys.length, osmEntries: 0,
        lastSync: lastSyncTs ? new Date(lastSyncTs).toISOString() : null
      }))));
    });
    return;
  }
  if (msg.type === 'CLEAR_CACHE') {
    // 清理后立即重建当前 App Shell，避免清缓存后本次会话失去离线能力。
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)))
        .then(() => { lastSyncTs = null; })
    );
    return;
  }
  if (msg.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (msg.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(msg.title || '供应商预审平台', {
        body: msg.body || '',
        icon: 'pwa/icons/icon-192x192.png',
        badge: 'pwa/icons/icon-192x192.png',
        tag: msg.tag || 'spp-local',
        data: { url: msg.url || 'index.html' }
      })
    );
  }
});
