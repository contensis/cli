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

## Outputs

No outputs are implemented as yet.

## Example usage

```yml
uses: contensis/block-push@v1
with:
  block-id: name-of-block
  auto-release: true
  alias: example-dev
  project-id: website
  client-id: ${{ secrets.CONTENSIS_CLIENT_ID }}
  shared-secret: ${{ secrets.CONTENSIS_SHARED_SECRET }}
```
