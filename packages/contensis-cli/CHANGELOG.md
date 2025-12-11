# Changelog

## [1.6.0](https://github.com/contensis/cli/compare/contensis-cli-v1.5.0...contensis-cli-v1.6.0) (2025-12-11)


### Features

* `--dependents` option accepts a number to stop fetching entry dependencies at the specified depth in `get entries` ([209fe7d](https://github.com/contensis/cli/commit/209fe7d87acba1b5fc419a19179ca698e8993a64))
* add `--log-level` global option to increase logging verbosity in many commands ([8538b15](https://github.com/contensis/cli/commit/8538b15e0ed9a3524418416fa656876319d0a887))
* add `--no-validations` option to import models with all field validations removed ([0f9a4c0](https://github.com/contensis/cli/commit/0f9a4c03300f01de6ff441e271fe592b81105c16))
* add `--stop-level` option to stop resolving entry dependencies at the specified level in `import entries` ([4e0b9c6](https://github.com/contensis/cli/commit/4e0b9c6bf826503c9ed4a040c523092d8b3179b6))
* prune unreferenced dependencies from built entries with error status or where a field has not been mapped to a target entry in `import entries` ([6bbe628](https://github.com/contensis/cli/commit/6bbe628586d525447a8ad0a2fcc920cb159ee3cf))
* taxonomy fields excluded when importing models ([06fe2f6](https://github.com/contensis/cli/commit/06fe2f68c14c9c53da28ee4e486dd686f3482cd1))


### Bug Fixes

* added field validation checks for entry, image and list fields when building entries for migration ([30f7235](https://github.com/contensis/cli/commit/30f72350645ad04ad5bd11f5ee8524619d2c6a95))
* asset uploads incompatible with Node.js native fetch ([b98e786](https://github.com/contensis/cli/commit/b98e786530973448d18e715bb4501a7943b01978))
* avoid 409 conflict errors when deleting nested components ([06fe2f6](https://github.com/contensis/cli/commit/06fe2f68c14c9c53da28ee4e486dd686f3482cd1))
* avoid duplicate error logging in import commands ([0ec27a5](https://github.com/contensis/cli/commit/0ec27a5d13f3e7179c9825480b19920028744e49))
* entries incorrectly being fetched from Delivery API causing tag fields to fail with `import entries` ([df38de5](https://github.com/contensis/cli/commit/df38de592c88e6a5e0940de1f1da10104e4f7df2))
* export dependency tags and tag groups along with dependency nodes when using `--save-entries` option with `import entries` ([0c8029d](https://github.com/contensis/cli/commit/0c8029d67fbb16c33c2b26119836c6461fa398f8))
* handle mix of entity types when importing data from JSON file so we can import entries containing nodes or import models containing default entries and tag groups ([621da46](https://github.com/contensis/cli/commit/621da4635539b0b141f20af43c9076cfae70e137))
* implement rate limiting when deleting entries ([06fe2f6](https://github.com/contensis/cli/commit/06fe2f68c14c9c53da28ee4e486dd686f3482cd1))
* import tag groups mixed with content models when using `--from-file` in `import models` ([bcd6c11](https://github.com/contensis/cli/commit/bcd6c11e4da1e0807156048f4088ddc73a0b0ac4))
* improve console output when importing entries with dependent tags ([84af771](https://github.com/contensis/cli/commit/84af7719a304fa9759f359c558396986ce8d668e))
* improve console output when there are no changes to make in `import tags` and `import entries` ([7a4ad75](https://github.com/contensis/cli/commit/7a4ad753b1acfa91fd43d203927500aee68f8efd))
* include tag groups in `list models` output ([759f8a2](https://github.com/contensis/cli/commit/759f8a24615e1c916c717e00f51c7c284e7fc9dd))
* null check console output with `import tags` and `import entries` ([58bf59f](https://github.com/contensis/cli/commit/58bf59f8a45e251109a58e86d8e5e7ad50a3a096))
* null check for `versionNo` when building entries fetched from the Delivery API in entries commands ([afa524b](https://github.com/contensis/cli/commit/afa524bd6e593fb7d2c2454cbd2a2c62f59b219d))
* resolve tags correctly when building entries with `copy field` and `update field` ([4ad5446](https://github.com/contensis/cli/commit/4ad5446f09006d2a497b4aeed908ec3f1a2ea177))
* supplying absolute file path when using `--output` option ([78e4e87](https://github.com/contensis/cli/commit/78e4e87254c916b916ed3837d6411456b439e238))
* unresolved tags no longer trigger an error when building entries in migration or copy commands ([f1dd397](https://github.com/contensis/cli/commit/f1dd39776e81be909970c46bdbd334c12135a0bb))
* use Contensis Image API when downloading assets from a source CMS ([06fe2f6](https://github.com/contensis/cli/commit/06fe2f68c14c9c53da28ee4e486dd686f3482cd1))
* use correct grammar in console output when migrating different content entites ([5726941](https://github.com/contensis/cli/commit/5726941959a0ea24ade785d9f13c77f7b1fc3d53))

## [1.5.0](https://github.com/contensis/cli/compare/contensis-cli-v1.4.1...contensis-cli-v1.5.0) (2025-09-09)


### Features

* bump canvas package versions for latest features ([a444377](https://github.com/contensis/cli/commit/a44437798501a5ff640fcb99c3f17dc9e2b9cdcd))
* support for tags and tag groups ([935aeec](https://github.com/contensis/cli/commit/935aeec68af5afd12c8b35e44a157b4047ac2b7a))


### Bug Fixes

* always look to resolve "latest" entries in a target environment when importing entries ([eb74bce](https://github.com/contensis/cli/commit/eb74bce59566665e3f35fb3196e947f5efd61bfc))
* console errors and logging tweaks when importing entries ([b5aecf8](https://github.com/contensis/cli/commit/b5aecf80afac8b79113e218331f706713f219b7b))
* duplicated projects in shell autocomplete after recent change to projects structure held in `environments.json` cache ([84d895f](https://github.com/contensis/cli/commit/84d895f51a672b3cf09ed01350245c8c4772568d))
* resolve shared options in `list tags in` sub-command ([835ca09](https://github.com/contensis/cli/commit/835ca0936364cf7c1d35c4c48b4c734c04b2f533))

## [1.4.1](https://github.com/contensis/cli/compare/contensis-cli-v1.4.0...contensis-cli-v1.4.1) (2025-03-04)


### Bug Fixes

* issue downloading assets from some environments in `import` commands and progress/error logging fixes when loading assets ([4c8852a](https://github.com/contensis/cli/commit/4c8852a2c0baec4859cb0f9939a5195d1a4130a6))
* missing environments.json error for new users ([1716094](https://github.com/contensis/cli/commit/171609437b1b483490578f53a499a6dae25855ea))

## [1.4.0](https://github.com/contensis/cli/compare/contensis-cli-v1.3.0...contensis-cli-v1.4.0) (2024-12-05)


### Features

* add `--format html` option to output results to a HTML table ([b607f39](https://github.com/contensis/cli/commit/b607f399be300e8a00c8e89e2d21e1fe3300b3e3))
* add `--no-publish` option to commands that import entries so any committed entries are left in draft workflow state ([a2db317](https://github.com/contensis/cli/commit/a2db3171db8ba4acc7c4309a5be356487646676b))
* add `push asset` command to push a supplied asset to a location in the cms ([af9e41a](https://github.com/contensis/cli/commit/af9e41a9d88eeed5caac3c50d606959d89cbcce1))
* add `remove env` command to remove a cached environment connection ([bd774df](https://github.com/contensis/cli/commit/bd774df78423ab59d3ac6a651d2320944d3fb56c))
* add `update field` command to find a specific phrase in an entry field and replace it with another in all returned entries ([9e56024](https://github.com/contensis/cli/commit/9e5602499566fa7227d145bcf84d13c2867714aa))
* read environments and current environment projects from session cache and add these to autocomplete `connect` and `set project` commands ([9c2ff36](https://github.com/contensis/cli/commit/9c2ff36c888a0cff5debba46628520f0a55f5f15))


### Bug Fixes

* add missing command to autocomplete available commands ([e3c5a99](https://github.com/contensis/cli/commit/e3c5a9918d4fbe3ceac6440f7725f368726dc915))
* less false positives when diffing built entries in `import`, `copy` and `update` commands ([cf34914](https://github.com/contensis/cli/commit/cf34914d3c2eed9f62241e4042aef21fc9999539))
* null check console output for model defaults in `import models` command ([0e1d9c9](https://github.com/contensis/cli/commit/0e1d9c980ae1cb0fddc758e913b5b483d6c2979f))
* refine console messaging in `update field` command ([7fd9eab](https://github.com/contensis/cli/commit/7fd9eab63daed9cae0bb24d48be34d1a4542e082))
* sort environments alphabetically in `list envs` output ([80166ce](https://github.com/contensis/cli/commit/80166ce721bbee9ffe524b38e559f998055beb85))
* tidy up console messaging for some import operations ([8f18611](https://github.com/contensis/cli/commit/8f18611f5ba5d29c370c126b60458a60155c17b2))

## [1.3.0](https://github.com/contensis/cli/compare/contensis-cli-v1.2.1...contensis-cli-v1.3.0) (2024-09-24)


### Features

* add `--no-defaults` option so we can specify that we don't want to migrate defaults when migrating models ([974d6cd](https://github.com/contensis/cli/commit/974d6cd965387ede09e576d61415c12f622605bc))
* add `--root-uri` option to `copy field` allows prefixing relative uris when converting to canvas ([34b0d62](https://github.com/contensis/cli/commit/34b0d6221a176728731c4965060502cc06d384fd))
* add `--save-entries` option in `import entries` to save the entries built in preview when used with `--output` option ([a7b035f](https://github.com/contensis/cli/commit/a7b035f1dd02d573b4a509e45bbdfb40b8d455cd))
* add `--version-status` option to commands that get entries and a `--latest` option to override version status ([7a3f341](https://github.com/contensis/cli/commit/7a3f3414d44fbe4879d0f9f77abac70a24567553))
* handle dependent nodes in form confirmation rules when migrating models ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* include defaultParentNodeId from content types in models migration ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* migrate dependent nodes and default assets and entries in models migration ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* resolve asset links in canvas fields as entry dependency in entries migrations ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* support new Resource Picker field in content models ([3a0f94c](https://github.com/contensis/cli/commit/3a0f94c428d55f019ee84972c8ef524533f2fbab))
* treat resource picker allowed values as model dependencies ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* validate formContentType canvas blocks ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* validate resource picker values when building entries for migration ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))


### Bug Fixes

* `list models` shares options with `get model` ([c118776](https://github.com/contensis/cli/commit/c118776f55ae335576aaeb724293324c4ce655e9))
* bug with progress bar not completing when loading initial entries for migration ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* canvas content generated in `copy field` has deterministic ids ([6f18515](https://github.com/contensis/cli/commit/6f18515ab5dbaade612b30ec7d178be32e01c5dd))
* clean up console output when using commit flag in `import models` ([2e1aaa4](https://github.com/contensis/cli/commit/2e1aaa464cc3894c97dcfea6cdadf60c24f41512))
* csv output does not contain every possible column for every entry and output boolean fields as "true" or "false" ([555ae29](https://github.com/contensis/cli/commit/555ae296688b20074af9195193e3108d8ea83300))
* display additional info in output of `get contenttype` ([f6cd445](https://github.com/contensis/cli/commit/f6cd445b286f2c0690fe94d97198ad57bdbd4ec2))
* don't fetch dependent entries from migration target in copy field ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* entries containing taxonomy fields in `copy field` are mapped to management api format ([8057b2a](https://github.com/contensis/cli/commit/8057b2ad7d54a43b103b749062e92c2258565426))
* handle siteview nodes linked to entries via canvas fields when importing entries ([09576e9](https://github.com/contensis/cli/commit/09576e986d143d65566a3ce2c1366263c3e0e835))
* incorrect mapping of image attributes in copy field ([f2438a3](https://github.com/contensis/cli/commit/f2438a34383712fce2ce136007c93a16dd0a3696))
* incorrect total used in progress when migrating models ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* issues with fetching asset dependencies in import entries ([c061991](https://github.com/contensis/cli/commit/c061991a260207965917d9895ca52b94dee1fe3c))
* parse csv fields to JS types when using `--from-file` with csv in `import entries` ([d141e20](https://github.com/contensis/cli/commit/d141e2011fa478cac6d7cc35826062aca478d5f9))
* reduce console output with large models in `get models` and add `--required-by` option to log the complete output ([bd31412](https://github.com/contensis/cli/commit/bd31412d98911a2f650c1a59ee261c1e8ecf7211))
* resolve case insensitive ids when deleting content types and components ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* small console output fixes when outputting models ([67331f3](https://github.com/contensis/cli/commit/67331f3dc21b7fc2828e54161890bdc5f6750f6f))
* some entries incorrectly marked as `no change` in `import entries` ([f2af65e](https://github.com/contensis/cli/commit/f2af65e26a704dabdf53f2aa080bd5fa738c5e8e))
* strip escape slashes from quoted strings ([59d6600](https://github.com/contensis/cli/commit/59d660053d3d9efa0ba0e9daa3bf41b3ce62a372))
* support escape quotes inside quoted args in Contensis shell ([3b3058b](https://github.com/contensis/cli/commit/3b3058bed0496cbafa9ac64e74827b72c0fb7aab))
* typo in help text in push block command ([9760ea2](https://github.com/contensis/cli/commit/9760ea2b43cfcaf08fb933fb8b61c007119d2bf6))
* unable to output content model json, added `--export` option to `get model` command ([cac99a5](https://github.com/contensis/cli/commit/cac99a57cda6f221af5e060a871dcbd543b60b39))
* undefined error in import entries ([2a52a63](https://github.com/contensis/cli/commit/2a52a630f95807a2260a1606c52ced4e5e39f66c))


### Performance Improvements

* don't resolve dependencies for entries in the destination environment, as entry dependencies are resolved in the source first ([d87a963](https://github.com/contensis/cli/commit/d87a9635b8194f42690bdf68d4fbcccad135a7d6))
* much quicker generating content models and maintain a file cache for generated models ([b10bd29](https://github.com/contensis/cli/commit/b10bd2942f533c0e3626f2364283ad46ef2edc21))
* refactored code for building and migrating content models, providing a context object for each repository involved in the migration ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* refactored code for building entries in migrations ([d92120f](https://github.com/contensis/cli/commit/d92120fdd020f0c363c101a635c7d30b9c91d3e6))
* use file cache for commands that generate content models, add `no-cache` option to ignore local cache ([b2a2caf](https://github.com/contensis/cli/commit/b2a2caf21446755734bb2f24867e46befd863cfd))

## [1.2.1](https://github.com/contensis/cli/compare/contensis-cli-v1.2.0...contensis-cli-v1.2.1) (2024-05-09)


### Bug Fixes

* post testing issues with `copy field` transformations and issues in v1.2.0 ([fa26f4d](https://github.com/contensis/cli/commit/fa26f4df6b5d18121a9ef58d5ffe87a787cf4a43))

## [1.2.0](https://github.com/contensis/cli/compare/contensis-cli-v1.1.1...contensis-cli-v1.2.0) (2024-05-02)


### Features

* add `save-entries` option in `copy field` to save the built entries to json file specified in `output` option ([283a6cd](https://github.com/contensis/cli/commit/283a6cd439df1d51a86a1d1e6bd9cf3edaae5f6f))
* add `search` option in `copy field` ([45bc264](https://github.com/contensis/cli/commit/45bc264f73c3be2fcfd9c1ed66f1b8f2f4cb20ea))
* added `delivery-api` option in `get entries` ([d2028bf](https://github.com/contensis/cli/commit/d2028bfeef3a8334f0c6d5c5f0a4c4c617b5e768))
* added `RequestHandlerFactory` to manage request handler release binary install/update before returning a request handler invocation method in `dev requests` command. Update implementation to supply args instead of writing yaml to launch request handler. ([1898a2a](https://github.com/contensis/cli/commit/1898a2a6a83dedbe17fc7725795b0fd1dac198d3))
* new command `copy field` ([1f27c2d](https://github.com/contensis/cli/commit/1f27c2d009072a9708272929feca4f79b72ecee0))
* prompt to override a running block and set a local uri with `dev requests`, ability to run a specific request handler version with `--release` option ([a39ebbd](https://github.com/contensis/cli/commit/a39ebbd0ad449d42398db38992fbbc298f552de5))
* templating improvements with `copy field` command, new arguments to copy just entry ids, or copy from zenql. Initial support for getting entries via delivery api ([caa4eab](https://github.com/contensis/cli/commit/caa4eab906f24a1bab280267eb32d254fd44ffe8))


### Bug Fixes

* `import contenttypes` and `import components` implementation when specifiying a source-cms, fix corrupted console output on both `remove` commands ([e4b6afa](https://github.com/contensis/cli/commit/e4b6afaf2417ef61d9eee1d545e82685bc3b8747))
* after extensive testing copy field template variables ([186ece2](https://github.com/contensis/cli/commit/186ece2b9bd5594ead103b4aaa673390df7a9314))
* ensure downloaded request handler script has execute permission ([cb6b9c7](https://github.com/contensis/cli/commit/cb6b9c760e55ef72b31342129edbb575ce47f7b7))
* improve output logging when finding block versions using `get block` command ([6f3f003](https://github.com/contensis/cli/commit/6f3f0030f0c0fe09830d27d1b91ab9a421cf3a8e))
* language option in `create project` command incorrectly read as boolean and needs to be a string ([2bb5c90](https://github.com/contensis/cli/commit/2bb5c902055acff285666a081c80ba71f62b8c8e))
* sanitise `--fields` input ensuring they are valid api ids ([fefcb34](https://github.com/contensis/cli/commit/fefcb3415cdc1cbdf89148a88f18e26e8838d2ff))
* update migration package version for latest fixes ([964cdb0](https://github.com/contensis/cli/commit/964cdb0447856a6bae87a4285ffa4c7af5268fc2))


### Performance Improvements

* improve response times when using `import entries` with very large workloads ([28c2535](https://github.com/contensis/cli/commit/28c2535f2fe09593c47b0d6f38c523a44a587555))
* request block versions concurrently before launching local request handler with `dev requests` ([18135b6](https://github.com/contensis/cli/commit/18135b635284f3714f82581cb755cb9b1a1edeec))

## [1.1.1](https://github.com/contensis/cli/compare/contensis-cli-v1.1.0...contensis-cli-v1.1.1) (2023-12-08)


### Bug Fixes

* better handling of file imports and exports for csv and xml formats ([f562a08](https://github.com/contensis/cli/commit/f562a088dea04fdcdfc57a55ec90882e33f27b06))
* diff not outputting in `import entries` ([1964de0](https://github.com/contensis/cli/commit/1964de0a67f83b4ce987aefb6dfc11f0a9167e34))
* return an error when file is not found when using `--from-file` with import commands ([c8198d8](https://github.com/contensis/cli/commit/c8198d8ddba9526bc16f0c4a7a884d8ff51785ce))

## [1.1.0](https://github.com/contensis/cli/compare/contensis-cli-v1.0.11...contensis-cli-v1.1.0) (2023-12-01)


### Features

* add `--ignore-errors` option to import commands ([678117c](https://github.com/contensis/cli/commit/678117c137f1a673c69f1e9f7742525a48f8c3d8))
* add argument to `import nodes` command supporting import of nodes from a given root path ([4eba8d2](https://github.com/contensis/cli/commit/4eba8d208a388ced34a626da71c0f0566f27e50f))
* added command `remove nodes` ([19e216e](https://github.com/contensis/cli/commit/19e216ee899f3b6a60eb7db1fe4c861e05c0ee28))
* new commands `list workflows` and `get workflow` ([4636d5a](https://github.com/contensis/cli/commit/4636d5a67894425e0c7e92aa51fa4cb8d8935412))
* on dev init success cms link added with security token so when you click it you are automagically logged in ([526c7ab](https://github.com/contensis/cli/commit/526c7abd29fa44714ea8c5e19f4538518ec02659))


### Bug Fixes

* `dev init` fixes for `--dry-run` option and output line spacing, some refactoring to reduce excess code ([b5cefda](https://github.com/contensis/cli/commit/b5cefda28403b69de6e98f0870b4c87194dfb005))
* `dev init` resolves incorrect git directory when providing projectHome argument ([56cef25](https://github.com/contensis/cli/commit/56cef257510ead814b9e25423257d5896f0075d3))
* add `--preserve-guids` option to `import nodes` command and added comments ([ed63912](https://github.com/contensis/cli/commit/ed63912d73e5c13db3c1f5d982d2b826e3d98981))
* api error when using `create key` without supplying a description arg ([4129909](https://github.com/contensis/cli/commit/4129909714caac534b2198aac12a8ed8203c338f))
* console line breaks and typos in `dev init` and missing message in dry-run ([386d7e2](https://github.com/contensis/cli/commit/386d7e252a51d40f528374a8bd45775e4b19f049))
* console output fixes ([0892147](https://github.com/contensis/cli/commit/089214717327bdb19105a945eed2bef36ab1a576))
* console output improvements for `import nodes` utilising a tree style view outputting additional detail with specific command options ([4f88b5d](https://github.com/contensis/cli/commit/4f88b5d5c919b3a40de02c62c9c4465550f98e6d))
* console output in `import nodes` command ([d57f9d9](https://github.com/contensis/cli/commit/d57f9d98508c98ad07c58d718a7b66cbb04f3792))
* default to current directory when loading json using `--from-file` option ([a922919](https://github.com/contensis/cli/commit/a9229195366d6e38e9879db0d5dd32cde66afd53))
* error output enhancements for import commands ([4913e40](https://github.com/contensis/cli/commit/4913e400a4649cf39294086921b796d2d4cd2b70))
* handle `libsecret` error when used in CI if credentials are not mapped properly by CI consumers ([a7c6b54](https://github.com/contensis/cli/commit/a7c6b544958079d3312132b5a4336237962a1c7d))
* handling 0 in calculations for console output for `import nodes` ([d571feb](https://github.com/contensis/cli/commit/d571feb12bc339165a6c9489ca491285fbfd189a))
* incorrect import options removed for non-entry imports ([926fd94](https://github.com/contensis/cli/commit/926fd940950b8a7af5528303683453123a54a947))
* incorrect stats output to console with `import nodes` ([500f71b](https://github.com/contensis/cli/commit/500f71b83d498c4db8d37fc9cc3aeededc805d7e))
* issue assigning api key to role in `dev init` ([1a67613](https://github.com/contensis/cli/commit/1a67613433cc88288a7cc42c34e142295aa0972c))
* missing command from tab help suggestion ([de51184](https://github.com/contensis/cli/commit/de511845f760e0b141e6ca8300ac3bfb9338faa1))
* null checks when errors returned with import commands ([bc67d4a](https://github.com/contensis/cli/commit/bc67d4a89d3e0221299623a3d1923f87732ad440))
* output nodes as a flattened array when calling `get nodes` with `--output` option instead of a node "tree" ([4957b8f](https://github.com/contensis/cli/commit/4957b8f3bd86586f4dd1375dc8666a92e13cbdcf))
* return first child nodes by default in `get nodes` ([5ad41cc](https://github.com/contensis/cli/commit/5ad41ccf1ff5296b57af6a8bc5df339f16eea45f))
* truthy syntax error ([8fc0e4e](https://github.com/contensis/cli/commit/8fc0e4e47a7f9cd570c9ae838d527c0c9f25ebc0))
* unable to use `login` command with id and shared secret ([91a4301](https://github.com/contensis/cli/commit/91a4301860125ad257150c9464279125d30304e1))
* using `--fields` option gives consistent results when outputting to various formats ([e785eb3](https://github.com/contensis/cli/commit/e785eb3246910daa66a91adb953ac3dd465c824a))
