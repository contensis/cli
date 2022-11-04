# Contensis CLI

Use Contensis from your favourite terminal with NodeJS

Install the package via `npm` as a global module

```shell
npm i contensis-cli --global
```

## CLI usage

```shell
contensis-cli connect example-dev
```

The CLI uses the same commands and arguments as the shell. It is recommended you use and familiarise yourself with the cli via the shell and use the `contensis-cli` command to use the same cli commands in script-based context such as continuous integration.

### Pass connection details anywhere

If you need to, you can supply all the necessary options to connect to a Contensis project and perform an operation in a single command

You can supply the following options with any command - although they don't appear in help text:

```
 --alias
 --projectId
 --user
 --password
 --clientId
 --sharedSecret
```

### Running headless?

Most lightweight CI environments will likely not ship with the ability to easily load and unlock an encrypted keychain.

In these environments you will see a warning message when using the cli with any credentials

```shell
  [WARN] Could not connect to local keystore - your password could be stored unencrypted!
```

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

After connecting you will notice the shell prompt will now contain the current "connected" environment - `contensis example-dev> `

The CMS must be online and available in order to connect to it

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

If you are logging in via a script or service you will likely be using an API key set up in Contensis, you would provide the full credentials with the command `login {clientId} -s {sharedSecret}`

## List projects

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
contensis zenhub-dev> list projects
[cli]  ℹ  Introduce yourself with "login {username}" or "login {clientId} -s {secret}"
```

## Set current project

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

## List content types, components

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

## Examine a content type or component

```shell
contensis t.durden@example-dev> get contenttype pot
[cli] ✅ [website] Content type "pot"
  uuid: adc051ee-d584-4f2a-ba42-5e6190edadb8
  id: pot
  projectId: website
  name:
    en-GB: Pot
  description:
  entryTitleField: productName
  entryDescriptionField: description
  fields:
    productName: string
    description: string
    externalPromotion: object
    colour: string
    material: string
    potVariant: objectArray
    primaryImage: object
    photos: objectArray
    externalCardImage: object
    tags: objectArray
  defaultLanguage: en-GB
  supportedLanguages:
    0: en-GB
  workflowId: contensisEntryBasic
  dataFormat: entry
  groups:
    main
    photos
    tags
  includeInDelivery: true

contensis t.durden@example-dev>
```

## Get entries

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

## Get an entry by id

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

## Get an entry with all of its dependents

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

## Get entries with a ZenQL statement

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

## Choose entry fields to output

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

## Output results to a file

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

## Manage Content Blocks

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

### Push block

```shell
website t.durden@example-dev> push block cli-test-block ghcr.io/contensis/contensis-app:build-4359 master --release --commit-id 9ee20333 --commit-message "chore: sample commit message" --commit-datetime 2022-11-03T22:34 --author-email b.macka@zengenti.com --committer-email b.macka@zengenti.com --repository-url https://github.com/contensis/contensis-app.git --provider GitlabSelfHosted
[cli] ✅ [example-dev] Created block "cli-test-block" in project website

website t.durden@example-dev>
```
