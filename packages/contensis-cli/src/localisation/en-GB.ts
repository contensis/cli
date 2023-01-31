import {
  BlockActionType,
  BlockRunningStatus,
  MigrateModelsResult,
  MigrateStatus,
} from 'migratortron';
import { Logger } from '~/util/logger';

export const LogMessages = {
  app: {
    contensis: () => 'Contensis',
    quit: () => `Goodbye 👋\n`,
    startup: (version: string) =>
      `v${version} © 2001-${new Date().getFullYear()} Zengenti 🇬🇧. \n - Creators of Contensis and purveyors of other fine software\n\n👋 Welcome to the contensis-cli\n`,
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
    set: (projectId: string) =>
      `Current project is set to ${Logger.highlightText(projectId)}`,
    failedSet: (projectId: string) =>
      `Project ${Logger.highlightText(projectId)} not found`,
    tip: () =>
      `You need to set your current working project with "set project {projectId}"`,
    created: (env: string, id: string) =>
      `[${env}] Created project ${Logger.highlightText(id)}`,
    failedCreate: (env: string, id: string) =>
      `[${env}] Unable to create project ${Logger.highlightText(id)}`,
    updated: (env: string, id: string) =>
      `[${env}] Updated project ${Logger.highlightText(id)}`,
    failedUpdate: (env: string, id: string) =>
      `[${env}] Unable to update project ${Logger.highlightText(id)}`,
  },
  migrate: {
    models: {
      result: (
        status: keyof MigrateModelsResult['project']['contentTypes']
      ) => {
        switch (status) {
          case 'created':
          case 'updated':
            return Logger.successText;
          case 'errors':
            return Logger.errorText;
          default:
            return Logger.infoText;
        }
      },
    },
    status: (status: MigrateStatus) => {
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
  },
  models: {
    list: (projectId: string) =>
      `Content models in ${Logger.highlightText(projectId)}:`,
    noList: (projectId: string) =>
      `[${projectId}] Cannot retrieve content models`,
    get: (projectId: string, id: string) =>
      `[${projectId}] Content models ${Logger.infoText(`[ ${id} ]`)}`,
    failedGet: (projectId: string, id: string) =>
      `[${projectId}] Unable to get content models ${Logger.highlightText(id)}`,
  },
  contenttypes: {
    list: (projectId: string) =>
      `Content types in ${Logger.highlightText(projectId)}:`,
    get: (projectId: string, id: string) =>
      `[${projectId}] Content type ${Logger.highlightText(id)}`,
    failedGet: (projectId: string, id: string) =>
      `[${projectId}] Unable to get content type ${Logger.highlightText(id)}`,
    created: (projectId: string, id: string, status?: string) =>
      `[${projectId}] Content type ${status}d ${Logger.highlightText(id)}`,
    removed: (env: string, id: string, commit: boolean) =>
      `[${env}] ${
        commit ? `Deleted` : `Will delete`
      } content type ${Logger.highlightText(id)}`,
    failedRemove: (env: string, id: string) =>
      `[${env}] Unable to delete content type ${Logger.highlightText(id)}`,
  },
  components: {
    list: (projectId: string) =>
      `Components in ${Logger.highlightText(projectId)}:`,
    get: (projectId: string, id: string) =>
      `[${projectId}] Component ${Logger.highlightText(id)}`,
    failedGet: (projectId: string, id: string) =>
      `[${projectId}] Unable to get component ${Logger.highlightText(id)}`,
    created: (projectId: string, id: string, status?: string) =>
      `[${projectId}] Component ${status}d ${Logger.highlightText(id)}`,
    removed: (env: string, id: string, commit: boolean) =>
      `[${env}] ${
        commit ? `Deleted` : `Will delete`
      } component ${Logger.highlightText(id)}`,
    failedRemove: (env: string, id: string) =>
      `[${env}] Unable to delete component ${Logger.highlightText(id)}`,
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
    imported: (env: string, commit: boolean, count: number) =>
      `[${env}] ${commit ? `Imported` : `Will import`} ${count} entries`,
    failedImport: (env: string) => `[${env}] Unable to import entries`,
    removed: (env: string, commit: boolean) =>
      `[${env}] ${commit ? `Deleted` : `Will delete`} entries`,
    failedRemove: (env: string) => `[${env}] Unable to delete entries`,
    notFound: (env: string) => `[${env}] Entries were not found`,
    commitTip: () => `Add --commit flag to commit the previewed changes`,
  },
  keys: {
    list: (env: string) => `[${env}] API keys:`,
    noList: (env: string) => `[${env}] Cannot retrieve API keys`,
    created: (env: string, name: string) =>
      `[${env}] Created API key ${Logger.highlightText(name)}`,
    tip: () =>
      `Assign your new key to a role with "set role assignments", or create a new role with "create role"`,
    failedCreate: (env: string, name: string) =>
      `[${env}] Unable to create API key ${Logger.highlightText(name)}`,
    removed: (env: string, id: string) =>
      `[${env}] Deleted API key ${Logger.highlightText(id)}`,
    failedRemove: (env: string, id: string) =>
      `[${env}] Unable to delete API key ${Logger.highlightText(id)}`,
  },
  proxies: {
    list: (env: string, projectId: string | undefined) =>
      `[${env}] Retrieved proxies in project ${projectId}:`,
    noList: (env: string, projectId: string | undefined) =>
      `[${env}] Cannot retrieve proxies in project ${projectId}`,
    // noneExist: () => `Create a role with "create renderer"`,
    failedGet: (env: string, name: string, projectId: string) =>
      `[${env}] Unable to find proxy ${Logger.highlightText(
        name
      )} in project ${projectId}`,
    created: (env: string, name: string, projectId: string) =>
      `[${env}] Created proxy ${Logger.highlightText(
        name
      )} in project ${projectId}\n`,
    failedCreate: (env: string, name: string, projectId: string) =>
      `[${env}] Unable to create proxy ${Logger.highlightText(
        name
      )} in project ${projectId}`,
    setPayload: () => `Updating proxy with details\n`,
    set: () => `Succesfully updated proxy\n`,
    failedSet: (env: string, name: string, projectId: string) =>
      `[${env}] Unable to update proxy ${Logger.highlightText(
        name
      )} in project ${projectId}`,
    removed: (env: string, id: string, projectId: string) =>
      `[${env}] Deleted proxy ${Logger.highlightText(
        id
      )} in project ${projectId}\n`,
    failedRemove: (env: string, id: string, projectId: string) =>
      `[${env}] Unable to delete proxy ${Logger.highlightText(
        id
      )} in project ${projectId}`,
  },
  renderers: {
    list: (env: string, projectId: string | undefined) =>
      `[${env}] Retrieved renderers in project ${projectId}:`,
    noList: (env: string, projectId: string | undefined) =>
      `[${env}] Cannot retrieve renderers in project ${projectId}`,
    // noneExist: () => `Create a role with "create renderer"`,
    failedGet: (env: string, name: string, projectId: string) =>
      `[${env}] Unable to find renderer ${Logger.highlightText(
        name
      )} in project ${projectId}`,
    created: (env: string, name: string, projectId: string) =>
      `[${env}] Created renderer ${Logger.highlightText(
        name
      )} in project ${projectId}\n`,
    failedCreate: (env: string, name: string, projectId: string) =>
      `[${env}] Unable to create renderer ${Logger.highlightText(
        name
      )} in project ${projectId}`,
    setPayload: () => `Updating renderer with details\n`,
    set: () => `Succesfully updated renderer\n`,
    failedSet: (env: string, name: string, projectId: string) =>
      `[${env}] Unable to update renderer ${Logger.highlightText(
        name
      )} in project ${projectId}`,
    removed: (env: string, id: string, projectId: string) =>
      `[${env}] Deleted renderer ${Logger.highlightText(
        id
      )} in project ${projectId}\n`,
    failedRemove: (env: string, id: string, projectId: string) =>
      `[${env}] Unable to delete renderer ${Logger.highlightText(
        id
      )} in project ${projectId}`,
  },
  roles: {
    list: (env: string) => `[${env}] Retrieved roles`,
    noList: (env: string) => `[${env}] Cannot retrieve roles`,
    noneExist: () => `Create a role with "create role"`,
    failedGet: (env: string, name: string) =>
      `[${env}] Unable to find role ${Logger.highlightText(name)}`,
    created: (env: string, name: string) =>
      `[${env}] Created role ${Logger.highlightText(name)}\n`,
    tip: () =>
      `Give access to your role with "set role assignments", allow your role to do things with "set role permissions"`,
    failedCreate: (env: string, name: string) =>
      `[${env}] Unable to create role ${Logger.highlightText(name)}`,
    setPayload: () => `Updating role with details\n`,
    set: () => `Succesfully updated role\n`,
    failedSet: (env: string, name: string) =>
      `[${env}] Unable to update role ${Logger.highlightText(name)}`,
    removed: (env: string, id: string) =>
      `[${env}] Deleted role ${Logger.highlightText(id)}\n`,
    failedRemove: (env: string, id: string) =>
      `[${env}] Unable to delete role ${Logger.highlightText(id)}`,
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
      `[${env}] Requesting logs from block ${Logger.highlightText(
        id
      )} in branch ${branch} in project ${projectId}`,
    failedGetLogs: (id: string, env: string, projectId?: string) =>
      `[${env}] Unable to fetch block logs for ${Logger.highlightText(
        id
      )} in project ${projectId}`,
    tryPush: (id: string, branch: string, env: string, projectId?: string) =>
      `[${env}] Request to push block ${Logger.highlightText(
        id
      )} in branch ${branch} in project ${projectId}`,
    pushed: (id: string, branch: string, env: string, projectId?: string) =>
      `[${env}] Pushed block ${Logger.highlightText(
        id
      )} in branch ${branch} in project ${projectId}`,
    failedPush: (id: string, env: string, projectId?: string) =>
      `[${env}] Unable to push block ${Logger.highlightText(
        id
      )} in project ${projectId}`,
    latestVersion: (
      version: string,
      id: string,
      env: string,
      projectId?: string
    ) =>
      `[${env}] Found latest block version ${Logger.highlightText(
        id
      )} in project ${projectId} ${Logger.highlightText(version)}`,
    failedParsingVersion: () =>
      `Did not find a "version.versionNo" in response`,
    actionComplete: (
      action: BlockActionType,
      id: string,
      env: string,
      projectId?: string
    ) =>
      `[${env}] Action ${Logger.highlightText(
        action
      )} on ${Logger.highlightText(
        id
      )} in project ${projectId} requested successfully`,
    actionFailed: (
      action: BlockActionType,
      id: string,
      env: string,
      projectId?: string
    ) =>
      `[${env}] Problem executing ${action} on block ${Logger.highlightText(
        id
      )} in project ${projectId}`,
    deleted: (id: string, env: string, projectId?: string) =>
      `[${env}] Deleted block ${Logger.highlightText(
        id
      )} in project ${projectId}`,
    failedDelete: (id: string, env: string, projectId?: string) =>
      `[${env}] Unable to delete block ${Logger.highlightText(
        id
      )} in project ${projectId}`,
  },
  webhooks: {
    list: (env: string) => `[${env}] Webhook subscriptions:`,
    noList: (env: string) => `[${env}] Cannot retrieve webhook subscriptions`,
    noneExist: () => `No webhook subscriptions exist`,
    created: (env: string, name: string) =>
      `[${env}] Created Webhook subscription ${Logger.highlightText(name)}`,
    failedCreate: (env: string, name: string) =>
      `[${env}] Unable to create Webhook subscription ${Logger.highlightText(
        name
      )}`,
    deleted: (env: string, id: string) =>
      `[${env}] Deleted Webhook subscription ${Logger.highlightText(id)}`,
    failedDelete: (env: string, id: string) =>
      `[${env}] Unable to delete Webhook subscription ${Logger.highlightText(
        id
      )}`,
  },
};
