
$ErrorActionPreference = 'Stop' # stop on all errors
$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$fileLocation = Join-Path $toolsDir 'contensis-cli-win.exe'

$packageArgs = @{
  packageName    = $env:ChocolateyPackageName
  unzipLocation  = $toolsDir
  fileType       = 'exe' #only one of these: exe, msi, msu
  file           = $fileLocation
  
  softwareName   = 'contensis-cli*' #part or all of the Display Name as you see it in Programs and Features. It should be enough to be unique
  validExitCodes = @(0) #please insert other valid exit codes here
}

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
