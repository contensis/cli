# [![Contensis](https://github.com/contensis/cli/raw/refs/heads/main/assets/contensis-logo--tiny.svg)](https://www.contensis.com) Contensis CLI

## 📖 Looking for documentation?

**👉 You probably want the [Contensis CLI Package README →](packages/contensis-cli/README.md)**

> This is the development monorepo. **For CLI usage, installation, and command documentation**, please visit the package README.

---

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

- `yarn run build:exe:win` (for Windows)

## Add / update packages

Each of the package folders will contain their own respective `package.json` with their own `dependencies` and `devDependencies` and so on...

To install or update a dependency in the contensis-cli package run the command:

- `yarn workspace contensis-cli add --save migratortron@latest`

To install or update a development-only dependency in the contensis-cli package run the command:

- `yarn workspace contensis-cli add --dev <package-names>`

After managing workspace packages it is good to run `yarn run bootstrap` afterwards to ensure the monorepo packages are correctly hoisted and linked before continuing development

### Workspace root

The root of this workspace project contains dev dependencies that are required for the workspace, or all packages to function in the context of the monorepo

To install or update a development dependency in the workspace root run the command:

- `yarn add -W --dev eslint`

## Release

To create a new version (prerelease)

- Simply make a commit or merge to the `main` branch and the [`build` GitHub action]() should take care of the rest
- The package will be built and published to npm.js - available to install with `npm i -g contensis-cli@prerelease`
- Binaries from each commit's build workflow are uploaded to the job summary as build assets

Prepare the next release version

- The next release is taken care of by the [Release Please Action](https://github.com/marketplace/actions/release-please-action)
- Each valid commit to `main` will be analysed for changes automatically in the build action
- The next version, changelog and GitHub Release tag / notes will be brought together by the [Release Please Action](https://github.com/marketplace/actions/release-please-action)
- A Pull Request will be created/updated containing the next CLI version and you can view the changelog for that version in the PR description with your last commit message added to it

Make the release

- Simply `Squash and merge` the open [Pull Request](https://github.com/contensis/cli/pulls)
- Any merge conflicts reported here are tiny and can be resolved in the GitHub UI accepting all changes from the `release-please` branch and rejecting all the interim changes made in `main`
- The [Release Please Action](https://github.com/marketplace/actions/release-please-action) will trigger a new build in the CI, this time the build will return `release` variables.
- A tag and a [GitHub release](https://github.com/contensis/cli/releases) will be created for the Pull Request version you merged and the [`release` action workflow](https://github.com/contensis/cli/blob/main/.github/workflows/release.yml) will be triggered
- The `release` workflow will publish release versions to:
  - npm.js `contensis-cli@latest`
  - docker [`ghcr.io/contensis/cli/main/app:release`](https://github.com/contensis/cli/pkgs/container/cli%2Fmain%2Fapp)
  - chocolatey (requires moderator review before public release)
  - homebrew tap (check the [tap repository](https://github.com/contensis/homebrew-cli))

## Related repositories / packages

A few other resources exist as ways to consume Contensis CLI - the source code for building for those targets is included in this repository unless that platform requires the respective assets to be hosted in a git repository of its own

### NPM package

https://www.npmjs.com/package/contensis-cli | [Source](https://github.com/contensis/cli/tree/main/packages/contensis-cli)

### Chocolatey package

https://community.chocolatey.org/packages/contensis-cli | [Source](https://github.com/contensis/cli/tree/main/installers/chocolatey)

### Homebrew tap & formula

https://github.com/contensis/homebrew-cli

### GitHub Actions

https://github.com/marketplace/actions/contensis-cli-action | [Source](https://github.com/contensis/cli-action)

https://github.com/marketplace/actions/contensis-block-push | [Source](https://github.com/contensis/block-push)

### GitLab reusable workflows

https://gitlab.zengenti.com/ops/contensis-ci
