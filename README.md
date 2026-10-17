# 个人作品集

- 网站：<https://seekafterseek.github.io/>
- 后台：<https://seekafterseek.github.io/admin.html>

## 怎么看

打开上面「网站」那个链接就是全部。作品卡片点开有详情；想单独分享某个项目，在网址后面加 `?p=0`、`?p=1`……

## 怎么改

1. 打开「后台」链接，输入密码 `portfolio-2026`
2. 左边选分区，中间改内容，**右边实时预览**
3. 点右上角 **发布**，约 1 分钟后线上更新

没点发布之前，改动只存在你这台电脑的浏览器里，线上不受影响。

### 第一次用，先配一次发布权限

后台发布需要一串 GitHub 令牌，只配一次：

1. 打开 <https://github.com/settings/personal-access-tokens/new>
2. **Repository access** → Only select repositories → 勾 `SeekAfterSeek.github.io`
3. **Permissions** → Repository permissions → `Contents` 设为 **Read and write**
4. 点 **Generate token**，复制那串令牌
5. 回到后台「账号与发布」，填：

   | 字段 | 填什么 |
   |---|---|
   | 用户名 | `SeekAfterSeek` |
   | 仓库名 | `SeekAfterSeek.github.io` |
   | 分支 | `main` |
   | 令牌 | 刚才复制的那串 |

6. 点 **保存设置** → **测试连接**，显示「连接成功」就好了

## 改密码

后台 →「账号与发布」→ 访问密码 → 输两遍新密码 → **生成并发布**。

## 本地预览

双击 `开始预览.bat`，打开 <http://127.0.0.1:8080/>（这个地址只有你这台电脑能看，给别人看用上面那个网站链接）。
