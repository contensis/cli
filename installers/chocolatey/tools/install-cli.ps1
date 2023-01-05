# Download a contensis/node-cli Windows release from github
param ($outFile, $preRelease = $false)

$repo = "contensis/node-cli"
$filenamePattern = "*-win.exe"

Write-Output "Downloading contensis-cli from GitHub release"

if ($preRelease) {
    $releasesUri = "https://api.github.com/repos/$repo/releases"
    $downloadUri = ((Invoke-RestMethod -Method GET -Uri $releasesUri)[0].assets | Where-Object name -like $filenamePattern ).browser_download_url
}
else {
    $releasesUri = "https://api.github.com/repos/$repo/releases/latest"
    $downloadUri = ((Invoke-RestMethod -Method GET -Uri $releasesUri).assets | Where-Object name -like $filenamePattern ).browser_download_url
}

$filename = $(Split-Path -Path $downloadUri -Leaf)
$downloadTo = if ( $outFile ) { $outFile } else { ".\$filename" }

Write-Output "[install-cli] Downloading $downloadUri"
Write-Output "[install-cli] Writing to $downloadTo"

Invoke-WebRequest -Uri $downloadUri -Out $downloadTo

Write-Output "[install-cli] Downloaded release"
