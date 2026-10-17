/* ==========================================================================
   core.js — 内容结构 / 默认值 / 小工具（前台站与后台编辑器共用）
   纯原生 JS，无任何依赖。
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------------
     1. 内容默认值 = 整个网站的数据结构定义
        后台所有输入框都按这份结构的路径写入，所以这里就是"数据库表结构"。
     --------------------------------------------------------------------- */
  var DEFAULTS = {
    meta: {
      lang: 'zh-CN',
      title: '你的名字 — 作品集',
      description: '个人作品集：品牌、产品与交互设计。',
      accent: '#b5471f',
      theme: 'auto',        // auto | light | dark
      themeToggle: true,    // 是否在导航栏显示明暗切换按钮
      font: 'serif'         // serif | sans —— 标题字体风格
    },

    profile: {
      name: '你的名字',
      latin: 'YOUR NAME',
      role: '设计师 / 开发者',
      avatar: 'assets/img/avatar.svg',
      location: '中国 · 城市',
      email: 'hello@example.com',
      bio: '这里放一句自我介绍。',
      socials: [
        { label: 'GitHub', url: 'https://github.com/' },
        { label: '即刻', url: 'https://web.okjike.com/' },
        { label: '小红书', url: 'https://www.xiaohongshu.com/' }
      ]
    },

    hero: {
      eyebrow: 'PORTFOLIO · 2026',
      headline: '把想法做成可以触摸的东西。',
      subline: '我是一名跨设计与开发的创作者，关注信息如何被更好地组织、表达与使用。目前在做品牌视觉与数字产品。',
      primary: { label: '查看作品', url: '#work' },
      secondary: { label: '联系我', url: '#contact' },
      stats: [
        { value: '06', label: '精选项目' },
        { value: '08', label: '年经验' },
        { value: '03', label: '长期客户' }
      ]
    },

    work: {
      label: '作品 / WORK',
      heading: '精选项目',
      desc: '每一个项目都是从问题出发的完整推演：调研、定义、设计、落地。'
    },

    projects: [
      {
        title: '项目名称 01',
        subtitle: '品牌视觉识别系统',
        category: '品牌设计',
        year: '2026',
        cover: 'assets/img/cover-1.svg',
        summary: '为一个新消费品牌建立从标志、字体到包装的完整视觉语言。',
        body: '项目背景：客户希望摆脱品类里常见的高饱和视觉，用更克制的方式建立辨识度。\n\n我的角色：从品牌策略到视觉落地的全程负责人。\n\n- 建立以网格为核心的标志系统\n- 设计一套可变字体排版规范\n- 输出 60 页品牌手册\n\n结果：上线三个月内，品牌在社交媒体的自我识别度显著提升。',
        tags: ['Branding', 'Editorial', 'Type'],
        link: '',
        repo: '',
        featured: true
      },
      {
        title: '项目名称 02',
        subtitle: '移动端产品设计',
        category: '产品设计',
        year: '2025',
        cover: 'assets/img/cover-2.svg',
        summary: '重构一款记录类应用的核心流程，把七步操作压缩到三步。',
        body: '这是一段项目说明。空行分段，行首加「- 」会变成列表。\n\n- 梳理真实使用场景，砍掉 40% 的表单字段\n- 设计可撤销的即时保存机制\n- 与工程一起把首屏时间压到 1 秒内',
        tags: ['Product', 'Mobile', 'Research'],
        link: '',
        repo: '',
        featured: false
      },
      {
        title: '项目名称 03',
        subtitle: '交互式数据叙事',
        category: '交互开发',
        year: '2025',
        cover: 'assets/img/cover-3.svg',
        summary: '用滚动驱动的图形叙事，解释一组复杂的时间序列数据。',
        body: '技术栈：原生 JS + Canvas + 少量 WebGL。\n\n重点在于让图形在滚动中"说话"，而不是堆叠图表。',
        tags: ['Canvas', 'DataViz', 'Motion'],
        link: '',
        repo: '',
        featured: false
      },
      {
        title: '项目名称 04',
        subtitle: '编辑设计实验',
        category: '平面设计',
        year: '2024',
        cover: 'assets/img/cover-4.svg',
        summary: '一本关于城市声音的独立杂志，96 页，双色印刷。',
        body: '从选题、约稿、编辑到印刷跟单全部参与。\n\n印刷：双色 Riso，纸张选用 100g 胶版纸。',
        tags: ['Print', 'Riso', 'Editorial'],
        link: '',
        repo: '',
        featured: false
      },
      {
        title: '项目名称 05',
        subtitle: '摄影与影像',
        category: '摄影',
        year: '2024',
        cover: 'assets/img/cover-5.svg',
        summary: '一组关于夜间工作空间的影像记录，共 24 张。',
        body: '拍摄周期三个月，使用 35mm 胶片。',
        tags: ['Photography', 'Film'],
        link: '',
        repo: '',
        featured: false
      },
      {
        title: '项目名称 06',
        subtitle: '个人工具与实验',
        category: '实验',
        year: '2023',
        cover: 'assets/img/cover-6.svg',
        summary: '几个自己每天在用的小工具，从想法到上线不超过一周。',
        body: '这些小项目的共同点是：先做出来，再决定要不要做得更好。',
        tags: ['Tooling', 'Weekend'],
        link: '',
        repo: '',
        featured: false
      }
    ],

    about: {
      label: '关于 / ABOUT',
      heading: '你好，我是你的名字',
      paragraphs: [
        '我在设计与开发之间来回走动，喜欢把事情从模糊的想法一路推到可以使用的状态。',
        '过去几年我做过品牌、产品界面、数据可视化，也做过印刷物。这些媒介看起来不同，但我关心的东西是一样的：信息如何被准确地组织，又如何被人轻松地理解。',
        '工作之外，我拍照、骑车、收集旧书。'
      ],
      skills: [
        { group: '设计', items: ['品牌视觉', '界面设计', '排版', '设计系统'] },
        { group: '开发', items: ['HTML / CSS', 'JavaScript', 'Node.js', 'Three.js'] },
        { group: '工具', items: ['Figma', 'Illustrator', 'Blender', 'Git'] }
      ],
      timeline: [
        { year: '2024 — 现在', title: '独立设计师 / 开发者', desc: '为自己的客户做品牌与产品项目。' },
        { year: '2021 — 2024', title: '某公司 · 高级设计师', desc: '负责核心产品的设计系统与体验。' },
        { year: '2018 — 2021', title: '某工作室 · 设计师', desc: '品牌与视觉传达项目。' }
      ]
    },

    contact: {
      label: '联系 / CONTACT',
      heading: '有项目想聊聊？',
      text: '我目前在接少量的独立项目。如果你有一个想法，或者只是想打个招呼，发邮件给我最直接。',
      email: 'hello@example.com',
      note: '通常会在 24 小时内回复。',
      socials: [
        { label: 'GitHub', url: 'https://github.com/' },
        { label: '即刻', url: 'https://web.okjike.com/' }
      ]
    },

    footer: {
      note: '手工搭的，没有用模板。',
      copyright: '© 2026 你的名字',
      showEdit: true
    }
  };

  /* ---------------------------------------------------------------------
     2. 工具函数
     --------------------------------------------------------------------- */
  function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }

  function clone(v) {
    if (Array.isArray(v)) return v.map(clone);
    if (isObj(v)) return JSON.parse(JSON.stringify(v));
    return v;
  }

  function deepMerge(target, src) {
    if (!isObj(src)) return target;
    Object.keys(src).forEach(function (key) {
      var v = src[key];
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        target[key] = clone(v);
      } else if (isObj(v)) {
        if (!isObj(target[key])) target[key] = {};
        deepMerge(target[key], v);
      } else {
        target[key] = v;
      }
    });
    return target;
  }

  /** 用默认值补齐任意（可能残缺的）内容对象 */
  function merge(content) {
    return deepMerge(clone(DEFAULTS), content || {});
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 极简富文本：空行分段，行首 "- " 或 "• " 变成列表 */
  function richText(text) {
    var src = String(text == null ? '' : text).replace(/\r\n/g, '\n').trim();
    if (!src) return '';
    return src.split(/\n{2,}/).map(function (block) {
      var lines = block.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) return '';
      var allBullets = lines.every(function (l) { return /^[-*•]\s+/.test(l); });
      if (allBullets) {
        return '<ul>' + lines.map(function (l) {
          return '<li>' + escapeHtml(l.replace(/^[-*•]\s+/, '')) + '</li>';
        }).join('') + '</ul>';
      }
      return '<p>' + lines.map(escapeHtml).join('<br>') + '</p>';
    }).join('');
  }

  function getPath(obj, path) {
    return String(path).split('.').reduce(function (o, k) {
      return (o == null) ? undefined : o[k];
    }, obj);
  }

  function setPath(obj, path, val) {
    var keys = String(path).split('.');
    var last = keys.pop();
    var target = keys.reduce(function (o, k) {
      if (o[k] == null) o[k] = /^\d+$/.test(k) ? [] : {};
      return o[k];
    }, obj);
    target[last] = val;
    return obj;
  }

  function uid() {
    return 'p' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  }

  /** 把 "#b5471f" 之类的颜色转成同色系的柔和底色 */
  function withAlpha(hex, alpha) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return 'rgba(0,0,0,' + alpha + ')';
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  global.PF = {
    DEFAULTS: DEFAULTS,
    merge: merge,
    clone: clone,
    isObj: isObj,
    escapeHtml: escapeHtml,
    richText: richText,
    getPath: getPath,
    setPath: setPath,
    uid: uid,
    withAlpha: withAlpha
  };
})(window);
