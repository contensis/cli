import { spawn } from 'child_process';
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';
import path from 'path';
import { LogMessages } from '~/localisation/en-GB';
import GitHubCliModuleProvider from '~/providers/GitHubCliModuleProvider';

import ManifestProvider from '~/providers/ManifestProvider';
import { appRootDir, joinPath } from '~/providers/file-provider';
import { isDebug } from '~/util/debug';
import { Logger } from '~/util/logger';

export class RequestHandlerFactory {
  debug = isDebug();
  log = Logger;
  messages = LogMessages;
  manifest = new ManifestProvider(); // Load cli-manifest.json

  basePath = path.join(appRootDir);
  name = 'request-handler-localdevelopment';
  cmd = 'Zengenti.Contensis.RequestHandler.LocalDevelopment';

  prerelease;

  get exePath() {
    return path.join(this.basePath, `${this.name}-${this.moduleInfo.version}`);
  }

  get moduleInfo() {
    return (
      this.manifest.getModule(this.name) || {
        github: 'contensis/request-handler-localdevelopment',
        version: '*',
      }
    );
  }

  constructor(prerelease = false) {
    this.prerelease = prerelease;
  }

  // Use the factory to create a request handler instance
  // handling the download and updating of the external binary
  async Create() {
    const { moduleInfo } = this;
    const firstUse = !moduleInfo?.version || moduleInfo?.version === '*';

    if (firstUse) {
      // Create cli-manifest.json
      this.manifest.writeModule(this.name, this.moduleInfo);

      // Download for first time use (await)
      await this.CheckUpdate({ verbose: true });
    }

    // Apply any downloaded/pending update so we launch that version
    await this.ApplyUpdate();

    // Fire an async update check and continue working in the background (do not await)
    if (!firstUse) this.CheckUpdate();

    // Return a RequestHandler ready to invoke
    return this.CreateInvoke(this);
  }

  CreateInvoke(self = this) {
    // Hoist the vars we need from `this` as we lose scope
    // when the function is returned from the Create() method
    const { debug, log, messages, cmd, exePath } = self;

    // Invoke request handler method
    return async (args: string[]) => {
      const child = spawn(joinPath(exePath, cmd), args, { stdio: 'inherit' });

      if (args?.length && debug)
        log.warning(
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
        log.help(messages.devrequests.spawn());
      });

      child.on('exit', code => {
        isRunning = false;

        log[code === 0 ? 'success' : 'warning'](
          messages.devrequests.exited(code)
        );
      });

      child.on('error', error => {
        isRunning = false;
        log.error(messages.devrequests.errored(error));
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // keep the method running until we can return
      while (true === true) {
        if (!isRunning) return;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };
  }

  async CheckUpdate({ verbose = false }: { verbose?: boolean } = {}) {
    const { debug, log, manifest, messages, moduleInfo } = this;
    const github = new GitHubCliModuleProvider(moduleInfo.github);
    // Find latest version
    const release = await github.FindLatestRelease();
    if (verbose || debug)
      if (release)
        log.info(
          `${messages.devrequests.install.download(
            moduleInfo.github,
            release.tag_name
          )}\n${release.html_url}`
        );
      else
        log.warning(messages.devrequests.install.notFound(moduleInfo.github));

    // Should we download an update?
    if (
      release?.tag_name &&
      ![moduleInfo.version, moduleInfo.install].includes(release.tag_name)
    ) {
      // Download platform-specific release asset
      const downloadPath = path.join(
        this.basePath,
        `${this.name}-${release.tag_name}`
      );

      // add spinner while downloading
      const spinner = createSpinner(
        messages.devrequests.install.downloading(
          moduleInfo.github,
          release.tag_name
        )
      );
      if (verbose || debug) {
        spinner.start();
      }
      try {
        await github.DownloadRelease(release, {
          path: downloadPath,
          // Map NodeJS os platform to release asset name
          platforms: [
            ['win32', 'win-x64'],
            ['darwin', 'osx-x64'],
            ['linux', 'linux-x64'],
          ],
        });
      } catch (ex: any) {
        spinner.error();
        log.error(
          messages.devrequests.install.downloadFail(
            moduleInfo.github,
            release.tag_name
          ),
          ex
        );
      } finally {
        if (verbose || debug)
          spinner.success({
            text: messages.devrequests.install.downloaded(
              moduleInfo.github,
              release.tag_name
            ),
          });

        // Update module info with downloaded release
        this.moduleInfo.install = release.tag_name;
        // Write module info update to manifest so it installs on next invoke
        manifest.writeModule(this.name, this.moduleInfo);
      }
    }
  }

  async ApplyUpdate() {
    const { manifest, messages, moduleInfo } = this;

    if (moduleInfo.install && moduleInfo.version !== moduleInfo.install) {
      let { apply } =
        moduleInfo.version === '*'
          ? { apply: true }
          : await inquirer.prompt({
              name: 'apply',
              type: 'confirm',
              message: messages.devrequests.install.applyUpdate(
                moduleInfo.install,
                moduleInfo.version
              ),
              default: 'Y',
            });

      if (apply) {
        moduleInfo.version = moduleInfo.install;
        delete moduleInfo.install;
        manifest.writeModule(this.name, this.moduleInfo);

        // TODO: clean up user folder by deleting old version(s)}
      }
    }
  }
}

export const createRequestHandler = () => new RequestHandlerFactory().Create();
