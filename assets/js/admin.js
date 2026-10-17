/* ==========================================================================
   admin.js — 作品集控制台
   浏览器内编辑 → 实时预览 → 一键提交到 GitHub（GitHub Pages 自动重建）
   无框架、无依赖。
   ========================================================================== */
(function () {
  'use strict';

  var PF = window.PF;
  var esc = PF.escapeHtml;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var KEY = {
    settings: 'pf.settings',
    draft: 'pf.draft',
    draftTime: 'pf.draft.time',
    auth: 'pf.auth.local',
    unlocked: 'pf.unlocked',
    session: 'pf.unlocked.session'
  };

  var PBKDF2_ITER = 310000;

  var state = {
    draft: PF.merge(window.SITE_CONTENT || {}),
    origin: '',
    section: 'profile',
    open: {},
    settings: { owner: '', repo: '', branch: 'main', token: '', message: '更新作品集内容' },
    busy: false,
    pendingRestore: null,
    pendingTime: '',
    uploadTarget: null
  };

  /* ======================================================================
     分区定义
     ====================================================================== */
  var SECTIONS = [
    { id: 'profile', title: '基本信息' },
    { id: 'hero', title: '首屏' },
    { id: 'projects', title: '作品' },
    { id: 'about', title: '关于' },
    { id: 'contact', title: '联系' },
    { id: 'appearance', title: '外观' },
    { id: 'account', title: '账号与发布', sep: true }
  ];

  var TPL = {
    'profile.socials': function () { return { label: '新链接', url: 'https://' }; },
    'hero.stats': function () { return { value: '00', label: '标签' }; },
    'projects': function () {
      return {
        title: '新项目', subtitle: '', category: '分类',
        year: String(new Date().getFullYear()), cover: '', summary: '',
        body: '', tags: [], link: '', repo: '', featured: false
      };
    },
    'about.paragraphs': function () { return ''; },
    'about.skills': function () { return { group: '新分组', items: [] }; },
    'about.timeline': function () { return { year: '2026', title: '新的经历', desc: '' }; },
    'contact.socials': function () { return { label: '新链接', url: 'https://' }; }
  };

  /* ======================================================================
     表单零件
     ====================================================================== */
  function f(label, control, hint) {
    return '<div class="f"><div class="fl">' + esc(label) +
      (hint ? '<em>' + esc(hint) + '</em>' : '') + '</div>' +
      '<div class="fc">' + control + '</div></div>';
  }

  function txt(path, ph) {
    return '<input class="fld" type="text" data-path="' + path + '" placeholder="' + esc(ph || '') + '">';
  }

  function area(path, rows, ph) {
    return '<textarea class="fld" rows="' + (rows || 4) + '" data-path="' + path +
      '" placeholder="' + esc(ph || '') + '"></textarea>';
  }

  function csv(path, ph) {
    return '<input class="fld" type="text" data-path="' + path + '" data-type="csv" placeholder="' +
      esc(ph || '') + '">';
  }

  function sel(path, opts) {
    return '<select class="fld" data-path="' + path + '">' + opts.map(function (o) {
      return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>';
    }).join('') + '</select>';
  }

  function chk(path, label) {
    return '<label class="chk"><input type="checkbox" class="fld" data-path="' + path +
      '" data-type="bool"> <span>' + esc(label) + '</span></label>';
  }

  function img(path) {
    return '<div class="imgf"><div class="prev" data-img="' + path + '"></div>' +
      '<div class="acts">' +
        '<div class="row">' +
          '<button class="btn xs" type="button" data-act="upload" data-path="' + path + '">上传图片</button>' +
          '<button class="btn xs" type="button" data-act="clearimg" data-path="' + path + '">清除</button>' +
        '</div>' +
        '<input class="fld" type="text" data-path="' + path + '" placeholder="或直接填图片地址" style="font:12px var(--mono)">' +
      '</div></div>';
  }

  function pad2(n) { return String(n + 1).padStart(2, '0'); }

  function cut(s, n) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n) + '…' : (s || '（空）');
  }

  function list(path, items, itemFn, opts) {
    opts = opts || {};
    var arr = items || [];
    var body = arr.map(function (it, i) {
      var p = path + '.' + i;
      var key = path + ':' + i;
      var closed = opts.collapsible && !state.open[key];
      var label = opts.headText ? opts.headText(it, i) : ('第 ' + (i + 1) + ' 项');
      var head = opts.collapsible
        ? '<button class="item-toggle" type="button" data-act="toggle" data-key="' + key + '">' +
          '<span class="t">' + esc(label) + '</span><span class="chev">▾</span></button>'
        : '<span class="t">' + esc(label) + '</span>';
      return '<div class="item' + (closed ? ' collapsed' : '') + '" data-idx="' + i + '">' +
        '<div class="item-head">' + head +
          '<div class="item-tools">' +
            '<button class="ibtn" type="button" data-act="up" data-list="' + path + '" data-i="' + i + '" title="上移">↑</button>' +
            '<button class="ibtn" type="button" data-act="down" data-list="' + path + '" data-i="' + i + '" title="下移">↓</button>' +
            '<button class="ibtn danger" type="button" data-act="del" data-list="' + path + '" data-i="' + i + '" title="删除">✕</button>' +
          '</div>' +
        '</div>' +
        '<div class="item-body">' + itemFn(it, p, i) + '</div>' +
      '</div>';
    }).join('');

    return '<div class="list">' +
      '<div class="list-head"><span class="list-t">' + esc(opts.title || '') + '</span>' +
        '<button class="btn xs" type="button" data-act="add" data-list="' + path + '">+ 添加</button>' +
      '</div>' +
      (body || '<div class="empty">还没有内容，点「+ 添加」</div>') +
    '</div>';
  }

  function secHead(title, desc) {
    return '<div class="sec-head"><h2>' + esc(title) + '</h2>' +
      (desc ? '<p>' + esc(desc) + '</p>' : '') + '</div>';
  }

  /* ======================================================================
     各分区内容
     ====================================================================== */
  function secProfile() {
    var d = state.draft.profile;
    return secHead('基本信息', '决定导航栏、头像和自我介绍。改完右边立刻能看到。') +
      '<div class="card"><h3>身份</h3>' +
        f('姓名', txt('profile.name', '你的名字')) +
        f('英文名', txt('profile.latin', 'YOUR NAME'), '导航栏里的小字') +
        f('身份', txt('profile.role', '设计师 / 开发者')) +
        f('城市', txt('profile.location', '中国 · 杭州')) +
        f('邮箱', txt('profile.email', 'you@example.com')) +
        f('头像', img('profile.avatar'), '正方形最好看') +
      '</div>' +
      '<div class="card"><h3>社交链接</h3>' +
        list('profile.socials', d.socials, function (it, p) {
          return f('名称', txt(p + '.label', 'GitHub')) + f('链接', txt(p + '.url', 'https://'));
        }, { title: '链接列表', headText: function (it) { return it.label || '未命名'; } }) +
      '</div>';
  }

  function secHero() {
    var d = state.draft.hero;
    return secHead('首屏', '访客打开网站第一眼看到的内容。') +
      '<div class="card"><h3>文案</h3>' +
        f('眉标', txt('hero.eyebrow', 'PORTFOLIO · 2026'), '标题上方的小字') +
        f('大字标题', txt('hero.headline', '把想法做成可以触摸的东西。'), '一句话主张，越长字号会越小') +
        f('补充说明', area('hero.subline', 3), '两行以内最好') +
      '</div>' +
      '<div class="card"><h3>按钮</h3>' +
        f('主按钮文字', txt('hero.primary.label', '查看作品')) +
        f('主按钮链接', txt('hero.primary.url', '#work')) +
        f('次按钮文字', txt('hero.secondary.label', '联系我')) +
        f('次按钮链接', txt('hero.secondary.url', '#contact')) +
      '</div>' +
      '<div class="card"><h3>数字栏</h3>' +
        list('hero.stats', d.stats, function (it, p) {
          return f('数值', txt(p + '.value', '06')) + f('说明', txt(p + '.label', '精选项目'));
        }, { title: '数字', headText: function (it) { return (it.value || '--') + ' · ' + (it.label || ''); } }) +
      '</div>';
  }

  function secProjects() {
    var d = state.draft.projects;
    return secHead('作品', '每个项目是一张卡片，点开有详情。用 ↑ ↓ 调顺序，勾选「首屏大图」的项目会占满整行。') +
      '<div class="card">' +
        list('projects', d, function (it, p) {
          return f('标题', txt(p + '.title', '项目名称')) +
            f('副标题', txt(p + '.subtitle', '一句话品类说明')) +
            f('分类', txt(p + '.category', '品牌设计')) +
            f('年份', txt(p + '.year', '2026')) +
            f('封面图', img(p + '.cover')) +
            f('卡片摘要', area(p + '.summary', 2), '显示在卡片上的两行字') +
            f('详细内容', area(p + '.body', 8), '空行分段；行首写「- 」会变成列表') +
            f('标签', csv(p + '.tags'), '用逗号分隔，例如 Branding, Print') +
            f('在线地址', txt(p + '.link', 'https://'), '可留空') +
            f('源码地址', txt(p + '.repo', 'https://github.com/...'), '可留空') +
            f('', chk(p + '.featured', '设为整行大图（建议只留一个）'));
        }, {
          title: '项目列表',
          collapsible: true,
          headText: function (it, i) { return pad2(i) + ' · ' + (it.title || '未命名'); }
        }) +
      '</div>';
  }

  function secAbout() {
    var d = state.draft.about;
    return secHead('关于', '左栏是正文，右栏是能力与经历。') +
      '<div class="card"><h3>标题</h3>' +
        f('小标签', txt('about.label', '关于 / ABOUT')) +
        f('大标题', txt('about.heading', '你好，我是……')) +
      '</div>' +
      '<div class="card"><h3>正文</h3>' +
        list('about.paragraphs', d.paragraphs, function (it, p) {
          return area(p, 4, '一段文字，空行分段');
        }, { title: '段落', headText: function (it) { return cut(it, 36); } }) +
      '</div>' +
      '<div class="card"><h3>能力</h3>' +
        list('about.skills', d.skills, function (it, p) {
          return f('分组名', txt(p + '.group', '设计')) +
            f('条目', csv(p + '.items'), '用逗号分隔');
        }, { title: '能力分组', headText: function (it) { return it.group || '未命名'; } }) +
      '</div>' +
      '<div class="card"><h3>经历</h3>' +
        list('about.timeline', d.timeline, function (it, p) {
          return f('时间', txt(p + '.year', '2024 — 现在')) +
            f('头衔', txt(p + '.title', '独立设计师')) +
            f('说明', txt(p + '.desc', '做了什么')) ;
        }, { title: '时间线', headText: function (it) { return (it.year || '') + ' · ' + (it.title || ''); } }) +
      '</div>';
  }

  function secContact() {
    var d = state.draft.contact;
    return secHead('联系', '最后一段话，让人知道怎么找你。') +
      '<div class="card"><h3>文案</h3>' +
        f('小标签', txt('contact.label', '联系 / CONTACT')) +
        f('大标题', txt('contact.heading', '有项目想聊聊？')) +
        f('说明', area('contact.text', 3)) +
        f('邮箱', txt('contact.email'), '会变成可点击的邮件链接') +
        f('小字备注', txt('contact.note', '通常会在 24 小时内回复。')) +
      '</div>' +
      '<div class="card"><h3>社交链接</h3>' +
        list('contact.socials', d.socials, function (it, p) {
          return f('名称', txt(p + '.label')) + f('链接', txt(p + '.url', 'https://'));
        }, { title: '链接列表', headText: function (it) { return it.label || '未命名'; } }) +
      '</div>';
  }

  function secAppearance() {
    var accents = ['#b5471f', '#1d4ed8', '#0f766e', '#7c3aed', '#a16207', '#17130f'];
    var sw = accents.map(function (c) {
      return '<button type="button" class="swatch" data-act="accent" data-v="' + c +
        '" style="background:' + c + '" aria-label="主色 ' + c + '"></button>';
    }).join('');

    return secHead('外观', '主色、明暗和标题字体是整站共用的。') +
      '<div class="card"><h3>颜色</h3>' +
        f('主色', '<div style="display:flex;gap:8px;align-items:center">' +
            '<input class="fld" type="color" data-path="meta.accent" style="flex:0 0 52px;padding:3px">' +
            '<input class="fld" type="text" data-path="meta.accent" style="font:12px var(--mono)">' +
          '</div>') +
        f('常用色', '<div class="stars">' + sw + '</div>') +
      '</div>' +
      '<div class="card"><h3>主题</h3>' +
        f('默认模式', sel('meta.theme', [['auto', '跟随系统'], ['light', '浅色'], ['dark', '深色']])) +
        f('明暗按钮', chk('meta.themeToggle', '在导航栏显示手动切换按钮')) +
        f('标题字体', sel('meta.font', [['serif', '衬线体（优雅）'], ['sans', '无衬线体（现代）']])) +
      '</div>' +
      '<div class="card"><h3>浏览器信息</h3>' +
        f('语言', txt('meta.lang', 'zh-CN')) +
        f('页面标题', txt('meta.title'), '浏览器标签上的文字，也是搜索结果标题') +
        f('页面描述', area('meta.description', 2), '分享链接时显示的一句话') +
      '</div>' +
      '<div class="card"><h3>页脚</h3>' +
        f('版权行', txt('footer.copyright')) +
        f('小字说明', txt('footer.note')) +
        f('后台入口', chk('footer.showEdit', '在页脚显示「EDIT」小链接，方便自己找到后台')) +
      '</div>';
  }

  function secAccount() {
    return secHead('账号与发布', '发布 = 把当前内容提交到 GitHub 仓库，GitHub Pages 会自动重新构建（约 1 分钟）。') +
      '<div class="card"><h3>GitHub 发布设置</h3>' +
        '<div class="note">只需要一个「细粒度令牌」：权限选 <b>Contents: Read and write</b>，只授权这一个仓库。' +
        '设置保存在这台电脑的浏览器里，不会写进网站文件，也不会被别人看到。' +
        '<ol>' +
          '<li>GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens</li>' +
          '<li>Repository access 选 Only select repositories → 选中你的仓库</li>' +
          '<li>Permissions → Repository permissions → Contents: Read and write</li>' +
        '</ol></div>' +
        f('用户名', '<input class="fld" data-setting="owner" placeholder="github 用户名，例如 octocat">') +
        f('仓库名', '<input class="fld" data-setting="repo" placeholder="例如 my-portfolio">') +
        f('分支', '<input class="fld" data-setting="branch" placeholder="main">', '不确定就填 main') +
        f('令牌', '<input class="fld" type="password" data-setting="token" placeholder="github_pat_…" autocomplete="off">') +
        f('提交说明', '<input class="fld" data-setting="message" placeholder="更新作品集内容">') +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">' +
          '<button class="btn" type="button" data-act="test">测试连接</button>' +
          '<button class="btn" type="button" data-act="savesettings">保存设置</button>' +
          '<button class="btn primary" type="button" data-act="publish">立即发布</button>' +
        '</div>' +
        '<div class="hint" id="pub-state"></div>' +
      '</div>' +
      '<div class="card"><h3>访问密码</h3>' +
        '<div class="note">改密码会生成新的 <code>data/auth.js</code> 并发布。文件里只存 PBKDF2 指纹，不存密码本身。' +
        '忘记密码就把仓库里的 <code>data/auth.js</code> 删掉，后台会自动回到默认密码。</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">' +
          '<input class="fld" type="password" id="pw1" placeholder="新密码（至少 10 位）" style="flex:1;min-width:160px">' +
          '<input class="fld" type="password" id="pw2" placeholder="再输入一次" style="flex:1;min-width:160px">' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
          '<button class="btn" type="button" data-act="setpw">生成并发布</button>' +
          '<button class="btn" type="button" data-act="dlpw">只下载 auth.js</button>' +
        '</div>' +
      '</div>' +
      '<div class="card"><h3>备份与恢复</h3>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn" type="button" data-act="export">导出 content.js</button>' +
          '<button class="btn" type="button" data-act="import">导入备份</button>' +
          '<button class="btn danger" type="button" data-act="reset">恢复默认内容</button>' +
        '</div>' +
        '<div class="hint">导出的是当前草稿（含未发布的修改），可以当成本地备份。</div>' +
      '</div>' +
      '<div class="card"><h3>会话</h3>' +
        '<button class="btn" type="button" data-act="logout">锁定控制台</button>' +
      '</div>';
  }

  var SEC = {
    profile: secProfile,
    hero: secHero,
    projects: secProjects,
    about: secAbout,
    contact: secContact,
    appearance: secAppearance,
    account: secAccount
  };

  /* ======================================================================
     渲染
     ====================================================================== */
  function bannerHTML() {
    if (!state.pendingRestore) return '';
    return '<div class="banner"><span class="grow">这台电脑上有一份未发布的草稿' +
      (state.pendingTime ? '（' + esc(state.pendingTime) + '）' : '') + '，要恢复吗？</span>' +
      '<button class="btn xs" type="button" data-act="restore">恢复</button>' +
      '<button class="btn xs" type="button" data-act="discard">丢弃</button></div>';
  }

  function render() {
    var rail = $('#rail');
    if (rail) {
      rail.innerHTML = SECTIONS.map(function (s, i) {
        return (s.sep ? '<div class="rail-sep"></div>' : '') +
          '<button class="rail-item' + (s.id === state.section ? ' on' : '') +
          '" type="button" data-sec="' + s.id + '">' +
          '<span class="no">' + pad2(i) + '</span>' + esc(s.title) + '</button>';
      }).join('');
    }

    var host = $('#editor');
    if (!host) return;
    var body = (SEC[state.section] || secProfile)();
    host.innerHTML = bannerHTML() + body;
    hydrate(host);
    if (state.section === 'account') updatePubState();
    updateStatus();
  }

  function hydrate(root) {
    $$('[data-path]', root).forEach(function (el) {
      var p = el.dataset.path;
      var t = el.dataset.type;
      var v = PF.getPath(state.draft, p);
      if (t === 'bool') { el.checked = !!v; return; }
      if (t === 'csv') { el.value = Array.isArray(v) ? v.join(', ') : (v == null ? '' : String(v)); return; }
      el.value = v == null ? '' : String(v);
    });

    $$('[data-img]', root).forEach(function (el) {
      var v = PF.getPath(state.draft, el.dataset.img);
      el.innerHTML = v ? '<img alt="" src="' + esc(v) + '">' : '未设置';
    });

    $$('[data-setting]', root).forEach(function (el) {
      el.value = state.settings[el.dataset.setting] || '';
    });
  }

  function updateStatus() {
    var pill = $('#status');
    if (!pill) return;
    var dirty;
    try { dirty = JSON.stringify(state.draft) !== state.origin; } catch (e) { dirty = true; }
    var connected = !!(state.settings.owner && state.settings.repo && state.settings.token);
    if (dirty) {
      pill.textContent = '未发布的修改';
      pill.className = 'pill dirty';
    } else if (!connected) {
      pill.textContent = '未连接 GitHub';
      pill.className = 'pill off';
    } else {
      pill.textContent = '已同步';
      pill.className = 'pill';
    }
  }

  function updatePubState() {
    var el = $('#pub-state');
    if (!el) return;
    var s = state.settings;
    if (!s.owner || !s.repo) { el.textContent = '还没有填写仓库信息。'; return; }
    if (!s.token) { el.textContent = '还没有填令牌，填完点「保存设置」。'; return; }
    el.innerHTML = '目标：<code>' + esc(s.owner) + '/' + esc(s.repo) + '</code> @ <code>' +
      esc(s.branch || 'main') + '</code> · 网站发布后约 1 分钟内生效。';
  }

  /* ======================================================================
     提示
     ====================================================================== */
  var toastTimer = null;
  function toast(msg, kind) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast on' + (kind === 'err' ? ' err' : kind === 'ok' ? ' ok' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, kind === 'err' ? 5200 : 3200);
  }

  /* ======================================================================
     预览
     ====================================================================== */
  var pvTimer = null;
  var pvTarget = 1440;

  /** 预览按真实宽度渲染，再等比缩放到面板里，所见即线上 */
  function layoutPreview() {
    var stage = $('#pvStage');
    var holder = $('#pvHolder');
    if (!stage || !holder) return;
    var w = stage.clientWidth - 24;
    var h = stage.clientHeight - 24;
    if (w <= 20 || h <= 20) return;
    var scale = Math.min(1, w / pvTarget);
    var vw = pvTarget * scale;
    holder.style.width = pvTarget + 'px';
    holder.style.height = Math.round(h / scale) + 'px';
    holder.style.transform = 'scale(' + scale + ')';
    holder.style.left = (12 + Math.max(0, (w - vw) / 2)) + 'px';
  }

  function postPreview() {
    var frame = $('#pv');
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage({ type: 'pf-draft', content: state.draft }, '*');
    } catch (e) { /* ignore */ }
  }

  function schedulePreview() {
    clearTimeout(pvTimer);
    pvTimer = setTimeout(postPreview, 200);
  }

  /* ======================================================================
     本地草稿
     ====================================================================== */
  var saveTimer = null;

  function scheduleAutosave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(KEY.draft, JSON.stringify(state.draft));
        localStorage.setItem(KEY.draftTime, new Date().toLocaleString('zh-CN'));
      } catch (e) {
        toast('草稿太大，浏览器存不下（图片多了会这样）。请尽快发布，或用「导出 content.js」备份。', 'err');
      }
    }, 700);
  }

  function markDirty() {
    updateStatus();
    scheduleAutosave();
  }

  /* ======================================================================
     密码
     ====================================================================== */
  function toHex(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
    return out;
  }

  function fromHex(hex) {
    var out = new Uint8Array(hex.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  function bytesToB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  async function pbkdf2Hash(password, saltBytes, iterations) {
    if (!window.crypto || !crypto.subtle) {
      throw new Error('这个浏览器环境不支持加密接口，请用 http(s) 打开本页面');
    }
    var key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
    );
    var bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations: iterations, hash: 'SHA-256' },
      key, 256
    );
    return bytesToB64(new Uint8Array(bits));
  }

  function currentAuth() {
    var local = localStorage.getItem(KEY.auth);
    if (local) {
      try { return JSON.parse(local); } catch (e) { /* fallthrough */ }
    }
    return window.SITE_AUTH || null;
  }

  function slowEqual(a, b) {
    a = String(a || ''); b = String(b || '');
    if (a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  function isUnlocked() {
    var until = Number(localStorage.getItem(KEY.unlocked) || 0);
    if (until > Date.now()) return true;
    try { return sessionStorage.getItem(KEY.session) === '1'; } catch (e) { return false; }
  }

  function lock() {
    localStorage.removeItem(KEY.unlocked);
    try { sessionStorage.removeItem(KEY.session); } catch (e) { /* ignore */ }
    location.reload();
  }

  /* 出厂默认密码的指纹（data/auth.js 初始值）。改过密码后就不再提示默认密码了。 */
  var DEFAULT_HASH = 'ZXZ/DMNTEM3bbGJuPlajloBaM65jlkqVOORgQ78xAik=';

  function bindGate() {
    var form = $('#gate-form');
    var err = $('#gate-err');
    var pw = $('#pw');
    var submit = $('#gate-submit');

    // 密码已经不是默认值（或没有密码文件）时，隐藏「默认密码是 portfolio-2026」的提示，
    // 免得把已经失效的密码写在公开页面上。
    var hint = $('#gate-hint');
    var cfgNow = currentAuth();
    if (hint && (!cfgNow || cfgNow.hash !== DEFAULT_HASH || localStorage.getItem(KEY.auth))) {
      hint.hidden = true;
    }

    $('#toggle-pw').addEventListener('click', function () {
      var showing = pw.type === 'text';
      pw.type = showing ? 'password' : 'text';
      this.textContent = showing ? '显示密码' : '隐藏密码';
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      err.textContent = '';
      var cfg = currentAuth();
      var value = pw.value;

      if (!value) { err.textContent = '请输入密码。'; return; }

      if (!cfg) {
        // 没有 auth.js：视为首次使用，直接进入，并提示去设密码
        unlock(true);
        return;
      }

      submit.disabled = true;
      submit.textContent = '验证中…';
      try {
        var hash = await pbkdf2Hash(value, fromHex(cfg.salt), cfg.iterations || PBKDF2_ITER);
        if (slowEqual(hash, cfg.hash)) {
          if ($('#remember').checked) {
            localStorage.setItem(KEY.unlocked, String(Date.now() + 7 * 24 * 3600 * 1000));
          } else {
            try { sessionStorage.setItem(KEY.session, '1'); } catch (e2) { /* ignore */ }
          }
          unlock(false);
        } else {
          err.textContent = '密码不对，再试一次。';
          $('#gate').classList.add('is-shake');
          setTimeout(function () { $('#gate').classList.remove('is-shake'); }, 420);
          pw.select();
        }
      } catch (ex) {
        err.textContent = ex.message || '验证失败';
      } finally {
        submit.disabled = false;
        submit.textContent = '进入控制台';
      }
    });
  }

  /* ======================================================================
     图片处理
     ====================================================================== */
  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); resolve(im); };
      im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('这张图片读不出来')); };
      im.src = url;
    });
  }

  async function fileToDataUrl(file) {
    var im = await loadImage(file);
    var maxW = 1800;
    var maxH = 1800;
    var ratio = Math.min(1, maxW / im.naturalWidth, maxH / im.naturalHeight);
    var w = Math.max(1, Math.round(im.naturalWidth * ratio));
    var h = Math.max(1, Math.round(im.naturalHeight * ratio));

    var cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    var ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, 0, 0, w, h);

    var data = cv.toDataURL('image/webp', 0.86);
    if (!/^data:image\/webp/.test(data)) {
      // 浏览器不支持 webp 编码时退回 JPEG（先把透明区域填白）
      var cv2 = document.createElement('canvas');
      cv2.width = w; cv2.height = h;
      var x = cv2.getContext('2d');
      x.fillStyle = '#ffffff';
      x.fillRect(0, 0, w, h);
      x.drawImage(im, 0, 0, w, h);
      data = cv2.toDataURL('image/jpeg', 0.86);
    }
    return data;
  }

  /* ======================================================================
     GitHub API
     ====================================================================== */
  function repoBase() {
    var s = state.settings;
    return 'https://api.github.com/repos/' + encodeURIComponent(s.owner) + '/' + encodeURIComponent(s.repo);
  }

  async function api(url, opts) {
    opts = opts || {};
    var headers = {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + state.settings.token,
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (opts.body) headers['Content-Type'] = 'application/json';

    var res = await fetch(url, { method: opts.method || 'GET', headers: headers, body: opts.body });

    if (!res.ok) {
      var msg = res.status + ' ' + res.statusText;
      try {
        var data = await res.json();
        if (data && data.message) msg = data.message;
      } catch (e) { /* ignore */ }
      if (res.status === 401) msg = '令牌无效或已过期（401）';
      if (res.status === 403) msg = '令牌权限不足（403）：需要 Contents: Read and write';
      if (res.status === 404) msg = '找不到仓库或分支（404）：检查用户名、仓库名和分支';
      if (res.status === 409) msg = '仓库状态冲突（409）：稍等一下再试';
      var err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  function b64Utf8(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    var chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  async function sha256Hex(str) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    var bytes = new Uint8Array(buf);
    var out = '';
    for (var i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
    return out;
  }

  function extFromMime(mime) {
    if (/png/i.test(mime)) return 'png';
    if (/jpe?g/i.test(mime)) return 'jpg';
    if (/webp/i.test(mime)) return 'webp';
    if (/gif/i.test(mime)) return 'gif';
    if (/svg/i.test(mime)) return 'svg';
    return 'png';
  }

  /** 把草稿里内嵌的 base64 图片抽成仓库文件，并改写路径 */
  async function extractImages(content) {
    var files = {};

    async function visit(node) {
      var keys = Array.isArray(node) ? node.map(function (_, i) { return i; }) : Object.keys(node);
      for (var n = 0; n < keys.length; n++) {
        var k = keys[n];
        var v = node[k];
        if (typeof v === 'string' && v.indexOf('data:image/') === 0) {
          var m = /^data:([^;]+);base64,([\s\S]*)$/.exec(v);
          if (m) {
            var name = (await sha256Hex(m[2])).slice(0, 16) + '.' + extFromMime(m[1]);
            files['assets/uploads/' + name] = m[2].replace(/\s/g, '');
            node[k] = 'assets/uploads/' + name;
          }
        } else if (v && typeof v === 'object') {
          await visit(v);
        }
      }
    }

    await visit(content);
    return files;
  }

  async function resolveBranch() {
    var branch = state.settings.branch || 'main';
    try {
      var ref = await api(repoBase() + '/git/ref/heads/' + encodeURIComponent(branch));
      return { branch: branch, ref: ref };
    } catch (e) {
      if (e.status === 404 && (!state.settings.branch || state.settings.branch === 'main')) {
        var ref2 = await api(repoBase() + '/git/ref/heads/master');
        return { branch: 'master', ref: ref2 };
      }
      throw e;
    }
  }

  async function commitFiles(files, message) {
    var paths = Object.keys(files);
    if (!paths.length) throw new Error('没有要提交的文件');

    var found = await resolveBranch();
    var parentSha = found.ref.object.sha;
    var headCommit = await api(repoBase() + '/git/commits/' + parentSha);

    var tree = [];
    for (var i = 0; i < paths.length; i++) {
      var blob = await api(repoBase() + '/git/blobs', {
        method: 'POST',
        body: JSON.stringify({ content: files[paths[i]], encoding: 'base64' })
      });
      tree.push({ path: paths[i], mode: '100644', type: 'blob', sha: blob.sha });
    }

    var newTree = await api(repoBase() + '/git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: tree })
    });

    var newCommit = await api(repoBase() + '/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message: message, tree: newTree.sha, parents: [parentSha] })
    });

    await api(repoBase() + '/git/refs/heads/' + encodeURIComponent(found.branch), {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommit.sha })
    });

    return { commit: newCommit, branch: found.branch };
  }

  function setBusy(on, label) {
    state.busy = on;
    var btn = $('#btn-publish');
    if (btn) {
      btn.disabled = on;
      btn.textContent = on ? (label || '发布中…') : '发布';
    }
  }

  async function doPublish() {
    if (state.busy) return;
    var s = state.settings;
    if (!s.owner || !s.repo) { toast('先在「账号与发布」里填用户名和仓库名', 'err'); state.section = 'account'; render(); return; }
    if (!s.token) { toast('还没有填 GitHub 令牌', 'err'); state.section = 'account'; render(); return; }

    setBusy(true, '发布中…');
    try {
      var content = PF.clone(state.draft);
      var files = await extractImages(content);
      var stamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      var text = '/* 由作品集控制台生成 · ' + stamp + ' UTC */\n' +
        'window.SITE_CONTENT = ' + JSON.stringify(content, null, 2) + ';\n';
      files['data/content.js'] = b64Utf8(text);

      var out = await commitFiles(files, s.message || '更新作品集内容');

      state.draft = content;
      state.origin = JSON.stringify(content);
      try { localStorage.removeItem(KEY.draft); } catch (e) { /* ignore */ }
      state.pendingRestore = null;

      setBusy(false);
      render();
      schedulePreview();

      var url = 'https://github.com/' + s.owner + '/' + s.repo + '/commit/' + out.commit.sha;
      toast('发布成功 · ' + Object.keys(files).length + ' 个文件已提交，约 1 分钟后网站更新', 'ok');
      updatePubState();
      var el = $('#pub-state');
      if (el) {
        el.innerHTML = '最近一次提交：<a href="' + url + '" target="_blank" rel="noopener">' +
          esc(out.commit.sha.slice(0, 7)) + '</a> · 分支 <code>' + esc(out.branch) + '</code>';
      }
    } catch (err) {
      setBusy(false);
      toast('发布失败：' + (err.message || err), 'err');
    }
  }

  async function testConnection() {
    var s = state.settings;
    if (!s.owner || !s.repo || !s.token) { toast('用户名、仓库名、令牌都要填', 'err'); return; }
    toast('正在连接 GitHub…');
    try {
      var repo = await api(repoBase());
      var found = await resolveBranch();
      toast('连接成功：' + repo.full_name + '（分支 ' + found.branch + '）', 'ok');
      updatePubState();
    } catch (err) {
      toast('连接失败：' + (err.message || err), 'err');
    }
  }

  /* ======================================================================
     设置读写
     ====================================================================== */
  function loadSettings() {
    try {
      var raw = localStorage.getItem(KEY.settings);
      if (raw) {
        var obj = JSON.parse(raw);
        Object.keys(state.settings).forEach(function (k) {
          if (obj[k] != null) state.settings[k] = obj[k];
        });
      }
    } catch (e) { /* ignore */ }
  }

  function saveSettings(silent) {
    try {
      localStorage.setItem(KEY.settings, JSON.stringify(state.settings));
      if (!silent) toast('设置已保存在这台浏览器', 'ok');
      updateStatus();
      updatePubState();
    } catch (e) {
      toast('设置保存失败', 'err');
    }
  }

  /* ======================================================================
     导出 / 导入
     ====================================================================== */
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/javascript;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }

  function exportContent() {
    var text = '/* 由作品集控制台导出 */\nwindow.SITE_CONTENT = ' +
      JSON.stringify(state.draft, null, 2) + ';\n';
    download('content.js', text);
    toast('已导出 content.js', 'ok');
  }

  function importFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var text = String(reader.result || '');
        var jsonText = text;
        var idx = text.indexOf('window.SITE_CONTENT');
        if (idx >= 0) {
          var start = text.indexOf('{', idx);
          var end = text.lastIndexOf('}');
          if (start < 0 || end <= start) throw new Error('文件里没找到内容对象');
          jsonText = text.slice(start, end + 1);
        }
        var obj = JSON.parse(jsonText);
        state.draft = PF.merge(obj);
        render();
        schedulePreview();
        markDirty();
        toast('已导入，确认没问题后点「发布」', 'ok');
      } catch (e) {
        toast('导入失败：' + e.message, 'err');
      }
    };
    reader.readAsText(file);
  }

  /* ======================================================================
     事件
     ====================================================================== */
  function onEditorInput(e) {
    var el = e.target;

    if (el.dataset && el.dataset.setting) {
      state.settings[el.dataset.setting] = el.value;
      if (el.dataset.setting === 'token') saveSettings(true);
      return;
    }

    var p = el.dataset && el.dataset.path;
    if (!p) return;

    var t = el.dataset.type;
    var v;
    if (t === 'bool') v = el.checked;
    else if (t === 'csv') {
      v = el.value.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean);
    } else v = el.value;

    PF.setPath(state.draft, p, v);

    // 标题变了，同步折叠项的表头文字
    if (/(^|\.)(title|label|group|year)$/.test(p)) {
      var item = el.closest('.item');
      if (item && item.parentNode) {
        var idx = Array.prototype.indexOf.call(item.parentNode.children, item);
        var head = item.querySelector('.item-toggle .t');
        if (head) {
          var base = head.textContent.replace(/^\d{2} · /, '');
          head.textContent = pad2(item.dataset.idx || idx) + ' · ' + cut(v, 24);
        }
      }
    }

    markDirty();
    schedulePreview();
  }

  function onEditorClick(e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.dataset.act;
    var listPath = btn.dataset.list;
    var index = Number(btn.dataset.i);

    if (act === 'toggle') {
      var key = btn.dataset.key;
      state.open[key] = !state.open[key];
      var item = btn.closest('.item');
      if (item) item.classList.toggle('collapsed', !state.open[key]);
      return;
    }

    if (act === 'add') {
      var arr = PF.getPath(state.draft, listPath);
      if (!Array.isArray(arr)) { arr = []; PF.setPath(state.draft, listPath, arr); }
      var tpl = TPL[listPath] ? TPL[listPath]() : {};
      arr.push(tpl);
      if (listPath === 'projects') {
        listPath.split('.').length;
        state.open[listPath + ':' + (arr.length - 1)] = true;
      }
      render();
      schedulePreview();
      markDirty();
      setTimeout(function () {
        var items = $$('#editor .item');
        if (items.length) items[items.length - 1].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 60);
      return;
    }

    if (act === 'del') {
      var arr2 = PF.getPath(state.draft, listPath);
      if (!Array.isArray(arr2)) return;
      if (!confirm('确定删除这一项？删掉后点「发布」才会真正生效。')) return;
      arr2.splice(index, 1);
      state.open = {};
      render();
      schedulePreview();
      markDirty();
      return;
    }

    if (act === 'up' || act === 'down') {
      var arr3 = PF.getPath(state.draft, listPath);
      if (!Array.isArray(arr3)) return;
      var to = act === 'up' ? index - 1 : index + 1;
      if (to < 0 || to >= arr3.length) return;
      var tmp = arr3[index];
      arr3[index] = arr3[to];
      arr3[to] = tmp;
      state.open = {};
      render();
      schedulePreview();
      markDirty();
      return;
    }

    if (act === 'upload') {
      state.uploadTarget = btn.dataset.path;
      var picker = $('#file-pick');
      picker.value = '';
      picker.click();
      return;
    }

    if (act === 'clearimg') {
      PF.setPath(state.draft, btn.dataset.path, '');
      render();
      schedulePreview();
      markDirty();
      return;
    }

    if (act === 'accent') {
      state.draft.meta.accent = btn.dataset.v;
      render();
      schedulePreview();
      markDirty();
      return;
    }

    if (act === 'savesettings') { saveSettings(false); return; }
    if (act === 'test') { testConnection(); return; }
    if (act === 'publish') { doPublish(); return; }
    if (act === 'export') { exportContent(); return; }
    if (act === 'import') { $('#import-pick').click(); return; }

    if (act === 'reset') {
      if (!confirm('恢复成默认示例内容？当前草稿会被覆盖（已发布的网站不受影响，除非你再点发布）。')) return;
      state.draft = PF.merge({});
      render();
      schedulePreview();
      markDirty();
      toast('已恢复默认内容');
      return;
    }

    if (act === 'logout') { lock(); return; }

    if (act === 'restore') {
      try {
        state.draft = PF.merge(JSON.parse(state.pendingRestore));
        state.pendingRestore = null;
        render();
        schedulePreview();
        markDirty();
        toast('草稿已恢复');
      } catch (err) { toast('恢复失败', 'err'); }
      return;
    }

    if (act === 'discard') {
      state.pendingRestore = null;
      try {
        localStorage.removeItem(KEY.draft);
        localStorage.removeItem(KEY.draftTime);
      } catch (err) { /* ignore */ }
      render();
      toast('已丢弃本地草稿');
      return;
    }

    if (act === 'setpw') { changePassword(true); return; }
    if (act === 'dlpw') { changePassword(false); return; }
  }

  async function changePassword(publish) {
    var p1 = $('#pw1');
    var p2 = $('#pw2');
    if (!p1 || !p2) return;
    var a = p1.value;
    var b = p2.value;

    if (a.length < 10) { toast('密码至少 10 位', 'err'); p1.focus(); return; }
    if (a !== b) { toast('两次输入的密码不一致', 'err'); p2.focus(); return; }

    var salt = crypto.getRandomValues(new Uint8Array(16));
    var hash = await pbkdf2Hash(a, salt, PBKDF2_ITER);
    var cfg = {
      v: 1,
      algorithm: 'PBKDF2-SHA256',
      salt: toHex(salt),
      iterations: PBKDF2_ITER,
      hash: hash
    };
    var text = '/* 后台访问密码（只存 PBKDF2 指纹） */\nwindow.SITE_AUTH = ' +
      JSON.stringify(cfg, null, 2) + ';\n';

    try { localStorage.setItem(KEY.auth, JSON.stringify(cfg)); } catch (e) { /* ignore */ }

    if (publish && state.settings.owner && state.settings.repo && state.settings.token) {
      try {
        await commitFiles({ 'data/auth.js': b64Utf8(text) }, '更新后台访问密码');
        toast('新密码已生效并发布到仓库', 'ok');
      } catch (err) {
        download('auth.js', text);
        toast('发布失败（' + err.message + '），已改为下载 auth.js：上传到 data/ 目录即可', 'err');
      }
    } else {
      download('auth.js', text);
      toast('已下载 auth.js：上传到仓库的 data/ 目录替换旧文件。本浏览器已立即使用新密码。', 'ok');
    }
    if (p1) p1.value = '';
    if (p2) p2.value = '';
  }

  /* ======================================================================
     解锁 / 启动
     ====================================================================== */
  var chromeBound = false;

  function unlock(noAuth) {
    $('#gate').hidden = true;
    $('#app').hidden = false;

    // 事件绑定只做一次：无论这次是"直接进来"还是"刚输完密码"，都必须绑上
    if (!chromeBound) {
      bindChrome();
      chromeBound = true;
    }

    var saved = '';
    var savedTime = '';
    try {
      saved = localStorage.getItem(KEY.draft) || '';
      savedTime = localStorage.getItem(KEY.draftTime) || '';
    } catch (e) { /* ignore */ }

    if (saved && saved !== state.origin) {
      state.pendingRestore = saved;
      state.pendingTime = savedTime;
    }

    render();
    updateStatus();
    layoutPreview();
    window.addEventListener('resize', function () { layoutPreview(); });

    if (noAuth) {
      toast('还没有设置访问密码（data/auth.js 缺失）。建议立刻在「账号与发布」里设置一个。', 'err');
    }

    var frame = $('#pv');
    if (frame) {
      frame.addEventListener('load', function () { setTimeout(postPreview, 60); });
      if (frame.contentDocument && frame.contentDocument.readyState === 'complete') postPreview();
    }

    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'pf-ready') postPreview();
    });

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        try {
          localStorage.setItem(KEY.draft, JSON.stringify(state.draft));
          localStorage.setItem(KEY.draftTime, new Date().toLocaleString('zh-CN'));
          toast('草稿已保存在这台电脑', 'ok');
        } catch (err) {
          toast('保存失败：草稿太大', 'err');
        }
      }
    });

    window.addEventListener('beforeunload', function (e) {
      var dirty;
      try { dirty = JSON.stringify(state.draft) !== state.origin; } catch (err) { dirty = false; }
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    });
  }

  function bindChrome() {
    $('#rail').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sec]');
      if (!b) return;
      state.section = b.dataset.sec;
      render();
      $('#editor').scrollTop = 0;
    });

    $('#editor').addEventListener('input', onEditorInput);
    $('#editor').addEventListener('change', onEditorInput);
    $('#editor').addEventListener('click', onEditorClick);

    $('#btn-site').addEventListener('click', function () {
      window.open('index.html', '_blank', 'noopener');
    });

    $('#btn-draft').addEventListener('click', function () {
      try {
        localStorage.setItem(KEY.draft, JSON.stringify(state.draft));
        localStorage.setItem(KEY.draftTime, new Date().toLocaleString('zh-CN'));
        toast('草稿已保存在这台电脑', 'ok');
      } catch (e) {
        toast('保存失败：草稿太大', 'err');
      }
    });

    $('#btn-publish').addEventListener('click', doPublish);

    $('#btn-preview').addEventListener('click', function () {
      var narrow = window.innerWidth <= 1180;
      var showing;
      if (narrow) {
        document.body.classList.toggle('show-preview');
        showing = document.body.classList.contains('show-preview');
      } else {
        document.body.classList.toggle('no-preview');
        showing = !document.body.classList.contains('no-preview');
      }
      this.setAttribute('aria-pressed', showing ? 'true' : 'false');
      setTimeout(function () {
        layoutPreview();
        if (showing) schedulePreview();
      }, 40);
    });

    $('#btn-reload-pv').addEventListener('click', function () {
      var frame = $('#pv');
      if (!frame) return;
      frame.src = frame.src.indexOf('?') >= 0
        ? frame.src.split('&r=')[0] + '&r=' + Date.now()
        : frame.src + '?r=' + Date.now();
      frame.addEventListener('load', function () { setTimeout(postPreview, 80); }, { once: true });
    });

    $('#pvSizes').addEventListener('click', function (e) {
      var b = e.target.closest('[data-size]');
      if (!b) return;
      $$('#pvSizes button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var v = b.dataset.size;
      pvTarget = v === '820px' ? 820 : v === '390px' ? 390 : 1440;
      layoutPreview();
    });

    $('#file-pick').addEventListener('change', async function (e) {
      var file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file || !state.uploadTarget) return;
      toast('正在压缩图片…');
      try {
        var dataUrl = await fileToDataUrl(file);
        PF.setPath(state.draft, state.uploadTarget, dataUrl);
        state.uploadTarget = null;
        render();
        schedulePreview();
        markDirty();
        toast('图片已就绪，发布时会自动上传到仓库', 'ok');
      } catch (err) {
        toast(err.message || '图片处理失败', 'err');
      }
    });

    $('#import-pick').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (file) importFile(file);
    });
  }

  function boot() {
    state.draft = PF.merge(window.SITE_CONTENT || {});
    state.origin = JSON.stringify(state.draft);
    loadSettings();
    bindGate();

    if (isUnlocked()) {
      $('#gate').hidden = true;
      $('#app').hidden = false;
      unlock(false);
    } else {
      $('#app').hidden = true;
      setTimeout(function () {
        var pw = $('#pw');
        if (pw) pw.focus();
      }, 160);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
