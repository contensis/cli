# Contensis cli CMS action

This action allows you to interact with Contensis CMS via cli commands in your own Github Actions

## Inputs

## `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## `alias`

**Required** 'The Contensis cloud alias to connect to'

## `project-id`

The id of the project to connect to. Default: `"website"`

## `client-id`

**Required** Client id to connect to the supplied alias

## `shared-secret`

**Required** Shared secret to use with the supplied client id

## `block-id`

The id of the block to push to

## `image-uri`

The uri of the container image to build the block from. Default: `"ghcr.io/${{ github.repository }}/${{ github.ref_name }}/app:latest"`

## `auto-release`

Whether to release the block upon successful push. Default: `false`

## Outputs

No outputs are implemented as yet.

## Example usage

### Push a block

```yml
uses: contensis/cli-action@v1
with:
  block-id: name-of-block
  auto-release: true
  alias: example-dev
  project-id: contensis
  client-id: ${{ secrets.CONTENSIS_CLIENT_ID }}
  shared-secret: ${{ secrets.CONTENSIS_SHARED_SECRET }}
```

### Run other CLI commands

```yml
uses: contensis/cli-action@v1
with:
  command: create contenttype blogPost --from-file ./content-models/blogPost.json
  alias: example-dev
  project-id: contensis
  client-id: ${{ secrets.CONTENSIS_CLIENT_ID }}
  shared-secret: ${{ secrets.CONTENSIS_SHARED_SECRET }}
```
