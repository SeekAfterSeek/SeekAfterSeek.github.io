# 一键发布到 GitHub Pages
#
# 用法：先到 GitHub 建一个空仓库（不要勾 Add a README），然后双击运行这个脚本，
# 把仓库地址粘进来。脚本会把当前文件夹的内容提交并推送上去。
#
# 第一次推送时 Git Credential Manager 会弹出浏览器让你登录 GitHub —— 登录一次就好。

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host ""
Write-Host "==============================================" -ForegroundColor DarkGray
Write-Host "  发布作品集到 GitHub" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  还没有仓库？先去建一个（关键：不要勾 Add a README）："
Write-Host "  https://github.com/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "  仓库名建议填： <你的用户名>.github.io"
Write-Host "  （这样网址就是 https://<你的用户名>.github.io/，最干净）"
Write-Host ""

$repo = Read-Host "粘贴仓库地址（形如 https://github.com/用户名/portfolio.git）"
$repo = $repo.Trim()

if (-not $repo) {
  Write-Host "没有输入地址，退出。" -ForegroundColor Yellow
  Read-Host "按回车退出"
  exit 1
}

if ($repo -notmatch '^https://github\.com/[^/]+/[^/]+?(\.git)?$') {
  Write-Host ""
  Write-Host "这个地址看起来不对。它应该是 https://github.com/用户名/仓库名.git" -ForegroundColor Yellow
  $go = Read-Host "还是要继续试吗？(y/N)"
  if ($go -ne 'y') { exit 1 }
}
if ($repo -notmatch '\.git$') { $repo = $repo + '.git' }

# 用仓库所属用户名设置提交身份，这样提交记录会算到你名下
$ghUser = ($repo -replace '^https://github\.com/', '') -replace '/.*$', ''
git config user.name $ghUser
git config user.email "$ghUser@users.noreply.github.com"

if (-not (Test-Path .git)) {
  git init -q
  git branch -M main
}

git add -A
$msg = "更新作品集内容 " + (Get-Date -Format 'yyyy-MM-dd HH:mm')
git commit -q -m $msg 2>$null
Write-Host "已在本地提交：$msg" -ForegroundColor DarkGray

$existing = git remote 2>$null
if ($existing -contains 'origin') { git remote remove origin }
git remote add origin $repo

Write-Host ""
Write-Host "正在推送到 GitHub（第一次会弹浏览器让你登录）..." -ForegroundColor Cyan
git push -u origin main
$code = $LASTEXITCODE

if ($code -ne 0) {
  Write-Host ""
  Write-Host "推送失败。" -ForegroundColor Yellow
  Write-Host "常见原因：仓库不是空的（建仓库时勾了 Add a README / .gitignore）。"
  $force = Read-Host "用本地文件强制覆盖仓库内容吗？这会丢掉仓库里原有的文件 (y/N)"
  if ($force -eq 'y') {
    git push -u origin main --force
    $code = $LASTEXITCODE
  }
}

Write-Host ""
if ($code -eq 0) {
  $repoName = (($repo -replace '\.git$', '') -replace '^https://github\.com/[^/]+/', '')
  Write-Host "推送成功！" -ForegroundColor Green
  Write-Host ""
  Write-Host "最后一步（只需做一次）：打开仓库的 Settings → Pages"
  Write-Host "  Source: Deploy from a branch"
  Write-Host "  Branch: main   /  目录: / (root)   →  Save"
  Write-Host ""
  Write-Host "等 30~60 秒，你的网址就是："
  if ($repoName -eq "$ghUser.github.io") {
    Write-Host "  https://$ghUser.github.io/" -ForegroundColor Cyan
  }
  else {
    Write-Host "  https://$ghUser.github.io/$repoName/" -ForegroundColor Cyan
  }
  Write-Host ""
  Write-Host "现在帮你打开 Pages 设置页 ..." -ForegroundColor DarkGray
  try { Start-Process "https://github.com/$ghUser/$repoName/settings/pages" } catch { }
}
else {
  Write-Host "还是没有成功。可以改用网页上传的方式（README 第 2 节方式 B）。" -ForegroundColor Yellow
}

Read-Host "按回车退出"
