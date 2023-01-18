# Contensis CLI

If you are using this package you may want the [Contensis CLI package README](packages/contensis-cli/README.md)

## Contensis CLI development

After cloning this project:

- Clone any other packages you require into the `/packages` folder
- `yarn run bootstrap`
- `cd packages/contensis-cli`

To run commands in CLI

- `npm start -- {cli command}`

To start the Contensis shell to run commands

- `npm start`

or do this from the root folder with

- `yarn run cli`

To build the project from root folder

- `yarn run build`

To build an executable for your operating system

- `yarn run build:exe` \* outputting to `bin/` folder

To create a new version

- Simply make a commit or merge to the `main` branch and the GitHub Actions should take care of the rest
- Binaries from each commit are uploaded to the job output as build assets

To create a release

- This is currently manually triggered from the Releases page
- Release notes are typed out and will be a summary of key changes since last release tag
- Release assets are downloaded from build assets and uploaded to this new release
- A new git tag will be created matching the release version
- Pre-releases are supported and are indicated with the pre release flag in the GitHub Release
- Another GitHub Action triggered by the release will build and tag a release from the created git tag for other platforms such as [`Docker`](https://github.com/contensis/node-cli/pkgs/container/node-cli%2Fmain%2Fapp/53826128?tag=release)

## Related repositories / packages

A few other resources exist as ways to consume Contensis CLI - the source code is included in this repository unless that platform requires the respective assets to be hosted in a git repository of its own

### NPM package

https://www.npmjs.com/package/contensis-cli

### Chocolatey package

https://community.chocolatey.org/packages/contensis-cli

### Homebrew tap & formula

https://github.com/contensis/homebrew-cli

### GitHub Actions

https://github.com/marketplace/actions/contensis-cli-action
https://github.com/marketplace/actions/contensis-block-push-action

### GitLab reusable workflows

https://gitlab.zengenti.com/ops/contensis-ci
