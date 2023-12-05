$ErrorActionPreference = 'Stop' # stop on all errors
$packageArgs = @{
  packageName    = $env:ChocolateyPackageName
  softwareName   = 'contensis-cli*'  #part or all of the Display Name as you see it in Programs and Features. It should be enough to be unique
  fileType       = 'EXE' #only one of these: MSI or EXE (ignore MSU for now)
  silentArgs     = '/S'           # NSIS
  validExitCodes = @(0) #please insert other valid exit codes here
}
[array]$key = Get-UninstallRegistryKey -SoftwareName $packageArgs['softwareName']

if ($key.Count -eq 1) {
  $key | % {
    $packageArgs['file'] = "$($_.UninstallString)" #NOTE: You may need to split this if it contains spaces, see below

    if ($packageArgs['fileType'] -eq 'MSI') {
      $packageArgs['silentArgs'] = "$($_.PSChildName) $($packageArgs['silentArgs'])"
      $packageArgs['file'] = ''
    }
    else {
    }

    Uninstall-ChocolateyPackage @packageArgs
    
  }
}
elseif ($key.Count -eq 0) {
  # Remove additional alias exes and from chocolatey\bin
  Write-Output "[uninstall-cli] Remove additional alias shims ""contensis"" and ""contensis-cli"""
  Uninstall-BinFile -Name 'contensis'
  Uninstall-BinFile -Name 'contensis-cli'

  Write-Warning "$packageName has already been uninstalled by other means."
  
}
elseif ($key.Count -gt 1) {
  Write-Warning "$($key.Count) matches found!"
  Write-Warning "To prevent accidental data loss, no programs will be uninstalled."
  Write-Warning "Please alert package maintainer the following keys were matched:"
  $key | % { Write-Warning "- $($_.DisplayName)" }
}
