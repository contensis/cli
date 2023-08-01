import { Command } from 'commander';
import mapJson from 'jsonpath-mapper';
import { PushBlockParams } from 'migratortron';
import { cliCommand } from '~/services/ContensisCliService';

export const makePushCommand = () => {
  const push = new Command()
    .command('push')
    .description('push command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

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
      'the url of the source repository for the supplied image uri'
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
