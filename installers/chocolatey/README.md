# Contensis CLI Chocolatey package

https://community.chocolatey.org/packages/contensis-cli

## What is Chocolatey?

Chocolatey is a package manager for Windows

Further information:

- https://docs.chocolatey.org/en-us/faqs#what-is-chocolatey
- https://chocolatey.org/install
- https://docs.chocolatey.org/en-us/create/create-packages

## Install contensis-cli from community registry

- `choco install contensis-cli`

or for pre-release versions

- `choco install contensis-cli --pre`

Note: install and uninstall commands are executed in a terminal "run as administrator"

## After making changes

- First, always `cd` to the package folder
- run `choco pack` to generate a new `*.nupkg` file

### Test local package installation

- `choco install contensis-cli --pre -y -s .`
- the package should be installed and ready to test

### Uninstall local test package

- `choco uninstall contensis-cli -y -s .`

## Publish new package version

### Version bump

Update the version in the `*.nuspec` xml file

**Important: delete any existing `*.nupkg` file in the package folder**

Run `choco pack` to create a new `*.nupkg` file, ready for test installation or push

### API Key

Ensure the api key is set to allow you to push to the Chocolatey community registry

- `choco apikey --key $CHOCOLATEY_API_KEY --source https://push.chocolatey.org/`

### choco push

Push the `*.nupkg` file we generated previously with the `choco pack` command

- `choco push contensis-cli.{ replace version }.nupkg --source https://push.chocolatey.org/`
