$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeDir = Join-Path $projectRoot ".tools\node-v22.22.3-win-x64"
$nodeExe = Join-Path $nodeDir "node.exe"

if (!(Test-Path $nodeExe)) {
  Write-Error "Portable Node 22 was not found at $nodeDir"
}

$env:Path = "$nodeDir;$env:Path"
Write-Host "Using Node $(node -v) from $nodeDir"

npx expo start --clear --localhost
