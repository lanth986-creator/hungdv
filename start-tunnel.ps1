$ErrorActionPreference = 'Stop'

Write-Host '============================================'
Write-Host '   HUNGDV - Cloudflare Tunnel'
Write-Host '============================================'
Write-Host ''
Write-Host 'Hay chay start-production.bat truoc de mo app tai http://localhost:5000'
Write-Host 'Dang tao link trycloudflare.com...'
Write-Host ''

$cloudflared = 'cloudflared'
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  if (Test-Path 'C:\Program Files (x86)\cloudflared\cloudflared.exe') {
    $cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
  } elseif (Test-Path 'C:\Program Files\cloudflared\cloudflared.exe') {
    $cloudflared = 'C:\Program Files\cloudflared\cloudflared.exe'
  } else {
    Write-Host '[ERROR] Chua tim thay cloudflared.'
    Write-Host 'Tai ve tai: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/'
    Read-Host 'Nhan Enter de dong'
    exit 1
  }
}

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = $cloudflared
$processInfo.Arguments = 'tunnel --url http://localhost:5000'
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo

$printedUrl = $false
$handler = {
  param($sender, $eventArgs)

  if ([string]::IsNullOrWhiteSpace($eventArgs.Data)) {
    return
  }

  Write-Host $eventArgs.Data

  $match = [regex]::Match($eventArgs.Data, 'https://[a-zA-Z0-9-]+\.trycloudflare\.com')
  if ($match.Success -and -not $script:printedUrl) {
    $script:printedUrl = $true
    $url = $match.Value
    Set-Clipboard -Value $url
    Write-Host ''
    Write-Host '============================================' -ForegroundColor Green
    Write-Host ' LINK DE GUI CHO NGUOI KHAC:' -ForegroundColor Green
    Write-Host " $url" -ForegroundColor Yellow
    Write-Host ' Da copy link vao clipboard.' -ForegroundColor Green
    Write-Host ' Giu cua so nay mo de link tiep tuc hoat dong.' -ForegroundColor Green
    Write-Host '============================================' -ForegroundColor Green
    Write-Host ''
  }
}

$process.add_OutputDataReceived($handler)
$process.add_ErrorDataReceived($handler)

[void]$process.Start()
$process.BeginOutputReadLine()
$process.BeginErrorReadLine()
$process.WaitForExit()
