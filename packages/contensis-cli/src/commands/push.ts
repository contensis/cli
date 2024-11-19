import { Command } from 'commander';
import mapJson from 'jsonpath-mapper';
import { generateGuid, PushBlockParams } from 'migratortron';
import path from 'path';
import { Asset } from 'contensis-delivery-api';
import { cliCommand } from '~/services/ContensisCliService';
import {
  commit,
  mapContensisOpts,
  noPublish,
  outputDetail,
  saveEntries,
} from './globalOptions';
import { jsonFormatter } from '~/util/json.formatter';
import { cwdPath } from '~/providers/file-provider';

export const makePushCommand = () => {
  const push = new Command()
    .command('push')
    .description('push command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  push
    .command('asset')
    .description('push an asset')
    .argument('<content-type-id>', 'the content type id of the asset to push')
    .argument(
      '<title>',
      'the title of the asset as it appears in the cms (use quotes)'
    )
    .argument(
      '[description]',
      'the description or altText of the asset (use quotes)'
    )
    .option(
      '-from --from-file <fromFile>',
      'the local file path of the source asset'
    )
    .option('-url --from-url <fromUrl>', 'the full url of the source asset')
    .option(
      '-to --target-file-path <targetFilePath>',
      'the file path in the cms project to push the asset to e.g. "/asset-library/"'
    )
    .option(
      '-name --target-file-name <targetFileName>',
      'set the file name in the cms project'
    )
    .option('-i --id <id>', 'push the asset with a specific guid')
    .addOption(commit)
    .addOption(noPublish)
    .addOption(outputDetail)
    .addOption(saveEntries)
    .usage('<content-type-id> <title> [description] [options]')
    .addHelpText(
      'after',
      `
Example call:
  > push asset pdf "Example file" "An example of a PDF asset" --from-file example.pdf --target-file-path /asset-library/pdf/\n`
    )
    .action(
      async (
        contentTypeId: string,
        title: string,
        description: string,
        opts
      ) => {
        const cli = cliCommand(
          ['push', 'asset', contentTypeId, title, description],
          opts,
          mapContensisOpts({ preserveGuids: true, ...opts, id: undefined })
        );
        const mapSourceVars = {
          contentTypeId,
          title,
          description,
          ...opts,
        };

        const assetEntry: Asset = mapJson(mapSourceVars, {
          entryTitle: 'title',
          title: 'title',
          entryDescription: 'description',
          description: 'description',
          altText: ({ contentTypeId, description }) =>
            contentTypeId === 'image' ? description : undefined,
          sys: {
            dataFormat: () => 'asset',
            contentTypeId: 'contentTypeId',
            id: 'id',
            isPublished: () => true, // can be overridden by !opts.publish
            properties: {
              filename: {
                $path: ['targetFileName', 'fromFile', 'fromUrl'],
                $formatting: (nameOrPath: string) => {
                  return path.basename(nameOrPath);
                },
              },
              filePath: {
                $path: 'targetFilePath',
                $default: (_, { fromFile, fromUrl }) => {
                  const toPosixPath = (windowsPath: string) =>
                    windowsPath.replace(/^(\w):|\\+/g, '/$1');

                  return path.dirname(
                    toPosixPath(fromFile || fromUrl.split(':/')[1])
                  );
                },
              },
            },
            uri: {
              $path: ['fromFile', 'fromUrl'],
              $formatting: (from: string) =>
                from?.startsWith('http') ? from : cwdPath(from),
            },
          },
        });

        if (!assetEntry.sys.id)
          assetEntry.sys.id = generateGuid(
            cli.currentEnv,
            cli.currentProject,
            `${assetEntry.sys.contentTypeId}-${assetEntry.sys.properties.filePath.replaceAll('/', '').toLowerCase()}-${assetEntry.sys.properties.filename.toLowerCase()}`
          );

        console.log(jsonFormatter(assetEntry));

        await cli.ImportEntries({
          commit: opts.commit,
          logOutput: opts.outputDetail,
          saveEntries: opts.saveEntries,
          data: [assetEntry],
        });
      }
    );

  push
    .command('block')
    .description('push a block')
    .argument('<block-id>', 'the name of the block to push to')
    .argument(
      '<image uri:tag>',
      'the uri and tag of the container image to push as a block (tag default: latest)'
    )
    .argument('[branch]', 'the branch we are pushing to')
    .option(
      '-r --release',
      'whether to release the pushed block version',
      false
    )
    .option(
      '-cid --commit-id <commitId>',
      'the id of the source git commit for the supplied image uri'
    )
    .option(
      '-cmsg --commit-message <commitMessage>',
      'the git commit message for the supplied commit id'
    )
    .option(
      '-cdt --commit-datetime <commitDateTime>',
      'the timestamp of the source git commit for the supplied image uri'
    )
    .option(
      '-author --author-email <authorEmail>',
      'the git email address of the author of the source git commit'
    )
    .option(
      '-committer --committer-email <committerEmail>',
      'the git email address of the commiter of the source git commit'
    )
    .option(
      '-repo --repository-url <repositoryUrl>',
      'the url of the source repository for the supplied image uri'
    )
    .option(
      '-pr --provider <sourceProvider>',
      'the source repository provider of the supplied image uri'
    )
    .usage('<block-id> <image uri> [branch] [options]')
    .addHelpText(
      'after',
      `
Example call:
  > push block contensis-app ghcr.io/contensis/contensis-app/app:build-4359 master --release\n`
    )
    .action(async (blockId: string, imageUri: string, branch: string, opts) => {
      const cli = cliCommand(['push', 'block', blockId], opts);
      const mapSourceVars = {
        blockId,
        imageUri,
        branch,
        ...opts,
        ...process.env,
      };

      const blockRequest = mapJson(mapSourceVars, {
        release: { $path: 'release', $default: () => false },
        id: ['blockId'],
        image: () => {
          const lastIndexOfColon = imageUri.lastIndexOf(':');
          return {
            uri: imageUri.slice(0, lastIndexOfColon),
            tag: imageUri.slice(lastIndexOfColon + 1) || 'latest',
          };
        },
        projectId: () => cli.env.currentProject || '',
        source: {
          provider: {
            $path: ['provider'],
            $return: (provider: string, { GITHUB_ACTIONS, GITLAB_CI }) => {
              if (provider) return provider;
              if (GITHUB_ACTIONS) return 'Github';
              else if (GITLAB_CI) return 'GitlabSelfHosted';
            },
          },
          repositoryUrl: {
            $path: ['repositoryUrl', 'CI_PROJECT_URL', 'GITHUB_REPOSITORY'],
            $formatting: (url: string, { GITHUB_ACTIONS }) => {
              if (GITHUB_ACTIONS) url = `https://github.com/${url}`;

              if (url && !url.endsWith('.git')) return `${url}.git`;
              return url;
            },
          },
          branch: ['branch', 'CI_COMMIT_REF_NAME', 'GITHUB_REF_NAME'],
          commit: {
            id: ['commitId', 'CI_COMMIT_SHORT_SHA', 'GITHUB_SHA'],
            message: {
              $path: ['commitMessage', 'CI_COMMIT_MESSAGE'], // ${{ github.event.head_commit.message }}
              $formatting: (msg?: string) =>
                msg?.replace(/\\n/g, ' ').replace(/\\n/g, ' ').trim(),
            },
            dateTime: ['commitDatetime', 'CI_COMMIT_TIMESTAMP'], // ${{ github.event.head_commit.timestamp }}
            authorEmail: ['authorEmail', 'GITLAB_USER_EMAIL', 'GITHUB_ACTOR'], // ${{ github.event.head_commit.author.email }}
            committerEmail: [
              'committerEmail',
              'GITLAB_USER_EMAIL',
              'GITHUB_TRIGGERING_ACTOR',
            ], // ${{ github.event.head_commit.committer.email }}
          },
        },
      }) as PushBlockParams;

      await cli.PushBlock(blockRequest);

      // console.log(process.env);
    });

  return push;
};
