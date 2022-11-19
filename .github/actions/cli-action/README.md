# Contensis cli action

This action allows you to interact with Contensis CMS via cli commands in your own Github Actions

## Inputs

## `alias`

**Required** 'The Contensis cloud alias to connect to'

## `project-id`

The id of the project to connect to. Default: `"website"`

## `client-id`

**Required** Client id to connect to the supplied alias

## `shared-secret`

**Required** Shared secret to use with the supplied client id

## `command`

**Required** The cli command to run including all arguments and options

## `cli-version`

Use cli from specified tag. Default: `"release"`'

## `cli-splash`

Set false to hide cli welcome screen. Default: true'

## Outputs

## `command-output`

The output returned from the command, any json data will be returned stringified and must be parsed in order to access json elements

Here is a way to parse stringified command output, access a json element and assign the value to a GitHub environment var, accessible as `${{ env.version }}` in later job steps

```yml
run: |
  VERSION_NO=$(echo -e ${{ steps.cli.outputs.command-output }} | jq .version.versionNo)
  echo "version=$VERSION_NO" >> $GITHUB_ENV
```

## Example usage

### Get entries

```yml
uses: contensis/cli-action@v1
with:
  command: get entries --zenql "sys.contentTypeId = blogPost"
  alias: example-dev
  project-id: contensis
  client-id: ${{ secrets.CONTENSIS_CLIENT_ID }}
  shared-secret: ${{ secrets.CONTENSIS_SHARED_SECRET }}
```

### Create a content type from a file

```yml
uses: contensis/cli-action@v1
with:
  command: create contenttype blogPost --from-file ./content-models/blogPost.json
  alias: example-dev
  project-id: contensis
  client-id: ${{ secrets.CONTENSIS_CLIENT_ID }}
  shared-secret: ${{ secrets.CONTENSIS_SHARED_SECRET }}
```
