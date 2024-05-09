# Changelog

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
