# Contensis CLI

If you are using this package you may want the [Contensis CLI package README](packages/contensis-cli/README.md)

## Development

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

## Build

To build the project from root folder

- `yarn run build`

To build an executable for your operating system

- `yarn run build:exe` \* outputting to `bin/` folder

## Release

To create a new version (prerelease)

- Simply make a commit or merge to the `main` branch and the GitHub Actions should take care of the rest
- The package will be built and published to npm.js - available to install with `npm i -g contensis-cli@prerelease`
- Binaries from each commit's build workflow are uploaded to the job summary as build assets

To prepare the next release version

- `cd packages/contensis-cli`
- Update the package version with one of
  - `npm version patch`
  - `npm version minor`
  - `npm version major`
  - `npm version 1.0.1`
- Delete the created `package-lock.json` file at the root (this is not needed as we have a `yarn.lock`)
- Run and check version
  - `npm start`
  - `--version` (in the shell prompt)
- Commiting:
- Commit message should include the phrases `[nobuild]` and `[nopublish]` e.g **prep: release files [nobuild]**
- Commit files should be:
  - `yarn.lock`
  - `package-lock.json` (packages/contensis-cli)
  - `package.json` (packages/contensis-cli)
  - `verison.ts` (packages/contensis-cli/src)

To create a release

- Create a new release from the repo [Releases page](https://github.com/contensis/node-cli/releases/new)
- The release version will match the `package.json` version in `/packages/contensis-cli` (prefixed with "v" e.g. "v1.0.1")
- A new git tag will be created matching the release version
- Release notes are typed out and will be a summary of key changes since last release tag
- Release assets are found in the summary page of the last GitHub build pipeline (stored as build artifacts). Download the artifact for each OS, unzip and then attach them (upload) the extracted files to this new release.
- Pre-releases are supported and are indicated with the "Set as a pre-release" flag in the GitHub Release
- A GitHub Action will be triggered by creating the release. The workflow will publish the release version to npm.js (if it does not currently exist). Also push a release tag to the latest [`Docker`](https://github.com/contensis/node-cli/pkgs/container/node-cli%2Fmain%2Fapp/53826128?tag=release) image.
- If the release workflow fails, it can be manually run any time with a workflow trigger from the GitHub Action page - the input will be either "latest" or "prerelease"

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
