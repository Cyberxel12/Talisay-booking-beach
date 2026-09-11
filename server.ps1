param(
    [int]$Port = 8080,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$mimeMap = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
    ".ppt"  = "application/vnd.ms-powerpoint"
    ".pptx" = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
}

$localIP = $null
try {
    $ipObj = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254*' } | Select-Object -First 1
    if ($ipObj) { $localIP = $ipObj.IPAddress }
} catch {}

$canListenLAN = $false
if ($localIP) {
    try {
        $testListener = New-Object System.Net.HttpListener
        $testListener.Prefixes.Add("http://${localIP}:$Port/")
        $testListener.Start()
        $testListener.Stop()
        $canListenLAN = $true
    } catch {
        $canListenLAN = $false
    }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
if ($canListenLAN) {
    $listener.Prefixes.Add("http://${localIP}:$Port/")
}

try {
    $listener.Start()
} catch {
    Write-Host "Port $Port is in use. Trying port $($Port + 1)..." -ForegroundColor Yellow
    $Port = $Port + 1
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Prefixes.Add("http://127.0.0.1:$Port/")
    if ($canListenLAN) {
        try {
            $listener.Prefixes.Add("http://${localIP}:$Port/")
        } catch {}
    }
    $listener.Start()
}

$prefix = "http://localhost:$Port/"
$networkUrl = if ($canListenLAN) { "http://${localIP}:$Port/" } else { "http://${localIP}:$Port/ (Run as Admin for LAN)" }

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  [+] Talisay Beach Resort - Web Server Active      " -ForegroundColor Green
Write-Host "  [*] Local URL    : $prefix" -ForegroundColor White
if ($localIP) {
    Write-Host "  [*] Network URL  : $networkUrl (Open on Phones/Laptops)" -ForegroundColor Yellow
}
Write-Host "  [*] Root Folder  : $root" -ForegroundColor Gray
Write-Host "  [*] Cloud Sync   : Enabled (Firebase Cloud + Local)" -ForegroundColor Cyan
Write-Host "  [*] Press Ctrl+C in this window to stop the server" -ForegroundColor DarkGray
Write-Host "===================================================" -ForegroundColor Cyan

if (-not $NoBrowser) {
    try {
        Start-Process $prefix
    } catch {
        Write-Host "Could not automatically launch browser: $_" -ForegroundColor DarkGray
    }
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $request = $context.Request
            $response = $context.Response

            $urlPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
            if ($urlPath -eq "/" -or $urlPath -eq "") {
                $urlPath = "/index.html"
            }

            # Security check: resolve relative to root and ensure within root
            $relPath = $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $relPath))

            # Add CORS and no-cache headers for easy local testing
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "*")
            $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")

            if ($request.HttpMethod -eq "OPTIONS") {
                $response.StatusCode = 204
                $response.OutputStream.Close()
                continue
            }

            if ($fullPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -and [System.IO.File]::Exists($fullPath)) {
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                $contentType = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { "application/octet-stream" }
                $response.ContentType = $contentType
                $response.StatusCode = 200

                $bytes = [System.IO.File]::ReadAllBytes($fullPath)
                $response.ContentLength64 = $bytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
                Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] 200 OK: $urlPath" -ForegroundColor Green
            } else {
                $response.StatusCode = 404
                $notFoundMsg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
                $response.ContentType = "text/plain; charset=utf-8"
                $response.ContentLength64 = $notFoundMsg.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($notFoundMsg, 0, $notFoundMsg.Length)
                }
                Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] 404 Not Found: $urlPath" -ForegroundColor Red
            }
        } catch {
            Write-Host "Request error: $_" -ForegroundColor DarkYellow
        } finally {
            try { $response.OutputStream.Close() } catch {}
        }
    }
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
    Write-Host "Server stopped." -ForegroundColor Yellow
}
