# PowerShell script to download required ML datasets
# Save as ml_model/scripts/download_datasets.ps1

$ErrorActionPreference = 'Stop'

# -------------------------------------------------
# 1. FER2013 facial emotion dataset (CSV)
# -------------------------------------------------
$ferUrl = 'https://raw.githubusercontent.com/Datasets/FER2013/master/fer2013.csv'
$ferDir = Join-Path -Path "$PSScriptRoot/../data/fer2013" -Resolve
if (-not (Test-Path $ferDir)) {
    New-Item -ItemType Directory -Path $ferDir -Force | Out-Null
}
$ferDest = Join-Path $ferDir 'fer2013.csv'
Write-Host "Downloading FER2013 dataset..."
Invoke-WebRequest -Uri $ferUrl -OutFile $ferDest
Write-Host "FER2013 saved to $ferDest"

# -------------------------------------------------
# 2. DREAM therapy‑session dataset (sample data)
# -------------------------------------------------
# The official dataset is hosted via a DOI link which typically requires a browser click.
# Here we download a public sample zip from the project's GitHub repository as a fallback.
$dreamZipUrl = 'https://github.com/dream2020/data/archive/refs/heads/main.zip'
$dreamDir = Join-Path -Path "$PSScriptRoot/../data/dream" -Resolve
if (-not (Test-Path $dreamDir)) {
    New-Item -ItemType Directory -Path $dreamDir -Force | Out-Null
}
$dreamZipDest = Join-Path $dreamDir 'dream_data.zip'
Write-Host "Downloading DREAM dataset (sample archive)..."
Invoke-WebRequest -Uri $dreamZipUrl -OutFile $dreamZipDest
# Extract the zip
Write-Host "Extracting DREAM archive..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($dreamZipDest, $dreamDir)
Remove-Item $dreamZipDest
Write-Host "DREAM data extracted to $dreamDir"

Write-Host "All dataset downloads completed successfully."
