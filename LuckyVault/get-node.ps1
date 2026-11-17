# Downloads the latest portable Node.js 22 LTS (Windows x64) into .\runtime next to this script.
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$base = 'https://nodejs.org/dist/latest-v22.x/'
$sums = (Invoke-WebRequest -UseBasicParsing ($base + 'SHASUMS256.txt')).Content -split "`n"
$line = $sums | Where-Object { $_ -match 'node-v[\d.]+-win-x64\.zip' } | Select-Object -First 1
$parts = $line.Trim() -split '\s+'; $hash = $parts[0]; $file = $parts[-1]
Write-Host "Downloading $file ..."
$zip = Join-Path $env:TEMP 'lv-node.zip'; $tmp = Join-Path $env:TEMP 'lv-node'
Invoke-WebRequest -UseBasicParsing ($base + $file) -OutFile $zip
if ((Get-FileHash $zip -Algorithm SHA256).Hash.ToLower() -ne $hash.ToLower()) { throw 'Checksum mismatch - download corrupted' }
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
Expand-Archive -Force $zip $tmp
$d = Get-ChildItem $tmp -Directory | Select-Object -First 1
$rt = Join-Path $here 'runtime'; New-Item -ItemType Directory -Force $rt | Out-Null
Copy-Item -Recurse -Force (Join-Path $d.FullName '*') $rt
Remove-Item -Recurse -Force $tmp, $zip
Write-Host "Node.js ready in $rt"
