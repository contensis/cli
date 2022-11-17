import { BlockRunningStatus, MigrateStatus } from 'migratortron';
import { Logger } from '~/util/logger';

export const LogMessages = {
  app: {
    contensis: () => 'Contensis',
    quit: () => `Goodbye 👋\n`,
    startup: () =>
      `© 2001-${new Date().getFullYear()} Zengenti 🇬🇧. \n - Creators of Contensis and purveyors of other fine software\n\n👋 Welcome to the contensis-cli\n`,
    help: () =>
      'Press [CTRL]+[C] or type "quit" to return to your system shell\nPress [TAB] for suggestions\n',
    suggestions: () =>
      `\n${Logger.errorText('>>')} Press [TAB] for suggestions\n`,
    autocomplete: () => `\n${Logger.errorText('>>')} Available commands:`,
    unknownError: () => `Something went wrong...`,
    fileOutput: (format = 'json', path?: string) =>
      `Output ${format} file: ${Logger.infoText(path)}\n`,
    noFileOutput: () => `No output written\n`,
  },
  command: {
    notKnown: (command: string) => `${command} is not known`,
  },
  envs: {
    found: (num: number) =>
      `environments store found containing ${num} environment${
        num === 1 ? '' : 's'
      }`,
    tip: () =>
      `Connect to a Contensis cloud instance using "contensis connect {cms alias}"`,
  },
  connect: {
    command: {
      name: () => 'connect',
      example: () => `Example call:\n  > connect example-dev`,
    },
    args: {
      alias: {
        name: () => '<alias>',
        description: () => 'the Contensis Cloud alias to connect with',
      },
    },
    noEnv: () => `Cannot connect - no environment alias specified`,
    unreachable: (url: string, status: number) =>
      `Cannot reach ${url}${status ? ` - status ${status}` : ''}`,
    connected: (env: string) => `Current environment set to "${env}"`,
    help: () =>
      `Connect to a Contensis cloud instance using "contensis connect {cms alias}"`,
    projects: () => `Available projects:`,
    noProjects: () => `Cannot retrieve projects list`,
    tip: () =>
      `Introduce yourself with "login {username}" or "login {clientId} -s {secret}" or by passing credentials as options with your command`,
  },
  login: {
    command: {
      name: () => 'login',
      usage: () => `<user/clientId> [password] [-s <sharedSecret>]`,
      example: () =>
        `Example call:\n  > login myuserid\n  -- or --\n  > login {clientId} -s {sharedSecret}`,
    },
    args: {
      user: {
        name: () => '<user/clientId>',
        description: () => 'the username to login with',
      },
      password: {
        name: () => '[password]',
        description: () =>
          'the password to use to login with (optional/insecure)',
      },
      secret: {
        name: () => '-s --sharedSecret <sharedSecret>',
        description: () =>
          'the shared secret to use when logging in with a client id',
      },
    },
    passwordPrompt: (env?: string, userId?: string) =>
      userId
        ? `Enter password for ${userId}@${env}:`
        : `Please enter a password`,
    failed: (env: string, userId: string) =>
      `Unable to login to ${env} as ${userId}`,
    success: (env: string, userId: string) =>
      `User ${userId} connected to ${env} successfully\n`,
    insecurePassword: () =>
      `Could not connect to local keystore - your password could be stored unencrypted!`,
    noEnv: () => `No environment set, use "contensis connect {alias}" first`,
    noUserId: () => `No user id specified`,
  },
  projects: {
    list: () => `Available projects:`,
    noList: () => `Cannot retrieve projects list`,
    set: (projectId: string) => `Current project is set to "${projectId}"`,
    failedSet: (projectId: string) => `Project "${projectId}" not found`,
    tip: () =>
      `You need to set your current working project with "set project {projectId}"`,
  },
  contenttypes: {
    list: (projectId: string) => `Content types in "${projectId}":`,
    noList: (projectId: string) =>
      `[${projectId}] Cannot retrieve content types list`,
    get: (projectId: string, contentTypeId: string) =>
      `[${projectId}] Content type "${contentTypeId}"`,
    failedGet: (projectId: string, contentTypeId: string) =>
      `[${projectId}] Unable to get content type "${contentTypeId}"`,
    created: (projectId: string, componentId: string, status?: string) =>
      `[${projectId}] Content type ${status}d "${componentId}"`,
    removed: (env: string, id: string, commit: boolean) =>
      `[${env}] ${commit ? `Deleted` : `Will delete`} content type "${id}"`,
    failedRemove: (env: string, id: string) =>
      `[${env}] Unable to delete content type "${id}"`,
  },
  components: {
    list: (projectId: string) => `Components in "${projectId}":`,
    noList: (projectId: string) =>
      `[${projectId}] Cannot retrieve components list`,
    get: (projectId: string, componentId: string) =>
      `[${projectId}] Component "${componentId}"`,
    failedGet: (projectId: string, componentId: string) =>
      `[${projectId}] Unable to get component "${componentId}"`,
    created: (projectId: string, componentId: string, status?: string) =>
      `[${projectId}] Component ${status}d "${componentId}"`,
    removed: (env: string, id: string, commit: boolean) =>
      `[${env}] ${commit ? `Deleted` : `Will delete`} component "${id}"`,
    failedRemove: (env: string, id: string) =>
      `[${env}] Unable to delete component "${id}"`,
  },
  version: {
    set: (env: string, versionStatus: string) =>
      `[${env}] Content version status set to "${versionStatus}"`,
    invalid: (versionStatus: string) =>
      `Content version status "${versionStatus}" is not valid, allowed values are "published" or "latest".`,
    noEnv: () =>
      `No Contensis environment set, connect to your Contensis cloud instance using "contensis connect {cms alias}"`,
  },
  entries: {
    migrateStatus: (status: MigrateStatus) => {
      switch (status) {
        case 'no change':
          return Logger.successText;
        case 'create':
        case 'two-pass':
        case 'update':
        case 'delete':
          return Logger.warningText;
        case 'error':
        case 'not found':
          return Logger.errorText;
        default:
          return Logger.infoText;
      }
    },
    removed: (env: string, id: string, commit: boolean) =>
      `[${env}] ${commit ? `Deleted` : `Will delete`} entry "${id}"`,
    failedRemove: (env: string, id: string) =>
      `[${env}] Unable to delete entry "${id}"`,
    notFound: (id: string) => `Entry "${id}" not found`,
    commitTip: () => `  Add --commit flag to commit the previewed changes`,
  },
  keys: {
    list: (env: string) => `[${env}] API keys:`,
    noList: (env: string) => `[${env}] Cannot retrieve API`,
    created: (env: string, name: string) =>
      `[${env}] Created API key "${name}"`,
    failedCreate: (env: string, name: string) =>
      `[${env}] Unable to create API key "${name}"`,
    removed: (env: string, id: string) => `[${env}] Deleted API key "${id}"`,
    failedRemove: (env: string, id: string) =>
      `[${env}] Unable to delete API key "${id}"`,
  },
  blocks: {
    runningStatus: (status: BlockRunningStatus | 'broken') => {
      switch (status) {
        case 'available':
          return Logger.successText(status);
        case 'pending':
        case 'starting':
        case 'stopped':
          return Logger.warningText(status);
        case 'degraded':
        case 'faulted':
        case 'broken':
          return Logger.errorText(status);
        default:
          return Logger.infoText(status);
      }
    },
    get: (id: string, env: string, projectId?: string) =>
      `[${env}] Block ${id} in project ${projectId}:`,
    list: (env: string, projectId?: string) =>
      `[${env}] Blocks in project ${projectId}:`,
    noList: (env: string, projectId?: string) =>
      `[${env}] Cannot retrieve blocks in project ${projectId}`,
    getLogs: (id: string, branch: string, env: string, projectId?: string) =>
      `[${env}] Requesting logs from block "${id}" in branch ${branch} in project ${projectId}`,
    failedGetLogs: (id: string, env: string, projectId?: string) =>
      `[${env}] Unable to fetch block logs for "${id}" in project ${projectId}`,
    tryPush: (id: string, branch: string, env: string, projectId?: string) =>
      `[${env}] Request to push block "${id}" in branch ${branch} in project ${projectId}`,
    pushed: (id: string, branch: string, env: string, projectId?: string) =>
      `[${env}] Pushed block "${id}" in branch ${branch} in project ${projectId}`,
    failedPush: (id: string, env: string, projectId?: string) =>
      `[${env}] Unable to push block "${id}" in project ${projectId}`,
    released: (id: string, env: string, projectId?: string) =>
      `[${env}] Released block "${id}" in project ${projectId}`,
    failedRelease: (id: string, env: string, projectId?: string) =>
      `[${env}] Unable to release block "${id}" in project ${projectId}`,
    deleted: (id: string, env: string, projectId?: string) =>
      `[${env}] Deleted block "${id}" in project ${projectId}`,
    failedDelete: (id: string, env: string, projectId?: string) =>
      `[${env}] Unable to delete block "${id}" in project ${projectId}`,
  },
  webhooks: {
    list: (env: string) => `[${env}] Webhook subscriptions:`,
    noList: (env: string) => `[${env}] Cannot retrieve webhook subscriptions`,
    created: (env: string, name: string) =>
      `[${env}] Created Webhook subscription "${name}"`,
    failedCreate: (env: string, name: string) =>
      `[${env}] Unable to create Webhook subscription "${name}"`,
    deleted: (env: string, id: string) =>
      `[${env}] Deleted Webhook subscription "${id}"`,
    failedDelete: (env: string, id: string) =>
      `[${env}] Unable to delete Webhook subscription "${id}"`,
  },
};
