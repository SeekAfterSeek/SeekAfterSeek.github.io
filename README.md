# 个人作品集网站 · 带密码保护的后台

一个可以「在浏览器里直接改、实时预览、一键发布」的个人作品集。
纯静态：没有服务器、没有数据库、没有依赖、不用付费。上传到 GitHub Pages 就有一个属于你的链接。

- 网站本体：`index.html`（打开就是给所有人看的作品集）
- 后台：`admin.html`（输密码才能进，改内容、看预览、发布）
- 内容：`data/content.js`（一个 JSON 对象，就是你的全部数据）

**默认访问密码：`portfolio-2026`** —— 第一次进去之后请立刻改掉（见下文第 4 步）。

---

## 1. 先在本机看效果

双击 **`开始预览.bat`**，会弹出一个黑窗口并自动打开浏览器：

- 网站：<http://127.0.0.1:8080/>
- 后台：<http://127.0.0.1:8080/admin.html>

输入 `portfolio-2026` 进入后台，随便改点字，右边的预览会立刻跟着变。

### ⚠️ 这两个地址为什么别人打不开

`127.0.0.1` **不是域名**，它的意思是「这台电脑自己」。所以它有两个硬限制：

1. **只有你这台电脑能打开。** 手机、别人的电脑输入这个地址永远是打不开的。
2. **只有那个黑窗口开着的时候能打开。** 关掉窗口，服务就停了，地址立刻失效。

黑窗口里还会打印一行 `同一 Wi-Fi 下：http://192.168.x.x:8080/` —— 这个地址**同一个 Wi-Fi 下的手机**可以打开（第一次可能弹 Windows 防火墙提示，选「允许」）。临时给旁边的人看一眼够用。

**要让互联网上任何人、任何时间都能打开，必须把文件放到公网托管上**——就是下面第 2 步。
那一步之后你拿到的是 `https://你的用户名.github.io/` 这样的真正的网址，跟这台电脑开不开机、关不关窗口都没有关系。


---

## 2. 上线到 GitHub Pages（约 5 分钟）

### 2.1 建仓库

1. 登录 GitHub → 右上角 `+` → **New repository**
2. 名字二选一：
   - 填 `<你的用户名>.github.io` → 网址就是 `https://<你的用户名>.github.io/`（最干净的地址，推荐）
   - 填别的名字（比如 `portfolio`）→ 网址是 `https://<你的用户名>.github.io/portfolio/`
3. 可见性选 **Public**（免费账号的 Pages 要求公开仓库）
4. 不要勾选 README / .gitignore，直接 **Create repository**

### 2.2 把文件传上去

这个文件夹**已经是一个提交好的 git 仓库**了，所以有两条路，选一条即可。

#### 方式 A：一键脚本（推荐，最不容易出错）

1. 双击 **`发布到GitHub.bat`**
2. 把仓库地址粘进去：`https://github.com/你的用户名/你的仓库名.git`
3. 第一次会弹浏览器让你登录 GitHub，登录一次即可
4. 脚本会打印你的网址，并自动打开 Pages 设置页 —— 在那里把 Branch 设成 `main` + `/ (root)`，Save

以后想更新线上内容，用后台的「发布」按钮就行，不需要再跑这个脚本。

#### 方式 B：网页上传（不想用命令行时）

在仓库页点 **Add file → Upload files**，把本文件夹里的这些**全部**拖进去：

```
index.html
admin.html
README.md
serve.js
preview.ps1
publish.ps1
开始预览.bat
发布到GitHub.bat
.nojekyll          ← 隐藏文件，网页上传时可能被忽略（见下）
.gitignore
assets/            ← 整个文件夹
data/              ← 整个文件夹
```

两个注意点：

