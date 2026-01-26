$root = Split-Path -Parent $PSScriptRoot
$botsDir = Join-Path $root "bots"
$botListPath = Join-Path $root "bot-list.json"

if (-not (Test-Path $botsDir)) {
  Write-Error "bots/ folder not found."
  exit 1
}

$bots = Get-ChildItem -Path $botsDir -Filter *.json -File |
  Sort-Object Name |
  ForEach-Object { "bots/$($_.Name)" }

$data = @{ bots = $bots }
$json = $data | ConvertTo-Json -Depth 2
Set-Content -Path $botListPath -Value $json -Encoding UTF8

Write-Host "Updated bot-list.json with $($bots.Count) bots."
