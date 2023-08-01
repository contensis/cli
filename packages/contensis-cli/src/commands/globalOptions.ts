import { Command, Option } from 'commander';
import { url } from '~/util';

export const mapContensisOpts = (opts: any = {}) => ({
  source:
    opts.sourceAlias || opts.sourceProjectId
      ? {
          url: opts.sourceAlias
            ? url(opts.sourceAlias, 'website').cms
            : (undefined as any),
          project: opts.sourceProjectId || (undefined as any),
        }
      : undefined,
  models: opts.modelIds,
  query:
    opts.id || opts.entryIds || opts.phrase || opts.fields
      ? {
          fields: opts.fields,
          includeIds: opts.id || opts.entryIds,
          searchTerm: opts.phrase,
        }
      : undefined,
  zenQL: opts.zenql,
  transformGuids: !opts.preserveGuids,
});

/* Output options */
const output = new Option(
  '-o --output <output>',
  'save output to a file e.g. --output ./output.txt'
);

const format = new Option(
  '-f --format <format>',
  'format output as csv, json, xml or table (default)'
).choices(['csv', 'json', 'xml', 'table']);

/* Connect options */
const alias = new Option(
  '-a --alias <alias>',
  'the cloud CMS alias to connect your request with'
);

export const project = new Option(
  '-p --project-id <projectId>',
  'the projectId to make your request with'
);

/* Authentication options */
const user = new Option(
  '-u --user <user>',
  'the username to authenticate your request with'
);
const password = new Option(
  '-pw --password <password>',
  'the password to use to login with (optional/insecure)'
);
const clientId = new Option(
  '-id --client-id <clientId>',
  'the clientId to authenticate your request with'
);
const sharedSecret = new Option(
  '-s --shared-secret <sharedSecret>',
  'the shared secret to use when logging in with a client id'
);

/* Entry get options */
export const zenql = new Option(
  '-q --zenql <zenql>',
  'get entries with a supplied ZenQL statement'
);

export const entryId = new Option('-i --id <id...>', 'the entry id(s) to get');

/* Import options */
export const fromFile = new Option(
  '-file, --from-file <fromFile>',
  'file path to import asset(s) from'
);

export const fromCms = new Option(
  '-source, --source-alias <fromCms>',
  'the cloud CMS alias to import asset(s) from'
);
export const fromProject = new Option(
  '-sp, --source-project-id <fromProject>',
  'the id of the Contensis project to import asset(s) from (Default: [last connected project])'
);

export const commit = new Option(
  '--commit',
  'add this flag only after you have run a preview of the import and agree with the analysis'
).default(false);

export const addConnectOptions = (program: Command) =>
  program.addOption(alias.hideHelp()).addOption(project.hideHelp());

export const addAuthenticationOptions = (program: Command) =>
  program
    .addOption(user.hideHelp())
    .addOption(password.hideHelp())
    .addOption(clientId.hideHelp())
    .addOption(sharedSecret.hideHelp());

const addOutputAndFormatOptions = (program: Command) =>
  program.addOption(output).addOption(format);

export const addImportOptions = (program: Command) => {
  for (const command of program.commands) {
    command.addOption(fromFile).addOption(fromCms).addOption(fromProject);
  }
  return program;
};
export const addGetEntryOptions = (program: Command) => {
  for (const command of program.commands) {
    command.addOption(entryId).addOption(zenql);
  }
  return program;
};
export const addGlobalOptions = (program: Command) => {
  for (const command of program.commands) {
    addOutputAndFormatOptions(command);
    addConnectOptions(command);
    addAuthenticationOptions(command);
  }
  return program;
};
