import { Command, Option } from 'commander';
import { MigrateRequest } from 'migratortron';
import { url } from '~/util';

// Map various input options into a request to be processed
// by Migratortron / Contensis import library
export const mapContensisOpts = (opts: any = {}): MigrateRequest => ({
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
  copyField: opts.copyField,
  // convert various cli options into MigrateRequest.query format
  query:
    opts.id ||
    opts.entryIds ||
    opts.search ||
    opts.fields ||
    opts.orderBy ||
    opts.paths ||
    opts.assetType ||
    opts.contentType ||
    opts.dataFormat ||
    opts.deliveryApi ||
    opts.latest ||
    opts.versionStatus
      ? {
          assetTypes: opts.assetType,
          contentTypeIds: opts.contentType,
          dataFormats: opts.dataFormat ? [opts.dataFormat] : undefined,
          fields: opts.fields,
          includeIds: opts.id || opts.entryIds,
          includePaths: opts.paths,
          orderBy: opts.orderBy,
          searchTerm: opts.search,
          useDelivery: opts.deliveryApi,
          versionStatus: opts.latest ? 'latest' : opts.versionStatus,
        }
      : undefined,
  zenQL: opts.zenql,
  transformGuids: !opts.preserveGuids,
  ignoreErrors: opts.ignoreErrors,
  noCache: !opts.cache,
  concurrency: opts.concurrency ? Number(opts.concurrency) : undefined,
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
export const delivery = new Option(
  '-delivery --delivery-api',
  'use delivery api to get the entries'
);
export const search = new Option(
  '--search <phrase>',
  'get entries with the search phrase, use quotes for multiple words'
);
export const zenql = new Option(
  '-q --zenql <zenql>',
  'get entries with a supplied ZenQL statement'
);

export const entryId = new Option('-i --id <id...>', 'the entry id(s) to get');
export const contentTypes = new Option(
  '-c --content-type <contentType...>',
  'get entries of these content type(s)'
);
export const assetTypes = new Option(
  '-at --asset-type <assetType...>',
  'get assets of given content type(s) e.g. image word pdf'
);
export const versionStatus = new Option(
  '-vs --version-status <versionStatus>',
  'the entry versions to get'
)
  .choices(['latest', 'published'])
  .default('published');

export const latest = new Option('--latest', 'get the latest entry versions');

/* Import options */
export const fromFile = new Option(
  '-file --from-file <fromFile>',
  'file path to import asset(s) from'
);

export const fromCms = new Option(
  '-source --source-alias <fromCms>',
  'the cloud CMS alias to import asset(s) from'
);
export const fromProject = new Option(
  '-sp --source-project-id <fromProject>',
  'the id of the Contensis project to import asset(s) from (Default: [last connected project])'
);

export const commit = new Option(
  '--commit',
  'add this flag only after you have run a preview of the import and agree with the analysis'
).default(false);

export const ignoreErrors = new Option(
  '-ignore --ignore-errors',
  'commit the import ignoring any reported errors'
).default(false);

export const outputDetail = new Option(
  '-od --output-detail <outputDetail>',
  'how much detail to output from the import'
)
  .choices(['errors', 'changes', 'all'])
  .default('errors');

export const saveEntries = new Option(
  '-save --save-entries',
  "save the entries we're migrating instead of the migration preview when using --output option"
);

export const concurrency = new Option(
  '-conc --concurrency <concurrency>',
  'the number of entries to load in parallel'
).default(2);

export const noCache = new Option(
  '--no-cache',
  'add this flag to ignore internal cache and rebuild all resources from scratch'
);

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
    command.addOption(fromCms).addOption(fromProject).addOption(fromFile);
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
