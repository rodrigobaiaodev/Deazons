#!/usr/bin/env bash
echo "========================================"
echo "    TESTE E2E PRODUÇÃO - DEAZONS.COM    "
echo "========================================"

URLS=(
  "https://deazons.com/"
  "https://deazons.com/filmes"
  "https://deazons.com/filmes/1022789-inside-out-2"
  "https://deazons.com/blog/netflix-vs-prime-video-vs-disney-plus"
)

ASSETS=(
  "https://deazons.com/favicon.ico"
  "https://deazons.com/robots.txt"
  "https://deazons.com/sitemap.xml"
  "https://deazons.com/sitemap-index.xml"
)

BOT_UA="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
NORMAL_UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36"

echo ""
echo "--- 1. TESTANDO ROTAS SPA COM GOOGLEBOT ---"
for url in "${URLS[@]}"; do
  echo ""
  echo ">>> curl -sI -H 'User-Agent: Googlebot' $url"
  curl -sI -H "User-Agent: $BOT_UA" "$url" | grep -iE 'HTTP/|x-vercel-cache|cache-control|vary|content-type'
  
  echo ">>> Extraindo <title> e <link rel=\"canonical\">"
  curl -s -H "User-Agent: $BOT_UA" "$url" | grep -oE '<title>[^<]*</title>|<link rel="canonical" href="[^"]*"' || echo "Nao encontrado"
done

echo ""
echo "--- 2. TESTANDO ROTAS SPA COM NORMAL UA ---"
for url in "${URLS[@]}"; do
  echo ""
  echo ">>> curl -sI -H 'User-Agent: Chrome' $url"
  curl -sI -H "User-Agent: $NORMAL_UA" "$url" | grep -iE 'HTTP/|x-vercel-cache|cache-control|vary|content-type'
done

echo ""
echo "--- 3. TESTANDO ASSETS COM GOOGLEBOT ---"
for url in "${ASSETS[@]}"; do
  echo ""
  echo ">>> curl -sI -H 'User-Agent: Googlebot' $url"
  curl -sI -H "User-Agent: $BOT_UA" "$url" | grep -iE 'HTTP/|x-vercel-cache|cache-control|vary|content-type'
done
