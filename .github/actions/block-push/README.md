# Contensis block push action

This action allows you to push a block to Contensis CMS in your own Github Actions

## Inputs

## `block-id`

**Required** The id of the block to push to

## `alias`

**Required** 'The Contensis cloud alias to connect to'

## `project-id`

The id of the project to connect to. Default: `"website"`

## `client-id`

**Required** Client id to connect to the supplied alias

## `shared-secret`

**Required** Shared secret to use with the supplied client id

## `image-uri`

The uri of the container image to build the block from. Default: `"ghcr.io/${{ github.repository }}/${{ github.ref_name }}/app:latest"` e.g. `"ghcr.io/contensis/leif/master/app:latest"`

## `auto-release`

Whether to release the block upon successful push. Default: `false`

## `tag-repo`

Whether to push a tag to the git repo upon successful block push. Default: `false`

## `git-token`

The git token from secrets to use when pushing to the git repo upon successful block push. Default: ${{ github.token }}

## Outputs

## `block-version`

The version number of the pushed block

## `git-tag`

The pushed tag name if `tag-repo` input is `true`

## Example usage

### Simple block push

```yml
uses: contensis/block-push@v1
with:
  block-id: name-of-block
  alias: example-dev
  project-id: website
  client-id: ${{ secrets.CONTENSIS_CLIENT_ID }}
  shared-secret: ${{ secrets.CONTENSIS_SHARED_SECRET }}
```

### Push, release and tag block version

Push a block called `name-of-block`, set it to release automatically, and push a git tag containing the block version number

```yml
- name: Push block to Contensis
  id: push-block
  uses: contensis/block-push@v1
  with:
    block-id: name-of-block
    auto-release: true
    alias: example-dev
    project-id: website
    client-id: ${{ secrets.CONTENSIS_CLIENT_ID }}
    shared-secret: ${{ secrets.CONTENSIS_SHARED_SECRET }}
    tag-repo: true
    git-token: ${{ github.token }}
```

- Include `id: push-block` attribute to reference the job step later (e.g. to access outputs in `steps.push-block.outputs.*`)

### Outputs

```yml
- name: Echo push-block outputs
  run: |
    echo block-version: ${{ steps.push-block.outputs.block-version }}
    echo git-tag: ${{ steps.push-block.outputs.git-tag }}
```
