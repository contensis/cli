import to from 'await-to-js';
import { spawn } from 'child_process';
import inquirer from 'inquirer';
import path from 'path';

import { Role } from 'contensis-management-api/lib/models';
import { MigrateRequest } from 'migratortron';

import ContensisRole from './ContensisRoleService';
import { OutputOptionsConstructorArg } from '~/models/CliService';
import { EnvContentsToAdd } from '~/models/DevService';
import { mapSiteConfigYaml } from '~/mappers/DevRequests-to-RequestHanderSiteConfigYaml';
import { mapCIWorkflowContent } from '~/mappers/DevInit-to-CIWorkflow';
import {
  deployKeyRole,
  devKeyRole,
} from '~/mappers/DevInit-to-RolePermissions';
import { appRootDir, readFile, writeFile } from '~/providers/file-provider';
import { diffFileContent } from '~/util/diff';
import { mergeDotEnvFileContents } from '~/util/dotenv';
import { findByIdOrName } from '~/util/find';
import { GitHelper } from '~/util/git';
import { jsonFormatter } from '~/util/json.formatter';
import { winSlash } from '~/util/os';
import { stringifyYaml } from '~/util/yaml';
import { createSpinner } from 'nanospinner';
import { mergeContentsToAddWithGitignore } from '~/util/gitignore';

