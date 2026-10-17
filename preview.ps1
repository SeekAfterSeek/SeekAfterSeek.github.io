# 本地预览 —— 在这个文件夹上起一个本地服务器
#
# 直接双击「开始预览.bat」就行（.bat 会调用这个脚本）。
#
# 注意：这里出来的地址（127.0.0.1 或 192.168.x.x）只属于你自己的网络：
#   · 127.0.0.1     只有这台电脑能打开，而且必须保持这个窗口开着
#   · 192.168.x.x   同一个 Wi-Fi 下的手机/其他电脑可以打开
# 要让互联网上任何人都能看，必须把它放到 GitHub Pages 之类的公网托管上，
# 见 README.md 第 2 节。

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

$port = 8080

# 找一个没被占用的端口
$busy = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($busy) {
  Write-Host "端口 $port 已被占用，改用 $($port + 1)" -ForegroundColor Yellow
  $port = $port + 1
}

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
  Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "  作品集本地预览已启动" -ForegroundColor Green
Write-Host ""
Write-Host "  这台电脑：  http://127.0.0.1:$port/"
Write-Host "  后台控制台：http://127.0.0.1:$port/admin.html"
if ($lanIp) {
  Write-Host "  同一 Wi-Fi 下：http://${lanIp}:$port/   （手机可直接打开）" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  关闭这个窗口 = 停止预览。要给别人一个永久链接，见 README 第 2 节。" -ForegroundColor DarkGray
Write-Host ""

# 等服务器起来再打开浏览器
try {
  Start-Job -ScriptBlock { param($u) Start-Sleep -Milliseconds 1500; Start-Process $u } -ArgumentList "http://127.0.0.1:$port/" | Out-Null
} catch { }

if (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server $port --bind 0.0.0.0
}
elseif (Get-Command py -ErrorAction SilentlyContinue) {
  py -m http.server $port --bind 0.0.0.0
}
elseif (Get-Command node -ErrorAction SilentlyContinue) {
  node serve.js $port
}
else {
  Write-Host "没有找到 Python 或 Node。" -ForegroundColor Yellow
  Write-Host "可以直接双击 index.html 看网站；后台请等部署到 GitHub Pages 后再用。"
  Read-Host "按回车退出"
}
