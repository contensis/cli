import { Argument, Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { mapContensisOpts } from './globalOptions';

export const makeGetCommand = () => {
  const program = new Command()
    .command('get')
    .showHelpAfterError(true)
    .exitOverride();

  program
    .command('contenttype')
    .argument('<contentTypeId>', 'the API id of the content type to get')
    .addHelpText(
      'after',
      `
Example call:
  > get contenttype {contentTypeId} -o content-type-backup.json
`
    )
    .action(async (contentTypeId: string, opts) => {
      await cliCommand(['get', 'contenttype'], opts).PrintContentType(
        contentTypeId
      );
    });
  program
    .command('component')
    .argument('<componentId>', 'the API id of the component to get')
    .addHelpText(
      'after',
      `
Example call:
  > get component {componentId} -o component-backup.json
`
    )
    .action(async (componentId: string, opts) => {
      await cliCommand(['get', 'component'], opts).PrintComponent(componentId);
    });
  program
    .command('entries')
    .argument(
      '[search phrase]',
      'get entries with the search phrase, use quotes for multiple words'
    )
    .option('-i --id <id...>', 'the entry id to get')
    .option(
      '-d, --dependents',
      'find and return any dependencies of all found entries'
    )
    .option(
      '-fi, --fields <fields...>',
      'limit the output fields on returned entries'
    )
    .option(
      '-q, --zenql <zenql>',
      'get entries with a supplied ZenQL statement'
    )
    .addHelpText(
      'after',
      `
Example call:
  > get entries --zenql "sys.contentTypeId = blog" --fields entryTitle entryDescription sys.id --output ./blog-posts.csv --format csv
`
    )
    .action(async (phrase: string, opts, cmd) => {
      // console.log('phrase: ', phrase, '\nopts:', JSON.stringify(opts, null, 2));
      // console.log('opts:', JSON.stringify(opts, null, 2));
      await cliCommand(
        ['get', 'entries'],
        opts,
        mapContensisOpts({ phrase, ...opts })
      ).GetEntries({
        withDependents: opts.dependents,
      });
    });

  const block = program
    .command('block')
    .argument('[blockId]', 'the block to get version details for')
    .argument(
      '[branch]',
      'the branch of the block to get version details for',
      'main'
    )
    .argument(
      '[version]',
      'get a specific version of the block pushed to the specified branch'
    )
    .action(async (blockId: string, branch: string, version: string, opts) => {
      await cliCommand(['get', 'block'], opts).PrintBlockVersions(
        blockId,
        branch,
        version
      );
    });

  const dataCenter = new Argument(
    '[dataCenter]',
    'the datacentre of the block to get logs for'
  )
    .choices(['hq', 'london', 'manchester'])
    .default('hq');

  block
    .command('logs')
    .argument('[blockId]', 'the block to get version logs for')
    .argument(
      '[branch]',
      'the branch of the block to get version details for',
      'main'
    )
    .argument(
      '[version]',
      'the version of the block pushed to the branch to get logs for',
      'latest'
    )
    .addArgument(dataCenter)
    .usage('get block logs [blockId] [branch] [version] [dataCenter]')
    .action(
      async (
        blockId: string,
        branch: string,
        version: string,
        dataCenter: 'hq' | 'manchester' | 'london',
        opts
      ) => {
        await cliCommand(['get', 'block', 'logs'], opts).PrintBlockLogs(
          blockId,
          branch,
          version,
          dataCenter
        );
      }
    );

  return program;
};

export const get = makeGetCommand();
