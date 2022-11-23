# Contensis CLI

Use Contensis from your favourite terminal

Install the package via `npm` as a global module (requires NodeJS)

```shell
npm i contensis-cli --global
```

Alternatively, download the executable for your operating system from the [Releases page](https://github.com/contensis/node-cli/releases)

## Skip to section

- ### [Contensis Shell](#contensis-shell)
- [Use in Terminal](#cli-usage)
  - [Pass connection details anywhere](#pass-connection-details-anywhere)
- [Use in Docker](#use-in-docker)
  - [Run cli commands](#run-cli-commands)
  - [Persist connections to a local file](#persist-connections-to-a-local-file)
- [Use in GitLab CI](#use-in-gitlab-ci)
- [Use in GitHub CI](#use-in-github-ci)
- [Running headless?](#running-headless-)

## Use in Terminal

Try

```shell
contensis connect example-dev
```

or

```shell
contensis help
```

The CLI uses exactly the same commands as the shell. It is recommended you use and familiarise yourself with the cli by using the shell and then use the same cli commands when you need to in script-based context such as continuous integration environments.

### Pass connection details anywhere

If you need to, you can supply all the necessary options to connect to a Contensis project and perform an operation in a single command

You can supply the following options with any command - although they don't appear in help text:

```
 -a  --alias
 -p  --project-id
 -u  --user
 -pw --password
 -id --client-id
 -s  --shared-secret
```

Using this approach in the cli or the shell will assume these credentials are for your current envioronment and will set the local environment cache for subsequent commands

## Use in Docker

Running the container with the `-it` docker options will launch a shell session

```bash
docker pull ghcr.io/contensis/node-cli/main/app:latest
docker run --rm -it ghcr.io/contensis/node-cli/main/app:latest
```

### Run cli commands

Add the cli command and any options after the container image in the `docker run` command e.g.

```bash
docker run --rm ghcr.io/contensis/node-cli/main/app:latest get entries "test"
```

### Persist connections to a local file

To use the cli container for multiple commands or to save connections for future sessions, map a volume to the docker container

<aside>
⚠️ Ensure a file called `environments.json` exists before mapping the volume to the docker container. If it doesn’t exist, create this empty file first.

</aside>

Linux

```bash
touch environments.json
docker run --rm -v $(pwd)/environments.json:/usr/src/app/environments.json -it ghcr.io/contensis/node-cli/main/app:latest
```

Windows

```powershell
echo {} > environments.json
docker run --rm -v ${PWD}/environments.json:/usr/src/app/environments.json -it ghcr.io/contensis/node-cli/main/app:latest
```

## Use in GitLab CI

```yaml
push-to-contensis-block:
  stage: push-to-contensis
  only:
    - master
  image: ghcr.io/contensis/node-cli/main/app:release
  script:
    # Create CI/CD Variables in repo settings called CONTENSIS_CLIENT_ID and CONTENSIS_SHARED_SECRET
    - contensis connect example-dev --project-id website --client-id $CONTENSIS_CLIENT_ID --shared-secret $CONTENSIS_SHARED_SECRET
    - contensis push block example-website-block $APP_IMAGE:latest --release
```

## Use in GitHub CI

```yaml
- name: Push block to Contensis
  uses: contensis/cli-action@v1
  with:
    block-id: example-website-block
    # auto-release: true # release the block straight away
    alias: example-dev
    project-id: website
    client-id: ${{ secrets.CONTENSIS_CLIENT_ID }} # create secrets for actions
    shared-secret: ${{ secrets.CONTENSIS_SHARED_SECRET }} # in repo settings
    tag-repo: true # tag commit with block version
    git-token: ${{ github.token }} # to allow the git tag
```

## Running headless?

Most lightweight CI environments will likely not ship with the ability to easily load and unlock an encrypted keychain.

In these environments you will see a warning message when using the cli with any credentials, in most cases this type of envioronment is normally disposed of after the command/session has completed and the warning can be safely ignored.

```shell
  [WARN] Could not connect to local keystore - your password could be stored unencrypted!
```

> **Note**
> There is a workaround for installing a secret store and launching an X11 session with an unlocked keyring which has been left in here below for anyone who wishes to try it

~~The required credentials to run commands are stored and read from a secret store `libsecret`. Without the secret store running and unlocked we receive an error `Cannot autolaunch D-Bus without X11 $DISPLAY`~~

```shell
sudo apt-get update && sudo apt-get install -y libsecret-1-0 dbus-x11 gnome-keyring
export $(dbus-launch)
dbus-launch
gnome-keyring-daemon --start --daemonize --components=secrets
echo 'neil' | gnome-keyring-daemon -r -d --unlock
```

~~Also, if you are running within a docker container, it requires `--cap-add=IPC_LOCK` option when running the container. Otherwise gnome-keyring-daemon will fail with: `gnome-keyring-daemon: Operation not permitted`~~

~~An executable script is available to test: `contensis-cli-headless` you will need sudo access to install additional libraries with `apt-get`~~

# Contensis Shell

The shell is the preferred way to use the cli, if the package is installed to your global `node_modules` you can start it by opening your terminal and typing `contensis`.

```
~$ contensis


   _|_|_|                        _|                                    _|
 _|          _|_|    _|_|_|    _|_|_|_|    _|_|    _|_|_|      _|_|_|        _|_|_|
 _|        _|    _|  _|    _|    _|      _|_|_|_|  _|    _|  _|_|      _|  _|_|
 _|        _|    _|  _|    _|    _|      _|        _|    _|      _|_|  _|      _|_|
   _|_|_|    _|_|    _|    _|      _|_|    _|_|_|  _|    _|  _|_|_|    _|  _|_|_|


© 2001-2022 Zengenti 🇬🇧.
 - Creators of Contensis and purveyors of other fine software

👋 Welcome to the contensis-cli

Press [CTRL]+[C] or type "quit" to return to your system shell
Press [TAB] for suggestions

  -------------------------------------
contensis >
```

## Skip to section

- [Get started](#get-started)
- [Connect to a Contensis Cloud environment](#connect-to-a-contensis-cloud-environment)
- [Login to a connected Contensis environment](#login-to-a-connected-contensis-environment)
- [Manage Projects](#manage-projects)
  - [List projects](#list-projects)
  - [Set current project](#set-current-project)
  - [Get project metadata](#get-project-metadata)
  - [Set project metadata](#set-project-metadata)
- [Content Models](#content-models)
  - [List content models](#list-content-models)
  - [Examine a content model](#examine-a-content-model)
  - [List content types, components](#list-content-types--components)
  - [Examine a content type or component](#examine-a-content-type-or-component)
- [Entries](#entries)
  - [Get entries](#get-entries)
  - [Get an entry by id](#get-an-entry-by-id)
  - [Get an entry with all of its dependents](#get-an-entry-with-all-of-its-dependents)
  - [Get entries with a ZenQL statement](#get-entries-with-a-zenql-statement)
  - [Choose entry fields to output](#choose-entry-fields-to-output)
  - [Output results to a file](#output-results-to-a-file)
- [Format output](#format-output)
- [Manage API keys](#manage-api-keys)
  - [List keys](#list-keys)
  - [Create key](#create-key)
  - [Remove key](#remove-key)
- [Manage content Blocks](#manage-content-blocks)
  - [List blocks](#list-blocks)
  - [Get block](#get-block)
  - [Get block logs](#get-block-logs)
  - [Push a block](#push-a-block)
  - [Release a block version](#release-a-block-version)
- [Import content models](#import-content-models)
  - [Import from another Contensis environment](#import-from-another-contensis-environment)
  - [From a file](#from-a-file)
- [Import entries](#import-entries)
  - [Import from another Contensis environment](#import-from-another-contensis-environment-1)
  - [Import from a file](#import-from-a-file)

## Get started

Press `[tab]` key at any time to show suggested commands or to attempt to auto-complete the command you are typign

```shell
>> Available commands:
connect      list envs    quit
```

Add `--help` to any command to show the available options and arguments e.g.

```shell
contensis > connect --help
Usage: contensis connect <alias>

Arguments:
  alias       the Contensis Cloud alias to connect with

Options:
  -h, --help  display help for command

Example call:
  > connect example-dev
```

Just type `help` to show the cli command help

## Connect to a Contensis Cloud environment

Use the connect command followed by the cloud alias of your environment

```shell
contensis > connect example-dev
[cli] ✅ Current environment set to "example-dev"
[cli] ⚠️  Cannot retrieve projects list
[cli] ⏩ Introduce yourself with "login {username}" or "login {clientId} -s {secret}"

  -------------------------------------
contensis example-dev>
```

After connecting you will notice the shell prompt will now contain the current "connected" environment e.g. `contensis example-dev> `

Contensis must be online and available in order to connect to it

```shell
contensis > connect exemple-dev
[cli] ❌ Cannot reach https://cms-exemple-dev.cloud.contensis.com
```

## Login to a connected Contensis environment

If you wish to use your normal username and password you will issue the command `login {username}`

```shell
contensis example-dev> login t.durden
? Enter password for t.durden@example-dev: ********
[cli] ✅ User t.durden connected to example-dev successfully

[cli]  ℹ  Saved credentials for contensis-cli_example-dev

  -------------------------------------
contensis t.durden@example-dev>
```

If you are logging in via a script or service you will likely be using an API key set up in Contensis, you would provide the full credentials with the command `login {clientId} -s {sharedSecret}`.

If you need to skip this step for any reason you could [pass connection details anywhere](#pass-connection-details-anywhere)

## Manage Projects

### List projects

Issuing the command `list projects` will fetch a list of projects from the connected Contensis environment

```shell
contensis t.durden@example-dev> list projects
[cli] ✅ Available projects:
  - [en-GB] intranet
  - [en-GB] marketingSite
  - [en-GB] microsite
  - * [en-GB] website
```

Or if you are not logged in you should be given useful tips

```shell
contensis example-dev> list projects
[cli]  ℹ  Introduce yourself with "login {username}" or "login {clientId} -s {secret}"
```

### Set current project

Set your current working project with the `set project {projectId}` command

```shell
contensis t.durden@example-dev> set project intranet
[cli] ✅ Current project is "intranet"
  -------------------------------------
intranet t.durden@example-dev> list projects
[cli] ✅ Available projects:
  - * [en-GB] intranet
  - [en-GB] marketingSite
  - [en-GB] microsite
  - [en-GB] website

intranet t.durden@example-dev>
```

You will notice the `contensis` prompt has been updated to show your current connected project

### Get project metadata

```shell
contensis t.durden@example-dev> get project

  id: contensis
  uuid: 4df681ef-f3bc-3d79-57b8-de3f0570b9b3
  name: Contensis
  description:
  primaryLanguage: en-GB
  supportedLanguages:
    en-GB
  color: cobalt

contensis t.durden@example-dev>
```

### Set project metadata

Update a project name

```shell
contensis t.durden@example-dev> set project name "Contensis website"
[cli] ✅ [example-dev] Updated project contensis
  id: contensis
  uuid: 4df681ef-f3bc-3d79-57b8-de3f0570b9b3
  name: Contensis website
  description:
  primaryLanguage: en-GB
  supportedLanguages:
    en-GB
  color: cobalt

contensis t.durden@example-dev>
```

Update a project's description

```shell
contensis t.durden@example-dev> set project description "Main product site"
[cli] ✅ [example-dev] Updated project contensis
  id: contensis
  uuid: 4df681ef-f3bc-3d79-57b8-de3f0570b9b3
  name: Contensis website
  description: Main product site
  primaryLanguage: en-GB
  supportedLanguages:
    en-GB
  color: cobalt

contensis t.durden@example-dev>
```

## Content Models

Manage your content models like you are the chosen one

### List content models

```shell
contensis t.durden@example-dev> list models
[cli] ✅ [website] Content models [ 19 ]

  - accessibleVideo { required by: 3 }
  - blogListing { components: 1, contentTypes: 2, references: 33, required by: 4 }
  - blogPost { components: 2, contentTypes: 6, references: 33, required by: 9 }
  - callToAction { contentTypes: 9, references: 33, required by: 5 }
  - category { required by: 1 }
  - contentPage { components: 5, contentTypes: 6, references: 33, required by: 7 }
  - externalLink { required by: 2 }
  - growingConditions { components: 1, references: 1, required by: 1 }
  - homepage { components: 4, contentTypes: 8, references: 33, required by: 3 }
  - landingPage { components: 9, contentTypes: 12, references: 33, required by: 7 }
  - person { required by: 2 }
  - plant { components: 2, contentTypes: 3, references: 8, required by: 10 }
  - plantType { required by: 2 }
  - pot { components: 2, contentTypes: 1, references: 3, required by: 11 }
  - productListing { components: 1, references: 1, required by: 4 }
  - review { contentTypes: 3, references: 10, required by: 1 }
  - siteSettings
  - tag { required by: 5 }

contensis t.durden@example-dev>
```

### Examine a content model

A `model` is a complete view of a content type that includes all of its dependents - and the dependents of those dependents

- `contentTypes` are the content types that have content linked to the model directly from this content type
- `components` are the content types that have content linked to the model directly from this content type
- `dependencies` is an exhaustive list of dependencies and inner dependents [the values in brackets are the models that have required it to make it a dependency]
- `dependencyOf` is a list of all the other content types (or components) that reference this content type directly, this model is a dependency of those

```shell
contensis t.durden@example-dev> get model plant
[cli] ✅ Content models in contensis:

  id: plant
  dataFormat: model
  name:
    en-GB: Plant
  description:
    en-GB: Use this content type to store information about individual plants.
  contentTypes:
    growingConditions
    plantType
    tag
  components:
    externalPromotion
    plantVariant
  dependencyOf:
      callToAction
      homepage
      landingPage
      review
      button
      cardRow
      curatedProductSlider
      featuredBlogPosts
      featuredProduct
      promotedProduct
  dependencies:
    growingConditions
      [plant]
    plantType
      [plant]
    pot
      [plantVariant]
    tag
      [plant, pot]
    externalPromotion
      [plant, pot]
    icon
      [growingConditions]
    plantVariant
      [plant]
    potVariant
      [pot]


contensis t.durden@example-dev>
```

### List content types, components

```shell
contensis t.durden@example-dev> list contenttypes
[cli] ✅ Content types in "website":
  - accessibleVideo [4 fields]
  - blogListing [4 fields]
  - blogPost [12 fields]
  - callToAction [5 fields]
  - category [2 fields]
  - contentPage [11 fields]
  - event [5 fields]
  - externalLink [2 fields]
  - growingConditions [3 fields]
  - homepage [8 fields]
  - landingPage [13 fields]
  - person [2 fields]
  - plant [13 fields]
  - plantType [3 fields]
  - pot [10 fields]
  - productListing [2 fields]
  - review [5 fields]
  - tag [1 field]
```

### Examine a content type or component

```shell
contensis t.durden@example-dev> get contenttype pot
[cli] ✅ [website] Content type "pot"
  uuid: 929a99d2-fe5c-4781-84fa-f5a3738aa96d
  id: pot
  projectId: website
  name:
    en-GB: Pot
  description:
  entryTitleField: productName
  entryDescriptionField: description
  fields:
    productName**: string
    description: string
    externalPromotion: object<component.externalpromotion>
    colour: string
    material: string
    potVariant: objectArray<component.potvariant>
    primaryImage: object<image>
    photos: objectArray<image>
    externalCardImage: object<image>
    tags: objectArray<entry, tag>
  defaultLanguage: en-GB
  supportedLanguages:
    en-GB
  workflowId: contensisEntryBasic
  dataFormat: entry
  groups:
    main
    photos
    tags
  includeInDelivery: true

contensis t.durden@example-dev>
```

## Entries

### Get entries

Use the `get entries` command

The simplest usage is `get entries {keyword}` or `get entries "{search phrase}"`

```shell
website t.durden@example-dev> get entries "good plants"
  -------------------------------------
[24/07 01:48:58] [INFO] Fetching initial entries in project 'website'
 Fetch [website]                                        >> 100% 8 0.0s/0.0s Infinityp/s

Found 8 entries in [website]
--------------------------------------------

 id                                    contentTypeId  entryTitle                      entryDescription
----------------------------------------------------------------------------------------------------------------------
 b7129080-692c-4550-9e2b-28f8ec978651  plant          Chinese evergreen               Easy to care for and air purif
 63b19aac-e5b5-44e5-a6bb-f49e466f2afb  blogPost       The best plants for looking af  Did you know that houseplants
 89bcc566-e9c8-427b-aa56-226c826353f3  blogPost       Why plants are good for your m  There’s plenty of research to
 3fe3cebe-8c09-429e-a1af-b636ffc008a4  review         Great plant – not so great del  null
 a116716b-7249-4d00-8c93-e57861d984a6  blogPost       The best houseplants for your   Houseplants are growing in pop
 f2c98349-28e4-42f3-8677-e6b5c04948c5  landingPage    Register for our new subscript  Leif Club, our new subscriptio
 d931f2d3-d852-49d6-9137-a7d12ae672a6  blogPost       How to look after your plants   It doesn’t matter if you’ve be
 0e79c27b-d1bf-4545-a40d-daa17d8726a4  homepage       Find the perfect plant          null
----------------------------------------------------------------------------------------------------------------------

website t.durden@example-dev>
```

### Get an entry by id

```shell
website t.durden@example-dev> get entries --id 7cf921a0-ee4f-4bd6-a3f2-0fb0fe1a2ac8
  -------------------------------------
[24/07 01:54:01] [INFO] Fetching initial entries in project 'website'
 Fetch [website]                            >> 100% 1 0.0s/0.0s 100000p/s

Found 1 entries in [website]
--------------------------------------------

 id                                    contentTypeId  entryTitle  entryDescription
-------------------------------------------------------------------------------------------------
 7cf921a0-ee4f-4bd6-a3f2-0fb0fe1a2ac8  plant          Aloe vera   Every kitchen should have an a
-------------------------------------------------------------------------------------------------

website t.durden@example-dev>
```

### Get an entry with all of its dependents

Add the `--dependents` or `-d` flag to your `get entries` command to also find and fetch all dependent (linked) entries, recursively finding and including any dependent entries found inside those dependents.

```shell
website t.durden@example-dev> get entries --dependents --id 7cf921a0-ee4f-4bd6-a3f2-0fb0fe1a2ac8
  -------------------------------------
[24/07 01:55:43] [INFO] Fetching initial entries in project 'website'
 Fetch [website]                                     >> 100% 1 0.0s/0.0s Infinityp/s
 Fetch [website]                                     >> 100% 9 0.0s/0.0s Infinityp/s
 Fetch [website]                                     >> 100% 2 0.0s/0.0s Infinityp/s

Found 12 entries in [website]
--------------------------------------------

 id                                    contentTypeId      entryTitle               entryDescription
------------------------------------------------------------------------------------------------------------
 7cf921a0-ee4f-4bd6-a3f2-0fb0fe1a2ac8  plant              Aloe vera                Every kitchen should have
 51390024-f193-436f-8552-646cf77ccfdb  image              aloe-vera-closeup        null
 c0d4ec16-6de2-4394-aaf4-03a56d343bff  image              aloe-vera-gold-pot       null
 ccbc4dd0-7bd6-4295-ab8e-da9f529fe5e0  image              succulents-collection    null
 f2022069-7a92-491d-b197-a3564ab9a8ca  pot                Grå small grey pot       Grå is a small grey concr
 452a4ee5-611b-4382-b7c7-06d810b5e698  pot                Vit mid-sized white pot  Vit is a mid-sized white
 70149568-9725-4c39-8ff5-ef69221a0899  plantType          Succulents               Succulent plants store wa
 711251f9-f9c6-473b-8b62-0ec8a0d4978c  growingConditions  Partial shade            This plant likes bright i
 d815819d-61c6-4037-95d3-c503acf52153  growingConditions  Prefers dry conditions   This plant prefers dry co
 3659a333-8d10-4325-9ea6-2f49ae47e7fe  tag                Promoted                 null
 2a62ab2a-6a79-4917-b611-c69f0640760d  image              gra-pot                  null
 43fdab9f-e687-4d1f-a283-3fa25af437fc  image              vit-pot                  null
------------------------------------------------------------------------------------------------------------

website t.durden@example-dev>
```

### Get entries with a ZenQL statement

Use a ZenQL statement to find entries with the `--zenql` or `-q` option, add your statement inside `"double quotes"`. Refer to [ZenQL documentation](https://www.contensis.com/help-and-docs/user-guides/zenql-search) and test your statement for the right results in the Contensis web UI.

```shell
website t.durden@example-dev> get entries --zenql "sys.contentTypeId = plant"
  -------------------------------------
[24/07 01:52:37] [INFO] Fetching initial entries in project 'website'
 Fetch [website]                                      >> 100% 21 0.0s/0.0s Infinityp/s

Found 21 entries in [website]
--------------------------------------------

 id                                    contentTypeId  entryTitle               entryDescription
--------------------------------------------------------------------------------------------------------------
 7cf921a0-ee4f-4bd6-a3f2-0fb0fe1a2ac8  plant          Aloe vera                Every kitchen should have an a
 0d94dbf2-89f8-45fb-96d5-175ae1f382ce  plant          Areca palm               An easy-to-care for palm that
 43a60005-ea92-4b32-9af3-79560e48ecec  plant          Boston fern              Brighten up your bath time wit
 f0cac96c-39a1-4b85-b14b-e8d7d3d08767  plant          Calathea orbifolia       This beautiful foliage plant h
 d647012b-897e-4b6b-bfb5-b9844ef3d648  plant          Canary Island Date Palm  An easy-to-care for palm that
 b7129080-692c-4550-9e2b-28f8ec978651  plant          Chinese evergreen        Easy to care for and air purif
 6dc1cb96-cee3-4fef-acde-54fb395bcf4b  plant          Chinese money plant      The Chinese money plant’s mini
 8c284599-b615-40a7-9d26-0ddd586fff51  plant          Dracaena fragrans        A great option for beginner pl
 329e3104-332f-48a4-b43a-de852df796b3  plant          Elephant ear             Elephant ear plants are a grea
 504f7b7f-af03-4711-94ca-07edb90fbe00  plant          Heartleaf philodendron   Native to Central America and
 a9a537e8-5508-4166-878c-d5fcd0d9a723  plant          Maidenhair fern          Easily identified by its brigh
 9a3cc767-8fc1-4ee5-83e1-63c14a508c69  plant          Parlour palm             Add a bit of Central America i
 ee488c3b-a3a3-4b9c-a3ad-c5a5bdc7e317  plant          Peace lily               A classic choice for adding a
 6a71a864-6f61-471a-8cdd-f80237408666  plant          Pink moth orchid         Why buy cut flowers when you c
 50868245-3e53-4d9f-86ed-403593da67f6  plant          Ponytail palm            Despite its name, this popular
 4f05979f-d8cf-4568-9045-05731a33f243  plant          Spider plant             Breate easy with help from a s
 76a16c87-5e6d-465b-a343-3f14cf2fea0a  plant          String of nickels        A hanging plant that requires
 61a2af3a-332c-453c-b9f6-1851d9b7d936  plant          Swiss cheese plant       Bring laid-back central Americ
 8174fb53-b955-4e36-8f87-646bf286e396  plant          Variegated snake plant   Snake plants are a great choic
 b8aa31da-f993-4d81-a361-94ecd5e42547  plant          White moth orchid        Why buy cut flowers when you c
 0d707ffe-f42d-44a6-b839-46156ee7f4f3  plant          Yellow moth orchid       Why buy cut flowers when you c
--------------------------------------------------------------------------------------------------------------

website t.durden@example-dev>
```

### Choose entry fields to output

Add the `--fields` or `-f` option to your `get entries` command to limit and order the entry fields that are returned, add the api key of each field to be returned separated by a space

```shell
website t.durden@example-dev> get entries --fields productName colour material externalPromotion --zenql "sys.contentTypeId = pot"
  -------------------------------------
[24/07 02:05:42] [INFO] Fetching initial entries in project 'website'
 Fetch [website]                                        >> 100% 12 0.0s/0.0s Infinityp/s

Found 12 entries in [website]
--------------------------------------------

 productName                     colour         material    externalPromotion
----------------------------------------------------------------------------------------------------------------
 Barro decorated terracotta pot  Brown          Clay        {externalTitle:Buy a Barro decorated terracott
 Bianco white pot                White          Porcelain   {externalTitle:Buy a Bianco small white pot fr
 Canasta mid-sized pot           Cream          Clay        {externalTitle:Buy a Canasta mid-sized clay po
 Geo mid-sized pot               Grey           Concrete    {externalTitle:Buy a Geo mid-sized concrete po
 Grå small grey pot              Grey           Concrete    {externalTitle:Buy a Grå small grey pot from L
 Luna round pot                  White          Ceramic     {externalTitle:Buy a Luna round pot from Leif,
 Marmo terrazzo-style pot        White          Concrete    {externalTitle:Buy a Marmo terrazzo-style pot
 Milano dipped pot               Multicoloured  Ceramic     {externalTitle:Buy a Milano dipped pot from Le
 Roja red pot                    Red            Fibrestone  {externalTitle:Buy a medium or large Rosa red
 Rosa pot                        Pink           Clay        {externalTitle:Buy a Rosa coral pink pot from
 Terra large terracotta pot      Brown          Clay        {externalTitle:Buy a Terra large terracotta po
 Vit mid-sized white pot         White          Ceramic     {externalTitle:Buy a Vit mid-sized white pot f
----------------------------------------------------------------------------------------------------------------

website t.durden@example-dev>
```

### Output results to a file

Use the `--output` or `-o` option followed by the file name you wish for command output to be written to

```shell
website t.durden@example-dev> get entries --zenql "sys.contentTypeId = pot" --output products-pot.json
  -------------------------------------
[24/07 02:12:27] [INFO] Fetching initial entries in project 'website'
 Fetch [website]                        >> 100% 12 0.0s/0.0s 100000p/s
[cli] ✅ Output file: C:\dev\contensis-cli\products-pot.json
website t.durden@example-dev>
```

Combine other options and mobilise your data to consume elsewhere

```shell
get entries -d -o aloe-complete-entry.json -id 7cf921a0-ee4f-4bd6-a3f2-0fb0fe1a2ac8
  -------------------------------------
[24/07 02:16:04] [INFO] Fetching initial entries in project 'website'
 Fetch [website]                         >> 100% 1 0.0s/0.0s 100000p/s
 Fetch [website]                       >> 100% 9 0.0s/0.0s Infinityp/s
 Fetch [website]                       >> 100% 2 0.0s/0.0s Infinityp/s
[cli] ✅ Output file: C:\dev\contensis-cli\aloe-complete-entry.json
website t.durden@example-dev>
```

## Format output

Override the output format with the `--format` or `-f` option.

Available options are: `json`, `xml` or `csv`

The `--format` and `--output` options are available with most commands (check command `--help`)

Output will normally default to JSON when saved with the `--output` flag.

## Manage API keys

You can use the cli or shell to manage API keys that are used to provide access to external application integrations

### List keys

```shell
website t.durden@example-dev> list keys
[cli] ✅ [example-dev] API keys:
  - Slack webhooks [2021-09-22 zengenti]
      144ea36d-3cb1-406e-b6d1-931162780d0b
      6fad017d75ce434eb0b0703bf40d4dac-842394737615483e95a22eee6cdcff1d-a238f992b45640708336781029838ec9
  - Contensis blocks [2021-10-26 zengenti]
      e4376db2-ed3e-49d3-a799-a6ec733a3611
      a8590f6b4630404186b72fea198d3c12-c6f1f565eb86428ea0170e1b4b8a4b7f-de88eb42e46c4d548a8c36f490f34866
  - Content migration API [2022-03-01 t.durden]
      5bea0a71-cd21-41a9-84a3-2f64a2c4394a
      22c7808a109749c8b37723a8572e5323-ea79651f111a464d980db162e5254b02-954790ca475a4fa186e91f76ce38b4c6

website t.durden@example-dev>
```

### Create key

```shell
website t.durden@example-dev> create key "Test key" "Key to demonstrate cli"
[cli] ✅ [example-dev] Created API key "Test key"
  - Test key (Key to demonstrate cli) [2022-07-27 t.durden]
  - id: af645b8b-fa3b-4196-a1b7-ac035f7598a3
  - sharedSecret: 1ff8b259423c4be08589a63f180c1bdc-63bd3a4f421c44c2afd0ba61e837d671-6aa9532442f149e6a9a837326a9a98e9

website t.durden@example-dev>
```

Run `list keys` again and you will see your new API key added to the returned list of keys

### Remove key

```shell
website t.durden@example-dev> remove key af645b8b-fa3b-4196-a1b7-ac035f7598a3
[cli] ✅ [example-dev] Deleted API key "af645b8b-fa3b-4196-a1b7-ac035f7598a3"

website t.durden@example-dev>
```

Run `list keys` again and you will see your new API key has been removed from the list of keys

## Manage content Blocks

You can manage blocks for any Contensis project using the following commands

### List blocks

```shell
website t.durden@example-dev> list blocks
[cli] ✅ [example-dev] Blocks in project website:
  - cli-test-block
      [master]: running
  - simple-block +9
      [feature-test-feature-branch]: running
      [master]: running

website t.durden@example-dev>
```

### Get block

```shell
website t.durden@example-dev> get block simple-block master
[cli] ✅ [example-dev:website] Block versions:
  v15 simple-block
    state: available
    released: [03/11/2022 17:06] zengenti
    source:
      commit: 16b04ecb
      message: Update index.html
      committed: [03/11/2022 17:03] b.macka@zengenti.com
      pushed: [03/11/2022 17:04] Gitlab CI block push
      https://gitlab.example-org.com/product-dev/simple-block/-/commit/16b04ecb
    staging url: https://staging-example-dev.cloud.contensis.com?block-simple-block-versionstatus=released

  v14 simple-block
    state: stopped
    released: [03/11/2022 17:01] zengenti
    source:
      commit: fbad8514
      message: Added v16 to demo homepage
      committed: [03/11/2022 16:57] b.macka@zengenti.com
      pushed: [03/11/2022 16:58] Gitlab CI block push
      https://gitlab.example-org.com/product-dev/simple-block/-/commit/fbad8514

website t.durden@example-dev>
```

### Get block logs

```shell
website t.durden@example-dev> get block logs contensis-website master

[cli] ✅ [example-dev] Blocks in project website:

  - contensis-website master latest [hq]
  -------------------------------------
2022-11-04T14:36:28.137625120Z [launcher] startup file: ./start.website.example-dev.js - exists?: true
2022-11-04T14:36:28.138080818Z [launcher set default] /usr/src/app/dist/server/start.website.example-dev.js
2022-11-04T14:36:28.725514880Z
2022-11-04T14:36:28.725610953Z Serving static assets from: "/dist/static/"
2022-11-04T14:36:28.732830052Z HTTP server is listening @ port 3001

website t.durden@example-dev>
```

### Push a block

> **Note**
> It is far simpler doing this in [GitLab CI](#use-in-gitlab-ci) or [GitHub CI Actions](#use-in-github-ci)

```shell
website t.durden@example-dev> push block cli-test-block ghcr.io/contensis/contensis-app:build-4359 master --release --commit-id 9ee20333 --commit-message "chore: sample commit message" --commit-datetime 2022-11-03T22:34 --author-email b.macka@zengenti.com --committer-email b.macka@zengenti.com --repository-url https://github.com/contensis/contensis-app.git --provider GitlabSelfHosted
[cli] ✅ [example-dev] Created block "cli-test-block" in project website

website t.durden@example-dev>
```

### Release a block version

First get the latest block version number

```shell
website t.durden@example-dev>get block contensis-website master latest
[cli] ✅ [example-dev] Block contensis-website in project website:
  v78 contensis-website
    state: available
    released: no
    status:
      deployment: deployed
      workflow: draft
      running status: available
      datacentres:
        hq: available
        london: available
        manchester: faulted
    source:
      commit: b946c1029c1b35aefee2e1a6b5780ddaf205ee74
      message: build: syntax [nobuild]
      committed: [22/11/2022 06:50] t.durden@zengenti.com
      pushed: [22/11/2022 06:52] Gitlab CI block push
      https://github.com/contensis/contensis-website/commit/b946c1029c1b35aefee2e1a6b5780ddaf205ee74
    image:
      uri: ghcr.io/contensis/contensis-website/main/app
      tag: latest
    staging url: https://staging-example-dev.cloud.contensis.com?block-contensis-website-versionstatus=draft

website t.durden@example-dev>
```

Add the block version number to the `release block` command

```shell

website t.durden@example-dev> release block contensis-website 78
[cli] ✅ [example-dev] Released block contensis-website in project website
  v78 contensis-website
    state: available
    released: [23/11/2022 01:42] n.flatley
    status:
      deployment: deployed
      workflow: released
      running status: available
      datacentres:
        hq: available
        london: available
        manchester: faulted
    source:
      commit: b946c1029c1b35aefee2e1a6b5780ddaf205ee74
      message: build: syntax [nobuild]
      committed: [22/11/2022 06:50] t.durden@zengenti.com
      pushed: [22/11/2022 06:52] Gitlab CI block push
      null
    image:
      uri: ghcr.io/contensis/contensis-website/main/app
      tag: latest
    staging url: https://staging-example-dev.cloud.contensis.com?block-contensis-website-versionstatus=released

website t.durden@example-dev>
```

## Import content models

Connect to your "source" environment first, ensure you can fetch the models and these models contain the dependencies you plan on importing from here with the `get models` command. Add the `--dependents` option to fetch all of the entries that will eventually be imported.

When you are happy your models contain the right dependencies for your import, connect to the "target" environment (and project) then use the same arguments as before except with the `import entries` command

### Import from another Contensis environment

Specify a list of models to import

```shell
website t.durden@example-dev> import models plant --source-alias example-dev --source-project-id leif

  -------------------------------------
 -- IMPORT PREVIEW --

Content types:
  - growingConditions [website: no change] v1.0
      required by: [plant]
      references: [icon]
  - plant [website: update] v2.0
      references: [growingConditions, plantGenus, plantType, tag]
      diff: ...{'id':'<+>genus','name':{'en-GB':'Genus'},'dataType':'object','dataFormat':'entry','description':{},'default':null,'validations':{'allowedContentTypes':{'contentTypes':['plantGenus'],'message':null}},'editor':null,'groupId':'main'},{'id':'</+>plantVariant','name':{'en-GB':'Plant variant'}...
  - plantGenus [website: create] v0.1
      required by: [plant]
  - plantType [website: no change] v1.0
      required by: [plant]
  - pot [website: no change] v2.0
      required by: [plantVariant]
      references: [externalPromotion, potVariant, tag]
  - tag [website: no change] v1.0
      required by: [plant, pot]

Components:
  - externalPromotion [website: no change] v1.0
      required by: [plant, pot]
  - icon [website: no change] v1.0
      required by: [growingConditions]
  - plantVariant [website: no change] v2.0
      required by: [plant]
      references: [pot]
  - potVariant [website: no change] v1.0
      required by: [pot]

website t.durden@example-dev>
```

Or import every model from the source

```shell
website t.durden@example-dev> import models --source-alias example-dev --source-project-id leif
  -------------------------------------
 -- IMPORT PREVIEW --

Content types:
  - accessibleVideo [website: no change] v1.0
      required by: [blogPost, contentPage, landingPage]
  - alert [website: create] v0.1
  - blogListing [website: no change] v2.0
      required by: [button, callToAction, homepage, landingPage]
      references: [blogPost, callToAction, pageMetadata]
  - blogPost [website: update] v3.0
      required by: [blogListing, blogPost, button, callToAction, cardRow, contentPage, featuredBlogPosts, homepage, landingPage]
      references: [accessibleVideo, blogPost, callToAction, category, externalPromotion, featuredProduct, person, tag]
      diff: ...
  - callToAction [website: no change] v2.0
      required by: [blogListing, blogPost, contentPage, homepage, landingPage]
      references: [blogListing, blogPost, contentPage, externalLink, homepage, landingPage, plant, pot, productListing]
  - campus [website: create] v0.1
  - category [website: no change] v1.0
      required by: [blogPost, department, listing]
  - contentPage [website: no change] v2.0
      required by: [button, callToAction, cardRow, contentPage, featuredBlogPosts, homepage, landingPage]
      references: [accessibleVideo, blogPost, callToAction, callout, cardRow, contentPage, featuredProduct, formPicker, landingPage, pageMetadata, tag]
  - department [website: two-pass] v0.1
      references: [category]
  - event [website: create] v0.1
  - externalLink [website: no change] v1.0
      required by: [button, callToAction]
  - form [website: create] v0.1
  - growingConditions [website: no change] v1.0
      required by: [listing, plant]
      references: [icon]
  - homepage [website: update] v2.0
      required by: [button, callToAction, landingPage]
      references: [blogListing, blogPost, callToAction, contentPage, curatedProductSlider, filteredProductSlider, landingPage, pageMetadata, plant, pot, productListing, promotedProduct]
      diff: ...
  - landingPage [website: update] v2.0
      required by: [button, callToAction, cardRow, contentPage, featuredBlogPosts, homepage, landingPage]
      references: [accessibleVideo, blogListing, blogPost, bodyCopy, callToAction, contentBlock, contentPage, curatedProductSlider, featuredBlogPosts, featuredProduct, filteredProductSlider, formPicker, homepage, landingPage, pageMetadata, plant, pot, productListing, promotedProduct, review, tag]
      diff: ...
  - listing [website: two-pass] v0.1
      references: [category, growingConditions, plantType, tag]
  - newsArticle [website: two-pass] v0.1
      references: [person]
  - newsTest [website: two-pass] v0.1
      references: [person]
  - person [website: no change] v1.0
      required by: [blogPost, newsArticle, newsTest, review]
  - plant [website: update] v2.0
      required by: [button, callToAction, cardRow, curatedProductSlider, featuredBlogPosts, featuredProduct, homepage, landingPage, promotedProduct, review]
      references: [externalPromotion, growingConditions, plantGenus, plantType, plantVariant, tag]
      diff: ...
  - plantFamily [website: two-pass] v0.1
      required by: [plantOrder]
      references: [plantGenus]
  - plantGenus [website: create] v0.1
      required by: [plant, plantFamily]
  - plantOrder [website: two-pass] v0.1
      references: [plantFamily]
  - plantType [website: no change] v1.0
      required by: [filteredProductSlider, listing, plant]
  - pot [website: no change] v2.0
      required by: [button, callToAction, cardRow, curatedProductSlider, featuredBlogPosts, featuredProduct, homepage, landingPage, plantVariant, promotedProduct, review]
      references: [externalPromotion, potVariant, tag]
  - productListing [website: no change] v1.0
      required by: [button, callToAction, homepage, landingPage]
      references: [pageMetadata]
  - review [website: no change] v2.0
      required by: [landingPage]
      references: [person, plant, pot]
  - siteSettings [website: no change] v1.0
  - tag [website: no change] v1.0
      required by: [blogPost, contentPage, landingPage, listing, plant, pot]
  - testLang [website: create] v0.1

Components:
  - bodyCopy [website: no change] v1.0
      required by: [landingPage]
  - button [website: no change] v2.0
      required by: [promotedProduct]
      references: [blogListing, blogPost, contentPage, externalLink, homepage, landingPage, plant, pot, productListing]
  - callout [website: no change] v1.0
      required by: [contentPage, event]
  - cardRow [website: no change] v2.0
      required by: [contentPage]
      references: [blogPost, contentPage, landingPage, plant, pot]
  - contentBlock [website: no change] v1.0
      required by: [landingPage]
  - curatedProductSlider [website: no change] v2.0
      required by: [homepage, landingPage]
      references: [plant, pot]
  - externalPromotion [website: no change] v1.0
      required by: [blogPost, plant, pot]
  - featuredBlogPosts [website: no change] v2.0
      required by: [landingPage]
      references: [blogPost, contentPage, landingPage, plant, pot]
  - featuredProduct [website: no change] v2.0
      required by: [blogPost, contentPage, landingPage]
      references: [plant, pot]
  - filteredProductSlider [website: no change] v2.0
      required by: [homepage, landingPage]
      references: [plantType]
  - formPicker [website: no change] v1.0
      required by: [contentPage, landingPage]
  - icon [website: no change] v1.0
      required by: [growingConditions]
  - pageMetadata [website: no change] v1.0
      required by: [blogListing, contentPage, homepage, landingPage, productListing]
  - plantVariant [website: no change] v2.0
      required by: [plant]
      references: [pot]
  - potVariant [website: no change] v1.0
      required by: [pot]
  - promotedProduct [website: update] v2.0
      required by: [homepage, landingPage]
      references: [button, plant, pot]
      diff: ...

website t.durden@example-dev>
```

### Import from a file

```shell
website t.durden@example-dev> import models --from-file ./content-models.json
```

The output will be the same as the previous command

<sup><sub>Add the `--commit` option to make the changes, be very careful using this! There is no going back</sub></sup>

## Import entries

The import commands are made possible by using the `migratortron` library. There is further documentation here:

- [`migratortron` on npmjs](https://www.npmjs.com/package/migratortron)
- [`contensis-importer` on npmjs](https://www.npmjs.com/package/contensis-importer)

### Import from another Contensis environment

Connect to your "source" environment first, ensure you can fetch the entries you plan on importing from here and your query / filters are working to fetch exactly the data you are expecting with the `get entries` command. Add the `--dependents` option to fetch all of the entries that will eventually be imported.

When you are happy you can fetch only the data you intend to import, connect to the "target" environment (and project) then use the same query as before except with the `import entries` command

```shell
website t.durden@example-dev> import entries --preserve-guids --zenql "sys.contentTypeId = plant" --source-alias example-dev --source-project-id leif
  -------------------------------------
 -- IMPORT PREVIEW --
[23/11 02:10:48] [INFO] Fetching initial entries in project 'leif'
[23/11 02:10:48] [INFO] Finding entries in project 'website'
[23/11 02:10:49] [INFO] Building asset entries
[23/11 02:10:49] [INFO] Building content entries
--------------------------------------------

                         1 errors

 id  error
-----------------------------------------------------------
 0   Content type 'plantGenus' does not exist in
     project 'website'
-----------------------------------------------------------
[23/11 02:10:49] [OK] Done migrating entries

growingConditions Likes high humidity
  636b925b-a386-4c56-9f33-96cd99cc391c no change
growingConditions Needs plenty of light
  2d80e638-eb0d-4bc5-bc96-42b7b8f20678 no change
growingConditions Partial shade
  711251f9-f9c6-473b-8b62-0ec8a0d4978c no change
growingConditions Prefers dry conditions
  d815819d-61c6-4037-95d3-c503acf52153 no change

plant Aloe vera
  7cf921a0-ee4f-4bd6-a3f2-0fb0fe1a2ac8 no change
plant Areca palm
  0d94dbf2-89f8-45fb-96d5-175ae1f382ce no change
plant Boston fern
  43a60005-ea92-4b32-9af3-79560e48ecec no change
plant Calathea orbifolia
  f0cac96c-39a1-4b85-b14b-e8d7d3d08767 no change
plant Canary Island Date Palm
  d647012b-897e-4b6b-bfb5-b9844ef3d648 no change

plantGenus Aglaonema
  98347340-a11c-4ee5-b4e7-1ae3b75496a2 error
[cli] ❌ Content type 'plantGenus' does not exist in project 'website'

plantGenus Alocasia
  fa464489-6476-4694-b3d4-e77d0c00a185 error
[cli] ❌ Content type 'plantGenus' does not exist in project 'website'

plantGenus Aloe
  309d5fd7-a21f-45a8-8abb-f01f820b8f16 error
[cli] ❌ Content type 'plantGenus' does not exist in project 'website'

plantGenus Beaucarnea
  4ebdcc63-929f-4b06-8848-fe046468a63d error
[cli] ❌ Content type 'plantGenus' does not exist in project 'website'


plantType Ferns
  90e128f5-582c-4430-a232-72022271ec8b no change
plantType Foliage
  25f5a78b-9274-4cc9-9a58-03d8dcd4cd17 no change
plantType Orchids
  44abca5b-a49b-48a1-8823-811ab31983c0 no change
plantType Palm
  d66447c5-2198-4b19-bad3-c921e9ef0db0 no change
plantType Succulents
  70149568-9725-4c39-8ff5-ef69221a0899 no change

pot Barro decorated terracotta pot
  fa67e1c6-0637-4548-bd4f-c207ec62af0e no change
pot Bianco white pot
  e3b7907c-f524-45e4-ba5f-e62d1557b477 no change
pot Canasta mid-sized pot
  058b20ba-99f7-49ec-9017-a0df35b00dcc no change
pot Geo mid-sized pot
  dafc4810-a62e-43e5-a056-ab1248181eaf no change
pot Grå small grey pot
  f2022069-7a92-491d-b197-a3564ab9a8ca no change

tag Promoted
  3659a333-8d10-4325-9ea6-2f49ae47e7fe no change

website t.durden@example-dev>
```

### Import from a file

```shell
website t.durden@example-dev> import entries --preserve-guids --from-file ./content-entries.json
```

The output will be the same as the previous command

<sup><sub>Add the `--commit` option to make the changes, be very careful using this! There is no going back</sub></sup>
