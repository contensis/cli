# [![Contensis](https://github.com/contensis/cli/raw/refs/heads/main/assets/contensis-logo--tiny.svg)](https://www.contensis.com) Contensis CLI

Use Contensis from your favourite terminal

Download the executable for your operating system from the [Releases page](https://github.com/contensis/cli/releases) and add it to a folder in your local `PATH`

or use your preferred installation method below

## Install with package manager

### Windows ([Chocolatey](https://chocolatey.org/install))

```shell
choco install contensis-cli
```

- [Choco package docs and source](https://github.com/contensis/cli/tree/main/installers/chocolatey)
- [Contensis CLI on the Chocolatey Community Repository](https://community.chocolatey.org/packages/contensis-cli)

### Mac ([Homebrew](https://docs.brew.sh/Installation))

```shell
brew tap contensis/cli
brew install contensis-cli
```

- [Homebrew tap on GitHub](https://github.com/contensis/homebrew-cli)

### Linux ([Homebrew](https://docs.brew.sh/Homebrew-on-Linux))

```shell
brew tap contensis/cli
brew install contensis-cli-linux
```

- [Homebrew tap on GitHub](https://github.com/contensis/homebrew-cli)

## Install as Node.js global module

Install the package via [`npm`](https://www.npmjs.com/package/contensis-cli) as a global module (requires [Node.js](https://nodejs.org/en/download/))

```shell
npm i --global contensis-cli@prerelease
```

If you use `nvm` and are frequently switching your local `node` version it will also switch your global `node_modules` each time, it is recommended use one of the binary installations instead.

## Install from source

Clone the [repository](https://github.com/contensis/cli) and follow the instructions in the [`README`](https://github.com/contensis/cli#readme)

# Skip to section

- [Contensis Shell](#contensis-shell)
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

Launch the [shell](#contensis-shell) by running just the command `contensis`

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
docker pull ghcr.io/contensis/cli/main/app:latest
docker run --rm -it ghcr.io/contensis/cli/main/app:latest
```

### Run cli commands

Add the cli command and any options after the container image in the `docker run` command e.g.

```bash
docker run --rm ghcr.io/contensis/cli/main/app:latest get entries "test"
```

### Persist connections to a local file

To use the cli container for multiple commands or to save connections for future sessions, map a volume to the docker container

<aside>
⚠️ Ensure a file called `environments.json` exists before mapping the volume to the docker container. If it doesn’t exist, create this empty file first.

</aside>

Linux

```bash
touch environments.json
docker run --rm -v $(pwd)/environments.json:/usr/src/app/environments.json -it ghcr.io/contensis/cli/main/app:latest
```

Windows

```powershell
echo {} > environments.json
docker run --rm -v ${PWD}/environments.json:/usr/src/app/environments.json -it ghcr.io/contensis/cli/main/app:latest
```

## Use in GitLab CI

```yaml
push-to-contensis-block:
  stage: push-to-contensis
  only:
    - master
  image: ghcr.io/contensis/cli/main/app:release
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
- [Manage connected environments](#manage-connected-environments)
- [Manage Projects](#manage-projects)
  - [List projects](#list-projects)
  - [Set current project](#set-current-project)
  - [Get project metadata](#get-project-metadata)
  - [Set project metadata](#set-project-metadata)
  - [Create a new project](#create-a-new-project)
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
  - [Get entries using the Delivery API](#get-entries-using-the-delivery-api)
  - [Output results to a file](#output-results-to-a-file)
- [Format output](#format-output)
- [Manage tags and tag groups](#manage-tags-and-tag-groups)
  - [List tag groups](#list-tag-groups)
  - [List tags](#list-tags)
  - [List tags in group](#list-tags-in-group)
  - [Create tag group](#create-tag-group)
  - [Create tags](#create-tags)
  - [Create tags in group](#create-tags-in-group)
  - [Remove tags](#remove-tags)
  - [Remove tags in group](#remove-tags-in-group)
- [Manage API keys](#manage-api-keys)
  - [List keys](#list-keys)
  - [Create key](#create-key)
  - [Remove key](#remove-key)
- [Manage roles](#manage-roles)
  - [List roles](#list-roles)
  - [Create role](#create-role)
  - [Set role details](#set-role-details)
  - [Disable role](#disable-role)
  - [Remove role](#remove-role)
- [Manage blocks](#manage-blocks)
  - [List blocks](#list-blocks)
  - [Get block](#get-block)
  - [Get block logs](#get-block-logs)
  - [Push a block](#push-a-block)
  - [Execute block actions](#execute-block-actions)
    - [Release a block version](#release-a-block-version)
    - [Make a block version live](#make-a-block-version-live)
    - [Mark a block version as broken](#mark-a-block-version-as-broken)
    - [Rollback a live block version](#rollback-a-live-block-version)
- [Manage renderers](#manage-renderers)
  - [List renderers](#list-renderers)
- [Manage proxies](#manage-proxies)
  - [List proxies](#list-proxies)
- [View webhook subscriptions](#view-webhook-subscriptions)
- [Import content models](#import-content-models)
  - [Import from another Contensis environment](#import-from-another-contensis-environment)
  - [From a file](#from-a-file)
- [Import tags and groups](#import-tags-and-groups)
- [Import entries](#import-entries)
  - [Import from another Contensis environment](#import-from-another-contensis-environment-1)
  - [Import from a file](#import-from-a-file-1)
  - [Import entries further reading](#import-entries-further-reading)
- [Remove entries](#remove-entries)
- [Push asset](#push-asset)
- [Copy an entry field](#copy-an-entry-field)
  - [Copy a simple entry field](#copy-a-simple-entry-field)
  - [Limit entries when copying field content](#limit-entries-when-copying-field-content)
  - [Copy a composer into a canvas field](#copy-a-composer-into-a-canvas-field)
  - [Copy a field using a template](#copy-a-field-using-a-template)
  - [Copy a field and save the entries as output](#copy-a-field-and-save-the-entries-as-output)
- [Update an entry field](#update-an-entry-field)

## Get started

Press `[tab]` key at any time to show suggested commands or to attempt to auto-complete the command you are typing

You can use tab to auto-complete a `connect <alias>` or `set project <project-id>` command for the environment(s) you are connected to

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

## Manage connected environments

See a list of all previously connected environments with the `list envs` command

Use the `remove env` command followed by the cloud alias if you wish to remove any of these environments from your CLI cache

```shell
contensis t.durden@example-dev> list envs
[cli] ✅ Environments store found containing 7 environments
  - demoSite
  - * example-dev
  - forms
  - insytful
  - leif
  - trial-00
  - webinar

contensis t.durden@example-dev> remove env trial-00
[cli] ✅ Environments store found containing 7 environments
[cli] ✅ Removed environment trial-00 from session cache
  -------------------------------------

contensis t.durden@example-dev>
```

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

### Create a new project

```shell
website t.durden@example-dev> create project testProject "Test project" --supported-languages cy
[cli] ✅ [example-dev] Created project testProject

[cli] ✅ Available projects:

>> testProject [cy *en-GB]
    website [*en-GB]
    wordPressSite [*en-GB]

[cli] ✅ Current project is set to testProject

testProject t.durden@example-dev>
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

Use the `get entries` command to search for entries using the Management API

Many options are available that can be used to return the right list of entries: run `get entries --help`

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
 Fetch [website]                                      >> 100% 21 0.0s/0.0s

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

### Get entries using the Delivery API

By default all Contensis operations are performed using the Management API. Some data fields are only available to output when searching the Delivery API e.g. `sys.uri`

To include the `sys.uri` field with the entries returned from the above example, as well as adding the `sys.uri` field to the `--fields` list, we would also include the `--delivery-api` option in the `get entries` command.

```shell
website t.durden@example-dev> get entries --delivery-api --fields sys.uri productName colour material externalPromotion --zenql "sys.contentTypeId = pot"
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

Combine other options and mobilise your data to consume elsewhere: this command will dump an entry and all of its dependents (at all link depths) to a json file creating a complete picture of the entry data and everything that is linked to it.

```shell
get entries --dependents --output aloe-complete-entry.json --id 7cf921a0-ee4f-4bd6-a3f2-0fb0fe1a2ac8
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

Available options are: `json`, `csv`, `xml` or `html`

The `--format` and `--output` options are available with most commands (check command `--help`)

Output will normally default to JSON when saved with the `--output` flag.

## Manage tags and tag groups

You can use the cli or shell to manage tags and groups that can be used to attach tags to content entries

### List tag groups

Separate collections of tags are organised and stored in tag groups. Each tag belongs to one tag group.

```shell
website t.durden@example-dev> list taggroups
[cli] ✅ [example-dev] Retrieved 2 tag groups

  id: keywords
  name: Keywords
  description: Contains keyword tags to categorise, filter, and enhance asset discoverability in the CMS
  tagCount: 0

  id: resourcesTagGroup
  name: Resources Tag Group
  description: A tag group that holds tags to show available resources
  tagCount: 2

website t.durden@example-dev>
```

### List tags

List tags across all groups or provide further options to filter the output

```shell
website t.durden@example-dev> list tags
[24/06 15:52:18] [INFO] Fetching tags in all groups from example-dev website
[cli] ✅ [example-dev] Retrieved 2 tags

  groupId: resourcesTagGroup
  id: 01346722-cafc-4c01-9688-a28ea6291fa5
  value: tag1
  label:
  - en-GB: Tag 1
  usageCount: 1

  groupId: resourcesTagGroup
  id: bd32ebdb-ab99-40c7-a45b-cd221e00f4d2
  value: tag2
  label:
  - en-GB: Tag 2
  usageCount: 1

website t.durden@example-dev>
```

### List tags in group

List a collection of tags in a particular group, providing options to further filter the output

```shell
[24/06 15:53:21] [INFO] Fetching tags in group resourcesTagGroup from example-dev website
[cli] ✅ [example-dev] Retrieved 2 tags

  groupId: resourcesTagGroup
  id: 01346722-cafc-4c01-9688-a28ea6291fa5
  value: tag1
  label:
  - en-GB: Tag 1
  usageCount: 1

  groupId: resourcesTagGroup
id: bd32ebdb-ab99-40c7-a45b-cd221e00f4d2
  value: tag2
  label:
  - en-GB: Tag 2
  usageCount: 1

website t.durden@example-dev>
```

### Create tag group

Create a new collection of tags by first creating a new tag group, also create some tags in this group by supplying tag name(s) with the `--tags` option

```shell
website t.durden@example-dev> create taggroup topics "Topics" --tags Books Faces History Places Spelling
  -------------------------------------
[cli] ✅ 🔍 IMPORT PREVIEW 🔭
[25/06 14:03:46] [INFO] Fetching tags in all groups from target environment example-dev website

1/1 tag group to migrate into website

 status     total
-----------------------
 create     1
-----------------------

 id      status    name    description
--------------------------------------------
 topics  create    Topics
--------------------------------------------

5/5 tags to migrate into website

 status     total
-----------------------
 create     5
-----------------------

 id                                    value     status    groupId  label
------------------------------------------------------------------------------------------
 109eb3e9-98c9-5ab2-b9df-f1c80af3ac5c  books     create    topics   {"en-GB":"Books"}
 d59eddbe-cb9f-51ab-9d22-532f63cd7893  faces     create    topics   {"en-GB":"Faces"}
 c4cc205f-d543-55c7-8f1a-7490275be437  history   create    topics   {"en-GB":"History"}
 a7702648-df77-5fbb-b5ec-26a148a39b52  places    create    topics   {"en-GB":"Places"}
 d8fe7193-6fe7-5c03-bf2e-590e151c47e7  spelling  create    topics   {"en-GB":"Spelling"}
------------------------------------------------------------------------------------------

[25/06 14:03:46] [OK] Tags migration preview ready

[cli] ✅ Will import 1 tag group and 5 tags into example-dev environment

[cli] ⏩ Add --commit flag to commit the previewed changes

website t.durden@example-dev>
```

### Create tags

Create one or more tags providing the tag name(s), each name is separated by a space and any tag that contains a space should be wrapped in "double quotes". Specify the tag group to create the tags in with the required `--group` option.

### Create tags in group

Create one or more tags in a tag group providing the `groupId` first and then the tag name(s). Seperate each tag to create by a space and any tag that contains a space should be wrapped in "double quotes"

```shell
website t.durden@example-dev> create tags in topics Books Faces History Places Spelling
  -------------------------------------
[cli] ✅ 🔍 IMPORT PREVIEW 🔭
[25/06 16:41:41] [INFO] Fetching tags in all groups from target environment example-dev website
            
No tag group to migrate into website            

 status     total  
-----------------------
 no change  1
-----------------------

No tags to migrate into website            

 status     total  
-----------------------
 no change  5
-----------------------

[25/06 16:41:42] [OK] Tags migration preview ready

[cli] ❌ [example-dev] Unable to create tags

website t.durden@example-dev>
```

### Remove tags

Delete one or more tags, provide specific tag ids or delete all tags with the `--all` option

```shell
website t.durden@example-dev> remove tags 109eb3e9-98c9-5ab2-b9df-f1c80af3ac5c d59eddbe-cb9f-51ab-9d22-532f63cd7893
  -------------------------------------
[cli] ✅ 🔍 DELETE PREVIEW 🔭
[25/06 15:08:53] [INFO] Fetching 2 tags from target environment example-dev website
[25/06 15:08:53] [INFO] Delete tags preview ready

  groupId: topics
  id: 109eb3e9-98c9-5ab2-b9df-f1c80af3ac5c
  value: books
  label:
  - en-GB: Books
  usageCount: 0
  status: delete

  groupId: topics
  id: d59eddbe-cb9f-51ab-9d22-532f63cd7893
  value: faces
  label:
  - en-GB: Faces
  usageCount: 0
  status: delete

[cli] ✅ [example-dev] Will delete 2 tags

[cli] ⏩ Add --commit flag to commit the previewed changes

website t.durden@example-dev> 
```

### Remove tags in group

Delete one or more tags in a specific tag group, provide options to filter the returned tags or delete all tags with the `--all` option

```shell
website t.durden@example-dev> remove tags in topics --all
  -------------------------------------
[cli] ✅ 🔍 DELETE PREVIEW 🔭
[25/06 14:15:20] [INFO] Fetching tags in group topics from target environment example-dev website
[25/06 14:15:21] [INFO] Delete tags preview ready

  groupId: topics
  id: 109eb3e9-98c9-5ab2-b9df-f1c80af3ac5c
  value: books
  label:
  - en-GB: Books
  usageCount: 0
  status: delete

  groupId: topics
  id: d59eddbe-cb9f-51ab-9d22-532f63cd7893
  value: faces
  label:
  - en-GB: Faces
  usageCount: 0
  status: delete

  groupId: topics
  id: c4cc205f-d543-55c7-8f1a-7490275be437
  value: history
  label:
  - en-GB: History
  usageCount: 0
  status: delete

  groupId: topics
  id: a7702648-df77-5fbb-b5ec-26a148a39b52
  value: places
  label:
  - en-GB: Places
  usageCount: 0
  status: delete

  groupId: topics
  id: d8fe7193-6fe7-5c03-bf2e-590e151c47e7
  value: spelling
  label:
  - en-GB: Spelling
  usageCount: 0
  status: delete

[cli] ✅ [example-dev] Will delete 5 tags

[cli] ⏩ Add --commit flag to commit the previewed changes

website t.durden@example-dev>
```

### Remove tag group

When all tags have been removed from the tag group we are able to delete the tag group

```shell
website t.durden@example-dev> remove taggroup topics
  -------------------------------------
[cli] ✅ 🔍 DELETE PREVIEW 🔭
[25/06 14:50:42] [INFO] Delete tag groups preview ready

  id: topics
  name: Topics
  version:
  - versionNo: 1.0
    created: 2025-06-25T13:06:46.273Z
    createdBy: testzengenti
    modified: 2025-06-25T13:06:46.273Z
    modifiedBy: testzengenti
  tagCount: 0

[cli] ✅ [example-dev] Will delete tag group topics

[cli] ⏩ Add --commit flag to commit the previewed changes

website t.durden@example-dev>
```

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
  - Test key [2022-12-13 t.durden]
    Key to demonstrate cli
    id: 05a0922f-53e7-4a19-a92c-c9567dbe3246
    sharedSecret: 63d2828363f74fc1958f0d60c2306aae-02e8bc50271c479f82dba92a08d3ad16-64b93a3bb8eb4f428a1dddaecc9a84d3

[cli] ⏩ Assign your new key to a role with "set role assignments", or create a new role with "create role"

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

## Manage roles

You can use the cli or shell to manage roles that are used to provide access to resources in your Contensis project

### List roles

```shell
website t.durden@example-dev> list roles
[cli] ✅ [example-dev] Retrieved roles
  - Webinar administrators 058ad55d-bf54-4eb2-b74d-2e8ebd93a400
      groups: System Administrators, Zengenti Marketing Team
      users: t.turner, j.smith, s.harris
      keys: Webinar integration
      entries:
        webinar: *
        formWebinarSignUp: *
        person: *
        accessibleVideo: *
  - Entry Administrators 88babee8-9d65-4bd2-93f7-735e2c016911
    Users assigned to this role can perform all actions on all entries.
      groups: System Administrators
      keys: companySync, Docs import, Development, Content administrator
      entries:
        *: *
  - System content syncing 0eca0043-9b91-462a-3007-c5a5b6e6d15d
    allows background processes to sync content
      groups: User Administrators
      keys: Docs import, companySync, User management
      entries:
        *: contensisEntryBasic.*
  - Media service 16d8947c-7571-4c31-b906-d628de8963a8
    Create and publish media asset entries
      keys: block-contensis-media-service
      entries:
        mediaAsset: *

website t.durden@example-dev>
```

### Create role

```shell
website t.durden@example-dev> create role "Test role" "Role to demonstrate cli"
[cli] ✅ [example-dev] Created role "Test role"

  id: 1329b3cc-0267-480e-a115-b0beaae8fe5b
  projectId: website
  name: Test role
  description: Role to demonstrate cli
  enabled: true
  permissions:
    webhookSubscriptions:
    proxies:
    eventStreams:
    blocks:
    renderers:
    views:
  assignments:

[cli] ⏩ Give access to your role with "set role assignments", allow your role to do things with "set role permissions"

website t.durden@example-dev>
```

Run `list roles` again and you will see your new role added to the returned list

### Set role details

#### Assignments

Assign users, groups or keys to your role. We will make assignments using their name or user id for users.

```shell
website t.durden@example-dev> set role assignments "Test role" --assign-keys "Test key"
[cli] ✅ [example-dev] Retrieved roles
[cli]  ℹ  Updating role with details

  assignments:
  - apiKeys:
      Test key

[cli] ✅ Succesfully updated role

  id: 1329b3cc-0267-480e-a115-b0beaae8fe5b
  projectId: website
  name: Test role
  description: Role to demonstrate cli
  enabled: true
  permissions:
    webhookSubscriptions:
    proxies:
    eventStreams:
    blocks:
    renderers:
    views:
  assignments:
    apiKeys:
      Test key

website t.durden@example-dev>
```

#### Permissions

Set permissions to give the assignees of your role access to your project resources.

We can set permissions for entries.

```shell
website t.durden@example-dev> set role permissions "Test role" --content-type-ids simpleContent linkedContent
[cli] ✅ [example-dev] Retrieved roles
[cli]  ℹ  Updating role with details

  permissions:
  - entries:
      id: simpleContent
      id: linkedContent

[cli] ✅ Succesfully updated role

  id: 1329b3cc-0267-480e-a115-b0beaae8fe5b
  projectId: website
  name: Test role
  description: Role to demonstrate cli
  enabled: true
  permissions:
    entries:
    - languages:
        *
      id: simpleContent
      actions:
        *
    - languages:
        *
      id: linkedContent
      actions:
        *
    webhookSubscriptions:
    proxies:
    eventStreams:
    blocks:
    renderers:
    views:
  assignments:
    apiKeys:
      Test key

website t.durden@example-dev>
```

### Disable role

Disable a role by using the command `set role enabled` with the `--disabled` flag

```shell
website t.durden@example-dev> set role enabled "Test role" --disabled
[cli] ✅ [example-dev] Retrieved roles
[cli]  ℹ  Updating role with details

  enabled: false

[cli] ✅ Succesfully updated role

  id: 1329b3cc-0267-480e-a115-b0beaae8fe5b
  projectId: website
  name: Test role
  description: Role to demonstrate cli
  enabled: false

website t.durden@example-dev>
```

Enable the role again by calling the same command without the `--disabled` flag

```shell
website t.durden@example-dev> set role enabled "Test role"
[cli] ✅ [example-dev] Retrieved roles
[cli]  ℹ  Updating role with details

  enabled: true

[cli] ✅ Succesfully updated role

  id: 1329b3cc-0267-480e-a115-b0beaae8fe5b
  projectId: website
  name: Test role
  description: Role to demonstrate cli
  enabled: true

website t.durden@example-dev>
```

### Remove role

```shell
website t.durden@example-dev> remove role "Test role"
[cli] ✅ [example-dev] Retrieved roles
[cli] ✅ [example-dev] Deleted role Test role

website t.durden@example-dev>
```

Run `list roles` again and you will see your new role has been removed from the list of role

## View webhook subscriptions

```shell
website t.durden@example-dev> list webhooks
[cli] ✅ [example-dev] Webhook subscriptions:
  - Test webhook 43969978-f9c1-4ee6-a515-11e0ceaddfeb [2022-12-13 t.durden]
    [POST] https://webhook.site/dede53b3-f044-4640-8634-5f0061ade5c7
    headers:
      test: true
      credential: 🤐
    topics: resourceType:entry event:[created updated]
  - More Testing 52e6bac1-1d81-462e-b483-d22034173cb4 [2022-07-15 b.feaver]
    [POST] https://webhook.site/cd0e99b5-d658-423c-acf5-47af7dfcaa06
    topics: resourceType:entry event:[published] contentTypeId:[blogPost]

website t.durden@example-dev>
```

```shell
website t.durden@example-dev> get webhook "Slack"
[cli] ✅ [example-dev] Webhook subscriptions:
  - Slack 5a8dfee1-238f-44fe-b8aa-4b932099500c [2021-07-28 g.moore]
    Send a notification to a channel
    [POST] https://webhook.site/5ac0d1c4-8e2e-42c2-a055-66dc7e04843a
    topics:
    - resourceType: entry
      event:
        published
        unpublished
      contentTypeId:
        article
    - resourceType: entry
      event:
        workflowStateChanged
      workflowState:
        contensisEntryApproval.awaitingApproval
        contensisEntryApproval.declined
    templates: entry

website t.durden@example-dev>
```

## Manage blocks

You can manage deployed blocks for any Contensis project using the following commands

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

> **Tip**
> Add a version number or `latest` to the end of your `get block {block-id} {branch} {version}` command to output a complete set of details for that block version

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

### Execute block actions

We can perform certain actions on a specific version of a block with the `execute block action {type}` command

To execute an action on a specific block version, first you can find the the latest block version number with `get block {block-id} {branch} latest` or leave out the `latest` argument to see a short list of recent versions.

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

Add the block version number to the `execute block action {type} {block-id} {version}` command - further examples are below

#### Release a block version

To mark a block version as "released"

```shell

website t.durden@example-dev> execute block action release contensis-website 78
[cli] ✅ [example-dev] Action release on contensis-website in project website requested successfully
  v78 contensis-website
    state: available
    released: [23/11/2022 01:42] t.durden
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

> **Note**
> you can leave out the `version` argument to release the last pushed version of the block

#### Make a block version live

Follow the examples for [releasing a block version](#release-a-block-version) except target your command to this action

```shell
execute block action makelive {block-id} {version}
```

#### Mark a block version as broken

Follow the examples for [releasing a block version](#release-a-block-version) except target your command to this action

```shell
execute block action markasbroken {block-id} {version}
```

#### Rollback a live block version

Follow the examples for [releasing a block version](#release-a-block-version) except target your command to this action

```shell
execute block action rollback {block-id} {version}
```

## Manage renderers

You can manage renderers for any Contensis project using the following commands

### List renderers

### Get a renderer

Append the renderer id to the `get renderer` command e.g. `get renderer contensis-website`

## Manage proxies

You can manage proxies for any Contensis project using the following commands

### List proxies

```shell
website t.durden@example-dev> list proxies
[cli] ✅ [example-dev] Retrieved proxies in project website:
  - Get work requests [4.0] b8b6958f-6ae2-41d5-876a-abc86755fd7b Reverse proxy helpdesk endpoints
      - language: en-GB
        server: 10.0.46.200
        headers.host: account-id.zendesk.com
        ssl: true
  - HelpDesk Webservice [5.0] fd04d8ad-b1ec-4b0c-95d9-a7a6aec6d05d Used to support the helpdesk
      - language: en-GB
        server: 10.0.46.200
        headers.host: account-id.zendesk.com
        ssl: true

website t.durden@example-dev>
```

### Get a proxy

Append the proxy id to the `get proxy` command e.g. `get proxy b8b6958f-6ae2-41d5-876a-abc86755fd7b`

## Import content models

### Import from another Contensis environment

Connect to your "source" environment, ensure you can fetch the models from this environment first and that these models contain the dependencies you plan on importing to your "target" environment.

Check that the right assets will eventually be imported with the `list models` or `get model {modelIds...}` command

When you are happy the expected models are being returned for your import, you should then `connect` to your "target" environment (and `set project`) and when we are successfully connected to our target project, call the `import models` command, ensuring you add any arguments you used with your `get model` check earlier.

#### Specify a list of models to import

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

#### Import all models from the source project

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

The output will be the same as the `import models` examples above

<sup><sub>Add the `--commit` option to make the changes, be very careful using this! There is no going back</sub></sup>

## Import tags and groups
### Import from another Contensis environment

Connect to your "source" environment, ensure you can fetch the tags from this environment first and that these are the right tags you plan on importing to your "target" environment.

Choose your required options to check that the right tags will eventually be imported with the `list tags` or `list tags in <groupId>` command

When you are happy the expected tags are being returned for your import, you should then `connect` to your "target" environment (and `set project`) and when we are successfully connected to our target project, call the `import tags` command, ensuring you add any arguments you used with your `list tags` check earlier.

#### Import all tags (and groups) from the source project

```shell
website t.durden@example-dev> import tags --source-alias example-dev --source-project-id leif
  -------------------------------------
[cli] ✅ 🔍 IMPORT PREVIEW 🔭
[25/06 15:26:37] [INFO] Fetching tags in all groups from example-dev leif
[25/06 15:26:37] [INFO] Fetching tags in all groups from target environment example-dev website
            
1/2 tag groups to migrate into website            

 status     total  
-----------------------
 create     1
 no change  1
-----------------------

 id                       status    name                        description                         
------------------------------------------------------------------------------------------------
 newGroup                 create    New group
------------------------------------------------------------------------------------------------

            
5/7 tags to migrate into website            

 status     total  
-----------------------
 create     5
 no change  2
-----------------------

 id                                    value  status    groupId              label              
------------------------------------------------------------------------------------------------
 02bcb977-1196-4c3f-a921-d2dfce3ca32b  new1   create    newGroup             {"en-GB":"New 1"}  
 f48eb862-7b73-4a77-a2af-09492a88a8f0  new2   create    newGroup             {"en-GB":"New 2"}  
 8673e419-55c9-4ba0-bcd7-28c7c6fa46cc  new3   create    newGroup             {"en-GB":"New 3"}  
 90a11d09-3727-45c2-a0df-86f1865828ab  tag3   create    newGroup             {"en-GB":"Tag 3"}  
 d4267b35-0d25-41ae-bce9-eeb490c793f4  tag3   create    resourcesTagGroup    {"en-GB":"Tag 3"}  
------------------------------------------------------------------------------------------------

[25/06 15:26:38] [OK] Tags migration preview ready

[cli] ✅ Will import 5 tags into example-dev environment

[cli] ⏩ Add --commit flag to commit the previewed changes

website t.durden@example-dev>
```

### Import from a file

Import resources directly from a JSON file. The path can be relative or absolute. The file will be processed as an array of Tags (and Tag Groups). Generate a JSON file by exporting some existing tags using the command `list tags --output tags.json`.

```shell
website t.durden@example-dev> import tags --from-file ./tags.json
```
```shell
website t.durden@example-dev> import taggroups --from-file ./taggroups.json
```
```shell
website t.durden@example-dev> import tags --from-file ./tags-and-groups.json
```

## Import entries

### Import from another Contensis environment

Connect to your "source" environment first, ensure you can fetch the entries you plan on importing from here and your query / filters are working to fetch exactly the data you are expecting with the `get entries` command. Add the `--dependents` option to your `get entries` test commands to fetch all of the entries that will eventually be imported.

When you are happy you can fetch only the data you intend to import, connect to the "target" environment (and project) then use the same query as before except with the `import entries` command

```shell
website t.durden@example-dev> import entries --preserve-guids --zenql "sys.contentTypeId = plant" --source-alias example-dev --source-project-id leif
  -------------------------------------
 -- IMPORT PREVIEW --
[26/11 02:16:29] [INFO] Fetching initial entries in project 'leif'
 Fetch [leif]                                   >> 100% 21 0.0s/0.0s 100000p/s
 Fetch [leif]                                 >> 100% 79 0.0s/0.0s Infinityp/s
 Fetch [leif]                                 >> 100% 13 0.0s/0.0s Infinityp/s

Found 113 entries in leif
--------------------------------------------

 id                                    contentTypeId      entryTitle                      entryDescrip
------------------------------------------------------------------------------------------------------
 7cf921a0-ee4f-4bd6-a3f2-0fb0fe1a2ac8  plant              Aloe vera                       Every kitche
 0d94dbf2-89f8-45fb-96d5-175ae1f382ce  plant              Areca palm                      An easy-to-c
 43a60005-ea92-4b32-9af3-79560e48ecec  plant              Boston fern                     Brighten up
 f0cac96c-39a1-4b85-b14b-e8d7d3d08767  plant              Calathea orbifolia              This beautif
 d647012b-897e-4b6b-bfb5-b9844ef3d648  plant              Canary Island Date Palm         An easy-to-c
 b7129080-692c-4550-9e2b-28f8ec978651  plant              Chinese evergreen               Easy to care
 a3339124-4340-4f31-a209-5a6413a89f15  plant              Chinese money plant             The Chinese
 8c284599-b615-40a7-9d26-0ddd586fff51  plant              Dracaena fragrans               A great opti
 329e3104-332f-48a4-b43a-de852df796b3  plant              Elephant ear                    Elephant ear
 504f7b7f-af03-4711-94ca-07edb90fbe00  plant              Heartleaf philodendron          Native to Ce
 a9a537e8-5508-4166-878c-d5fcd0d9a723  plant              Maidenhair fern                 Easily ident
 9a3cc767-8fc1-4ee5-83e1-63c14a508c69  plant              Parlour palm                    Add a bit of
 ee488c3b-a3a3-4b9c-a3ad-c5a5bdc7e317  plant              Peace lily                      A classic ch
 6a71a864-6f61-471a-8cdd-f80237408666  plant              Pink moth orchid                Why buy cut
 50868245-3e53-4d9f-86ed-403593da67f6  plant              Ponytail palm                   Despite its
 4f05979f-d8cf-4568-9045-05731a33f243  plant              Spider plant                    Breate easy
 76a16c87-5e6d-465b-a343-3f14cf2fea0a  plant              String of nickels               A hanging pl
 61a2af3a-332c-453c-b9f6-1851d9b7d936  plant              Swiss cheese plant              Bring laid-b
 8174fb53-b955-4e36-8f87-646bf286e396  plant              Variegated snake plant          Snake plants
 b8aa31da-f993-4d81-a361-94ecd5e42547  plant              White moth orchid               Why buy cut
 0d707ffe-f42d-44a6-b839-46156ee7f4f3  plant              Yellow moth orchid              Why buy cut
 51390024-f193-436f-8552-646cf77ccfdb  image              aloe-vera-closeup               null
 c0d4ec16-6de2-4394-aaf4-03a56d343bff  image              aloe-vera-gold-pot              null
 3b830d97-e976-467c-a833-1b4abcab65d0  image              areca-palm-in-room              null
 ed0300b0-e841-4c0f-bd1d-9ecd6bc2a354  image              areca-palm-leaf                 null
 00119ef1-c3c4-4a49-9076-27eee5605515  image              areca-palm-plant-collection     null
 248e2817-6241-4de7-ac5d-75411be4339d  image              boston-fern-close-up            null

 - and 87 more...

[26/11 02:16:29] [INFO] Finding 113 entries in project 'website'
 Fetch [website]                                  >> 100% 113 0.2s/0.0s 897p/s
 Fetch [website]                               >> 100% 4 0.0s/0.0s Infinityp/s
[26/11 02:16:30] [INFO] Building 66 asset entries
[26/11 02:16:30] [INFO] Building 47 content entries

37/113 entries to migrate into [website]

 contentTypeId         status     total
----------------------------------------------
 plantGenus            error      4
 growingConditions     update     4
 plant                 update     21
 pot                   update     12
 image                 no change  66
 plantType             no change  5
 tag                   no change  1
----------------------------------------------

 id                                    contentTypeId         status    updates  entryTitle
------------------------------------------------------------------------------------------------------
 98347340-a11c-4ee5-b4e7-1ae3b75496a2  plantGenus            error              Aglaonema
 fa464489-6476-4694-b3d4-e77d0c00a185  plantGenus            error              Alocasia
 309d5fd7-a21f-45a8-8abb-f01f820b8f16  plantGenus            error              Aloe
 4ebdcc63-929f-4b06-8848-fe046468a63d  plantGenus            error              Beaucarnea
 636b925b-a386-4c56-9f33-96cd99cc391c  growingConditions     update    -1,+0    Likes high humidity
 2d80e638-eb0d-4bc5-bc96-42b7b8f20678  growingConditions     update    -1,+0    Needs plenty of light
 711251f9-f9c6-473b-8b62-0ec8a0d4978c  growingConditions     update    -1,+0    Partial shade
 d815819d-61c6-4037-95d3-c503acf52153  growingConditions     update    -1,+0    Prefers dry conditions
 7cf921a0-ee4f-4bd6-a3f2-0fb0fe1a2ac8  plant                 update    -1,+0    Aloe vera
 0d94dbf2-89f8-45fb-96d5-175ae1f382ce  plant                 update    -1,+0    Areca palm
 43a60005-ea92-4b32-9af3-79560e48ecec  plant                 update    -1,+0    Boston fern
 f0cac96c-39a1-4b85-b14b-e8d7d3d08767  plant                 update    -1,+0    Calathea orbifolia
 d647012b-897e-4b6b-bfb5-b9844ef3d648  plant                 update    -1,+0    Canary Island Date Pal
 b7129080-692c-4550-9e2b-28f8ec978651  plant                 update    -1,+0    Chinese evergreen
 a3339124-4340-4f31-a209-5a6413a89f15  plant                 update    -1,+0    Chinese money plant
 8c284599-b615-40a7-9d26-0ddd586fff51  plant                 update    -1,+0    Dracaena fragrans
 329e3104-332f-48a4-b43a-de852df796b3  plant                 update    -1,+0    Elephant ear
 504f7b7f-af03-4711-94ca-07edb90fbe00  plant                 update    -1,+0    Heartleaf philodendron
 a9a537e8-5508-4166-878c-d5fcd0d9a723  plant                 update    -1,+0    Maidenhair fern
 9a3cc767-8fc1-4ee5-83e1-63c14a508c69  plant                 update    -1,+0    Parlour palm
 ee488c3b-a3a3-4b9c-a3ad-c5a5bdc7e317  plant                 update    -1,+0    Peace lily
 6a71a864-6f61-471a-8cdd-f80237408666  plant                 update    -1,+0    Pink moth orchid
 50868245-3e53-4d9f-86ed-403593da67f6  plant                 update    -1,+0    Ponytail palm
 4f05979f-d8cf-4568-9045-05731a33f243  plant                 update    -1,+0    Spider plant
 76a16c87-5e6d-465b-a343-3f14cf2fea0a  plant                 update    -1,+0    String of nickels
 61a2af3a-332c-453c-b9f6-1851d9b7d936  plant                 update    -1,+0    Swiss cheese plant
 8174fb53-b955-4e36-8f87-646bf286e396  plant                 update    -1,+0    Variegated snake plant

 - and 15 more...

--------------------------------------------
[26/11 02:16:30] [OK] Entries migration preview done

[cli] ⏩ import from project leif to website

  - growingConditions: 4 [existing: 100%] [needs update: 100%]
  - image: 66 up to date
  - plant: 21 [existing: 100%] [needs update: 100%]
  - plantGenus: 4 [existing: 0%]
  - plantType: 5 up to date
  - pot: 12 [existing: 100%] [needs update: 100%]
  - tag: 1 up to date
  - totalCount: 37
  - errors: 1

[cli] ❌ Content type 'plantGenus' does not exist in project 'website'

[cli] ❌ [example-dev] Unable to import entries

website t.durden@example-dev>
```

### Import from a file

```shell
website t.durden@example-dev> import entries --preserve-guids --from-file ./content-entries.json
```

The output will be the same as the previous command

<sup><sub>Add the `--commit` option to make the changes, be very careful using this! There is no going back</sub></sup>

### Import entries further reading

The import commands are made possible by using the `migratortron` library. There is further documentation here:

- [`migratortron` on npmjs](https://www.npmjs.com/package/migratortron)
- [`contensis-importer` on npmjs](https://www.npmjs.com/package/contensis-importer)

## Remove entries

Delete entries by id

```shell
website t.durden@example-dev> remove entries a1c25591-8c9b-50e2-96d8-f6c774fcf023 8df914cc-1da1-59d6-86e0-
8ea4ebd99aaa
 -- PREVIEW --
[26/11 02:19:53] [INFO] Fetching initial entries in project 'website'
 Fetch [website]                                 >> 100% 2 0.0s/0.0s Infinityp/s
[26/11 02:19:53] [INFO] Done deleting entries

a1c25591-8c9b-50e2-96d8-f6c774fcf023 delete homepage Find the perfect plant
8df914cc-1da1-59d6-86e0-8ea4ebd99aaa delete pot Milano dipped pot

[cli] ⏩ delete from project website

  - totalCount: 2 [to delete: 2]

[cli] ✅ [example-dev] Will delete entries

[cli] ⏩ Add --commit flag to commit the previewed changes

website t.durden@example-dev>
```

Delete entries with a supplied zenql statement

```shell
website t.durden@example-dev> remove entries --zenql "sys.version.created > 2022-11-25 14:00"
 -- PREVIEW --
[26/11 02:20:52] [INFO] Fetching initial entries in project 'website'
 Fetch [website]                                   >> 100% 7 0.0s/0.0s 100000p/s
[26/11 02:20:53] [INFO] Done deleting entries

a1c25591-8c9b-50e2-96d8-f6c774fcf023 delete homepage Find the perfect plant
bb850178-c88c-50a6-8bac-844273cb19b8 delete image parlour-palm-white-room
1553d1c8-7a99-5dcd-b1cb-9a90d4cf1985 delete landingPage New subscription service
f0b0ef1b-fdd1-52d6-99fc-4439e0c186e6 delete plantGenus Aglaonema
f8f6ee36-9cc4-5d1e-be62-01ac73590947 delete plantGenus Aloe
8df914cc-1da1-59d6-86e0-8ea4ebd99aaa delete pot Milano dipped pot
4efeb0e4-dc19-5f87-ab89-47892b9c4169 delete pot Terra large terracotta pot

[cli] ⏩ delete from project website

  - totalCount: 7 [to delete: 7]

[cli] ✅ [example-dev] Will delete entries

[cli] ⏩ Add --commit flag to commit the previewed changes

website t.durden@example-dev>
```

<sup><sub>Add the `--commit` option to make the changes, be very careful using this! There is no going back</sub></sup>

## Push asset

The `push asset` command allows you to push a single file into your Contensis instance

The file can be local

```shell
push asset image "Bicycle" "A child's bicycle" --from-file "C:\Users\t.durden\Pictures\bicycle.png" --target-file-path /image-library/samples/
```

Or the file can be downloaded from a http location

```shell
push asset image "Bicycle" "A child's bicycle" --from-url "https://thumbs.example.com/modern-child-bicycle.jpg" --target-file-path /image-library/samples/
```

## Copy an entry field

This command allows us to copy the contents of one entry field to another, this is useful if, for example - when a field is named incorrectly, or was specified originally as one field type but we would like to curate and present this content differently in future.

The required inputs for using `copy field` are:

- `contentTypeId`: the content type containing the field to copy
- `fieldId`: the field id containing the source data
- `destinationId`: the target field id where the data will be copied to

Copying field data from one field to another can only be done with fields that exist in the content type, and with the source and destination field types are metioned in the [transformation matrix](docs/copy_field_transformation_matrix.md)

Similar to the `import` commands, the `copy` command is safe to run again and again for testing and reviewing the output. The changes are made to the entries permanently when the `--commit` option is added.

### Copy a simple entry field

To copy the contents of one field to another use the command like this:

```
copy field <contentTypeId> <fieldId> <destinationId>
```

For the next example, we will copy the contents of a field called `text` into another field called `heading`, in the `contentPage` content type

```shell
website t.durden@example-dev> copy field contentPage text heading
  -------------------------------------
 -- IMPORT PREVIEW --
[07/05 16:21:40] [INFO] OK to copy contentPage[text]<string> field into contentPage[heading]<string> in website on example-dev [direct]
[07/05 16:21:40] [INFO] Searching for initial entries in example-dev project 'website'
[07/05 16:21:40] [INFO] Finding 2 entries in example-dev project 'website'
[07/05 16:21:45] [INFO] Building 2 content entries

2/2 entries to migrate into [website]

 contentTypeId         status     total
----------------------------------------------
 contentPage    update     2
----------------------------------------------

 id                                    contentTypeId         status    updates  entryTitle
--------------------------------------------------------------------------------------------------------------
 21818721-f03e-4e8a-9982-c83212409850  contentPage    update    -1,+1    Content page
 70fa7283-cdba-462d-8cd3-a1d4b30ac2e7  contentPage    update    -0,+1    Test field data
--------------------------------------------------------------------------------------------------------------

[07/05 16:21:45] [OK] Entries migration preview ready

[cli] ⏩ import from project website to website

  - contentPage: 2 [existing: 100%] [needs update: 100%]
  - totalCount: 2

[cli] ✅ [example-dev] Will import 2 entries

[cli] ⏩ Add --commit flag to commit the previewed changes

website t.durden@example-dev>
```

We can request more output for our preview by adding `--output-entries changes` option and we will see a diff of the entries that have updates applied to them.

### Limit entries when copying field content

If the number of entries to copy in a content type are too large to manage, or if we are testing the `copy field` command with a subset of entries we can supply one of the following options to limit the entries that are returned when we run the `copy field` command.

- `--id`: copy the field contents of one entry only
- `--zenql`: provides the finest level of control over the returned entries
- `--search`: limits the results with a simple keyword or phrase

Consult the command `copy field --help` to see all of the available options

### Copy a composer into a canvas field

, in order to transform the contents of a Composer field in an entry to a canvas field type, we achieve this by rendering each item in the Composer as simple HTML representation internally before parsing this markup and converting it to canvas then adding the output to our destination entry field, working in the same way as if we were copying the contents of a rich text field type (containing markup) to a canvas field.

```shell
contensis t.durden@example-dev> copy field contentPage composer canvas --output-entries changes
  -------------------------------------
 -- IMPORT PREVIEW --
[07/05 17:02:51] [INFO] OK to copy contentPage[composer]<objectArray> field into contentPage[canvas]<objectArray> in website on example-dev [canvas]
[07/05 17:02:51] [INFO] Searching for initial entries in example-dev project 'website'
[07/05 17:02:53] [INFO] Finding 1 entries in example-dev project 'website'
[07/05 17:02:56] [INFO] Building 1 content entries

1/1 entries to migrate into [website]

 contentTypeId         status     total
----------------------------------------------
 contentPage    update     1
----------------------------------------------

 id                                    contentTypeId         status    updates  entryTitle
--------------------------------------------------------------------------------------------------------------
 401abeba-d47d-4975-8890-db4b07ad58c4  contentPage    update    -1,+1    Content page
--------------------------------------------------------------------------------------------------------------

[07/05 17:02:56] [OK] Entries migration preview ready

update 401abeba-d47d-4975-8890-db4b07ad58c4 contentPage Content page
  diff: '{'canvas':[{'id':'<->9fef6713','type':'_paragraph'}],'</-><+>c2c69573','type':'_paragraph','value':[{'id':'2edb9251','type':'_fragment','value':'This is the page content curated in a '},{'id':'fc28bf06','properties':{'decorators':['code']},'type':'_fragment','value':'markup'},{'id':'b67233b7','type':'_fragment','value':' composer item'}]},{'id':'f13ced2f','type':'_image','value':{'asset':{'sys':{'availableLanguages':['en-GB'],'id':'e7ee357f-35b1-4315-be7a-3d0cc2ff661b','isPublished':true,'language':'en-GB','metadata':{'includeInAToZ':false,'includeInMenu':false,'includeInSearch':true,'includeInSiteMap':false,'nodeId':'e7ee357f-35b1-4315-be7a-3d0cc2ff661b'},'owner':'d.mee','projectId':'contensis','properties':{'fileId':'e7ee357f-35b1-4315-be7a-3d0cc2ff661b','filename':'swiss-army-knife-blog-image1.jpeg','filePath':'/image-library/blog-images/','fileSize':48731,'height':512,'width':357},'version':{'created':'2021-09-24T10:56:10.8000819Z','createdBy':'ServicesUser','modified':'2021-09-24T10:56:10.8000819Z','modifiedBy':'ServicesUser','published':'2021-10-04T10:05:45.9434807Z','publishedBy':'ServicesUser','versionNo':'1.0'},'versionStatus':'latest','workflow':{'id':'contensisEntryBasic','state':'versionComplete'}},'title':'Swiss Army Knife - Blog image1'}}},{'id':'867aebcd','type':'_paragraph','value':'This line was curated as plain text'},{'id':'f9e378c8','properties':{'component':'iconWithText'},'type':'_component','value':{'icon':{'sys':{'id':'7d62ee24-b36a-46c3-b49f-09b32575dfbd','language':'en-GB'}},'text':'Some text curated in a component along with my icon'}}],'</+>composer':[{'type':'markup','value':'<p>This is the page content curated in a <code>markup</code> composer item</p>'},{'type':'image','value':{'altText':'An inline image in my content page','asset':{'sys':{'id':'e7ee357f-35b1-4315-be7a-3d0cc2ff661b'}}}},{'type':'text','value':'This line was curated as plain text'},{'type':'iconWithText','value':{'icon':{'sys':{'id':'7d62ee24-b36a-46c3-b49f-09b32575dfbd'}},'text':'Some text curated in a component along with my icon'}}],'heading':'This is my content heading','text':'Content page'}

[cli] ⏩ import from project website to website

  - contentPage: 1 [existing: 100%] [needs update: 100%]
  - totalCount: 1

[cli] ✅ [example-dev] Will import 1 entries

[cli] ⏩ Add --commit flag to commit the previewed changes

website t.durden@example-dev>
```

### Copy a field using a template

For fine-grained control of what is rendered or copied into the target field we can supply a `--template` option with a string value that is a [LiquidJS](https://liquidjs.com/tutorials/intro-to-liquid.html) template with access to variables we can use to directly drive how the output is written into our target field

The syntax for applying a template with the `copy field` command is

```shell
copy field blog description kicker --template "<h2>{{ value }}</h2>"
```

in this example the `value` from `description` field will be wrapped in a `<h2>` tag before being added to the `kicker` field

The template must be surrounded in double-quotes and be entered (or pasted) in a single line for it to be parsed correctly with the intended command.

Adding a template containing html? Attributes can be wrapped in single quotes.

Escape characters and new lines can be introduced inside templates when calling `contensis copy field` from your system shell as a cli command. This is OS/shell dependent and does not work in the Contensis shell (due to the combined layers of command parsing)

Further documentation on using [templates](docs/copy_field_templates.md)

### Copy a hard-coded entry link into a field using a template

Useful to pre-populate an entry link field with a default entry in existing content

```shell
copy field courseInstance modules modules --zenql "sys.contentTypeId=courseInstance and modules NOT EXISTS" --template "{{ '[ { \"sys\": { \"id\": \"1d6a41de-5a61-474e-ab47-6e1e340d462c\", \"contentTypeId\": \"module\" } } ]' }}" --output-detail changes
```

This example will populate a repeating entry link field called `modules` within the `courseInstance` content type with the template we've supplied

Using the `copy field` command with a `--zenql` statement to narrow down the entries to update, we can supply a template that is a hard-coded JSON string (with escaped quotes) with an `"id"` that is a valid entry id to link to this field.

Adding `--output-detail changes` will output a diff for each changed entry to the console. For larger jobs use the `--output file.json` option to review the changes that will be made.

To populate a non-repeating field remove the `[` and `]` from the supplied template

### Copy a field and save the entries as output

As we do not actually commit the output of a `copy field` command until specified we can also save the entries preview containing the new field data.

With the saved output we can examine the raw output of each entry containing the copied field data before we choose to load it, or we can repurpose the saved entries output for further processing.

Add the `--save-entries` option to the `copy field` command, remember to also include the `--output copy-entries.json` option, specifying the file where the output will be saved.

```shell
copy field contentPage composer canvas --save-entries --output canvas-entries.json
```

## Update an entry field

The `update field` command can be thought of as a "find and replace" feature, where we can look for a particular value (or RegExp) in a list of entries and replace any found values with a supplied replacement value.

```shell
update field content "find me" "replacement value"
```

A number of ways exist to limit the entries we check and make changes with

```shell
update field content "Em.*?mith" "Emma Davies" --zenql "searchContent~'Emma Smith'"
```

```shell
update field content "Em.*?mith" "Emma Davies" --search "Emma Smith"
```

Update one or more entries by their id

```shell
update field content "Em.*?mith" "Emma Davies" --id defb707b-fcfa-4c7e-baf8-6472edb5ec25 c92390dd-7bb1-5f5d-8fbd-0d7f41232ac3
```
