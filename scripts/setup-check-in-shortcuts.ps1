<# Creates two dedicated Chrome shortcuts. Does not launch Chrome or change printers. #>
[CmdletBinding()]
param(
    [string]$Destination = [Environment]::GetFolderPath('Desktop')
)
$ErrorActionPreference = 'Stop'
$chromeCandidates = @(
    (Join-Path $env:ProgramFiles 'Google/Chrome/Application/chrome.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'Google/Chrome/Application/chrome.exe'),
    (Join-Path $env:LOCALAPPDATA 'Google/Chrome/Application/chrome.exe')
)
$chromePath = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $chromePath) { throw 'Install Google Chrome from google.com/chrome, then rerun this script.' }
if (-not (Test-Path -LiteralPath $Destination -PathType Container)) { throw 'The shortcut destination must be an existing folder.' }
$profilePath = Join-Path $env:LOCALAPPDATA 'CourtSense/CheckInChrome'
$url = 'https://court-sense-lac.vercel.app/check-in'
$shell = New-Object -ComObject WScript.Shell
foreach ($mode in @('Setup', 'Check-in')) {
    $shortcutPath = Join-Path $Destination "CourtSense $mode.lnk"
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $chromePath
    $flags = if ($mode -eq 'Check-in') { ' --kiosk-printing' } else { '' }
    $shortcut.Arguments = "--user-data-dir=`"$profilePath`"$flags `"$url`""
    $shortcut.Description = if ($mode -eq 'Setup') { 'Configure and test Rollo printing with a normal print dialog.' } else { 'CourtSense check-in with automatic print confirmation. Use only for CourtSense.' }
    $shortcut.IconLocation = "$chromePath,0"
    $shortcut.Save()
    Write-Output "Created $shortcutPath"
}
Write-Output 'Open CourtSense Setup first. Select Rollo and 4 x 6-inch paper in a test print, then close every window of this dedicated profile before opening CourtSense Check-in.'
