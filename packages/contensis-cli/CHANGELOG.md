# Changelog

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
