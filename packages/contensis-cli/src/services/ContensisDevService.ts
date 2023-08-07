import to from 'await-to-js';
import { execFile, spawn } from 'child_process';
import inquirer from 'inquirer';
import path from 'path';
import { Entry, Role } from 'contensis-management-api/lib/models';

import { MigrateRequest } from 'migratortron';
import { stringify } from 'yaml';
import ContensisCli from './ContensisCliService';
import ContensisRole from './ContensisRoleService';
import { OutputOptionsConstructorArg } from '~/models/CliService';
import { mapSiteConfigYaml } from '~/mappers/ContensisCliService-to-RequestHanderSiteConfigYaml';
import { appRootDir, readFile, writeFile } from '~/providers/file-provider';
import { jsonFormatter } from '~/util/json.formatter';
import { GitHelper } from '~/util/git';
import { findByIdOrName } from '~/util/find';

class ContensisDev extends ContensisRole {
  constructor(
    args: string[],
    outputOpts?: OutputOptionsConstructorArg,
    contensisOpts: Partial<MigrateRequest> = {}
  ) {
    super(args, outputOpts, contensisOpts);
  }

  DevelopmentInit = async (projectHome: string, opts: any) => {
    const { dryRun = false } = opts || {};
    const { currentEnv, currentProject, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
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

      // Retrieve git info
      const git = new GitHelper(projectHome);

      // Retrieve ci workflow info
      const workflowFiles = git.workflows;

      // Set variables for performing operations and logging etc.
      let ciFileName = git.ciFileName;

      const devKeyName = `${git.name} development`;
      const devKeyDescription = `${git.name} [contensis-cli]`;
      const devKeyPermissions = { blocks: [] } as Partial<Role['permissions']>;
      let existingDevKey = apiKeyExists(devKeyName);

      const deployKeyName = `${git.name} deployment`;
      const deployKeyDescription = `${git.name} deploy [contensis-cli]`;
      const deployKeyPermissions = { blocks: ['push', 'release'] } as Partial<
        Role['permissions']
      >;
      let existingDeployKey = apiKeyExists(deployKeyName);

      const blockId = git.name;
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
            message: `Multiple GitHub workflow files found\n${log.infoText(
              `Tell us which GitHub workflow builds the container image after each push:`
            )}`,
            name: 'ciFileName',
            choices: workflowFiles,
            default: workflowFiles.find(f => f.includes('docker')),
          },
        ]));
        log.raw('');
      }

      log.raw(log.infoText(messages.devinit.ciDetails(ciFileName)));
      ylog.help(messages.devinit.ciIntro(git));

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

      // Access token prompt
      const { accessToken } = await inquirer.prompt([
        {
          type: 'input',
          message: messages.devinit.accessTokenPrompt(),
          name: 'accessToken',
        },
      ]);
      log.raw('');

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
        existingDevKey = await this.CreateOrUpdateApiKey(
          existingDevKey,
          devKeyName,
          devKeyDescription
        );
        checkpoint('dev key created');

        existingDeployKey = await this.CreateOrUpdateApiKey(
          existingDeployKey,
          deployKeyName,
          deployKeyDescription
        );
        checkpoint('deploy key created');

        // Ensure dev API key is assigned to a role
        let existingDevRole = findByIdOrName(roles || [], devKeyName, true) as
          | Role
          | undefined;
        existingDevRole = await this.CreateOrUpdateRole(
          existingDevRole,
          devKeyName,
          devKeyDescription,
          { apiKeys: [devKeyName] },
          devKeyPermissions
        );
        checkpoint('dev key role assigned');
        log.success(messages.devinit.createDevKey(devKeyName, true));

        // Ensure deploy API key is assigned to a role with the right permissions
        let existingDeployRole = findByIdOrName(
          roles || [],
          deployKeyName,
          true
        ) as Role | undefined;
        existingDeployRole = await this.CreateOrUpdateRole(
          existingDeployRole,
          deployKeyName,
          deployKeyDescription,
          { apiKeys: [deployKeyName] },
          deployKeyPermissions
        );

        checkpoint('deploy key role assigned');
        log.success(messages.devinit.createDeployKey(deployKeyName, true));
        checkpoint('api keys done');
      }

      // Update or create a file called .env in project home
      const envContents = {
        ALIAS: currentEnv,
        PROJECT: currentProject,
        ACCESS_TOKEN: accessToken,
      };
      const envFilePath = `${projectHome}/.env`;
      const existingEnvFile = readFile(envFilePath);
      const existingFileLines = (existingEnvFile || '').split('\n');
      const envFileLines: string[] = [];

      const updatedEnvKeys: string[] = [];
      for (const ln of existingFileLines) {
        let newline = '';
        for (const [k, v] of Object.entries(envContents))
          if (ln.startsWith(`${k}=`)) {
            newline = `${k}=${v}`;
            updatedEnvKeys.push(k);
          }
        envFileLines.push(newline || ln);
      }
      for (const addKey of existingFileLines
        .filter(
          efl =>
            !updatedEnvKeys.find(uek =>
              uek.startsWith(`${efl.split('=')?.[0]}=`)
            ) && Object.keys(envContents).find(ck => ck === efl.split('=')?.[0])
        )
        .map(fl => fl.split('=')?.[0]) as (keyof typeof envContents)[]) {
        envFileLines.push(`${addKey}=${envContents[addKey]}`);
      }

      if (dryRun) {
        checkpoint('skip .env file update (dry-run)');
        log.info(`.env file`);
        log.object(envFileLines);
      } else {
        writeFile(envFilePath, envFileLines.join('\n'));
        checkpoint('.env file updated');
        log.success(messages.devinit.writeEnvFile());
        // log.help(messages.devinit.useEnvFileTip());
      }

      // Update CI file -- different for GH/GL -- create a sample one with build?
      if (dryRun) {
        checkpoint('skip CI file update (dry-run)');
        log.info(`${ciFileName} file`);
        // TODO: log what we might add to the file
        //log.object(envFileLines);
      } else {
        log.success(messages.devinit.writeCiFile(`./${ciFileName}`));
        log.info(
          messages.devinit.ciBlockTip(blockId, currentEnv, currentProject)
        );
        checkpoint('CI file updated');
      }

      // Echo Deployment API key to console, ask user to add secrets to repo
      log.warning(messages.devinit.addGitSecretsIntro());
      log.help(
        messages.devinit.addGitSecretsHelp(
          git,
          existingDeployKey?.id,
          existingDeployKey?.sharedSecret
        )
      );

      log.success(messages.devinit.success());
      log.help(messages.devinit.startProjectTip());
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
    writeFile('site_config.yaml', stringify(siteConfig));

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