- **`.nojekyll`** 在 Windows 资源管理器里是隐藏文件，拖拽常常传不上去。补一个很简单：在仓库页 **Add file → Create new file**，文件名填 `.nojekyll`，内容留空，Commit 即可。
- 上传时保持目录结构（`assets/` 和 `data/` 要作为文件夹整体拖入）。如果拖文件夹不方便，装一个 [GitHub Desktop](https://desktop.github.com/)，把整个文件夹拖进它再 Publish，结构最不容易出错。

### 2.3 打开 Pages

仓库 → **Settings → Pages**：

- Source 选 **Deploy from a branch**
- Branch 选 **main**，目录选 **/ (root)** → **Save**

等 30~60 秒，刷新这个页面，顶部会出现你的网址：`https://<用户名>.github.io/`。
把这个链接发给任何人，他们都能直接看到你的作品集。

---

## 3. 日常怎么改

1. 打开 `https://<用户名>.github.io/admin.html`（或你网址根目录下的 `admin.html`）
2. 输密码 → 左边选分区 → 中间改内容 → 右边实时预览
3. 点右上角 **发布** → 内容会以一次 Git 提交写进仓库 → GitHub Pages 自动重建 → 约 1 分钟后线上更新

编辑时内容随时自动存在这台电脑的浏览器里（关掉页面再回来会有「恢复草稿」提示），**没点发布就不会影响线上**。

其他按钮：

| 按钮 | 作用 |
|---|---|
| 保存草稿 | 把当前内容存到本机浏览器（不会上线） |
| 发布 | 提交到 GitHub，线上生效（需要先配好第 4 步） |
| 预览 | 收起/展开右侧预览（支持桌面 / 平板 / 手机三种宽度） |
| 打开网站 | 新标签页打开线上网站 |
| Ctrl/Cmd + S | 同「保存草稿」 |

作品详情页可以单独分享：`https://你的网址/?p=0` 会直接打开第 1 个项目。

---

## 4. 配一次「发布」权限（GitHub 令牌）

发布需要你给这个浏览器一个 GitHub 令牌。**只配一次，之后一直能用。**

1. 打开 <https://github.com/settings/personal-access-tokens/new>（Fine-grained token）
2. **Token name**：随便写，比如 `portfolio-admin`
3. **Expiration**：建议 90 天或 1 年（到期后回到这里重新生成一个填进去）
4. **Repository access** → 选 **Only select repositories** → 只勾选你刚建的那个仓库
5. **Permissions → Repository permissions → Contents** → 改成 **Read and write**
   （只需要这一个权限）
6. 拉到最下面 **Generate token**，复制那串 `github_pat_...`（只显示一次）

回到后台 → **账号与发布**：

| 字段 | 填什么 |
|---|---|
| 用户名 | 你的 GitHub 用户名 |
| 仓库名 | 仓库名字（如 `portfolio` 或 `<用户名>.github.io`） |
| 分支 | `main` |
| 令牌 | 刚才那串 `github_pat_...` |
| 提交说明 | 默认「更新作品集内容」，可改 |

点 **保存设置** → **测试连接**，看到「连接成功」就可以正常发布了。

> 令牌只存在这台电脑的浏览器里（localStorage），不会写进网站文件，也不会被访客看到。
> 在别人的电脑上不要勾「记住这台设备」，用完点「锁定控制台」。

### 改访问密码

**账号与发布 → 访问密码** → 输两次新密码 → **生成并发布**。
它会生成新的 `data/auth.js`（里面只有 PBKDF2 指纹，没有密码原文）并提交到仓库。

忘记密码怎么办：到 GitHub 网页把 `data/auth.js` 删掉。再进后台会提示「未设置密码」，随便输一个就能进入，然后立刻设置新密码。
（这不会让别人能改你的网站——真正的写入权限在令牌，令牌不在他们手上。）

---

## 5. 内容怎么组织

`data/content.js` 就是一个对象，后台每个输入框对应其中一条路径：

```js
window.SITE_CONTENT = {
  meta:    { title, description, accent, theme, font, lang },   // 站点标题、主色、明暗、字体
  profile: { name, latin, role, location, email, avatar, socials },
  hero:    { eyebrow, headline, subline, primary, secondary, stats },
  work:    { label, heading, desc },                            // 作品区标题文案
  projects: [ { title, subtitle, category, year, cover, summary, body, tags, link, repo, featured } ],
  about:   { label, heading, paragraphs, skills, timeline },
  contact: { label, heading, text, email, note, socials },
  footer:  { note, copyright, showEdit }
};
```

几个约定：

- `body` 和 `paragraphs` 是纯文本：**空行分段**，行首写 `- ` 会变成列表。
- `tags` / `skills[].items` 是数组，在后台用逗号分隔输入。
- `projects[].featured: true` 的那个项目会占满整行（建议只留一个）。
- `cover` / `avatar` 可以填相对路径（`assets/img/cover-1.svg`）、线上图片地址，或直接在后台「上传图片」——
  上传的图片会在这个浏览器里自动压到最长边 1800px 的 WebP，发布时存进 `assets/uploads/`。

也可以完全不用后台：直接改 `data/content.js` 里的文字，在 GitHub 网页上编辑保存，效果一样。

---

## 6. 为什么是这个方案（优缺点）

我当时替你做决定选了：**纯静态站 + 自带浏览器后台 + GitHub 令牌写权限**。理由和取舍如下。

| 方案 | 编辑体验 | 要不要服务器 | 真正的权限控制 | 费用 |
|---|---|---|---|---|
| **本方案：静态站 + 自带后台** | 长什么样就怎么改，实时预览 | 不需要 | GitHub 令牌（服务端校验） | 免费 |
| Decap CMS / Pages CMS | 现成后台，但表单是固定的，样式改动受限 | 需要额外配 OAuth | 有 | 免费 |
| Cloudflare Worker / Vercel + 数据库 | 最自由 | 需要，且要维护 | 服务端登录，最严谨 | 免费额度够用 |
| Notion / Framer 之类 | 零维护 | 不需要 | 平台接管 | 部分收费、样式受限 |

**选它的好处**

- 免费且不会挂：GitHub Pages 是 CDN 托管的静态文件，没有服务器要维护、没有续费、没有数据库。
- 数据是你自己的：全部内容就是仓库里的一个 JSON 文件，自带版本历史，任何一次改动都能回滚，也能随时整体迁走。
- 快：没有后端请求，首屏就是几个 KB 的 HTML/CSS/JS。
- 后台是按你的内容定制的，改起来顺手，而且完全离线可用（本地写、发布才联网）。
- 加自定义域名、加统计、加访问密码之类都不需要动后端。

**它的真实限制（请认这一点）**

- **内容一定是公开的。** 这是静态网站，作品集本来也是给人看的。密码保护的是「编辑界面」，不是内容——所以别把不该公开的东西放进去。
- **密码不是加密。** 它是一个 PBKDF2 指纹校验，挡住的是「顺手点进来的人」，不是专业攻击者。真正的门锁是 GitHub 令牌：没有它谁也发布不了。所以两个都要保护好。
- 令牌存在浏览器里，**公用电脑上记得别勾「记住这台设备」**，用完点「锁定控制台」。令牌泄露了就到 GitHub 撤销那一个令牌即可（只授了一个仓库的写权限，影响面很小）。
- 发布是「提交 → Pages 重建」，**有约 1 分钟延迟**，不是即时生效。
- 如果哪天你想要「访客登录可见」或「评论/点赞」这类功能，就必须换成带后端的方案了。

---

## 7. 常见问题

**双击 `开始预览.bat`，黑窗口闪一下就没了？**
现在的版本已经把中文输出放进带 BOM 的 `preview.ps1`、`.bat` 只保留纯 ASCII 调用，正常不会再闪退。
如果还闪，大概率是安全软件挡了 `python -m http.server`，允许一次即可；实在不行就直接双击 `index.html`（网站能看，后台的预览功能会受限）。

**为什么我拿到的是 127.0.0.1，别人打不开？**
因为那是「本机地址」，不是域名。见第 1 节末尾的说明——要公网访问必须先做第 2 步。

**发布成功了，但线上没变？**
等 30~60 秒再强刷（Ctrl/Cmd + F5）。仓库 → **Actions** 里能看到 Pages 的构建记录，失败了会有红叉。也可能是浏览器缓存，用无痕窗口确认一次。

**打开是 404？**
检查 `Settings → Pages` 是否已开启、分支是否选对（`main` + `/ (root)`）；仓库名如果是 `<用户名>.github.io`，访问地址不要带仓库名。

**图片显示不出来？**
先把图片路径写对（区分大小写，GitHub 上 `Cover.PNG` ≠ `cover.png`）。用后台上传最省事，路径会自动写好。

**右侧预览白屏？**
点预览栏右上角的 `⟳` 重新加载。本地用 `开始预览.ps1` 打开时最稳。

**「测试连接」报 404 / 403？**
404 是用户名/仓库名/分支写错了；403 是令牌权限没给 `Contents: Read and write`；401 是令牌过期或被撤销，重新生成一个。

**不想让访客看到后台入口？**
外观 → 页脚 → 关掉「在页脚显示 EDIT」。地址还是 `admin.html`，改个文件名（比如 `admin-x7k2.html`）能少被扫到，但**别把它当安全措施**——密码和令牌才是。

**想换域名 / 加统计？**
`Settings → Pages → Custom domain` 绑定域名；统计可以加一段 Plausible / Umami 的脚本到 `index.html` 的 `</body>` 前。

**不用 GitHub 行不行？**
行。这个文件夹原样拖到 [Netlify Drop](https://app.netlify.com/drop) 或 Cloudflare Pages 就是另一个站；发布功能照旧可用（它只是往 GitHub 提交内容）。

---

## 8. 文件结构

```
index.html              网站（访客看到的一切）
admin.html              控制台（输密码才进得去）
.nojekyll               告诉 GitHub Pages 别用 Jekyll 处理
.gitignore              不上传本地截图等杂项
开始预览.bat            双击 → 本地预览（推荐用这个）
发布到GitHub.bat        双击 → 把内容推到 GitHub
preview.ps1             上面的 bat 实际调用的脚本
publish.ps1             同上
serve.js                零依赖本地服务器（没有 Python 时用）
README.md               这份说明
assets/
  css/site.css          网站样式（配色、字号、间距都在这）
  css/admin.css         控制台样式
  js/core.js            数据结构 + 默认值 + 小工具
  js/site.js            网站渲染
  js/admin.js           控制台逻辑（编辑、预览、发布）
  img/avatar.svg        默认头像（换成自己的）
  img/cover-1..6.svg    默认封面占位图
  uploads/              后台上传的图片会被发布到这里
data/
  content.js            你的全部内容
  auth.js               后台密码的 PBKDF2 指纹
screenshots/            我做的效果截图（不会上传到网站）
```

想改配色：后台「外观」里换主色最快；想更深地改，`assets/css/site.css` 顶部有全部变量。
想改版式：`assets/js/site.js` 里每个 `renderXxx` 函数就是对应区块的 HTML。
