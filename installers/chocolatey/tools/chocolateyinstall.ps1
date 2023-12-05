
$ErrorActionPreference = 'Stop' # stop on all errors
$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$fileLocation = Join-Path $toolsDir 'contensis-cli-win.exe'
# $url = '' # download url, HTTPS preferred
# $url64 = '' # 64bit URL here (HTTPS preferred) or remove - if installer contains both (very rare), use $url

$packageArgs = @{
  packageName    = $env:ChocolateyPackageName
  unzipLocation  = $toolsDir
  fileType       = 'exe' #only one of these: exe, msi, msu
  # url            = $url
  # url64bit       = $url64
  file           = $fileLocation
  
  softwareName   = 'contensis-cli*' #part or all of the Display Name as you see it in Programs and Features. It should be enough to be unique
  # checksum       = ''
  # checksumType   = 'sha256' #default is md5, can also be sha1, sha256 or sha512
  # checksum64     = ''
  # checksumType64 = 'sha256' #default is checksumType
  validExitCodes = @(0) #please insert other valid exit codes here
}

# # Download release binary for embedded choco install from GitHub with script
# Write-Host "Installing contensis-cli with script $toolsDir\install-cli.ps1"
# & $toolsDir\install-cli.ps1 $fileLocation -preRelease $true

# Create aliases and install them to chocolatey\bin so they are in $PATH
Install-BinFile -Name 'contensis' -Path $fileLocation
Install-BinFile -Name 'contensis-cli' -Path $fileLocation

Write-Host ""
Write-Host -ForegroundColor Blue " >> Try out contensis-cli by typing " -NoNewline 
Write-Host -ForegroundColor White "contensis" -NoNewline
Write-Host -ForegroundColor Blue " into your terminal"
Write-Host ""
Write-Host -ForegroundColor Blue " >> Use " -NoNewline 
Write-Host -ForegroundColor White "contensis --version" -NoNewline
Write-Host -ForegroundColor Blue " to check the currently installed cli version"
Write-Host ""
