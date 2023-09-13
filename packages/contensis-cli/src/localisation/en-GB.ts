import {
  BlockActionType,
  BlockRunningStatus,
  MigrateModelsResult,
  MigrateStatus,
} from 'migratortron';
import { GitHelper } from '~/util/git';
import { Logger } from '~/util/logger';
import { winSlash } from '~/util/os';

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
  nodes: {
    imported: (env: string, commit: boolean, count: number) =>
      `[${env}] ${commit ? `Imported` : `Will import`} ${count} nodes`,
    failedImport: (env: string) => `[${env}] Unable to import nodes`,
    removed: (env: string, commit: boolean) =>
      `[${env}] ${commit ? `Deleted` : `Will delete`} nodes`,
    failedRemove: (env: string) => `[${env}] Unable to delete nodes`,
    notFound: (env: string) => `[${env}] Nodes were not found `,
    commitTip: () => `Add --commit flag to commit the previewed changes`,
    failedGet: (projectId: string) =>
      `[${projectId}] Cannot retrieve nodes from Site view`,
    get: (projectId: string, root: string, depth: number) =>
      `[${projectId}] Site view nodes at: ${Logger.highlightText(root)}${
        depth ? ` to a depth of ${depth}` : ``
      }\n`,
    noChange: (env: string) => `[${env}] No changes to be made`,
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
    failedUpdate: (env: string, name: string) =>
      `[${env}] Unable to update API key ${Logger.highlightText(name)}`,
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
    failedCreate: (env: string, name?: string) =>
      `[${env}] Unable to create role ${Logger.highlightText(name)}`,
    setPayload: () => `Updating role with details\n`,
    set: () => `Succesfully updated role\n`,
    failedSet: (env: string, name?: string) =>
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
    stopFollow: (id: string, env: string, projectId?: string) =>
      `[${env}]\n\n 👌 stop fetching new ${Logger.highlightText(
        id
      )} logs in project ${projectId}`,
    timeoutFollow: (id: string, env: string, projectId?: string) =>
      `[${env}]\n\n 🤏 pausing fetching new ${Logger.highlightText(
        id
      )} logs in project ${projectId} due to too many requests`,
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
  devinit: {
    intro: () => `Contensis developer environment initialisation`,
    //`This will initialise your local working directory to develop with the current connected Contensis project`,
    projectDetails: (
      name: string,
      env: string,
      projectId: string,
      git: GitHelper
    ) =>
      `Project: ${Logger.highlightText(name)} set arg --name to override
  - Home: ${Logger.standardText(process.cwd())}
  - Repository: ${git.home} 
    
Connect to Contensis instance: ${Logger.standardText(env)}
  - Project id: ${Logger.standardText(projectId)}`,
    developmentKey: (name: string, existing: boolean) =>
      `  - ${
        !existing ? 'Create development API key' : 'Development API key found'
      }: ${Logger[!existing ? 'highlightText' : 'standardText'](name)}`,
    deploymentKey: (name: string, existing: boolean) =>
      `  - ${
        !existing ? 'Create deployment API key' : 'Deployment API key found'
      }: ${Logger[!existing ? 'highlightText' : 'standardText'](name)}`,
    ciIntro: (git: GitHelper, location: 'git' | 'env') =>
      `We will create API keys with permissions to use this project with Contensis, and add a job to your CI that will deploy a container build.
      ${
        location === 'git'
          ? `We will ask you to add secrets/variables to your git repository to give your workflow permission to push a Block to Contensis.
      ${Logger.infoText(`You could visit ${git.secretsUri} to check that you can see repository settings, 
      a page not found generally indicates you need to ask the repo owner for permission to add repository secrets, 
      or ask the repo owner to add these secrets for you.`)}`
          : ''
      }`,
    ciDetails: (filename: string) =>
      `Add push-block job to CI file: ${Logger.highlightText(filename)}\n`,
    ciMultipleChoices: () =>
      `Multiple GitHub workflow files found\n${Logger.infoText(
        `Tell us which GitHub workflow builds a container image after each push:`
      )}`,
    ciMultipleBuildJobChoices: () =>
      `Multiple build jobs found in workflow\n${Logger.infoText(
        `Choose the build job that produces a fresh container image to push to a block:`
      )}`,
    ciMultipleJobChoices: () =>
      `Other jobs found in workflow\n${Logger.infoText(
        `Choose the job that produces a fresh container image we can push to a block:`
      )}`,
    ciMultipleAppImageVarChoices: () =>
      `Do one of these variables point to your tagged app image?\n${Logger.infoText(
        `we have included a default choice - ensure your build image is tagged exactly the same as this`
      )}`,
    ciEnterOwnAppImagePrompt: (git: GitHelper) =>
      `Tell us the registry uri your app image is tagged and pushed with (⏎ accept default) \n${Logger.infoText(
        `Tip: ${
          git.type === 'github'
            ? `GitHub context variables available\nhttps://docs.github.com/en/actions/learn-github-actions/variables#using-contexts-to-access-variable-values`
            : `GitLab CI/CD variables available\nhttps://docs.gitlab.com/ee/ci/variables/`
        }`
      )}\n`,
    confirm: () =>
      `Confirm these details are correct so we can make changes to your project`,
    accessTokenPrompt: () =>
      ` To continue setting up we need permission to fetch your Delivery API token. (Press (Y + ⏎) to continue or (N + ⏎) to exit the set up process)`,
    createDevKey: (keyName: string, existing: boolean) =>
      `${
        !existing ? 'Created' : 'Checked permissions for'
      } development API key ${Logger.standardText(keyName)}`,
    createDeployKey: (keyName: string, existing: boolean) =>
      `${
        !existing ? 'Created' : 'Checked permissions for'
      } deployment API key ${Logger.standardText(keyName)}`,
    createKeyFail: (keyName: string, existing: boolean) =>
      `Failed to ${
        !existing ? 'create' : 'update'
      } API key ${Logger.highlightText(keyName)}`,
    writeEnvFile: () => `Written .env file to project home directory`,
    useEnvFileTip: () =>
      `You should alter existing project code that connects a Contensis client to use the variables from this file`,
    writeCiFile: (ciFilePath: string) =>
      `Updated CI file ${Logger.standardText(winSlash(ciFilePath))}`,
    ciFileNoChanges: (ciFilePath: string) =>
      `No updates needed for CI file ${Logger.standardText(
        winSlash(ciFilePath)
      )}`,
    ciBlockTip: (blockId: string, env: string, projectId: string) =>
      `A job is included to deploy your built container image to ${Logger.standardText(
        projectId
      )} at ${Logger.standardText(env)} in a block called ${Logger.standardText(
        blockId
      )}`,
    addGitSecretsIntro: () =>
      `We have created an API key that allows you to deploy your app image to a Contensis Block but we need you to add these details to your GitLab repository.`,
    addGitSecretsHelp: (git: GitHelper, id?: string, secret?: string) =>
      `Add secrets or variables in your repository's settings page\n\nGo to ${Logger.highlightText(
        git.secretsUri
      )}\n\n${
        git.type === 'github'
          ? `Add a "New repository secret"`
          : `Expand "Variables" and hit "Add variable"`
      }\n\n    ${
        git.type === 'github' ? `Secret name:` : `Key:`
      } ${Logger.highlightText(`CONTENSIS_CLIENT_ID`)}\n    ${
        git.type === 'github' ? `Secret:` : `Value:`
      } ${Logger.standardText(
        id
      )}\n\n ${`Add one more secret/variable to the repository`}\n\n    ${
        git.type === 'github' ? `Secret name:` : `Key:`
      } ${Logger.highlightText(`CONTENSIS_SHARED_SECRET`)}\n    ${
        git.type === 'github' ? `Secret:` : `Value:`
      } ${Logger.standardText(secret)}`,
    accessTokenFetch: () => `Please wait, fecthing Delivery API token ⏳`,
    accessTokenSuccess: (token: string) =>
      `Successfully fetched Delivery API token 👉 ${Logger.infoText(token)}`,
    accessTokenFailed: () =>
      `Something went wrong! If the problem persists, please contact our support team 🛟`,
    accessTokenPermission: () =>
      `We need permission to fetch your Delivery API token, please try again ⚠️`,
    clientDetailsLocation: () =>
      `Which option would you like to use for storing your client ID and secret`,
    clientDetailsInGit: (git: GitHelper) =>
      `${
        git.type === 'github' ? 'GitHub' : 'GitLab'
      } variables (recommended for public repositories)`,
    clientDetailsInEnv: () =>
      `.env file (recommended for private repositories)`,
    success: () => `Contensis developer environment initialisation complete`,
    partialSuccess: () =>
      `Contensis developer environment initialisation completed with errors`,
    failed: () => `Contensis developer environment initialisation failed`,
    dryRun: () =>
      `Contensis developer environment initialisation dry run completed`,
    noChanges: () =>
      `No changes were made to your project, run the command again without the ${Logger.highlightText(
        '--dry-run'
      )} flag to update your project with these changes`,
    startProjectTip: () =>
      `Start up your project in the normal way for development`,
  },
};
