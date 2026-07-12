$BOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
$NORMAL_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36"

$URLS = @(
  "https://deazons.com/",
  "https://deazons.com/filmes",
  "https://deazons.com/filmes/1022789-inside-out-2",
  "https://deazons.com/blog/netflix-vs-prime-video-vs-disney-plus"
)

$ASSETS = @(
  "https://deazons.com/favicon.ico",
  "https://deazons.com/robots.txt",
  "https://deazons.com/sitemap.xml",
  "https://deazons.com/sitemap-index.xml"
)

Write-Host "`n--- 1. TESTANDO ROTAS SPA COM GOOGLEBOT ---" -ForegroundColor Cyan
foreach ($url in $URLS) {
  Write-Host "`n>>> curl.exe -sI -H 'User-Agent: Googlebot' $url" -ForegroundColor Yellow
  # Headers
  $out = curl.exe -sI -H "User-Agent: $BOT_UA" $url
  $out | Select-String -Pattern "HTTP/|x-vercel-cache|cache-control|vary|content-type" -CaseSensitive:$false
  
  # Title / Canonical
  $body = curl.exe -s -H "User-Agent: $BOT_UA" $url
  $titleMatch = [regex]::Match($body, '<title>([^<]*)</title>')
  $canonMatch = [regex]::Match($body, '<link rel="canonical" href="([^"]*)"')
  Write-Host ">>> HTML Tags extraidas:" -ForegroundColor DarkGray
  if ($titleMatch.Success) { Write-Host $titleMatch.Groups[0].Value } else { Write-Host "<title> NOT FOUND" }
  if ($canonMatch.Success) { Write-Host $canonMatch.Groups[0].Value } else { Write-Host "canonical NOT FOUND" }
}

Write-Host "`n--- 2. TESTANDO ROTAS SPA COM NORMAL UA ---" -ForegroundColor Cyan
foreach ($url in $URLS) {
  Write-Host "`n>>> curl.exe -sI -H 'User-Agent: Chrome' $url" -ForegroundColor Yellow
  $out = curl.exe -sI -H "User-Agent: $NORMAL_UA" $url
  $out | Select-String -Pattern "HTTP/|x-vercel-cache|cache-control|vary|content-type" -CaseSensitive:$false
}

Write-Host "`n--- 3. TESTANDO ASSETS COM GOOGLEBOT ---" -ForegroundColor Cyan
foreach ($url in $ASSETS) {
  Write-Host "`n>>> curl.exe -sI -H 'User-Agent: Googlebot' $url" -ForegroundColor Yellow
  $out = curl.exe -sI -H "User-Agent: $BOT_UA" $url
  $out | Select-String -Pattern "HTTP/|x-vercel-cache|cache-control|vary|content-type" -CaseSensitive:$false
}
