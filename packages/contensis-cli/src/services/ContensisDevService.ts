import ansiEscapes from 'ansi-escapes';
import to from 'await-to-js';
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';

import { Role } from 'contensis-management-api/lib/models';
import { MigrateRequest } from 'migratortron';

import ContensisRole from './ContensisRoleService';
import { createRequestHandler } from '~/factories/RequestHandlerFactory';
import { OutputOptionsConstructorArg } from '~/models/CliService';
import { EnvContentsToAdd } from '~/models/DevService';
import { mapCIWorkflowContent } from '~/mappers/DevInit-to-CIWorkflow';
import RequestHandlerArgs from '~/mappers/DevRequests-to-RequestHanderCliArgs';
import { deployKeyRole } from '~/mappers/DevInit-to-RolePermissions';
import { readFile, writeFile } from '~/providers/file-provider';
import { diffFileContent } from '~/util/diff';
import { mergeDotEnvFileContents } from '~/util/dotenv';
import { findByIdOrName } from '~/util/find';
import { GitHelper } from '~/util/git';
import { jsonFormatter } from '~/util/json.formatter';
import { winSlash } from '~/util/os';
import { mergeContentsToAddWithGitignore } from '~/util/gitignore';

class ContensisDev extends ContensisRole {
  git!: GitHelper;
  blockId!: string;

  deployCredentials = {
    clientId: '',
    clientSecret: '',
  };

  constructor(
    args: string[],
    outputOpts?: OutputOptionsConstructorArg,
    contensisOpts: Partial<MigrateRequest> = {}
  ) {
    super(args, outputOpts, contensisOpts);
  }

