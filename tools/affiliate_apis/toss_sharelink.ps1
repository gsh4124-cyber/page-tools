param(
  [Parameter(Mandatory=$true)]
  [string]$RequestFile
)

$ErrorActionPreference = "Stop"

function Get-RequiredEnv([string]$Name) {
  $v = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($v)) { throw "Missing environment variable: $Name" }
  return $v
}

$AccessKey = Get-RequiredEnv "TOSS_ACCESS_KEY"
$SecretKey = Get-RequiredEnv "TOSS_SECRET_KEY"
$PublisherId = Get-RequiredEnv "TOSS_PUBLISHER_ID"

if (-not (Test-Path $RequestFile)) { throw "Request file not found: $RequestFile" }
$Request = Get-Content $RequestFile -Raw | ConvertFrom-Json

$Token = Invoke-RestMethod -Method Post -Uri "https://oauth2.cert.toss.im/token" -ContentType "application/x-www-form-urlencoded" -Body @{ grant_type="client_credentials"; client_id=$AccessKey; client_secret=$SecretKey; scope="sharelink:read sharelink:write" }
$AccessToken = if ($Token.access_token) { $Token.access_token } else { $Token.success.access_token }
if (-not $AccessToken) { throw "Toss token response did not contain access_token" }

$Headers = @{ Authorization=("Bearer " + $AccessToken); Accept="application/json" }

function Invoke-TossGet([string]$Path) {
  return Invoke-RestMethod -Method Get -Uri ("https://sharelink.toss.im/openapi" + $Path) -Headers $Headers
}

function Invoke-TossPost([string]$Path, $Body) {
  return Invoke-RestMethod -Method Post -Uri ("https://sharelink.toss.im/openapi" + $Path) -Headers $Headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 10 -Compress)
}

$Action = [string]$Request.action

switch ($Action) {
  "health" { $Result = Invoke-TossGet "/health" }
  "best_selling" {
    $Size = if ($Request.size) { [int]$Request.size } else { 5 }
    if ($Size -lt 1 -or $Size -gt 100) { throw "size must be 1..100" }
    $Path = "/products/best-selling?size=$Size"
    if ($Request.cursor) { $Path += "&cursor=" + [uri]::EscapeDataString([string]$Request.cursor) }
    $Result = Invoke-TossGet $Path
  }
  "product_details" {
    $Ids = @($Request.tacaItemIds | ForEach-Object { [long]$_ })
    if ($Ids.Count -lt 1 -or $Ids.Count -gt 30) { throw "tacaItemIds must contain 1..30 ids" }
    $Result = Invoke-TossGet ("/products/detail?tacaItemIds=" + ($Ids -join ","))
  }
  "issue_sharelink" {
    $Id = [long]$Request.tacaItemId
    if ($Id -le 0) { throw "tacaItemId must be positive" }
    $Result = Invoke-TossPost "/links" @{ tacaItemId=$Id; publisherId=$PublisherId }
  }
  default { throw "Unsupported action: $Action" }
}

if ($Result.resultType -eq "FAIL") {
  $Code = [string]$Result.error.errorCode
  $Reason = [string]$Result.error.reason
  throw "Toss Sharelink API FAIL [$Code]: $Reason"
}

$Output = [ordered]@{ requestId=$Request.requestId; action=$Action; result=$Result }
$Output | ConvertTo-Json -Depth 30
