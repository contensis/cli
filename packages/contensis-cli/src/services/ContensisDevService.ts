import { execFile, spawn } from 'child_process';
import inquirer from 'inquirer';
import path from 'path';

import { MigrateRequest } from 'migratortron';
import { stringify } from 'yaml';

import ContensisCli, {
  OutputOptionsConstructorArg,
} from './ContensisCliService';
import { mapSiteConfigYaml } from '~/mappers/ContensisCliService-to-RequestHanderSiteConfigYaml';
import { appRootDir, writeFile } from '~/providers/file-provider';
import { jsonFormatter } from '~/util/json.formatter';
import { GitHelper } from '~/util/git';

class ContensisDev extends ContensisCli {
  constructor(
    args: string[],
    outputOpts?: OutputOptionsConstructorArg,
    contensisOpts: Partial<MigrateRequest> = {}
  ) {
    super(args, outputOpts, contensisOpts);
  }

  DevelopmentInit = async (projectHome: string, opts: any) => {
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

      // Set variables for logging etc.
      let ciFileName = git.ciFileName;

      const devKey = `${git.name} development`;
      const deployKey = `${git.name} deployment`;
      const blockId = git.name;

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
          messages.devinit.developmentKey(devKey, !!apiKeyExists(devKey))
        )
      );
      log.raw(
        log.infoText(
          messages.devinit.deploymentKey(deployKey, !!apiKeyExists(deployKey))
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
      log.help(messages.devinit.ciIntro(git));

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

      // Arrange API keys for development and deployment
      log.success(messages.devinit.createDevKey(devKey, false));
      log.success(messages.devinit.createDeployKey(deployKey, true));

      // Update or create a file called .env in project home
      log.success(messages.devinit.writeEnvFile());
      // log.help(messages.devinit.useEnvFileTip());

      // Update CI file -- different for GH/GL -- create a sample one with build?
      log.success(messages.devinit.writeCiFile(`./${ciFileName}`));
      log.info(
        messages.devinit.ciBlockTip(blockId, currentEnv, currentProject)
      );

      // Echo Deployment API key to console, ask user to add secrets to repo
      log.warning(messages.devinit.addGitSecretsIntro());
      log.help(
        messages.devinit.addGitSecretsHelp(git, '123-456', '789-012-345')
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