  DevelopmentInit = async (projectHome: string, opts: any) => {
    // Retrieve git info
    const git = (this.git = new GitHelper(projectHome));
    // Check if we are in a git repo
    const isRepo = git.checkIsRepo();
    if (!isRepo) return;

    const { dryRun = false } = opts || {};
    const { currentEnv, currentProject, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // First we need to get the block id from the user
      const validateBlockId = (blockId: string) => {
        const pattern = /^[0-9a-z](-?[0-9a-z])*$/;
        if (blockId.length >= 1 && blockId.length <= 225) {
          return pattern.test(blockId);
        } else return false;
      };
      const { blockId } = await inquirer.prompt({
        name: 'blockId',
        type: 'input',
        prefix: '🧱',
        message: messages.devinit.blockIdQuestion,
        validate: validateBlockId,
        default: git.name,
      });
      // make sure block id is lowercase
      this.blockId = blockId.toLowerCase();
      log.success(`Valid block id: ${blockId.toLowerCase()}`);

      // Retrieve keys list for env
      const [keysErr, apiKeys] = await contensis.apiKeys.GetKeys();
      if (keysErr) {
        log.error(messages.keys.noList(currentEnv));
        log.error(jsonFormatter(keysErr));
        return;
      }
      const apiKeyExists = (findKey: string) =>
        apiKeys?.find(
          k => k.name.trim().toLowerCase() === findKey?.trim().toLowerCase()
        );

      // Retrieve ci workflow info
      const workflowFiles = git.workflows;

      // Set variables for performing operations and logging etc.
      let ciFileName = git.ciFileName;

      const apiKeyName = `block-${currentProject}-${blockId}`.toLowerCase();

      const devKeyName = `${apiKeyName}`;
      const devKeyDescription = `Created by Contensis to allow API access from the running block`;
      let existingDevKey = apiKeyExists(devKeyName);

      const deployKeyName = `${apiKeyName}-ci`;
      const deployKeyDescription = `Created by the Contensis CLI for use in continuous integration`;

      let existingDeployKey = apiKeyExists(deployKeyName);

      // const blockId = git.name;
      const errors = [] as AppError[];

      // Start render console output
      log.raw('');
      log.success(messages.devinit.intro());
      log.raw(
        log.infoText(
          messages.devinit.projectDetails(
            git.name,
            currentEnv,
            currentProject,
            blockId,
            git
          )
        )
      );
      log.raw(
        log.infoText(
          messages.devinit.developmentKey(devKeyName, !!existingDevKey)
        )
      );
      log.raw(
        log.infoText(
          messages.devinit.deploymentKey(deployKeyName, !!existingDeployKey)
        )
      );
      log.raw('');

      if (Array.isArray(workflowFiles) && workflowFiles.length > 1) {
        // Choose GitHub workflow file (if multiple)
        ({ ciFileName } = await inquirer.prompt([
          {
            type: 'list',
            prefix: '⧰',
            message: messages.devinit.ciMultipleChoices(),
            name: 'ciFileName',
            choices: workflowFiles,
            default: workflowFiles.find(f => f.includes('docker')),
          },
        ]));
        log.raw('');
        git.ciFileName = ciFileName;
      }

      log.raw(log.infoText(messages.devinit.ciDetails(ciFileName)));

      // Location for Client ID / Secret.
      const { loc } = await inquirer.prompt({
        name: 'loc',
        type: 'list',
        prefix: '🔑',
        // Where would you like to store your client id/secret?
        message: messages.devinit.clientDetailsLocation(),
        choices: [
          {
            name: messages.devinit.clientDetailsInGit(git),
            value: 'git',
          },
          {
            name: messages.devinit.clientDetailsInEnv(),
            value: 'env',
          },
        ],
      });

      log.raw('');
      log.help(messages.devinit.ciIntro(git, loc));

      if (!dryRun) {
        // Confirm prompt
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            message: messages.devinit.confirm(),
            name: 'confirm',
            default: false,
          },
        ]);
        log.raw('');
        if (!confirm) return;
      }

      // Fetching access token
      let accessToken: string | undefined = undefined;

      const spinner = createSpinner(messages.devinit.accessTokenFetch());
      spinner.start();

      const token = await this.GetDeliveryApiKey();

      if (token) {
        accessToken = token;
        spinner.success({ text: messages.devinit.accessTokenSuccess(token) });
        log.raw('');
      } else {
        spinner.error();
        this.log.error(messages.devinit.accessTokenFailed());
        return;
      }

      // Magic happens...
      const checkpoint = (op: string) => {
        if (errors.length) throw errors[0];
        else log.debug(`${op} completed ok`);
        return true;
      };

      // Arrange API keys for development and deployment
      const [getRolesErr, roles] = await to(contensis.roles.GetRoles());
      if (!roles && getRolesErr) errors.push(getRolesErr);
      checkpoint(`fetched ${roles?.length} roles`);

      if (dryRun) {
        checkpoint(`skip api key creation (dry-run)`);
      } else {
        // if dev api key doesn't exist go and create it (we need this for local development, we will store these details in the .env file).
        const devKeyExisted = !!existingDevKey;
        if (!existingDevKey) {
          existingDevKey = await this.CreateOrUpdateApiKey(
            existingDevKey,
            devKeyName,
            devKeyDescription
          );
          log.success(messages.devinit.createDevKey(devKeyName, devKeyExisted));
        }
        // NF 24/11/23 Added this commented code back in as we are not assigning the dev key to any role here
        // // Ensure dev API key is assigned to a role
        // let existingDevRole = findByIdOrName(roles || [], devKeyName, true) as
        //   | Role
        //   | undefined;
        // existingDevRole = await this.CreateOrUpdateRole(
        //   existingDevRole,
        //   devKeyRole(devKeyName, devKeyDescription)
        // );
        // checkpoint('dev key role assigned');

        // if deploy api key doesn't exist go and create it (we need this for yml file).
        const deployKeyExisted = !!existingDeployKey;
        if (!existingDeployKey) {
          existingDeployKey = await this.CreateOrUpdateApiKey(
            existingDeployKey,
            deployKeyName,
            deployKeyDescription
          );
        }

        // check we have the deploy key so we can assign them to this values
        if (existingDeployKey) {
          // Add client id and secret to credentials
          this.deployCredentials.clientId = existingDeployKey?.id;
          this.deployCredentials.clientSecret = existingDeployKey?.sharedSecret;
        }

        // Ensure deploy API key is assigned to a role with the right permissions
        const deployRoleName = `Role for CI push of block '${blockId}'`;
        const deplyRoleDescription = `Created by the Contensis CLI for use in continuous integration`;
        let existingDeployRole = findByIdOrName(
          roles || [],
          deployRoleName,
          true
        ) as Role | undefined;
        existingDeployRole = await this.CreateOrUpdateRole(
          existingDeployRole,
          deployKeyRole(deployKeyName, deployRoleName, deplyRoleDescription)
        );

        checkpoint('deploy key role assigned');
        log.success(
          messages.devinit.createDeployKey(deployRoleName, deployKeyExisted)
        );
        checkpoint('api keys done');
      }

      const envFilePath = `${projectHome}/.env`;
      const existingEnvFile = readFile(envFilePath);
      const existingEnvFileArray = (existingEnvFile || '')
        .split('\n')
        .filter(l => !!l);

      // Update or create a file called .env in project home
      const envContentsToAdd: EnvContentsToAdd = {
        ALIAS: currentEnv,
        PROJECT_API_ID: currentProject,
        BLOCK_ID: blockId,
      };
      if (accessToken) envContentsToAdd['ACCESS_TOKEN'] = accessToken;
      // add client id and secret to the env file
      if (loc === 'env') {
        envContentsToAdd['CONTENSIS_CLIENT_ID'] =
          existingDevKey?.id || messages.devinit.dryRunKeyMessage(dryRun);
        envContentsToAdd['CONTENSIS_CLIENT_SECRET'] =
          existingDevKey?.sharedSecret ||
          messages.devinit.dryRunKeyMessage(dryRun);
      }

      // if we have client id / secret in our env remove it
      const removeEnvItems = (items: string[]) => {
        const indexesToRemove = [];

        for (let i = 0; i < existingEnvFileArray.length; i++) {
          for (const item of items) {
            if (existingEnvFileArray[i].includes(item)) {
              indexesToRemove.push(i);
              break;
            }
          }
        }

        for (let i = indexesToRemove.length - 1; i >= 0; i--) {
          existingEnvFileArray.splice(indexesToRemove[i], 1);
        }
      };

      // remove client id and secret from env file
      if (loc === 'git') {
        removeEnvItems(['CONTENSIS_CLIENT_ID', 'CONTENSIS_CLIENT_SECRET']);
      }

      const envFileLines = mergeDotEnvFileContents(
        existingEnvFileArray,
        envContentsToAdd
      );
      const newEnvFileContent = envFileLines.join('\n');
      const envDiff = diffFileContent(existingEnvFile || '', newEnvFileContent);

      if (dryRun) {
        if (envDiff) {
          log.info(`Updating .env file ${winSlash(envFilePath)}:\n${envDiff}`);
          log.raw('');
        }
        checkpoint('skip .env file update (dry-run)');
      } else {
        if (envDiff) log.info(`Updating .env file ${winSlash(envFilePath)}`);
        writeFile(envFilePath, envFileLines.join('\n'));
        checkpoint('.env file updated');
        log.success(messages.devinit.writeEnvFile());
        // log.help(messages.devinit.useEnvFileTip());
      }

      // Update git ignore
      if (dryRun) {
        checkpoint('skip .gitignore file update (dry-run)');
      } else {
        mergeContentsToAddWithGitignore(`${projectHome}/.gitignore`, ['.env']);
        log.raw('');
      }

      // Update CI Workflow
      const mappedWorkflow = await mapCIWorkflowContent(this, loc);

      // Update CI file -- different for GH/GL
      if (mappedWorkflow?.diff) {
        log.info(
          `Updating ${winSlash(ciFileName)} file:\n${mappedWorkflow.diff}`
        );
        log.raw('');
      }
      if (dryRun) {
        checkpoint('skip CI file update (dry-run)');
        //log.object(ciFileLines);
      } else {
        if (mappedWorkflow?.newWorkflow) {
          if (mappedWorkflow?.diff) {
            writeFile(git.ciFilePath, mappedWorkflow.newWorkflow);
            log.success(messages.devinit.writeCiFile(`./${ciFileName}`));
            log.info(
              messages.devinit.ciBlockTip(blockId, currentEnv, currentProject)
            );
          } else {
            log.info(messages.devinit.ciFileNoChanges(`./${ciFileName}`));
          }
          log.raw('');
          checkpoint('CI file updated');
        }
      }

      if (loc === 'git') {
        // Echo Deployment API key to console, ask user to add secrets to repo
        log.warning(messages.devinit.addGitSecretsIntro());
        log.help(
          messages.devinit.addGitSecretsHelp(
            git,
            existingDeployKey?.id || messages.devinit.dryRunKeyMessage(dryRun),
            existingDeployKey?.sharedSecret ||
              messages.devinit.dryRunKeyMessage(dryRun)
          )
        );
      }

      if (dryRun) {
        log.success(messages.devinit.dryRun());
        log.help(messages.devinit.noChanges());
      } else {
        log.success(messages.devinit.success());
        log.help(messages.devinit.startProjectTip());
        // open the cms link -- if no classic token just return the cms url

        // go and fetch the classic token from auth service
        const classicToken = await this.auth?.ClassicToken();
        log.help(
          ansiEscapes.link(
            `Open Contensis`,
            `${this.urls?.cms}${
              classicToken ? `?SecurityToken=${classicToken}` : ''
            }`
          )
        );
      }
    }
  };

  ExecRequestHandler = async (
    blockId: string[],
    overrideArgs: string[] = [],
    version?: string
  ) => {
    const { debug, log, messages } = this;

    const spinner = !debug
      ? createSpinner(messages.devrequests.launch())
      : log.info(messages.devrequests.launch());

    // Ensure request handler is available to use
    const requestHandler = await createRequestHandler(version);

    // Generate args for request handler using CLI methods
    const args = new RequestHandlerArgs(this);
    spinner?.start();
    await args.Create();
    spinner?.success();

    // Prompt block id and dev uri to run locally (if not supplied)
    const blockIdChoices = args.siteConfig?.blocks.map(block => block.id) || [];
    blockIdChoices.push('none');
    const defaultDeveloperUri = 'http://localhost:3000';

    const { overrideBlockId, overrideUri } = blockId.length
      ? {
          overrideBlockId: blockId[0],
          overrideUri: blockId?.[1] || defaultDeveloperUri,
        }
      : await inquirer.prompt([
          {
            type: 'list',
            prefix: '🧱',
            message: messages.devrequests.overrideBlock(),
            name: 'overrideBlockId',
            choices: blockIdChoices,
          },
          {
            type: 'input',
            prefix: '🔗',
            message: messages.devrequests.overrideUri(),
            name: 'overrideUri',
            default: defaultDeveloperUri,
          },
        ]);

    args.overrideBlock(overrideBlockId, overrideUri);

    // Launch request handler
    await requestHandler(args.getArgs(overrideArgs));
  };
}
export const devCommand = (
  commandArgs: string[],
  outputOpts: OutputOptionsConstructorArg,
  contensisOpts: Partial<MigrateRequest> = {}
) => {
  return new ContensisDev(['', '', ...commandArgs], outputOpts, contensisOpts);
};

export default ContensisDev;