class ContensisDev extends ContensisRole {
  git!: GitHelper;
  blockId: string;

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
        const pattern = /^[a-z-]*$/;
        if (typeof blockId === 'string' && blockId.length >= 3) {
          return pattern.test(blockId);
        } else return false;
      };
      let { blockId } = await inquirer.prompt({
        name: 'blockId',
        type: 'input',
        prefix: '🧱',
        message: messages.devinit.blockIdQuestion,
        validate: validateBlockId,
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

      const devKeyName = `${blockId} development`;
      const devKeyDescription = `${blockId} [contensis-cli]`;
      let existingDevKey = apiKeyExists(devKeyName);

      // if dev api key doesn't exisit go and create it (we need this for local development, we will store these details in the .env file).
      if (!existingDevKey) {
        existingDevKey = await this.CreateOrUpdateApiKey(
          existingDevKey,
          devKeyName,
          devKeyDescription
        );
        log.success('Successfully created development key');
      }

      const deployKeyName = `${blockId} deployment`;
      const deployKeyDescription = `${blockId} deploy [contensis-cli]`;

      let existingDeployKey = apiKeyExists(deployKeyName);

      // if deploy api key doesn't exisit go and create it (we need this for yml file).
      if (!existingDeployKey) {
        existingDeployKey = await this.CreateOrUpdateApiKey(
          existingDeployKey,
          deployKeyName,
          deployKeyDescription
        );
        log.success('Successfully created deploy key');
      }

      // check we have the deply key so we can assign them to this values
      if (existingDeployKey) {
        // Add client id and secret to global 'this'
        this.clientId = existingDeployKey?.id;
        this.clientSecret = existingDeployKey?.sharedSecret;
      }

      // const blockId = git.name;
      const errors = [] as AppError[];

      // Start render console output
      log.raw('');
      log.success(messages.devinit.intro());
      log.raw('');
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

      let mappedWorkflow;
      // Location for Client ID / Secret.
      const { clientDetailsOption } = await inquirer.prompt({
        name: 'clientDetailsOption',
        type: 'list',
        prefix: '🔑',
        // Where would you like to store your Client ID/Secret?
        message: messages.devinit.clientDetailsLocation(),
        choices: [
          messages.devinit.clientDetailsInGit(git),
          messages.devinit.clientDetailsInEnv(),
        ],
      });

      // global 'clientDetailsLocation' variable stores users input on where client id / secert are stored
      if (clientDetailsOption === messages.devinit.clientDetailsInEnv()) {
        this.clientDetailsLocation = 'env';
      } else {
        this.clientDetailsLocation = 'git';
      }

      if (this.clientDetailsLocation === 'env') {
        // Update CI Workflow to pull from ENV variables
        mappedWorkflow = await mapCIWorkflowContent(this);
        log.help(messages.devinit.ciIntro(git, 'env'));
      } else {
        // Look at the workflow file content and make updates
        mappedWorkflow = await mapCIWorkflowContent(this);
        log.help(messages.devinit.ciIntro(git, 'git'));
      }

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
      log.raw('');

      const spinner = createSpinner(messages.devinit.accessTokenFetch());
      spinner.start();

      const token = await this.GetDeliveryApiKey();

      if (token) {
        spinner.success();
        this.log.success(messages.devinit.accessTokenSuccess(token));
        accessToken = token;
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
        // Ensure deploy API key is assigned to a role with the right permissions
        let existingDeployRole = findByIdOrName(
          roles || [],
          deployKeyName,
          true
        ) as Role | undefined;
        existingDeployRole = await this.CreateOrUpdateRole(
          existingDeployRole,
          deployKeyRole(deployKeyName, deployKeyDescription)
        );

        checkpoint('deploy key role assigned');
        log.success(messages.devinit.createDeployKey(deployKeyName, true));
        checkpoint('api keys done');
      }

      const envFilePath = `${projectHome}/.env`;
      const existingEnvFile = readFile(envFilePath);
      let existingEnvFileArray = (existingEnvFile || '')
        .split('\n')
        .filter(l => !!l);

      // Update or create a file called .env in project home
      const envContentsToAdd: EnvContentsToAdd = {
        ALIAS: currentEnv,
        PROJECT: currentProject,
        BLOCK_ID: blockId,
      };
      if (accessToken) envContentsToAdd['ACCESS_TOKEN'] = accessToken;
      // add client id and secret to the env file
      if (this.clientDetailsLocation === 'env') {
        envContentsToAdd['CONTENSIS_CLIENT_ID'] = existingDevKey?.id;
        envContentsToAdd['CONTENSIS_CLIENT_SECRET'] =
          existingDevKey?.sharedSecret;
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

      if (this.clientDetailsLocation === 'git') {
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
        if (envDiff) log.info(`updating .env file ${winSlash(envFilePath)}`);
        writeFile(envFilePath, envFileLines.join('\n'));
        checkpoint('.env file updated');
        log.success(messages.devinit.writeEnvFile());
        // log.help(messages.devinit.useEnvFileTip());
      }

      // Update git ignore
      const gitIgnorePath = `${projectHome}/.gitignore`;
      const gitIgnoreContentsToAdd = ['.env'];
      mergeContentsToAddWithGitignore(gitIgnorePath, gitIgnoreContentsToAdd);

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
          checkpoint('CI file updated');
        }
      }

      if (this.clientDetailsLocation === 'git') {
        // Echo Deployment API key to console, ask user to add secrets to repo
        log.warning(messages.devinit.addGitSecretsIntro());
        log.help(
          messages.devinit.addGitSecretsHelp(
            git,
            existingDeployKey?.id,
            existingDeployKey?.sharedSecret
          )
        );
      }

      if (dryRun) {
        log.success(messages.devinit.dryRun());
        log.help(messages.devinit.noChanges());
      } else {
        log.success(messages.devinit.success());
        log.help(messages.devinit.startProjectTip());
      }
    }
  };

  ExecRequestHandler = async (blockIds: string[], overrideArgs?: string[]) => {
    // if no request handler exe
    // download it.

    // if update arg, redownload it

    const { log } = this;
    // const getPrefixOld = log.getPrefix;
    const exeHome = path.join(appRootDir, 'reqhan');
    const exe = 'Zengenti.Contensis.RequestHandler.LocalDevelopment';
    const exePath = path.join(exeHome, exe);
    const siteConfigPath = path.join(appRootDir, 'site_config.yaml');

    const siteConfig = await mapSiteConfigYaml(this);
    writeFile('site_config.yaml', stringifyYaml(siteConfig));

    const args = overrideArgs
      ? typeof overrideArgs?.[0] === 'string' &&
        overrideArgs[0].includes(' ', 2)
        ? overrideArgs[0].split(' ')
        : overrideArgs
      : []; // args could be [ '-c .\\site_config.yaml' ] or [ '-c', '.\\site_config.yaml' ]

    // Add required args
    if (!args.find(a => a === '-c')) args.push('-c', siteConfigPath);

    // const child = execFile(exePath, args);

    const child = spawn(exePath, args, { stdio: 'inherit' });

    // log.raw('');
    log.info(`Launching request handler...`);
    if (overrideArgs?.length)
      this.log.warning(
        `Spawning process with supplied args: ${JSON.stringify(
          child.spawnargs,
          null,
          2
        )}`
      );

    let isRunning = false;

    // Log child output through event listeners
    child?.stdout?.on('data', data => {
      isRunning = true;
      log.raw(data);
    });

    child?.stderr?.on('data', data => {
      log.error(data);
    });

    child.on('spawn', () => {
      isRunning = true;
      log.help(
        `You may see a firewall popup requesting network access, it is safe to approve`
      );
      // log.getPrefix = () => Logger.infoText(`[rqh]`);
    });

    child.on('exit', code => {
      isRunning = false;

      log[code === 0 ? 'success' : 'warning'](
        `Request handler exited with code ${code}\n`
      );
    });

    child.on('error', error => {
      isRunning = false;
      log.error(`Could not launch request handler due to error \n${error}`);
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // keep the method running until we can return
    while (true === true) {
      if (!isRunning) {
        // log.getPrefix = getPrefixOld; // restore logger state
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
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
