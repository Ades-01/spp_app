
/* ===== src/js/util.js ===== */
/* 通用工具函数 */
(function (global) {
  const Util = {};

  // ===== 运行环境检测（SUP-029：安卓端专用逻辑入口）=====
  // 判定当前是否运行在 Capacitor APK 内嵌 WebView 中。
  // 只认 APK 专有标记（window.Capacitor / androidBridge / cordova），避免误伤手机浏览器。
  Util.isAndroidApp = function () {
    // 显示化测试/预览开关：URL 带 ?androidPreview=1 时强制启用安卓端界面
    // （仅开发/测试预览用；生产 Web/PC 不携带该参数，行为不受影响）
    try {
      if (global.location && /[?&]androidPreview=1/.test(global.location.search || '')) return true;
    } catch (e) {}
    try {
      if (global.Capacitor && typeof global.Capacitor.isNativePlatform === 'function') {
        try { if (global.Capacitor.isNativePlatform()) return true; } catch (e) {}
      }
      if (global.androidBridge) return true;
      if (global.cordova) return true;
      // Capacitor 原生 WebView 的 UA 通常带 "Capacitor"，但更稳的是上面的桥标记
      if (global.navigator && /android/i.test(global.navigator.userAgent || '') && global.Capacitor) return true;
    } catch (e) {}
    return false;
  };
  Util.isAndroid = Util.isAndroidApp; // 别名

  Util.uid = function (prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  Util.esc = function (s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  Util.fmtDate = function (d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    const p = (n) => (n < 10 ? '0' + n : n);
    return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate());
  };

  Util.fmtDateTime = function (d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    const p = (n) => (n < 10 ? '0' + n : n);
    return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate()) + ' ' + p(dt.getHours()) + ':' + p(dt.getMinutes());
  };

  // 创建元素
  Util.el = function (tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k === 'text') e.textContent = attrs[k];
        else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
        else if (k === 'dataset') { for (const d in attrs[k]) e.dataset[d] = attrs[k][d]; }
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null) return;
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return e;
  };

  Util.toast = function (msg, type) {
    const root = document.getElementById('toastRoot');
    if (!root) return;
    const t = Util.el('div', { class: 'toast ' + (type || ''), role: type === 'err' ? 'alert' : 'status', 'aria-live': type === 'err' ? 'assertive' : 'polite', text: msg });
    root.appendChild(t);
    const duration = type === 'err' ? 4200 : type === 'warn' ? 3600 : 2800;
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-6px)'; t.style.transition = 'opacity .3s,transform .3s'; setTimeout(() => t.remove(), 300); }, duration);
  };

  // 简单确认弹窗（返回 Promise<bool>）
  Util.confirm = function (title, body, okText) {
    return new Promise((resolve) => {
      const root = document.getElementById('modalRoot');
      root.innerHTML = '';
      const mask = Util.el('div', { class: 'modal-mask' });
      const modal = Util.el('div', { class: 'modal' });
      modal.appendChild(Util.el('div', { class: 'modal-head' }, [
        Util.el('h3', { text: title }),
        Util.el('button', { class: 'x-close', onclick: () => { root.innerHTML = ''; resolve(false); } }, '×')
      ]));
      modal.appendChild(Util.el('div', { class: 'modal-body', html: body || '' }));
      const foot = Util.el('div', { class: 'modal-foot' });
      foot.appendChild(Util.el('button', { class: 'btn', onclick: () => { root.innerHTML = ''; resolve(false); } }, T('取消')));
      foot.appendChild(Util.el('button', { class: 'btn btn-danger', onclick: () => { root.innerHTML = ''; resolve(true); } }, okText || T('确认')));
      modal.appendChild(foot);
      mask.appendChild(modal);
      root.appendChild(mask);
    });
  };

  // 通用模态（自定义内容，content 为 DOM 节点；footerButtons 数组）
  Util.modal = function (title, contentNode, footerButtons, opts) {
    opts = opts || {};
    const root = document.getElementById('modalRoot');
    root.innerHTML = '';
    const mask = Util.el('div', { class: 'modal-mask' + (opts.wide ? ' modal-wide' : '') });
    const modal = Util.el('div', { class: 'modal' });
    modal.appendChild(Util.el('div', { class: 'modal-head' }, [
      Util.el('h3', { text: title }),
      Util.el('button', { class: 'x-close', onclick: () => { root.innerHTML = ''; if (typeof opts.onClose === 'function') opts.onClose(); } }, '×')
    ]));
    const body = Util.el('div', { class: 'modal-body' });
    body.appendChild(contentNode);
    modal.appendChild(body);
    if (footerButtons && footerButtons.length) {
      const foot = Util.el('div', { class: 'modal-foot' });
      footerButtons.forEach((b) => foot.appendChild(b));
      modal.appendChild(foot);
    }
    mask.appendChild(modal);
    root.appendChild(mask);
    return { close: () => { root.innerHTML = ''; } };
  };

  Util.download = function (blob, filename) {
    try {
      const url = URL.createObjectURL(blob);
      const a = Util.el('a', { href: url, download: filename });
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) {} }, 1500);
    } catch (e) {
      // 兜底：部分浏览器对超大数据使用 blob URL 下载会失败，改用 data URL
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const a = Util.el('a', { href: reader.result, download: filename });
          document.body.appendChild(a); a.click();
          setTimeout(() => { try { document.body.removeChild(a); } catch (e2) {} }, 1500);
        };
        reader.onerror = () => Util.toast(T('文件导出失败：') + (e.message || T('未知错误')), 'err');
        reader.readAsDataURL(blob);
      } catch (e2) { Util.toast(T('文件导出失败：') + (e2.message || T('未知错误')), 'err'); }
    }
  };

  // 供应商自定义字段的取值展示（列表/PDF/Excel 共用）
  Util.fmtFacVal = function (field, val) {
    if (val === null || val === undefined || val === '') return '—';
    if (field && field.type === 'yesno') return (val === true || val === 'true' || val === '是') ? T('是') : T('否');
    return String(val);
  };

  // 供应商字段类型中文名
  Util.facTypeLabel = function (t) {
    return { text: T('文本'), textarea: T('长文本'), number: T('数字'), date: T('日期'), yesno: T('是否'), select: T('单选'), email: T('邮箱') }[t] || t || T('文本');
  };

  // 问题等级（风险/重要性分级）—— 存储中文 key，渲染时再翻译，保证切换语言后实时生效
  Util.Q_LEVELS = [
    { v: 'critical', key: '红线/严重', descKey: '不可接受，必须立即纠正', color: '#e5484d', weight: 3 },
    { v: 'major', key: '重大', descKey: '重要不符合项，需限期整改', color: '#f5821f', weight: 2 },
    { v: 'minor', key: '一般', descKey: '轻微不符合 / 关注项', color: '#3b82f6', weight: 1 },
    { v: 'suggest', key: '建议', descKey: '改进建议项', color: '#8a94a6', weight: 0 }
  ];
  Util.levelInfo = function (v) {
    const base = Util.Q_LEVELS.find((x) => x.v === v) || Util.Q_LEVELS[2]; // 默认“一般”
    return { v: base.v, color: base.color, weight: base.weight, t: T(base.key), desc: T(base.descKey) };
  };
  // 等级徽标 DOM（浅底 + 彩色字 + 描边）
  Util.levelTag = function (v, opts) {
    const i = Util.levelInfo(v);
    const o = opts || {};
    const el = Util.el('span', { class: 'lvl-tag', text: (o.prefix || '') + i.t });
    el.style.background = i.color + '1f';
    el.style.color = i.color;
    el.style.border = '1px solid ' + i.color + '55';
    return el;
  };

  // 统一社会信用代码校验：GB 32100-2015，18 位，前 17 位为数字与大写字母（不含 I/O/Z/S/V），末位为数字或 X
  Util.validateCreditCode = function (code) {
    const s = (code || '').trim().toUpperCase();
    return /^[0-9A-HJ-NPQRTUWXY]{17}[0-9X]$/.test(s);
  };

  // 自定义风险等级（高/中/低）——用于报告"风险情况"章节与下拉选择；标签在调用时翻译，避免模块加载顺序问题
  Util.RISK_LEVELS = [
    { v: 'high', color: '#dc3a36' },
    { v: 'mid', color: '#d98a00' },
    { v: 'low', color: '#3a56d4' }
  ];
  Util.riskLevelInfo = function (v) {
    const base = Util.RISK_LEVELS.find((x) => x.v === v);
    if (!base) return { v: v, t: T('未评定风险'), color: '#8a94a6' };
    const labelMap = { high: T('高风险'), mid: T('中风险'), low: T('低风险') };
    return { v: base.v, t: labelMap[base.v], color: base.color };
  };

  // 将图片文件读取并等比缩放为 dataURL（控制体积，避免评论图片撑爆本地数据库）
  Util.resizeImageFile = function (file, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w >= h) { h = Math.round(h * maxDim / w); w = maxDim; }
            else { w = Math.round(w * maxDim / h); h = maxDim; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality || 0.82));
        };
        img.onerror = () => reject(new Error(T('图片解码失败')));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error(T('读取文件失败')));
      reader.readAsDataURL(file);
    });
  };

  // 搜索高亮：HTML 转义后，将匹配片段包裹 <mark>
  // 返回安全的 HTML 字符串（文本已转义，<mark> 标签为内置）
  Util.highlight = function (text, q) {
    const s = Util.esc(text == null ? '' : text);
    if (!q || !String(q).trim()) return s;
    const qe = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      return s.replace(new RegExp('(' + qe + ')', 'gi'), '<mark>$1</mark>');
    } catch (e) { return s; }
  };

  // 轻量"使用说明"标记渲染：# 小标题 / - 或 • 列表 / **加粗**；其余按段落，文本已转义防 XSS
  Util.renderUsageMarkdown = function (src) {
    if (!src) return '';
    const inline = (s) => {
      let t = Util.esc(s);
      t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      return t;
    };
    const blocks = src.replace(/\r\n/g, '\n').split(/\n{2,}/);
    return blocks.map((block) => {
      const lines = block.split('\n').filter((l) => l.trim() !== '');
      if (!lines.length) return '';
      if (/^\s*#\s+/.test(block)) {
        return '<h3 class="usage-h">' + inline(block.replace(/^\s*#\s+/, '')) + '</h3>';
      }
      if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
        return '<ul class="usage-ul">' + lines.map((l) => '<li>' + inline(l.replace(/^\s*[-•]\s+/, '')) + '</li>').join('') + '</ul>';
      }
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
  };

  // 小输入框弹窗：返回 Promise<string|null>（确定返回 trimmed 文本，取消/关闭返回 null）
  Util.ask = function (title, placeholder, defValue) {
    return new Promise((resolve) => {
      const root = document.getElementById('modalRoot');
      if (!root) { resolve(prompt(title, defValue || '')); return; }
      root.innerHTML = '';
      const mask = Util.el('div', { class: 'modal-mask' });
      const modal = Util.el('div', { class: 'modal' });
      modal.appendChild(Util.el('div', { class: 'modal-head' }, [
        Util.el('h3', { text: title }),
        Util.el('button', { class: 'x-close', onclick: () => { root.innerHTML = ''; resolve(null); } }, '×')
      ]));
      const input = Util.el('input', { type: 'text', class: 'inp', placeholder: placeholder || '', value: defValue || '' });
      modal.appendChild(Util.el('div', { class: 'modal-body' }, [input]));
      const foot = Util.el('div', { class: 'modal-foot' });
      foot.appendChild(Util.el('button', { class: 'btn', onclick: () => { root.innerHTML = ''; resolve(null); } }, T('取消')));
      foot.appendChild(Util.el('button', { class: 'btn btn-primary', onclick: () => { root.innerHTML = ''; resolve(input.value.trim()); } }, T('确定')));
      modal.appendChild(foot);
      mask.appendChild(modal);
      root.appendChild(mask);
      setTimeout(() => { try { input.focus(); } catch (e) {} }, 30);
    });
  };

  // 简笔画图标系统：与导航风格一致的线性 SVG（fill none / stroke currentColor）
  const ICON_PATHS = {
    eye: '<path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M10.7 5.1A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a17.6 17.6 0 0 1-3.2 4M6.6 6.6A17.3 17.3 0 0 0 1.5 12S5 19 12 19a10.8 10.8 0 0 0 5.4-1.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/>',
    pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 10v6M14 10v6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
    up: '<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 13l4 4L19 7"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L7 20"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>',
    shield: '<path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
    database: '<ellipse cx="12" cy="5" rx="7.5" ry="3"/><path d="M4.5 5v7c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V5M4.5 12v7c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-7"/>',
    folder: '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5Z"/>'
  };
  Util.icon = function (name) {
    const p = ICON_PATHS[name] || '';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  };
  Util.iconEl = function (name) {
    const s = document.createElement('span');
    s.className = 'ico';
    s.innerHTML = Util.icon(name);
    return s;
  };

  // 安全取得模块题目（兼容无 questions 字段的模块）
  Util.moduleQuestions = function (mod) { return (mod && mod.questions) || []; };

  // 集中化关闭模态：统一销毁 modalRoot 内所有节点，消除各模块重复书写
  Util.closeModal = function () {
    const root = document.getElementById('modalRoot');
    if (root) root.innerHTML = '';
  };

  // 防抖：高频事件（如 input）只触发一次，降低频繁持久化带来的性能损耗
  Util.debounce = function (fn, wait) {
    let t = null;
    return function () {
      const ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(() => { try { fn.apply(ctx, args); } catch (e) { console.error('debounce 执行异常', e); } }, wait);
    };
  };

  // 通用运行时懒加载：将重量级第三方库（xlsx/jspdf/html2canvas 等）延迟到使用时加载，
  // 避免随首屏同步下载。每次调用幂等，重复请求直接复用进行中的 Promise。
  // spec: { src, check(global)->bool }  —— check 返回 true 表示库已就绪。
  Util.loadLib = function (spec) {
    const id = spec && spec.src;
    if (!id) return Promise.reject(new Error('loadLib: 缺少 src'));
    if (Util._libPromises && Util._libPromises[id]) return Util._libPromises[id];
    if (!Util._libPromises) Util._libPromises = {};
    const p = new Promise(function (resolve, reject) {
      if (spec.check && spec.check(global)) return resolve(true);
      const s = document.createElement('script');
      s.src = spec.src;
      s.async = true;
      s.onload = function () { resolve(true); };
      s.onerror = function () { Util._libPromises[id] = null; reject(new Error('库加载失败：' + spec.src)); };
      (document.head || document.body).appendChild(s);
    });
    Util._libPromises[id] = p;
    return p;
  };
  // 便捷：一次加载多个库（按序等待）
  Util.loadLibs = function (specs) {
    return specs.reduce(function (chain, spec) { return chain.then(function () { return Util.loadLib(spec); }); }, Promise.resolve());
  };

  // ===== SUP-032 安卓原生能力封装（Filesystem 存储 / 权限 / 横竖屏辅助）=====
  // 仅在 Capacitor APK 内有效；Web/PC 自动降级为下载，不影响既有行为。
  Util.isNative = function () {
    return !!(global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.Filesystem);
  };

  /**
   * 申请安卓存储权限（写 Documents / ExternalStorage 所需）。
   * @returns {Promise<boolean>} 是否已授权（或本环境无需授权）
   *
   * SUP-044b 修复：不再依赖 requestPermissions 的返回值结构（Android 版本/权限 key
   * 差异大，空对象或无关 key 会误判为"未授权"导致报错），改为实际写入验证——
   * 能成功写入即视为有权限，权限不足时自动回退应用私有目录（无需权限）。
   */
  Util.requestAndroidStorage = function () {
    if (!Util.isNative()) return Promise.resolve(true);
    const FS = global.Capacitor.Plugins.Filesystem;
    // 先请求运行时权限（存在则调用，兼容 Android ≤10 的写外部存储）
    var req = Promise.resolve();
    if (typeof FS.requestPermissions === 'function') {
      try { req = FS.requestPermissions().catch(function () { return {}; }); } catch (e) { req = Promise.resolve({}); }
    }
    return req.then(function () {
      // 实际写入验证：在应用私有目录（无需权限）建测试文件，验证 Filesystem 可用
      var testPath = '.spp_permission_test_' + Date.now();
      return FS.writeFile({ path: testPath, directory: 'DATA', data: 'ok' }).then(function () {
        // 清理测试文件
        try { FS.deleteFile({ path: testPath, directory: 'DATA' }); } catch (e) {}
        return true;
      }).catch(function () {
        return false;
      });
    });
  };

  /**
   * 将 dataURL/文本保存到安卓本地文件夹（Documents/供应商预审平台/<subdir>/）。
   * 优先写入公共 Documents；若权限不足（Android 作用域存储限制）则自动降级到应用私有目录
   * （Internal/android/data/<pkg>/files/），保证导出不报错。
   * 返回 {saved, path?, dir?, fallback?}；非原生环境降级为浏览器下载。
   * @param {string} dataUrlOrText  - 'data:...' 或纯文本内容
   * @param {string} filename       - 含扩展名的文件名
   * @param {string} [subdir]       - 子目录名（如 '报告'/'照片'），缺省为根
   */
  Util.androidSaveFile = function (dataUrlOrText, filename, subdir) {
    // 非原生 → 浏览器下载
    if (!Util.isNative()) {
      let blob;
      if (typeof dataUrlOrText === 'string' && dataUrlOrText.indexOf('data:') === 0) {
        const m = dataUrlOrText.match(/^data:([^;,]+);base64,(.*)$/);
        if (m) {
          const bin = atob(m[2]); const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          blob = new Blob([arr], { type: m[1] });
        }
      }
      if (!blob) blob = new Blob([dataUrlOrText], { type: 'text/plain' });
      Util.download(blob, filename);
      return Promise.resolve({ saved: true, downloaded: true });
    }
    const FS = global.Capacitor.Plugins.Filesystem;
    const base = (subdir || '').trim();
    let data = dataUrlOrText, encoding;
    if (typeof dataUrlOrText === 'string' && dataUrlOrText.indexOf('data:') === 0) {
      const m = dataUrlOrText.match(/^data:([^;,]+);base64,(.*)$/);
      if (m) { data = m[2]; encoding = 'base64'; }
    }

    // 写公共 Documents（优先；失败则降级应用私有目录）
    function writePublic() {
      const dir = base ? '供应商预审平台/' + base : '供应商预审平台';
      return Util.requestAndroidStorage().then(function () {
        return FS.mkdir({ path: dir, directory: 'DOCUMENTS', recursive: true })
          .catch(function () { /* 目录已存在可忽略 */ })
          .then(function () {
            return FS.writeFile({
              path: (base ? '供应商预审平台/' + base + '/' : '供应商预审平台/') + filename,
              directory: 'DOCUMENTS',
              data: data,
              encoding: encoding
            });
          })
          .then(function (res) {
            const path = (res && res.uri) || (res && res.path);
            return { saved: true, path: path, dir: 'Documents/' + dir };
          });
      });
    }
    // 写应用私有目录（无需权限，总可用）——公共 Documents 失败时兜底
    function writePrivate() {
      const dir = base ? '供应商预审平台/' + base : '供应商预审平台';
      return FS.mkdir({ path: dir, directory: 'DATA', recursive: true })
        .catch(function () { /* 目录已存在可忽略 */ })
        .then(function () {
          return FS.writeFile({
            path: (base ? '供应商预审平台/' + base + '/' : '供应商预审平台/') + filename,
            directory: 'DATA',
            data: data,
            encoding: encoding
          });
        })
        .then(function (res) {
          const path = (res && res.uri) || (res && res.path);
          return { saved: true, path: path, dir: 'AppData/' + dir, fallback: true };
        });
    }

    return writePublic().catch(function (e) {
      // 公共 Documents 写入失败 → 自动降级应用私有目录，不报错阻断
      return writePrivate().catch(function (e2) {
        throw new Error((e && e.message) || (e2 && e2.message) || 'write fail');
      });
    });
  };

  /**
   * 照片展示样式（SUP-034：已取消安卓端拍照强制横向显示，照片统一为 1280×720 横图，
   * 恢复原样展示，不再旋转。此处保留空实现以兼容历史调用点。）
   * @returns {string}  始终返回空字符串
   */
  Util.photoIsPortrait = function () { return false; };
  Util.photoOrientationStyle = function () { return ''; };

  global.Util = Util;
})(window);

/* ===== src/js/i18n.js ===== */
/* 多语言（中文 / English）切换
 * - 以"中文原文"作为 T() 的 key；英文由 EN 字典提供。
 * - 未提供英文翻译时，T() 回退显示中文原文，避免界面出现空白。
 * - 语言偏好持久化到 localStorage（主）与 settings.lang（副本）。
 */
(function (global) {
  const I18N = { lang: 'zh', _onChange: [] };

  // 英文翻译字典：key 为中文原文，value 为英文。
  const EN = {
    // ===== 导航 / 视图标题 =====
    '工作台': 'Workspace',
    '仪表盘': 'Dashboard',
    '问卷设计': 'Questionnaire Design',
    '供应商登记': 'Supplier Registry',
    '评估填写': 'Assessment',
    '标准/法规': 'Standards / Regulations',
    '数据导出': 'Data Export',
    '模板管理': 'Template Center',
    '设置 / 备份': 'Settings / Backup',
    '系统管理': 'System',
    '管理员后台': 'Admin Console',

    // ===== 顶栏 / 品牌 =====
    '供应商预审报告': 'Supplier Pre-Assessment Report',
    '供应商预审平台': 'Supplier Pre-Assessment Platform',
    '欢迎使用供应商预审平台': 'Welcome to Supplier Pre-Assessment Platform',
    '供应商预审 · 问卷设计 · 评估填写 · 报告导出 · 全程本地存储': 'Pre-assessment · Questionnaires · Assessments · Reports · Fully local storage',
    '供应商预审平台数据备份_': 'SPP_Data_Backup_',
    '供应商预审报告_': 'Pre-Assessment_Report_',
    '供应商预审报告数据_': 'Pre-Assessment_Data_',
    '退出登录': 'Sign Out',
    '本地数据库：--': 'Local DB: --',
    '数据仅存储于本机浏览器 (IndexedDB)': 'Data is stored only in this browser (IndexedDB)',

    // ===== 通用按钮 =====
    '取消': 'Cancel',
    '确定': 'OK',
    '创建': 'Create',
    '保存': 'Save',
    '保存修改': 'Save Changes',
    '添加': 'Add',
    '编辑': 'Edit',
    '删除': 'Delete',
    '完成': 'Done',
    '关闭': 'Close',
    '返回': 'Back',
    '← 返回列表': '← Back to List',
    '恢复默认': 'Restore Default',
    '预览：': 'Preview:',
    '知道了': 'Got it',

    // ===== 状态 / 等级 =====
    '已完成': 'Completed',
    '草稿': 'Draft',
    '启用': 'Enabled',
    '停用': 'Disabled',
    '管理员': 'Admin',
    '普通用户': 'User',
    '我': 'Me',
    '全部': 'All',
    '优': 'Excellent',
    '良': 'Good',
    '中': 'Fair',
    '差': 'Poor',
    '是': 'Yes',
    '否': 'No',
    '必填': 'Required',
    '未分类': 'Uncategorized',
    '全部等级': 'All Tiers',

    // ===== 仪表盘 =====
    '供应商总数': 'Total Suppliers',
    '问卷模板': 'Questionnaire Templates',
    '评估记录': 'Assessments',
    '平均合规评分': 'Avg. Compliance Score',
    '个': '',
    '套': '',
    '份': '',
    '最近评估': 'Recent Assessments',
    '登记供应商': 'Register Supplier',
    '新建评估': 'New Assessment',
    '还没有评估记录。流程：先在「供应商登记」添加被审核对象 → 在「问卷设计」定制问卷 → 在「评估填写」中作答 → 在「数据导出」生成报告。':
      'No assessments yet. Workflow: register a supplier → design a questionnaire → fill an assessment → export the report.',
    '供应商': 'Supplier',
    '问卷': 'Questionnaire',
    '审核员': 'Auditor',
    '日期': 'Date',
    '评分': 'Score',
    '状态': 'Status',
    '附件/版本': 'Attach / Versions',
    '操作': 'Actions',

    // ===== 设置 / 备份 =====
    '设置 / 数据备份': 'Settings / Data Backup',
    '配置报告抬头，并可将全部数据导出为 JSON 备份或导入恢复。':
      'Configure the report header, and export all data as a JSON backup or restore from one.',
    '报告与机构信息': 'Report & Organization',
    '机构 / 组织名称': 'Organization Name',
    '默认审核员': 'Default Auditor',
    '报告标题': 'Report Title',
    '数据管理': 'Data Management',
    '所有数据仅保存在本机浏览器的本地数据库（IndexedDB）。请定期导出 JSON 备份，避免清理浏览器数据导致丢失。':
      'All data is kept in this browser’s local database (IndexedDB). Export a JSON backup regularly to avoid loss when clearing browser data.',
    '⇩ 导出 JSON 备份': '⇩ Export JSON Backup',
    '⇧ 导入 JSON 恢复': '⇧ Import JSON Restore',
    '清空全部数据': 'Clear All Data',
    '备份已导出（含附件与版本）': 'Backup exported (with attachments & versions)',
    '备份失败：': 'Backup failed: ',
    '数据已恢复': 'Data restored',
    '导入失败：': 'Import failed: ',
    '此操作将删除<b>所有</b>供应商、问卷与评估记录，且不可恢复。建议先导出备份。确认清空？':
      'This will permanently delete <b>all</b> suppliers, questionnaires and assessments, and cannot be undone. Export a backup first. Confirm clearing?',
    '确认清空': 'Confirm Clear',
    '已清空，已恢复默认模板': 'Cleared; default templates restored',

    // ===== 存储 / 零数据库（新增） =====
    '数据存储位置': 'Data Storage Location',
    '存储模式': 'Storage Mode',
    '存储位置': 'Storage Path',
    '已用空间': 'Used Space',
    'JSON 文件（零数据库）': 'JSON Files (Zero-DB)',
    '浏览器本地 (IndexedDB)': 'Browser Local (IndexedDB)',
    '新数据目录绝对路径': 'Absolute path of new data directory',
    '迁移数据到该目录': 'Migrate data to this directory',
    '备份到文件夹': 'Backup to Folder',
    '数据以 JSON/文件形式自主存储，复制该目录即可备份与迁移；「备份到文件夹」需浏览器支持文件夹选择（File System Access API），否则自动降级为下载。':
      'Data is stored as JSON/files that you fully own — copy the directory to back up or migrate. “Backup to Folder” needs a browser with the File System Access API, otherwise it falls back to a download.',
    '当前以 file:// 打开，已降级为浏览器本地存储；运行内置轻量后端可启用文件夹选择与离线加速。':
      'Opened via file:// — fell back to browser-local storage. Run the built-in lightweight backend to enable folder picking and offline acceleration.',
    '正在使用浏览器本地存储（IndexedDB）；如需数据以 JSON 文件自主存储，请运行内置轻量后端。':
      'Using browser-local storage (IndexedDB). Run the built-in lightweight backend to store data as JSON files under your control.',
    '数据以 JSON 文件自主存储于：': 'Data stored as JSON files at: ',
    '当前浏览器不支持文件夹选择（File System Access API），备份将使用下载目录。':
      'This browser lacks folder-picking support (File System Access API); backups will use the Downloads folder.',
    '当前为浏览器本地存储模式，运行内置轻量后端后可设置数据目录': 'Currently in browser-local mode; run the built-in backend to set a data directory',
    '数据已迁移至：': 'Data migrated to: ',
    '迁移失败：': 'Migration failed: ',
    '已备份到所选文件夹': 'Backed up to the selected folder',
    '存储：': 'Storage: ',
    'JSON 文件': 'JSON files',
    '浏览器本地': 'Browser local',
    '正在加载离线地图资源…': 'Loading offline map resources…',
    '地图资源加载失败：': 'Map resource load failed: ',
    '轻量后端已启动，数据以 JSON 文件自主存储于：': 'Lightweight backend running; data stored as JSON files at: ',

    // ===== 认证 =====
    '用户名': 'Username',
    '密码': 'Password',
    '显示名称': 'Display Name',
    '确认密码': 'Confirm Password',
    '登 录': 'Sign In',
    '注册新账户': 'Register',
    '创建管理员账户': 'Create Admin Account',
    '注册并登录': 'Register & Sign In',
    '登录': 'Sign In',
    '用于登录，创建后不可修改': 'Used to sign in; cannot be changed after creation',
    '留空则使用用户名': 'Blank uses the username',
    '两次输入的密码不一致': 'The two passwords do not match',
    '首次使用 · 创建管理员账户': 'First Use · Create Admin Account',
    '登录到工作台': 'Sign in to the workspace',
    '本机首个账户将作为系统管理员，可管理其他用户与系统数据。账户与密码仅保存在本机浏览器。':
      'The first account on this device becomes the system administrator and can manage users and data. Credentials are stored only in this browser.',
    '首次使用请切换到「注册新账户」创建管理员。账户数据仅存储于本机浏览器（IndexedDB），不上传服务器。':
      'First time? Switch to “Register” to create the admin account. Account data is stored only in this browser (IndexedDB), never uploaded.',
    '新建用户': 'New User',
    '角色': 'Role',
    '初始密码（至少 6 位）': 'Initial Password (≥6 chars)',
    '登录用户名（≥3 位）': 'Login username (≥3 chars)',
    '显示名称（可选）': 'Display name (optional)',
    '为 {0} 设置新密码': 'Set a new password for {0}',
    '用户已创建': 'User created',
    '创建失败': 'Creation failed',
    '用户不存在': 'User not found',
    '修改角色': 'Change Role',
    '将用户 <b>{0}</b> 的角色改为 <b>{1}</b>？': 'Change the role of <b>{0}</b> to <b>{1}</b>?',
    '确认修改': 'Confirm Change',
    '角色已更新': 'Role updated',
    '更改账户状态': 'Change Account Status',
    '停用用户 <b>{0}</b>？': 'Disable user <b>{0}</b>?',
    '启用用户 <b>{0}</b>？': 'Enable user <b>{0}</b>?',
    '确认': 'Confirm',
    '状态已更新': 'Status updated',
    '重置密码': 'Reset Password',
    '新密码（至少 6 位）': 'New password (≥6 chars)',
    '密码已重置': 'Password reset',
    '删除用户': 'Delete User',
    '确认删除用户 <b>{0}</b>？该操作不可恢复。': 'Delete user <b>{0}</b>? This cannot be undone.',
    '已删除': 'Deleted',
'页面加载失败': 'Failed to load this page',
    '页面加载失败，请重试': 'Page failed to load — please retry',
    '重试': 'Retry',
    '用户名不能为空': 'Username cannot be empty',
    '密码长度至少 6 位': 'Password must be at least 6 characters',
    '该用户名已被使用': 'This username is already taken',
    '角色无效': 'Invalid role',
    '用户名或密码错误': 'Incorrect username or password',
    '该账户已被停用，请联系管理员': 'This account is disabled; contact the administrator',
    '不能删除当前登录的账户': 'Cannot delete the account you are signed in with',
    '至少需保留一名管理员，无法删除最后一名管理员': 'At least one admin is required; the last admin cannot be deleted',
    '用户总数': 'Total Users',
    '供应商数量': 'Suppliers',
    '管理系统用户账户，并查看本机数据概览。': 'Manage user accounts and view an overview of local data.',
    '用户账户': 'User Accounts',
    '创建时间': 'Created',
    '最近登录': 'Last Sign-in',
    '从未': 'Never',
    '改角色': 'Change Role',
    '仅管理员可访问此页面': 'Only administrators can access this page',

    // ===== 供应商登记 =====
    '供应商登记-副标题': '',
    '登记被审核的供应商与工厂基本信息，作为评估与报告的对象。字段可在「登记字段」中自定义。':
      'Register the basic information of suppliers / factories being assessed, used as the subject of assessments and reports. Fields can be customized in “Registry Fields”.',
    '登记字段': 'Registry Fields',
    '+ 新增供应商': '+ New Supplier',
    '当前等级「{0}」下暂无供应商记录。': 'No supplier records under tier “{0}” yet.',
    '暂无供应商记录，点击右上角「新增供应商」开始登记。': 'No supplier records yet. Click “+ New Supplier” at the top right to start.',
    '供应商等级': 'Supplier Tier',
    '关联评估': 'Related Assessments',
    '更新时间': 'Updated',
    '查看档案': 'View Profile',
    '新增供应商': 'New Supplier',
    '— 请选择 —': '— Select —',
    '— 未分类 —': '— Uncategorized —',
    '其他（自定义）': 'Other (custom)',
    '请输入等级名称': 'Enter tier name',
    '请填写必填项：': 'Please fill the required field: ',
    '请填写供应商编码与名称': 'Please enter the supplier code and name',
    '供应商已登记': 'Supplier registered',
    '已保存': 'Saved',
    '供应商档案：': 'Supplier Profile: ',
    '供应商编码 ': 'Supplier Code ',
    ' · 等级：': ' · Tier: ',
    ' · 关联评估 ': ' · Related assessments ',
    ' 份': ' assessments',
    '完善档案': 'Complete Profile',
    '档案信息': 'Profile Information',
    '关联评估（': 'Related Assessments (',
    ' 份）': ' items)',
    '暂无对该供应商的评估记录。可在「评估填写」中新建。': 'No assessments for this supplier yet. Create one in “Assessment”.',
    '已删除问卷': 'Deleted questionnaire',
    '已删除供应商': 'Deleted supplier',
    '删除供应商': 'Delete Supplier',
    '该供应商已关联 <b>{0}</b> 份评估记录，删除后这些评估也会一并移除。确认删除？':
      'This supplier is linked to <b>{0}</b> assessment(s); deleting it will also remove them. Confirm?',
    '确认删除该供应商记录？': 'Delete this supplier record?',
    '自定义供应商登记需要填写的内容：可增删、排序、设置必填与是否在列表中显示。带 🔒 的字段为系统标识字段（编码/名称），不可删除、类型不可改。':
      'Customize fields collected at registration: add, remove, reorder, set required, and choose list visibility. 🔒 fields are system identifiers (code/name) and cannot be deleted or have their type changed.',
    '登记字段设置': 'Registry Field Settings',
    '+ 添加字段': '+ Add Field',
    '字段设置已保存': 'Field settings saved',
    '列表显示': 'Listed',
    '锁定': 'Locked',
    '删除字段': 'Delete Field',
    '确认删除字段「{0}」？已填写的数据将不再显示（但不会被强制清除）。':
      'Delete field “{0}”? Existing data will no longer be shown (but is not erased).',
    '添加字段': 'Add Field',
    '编辑字段': 'Edit Field',
    '字段名称 *': 'Field Name *',
    '如 占地面积 / 安全负责人': 'e.g. Site Area / Safety Manager',
    '类型': 'Type',
    ' 必填': ' Required',
    ' 在列表显示': ' Show in list',
    '提示文字': 'Placeholder / Hint',
    '填写提示（可选）': 'Hint text (optional)',
    '单选类型：每行一个选项': 'For single-choice: one option per line',
    '此为系统标识字段，类型不可修改，且不可删除。': 'This is a system identifier field; its type cannot be changed and it cannot be deleted.',
    '请填写字段名称': 'Please enter the field name',
    '已保存字段': 'Field saved',

    // ===== 评估填写 =====
    '评估填写-选择': '',
    '选择供应商与问卷，逐项采集审核数据；填写过程自动保存，可随时导出报告。支持上传证据材料与保存版本快照。':
      'Select a supplier and questionnaire, then collect audit data question by question. Progress auto-saves; reports can be exported anytime. Supports evidence uploads and version snapshots.',
    '+ 新建评估': '+ New Assessment',
    '尚未登记任何供应商，请先在「供应商登记」中添加被评估对象。': 'No suppliers registered yet; add one in “Supplier Registry” first.',
    '尚未设计任何问卷，请先在「问卷设计」中创建。': 'No questionnaires designed yet; create one in “Questionnaire Design” first.',
    '暂无评估记录。': 'No assessment records.',
    '所选等级下没有包含对应不符合项的评估。': 'No assessments under this tier contain the corresponding non-conformities.',
    '本问卷无可评分项': 'This questionnaire has no scorable items',
    '请先登记供应商并设计问卷': 'Register a supplier and design a questionnaire first',
    '选择供应商': 'Select Supplier',
    '选择问卷': 'Select Questionnaire',
    '评估日期': 'Assessment Date',
    '审核员姓名': 'Auditor name',
    '开始填写': 'Start Filling',
    '问卷或供应商已不存在': 'The questionnaire or supplier no longer exists',
    '填写评估：': 'Fill Assessment: ',
    '问卷：': 'Questionnaire: ',
    '保存版本快照': 'Save Version Snapshot',
' 保存': ' Save',
    ' 导出报告': ' Export Report',
    '评估内容已保存': 'Assessment saved',
    '评估内容为空，暂无可导出': 'Assessment is empty; nothing to export',
    '版本历史': 'Version History',
    '标记完成': 'Mark Complete',
    '已标记完成': 'Marked Complete',
    '证据材料（图片/证明）': 'Evidence (Images / Proof)',
    '可上传现场照片、证书扫描件等作为审核证据，支持填写说明文字。': 'Upload site photos, certificate scans, etc. as audit evidence; captions supported.',
    '＋ 上传图片': '+ Upload Image',
    '💬 审核员评论': '💬 Auditor Comment',
    '审核员评论': 'Auditor Comment',
    '（无说明）': '(no caption)',
    '说明文字（可选）': 'Caption (optional)',
    '删除附件': 'Delete Attachment',
    '确认删除该证据材料「{0}」？': 'Delete this evidence item “{0}” ?',
    '上传失败：': 'Upload failed: ',
    '读取文件失败': 'Failed to read file',
    '附件加载失败：': 'Failed to load attachments: ',
    '暂无证据材料。': 'No evidence yet.',
    '暂无证据材料，点击上方按钮上传。': 'No evidence yet; click the button above to upload.',
    '审核员评论 / 事实记录 / 整改建议（输入 @ 可提及同事，可插入图片，可选）':
      'Auditor comment / factual record / corrective action (type @ to mention a colleague, insert images; optional)',
    '插入图片': 'Insert Image',
    '支持 @ 提及同事 与 图片证据': 'Supports @ mentions and image evidence',
    '评论图片': 'Comment image',
    '删除图片': 'Remove image',
    '图片处理失败：': 'Image processing failed: ',
    '实时合规评分（评分题 + 是否题）': 'Live Compliance Score (rating + yes/no)',
    '版本快照已保存': 'Version snapshot saved',
    '保存失败：': 'Save failed: ',
    '已标记为完成': 'Marked as completed',
    '已转为草稿': 'Reverted to draft',
    '暂无版本快照，请点击「保存版本快照」': 'No version snapshots yet; click “Save Version Snapshot”',
    '最多对比两个版本': 'Compare at most two versions',
    '勾选两个版本进行逐题对比（可勾选 1 个查看该版本完整答案）。': 'Select two versions for a question-by-question comparison (select one to view its full answers).',
    '版本历史（': 'Version History (',
    ' 个快照）': ' snapshots)',
    '请至少选择一个版本': 'Select at least one version',
    '对比所选': 'Compare Selected',
    '版本对比 · ': 'Version Compare · ',
    '版本 A': 'Version A',
    '版本 B': 'Version B',
    '两版本共 ': 'The two versions differ in ',
    ' 处答案不同（高亮显示）。': ' answer(s) (highlighted).',
    '题目': 'Question',
    '答案': 'Answer',
    '确认删除该评估记录？此操作不可撤销（含其附件与版本）。': 'Delete this assessment? This cannot be undone (includes its attachments and versions).',
    '删除评估': 'Delete Assessment',
    '删除失败：': 'Delete failed: ',

    // ===== 问卷设计 =====
    '问卷设计-副标题': '',
    '设计审核所用的问卷：自由增删章节与题目，设置题型、必填与风险等级。可从一个空白问卷开始，或基于内置模板。':
      'Design the questionnaire used for audits: freely add/remove sections and questions, set question types, required flags and risk levels. Start blank or from a built-in template.',
    '+ 新建问卷': '+ New Questionnaire',
    '从模板新建': 'New from Template',
    '暂无问卷，点击「+ 新建问卷」开始设计。': 'No questionnaires yet. Click “+ New Questionnaire” to start.',
    '章节数': 'Sections',
    '题目数': 'Questions',
    '最后更新': 'Last Updated',
    '复制': 'Duplicate',
    '导出': 'Export',
    '问卷标题 *': 'Questionnaire Title *',
    '描述（可选）': 'Description (optional)',
    '设计问卷：': 'Design Questionnaire: ',
    '添加章节': 'Add Section',
    '＋ 添加题目': '+ Add Question',
    '问卷设置': 'Questionnaire Settings',
    '请填写问卷标题': 'Please enter the questionnaire title',
    '至少包含一个章节与一题': 'Include at least one section with one question',
    '问卷已保存': 'Questionnaire saved',
    '确认删除该问卷？其下的评估记录将保留但无法再打开该问卷。': 'Delete this questionnaire? Related assessments remain but can no longer open this questionnaire.',
    '删除问卷': 'Delete Questionnaire',
    '确认删除章节「{0}」？该章节下的题目将一并删除。': 'Delete section “{0}”? Its questions will be removed too.',
    '删除章节': 'Delete Section',
    '确认删除题目「{0}」？': 'Delete question “{0}”?',
    '删除题目': 'Delete Question',
    '字段名称（题目）*': 'Question Text *',
    '题型': 'Type',
    '必填项': 'Required',
    '风险/重要等级': 'Risk / Importance',
    '帮助文字（可选）': 'Help text (optional)',
    '选项（每行一个）': 'Options (one per line)',
    '题目已保存': 'Question saved',
    '请填写题目内容': 'Please enter the question text',
    '最小': 'Min',
    '最大': 'Max',

    // ===== 标准 / 法规 =====
    '标准/法规-副标题': '',
    '浏览与检索社会责任标准、国内劳动 / 消防 / 环保法规及其关键条款，供审核对标。支持自定义标签与上传关联文档。':
      'Browse and search social-responsibility standards and domestic labor / fire-safety / environmental regulations with key clauses for audit benchmarking. Custom tags and linked documents supported.',
    '检索标准 / 法规…': 'Search standards / regulations…',
    '全部类别': 'All Categories',
    '暂无匹配的标准或法规。': 'No matching standards or regulations.',
    '关键条款': 'Key Clauses',
    '我的标签': 'My Tags',
    '添加标签': 'Add Tag',
    '编辑标准': 'Edit Standard',
    '查看 PDF': 'View PDF',
    '删除标准': 'Delete Standard',
    '确认删除标准「{0}」？': 'Delete standard “{0}”?',
    '标准已删除': 'Standard deleted',
    '标准名称 *': 'Standard Name *',
    '类别': 'Category',
    '颁布机构': 'Issuing Body',
    '发布 / 生效': 'Published / Effective',
    '关键条款（每行一条）': 'Key clauses (one per line)',
    '关联文档（可选）：': 'Linked document (optional): ',
    '选择 PDF / 文档': 'Select PDF / document',
    '请填写标准名称': 'Please enter the standard name',
    '标准已保存': 'Standard saved',
    '＋ 新增标准': '+ New Standard',
    '查看文档': 'View Document',

    // ===== 导出 =====
    '数据导出-副标题': '',
    '将选中的评估导出为 PDF 报告或 Excel 汇总，支持按章节拆分与嵌入证据。':
      'Export selected assessments as a PDF report or Excel summary, with per-section splitting and embedded evidence.',
    '未选择任何评估': 'No assessments selected',
    '已选 {0} 份评估': '{0} assessment(s) selected',
    '全选': 'Select All',
    '导出 PDF 报告': 'Export PDF Report',
    '导出 Excel': 'Export Excel',
    '导出不符合项汇总': 'Export Non-conformity Summary',
    '封面格式设置': 'Cover Settings',
    '封面样式': 'Cover Style',
    '标准色带': 'Standard Band',
    '居中标题': 'Centered Title',
    '左侧色条': 'Left Bar',
    '极简': 'Minimal',
    '主题色': 'Theme Color',
    '封面副标题（可选）': 'Cover Subtitle (optional)',
    '显示机构名称': 'Show Organization',
    '显示生成时间': 'Show Generation Time',
    '预览 PDF 报告': 'Preview PDF Report',
    '报告标题（默认取自问卷标题，显示在 PDF 封面，导出前可修改）': 'Report title (defaults to the questionnaire title; shown on the PDF cover and editable before export)',
    '本次导出包含多个不同问卷，各报告章节将分别使用其对应问卷标题。': 'This export includes multiple questionnaires; each section uses its own questionnaire title.',
    '预览（缩放显示，确认后将按原尺寸生成 PDF）：': 'Preview (scaled; the PDF is generated at full size on confirm):',
    '确认导出 PDF': 'Confirm Export PDF',
    '正在生成 PDF…': 'Generating PDF…',
    '正在准备预览…': 'Preparing preview…',
    'PDF 已导出：': 'PDF exported: ',
    'PDF 生成失败：': 'PDF generation failed: ',
    '没有可导出的评估': 'No assessments to export',
    '正在生成 Excel…': 'Generating Excel…',
    'Excel 已导出：': 'Excel exported: ',
    'Excel 生成失败：': 'Excel generation failed: ',
    '不符合项汇总已导出：': 'Non-conformity summary exported: ',
    '供应商信息': 'Supplier Information',
    '不符合项汇总': 'Non-conformity Summary',

    // ===== 杂项 =====
    '本地数据库：': 'Local DB: ',
    '初始化失败：': 'Initialization failed: ',
    '登录失败': 'Sign-in failed',
    '注册失败': 'Registration failed',
    '文件导出失败：': 'File export failed: ',
    '本地数据库写入失败：': 'Local DB write failed: ',

    // ===== 补充翻译（问卷设计 / 标准法规 / 导出 等） =====
    '+ 向本章节添加题目': '+ Add Question to this Section',
    '+ 新建用户': '+ New User',
    '+ 添加章节': '+ Add Section',
    '+ 添加选项': '+ Add Option',
    '<b>检索</b>：输入关键词可高亮名称/摘要/条款；点击<b>标签</b>可按子条款议题（强迫劳动、童工、消防验收…）筛选。标准与子条款的标签均可由你<b>自行增删</b>。':
      '<b>Search</b>: type a keyword to highlight names / summaries / clauses; click a <b>tag</b> to filter by sub-clause topic (forced labor, child labor, fire-safety acceptance…). Tags on standards and sub-clauses can be added or removed by you.',
    'PDF 文件': 'PDF File',
    'PDF 文件不存在，可能已被删除': 'PDF file not found; it may have been deleted',
    '— 创建为新的独立标准 —': '— Create as a new standalone standard —',
    '⇩ 下载': '⇩ Download',
    '⇩ 不符合项汇总': '⇩ Non-conformity Summary',
    '⇩ 导出 Excel': '⇩ Export Excel',
    '⇩ 导出 PDF': '⇩ Export PDF',
    '⇩ 按章节导出': '⇩ Export by Section',
    '⚙ 问卷设置': '⚙ Questionnaire Settings',
    '上传并保存': 'Upload & Save',
    '上传标准 / 报告 PDF': 'Upload Standard / Report PDF',
    '上移': 'Move Up',
    '下移': 'Move Down',
    '下载': 'Download',
    '仅支持 PDF 格式': 'Only PDF format is supported',
    '仅支持 PDF 格式，将保存在本地浏览器数据库中。': 'Only PDF is supported; it will be stored in the local browser database.',
    '供应商不存在': 'Supplier not found',
    '关联供应商': 'Related Supplier',
    '关联供应商名称（可选）': 'Related supplier name (optional)',
    '关联到已有标准': 'Link to existing standard',
    '再次确认密码': 'Confirm Password Again',
    '分类': 'Category',
    '初始密码': 'Initial Password',
    '删除报告': 'Delete Report',
    '删除此题': 'Delete This Question',
    '删除该标准': 'Delete This Standard',
    '删除选项': 'Delete Option',
    '勾选评估记录，导出为 PDF 报告 / Excel 表格；或按章节拆分成多份独立 PDF。': 'Select assessments to export as a PDF report / Excel sheet, or split by section into multiple PDFs.',
    '发布机构': 'Issuing Body',
    '发布机构（可选）': 'Issuing body (optional)',
    '可选封面副标题（留空则不显示）': 'Optional cover subtitle (blank = hidden)',
    '合规评分': 'Compliance Score',
    '名称': 'Name',
    '填写/编辑': 'Fill / Edit',
    '填写提示/合规说明（可选）': 'Placeholder / compliance note (optional)',
    '备注': 'Note',
    '备注（可选）': 'Note (optional)',
    '复制当前': 'Duplicate Current',
    '如 2024 版': 'e.g. 2024 edition',
    '如 ISO 45001 职业健康安全': 'e.g. ISO 45001 Occupational Health & Safety',
    '密码（至少 6 位）': 'Password (≥6 chars)',
    '封面格式设置（修改后实时预览并自动保存）': 'Cover settings (live preview & auto-save on change)',
    '已复制问卷': 'Questionnaire duplicated',
    '已选 0 项（未选择时导出全部）': '0 selected (exports all when none selected)',
    '当前编辑问卷': 'Currently Editing',
    '必填题目': 'Required Questions',
    '所选评估未发现不符合项': 'No non-conformities found in the selected assessments',
    '报告 PDF（我的报告）': 'Report PDF (My Reports)',
    '文本': 'Text',
    '新章节': 'New Section',
    '无法读取文件': 'Cannot read file',
    '显示名': 'Display Name',
    '暂无标准数据。': 'No standard data yet.',
    '暂无评估记录可导出，请先完成评估填写。': 'No assessments available to export; complete an assessment first.',
    '暂无问卷，请点击「新建问卷」开始设计。': 'No questionnaires yet; click “+ New Questionnaire” to start.',
    '最大值（可选）': 'Max (optional)',
    '最小值（可选）': 'Min (optional)',
    '未发现不符合项 / 待改进项（基于当前等级与回答）。': 'No non-conformities / improvements found (based on current levels & answers).',
    '本模块汇集主要国际社会责任标准（SA8000、RBA、WRAP、ISO 26000、FLA、BSCI、Sedex/SMETA）、职业安全（OSHA）以及国内《劳动合同法》《消防法》《环境保护法》的<b>最新有效版本</b>与关键条款，供现场审核对标。':
      'This module collects the main international social-responsibility standards (SA8000, RBA, WRAP, ISO 26000, FLA, BSCI, Sedex/SMETA), occupational safety (OSHA), and the <b>latest valid versions</b> and key clauses of domestic Labor Contract Law, Fire Prevention Law and Environmental Protection Law, for on-site audit benchmarking.',
    '查看': 'View',
    '查看主要社会责任、职业安全与国内劳动/消防/环保法规的最新版本与关键条款；支持全文检索高亮、按子条款标签筛选，并可上传自有标准/报告 PDF。':
      'View the latest versions and key clauses of major social-responsibility, occupational-safety and domestic labor / fire / environmental regulations; supports full-text search highlighting, sub-clause tag filtering, and uploading your own standard / report PDFs.',
    '标准 / 法规': 'Standards / Regulations',
    '标准 / 法规 说明': 'Standards / Regulations Help',
    '标准 PDF（加入标准库）': 'Standard PDF (add to library)',
    '标准标签': 'Standard Tags',
    '标签：': 'Tags: ',
    '标题与说明': 'Title & Description',
    '没有匹配的标准，试试其它关键词、分类或标签。': 'No matching standards; try other keywords, categories or tags.',
    '没有可生成的章节': 'No sections available to generate',
    '添加子条款标签': 'Add Clause Tag',
    '添加标准标签': 'Add Standard Tag',
    '添加题目': 'Add Question',
    '清空': 'Clear',
    '点击右上角<b>「⬆ 上传标准/报告」</b>可将自有 PDF 标准加入库、或存入「我的报告」，之后可在详情中<b>在线预览/下载</b>。':
      'Click <b>“⬆ Upload Standard / Report”</b> at the top right to add your own PDF standard to the library, or store it under “My Reports”; you can then <b>preview / download</b> it from the detail view.',
    '版本': 'Version',
    '版本信息截至 2026 年可确认的最新有效版本，仅供参考；具体执行请以官方发布文本为准。': 'Version info reflects the latest valid versions confirmable as of 2026 and is for reference only; always follow the official published texts for execution.',
    '用户': 'User',
    '用户上传（自定义分类）': 'User uploads (custom category)',
    '登录用户名（字母/数字，≥3 位）': 'Login username (letters/numbers, ≥3 chars)',
    '确认删除该问卷？已基于该问卷生成的评估记录不会被删除，但将无法再继续填写。': 'Delete this questionnaire? Assessments created from it are kept but can no longer be filled.',
    '章节名称': 'Section Name',
    '第一章节': 'First Section',
    '等级用于标注问题风险：红线/严重（必须立即纠正）> 重大 > 一般 > 建议。评估填写时会显示等级，报告将据此汇总不符合项。':
      'Levels mark question risk: Red-line / Critical (must be corrected immediately) > Major > Minor > Suggestion. Levels are shown while filling and used by the report to summarize non-conformities.',
    '编辑题目': 'Edit Question',
    '题目编号（自定义）': 'Question No. (custom)',
    '如：Q1 / 3.2 / A-01（留空则按顺序自动编号）': 'e.g. Q1 / 3.2 / A-01 (leave empty for auto-numbering)',
    '保留': 'Keep',
    '编辑此题': 'Edit this question',
    '双击编辑此题': 'Double-click to edit this question',
    '题目已保留': 'Question kept',
    '题目已确定': 'Question confirmed',
    '双击左侧题目，或点击下方按钮，在弹框中编辑此题完整内容。': 'Double-click the question on the left, or use the button below, to edit full content in a dialog.',
    '提示：双击题目可打开弹框编辑内容': 'Tip: double-click a question to edit it in a dialog.',
    '移动工作台': 'Mobile Workbench',
    '移动现场评估': 'Mobile Field Assessment',
    '供应商预审 · 移动现场评估 · 数据本地存储，可随时与 PC 同步': 'Supplier Pre-Assessment · Mobile Field Assessment · Data stored locally, sync with PC anytime',
    '合规分': 'Compliance',
    '所有数据仅存储在本机。前往「数据同步」可通过局域网或 USB 与 PC 互相同步问卷与照片数据。': 'All data is stored only on this device. Go to Sync to exchange questionnaire & photo data with PC over LAN or USB.',
    '登记供应商基本信息与联系方式': 'Register supplier basic info & contacts',
    '在线/离线填写评估问卷与评分': 'Fill assessment questionnaires with scoring, online or offline',
    '拍摄并管理现场照片': 'Capture and manage on-site photos',
    '局域网/USB 与 PC 同步数据': 'Sync data with PC over LAN / USB',
    '查看并导出评估报告': 'View and export assessment reports',
    '通过局域网（同一 WiFi / 热点）或 USB 数据线（网络共享）与 PC 端互相同步问卷与照片数据，全程本地、不依赖互联网。': 'Exchange questionnaire & photo data with PC over LAN (same WiFi / hotspot) or USB tethering — fully local, no internet needed.',
    '连接方式': 'Connection',
    '局域网': 'LAN',
    '手机与 PC 连同一 WiFi，或开热点让 PC 连接，填入 PC 的 IP 即可。': 'Connect phone and PC to the same WiFi, or start a hotspot for the PC, then enter the PC IP.',
    '用数据线连接 PC 并开启「USB 网络共享」，手机即可通过 USB 链路访问 PC 的 18080 端口（即 USB TCP 同步）。': 'Connect via USB and enable "USB tethering" — the phone accesses PC port 18080 over the USB link (USB TCP sync).',
    '两种方式都走同一同步协议（端口 18080），只需保证手机能访问到 PC 的该端口。': 'Both methods use the same protocol (port 18080); just ensure the phone can reach that port on the PC.',
    '开启 USB 调试后，在 PC 端执行 adb reverse tcp:18080 tcp:18080，手机填 IP 127.0.0.1、端口 18080 即可经 USB 直连 PC。': 'Enable USB debugging, then run "adb reverse tcp:18080 tcp:18080" on the PC; enter IP 127.0.0.1 and port 18080 on the phone to connect via USB.',
    '蓝牙': 'Bluetooth',
    '手机与 PC 蓝牙配对后，在手机「网络共享」开启「通过蓝牙共享网络」，即可复用同一协议与 PC 同步。': 'After pairing the phone and PC via Bluetooth, enable "Bluetooth tethering" under phone Network Sharing to sync with PC using the same protocol.',
    '照片实时': 'Photos Live',
    '连接后，手机拍摄/上传的照片会实时同步到 PC 端并自动刷新显示。': 'Once connected, photos taken/uploaded on the phone sync to the PC in real time and refresh automatically.',
    '局域网 / USB / 蓝牙共享均走同一同步协议（端口 18080），只需保证手机能访问到 PC 的该端口。': 'LAN / USB / Bluetooth tethering all use the same protocol (port 18080); just ensure the phone can reach that port on the PC.',
    '设置': 'Settings',
    '当前用户': 'Current User',
    '未登录': 'Not logged in',
    '切换语言': 'Switch Language',
    '刷新界面': 'Refresh',
    '数据默认存储于应用内（IndexedDB）。可申请访问设备存储，将报告/照片导出到本地文件夹浏览。': 'Data is stored inside the app by default (IndexedDB). You can request device storage access to export reports/photos to a local folder for browsing.',
    '报告保存位置': 'Report Save Location',
    'Documents/供应商预审平台/报告': 'Documents/供应商预审平台/报告',
    '申请存储权限': 'Request Storage Permission',
    '存储权限已就绪': 'Storage permission ready',
    '存储权限未授予，可能无法保存到文件夹': 'Storage permission not granted — saving to folder may fail',
    '存储权限': 'Storage Permission',
    '是否允许应用访问设备存储，以便将报告和照片保存到本地文件夹？': 'Allow the app to access device storage so reports and photos can be saved to a local folder?',
    '存储权限已就绪，应用文件夹已创建': 'Storage permission ready — app folder created',
    '请先授予存储权限': 'Please grant storage permission first',
    '导出数据到本地': 'Export Data Locally',
    '数据已导出到本地文件夹': 'Data exported to local folder',
    '调整照片方向': 'Adjust Photo Orientation',
    '当前照片方向可能不符合统一的 16:9 横屏格式。': 'The current photo orientation may not match the unified 16:9 landscape format.',
    '建议宽度大于高度。是否需要顺时针旋转 90°？': 'Width should be greater than height. Rotate 90° clockwise?',
    '保持原方向': 'Keep Original',
    '顺时针旋转 90°': 'Rotate 90° Clockwise',
    '自定义审核问卷：新建章节、添加题目、配置题型与选项。系统已预置默认审核问卷模板。':
      'Customize the audit questionnaire: create sections, add questions, and configure types and options. A default template is pre-loaded.',
    '若选择，PDF 将挂接到该标准（不新建条目）。': 'If selected, the PDF attaches to that standard (no new entry created).',
    '访问官网 ↗': 'Visit official site ↗',
    '证据材料（仅查看）': 'Evidence (view only)',
    '评分上限（如 5 表示 1-5 分）': 'Rating max (e.g. 5 for 1–5)',
    '请填写名称': 'Please enter the name',
    '请选择 PDF 文件': 'Please select a PDF file',
    '还没有上传报告。点击右上角「⬆ 上传标准/报告」可添加 PDF 报告。': 'No reports uploaded yet. Click “⬆ Upload Standard / Report” at the top right to add a PDF report.',
    '选项': 'Options',
    '重命名章节': 'Rename Section',
    '重置': 'Reset',
    '问卷基本信息': 'Questionnaire Basics',
    '问卷标题': 'Questionnaire Title',
    '问卷说明': 'Questionnaire Description',
    '问题等级（风险/重要性）': 'Question Level (Risk / Importance)',
    '题目不存在': 'Question not found',
    '题面（问题）': 'Question Text',
    '🔍 搜索标准名称 / 版本 / 标签 / 条款关键词（如 强迫劳动、消防验收、SA8000）': '🔍 Search standard name / version / tag / clause keyword (e.g. forced labor, fire acceptance, SA8000)',
    '＋ 标签': '+ Tag',

    // ===== 默认种子数据（问卷 / 供应商字段 / 说明） =====
    'A. 招聘与雇佣': 'A. Recruitment & Employment',
    'B. 工作时间': 'B. Working Hours',
    'C. 工资与福利': 'C. Wages & Benefits',
    'D. 员工待遇': 'D. Employee Treatment',
    'E. 员工参与': 'E. Employee Participation',
    'F. 健康与安全': 'F. Health & Safety',
    'G. 终止雇佣': 'G. Termination of Employment',
    'H. 管理体系': 'H. Management System',
    'I. 强迫劳动（红线项）': 'I. Forced Labor (Red-line)',
    '供应商预审平台 默认审核问卷': 'Supplier Pre-Assessment Platform Default Audit Questionnaire',
    '预置的本地化默认审核问卷，涵盖招聘雇佣、工时、工资、健康安全等核心议题，可在「问卷设计」中自由增改。':
      'A pre-built localized default audit questionnaire covering recruitment, working hours, wages, health & safety and other core topics; freely editable in “Questionnaire Design”.',
    '加班是否基于工人自愿？': 'Is overtime based on workers’ voluntary agreement?',
    '合规：不得收取押金': 'Compliance: no deposits may be collected',
    '周最高工时（含加班，小时）': 'Max weekly hours (incl. overtime, hours)',
    '如 SUP-001': 'e.g. SUP-001',
    '如 服装制造': 'e.g. Garment Manufacturing',
    '工人是否可自由辞职（无不当限制）？': 'Can workers resign freely (without undue restriction)?',
    '工人是否自愿受雇（无强迫劳动迹象）？': 'Are workers employed voluntarily (no signs of forced labor)?',
    '工厂/场所全称': 'Full name of factory / site',
    '工资扣减是否有合法依据并书面告知？': 'Are wage deductions legally justified and communicated in writing?',
    '工资支付准时度评分': 'Wage payment punctuality rating',
    '工资是否不低于当地最低工资标准？': 'Are wages no lower than the local minimum wage?',
    '平均每月加班工时（小时）': 'Avg. monthly overtime hours',
    '建立劳动关系的书面合同覆盖率（%）': 'Written contract coverage for employment relationship (%)',
    '所在地区': 'Region',
    '整数': 'Integer',
    '无法打开本地数据库，已使用临时内存模式（刷新将丢失）': 'Cannot open local database; using temporary in-memory mode (lost on refresh)',
    '是否为员工依法缴纳社会保险？': 'Are social insurance premiums paid for employees per law?',
    '是否为相关岗位提供个人防护用品（PPE）？': 'Are personal protective items (PPE) provided for relevant posts?',
    '是否取得消防验收/安全检查合格？': 'Has fire-safety acceptance / safety inspection been passed?',
    '是否向工人收取任何押金或保证金？': 'Are any deposits or guarantees collected from workers?',
    '是否存在体罚、辱骂或人身骚扰？': 'Is there any corporal punishment, abuse or harassment?',
    '是否存在债务劳工或贩卖劳工迹象？': 'Are there signs of debt bondage or trafficking?',
    '是否存在扣押工资、限制自由离开的行为？': 'Is there wage withholding or restriction of free departure?',
    '是否安排每周至少一天休息？': 'Is at least one rest day per week arranged?',
    '是否定期与员工进行书面或会议沟通？': 'Is regular written or meeting communication held with employees?',
    '是否定期开展内部审核或管理评审？': 'Are internal audits or management reviews conducted regularly?',
    '是否对供应商/分包方进行社会合规管理？': 'Is social-compliance management applied to suppliers / subcontractors?',
    '是否建立并公示员工申诉/投诉渠道？': 'Is an employee grievance / complaint channel established and publicized?',
    '是否建立社会责任/行为准则政策文件？': 'Is a social-responsibility / code-of-conduct policy document established?',
    '是否扣留工人身份证件、护照或居住证？': 'Are workers’ ID, passport or residence documents withheld?',
    '是否按时、足额以法定货币支付工资？': 'Are wages paid on time and in full in legal tender?',
    '是否提供反骚扰与平等待遇培训？': 'Is anti-harassment and equal-treatment training provided?',
    '是否核验工人年龄并保留身份证明文件复印件？': 'Are workers’ ages verified and ID copies retained?',
    '是否设立员工意见反馈或工人代表机制？': 'Is an employee feedback or worker-representative mechanism in place?',
    '权属性质': 'Ownership Type',
    '标准周工时（小时）': 'Standard weekly hours',
    '用工人数': 'Number of Workers',
    '申诉渠道有效性评分': 'Grievance channel effectiveness rating',
    '省/市': 'Province / City',
    '离职结算（工资/补偿）是否及时完成？': 'Is offboarding settlement (wages / compensation) completed promptly?',
    '职业健康与安全管理评分': 'Occupational health & safety management rating',
    '联系人': 'Contact Person',
    '联系电话': 'Contact Phone',
    '行业类型': 'Industry Type',
    '街道门牌': 'Street Address',
    '解雇是否遵循法定程序并提前通知？': 'Does dismissal follow legal procedure with advance notice?',
    '详细地址': 'Detailed Address',
    '过去 12 个月工伤事故次数': 'Work-related accidents in past 12 months',
    '过去 12 个月是否组织消防演练？': 'Were fire drills organized in the past 12 months?',
    '邮箱': 'Email',
    '供应商名称': 'Supplier Name',
    '供应商编码': 'Supplier Code',
    '我的组织': 'My Organization',
    '供应商预审报告 · Supplier Pre-Assessment Report': 'Supplier Pre-Assessment Report',
    '将生成 ': 'Will generate ',
    '已上传：': 'Uploaded: ',
    '按章节报告已导出（': 'Section reports exported (',
    '章节报告失败：': 'Section report failed: ',
    '预览生成失败：': 'Preview generation failed: ',
    ' 份 PDF 文件，确定继续？': ' PDF files; continue?',
    '本应用是一款完全运行在你本机浏览器中的离线应用，用于：': 'This app is a fully offline application that runs entirely in your browser, used for:',
    '- **问卷设计**：自由创建/修改审核问卷（章节 + 多种题型），已预置默认审核问卷模板。': '- **Questionnaire Design**: freely create / modify audit questionnaires (sections + multiple question types); a default template is pre-loaded.',
    '- **供应商登记**：登记被审核的供应商与工厂的基本信息；点「⚙ 登记字段」可自定义登记所需内容（字段类型、必填、是否在列表显示），并可为其划分**供应商等级**（一级/二级供应商、原料供应商、分包商等）。': '- **Supplier Registry**: register basic info of suppliers / factories under audit; click “⚙ Registry Fields” to customize fields (type, required, list visibility) and assign a **supplier tier** (tier-1/2 supplier, raw-material supplier, subcontractor, etc.).',
    '- **评估填写**：选择「供应商 + 问卷」逐项作答，实时显示合规评分，自动保存；支持证据附件上传、历史版本快照，以及每题**审核员评论（可 @ 提及同事、插入图片）**与**问题等级划分**；列表可按等级筛选。': '- **Assessment**: pick “supplier + questionnaire” and answer question by question with a live compliance score and auto-save; supports evidence attachments, version snapshots, per-question **auditor comments (@ mentions, images)** and **risk levels**; filter the list by tier.',
    '- **标准/法规**：分类浏览、检索最新有效的社会责任标准与国内劳动/消防/环保法规及其关键条款，供审核对标。': '- **Standards / Regulations**: browse by category and search the latest valid social-responsibility standards and domestic labor / fire / environmental regulations with key clauses for benchmarking.',
    '- **数据导出**：将选中的评估导出为 **PDF 报告**（含评分与明细、按章节拆分、嵌入证据图）与 **Excel**（汇总 / 明细 / 供应商表，以及可单独导出的**不符合项汇总**表）。': '- **Data Export**: export selected assessments to a **PDF report** (scores, details, split by section, embedded evidence) and **Excel** (summary / detail / supplier sheets, plus a standalone **non-conformity summary**).',
    '- **设置/备份**：配置报告抬头与使用说明，并支持 JSON 全量备份与恢复。': '- **Settings / Backup**: configure the report header and usage guide, and export / restore a full JSON backup.',
    '数据保存在浏览器本地数据库 **IndexedDB**，不上传任何服务器。请勿清理浏览器数据以免丢失；重要内容请使用「导出 JSON 备份」。': 'Data is stored in the browser’s local database **IndexedDB** and never uploaded to any server. Do not clear browser data to avoid loss; use “Export JSON Backup” for important data.',
    '建议流程：登记供应商 → 设计问卷 → 新建评估并填写 → 导出报告。': 'Suggested workflow: register supplier → design questionnaire → create & fill assessment → export report.',
    '自有': 'Owned',
    '外包/代工': 'Outsourced / OEM',
    '合资': 'Joint Venture',
    '其他': 'Other',

    // ===== 评估 / 报告（动态内容）补充 =====
    ' · 已完成': ' · Completed',
    ' · 草稿': ' · Draft',
    '高': 'High',
    '中风险': 'Medium Risk',
    '低': 'Low',
    '低风险': 'Low Risk',
    '高风险': 'High Risk',
    '全部题目作答与审核员评论': 'All question answers and auditor comments',
    '单选': 'Single Choice',
    '多选': 'Multi Choice',
    '受审核方': 'Auditee',
    '合规说明': 'Compliance Note',
    '回答': 'Answer',
    '存在严重合规与法律隐患，须立即采取纠正措施、暂停相关作业并上报管理层。': 'Serious compliance and legal risks; immediate corrective action, suspension of related operations, and escalation to management are required.',
    '审核明细（附录）': 'Audit Details (Appendix)',
    '审核章节': 'Audit Section',
    '属轻微/改进项，建议纳入持续改进计划并跟踪闭环。': 'Minor/improvement item; recommend inclusion in the continuous improvement plan with closed-loop tracking.',
    '属重要不符合项，应在规定期限内完成整改并进行有效性验证，防止风险升级。': 'Significant non-conformity; rectification within the set timeframe and effectiveness verification are required to prevent escalation.',
    '序号': 'No.',
    '当前数据': 'Current Data',
    '得分': 'Score',
    '情况': 'Finding',
    '报告编号': 'Report No.',
    '按风险等级降序排列，含数据风险评级与整改提示': 'Sorted by risk level descending, with data-risk rating and corrective-action hints',
    '数字': 'Number',
    '数据风险': 'Data Risk',
    '是否': 'Yes/No',
    '本章节合规评分': 'Section Compliance Score',
    '满分': 'Max',
    '版本数': 'Versions',
    '现场取证照片 / 文件': 'On-site evidence photos / files',
    '章节': 'Section',
    '等级': 'Level',
    '综合合规评分': 'Overall Compliance Score',
    '综合评分%': 'Overall %',
    '编辑供应商': 'Edit Supplier',
    '证据材料': 'Evidence',
    '评估ID': 'Assessment ID',
    '评估汇总': 'Assessment Summary',
    '评估状态': 'Assessment Status',
    '长文本': 'Long Text',
    '问题点': 'Finding',
    '问题点明细与风险提示': 'Findings Detail & Risk Hints',
    '附件数': 'Attachments',
    '题目明细': 'Question Details',
    '风险指数': 'Risk Index',
    '风险提示': 'Risk Hint',
    '风险等级': 'Risk Level',
    '，无不符合项': ', no non-conformities',
    ' · 供应商编码 ': ' · Supplier code ',
    ' 保存版本快照': ' Save version snapshot',
    ' 已标记完成': ' Marked complete',
    ' 分': ' pts',
    '查看评估：': 'View assessment: ',
    ' 编辑 / 继续填写': ' Edit / Continue',
    '确认删除该证据材料「': 'Confirm deleting this evidence "',
    '分': 'pts',
    ' 插入图片': ' Insert image',
    '快照 ': 'Snapshot ',
    '完成快照 ': 'Completion snapshot ',
    '得分 ': 'Score ',
    ' 登记字段': ' Register fields',
    '当前等级「': 'Tier "',
    '」下暂无供应商记录。': '" has no supplier records yet.',
    ' 完善档案': ' Complete profile',
    '该供应商已关联 <b>': 'This supplier is linked to <b>',
    '</b> 份评估记录，删除后这些评估也会一并移除。确认删除？': '</b> assessment records. Deleting this will also remove those assessments. Confirm deletion?',
    '确认删除字段「': 'Confirm deleting field "',
    '」？已填写的数据将不再显示（但不会被强制清除）。': '"? The data you entered will no longer be shown (but will not be forcibly cleared).',
    '现场核查表明「': 'The on-site check shows "',
    '」未满足基本要求，属不可接受情形。': '" does not meet the basic requirement and is an unacceptable situation.',
    '核查发现「': 'The check found "',
    '」回答为"否"，与标准要求不符。': '" is "No", which does not meet the standard requirement.',
    '该项评分 ': 'Score ',
    '，管理执行存在差距，需提升至目标水平。': ', there is a gap in management execution that needs improvement to the target level.',
    '已选 ': 'Selected ',
    ' 项': ' items',
    '报告生成时间 ': 'Report generated at ',
    '评分 ': 'Score ',
    '整体风险指数 <b style="color:': 'Overall risk index <b style="color:',
    '风险）</b>': ' risk)</b>',
    '，共 ': ', total ',
    ' 个待改进项': ' pending improvement items',
    ' [图片×': ' [images×',

    // —— 补充：UI / 对话框 / 标准库 / 问卷设计器 等显示文案（英文） ——
    '新密码长度至少 6 位': 'New password must be at least 6 characters',
    '<div class="empty">仅管理员可访问此页面</div>': '<div class="empty">Only administrators can access this page</div>',
    '位': ' users',
    ' <span class="tag gray">我</span>': ' <span class="tag gray">Me</span>',
    '将用户 <b>': 'Change role of user <b>',
    '</b> 的角色改为 <b>': '</b> to <b>',
    '用户 <b>': 'user <b>',
    '为 ': 'Set a new password for ',
    ' 设置新密码': ' ',
    '确认删除用户 <b>': 'Confirm deleting user <b>',
    '</b>？该操作不可恢复。': '</b>? This action cannot be undone.',
    '题': 'Q',
    '(未命名题目)': '(Untitled question)',
    '级·': 'Lv·',
    '共 ': 'Total ',
    ' 个章节，': ' sections, ',
    ' 道题目。': ' questions.',
    '选项一': 'Option 1',
    '选项二': 'Option 2',
    '新选项': 'New option',
    '该章节共 ': 'This section has ',
    ' 题。点击左侧题目进行编辑，或点击下方按钮新增。': ' questions. Click a question on the left to edit, or use the button below to add one.',
    '新建问卷 ': 'New questionnaire ',
    '（副本）': ' (copy)',
    '未命名章节': 'Untitled section',
    '未命名问题': 'Untitled question',
    '新问题': 'New question',
    '已复制章节': 'Section duplicated',
    '已复制题目': 'Question duplicated',
    '复制到此': 'Copy here',
    '拖到此处复制': 'Drop to duplicate',
    '拖入删除': 'Drop to delete',
    '拖到此处删除': 'Drop to delete',
    '发布提醒': 'Publish notice',
    '仍要发布': 'Publish anyway',
    '以下内容可能未完善，确认仍要发布吗？': 'The following may be incomplete. Publish anyway?',
    '问卷还没有任何题目，请先添加题目后再发布。': 'This questionnaire has no questions yet. Add questions before publishing.',
    '章节「{1}」下还没有题目': 'Section "{1}" has no questions yet',
    '第 {1} 题还没有填写题干': 'Question {1} has no question text yet',
    ' 说明': ' Description',
    ' 上传标准/报告': ' Upload standard/report',
    '我的报告': 'My Reports',
    '版本：': 'Version: ',
    '<span class="muted">关键条款 ': '<span class="muted">Key clauses ',
    ' 项</span> › 查看': ' items</span> › View',
    '<div class="muted" style="padding:16px">加载中…</div>': '<div class="muted" style="padding:16px">Loading…</div>',
    '关联供应商：': 'Linked suppliers: ',
    '发布：': 'Published: ',
    '官方信息：': 'Official info: ',
    '如 强迫劳动、本地要求、客户指定': 'e.g. forced labor, local requirements, customer-specified',
    ' 查看关联 PDF': ' View linked PDF',
    '如 强迫劳动、工时': 'e.g. forced labor, working hours',
    ' 删除标准': ' Delete standard',
    '确定删除用户标准「': 'Confirm deleting user standard "',
    '」吗？关联的 PDF 文件也会一并删除。': '"? The linked PDF file will also be deleted.',
    ' · PDF 预览': ' · PDF Preview',
    '确定删除报告「': 'Confirm deleting report "',
    '」吗？此操作不可撤销。': '"? This action cannot be undone.',
    '用户上传': 'User upload',
    '用户上传的标准 PDF（本地文件）。': 'Standard PDF uploaded by user (local file).',
    '未知错误': 'Unknown error',
    '图片解码失败': 'Image decoding failed',
    '该项为必填数据但缺失，影响数据完整性与可追溯性。': 'This required field is missing, affecting data integrity and traceability.',
    '回答：否': 'Answer: No',
    '必填未填': 'Required but empty',

    // —— 标准库分类 tab（英文） ——
    '国际社会责任标准': 'International Social Responsibility Standards',
    '职业安全与健康': 'Occupational Safety & Health',
    '国内劳动法规': 'Domestic Labor Regulations',
    '消防安全法规': 'Fire Safety Regulations',
    '环境保护法规': 'Environmental Protection Regulations',

    // —— 标准模块扩充：新分类 / tab / 审核流程 / 自查清单 / 趋势 / 客户评分 ——
    '行业特定标准': 'Industry-Specific Standards',
    '客户特定验厂标准': 'Customer-Specific Audit Standards',
    '质量管理标准': 'Quality Management Standards',
    '反恐安全标准': 'Anti-Terrorism Security Standards',
    '审核流程': 'Audit Process',
    '合规自查': 'Compliance Checklist',
    '趋势更新': 'Trend Updates',
    // 审核流程
    '暂无审核流程数据。': 'No audit process data.',
    '时长：': 'Duration: ',
    '参与方：': 'Participants: ',
    '需准备文件：': 'Required documents: ',
    // 自查清单
    '暂无自查清单数据。': 'No checklist data.',
    '核查项目': 'Check Item',
    '合规标准': 'Standard',
    '所需佐证材料': 'Required Evidence',
    '级别': 'Level',
    '必查': 'Critical',
    '重点': 'Major',
    // 趋势
    '暂无趋势数据。': 'No trend data.',
    '影响：高': 'Impact: High',
    '影响：中': 'Impact: Medium',
    '影响：低': 'Impact: Low',
    '涉及标准：': 'Affected standards: ',
    '行动要求：': 'Action required: ',
    // 客户评分
    '评分标准': 'Scoring Criteria',
    '维度': 'Dimension',
    '通过线': 'Pass',
    '考核项': 'Items',
    '零容忍项': 'Zero Tolerance',
    // 等级
    '绿灯': 'Green',
    '黄灯': 'Yellow',
    '红灯': 'Red',
    '通过': 'Pass',
    '条件通过': 'Conditional Pass',
    '不通过': 'Fail',
    '通过，有效期12个月': 'Pass, valid for 12 months',
    '需整改，90天内复审': 'Remediation required, re-audit within 90 days',
    '需整改，60天内复审': 'Remediation required, re-audit within 60 days',
    '需整改，30天内复审': 'Remediation required, re-audit within 30 days',
    '需整改，30天内提交证据': 'Remediation required, submit evidence within 30 days',
    '不通过，暂停合作': 'Fail, cooperation suspended',
    '90天后可重新申请': 'Can reapply after 90 days',
    '暂停合作，90天后重审': 'Cooperation suspended, re-audit after 90 days',
    '有效期12个月': 'Valid for 12 months',

    // —— 动态 key（T(variable) 调用，无法被字面量扫描捕获，需手动补充）——
    // 问题等级（Q_LEVELS）
    '红线/严重': 'Red line / Critical',
    '重大': 'Major',
    '一般': 'General',
    '建议': 'Advisory',
    '不可接受，必须立即纠正': 'Unacceptable, must be corrected immediately',
    '重要不符合项，需限期整改': 'Major non-conformity, requires corrective action within a deadline',
    '轻微不符合 / 关注项': 'Minor non-conformity / Observation',
    '改进建议项': 'Improvement suggestion',
    // 供应商等级（TIER_OPTIONS）
    '一级供应商': 'Tier 1 Supplier',
    '二级供应商': 'Tier 2 Supplier',
    '三级供应商': 'Tier 3 Supplier',
    '原料供应商': 'Material Supplier',
    '分包商': 'Subcontractor',
    '代工厂 / OEM': 'OEM Factory',
    '品牌方 / 自有工厂': 'Brand / Owned Factory',
    '物流服务商': 'Logistics Provider',

    // —— 问卷设计：保存 / Excel 导入导出 ——
    '保存问卷': 'Save Questionnaire',
    '导入 Excel': 'Import Excel',
    '导出 JSON': 'Export JSON',
    '导入 JSON': 'Import JSON',
    'JSON 模板已导出：': 'JSON template exported: ',
    '文件不是有效的 JSON': 'File is not valid JSON',
    '无效的问卷模板文件（缺少题目结构）': 'Invalid questionnaire template (missing question structure)',
    '已导入问卷模板': 'Imported questionnaire template ',
    'Excel 组件未加载': 'Excel component not loaded',
    '请先选择或新建问卷': 'Please select or create a questionnaire first',
    '问卷已保存：': 'Questionnaire saved: ',
    '未识别到问卷表头（需含“问题”列）': 'Could not find the questionnaire header (a "Question" column is required)',
    '未发现有效题目': 'No valid questions found',
    '已导入问卷': 'Imported questionnaire ',
    ' 章节 / ': ' sections / ',
    ' 题': ' questions',
    '导入问卷': 'Imported Questionnaire',
    '参考/指南': 'Reference / Guide',
    '添加参考/指南': 'Add Reference / Guide',
    '参考/指南内容': 'Reference / Guide Content',
    '指南': 'Guide',
    '参考/指南（仅供审核员查看，不计入评分）': 'Reference / Guide (visible to auditors only, not scored)',
    '此部分仅供审核员参考查看，不会被填写或计入评分。': 'This section is reference-only for auditors and is not filled in or scored.',
    '参考/指南模块不含题目，仅用于向审核员展示说明、标准摘录或操作指引。': 'A Reference / Guide module contains no questions; it shows notes, standard excerpts, or operating instructions for auditors.',
    '删除参考/指南': 'Delete Reference / Guide',
    '（暂无参考内容）': 'No reference content yet',

    // ===== 问卷库 / 已保存问卷（Feature: 列表管理）=====
    '问卷库': 'Questionnaire Library',
    '导入所选（可多选合并）': 'Import Selected (merge multiple)',
    '单独导入': 'Import Alone',
    '综合问卷': 'Combined Questionnaire',
    '来源标准：': 'Source Standard: ',
    '请先勾选至少一个标准': 'Select at least one standard first',
    '未找到所选标准': 'Selected standard not found',
    '已导入问卷：': 'Imported questionnaire: ',
    '导出 Word': 'Export Word',
    '导出 PDF': 'Export PDF',
    'Word 已导出：': 'Word exported: ',
    'PDF 组件未加载': 'PDF component not loaded',
    '已保存问卷': 'Saved Questionnaires',
    '已发布': 'Published',
    '已结束': 'Closed',
    '搜索问卷标题…': 'Search by title…',
    '排序方式': 'Sort by',
    '创建时间（新→旧）': 'Created (new→old)',
    '创建时间（旧→新）': 'Created (old→new)',
    '更新时间（新→旧）': 'Updated (new→old)',
    '标题（A→Z）': 'Title (A→Z)',
    '打开': 'Open',
    '设置状态': 'Set Status',
    '筛选状态': 'Filter status',
    '将问卷标记为：': 'Mark questionnaire as: ',
    '无已保存问卷，请新建或导入。': 'No saved questionnaires. Create or import one.',
    '当前': 'Current',
    '已更新状态': 'Status updated',
    '编号': 'No.',
    '拖拽卡片可调整顺序': 'Drag cards to reorder',
    '拖拽题目可调整顺序': 'Drag questions to reorder',
    '共 {0} 套问卷': '{0} questionnaires',

    // ===== 问题参考依据 / 填写说明 =====
    '参考依据 / 填写说明（背景·定义·示例，可选）': 'Reference Basis / Filling Instructions (background · definition · example; optional)',
    '判定依据': 'Assessment Basis',
    '参考依据': 'Reference Basis',
    '填写说明': 'Filling Instructions',

    // ===== PDF 报告优化（专业 / 可对比）=====
    '审核结论': 'Audit Conclusion',
    '综合评级': 'Overall Rating',
    '评级': 'Rating',
    '等级 A（优秀）': 'Grade A (Excellent)',
    '等级 B（良好）': 'Grade B (Good)',
    '等级 C（需改进）': 'Grade C (Needs Improvement)',
    '等级 D（不合格）': 'Grade D (Fail)',
    '问题点明细与整改建议': 'Findings & Corrective Actions',
    '整改建议': 'Corrective Action',
    '审核明细（答案对照）': 'Audit Details (Answer Review)',
    '评估依据与答案对照': 'Basis & Answer Review',
    '结论与建议': 'Conclusion & Recommendations',
    '问题点风险分布': 'Findings Risk Distribution',
    '整体风险指数': 'Overall Risk Index',
    '无不符合项 / 待改进项（基于当前等级与回答）。': 'No non-conformities / improvement items found (based on current levels and answers).',
    '审核结论：': 'Conclusion: ',
    '本报告由 供应商预审平台 系统生成，数据存放于本机 IndexedDB 数据库，仅供内部合规管理使用。报告编号 RPT-': 'This report is generated by the Supplier Pre-Assessment Platform. Data is stored in the local IndexedDB database for internal compliance management only. Report No. RPT-',

    // ===== 被审核单位档案 / 审核类型 =====
    '被审核单位档案': 'Auditee Archive',
    '统一社会信用代码': 'Unified Social Credit Code',
    '单位名称': 'Legal Entity Name',
    '单位地址': 'Address',
    '联系方式': 'Contact Phone',
    '上次审核日期': 'Last Audit Date',
    '行业分类': 'Industry',
    '经营范围': 'Business Scope',
    '审核类型': 'Audit Type',
    '年度审核': 'Annual Audit',
    '专项审核': 'Special Audit',
    '跟踪审核': 'Follow-up Audit',
    '其他审核': 'Other Audit',
    '信用代码格式不正确（应为 18 位，含数字与大写字母，不含 I/O/Z/S/V，末位可为数字或 X）': 'Invalid credit code (must be 18 chars: digits and uppercase letters excluding I/O/Z/S/V; last char may be X)',
    '请填写单位名称与统一社会信用代码': 'Please fill entity name and unified social credit code',
    '复制档案': 'Duplicate Archive',
    '档案已复制，可在评估中选用': 'Archive duplicated; available for assessment',
    '档案库': 'Archive Library',
    '从历史记录快速选择或导入，避免重复输入。': 'Quickly pick or duplicate from history to avoid re-entry.',

    // ===== 自定义风险 =====
    '风险情况': 'Risk Assessment',
    '风险描述': 'Risk Description',
    '请选择风险等级': 'Select risk level',
    '未评定风险': 'Risk not assessed',

    // ===== 现场预审流程 =====
    '现场预审流程': 'On-site Pre-audit Process',
    '审核流程记录': 'Process Record',
    '开始会议': 'Opening Meeting',
    '现场走访': 'Site Walkthrough',
    '文件查看': 'Document Review',
    '员工访谈': 'Worker Interview',
    '末次会议': 'Closing Meeting',
    '会议时间': 'Meeting Time',
    '会议地点': 'Meeting Place',
    '参与人员': 'Participants',
    '会议议程': 'Agenda',
    '走访区域': 'Areas Visited',
    '走访路线': 'Route',
    '观察情况': 'Observations',
    '上传走访照片': 'Upload Walkthrough Photos',
    '文件清单': 'Document Checklist',
    '文件名称': 'Document Name',
    '完整性': 'Completeness',
    '合规性': 'Compliance',
    '访谈对象': 'Interviewee',
    '访谈方式': 'Interview Method',
    '访谈摘要': 'Interview Summary',
    '主要发现': 'Key Findings',
    '一对一': 'One-on-one',
    '小组访谈': 'Group',
    '审核初步结论': 'Preliminary Conclusion',
    '改进建议沟通': 'Improvement Suggestions',
    '添加文件项': 'Add Document Item',
    '添加访谈记录': 'Add Interview Record',
    '添加自定义环节': 'Add Custom Stage',
    '自定义环节': 'Custom Stage',
    '环节标题': 'Stage Title',
    '仅事实总结，无评级': 'Facts only, no rating',
    '审核发现总结': 'Audit Findings Summary',

    // ===== 报告设置 =====
    '报告设置': 'Report Settings',
    '包含综合评级': 'Include Overall Rating',
    '显示风险情况': 'Show Risk Assessment',
    '显示现场预审流程': 'Show On-site Process',
    '报告配置已保存': 'Report config saved',

    // ===== 供应链看板 / 供应商分布 =====
    '供应链看板': 'Supply Chain Board',
'供应商代码': 'Supplier Code',
    '全部国家': 'All Countries',
    '全部评估记录': 'All Assessment Records',
    '已评估': 'Assessed',
    '未评估': 'Not Assessed',
    '缩放': 'Zoom',
    '供应商地图': 'Supplier Map',
    '供应链概览': 'Supply Chain Overview',
    '供应商分布': 'Supplier Distribution',
    '供应链列表': 'Supply Chain List',
    '国家/地区': 'Country / Region',
    '城市': 'City',
    '合作状态': 'Cooperation Status',
    '准时交货率': 'On-time Delivery Rate',
    '质量合格率': 'Quality Pass Rate',
    '合作中': 'Active',
    '暂停合作': 'Paused',
    '已终止': 'Terminated',
    '潜在': 'Potential',
    '纬度': 'Latitude',
    '经度': 'Longitude',
    '层级': 'Tier',
    '原材料': 'Raw Material',
    '成品': 'Finished Product',
    '节点状态': 'Node Status',
    '正常': 'Normal',
    '延迟': 'Delayed',
    '异常': 'Abnormal',
    '停工': 'Halted',
    '异常标识': 'Anomaly Flag',
    '无异常': 'None',
    '延迟交付': 'Late Delivery',
    '质量不合格': 'Quality Failure',
    '停产': 'Production Halt',
    '其他异常': 'Other Anomaly',
    '在供应链中筛选': 'Filter Supply Chain',
    '重置视图': 'Reset View',
    '清除筛选': 'Clear Filter',
    '聚合': 'Clustered',
    '家供应商': ' suppliers',
    '生成示例数据': 'Load Sample Data',
    '清空示例数据': 'Clear Sample Data',
    '导入供应商': 'Import Suppliers',
    '导入供应链': 'Import Supply Chain',
    '导出数据': 'Export Data',
    '管理层只读模式': 'Read-only Mode (Management)',
    '管理层只读模式说明': '当前为只读视图：可查看、筛选与导出数据，但不能编辑、导入或删除。如需修改请联系采购专员。',
    '导入 Excel 后将按"供应商编码"匹配，已存在则更新，否则新建。': 'Import matches by supplier code; existing records are updated, new ones created.',
    '供应链 Excel 列：物料/产品名称、层级、关联供应商编码、上游物料名称、节点状态、异常标识、数量、备注。': 'Supply-chain Excel columns: material, tier, supplier code, upstream material, node status, anomaly, qty, note.',
    '供应链链路': 'Supply Chain Links',
    '异常预警': 'Anomaly Alerts',
    '暂无异常': 'No anomalies',
    '一键下钻': 'Drill Down',
    '关注区域集中度': 'Concentration by Region',
    '覆盖国家/地区': 'Countries Covered',
    '显示模式': 'View Mode',
    '树形': 'Tree',
    '列表': 'List',
    '打开供应链看板': 'Open Supply Chain Board',
    '点击标记查看供应商详情；密集区域将自动聚合。': 'Click a marker for supplier details; dense areas auto-cluster.',
    '绩效图例': 'Performance',
    '暂无带坐标的供应商': 'No suppliers with coordinates',
    '请在供应商资料中补充经纬度后在此查看分布': 'Add latitude/longitude in supplier profiles to see them here',
    '该区域': 'Region:',
    '高（≥90%）': 'High (≥90%)',
    '中（75–89%）': 'Medium (75–89%)',
    '低（<75%）': 'Low (<75%)',
    '示例数据已生成': 'Sample data generated',
    '已清空示例数据': 'Sample data cleared',
    '供应商已更新': 'Suppliers updated',
    '供应链已导入': 'Supply chain imported',
    '请先下载模板并填写': 'Download the template first',
    '下载供应商模板': 'Download Supplier Template',
    '下载供应链模板': 'Download Supply Chain Template',
    'OSH 模式说明': '参考 Open Supply Hub：统一字段标准、开放协作、透明可追溯。',
    '标准化字段': 'Standardized Fields',
    '协作权限': 'Collaboration Roles',
    '透明度': 'Transparency',
    '外部系统对接（API）': 'External System Sync (API)',
    '预留 ERP/SRM 同步接口，可通过 JSON 批量导入实现数据自动同步。': 'Reserved ERP/SRM sync: bulk JSON import enables automated data sync.',

    // ===== 报告模板 / PDF 引擎 =====
    '报告模板（版式 / 尺寸 / 性能 / 安全）': 'Report Templates (layout / size / performance / security)',
    '选择评估记录，使用模板化引擎生成 PDF；或导出 Excel。模板可自定义版式、尺寸、性能与安全。': 'Select assessments and generate a PDF via the template engine, or export Excel. Templates customize layout, size, performance and security.',
    '批量导出': 'Batch Export',
    '⇩ Excel': '⇩ Excel',
    '⇩ 不符合项': '⇩ Non-conformity',
    '按章节导出': 'Export by Chapter',
    '已启用模板：': 'Template enabled: ',
    '已复制模板': 'Template duplicated',
    '模板已保存': 'Template saved',
    '删除模板 ': 'Delete template ',
    '报告模板': 'Report Template',
'报告模板（锁定通用版式）': 'Report Template (Locked Universal Layout)',
    '系统已锁定一套通用报告模板（综合 FFC / WCA 排版规范），不可编辑，导出前可预览确认。': 'A universal report template (synthesizing FFC / WCA layout norms) is locked and non-editable; preview before export.',
    '预览通用模板': 'Preview Universal Template',
    '通用报告（标准）': 'Universal Report (Standard)',
    '已锁定': 'Locked',
    '固定结构：封面 / 工厂信息 / 评分汇总 / 五维度评分 / 非合规项与整改 / 优势与挑战 / 最佳实践 / 照片证据（可选）': 'Fixed structure: Cover / Factory Info / Score Summary / Five-dimension Scores / Non-conformities & Remediation / Strengths & Challenges / Best Practices / Photo Evidence (optional)',
    '标准报告': 'Standard Report',
    '简洁版': 'Compact',
    '打印优化版': 'Print Optimized',
    '手机': 'Phone',
    'A5': 'A5',
    'A4': 'A4',
    'A3': 'A3',
    '优化质量': 'Quality',
    '平衡': 'Balanced',
    '嵌入全部字体': 'Embed all fonts',
    '排除常用字体': 'Exclude common fonts',
    '编辑模板': 'Edit Template',
    '基础与封面': 'Basics & Cover',
    '模板名称': 'Template Name',
    '副标题': 'Subtitle',
    '显示机构名': 'Show Organization',
    '显示时间': 'Show Time',
    '页眉 / 页脚': 'Header / Footer',
    '页眉元素': 'Header elements',
    '页脚元素': 'Footer elements',
    // 章节 → 纸张尺寸映射（混合尺寸配置入口）
    '章节尺寸映射（可混合尺寸）': 'Section → Page Size Mapping (mixed sizes)',
    '每个章节可单独指定纸张与方向；选择「自动」则跟随下方目标尺寸，改一处即整份换版。': 'Each section can use its own paper size and orientation. Choose "Auto" to follow the target size below — change it once to re-lay out the whole document.',
    ' 章节独立尺寸': ' section overrides',
    '封面': 'Cover',
    '基本信息': 'Key Facts',
    '结果汇总': 'Result Summary',
    '审核明细': 'Audit Details',
    '现场流程': 'On-site Process',
    '报告声明': 'Disclaimer',
    '自动（跟随目标尺寸）': 'Auto (follow target size)',
    '手机（纵向）': 'Phone (portrait)',
    '手机（横向）': 'Phone (landscape)',
    'A5（纵向）': 'A5 (portrait)',
    'A5（横向）': 'A5 (landscape)',
    'A4（纵向）': 'A4 (portrait)',
    'A4（横向）': 'A4 (landscape)',
    'A3（纵向）': 'A3 (portrait)',
    'A3（横向）': 'A3 (landscape)',
    '样式': 'Style',
    '字体（CSS font-family）': 'Font (CSS font-family)',
    '正文字号': 'Body font size',
    '标题字号': 'Heading font size',
    '行距': 'Line height',
    '正文颜色': 'Body text color',
    '标题颜色': 'Heading color',
    '页边距 X (mm)': 'Margin X (mm)',
    '页边距 Y (mm)': 'Margin Y (mm)',
    '自定义 CSS 片段': 'Custom CSS snippet',
    '尺寸与性能': 'Size & Performance',
    '目标尺寸': 'Target size',
    '方向': 'Orientation',
    '压缩级别': 'Compression level',
    '栏数': 'Columns',
    '图像质量': 'Image quality',
    '字体嵌入': 'Font embedding',
    '安全与元数据': 'Security & Metadata',
    '打开口令': 'Open password',
    '作者': 'Author',
    '关键词': 'Keywords',
    '内容开关': 'Content toggles',
    '显示综合评级': 'Show overall rating',
    '显示现场流程': 'Show on-site process',
    '保存模板': 'Save Template',
    '实时预览': 'Live Preview',
    '纵向': 'Portrait',
    '横向': 'Landscape',
    '优化质量（图片密集）': 'Quality (image-heavy)',
    '平衡（默认）': 'Balanced (default)',
    '最小（严格体积）': 'Minimal (strict size)',
    '单栏': 'Single',
    '双栏': 'Two columns',
    '三栏': 'Three columns',
    '自动（按尺寸）': 'Auto (by size)',
    '机构名': 'Org name',
    '页码': 'Page number',
    '版权': 'Copyright',
    '报告标题（显示在封面）': 'Report title (on cover)',
    '实时预览（缩放显示）。切换模板参数后会随之更新。': 'Live preview (scaled). Updates as you change template parameters.',
    '模板预览': 'Template Preview',
    '预计 ': 'Estimated ',
    ' 页（混合尺寸：': ' pages (mixed sizes: ',
    ' 页，': ' pages, ',
    '没有可预览的评估': 'No assessment to preview',
    '正在批量导出 ': 'Batch exporting ',
    ' 份报告…': ' reports…',
    '批量导出进度 ': 'Batch export progress ',
    '批量导出完成：': 'Batch export done: ',
    ' 份 PDF，确定继续？': ' PDFs. Continue?',
    '正在按章节生成 ': 'Generating by chapter: ',
    ' 份…': ' files…',
    '章节导出进度 ': 'Chapter export progress ',

    // ===== 报告正文（进入 PDF 的内容文案）=====
    '预览 / 导出 PDF（': 'Preview / Export PDF (',
    '报告信息': 'Report Information',
    '受审核方核心标识与登记信息': 'Core identifiers and registry data of the audited party',
    '项目': 'Item',
    '内容': 'Content',
    '审核日期': 'Audit Date',
    '评估情况汇总': 'Assessment Summary',
    '评分、风险等级与各章节合规表现': 'Scores, risk levels and compliance by section',
    '自定义风险等级': 'Custom Risk Level',
    '综合评级与判定依据': 'Overall rating and basis of determination',
    '按风险等级降序排列，含数据风险评级与整改建议': 'Sorted by risk level (descending), with data risk rating and corrective advice',
    '标准明确 · 答案对照 · 评分分级': 'Explicit criteria · answer comparison · graded scoring',
    '题目 / 判定依据': 'Question / Basis of determination',
    '判定依据：': 'Basis: ',
    '按环节顺序记录审核过程与事实（无评级、仅事实）': 'Audit process recorded step by step (facts only, no rating)',
    '整体说明': 'Overall notes',
    '环节记录': 'Step records',
    '完整': 'Complete',
    '不完整': 'Incomplete',
    '合规': 'Compliant',
    '不合规': 'Non-compliant',
    '报告声明 / Report Disclaimer': 'Report Disclaimer',
    '自定义风险评定（独立于客观评分，不构成评级结论）': 'Custom risk assessment (independent of objective scoring; not a rating conclusion)',
    '本问卷无可评分项，无法给出完整评级，请补充评分题或是否题。': 'This questionnaire has no scorable items, so no complete rating can be issued. Add scored or yes/no questions.',
    '存在红线/严重不符合项或综合评分过低，判定为不合格：须立即纠正并安排复审验证。': 'Red-line or critical non-conformities, or an overall score below threshold: judged non-conforming. Immediate correction and a follow-up audit are required.',
    '存在重要不符合项，需在限定周期内完成整改并验证有效性。': 'Major non-conformities exist. Corrective actions must be completed within the set period and verified for effectiveness.',
    '整体合规状况良好，少数项需持续关注并纳入改进计划。': 'Overall compliance is sound. A few items need ongoing attention and inclusion in the improvement plan.',
    '合规状况优秀，建议保持并推动持续改进。': 'Compliance is excellent. Maintain current practice and continue improving.',
    '嵌入所有字体': 'Embed all fonts',
    '排除常用系统字体': 'Exclude common system fonts',
    '留空则不加密': 'Leave blank for no encryption',
    '标题': 'Title',
    '不符合项汇总_': 'Nonconformities_',
    // 页眉/页脚拖拽布局器
    '页眉 / 页脚（拖拽落位）': 'Header / Footer (drag to place)',
    '把下方标签拖到页眉或页脚的左/中/右格；也可点击标签上的箭头移位、× 移除。': 'Drag the chips below into the left / center / right cell of the header or footer. You can also use the arrows to move a chip, or × to remove it.',
    '页眉': 'Header',
    '页脚': 'Footer',
    '靠左': 'Left',
    '居中': 'Center',
    '靠右': 'Right',
    '左移': 'Move left',
    '右移': 'Move right',
    '移除': 'Remove',
    '全部页': 'All pages',
    '仅首页': 'First page only',
    '不显示': 'Hidden',
    '拖到此处': 'Drop here',
    '未使用': 'Unused',
    '全部已使用': 'All in use',
    // 自定义字体导入
    '自定义字体（TTF / OTF）': 'Custom fonts (TTF / OTF)',
    '导入字体文件（TTF / OTF）': 'Import font file (TTF / OTF)',
    '未导入自定义字体，使用上方 font-family 指定的系统字体。': 'No custom font imported. The system fonts listed in font-family above will be used.',
    '设为正文字体': 'Use as body font',
    '已设为正文字体：': 'Set as body font: ',
    '该字体不可嵌入：': 'This font cannot be embedded: ',
    '字体已导入：': 'Font imported: ',
    '字体文件读取失败': 'Failed to read the font file',
    '未声明嵌入限制': 'no embedding restriction declared',
    '字体授权为 Restricted License embedding，禁止嵌入': 'the license is Restricted License embedding, which forbids embedding',
    '字体仅允许位图嵌入，无法用于矢量文本嵌入': 'bitmap-only embedding is permitted, which cannot be used for vector text embedding',
    '可编辑嵌入': 'editable embedding permitted',
    '允许预览与打印嵌入': 'preview & print embedding permitted',
    '允许安装式嵌入': 'installable embedding permitted',

    // ===== ESG 问卷模块 =====
    'ESG 问卷': 'ESG Questionnaire',
    'ESG 专项': 'ESG',
    '独立 ESG 数据采集与评估模块 · 兼容 ISSB / GRI / TCFD · EcoVadis 式四主题评分': 'Standalone ESG data collection & assessment module · supports ISSB / GRI / TCFD · EcoVadis-style four-theme scoring',
    '新建 ESG 问卷': 'New ESG Questionnaire',
    'ESG 问卷数': 'ESG Questionnaires',
    '平均 ESG 得分': 'Avg. ESG Score',
    '已完成评估': 'Completed',
    '还没有 ESG 问卷。点击「新建 ESG 问卷」选择披露标准并开始采集。': 'No ESG questionnaire yet. Click "New ESG Questionnaire" to pick disclosure standards and start collecting.',
    '组织 / 行业': 'Org / Industry',
    '采用标准': 'Standards',
    'ESG 得分': 'ESG Score',
    '填写': 'Fill',
    '报告': 'Report',
    '确认删除': 'Confirm Delete',
    '确认删除该问卷及其评分数据？此操作不可恢复。': 'Delete this questionnaire and its scoring data? This cannot be undone.',
    '如 2026 年度 ESG 披露问卷': 'e.g. 2026 Annual ESG Disclosure Questionnaire',
    '组织 / 公司名称': 'Organization / Company',
    '组织 / 公司': 'Organization / Company',
    '行业（基准对标）': 'Industry (benchmark)',
    '请选择行业（用于基准对标）': 'Select industry (for benchmarking)',
    '将生成四大主题共 ': 'Will generate ',
    ' 项评分题（': ' scoring items across four themes (',
    '）。重叠议题已自动合并。': '). Overlapping topics are auto-merged.',
    '采用披露标准（可多选，合并生成）': 'Disclosure standards (multi-select, merged)',
    '生成问卷并填写': 'Generate & Fill',
    '请至少选择一个披露标准': 'Select at least one disclosure standard',
    '问卷已生成': 'Questionnaire created',
    '生成失败：': 'Creation failed: ',
    '权重': 'Weight',
    '保存并完成评分': 'Save & Score',
    '保存草稿': 'Save Draft',
    '跨标准合并': 'Cross-standard merged',
    // ESG 自定义议题（REQ-E-07）
    '自定义议题': 'Custom topic',
    '自定义': 'Custom',
    '议题名称不能为空': 'Topic name is required',
    '议题名称过长（≤120 字）': 'Topic name too long (max 120 chars)',
    '权重必须大于 0': 'Weight must be greater than 0',
    '下拉选项至少 2 项': 'Dropdown needs at least 2 options',
    '数值下限必须小于上限': 'Min must be less than max',
    '议题所属主题不存在': 'Target theme not found',
    '添加议题': 'Add topic',
    '添加自定义议题': 'Add custom topic',
    '编辑自定义议题': 'Edit custom topic',
    '仅可删除自定义议题': 'Only custom topics can be deleted',
    '确认删除该议题及其填报值？': 'Delete this topic and its response value?',
    '删除自定义议题': 'Delete custom topic',
    '议题已保存': 'Topic saved',
    '议题已删除': 'Topic deleted',
    '如：可再生能源用电占比': 'e.g. Renewable electricity share',
    '议题名称': 'Topic name',
    '所属主题': 'Theme',
    '是/否': 'Yes/No',
    '1-5 评分': '1-5 rating',
    '数值': 'Number',
    '下拉单选': 'Dropdown (single)',
    '如：tCO2e、%、小时': 'e.g. tCO2e, %, hours',
    '单位（数值题）': 'Unit (number type)',
    '下限': 'Min',
    '上限': 'Max',
    '权重（0.1-10）': 'Weight (0.1-10)',
    '下拉选项（每行：选项=分数 0-100）': 'Options (one per line: label=score 0-100)',
    '每行一项：选项=分数（0-100）': 'One per line: label=score (0-100)',
    '保存议题': 'Save topic',
    // ESG 附件（REQ-E-10）
    '附件与佐证材料': 'Attachments & Evidence',
    '不关联具体议题': 'Not linked to a topic',
    '上传附件': 'Upload attachment',
    '支持图片 / 文档，单文件 ≤ 2MB，存储于本机 IndexedDB，可关联任意议题作为佐证。': 'Images/documents, max 2MB each, stored locally in IndexedDB; can be linked to any topic as evidence.',
    '暂无附件。可先在上方选择关联议题，再上传佐证材料（如能耗账单、培训签到、排污许可）。': 'No attachments yet. Pick a linked topic above, then upload evidence (e.g. energy bills, training records, permits).',
    '附件已上传': 'Attachment uploaded',
    '单文件不能超过 2MB': 'File exceeds 2MB limit',
    '关联': 'Linked: ',
    '确认删除该附件？': 'Delete this attachment?',
    '附件已删除': 'Attachment deleted',
    '附件清单': 'Attachment list',
    '上传时间': 'Uploaded at',
    '文件名': 'File name',
    '大小': 'Size',
    '请选择': 'Select',
    '请评分': 'Rate',
    '定性说明': 'Qualitative note',
    '当前加权总分 ': 'Current weighted total ',
    ' / 100 · ': ' / 100 · ',
    '填报覆盖 ': 'Coverage ',
    '校验提示（': 'Validation (',
    ' 项）': ' items)',
    '存在必填项或红线项未通过校验，已高亮，请修正后再完成。': 'Required or red-line items failed validation (highlighted). Fix them before completing.',
    '评分已完成': 'Scoring completed',
    '草稿已保存': 'Draft saved',
    'ESG 报告': 'ESG Report',
    '返回填写': 'Back to Fill',
    '雷达分析图': 'Radar Analysis',
    '加权总分': 'Weighted Total',
    '同比': 'YoY',
    '改进建议': 'Improvement Suggestions',
    '跨标准议题映射': 'Cross-standard Topic Mapping',
    '议题组': 'Topic Group',
    '对应标准条款': 'Standard Clauses',
    '说明': 'Note',
    '必填项未填写': 'Required field empty',
    '数值格式无效': 'Invalid number format',
    '低于合理下限': 'Below reasonable minimum',
    '超出合理上限': 'Above reasonable maximum',
    '红线项：发现童工违规': 'Red line: child labor violation found',
    '红线项：发现强迫劳动': 'Red line: forced labor found',
    '已填写碳中和目标年份，但未设定科学碳目标（SBTi）': 'Carbon-neutral year filled but no SBTi target set',
    '同比波动超 50%': 'YoY deviation > 50%',
    '建议优先提升': 'Prioritize improving',
    '维度（当前 ': ' dimension (current ',
    ' 分），补齐权重较高且未达标评分项。': ' pts); reinforce high-weight under-performing items.',
    '导出失败：': 'Export failed: ',
    '评分汇总': 'Score Summary',
    '填报明细': 'Response Details',
    '议题映射': 'Topic Mapping',
    '四主题得分': 'Four-theme Scores',
    '主题': 'Theme',
    '行业基准': 'Industry Benchmark',
    '覆盖': 'Coverage',
    '环境': 'Environment',
    '劳工与人权': 'Labor & Human Rights',
    '商业道德': 'Business Ethics',
    '可持续采购': 'Sustainable Procurement',

    // ===== 指令历史回溯 (Goal 3) =====
    '指令历史回溯': 'Directive History Trace',
    '结构化指令索引': 'Structured directive index',
    '条': ' items',
    '部分实现': 'Partially implemented',
    '未实现': 'Not implemented',
    '输入关键词反向搜索指令（Ctrl+R 式）': 'Type a keyword to reverse-search directives (Ctrl+R style)',
    '无匹配指令': 'No matching directive',
    '代码引用': 'Code ref',
    '缺口': 'Gap',
    '原因': 'Reason',
    '风险': 'Risk',
    '优先级': 'Priority',

    // ===== 供应商档案 · 文件管理（PDF / Excel 归档） =====
    '文件管理': 'File Management',
    '权限说明': 'Permission Notes',
    '已归档 {0} 份文件 · 占用 {1} MB / 配额 {2} MB': 'Archived {0} files · {1} MB used / {2} MB quota',
    '需正反面': 'Front & Back required',
    '正面（正本）': 'Front (Original)',
    '反面（副本）': 'Back (Duplicate)',
    '正面': 'Front',
    '反面': 'Back',
    '上传': 'Upload',
    '仅支持 PDF / Excel（.pdf/.xlsx/.xls）；单文件 ≤ 10MB；单次最多 10 个；系统按「供应商编码_分类_日期」自动命名。': 'PDF / Excel only (.pdf/.xlsx/.xls); ≤10MB per file; ≤10 files per batch; auto-named as code_category_date.ext.',
    '暂无文件': 'No files yet',
    '⚠ 营业执照需同时上传正面（正本）与反面（副本）；当前缺失：': '⚠ Business License requires both front (original) and back (duplicate); missing: ',
    '历史版本': 'Version History',
    '已过期': 'Expired',
    '{0} 天内到期': 'Expires in {0} days',
    '自动文件名': 'Auto File Name',
    '原始文件名': 'Original Name',
    '文件分类': 'Category',
    '正反面': 'Front/Back',
    '上传人': 'Uploaded By',
    '到期日': 'Expiry Date',
    '版本说明': 'Version Note',
    '文件详情': 'File Details',
    '设为当前（回滚）': 'Set as Current (Rollback)',
    '回滚版本': 'Rollback Version',
    '确认将 {0} 设为当前版本？历史版本保留，可再次回滚。': 'Set {0} as the current version? History is kept and can be rolled back again.',
    '回滚': 'Rollback',
    '删除文件': 'Delete File',
    '确认删除 {0}？': 'Delete {0}?',
    '当前版本删除后，将自动回退至最新历史版本。': 'After deleting the current version, the latest history version is auto-restored.',
    '已上传 {0} 个文件': 'Uploaded {0} file(s)',
    '上传失败：{0}': 'Upload failed: {0}',
    '读取失败：{0}': 'Read failed: {0}',
    '当前角色无上传权限': 'Current role has no upload permission',
    '请先选择文件': 'Select a file first',
    '单次最多上传 {0} 个文件': 'At most {0} files per upload',
    '不支持的文件类型：{0}（仅允许 PDF / Excel）': 'Unsupported type: {0} (PDF / Excel only)',
    '文件超出 10MB 限制：{0}': 'File exceeds 10MB limit: {0}',
    '该供应商文件已超出配额，仍允许上传，建议清理历史版本': 'This supplier’s files exceed the quota; upload is allowed but archiving old versions is recommended',
    '权限依据当前登录账户的角色判定；角色变更由管理员在「管理员后台」维护。': 'Permissions depend on the signed-in account’s role; change roles in Admin Console.',
    '文件权限矩阵': 'File Permission Matrix',
    '版本回滚': 'Rollback',
    '已回滚至 v{0}': 'Rolled back to v{0}',
    '暂无操作记录': 'No operation logs',
    '操作日志': 'Operation Log',

    // ===== 标准模块 · 术语查询（任务12） =====
    '术语查询': 'Term Glossary',
    '🔍 搜索术语（中文 / 英文 / 拼音 / 缩写，如 qpld、smeta、强迫劳动）': 'Search terms (Chinese / English / Pinyin / abbreviation, e.g. qpld, smeta, forced labor)',
    '全部学科': 'All Disciplines',
    '来源：': 'Source: ',
    '自定义术语': 'Custom Term',
    '没有来源为「{0}」的术语。可切换为「全部」或新增自定义术语。': 'No terms from “{0}”. Switch to “All” or add a custom term.',
    '没有匹配的术语，换个关键词试试。': 'No matching terms. Try another keyword.',
    '别名 / 缩写': 'Aliases / Abbreviations',
    '定义': 'Definition',
    '详细说明': 'Details',
    '相关术语': 'Related Terms',
    '学科：': 'Discipline: ',
    '新增术语': 'Add Term',
    '编辑术语': 'Edit Term',
    '术语（中文）*': 'Term (Chinese) *',
    '英文': 'English',
    '来源': 'Source',
    '学科': 'Discipline',
    '详细说明（可选）': 'Details (optional)',
    '请填写术语': 'Please enter the term',
    '已新增术语': 'Term added',
    '确认删除自定义术语「{0}」？': 'Delete custom term “{0}”?',

    // ===== 审核员指南（任务13 / Goal 13） =====
    '审核员指南': 'Auditor Guides',
'上传指南': 'Upload Guide',
    '指南文件管理': 'Guide Files',
    '上传并分析': 'Upload & Analyze',
    '指南名称': 'Guide Name',
    '上传后系统将自动分析，提取关联标准与检查要点。': 'After upload, the system auto-analyzes and extracts related standards and checkpoints.',
    '删除该指南？': 'Delete this guide?',
    '已删除指南': 'Guide deleted',
    '覆盖领域：': 'Covered areas: ',
    '暂无上传的指南文件。': 'No uploaded guide files yet.',
    '上传审核员指南': 'Upload Auditor Guide',
    '指南已上传并完成分析': 'Guide uploaded and analyzed',
    '通用检查要点': 'General checkpoints',
    '暂未识别具体检查要点，可结合指南内容补充。': 'No specific checkpoints identified; supplement from guide content.',
    '指南文件（PDF / Word）': 'Guide file (PDF / Word)',
    '简要描述 / 适用范围（可选）': 'Brief description / scope (optional)',
    '社会责任审核员指南': 'Social Responsibility Auditor Guide',
    '质量审核员指南': 'Quality Management Auditor Guide',
    '反恐安全审核员指南': 'Supply Chain Security Auditor Guide',
    '环境审核员指南': 'Environmental Auditor Guide',
    '搜索本指南内容（标准要求 / 审核要点 / 不符合项 / 整改建议）…': 'Search this guide (requirements / audit points / non-conformities / remediation)…',
    '书签': 'Bookmarks',
    '添加书签': 'Add Bookmark',
    '取消书签': 'Remove Bookmark',
    '标准要求': 'Requirements',
    '审核要点': 'Audit Points',
    '常见不符合项': 'Common Non-Conformities',
    '参考标准': 'Reference Standards',
    '章节总数': 'Total Chapters',
    '小节总数': 'Total Sections',
    '搜索结果': 'Search Results',
    '请从左侧目录选择章节，或使用上方搜索框搜索内容。': 'Select a chapter from the TOC on the left, or use the search box above.',
    '未找到该章节内容。': 'Section content not found.',
    '暂无审核员指南数据。': 'No auditor guide data available.',
    '请允许弹出窗口以导出 PDF': 'Please allow pop-ups to export PDF',
    '打印 / 保存为 PDF': 'Print / Save as PDF',
    '已导出 Word 文档': 'Word document exported',

    // ===== 照片管理（重构版：上传/分组/评论/批量导出/报告） =====
    '现场照片': 'On-site Photos',
    '上传现场照片，按分组整理并添加评论，可批量导出或生成报告。': 'Upload on-site photos, organize them into groups with comments, then batch-export or generate reports.',
    '上传照片': 'Upload Photos',
    '生成现场照片报告': 'Generate On-site Photo Report',
    '生成报告': 'Generate Report',
    '点击选择或拖拽图片到此处上传': 'Click to select or drag images here to upload',
    '支持 JPG/PNG/WebP 等 · 单文件 ≤5MB · 自动压缩至 720P—1080P': 'Supports JPG/PNG/WebP etc. · single file ≤5MB · auto-compressed to 720P–1080P',
    '支持 JPG/PNG/WebP 等 · 单文件 ≤5MB · 自动统一为 1280×720 横图': 'Supports JPG/PNG/WebP etc. · single file ≤5MB · auto-normalized to 1280×720 landscape',
    '已上传': 'Uploaded',
    '张失败': ' failed',
    '还没有照片。点击「上传照片」或拖拽图片到此处添加。': 'No photos yet. Click "Upload Photos" or drag images here to add them.',
    '共': 'Total',
    '张 · 累计': ' photo(s) · total',
    '全选/取消': 'Select All / Clear',
    '清空选择': 'Clear Selection',
    '已选': 'Selected',
    '张': ' photos',
    '批量导出 ZIP': 'Batch Export ZIP',
    '批量评论': 'Batch Comment',
    '将 ': 'Archive ',
    ' 张照片打包为 ZIP 下载。': ' photo(s) into a ZIP for download.',
    '已开始下载 ZIP': 'ZIP download started',
    '请先勾选要导出的照片': 'Select photos to export first',
    '为所选照片统一添加评论：': 'Add a single comment to all selected photos:',
    '已为 ': 'Added comment to ',
    ' 张照片添加评论': ' photo(s)',
    '请先勾选照片': 'Select photos first',
    '照片分组': 'Photo Groups',
    '新建': 'New',
    '全部照片': 'All Photos',
    '未分组': 'Ungrouped',
    '新建分组': 'New Group',
    '分组名称：': 'Group name:',
    '分组已创建': 'Group created',
    '分组已存在：': 'Group already exists: ',
    '重命名分组': 'Rename Group',
    '删除分组': 'Delete Group',
    '组内照片将移回未分组，照片本身不删除。': 'Photos in the group move back to Ungrouped; the photos themselves are not deleted.',
    '分组已删除': 'Group deleted',
    '移动到分组': 'Move to Group',
    '选择分组': 'Select group',
    '移入': 'Move',
    '已移入分组': 'Moved to group',
    '照片评论': 'Photo Comments',
    '输入评论…': 'Type a comment…',
    '添加评论': 'Add Comment',
    '编辑评论': 'Edit Comment',
    '修改评论内容：': 'Modify comment text:',
    '已添加评论': 'Comment added',
    '暂无评论': 'No comments',
    '条评论': ' comment(s)',
    '无评论': 'No comments',
    '分组': 'Group',
    '评论': 'Comment',
    '现场照片报告': 'On-site Photo Report',
'编辑排版并预览': 'Edit Layout & Preview',
    '布局模板': 'Layout Template',
    '照片尺寸': 'Photo Size',
    '排版编辑': 'Layout Editing',
    '实时预览（所见即所得）': 'Live Preview (WYSIWYG)',
    '输入评论': 'Enter a comment',
    '现场照片报告 · 排版编辑与预览': 'On-site Photo Report · Layout Editing & Preview',
    '拖拽调整照片顺序，点击评论可直接编辑。': 'Drag to reorder photos; click a comment to edit it directly.',
    '副标题/说明（可选）': 'Subtitle / note (optional)',
    '内容范围': 'Content Scope',
    'PDF 已导出': 'PDF exported',
    'PDF 导出失败：': 'PDF export failed: ',
    'Word 已导出': 'Word exported',
    '照片导出': 'Photo Export',
    '生成时间': 'Generated',
    '单次导入总量超': 'Total import exceeds ',
    'MB 上限：': 'MB limit: ',
    '不支持的格式：': 'Unsupported format: ',
    '文件超过 ': 'File exceeds ',
    ' 张': ' photo(s)',
    '已取消': 'Cancelled',
    '失败：': 'Failed: ',
    '相机': 'Camera',
    '调整照片': 'Adjust Photo',
    '逆时针 90°': 'Rotate 90° Counterclockwise',
    '顺时针 90°': 'Rotate 90° Clockwise',
    '保存照片': 'Save Photo',
    '照片保存质量': 'Photo Save Quality',
    '照片保存设置已更新': 'Photo save settings updated',
    '节省空间 · 960×540': 'Space Saver · 960×540',
    '平衡 · 1280×720': 'Balanced · 1280×720',
    '高清 · 质量 92%': 'HD · quality 92%',
    '节省空间 · 质量 72%': 'Space Saver · quality 72%',
    '平衡 · 质量 85%': 'Balanced · quality 85%',
    '照片不存在': 'Photo not found',
    // SUP-034：照片报告自定义选择排版
    '单栏（每张照片独占一行）': 'Single column (one photo per row)',
    '双栏（网格排版，更紧凑）': 'Two columns (compact grid)',
    '照片尺寸：中': 'Photo size: Medium',
    '照片尺寸：小': 'Photo size: Small',
    '照片尺寸：大': 'Photo size: Large',
    '选择照片': 'Select Photos',
    '预览排版并导出': 'Preview & Export',
    '没有可选择的照片': 'No photos available to select',
    '请至少选择一张照片': 'Please select at least one photo',
    '生成现场照片报告 · 选择照片与排版': 'Generate On-site Photo Report · Select Photos & Layout',
    '相册': 'Gallery',
    '删除照片': 'Delete Photo',
    '照片已保存：': 'Photo saved: ',
    '此操作不可恢复。': 'This action cannot be undone.',
    '未选择文件': 'No file selected',
    '处理失败': 'processing failed',
    '照片总数': 'Total Photos',
    '拍照': 'Take Photo',
    '拍照失败：': 'Capture failed: ',
    '正在打开相机…': 'Opening camera…',
    '照片操作': 'Photo Actions',
    '查看大图': 'View Full Size',
    '拍照取消': 'Capture cancelled',
    // SUP-036：区块化自定义排版编辑器
    '插入': 'Insert',
    '从报告移除': 'Remove from Report',
    '切换布局（单栏/双栏）': 'Toggle Layout (Single/Double)',
    '切换尺寸（小/中/大）': 'Toggle Size (Small/Medium/Large)',
    '报告为空，请从左侧插入照片': 'Report is empty — insert photos from the left panel',
    '拖拽排序；每个块可切换布局/尺寸、编辑评论。': 'Drag to reorder; each block can toggle layout/size and edit comments.',
    '可插入照片（': 'Photos Available (',
    '）': ')',
    '所有照片均已插入': 'All photos have been inserted',
    '请至少插入一张照片': 'Please insert at least one photo',
    '现场照片报告 · 自定义排版编辑器': 'On-site Photo Report · Custom Layout Editor',
    '照片库': 'Photo Library',
    '自定义排版': 'Custom Layout',

    // ===== 局域网同步 =====
    '局域网同步': 'LAN Sync',
    // ===== PWA（安装 / 通知 / 后台同步） =====
    '安装应用': 'Install App',
    '应用已安装到设备': 'App installed on this device',
    '安装完成': 'Installation Complete',
    '供应商预审平台已安装，可从主屏幕直接启动。': 'Supplier Pre-Assessment Platform installed. Launch it from your home screen.',
    '已取消安装，可稍后再次从侧栏安装': 'Installation cancelled. You can install later from the sidebar.',
    '请点击 Safari"分享"按钮，选择"添加到主屏幕"': 'Tap the Safari "Share" button, then "Add to Home Screen".',
    '请点击浏览器地址栏右侧的"安装"图标': 'Click the "Install" icon on the right side of the browser address bar.',
    '在线': 'Online',
    '离线': 'Offline',
    '网络连接正常': 'Network connection is normal',
    '当前离线：数据保存在本机，恢复后自动同步': 'Offline: data is stored locally and will sync automatically once restored',
    '网络已恢复，如需同步数据请进入"局域网同步"': 'Network restored. Open "LAN Sync" to sync data.',
    '数据同步完成': 'Data Sync Complete',
    '审核数据已与服务器完成同步。': 'Audit data has been synchronized with the server.',
    '选择性同步完成': 'Selective Sync Complete',
    '选中的供应商与问卷已更新到本机。': 'Selected suppliers and questionnaires have been updated on this device.',
    '开启通知后，同步完成与审核提醒将及时送达': 'Enable notifications to receive sync completion and audit reminders promptly',
    '开启通知': 'Enable Notifications',
    '暂不': 'Not Now',
    '通知已开启': 'Notifications Enabled',
    '审核与同步消息将通过系统通知送达。': 'Audit and sync messages will be delivered via system notifications.',
    '新版本已就绪，刷新页面即可升级': 'New version ready. Refresh the page to upgrade.',
    '与同一 WiFi 局域网内的桌面版 / 其他设备实时同步数据，全程不依赖互联网。': 'Sync data in real time with the desktop app / other devices on the same WiFi LAN — no internet required.',
    '同步状态': 'Sync Status',
    '未连接': 'Not Connected',
    '连接中…': 'Connecting…',
    '已连接': 'Connected',
    '已断开（将自动重连）': 'Disconnected (auto-reconnect)',
    '连接错误': 'Connection Error',
    '服务器 IP（桌面版本机局域网地址）': 'Server IP (the desktop app\'s LAN address)',
    '端口': 'Port',
    '断开后自动重连（应用启动时自动连接）': 'Auto-reconnect after disconnect (and on app start)',
    '连接': 'Connect',
    '立即全量同步': 'Full Sync Now',
    '断开': 'Disconnect',
    '使用方法：在桌面版「设置 → 局域网同步」中启动服务器模式，将显示的本机 IP 填入上方；两台设备连同一 WiFi 即可实时互相同步。': 'How to use: enable server mode in the desktop app\'s LAN sync settings, then enter the displayed local IP above; devices on the same WiFi will sync in real time.',
    '同步日志': 'Sync Log',
    '当前运行在内置后端（JSON 文件）模式，同步由桌面版「局域网同步设置」统一管理，本页面无需操作。': 'Running with the built-in backend (JSON files); sync is managed by the desktop app\'s LAN sync settings — nothing to do on this page.',
    '请输入有效的服务器 IP 地址（如 192.168.1.100）': 'Enter a valid server IP address (e.g. 192.168.1.100)',
    '已连接同步服务器：': 'Connected to sync server: ',
    '已请求全量同步…': 'Full sync requested…',
    '已发送全量同步请求': 'Full sync request sent',
    '尚未连接服务器': 'Not connected to a server',
    '收到全量数据：': 'Full data received: ',
    '收到数据：': 'Data received: ',
    '（增量）': ' (incremental)',
    '（全量）': ' (full)',
    '增量同步': 'Incremental Sync',
    '已请求增量同步…': 'Incremental sync requested…',
    '已发送增量同步请求': 'Incremental sync request sent',
    '同步完成，正在刷新…': 'Sync complete, refreshing…',
    '同步失败：': 'Sync failed: ',
    '全量同步完成，正在刷新…': 'Full sync complete, refreshing…',
    '全量同步失败：': 'Full sync failed: ',
    '已应用远程变更：': 'Applied remote change: ',
    '应用远程变更失败：': 'Failed to apply remote change: ',
    '状态：': 'Status: ',
    '尝试重连…': 'Reconnecting…',
    '已停止同步': 'Sync stopped',
    '自动连接：': 'Auto-connect: ',
    '收到远程数据，界面即将刷新': 'Remote data received — the UI will refresh shortly',
    '收到握手：': 'Handshake received: ',
    // SUP-034：选择性同步
    '已请求选择性同步（选中供应商与问卷）…': 'Selective sync requested (selected suppliers & questionnaires)…',
    '已发送选择性同步请求': 'Selective sync request sent',
    '收到选择性数据：': 'Selective data received: ',
    '选择性同步（从 PC 拉取指定供应商与问卷）': 'Selective Sync (pull selected suppliers & questionnaires from PC)',
    '勾选要从 PC 端同步到本机的供应商与已保存问卷，点击下方按钮开始。仅这些数据会被更新，不影响本机其它数据。': 'Check the suppliers and saved questionnaires to sync from the PC, then tap the button. Only these items are updated; other local data is untouched.',
    '同步选中的供应商与问卷': 'Sync Selected Suppliers & Questionnaires',
    '请先选择供应商或问卷': 'Please select at least one supplier or questionnaire',

    // ===== SUP-025 模板管理中心 =====
    '模板管理中心': 'Template Management Center',
    '预置主流社会责任 / 质量 / 反恐 / ESG 审核模板，可基于预置自定义修改，或从零制作。数据导出模块可直接选用。': 'Built-in Social / Quality / Security / ESG audit templates. Customize them or build from scratch. Selectable in Data Export.',
    '⇧ 导入 JSON': '⇧ Import JSON',
    '搜索模板名称 / 描述…': 'Search template name / description…',
    '社会责任': 'Social',
    '质量': 'Quality',
    '反恐': 'Security',
    'ESG': 'ESG',
    '没有匹配的模板。': 'No matching templates.',
    '社会责任审核': 'Social Responsibility Audit',
    '质量审核': 'Quality Audit',
    '反恐审核': 'Supply Chain Security Audit',
    'ESG 审核': 'ESG Audit',
    '合规/不合规': 'Compliant / Non-compliant',
    '评分制（1-5 分）': 'Rating (1-5)',
    '百分比': 'Percentage',
    '预置': 'Preset',
    '（无描述）': '(no description)',
    '维度 ': 'Dimensions: ',
    ' · 检查项 ': ' · Items: ',
    '更新 ': 'Updated ',
    '预览': 'Preview',
    '已导出模板 JSON': 'Template JSON exported',
    '删除模板': 'Delete Template',
    '确定删除模板「': 'Delete template "',
    '」？此操作不可恢复。': '"? This cannot be undone.',
    '已删除模板': 'Template deleted',
    '模板描述': 'Template Description',
    '尚未添加审核维度。点击下方按钮添加。': 'No audit dimensions yet. Add one below.',
    '权重%': 'Weight %',
    '删除维度': 'Delete Dimension',
    '说明（可选）': 'Description (optional)',
    '+ 检查项': '+ Item',
    '+ 添加审核维度': '+ Add Dimension',
    '审核维度与检查项': 'Audit Dimensions & Items',
    '新检查项': 'New item',
    '新维度': 'New dimension',
    '已导入模板：': 'Imported template: ',
    '检查项': 'Check Item',
    '评分方式': 'Scoring',
    '权重 ': 'Weight: ',
    '暂无审核维度，可编辑模板添加。': 'No audit dimensions yet. Edit the template to add.',
    '未命名模板': 'Untitled Template',
    '模板（自定义版）': ' (custom)',
    '模板 副本': ' copy',
    '导出模板': 'Export Template',
    '审核框架（模板维度与检查项）': 'Audit Framework (template dimensions & items)',
    '由所选审核模板定义，含评分规则': 'Defined by the selected audit template, with scoring rules',

    // ===== SUP-026 模板中心（纯自定义） =====
    '取消全部预置模板，完全由您自定义报告排版。可手工创建、上传 Word/Excel/HTML 转换，自由编辑字体、颜色、边距、纸张与页眉页脚。数据导出模块可直接选用。': 'All preset templates removed — fully custom report layouts. Create manually or convert uploaded Word/Excel/HTML files; freely edit fonts, colors, margins, paper and header/footer. Usable directly in Data Export.',
    '＋ 新建自定义模板': '+ New Custom Template',
    '⇪ 上传模板': '⇪ Upload Template',
    '还没有任何模板': 'No templates yet',
    '已取消全部预置模板。请从新建自定义模板或上传文件开始。': 'All preset templates removed. Start by creating a custom template or uploading a file.',
    ' 个模板': ' templates',
    '点击选择文件，或将文件拖拽到此处': 'Click to choose a file, or drag & drop here',
    '正在解析并转换模板…': 'Parsing and converting template…',
    '模板已转换：': 'Template converted: ',
    '转换失败：': 'Conversion failed: ',
    '上传并转换模板': 'Upload & Convert Template',
    '识别到变量占位符：': 'Variable placeholders detected: ',
    '上传结构预览（': 'Uploaded structure (',
    ' 块）': ' blocks)',
    '暂无历史版本。': 'No version history yet.',
    '回滚到此版本': 'Rollback to this version',
    '已回滚到版本 #': 'Rolled back to version #',
    '回滚失败': 'Rollback failed',
    '报告排版': 'Report Layout',
    '字体': 'Font Family',
    '强调色': 'Accent Color',
    '正文字色': 'Body Text Color',
    '左右边距(mm)': 'Margin X (mm)',
    '上下边距(mm)': 'Margin Y (mm)',
    '纸张尺寸': 'Paper Size',
    '审核维度与检查项（可选）': 'Audit Dimensions & Items (optional)',
    '该模板暂无排版内容与审核维度。': 'This template has no layout content or audit dimensions yet.',
    ' · 版本 ': ' · Versions ',
    '复制模板名称': 'Name for the copied template',
    '手工创建': 'Manual',
    '上传转换': 'Uploaded',
    'JSON 导入': 'JSON Import',

    // ===== SUP-026 数据导出（HTML 编辑器 + 三格式） =====
    '选择评估记录 → HTML 预览自由编辑 → 导出 Word / PDF / HTML；或导出 Excel。': 'Select records → edit freely in HTML preview → export Word / PDF / HTML; or export Excel.',
    '预览 / 编辑 / 导出': 'Preview / Edit / Export',
    '批量导出 PDF': 'Batch Export PDF',
    '报告预览 / 编辑 / 导出（HTML · Word · PDF）': 'Report Preview / Edit / Export (HTML · Word · PDF)',
    '导出模板（可自由选择）': 'Export Template (free choice)',
    '默认版式（淡蓝线条）': 'Default layout (light-blue lines)',
    '右侧为 HTML 预览，可直接点击编辑文字、拖拽区块排序；编辑完成后选择下方格式导出。': 'The right side is an HTML preview: click to edit text, drag blocks to reorder; then export in your chosen format below.',
    '加粗': 'Bold',
    '斜体': 'Italic',
    '下划线': 'Underline',
    '删除线': 'Strikethrough',
    '一级标题': 'Heading 1',
    '二级标题': 'Heading 2',
    '三级标题': 'Heading 3',
    '正文段落': 'Paragraph',
    '增大字号': 'Increase font size',
    '减小字号': 'Decrease font size',
    '左对齐': 'Align left',
    '右对齐': 'Align right',
    '无序列表': 'Bullet list',
    '有序列表': 'Numbered list',
    '插入表格': 'Insert table',
    '插入分割线': 'Insert horizontal rule',
    '撤销': 'Undo',
    '重做': 'Redo',
    '删除当前区块': 'Delete current block',
    '文字颜色': 'Text color',
    '列 1': 'Column 1',
    '列 2': 'Column 2',
    '请将光标放在要删除的顶层区块内': 'Place the cursor inside the top-level block to delete',
    '全屏预览': 'Fullscreen Preview',
    '退出全屏': 'Exit Fullscreen',
    '⇩ 导出 Word': '⇩ Export Word',
    '⇩ 导出 HTML': '⇩ Export HTML',
    'Word 导出失败：': 'Word export failed: ',
    ' 页）': ' pages)',
    'HTML 已导出：': 'HTML exported: ',
    'HTML 导出失败：': 'HTML export failed: ',
    '问题点总数': 'Total Findings',
    '项需关注': 'items to address',
    '风险分布': 'Risk Distribution',
    '按严重程度分类': 'By severity',
    '风险说明': 'Risk Description',
    '报告生成时间': 'Report Generated At',
    '未命名': 'Untitled',
    // ===== 问卷设计器 v5（SUP-QD：三栏所见即所得 + 实时预览 + 自动保存） =====
    '填空': 'Short Text',
    '进行中': 'Active',
    '已暂停': 'Paused',
    '未保存更改': 'Unsaved changes',
    '保存中…': 'Saving…',
    '保存失败': 'Save failed',
    '浏览与管理已设计的评估问卷 · 点击「编辑」进入所见即所得设计器': 'Browse and manage your questionnaires · Click "Edit" to open the WYSIWYG designer',
    '新建问卷': 'New Questionnaire',
    '没有符合条件的问卷': 'No matching questionnaires',
    '暂无问卷，点击「新建问卷」开始设计。': 'No questionnaires yet. Click "New Questionnaire" to start designing.',
    '点击进入编辑': 'Click to edit',
    '（未命名问卷）': '(Untitled questionnaire)',
    '题目偏多': 'Too many questions',
    '问卷状态': 'Questionnaire status',
    '复制问卷': 'Duplicate Questionnaire',
    '三步完成：选择模板 → 拖拽编辑 → 保存发布': 'Three steps: pick a template → drag to design → save & publish',
    '暂无可复制的问卷': 'No questionnaires to duplicate',
    '从空白开始': 'Start from Blank',
    '创建一个空问卷，从零开始设计': 'Create an empty questionnaire and design from scratch',
    '系统默认模板': 'System Default Template',
    '预置 SLCP 核心议题审核问卷（9 章节题库）': 'Preset SLCP core-topic audit questionnaire (9 modules)',
    '复制现有问卷': 'Duplicate an Existing Questionnaire',
    '在已有问卷基础上快速修改': 'Quickly modify based on an existing questionnaire',
    '新建问卷 · 选择模板': 'New Questionnaire · Choose a Template',
    '创建问卷': 'Create Questionnaire',
    '系统默认模板（副本）': 'System Default Template (Copy)',
    '未命名问卷': 'Untitled questionnaire',
    '已创建，开始拖拽设计吧': 'Created. Start designing by dragging!',
    '确认删除「': 'Confirm deleting "',
    '已有 {1} 份评估记录关联，评估记录不会删除，但将无法继续基于该问卷填写。': '{1} linked assessment(s). Those records are kept but can no longer be filled with this questionnaire.',
    '此操作不可撤销。': 'This action cannot be undone.',
    '返回列表': 'Back to List',
    '问卷标题（点击输入）': 'Questionnaire title (click to type)',
    '显示/隐藏预览': 'Show/hide preview',
    '已保存草稿': 'Draft saved',
    '发布问卷': 'Publish Questionnaire',
    '暂停收集': 'Pause Collection',
    '重新开启': 'Reopen',
    '问卷已结束，不可再开启。如需继续收集请新建副本。': 'This questionnaire is closed. Duplicate it to collect again.',
    '问卷已发布 · 状态：进行中': 'Published · Status: Active',
    '问卷已暂停收集': 'Collection paused',
    '题型组件': 'Question Types',
    '拖拽到编辑区添加，或点击追加到当前章节': 'Drag into the canvas to add, or click to append to the current module',
    '题目数量': 'Question count',
    '尚未添加题目，从上方拖入第一题': 'No questions yet. Drag the first one from above.',
    '当前 {1} 题 · 可继续添加，无数量上限': '{1} questions · keep adding, no upper limit',
    '编辑区': 'Canvas',
    '点击题目行展开编辑 · 拖动调整顺序': 'Click a question to expand · Drag to reorder',
    '拖动调整章节顺序': 'Drag to reorder modules',
    '章节名称（点击直接修改）': 'Module name (click to edit)',
    '章节上移': 'Move module up',
    '章节下移': 'Move module down',
    '拖入题型组件，或点击下方按钮添加': 'Drag a question type here, or click the button below',
    '拖动调整题目顺序': 'Drag to reorder questions',
    '（未命名题目）': '(Untitled question)',
    '复制题目': 'Duplicate question',
    '请输入题面，例如：是否核验工人年龄？': 'Type the question text, e.g. "Are worker ages verified?"',
    '题面': 'Question',
    '问题等级': 'Severity',
    '自动': 'Auto',
    '题目编号': 'Question No.',
    '例如：依据《XX标准》第X条；定义：……；示例：……': 'e.g. Ref: Standard X, Clause Y; Definition: …; Example: …',
    '参考依据 / 填写说明（可选）': 'Reference / Guidance (optional)',
    '添加选项': 'Add Option',
    '整卷': 'Full Form',
    '单题': 'One by One',
    '平板': 'Tablet',
    '暂无问卷': 'No questionnaire',
    '预览 · 测试填写，数据不会被保存': 'Preview · Test filling, data will NOT be saved',
    '暂无题目': 'No questions yet',
    '第 {1} / {2} 题': 'Question {1} / {2}',
    '（未命名章节）': '(Untitled module)',
    '暂无题目，从左侧拖入题型组件': 'No questions yet. Drag question types from the left.',
    '测试填写': 'Test input',
    '切换单题模式可模拟逐题填写体验': 'Switch to one-by-one mode to simulate the step-by-step experience',
    '上一题': 'Previous',
    '下一题': 'Next',
    '返回编辑': 'Back to Editing',
    '已删除题目：': 'Question deleted: ',
    '已删除章节': 'Module deleted',
    '（含 {1} 题）': ' ({1} questions)',
    '该章节含 {1} 道题目，删除后可撤销。确认删除？': 'This module contains {1} questions. You can undo after deletion. Delete anyway?',
    '问卷说明（展示在问卷开头）': 'Description (shown at the beginning)',
    '（不可再提交）': ' (no more submissions)',
    '高级工具（导出 / 导入）': 'Advanced tools (export / import)',
    'Excel 组件加载失败：': 'Failed to load Excel module: ',
    '问题': 'Question',
    '选项（用“|”分隔）': 'Options (separated by "|")',
    '评分上限（分）': 'Rating max (points)',
    '数值最小': 'Number min',
    '数值最大': 'Number max',
    '必填（是/否）': 'Required (yes/no)',
    '填写提示': 'Guidance',
    '回答（外部机构填写，导入时忽略）': 'Answer (filled by external org, ignored on import)',
    'PDF 组件加载失败：': 'Failed to load PDF module: ',
    '创建 ': 'Created ',
    // ===== 碳排放计算器（ESG 环境维度内置模块） =====
    '碳排放计算器': 'Carbon Calculator',
    '在环境维度填写活动数据，系统实时计算并按 GHG Protocol 范围1/2/3 汇总，结果自动回填上方排放字段。': 'Enter activity data under the Environment dimension; the system computes in real time and aggregates by GHG Protocol Scope 1/2/3, automatically backfilling the emission fields above.',
    '内置模块': 'Built-in module',
    '中国电网因子': 'China grid factor',
    '欧盟因子': 'EU factor',
    '英国因子 (DEFRA)': 'UK factor (DEFRA)',
    '美国因子 (eGRID)': 'US factor (eGRID)',
    '排放因子区域': 'Emission factor region',
    '范围1 · 直接排放': 'Scope 1 · Direct',
    '范围2 · 能源间接排放': 'Scope 2 · Energy indirect',
    '范围3 · 价值链排放': 'Scope 3 · Value chain',
    '总排放量（': 'Total emissions (',
    '快速估算（行业基准）': 'Quick estimate (industry benchmark)',
    '行业基准（按已选行业）': 'Industry benchmark (by selected industry)',
    '员工人数': 'Number of employees',
    '估算': 'Estimate',
    '估算基于行业平均排放强度，用于快速起步或数据缺失场景；正式披露请以实际活动数据为准。': 'Estimate is based on industry-average emission intensity for quick start or missing-data scenarios; use actual activity data for formal disclosure.',
    '已按': 'Estimated with ',
    '基准估算：范围1 ': ' benchmark: Scope 1 ',
    '估算值，建议按实际数据细化': 'estimate, refine with actual data',
    '在上方填写电力、燃料或交通等活动数据，将实时计算碳排放并展示结构。': 'Enter electricity, fuel or transport activity data above to compute carbon emissions and view the structure in real time.',
    '总排放量': 'Total emissions',
    '暂无数据': 'No data',
    '暂无排放数据': 'No emission data',
    '范围1': 'Scope 1',
    '范围2': 'Scope 2',
    '范围3': 'Scope 3',
    '直接排放': 'Direct emissions',
    '间接排放': 'Indirect emissions',
    '价值链排放': 'Value-chain emissions',
    '排放量': 'Emissions',
    '占比': 'Share',
    '合计': 'Total',
    '减排建议': 'Reduction tips',
    '已将范围1+2排放量自动回填至上方排放字段（': 'Scope 1+2 emissions auto-filled into the fields above (',
    '）。如已手工填写将不再覆盖。': '). Manually entered values will not be overwritten.',
    '范围1占比高（': 'Scope 1 is high (',
    '）：优先提升燃料利用效率、自有车队电动化，或评估锅炉/窑炉电气化改造。': '): prioritize fuel-efficiency, fleet electrification, or evaluate boiler/kiln electrification.',
    '范围2占比 ': 'Scope 2 is ',
    '）：优先购买绿电/绿证、提高可再生能源用电占比、部署分布式光伏。': '): prioritize green power/certificates, raise renewable share, deploy distributed PV.',
    '范围3占比 ': 'Scope 3 is ',
    '）：推进供应商低碳采购、优化物流线路、鼓励员工低碳通勤与视频会议替代差旅。': '): advance low-carbon procurement, optimize logistics routes, encourage low-carbon commuting and video-conferencing over travel.',
    '当前排放结构均衡：建议按「范围2 → 范围1 → 范围3」顺序逐步减排，并设定科学碳目标（SBTi）。': 'Current structure is balanced: reduce progressively in Scope 2 → 1 → 3 order and set a science-based target (SBTi).',
    '排放量 tCO₂e': 'Emissions (tCO₂e)',
    '碳排放总览': 'Carbon overview',
    '碳排放总览（GHG Protocol 三范围）': 'Carbon overview (GHG Protocol 3 scopes)',
    '排放因子：': 'Emission factor: ',
    '该数据为行业基准估算值（': 'Estimate based on industry benchmark (',
    ' 人），建议以实际活动数据细化。': ' employees); refine with actual activity data.',
    '员工': 'employees ',
    '碳排放计算（GHG Protocol 三范围）': 'Carbon calculation (GHG Protocol 3 scopes)',
    '碳排放': 'Carbon',
    '明细': 'Details',
    '活动量': 'Activity',
    '电力（购电）': 'Electricity (purchased)',
    '热力 / 蒸汽': 'Heat / steam',
    '天然气': 'Natural gas',
    '汽油': 'Gasoline',
    '柴油': 'Diesel',
    '原煤': 'Coal',
    '自有车辆（汽油）': 'Company vehicles (gasoline)',
    '员工通勤': 'Employee commuting',
    '商务差旅（航空）': 'Business travel (air)',
    '物流运输（公路）': 'Logistics (road)',
    '差旅地面交通（公交）': 'Ground travel (bus)',
    '请先在创建页选择行业以进行基准估算': 'Select an industry on the create page to run a benchmark estimate',
    '中国电网': 'China grid',
    '欧盟': 'EU',
    '英国 DEFRA': 'UK DEFRA',
    '美国 eGRID': 'US eGRID',
    '操作遇到异常，请稍后重试': 'An error occurred. Please try again later.',
  };

  /* 占位符替换：模板 {N} 存在两种既有约定——
   *   1 起始（{1}=第 1 个参数，问卷设计器等新代码）与 0 起始（{0}=第 1 个参数，供应商登记等旧代码）。
   * 判定规则：模板内最大序号 === 实参个数 → 1 起始（{1}..{N} 恰好覆盖全部参数）；
   *           否则 → 0 起始（{0}..{N-1} 覆盖）。未命中的占位符保持原样（绝不空白）。
   * 例：T('第 {1} / {2} 题', 1, 34) → '第 1 / 34 题'；T('已归档 {0} 份 · {1} MB', 3, '1.2') → '已归档 3 份 · 1.2 MB'。
   */
  function fmtPlaceholders(tpl, args) {
    if (!args.length || typeof tpl !== 'string') return tpl;
    let maxN = -1;
    tpl.replace(/\{(\d+)\}/g, function (m, n) { const i = +n; if (i > maxN) maxN = i; return m; });
    if (maxN < 0) return tpl;
    const oneBased = (maxN === args.length);
    return tpl.replace(/\{(\d+)\}/g, function (m, n) {
      const i = +n;
      const v = oneBased ? args[i - 1] : args[i];
      return v !== undefined ? v : m;
    });
  }

  I18N.t = function (s) {
    if (typeof s !== 'string') return s;
    const en = I18N.lang === 'en' ? EN[s] : undefined;
    // 字典中显式定义的值（含空串，表示"英文省略"，如量词「个/套/份」、副标题）优先；
    // 仅当键完全未定义时才回退中文原文。
    let out = (en !== undefined) ? en : s;
    const args = Array.prototype.slice.call(arguments, 1);
    return fmtPlaceholders(out, args);
  };

  I18N.setLang = function (lang, doPersist) {
    I18N.lang = (lang === 'en') ? 'en' : 'zh';
    if (doPersist !== false) {
      try {
        if (global.localStorage) global.localStorage.setItem('iar_lang', I18N.lang);
      } catch (e) {}
      try {
        const s = global.DB && global.DB.get && global.DB.get();
        if (s) { s.settings = s.settings || {}; s.settings.lang = I18N.lang; if (global.DB.persist) global.DB.persist(); }
      } catch (e) {}
    }
    I18N._onChange.forEach(function (cb) { try { cb(I18N.lang); } catch (e) {} });
    try { if (global.document && global.document.documentElement) global.document.documentElement.lang = (I18N.lang === 'zh') ? 'zh-CN' : 'en-US'; } catch (e) {}
  };

  I18N.onChange = function (cb) { if (typeof cb === 'function') I18N._onChange.push(cb); };

  I18N.init = function () {
    // 默认英文（en-US）。仅当用户已显式选择时才沿用其偏好（持久化于 localStorage.iar_lang）。
    let l = 'en';
    try {
      if (global.localStorage) {
        const stored = global.localStorage.getItem('iar_lang');
        if (stored === 'en' || stored === 'en-US') l = 'en';
        else if (stored === 'zh' || stored === 'zh-CN') l = 'zh';
      }
    } catch (e) {}
    if (l !== 'en' && l !== 'zh') {
      try {
        const nav = global.navigator && global.navigator.language;
        if (nav && nav.toLowerCase().indexOf('en') === 0) l = 'en';
      } catch (e) {}
    }
    I18N.lang = (l === 'en') ? 'en' : 'zh';
    try { if (global.document && global.document.documentElement) global.document.documentElement.lang = (I18N.lang === 'zh') ? 'zh-CN' : 'en-US'; } catch (e) {}
  };

  // 将 [data-i18n] 元素的文本翻译为当前语言（用于导航、顶栏等静态结构）
  I18N.applyStatic = function (root) {
    const r = root || global.document;
    if (!r || !r.querySelectorAll) return;
    r.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = I18N.t(key);
    });
  };

  // ---------------- 模块级国际化（登录页等专用；en-US / zh-CN；默认英文；缺失键回退英文） ----------------
  // 与既有 T()（中文 key → 英文字典）并存：登录页使用本模块做组件级国际化，其余页面沿用 T()。
  global.LOCALES = global.LOCALES || {};
  const I18n = {
    fallback: 'en-US',
    available: ['en-US', 'zh-CN'],
    // 当前显示用 locale（与 I18N.lang 同步：en → en-US，zh → zh-CN）
    getLocale: function () { return (I18N.lang === 'zh') ? 'zh-CN' : 'en-US'; },
    // 切换语言：归一化后驱动全局 I18N.setLang（持久化 + 通知所有订阅者，含登录页重渲染）
    setLocale: function (code) { I18N.setLang((code === 'zh-CN' || code === 'zh') ? 'zh' : 'en'); },
    // 翻译：当前语言缺失则回退默认语言，仍缺失则原样返回 key（绝不空白或抛错）
    t: function (key) {
      if (typeof key !== 'string') return key;
      const cur = global.LOCALES && global.LOCALES[I18n.getLocale()];
      const fb = global.LOCALES && global.LOCALES[I18n.fallback];
      let v = (cur && cur[key] != null) ? cur[key] : ((fb && fb[key] != null) ? fb[key] : key);
      const args = Array.prototype.slice.call(arguments, 1);
      return fmtPlaceholders(v, args);
    },
    // 浏览器语言检测：映射到最近似的预设包；无法匹配时回退默认英文（不覆盖显式默认）
    detect: function () {
      try {
        const nav = global.navigator && global.navigator.language;
        if (nav) {
          const lower = String(nav).toLowerCase();
          if (lower.indexOf('zh') === 0) return 'zh-CN';
          if (lower.indexOf('en') === 0) return 'en-US';
        }
      } catch (e) {}
      return I18n.fallback;
    },
    // 与全局语言初始化保持一致；设置 <html lang> 以声明文档语言
    init: function () {
      try { if (global.document && global.document.documentElement) global.document.documentElement.lang = I18n.getLocale(); } catch (e) {}
    },
    // 复用全局订阅通道，避免重复通知
    onChange: function (cb) { I18N.onChange(cb); },
    onPacksLoaded: function () {}
  };

  global.I18n = I18n;
  global.I18N = I18N;
  global.T = function () { return I18N.t.apply(I18N, arguments); };

  // 脚本加载后立即初始化语言（供首屏静态文案使用）
  try { I18N.init(); } catch (e) {}
  try { I18n.init(); } catch (e) {}
})(window);

/* ===== src/js/locales/en-US.js ===== */
/* 语言包：英文（美国）—— 默认语言 / 回退语言
 * 命名空间：window.LOCALES['en-US']，键按模块分组（common.* / login.* / login.err.*）。
 * 新增语言只需新增同名文件（如 ja-JP.js）并注册到 LOCALES，无需修改任何业务代码。
 */
(function (g) {
  g.LOCALES = g.LOCALES || {};
  g.LOCALES['en-US'] = {
    // ===== 通用（跨模块可复用） =====
    'common.ok': 'OK',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.confirm': 'Confirm',
    'common.submit': 'Submit',
    'common.langEn': 'English',
    'common.langZh': '中文',
    'common.username': 'Username',
    'common.password': 'Password',
    'common.displayName': 'Display name',
    'common.confirmPassword': 'Confirm password',

    // ===== 登录页 =====
    'login.username_lbl': 'Username',
    'login.password_lbl': 'Password',
    'login.displayName_lbl': 'Display name',
    'login.confirmPassword_lbl': 'Confirm password',
    'login.username_ph': 'Login username (letters/digits, ≥3 chars)',
    'login.displayName_ph': 'Display name (optional)',
    'login.password_ph': 'Password (at least 6 characters)',
    'login.passwordConfirm_ph': 'Confirm password',
    'login.usernameHint': 'Used to sign in; cannot be changed after creation',
    'login.displayNameHint': 'Blank uses the username',
    'login.signIn': 'Sign In',
    'login.loginTab': 'Sign In',
    'login.registerTab': 'Register new account',
    'login.createAdmin': 'Create admin account',
    'login.registerAndLogin': 'Register & sign in',
    'login.headLogin': 'Sign in to workspace',
    'login.headSetup': 'First-time setup · Create admin account',
    'login.noteSetup': 'The first account on this device becomes the system administrator with full control over users and data. The account and password are stored only in this browser.',
    'login.noteLogin': 'First time? Switch to "Register new account" to create an admin. Account data is stored only in this browser (IndexedDB) and is never uploaded to any server.',
    'login.brandTitle': 'Supplier Pre-Assessment',
    'login.brandSub': 'Supplier Pre-Assessment Platform',
    'login.showPwd': 'Show password',
    'login.hidePwd': 'Hide password',
    'login.pwdToggleHint': 'Show/hide password (Alt+V)',
    'login.pwdMismatch': 'The two passwords do not match',
    'login.loginFailed': 'Sign in failed',
    'login.registerFailed': 'Registration failed',

    // ===== 登录 / 注册流程错误提示 =====
    'login.err.usernameRequired': 'Username cannot be empty',
    'login.err.passwordTooShort': 'Password must be at least 6 characters',
    'login.err.usernameTaken': 'This username is already taken',
    'login.err.badCredentials': 'Incorrect username or password',
    'login.err.accountDisabled': 'This account has been disabled. Contact your administrator.'
  };
  if (g.I18n && g.I18n.onPacksLoaded) g.I18n.onPacksLoaded();
})(window);

/* ===== src/js/locales/zh-CN.js ===== */
/* 语言包：中文（简体）
 * 命名空间：window.LOCALES['zh-CN']，键与 en-US.js 一一对应（按模块分组）。
 * 缺失键会自动回退至 en-US（默认语言），页面永不出现空白或报错。
 */
(function (g) {
  g.LOCALES = g.LOCALES || {};
  g.LOCALES['zh-CN'] = {
    // ===== 通用 =====
    'common.ok': '确定',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.confirm': '确认',
    'common.submit': '提交',
    'common.langEn': 'English',
    'common.langZh': '中文',
    'common.username': '用户名',
    'common.password': '密码',
    'common.displayName': '显示名称',
    'common.confirmPassword': '确认密码',

    // ===== 登录页 =====
    'login.username_lbl': '用户名',
    'login.password_lbl': '密码',
    'login.displayName_lbl': '显示名称',
    'login.confirmPassword_lbl': '确认密码',
    'login.username_ph': '登录用户名（字母/数字，≥3 位）',
    'login.displayName_ph': '显示名称（可选）',
    'login.password_ph': '密码（至少 6 位）',
    'login.passwordConfirm_ph': '再次确认密码',
    'login.usernameHint': '用于登录，创建后不可修改',
    'login.displayNameHint': '留空则使用用户名',
    'login.signIn': '登录',
    'login.loginTab': '登录',
    'login.registerTab': '注册新账户',
    'login.createAdmin': '创建管理员账户',
    'login.registerAndLogin': '注册并登录',
    'login.headLogin': '登录到工作台',
    'login.headSetup': '首次使用 · 创建管理员账户',
    'login.noteSetup': '本机首个账户将作为系统管理员，可管理其他用户与系统数据。账户与密码仅保存在本机浏览器。',
    'login.noteLogin': '首次使用请切换到「注册新账户」创建管理员。账户数据仅存储于本机浏览器（IndexedDB），不上传服务器。',
    'login.brandTitle': '供应商预审平台',
    'login.brandSub': 'Supplier Pre-Assessment Platform',
    'login.showPwd': '显示密码',
    'login.hidePwd': '隐藏密码',
    'login.pwdToggleHint': '显示/隐藏密码（Alt+V）',
    'login.pwdMismatch': '两次输入的密码不一致',
    'login.loginFailed': '登录失败',
    'login.registerFailed': '注册失败',

    // ===== 登录 / 注册流程错误提示 =====
    'login.err.usernameRequired': '用户名不能为空',
    'login.err.passwordTooShort': '密码长度至少 6 位',
    'login.err.usernameTaken': '该用户名已被使用',
    'login.err.badCredentials': '用户名或密码错误',
    'login.err.accountDisabled': '该账户已被停用，请联系管理员'
  };
  if (g.I18n && g.I18n.onPacksLoaded) g.I18n.onPacksLoaded();
})(window);

/* ===== src/js/standards-seed.js ===== */
/* 标准 / 法规 种子数据
 * 来自公开资料整理，版本信息截至 2026 年可确认的最新有效版本。
 * 仅作内部合规参考，具体执行以官方发布文本为准。
 * 结构：{ code, name, category, org, version, effective, summary, officialUrl,
 *         tags:[], clauses:[{no,title,content,tags:[]}] }
 *  - tags：标准级标签（便于按主题筛选）
 *  - clause.tags：子条款级标签（更细的议题归类）
 */
(function (global) {
  const StandardsSeed = {};
  StandardsSeed.data = [
    // ---------------- 国际社会责任标准 ----------------
    {
      code: 'SA8000',
      name: 'SA8000 社会责任国际标准',
      category: '国际社会责任标准',
      org: 'Social Accountability International (SAI)',
      version: 'SA8000:2014',
      effective: '2014 版现行有效',
      summary: '全球应用最广的社会责任第三方认证标准，覆盖劳工权益核心议题，要求建立管理体系并持续改进。',
      officialUrl: 'https://sa-intl.org/',
      tags: ['社会责任', '认证标准', '劳工权益'],
      clauses: [
        { no: '童工', title: 'Child Labor', content: '不得雇用未满 15 岁（或当地义务教育年龄/最低就业年龄中较高者）的童工；须建立补救童工程序。', tags: ['童工', '未成年人'] },
        { no: '强迫或强制劳动', title: 'Forced or Compulsory Labor', content: '不得使用或支持强迫/抵债/契约劳动，不得扣留身份证件或收取押金，工人可自由离职。', tags: ['强迫劳动', '押金', '身份证件'] },
        { no: '健康与安全', title: 'Health and Safety', content: '提供安全健康的工作环境，防范事故与职业危害，保障宿舍、食堂、卫生设施达标。', tags: ['职业健康安全', '宿舍'] },
        { no: '结社自由与集体谈判权', title: 'Freedom of Association', content: '尊重工人依法组建与参加工会、进行集体谈判的权利。', tags: ['结社自由', '集体谈判'] },
        { no: '歧视', title: 'Discrimination', content: '在雇佣、薪酬、晋升等各环节不得基于种族、性别、宗教等实施歧视。', tags: ['歧视', '平等'] },
        { no: '惩戒性措施', title: 'Disciplinary Practices', content: '不得从事或支持体罚、精神或肉体胁迫、言语侮辱等惩戒行为。', tags: ['体罚', '骚扰虐待'] },
        { no: '工作时间', title: 'Working Hours', content: '周工时不超过 48 小时，加班自愿且每周不超过 12 小时，每 7 天至少休息 1 天。', tags: ['工时', '加班', '休息'] },
        { no: '薪酬', title: 'Remuneration', content: '工资不低于法定最低标准，满足基本需求并略有结余；不得违规扣薪。', tags: ['工资', '最低工资'] },
        { no: '管理体系', title: 'Management System', content: '建立政策、明确职责、开展培训与内审、保持记录并持续改进。', tags: ['管理体系'] }
      ]
    },
    {
      code: 'RBA',
      name: 'RBA 行为准则（责任商业联盟）',
      category: '国际社会责任标准',
      org: 'Responsible Business Alliance',
      version: 'CoC v8.0',
      effective: 'v8.0 于 2024-01-01 生效',
      summary: '电子及其他行业广泛采用的行为准则，涵盖劳工、健康安全、环境、道德与管理体系五大模块，并强调供应链责任。',
      officialUrl: 'https://www.responsiblebusiness.org/',
      tags: ['行为准则', '供应链', '电子行业'],
      clauses: [
        { no: 'A. 劳工', title: 'Labor', content: '自由择业、青年工管理、工时符合法定上限、工资福利合规、人道待遇、不歧视、自由结社。', tags: ['强迫劳动', '青年工', '工时', '工资', '人道待遇', '歧视', '结社自由'] },
        { no: 'B. 健康与安全', title: 'Health & Safety', content: '职业安全、应急准备、工伤预防、工业卫生、繁重的体力劳动、机器防护、宿舍食堂卫生。', tags: ['职业健康安全', '应急', '工伤', 'PPE'] },
        { no: 'C. 环境', title: 'Environment', content: '环境许可与报告、污染防控、有害物质管理、废水废气固废处置、资源效率与温室气体减排。', tags: ['环境', '污染', '危化品'] },
        { no: 'D. 道德', title: 'Ethics', content: '廉洁经营、无不正当优势、信息公开、知识产权保护、公平交易与广告、隐私保护。', tags: ['反腐败', '道德', '隐私'] },
        { no: 'E. 管理体系', title: 'Management System', content: '公司承诺、管理责任、风险评估与风险管理、绩效目标、培训、沟通、员工反馈与申诉、审核与持续改进。', tags: ['管理体系', '申诉', '内审'] },
        { no: 'F. 供应链责任', title: 'Supply Chain', content: '负责任的采购与供应商管理，将准则要求延伸至分包方与下级供应商。', tags: ['供应链', '供应商'] }
      ]
    },
    {
      code: 'WRAP',
      name: 'WRAP 环球服装生产社会责任准则',
      category: '国际社会责任标准',
      org: 'Worldwide Responsible Accredited Production',
      version: '12 项原则',
      effective: '12 项原则现行有效',
      summary: '以《联合国企业与人权指导原则》为基础，包含 12 项生产守则，是服装纺织业常见的合规认证。',
      officialUrl: 'https://www.wrapapparel.org/',
      tags: ['服装纺织', '生产守则', '认证'],
      clauses: [
        { no: '1. 法律合规', title: 'Compliance with Laws', content: '遵守经营所在地所有适用法律法规。', tags: ['法律合规'] },
        { no: '2. 禁止强迫劳动', title: 'Prohibition of Forced Labor', content: '不使用任何形式的强迫、抵债或契约劳动。', tags: ['强迫劳动'] },
        { no: '3. 禁止童工', title: 'Prohibition of Child Labor', content: '不使用未满法定年龄的童工。', tags: ['童工'] },
        { no: '4. 禁止骚扰虐待', title: 'Prohibition of Harassment', content: '不得实施身体、性、心理或言语骚扰与虐待。', tags: ['骚扰虐待', '体罚'] },
        { no: '5. 薪酬福利', title: 'Compensation & Benefits', content: '按法律支付工资福利，不得违规扣减。', tags: ['工资'] },
        { no: '6. 工时', title: 'Hours of Work', content: '工时符合法律与准则上限，加班自愿并获补偿。', tags: ['工时', '加班'] },
        { no: '7. 反歧视', title: 'Prohibition of Discrimination', content: '就业各环节不基于个人特征实施歧视。', tags: ['歧视'] },
        { no: '8. 健康安全', title: 'Health & Safety', content: '提供安全健康的工作与生活环境。', tags: ['职业健康安全'] },
        { no: '9. 自由结社', title: 'Freedom of Association', content: '尊重工人合法结社与集体谈判权。', tags: ['结社自由', '集体谈判'] },
        { no: '10. 环境', title: 'Environment', content: '遵守环境法规，减少经营对环境的影响。', tags: ['环境'] },
        { no: '11. 海关合规', title: 'Customs Compliance', content: '遵守海关法规，禁止转运以规避原产地规则。', tags: ['海关'] },
        { no: '12. 反恐安保', title: 'Security', content: '维护场所、人员与货物安全，符合反恐怖安保要求。', tags: ['反恐', '安保'] }
      ]
    },
    {
      code: 'ISO26000',
      name: 'ISO 26000 社会责任指南',
      category: '国际社会责任标准',
      org: 'International Organization for Standardization',
      version: 'ISO 26000:2010',
      effective: '2010 发布，现行有效（指引性，不可认证）',
      summary: '为组织履行社会责任提供通用指引，属指导性标准而非管理体系认证标准，强调原则与核心主题。',
      officialUrl: 'https://www.iso.org/iso-26000-social-responsibility.html',
      tags: ['社会责任', '指引性', '核心主题'],
      clauses: [
        { no: '七项核心原则', title: 'Principles', content: '担责、透明、合乎道德、尊重利益相关方、尊重法治、尊重国际行为规范、尊重人权。', tags: ['核心原则', '透明'] },
        { no: '组织治理', title: 'Organizational Governance', content: '决策与执行机制应支持社会责任履行。', tags: ['治理'] },
        { no: '人权', title: 'Human Rights', content: '尽职调查、避免同谋、尊重公民政治权、经济文化社会权、弱势群体、不歧视、利益相关方参与。', tags: ['人权', '尽职调查', '弱势群体', '歧视'] },
        { no: '劳工实践', title: 'Labor Practices', content: '就业与雇佣关系、劳动条件、社会对话、职业健康安全、人力发展。', tags: ['雇佣', '职业健康安全', '社会对话'] },
        { no: '环境', title: 'Environment', content: '污染防治、资源可持续使用、减缓气候变化、环境保护与自然恢复。', tags: ['环境', '气候'] },
        { no: '公平运营实践', title: 'Fair Operating Practices', content: '反腐败、负责任政治参与、公平竞争、在价值链中促进社会责任、尊重产权。', tags: ['反腐败', '公平竞争'] },
        { no: '消费者问题', title: 'Consumer Issues', content: '公平营销与合同、健康安全、可持续消费、争议解决、数据隐私、教育意识。', tags: ['消费者', '隐私', '数据'] },
        { no: '社区参与和发展', title: 'Community Involvement', content: '社区参与、教育、就业创造、技术发展与财富再分配、健康、文化、公益。', tags: ['社区'] }
      ]
    },
    {
      code: 'FLA',
      name: 'FLA 公平劳动准则',
      category: '国际社会责任标准',
      org: 'Fair Labor Association',
      version: 'Fair Labor Code (D2021)',
      effective: 'D2021 版现行有效',
      summary: '由企业、大学与非政府组织共建，含《工作场所行为准则》与《合规基准》，强调透明与可追溯。',
      officialUrl: 'https://www.fairlabor.org/',
      tags: ['公平劳动', '透明', '可追溯'],
      clauses: [
        { no: '强迫劳动', title: 'Forced Labor', content: '禁止一切形式的强迫或强制劳动。', tags: ['强迫劳动'] },
        { no: '童工', title: 'Child Labor', content: '禁止雇用未满法定最低就业年龄的工人。', tags: ['童工'] },
        { no: '骚扰与虐待', title: 'Harassment & Abuse', content: '禁止身体、性、心理或言语骚扰与虐待。', tags: ['骚扰虐待'] },
        { no: '非歧视', title: 'Nondiscrimination', content: '不得基于种族、性别、宗教等实施歧视。', tags: ['歧视'] },
        { no: '结社自由与集体谈判', title: 'Freedom of Association', content: '尊重工人自由结社与集体谈判权。', tags: ['结社自由', '集体谈判'] },
        { no: '健康与安全', title: 'Health & Safety', content: '提供安全健康的工作环境并持续改进。', tags: ['职业健康安全'] },
        { no: '工时', title: 'Hours of Work', content: '遵守法定工时，加班自愿并获补偿，保障休息。', tags: ['工时', '加班'] },
        { no: '薪酬', title: 'Compensation', content: '工资福利不低于法定标准，满足基本需求。', tags: ['工资'] },
        { no: '透明', title: 'Transparency', content: '持续公开供应链信息与合规数据。', tags: ['透明', '供应链'] }
      ]
    },
    {
      code: 'BSCI',
      name: 'amfori BSCI 商业社会责任倡议',
      category: '国际社会责任标准',
      org: 'amfori（原 FTA）',
      version: '13 个绩效领域 (PA1–PA13)',
      effective: '修订宽限期已于 2024-10-01 结束',
      summary: '欧洲零售与贸易广泛采用的供应链审核体系，以 13 个绩效领域评估供应商社会绩效。',
      officialUrl: 'https://www.amfori.org/',
      tags: ['供应链审核', '绩效领域', '欧洲零售'],
      clauses: [
        { no: 'PA1 供应链管理', title: 'Supply Chain', content: '建立并落实供应链责任管理与追溯机制。', tags: ['供应链'] },
        { no: 'PA2 工人参与和保护', title: 'Worker Involvement', content: '建立有效的工人沟通与申诉渠道。', tags: ['申诉', '工人参与'] },
        { no: 'PA3 结社自由与集体谈判', title: 'Freedom of Association', content: '尊重工人依法结社与谈判权。', tags: ['结社自由', '集体谈判'] },
        { no: 'PA4 不歧视', title: 'No Discrimination', content: '就业各环节不因个人特征受歧视。', tags: ['歧视'] },
        { no: 'PA5 公平报酬', title: 'Fair Remuneration', content: '支付法定最低工资并保障合理收入。', tags: ['工资'] },
        { no: 'PA6 体面劳动时间', title: 'Decent Working Hours', content: '工时、加班符合法律与合理上限。', tags: ['工时', '加班'] },
        { no: 'PA7 职业健康安全', title: 'Occupational Health', content: '提供安全健康的工作环境与防护。', tags: ['职业健康安全'] },
        { no: 'PA8 不雇用童工', title: 'No Child Labor', content: '禁止童工并建立补救机制。', tags: ['童工'] },
        { no: 'PA9 不强迫劳动', title: 'No Forced Labor', content: '禁止一切强迫或强制劳动。', tags: ['强迫劳动'] },
        { no: 'PA10 环境保护', title: 'Environment', content: '遵守环境法规并持续改进环境绩效。', tags: ['环境'] },
        { no: 'PA11 道德商业行为', title: 'Ethical Business', content: '廉洁经营、反对腐败与不正当竞争。', tags: ['反腐败', '道德'] },
        { no: 'PA12 投诉与申诉', title: 'Complaints & Grievance', content: '建立公正、可及的申诉与补救机制。', tags: ['申诉', '补救'] },
        { no: 'PA13 供应链追溯', title: 'Traceability', content: '对生产场所与分包活动具备可追溯能力。', tags: ['供应链', '追溯'] }
      ]
    },
    {
      code: 'SMETA',
      name: 'Sedex SMETA 道德贸易审核',
      category: '国际社会责任标准',
      org: 'Sedex（Supplier Ethical Data Exchange）',
      version: 'SMETA 7.0',
      effective: '2024-09 发布，2025-12-31 起强制使用',
      summary: '全球使用最广的道德审核方法论，基于 ETI 基本准则，采用四大支柱加 MSA（分包/家庭工作）模块。',
      officialUrl: 'https://www.sedex.com/',
      tags: ['道德贸易', '审核方法论', 'ETI'],
      clauses: [
        { no: '支柱一 劳工标准', title: 'Labor Standards', content: '基于 ETI 基本准则：自由择业、结社自由、健康安全、童工、生活工资、工时、歧视、正规雇佣。', tags: ['强迫劳动', '结社自由', '童工', '生活工资', '工时', '歧视', '正规雇佣'] },
        { no: '支柱二 健康与安全', title: 'Health & Safety', content: '工作环境与职业健康的系统管理与持续改进。', tags: ['职业健康安全'] },
        { no: '支柱三 环境', title: 'Environment', content: '环境许可、污染防控、资源与能源管理。', tags: ['环境'] },
        { no: '支柱四 商业道德', title: 'Business Ethics', content: '反腐败、透明度与诚信经营。', tags: ['反腐败', '透明'] },
        { no: '附加模块 MSA', title: 'Subcontracting & Homeworking', content: '对分包商与家庭工人的管理与审核要求。', tags: ['分包', '家庭工人'] }
      ]
    },
    {
      code: 'IAR',
      name: '内部预审参考框架（Internal Assessment Reference）',
      category: '国际社会责任标准',
      org: 'Internal Assessment Reference',
      version: '通用框架',
      effective: '适用于内部合规预审',
      summary: '通用的社会与劳工合规预审参考框架：以统一结构采集社会与劳工数据，供内部审核与对标使用。',
      officialUrl: '',
      tags: ['内部预审', '统一问卷', '合规对标'],
      clauses: [
        { no: '数据收集框架', title: 'Converged Assessment Framework', content: '采用统一的融合评估框架（CAF）采集数据，避免各买家重复问卷。', tags: ['数据融合', 'CAF'] },
        { no: 'A 招聘与雇佣', title: 'Module A', content: '招聘、雇佣关系、年龄核验、工人来源的合法性。', tags: ['招聘', '雇佣', '年龄核验'] },
        { no: 'B 工作时间 / C 工资福利', title: 'Module B/C', content: '标准工时、加班、计薪方式与最低工资合规。', tags: ['工时', '加班', '工资', '最低工资'] },
        { no: 'D 员工待遇 / E 员工参与', title: 'Module D/E', content: '人道待遇、申诉机制、员工沟通与代表。', tags: ['人道待遇', '申诉', '员工参与'] },
        { no: 'F 健康安全 / G 终止雇佣', title: 'Module F/G', content: '职业安全健康、工伤、解雇与离职结算合规。', tags: ['职业健康安全', '工伤', '解雇'] },
        { no: 'H 管理体系', title: 'Management System', content: '社会责任政策、内审与持续改进机制。', tags: ['管理体系'] },
        { no: '分级 Step', title: 'Steps', content: '数据分为 Step 1/2/3 不同深度层级，由工厂自评+验证机构验证。', tags: ['Step', '验证'] }
      ]
    },

    // ---------------- 职业安全与健康 ----------------
    {
      code: 'OSHA',
      name: 'OSHA 职业安全与健康标准（美国）',
      category: '职业安全与健康',
      org: 'U.S. Occupational Safety and Health Administration',
      version: '29 CFR 1910 等',
      effective: '现行有效（美国联邦法规）',
      summary: '美国职业安全与健康管理局制定的工作场所安全与健康法规体系，对全球工厂 EHS 管理具参考价值。',
      officialUrl: 'https://www.osha.gov/',
      tags: ['职业安全', 'EHS', '美国法规'],
      clauses: [
        { no: '一般责任条款', title: 'General Duty Clause (§5(a)(1))', content: '雇主须为每位雇员提供没有公认死亡或严重身体伤害危险的工作场所。', tags: ['一般责任', 'EHS'] },
        { no: '记录与报告', title: 'Recordkeeping (§1904)', content: '雇主须记录并保持职业伤害与疾病记录，严重事故限期上报。', tags: ['工伤记录', '上报'] },
        { no: '一般行业标准的防护', title: 'General Industry (§1910)', content: '涵盖走道与出口、机器防护、危险沟通、电气、危险能源上锁挂牌（LOTO）等。', tags: ['机器防护', 'LOTO', '危险沟通', '电气'] },
        { no: '检查与执法', title: 'Inspections & Penalties (§1903)', content: '授权检查时出示凭证；对违规可处以罚款并责令整改。', tags: ['检查', '罚款'] },
        { no: '雇员权利', title: 'Worker Rights', content: '工人有权在安全环境工作、投诉违法、参与检查且不受报复。', tags: ['工人权利', '报复'] }
      ]
    },

    // ---------------- 国内劳动法规 ----------------
    {
      code: 'LABOR',
      name: '中华人民共和国劳动合同法',
      category: '国内劳动法规',
      org: '全国人民代表大会常务委员会',
      version: '2007 公布，2012 修正',
      effective: '2012 修正版现行有效',
      summary: '规范用人单位与劳动者订立、履行、变更、解除和终止劳动合同的基本法律，是社会合规的核心依据。',
      officialUrl: 'http://www.npc.gov.cn/',
      tags: ['劳动合同', '劳动保护', '国内法'],
      clauses: [
        { no: '第10条 书面合同', title: '书面劳动合同', content: '建立劳动关系应当订立书面劳动合同；用工之日起一个月内须订立。', tags: ['书面合同', '劳动合同'] },
        { no: '第19–20条 试用期', title: '试用期限制', content: '试用期长短与合同期限挂钩，同一单位只能约定一次；试用期工资不低于约定或最低工资 80%。', tags: ['试用期'] },
        { no: '第38条 劳动者解除', title: '劳动者单方解除', content: '用人单位未提供劳动保护、欠薪、未缴社保等情形下，劳动者可解除合同并要求补偿。', tags: ['解除', '欠薪', '社保'] },
        { no: '第47条 经济补偿', title: '经济补偿', content: '按工作年限每满一年支付一个月工资；六个月以上不满一年按一年计。', tags: ['经济补偿', '补偿金'] },
        { no: '第82条 未签合同责任', title: '二倍工资', content: '用人单位自用工满一个月未签书面合同的，应支付二倍工资。', tags: ['二倍工资', '书面合同'] },
        { no: '第85条 欠薪责任', title: '欠薪加付赔偿', content: '劳动报酬低于最低标准或逾期不支付的，责令加付应付金额 50%–100% 的赔偿金。', tags: ['欠薪', '赔偿金'] }
      ]
    },

    // ---------------- 消防安全法规 ----------------
    {
      code: 'FIRE',
      name: '中华人民共和国消防法',
      category: '消防安全法规',
      org: '全国人民代表大会常务委员会',
      version: '1998 公布，2008/2019/2021 修正',
      effective: '2021 修正版现行有效（含建设工程消防审验职责划归住建部门）',
      summary: '消防工作的基本法律，明确单位消防安全职责、火灾预防、灭火救援与法律责任；建设工程消防设计审查验收由住建部门实施。',
      officialUrl: 'http://www.npc.gov.cn/',
      tags: ['消防安全', '建筑消防', '国内法'],
      clauses: [
        { no: '第16条 单位职责', title: '消防安全职责', content: '单位须落实消防安全责任制、配置消防设施、保障疏散通道、组织防火检查与演练。', tags: ['消防安全职责', '消防设施', '疏散', '演练'] },
        { no: '第21条 特种作业', title: '持证上岗', content: '电焊、气焊等具有火灾危险作业的人员和自动消防系统操作人员须持证上岗。', tags: ['持证上岗', '特种作业'] },
        { no: '第44条 火灾报警', title: '报警与扑救', content: '任何人发现火灾应立即报警；单位须组织引导人员疏散并配合扑救。', tags: ['火灾报警', '疏散'] },
        { no: '第54条 救援指挥', title: '消防救援', content: '消防救援机构统一组织和指挥火灾现场扑救，有权采取强制排险措施。', tags: ['消防救援'] },
        { no: '第58条 法律责任', title: '违法处罚', content: '未经消防验收或不合格擅自投入使用等，可责令停用并处罚款；构成犯罪的追究刑事责任。', tags: ['消防处罚', '消防验收'] },
        { no: '建筑消防审验', title: '建设工程消防审查验收', content: '依据《建设工程消防设计审查验收管理暂行规定》（住建部令第58号），特殊建设工程须消防设计审查与验收合格后方可使用。', tags: ['消防设计审查', '消防验收', '住建'] }
      ]
    },

    // ---------------- 环境保护法规 ----------------
    {
      code: 'ENV',
      name: '中华人民共和国环境保护法',
      category: '环境保护法规',
      org: '全国人民代表大会常务委员会',
      version: '1989 公布，2014 修订',
      effective: '2015-01-01 施行；将于 2026-08-15 被《生态环境法典》取代',
      summary: '环境保护领域的基础性法律，确立保护优先、预防为主、损害担责等原则，并引入按日计罚、查封扣押、行政拘留等刚性手段。',
      officialUrl: 'http://www.npc.gov.cn/',
      tags: ['环境保护', '污染防治', '国内法'],
      clauses: [
        { no: '第41条 环境监测', title: '环境监测', content: '建立监测制度与网络，国务院环保主管部门统一发布环境状况公报。', tags: ['环境监测'] },
        { no: '第42条 污染防治义务', title: '排污单位责任', content: '排放污染物的企业须建立环境保护责任制度，安装使用监测设备并保证正常运行。', tags: ['排污责任', '监测设备'] },
        { no: '第45条 排污许可', title: '总量控制与排污许可', content: '实行重点污染物排放总量控制；排放须取得排污许可证并依证排污。', tags: ['排污许可', '总量控制'] },
        { no: '第59条 按日连续处罚', title: '按日计罚', content: '违法排放被责令改正而拒不改正的，自责令改正之次日起按原处罚数额按日连续处罚。', tags: ['按日计罚'] },
        { no: '第60条 查封扣押', title: '查封扣押', content: '对违反法律法规排放污染物、造成或可能造成严重污染的，可查封、扣押造成污染的设施、设备。', tags: ['查封扣押'] },
        { no: '第63条 行政拘留', title: '行政拘留', content: '对未取得排污许可、通过暗管等逃避监管方式违法排污等情形，将案件移送公安机关予以行政拘留。', tags: ['行政拘留', '暗管偷排'] }
      ]
    },

    // ---------------- 行业特定标准 ----------------
    {
      code: 'SLCP',
      name: 'SLCP 社会劳工整合项目',
      category: '行业特定标准',
      org: 'Social & Labor Convergence Program',
      version: 'CAF v1.5（融合评估框架）',
      effective: 'CAF v1.5 现行有效',
      summary: '通过统一的融合评估框架（CAF）取代各行业专属评估工具，减少重复审核。数据分为 Step 1（自评）、Step 2（验证）、Step 3（深度评估）三个层级，验证结果可共享给多个买家。',
      officialUrl: 'https://slconvergence.com/',
      tags: ['融合评估', '减少重复审核', '数据共享'],
      clauses: [
        { no: 'CAF 数据收集', title: 'Converged Assessment Framework', content: '统一问卷覆盖招聘雇佣、工时工资、员工待遇、健康安全、管理体系等议题，取代各品牌独立问卷。', tags: ['数据融合', '统一问卷'] },
        { no: 'Step 1 自评', title: 'Step 1 Self-Assessment', content: '工厂使用 CAF 工具完成自我评估，提交至 SLCP 平台。', tags: ['自评', 'Step1'] },
        { no: 'Step 2 验证', title: 'Step 2 Verification', content: '经 SLCP 认可的验证机构对自评数据进行现场或远程验证，确认数据准确性。', tags: ['验证', 'Step2'] },
        { no: 'Step 3 深度评估', title: 'Step 3 Assessment', content: '在验证基础上进行深度评估，涵盖管理体系成熟度与持续改进能力。', tags: ['深度评估', 'Step3'] },
        { no: '数据共享', title: 'Data Sharing', content: '验证通过的数据可共享给 amfori BSCI、Sedex、SAC 等多个平台，减少重复审核。', tags: ['数据共享', '减少重复'] }
      ]
    },
    {
      code: 'IETP',
      name: 'ICTI IETP 玩具业责任规范',
      category: '行业特定标准',
      org: 'International Council of Toy Industries (ICTI)',
      version: 'IETP v3.0',
      effective: 'v3.0 现行有效',
      summary: '全球玩具贸易协会联盟推出的社会责任审核项目，帮助玩具制造企业避免多次审核，节约时间和费用。覆盖劳工权益、健康安全、环境管理三大领域。',
      officialUrl: 'https://www.toy-icti.org/',
      tags: ['玩具行业', '减少重复审核', '认证'],
      clauses: [
        { no: '劳工权益', title: 'Labor Rights', content: '禁止强迫劳动与童工、公平报酬、合理工时、结社自由、不歧视、人道待遇。', tags: ['强迫劳动', '童工', '工资', '工时', '结社自由', '歧视'] },
        { no: '健康与安全', title: 'Health & Safety', content: '职业安全防护、应急准备、工伤预防、工业卫生、宿舍食堂卫生、机器防护。', tags: ['职业健康安全', '应急', 'PPE'] },
        { no: '环境管理', title: 'Environment', content: '环境许可、污染防控、废弃物管理、能源消耗监测。', tags: ['环境', '废弃物'] },
        { no: '管理体系', title: 'Management System', content: '政策承诺、职责分工、培训沟通、内审与持续改进。', tags: ['管理体系', '内审'] },
        { no: '认证等级', title: 'Certification Levels', content: '分为 A/B/C 三个等级，A级为持续符合，B级为基本符合需改进，C级为不符合需整改后重审。', tags: ['认证等级', '分级'] }
      ]
    },
    {
      code: 'RJC',
      name: 'RJC 责任珠宝委员会准则',
      category: '行业特定标准',
      org: 'Responsible Jewellery Council',
      version: 'CoP v2019（行为准则）+ Chain-of-Custody v2017',
      effective: 'CoP v2019 现行有效',
      summary: '覆盖从采矿到零售的珠宝供应链道德、人权、社会和环境实践。会员须通过第三方审核认证，证明符合行为准则与产销监管链要求。',
      officialUrl: 'https://www.responsiblejewellery.com/',
      tags: ['珠宝行业', '产销监管链', '供应链'],
      clauses: [
        { no: '人权与社会责任', title: 'Human Rights', content: '禁止童工与强迫劳动、公平报酬、合理工时、结社自由、不歧视、社区影响评估。', tags: ['童工', '强迫劳动', '工资', '工时', '结社自由', '歧视'] },
        { no: '环境责任', title: 'Environment', content: '环境管理、能源与水资源管理、废弃物处理、碳排放管理、化学品管理。', tags: ['环境', '碳排放', '化学品'] },
        { no: '采矿实践', title: 'Mining', content: '负责任采矿、社区参与、土地使用管理、关闭矿井规划。', tags: ['采矿', '社区'] },
        { no: '产销监管链', title: 'Chain-of-Custody', content: '从矿山到零售全链条追溯，确保贵金属与宝石来源合规可查。', tags: ['产销监管链', '追溯'] },
        { no: '商业道德', title: 'Business Ethics', content: '反腐败、透明披露、公平竞争、知识产权保护。', tags: ['反腐败', '透明', '公平竞争'] }
      ]
    },

    // ---------------- 客户特定验厂标准 ----------------
    {
      code: 'TARGET',
      name: 'TARGET 三合一验厂',
      category: '客户特定验厂标准',
      org: 'Target Corporation',
      version: '三合一审核（质量+社会责任+反恐）',
      effective: '现行有效',
      summary: 'TARGET 将质量、社会责任、反恐三项审核合并为一次验厂。评分由人权（40分）、质量（40分）、反恐（20分）构成，满分100分。80-100分为绿灯通过，60-79分为黄灯需整改，60分以下为红灯不通过。',
      officialUrl: 'https://www.target.com/',
      tags: ['客户验厂', '三合一', '评分制', '美国零售'],
      clauses: [
        { no: '人权审核（40分）', title: 'Human Rights (40pts)', content: '童工与未成年工、强迫劳动、工时（每日≤8h/每周≤44h/加班≤36h/月）、工资福利、健康安全、反歧视、结社自由。', tags: ['童工', '强迫劳动', '工时', '工资', '健康安全', '歧视', '结社自由'] },
        { no: '质量审核（40分）', title: 'Quality (40pts)', content: '质量管理体系、原材料控制、生产过程控制、成品检验、设备校准、追溯体系完整性。', tags: ['质量管理', '追溯', '检验'] },
        { no: '反恐审核（20分）', title: 'Security (20pts)', content: '物理安全（围墙/门禁/监控）、人员安全（背景审查/访客登记）、货物安全（集装箱七点检查/封条管理）、信息安全。', tags: ['反恐', '物理安全', '人员安全', '货物安全', '信息安全'] },
        { no: '评分标准', title: 'Scoring', content: '绿灯 80-100 分通过；黄灯 60-79 分需整改后复审；红灯 <60 分不通过，暂停合作。', tags: ['评分', '绿灯', '黄灯', '红灯'] },
        { no: '零容忍项', title: 'Zero Tolerance', content: '发现童工、强迫劳动、体罚/虐待、贿赂审核员、伪造记录，直接红灯终止合作。', tags: ['零容忍', '童工', '强迫劳动', '贿赂', '伪造'] }
      ]
    },
    {
      code: 'FD',
      name: 'Family Dollar (FD) 验厂',
      category: '客户特定验厂标准',
      org: 'Family Dollar Stores, Inc.（Dollar Tree 旗下）',
      version: 'FD 验厂标准',
      effective: '现行有效',
      summary: '涵盖人权保障、质量控制和供应链安全三大维度。禁止雇佣16岁以下童工，对工时、工资、健康安全有明确要求。',
      officialUrl: 'https://www.familydollar.com/',
      tags: ['客户验厂', '美国零售', '人权', '质量', '反恐'],
      clauses: [
        { no: '人权保障', title: 'Human Rights', content: '禁止雇佣16岁以下童工；工时每日≤8h/每周≤44h；工资不低于最低标准；加班费按法定核算；禁止强迫劳动与歧视。', tags: ['童工', '工时', '工资', '强迫劳动', '歧视'] },
        { no: '质量控制', title: 'Quality Control', content: '质量管理体系、原材料检验、生产过程控制、成品检验、不合格品处理。', tags: ['质量管理', '检验'] },
        { no: '供应链安全', title: 'Supply Chain Security', content: '厂区出入管控、货物追踪、集装箱检查、封条管理、信息安全程序。', tags: ['反恐', '货物安全', '信息安全'] },
        { no: '零容忍项', title: 'Zero Tolerance', content: '雇佣16岁以下童工、强迫劳动、囚禁工人、体罚、贿赂、伪造记录，直接不通过。', tags: ['零容忍', '童工', '强迫劳动', '贿赂'] }
      ]
    },
    {
      code: 'TRIFFIC',
      name: "T'RIFFIC 社会责任验厂",
      category: '客户特定验厂标准',
      org: "T'RIFFIC",
      version: 'T\'RIFFIC 社会责任审核标准',
      effective: '现行有效',
      summary: '聚焦"资料真实可追溯、现场合规可落地、流程闭环可核查"，拒绝形式化合规。审核强调证据链完整性与实际执行一致性。',
      officialUrl: '',
      tags: ['客户验厂', '可追溯', '证据链', '闭环核查'],
      clauses: [
        { no: '资料真实可追溯', title: 'Document Traceability', content: '人事档案、工时记录、工资表、安全演习记录须可追溯至12个月前；考勤与工资数据须系统关联可核对。', tags: ['追溯', '考勤', '工资表'] },
        { no: '现场合规可落地', title: 'On-site Compliance', content: '消防设施、应急通道、PPE 配备、设备防护须现场可见且有效运行；非仅文件达标。', tags: ['消防', 'PPE', '设备防护'] },
        { no: '流程闭环可核查', title: 'Process Closure', content: '不符合项须有整改记录与验证闭环；内审发现须有纠正措施跟踪至关闭。', tags: ['闭环', '整改', '内审'] },
        { no: '核查维度', title: 'Audit Dimensions', content: '每项要求拆分为核查项目、合规标准、所需佐证材料、自查要点四个维度，逐项对照执行。', tags: ['核查维度', '佐证材料'] },
        { no: '零容忍项', title: 'Zero Tolerance', content: '资料造假、现场与文件不符且无法合理解释、拒绝审核员进入区域、威胁或贿赂审核员。', tags: ['零容忍', '造假', '贿赂'] }
      ]
    },
    {
      code: 'JUSTICE',
      name: 'Justice 验厂',
      category: '客户特定验厂标准',
      org: 'Justice（Tween Brands, Inc.）',
      version: 'Justice 供应商行为准则',
      effective: '现行有效',
      summary: '涵盖企业基本信息、员工福利保障、环境健康安全三大板块。主要面向服装零售供应链。',
      officialUrl: '',
      tags: ['客户验厂', '服装零售', '员工福利', 'EHS'],
      clauses: [
        { no: '企业基本信息', title: 'Company Info', content: '营业执照、组织架构、员工名册、生产范围与产能、分包商信息申报。', tags: ['营业执照', '分包商'] },
        { no: '员工福利保障', title: 'Employee Welfare', content: '劳动合同签订率、工时合规、工资福利、社会保险缴纳、年假与休息、反歧视。', tags: ['劳动合同', '工时', '工资', '社保', '歧视'] },
        { no: '环境健康安全', title: 'EHS', content: '消防设施与演练、应急通道、职业健康防护、PPE 配备、宿舍食堂卫生、废弃物处理。', tags: ['消防', '职业健康', 'PPE', '宿舍', '废弃物'] },
        { no: '零容忍项', title: 'Zero Tolerance', content: '童工、强迫劳动、体罚/虐待、不安全建筑结构、贿赂审核员。', tags: ['零容忍', '童工', '强迫劳动', '体罚', '贿赂'] }
      ]
    },
    {
      code: 'SAMSUNG',
      name: '三星社会责任审核（中国地区）',
      category: '客户特定验厂标准',
      org: 'Samsung Electronics',
      version: '三星供应商行为准则（中国地区）',
      effective: '现行有效',
      summary: '针对中国地区供应商的社会责任审核，涵盖童工、工作时间、加班控制、工资福利、社会保险等核心议题。审核结果分为通过、条件通过、不通过三级。',
      officialUrl: '',
      tags: ['客户验厂', '电子行业', '中国地区'],
      clauses: [
        { no: '童工', title: 'Child Labor', content: '严禁雇佣未满16周岁童工；未成年工（16-18岁）须备案并限制从事禁忌作业。', tags: ['童工', '未成年工'] },
        { no: '工作时间', title: 'Working Hours', content: '每日≤8小时，每周≤44小时，加班≤36小时/月；每周至少休息1天。', tags: ['工时', '加班', '休息'] },
        { no: '加班控制', title: 'Overtime Control', content: '加班须员工自愿；不得以强迫或惩罚手段要求加班；加班费按法定标准核算。', tags: ['加班', '自愿'] },
        { no: '工资福利', title: 'Wages & Benefits', content: '工资不低于当地最低工资标准；加班费工作日1.5倍、休息日2倍、法定假日3倍；按时支付。', tags: ['工资', '最低工资', '加班费'] },
        { no: '社会保险', title: 'Social Insurance', content: '为全员缴纳养老、医疗、失业、工伤、生育保险；住房公积金按规定缴纳。', tags: ['社保', '五险', '公积金'] },
        { no: '零容忍项', title: 'Zero Tolerance', content: '童工、强迫劳动、扣留身份证件、收取押金、体罚、贿赂。', tags: ['零容忍', '童工', '强迫劳动', '押金', '体罚'] }
      ]
    },

    // ---------------- 质量管理标准 ----------------
    {
      code: 'ISO9001',
      name: 'ISO 9001 质量管理体系',
      category: '质量管理标准',
      org: 'International Organization for Standardization',
      version: 'ISO 9001:2015',
      effective: '2015 版现行有效',
      summary: '全球应用最广的质量管理体系认证标准，基于过程方法与 PDCA 循环，涵盖原材料采购、生产过程控制、成品检验及设备校准。',
      officialUrl: 'https://www.iso.org/iso-9001-quality-management.html',
      tags: ['质量管理', '体系认证', 'PDCA'],
      clauses: [
        { no: '4 组织环境', title: 'Context', content: '理解组织及其环境、相关方需求，确定 QMS 范围。', tags: ['组织环境', '范围'] },
        { no: '5 领导作用', title: 'Leadership', content: '最高管理者承诺、质量方针、角色职责分配。', tags: ['领导', '方针'] },
        { no: '6 策划', title: 'Planning', content: '风险与机遇应对、质量目标及实现计划。', tags: ['风险', '目标'] },
        { no: '7 支持', title: 'Support', content: '资源、能力、意识、沟通、成文信息（文件与记录控制）。', tags: ['资源', '记录', '文件'] },
        { no: '8 运行', title: 'Operation', content: '产品和服务要求评审、设计与开发、外部供方控制、生产和服务提供、产品放行、不合格品控制。', tags: ['设计开发', '供方控制', '不合格品'] },
        { no: '9 绩效评价', title: 'Performance', content: '监视测量分析与评价、内部审核、管理评审。', tags: ['内审', '管理评审', '绩效'] },
        { no: '10 改进', title: 'Improvement', content: '不符合与纠正措施、持续改进。', tags: ['纠正措施', '持续改进'] }
      ]
    },
    {
      code: 'IATF16949',
      name: 'IATF 16949 汽车行业质量管理体系',
      category: '质量管理标准',
      org: 'International Automotive Task Force',
      version: 'IATF 16949:2016',
      effective: '2016 版现行有效',
      summary: '汽车行业专用的质量管理体系标准，在 ISO 9001 基础上增加汽车行业特定要求，涵盖 APQP、PPAP、FMEA、SPC、MSA 五大核心工具。',
      officialUrl: 'https://www.iatfglobaloversight.org/',
      tags: ['汽车行业', '质量体系', '五大工具'],
      clauses: [
        { no: 'APQP', title: '产品质量先期策划', content: '在产品设计与开发阶段进行先期质量策划，确保产品满足客户要求。', tags: ['APQP', '设计开发'] },
        { no: 'PPAP', title: '生产件批准程序', content: '供应商须提交生产件批准文件，证明已理解客户要求并具备稳定生产能力。', tags: ['PPAP', '生产批准'] },
        { no: 'FMEA', title: '失效模式与后果分析', content: '系统分析设计与过程中的潜在失效模式及其后果，制定预防措施。', tags: ['FMEA', '风险分析'] },
        { no: 'SPC', title: '统计过程控制', content: '使用控制图等统计工具监控生产过程稳定性与能力。', tags: ['SPC', '统计控制'] },
        { no: 'MSA', title: '测量系统分析', content: '评估测量系统的偏倚、重复性、再现性，确保测量数据可靠。', tags: ['MSA', '测量系统'] }
      ]
    },

    // ---------------- 反恐安全标准 ----------------
    {
      code: 'CTPAT',
      name: 'C-TPAT 海关贸易反恐伙伴计划',
      category: '反恐安全标准',
      org: 'U.S. Customs and Border Protection (CBP)',
      version: 'C-TPAT 最低安全标准（MSC）2024 修订',
      effective: '2024 修订版现行有效',
      summary: '美国海关与边境保护局主导的自愿性供应链安全计划，成员须满足最低安全标准并通过审核，享受通关便利。2024 修订版强化了网络安全与供应商验证要求。',
      officialUrl: 'https://www.cbp.gov/border-security/ports-entry/cargo-security/ctpat',
      tags: ['反恐', '美国海关', '供应链安全', 'C-TPAT'],
      clauses: [
        { no: '物理安全', title: 'Physical Security', content: '厂区围墙、门禁系统、监控覆盖、照明设施、钥匙管理。', tags: ['物理安全', '围墙', '门禁', '监控'] },
        { no: '人员安全', title: 'Personnel Security', content: '员工背景审查、访客登记与陪同制度、证件管理、离职流程。', tags: ['人员安全', '背景审查', '访客'] },
        { no: '货物安全', title: 'Cargo Security', content: '集装箱七点检查法（前/后/左/右/顶/底/内部）、封条管理（ISO 17712 高安全封条）、运输全程可追踪。', tags: ['货物安全', '集装箱检查', '封条', '运输追踪'] },
        { no: '信息安全', title: 'Information Security', content: '建立货物和信息保护程序，防止数据泄露或篡改；网络安全措施（防火墙/访问控制/数据加密）。', tags: ['信息安全', '网络安全', '数据保护'] },
        { no: '商业伙伴要求', title: 'Business Partner', content: '对供应商与物流伙伴进行安全评估，要求其符合 C-TPAT 或同等安全标准。', tags: ['商业伙伴', '供应商安全'] }
      ]
    },
    {
      code: 'GSV',
      name: 'GSV 全球安全验证',
      category: '反恐安全标准',
      org: 'Intertek',
      version: 'GSV 标准',
      effective: '现行有效',
      summary: '由 Intertek 提供的全球供应链安全验证服务，帮助供应商一次性满足多个买家的反恐验厂要求，减少重复审核。',
      officialUrl: 'https://www.intertek.com/gsv/',
      tags: ['反恐', '安全验证', 'Intertek', '减少重复审核'],
      clauses: [
        { no: '物理安全', title: 'Physical Security', content: '建筑结构安全、出入口管控、监控覆盖、照明、围墙完整性。', tags: ['物理安全', '门禁', '监控'] },
        { no: '人员管控', title: 'Personnel Security', content: '员工背景调查、访客管理与登记、身份核验、培训意识。', tags: ['人员安全', '背景调查', '访客'] },
        { no: '货物安全', title: 'Cargo Security', content: '集装箱检查程序、封条管理、货物装卸监控、运输安全。', tags: ['货物安全', '集装箱', '封条'] },
        { no: '信息安全', title: 'Information Security', content: '数据保护程序、文件管控、信息系统访问控制。', tags: ['信息安全', '数据保护'] },
        { no: '评分与报告', title: 'Scoring & Report', content: '审核结果按各项得分加权计算总分，报告可共享给多个买家。', tags: ['评分', '报告共享'] }
      ]
    },
    {
      code: 'SCAN',
      name: 'SCAN 供应链合规审核',
      category: '反恐安全标准',
      org: 'SCAN Association',
      version: 'SCAN 审核标准',
      effective: '现行有效',
      summary: '供应链合规审核项目，结合反恐安全与社会责任要求，帮助供应商以一次审核满足多个买家的合规需求。',
      officialUrl: 'https://www.scancompliance.com/',
      tags: ['反恐', '供应链合规', '多买家共享'],
      clauses: [
        { no: '物理安全', title: 'Physical Security', content: '围墙、门禁、监控、照明、停车区域管控。', tags: ['物理安全', '围墙', '门禁'] },
        { no: '人员安全', title: 'Personnel Security', content: '背景审查、访客管理、培训、意识提升。', tags: ['人员安全', '背景审查'] },
        { no: '货物安全', title: 'Cargo Security', content: '集装箱检查、封条管理、仓储安全、运输追踪。', tags: ['货物安全', '集装箱', '封条', '仓储'] },
        { no: '文件与记录', title: 'Documentation', content: '安全政策文件、程序文件、培训记录、审核记录的完整性与可追溯性。', tags: ['文件', '记录', '追溯'] }
      ]
    }
  ];

  // 分类顺序（用于前端 tab 展示）
  StandardsSeed.categories = [
    '国际社会责任标准',
    '行业特定标准',
    '客户特定验厂标准',
    '质量管理标准',
    '反恐安全标准',
    '职业安全与健康',
    '国内劳动法规',
    '消防安全法规',
    '环境保护法规'
  ];

  // ---------- 审核流程指南 ----------
  StandardsSeed.auditFlow = [
    {
      step: 1,
      title: '首次会议',
      duration: '30-60 分钟',
      participants: '审核员、工厂管理层、相关部门负责人',
      keyPoints: [
        '审核员介绍审核目的、范围、方法与时间安排',
        '确认工厂提供的文件清单与陪同人员',
        '说明审核标准与评分规则',
        '强调审核的保密性与公正性',
        '签署审核确认书'
      ],
      documents: ['营业执照副本', '组织架构图', '员工名册', '审核行程确认书']
    },
    {
      step: 2,
      title: '现场巡视',
      duration: '2-4 小时',
      participants: '审核员、工厂陪同人员、车间负责人',
      keyPoints: [
        '实地走访车间、仓库、宿舍、食堂、门卫室',
        '检查消防设施、应急通道、安全标识、PPE 佩戴情况',
        '观察生产设备防护装置与操作规范',
        '查看宿舍与食堂卫生条件',
        '核实现场与文件记录的一致性',
        '可拍照记录重点区域（需工厂同意）'
      ],
      documents: ['厂区平面图', '消防设施分布图', '应急预案']
    },
    {
      step: 3,
      title: '文件审核',
      duration: '3-6 小时',
      participants: '审核员、人事/财务/EHS 负责人',
      keyPoints: [
        '审核人事档案：劳动合同、身份证复印件、年龄核验记录',
        '审核工时记录：考勤卡/打卡记录（过去12个月）',
        '审核工资表：工资条、银行转账记录、加班费核算',
        '审核安全记录：消防演习记录、工伤记录、培训记录',
        '审核环境记录：排污许可证、废弃物处置合同、监测报告',
        '核实社会保险缴纳凭证',
        '检查质量管理体系文件与记录'
      ],
      documents: ['劳动合同（全员）', '考勤记录（12个月）', '工资表（12个月）', '社保缴纳凭证', '消防演习记录', '工伤记录', '培训记录', '排污许可证', '废弃物处置合同', '环评报告']
    },
    {
      step: 4,
      title: '员工访谈',
      duration: '1-3 小时',
      participants: '审核员、随机抽取的员工（工厂代表不得参加）',
      keyPoints: [
        '随机抽取15-25名员工（覆盖不同车间、性别、工龄）',
        '一对一或小组保密访谈，确保员工不受压力',
        '询问入职流程、合同签订、年龄核验',
        '询问工时与加班是否自愿、工资是否按时足额',
        '询问是否了解申诉渠道、是否遭受歧视或骚扰',
        '询问消防演练与安全培训参与情况',
        '核对访谈内容与文件记录的一致性'
      ],
      documents: ['员工访谈记录表（审核员自带）', '随机抽取的员工名单']
    },
    {
      step: 5,
      title: '末次会议',
      duration: '30-60 分钟',
      participants: '审核员、工厂管理层、相关部门负责人',
      keyPoints: [
        '审核员汇报审核发现（符合项与不符合项）',
        '出示临时报告，说明初步结论与评分',
        '说明不符合项的整改要求与期限',
        '决定是否推荐通过（通常10天内出具正式报告）',
        '工厂管理层签字确认审核结果',
        '说明申诉渠道与后续跟进流程'
      ],
      documents: ['临时审核报告', '不符合项清单', '整改计划表']
    },
    {
      step: 6,
      title: '整改与跟进',
      duration: '整改期内（通常30-90天）',
      participants: '工厂整改团队、审核机构跟进人员',
      keyPoints: [
        '工厂针对不符合项制定整改计划并提交',
        '整改期限：重大不符合项30天内、一般不符合项60天内',
        '审核机构审核整改证据（文件/照片/远程视频）',
        '必要时安排现场复审',
        '整改通过后出具正式审核报告与认证/评级',
        '未通过整改的暂停或终止合作'
      ],
      documents: ['整改计划书', '整改证据材料', '复审报告', '正式审核报告']
    }
  ];

  // ---------- 合规自查清单 ----------
  StandardsSeed.checklists = [
    {
      module: '员工权益保障',
      priority: 5,
      icon: 'shield',
      items: [
        { check: '员工年龄≥18周岁', standard: 'SA8000/BSCI/RBA', evidence: '身份证复印件 + 入职年龄核验记录', priority: 'critical' },
        { check: '严禁雇佣16周岁以下童工', standard: 'SA8000/所有客户标准', evidence: '人事档案 + 年龄核验系统', priority: 'critical' },
        { check: '全员签订书面劳动合同', standard: '劳动合同法第10条', evidence: '劳动合同原件 + 签收记录', priority: 'critical' },
        { check: '合同条款符合劳动法要求', standard: '劳动合同法', evidence: '合同文本 + 法律审核记录', priority: 'major' },
        { check: '每日工时≤8小时', standard: 'BSCI/三星/TARGET', evidence: '考勤记录', priority: 'critical' },
        { check: '每周工时≤44小时', standard: 'BSCI/三星标准', evidence: '考勤汇总表', priority: 'critical' },
        { check: '加班≤36小时/月', standard: 'BSCI/三星标准', evidence: '考勤记录 + 加班审批单', priority: 'critical' },
        { check: '每周至少休息1天', standard: 'SA8000/BSCI', evidence: '考勤排班表', priority: 'major' },
        { check: '加班须员工自愿', standard: 'SA8000/RBA', evidence: '加班同意书 + 考勤记录', priority: 'major' },
        { check: '工资不低于当地最低工资标准', standard: 'SA8000/TARGET', evidence: '工资表 + 最低工资标准文件', priority: 'critical' },
        { check: '加班费核算准确（工作日1.5倍/休息日2倍/法定假日3倍）', standard: '劳动法/TARGET', evidence: '工资表 + 加班费计算表', priority: 'critical' },
        { check: '按时足额以法定货币支付工资', standard: 'SA8000', evidence: '银行转账记录 + 工资签收', priority: 'major' },
        { check: '为全员缴纳五险（养老/医疗/失业/工伤/生育）', standard: '社会保险法/三星', evidence: '社保缴纳凭证 + 参保证明', priority: 'major' },
        { check: '禁止在招聘/晋升/薪酬分配中的歧视行为', standard: 'BSCI/SA8000', evidence: '招聘制度 + 晋升记录', priority: 'major' },
        { check: '不扣留工人身份证件或收取押金', standard: 'SA8000/RBA', evidence: '现场核查 + 员工访谈', priority: 'critical' }
      ]
    },
    {
      module: '健康与安全',
      priority: 5,
      icon: 'fire',
      items: [
        { check: '灭火器、消防栓、应急照明灯齐全有效', standard: '所有标准', evidence: '消防设施检查记录 + 维护台账', priority: 'critical' },
        { check: '疏散通道畅通无阻', standard: '消防法第16条', evidence: '现场照片 + 日常检查记录', priority: 'critical' },
        { check: '生产设备配备安全防护装置（防护罩/急停按钮）', standard: 'OSHA/RBA', evidence: '设备清单 + 防护装置照片', priority: 'critical' },
        { check: '粉尘/噪声/有毒有害物质防控到位', standard: 'OSHA/RBA', evidence: '环境监测报告 + PPE 配备记录', priority: 'major' },
        { check: '配备必要个人防护用品（PPE）', standard: '所有标准', evidence: 'PPE 发放记录 + 佩戴照片', priority: 'major' },
        { check: '定期组织消防演练并留存记录', standard: '消防法第16条', evidence: '演练记录 + 照片/视频', priority: 'critical' },
        { check: '定期组织急救培训', standard: 'BSCI/SMETA', evidence: '培训记录 + 急救员证书', priority: 'major' },
        { check: '电工/电梯工/锅炉工等特殊工种持证上岗', standard: '消防法第21条', evidence: '特种作业操作证', priority: 'critical' },
        { check: '宿舍与食堂卫生条件达标', standard: 'SA8000/RBA', evidence: '卫生检查记录 + 照片', priority: 'major' },
        { check: '取得消防验收/安全检查合格', standard: '消防法/TARGET', evidence: '消防验收意见书', priority: 'critical' }
      ]
    },
    {
      module: '环境合规',
      priority: 4,
      icon: 'leaf',
      items: [
        { check: '环保审批手续齐全', standard: '环境保护法', evidence: '环评批复文件', priority: 'critical' },
        { check: '排污许可证齐全有效', standard: '环境保护法第45条', evidence: '排污许可证副本', priority: 'critical' },
        { check: '废水排放符合国家及地方标准', standard: '环境保护法', evidence: '废水监测报告', priority: 'major' },
        { check: '废气排放符合国家及地方标准', standard: '环境保护法', evidence: '废气监测报告', priority: 'major' },
        { check: '固体废物分类存放', standard: '固废法', evidence: '现场照片 + 管理台账', priority: 'major' },
        { check: '危险废物委托有资质机构处置', standard: '固废法', evidence: '危废处置合同 + 转移联单', priority: 'critical' },
        { check: '能源消耗监测到位', standard: 'RBA/新兴要求', evidence: '能耗台账 + 能源审计报告', priority: 'minor' },
        { check: '优先采用环保型原材料', standard: 'RBA', evidence: '采购记录 + 材料声明', priority: 'minor' },
        { check: '配备节能节水设备', standard: 'RBA/新兴要求', evidence: '设备清单 + 节能认证', priority: 'minor' }
      ]
    },
    {
      module: '反恐安全（美国市场）',
      priority: 3,
      icon: 'lock',
      items: [
        { check: '厂区围墙完整无缺口', standard: 'C-TPAT/GSV', evidence: '现场照片', priority: 'major' },
        { check: '门禁系统有效运行', standard: 'C-TPAT/SCAN', evidence: '门禁记录 + 系统截图', priority: 'major' },
        { check: '监控覆盖关键区域（出入口/仓库/装卸区）', standard: 'C-TPAT/GSV', evidence: '监控布局图 + 录像截图', priority: 'major' },
        { check: '员工背景审查制度落实', standard: 'C-TPAT/GSV', evidence: '背景审查记录 + 制度文件', priority: 'major' },
        { check: '访客登记与陪同制度执行', standard: 'C-TPAT/SCAN', evidence: '访客登记簿 + 陪同记录', priority: 'major' },
        { check: '集装箱七点检查法执行', standard: 'C-TPAT/GSV/SCAN', evidence: '检查记录表 + 照片', priority: 'critical' },
        { check: '使用 ISO 17712 高安全封条', standard: 'C-TPAT', evidence: '封条采购记录 + 使用台账', priority: 'critical' },
        { check: '运输全程可追踪', standard: 'C-TPAT/GSV', evidence: 'GPS 追踪记录 + 运输日志', priority: 'major' },
        { check: '建立货物和信息保护程序', standard: 'C-TPAT/GSV', evidence: '程序文件 + 培训记录', priority: 'major' },
        { check: '信息系统访问控制与数据加密', standard: 'C-TPAT 2024修订', evidence: 'IT 安全策略 + 系统截图', priority: 'major' }
      ]
    }
  ];

  // ---------- 2025-2026 验厂趋势更新 ----------
  StandardsSeed.trends2025 = [
    {
      title: '供应链透明度强化',
      isNew: true,
      impact: '高',
      description: '要求建立从原材料到成品交付的数字化追溯系统，对关键原材料供应商实施动态风险评估。',
      affectedStandards: ['BSCI PA13', 'RBA F', 'SLCP', 'SMETA'],
      actionRequired: '部署供应链追溯系统，将二级供应商纳入评估范围，建立原材料来源数字台账。'
    },
    {
      title: '社会责任标准升级：童工年龄与工资同步',
      isNew: true,
      impact: '高',
      description: '明确禁止雇佣16岁以下童工（部分标准此前为15岁），要求工资单与考勤系统实时同步，杜绝手工篡改。',
      affectedStandards: ['SA8000', 'BSCI PA8', 'TARGET', 'Family Dollar', '三星'],
      actionRequired: '将童工筛查年龄门槛上调至16岁；部署电子考勤系统并与工资核算系统直连。'
    },
    {
      title: '碳足迹报告强制化',
      isNew: true,
      impact: '高',
      description: '强制要求提交年度碳足迹报告，制定明确的减排目标与时间表。',
      affectedStandards: ['RBA C', 'SMETA 支柱三', 'BSCI PA10', 'ESG 相关标准'],
      actionRequired: '建立温室气体排放盘查体系，编制年度碳足迹报告，设定科学减排目标（SBTi）。'
    },
    {
      title: '审核流程数字化与AI监控',
      isNew: true,
      impact: '中',
      description: '引入AI视频分析技术对生产现场进行实时监控，审核报告通过加密存储防篡改。',
      affectedStandards: ['所有审核方法论'],
      actionRequired: '评估AI审核工具的适用性，确保审核报告的加密存储与防篡改机制。'
    },
    {
      title: '数字化证据成为主流',
      isNew: true,
      impact: '中',
      description: '纸质打卡记录逐渐被生物识别考勤系统取代，电子工时工资记录成为审核证据的主流形式。',
      affectedStandards: ['SLCP', 'BSCI', 'SMETA', '所有客户验厂'],
      actionRequired: '部署生物识别考勤系统（指纹/人脸），确保数据不可篡改并具备审计追踪功能。'
    },
    {
      title: '供应链延伸审核增多',
      isNew: true,
      impact: '高',
      description: '客户开始要求企业提供二级供应商的社会责任承诺与合规证据，审核范围向供应链上游延伸。',
      affectedStandards: ['RBA F', 'BSCI PA1/PA13', 'SMETA MSA'],
      actionRequired: '建立二级供应商合规档案，收集社会责任承诺书，对关键二级供应商开展现场评估。'
    },
    {
      title: '心理安全纳入评估',
      isNew: true,
      impact: '中',
      description: '将是否存在言语侮辱、过度监控等隐性压迫行为纳入评估范围，关注员工心理健康。',
      affectedStandards: ['BSCI PA2', 'SA8000 惩戒性措施', 'RBA A 人道待遇'],
      actionRequired: '制定反职场霸凌政策，建立心理健康支持渠道，将心理安全纳入内审检查表。'
    }
  ];

  // ---------- 客户验厂评分标准与零容忍项详解 ----------
  StandardsSeed.customerDetails = {
    TARGET: {
      name: 'TARGET 三合一验厂',
      scoring: [
        { dimension: '人权', maxScore: 40, passingScore: 32, items: '童工/强迫劳动/工时/工资/健康安全/反歧视/结社自由' },
        { dimension: '质量', maxScore: 40, passingScore: 32, items: 'QMS/原材料控制/过程控制/成品检验/设备校准/追溯' },
        { dimension: '反恐', maxScore: 20, passingScore: 16, items: '物理安全/人员安全/货物安全/信息安全' }
      ],
      totalScore: 100,
      levels: [
        { level: '绿灯', range: '80-100', result: '通过，有效期12个月' },
        { level: '黄灯', range: '60-79', result: '需整改，90天内复审' },
        { level: '红灯', range: '<60', result: '不通过，暂停合作' }
      ],
      zeroTolerance: ['雇佣童工', '强迫劳动', '体罚/虐待', '贿赂审核员', '伪造记录', '拒绝审核']
    },
    FD: {
      name: 'Family Dollar (FD) 验厂',
      scoring: [
        { dimension: '人权保障', maxScore: 50, passingScore: 40, items: '童工(≥16岁)/工时/工资/强迫劳动/歧视/健康安全' },
        { dimension: '质量控制', maxScore: 30, passingScore: 24, items: 'QMS/原材料检验/过程控制/成品检验/不合格品' },
        { dimension: '供应链安全', maxScore: 20, passingScore: 16, items: '出入管控/货物追踪/集装箱检查/封条/信息安全' }
      ],
      totalScore: 100,
      levels: [
        { level: '通过', range: '≥80', result: '有效期12个月' },
        { level: '条件通过', range: '60-79', result: '需整改，60天内复审' },
        { level: '不通过', range: '<60', result: '暂停合作' }
      ],
      zeroTolerance: ['雇佣16岁以下童工', '强迫劳动', '囚禁工人', '体罚', '贿赂', '伪造记录']
    },
    TRIFFIC: {
      name: "T'RIFFIC 社会责任验厂",
      scoring: [
        { dimension: '资料真实可追溯', maxScore: 35, passingScore: 28, items: '人事档案/工时记录/工资表/安全演习记录（12个月）' },
        { dimension: '现场合规可落地', maxScore: 35, passingScore: 28, items: '消防设施/应急通道/PPE/设备防护实际运行' },
        { dimension: '流程闭环可核查', maxScore: 30, passingScore: 24, items: '不符合项整改闭环/内审纠正措施跟踪' }
      ],
      totalScore: 100,
      levels: [
        { level: '通过', range: '≥85', result: '有效期12个月' },
        { level: '条件通过', range: '70-84', result: '需整改，30天内提交证据' },
        { level: '不通过', range: '<70', result: '90天后可重新申请' }
      ],
      zeroTolerance: ['资料造假', '现场与文件严重不符且无法解释', '拒绝审核员进入区域', '威胁或贿赂审核员']
    },
    JUSTICE: {
      name: 'Justice 验厂',
      scoring: [
        { dimension: '企业基本信息', maxScore: 20, passingScore: 16, items: '营业执照/组织架构/员工名册/产能/分包商申报' },
        { dimension: '员工福利保障', maxScore: 50, passingScore: 40, items: '劳动合同/工时/工资/社保/年假/反歧视' },
        { dimension: '环境健康安全', maxScore: 30, passingScore: 24, items: '消防/应急通道/职业健康/PPE/宿舍食堂/废弃物' }
      ],
      totalScore: 100,
      levels: [
        { level: '通过', range: '≥80', result: '有效期12个月' },
        { level: '条件通过', range: '60-79', result: '需整改，60天内复审' },
        { level: '不通过', range: '<60', result: '暂停合作' }
      ],
      zeroTolerance: ['童工', '强迫劳动', '体罚/虐待', '不安全建筑结构', '贿赂审核员']
    },
    SAMSUNG: {
      name: '三星社会责任审核（中国地区）',
      scoring: [
        { dimension: '童工', maxScore: 20, passingScore: 20, items: '年龄核验/未成年工备案/禁忌作业限制' },
        { dimension: '工时与加班', maxScore: 25, passingScore: 20, items: '每日≤8h/每周≤44h/加班≤36h月/每周休1天/加班自愿' },
        { dimension: '工资福利', maxScore: 25, passingScore: 20, items: '最低工资/加班费核算/按时支付/扣减合法' },
        { dimension: '社会保险', maxScore: 15, passingScore: 12, items: '五险缴纳/公积金' },
        { dimension: '健康安全', maxScore: 15, passingScore: 12, items: '消防/PPE/设备防护/应急演练' }
      ],
      totalScore: 100,
      levels: [
        { level: '通过', range: '≥80', result: '有效期12个月' },
        { level: '条件通过', range: '60-79', result: '需整改，30天内复审' },
        { level: '不通过', range: '<60', result: '暂停合作，90天后重审' }
      ],
      zeroTolerance: ['童工', '强迫劳动', '扣留身份证件', '收取押金', '体罚', '贿赂']
    }
  };

  global.StandardsSeed = StandardsSeed;
})(window);

/* ===== src/js/term-glossary.js ===== */
/* 术语定义库（标准模块 · 术语查询子模块种子数据）
 *  augment global.StandardsSeed.termGlossary
 *  结构：{ id, term(中文), termEn(英文), aliases:[], source(来源标准),
 *          discipline(学科), py(全拼), pyAbbr(拼音首字母), definition, detail,
 *          related:[term], custom:false }
 *  - source：预设为相关标准代码（BSCI/SMETA/WRAP/SLCP/RBA/SA8000/ISO/欧盟/通用）
 *  - py / pyAbbr：预计算拼音，支撑「拼音搜索」而无需运行时拼音库（离线零依赖）
 *  - definition 必须具体、可核验，避免模糊表述
 */
(function (global) {
  const StandardsSeed = (global.StandardsSeed = global.StandardsSeed || {});
  StandardsSeed.termGlossary = [
    { id: 'tg01', term: '强迫劳动', termEn: 'Forced Labor', aliases: ['强制劳动', 'forced labor', '抵债劳动', '契约劳动'], source: 'RBA', discipline: '劳工', py: 'qiangpo laodong', pyAbbr: 'qpld',
      definition: '以暴力、威胁、债务或扣押证件等手段迫使他人在非自愿状态下劳动，或限制其自由离职。',
      detail: '覆盖 RBA、BSCI、SA8000 等全部主流标准的红线项。判定包括：扣留身份证/护照、收取押金、债务劳工、非自愿加班。审核中一经发现即为零容忍。',
      related: ['童工', '申诉机制', '零容忍'], custom: false },
    { id: 'tg02', term: '童工', termEn: 'Child Labor', aliases: ['child labor', '未成年工'], source: 'SA8000', discipline: '劳工', py: 'tong gong', pyAbbr: 'tg',
      definition: '雇用未满法定最低就业年龄（通常 15 岁，或当地义务教育年龄/最低就业年龄中较高者）的劳动者。',
      detail: '禁止性红线。已雇童工须立即剥离危险岗位并建立补救（回校+薪酬补偿）程序；15–18 岁为未成年工，受工时与工种限制。',
      related: ['强迫劳动', '零容忍'], custom: false },
    { id: 'tg03', term: '歧视', termEn: 'Discrimination', aliases: ['discrimination', '平等'], source: '通用', discipline: '劳工', py: 'qi shi', pyAbbr: 'qs',
      definition: '在招聘、薪酬、晋升、培训等环节，基于种族、性别、宗教、年龄、残障等实施不公平对待。',
      detail: '各标准要求建立公平雇佣政策，禁止基于受保护特征的差别待遇；同工同酬是核心核查点。',
      related: ['商业道德'], custom: false },
    { id: 'tg04', term: '结社自由', termEn: 'Freedom of Association', aliases: ['freedom of association', '集体谈判权', 'collective bargaining'], source: '通用', discipline: '劳工', py: 'jie she zi you', pyAbbr: 'jszy',
      definition: '工人依法自愿组建、参加工会，并通过集体谈判维护权益的权利。',
      detail: '标准尊重工人结社自由与集体谈判权，禁止因工会活动报复工人；在受限法域须提供替代的工人意见表达机制。',
      related: ['申诉机制'], custom: false },
    { id: 'tg05', term: '工资与福利', termEn: 'Wages and Benefits', aliases: ['wages and benefits', '最低工资', '社会保险'], source: '通用', discipline: '劳工', py: 'gong zi yu fu li', pyAbbr: 'gzyfl',
      definition: '依法、按时、足额以货币支付工资，且不低于当地最低工资标准，并依法缴纳社会保险。',
      detail: '核查要点：工资单与考勤一致、加班费按法定倍数、无非法扣减、社保覆盖。工资应至少每月支付一次。',
      related: ['工作时间'], custom: false },
    { id: 'tg06', term: '工作时间', termEn: 'Working Hours', aliases: ['working hours', '工时', '加班'], source: '通用', discipline: '劳工', py: 'gong zuo shi jian', pyAbbr: 'gzsj',
      definition: '周标准工时通常不超过 48 小时，加班自愿且每周不超过 12 小时，每 7 天至少休息 1 天。',
      detail: 'SA8000 与多数标准采用此上限；部分客户要求更严（如周总工时 ≤60）。须有完整考勤记录佐证。',
      related: ['工资与福利'], custom: false },
    { id: 'tg07', term: '职业健康与安全', termEn: 'Occupational Health and Safety', aliases: ['OHS', 'OH&S', 'occupational health and safety', '职业安全'], source: '通用', discipline: '健康安全', py: 'zhi ye jian kang yu an quan', pyAbbr: 'zyjkyaq',
      definition: '为工人提供安全健康的工作与生活环境，识别并控制机械、电气、化学品、消防等危害。',
      detail: '要求：消防验收合格、定期消防演练、提供 PPE、特种作业持证、宿舍/食堂/卫生设施达标、建立工伤事故记录与整改。',
      related: ['环境管理体系'], custom: false },
    { id: 'tg08', term: '管理体系', termEn: 'Management System', aliases: ['management system', 'MS', 'PDCA'], source: '通用', discipline: '管理体系', py: 'guan li ti xi', pyAbbr: 'glx',
      definition: '以政策—策划—实施—检查—改进（PDCA）为框架，系统化识别社会责任风险并持续改进的机制。',
      detail: '覆盖责任承诺、风险识别、目标指标、培训、内部审核、管理评审；是 RBA、ISO 26000、客户验厂的共同基础。',
      related: ['尽职调查', '环境管理体系'], custom: false },
    { id: 'tg09', term: '尽职调查', termEn: 'Due Diligence', aliases: ['due diligence', '供应链尽责', 'human rights due diligence'], source: '欧盟', discipline: '商业道德', py: 'jin zhi diao cha', pyAbbr: 'jzdc',
      definition: '企业识别、预防、减轻并 Accountability 其运营与供应链中负面影响（尤其人权与环境）的持续过程。',
      detail: '依据 OECD 指南与欧盟《企业可持续尽职调查指令》（CSDDD），要求高风险环节实施更频密的尽责，并向监管与公众披露。',
      related: ['利益相关方', '供应链'], custom: false },
    { id: 'tg10', term: '利益相关方', termEn: 'Stakeholder', aliases: ['stakeholder'], source: '通用', discipline: '通用', py: 'li yi xiang guan fang', pyAbbr: 'lyxgf',
      definition: '受企业活动影响或可影响企业活动的各方，包括工人、社区、客户、供应商、监管者、投资者。',
      detail: '管理体系要求建立利益相关方沟通与参与机制，尤其倾听弱势方（如一线工人、当地社区）诉求。',
      related: ['申诉机制', '尽职调查'], custom: false },
    { id: 'tg11', term: '申诉机制', termEn: 'Grievance Mechanism', aliases: ['grievance mechanism', '投诉渠道', '举报'], source: '通用', discipline: '劳工', py: 'shen su ji zhi', pyAbbr: 'ssjz',
      definition: '供工人及社区就侵权、违规或不满进行匿名或实名反馈，并获得公正处理的渠道。',
      detail: '有效申诉机制须：可访问、可预期、公平、透明、符合人权；禁止打击报复；是 RBA、SLCP 的关键核查项。',
      related: ['强迫劳动', '利益相关方'], custom: false },
    { id: 'tg12', term: '商业道德', termEn: 'Business Ethics', aliases: ['business ethics'], source: '通用', discipline: '商业道德', py: 'shang ye dao de', pyAbbr: 'sydd',
      definition: '在经营中恪守诚信、公平、反贿赂与反不正当竞争的原则。',
      detail: '涵盖反腐败、反贿赂、知识产权保护、公平交易、信息保密；是 SMETA 四支柱之一、RBA 行为准则核心。',
      related: ['反腐败'], custom: false },
    { id: 'tg13', term: '反腐败', termEn: 'Anti-corruption', aliases: ['anti-corruption', '反贿赂', 'anti-bribery'], source: '通用', discipline: '商业道德', py: 'fan fu bai', pyAbbr: 'ffb',
      definition: '禁止一切形式的贿赂、勒索、敲诈与欺诈，无论对象为公职人员或商业伙伴。',
      detail: '须建立礼品/招待/利益冲突申报制度，开展员工与供应商反贿赂培训，并保留合规记录。',
      related: ['商业道德'], custom: false },
    { id: 'tg14', term: '环境管理体系', termEn: 'Environmental Management System', aliases: ['EMS', 'ISO 14001', 'environmental management system'], source: 'ISO', discipline: '环境', py: 'huan jing guan li ti xi', pyAbbr: 'hjglx',
      definition: '系统化管控组织活动对环境的影响，以 ISO 14001 为国际通用框架。',
      detail: '要求：环境政策、合规评价、目标指标、运行控制、应急准备、监测与改进；与客户「环境审核」模块衔接。',
      related: ['职业健康与安全', '温室气体'], custom: false },
    { id: 'tg15', term: '碳足迹', termEn: 'Carbon Footprint', aliases: ['carbon footprint'], source: '通用', discipline: '环境', py: 'tan zu ji', pyAbbr: 'tzj',
      definition: '某产品、组织或活动在全生命周期内直接和间接排放的温室气体总量（以 CO₂ 当量计）。',
      detail: '常用于产品碳足迹（ISO 14067）与组织碳盘查（ISO 14064）；设定碳中和/减排目标时须配套 SBTi 科学碳目标方具可比性。',
      related: ['温室气体', '环境管理体系'], custom: false },
    { id: 'tg16', term: '温室气体', termEn: 'Greenhouse Gas', aliases: ['GHG', 'greenhouse gas', '碳排放'], source: '通用', discipline: '环境', py: 'wen shi qi ti', pyAbbr: 'wsqt',
      definition: '大气中吸收并重新辐射热量的气体，主要包括 CO₂、CH₄、N₂O、HFCs 等。',
      detail: 'GHG Protocol 将排放分为范围 1（直接）、范围 2（外购能源）、范围 3（价值链）；是 ESG 与环境审核的核心量化对象。',
      related: ['碳足迹'], custom: false },
    { id: 'tg17', term: '供应链', termEn: 'Supply Chain', aliases: ['supply chain'], source: '通用', discipline: '通用', py: 'gong ying lian', pyAbbr: 'gyl',
      definition: '从原材料到成品交付全过程所涉及的所有供应商、分包方与物流环节的集合。',
      detail: '社会责任审核要求对 Tier1 及以上层级供应商实施合规管理、风险评估与可追溯性管控。',
      related: ['可追溯性', '尽职调查'], custom: false },
    { id: 'tg18', term: 'SMETA', termEn: 'Sedex Members Ethical Trade Audit', aliases: ['Sedex', '四支柱审核', 'SMETA 2-Pillar', 'SMETA 4-Pillar'], source: 'SMETA', discipline: '通用', py: 'smeta', pyAbbr: 'smeta',
      definition: 'Sedex 会员道德贸易审核，最常用的共享式社会责任审核方法，结果可在会员间互认。',
      detail: '两大模块（劳工+健康安全）为基础，可选加环境、商业道德构成「四支柱」。审核报告以审计报告（Audit Report）形式上传 Sedex 平台，避免重复审核。',
      related: ['四支柱', '申诉机制'], custom: false },
    { id: 'tg19', term: '四支柱', termEn: 'Four Pillars', aliases: ['4-Pillar', 'four pillars', '环境支柱', '商业道德支柱'], source: 'SMETA', discipline: '通用', py: 'si zhu zhu', pyAbbr: 'szz',
      definition: 'SMETA 审核的完整覆盖范围：劳工标准、健康与安全、环境、商业道德。',
      detail: '2-Pillar 仅含前两项；4-Pillar 增加环境与商业道德。客户验厂常要求 4-Pillar 以覆盖 ESG 全维度。',
      related: ['SMETA', '商业道德', '环境管理体系'], custom: false },
    { id: 'tg20', term: 'SLCP', termEn: 'Social & Labor Convergence Program', aliases: ['社会劳工整合项目', 'Converged Assessment Framework', 'CAF'], source: 'SLCP', discipline: '通用', py: 'slcp', pyAbbr: 'slcp',
      definition: '社会与劳工融合项目，以统一数据集（CAF）替代重复问卷，实现审核结果跨品牌互认。',
      detail: '工厂一次填报 CAF 数据，经验证机构（VB）核查后生成可共享的评估报告，减少多客户重复审核负担。',
      related: ['CAF', '供应链'], custom: false },
    { id: 'tg21', term: 'CAF', termEn: 'Converged Assessment Framework', aliases: ['融合评估框架', 'CAF 数据集'], source: 'SLCP', discipline: '通用', py: 'caf', pyAbbr: 'caf',
      definition: 'SLCP 的核心数据收集工具，标准化社会劳工指标，供工厂自评与验证机构核查。',
      detail: '包含招聘雇佣、工作时间、薪酬福利、员工待遇、员工参与、健康安全、终止雇佣、管理体系等模块，对标主流审核问卷结构。',
      related: ['SLCP'], custom: false },
    { id: 'tg22', term: 'RBA', termEn: 'Responsible Business Alliance', aliases: ['责任商业联盟', 'EICC', 'Electronic Industry Citizenship Coalition'], source: 'RBA', discipline: '通用', py: 'rba', pyAbbr: 'rba',
      definition: '责任商业联盟行为准则（前身为 EICC），电子及多行业广泛采用的社会责任与 ESG 标准。',
      detail: 'RBA 准则覆盖劳工、健康安全、环境、商业道德、管理体系五大板块；配套 VAP 验证审核与 FSQA 资格预审。',
      related: ['VAP', '管理体系'], custom: false },
    { id: 'tg23', term: 'VAP', termEn: 'Validated Assessment Program', aliases: ['验证评估程序', 'RBA VAP', '验证审核'], source: 'RBA', discipline: '通用', py: 'vap', pyAbbr: 'vap',
      definition: 'RBA 的第三方验证审核程序，由 RBA 认可的审核机构执行，结果录入 RBA 平台。',
      detail: '工厂完成自我评估（SAQ）后申请 VAP；审核采用 RBA 准则并给出纠正措施计划（CAP），是多数电子品牌客户的准入门槛。',
      related: ['RBA'], custom: false },
    { id: 'tg24', term: 'WRAP', termEn: 'Worldwide Responsible Accredited Production', aliases: ['环球服装生产社会责任认证', 'WRAP 12 原则'], source: 'WRAP', discipline: '通用', py: 'wrap', pyAbbr: 'wrap',
      definition: '全球服装生产社会责任认证，以 12 项生产原则为核心，广泛应用于服装纺织行业。',
      detail: '认证分白/黄/绿三色证书，有效期最长一年；审核聚焦法律合规、强迫劳动、工时、安全等原则。',
      related: ['12项生产原则'], custom: false },
    { id: 'tg25', term: '12项生产原则', termEn: '12 Principles', aliases: ['生产原则', 'WRAP 原则', '12 principles'], source: 'WRAP', discipline: '通用', py: '12 xiang sheng chan yuan ze', pyAbbr: '12xscyz',
      definition: 'WRAP 认证的 12 条强制性生产原则，涵盖法律合规、禁止强迫/童工、工时、健康安全、环保等。',
      detail: '原则包括：遵守法律、禁止强迫劳动、禁止童工、禁止骚扰虐待、薪酬福利、工时、禁止歧视、健康安全、结社自由、环保、海关合规、反恐安全。',
      related: ['WRAP', '反恐安全'], custom: false },
    { id: 'tg26', term: 'BSCI', termEn: 'Business Social Compliance Initiative', aliases: ['amfori BSCI', '商业社会合规倡议'], source: 'BSCI', discipline: '通用', py: 'bsci', pyAbbr: 'bsci',
      definition: 'amfori 发起的商业社会合规倡议，欧洲零售商广泛采用的社会责任审核标准。',
      detail: '基于 11 项绩效领域（含童工、强迫劳动、薪酬、工时、安全、环境等），审核结果按 A–E 评级，是服装/零售供应链常见准入要求。',
      related: ['供应链'], custom: false },
    { id: 'tg27', term: '零容忍', termEn: 'Zero Tolerance', aliases: ['红线项', 'zero tolerance', '不可接受项'], source: '通用', discipline: '通用', py: 'ling rong ren', pyAbbr: 'lrr',
      definition: '一经发现即判定审核不通过、须立即纠正的严重程度事项。',
      detail: '典型零容忍：童工、强迫劳动、体罚、商业贿赂、重大安全隐患。各客户验厂标准均设零容忍清单，触发即终止合作。',
      related: ['童工', '强迫劳动'], custom: false },
    { id: 'tg28', term: '可追溯性', termEn: 'Traceability', aliases: ['供应链追溯', 'traceability'], source: '通用', discipline: '反恐', py: 'ke zhui su xing', pyAbbr: 'kzsx',
      definition: '能够沿供应链正向或反向追踪产品、物料及其来源与流转过程的能力。',
      detail: '是反恐安全（C-TPAT/GSV/SCAN）与食品安全审核的核心；要求批次管理、单证留存、供应商身份核验，以防范走私与转运风险。',
      related: ['供应链', '反恐安全'], custom: false },
    { id: 'tg29', term: '反恐安全', termEn: 'Supply Chain Security', aliases: ['C-TPAT', 'GSV', 'SCAN', '供应链安全', '反恐'], source: '通用', discipline: '反恐', py: 'fan kong an quan', pyAbbr: 'fkaq',
      definition: '保障货物与供应链在生产、仓储、运输各环节不被篡改、劫持或用于恐怖活动的措施体系。',
      detail: '主流标准：C-TPAT（美海关）、GSV（通用安全验证）、SCAN（供应商合规审核网络）。核查门禁、监控、人员背景、集装箱封条、访客管理等。',
      related: ['可追溯性', '12项生产原则'], custom: false }
  ];
  global.StandardsSeed = StandardsSeed;
})(window);

/* ===== src/js/auditor-guides.js ===== */
/* 审核员指南种子数据 — 四大领域审核员操作手册
 * 参考：APSCA/SLCP/RBA/ICS（社会责任）、ISO9001/ISO14001/IATF16949（质量）、
 *       CTPAT/GSV/SCAN（反恐安全）、FEM/ISO50001（环境）
 * 离线零依赖：拼音字段预计算，无运行时拼音库。
 */
(function (global) {
  'use strict';
  global.AuditorGuides = {
    version: '1.0',
    guides: [
      /* ==================================================================== */
      /* 1. 社会责任审核员指南 */
      /* ==================================================================== */
      {
        id: 'sr',
        title: '社会责任审核员指南',
        titleEn: 'Social Responsibility Auditor Guide',
        version: '2025.01',
        references: ['APSCA', 'SLCP', 'RBA', 'ICS'],
        py: 'shehuizeren shenyenyuan zhinan',
        pyAbbr: 'shzrsyzn',
        chapters: [
          {
            id: 'sr-c1', title: '第一章 童工与未成年工',
            sections: [
              {
                id: 'sr-c1-s1', title: '1.1 童工识别与验证',
                requirements: '依据 ILO C138、RBA 行为准则及 SLCP Step 2 要求：不得雇佣未满 15 周岁（或当地法定就业年龄，以较高者为准）的人员。审核员须核实所有员工年龄证明文件原件，包括身份证、出生证明、户籍登记或政府签发的等效文件。',
                auditPoints: '1) 抽查近 6 个月全部在职员工档案，重点核查年轻面相员工；\n2) 比对工资表人员名单与实际在岗人员，排查未登记的"隐性员工"；\n3) 访谈人力资源负责人，了解年龄验证流程与留档机制；\n4) 现场巡视生产区域，观察是否有未成年人员工；\n5) 检查招工登记表、入职日期与年龄计算是否一致。',
                commonNonConformities: '1) 员工档案仅留存身份证复印件，未核实原件；\n2) 招工登记表年龄字段涂改或与身份证不符；\n3) 工资表人数多于档案人数，存在未登记的临时工；\n4) 未建立年龄验证的标准操作程序（SOP）。',
                remediation: '1) 立即建立年龄验证 SOP，要求入职时核对原件并留存双面复印件；\n2) 对在册员工档案进行全面审查，纠正所有年龄不符项；\n3) 实施电子考勤系统与工资表人员联动，杜绝未登记人员；\n4) 培训人力资源与招聘人员，每季度自查一次。'
              },
              {
                id: 'sr-c1-s2', title: '1.2 未成年工保护措施',
                requirements: '依据 RBA 准则：已满 15 周岁但未满 18 周岁的未成年工，不得安排从事可能危及其健康与安全的工作（含夜班、高空、接触有害物质等），且须提供定期体检。SLCP 要求工厂记录所有未成年工名单并保留体检报告。',
                auditPoints: '1) 获取未成年工名单，核实其岗位安排是否合规；\n2) 检查未成年工体检报告（入职体检+年度体检）；\n3) 查阅排班表，确认未成年工未安排夜班或加班；\n4) 现场确认未成年工工作环境无危险因素；\n5) 访谈未成年工，了解实际工作安排与知情情况。',
                commonNonConformities: '1) 未建立未成年工登记台账；\n2) 未成年工体检缺失或超过 12 个月未复检；\n3) 排班表显示未成年工有夜班安排；\n4) 未成年工岗位涉及化学品操作或高空作业。',
                remediation: '1) 建立未成年工专用登记台账，包含姓名、年龄、岗位、体检日期；\n2) 立即安排未体检或过期未成年工进行体检；\n3) 调整排班系统，系统层面禁止未成年工排夜班；\n4) 将未成年工调离危险岗位，安排至安全岗位。'
              }
            ]
          },
          {
            id: 'sr-c2', title: '第二章 强迫劳动与自由就业',
            sections: [
              {
                id: 'sr-c2-s1', title: '2.1 自由择业与限制离职',
                requirements: '依据 ILO C29/C105 及 RBA 准则：所有工作须为自愿，不得以任何形式限制员工人身自由。禁止扣押身份证件原件、护照或工资。员工有权在提前通知后自由离职，工厂不得设置罚金或扣留工资作为离职条件。',
                auditPoints: '1) 检查员工证件保管记录，确认未扣押身份证/护照原件；\n2) 审查劳动合同中是否有离职罚金条款；\n3) 核查工资发放是否按月足额，有无扣押行为；\n4) 访谈不同部门员工（含新入职与老员工），了解离职流程；\n5) 检查招工费用记录，确认员工未被收取招聘费用。',
                commonNonConformities: '1) 工厂代管员工身份证原件且无领取记录；\n2) 合同约定离职需赔偿培训费但无培训记录；\n3) 试用期工资低于正式工资 80%，且离职扣发最后一个月工资；\n4) 通过劳务派遣公司招聘但未核实派遣公司是否收取工人费用。',
                remediation: '1) 立即退还所有代管证件原件，建立证件自愿保管签收制度；\n2) 修订劳动合同，删除违法离职罚金条款；\n3) 按月足额发放工资，离职时一次性结清；\n4) 审核所有劳务派遣协议，要求派遣公司出具零收费承诺书。'
              },
              {
                id: 'sr-c2-s2', title: '2.2 债务劳动与押金',
                requirements: '依据 RBA 与 ICS 要求：禁止任何形式的债务劳动（debt bondage）。工厂不得要求员工交纳押金、保证金或以其他名义预扣工资。如为员工提供住宿或伙食，费用须合理且不得作为留任条件。',
                auditPoints: '1) 审查入职登记表，检查是否有押金/保证金条款；\n2) 核查工资单扣除项，排查非常规扣款；\n3) 了解住宿/伙食费标准与扣除方式；\n4) 检查劳务费支付链条，确认工厂而非工人承担招聘成本；\n5) 访谈工人了解是否有借贷关系导致被迫留任。',
                commonNonConformities: '1) 入职收取服装费/工牌费/培训费押金；\n2) 住宿费高于市场价且强制居住；\n3) 劳务派遣公司向工人收取中介费，形成债务绑定；\n4) 扣留首月工资作为"稳定金"。',
                remediation: '1) 全额退还所有押金/保证金，修改入职流程取消相关收费；\n2) 住宿费调整为成本价或免费，提供住宿选择权；\n3) 与派遣公司重新谈判，由工厂承担全部招聘费用；\n4) 取消首月扣留做法，补发已扣金额。'
              }
            ]
          },
          {
            id: 'sr-c3', title: '第三章 工作时间与工资福利',
            sections: [
              {
                id: 'sr-c3-s1', title: '3.1 工作时间合规',
                requirements: '依据 RBA 准则与当地劳动法：每周正常工作时间不超过 40 小时（中国为 40 小时/周），加班不超过 12 小时/周，每月总加班不超过 36 小时。须至少保证每 7 天休息 1 天。SLCP Step 2 要求提供近 12 个月完整工时记录。',
                auditPoints: '1) 获取近 12 个月考勤记录（含电子打卡与纸质签到）；\n2) 抽取 2-3 个生产高峰月，逐日核算实际工时；\n3) 比对考勤记录与工资表工时是否一致；\n4) 检查排班表是否保证每 7 天至少 1 天休息；\n5) 确认加班是否经员工书面同意或工会/职工代表协商。',
                commonNonConformities: '1) 高峰月周加班超过 12 小时，月加班超过 36 小时；\n2) 考勤记录与工资表工时不一致，存在"阴阳考勤"；\n3) 连续工作超过 13 天无休息日；\n4) 加班未经员工同意，强制安排加班；\n5) 考勤记录不完整或缺失多月。',
                remediation: '1) 优化排班系统，设置加班上限自动预警（月 36 小时）；\n2) 实施单一电子考勤系统，消除纸质与电子双轨制；\n3) 建立加班审批制度，保留员工书面同意记录；\n4) 与客户协商订单交期，合理分配产能避免集中赶工；\n5) 补齐缺失月份考勤记录，保留至少 24 个月。'
              },
              {
                id: 'sr-c3-s2', title: '3.2 工资与福利',
                requirements: '依据 ILO C131 及当地最低工资法规：支付工资不得低于当地最低工资标准。加班工资须按法定倍率支付（平日 1.5 倍、休息日 2 倍、法定节假日 3 倍）。须依法缴纳社会保险与住房公积金，提供工资条。',
                auditPoints: '1) 获取近 12 个月工资表，核算时薪是否达标最低工资；\n2) 抽查加班工资计算，验证倍率是否正确；\n3) 检查社保/公积金缴纳凭证与参保人员名单；\n4) 确认工资条发放方式与员工签收记录；\n5) 核查试用期工资、停工工资、离职结算是否符合法规。',
                commonNonConformities: '1) 以计件工资为名规避最低工资保障；\n2) 加班工资统一按 1.5 倍计算，未区分休息日与节假日；\n3) 社保参保人数远少于实际在职人数；\n4) 未提供工资条或工资条无明细；\n5) 离职时未一次性结清工资。',
                remediation: '1) 实行底薪+计件双轨制，保底不低于最低工资；\n2) 更新薪酬系统加班费计算模块，自动区分倍率；\n3) 为全体员工依法参保，补缴历史欠缴部分；\n4) 推行电子工资条，保留签收记录至少 24 个月；\n5) 制定离职结算 SOP，确保当日或次月发薪日结清。'
              }
            ]
          },
          {
            id: 'sr-c4', title: '第四章 职业健康与安全',
            sections: [
              {
                id: 'sr-c4-s1', title: '4.1 安全生产条件',
                requirements: '依据 ISO 45001 与 RBA 要求：工厂须提供安全的工作环境，识别并控制职业危害。包括但不限于：配备 PPE（个人防护装备）、设置安全警示标识、保持紧急出口畅通、定期进行消防演习、提供安全培训。',
                auditPoints: '1) 现场巡视生产区域，检查 PPE 佩戴与配备情况；\n2) 测试紧急出口是否畅通，标识是否清晰可见；\n3) 检查消防设施（灭火器、消火栓、烟感器）有效期与检查记录；\n4) 查阅消防演习记录（至少每年 2 次）与培训签到表；\n5) 核查特种设备（叉车、电梯、压力容器）定期检验报告。',
                commonNonConformities: '1) 噪音区域员工未佩戴耳塞；\n2) 紧急出口被货物堵塞或上锁；\n3) 灭火器过期未更换，月度检查记录缺失；\n4) 消防演习仅 1 次/年且无员工签到记录；\n5) 叉车操作员无特种设备作业证。',
                remediation: '1) 配齐 PPE 并实施佩戴检查制度，违规者书面警告；\n2) 清理所有紧急出口障碍物，安装推杆锁替代挂锁；\n3) 更换过期灭火器，建立月度检查台账；\n4) 每半年组织全厂消防演习，签到表归档保存；\n5) 安排无证人员参加培训取证，持证方可上岗。'
              }
              /* 省略更多小节以保持文件可维护，结构完整可扩展 */
            ]
          }
        ]
      },

      /* ==================================================================== */
      /* 2. 质量审核员指南 */
      /* ==================================================================== */
      {
        id: 'qm',
        title: '质量审核员指南',
        titleEn: 'Quality Management Auditor Guide',
        version: '2025.01',
        references: ['ISO 9001:2015', 'ISO 14001:2015', 'IATF 16949:2016'],
        py: 'zhiliang shenyenyuan zhinan',
        pyAbbr: 'zlsyzn',
        chapters: [
          {
            id: 'qm-c1', title: '第一章 质量管理体系要求',
            sections: [
              {
                id: 'qm-c1-s1', title: '1.1 质量手册与文件控制',
                requirements: '依据 ISO 9001:2015 第 7.5 条款：组织须建立并保持成文信息，包括质量方针、质量目标、质量手册（如适用）、程序文件与记录。文件须经授权人审批，定期评审更新，确保使用处获得有效版本。作废文件须及时撤回或标识。',
                auditPoints: '1) 审查质量手册的审批、发布、修订记录；\n2) 抽查 3-5 份程序文件，核实版本控制与发放记录；\n3) 现场检查作业指导书是否为最新有效版本；\n4) 检查作废文件回收记录与标识；\n5) 核实电子文档管理系统权限设置与版本追溯能力。',
                commonNonConformities: '1) 质量手册未经最高管理者审批签字；\n2) 现场使用过期作业指导书，新版本未发放到位；\n3) 作废文件未回收，仍存放在工作现场；\n4) 文件修订未记录修订内容与原因；\n5) 电子文档无版本控制，多人可随意修改。',
                remediation: '1) 建立文件控制程序，明确审批、发布、回收流程；\n2) 实施文档管理软件，自动版本控制与权限管理；\n3) 每季度进行一次文件清查，清理过期文件；\n4) 培训文件管理员与使用人员，确保知晓最新版本获取方式；\n5) 建立文件修订申请单制度，记录修订原因与影响评估。'
              },
              {
                id: 'qm-c1-s2', title: '1.2 管理评审与内部审核',
                requirements: '依据 ISO 9001:2015 第 9 条款：最高管理者须按策划时间间隔（至少每年 1 次）进行管理评审，评审输入包括审核结果、客户反馈、过程绩效与产品符合性、纠正措施状态。组织须每年至少进行 1 次覆盖所有体系的内部审核。',
                auditPoints: '1) 查阅管理评审计划与会议纪要，核实输入输出完整性；\n2) 检查管理评审输出是否包含改进决策与资源需求；\n3) 审查内审计划是否覆盖全部条款与所有部门；\n4) 核实内审员资质与独立性（不得审核自身工作）；\n5) 抽查内审不符合项的纠正措施记录与验证关闭。',
                commonNonConformities: '1) 管理评审输入缺失客户满意度或纠正措施状态；\n2) 管理评审无输出决策或输出未跟踪落实；\n3) 内审计划未覆盖全部部门或条款；\n4) 内审员审核自身部门工作；\n5) 不符合项纠正措施仅"已培训"无根本原因分析。',
                remediation: '1) 制定管理评审检查清单，确保输入输出完整；\n2) 管理评审输出转为年度改进计划，逐项跟踪关闭；\n3) 编制滚动内审计划，确保 12 个月内全覆盖；\n4) 培养多名内审员，实行交叉审核机制；\n5) 纠正措施须包含 5Why 或鱼骨图分析，跟踪验证有效性。'
              }
            ]
          },
          {
            id: 'qm-c2', title: '第二章 过程方法与风险管理',
            sections: [
              {
                id: 'qm-c2-s1', title: '2.1 过程识别与乌龟图分析',
                requirements: '依据 ISO 9001:2015 第 4.4 条款及 IATF 16949 要求：组织须采用过程方法，识别质量管理所需过程及其顺序和相互作用。IATF 16949 要求对所有质量过程进行乌龟图（Turtle Diagram）分析，明确输入、输出、资源、责任者、方法、指标。',
                auditPoints: '1) 获取过程清单与过程关系图（流程图）；\n2) 抽查 2-3 个关键过程的乌龟图，核实要素完整性；\n3) 确认每个过程有明确的绩效指标（KPI）与目标值；\n4) 检查过程所有者职责是否落实到具体人员；\n5) 核实过程绩效数据是否定期收集并用于改进。',
                commonNonConformities: '1) 过程清单未涵盖外包过程或支持性过程；\n2) 乌龟图缺少绩效指标或指标无目标值；\n3) 过程所有者不明确或无实际管理行为；\n4) 过程绩效数据未收集或未用于管理评审；\n5) 未对外包过程实施控制（如供应商绩效监控）。',
                remediation: '1) 全面梳理过程清单，纳入外包与支持过程；\n2) 为每个过程绘制乌龟图，明确 6 要素与 KPI；\n3) 任命过程所有者，纳入绩效考核；\n4) 建立月度过程绩效看板，数据输入管理评审；\n5) 制定外包过程控制程序，纳入供应商绩效评价。'
              },
              {
                id: 'qm-c2-s2', title: '2.2 风险与机遇管理',
                requirements: '依据 ISO 9001:2015 第 6.1 条款：组织须确定影响质量目标实现的风险与机遇，制定应对措施。IATF 16949 补充要求使用 FMEA（失效模式与影响分析）作为风险分析工具，覆盖产品设计过程与制造过程。',
                auditPoints: '1) 检查风险与机遇登记表，核实识别范围与方法；\n2) 审查应对措施的落实情况与有效性评价；\n3) 抽查 DFMEA 与 PFMEA，核实评分逻辑与措施跟踪；\n4) 确认风险评审频率与管理评审联动；\n5) 核实风险识别是否覆盖供应链中断、法规变更等外部因素。',
                commonNonConformities: '1) 风险登记表为一次性文件，未定期更新；\n2) 应对措施仅"加强监控"无具体行动与截止日；\n3) FMEA 评分（RPN）无评判标准或严重度打分一致；\n4) 风险管理仅在管理评审中提及，无日常运作；\n5) 未识别供应链单一来源或法规变更风险。',
                remediation: '1) 建立季度风险评审机制，更新登记表与措施状态；\n2) 应对措施须 SMART 化（具体/可衡量/可实现/相关/有时限）；\n3) 制定 FMEA 评分基准表，跨部门评审确保一致性；\n4) 将风险管理融入日常项目评审与分层审核；\n5) 建立外部风险监控清单（供应链/法规/市场），月度更新。'
              }
            ]
          },
          {
            id: 'qm-c3', title: '第三章 采购与供应商管理',
            sections: [
              {
                id: 'qm-c3-s1', title: '3.1 供应商选择与评价',
                requirements: '依据 ISO 9001:2015 第 8.4 条款及 IATF 16949 8.4.1：组织须建立供应商选择与评价准则，基于供应商绩效与质量管理体系能力进行选择。IATF 16949 要求对供应商实施分级管理，并保持认可供应商清单（AVL）。',
                auditPoints: '1) 审查供应商选择标准与评价记录；\n2) 核实认可供应商清单（AVL）与实际采购供应商一致；\n3) 检查供应商绩效评价记录（质量/交期/服务）；\n4) 确认对不合格供应商的处置措施（整改/降级/淘汰）；\n5) 核查新供应商引入流程是否包含现场审核或问卷评审。',
                commonNonConformities: '1) 供应商评价无量化标准，仅主观打分；\n2) AVL 未更新，实际采购供应商不在清单中；\n3) 供应商绩效评价仅看交期，未评估质量指标；\n4) 连续不合格供应商未采取淘汰措施；\n5) 新供应商引入仅看报价，无质量体系审核。',
                remediation: '1) 建立量化供应商评价矩阵（质量40%/交期30%/价格20%/服务10%）；\n2) AVL 季度更新，与 ERP 系统联动锁定非 AVL 采购；\n3) 绩效评价包含 PPM（百万分之缺陷率）与 OTD（准时交货率）；\n4) 制定供应商分级（A/B/C/D），D 级强制淘汰；\n5) 新供应商须通过质量体系问卷+现场审核方可列入 AVL。'
              }
            ]
          },
          {
            id: 'qm-c4', title: '第四章 生产与服务提供控制',
            sections: [
              {
                id: 'qm-c4-s1', title: '4.1 过程控制与首末件检验',
                requirements: '依据 ISO 9001:2015 第 8.5 条款及 IATF 16949 8.5.1：生产过程须在受控条件下进行，包括作业指导书、过程监控、设备维护。IATF 16949 要求实施首末件检验（FAI/LAI），确认首件合格后方可批量生产。',
                auditPoints: '1) 检查各工位作业指导书是否到位且为最新版本；\n2) 核实首末件检验记录，确认检验项目与图纸要求一致；\n3) 检查过程参数监控记录（温度/压力/时间等关键参数）；\n4) 审查设备预防性维护计划与执行记录；\n5) 确认不合格品的标识、隔离与处置流程。',
                commonNonConformities: '1) 作业指导书未悬挂在工位或内容与实际操作不符；\n2) 首件检验项目缺漏关键尺寸或性能参数；\n3) 过程参数无记录或记录间隔超 4 小时；\n4) 设备维护仅"故障后维修"，无预防性维护计划；\n5) 不合格品未标识或未隔离，混入合格品区域。',
                remediation: '1) 作业指导书采用图文并茂格式，悬挂于工位可视区域；\n2) 编制首末件检验检查表，逐项对照图纸要求打勾确认；\n3) 关键参数自动采集或每 2 小时记录，超差自动报警；\n4) 建立预防性维护计划（PM），每月跟踪完成率；\n5) 设置红色不合格品区，标识卡含日期/数量/原因/处置。'
              }
            ]
          }
        ]
      },

      /* ==================================================================== */
      /* 3. 反恐安全审核员指南 */
      /* ==================================================================== */
      {
        id: 'sc',
        title: '反恐安全审核员指南',
        titleEn: 'Supply Chain Security Auditor Guide',
        version: '2025.01',
        references: ['CTPAT', 'GSV', 'SCAN'],
        py: 'fankong anquan shenyenyuan zhinan',
        pyAbbr: 'fkasyzn',
        chapters: [
          {
            id: 'sc-c1', title: '第一章 安全管理与程序控制',
            sections: [
              {
                id: 'sc-c1-s1', title: '1.1 安全管理制度建设',
                requirements: '依据 CTPAT 最小安全标准与 GSV 要求：企业须指定一名安全负责人（Security Officer），建立书面的供应链安全程序，涵盖物理安全、人员安全、集装箱安全、程序安全、信息技术安全等模块。安全程序须经管理层批准并每年评审更新。',
                auditPoints: '1) 确认安全负责人任命文件与职责描述；\n2) 审查供应链安全程序手册的完整性与审批记录；\n3) 检查年度安全评审记录与改进行动跟踪；\n4) 核实安全程序的培训覆盖范围与签到记录；\n5) 确认安全事件汇报流程与应急响应预案。',
                commonNonConformities: '1) 安全负责人为兼职且无明确职责描述；\n2) 安全程序仅笼统描述，无具体操作标准；\n3) 未进行年度评审或评审无改进输出；\n4) 安全培训仅对新员工，老员工未复训；\n5) 无安全事件分级汇报机制。',
                remediation: '1) 正式任命专职/兼职安全负责人，发布职责描述书；\n2) 安全程序细化到各模块 SOP，含检查频率与记录要求；\n3) 每年至少 1 次安全评审，输出改进计划并跟踪；\n4) 全员安全培训每年复训 1 次，签到归档；\n5) 建立安全事件 3 级分类与 2 小时内上报机制。'
              },
              {
                id: 'sc-c1-s2', title: '1.2 来访人员与车辆管理',
                requirements: '依据 CTPAT 与 GSV 标准：所有来访人员（含供应商、客户、访客）须进行身份核验与登记，发放访客证并全程陪同。来访车辆须在指定区域停放，货车须核验司机身份与运输文件后方可进入装卸区。',
                auditPoints: '1) 检查访客登记表，核实身份证件核验与签发访客证流程；\n2) 现场观察访客是否全程佩戴访客证且有陪同人员；\n3) 审查货车司机身份核验记录（驾驶证+运输单据）；\n4) 检查停车场分区管理（来访车辆与货车分离）；\n5) 确认拍照/录像区域是否标识禁止。',
                commonNonConformities: '1) 访客登记表仅填写姓名，未核验身份证件；\n2) 访客在厂区内无人陪同自由活动；\n3) 货车司机身份仅看运输单据，未核验驾驶证原件；\n4) 来访车辆与货车混停，无分区；\n5) 未标识禁止拍照区域。',
                remediation: '1) 访客登记须复印/扫描身份证件，留存有效期内的访客证；\n2) 访客须由接待人全程陪同，离场时交回访客证；\n3) 货车入场须核验驾驶证原件+运输委托书+车牌比对；\n4) 设置物理隔离分区，货车专用通道与来访车辆分离；\n5) 在敏感区域（仓库/装卸台/数据中心）张贴禁止拍照标识。'
              }
            ]
          },
          {
            id: 'sc-c2', title: '第二章 集装箱与货物安全',
            sections: [
              {
                id: 'sc-c2-s1', title: '2.1 集装箱七点检查与施封',
                requirements: '依据 CTPAT 与 GSV 标准：每次装箱前须对集装箱执行七点检查（前壁/侧壁/顶板/底板/门板/外部/内部），确认无破损、无暗格、无异物。集装箱须使用符合 ISO 17712 的高安全封条，封条号须记录在运输单据上。',
                auditPoints: '1) 检查集装箱七点检查表，核实是否有检查人员签字与日期；\n2) 现场观察一次装箱前检查全过程，核实检查方法；\n3) 检查封条是否符合 ISO 17712（高安全封条）；\n4) 核实封条号是否记录在提单/装箱单上且与实际一致；\n5) 确认封条保管制度（谁保管、谁施封、领用记录）。',
                commonNonConformities: '1) 七点检查表仅打勾无具体描述，检查人未签字；\n2) 检查方法不当（未用手电筒照射内部、未敲击侧壁）；\n3) 使用普通铁丝封条而非 ISO 17712 高安全封条；\n4) 封条号未记录在运输单据或与实际不符；\n5) 封条随意放置在办公室抽屉，无领用记录。',
                remediation: '1) 七点检查表细化每项检查方法与判定标准，检查人签字确认；\n2) 培训检查人员，配备手电筒/锤击工具，现场示范标准流程；\n3) 采购 ISO 17712 认证的高安全封条，保留供应商资质证明；\n4) 封条号在装箱单、提单、系统三处记录，装车前三方核对；\n5) 封条存放在带锁专用柜，领用登记与使用记录一一对应。'
              },
              {
                id: 'sc-c2-s2', title: '2.2 货物存储与异常处理',
                requirements: '依据 GSV 与 SCAN 标准：货物存储区域须有物理隔离与访问控制，成品仓与原料仓分离。出库须遵循先进先出（FIFO）或批次追溯原则。发现货物短缺、多余或异常须立即启动调查程序并上报。',
                auditPoints: '1) 检查仓库区域物理隔离措施（围墙/门禁/摄像头）；\n2) 核实仓库访问控制（仅授权人员可进入）；\n3) 审查出库记录与 FIFO/批次追溯执行情况；\n4) 检查货物异常报告与调查记录；\n5) 确认仓库监控录像保存期限（至少 30 天）。',
                commonNonConformities: '1) 成品仓与原料仓无物理隔离；\n2) 仓库门常开，非授权人员可自由进出；\n3) 出库无批次记录，无法追溯先进先出；\n4) 货物短缺仅口头报告，无书面调查记录；\n5) 监控录像仅保存 7 天即覆盖。',
                remediation: '1) 建立实体隔墙与标线分区，成品仓设独立门禁；\n2) 实施刷卡/指纹门禁，授权名单月度审核更新；\n3) ERP 系统启用批次管理模块，系统提示 FIFO 出库；\n4) 建立货物异常报告单，24 小时内启动调查并书面记录；\n5) 配置 NVR 存储设备，确保录像保存不少于 45 天。'
              }
            ]
          },
          {
            id: 'sc-c3', title: '第三章 物理安全与门禁控制',
            sections: [
              {
                id: 'sc-c3-s1', title: '3.1 周界安防与照明',
                requirements: '依据 CTPAT 与 GSV 标准：工厂周界须设置不低于 2 米的围墙或围栏，围墙无破损与攀爬点。厂区照明须覆盖周界、停车场、装卸区与仓库出入口，照度不低于 10 勒克斯。围墙内侧须设置巡逻通道。',
                auditPoints: '1) 现场巡视围墙完整性，检查高度与破损情况；\n2) 夜间巡视照明覆盖范围与照度（使用照度计测量）；\n3) 检查巡逻通道是否畅通无障碍物；\n4) 审查保安巡逻记录（每班至少 1 次周界巡逻）；\n5) 确认围墙外无堆放物或可攀爬物。',
                commonNonConformities: '1) 围墙局部破损未修补或高度不足 2 米；\n2) 装卸区照明不足，存在照明死角；\n3) 巡逻通道被杂物堵塞；\n4) 保安巡逻记录仅签到无路线与时间；\n5) 围墙外堆放托盘或垃圾桶可作为攀爬辅助。',
                remediation: '1) 修补围墙破损，确保全段不低于 2 米，顶部加装防爬刺；\n2) 增设 LED 照明灯具，消除死角，照度达标 10 勒克斯以上；\n3) 清理巡逻通道，设置巡逻打卡点（每 50 米 1 个）；\n4) 保安巡逻记录含路线、打卡时间与异常备注；\n5) 围墙外 3 米范围内禁止堆放任何物品。'
              }
            ]
          },
          {
            id: 'sc-c4', title: '第四章 人员安全与培训',
            sections: [
              {
                id: 'sc-c4-s1', title: '4.1 员工背景调查与离职管理',
                requirements: '依据 CTPAT 与 SCAN 标准：新员工入职前须进行背景调查（含身份核实、无犯罪记录查询、学历/工作经历核实）。员工离职时须立即收回门禁卡、钥匙、工牌等访问凭证，并注销系统账号。离职面谈须记录离职原因。',
                auditPoints: '1) 抽查 5-10 名新员工档案，核实背景调查记录；\n2) 检查背景调查内容是否涵盖身份、犯罪记录、学历；\n3) 审查离职员工凭证收回记录与系统账号注销记录；\n4) 确认离职后门禁是否立即失效（非延迟失效）；\n5) 检查离职面谈记录的完整性与分析。',
                commonNonConformities: '1) 背景调查仅核实身份证，未查询犯罪记录；\n2) 学历/工作经历未核实，仅员工自行填写；\n3) 离职员工门禁卡未收回或系统账号未注销；\n4) 门禁权限在离职后仍有效超过 24 小时；\n5) 无离职面谈或面谈记录仅"个人原因"无详情。',
                remediation: '1) 入职前完成身份证核验+公安系统犯罪记录查询+学历验证；\n2) 工作经历须电话核实前雇主，记录核实人与结果；\n3) 离职当日收回所有物理凭证并注销系统账号；\n4) 门禁系统设置离职日自动失效规则；\n5) 离职面谈使用结构化问卷，数据按月分析趋势。'
              }
            ]
          }
        ]
      },

      /* ==================================================================== */
      /* 4. 环境审核员指南 */
      /* ==================================================================== */
      {
        id: 'env',
        title: '环境审核员指南',
        titleEn: 'Environmental Auditor Guide',
        version: '2025.01',
        references: ['FEM (Higg)', 'ISO 50001:2018', 'ISO 14001:2015'],
        py: 'huanjing shenyenyuan zhinan',
        pyAbbr: 'hjsyzn',
        chapters: [
          {
            id: 'env-c1', title: '第一章 环境管理体系',
            sections: [
              {
                id: 'env-c1-s1', title: '1.1 环境方针与合规义务',
                requirements: '依据 ISO 14001:2015 第 5.2/9.1.2 条款：组织须制定环境方针，承诺保护环境、履行合规义务、持续改进。须建立合规义务识别与评价流程，定期获取并更新适用的环境法律法规，形成合规义务登记表。',
                auditPoints: '1) 审查环境方针的制定、发布与全员传达记录；\n2) 检查合规义务登记表，核实法规识别范围与更新频率；\n3) 确认合规评价记录（至少每年 1 次）与不符合项整改；\n4) 核实法规获取渠道（政府网站/法规服务平台/第三方）；\n5) 检查环保许可与批复文件的完整性与有效性。',
                commonNonConformities: '1) 环境方针仅挂在墙上，员工不知晓内容；\n2) 合规义务登记表为一次性文件，未更新新法规；\n3) 合规评价仅打勾无具体评价依据与结论；\n4) 法规获取渠道单一，遗漏行业或地方标准；\n5) 排污许可证过期未续或实际排放与许可范围不符。',
                remediation: '1) 环境方针在入职培训与年度复训中讲解，随机抽查员工知晓率；\n2) 每季度更新合规义务登记表，新增法规标注影响评估；\n3) 合规评价逐条列出评价依据（监测报告/检查记录）与结论；\n4) 订阅 2 个以上法规服务平台，建立月度法规动态简报；\n5) 排污许可证提前 6 个月启动续证，排放变更及时变更许可。'
              },
              {
                id: 'env-c1-s2', title: '1.2 环境因素识别与重要环境因素管控',
                requirements: '依据 ISO 14001:2015 第 6.1.2 条款：组织须建立环境因素识别与评价程序，覆盖所有活动/产品/服务中的环境因素（正常/异常/紧急三种状态），评价出重要环境因素并制定管控措施。',
                auditPoints: '1) 审查环境因素识别表，核实覆盖范围（全部区域/工序）；\n2) 检查评价方法（是非判断法/多因子评分法）的合理性；\n3) 确认重要环境因素清单与管控措施的对应关系；\n4) 核实环境因素识别是否考虑生命周期视角（原材料/废弃物）；\n5) 检查环境因素的更新频率（工艺变更/新设备时更新）。',
                commonNonConformities: '1) 环境因素仅识别正常状态，未考虑异常与紧急状态；\n2) 评价方法无评判标准，所有人打分一致；\n3) 重要环境因素清单与管控措施脱节，无操作规定；\n4) 未考虑原材料采购与产品使用阶段的环境影响；\n5) 新增产线或设备后未更新环境因素识别。',
                remediation: '1) 识别表增加异常与紧急状态列，覆盖泄漏/火灾/停电场景；\n2) 制定评价基准表（发生频率/影响程度/发现可能性），跨部门评审；\n3) 每个重要环境因素编制管控 SOP，明确操作标准与监测频率；\n4) 引入生命周期视角，增加原材料与废弃阶段环境因素识别；\n5) 工程变更通知（ECN）流程中增加环境因素更新触发项。'
              }
            ]
          },
          {
            id: 'env-c2', title: '第二章 能源管理与温室气体',
            sections: [
              {
                id: 'env-c2-s1', title: '2.1 能源基准与能源绩效指标',
                requirements: '依据 ISO 50001:2018 第 6.3/6.4/6.6 条款：组织须建立能源基准（EnB），使用能源绩效指标（EnPI）量化能源绩效。须识别主要能源使用（SEU）并设定能源目标与指标。FEM 要求报告年度能源消耗与单位产品能耗。',
                auditPoints: '1) 审查能源基准建立方法与数据来源（至少 12 个月数据）；\n2) 检查 EnPI 计算方法与目标值设定依据；\n3) 确认 SEU 识别清单（如空压机/锅炉/制冷/照明）与管控措施；\n4) 核实能源计量器具配置与校准记录；\n5) 检查能源评审报告与改进机会清单。',
                commonNonConformities: '1) 能源基准仅用年度总量，未考虑产量/气温等变量；\n2) EnPI 仅一个（综合能耗），未针对 SEU 设定分项指标；\n3) SEU 识别遗漏主要耗能设备（如制冷系统）；\n4) 能源计量仅总表，分车间/分设备无独立计量；\n5) 能源评审为一次性，无定期复评机制。',
                remediation: '1) 使用回归分析建立能源基准，纳入产量/度日数变量；\n2) 为每个 SEU 设定 EnPI（如 kWh/吨产品），目标逐年下降；\n3) SEU 清单含设备清单+功率+年运行小时+占比，每年复评；\n4) 分级计量：总表+车间表+重点设备表，校准周期 12 个月；\n5) 能源评审每 3 年全面复评，每年更新数据与改进项。'
              },
              {
                id: 'env-c2-s2', title: '2.2 温室气体盘查与减排',
                requirements: '依据 FEM 与 GHG Protocol：工厂须进行温室气体盘查，覆盖 Scope 1（直接排放）与 Scope 2（外购电力间接排放），鼓励盘查 Scope 3。须设定减排目标并制定减排行动计划，建议设定科学碳目标（SBTi）。',
                auditPoints: '1) 审查温室气体盘查报告，核实排放源识别完整性；\n2) 检查排放因子来源与计算方法的合理性；\n3) 确认 Scope 1+2 排放量与能源消耗数据的交叉验证；\n4) 审查减排目标设定依据与行动计划可行性；\n5) 核实减排措施实施进展与年度复盘记录。',
                commonNonConformities: '1) Scope 1 仅盘查燃料燃烧，遗漏制冷剂逸散排放；\n2) 排放因子使用过时或来源不明（非 IPCC/国家清单）；\n3) Scope 2 排放量与电费单消耗量不匹配；\n4) 减排目标无基准年与时间表，仅"争取减少"；\n5) 减排措施仅"更换 LED 灯"无系统性方案。',
                remediation: '1) Scope 1 增加制冷剂充注记录盘查，计算 GWP 逸散排放；\n2) 排放因子使用最新 IPCC 或国家清单值，注明版本与来源；\n3) 交叉验证：电费单×排放因子 vs 盘查 Scope 2 排放量，偏差<2%；\n4) 设定基准年排放量+绝对减排目标（如 2030 年较基准年减 30%）；\n5) 制定分阶段减排路线图（能效提升/可再生能源/绿电采购）。'
              }
            ]
          },
          {
            id: 'env-c3', title: '第三章 水资源与废弃物管理',
            sections: [
              {
                id: 'env-c3-s1', title: '3.1 水资源管理与节水',
                requirements: '依据 FEM 与 ISO 14001：工厂须建立水管理程序，监测取水量与排水量，识别节水机会。废水排放须符合排放标准并取得排污许可。FEM 要求报告年度取水量与单位产品耗水。',
                auditPoints: '1) 检查取水计量器具配置与记录（自来水/地下水/再生水）；\n2) 审查废水监测报告（COD/BOD/SS/氨氮等），核实达标排放；\n3) 检查废水处理设施运行记录与药剂投加记录；\n4) 确认节水措施清单与节水效果量化数据；\n5) 核实雨污分流系统完整性。',
                commonNonConformities: '1) 取水仅总表，分车间/分用途无独立计量；\n2) 废水监测频率低于法规要求或项目不全；\n3) 废水处理设施药剂投加仅"适量"无精确计量；\n4) 节水措施仅"加强管理"无具体工程改造；\n5) 雨污未分流，雨季废水溢流。',
                remediation: '1) 分级安装水表（总表+车间表+重点设备表），月度抄表分析；\n2) 按法规要求频率委托第三方监测，报告项目全覆盖；\n3) 药剂投加使用计量泵，记录投加量与处理水量比值；\n4) 实施节水改造（中水回用/冷却塔循环水优化/节水器具）；\n5) 全面排查雨污管网，修复错接漏接，雨季前完成。'
              },
              {
                id: 'env-c3-s2', title: '3.2 危险废弃物管理',
                requirements: '依据 ISO 14001 与当地固废法规：危险废弃物须分类收集、标识、存储于专用危废仓，交由有资质的处置单位处理，执行联单制度。危废仓须满足防渗/防泄漏/防雨要求，设置应急收集物资。',
                auditPoints: '1) 检查危废仓建设标准（防渗地面/围堰/通风/标识）；\n2) 审查危废产生台账与转移联单记录的完整性；\n3) 核实处置单位资质与经营许可证范围；\n4) 检查危废标识标签内容（名称/类别/日期/重量）；\n5) 确认应急收集物资（吸油棉/沙袋/应急桶）配置。',
                commonNonConformities: '1) 危废仓地面无防渗层或围堰容积不足；\n2) 危废台账记录不完整，转移联单缺失多批；\n3) 处置单位资质过期或超范围经营；\n4) 危废桶无标识或标识信息不全；\n5) 无应急收集物资或物资过期。',
                remediation: '1) 危废仓地面铺设 HDPE 防渗膜，围堰容积≥最大容器容积的 110%；\n2) 建立电子台账系统，联单扫描存档，每月核对；\n3) 每年审查处置单位资质，留存许可证复印件与范围页；\n4) 统一危废标签模板，入场即贴标签，填写完整；\n5) 配置应急物资柜，每季度检查有效期并补充。'
              }
            ]
          },
          {
            id: 'env-c4', title: '第四章 环境合规与许可',
            sections: [
              {
                id: 'env-c4-s1', title: '4.1 环评批复与三同时验收',
                requirements: '依据中国《环境影响评价法》与"三同时"管理制度：新建/改建/扩建项目须编制环境影响评价报告（报告书/报告表/登记表），取得环保部门批复。环保设施须与主体工程同时设计、同时施工、同时投入使用，并完成竣工验收。',
                auditPoints: '1) 审查项目环评批复文件与批复条件落实情况；\n2) 检查"三同时"竣工验收报告与环保部门验收意见；\n3) 核实实际建设内容与环评批复内容的一致性；\n4) 检查后续改扩建项目是否补办环评手续；\n5) 确认环评批复中的防护距离要求是否落实。',
                commonNonConformities: '1) 环评批复要求的措施未全部落实（如未建事故应急池）；\n2) 未完成"三同时"竣工验收即投入正式生产；\n3) 实际产能/工艺与环评批复不符（超产能/改工艺）；\n4) 扩建项目未补办环评即开工；\n5) 防护距离内有新增敏感建筑。',
                remediation: '1) 逐条梳理环评批复条件，制定落实计划并跟踪完成；\n2) 立即启动"三同时"竣工验收程序，补办验收手续；\n3) 产能/工艺变更前先做环评变更评估，取得批复后执行；\n4) 建立"环评先行"原则，改扩建项目无环评批复不开工；\n5) 防护距离内禁止新建居住/医疗/教育等敏感建筑。'
              }
            ]
          }
        ]
      }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ===== src/js/storage.js ===== */
/* 统一存储驱动层：pluggable storage backend
 *  - http 模式（默认，需 Node 轻量后端）：主状态存 data/kv/main.json，
 *    附件/版本/文档/用户以独立文件落盘（data/blobs/<ns>/<id>.json），
 *    二进制 Blob 以 dataURL 内嵌，满足「零数据库 + 用户数据自主可控」。
 *  - idb 模式（纯前端 file:// 降级）：复用 IndexedDB 语义，作为离线兜底。
 *  所有外部能力（fetch / indexedDB / showDirectoryPicker / serviceWorker）均做能力守卫。
 */
(function (global) {
  const Storage = {
    mode: 'idb',
    dataDir: '',
    inited: false,
    supports: { fsaccess: false, idb: false, sw: false, secure: false }
  };

  // ---------------- 能力探测 ----------------
  function detectCaps() {
    Storage.supports.fsaccess = (typeof global.showDirectoryPicker === 'function');
    Storage.supports.idb = ('indexedDB' in global) && !!global.indexedDB;
    Storage.supports.sw = ('serviceWorker' in navigator);
    Storage.supports.secure = !!global.isSecureContext;
  }

  // ---------------- 二进制 <-> dataURL ----------------
  function isBlobLike(b) {
    if (!b || typeof b !== 'object') return false;
    const BlobCtor = global.Blob;
    const FileCtor = global.File;
    if (typeof BlobCtor === 'function' && b instanceof BlobCtor) return true;
    if (typeof FileCtor === 'function' && b instanceof FileCtor) return true;
    return Object.prototype.toString.call(b) === '[object Blob]' || Object.prototype.toString.call(b) === '[object File]';
  }
  function blobToDataURL(blob) {
    return new Promise((resolve) => {
      if (typeof FileReader === 'undefined' || !isBlobLike(blob)) { resolve(blob); return; }
      try {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => { console.warn('blobToDataURL 读取失败'); resolve(null); };
        r.readAsDataURL(blob);
      } catch (e) { resolve(null); }
    });
  }
  function dataURLToBlob(dataURL) {
    if (typeof dataURL !== 'string' || dataURL.indexOf('data:') !== 0) return dataURL;
    try {
      const m = dataURL.match(/^data:(.*?);base64,(.*)$/);
      if (!m) return null;
      const mime = m[1] || 'application/octet-stream';
      const bin = atob(m[2]);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime });
    } catch (e) { console.warn('dataURLToBlob 解析失败', e); return null; }
  }
  function isBlobMarker(v) { return v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, '__blob__'); }
  async function deepConvert(node, toDataURL) {
    if (Array.isArray(node)) return Promise.all(node.map((x) => deepConvert(x, toDataURL)));
    if (node && typeof node === 'object') {
      if (isBlobLike(node)) return toDataURL ? { __blob__: await blobToDataURL(node) } : dataURLToBlob(node.__blob__ || '');
      if (isBlobMarker(node)) return toDataURL ? node : dataURLToBlob(node.__blob__);
      const out = {};
      const keys = Object.keys(node);
      await Promise.all(keys.map(async (k) => { out[k] = await deepConvert(node[k], toDataURL); }));
      return out;
    }
    return node;
  }

  // ---------------- HTTP 后端 ----------------
  function enc(s) { return encodeURIComponent(String(s == null ? '' : s)); }
  const API_TOKEN_KEY = 'iar_api_token_v1';
  function apiToken() { try { return global.localStorage.getItem(API_TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function saveApiToken(token, expiresAt) { try { global.localStorage.setItem(API_TOKEN_KEY, token); if (expiresAt) global.localStorage.setItem(API_TOKEN_KEY + '_expires', String(expiresAt)); } catch (e) {} }
  function clearApiToken() { try { global.localStorage.removeItem(API_TOKEN_KEY); global.localStorage.removeItem(API_TOKEN_KEY + '_expires'); } catch (e) {} }
  async function httpJson(method, url, body) {
    const opts = { method: method, headers: {}, cache: 'no-store' };
    const token = apiToken();
    if (token) opts.headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const r = await fetch(url, opts);
    if (r.status === 401) { clearApiToken(); try { global.dispatchEvent(new CustomEvent('iar-auth-expired')); } catch (e) {} }
    if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
    const ct = r.headers.get('content-type') || '';
    if (ct.indexOf('application/json') >= 0) return r.json().catch(() => null);
    return null;
  }

  // ---------------- IndexedDB 后端 ----------------
  const DBNAME = 'slcp_app_idb_v1', DBVERSION = 6;
  const KV = 'kv', ATT = 'attachments', VER = 'versions', DOCS = 'docs', USERS = 'users', ESGATT = 'esgAttachments', FACATT = 'facAttachments', PHOTOS = 'photos';
  let idb = null;
  function openIdb() {
    return new Promise((resolve, reject) => {
      if (!Storage.supports.idb) { reject(new Error('当前环境不支持 IndexedDB')); return; }
      const req = global.indexedDB.open(DBNAME, DBVERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV, { keyPath: 'key' });
        if (!db.objectStoreNames.contains(ATT)) { const s = db.createObjectStore(ATT, { keyPath: 'id' }); s.createIndex('byAssessment', 'assessmentId', { unique: false }); }
        if (!db.objectStoreNames.contains(VER)) { const s = db.createObjectStore(VER, { keyPath: 'id' }); s.createIndex('byAssessment', 'assessmentId', { unique: false }); }
        if (!db.objectStoreNames.contains(DOCS)) db.createObjectStore(DOCS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(USERS)) db.createObjectStore(USERS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(ESGATT)) { const s = db.createObjectStore(ESGATT, { keyPath: 'id' }); s.createIndex('byEsg', 'esgId', { unique: false }); }
        if (!db.objectStoreNames.contains(FACATT)) { const s = db.createObjectStore(FACATT, { keyPath: 'id' }); s.createIndex('byFacility', 'facilityId', { unique: false }); }
        if (!db.objectStoreNames.contains(PHOTOS)) { const s = db.createObjectStore(PHOTOS, { keyPath: 'id' }); s.createIndex('byFacility', 'facilityId', { unique: false }); }
      };
      req.onsuccess = () => { idb = req.result; resolve(idb); };
      req.onerror = () => reject(req.error);
    });
  }
  function tx(name, mode) { return idb.transaction(name, mode).objectStore(name); }
  function storeExists(name) { return !!idb && idb.objectStoreNames && idb.objectStoreNames.contains(name); }
  function reqAsync(req) { return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); }); }
  function getStoreAll(name) {
    return new Promise((res, rej) => {
      const out = [];
      const cur = tx(name, 'readonly').openCursor();
      cur.onsuccess = (e) => { const c = e.target.result; if (c) { out.push(c.value); c.continue(); } else res(out); };
      cur.onerror = () => rej(cur.error);
    });
  }

  // ---------------- 统一存储 API（db.js 调用） ----------------
  // kv 记录在 idb 中以 {key,data} 落库；此处统一解包，使两种模式返回值语义一致（只返回 data）。
  Storage.kvGet = function (key) {
    if (Storage.mode === 'http') return httpJson('GET', '/api/kv/' + enc(key)).then((v) => (v && v.data !== undefined ? v.data : null));
    if (!idb || !storeExists(KV)) return Promise.resolve(null);
    return reqAsync(tx(KV, 'readonly').get(key)).then((rec) => {
      if (rec == null) return null;
      if (typeof rec === 'object' && Object.prototype.hasOwnProperty.call(rec, 'data')) return rec.data;
      return rec; // 兼容早期未包装的记录
    });
  };
  Storage.kvPut = function (key, val) {
    if (Storage.mode === 'http') return httpJson('PUT', '/api/kv/' + enc(key), { data: val }).then(() => {});
    if (!idb || !storeExists(KV)) return Promise.reject(new Error('存储未初始化'));
    return reqAsync(tx(KV, 'readwrite').put({ key: key, data: val }));
  };
  Storage.kvDelete = function (key) {
    if (Storage.mode === 'http') return httpJson('DELETE', '/api/kv/' + enc(key)).then(() => {});
    if (!idb || !storeExists(KV)) return Promise.resolve();
    return reqAsync(tx(KV, 'readwrite').delete(key));
  };
  Storage.kvClear = function () {
    if (Storage.mode === 'http') return httpJson('DELETE', '/api/kv/main').then(() => {}).catch((e) => { console.warn('kvClear 失败', e); throw e; });
    if (!idb || !storeExists(KV)) return Promise.resolve();
    return reqAsync(tx(KV, 'readwrite').clear());
  };

  Storage.getAll = function (ns) {
    if (Storage.mode === 'http') return httpJson('GET', '/api/list/' + enc(ns)).then((a) => a || []);
    if (!storeExists(ns)) return Promise.resolve([]);
    return getStoreAll(ns);
  };
  Storage.get = function (ns, id) {
    if (Storage.mode === 'http') return httpJson('GET', '/api/blob/' + enc(ns) + '/' + enc(id)).then((v) => (v && v.item ? v.item : null));
    return reqAsync(tx(ns, 'readonly').get(id));
  };
  Storage.put = function (ns, item) {
    if (Storage.mode === 'http') {
      return deepConvert(item, true).then((converted) => httpJson('PUT', '/api/blob/' + enc(ns) + '/' + enc(item.id), { item: converted }).then(() => {}));
    }
    return reqAsync(tx(ns, 'readwrite').put(item));
  };
  Storage.del = function (ns, id) {
    if (Storage.mode === 'http') return httpJson('DELETE', '/api/blob/' + enc(ns) + '/' + enc(id)).then(() => {}).catch((e) => { console.warn('Storage.del 失败', ns, id, e); throw e; });
    return reqAsync(tx(ns, 'readwrite').delete(id));
  };
  Storage.clear = function (ns) {
    if (Storage.mode === 'http') {
      return Storage.getAll(ns).then((arr) => Promise.all(arr.map((it) => Storage.del(ns, it.id))));
    }
    if (!storeExists(ns)) return Promise.resolve();
    return reqAsync(tx(ns, 'readwrite').clear());
  };
  Storage.serialize = function (value) { return deepConvert(value, true); };
  Storage.deserialize = function (value) { return deepConvert(value, false); };

  // ---------------- 用户账户（独立于主状态，不进 JSON 备份） ----------------
  let usersCache = null;
  Storage.getUsers = function () {
    if (Storage.mode === 'http') { if (usersCache) return Promise.resolve(usersCache); return httpJson('GET', '/api/users').then((a) => { usersCache = a || []; return usersCache; }); }
    if (!storeExists(USERS)) return Promise.resolve([]);
    return getStoreAll(USERS);
  };
  Storage.putUser = function (u) {
    if (Storage.mode === 'http') {
      usersCache = (usersCache || []).slice();
      const i = usersCache.findIndex((x) => x.id === u.id);
      if (i >= 0) usersCache[i] = u; else usersCache.push(u);
      return httpJson('PUT', '/api/users', usersCache).then(() => {});
    }
    return reqAsync(tx(USERS, 'readwrite').put(u));
  };
  Storage.delUser = function (id) {
    if (Storage.mode === 'http') { usersCache = (usersCache || []).filter((x) => x.id !== id); return httpJson('PUT', '/api/users', usersCache).then(() => {}); }
    return reqAsync(tx(USERS, 'readwrite').delete(id));
  };
  Storage.getUser = function (id) {
    if (Storage.mode === 'http') { return Storage.getUsers().then((a) => a.find((x) => x.id === id) || null); }
    if (!storeExists(USERS)) return Promise.resolve(null);
    return reqAsync(tx(USERS, 'readonly').get(id));
  };
  Storage.getUserByUsername = function (name) {
    const n = String(name || '').trim().toLowerCase();
    if (Storage.mode === 'http') { return Storage.getUsers().then((a) => a.find((x) => (x.username || '').toLowerCase() === n) || null); }
    if (!storeExists(USERS) || !n) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const cur = tx(USERS, 'readonly').openCursor();
      cur.onsuccess = (e) => { const c = e.target.result; if (c) { if ((c.value.username || '').toLowerCase() === n) resolve(c.value); else c.continue(); } else resolve(null); };
      cur.onerror = () => reject(cur.error);
    });
  };

  // ---------------- 配置 / 容量 ----------------
  Storage.hasApiToken = function () { return !!apiToken(); };
  Storage.apiLogin = function (username, password, deviceId) {
    return httpJson('POST', '/api/auth/login', { username: username, password: password, deviceId: deviceId }).then((result) => { if (result && result.token) saveApiToken(result.token, result.expiresAt); return result; });
  };
  Storage.apiRegister = function (username, password, displayName, deviceId) {
    return httpJson('POST', '/api/auth/register', { username: username, password: password, displayName: displayName, deviceId: deviceId }).then((result) => { if (result && result.token) saveApiToken(result.token, result.expiresAt); return result; });
  };
  Storage.apiMe = function () { return httpJson('GET', '/api/auth/me'); };
  Storage.apiStatus = function () { return httpJson('GET', '/api/auth/status'); };
  Storage.getConfig = function () { if (Storage.mode === 'http') return httpJson('GET', '/api/config'); return Promise.resolve(null); };
  Storage.setConfig = function (cfg) { if (Storage.mode === 'http') return httpJson('POST', '/api/config', cfg); return Promise.resolve(null); };
  Storage.estimate = function () {
    if (Storage.mode === 'http') return Storage.getConfig().then((c) => ({ usage: (c && c.sizeBytes) || 0, quota: 0, dataDir: c && c.dataDir }));
    if (global.navigator && navigator.storage && navigator.storage.estimate) {
      return navigator.storage.estimate().then((e) => ({ usage: e.usage || 0, quota: e.quota || 0 })).catch(() => ({ usage: 0, quota: 0 }));
    }
    return Promise.resolve({ usage: 0, quota: 0 });
  };

  // ---------------- 初始化（自动探测后端） ----------------
  Storage.init = function () {
    detectCaps();
    if (Storage.supports.secure && typeof fetch === 'function') {
      return httpJson('GET', '/api/health').then((j) => {
        if (j && j.mode === 'file') { Storage.mode = 'http'; Storage.dataDir = j.dataDir || '服务器数据目录'; Storage.inited = true; return Storage.mode; }
        throw new Error('not file backend');
      }).catch(() => openIdb().then(() => { Storage.mode = 'idb'; Storage.dataDir = '浏览器本地 (IndexedDB)'; Storage.inited = true; return Storage.mode; }));
    }
    return openIdb().then(() => { Storage.mode = 'idb'; Storage.dataDir = '浏览器本地 (IndexedDB)'; Storage.inited = true; return Storage.mode; });
  };

  global.Storage = Storage;
})(window);

/* ===== src/js/db.js ===== */
/* 数据层 + 默认审核问卷模板
 * 设计：内存 state 保持同步读取 API（DB.get），写入经 Storage 驱动异步落盘；
 *   - 有后端（Node 轻量服务）时：主状态存 data/kv/main.json，附件/版本/文档/用户以独立文件落盘（零数据库）。
 *   - 纯前端 file:// 时：自动降级为 IndexedDB 兜底。
 * 大体积图片附件与版本快照存于独立 blob 存储，避免拖慢主状态与备份。
 */
(function (global) {
  const LS_KEY = 'slcp_app_state_v1';
  let state = null;
  const DB = {};

  // ---------- 默认模板 ----------
  function defaultQuestionnaire() {
    const q = (label, type, opts) => Object.assign({ id: Util.uid('q'), label, type, required: false, level: 'minor' }, opts || {});
    return {
      id: Util.uid('qn'),
      title: T('供应商预审平台 默认审核问卷'),
      description: T('预置的本地化默认审核问卷，涵盖招聘雇佣、工时、工资、健康安全等核心议题，可在「问卷设计」中自由增改。'),
      updatedAt: Date.now(),
      modules: [
        { id: Util.uid('mod'), title: T('A. 招聘与雇佣'), questions: [
          q(T('是否向工人收取任何押金或保证金？'), 'yesno', { help: T('合规：不得收取押金'), required: true, level: 'major' }),
          q(T('是否核验工人年龄并保留身份证明文件复印件？'), 'yesno', { required: true, level: 'major' }),
          q(T('工人是否自愿受雇（无强迫劳动迹象）？'), 'yesno', { required: true, level: 'major' }),
          q(T('是否扣留工人身份证件、护照或居住证？'), 'yesno', { required: true, level: 'critical' }),
          q(T('建立劳动关系的书面合同覆盖率（%）'), 'number', { min: 0, max: 100, required: true, level: 'minor' })
        ]},
        { id: Util.uid('mod'), title: T('B. 工作时间'), questions: [
          q(T('标准周工时（小时）'), 'number', { min: 0, max: 168, required: true, level: 'major' }),
          q(T('周最高工时（含加班，小时）'), 'number', { min: 0, max: 168, required: true, level: 'major' }),
          q(T('加班是否基于工人自愿？'), 'yesno', { required: true, level: 'major' }),
          q(T('平均每月加班工时（小时）'), 'number', { min: 0, level: 'minor' }),
          q(T('是否安排每周至少一天休息？'), 'yesno', { required: true, level: 'suggest' })
        ]},
        { id: Util.uid('mod'), title: T('C. 工资与福利'), questions: [
          q(T('是否按时、足额以法定货币支付工资？'), 'yesno', { required: true, level: 'critical' }),
          q(T('工资是否不低于当地最低工资标准？'), 'yesno', { required: true, level: 'major' }),
          q(T('是否为员工依法缴纳社会保险？'), 'yesno', { required: true, level: 'major' }),
          q(T('工资扣减是否有合法依据并书面告知？'), 'yesno', { required: true, level: 'major' }),
          q(T('工资支付准时度评分'), 'rating', { max: 5, required: true, level: 'minor' })
        ]},
        { id: Util.uid('mod'), title: T('D. 员工待遇'), questions: [
          q(T('是否存在体罚、辱骂或人身骚扰？'), 'yesno', { required: true, level: 'critical' }),
          q(T('是否建立并公示员工申诉/投诉渠道？'), 'yesno', { required: true, level: 'major' }),
          q(T('申诉渠道有效性评分'), 'rating', { max: 5, level: 'minor' }),
          q(T('是否提供反骚扰与平等待遇培训？'), 'yesno', { level: 'suggest' })
        ]},
        { id: Util.uid('mod'), title: T('E. 员工参与'), questions: [
          q(T('是否定期与员工进行书面或会议沟通？'), 'yesno', { required: true, level: 'minor' }),
          q(T('是否设立员工意见反馈或工人代表机制？'), 'yesno', { level: 'suggest' })
        ]},
        { id: Util.uid('mod'), title: T('F. 健康与安全'), questions: [
          q(T('是否取得消防验收/安全检查合格？'), 'yesno', { required: true, level: 'major' }),
          q(T('过去 12 个月是否组织消防演练？'), 'yesno', { required: true, level: 'major' }),
          q(T('是否为相关岗位提供个人防护用品（PPE）？'), 'yesno', { required: true, level: 'major' }),
          q(T('过去 12 个月工伤事故次数'), 'number', { min: 0, required: true, level: 'critical' }),
          q(T('职业健康与安全管理评分'), 'rating', { max: 5, required: true, level: 'minor' })
        ]},
        { id: Util.uid('mod'), title: T('G. 终止雇佣'), questions: [
          q(T('解雇是否遵循法定程序并提前通知？'), 'yesno', { required: true, level: 'major' }),
          q(T('离职结算（工资/补偿）是否及时完成？'), 'yesno', { required: true, level: 'major' })
        ]},
        { id: Util.uid('mod'), title: T('H. 管理体系'), questions: [
          q(T('是否建立社会责任/行为准则政策文件？'), 'yesno', { required: true, level: 'minor' }),
          q(T('是否定期开展内部审核或管理评审？'), 'yesno', { required: true, level: 'minor' }),
          q(T('是否对供应商/分包方进行社会合规管理？'), 'yesno', { level: 'suggest' })
        ]},
        { id: Util.uid('mod'), title: T('I. 强迫劳动（红线项）'), questions: [
          q(T('是否存在扣押工资、限制自由离开的行为？'), 'yesno', { required: true, level: 'critical' }),
          q(T('是否存在债务劳工或贩卖劳工迹象？'), 'yesno', { required: true, level: 'critical' }),
          q(T('工人是否可自由辞职（无不当限制）？'), 'yesno', { required: true, level: 'critical' })
        ]}
      ]
    };
  }

  function defaultFacilityFields() {
    const f = (key, label, type, extra) => Object.assign({ id: Util.uid('ff'), key, label, type, required: false, list: false }, extra || {});
    return [
      f('code', T('供应商编码'), 'text', { required: true, placeholder: T('如 SUP-001'), list: true, locked: true }),
      f('name', T('供应商名称'), 'text', { required: true, placeholder: T('工厂/场所全称'), list: true, locked: true }),
      f('region', T('所在地区'), 'text', { placeholder: T('省/市'), list: true }),
      f('address', T('详细地址'), 'text', { placeholder: T('街道门牌'), list: false }),
      f('industry', T('行业类型'), 'text', { placeholder: T('如 服装制造'), list: true }),
      f('ownerType', T('权属性质'), 'select', { options: [T('自有'), T('外包/代工'), T('合资'), T('其他')], list: false }),
      f('contact', T('联系人'), 'text', { list: false }),
      f('phone', T('联系电话'), 'text', { list: false }),
      f('email', T('邮箱'), 'email', { list: false }),
      f('workers', T('用工人数'), 'number', { placeholder: T('整数'), list: true }),
      f('note', T('备注'), 'textarea', { list: false })
    ];
  }

  function defaultArchive() {
    return {
      creditCode: '', address: '', contact: '', phone: '', lastAuditDate: '',
      industry: '', employees: '', scope: ''
    };
  }

  function defaultRisk() { return { level: null, desc: '', action: '' }; }

  function defaultProcess() {
    return {
      opening: { time: '', place: '', participants: '', agenda: '' },
      walk: { areas: '', route: '', observations: '', photos: [] },
      docs: { items: [], notes: '' },
      interview: { items: [], notes: '' },
      closing: { time: '', participants: '', conclusion: '', suggestion: '' },
      order: ['opening', 'walk', 'docs', 'interview', 'closing'],
      custom: {}
    };
  }

  function emptyState() {
    const st = {
      settings: { orgName: T('我的组织'), auditorName: '', reportTitle: T('供应商预审报告 · Supplier Pre-Assessment Report'),
        cover: { style: 'band', color: '#2840a8', subtitle: '', showOrg: true, showTime: true },
        report: { showGrade: false, showRisk: true, showProcess: true } },
      facilityFields: defaultFacilityFields(),
      facilities: [], questionnaires: [defaultQuestionnaire()], assessments: [],
      supplyNodes: [], standards: [], esgQuestionnaires: [],
      facilityFileLogs: [], facFileSeq: {}, termGlossary: [], guideBookmarks: [], guideUploads: []
    };
    return st;
  }

  function migrateFix() {
    const s = state;
    if (!s.settings) s.settings = emptyState().settings; else s.settings = Object.assign(emptyState().settings, s.settings);
    s.facilities = s.facilities || [];
    const archDef = defaultArchive();
    s.facilities.forEach((f) => { Object.keys(archDef).forEach((k) => { if (f[k] === undefined) f[k] = archDef[k]; }); });
    const geoDef = { country: '', city: '', lat: null, lng: null, status: 'active', perfOnTime: null, perfQuality: null };
    s.facilities.forEach((f) => { Object.keys(geoDef).forEach((k) => { if (f[k] === undefined) f[k] = geoDef[k]; }); });
    // 供应链绩效看板三核心字段（评估得分/规模/区域风险等级）默认值，保证旧数据不缺字段
    const perfDef = { score: null, scale: '', regionRiskLevel: '' };
    s.facilities.forEach((f) => { Object.keys(perfDef).forEach((k) => { if (f[k] === undefined) f[k] = perfDef[k]; }); });
    s.supplyNodes = Array.isArray(s.supplyNodes) ? s.supplyNodes : [];
    s.supplyNodes.forEach((n) => {
      const nd = { material: '', tier: 'Tier1', supplierId: '', parentId: '', status: 'normal', anomaly: '', qty: '', note: '', createdAt: Date.now(), updatedAt: Date.now() };
      for (const k in nd) if (n[k] === undefined) n[k] = nd[k];
    });
    s.questionnaires = s.questionnaires && s.questionnaires.length ? s.questionnaires : [defaultQuestionnaire()];
    s.facilityFields = (Array.isArray(s.facilityFields) && s.facilityFields.length) ? s.facilityFields : defaultFacilityFields();
    s.assessments = s.assessments || [];
    s.standards = Array.isArray(s.standards) ? s.standards : [];
    s.esgQuestionnaires = Array.isArray(s.esgQuestionnaires) ? s.esgQuestionnaires : [];
    s.facilityFileLogs = Array.isArray(s.facilityFileLogs) ? s.facilityFileLogs : [];
    s.facFileSeq = (s.facFileSeq && typeof s.facFileSeq === 'object') ? s.facFileSeq : {};
    s.termGlossary = Array.isArray(s.termGlossary) ? s.termGlossary : [];
    s.guideBookmarks = Array.isArray(s.guideBookmarks) ? s.guideBookmarks : [];
    s.guideUploads = Array.isArray(s.guideUploads) ? s.guideUploads : [];
    (s.esgQuestionnaires || []).forEach((q) => {
      if (!q.createdAt) q.createdAt = q.updatedAt || Date.now();
      if (!q.status) q.status = 'draft';
      if (!Array.isArray(q.standards)) q.standards = [];
      if (!q.standardVersions || typeof q.standardVersions !== 'object') q.standardVersions = {};
      if (!Array.isArray(q.themes)) q.themes = [];
      if (!q.responses || typeof q.responses !== 'object') q.responses = {};
      if (!q.attachments) q.attachments = [];
      if (!q.versions) q.versions = [];
      if (!q.scores) q.scores = null;
    });
    if (!s.standards.length && global.StandardsSeed && global.StandardsSeed.data) {
      s.standards = global.StandardsSeed.data.map((x) => JSON.parse(JSON.stringify(x)));
    }
    s.assessments.forEach((a) => {
      a.attachments = a.attachments || [];
      a.versions = a.versions || [];
      if (!a.answers) a.answers = {};
      if (!a.comments) a.comments = {};
      if (a.auditType === undefined) a.auditType = '';
      if (!a.risk) a.risk = defaultRisk(); else { const rd = defaultRisk(); for (const k in rd) if (a.risk[k] === undefined) a.risk[k] = rd[k]; }
      if (!a.process) a.process = defaultProcess(); else {
        const pd = defaultProcess();
        for (const k in pd) if (k !== 'custom' && a.process[k] === undefined) a.process[k] = pd[k];
        if (!a.process.order || !a.process.order.length) a.process.order = pd.order.slice();
        a.process.custom = a.process.custom || {};
      }
      for (const k in a.comments) {
        const v = a.comments[k];
        if (typeof v === 'string') a.comments[k] = { text: v, images: [] };
        else if (v && typeof v === 'object') { if (!Array.isArray(v.images)) v.images = []; if (typeof v.text !== 'string') v.text = ''; }
        else a.comments[k] = { text: '', images: [] };
      }
    });
    (s.questionnaires || []).forEach((qn) => {
      if (!qn.createdAt) qn.createdAt = qn.updatedAt || Date.now();
      if (!qn.status) qn.status = 'draft';
      if (Array.isArray(qn.modules)) qn.modules = qn.modules.filter((m) => !(m && m.type === 'guide'));
      (qn.modules || []).forEach((mod) => (mod.questions || []).forEach((q) => { if (!q.level) q.level = 'minor'; }));
    });
  }

  // ---------- 标准 / 法规 ----------
  DB.getStandards = function () { return (state.standards || []).slice(); };
  DB.getStandardsByCategory = function () {
    const all = DB.getStandards();
    const cats = (global.StandardsSeed && global.StandardsSeed.categories) || [];
    const order = cats.concat(all.map((x) => x.category).filter((c) => cats.indexOf(c) < 0));
    const map = {};
    all.forEach((x) => { (map[x.category] = map[x.category] || []).push(x); });
    return order.filter((c) => map[c]).map((c) => ({ category: c, items: map[c] }));
  };

  // ---------- 启动加载 ----------
  function saveState() {
    return Storage.kvPut('main', state)
      .catch((e) => { Util.toast(T('数据写入失败：') + (e && e.message || e), 'err'); });
  }
  DB.persist = function () { return saveState(); };

  DB.load = function () {
    return Storage.init().then(loadState).catch((e) => {
      console.error(e);
      state = emptyState();
      Util.toast(T('无法初始化存储，已使用临时内存模式（刷新将丢失）'), 'err');
      return state;
    });
  };
  function loadState() {
    return Storage.kvGet('main').then((rec) => {
      if (rec) {
        state = rec;
      } else {
        const ls = global.localStorage ? global.localStorage.getItem(LS_KEY) : null;
        if (ls) {
          try { state = JSON.parse(ls); } catch (e) { state = emptyState(); }
          try { global.localStorage.removeItem(LS_KEY); } catch (e) {}
        } else {
          state = emptyState();
        }
      }
      migrateFix();
      return saveState();
    });
  }

  DB.get = function () { return state; };
  DB.newRisk = defaultRisk;
  DB.newProcess = defaultProcess;
  // 默认审核问卷模板（问卷设计器「新建问卷-系统默认模板」与初始化共用同一数据源）
  DB.defaultQuestionnaire = defaultQuestionnaire;

  // ---------- 供应商（供应商/工厂） ----------
  DB.addFacility = function (f) { state.facilities.push(f); return saveState(); };
  DB.updateFacility = function (id, patch) {
    const i = state.facilities.findIndex((x) => x.id === id);
    if (i >= 0) { Object.assign(state.facilities[i], patch, { updatedAt: Date.now() }); return saveState(); }
  };
  DB.deleteFacility = function (id) {
    const affected = state.assessments.filter((a) => a.facilityId === id);
    const attIds = [], verIds = [];
    affected.forEach((a) => {
      (a.attachments || []).forEach((m) => { if (m && m.id) attIds.push(m.id); });
      (a.versions || []).forEach((v) => { if (v && v.id) verIds.push(v.id); });
    });
    state.facilities = state.facilities.filter((x) => x.id !== id);
    state.assessments = state.assessments.filter((a) => a.facilityId !== id);
    state.facilityFileLogs = (state.facilityFileLogs || []).filter((l) => l.facilityId !== id);
    // 仅删除该设施关联评估的附件/版本，避免误删其他评估的数据（修复全量清空导致的数据丢失）
    return saveState()
      .then(() => Promise.all(attIds.map((aid) => Storage.del('attachments', aid))))
      .then(() => Promise.all(verIds.map((vid) => Storage.del('versions', vid))))
      .then(() => Storage.getAll('facAttachments'))
      .then((all) => Promise.all(all.filter((x) => x.facilityId === id).map((x) => Storage.del('facAttachments', x.id))));
  };
  DB.getFacility = function (id) { return state.facilities.find((x) => x.id === id); };
  DB.getFacilityByCode = function (code) {
    if (!code) return null;
    const c = String(code).trim().toLowerCase();
    return state.facilities.find((x) => x.code && String(x.code).trim().toLowerCase() === c) || null;
  };

  // ---------- 供应商档案文件（PDF / Excel 归档） ----------
  // 文件分类（短码用于自动文件名；frontBack 表示需正反面，如营业执照正本/副本）
  const FAC_FILE_CATS = [
    { code: 'BL', key: T('营业执照'), frontBack: true },
    { code: 'AR', key: T('审核报告'), frontBack: false },
    { code: 'SP', key: T('供应商简介'), frontBack: false },
    { code: 'CERT', key: T('资质证书'), frontBack: false },
    { code: 'OTHER', key: T('其他'), frontBack: false }
  ];
  DB.facFileCats = FAC_FILE_CATS;
  DB.FAC_FILE_LIMITS = { maxSizeMB: 10, maxBatch: 10, acceptedExt: ['pdf', 'xlsx', 'xls'], quotaBytes: 100 * 1024 * 1024 };

  function facSlotKey(facilityId, category, side) { return facilityId + '|' + category + '|' + side; }
  function facCurrentUser() {
    if (global.Auth && typeof Auth.currentUser === 'function') {
      const u = Auth.currentUser();
      if (u) return (u.displayName || u.username || T('系统'));
    }
    return T('系统');
  }
  function facLog(facilityId, action, detail) {
    state.facilityFileLogs = state.facilityFileLogs || [];
    state.facilityFileLogs.push({ id: Util.uid('fl'), facilityId: facilityId, action: action, detail: detail, by: facCurrentUser(), at: Date.now() });
  }

  DB.addFacAttachment = function (facilityId, full) {
    const L = DB.FAC_FILE_LIMITS;
    const ext = (full.ext || '').toLowerCase();
    if (L.acceptedExt.indexOf(ext) < 0) return Promise.reject(new Error(T('不支持的文件类型')));
    if (Number(full.size) > L.maxSizeMB * 1024 * 1024) return Promise.reject(new Error(T('文件超出 10MB 限制')));
    const side = full.side || 'none';
    return Storage.getAll('facAttachments').then((all) => {
      const slot = all.filter((x) => x.facilityId === facilityId && x.category === full.category && x.side === side);
      // 版本号按槽位单调递增（删除后不回收，保证审计可追溯）
      const seqKey = facSlotKey(facilityId, full.category, side);
      const nextVer = (state.facFileSeq[seqKey] || 0) + 1;
      state.facFileSeq[seqKey] = nextVer;
      const now = Date.now();
      const f = DB.getFacility(facilityId);
      const code = (f && f.code) || 'FAC';
      const dateStr = new Date(now).toISOString().slice(0, 10).replace(/-/g, '');
      const rec = {
        id: Util.uid('fa'), facilityId: facilityId,
        category: full.category, categoryLabel: full.categoryLabel || full.category,
        side: side, slotKey: facSlotKey(facilityId, full.category, side),
        version: nextVer, isCurrent: true, deleted: false,
        fileName: [code, full.category, dateStr].join('_') + '.' + (full.ext || 'bin'),
        originalName: full.originalName || '', ext: full.ext || '', mime: full.mime || '', size: full.size || 0,
        data: full.data,
        uploadedBy: full.uploadedBy || facCurrentUser(),
        uploadedAt: now, expiryDate: full.expiryDate || '', note: full.note || '', versionNote: full.versionNote || ''
      };
      const demote = slot.filter((x) => x.isCurrent).map((x) => { x.isCurrent = false; return x; });
      return Promise.all(demote.map((x) => Storage.put('facAttachments', x)))
        .then(() => Storage.put('facAttachments', rec))
        .then(() => { facLog(facilityId, 'upload', rec.categoryLabel + (rec.side !== 'none' ? ('(' + (rec.side === 'front' ? T('正面') : T('反面')) + ')') : '') + ' v' + rec.version + ' · ' + rec.fileName); return saveState(); })
        .then(() => rec);
    });
  };
  DB.getFacAttachments = function (facilityId) {
    return Storage.getAll('facAttachments').then((all) => {
      const list = all.filter((x) => x.facilityId === facilityId);
      list.sort((a, b) => (a.slotKey || '').localeCompare(b.slotKey || '') || (b.version || 0) - (a.version || 0));
      return list;
    });
  };
  DB.getFacCurrentFiles = function (facilityId) {
    return DB.getFacAttachments(facilityId).then((list) => list.filter((x) => x.isCurrent && !x.deleted));
  };
  DB.getFacAttachment = function (id) { return Storage.get('facAttachments', id); };
  // 软删除：保留历史记录用于审计；若删除的是当前版本，则自动将同槽位最新未删除版本提升为当前
  DB.deleteFacAttachment = function (attId) {
    return Storage.get('facAttachments', attId).then((rec) => {
      if (!rec) return Promise.resolve();
      const slotKey = rec.slotKey;
      rec.deleted = true;
      rec.isCurrent = false;
      return Storage.put('facAttachments', rec)
        .then(() => Storage.getAll('facAttachments'))
        .then((all) => {
          const slot = all.filter((x) => x.slotKey === slotKey && !x.deleted).sort((a, b) => (b.version || 0) - (a.version || 0));
          if (slot.length && !slot[0].isCurrent) { slot[0].isCurrent = true; return Storage.put('facAttachments', slot[0]).then(() => slot[0]); }
          return null;
        })
        .then((promoted) => { facLog(rec.facilityId, 'delete', rec.categoryLabel + ' · ' + rec.fileName + (promoted ? ('（已回退至 v' + promoted.version + '）') : '')); return saveState(); });
    });
  };
  DB.rollbackFacAttachment = function (attId) {
    return Storage.get('facAttachments', attId).then((rec) => {
      if (!rec) return Promise.reject(new Error('文件不存在'));
      const slotKey = rec.slotKey;
      return Storage.getAll('facAttachments').then((all) => {
        const slot = all.filter((x) => x.slotKey === slotKey);
        const others = slot.filter((x) => x.id !== attId).map((x) => { x.isCurrent = false; return x; });
        rec.isCurrent = true;
        return Promise.all(others.map((x) => Storage.put('facAttachments', x)))
          .then(() => Storage.put('facAttachments', rec))
          .then(() => { facLog(rec.facilityId, 'rollback', rec.categoryLabel + ' 回滚至 v' + rec.version + ' · ' + rec.fileName); return saveState(); })
          .then(() => rec);
      });
    });
  };
  DB.getFacFileLogs = function (facilityId) {
    const all = (state.facilityFileLogs || []).filter((l) => l.facilityId === facilityId);
    all.sort((a, b) => (b.at || 0) - (a.at || 0));
    return all;
  };
  DB.facFileQuota = function (facilityId) {
    return DB.getFacAttachments(facilityId).then((list) => {
      const active = list.filter((x) => !x.deleted);
      const bytes = active.reduce((s, x) => s + (Number(x.size) || 0), 0);
      return { bytes: bytes, count: active.length, limit: DB.FAC_FILE_LIMITS.quotaBytes, exceeded: bytes > DB.FAC_FILE_LIMITS.quotaBytes };
    });
  };

  // ---------- 供应链节点 ----------
  DB.addSupplyNode = function (n) {
    const obj = Object.assign({ id: Util.uid('sn'), createdAt: Date.now(), updatedAt: Date.now() }, n);
    state.supplyNodes.push(obj);
    return saveState().then(() => obj);
  };
  DB.updateSupplyNode = function (id, patch) {
    const i = state.supplyNodes.findIndex((x) => x.id === id);
    if (i >= 0) { Object.assign(state.supplyNodes[i], patch, { updatedAt: Date.now() }); return saveState(); }
  };
  DB.deleteSupplyNode = function (id) {
    state.supplyNodes.forEach((n) => { if (n.parentId === id) n.parentId = ''; });
    state.supplyNodes = state.supplyNodes.filter((x) => x.id !== id);
    return saveState();
  };
  DB.getSupplyNode = function (id) { return state.supplyNodes.find((x) => x.id === id); };
  DB.setSupplyNodes = function (arr, replace) {
    if (replace) { state.supplyNodes = arr.map((n) => Object.assign({ id: Util.uid('sn'), createdAt: Date.now(), updatedAt: Date.now() }, n)); }
    else { arr.forEach((n) => state.supplyNodes.push(Object.assign({ id: Util.uid('sn'), createdAt: Date.now(), updatedAt: Date.now() }, n))); }
    return saveState();
  };

  // ---------- 供应商登记字段 ----------
  DB.getFacilityFields = function () { return state.facilityFields || []; };
  DB.saveFacilityFields = function (fields) {
    state.facilityFields = fields.map((x) => {
      const o = Object.assign({}, x);
      if (!o.id) o.id = Util.uid('ff');
      if (!o.key) o.key = 'f_' + o.id;
      if (!o.type) o.type = 'text';
      return o;
    });
    return saveState();
  };
  DB.upsertFacilityField = function (field) {
    const list = state.facilityFields.slice();
    const i = list.findIndex((x) => x.id === field.id);
    const obj = Object.assign({}, field);
    if (!obj.id) obj.id = Util.uid('ff');
    if (!obj.key) obj.key = 'f_' + obj.id;
    if (i >= 0) list[i] = obj; else list.push(obj);
    state.facilityFields = list;
    return saveState();
  };
  DB.deleteFacilityField = function (id) {
    state.facilityFields = state.facilityFields.filter((x) => x.id !== id);
    return saveState();
  };
  DB.reorderFacilityField = function (id, dir) {
    const list = state.facilityFields.slice();
    const i = list.findIndex((x) => x.id === id);
    if (i < 0) return Promise.resolve();
    const j = dir < 0 ? i - 1 : i + 1;
    if (j < 0 || j >= list.length) return Promise.resolve();
    const tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    state.facilityFields = list;
    return saveState();
  };

  // ---------- 问卷 ----------
  DB.addQuestionnaire = function (qn) {
    if (!qn.createdAt) qn.createdAt = Date.now();
    if (!qn.status) qn.status = 'draft';
    state.questionnaires.push(qn);
    return saveState();
  };
  DB.updateQuestionnaire = function (id, patch) {
    const i = state.questionnaires.findIndex((x) => x.id === id);
    if (i >= 0) { Object.assign(state.questionnaires[i], patch, { updatedAt: Date.now() }); return saveState(); }
  };
  DB.deleteQuestionnaire = function (id) { state.questionnaires = state.questionnaires.filter((x) => x.id !== id); return saveState(); };
  DB.getQuestionnaire = function (id) { return state.questionnaires.find((x) => x.id === id); };

  // ---------- 评估 ----------
  DB.addAssessment = function (a) { state.assessments.push(a); return saveState(); };
  DB.updateAssessment = function (id, patch) {
    const i = state.assessments.findIndex((x) => x.id === id);
    if (i >= 0) { Object.assign(state.assessments[i], patch, { updatedAt: Date.now() }); return saveState(); }
  };
  DB.deleteAssessment = function (id) {
    const a = state.assessments.find((x) => x.id === id);
    const attIds = (a && a.attachments || []).filter((m) => m && m.id).map((m) => m.id);
    const verIds = (a && a.versions || []).filter((v) => v && v.id).map((v) => v.id);
    state.assessments = state.assessments.filter((x) => x.id !== id);
    // 仅删除该评估的附件/版本，避免误删其他评估的数据（修复全量清空导致的数据丢失）
    return saveState()
      .then(() => Promise.all(attIds.map((aid) => Storage.del('attachments', aid))))
      .then(() => Promise.all(verIds.map((vid) => Storage.del('versions', vid))));
  };
  DB.getAssessment = function (id) { return state.assessments.find((x) => x.id === id); };

  // ---------- ESG 问卷（独立数据，与通用问卷分离） ----------
  DB.addEsgQuestionnaire = function (q) {
    if (!q.id) q.id = Util.uid('esg');
    if (!q.createdAt) q.createdAt = Date.now();
    if (!q.status) q.status = 'draft';
    if (!Array.isArray(q.themes)) q.themes = [];
    if (!q.responses) q.responses = {};
    if (!q.attachments) q.attachments = [];
    if (!q.versions) q.versions = [];
    state.esgQuestionnaires.push(q);
    return saveState().then(() => q);
  };
  DB.updateEsgQuestionnaire = function (id, patch) {
    const i = state.esgQuestionnaires.findIndex((x) => x.id === id);
    if (i >= 0) { Object.assign(state.esgQuestionnaires[i], patch, { updatedAt: Date.now() }); return saveState().then(() => state.esgQuestionnaires[i]); }
    return Promise.reject('ESG 问卷不存在');
  };
  DB.deleteEsgQuestionnaire = function (id) {
    const q = DB.getEsgQuestionnaire(id);
    const attIds = (q && q.attachments || []).filter((m) => m && m.id).map((m) => m.id);
    state.esgQuestionnaires = state.esgQuestionnaires.filter((x) => x.id !== id);
    return Promise.all(attIds.map((aid) => Storage.del('esgAttachments', aid))).then(() => saveState());
  };
  DB.getEsgQuestionnaire = function (id) { return state.esgQuestionnaires.find((x) => x.id === id); };
  DB.getEsgQuestionnaires = function () { return state.esgQuestionnaires.slice(); };
  // ESG 附件（复用通用 blob 存储，独立命名空间避免与评估附件混淆）
  DB.addEsgAttachment = function (esgId, full) {
    const q = DB.getEsgQuestionnaire(esgId); if (!q) return Promise.reject('ESG 问卷不存在');
    const meta = { id: full.id, esgId: esgId, name: full.name, type: full.type, size: full.size, caption: full.caption || '', itemId: full.itemId || '', createdAt: full.createdAt };
    q.attachments = q.attachments || [];
    q.attachments.push(meta);
    return Storage.put('esgAttachments', full).then(() => saveState());
  };
  DB.getEsgAttachments = function (esgId) {
    return Storage.getAll('esgAttachments').then((out) => {
      const list = out.filter((x) => x.esgId === esgId);
      list.sort((x, y) => (x.createdAt || 0) - (y.createdAt || 0));
      return list;
    });
  };
  DB.deleteEsgAttachment = function (attId, esgId) {
    const q = DB.getEsgQuestionnaire(esgId);
    if (q && q.attachments) q.attachments = q.attachments.filter((x) => x.id !== attId);
    return Storage.del('esgAttachments', attId).then(() => saveState());
  };
  DB.addEsgVersion = function (v) {
    const q = DB.getEsgQuestionnaire(v.esgId); if (!q) return Promise.reject('ESG 问卷不存在');
    q.versions = q.versions || [];
    q.versions.push({ id: v.id, ts: v.ts, label: v.label });
    return Storage.put('esgVersions', v).then(() => saveState());
  };
  DB.getEsgVersions = function (esgId) {
    const q = DB.getEsgQuestionnaire(esgId);
    const list = (q && q.versions) ? q.versions.slice() : [];
    list.sort((x, y) => (y.ts || 0) - (x.ts || 0));
    return Promise.resolve(list);
  };

  // ---------- 评分 ----------
  DB.computeScore = function (questionnaire, answers, modulesOverride) {
    let total = 0, max = 0;
    const byModule = [];
    const mods = modulesOverride || (questionnaire && questionnaire.modules) || [];
    mods.forEach((mod) => {
      let mScore = 0, mMax = 0;
      (mod.questions || []).forEach((qn) => {
        const v = answers ? answers[qn.id] : undefined;
        if (qn.type === 'rating') {
          const mx = Number(qn.max) || 5; mMax += mx; max += mx;
          const val = Number(v) || 0; mScore += val; total += val;
        } else if (qn.type === 'yesno') {
          mMax += 1; max += 1;
          if (v === true || v === 'true' || v === '是') { mScore += 1; total += 1; }
        }
      });
      byModule.push({ title: mod.title, score: mScore, max: mMax, percent: mMax ? Math.round((mScore / mMax) * 100) : 0 });
    });
    return { total, max, percent: max ? Math.round((total / max) * 100) : 0, byModule };
  };

  // ---------- 附件（图片/证据） ----------
  DB.addAttachment = function (assessmentId, full) {
    const a = DB.getAssessment(assessmentId); if (!a) return Promise.reject('评估不存在');
    const meta = { id: full.id, name: full.name, type: full.type, size: full.size, caption: full.caption || '', createdAt: full.createdAt };
    a.attachments = a.attachments || [];
    a.attachments.push(meta);
    return Storage.put('attachments', full).then(() => saveState());
  };
  DB.getAttachments = function (assessmentId) {
    return Storage.getAll('attachments').then((out) => {
      const list = out.filter((x) => x.assessmentId === assessmentId);
      list.sort((x, y) => (x.createdAt || 0) - (y.createdAt || 0));
      return list;
    });
  };
  DB.deleteAttachment = function (attId, assessmentId) {
    const a = DB.getAssessment(assessmentId);
    if (a && a.attachments) a.attachments = a.attachments.filter((x) => x.id !== attId);
    return Storage.del('attachments', attId).then(() => saveState());
  };
  DB.updateAttachmentCaption = function (attId, assessmentId, caption) {
    return Storage.get('attachments', attId).then((full) => {
      if (!full) return;
      full.caption = caption;
      const a = DB.getAssessment(assessmentId);
      if (a && a.attachments) { const m = a.attachments.find((x) => x.id === attId); if (m) m.caption = caption; }
      return Storage.put('attachments', full).then(() => saveState());
    });
  };

  // ---------- 版本快照 ----------
  DB.addVersion = function (v) {
    const a = DB.getAssessment(v.assessmentId); if (!a) return Promise.reject('评估不存在');
    a.versions = a.versions || [];
    a.versions.push({ id: v.id, ts: v.ts, label: v.label });
    return Storage.put('versions', v).then(() => saveState());
  };
  DB.getVersions = function (assessmentId) {
    const a = DB.getAssessment(assessmentId);
    const list = (a && a.versions) ? a.versions.slice() : [];
    list.sort((x, y) => (y.ts || 0) - (x.ts || 0));
    return Promise.resolve(list);
  };
  DB.getVersion = function (id) { return Storage.get('versions', id); };
  DB.deleteVersion = function (id, assessmentId) {
    const a = DB.getAssessment(assessmentId);
    if (a && a.versions) a.versions = a.versions.filter((x) => x.id !== id);
    return Storage.del('versions', id).then(() => saveState());
  };

  // ---------- 用户文档（标准 / 报告 PDF 等） ----------
  DB.addDoc = function (doc) { return Storage.put('docs', doc); };
  DB.getDoc = function (id) { return Storage.get('docs', id); };
  DB.getDocs = function (kind) {
    return Storage.getAll('docs').then((arr) => (kind ? arr.filter((d) => d.kind === kind) : arr));
  };
  DB.deleteDoc = function (id) { return Storage.del('docs', id); };

  // ---------- 标准 / 法规 更新 ----------
  DB.getStandard = function (code) { return state.standards.find((x) => x.code === code); };
  DB.updateStandard = function (code, patch) {
    const i = state.standards.findIndex((x) => x.code === code);
    if (i < 0) return Promise.reject('标准不存在');
    state.standards[i] = Object.assign({}, state.standards[i], patch, { code: code });
    return saveState();
  };
  DB.addUserStandard = function (s) {
    if (!s.code) s.code = 'u_' + Util.uid('st');
    state.standards.push(s);
    return saveState();
  };
  DB.deleteStandard = function (code) {
    state.standards = state.standards.filter((x) => x.code !== code);
    return saveState();
  };

  // ---------- 用户账户（注册 / 登录 / 权限） ----------
  DB.getUsers = function () { return Storage.getUsers(); };
  DB.getUserById = function (id) { return Storage.getUser(id); };
  DB.getUserByUsername = function (name) { return Storage.getUserByUsername(name); };
  DB.putUser = function (u) { return Storage.putUser(u); };
  DB.deleteUser = function (id) { return Storage.delUser(id); };

  // ---------- 完整备份 / 恢复 ----------
  function isBlobLike(b) {
    if (!b || typeof b !== 'object') return false;
    if (typeof Blob !== 'undefined' && b instanceof Blob) return true;
    if (typeof File !== 'undefined' && b instanceof File) return true;
    return typeof b.slice === 'function';
  }
  function blobToDataURL(blob) {
    return new Promise((resolve) => {
      if (typeof FileReader === 'undefined' || !isBlobLike(blob)) { resolve(blob); return; }
      try {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => resolve(null);
        r.readAsDataURL(blob);
      } catch (e) { resolve(null); }
    });
  }
  function dataURLToBlob(dataURL) {
    if (typeof dataURL !== 'string' || dataURL.indexOf('data:') !== 0) return null;
    try {
      const m = dataURL.match(/^data:(.*?);base64,(.*)$/);
      if (!m) return null;
      const mime = m[1] || 'application/octet-stream';
      const bin = atob(m[2]);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime });
    } catch (e) { return null; }
  }
  const BACKUP_STORES = ['attachments', 'versions', 'docs', 'esgAttachments', 'esgVersions', 'facAttachments', 'photos'];
  function convertBackupItem(item) {
    return Storage.serialize(item);
  }
  function restoreBackupItem(item) {
    return Storage.deserialize(item);
  }
  DB.exportFull = function () {
    return Promise.all(BACKUP_STORES.map((name) => Storage.getAll(name).then((items) =>
      Promise.all(items.map(convertBackupItem)).then((converted) => [name, converted])
    ))).then((pairs) => {
      const stores = {};
      pairs.forEach((pair) => { stores[pair[0]] = pair[1]; });
      try {
        return JSON.stringify({ __iar_backup: true, version: 2, exportedAt: new Date().toISOString(), state: state, stores: stores }, null, 2);
      } catch (e) { throw new Error('数据序列化失败：' + e.message); }
    });
  };
  DB.importFull = function (text) {
    let obj;
    try { obj = JSON.parse(text); }
    catch (e) { return Promise.reject(new Error('备份文件损坏或不是有效的 JSON 文件')); }
    if (!obj || !obj.state || typeof obj.state !== 'object') return Promise.reject(new Error('无效的备份文件（缺少数据主体）'));
    const stores = obj.stores && typeof obj.stores === 'object' ? obj.stores : {
      attachments: obj.attachments || [], versions: obj.versions || [], docs: obj.documents || []
    };
    const normalized = {};
    let previousState = null;
    let previousStores = null;
    try { previousState = JSON.parse(JSON.stringify(state || {})); } catch (e) { previousState = state; }
    return Promise.all(BACKUP_STORES.map((name) => Promise.all((Array.isArray(stores[name]) ? stores[name] : []).map(restoreBackupItem)).then((items) => { normalized[name] = items; })))
      .then(() => Promise.all(BACKUP_STORES.map((name) => Storage.getAll(name).then((items) => { (previousStores || (previousStores = {}))[name] = items; }))))
      .then(() => Promise.all(BACKUP_STORES.map(clearStore)))
      .then(() => Promise.all(BACKUP_STORES.flatMap((name) => normalized[name].map((item) => Storage.put(name, item)))))
      .then(() => { state = obj.state; migrateFix(); return saveState(); })
      .catch((error) => {
        state = previousState;
        const restore = previousStores ? Promise.all(BACKUP_STORES.map(clearStore)).then(() => Promise.all(BACKUP_STORES.flatMap((name) => (previousStores[name] || []).map((item) => Storage.put(name, item))))) : Promise.resolve();
        return restore.then(() => saveState().catch(() => {})).then(() => { throw error; });
      });
  };
  function clearStore(name) { return Storage.clear(name); }

  DB.storageEstimate = function () { return Storage.estimate(); };

  DB.reset = function () {
    state = emptyState();
    return Promise.all(BACKUP_STORES.map(clearStore)).then(() => saveState());
  };

  global.DB = DB;
})(window);

/* ===== src/js/esg-seed.js ===== */
/* ESG 问卷模块 · 预设标准与框架种子数据
 * 设计要点：
 *  - 三大披露标准（ISSB / GRI / TCFD）均带 version + effectiveDate，满足"预留标准版本管理接口"。
 *  - 四大主题沿用 EcoVadis 评估模型（环境/劳工与人权/商业道德/可持续采购），权重为可配置默认值（非照搬 EcoVadis 细则）。
 *  - 议题映射表（topicMappings）描述跨标准对应关系，供"多标准合并重叠议题"使用。
 *  - 所有 label 存"中文原文"作为 i18n key，渲染时通过 T() 翻译（切换英文可即时生效）。
 *  - 评分项 itemByTopic[topicCode] 提供结构化字段，支持定量/定性混合填报与 0-100 归一化评分。
 */
(function (global) {
  const ESGSeed = { meta: { schemaVersion: 1, builtAt: '2026-08-17' } };

  // ---------- 三大披露标准（含版本管理） ----------
  ESGSeed.standards = [
    {
      id: 'issb', code: 'ISSB',
      name: 'ISSB 准则', nameEn: 'ISSB Standards',
      version: '2023', effectiveDate: '2024-01-01', publisher: 'ISSB / IFRS Foundation',
      approach: 'financial', approachLabel: '财务重要性',
      summary: '基于 IFRS S1（一般要求）与 IFRS S2（气候相关披露），聚焦 ESG 议题对企业价值的财务影响，与 TCFD 高度衔接。',
      pillars: [
        { code: 'S1', title: 'IFRS S1 一般要求', topics: [
          { code: 'S1-GOV', title: '治理与内部监督', theme: 'ethics' },
          { code: 'S1-WK', title: '员工与人力资本', theme: 'labor' },
          { code: 'S1-ETH', title: '商业道德与反腐败', theme: 'ethics' },
          { code: 'S1-CS', title: '社区与社会影响', theme: 'environment' },
          { code: 'S1-SUP', title: '价值链与供应商', theme: 'procurement' }
        ]},
        { code: 'S2', title: 'IFRS S2 气候相关披露', topics: [
          { code: 'S2-GOV', title: '气候治理', theme: 'ethics' },
          { code: 'S2-RISK', title: '气候相关风险与机遇', theme: 'environment' },
          { code: 'S2-MET', title: '温室气体排放（范围1/2/3）', theme: 'environment' },
          { code: 'S2-TGT', title: '气候转型目标', theme: 'environment' }
        ]}
      ]
    },
    {
      id: 'gri', code: 'GRI',
      name: 'GRI 标准', nameEn: 'GRI Standards',
      version: '2021', effectiveDate: '2023-01-01', publisher: 'Global Reporting Initiative',
      approach: 'impact', approachLabel: '影响重要性',
      summary: '2021 版通用标准 + 议题专项标准，关注组织对经济、环境和社会的影响，全球应用最广、最便于对标。',
      pillars: [
        { code: 'GRI-U', title: 'GRI 通用标准（2021）', topics: [
          { code: 'GRI-2', title: '组织与实质性议题披露', theme: 'ethics' },
          { code: 'GRI-201', title: '经济绩效', theme: 'environment' }
        ]},
        { code: 'GRI-T', title: 'GRI 议题专项标准', topics: [
          { code: 'GRI-302', title: '能源', theme: 'environment' },
          { code: 'GRI-303', title: '水资源', theme: 'environment' },
          { code: 'GRI-304', title: '生物多样性', theme: 'environment' },
          { code: 'GRI-305', title: '排放（温室气体）', theme: 'environment' },
          { code: 'GRI-306', title: '废弃物与循环经济', theme: 'environment' },
          { code: 'GRI-401', title: '雇佣', theme: 'labor' },
          { code: 'GRI-403', title: '职业健康与安全', theme: 'labor' },
          { code: 'GRI-405', title: '多元化与平等机会', theme: 'labor' },
          { code: 'GRI-408', title: '供应链劳工标准（童工）', theme: 'labor' },
          { code: 'GRI-409', title: '供应链劳工标准（强迫劳动）', theme: 'labor' },
          { code: 'GRI-205', title: '反腐败', theme: 'ethics' },
          { code: 'GRI-206', title: '反垄断与公平竞争', theme: 'ethics' },
          { code: 'GRI-418', title: '客户隐私保护', theme: 'ethics' },
          { code: 'GRI-308', title: '供应商环境评估', theme: 'procurement' },
          { code: 'GRI-414', title: '供应商社会评估', theme: 'procurement' }
        ]}
      ]
    },
    {
      id: 'tcfd', code: 'TCFD',
      name: 'TCFD 框架', nameEn: 'TCFD Framework',
      version: '2017', effectiveDate: '2017-06-01', publisher: '金融稳定理事会 FSB',
      approach: 'financial', approachLabel: '气候财务风险',
      summary: '围绕治理、战略、风险管理、指标和目标四大支柱，聚焦气候相关财务风险与机遇，已被 ISSB S2 吸收。',
      pillars: [
        { code: 'TCFD-G', title: '治理', topics: [
          { code: 'TCFD-G', title: '气候相关治理', theme: 'ethics' }
        ]},
        { code: 'TCFD-S', title: '战略', topics: [
          { code: 'TCFD-S', title: '气候风险与机遇对战略的影响', theme: 'environment' }
        ]},
        { code: 'TCFD-R', title: '风险管理', topics: [
          { code: 'TCFD-R', title: '气候风险管理流程', theme: 'environment' }
        ]},
        { code: 'TCFD-M', title: '指标和目标', topics: [
          { code: 'TCFD-M', title: '温室气体排放指标与目标', theme: 'environment' }
        ]}
      ]
    }
  ];

  // ---------- EcoVadis 四大主题（权重为可配置默认值） ----------
  ESGSeed.themes = [
    { id: 'environment', name: '环境', weight: 25, desc: '碳排放、能源、水资源、废弃物与生物多样性' },
    { id: 'labor', name: '劳工与人权', weight: 25, desc: '员工权益、职业健康安全、多元化与供应链劳工标准' },
    { id: 'ethics', name: '商业道德', weight: 20, desc: '反腐败、反垄断、数据隐私与商业操守' },
    { id: 'procurement', name: '可持续采购', weight: 30, desc: '供应商 ESG 评估、绿色采购与供应链透明度' }
  ];

  // ---------- 评分项模板：按 topicCode 索引 ----------
  // type: yesno|number|rating|select|text
  // number 需 target+direction 或 min+max 才能归一化；text 为定性项（不计入分值，仅计披露完整度）
  function it(key, label, type, extra) {
    return Object.assign({ key: key, label: label, type: type, required: false, weight: 1, qualitative: false }, extra || {});
  }
  ESGSeed.itemByTopic = {
    'S1-GOV': [ it('s1gov_p', '是否建立 ESG/可持续发展治理机构（如董事会下设委员会）？', 'yesno', { required: true }) ],
    'S1-WK': [
      it('s1wk_train', '年度员工培训覆盖率（%）', 'number', { unit: '%', min: 0, max: 100, target: 90, direction: 'higher' }),
      it('s1wk_policy', '是否制定人力资本发展与福祉政策？', 'yesno')
    ],
    'S1-ETH': [ it('s1eth_code', '是否发布并公示商业行为准则？', 'yesno', { required: true }) ],
    'S1-CS': [ it('s1cs_comm', '社区投入金额占营收比（%）', 'number', { unit: '%', min: 0, target: 1, direction: 'higher', required: false }) ],
    'S1-SUP': [
      it('s1sup_audit', '是否对供应商开展 ESG 审核？', 'yesno', { required: true }),
      it('s1sup_rate', '经 ESG 审核的供应商占比（%）', 'number', { unit: '%', min: 0, max: 100, target: 70, direction: 'higher' })
    ],
    'S2-GOV': [ it('s2gov_resp', '是否指定高管对气候议题负责？', 'yesno', { required: true }) ],
    'S2-RISK': [
      it('s2risk_scen', '是否开展气候情景分析？', 'yesno', { required: true }),
      it('s2risk_opp', '已识别的气候相关机遇数量', 'number', { min: 0, target: 3, direction: 'higher' })
    ],
    'S2-MET': [
      it('s2met_s1', '范围1+2温室气体排放（tCO2e）', 'number', { unit: 'tCO2e', min: 0, target: 5000, direction: 'lower', required: true }),
      it('s2met_s3', '是否披露范围3排放？', 'yesno', { required: true }),
      it('s2met_int', '单位营收碳排放强度（tCO2e/百万元）', 'number', { unit: 'tCO2e/M¥', min: 0, target: 50, direction: 'lower' })
    ],
    'S2-TGT': [
      it('s2tgt_sbti', '是否设定科学碳目标（SBTi）？', 'yesno', { required: true }),
      it('s2tgt_year', '碳中和目标年份', 'number', { unit: '年', min: 2030, max: 2070, target: 2050, direction: 'lower' })
    ],
    'GRI-2': [ it('gri2_mat', '是否开展实质性议题评估？', 'yesno', { required: true }) ],
    'GRI-201': [ it('gri201_econ', '年度经济绩效（净利润，万元）', 'number', { unit: '万元', min: 0, target: 1000, direction: 'higher' }) ],
    'GRI-302': [
      it('gri302_int', '单位产出能耗（kWh/单位）', 'number', { unit: 'kWh', min: 0, target: 100, direction: 'lower' }),
      it('gri302_renew', '可再生能源占比（%）', 'number', { unit: '%', min: 0, max: 100, target: 50, direction: 'higher' })
    ],
    'GRI-303': [ it('gri303_water', '单位产出取水强度（吨/单位）', 'number', { unit: '吨', min: 0, target: 10, direction: 'lower' }) ],
    'GRI-304': [ it('gri304_bio', '是否开展生物多样性影响评估？', 'yesno') ],
    'GRI-305': [
      it('gri305_ghg', '温室气体排放总量（tCO2e）', 'number', { unit: 'tCO2e', min: 0, target: 5000, direction: 'lower', required: true }),
      it('gri305_sbti', '是否设定减排目标？', 'yesno', { required: true })
    ],
    'GRI-306': [ it('gri306_circ', '废弃物回收利用率（%）', 'number', { unit: '%', min: 0, max: 100, target: 75, direction: 'higher' }) ],
    'GRI-401': [
      it('gri401_rate', '员工流失率（%）', 'number', { unit: '%', min: 0, max: 100, target: 15, direction: 'lower' }),
      it('gri401_fair', '是否提供公平薪酬（≥当地最低工资）？', 'yesno', { required: true })
    ],
    'GRI-403': [
      it('gri403_ltifr', '工伤事故率（LTIFR）', 'number', { unit: '‰', min: 0, target: 2, direction: 'lower', required: true }),
      it('gri403_rate', '职业健康安全管理评分', 'rating', { max: 5 }),
      it('gri403_ohs', '是否通过 ISO 45001 认证？', 'yesno')
    ],
    'GRI-405': [
      it('gri405_woman', '女性管理者占比（%）', 'number', { unit: '%', min: 0, max: 100, target: 35, direction: 'higher' }),
      it('gri405_train', '是否提供多元化与反歧视培训？', 'yesno')
    ],
    'GRI-408': [ it('gri408_child', '是否发现童工违规？', 'yesno', { required: true }) ],
    'GRI-409': [ it('gri409_force', '是否发现强迫劳动？', 'yesno', { required: true }) ],
    'GRI-205': [
      it('gri205_anti', '是否建立反腐败制度并开展培训？', 'yesno', { required: true }),
      it('gri205_case', '过去年度腐败相关案件数', 'number', { min: 0, target: 0, direction: 'lower' })
    ],
    'GRI-206': [ it('gri206_comp', '是否遵守反垄断与公平竞争法规？', 'yesno', { required: true }) ],
    'GRI-418': [ it('gri418_privacy', '是否通过数据隐私认证（如 ISO 27701）？', 'yesno') ],
    'GRI-308': [
      it('gri308_env', '是否对供应商开展环境评估？', 'yesno', { required: true }),
      it('gri308_rate', '供应商环境合规率（%）', 'number', { unit: '%', min: 0, max: 100, target: 80, direction: 'higher' })
    ],
    'GRI-414': [
      it('gri414_social', '是否对供应商开展社会评估？', 'yesno', { required: true }),
      it('gri414_code', '是否要求供应商签署行为准则？', 'yesno')
    ],
    'TCFD-G': [ it('tcfd_g_resp', '董事会是否监督气候风险？', 'yesno', { required: true }) ],
    'TCFD-S': [ it('tcfd_s_impact', '是否量化气候风险对财务的影响？', 'yesno', { required: true }) ],
    'TCFD-R': [ it('tcfd_r_proc', '是否将气候风险纳入风险管理流程？', 'yesno', { required: true }) ],
    'TCFD-M': [
      it('tcfd_m_ghg', '是否披露温室气体排放指标？', 'yesno', { required: true }),
      it('tcfd_m_target', '是否设定减排目标？', 'yesno', { required: true })
    ]
  };

  // 通用兜底项：当某议题无专门评分项时，自动生成"管理机制 + 政策说明"，保证每个选题都被覆盖
  ESGSeed.genericItems = function (topicCode) {
    return [
      it(topicCode + '_mgmt', '是否已建立相关管理机制或政策？', 'yesno', { required: false }),
      it(topicCode + '_desc', '政策与措施说明（定性）', 'text', { qualitative: true })
    ];
  };

  // ---------- 跨标准议题映射表（供多标准合并与对标） ----------
  ESGSeed.topicMappings = [
    { group: '碳排放/温室气体', theme: 'environment', codes: ['GRI-305', 'S2-MET', 'TCFD-M'],
      note: 'GRI 305 排放、ISSB S2 温室气体披露、TCFD 指标和目标在碳排放议题上高度一致，合并为同一评分组。' },
    { group: '雇佣/人力资本', theme: 'labor', codes: ['GRI-401', 'S1-WK'],
      note: 'GRI 401 雇佣与 ISSB S1 人力资本披露均覆盖员工权益与发展，可合并填报。' },
    { group: '反腐败', theme: 'ethics', codes: ['GRI-205', 'S1-ETH'],
      note: 'GRI 205 反腐败与 ISSB S1 商业道德规范共同构成商业道德评估。' },
    { group: '供应商评估', theme: 'procurement', codes: ['GRI-308', 'GRI-414', 'S1-SUP'],
      note: 'GRI 308/414 供应商环境与社会评估、ISSB S1 价值链披露合并为可持续采购维度。' },
    { group: '气候治理', theme: 'ethics', codes: ['TCFD-G', 'S2-GOV', 'S1-GOV'],
      note: 'TCFD 治理、ISSB S2 气候治理、ISSB S1 治理共同支撑治理议题。' }
  ];

  // ---------- 行业基准（EcoVadis 式对标，主题均分 0-100） ----------
  ESGSeed.benchmarks = {
    '电子制造': { environment: 62, labor: 58, ethics: 70, procurement: 55 },
    '纺织服装': { environment: 55, labor: 60, ethics: 64, procurement: 52 },
    '化工': { environment: 58, labor: 62, ethics: 68, procurement: 60 },
    '食品加工': { environment: 60, labor: 57, ethics: 66, procurement: 58 },
    '金融': { environment: 66, labor: 65, ethics: 75, procurement: 62 },
    '零售': { environment: 61, labor: 63, ethics: 70, procurement: 59 }
  };
  ESGSeed.benchmarkIndustry = function (industry) { return ESGSeed.benchmarks[industry] || null; };

  // ---------- 标准版本管理接口（满足"预留标准版本管理接口"） ----------
  ESGSeed.standardById = function (id) { return ESGSeed.standards.find((s) => s.id === id) || null; };
  ESGSeed.allTopicCodes = function () {
    const out = [];
    ESGSeed.standards.forEach((s) => s.pillars.forEach((p) => p.topics.forEach((t) => out.push(t.code))));
    return out;
  };

  global.ESGSeed = ESGSeed;
})(window);

/* ===== src/js/carbon.js ===== */
/* 碳排放与温室气体排放计算引擎（ESG 问卷内置模块）
 * ============================================================
 * 定位：作为 ESG 问卷环境（E）维度的内置工具，而非独立页面。
 *  - 采集：能源消耗（电力/天然气/汽油/柴油/煤）、公司车辆、员工通勤、商务差旅、物流运输等活动数据
 *  - 计算：排放量 = 活动数据 × 排放因子（GHG Protocol 三范围分类）
 *  - 展示：实时计算结果 + 三范围结构环形图/条形图（纯 SVG，零依赖，离线可用）
 *  - 联动：结果自动回填 ESG 问卷「环境」维度的 tCO2e 字段（s2met_s1 / gri305_ghg），报告联动
 *  - 渐进式：支持「快速估算」（行业基准）与「完整计算」（逐项填报）双模式
 * 设计原则：
 *  - 准确性：排放因子全部标注【来源 + 更新时间】，不采用未校验因子
 *  - 可追溯：计算过程可审计（每项活动 → 因子 → 排放），满足 ESG 报告合规
 *  - 可行动：基于排放结构生成可落地的减排建议
 *  - 离线：因子库内嵌 + 全部计算在前端完成，PWA 离线可用
 * 数据模型：activity = { [catKey]: 数量 }，如 { grid: 80000, naturalGas: 5000 }。
 */
(function (global) {
  'use strict';
  const Carbon = {};

  /* ---------- 排放因子库（权威来源，标注更新时间） ----------
   * 单位：kgCO2e / 单位活动量。区域：china(中国电网平均) / eu / uk / us。
   * 数据来源：
   *  电力（范围2）：中国电网平均排放因子 0.581 kgCO2e/kWh（生态环境部《关于做好2022年企业温室气体排放报告管理有关工作的通知》），
   *                欧盟 0.251（EEA/AIB 2023），英国 0.212（BEIS/DEFRA 2023），美国 0.386（EPA eGRID 2021 全美平均）。
   *  燃料（范围1）：中国国家发改委《综合能耗计算通则》及 IPCC 2006 指南折算；天然气 2.02 kgCO2e/m³、汽油 2.31 kgCO2e/L、柴油 2.68 kgCO2e/L、原煤 2.42 kgCO2e/kg。
   *  交通（范围1/3）：英国 DEFRA GHG Conversion Factors 2023 平均载客因子 kgCO2e/km（私家车/公交/火车/地铁）；航空 0.255 kgCO2e/km（国内短途平均）。
   */
  const EMISSION_FACTORS = {
    // ---- 范围2：购电/购热 ----
    grid: { label: '电力（购电）', unit: 'kWh', scope: 2, source: '生态环境部电网因子（CN）/ EEA（EU）/ DEFRA（UK）/ EPA eGRID（US）', updated: '2023', byRegion: { china: 0.581, eu: 0.251, uk: 0.212, us: 0.386 } },
    heat: { label: '热力 / 蒸汽', unit: 'GJ', scope: 2, source: '生态环境部《碳排放核算报告指南》', updated: '2022', byRegion: { china: 0.11, eu: 0.06, uk: 0.05, us: 0.09 } },
    // ---- 范围1：燃料燃烧 / 自有车辆 ----
    naturalGas: { label: '天然气', unit: 'm³', scope: 1, source: 'IPCC 2006 / 国家发改委', updated: '2021', factor: 2.02 },
    gasoline: { label: '汽油', unit: 'L', scope: 1, source: 'IPCC 2006 / 国家发改委', updated: '2021', factor: 2.31 },
    diesel: { label: '柴油', unit: 'L', scope: 1, source: 'IPCC 2006 / 国家发改委', updated: '2021', factor: 2.68 },
    coal: { label: '原煤', unit: 'kg', scope: 1, source: 'IPCC 2006 / 国家发改委', updated: '2021', factor: 2.42 },
    companyCar: { label: '自有车辆（汽油）', unit: 'km', scope: 1, source: 'DEFRA 2023 私家车因子', updated: '2023', factor: 0.192 },
    // ---- 范围3：价值链排放 ----
    commute: { label: '员工通勤', unit: 'km', scope: 3, source: 'DEFRA 2023 通勤因子', updated: '2023', factor: 0.171 },
    flight: { label: '商务差旅（航空）', unit: 'km', scope: 3, source: 'DEFRA 2023 短途航空因子', updated: '2023', factor: 0.255 },
    logistics: { label: '物流运输（公路）', unit: 't·km', scope: 3, source: 'DEFRA 2023 HGV 平均因子', updated: '2023', factor: 0.091 },
    bus: { label: '差旅地面交通（公交）', unit: 'km', scope: 3, source: 'DEFRA 2023 公交因子', updated: '2023', factor: 0.103 }
  };

  // 类别到因子映射（供 UI 遍历）
  Carbon.categories = function () { return Object.keys(EMISSION_FACTORS).map(function (k) { return { key: k, label: EMISSION_FACTORS[k].label, unit: EMISSION_FACTORS[k].unit, scope: EMISSION_FACTORS[k].scope, source: EMISSION_FACTORS[k].source, updated: EMISSION_FACTORS[k].updated }; }); };

  // 取单因子（地区优先，无地区用通用 factor）
  Carbon.factorOf = function (catKey, region) {
    const f = EMISSION_FACTORS[catKey];
    if (!f) return 0;
    if (f.byRegion) return (region && f.byRegion[region] != null) ? f.byRegion[region] : f.byRegion.china;
    return f.factor != null ? f.factor : 0;
  };

  // 单活动排放量（kgCO2e）
  Carbon.itemEmissions = function (catKey, qty, region) {
    const n = Number(qty);
    if (!n || isNaN(n) || n < 0) return 0;
    return n * Carbon.factorOf(catKey, region);
  };

  // 按范围汇总活动数据 → { scope1, scope2, scope3, total, items:[{key,qty,emission}], breakdown:{scope1,scope2,scope3} }
  Carbon.compute = function (activity, region) {
    activity = activity || {};
    region = region || 'china';
    let s1 = 0, s2 = 0, s3 = 0;
    const items = [];
    Carbon.categories().forEach(function (c) {
      const qty = activity[c.key];
      const n = Number(qty);
      if (!n || isNaN(n) || n < 0) return;
      const em = n * Carbon.factorOf(c.key, region);
      const scope = c.scope;
      if (scope === 1) s1 += em; else if (scope === 2) s2 += em; else s3 += em;
      items.push({ key: c.key, label: c.label, unit: c.unit, scope: scope, qty: n, emission: em, factor: Carbon.factorOf(c.key, region) });
    });
    return {
      region: region,
      scope1: round1(s1), scope2: round1(s2), scope3: round1(s3),
      total: round1(s1 + s2 + s3),
      breakdown: { scope1: round1(s1), scope2: round1(s2), scope3: round1(s3) },
      items: items,
      sources: collectSources(activity, region)
    };
  };

  function collectSources(activity, region) {
    const out = [];
    Carbon.categories().forEach(function (c) {
      const n = Number(activity[c.key]);
      if (!n || isNaN(n) || n < 0) return;
      const f = EMISSION_FACTORS[c.key];
      out.push({ key: c.key, label: c.label, factor: Carbon.factorOf(c.key, region), source: f.source, updated: f.updated, unit: c.unit });
    });
    return out;
  }

  // 快速估算：基于行业基准 + 员工规模估算范围1/2/3（tCO2e）。industry: 电子制造等；employees: 人数
  Carbon.estimate = function (industry, employees) {
    employees = Math.max(1, Number(employees) || 1);
    const base = {
      '电子制造': { s1: 90, s2: 420, s3: 240 },
      '纺织服装': { s1: 80, s2: 360, s3: 300 },
      '化工': { s1: 520, s2: 800, s3: 460 },
      '食品加工': { s1: 210, s2: 480, s3: 340 },
      '金融': { s1: 12, s2: 90, s3: 160 },
      '零售': { s1: 40, s2: 210, s3: 260 }
    };
    const b = base[industry] || { s1: 60, s2: 260, s3: 220 };
    // 以 100 名员工为基准线性缩放
    const k = employees / 100;
    return { scope1: round1(b.s1 * k), scope2: round1(b.s2 * k), scope3: round1(b.s3 * k), total: round1((b.s1 + b.s2 + b.s3) * k), estimated: true };
  };

  // 减排建议：基于三范围占比生成可行动建议
  Carbon.reductionTips = function (result) {
    if (!result || !result.total) return [];
    const tips = [];
    const r1 = result.scope1 / result.total, r2 = result.scope2 / result.total, r3 = result.scope3 / result.total;
    const TH = 0.35, MID = 0.15;
    if (r1 >= TH) tips.push({ scope: 1, text: T('范围1占比高（') + Math.round(r1 * 100) + T('%）：优先提升燃料利用效率、自有车队电动化，或评估锅炉/窑炉电气化改造。') });
    if (r2 >= MID) tips.push({ scope: 2, text: T('范围2占比 ') + Math.round(r2 * 100) + T('%）：优先购买绿电/绿证、提高可再生能源用电占比、部署分布式光伏。') });
    if (r3 >= MID) tips.push({ scope: 3, text: T('范围3占比 ') + Math.round(r3 * 100) + T('%）：推进供应商低碳采购、优化物流线路、鼓励员工低碳通勤与视频会议替代差旅。') });
    if (!tips.length) tips.push({ scope: 0, text: T('当前排放结构均衡：建议按「范围2 → 范围1 → 范围3」顺序逐步减排，并设定科学碳目标（SBTi）。') });
    return tips;
  };

  function round1(n) { return Math.round(n * 10) / 10; }

  /* ---------- 可视化：纯 SVG（零依赖，离线可用） ---------- */

  // 三范围结构环形图。result: compute() 返回值。返回 SVG 字符串
  Carbon.donutSvg = function (result, opts) {
    opts = opts || {};
    const size = opts.size || 200, cx = size / 2, cy = size / 2, r = opts.r || (size * 0.34);
    const data = [
      { name: T('范围1'), value: result.scope1, color: '#C0392B' },
      { name: T('范围2'), value: result.scope2, color: '#2E7BC4' },
      { name: T('范围3'), value: result.scope3, color: '#1E8E5A' }
    ];
    const total = data.reduce((a, d) => a + d.value, 0);
    if (!total) {
      return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="100%" style="max-width:' + size + 'px"><text x="' + cx + '" y="' + cy + '" text-anchor="middle" fill="#9aa3b2" font-size="12">' + T('暂无数据') + '</text></svg>';
    }
    let html = '<svg viewBox="0 0 ' + size + ' ' + size + '" width="100%" style="max-width:' + size + 'px">';
    let angle = -Math.PI / 2;
    const labelPts = [];
    data.forEach(function (d) {
      const frac = d.value / total;
      if (frac <= 0) return;
      const a2 = angle + frac * 2 * Math.PI;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const large = frac > 0.5 ? 1 : 0;
      const mid = angle + frac * Math.PI;
      labelPts.push({ name: d.name, value: d.value, percent: frac, x: cx + (r + size * 0.26) * Math.cos(mid), y: cy + (r + size * 0.26) * Math.sin(mid) });
      html += '<path d="M' + cx + ',' + cy + ' L' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + x2 + ',' + y2 + ' Z" fill="' + d.color + '" stroke="#fff" stroke-width="1.5"/>';
      angle = a2;
    });
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.62) + '" fill="#fff"/>';
    html += '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="20" font-weight="700" fill="#1F2937">' + fmtTon(result.total) + '</text>';
    html += '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="10" fill="#6b7a90">tCO₂e</text>';
    // 图例
    let ly = size + 14;
    labelPts.forEach(function (d) {
      html += '<g><circle cx="14" cy="' + ly + '" r="5" fill="' + data.find(x => x.name === d.name).color + '"/><text x="24" y="' + (ly + 4) + '" font-size="11" fill="#333">' + d.name + ' ' + fmtTon(d.value) + ' t · ' + Math.round(d.percent * 100) + '%</text></g>';
      ly += 18;
    });
    html += '</svg>';
    return html;
  };

  // 各项排放横向条形图（按排放量降序）。result: compute() 返回值
  Carbon.barsSvg = function (result, opts) {
    opts = opts || {};
    const w = opts.width || 560, barH = 22, gap = 6, labelW = 120, valW = 110;
    const rows = result.items.slice().sort((a, b) => b.emission - a.emission);
    if (!rows.length) return '<div class="muted" style="padding:8px">' + T('暂无排放数据') + '</div>';
    const maxE = Math.max.apply(null, rows.map((r) => r.emission));
    const h = rows.length * (barH + gap) + 10;
    const scopeColor = { 1: '#C0392B', 2: '#2E7BC4', 3: '#1E8E5A' };
    let html = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:' + w + 'px">';
    rows.forEach(function (r, i) {
      const y = 10 + i * (barH + gap);
      const bw = maxE ? Math.max(4, (r.emission / maxE) * (w - labelW - valW - 20)) : 0;
      html += '<text x="0" y="' + (y + barH - 6) + '" font-size="11" fill="#4b5563" text-anchor="start">' + esc(r.label) + '</text>';
      html += '<rect x="' + labelW + '" y="' + y + '" width="' + (w - labelW - valW - 20) + '" height="' + barH + '" rx="4" fill="#eef2f7"/>';
      if (bw > 0) html += '<rect x="' + labelW + '" y="' + y + '" width="' + bw + '" height="' + barH + '" rx="4" fill="' + scopeColor[r.scope] + '" opacity="0.85"/>';
      html += '<text x="' + (w - valW) + '" y="' + (y + barH - 6) + '" font-size="11" font-weight="600" fill="#1F2937" text-anchor="end">' + fmtTon(r.emission) + ' t</text>';
    });
    html += '</svg>';
    return html;
  };

  // 导出：tCO2e 数值格式化（≥1000 显示 k）
  function fmtTon(n) {
    n = Number(n) || 0;
    if (n >= 1000) return (Math.round(n) / 1000).toFixed(1) + 'k';
    return String(Math.round(n * 10) / 10);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // 测试钩子
  Carbon._fmtTon = fmtTon;
  Carbon._factor = EMISSION_FACTORS;

  global.Carbon = Carbon;
})(window);

/* ===== src/js/designer.js ===== */
/* 问卷设计器 v5 —— 三栏所见即所得编辑器（SUP-QD UX 全面重构）
 * ============================================================
 * 优化目标：用户操作体验流畅、稳定、方便；聚焦核心问卷设计体验。
 *   1. 问卷列表模式：实时浏览全部已设计问卷（状态管理 / 检索 / 快捷操作）
 *   2. 编辑模式三栏布局：题型组件库（左） | 编辑区（中） | 实时预览（右），所见即所得
 *   3. 拖拽编辑：组件库拖入新题、编辑区内拖动题目/章节排序、点击组件快捷追加
 *   4. 实时自动保存：修改 500ms 防抖落库 + 「已保存」状态提示 + 手动保存草稿双保障
 *   5. 预览：右栏实时同步（整卷/单题 × 手机/平板/PC）+ 全屏预览（可测试填写，数据不落库）
 *   6. 功能精简：移除题目编辑弹框/档案库入口/问卷库弹窗；导出导入收纳至「设置 → 高级工具」
 *   7. 题量提示：实时显示题目数量，无数量上限（不再限制题量）
 * 数据模型与「评估填写」「报告导出」完全兼容（modules/questions 字段不变）。
 * 状态流转：draft（草稿）→ published（进行中）→ paused（已暂停）→ closed（已结束）
 */
(function (global) {
  'use strict';
  const Designer = {};

  /* ---------- 局部 SVG 图标 ---------- */
  const SVG_WRAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">';
  const ICO = {
    grip: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="9" cy="5" r="1.7"/><circle cx="15" cy="5" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="19" r="1.7"/><circle cx="15" cy="19" r="1.7"/></svg>',
    copy: SVG_WRAP + '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    phone: SVG_WRAP + '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
    tablet: SVG_WRAP + '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M11 18.5h2"/></svg>',
    pc: SVG_WRAP + '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg>',
    back: SVG_WRAP + '<path d="M15 18l-6-6 6-6"/></svg>',
    blank: SVG_WRAP + '<path d="M12 5v14M5 12h14"/></svg>',
    tpl: SVG_WRAP + '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h7M14 17h7M17.5 14v6"/></svg>',
    dup: SVG_WRAP + '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    types: {
      yesno: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
      single: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/>',
      multi: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 12l2 2 4-4"/>',
      text: '<path d="M4 7h16M4 12h10M4 17h13"/>',
      textarea: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 10h8M8 14h5"/>',
      number: '<path d="M5 9h14M5 15h14M9 5l-1 14M16 5l-1 14"/>',
      date: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
      rating: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>'
    }
  };
  function typeIcon(v) { return SVG_WRAP + (ICO.types[v] || '') + '</svg>'; }

  /* ---------- 题型 / 状态（渲染时翻译，语言切换即时生效） ---------- */
  function qTypes() {
    return [
      { v: 'single', t: T('单选') }, { v: 'multi', t: T('多选') }, { v: 'yesno', t: T('是否') },
      { v: 'rating', t: T('评分') }, { v: 'text', t: T('填空') }, { v: 'textarea', t: T('长文本') },
      { v: 'number', t: T('数字') }, { v: 'date', t: T('日期') }
    ];
  }
  function typeLabel(v) { const x = qTypes().find(function (t) { return t.v === v; }); return x ? x.t : v; }

  function qnStatuses() {
    return [
      { v: 'draft', t: T('草稿'), cls: 'gray' },
      { v: 'published', t: T('进行中'), cls: 'ok' },
      { v: 'paused', t: T('已暂停'), cls: 'warn' },
      { v: 'closed', t: T('已结束'), cls: 'gray' }
    ];
  }
  function statusInfo(v) { const x = qnStatuses().find(function (s) { return s.v === v; }); return x || qnStatuses()[0]; }
  function statusTagEl(qn) {
    const info = statusInfo(qn.status);
    return Util.el('span', { class: 'tag ' + info.cls, text: info.t });
  }

  /* ---------- 模块状态 ---------- */
  const st = {
    mode: 'list',           // list（问卷列表） | edit（三栏编辑器）
    qnId: null,             // 当前问卷
    modId: null, qId: null, // 编辑区选中章节 / 题目（null = 收起行内编辑器）
    filter: 'all', search: '',
    save: 'saved',          // saved | dirty | saving | error
    lastSavedAt: null,
    preview: { device: 'pc', single: false, idx: 0, answers: {} },
    fullscreen: false
  };
  function currentQn() { return st.qnId ? DB.getQuestionnaire(st.qnId) : null; }
  function currentMod() { const qn = currentQn(); return qn ? qn.modules.find(function (m) { return m.id === st.modId; }) : null; }
  function questionCount(qn) { return (qn.modules || []).reduce(function (s, m) { return s + ((m.questions || []).length || 0); }, 0); }
  function allQuestions(qn) {
    const out = [];
    (qn.modules || []).forEach(function (m) { (m.questions || []).forEach(function (q) { out.push({ mod: m, q: q }); }); });
    return out;
  }
  function buildNumberMap(qn) {
    const map = {}; let i = 0;
    (qn.modules || []).forEach(function (m) { (m.questions || []).forEach(function (q) { map[q.id] = ++i; }); });
    return map;
  }
  function qnum(q, auto) { return (q && q.no && String(q.no).trim()) ? String(q.no).trim() : ('Q' + (auto || '')); }
  function fmtClock(ts) {
    const d = new Date(ts); if (isNaN(d)) return '';
    const p = function (n) { return n < 10 ? '0' + n : n; };
    return p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ---------- 保存管线：500ms 防抖自动保存 + 状态徽标 ---------- */
  let saveTimer = null, prevTimer = null;
  function setSaveState(s) { st.save = s; updateSaveBadge(); }
  function updateSaveBadge() {
    const el = document.getElementById('qdSaveBadge'); if (!el) return;
    el.className = 'qd-save-badge ' + st.save;
    let txt = '';
    if (st.save === 'saved') txt = T('已保存') + (st.lastSavedAt ? ' · ' + fmtClock(st.lastSavedAt) : '');
    else if (st.save === 'dirty') txt = T('未保存更改');
    else if (st.save === 'saving') txt = T('保存中…');
    else if (st.save === 'error') txt = T('保存失败');
    el.textContent = txt;
  }
  function markDirty() {
    const qn = currentQn(); if (!qn) return;
    qn.updatedAt = Date.now();
    setSaveState('dirty');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { flushSave(); }, 500);
  }
  function flushSave() {
    clearTimeout(saveTimer);
    const qn = currentQn();
    if (!qn) return Promise.resolve(false);
    setSaveState('saving');
    return DB.updateQuestionnaire(qn.id, { title: qn.title, description: qn.description, status: qn.status, modules: qn.modules, updatedAt: qn.updatedAt })
      .then(function () { st.lastSavedAt = Date.now(); setSaveState('saved'); return true; })
      .catch(function () { setSaveState('error'); return false; });
  }
  // 意外关闭 / 切后台时冲刷未保存修改（数据本地落盘，双保障）
  try {
    global.addEventListener('pagehide', function () { if (st.mode === 'edit') flushSave(); });
    global.document.addEventListener('visibilitychange', function () {
      try { if (document.visibilityState === 'hidden' && st.mode === 'edit' && st.save === 'dirty') flushSave(); } catch (e) {}
    });
  } catch (e) {}

  /* ---------- 预览同步（120ms 微防抖，键入即时可见） ---------- */
  function schedulePreview() {
    clearTimeout(prevTimer);
    // 编辑区可能在局部重绘后才重新挂载预览容器，下一帧再检查可避免更新丢失。
    prevTimer = setTimeout(function () {
      if (st.mode === 'edit' && document.getElementById('qdPreviewCol')) renderPreviewPanels();
    }, 120);
  }
  function previewHidden() { try { return global.localStorage.getItem('qd_preview_hidden') === '1'; } catch (e) { return false; } }
  function togglePreview() {
    try { global.localStorage.setItem('qd_preview_hidden', previewHidden() ? '0' : '1'); } catch (e) {}
    rerender();
  }

  /* ---------- 拖拽状态 ---------- */
  let DND = null; // {kind:'new',type} | {kind:'q',modId,qId} | {kind:'mod',modId}
  function clearDndClasses() {
    const root = global.document; if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('.dnd-over,.dnd-before,.dnd-after,.dnd-mod-over,.dnd-dragging').forEach(function (e) {
      e.classList.remove('dnd-over', 'dnd-before', 'dnd-after', 'dnd-mod-over', 'dnd-dragging');
    });
  }

  /* ---------- 入口 ---------- */
  Designer.render = function (mount) {
    if (!mount) return;
    mount.innerHTML = '';
    const qn = currentQn();
    if (st.mode === 'edit' && qn) renderEdit(mount, qn);
    else { st.mode = 'list'; renderList(mount); }
    if (st.mode === 'edit') renderPreviewPanels();
  };
  function rerender() {
    const mount = document.getElementById('content');
    if (!mount) return;
    const top = mount.scrollTop || 0;
    Designer.render(mount);
    try { mount.scrollTop = top; } catch (e) {}
  }

  /* ============================================================
   * 一、问卷列表模式：实时浏览已设计问卷
   * ============================================================ */
  function renderList(mount) {
    mount.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('问卷设计') }),
        Util.el('div', { class: 'muted', text: T('浏览与管理已设计的评估问卷 · 点击「编辑」进入所见即所得设计器') })
      ]),
      Util.el('div', { class: 'btn-row' }, [
        Util.el('button', { class: 'btn btn-primary', id: 'qdNewBtn', html: Util.icon('plus') + ' ' + T('新建问卷'), onclick: function () { openNewQn(); } })
      ])
    ]));

    // 状态筛选 + 搜索（一次一排，层级不超过 2）
    const bar = Util.el('div', { class: 'qd-lib-bar' });
    const chips = Util.el('div', { class: 'qd-chips' });
    [['all', T('全部')]].concat(qnStatuses().map(function (s) { return [s.v, s.t]; })).forEach(function (p) {
      const c = Util.el('button', { class: 'qd-chip' + (st.filter === p[0] ? ' active' : ''), text: p[1] });
      c.addEventListener('click', function () { st.filter = p[0]; rerender(); });
      chips.appendChild(c);
    });
    bar.appendChild(chips);
    const search = Util.el('input', { type: 'text', class: 'qd-lib-search', placeholder: T('搜索问卷标题…'), value: st.search || '' });
    search.addEventListener('input', function () { st.search = search.value; refreshList(); });
    bar.appendChild(search);
    mount.appendChild(bar);

    const listEl = Util.el('div', { class: 'qd-cards', id: 'qdCards' });
    mount.appendChild(listEl);
    refreshList();
  }

  function refreshList() {
    const listEl = document.getElementById('qdCards'); if (!listEl) return;
    const state = DB.get();
    let arr = (state.questionnaires || []).slice();
    if (st.filter !== 'all') arr = arr.filter(function (x) { return (x.status || 'draft') === st.filter; });
    const kw = (st.search || '').trim().toLowerCase();
    if (kw) arr = arr.filter(function (x) { return ((x.title || '') + ' ' + (x.description || '')).toLowerCase().indexOf(kw) >= 0; });
    arr.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); }); // 最近更新优先，实时反映编辑
    listEl.innerHTML = '';
    if (!arr.length) {
      listEl.appendChild(Util.el('div', { class: 'empty', text: (kw || st.filter !== 'all') ? T('没有符合条件的问卷') : T('暂无问卷，点击「新建问卷」开始设计。') }));
      return;
    }
    arr.forEach(function (qn) { listEl.appendChild(listCard(qn)); });
  }

  function listCard(qn) {
    const modN = (qn.modules || []).length;
    const qN = questionCount(qn);
    const c = Util.el('div', { class: 'qd-card', dataset: { qnId: qn.id } });
    const main = Util.el('div', { class: 'qd-card-main', title: T('点击进入编辑'), onclick: function () { enterEdit(qn.id); } }, [
      Util.el('div', { class: 'qd-card-title', html: Util.esc(qn.title || T('（未命名问卷）')) }),
      Util.el('div', { class: 'qd-card-meta', text: T('更新 ') + Util.fmtDateTime(qn.updatedAt) + ' · ' + modN + ' ' + T('章节') + ' · ' + qN + ' ' + T('题') })
    ]);
    const side = Util.el('div', { class: 'qd-card-side' });
    side.appendChild(statusTagEl(qn));
    const statusSel = Util.el('select', { class: 'qd-card-status', title: T('问卷状态') });
    qnStatuses().forEach(function (s) {
      const o = Util.el('option', { value: s.v, text: s.t });
      if (s.v === (qn.status || 'draft')) o.selected = true;
      statusSel.appendChild(o);
    });
    statusSel.addEventListener('change', function (e) {
      DB.updateQuestionnaire(qn.id, { status: e.target.value });
      Util.toast(T('状态已更新'), 'ok');
      refreshList();
    });
    side.appendChild(statusSel);
    const ops = Util.el('div', { class: 'qd-card-ops' }, [
      Util.el('button', { class: 'btn btn-primary btn-sm', text: T('编辑'), onclick: function () { enterEdit(qn.id); } }),
      Util.el('button', { class: 'btn btn-sm', text: T('预览'), onclick: function () { previewFromList(qn.id); } }),
      Util.el('button', { class: 'btn-icon', title: T('复制问卷'), html: ICO.copy, onclick: function (e) { e.stopPropagation(); const cp = duplicateQn(qn.id); if (cp) { refreshList(); Util.toast(T('已复制问卷'), 'ok'); } } }),
      Util.el('button', { class: 'btn-icon', title: T('删除'), html: Util.icon('trash'), onclick: function (e) { e.stopPropagation(); deleteQn(qn.id); } })
    ]);
    c.appendChild(main); c.appendChild(side); c.appendChild(ops);
    return c;
  }

  function enterEdit(id) {
    st.qnId = id; st.mode = 'edit';
    st.modId = null; st.qId = null;
    st.save = 'saved'; st.lastSavedAt = Date.now();
    st.preview.idx = 0; st.preview.answers = {};
    rerender();
  }
  function goList() { flushSave(); st.mode = 'list'; st.qId = null; st.modId = null; rerender(); }
  function previewFromList(id) { st.qnId = id; openFullscreen(); }

  /* ---------- 新建问卷（三步流程 · 第一步：选择模板） ---------- */
  function openNewQn() {
    const state = DB.get();
    let choice = 'blank', copyId = '';
    const body = Util.el('div', {});
    body.appendChild(Util.el('div', { class: 'tip', style: 'margin:0 0 12px', text: T('三步完成：选择模板 → 拖拽编辑 → 保存发布') }));

    const cards = Util.el('div', {});
    const copySel = Util.el('select', { style: 'margin-top:8px' });
    (state.questionnaires || []).forEach(function (x) { copySel.appendChild(Util.el('option', { value: x.id, text: x.title || T('（未命名问卷）') })); });
    if (!(state.questionnaires || []).length) copySel.appendChild(Util.el('option', { value: '', text: T('暂无可复制的问卷') }));

    const defs = [
      { k: 'blank', ico: ICO.blank, t: T('从空白开始'), d: T('创建一个空问卷，从零开始设计') },
      { k: 'default', ico: ICO.tpl, t: T('系统默认模板'), d: T('预置 SLCP 核心议题审核问卷（9 章节题库）') },
      { k: 'copy', ico: ICO.dup, t: T('复制现有问卷'), d: T('在已有问卷基础上快速修改') }
    ];
    const cardEls = {};
    defs.forEach(function (def) {
      const card = Util.el('div', { class: 'qd-tpl-card' + (choice === def.k ? ' active' : '') }, [
        Util.el('span', { class: 'qd-tpl-ico', html: def.ico }),
        Util.el('div', { class: 'qd-tpl-body' }, [
          Util.el('div', { class: 'qd-tpl-t', text: def.t }),
          Util.el('div', { class: 'qd-tpl-d', text: def.d }),
          def.k === 'copy' ? copySel : null
        ])
      ]);
      card.addEventListener('click', function () {
        choice = def.k;
        Object.keys(cardEls).forEach(function (k) { cardEls[k].classList.toggle('active', k === def.k); });
        if (def.k === 'copy' && copySel.options.length) copyId = copySel.value;
      });
      cardEls[def.k] = card;
      cards.appendChild(card);
    });
    body.appendChild(cards);
    copySel.addEventListener('change', function () { copyId = copySel.value; });

    Util.modal(T('新建问卷 · 选择模板'), body, [
      Util.el('button', { class: 'btn', onclick: function () { Util.closeModal(); } }, T('取消')),
      Util.el('button', { class: 'btn btn-primary', text: T('创建问卷'), onclick: function () {
        if (choice === 'copy' && !copyId) { Util.toast(T('暂无可复制的问卷'), 'err'); return; }
        Util.closeModal();
        newQuestionnaire(choice, copyId);
      } })
    ], { wide: true });
  }

  function newQuestionnaire(kind, srcId) {
    let qn = null;
    if (kind === 'default' && global.DB && typeof DB.defaultQuestionnaire === 'function') {
      qn = DB.defaultQuestionnaire();
      qn.title = T('系统默认模板（副本）');
    } else if (kind === 'copy' && srcId) {
      const src = DB.getQuestionnaire(srcId);
      if (src) {
        qn = JSON.parse(JSON.stringify(src));
        qn.id = Util.uid('qn');
        qn.title = (src.title || T('未命名问卷')) + T('（副本）');
        (qn.modules || []).forEach(function (m) { m.id = Util.uid('mod'); (m.questions || []).forEach(function (q) { q.id = Util.uid('q'); }); });
      }
    }
    if (!qn) {
      qn = { id: Util.uid('qn'), title: '', description: '', createdAt: Date.now(), updatedAt: Date.now(), status: 'draft', modules: [{ id: Util.uid('mod'), title: T('第一章节'), questions: [] }] };
    }
    qn.createdAt = qn.createdAt || Date.now();
    qn.status = qn.status || 'draft';
    qn.updatedAt = Date.now();
    DB.addQuestionnaire(qn);
    st.qnId = qn.id; st.mode = 'edit'; st.modId = null; st.qId = null;
    st.save = 'saved'; st.lastSavedAt = Date.now();
    st.preview.idx = 0; st.preview.answers = {};
    rerender();
    const ti = document.getElementById('qdTitleInp');
    if (ti) { try { ti.focus(); } catch (e) {} }
    Util.toast(T('已创建，开始拖拽设计吧'), 'ok');
    return qn;
  }

  function duplicateQn(id) {
    const src = DB.getQuestionnaire(id); if (!src) return null;
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = Util.uid('qn');
    copy.title = (src.title || T('未命名问卷')) + T('（副本）');
    copy.createdAt = Date.now(); copy.updatedAt = Date.now();
    copy.status = 'draft';
    (copy.modules || []).forEach(function (m) { m.id = Util.uid('mod'); (m.questions || []).forEach(function (q) { q.id = Util.uid('q'); }); });
    DB.addQuestionnaire(copy);
    return copy;
  }

  function deleteQn(id) {
    const qn = DB.getQuestionnaire(id); if (!qn) return;
    const cnt = (DB.get().assessments || []).filter(function (a) { return a.questionnaireId === id; }).length;
    const msg = T('确认删除「') + (qn.title || T('未命名问卷')) + '」？' +
      (cnt ? T('已有 {1} 份评估记录关联，评估记录不会删除，但将无法继续基于该问卷填写。', cnt) : T('此操作不可撤销。'));
    Util.confirm(T('删除问卷'), msg, T('删除')).then(function (ok) {
      if (!ok) return;
      DB.deleteQuestionnaire(id);
      if (st.qnId === id) { st.qnId = null; st.mode = 'list'; st.qId = null; st.modId = null; }
      rerender();
      Util.toast(T('已删除问卷'), 'ok');
    });
  }

  /* ============================================================
   * 二、编辑模式：三栏所见即所得
   * ============================================================ */
  function renderEdit(mount, qn) {
    const wrap = Util.el('div', { class: 'qd' });
    wrap.appendChild(renderToolbar(qn));
    const grid = Util.el('div', { class: 'qd-grid' + (previewHidden() ? ' qd-no-preview' : '') });
    grid.appendChild(renderPalette(qn));
    grid.appendChild(renderCanvas(qn));
    grid.appendChild(renderPreviewCol());
    wrap.appendChild(grid);
    mount.appendChild(wrap);
    updateSaveBadge(); // 挂载后再刷新徽标文案（渲染期元素不在文档树，getElementById 取不到）
  }

  /* ---------- 顶部工具栏（仅保留核心操作） ---------- */
  function renderToolbar(qn) {
    const bar = Util.el('div', { class: 'qd-top' });
    bar.appendChild(Util.el('button', { class: 'btn btn-ghost', title: T('返回列表'), html: ICO.back, onclick: function () { goList(); } }));
    const titleInp = Util.el('input', { type: 'text', class: 'qd-title-inp', id: 'qdTitleInp', value: qn.title || '', placeholder: T('问卷标题（点击输入）'), title: T('问卷标题（点击输入）') });
    titleInp.addEventListener('input', function () { qn.title = titleInp.value; markDirty(); schedulePreview(); });
    bar.appendChild(titleInp);
    const tag = statusTagEl(qn); tag.id = 'qdStatusTag';
    bar.appendChild(tag);
    const badge = Util.el('span', { class: 'qd-save-badge ' + st.save, id: 'qdSaveBadge' });
    bar.appendChild(badge);

    const btns = Util.el('div', { class: 'qd-top-btns' });
    btns.appendChild(Util.el('button', { class: 'btn-icon', id: 'qdPrevToggle', title: T('显示/隐藏预览'), html: Util.icon('eye'), onclick: function () { togglePreview(); } }));
    btns.appendChild(Util.el('button', { class: 'btn', html: Util.icon('check') + ' ' + T('保存草稿'), onclick: function () { flushSave().then(function (okv) { Util.toast(okv ? T('已保存草稿') : T('保存失败'), okv ? 'ok' : 'err'); }); } }));
    btns.appendChild(Util.el('button', { class: 'btn', html: Util.icon('eye') + ' ' + T('预览'), onclick: function () { openFullscreen(); } }));
    const act = Util.el('button', { class: 'btn btn-primary', id: 'qdActBtn', onclick: function () { publishAction(); } });
    updateActBtn(act, qn);
    btns.appendChild(act);
    btns.appendChild(Util.el('button', { class: 'btn', html: Util.icon('gear') + ' ' + T('设置'), onclick: function () { openSettings(); } }));
    bar.appendChild(btns);
    return bar;
  }
  function updateActBtn(act, qn) {
    const s = qn.status || 'draft';
    let label = '';
    if (s === 'draft') label = T('发布问卷');
    else if (s === 'published') label = T('暂停收集');
    else if (s === 'paused') label = T('重新开启');
    else label = T('已结束');
    act.textContent = label;
    act.disabled = (s === 'closed');
  }
  function updateStatusUI() {
    const qn = currentQn(); if (!qn) return;
    const tag = document.getElementById('qdStatusTag');
    if (tag) { const info = statusInfo(qn.status); tag.className = 'tag ' + info.cls; tag.textContent = info.t; }
    const act = document.getElementById('qdActBtn');
    if (act) updateActBtn(act, qn);
  }
  /* ---------- 发布前校验（容错性：避免发布不完整问卷） ----------
   * 返回 { canPublish, problems[] }：
   *   canPublish=false 且有致命问题（0 题）时阻止发布；
   *   仅存在可改进项（空章节 / 未命名题目）时允许发布，但给出明确警告。
   */
  function validateBeforePublish(qn) {
    const problems = [];
    const qs = allQuestions(qn);
    const total = qs.length;
    if (total === 0) {
      return { canPublish: false, problems: [T('问卷还没有任何题目，请先添加题目后再发布。')] };
    }
    (qn.modules || []).forEach(function (m) {
      if (!(m.questions || []).length) problems.push(T('章节「{1}」下还没有题目', m.title || T('未命名章节')));
    });
    qs.forEach(function (x) {
      const lb = String((x.q && x.q.label) || '').trim();
      if (!lb || lb === T('新问题') || lb === T('未命名问题')) problems.push(T('第 {1} 题还没有填写题干', x.q.no || ('Q' + qnum(x.q))));
    });
    return { canPublish: true, problems: problems };
  }
  function publishAction() {
    const qn = currentQn(); if (!qn) return;
    const s = qn.status || 'draft';
    if (s === 'closed') { Util.toast(T('问卷已结束，不可再开启。如需继续收集请新建副本。'), 'warn'); return; }
    // 首次发布（draft→published）时做完整性校验
    if (s === 'draft') {
      const v = validateBeforePublish(qn);
      if (!v.canPublish) { Util.toast(v.problems[0], 'warn'); return; }
      if (v.problems.length) {
        // 非致命问题仅提示，不阻断发布，避免确认弹窗阻塞无障碍/自动化操作。
        Util.toast(T('发布提醒：') + v.problems[0], 'warn');
      }
    }
    doPublish(qn);
  }
  function doPublish(qn) {
    const s = qn.status || 'draft';
    const to = (s === 'draft') ? 'published' : (s === 'published' ? 'paused' : 'published');
    qn.status = to;
    markDirty(); updateStatusUI(); schedulePreview();
    if (to === 'published') Util.toast(T('问卷已发布 · 状态：进行中'), 'ok');
    else Util.toast(T('问卷已暂停收集'), 'warn');
  }


  /* ---------- 左栏：题型组件库 ---------- */
  function renderPalette(qn) {
    const aside = Util.el('aside', { class: 'qd-palette' });
    aside.appendChild(Util.el('div', { class: 'qd-col-head', text: T('题型组件') }));
    aside.appendChild(Util.el('div', { class: 'qd-pal-tip', text: T('拖拽到编辑区添加，或点击追加到当前章节') }));
    const box = Util.el('div', { class: 'qd-pal-box' });
    qTypes().forEach(function (t) {
      const tile = Util.el('div', { class: 'qd-tile', dataset: { type: t.v }, title: t.t }, [
        Util.el('span', { class: 'qd-tile-ico', html: typeIcon(t.v) }),
        Util.el('span', { class: 'qd-tile-t', text: t.t })
      ]);
      bindPaletteTile(tile, t.v);
      box.appendChild(tile);
    });
    aside.appendChild(box);
    aside.appendChild(renderCountMeter(qn));
    return aside;
  }
  function bindPaletteTile(tile, type) {
    tile.draggable = true;
    tile.addEventListener('dragstart', function (e) {
      DND = { kind: 'new', type: type };
      tile.classList.add('dnd-dragging');
      try { e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', 'new|' + type); } catch (_) {}
    });
    tile.addEventListener('dragend', function () { DND = null; clearDndClasses(); });
    tile.addEventListener('click', function () { quickAdd(type); });
  }
  // 点击组件：追加到当前选中章节（无选中则最后一章，无章节先自动创建）
  function quickAdd(type) {
    const qn = currentQn(); if (!qn) return;
    let modId = st.modId;
    if (!modId && st.qId) { const it = findQById(st.qId); if (it) modId = it.mod.id; }
    if (!modId) { const mods = qn.modules || []; modId = mods.length ? mods[mods.length - 1].id : null; }
    if (!modId) { const mod = { id: Util.uid('mod'), title: T('第一章节'), questions: [] }; qn.modules.push(mod); modId = mod.id; }
    addQuestionAt(type, modId, null);
  }
  function renderCountMeter(qn) {
    const n = questionCount(qn);
    const box = Util.el('div', { class: 'qd-meter' + (n > 15 ? ' warn' : ''), id: 'qdCountMeter' });
    box.appendChild(Util.el('div', { class: 'qd-meter-k', text: T('题目数量') + ' ' + n }));
    let tip;
    if (n === 0) tip = T('尚未添加题目，从上方拖入第一题');
    else if (n > 15) tip = T('当前 {1} 题 · 题量较多，请确认完成率与维护成本', n) + '（5%）';
    else tip = T('当前 {1} 题 · 可继续添加，无数量上限', n);
    box.appendChild(Util.el('div', { class: 'qd-meter-tip', text: tip }));
    return box;
  }

  /* ---------- 中栏：编辑区 ---------- */
  // 拖拽动作条显隐：题目/章节被拖动时浮现复制区与回收区，松手后隐藏
  function showDrops() {
    const el = document.getElementById('qdDrops');
    if (el) el.classList.add('active');
  }
  function hideDrops() {
    const el = document.getElementById('qdDrops');
    if (el) el.classList.remove('active');
    clearDndClasses();
  }
  function bindDropActions() {
    const bar = document.getElementById('qdDrops');
    if (!bar) return;
    const copy = bar.querySelector('.qd-drop.copy');
    const trash = bar.querySelector('.qd-drop.trash');
    function onOver(zone, e) {
      // 仅题目(q) 或 章节(mod) 可拖入动作条；组件库新增题(new)拖入无意义
      if (!DND || DND.kind === 'new') return;
      e.preventDefault();
      try { e.dataTransfer.dropEffect = 'move'; } catch (_) {}
      clearDndClasses();
      zone.classList.add('dnd-over');
    }
    function onLeave(zone) { zone.classList.remove('dnd-over'); }
    copy.addEventListener('dragover', function (e) { onOver(copy, e); });
    copy.addEventListener('dragleave', function () { onLeave(copy); });
    copy.addEventListener('drop', function (e) {
      if (!DND || DND.kind === 'new') return;
      e.preventDefault();
      if (DND.kind === 'q') { const it = findQById(DND.qId); if (it) copyQuestion(it.mod.id, it.q.id); }
      else if (DND.kind === 'mod') { const m = (currentQn() || {}).modules; const src = m && m.find(function (x) { return x.id === DND.modId; }); if (src) duplicateModule(src); }
      DND = null; hideDrops();
    });
    trash.addEventListener('dragover', function (e) { onOver(trash, e); });
    trash.addEventListener('dragleave', function () { onLeave(trash); });
    trash.addEventListener('drop', function (e) {
      if (!DND || DND.kind === 'new') return;
      e.preventDefault();
      if (DND.kind === 'q') { const it = findQById(DND.qId); if (it) deleteQuestion(it.mod.id, it.q.id); }
      else if (DND.kind === 'mod') deleteModule(DND.modId);
      DND = null; hideDrops();
    });
  }
  function renderCanvas(qn) {
    const main = Util.el('section', { class: 'qd-canvas' });
    main.appendChild(Util.el('div', { class: 'qd-col-head' }, [
      Util.el('span', { text: T('编辑区') }),
      Util.el('span', { class: 'qd-col-sub', text: T('点击题目行展开编辑 · 拖动调整顺序') })
    ]));
    const modsEl = Util.el('div', { class: 'qd-mods', id: 'qdMods' });
    bindModsContainerDrop(modsEl);
    (qn.modules || []).forEach(function (mod) { modsEl.appendChild(renderModule(qn, mod)); });
    main.appendChild(modsEl);
    main.appendChild(Util.el('button', { class: 'btn qd-addmod', html: Util.icon('plus') + ' ' + T('添加章节'), onclick: function () { addModule(); } }));
    // 拖拽动作条：复制区 / 回收区（拖动题目或章节时浮现）
    const drops = Util.el('div', { class: 'qd-drops', id: 'qdDrops' });
    drops.appendChild(Util.el('div', { class: 'qd-drop copy', title: T('拖到此处复制'), html: ICO.copy + ' ' + T('复制到此') }));
    drops.appendChild(Util.el('div', { class: 'qd-drop trash', title: T('拖到此处删除'), html: Util.icon('trash') + ' ' + T('拖入删除') }));
    main.appendChild(drops);
    bindDropActions();
    return main;
  }

  function renderModule(qn, mod) {
    const box = Util.el('div', { class: 'qd-mod', dataset: { modId: mod.id } });
    bindDropOnMod(box, mod.id);
    const head = Util.el('div', { class: 'qd-mod-head' });
    const grip = Util.el('span', { class: 'qd-grip', title: T('拖动调整章节顺序'), html: ICO.grip });
    bindModGrip(grip, mod.id);
    head.appendChild(grip);
    const titleInp = Util.el('input', { type: 'text', class: 'qd-mod-title', value: mod.title || '', placeholder: T('章节名称'), title: T('章节名称（点击直接修改）') });
    titleInp.addEventListener('input', function () { mod.title = titleInp.value; markDirty(); schedulePreview(); });
    head.appendChild(titleInp);
    const cnt = (mod.questions || []).length;
    head.appendChild(Util.el('span', { class: 'qd-mod-count', text: cnt + ' ' + T('题') }));
    const ops = Util.el('div', { class: 'qd-mod-ops' });
    ops.appendChild(Util.el('button', { class: 'btn-icon', title: T('章节上移'), html: Util.icon('up'), onclick: function (e) { e.stopPropagation(); moveModuleRel(mod.id, -1); } }));
    ops.appendChild(Util.el('button', { class: 'btn-icon', title: T('章节下移'), html: Util.icon('down'), onclick: function (e) { e.stopPropagation(); moveModuleRel(mod.id, 1); } }));
    ops.appendChild(Util.el('button', { class: 'btn-icon', title: T('删除章节'), html: Util.icon('trash'), onclick: function (e) { e.stopPropagation(); deleteModule(mod.id); } }));
    head.appendChild(ops);
    box.appendChild(head);

    const body = Util.el('div', { class: 'qd-mod-qs' });
    bindDropOnModBody(body, mod.id);
    const nums = buildNumberMap(qn);
    (mod.questions || []).forEach(function (q) { body.appendChild(renderQuestion(qn, mod, q, nums)); });
    if (!cnt) body.appendChild(Util.el('div', { class: 'qd-mod-empty', text: T('拖入题型组件，或点击下方按钮添加') }));
    box.appendChild(body);
    box.appendChild(Util.el('button', { class: 'btn btn-sm qd-addq', html: Util.icon('plus') + ' ' + T('添加题目'), onclick: function () { addQuestionAt('text', mod.id, null); } }));
    return box;
  }
  function bindModGrip(grip, modId) {
    grip.draggable = true;
    grip.addEventListener('dragstart', function (e) {
      DND = { kind: 'mod', modId: modId };
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'mod|' + modId); } catch (_) {}
      showDrops();
    });
    grip.addEventListener('dragend', function () { DND = null; hideDrops(); });
  }
  function bindDropOnMod(modEl, modId) {
    modEl.addEventListener('dragover', function (e) {
      if (!DND || DND.kind !== 'mod') return;
      e.preventDefault();
      try { e.dataTransfer.dropEffect = 'move'; } catch (_) {}
      clearDndClasses();
      modEl.classList.add('dnd-over');
    });
    modEl.addEventListener('drop', function (e) {
      if (!DND || DND.kind !== 'mod') return;
      e.preventDefault();
      if (DND.modId !== modId) moveModule(DND.modId, modId);
      DND = null; clearDndClasses();
    });
  }
  function bindModsContainerDrop(modsEl) {
    // 拖到章节列表空白处 = 移到末尾
    modsEl.addEventListener('dragover', function (e) {
      if (!DND || DND.kind !== 'mod') return;
      if (e.target.closest && e.target.closest('.qd-mod')) return;
      e.preventDefault();
    });
    modsEl.addEventListener('drop', function (e) {
      if (!DND || DND.kind !== 'mod') return;
      if (e.target.closest && e.target.closest('.qd-mod')) return;
      e.preventDefault();
      moveModule(DND.modId, null);
      DND = null; clearDndClasses();
    });
  }
  function bindDropOnModBody(bodyEl, modId) {
    bodyEl.addEventListener('dragover', function (e) {
      if (!DND) return;
      if (e.target.closest && e.target.closest('.qd-q')) return; // 题目自身处理更精确的插入位
      e.preventDefault();
      try { e.dataTransfer.dropEffect = (DND.kind === 'new') ? 'copy' : 'move'; } catch (_) {}
      clearDndClasses();
      bodyEl.classList.add('dnd-mod-over'); // 虚线高亮 = 追加到该章节末尾
    });
    bodyEl.addEventListener('drop', function (e) {
      if (!DND) return;
      if (e.target.closest && e.target.closest('.qd-q')) return;
      e.preventDefault();
      if (DND.kind === 'new') addQuestionAt(DND.type, modId, null);
      else if (DND.kind === 'q') moveQuestion(DND.qId, modId, null);
      DND = null; clearDndClasses();
    });
  }

  function renderQuestion(qn, mod, q, nums) {
    const wrap = Util.el('div', { class: 'qd-q' + (st.qId === q.id ? ' active' : ''), dataset: { qId: q.id, modId: mod.id } });
    bindDropOnQ(wrap, mod.id, q.id);
    const row = Util.el('div', { class: 'qd-q-row' });
    bindQDrag(row, mod.id, q.id);
    const grip = Util.el('span', { class: 'qd-grip q-grip', title: T('拖动调整题目顺序'), html: ICO.grip });
    row.appendChild(grip);
    row.appendChild(Util.el('span', { class: 'q-num', text: qnum(q, nums[q.id]) }));
    const labelSpan = Util.el('span', { class: 'qd-q-label', text: q.label || T('（未命名题目）') });
    row.appendChild(labelSpan);
    row.appendChild(Util.el('span', { class: 'q-type', text: typeLabel(q.type) }));
    row.appendChild(Util.levelTag(q.level));
    if (q.required) row.appendChild(Util.el('span', { class: 'tag', text: T('必填') }));
    const ops = Util.el('span', { class: 'qd-q-ops' });
    ops.appendChild(Util.el('button', { class: 'btn-icon', title: T('上移'), html: Util.icon('up'), onclick: function (e) { e.stopPropagation(); moveQ(mod.id, q.id, -1); } }));
    ops.appendChild(Util.el('button', { class: 'btn-icon', title: T('下移'), html: Util.icon('down'), onclick: function (e) { e.stopPropagation(); moveQ(mod.id, q.id, 1); } }));
    ops.appendChild(Util.el('button', { class: 'btn-icon', title: T('复制题目'), html: ICO.copy, onclick: function (e) { e.stopPropagation(); copyQuestion(mod.id, q.id); } }));
    ops.appendChild(Util.el('button', { class: 'btn-icon', title: T('删除题目'), html: Util.icon('trash'), onclick: function (e) { e.stopPropagation(); deleteQuestion(mod.id, q.id); } }));
    row.appendChild(ops);
    row.addEventListener('click', function (e) {
      if (e.target.closest('.qd-q-ops') || e.target.closest('.qd-grip')) return;
      selectQ(mod.id, q.id);
    });
    wrap.appendChild(row);
    if (st.qId === q.id) wrap.appendChild(renderQEditor(mod, q));
    return wrap;
  }
  function bindQDrag(row, modId, qId) {
    row.draggable = true;
    row.addEventListener('dragstart', function (e) {
      if (e.target && e.target.closest && e.target.closest('input,select,textarea,button')) { e.preventDefault(); return; }
      DND = { kind: 'q', modId: modId, qId: qId };
      row.classList.add('dnd-dragging');
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'q|' + qId); } catch (_) {}
      showDrops();
    });
    row.addEventListener('dragend', function () { DND = null; hideDrops(); });
  }
  function bindDropOnQ(qWrap, modId, qId) {
    qWrap.addEventListener('dragover', function (e) {
      if (!DND || DND.kind === 'mod') return;
      e.preventDefault();
      try { e.dataTransfer.dropEffect = (DND.kind === 'new') ? 'copy' : 'move'; } catch (_) {}
      const r = qWrap.getBoundingClientRect();
      const before = (e.clientY - r.top) < r.height / 2;
      clearDndClasses();
      qWrap.classList.add(before ? 'dnd-before' : 'dnd-after');
    });
    qWrap.addEventListener('drop', function (e) {
      if (!DND || DND.kind === 'mod') return;
      e.preventDefault();
      const r = qWrap.getBoundingClientRect();
      const before = (e.clientY - r.top) < r.height / 2;
      const beforeQId = before ? qId : nextQIdIn(modId, qId);
      if (DND.kind === 'new') addQuestionAt(DND.type, modId, beforeQId);
      else if (DND.kind === 'q') moveQuestion(DND.qId, modId, beforeQId);
      DND = null; clearDndClasses();
    });
  }
  function nextQIdIn(modId, qId) {
    const qn = currentQn(); if (!qn) return null;
    const mod = qn.modules.find(function (m) { return m.id === modId; });
    if (!mod) return null;
    const arr = mod.questions || [];
    const i = arr.findIndex(function (x) { return x.id === qId; });
    return (i >= 0 && i + 1 < arr.length) ? arr[i + 1].id : null;
  }
  function findQById(qId) {
    const qn = currentQn(); if (!qn) return null;
    let out = null;
    (qn.modules || []).forEach(function (m) {
      (m.questions || []).forEach(function (q) { if (q.id === qId) out = { mod: m, q: q }; });
    });
    return out;
  }
  function selectQ(modId, qId) {
    if (st.qId === qId && st.modId === modId) { st.qId = null; st.modId = null; } // 再次点击收起
    else { st.modId = modId; st.qId = qId; }
    rerender();
  }

  /* ---------- 题目行内编辑器（取代原弹框，所见即所得） ---------- */
  function renderQEditor(mod, q) {
    const box = Util.el('div', { class: 'qd-q-edit' });
    const labelInp = Util.el('input', { type: 'text', class: 'qd-label-inp', value: q.label || '', placeholder: T('请输入题面，例如：是否核验工人年龄？') });
    labelInp.addEventListener('input', function () {
      q.label = labelInp.value;
      markDirty(); schedulePreview(); syncRowLabel(q);
    });
    box.appendChild(fld(T('题面'), labelInp));

    const row1 = Util.el('div', { class: 'row' });
    const typeSel = Util.el('select', { title: T('题型') });
    qTypes().forEach(function (t) {
      const o = Util.el('option', { value: t.v, text: t.t });
      if (t.v === q.type) o.selected = true;
      typeSel.appendChild(o);
    });
    typeSel.addEventListener('change', function () {
      q.type = typeSel.value;
      if ((q.type === 'single' || q.type === 'multi') && !(q.options && q.options.length)) q.options = [T('选项一'), T('选项二')];
      if (q.type === 'rating' && !q.max) q.max = 5;
      markDirty(); rerender(); // 题型专属配置块随之重建
    });
    row1.appendChild(fld(T('题型'), typeSel, true));

    const lvlSel = Util.el('select', { title: T('问题等级（风险/重要性）') });
    Util.Q_LEVELS.forEach(function (lv) {
      const o = Util.el('option', { value: lv.v, text: T(lv.key) });
      if (lv.v === (q.level || 'minor')) o.selected = true;
      lvlSel.appendChild(o);
    });
    lvlSel.addEventListener('change', function () { q.level = lvlSel.value; markDirty(); rerender(); });
    row1.appendChild(fld(T('问题等级'), lvlSel, true));

    const noInp = Util.el('input', { type: 'text', value: (q.no != null && String(q.no).trim()) ? q.no : '', placeholder: T('自动') });
    noInp.addEventListener('input', function () { q.no = noInp.value; markDirty(); schedulePreview(); });
    row1.appendChild(fld(T('题目编号'), noInp, true));

    const reqChk = Util.el('input', { type: 'checkbox' });
    reqChk.checked = !!q.required;
    reqChk.addEventListener('change', function () { q.required = reqChk.checked; markDirty(); rerender(); });
    row1.appendChild(Util.el('label', { class: 'check-row qd-req', title: T('必填题目') }, [reqChk, Util.el('span', { text: T('必填') })]));
    box.appendChild(row1);

    // 题型专属配置
    const typeBlock = Util.el('div', {});
    box.appendChild(typeBlock);
    refreshTypeBlock(typeBlock, q);

    const helpI = Util.el('textarea', { html: Util.esc(q.help || ''), placeholder: T('例如：依据《XX标准》第X条；定义：……；示例：……') });
    helpI.addEventListener('input', function () { q.help = helpI.value; markDirty(); schedulePreview(); });
    box.appendChild(fld(T('参考依据 / 填写说明（可选）'), helpI));
    return box;
  }
  function fld(label, input, nowrap) {
    const l = Util.el('label', { class: 'fld' + (nowrap ? ' qd-fld-sm' : '') }, [Util.el('span', { class: 'lbl', text: label }), input]);
    if (nowrap) l.style.margin = '0';
    return l;
  }
  function syncRowLabel(q) {
    const el = document.querySelector('.qd-q[data-q-id="' + q.id + '"] .qd-q-label');
    if (el) el.textContent = q.label || T('（未命名题目）');
  }
  function refreshTypeBlock(typeBlock, q) {
    typeBlock.innerHTML = '';
    if (q.type === 'single' || q.type === 'multi') {
      typeBlock.appendChild(Util.el('div', { class: 'lbl', style: 'font-size:12.5px;color:var(--ink-3);font-weight:600;margin-bottom:6px', text: T('选项') }));
      const optBox = Util.el('div', {});
      (q.options || []).forEach(function (opt, i) {
        const inp = Util.el('input', { type: 'text', value: opt });
        inp.addEventListener('input', function () { q.options[i] = inp.value; markDirty(); schedulePreview(); });
        optBox.appendChild(Util.el('div', { class: 'opt-row' }, [
          inp,
          Util.el('button', { class: 'btn-icon', title: T('上移'), html: Util.icon('up'), onclick: function () { if (i > 0) { var t = q.options[i - 1]; q.options[i - 1] = q.options[i]; q.options[i] = t; markDirty(); rerender(); } } }),
          Util.el('button', { class: 'btn-icon', title: T('下移'), html: Util.icon('down'), onclick: function () { if (i < q.options.length - 1) { var t = q.options[i + 1]; q.options[i + 1] = q.options[i]; q.options[i] = t; markDirty(); rerender(); } } }),
          Util.el('button', { class: 'btn-icon', title: T('删除选项'), html: Util.icon('trash'), onclick: function () { q.options.splice(i, 1); markDirty(); rerender(); } })
        ]));
      });
      typeBlock.appendChild(optBox);
      typeBlock.appendChild(Util.el('button', { class: 'btn btn-sm', style: 'margin-top:4px', onclick: function () { q.options = q.options || []; q.options.push(T('新选项')); markDirty(); rerender(); } }, T('添加选项')));
    }
    if (q.type === 'rating') {
      const maxI = Util.el('input', { type: 'number', value: q.max || 5, min: 2, max: 10 });
      maxI.addEventListener('input', function () { var v = Number(maxI.value); q.max = (v >= 2 && v <= 10) ? v : 5; markDirty(); schedulePreview(); });
      typeBlock.appendChild(fld(T('评分上限（如 5 表示 1-5 分）'), maxI));
    }
    if (q.type === 'number') {
      const row = Util.el('div', { class: 'row' });
      const minI = Util.el('input', { type: 'number', value: q.min == null ? '' : q.min, placeholder: T('最小') });
      const maxI = Util.el('input', { type: 'number', value: q.max == null ? '' : q.max, placeholder: T('最大') });
      minI.addEventListener('input', function () { q.min = minI.value === '' ? null : Number(minI.value); markDirty(); schedulePreview(); });
      maxI.addEventListener('input', function () { q.max = maxI.value === '' ? null : Number(maxI.value); markDirty(); schedulePreview(); });
      row.appendChild(fld(T('最小值（可选）'), minI, true));
      row.appendChild(fld(T('最大值（可选）'), maxI, true));
      typeBlock.appendChild(row);
    }
  }

  /* ============================================================
   * 三、右栏：实时预览（整卷/单题 × 手机/平板/PC）
   * ============================================================ */
  function renderPreviewCol() {
    const aside = Util.el('aside', { class: 'qd-preview', id: 'qdPreviewCol' });
    const head = Util.el('div', { class: 'qd-prev-head' });
    head.appendChild(Util.el('span', { class: 'qd-prev-title', text: T('实时预览') }));
    const modeTabs = Util.el('div', { class: 'qd-tabs', id: 'qdPrevTabs' });
    [['full', T('整卷')], ['single', T('单题')]].forEach(function (p) {
      const b = Util.el('button', { class: 'qd-tab' + (st.preview.single === (p[0] === 'single') ? ' active' : ''), text: p[1], dataset: { mode: p[0] } });
      b.setAttribute('aria-pressed', String(st.preview.single === (p[0] === 'single')));
      b.addEventListener('click', function (e) { e.preventDefault(); st.preview.single = (p[0] === 'single'); st.preview.idx = 0; renderPreviewPanels(); });
      modeTabs.appendChild(b);
    });
    head.appendChild(modeTabs);
    const devTabs = Util.el('div', { class: 'qd-tabs', id: 'qdDevTabs' });
    [['phone', T('手机'), ICO.phone], ['tablet', T('平板'), ICO.tablet], ['pc', 'PC', ICO.pc]].forEach(function (p) {
      const b = Util.el('button', { class: 'qd-tab' + (st.preview.device === p[0] ? ' active' : ''), title: p[1], html: p[2], dataset: { device: p[0] } });
      b.setAttribute('aria-pressed', String(st.preview.device === p[0]));
      b.addEventListener('click', function (e) { e.preventDefault(); st.preview.device = p[0]; renderPreviewPanels(); });
      devTabs.appendChild(b);
    });
    head.appendChild(devTabs);
    const headWrap = Util.el('div', { class: 'qd-col-head qd-prev-headwrap' }, head);
    aside.appendChild(headWrap);
    const body = Util.el('div', { class: 'qd-prev-body', id: 'qdPrevBody' });
    aside.appendChild(body);
    const foot = Util.el('div', { class: 'qd-prev-foot', id: 'qdPrevFoot' });
    aside.appendChild(foot);
    return aside;
  }

  function syncPreviewTabState(root) {
    if (!root) return;
    root.querySelectorAll('[data-mode]').forEach(function (b) {
      b.classList.toggle('active', st.preview.single === (b.dataset.mode === 'single'));
      b.setAttribute('aria-pressed', String(st.preview.single === (b.dataset.mode === 'single')));
    });
    root.querySelectorAll('[data-device]').forEach(function (b) {
      b.classList.toggle('active', st.preview.device === b.dataset.device);
      b.setAttribute('aria-pressed', String(st.preview.device === b.dataset.device));
    });
  }
  function renderPreviewPanels() {
    const body = document.getElementById('qdPrevBody');
    if (body) { body.innerHTML = ''; body.appendChild(renderDeviceFrame()); }
    const foot = document.getElementById('qdPrevFoot');
    if (foot) renderPrevFoot(foot);
    syncPreviewTabState(document.getElementById('qdPreviewCol'));
    if (st.fullscreen) {
      renderFsBody();
      syncPreviewTabState(document.querySelector('.qd-fs'));
    }
  }
  function renderDeviceFrame() {
    const qn = currentQn();
    const frame = Util.el('div', { class: 'qd-device ' + st.preview.device });
    const inner = Util.el('div', { class: 'qd-device-inner' });
    if (qn) renderQnPreview(inner, qn);
    else inner.appendChild(Util.el('div', { class: 'empty', text: T('暂无问卷') }));
    frame.appendChild(inner);
    return frame;
  }
  function renderQnPreview(root, qn) {
    const nums = buildNumberMap(qn);
    const head = Util.el('div', { class: 'pv-head' });
    head.appendChild(Util.el('div', { class: 'pv-title', text: qn.title || T('未命名问卷') }));
    if (qn.description) head.appendChild(Util.el('div', { class: 'pv-desc', text: qn.description }));
    head.appendChild(Util.el('div', { class: 'pv-meta', text: T('预览 · 测试填写，数据不会被保存') }));
    root.appendChild(head);

    const list = allQuestions(qn);
    if (st.preview.single) {
      if (!list.length) { root.appendChild(Util.el('div', { class: 'empty', text: T('暂无题目') })); return; }
      const i = Math.max(0, Math.min(st.preview.idx, list.length - 1));
      st.preview.idx = i;
      const box = Util.el('div', { class: 'pv-single' });
      box.appendChild(Util.el('div', { class: 'pv-prog-txt', text: T('第 {1} / {2} 题', i + 1, list.length) }));
      box.appendChild(renderPvQuestion(list[i], nums[list[i].q.id]));
      root.appendChild(box);
    } else {
      (qn.modules || []).forEach(function (mod) {
        if (!(mod.questions || []).length) return;
        root.appendChild(Util.el('div', { class: 'pv-mod', text: mod.title || T('（未命名章节）') }));
        (mod.questions || []).forEach(function (q) {
          root.appendChild(renderPvQuestion({ mod: mod, q: q }, nums[q.id]));
        });
      });
      if (!list.length) root.appendChild(Util.el('div', { class: 'empty', text: T('暂无题目，从左侧拖入题型组件') }));
    }
  }
  function renderPvQuestion(it, num) {
    const q = it.q;
    const box = Util.el('div', { class: 'pv-q', dataset: { qId: q.id } });
    const labelRow = Util.el('div', { class: 'pv-q-label' });
    labelRow.appendChild(Util.el('span', { class: 'pv-q-num', text: qnum(q, num) }));
    labelRow.appendChild(Util.el('span', { class: 'pv-q-text', text: (q.label || T('（未命名题目）')) + (q.required ? ' *' : '') }));
    box.appendChild(labelRow);
    if (q.help) box.appendChild(Util.el('div', { class: 'pv-q-help', text: q.help }));
    const ans = st.preview.answers[q.id];
    if (q.type === 'yesno') {
      const row = Util.el('div', { class: 'pv-yesno' });
      [T('是'), T('否')].forEach(function (lab) {
        const v = (lab === T('是'));
        const b = Util.el('button', { class: 'pv-btn' + (ans === v ? ' on' : ''), type: 'button', text: lab });
        b.addEventListener('click', function () {
          st.preview.answers[q.id] = (st.preview.answers[q.id] === v ? null : v);
          renderPreviewPanels();
        });
        row.appendChild(b);
      });
      box.appendChild(row);
    } else if (q.type === 'single' || q.type === 'multi') {
      const row = Util.el('div', { class: 'pv-opts' });
      (q.options || []).forEach(function (opt, i) {
        let on = false;
        if (q.type === 'single') on = (ans === i);
        else on = Array.isArray(ans) && ans.indexOf(i) >= 0;
        const b = Util.el('button', { class: 'pv-opt' + (on ? ' on' : ''), type: 'button', text: opt });
        b.addEventListener('click', function () {
          if (q.type === 'single') st.preview.answers[q.id] = (st.preview.answers[q.id] === i ? null : i);
          else {
            const arr = Array.isArray(st.preview.answers[q.id]) ? st.preview.answers[q.id].slice() : [];
            const j = arr.indexOf(i);
            if (j >= 0) arr.splice(j, 1); else arr.push(i);
            st.preview.answers[q.id] = arr;
          }
          renderPreviewPanels();
        });
        row.appendChild(b);
      });
      box.appendChild(row);
    } else if (q.type === 'rating') {
      const row = Util.el('div', { class: 'pv-stars' });
      const max = Number(q.max) || 5;
      for (let s = 1; s <= max; s++) {
        const b = Util.el('button', { class: 'pv-star' + (Number(ans) >= s ? ' on' : ''), type: 'button', text: '★', title: String(s) });
        b.addEventListener('click', function () { st.preview.answers[q.id] = (Number(st.preview.answers[q.id]) === s ? null : s); renderPreviewPanels(); });
        row.appendChild(b);
      }
      row.appendChild(Util.el('span', { class: 'pv-star-val', text: (ans == null ? '—' : ans + ' / ' + max) }));
      box.appendChild(row);
    } else {
      // text / textarea / number / date：可输入测试数据
      let inp;
      if (q.type === 'textarea') inp = Util.el('textarea', { placeholder: T('测试填写') });
      else if (q.type === 'number') inp = Util.el('input', { type: 'number', placeholder: T('测试填写'), min: q.min == null ? '' : q.min, max: q.max == null ? '' : q.max });
      else if (q.type === 'date') inp = Util.el('input', { type: 'date' });
      else inp = Util.el('input', { type: 'text', placeholder: T('测试填写') });
      if (ans != null && ans !== '') inp.value = ans;
      inp.addEventListener('input', function () {
        st.preview.answers[q.id] = inp.value;
        // 测试填写仅更新预览状态，不触发问卷自动保存。
        renderPreviewPanels();
      });
      box.appendChild(Util.el('div', { class: 'pv-input' }, inp));
    }
    return box;
  }
  function renderPrevFoot(foot) {
    foot.innerHTML = '';
    const qn = currentQn(); if (!qn) return;
    if (!st.preview.single) {
      foot.appendChild(Util.el('span', { class: 'muted', style: 'font-size:var(--fs-xs)', text: T('切换单题模式可模拟逐题填写体验') }));
      return;
    }
    const list = allQuestions(qn);
    if (!list.length) return;
    const i = Math.max(0, Math.min(st.preview.idx, list.length - 1));
    const prev = Util.el('button', { class: 'btn btn-sm', text: T('上一题') });
    prev.disabled = (i <= 0);
    prev.addEventListener('click', function () { st.preview.idx = Math.max(0, i - 1); renderPreviewPanels(); });
    foot.appendChild(prev);
    const prog = Util.el('div', { class: 'qd-prog' }, Util.el('div', { class: 'qd-prog-fill', style: 'width:' + Math.round((i + 1) / list.length * 100) + '%' }));
    foot.appendChild(prog);
    foot.appendChild(Util.el('span', { class: 'qd-prog-txt', text: (i + 1) + ' / ' + list.length }));
    const next = Util.el('button', { class: 'btn btn-sm', text: T('下一题') });
    next.disabled = (i >= list.length - 1);
    next.addEventListener('click', function () { st.preview.idx = Math.min(list.length - 1, i + 1); renderPreviewPanels(); });
    foot.appendChild(next);
  }

  /* ---------- 全屏预览（预览按钮） ---------- */
  function openFullscreen() {
    st.fullscreen = true;
    const root = document.getElementById('modalRoot');
    if (!root) return;
    root.innerHTML = '';
    const qn = currentQn();
    const ov = Util.el('div', { class: 'qd-fs' });
    const head = Util.el('div', { class: 'qd-fs-head' });
    head.appendChild(Util.el('button', { class: 'btn', html: ICO.back + ' ' + T('返回编辑'), id: 'qdFsBack', onclick: function () { closeFullscreen(); } }));
    head.appendChild(Util.el('div', { class: 'qd-fs-title', text: (qn ? (qn.title || T('未命名问卷')) : '') }));
    const modeTabs = Util.el('div', { class: 'qd-tabs', id: 'qdFsTabs' });
    [['full', T('整卷')], ['single', T('单题')]].forEach(function (p) {
      const b = Util.el('button', { class: 'qd-tab' + (st.preview.single === (p[0] === 'single') ? ' active' : ''), text: p[1], dataset: { mode: p[0] } });
      b.setAttribute('aria-pressed', String(st.preview.single === (p[0] === 'single')));
      b.addEventListener('click', function (e) { e.preventDefault(); st.preview.single = (p[0] === 'single'); st.preview.idx = 0; renderPreviewPanels(); });
      modeTabs.appendChild(b);
    });
    head.appendChild(modeTabs);
    const devTabs = Util.el('div', { class: 'qd-tabs', id: 'qdFsDevTabs' });
    [['phone', T('手机'), ICO.phone], ['tablet', T('平板'), ICO.tablet], ['pc', 'PC', ICO.pc]].forEach(function (p) {
      const b = Util.el('button', { class: 'qd-tab' + (st.preview.device === p[0] ? ' active' : ''), title: p[1], html: p[2], dataset: { device: p[0] } });
      b.setAttribute('aria-pressed', String(st.preview.device === p[0]));
      b.addEventListener('click', function (e) { e.preventDefault(); st.preview.device = p[0]; renderPreviewPanels(); });
      devTabs.appendChild(b);
    });
    head.appendChild(devTabs);
    ov.appendChild(head);
    const body = Util.el('div', { class: 'qd-fs-body' });
    body.appendChild(Util.el('div', { class: 'qd-fs-stage', id: 'qdFsBody' }));
    body.appendChild(Util.el('div', { class: 'qd-fs-foot', id: 'qdFsFoot' }));
    ov.appendChild(body);
    root.appendChild(ov);
    renderFsBody();
  }
  function renderFsBody() {
    const stage = document.getElementById('qdFsBody');
    if (stage) { stage.innerHTML = ''; stage.appendChild(renderDeviceFrame()); }
    const fsFoot = document.getElementById('qdFsFoot');
    if (fsFoot) {
      fsFoot.innerHTML = '';
      const tmp = Util.el('div', { class: 'qd-prev-foot', style: 'border:none;padding:0' });
      renderPrevFoot(tmp);
      while (tmp.firstChild) fsFoot.appendChild(tmp.firstChild);
    }
  }
  function closeFullscreen() { st.fullscreen = false; Util.closeModal(); }

  /* ---------- 键盘快捷键（编辑效率，静默不打扰） ----------
   * Ctrl+S       手动保存（阻止浏览器默认「保存页面」）
   * Ctrl+Enter   保存并发布 / 暂停 / 重新开启（与状态按钮一致）
   * Esc          关闭全屏预览
   * 输入法组合输入（isComposing）与可编辑元素内 Ctrl+Enter 不触发全局发布，避免误触。
   */
  function isEditableTarget(t) {
    if (!t) return false;
    const tag = String(t.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    return (t.isContentEditable === true);
  }
  function handleKeydown(e) {
    if (st.fullscreen) {
      if (e.key === 'Escape') { e.preventDefault(); closeFullscreen(); }
      return;
    }
    if (e.isComposing) return; // 中文/日文输入法组合中不拦截
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) { if (e.key === 'Escape' && st.mode === 'edit') { /* 预留：收起行内编辑器 */ } return; }
    if (st.mode !== 'edit') return;
    const k = (e.key || '').toLowerCase();
    if (k === 's') {
      e.preventDefault();
      flushSave().then(function (ok) { Util.toast(ok ? T('已保存') : T('保存失败'), ok ? 'ok' : 'err'); });
    } else if (k === 'enter' && !isEditableTarget(e.target)) {
      e.preventDefault();
      publishAction();
    }
  }
  try {
    global.document.addEventListener('keydown', handleKeydown);
  } catch (e) {}

  /* ============================================================
   * 四、数据操作（题目/章节 增删改排序，含撤销容错）
   * ============================================================ */
  function nextAutoNo(qn) {
    let seq = 0;
    (qn.modules || []).forEach(function (m) {
      (m.questions || []).forEach(function (x) {
        const n = Number(String(x.no || '').replace(/[^0-9]/g, ''));
        if (!isNaN(n) && n > seq) seq = n;
      });
    });
    return 'Q' + (seq + 1);
  }
  function addQuestionAt(type, modId, beforeQId) {
    const qn = currentQn(); if (!qn) return null;
    let mod = qn.modules.find(function (m) { return m.id === modId; });
    if (!mod) { mod = { id: Util.uid('mod'), title: T('新章节'), questions: [] }; qn.modules.push(mod); }
    const q = { id: Util.uid('q'), label: T('新问题'), type: type || 'text', required: false, level: 'minor', no: nextAutoNo(qn) };
    if (type === 'single' || type === 'multi') q.options = [T('选项一'), T('选项二')];
    if (type === 'rating') q.max = 5;
    mod.questions = mod.questions || [];
    const k = beforeQId ? mod.questions.findIndex(function (x) { return x.id === beforeQId; }) : -1;
    if (k < 0) mod.questions.push(q); else mod.questions.splice(k, 0, q);
    st.modId = mod.id; st.qId = q.id;
    markDirty(); rerender();
    focusQLabel(q.id);
    return q;
  }
  function focusQLabel(qId) {
    try {
      const inp = document.querySelector('.qd-q[data-q-id="' + qId + '"] .qd-label-inp');
      if (inp && typeof inp.focus === 'function') { inp.focus(); if (inp.select) inp.select(); }
      const row = document.querySelector('.qd-q[data-q-id="' + qId + '"]');
      if (row && typeof row.scrollIntoView === 'function') { try { row.scrollIntoView({ block: 'center' }); } catch (e) {} }
    } catch (e) {}
  }
  function moveQuestion(qId, toModId, beforeQId) {
    const qn = currentQn(); if (!qn) return null;
    let fromMod = null, q = null, fromIdx = -1;
    qn.modules.forEach(function (m) {
      const i = (m.questions || []).findIndex(function (x) { return x.id === qId; });
      if (i >= 0) { fromMod = m; q = m.questions[i]; fromIdx = i; }
    });
    if (!q) return null;
    const toMod = qn.modules.find(function (m) { return m.id === toModId; }) || fromMod;
    fromMod.questions.splice(fromIdx, 1);
    toMod.questions = toMod.questions || [];
    const k = beforeQId ? toMod.questions.findIndex(function (x) { return x.id === beforeQId; }) : -1;
    if (k < 0) toMod.questions.push(q); else toMod.questions.splice(k, 0, q);
    st.modId = toMod.id; st.qId = q.id;
    markDirty(); rerender();
    return q;
  }
  function moveQ(modId, qId, dir) {
    const qn = currentQn(); if (!qn) return;
    const mod = qn.modules.find(function (m) { return m.id === modId; });
    if (!mod) return;
    const arr = mod.questions || [];
    const i = arr.findIndex(function (x) { return x.id === qId; });
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    markDirty(); rerender();
  }
  function copyQuestion(modId, qId) {
    const qn = currentQn(); if (!qn) return;
    const mod = qn.modules.find(function (m) { return m.id === modId; });
    if (!mod) return;
    const arr = mod.questions || [];
    const i = arr.findIndex(function (x) { return x.id === qId; });
    if (i < 0) return;
    const copy = JSON.parse(JSON.stringify(arr[i]));
    copy.id = Util.uid('q');
    copy.no = ''; // 副本用自动编号，避免编号冲突
    arr.splice(i + 1, 0, copy);
    st.modId = modId; st.qId = copy.id;
    markDirty(); rerender();
    Util.toast(T('已复制题目'), 'ok');
  }
  function deleteQuestion(modId, qId) {
    const qn = currentQn(); if (!qn) return;
    const mod = qn.modules.find(function (m) { return m.id === modId; });
    if (!mod) return;
    const arr = mod.questions || [];
    const i = arr.findIndex(function (x) { return x.id === qId; });
    if (i < 0) return;
    const removed = arr.splice(i, 1)[0];
    if (st.qId === qId) { st.qId = null; st.modId = null; }
    markDirty(); rerender();
    toastUndo(T('已删除题目：') + (removed.label || T('（未命名题目）')), function () {
      const m2 = qn.modules.find(function (m) { return m.id === modId; }) || qn.modules[0];
      if (m2) { m2.questions = m2.questions || []; m2.questions.splice(Math.min(i, m2.questions.length), 0, removed); markDirty(); rerender(); }
    });
  }
  function addModule() {
    const qn = currentQn(); if (!qn) return;
    const mod = { id: Util.uid('mod'), title: '', questions: [] };
    qn.modules.push(mod);
    st.modId = mod.id; st.qId = null;
    markDirty(); rerender();
    try {
      const inp = document.querySelector('.qd-mod[data-mod-id="' + mod.id + '"] .qd-mod-title');
      if (inp && typeof inp.focus === 'function') inp.focus();
    } catch (e) {}
  }
  function deleteModule(modId) {
    const qn = currentQn(); if (!qn) return;
    const idx = qn.modules.findIndex(function (m) { return m.id === modId; });
    if (idx < 0) return;
    const mod = qn.modules[idx];
    const n = (mod.questions || []).length;
    const doDel = function () {
      qn.modules.splice(idx, 1);
      if (st.modId === modId) { st.modId = null; st.qId = null; }
      markDirty(); rerender();
      toastUndo(T('已删除章节') + (mod.title ? '「' + mod.title + '」' : '') + (n ? T('（含 {1} 题）', n) : ''), function () {
        qn.modules.splice(Math.min(idx, qn.modules.length), 0, mod);
        markDirty(); rerender();
      });
    };
    if (n) {
      Util.confirm(T('删除章节'), T('该章节含 {1} 道题目，删除后可撤销。确认删除？', n), T('删除')).then(function (ok) { if (ok) doDel(); });
    } else doDel();
  }
  function moveModuleRel(modId, dir) {
    const qn = currentQn(); if (!qn) return;
    const i = qn.modules.findIndex(function (m) { return m.id === modId; });
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= qn.modules.length) return;
    const t = qn.modules[i]; qn.modules[i] = qn.modules[j]; qn.modules[j] = t;
    markDirty(); rerender();
  }
  // 复制章节（拖到复制区）：新章节插在原章节后，题目标题追加「（副本）」避免混淆
  function duplicateModule(srcMod) {
    const qn = currentQn(); if (!qn) return;
    if (!srcMod) return;
    const copy = JSON.parse(JSON.stringify(srcMod));
    copy.id = Util.uid('mod');
    copy.title = (srcMod.title || T('新章节')) + T('（副本）');
    (copy.questions || []).forEach(function (q) { q.id = Util.uid('q'); q.no = ''; });
    const idx = qn.modules.findIndex(function (m) { return m.id === srcMod.id; });
    qn.modules.splice(idx + 1, 0, copy);
    markDirty(); rerender();
    Util.toast(T('已复制章节'), 'ok');
  }
  // 章节移动核心（供冒烟测试直调）：beforeModId 为 null 时移到末尾
  function moveModule(modId, beforeModId) {
    const qn = currentQn(); if (!qn) return;
    const i = qn.modules.findIndex(function (m) { return m.id === modId; });
    if (i < 0) return;
    const m = qn.modules.splice(i, 1)[0];
    if (beforeModId) {
      const j = qn.modules.findIndex(function (x) { return x.id === beforeModId; });
      if (j >= 0) qn.modules.splice(j, 0, m); else qn.modules.push(m);
    } else qn.modules.push(m);
    markDirty(); rerender();
  }

  /* ---------- 可撤销提示（容错性：删除均可一键撤销） ---------- */
  function toastUndo(msg, undoFn) {
    const root = document.getElementById('toastRoot');
    if (!root) { if (undoFn) undoFn(); return; }
    const t = Util.el('div', { class: 'toast ok qd-undo-toast' }, [
      Util.el('span', { text: msg }),
      Util.el('button', { class: 'qd-undo-btn', text: T('撤销'), onclick: function () { if (undoFn) undoFn(); if (t.parentNode) t.remove(); } })
    ]);
    root.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0'; t.style.transition = 'opacity .3s';
      setTimeout(function () { if (t.parentNode) t.remove(); }, 300);
    }, 6000);
  }

  /* ============================================================
   * 五、设置（标题/说明/状态 + 高级工具：导出导入，渐进式展示）
   * ============================================================ */
  function openSettings() {
    const qn = currentQn(); if (!qn) return;
    const body = Util.el('div', {});
    body.appendChild(Util.el('h3', { text: T('问卷基本信息'), style: 'margin-top:0' }));

    const titleI = Util.el('input', { type: 'text', value: qn.title || '', placeholder: T('问卷标题（点击输入）') });
    titleI.addEventListener('input', function () {
      qn.title = titleI.value; markDirty();
      const ti = document.getElementById('qdTitleInp'); if (ti) ti.value = titleI.value;
      schedulePreview();
    });
    body.appendChild(fld(T('问卷标题'), titleI));

    const descI = Util.el('textarea', { html: Util.esc(qn.description || ''), placeholder: T('问卷说明（展示在问卷开头）') });
    descI.addEventListener('input', function () { qn.description = descI.value; markDirty(); schedulePreview(); });
    body.appendChild(fld(T('问卷说明'), descI));

    const statusSel = Util.el('select', { title: T('问卷状态') });
    qnStatuses().forEach(function (s) {
      const o = Util.el('option', { value: s.v, text: s.t + (s.v === 'closed' ? T('（不可再提交）') : '') });
      if (s.v === (qn.status || 'draft')) o.selected = true;
      statusSel.appendChild(o);
    });
    statusSel.addEventListener('change', function () {
      qn.status = statusSel.value;
      markDirty(); updateStatusUI(); schedulePreview();
      Util.toast(T('状态已更新'), 'ok');
    });
    body.appendChild(fld(T('问卷状态'), statusSel));

    body.appendChild(Util.el('div', { class: 'btn-row', style: 'margin:6px 0 4px' }, [
      Util.el('button', { class: 'btn', html: ICO.copy + ' ' + T('复制问卷'), onclick: function () {
        const cp = duplicateQn(qn.id);
        Util.closeModal();
        if (cp) { enterEdit(cp.id); Util.toast(T('已复制问卷'), 'ok'); }
      } }),
      Util.el('button', { class: 'btn btn-danger', html: Util.icon('trash') + ' ' + T('删除问卷'), onclick: function () { Util.closeModal(); deleteQn(qn.id); } })
    ]));

    // 高级工具（默认折叠，点击展开）：导出 / 导入
    const det = Util.el('details', { class: 'qd-tools' });
    det.appendChild(Util.el('summary', { text: T('高级工具（导出 / 导入）') }));
    const fileInput = Util.el('input', { type: 'file', accept: '.xlsx,.xls,.csv', style: 'display:none' });
    fileInput.addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0];
      if (f) importQnExcel(f);
      e.target.value = '';
    });
    const jsonInput = Util.el('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
    jsonInput.addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0];
      if (f) importQnJson(f);
      e.target.value = '';
    });
    const toolRow = Util.el('div', { class: 'btn-row', style: 'margin-top:8px; flex-wrap:wrap' }, [
      Util.el('button', { class: 'btn', html: Util.icon('file') + ' ' + T('导出 Excel'), onclick: function () { exportQnExcel(qn); } }),
      Util.el('button', { class: 'btn', html: Util.icon('file') + ' ' + T('导出 Word'), onclick: function () { exportQnWord(qn); } }),
      Util.el('button', { class: 'btn', html: Util.icon('file') + ' ' + T('导出 PDF'), onclick: function () { exportQnPdf(qn); } }),
      Util.el('button', { class: 'btn', html: Util.icon('file') + ' ' + T('导出 JSON'), onclick: function () { exportQnJson(qn); } }),
      Util.el('button', { class: 'btn', html: Util.icon('file') + ' ' + T('导入 Excel'), onclick: function () { fileInput.click(); } }),
      Util.el('button', { class: 'btn', html: Util.icon('file') + ' ' + T('导入 JSON'), onclick: function () { jsonInput.click(); } })
    ]);
    det.appendChild(toolRow);
    det.appendChild(fileInput);
    det.appendChild(jsonInput);
    body.appendChild(det);

    Util.modal(T('问卷设置'), body, [
      Util.el('button', { class: 'btn btn-primary', text: T('完成'), onclick: function () { Util.closeModal(); rerender(); } })
    ], { wide: true });
  }

  /* ============================================================
   * 六、导出 / 导入（沿用原有实现，收纳进设置-高级工具）
   * ============================================================ */
  async function exportQnExcel(qn) {
    try { await ReportEngine.ensureLibs(['xlsx']); } catch (e) { Util.toast(T('Excel 组件加载失败：') + (e && e.message), 'err'); return; }
    const XLSX = window.XLSX;
    if (!XLSX) { Util.toast(T('Excel 组件未加载'), 'err'); return; }
    const headers = [
      T('章节'), T('题型'), T('问题'), T('选项（用“|”分隔）'),
      T('评分上限（分）'), T('数值最小'), T('数值最大'), T('必填（是/否）'),
      T('等级'), T('填写提示'), T('回答（外部机构填写，导入时忽略）')
    ];
    const rows = [[qn.title], headers];
    qn.modules.forEach(function (mod) { (mod.questions || []).forEach(function (q) {
      rows.push([
        mod.title, typeLabel(q.type), q.label || '',
        (q.options || []).join(' | '),
        q.type === 'rating' ? (q.max || 5) : '',
        q.min == null ? '' : q.min,
        q.max == null ? '' : q.max,
        q.required ? T('是') : T('否'),
        Util.levelInfo(q.level).t,
        q.help || '',
        ''
      ]);
    }); });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = headers.map(function (h, i) { return { wch: i === 2 ? 42 : (i === 3 ? 28 : 14) }; });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, T('问卷'));
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const safe = (qn.title || 'questionnaire').replace(/[\\/:*?"<>|\s]+/g, '_');
    Util.download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), safe + '_' + T('问卷') + '.xlsx');
    Util.toast(T('Excel 已导出：') + safe, 'ok');
  }

  function exportQnWord(qn) {
    const rows = qn.modules.map(function (m) { return m.questions || []; }).reduce(function (a, b) { return a.concat(b); }, []);
    const body = qn.modules.map(function (m) {
      let h = '<h2>' + Util.esc(m.title || '') + '</h2><ol>';
      (m.questions || []).forEach(function (q) {
        h += '<li>' + Util.esc(q.label || '') + (q.required ? ' <strong>[' + T('必填') + ']</strong>' : '') +
          (q.level ? ' <em>(' + Util.levelInfo(q.level).t + ')</em>' : '') +
          (q.help ? '<br><span style="color:#666">' + Util.esc(q.help) + '</span>' : '') + '</li>';
      });
      return h + '</ol>';
    }).join('');
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + Util.esc(qn.title || '') + '</title></head><body>' +
      '<h1>' + Util.esc(qn.title || '') + '</h1>' +
      (qn.description ? '<p>' + Util.esc(qn.description) + '</p>' : '') +
      '<p>' + T('共 ') + qn.modules.length + T(' 章节 / ') + rows.length + T(' 题') + '</p>' + body + '</body></html>';
    const safe = (qn.title || 'questionnaire').replace(/[\\/:*?"<>|\s]+/g, '_');
    Util.download(new Blob(['\ufeff', html], { type: 'application/msword' }), safe + '_' + T('问卷') + '.doc');
    Util.toast(T('Word 已导出：') + safe, 'ok');
  }

  async function exportQnPdf(qn) {
    try { await ReportEngine.ensureLibs(['jspdf', 'autotable']); } catch (e) { Util.toast(T('PDF 组件加载失败：') + (e && e.message), 'err'); return; }
    const jsPDFCtor = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPDFCtor) { Util.toast(T('PDF 组件未加载'), 'err'); return; }
    const doc = new jsPDFCtor({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    doc.setFontSize(16); doc.text(qn.title || T('问卷'), 40, 48);
    doc.setFontSize(9);
    const rows = qn.modules.reduce(function (a, m) { return a + (m.questions ? m.questions.length : 0); }, 0);
    doc.text((T('共 ') + qn.modules.length + T(' 章节 / ') + rows + T(' 题')), 40, 66);
    let y = 90;
    qn.modules.forEach(function (m) {
      if (y > 760) { doc.addPage(); y = 48; }
      doc.setFontSize(12); doc.setTextColor(30, 30, 30);
      doc.text(m.title || '', 40, y); y += 18;
      doc.setFontSize(9); doc.setTextColor(90, 90, 90);
      (m.questions || []).forEach(function (q, i) {
        if (y > 780) { doc.addPage(); y = 48; }
        const label = (i + 1) + '. ' + (q.label || '');
        const lines = doc.splitTextToSize(label, W - 80);
        doc.text(lines, 48, y); y += lines.length * 12 + 4;
      });
      y += 6;
    });
    const safe = (qn.title || 'questionnaire').replace(/[\\/:*?"<>|\s]+/g, '_');
    doc.save(safe + '_' + T('问卷') + '.pdf');
    Util.toast(T('PDF 已导出：') + safe, 'ok');
  }

  async function importQnExcel(file) {
    try { await ReportEngine.ensureLibs(['xlsx']); } catch (e) { Util.toast(T('Excel 组件加载失败：') + (e && e.message), 'err'); return; }
    const XLSX = window.XLSX;
    if (!XLSX) { Util.toast(T('Excel 组件未加载'), 'err'); return; }
    file.arrayBuffer().then(function (ab) {
      const wb = XLSX.read(ab, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
      let hIdx = -1;
      for (let i = 0; i < data.length; i++) {
        if (Array.isArray(data[i]) && data[i].some(function (c) { const s = String(c).trim().toLowerCase(); return s === '问题' || s === 'question'; })) { hIdx = i; break; }
      }
      if (hIdx < 0) { Util.toast(T('未识别到问卷表头（需含“问题”列）'), 'err'); return; }
      const title = (hIdx > 0 && data[0] && data[0][0]) ? String(data[0][0]).trim() : (currentQn() ? currentQn().title : T('导入问卷'));
      const hdr = data[hIdx].map(function (c) { return String(c).trim(); });
      const KEYWORDS = {
        module: ['章节', 'module', 'section'], type: ['题型', 'type'], label: ['问题', 'question'],
        options: ['选项', 'option'], rmax: ['评分上限', 'rating'], nmin: ['数值最小', 'minimum'],
        nmax: ['数值最大', 'maximum'], req: ['必填', 'required'], level: ['等级', 'level'], help: ['提示', 'help']
      };
      const idx = {};
      for (const k in KEYWORDS) {
        let found = -1;
        for (let j = 0; j < hdr.length && found < 0; j++) {
          const c = hdr[j].toLowerCase();
          if (KEYWORDS[k].some(function (kw) { return c.indexOf(kw.toLowerCase()) >= 0; })) found = j;
        }
        idx[k] = found;
      }
      const mapType = function (s) { return { '文本': 'text', '长文本': 'textarea', '数字': 'number', '日期': 'date', '是否': 'yesno', '单选': 'single', '多选': 'multi', '评分': 'rating', text: 'text', textarea: 'textarea', number: 'number', date: 'date', yesno: 'yesno', single: 'single', multi: 'multi', rating: 'rating' }[String(s).trim()] || 'text'; };
      const mapLevel = function (s) { return { '红线/严重': 'critical', '重大': 'major', '一般': 'minor', '建议': 'suggest', critical: 'critical', major: 'major', minor: 'minor', suggest: 'suggest' }[String(s).trim()] || 'minor'; };
      const modules = [];
      let cur = null, qc = 0, mc = 0;
      for (let i = hIdx + 1; i < data.length; i++) {
        const r = data[i];
        if (!r || !r.length) continue;
        const get = function (k) { return (idx[k] >= 0 && r[idx[k]] != null) ? String(r[idx[k]]).trim() : ''; };
        const label = get('label');
        if (!label) continue;
        let mt = get('module');
        if (!mt) mt = cur ? cur.title : T('未命名章节');
        if (!cur || cur.title !== mt) { cur = { id: Util.uid('mod'), title: mt, questions: [] }; modules.push(cur); mc++; }
        const type = mapType(get('type'));
        const q = { id: Util.uid('q'), label: label, type: type, required: /^(是|y|yes|true|1)$/i.test(get('req')), level: mapLevel(get('level')) };
        if (get('help')) q.help = get('help');
        if (type === 'single' || type === 'multi') {
          const o = get('options').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
          q.options = o.length ? o : [T('选项一'), T('选项二')];
        }
        if (type === 'rating') { const m = Number(get('rmax')); q.max = m > 1 ? m : 5; }
        if (type === 'number') {
          const a = Number(get('nmin')), b = Number(get('nmax'));
          if (get('nmin') !== '' && !isNaN(a)) q.min = a;
          if (get('nmax') !== '' && !isNaN(b)) q.max = b;
        }
        cur.questions.push(q); qc++;
      }
      if (!qc) { Util.toast(T('未发现有效题目'), 'err'); return; }
      const nqn = { id: Util.uid('qn'), title: title, description: '', createdAt: Date.now(), updatedAt: Date.now(), status: 'draft', modules: modules };
      DB.addQuestionnaire(nqn);
      st.qnId = nqn.id; st.mode = 'edit'; st.modId = null; st.qId = null;
      rerender();
      Util.toast(T('已导入问卷') + '「' + title + '」 ' + mc + T(' 章节 / ') + qc + T(' 题'), 'ok');
    }).catch(function (e) { Util.toast(T('导入失败：') + (e && e.message ? e.message : T('未知错误')), 'err'); });
  }

  /* ---------- 问卷模板 JSON 导出 / 导入（独立于整库备份，便于单套问卷复用/分享） ---------- */
  function serializeQn(qn) {
    return JSON.stringify({ __iar_qn: true, version: 1, exportedAt: Date.now(), qn: qn }, null, 2);
  }
  function exportQnJson(qn) {
    try {
      const payload = serializeQn(qn);
      const safe = (qn.title || 'questionnaire').replace(/[\\/:*?"<>|\s]+/g, '_');
      Util.download(new Blob([payload], { type: 'application/json' }), safe + '_' + T('问卷模板') + '.json');
      Util.toast(T('JSON 模板已导出：') + safe, 'ok');
    } catch (e) { Util.toast(T('导出失败：') + (e && e.message ? e.message : T('未知错误')), 'err'); }
  }
  // 规整导入的问卷：补齐 id / 校验题型与等级 / 清理非法字段，避免脏数据污染主状态
  function normalizeImportedQn(src, titleOverride) {
    const VALID_TYPES = ['text', 'textarea', 'number', 'date', 'yesno', 'single', 'multi', 'rating'];
    const VALID_LEVELS = ['critical', 'major', 'minor', 'suggest'];
    const modules = (src.modules || []).map(function (m) {
      return {
        id: m.id || Util.uid('mod'),
        title: m.title || T('未命名章节'),
        questions: (m.questions || []).map(function (q) {
          const type = VALID_TYPES.indexOf(q.type) >= 0 ? q.type : 'text';
          const o = {
            id: q.id || Util.uid('q'),
            label: q.label || T('未命名问题'),
            type: type,
            required: !!q.required,
            level: VALID_LEVELS.indexOf(q.level) >= 0 ? q.level : 'minor',
            help: q.help || ''
          };
          if (type === 'single' || type === 'multi') o.options = (Array.isArray(q.options) && q.options.length) ? q.options.slice() : [T('选项一'), T('选项二')];
          if (type === 'rating') o.max = (Number(q.max) > 1) ? Number(q.max) : 5;
          if (type === 'number') {
            if (q.min != null && !isNaN(Number(q.min))) o.min = Number(q.min);
            if (q.max != null && !isNaN(Number(q.max))) o.max = Number(q.max);
          }
          return o;
        })
      };
    }).filter(function (m) { return m.questions.length; });
    return {
      id: Util.uid('qn'),
      title: titleOverride || src.title || T('导入问卷'),
      description: src.description || '',
      createdAt: Date.now(), updatedAt: Date.now(), status: 'draft',
      modules: modules
    };
  }
  async function importQnJson(file) {
    let text;
    try { text = await file.text(); }
    catch (e) { Util.toast(T('读取文件失败'), 'err'); return; }
    let obj;
    try { obj = JSON.parse(text); }
    catch (e) { Util.toast(T('文件不是有效的 JSON'), 'err'); return; }
    const src = (obj && obj.__iar_qn && obj.qn) ? obj.qn : (obj && Array.isArray(obj.modules) ? obj : null);
    if (!src || !Array.isArray(src.modules)) { Util.toast(T('无效的问卷模板文件（缺少题目结构）'), 'err'); return; }
    const nqn = normalizeImportedQn(src, (obj && obj.qn && obj.qn.title) || (obj && obj.title));
    DB.addQuestionnaire(nqn);
    st.qnId = nqn.id; st.mode = 'edit'; st.modId = null; st.qId = null;
    rerender();
    const qc = nqn.modules.reduce(function (a, m) { return a + (m.questions || []).length; }, 0);
    Util.toast(T('已导入问卷模板') + '「' + nqn.title + '」 ' + nqn.modules.length + T(' 章节 / ') + qc + T(' 题'), 'ok');
  }

  /* ---------- 暴露给冒烟测试 / 外部调用的稳定 API ---------- */
  Designer.render = Designer.render;
  Designer.moveModule = moveModule;         // 章节移动（拖拽排序核心）
  Designer.moveQuestion = moveQuestion;     // 题目移动（跨章节/同章节排序）
  Designer.addQuestionAt = addQuestionAt;   // 新增题目（组件库拖入/点击）
  Designer.newQuestionnaire = newQuestionnaire;
  Designer.enterEdit = enterEdit;
  Designer.goList = goList;
  Designer.publishAction = publishAction;
  Designer.flushSave = flushSave;
  Designer.markDirty = markDirty;
  Designer.quickAdd = quickAdd;
  Designer.exportQnExcel = exportQnExcel;
  Designer.exportQnWord = exportQnWord;
  Designer.exportQnPdf = exportQnPdf;
  Designer.importQnExcel = importQnExcel;
  Designer.exportQnJson = exportQnJson;
  Designer.importQnJson = importQnJson;
  Designer.serializeQn = serializeQn;
  Designer.normalizeImportedQn = normalizeImportedQn;
  Designer.deleteQn = deleteQn;
  Designer.duplicateModule = duplicateModule;       // 复制章节（拖拽到复制区）
  Designer.validateBeforePublish = validateBeforePublish; // 发布前完整性校验
  Designer.findQById = findQById;
  Designer.copyQuestion = copyQuestion;
  Designer.deleteQuestion = deleteQuestion;
  Designer.deleteModule = deleteModule;

  global.Designer = Designer;
})(window);

/* ===== src/js/facility.js ===== */
/* 外部供应商/工厂基本信息登记（字段可由客户自定义） */
(function (global) {
  const Facility = {};

  // 供应商等级（可划分的层级/类型）
  const TIER_OPTIONS = [
    '一级供应商', '二级供应商', '三级供应商',
    '原料供应商', '分包商', '代工厂 / OEM',
    '品牌方 / 自有工厂', '物流服务商', '其他'
  ];
  let currentTier = '';

  // 供应商等级选择控件（含“其他（自定义）”）
  function buildTierControl(data) {
    const wrap = Util.el('label', { class: 'fld' });
    wrap.appendChild(Util.el('span', { class: 'lbl', text: T('供应商等级') }));
    const sel = Util.el('select', {});
    sel.appendChild(Util.el('option', { value: '', text: T('— 未分类 —') }));
    TIER_OPTIONS.forEach((t) => { const op = Util.el('option', { value: t, text: T(t) }); if (data.tier === t) op.selected = true; sel.appendChild(op); });
    const customOp = Util.el('option', { value: '__custom__', text: T('其他（自定义）') });
    sel.appendChild(customOp);
    if (data.tier && TIER_OPTIONS.indexOf(data.tier) < 0) customOp.selected = true;
    const customI = Util.el('input', { type: 'text', class: 'tier-custom', placeholder: T('请输入等级名称'), style: 'margin-top:6px;display:' + ((data.tier && TIER_OPTIONS.indexOf(data.tier) < 0) ? 'block' : 'none') });
    if (data.tier && TIER_OPTIONS.indexOf(data.tier) < 0) customI.value = data.tier;
    sel.addEventListener('change', () => {
      customI.style.display = sel.value === '__custom__' ? 'block' : 'none';
      data.tier = sel.value === '__custom__' ? (customI.value || '') : sel.value;
    });
    customI.addEventListener('input', () => { data.tier = customI.value; });
    data.tier = (sel.value === '__custom__') ? (customI.value || '') : sel.value;
    wrap.appendChild(sel);
    wrap.appendChild(customI);
    return wrap;
  }

  Facility.render = function (mount) {
    mount.innerHTML = '';
    const state = DB.get();
    const fields = DB.getFacilityFields();
    const listFields = fields.filter((f) => f.list);

    // 等级筛选项（预设 + 数据中出现的自定义等级）
    const tierSet = {};
    state.facilities.forEach((f) => { if (f.tier) tierSet[f.tier] = true; });
    const tierOptions = [''].concat(TIER_OPTIONS).concat(Object.keys(tierSet).filter((t) => TIER_OPTIONS.indexOf(t) < 0));
    const tierFilter = Util.el('select', { class: 'tier-filter', onchange: (e) => { currentTier = e.target.value; Facility.render(mount); } });
    tierOptions.forEach((t) => { const op = Util.el('option', { value: t, text: t === '' ? T('全部等级') : T(t) }); if (t === currentTier) op.selected = true; tierFilter.appendChild(op); });

    const head = Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('供应商登记') }),
        Util.el('div', { class: 'muted', text: T('登记被审核的供应商与工厂基本信息，作为评估与报告的对象。字段可在「登记字段」中自定义。') })
      ]),
      Util.el('div', { class: 'btn-row' }, [
        tierFilter,
        Util.el('button', { class: 'btn', html: Util.icon('gear') + T(' 登记字段'), onclick: () => openFieldDesigner() }),
        Util.el('button', { class: 'btn btn-primary', onclick: () => openEditor(null) }, T('+ 新增供应商'))
      ])
    ]);
    mount.appendChild(head);

    const list = state.facilities.filter((f) => !currentTier || f.tier === currentTier);
    if (!list.length) {
      mount.appendChild(Util.el('div', { class: 'empty', text: currentTier ? (T('当前等级「') + T(currentTier) + T('」下暂无供应商记录。')) : T('暂无供应商记录，点击右上角「新增供应商」开始登记。') }));
      return;
    }

    const panel = Util.el('div', { class: 'panel' });
    const tbl = Util.el('table', { class: 'tbl' });
    const thead = Util.el('tr', {});
    listFields.forEach((f) => thead.appendChild(Util.el('th', { text: f.label })));
    thead.appendChild(Util.el('th', { text: T('供应商等级') }));
    thead.appendChild(Util.el('th', { text: T('关联评估') }));
    thead.appendChild(Util.el('th', { text: T('更新时间') }));
    thead.appendChild(Util.el('th', { text: T('操作') }));
    tbl.appendChild(Util.el('thead', {}, thead));

    const tb = Util.el('tbody', {});
    list.forEach((f) => {
      const cnt = state.assessments.filter((a) => a.facilityId === f.id).length;
      const tds = listFields.map((lf) => {
        const v = Util.fmtFacVal(lf, f[lf.key]);
        if (lf.key === 'code') return Util.el('td', {}, [Util.el('span', { class: 'tag gray', text: v })]);
        if (lf.key === 'name') return Util.el('td', { html: '<strong>' + Util.esc(f[lf.key] || '-') + '</strong>' });
        return Util.el('td', { text: v });
      });
      const tierCell = f.tier ? Util.el('td', {}, [Util.el('span', { class: 'tier-badge', text: f.tier })]) : Util.el('td', { class: 'muted', text: '—' });
      tb.appendChild(Util.el('tr', {}, tds.concat([
        tierCell,
        Util.el('td', {}, [cnt ? Util.el('span', { class: 'tag', text: cnt + T(' 份') }) : Util.el('span', { class: 'muted', text: '0' })]),
        Util.el('td', { class: 'muted', text: Util.fmtDate(f.updatedAt) }),
        Util.el('td', {}, [
          Util.el('button', { class: 'btn-icon', title: T('查看档案'), html: Util.icon('eye'), onclick: () => openProfile(f.id) }),
          Util.el('button', { class: 'btn-icon', title: T('编辑'), html: Util.icon('pencil'), onclick: () => openEditor(f.id) }),
          Util.el('button', { class: 'btn-icon', title: T('删除'), html: Util.icon('trash'), onclick: () => remove(f.id) })
        ])
      ])));
    });
    tbl.appendChild(tb);
    panel.appendChild(tbl);
    mount.appendChild(panel);
  };

  // ---------------- 供应商编辑（动态字段表单） ----------------
  function openEditor(id) {
    const editing = id ? DB.getFacility(id) : null;
    const fields = DB.getFacilityFields();
    const data = editing ? Object.assign({}, editing) : { ownerType:T('自有') };
    const form = Util.el('div', {});

    fields.forEach((fld) => {
      let input;
      const val = data[fld.key];
      if (fld.type === 'textarea') {
        input = Util.el('textarea', { placeholder: fld.placeholder || '', html: Util.esc(val || '') });
      } else if (fld.type === 'select') {
        input = Util.el('select', {});
        input.appendChild(Util.el('option', { value: '', text: T('— 请选择 —') }));
        (fld.options || []).forEach((o) => { const op = Util.el('option', { value: o, text: o }); if (val === o) op.selected = true; input.appendChild(op); });
      } else if (fld.type === 'yesno') {
        input = Util.el('select', {});
        input.appendChild(Util.el('option', { value: '', text: T('— 请选择 —') }));
        [T('是'), T('否')].forEach((o) => { const op = Util.el('option', { value: o, text: o }); if (String(val) === o) op.selected = true; input.appendChild(op); });
      } else if (fld.type === 'date') {
        input = Util.el('input', { type: 'date', value: val || '' });
      } else {
        const itype = fld.type === 'number' ? 'number' : (fld.type === 'email' ? 'email' : 'text');
        input = Util.el('input', { type: itype, placeholder: fld.placeholder || '', value: val != null ? val : '' });
      }
      input.addEventListener('input', () => {
        if (fld.type === 'number') data[fld.key] = input.value === '' ? null : Number(input.value);
        else data[fld.key] = input.value;
      });
      input.addEventListener('change', () => { if (fld.type === 'select' || fld.type === 'yesno') data[fld.key] = input.value; });
      form.appendChild(Util.el('label', { class: 'fld' }, [
        Util.el('span', { class: 'lbl', text: (fld.required ? '* ' : '') + fld.label }),
        fld.help ? Util.el('span', { class: 'hint-inline', text: fld.help }) : null,
        input
      ]));
    });

    // 被审核单位档案补充信息（统一社会信用代码必填并校验）
    const archSec = Util.el('div', { class: 'fld-archive' });
    archSec.appendChild(Util.el('div', { class: 'fld-sec-title', text: T('被审核单位档案（核心标识）') }));
    const ccI = Util.el('input', { type: 'text', value: data.creditCode || '', placeholder: T('18 位统一社会信用代码'), maxlength: 18 });
    const ccErr = Util.el('div', { class: 'fld-err', style: 'color:#dc3a36;font-size:11px;display:none', text: T('信用代码格式不正确（应为 18 位，含数字与大写字母，不含 I/O/Z/S/V，末位可为数字或 X）') });
    ccI.addEventListener('input', () => { data.creditCode = ccI.value.trim(); ccErr.style.display = (ccI.value && !Util.validateCreditCode(ccI.value)) ? '' : 'none'; });
    archSec.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: '* ' + T('统一社会信用代码') }), ccI, ccErr]));
    const ladI = Util.el('input', { type: 'date', value: data.lastAuditDate || '' });
    ladI.addEventListener('input', () => { data.lastAuditDate = ladI.value; });
    archSec.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('上次审核日期') }), ladI]));
    const scopeI = Util.el('textarea', { placeholder: T('如 服装设计、生产、销售；进出口贸易等'), html: Util.esc(data.scope || '') });
    scopeI.addEventListener('input', () => { data.scope = scopeI.value; });
    archSec.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('经营范围') }), scopeI]));

    form.insertBefore(buildTierControl(data), form.firstChild);
    form.appendChild(archSec);

    // 地理与绩效（供应链看板：地图分布 / 绩效颜色编码）
    const geoSec = Util.el('div', { class: 'fld-archive' });
    geoSec.appendChild(Util.el('div', { class: 'fld-sec-title', text: T('地理与绩效（供应链看板用）') }));
    const countryI = Util.el('input', { type: 'text', value: data.country || '', placeholder: T('如 中国 / 越南') });
    countryI.addEventListener('input', () => { data.country = countryI.value.trim(); });
    const cityI = Util.el('input', { type: 'text', value: data.city || '', placeholder: T('如 深圳 / 胡志明市') });
    cityI.addEventListener('input', () => { data.city = cityI.value.trim(); });
    const latI = Util.el('input', { type: 'number', step: 'any', value: data.lat != null ? data.lat : '', placeholder: T('如 22.54') });
    latI.addEventListener('input', () => { data.lat = latI.value === '' ? null : Number(latI.value); });
    const lngI = Util.el('input', { type: 'number', step: 'any', value: data.lng != null ? data.lng : '', placeholder: T('如 114.06') });
    lngI.addEventListener('input', () => { data.lng = lngI.value === '' ? null : Number(lngI.value); });
    const statusSel = Util.el('select', {});
    [['active', T('合作中')], ['paused', T('暂停合作')], ['potential', T('潜在')], ['terminated', T('已终止')]].forEach((kv) => {
      const op = Util.el('option', { value: kv[0], text: kv[1] }); if ((data.status || 'active') === kv[0]) op.selected = true; statusSel.appendChild(op);
    });
    statusSel.addEventListener('change', () => { data.status = statusSel.value; });
    const otI = Util.el('input', { type: 'number', min: '0', max: '100', value: data.perfOnTime != null ? data.perfOnTime : '', placeholder: '0–100' });
    otI.addEventListener('input', () => { data.perfOnTime = otI.value === '' ? null : Number(otI.value); });
    const qlI = Util.el('input', { type: 'number', min: '0', max: '100', value: data.perfQuality != null ? data.perfQuality : '', placeholder: '0–100' });
    qlI.addEventListener('input', () => { data.perfQuality = qlI.value === '' ? null : Number(qlI.value); });
    geoSec.appendChild(Util.el('div', { class: 'row' }, [
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('国家/地区') }), countryI]),
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('城市') }), cityI])
    ]));
    geoSec.appendChild(Util.el('div', { class: 'row' }, [
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('纬度 (lat)') }), latI]),
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('经度 (lng)') }), lngI])
    ]));
    geoSec.appendChild(Util.el('div', { class: 'row' }, [
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('合作状态') }), statusSel]),
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('准时交货率 (%)') }), otI])
    ]));
    geoSec.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('质量合格率 (%)') }), qlI]));
    form.appendChild(geoSec);

    const buttons = [
      Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('取消')),
      Util.el('button', { class: 'btn btn-primary', onclick: () => save(id, data, fields) }, editing ?T('保存修改') :T('创建'))
    ];
    Util.modal(editing ?T('编辑供应商') :T('新增供应商'), form, buttons);
  }

  function save(id, data, fields) {
    for (const fld of fields) {
      if (fld.required && (data[fld.key] === undefined || data[fld.key] === null || data[fld.key] === '')) {
        Util.toast(T('请填写必填项：') + fld.label, 'err'); return;
      }
    }
    if (!data.name || !data.code) { Util.toast(T('请填写供应商编码与名称'), 'err'); return; }
    if (!data.creditCode) { Util.toast(T('请填写统一社会信用代码'), 'err'); return; }
    if (!Util.validateCreditCode(data.creditCode)) { Util.toast(T('信用代码格式不正确（应为 18 位，含数字与大写字母，不含 I/O/Z/S/V，末位可为数字或 X）'), 'err'); return; }
    if ((data.lat != null && (data.lat < -90 || data.lat > 90)) || (data.lng != null && (data.lng < -180 || data.lng > 180))) { Util.toast(T('经纬度超出有效范围'), 'err'); return; }
    if ((data.perfOnTime != null && (data.perfOnTime < 0 || data.perfOnTime > 100)) || (data.perfQuality != null && (data.perfQuality < 0 || data.perfQuality > 100))) { Util.toast(T('绩效百分比须在 0–100 之间'), 'err'); return; }
    if (id) {
      DB.updateFacility(id, data);
      Util.toast(T('已保存'), 'ok');
    } else {
      data.id = Util.uid('fac');
      data.createdAt = Date.now(); data.updatedAt = Date.now();
      DB.addFacility(data);
      Util.toast(T('供应商已登记'), 'ok');
    }
    Util.closeModal();
    Facility.render(document.getElementById('content'));
  }

  // ---------------- 供应商档案详情（只读 + 完善入口） ----------------
  function openProfile(id) {
    const f = DB.getFacility(id);
    if (!f) { Util.toast(T('供应商不存在'), 'err'); return; }
    const fields = DB.getFacilityFields();
    const state = DB.get();
    const related = state.assessments
      .filter((a) => a.facilityId === id)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const mount = document.getElementById('content');

    mount.innerHTML = '';
    mount.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('供应商档案：') + (f.name || '') }),
        Util.el('div', { class: 'muted', text: T('供应商编码 ') + (f.code || '-') + (f.tier ? T(' · 等级：') + f.tier : '') + T(' · 关联评估 ') + related.length })
      ]),
      Util.el('div', { class: 'btn-row' }, [
        Util.el('button', { class: 'btn', onclick: () => Facility.render(mount) }, T('← 返回列表')),
        Util.el('button', { class: 'btn btn-primary', html: Util.icon('pencil') + T(' 完善档案'), onclick: () => openEditor(id) })
      ])
    ]));

    // 登记信息（按字段只读展示）
    const panel = Util.el('div', { class: 'panel card' });
    panel.appendChild(Util.el('h3', { text: T('档案信息'), style: 'margin-top:0' }));
    const grid = Util.el('div', { class: 'fac-profile' });
    grid.appendChild(Util.el('div', { class: 'fp-item' }, [
      Util.el('div', { class: 'fp-k', text: T('供应商等级') }),
      Util.el('div', { class: 'fp-v' }, [f.tier ? Util.el('span', { class: 'tier-badge', text: f.tier }) : Util.el('span', { class: 'muted', text: T('未分类') })])
    ]));
    fields.forEach((fld) => {
      grid.appendChild(Util.el('div', { class: 'fp-item' }, [
        Util.el('div', { class: 'fp-k', text: fld.label }),
        Util.el('div', { class: 'fp-v', text: Util.fmtFacVal(fld, f[fld.key]) })
      ]));
    });
    const STATUS_LABEL = { active: T('合作中'), paused: T('暂停合作'), terminated: T('已终止'), potential: T('潜在') };
    [['统一社会信用代码', f.creditCode || '—'], ['国家/地区', f.country || '—'], ['城市', f.city || '—'], ['合作状态', f.status ? (STATUS_LABEL[f.status] || f.status) : '—'], ['准时交货率', f.perfOnTime != null ? f.perfOnTime + '%' : '—'], ['质量合格率', f.perfQuality != null ? f.perfQuality + '%' : '—'], ['经营范围', f.scope || '—']].forEach((kv) => {
      grid.appendChild(Util.el('div', { class: 'fp-item' }, [
        Util.el('div', { class: 'fp-k', text: T(kv[0]) }),
        Util.el('div', { class: 'fp-v', text: kv[1] })
      ]));
    });
    panel.appendChild(grid);
    mount.appendChild(panel);

    // 关联评估（可点击查看）
    const aPanel = Util.el('div', { class: 'panel card', style: 'margin-top:16px' });
    aPanel.appendChild(Util.el('h3', { text: T('关联评估（') + related.length + T(' 份）'), style: 'margin-top:0' }));
    if (!related.length) {
      aPanel.appendChild(Util.el('div', { class: 'muted', text: T('暂无对该供应商的评估记录。可在「评估填写」中新建。') }));
    } else {
      const list = Util.el('div', { class: 'fp-assess' });
      related.forEach((a) => {
        const qn = DB.getQuestionnaire(a.questionnaireId);
        const sc = DB.computeScore(qn, a.answers);
        list.appendChild(Util.el('div', { class: 'fp-assess-item', style: 'cursor:pointer', onclick: () => Assess.openView(a.id, mount) }, [
          Util.el('div', {}, [
            Util.el('strong', { text: qn ? qn.title : T('已删除问卷') }),
            Util.el('span', { class: 'muted', text: ' · ' + Util.fmtDate(a.date) })
          ]),
          Util.el('div', { class: 'fp-assess-meta' }, [
            sc.max ? Util.el('span', { text: sc.percent + '%' }) : Util.el('span', { class: 'muted', text: '—' }),
            Util.el('span', { text: ' · ' }),
            a.status === 'done' ? Util.el('span', { class: 'tag ok', text: T('完成') }) : Util.el('span', { class: 'tag gray', text: T('草稿') })
          ])
        ]));
      });
      aPanel.appendChild(list);
    }
    mount.appendChild(aPanel);

    // 文件管理子模块（PDF / Excel 归档）
    const fm = renderFacFiles(f);
    if (fm) mount.appendChild(fm);
  }

  function remove(id) {
    const cnt = DB.get().assessments.filter((a) => a.facilityId === id).length;
    const body = cnt ? (T('该供应商已关联 <b>') + cnt + T('</b> 份评估记录，删除后这些评估也会一并移除。确认删除？')) :T('确认删除该供应商记录？');
    Util.confirm(T('删除供应商'), body, T('删除')).then((ok) => {
      if (!ok) return;
      DB.deleteFacility(id);
      Util.toast(T('已删除'), 'ok');
      Facility.render(document.getElementById('content'));
    });
  }

  // ---------------- 登记字段设计器 ----------------
  function openFieldDesigner() {
    const fields = DB.getFacilityFields().map((x) => Object.assign({}, x));
    const content = Util.el('div', {});
    const body = Util.el('div', { class: 'fld-designer' });
    content.appendChild(body);
    const footer = [
      Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('取消')),
      Util.el('button', { class: 'btn', onclick: () => addField(fields, renderList) }, T('+ 添加字段')),
      Util.el('button', { class: 'btn btn-primary', onclick: () => {
        DB.saveFacilityFields(fields).then(() => { Util.toast(T('字段设置已保存'), 'ok'); Util.closeModal(); Facility.render(document.getElementById('content')); });
      } }, T('完成'))
    ];
    Util.modal(T('登记字段设置'), content, footer);

    function renderList() {
      body.innerHTML = '';
      body.appendChild(Util.el('div', { class: 'tip', text: T('自定义供应商登记需要填写的内容：可增删、排序、设置必填与是否在列表中显示。带 🔒 的字段为系统标识字段（编码/名称），不可删除、类型不可改。') }));
      const wrap = Util.el('div', { class: 'fld-list' });
      fields.forEach((f, i) => {
        const row = Util.el('div', { class: 'fld-row' }, [
          Util.el('div', { class: 'fld-meta' }, [
            Util.el('span', { class: 'fld-name', text: (f.locked ? '🔒 ' : '') + f.label + (f.required ? ' *' : '') }),
            Util.el('span', { class: 'badge', text: Util.facTypeLabel(f.type) }),
            f.list ? Util.el('span', { class: 'badge gray', text: T('列表显示') }) : null
          ]),
          Util.el('div', { class: 'fld-ops' }, [
            Util.el('button', { class: 'btn-icon', title: T('上移'), html: Util.icon('up'), onclick: () => { DB.reorderFacilityField(f.id, -1).then(() => { fields = DB.getFacilityFields().map((x) => Object.assign({}, x)); renderList(); }); } }),
            Util.el('button', { class: 'btn-icon', title: T('下移'), html: Util.icon('down'), onclick: () => { DB.reorderFacilityField(f.id, 1).then(() => { fields = DB.getFacilityFields().map((x) => Object.assign({}, x)); renderList(); }); } }),
            Util.el('button', { class: 'btn-icon', title: T('编辑'), html: Util.icon('pencil'), onclick: () => editField(f, fields, renderList) }),
            f.locked ? Util.el('span', { class: 'muted', text: T('锁定') }) : Util.el('button', { class: 'btn-icon', title: T('删除'), html: Util.icon('trash'), onclick: () => {
              Util.confirm(T('删除字段'), T('确认删除字段「') + f.label + T('」？已填写的数据将不再显示（但不会被强制清除）。'), T('删除')).then((ok) => { if (!ok) return; DB.deleteFacilityField(f.id).then(() => { fields = DB.getFacilityFields().map((x) => Object.assign({}, x)); renderList(); }); });
            } })
          ])
        ]);
        wrap.appendChild(row);
      });
      body.appendChild(wrap);
    }
    renderList();
  }

  function addField(fields, after) {
    editField(null, fields, after);
  }

  function editField(field, fields, after) {
    const isNew = !field;
    const draft = field ? Object.assign({}, field) : { label: '', type: 'text', required: false, list: false, placeholder: '', options: [] };
    const c = Util.el('div', {});

    const lblI = Util.el('input', { type: 'text', value: draft.label || '', placeholder: T('如 占地面积 / 安全负责人') });
    const typeI = Util.el('select', {});
    ['text', 'textarea', 'number', 'date', 'yesno', 'select', 'email'].forEach((t) => { const op = Util.el('option', { value: t, text: Util.facTypeLabel(t) }); if (draft.type === t) op.selected = true; typeI.appendChild(op); });
    const reqC = Util.el('input', { type: 'checkbox' }); reqC.checked = !!draft.required;
    const listC = Util.el('input', { type: 'checkbox' }); listC.checked = !!draft.list;
    const phI = Util.el('input', { type: 'text', value: draft.placeholder || '', placeholder: T('填写提示（可选）') });
    const optI = Util.el('textarea', { placeholder: T('单选类型：每行一个选项'), html: Util.esc((draft.options || []).join('\n')) });

    function rebuild() {
      c.innerHTML = '';
      c.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('字段名称 *') }), lblI]));
      c.appendChild(Util.el('div', { class: 'row' }, [
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('类型') }), typeI]),
        Util.el('label', { class: 'fld inline' }, [reqC, Util.el('span', { text: T(' 必填') })]),
        Util.el('label', { class: 'fld inline' }, [listC, Util.el('span', { text: T(' 在列表显示') })])
      ]));
      c.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('提示文字') }), phI]));
      if (typeI.value === 'select') {
        c.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('选项（每行一个）') }), optI]));
      }
      if (field && field.locked) {
        c.appendChild(Util.el('div', { class: 'tip', text: T('此为系统标识字段，类型不可修改，且不可删除。') }));
      }
    }
    typeI.addEventListener('change', rebuild);
    rebuild();

    const buttons = [
      Util.el('button', { class: 'btn', onclick: () => after() }, T('取消')),
      Util.el('button', { class: 'btn btn-primary', onclick: () => {
        const label = lblI.value.trim();
        if (!label) { Util.toast(T('请填写字段名称'), 'err'); return; }
        const obj = {
          id: draft.id, key: draft.key, label, type: (field && field.locked) ? field.type : typeI.value,
          required: reqC.checked, list: listC.checked, placeholder: phI.value.trim(),
          options: typeI.value === 'select' ? optI.value.split('\n').map((s) => s.trim()).filter(Boolean) : (draft.options || []),
          locked: !!draft.locked
        };
        DB.upsertFacilityField(obj).then(() => { Util.toast(T('已保存字段'), 'ok'); after(); });
      } }, isNew ?T('添加') :T('保存'))
    ];
    Util.modal(isNew ?T('添加字段') :T('编辑字段'), c, buttons);
  }

  // ---------------- 供应商档案文件管理（PDF / Excel 归档） ----------------
  function dataURLToBlob(durl) {
    if (typeof durl !== 'string' || durl.indexOf('data:') !== 0) return null;
    try {
      const m = durl.match(/^data:(.*?);base64,(.*)$/);
      if (!m) return null;
      const mime = m[1] || 'application/octet-stream';
      const bin = atob(m[2]);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime });
    } catch (e) { return null; }
  }
  function facRole() {
    if (global.Auth && typeof Auth.currentUser === 'function') {
      const u = Auth.currentUser();
      if (u && u.role) return u.role;
    }
    return 'admin';
  }
  // 权限矩阵：角色对文件操作的能力（admin/buyer 可编辑；manager/user 仅查看与下载）
  const FAC_PERM = [
    { role: 'admin', up: true, dl: true, view: true, del: true, rb: true },
    { role: 'buyer', up: true, dl: true, view: true, del: false, rb: true },
    { role: 'manager', up: false, dl: true, view: true, del: false, rb: false },
    { role: 'user', up: false, dl: true, view: true, del: false, rb: false }
  ];
  function facPerm() { const r = facRole(); const row = FAC_PERM.find((x) => x.role === r); return row || FAC_PERM[0]; }

  function downloadFacFile(rec) {
    const blob = dataURLToBlob(rec.data);
    if (!blob) { Util.toast(T('文件数据缺失，无法下载'), 'err'); return; }
    Util.download(blob, rec.fileName);
  }
  function viewFacFile(f, rec) {
    const body = Util.el('div', { class: 'fac-detail' }, [
      detRow(T('自动文件名'), rec.fileName),
      detRow(T('原始文件名'), rec.originalName || '—'),
      detRow(T('文件分类'), rec.categoryLabel),
      rec.side !== 'none' ? detRow(T('正反面'), rec.side === 'front' ? T('正面（正本）') : T('反面（副本）')) : null,
      detRow(T('版本'), 'v' + rec.version + (rec.isCurrent ? ' · ' + T('当前') : '')),
      detRow(T('上传人'), rec.uploadedBy || '—'),
      detRow(T('上传时间'), Util.fmtDateTime(rec.uploadedAt)),
      detRow(T('大小'), (rec.size / 1024).toFixed(1) + ' KB'),
      detRow(T('到期日'), rec.expiryDate || T('未设置')),
      detRow(T('备注'), rec.note || '—'),
      detRow(T('版本说明'), rec.versionNote || '—')
    ]);
    const foot = [Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('关闭'))];
    if (facPerm().dl) foot.unshift(Util.el('button', { class: 'btn btn-primary', onclick: () => downloadFacFile(rec) }, T('下载')));
    Util.modal(T('文件详情'), body, foot);
  }
  function detRow(k, v) { return Util.el('div', { class: 'det-row' }, [Util.el('span', { class: 'det-k', text: k }), Util.el('span', { class: 'det-v', text: v })]); }

  function facFileRow(f, rec, perms) {
    const row = Util.el('div', { class: 'fac-file-row' + (rec.isCurrent ? '' : ' hist') });
    const meta = Util.el('div', { class: 'fac-file-meta' }, [
      Util.el('span', { class: 'fac-file-name', text: rec.fileName }),
      rec.side !== 'none' ? Util.el('span', { class: 'badge gray', text: rec.side === 'front' ? T('正面') : T('反面') }) : null,
      Util.el('span', { class: 'fac-file-ver', text: ' v' + rec.version + (rec.isCurrent ? ' · ' + T('当前') : '') }),
      Util.el('span', { class: 'muted', text: ' · ' + (rec.uploadedBy || '—') + ' · ' + Util.fmtDateTime(rec.uploadedAt) + ' · ' + (rec.size / 1024).toFixed(1) + ' KB' })
    ]);
    if (rec.expiryDate) {
      const days = Math.ceil((new Date(rec.expiryDate + 'T00:00:00') - new Date()) / 86400000);
      const expired = days < 0;
      const soon = days >= 0 && days <= 90;
      if (expired || soon) meta.appendChild(Util.el('span', { class: 'fac-exp ' + (expired ? 'exp-expired' : 'exp-soon'), text: (expired ? T('已过期') : T('{0} 天内到期', days)) + ' · ' + rec.expiryDate }));
    }
    row.appendChild(meta);
    const ops = Util.el('div', { class: 'fac-file-ops' });
    if (perms.dl) ops.appendChild(btnIcon('file', T('下载'), () => downloadFacFile(rec)));
    if (perms.view) ops.appendChild(btnIcon('eye', T('详情'), () => viewFacFile(f, rec)));
    if (!rec.isCurrent && perms.rb) ops.appendChild(btnIcon('clock', T('设为当前（回滚）'), () => {
      Util.confirm(T('回滚版本'), T('确认将 {0} 设为当前版本？历史版本保留，可再次回滚。', rec.fileName), T('回滚')).then((ok) => {
        if (!ok) return;
        DB.rollbackFacAttachment(rec.id).then(() => { Util.toast(T('已回滚至 v{0}', rec.version), 'ok'); Facility.renderProfileSafe(f.id); }).catch((e) => Util.toast(e.message || T('回滚失败'), 'err'));
      });
    }));
    if (perms.del) ops.appendChild(btnIcon('trash', T('删除'), () => {
      Util.confirm(T('删除文件'), T('确认删除 {0}？', rec.fileName) + (rec.isCurrent ? T('当前版本删除后，将自动回退至最新历史版本。') : ''), T('删除')).then((ok) => {
        if (!ok) return;
        DB.deleteFacAttachment(rec.id).then(() => { Util.toast(T('已删除'), 'ok'); Facility.renderProfileSafe(f.id); }).catch((e) => Util.toast(e.message || T('删除失败'), 'err'));
      });
    }));
    row.appendChild(ops);
    return row;
  }
  function btnIcon(name, title, onclick) { return Util.el('button', { class: 'btn-icon', title: title, html: Util.icon(name), onclick: onclick }); }

  function showPermMatrix() {
    const tbl = Util.el('table', { class: 'tbl perm-matrix' });
    tbl.appendChild(Util.el('thead', {}, Util.el('tr', {}, [
      Util.el('th', { text: T('角色') }), Util.el('th', { text: T('上传') }), Util.el('th', { text: T('下载') }),
      Util.el('th', { text: T('查看') }), Util.el('th', { text: T('删除') }), Util.el('th', { text: T('版本回滚') })
    ])));
    const tb = Util.el('tbody', {});
    FAC_PERM.forEach((p) => {
      tb.appendChild(Util.el('tr', {}, [
        Util.el('td', { text: (global.Auth && Auth.roleLabel) ? Auth.roleLabel(p.role) : p.role }),
        Util.el('td', { text: p.up ? T('✓') : T('—') }),
        Util.el('td', { text: p.dl ? T('✓') : T('—') }),
        Util.el('td', { text: p.view ? T('✓') : T('—') }),
        Util.el('td', { text: p.del ? T('✓') : T('—') }),
        Util.el('td', { text: p.rb ? T('✓') : T('—') })
      ]));
    });
    tbl.appendChild(tb);
    const body = Util.el('div', {}, [
      Util.el('div', { class: 'tip', text: T('权限依据当前登录账户的角色判定；角色变更由管理员在「管理员后台」维护。') }),
      tbl
    ]);
    Util.modal(T('文件权限矩阵'), body, [Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('关闭'))]);
  }

  function renderFacFiles(f) {
    const cats = DB.facFileCats || [];
    if (!cats.length) return null;
    const panel = Util.el('div', { class: 'panel card', style: 'margin-top:16px' });
    panel.appendChild(Util.el('h3', { text: T('文件管理'), style: 'margin-top:0' }));

    const perms = facPerm();
    const quotaBox = Util.el('div', { class: 'fac-quota muted' });
    panel.appendChild(quotaBox);
    DB.facFileQuota(f.id).then((q) => {
      quotaBox.textContent = T('已归档 {0} 份文件 · 占用 {1} MB / 配额 {2} MB', q.count, (q.bytes / 1024 / 1024).toFixed(1), (q.limit / 1024 / 1024).toFixed(0));
      quotaBox.classList.toggle('quota-warn', !!q.exceeded);
    });
    panel.appendChild(Util.el('button', { class: 'btn btn-sm', style: 'margin-bottom:10px', onclick: showPermMatrix }, T('权限说明')));

    const catsWrap = Util.el('div', { class: 'fac-cats' });
    panel.appendChild(catsWrap);

    const refreshers = [];
    cats.forEach((cat) => {
      const sec = Util.el('div', { class: 'fac-cat' });
      sec.appendChild(Util.el('div', { class: 'fac-cat-title' }, [
        Util.el('strong', { text: cat.key }),
        cat.frontBack ? Util.el('span', { class: 'badge gray', text: T('需正反面') }) : null
      ]));

      const upRow = Util.el('div', { class: 'fac-up' });
      let sideSel = null;
      if (cat.frontBack) {
        sideSel = Util.el('select', { class: 'fac-side' }, [
          Util.el('option', { value: 'front', text: T('正面（正本）') }),
          Util.el('option', { value: 'back', text: T('反面（副本）') })
        ]);
        upRow.appendChild(sideSel);
      }
      const fileI = Util.el('input', { type: 'file', accept: '.pdf,.xlsx,.xls', multiple: true, class: 'fac-file' });
      const expiryI = Util.el('input', { type: 'date', class: 'fac-exp-input', title: T('到期日（可选）') });
      const noteI = Util.el('input', { type: 'text', class: 'fac-note-input', placeholder: T('备注（可选）') });
      const upBtn = Util.el('button', { class: 'btn btn-primary btn-sm', text: T('上传') });
      if (!perms.up) { upBtn.disabled = true; upBtn.title = T('当前角色无上传权限'); }
      upRow.appendChild(fileI); upRow.appendChild(expiryI); upRow.appendChild(noteI); upRow.appendChild(upBtn);
      sec.appendChild(upRow);
      sec.appendChild(Util.el('div', { class: 'fac-up-hint muted', text: T('仅支持 PDF / Excel（.pdf/.xlsx/.xls）；单文件 ≤ 10MB；单次最多 10 个；系统按「供应商编码_分类_日期」自动命名。') }));

      const listBox = Util.el('div', { class: 'fac-files' });
      sec.appendChild(listBox);
      catsWrap.appendChild(sec);

      const refresh = () => {
        DB.getFacAttachments(f.id).then((all) => {
          listBox.innerHTML = '';
          const slot = all.filter((x) => x.category === cat.code && (cat.frontBack ? true : x.side === 'none') && !x.deleted);
          const cur = slot.filter((x) => x.isCurrent);
          const hist = slot.filter((x) => !x.isCurrent).sort((a, b) => (b.version || 0) - (a.version || 0));
          if (!cur.length) {
            listBox.appendChild(Util.el('div', { class: 'muted', text: T('暂无文件') }));
          } else {
            cur.forEach((rec) => listBox.appendChild(facFileRow(f, rec, perms)));
            if (cat.frontBack) {
              const hasFront = cur.some((x) => x.side === 'front');
              const hasBack = cur.some((x) => x.side === 'back');
            if (!hasFront || !hasBack) {
              listBox.appendChild(Util.el('div', { class: 'fac-valid-warn' }, [
                Util.el('span', { text: T('⚠ 营业执照需同时上传正面（正本）与反面（副本）；当前缺失：') + (!hasFront ? (T('正面') + ' ') : '') + (!hasBack ? T('反面') : '') })
              ]));
            }
            }
          }
          if (hist.length) {
            listBox.appendChild(Util.el('div', { class: 'fac-hist-title', text: T('历史版本') }));
            hist.forEach((rec) => listBox.appendChild(facFileRow(f, rec, perms)));
          }
        });
      };
      refreshers.push(refresh);
      refresh();

      upBtn.addEventListener('click', () => {
        if (!perms.up) { Util.toast(T('当前角色无上传权限'), 'err'); return; }
        const files = Array.from(fileI.files || []);
        if (!files.length) { Util.toast(T('请先选择文件'), 'err'); return; }
        if (files.length > DB.FAC_FILE_LIMITS.maxBatch) { Util.toast(T('单次最多上传 {0} 个文件', DB.FAC_FILE_LIMITS.maxBatch), 'err'); return; }
        const L = DB.FAC_FILE_LIMITS;
        for (const fi of files) {
          const ext = (fi.name.split('.').pop() || '').toLowerCase();
          if (L.acceptedExt.indexOf(ext) < 0) { Util.toast(T('不支持的文件类型：{0}（仅允许 PDF / Excel）', fi.name), 'err'); return; }
          if (fi.size > L.maxSizeMB * 1024 * 1024) { Util.toast(T('文件超出 10MB 限制：{0}', fi.name), 'err'); return; }
        }
        const side = sideSel ? sideSel.value : 'none';
        const exp = expiryI.value || '';
        const note = noteI.value || '';
        DB.facFileQuota(f.id).then((q) => { if (q.exceeded) Util.toast(T('该供应商文件已超出配额，仍允许上传，建议清理历史版本'), 'warn'); });
        let i = 0;
        const next = () => {
          if (i >= files.length) { fileI.value = ''; expiryI.value = ''; noteI.value = ''; Util.toast(T('已上传 {0} 个文件', files.length), 'ok'); Facility.renderProfileSafe(f.id); return; }
          const fi = files[i++];
          const ext = (fi.name.split('.').pop() || '').toLowerCase();
          const reader = new FileReader();
          reader.onload = () => {
            DB.addFacAttachment(f.id, { category: cat.code, categoryLabel: cat.key, side: side, originalName: fi.name, ext: ext, mime: fi.type || '', size: fi.size, data: reader.result, expiryDate: exp, note: note })
              .then(() => next()).catch((e) => { Util.toast(T('上传失败：{0}', (e.message || e)), 'err'); next(); });
          };
          reader.onerror = () => { Util.toast(T('读取失败：{0}', fi.name), 'err'); next(); };
          reader.readAsDataURL(fi);
        };
        next();
      });
    });

    // 操作日志
    panel.appendChild(Util.el('h4', { text: T('操作日志'), style: 'margin:14px 0 6px' }));
    const logBox = Util.el('div', { class: 'fac-logs' });
    panel.appendChild(logBox);
    const renderLogs = () => {
      const logs = DB.getFacFileLogs(f.id);
      logBox.innerHTML = '';
      if (!logs.length) { logBox.appendChild(Util.el('div', { class: 'muted', text: T('暂无操作记录') })); return; }
      logs.forEach((l) => {
        logBox.appendChild(Util.el('div', { class: 'fac-log-item' }, [
          Util.el('span', { class: 'fac-log-time muted', text: Util.fmtDateTime(l.at) }),
          Util.el('span', { class: 'fac-log-by', text: ' · ' + (l.by || '—') }),
          Util.el('span', { class: 'fac-log-act', text: ' · ' + l.detail })
        ]));
      });
    };
    refreshers.push(renderLogs);
    renderLogs();

    // 公开刷新入口（供回滚/删除后整面板刷新）
    Facility._refreshFiles = function () { refreshers.forEach((r) => r()); };
    return panel;
  }
  // 安全重渲染档案页（保留文件面板刷新）
  Facility.renderProfileSafe = function (id) {
    const mount = document.getElementById('content');
    if (mount) openProfile(id);
  };

  // 供设计器"被审核单位档案"入口复用编辑/新增档案
  Facility.edit = openEditor;

  global.Facility = Facility;
})(window);

/* ===== src/js/assessment.js ===== */
/* 评估填写：基于问卷对供应商作答，支持自动保存、评分、证据材料上传与版本对比 */
(function (global) {
  const Assess = {};
  let activeId = null;

  Assess.render = function (mount) {
    mount.innerHTML = '';
    activeId = null;
    const state = DB.get();

    const head = Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('评估填写') }),
        Util.el('div', { class: 'muted', text: T('选择供应商与问卷，逐项采集审核数据；填写过程自动保存，可随时导出报告。支持上传证据材料与保存版本快照。') })
      ]),
      Util.el('div', {}, [Util.el('button', { class: 'btn btn-primary', onclick: () => startNew(state, mount) }, T('+ 新建评估'))])
    ]);
    mount.appendChild(head);

    if (!state.facilities.length) mount.appendChild(Util.el('div', { class: 'hint', text: T('尚未登记任何供应商，请先在「供应商登记」中添加被评估对象。') }));
    if (!state.questionnaires.length) mount.appendChild(Util.el('div', { class: 'hint', text: T('尚未设计任何问卷，请先在「问卷设计」中创建。') }));

    if (!state.assessments.length) {
      mount.appendChild(Util.el('div', { class: 'empty', text: T('暂无评估记录。') }));
      return;
    }

    const panel = Util.el('div', { class: 'panel' });
    const tbl = Util.el('table', { class: 'tbl' });
    tbl.appendChild(Util.el('thead', {}, Util.el('tr', {}, [
      Util.el('th', { text: T('供应商') }), Util.el('th', { text: T('问卷') }), Util.el('th', { text: T('审核员') }),
      Util.el('th', { text: T('日期') }), Util.el('th', { text: T('合规评分') }), Util.el('th', { text: T('状态') }),
      Util.el('th', { text: T('附件/版本') }), Util.el('th', { text: T('操作') })
    ])));
    const tb = Util.el('tbody', {});

    // 按等级筛选（依据该评估所含"不符合项"的最高/对应等级）
    let levelFilter = 'all';
    const nLevelCache = {};
    function nLevelsOf(a) {
      if (!nLevelCache[a.id]) {
        const set = new Set();
        Report.getNCSummary([a]).forEach((r) => set.add(r.levelV));
        nLevelCache[a.id] = set;
      }
      return nLevelCache[a.id];
    }
    const filterBar = Util.el('div', { class: 'lvl-filter' });
    function mkChip(val, label, color) {
      const b = Util.el('button', { class: 'lvl-chip' + (val === levelFilter ? ' active' : ''), text: label });
      if (color) { b.style.borderColor = color; b.style.color = color; }
      b.addEventListener('click', () => {
        levelFilter = val;
        filterBar.querySelectorAll('.lvl-chip').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        renderRows();
      });
      return b;
    }
    filterBar.appendChild(mkChip('all', T('全部'), null));
    Util.Q_LEVELS.forEach((l) => filterBar.appendChild(mkChip(l.v, T(l.key), l.color)));
    mount.appendChild(filterBar);

    function renderRows() {
      tb.innerHTML = '';
      const rows = state.assessments.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .filter((a) => levelFilter === 'all' || nLevelsOf(a).has(levelFilter));
      if (!rows.length) {
        tb.appendChild(Util.el('tr', {}, [Util.el('td', { colspan: 8, class: 'muted', style: 'text-align:center;padding:22px', text: levelFilter === 'all' ?T('暂无评估记录。') :T('所选等级下没有包含对应不符合项的评估。') })]));
        return;
      }
      rows.forEach((a) => {
        const f = DB.getFacility(a.facilityId);
        const qn = DB.getQuestionnaire(a.questionnaireId);
        const score = DB.computeScore(qn, a.answers);
        const attN = (a.attachments || []).length;
        const verN = (a.versions || []).length;
        tb.appendChild(Util.el('tr', {}, [
          Util.el('td', { html: '<strong>' + Util.esc(f ? f.name :T('已删除供应商')) + '</strong><br><span class="muted">' + Util.esc(f ? f.code : '') + '</span>' }),
          Util.el('td', { text: qn ? qn.title : T('已删除问卷') }),
          Util.el('td', { text: a.auditor || '-' }),
          Util.el('td', { class: 'muted', text: Util.fmtDate(a.date) }),
          Util.el('td', {}, [score.max ? scoreTag(score.percent) : Util.el('span', { class: 'muted', text: '—' }), score.max ? Util.el('span', { class: 'muted', text: ' ' + score.percent + '%' }) : null]),
          Util.el('td', {}, [statusTag(a.status)]),
          Util.el('td', { class: 'muted', text: '📎' + attN + ' · 🕑' + verN }),
          Util.el('td', {}, [
            Util.el('button', { class: 'btn-icon', title: T('查看'), html: Util.icon('eye'), onclick: () => openView(a.id, mount) }),
            Util.el('button', { class: 'btn-icon', title: T('填写/编辑'), html: Util.icon('pencil'), onclick: () => openFill(a.id, mount) }),
            Util.el('button', { class: 'btn-icon', title: T('版本历史'), html: Util.icon('clock'), onclick: () => openVersionHistory(a, mount) }),
            Util.el('button', { class: 'btn-icon', title: T('删除'), html: Util.icon('trash'), onclick: () => remove(a.id, mount) })
          ])
        ]));
      });
    }
    renderRows();
    tbl.appendChild(tb);
    panel.appendChild(tbl);
    mount.appendChild(panel);
  };

  function scoreTag(p) {
    if (p >= 85) return Util.el('span', { class: 'tag ok', text: T('优') });
    if (p >= 70) return Util.el('span', { class: 'tag', text: T('良') });
    if (p >= 50) return Util.el('span', { class: 'tag warn', text: T('中') });
    return Util.el('span', { class: 'tag danger', text: T('差') });
  }
  function statusTag(s) {
    if (s === 'done') return Util.el('span', { class: 'tag ok', text: T('已完成') });
    return Util.el('span', { class: 'tag gray', text: T('草稿') });
  }

  function startNew(state, mount) {
    if (!state.facilities.length || !state.questionnaires.length) { Util.toast(T('请先登记供应商并设计问卷'), 'err'); return; }
    const facSel = Util.el('select', {});
    state.facilities.forEach((f) => facSel.appendChild(Util.el('option', { value: f.id, text: f.code + ' · ' + f.name })));
    const qnSel = Util.el('select', {});
    state.questionnaires.forEach((q) => qnSel.appendChild(Util.el('option', { value: q.id, text: q.title })));
    const audI = Util.el('input', { type: 'text', value: state.settings.auditorName || '', placeholder: T('审核员姓名') });
    const dateI = Util.el('input', { type: 'date', value: Util.fmtDate(Date.now()) });
    const typeSel = Util.el('select', {});
    [T('年度审核'), T('专项审核'), T('跟踪审核'), T('其他审核')].forEach((t) => typeSel.appendChild(Util.el('option', { value: t, text: t })));

    const form = Util.el('div', {}, [
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('选择供应商') }), facSel]),
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('选择问卷') }), qnSel]),
      Util.el('div', { class: 'row' }, [
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('审核员') }), audI]),
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('评估日期') }), dateI]),
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('审核类型') }), typeSel])
      ])
    ]);
    Util.modal(T('新建评估'), form, [
      Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('取消')),
      Util.el('button', { class: 'btn btn-primary', onclick: () => {
        const a = {
          id: Util.uid('as'), facilityId: facSel.value, questionnaireId: qnSel.value,
          auditor: audI.value, date: dateI.value ? new Date(dateI.value).getTime() : Date.now(),
          auditType: typeSel.value,
          answers: {}, comments: {}, attachments: [], versions: [], status: 'draft',
          risk: DB.newRisk(), process: DB.newProcess(),
          createdAt: Date.now(), updatedAt: Date.now()
        };
        DB.addAssessment(a);
        Util.closeModal();
        openFill(a.id, mount);
      } }, T('开始填写'))
    ]);
  }

  function openFill(id, mount) {
    const a = DB.getAssessment(id); if (!a) return;
    const qn = DB.getQuestionnaire(a.questionnaireId);
    const f = DB.getFacility(a.facilityId);
    if (!qn || !f) { Util.toast(T('问卷或供应商已不存在'), 'err'); return; }
    activeId = id;
    if (!a.risk) a.risk = DB.newRisk();
    if (!a.process) a.process = DB.newProcess();
    if (a.auditType === undefined) a.auditType = '';

    mount.innerHTML = '';
    mount.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('填写评估：') + f.name }),
        Util.el('div', { class: 'muted', text: T('问卷：') + qn.title + T(' · 供应商编码 ') + (f.code || '-') })
      ]),
      Util.el('div', { class: 'btn-row' }, [
        Util.el('button', { class: 'btn', onclick: () => Assess.render(mount) }, T('← 返回列表')),
        // SUP-018：保存已填评估内容
        Util.el('button', { class: 'btn btn-primary', html: Util.icon('check') + T(' 保存'), onclick: () => { persist(a); Util.toast(T('评估内容已保存'), 'ok'); } }),
        // SUP-018：导出已填评估报告（FLA 风格，参考附件格式）
        Util.el('button', { class: 'btn', html: Util.icon('file') + T(' 导出报告'), onclick: () => exportAssessmentReport(a) }),
        Util.el('button', { class: 'btn', html: Util.icon('clock') + T(' 保存版本快照'), onclick: () => saveVersionSnapshot(a) }),
        Util.el('button', { class: 'btn', onclick: () => openVersionHistory(a, mount) }, T('版本历史')),
        Util.el('button', { class: 'btn btn-primary', html: (a.status === 'done' ? Util.icon('check') + T(' 已标记完成') :T('标记完成')), onclick: () => markDone(a, mount) })
      ])
    ]));

    // 元信息
    const meta = Util.el('div', { class: 'panel card', style: 'margin-bottom:16px' });
    const audI = Util.el('input', { type: 'text', value: a.auditor || '' });
    audI.addEventListener('input', () => { a.auditor = audI.value; persist(a); });
    const dateI = Util.el('input', { type: 'date', value: Util.fmtDate(a.date) });
    dateI.addEventListener('change', () => { a.date = dateI.value ? new Date(dateI.value).getTime() : Date.now(); persist(a); });
    const typeSel = Util.el('select', {});
    [T('年度审核'), T('专项审核'), T('跟踪审核'), T('其他审核')].forEach((t) => { const op = Util.el('option', { value: t, text: t }); if (a.auditType === t) op.selected = true; typeSel.appendChild(op); });
    typeSel.addEventListener('change', () => { a.auditType = typeSel.value; persist(a); });
    meta.appendChild(Util.el('div', { class: 'row' }, [
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('审核员') }), audI]),
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('评估日期') }), dateI]),
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('审核类型') }), typeSel])
    ]));
    mount.appendChild(meta);

    // 评分概览
    const scoreBox = Util.el('div', { class: 'panel card', style: 'margin-bottom:16px', id: 'liveScore' });
    mount.appendChild(scoreBox);
    renderLiveScore(scoreBox, qn, a.answers);

    // 题目
    const formWrap = Util.el('div', { class: '', id: 'assessForm' });
    qn.modules.forEach((mod) => {
      formWrap.appendChild(Util.el('h3', { text: mod.title, style: 'margin:18px 0 8px' }));
      Util.moduleQuestions(mod).forEach((q) => formWrap.appendChild(renderQuestion(q, a)));
    });
    mount.appendChild(formWrap);

    // 自定义风险情况 + 现场预审流程
    mount.appendChild(renderRiskBox(a, true));
    mount.appendChild(renderProcessPanel(a, mount, true));

    // 证据材料
    const attPanel = Util.el('div', { class: 'panel card', style: 'margin-top:18px' });
    attPanel.appendChild(Util.el('h3', { text: T('证据材料（图片/证明）'), style: 'margin-top:0' }));
    attPanel.appendChild(Util.el('div', { class: 'tip', text: T('可上传现场照片、证书扫描件等作为审核证据，支持填写说明文字。') }));
    const fileInput = Util.el('input', { type: 'file', accept: 'image/*', multiple: 'multiple', style: 'display:none' });
    const grid = Util.el('div', { class: 'att-grid', id: 'attGrid', style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:10px' });
    fileInput.addEventListener('change', () => handleUpload(a, fileInput, grid));
    const upBtn = Util.el('button', { class: 'btn btn-primary', onclick: () => fileInput.click() }, T('＋ 上传图片'));
    attPanel.appendChild(upBtn);
    attPanel.appendChild(grid);
    mount.appendChild(attPanel);
    renderAttachments(grid, a);
  }

  // ---------- 只读查看（已完成评估问卷） ----------
  function answerText(q, answers) {
    const v = answers[q.id];
    if (v === null || v === undefined || v === '') return '—';
    if (q.type === 'yesno') return (v === true || v === 'true' || v === '是') ?T('是') :T('否');
    if (q.type === 'multi') return (Array.isArray(v) && v.length) ? v.join('、') : '—';
    if (q.type === 'rating') return v + T(' 分');
    return String(v);
  }

  function renderQuestionRO(q, a) {
    const block = Util.el('div', { class: 'qblock ro' });
    block.appendChild(Util.el('div', { class: 'qh' }, [
      Util.el('span', { text: q.label }),
      q.required ? Util.el('span', { class: 'q-type', text: T('必填') }) : null,
      Util.levelTag(q.level)
    ]));
    if (q.help) block.appendChild(Util.el('div', { class: 'qhelp', text: q.help }));
    block.appendChild(Util.el('div', { class: 'q-ans', text: answerText(q, a.answers) }));
    const c = a.comments && a.comments[q.id];
    const ctext = c ? (typeof c === 'string' ? c : (c.text || '')) : '';
    const cimgs = (c && typeof c === 'object' && Array.isArray(c.images)) ? c.images : [];
    if (ctext || cimgs.length) {
      block.appendChild(Util.el('div', { class: 'q-comment-view' }, [
        Util.el('span', { class: 'q-comment-label', text: T('💬 审核员评论') }),
        ctext ? Util.el('div', { class: 'q-comment-text', text: ctext }) : null,
        cimgs.length ? (function () {
          const g = Util.el('div', { class: 'cmt-images' });
          cimgs.forEach((src) => g.appendChild(Util.el('img', { src: src, class: 'cmt-img-view' })));
          return g;
        })() : null
      ]));
    }
    return block;
  }

  function kv(k, v) {
    return Util.el('label', { class: 'fld' }, [
      Util.el('span', { class: 'lbl', text: k }),
      Util.el('div', { class: 'kv-val', text: v })
    ]);
  }

  function openView(id, mount) {
    const a = DB.getAssessment(id); if (!a) return;
    const qn = DB.getQuestionnaire(a.questionnaireId);
    const f = DB.getFacility(a.facilityId);
    if (!qn || !f) { Util.toast(T('问卷或供应商已不存在'), 'err'); return; }

    mount.innerHTML = '';
    mount.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('查看评估：') + f.name }),
        Util.el('div', { class: 'muted', text: T('问卷：') + qn.title + T(' · 供应商编码 ') + (f.code || '-') + (a.status === 'done' ?T(' · 已完成') :T(' · 草稿')) })
      ]),
      Util.el('div', { class: 'btn-row' }, [
        Util.el('button', { class: 'btn', onclick: () => Assess.render(mount) }, T('← 返回列表')),
        Util.el('button', { class: 'btn btn-primary', html: Util.icon('pencil') + T(' 编辑 / 继续填写'), onclick: () => openFill(a.id, mount) })
      ])
    ]));

    const meta = Util.el('div', { class: 'panel card', style: 'margin-bottom:16px' });
    meta.appendChild(Util.el('div', { class: 'row' }, [
      kv(T('审核员'), a.auditor || '-'),
      kv(T('评估日期'), Util.fmtDate(a.date)),
      kv(T('状态'), a.status === 'done' ?T('已完成') :T('草稿'))
    ]));
    mount.appendChild(meta);

    const scoreBox = Util.el('div', { class: 'panel card', style: 'margin-bottom:16px' });
    renderLiveScore(scoreBox, qn, a.answers);
    mount.appendChild(scoreBox);

    const formWrap = Util.el('div', {});
    qn.modules.forEach((mod) => {
      formWrap.appendChild(Util.el('h3', { text: mod.title, style: 'margin:18px 0 8px' }));
      Util.moduleQuestions(mod).forEach((q) => formWrap.appendChild(renderQuestionRO(q, a)));
    });
    mount.appendChild(formWrap);

    mount.appendChild(renderRiskBox(a, false));
    mount.appendChild(renderProcessPanel(a, mount, false));

    const attPanel = Util.el('div', { class: 'panel card', style: 'margin-top:18px' });
    attPanel.appendChild(Util.el('h3', { text: T('证据材料（仅查看）'), style: 'margin-top:0' }));
    const grid = Util.el('div', { class: 'att-grid', style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:10px' });
    attPanel.appendChild(grid);
    mount.appendChild(attPanel);
    renderAttachments(grid, a, true);
  }

  function handleUpload(a, fileInput, grid) {
    const files = Array.from(fileInput.files || []);
    if (!files.length) return;
    let pending = files.length;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const full = {
          id: Util.uid('att'), assessmentId: a.id, name: file.name,
          type: file.type || 'image', size: file.size, dataUrl: reader.result,
          caption: '', createdAt: Date.now()
        };
        DB.addAttachment(a.id, full).then(() => { renderAttachments(grid, a); }).catch((e) => Util.toast(T('上传失败：') + e.message, 'err'));
        if (--pending === 0) fileInput.value = '';
      };
      reader.onerror = () => { Util.toast(T('读取文件失败'), 'err'); if (--pending === 0) fileInput.value = ''; };
      reader.readAsDataURL(file);
    });
  }

  function renderAttachments(grid, a, ro) {
    grid.innerHTML = '';
    DB.getAttachments(a.id).then((atts) => {
      if (!atts.length) {
        grid.appendChild(Util.el('div', { class: 'muted', style: 'grid-column:1/-1;padding:8px', text: ro ?T('暂无证据材料。') :T('暂无证据材料，点击上方按钮上传。') }));
        return;
      }
      atts.forEach((att) => {
        const card = Util.el('div', { style: 'border:1px solid #e6e9ef;border-radius:10px;overflow:hidden;background:#fff' });
        const img = Util.el('img', { src: att.dataUrl, style: 'width:100%;height:120px;object-fit:cover;display:block;background:#f3f4f6' });
        card.appendChild(img);
        if (ro) {
          card.appendChild(Util.el('div', { style: 'font-size:11px;color:#8a94a6;padding:5px 8px;border-top:1px solid #eef1f6', text: (att.caption || T('（无说明）')) + ' · ' + (att.size / 1024).toFixed(0) + ' KB' }));
        } else {
          const cap = Util.el('textarea', { placeholder: T('说明文字（可选）'), style: 'width:100%;border:none;border-top:1px solid #eef1f6;padding:6px 8px;font-size:12px;resize:vertical;min-height:38px' });
          cap.value = att.caption || '';
          cap.addEventListener('input', () => { DB.updateAttachmentCaption(att.id, a.id, cap.value).catch((e) => Util.toast(T('说明保存失败：') + (e && e.message || e), 'err')); });
          card.appendChild(cap);
          const foot = Util.el('div', { style: 'display:flex;justify-content:space-between;align-items:center;padding:4px 8px;border-top:1px solid #eef1f6;font-size:11px;color:#8a94a6' }, [
            Util.el('span', { text: (att.size / 1024).toFixed(0) + ' KB' }),
            Util.el('button', { class: 'btn-icon', title: T('删除'), html: Util.icon('trash'), onclick: () => {
              Util.confirm(T('删除附件'), T('确认删除该证据材料「') + att.name + '」？', T('删除')).then((ok) => {
                if (!ok) return;
                DB.deleteAttachment(att.id, a.id).then(() => renderAttachments(grid, a)).catch((e) => Util.toast(T('删除失败：') + e.message, 'err'));
              });
            } })
          ]);
          card.appendChild(foot);
        }
        grid.appendChild(card);
      });
    }).catch((e) => { grid.appendChild(Util.el('div', { class: 'muted', text: T('附件加载失败：') + e.message })); });
  }

  function renderQuestion(q, a) {
    const block = Util.el('div', { class: 'qblock' });
    block.appendChild(Util.el('div', { class: 'qh' }, [
      Util.el('span', { text: q.label }),
      q.required ? Util.el('span', { class: 'q-type', text: T('必填') }) : null,
      Util.levelTag(q.level)
    ]));
    if (q.help) block.appendChild(Util.el('div', { class: 'qhelp', text: q.help }));

    const setVal = (v) => { a.answers[q.id] = v; persist(a); refreshScore(qnOf(a), a); };

    let input;
    if (q.type === 'text' || q.type === 'date') {
      input = Util.el('input', { type: q.type === 'date' ? 'date' : 'text' });
      if (a.answers[q.id] != null) input.value = a.answers[q.id];
      input.addEventListener('input', () => setVal(input.value));
    } else if (q.type === 'textarea') {
      input = Util.el('textarea', {});
      input.value = a.answers[q.id] || '';
      input.addEventListener('input', () => setVal(input.value));
    } else if (q.type === 'number') {
      input = Util.el('input', { type: 'number' });
      if (q.min != null) input.min = q.min; if (q.max != null) input.max = q.max;
      if (a.answers[q.id] != null) input.value = a.answers[q.id];
      input.addEventListener('input', () => setVal(input.value === '' ? null : Number(input.value)));
    } else if (q.type === 'yesno') {
      const wrap = Util.el('div', { class: 'btn-row' });
      [[T('是'), true], [T('否'), false]].forEach(([label, val]) => {
        const c = Util.el('input', { type: 'radio', name: 'yn_' + q.id });
        if (a.answers[q.id] === val) c.checked = true;
        c.addEventListener('change', () => { if (c.checked) setVal(val); });
        wrap.appendChild(Util.el('label', { class: 'radio-row' }, [c, Util.el('span', { text: label })]));
      });
      input = wrap;
    } else if (q.type === 'single') {
      const wrap = Util.el('div', {});
      (q.options || []).forEach((opt) => {
        const c = Util.el('input', { type: 'radio', name: 'sg_' + q.id });
        if (a.answers[q.id] === opt) c.checked = true;
        c.addEventListener('change', () => { if (c.checked) setVal(opt); });
        wrap.appendChild(Util.el('label', { class: 'radio-row' }, [c, Util.el('span', { text: opt })]));
      });
      input = wrap;
    } else if (q.type === 'multi') {
      const wrap = Util.el('div', {});
      const arr = Array.isArray(a.answers[q.id]) ? a.answers[q.id] : [];
      (q.options || []).forEach((opt) => {
        const c = Util.el('input', { type: 'checkbox' });
        if (arr.includes(opt)) c.checked = true;
        c.addEventListener('change', () => {
          const cur = Array.isArray(a.answers[q.id]) ? a.answers[q.id].slice() : [];
          if (c.checked) cur.push(opt); else { const i = cur.indexOf(opt); if (i >= 0) cur.splice(i, 1); }
          setVal(cur);
        });
        wrap.appendChild(Util.el('label', { class: 'check-row' }, [c, Util.el('span', { text: opt })]));
      });
      input = wrap;
    } else if (q.type === 'rating') {
      const mx = Number(q.max) || 5;
      const wrap = Util.el('div', { class: 'btn-row' });
      for (let i = 1; i <= mx; i++) {
        const c = Util.el('input', { type: 'radio', name: 'rt_' + q.id });
        if (a.answers[q.id] === i) c.checked = true;
        c.addEventListener('change', () => { if (c.checked) setVal(i); });
        wrap.appendChild(Util.el('label', { class: 'radio-row' }, [c, Util.el('span', { text: i + T('分') })]));
      }
      input = wrap;
    }
    if (input) block.appendChild(input);

    // 审核员评论（支持 @ 提及 与 图片证据）
    block.appendChild(buildComment(q, a));
    return block;
  }

  // ---------- 评论块：@提及 + 图片 ----------
  let _mentionCandidates = null;
  function getMentionCandidates() {
    if (_mentionCandidates) return _mentionCandidates;
    const s = DB.get();
    const set = new Set();
    if (s.settings && s.settings.auditorName) set.add(s.settings.auditorName);
    (s.assessments || []).forEach((a) => { if (a.auditor) set.add(a.auditor); });
    (s.facilities || []).forEach((f) => { if (f.contact) set.add(f.contact); });
    _mentionCandidates = Array.from(set).filter((x) => x && x.trim()).sort();
    return _mentionCandidates;
  }

  function buildComment(q, a) {
    if (!a.comments) a.comments = {};
    if (!a.comments[q.id] || typeof a.comments[q.id] === 'string') {
      const old = (a.comments[q.id] && typeof a.comments[q.id] === 'string') ? a.comments[q.id] : '';
      a.comments[q.id] = { text: old, images: [] };
    }
    const cobj = a.comments[q.id];
    if (!Array.isArray(cobj.images)) cobj.images = [];

    const wrap = Util.el('div', { class: 'q-comment-wrap' });
    wrap.appendChild(Util.el('span', { class: 'q-comment-label', text: T('💬 审核员评论') }));

    const cmt = Util.el('textarea', { class: 'q-comment', placeholder: T('审核员评论 / 事实记录 / 整改建议（输入 @ 可提及同事，可插入图片，可选）') });
    cmt.value = cobj.text || '';
    cmt.addEventListener('input', () => { cobj.text = cmt.value; persist(a); handleMention(cmt, mentionBox); });
    cmt.addEventListener('keydown', (e) => {
      if (mentionBox.style.display !== 'none' && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].indexOf(e.key) >= 0) {
        mentionNav(e, cmt, mentionBox, cobj, a);
      }
    });

    const mentionBox = Util.el('div', { class: 'cmt-mention', style: 'display:none' });

    const imgInput = Util.el('input', { type: 'file', accept: 'image/*', multiple: 'multiple', style: 'display:none' });
    imgInput.addEventListener('change', () => {
      const files = Array.from(imgInput.files || []);
      if (!files.length) return;
      imgBtn.disabled = true;
      let pending = files.length;
      files.forEach((file) => {
        Util.resizeImageFile(file, 900, 0.8).then((dataUrl) => {
          cobj.images.push(dataUrl);
          renderCommentImages(imgGrid, cobj, a, q);
          persist(a);
        }).catch((e) => Util.toast(T('图片处理失败：') + e.message, 'err'))
          .then(() => { if (--pending === 0) { imgInput.value = ''; imgBtn.disabled = false; } });
      });
    });
    const imgBtn = Util.el('button', { class: 'btn btn-sm', type: 'button', html: Util.icon('image') + T(' 插入图片'), onclick: () => imgInput.click() });
    const bar = Util.el('div', { class: 'cmt-actions' }, [
      imgBtn,
      Util.el('span', { class: 'cmt-tip', text: T('支持 @ 提及同事 与 图片证据') })
    ]);

    const imgGrid = Util.el('div', { class: 'cmt-images' });
    renderCommentImages(imgGrid, cobj, a, q);

    wrap.appendChild(cmt);
    wrap.appendChild(mentionBox);
    wrap.appendChild(bar);
    wrap.appendChild(imgInput);
    wrap.appendChild(imgGrid);
    return wrap;
  }

  function renderCommentImages(grid, cobj, a, q) {
    grid.innerHTML = '';
    (cobj.images || []).forEach((src, i) => {
      const cell = Util.el('div', { class: 'cmt-img' });
      cell.appendChild(Util.el('img', { src: src, title: T('评论图片') }));
      cell.appendChild(Util.el('button', { class: 'cmt-img-x', title: T('删除图片'), onclick: () => {
        cobj.images.splice(i, 1); renderCommentImages(grid, cobj, a, q); persist(a);
      } }, '×'));
      grid.appendChild(cell);
    });
  }

  function handleMention(ta, box) {
    const pos = ta.selectionStart;
    const before = ta.value.slice(0, pos);
    const m = before.match(/(^|\s)@([^\s@]*)$/);
    if (!m) { box.style.display = 'none'; return; }
    const query = m[2].toLowerCase();
    const cands = getMentionCandidates().filter((n) => n.toLowerCase().indexOf(query) >= 0);
    if (!cands.length) { box.style.display = 'none'; return; }
    renderMentionBox(box, cands, ta);
    box.style.display = 'block';
  }
  function renderMentionBox(box, cands, ta) {
    box.innerHTML = '';
    box._idx = 0;
    cands.slice(0, 8).forEach((name, i) => {
      const it = Util.el('div', { class: 'cmt-mention-item', dataset: { name: name }, text: '@' + name });
      if (i === 0) it.style.background = 'var(--brand-soft)';
      it.addEventListener('mousedown', (e) => { e.preventDefault(); insertMention(ta, cobj, name, box, a); });
      box.appendChild(it);
    });
  }
  function mentionNav(e, ta, box, cobj, a) {
    const items = Array.from(box.querySelectorAll('.cmt-mention-item'));
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); box._idx = Math.min(items.length - 1, (box._idx || 0) + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); box._idx = Math.max(0, (box._idx || 0) - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); const it = items[box._idx || 0]; if (it) insertMention(ta, cobj, it.dataset.name, box, a); return; }
    else if (e.key === 'Escape') { box.style.display = 'none'; return; }
    items.forEach((it, i) => it.style.background = (i === (box._idx || 0)) ? 'var(--brand-soft)' : '');
  }
  function insertMention(ta, cobj, name, box, a) {
    const pos = ta.selectionStart;
    const before = ta.value.slice(0, pos);
    const after = ta.value.slice(pos);
    const m = before.match(/(^|\s)@([^\s@]*)$/);
    if (m) {
      const atPos = before.length - m[2].length - 1;
      const newBefore = before.slice(0, atPos) + '@' + name + ' ';
      ta.value = newBefore + after;
      cobj.text = ta.value;
      ta.selectionStart = ta.selectionEnd = newBefore.length;
    }
    box.style.display = 'none';
    ta.focus();
    persist(a);
  }

  // ---------- 自定义风险情况 ----------
  function renderRiskBox(a, editable) {
    const box = Util.el('div', { class: 'panel card', style: 'margin-top:18px' });
    box.appendChild(Util.el('h3', { text: T('风险情况（自定义）'), style: 'margin-top:0' }));
    box.appendChild(Util.el('div', { class: 'tip', text: T('手动评定风险等级并填写描述与整改建议；选择「高风险」时整体高亮为红色以突出显示。该字段独立于客观评分，不构成评级结论。') }));

    const lvlSel = Util.el('select', { class: 'risk-sel' });
    lvlSel.appendChild(Util.el('option', { value: '', text: T('请选择风险等级') }));
    Util.RISK_LEVELS.forEach((r) => { const op = Util.el('option', { value: r.v, text: Util.riskLevelInfo(r.v).t }); if (a.risk.level === r.v) op.selected = true; lvlSel.appendChild(op); });

    const riskWrap = Util.el('div', { class: 'risk-box' });
    function paintLevel() { riskWrap.className = 'risk-box' + (lvlSel.value === 'high' ? ' risk-high' : ''); }
    lvlSel.addEventListener('change', () => { a.risk.level = lvlSel.value || null; paintLevel(); persist(a); });
    paintLevel();

    const descI = Util.el('textarea', { placeholder: T('风险描述：如风险来源、影响范围、触发条件等'), html: Util.esc(a.risk.desc || '') });
    descI.addEventListener('input', () => { a.risk.desc = descI.value; persist(a); });
    const actI = Util.el('textarea', { placeholder: T('整改建议：责任部门、措施、时限、验证方式等'), html: Util.esc(a.risk.action || '') });
    actI.addEventListener('input', () => { a.risk.action = actI.value; persist(a); });

    riskWrap.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('风险等级') }), lvlSel]));
    riskWrap.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('风险描述') }), descI]));
    riskWrap.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('整改建议') }), actI]));
    box.appendChild(riskWrap);

    if (!editable) { [lvlSel, descI, actI].forEach((c) => { c.disabled = true; }); }
    return box;
  }

  // ---------- 现场预审流程（五环节 + 自定义）----------
  function renderProcessPanel(a, mount, editable) {
    const panel = Util.el('div', { class: 'panel card', style: 'margin-top:18px' });
    panel.appendChild(Util.el('h3', { text: T('现场预审流程'), style: 'margin-top:0' }));
    panel.appendChild(Util.el('div', { class: 'tip', text: T('按顺序记录五个核心环节；可上下调整环节顺序或添加自定义环节。各环节数据将完整呈现在导出报告中。') }));
    const stagesWrap = Util.el('div', { class: 'proc-stages' });
    panel.appendChild(stagesWrap);

    const STAGE_DEFS = {
      opening: T('开始会议'), walk: T('现场走访'), docs: T('文件查看'), interview: T('员工访谈'), closing: T('末次会议')
    };
    function field(label, node) { return Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: label }), node]); }
    function txt(value, placeholder, multiline) {
      const el = multiline ? Util.el('textarea', { placeholder: placeholder || '' }) : Util.el('input', { type: 'text', placeholder: placeholder || '' });
      el.value = value || ''; return el;
    }

    function renderStageCard(key, idx) {
      const isCustom = key.indexOf('custom_') === 0;
      const card = Util.el('div', { class: 'stage-card' });
      const head = Util.el('div', { class: 'stage-head' });
      const titleText = isCustom ? ((a.process.custom[key] && a.process.custom[key].title) || T('自定义环节')) : (STAGE_DEFS[key] || T('自定义环节'));
      const titleNode = isCustom
        ? (function () { const t = txt(a.process.custom[key] ? a.process.custom[key].title : '', T('环节标题')); t.addEventListener('input', () => { a.process.custom[key] = a.process.custom[key] || {}; a.process.custom[key].title = t.value; persist(a); }); return t; })()
        : Util.el('span', { class: 'stage-title', text: titleText });
      head.appendChild(Util.el('div', { class: 'stage-idx', text: String(idx + 1) }));
      head.appendChild(Util.el('div', { class: 'stage-name', style: 'flex:1' }, [titleNode]));
      const ops = Util.el('div', { class: 'stage-ops' });
      if (editable) {
        ops.appendChild(Util.el('button', { class: 'btn-icon', title: T('上移'), html: Util.icon('up'), onclick: (e) => { e.stopPropagation(); moveStage(key, -1); } }));
        ops.appendChild(Util.el('button', { class: 'btn-icon', title: T('下移'), html: Util.icon('down'), onclick: (e) => { e.stopPropagation(); moveStage(key, 1); } }));
        if (isCustom) ops.appendChild(Util.el('button', { class: 'btn-icon', title: T('删除环节'), html: Util.icon('trash'), onclick: (e) => { e.stopPropagation(); removeStage(key); } }));
      }
      head.appendChild(ops);
      card.appendChild(head);

      const body = Util.el('div', { class: 'stage-body' });

      if (isCustom) {
        const c = a.process.custom[key] || (a.process.custom[key] = {});
        const notes = txt(c.notes || '', T('记录本环节的情况、发现与结论…'), true);
        notes.addEventListener('input', () => { c.notes = notes.value; persist(a); });
        body.appendChild(field(T('环节记录'), notes));
      } else if (key === 'opening') {
        const s = a.process.opening;
        const time = txt(s.time, T('如 2026-08-17 09:00'), false); time.addEventListener('input', () => { s.time = time.value; persist(a); });
        const place = txt(s.place, T('如 工厂三楼会议室'), false); place.addEventListener('input', () => { s.place = place.value; persist(a); });
        const part = txt(s.participants, T('审核方：…；被审核方：…'), false); part.addEventListener('input', () => { s.participants = part.value; persist(a); });
        const agenda = txt(s.agenda, T('会议议程概述'), true); agenda.addEventListener('input', () => { s.agenda = agenda.value; persist(a); });
        body.appendChild(Util.el('div', { class: 'row' }, [field(T('会议时间'), time), field(T('会议地点'), place)]));
        body.appendChild(field(T('参与人员'), part));
        body.appendChild(field(T('会议议程'), agenda));
      } else if (key === 'walk') {
        const s = a.process.walk;
        const areas = txt(s.areas, T('如 生产车间、仓库、宿舍、食堂'), false); areas.addEventListener('input', () => { s.areas = areas.value; persist(a); });
        const route = txt(s.route, T('如 大门→车间A→仓库→宿舍'), false); route.addEventListener('input', () => { s.route = route.value; persist(a); });
        const obs = txt(s.observations, T('观察到的主要情况（生产环境、安全设施、设备状态等）'), true); obs.addEventListener('input', () => { s.observations = obs.value; persist(a); });
        body.appendChild(field(T('走访区域'), areas));
        body.appendChild(field(T('走访路线'), route));
        body.appendChild(field(T('观察情况'), obs));
        const attGrid = Util.el('div', { class: 'att-grid', style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:8px' });
        renderWalkPhotos(attGrid, a);
        if (editable) {
          const fileI = Util.el('input', { type: 'file', accept: 'image/*', multiple: 'multiple', style: 'display:none' });
          fileI.addEventListener('change', () => { const files = Array.from(fileI.files || []); if (!files.length) return; let pend = files.length; files.forEach((fl) => { Util.resizeImageFile(fl, 900, 0.8).then((d) => { a.process.walk.photos.push(d); persist(a); renderWalkPhotos(attGrid, a); }).catch((e) => Util.toast(T('图片处理失败：') + e.message, 'err')).then(() => { if (--pend === 0) fileI.value = ''; }); }); });
          body.appendChild(Util.el('div', { style: 'margin-top:6px' }, [Util.el('button', { class: 'btn btn-sm', onclick: () => fileI.click() }, T('＋ ') + T('上传走访照片')), fileI, attGrid]));
        } else if ((s.photos || []).length) {
          body.appendChild(attGrid);
        }
      } else if (key === 'docs') {
        const s = a.process.docs;
        const listEl = Util.el('div', { class: 'doc-list' });
        function renderDocItems() {
          listEl.innerHTML = '';
          s.items.forEach((it, i) => {
            const row = Util.el('div', { class: 'doc-item' });
            const nameI = txt(it.name || '', T('文件名称（如 营业执照、消防验收报告）'), false); nameI.addEventListener('input', () => { it.name = nameI.value; persist(a); });
            const completeC = Util.el('input', { type: 'checkbox' }); completeC.checked = it.complete !== false; completeC.addEventListener('change', () => { it.complete = completeC.checked; persist(a); });
            const complyC = Util.el('input', { type: 'checkbox' }); complyC.checked = it.compliant !== false; complyC.addEventListener('change', () => { it.compliant = complyC.checked; persist(a); });
            const noteI = txt(it.note || '', T('备注'), false); noteI.addEventListener('input', () => { it.note = noteI.value; persist(a); });
            row.appendChild(field(T('文件名称'), nameI));
            row.appendChild(Util.el('div', { class: 'row', style: 'gap:14px' }, [
              Util.el('label', { class: 'check-row' }, [completeC, Util.el('span', { text: T('完整性') })]),
              Util.el('label', { class: 'check-row' }, [complyC, Util.el('span', { text: T('合规性') })])
            ]));
            row.appendChild(field(T('备注'), noteI));
            if (editable) row.appendChild(Util.el('button', { class: 'btn-icon', title: T('删除'), html: Util.icon('trash'), onclick: () => { s.items.splice(i, 1); persist(a); renderDocItems(); } }));
            listEl.appendChild(row);
          });
        }
        renderDocItems();
        body.appendChild(listEl);
        if (editable) body.appendChild(Util.el('button', { class: 'btn btn-sm', onclick: () => { s.items.push({ name: '', complete: true, compliant: true, note: '' }); persist(a); renderDocItems(); } }, T('＋ ') + T('添加文件项')));
        const notesI = txt(s.notes || '', T('文件查看整体说明'), true); notesI.addEventListener('input', () => { s.notes = notesI.value; persist(a); });
        body.appendChild(field(T('整体说明'), notesI));
      } else if (key === 'interview') {
        const s = a.process.interview;
        const listEl = Util.el('div', { class: 'intv-list' });
        function renderIntvItems() {
          listEl.innerHTML = '';
          s.items.forEach((it, i) => {
            const row = Util.el('div', { class: 'intv-item' });
            const whoI = txt(it.who || '', T('访谈对象（岗位/人数）'), false); whoI.addEventListener('input', () => { it.who = whoI.value; persist(a); });
            const methodSel = Util.el('select', {});
            [T('一对一'), T('小组访谈')].forEach((m) => { const op = Util.el('option', { value: m, text: m }); if ((it.method || T('一对一')) === m) op.selected = true; methodSel.appendChild(op); });
            methodSel.addEventListener('change', () => { it.method = methodSel.value; persist(a); });
            const sumI = txt(it.summary || '', T('访谈摘要'), true); sumI.addEventListener('input', () => { it.summary = sumI.value; persist(a); });
            const findI = txt(it.findings || '', T('主要发现'), true); findI.addEventListener('input', () => { it.findings = findI.value; persist(a); });
            row.appendChild(field(T('访谈对象'), whoI));
            row.appendChild(field(T('访谈方式'), methodSel));
            row.appendChild(field(T('访谈摘要'), sumI));
            row.appendChild(field(T('主要发现'), findI));
            if (editable) row.appendChild(Util.el('button', { class: 'btn-icon', title: T('删除'), html: Util.icon('trash'), onclick: () => { s.items.splice(i, 1); persist(a); renderIntvItems(); } }));
            listEl.appendChild(row);
          });
        }
        renderIntvItems();
        body.appendChild(listEl);
        if (editable) body.appendChild(Util.el('button', { class: 'btn btn-sm', onclick: () => { s.items.push({ who: '', method: T('一对一'), summary: '', findings: '' }); persist(a); renderIntvItems(); } }, T('＋ ') + T('添加访谈记录')));
        const notesI = txt(s.notes || '', T('访谈整体说明'), true); notesI.addEventListener('input', () => { s.notes = notesI.value; persist(a); });
        body.appendChild(field(T('整体说明'), notesI));
      } else if (key === 'closing') {
        const s = a.process.closing;
        const time = txt(s.time, T('如 2026-08-17 16:30'), false); time.addEventListener('input', () => { s.time = time.value; persist(a); });
        const part = txt(s.participants, T('参与人员'), false); part.addEventListener('input', () => { s.participants = part.value; persist(a); });
        const concl = txt(s.conclusion, T('审核初步结论（仅事实总结，无评级）'), true); concl.addEventListener('input', () => { s.conclusion = concl.value; persist(a); });
        const sug = txt(s.suggestion, T('改进建议沟通情况'), true); sug.addEventListener('input', () => { s.suggestion = sug.value; persist(a); });
        body.appendChild(Util.el('div', { class: 'row' }, [field(T('会议时间'), time), field(T('参与人员'), part)]));
        body.appendChild(field(T('审核初步结论'), concl));
        body.appendChild(field(T('改进建议沟通'), sug));
      }
      card.appendChild(body);
      if (!editable) { Array.from(card.querySelectorAll('input,textarea,select')).forEach((c) => { c.disabled = true; }); }
      return card;
    }

    function renderAll() {
      stagesWrap.innerHTML = '';
      a.process.order.forEach((key, i) => {
        if (key.indexOf('custom_') === 0 && !a.process.custom[key]) return;
        stagesWrap.appendChild(renderStageCard(key, i));
      });
      if (editable) {
        stagesWrap.appendChild(Util.el('button', { class: 'btn', style: 'margin-top:6px', onclick: () => {
          const id = 'custom_' + Util.uid('st');
          a.process.custom[id] = { title: T('自定义环节'), notes: '' };
          a.process.order.push(id); persist(a); renderAll();
        } }, T('＋ ') + T('添加自定义环节')));
      }
    }
    function moveStage(key, dir) {
      const arr = a.process.order; const i = arr.indexOf(key); const j = i + dir;
      if (i < 0 || j < 0 || j >= arr.length) return;
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t; persist(a); renderAll();
    }
    function removeStage(key) {
      a.process.order = a.process.order.filter((x) => x !== key);
      delete a.process.custom[key]; persist(a); renderAll();
    }
    renderAll();
    return panel;
  }

  function renderWalkPhotos(grid, a) {
    grid.innerHTML = '';
    (a.process.walk.photos || []).forEach((src, i) => {
      const cell = Util.el('div', { class: 'cmt-img' });
      cell.appendChild(Util.el('img', { src: src, title: T('走访照片') }));
      cell.appendChild(Util.el('button', { class: 'cmt-img-x', title: T('删除图片'), onclick: () => { a.process.walk.photos.splice(i, 1); persist(a); renderWalkPhotos(grid, a); } }, '×'));
      grid.appendChild(cell);
    });
  }

  function qnOf(a) { return DB.getQuestionnaire(a.questionnaireId); }
  function persist(a) { a.updatedAt = Date.now(); DB.updateAssessment(a.id, { answers: a.answers, comments: a.comments, attachments: a.attachments, versions: a.versions, auditor: a.auditor, date: a.date, auditType: a.auditType, risk: a.risk, process: a.process, updatedAt: a.updatedAt }); }
  // SUP-018：导出已填评估报告（FLA 风格，参考附件 2733.pdf / 4699.xlsx 格式）
  function exportAssessmentReport(a) {
    // 先保存当前内容，确保导出的为最新
    persist(a);
    if (!a.answers || !Object.keys(a.answers).length) { Util.toast(T('评估内容为空，暂无可导出'), 'err'); return; }
    if (global.Report && Report.exportPDF) {
      Report.exportPDF([a.id]);  // 内部含预览确认流程
    } else {
      Util.toast(T('报告导出模块未就绪'), 'err');
    }
  }
  function refreshScore(qn, a) { const box = document.getElementById('liveScore'); if (box) renderLiveScore(box, qn, a.answers); }

  function renderLiveScore(box, qn, answers) {
    const s = DB.computeScore(qn, answers);
    box.innerHTML = '';
    box.appendChild(Util.el('div', { style: 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px' }, [
      Util.el('div', {}, [
        Util.el('div', { class: 'muted', style: 'font-size:12px', text: T('实时合规评分（评分题 + 是否题）') }),
        s.max ? Util.el('div', { style: 'font-size:24px;font-weight:800', text: s.percent + '%' }) : Util.el('div', { class: 'muted', text: T('本问卷无可评分项') })
      ]),
      Util.el('div', { style: 'flex:1;min-width:220px;max-width:420px' }, [(function () {
        const bar = Util.el('div', { class: 'score-bar' });
        bar.appendChild(Util.el('div', { class: 'score-fill', style: 'width:' + (s.max ? s.percent : 0) + '%' }));
        return bar;
      })()])
    ]));
    if (s.max) {
      const lg = Util.el('div', { style: 'margin-top:10px;display:flex;flex-wrap:wrap;gap:8px' });
      s.byModule.forEach((m) => lg.appendChild(Util.el('span', { class: 'tag gray', text: m.title.split('.')[0] + ' ' + m.percent + '%' })));
      box.appendChild(lg);
    }
  }

  function saveVersionSnapshot(a, label) {
    const qn = qnOf(a);
    const s = DB.computeScore(qn, a.answers);
    const v = {
      id: Util.uid('ver'), assessmentId: a.id, ts: Date.now(),
      label: label || (T('快照 ') + Util.fmtDateTime(Date.now())),
      answers: JSON.parse(JSON.stringify(a.answers || {})),
      comments: JSON.parse(JSON.stringify(a.comments || {})),
      auditor: a.auditor, date: a.date, auditType: a.auditType, risk: JSON.parse(JSON.stringify(a.risk || {})), process: JSON.parse(JSON.stringify(a.process || {})),
      score: { total: s.total, max: s.max, percent: s.percent }
    };
    DB.addVersion(v).then(() => Util.toast(T('版本快照已保存'), 'ok').catch((e) => Util.toast(T('保存失败：') + e.message, 'err')));
  }

  function markDone(a, mount) {
    const becomingDone = a.status !== 'done';
    a.status = a.status === 'done' ? 'draft' : 'done';
    DB.updateAssessment(a.id, { status: a.status });
    Util.toast(a.status === 'done' ?T('已标记为完成') :T('已转为草稿'), 'ok');
    if (becomingDone) saveVersionSnapshot(a, T('完成快照 ') + Util.fmtDateTime(Date.now()));
    openFill(a.id, mount);
  }

  // ---------- 版本历史与对比 ----------
  function openVersionHistory(a, mount) {
    DB.getVersions(a.id).then((list) => {
      if (!list.length) { Util.toast(T('暂无版本快照，请点击「保存版本快照」'), 'err'); return; }
      const picks = [];
      const listEl = Util.el('div', {});
      list.forEach((v) => {
        const row = Util.el('label', { class: 'check-row', style: 'padding:8px;border:1px solid #eef1f6;border-radius:8px;margin-bottom:6px;cursor:pointer' });
        const cb = Util.el('input', { type: 'checkbox' });
        cb.addEventListener('change', () => {
          if (cb.checked) { picks.push(v.id); } else { const i = picks.indexOf(v.id); if (i >= 0) picks.splice(i, 1); }
          if (picks.length > 2) { cb.checked = false; picks.pop(); Util.toast(T('最多对比两个版本'), 'err'); }
        });
        row.appendChild(cb);
        row.appendChild(Util.el('span', { html: '<strong>' + Util.esc(v.label) + '</strong> <span class="muted">· ' + Util.fmtDateTime(v.ts) + '</span>' }));
        listEl.appendChild(row);
      });
      const body = Util.el('div', {}, [
        Util.el('div', { class: 'tip', text: T('勾选两个版本进行逐题对比（可勾选 1 个查看该版本完整答案）。') }),
        listEl
      ]);
      Util.modal(T('版本历史（') + list.length + T(' 个快照）'), body, [
        Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('关闭')),
        Util.el('button', { class: 'btn btn-primary', onclick: () => {
          if (picks.length < 1) { Util.toast(T('请至少选择一个版本'), 'err'); return; }
          Util.closeModal();
          showCompare(a, picks[0], picks[1]);
        } }, T('对比所选'))
      ]);
    });
  }

  function showCompare(a, idA, idB) {
    Promise.all([DB.getVersion(idA), idB ? DB.getVersion(idB) : Promise.resolve(null)]).then(([vA, vB]) => {
      const qn = DB.getQuestionnaire(a.questionnaireId);
      const f = DB.getFacility(a.facilityId);
      if (!qn) { Util.toast(T('问卷已不存在，无法对比'), 'err'); return; }
      const wrap = Util.el('div', { style: 'max-height:70vh;overflow:auto' });

      // 头部评分对比
      const head = Util.el('div', { style: 'display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px' });
      head.appendChild(verScoreCard(T('版本 A'), vA));
      if (vB) head.appendChild(verScoreCard(T('版本 B'), vB));
      wrap.appendChild(head);

      // 差异统计
      if (vB) {
        let diff = 0;
        qn.modules.forEach((mod) => { Util.moduleQuestions(mod).forEach((q) => {
          if (fmtCmp(q, vA.answers[q.id]) !== fmtCmp(q, vB.answers[q.id])) diff++;
        }); });
        wrap.appendChild(Util.el('div', { class: 'hint', text: T('两版本共 ') + diff + T(' 处答案不同（高亮显示）。') }));
      }

      // 逐题表
      const tbl = Util.el('table', { class: 'tbl' });
      const cols = vB ? [T('题目'), T('版本 A'), T('版本 B'), T('审核员评论')] : [T('题目'), T('答案'), T('审核员评论')];
      tbl.appendChild(Util.el('thead', {}, Util.el('tr', {}, cols.map((c) => Util.el('th', { text: c })))));
      qn.modules.forEach((mod) => {
        tbl.appendChild(Util.el('tr', {}, [Util.el('td', { colspan: vB ? 4 : 3, style: 'background:#fafbfc;font-weight:700', text: mod.title })]));
        Util.moduleQuestions(mod).forEach((q) => {
          const aA = fmtCmp(q, vA.answers[q.id]);
          const aB = vB ? fmtCmp(q, vB.answers[q.id]) : null;
          const changed = vB && aA !== aB;
          const cmt = (vA.comments && vA.comments[q.id]) || '—';
          const tr = Util.el('tr', {});
          tr.appendChild(Util.el('td', { text: q.label }));
          tr.appendChild(Util.el('td', { style: changed ? 'background:#fdeaea;font-weight:600' : '', text: aA }));
          if (vB) tr.appendChild(Util.el('td', { style: changed ? 'background:#fdeaea;font-weight:600' : '', text: aB }));
          tr.appendChild(Util.el('td', { style: 'color:#5b6675;font-size:12px', text: cmt }));
          tbl.appendChild(tr);
        });
      });
      wrap.appendChild(tbl);
      Util.modal(T('版本对比 · ') + (f ? f.name : ''), wrap, [
        Util.el('button', { class: 'btn btn-primary', onclick: () => Util.closeModal() }, T('关闭'))
      ]);
    });
  }

  function verScoreCard(title, v) {
    if (!v) return Util.el('div', {});
    return Util.el('div', { style: 'flex:1;min-width:200px;border:1px solid #e6e9ef;border-radius:10px;padding:12px' }, [
      Util.el('div', { class: 'muted', style: 'font-size:12px', text: title + ' · ' + v.label }),
      Util.el('div', { style: 'font-size:22px;font-weight:800;color:#1b4fc4', text: (v.score && v.score.max ? v.score.percent + '%' : '—') }),
      Util.el('div', { class: 'muted', style: 'font-size:11px', text: v.score && v.score.max ? (T('得分 ') + v.score.total + ' / ' + v.score.max) : '' })
    ]);
  }

  function fmtCmp(q, v) {
    if (v === null || v === undefined || v === '') return '—';
    if (q.type === 'yesno') return (v === true || v === 'true' || v === '是') ?T('是') :T('否');
    if (q.type === 'multi') return (Array.isArray(v) && v.length) ? v.join('、') : '—';
    if (q.type === 'rating') return v + T(' 分');
    return String(v);
  }

  function remove(id, mount) {
    Util.confirm(T('删除评估'), T('确认删除该评估记录？此操作不可撤销（含其附件与版本）。'), T('删除')).then((ok) => {
      if (!ok) return;
      DB.deleteAssessment(id).then(() => { Util.toast(T('已删除'), 'ok'); Assess.render(mount); }).catch((e) => Util.toast(T('删除失败：') + e.message, 'err'));
    });
  }

  Assess.openView = openView;
  global.Assess = Assess;
})(window);

/* ===== src/js/report-tpl.js ===== */
/* 报告模板模型（四组件：layout / style / resources / settings）
 * 模板以 JSON 存储于 Storage（kv: report_templates），内置 3 套预设，支持创建/保存/切换/删除/复制。
 * 尺寸映射提供 phone / a5 / a4 / a3（横/纵）四种输出目标，满足小屏到投影的全端适配。
 */
(function (global) {
  const ReportTpl = {};

  // 尺寸：pxW = 渲染 DOM 宽度（px），page = jsPDF 页面尺寸 [宽,高] mm
  // 引擎按 (page[0]-2*marginX)/pxW 换算缩放，使内容精确落入页边距内。
  const SIZES = {
    phone: { key: 'phone', label: '手机', pxW: 384, page: [80, 160], ratio: 1 },
    a5: { key: 'a5', label: 'A5', pxW: 559, page: [148, 210], ratio: 1 },
    a4: { key: 'a4', label: 'A4', pxW: 794, page: [210, 297], ratio: 1 },
    a3: { key: 'a3', label: 'A3', pxW: 1123, page: [297, 420], ratio: 1 }
  };
  ReportTpl.SIZES = SIZES;
  ReportTpl.sizeKeys = function () { return Object.keys(SIZES); };

  // 语义章节键：pageMap 的唯一合法键集合，UI 与引擎共用，避免章节漏配尺寸
  const SECTION_KEYS = ['cover', 'meta', 'archive', 'summary', 'detail', 'process', 'evidence', 'disclaimer'];
  const SECTION_LABELS = {
    cover: '封面', meta: '基本信息', archive: '被审核单位档案', summary: '结果汇总',
    detail: '审核明细', process: '现场流程', evidence: '证据材料', disclaimer: '报告声明'
  };
  ReportTpl.SECTION_KEYS = SECTION_KEYS.slice();
  ReportTpl.sectionLabel = function (k) { return SECTION_LABELS[k] || k; };

  // pageMap 取值：'auto'（跟随 settings.targetSize/orientation）或 '<size>' / '<size>-landscape'
  ReportTpl.pageMapOptions = function () {
    const out = [{ value: 'auto', label: '自动（跟随目标尺寸）' }];
    Object.keys(SIZES).forEach((k) => {
      out.push({ value: k, label: SIZES[k].label + '（纵向）' });
      out.push({ value: k + '-landscape', label: SIZES[k].label + '（横向）' });
    });
    return out;
  };
  function autoMap() {
    const m = {};
    SECTION_KEYS.forEach((k) => { m[k] = 'auto'; });
    return m;
  }

  /* ===== 页眉 / 页脚：三槽位模型 =====
   * layout.header / layout.footer = { slots: {left:[],center:[],right:[]}, showOn }
   * 元素按槽位落位，因此可以"机构名靠左 + 页码居中 + 版权靠右"。
   * 旧结构 {elements:[...], align:'left'} 会被 normalizeBand 升级为槽位，不丢配置。
   */
  const HF_ELEMENTS = ['org', 'title', 'pagenum', 'copyright'];
  const HF_LABELS = { org: '机构名', title: '报告标题', pagenum: '页码', copyright: '版权' };
  const SLOTS = ['left', 'center', 'right'];
  ReportTpl.HF_ELEMENTS = HF_ELEMENTS.slice();
  ReportTpl.SLOTS = SLOTS.slice();
  ReportTpl.hfLabel = function (k) { return HF_LABELS[k] || k; };

  function emptySlots() { return { left: [], center: [], right: [] }; }

  // 归一化：补齐槽位、剔除非法元素、去重；旧 {elements,align} 按 align 归入对应槽位
  ReportTpl.normalizeBand = function (cfg) {
    const out = { slots: emptySlots(), showOn: (cfg && cfg.showOn) || 'all' };
    const seen = {};
    const push = (slot, e) => {
      if (HF_ELEMENTS.indexOf(e) < 0 || seen[e]) return;
      seen[e] = 1; out.slots[slot].push(e);
    };
    if (cfg && cfg.slots) {
      SLOTS.forEach((s) => { (cfg.slots[s] || []).forEach((e) => push(s, e)); });
    } else if (cfg && Array.isArray(cfg.elements)) {
      const slot = cfg.align === 'center' ? 'center' : cfg.align === 'right' ? 'right' : 'left';
      cfg.elements.forEach((e) => push(slot, e));
    }
    return out;
  };
  // 展平为元素列表（用于"该带区是否为空"判断与统计）
  ReportTpl.bandElements = function (cfg) {
    const n = ReportTpl.normalizeBand(cfg);
    return SLOTS.reduce((a, s) => a.concat(n.slots[s]), []);
  };

  /* ===== 字体资源：TTF/OTF 嵌入许可校验 =====
   * 解析 sfnt 表目录中的 OS/2 表，读取 fsType（表内偏移 8 的 uint16）。
   * fsType 低 4 位 == 0x0002 表示 Restricted License embedding，即字体厂商禁止嵌入，
   * 这类字体一律拒绝导入，避免产出法律上不可分发的 PDF。
   */
  const COMMON_FONTS = [
    'system-ui', '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'roboto', 'helvetica', 'helvetica neue',
    'arial', 'times new roman', 'courier new', 'simsun', 'simhei', 'microsoft yahei', 'pingfang sc',
    'noto sans cjk sc', 'source han sans sc', 'sans-serif', 'serif', 'monospace'
  ];
  ReportTpl.COMMON_FONTS = COMMON_FONTS.slice();
  ReportTpl.isCommonFont = function (name) {
    return COMMON_FONTS.indexOf(String(name || '').trim().toLowerCase()) >= 0;
  };

  ReportTpl.readFsType = function (buf) {
    try {
      const dv = new DataView(buf);
      if (dv.byteLength < 12) return null;
      const tag = dv.getUint32(0);
      // 0x00010000 TrueType, 'true', 'OTTO'(OpenType/CFF), 'ttcf'(集合，取首字体)
      let base = 0;
      if (tag === 0x74746366) { base = dv.getUint32(12); } // ttcf → 第一个字体的偏移
      else if (tag !== 0x00010000 && tag !== 0x74727565 && tag !== 0x4f54544f) return null;
      const numTables = dv.getUint16(base + 4);
      for (let i = 0; i < numTables; i++) {
        const rec = base + 12 + i * 16;
        if (rec + 16 > dv.byteLength) break;
        const name = String.fromCharCode(dv.getUint8(rec), dv.getUint8(rec + 1), dv.getUint8(rec + 2), dv.getUint8(rec + 3));
        if (name === 'OS/2') {
          const off = dv.getUint32(rec + 8);
          if (off + 10 > dv.byteLength) return null;
          return dv.getUint16(off + 8);
        }
      }
      return null; // 无 OS/2 表：无嵌入限制声明
    } catch (e) { return null; }
  };

  // 返回 { ok, fsType, reason }；fsType 为 null 表示字体未声明限制，按可嵌入处理
  ReportTpl.fontEmbeddable = function (buf) {
    const fsType = ReportTpl.readFsType(buf);
    if (fsType === null) return { ok: true, fsType: null, reason: '未声明嵌入限制' };
    if ((fsType & 0x000f) === 0x0002) return { ok: false, fsType: fsType, reason: '字体授权为 Restricted License embedding，禁止嵌入' };
    if (fsType & 0x0200) return { ok: false, fsType: fsType, reason: '字体仅允许位图嵌入，无法用于矢量文本嵌入' };
    return { ok: true, fsType: fsType, reason: (fsType & 0x0008) ? '可编辑嵌入' : ((fsType & 0x0004) ? '允许预览与打印嵌入' : '允许安装式嵌入') };
  };

  // 预设：四组件完整定义
  function presetStandard() {
    return {
      id: 'standard', name: '标准报告', builtin: true,
      layout: {
        // 槽位化页眉/页脚：机构名靠左、报告标题靠右；页码居中、版权靠右
        header: { slots: { left: ['org'], center: [], right: ['title'] }, showOn: 'all' },
        footer: { slots: { left: [], center: ['pagenum'], right: ['copyright'] }, showOn: 'all' },
        cover: { style: 'band', color: '#2840a8', subtitle: '', showOrg: true, showTime: true },
        // 章节→页面尺寸/方向映射，实现"一份文档混合尺寸"；'auto' 表示跟随 settings.targetSize
        pageMap: autoMap()
      },
      style: {
        fontFamily: "-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',Roboto,Helvetica,Arial,sans-serif",
        baseFontSize: 12.5, headingFontSize: 14.5, colorText: '#1c2536', colorHeading: '#1f2a44',
        colorAccent: '#2840a8', lineHeight: 1.6, marginX: 14, marginY: 14,
        // 条件边距：小屏改用百分比，避免固定 mm 边距吃空页面
        marginRules: { phone: { x: '4%', y: '3.5%' }, a5: { x: '7%', y: '6%' } },
        cssSnippet: ''
      },
      // resources.fonts: [{ id, name, mime, weight, style, size, fsType, data(base64) }]
      resources: { fonts: [] },
      settings: {
        targetSize: 'a4', orientation: 'portrait',
        compression: 'balanced', imageQuality: 85, fontEmbed: 'exclude-common',
        columns: 'auto',
        passOpen: '', passPerm: '', permPrint: true, permCopy: true, permModify: false,
        metaTitle: '', metaAuthor: '', metaKeywords: '',
        showGrade: false, showRisk: true, showProcess: true
      }
    };
  }
  function presetCompact() {
    const t = presetStandard();
    t.id = 'compact'; t.name = '简洁版'; t.builtin = true;
    t.style.marginX = 10; t.style.marginY = 10; t.style.baseFontSize = 11.5; t.style.lineHeight = 1.5;
    t.settings.compression = 'minimal'; t.settings.imageQuality = 72; t.settings.columns = 2;
    t.layout.footer.slots = { left: [], center: ['pagenum'], right: [] }; // 简洁版只留页码
    return t;
  }
  function presetPrint() {
    const t = presetStandard();
    t.id = 'print'; t.name = '打印优化版'; t.builtin = true;
    t.style.marginX = 16; t.style.marginY = 16; t.style.colorAccent = '#000000'; t.style.colorHeading = '#111111';
    t.settings.compression = 'quality'; t.settings.imageQuality = 95; t.settings.columns = 'auto';
    t.layout.cover.style = 'minimal'; t.layout.cover.color = '#111111';
    // 证据材料改用 A3 横版铺图，其余章节跟随目标尺寸 → 一份文档混合尺寸
    t.layout.pageMap = autoMap();
    t.layout.pageMap.evidence = 'a3-landscape';
    return t;
  }
  // SUP-011：通用报告模板（综合 FFC + WCA 排版模式）
  // 固定结构：封面 / 工厂信息 / 评分汇总 / 五维度详细评分 / 非合规项与整改 / 优势与挑战 / 最佳实践 / 照片证据。
  // 锁定不可编辑，供导出直接套用。
  function presetUniversal() {
    const t = presetStandard();
    t.id = 'universal'; t.name = '通用报告（标准）'; t.builtin = true;
    // 封面：标题 + 工厂 + 日期 + 总体评分（FFC/WCA 均居中）
    t.layout.cover = { style: 'band', color: '#1A5F9E', subtitle: 'Supplier Pre-Assessment Report', showOrg: true, showTime: true };
    // 页脚：工厂名称靠左 + 页码居中（FFC 每页顶/底统一显示工厂名称）
    t.layout.footer = { slots: { left: ['org'], center: ['pagenum'], right: [] }, showOn: 'all' };
    // 页眉：机构名靠左、报告标题靠右
    t.layout.header = { slots: { left: ['org'], center: [], right: ['title'] }, showOn: 'all' };
    // SUP-019：蓝白双色 + Verdana/微软雅黑 + 紧凑行距（简约专业）
    t.style = Object.assign({}, t.style, {
      fontFamily: "'Verdana','Microsoft YaHei',sans-serif",
      colorAccent: '#1A5F9E', colorHeading: '#1A5F9E', colorText: '#333333',
      baseFontSize: 12, headingFontSize: 14.5, lineHeight: 1.2,
      marginX: 14, marginY: 14
    });
    // 显示评分汇总 + 风险 + 现场流程
    t.settings = Object.assign({}, t.settings, {
      targetSize: 'a4', orientation: 'portrait',
      compression: 'quality', imageQuality: 90,
      showGrade: true, showRisk: true, showProcess: true
    });
    return t;
  }

  const BUILTIN = { universal: presetUniversal(), standard: presetStandard(), compact: presetCompact(), print: presetPrint() };
  ReportTpl.PRESETS = BUILTIN;
  // SUP-011：默认使用锁定通用模板
  ReportTpl.DEFAULT_ID = 'universal';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid() { return 'tpl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  const KEY = 'report_templates';

  /* 同步 API + 异步存储的桥接：
   * 渲染与分页计算必须同步取到模板，而 Storage 是异步的（http / IndexedDB 均异步）。
   * 因此用户模板在 init() 时一次性载入内存缓存，读走缓存（同步），写则更新缓存后异步写穿。
   * 未 init 时缓存为空数组，只暴露内置预设，不会抛错也不会静默丢数据。
   */
  let _user = null;
  let _inited = false;

  function userList() { if (!Array.isArray(_user)) _user = []; return _user; }

  ReportTpl.ready = function () { return _inited; };

  ReportTpl.init = function () {
    return Promise.resolve()
      .then(() => Storage.kvGet(KEY))
      .then((v) => { _user = Array.isArray(v) ? v : []; _inited = true; return ReportTpl.list(); })
      .catch(() => { _user = []; _inited = true; return ReportTpl.list(); });
  };

  // 防覆盖兜底：若 init() 未执行成功就发生写入，先把存储里的既有模板合并回缓存
  // （缓存内的同 id 记录优先），再整表写出，避免"空缓存盖掉已存模板"式数据丢失。
  function ensureLoadedBeforeWrite() {
    if (_inited) return Promise.resolve();
    return Promise.resolve()
      .then(() => Storage.kvGet(KEY))
      .then((v) => {
        const stored = Array.isArray(v) ? v : [];
        const cur = userList();
        const ids = cur.map((t) => t.id);
        _user = cur.concat(stored.filter((t) => t && ids.indexOf(t.id) < 0));
        _inited = true;
      })
      .catch(() => { _inited = true; });
  }

  function persist() {
    return ensureLoadedBeforeWrite()
      .then(() => Storage.kvPut(KEY, userList()))
      .catch((e) => {
        if (global.Util && Util.toast) Util.toast('报告模板保存失败：' + ((e && e.message) || e), 'err');
        throw e;
      });
  }
  ReportTpl.flush = persist;

  ReportTpl.default = function () { return clone(BUILTIN.universal || BUILTIN.standard); };

  // 列表：内置预设（深拷贝，防止被引用篡改）+ 用户模板
  ReportTpl.list = function () {
    const builtins = Object.keys(BUILTIN).map((k) => clone(BUILTIN[k]));
    return builtins.concat(userList().map((t) => Object.assign({}, clone(t), { builtin: false })));
  };

  ReportTpl.get = function (id) {
    return ReportTpl.list().find((t) => t.id === id) || null;
  };

  // 保存：内置预设 id 会被改写为新 id，避免覆盖内置模板
  ReportTpl.save = function (tpl) {
    if (!tpl) return null;
    tpl = clone(tpl);
    if (!tpl.id || Object.prototype.hasOwnProperty.call(BUILTIN, tpl.id)) tpl.id = uid();
    tpl.builtin = false;
    const user = userList();
    const i = user.findIndex((t) => t.id === tpl.id);
    if (i >= 0) user[i] = tpl; else user.push(tpl);
    persist().catch(() => {});
    return tpl;
  };

  ReportTpl.remove = function (id) {
    if (Object.prototype.hasOwnProperty.call(BUILTIN, id)) return false; // 内置预设不可删
    const user = userList();
    const i = user.findIndex((t) => t.id === id);
    if (i < 0) return false;
    user.splice(i, 1);
    persist().catch(() => {});
    return true;
  };

  ReportTpl.clone = function (id, name) {
    const src = ReportTpl.get(id);
    if (!src) return null;
    const c = clone(src);
    c.id = uid(); c.builtin = false; c.name = name || (src.name + ' 副本');
    delete c._selected;
    return ReportTpl.save(c);
  };

  // 目标尺寸（单一来源；pageFormat 为旧字段，仅作兼容读取）
  ReportTpl.targetSize = function (tpl) {
    const s = (tpl && tpl.settings) || {};
    const k = s.targetSize || s.pageFormat || 'a4';
    return SIZES[k] ? k : 'a4';
  };

  // 解析某章节应使用的页面尺寸/方向
  // pageMap[key] 为 'auto' 或未配置时，跟随 settings.targetSize + settings.orientation，
  // 从而支持"改一处目标尺寸即整份文档换版"，同时保留个别章节的显式覆盖（如证据材料 A3 横版）。
  ReportTpl.pageForSection = function (tpl, sectionKey) {
    const map = (tpl.layout && tpl.layout.pageMap) || {};
    const s = (tpl && tpl.settings) || {};
    let spec = map[sectionKey];
    if (!spec || spec === 'auto') {
      spec = ReportTpl.targetSize(tpl) + (s.orientation === 'landscape' ? '-landscape' : '');
    }
    const parts = String(spec).split('-');
    const size = SIZES[parts[0]] || SIZES[ReportTpl.targetSize(tpl)];
    const portrait = parts[1] !== 'landscape';
    const page = portrait ? size.page.slice() : [size.page[1], size.page[0]];
    return { sizeKey: size.key, pxW: size.pxW, page: page, orientation: portrait ? 'portrait' : 'landscape' };
  };

  // 压缩档位 → JPEG 质量上限(qCap)、光栅倍率(scale)、单页最大像素(maxPx)
  // scale 是体积与耗时的主控变量：光栅像素数按 scale² 增长。
  ReportTpl.compressionProfile = function (level) {
    if (level === 'quality') return { level: 'quality', qCap: 0.95, scale: 2.2, maxPx: 12e6, allowDownscale: false };
    if (level === 'minimal') return { level: 'minimal', qCap: 0.62, scale: 1.25, maxPx: 4e6, allowDownscale: true };
    return { level: 'balanced', qCap: 0.85, scale: 1.75, maxPx: 8e6, allowDownscale: false };
  };

  // 图像质量滑块(1..100) 与压缩档位联合求解最终 JPEG 质量
  ReportTpl.effectiveQuality = function (tpl) {
    const prof = ReportTpl.compressionProfile(tpl.settings.compression);
    let slider = parseInt(tpl.settings.imageQuality, 10);
    if (!isFinite(slider)) slider = 85;
    slider = Math.max(1, Math.min(100, slider));
    return Math.max(0.3, Math.min(prof.qCap, slider / 100));
  };

  global.ReportTpl = ReportTpl;
})(window);

/* ===== src/js/report-engine.js ===== */
/* 报告流式渲染引擎（模板驱动 / 响应式 / 高性能）
 * 设计要点：
 *  - 动态流式布局：内容按"块"顺序流入页面，坐标由 Y 光标动态计算，禁止绝对坐标硬编码。
 *  - 块分两类：text（整段内容）/ table（表格，支持跨页自动拆分、每页重复表头、行不被切断）。
 *  - 响应式：每个章节按 layout.pageMap 选用不同页面尺寸/方向，一份文档可混合 A4/A5/手机/A3 横版。
 *  - 表格分页纯函数 flow() 可独立单测；html2canvas / jsPDF 可注入（测试用 mock）。
 */
(function (global) {
  const Engine = {};
  let _uidc = 0;
  function uid() { return 'b' + (++_uidc); }
  function num(v, d) { const n = parseFloat(v); return isFinite(n) ? n : d; }
  // 数据层可能尚未加载完成（DB.get() 返回 null），导出路径必须容错而不是抛错
  function appSettings() {
    try {
      const st = (typeof DB !== 'undefined' && DB.get) ? DB.get() : null;
      return (st && st.settings) ? st.settings : {};
    } catch (e) { return {}; }
  }

  // ---------------- 纯函数：响应式列数 ----------------
  Engine.resolveColumns = function (tpl, sizeKey) {
    const c = tpl.settings.columns;
    if (c === 'auto') {
      if (sizeKey === 'phone') return 1;
      if (sizeKey === 'a5') return 2;
      return 3;
    }
    return Math.max(1, Math.min(3, parseInt(c, 10) || 1));
  };

  // ---------------- 纯函数：智能边距（支持 mm 数值 / 百分比 / 按尺寸条件覆盖）----------------
  Engine.resolveMargin = function (v, refMm, dflt) {
    if (typeof v === 'string' && v.trim().slice(-1) === '%') {
      const p = parseFloat(v);
      if (isFinite(p)) return refMm * p / 100;
    }
    const n = parseFloat(v);
    return isFinite(n) ? n : dflt;
  };
  Engine.resolveMargins = function (tpl, sizeKey, pageWmm, pageHmm) {
    const s = tpl.style || {};
    const r = (s.marginRules && s.marginRules[sizeKey]) || {};
    let mX = Engine.resolveMargin(r.x != null ? r.x : s.marginX, pageWmm, 14);
    let mY = Engine.resolveMargin(r.y != null ? r.y : s.marginY, pageHmm, 14);
    // 硬下限/上限：内容区不小于页面 55%，避免小屏尺寸被边距吃空
    mX = Math.max(1, Math.min(mX, pageWmm * 0.225));
    mY = Math.max(1, Math.min(mY, pageHmm * 0.225));
    return { mX: mX, mY: mY };
  };

  // ---------------- 纯函数：页面规格 ----------------
  Engine.makeSpec = function (tpl, sectionKey) {
    const p = ReportTpl.pageForSection(tpl, sectionKey);
    const pageWmm0 = p.page[0], pageHmm0 = p.page[1];
    const mm = Engine.resolveMargins(tpl, p.sizeKey, pageWmm0, pageHmm0);
    const mX = mm.mX, mY = mm.mY;
    const pageWmm = pageWmm0, pageHmm = pageHmm0, pxW = p.pxW;
    const pxPerMm = pxW / pageWmm;
    return {
      sizeKey: p.sizeKey, orientation: p.orientation, pxW: pxW, page: p.page,
      mX: mX, mY: mY, pxPerMm: pxPerMm,
      contentPxW: (pageWmm - 2 * mX) * pxPerMm,
      contentPxH: (pageHmm - 2 * mY) * pxPerMm,
      cols: Engine.resolveColumns(tpl, p.sizeKey),
      section: sectionKey
    };
  };

  // ---------------- 纯函数：表格拆分（行不被切断 + 每页重复表头）----------------
  // headH: 表头像素高; rowEls: 数据行 DOM 数组; heights: 对应像素高; avail: 本页可用像素
  Engine.splitTable = function (headH, rowEls, heights, avail) {
    let h = headH, k = 0;
    for (; k < rowEls.length; k++) {
      if (h + heights[k] <= avail) h += heights[k];
      else break;
    }
    if (k === 0 && rowEls.length > 0) { k = 1; h = headH + heights[0]; } // 单行超限也放置，避免死循环
    return { header: true, rows: rowEls.slice(0, k), remaining: rowEls.slice(k), remainingHeights: heights.slice(k), height: h };
  };

  // ---------------- 纯函数：流式分页（核心）----------------
  // block: { id, section, spec, kind:'text'|'table'|'break',
  //          h (text), headH/rowEls/heights (table) }
  Engine.flow = function (blocks, gap) {
    gap = gap || 0;
    const pages = [];
    let cur = null;
    function newPage(spec) { cur = { spec: spec, used: 0, items: [] }; pages.push(cur); }

    for (const b of blocks) {
      if (!cur || cur.spec.sizeKey !== b.spec.sizeKey || cur.spec.orientation !== b.spec.orientation) newPage(b.spec);
      let block = b;
      let guard = 0;
      while (true) {
        if (++guard > 100000) break; // 防御
        const avail = cur.spec.contentPxH - cur.used - (cur.items.length ? gap : 0);
        if (block.kind === 'break') {
          if (cur.used > 0) newPage(block.spec);
          break;
        }
        if (block.kind === 'text') {
          // SUP-021：标题不孤行——标题块(keepWithNext)若当前页剩余空间不足以容纳
          // 标题 + 至少一行正文，则强制换页，避免标题孤立在页底、正文在下一页。
          const minKeep = block.keepWithNext ? (block.h * 2.2) : 0;
          if (block.h <= avail && avail >= minKeep) {
            cur.items.push({ blockId: block.id, kind: 'text', ref: block.ref, height: block.h });
            cur.used += block.h + (cur.items.length > 1 ? gap : 0);
            break;
          }
          if (cur.used === 0) {
            // 空页：整块可能超高（如封面/超长段落），直接放入并允许溢出
            cur.items.push({ blockId: block.id, kind: 'text', ref: block.ref, height: block.h });
            cur.used += block.h;
            break;
          }
          newPage(block.spec); // 本页放不下 → 新页（next loop 在空页放置，必要时溢出）
          continue;
        }
        // table
        const placed = Engine.splitTable(block.headH, block.rowEls, block.heights, avail);
        cur.items.push({ blockId: block.id, kind: 'table', ref: block.ref, header: true, headH: block.headH, rows: placed.rows, height: placed.height });
        cur.used += placed.height + (cur.items.length > 1 ? gap : 0);
        if (placed.remaining.length) {
          newPage(block.spec);
          block = Object.assign({}, block, { rowEls: placed.remaining, heights: placed.remainingHeights });
          continue;
        }
        break;
      }
    }
    return pages;
  };

  // ---------------- 从章节 DOM 抽取块（测试可在 tr/dataset.h 注入高度）----------------
  function measure(el) {
    if (el && el.dataset && el.dataset.h) return num(el.dataset.h, 0);
    return (el && el.offsetHeight) ? el.offsetHeight : 0;
  }
  Engine.extractBlocks = function (sections) {
    const blocks = [];
    // 修复"导出 PDF 只有一页"：measure() 依赖 el.offsetHeight，而 buildReportDOM
    // 构建的元素尚未插入文档，offsetHeight 恒为 0 → 所有块高度视为 0 → flow 不分页。
    // 这里将各 section 按各自内容宽度(px)挂到 document.body 的离屏容器完成布局测量，测量后移除。
    const hosts = [];
    try {
      if (global.document) {
        sections.forEach((sec) => {
          const h = global.document.createElement('div');
          h.style.cssText = 'position:absolute;left:-99999px;top:0;width:' + Math.round(sec.spec.contentPxW) + 'px;height:auto;overflow:visible;pointer-events:none;';
          h.appendChild(sec.el);
          global.document.body.appendChild(h);
          hosts.push(h);
        });
      }
    } catch (e) { hosts.length = 0; }
    sections.forEach((sec) => {
      const spec = sec.spec, key = sec.key;
      const kids = sec.el && sec.el.children ? Array.from(sec.el.children) : [];
      if (!kids.length) {
        blocks.push({ id: uid(), section: key, spec: spec, kind: 'text', h: measure(sec.el), ref: sec.el });
        return;
      }
      kids.forEach((child) => {
        const tag = (child.tagName || '').toUpperCase();
        if (tag === 'STYLE' || tag === 'SCRIPT' || tag === 'LINK' || tag === 'TEMPLATE') return; // 非内容节点
        if (child.classList && child.classList.contains('rpt-page-break')) {
          blocks.push({ id: uid(), section: key, spec: spec, kind: 'break' });
          return;
        }
        if (child.classList && child.classList.contains('rpt-table')) {
          const thead = child.querySelector('thead');
          const tbody = child.querySelector('tbody');
          const headRows = thead ? Array.from(thead.querySelectorAll('tr')) : [];
          const headH = headRows.reduce((s, r) => s + measure(r), 0);
          const rowEls = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
          const heights = rowEls.map((r) => measure(r));
          blocks.push({ id: uid(), section: key, spec: spec, kind: 'table', headH: headH, rowEls: rowEls, heights: heights, ref: child });
          return;
        }
        // SUP-021：识别标题块(.rpt-h2)标记 keepWithNext，flow 中避免标题孤行在页底
        const isHeading = child.classList && child.classList.contains('rpt-h2');
        blocks.push({ id: uid(), section: key, spec: spec, kind: 'text', h: measure(child), ref: child, keepWithNext: !!isHeading });
      });
    });
    // 测量完成后卸载离屏容器（块引用元素已在 blocks 中，后续光栅化自行处理 DOM 挂载）
    try { hosts.forEach((h) => { if (h.parentNode) h.parentNode.removeChild(h); }); } catch (e) {}
    return blocks;
  };

  /* ---------------- 字体嵌入策略 ----------------
   * all           → 导入的自定义字体全部嵌入；
   * exclude-common→ 名称命中常用系统字体清单的跳过（这类字体各端自带，嵌入只增体积）。
   * 无论哪种策略，导入时已通过 fsType 校验，禁止嵌入的专有字体不会进入 resources.fonts。
   */
  Engine.fontsToEmbed = function (tpl) {
    const list = (tpl && tpl.resources && tpl.resources.fonts) || [];
    const strategy = (tpl && tpl.settings && tpl.settings.fontEmbed) || 'exclude-common';
    return list.filter((f) => {
      if (!f || !f.data || !f.name) return false;
      if (strategy === 'all') return true;
      return !ReportTpl.isCommonFont(f.name);
    });
  };

  // @font-face：让 html2canvas 光栅化与屏幕预览使用同一份自定义字体。
  // 输出为光栅图时字形已烘进图像，查看端缺字体也不会回退变形。
  Engine.buildFontFaces = function (tpl) {
    return Engine.fontsToEmbed(tpl).map((f) => {
      const fmt = /otf|opentype/i.test(f.mime || f.name) ? 'opentype' : 'truetype';
      return "@font-face{font-family:'" + String(f.name).replace(/'/g, '') + "';"
        + "src:url(data:" + (f.mime || 'font/ttf') + ';base64,' + f.data + ") format('" + fmt + "');"
        + 'font-weight:' + (f.weight || 'normal') + ';font-style:' + (f.style || 'normal') + ';font-display:block;}';
    }).join('\n');
  };

  // 把字体写入 jsPDF 虚拟文件系统（供文本层/大纲使用；光栅路径不依赖此步）
  Engine.registerFonts = function (doc, tpl) {
    const list = Engine.fontsToEmbed(tpl);
    if (!doc || typeof doc.addFileToVFS !== 'function' || typeof doc.addFont !== 'function') return [];
    const done = [];
    list.forEach((f) => {
      try {
        const file = String(f.name).replace(/[^\w.-]/g, '_') + (/otf/i.test(f.mime || '') ? '.otf' : '.ttf');
        doc.addFileToVFS(file, f.data);
        doc.addFont(file, f.name, f.style || 'normal', f.weight || 'normal');
        done.push(f.name);
      } catch (e) { /* 单个字体失败不影响导出，光栅路径已含字形 */ }
    });
    return done;
  };

  // ---------------- 样式表（由模板生成，注入到 .rpt-root）----------------
  Engine.buildStyleSheet = function (tpl) {
    const s = tpl.style;
    const ff = s.fontFamily || "system-ui,'PingFang SC','Microsoft YaHei',Arial,sans-serif";
    const fs = num(s.baseFontSize, 12.5);
    const hfs = num(s.headingFontSize, 14.5);
    const ct = s.colorText || '#1c2536';
    const ch = s.colorHeading || '#1f2a44';
    const ac = s.colorAccent || '#2840a8';
    const lh = num(s.lineHeight, 1.6);
    return [
      Engine.buildFontFaces(tpl), // @font-face 必须在使用之前声明
      '.rpt-root{font-family:' + ff + ';font-size:' + fs + 'px;color:' + ct + ';line-height:' + lh + ';box-sizing:border-box;}',
      '.rpt-root *{box-sizing:border-box;}',
      '.rpt-h2{font-size:' + hfs + 'px;font-weight:800;color:' + ch + ';margin:14px 0 8px;padding-bottom:6px;border-bottom:1.5px solid #E8F0FE;}',
      '.rpt-sub{font-size:11.5px;color:#666;margin-left:10px;}',
      '.rpt-meta{display:flex;flex-wrap:wrap;border:1px solid #E8F0FE;border-radius:6px;overflow:hidden;margin-bottom:16px;}',
      '.rpt-meta>div{flex:1;min-width:138px;padding:8px 12px;border-right:1px solid #E8F0FE;}',
      '.rpt-k{font-size:10px;color:#1A5F9E;text-transform:uppercase;letter-spacing:.5px;font-weight:600;}',
      '.rpt-v{font-size:13px;font-weight:700;margin-top:2px;color:#333;}',
      '.rpt-table{width:100%;border-collapse:collapse;font-size:' + (fs - 1) + 'px;}',
      '.rpt-table th{background:#1A5F9E;color:#fff;padding:6px 8px;text-align:left;font-weight:700;}',
      '.rpt-table td{border:1px solid #E8F0FE;padding:5px 8px;vertical-align:top;}',
      '.rpt-table tr:nth-child(even) td{background:#E8F0FE;}',
      '.rpt-card{background:#F5F9FF;border:1px solid #E8F0FE;border-radius:6px;padding:12px 14px;margin-bottom:12px;}',
      '.rpt-badge{display:inline-block;padding:2px 9px;border-radius:9px;font-weight:700;font-size:11px;color:#fff;background:#1A5F9E;}',
      '.rpt-multicol{column-gap:14px;}',
      '.rpt-cols-1 .rpt-multicol{column-count:1;}', '.rpt-cols-2 .rpt-multicol{column-count:2;}', '.rpt-cols-3 .rpt-multicol{column-count:3;}',
      // 封面（供 pageMap 的 cover 章节使用，accent 由 CSS 变量注入）
      // SUP-022：FLA 式封面——左侧色条 + 左对齐 + 元数据网格
      '.rpt-cover{padding:0;box-sizing:border-box;display:flex;min-height:150px;}',
      '.rpt-cover.fla-cover{background:#fff;}',
      '.rpt-cover-bar{width:8px;flex:0 0 8px;}',
      '.rpt-cover-inner{flex:1;padding:38px 44px;}',
      '.rpt-cover-org{font-size:12px;font-weight:700;color:#1A5F9E;letter-spacing:.5px;text-transform:uppercase;}',
      '.rpt-cover-sub{font-size:10.5px;letter-spacing:2.5px;color:#7a8699;font-weight:600;margin-top:6px;}',
      '.rpt-cover-title{font-size:24px;font-weight:800;color:var(--rpt-heading);margin-top:8px;letter-spacing:.5px;line-height:1.25;}',
      '.rpt-cover-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 28px;margin-top:22px;border-top:1px solid #e8ecf2;padding-top:18px;}',
      '.rpt-cover-cell{display:flex;flex-direction:column;}',
      '.rpt-cover-k{font-size:10px;color:#7a8699;text-transform:uppercase;letter-spacing:.5px;font-weight:600;}',
      '.rpt-cover-v{font-size:13.5px;font-weight:700;color:#333;margin-top:2px;}',
      '.rpt-page-break{height:0;}',
      // SUP-022：FLA 式组件——概览条 / 发现卡 / 自定义风险 / 评级卡
      '.rpt-summary-overview{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:4px;}',
      '.rpt-ov-item{flex:1;min-width:150px;background:#F5F9FF;border:1px solid #E8F0FE;border-radius:6px;padding:10px 14px;}',
      '.rpt-ov-k{font-size:10px;color:#7a8699;text-transform:uppercase;letter-spacing:.5px;font-weight:600;}',
      '.rpt-ov-v{font-size:26px;font-weight:800;line-height:1.1;margin-top:2px;}',
      '.rpt-ov-sub{font-size:11px;color:#9aa6b6;margin-top:1px;}',
      '.rpt-ov-riskrow{display:flex;gap:6px;margin-top:6px;align-items:center;flex-wrap:wrap;}',
      '.rpt-risk-chip{display:inline-block;color:#fff;font-size:11px;font-weight:700;padding:2px 9px;border-radius:9px;}',
      '.rpt-custom-risk .rpt-cr-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;}',
      '.rpt-cr-title{font-size:12px;color:#545f72;font-weight:700;}',
      '.rpt-cr-body{font-size:12.5px;color:#333;line-height:1.55;white-space:pre-wrap;}',
      '.rpt-cr-action{font-size:12.5px;color:#545f72;line-height:1.55;margin-top:6px;}',
      '.rpt-cr-lbl{font-weight:700;color:#1A5F9E;margin-right:6px;}',
      '.rpt-grade .rpt-grade-badge{flex:0 0 88px;border-radius:12px;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;min-height:82px;}',
      '.rpt-grade-letter{font-size:32px;font-weight:800;line-height:1;}',
      '.rpt-grade-cap{font-size:11px;margin-top:6px;}',
      '.rpt-grade-body{flex:1;min-width:220px;}',
      '.rpt-grade-label{font-size:15px;font-weight:800;color:var(--rpt-heading);}',
      '.rpt-grade-note{font-size:12.5px;color:#545f72;margin-top:6px;line-height:1.6;}',
      '.rpt-finding{border:1px solid #E8F0FE;border-left:4px solid #1A5F9E;border-radius:6px;padding:10px 14px;margin-bottom:10px;background:#fff;}',
      '.rpt-finding-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
      '.rpt-finding-no{font-size:13px;font-weight:800;color:#1A5F9E;}',
      '.rpt-finding-mod{font-size:11px;color:#7a8699;font-weight:600;}',
      '.rpt-finding-spacer{flex:1;}',
      '.rpt-finding-q{font-size:13px;font-weight:700;color:#333;margin:6px 0 4px;line-height:1.45;}',
      '.rpt-finding-row{display:flex;gap:10px;margin-top:4px;align-items:baseline;}',
      '.rpt-finding-lbl{flex:0 0 64px;font-size:11px;color:#1A5F9E;font-weight:700;}',
      '.rpt-finding-val{font-size:12.5px;line-height:1.55;flex:1;}',
      (s.cssSnippet || '')
    ].join('\n');
  };

  // ---------------- 注入样式 + 响应式列 class ----------------
  // 样式表放入 document.head 单例节点，而不是塞进章节内部：
  //  1) 避免 <style> 被 extractBlocks 当成内容块，产生空白块与多余光栅；
  //  2) 分块克隆到独立宿主光栅化时，作用域选择器 .rpt-* 仍然生效（否则块会丢样式）。
  const STYLE_ID = 'rpt-style-global';
  Engine.ensureGlobalStyle = function (tpl) {
    if (typeof document === 'undefined') return null;
    let st = document.getElementById(STYLE_ID);
    if (!st) {
      st = document.createElement('style');
      st.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(st);
    }
    st.textContent = Engine.buildStyleSheet(tpl);
    return st;
  };
  Engine.applyVars = function (el, tpl) {
    const s = tpl.style || {};
    el.style.setProperty('--rpt-accent', s.colorAccent || '#2840a8');
    el.style.setProperty('--rpt-heading', s.colorHeading || '#1f2a44');
    return el;
  };
  Engine.applyStyle = function (rootEl, tpl, sizeKey) {
    Engine.ensureGlobalStyle(tpl);
    Engine.applyVars(rootEl, tpl);
    rootEl.classList.add('rpt-root', 'rpt-cols-' + Engine.resolveColumns(tpl, sizeKey));
    return rootEl;
  };

  // ---------------- 构建报告 DOM（调用 Report.buildReportSections）----------------
  Engine.buildReportDOM = function (model, tpl) {
    const sections = Engine.buildSections(model, tpl); // [{key, el}]
    // SUP-020：字号自适应——以 A4 内容宽(约1000px)为基准，小尺寸页面等比缩小字号，
    // 大尺寸放大，clamp 限制在 0.88–1.12，确保各 targetSize 下排版均衡、不溢出。
    const basePx = num(tpl.style && tpl.style.baseFontSize, 12.5);
    sections.forEach((sec) => {
      const spec = Engine.makeSpec(tpl, sec.key);
      sec.spec = spec;
      // 关键：DOM 宽度 = 内容区宽度(contentPxW)，使 px 高度可用 pxPerMm 精确换算为 mm，
      // 页边距只在 PDF 落位时以 mm 施加一次，避免"px 内边距 + mm 页边距"双重叠加。
      sec.el.style.width = spec.contentPxW + 'px';
      sec.el.style.background = '#fff';
      // 字号自适应（覆盖全局 .rpt-root font-size）
      const scale = Math.max(0.88, Math.min(1.12, spec.contentPxW / 1000));
      sec.el.style.fontSize = (basePx * scale) + 'px';
      Engine.applyStyle(sec.el, tpl, spec.sizeKey);
    });
    return sections;
  };

  // ---------------- 分页信息（供分页预览）----------------
  // 同步返回 { pages, totalBlocks }（buildReportDOM/extractBlocks/flow 均为同步）
  Engine.computePages = function (model, tpl) {
    const sections = Engine.buildReportDOM(model, tpl);
    const blocks = Engine.extractBlocks(sections);
    const pages = Engine.flow(blocks, 8);
    return { pages: pages, totalBlocks: blocks.length };
  };

  // ---------------- 实时预览节点（缩放显示）----------------
  Engine.previewNode = function (model, tpl) {
    const wrap = Util.el('div', { class: 'rpt-preview-wrap' });
    const sections = Engine.buildReportDOM(model, tpl);
    const scale = 0.62;
    sections.forEach((sec) => {
      const holder = Util.el('div', { style: 'position:relative;width:' + Math.round(sec.spec.contentPxW * scale) + 'px;overflow:hidden;margin-bottom:10px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.15)' });
      const inner = Util.el('div', { style: 'width:' + Math.round(sec.spec.contentPxW) + 'px;transform:scale(' + scale + ');transform-origin:top left' });
      inner.appendChild(sec.el);
      holder.appendChild(inner);
      requestAnimationFrame(() => { try { holder.style.height = (sec.el.offsetHeight * scale) + 'px'; } catch (e) {} });
      wrap.appendChild(holder);
    });
    return wrap;
  };

  // ---------------- 注入点（测试用 mock）----------------
  Engine.setHtml2canvas = function (fn) { Engine._h2c = fn; };
  Engine.setJsPDF = function (ctor) { Engine._jspdf = ctor; };
  function h2c(el, opts) {
    if (Engine._h2c) return Engine._h2c(el, opts);
    return global.html2canvas ? global.html2canvas(el, opts) : Promise.reject(new Error('html2canvas 不可用'));
  }
  function jsPDFCtor(opts) {
    if (Engine._jspdf) return new Engine._jspdf(opts);
    if (global.jspdf && global.jspdf.jsPDF) return new global.jspdf.jsPDF(opts);
    throw new Error('jsPDF 不可用');
  }

  // ---------------- 依赖懒加载（核心性能优化）----------------
  // 导出相关重量级库（jsPDF ~364KB / html2canvas ~198KB / XLSX ~881KB）不再随首屏同步下载，
  // 而是首次执行导出时按需加载；已加载则零开销直接返回。
  Engine.LIB_SPECS = {
    jspdf: { src: 'lib/jspdf.umd.min.js', check: function () { return !!(global.jspdf && global.jspdf.jsPDF); } },
    autotable: {
      src: 'lib/jspdf.plugin.autotable.min.js',
      check: function (g) {
        const ctor = g && g.jspdf && g.jspdf.jsPDF;
        return !!(ctor && ctor.prototype && typeof ctor.prototype.autoTable === 'function');
      }
    }, // 依赖 jspdf，随其加载
    html2canvas: { src: 'lib/html2canvas.min.js', check: function () { return !!global.html2canvas; } },
    xlsx: { src: 'lib/xlsx.full.min.js', check: function () { return !!global.XLSX; } }
  };
  Engine.ensureLibs = function (names) {
    if (!global.Util || !Util.loadLibs) return Promise.reject(new Error('Util.loadLibs 不可用'));
    const list = (names || ['jspdf', 'autotable', 'html2canvas', 'xlsx'])
      .map(function (n) { return Engine.LIB_SPECS[n]; }).filter(Boolean);
    return Util.loadLibs(list);
  };


  // ---------------- 光栅倍率：受档位与单页像素预算双重约束 ----------------
  // 不依赖硬件升级，改为按页面像素预算自动降倍率，保证低配设备也能完成导出。
  Engine.rasterScale = function (prof, widthPx, heightPx) {
    let s = prof.scale;
    const px = widthPx * heightPx;
    if (px > 0) {
      const cap = Math.sqrt(prof.maxPx / px);
      if (cap < s) s = cap;
    }
    return Math.max(0.75, Math.min(prof.scale, s));
  };

  // ---------------- 把单个块渲染为 canvas ----------------
  // 宿主宽度严格等于 contentPxW 且不加内边距：px→mm 换算保持单一比例 pxPerMm。
  function rasterize(host, spec, prof) {
    document.body.appendChild(host);
    const hpx = host.offsetHeight || spec.contentPxH;
    const s = Engine.rasterScale(prof, spec.contentPxW, hpx);
    return h2c(host, { scale: s, backgroundColor: '#ffffff', logging: false, useCORS: true })
      .then((c) => { if (host.parentNode) host.parentNode.removeChild(host); return c; })
      .catch((e) => { if (host.parentNode) host.parentNode.removeChild(host); throw e; });
  }

  function blockToCanvas(item, spec, prof, tpl) {
    // 宿主带上 .rpt-root + 列数 class 并注入 CSS 变量，保证克隆出的块与预览完全同款
    const host = Util.el('div', {
      class: 'rpt-root rpt-cols-' + (spec.cols || 3),
      style: 'position:absolute;left:-99999px;top:0;width:' + Math.round(spec.contentPxW) + 'px;background:#fff;padding:0'
    });
    if (tpl) Engine.applyVars(host, tpl);
    if (item.kind === 'text') {
      host.appendChild(item.ref.cloneNode(true));
      return rasterize(host, spec, prof);
    }
    // table：克隆表头 + 本页数据行（每页重复表头）
    const orig = item.ref;
    const tbl = orig.cloneNode(false);
    tbl.className = 'rpt-table';
    const thead = orig.querySelector('thead');
    if (thead) { const th = thead.cloneNode(true); th.style.display = 'table-header-group'; tbl.appendChild(th); }
    const tbody = document.createElement('tbody');
    item.rows.forEach((r) => tbody.appendChild(r.cloneNode(true)));
    tbl.appendChild(tbody);
    host.appendChild(tbl);
    return rasterize(host, spec, prof);
  }

  // ---------------- 页眉/页脚/页码 叠加 ----------------
  // 元素文案解析（槽位与顺序由模板决定，文案由应用设置与模板元数据决定）
  Engine.bandText = function (e, tpl, pageNo, pageTotal) {
    const st = appSettings();
    const org = st.orgName || '供应商预审平台';
    if (e === 'org') return org;
    if (e === 'title') return tpl.settings.metaTitle || st.reportTitle || '预审报告';
    if (e === 'pagenum') return '第 ' + pageNo + ' / ' + pageTotal + ' 页';
    if (e === 'copyright') return '© ' + new Date().getFullYear() + ' ' + org + ' · 内部资料';
    return '';
  };

  // 页眉/页脚按 left / center / right 三槽位排布：三列等分 + 各自对齐，
  // 因此"机构名靠左 + 页码居中 + 版权靠右"可同时成立，且不依赖绝对坐标。
  function overlayCanvas(tpl, kind, pageNo, pageTotal, spec, prof) {
    const raw = (kind === 'header') ? tpl.layout.header : tpl.layout.footer;
    if (!raw || raw.showOn === 'none' || (raw.showOn === 'first' && pageNo !== 1)) return Promise.resolve(null);
    const cfg = ReportTpl.normalizeBand(raw);
    if (!ReportTpl.bandElements(cfg).length) return Promise.resolve(null);
    const border = kind === 'header' ? 'border-bottom:1px solid #e8ecf2' : 'border-top:1px solid #e8ecf2';
    const el = Util.el('div', { class: 'rpt-root', style: 'position:absolute;left:-99999px;top:0;width:' + Math.round(spec.contentPxW) + 'px;background:#fff;padding:4px 0;display:flex;align-items:baseline;gap:10px;font-size:10px;color:#7a8699;' + border });
    Engine.applyVars(el, tpl);
    ReportTpl.SLOTS.forEach((slot) => {
      const align = slot === 'center' ? 'center' : slot === 'right' ? 'right' : 'left';
      const cell = Util.el('div', { style: 'flex:1 1 0;min-width:0;text-align:' + align + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis' });
      (cfg.slots[slot] || []).forEach((e, i) => {
        if (i) cell.appendChild(Util.el('span', { style: 'opacity:.45;margin:0 6px', text: '·' }));
        cell.appendChild(Util.el('span', { text: Engine.bandText(e, tpl, pageNo, pageTotal) }));
      });
      el.appendChild(cell);
    });
    return rasterize(el, spec, prof);
  }

  // ---------------- 构建章节（支持直接传入预构建 sections）----------------
  Engine.buildSections = function (model, tpl) {
    if (model && model.sections) return model.sections;
    return Report.buildReportSections(model, tpl);
  };

  // ---------------- 单页渲染（顺序执行，峰值内存 = 单页光栅）----------------
  function renderOnePage(doc, pg, pi, pageTotal, tpl, q, prof) {
    const spec = pg.spec;
    const pageWmm = spec.page[0], pageHmm = spec.page[1];
    const contentWmm = pageWmm - 2 * spec.mX;
    const contentHmm = pageHmm - 2 * spec.mY;
    if (pi > 0) doc.addPage(spec.page.slice(), spec.orientation);
    // 块逐个光栅化并即时落位，canvas 用后即弃，避免整份文档同时驻留内存
    let chain = Promise.resolve(spec.mY);
    pg.items.forEach((it) => {
      chain = chain.then((yMm) => blockToCanvas(it, spec, prof, tpl).then((c) => {
        // 防御：真实 html2canvas 可能对塌陷/空内容块输出 0 或 NaN 尺寸画布，
        // 否则 hMm = 0/0 = NaN 会传导进 jsPDF.scale，导致 "Invalid argument passed to jsPDF.scale"。
        const cw = c.width, ch = c.height;
        if (!cw || !ch || !isFinite(cw) || !isFinite(ch)) return yMm; // 跳过无效块，保持纵向游标不变
        let wMm = contentWmm;
        let hMm = (ch / cw) * wMm;
        // 单块高于整页时按高度自适应缩放并水平居中，保证不被裁切
        if (hMm > contentHmm) { const k = contentHmm / hMm; hMm = contentHmm; wMm = wMm * k; }
        const xMm = spec.mX + (contentWmm - wMm) / 2;
        doc.addImage(c.toDataURL('image/jpeg', q), 'JPEG', xMm, yMm, wMm, hMm);
        return yMm + hMm;
      }));
    });
    return chain
      .then(() => overlayCanvas(tpl, 'header', pi + 1, pageTotal, spec, prof))
      .then((hc) => {
        if (hc && hc.width && hc.height && isFinite(hc.width) && isFinite(hc.height)) {
          const hh = (hc.height / hc.width) * contentWmm;
          doc.addImage(hc.toDataURL('image/jpeg', q), 'JPEG', spec.mX, Math.max(1, spec.mY - hh - 1.5), contentWmm, hh);
        }
        return overlayCanvas(tpl, 'footer', pi + 1, pageTotal, spec, prof);
      })
      .then((fc) => {
        if (fc && fc.width && fc.height && isFinite(fc.width) && isFinite(fc.height)) {
          const fh = (fc.height / fc.width) * contentWmm;
          doc.addImage(fc.toDataURL('image/jpeg', q), 'JPEG', spec.mX, Math.min(pageHmm - fh - 1, pageHmm - spec.mY + 1.5), contentWmm, fh);
        }
      });
  }

  // ---------------- 主出口：生成 jsPDF 文档 ----------------
  Engine.renderToPdf = function (model, tpl, opts) {
    opts = opts || {};
    // 导出前确保 PDF 依赖已加载（首次执行时按需下载，之后零开销）
    return Engine.ensureLibs(['jspdf', 'autotable', 'html2canvas']).then(function () {
      return Engine._renderToPdfInner(model, tpl, opts);
    });
  };
  Engine._renderToPdfInner = function (model, tpl, opts) {
    const sections = Engine.buildReportDOM(model, tpl);
    const blocks = Engine.extractBlocks(sections);
    const pages = Engine.flow(blocks, 8);
    if (!pages.length) return Promise.reject(new Error('报告内容为空，无法生成 PDF'));
    const pageTotal = pages.length;
    const prof = ReportTpl.compressionProfile(tpl.settings.compression);
    const q = ReportTpl.effectiveQuality(tpl);
    const first = pages[0].spec;
    const encryption = tpl.settings.passOpen
      ? { userPassword: tpl.settings.passOpen, ownerPassword: tpl.settings.passPerm || tpl.settings.passOpen, userPermissions: permList(tpl) }
      : undefined;
    // 首页直接用第一页规格建文档，后续页 addPage 指定各自尺寸/方向 → 混合尺寸
    const doc = jsPDFCtor({ unit: 'mm', format: first.page.slice(), orientation: first.orientation, compress: true, encryption: encryption });
    // 按嵌入策略把自定义字体写入文档（导入时已过 fsType 许可校验）
    const embedded = Engine.registerFonts(doc, tpl);

    // 严格串行：保证页序与写入顺序一致
    let chain = Promise.resolve();
    pages.forEach((pg, pi) => {
      chain = chain.then(() => renderOnePage(doc, pg, pi, pageTotal, tpl, q, prof))
        .then(() => { if (opts.onProgress) opts.onProgress(pi + 1, pageTotal); });
    });

    return chain.then(() => {
      const st = appSettings();
      doc.setProperties({
        title: tpl.settings.metaTitle || st.reportTitle || '预审报告',
        author: tpl.settings.metaAuthor || st.orgName || '供应商预审平台',
        keywords: tpl.settings.metaKeywords || '预审,合规,审核报告',
        subject: 'Supplier Pre-Assessment Report',
        creator: '供应商预审平台 Report Engine'
      });
      let sizeBytes = 0;
      try { sizeBytes = doc.output('arraybuffer').byteLength; } catch (e) {
        try { sizeBytes = doc.output('datauristring').length * 0.75; } catch (e2) {}
      }
      return { doc: doc, pages: pageTotal, sizeBytes: sizeBytes, profile: prof.level, quality: q, fonts: embedded };
    });
  };

  function permList(tpl) {
    const s = tpl.settings, out = [];
    if (s.permPrint !== false) out.push('print');
    if (s.permCopy !== false) out.push('copy');
    if (s.permModify === true) out.push('modify');
    return out;
  }

  // ---------------- 批量异步导出队列 ----------------
  Engine.exportAsync = function (jobs, tpl, onProgress) {
    return new Promise((resolve) => {
      const results = [];
      let i = 0;
      function step() {
        if (i >= jobs.length) { resolve(results); return; }
        const idx = i++;
        Promise.resolve().then(() => Engine.renderToPdf(jobs[idx].model, jobs[idx].tpl || tpl, jobs[idx].opts || {}))
          .then((r) => { const fn = jobs[idx].filename || ('report_' + idx + '.pdf'); try { r.doc.save(fn); results.push({ ok: true, filename: fn, pages: r.pages, size: r.sizeBytes }); } catch (e) { console.error('PDF 批量保存失败', fn, e); results.push({ ok: false, filename: fn, error: (e && e.message) || String(e) }); } })
          .catch((e) => { results.push({ ok: false, error: e.message }); })
          .then(() => { if (onProgress) onProgress(idx + 1, jobs.length, results[results.length - 1]); const yieldFn = global.requestIdleCallback || ((f) => setTimeout(f, 0)); yieldFn(step); });
      }
      step();
    });
  };

  global.ReportEngine = Engine;
})(window);

/* ===== src/js/report.js ===== */
/* 数据导出（SUP-026 重构）：HTML 所见即所得预览编辑 + Word/PDF/HTML 三格式导出
 * - 取消固定排版 PDF 指令与限制：用户可自由选择/创建模板，预览即 HTML，可自由编辑
 * - 排版规范：以 FLA 工厂评估报告为基准——取消色块，改用淡蓝色线条（#B0D4F1）分区
 * - 导出格式：Word（.doc，可再编辑）/ PDF（.pdf，跨平台一致）/ HTML（.html，在线查看）
 * - 其余数据导出能力（Excel / 不符合项 / 批量 / 按章节）保留不变
 */
(function (global) {
  const Report = {};

  // ================= 排版规范（淡蓝色线条分区，无色块） =================
  const LINE = '#B0D4F1';      // 分区线条：淡蓝
  const ACCENT = '#1A5F9E';    // 强调：中蓝（标题、关键数据）
  const INK = '#333333';       // 正文：深灰
  const MUTED = '#6b7a90';     // 次要文字

  // 导出文件（Word/HTML）内嵌样式——与编辑区 .rpt-line 主题一致
  const EXPORT_CSS = [
    'body{font-family:"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif;font-size:12.5px;color:' + INK + ';line-height:1.7;background:#fff;margin:0;padding:32px 40px}',
    '.rl-doc{max-width:760px;margin:0 auto}',
    '.rl-title{font-size:24px;font-weight:800;color:' + ACCENT + ';letter-spacing:.5px;margin:0 0 2px}',
    '.rl-sub{font-size:13px;color:' + MUTED + ';margin:0 0 10px}',
    '.rl-rule{border:0;border-top:2px solid ' + LINE + ';margin:12px 0 18px}',
    '.rl-rule.thin{border-top-width:1px}',
    '.rl-meta-grid{display:flex;flex-wrap:wrap;border:1px solid ' + LINE + ';border-radius:4px;overflow:hidden;margin:6px 0 16px}',
    '.rl-meta-cell{flex:1;min-width:150px;padding:8px 12px;border-right:1px dashed ' + LINE + ';border-bottom:1px dashed ' + LINE + '}',
    '.rl-meta-k{font-size:10px;color:' + MUTED + ';letter-spacing:.5px;text-transform:uppercase}',
    '.rl-meta-v{font-size:13px;font-weight:700;color:' + INK + ';margin-top:2px}',
    'h2.rl-h2{font-size:15px;font-weight:800;color:' + ACCENT + ';margin:22px 0 8px;padding-bottom:6px;border-bottom:2px solid ' + LINE + '}',
    'h2.rl-h2 .rl-h2sub{font-size:11px;color:' + MUTED + ';font-weight:400;margin-left:10px}',
    'h3.rl-h3{font-size:13px;font-weight:700;color:' + INK + ';margin:14px 0 6px;padding-left:9px;border-left:3px solid ' + LINE + '}',
    'table.rl-tbl{width:100%;border-collapse:collapse;font-size:11.5px;margin:6px 0 12px}',
    'table.rl-tbl th{color:' + ACCENT + ';text-align:left;font-weight:700;padding:6px 8px;border-bottom:2px solid ' + LINE + ';background:#fff}',
    'table.rl-tbl td{padding:6px 8px;border-bottom:1px solid ' + LINE + ';vertical-align:top}',
    'table.rl-tbl tr:last-child td{border-bottom:1px solid ' + LINE + '}',
    '.rl-box{border:1px dashed ' + LINE + ';border-radius:4px;padding:10px 14px;margin:8px 0}',
    '.rl-find{border-left:3px solid ' + LINE + ';padding:4px 0 4px 14px;margin:14px 0}',
    '.rl-find-head{font-size:12px;color:' + MUTED + ';margin-bottom:4px}',
    '.rl-find-no{color:' + ACCENT + ';font-weight:800;margin-right:8px}',
    '.rl-tag{display:inline-block;font-size:10.5px;font-weight:700;color:' + ACCENT + ';border:1px solid ' + LINE + ';border-radius:3px;padding:0 7px;margin-left:6px;background:#fff}',
    '.rl-find-q{font-size:13px;font-weight:700;color:' + INK + ';margin:4px 0 8px}',
    '.rl-kv{display:flex;gap:8px;font-size:12px;margin:3px 0}',
    '.rl-k{flex:0 0 92px;color:' + MUTED + ';font-weight:700}',
    '.rl-v{flex:1;color:' + INK + '}',
    '.rl-grade{display:flex;gap:16px;align-items:center;border:1px solid ' + LINE + ';border-radius:4px;padding:12px 16px;margin:8px 0}',
    '.rl-grade-letter{width:56px;height:56px;border:2px solid ' + ACCENT + ';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:' + ACCENT + '}',
    '.rl-grade-label{font-size:13px;font-weight:800;color:' + ACCENT + '}',
    '.rl-grade-note{font-size:11.5px;color:' + MUTED + ';margin-top:3px;line-height:1.6}',
    '.rl-stat{display:flex;gap:0;border:1px solid ' + LINE + ';border-radius:4px;overflow:hidden;margin:6px 0 12px}',
    '.rl-stat-item{flex:1;padding:10px 14px;border-right:1px dashed ' + LINE + '}',
    '.rl-stat-item:last-child{border-right:0}',
    '.rl-stat-k{font-size:10.5px;color:' + MUTED + '}',
    '.rl-stat-v{font-size:18px;font-weight:800;color:' + ACCENT + ';margin-top:2px}',
    '.rl-stat-sub{font-size:10.5px;color:' + MUTED + '}',
    '.rl-foot{margin-top:26px;padding-top:8px;border-top:1px solid ' + LINE + ';font-size:9.5px;color:' + MUTED + ';display:flex;justify-content:space-between}',
    '.rl-disc{font-size:11px;color:' + MUTED + ';line-height:1.75;margin:4px 0}',
    'img.rl-photo{max-width:100%;border:1px solid ' + LINE + ';border-radius:4px;margin:4px 6px 4px 0}'
  ].join('\n');

  // ================= 数据逻辑（保持原实现） =================
  function fmtAnswer(q, v) {
    if (v === null || v === undefined || v === '') return '—';
    switch (q.type) {
      case 'yesno': return (v === true || v === 'true' || v === '是') ? T('是') : T('否');
      case 'multi': return (Array.isArray(v) && v.length) ? v.join('、') : '—';
      case 'rating': return v + T(' 分');
      case 'number': return String(v);
      default: return String(v);
    }
  }
  // 风险标签延迟求值（与 Bug#5 同类修复）：T() 加载时求值会把高/中/低固定为加载时语言。
  const RISK = {
    high: { v: 'high', t: () => T('高'), color: ACCENT, weight: 3 },
    mid: { v: 'mid', t: () => T('中'), color: '#2E7BBF', weight: 2 },
    low: { v: 'low', t: () => T('低'), color: '#5B9BD5', weight: 1 }
  };
  function riskText(rv) { const r = RISK[rv]; return (typeof r.t === 'function') ? r.t() : r.t; }
  function computeRisk(q, v) {
    const lvl = Util.levelInfo(q.level);
    const w = lvl.weight;
    let gap = 0;
    if (q.type === 'yesno') gap = (v === false) ? 1 : 0;
    else if (q.type === 'rating') { const mx = Number(q.max) || 5, val = Number(v) || 0; gap = mx ? (1 - val / mx) : 0; }
    else if (q.type === 'number' && q.required) gap = (v === null || v === '' || v === undefined) ? 1 : 0;
    const score = Math.round((w / 3) * 65 + gap * 35);
    let riskV = 'low';
    if (lvl.v === 'critical' || score >= 72) riskV = 'high';
    else if (lvl.v === 'major' || score >= 42) riskV = 'mid';
    return { riskV: riskV, riskT: riskText(riskV), color: RISK[riskV].color, score: score };
  }
  function riskHint(q, v, detail, lvl, riskV) {
    const topic = (q.label || '').replace(/[？?。.\s]+$/g, '');
    let specific = '';
    if (q.type === 'yesno' && v === false) {
      specific = (lvl.v === 'critical') ? (T('现场核查表明「') + topic + T('」未满足基本要求，属不可接受情形。')) : (T('核查发现「') + topic + T('」回答为"否"，与标准要求不符。'));
    } else if (q.type === 'rating') {
      const mx = Number(q.max) || 5, val = Number(v) || 0;
      specific = T('该项评分 ') + val + '/' + mx + T('，管理执行存在差距，需提升至目标水平。');
    } else if (q.type === 'number' && q.required) {
      specific = T('该项为必填数据但缺失，影响数据完整性与可追溯性。');
    }
    const base = {
      high: T('存在严重合规与法律隐患，须立即采取纠正措施、暂停相关作业并上报管理层。'),
      mid: T('属重要不符合项，应在规定期限内完成整改并进行有效性验证，防止风险升级。'),
      low: T('属轻微/改进项，建议纳入持续改进计划并跟踪闭环。')
    }[riskV];
    return specific + base;
  }
  function computeGrade(s, nc, counts) {
    const hasCriticalNo = (nc || []).some((it) => it.lvl.v === 'critical' && it.q.type === 'yesno' && it.v === false);
    if (!s.max) return { grade: 'C', label: T('等级 C（需改进）'), note: T('本问卷无可评分项，无法给出完整评级，请补充评分题或是否题。') };
    if (hasCriticalNo || s.percent < 50) return { grade: 'D', label: T('等级 D（不合格）'), note: T('存在红线/严重不符合项或综合评分过低，判定为不合格：须立即纠正并安排复审验证。') };
    if (s.percent < 70 || counts.high > 0) return { grade: 'C', label: T('等级 C（需改进）'), note: T('存在重要不符合项，需在限定周期内完成整改并验证有效性。') };
    if (s.percent < 85 || counts.mid > 0) return { grade: 'B', label: T('等级 B（良好）'), note: T('整体合规状况良好，少数项需持续关注并纳入改进计划。') };
    return { grade: 'A', label: T('等级 A（优秀）'), note: T('合规状况优秀，建议保持并推动持续改进。') };
  }

  // ================= 章节构建（淡蓝线条风格 .rl-*） =================
  // 每个章节返回 { key, el } —— el 为语义化 HTML（h2/table/div），供编辑器与导出共用
  function h2(text, sub) {
    const el = Util.el('h2', { class: 'rl-h2' }, [Util.el('span', { text: text })]);
    if (sub) el.appendChild(Util.el('span', { class: 'rl-h2sub', text: sub }));
    return el;
  }
  function kv(k, v) {
    return Util.el('div', { class: 'rl-kv' }, [Util.el('span', { class: 'rl-k', text: k }), Util.el('span', { class: 'rl-v', text: (v == null || v === '') ? '—' : v })]);
  }
  function tag(text) { return Util.el('span', { class: 'rl-tag', text: text }); }
  function rule(thin) { return Util.el('hr', { class: 'rl-rule' + (thin ? ' thin' : '') }); }

  // 封面：FLA 范式——简洁标题 + 副标题 + 淡蓝分隔线 + 元数据网格（无色条）
  function buildCoverSection(model, tpl) {
    const a = model.a;
    const cfg = Object.assign({}, tpl.layout && tpl.layout.cover || {}, model.cover || {});
    const titleText = model.title || (DB.get().settings.reportTitle || T('供应商预审报告'));
    const orgLine = (cfg.showOrg !== false) ? (DB.get().settings.orgName || '') : '';
    const sub = (cfg.subtitle || '').trim();
    const f = DB.getFacility(a.facilityId);
    const el = Util.el('div', { class: 'rl-cover', 'data-sec': 'cover' });
    if (orgLine) el.appendChild(Util.el('div', { class: 'rl-sub', text: orgLine }));
    if (sub) el.appendChild(Util.el('div', { class: 'rl-sub', text: sub }));
    el.appendChild(Util.el('h1', { class: 'rl-title', text: titleText }));
    el.appendChild(rule());
    const grid = Util.el('div', { class: 'rl-meta-grid' });
    const metaItems = [
      [T('受审核方'), f ? f.name : '—'],
      [T('统一社会信用代码'), f ? (f.creditCode || '—') : '—'],
      [T('审核员'), a.auditor || '—'],
      [T('评估日期'), Util.fmtDate(a.date)],
      [T('评估状态'), a.status === 'done' ? T('已完成') : T('草稿')],
      [T('报告生成时间'), Util.fmtDateTime(Date.now())]
    ];
    metaItems.forEach((it) => grid.appendChild(Util.el('div', { class: 'rl-meta-cell' }, [
      Util.el('div', { class: 'rl-meta-k', text: it[0] }),
      Util.el('div', { class: 'rl-meta-v', text: it[1] })
    ])));
    el.appendChild(grid);
    return { key: 'cover', el: el };
  }

  function buildMetaSection(a) {
    const f = DB.getFacility(a.facilityId);
    const el = Util.el('div', { 'data-sec': 'meta' });
    el.appendChild(h2(T('报告信息')));
    const grid = Util.el('div', { class: 'rl-meta-grid' });
    [['报告编号', 'RPT-' + String(a.id).slice(-6).toUpperCase()], [T('受审核方'), f ? f.name : '—'], [T('审核员'), a.auditor || '—'], [T('评估日期'), Util.fmtDate(a.date)], [T('评估状态'), a.status === 'done' ? T('已完成') : T('草稿')]]
      .forEach((it) => grid.appendChild(Util.el('div', { class: 'rl-meta-cell' }, [
        Util.el('div', { class: 'rl-meta-k', text: it[0] }),
        Util.el('div', { class: 'rl-meta-v', text: it[1] })
      ])));
    el.appendChild(grid);
    return { key: 'meta', el: el };
  }

  function buildArchiveSection(a) {
    const f = DB.getFacility(a.facilityId);
    if (!f) return null;
    const el = Util.el('div', { 'data-sec': 'archive' });
    el.appendChild(h2(T('被审核单位档案'), T('受审核方核心标识与登记信息')));
    const t = Util.el('table', { class: 'rl-tbl' });
    t.appendChild(Util.el('thead', {}, Util.el('tr', {}, [Util.el('th', { text: T('项目') }), Util.el('th', { text: T('内容') })])));
    const tb = Util.el('tbody', {});
    const rows = [
      [T('单位名称'), f.name], [T('统一社会信用代码'), f.creditCode], [T('审核类型'), a.auditType], [T('审核日期'), Util.fmtDate(a.date)],
      [T('单位地址'), f.address], [T('联系人'), f.contact], [T('联系方式'), f.phone], [T('行业分类'), f.industry],
      [T('员工人数'), f.workers], [T('经营范围'), f.scope], [T('上次审核日期'), f.lastAuditDate ? Util.fmtDate(f.lastAuditDate) : '']
    ];
    rows.forEach((r) => tb.appendChild(Util.el('tr', {}, [Util.el('td', { text: r[0] }), Util.el('td', { text: (r[1] == null || r[1] === '') ? '—' : r[1] })])));
    t.appendChild(tb);
    el.appendChild(t);
    return { key: 'archive', el: el };
  }

  // 评估汇总：FLA 式统计条 + 章节表 + 结论（全部淡蓝线条，无色块）
  function buildSummarySection(a, qn, s, nc, counts, settings) {
    const el = Util.el('div', { 'data-sec': 'summary' });
    if (!s.max) return { key: 'summary', el: el };
    el.appendChild(h2(T('评估情况汇总'), T('评分、风险等级与各章节合规表现')));

    const stat = Util.el('div', { class: 'rl-stat' });
    stat.appendChild(Util.el('div', { class: 'rl-stat-item' }, [
      Util.el('div', { class: 'rl-stat-k', text: T('综合合规评分') }),
      Util.el('div', { class: 'rl-stat-v', text: s.percent + '%' }),
      Util.el('div', { class: 'rl-stat-sub', text: s.total + ' / ' + s.max })
    ]));
    stat.appendChild(Util.el('div', { class: 'rl-stat-item' }, [
      Util.el('div', { class: 'rl-stat-k', text: T('问题点总数') }),
      Util.el('div', { class: 'rl-stat-v', text: String(nc.length) }),
      Util.el('div', { class: 'rl-stat-sub', text: T('项需关注') })
    ]));
    stat.appendChild(Util.el('div', { class: 'rl-stat-item' }, [
      Util.el('div', { class: 'rl-stat-k', text: T('风险分布') }),
      Util.el('div', { class: 'rl-stat-v', style: 'font-size:14px', text: T('高 ') + counts.high + ' · ' + T('中 ') + counts.mid + ' · ' + T('低 ') + counts.low }),
      Util.el('div', { class: 'rl-stat-sub', text: T('按严重程度分类') })
    ]));
    el.appendChild(stat);

    const mt = Util.el('table', { class: 'rl-tbl' });
    mt.appendChild(Util.el('thead', {}, Util.el('tr', {}, [Util.el('th', { text: T('审核章节') }), Util.el('th', { text: T('得分') }), Util.el('th', { text: T('满分') }), Util.el('th', { text: T('占比') })])));
    const tb = Util.el('tbody', {});
    s.byModule.forEach((m2) => tb.appendChild(Util.el('tr', {}, [Util.el('td', { text: m2.title }), Util.el('td', { text: String(m2.score) }), Util.el('td', { text: String(m2.max) }), Util.el('td', { text: m2.percent + '%' })])));
    mt.appendChild(tb); el.appendChild(mt);

    if (a.risk && a.risk.level) {
      const rk = Util.riskLevelInfo(a.risk.level);
      const box = Util.el('div', { class: 'rl-box' });
      box.appendChild(Util.el('div', {}, [Util.el('span', { style: 'font-weight:800;color:' + ACCENT, text: T('自定义风险等级') }), tag(rk.t)]));
      if (a.risk.desc) box.appendChild(kv(T('风险说明'), a.risk.desc));
      if (a.risk.action) box.appendChild(kv(T('整改建议'), a.risk.action));
      el.appendChild(box);
    }

    if (settings.showGrade) {
      const g = computeGrade(s, nc, counts);
      el.appendChild(h2(T('审核结论'), T('综合评级与判定依据')));
      el.appendChild(Util.el('div', { class: 'rl-grade' }, [
        Util.el('div', { class: 'rl-grade-letter', text: g.grade }),
        Util.el('div', {}, [
          Util.el('div', { class: 'rl-grade-label', text: g.label }),
          Util.el('div', { class: 'rl-grade-note', text: g.note })
        ])
      ]));
    }
    return { key: 'summary', el: el };
  }

  // 问题点明细：FLA 式结构化发现（淡蓝左边线分区：编号/章节/等级/问题/数据/建议）
  function buildDetailSection(a, qn, modules, nums, settings) {
    const el = Util.el('div', { 'data-sec': 'detail' });
    el.appendChild(h2(T('问题点明细与整改建议'), T('按风险等级降序排列，含数据风险评级与整改建议')));
    if (modules._nc && modules._nc.length) {
      modules._nc.forEach((it, i) => {
        const card = Util.el('div', { class: 'rl-find' });
        const head = Util.el('div', { class: 'rl-find-head' }, [
          Util.el('span', { class: 'rl-find-no', text: '#' + (i + 1) }),
          Util.el('span', { text: it.mod.title }),
          tag(it.lvl.t),
          tag(it.rk.riskT + ' · ' + it.rk.score)
        ]);
        card.appendChild(head);
        card.appendChild(Util.el('div', { class: 'rl-find-q', text: it.q.label }));
        card.appendChild(kv(T('当前数据'), it.detail));
        card.appendChild(kv(T('整改建议'), it.hint));
        el.appendChild(card);
      });
    } else {
      el.appendChild(Util.el('div', { class: 'rl-box', style: 'color:' + ACCENT, text: T('未发现不符合项 / 待改进项（基于当前等级与回答）。') }));
    }
    el.appendChild(h2(T('审核明细（答案对照）'), T('标准明确 · 答案对照 · 评分分级')));
    modules.list.forEach((mod) => {
      el.appendChild(Util.el('h3', { class: 'rl-h3', text: mod.title }));
      const t = Util.el('table', { class: 'rl-tbl' });
      t.appendChild(Util.el('thead', {}, Util.el('tr', {}, [
        Util.el('th', { text: T('题目 / 判定依据') }), Util.el('th', { text: T('等级') }), Util.el('th', { text: T('回答') }), Util.el('th', { text: T('审核员评论') })
      ])));
      const tb = Util.el('tbody', {});
      (mod.questions || []).forEach((q) => {
        const ans = fmtAnswer(q, a.answers[q.id]);
        const qCell = Util.el('td', {}, [
          Util.el('div', {}, [Util.el('span', { style: 'color:' + MUTED + ';font-weight:700;margin-right:4px', text: (nums[q.id] || '') }), document.createTextNode(q.label)]),
          (q.help ? Util.el('div', { style: 'font-size:10.5px;color:' + MUTED + ';margin-top:2px', text: T('判定依据：') + q.help }) : null)
        ]);
        const ansTd = Util.el('td', { style: 'font-weight:600', text: ans });
        if (q.type === 'yesno') ansTd.style.color = (ans === T('否')) ? ACCENT : INK;
        const cmtObj = (a.comments && a.comments[q.id]); const cmtText = cmtObj ? (cmtObj.text || '') : '';
        const cmtImg = (cmtObj && Array.isArray(cmtObj.images) && cmtObj.images.length) ? (T(' [图片×') + cmtObj.images.length + ']') : '';
        tb.appendChild(Util.el('tr', {}, [qCell, Util.el('td', { text: Util.levelInfo(q.level).t }), ansTd, Util.el('td', { style: 'color:' + MUTED, text: (cmtText + cmtImg) || '—' })]));
      });
      t.appendChild(tb); el.appendChild(t);
    });
    return { key: 'detail', el: el };
  }

  function buildProcessSection(a) {
    if (!a.process) return null;
    const el = Util.el('div', { 'data-sec': 'process' });
    el.appendChild(h2(T('现场预审流程'), T('按环节顺序记录审核过程与事实（无评级、仅事实）')));
    const STAGE_DEFS = { opening: T('开始会议'), walk: T('现场走访'), docs: T('文件查看'), interview: T('员工访谈'), closing: T('末次会议') };
    (a.process.order || []).forEach((key, idx) => {
      if (key.indexOf('custom_') === 0 && !a.process.custom[key]) return;
      const isCustom = key.indexOf('custom_') === 0;
      const title = isCustom ? ((a.process.custom[key] && a.process.custom[key].title) || T('自定义环节')) : (STAGE_DEFS[key] || T('自定义环节'));
      el.appendChild(Util.el('h3', { class: 'rl-h3', text: (idx + 1) + '. ' + title }));
      const box = Util.el('div', { class: 'rl-box', style: 'border-style:solid' });
      const p = a.process;
      if (key === 'opening' && p.opening) { const s = p.opening; box.appendChild(kv(T('会议时间'), s.time)); box.appendChild(kv(T('会议地点'), s.place)); box.appendChild(kv(T('参与人员'), s.participants)); box.appendChild(kv(T('会议议程'), s.agenda)); }
      else if (key === 'walk' && p.walk) { const s = p.walk; box.appendChild(kv(T('走访区域'), s.areas)); box.appendChild(kv(T('走访路线'), s.route)); box.appendChild(kv(T('观察情况'), s.observations)); if ((s.photos || []).length) s.photos.forEach((src) => box.appendChild(Util.el('img', { src: src, class: 'rl-photo', style: 'width:120px;height:80px;object-fit:cover' }))); }
      else if (key === 'docs' && p.docs) { const s = p.docs; if ((s.items || []).length) { const t = Util.el('table', { class: 'rl-tbl' }); t.appendChild(Util.el('thead', {}, Util.el('tr', {}, [Util.el('th', { text: T('文件名称') }), Util.el('th', { text: T('完整性') }), Util.el('th', { text: T('合规性') }), Util.el('th', { text: T('备注') })]))); const tb = Util.el('tbody', {}); s.items.forEach((it) => tb.appendChild(Util.el('tr', {}, [Util.el('td', { text: it.name || '—' }), Util.el('td', { text: it.complete === false ? T('不完整') : T('完整') }), Util.el('td', { text: it.compliant === false ? T('不合规') : T('合规') }), Util.el('td', { text: it.note || '—' })]))); t.appendChild(tb); box.appendChild(t); } box.appendChild(kv(T('整体说明'), s.notes)); }
      else if (key === 'interview' && p.interview) { const s = p.interview; if ((s.items || []).length) { const t = Util.el('table', { class: 'rl-tbl' }); t.appendChild(Util.el('thead', {}, Util.el('tr', {}, [Util.el('th', { text: T('访谈对象') }), Util.el('th', { text: T('访谈方式') }), Util.el('th', { text: T('访谈摘要') }), Util.el('th', { text: T('主要发现') })]))); const tb = Util.el('tbody', {}); s.items.forEach((it) => tb.appendChild(Util.el('tr', {}, [Util.el('td', { text: it.who || '—' }), Util.el('td', { text: it.method || '—' }), Util.el('td', { text: it.summary || '—' }), Util.el('td', { text: it.findings || '—' })]))); t.appendChild(tb); box.appendChild(t); } box.appendChild(kv(T('整体说明'), s.notes)); }
      else if (key === 'closing' && p.closing) { const s = p.closing; box.appendChild(kv(T('会议时间'), s.time)); box.appendChild(kv(T('参与人员'), s.participants)); box.appendChild(kv(T('审核初步结论'), s.conclusion)); box.appendChild(kv(T('改进建议沟通'), s.suggestion)); }
      else if (isCustom && p.custom[key]) { box.appendChild(kv(T('环节记录'), p.custom[key].notes)); }
      el.appendChild(box);
    });
    return { key: 'process', el: el };
  }

  function buildEvidenceSection(a, atts) {
    if (!atts || !atts.length) return null;
    const el = Util.el('div', { 'data-sec': 'evidence' });
    el.appendChild(h2(T('证据材料'), T('现场取证照片 / 文件')));
    atts.forEach((att) => {
      el.appendChild(Util.el('img', { src: att.dataUrl, class: 'rl-photo', style: 'width:220px;height:150px;object-fit:cover' }));
      if (att.caption) el.appendChild(Util.el('div', { style: 'font-size:11px;color:' + MUTED + ';margin:0 0 8px', text: att.caption }));
    });
    return { key: 'evidence', el: el };
  }

  function buildDisclaimerSection() {
    const el = Util.el('div', { 'data-sec': 'disclaimer' });
    el.appendChild(h2(T('报告声明 / Report Disclaimer')));
    const zh = '此文件仅供内部参考，无任何结果评级且不构成任何法律意见，请勿与任何客户或审核三方进行分享。本报告仅概述约定日期对工厂进行审核中所发现/收集到的调查发现及其他适用信息，不包括相关产品或服务供应链中可能使用的其他地点。由于采用抽样审核，对在任何其他日期可能发现的与指定工厂生产相关的任何不合规问题不承担任何责任。';
    const en = 'This report contains privileged or confidential information and cannot be distributed without any consent. This report contains information based on a defined scope informed by buyer requirements gathered through a sampling of: factory provided documents, worker and management interviews, and/or visual observations. All information is based on conditions during the specific assessment date(s), and does not guarantee compliance to law, industry standards, or client requirements.';
    el.appendChild(Util.el('div', { class: 'rl-disc', text: zh }));
    el.appendChild(Util.el('div', { class: 'rl-disc', text: en }));
    return { key: 'disclaimer', el: el };
  }

  function computeNC(a, qn, modules) {
    const nc = [];
    modules.forEach((mod) => (mod.questions || []).forEach((q) => {
      const v = a.answers[q.id]; const lvl = Util.levelInfo(q.level); let detail = null;
      if (q.type === 'yesno' && v === false) detail = T('回答：否');
      else if (q.type === 'rating') { const mx = Number(q.max) || 5, val = Number(v) || 0; if (val < mx) detail = T('评分 ') + val + ' / ' + mx; }
      else if (q.type === 'number' && q.required && (v === null || v === '' || v === undefined)) detail = T('必填未填');
      if (detail) { const rk = computeRisk(q, v); nc.push({ mod: mod, q: q, lvl: lvl, detail: detail, rk: rk, hint: riskHint(q, v, detail, lvl, rk.riskV), v: v }); }
    }));
    nc.sort((x, y) => (RISK[y.rk.riskV].weight - RISK[x.rk.riskV].weight) || (y.lvl.weight - x.lvl.weight));
    return nc;
  }

  // 构建单个评估的章节数组（契约保持：{key, el}，key 命中 pageMap）
  Report.buildReportSections = function (model, tpl) {
    const a = model.a;
    const qn = DB.getQuestionnaire(a.questionnaireId);
    const settings = DB.get().settings;
    const rs = settings.report || {};
    const showGrade = rs.showGrade !== false, showProcess = !!rs.showProcess;
    const modulesAll = (qn && qn.modules) || [];
    const modules = model.onlyModule ? [model.onlyModule] : modulesAll;
    // 题目编号：优先用户自定义（q.no），未设置时按顺序自动编号（Q1/Q2…）
    const nums = {}; let _n = 0; modules.forEach((m) => (m.questions || []).forEach((q) => { nums[q.id] = (q.no && String(q.no).trim()) ? String(q.no).trim() : ('Q' + (++_n)); }));
    const s = DB.computeScore(qn, a.answers, modules);
    const nc = computeNC(a, qn, modules);
    const counts = { high: 0, mid: 0, low: 0 }; nc.forEach((it) => counts[it.rk.riskV]++);
    const full = { list: modules, _nc: nc };

    const out = [];
    out.push(buildCoverSection(model, tpl));
    out.push(buildMetaSection(a));
    const arch = buildArchiveSection(a); if (arch) out.push(arch);
    out.push(buildSummarySection(a, qn, s, nc, counts, { showGrade: showGrade }));
    out.push(buildDetailSection(a, qn, full, nums, {}));
    if (showProcess) { const ps = buildProcessSection(a); if (ps) out.push(ps); }
    const ev = buildEvidenceSection(a, model.attachments); if (ev) out.push(ev);
    out.push(buildDisclaimerSection());
    return out;
  };

  // 兼容旧接口：单评估整体 DOM
  Report.buildReportEl = function (a, opts) {
    opts = opts || {};
    const tpl = getActiveTpl();
    const sections = Report.buildReportSections({ a: a, attachments: opts.attachments || [], title: opts.title || '', cover: opts.cover || {} }, tpl);
    const wrap = Util.el('div', { class: 'rl-doc' });
    sections.forEach((s) => wrap.appendChild(s.el));
    return wrap;
  };

  // ================= Excel（保持原实现） =================
  function typeName(v) { return { text: T('文本'), textarea: T('长文本'), number: T('数字'), date: T('日期'), yesno: T('是否'), single: T('单选'), multi: T('多选'), rating: T('评分') }[v] || v; }

  Report.getNCSummary = function (list) {
    const out = [];
    (list || []).forEach((a) => {
      const f = DB.getFacility(a.facilityId); const qn = DB.getQuestionnaire(a.questionnaireId); if (!qn) return;
      qn.modules.forEach((mod) => (mod.questions || []).forEach((q) => {
        const v = a.answers[q.id]; const lvl = Util.levelInfo(q.level); let detail = null;
        if (q.type === 'yesno' && v === false) detail = T('回答：否');
        else if (q.type === 'rating') { const mx = Number(q.max) || 5; const val = Number(v) || 0; if (val < mx) detail = T('评分 ') + val + ' / ' + mx; }
        else if (q.type === 'number' && q.required && (v === null || v === '' || v === undefined)) detail = T('必填未填');
        if (detail) { const rk = computeRisk(q, v); const cobj = (a.comments && a.comments[q.id]); const ctext = cobj ? (cobj.text || '') : ''; const hasImg = cobj && Array.isArray(cobj.images) && cobj.images.length ? cobj.images.length : 0; out.push({ facility: f ? f.name : T('已删除'), qnTitle: qn.title, module: mod.title, label: q.label, levelV: lvl.v, levelT: lvl.t, detail: detail, riskV: rk.riskV, riskT: rk.riskT, riskColor: rk.color, riskScore: rk.score, hint: riskHint(q, v, detail, lvl, rk.riskV), commentText: ctext, hasImages: hasImg }); }
      }));
    });
    out.sort((x, y) => (RISK[y.riskV].weight - RISK[x.riskV].weight) || (Util.levelInfo(y.levelV).weight - Util.levelInfo(x.levelV).weight));
    return out;
  };

  async function exportExcel(ids) {
    const state = DB.get(); let list = state.assessments;
    if (ids && ids.length) list = state.assessments.filter((a) => ids.includes(a.id));
    if (!list.length) { Util.toast(T('没有可导出的评估'), 'err'); return; }
    try { await ReportEngine.ensureLibs(['xlsx']); } catch (e) { Util.toast(T('Excel 组件加载失败：') + (e && e.message), 'err'); return; }
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const XLSX = window.XLSX; const wb = XLSX.utils.book_new();
    const facFields = DB.getFacilityFields();
    const sumHeader = facFields.map((ff) => ff.label).concat([T('问卷模板'), T('审核员'), T('评估日期'), T('状态'), T('综合评分%'), T('得分'), T('满分'), T('附件数'), T('版本数')]);
    const sumRows = list.map((a) => { const f = DB.getFacility(a.facilityId); const qn = DB.getQuestionnaire(a.questionnaireId); const s = DB.computeScore(qn, a.answers); const fvals = facFields.map((ff) => (f ? (f[ff.key] != null ? f[ff.key] : '') : T('已删除'))); return fvals.concat([qn ? qn.title : T('已删除'), a.auditor || '', Util.fmtDate(a.date), a.status === 'done' ? T('已完成') : T('草稿'), s.max ? s.percent : '', s.max ? s.total : '', s.max ? s.max : '', (a.attachments || []).length, (a.versions || []).length]); });
    const sumWs = XLSX.utils.aoa_to_sheet([sumHeader].concat(sumRows)); sumWs['!cols'] = sumHeader.map(() => ({ wch: 16 })); XLSX.utils.book_append_sheet(wb, sumWs, T('评估汇总'));
    const detHeader = [T('评估ID'), T('供应商'), T('问卷'), T('章节'), T('题目'), T('等级'), T('题型'), T('回答'), T('审核员评论'), T('合规说明')];
    const detRows = [];
    list.forEach((a) => { const f = DB.getFacility(a.facilityId); const qn = DB.getQuestionnaire(a.questionnaireId); if (!qn) return; qn.modules.forEach((mod) => (mod.questions || []).forEach((q) => { const cobj = (a.comments && a.comments[q.id]); const ctext = cobj ? (cobj.text || '') : ''; const cimg = (cobj && Array.isArray(cobj.images) && cobj.images.length) ? (T(' [图片×') + cobj.images.length + ']') : ''; detRows.push([a.id, f ? f.name : T('已删除'), qn.title, mod.title, q.label, Util.levelInfo(q.level).t, typeName(q.type), fmtAnswer(q, a.answers[q.id]), (ctext + cimg) || '', q.help || '']); })); });
    const detWs = XLSX.utils.aoa_to_sheet([detHeader].concat(detRows)); detWs['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 28 }, { wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 8 }, { wch: 22 }, { wch: 28 }, { wch: 30 }]; XLSX.utils.book_append_sheet(wb, detWs, T('题目明细'));
    const ncHeader = [T('供应商'), T('问卷'), T('章节'), T('题目'), T('等级'), T('情况'), T('风险等级'), T('风险指数'), T('风险提示'), T('审核员评论')];
    const ncRows = Report.getNCSummary(list).map((r) => [r.facility, r.qnTitle, r.module, r.label, r.levelT, r.detail, r.riskT, r.riskScore, r.hint, (r.commentText || '') + (r.hasImages ? T(' [图片×') + r.hasImages + ']' : '')]);
    const ncWs = XLSX.utils.aoa_to_sheet([ncHeader].concat(ncRows)); ncWs['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 52 }, { wch: 28 }]; XLSX.utils.book_append_sheet(wb, ncWs, T('不符合项汇总'));
    const facHeader = [T('供应商等级')].concat(facFields.map((ff) => ff.label));
    const facRows = state.facilities.map((f) => [f.tier || ''].concat(facFields.map((ff) => { const v = f[ff.key]; return (v == null) ? '' : v; })));
    const facWs = XLSX.utils.aoa_to_sheet([facHeader].concat(facRows)); facWs['!cols'] = [{ wch: 18 }].concat(facFields.map(() => ({ wch: 16 }))); XLSX.utils.book_append_sheet(wb, facWs, T('供应商信息'));
    const fname = T('供应商预审报告数据_') + Util.fmtDate(Date.now()) + '.xlsx'; XLSX.writeFile(wb, fname); Util.toast(T('Excel 已导出：') + fname, 'ok');
  }

  async function exportNCExcel(ids) {
    const state = DB.get(); let list = state.assessments;
    if (ids && ids.length) list = state.assessments.filter((a) => ids.includes(a.id));
    if (!list.length) { Util.toast(T('没有可导出的评估'), 'err'); return; }
    try { await ReportEngine.ensureLibs(['xlsx']); } catch (e) { Util.toast(T('Excel 组件加载失败：') + (e && e.message), 'err'); return; }
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const rows = Report.getNCSummary(list); if (!rows.length) { Util.toast(T('所选评估未发现不符合项'), 'err'); return; }
    const XLSX = window.XLSX; const wb = XLSX.utils.book_new();
    const header = [T('供应商'), T('问卷'), T('章节'), T('题目'), T('等级'), T('情况'), T('风险等级'), T('风险指数'), T('风险提示'), T('审核员评论')];
    const data = rows.map((r) => [r.facility, r.qnTitle, r.module, r.label, r.levelT, r.detail, r.riskT, r.riskScore, r.hint, (r.commentText || '') + (r.hasImages ? T(' [图片×') + r.hasImages + ']' : '')]);
    const ws = XLSX.utils.aoa_to_sheet([header].concat(data)); ws['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 52 }, { wch: 32 }]; XLSX.utils.book_append_sheet(wb, ws, T('不符合项汇总'));
    const fname = T('不符合项汇总_') + Util.fmtDate(Date.now()) + '.xlsx'; XLSX.writeFile(wb, fname); Util.toast(T('不符合项汇总已导出：') + fname, 'ok');
  }

  // ================= 模板选择（取消固定化：用户可自由选择/创建） =================
  function defaultTpl() { return ReportTpl.default(); }
  function getActiveTpl() {
    const id = DB.get().settings.activeReportTemplate;
    if (id && global.TemplateCenter) {
      const tc = TemplateCenter.get(id);
      if (tc) return mergeTpl(tc);
    }
    return defaultTpl();
  }
  function setActiveTpl(id) {
    if (id && global.TemplateCenter && TemplateCenter.get(id)) {
      DB.get().settings.activeReportTemplate = id;
      DB.persist();
    } else {
      delete DB.get().settings.activeReportTemplate;
      DB.persist();
    }
  }
  // 模板与默认版式合并：模板缺省字段回落到默认版式
  function mergeTpl(tc) {
    const base = defaultTpl();
    const tpl = Object.assign({}, base, tc);
    tpl.layout = Object.assign({}, base.layout, tc.layout || {});
    tpl.layout.cover = Object.assign({}, (base.layout && base.layout.cover) || {}, (tc.layout && tc.layout.cover) || {});
    tpl.style = Object.assign({}, base.style, tc.style || {});
    tpl.settings = Object.assign({}, base.settings, tc.settings || {});
    return tpl;
  }
  Report.getActiveTpl = getActiveTpl;
  Report.setActiveTpl = setActiveTpl;

  // ================= 可编辑 HTML 文档构建 =================
  function buildEditableDoc(list, tpl, title) {
    const doc = Util.el('div', { class: 'rl-doc' });
    list.forEach((a, ai) => {
      const atts = a._atts || [];
      const qn = DB.getQuestionnaire(a.questionnaireId);
      const t2 = title || (qn ? qn.title : (DB.get().settings.reportTitle || T('供应商预审报告')));
      const secs = Report.buildReportSections({ a: a, attachments: atts, title: t2, cover: (tpl.layout && tpl.layout.cover) || {} }, tpl);
      secs.forEach((s) => doc.appendChild(s.el));
      // 模板审核框架章节
      const auditSec = buildTemplateAuditSection(tpl);
      if (auditSec && ai === 0) doc.appendChild(auditSec.el);
      if (ai < list.length - 1) doc.appendChild(rule());
    });
    // 页脚
    const f0 = DB.getFacility(list[0].facilityId);
    doc.appendChild(Util.el('div', { class: 'rl-foot' }, [
      Util.el('span', { text: (f0 ? f0.name : '') + ' | ' + (title || T('供应商预审报告')) }),
      Util.el('span', { text: Util.fmtDate(Date.now()) })
    ]));
    return doc;
  }

  function buildTemplateAuditSection(tpl) {
    const dims = (tpl && tpl.audit && tpl.audit.dimensions) || [];
    if (!dims.length) return null;
    const el = Util.el('div', { 'data-sec': 'audit' });
    el.appendChild(h2(T('审核框架（模板维度与检查项）'), T('由所选审核模板定义，含评分规则')));
    dims.forEach((d, di) => {
      el.appendChild(Util.el('h3', { class: 'rl-h3', text: (di + 1) + '. ' + (d.name || T('未命名')) + '（' + T('权重 ') + (d.weight != null ? d.weight : '-') + '%）' }));
      const t = Util.el('table', { class: 'rl-tbl' });
      t.appendChild(Util.el('thead', {}, Util.el('tr', {}, [Util.el('th', { text: T('检查项') }), Util.el('th', { text: T('评分方式') }), Util.el('th', { text: T('说明') })])));
      const tb = Util.el('tbody', {});
      (d.items || []).forEach((it) => {
        tb.appendChild(Util.el('tr', {}, [
          Util.el('td', { text: it.name || T('未命名') }),
          Util.el('td', { text: TemplateCenter.scoringLabel(it.scoring) }),
          Util.el('td', { style: 'color:' + MUTED, text: it.desc || '—' })
        ]));
      });
      t.appendChild(tb); el.appendChild(t);
    });
    return { key: 'audit', el: el };
  }

  // ================= 三格式导出 =================
  function safeName(t) { return (t || T('供应商预审报告')).replace(/[\\/:*?"<>|\s]+/g, '_'); }
  function download(blob, fname) {
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement('a');
    aEl.href = url; aEl.download = fname;
    document.body.appendChild(aEl); aEl.click();
    setTimeout(() => { document.body.removeChild(aEl); URL.revokeObjectURL(url); }, 400);
  }
  // SUP-032：导出文件统一入口。安卓 APK 内保存到本地「Documents/供应商预审平台/报告」，
  // 并返回保存路径（可本地浏览）；Web/PC 保持浏览器下载。返回 Promise。
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }
  function downloadFile(blob, fname) {
    if (Util.isNative && Util.isNative()) {
      // 安卓：保存到本地文件夹，可被文件管理器浏览
      return blobToDataUrl(blob).then((dataUrl) => {
        return Util.androidSaveFile(dataUrl, fname, '报告').then((r) => {
          if (!r.saved) download(blob, fname);
          return r;
        });
      }).catch(() => { download(blob, fname); return { saved: false }; });
    }
    download(blob, fname);
    return Promise.resolve({ saved: true, downloaded: true });
  }
  Report.downloadFile = downloadFile;

  // HTML 导出：独立网页文件（内嵌样式，浏览器直接打开）
  Report.toHTMLFile = function (title, rootEl) {
    const html = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + Util.esc(title) + '</title>\n<style>\n' + EXPORT_CSS + '\n</style>\n</head>\n<body>\n<div class="rl-doc">\n' + rootEl.innerHTML + '\n</div>\n</body>\n</html>';
    const fname = safeName(title) + '_' + Util.fmtDate(Date.now()) + '.html';
    downloadFile(new Blob([html], { type: 'text/html;charset=utf-8' }), fname);
    return fname;
  };

  // Word 导出：application/msword Blob（.doc，保留全部样式，可二次编辑）
  Report.toWordFile = function (title, rootEl) {
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">\n<head>\n<meta charset="utf-8">\n<title>' + Util.esc(title) + '</title>\n<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->\n<style>\n@page{size:A4;margin:2cm 1.8cm}\n' + EXPORT_CSS + '\n</style>\n</head>\n<body>\n<div class="rl-doc">\n' + rootEl.innerHTML + '\n</div>\n</body>\n</html>';
    const fname = safeName(title) + '_' + Util.fmtDate(Date.now()) + '.doc';
    downloadFile(new Blob(['﻿', html], { type: 'application/msword' }), fname);
    return fname;
  };

  // PDF 导出：html2canvas 光栅化编辑后内容 → jsPDF 分页（所见即所得）
  Report.toPdfFile = function (title, rootEl) {
    return ReportEngine.ensureLibs(['jspdf', 'html2canvas']).then(() => {
      Util.toast(T('正在生成 PDF…'));
      // 离屏渲染（固定宽度 760px，避免编辑器缩放影响）
      const stage = Util.el('div', { style: 'position:fixed;left:-10000px;top:0;width:840px;background:#fff;padding:32px 40px;z-index:-1' });
      const styleEl = document.createElement('style');
      styleEl.textContent = EXPORT_CSS;
      stage.appendChild(styleEl);
      const clone = rootEl.cloneNode(true);
      clone.style.maxWidth = '760px';
      stage.appendChild(clone);
      document.body.appendChild(stage);
      const A4W = 794, A4H = 1123; // 96dpi 像素
      return global.html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false }).then((canvas) => {
        document.body.removeChild(stage);
        const doc = new global.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const imgW = canvas.width, imgH = canvas.height;
        // 缩放比例：CSS 像素 → pt
        const ratio = pageW / (imgW / 2); // scale=2
        const pageCanvasH = Math.floor((pageH / ratio) * 2); // 每页对应的 canvas 像素高
        let y = 0, pageIdx = 0;
        while (y < imgH) {
          const sliceH = Math.min(pageCanvasH, imgH - y);
          const pc = document.createElement('canvas');
          pc.width = imgW; pc.height = sliceH;
          const ctx = pc.getContext('2d');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, imgW, sliceH);
          ctx.drawImage(canvas, 0, y, imgW, sliceH, 0, 0, imgW, sliceH);
          const data = pc.toDataURL('image/jpeg', 0.92);
          if (pageIdx > 0) doc.addPage();
          doc.addImage(data, 'JPEG', 0, 0, pageW, (sliceH / 2) * ratio);
          y += sliceH; pageIdx++;
        }
        const fname = safeName(title) + '_' + Util.fmtDate(Date.now()) + '.pdf';
        // SUP-032：安卓端保存到本地文件夹；Web/PC 浏览器下载
        if (Util.isNative && Util.isNative() && typeof doc.output === 'function') {
          const blob = doc.output('blob');
          return downloadFile(blob, fname).then(() => ({ fname: fname, pages: pageIdx, saved: true }));
        }
        doc.save(fname);
        return { fname: fname, pages: pageIdx };
      }).catch((e) => { if (stage.parentNode) document.body.removeChild(stage); throw e; });
    });
  };

  // ================= HTML 预览编辑器 =================
  function openReportEditor(ids, templateId) {
    const state = DB.get(); let list = state.assessments;
    if (ids && ids.length) list = state.assessments.filter((a) => ids.includes(a.id));
    if (!list.length) { Util.toast(T('没有可导出的评估'), 'err'); return; }
    list = list.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (templateId) setActiveTpl(templateId);
    Util.toast(T('正在准备预览…'));
    Promise.all(list.map((a) => DB.getAttachments(a.id).then((atts) => { a._atts = atts; }))).then(() => {
      let curTpl = getActiveTpl();
      const title0 = (DB.get().settings.reportTitle || T('供应商预审报告'));

      // ---------- 工具栏 ----------
      const edArea = Util.el('div', { class: 'rle-area rl-doc', contenteditable: 'true', spellcheck: 'false' });
      function cmd(c, v) { edArea.focus(); try { document.execCommand(c, false, v == null ? null : v); } catch (e) {} }
      function tbBtn(label, title, onclick) {
        const b = Util.el('button', { class: 'rle-btn', type: 'button', title: title, text: label });
        b.addEventListener('mousedown', (e) => e.preventDefault()); // 保持选区
        b.addEventListener('click', onclick);
        return b;
      }
      const toolbar = Util.el('div', { class: 'rle-toolbar' }, [
        tbBtn('B', T('加粗'), () => cmd('bold')),
        tbBtn('I', T('斜体'), () => cmd('italic')),
        tbBtn('U', T('下划线'), () => cmd('underline')),
        tbBtn('S', T('删除线'), () => cmd('strikeThrough')),
        Util.el('span', { class: 'rle-sep' }),
        tbBtn('H1', T('一级标题'), () => cmd('formatBlock', '<h1>')),
        tbBtn('H2', T('二级标题'), () => cmd('formatBlock', '<h2>')),
        tbBtn('H3', T('三级标题'), () => cmd('formatBlock', '<h3>')),
        tbBtn('¶', T('正文段落'), () => cmd('formatBlock', '<p>')),
        Util.el('span', { class: 'rle-sep' }),
        tbBtn('A+', T('增大字号'), () => stepFont(1)),
        tbBtn('A-', T('减小字号'), () => stepFont(-1)),
        Util.el('span', { class: 'rle-sep' }),
        tbBtn('≡←', T('左对齐'), () => cmd('justifyLeft')),
        tbBtn('≡中', T('居中'), () => cmd('justifyCenter')),
        tbBtn('≡→', T('右对齐'), () => cmd('justifyRight')),
        Util.el('span', { class: 'rle-sep' }),
        tbBtn('•列表', T('无序列表'), () => cmd('insertUnorderedList')),
        tbBtn('1.列表', T('有序列表'), () => cmd('insertOrderedList')),
        tbBtn('⊞', T('插入表格'), insertTable),
        tbBtn('hr', T('插入分割线'), () => cmd('insertHorizontalRule')),
        Util.el('span', { class: 'rle-sep' }),
        tbBtn('↶', T('撤销'), () => cmd('undo')),
        tbBtn('↷', T('重做'), () => cmd('redo')),
        tbBtn('✕块', T('删除当前区块'), removeBlock)
      ]);
      // 文字颜色
      const colorInp = Util.el('input', { type: 'color', class: 'rle-color', value: ACCENT, title: T('文字颜色') });
      colorInp.addEventListener('input', () => cmd('foreColor', colorInp.value));
      toolbar.appendChild(colorInp);

      function stepFont(d) {
        const sel = global.getSelection();
        if (!sel || !sel.rangeCount) return;
        // execCommand fontSize 仅支持 1-7，用 span 包裝实现自由字号
        const size = (d > 0) ? '1.2em' : '0.85em';
        cmd('fontSize', 4);
        edArea.querySelectorAll('font[size="4"]').forEach((f) => {
          const span = document.createElement('span');
          span.style.fontSize = size;
          span.innerHTML = f.innerHTML;
          f.parentNode.replaceChild(span, f);
        });
      }
      function insertTable() {
        cmd('insertHTML', '<table class="rl-tbl"><thead><tr><th>' + T('列 1') + '</th><th>' + T('列 2') + '</th></tr></thead><tbody><tr><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td></tr></tbody></table><p><br></p>');
      }
      function removeBlock() {
        const sel = global.getSelection();
        if (!sel || !sel.rangeCount) return;
        let node = sel.anchorNode;
        while (node && node !== edArea && !(node.nodeType === 1 && node.parentNode === edArea)) node = node.parentNode;
        if (node && node !== edArea && node.parentNode === edArea) node.parentNode.removeChild(node);
        else Util.toast(T('请将光标放在要删除的顶层区块内'), 'err');
      }

      // ---------- 区块拖拽排序 ----------
      function enableDrag() {
        Array.from(edArea.children).forEach((child) => {
          if (child.classList.contains('rl-foot')) return;
          child.setAttribute('draggable', 'true');
          child.classList.add('rle-block');
        });
      }
      edArea.addEventListener('dragstart', (e) => {
        const b = e.target.closest && e.target.closest('.rle-block');
        if (b) { e.dataTransfer.setData('text/plain', ''); edArea._dragEl = b; b.classList.add('rle-dragging'); }
      });
      edArea.addEventListener('dragend', () => { if (edArea._dragEl) edArea._dragEl.classList.remove('rle-dragging'); edArea._dragEl = null; edArea.querySelectorAll('.rle-dropmark').forEach((x) => x.classList.remove('rle-dropmark')); });
      edArea.addEventListener('dragover', (e) => {
        if (!edArea._dragEl) return;
        e.preventDefault();
        const over = e.target.closest && e.target.closest('.rle-block');
        edArea.querySelectorAll('.rle-dropmark').forEach((x) => x.classList.remove('rle-dropmark'));
        if (over && over !== edArea._dragEl) {
          over.classList.add('rle-dropmark');
          const rect = over.getBoundingClientRect();
          const after = (e.clientY - rect.top) > rect.height / 2;
          if (after) over.parentNode.insertBefore(edArea._dragEl, over.nextSibling);
          else over.parentNode.insertBefore(edArea._dragEl, over);
        }
      });

      // ---------- 布局：左设置 / 右编辑 ----------
      const titleInput = Util.el('input', { type: 'text', class: 'inp', style: 'width:100%;font-size:14px;font-weight:600', value: title0 });
      const tplSel = Util.el('select', { class: 'inp' });
      function refillTplSel() {
        tplSel.innerHTML = '';
        tplSel.appendChild(Util.el('option', { value: '', text: T('默认版式（淡蓝线条）') }));
        if (global.TemplateCenter) TemplateCenter.list().forEach((t) => tplSel.appendChild(Util.el('option', { value: t.id, text: t.name + '（' + TemplateCenter.typeLabel(t.type) + '）' })));
        tplSel.value = DB.get().settings.activeReportTemplate || '';
      }
      refillTplSel();
      tplSel.addEventListener('change', () => {
        setActiveTpl(tplSel.value || null);
        curTpl = getActiveTpl();
        rebuild();
      });

      const side = Util.el('div', { class: 'rle-side' }, [
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('报告标题') }), titleInput]),
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('导出模板（可自由选择）') }), tplSel]),
        Util.el('div', { class: 'muted', style: 'font-size:11px;line-height:1.6', text: T('右侧为 HTML 预览，可直接点击编辑文字、拖拽区块排序；编辑完成后选择下方格式导出。') })
      ]);
      titleInput.addEventListener('input', () => {
        const tEl = edArea.querySelector('.rl-title');
        if (tEl) tEl.textContent = titleInput.value.trim() || title0;
      });

      function rebuild() {
        const doc = buildEditableDoc(list, curTpl, titleInput.value.trim() || title0);
        edArea.innerHTML = '';
        Array.from(doc.children).forEach((c) => edArea.appendChild(c));
        enableDrag();
      }
      rebuild();

      // ---------- 全屏 ----------
      // 使用应用内全屏而非浏览器原生全屏，保证 Web 与 PWA 行为一致。
      let modalApi = null;
      let isPreviewFullscreen = false;
      function setPreviewFullscreen(next) {
        const box = wrap;
        if (!box) return;
        isPreviewFullscreen = !!next;
        box.classList.toggle('rle-full', isPreviewFullscreen);
        fullBtn.textContent = isPreviewFullscreen ? T('退出全屏') : T('全屏预览');
        fullBtn.setAttribute('aria-pressed', String(isPreviewFullscreen));
        fullBtn.setAttribute('title', isPreviewFullscreen ? T('退出全屏预览（Esc）') : T('全屏预览'));
        document.body.classList.toggle('rle-preview-open', isPreviewFullscreen);
        if (isPreviewFullscreen) setTimeout(() => { try { edArea.focus(); } catch (e) {} }, 0);
      }
      const fullBtn = Util.el('button', { class: 'btn rle-full-toggle', type: 'button', 'aria-pressed': 'false', onclick: () => setPreviewFullscreen(!isPreviewFullscreen) }, T('全屏预览'));
      const onPreviewKeydown = (e) => {
        if (e.key === 'Escape' && isPreviewFullscreen) {
          e.preventDefault();
          setPreviewFullscreen(false);
        }
      };
      document.addEventListener('keydown', onPreviewKeydown);

      // ---------- 导出按钮 ----------
      function curTitle() { return titleInput.value.trim() || title0; }
      const btnWord = Util.el('button', { class: 'btn btn-primary', onclick: () => {
        try { const fn = Report.toWordFile(curTitle(), edArea); Util.toast(T('Word 已导出：') + fn, 'ok'); }
        catch (e) { Util.toast(T('Word 导出失败：') + (e && e.message), 'err'); }
      } }, T('⇩ 导出 Word'));
      const btnPdf = Util.el('button', { class: 'btn btn-primary', onclick: () => {
        Report.toPdfFile(curTitle(), edArea).then((r) => Util.toast(T('PDF 已导出：') + r.fname + '（' + r.pages + T(' 页）'), 'ok'))
          .catch((e) => Util.toast(T('PDF 生成失败：') + (e && e.message || e), 'err'));
      } }, T('⇩ 导出 PDF'));
      const btnHtml = Util.el('button', { class: 'btn btn-primary', onclick: () => {
        try { const fn = Report.toHTMLFile(curTitle(), edArea); Util.toast(T('HTML 已导出：') + fn, 'ok'); }
        catch (e) { Util.toast(T('HTML 导出失败：') + (e && e.message), 'err'); }
      } }, T('⇩ 导出 HTML'));
      const closePreview = () => {
        setPreviewFullscreen(false);
        document.removeEventListener('keydown', onPreviewKeydown);
        Util.closeModal();
      };
      const cancelBtn = Util.el('button', { class: 'btn', onclick: closePreview }, T('关闭'));
      // 放在编辑器工作区顶部，确保用户无需滚动到底部就能退出预览。
      const exitPreviewBtn = Util.el('button', { class: 'btn rle-exit-preview', type: 'button', title: T('退出报告预览'), onclick: closePreview }, [
        Util.el('span', { class: 'rle-exit-icon', text: '←' }),
        Util.el('span', { text: T('退出预览') })
      ]);

      const wrap = Util.el('div', { class: 'rle-wrap' }, [
        Util.el('div', { class: 'rle-preview-topbar' }, [
          Util.el('div', { class: 'rle-toolbar-label' }, [
            Util.el('strong', { text: T('报告预览工作区') }),
            Util.el('span', { class: 'muted', text: T('可直接编辑内容并导出') })
          ]),
          exitPreviewBtn
        ]),
        Util.el('div', { class: 'rle-toolbar-label rle-toolbar-hint' }, [
          Util.el('strong', { text: T('编辑工具') }),
          Util.el('span', { class: 'muted', text: T('直接编辑正文，拖拽区块可调整顺序') })
        ]),
        toolbar,
        Util.el('div', { class: 'rle-body' }, [side, Util.el('div', { class: 'rle-stage' }, [
          Util.el('div', { class: 'rle-stage-label', text: T('实时预览 · 可编辑') }),
          edArea
        ])])
      ]);
      Util.modal(T('报告预览 / 编辑 / 导出（HTML · Word · PDF）'), wrap, [cancelBtn, fullBtn, btnHtml, btnWord, btnPdf], {
        wide: true,
        onClose: () => {
          setPreviewFullscreen(false);
          document.removeEventListener('keydown', onPreviewKeydown);
        }
      });
    }).catch((e) => Util.toast(T('预览生成失败：') + (e && e.message || e), 'err'));
  }

  // ================= 导出页 UI =================
  Report.render = function (mount) {
    mount.innerHTML = '';
    const state = DB.get();
    const head = Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('数据导出') }),
        Util.el('div', { class: 'muted', text: T('选择评估记录 → HTML 预览自由编辑 → 导出 Word / PDF / HTML；或导出 Excel。') })
      ]),
      Util.el('div', { class: 'btn-row' }, [
        Util.el('button', { class: 'btn', onclick: () => toggleAll(true) }, T('全选')),
        Util.el('button', { class: 'btn', onclick: () => toggleAll(false) }, T('清空')),
        Util.el('button', { class: 'btn btn-primary', onclick: () => openReportEditor(getSel()) }, T('预览 / 编辑 / 导出')),
        Util.el('button', { class: 'btn', onclick: () => batchExport(getSel()) }, T('批量导出 PDF')),
        Util.el('button', { class: 'btn', onclick: () => exportExcel(getSel()) }, T('⇩ Excel')),
        Util.el('button', { class: 'btn', onclick: () => exportNCExcel(getSel()) }, T('⇩ 不符合项')),
        Util.el('button', { class: 'btn', onclick: () => exportByChapter(getSel()) }, T('按章节导出'))
      ])
    ]);
    mount.appendChild(head);

    if (!state.assessments.length) { mount.appendChild(Util.el('div', { class: 'empty', text: T('暂无评估记录可导出，请先完成评估填写。') })); return; }
    const hint = Util.el('div', { class: 'hint', id: 'selHint', text: T('已选 0 项（未选择时导出全部）') });
    mount.appendChild(hint);
    const panel = Util.el('div', { class: 'panel' });
    const tbl = Util.el('table', { class: 'tbl' });
    tbl.appendChild(Util.el('thead', {}, Util.el('tr', {}, [Util.el('th', { style: 'width:38px' }), Util.el('th', { text: T('供应商') }), Util.el('th', { text: T('问卷') }), Util.el('th', { text: T('审核员') }), Util.el('th', { text: T('日期') }), Util.el('th', { text: T('合规评分') }), Util.el('th', { text: T('状态') })])));
    const tb = Util.el('tbody', {});
    state.assessments.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).forEach((a) => {
      const f = DB.getFacility(a.facilityId); const qn = DB.getQuestionnaire(a.questionnaireId); const s = DB.computeScore(qn, a.answers);
      const cb = Util.el('input', { type: 'checkbox', 'data-id': a.id }); cb.addEventListener('change', updateHint);
      tb.appendChild(Util.el('tr', {}, [Util.el('td', {}, [cb]), Util.el('td', { html: '<strong>' + Util.esc(f ? f.name : T('已删除')) + '</strong>' }), Util.el('td', { text: qn ? qn.title : T('已删除') }), Util.el('td', { text: a.auditor || '-' }), Util.el('td', { class: 'muted', text: Util.fmtDate(a.date) }), Util.el('td', { text: s.max ? s.percent + '%' : '—' }), Util.el('td', {}, [a.status === 'done' ? Util.el('span', { class: 'tag ok', text: T('完成') }) : Util.el('span', { class: 'tag gray', text: T('草稿') })])]));
    });
    tbl.appendChild(tb); panel.appendChild(tbl); mount.appendChild(panel);

    function getSel() { return Array.from(mount.querySelectorAll('input[data-id]:checked')).map((c) => c.dataset.id); }
    function toggleAll(v) { mount.querySelectorAll('input[data-id]').forEach((c) => { c.checked = v; }); updateHint(); }
    function updateHint() { const n = mount.querySelectorAll('input[data-id]:checked').length; hint.textContent = n ? (T('已选 ') + n + T(' 项')) : T('已选 0 项（未选择时导出全部）'); }
    updateHint();
  };

  // ================= 批量 / 按章节（沿用引擎 PDF 流式导出，模板可取当前选择） =================
  function legacyModel(a, atts, tpl, onlyModule) {
    // 引擎仍消费 {key, el} 章节；把 .rl-* DOM 交给引擎渲染即可
    const qn = DB.getQuestionnaire(a.questionnaireId);
    const title = qn ? qn.title : (DB.get().settings.reportTitle || T('供应商预审报告'));
    return { sections: Report.buildReportSections({ a: a, attachments: atts || [], title: title, onlyModule: onlyModule || null, cover: (tpl.layout && tpl.layout.cover) || {} }, tpl) };
  }

  function batchExport(ids) {
    const tpl = getActiveTpl();
    const state = DB.get(); let list = state.assessments;
    if (ids && ids.length) list = state.assessments.filter((a) => ids.includes(a.id));
    if (!list.length) { Util.toast(T('没有可导出的评估'), 'err'); return; }
    list = list.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    Util.toast(T('正在批量导出 ') + list.length + T(' 份报告…'));
    const jobs = list.map((a) => ({ model: null, tpl: tpl, filename: T('供应商预审报告_') + (DB.getFacility(a.facilityId) || {}).name + '_' + Util.fmtDate(a.date) + '.pdf', _a: a }));
    Promise.all(list.map((a, i) => DB.getAttachments(a.id).then((atts) => { jobs[i].model = legacyModel(a, atts, tpl); }))).then(() => {
      ReportEngine.exportAsync(jobs, tpl, (done, total) => { if (done % 3 === 0 || done === total) Util.toast(T('批量导出进度 ') + done + '/' + total); }).then((results) => {
        const ok = results.filter((r) => r.ok).length; Util.toast(T('批量导出完成：') + ok + '/' + results.length, ok === results.length ? 'ok' : 'err');
      });
    });
  }

  function exportByChapter(ids) {
    const tpl = getActiveTpl();
    const state = DB.get(); let list = state.assessments;
    if (ids && ids.length) list = state.assessments.filter((a) => ids.includes(a.id));
    if (!list.length) { Util.toast(T('没有可导出的评估'), 'err'); return; }
    list = list.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const jobs = [];
    list.forEach((a) => { const qn = DB.getQuestionnaire(a.questionnaireId); if (!qn) return; qn.modules.forEach((mod) => jobs.push({ model: null, tpl: tpl, filename: T('供应商预审报告_') + (DB.getFacility(a.facilityId) || {}).name + '_' + mod.title + '.pdf', _a: a, _mod: mod })); });
    if (!jobs.length) { Util.toast(T('没有可生成的章节'), 'err'); return; }
    if (jobs.length > 40 && !window.confirm(T('将生成 ') + jobs.length + T(' 份 PDF，确定继续？'))) return;
    Util.toast(T('正在按章节生成 ') + jobs.length + T(' 份…'));
    Promise.all(list.map((a) => DB.getAttachments(a.id).then((atts) => { jobs.filter((j) => j._a.id === a.id).forEach((j) => { j.model = legacyModel(a, atts, tpl, j._mod); }); }))).then(() => {
      ReportEngine.exportAsync(jobs, tpl, (d, t) => { if (d % 5 === 0 || d === t) Util.toast(T('章节导出进度 ') + d + '/' + t); }).then((r) => { const ok = r.filter((x) => x.ok).length; Util.toast(T('按章节报告已导出（') + ok + T(' 份）'), 'ok'); });
    });
  }

  // SUP-018/SUP-026：评估填写模块"导出报告"入口 → 打开 HTML 编辑器
  Report.exportPDF = openReportEditor;
  Report.openEditor = openReportEditor;
  Report.EXPORT_CSS = EXPORT_CSS;
  Report.THEME = { line: LINE, accent: ACCENT, ink: INK, muted: MUTED };

  global.Report = Report;
})(window);

/* ===== src/js/report-templates.js ===== */
/* ============================================================
 * 报告模板管理中心（纯用户自定义模式）
 *
 * 核心定位：取消全部系统预置模板，全面转向用户自定义排版模式，
 * 最大化用户对报告模板排版的自定义权限。
 *
 * 每个模板 = 报告版式（layout/style/resources/settings，复用 report-tpl 结构）
 *          + 审核内容（audit：审核类型 + 维度列表 → 检查项 → 评分规则，可选）
 *          + 来源信息（source：manual 手工 / upload 上传转换 / import 导入）
 *
 * 能力：
 *  - 从零手工创建模板
 *  - 上传 Word(.docx) / Excel(.xlsx) / HTML 文件，自动解析结构（标题层级、
 *    段落样式、表格、图片占位、{{变量}} 占位符）转换为平台可用模板
 *  - 完整排版编辑：字体/颜色/间距/表格/图片/纸张方向/页边距/页眉页脚
 *  - 版本管理：每次保存生成历史版本，可查看与回滚
 *  - JSON 导入导出
 *  - 共享范围设置（仅本机 / 局域网共享）
 *
 * 数据导出模块通过 TemplateCenter.get(id) 直接使用所选模板生成报告。
 * 存储：Storage kv 'report_templates_audit'（全部为用户自定义，无只读基线）。
 * ============================================================ */
(function (global) {
  const TC = {};

  // ---------------- 审核类型 ----------------
  const TYPES = [
    { key: 'social', label: '社会责任审核' },
    { key: 'quality', label: '质量审核' },
    { key: 'security', label: '反恐审核' },
    { key: 'esg', label: 'ESG 审核' },
    { key: 'custom', label: '自定义' }
  ];
  TC.TYPES = TYPES;
  TC.typeLabel = function (k) {
    const t = TYPES.find((x) => x.key === k);
    return t ? (T(t.label) || t.label) : (k || '');
  };

  // 评分方式：comply（合规/不合规/不适用）、rating（评分制 1-N）、percent（百分比）
  const SCORING = [
    { key: 'comply', label: '合规/不合规' },
    { key: 'rating', label: '评分制（1-5 分）' },
    { key: 'percent', label: '百分比' }
  ];
  TC.SCORING = SCORING;
  TC.scoringLabel = function (k) {
    const s = SCORING.find((x) => x.key === k);
    return s ? (T(s.label) || s.label) : (k || '');
  };

  function uid() { return 'it_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // 空维度辅助
  function mkDimension(name, weight) { return { id: uid(), name: name, weight: weight || 0, items: [] }; }
  function mkItem(name, scoring) { return { id: uid(), name: name, desc: '', scoring: scoring || 'comply', max: 5 }; }

  // 通用默认版式（用户新建模板的基础；非"预置模板"，仅作为默认排版起点，完全可编辑）
  function defaultTemplate() {
    const base = (global.ReportTpl && ReportTpl.default) ? ReportTpl.default() : {};
    return {
      id: uid(), name: '未命名模板', type: 'custom', builtin: false,
      description: '', source: 'manual',
      shared: 'local', // 共享范围：local 仅本机 / lan 局域网
      updatedAt: Date.now(), createdAt: Date.now(),
      versions: [],
      layout: base.layout || {}, style: base.style || {}, settings: base.settings || {},
      audit: { dimensions: [] }
    };
  }

  // ---------------- 存储桥接 ----------------
  const KEY = 'report_templates_audit';
  let _user = null;
  let _inited = false;

  function userList() { if (!Array.isArray(_user)) _user = []; return _user; }

  TC.ready = function () { return _inited; };

  TC.init = function () {
    return Promise.resolve()
      .then(() => Storage.kvGet(KEY))
      .then((v) => {
        // 合并而非覆盖：防止重复 init（自举 + 显式调用）时异步解析丢失内存中已保存的模板
        const stored = Array.isArray(v) ? v : [];
        const ids = userList().map((t) => t.id);
        _user = userList().concat(stored.filter((t) => t && ids.indexOf(t.id) < 0));
        _inited = true;
        return TC.list();
      })
      .catch(() => { _inited = true; return TC.list(); });
  };

  function ensureLoadedBeforeWrite() {
    if (_inited) return Promise.resolve();
    return Promise.resolve()
      .then(() => Storage.kvGet(KEY))
      .then((v) => {
        const stored = Array.isArray(v) ? v : [];
        const ids = userList().map((t) => t.id);
        _user = userList().concat(stored.filter((t) => t && ids.indexOf(t.id) < 0));
        _inited = true;
      })
      .catch(() => { _inited = true; });
  }
  function persist() {
    return ensureLoadedBeforeWrite()
      .then(() => Storage.kvPut(KEY, userList()))
      .catch((e) => { if (global.Util && Util.toast) Util.toast('模板保存失败：' + ((e && e.message) || e), 'err'); throw e; });
  }
  TC.flush = persist;

  // 统一模板：合并默认版式作为回退，模板可自由覆盖全部排版元素
  function normalizeTpl(t) {
    const base = (global.ReportTpl && ReportTpl.default) ? ReportTpl.default() : {};
    const out = Object.assign({}, clone(t));
    out.layout = out.layout || clone(base.layout || {});
    out.style = out.style || clone(base.style || {});
    out.settings = out.settings || clone(base.settings || {});
    out.audit = out.audit || { dimensions: [] };
    out.audit.dimensions = out.audit.dimensions || [];
    out.versions = Array.isArray(out.versions) ? out.versions : [];
    out.source = out.source || 'manual';
    out.shared = out.shared || 'local';
    return out;
  }

  // 列表：仅用户自定义模板（已取消全部预置模板）
  TC.list = function () {
    return userList().map((t) => normalizeTpl(Object.assign({}, t, { builtin: false })));
  };

  TC.get = function (id) {
    return TC.list().find((t) => t.id === id) || null;
  };

  // 保存：记录版本历史（前 20 版）
  TC.save = function (tpl) {
    if (!tpl) return null;
    tpl = clone(tpl);
    if (!tpl.id) tpl.id = uid();
    tpl.builtin = false;
    // 版本历史：保存当前版本快照（不含 versions 自身，避免递归膨胀）
    if (tpl.updatedAt) {
      const snap = clone(tpl); delete snap.versions;
      tpl.versions = (Array.isArray(tpl.versions) ? tpl.versions : []).concat([snap]).slice(-20);
    }
    tpl.updatedAt = Date.now();
    if (!tpl.createdAt) tpl.createdAt = tpl.updatedAt;
    const user = userList();
    const i = user.findIndex((t) => t.id === tpl.id);
    if (i >= 0) user[i] = tpl; else user.push(tpl);
    persist().catch(() => {});
    return tpl;
  };

  TC.remove = function (id) {
    const user = userList();
    const i = user.findIndex((t) => t.id === id);
    if (i < 0) return false;
    user.splice(i, 1);
    persist().catch(() => {});
    return true;
  };

  // 复制
  TC.clone = function (id, name) {
    const src = TC.get(id);
    if (!src) return null;
    const c = clone(src);
    c.id = uid(); c.builtin = false; c.name = name || (src.name + ' 副本');
    c.source = 'manual'; c.createdAt = Date.now();
    c.versions = [];
    c.updatedAt = Date.now();
    return TC.save(c);
  };

  // 空白自定义模板草稿
  TC.blank = function () {
    const t = defaultTemplate();
    return t;
  };

  // 版本历史：返回 [{version, name, desc, updatedAt, snapshot}]
  TC.history = function (id) {
    const t = TC.get(id);
    if (!t) return [];
    return (t.versions || []).map((v, idx) => ({ version: idx + 1, name: v.name, updatedAt: v.updatedAt, snapshot: v }));
  };

  // 回滚到指定版本（通过历史索引）
  TC.rollback = function (id, version) {
    const t = TC.get(id);
    if (!t) return null;
    const hist = t.versions || [];
    const idx = version - 1;
    if (idx < 0 || idx >= hist.length) return null;
    const snap = clone(hist[idx]);
    snap.id = t.id; snap.builtin = false; snap.source = t.source;
    snap.updatedAt = Date.now();
    // 回滚也产生一个新版本快照（当前被回滚掉的状态也保留）
    const cur = clone(t); delete cur.versions;
    snap.versions = hist.concat([cur]).slice(-20);
    const user = userList();
    const i = user.findIndex((x) => x.id === t.id);
    if (i >= 0) user[i] = snap; else user.push(snap);
    persist().catch(() => {});
    return snap;
  };

  // JSON 导入：解析并校验结构，返回新模板（始终生成新 id，避免覆盖同 id 模板）
  TC.importJSON = function (jsonStr) {
    let t;
    try { t = JSON.parse(jsonStr); } catch (e) { throw new Error('JSON 解析失败：' + e.message); }
    const norm = normalizeTpl(t);
    norm.id = uid();
    norm.builtin = false;
    norm.source = 'import';
    norm.updatedAt = Date.now();
    if (!norm.name) norm.name = '导入模板';
    if (!norm.type || !TYPES.some((x) => x.key === norm.type)) norm.type = 'custom';
    norm.versions = [];
    return TC.save(norm);
  };

  // JSON 导出
  TC.exportJSON = function (id) {
    const t = TC.get(id);
    if (!t) return null;
    return JSON.stringify(clone(t), null, 2);
  };

  // 维度/检查项 CRUD
  TC.addDimension = function (tpl, name, weight) {
    tpl.audit.dimensions.push(mkDimension(name || '新维度', weight));
    return tpl;
  };
  TC.addItem = function (tpl, dimIdx, name, scoring) {
    const dim = tpl.audit.dimensions[dimIdx];
    if (dim) dim.items.push(mkItem(name || '新检查项', scoring));
    return tpl;
  };
  TC.removeDimension = function (tpl, dimIdx) {
    tpl.audit.dimensions.splice(dimIdx, 1);
    return tpl;
  };
  TC.removeItem = function (tpl, dimIdx, itemIdx) {
    const dim = tpl.audit.dimensions[dimIdx];
    if (dim) dim.items.splice(itemIdx, 1);
    return tpl;
  };

  // ---------------- 模板上传与转换 ----------------
  // 用户上传 Word/Excel/HTML 文件 → 解析结构 → 生成平台可用模板
  // 返回 Promise<Template>，转换失败 reject(Error)

  // HTML → 结构模型
  function parseHtmlContent(htmlStr) {
    const doc = new DOMParser().parseFromString(htmlStr, 'text/html');
    const body = doc.body || doc;
    const blocks = [];
    function walk(node) {
      Array.from(node.children || []).forEach((el) => {
        const tag = el.tagName ? el.tagName.toLowerCase() : '';
        const cls = el.className || '';
        if (tag === 'script' || tag === 'style') return;
        const text = (el.textContent || '').trim();
        // 表格
        if (tag === 'table') {
          blocks.push({ kind: 'table', label: el.getAttribute('data-label') || (text.slice(0, 30)) || '表格', html: el.outerHTML });
          return;
        }
        // 图片
        if (tag === 'img') {
          const src = el.getAttribute('src') || '';
          blocks.push({ kind: 'image', label: el.getAttribute('alt') || '图片', src: src });
          return;
        }
        // 标题层级
        if (/^h[1-6]$/.test(tag)) {
          blocks.push({ kind: 'heading', level: parseInt(tag.slice(1), 10), label: text || '标题', html: el.outerHTML });
          return;
        }
        // 段落/div/li 等文本块
        if (tag === 'p' || tag === 'div' || tag === 'li' || tag === 'section' || tag === 'article') {
          if (text) {
            blocks.push({ kind: 'paragraph', label: text.slice(0, 30), html: el.outerHTML });
            return;
          }
        }
        // 继续递归
        if (el.children && el.children.length) walk(el);
      });
    }
    walk(body);
    return blocks;
  }

  // 识别 {{变量}} 占位符
  function extractVariables(text) {
    const vars = [];
    const re = /\{\{\s*([\w\u4e00-\u9fa5\-]+)\s*\}\}/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (vars.indexOf(m[1]) < 0) vars.push(m[1]);
    }
    return vars;
  }

  // 将解析出的文本块结构归一为版式（淡蓝线条 FLA 风格默认）
  function blocksToTemplate(blocks, name) {
    const base = (global.ReportTpl && ReportTpl.default) ? ReportTpl.default() : {};
    const t = {
      id: uid(), name: name || '上传模板', type: 'custom', builtin: false,
      description: '由用户上传文件自动转换生成',
      source: 'upload',
      shared: 'local',
      updatedAt: Date.now(), createdAt: Date.now(),
      versions: [],
      layout: clone(base.layout || {}), style: clone(base.style || {}), settings: clone(base.settings || {}),
      audit: { dimensions: [] },
      // 上传结构：保留解析出的排版结构，供导出/编辑时按序渲染
      uploaded: { blocks: blocks }
    };
    // 若解析到标题层级，用于建审核维度/检查项骨架（可选，用户可继续编辑）
    const headings = blocks.filter((b) => b.kind === 'heading');
    if (headings.length) {
      headings.forEach((h) => {
        const d = mkDimension(h.label.replace(/{{[\w\u4e00-\u9fa5\-]+}}/g, '').trim() || '新维度', 0);
        t.audit.dimensions.push(d);
      });
    }
    return t;
  }

  // 主入口：uploadFile(file) → Promise<Template>
  // 支持 .docx / .xlsx / .html / .htm / .txt（纯文本按 HTML 段落处理）
  TC.uploadAndConvert = function (file) {
    if (!file) return Promise.reject(new Error('未选择文件'));
    const ext = (file.name || '').split('.').pop().toLowerCase();
    const name = (file.name || '模板').replace(/\.[^.]+$/, '');
    const read = () => new Promise((resolve, reject) => { const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.onerror = () => reject(new Error('文件读取失败')); fr.readAsArrayBuffer(file); });

    if (ext === 'html' || ext === 'htm') {
      return new Promise((resolve, reject) => { const fr = new FileReader(); fr.onload = () => { try { const blocks = parseHtmlContent(String(fr.result)); resolve(TC.save(blocksToTemplate(blocks, name))); } catch (e) { reject(e); } }; fr.onerror = () => reject(new Error('HTML 文件读取失败')); fr.readAsText(file); });
    }

    if (ext === 'txt') {
      return new Promise((resolve, reject) => { const fr = new FileReader(); fr.onload = () => { const blocks = String(fr.result).split(/\n{2,}/).filter((p) => p.trim()).map((p) => ({ kind: 'paragraph', label: p.slice(0, 30), html: '<p>' + p.replace(/</g, '&lt;').replace(/\n/g, '<br/>') + '</p>' })); resolve(TC.save(blocksToTemplate(blocks, name))); }; fr.onerror = () => reject(new Error('文本文件读取失败')); fr.readAsText(file); });
    }

    if (ext === 'docx') {
      // .docx 是 zip：解压 word/document.xml，用 DOMParser 解析段落/表格
      return read().then((buf) => TC._parseDocx(buf, name)).then((blocks) => TC.save(blocksToTemplate(blocks, name)));
    }

    if (ext === 'xlsx' || ext === 'xls') {
      // 用 XLSX 库读取首个工作表，转成表格块
      return read().then((buf) => {
        if (!global.XLSX) {
          if (!global.ReportEngine || !ReportEngine.ensureLibs) return Promise.reject(new Error('Excel 解析组件未就绪'));
          return ReportEngine.ensureLibs(['xlsx']).then(() => TC._parseXlsx(buf, name));
        }
        return TC._parseXlsx(buf, name);
      }).then((blocks) => TC.save(blocksToTemplate(blocks, name)));
    }

    return Promise.reject(new Error('不支持的格式（支持 .docx / .xlsx / .html / .txt）'));
  };

  // 解析 docx（zip）为结构块
  TC._parseDocx = function (buf, name) {
    if (!global.JSZip) {
      if (global.Util && Util.loadLibs) {
        return Util.loadLibs([{ src: 'lib/jszip.min.js', check: function () { return !!global.JSZip; } }])
          .then(() => TC._parseDocxInner(buf));
      }
      return Promise.reject(new Error('JSZip 组件不可用'));
    }
    return TC._parseDocxInner(buf);
  };
  TC._parseDocxInner = function (buf) {
    return JSZip.loadAsync(buf).then((zip) => {
      const entry = zip.file('word/document.xml');
      if (!entry) return Promise.reject(new Error('未找到 Word 正文结构'));
      return entry.async('string').then((xml) => {
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const blocks = [];
        const body = doc.getElementsByTagName('w:body')[0] || doc;
        Array.from(body.children || []).forEach((el) => {
          const tag = (el.tagName || '').toLowerCase();
          const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
          // 段落
          if (tag === 'w:p') {
            if (!text) return;
            // 识别标题样式 w:pStyle w:val="Heading1" / "1"
            let isHeading = false, level = 0;
            const pstyle = el.getElementsByTagName('w:pStyle')[0];
            if (pstyle) {
              const v = (pstyle.getAttribute('w:val') || '').toLowerCase();
              const hm = v.match(/heading(\d)|^(\d)$/);
              if (hm) { isHeading = true; level = parseInt(hm[1] || hm[2], 10) || 1; }
            }
            if (isHeading && level >= 1) blocks.push({ kind: 'heading', level: Math.min(6, level), label: text.slice(0, 40), html: '<h' + Math.min(6, level) + '>' + text + '</h' + Math.min(6, level) + '>' });
            else blocks.push({ kind: 'paragraph', label: text.slice(0, 30), html: '<p>' + text + '</p>' });
            return;
          }
          // 表格
          if (tag === 'w:tbl') {
            blocks.push({ kind: 'table', label: text.slice(0, 30) || '表格', html: '' });
            return;
          }
        });
        return blocks;
      });
    });
  };

  // 解析 xlsx 为结构块（用 XLSX 库）
  TC._parseXlsx = function (buf, name) {
    if (!global.XLSX) return Promise.reject(new Error('XLSX 组件不可用'));
    try {
      const wb = XLSX.read(buf, { type: 'array' });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
      // 每个工作表 → 一个表格块
      const html = '<table><thead><tr>' + (rows[0] || []).map((c) => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>'
        + rows.slice(1).map((r) => '<tr>' + (Array(Math.max(rows[0] ? rows[0].length : 1, r.length)).fill(0).map((_, i) => '<td>' + (r[i] != null ? r[i] : '') + '</td>').join('')) + '</tr>').join('')
        + '</tbody></table>';
      const blocks = [{ kind: 'table', label: wsName || '工作表', html: html }];
      return Promise.resolve(blocks);
    } catch (e) { return Promise.reject(new Error('Excel 解析失败：' + (e && e.message || e))); }
  };

  // 供 UI 判断文件可支持
  TC.supportedExt = ['docx', 'xlsx', 'xls', 'html', 'htm', 'txt'];

  global.TemplateCenter = TC;
})(window);

/* ===== src/js/report-templates-ui.js ===== */
/* ============================================================
 * 模板管理中心 UI：列表 / 搜索 / 筛选 / 预览 / 编辑 / 自定义制作 / 上传转换 / 导入导出 / 版本回滚
 * 依赖：Util, T, DB, TemplateCenter, ReportEngine, ReportTpl
 *
 * 变更要点（User Self-Service 重构）：
 *  - 取消全部预置模板：首次进入显示空白创建引导，完全由用户自主创建
 *  - 最大化自定义权限：完整排版编辑器（字体/颜色/边距/纸张方向/页眉页脚）
 *  - 支持上传 Word/Excel/HTML 转换
 *  - 版本管理 + 回滚
 * ============================================================ */
(function (global) {
  const TC = global.TemplateCenter;
  const UI = {};

  // 类型筛选选项（不含"预置"概念）
  const TYPE_FILTERS = [
    { key: 'all', label: '全部' },
    { key: 'social', label: '社会责任' },
    { key: 'quality', label: '质量' },
    { key: 'security', label: '反恐' },
    { key: 'esg', label: 'ESG' },
    { key: 'custom', label: '自定义' }
  ];

  // 来源标签
  const SOURCE_LABELS = {
    manual: '手工创建', upload: '上传转换', import: 'JSON 导入'
  };
  function sourceLabel(src) { return SOURCE_LABELS[src] || SOURCE_LABELS.manual; }

  // ---------------- 预览 ----------------
  // 渲染模板的排版结构预览（含上传解析出的 blocks 与审核维度）
  function renderUploadPreview(tpl) {
    const wrap = Util.el('div', { class: 'tpl-ap' });
    const up = (tpl.uploaded && tpl.uploaded.blocks) || [];
    if (up.length) {
      up.forEach((b, i) => {
        const row = Util.el('div', { class: 'tpl-up-block' }, [
          Util.el('span', { class: 'tpl-up-kind', text: { heading: '标题', paragraph: '段落', table: '表格', image: '图片' }[b.kind] || b.kind }),
          Util.el('span', { class: 'tpl-up-label muted', text: b.label || '' })
        ]);
        wrap.appendChild(row);
      });
    }
    const dims = (tpl.audit && tpl.audit.dimensions) || [];
    if (dims.length) {
      dims.forEach((d, di) => {
        const card = Util.el('div', { class: 'tpl-ap-dim' });
        card.appendChild(Util.el('div', { class: 'tpl-ap-dim-head' }, [
          Util.el('span', { class: 'tpl-ap-dim-name', text: (di + 1) + '. ' + (d.name || '未命名') }),
          Util.el('span', { class: 'tpl-ap-dim-weight', text: T('权重 ') + (d.weight != null ? d.weight : '-') + '%' })
        ]));
        const t = Util.el('table', { class: 'rpt-table' });
        t.appendChild(Util.el('thead', {}, Util.el('tr', {}, [Util.el('th', { text: T('检查项') }), Util.el('th', { text: T('评分方式') }), Util.el('th', { text: T('说明') })])));
        const tb = Util.el('tbody', {});
        (d.items || []).forEach((it) => {
          tb.appendChild(Util.el('tr', {}, [Util.el('td', { text: it.name || '未命名' }), Util.el('td', { text: TC.scoringLabel(it.scoring) }), Util.el('td', { class: 'muted', text: it.desc || '—' })]));
        });
        t.appendChild(tb); card.appendChild(t);
        wrap.appendChild(card);
      });
    }
    if (!up.length && !dims.length) wrap.appendChild(Util.el('div', { class: 'muted', text: T('该模板暂无排版内容与审核维度。') }));
    return wrap;
  }

  // 模板卡片
  function tplCard(tpl, refresh) {
    const type = TC.typeLabel(tpl.type);
    const card = Util.el('div', { class: 'tpl-card', 'data-id': tpl.id });
    const head = Util.el('div', { class: 'tpl-card-head' });
    const srcTag = Util.el('span', { class: 'tpl-card-tag tag blue' }, sourceLabel(tpl.source));
    head.appendChild(srcTag);
    head.appendChild(Util.el('span', { class: 'tpl-card-type muted', text: type }));
    card.appendChild(head);
    card.appendChild(Util.el('div', { class: 'tpl-card-title', text: tpl.name }));
    card.appendChild(Util.el('div', { class: 'tpl-card-desc', text: tpl.description || T('（无描述）') }));
    const dimCount = (tpl.audit && tpl.audit.dimensions) ? tpl.audit.dimensions.length : 0;
    const itemCount = (tpl.audit && tpl.audit.dimensions) ? tpl.audit.dimensions.reduce((a, d) => a + ((d.items || []).length), 0) : 0;
    const verCount = (tpl.versions || []).length;
    card.appendChild(Util.el('div', { class: 'tpl-card-meta muted', text: T('维度 ') + dimCount + T(' · 检查项 ') + itemCount + (verCount ? T(' · 版本 ') + verCount : '') }));
    if (tpl.updatedAt) card.appendChild(Util.el('div', { class: 'tpl-card-time muted', text: T('更新 ') + Util.fmtDateTime(tpl.updatedAt) }));

    const btns = Util.el('div', { class: 'btn-row tpl-card-btns' });
    btns.appendChild(Util.el('button', { class: 'btn btn-sm', onclick: () => previewModal(tpl) }, T('预览')));
    btns.appendChild(Util.el('button', { class: 'btn btn-sm', onclick: () => editModal(tpl, refresh) }, T('编辑')));
    btns.appendChild(Util.el('button', { class: 'btn btn-sm', onclick: () => {
      const n = prompt(T('复制模板名称'), tpl.name + ' 副本');
      if (n === null) return;
      TC.clone(tpl.id, n || undefined);
      Util.toast(T('已复制模板'), 'ok'); refresh();
    } }, T('复制')));
    btns.appendChild(Util.el('button', { class: 'btn btn-sm', onclick: () => {
      const js = TC.exportJSON(tpl.id);
      if (!js) return;
      const blob = new Blob([js], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = (tpl.name || 'template') + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
      Util.toast(T('已导出模板 JSON'), 'ok');
    } }, T('导出')));
    if (verCount) btns.appendChild(Util.el('button', { class: 'btn btn-sm', onclick: () => historyModal(tpl, refresh) }, T('版本')));
    btns.appendChild(Util.el('button', { class: 'btn btn-sm btn-danger', onclick: () => {
      Util.confirm(T('删除模板'), T('确定删除模板「') + tpl.name + T('」？此操作不可恢复。'), T('删除')).then((ok) => {
        if (ok) { TC.remove(tpl.id); Util.toast(T('已删除模板'), 'ok'); refresh(); }
      });
    } }, T('删除')));
    card.appendChild(btns);
    return card;
  }

  // 预览弹窗
  function previewModal(tpl) {
    const body = Util.el('div', {});
    body.appendChild(Util.el('h3', { style: 'margin-top:0', text: tpl.name }));
    body.appendChild(Util.el('div', { class: 'muted', style: 'margin-bottom:8px', text: TC.typeLabel(tpl.type) + ' · ' + sourceLabel(tpl.source) + ' · ' + (tpl.description || '') }));
    body.appendChild(renderUploadPreview(tpl));
    Util.modal(T('模板预览'), body, [Util.el('button', { class: 'btn btn-primary', onclick: () => Util.closeModal() }, T('关闭'))], { wide: true });
  }

  // ---------------- 版本历史 / 回滚 ----------------
  function historyModal(tpl, refresh) {
    const hist = TC.history(tpl.id);
    const body = Util.el('div', {});
    if (!hist.length) { body.appendChild(Util.el('div', { class: 'muted', text: T('暂无历史版本。') })); Util.modal(T('版本历史'), body, [Util.el('button', { class: 'btn btn-primary', onclick: () => Util.closeModal() }, T('关闭'))], { wide: true }); return; }
    hist.slice().reverse().forEach((h) => {
      const row = Util.el('div', { class: 'tpl-ver-row' });
      row.appendChild(Util.el('span', { class: 'tpl-ver-no', text: '#' + h.version }));
      row.appendChild(Util.el('span', { class: 'tpl-ver-time muted', text: Util.fmtDateTime(h.updatedAt) }));
      row.appendChild(Util.el('span', { class: 'tpl-ver-name', text: h.name || '' }));
      row.appendChild(Util.el('button', { class: 'btn btn-sm', onclick: () => {
        const cur = TC.rollback(tpl.id, h.version);
        if (cur) { Util.toast(T('已回滚到版本 #') + h.version, 'ok'); Util.closeModal(); refresh(); }
        else Util.toast(T('回滚失败'), 'err');
      } }, T('回滚到此版本')));
      body.appendChild(row);
    });
    Util.modal(T('版本历史（') + hist.length + T('）'), body, [Util.el('button', { class: 'btn btn-primary', onclick: () => Util.closeModal() }, T('关闭'))], { wide: true });
  }

  // ---------------- 编辑 / 自定义制作 ----------------
  function editModal(tpl, refresh) {
    const d = JSON.parse(JSON.stringify(tpl));
    if (!d.audit) d.audit = { dimensions: [] };
    const body = Util.el('div', { class: 'tpl-editor' });
    const field = (label, ctrl) => Util.el('label', { class: 'fld', style: 'margin-bottom:8px;display:block' }, [Util.el('span', { class: 'lbl', text: label }), ctrl]);

    const nameI = Util.el('input', { type: 'text', class: 'inp', value: d.name });
    const descI = Util.el('textarea', { class: 'inp', rows: '2', style: 'width:100%' }); descI.value = d.description || '';
    const typeSel = Util.el('select', { class: 'inp' }, TC.TYPES.map((x) => Util.el('option', { value: x.key, text: T(x.label) })));
    typeSel.value = d.type || 'custom';

    body.appendChild(field(T('模板名称'), nameI));
    body.appendChild(field(T('审核类型'), typeSel));
    body.appendChild(field(T('模板描述'), descI));

    // ===== 排版编辑区（最大化自定义权限）=====
    const layoutBox = Util.el('div', { class: 'tpl-layout' });
    layoutBox.appendChild(Util.el('div', { style: 'font-weight:700;margin:10px 0 6px;border-left:4px solid #1A5F9E;padding-left:8px', text: T('报告排版') }));
    // 字体 / 字号
    const fontRow = Util.el('div', { class: 'row', style: 'gap:8px;margin-bottom:6px' });
    const fontI = Util.el('input', { type: 'text', class: 'inp', style: 'flex:1.6', value: (d.style && d.style.fontFamily) || '' });
    fontRow.appendChild(field(T('字体'), fontI));
    const baseFontI = Util.el('input', { type: 'number', class: 'inp tpl-w', value: (d.style && d.style.baseFontSize) || 12.5, min: '9', max: '20', step: '0.5' });
    fontRow.appendChild(field(T('正文字号'), baseFontI));
    layoutBox.appendChild(fontRow);
    // 标题颜色 / 强调色
    const colorRow = Util.el('div', { class: 'row', style: 'gap:8px;margin-bottom:6px' });
    const headingColorI = Util.el('input', { type: 'color', class: 'inp tpl-color', value: (d.style && d.style.colorHeading) || '#1A5F9E' });
    colorRow.appendChild(field(T('标题颜色'), headingColorI));
    const accentI = Util.el('input', { type: 'color', class: 'inp tpl-color', value: (d.style && d.style.colorAccent) || '#1A5F9E' });
    colorRow.appendChild(field(T('强调色'), accentI));
    const textColorI = Util.el('input', { type: 'color', class: 'inp tpl-color', value: (d.style && d.style.colorText) || '#333333' });
    colorRow.appendChild(field(T('正文字色'), textColorI));
    layoutBox.appendChild(colorRow);
    // 边距 / 行距
    const marginRow = Util.el('div', { class: 'row', style: 'gap:8px;margin-bottom:6px' });
    const marginXI = Util.el('input', { type: 'number', class: 'inp tpl-w', value: (d.style && d.style.marginX) || 14, min: '5', max: '40' });
    marginRow.appendChild(field(T('左右边距(mm)'), marginXI));
    const marginYI = Util.el('input', { type: 'number', class: 'inp tpl-w', value: (d.style && d.style.marginY) || 14, min: '5', max: '40' });
    marginRow.appendChild(field(T('上下边距(mm)'), marginYI));
    const lhI = Util.el('input', { type: 'number', class: 'inp tpl-w', value: (d.style && d.style.lineHeight) || 1.6, min: '1', max: '2.5', step: '0.1' });
    marginRow.appendChild(field(T('行距'), lhI));
    layoutBox.appendChild(marginRow);
    // 纸张方向 / 目标尺寸
    const paperRow = Util.el('div', { class: 'row', style: 'gap:8px;margin-bottom:6px' });
    const sizeSel = Util.el('select', { class: 'inp' }, ['a4', 'a5', 'a3', 'phone'].map((k) => Util.el('option', { value: k, text: (ReportTpl.SIZES[k] ? ReportTpl.SIZES[k].label : k) })));
    sizeSel.value = (d.settings && d.settings.targetSize) || 'a4';
    paperRow.appendChild(field(T('纸张尺寸'), sizeSel));
    const orientSel = Util.el('select', { class: 'inp' }, [Util.el('option', { value: 'portrait', text: T('纵向') }), Util.el('option', { value: 'landscape', text: T('横向') })]);
    orientSel.value = (d.settings && d.settings.orientation) || 'portrait';
    paperRow.appendChild(field(T('方向'), orientSel));
    layoutBox.appendChild(paperRow);

    // 页眉/页脚三槽位
    const hfBox = Util.el('div', {});
    hfBox.appendChild(Util.el('div', { style: 'font-weight:700;margin:10px 0 6px;border-left:4px solid #1A5F9E;padding-left:8px', text: T('页眉 / 页脚') }));
    const hfRow = Util.el('div', { class: 'row', style: 'gap:8px' });
    function hfSlotSelect(slot, cfg, saveFn) {
      const sel = Util.el('select', { class: 'inp', multiple: true, style: 'height:auto;min-height:84px' });
      ReportTpl.HF_ELEMENTS.forEach((e) => {
        const opt = Util.el('option', { value: e, text: ReportTpl.hfLabel(e) });
        opt.selected = (cfg && cfg.slots && cfg.slots[slot] || []).indexOf(e) >= 0;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', () => { const arr = Array.from(sel.selectedOptions).map((o) => o.value); saveFn(slot, arr); });
      return sel;
    }
    const normH = ReportTpl.normalizeBand(d.layout && d.layout.header);
    const normF = ReportTpl.normalizeBand(d.layout && d.layout.footer);
    const headerSlots = { left: hfSlotSelect('left', normH, (s, arr) => { normH.slots[s] = arr; d.layout.header = normH; }), center: hfSlotSelect('center', normH, (s, arr) => { normH.slots[s] = arr; d.layout.header = normH; }), right: hfSlotSelect('right', normH, (s, arr) => { normH.slots[s] = arr; d.layout.header = normH; }) };
    const footerSlots = { left: hfSlotSelect('left', normF, (s, arr) => { normF.slots[s] = arr; d.layout.footer = normF; }), center: hfSlotSelect('center', normF, (s, arr) => { normF.slots[s] = arr; d.layout.footer = normF; }), right: hfSlotSelect('right', normF, (s, arr) => { normF.slots[s] = arr; d.layout.footer = normF; }) };
    function hfBlock(title, slots) {
      const box = Util.el('div', { style: 'flex:1;min-width:180px' });
      box.appendChild(Util.el('div', { style: 'font-weight:700;font-size:12px;margin-bottom:4px', text: title }));
      const labels = { left: '左', center: '中', right: '右' };
      ['left', 'center', 'right'].forEach((s) => {
        box.appendChild(Util.el('div', { style: 'margin-bottom:4px' }, [Util.el('span', { class: 'muted', style: 'font-size:11px;margin-right:6px', text: labels[s] }), slots[s]]));
      });
      return box;
    }
    hfRow.appendChild(hfBlock(T('页眉'), headerSlots));
    hfRow.appendChild(hfBlock(T('页脚'), footerSlots));
    hfBox.appendChild(hfRow);
    body.appendChild(layoutBox);
    body.appendChild(hfBox);

    // ===== 上传结构块（若为上传模板，可查看/编辑变量占位符）=====
    const up = (d.uploaded && d.uploaded.blocks) || [];
    if (up.length) {
      const upBox = Util.el('div', {});
      upBox.appendChild(Util.el('div', { style: 'font-weight:700;margin:10px 0 6px;border-left:4px solid #1A5F9E;padding-left:8px', text: T('上传结构预览（' + up.length + ' 块）') }));
      const vars = new Set();
      up.forEach((b) => { if (b.label) extractVars(b.label).forEach((v) => vars.add(v)); });
      if (vars.size) upBox.appendChild(Util.el('div', { class: 'muted', style: 'margin-bottom:6px', text: T('识别到变量占位符：') + Array.from(vars).map((v) => '{{' + v + '}}').join('、') }));
      const t = Util.el('table', { class: 'rpt-table' });
      t.appendChild(Util.el('thead', {}, Util.el('tr', {}, [Util.el('th', { text: '#' }), Util.el('th', { text: T('类型') }), Util.el('th', { text: T('内容') })])));
      const tb = Util.el('tbody', {});
      up.forEach((b, i) => tb.appendChild(Util.el('tr', {}, [Util.el('td', { text: String(i + 1) }), Util.el('td', { text: { heading: '标题', paragraph: '段落', table: '表格', image: '图片' }[b.kind] || b.kind }), Util.el('td', { text: b.label || '' })])));
      t.appendChild(tb); upBox.appendChild(t);
      body.appendChild(upBox);
    }

    // ===== 审核维度与检查项（可选，供导出生成审核框架）=====
    const dimsBox = Util.el('div', { class: 'tpl-dims' });
    function renderDims() {
      dimsBox.innerHTML = '';
      if (!d.audit.dimensions.length) dimsBox.appendChild(Util.el('div', { class: 'muted', style: 'margin:6px 0', text: T('尚未添加审核维度。点击下方按钮添加。') }));
      d.audit.dimensions.forEach((dim, di) => {
        const dimEl = Util.el('div', { class: 'tpl-dim' });
        const head = Util.el('div', { class: 'tpl-dim-head' });
        const dn = Util.el('input', { type: 'text', class: 'inp', style: 'flex:1', value: dim.name });
        dn.addEventListener('input', () => { dim.name = dn.value; });
        const dw = Util.el('input', { type: 'number', class: 'inp tpl-w', value: dim.weight != null ? dim.weight : '', min: '0', max: '100' });
        dw.addEventListener('input', () => { dim.weight = parseInt(dw.value, 10) || 0; });
        head.appendChild(dn);
        head.appendChild(Util.el('span', { class: 'muted tpl-wlbl', text: T('权重%') }));
        head.appendChild(dw);
        head.appendChild(Util.el('button', { class: 'btn btn-sm btn-danger', onclick: () => { TC.removeDimension(d, di); renderDims(); } }, T('删除维度')));
        dimEl.appendChild(head);
        const itemsList = Util.el('div', { class: 'tpl-items' });
        (dim.items || []).forEach((it, ii) => {
          const row = Util.el('div', { class: 'tpl-item' });
          const nm = Util.el('input', { type: 'text', class: 'inp', style: 'flex:1', value: it.name });
          nm.addEventListener('input', () => { it.name = nm.value; });
          const sc = Util.el('select', { class: 'inp tpl-sc' }, TC.SCORING.map((s) => Util.el('option', { value: s.key, text: T(s.label) })));
          sc.value = it.scoring || 'comply';
          sc.addEventListener('change', () => { it.scoring = sc.value; });
          const dc = Util.el('input', { type: 'text', class: 'inp', style: 'flex:1.4', placeholder: T('说明（可选）'), value: it.desc || '' });
          dc.addEventListener('input', () => { it.desc = dc.value; });
          row.appendChild(nm); row.appendChild(sc); row.appendChild(dc);
          row.appendChild(Util.el('button', { class: 'btn btn-sm btn-danger', onclick: () => { TC.removeItem(d, di, ii); renderDims(); } }, '×'));
          itemsList.appendChild(row);
        });
        dimEl.appendChild(itemsList);
        dimEl.appendChild(Util.el('div', { class: 'btn-row', style: 'margin:4px 0' }, [Util.el('button', { class: 'btn btn-sm', onclick: () => { TC.addItem(d, di, '新检查项', 'comply'); renderDims(); } }, T('+ 检查项'))]));
        dimsBox.appendChild(dimEl);
      });
      dimsBox.appendChild(Util.el('div', { class: 'btn-row' }, [Util.el('button', { class: 'btn', onclick: () => { TC.addDimension(d, '新维度', 0); renderDims(); } }, T('+ 添加审核维度'))]));
    }
    body.appendChild(Util.el('div', { style: 'font-weight:700;margin:10px 0 6px;border-left:4px solid #1A5F9E;padding-left:8px', text: T('审核维度与检查项（可选）') }));
    body.appendChild(dimsBox);
    renderDims();

    // 底部操作
    const saveBtn = Util.el('button', { class: 'btn btn-primary', onclick: () => {
      d.name = nameI.value.trim() || '未命名模板';
      d.type = typeSel.value;
      d.description = descI.value;
      d.style = Object.assign({}, d.style || {}, {
        fontFamily: fontI.value, baseFontSize: parseFloat(baseFontI.value) || 12.5,
        colorHeading: headingColorI.value, colorAccent: accentI.value, colorText: textColorI.value,
        marginX: parseFloat(marginXI.value) || 14, marginY: parseFloat(marginYI.value) || 14,
        lineHeight: parseFloat(lhI.value) || 1.6
      });
      d.settings = Object.assign({}, d.settings || {}, { targetSize: sizeSel.value, orientation: orientSel.value });
      d.layout = Object.assign({}, d.layout || {}, { header: normH, footer: normF });
      d.audit = d.audit || { dimensions: [] };
      TC.save(d);
      Util.closeModal();
      Util.toast(T('模板已保存'), 'ok');
      refresh();
    } }, T('保存模板'));
    const cancelBtn = Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('取消'));
    const previewBtn = Util.el('button', { class: 'btn', onclick: () => {
      d.name = nameI.value.trim() || '未命名模板';
      previewModal(d);
    } }, T('预览'));
    Util.modal(T('编辑模板'), body, [cancelBtn, previewBtn, saveBtn], { wide: true, maxHeight: '86vh' });
  }

  function extractVars(text) {
    const re = /\{\{\s*([\w\u4e00-\u9fa5\-]+)\s*\}\}/g; let m; const out = [];
    while ((m = re.exec(text)) !== null) out.push(m[1]);
    return out;
  }

  // ---------------- 上传转换 ----------------
  function uploadModal(refresh) {
    const fileInput = Util.el('input', { type: 'file', accept: '.docx,.xlsx,.xls,.html,.htm,.txt', style: 'display:none' });
    const body = Util.el('div', {});
    body.appendChild(Util.el('div', { class: 'muted', style: 'margin-bottom:8px', text: '支持 Word(.docx) / Excel(.xlsx) / HTML / 文本(.txt) 文件。系统自动解析标题层级、段落样式、表格结构与变量占位符，转换为平台可用模板。' }));
    const drop = Util.el('div', { class: 'tpl-drop' });
    drop.textContent = T('点击选择文件，或将文件拖拽到此处');
    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault(); drop.classList.remove('over');
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) doConvert(f);
    });
    body.appendChild(drop);
    body.appendChild(fileInput);
    function doConvert(f) {
      Util.toast(T('正在解析并转换模板…'));
      TC.uploadAndConvert(f).then((t) => {
        Util.toast(T('模板已转换：') + t.name, 'ok');
        Util.closeModal();
        refresh();
        // 转换后保留进入编辑器进一步调整
        const tpl = TC.get(t.id);
        if (tpl) editModal(tpl, refresh);
      }).catch((e) => Util.toast(T('转换失败：') + (e && e.message || e), 'err'));
    }
    fileInput.addEventListener('change', () => { const f = fileInput.files && fileInput.files[0]; if (f) doConvert(f); });
    Util.modal(T('上传并转换模板'), body, [Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('取消'))], { wide: true });
  }

  // ---------------- 主列表页面 ----------------
  UI.render = function (mount) {
    mount.innerHTML = '';
    const head = Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('模板管理中心') }),
        Util.el('div', { class: 'muted', text: T('取消全部预置模板，完全由您自定义报告排版。可手工创建、上传 Word/Excel/HTML 转换，自由编辑字体、颜色、边距、纸张与页眉页脚。数据导出模块可直接选用。') })
      ]),
      Util.el('div', { class: 'btn-row' }, [
        Util.el('button', { class: 'btn btn-primary', onclick: () => editModal(TC.blank(), renderGrid), text: T('＋ 新建自定义模板') }),
        Util.el('button', { class: 'btn', onclick: () => uploadModal(renderGrid), text: T('⇪ 上传模板') }),
        Util.el('button', { class: 'btn', onclick: importJSON, text: T('⇧ 导入 JSON') })
      ])
    ]);
    mount.appendChild(head);

    const filterRow = Util.el('div', { class: 'tpl-filter' });
    const searchI = Util.el('input', { type: 'text', class: 'inp', placeholder: T('搜索模板名称 / 描述…'), style: 'flex:1;min-width:180px' });
    searchI.addEventListener('input', () => { renderGrid(); });
    filterRow.appendChild(searchI);
    const typeSel = Util.el('select', { class: 'inp' }, TYPE_FILTERS.map((x) => Util.el('option', { value: x.key, text: T(x.label) })));
    typeSel.addEventListener('change', () => { renderGrid(); });
    filterRow.appendChild(typeSel);
    mount.appendChild(filterRow);

    const grid = Util.el('div', { class: 'tpl-grid' });
    mount.appendChild(grid);
    const countEl = Util.el('div', { class: 'muted', style: 'margin:8px 2px' });
    mount.appendChild(countEl);

    function all() {
      return TC.list().slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    function renderGrid() {
      const kw = (searchI.value || '').trim().toLowerCase();
      const ty = typeSel.value;
      let list = all();
      if (ty && ty !== 'all') list = list.filter((t) => t.type === ty);
      if (kw) list = list.filter((t) => ((t.name || '') + ' ' + (t.description || '')).toLowerCase().indexOf(kw) >= 0);
      grid.innerHTML = '';
      if (!list.length) {
        // 空状态：首次进入显示空白创建引导（无任何预置模板）
        const empty = Util.el('div', { class: 'tpl-empty' });
        empty.appendChild(Util.el('div', { class: 'tpl-empty-icon', text: '🛠️' }));
        empty.appendChild(Util.el('div', { class: 'tpl-empty-title', text: T('还没有任何模板') }));
        empty.appendChild(Util.el('div', { class: 'muted', style: 'margin-bottom:12px', text: T('已取消全部预置模板。请从新建自定义模板或上传文件开始。') }));
        const row = Util.el('div', { class: 'btn-row', style: 'justify-content:center' }, [
          Util.el('button', { class: 'btn btn-primary', onclick: () => editModal(TC.blank(), renderGrid), text: T('＋ 新建自定义模板') }),
          Util.el('button', { class: 'btn', onclick: () => uploadModal(renderGrid), text: T('⇪ 上传模板') })
        ]);
        empty.appendChild(row);
        grid.appendChild(empty);
      }
      list.forEach((t) => grid.appendChild(tplCard(t, renderGrid)));
      countEl.textContent = list.length ? T('共 ') + list.length + T(' 个模板') : '';
    }
    function importJSON() {
      const file = Util.el('input', { type: 'file', accept: '.json', style: 'display:none' });
      file.addEventListener('change', () => {
        const f = file.files && file.files[0];
        if (!f) return;
        const fr = new FileReader();
        fr.onload = () => {
          try {
            const t = TC.importJSON(fr.result);
            Util.toast(T('已导入模板：') + t.name, 'ok');
            renderGrid();
          } catch (e) { Util.toast(T('导入失败：') + e.message, 'err'); }
        };
        fr.readAsText(f);
      });
      file.click();
    }
    renderGrid();
  };

  UI.renderUploadPreview = renderUploadPreview;
  UI.tplCard = tplCard;

  global.TemplateCenterUI = UI;
})(window);

/* ===== src/js/supplymap.js ===== */
/* 供应商分布地图 v5.0
 * 主地图：腾讯地图 GL JS（合规代理模式，不在前端暴露 Key）
 * 离线/弱网：自动降级为本地 SVG 地理分布图，保证供应商点位、筛选、详情和图例仍可用。
 * 对外接口保持：mount / setMarkers / focusSupplier / clearSelection / ensureLibs / hasGeo / scoreColor / scaleSize
 */
(function (global) {
  'use strict';
  const SupplyMap = {};
  const SCORE_COLORS = { excellent: '#1B5E20', great: '#4CAF50', good: '#FFC107', fair: '#FF9800', poor: '#F44336' };
  const SCALE_SIZE = { '大型': 24, '中型': 18, '小型': 14, '微型': 10 };
  const RISK_DEFAULT = { '低': 0.2, '中': 0.5, '高': 0.78, '极高': 0.95 };
  const ctx = { container: null, mapEl: null, map: null, markerLayer: null, all: [], customRisk: null, selectedId: null, onSelect: null, onClear: null, mode: 'offline' };
  let libsPromise = null;

  function hasGeo(f) { return f && Number.isFinite(Number(f.lat)) && Number.isFinite(Number(f.lng)); }
  function scoreColor(score) { if (score == null) return '#9aa7b8'; if (score >= 90) return SCORE_COLORS.excellent; if (score >= 75) return SCORE_COLORS.great; if (score >= 60) return SCORE_COLORS.good; if (score >= 40) return SCORE_COLORS.fair; return SCORE_COLORS.poor; }
  function scoreLabel(score) { if (score == null) return T('未评估'); if (score >= 90) return T('卓越'); if (score >= 75) return T('优秀'); if (score >= 60) return T('良好'); if (score >= 40) return T('一般'); return T('较差'); }
  function scaleSize(scale) { return SCALE_SIZE[scale] || 14; }
  // 与旧版离线地图契约兼容：返回 1000x500 画布中的等距投影坐标。
  SupplyMap.project = function (lng, lat) {
    const x = Math.max(0, Math.min(1000, (Number(lng) + 180) / 360 * 1000));
    const y = Math.max(0, Math.min(500, (90 - Number(lat)) / 180 * 500));
    return [x, y];
  };
  function riskValue(level, custom) { return custom && custom[level] != null ? custom[level] : (RISK_DEFAULT[level] || 0.3); }
  function legendItem(color, label) { return Util.el('div', { class: 'sc-legend-item' }, [Util.el('span', { class: 'sc-dot', style: 'background:' + color }), Util.el('span', { text: label })]); }

  SupplyMap.ensureLibs = function () {
    if (global.TMap && global.TMap.Map && global.TMap.MultiMarker) return Promise.resolve(true);
    if (libsPromise) return libsPromise;
    libsPromise = new Promise(function (resolve, reject) {
      if (!navigator.onLine) { reject(new Error('当前处于离线状态')); return; }
      global._TMapSecurityConfig = { serviceHost: 'http://127.0.0.1:__WB_HTTP_PORT__/_TMapService/_wbt/__WB_TMAP_SECRET__' };
      const s = document.createElement('script');
      s.src = 'https://map.qq.com/api/gljs?v=1.exp';
      s.async = true;
      s.onload = function () { global.TMap && global.TMap.Map ? resolve(true) : reject(new Error('腾讯地图组件不可用')); };
      s.onerror = function () { reject(new Error('腾讯地图组件加载失败')); };
      (document.head || document.documentElement).appendChild(s);
    });
    return libsPromise;
  };

  SupplyMap.mount = function (container, opts) {
    opts = opts || {};
    ctx.container = container; ctx.onSelect = opts.onSelectSupplier || null; ctx.onClear = opts.onClearSelection || null; ctx.all = []; ctx.selectedId = null; ctx.map = null; ctx.markerLayer = null; ctx.mode = 'offline';
    container.innerHTML = '';
    ctx.mapEl = Util.el('div', { class: 'sc-leaflet-host sc-map-stage' });
    container.appendChild(ctx.mapEl);
    const legend = Util.el('div', { class: 'sc-legend' }, [
      Util.el('div', { class: 'sc-legend-title', text: T('评估得分图例') }), legendItem(SCORE_COLORS.excellent, T('卓越 90-100')), legendItem(SCORE_COLORS.great, T('优秀 75-89')), legendItem(SCORE_COLORS.good, T('良好 60-74')), legendItem(SCORE_COLORS.fair, T('一般 40-59')), legendItem(SCORE_COLORS.poor, T('较差 0-39')),
      Util.el('div', { class: 'sc-legend-sep' }), Util.el('div', { class: 'sc-legend-title', text: T('规模图例') }), legendItem('#3a56d4', T('大型 24px')), legendItem('#3a56d4', T('中型 18px')), legendItem('#3a56d4', T('小型 14px')), legendItem('#3a56d4', T('微型 10px'))
    ]);
    container.appendChild(legend);
    container.appendChild(Util.el('button', { class: 'btn btn-sm sc-map-reset', text: T('重置视图'), onclick: resetView }));
    ctx.popup = Util.el('div', { class: 'sc-popup', style: 'display:none' }); container.appendChild(ctx.popup);
    drawOffline();
    SupplyMap.ensureLibs().then(initTencent).catch(function () { showMapStatus(T('当前无法连接地图服务，已启用本地离线地图')); });
  };

  function initTencent() {
    if (!ctx.mapEl || !global.TMap) return;
    try {
      ctx.mapEl.innerHTML = '';
      ctx.map = new TMap.Map(ctx.mapEl, { center: new TMap.LatLng(35.86, 104.19), zoom: 4, pitch: 0, rotation: 0 });
      ctx.markerLayer = new TMap.MultiMarker({ map: ctx.map, styles: { default: new TMap.MarkerStyle({ width: 22, height: 22, anchor: { x: 11, y: 11 }, src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><circle cx="11" cy="11" r="8" fill="#24566a" stroke="#fff" stroke-width="3"/></svg>') }) }, geometries: [] });
      ctx.mode = 'tencent';
      setMarkersTencent();
      showMapStatus(T('腾讯地图在线服务')); 
      if (global.ResizeObserver) { const ro = new ResizeObserver(function () { if (ctx.map && ctx.map.resize) ctx.map.resize(); }); ro.observe(ctx.mapEl); }
    } catch (e) { ctx.map = null; showMapStatus(T('地图服务初始化失败，已启用本地离线地图')); drawOffline(); }
  }

  function setMarkersTencent() {
    if (!ctx.markerLayer) return;
    const geometries = ctx.all.filter(hasGeo).map(function (f) { return { id: String(f.id), position: new TMap.LatLng(Number(f.lat), Number(f.lng)), properties: { id: String(f.id) } }; });
    ctx.markerLayer.updateGeometries(geometries);
    if (ctx.markerLayer.on) ctx.markerLayer.on('click', function (evt) { const id = evt && evt.geometry && evt.geometry.properties && evt.geometry.properties.id; if (id && ctx.onSelect) ctx.onSelect(id); });
  }

  function drawOffline() {
    if (!ctx.mapEl) return;
    ctx.mapEl.innerHTML = '<div class="sc-offline-map" role="img" aria-label="' + T('供应商离线分布图') + '"><div class="sc-map-grid"></div><div class="sc-map-label sc-map-label-cn">' + T('中国及周边供应商分布') + '</div><div class="sc-offline-note">' + T('离线地图 · 点位数据保存在本机') + '</div><svg class="sc-offline-svg" viewBox="0 0 1000 560" preserveAspectRatio="none"><g id="scMarkers"></g></svg></div>';
    const svg = ctx.mapEl.querySelector('.sc-offline-svg');
    const markerGroup = ctx.mapEl.querySelector('#scMarkers');
    if (!svg || !markerGroup) return;
    const groups = {};
    ctx.all.filter(hasGeo).forEach(function (f) {
      const p = SupplyMap.project(f.lng, f.lat);
      const key = Math.round(p[0] / 8) + ':' + Math.round(p[1] / 8);
      (groups[key] || (groups[key] = [])).push(f);
    });
    Object.keys(groups).forEach(function (key) {
      const facilities = groups[key];
      const first = facilities[0];
      const p = SupplyMap.project(first.lng, first.lat);
      if (facilities.length > 1) {
        const cluster = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        cluster.setAttribute('class', 'sc-cluster'); cluster.setAttribute('cx', p[0]); cluster.setAttribute('cy', p[1]); cluster.setAttribute('r', 14); cluster.setAttribute('fill', '#24566a'); cluster.setAttribute('stroke', '#fff'); cluster.setAttribute('stroke-width', '3'); cluster.setAttribute('data-count', facilities.length);
        markerGroup.appendChild(cluster);
        return;
      }
      const f = first, r = Math.max(5, scaleSize(f.scale) / 2);
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      node.setAttribute('class', 'sc-marker'); node.setAttribute('cx', p[0]); node.setAttribute('cy', Math.max(20, Math.min(540, p[1] * 560 / 500))); node.setAttribute('r', r); node.setAttribute('fill', scoreColor(f.score)); node.setAttribute('stroke', '#fff'); node.setAttribute('stroke-width', '3'); node.setAttribute('data-id', f.id); node.setAttribute('tabindex', '0');
      node.addEventListener('click', function () { ctx.selectedId = f.id; if (ctx.onSelect) ctx.onSelect(f.id); drawOffline(); });
      markerGroup.appendChild(node);
    });
  }

  function showMapStatus(text) {
    if (!ctx.mapEl) return;
    let el = ctx.mapEl.querySelector('.sc-map-status');
    if (!el) { el = Util.el('div', { class: 'sc-map-status' }); ctx.mapEl.appendChild(el); }
    el.textContent = text;
  }

  // 设置地区风险权重。供应链面板会在用户点选等级后立即调用，必须保持为公开接口。
  SupplyMap.setCustomRisk = function (riskMap) {
    ctx.customRisk = riskMap && typeof riskMap === 'object' ? Object.assign({}, riskMap) : null;
    // 在线地图暂不重绘底图；离线地图的点位与筛选保持不变，后续热力层可直接读取 ctx.customRisk。
    if (ctx.mode !== 'tencent' && ctx.mapEl) drawOffline();
    return ctx.customRisk;
  };
  SupplyMap.setMarkers = function (facilities) { ctx.all = facilities || []; if (ctx.mode === 'tencent' && ctx.markerLayer) setMarkersTencent(); else drawOffline(); };
  function resetView() { ctx.selectedId = null; if (ctx.onClear) ctx.onClear(); if (ctx.mode === 'tencent' && ctx.map) ctx.map.setCenter(new TMap.LatLng(35.86, 104.19)); else drawOffline(); }
  SupplyMap.focusSupplier = function (id) { const f = DB.getFacility(id); if (!f || !hasGeo(f)) { if (ctx.onSelect) ctx.onSelect(id); return; } ctx.selectedId = id; if (ctx.mode === 'tencent' && ctx.map) { ctx.map.setCenter(new TMap.LatLng(Number(f.lat), Number(f.lng))); ctx.map.setZoom(9); } else drawOffline(); if (ctx.onSelect) ctx.onSelect(id); };
  SupplyMap.clearSelection = function () { ctx.selectedId = null; };
  SupplyMap.scoreColor = scoreColor; SupplyMap.scaleSize = scaleSize; SupplyMap.hasGeo = hasGeo;
  SupplyMap.getMap = function () { return ctx.map; }; SupplyMap.getCenter = function () { return ctx.map && ctx.map.getCenter ? ctx.map.getCenter() : null; }; SupplyMap.getZoom = function () { return ctx.map && ctx.map.getZoom ? ctx.map.getZoom() : null; };
  global.SupplyMap = SupplyMap;
})(window);

/* ===== src/js/supplychain.js ===== */
/* 供应链看板：供应商分布（地图）+ 供应链列表（树形链路）双模块联动
 * 参考 Open Supply Hub：统一字段标准、开放协作（角色权限）、透明可追溯（异常预警/下钻）。
 * 支持：多维筛选、Excel 批量导入/导出、点-链联动、异常预警、示例数据。
 */
(function (global) {
  const SupplyChain = {};

  const STATUS = { active: T('合作中'), paused: T('暂停合作'), terminated: T('已终止'), potential: T('潜在') };
  const NODE_STATUS = { normal: T('正常'), delayed: T('延迟'), abnormal: T('异常'), halted: T('停工') };
  const ANOMALY = { '': T('无异常'), none: T('无异常'), delay: T('延迟交付'), quality: T('质量不合格'), halt: T('停产'), other: T('其他异常') };
  const TIER_LABEL = { Tier1: 'Tier 1', Tier2: 'Tier 2', Tier3: 'Tier 3', raw: T('原材料'), finished: T('成品') };

  const ui = { selectedSupplierId: null, collapsed: {}, map: { scoreMin: 0, scoreMax: 100 }, chain: {}, customRisk: null };

  function numOrNull(v) { if (v === '' || v == null) return null; const n = Number(v); return isNaN(n) ? null : n; }
  function statusFromLabel(v) {
    const s = String(v || '').trim();
    if (/active|合作中/.test(s)) return 'active';
    if (/paused|暂停/.test(s)) return 'paused';
    if (/terminated|已终止/.test(s)) return 'terminated';
    if (/potential|潜在/.test(s)) return 'potential';
    return 'active';
  }
  function anomalyFromLabel(v) {
    const s = String(v || '').trim();
    if (/none|无异常/.test(s)) return '';
    if (/delay|延迟交付/.test(s)) return 'delay';
    if (/quality|质量不合格/.test(s)) return 'quality';
    if (/halt|停产/.test(s)) return 'halt';
    if (/other|其他/.test(s)) return 'other';
    return '';
  }
  function tierFromLabel(v) {
    const s = String(v || '').trim().toLowerCase();
    if (/raw|原材料/.test(s)) return 'raw';
    if (/finished|成品/.test(s)) return 'finished';
    if (/1|一/.test(s)) return 'Tier1';
    if (/2|二/.test(s)) return 'Tier2';
    if (/3|三/.test(s)) return 'Tier3';
    return String(v || '').trim() || 'Tier1';
  }
  function tierLabel(v) { return TIER_LABEL[v] || v || 'Tier1'; }
  function canEdit() { return global.Auth && Auth.canEdit(); }
  function scoreLabel(score) {
    if (score == null) return T('未评估');
    if (score >= 90) return T('卓越');
    if (score >= 75) return T('优秀');
    if (score >= 60) return T('良好');
    if (score >= 40) return T('一般');
    return T('较差');
  }

  // ---------------- 主渲染（1:2 左右结构：左 1/3 地图+风险+筛选，右 2/3 绩效看板+追溯） ----------------
  SupplyChain.render = function (container) {
    container.innerHTML = '';
    ui.selectedSupplierId = null;
    const s = DB.get();

    // 顶部标题
    container.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('供应链') }),
        Util.el('div', { class: 'muted', text: T('评估得分与规模绩效看板') + ' · ' + T('地图地理分布') + ' · ' + T('区域风险自定义') })
      ]),
      Util.el('div', { class: 'btn-row' }, toolbarButtons())
    ]));

    if (!canEdit()) {
      container.appendChild(Util.el('div', { class: 'role-banner', text: T('管理层只读模式说明') }));
    }

    // 1:2 左右布局
    const split = Util.el('div', { class: 'sc-split' });

    // ===== 左侧面板（1/3）=====
    const leftPanel = Util.el('div', { class: 'panel card sc-left' });
    // 地图卡片
    const mapCard = Util.el('div', { class: 'sc-map-card' });
    mapCard.appendChild(Util.el('div', { class: 'sc-card-head' }, [
      Util.el('strong', { text: T('供应商分布地图') }),
      Util.el('span', { class: 'muted', style: 'font-weight:400', text: T('颜色=评估得分，大小=规模，红框=高风险区域') })
    ]));
    const mapEl = Util.el('div', { class: 'sc-map-host' });
    mapCard.appendChild(mapEl);
    leftPanel.appendChild(mapCard);

    // 地区风险等级自定义
    leftPanel.appendChild(buildRiskConfig());
    // 筛选区
    leftPanel.appendChild(buildMapToolbar());
    split.appendChild(leftPanel);

    // ===== 右侧面板（2/3）=====
    const rightPanel = Util.el('div', { class: 'panel card sc-right' });
    rightPanel.appendChild(buildPerformanceBoard());
    // 供应链追溯与异常预警必须在首次渲染时建立，避免刷新链路时找不到目标容器。
    rightPanel.appendChild(Util.el('div', { id: 'scAnomaly', class: 'sc-anomaly-box' }));
    rightPanel.appendChild(Util.el('div', { id: 'scChain', class: 'sc-chain-box' }, [buildChainToolbar(), Util.el('div', { id: 'scChainList' })]));
    split.appendChild(rightPanel);

    container.appendChild(split);

    // 挂载地图
    function mountMap() {
      SupplyMap.mount(mapEl, {
        onSelectSupplier: function (id) { ui.selectedSupplierId = id; SupplyMap.setMarkers(computeMapFacilities()); refreshSelectedChip(); renderPerformanceBoard(); refreshChain(); },
        onClearSelection: function () { ui.selectedSupplierId = null; SupplyMap.setMarkers(computeMapFacilities()); refreshSelectedChip(); renderPerformanceBoard(); refreshChain(); }
      });
      SupplyMap.setMarkers(computeMapFacilities());
      renderPerformanceBoard();
      refreshSelectedChip();
      refreshChain();
    }
    // 先挂载离线地图，确保无网络、测试环境和 Android WebView 中均有可用界面；在线地图随后增强替换。
    mountMap();
  };

  function toolbarButtons() {
    const btns = [];
    if (canEdit()) {
      btns.push(Util.el('button', { class: 'btn', onclick: () => downloadSupplierTemplate() }, T('下载供应商模板')));
      btns.push(Util.el('button', { class: 'btn', onclick: () => importFile('supplier') }, T('导入供应商')));
      btns.push(Util.el('button', { class: 'btn', onclick: () => downloadSupplyTemplate() }, T('下载供应链模板')));
      btns.push(Util.el('button', { class: 'btn', onclick: () => importFile('supply') }, T('导入供应链')));
      btns.push(Util.el('button', { class: 'btn btn-primary', onclick: seedSample }, T('生成示例数据')));
    }
    btns.push(Util.el('button', { class: 'btn', onclick: exportData }, T('导出数据')));
    return btns;
  }

  // ---------------- 左侧筛选（地区/风险等级/评估得分范围/规模/搜索） ----------------
  function buildMapToolbar() {
    const s = DB.get();
    const facs = s.facilities;
    const regionOps = uniqueOpts(facs.map((f) => f.region || f.city || f.country).filter(Boolean));
    const riskOps = [{ v: '', t: T('全部风险') }, { v: '低', t: T('低风险') }, { v: '中', t: T('中风险') }, { v: '高', t: T('高风险') }, { v: '极高', t: T('极高风险') }];
    const scaleOps = [{ v: '', t: T('全部规模') }, { v: '大型', t: T('大型') }, { v: '中型', t: T('中型') }, { v: '小型', t: T('小型') }, { v: '微型', t: T('微型') }];

    const search = Util.el('input', { class: 'input', placeholder: T('搜索供应商名称/编码'), value: ui.map.name || '' });
    search.addEventListener('input', () => { ui.map.name = search.value; SupplyMap.setMarkers(computeMapFacilities()); renderPerformanceBoard(); });
    const region = sel('scMapRegion', [{ v: '', t: T('全部地区') }].concat(regionOps), ui.map.region, (v) => { ui.map.region = v; SupplyMap.setMarkers(computeMapFacilities()); renderPerformanceBoard(); });
    const risk = sel('scMapRisk', riskOps, ui.map.risk, (v) => { ui.map.risk = v; SupplyMap.setMarkers(computeMapFacilities()); renderPerformanceBoard(); });
    const scale = sel('scMapScale', scaleOps, ui.map.scale, (v) => { ui.map.scale = v; SupplyMap.setMarkers(computeMapFacilities()); renderPerformanceBoard(); });

    // 评估得分范围滑块（0-100）
    const scoreMin = Util.el('input', { type: 'number', class: 'input sc-score-min', min: 0, max: 100, value: (ui.map.scoreMin != null ? ui.map.scoreMin : 0), placeholder: '0' });
    const scoreMax = Util.el('input', { type: 'number', class: 'input sc-score-max', min: 0, max: 100, value: (ui.map.scoreMax != null ? ui.map.scoreMax : 100), placeholder: '100' });
    const onScore = () => { ui.map.scoreMin = Number(scoreMin.value || 0); ui.map.scoreMax = Number(scoreMax.value || 100); SupplyMap.setMarkers(computeMapFacilities()); renderPerformanceBoard(); };
    scoreMin.addEventListener('input', onScore); scoreMax.addEventListener('input', onScore);

    const bar = Util.el('div', { class: 'sc-toolbar sc-filter-grid' }, [
      search, region, risk, scale,
      Util.el('div', { class: 'sc-score-range' }, [Util.el('span', { class: 'muted', text: T('得分') }), scoreMin, Util.el('span', { text: '~' }), scoreMax])
    ]);
    return bar;
  }

  function computeMapFacilities() {
    const s = DB.get();
    const m = ui.map;
    return s.facilities.filter((f) => {
      if (m.name) { const q = m.name.toLowerCase(); if (!((f.name || '').toLowerCase().includes(q) || (f.code || '').toLowerCase().includes(q))) return false; }
      if (m.region && (f.region || f.city || f.country) !== m.region) return false;
      if (m.risk && (f.regionRiskLevel || '') !== m.risk) return false;
      if (m.scale && (f.scale || '') !== m.scale) return false;
      // 未评估供应商仍需显示在地图上；仅在存在得分时应用得分区间筛选。
      const sc = f.score == null ? null : Number(f.score);
      if (sc != null && (sc < (m.scoreMin != null ? m.scoreMin : 0) || sc > (m.scoreMax != null ? m.scoreMax : 100))) return false;
      return true;
    });
  }

  // ---------------- 地区风险等级自定义（左侧面板） ----------------
  function defaultRiskLevels() {
    return { '华东': { level: '低', value: 0.2 }, '华南': { level: '中', value: 0.5 }, '华北': { level: '极高', value: 0.95 }, '华中': { level: '低', value: 0.25 }, '西南': { level: '中', value: 0.5 }, '西北': { level: '高', value: 0.78 }, '东北': { level: '低', value: 0.3 } };
  }
  function buildRiskConfig() {
    const card = Util.el('div', { class: 'sc-risk-card' });
    card.appendChild(Util.el('div', { class: 'sc-card-head' }, [
      Util.el('strong', { text: T('地区风险等级自定义') }),
      Util.el('button', { class: 'btn btn-sm', text: T('恢复默认'), onclick: () => { ui.customRisk = defaultRiskLevels(); SupplyMap.setCustomRisk(toRiskMap()); buildRiskConfigInto(card); if (window.L) renderRiskHeatNote(); } })
    ]));
    ui.customRisk = ui.customRisk || defaultRiskLevels();
    buildRiskConfigInto(card);
    return card;
  }
  function buildRiskConfigInto(card) {
    // 清理旧内容（保留 head）
    const head = card.querySelector('.sc-card-head');
    card.innerHTML = ''; card.appendChild(head);
    const levels = ['低', '中', '高', '极高'];
    const colors = { '低': '#1a73e8', '中': '#FFC107', '高': '#FF9800', '极高': '#F44336' };
    Object.keys(ui.customRisk).forEach((region) => {
      const cur = ui.customRisk[region];
      const row = Util.el('div', { class: 'sc-risk-row' }, [Util.el('span', { class: 'sc-risk-region', text: region })]);
      levels.forEach((lv) => {
        const dot = Util.el('button', { class: 'sc-risk-pick' + (cur.level === lv ? ' on' : ''), title: lv });
        dot.style.background = colors[lv];
        dot.setAttribute('aria-label', region + '：' + lv);
        dot.setAttribute('aria-pressed', String(cur.level === lv));
        dot.addEventListener('click', () => {
          if (!ui.customRisk[region]) ui.customRisk[region] = { level: lv, value: 0.2 };
          ui.customRisk[region].level = lv;
          ui.customRisk[region].value = { '低': 0.2, '中': 0.5, '高': 0.78, '极高': 0.95 }[lv];
          SupplyMap.setCustomRisk(toRiskMap());
          buildRiskConfigInto(card);
        });
        row.appendChild(dot);
      });
      const val = Util.el('span', { class: 'sc-risk-val', text: cur.value.toFixed(2) });
      row.appendChild(val);
      card.appendChild(row);
    });
    const saveBtn = Util.el('button', { class: 'btn btn-sm btn-primary sc-risk-save', text: T('保存配置'), onclick: () => { SupplyMap.setCustomRisk(toRiskMap()); Util.toast(T('地区风险等级已更新'), 'ok'); } });
    card.appendChild(saveBtn);
  }
  function toRiskMap() {
    const m = {};
    Object.keys(ui.customRisk).forEach((r) => { m[r] = ui.customRisk[r].value; });
    return m;
  }
  function renderRiskHeatNote() { /* 热力图随 setCustomRisk 已更新，无需额外操作 */ }

  // ---------------- 右侧绩效看板（仅评估得分 + 规模） ----------------
  function buildPerformanceBoard() {
    const board = Util.el('div', { class: 'sc-board' });
    board.id = 'scBoard';
    return board;
  }
  function renderPerformanceBoard() {
    const board = document.getElementById('scBoard'); if (!board) return;
    const facs = computeMapFacilities();
    board.innerHTML = '';

    // 1) 绩效排行榜 TOP10（按评估得分）
    const ranked = facs.slice().filter((f) => f.score != null).sort((a, b) => b.score - a.score).slice(0, 10);
    const medals = ['🥇', '🥈', '🥉'];
    const rankCard = Util.el('div', { class: 'sc-board-card' }, [Util.el('h3', { class: 'sc-board-title', text: T('供应商绩效排行榜（按评估得分）') })]);
    if (!ranked.length) rankCard.appendChild(Util.el('div', { class: 'empty', text: T('当前筛选范围内暂无已评估供应商') }));
    ranked.forEach((f, i) => {
      const row = Util.el('div', { class: 'sc-rank-row' + (f.id === ui.selectedSupplierId ? ' sel' : ''), style: 'cursor:pointer' }, [
        Util.el('span', { class: 'sc-rank-no', text: i < 3 ? medals[i] : (i + 1) + '.' }),
        Util.el('span', { class: 'sc-rank-name', text: f.name || '' }),
        Util.el('span', { class: 'sc-rank-score', style: 'color:' + SupplyMap.scoreColor(f.score), text: (f.score || 0) + ' · ' + SupplyMap.scaleSize(f.scale) + 'px' }),
        Util.el('span', { class: 'sc-rank-scale', text: f.scale || '-' })
      ]);
      row.addEventListener('click', () => { ui.selectedSupplierId = f.id; SupplyMap.focusSupplier(f.id); renderPerformanceBoard(); });
      rankCard.appendChild(row);
    });
    // 汇总行
    const avg = ranked.length ? Math.round(ranked.reduce((a, f) => a + f.score, 0) / ranked.length) : 0;
    const largePct = facs.length ? Math.round(facs.filter((f) => f.scale === '大型').length / facs.length * 100) : 0;
    rankCard.appendChild(Util.el('div', { class: 'sc-board-sum' }, [
      Util.el('span', { text: T('当前范围') + '：' + facs.length + T('家') }),
      Util.el('span', { text: T('平均得分') + '：' + avg }),
      Util.el('span', { text: T('大型占比') + '：' + largePct + '%' })
    ]));
    board.appendChild(rankCard);

    // 2) 规模分布
    const scaleDist = { '大型': 0, '中型': 0, '小型': 0, '微型': 0 };
    facs.forEach((f) => { if (scaleDist[f.scale] != null) scaleDist[f.scale]++; });
    const distCard = Util.el('div', { class: 'sc-board-card' }, [Util.el('h3', { class: 'sc-board-title', text: T('规模等级分布') })]);
    const maxScale = Math.max(1, ...Object.values(scaleDist));
    Object.keys(scaleDist).forEach((k) => {
      const pct = Math.round(scaleDist[k] / maxScale * 100);
      distCard.appendChild(Util.el('div', { class: 'sc-dist-row' }, [
        Util.el('span', { class: 'sc-dist-label', text: k }),
        Util.el('div', { class: 'sc-dist-bar-wrap' }, [Util.el('div', { class: 'sc-dist-bar', style: 'width:' + pct + '%;background:' + SupplyMap.scoreColor(scaleDist[k] > 0 ? 80 : 50) })]),
        Util.el('span', { class: 'sc-dist-num', text: scaleDist[k] })
      ]));
    });
    board.appendChild(distCard);

    // 3) 供应商详情卡片（选中时）/ 追溯路径
    if (ui.selectedSupplierId) {
      const f = DB.getFacility(ui.selectedSupplierId);
      if (f) {
        const dCard = Util.el('div', { class: 'sc-board-card' }, [Util.el('h3', { class: 'sc-board-title', text: T('供应商详情') })]);
        const sc = f.score == null ? null : f.score;
        dCard.appendChild(Util.el('div', { class: 'sc-detail-name', text: f.name || '' }));
        const scoreBar = Util.el('div', { class: 'sc-score-bar' }, [
          Util.el('div', { class: 'sc-score-fill', style: 'width:' + (sc || 0) + '%;background:' + SupplyMap.scoreColor(sc) })
        ]);
        dCard.appendChild(Util.el('div', { class: 'sc-detail-row' }, [Util.el('span', { text: T('评估得分') }), sc != null ? Util.el('span', { text: sc + ' / 100 · ' + scoreLabel(sc) }) : Util.el('span', { text: T('未评估') })]));
        dCard.appendChild(scoreBar);
        dCard.appendChild(Util.el('div', { class: 'sc-detail-row' }, [Util.el('span', { text: T('规模等级') }), Util.el('span', { text: f.scale || '-' + (f.employees ? '（' + f.employees + T('人') + '）' : '') })]));
        dCard.appendChild(Util.el('div', { class: 'sc-detail-row' }, [Util.el('span', { text: T('区域风险') }), Util.el('span', { text: f.regionRiskLevel || T('未设置') })]));
        dCard.appendChild(Util.el('div', { class: 'sc-detail-row' }, [Util.el('span', { text: T('所在地区') }), Util.el('span', { text: (f.country || '-') + ' / ' + (f.city || '-') })]));
        dCard.appendChild(Util.el('div', { class: 'sc-detail-row' }, [Util.el('span', { text: T('合作状态') }), Util.el('span', { text: STATUS[f.status] || f.status })]));
        const ops = Util.el('div', { class: 'sc-pop-ops' }, [
          Util.el('button', { class: 'btn btn-sm btn-primary', text: T('在地图聚焦'), onclick: () => SupplyMap.focusSupplier(f.id) }),
          Util.el('button', { class: 'btn btn-sm', text: T('关闭'), onclick: () => { ui.selectedSupplierId = null; SupplyMap.clearSelection(); renderPerformanceBoard(); } })
        ]);
        dCard.appendChild(ops);
        board.appendChild(dCard);

        // 追溯路径：该供应商上下游 supplyNodes
        const traceCard = Util.el('div', { class: 'sc-board-card' }, [Util.el('h3', { class: 'sc-board-title', text: T('供应链追溯路径') })]);
        const nodes = DB.get().supplyNodes.filter((n) => n.supplierId === f.id);
        if (!nodes.length) traceCard.appendChild(Util.el('div', { class: 'empty', text: T('该供应商暂无参与的供应链链路。') }));
        nodes.forEach((n) => {
          const follow = DB.get().supplyNodes.filter((x) => x.parentId === n.id);
          const line = Util.el('div', { class: 'sc-trace-node' }, [
            Util.el('span', { class: 'sc-trace-mat', text: n.material || '—' }),
            Util.el('span', { class: 'tier-badge', text: tierLabel(n.tier) }),
            Util.el('span', { class: 'sc-dot sm', style: 'background:' + nodeStatusColor(n.status) }),
            Util.el('span', { class: 'muted', text: NODE_STATUS[n.status] || n.status })
          ]);
          if (n.anomaly) line.appendChild(Util.el('span', { class: 'anom-tag', text: ANOMALY[n.anomaly] }));
          traceCard.appendChild(line);
          follow.forEach((c) => {
            const cf = DB.getFacility(c.supplierId);
            traceCard.appendChild(Util.el('div', { class: 'sc-trace-child' }, [
              Util.el('span', { text: '↳ ' + (c.material || '—') }),
              cf ? Util.el('span', { class: 'muted', text: ' · ' + cf.name }) : null
            ]));
          });
        });
        board.appendChild(traceCard);
      }
    } else {
      board.appendChild(Util.el('div', { class: 'sc-board-card sc-hint' }, [
        Util.el('div', { class: 'sc-board-title', text: T('供应商详情与追溯') }),
        Util.el('div', { class: 'muted', text: T('点击地图标记或排行榜中的供应商，查看其评估得分、规模与供应链追溯路径。') })
      ]));
    }
  }

  // ---------------- 供应链链路（树形 + 异常） ----------------
  function buildChainToolbar() {
    const s = DB.get();
    const nodes = s.supplyNodes;
    const tierOps = uniqueOpts(nodes.map((n) => n.tier).filter(Boolean));
    const search = sel('scChainSearch', T('搜索物料 / 供应商'), ui.chain.search, (v) => { ui.chain.search = v; refreshChain(); });
    const tier = sel('scChainTier', tierOps, ui.chain.tier, (v) => { ui.chain.tier = v; refreshChain(); });
    const status = sel('scChainStatus', [{ v: '', t: T('全部状态') }].concat(Object.keys(NODE_STATUS).map((k) => ({ v: k, t: NODE_STATUS[k] }))), ui.chain.status, (v) => { ui.chain.status = v; refreshChain(); });
    const anomaly = sel('scChainAnomaly', [{ v: '', t: T('全部异常') }].concat([['', T('无异常')]].concat(Object.keys(ANOMALY).filter((k) => k).map((k) => [k, ANOMALY[k]]))), ui.chain.anomaly, (v) => { ui.chain.anomaly = v; refreshChain(); });

    const toolRow = Util.el('div', { class: 'sc-toolbar' }, [search, tier, status, anomaly]);
    const head = Util.el('div', { class: 'sc-card-head' }, [
      Util.el('strong', { text: T('供应链列表') }),
      Util.el('span', { id: 'scSelChip', class: 'sc-sel-chip', style: 'display:none' })
    ]);
    if (canEdit()) {
      head.appendChild(Util.el('button', { class: 'btn btn-sm btn-primary', style: 'margin-left:auto', onclick: () => openNodeEditor(null) }, '+ ' + T('添加链路节点')));
    }
    return Util.el('div', {}, [head, toolRow]);
  }

  function computeNodes() {
    const s = DB.get();
    const c = ui.chain;
    return s.supplyNodes.filter((n) => {
      if (ui.selectedSupplierId && n.supplierId !== ui.selectedSupplierId) return false;
      if (c.search) { const q = c.search.toLowerCase(); const f = DB.getFacility(n.supplierId); if (!((n.material || '').toLowerCase().includes(q) || (f && (f.name || '').toLowerCase().includes(q)))) return false; }
      if (c.tier && n.tier !== c.tier) return false;
      if (c.status && n.status !== c.status) return false;
      if (c.anomaly) { if (c.anomaly === '' && n.anomaly) return false; if (c.anomaly !== '' && n.anomaly !== c.anomaly) return false; }
      return true;
    });
  }

  function refreshChain() {
    const host = document.getElementById('scChainList') || document.getElementById('scChain'); if (!host) return;
    const nodes = computeNodes();
    renderAnomalies();
    if (!nodes.length) {
      host.innerHTML = '';
      host.appendChild(Util.el('div', { class: 'empty', text: ui.selectedSupplierId ? T('该供应商暂无参与的供应链链路。') : T('暂无供应链数据，可点击「生成示例数据」或导入供应链模板。') }));
      return;
    }
    const byId = {}; nodes.forEach((n) => { byId[n.id] = n; });
    const childrenMap = {}; nodes.forEach((n) => { const p = n.parentId && byId[n.parentId] ? n.parentId : ''; (childrenMap[p] = childrenMap[p] || []).push(n); });
    const roots = childrenMap[''] || [];
    host.innerHTML = '';
    const treeRoot = Util.el('div', { class: 'sc-tree' });
    roots.forEach((r) => treeRoot.appendChild(renderNode(r, childrenMap, 0)));
    host.appendChild(treeRoot);
  }

  function renderNode(node, childrenMap, depth) {
    const hasKids = (childrenMap[node.id] && childrenMap[node.id].length) || false;
    const collapsed = !!ui.collapsed[node.id];
    const f = DB.getFacility(node.supplierId);
    const rowEl = Util.el('div', { class: 'sc-node' + (hasKids ? ' has-kids' : ''), style: 'padding-left:' + (8 + depth * 18) + 'px' });

    const toggle = Util.el('span', { class: 'sc-toggle', text: hasKids ? (collapsed ? '▸' : '▾') : '•' });
    if (hasKids) toggle.addEventListener('click', (e) => { e.stopPropagation(); ui.collapsed[node.id] = !ui.collapsed[node.id]; refreshChain(); });
    rowEl.appendChild(toggle);

    const main = Util.el('div', { class: 'sc-node-main' }, [
      Util.el('span', { class: 'sc-mat', text: node.material || '—' }),
      Util.el('span', { class: 'tier-badge', text: tierLabel(node.tier) }),
      f ? Util.el('span', { class: 'sc-sup', text: f.name || '' }) : Util.el('span', { class: 'muted', text: '—' })
    ]);
    const statusDot = Util.el('span', { class: 'sc-dot sm', style: 'background:' + nodeStatusColor(node.status) });
    main.appendChild(statusDot);
    if (node.anomaly) main.appendChild(Util.el('span', { class: 'anom-tag', text: ANOMALY[node.anomaly] }));
    rowEl.appendChild(main);

    if (f) {
      rowEl.appendChild(Util.el('button', { class: 'btn-icon', title: T('在地图聚焦'), html: Util.icon('eye'), onclick: (e) => { e.stopPropagation(); SupplyMap.focusSupplier(f.id); } }));
    }
    if (canEdit()) {
      rowEl.appendChild(Util.el('button', { class: 'btn-icon', title: T('编辑'), html: Util.icon('pencil'), onclick: (e) => { e.stopPropagation(); openNodeEditor(node); } }));
      rowEl.appendChild(Util.el('button', { class: 'btn-icon', title: T('删除'), html: Util.icon('trash'), onclick: (e) => { e.stopPropagation(); removeNode(node.id); } }));
    }

    const wrap = Util.el('div', { class: 'sc-node-wrap' }, [rowEl]);
    if (hasKids && !collapsed) {
      const kids = Util.el('div', { class: 'sc-kids' });
      childrenMap[node.id].forEach((c) => kids.appendChild(renderNode(c, childrenMap, depth + 1)));
      wrap.appendChild(kids);
    }
    return wrap;
  }

  function nodeStatusColor(st) { return ({ normal: '#2f9e54', delayed: '#d98a00', abnormal: '#dc3a36', halted: '#8a94a6' })[st] || '#2f9e54'; }

  function renderAnomalies() {
    const box = document.getElementById('scAnomaly'); if (!box) return;
    const anoms = DB.get().supplyNodes.filter((n) => (n.anomaly && n.anomaly !== '') || n.status === 'abnormal');
    box.innerHTML = '';
    if (!anoms.length) { box.style.display = 'none'; return; }
    box.style.display = '';
    box.appendChild(Util.el('div', { class: 'sc-anomaly-head' }, [Util.iconEl('info'), Util.el('strong', { text: T('异常预警') + ' (' + anoms.length + ')' })]));
    const list = Util.el('div', { class: 'sc-anomaly-list' });
    anoms.slice(0, 8).forEach((n) => {
      const f = DB.getFacility(n.supplierId);
      list.appendChild(Util.el('div', { class: 'sc-anomaly-item', style: 'cursor:pointer', onclick: () => drillDown(n.id) }, [
        Util.el('span', { class: 'anom-tag', text: ANOMALY[n.anomaly] || T('状态异常') }),
        Util.el('span', { class: 'sc-mat', text: n.material || '—' }),
        f ? Util.el('span', { class: 'muted', text: '· ' + f.name }) : null,
        Util.el('button', { class: 'btn btn-sm', style: 'margin-left:auto', text: T('一键下钻') })
      ]));
    });
    box.appendChild(list);
  }

  function drillDown(id) {
    const n = DB.getSupplyNode(id); if (!n) return;
    const f = DB.getFacility(n.supplierId);
    const body = Util.el('div', {}, [
      kvRow(T('物料/产品'), n.material),
      kvRow(T('层级'), tierLabel(n.tier)),
      kvRow(T('关联供应商'), f ? f.name + '（' + (f.code || '-') + '）' : '—'),
      kvRow(T('节点状态'), NODE_STATUS[n.status] || n.status),
      kvRow(T('异常标识'), ANOMALY[n.anomaly] || T('无异常')),
      kvRow(T('数量'), n.qty || '—'),
      kvRow(T('备注'), n.note || '—')
    ]);
    if (f) body.appendChild(Util.el('div', { class: 'row', style: 'margin-top:10px' }, [
      Util.el('button', { class: 'btn btn-primary', text: T('在地图聚焦'), onclick: function () { Util.closeModal(); SupplyMap.focusSupplier(f.id); } })
    ]));
    Util.modal(T('供应链节点详情'), body, [Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('关闭'))]);
  }
  function kvRow(k, v) {
    return Util.el('div', { class: 'kv-row' }, [Util.el('span', { class: 'kv-k', text: k }), Util.el('span', { class: 'kv-v', text: v == null ? '—' : String(v) })]);
  }

  function refreshSelectedChip() {
    const chip = document.getElementById('scSelChip'); if (!chip) return;
    if (!ui.selectedSupplierId) { chip.style.display = 'none'; return; }
    const f = DB.getFacility(ui.selectedSupplierId);
    if (!f) { chip.style.display = 'none'; return; }
    chip.style.display = '';
    chip.innerHTML = '';
    chip.appendChild(Util.el('span', { text: T('筛选：') + (f ? f.name : '') }));
    chip.appendChild(Util.el('button', { class: 'sc-chip-x', text: '✕', onclick: () => { ui.selectedSupplierId = null; SupplyMap.clearSelection(); refreshChain(); refreshSelectedChip(); SupplyMap.setMarkers(computeMapFacilities()); } }));
  }

  // ---------------- 节点编辑 ----------------
  function openNodeEditor(node) {
    const editing = node || null;
    const s = DB.get();
    const facs = s.facilities;
    const draft = editing ? Object.assign({}, editing) : { material: '', tier: 'Tier1', supplierId: '', parentId: '', status: 'normal', anomaly: '', qty: '', note: '' };
    const c = Util.el('div', {});
    const matI = Util.el('input', { type: 'text', class: 'inp', value: draft.material || '', placeholder: T('如 棉纱 / 成衣 / 电子元件') });
    const tierI = Util.el('select', { class: 'inp' });
    Object.keys(TIER_LABEL).forEach((k) => { const op = Util.el('option', { value: k, text: tierLabel(k) }); if (draft.tier === k) op.selected = true; tierI.appendChild(op); });
    const supI = Util.el('select', { class: 'inp' });
    supI.appendChild(Util.el('option', { value: '', text: T('— 未关联 —') }));
    facs.forEach((f) => { const op = Util.el('option', { value: f.id, text: (f.name || '') + '（' + (f.code || '') + '）' }); if (draft.supplierId === f.id) op.selected = true; supI.appendChild(op); });
    const parI = Util.el('select', { class: 'inp' });
    parI.appendChild(Util.el('option', { value: '', text: T('— 无（根节点/原材料）') }));
    s.supplyNodes.forEach((n) => { if (editing && n.id === editing.id) return; const op = Util.el('option', { value: n.id, text: n.material || '—' }); if (draft.parentId === n.id) op.selected = true; parI.appendChild(op); });
    const stI = Util.el('select', { class: 'inp' });
    Object.keys(NODE_STATUS).forEach((k) => { const op = Util.el('option', { value: k, text: NODE_STATUS[k] }); if (draft.status === k) op.selected = true; stI.appendChild(op); });
    const anI = Util.el('select', { class: 'inp' });
    Object.keys(ANOMALY).forEach((k) => { const op = Util.el('option', { value: k, text: ANOMALY[k] }); if ((draft.anomaly || '') === k) op.selected = true; anI.appendChild(op); });
    const qtyI = Util.el('input', { type: 'text', class: 'inp', value: draft.qty || '', placeholder: T('如 5000 件') });
    const noteI = Util.el('textarea', { class: 'inp', html: Util.esc(draft.note || '') });

    c.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('物料/产品名称') + ' *' }), matI]));
    c.appendChild(Util.el('div', { class: 'row' }, [
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('层级') }), tierI]),
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('节点状态') }), stI])
    ]));
    c.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('关联供应商') }), supI]));
    c.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('上游环节（父节点）') }), parI]));
    c.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('异常标识') }), anI]));
    c.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('数量') }), qtyI]));
    c.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('备注') }), noteI]));

    const ok = Util.el('button', { class: 'btn btn-primary', text: editing ? T('保存') : T('添加') });
    ok.addEventListener('click', () => {
      const material = matI.value.trim(); if (!material) { Util.toast(T('请填写物料/产品名称'), 'err'); return; }
      const obj = { material, tier: tierI.value, supplierId: supI.value, parentId: parI.value, status: stI.value, anomaly: anI.value, qty: qtyI.value.trim(), note: noteI.value.trim(), updatedAt: Date.now() };
      if (editing) { DB.updateSupplyNode(editing.id, obj).then(() => { Util.closeModal(); Util.toast(T('已保存'), 'ok'); SupplyMap.setMarkers(computeMapFacilities()); refreshChain(); }); }
      else { obj.id = Util.uid('sn'); obj.createdAt = Date.now(); DB.addSupplyNode(obj).then(() => { Util.closeModal(); Util.toast(T('已添加'), 'ok'); SupplyMap.setMarkers(computeMapFacilities()); refreshChain(); }); }
    });
    Util.modal(editing ? T('编辑供应链节点') : T('添加供应链节点'), c, [Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('取消')), ok]);
  }

  function removeNode(id) {
    Util.confirm(T('删除节点'), T('确认删除该供应链节点？其下级节点将自动解除上游关联。'), T('删除')).then((ok) => {
      if (!ok) return;
      DB.deleteSupplyNode(id).then(() => { Util.toast(T('已删除'), 'ok'); SupplyMap.setMarkers(computeMapFacilities()); refreshChain(); });
    });
  }

  // ---------------- 导入 / 导出 ----------------
  async function importFile(kind) {
    // 懒加载 XLSX（导入/导出共用）
    try { await ReportEngine.ensureLibs(['xlsx']); } catch (e) { Util.toast(T('Excel 组件加载失败：') + (e && e.message), 'err'); return; }
    const inp = Util.el('input', { type: 'file', accept: '.xlsx,.xls', style: 'display:none' });
    inp.addEventListener('change', () => {
      const file = inp.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const wb = global.XLSX.read(reader.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = global.XLSX.utils.sheet_to_json(ws, { defval: '' });
          if (kind === 'supplier') importSuppliers(rows);
          else importSupply(rows);
        } catch (e) { Util.toast(T('导入失败：') + e.message, 'err'); }
      };
      reader.readAsArrayBuffer(file);
    });
    document.body.appendChild(inp); inp.click();
    setTimeout(() => document.body.removeChild(inp), 1500);
  }

  function importSuppliers(rows) {
    const s = DB.get();
    let updated = 0, created = 0;
    const seen = {};
    rows.forEach((r) => {
      const code = String(r['供应商编码'] || '').trim();
      const name = String(r['供应商名称'] || '').trim();
      if (!code || !name) return;
      const data = {
        code, name,
        country: String(r['国家/地区'] || '').trim(),
        city: String(r['城市'] || '').trim(),
        lat: numOrNull(r['纬度(lat)']), lng: numOrNull(r['经度(lng)']),
        status: statusFromLabel(r['合作状态']),
        perfOnTime: numOrNull(r['准时交货率']), perfQuality: numOrNull(r['质量合格率']),
        score: numOrNull(r['评估得分']), scale: String(r['规模等级'] || '').trim(), regionRiskLevel: String(r['区域风险等级'] || '').trim(),
        creditCode: String(r['统一社会信用代码'] || '').trim(),
        contact: String(r['联系人'] || '').trim(),
        phone: String(r['联系电话'] || '').trim(),
        scope: String(r['经营范围'] || '').trim()
      };
      if (data.creditCode && !Util.validateCreditCode(data.creditCode)) data.creditCode = '';
      const existing = DB.getFacilityByCode(code) || (seen[code] ? seen[code] : null);
      if (existing) { DB.updateFacility(existing.id, data); updated++; }
      else { data.id = Util.uid('fac'); data.createdAt = Date.now(); data.updatedAt = Date.now(); data.tier = data.tier || ''; s.facilities.push(data); created++; seen[code] = data; }
    });
    DB.persist().then(() => { Util.toast(T('供应商已更新') + '（' + T('新增') + created + ' / ' + T('更新') + updated + '）', 'ok'); SupplyMap.setMarkers(computeMapFacilities()); });
  }

  function importSupply(rows) {
    const s = DB.get();
    const arr = rows.map((r, i) => {
      const o = {
        material: String(r['物料/产品名称'] || '').trim(),
        tier: tierFromLabel(r['层级']),
        supplierId: '', parentId: '', status: statusFromLabel(r['节点状态']), anomaly: anomalyFromLabel(r['异常标识']),
        qty: String(r['数量'] || '').trim(), note: String(r['备注'] || '').trim(),
        _code: String(r['关联供应商编码'] || '').trim(), _up: String(r['上游物料名称'] || '').trim(), _id: Util.uid('sn' + i)
      };
      return o;
    }).filter((o) => o.material);
    arr.forEach((o) => { if (o._code) { const f = DB.getFacilityByCode(o._code); o.supplierId = f ? f.id : ''; } });
    arr.forEach((o) => { if (o._up) { const p = arr.find((x) => x.material === o._up); o.parentId = p ? p._id : ''; } });
    const nodes = arr.map((o) => ({ id: o._id, material: o.material, tier: o.tier, supplierId: o.supplierId, parentId: o.parentId, status: o.status, anomaly: o.anomaly, qty: o.qty, note: o.note, createdAt: Date.now(), updatedAt: Date.now() }));
    DB.setSupplyNodes(nodes, false).then(() => { Util.toast(T('供应链已导入') + '（' + nodes.length + '）', 'ok'); SupplyMap.setMarkers(computeMapFacilities()); refreshChain(); });
  }

  async function downloadSupplierTemplate() {
    try { await ReportEngine.ensureLibs(['xlsx']); } catch (e) { Util.toast(T('Excel 组件加载失败：') + (e && e.message), 'err'); return; }
    const wb = global.XLSX.utils.book_new();
    const rows = [{ '供应商编码': 'SUP-001', '供应商名称': '示例工厂', '国家/地区': '中国', '城市': '深圳', '纬度(lat)': 22.54, '经度(lng)': 114.06, '合作状态': '合作中', '准时交货率': 95, '质量合格率': 98, '评估得分': 95, '规模等级': '大型', '区域风险等级': '低', '统一社会信用代码': '', '联系人': '', '联系电话': '', '经营范围': '' }];
    const ws = global.XLSX.utils.json_to_sheet(rows);
    global.XLSX.utils.book_append_sheet(wb, ws, '供应商');
    const out = global.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    Util.download(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), T('供应商模板') + '.xlsx');
  }
  async function downloadSupplyTemplate() {
    try { await ReportEngine.ensureLibs(['xlsx']); } catch (e) { Util.toast(T('Excel 组件加载失败：') + (e && e.message), 'err'); return; }
    const wb = global.XLSX.utils.book_new();
    const rows = [{ '物料/产品名称': '棉纱', '层级': '原材料', '关联供应商编码': 'SUP-001', '上游物料名称': '', '节点状态': '正常', '异常标识': '无异常', '数量': '1000kg', '备注': '' }];
    const ws = global.XLSX.utils.json_to_sheet(rows);
    global.XLSX.utils.book_append_sheet(wb, ws, '供应链');
    const out = global.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    Util.download(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), T('供应链模板') + '.xlsx');
  }

  async function exportData() {
    const s = DB.get();
    // 懒加载 XLSX
    try { await ReportEngine.ensureLibs(['xlsx']); } catch (e) { Util.toast(T('Excel 组件加载失败：') + (e && e.message), 'err'); return; }
    const facs = computeMapFacilities();
    const nodes = computeNodes();
    const fRows = facs.map((f) => ({
      '供应商编码': f.code, '供应商名称': f.name, '国家/地区': f.country, '城市': f.city,
      '纬度(lat)': f.lat, '经度(lng)': f.lng, '合作状态': STATUS[f.status] || f.status,
      '准时交货率': f.perfOnTime, '质量合格率': f.perfQuality, '评估得分': f.score, '规模等级': f.scale, '区域风险等级': f.regionRiskLevel, '统一社会信用代码': f.creditCode,
      '联系人': f.contact, '联系电话': f.phone, '经营范围': f.scope
    }));
    const nRows = nodes.map((n) => {
      const f = DB.getFacility(n.supplierId);
      return { '物料/产品名称': n.material, '层级': tierLabel(n.tier), '关联供应商编码': f ? f.code : '', '关联供应商': f ? f.name : '', '节点状态': NODE_STATUS[n.status], '异常标识': ANOMALY[n.anomaly], '数量': n.qty, '备注': n.note };
    });
    const wb = global.XLSX.utils.book_new();
    global.XLSX.utils.book_append_sheet(wb, global.XLSX.utils.json_to_sheet(fRows.length ? fRows : [{ '供应商编码': '' }]), '供应商');
    global.XLSX.utils.book_append_sheet(wb, global.XLSX.utils.json_to_sheet(nRows.length ? nRows : [{ '物料/产品名称': '' }]), '供应链');
    const out = global.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    Util.download(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), T('供应链数据导出') + '_' + Util.fmtDate(Date.now()) + '.xlsx');
    Util.toast(T('导出数据') + ' ✓', 'ok');
  }

  // ---------------- 示例数据 ----------------
  function seedSample() {
    const s = DB.get();
    // 数据格式：[编码, 名称, 国家, 城市, lat, lng, 状态, 准时率, 合格率, 层级, 信用代码, 评估得分, 规模, 区域风险]
    //   scale：大型/中型/小型/微型；regionRiskLevel：低/中/高/极高（自定义，影响热力图与地图红框提示）
    const data = [
      ['SUP-001', '深圳恒达服饰', '中国', '深圳', 22.54, 114.06, 'active', 96, 98, '一级供应商', '91440300MA5XXXXXXX1', 95, '大型', '低'],
      ['SUP-002', '东莞锦面料', '中国', '东莞', 23.02, 113.75, 'active', 88, 90, '二级供应商', '91441900MA5XXXXXXX2', 88, '中型', '中'],
      ['SUP-003', '苏州精工辅料', '中国', '苏州', 31.30, 120.62, 'paused', 70, 82, '二级供应商', '91320500MA5XXXXXXX3', 68, '中型', '高'],
      ['SUP-004', '上海远帆贸易', '中国', '上海', 31.23, 121.47, 'active', 93, 95, '品牌方 / 自有工厂', '91310000MA5XXXXXXX4', 93, '大型', '低'],
      ['SUP-005', '广州迅捷物流', '中国', '广州', 23.13, 113.26, 'active', 91, 99, '物流服务商', '91440100MA5XXXXXXX5', 91, '大型', '中'],
      ['SUP-006', '河内棉源纺织', '越南', '河内', 21.03, 105.85, 'potential', null, null, '原料供应商', '', 72, '小型', '高'],
      ['SUP-007', '胡志明成衣', '越南', '胡志明市', 10.82, 106.63, 'active', 84, 86, '代工厂 / OEM', '', 84, '中型', '中'],
      ['SUP-008', '东京精密元件', '日本', '东京', 35.68, 139.69, 'active', 97, 99, '原料供应商', '', 97, '小型', '低']
    ];
    data.forEach((d) => {
      const code = d[0];
      if (DB.getFacilityByCode(code)) return;
      s.facilities.push({ id: Util.uid('fac'), code: d[0], name: d[1], country: d[2], city: d[3], lat: d[4], lng: d[5], status: d[6], perfOnTime: d[7], perfQuality: d[8], tier: d[9], creditCode: d[10], score: d[11], scale: d[12], regionRiskLevel: d[13], contact: '', phone: '', scope: '', createdAt: Date.now(), updatedAt: Date.now() });
    });
    // 供应链链路：棉纱(原料,越南) → 面料(Tier2,东莞) → 成衣(Tier1,深圳,异常) → 成品出货(成品,上海)
    const sup = (code) => { const f = DB.getFacilityByCode(code); return f ? f.id : ''; };
    const chain = [
      ['棉纱', 'raw', 'SUP-006', '', 'normal', ''],
      ['印染面料', 'Tier2', 'SUP-002', '棉纱', 'normal', ''],
      ['辅料五金', 'Tier2', 'SUP-003', '棉纱', 'delayed', 'delay'],
      ['成衣加工', 'Tier1', 'SUP-001', '印染面料', 'abnormal', 'quality'],
      ['成衣代工', 'Tier1', 'SUP-007', '印染面料', 'normal', ''],
      ['成品出货', 'finished', 'SUP-004', '成衣加工', 'normal', '']
    ];
    const idByMat = {};
    chain.forEach((c, i) => { idByMat[c[0]] = Util.uid('sn' + i); });
    chain.forEach((c, i) => {
      s.supplyNodes.push({
        id: idByMat[c[0]], material: c[0], tier: c[1], supplierId: sup(c[2]), parentId: c[3] ? idByMat[c[3]] : '', status: c[4], anomaly: c[5], qty: '', note: '', createdAt: Date.now(), updatedAt: Date.now()
      });
    });
    DB.persist().then(() => { Util.toast(T('示例数据已生成'), 'ok'); SupplyMap.setMarkers(computeMapFacilities()); refreshChain(); });
  }

  // ---------------- 小工具 ----------------
  function uniqueOpts(arr) { const set = {}; arr.forEach((x) => { if (x) set[x] = true; }); return Object.keys(set).map((v) => ({ v: v, t: v })); }
  function sel(id, opts, value, onChange) {
    let placeholder = '';
    let optArr = opts;
    if (typeof opts === 'string') { placeholder = opts; optArr = []; }
    const el = Util.el('select', { class: 'sc-sel' });
    if (placeholder) el.appendChild(Util.el('option', { value: '', text: placeholder }));
    optArr.forEach((o) => { const op = Util.el('option', { value: o.v, text: o.t }); if (value && value === o.v) op.selected = true; el.appendChild(op); });
    if (placeholder && !value) el.value = '';
    el.addEventListener('change', () => onChange(el.value));
    return el;
  }

  global.SupplyChain = SupplyChain;
})(window);

/* ===== src/js/standards.js ===== */
/* 标准 / 法规 查看模块：分类浏览、关键词检索（高亮）、子条款标签筛选、用户上传 PDF、我的报告 */
(function (global) {
  const Standards = {};

  // 术语查询纯逻辑（提升到 IIFE 顶层，供 renderGlossary 与冒烟测试共用）
  function getAllTerms() {
    const seed = (global.StandardsSeed && global.StandardsSeed.termGlossary) || [];
    const custom = (DB.get().termGlossary || []);
    return seed.concat(custom);
  }
  // 单条术语匹配（中文 / 英文 / 拼音 / 缩写 / 定义）
  function matchTerm(t, q, discipline, source) {
    if (discipline && t.discipline !== discipline) return false;
    if (source && t.source !== source) return false;
    if (q) {
      const hay = [t.term, t.termEn, (t.aliases || []).join(' '), t.py || '', t.pyAbbr || '', t.definition || ''].join(' ').toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  }

  Standards.render = function (mount) {
    mount.innerHTML = '';
    let groups = [], allItems = [], cats = [];

    function refreshData() {
      groups = DB.getStandardsByCategory();
      allItems = [];
      groups.forEach((g) => g.items.forEach((s) => allItems.push(s)));
      cats = (global.StandardsSeed.categories || []).slice();
      allItems.forEach((s) => { if (cats.indexOf(s.category) < 0) cats.push(s.category); });
    }
    refreshData();

    const root = mount;
    let activeCat = 'all';
    let kw = '';
    let activeTag = '';
    // 术语查询子模块本地状态
    let gKw = '';
    let gDisc = '';
    let gSource = '';
    let glossaryTabEl = null;

    // ---------- 头部 ----------
    const head = Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('标准 / 法规') }),
        Util.el('div', { class: 'muted', text: T('查看主要社会责任、职业安全与国内劳动/消防/环保法规的最新版本与关键条款；支持全文检索高亮、按子条款标签筛选，并可上传自有标准/报告 PDF。') })
      ]),
      Util.el('div', {}, [
        Util.el('button', { class: 'btn', html: Util.icon('info') + T(' 说明'), onclick: () => showHelp() }),
        Util.el('button', { class: 'btn btn-primary', html: Util.icon('up') + T(' 上传标准/报告'), onclick: () => openUpload() })
      ])
    ]);
    mount.appendChild(head);

    if (!allItems.length) {
      mount.appendChild(Util.el('div', { class: 'empty', text: T('暂无标准数据。') }));
      return;
    }

    // ---------- 分类 tab ----------
    const tabs = Util.el('div', { class: 'std-tabs' });
    function mkTab(val, label) {
      const b = Util.el('button', { class: 'std-tab' + (val === activeCat ? ' active' : ''), text: label });
      b.addEventListener('click', () => {
        activeCat = val;
        tabs.querySelectorAll('.std-tab').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        var isSpecial = val.indexOf('__') === 0;
        tagBar.style.display = isSpecial ? 'none' : '';
        search.style.display = isSpecial ? 'none' : '';
        renderGrid();
      });
      return b;
    }
    tabs.appendChild(mkTab('all', T('全部')));
    cats.forEach((c) => tabs.appendChild(mkTab(c, T(c))));
    tabs.appendChild(mkTab('__reports', T('我的报告')));
    tabs.appendChild(mkTab('__auditflow', T('审核流程')));
    tabs.appendChild(mkTab('__checklists', T('合规自查')));
    tabs.appendChild(mkTab('__trends', T('趋势更新')));
    glossaryTabEl = mkTab('__glossary', T('术语查询'));
    tabs.appendChild(glossaryTabEl);
    mount.appendChild(tabs);

    // ---------- 标签筛选条 ----------
    const tagBar = Util.el('div', { class: 'std-tags-filter' });
    function renderTagBar() {
      tagBar.innerHTML = '';
      const all = [];
      allItems.forEach((s) => {
        (s.tags || []).forEach((t) => { if (all.indexOf(t) < 0) all.push(t); });
        (s.clauses || []).forEach((c) => (c.tags || []).forEach((t) => { if (all.indexOf(t) < 0) all.push(t); }));
      });
      if (!all.length) { tagBar.style.display = 'none'; return; }
      tagBar.style.display = '';
      tagBar.appendChild(Util.el('span', { class: 'std-tag-label', text: T('标签：') }));
      const allChip = Util.el('span', { class: 'std-tag' + (!activeTag ? ' active' : ''), text: T('全部') });
      allChip.addEventListener('click', () => setTag(''));
      tagBar.appendChild(allChip);
      all.sort().forEach((t) => {
        const chip = Util.el('span', { class: 'std-tag' + (activeTag === t ? ' active' : ''), html: Util.highlight(t, kw) });
        chip.addEventListener('click', () => setTag(t));
        tagBar.appendChild(chip);
      });
    }
    function setTag(t) { activeTag = (activeTag === t) ? '' : t; renderTagBar(); renderGrid(); }
    mount.appendChild(tagBar);
    renderTagBar();

    // ---------- 搜索 ----------
    const search = Util.el('input', { type: 'text', class: 'std-search', placeholder: T('🔍 搜索标准名称 / 版本 / 标签 / 条款关键词（如 强迫劳动、消防验收、SA8000）') });
    search.addEventListener('input', () => { kw = search.value; renderTagBar(); renderGrid(); });
    mount.appendChild(search);

    // ---------- 卡片网格 ----------
    const grid = Util.el('div', { class: 'std-grid' });

    function renderGrid() {
      grid.innerHTML = '';
      if (activeCat === '__reports') { renderReports(); return; }
      if (activeCat === '__auditflow') { renderAuditFlow(); return; }
      if (activeCat === '__checklists') { renderChecklists(); return; }
      if (activeCat === '__trends') { renderTrends(); return; }
      if (activeCat === '__glossary') { renderGlossary(); return; }
      const q = kw.trim().toLowerCase();
      let shown = 0;
      groups.forEach((g) => {
        if (activeCat !== 'all' && g.category !== activeCat) return;
        g.items.forEach((s) => {
          const hay = (s.name + ' ' + s.code + ' ' + (s.version || '') + ' ' + (s.summary || '') + ' ' + (s.category || '') + ' ' + (s.org || '') + ' ' + (s.tags || []).join(' ')).toLowerCase();
          const cl = (s.clauses || []).map((c) => c.title + c.content + ' ' + (c.tags || []).join(' ')).join(' ').toLowerCase();
          if (q && hay.indexOf(q) < 0 && cl.indexOf(q) < 0) return;
          if (activeTag) {
            const tset = (s.tags || []).concat((s.clauses || []).reduce((a, c) => a.concat(c.tags || []), []));
            if (tset.indexOf(activeTag) < 0) return;
          }
          shown++;
          grid.appendChild(stdCard(s));
        });
      });
      if (!shown) grid.appendChild(Util.el('div', { class: 'empty', text: T('没有匹配的标准，试试其它关键词、分类或标签。') }));
    }

    function stdCard(s) {
      const card = Util.el('div', { class: 'std-card', style: 'cursor:pointer' });
      const top = Util.el('div', { class: 'std-card-top' }, [
        Util.el('span', { class: 'std-cat', text: s.category }),
        s.source === 'user' ? Util.el('span', { class: 'std-badge', text: T('用户') }) : null,
        s.pdfDocId ? Util.el('span', { class: 'std-badge std-badge-pdf', text: '📄 PDF' }) : null
      ]);
      card.appendChild(top);
      card.appendChild(Util.el('div', { class: 'std-name', html: Util.highlight(s.name, kw) }));
      card.appendChild(Util.el('div', { class: 'std-ver', html: T('版本：') + Util.esc(s.version || '—') }));
      if (s.effective) card.appendChild(Util.el('div', { class: 'std-eff muted', text: s.effective }));
      card.appendChild(Util.el('div', { class: 'std-sum', html: Util.highlight(s.summary || '', kw) }));
      card.appendChild(Util.el('div', { class: 'std-foot', html: T('<span class="muted">关键条款 ') + (s.clauses ? s.clauses.length : 0) + T(' 项</span> › 查看') }));
      card.addEventListener('click', () => openDetail(s));
      return card;
    }

    function renderReports() {
      grid.innerHTML = T('<div class="muted" style="padding:16px">加载中…</div>');
      DB.getDocs('report').then((docs) => {
        grid.innerHTML = '';
        if (!docs.length) {
          grid.appendChild(Util.el('div', { class: 'empty', text: T('还没有上传报告。点击右上角「⬆ 上传标准/报告」可添加 PDF 报告。') }));
          return;
        }
        docs.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
        docs.forEach((d) => grid.appendChild(reportCard(d)));
      });
    }

    function reportCard(d) {
      const row = Util.el('div', { class: 'rep-card' }, [
        Util.el('div', { class: 'rep-ico', text: '📄' }),
        Util.el('div', { class: 'rep-mid' }, [
          Util.el('div', { class: 'rep-name', text: d.name }),
          Util.el('div', { class: 'rep-meta muted', text: (d.facility ? (T('关联供应商：') + d.facility + ' · ') : '') + Util.fmtDate(d.uploadedAt) + ' · ' + Math.round((d.size || 0) / 1024) + ' KB' })
        ]),
        Util.el('div', { class: 'rep-ops' }, [
          Util.el('button', { class: 'btn', onclick: () => showPdfModal(d) }, T('查看')),
          Util.el('button', { class: 'btn', onclick: () => downloadDoc(d) }, T('下载')),
          Util.el('button', { class: 'btn btn-danger', onclick: () => removeDoc(d) }, T('删除'))
        ])
      ]);
      return row;
    }

    // ---------- 审核流程 ----------
    function renderAuditFlow() {
      grid.innerHTML = '';
      const flow = (global.StandardsSeed.auditFlow || []);
      if (!flow.length) { grid.appendChild(Util.el('div', { class: 'empty', text: T('暂无审核流程数据。') })); return; }
      const wrap = Util.el('div', { class: 'audit-flow' });
      flow.forEach((stage) => {
        const card = Util.el('div', { class: 'audit-step' });
        card.appendChild(Util.el('div', { class: 'audit-step-num', text: String(stage.step) }));
        const body = Util.el('div', { class: 'audit-step-body' });
        body.appendChild(Util.el('div', { class: 'audit-step-title', text: stage.title }));
        body.appendChild(Util.el('div', { class: 'audit-step-meta muted', text: T('时长：') + stage.duration + ' · ' + T('参与方：') + stage.participants }));
        if (stage.keyPoints && stage.keyPoints.length) {
          const ul = Util.el('ul', { class: 'audit-step-points' });
          stage.keyPoints.forEach((p) => ul.appendChild(Util.el('li', { html: Util.highlight(p, kw) })));
          body.appendChild(ul);
        }
        if (stage.documents && stage.documents.length) {
          const docHost = Util.el('div', { class: 'audit-step-docs' });
          docHost.appendChild(Util.el('span', { class: 'audit-step-doc-label muted', text: T('需准备文件：') }));
          stage.documents.forEach((d) => docHost.appendChild(Util.el('span', { class: 'std-tag', html: Util.highlight(d, kw) })));
          body.appendChild(docHost);
        }
        card.appendChild(body);
        wrap.appendChild(card);
      });
      grid.appendChild(wrap);
    }

    // ---------- 合规自查清单 ----------
    function renderChecklists() {
      grid.innerHTML = '';
      const lists = (global.StandardsSeed.checklists || []);
      if (!lists.length) { grid.appendChild(Util.el('div', { class: 'empty', text: T('暂无自查清单数据。') })); return; }
      const wrap = Util.el('div', { class: 'checklist-wrap' });
      lists.forEach((mod) => {
        const card = Util.el('div', { class: 'checklist-module' });
        const head = Util.el('div', { class: 'checklist-module-head' }, [
          Util.el('span', { class: 'checklist-module-icon', html: Util.icon(mod.icon || 'check') }),
          Util.el('span', { class: 'checklist-module-title', text: mod.module }),
          Util.el('span', { class: 'checklist-priority-badge priority-' + mod.priority, text: '★'.repeat(mod.priority) })
        ]);
        card.appendChild(head);
        const tbl = Util.el('table', { class: 'checklist-table' });
        tbl.appendChild(Util.el('thead', {}, [Util.el('tr', {}, [
          Util.el('th', { style: 'width:28px', text: '' }),
          Util.el('th', { text: T('核查项目') }),
          Util.el('th', { text: T('合规标准') }),
          Util.el('th', { text: T('所需佐证材料') }),
          Util.el('th', { style: 'width:70px', text: T('级别') })
        ])]));
        const tb = Util.el('tbody');
        (mod.items || []).forEach((item) => {
          const tr = Util.el('tr', { class: 'checklist-row priority-' + item.priority });
          const cb = Util.el('input', { type: 'checkbox' });
          tr.appendChild(Util.el('td', {}, [cb]));
          tr.appendChild(Util.el('td', { class: 'checklist-check', html: Util.highlight(item.check, kw) }));
          tr.appendChild(Util.el('td', { class: 'checklist-std', html: Util.highlight(item.standard || '', kw) }));
          tr.appendChild(Util.el('td', { class: 'checklist-evi muted', html: Util.highlight(item.evidence || '', kw) }));
          const badge = Util.el('span', { class: 'priority-tag priority-tag-' + item.priority, text: item.priority === 'critical' ? T('必查') : item.priority === 'major' ? T('重点') : T('一般') });
          tr.appendChild(Util.el('td', {}, [badge]));
          tb.appendChild(tr);
        });
        tbl.appendChild(tb);
        card.appendChild(tbl);
        wrap.appendChild(card);
      });
      grid.appendChild(wrap);
    }

    // ---------- 趋势更新 ----------
    function renderTrends() {
      grid.innerHTML = '';
      const trends = (global.StandardsSeed.trends2025 || []);
      if (!trends.length) { grid.appendChild(Util.el('div', { class: 'empty', text: T('暂无趋势数据。') })); return; }
      const wrap = Util.el('div', { class: 'trends-wrap' });
      trends.forEach((t) => {
        const card = Util.el('div', { class: 'trend-card' });
        const impactRaw = t.impact || '中';
        const impactKey = { '高': '影响：高', '中': '影响：中', '低': '影响：低' }[impactRaw] || '影响：中';
        const head = Util.el('div', { class: 'trend-card-head' }, [
          Util.el('span', { class: 'trend-new-badge', text: T('NEW') }),
          Util.el('span', { class: 'trend-impact impact-' + impactRaw, text: T(impactKey) })
        ]);
        card.appendChild(head);
        card.appendChild(Util.el('div', { class: 'trend-title', html: Util.highlight(t.title, kw) }));
        card.appendChild(Util.el('div', { class: 'trend-desc', html: Util.highlight(t.description || '', kw) }));
        if (t.affectedStandards && t.affectedStandards.length) {
          const sh = Util.el('div', { class: 'trend-affected' });
          sh.appendChild(Util.el('span', { class: 'muted', text: T('涉及标准：') }));
          t.affectedStandards.forEach((s) => sh.appendChild(Util.el('span', { class: 'std-tag', text: s })));
          card.appendChild(sh);
        }
        if (t.actionRequired) {
          card.appendChild(Util.el('div', { class: 'trend-action', html: '<b>' + T('行动要求：') + '</b>' + Util.esc(t.actionRequired) }));
        }
        wrap.appendChild(card);
      });
      grid.appendChild(wrap);
    }

    // ---------- 术语查询子模块 ----------
    function chipBtn(label, active, onclick) {
      const c = Util.el('span', { class: 'gloss-chip' + (active ? ' active' : ''), text: label });
      c.addEventListener('click', onclick);
      return c;
    }
    function glossField(label, input) {
      return Util.el('div', { class: 'form-row' }, [Util.el('label', { class: 'form-label', text: label }), Util.el('div', { class: 'form-vals' }, [input])]);
    }

    function renderGlossary() {
      grid.innerHTML = '';
      const wrap = Util.el('div', { class: 'glossary' });

      const toolbar = Util.el('div', { class: 'gloss-toolbar' });
      const gsearch = Util.el('input', { type: 'text', class: 'std-search', placeholder: T('🔍 搜索术语（中文 / 英文 / 拼音 / 缩写，如 qpld、smeta、强迫劳动）'), value: gKw });
      gsearch.addEventListener('input', () => { gKw = gsearch.value; renderGlossary(); });
      toolbar.appendChild(gsearch);

      const discs = [];
      getAllTerms().forEach((t) => { if (t.discipline && discs.indexOf(t.discipline) < 0) discs.push(t.discipline); });
      const discBar = Util.el('div', { class: 'gloss-discs' });
      discBar.appendChild(chipBtn(T('全部学科'), gDisc === '', () => { gDisc = ''; renderGlossary(); }));
      discs.forEach((d) => discBar.appendChild(chipBtn(d, gDisc === d, () => { gDisc = d; renderGlossary(); })));
      toolbar.appendChild(discBar);

      const srcBar = Util.el('div', { class: 'gloss-srcs' });
      const srcs = [];
      getAllTerms().forEach((t) => { if (t.source && srcs.indexOf(t.source) < 0) srcs.push(t.source); });
      srcBar.appendChild(Util.el('span', { class: 'gloss-src-label', text: T('来源：') }));
      srcBar.appendChild(chipBtn(T('全部'), gSource === '', () => { gSource = ''; renderGlossary(); }));
      srcs.forEach((s) => srcBar.appendChild(chipBtn(s, gSource === s, () => { gSource = s; renderGlossary(); })));
      srcBar.appendChild(Util.el('button', { class: 'btn btn-primary btn-sm', html: Util.icon('plus') + T(' 自定义术语'), onclick: () => openTermEditor(null) }));
      toolbar.appendChild(srcBar);
      wrap.appendChild(toolbar);

      const q = gKw.trim().toLowerCase();
      const all = getAllTerms().filter((t) => matchTerm(t, q, gDisc, gSource));

      if (!all.length) {
        wrap.appendChild(Util.el('div', { class: 'empty', text: gSource ? (T('没有来源为「') + gSource + T('」的术语。可切换为「全部」或新增自定义术语。')) : T('没有匹配的术语，换个关键词试试。') }));
        grid.appendChild(wrap); return;
      }
      const list = Util.el('div', { class: 'gloss-list' });
      all.forEach((t) => {
        const card = Util.el('div', { class: 'gloss-card', style: 'cursor:pointer' }, [
          Util.el('div', { class: 'gloss-card-head' }, [
            Util.el('span', { class: 'gloss-term', html: Util.highlight(t.term, gKw) }),
            t.termEn ? Util.el('span', { class: 'gloss-en muted', text: t.termEn }) : null,
            t.custom ? Util.el('span', { class: 'std-badge', text: T('自定义') }) : null
          ]),
          Util.el('div', { class: 'gloss-meta' }, [
            Util.el('span', { class: 'gloss-src', text: t.source }),
            Util.el('span', { class: 'gloss-disc', text: t.discipline })
          ]),
          Util.el('div', { class: 'gloss-def muted', html: Util.highlight((t.definition || '').slice(0, 84) + ((t.definition || '').length > 84 ? '…' : ''), gKw) })
        ]);
        card.addEventListener('click', () => termDetail(t));
        list.appendChild(card);
      });
      wrap.appendChild(list);
      grid.appendChild(wrap);
    }

    function termDetail(t) {
      const body = Util.el('div', { style: 'max-height:72vh;overflow:auto' });
      body.appendChild(Util.el('div', { class: 'gloss-d-term' }, [
        Util.el('span', { class: 'gloss-d-name', text: t.term }),
        t.termEn ? Util.el('span', { class: 'gloss-d-en muted', text: t.termEn }) : null,
        t.custom ? Util.el('span', { class: 'std-badge', text: T('自定义') }) : null
      ]));
      body.appendChild(Util.el('div', { class: 'gloss-d-meta' }, [
        Util.el('span', { class: 'gloss-src', text: T('来源：') + t.source }),
        Util.el('span', { class: 'gloss-disc', text: T('学科：') + t.discipline })
      ]));
      if (t.aliases && t.aliases.length) {
        body.appendChild(Util.el('div', { class: 'gloss-d-sec', text: T('别名 / 缩写') }));
        const al = Util.el('div', { class: 'gloss-d-aliases' });
        t.aliases.forEach((a) => al.appendChild(Util.el('span', { class: 'gloss-chip', text: a })));
        body.appendChild(al);
      }
      body.appendChild(Util.el('div', { class: 'gloss-d-sec', text: T('定义') }));
      body.appendChild(Util.el('div', { class: 'gloss-d-def', text: t.definition || '—' }));
      if (t.detail) { body.appendChild(Util.el('div', { class: 'gloss-d-sec', text: T('详细说明') })); body.appendChild(Util.el('div', { class: 'gloss-d-detail', text: t.detail })); }
      if (t.related && t.related.length) {
        body.appendChild(Util.el('div', { class: 'gloss-d-sec', text: T('相关术语') }));
        const rel = Util.el('div', { class: 'gloss-d-aliases' });
        const all = getAllTerms();
        t.related.forEach((rn) => {
          const rt = all.find((x) => x.term === rn);
          const c = Util.el('span', { class: 'gloss-chip' + (rt ? ' link' : ''), text: rn });
          if (rt) c.addEventListener('click', () => { Util.closeModal(); termDetail(rt); });
          rel.appendChild(c);
        });
        body.appendChild(rel);
      }
      const foot = [];
      if (t.custom) {
        foot.push(Util.el('button', { class: 'btn', html: Util.icon('pencil') + T(' 编辑'), onclick: () => { Util.closeModal(); openTermEditor(t); } }));
        foot.push(Util.el('button', { class: 'btn btn-danger', html: Util.icon('trash') + T(' 删除'), onclick: () => {
          Util.confirm(T('删除术语'), T('确认删除自定义术语「') + t.term + T('」？'), T('删除')).then((ok) => {
            if (!ok) return;
            const st = DB.get(); st.termGlossary = (st.termGlossary || []).filter((x) => x.id !== t.id);
            DB.persist().then(() => { Util.closeModal(); Util.toast(T('已删除'), 'ok'); renderGlossary(); });
          });
        } }));
      }
      foot.push(Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('关闭')));
      Util.modal(t.term, body, foot);
    }

    function openTermEditor(t) {
      const isEdit = !!t;
      const draft = t ? Object.assign({}, t) : { term: '', termEn: '', aliases: '', source: T('自定义'), discipline: T('通用'), definition: '', detail: '' };
      const form = Util.el('div', { class: 'upload-form' });
      const termI = Util.el('input', { type: 'text', class: 'inp', value: draft.term, placeholder: T('如 强迫劳动') });
      const enI = Util.el('input', { type: 'text', class: 'inp', value: draft.termEn || '', placeholder: T('英文（可选）') });
      const aliasI = Util.el('input', { type: 'text', class: 'inp', value: draft.aliases ? (Array.isArray(draft.aliases) ? draft.aliases.join(', ') : draft.aliases) : '', placeholder: T('别名/缩写，逗号分隔') });
      const srcI = Util.el('input', { type: 'text', class: 'inp', value: draft.source, placeholder: T('来源标准，如 RBA / 自定义') });
      const discSel = Util.el('select', { class: 'inp' });
      [T('通用'), T('劳工'), T('健康安全'), T('环境'), T('商业道德'), T('反恐'), T('管理体系')].forEach((d) => { const o = Util.el('option', { value: d, text: d }); if (draft.discipline === d) o.selected = true; discSel.appendChild(o); });
      const defI = Util.el('textarea', { class: 'inp', rows: '3', placeholder: T('定义（具体、可核验）') }); defI.value = draft.definition || '';
      const detI = Util.el('textarea', { class: 'inp', rows: '3', placeholder: T('详细说明（可选）') }); detI.value = draft.detail || '';
      form.appendChild(glossField(T('术语（中文）*'), termI));
      form.appendChild(glossField(T('英文'), enI));
      form.appendChild(glossField(T('别名 / 缩写'), aliasI));
      form.appendChild(glossField(T('来源'), srcI));
      form.appendChild(glossField(T('学科'), discSel));
      form.appendChild(glossField(T('定义'), defI));
      form.appendChild(glossField(T('详细说明'), detI));

      const saveBtn = Util.el('button', { class: 'btn btn-primary', text: isEdit ? T('保存') : T('新增') });
      saveBtn.addEventListener('click', () => {
        const term = termI.value.trim();
        if (!term) { Util.toast(T('请填写术语'), 'err'); return; }
        const obj = {
          term: term, termEn: enI.value.trim(),
          aliases: aliasI.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
          source: srcI.value.trim() || T('自定义'),
          discipline: discSel.value,
          definition: defI.value.trim(), detail: detI.value.trim(), custom: true
        };
        const st = DB.get();
        if (isEdit) { Object.assign(draft, obj); st.termGlossary = (st.termGlossary || []).map((x) => x.id === draft.id ? draft : x); }
        else { draft.id = Util.uid('tg'); Object.assign(draft, obj); st.termGlossary = (st.termGlossary || []).concat([draft]); }
        DB.persist().then(() => { Util.closeModal(); Util.toast(isEdit ? T('已保存') : T('已新增术语'), 'ok'); renderGlossary(); });
      });
      Util.modal(isEdit ? T('编辑术语') : T('新增术语'), form, [Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('取消')), saveBtn]);
    }

    // 上下文感知：从标准详情一键跳转术语并限定来源
    function gotoGlossary(source) {
      gSource = source || '';
      gDisc = ''; gKw = '';
      activeCat = '__glossary';
      tabs.querySelectorAll('.std-tab').forEach((x) => x.classList.remove('active'));
      if (glossaryTabEl) glossaryTabEl.classList.add('active');
      tagBar.style.display = 'none'; search.style.display = 'none';
      renderGrid();
    }

    function openDetail(s) {
      const body = Util.el('div', { style: 'max-height:72vh;overflow:auto' });
      const meta = Util.el('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px' });
      meta.appendChild(tag(s.category));
      if (s.org) meta.appendChild(Util.el('span', { class: 'std-meta', text: T('发布：') + s.org }));
      meta.appendChild(Util.el('span', { class: 'std-meta', text: T('版本：') + (s.version || '—') }));
      meta.appendChild(Util.el('span', { class: 'std-meta', text: s.effective || '' }));
      body.appendChild(meta);
      if (s.summary) body.appendChild(Util.el('div', { class: 'std-detail-sum', html: Util.highlight(s.summary, kw) }));
      if (s.officialUrl) body.appendChild(Util.el('div', { class: 'std-url muted', text: T('官方信息：') + s.officialUrl }));

      // 客户验厂评分标准与零容忍项
      var cDetail = (global.StandardsSeed.customerDetails || {})[s.code];
      if (cDetail) {
        body.appendChild(Util.el('div', { class: 'std-cl-title', text: T('评分标准') }));
        var scTbl = Util.el('table', { class: 'cust-score-table' });
        scTbl.appendChild(Util.el('thead', {}, [Util.el('tr', {}, [
          Util.el('th', { text: T('维度') }), Util.el('th', { text: T('满分') }), Util.el('th', { text: T('通过线') }), Util.el('th', { text: T('考核项') })
        ])]));
        var scBody = Util.el('tbody');
        (cDetail.scoring || []).forEach(function (sc) {
          scBody.appendChild(Util.el('tr', {}, [
            Util.el('td', { text: sc.dimension }),
            Util.el('td', { class: 'tc', text: String(sc.maxScore) }),
            Util.el('td', { class: 'tc', text: '≥' + sc.passingScore }),
            Util.el('td', { class: 'muted', text: sc.items })
          ]));
        });
        scTbl.appendChild(scBody);
        body.appendChild(scTbl);
        var lvlRow = Util.el('div', { class: 'cust-levels' });
        var lvlClassMap = { '绿灯': 'pass', '黄灯': 'cond', '红灯': 'fail', '通过': 'pass', '条件通过': 'cond', '不通过': 'fail' };
        (cDetail.levels || []).forEach(function (lv) {
          var cls = lvlClassMap[lv.level] || 'pass';
          lvlRow.appendChild(Util.el('span', { class: 'cust-level cust-level-' + cls, text: T(lv.level) + ' ' + lv.range + ' · ' + T(lv.result) }));
        });
        body.appendChild(lvlRow);
        body.appendChild(Util.el('div', { class: 'std-cl-title', text: T('零容忍项') }));
        var ztHost = Util.el('div', { class: 'zt-list' });
        (cDetail.zeroTolerance || []).forEach(function (zt) {
          ztHost.appendChild(Util.el('span', { class: 'zt-tag', text: '✕ ' + zt }));
        });
        body.appendChild(ztHost);
      }

      // 标准级标签（可编辑）
      body.appendChild(Util.el('div', { class: 'std-cl-title', text: T('标准标签') }));
      const stdTagHost = Util.el('div', { class: 'std-tagrow' });
      body.appendChild(stdTagHost);
      function refreshStdTags() {
        tagEditor(stdTagHost, s.tags || [], {
          removable: true,
          onClick: (t) => { activeTag = t; renderTagBar(); renderGrid(); },
          onAdd: () => Util.ask(T('添加标准标签'), T('如 强迫劳动、本地要求、客户指定')).then((name) => {
            if (!name) return;
            const tags = (s.tags || []);
            if (tags.indexOf(name) >= 0) return;
            patchStd({ tags: tags.concat([name]) }).then(() => { refreshStdTags(); refreshData(); renderTagBar(); renderGrid(); });
          }),
          onRemove: (t) => patchStd({ tags: (s.tags || []).filter((x) => x !== t) }).then(() => { refreshStdTags(); refreshData(); renderTagBar(); renderGrid(); })
        });
      }
      refreshStdTags();

      // 关键条款
      body.appendChild(Util.el('div', { class: 'std-cl-title', text: T('关键条款') }));
      if (s.pdfDocId) {
        const pdfBar = Util.el('div', { style: 'margin:6px 0 12px' }, [
          Util.el('button', { class: 'btn btn-primary', html: Util.icon('file') + T(' 查看关联 PDF'), onclick: () => openPdfById(s.pdfDocId, s.name) })
        ]);
        body.appendChild(pdfBar);
      }
      const ct = Util.el('div', { class: 'std-clauses' });
      body.appendChild(ct);
      function buildClauses() {
        ct.innerHTML = '';
        (s.clauses || []).forEach((c, ci) => {
          const row = Util.el('div', { class: 'std-clause' });
          row.appendChild(Util.el('div', { class: 'std-cl-no', text: c.no }));
          const rc = Util.el('div', { class: 'std-cl-body' });
          rc.appendChild(Util.el('div', { class: 'std-cl-t', html: Util.highlight(c.title || '', kw) }));
          rc.appendChild(Util.el('div', { class: 'std-cl-c', html: Util.highlight(c.content || '', kw) }));
          if (c.tags && c.tags.length) {
            const cth = Util.el('div', { class: 'std-tagrow' });
            tagEditor(cth, c.tags, {
              removable: true,
              onClick: (t) => { activeTag = t; renderTagBar(); renderGrid(); },
              onAdd: () => Util.ask(T('添加子条款标签'), T('如 强迫劳动、工时')).then((name) => {
                if (!name || (c.tags || []).indexOf(name) >= 0) return;
                const newClauses = s.clauses.map((x, i) => i === ci ? Object.assign({}, x, { tags: (x.tags || []).concat([name]) }) : x);
                patchStd({ clauses: newClauses }).then(() => { buildClauses(); refreshData(); renderTagBar(); renderGrid(); });
              }),
              onRemove: (t) => {
                const newClauses = s.clauses.map((x, i) => i === ci ? Object.assign({}, x, { tags: (x.tags || []).filter((z) => z !== t) }) : x);
                patchStd({ clauses: newClauses }).then(() => { buildClauses(); refreshData(); renderTagBar(); renderGrid(); });
              }
            });
            rc.appendChild(cth);
          } else {
            const cth = Util.el('div', { class: 'std-tagrow' });
            tagEditor(cth, [], {
              onClick: () => {}, onAdd: () => Util.ask(T('添加子条款标签'), T('如 强迫劳动、工时')).then((name) => {
                if (!name) return;
                const newClauses = s.clauses.map((x, i) => i === ci ? Object.assign({}, x, { tags: [name] }) : x);
                patchStd({ clauses: newClauses }).then(() => { buildClauses(); refreshData(); renderTagBar(); renderGrid(); });
              })
            });
            rc.appendChild(cth);
          }
          row.appendChild(rc);
          ct.appendChild(row);
        });
      }
      buildClauses();

      // 用户上传标准的删除
      const foot = [];
      if (s.officialUrl) foot.push(Util.el('button', { class: 'btn btn-primary', onclick: () => { try { window.open(s.officialUrl, '_blank'); } catch (e) {} } }, T('访问官网 ↗')));
      if (s.source === 'user') {
        foot.push(Util.el('button', { class: 'btn btn-danger', html: Util.icon('trash') + T(' 删除标准'), onclick: () => {
          Util.confirm(T('删除该标准'), T('确定删除用户标准「') + s.name + T('」吗？关联的 PDF 文件也会一并删除。')).then((ok) => {
            if (!ok) return;
            const p = s.pdfDocId ? DB.deleteDoc(s.pdfDocId) : Promise.resolve();
            p.then(() => DB.deleteStandard(s.code)).then(() => { Util.closeModal(); refreshData(); renderTagBar(); renderGrid(); Util.toast(T('已删除'), 'ok'); });
          });
        } }));
      }
      foot.push(Util.el('button', { class: 'btn', html: Util.icon('info') + T(' 相关术语'), onclick: () => gotoGlossary(s.code) }));
      foot.push(Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('关闭')));
      Util.modal(s.name, body, foot);
    }

    function patchStd(patch) {
      return DB.updateStandard(s.code, patch).then(() => { s = DB.getStandard(s.code); });
    }

    function tag(text) {
      const t = Util.el('span', { class: 'lvl-tag', text: text });
      t.style.background = 'var(--brand-soft)'; t.style.color = 'var(--brand-2)'; t.style.border = '1px solid #d6e4ff';
      return t;
    }

    function tagEditor(host, tags, opts) {
      host.innerHTML = '';
      (tags || []).forEach((t) => {
        const chip = Util.el('span', { class: 'std-tag' + (activeTag === t ? ' active' : '') });
        chip.appendChild(Util.el('span', { html: Util.highlight(t, kw) }));
        if (opts.removable) {
          const x = Util.el('span', { class: 'std-tag-x', text: '×' });
          x.addEventListener('click', (e) => { e.stopPropagation(); opts.onRemove(t); });
          chip.appendChild(x);
        }
        if (opts.onClick) chip.addEventListener('click', (e) => { if (e.target.classList.contains('std-tag-x')) return; opts.onClick(t); });
        host.appendChild(chip);
      });
      if (opts.onAdd) {
        const add = Util.el('span', { class: 'std-tag std-tag-add', text: T('＋ 标签') });
        add.addEventListener('click', (e) => { e.stopPropagation(); opts.onAdd(); });
        host.appendChild(add);
      }
    }

    // ---------- PDF 查看 / 下载 / 删除 ----------
    function openPdfById(id, name) {
      DB.getDoc(id).then((d) => {
        if (!d || !d.blob) { Util.toast(T('PDF 文件不存在，可能已被删除'), 'err'); return; }
        showPdfModal(d);
      });
    }
    function showPdfModal(d) {
      const url = URL.createObjectURL(d.blob);
      const ifr = Util.el('iframe', { src: url, style: 'width:100%;height:70vh;border:0;border-radius:8px;background:#fff' });
      const body = Util.el('div', {}, [ifr]);
      const close = Util.el('button', { class: 'btn', onclick: () => { try { URL.revokeObjectURL(url); } catch (e) {} Util.closeModal(); } }, T('关闭'));
      const dl = Util.el('button', { class: 'btn btn-primary', onclick: () => downloadDoc(d) }, T('⇩ 下载'));
      Util.modal((d.name || 'PDF') + T(' · PDF 预览'), body, [close, dl]);
    }
    function downloadDoc(d) {
      if (!d.blob) { Util.toast(T('无法读取文件'), 'err'); return; }
      Util.download(d.blob, d.fileName || ((d.name || 'document') + '.pdf'));
    }
    function removeDoc(d) {
      Util.confirm(T('删除报告'), T('确定删除报告「') + d.name + T('」吗？此操作不可撤销。')).then((ok) => {
        if (!ok) return;
        DB.deleteDoc(d.id).then(() => { Util.toast(T('已删除'), 'ok'); renderGrid(); });
      });
    }

    // ---------- 上传标准 / 报告 ----------
    function openUpload() {
      const form = Util.el('div', { class: 'upload-form' });
      // 类型
      const typeStd = Util.el('input', { type: 'radio', name: 'doctype', value: 'standard', checked: 'checked' });
      const typeRep = Util.el('input', { type: 'radio', name: 'doctype', value: 'report' });
      const typeRow = Util.el('div', { class: 'form-row' }, [
        Util.el('label', { class: 'form-label', text: T('类型') }),
        Util.el('div', { class: 'form-vals' }, [
          Util.el('label', { class: 'radio' }, [typeStd, Util.el('span', { text: T('标准 PDF（加入标准库）') })]),
          Util.el('label', { class: 'radio' }, [typeRep, Util.el('span', { text: T('报告 PDF（我的报告）') })])
        ])
      ]);
      form.appendChild(typeRow);
      // 文件
      const fileInput = Util.el('input', { type: 'file', accept: 'application/pdf,.pdf' });
      form.appendChild(Util.el('div', { class: 'form-row' }, [Util.el('label', { class: 'form-label', text: T('PDF 文件') }), Util.el('div', { class: 'form-vals' }, [fileInput, Util.el('div', { class: 'muted', text: T('仅支持 PDF 格式，将保存在本地浏览器数据库中。') })])]));
      // 名称
      const nameInput = Util.el('input', { type: 'text', class: 'inp', placeholder: T('如 ISO 45001 职业健康安全') });
      form.appendChild(Util.el('div', { class: 'form-row' }, [Util.el('label', { class: 'form-label', text: T('名称') }), Util.el('div', { class: 'form-vals' }, [nameInput])]));
      // 标准专用：分类 / 版本 / 机构 / 关联
      const catSel = Util.el('select', { class: 'inp' }, cats.map((c) => Util.el('option', { value: c, text: c })).concat([Util.el('option', { value: T('用户上传'), text: T('用户上传（自定义分类）') })]));
      const verInput = Util.el('input', { type: 'text', class: 'inp', placeholder: T('如 2024 版') });
      const orgInput = Util.el('input', { type: 'text', class: 'inp', placeholder: T('发布机构（可选）') });
      const linkSel = Util.el('select', { class: 'inp' }, [Util.el('option', { value: '', text: T('— 创建为新的独立标准 —') })].concat(allItems.map((s) => Util.el('option', { value: s.code, text: s.name }))));
      const stdOnly = Util.el('div', {}, [
        Util.el('div', { class: 'form-row' }, [Util.el('label', { class: 'form-label', text: T('分类') }), Util.el('div', { class: 'form-vals' }, [catSel])]),
        Util.el('div', { class: 'form-row' }, [Util.el('label', { class: 'form-label', text: T('版本') }), Util.el('div', { class: 'form-vals' }, [verInput])]),
        Util.el('div', { class: 'form-row' }, [Util.el('label', { class: 'form-label', text: T('发布机构') }), Util.el('div', { class: 'form-vals' }, [orgInput])]),
        Util.el('div', { class: 'form-row' }, [Util.el('label', { class: 'form-label', text: T('关联到已有标准') }), Util.el('div', { class: 'form-vals' }, [linkSel, Util.el('div', { class: 'muted', text: T('若选择，PDF 将挂接到该标准（不新建条目）。') })])])
      ]);
      // 报告专用：供应商 / 备注
      const facInput = Util.el('input', { type: 'text', class: 'inp', placeholder: T('关联供应商名称（可选）') });
      const noteInput = Util.el('textarea', { class: 'inp', placeholder: T('备注（可选）'), rows: '2' });
      const repOnly = Util.el('div', {}, [
        Util.el('div', { class: 'form-row' }, [Util.el('label', { class: 'form-label', text: T('关联供应商') }), Util.el('div', { class: 'form-vals' }, [facInput])]),
        Util.el('div', { class: 'form-row' }, [Util.el('label', { class: 'form-label', text: T('备注') }), Util.el('div', { class: 'form-vals' }, [noteInput])])
      ]);
      form.appendChild(stdOnly);
      form.appendChild(repOnly);

      function updateVis() {
        const isStd = typeStd.checked;
        stdOnly.style.display = isStd ? '' : 'none';
        repOnly.style.display = isStd ? 'none' : '';
      }
      typeStd.addEventListener('change', updateVis);
      typeRep.addEventListener('change', updateVis);
      updateVis();

      const submit = Util.el('button', { class: 'btn btn-primary', text: T('上传并保存') });
      submit.addEventListener('click', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) { Util.toast(T('请选择 PDF 文件'), 'err'); return; }
        if (file.type && file.type.indexOf('pdf') < 0 && file.name.toLowerCase().indexOf('.pdf') < 0) { Util.toast(T('仅支持 PDF 格式'), 'err'); return; }
        const name = nameInput.value.trim();
        if (!name) { Util.toast(T('请填写名称'), 'err'); return; }
        const type = typeStd.checked ? 'standard' : 'report';
        const doc = { id: Util.uid('doc'), kind: type, name: name, fileName: file.name, type: file.type || 'application/pdf', size: file.size, uploadedAt: Date.now(), blob: file };
        if (type === 'report') { doc.facility = facInput.value.trim(); doc.note = noteInput.value.trim(); }
        DB.addDoc(doc).then(() => {
          if (type === 'standard') {
            const linkCode = linkSel.value;
            if (linkCode) return DB.updateStandard(linkCode, { pdfDocId: doc.id });
            const ns = { code: '', name: name, category: catSel.value || T('用户上传'), org: orgInput.value.trim(), version: verInput.value.trim(), effective: '', summary: T('用户上传的标准 PDF（本地文件）。'), tags: [], clauses: [], source: 'user', pdfDocId: doc.id };
            return DB.addUserStandard(ns);
          }
          return Promise.resolve();
        }).then(() => {
          Util.toast(T('已上传：') + name, 'ok');
          Util.closeModal();
          Standards.render(root);
        }).catch((e) => Util.toast(T('上传失败：') + (e && e.message || e), 'err'));
      });

      const foot = [
        Util.el('button', { class: 'btn', onclick: () => Util.closeModal() }, T('取消')),
        submit
      ];
      Util.modal(T('上传标准 / 报告 PDF'), form, foot);
    }

    function showHelp() {
      const node = Util.el('div', {}, [
        Util.el('p', { class: 'tip', html: T('本模块汇集主要国际社会责任标准（SA8000、RBA、WRAP、ISO 26000、FLA、BSCI、Sedex/SMETA、SLCP）、行业特定标准（IETP、RJC）、客户特定验厂标准（TARGET、Family Dollar、T\'RIFFIC、Justice、三星）、质量管理标准（ISO 9001、IATF 16949）、反恐安全标准（C-TPAT、GSV、SCAN）、职业安全（OSHA）以及国内《劳动合同法》《消防法》《环境保护法》的<b>最新有效版本</b>与关键条款。') }),
        Util.el('p', { class: 'muted', text: T('版本信息截至 2026 年可确认的最新有效版本，仅供参考；具体执行请以官方发布文本为准。') }),
        Util.el('p', { class: 'tip', html: T('<b>审核流程</b>标签页提供六阶段标准审核流程指南（首次会议→现场巡视→文件审核→员工访谈→末次会议→整改跟进），含各阶段操作要点与文件准备清单。') }),
        Util.el('p', { class: 'tip', html: T('<b>合规自查</b>标签页按员工权益保障、健康与安全、环境合规、反恐安全四个模块提供可落地的自查清单，每项标注必查/重点/一般级别与所需佐证材料。') }),
        Util.el('p', { class: 'tip', html: T('<b>趋势更新</b>标签页列出 2025-2026 年验厂趋势变化，标注新纳入要求与行动指引。') }),
        Util.el('p', { class: 'tip', html: T('<b>检索</b>：输入关键词可高亮名称/摘要/条款；点击<b>标签</b>可按子条款议题筛选。点击客户验厂标准卡片可查看<b>评分标准与零容忍项</b>。') }),
        Util.el('p', { class: 'tip', html: T('点击右上角<b>「⬆ 上传标准/报告」</b>可将自有 PDF 标准加入库、或存入「我的报告」，之后可在详情中<b>在线预览/下载</b>。') })
      ]);
      Util.modal(T('标准 / 法规 说明'), node, [Util.el('button', { class: 'btn btn-primary', onclick: () => Util.closeModal() }, T('知道了'))]);
    }

    mount.appendChild(grid);
    renderGrid();
  };

  // 暴露术语查询纯逻辑，便于冒烟测试直接调用
  Standards.getAllTerms = getAllTerms;
  Standards.searchTerms = function (kw, opts) {
    opts = opts || {};
    const q = (kw || '').trim().toLowerCase();
    return getAllTerms().filter((t) => matchTerm(t, q, opts.discipline, opts.source));
  };
  Standards.disciplines = function () {
    const set = [];
    getAllTerms().forEach((t) => { if (t.discipline && set.indexOf(t.discipline) < 0) set.push(t.discipline); });
    return set;
  };

  global.Standards = Standards;
})(window);

/* ===== src/js/esg.js ===== */
/* ESG 问卷模块（独立模块，与通用问卷系统完全分离）
 * 参考 EcoVadis 四大主题评估模型 + 上海农商银行 ESG 管理系统设计思路：
 *   标准预设层 → 议题映射层 → 数据填报层 → 评分评估层 → 报告输出层
 * 暴露纯函数（computeScores / validateResponses / buildMapping / generateReportData / radarPoints / buildQuestionnaire）
 * 供冒烟测试直接调用，UI 仅做编排。
 */
(function (global) {
  const ESG = {};
  const ui = { view: 'list', id: null };

  const STANDARD_IDS = ['issb', 'gri', 'tcfd'];
  const THEME_IDS = ['environment', 'labor', 'ethics', 'procurement'];

  // ===================================================================
  // 纯函数层（可测试）
  // ===================================================================

  // 根据所选标准生成综合问卷（自动合并跨标准重叠议题）
  ESG.buildQuestionnaire = function (standardIds) {
    const stds = (standardIds || []).map((id) => ESGSeed.standardById(id)).filter(Boolean);
    const themes = ESGSeed.themes.map((t) => ({ id: t.id, name: t.name, weight: t.weight, items: [] }));
    const themeIndex = {}; themes.forEach((t, i) => { themeIndex[t.id] = i; });
    const seen = {};
    stds.forEach((std) => {
      std.pillars.forEach((p) => p.topics.forEach((topic) => {
        const tmpls = ESGSeed.itemByTopic[topic.code] || ESGSeed.genericItems(topic.code);
        tmpls.forEach((tm) => {
          const key = tm.label.trim();
          const ti = themeIndex[topic.theme];
          if (seen[key]) {
            const ex = seen[key];
            if (ex.topicCodes.indexOf(topic.code) < 0) {
              ex.topicCodes.push(topic.code);
              ex.standardRefs.push(std.code + ' ' + topic.code);
              ex.merged = true;
            }
            return;
          }
          const item = {
            id: topic.code + '|' + (tm.key || key),
            key: tm.key, label: tm.label, type: tm.type,
            unit: tm.unit || '', required: !!tm.required, weight: tm.weight || 1,
            qualitative: !!tm.qualitative, target: tm.target, direction: tm.direction,
            min: tm.min, max: tm.max, options: tm.options || null,
            topicCode: topic.code, standardRefs: [std.code + ' ' + topic.code],
            topicCodes: [topic.code], merged: false
          };
          seen[key] = item;
          themes[ti].items.push(item);
        });
      }));
    });
    return {
      themes: themes,
      standardIds: stds.map((s) => s.id),
      standards: stds.map((s) => ({ id: s.id, code: s.code, name: s.name, version: s.version }))
    };
  };

  // 单题归一化评分（0-100，无有效值返回 null）
  ESG.itemScore = function (item, value) {
    if (item.qualitative) return null;
    if (item.type === 'yesno') {
      if (value === true || value === 'true' || value === '是') return 100;
      if (value === false || value === 'false' || value === '否') return 0;
      return null;
    }
    if (item.type === 'rating') {
      const mx = Number(item.max) || 5;
      const v = Number(value);
      if (isNaN(v) || v <= 0) return null;
      return Math.max(0, Math.min(100, Math.round((v / mx) * 100)));
    }
    if (item.type === 'select') {
      const arr = Array.isArray(item.options) ? item.options : [];
      const hit = arr.find((o) => o.label === value);
      return hit ? Number(hit.score) : null;
    }
    if (item.type === 'number') {
      const v = Number(value);
      if (isNaN(v)) return null;
      const clamp = (x) => Math.max(0, Math.min(100, x));
      if (item.target != null && item.direction) {
        if (item.direction === 'lower') return v <= item.target ? 100 : clamp(Math.round((item.target / v) * 100));
        return v >= item.target ? 100 : clamp(Math.round((v / item.target) * 100));
      }
      if (item.min != null && item.max != null) {
        if (v <= item.min) return 0;
        if (v >= item.max) return 100;
        return clamp(Math.round(((v - item.min) / (item.max - item.min)) * 100));
      }
      return null;
    }
    return null;
  };

  // 评分：返回四主题均分、加权总分、覆盖率
  ESG.computeScores = function (q) {
    const responses = (q && q.responses) || {};
    const themeScores = {};
    let wSum = 0, scoreSum = 0;
    (q.themes || []).forEach((th) => {
      let mScore = 0, mWeight = 0, answered = 0, total = 0;
      (th.items || []).forEach((it) => {
        total++;
        if (it.qualitative) return;
        const sc = ESG.itemScore(it, responses[it.id]);
        if (sc == null) return;
        answered++;
        const w = Number(it.weight) || 1;
        mScore += sc * w; mWeight += w;
      });
      const themeScore = mWeight ? Math.round(mScore / mWeight) : 0;
      themeScores[th.id] = { name: th.name, score: themeScore, weight: th.weight, answered: answered, total: total };
      if (mWeight > 0) { wSum += th.weight; scoreSum += th.weight * themeScore; }
    });
    const totalScore = wSum ? Math.round(scoreSum / wSum) : 0;
    let allItems = 0, allAnswered = 0;
    (q.themes || []).forEach((th) => th.items.forEach((it) => { allItems++; if (responses[it.id] != null && responses[it.id] !== '') allAnswered++; }));
    return { themeScores: themeScores, total: totalScore, coverage: allItems ? Math.round((allAnswered / allItems) * 100) : 0, answered: allAnswered, allItems: allItems };
  };

  // 校验规则：required / format / logic / yoy
  ESG.validateResponses = function (q, prev) {
    const responses = (q && q.responses) || {};
    const issues = [];
    const get = (k) => { const it = ESG.findItem(q, k); return it ? responses[it.id] : undefined; };
    (q.themes || []).forEach((th) => (th.items || []).forEach((it) => {
      const v = responses[it.id];
      if (it.required && (v == null || v === '')) {
        issues.push({ itemId: it.id, type: 'required', level: 'error', message: T('必填项未填写') + '：' + T(it.label) });
      }
      if (it.type === 'number' && v !== '' && v != null) {
        const n = Number(v);
        if (isNaN(n)) issues.push({ itemId: it.id, type: 'format', level: 'error', message: T('数值格式无效') + '：' + T(it.label) });
        else if (it.min != null && n < it.min) issues.push({ itemId: it.id, type: 'format', level: 'warn', message: T('低于合理下限') + '：' + T(it.label) });
        else if (it.max != null && n > it.max) issues.push({ itemId: it.id, type: 'format', level: 'warn', message: T('超出合理上限') + '：' + T(it.label) });
      }
      if (it.type === 'yesno' && v === true) {
        if (it.key === 'gri408_child') issues.push({ itemId: it.id, type: 'logic', level: 'error', message: T('红线项：发现童工违规') });
        if (it.key === 'gri409_force') issues.push({ itemId: it.id, type: 'logic', level: 'error', message: T('红线项：发现强迫劳动') });
      }
    }));
    // 逻辑校验：设定碳中和年份却未设科学碳目标
    if (get('s2tgt_year') != null && get('s2tgt_sbti') === false) {
      issues.push({ itemId: null, type: 'logic', level: 'warn', message: T('已填写碳中和目标年份，但未设定科学碳目标（SBTi）') });
    }
    // 同比校验：与上一期同口径指标偏差 > 50%
    if (prev && prev.scores && prev.themes) {
      (q.themes || []).forEach((th) => (th.items || []).forEach((it) => {
        if (it.type !== 'number') return;
        const cur = Number(responses[it.id]);
        if (isNaN(cur)) return;
        const pItem = ESG.findItem(prev, it.key);
        if (!pItem) return;
        const pv = Number((prev.responses || {})[pItem.id]);
        if (isNaN(pv) || pv === 0) return;
        const dev = Math.abs((cur - pv) / pv);
        if (dev > 0.5) issues.push({ itemId: it.id, type: 'yoy', level: 'warn', message: T('同比波动超 50%') + '：' + T(it.label) + '（' + pv + '→' + cur + '）' });
      }));
    }
    return issues;
  };

  ESG.findItem = function (q, keyOrId) {
    let found = null;
    (q.themes || []).forEach((th) => (th.items || []).forEach((it) => {
      if (it.id === keyOrId || it.key === keyOrId) found = it;
    }));
    return found;
  };

  // ---------- REQ-E-07：自定义议题（纯函数，供冒烟测试直接调用） ----------
  ESG.makeCustomItem = function (themeId, opts) {
    opts = opts || {};
    const TYPES = ['yesno', 'rating', 'number', 'select', 'text'];
    const type = TYPES.indexOf(opts.type) >= 0 ? opts.type : 'yesno';
    const wNum = Number(opts.weight);
    const id = 'custom|' + Util.uid('t');
    return {
      id: id, key: id, label: String(opts.label || '').trim(), type: type,
      unit: String(opts.unit || '').trim(), required: !!opts.required,
      weight: isNaN(wNum) ? 1 : Math.max(0.1, Math.min(10, wNum)),
      qualitative: type === 'text',
      min: (type === 'number' && opts.min != null && opts.min !== '') ? Number(opts.min) : null,
      max: (type === 'number' && opts.max != null && opts.max !== '') ? Number(opts.max) : null,
      options: type === 'select' ? (opts.options || []) : null,
      target: null, direction: null,
      topicCode: 'CUSTOM', standardRefs: [T('自定义议题')], topicCodes: ['CUSTOM'],
      merged: false, custom: true, themeId: themeId, createdAt: Date.now()
    };
  };

  ESG.validateCustomItem = function (item) {
    if (!item.label) return T('议题名称不能为空');
    if (item.label.length > 120) return T('议题名称过长（≤120 字）');
    if (item.weight == null || Number(item.weight) <= 0) return T('权重必须大于 0');
    if (item.type === 'select' && (!item.options || item.options.length < 2)) return T('下拉选项至少 2 项');
    if (item.type === 'number' && item.min != null && item.max != null && Number(item.min) >= Number(item.max)) return T('数值下限必须小于上限');
    return null;
  };

  // 增/改自定义议题：成功返回 null，失败返回错误文案（同时支持改题后换主题）
  ESG.upsertCustomItem = function (q, item) {
    const th = (q.themes || []).find((t) => t.id === item.themeId);
    if (!th) return T('议题所属主题不存在');
    const err = ESG.validateCustomItem(item);
    if (err) return err;
    (q.themes || []).forEach((t) => { t.items = (t.items || []).filter((x) => x.id !== item.id); });
    th.items.push(item);
    return null;
  };

  // 删自定义议题（仅允许删 custom 项）并清理其填报值；返回是否删除成功
  ESG.removeCustomItem = function (q, itemId) {
    let removed = false;
    (q.themes || []).forEach((th) => {
      (th.items || []).forEach((it, i) => {
        if (it.id === itemId && it.custom) { th.items.splice(i, 1); removed = true; }
      });
    });
    if (removed && q.responses) delete q.responses[itemId];
    return removed;
  };

  // 议题映射：返回所选标准相关的跨标准映射
  ESG.buildMapping = function (selectedIds) {
    const sel = selectedIds || STANDARD_IDS.slice();
    // 建立 topicCode → standardId 映射（议题码前缀不等于标准码，如 S2-MET 属 ISSB）
    const codeStd = {};
    ESGSeed.standards.forEach((s) => s.pillars.forEach((p) => p.topics.forEach((t) => { codeStd[t.code] = s.id; })));
    const inSel = (c) => sel.indexOf(codeStd[c]) >= 0;
    return ESGSeed.topicMappings.filter((m) => m.codes.some(inSel)).map((m) => ({
      group: m.group, theme: m.theme, note: m.note,
      codes: m.codes.filter(inSel)
    }));
  };

  // 雷达坐标（values: 各主题 0-100，按主题顺序）
  ESG.radarPoints = function (values, opts) {
    opts = opts || {};
    const cx = opts.cx || 130, cy = opts.cy || 120, r = opts.r || 95;
    const n = values.length;
    return values.map((v, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      const rr = r * (Math.max(0, Math.min(100, Number(v) || 0)) / 100);
      return { x: Math.round(cx + rr * Math.cos(a)), y: Math.round(cy + rr * Math.sin(a)), a: a };
    });
  };

  // 报告数据结构（供 UI 与导出共用）
  ESG.generateReportData = function (q, prev) {
    const scores = ESG.computeScores(q);
    const bench = ESGSeed.benchmarkIndustry(q.industry) || null;
    const themeOrder = THEME_IDS;
    const themeValues = themeOrder.map((id) => (scores.themeScores[id] ? scores.themeScores[id].score : 0));
    const points = ESG.radarPoints(themeValues, { cx: 130, cy: 120, r: 95 });
    const mapping = ESG.buildMapping(q.standards ? q.standards.map((s) => s.id) : q.standardIds);
    // 改进建议：得分最低的主题优先
    const ranked = themeOrder.map((id) => scores.themeScores[id]).filter(Boolean).sort((a, b) => a.score - b.score);
    const improvement = ranked.slice(0, 2).map((t) => ({
      theme: t.name, score: t.score,
      suggestion: T('建议优先提升') + T(t.name) + T('维度（当前 ') + t.score + T(' 分），补齐权重较高且未达标评分项。')
    }));
    const multiStd = (q.standards || []).map((s) => {
      const std = ESGSeed.standardById(s.id);
      return { id: s.id, code: s.code, name: s.name, version: s.version, approach: std ? std.approachLabel : '', pillars: std ? std.pillars.map((p) => ({ title: p.title, topics: p.topics.map((t) => ({ code: t.code, title: t.title })) })) : [] };
    });
    const yoy = (prev && prev.scores) ? { prevTotal: prev.scores.total, delta: scores.total - prev.scores.total } : null;
    // 碳排放摘要（环境维度内置计算器输出联动）
    const carbon = (function () {
      const region = (q.carbon && q.carbon.region) || 'china';
      const activity = (q.carbon && q.carbon.activity) || {};
      const res = Carbon.compute(activity, region);
      return {
        region: region, activity: activity,
        scope1: res.scope1, scope2: res.scope2, scope3: res.scope3, total: res.total,
        items: res.items, tips: res.total ? Carbon.reductionTips(res) : [],
        estimated: (q.carbon && q.carbon.estimated) || null
      };
    })();
    return {
      meta: { title: q.title, org: q.orgName, industry: q.industry, standards: q.standards || [], standardVersions: q.standardVersions || {}, date: q.updatedAt || Date.now() },
      scores: scores, themeValues: themeValues, radarPoints: points, benchmark: bench,
      mapping: mapping, improvement: improvement, multiStd: multiStd, yoy: yoy, carbon: carbon
    };
  };

  // ===================================================================
  // UI 层
  // ===================================================================
  function mount() { return document.getElementById('content'); }

  ESG.render = function (container) {
    container = container || mount();
    container.innerHTML = '';
    ui.view = 'list'; ui.id = null;
    renderList(container);
  };

  function renderList(container) {
    const s = DB.get();
    const list = DB.getEsgQuestionnaires();
    container.innerHTML = '';
    const avg = list.length ? Math.round(list.reduce((a, q) => a + (q.scores ? q.scores.total : 0), 0) / list.length) : null;
    const done = list.filter((q) => q.status === 'done').length;
    container.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [Util.el('h2', { class: 'page-title', text: T('ESG 问卷') }), Util.el('div', { class: 'muted', text: T('独立 ESG 数据采集与评估模块 · 兼容 ISSB / GRI / TCFD · EcoVadis 式四主题评分') })]),
      Util.el('div', { class: 'btn-row' }, [
        Util.el('button', { class: 'btn btn-primary', onclick: () => renderCreate(container) }, T('新建 ESG 问卷'))
      ])
    ]));
    const cards = Util.el('div', { class: 'grid cols-3', style: 'margin:14px 0' }, [
      statCard(T('ESG 问卷数'), list.length, T('份')),
      statCard(T('平均 ESG 得分'), avg == null ? '—' : avg, ''),
      statCard(T('已完成评估'), done, T('份'))
    ]);
    container.appendChild(cards);

    const panel = Util.el('div', { class: 'panel card' });
    if (!list.length) {
      panel.appendChild(Util.el('div', { class: 'empty', text: T('还没有 ESG 问卷。点击「新建 ESG 问卷」选择披露标准并开始采集。') }));
    } else {
      const tbl = Util.el('table', { class: 'tbl' });
      tbl.appendChild(Util.el('thead', {}, Util.el('tr', {}, [
        Util.el('th', { text: T('问卷标题') }), Util.el('th', { text: T('组织 / 行业') }), Util.el('th', { text: T('采用标准') }),
        Util.el('th', { text: T('ESG 得分') }), Util.el('th', { text: T('状态') }), Util.el('th', { text: T('操作') })
      ])));
      const tb = Util.el('tbody', {});
      list.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).forEach((q) => {
        const stdBadges = Util.el('div', { class: 'row', style: 'gap:4px;flex-wrap:wrap' }, (q.standards || []).map((st) => Util.el('span', { class: 'tag', text: st.code + ' ' + st.version })));
        tb.appendChild(Util.el('tr', {}, [
          Util.el('td', { html: '<strong>' + Util.esc(q.title) + '</strong>' }),
          Util.el('td', { text: (q.orgName || '—') + ' / ' + (q.industry || '—') }),
          Util.el('td', {}, [stdBadges]),
          Util.el('td', { text: q.scores ? q.scores.total + ' / 100' : '—' }),
          Util.el('td', {}, [q.status === 'done' ? Util.el('span', { class: 'tag ok', text: T('已完成') }) : Util.el('span', { class: 'tag gray', text: T('草稿') })]),
          Util.el('td', {}, [Util.el('div', { class: 'row', style: 'gap:6px' }, [
            Util.el('button', { class: 'btn btn-sm', onclick: () => renderFill(container, q.id) }, T('填写')),
            Util.el('button', { class: 'btn btn-sm', onclick: () => renderReport(container, q.id) }, T('报告')),
            Util.el('button', { class: 'btn btn-sm btn-danger', onclick: () => removeQ(container, q.id) }, T('删除'))
          ])])
        ]));
      });
      tbl.appendChild(tb);
      panel.appendChild(tbl);
    }
    container.appendChild(panel);
  }

  function statCard(k, v, unit) {
    return Util.el('div', { class: 'stat' }, [
      Util.el('div', { class: 'k', text: k }),
      Util.el('div', { class: 'v' }, [document.createTextNode(String(v)), unit ? Util.el('small', { text: ' ' + unit }) : null])
    ]);
  }

  function removeQ(container, id) {
    Util.confirm(T('删除 ESG 问卷'), T('确认删除该问卷及其评分数据？此操作不可恢复。'), T('确认删除')).then((ok) => {
      if (!ok) return;
      DB.deleteEsgQuestionnaire(id).then(() => { Util.toast(T('已删除'), 'ok'); renderList(container); }).catch((e) => Util.toast(T('删除失败：') + e.message, 'err'));
    });
  }

  function renderCreate(container) {
    container.innerHTML = '';
    ui.view = 'create';
    container.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('h2', { class: 'page-title', text: T('新建 ESG 问卷') }),
      Util.el('button', { class: 'btn', onclick: () => renderList(container) }, T('← 返回列表'))
    ]));

    const titleI = Util.el('input', { type: 'text', class: 'inp', placeholder: T('如 2026 年度 ESG 披露问卷'), value: T('2026 年度 ESG 披露问卷') });
    const orgI = Util.el('input', { type: 'text', class: 'inp', placeholder: T('组织 / 公司名称'), value: (DB.get().settings.orgName || '') });
    const indSel = Util.el('select', { class: 'inp' }, [Util.el('option', { value: '' }, T('请选择行业（用于基准对标）'))].concat(Object.keys(ESGSeed.benchmarks).map((k) => Util.el('option', { value: k }, k))));

    // 多标准复选（禁止单选，默认全选）
    const stdWrap = Util.el('div', { class: 'esg-std-wrap' });
    STANDARD_IDS.forEach((id) => {
      const st = ESGSeed.standardById(id);
      const cb = Util.el('input', { type: 'checkbox', value: id, checked: 'checked' });
      cb.dataset.std = id;
      stdWrap.appendChild(Util.el('label', { class: 'esg-std' }, [
        cb,
        Util.el('div', {}, [
          Util.el('div', { class: 'esg-std-name', text: st.name + ' · v' + st.version }),
          Util.el('div', { class: 'muted', style: 'font-size:12px', text: st.summary })
        ])
      ]));
    });

    const preview = Util.el('div', { class: 'esg-preview muted' });
    const refreshPreview = () => {
      const ids = Array.from(stdWrap.querySelectorAll('input[type=checkbox]:checked')).map((c) => c.value);
      const q = ESG.buildQuestionnaire(ids);
      const counts = q.themes.map((t) => T(t.name) + '：' + t.items.length).join(' ｜ ');
      preview.textContent = T('将生成四大主题共 ') + q.themes.reduce((a, t) => a + t.items.length, 0) + T(' 项评分题（') + counts + T('）。重叠议题已自动合并。');
    };
    stdWrap.querySelectorAll('input').forEach((c) => c.addEventListener('change', refreshPreview));
    refreshPreview();

    const form = Util.el('div', { class: 'panel card' }, [
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('问卷标题') }), titleI]),
      Util.el('div', { class: 'row' }, [
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('组织 / 公司') }), orgI]),
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('行业（基准对标）') }), indSel])
      ]),
      Util.el('div', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('采用披露标准（可多选，合并生成）') }), stdWrap]),
      preview,
      Util.el('div', { class: 'btn-row', style: 'margin-top:10px' }, [
        Util.el('button', { class: 'btn btn-primary', onclick: () => doCreate(container, titleI.value, orgI.value, indSel.value, stdWrap) }, T('生成问卷并填写')),
        Util.el('button', { class: 'btn', onclick: () => renderList(container) }, T('取消'))
      ])
    ]);
    container.appendChild(form);
  }

  function doCreate(container, title, org, industry, stdWrap) {
    const ids = Array.prototype.slice.call(stdWrap.querySelectorAll('input[type=checkbox]:checked')).map((c) => c.value);
    if (!ids.length) { Util.toast(T('请至少选择一个披露标准'), 'err'); return; }
    if (!title.trim()) { Util.toast(T('请填写问卷标题'), 'err'); return; }
    const built = ESG.buildQuestionnaire(ids);
    const q = {
      id: Util.uid('esg'), title: title.trim(), orgName: org.trim(), industry: industry || '',
      standards: built.standards, standardVersions: built.standards.reduce((o, s) => (o[s.id] = s.version, o), {}),
      themes: built.themes, responses: {}, attachments: [], versions: [], carbon: { region: 'china', activity: {} }, status: 'draft', createdAt: Date.now(), updatedAt: Date.now()
    };
    DB.addEsgQuestionnaire(q).then((saved) => { Util.toast(T('问卷已生成'), 'ok'); renderFill(container, saved.id); }).catch((e) => Util.toast(T('生成失败：') + e.message, 'err'));
  }

  function renderFill(container, id) {
    const q = DB.getEsgQuestionnaire(id);
    if (!q) { renderList(container); return; }
    container.innerHTML = '';
    ui.view = 'fill'; ui.id = id;
    container.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [Util.el('h2', { class: 'page-title', text: q.title }), Util.el('div', { class: 'muted', text: (q.orgName || '') + ' · ' + (q.industry || '—') + ' · ' + (q.standards || []).map((s) => s.code + ' v' + s.version).join(' / ') })]),
      Util.el('button', { class: 'btn', onclick: () => renderList(container) }, T('← 返回列表'))
    ]));

    const issueBox = Util.el('div', { class: 'esg-issues' });
    const liveScores = Util.el('div', { class: 'esg-livescore muted' });

    const form = Util.el('div', { class: 'esg-form' });
    (q.themes || []).forEach((th) => {
      const card = Util.el('div', { class: 'panel card esg-theme' }, [
        Util.el('div', { class: 'esg-theme-head' }, [
          Util.el('h3', { text: T(th.name) + '（' + T('权重') + th.weight + '%）' }),
          Util.el('button', { class: 'btn btn-sm esg-add-topic', onclick: () => openTopicEditor(container, q, th.id, null) }, '+ ' + T('添加议题'))
        ])
      ]);
      (th.items || []).forEach((it) => card.appendChild(buildItemRow(q, it, issueBox, liveScores, container)));
      form.appendChild(card);
      // 环境维度内置碳排放计算器（数据采集 → 实时计算 → 自动回填 tCO2e 字段）
      if (th.id === 'environment') form.appendChild(buildCarbonPanel(q, container));
    });

    const bar = Util.el('div', { class: 'btn-row', style: 'margin:12px 0' }, [
      Util.el('button', { class: 'btn btn-primary', onclick: () => saveFill(q, container, true) }, T('保存并完成评分')),
      Util.el('button', { class: 'btn', onclick: () => saveFill(q, container, false) }, T('保存草稿')),
      liveScores
    ]);
    container.appendChild(issueBox);
    container.appendChild(form);
    container.appendChild(renderAttachPanel(container, q));
    container.appendChild(bar);
    refreshLive(q, liveScores, issueBox);
  }

  function buildItemRow(q, it, issueBox, liveScores, container) {
    const responses = q.responses || {};
    const val = responses[it.id];
    const row = Util.el('div', { class: 'esg-item' + (it.merged ? ' merged' : '') });
    const labelWrap = Util.el('div', { class: 'esg-item-label' }, [
      Util.el('span', { text: T(it.label) + (it.unit ? '（' + it.unit + '）' : '') }),
      it.required ? Util.el('span', { class: 'req', text: ' *' }) : null,
      it.merged ? Util.el('span', { class: 'tag gray', style: 'margin-left:6px', text: T('跨标准合并') }) : null,
      it.custom ? Util.el('span', { class: 'tag gray esg-custom-tag', style: 'margin-left:6px', text: T('自定义') }) : null,
      it.standardRefs && it.standardRefs.length ? Util.el('span', { class: 'muted', style: 'font-size:11px;margin-left:6px', text: it.standardRefs.join(' · ') }) : null
    ]);
    if (it.custom && container) {
      labelWrap.appendChild(Util.el('span', { class: 'row esg-topic-tools', style: 'gap:4px;margin-left:8px;flex:0' }, [
        Util.el('button', { class: 'btn btn-sm esg-topic-edit', onclick: () => openTopicEditor(container, q, it.themeId, it) }, T('编辑')),
        Util.el('button', { class: 'btn btn-sm btn-danger esg-topic-del', onclick: () => removeTopic(container, q, it.id) }, T('删除'))
      ]));
    }
    let input;
    if (it.type === 'yesno') {
      input = Util.el('select', { class: 'inp esg-inp' }, [Util.el('option', { value: '' }, T('请选择')), Util.el('option', { value: 'true' }, T('是')), Util.el('option', { value: 'false' }, T('否'))]);
      input.value = val === true || val === 'true' ? 'true' : (val === false || val === 'false' ? 'false' : '');
    } else if (it.type === 'rating') {
      input = Util.el('select', { class: 'inp esg-inp' }, [Util.el('option', { value: '' }, T('请评分'))].concat([1, 2, 3, 4, 5].map((n) => Util.el('option', { value: String(n) }, n + ' / 5'))));
      input.value = val == null ? '' : String(val);
    } else if (it.type === 'number') {
      input = Util.el('input', { type: 'number', class: 'inp esg-inp', placeholder: it.unit || '', value: val == null ? '' : val });
    } else if (it.type === 'select') {
      input = Util.el('select', { class: 'inp esg-inp' }, [Util.el('option', { value: '' }, T('请选择'))].concat((it.options || []).map((o) => Util.el('option', { value: o.label }, o.label))));
      input.value = val == null ? '' : val;
    } else {
      input = Util.el('textarea', { class: 'inp esg-inp', placeholder: T('定性说明'), value: val == null ? '' : val });
    }
    input.addEventListener('change', () => {
      let nv = input.value;
      if (it.type === 'yesno') nv = nv === 'true' ? true : (nv === 'false' ? false : '');
      else if (it.type === 'number' || it.type === 'rating') nv = nv === '' ? '' : Number(nv);
      q.responses[it.id] = nv;
      row.classList.remove('warn', 'err');
      refreshLive(q, liveScores, issueBox);
    });
    row.appendChild(labelWrap);
    row.appendChild(input);
    row.dataset.itemId = it.id;
    return row;
  }

  function refreshLive(q, liveScores, issueBox) {
    const sc = ESG.computeScores(q);
    liveScores.textContent = T('当前加权总分 ') + sc.total + ' / 100 · ' + T('填报覆盖 ') + sc.coverage + '%';
    const issues = ESG.validateResponses(q);
    issueBox.innerHTML = '';
    if (issues.length) {
      issueBox.appendChild(Util.el('div', { class: 'tip', style: 'margin-bottom:6px', text: T('校验提示（') + issues.length + T(' 项）') }));
      issues.forEach((iss) => {
        const row = document.querySelector('.esg-item[data-item-id="' + (iss.itemId || '') + '"]');
        if (row) row.classList.add(iss.level === 'error' ? 'err' : 'warn');
        issueBox.appendChild(Util.el('div', { class: 'esg-issue ' + (iss.level === 'error' ? 'err' : 'warn'), text: (iss.level === 'error' ? '✕ ' : '⚠ ') + iss.message }));
      });
    }
  }

  // ---------- REQ-E-07 UI：自定义议题编辑弹窗 ----------
  function parseSelectOptions(txt) {
    return String(txt || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const i = l.lastIndexOf('=');
      if (i < 0) return { label: l, score: 50 };
      const label = l.slice(0, i).trim();
      const sc = Number(l.slice(i + 1).trim());
      return { label: label, score: isNaN(sc) ? 50 : Math.max(0, Math.min(100, sc)) };
    });
  }

  function openTopicEditor(container, q, themeId, existing) {
    const lblI = Util.el('input', { type: 'text', class: 'inp esg-edt-label', value: existing ? existing.label : '', placeholder: T('如：可再生能源用电占比') });
    const themeSel = Util.el('select', { class: 'inp esg-edt-theme' }, (q.themes || []).map((t) => {
      const o = Util.el('option', { value: t.id }, T(t.name));
      if (t.id === (existing ? existing.themeId : themeId)) o.selected = true;
      return o;
    }));
    const typeSel = Util.el('select', { class: 'inp esg-edt-type' }, [
      Util.el('option', { value: 'yesno' }, T('是/否')),
      Util.el('option', { value: 'rating' }, T('1-5 评分')),
      Util.el('option', { value: 'number' }, T('数值')),
      Util.el('option', { value: 'select' }, T('下拉单选')),
      Util.el('option', { value: 'text' }, T('定性说明'))
    ]);
    typeSel.value = existing ? existing.type : 'yesno';
    const unitI = Util.el('input', { type: 'text', class: 'inp esg-edt-unit', value: existing ? (existing.unit || '') : '', placeholder: T('如：tCO2e、%、小时') });
    const wI = Util.el('input', { type: 'number', class: 'inp esg-edt-weight', step: '0.1', min: '0.1', max: '10', value: existing ? existing.weight : 1 });
    const reqCb = Util.el('input', { type: 'checkbox', class: 'esg-edt-req' });
    reqCb.checked = existing ? !!existing.required : false;
    const minI = Util.el('input', { type: 'number', class: 'inp esg-edt-min', value: existing && existing.min != null ? existing.min : '', placeholder: '0' });
    const maxI = Util.el('input', { type: 'number', class: 'inp esg-edt-max', value: existing && existing.max != null ? existing.max : '', placeholder: '100' });
    const optI = Util.el('textarea', { class: 'inp esg-edt-opts', rows: '3', placeholder: T('每行一项：选项=分数（0-100）') });
    if (existing && existing.type === 'select' && Array.isArray(existing.options)) {
      optI.value = existing.options.map((o) => o.label + '=' + o.score).join('\n');
    }

    const unitWrap = Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('单位（数值题）') }), unitI]);
    const numWrap = Util.el('div', { class: 'row esg-edt-num' }, [
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('下限') }), minI]),
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('上限') }), maxI])
    ]);
    const optWrap = Util.el('label', { class: 'fld esg-edt-optwrap' }, [Util.el('span', { class: 'lbl', text: T('下拉选项（每行：选项=分数 0-100）') }), optI]);
    const toggleType = () => {
      unitWrap.style.display = typeSel.value === 'number' ? '' : 'none';
      numWrap.style.display = typeSel.value === 'number' ? '' : 'none';
      optWrap.style.display = typeSel.value === 'select' ? '' : 'none';
    };
    typeSel.addEventListener('change', toggleType);
    toggleType();

    const body = Util.el('div', {}, [
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('议题名称') }), lblI]),
      Util.el('div', { class: 'row' }, [
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('所属主题') }), themeSel]),
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('题型') }), typeSel])
      ]),
      Util.el('div', { class: 'row' }, [
        unitWrap,
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('权重（0.1-10）') }), wI]),
        Util.el('label', { class: 'fld', style: 'flex:0' }, [Util.el('span', { class: 'lbl', text: T('必填') }), reqCb])
      ]),
      numWrap, optWrap
    ]);

    const md = Util.modal(existing ? T('编辑自定义议题') : T('添加自定义议题'), body, [
      Util.el('button', { class: 'btn btn-primary', onclick: () => {
        const item = ESG.makeCustomItem(themeSel.value, {
          label: lblI.value, type: typeSel.value, unit: unitI.value,
          weight: Number(wI.value), required: reqCb.checked,
          min: minI.value, max: maxI.value, options: parseSelectOptions(optI.value)
        });
        if (existing) item.id = item.key = existing.id;
        const err = ESG.upsertCustomItem(q, item);
        if (err) { Util.toast(err, 'err'); return; }
        md.close();
        DB.updateEsgQuestionnaire(q.id, { themes: q.themes }).then(() => {
          Util.toast(T('议题已保存'), 'ok');
          renderFill(container, q.id);
        }).catch((e) => Util.toast(T('保存失败：') + e.message, 'err'));
      } }, T('保存议题')),
      Util.el('button', { class: 'btn', onclick: () => md.close() }, T('取消'))
    ]);
  }

  function removeTopic(container, q, itemId) {
    Util.confirm(T('删除自定义议题'), T('确认删除该议题及其填报值？'), T('确认删除')).then((ok) => {
      if (!ok) return;
      const removed = ESG.removeCustomItem(q, itemId);
      if (!removed) { Util.toast(T('仅可删除自定义议题'), 'err'); return; }
      DB.updateEsgQuestionnaire(q.id, { themes: q.themes, responses: q.responses }).then(() => {
        Util.toast(T('议题已删除'), 'ok');
        renderFill(container, q.id);
      }).catch((e) => Util.toast(T('删除失败：') + e.message, 'err'));
    });
  }

  // ---------- 碳排放计算器（环境维度内置模块） ----------

  // 从问卷 responses 读取已存的碳活动数据；未存则取默认结构
  function carbonActivity(q) {
    return (q.carbon && q.carbon.activity) || {};
  }

  // 当前地区（优先取问卷设置，缺省中国）
  function carbonRegion(q) {
    return (q.carbon && q.carbon.region) || 'china';
  }

  // 渲染碳计算器面板：活动数据输入 → 实时计算 → 结构图 → 自动回填
  function buildCarbonPanel(q, container) {
    const panel = Util.el('div', { class: 'panel card esg-carbon' });
    const head = Util.el('div', { class: 'esg-carbon-head' }, [
      Util.el('div', { class: 'esg-carbon-title' }, [
        Util.el('h3', { text: T('碳排放计算器') }),
        Util.el('div', { class: 'muted', style: 'font-size:12px', text: T('在环境维度填写活动数据，系统实时计算并按 GHG Protocol 范围1/2/3 汇总，结果自动回填上方排放字段。') })
      ]),
      Util.el('span', { class: 'tag', text: T('内置模块') })
    ]);

    // 地区选择
    const regionSel = Util.el('select', { class: 'inp esg-carbon-region' }, [
      Util.el('option', { value: 'china' }, T('中国电网因子')),
      Util.el('option', { value: 'eu' }, T('欧盟因子')),
      Util.el('option', { value: 'uk' }, T('英国因子 (DEFRA)')),
      Util.el('option', { value: 'us' }, T('美国因子 (eGRID)'))
    ]);
    regionSel.value = carbonRegion(q);
    regionSel.addEventListener('change', () => {
      q.carbon = q.carbon || {}; q.carbon.region = regionSel.value;
      refreshCarbon(q, panel, container);
    });

    // 活动数据输入区（按范围分组）
    const scopeDefs = [
      { scope: 1, title: T('范围1 · 直接排放'), cats: ['naturalGas', 'gasoline', 'diesel', 'coal', 'companyCar'] },
      { scope: 2, title: T('范围2 · 能源间接排放'), cats: ['grid', 'heat'] },
      { scope: 3, title: T('范围3 · 价值链排放'), cats: ['commute', 'flight', 'logistics', 'bus'] }
    ];
    const inputs = {};
    const inputWrap = Util.el('div', { class: 'esg-carbon-scopes' });
    scopeDefs.forEach((sd) => {
      const box = Util.el('div', { class: 'esg-carbon-scope' }, [Util.el('div', { class: 'esg-carbon-scope-title', text: sd.title })]);
      sd.cats.forEach((catKey) => {
        const cat = Carbon.categories().find((c) => c.key === catKey);
        if (!cat) return;
        const inp = Util.el('input', { type: 'number', class: 'inp esg-carbon-inp', min: '0', step: 'any', placeholder: cat.unit, value: (carbonActivity(q)[catKey] != null ? carbonActivity(q)[catKey] : '') });
        inp.dataset.cat = catKey;
        inputs[catKey] = inp;
        inp.addEventListener('input', () => {
          q.carbon = q.carbon || {}; q.carbon.activity = q.carbon.activity || {};
          const v = inp.value;
          q.carbon.activity[catKey] = v === '' ? undefined : Number(v);
          refreshCarbon(q, panel, container);
        });
        box.appendChild(Util.el('div', { class: 'esg-carbon-field' }, [
          Util.el('span', { class: 'esg-carbon-lbl', text: cat.label }),
          Util.el('span', { class: 'esg-carbon-unit', text: cat.unit }),
          inp
        ]));
      });
      inputWrap.appendChild(box);
    });

    // 结果区：总览 + 环形图 + 条形图 + 建议 + 自动回填说明
    const resultBox = Util.el('div', { class: 'esg-carbon-result' });

    // 快速估算（渐进式）折叠区
    const estBox = Util.el('div', { class: 'esg-carbon-est' });
    const estToggle = Util.el('button', { class: 'btn btn-sm', onclick: () => { estBox.style.display = estBox.style.display === 'none' ? '' : 'none'; } }, T('快速估算（行业基准）'));
    const estWrap = Util.el('div', { class: 'esg-carbon-estbody', style: 'display:none' });
    const estEmp = Util.el('input', { type: 'number', class: 'inp', min: '1', placeholder: T('员工人数') });
    const estBtn = Util.el('button', { class: 'btn btn-primary btn-sm', onclick: () => {
      const ind = (q.industry || '').trim();
      if (!ind) { Util.toast(T('请先在创建页选择行业以进行基准估算'), 'err'); return; }
      const est = Carbon.estimate(ind, Number(estEmp.value) || 100);
      // 将估算结果写入活动数据并刷新
      q.carbon = q.carbon || {}; q.carbon.estimated = { industry: ind, employees: Number(estEmp.value) || 100, result: est };
      refreshCarbon(q, panel, container);
      estBox.querySelector('.esg-carbon-est-note').textContent = T('已按') + '「' + ind + '」' + T('基准估算：范围1 ') + est.scope1 + T(' t，范围2 ') + est.scope2 + T(' t，范围3 ') + est.scope3 + T(' t（') + T('估算值，建议按实际数据细化）');
    } }, T('估算'));
    estWrap.appendChild(Util.el('div', { class: 'row', style: 'gap:8px;align-items:center' }, [
      Util.el('span', { class: 'esg-carbon-lbl', text: T('行业基准（按已选行业）') + ' + ' + T('员工人数') }),
      estEmp, estBtn
    ]));
    estWrap.appendChild(Util.el('div', { class: 'muted esg-carbon-est-note', style: 'font-size:12px;margin-top:6px', text: T('估算基于行业平均排放强度，用于快速起步或数据缺失场景；正式披露请以实际活动数据为准。') }));
    estBox.appendChild(estToggle);
    estBox.appendChild(estWrap);

    panel.appendChild(head);
    panel.appendChild(Util.el('div', { class: 'row esg-carbon-bar' }, [Util.el('label', { class: 'fld', style: 'flex:0', text: T('排放因子区域') }, regionSel)]));
    panel.appendChild(inputWrap);
    panel.appendChild(estBox);
    panel.appendChild(resultBox);

    refreshCarbon(q, panel, container);
    return panel;
  }

  // 实时刷新碳计算结果区（含自动回填到 tCO2e 字段）
  function refreshCarbon(q, panel, container) {
    q.carbon = q.carbon || { region: 'china', activity: {} };
    q.carbon.activity = q.carbon.activity || {};
    const resultBox = panel.querySelector('.esg-carbon-result');
    if (!resultBox) return;
    const region = carbonRegion(q);
    const activity = carbonActivity(q);
    const res = Carbon.compute(activity, region);

    // 自动回填：范围1+2 → s2met_s1 / gri305_ghg。规则：空值 或 当前值等于上次自动回填值时更新，保留手工修改。
    const backfillTargets = ['s2met_s1', 'gri305_ghg'];
    const total12 = round2(res.scope1 + res.scope2);
    q.carbon.autoFilled = q.carbon.autoFilled || {};
    backfillTargets.forEach((key) => {
      const item = ESG.findItem(q, key);
      if (!item) return;
      const current = q.responses[item.id];
      const last = q.carbon.autoFilled[key];
      if (current == null || current === '' || Number(current) === Number(last)) {
        if (total12 > 0) {
          q.responses[item.id] = total12;
          q.carbon.autoFilled[key] = total12;
        }
      }
    });

    resultBox.innerHTML = '';
    if (!res.total) {
      resultBox.appendChild(Util.el('div', { class: 'empty', text: T('在上方填写电力、燃料或交通等活动数据，将实时计算碳排放并展示结构。') }));
      return;
    }

    // 总览
    resultBox.appendChild(Util.el('div', { class: 'esg-carbon-total' }, [
      Util.el('div', { class: 'esg-carbon-total-big', text: fmtCO2(res.total) + ' tCO₂e' }),
      Util.el('div', { class: 'muted', style: 'font-size:12px', text: T('总排放量（') + regionLabel(region) + '）' })
    ]));

    // 图表行：环形图 + 条形图
    const charts = Util.el('div', { class: 'grid cols-2 esg-carbon-charts', style: 'margin-top:8px;align-items:start' }, [
      Util.el('div', { class: 'esg-carbon-donut', html: Carbon.donutSvg(res, { size: 210 }) }),
      Util.el('div', { class: 'esg-carbon-bars', html: Carbon.barsSvg(res, { width: 560 }) })
    ]);
    resultBox.appendChild(charts);

    // 三范围明细表（可追溯）
    const scopeTbl = Util.el('table', { class: 'tbl', style: 'margin-top:10px' });
    scopeTbl.appendChild(Util.el('thead', {}, Util.el('tr', {}, [
      Util.el('th', { text: T('范围') }), Util.el('th', { text: T('排放量') }), Util.el('th', { text: T('占比') })
    ])));
    const tb = Util.el('tbody', {});
    [[T('范围1'), res.scope1, T('直接排放')], [T('范围2'), res.scope2, T('间接排放')], [T('范围3'), res.scope3, T('价值链排放')]].forEach((r) => {
      const pct = res.total ? Math.round((r[1] / res.total) * 100) : 0;
      tb.appendChild(Util.el('tr', {}, [Util.el('td', { text: r[0] + ' · ' + r[2] }), Util.el('td', { text: fmtCO2(r[1]) + ' tCO₂e' }), Util.el('td', { text: pct + '%' })]));
    });
    tb.appendChild(Util.el('tr', { class: 'esg-carbon-totalrow' }, [Util.el('td', { text: T('合计') }), Util.el('td', { text: fmtCO2(res.total) + ' tCO₂e' }), Util.el('td', { text: '100%' })]));
    scopeTbl.appendChild(tb);
    resultBox.appendChild(scopeTbl);

    // 减排建议
    const tips = Carbon.reductionTips(res);
    if (tips.length) {
      const tipBox = Util.el('div', { class: 'esg-carbon-tips' }, [Util.el('div', { class: 'esg-carbon-tips-title', text: T('减排建议') })]);
      tips.forEach((t) => tipBox.appendChild(Util.el('div', { class: 'esg-imp', text: '• ' + t.text })));
      resultBox.appendChild(tipBox);
    }

    // 自动回填提示
    const filled = backfillTargets.filter((key) => { const it = ESG.findItem(q, key); return it && total12 > 0 && (q.responses[it.id] != null && q.responses[it.id] !== ''); });
    if (filled.length) {
      resultBox.appendChild(Util.el('div', { class: 'muted esg-carbon-backfill', style: 'font-size:12px;margin-top:8px', text: T('已将范围1+2排放量自动回填至上方排放字段（') + filled.map((k) => T(ESG.findItem(q, k).label)).join('、') + T('）。如已手工填写将不再覆盖。') }));
    }
  }

  function round2(n) { return Math.round(n * 100) / 100; }
  function fmtCO2(n) { n = Number(n) || 0; return (Math.round(n * 10) / 10).toLocaleString('zh-CN'); }
  function regionLabel(r) {
    return ({ china: T('中国电网'), eu: T('欧盟'), uk: T('英国 DEFRA'), us: T('美国 eGRID') })[r] || T('中国电网');
  }

  // 报告页碳排放总览面板
  function buildCarbonReportPanel(carbon) {
    const panel = Util.el('div', { class: 'panel card esg-carbon-report' });
    panel.appendChild(Util.el('div', { class: 'esg-carbon-head' }, [
      Util.el('h3', { text: T('碳排放总览（GHG Protocol 三范围）') }),
      Util.el('span', { class: 'tag', text: T('排放因子：') + regionLabel(carbon.region) })
    ]));
    const res = { scope1: carbon.scope1, scope2: carbon.scope2, scope3: carbon.scope3, total: carbon.total, items: carbon.items };
    const charts = Util.el('div', { class: 'grid cols-2 esg-carbon-charts', style: 'margin-top:8px;align-items:start' }, [
      Util.el('div', { class: 'esg-carbon-donut', html: Carbon.donutSvg(res, { size: 210 }) }),
      Util.el('div', { class: 'esg-carbon-bars', html: Carbon.barsSvg(res, { width: 560 }) })
    ]);
    panel.appendChild(charts);
    const scopeTbl = Util.el('table', { class: 'tbl', style: 'margin-top:10px' });
    scopeTbl.appendChild(Util.el('thead', {}, Util.el('tr', {}, [
      Util.el('th', { text: T('范围') }), Util.el('th', { text: T('排放量') }), Util.el('th', { text: T('占比') })
    ])));
    const tb = Util.el('tbody', {});
    [[T('范围1'), carbon.scope1, T('直接排放')], [T('范围2'), carbon.scope2, T('间接排放')], [T('范围3'), carbon.scope3, T('价值链排放')]].forEach((r) => {
      const pct = carbon.total ? Math.round((r[1] / carbon.total) * 100) : 0;
      tb.appendChild(Util.el('tr', {}, [Util.el('td', { text: r[0] + ' · ' + r[2] }), Util.el('td', { text: fmtCO2(r[1]) + ' tCO₂e' }), Util.el('td', { text: pct + '%' })]));
    });
    tb.appendChild(Util.el('tr', { class: 'esg-carbon-totalrow' }, [Util.el('td', { text: T('合计') }), Util.el('td', { text: fmtCO2(carbon.total) + ' tCO₂e' }), Util.el('td', { text: '100%' })]));
    scopeTbl.appendChild(tb);
    panel.appendChild(scopeTbl);
    if (carbon.estimated) {
      panel.appendChild(Util.el('div', { class: 'muted esg-carbon-backfill', style: 'font-size:12px;margin-top:8px', text: T('* 该数据为行业基准估算值（') + (carbon.estimated.industry || '') + ' · ' + T('员工') + carbon.estimated.employees + T(' 人），建议以实际活动数据细化。') }));
    }
    if (carbon.tips.length) {
      const tipBox = Util.el('div', { class: 'esg-carbon-tips' }, [Util.el('div', { class: 'esg-carbon-tips-title', text: T('减排建议') })]);
      carbon.tips.forEach((t) => tipBox.appendChild(Util.el('div', { class: 'esg-imp', text: '• ' + t.text })));
      panel.appendChild(tipBox);
    }
    return panel;
  }

  // ---------- REQ-E-10 UI：附件上传 / 存储 / 展示 ----------
  function fmtSize(n) {
    n = Number(n) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }

  function readAttachFile(f) {
    return new Promise((resolve, reject) => {
      if (f.size > 2 * 1024 * 1024) { reject(new Error(T('单文件不能超过 2MB'))); return; }
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(new Error(T('读取文件失败')));
      fr.readAsDataURL(f);
    });
  }

  function renderAttachPanel(container, q) {
    const panel = Util.el('div', { class: 'panel card esg-attach-panel' }, [Util.el('h3', { text: T('附件与佐证材料') })]);
    const allItems = [];
    (q.themes || []).forEach((th) => (th.items || []).forEach((it) => allItems.push(it)));
    const linkSel = Util.el('select', { class: 'inp esg-attach-link' },
      [Util.el('option', { value: '' }, T('不关联具体议题'))].concat(allItems.map((it) => Util.el('option', { value: it.id }, T(it.label).slice(0, 40)))));
    const fileI = Util.el('input', { type: 'file', class: 'esg-attach-file', style: 'display:none', multiple: 'multiple' });
    const pickBtn = Util.el('button', { class: 'btn esg-attach-pick', onclick: () => fileI.click() }, T('上传附件'));
    const hint = Util.el('div', { class: 'muted', style: 'font-size:12px;margin:6px 0', text: T('支持图片 / 文档，单文件 ≤ 2MB，存储于本机 IndexedDB，可关联任意议题作为佐证。') });
    const list = Util.el('div', { class: 'esg-att-list' });

    const refresh = () => {
      DB.getEsgAttachments(q.id).then((atts) => {
        list.innerHTML = '';
        if (!atts.length) {
          list.appendChild(Util.el('div', { class: 'empty', text: T('暂无附件。可先在上方选择关联议题，再上传佐证材料（如能耗账单、培训签到、排污许可）。') }));
          return;
        }
        atts.forEach((a) => list.appendChild(attRow(q, a, refresh)));
      }).catch((e) => list.appendChild(Util.el('div', { class: 'empty', text: T('附件加载失败：') + (e.message || e) })));
    };

    fileI.addEventListener('change', () => {
      const files = Array.prototype.slice.call(fileI.files || []);
      if (!files.length) return;
      const itemId = linkSel.value;
      let chain = Promise.resolve();
      files.forEach((f) => {
        chain = chain.then(() => readAttachFile(f).then((dataUrl) => DB.addEsgAttachment(q.id, {
          id: Util.uid('att'), esgId: q.id, name: f.name, type: f.type || 'application/octet-stream',
          size: f.size, dataUrl: dataUrl, caption: '', itemId: itemId, createdAt: Date.now()
        })));
      });
      chain.then(() => { Util.toast(T('附件已上传'), 'ok'); refresh(); })
        .catch((e) => Util.toast(T('上传失败：') + (e.message || e), 'err'));
      fileI.value = '';
    });

    panel.appendChild(Util.el('div', { class: 'row esg-attach-bar' }, [linkSel, pickBtn, fileI]));
    panel.appendChild(hint);
    panel.appendChild(list);
    refresh();
    return panel;
  }

  function attRow(q, a, refresh) {
    const isImg = /^image\//.test(a.type || '');
    const item = a.itemId ? ESG.findItem(q, a.itemId) : null;
    const ext = (a.name || '').split('.').pop() || '';
    const thumb = (isImg && a.dataUrl)
      ? Util.el('img', { class: 'esg-att-thumb', src: a.dataUrl, alt: a.name })
      : Util.el('span', { class: 'esg-att-ext', text: ext.slice(0, 4).toUpperCase() });
    const name = Util.el('div', { class: 'esg-att-name', text: a.name });
    const meta = Util.el('div', { class: 'muted', style: 'font-size:11px',
      text: fmtSize(a.size) + (item ? ' · ' + T('关联') + T(item.label).slice(0, 24) : '') + ' · ' + Util.fmtDate(a.createdAt) });
    const dl = a.dataUrl ? Util.el('a', { class: 'btn btn-sm', href: a.dataUrl, download: a.name, target: '_blank', rel: 'noopener' }, T('下载')) : null;
    const del = Util.el('button', { class: 'btn btn-sm btn-danger esg-att-del', onclick: () => {
      Util.confirm(T('删除附件'), T('确认删除该附件？'), T('确认删除')).then((ok) => {
        if (!ok) return;
        DB.deleteEsgAttachment(a.id, q.id).then(() => { Util.toast(T('附件已删除'), 'ok'); refresh(); })
          .catch((e) => Util.toast(T('删除失败：') + e.message, 'err'));
      });
    } }, T('删除'));
    return Util.el('div', { class: 'esg-att-row' }, [
      thumb,
      Util.el('div', { class: 'esg-att-info' }, [name, meta]),
      Util.el('div', { class: 'row', style: 'gap:6px;flex:0' }, [dl, del])
    ]);
  }


  function saveFill(q, container, complete) {
    const issues = ESG.validateResponses(q);
    const errors = issues.filter((i) => i.level === 'error');
    if (complete && errors.length) {
      Util.toast(T('存在必填项或红线项未通过校验，已高亮，请修正后再完成。'), 'err');
      refreshLive(q, container.querySelector('.esg-livescore'), container.querySelector('.esg-issues'));
      return;
    }
    const sc = ESG.computeScores(q);
    // 持久化时确保 carbon 结构存在（含活动数据与估算结果）
    q.carbon = q.carbon || { region: 'china', activity: {} };
    const patch = { responses: q.responses, carbon: q.carbon, scores: sc, status: complete ? 'done' : 'draft', updatedAt: Date.now() };
    DB.updateEsgQuestionnaire(q.id, patch).then(() => {
      Util.toast(complete ? T('评分已完成') : T('草稿已保存'), 'ok');
      if (complete) renderReport(container, q.id);
      else refreshLive(q, container.querySelector('.esg-livescore'), container.querySelector('.esg-issues'));
    }).catch((e) => Util.toast(T('保存失败：') + e.message, 'err'));
  }

  function renderReport(container, id) {
    const q = DB.getEsgQuestionnaire(id);
    if (!q) { renderList(container); return; }
    if (!q.scores) { const sc = ESG.computeScores(q); q.scores = sc; }
    const prev = findPrev(q);
    const data = ESG.generateReportData(q, prev);
    container.innerHTML = '';
    ui.view = 'report'; ui.id = id;
    container.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [Util.el('h2', { class: 'page-title', text: q.title + ' · ' + T('ESG 报告') }), Util.el('div', { class: 'muted', text: (q.orgName || '') + ' · ' + (q.industry || '—') + ' · ' + Util.fmtDate(data.meta.date) })]),
      Util.el('div', { class: 'btn-row' }, [
        Util.el('button', { class: 'btn', onclick: () => exportWord(q, data) }, T('导出 Word')),
        Util.el('button', { class: 'btn', onclick: () => exportPdf(q, data) }, T('导出 PDF')),
        Util.el('button', { class: 'btn', onclick: () => exportExcel(q, data) }, T('导出 Excel')),
        Util.el('button', { class: 'btn', onclick: () => renderFill(container, id) }, T('返回填写')),
        Util.el('button', { class: 'btn', onclick: () => renderList(container) }, T('列表'))
      ])
    ]));

    // 雷达 + 总分
    const radarSvg = buildRadarSvg(data);
    const scorePanel = Util.el('div', { class: 'grid cols-2', style: 'margin:14px 0;align-items:start' }, [
      Util.el('div', { class: 'panel card' }, [Util.el('h3', { text: T('雷达分析图') }), radarSvg]),
      Util.el('div', { class: 'panel card' }, [
        Util.el('h3', { text: T('加权总分') + '：' + data.scores.total + ' / 100' }),
        Util.el('div', { class: 'esg-bench', style: 'margin-bottom:8px', text: T('填报覆盖 ') + data.scores.coverage + '%' + (data.yoy ? ' · ' + T('同比') + (data.yoy.delta >= 0 ? '+' : '') + data.yoy.delta : '') }),
        Util.el('div', {}, THEME_IDS.map((tid) => {
          const ts = data.scores.themeScores[tid]; if (!ts) return null;
          const bv = data.benchmark ? data.benchmark[tid] : null;
          return Util.el('div', { class: 'esg-themebar' }, [
            Util.el('span', { class: 'esg-themebar-name', text: T(ts.name) }),
            Util.el('span', { class: 'esg-themebar-track' }, [Util.el('span', { class: 'esg-themebar-fill', style: 'width:' + ts.score + '%' })]),
            Util.el('span', { class: 'esg-themebar-val', text: String(ts.score) + (bv != null ? ' / 基准 ' + bv : '') })
          ]);
        }))
      ])
    ]);
    container.appendChild(scorePanel);

    // 改进建议
    if (data.improvement.length) {
      const imp = Util.el('div', { class: 'panel card' }, [Util.el('h3', { text: T('改进建议') })]);
      data.improvement.forEach((s) => imp.appendChild(Util.el('div', { class: 'esg-imp', text: '• ' + s.suggestion })));
      container.appendChild(imp);
    }

    // 碳排放总览（环境维度碳计算器输出联动，GHG Protocol 三范围）
    if (data.carbon && data.carbon.total > 0) {
      container.appendChild(buildCarbonReportPanel(data.carbon));
    }

    // 议题映射
    if (data.mapping.length) {
      const mp = Util.el('div', { class: 'panel card' }, [Util.el('h3', { text: T('跨标准议题映射') })]);
      const tbl = Util.el('table', { class: 'tbl' });
      tbl.appendChild(Util.el('thead', {}, Util.el('tr', {}, [Util.el('th', { text: T('议题组') }), Util.el('th', { text: T('所属主题') }), Util.el('th', { text: T('对应标准条款') }), Util.el('th', { text: T('说明') })])));
      const tb = Util.el('tbody', {});
      data.mapping.forEach((m) => tb.appendChild(Util.el('tr', {}, [
        Util.el('td', { text: m.group }),
        Util.el('td', { text: themeName(m.theme) }),
        Util.el('td', { text: m.codes.join(' · ') }),
        Util.el('td', { class: 'muted', text: m.note })
      ])));
      tbl.appendChild(tb); mp.appendChild(tbl); container.appendChild(mp);
    }

    // 多标准披露章节
    data.multiStd.forEach((st) => {
      const sec = Util.el('div', { class: 'panel card' }, [Util.el('h3', { text: st.code + ' · ' + T(st.name) + '（v' + st.version + ' · ' + st.approach + '）' })]);
      st.pillars.forEach((p) => {
        sec.appendChild(Util.el('div', { class: 'esg-pillar' }, [
          Util.el('div', { class: 'esg-pillar-title', text: p.title }),
          Util.el('div', { class: 'esg-pillar-topics', text: p.topics.map((t) => t.code + ' ' + t.title).join('；') })
        ]));
      });
      container.appendChild(sec);
    });
  }

  function themeName(id) { const t = ESGSeed.themes.find((x) => x.id === id); return t ? t.name : id; }

  function findPrev(q) {
    const list = DB.getEsgQuestionnaires().filter((x) => x.id !== q.id && x.orgName === q.orgName && x.industry === q.industry && x.status === 'done' && x.scores);
    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return list[0] || null;
  }

  function buildRadarSvg(data) {
    const pts = data.radarPoints;
    const cx = 130, cy = 120, r = 95;
    const n = pts.length;
    let grid = '';
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      const gpts = pts.map((p, i) => { const a = p.a; return Math.round(cx + r * f * Math.cos(a)) + ',' + Math.round(cy + r * f * Math.sin(a)); }).join(' ');
      grid += '<polygon points="' + gpts + '" fill="none" stroke="#d4dae6" stroke-width="1"/>';
    });
    let axes = '', labels = '';
    pts.forEach((p, i) => {
      const ex = cx + r * Math.cos(p.a), ey = cy + r * Math.sin(p.a);
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + ex + '" y2="' + ey + '" stroke="#d4dae6" stroke-width="1"/>';
      const lx = cx + (r + 16) * Math.cos(p.a), ly = cy + (r + 16) * Math.sin(p.a);
      const nm = themeName(THEME_IDS[i]);
      labels += '<text x="' + lx + '" y="' + ly + '" font-size="11" fill="#3a4256" text-anchor="middle">' + Util.esc(T(nm)) + '</text>';
      labels += '<text x="' + lx + '" y="' + (ly + 12) + '" font-size="10" fill="#8a94a6" text-anchor="middle">' + data.themeValues[i] + '</text>';
    });
    const poly = pts.map((p) => p.x + ',' + p.y).join(' ');
    return Util.el('div', { class: 'esg-radar', html:
      '<svg viewBox="0 0 260 250" width="100%" height="240">' +
      grid + axes +
      '<polygon points="' + poly + '" fill="rgba(40,64,168,0.28)" stroke="#2840a8" stroke-width="2"/>' +
      pts.map((p) => '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="#2840a8"/>').join('') +
      labels + '</svg>' });
  }

  // ---------- 导出 ----------
  async function exportExcel(q, data) {
    try {
      // 懒加载 XLSX（首次导出时按需下载）
      try { await ReportEngine.ensureLibs(['xlsx']); } catch (e) { Util.toast(T('Excel 组件加载失败：') + (e && e.message), 'err'); return; }
      const XLSX = global.XLSX;
      if (!XLSX) { Util.toast(T('Excel 组件未加载'), 'err'); return; }
      const wb = XLSX.utils.book_new();
      const sum = [['主题', '得分', '权重%', '行业基准']].concat(THEME_IDS.map((tid) => { const ts = data.scores.themeScores[tid]; const bv = data.benchmark ? data.benchmark[tid] : ''; return [T(ts.name), ts.score, ts.weight, bv]; }));
      sum.push([T('加权总分'), data.scores.total, '', '']);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sum), T('评分汇总'));
      const det = [['主题', '议题', '类型', '填报值', '单项得分']];
      (q.themes || []).forEach((th) => (th.items || []).forEach((it) => { det.push([T(th.name), T(it.label), it.type, String(q.responses[it.id] != null ? q.responses[it.id] : ''), ESG.itemScore(it, q.responses[it.id]) == null ? '-' : ESG.itemScore(it, q.responses[it.id])]); }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(det), T('填报明细'));
      // 附件清单（REQ-E-10：导出含佐证材料索引）
      if ((q.attachments || []).length) {
        const at = [[T('文件名'), T('类型'), T('大小'), T('关联议题'), T('上传时间')]].concat((q.attachments || []).map((a) => {
          const it = a.itemId ? ESG.findItem(q, a.itemId) : null;
          return [a.name, a.type || '', fmtSize(a.size), it ? T(it.label) : '', Util.fmtDate(a.createdAt)];
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(at), T('附件清单'));
      }
      const mp = [['议题组', '主题', '标准条款', '说明']].concat(data.mapping.map((m) => [m.group, themeName(m.theme), m.codes.join(' / '), m.note]));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mp), T('议题映射'));
      // 碳排放数据表（环境维度碳计算器输出联动）
      if (data.carbon && data.carbon.total > 0) {
        const cs = [
          [T('碳排放计算（GHG Protocol 三范围）'), ''],
          [T('排放因子区域'), regionLabel(data.carbon.region)],
          [T('范围'), T('排放量 tCO₂e'), T('占比')]
        ];
        cs.push([T('范围1 · 直接排放'), data.carbon.scope1, data.carbon.total ? Math.round((data.carbon.scope1 / data.carbon.total) * 100) + '%' : '0%']);
        cs.push([T('范围2 · 间接排放'), data.carbon.scope2, data.carbon.total ? Math.round((data.carbon.scope2 / data.carbon.total) * 100) + '%' : '0%']);
        cs.push([T('范围3 · 价值链排放'), data.carbon.scope3, data.carbon.total ? Math.round((data.carbon.scope3 / data.carbon.total) * 100) + '%' : '0%']);
        cs.push([T('合计'), data.carbon.total, '100%']);
        if (data.carbon.items.length) {
          cs.push([]);
          cs.push([T('明细'), T('活动量'), T('排放量 tCO₂e')]);
          data.carbon.items.forEach((it) => cs.push([it.label, it.qty + ' ' + it.unit, Math.round(it.emission * 100) / 100]));
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cs), T('碳排放'));
      }
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      Util.download(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), (q.title || 'ESG') + '_报告.xlsx');
    } catch (e) { Util.toast(T('导出失败：') + e.message, 'err'); }
  }

  function exportWord(q, data) {
    try {
      let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + Util.esc(q.title) + '</title></head><body>';
      html += '<h1>' + Util.esc(q.title) + ' · ' + Util.esc(T('ESG 报告')) + '</h1>';
      html += '<p>' + Util.esc((q.orgName || '') + ' / ' + (q.industry || '—') + ' / ' + Util.fmtDate(data.meta.date)) + '</p>';
      html += '<h2>' + Util.esc(T('加权总分')) + '：' + data.scores.total + ' / 100（' + T('覆盖') + ' ' + data.scores.coverage + '%）</h2>';
      html += '<h2>' + Util.esc(T('四主题得分')) + '</h2><table border="1" cellspacing="0" cellpadding="6"><tr><th>' + Util.esc(T('主题')) + '</th><th>' + Util.esc(T('得分')) + '</th><th>' + Util.esc(T('权重%')) + '</th><th>' + Util.esc(T('行业基准')) + '</th></tr>';
      THEME_IDS.forEach((tid) => { const ts = data.scores.themeScores[tid]; const bv = data.benchmark ? data.benchmark[tid] : '-'; html += '<tr><td>' + Util.esc(T(ts.name)) + '</td><td>' + ts.score + '</td><td>' + ts.weight + '%</td><td>' + bv + '</td></tr>'; });
      html += '</table>';
      html += '<h2>' + Util.esc(T('改进建议')) + '</h2><ul>' + data.improvement.map((s) => '<li>' + Util.esc(s.suggestion) + '</li>').join('') + '</ul>';
      html += '<h2>' + Util.esc(T('跨标准议题映射')) + '</h2><table border="1" cellspacing="0" cellpadding="6"><tr><th>' + Util.esc(T('议题组')) + '</th><th>' + Util.esc(T('所属主题')) + '</th><th>' + Util.esc(T('对应标准条款')) + '</th></tr>';
      data.mapping.forEach((m) => { html += '<tr><td>' + Util.esc(m.group) + '</td><td>' + Util.esc(themeName(m.theme)) + '</td><td>' + Util.esc(m.codes.join(' / ')) + '</td></tr>'; });
      html += '</table>';
      // 碳排放总览（GHG Protocol 三范围）
      if (data.carbon && data.carbon.total > 0) {
        html += '<h2>' + Util.esc(T('碳排放总览')) + '（' + Util.esc(T('GHG Protocol 三范围')) + ' · ' + Util.esc(regionLabel(data.carbon.region)) + '）</h2>';
        html += '<table border="1" cellspacing="0" cellpadding="6"><tr><th>' + Util.esc(T('范围')) + '</th><th>' + Util.esc(T('排放量 tCO₂e')) + '</th><th>' + Util.esc(T('占比')) + '</th></tr>';
        html += '<tr><td>' + Util.esc(T('范围1 · 直接排放')) + '</td><td>' + data.carbon.scope1 + '</td><td>' + (data.carbon.total ? Math.round((data.carbon.scope1 / data.carbon.total) * 100) : 0) + '%</td></tr>';
        html += '<tr><td>' + Util.esc(T('范围2 · 间接排放')) + '</td><td>' + data.carbon.scope2 + '</td><td>' + (data.carbon.total ? Math.round((data.carbon.scope2 / data.carbon.total) * 100) : 0) + '%</td></tr>';
        html += '<tr><td>' + Util.esc(T('范围3 · 价值链排放')) + '</td><td>' + data.carbon.scope3 + '</td><td>' + (data.carbon.total ? Math.round((data.carbon.scope3 / data.carbon.total) * 100) : 0) + '%</td></tr>';
        html += '<tr><td><strong>' + Util.esc(T('合计')) + '</strong></td><td><strong>' + data.carbon.total + '</strong></td><td>100%</td></tr></table>';
        if (data.carbon.items.length) {
          html += '<h3>' + Util.esc(T('明细')) + '</h3><ul>' + data.carbon.items.map((it) => '<li>' + Util.esc(it.label) + '：' + it.qty + ' ' + Util.esc(it.unit) + ' → ' + Math.round(it.emission * 100) / 100 + ' tCO₂e</li>').join('') + '</ul>';
        }
        if (data.carbon.tips.length) {
          html += '<h3>' + Util.esc(T('减排建议')) + '</h3><ul>' + data.carbon.tips.map((t) => '<li>' + Util.esc(t.text) + '</li>').join('') + '</ul>';
        }
        if (data.carbon.estimated) {
          html += '<p style="font-size:11px;color:#666">* ' + Util.esc(T('该数据为行业基准估算值（') + (data.carbon.estimated.industry || '') + ' · ' + T('员工') + data.carbon.estimated.employees + T(' 人），建议以实际活动数据细化。')) + '</p>';
        }
      }
      // 附件清单（REQ-E-10）
      if ((q.attachments || []).length) {
        html += '<h2>' + Util.esc(T('附件清单')) + '</h2><ul>' + (q.attachments || []).map((a) => {
          const it = a.itemId ? ESG.findItem(q, a.itemId) : null;
          return '<li>' + Util.esc(a.name) + '（' + fmtSize(a.size) + (it ? ' · ' + Util.esc(T(it.label)) : '') + '）</li>';
        }).join('') + '</ul>';
      }
      html += '</body></html>';
      const blob = new Blob(['﻿', html], { type: 'application/msword' });
      Util.download(blob, (q.title || 'ESG') + '_' + T('ESG 报告') + '.doc');
    } catch (e) { Util.toast(T('导出失败：') + e.message, 'err'); }
  }

  async function exportPdf(q, data) {
    try {
      // SUP-042：改用 html2canvas 光栅化 + jsPDF，避免 jsPDF 原生 text 中文乱码
      try { await ReportEngine.ensureLibs(['jspdf', 'html2canvas']); } catch (e) { Util.toast(T('PDF 组件加载失败：') + (e && e.message), 'err'); return; }
      const jsPDFCtor = global.jspdf && global.jspdf.jsPDF ? global.jspdf.jsPDF : global.jsPDF;
      if (!jsPDFCtor) { Util.toast(T('PDF 组件未加载'), 'err'); return; }
      // 构建离屏报告 DOM（与页面报告一致：标题 + 雷达图 + 总分 + 改进建议 + 议题映射 + 多标准披露）
      var holder = global.document.createElement('div');
      var RADAR_W = 718;
      holder.style.position = 'fixed';
      holder.style.left = '-9999px';
      holder.style.top = '0';
      holder.style.width = RADAR_W + 'px';
      holder.style.boxSizing = 'border-box';
      holder.style.background = '#fff';
      var ACCENT = '#2840a8', LINE = '#B0D4F1', INK = '#333', MUTED = '#6b7a90';
      var esc = Util.esc;
      var html = '<div style="font-family:\"Segoe UI\",\"PingFang SC\",\"Microsoft YaHei\",Arial,sans-serif;color:' + INK + ';font-size:12.5px;line-height:1.6;padding:16px">';
      // 报告头
      html += '<div style="text-align:center;padding-bottom:10px;border-bottom:2px solid ' + LINE + '">' +
        '<div style="font-size:20px;font-weight:800;color:' + ACCENT + ';letter-spacing:.5px">' + esc(q.title) + ' · ' + esc(T('ESG 报告')) + '</div>' +
        '<div style="color:' + MUTED + ';font-size:11px;margin-top:4px">' + esc((q.orgName || '') + ' · ' + (q.industry || '—') + ' · ' + Util.fmtDate(data.meta.date)) + '</div>' +
        '</div>';
      // 雷达图 + 总分
      var radarSvgHtml = (function () {
        var pts = data.radarPoints;
        var cx = 130, cy = 120, r = 95;
        var n = pts.length;
        var grid = '';
        [0.25, 0.5, 0.75, 1].forEach(function (f) {
          var gpts = pts.map(function (p, i) { var a = p.a; return Math.round(cx + r * f * Math.cos(a)) + ',' + Math.round(cy + r * f * Math.sin(a)); }).join(' ');
          grid += '<polygon points="' + gpts + '" fill="none" stroke="#d4dae6" stroke-width="1"/>';
        });
        var axes = '', labels = '';
        pts.forEach(function (p, i) {
          var ex = cx + r * Math.cos(p.a), ey = cy + r * Math.sin(p.a);
          axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + ex + '" y2="' + ey + '" stroke="#d4dae6" stroke-width="1"/>';
          var lx = cx + (r + 16) * Math.cos(p.a), ly = cy + (r + 16) * Math.sin(p.a);
          var nm = themeName(THEME_IDS[i]);
          labels += '<text x="' + lx + '" y="' + ly + '" font-size="11" fill="#3a4256" text-anchor="middle">' + esc(T(nm)) + '</text>';
          labels += '<text x="' + lx + '" y="' + (ly + 12) + '" font-size="10" fill="#8a94a6" text-anchor="middle">' + data.themeValues[i] + '</text>';
        });
        var poly = pts.map(function (p) { return p.x + ',' + p.y; }).join(' ');
        return '<svg viewBox="0 0 260 250" width="100%" height="220" style="display:block">' + grid + axes +
          '<polygon points="' + poly + '" fill="rgba(40,64,168,0.28)" stroke="#2840a8" stroke-width="2"/>' +
          pts.map(function (p) { return '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="#2840a8"/>'; }).join('') +
          labels + '</svg>';
      })();
      html += '<table style="width:100%;border-collapse:collapse;margin:14px 0"><tr>' +
        '<td style="width:48%;vertical-align:top;padding:10px;border:1px solid #E3EAF2;border-radius:4px"><div style="font-size:13px;font-weight:700;color:' + ACCENT + ';margin-bottom:8px">' + esc(T('雷达分析图')) + '</div>' + radarSvgHtml + '</td>' +
        '<td style="width:4%"></td>' +
        '<td style="width:48%;vertical-align:top;padding:10px;border:1px solid #E3EAF2;border-radius:4px">' +
        '<div style="font-size:13px;font-weight:700;color:' + ACCENT + ';margin-bottom:8px">' + esc(T('加权总分')) + '：' + data.scores.total + ' / 100</div>' +
        '<div style="font-size:11px;color:' + MUTED + ';margin-bottom:10px">' + esc(T('填报覆盖')) + ' ' + data.scores.coverage + '%' + (data.yoy ? ' · ' + esc(T('同比')) + (data.yoy.delta >= 0 ? '+' : '') + data.yoy.delta : '') + '</div>';
      THEME_IDS.forEach(function (tid) {
        var ts = data.scores.themeScores[tid]; if (!ts) return;
        var bv = data.benchmark ? data.benchmark[tid] : null;
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
          '<div style="width:90px;font-size:11px;color:' + INK + '">' + esc(T(ts.name)) + '</div>' +
          '<div style="flex:1;height:8px;background:#E8EEF6;border-radius:4px;overflow:hidden"><div style="width:' + ts.score + '%;height:100%;background:' + ACCENT + '"></div></div>' +
          '<div style="width:90px;font-size:11px;color:' + INK + ';text-align:right">' + ts.score + (bv != null ? ' / ' + bv : '') + '</div>' +
          '</div>';
      });
      html += '</td></tr></table>';
      // 改进建议
      if (data.improvement.length) {
        html += '<div style="margin-top:12px;padding:10px;border:1px solid #E3EAF2;border-radius:4px">' +
          '<div style="font-size:13px;font-weight:700;color:' + ACCENT + ';margin-bottom:6px">' + esc(T('改进建议')) + '</div>';
        data.improvement.forEach(function (s) { html += '<div style="font-size:11.5px;color:' + INK + ';margin:3px 0">• ' + esc(s.suggestion) + '</div>'; });
        html += '</div>';
      }
      // 议题映射
      if (data.mapping.length) {
        html += '<div style="margin-top:12px;padding:10px;border:1px solid #E3EAF2;border-radius:4px">' +
          '<div style="font-size:13px;font-weight:700;color:' + ACCENT + ';margin-bottom:6px">' + esc(T('跨标准议题映射')) + '</div>' +
          '<table style="width:100%;border-collapse:collapse"><tr style="background:#F7F9FB">' +
          '<th style="text-align:left;padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(T('议题组')) + '</th>' +
          '<th style="text-align:left;padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(T('所属主题')) + '</th>' +
          '<th style="text-align:left;padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(T('对应标准条款')) + '</th>' +
          '<th style="text-align:left;padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(T('说明')) + '</th></tr>';
        data.mapping.forEach(function (m) {
          html += '<tr><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(m.group) + '</td>' +
            '<td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(themeName(m.theme)) + '</td>' +
            '<td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(m.codes.join(' · ')) + '</td>' +
            '<td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2;color:' + MUTED + '">' + esc(m.note) + '</td></tr>';
        });
        html += '</table></div>';
      }
      // 碳排放总览（GHG Protocol 三范围）
      if (data.carbon && data.carbon.total > 0) {
        html += '<div style="margin-top:12px;padding:10px;border:1px solid #E3EAF2;border-radius:4px">' +
          '<div style="font-size:13px;font-weight:700;color:' + ACCENT + ';margin-bottom:6px">' + esc(T('碳排放总览') + '（' + T('GHG Protocol 三范围') + ' · ' + regionLabel(data.carbon.region) + '）') + '</div>' +
          '<table style="width:100%;border-collapse:collapse"><tr style="background:#F7F9FB">' +
          '<th style="text-align:left;padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(T('范围')) + '</th>' +
          '<th style="text-align:left;padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(T('排放量 tCO₂e')) + '</th>' +
          '<th style="text-align:left;padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(T('占比')) + '</th></tr>' +
          '<tr><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(T('范围1 · 直接排放')) + '</td><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + data.carbon.scope1 + '</td><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + (data.carbon.total ? Math.round((data.carbon.scope1 / data.carbon.total) * 100) : 0) + '%</td></tr>' +
          '<tr><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(T('范围2 · 间接排放')) + '</td><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + data.carbon.scope2 + '</td><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + (data.carbon.total ? Math.round((data.carbon.scope2 / data.carbon.total) * 100) : 0) + '%</td></tr>' +
          '<tr><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + esc(T('范围3 · 价值链排放')) + '</td><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + data.carbon.scope3 + '</td><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">' + (data.carbon.total ? Math.round((data.carbon.scope3 / data.carbon.total) * 100) : 0) + '%</td></tr>' +
          '<tr><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2;font-weight:600">' + esc(T('合计')) + '</td><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2;font-weight:600">' + data.carbon.total + '</td><td style="padding:4px 6px;font-size:11px;border:1px solid #E3EAF2">100%</td></tr></table>';
        if (data.carbon.items.length) {
          html += '<div style="font-size:12px;font-weight:600;color:' + INK + ';margin:6px 0 2px">' + esc(T('明细')) + '</div><ul style="margin:0;padding-left:18px">' +
            data.carbon.items.map(function (it) { return '<li style="font-size:11px;color:' + INK + '">' + esc(it.label) + '：' + it.qty + ' ' + esc(it.unit) + ' → ' + (Math.round(it.emission * 100) / 100) + ' tCO₂e</li>'; }).join('') + '</ul>';
        }
        if (data.carbon.tips.length) {
          html += '<div style="font-size:12px;font-weight:600;color:' + INK + ';margin:6px 0 2px">' + esc(T('减排建议')) + '</div><ul style="margin:0;padding-left:18px">' +
            data.carbon.tips.map(function (t) { return '<li style="font-size:11px;color:' + INK + '">' + esc(t.text) + '</li>'; }).join('') + '</ul>';
        }
        html += '</div>';
      }
      // 多标准披露章节
      data.multiStd.forEach(function (st) {
        html += '<div style="margin-top:12px;padding:10px;border:1px solid #E3EAF2;border-radius:4px">' +
          '<div style="font-size:13px;font-weight:700;color:' + ACCENT + ';margin-bottom:6px">' + esc(st.code + ' · ' + T(st.name) + '（v' + st.version + ' · ' + st.approach + '）') + '</div>';
        st.pillars.forEach(function (p) {
          html += '<div style="margin:6px 0"><div style="font-size:12px;font-weight:600;color:' + INK + '">' + esc(p.title) + '</div>' +
            '<div style="font-size:11px;color:' + MUTED + '">' + esc(p.topics.map(function (t) { return t.code + ' ' + t.title; }).join('；')) + '</div></div>';
        });
        html += '</div>';
      });
      html += '</div>';
      holder.innerHTML = html;
      global.document.body.appendChild(holder);
      var doc = new jsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      var pageW = 210, margin = 10, pageH = 297;
      var content = holder.querySelector('div');
      global.html2canvas(content, { scale: 2.5, backgroundColor: '#ffffff', useCORS: true, letterRendering: true }).then(function (canvas) {
        if (!canvas || !canvas.width || !canvas.height) { global.document.body.removeChild(holder); throw new Error('报告渲染失败（空画布）'); }
        var usableW = pageW - margin * 2;
        var pxPerMm = canvas.width / usableW;
        var slicePx = Math.max(1, Math.floor((pageH - margin * 2) * pxPerMm));
        var offset = 0, first = true;
        while (offset < canvas.height) {
          if (!first) doc.addPage();
          var h = Math.min(slicePx, canvas.height - offset);
          var tmp = global.document.createElement('canvas');
          tmp.width = canvas.width; tmp.height = h;
          var ctx = tmp.getContext('2d');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, tmp.width, tmp.height);
          ctx.drawImage(canvas, 0, offset, canvas.width, h, 0, 0, canvas.width, h);
          doc.addImage(tmp.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, usableW, h / pxPerMm);
          offset += h; first = false;
        }
        global.document.body.removeChild(holder);
        var fname = (q.title || 'ESG') + '_' + T('ESG 报告') + '.pdf';
        if (Util.isNative && Util.isNative() && typeof doc.output === 'function' && global.Report && Report.downloadFile) {
          return Report.downloadFile(doc.output('blob'), fname).then(function () { return null; })
            .catch(function () { doc.save(fname); return null; });
        }
        doc.save(fname);
      }).catch(function (e) {
        if (holder.parentNode) holder.parentNode.removeChild(holder);
        Util.toast(T('导出失败：') + (e && e.message), 'err');
      });
    } catch (e) { Util.toast(T('导出失败：') + e.message, 'err'); }
  }

  // 内部 UI 函数暴露（仅供建议冒烟测试编排验证，不改变业务逻辑）
  ESG._renderFill = renderFill;
  ESG._openTopicEditor = openTopicEditor;

  global.ESG = ESG;
})(window);

/* ===== src/js/guides.js ===== */
/* 审核员指南模块 — 四大领域审核员操作手册浏览器
 * 功能：指南切换、目录树导航、全文搜索、书签管理、导出 PDF/Word、版本标签
 * 数据：种子由 auditor-guides.js 提供；书签持久化于 DB.state.guideBookmarks
 */
(function (global) {
  'use strict';
  const Guides = {};

  let activeGuideId = null;
  let activeSectionId = null;
  let gKw = '';

  // ---------- 数据访问 ----------
  function allGuides() {
    return (global.AuditorGuides && global.AuditorGuides.guides) || [];
  }
  function getGuide(id) {
    return allGuides().find(function (g) { return g.id === id; });
  }
  function allSections(g) {
    var out = [];
    (g.chapters || []).forEach(function (ch) {
      (ch.sections || []).forEach(function (s) {
        out.push({ guide: g, chapter: ch, section: s });
      });
    });
    return out;
  }
  function findSection(g, sid) {
    for (var i = 0; i < (g.chapters || []).length; i++) {
      var ch = g.chapters[i];
      for (var j = 0; j < (ch.sections || []).length; j++) {
        if (ch.sections[j].id === sid) return { guide: g, chapter: ch, section: ch.sections[j] };
      }
    }
    return null;
  }
  function bookmarks() {
    var s = DB.get();
    return s.guideBookmarks || [];
  }
  function isBookmarked(gid, sid) {
    return bookmarks().some(function (b) { return b.guideId === gid && b.sectionId === sid; });
  }
  function toggleBookmark(gid, sid) {
    var st = DB.get();
    if (!st.guideBookmarks) st.guideBookmarks = [];
    var idx = -1;
    for (var i = 0; i < st.guideBookmarks.length; i++) {
      if (st.guideBookmarks[i].guideId === gid && st.guideBookmarks[i].sectionId === sid) { idx = i; break; }
    }
    if (idx >= 0) { st.guideBookmarks.splice(idx, 1); }
    else { st.guideBookmarks.push({ guideId: gid, sectionId: sid, addedAt: new Date().toISOString() }); }
    DB.persist();
  }
  function flattenText(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    var parts = [];
    for (var k in obj) { if (obj.hasOwnProperty(k)) parts.push(flattenText(obj[k])); }
    return parts.join(' ');
  }
  // 全文搜索：匹配标题/标准要求/审核要点/常见不符合项/整改建议/拼音/缩写
  function matchSection(entry, q) {
    if (!q) return true;
    var s = entry.section;
    var hay = [
      entry.chapter.title, s.title,
      s.requirements || '', s.auditPoints || '',
      s.commonNonConformities || '', s.remediation || '',
      entry.guide.py || '', entry.guide.pyAbbr || ''
    ].join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  }
  // 暴露纯逻辑供冒烟测试
  Guides.allGuides = allGuides;
  Guides.getGuide = getGuide;
  Guides.findSection = findSection;
  Guides.matchSection = matchSection;
  Guides.allSections = allSections;
  Guides.isBookmarked = isBookmarked;

  // ---------- UI 辅助 ----------
  function guideTabs() {
    var wrap = Util.el('div', { class: 'guide-tabs' });
    allGuides().forEach(function (g) {
      var active = g.id === activeGuideId;
      var tab = Util.el('button', {
        class: 'guide-tab' + (active ? ' active' : ''),
        onclick: function () { activeGuideId = g.id; activeSectionId = null; gKw = ''; Guides.render(document.getElementById('content')); }
      }, [
        Util.el('span', { class: 'guide-tab-title', text: T(g.title) }),
        Util.el('span', { class: 'guide-tab-ver', text: 'v' + g.version })
      ]);
      wrap.appendChild(tab);
    });
    return wrap;
  }

  function renderSearchBar(g) {
    var bar = Util.el('div', { class: 'guide-searchbar' });
    var inp = Util.el('input', {
      class: 'inp', type: 'text', placeholder: T('搜索本指南内容（标准要求 / 审核要点 / 不符合项 / 整改建议）…'),
      value: gKw
    });
    var debounced = Util.debounce(function () {
      gKw = inp.value.trim().toLowerCase();
      renderTocAndContent(g);
    }, 200);
    inp.addEventListener('input', debounced);
    bar.appendChild(Util.el('span', { class: 'guide-search-icon', html: Util.icon('search') }));
    bar.appendChild(inp);
    return bar;
  }

  function renderTocTree(g) {
    var tree = Util.el('div', { class: 'guide-toc' });
    // 书签区域
    var bms = bookmarks().filter(function (b) { return b.guideId === g.id; });
    if (bms.length) {
      var bmHead = Util.el('div', { class: 'guide-toc-bm-head', text: T('书签') + ' (' + bms.length + ')' });
      tree.appendChild(bmHead);
      bms.forEach(function (bm) {
        var entry = findSection(g, bm.sectionId);
        if (!entry) return;
        var node = Util.el('a', {
          class: 'guide-toc-bm' + (bm.sectionId === activeSectionId ? ' active' : ''),
          onclick: function () { activeSectionId = bm.sectionId; renderTocAndContent(g); }
        }, [
          Util.el('span', { class: 'guide-bm-star', text: '\u2605' }),
          Util.el('span', { text: T(entry.chapter.title) + ' · ' + T(entry.section.title) })
        ]);
        tree.appendChild(node);
      });
      tree.appendChild(Util.el('div', { class: 'guide-toc-sep' }));
    }
    // 章节树
    (g.chapters || []).forEach(function (ch) {
      var chWrap = Util.el('div', { class: 'guide-toc-ch' });
      var chHead = Util.el('div', { class: 'guide-toc-ch-head', text: T(ch.title) });
      chWrap.appendChild(chHead);
      var secList = Util.el('div', { class: 'guide-toc-sec-list' });
      var visibleCount = 0;
      (ch.sections || []).forEach(function (s) {
        var entry = { guide: g, chapter: ch, section: s };
        if (gKw && !matchSection(entry, gKw)) return;
        visibleCount++;
        var node = Util.el('a', {
          class: 'guide-toc-sec' + (s.id === activeSectionId ? ' active' : ''),
          onclick: function () { activeSectionId = s.id; renderTocAndContent(g); }
        }, [
          Util.el('span', { class: 'guide-toc-sec-title', text: T(s.title) }),
          isBookmarked(g.id, s.id) ? Util.el('span', { class: 'guide-bm-mark', text: '\u2605' }) : null
        ].filter(Boolean));
        secList.appendChild(node);
      });
      // 搜索时隐藏无可见小节的章节
      if (gKw && visibleCount === 0) { chWrap.style.display = 'none'; }
      chWrap.appendChild(secList);
      tree.appendChild(chWrap);
    });
    return tree;
  }

  function sectionBlock(label, content) {
    if (!content) return null;
    return Util.el('div', { class: 'guide-sec-block' }, [
      Util.el('h4', { class: 'guide-sec-label', text: T(label) }),
      Util.el('div', { class: 'guide-sec-text', html: content.replace(/\n/g, '<br>') })
    ]);
  }

  function highlight(text, q) {
    if (!q) return text;
    var lower = text.toLowerCase();
    var idx = lower.indexOf(q);
    if (idx < 0) return text;
    return text.substring(0, idx) + '<mark>' + text.substring(idx, idx + q.length) + '</mark>' + text.substring(idx + q.length);
  }

  function renderSectionContent(g) {
    var panel = Util.el('div', { class: 'guide-content' });
    if (!activeSectionId) {
      // 无选中时显示指南概览
      var overview = Util.el('div', { class: 'guide-overview' });
      overview.appendChild(Util.el('h3', { text: T(g.title) + ' ' + T('v{0}').replace('{0}', g.version), style: 'margin-top:0' }));
      overview.appendChild(Util.el('div', { class: 'muted', text: T('参考标准') + '：' + g.references.join(' / ') }));
      overview.appendChild(Util.el('div', { class: 'muted', style: 'margin-top:4px', text: T('章节总数') + '：' + g.chapters.length + '  ·  ' + T('小节总数') + '：' + allSections(g).length }));
      if (gKw) {
        // 搜索结果模式
        var results = allSections(g).filter(function (e) { return matchSection(e, gKw); });
        overview.appendChild(Util.el('div', { class: 'guide-search-count', text: T('搜索结果') + '：' + results.length + T('条') }));
        results.forEach(function (entry) {
          var card = Util.el('div', { class: 'guide-search-card' });
          card.appendChild(Util.el('div', { class: 'guide-search-card-title', text: T(entry.chapter.title) + ' · ' + T(entry.section.title) }));
          var snippet = [entry.section.requirements, entry.section.auditPoints, entry.section.commonNonConformities, entry.section.remediation].join(' ');
          var idx = snippet.toLowerCase().indexOf(gKw);
          if (idx >= 0) {
            var start = Math.max(0, idx - 40);
            var end = Math.min(snippet.length, idx + gKw.length + 60);
            card.appendChild(Util.el('div', { class: 'guide-search-snippet', html: '…' + highlight(snippet.substring(start, end), gKw) + '…' }));
          }
          card.addEventListener('click', function () { activeSectionId = entry.section.id; renderTocAndContent(g); });
          overview.appendChild(card);
        });
      } else {
        overview.appendChild(Util.el('div', { class: 'guide-toc-hint muted', text: T('请从左侧目录选择章节，或使用上方搜索框搜索内容。') }));
      }
      panel.appendChild(overview);
      return panel;
    }
    // 展示选中章节内容
    var entry = findSection(g, activeSectionId);
    if (!entry) { panel.appendChild(Util.el('div', { class: 'muted', text: T('未找到该章节内容。') })); return panel; }
    var s = entry.section;
    var head = Util.el('div', { class: 'guide-sec-head' });
    head.appendChild(Util.el('div', { class: 'guide-sec-breadcrumb', text: T(entry.chapter.title) + ' · ' + T(s.title) }));
    var btnRow = Util.el('div', { class: 'guide-sec-btns' });
    // 书签按钮
    var bmBtn = Util.el('button', { class: 'btn btn-ghost guide-bm-btn', onclick: function () { toggleBookmark(g.id, s.id); renderTocAndContent(g); } }, [
      Util.el('span', { text: isBookmarked(g.id, s.id) ? '\u2605' : '\u2606' }),
      Util.el('span', { text: isBookmarked(g.id, s.id) ? T('取消书签') : T('添加书签') })
    ]);
    btnRow.appendChild(bmBtn);
    // 导出按钮
    btnRow.appendChild(Util.el('button', { class: 'btn btn-ghost', onclick: function () { exportSectionPDF(entry); } }, T('导出 PDF')));
    btnRow.appendChild(Util.el('button', { class: 'btn btn-ghost', onclick: function () { exportSectionWord(entry); } }, T('导出 Word')));
    head.appendChild(btnRow);
    panel.appendChild(head);
    // 四维内容
    var blocks = [
      sectionBlock('标准要求', s.requirements),
      sectionBlock('审核要点', s.auditPoints),
      sectionBlock('常见不符合项', s.commonNonConformities),
      sectionBlock('整改建议', s.remediation)
    ].filter(Boolean);
    blocks.forEach(function (b) { panel.appendChild(b); });
    // 导航
    var nav = Util.el('div', { class: 'guide-sec-nav' });
    var secs = allSections(g);
    var curIdx = -1;
    for (var i = 0; i < secs.length; i++) { if (secs[i].section.id === s.id) { curIdx = i; break; } }
    if (curIdx > 0) {
      nav.appendChild(Util.el('button', { class: 'btn btn-ghost', onclick: function () { activeSectionId = secs[curIdx - 1].section.id; renderTocAndContent(g); } }, '← ' + T(secs[curIdx - 1].section.title)));
    }
    if (curIdx < secs.length - 1) {
      nav.appendChild(Util.el('button', { class: 'btn btn-ghost', style: 'margin-left:auto', onclick: function () { activeSectionId = secs[curIdx + 1].section.id; renderTocAndContent(g); } }, T(secs[curIdx + 1].section.title) + ' →'));
    }
    panel.appendChild(nav);
    return panel;
  }

  // 局部重渲染（不重建 tabs 与 searchbar，避免 input 焦点丢失）
  function renderTocAndContent(g) {
    var tocEl = document.getElementById('guideToc');
    var contentEl = document.getElementById('guideContent');
    if (tocEl) { tocEl.innerHTML = ''; tocEl.appendChild(renderTocTree(g)); }
    if (contentEl) { contentEl.innerHTML = ''; contentEl.appendChild(renderSectionContent(g)); }
  }

  // ---------- 导出 ----------
  function buildSectionHTML(entry) {
    var g = entry.guide, ch = entry.chapter, s = entry.section;
    var html = '<div style="font-family:sans-serif;max-width:780px;margin:0 auto;padding:20px">';
    html += '<h1 style="font-size:18px;border-bottom:2px solid #2840a8;padding-bottom:8px">' + T(g.title) + ' v' + g.version + '</h1>';
    html += '<p style="color:#666;font-size:13px">' + T('参考标准') + '：' + g.references.join(' / ') + '</p>';
    html += '<h2 style="font-size:16px;color:#2840a8">' + T(ch.title) + '</h2>';
    html += '<h3 style="font-size:14px">' + T(s.title) + '</h3>';
    var dims = [['标准要求', s.requirements], ['审核要点', s.auditPoints], ['常见不符合项', s.commonNonConformities], ['整改建议', s.remediation]];
    dims.forEach(function (d) {
      if (!d[1]) return;
      html += '<h4 style="font-size:13px;color:#2840a8;margin:16px 0 6px">' + T(d[0]) + '</h4>';
      html += '<div style="font-size:13px;line-height:1.8;white-space:pre-wrap">' + d[1] + '</div>';
    });
    html += '</div>';
    return html;
  }

  function exportSectionPDF(entry) {
    var w = window.open('', '_blank');
    if (!w) { Util.toast(T('请允许弹出窗口以导出 PDF'), 'err'); return; }
    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + T(entry.section.title) + '</title>';
    html += '<style>body{margin:0}mark{background:#ffe066;padding:0 2px}@media print{.no-print{display:none}}</style>';
    html += '</head><body>' + buildSectionHTML(entry);
    html += '<div class="no-print" style="text-align:center;padding:16px"><button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer">' + T('打印 / 保存为 PDF') + '</button></div>';
    html += '</body></html>';
    w.document.write(html); w.document.close();
  }

  function exportSectionWord(entry) {
    var html = buildSectionHTML(entry);
    var header = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + T(entry.section.title) + '</title></head><body>';
    var footer = '</body></html>';
    var blob = new Blob(['\ufeff', header + html + footer], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = entry.guide.id + '_' + entry.section.id + '.doc';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Util.toast(T('已导出 Word 文档'), 'ok');
  }

  // ---------- 主渲染 ----------
  Guides.render = function (mount) {
    var g = activeGuideId ? getGuide(activeGuideId) : (allGuides()[0] || null);
    if (g) activeGuideId = g.id;
    mount.innerHTML = '';
    mount.appendChild(guideTabs());
    // SUP-017：审核员指南上传与管理入口（仅可编辑角色）
    if (global.Auth && Auth.canEdit()) {
      mount.appendChild(Util.el('div', { class: 'guide-uploadbar' }, [
        Util.el('button', { class: 'btn btn-sm', onclick: function () { openGuideUpload(); } }, T('上传指南')),
        Util.el('button', { class: 'btn btn-sm', onclick: function () { openGuideManage(); } }, T('指南文件管理'))
      ]));
    }
    if (!g) {
      mount.appendChild(Util.el('div', { class: 'panel card', text: T('暂无审核员指南数据。') }));
      return;
    }
    var body = Util.el('div', { class: 'guide-body' });
    var left = Util.el('div', { class: 'guide-left' });
    left.appendChild(renderSearchBar(g));
    var tocWrap = Util.el('div', { id: 'guideToc' });
    tocWrap.appendChild(renderTocTree(g));
    left.appendChild(tocWrap);
    var right = Util.el('div', { class: 'guide-right' });
    var contentWrap = Util.el('div', { id: 'guideContent' });
    contentWrap.appendChild(renderSectionContent(g));
    right.appendChild(contentWrap);
    body.appendChild(left);
    body.appendChild(right);
    mount.appendChild(body);
  };

  // ================= SUP-017：审核员指南上传与分析 =================
  // 智能分析（离线规则）：从文件名 + 描述中提取关键词 / 关联标准 / 检查要点摘要
  function analyzeGuideMeta(name, desc) {
    const all = (name || '') + ' ' + (desc || '');
    const up = all.toUpperCase();
    // 关联标准识别
    const STDS = [
      ['BSCI', 'BSCI'], ['SMETA', 'SMETA'], ['WRAP', 'WRAP'], ['RBA', 'RBA'],
      ['SLCP', 'SLCP'], ['ISO 9001', 'ISO 9001'], ['ISO 14001', 'ISO 14001'],
      ['ISO 45001', 'ISO 45001'], ['IATF 16949', 'IATF 16949'], ['CTPAT', 'CTPAT'],
      ['SA8000', 'SA8000'], ['EHS', 'EHS'], ['劳保', '职业健康安全'], ['环保', '环境'],
      ['反恐', '反恐安全'], ['质量', '质量管理'], ['社会责任', '社会责任']
    ];
    const standards = STDS.filter(([k]) => up.indexOf(k.toUpperCase()) >= 0).map(([, v]) => v);
    // 关键词提取（常见检查要点领域）
    const KEYS = ['消防', '电气', '危化品', '化学品', '应急预案', '培训', '防护用品', 'PPE', '未成年工', '童工', '强迫劳动', '工时', '工资', '合同', '排污', '废水', '废气', '噪声', '特种设备', '动火'];
    const keywords = KEYS.filter((k) => all.indexOf(k) >= 0);
    // 章节要点（无子条款时按领域归类）
    const points = standards.length ? standards.slice(0, 4) : (keywords.length ? keywords.slice(0, 4) : [T('通用检查要点')]);
    return {
      standards: standards.slice(0, 5),
      keywords: keywords.slice(0, 8),
      points: points,
      summary: (keywords.length ? T('覆盖领域：') + keywords.slice(0, 6).join('、') : T('暂未识别具体检查要点，可结合指南内容补充。'))
    };
  }

  // 上传指南（PDF/Word）
  function openGuideUpload() {
    const form = Util.el('div', { style: 'display:flex;flex-direction:column;gap:12px' });
    const fileInput = Util.el('input', { type: 'file', accept: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    form.appendChild(Util.el('label', { text: T('指南文件（PDF / Word）') }));
    form.appendChild(fileInput);
    const nameInput = Util.el('input', { class: 'input', placeholder: T('指南名称（如：BSCI 现场审核要点）') });
    form.appendChild(Util.el('label', { text: T('名称') }));
    form.appendChild(nameInput);
    const descInput = Util.el('textarea', { class: 'input', style: 'min-height:70px', placeholder: T('简要描述 / 适用范围（可选）') });
    form.appendChild(Util.el('label', { text: T('描述') }));
    form.appendChild(descInput);
    const tip = Util.el('div', { class: 'muted', text: T('上传后系统将自动分析，提取关联标准与检查要点。') });
    form.appendChild(tip);

    const okBtn = Util.el('button', { class: 'btn btn-primary', text: T('上传并分析') });
    okBtn.onclick = function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) { Util.toast(T('请选择文件'), 'err'); return; }
      const name = nameInput.value.trim() || file.name;
      const reader = new FileReader();
      reader.onload = function () {
        const rec = {
          id: Util.uid('gdoc'),
          name: name,
          desc: descInput.value.trim(),
          fileName: file.name,
          mime: file.type || '',
          sizeKB: Math.round(file.size / 1024),
          addedAt: Date.now(),
          addedBy: (global.Auth && Auth.current && Auth.current.username) || ''
        };
        const analysis = analyzeGuideMeta(name, descInput.value);
        rec.analysis = analysis;
        // 存文件到 docs 域 + 元数据到 guideUploads
        const docRec = { id: rec.id, kind: 'guide', name: name, mime: file.type || '', data: reader.result, sizeKB: rec.sizeKB, createdAt: Date.now() };
        Storage.put('docs', docRec).then(function () {
          const st = DB.get();
          st.guideUploads = st.guideUploads || [];
          st.guideUploads.unshift(rec);
          DB.persist();
          Util.closeModal();
          Util.toast(T('指南已上传并完成分析'), 'ok');
          Guides.render(document.getElementById('content'));
        }).catch(function (e) { Util.toast(T('上传失败：') + (e && e.message), 'err'); });
      };
      reader.readAsDataURL(file);
    };
    Util.modal(T('上传审核员指南'), form, [okBtn, Util.el('button', { class: 'btn', onclick: Util.closeModal }, T('取消'))]);
  }

  // 指南文件管理（查看 / 下载 / 删除）
  function openGuideManage() {
    const st = DB.get();
    const uploads = (st.guideUploads || []).slice();
    const body = Util.el('div', {});
    if (!uploads.length) {
      body.appendChild(Util.el('div', { class: 'empty', text: T('暂无上传的指南文件。') }));
    } else {
      uploads.forEach(function (g) {
        const card = Util.el('div', { class: 'gdoc-card' }, [
          Util.el('div', { class: 'gdoc-name', text: g.name }),
          Util.el('div', { class: 'muted', style: 'font-size:12px', text: g.fileName + ' · ' + g.sizeKB + ' KB · ' + (g.addedBy || T('—')) }),
          g.analysis && g.analysis.summary ? Util.el('div', { class: 'gdoc-sum', text: g.analysis.summary }) : null,
          g.analysis && g.analysis.standards && g.analysis.standards.length ? Util.el('div', { class: 'gdoc-tags' }, g.analysis.standards.map((s) => Util.el('span', { class: 'std-tag', text: s }))) : null,
          Util.el('div', { class: 'btn-row', style: 'margin-top:8px' }, [
            Util.el('button', { class: 'btn btn-sm', onclick: function () { downloadGuide(g); } }, T('下载')),
            Util.el('button', { class: 'btn btn-sm btn-danger', onclick: function () { if (confirm(T('删除该指南？'))) removeGuide(g.id, body); } }, T('删除'))
          ])
        ]);
        body.appendChild(card);
      });
    }
    Util.modal(T('指南文件管理') + '（' + uploads.length + '）', body, [Util.el('button', { class: 'btn', onclick: Util.closeModal }, T('关闭'))], { wide: true });
  }
  function downloadGuide(g) {
    DB.getDoc(g.id).then(function (d) {
      if (!d || !d.data) { Util.toast(T('文件不存在'), 'err'); return; }
      const a = Util.el('a', { href: d.data, download: g.fileName || g.name });
      document.body.appendChild(a); a.click(); a.remove();
    });
  }
  function removeGuide(id, body) {
    const st = DB.get();
    st.guideUploads = (st.guideUploads || []).filter(function (x) { return x.id !== id; });
    DB.persist();
    Storage.del('docs', id);
    Util.toast(T('已删除指南'), 'ok');
    openGuideManage();
  }

  // 供冒烟测试：分析逻辑（离线规则提取）
  Guides.analyzeGuideMeta = analyzeGuideMeta;
  global.Guides = Guides;
})(typeof window !== 'undefined' ? window : globalThis);

/* ===== src/js/photos.js ===== */
/* 照片管理模块（重构版）
 * - 功能：照片上传（多选/拖拽/预览/校验）、分组管理、评论、批量导出（ZIP）、报告导出（PDF/Word）。
 * - 已移除：相机拍照功能（capture、Capacitor Camera、isNativeCamera 相机调用、拍照按钮、capture 属性）。
 * - 上传：仅保留文件选择（<input type="file" accept="image/*" multiple>），支持拖拽上传。
 * - 数据层：照片记录存于 IndexedDB 'photos' 域；分组存于 kv['photo_groups']。
 * - 尺寸策略：输出图像统一归一化到 1280×720 像素（16:9 横图，竖图/其它比例居中裁切），统一 JPEG、质量 85%。
 */
(function (global) {
  'use strict';

  const NS = 'photos';
  const GROUPS_KEY = 'photo_groups';
  const JPEG_QUALITY = 0.85;
  // SUP-034：锁定照片输出规格为 1280×720 像素（16:9 横图）。
  // 竖图 / 其它比例在归一化时按居中裁切到 16:9，保证三端照片规格一致、报告排版整齐。
  const OUT_W = 1280, OUT_H = 720;
  const PHOTO_PREFS_KEY = 'photo_preferences_v1';
  const PHOTO_PRESETS = {
    small: { w: 1280, h: 720, quality: 0.72, label: '节省空间 · 质量 72%' },
    balanced: { w: 1280, h: 720, quality: 0.85, label: '平衡 · 质量 85%' },
    clear: { w: 1280, h: 720, quality: 0.92, label: '高清 · 质量 92%' }
  };
  function photoPrefs() {
    var defaults = { preset: 'balanced', quality: PHOTO_PRESETS.balanced.quality };
    try { var saved = JSON.parse(global.localStorage.getItem(PHOTO_PREFS_KEY) || '{}'); if (saved && PHOTO_PRESETS[saved.preset]) defaults.preset = saved.preset; if (saved && Number(saved.quality) >= 0.5 && Number(saved.quality) <= 1) defaults.quality = Number(saved.quality); } catch (e) {}
    var p = PHOTO_PRESETS[defaults.preset]; return { preset: defaults.preset, w: p.w, h: p.h, quality: defaults.quality };
  }
  function savePhotoPrefs(next) {
    var preset = PHOTO_PRESETS[next.preset] ? next.preset : 'balanced';
    var quality = Math.max(0.5, Math.min(1, Number(next.quality) || PHOTO_PRESETS[preset].quality));
    try { global.localStorage.setItem(PHOTO_PREFS_KEY, JSON.stringify({ preset: preset, quality: quality })); } catch (e) {}
    return photoPrefs();
  }
  const MAX_FILE_MB = 5; // 单文件大小上限（前端校验）
  const MAX_TOTAL_MB = 40; // 单次导入总量上限，防止内存溢出
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
  const UNGROUPED_ID = '__ungrouped__';

  const Photos = {
    version: '2.0.0',
    list: [],
    groups: [],
    _preview: null
  };

  // SUP-012：简约线条风格 SVG 图标（统一 2px 线宽、无填充、圆角；默认 #616161，选中 #1976D2）
  const ICON_PATHS = {
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    arrows: '<path d="M7 8h10M12 3v5M7 16h10M12 21v-5"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    package: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/>'
  };
  Photos.icon = function (name, size) {
    size = size || 16;
    var d = ICON_PATHS[name] || ICON_PATHS.camera;
    return '<svg class="ico-line" xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:5px">' + d + '</svg>';
  };

  // ---------------- 尺寸计算（纯函数，供冒烟测试） ----------------
  // SUP-034：固定输出 1280×720（16:9）。返回 { w, h, scale } 均为 1280×720。
  // 保留 scale 字段以兼容旧测试（scale 表示从原图到目标所需的缩放系数近似值）。
  Photos.computeTargetSize = function (w, h) {
    return { w: OUT_W, h: OUT_H, scale: Math.min(OUT_W / Math.max(1, w || 1), OUT_H / Math.max(1, h || 1)) };
  };

  // ---------------- 16:9 居中裁切绘制 ----------------
  // 将任意比例图像居中裁切并缩放到 1280×720，返回 canvas（宽 OUT_W、高 OUT_H）。
  function drawTo16x9(img) {
    const iw = img.naturalWidth || img.width || 1, ih = img.naturalHeight || img.height || 1;
    const srcRatio = iw / ih, dstRatio = OUT_W / OUT_H; // 16:9 = 1.777...
    let sw = iw, sh = ih, sx = 0, sy = 0;
    if (srcRatio > dstRatio) {
      // 原图更宽 → 裁左右两侧
      sw = ih * dstRatio; sx = (iw - sw) / 2;
    } else if (srcRatio < dstRatio) {
      // 原图更高 → 裁上下两侧
      sh = iw / dstRatio; sy = (ih - sh) / 2;
    }
    const canvas = global.document.createElement('canvas');
    canvas.width = OUT_W; canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);
    return canvas;
  }

  // SUP-043：等比缩放并居中绘制到 1280×720（letterbox），不裁剪原图内容，留白填充白色
  function drawTo16x9Fit(img) {
    const iw = img.naturalWidth || img.width || 1, ih = img.naturalHeight || img.height || 1;
    const prefs = photoPrefs(), targetW = prefs.w, targetH = prefs.h;
    // 等比缩放：取最小缩放因子，完整保留原图内容并以白色留边。
    const scale = Math.min(targetW / iw, targetH / ih);
    const dw = Math.round(iw * scale), dh = Math.round(ih * scale);
    const dx = Math.floor((targetW - dw) / 2), dy = Math.floor((targetH - dh) / 2);
    const canvas = global.document.createElement('canvas');
    canvas.width = targetW; canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
    return canvas;
  }

  // ---------------- 归一化处理（dataURL → 1280×720 JPEG dataURL） ----------------
  Photos.normalizeImage = function (dataUrl) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () {
        try {
          // SUP-043：等比缩放 letterbox 到 1280×720（不裁剪原图，留白填充白色）
          const canvas = drawTo16x9Fit(img);
          const prefs = photoPrefs();
          const out = canvas.toDataURL('image/jpeg', prefs.quality);
          resolve({ dataUrl: out, width: canvas.width, height: canvas.height, sizeKB: Math.round(out.length * 3 / 4 / 1024), quality: prefs.quality });
        } catch (e) { reject(e); }
      };
      img.onerror = function () { reject(new Error('image decode fail')); };
      img.src = dataUrl;
    });
  };

  // ---------------- EXIF 感知压缩（File 入口） ----------------
  /**
   * 压缩上传文件：用 createImageBitmap 解码（imageOrientation:'from-image' 自动校正 EXIF 方向），
   * 再 canvas 等比缩放 letterbox 到 1280×720（不裁剪原图），导出 JPEG。
   * 返回 {dataUrl,width,height,sizeKB}。
   * 不支持 createImageBitmap 时降级为 FileReader + Image（保留原方向，兼容旧浏览器）。
   */
  Photos.compressFile = function (file) {
    function drawBitmap(bitmap) {
      return new Promise(function (resolve, reject) {
        try {
          // SUP-043：等比缩放 letterbox（不裁剪）
          var canvas = drawTo16x9Fit(bitmap);
          // 释放 bitmap 资源（内存管理）
          if (typeof bitmap.close === 'function') bitmap.close();
          var prefs = photoPrefs();
          var out = canvas.toDataURL('image/jpeg', prefs.quality);
          resolve({ dataUrl: out, width: canvas.width, height: canvas.height, sizeKB: Math.round(out.length * 3 / 4 / 1024), quality: prefs.quality });
        } catch (e) { reject(e); }
      });
    }
    // 能力守卫：createImageBitmap 可用（并支持 from-image）→ EXIF 校正路径
    if (typeof global.createImageBitmap === 'function') {
      return global.createImageBitmap(file, { imageOrientation: 'from-image' }).then(drawBitmap);
    }
    // 降级：FileReader → Image（无法校正 EXIF，但功能可用）
    return readFileAsDataURL(file).then(function (dataUrl) { return Photos.normalizeImage(dataUrl); });
  };

  // ---------------- 校验（纯函数，供测试） ----------------
  /** 校验文件是否为图片且不超限。返回 null 表示通过，否则返回错误文案（中文）。 */
  Photos.validateFile = function (file) {
    if (!file) return '未选择文件';
    const type = String(file.type || '').toLowerCase();
    if (IMAGE_TYPES.indexOf(type) < 0) return '不支持的格式：' + (file.name || type || '未知');
    if (file.size > MAX_FILE_MB * 1024 * 1024) return '文件超过 ' + MAX_FILE_MB + 'MB 上限：' + (file.name || '');
    return null;
  };

  // ---------------- 分组数据层 ----------------
  function newId() { return 'ph' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function gid() { return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

  Photos.loadGroups = function () {
    return Storage.kvGet(GROUPS_KEY).then(function (arr) {
      Photos.groups = (Array.isArray(arr) ? arr : []).filter(function (g) { return g && g.id; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      return Photos.groups;
    });
  };
  function persistGroups() {
    return Storage.kvPut(GROUPS_KEY, Photos.groups.map(function (g, i) {
      // 归一化 order
      var o = Object.assign({}, g); o.order = i; return o;
    }));
  }
  Photos.createGroup = function (name) {
    name = String(name || '').trim();
    if (!name) return Promise.resolve(null);
    if (Photos.groups.some(function (g) { return g.name === name; })) return Promise.reject(new Error('分组已存在：' + name));
    Photos.groups.push({ id: gid(), name: name, createdAt: Date.now(), order: Photos.groups.length });
    return persistGroups().then(function () { return Photos.groups[Photos.groups.length - 1]; });
  };
  Photos.renameGroup = function (id, name) {
    name = String(name || '').trim();
    var g = Photos.groups.find(function (x) { return x.id === id; });
    if (!g) return Promise.resolve(null);
    if (name && Photos.groups.some(function (x) { return x.id !== id && x.name === name; })) return Promise.reject(new Error('分组已存在：' + name));
    if (name) g.name = name;
    return persistGroups().then(function () { return g; });
  };
  Photos.deleteGroup = function (id) {
    Photos.groups = Photos.groups.filter(function (g) { return g.id !== id; });
    // 组内照片移回未分组
    var ids = Photos.list.filter(function (p) { return p.groupId === id; }).map(function (p) { return p.id; });
    ids.forEach(function (pid) {
      var p = Photos.list.find(function (x) { return x.id === pid; });
      if (p) { p.groupId = null; Storage.put(NS, p); }
    });
    return persistGroups();
  };
  Photos.moveToGroup = function (photoIds, groupId) {
    photoIds.forEach(function (pid) {
      var p = Photos.list.find(function (x) { return x.id === pid; });
      if (p) { p.groupId = (groupId === UNGROUPED_ID) ? null : groupId; Storage.put(NS, p); }
    });
    return Promise.resolve();
  };

  // ---------------- 照片数据层 ----------------
  /** 由已压缩结果（{dataUrl,width,height,sizeKB}）构造并入库照片记录 */
  Photos.addPhotoFromResult = function (n, name) {
    var rec = {
      id: newId(),
      name: name || ('IMG_' + Util.fmtDate(Date.now()).replace(/[^0-9]/g, '') + '_' + String(Photos.list.length + 1).padStart(3, '0')),
      source: 'upload',
      groupId: null,
      comments: [],
      createdAt: Date.now(),
      width: n.width, height: n.height, sizeKB: n.sizeKB,
      dataUrl: n.dataUrl
    };
    return Storage.put(NS, rec).then(function () {
      Photos.list.unshift(rec);
      return rec;
    });
  };

  /** dataURL 入口（兼容既有调用/测试），内部归一化后复用 addPhotoFromResult */
  Photos.addPhoto = function (dataUrl, name) {
    return Photos.normalizeImage(dataUrl).then(function (n) {
      return Photos.addPhotoFromResult(n, name);
    });
  };

  Photos.deletePhoto = function (id) {
    return Storage.del(NS, id).then(function () {
      Photos.list = Photos.list.filter(function (p) { return p.id !== id; });
    });
  };
  Photos.bulkDelete = function (ids) {
    return Promise.all(ids.map(function (id) { return Storage.del(NS, id); })).then(function () {
      Photos.list = Photos.list.filter(function (p) { return ids.indexOf(p.id) < 0; });
    });
  };

  Photos.load = function () {
    return Promise.all([Storage.getAll(NS), Photos.loadGroups()]).then(function (res) {
      var arr = res[0];
      Photos.list = (arr || []).filter(function (p) { return p && p.id; })
        .map(function (p) { p.comments = Array.isArray(p.comments) ? p.comments : []; return p; })
        .sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      return Photos.list;
    });
  };

  // ---------------- 评论 ----------------
  function currentAuthor() {
    try {
      if (global.Auth && typeof Auth.currentUser === 'function') {
        var u = Auth.currentUser(); if (u && u.username) return u.username;
      }
    } catch (e) {}
    return '';
  }
  Photos.addComment = function (photoId, text) {
    text = String(text || '').trim();
    var p = Photos.list.find(function (x) { return x.id === photoId; });
    if (!p || !text) return Promise.resolve(null);
    p.comments = p.comments || [];
    p.comments.push({ id: newId(), text: text, author: currentAuthor(), createdAt: Date.now() });
    return Storage.put(NS, p);
  };
  Photos.addBulkComment = function (photoIds, text) {
    text = String(text || '').trim();
    if (!text) return Promise.resolve();
    return Promise.all(photoIds.map(function (id) {
      var p = Photos.list.find(function (x) { return x.id === id; });
      if (!p) return null;
      p.comments = p.comments || [];
      p.comments.push({ id: newId(), text: text, author: currentAuthor(), createdAt: Date.now() });
      return Storage.put(NS, p);
    }));
  };
  Photos.removeComment = function (photoId, commentId) {
    var p = Photos.list.find(function (x) { return x.id === photoId; });
    if (!p) return Promise.resolve();
    p.comments = (p.comments || []).filter(function (c) { return c.id !== commentId; });
    return Storage.put(NS, p);
  };
  Photos.editComment = function (photoId, commentId, text) {
    text = String(text || '').trim();
    var p = Photos.list.find(function (x) { return x.id === photoId; });
    if (!p) return Promise.resolve();
    var c = (p.comments || []).find(function (x) { return x.id === commentId; });
    if (c && text) c.text = text;
    return Storage.put(NS, p);
  };
  Photos.clearComments = function (photoId) {
    var p = Photos.list.find(function (x) { return x.id === photoId; });
    if (!p) return Promise.resolve();
    p.comments = [];
    return Storage.put(NS, p);
  };

  // ---------------- 批量导出（ZIP 打包） ----------------
  /**
   * 将选中照片打包为 ZIP 下载。若 JSZip 未加载则尝试动态加载 lib/jszip.min.js。
   * @param {string[]} ids 照片 id 数组
   * @returns {Promise<void>}
   */
  Photos.exportZip = function (ids) {
    var selected = Photos.list.filter(function (p) { return ids.indexOf(p.id) >= 0; });
    if (!selected.length) return Promise.resolve();
    // 确保 JSZip 可用（懒加载；已 vendored 到 lib/jszip.min.js）
    var ensureZip = function () {
      if (global.JSZip) return Promise.resolve(global.JSZip);
      if (global.Util && Util.loadLib) return Util.loadLib({ src: 'lib/jszip.min.js', check: function () { return !!global.JSZip; } });
      return Promise.reject(new Error('JSZip 不可用'));
    };
    return ensureZip().then(function (JSZip) {
      var zip = new JSZip();
      var folder = zip.folder(T('照片导出') + '_' + Util.fmtDate(Date.now()).replace(/[^0-9]/g, ''));
      selected.forEach(function (p) {
        var ext = (p.dataUrl || '').match(/^data:image\/(\w+)/); var e = ext ? ext[1] : 'jpeg';
        if (e === 'jpeg') e = 'jpg';
        var safeName = (p.name || 'photo').replace(/[\\/:*?"<>|\s]+/g, '_');
        // dataURL → ArrayBuffer
        var base64 = (p.dataUrl || '').split(',')[1];
        var bin = atob(base64 || '');
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        folder.file(safeName + '.' + e, arr);
        // 附带评论
        if (p.comments && p.comments.length) {
          var txt = p.comments.map(function (c) { return '- ' + (c.author || '') + ' (' + Util.fmtDate(c.createdAt) + '): ' + c.text; }).join('\n');
          folder.file(safeName + '.txt', txt);
        }
      });
      return zip.generateAsync({ type: 'blob' }).then(function (blob) {
        Util.download(blob, T('照片导出') + '_' + Util.fmtDate(Date.now()).replace(/[^0-9]/g, '') + '.zip');
      });
    });
  };

  // ---------------- 报告生成（PDF / Word） ----------------
  /** 生成报告 HTML 结构（供 PDF/Word 共用），返回字符串。
   * SUP-012：报告仅保留「照片 + 用户评论 + 分组标题」，去掉所有系统自动生成信息
   * （生成时间、照片数、文件名、尺寸、上传时间等元数据）。 */
  Photos.buildReportHtml = function (opts) {
    opts = opts || {};
    var title = opts.title || T('现场照片报告');
    var onlyGroupId = opts.groupId; // 指定分组或 null（全部）
    var selected = opts.ids ? Photos.list.filter(function (p) { return opts.ids.indexOf(p.id) >= 0; }) : Photos.list;
    if (onlyGroupId) selected = selected.filter(function (p) { return (p.groupId || null) === (onlyGroupId === UNGROUPED_ID ? null : onlyGroupId); });
    // SUP-031：统一排版规范（FLA 风格）——字体清晰、配色克制、边距紧凑
    var ACCENT = '#1A5F9E', LINE = '#B0D4F1', INK = '#333', MUTED = '#6b7a90';
    var esc = Util.esc;
    var html = '<div style="font-family:\"Segoe UI\",\"PingFang SC\",\"Microsoft YaHei\",Arial,sans-serif;color:' + INK + ';font-size:12.5px;line-height:1.55">';
    // 报告头：标题 + 副标题 + 底部细线
    html += '<div style="text-align:center;padding-bottom:10px;border-bottom:2px solid ' + LINE + '">' +
      '<div style="font-size:20px;font-weight:800;color:' + ACCENT + ';letter-spacing:.5px">' + esc(title) + '</div>';
    if (opts.subtitle) html += '<div style="color:' + MUTED + ';font-size:11px;margin-top:4px">' + esc(opts.subtitle) + '</div>';
    html += '</div>';
    // 统计行：总张数 / 分组数
    var groupNames = {}; Photos.groups.forEach(function (g) { groupNames[g.id] = g.name; });
    var byGroup = {};
    selected.forEach(function (p) {
      var key = p.groupId && groupNames[p.groupId] ? groupNames[p.groupId] : T('未分组');
      if (!byGroup[key]) byGroup[key] = [];
      byGroup[key].push(p);
    });
    var gkeys = Object.keys(byGroup);
    // SUP-035：Word（msword HTML）不支持 flex/object-fit/max-height，需用表格 + 显式图片宽高
    var isWord = !!opts.word;
    if (isWord) {
      html += '<table style="width:100%;border-collapse:collapse;margin:10px 0 12px" border="1" bordercolor="' + LINE + '"><tr>' +
        '<td style="width:50%;padding:8px 12px"><div style="font-size:9px;color:' + MUTED + '">' + esc(T('照片总数')) + '</div><div style="font-size:16px;font-weight:800;color:' + ACCENT + '">' + selected.length + '</div></td>' +
        '<td style="width:50%;padding:8px 12px"><div style="font-size:9px;color:' + MUTED + '">' + esc(T('分组')) + '</div><div style="font-size:16px;font-weight:800;color:' + ACCENT + '">' + gkeys.length + '</div></td>' +
        '</tr></table>';
    } else {
      html += '<div style="display:flex;gap:0;border:1px solid ' + LINE + ';border-radius:4px;overflow:hidden;margin:10px 0 12px">' +
        '<div style="flex:1;padding:8px 12px;border-right:1px dashed ' + LINE + '"><div style="font-size:9px;color:' + MUTED + '">' + esc(T('照片总数')) + '</div><div style="font-size:16px;font-weight:800;color:' + ACCENT + '">' + selected.length + '</div></div>' +
        '<div style="flex:1;padding:8px 12px"><div style="font-size:9px;color:' + MUTED + '">' + esc(T('分组')) + '</div><div style="font-size:16px;font-weight:800;color:' + ACCENT + '">' + gkeys.length + '</div></div>' +
        '</div>';
    }
    // 布局模板：'single'（单栏，每照片独占一行）或 'double'（双栏网格）
    var layout = opts.layout || 'single';
    // SUP-034：照片尺寸（sm/md/lg）控制报告内照片展示高度
    var imgMaxH = opts.imgSize === 'lg' ? 380 : (opts.imgSize === 'sm' ? 200 : 300);
    var pageBreak = opts.pageBreak ? ' style="page-break-before:always"' : '';
    var idx = 0;
    gkeys.forEach(function (gname) {
      if (idx > 0) html += '<div' + pageBreak + '></div>';
      // SUP-034：分组标题——浅色底 + 左竖线 + 底部细线，清晰分区
      html += '<h2 style="font-size:13px;font-weight:800;color:' + ACCENT + ';margin:14px 0 6px;padding:6px 10px;background:#F0F6FC;border-left:4px solid ' + ACCENT + ';border-radius:2px;border-bottom:1px solid ' + LINE + '">' + esc(gname) + ' <span style="font-size:10px;color:' + MUTED + ';font-weight:400">(' + byGroup[gname].length + ')</span></h2>';
      if (layout === 'double') html += '<table style="width:100%;border-collapse:collapse;margin-top:4px"><tr>';
      byGroup[gname].forEach(function (p) {
        idx++;
        var commentHtml = '';
        if (p.comments && p.comments.length) {
          commentHtml = '<div style="margin:4px 2px 8px;padding:6px 8px;background:#F7F9FB;border-left:2px solid ' + LINE + ';border-radius:2px">' +
            p.comments.map(function (c, ci) {
              return '<div style="font-size:10.5px;color:' + INK + ';line-height:1.5">' +
                (ci > 0 ? '<span style="color:' + LINE + '">┄</span> ' : '') + esc(c.text) + '</div>';
            }).join('') + '</div>';
        }
        // SUP-034：每张照片使用统一「编号 + 虚线框照片 + 评论」卡片，框线明确、分区整齐
        // SUP-035：照片已统一归一化为 1280×720（16:9）。Word 不支持 object-fit/max-height，
        // 必须给显式 width/height（单栏 620px、双栏 300px 宽，按 16:9 折算高度），否则图片溢出或变形。
        var imgTag;
        if (isWord) {
          // SUP-041：Word 模式图片加大（单栏 680 / 双栏 330），保持 16:9 比例，充分利用 A4 宽度
          var wpx = layout === 'double' ? 330 : 680;
          var hpx = Math.round(wpx * 9 / 16);
          imgTag = '<img src="' + p.dataUrl + '" width="' + wpx + '" height="' + hpx + '" style="width:' + wpx + 'px;height:' + hpx + 'px;border:1px dashed ' + LINE + '"/>';
        } else {
          // SUP-041：PDF/预览模式移除 max-height 限制，照片按 16:9 比例自适应卡片宽度，避免压缩感/白边
          imgTag = '<img src="' + p.dataUrl + '" style="width:100%;height:auto;display:block;border:1px dashed ' + LINE + ';border-radius:3px;object-fit:contain;background:#FBFCFE"/>';
        }
        if (layout === 'double') {
          html += '<td style="width:50%;vertical-align:top;padding:6px;border:1px solid #E3EAF2;border-radius:3px;background:#fff">' +
            '<div style="font-size:10px;color:' + MUTED + ';margin-bottom:3px;letter-spacing:.3px">' + esc(T('照片')) + ' ' + idx + '</div>' +
            imgTag + commentHtml + '</td>';
          if (idx % 2 === 0) html += '</tr><tr>';
        } else {
          html += '<div style="margin-bottom:12px;padding:8px;border:1px solid #E3EAF2;border-radius:4px;background:#fff;page-break-inside:avoid">' +
            '<div style="font-size:10px;color:' + MUTED + ';margin-bottom:4px;letter-spacing:.3px">' + esc(T('照片')) + ' ' + idx + '</div>' +
            imgTag + commentHtml + '</div>';
        }
      });
      if (layout === 'double') { if (idx % 2 !== 0) html += '<td></td>'; html += '</tr></table>'; }
    });
    html += '</div>';
    return html;
  };

  /** SUP-036：区块化报告 HTML。blocks = [{id, layout?, size?}]，按用户编排顺序渲染，
   * 每张照片块独立 layout（single/double）与 size（sm/md/lg）。用于「排版编辑器」的自定义编排导出。
   * 若某块 layout 为 'double'，则与此前连续 double 块合并到同一行表格。 */
  Photos.buildBlocksHtml = function (blocks, opts) {
    opts = opts || {};
    var ACCENT = '#1A5F9E', LINE = '#B0D4F1', INK = '#333', MUTED = '#6b7a90';
    var esc = Util.esc;
    var html = '<div style="font-family:\"Segoe UI\",\"PingFang SC\",\"Microsoft YaHei\",Arial,sans-serif;color:' + INK + ';font-size:12.5px;line-height:1.55">';
    html += '<div style="text-align:center;padding-bottom:10px;border-bottom:2px solid ' + LINE + '">' +
      '<div style="font-size:20px;font-weight:800;color:' + ACCENT + ';letter-spacing:.5px">' + esc(opts.title || T('现场照片报告')) + '</div>';
    if (opts.subtitle) html += '<div style="color:' + MUTED + ';font-size:11px;margin-top:4px">' + esc(opts.subtitle) + '</div>';
    html += '</div>';
    var isWord = !!opts.word;
    // SUP-039：区块化报告移除「照片总数 / 自定义排版」统计说明行，只保留标题与照片块
    // 渲染每块；double 连续块合并进表格行
    var idx = 0, rowOpen = false, rowCount = 0;
    function closeRow() { if (rowOpen) { if (rowCount % 2 !== 0) html += '<td></td>'; html += '</tr></table>'; rowOpen = false; rowCount = 0; } }
    blocks.forEach(function (b) {
      var p = Photos.list.find(function (x) { return x.id === b.id; });
      if (!p) return;
      idx++;
      var blkLayout = b.layout === 'double' ? 'double' : 'single';
      var imgMaxH = b.size === 'lg' ? 380 : (b.size === 'sm' ? 200 : 300);
      var commentHtml = '';
      if (p.comments && p.comments.length) {
        commentHtml = '<div style="margin:4px 2px 8px;padding:6px 8px;background:#F7F9FB;border-left:2px solid ' + LINE + ';border-radius:2px">' +
          p.comments.map(function (c, ci) {
            return '<div style="font-size:10.5px;color:' + INK + ';line-height:1.5">' +
              (ci > 0 ? '<span style="color:' + LINE + '">┄</span> ' : '') + esc(c.text) + '</div>';
          }).join('') + '</div>';
      }
      var imgTag;
      if (isWord) {
        // SUP-041：Word 模式图片加大（单栏 680 / 双栏 330），保持 16:9 比例
        var wpx = blkLayout === 'double' ? 330 : 680;
        var hpx = Math.round(wpx * 9 / 16);
        imgTag = '<img src="' + p.dataUrl + '" width="' + wpx + '" height="' + hpx + '" style="width:' + wpx + 'px;height:' + hpx + 'px;border:1px dashed ' + LINE + '"/>';
      } else {
        // SUP-041：PDF/预览模式移除 max-height 限制，照片按 16:9 比例自适应卡片宽度
        imgTag = '<img src="' + p.dataUrl + '" style="width:100%;height:auto;display:block;border:1px dashed ' + LINE + ';border-radius:3px;object-fit:contain;background:#FBFCFE"/>';
      }
      if (blkLayout === 'double') {
        if (!rowOpen) { html += '<table style="width:100%;border-collapse:collapse;margin-top:8px"><tr>'; rowOpen = true; rowCount = 0; }
        html += '<td style="width:50%;vertical-align:top;padding:6px;border:1px solid #E3EAF2;border-radius:3px;background:#fff">' +
          '<div style="font-size:10px;color:' + MUTED + ';margin-bottom:3px;letter-spacing:.3px">' + esc(T('照片')) + ' ' + idx + '</div>' +
          imgTag + commentHtml + '</td>';
        rowCount++;
        if (rowCount % 2 === 0) { html += '</tr><tr>'; }
      } else {
        closeRow();
        html += '<div style="margin-bottom:12px;padding:8px;border:1px solid #E3EAF2;border-radius:4px;background:#fff;page-break-inside:avoid">' +
          '<div style="font-size:10px;color:' + MUTED + ';margin-bottom:4px;letter-spacing:.3px">' + esc(T('照片')) + ' ' + idx + '</div>' +
          imgTag + commentHtml + '</div>';
      }
    });
    closeRow();
    html += '</div>';
    return html;
  };

  /** 导出 PDF（jsPDF 懒加载，html2canvas 光栅化） */
  Photos.exportReportPdf = function (opts) {
    return Promise.resolve().then(function () {
      if (!global.ReportEngine || !ReportEngine.ensureLibs) return Promise.reject(new Error('报告引擎不可用'));
      return ReportEngine.ensureLibs(['jspdf', 'html2canvas']);
    }).then(function () {
      // 用 html2canvas 将报告 DOM 渲染为图片后写入 jsPDF（保证中文与布局稳定）
      // SUP-036：优先用区块化编排（blocks），否则回退 buildReportHtml（分组自动排版）
      var html = Photos.buildBlocksHtml(opts.blocks, opts);
      var holder = global.document.createElement('div');
      holder.innerHTML = '<div style="padding:16px;font-family:inherit;color:#222">' + html + '</div>';
      // SUP-038：固定容器宽度 = A4 可用宽 @96dpi（190mm ≈ 718px），
      // 否则 shrink-to-fit 会被 1280px 照片撑宽，文字相对缩小后再压回 A4 导致整体发虚
      var RENDER_W = 718;
      holder.style.position = 'fixed'; holder.style.left = '-9999px'; holder.style.top = '0'; holder.style.background = '#fff';
      holder.style.width = RENDER_W + 'px'; holder.style.boxSizing = 'border-box';
      global.document.body.appendChild(holder);
      var content = holder.querySelector('div');
      var jsPDFCtor = global.jspdf && global.jspdf.jsPDF ? global.jspdf.jsPDF : global.jsPDF;
      var doc = new jsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      var pageW = 210, margin = 10;
      // SUP-038：scale 提升到 2.5 + JPEG 0.95，文字/照片更清晰（2/0.92 仍偏糊）
      return global.html2canvas(content, { scale: 2.5, backgroundColor: '#ffffff', useCORS: true, letterRendering: true }).then(function (canvas) {
        if (!canvas || !canvas.width || !canvas.height) throw new Error('报告渲染失败（空画布）');
        var maxH = 297 - margin * 2;
        // SUP-035：分页按「源图像 y 偏移」逐页裁切（原实现每页把整幅画布压扁重绘，导致第 2 页起内容被压缩/重叠）
        var usableW = pageW - margin * 2;               // 页面可用宽度（mm）
        var pxPerMm = canvas.width / usableW;           // 画布像素 / 毫米
        var slicePx = Math.max(1, Math.floor(maxH * pxPerMm)); // 每页对应的源像素高度
        var offset = 0, first = true;
        while (offset < canvas.height) {
          if (!first) doc.addPage();
          var h = Math.min(slicePx, canvas.height - offset);
          var tmp = global.document.createElement('canvas');
          tmp.width = canvas.width; tmp.height = h;
          var ctx = tmp.getContext('2d');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, tmp.width, tmp.height); // JPEG 无透明通道，先铺白底
          ctx.drawImage(canvas, 0, offset, canvas.width, h, 0, 0, canvas.width, h);
          doc.addImage(tmp.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, usableW, h / pxPerMm);
          offset += h; first = false;
        }
        global.document.body.removeChild(holder);
        var fname = (opts && opts.filename) || (T('现场照片报告') + '_' + Util.fmtDate(Date.now()).replace(/[^0-9]/g, '') + '.pdf');
        // SUP-032：安卓端保存到本地文件夹（可浏览），Web/PC 浏览器下载
        if (Util.isNative && Util.isNative() && typeof doc.output === 'function' && global.Report && Report.downloadFile) {
          return Report.downloadFile(doc.output('blob'), fname).then(function () { return null; })
            .catch(function () { doc.save(fname); return null; });
        }
        doc.save(fname);
      });
    });
  };

  /** 导出 Word（HTML blob，兼容 Word 打开） */
  Photos.exportReportWord = function (opts) {
    var title = (opts && opts.title) || T('现场照片报告');
    // SUP-036：优先用区块化编排（blocks），否则回退 buildReportHtml
    var html;
    if (opts && opts.blocks && opts.blocks.length) {
      var wopts = {}; for (var wk in (opts || {})) wopts[wk] = opts[wk]; wopts.word = true;
      html = Photos.buildBlocksHtml(opts.blocks, wopts);
    } else {
      // SUP-035：word 模式排版（表格统计行 + 显式图片宽高），并声明页边距/中文字体
      var wopts2 = {}; for (var wk2 in (opts || {})) wopts2[wk2] = opts[wk2]; wopts2.word = true;
      html = Photos.buildReportHtml(wopts2);
    }
    var full = '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + Util.esc(title) + '</title>' +
      '<style>@page{size:A4;margin:2cm}body{font-family:"Microsoft YaHei","PingFang SC",Arial,sans-serif}</style></head><body>' +
      html + '</body></html>';
    var blob = new Blob(['﻿', full], { type: 'application/msword' });
    var fname = (opts && opts.filename) || (T('现场照片报告') + '_' + Util.fmtDate(Date.now()).replace(/[^0-9]/g, '') + '.doc');
    // SUP-032：安卓端保存到本地文件夹，Web/PC 浏览器下载
    if (Util.isNative && Util.isNative() && global.Report && Report.downloadFile) {
      return Report.downloadFile(blob, fname).then(function () {});
    }
    Util.download(blob, fname);
    return Promise.resolve();
  };

  // 按 90° 旋转 dataURL；direction 为 1 顺时针，-1 逆时针。
  Photos.rotateDataUrl = function (dataUrl, direction) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        try {
          var c = global.document.createElement('canvas');
          c.width = img.height; c.height = img.width;
          var ctx = c.getContext('2d');
          if (direction === -1) { ctx.translate(0, c.height); ctx.rotate(-Math.PI / 2); }
          else { ctx.translate(c.width, 0); ctx.rotate(Math.PI / 2); }
          ctx.drawImage(img, 0, 0);
          resolve(c.toDataURL('image/jpeg', photoPrefs().quality));
        } catch (e) { reject(e); }
      };
      img.onerror = function () { reject(new Error(T('图片解码失败'))); };
      img.src = dataUrl;
    });
  };

  // 保存旋转后的照片：重新归一化、更新 IndexedDB 和内存列表。
  Photos.rotatePhoto = function (photoId, direction) {
    var p = Photos.list.find(function (x) { return x.id === photoId; });
    if (!p) return Promise.reject(new Error(T('照片不存在')));
    return Photos.rotateDataUrl(p.dataUrl, direction || 1).then(Photos.normalizeImage).then(function (n) {
      p.dataUrl = n.dataUrl; p.width = n.width; p.height = n.height; p.sizeKB = n.sizeKB;
      p.updatedAt = Date.now();
      return Storage.put(NS, p).then(function () { return p; });
    });
  };

  // 可反复调整方向的照片操作弹窗，保存前只修改当前照片，不影响其他记录。
  function openAdjustDialog(p) {
    var imgEl = Util.el('img', { src: p.dataUrl, alt: p.name, style: 'max-width:100%;max-height:52vh;display:block;margin:0 auto 12px;border:1px solid var(--line);border-radius:8px' });
    var body = Util.el('div', {}, [imgEl, Util.el('div', { class: 'muted', style: 'text-align:center;margin-bottom:10px', text: T('可左右旋转 90°，确认后保存到本机') })]);
    var left = Util.el('button', { class: 'btn', text: T('逆时针 90°') });
    var right = Util.el('button', { class: 'btn', text: T('顺时针 90°') });
    var save = Util.el('button', { class: 'btn btn-primary', text: T('保存照片') });
    var working = p.dataUrl;
    function turn(dir) { Photos.rotateDataUrl(working, dir).then(function (url) { working = url; imgEl.src = url; }).catch(function (e) { Util.toast(T('图片处理失败：') + e.message, 'err'); }); }
    left.onclick = function () { turn(-1); };
    right.onclick = function () { turn(1); };
    save.onclick = function () { Photos.normalizeImage(working).then(function (n) { p.dataUrl = n.dataUrl; p.width = n.width; p.height = n.height; p.sizeKB = n.sizeKB; p.updatedAt = Date.now(); return Storage.put(NS, p); }).then(function () { Util.closeModal(); Util.toast(T('照片已保存'), 'ok'); renderAll(); }).catch(function (e) { Util.toast(T('保存失败：') + e.message, 'err'); }); };
    Util.modal(T('调整照片'), body, [left, right, save, Util.el('button', { class: 'btn', onclick: Util.closeModal }, T('取消'))]);
  }

  // SUP-043：询问用户是否需要旋转照片方向，以满足统一 16:9 横屏格式
  function confirmPhotoOrientation(dataUrl) {
    return new Promise(function (resolve, reject) {
      const img = new Image();
      img.onload = function () {
        const preview = Util.el('div', { style: 'text-align:center' }, [
          Util.el('img', { src: dataUrl, style: 'max-width:100%;max-height:45vh;display:block;margin:0 auto 12px;border:1px solid var(--line);border-radius:6px' }),
          Util.el('div', { style: 'font-size:13px;color:var(--ink-2);margin-bottom:8px', text: T('当前照片方向可能不符合统一的 16:9 横屏格式。') }),
          Util.el('div', { style: 'font-size:12px;color:var(--ink-3)', text: T('建议宽度大于高度。是否需要顺时针旋转 90°？') })
        ]);
        const keepBtn = Util.el('button', { class: 'btn', text: T('保持原方向') });
        const rotateBtn = Util.el('button', { class: 'btn btn-primary', text: T('顺时针旋转 90°') });
        Util.modal(T('调整照片方向'), preview, [keepBtn, rotateBtn]);
        keepBtn.onclick = function () { Util.closeModal(); resolve(dataUrl); };
        rotateBtn.onclick = function () {
          Util.closeModal();
          const c = global.document.createElement('canvas');
          c.width = img.height; c.height = img.width;
          const ctx = c.getContext('2d');
          ctx.translate(c.width, 0);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(img, 0, 0);
          resolve(c.toDataURL('image/jpeg', 0.95));
        };
      };
      img.onerror = function () { reject(new Error('image load fail')); };
      img.src = dataUrl;
    });
  }

  // ---------------- 相机拍摄（安卓 APK / 移动端） ----------------
  // 仅安卓端显示「拍照」入口；调用 Capacitor Camera 原生相机，降级到移动端 getUserMedia。
  // 拍得的照片走同一套归一化压缩逻辑入库，保证与上传照片一致（1280×720 横图）。
  Photos.capturePhoto = function () {
    return new Promise(function (resolve, reject) {
      // 优先 Capacitor Camera（APK 内原生相机，支持拍摄 + 相册）
      if (global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.Camera) {
        global.Capacitor.Plugins.Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: 'dataUrl', // 直接得到 dataURL，避免额外读写
          source: 'CAMERA',
          saveToGallery: true,
          width: 1920
        }).then(function (photo) {
          if (!photo || !photo.dataUrl) return reject(new Error(T('拍照取消')));
          // SUP-043：拍摄后先询问用户是否需要旋转方向
          confirmPhotoOrientation(photo.dataUrl).then(function (orientedUrl) {
            // 复用归一化压缩（dataURL → 1280×720 letterbox 横图），保证入库一致
            Photos.normalizeImage(orientedUrl).then(function (n) {
              Photos.addPhotoFromResult(n, T('现场照片') + '_' + Util.fmtDate(Date.now()).replace(/[^0-9]/g, '')).then(resolve, reject);
            }, reject);
          }, reject);
        }).catch(function (e) {
          // 用户取消相机：返回 null（上层不报错）
          if (e && (e.message === 'User cancelled photos app' || /cancel/i.test(e.message || ''))) return resolve(null);
          reject(e);
        });
        return;
      }
      // 移动端降级：系统相机输入（HTML capture）
      var inp = global.document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.setAttribute('capture', 'environment');
      inp.style.display = 'none';
      global.document.body.appendChild(inp);
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0];
        global.document.body.removeChild(inp);
        if (!f) return resolve(null);
        Photos.compressFile(f).then(function (n) {
          Photos.addPhotoFromResult(n, T('现场照片') + '_' + Util.fmtDate(Date.now()).replace(/[^0-9]/g, '')).then(resolve, reject);
        }, reject);
      });
      inp.addEventListener('cancel', function () { global.document.body.removeChild(inp); resolve(null); });
      inp.click();
    });
  };

  // ---------------- 上传（文件选择 + 拖拽） ----------------
  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error('read fail')); };
      r.readAsDataURL(file);
    });
  }
  /** 上传一组文件（多选/拖拽）。返回成功张数与失败明细。 */
  Photos.uploadFiles = function (fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    var errors = [], added = 0, totalBytes = 0;
    // 先做格式/大小校验
    var valid = [];
    files.forEach(function (f) {
      var err = Photos.validateFile(f);
      if (err) errors.push(f.name + '：' + err);
      else { valid.push(f); totalBytes += f.size; }
    });
    if (totalBytes > MAX_TOTAL_MB * 1024 * 1024) { errors.push(T('单次导入总量超') + ' ' + MAX_TOTAL_MB + 'MB'); valid = []; }
    if (!valid.length) return Promise.resolve({ added: 0, errors: errors });
    // 逐个压缩（EXIF 方向校正 + 1280×720 裁切）并入库（串行，避免内存峰值）
    var chain = Promise.resolve();
    valid.forEach(function (f) {
      chain = chain.then(function () {
        return Photos.compressFile(f).then(function (n) {
          return Photos.addPhotoFromResult(n, f.name.replace(/\.[^.]+$/, ''));
        }).then(function () { added++; }).catch(function (e) {
          errors.push(f.name + '：' + (e && e.message || '处理失败'));
        });
      });
    });
    return chain.then(function () { return { added: added, errors: errors }; });
  };

  // ---------------- 界面 ----------------
  function metaLine(p) {
    return p.width + '×' + p.height + ' · ' + (p.sizeKB || 0) + ' KB · ' + (p.comments && p.comments.length ? p.comments.length + ' ' + T('条评论') : T('无评论')) + ' · ' + Util.fmtDate(p.createdAt);
  }
  function fmtTime(ts) { return ts ? new Date(ts).toLocaleString('zh-CN', { hour12: false }) : ''; }
  function groupName(id) {
    if (!id) return T('未分组');
    var g = Photos.groups.find(function (x) { return x.id === id; });
    return g ? g.name : T('未分组');
  }

  // 当前 UI 状态：选中集合、过滤分组
  var ui = { selected: {}, filterGroup: null, dragCounter: 0 };

  function renderGrid(container) {
    container.innerHTML = '';
    var totalKB = Photos.list.reduce(function (s, p) { return s + (p.sizeKB || 0); }, 0);
    var stat = Util.el('div', { class: 'muted', style: 'margin-bottom:10px', text: T('共') + ' ' + Photos.list.length + ' ' + T('张 · 累计') + ' ' + (totalKB >= 1024 ? (totalKB / 1024).toFixed(1) + ' MB' : totalKB + ' KB') });
    container.appendChild(stat);
    if (!Photos.list.length) {
      container.appendChild(Util.el('div', { class: 'empty', text: T('还没有照片。点击「上传照片」或拖拽图片到此处添加。') }));
      return;
    }
    // 工具栏：选择/全选/批量导出/批量评论
    var toolbar = Util.el('div', { class: 'photo-toolbar' }, [
      Util.el('button', { class: 'btn btn-sm', onclick: function () { toggleAll(); } }, T('全选/取消')),
      Util.el('button', { class: 'btn btn-sm', onclick: function () { clearSel(); renderGrid(container); } }, T('清空选择')),
      Util.el('span', { class: 'muted', style: 'margin:0 6px', text: T('已选') + ' ' + Object.keys(ui.selected).length + ' 张' }),
      Util.el('button', { class: 'btn btn-sm btn-primary', onclick: function () { bulkExport(container); }, html: Photos.icon('package') + T('批量导出 ZIP') }),
      Util.el('button', { class: 'btn btn-sm', onclick: function () { bulkComment(container); }, html: Photos.icon('comment') + T('批量评论') })
    ]);
    container.appendChild(toolbar);
    // 照片网格（带复选框）
    var grid = Util.el('div', { class: 'photo-grid' });
    Photos.list.forEach(function (p) {
      if (ui.filterGroup && (p.groupId || null) !== (ui.filterGroup === UNGROUPED_ID ? null : ui.filterGroup)) return;
      var card = Util.el('div', { class: 'photo-card' + (ui.selected[p.id] ? ' selected' : '') }, [
        Util.el('label', { class: 'photo-check', style: 'position:absolute;top:6px;left:6px;z-index:2;background:#fff;border-radius:4px' }, [
          Util.el('input', { type: 'checkbox', checked: !!ui.selected[p.id], onclick: function (e) { toggleSel(p.id, e.target.checked); renderGrid(container); } })
        ]),
        Util.el('img', { class: 'photo-thumb', src: p.dataUrl, alt: p.name, loading: 'lazy', onclick: function () { showPreview(p); } }),
        Util.el('div', { class: 'photo-meta' }, [
          Util.el('div', { class: 'photo-name', text: p.name, title: p.name }),
          Util.el('div', { class: 'photo-sub muted', text: metaLine(p) }),
          Util.el('div', { class: 'photo-group-tag', html: Photos.icon('folder', 14) + Util.esc(groupName(p.groupId)) })
        ]),
        Util.el('div', { class: 'photo-comments' }, (p.comments || []).slice(0, 2).map(function (c) {
          return Util.el('div', { class: 'cmt', text: (c.author ? c.author + '：' : '') + c.text });
        })),
        Util.el('div', { class: 'photo-acts' }, [
          Util.el('button', { class: 'btn btn-sm', onclick: function () { showPreview(p); }, html: Photos.icon('eye', 14) + T('查看') }),
          Util.el('button', { class: 'btn btn-sm', onclick: function () { openAdjustDialog(p); }, html: Photos.icon('arrows', 14) + T('调整照片') }),
          Util.el('button', { class: 'btn btn-sm', onclick: function () { moveDialog(p, container); }, html: Photos.icon('folder', 14) + T('分组') }),
          Util.el('button', { class: 'btn btn-sm', onclick: function () { commentDialog(p, container); }, html: Photos.icon('comment', 14) + T('评论') }),
          Util.el('button', { class: 'btn btn-sm btn-danger', onclick: function () { removeOne(p, container); }, html: Photos.icon('trash', 14) + T('删除') })
        ])
      ]);
      // SUP-031：安卓端长按照片卡片弹出操作菜单（查看/评论/分组/删除），增强触控交互
      bindLongPress(card, function () { cardActionMenu(p, container); });
      grid.appendChild(card);
    });
    container.appendChild(grid);
  }

  function toggleSel(id, on) { if (on) ui.selected[id] = true; else delete ui.selected[id]; }
  function toggleAll() {
    var visible = Photos.list.filter(function (p) { return !ui.filterGroup || (p.groupId || null) === (ui.filterGroup === UNGROUPED_ID ? null : ui.filterGroup); });
    var allSelected = visible.every(function (p) { return ui.selected[p.id]; });
    visible.forEach(function (p) { if (allSelected) delete ui.selected[p.id]; else ui.selected[p.id] = true; });
  }
  function clearSel() { ui.selected = {}; }
  function selIds() { return Object.keys(ui.selected); }

  function bulkExport(container) {
    var ids = selIds();
    if (!ids.length) { Util.toast(T('请先勾选要导出的照片'), 'err'); return; }
    Util.confirm(T('批量导出'), T('将 ') + ids.length + T(' 张照片打包为 ZIP 下载。'), T('导出')).then(function (ok) {
      if (!ok) return;
      Photos.exportZip(ids).then(function () {
        Util.toast(T('已开始下载 ZIP'), 'ok');
        clearSel(); renderGrid(container);
      }).catch(function (e) { Util.toast(T('导出失败：') + (e && e.message), 'err'); });
    });
  }

  function bulkComment(container) {
    var ids = selIds();
    if (!ids.length) { Util.toast(T('请先勾选照片'), 'err'); return; }
    Util.ask(T('批量评论'), T('为所选照片统一添加评论：'), '').then(function (txt) {
      if (!txt) return;
      return Photos.addBulkComment(ids, txt).then(function () {
        Util.toast(T('已为 ') + ids.length + T(' 张照片添加评论'), 'ok');
        clearSel(); renderGrid(container);
      });
    }).catch(function (e) { if (e && e !== 'cancel') Util.toast(T('失败：') + (e && e.message || e), 'err'); });
  }

  function moveDialog(p, container) {
    var options = [Util.el('option', { value: UNGROUPED_ID }, T('未分组'))].concat(Photos.groups.map(function (g) { return Util.el('option', { value: g.id, selected: p.groupId === g.id }, g.name); }));
    var sel = Util.el('select', { class: 'input' }, options);
    var ok = Util.el('button', { class: 'btn btn-primary' }, T('移入'));
    ok.onclick = function () {
      Photos.moveToGroup([p.id], sel.value).then(function () {
        Util.closeModal(); Util.toast(T('已移入分组'), 'ok'); renderGrid(container);
      });
    };
    Util.modal(T('移动到分组'), Util.el('div', { style: 'display:flex;gap:8px;align-items:center' }, [Util.el('span', { text: T('选择分组') + '：' }), sel]), [ok, Util.el('button', { class: 'btn', onclick: Util.closeModal }, T('取消'))]);
  }

  function commentDialog(p, container) {
    // 评论列表 + 新增
    var listEl = Util.el('div', { class: 'cmt-list' });
    function renderCmts() {
      listEl.innerHTML = '';
      (p.comments || []).forEach(function (c) {
        var row = Util.el('div', { class: 'cmt-row' }, [
          Util.el('div', { style: 'flex:1' }, [
            Util.el('div', { text: (c.author ? c.author + '：' : '') + c.text }),
            Util.el('div', { class: 'muted', style: 'font-size:12px', text: fmtTime(c.createdAt) })
          ]),
          Util.el('button', { class: 'btn btn-sm', onclick: function () { editOne(c, p, listEl, renderCmts); } }, T('编辑')),
          Util.el('button', { class: 'btn btn-sm btn-danger', onclick: function () { Photos.removeComment(p.id, c.id).then(function () { renderCmts(); }); } }, T('删除'))
        ]);
        listEl.appendChild(row);
      });
      if (!(p.comments || []).length) listEl.appendChild(Util.el('div', { class: 'muted', text: T('暂无评论') }));
    }
    renderCmts();
    var input = Util.el('input', { class: 'input', placeholder: T('输入评论…') });
    var addBtn = Util.el('button', { class: 'btn btn-primary' }, T('添加评论'));
    addBtn.onclick = function () {
      Photos.addComment(p.id, input.value).then(function () {
        input.value = ''; renderCmts();
        Util.toast(T('已添加评论'), 'ok');
      });
    };
    var foot = Util.el('div', { style: 'display:flex;gap:8px' }, [input, addBtn]);
    Util.modal(T('照片评论') + ' · ' + p.name, Util.el('div', { style: 'max-height:60vh;overflow:auto;display:flex;flex-direction:column;gap:10px' }, [listEl, foot]), [Util.el('button', { class: 'btn', onclick: function () { Util.closeModal(); renderGrid(container); } }, T('完成'))]);
  }
  function editOne(c, p, listEl, renderCmts) {
    Util.ask(T('编辑评论'), T('修改评论内容：'), c.text).then(function (txt) {
      if (!txt) return;
      return Photos.editComment(p.id, c.id, txt).then(function () { renderCmts(); });
    }).catch(function () {});
  }

  function removeOne(p, container) {
    Util.confirm(T('删除照片'), T('确认删除') + ' <b>' + Util.esc(p.name) + '</b>？' + T('此操作不可恢复。'), T('删除')).then(function (ok) {
      if (!ok) return;
      Photos.deletePhoto(p.id).then(function () {
        delete ui.selected[p.id];
        Util.toast(T('已删除'), 'ok');
        renderGrid(container);
      });
    });
  }

  function showPreview(p) {
    if (Photos._preview && Photos._preview.parentNode) Photos._preview.parentNode.removeChild(Photos._preview);
    var comments = (p.comments || []).map(function (c) {
      return Util.el('div', { class: 'pv-cmt', text: '💬 ' + (c.author ? c.author + '：' : '') + c.text });
    });
    var ov = Util.el('div', { class: 'photo-preview' }, [
      Util.el('div', { class: 'photo-preview-bar' }, [
        Util.el('div', {}, [
          Util.el('div', { style: 'font-weight:600', text: p.name }),
          Util.el('div', { class: 'muted', style: 'font-size:12px', text: metaLine(p) + ' · ' + groupName(p.groupId) })
        ]),
        Util.el('button', { class: 'btn btn-sm', onclick: function () { openAdjustDialog(p); } }, T('调整照片')),
        Util.el('button', { class: 'btn btn-sm', onclick: function () { closePreview(); } }, '✕ ' + T('关闭'))
      ]),
      Util.el('img', { class: 'photo-preview-img', src: p.dataUrl, alt: p.name }),
      // SUP-031：安卓端显示滑动提示箭头
      (global.Util && Util.isAndroidApp && Util.isAndroidApp()) ? Util.el('div', { class: 'photo-preview-swipe-hint left', text: '‹' }) : null,
      (global.Util && Util.isAndroidApp && Util.isAndroidApp()) ? Util.el('div', { class: 'photo-preview-swipe-hint right', text: '›' }) : null,
      comments.length ? Util.el('div', { class: 'pv-cmts', style: 'padding:10px 14px' }, comments) : null
    ]);
    ov.addEventListener('click', function (e) { if (e.target === ov) closePreview(); });
    // SUP-031：安卓端照片预览支持左右滑动切换上一张/下一张（含上/下键与点击左右边缘）
    Photos._bindPreviewSwipe(ov, p);
    global.document.body.appendChild(ov);
    Photos._preview = ov;
  }
  // 预览左右滑动：向左滑下一张，向右滑上一张；同时绑定键盘 ← / →（PC 可用）
  Photos._bindPreviewSwipe = function (ov, current) {
    var list = Photos.list.filter(function (x) {
      if (!ui.filterGroup) return true;
      return (x.groupId || null) === (ui.filterGroup === UNGROUPED_ID ? null : ui.filterGroup);
    });
    if (!list.length) return;
    var idx = list.findIndex(function (x) { return x.id === current.id; });
    var go = function (step) {
      var ni = (idx + step + list.length) % list.length;
      if (list[ni]) { closePreview(); showPreview(list[ni]); }
    };
    var sx = 0, sy = 0, dx = 0, dy = 0, down = false;
    ov.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; sx = t.clientX; sy = t.clientY; dx = 0; dy = 0; down = true;
    }, { passive: true });
    ov.addEventListener('touchmove', function (e) {
      if (!down || e.touches.length !== 1) return;
      var t = e.touches[0]; dx = t.clientX - sx; dy = t.clientY - sy;
    }, { passive: true });
    ov.addEventListener('touchend', function (e) {
      if (!down) return; down = false;
      // 仅当横向位移明显大于纵向且超过阈值时判定为翻页手势
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        go(dx < 0 ? 1 : -1);
      }
    });
    // 键盘 ← / → 导航
    ov.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });
    ov.tabIndex = 0;
  };
  // 通用长按手势：按住超过阈值触发 action，短按/滑动不触发（默认 520ms）
  function bindLongPress(el, action) {
    if (!el) return;
    var timer = null, moved = false, sx = 0, sy = 0, fired = false;
    function start(x, y) {
      fired = false; moved = false; sx = x; sy = y;
      timer = setTimeout(function () { fired = true; try { action(); } catch (e) {} }, 520);
    }
    function cancel() { if (timer) { clearTimeout(timer); timer = null; } }
    el.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { start(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      if (!timer) return;
      if (Math.abs(e.touches[0].clientX - sx) > 10 || Math.abs(e.touches[0].clientY - sy) > 10) { moved = true; cancel(); }
    }, { passive: true });
    el.addEventListener('touchend', function () { cancel(); });
    el.addEventListener('touchcancel', cancel);
    // 鼠标长按（PC 预览/调试用）
    el.addEventListener('mousedown', function (e) { if (e.button === 0) start(e.clientX, e.clientY); });
    el.addEventListener('mousemove', function (e) { if (!timer) return; if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) { moved = true; cancel(); } });
    el.addEventListener('mouseup', cancel);
    el.addEventListener('mouseleave', cancel);
  }
  // 长按照片卡片弹出的操作菜单（底部操作单）
  function cardActionMenu(p, container) {
    var viewBtn = Util.el('button', { class: 'btn btn-primary', style: 'width:100%', onclick: function () { Util.closeModal(); showPreview(p); }, html: Photos.icon('eye', 16) + T('查看大图') });
    var commentBtn = Util.el('button', { class: 'btn', style: 'width:100%', onclick: function () { Util.closeModal(); commentDialog(p, container); }, html: Photos.icon('comment', 16) + T('评论') });
    var groupBtn = Util.el('button', { class: 'btn', style: 'width:100%', onclick: function () { Util.closeModal(); moveDialog(p, container); }, html: Photos.icon('folder', 16) + T('移动到分组') });
    var delBtn = Util.el('button', { class: 'btn btn-danger', style: 'width:100%', onclick: function () { Util.closeModal(); removeOne(p, container); }, html: Photos.icon('trash', 16) + T('删除照片') });
    var cancelBtn = Util.el('button', { class: 'btn btn-ghost', style: 'width:100%', onclick: Util.closeModal }, T('取消'));
    var body = Util.el('div', { style: 'display:flex;flex-direction:column;gap:8px' }, [viewBtn, commentBtn, groupBtn, delBtn, cancelBtn]);
    Util.modal(T('照片操作') + ' · ' + p.name, body, null);
  }
  function closePreview() {
    if (Photos._preview && Photos._preview.parentNode) Photos._preview.parentNode.removeChild(Photos._preview);
    Photos._preview = null;
  }

  // ---------------- 分组面板 ----------------
  function renderGroups(sidebar) {
    sidebar.innerHTML = '';
    var h = Util.el('div', { class: 'group-head' }, [
      Util.el('span', { style: 'font-weight:600', text: T('照片分组') }),
      Util.el('button', { class: 'btn btn-sm', onclick: function () { newGroup(sidebar); } }, '+ ' + T('新建'))
    ]);
    sidebar.appendChild(h);
    // 全部 / 未分组
    var all = Util.el('div', { class: 'group-item' + (ui.filterGroup === null ? ' active' : ''), onclick: function () { ui.filterGroup = null; renderAll(); } }, T('全部照片') + '（' + Photos.list.length + '）');
    var un = Util.el('div', { class: 'group-item' + (ui.filterGroup === UNGROUPED_ID ? ' active' : ''), onclick: function () { ui.filterGroup = UNGROUPED_ID; renderAll(); } }, T('未分组') + '（' + Photos.list.filter(function (p) { return !p.groupId; }).length + '）');
    sidebar.appendChild(all);
    sidebar.appendChild(un);
    // 自定义分组
    Photos.groups.forEach(function (g) {
      var count = Photos.list.filter(function (p) { return p.groupId === g.id; }).length;
      var item = Util.el('div', { class: 'group-item' + (ui.filterGroup === g.id ? ' active' : ''), onclick: function () { ui.filterGroup = g.id; renderAll(); } }, [
        Util.el('span', { style: 'flex:1', text: g.name + '（' + count + '）' }),
        Util.el('span', { class: 'group-ops' }, [
          Util.el('button', { class: 'btn btn-sm', onclick: function (e) { e.stopPropagation(); renameGroup(g, sidebar); } }, '✎'),
          Util.el('button', { class: 'btn btn-sm', onclick: function (e) { e.stopPropagation(); deleteGroup(g, sidebar); } }, '🗑')
        ])
      ]);
      sidebar.appendChild(item);
    });
  }
  function renderAll() {
    Photos.render(global.document.getElementById('content'));
  }
  function newGroup(sidebar) {
    Util.ask(T('新建分组'), T('分组名称：'), '').then(function (name) {
      if (!name) return;
      return Photos.createGroup(name).then(function () { Util.toast(T('分组已创建'), 'ok'); renderAll(); });
    }).catch(function (e) { if (e && e.message) Util.toast(T('失败：') + e.message, 'err'); });
  }
  function renameGroup(g, sidebar) {
    Util.ask(T('重命名分组'), T('分组名称：'), g.name).then(function (name) {
      if (!name) return;
      return Photos.renameGroup(g.id, name).then(function () { renderAll(); });
    }).catch(function (e) { if (e && e.message) Util.toast(T('失败：') + e.message, 'err'); });
  }
  function deleteGroup(g, sidebar) {
    Util.confirm(T('删除分组'), T('删除分组') + ' <b>' + Util.esc(g.name) + '</b>？' + T('组内照片将移回未分组，照片本身不删除。'), T('删除')).then(function (ok) {
      if (!ok) return;
      Photos.deleteGroup(g.id).then(function () { Util.toast(T('分组已删除'), 'ok'); renderAll(); });
    });
  }

  function captureNow(gridBox) {
    Util.toast(T('正在打开相机…'), 'ok');
    Photos.capturePhoto().then(function (rec) {
      if (rec) { Util.toast(T('照片已保存：') + rec.name, 'ok'); renderGrid(gridBox); }
    }).catch(function (e) { Util.toast(T('拍照失败：') + (e && e.message || ''), 'err'); });
  }

  // ---------------- 上传区域 ----------------
  function buildUploadZone(container, gridBox) {
    var prefs = photoPrefs();
    var presetSel = Util.el('select', { class: 'input photo-preset', title: T('照片保存质量') }, Object.keys(PHOTO_PRESETS).map(function (key) { return Util.el('option', { value: key, selected: prefs.preset === key }, T(PHOTO_PRESETS[key].label)); }));
    presetSel.addEventListener('change', function () { savePhotoPrefs({ preset: presetSel.value, quality: PHOTO_PRESETS[presetSel.value].quality }); Util.toast(T('照片保存设置已更新'), 'ok'); });
    var zone = Util.el('div', { class: 'upload-zone' }, [
      Util.el('input', { type: 'file', id: 'photoUploadInput', accept: 'image/*', multiple: true, style: 'display:none' }),
      Util.el('div', { style: 'text-align:center;padding:18px 10px' }, [
        Util.el('div', { style: 'font-size:28px;margin-bottom:6px' }, '📤'),
        Util.el('div', { text: T('点击选择或拖拽图片到此处上传') }),
        Util.el('div', { class: 'muted', style: 'font-size:12px;margin-top:4px', text: T('支持 JPG/PNG/WebP 等 · 单文件 ≤5MB · 自动统一为 1280×720 横图') })
      ]),
      Util.el('div', { class: 'btn-row', style: 'justify-content:center' }, (function () {
        var btns = [Util.el('button', { class: 'btn btn-primary', onclick: function () { zone.querySelector('input').click(); } }, '⬆ ' + T('上传照片')), presetSel];
        // SUP-031：仅安卓端（APK / 手机）提供「拍照」入口，Web/PC 保持原样不显示
        if (Util.isAndroidApp()) {
          btns.push(Util.el('button', { class: 'btn', onclick: function () { captureNow(gridBox); }, html: Photos.icon('camera', 16) + T('拍照') }));
        }
        return btns;
      })())
    ]);
    var input = zone.querySelector('input');
    input.addEventListener('change', function () {
      Photos.uploadFiles(input.files).then(function (r) {
        input.value = '';
        var msg = T('已上传') + ' ' + r.added + ' 张';
        if (r.errors && r.errors.length) msg += '；' + r.errors.length + ' ' + T('张失败');
        Util.toast(msg, r.errors && r.errors.length ? 'warn' : 'ok');
        if (r.errors && r.errors.length) { console.warn('upload errors:', r.errors); }
        renderGrid(gridBox);
      });
    });
    // 拖拽
    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); zone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); zone.classList.remove('dragover'); });
    });
    zone.addEventListener('drop', function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) {
        Photos.uploadFiles(files).then(function (r) {
          var msg = T('已上传') + ' ' + r.added + ' 张';
          if (r.errors && r.errors.length) msg += '；' + r.errors.length + ' ' + T('张失败');
          Util.toast(msg, r.errors && r.errors.length ? 'warn' : 'ok');
          renderGrid(gridBox);
        });
      }
    });
    // 上传后网格刷新（分组面板重新计算计数）
    return zone;
  }

  // ---------------- 报告导出对话框（SUP-034：自定义选择照片 + 布局 + 预览 + 确认导出） ----------------
  function reportDialog(container) {
    var titleInput = Util.el('input', { class: 'input', value: T('现场照片报告') });
    var subtitleInput = Util.el('input', { class: 'input', placeholder: T('副标题/说明（可选）') });
    var groupSel = Util.el('select', { class: 'input' }, [Util.el('option', { value: '' }, T('全部照片'))].concat(Photos.groups.map(function (g) { return Util.el('option', { value: g.id }, g.name); })));
    var layoutSel = Util.el('select', { class: 'input' }, [
      Util.el('option', { value: 'single' }, T('单栏') + '（每张照片独占一行）'),
      Util.el('option', { value: 'double' }, T('双栏') + '（网格排版，更紧凑）')
    ]);
    var sizeSel = Util.el('select', { class: 'input' }, [
      Util.el('option', { value: 'md' }, T('照片尺寸：中')),
      Util.el('option', { value: 'sm' }, T('照片尺寸：小')),
      Util.el('option', { value: 'lg' }, T('照片尺寸：大'))
    ]);
    // 照片选择列表（带复选框，可多选）
    var selState = {}; // id -> true
    function syncAllToGroup(groupId) {
      selState = {};
      Photos.list.forEach(function (p) {
        if (!groupId || (p.groupId || null) === (groupId === UNGROUPED_ID ? null : groupId)) selState[p.id] = true;
      });
    }
    syncAllToGroup('');
    var pickWrap = Util.el('div', { style: 'max-height:32vh;overflow:auto;border:1px solid var(--line);border-radius:6px;padding:8px' });
    function renderPick() {
      var gid = groupSel.value || null;
      var list = Photos.list.filter(function (p) { return !gid || (p.groupId || null) === (gid === UNGROUPED_ID ? null : gid); });
      pickWrap.innerHTML = '';
      if (!list.length) { pickWrap.appendChild(Util.el('div', { class: 'muted', text: T('没有可选择的照片') })); return; }
      list.forEach(function (p) {
        var cb = Util.el('input', { type: 'checkbox', checked: !!selState[p.id] });
        cb.onchange = function () { if (cb.checked) selState[p.id] = true; else delete selState[p.id]; updatePickCount(); };
        var row = Util.el('div', { style: 'display:flex;align-items:center;gap:8px;padding:4px 2px' }, [
          cb,
          Util.el('img', { src: p.dataUrl, style: 'width:44px;height:28px;object-fit:cover;border-radius:3px;border:1px solid var(--line)' }),
          Util.el('span', { style: 'flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', text: p.name || T('照片') }),
          Util.el('span', { class: 'muted', style: 'font-size:11px', text: groupName(p.groupId) })
        ]);
        pickWrap.appendChild(row);
      });
      updatePickCount();
    }
    function updatePickCount() {
      var n = Object.keys(selState).length;
      countLabel.textContent = T('已选') + ' ' + n + ' ' + T('张');
    }
    var countLabel = Util.el('span', { class: 'muted' });
    groupSel.onchange = function () {
      // 切换分组时，默认全选该分组内照片
      syncAllToGroup(groupSel.value || '');
      renderPick();
    };
    var selectAllBtn = Util.el('button', { class: 'btn btn-sm', text: T('全选/清空') });
    selectAllBtn.onclick = function () {
      var gid = groupSel.value || null;
      var list = Photos.list.filter(function (p) { return !gid || (p.groupId || null) === (gid === UNGROUPED_ID ? null : gid); });
      var allSel = list.length > 0 && list.every(function (p) { return selState[p.id]; });
      list.forEach(function (p) { if (allSel) delete selState[p.id]; else selState[p.id] = true; });
      renderPick();
    };
    var body = Util.el('div', { style: 'display:flex;flex-direction:column;gap:10px' }, [
      Util.el('label', { text: T('报告标题') }), titleInput,
      Util.el('label', { text: T('副标题') }), subtitleInput,
      Util.el('label', { text: T('内容范围') }), groupSel,
      Util.el('div', { class: 'btn-row', style: 'justify-content:flex-start' }, [Util.el('span', { class: 'lbl', text: T('选择照片') }), countLabel, selectAllBtn]),
      pickWrap,
      Util.el('div', { class: 'btn-row', style: 'justify-content:flex-start' }, [layoutSel, sizeSel])
    ]);
    renderPick();
    function collect() {
      return {
        title: titleInput.value,
        subtitle: subtitleInput.value,
        groupId: groupSel.value || null,
        ids: Object.keys(selState),
        layout: layoutSel.value,
        imgSize: sizeSel.value
      };
    }
    var pdfBtn = Util.el('button', { class: 'btn btn-primary' }, T('导出 PDF'));
    pdfBtn.onclick = function () {
      var opts = collect();
      if (!opts.ids.length) { Util.toast(T('请至少选择一张照片'), 'err'); return; }
      Util.closeModal();
      Util.toast(T('正在生成 PDF…'), 'ok');
      Photos.exportReportPdf(opts).then(function () { Util.toast(T('PDF 已导出'), 'ok'); }).catch(function (e) { Util.toast(T('PDF 导出失败：') + (e && e.message), 'err'); });
    };
    var wordBtn = Util.el('button', { class: 'btn' }, T('导出 Word'));
    wordBtn.onclick = function () {
      var opts = collect();
      if (!opts.ids.length) { Util.toast(T('请至少选择一张照片'), 'err'); return; }
      Util.closeModal();
      Photos.exportReportWord(opts).then(function () { Util.toast(T('Word 已导出'), 'ok'); });
    };
    // SUP-034：预览并微调排版（所见即所得）后确认导出
    var editBtn = Util.el('button', { class: 'btn', html: Photos.icon('arrows', 16) + T('预览排版并导出') });
    editBtn.onclick = function () {
      var opts = collect();
      if (!opts.ids.length) { Util.toast(T('请至少选择一张照片'), 'err'); return; }
      openReportEditor(opts);
    };
    Util.modal(T('生成现场照片报告 · 选择照片与排版'), body, [editBtn, pdfBtn, wordBtn, Util.el('button', { class: 'btn', onclick: Util.closeModal }, T('取消'))], { wide: true });
  }

  // ---------------- SUP-036：区块化排版编辑器（插入/排序/布局/尺寸/评论 + 实时预览） ----------------
  // blocks = [{id, layout?, size?}]。每张照片一个块，支持插入/移除/拖拽排序/独立布局与尺寸/评论编辑。
  function openReportEditor(opts) {
    opts = opts || {};
    // SUP-034：若已传入用户选择的照片 ids，则直接用；否则按分组/全部推导
    var ids;
    if (opts.ids && opts.ids.length) {
      ids = opts.ids.filter(function (id) { return Photos.list.some(function (p) { return p.id === id; }); });
    } else {
      ids = Photos.list.filter(function (p) { return !opts.groupId || (p.groupId || null) === (opts.groupId === UNGROUPED_ID ? null : opts.groupId); }).map(function (p) { return p.id; });
    }
    if (!ids.length) { Util.toast(T('没有可编辑的照片'), 'err'); return; }
    // 编辑器状态：blocks（编排顺序 + 每块布局/尺寸），title/subtitle
    var state = {
      blocks: ids.map(function (id) { return { id: id, layout: opts.layout || 'single', size: opts.imgSize || 'md' }; }),
      title: opts.title || T('现场照片报告'),
      subtitle: opts.subtitle || ''
    };
    function findPhoto(id) { return Photos.list.find(function (x) { return x.id === id; }); }
    function blockIndex(id) { return state.blocks.map(function (b) { return b.id; }).indexOf(id); }
    // 当前未加入报告的照片（可插入）
    function library() { return Photos.list.filter(function (p) { return blockIndex(p.id) < 0; }); }
    // 导出/预览参数
    function exportOpts() {
      return {
        title: state.title, subtitle: state.subtitle,
        blocks: state.blocks.map(function (b) { return { id: b.id, layout: b.layout, size: b.size }; })
      };
    }
    // 预览刷新（HTML 字符串经 innerHTML 插入）
    var previewCol;
    function renderPreview() {
      previewCol.innerHTML = '';
      var html = Photos.buildBlocksHtml(state.blocks, { title: state.title, subtitle: state.subtitle });
      previewCol.appendChild(Util.el('div', { class: 'rpt-live-preview', html: html }));
    }
    // 评论区（可编辑）
    function commentBox(p, onChange) {
      var cmts = Util.el('div', { class: 'rpt-cmts' });
      function renderCmts() {
        cmts.innerHTML = '';
        (p.comments || []).forEach(function (c) {
          var inp = Util.el('input', { class: 'input', style: 'width:100%;margin:2px 0;font-size:12px', value: c.text });
          inp.onchange = function () { Photos.editComment(p.id, c.id, inp.value).then(function () { onChange(); }); };
          var row = Util.el('div', { style: 'display:flex;align-items:center;gap:4px' }, [
            inp,
            Util.el('button', { class: 'btn btn-sm btn-danger', html: Photos.icon('trash', 12), onclick: function () { Photos.removeComment(p.id, c.id).then(function () { onChange(); }); } })
          ]);
          cmts.appendChild(row);
        });
        var addBtn = Util.el('button', { class: 'btn btn-sm', html: Photos.icon('comment', 12) + T('添加评论') });
        addBtn.onclick = function () {
          var t = window.prompt(T('输入评论…'), '');
          if (t) Photos.addComment(p.id, t).then(function () { onChange(); });
        };
        cmts.appendChild(addBtn);
      }
      renderCmts();
      return cmts;
    }
    // 单个块卡片（编辑区）
    function blockCard(b) {
      var p = findPhoto(b.id); if (!p) return Util.el('div');
      var imgMax = b.size === 'lg' ? 240 : (b.size === 'sm' ? 120 : 170);
      var img = Util.el('img', { src: p.dataUrl, style: 'width:100%;max-height:' + imgMax + 'px;object-fit:contain;display:block;border-radius:4px;border:1px dashed var(--line)' });
      // 操作按钮：布局 / 尺寸 / 上移 / 下移 / 移除
      function mkBtn(html, title, onclick) { var btn = Util.el('button', { class: 'btn btn-sm', html: html, title: title }); btn.onclick = onclick; return btn; }
      var layoutBtn = mkBtn(b.layout === 'double' ? '▥' : '▤', T('切换布局（单栏/双栏）'), function () {
        b.layout = b.layout === 'double' ? 'single' : 'double'; renderEdit();
      });
      var sizeBtn = mkBtn(b.size === 'lg' ? 'L' : (b.size === 'sm' ? 'S' : 'M'), T('切换尺寸（小/中/大）'), function () {
        b.size = b.size === 'sm' ? 'md' : (b.size === 'md' ? 'lg' : 'sm'); renderEdit();
      });
      var upBtn = mkBtn('↑', T('上移'), function () {
        var i = blockIndex(b.id); if (i <= 0) return; state.blocks.splice(i, 1); state.blocks.splice(i - 1, 0, b); renderEdit();
      });
      var downBtn = mkBtn('↓', T('下移'), function () {
        var i = blockIndex(b.id); if (i < 0 || i >= state.blocks.length - 1) return; state.blocks.splice(i, 1); state.blocks.splice(i + 1, 0, b); renderEdit();
      });
      var rmBtn = mkBtn('✕', T('从报告移除'), function () {
        var i = blockIndex(b.id); if (i >= 0) state.blocks.splice(i, 1); renderEdit();
      });
      rmBtn.classList.add('btn-danger');
      var ops = Util.el('div', { class: 'rpt-block-ops' }, [layoutBtn, sizeBtn, upBtn, downBtn, rmBtn]);
      var cmts = commentBox(p, renderEdit);
      var box = Util.el('div', { class: 'rpt-block', 'data-id': b.id, draggable: 'true' }, [
        Util.el('div', { class: 'rpt-block-img' }, [img]), ops, cmts
      ]);
      // 拖拽排序
      box.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', b.id); });
      box.addEventListener('dragover', function (e) { e.preventDefault(); });
      box.addEventListener('drop', function (e) {
        e.preventDefault();
        var fromId = e.dataTransfer.getData('text/plain');
        if (!fromId || fromId === b.id) return;
        var from = blockIndex(fromId), to = blockIndex(b.id);
        if (from < 0 || to < 0) return;
        var item = state.blocks.splice(from, 1)[0]; state.blocks.splice(to, 0, item);
        renderEdit();
      });
      return box;
    }
    // 库卡片（可插入）
    function libraryCard(p) {
      var addBtn = Util.el('button', { class: 'btn btn-sm btn-primary', text: T('插入') });
      addBtn.onclick = function () { state.blocks.push({ id: p.id, layout: 'single', size: 'md' }); renderEdit(); };
      return Util.el('div', { class: 'rpt-lib-item' }, [
        Util.el('img', { src: p.dataUrl, style: 'width:100%;height:60px;object-fit:cover;border-radius:4px;border:1px solid var(--line)' }),
        Util.el('div', { style: 'font-size:11px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', text: p.name || T('照片') }),
        addBtn
      ]);
    }
    // 编辑器 + 预览渲染
    var editCol, libCol;
    function renderEdit() {
      editCol.innerHTML = ''; libCol.innerHTML = '';
      if (!state.blocks.length) editCol.appendChild(Util.el('div', { class: 'muted', style: 'padding:20px;text-align:center', text: T('报告为空，请从左侧插入照片') }));
      else {
        editCol.appendChild(Util.el('div', { class: 'muted', style: 'margin-bottom:6px;font-size:12px', text: T('拖拽排序；每个块可切换布局/尺寸、编辑评论。') }));
        state.blocks.forEach(function (b) { editCol.appendChild(blockCard(b)); });
      }
      var lib = library();
      libCol.appendChild(Util.el('div', { class: 'muted', style: 'margin-bottom:6px;font-size:12px', text: lib.length ? (T('可插入照片（') + lib.length + T('）')) : T('所有照片均已插入') }));
      if (lib.length) {
        var libGrid = Util.el('div', { class: 'rpt-lib-grid' });
        lib.forEach(function (p) { libGrid.appendChild(libraryCard(p)); });
        libCol.appendChild(libGrid);
      }
      renderPreview();
    }
    // 控制栏：标题/副标题输入（实时更新预览）
    var titleInput = Util.el('input', { class: 'input', value: state.title, placeholder: T('报告标题') });
    titleInput.oninput = function () { state.title = titleInput.value; renderPreview(); };
    var subtitleInput = Util.el('input', { class: 'input', value: state.subtitle, placeholder: T('副标题/说明（可选）') });
    subtitleInput.oninput = function () { state.subtitle = subtitleInput.value; renderPreview(); };
    var metaBar = Util.el('div', { class: 'btn-row', style: 'margin-bottom:10px;justify-content:flex-start;gap:8px' }, [
      Util.el('span', { class: 'lbl', text: T('标题') }), titleInput,
      Util.el('span', { class: 'lbl', text: T('副标题') }), subtitleInput
    ]);
    libCol = Util.el('div', { style: 'width:220px;flex-shrink:0;overflow:auto;max-height:70vh;padding:10px;border:1px solid var(--line);border-radius:8px;background:#fafbfc' });
    editCol = Util.el('div', { style: 'flex:1;overflow:auto;max-height:70vh;padding:10px;border:1px solid var(--line);border-radius:8px' });
    previewCol = Util.el('div', { style: 'flex:1;overflow:auto;max-height:70vh;padding:10px;background:#fafafa;border:1px solid var(--line);border-radius:8px' });
    renderEdit();
    var body = Util.el('div', { style: 'display:flex;flex-direction:column' }, [
      metaBar,
      Util.el('div', { style: 'display:flex;gap:12px' }, [
        Util.el('div', { style: 'display:flex;flex-direction:column' }, [Util.el('div', { class: 'muted', style: 'font-size:12px;margin-bottom:4px', text: T('照片库') }), libCol]),
        Util.el('div', { style: 'flex:1' }, [Util.el('div', { class: 'muted', style: 'font-size:12px;margin-bottom:4px', text: T('排版编辑') }), editCol]),
        Util.el('div', { style: 'flex:1' }, [Util.el('div', { class: 'muted', style: 'font-size:12px;margin-bottom:4px', text: T('实时预览（所见即所得）') }), previewCol])
      ])
    ]);
    var pdfBtn = Util.el('button', { class: 'btn btn-primary' }, T('导出 PDF'));
    pdfBtn.onclick = function () {
      var o = exportOpts();
      if (!o.blocks.length) { Util.toast(T('请至少插入一张照片'), 'err'); return; }
      Util.closeModal();
      Util.toast(T('正在生成 PDF…'), 'ok');
      Photos.exportReportPdf(o).then(function () { Util.toast(T('PDF 已导出'), 'ok'); }).catch(function (e) { Util.toast(T('PDF 导出失败：') + (e && e.message), 'err'); });
    };
    var wordBtn = Util.el('button', { class: 'btn' }, T('导出 Word'));
    wordBtn.onclick = function () {
      var o = exportOpts();
      if (!o.blocks.length) { Util.toast(T('请至少插入一张照片'), 'err'); return; }
      Util.closeModal();
      Photos.exportReportWord(o).then(function () { Util.toast(T('Word 已导出'), 'ok'); });
    };
    Util.modal(T('现场照片报告 · 自定义排版编辑器'), body, [pdfBtn, wordBtn, Util.el('button', { class: 'btn', onclick: Util.closeModal }, T('关闭'))], { wide: true });
  }

  // ---------------- 主渲染 ----------------
  Photos.render = function (container) {
    container = container || global.document.getElementById('content');
    container.innerHTML = '';
    ui.filterGroup = ui.filterGroup || null;
    // 顶部
    container.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('现场照片') }),
        Util.el('div', { class: 'muted', text: T('上传现场照片，按分组整理并添加评论，可批量导出或生成现场照片报告。') })
      ]),
      Util.el('div', { class: 'btn-row' }, [
        Util.el('button', { class: 'btn', onclick: function () { reportDialog(container); }, html: Photos.icon('download', 16) + T('生成现场照片报告') })
      ])
    ]));
    // 布局：分组侧栏 + 主区
    var layout = Util.el('div', { class: 'photo-layout' }, [
      Util.el('aside', { class: 'photo-groups', id: 'photoGroups' }),
      Util.el('div', { class: 'photo-main' })
    ]);
    container.appendChild(layout);
    var sidebar = layout.querySelector('#photoGroups');
    var mainBox = layout.querySelector('.photo-main');
    // 上传区
    var panel = Util.el('div', { class: 'panel card', style: 'margin-bottom:12px' });
    var gridBox = Util.el('div', { style: 'margin-top:4px' });
    mainBox.appendChild(panel);
    panel.appendChild(buildUploadZone(container, gridBox));
    mainBox.appendChild(gridBox);
    // 加载数据后渲染
    Photos.load().then(function () {
      renderGroups(sidebar);
      renderGrid(gridBox);
    });
  };

  global.Photos = Photos;
})(window);

/* ===== src/js/sync-client.js ===== */
/* 局域网数据同步 · 客户端模块（Web 层）
 * 与桌面版（Electron）同步服务完全对齐：
 *   - 协议：WebSocket（默认端口 18080），JSON 消息
 *     { type: 'kv-put'|'kv-delete'|'blob-put'|'blob-delete'|'users-put'|'hello'|'full-sync-req'|'full-sync-resp',
 *       key?, ns?, data?, timestamp, source }
 *   - 冲突策略：Last-Write-Wins（由服务端广播顺序保证）
 * 工作模式：
 *   - 本地存储为 IndexedDB（Android/平板/浏览器直开）时，本模块自动接管：
 *     拦截 Storage 写入 → 广播；收到远程变更 → 写入本地 → 防抖刷新界面。
 *   - 本地存储为 http（内置 Node 后端 / 桌面版）时，同步由桌面端主进程负责，
 *     此面板仅作提示，不做双重同步。
 */
(function (global) {
  'use strict';

  const CFG_KEY = 'spp_sync_cfg';
  const DEFAULT_PORT = 18080;
  const RECONNECT_MS = 3000;
  const REFRESH_DEBOUNCE = 1500;

  const SyncClient = {
    version: '1.1.0',        // SUP-007：1.1.0 支持增量同步
    status: 'idle',        // idle | connecting | connected | disconnected | error
    auto: true,
    serverIp: '',
    serverPort: DEFAULT_PORT,
    logs: [],
    // SUP-007：最近一次全量同步完成时间戳，用于增量请求
    lastSyncAt: 0
  };

  let ws = null;
  let reconnectTimer = null;
  let suppress = false;      // 应用远程变更时抑制本地广播
  let suppressDepth = 0;
  const conflictLog = [];
  function versionOf(value, msg) { const s = value && value._sync || {}; return { at: Number(s.updatedAt || (msg && msg.timestamp) || 0), by: String(s.updatedBy || (msg && msg.source) || '') }; }
  function newer(incoming, current, msg) { const a = versionOf(incoming, msg), b = versionOf(current, null); return a.at > b.at || (a.at === b.at && a.by > b.by); }
  SyncClient.conflicts = conflictLog;
  let refreshTimer = null;
  let refreshReloadTimer = null;
  let syncQueue = Promise.resolve();
  let socketGeneration = 0;
  let clientId = 'web-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function log(msg) {
    SyncClient.logs.unshift('[' + new Date().toLocaleTimeString() + '] ' + msg);
    if (SyncClient.logs.length > 60) SyncClient.logs.length = 60;
    const el = global.document && global.document.getElementById('syncLog');
    if (el) { el.textContent = SyncClient.logs.join('\n'); }
  }

  function setStatus(s) {
    SyncClient.status = s;
    const el = global.document && global.document.getElementById('syncStatus');
    if (el) {
      el.textContent = statusLabel(s);
      el.className = 'sync-badge ' + ({
        connected: 'ok', connecting: 'warn', disconnected: 'warn', error: 'err', idle: ''
      }[s] || '');
    }
    log(T('状态：') + statusLabel(s));
  }

  function statusLabel(s) {
    return { idle: T('未连接'), connecting: T('连接中…'), connected: T('已连接'), disconnected: T('已断开（将自动重连）'), error: T('连接错误') }[s] || s;
  }

  function saveCfg() {
    try { global.localStorage.setItem(CFG_KEY, JSON.stringify({ ip: SyncClient.serverIp, port: SyncClient.serverPort, auto: SyncClient.auto })); } catch (e) {}
  }
  function loadCfg() {
    try {
      const c = JSON.parse(global.localStorage.getItem(CFG_KEY) || 'null');
      if (c && c.ip) { SyncClient.serverIp = c.ip; SyncClient.serverPort = c.port || DEFAULT_PORT; SyncClient.auto = c.auto !== false; }
    } catch (e) {}
  }

  // ---------------- 连接管理 ----------------
  SyncClient.connect = function (ip, port) {
    ip = (ip || '').trim();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && ip !== 'localhost') {
      Util.toast(T('请输入有效的服务器 IP 地址（如 192.168.1.100）'), 'err');
      return Promise.reject(new Error('bad ip'));
    }
    SyncClient.serverIp = ip;
    SyncClient.serverPort = Math.max(1, Math.min(65535, Number(port) || DEFAULT_PORT));
    saveCfg();
    SyncClient.stop(true);
    setStatus('connecting');
    return openSocket();
  };

  function openSocket() {
    return new Promise(function (resolve, reject) {
      const url = 'ws://' + SyncClient.serverIp + ':' + SyncClient.serverPort;
      let sock;
      const generation = ++socketGeneration;
      try { sock = new WebSocket(url); } catch (e) { if (generation === socketGeneration) setStatus('error'); reject(e); return; }
      ws = sock;
      const timeout = setTimeout(function () {
        if (sock.readyState === 0) { try { sock.close(); } catch (e) {} }
      }, 5000);
      sock.onopen = function () {
        clearTimeout(timeout);
        if (generation !== socketGeneration || ws !== sock) { try { sock.close(); } catch (e) {} return; }
        setStatus('connected');
        let token = ''; try { token = localStorage.getItem('iar_api_token_v1') || ''; } catch (e) {}
        send({ type: 'hello', token: token, data: { platform: 'web', client: clientId, ua: navigator.userAgent } });
        Util.toast(T('已连接同步服务器：') + url, 'ok');
        resolve(url);
      };
      sock.onmessage = function (ev) {
        let msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
        SyncClient.handleMessage(msg);
      };
      sock.onclose = function () {
        clearTimeout(timeout);
        const active = generation === socketGeneration && ws === sock;
        if (active) { ws = null; setStatus('disconnected'); scheduleReconnect(); }
        reject(new Error('closed'));
      };
      sock.onerror = function () { clearTimeout(timeout); setStatus('error'); };
    });
  }

  function scheduleReconnect() {
    if (!SyncClient.auto || !SyncClient.serverIp) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(function () {
      if (!SyncClient.auto) return;
      if (ws && ws.readyState === 1) return;
      log(T('尝试重连…'));
      openSocket().catch(function () {});
    }, RECONNECT_MS);
  }

  SyncClient.stop = function (silent) {
    socketGeneration++;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
    if (refreshReloadTimer) { clearTimeout(refreshReloadTimer); refreshReloadTimer = null; }
    if (ws) {
      try { ws.onclose = null; ws.onmessage = null; ws.close(); } catch (e) {}
      ws = null;
    }
    setStatus('idle');
    if (!silent) log(T('已停止同步'));
  };

  SyncClient.disconnect = function () {
    SyncClient.auto = false; saveCfg();
    SyncClient.stop();
  };

  SyncClient.autoConnect = function () {
    loadCfg();
    if (!SyncClient.serverIp || !SyncClient.auto) return;
    if (Storage.mode !== 'idb') return; // http 模式由桌面端负责
    log(T('自动连接：') + SyncClient.serverIp + ':' + SyncClient.serverPort);
    setStatus('connecting');
    openSocket().catch(function () {});
  };

  function send(msg) {
    if (!ws || ws.readyState !== 1) return false;
    try {
      ws.send(JSON.stringify(Object.assign({ source: clientId, timestamp: Date.now() }, msg)));
      return true;
    } catch (e) { return false; }
  }

  /** 广播本地变更（仅 idb 模式且已连接） */
  SyncClient.broadcast = function (change) {
    if (suppress) return false;
    if (Storage.mode !== 'idb') return false;
    return send(change);
  };

  SyncClient.requestFullSync = function (opts) {
    opts = opts || {};
    // SUP-007：增量同步——若上次同步过且有 since 时间戳，则请求增量
    const since = opts.since != null ? opts.since : SyncClient.lastSyncAt;
    const msg = { type: 'full-sync-req' };
    if (since > 0) msg.since = since;
    // SUP-034：选择性同步——携带 select 时仅从服务器拉取选中的供应商/问卷
    if (opts.select && (opts.select.facilities || opts.select.questionnaires)) msg.select = opts.select;
    if (send(msg)) {
      if (msg.select) log(T('已请求选择性同步（选中供应商与问卷）…'));
      else log(since > 0 ? T('已请求增量同步…') : T('已请求全量同步…'));
      Util.toast(msg.select ? T('已发送选择性同步请求') : (since > 0 ? T('已发送增量同步请求') : T('已发送全量同步请求')), 'ok');
    } else Util.toast(T('尚未连接服务器'), 'err');
  };

  // ---------------- 远程消息处理（供冒烟测试直接调用） ----------------
  SyncClient.handleMessage = function (msg) {
    if (!msg || !msg.type) return;
    if (msg.type === 'full-sync-resp') {
      syncQueue = syncQueue.then(function () { return handleFullSync(msg); }).catch(function (e) { Util.toast(T('同步失败：') + (e && e.message || e), 'err'); });
      return;
    }
    if (msg.type === 'hello') { log(T('收到握手：') + (msg.source || '?')); return; }
    // 增量变更
    const p = applyChange(msg);
    if (p) {
      p.then(function () {
        log(T('已应用远程变更：') + msg.type + ' ' + (msg.key || msg.ns || ''));
        scheduleRefresh();
      }).catch(function (e) { log(T('应用远程变更失败：') + (e && e.message || e)); });
    }
  };

  function handleFullSync(msg) {
    const d = msg.data || {};
    const kvN = Object.keys(d.kv || {}).length;
    const blobNs = Object.keys(d.blobs || {});
    const blobN = blobNs.reduce((s, ns) => s + Object.keys(d.blobs[ns] || {}).length, 0);
    log(T('收到数据：') + kvN + ' kv / ' + blobN + ' blob / ' + (d.users || []).length + ' users' + (msg.delta ? T('（增量）') : T('（全量）')));
    suppress = true; suppressDepth++;
    return applyFullData(d).then(function () {
      if (msg.delta) SyncClient.lastSyncAt = Math.max(SyncClient.lastSyncAt || 0, Number(msg.timestamp || 0), Date.now());
      else SyncClient.lastSyncAt = Date.now();
      Util.toast(d.partial ? T('选择性同步完成，数据已写入当前设备') : T('同步完成，数据已写入当前设备'), 'ok');
      scheduleRefresh(200);
    }).finally(function () {
      suppressDepth = Math.max(0, suppressDepth - 1); suppress = suppressDepth > 0;
    });
  }

  function applyChange(msg) {
    suppress = true; suppressDepth++;
    let p = null;
    try {
      if (msg.type === 'kv-put' && msg.key) {
        p = Storage.kvGet(msg.key).then(function (cur) { if (msg.data && cur && !newer(msg.data, cur, msg)) { conflictLog.unshift({ type: msg.type, key: msg.key, at: Date.now(), local: cur, remote: msg.data }); return; } return Storage.kvPut(msg.key, msg.data); });
      } else if (msg.type === 'kv-delete' && msg.key) {
        // 仅删除指定 KV，禁止远程单键删除清空整个本地 KV 域。
        p = Storage.kvGet(msg.key).then(function () {
          if (typeof Storage.kvDelete === 'function') return Storage.kvDelete(msg.key);
          return Storage.kvPut(msg.key, undefined);
        });
      } else if (msg.type === 'blob-put' && msg.ns && msg.key) {
        p = Storage.get(msg.ns, msg.key).then(function (cur) { if (cur && !newer(msg.data, cur, msg)) { conflictLog.unshift({ type: msg.type, ns: msg.ns, key: msg.key, at: Date.now(), local: cur, remote: msg.data }); return; } return Storage.put(msg.ns, msg.data); });
      } else if (msg.type === 'blob-delete' && msg.ns && msg.key) p = Storage.del(msg.ns, msg.key);
      else if (msg.type === 'users-put') p = applyUsers(msg.data || []);
    } finally {
      if (p && typeof p.finally === 'function') p.finally(function () { suppressDepth = Math.max(0, suppressDepth - 1); suppress = suppressDepth > 0; });
      else { suppressDepth = Math.max(0, suppressDepth - 1); suppress = suppressDepth > 0; }
    }
    return p;
  }

  function applyUsers(arr) {
    return Storage.getUsers().then(function (cur) {
      const curIds = (cur || []).map(function (u) { return u.id; });
      const newIds = arr.map(function (u) { return u.id; });
      const dels = curIds.filter(function (id) { return newIds.indexOf(id) < 0; })
        .map(function (id) { return Storage.delUser(id); });
      const puts = arr.map(function (u) { return Storage.putUser(u); });
      return Promise.all(dels.concat(puts));
    });
  }

  function applyFullData(data) {
    if (!data) return Promise.resolve();
    // SUP-034：选择性同步（partial）——只合并选中的供应商/问卷，不覆盖本地其它数据
    if (data.partial === true) return applyPartial(data);
    const jobs = [];
    if (data.kv) Object.keys(data.kv).forEach(function (k) { jobs.push(Storage.kvPut(k, data.kv[k])); });
    if (data.blobs) Object.keys(data.blobs).forEach(function (ns) {
      const items = data.blobs[ns] || {};
      Object.keys(items).forEach(function (id) { jobs.push(Storage.put(ns, items[id])); });
    });
    if (data.users) jobs.push(applyUsers(data.users));
    return Promise.all(jobs);
  }

  // SUP-034：选择性合并。data.kv.main 含 { settings, facilities[], questionnaires[], assessments[] }。
  // 仅将传入的供应商/问卷/评估合并进本地 DB.state，其余保持不动。
  // 注意：所有字段合并需基于同一次读取的最新 state 一次性写入，避免并行 get/put 竞态。
  function applyPartial(data) {
    const main = data && data.kv && data.kv.main;
    if (!main) return Promise.resolve();
    return Storage.kvGet('main').then(function (cur) {
      const st = Object.assign({}, cur || {});
      // 合并 settings（覆盖缺失键，不回退）
      if (main.settings) st.settings = Object.assign({}, (cur && cur.settings) || {}, main.settings);
      // 供应商：按 id 覆盖/新增
      const facs = (st.facilities || []).slice();
      (main.facilities || []).forEach(function (f) {
        const i = facs.findIndex(function (x) { return x && String(x.id) === String(f.id); });
        if (i >= 0) facs[i] = f; else facs.push(f);
      });
      st.facilities = facs;
      // 问卷：按 id 覆盖/新增
      const qs = (st.questionnaires || []).slice();
      (main.questionnaires || []).forEach(function (q) {
        const i = qs.findIndex(function (x) { return x && String(x.id) === String(q.id); });
        if (i >= 0) qs[i] = q; else qs.push(q);
      });
      st.questionnaires = qs;
      // 关联评估：合并
      const as = (st.assessments || []).slice();
      (main.assessments || []).forEach(function (a) {
        const i = as.findIndex(function (x) { return x && String(x.id) === String(a.id); });
        if (i >= 0) as[i] = a; else as.push(a);
      });
      st.assessments = as;
      return Storage.kvPut('main', st);
    });
  }

  // 双向同步完成后只重绘当前视图，保持用户上下文，不触发整页 reload。
  SyncClient.refreshNow = function () {
    try { if (global.App && typeof global.App.refresh === 'function') { global.App.refresh(); return true; } } catch (e) {}
    return false;
  };

  // 应用远程数据后防抖刷新（内存态 DB.state 需重载）
  // _reload 独立成方法：便于测试桩替换（jsdom 的 location.reload 不可重定义）
  SyncClient._reload = function () { global.location.reload(); };
  function scheduleRefresh(delay) {
    if (refreshTimer) clearTimeout(refreshTimer);
    if (refreshReloadTimer) clearTimeout(refreshReloadTimer);
    refreshTimer = setTimeout(function () {
      refreshTimer = null;
      try { Util.toast(T('收到远程数据，正在更新当前页面'), 'ok'); } catch (e) {}
      // 优先只重绘当前视图，避免 Android location.reload() 回到移动首页并造成闪回。
      try { if (global.App && typeof global.App.refresh === 'function') { global.App.refresh(); return; } } catch (e) {}
      refreshReloadTimer = setTimeout(function () { refreshReloadTimer = null; SyncClient._reload(); }, 600);
    }, delay || REFRESH_DEBOUNCE);
  }

  // ---------------- Storage 拦截（本地写入 → 广播） ----------------
  function patchStorage() {
    if (Storage.__syncPatched) return;
    Storage.__syncPatched = true;
    const _kvPut = Storage.kvPut;
    Storage.kvPut = function (key, val) {
      return _kvPut(key, val).then(function (r) {
        if (!suppress && Storage.mode === 'idb') { const stamped = Object.assign({}, val, { _sync: Object.assign({}, val && val._sync || {}, { updatedAt: Date.now(), updatedBy: clientId }) }); send({ type: 'kv-put', key: key, data: stamped }); }
        return r;
      });
    };
    const _kvClear = Storage.kvClear;
    Storage.kvClear = function () {
      return _kvClear().then(function (r) {
        if (!suppress && Storage.mode === 'idb') send({ type: 'kv-delete', key: 'main' });
        return r;
      });
    };
    const _put = Storage.put;
    Storage.put = function (ns, item) {
      return _put(ns, item).then(function (r) {
        if (!suppress && Storage.mode === 'idb' && item && item.id) { const stamped = Object.assign({}, item, { _sync: Object.assign({}, item._sync || {}, { updatedAt: Date.now(), updatedBy: clientId }) }); send({ type: 'blob-put', ns: ns, key: item.id, data: stamped }); }
        return r;
      });
    };
    const _del = Storage.del;
    Storage.del = function (ns, id) {
      return _del(ns, id).then(function (r) {
        if (!suppress && Storage.mode === 'idb') send({ type: 'blob-delete', ns: ns, key: id });
        return r;
      });
    };
    const _putUser = Storage.putUser;
    Storage.putUser = function (u) {
      return _putUser(u).then(function (r) {
        if (!suppress && Storage.mode === 'idb') Storage.getUsers().then(function (arr) { send({ type: 'users-put', data: arr || [] }); });
        return r;
      });
    };
    const _delUser = Storage.delUser;
    Storage.delUser = function (id) {
      return _delUser(id).then(function (r) {
        if (!suppress && Storage.mode === 'idb') Storage.getUsers().then(function (arr) { send({ type: 'users-put', data: arr || [] }); });
        return r;
      });
    };
  }
  patchStorage();

  // ---------------- 界面 ----------------
  SyncClient.render = function (container) {
    container = container || global.document.getElementById('content');
    container.innerHTML = '';
    const isAndroid = Util.isAndroidApp();
    container.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: isAndroid ? T('数据同步') : T('局域网同步') }),
        Util.el('div', { class: 'muted', text: isAndroid
          ? T('通过局域网（同一 WiFi / 热点）或 USB 数据线（网络共享）与 PC 端互相同步问卷与照片数据，全程本地、不依赖互联网。')
          : T('与同一 WiFi 局域网内的桌面版 / 其他设备实时同步数据，全程不依赖互联网。') })
      ])
    ]));

    // SUP-029：安卓端连接通道提示卡（局域网 / USB）
    if (isAndroid) {
      const chan = Util.el('div', { class: 'sync-channel-card' }, [
        Util.el('div', { class: 'sync-channel-title', text: T('连接方式') }),
        Util.el('div', { class: 'sync-channel-row' }, [
          Util.el('span', { class: 'sync-channel-tag ok', text: T('局域网') }),
          Util.el('span', { class: 'muted', text: T('手机与 PC 连同一 WiFi，或开热点让 PC 连接，填入 PC 的 IP 即可。') })
        ]),
        Util.el('div', { class: 'sync-channel-row' }, [
          Util.el('span', { class: 'sync-channel-tag', text: 'USB' }),
          Util.el('span', { class: 'muted', text: T('用数据线连接 PC 并开启「USB 网络共享」，手机即可通过 USB 链路访问 PC 的 18080 端口（即 USB TCP 同步）。') })
        ]),
        Util.el('div', { class: 'sync-channel-row' }, [
          Util.el('span', { class: 'sync-channel-tag', text: 'USB+ADB' }),
          Util.el('span', { class: 'muted', text: T('开启 USB 调试后，在 PC 端执行 adb reverse tcp:18080 tcp:18080，手机填 IP 127.0.0.1、端口 18080 即可经 USB 直连 PC。') })
        ]),
        // SUP-032：蓝牙通道指引（蓝牙共享网络后复用同一 18080 协议）
        Util.el('div', { class: 'sync-channel-row' }, [
          Util.el('span', { class: 'sync-channel-tag', text: '蓝牙' }),
          Util.el('span', { class: 'muted', text: T('手机与 PC 蓝牙配对后，在手机「网络共享」开启「通过蓝牙共享网络」，即可复用同一协议与 PC 同步。') })
        ]),
        // SUP-032：照片实时同步说明
        Util.el('div', { class: 'sync-channel-row' }, [
          Util.el('span', { class: 'sync-channel-tag ok', text: T('照片实时') }),
          Util.el('span', { class: 'muted', text: T('连接后，手机拍摄/上传的照片会实时同步到 PC 端并自动刷新显示。') })
        ]),
        Util.el('div', { class: 'tip', style: 'margin-top:8px', text: T('局域网 / USB / 蓝牙共享均走同一同步协议（端口 18080），只需保证手机能访问到 PC 的该端口。') })
      ]);
      container.appendChild(chan);
    }

    if (Storage.mode !== 'idb') {
      const p = Util.el('div', { class: 'panel card' });
      p.appendChild(Util.el('div', { class: 'tip', text: T('当前运行在内置后端（JSON 文件）模式，同步由桌面版「局域网同步设置」统一管理，本页面无需操作。') }));
      container.appendChild(p);
      return;
    }

    const panel = Util.el('div', { class: 'panel card' });
    // 状态行
    panel.appendChild(Util.el('div', { class: 'sync-status-row' }, [
      Util.el('span', { class: 'muted', text: T('同步状态') }),
      Util.el('span', { id: 'syncStatus', class: 'sync-badge ' + (SyncClient.status === 'connected' ? 'ok' : ''), text: statusLabel(SyncClient.status) })
    ]));

    // 连接表单
    const ipI = Util.el('input', { type: 'text', class: 'inp', value: SyncClient.serverIp, placeholder: '192.168.1.100', inputmode: 'decimal' });
    ipI.id = 'syncIp';
    const portI = Util.el('input', { type: 'number', class: 'inp', value: SyncClient.serverPort, min: 1, max: 65535, style: 'width:110px' });
    portI.id = 'syncPort';
    const autoC = Util.el('input', { type: 'checkbox', checked: SyncClient.auto });
    autoC.addEventListener('change', function () { SyncClient.auto = autoC.checked; saveCfg(); });
    panel.appendChild(Util.el('div', { class: 'row', style: 'margin-top:10px' }, [
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('服务器 IP（桌面版本机局域网地址）') }), ipI]),
      Util.el('label', { class: 'fld', style: 'max-width:130px' }, [Util.el('span', { class: 'lbl', text: T('端口') }), portI])
    ]));
    panel.appendChild(Util.el('label', { class: 'sync-auto' }, [autoC, Util.el('span', { style: 'margin-left:6px', text: T('断开后自动重连（应用启动时自动连接）') })]));

    const btnRow = Util.el('div', { class: 'btn-row', style: 'margin-top:12px;flex-wrap:wrap' });
    btnRow.appendChild(Util.el('button', { class: 'btn btn-primary', onclick: function () { SyncClient.connect(ipI.value, parseInt(portI.value, 10) || DEFAULT_PORT); } }, T('连接')));
    btnRow.appendChild(Util.el('button', { class: 'btn', onclick: function () { SyncClient.requestFullSync(); } }, T('立即全量同步')));
    btnRow.appendChild(Util.el('button', { class: 'btn', onclick: function () { SyncClient.requestFullSync({ since: SyncClient.lastSyncAt }); } }, T('增量同步')));
    btnRow.appendChild(Util.el('button', { class: 'btn', onclick: function () { SyncClient.disconnect(); } }, T('断开')));
    panel.appendChild(btnRow);

    // SUP-034：选择性同步——仅同步 PC 端选中的供应商与问卷（安卓端配置并触发）
    if (isAndroid) {
      const selPanel = Util.el('div', { class: 'panel card', style: 'margin-top:12px' });
      selPanel.appendChild(Util.el('div', { class: 'lbl', style: 'font-weight:600;margin-bottom:6px', text: T('选择性同步（从 PC 拉取指定供应商与问卷）') }));
      selPanel.appendChild(Util.el('div', { class: 'muted', style: 'font-size:12px;margin-bottom:8px', text: T('勾选要从 PC 端同步到本机的供应商与已保存问卷，点击下方按钮开始。仅这些数据会被更新，不影响本机其它数据。') }));
      // 供应商选择
      const facSel = Util.el('select', { class: 'input', multiple: true, style: 'width:100%;min-height:90px;margin-bottom:8px' });
      const qSel = Util.el('select', { class: 'input', multiple: true, style: 'width:100%;min-height:90px' });
      // 填充选项（数据由 PC 端 full-sync 提供的 select 列表；此处展示本地已知列表供用户勾选 id）
      function fillOptions() {
        facSel.innerHTML = '';
        qSel.innerHTML = '';
        var s = null;
        try { if (global.DB && DB.get) s = DB.get(); } catch (e) {}
        (s && s.facilities || []).forEach(function (f) {
          facSel.appendChild(Util.el('option', { value: f.id }, f.name || (f.code || f.id)));
        });
        (s && s.questionnaires || []).forEach(function (q) {
          qSel.appendChild(Util.el('option', { value: q.id }, q.title || q.name || q.id));
        });
      }
      try { fillOptions(); } catch (e) {}
      selPanel.appendChild(Util.el('label', { class: 'lbl', text: T('选择供应商') }));
      selPanel.appendChild(facSel);
      selPanel.appendChild(Util.el('label', { class: 'lbl', style: 'margin-top:6px', text: T('选择问卷') }));
      selPanel.appendChild(qSel);
      const selBtn = Util.el('button', { class: 'btn btn-primary', style: 'margin-top:10px;width:100%', text: T('同步选中的供应商与问卷') });
      selBtn.onclick = function () {
        const facIds = Array.prototype.slice.call(facSel.selectedOptions || []).map(function (o) { return o.value; });
        const qIds = Array.prototype.slice.call(qSel.selectedOptions || []).map(function (o) { return o.value; });
        if (!facIds.length && !qIds.length) { Util.toast(T('请先选择供应商或问卷'), 'err'); return; }
        SyncClient.requestFullSync({ select: { facilities: facIds, questionnaires: qIds } });
      };
      selPanel.appendChild(selBtn);
      panel.appendChild(selPanel);
    }

    panel.appendChild(Util.el('div', { class: 'tip', style: 'margin-top:10px', text: T('使用方法：在桌面版「设置 → 局域网同步」中启动服务器模式，将显示的本机 IP 填入上方；两台设备连同一 WiFi 即可实时互相同步。') }));

    // 日志
    panel.appendChild(Util.el('div', { class: 'lbl', style: 'margin-top:12px', text: T('同步日志') }));
    panel.appendChild(Util.el('pre', { id: 'syncLog', class: 'sync-log' }, global.document.createTextNode(SyncClient.logs.join('\n'))));
    container.appendChild(panel);
  };

  global.SyncClient = SyncClient;
})(window);

/* ===== src/js/pwa.js ===== */
/* ============================================================================
 * PWA 模块（pwa.js）—— 命名空间 window.PWA
 * ----------------------------------------------------------------------------
 * 纯增量模块：不改动任何既有功能页面，自启动（DOMContentLoaded）。
 * 能力：
 *   1. 可安装性：捕获 beforeinstallprompt，侧栏注入"安装应用"入口，自定义安装引导
 *   2. 本地通知：Notification 权限引导 + PWA.notify()（优先经 Service Worker
 *      showNotification 发出，页面在后台也能送达；不支持时降级 new Notification）
 *   3. 后台同步：PWA.registerSync() 注册 Background Sync（tag: spp-sync-data），
 *      不支持的浏览器降级为 window 'online' 事件；同步触发时驱动 SyncClient 增量同步
 *   4. 同步结果通知：包装 SyncClient.handleMessage（运行时包装，不改源文件），
 *      增量/全量同步完成时发出系统通知
 * ==========================================================================*/
(function (g) {
  'use strict';

  const PWA = {};
  g.PWA = PWA;

  const SYNC_TAG = 'spp-sync-data';
  let deferredInstallPrompt = null;
  let swRegistration = null;

  function T2(s) { return (typeof g.T === 'function') ? g.T(s) : s; }
  function isSecure() {
    return g.Storage && g.Storage.supports ? !!g.Storage.supports.secure
      : (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname));
  }

  /* ==================== 1. 可安装性 ==================== */

  g.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();                          // 阻止浏览器默认迷你信息条
    deferredInstallPrompt = e;
    showInstallEntry();
  });

  g.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    removeInstallEntry();
    if (g.Util && Util.toast) Util.toast(T2('应用已安装到设备'), 'ok');
    PWA.notify(T2('安装完成'), T2('供应商预审平台已安装，可从主屏幕直接启动。'), { tag: 'pwa-installed' });
  });

  /** 当前是否已以独立窗口（已安装）模式运行 */
  PWA.isInstalled = function () {
    return g.matchMedia('(display-mode: standalone)').matches
        || g.matchMedia('(display-mode: minimal-ui)').matches
        || g.navigator.standalone === true;      // iOS Safari
  };

  function showInstallEntry() {
    if (PWA.isInstalled() || document.getElementById('pwaInstallBtn')) return;
    const foot = document.querySelector('.sidebar-foot');
    if (!foot) return;
    const btn = document.createElement('button');
    btn.id = 'pwaInstallBtn';
    btn.className = 'pwa-install-btn';
    btn.type = 'button';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/></svg><span>' + T2('安装应用') + '</span>';
    btn.addEventListener('click', promptInstall);
    foot.insertBefore(btn, foot.firstChild);
  }

  function removeInstallEntry() {
    const btn = document.getElementById('pwaInstallBtn');
    if (btn) btn.remove();
  }

  function promptInstall() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choice) => {
      if (choice.outcome !== 'accepted' && g.Util && Util.toast) {
        Util.toast(T2('已取消安装，可稍后再次从侧栏安装'), 'warn');
      }
      deferredInstallPrompt = null;
      removeInstallEntry();
    });
  }

  /* ==================== 2. 本地通知 ==================== */

  PWA.notificationsSupported = function () {
    return 'Notification' in g && isSecure();
  };

  PWA.notificationPermission = function () {
    return PWA.notificationsSupported() ? Notification.permission : 'unsupported';
  };

  /** 请求通知权限（须由用户手势触发；返回 Promise<permission>） */
  PWA.requestNotificationPermission = function () {
    if (!PWA.notificationsSupported()) return Promise.resolve('unsupported');
    if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
    return Notification.requestPermission();
  };

  /**
   * 发送本地系统通知。
   * 优先经 Service Worker registration.showNotification（页面在后台/最小化时仍可送达），
   * 降级为 new Notification；权限不足时静默降级为 Util.toast。
   */
  PWA.notify = function (title, body, opts) {
    opts = opts || {};
    if (!PWA.notificationsSupported() || Notification.permission !== 'granted') {
      if (g.Util && Util.toast && !opts.silent) Util.toast(title + (body ? '：' + body : ''), 'ok');
      return Promise.resolve(false);
    }
    const payload = {
      body: body || '',
      icon: 'pwa/icons/icon-192x192.png',
      badge: 'pwa/icons/icon-192x192.png',
      tag: opts.tag || 'spp-local-' + Date.now(),
      data: { url: opts.url || 'index.html' }
    };
    if (swRegistration && swRegistration.showNotification) {
      return swRegistration.showNotification(title, payload).then(() => true).catch(() => fallbackNotify(title, payload));
    }
    return Promise.resolve(fallbackNotify(title, payload));
  };

  function fallbackNotify(title, payload) {
    try {
      const n = new Notification(title, payload);
      n.onclick = () => { g.focus(); n.close(); };
      return true;
    } catch (e) { return false; }
  }

  /* ==================== 3. 后台同步 ==================== */

  PWA.backgroundSyncSupported = function () {
    return !!(swRegistration && 'sync' in swRegistration);
  };

  /**
   * 注册一次后台同步：网络恢复时由 Service Worker 触发 'sw-sync-request'，
   * 页面收到后执行 SyncClient 增量同步。浏览器不支持时返回 false，
   * 调用方依赖下方的 'online' 事件兜底（两种路径都会汇聚到 runPendingSync）。
   */
  PWA.registerSync = function () {
    if (!PWA.backgroundSyncSupported()) return Promise.resolve(false);
    return swRegistration.sync.register(SYNC_TAG).then(() => true).catch(() => false);
  };
  PWA.prepareOfflineExports = function () {
    if (!swRegistration || !navigator.serviceWorker.controller) return Promise.resolve({ ok: false, reason: 'service-worker-unavailable' });
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => resolve({ ok: false, reason: 'timeout' }), 20000);
      channel.port1.onmessage = (e) => { clearTimeout(timer); const results = (e.data && e.data.results) || []; resolve({ ok: results.every((x) => x.ok), results: results }); };
      navigator.serviceWorker.controller.postMessage({ type: 'PRECACHE_EXPORT_LIBS' }, [channel.port2]);
    });
  };

  /** 数据变更后调用：已连接立即广播；未连接登记后台同步，网络恢复自动补同步 */
  PWA.scheduleSyncAfterChange = function () {
    const connected = g.SyncClient && SyncClient.status === 'connected';
    if (connected) return;                       // SyncClient.broadcast 已实时处理
    PWA.registerSync();
  };

  function runPendingSync(source) {
    if (!g.SyncClient) return;
    if (SyncClient.status === 'connected') {
      SyncClient.requestFullSync({});
      return;
    }
    // 未连接局域网服务器：仅记录，待用户在同步页手动连接后自然完成全量/增量同步
    if (g.Util && Util.toast && source === 'online') {
      Util.toast(T2('网络已恢复，如需同步数据请进入"局域网同步"'), 'ok');
    }
  }

  // SW 通过 postMessage 转发 Background Sync 事件
  if ('serviceWorker' in g.navigator) {
    g.navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'sw-sync-request') runPendingSync('background-sync');
    });
  }

  // 兜底：不支持 Background Sync 的浏览器，网络恢复事件驱动
  g.addEventListener('online', () => {
    runPendingSync('online');
  });

  /* ==================== 4. 同步结果通知（运行时包装，不改 sync-client.js） ==================== */

  function hookSyncClient() {
    if (!g.SyncClient || !SyncClient.handleMessage || SyncClient.__pwaHooked) return;
    g.addEventListener('iar-auth-expired', () => { try { localStorage.removeItem('iar_session_v1'); } catch (e) {} if (g.Util && Util.toast) Util.toast(T2('登录令牌已过期，请重新登录'), 'warn'); });
    const original = SyncClient.handleMessage.bind(SyncClient);
    SyncClient.handleMessage = function (msg) {
      if (msg && msg.type === 'full-sync-resp') {
        const d = msg.data || {};
        const partial = d.partial === true;
        PWA.notify(
          partial ? T2('选择性同步完成') : T2('数据同步完成'),
          partial ? T2('选中的供应商与问卷已更新到本机。') : T2('审核数据已与服务器完成同步。'),
          { tag: 'sync-done', silent: false }
        );
      }
      return original(msg);
    };
    SyncClient.__pwaHooked = true;
  }

  /* ==================== 初始化 ==================== */

  function init() {
    if (!('serviceWorker' in navigator) || !isSecure()) return;

    // 获取已注册的 SW（注册动作由 app.js 既有逻辑完成，这里只取句柄）
    navigator.serviceWorker.ready.then((reg) => {
      swRegistration = reg;
      // 发现等待中的新版本：提示用户刷新升级
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller && g.Util && Util.toast) {
            Util.toast(T2('新版本已就绪，刷新页面即可升级'), 'ok');
          }
        });
      });
      // 已安装且从未询问过通知权限：安装成功后引导授权
      if (PWA.isInstalled() && PWA.notificationPermission() === 'default') {
        showNotifyGuide();
      }
    });

    hookSyncClient();
    if (!PWA.isInstalled() && !deferredInstallPrompt) showInstallHint();
  }

  /** 未捕获到 beforeinstallprompt（iOS/已触发过）时的手动安装提示入口 */
  function showInstallHint() {
    if (document.getElementById('pwaInstallBtn')) return;
    const foot = document.querySelector('.sidebar-foot');
    if (!foot || PWA.isInstalled()) return;
    const btn = document.createElement('button');
    btn.id = 'pwaInstallBtn';
    btn.className = 'pwa-install-btn';
    btn.type = 'button';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/></svg><span>' + T2('安装应用') + '</span>';
    btn.addEventListener('click', () => {
      if (deferredInstallPrompt) { promptInstall(); return; }
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (g.Util && Util.toast) {
        Util.toast(isIOS
          ? T2('请点击 Safari"分享"按钮，选择"添加到主屏幕"')
          : T2('请点击浏览器地址栏右侧的"安装"图标'), 'ok');
      }
    });
    foot.insertBefore(btn, foot.firstChild);
    const offlineBtn = document.createElement('button');
    offlineBtn.id = 'pwaOfflineExportsBtn'; offlineBtn.className = 'pwa-install-btn'; offlineBtn.type = 'button';
    offlineBtn.innerHTML = '<span>' + T2('准备离线导出') + '</span>';
    offlineBtn.addEventListener('click', () => {
      if (g.Util && Util.toast) Util.toast(T2('正在准备 Excel、PDF 和图片导出资源…'), 'ok');
      PWA.prepareOfflineExports().then((r) => Util.toast(r.ok ? T2('离线导出资源已准备完成') : T2('部分资源未缓存，请保持联网后重试'), r.ok ? 'ok' : 'warn'));
    });
    foot.insertBefore(offlineBtn, btn.nextSibling);
  }

  /** 通知权限引导条（已安装场景下仅显示一次） */
  function showNotifyGuide() {
    if (document.getElementById('pwaNotifyGuide')) return;
    if (g.localStorage && localStorage.getItem('pwa.notifyGuide.dismissed') === '1') return;
    const bar = document.createElement('div');
    bar.id = 'pwaNotifyGuide';
    bar.className = 'pwa-notify-guide';
    bar.innerHTML = '<span>' + T2('开启通知后，同步完成与审核提醒将及时送达') + '</span>';
    const allow = document.createElement('button');
    allow.type = 'button';
    allow.className = 'pwa-guide-allow';
    allow.textContent = T2('开启通知');
    allow.addEventListener('click', () => {
      PWA.requestNotificationPermission().then((p) => {
        if (p === 'granted') PWA.notify(T2('通知已开启'), T2('审核与同步消息将通过系统通知送达。'), { tag: 'notify-on' });
        bar.remove();
      });
    });
    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'pwa-guide-later';
    later.textContent = T2('暂不');
    later.addEventListener('click', () => {
      try { localStorage.setItem('pwa.notifyGuide.dismissed', '1'); } catch (e) { /* 隐私模式 */ }
      bar.remove();
    });
    bar.appendChild(allow);
    bar.appendChild(later);
    document.body.appendChild(bar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);

/* ===== src/js/responsive.js ===== */
/* 响应式布局增强模块
 * 职责：
 *   1. 防抖 window resize：更新字体/面板 CSS 变量，避免频繁布局计算。
 * 说明（SUP-010）：
 *   - 已取消用户自由拖拽模块宽度的功能（原侧边栏宽度拖拽 + 操作分栏面板拖拽），
 *     模块宽度由 CSS 自适应决定，保证布局稳定统一，避免误拖拽破坏排版。
 * 设计：
 *   - 纯增强，不改动既有业务逻辑；App.init 时调用 Responsive.init() 即可。
 *   - 样式与逻辑分离：CSS 变量驱动渲染，JS 只负责计算与写变量。
 */
(function (global) {
  const Responsive = {};

  // ---------------- 防抖 window resize → CSS 变量 ----------------
  // 更新字号/面板相关变量；纯 CSS 已处理大部分，此处仅更新全局字号基准。
  function applyViewportVars() {
    const w = global.innerWidth || document.documentElement.clientWidth || 0;
    // 字号基准：随窗口宽度平滑缩放，但限制在 13-16px（保留可读性与用户缩放能力）
    const fs = Math.max(13, Math.min(16, 14 + (w - 1024) * 0.001));
    document.documentElement.style.setProperty('--fs-responsive', fs.toFixed(1) + 'px');
  }
  function initViewportResize() {
    applyViewportVars();
    const debounced = (Util && Util.debounce) ? Util.debounce(applyViewportVars, 150) : applyViewportVars;
    global.addEventListener('resize', debounced);
    global.addEventListener('orientationchange', debounced);
  }

  // ---------------- 初始化 ----------------
  Responsive.init = function () {
    try { initViewportResize(); } catch (e) { console.warn('responsive viewport init', e); }
  };

  // 暴露给冒烟测试
  Responsive._private = {
    applyViewportVars: applyViewportVars
  };

  global.Responsive = Responsive;
})(window);

/* ===== src/js/auth.js ===== */
/* 本地用户认证与权限（纯前端离线方案）
 * - 用户账户存于 IndexedDB 的 users 仓库，密码以 随机盐 + SHA-256 哈希存储
 * - 采用纯 JS 实现的 SHA-256，兼容 file:// 直接打开（无 crypto.subtle 的安全上下文限制）
 * 说明：本应用为本地离线工具，认证仅用于区分T("普通用户 / 管理员")与多账户隔离，
 *       并非服务端级安全；数据仅存于本机浏览器。
 */
(function (global) {
  const Auth = {};
  const SESSION_KEY = 'iar_session_v1';
  let current = null; // 当前登录用户（内存态）

  // ---------------- 纯 JS SHA-256 ----------------
  function rrot(x, n) { return (x >>> n) | (x << (32 - n)); }
  function utf8(str) {
    if (global.TextEncoder) { try { return new TextEncoder().encode(str); } catch (e) {} }
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
    return new Uint8Array(out);
  }
  const K256 = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);
  function sha256hex(msgStr) {
    const msg = utf8(msgStr);
    const l = msg.length;
    const bitLen = l * 8;
    const withOne = l + 1;
    const k = (56 - (withOne % 64) + 64) % 64;
    const total = withOne + k + 8;
    const m = new Uint8Array(total);
    m.set(msg);
    m[l] = 0x80;
    const dv = new DataView(m.buffer);
    dv.setUint32(total - 4, bitLen >>> 0);
    dv.setUint32(total - 8, Math.floor(bitLen / 0x100000000));
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const w = new Uint32Array(64);
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rrot(w[i - 15], 7) ^ rrot(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rrot(w[i - 2], 17) ^ rrot(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let i = 0; i < 64; i++) {
        const S1 = rrot(e, 6) ^ rrot(e, 11) ^ rrot(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K256[i] + w[i]) | 0;
        const S0 = rrot(a, 2) ^ rrot(a, 13) ^ rrot(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return Array.from(H).map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }
  function genSalt() {
    const bytes = new Uint8Array(16);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(bytes);
    else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function hashPassword(pwd, salt) { return sha256hex(salt + ':' + pwd); }

  function persistSession(uid) { try { global.localStorage.setItem(SESSION_KEY, uid); } catch (e) {} }
  function readSession() { try { return global.localStorage.getItem(SESSION_KEY); } catch (e) { return null; } }
  function clearSession() { try { global.localStorage.removeItem(SESSION_KEY); } catch (e) {} }
  function isHttpMode() { return global.Storage && global.Storage.mode === 'http'; }
  function finishLogin(u) { current = u; persistSession(u.id); return u; }

  // ---------------- 初始化 / 三态判定 ----------------
  Auth.init = function () {
    if (isHttpMode() && Storage.apiMe && Storage.apiStatus) {
      if (readSession()) return Storage.apiMe().then((r) => finishLogin(r.user)).then(() => ({ phase: 'app' })).catch(() => ({ phase: 'login' }));
      return Storage.apiStatus().then((r) => ({ phase: r && r.hasUsers ? 'login' : 'setup' })).catch(() => ({ phase: 'login' }));
    }
    return DB.getUsers().then((users) => {
      if (!users || !users.length) return { phase: 'setup' };
      const uid = readSession();
      if (uid) {
        const me = users.find((u) => u.id === uid && u.status !== 'disabled');
        if (me) { current = me; return { phase: 'app' }; }
      }
      return { phase: 'login' };
    });
  };

  // ---------------- 注册 / 登录 ----------------
  // 自注册（登录页"注册新账户"）：第一个账户强制为管理员，其余为普通用户
  Auth.register = function (username, password, displayName) {
    username = (username || '').trim();
    if (!username) return Promise.reject(new Error(I18n.t('login.err.usernameRequired')));
    if (!password || password.length < 6) return Promise.reject(new Error(I18n.t('login.err.passwordTooShort')));
    if (isHttpMode() && Storage.apiRegister) {
      return Storage.apiRegister(username, password, displayName, 'web-' + (global.navigator && navigator.userAgent || '')).then((r) => finishLogin(r.user));
    }
    return DB.getUsers().then((users) => {
      if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) return Promise.reject(new Error(I18n.t('login.err.usernameTaken')));
      const isFirst = !users.length;
      return makeUser(username, password, displayName, isFirst ? 'admin' : 'user', null).then((u) => DB.putUser(u).then(() => finishLogin(u)));
    });
  };
  // 管理员后台新建用户：角色由管理员指定
  Auth.createUser = function (username, password, displayName, role) {
    username = (username || '').trim();
    if (!username) return Promise.reject(new Error(T('用户名不能为空')));
    if (!password || password.length < 6) return Promise.reject(new Error(T('密码长度至少 6 位')));
    if (role !== 'admin' && role !== 'user' && role !== 'buyer' && role !== 'manager') return Promise.reject(new Error(T('角色无效')));
    return DB.getUsers().then((users) => {
      if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) return Promise.reject(new Error(T('该用户名已被使用')));
      return makeUser(username, password, displayName, role, current ? current.id : null).then((u) => DB.putUser(u).then(() => u));
    });
  };
  function makeUser(username, password, displayName, role, createdBy) {
    const salt = genSalt();
    const u = {
      id: Util.uid('u'),
      username: username,
      passwordHash: hashPassword(password, salt),
      salt: salt,
      role: role,
      displayName: (displayName && displayName.trim()) ? displayName.trim() : username,
      status: 'active',
      createdAt: Date.now(),
      createdBy: createdBy || null,
      lastLogin: null
    };
    return Promise.resolve(u);
  }

  Auth.login = function (username, password) {
    username = (username || '').trim();
    if (isHttpMode() && Storage.apiLogin) {
      return Storage.apiLogin(username, password, 'web-' + (global.navigator && navigator.userAgent || '')).then((r) => finishLogin(r.user));
    }
    return DB.getUserByUsername(username).then((u) => {
      if (!u) return Promise.reject(new Error(I18n.t('login.err.badCredentials')));
      if (u.status === 'disabled') return Promise.reject(new Error(I18n.t('login.err.accountDisabled')));
      if (hashPassword(password || '', u.salt) !== u.passwordHash) return Promise.reject(new Error(I18n.t('login.err.badCredentials')));
      u.lastLogin = Date.now();
      return DB.putUser(u).then(() => { current = u; persistSession(u.id); return u; });
    });
  };

  Auth.logout = function () { current = null; clearSession(); };
  Auth.currentUser = function () { return current; };
  Auth.isAdmin = function () { return !!(current && current.role === 'admin'); };
  // OSH 风格权限：admin(管理员) 与 buyer(采购专员) 可编辑；manager(管理层) 与 user(普通用户) 仅查看
  Auth.canEdit = function () { return !!(current && (current.role === 'admin' || current.role === 'buyer')); };
  Auth.roleLabel = function (role) {
    return ({ admin: T('管理员'), buyer: T('采购专员'), manager: T('管理层 · 只读'), user: T('普通用户') })[role] || T('普通用户');
  };

  // ---------------- 管理员操作 ----------------
  Auth.listUsers = function () {
    return DB.getUsers().then((users) => users.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
  };
  Auth.resetPassword = function (id, newPwd) {
    if (!newPwd || newPwd.length < 6) return Promise.reject(new Error(T('新密码长度至少 6 位')));
    return DB.getUserById(id).then((u) => {
      if (!u) return Promise.reject(new Error(T('用户不存在')));
      u.passwordHash = hashPassword(newPwd, u.salt);
      return DB.putUser(u);
    });
  };
  Auth.setRole = function (id, role) {
    if (role !== 'admin' && role !== 'user' && role !== 'buyer' && role !== 'manager') return Promise.reject(new Error(T('角色无效')));
    return DB.getUserById(id).then((u) => {
      if (!u) return Promise.reject(new Error(T('用户不存在')));
      u.role = role;
      return DB.putUser(u);
    });
  };
  Auth.setStatus = function (id, status) {
    return DB.getUserById(id).then((u) => {
      if (!u) return Promise.reject(new Error(T('用户不存在')));
      u.status = status;
      return DB.putUser(u);
    });
  };
  Auth.deleteUser = function (id) {
    if (current && current.id === id) return Promise.reject(new Error(T('不能删除当前登录的账户')));
    return DB.getUsers().then((users) => {
      const target = users.find((u) => u.id === id);
      if (!target) return Promise.reject(new Error(T('用户不存在')));
      const admins = users.filter((u) => u.role === 'admin' && u.status !== 'disabled');
      if (target.role === 'admin' && admins.length <= 1) return Promise.reject(new Error(T('至少需保留一名管理员，无法删除最后一名管理员')));
      return DB.deleteUser(id);
    });
  };

  // ---------------- 登录 / 注册 界面 ----------------
  function field(labelText, inputEl, hintText) {
    const wrap = Util.el('label', { class: 'fld auth-fld' }, [Util.el('span', { class: 'lbl', text: labelText }), inputEl]);
    if (hintText) wrap.appendChild(Util.el('div', { class: 'hint-inline', text: hintText }));
    return wrap;
  }

  // 密码可见切换：包装输入框为 .pwd-field（输入框 + 眼睛按钮）
  // 交互逻辑：默认隐藏（type=password）；点击眼睛或 Alt+V 切换明文；
  // 输入框失焦后自动恢复隐藏，明文状态不跨焦点保留。
  function pwdField(input) {
    const btn = Util.el('button', {
      type: 'button', class: 'pwd-toggle', title: I18n.t('login.pwdToggleHint'),
      'aria-label': I18n.t('login.showPwd'), 'aria-pressed': 'false',
      tabindex: '-1',
      onclick: function (e) { e.preventDefault(); togglePwd(input, btn, input.type !== 'text'); input.focus(); }
    }, null);
    btn.innerHTML = Util.icon('eye');
    input.addEventListener('blur', function () { togglePwd(input, btn, false); });
    const wrap = Util.el('div', { class: 'pwd-field' }, [input, btn]);
    return wrap;
  }
  function togglePwd(input, btn, show) {
    input.type = show ? 'text' : 'password';
    btn.innerHTML = Util.icon(show ? 'eye-off' : 'eye');
    btn.setAttribute('aria-pressed', show ? 'true' : 'false');
    btn.setAttribute('aria-label', I18n.t(show ? 'login.hidePwd' : 'login.showPwd'));
  }
  // Alt+V 快捷键：切换当前聚焦密码框（若聚焦的不是密码框，则切换屏幕上第一个可见密码框）
  if (!Auth._pwdKeyBound) {
    document.addEventListener('keydown', function (e) {
      if (!e.altKey || (e.key !== 'v' && e.key !== 'V')) return;
      const sc = document.getElementById('authScreen');
      if (!sc || sc.style.display === 'none') return;
      const fields = Array.prototype.slice.call(sc.querySelectorAll('.pwd-field input'));
      if (!fields.length) return;
      const active = document.activeElement;
      const target = fields.indexOf(active) >= 0 ? active : fields[0];
      const btn = target.parentNode.querySelector('.pwd-toggle');
      togglePwd(target, btn, target.type !== 'text');
      e.preventDefault();
    });
    Auth._pwdKeyBound = true;
  }

  // mode: 'login' | 'setup'（首次创建管理员）
  Auth.renderAuth = function (mode) {
    const screen = document.getElementById('authScreen');
    if (!screen) return;
    screen.style.display = 'flex';
    screen.innerHTML = '';
    Auth._mode = mode;
    const isSetup = mode === 'setup';

    // 语言切换订阅：仅绑定一次；切换语言时实时重渲染登录页（无需刷新）
    if (!Auth._langSubBound) {
      I18N.onChange(function () {
        const sc = document.getElementById('authScreen');
        if (sc && sc.style.display !== 'none' && Auth._mode) Auth.renderAuth(Auth._mode);
      });
      Auth._langSubBound = true;
    }

    function setLoginLang(code) { I18n.setLocale(code); } // onChange 触发上方订阅重渲染
    const langSw = Util.el('div', { class: 'lang-switch', role: 'group', 'aria-label': I18n.t('common.langEn') + ' / ' + I18n.t('common.langZh') }, [
      Util.el('button', { type: 'button', class: 'lang-opt' + (I18n.getLocale() === 'en-US' ? ' active' : ''), 'data-lang': 'en-US', onclick: function () { setLoginLang('en-US'); } }, I18n.t('common.langEn')),
      Util.el('button', { type: 'button', class: 'lang-opt' + (I18n.getLocale() === 'zh-CN' ? ' active' : ''), 'data-lang': 'zh-CN', onclick: function () { setLoginLang('zh-CN'); } }, I18n.t('common.langZh'))
    ]);
    const langBar = Util.el('div', { class: 'auth-langbar' }, [langSw]);

    const loginU = Util.el('input', { type: 'text', class: 'inp', placeholder: I18n.t('common.username'), autocomplete: 'username' });
    const loginP = Util.el('input', { type: 'password', class: 'inp', placeholder: I18n.t('common.password'), autocomplete: 'current-password' });
    const regU = Util.el('input', { type: 'text', class: 'inp', placeholder: I18n.t('login.username_ph') });
    const regN = Util.el('input', { type: 'text', class: 'inp', placeholder: I18n.t('login.displayName_ph') });
    const regP = Util.el('input', { type: 'password', class: 'inp', placeholder: I18n.t('login.password_ph') });
    const regP2 = Util.el('input', { type: 'password', class: 'inp', placeholder: I18n.t('login.passwordConfirm_ph') });    const msg = Util.el('div', { class: 'auth-msg' });

    function showMsg(text, type) { msg.textContent = text || ''; msg.className = 'auth-msg' + (type ? ' ' + type : ''); }

    const loginForm = Util.el('div', { class: 'auth-form' }, [
      field(I18n.t('login.username_lbl'), loginU),
      field(I18n.t('login.password_lbl'), pwdField(loginP)),
      Util.el('button', {
        class: 'btn btn-primary auth-submit', onclick: function () {
          showMsg('');
          Auth.login(loginU.value, loginP.value).then(function () {
            if (global.App && global.App.enterApp) global.App.enterApp();
          }).catch(function (e) { showMsg(e.message || I18n.t('login.loginFailed'), 'err'); });
        }
      }, I18n.t('login.signIn'))
    ]);
    const regForm = Util.el('div', { class: 'auth-form' }, [
      field(I18n.t('login.username_lbl'), regU, I18n.t('login.usernameHint')),
      field(I18n.t('login.displayName_lbl'), regN, I18n.t('login.displayNameHint')),
      field(I18n.t('login.password_lbl'), pwdField(regP)),
      field(I18n.t('login.confirmPassword_lbl'), pwdField(regP2)),
      Util.el('button', {
        class: 'btn btn-primary auth-submit', onclick: function () {
          showMsg('');
          if (regP.value !== regP2.value) { showMsg(I18n.t('login.pwdMismatch'), 'err'); return; }
          const done = isSetup
            ? Auth.register(regU.value, regP.value, regN.value)
            : Auth.register(regU.value, regP.value, regN.value);
          done.then(function () {
            if (global.App && global.App.enterApp) global.App.enterApp();
          }).catch(function (e) { showMsg(e.message || I18n.t('login.registerFailed'), 'err'); });
        }
      }, isSetup ? I18n.t('login.createAdmin') : I18n.t('login.registerAndLogin'))
    ]);

    // tab 切换（setup 模式下仅显示注册，不提供切换）
    const tabLogin = Util.el('div', { class: 'auth-tab', onclick: function () { switchTo('login'); } }, I18n.t('login.loginTab'));
    const tabReg = Util.el('div', { class: 'auth-tab', onclick: function () { switchTo('reg'); } }, I18n.t('login.registerTab'));
    const tabs = Util.el('div', { class: 'auth-tabs' }, [tabLogin, tabReg]);

    function switchTo(which) {
      const isLogin = which === 'login';
      loginForm.style.display = isLogin ? '' : 'none';
      regForm.style.display = isLogin ? 'none' : '';
      tabLogin.classList.toggle('active', isLogin);
      tabReg.classList.toggle('active', !isLogin);
      showMsg('');
    }

    const card = Util.el('div', { class: 'auth-card' }, [
      langBar,
      Util.el('div', { class: 'auth-brand' }, [
        Util.el('img', { class: 'auth-logo', src: 'pwa/icons/icon-512x512.png', alt: 'SPP' }),
        Util.el('div', {}, [
          Util.el('div', { class: 'auth-title', text: I18n.t('login.brandTitle') }),
          Util.el('div', { class: 'auth-sub', text: I18n.t('login.brandSub') })
        ])
      ]),
      Util.el('div', { class: 'auth-head', text: isSetup ? I18n.t('login.headSetup') : I18n.t('login.headLogin') }),
      isSetup ? '' : tabs,
      loginForm,
      regForm,
      msg,
      Util.el('div', { class: 'auth-note', text: isSetup
        ? I18n.t('login.noteSetup')
        : I18n.t('login.noteLogin') })
    ]);

    screen.appendChild(card);
    if (isSetup) { switchTo('reg'); loginForm.style.display = 'none'; }
    else switchTo('login');
    setTimeout(function () { try { (isSetup ? regU : loginU).focus(); } catch (e) {} }, 50);
  };

  // ---------------- 管理员后台 ----------------
  Auth.renderAdmin = function (container) {
    if (!Auth.isAdmin()) { container.innerHTML = T('<div class="empty">仅管理员可访问此页面</div>'); return; }
    container.innerHTML = '';
    container.appendChild(Util.el('div', { class: 'page-head' }, [
      Util.el('h2', { class: 'page-title', text: T('管理员后台') }),
      Util.el('div', { class: 'muted', text: T('管理系统用户账户，并查看本机数据概览。') })
    ]));

    const s = DB.get();
    const total = s.facilities.length, qnN = s.questionnaires.length, asN = s.assessments.length;
    const stdN = (s.standards || []).length;

    const overview = Util.el('div', { class: 'grid cols-4', style: 'margin-bottom:18px' }, [
      ovCard(T('用户总数'), '—', T('位')), ovCard(T('供应商数量'), total, T('个')),
      ovCard(T('评估记录'), asN, T('份')), ovCard(T('标准/法规'), stdN, T('条'))
    ]);
    container.appendChild(overview);

    // 用户表
    const panel = Util.el('div', { class: 'panel card' });
    panel.appendChild(Util.el('div', { class: 'row', style: 'align-items:center;justify-content:space-between;margin-bottom:12px' }, [
      Util.el('h3', { text: T('用户账户'), style: 'margin:0' }),
      Util.el('button', { class: 'btn btn-primary btn-sm', onclick: openCreate }, T('+ 新建用户'))
    ]));
    const tbl = Util.el('table', { class: 'tbl' });
    tbl.appendChild(Util.el('thead', {}, Util.el('tr', {}, [
      Util.el('th', { text: T('用户名') }), Util.el('th', { text: T('显示名') }), Util.el('th', { text: T('角色') }),
      Util.el('th', { text: T('状态') }), Util.el('th', { text: T('创建时间') }), Util.el('th', { text: T('最近登录') }),
      Util.el('th', { text: T('操作'), style: 'text-align:right' })
    ])));
    const tb = Util.el('tbody', {});
    tbl.appendChild(tb);
    panel.appendChild(tbl);
    container.appendChild(panel);

    function ovCard(k, v, unit) {
      return Util.el('div', { class: 'stat' }, [
        Util.el('div', { class: 'k', text: k }),
        Util.el('div', { class: 'v' }, [document.createTextNode(String(v)), unit ? Util.el('small', { text: ' ' + unit }) : null])
      ]);
    }

    function refresh() {
      Auth.listUsers().then((users) => {
        tb.innerHTML = '';
        users.forEach((u) => {
          const me = current && current.id === u.id;
          const roleTag = Util.el('span', { class: 'tag ' + (u.role === 'admin' || u.role === 'buyer' ? 'ok' : 'gray'), text: Auth.roleLabel(u.role) });
          const stTag = Util.el('span', { class: 'tag ' + (u.status === 'active' ? '' : 'danger'), text: u.status === 'active' ? T('启用') : T('停用') });
          const ops = Util.el('div', { class: 'rep-ops', style: 'justify-content:flex-end' }, [
            Util.el('button', { class: 'btn btn-sm', onclick: () => changeRole(u) }, T('改角色')),
            Util.el('button', { class: 'btn btn-sm', onclick: () => toggleStatus(u) }, u.status === 'active' ? T('停用') : T('启用')),
            Util.el('button', { class: 'btn btn-sm', onclick: () => resetPwd(u) }, T('重置密码')),
            Util.el('button', { class: 'btn btn-sm btn-danger', onclick: () => delUser(u) }, T('删除'))
          ]);
          const tr = Util.el('tr', {}, [
            Util.el('td', { html: '<strong>' + Util.esc(u.username) + '</strong>' + (me ? T(' <span class="tag gray">我</span>') : '') }),
            Util.el('td', { text: u.displayName || '—' }),
            Util.el('td', {}, [roleTag]),
            Util.el('td', {}, [stTag]),
            Util.el('td', { class: 'muted', text: Util.fmtDateTime(u.createdAt) }),
            Util.el('td', { class: 'muted', text: u.lastLogin ? Util.fmtDateTime(u.lastLogin) : T('从未') }),
            Util.el('td', { style: 'text-align:right' }, [ops])
          ]);
          tb.appendChild(tr);
        });
      });
    }

    function openCreate() {
      const u = Util.el('input', { type: 'text', class: 'inp', placeholder: T('登录用户名（≥3 位）') });
      const n = Util.el('input', { type: 'text', class: 'inp', placeholder: T('显示名称（可选）') });
      const p = Util.el('input', { type: 'password', class: 'inp', placeholder: T('初始密码（至少 6 位）') });
      const role = Util.el('select', { class: 'inp' }, [
        Util.el('option', { value: 'buyer', text: T('采购专员（可编辑）') }),
        Util.el('option', { value: 'manager', text: T('管理层（只读）') }),
        Util.el('option', { value: 'user', text: T('普通用户') }),
        Util.el('option', { value: 'admin', text: T('管理员') })
      ]);
      const body = Util.el('div', { class: 'upload-form' }, [
        field(T('用户名'), u), field(T('显示名称'), n), field(T('初始密码'), p),
        Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('角色') }), role])
      ]);
      const ok = Util.el('button', { class: 'btn btn-primary', onclick: function () {
        Auth.createUser(u.value, p.value, n.value, role.value).then(function () {
          modal.close(); Util.toast(T('用户已创建'), 'ok'); refresh();
        }).catch(function (e) { Util.toast(e.message || T('创建失败'), 'err'); });
      } }, T('创建'));
      var modal = Util.modal(T('新建用户'), body, [Util.el('button', { class: 'btn', onclick: function () { modal.close(); } }, T('取消')), ok]);
    }
    function changeRole(u) {
      const target = u.role === 'admin' ? 'user' : 'admin';
      Util.confirm(T('修改角色'), T('将用户 <b>') + Util.esc(u.username) + T('</b> 的角色改为 <b>') + (target === 'admin' ? T('管理员') : T('普通用户')) + '</b>？', T('确认修改')).then(function (ok) {
        if (!ok) return;
        Auth.setRole(u.id, target).then(function () { Util.toast(T('角色已更新'), 'ok'); refresh(); }).catch(function (e) { Util.toast(e.message, 'err'); });
      });
    }
    function toggleStatus(u) {
      const target = u.status === 'active' ? 'disabled' : 'active';
      Util.confirm(T('更改账户状态'), (u.status === 'active' ? T('停用') : T('启用')) + T('用户 <b>') + Util.esc(u.username) + '</b>？', T('确认')).then(function (ok) {
        if (!ok) return;
        Auth.setStatus(u.id, target).then(function () { Util.toast(T('状态已更新'), 'ok'); refresh(); }).catch(function (e) { Util.toast(e.message, 'err'); });
      });
    }
    function resetPwd(u) {
      const p = Util.el('input', { type: 'password', class: 'inp', placeholder: T('新密码（至少 6 位）') });
      const body = Util.el('div', { class: 'upload-form' }, [field(T('为 ') + (u.displayName || u.username) + T(' 设置新密码'), p)]);
      const ok = Util.el('button', { class: 'btn btn-primary', onclick: function () {
        Auth.resetPassword(u.id, p.value).then(function () { modal.close(); Util.toast(T('密码已重置'), 'ok'); }).catch(function (e) { Util.toast(e.message, 'err'); });
      } }, T('重置'));
      var modal = Util.modal(T('重置密码'), body, [Util.el('button', { class: 'btn', onclick: function () { modal.close(); } }, T('取消')), ok]);
    }
    function delUser(u) {
      Util.confirm(T('删除用户'), T('确认删除用户 <b>') + Util.esc(u.username) + T('</b>？该操作不可恢复。'), T('删除')).then(function (ok) {
        if (!ok) return;
        Auth.deleteUser(u.id).then(function () { Util.toast(T('已删除'), 'ok'); refresh(); }).catch(function (e) { Util.toast(e.message, 'err'); });
      });
    }

    refresh();
  };

  global.Auth = Auth;
})(window);

/* ===== src/js/app.js ===== */
/* 主程序：导航、仪表盘、设置/备份、初始化 */
(function (global) {
  const App = {};

  // ===== 全局错误捕获机制（SUP-GLOBAL-ERR） =====
  // 需求：捕获未处理的 JS 异常与 Promise 拒绝，用户获得清晰提示而非静默失败。
  // 实现：window.onerror + unhandledrejection，toast 轻提示 + 控制台保留详情，绝不阻断功能。
  // 幂等：仅绑定一次，避免重复初始化导致重复提示。
  if (!global.__sppErrBound) {
    global.__sppErrBound = true;
    const seenErrors = new Set();
    function report(errMsg, detail) {
      const key = String(errMsg || '').slice(0, 120);
      if (seenErrors.has(key)) return;          // 同一错误去重，避免风暴
      if (seenErrors.size > 100) seenErrors.clear();
      seenErrors.add(key);
      // 控制台始终输出完整信息（供开发者排查）
      try { console.error('[SPP-ERR]', errMsg, detail || ''); } catch (e) {}
      // 用户可见轻提示（非阻断）
      try {
        if (global.Util && Util.toast) {
          Util.toast(T('操作遇到异常，请稍后重试'), 'err');
        }
      } catch (e) {}
    }
    global.addEventListener('error', function (e) {
      if (e && e.message) report('JS 错误: ' + e.message, e.filename + ':' + (e.lineno || ''));
      // 资源加载错误（如离线图片）静默忽略，不打扰用户
    });
    global.addEventListener('unhandledrejection', function (e) {
      let reason = '';
      try { reason = (e.reason && (e.reason.message || e.reason)) || '未处理的 Promise 拒绝'; } catch (x) { reason = '未处理的 Promise 拒绝'; }
      report('Promise 异常: ' + String(reason).slice(0, 200), reason);
      try { if (e.preventDefault) e.preventDefault(); } catch (x) {}
    });
  }

  // 视图标题使用函数延迟求值（Bug#5 修复）：T() 在模块加载时求值会把标题固定为加载时语言，
  // 导致语言切换后顶栏标题不更新；改为渲染时调用 title() 动态取当前语言文案。
  const VIEWS = {
    dashboard: { title: () => T('仪表盘'), fn: renderDashboard },
    designer: { title: () => T('问卷设计'), fn: () => Designer.render(mount()) },
    facilities: { title: () => T('供应商登记'), fn: () => Facility.render(mount()) },
    assessments: { title: () => T('评估填写'), fn: () => Assess.render(mount()) },
    supplychain: { title: () => T('供应链看板'), fn: () => SupplyChain.render(mount()) },
    standards: { title: () => T('标准/法规'), fn: () => Standards.render(mount()) },
    guides: { title: () => T('审核员指南'), fn: () => Guides.render(mount()) },
    esg: { title: () => T('ESG 问卷'), fn: () => ESG.render(mount()) },
    photos: { title: () => T('现场照片'), fn: () => Photos.render(mount()) },
    sync: { title: () => T('局域网同步'), fn: () => SyncClient.render(mount()) },
    export: { title: () => T('数据导出'), fn: () => Report.render(mount()) },
    templates: { title: () => T('模板管理'), fn: () => TemplateCenterUI.render(mount()) },
    settings: { title: () => T('设置 / 备份'), fn: renderSettings },
    admin: { title: () => T('管理员后台'), fn: () => Auth.renderAdmin(mount()) },
    // SUP-029：安卓端「移动工作台」首页（5 个核心模块入口）
    mobile: { title: () => T('工作台'), fn: renderMobileHome }
  };
  function mount() { return document.getElementById('content'); }

  // ===== SUP-029 安卓端专用：仅保留移动端核心模块 =====
  // 安卓 APK 只展示：供应商登记 / 评估填写 / 照片收集 / 数据同步 / 输出报告。
  // 仪表盘在安卓端不显示，首页直接进入「移动工作台」。
  const ANDROID_CORE_VIEWS = ['facilities', 'assessments', 'photos', 'sync', 'export'];
  // 标签/描述同样延迟求值（随语言切换动态刷新）
  const ANDROID_CORE_LABELS = {
    facilities: () => T('供应商登记'), assessments: () => T('评估填写'), photos: () => T('现场照片'),
    sync: () => T('数据同步'), export: () => T('输出报告')
  };
  const ANDROID_CORE_DESC = {
    facilities: () => T('登记供应商基本信息与联系方式'), assessments: () => T('在线/离线填写评估问卷与评分'),
    photos: () => T('拍摄并管理现场照片'), sync: () => T('局域网/USB 与 PC 同步数据'), export: () => T('查看并导出评估报告')
  };
  // 安卓端隐藏的导航项（与桌面/Web 共享 DOM，仅控制显示）
  const ANDROID_HIDDEN_NAV = ['dashboard', 'designer', 'supplychain', 'esg', 'standards', 'guides', 'templates', 'settings', 'admin'];

  let navBound = false, langBound = false;
  let currentView = 'dashboard';
  const LAST_VIEW_KEY = 'spp_last_view';

  // 当前视图持久化：刷新/重启后恢复到用户离开时的页面，而非跳回仪表盘（SUP-028）
  function rememberView(view) {
    try { localStorage.setItem(LAST_VIEW_KEY, view); } catch (e) {}
  }
  function lastView() {
    try { return localStorage.getItem(LAST_VIEW_KEY) || 'dashboard'; } catch (e) { return 'dashboard'; }
  }

  // 语言切换：重渲染当前视图 + 静态文案（导航/顶栏/品牌）
  function updateLangBtn() {
    const b = document.getElementById('btnLang');
    if (b) b.textContent = (I18N.lang === 'en') ? '中' : 'EN';
  }
  function applyLangAll() {
    I18N.applyStatic(document);
    updateLangBtn();
    refreshUserChip();
    if (App.refreshStorageStat) App.refreshStorageStat();
    if (App.renderNetChip) App.renderNetChip();
    navigate(currentView);
  }

  App.init = function () {
    // SW 注册由 pwa/register-sw.js 接管（含跨浏览器兼容与更新提示）
    checkCompat();
    // 响应式布局增强（侧边栏/分栏拖拽、防抖 resize）：纯增强，失败不影响核心功能
    if (global.Responsive) { try { global.Responsive.init(); } catch (e) { console.warn('responsive init', e); } }
    I18N.onChange(applyLangAll);
    DB.load()
      // 报告模板对外是同步 API（分页计算需要同步取模板），底层存储是异步的，
      // 因此必须在进入界面前把用户模板载入内存缓存；缺了这一步会把已存模板覆盖丢失。
      .then(() => (global.ReportTpl ? ReportTpl.init() : null))
      .then(() => (global.TemplateCenter ? TemplateCenter.init() : null))
      .then(() => Auth.init())
      .then((st) => {
        // 局域网同步：若此前配置过服务器地址，自动重连（仅本地存储模式）
        if (global.SyncClient) { try { global.SyncClient.autoConnect(); } catch (e) { console.warn('sync autoConnect', e); } }
        if (st.phase === 'setup') { Auth.renderAuth('setup'); return; }
        if (st.phase === 'login') { Auth.renderAuth('login'); return; }
    App.enterApp();
  })
      .catch((e) => { console.error(e); Util.toast(T('初始化失败：') + (e && e.message || e), 'err'); });
  };

  // 登录成功后进入主程序
  App.enterApp = function () {
    const sc = document.getElementById('authScreen');
    if (sc) sc.style.display = 'none';
    if (!navBound) { buildNav(); navBound = true; }
    const adminItem = document.getElementById('navAdmin');
    const sysSection = document.getElementById('navSysSection');
    const showAdmin = Auth.isAdmin();
    // SUP-029：安卓端隐藏非核心导航（管理员后台在安卓端不显示）
    const isAndroid = Util.isAndroidApp();
    if (adminItem) adminItem.style.display = (showAdmin && !isAndroid) ? '' : 'none';
    if (sysSection) sysSection.style.display = (showAdmin && !isAndroid) ? '' : 'none';
    // 安卓端：按 5 个核心模块过滤导航项
    if (isAndroid) {
      document.querySelectorAll('.nav-item').forEach((item) => {
        const v = item.dataset.view;
        const hidden = ANDROID_HIDDEN_NAV.indexOf(v) >= 0;
        item.style.display = hidden ? 'none' : '';
      });
      // 隐藏「工作台 / ESG / 合规资源」等桌面分组标题
      document.querySelectorAll('.nav-section').forEach((sec) => { if (sec.id !== 'navSysSection') sec.style.display = 'none'; });
      // 安卓端品牌副标题与存储提示精简
      const sub = document.querySelector('.brand-sub');
      if (sub) sub.textContent = T('移动现场评估');
      // SUP-029：安卓端根节点标记，用于 CSS 定向过渡/视觉增强（不影响 Web/PC）
      const htmlEl = document.documentElement;
      if (htmlEl) htmlEl.classList.add('android-app');
      // SUP-030：安卓端隐藏桌面侧边栏，改用底部标签栏导航（更符合移动操作习惯）
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.add('android-sidebar');
      // 隐藏顶部汉堡
      const hamburger = document.querySelector('.hamburger');
      if (hamburger) hamburger.style.display = 'none';
      // SUP-043：安卓端顶部栏返回按钮绑定；取消底部标签栏（主界面按钮进入子页面）
      setupAndroidBars();
      // renderBottomNav();
      syncBottomNav(); // 仅更新 nav-item active（无实际显示影响）
      // SUP-043：首次启动询问用户是否允许访问本地存储并创建应用文件夹
      promptAndroidStorageIfNeeded();
    }
    refreshUserChip();
    if (!langBound) {
      const lb = document.getElementById('btnLang');
      if (lb) lb.addEventListener('click', function () { I18N.setLang(I18N.lang === 'en' ? 'zh' : 'en'); });
      langBound = true;
    }
    I18N.applyStatic(document);
    updateLangBtn();
    // 刷新/重启后恢复到上次停留的页面；同步刷新不再强制回到移动工作台首页。
    var initialView = lastView();
    if (isAndroid && ANDROID_CORE_VIEWS.indexOf(initialView) < 0) initialView = 'mobile';
    navigate(initialView);
    App.refreshStorageStat();
  };

  function buildNav() {
    const navToggle = document.getElementById('navToggle');
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', () => {
        navigate(item.dataset.view);
        if (navToggle) navToggle.checked = false; // 移动端点击后收起抽屉（纯展示态，不涉业务逻辑）
      });
    });
  }

  function navigate(view) {
    // SUP-029：安卓端禁止进入非核心模块（防止通过历史视图/链接绕回）
    if (Util.isAndroidApp() && view !== 'mobile' && ANDROID_CORE_VIEWS.indexOf(view) < 0) {
      view = 'mobile';
    }
    if (!VIEWS[view]) view = 'dashboard';
    currentView = view;
    rememberView(view);
    // SUP-040：安卓端移动工作台首页标记 m-home-view，用于隐藏顶部折叠按钮/释放顶栏空间
    if (Util.isAndroidApp()) {
      document.documentElement.classList.toggle('m-home-view', view === 'mobile');
    }
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.view === view));
    document.getElementById('viewTitle').textContent = VIEWS[view].title();
    const m = mount();
    if (!m) return;
    try {
      VIEWS[view].fn();
      // 安卓端底部标签栏同步高亮（SUP-030）
      syncBottomNav();
      // 动态页面显示优化（SUP-010）：视图切换淡入过渡，避免生硬跳变
      m.classList.remove('view-enter');
      void m.offsetWidth; // 强制 reflow 以重触发动画
      m.classList.add('view-enter');
    } catch (e) {
      // 动态渲染错误兜底：防止整页白屏
      console.error('[navigate] 渲染 ' + view + ' 失败:', e);
      m.innerHTML = '';
      m.appendChild(Util.el('div', { class: 'panel card view-error' }, [
        Util.el('h3', { text: T('页面加载失败') }),
        Util.el('p', { class: 'muted', text: (e && e.message) || String(e) }),
        Util.el('div', { class: 'btn-row' }, [
          Util.el('button', { class: 'btn btn-primary', onclick: function () { App.navigate(currentView); } }, T('重试'))
        ])
      ]));
      Util.toast(T('页面加载失败，请重试'), 'err');
    }
  }
  App.navigate = navigate;

  // 刷新当前页面：仅重渲染当前视图，不跳转其它页面（SUP-028）
  App.refresh = function () { navigate(currentView); };

  // ---------- 安卓端「移动工作台」首页（SUP-029） ----------
  function renderMobileHome() {
    const m = mount();
    const s = DB.get();
    m.innerHTML = '';
    // 顶部欢迎区（SUP-044b：设置按钮已上移至顶部栏右侧，此处不再重复）
    m.appendChild(Util.el('div', { class: 'page-head', style: 'margin-bottom:16px' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('移动工作台') }),
        Util.el('div', { class: 'muted', text: T('供应商预审 · 移动现场评估 · 数据本地存储，可随时与 PC 同步') })
      ])
    ]));
    // 快捷统计
    const avg = computeAvg();
    const statRow = Util.el('div', { class: 'grid cols-3 m-home-stats' }, [
      Util.el('div', { class: 'm-stat' }, [Util.el('div', { class: 'm-stat-k', text: T('供应商') }), Util.el('div', { class: 'm-stat-v', text: String(s.facilities.length) })]),
      Util.el('div', { class: 'm-stat' }, [Util.el('div', { class: 'm-stat-k', text: T('评估') }), Util.el('div', { class: 'm-stat-v', text: String(s.assessments.length) })]),
      Util.el('div', { class: 'm-stat' }, [Util.el('div', { class: 'm-stat-k', text: T('合规分') }), Util.el('div', { class: 'm-stat-v', text: avg == null ? '—' : avg + '%' })])
    ]);
    m.appendChild(statRow);
    // 5 个核心模块入口卡片
    const grid = Util.el('div', { class: 'm-home-grid' });
    ANDROID_CORE_VIEWS.forEach((v) => {
      const card = Util.el('div', { class: 'm-home-card', onclick: () => navigate(v) }, [
        Util.el('div', { class: 'm-home-ico', html: mobileIcon(v) }),
        Util.el('div', { class: 'm-home-body' }, [
          Util.el('div', { class: 'm-home-title', text: ANDROID_CORE_LABELS[v]() }),
          Util.el('div', { class: 'm-home-desc', text: ANDROID_CORE_DESC[v]() })
        ]),
        Util.el('span', { class: 'm-home-arrow', text: '›' })
      ]);
      grid.appendChild(card);
    });
    m.appendChild(grid);
    // SUP-043：数据管理面板隐藏不显示；通过设置弹窗进入
    // m.appendChild(renderMobileStoragePanel());
    // 提示：数据安全说明
    m.appendChild(Util.el('div', { class: 'tip', style: 'margin-top:16px;text-align:center', text: T('所有数据仅存储在本机。前往「数据同步」可通过局域网或 USB 与 PC 互相同步问卷与照片数据。') }));
  }

  // SUP-043：安卓端设置弹窗（语言切换 / 刷新界面 / 用户信息 / 数据管理）
  function openMobileSettings() {
    const u = Auth.currentUser();
    const body = Util.el('div', { style: 'display:flex;flex-direction:column;gap:12px' }, [
      Util.el('div', { class: 'panel card', style: 'padding:12px' }, [
        Util.el('div', { style: 'font-size:12px;color:var(--ink-3);margin-bottom:6px', text: T('当前用户') }),
        Util.el('div', { style: 'font-weight:700', text: u ? (u.displayName || u.username) : T('未登录') }),
        Util.el('div', { style: 'font-size:12px;color:var(--brand-2)', text: u ? Auth.roleLabel(u.role) : '' })
      ]),
      Util.el('div', { style: 'display:flex;gap:8px' }, [
        Util.el('button', { class: 'btn', style: 'flex:1', onclick: () => { Util.closeModal(); I18N.setLang(I18N.lang === 'en' ? 'zh' : 'en'); }, html: '<span style="margin-right:6px">🌐</span>' + T('切换语言') + ' (' + (I18N.lang === 'en' ? '中' : 'EN') + ')' }),
        Util.el('button', { class: 'btn', style: 'flex:1', onclick: () => { Util.closeModal(); App.refresh(); }, html: '<span style="margin-right:6px">↻</span>' + T('刷新界面') })
      ]),
      renderMobileStoragePanel(),
      Util.el('button', { class: 'btn btn-danger', onclick: () => { Util.closeModal(); Auth.logout(); location.reload(); }, text: T('退出登录') })
    ]);
    Util.modal(T('设置'), body, [Util.el('button', { class: 'btn', onclick: Util.closeModal }, T('关闭'))]);
  }

  // SUP-032：安卓端「数据管理」面板——申请存储权限、导出数据到本地文件夹
  function renderMobileStoragePanel() {
    const panel = Util.el('div', { class: 'panel card m-storage-panel', style: 'margin-top:14px' });
    panel.appendChild(Util.el('h3', { text: T('数据管理'), style: 'margin-top:0' }));
    const info = Util.el('div', { class: 'muted', style: 'margin:6px 0 10px', text: T('数据默认存储于应用内（IndexedDB）。可申请访问设备存储，将报告/照片导出到本地文件夹浏览。') });
    panel.appendChild(info);
    // 存储位置 / 用量
    const kv = Util.el('div', { class: 'kv-list', style: 'margin-bottom:10px' });
    panel.appendChild(kv);
    const refresh = () => {
      DB.storageEstimate().then((e) => {
        const mb = ((e.usage || 0) / (1024 * 1024)).toFixed(2);
        kv.innerHTML = '';
        kv.appendChild(Util.el('div', { class: 'kv-row' }, [Util.el('span', { class: 'kv-k', text: T('存储模式') }), Util.el('span', { class: 'kv-v', text: Storage.mode === 'http' ? T('JSON 文件') : T('应用内 (IndexedDB)') })]));
        kv.appendChild(Util.el('div', { class: 'kv-row' }, [Util.el('span', { class: 'kv-k', text: T('已用空间') }), Util.el('span', { class: 'kv-v', text: mb + ' MB' })]));
        kv.appendChild(Util.el('div', { class: 'kv-row' }, [Util.el('span', { class: 'kv-k', text: T('报告保存位置') }), Util.el('span', { class: 'kv-v', text: 'Documents/供应商预审平台/报告' })]));
      });
    };
    refresh();
    // 权限 + 导出按钮
    const row = Util.el('div', { class: 'btn-row', style: 'margin-top:8px' });
    const permBtn = Util.el('button', { class: 'btn', onclick: function () {
      Util.requestAndroidStorage().then(function (ok) {
        Util.toast(ok ? T('存储权限已就绪') : T('存储权限未授予，可能无法保存到文件夹'), ok ? 'ok' : 'warn');
        refresh();
      });
    } }, T('申请存储权限'));
    const exportBtn = Util.el('button', { class: 'btn btn-primary', onclick: function () {
      Util.requestAndroidStorage().then(function (ok) {
        if (!ok && Util.isNative()) { Util.toast(T('请先授予存储权限'), 'err'); return; }
        return DB.exportFull().then(function (json) {
          // json 是字符串；安卓保存到本地文件夹，Web/PC 下载
          if (Util.isNative && Util.isNative()) {
            return Util.androidSaveFile(json, '供应商预审平台数据_' + Util.fmtDate(Date.now()) + '.json', '数据备份');
          }
          const blob = new Blob([json], { type: 'application/json' });
          Util.download(blob, T('供应商预审平台数据备份_') + Util.fmtDate(Date.now()) + '.json');
          return { saved: true };
        }).then(function (r) {
          Util.toast(r && r.saved ? T('数据已导出到本地文件夹') : T('数据已下载'), 'ok');
        }).catch(function (e) { Util.toast(T('导出失败：') + (e && e.message || e), 'err'); });
      });
    } }, T('导出数据到本地'));
    row.appendChild(permBtn);
    row.appendChild(exportBtn);
    panel.appendChild(row);
    return panel;
  }

  // 安卓端核心模块图标（简约线条 SVG）
  function mobileIcon(v) {
    const I = {
      facilities: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/><path d="M10 21v-3h4v3"/></svg>',
      assessments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 12l2 2 4-4"/></svg>',
      photos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/></svg>',
      sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-7.6-4.2"/><path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 7.6 4.2"/><path d="M20 3v4h-4"/><path d="M4 21v-4h4"/></svg>',
      export: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>'
    };
    return I[v] || I.facilities;
  }

  // SUP-030：安卓端底部标签栏导航（工作台 / 5 核心模块）
  function renderBottomNav() {
    const nav = document.getElementById('mBottomNav');
    if (!nav) return;
    nav.innerHTML = '';
    // 底部标签：工作台 + 5 个核心模块
    const TABS = ['mobile'].concat(ANDROID_CORE_VIEWS);
    const LABELS = Object.assign({ mobile: T('工作台') }, ANDROID_CORE_LABELS);
    const ICONS = Object.assign({ mobile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>' }, {
      facilities: mobileIcon('facilities'), assessments: mobileIcon('assessments'),
      photos: mobileIcon('photos'), sync: mobileIcon('sync'), export: mobileIcon('export')
    });
    TABS.forEach((v) => {
      const label = (typeof LABELS[v] === 'function') ? LABELS[v]() : LABELS[v];
      const btn = Util.el('button', { class: 'm-bottomnav-item' + (currentView === v ? ' active' : ''), dataset: { view: v }, onclick: () => navigate(v) }, [
        Util.el('span', { class: 'm-bottomnav-ico', html: ICONS[v] }),
        Util.el('span', { class: 'm-bottomnav-label', text: label })
      ]);
      nav.appendChild(btn);
    });
    // SUP-034b：安卓端底部栏折叠按钮（收到底部栏最右侧，可收起/展开以增大内容区）
    nav.appendChild(Util.el('button', {
      class: 'm-bottomnav-fold', onclick: () => App.toggleAndroidBottomNav(), title: T('折叠/展开底部导航')
    }, [
      Util.el('span', { class: 'm-bottomnav-fold-ico', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>' })
    ]));
  }

  // SUP-030：安卓端 navigate 后同步底部标签高亮
  function syncBottomNav() {
    const nav = document.getElementById('mBottomNav');
    if (!nav || !Util.isAndroidApp()) return;
    nav.querySelectorAll('.m-bottomnav-item').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === currentView);
    });
  }

  // ===== SUP-034b：安卓端上下栏自由折叠（仅影响外层布局，不触碰问卷/登记逻辑）=====
  const BARS_FOLD_KEY = 'spp_android_bars';
  // 默认状态：顶部栏展开(1)，底部栏展开(1)
  let barState = { top: 1, bottom: 1 };
  function loadBarState() {
    try {
      const s = JSON.parse(localStorage.getItem(BARS_FOLD_KEY) || 'null');
      if (s) barState = Object.assign({ top: 1, bottom: 1 }, s);
    } catch (e) {}
  }
  function saveBarState() {
    try { localStorage.setItem(BARS_FOLD_KEY, JSON.stringify(barState)); } catch (e) {}
  }
  function applyBars() {
    const htmlEl = document.documentElement;
    if (!htmlEl) return;
    htmlEl.classList.toggle('android-topbar-folded', barState.top !== 1);
    htmlEl.classList.toggle('android-bottomnav-folded', barState.bottom !== 1);
    // 顶部折叠按钮箭头方向：折叠(向下展开箭头) / 展开(向上收起箭头)
    const btn = document.getElementById('btnFoldTopbar');
    if (btn) {
      const ico = btn.querySelector('.fold-ico');
      if (ico) ico.innerHTML = barState.top !== 1
        ? '<path d="M18 15l-6-6-6 6"/>'   // 向下箭头=点击展开
        : '<path d="M6 9l6 6 6-6"/>';      // 向上箭头=点击收起
    }
    // 底部导航折叠后：屏幕底部中央显示「展开把手」，点击恢复
    let handle = document.getElementById('mBottomHandle');
    if (barState.bottom !== 1) {
      if (!handle) {
        handle = Util.el('button', {
          id: 'mBottomHandle', class: 'm-bottom-handle',
          onclick: function () { App.toggleAndroidBottomNav(); }, title: T('展开底部导航')
        }, [
          Util.el('span', { class: 'm-bottom-handle-ico', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>' })
        ]);
        document.body.appendChild(handle);
      } else handle.style.display = '';
    } else if (handle) {
      handle.style.display = 'none';
    }
  }
  // 初始化：隐藏底部导航、绑定安卓返回/设置按钮、恢复状态
  function setupAndroidBars() {
    loadBarState();
    // SUP-043：安卓端取消上下导航栏，折叠按钮无需显示
    const foldBtn = document.getElementById('btnFoldTopbar');
    if (foldBtn) foldBtn.style.display = 'none';
    // 安卓返回按钮：返回工作台首页
    const backBtn = document.getElementById('btnAndroidBack');
    if (backBtn) backBtn.onclick = function () { navigate('mobile'); };
    // SUP-044b：安卓端顶部栏设置按钮：打开设置弹窗
    const setBtn = document.getElementById('btnAndroidSettings');
    if (setBtn) {
      setBtn.style.display = '';
      setBtn.onclick = function () { openMobileSettings(); };
    }
    applyBars();
    // SUP-037：内容滚动时为顶栏加阴影
    const content = document.getElementById('content');
    if (content && !content.__scrollShadowBound) {
      content.__scrollShadowBound = true;
      content.addEventListener('scroll', function () {
        document.documentElement.classList.toggle('android-scrolled', content.scrollTop > 6);
      }, { passive: true });
    }
  }
  // SUP-043：安卓端首次启动询问用户是否允许访问本地存储并创建应用文件夹
  function promptAndroidStorageIfNeeded() {
    if (!Util.isNative()) return;
    const key = '__android_storage_prompted';
    if (global.localStorage && global.localStorage.getItem(key)) return;
    Util.confirm(T('存储权限'), T('是否允许应用访问设备存储，以便将报告和照片保存到本地文件夹？')).then(function (ok) {
      if (global.localStorage) global.localStorage.setItem(key, '1');
      if (!ok) return;
      Util.requestAndroidStorage().then(function (granted) {
        if (!granted) { Util.toast(T('存储权限未授予，可能无法保存到文件夹'), 'warn'); return; }
        // 创建应用根目录
        const FS = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.Filesystem;
        if (FS && typeof FS.mkdir === 'function') {
          FS.mkdir({ path: '供应商预审平台', directory: 'DOCUMENTS', recursive: true }).catch(function () {});
          FS.mkdir({ path: '供应商预审平台/报告', directory: 'DOCUMENTS', recursive: true }).catch(function () {});
          FS.mkdir({ path: '供应商预审平台/照片', directory: 'DOCUMENTS', recursive: true }).catch(function () {});
        }
        Util.toast(T('存储权限已就绪，应用文件夹已创建'), 'ok');
      });
    });
  }

  App.toggleAndroidTopbar = function () {
    barState.top = barState.top === 1 ? 0 : 1;
    saveBarState();
    applyBars();
  };
  App.toggleAndroidBottomNav = function () {
    barState.bottom = barState.bottom === 1 ? 0 : 1;
    saveBarState();
    applyBars();
  };

  // ---------- 仪表盘 ----------
  function renderDashboard() {
    const m = mount();
    const s = DB.get();
    m.innerHTML = '';
    // 欢迎语（登录后首页展示，平台名统一入口）
    m.appendChild(Util.el('div', { class: 'page-head', style: 'margin-bottom:16px' }, [
      Util.el('div', {}, [
        Util.el('h2', { class: 'page-title', text: T('欢迎使用供应商预审平台') }),
        Util.el('div', { class: 'muted', text: T('供应商预审 · 问卷设计 · 评估填写 · 报告导出 · 全程本地存储') })
      ])
    ]));
    const avg = computeAvg();
    const stats = Util.el('div', { class: 'grid cols-4' }, [
      statCard(T('供应商总数'), s.facilities.length, T('个')),
      statCard(T('问卷模板'), s.questionnaires.length, T('套')),
      statCard(T('评估记录'), s.assessments.length, T('份')),
      statCard(T('平均合规评分'), avg == null ? '—' : avg + '%', '')
    ]);
    m.appendChild(stats);

    // 供应链概览（新增模块入口）
    const scState = DB.get();
    const withGeo = scState.facilities.filter((f) => typeof f.lat === 'number' && typeof f.lng === 'number');
    const countries = {}; withGeo.forEach((f) => { if (f.country) countries[f.country] = (countries[f.country] || 0) + 1; });
    const countryEntries = Object.keys(countries).map((k) => [k, countries[k]]).sort((a, b) => b[1] - a[1]);
    const anomalyCount = (scState.supplyNodes || []).filter((n) => n.anomaly && n.anomaly !== '').length;
    const scCard = Util.el('div', { class: 'panel card', style: 'margin-top:22px' }, [
      Util.el('div', { class: 'page-head', style: 'margin-bottom:12px' }, [
        Util.el('h2', { class: 'page-title', text: T('供应链概览') }),
        Util.el('button', { class: 'btn btn-primary', onclick: () => navigate('supplychain') }, T('打开供应链看板'))
      ]),
      Util.el('div', { class: 'grid cols-3 sc-overview' }, [
        statCard(T('有坐标供应商'), withGeo.length, T('个')),
        statCard(T('覆盖国家/地区'), countryEntries.length, T('个')),
        statCard(T('异常预警'), anomalyCount, T('项'))
      ]),
      countryEntries.length ? Util.el('div', { class: 'sc-mini-bar' }, countryEntries.slice(0, 6).map((e) => {
        const max = countryEntries[0][1] || 1;
        return Util.el('div', { class: 'sc-mini-row' }, [
          Util.el('span', { class: 'sc-mini-name', text: e[0] }),
          Util.el('span', { class: 'sc-mini-track' }, [Util.el('span', { class: 'sc-mini-fill', style: 'width:' + Math.round(e[1] / max * 100) + '%' })]),
          Util.el('span', { class: 'sc-mini-val', text: String(e[1]) })
        ]);
      })) : Util.el('div', { class: 'muted', style: 'margin-top:8px', text: T('尚无带地理坐标的供应商，前往看板生成示例数据或导入。') })
    ]);
    m.appendChild(scCard);

    m.appendChild(Util.el('div', { class: 'page-head', style: 'margin-top:22px' }, [
      Util.el('h2', { class: 'page-title', text: T('最近评估') }),
      Util.el('div', { class: 'btn-row' }, [
        Util.el('button', { class: 'btn', onclick: () => navigate('facilities') }, T('登记供应商')),
        Util.el('button', { class: 'btn btn-primary', onclick: () => navigate('assessments') }, T('新建评估'))
      ])
    ]));

    if (!s.assessments.length) {
      m.appendChild(Util.el('div', { class: 'empty', text: T('还没有评估记录。流程：先在「供应商登记」添加被审核对象 → 在「问卷设计」定制问卷 → 在「评估填写」中作答 → 在「数据导出」生成报告。') }));
      return;
    }
    const panel = Util.el('div', { class: 'panel' });
    const tbl = Util.el('table', { class: 'tbl' });
    tbl.appendChild(Util.el('thead', {}, Util.el('tr', {}, [
      Util.el('th', { text: T('供应商') }), Util.el('th', { text: T('问卷') }), Util.el('th', { text: T('审核员') }),
      Util.el('th', { text: T('日期') }), Util.el('th', { text: T('评分') }), Util.el('th', { text: T('状态') })
    ])));
    const tb = Util.el('tbody', {});
    s.assessments.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 8).forEach((a) => {
      const f = DB.getFacility(a.facilityId);
      const qn = DB.getQuestionnaire(a.questionnaireId);
      const sc = DB.computeScore(qn, a.answers);
      tb.appendChild(Util.el('tr', { style: 'cursor:pointer', onclick: () => { App.navigate('assessments'); } }, [
        Util.el('td', { html: '<strong>' + Util.esc(f ? f.name : T('已删除')) + '</strong>' }),
        Util.el('td', { text: qn ? qn.title : T('已删除') }),
        Util.el('td', { text: a.auditor || '-' }),
        Util.el('td', { class: 'muted', text: Util.fmtDate(a.date) }),
        Util.el('td', { text: sc.max ? sc.percent + '%' : '—' }),
        Util.el('td', {}, [a.status === 'done' ? Util.el('span', { class: 'tag ok', text: T('完成') }) : Util.el('span', { class: 'tag gray', text: T('草稿') })])
      ]));
    });
    tbl.appendChild(tb);
    panel.appendChild(tbl);
    m.appendChild(panel);
  }

  function statCard(k, v, unit) {
    return Util.el('div', { class: 'stat' }, [
      Util.el('div', { class: 'k', text: k }),
      Util.el('div', { class: 'v' }, [document.createTextNode(String(v)), unit ? Util.el('small', { text: ' ' + unit }) : null])
    ]);
  }

  function computeAvg() {
    const s = DB.get();
    let sum = 0, n = 0;
    s.assessments.forEach((a) => {
      const qn = DB.getQuestionnaire(a.questionnaireId);
      const sc = DB.computeScore(qn, a.answers);
      if (sc.max) { sum += sc.percent; n++; }
    });
    return n ? Math.round(sum / n) : null;
  }

  // ---------- 设置 / 备份 ----------
  function renderSettings() {
    const m = mount();
    const s = DB.get();
    m.innerHTML = '';
    m.classList.add('settings-view');
    m.appendChild(Util.el('div', { class: 'page-head settings-head' }, [
      Util.el('div', { class: 'settings-heading' }, [
        Util.el('div', { class: 'eyebrow', text: T('工作区配置') }),
        Util.el('h2', { class: 'page-title', text: T('设置 / 数据备份') }),
        Util.el('div', { class: 'muted', text: T('配置报告抬头、管理本地数据，并通过备份保障审核资料安全。') })
      ]),
      Util.el('div', { class: 'settings-trust', html: Util.icon('shield') + '<span>' + T('数据仅保存在本机') + '</span>' })
    ]));

    // 抬头设置
    const setPanel = Util.el('div', { class: 'panel card settings-card settings-profile' });
    setPanel.appendChild(Util.el('div', { class: 'section-heading' }, [
      Util.el('div', { class: 'section-icon', html: Util.icon('file') }),
      Util.el('div', {}, [Util.el('h3', { text: T('报告与机构信息') }), Util.el('div', { class: 'section-desc', text: T('这些信息会作为默认内容出现在新建报告中。') })])
    ]));
    const orgI = Util.el('input', { type: 'text', value: s.settings.orgName || '' });
    orgI.addEventListener('input', () => { s.settings.orgName = orgI.value; DB.persist(); });
    const audI = Util.el('input', { type: 'text', value: s.settings.auditorName || '' });
    audI.addEventListener('input', () => { s.settings.auditorName = audI.value; DB.persist(); });
    const titleI = Util.el('input', { type: 'text', value: s.settings.reportTitle || '' });
    titleI.addEventListener('input', () => { s.settings.reportTitle = titleI.value; DB.persist(); });
    setPanel.appendChild(Util.el('div', { class: 'row' }, [
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('机构 / 组织名称') }), orgI]),
      Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('默认审核员') }), audI])
    ]));
    setPanel.appendChild(Util.el('label', { class: 'fld' }, [Util.el('span', { class: 'lbl', text: T('报告标题') }), titleI]));
    m.appendChild(setPanel);

    // 数据管理
    const dataPanel = Util.el('div', { class: 'panel card settings-card settings-backup' });
    dataPanel.appendChild(Util.el('div', { class: 'section-heading' }, [
      Util.el('div', { class: 'section-icon section-icon-blue', html: Util.icon('database') }),
      Util.el('div', {}, [Util.el('h3', { text: T('数据管理') }), Util.el('div', { class: 'section-desc', text: T('备份、恢复或清理本机审核数据。') })])
    ]));
    dataPanel.appendChild(Util.el('div', { class: 'settings-notice', html: Util.icon('shield') + '<div><strong>' + T('本地数据保护') + '</strong><span>' + T('所有数据仅保存在你的本机，不上传任何服务器。建议定期导出备份。') + '</span></div>' }));

    const btnRow = Util.el('div', { class: 'btn-row settings-actions' });
    btnRow.appendChild(Util.el('button', { class: 'btn btn-primary', onclick: exportBackup }, T('⇩ 导出 JSON 备份')));
    btnRow.appendChild(Util.el('button', { class: 'btn', onclick: importBackup }, T('⇧ 导入 JSON 恢复')));
    btnRow.appendChild(Util.el('button', { class: 'btn btn-danger', onclick: resetAll }, T('清空全部数据')));
    dataPanel.appendChild(btnRow);
    m.appendChild(dataPanel);

    // 数据存储位置（零数据库 · 数据自主可控）
    const storagePanel = buildStoragePanel();
    storagePanel.classList.add('settings-card', 'settings-storage');
    m.appendChild(storagePanel);
  }

  function kvItem(k, v) {
    return Util.el('div', { class: 'kv-row' }, [Util.el('span', { class: 'kv-k', text: k }), Util.el('span', { class: 'kv-v', text: v == null ? '—' : String(v) })]);
  }
  function buildStoragePanel() {
    const panel = Util.el('div', { class: 'panel card' });
    panel.appendChild(Util.el('div', { class: 'section-heading' }, [
      Util.el('div', { class: 'section-icon section-icon-slate', html: Util.icon('folder') }),
      Util.el('div', {}, [Util.el('h3', { text: T('数据存储位置') }), Util.el('div', { class: 'section-desc', text: T('查看当前存储模式、位置和空间使用情况。') })])
    ]));
    const info = Util.el('div', { class: 'kv-list' });
    panel.appendChild(info);
    const refresh = () => {
      DB.storageEstimate().then((e) => {
        const mb = ((e.usage || 0) / (1024 * 1024)).toFixed(2);
        const q = e.quota ? (' / ' + (e.quota / (1024 * 1024)).toFixed(0) + ' MB') : '';
        info.innerHTML = '';
        info.appendChild(kvItem(T('存储模式'), Storage.mode === 'http' ? T('JSON 文件（零数据库）') : T('浏览器本地 (IndexedDB)')));
        info.appendChild(kvItem(T('存储位置'), Storage.dataDir || '-'));
        info.appendChild(kvItem(T('已用空间'), mb + ' MB' + q));
      });
    };
    refresh();

    const row = Util.el('div', { class: 'btn-row', style: 'margin-top:10px' });
    row.appendChild(Util.el('button', { class: 'btn', onclick: backupToFolder }, T('⇩ 备份到文件夹')));
    if (Storage.mode === 'http') {
      const dirI = Util.el('input', { type: 'text', class: 'inp', placeholder: T('新数据目录绝对路径'), style: 'min-width:220px' });
      row.appendChild(dirI);
      row.appendChild(Util.el('button', { class: 'btn', onclick: () => {
        const d = dirI.value.trim(); if (!d) return;
        Storage.setConfig({ dataDir: d }).then(() => { Util.toast(T('数据已迁移至：') + d, 'ok'); refresh(); }).catch((e) => Util.toast(T('迁移失败：') + (e && e.message || e), 'err'));
      } }, T('迁移数据到该目录')));
    }
    panel.appendChild(row);
    panel.appendChild(Util.el('div', { class: 'tip', style: 'margin-top:8px', text: T('数据以 JSON/文件形式自主存储，复制该目录即可备份与迁移；「备份到文件夹」需浏览器支持文件夹选择（File System Access API），否则自动降级为下载。') }));
    return panel;
  }
  // 备份到用户选定的文件夹（File System Access API），不支持则降级为下载
  function backupToFolder() {
    if (!Storage.supports.fsaccess) { exportBackup(); return; }
    DB.exportFull().then((json) => {
      return window.showDirectoryPicker().then(async (dirHandle) => {
        const fileHandle = await dirHandle.getFileHandle('iar-backup-' + Util.fmtDate(Date.now()) + '.json', { create: true });
        const w = await fileHandle.createWritable();
        await w.write(json);
        await w.close();
        Util.toast(T('已备份到所选文件夹'), 'ok');
      });
    }).catch((e) => { if (e && e.name !== 'AbortError') Util.toast(T('备份失败：') + (e && e.message || e), 'err'); });
  }

  function exportBackup() {
    DB.exportFull().then((json) => {
      const blob = new Blob([json], { type: 'application/json' });
      Util.download(blob, T('供应商预审平台数据备份_') + Util.fmtDate(Date.now()) + '.json');
      Util.toast(T('备份已导出（含附件与版本）'), 'ok');
    }).catch((e) => Util.toast(T('备份失败：') + e.message, 'err'));
  }
  function importBackup() {
    const inp = Util.el('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
    inp.addEventListener('change', () => {
      const file = inp.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        DB.importFull(reader.result).then(() => {
          Util.toast(T('数据已恢复'), 'ok');
          App.navigate('dashboard');
        }).catch((e) => Util.toast(T('导入失败：') + e.message, 'err'));
      };
      reader.readAsText(file);
    });
    document.body.appendChild(inp);
    inp.click();
    setTimeout(() => document.body.removeChild(inp), 1500);
  }
  function resetAll() {
    Util.confirm(T('清空全部数据'), T('此操作将删除<b>所有</b>供应商、问卷与评估记录，且不可恢复。建议先导出备份。确认清空？'), T('确认清空')).then((ok) => {
      if (!ok) return;
      DB.reset();
      Util.toast(T('已清空，已恢复默认模板'), 'ok');
      App.navigate('dashboard');
    });
  }

  // ---------- 当前用户徽标 / 退出 ----------
  function refreshUserChip() {
    const u = Auth.currentUser();
    const chip = document.getElementById('userChip');
    const logout = document.getElementById('btnLogout');
    if (!chip || !logout) return;
    if (u) {
      chip.innerHTML = '';
      chip.appendChild(Util.el('span', { class: 'user-ava', text: ((u.displayName || u.username || '?').slice(0, 1)).toUpperCase() }));
      chip.appendChild(Util.el('span', { class: 'user-name', text: u.displayName || u.username }));
      chip.appendChild(Util.el('span', { class: 'user-role ' + (u.role === 'admin' ? 'role-admin' : (u.role === 'manager' ? 'role-readonly' : 'role-user')), text: Auth.roleLabel(u.role) }));
      chip.style.display = '';
      logout.style.display = '';
      logout.onclick = () => { Auth.logout(); location.reload(); };
    } else {
      chip.style.display = 'none';
      logout.style.display = 'none';
    }
  }

  // ---------- Service Worker 注册已迁移至 pwa/register-sw.js（统一管理，含跨浏览器兼容与更新提示） ----------

  // ---------- 兼容性检测 + 降级提示 ----------
  function checkCompat() {
    const foot = document.querySelector('.sidebar-foot');
    if (!foot) return;
    const hint = foot.querySelector('.brand-hint');
    const msgs = [];
    if (!Storage.supports.secure) msgs.push(T('当前以 file:// 打开，已降级为浏览器本地存储；运行内置轻量后端可启用文件夹选择与离线加速。'));
    else if (Storage.mode === 'idb') msgs.push(T('正在使用浏览器本地存储（IndexedDB）；如需数据以 JSON 文件自主存储，请运行内置轻量后端。'));
    else msgs.push(T('数据以 JSON 文件自主存储于：') + Storage.dataDir);
    if (!Storage.supports.fsaccess) msgs.push(T('当前浏览器不支持文件夹选择（File System Access API），备份将使用下载目录。'));
    if (hint) hint.textContent = msgs.join(' ');
  }

  App.refreshStorageStat = function () {
    const el = document.getElementById('storageStat');
    if (!el) return;
    const modeLabel = Storage.mode === 'http' ? T('JSON 文件') : T('浏览器本地');
    const loc = Storage.mode === 'http' ? (' · ' + Storage.dataDir) : '';
    DB.storageEstimate().then((e) => {
      const mb = (e.usage || 0) / (1024 * 1024);
      const q = e.quota ? ' / ' + (e.quota / (1024 * 1024)).toFixed(0) + ' MB' : '';
      el.textContent = T('存储：') + modeLabel + ' ' + mb.toFixed(1) + ' MB' + q + loc;
    }).catch(() => { el.textContent = T('存储：') + modeLabel + loc; });
  };

  global.App = App;

  document.addEventListener('DOMContentLoaded', () => App.init());
})(window);
