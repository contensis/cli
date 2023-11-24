import giturl from 'giturl';
import hostedGitInfo from 'hosted-git-info';
import parseGitConfig from 'parse-git-config';
import path from 'path';

import { linuxSlash } from './os';
import { readFile, readFiles } from '~/providers/file-provider';
import { Logger } from './logger';

const GITLAB_CI_FILENAME = '.gitlab-ci.yml';

type GitConfig = parseGitConfig.Config;

export type GitTypes = hostedGitInfo.Hosts;

export class GitHelper {
  private gitRepoPath: string;
  private ciFile?: string;

  config = {} as GitConfig;
  info: hostedGitInfo | undefined;
  home: string | undefined;

  set ciFileName(fileName: string) {
    this.ciFile = fileName;
  }

  get ciFileName() {
    return (
      this.ciFile ||
      (this.workflows
        ? this.type === 'github'
          ? this.workflows.length > 1
            ? '[multiple workflows]'
            : this.workflows?.[0]
          : GITLAB_CI_FILENAME
        : '[unknown]')
    );
  }
  get ciFilePath() {
    return `${this.gitRepoPath}/${this.ciFileName}`;
  }
  get name() {
    return (
      this.info?.project || this.home?.split('/').pop() || '[set arg --name]'
    );
  }
  get originUrl() {
    const originUrl = this?.config?.remote?.origin?.url;
    if (originUrl) return originUrl;
  }
  get secretsUri() {
    return `${
      this.type === 'github'
        ? `${this.home}/settings/secrets/actions`
        : `${this.home}/-/settings/ci_cd`
    }`;
  }
  get type() {
    return this.info?.type || this.hostType();
  }
  get workflows() {
    return this.type === 'github'
      ? this.githubWorkflows()
      : this.gitlabWorkflow();
  }
  constructor(gitRepoPath: string = process.cwd()) {
    this.gitRepoPath = gitRepoPath;
    this.config = this.gitConfig();
    this.home = giturl.parse(this.originUrl);
    this.info = this.gitInfo();
    // console.log(this.config);
    // console.log(this.home);
    // console.log(this.info);
  }
  gitcwd = () => path.join(this.gitRepoPath);
  gitInfo = (url: string = this.originUrl) => hostedGitInfo.fromUrl(url);
  hostType = (url: string = this.originUrl): GitTypes | undefined => {
    if (url) {
      if (url.includes('github.com')) return 'github';
      else return 'gitlab';
    }

    // if (url.includes('gitlab.com')) return 'gl';
    // if (url.includes('gitlab.zengenti.com')) return 'gl';
  };
  gitConfig = (cwd = this.gitRepoPath) => {
    // Find .git/config in project cwd
    const config = parseGitConfig.sync({
      cwd,
      path: '.git/config',
      expandKeys: true,
    });
    // console.log(cwd, config);
    if (Object.keys(config || {}).length) return config;

    // Recursively check the directory heirarchy for existance of a .git/config
    const pathParts = linuxSlash(cwd).split('/');
    for (let i = 1; i <= pathParts.length; i++) {
      const relPath = `${Array(i).fill('..').join('/')}/.git/config`;
      // Does not appear to work when using a shortened cwd, using relative path instead
      const config = parseGitConfig.sync({
        path: relPath,
        expandKeys: true,
      });
      // console.log(relPath, config);
      if (Object.keys(config || {}).length) {
        this.gitRepoPath = path.join(
          this.gitRepoPath,
          Array(i).fill('..').join('/')
        );
        return config;
      }
    }
    return config;
  };
  githubWorkflows = () => {
    const workflowPath = path.join(this.gitcwd(), '.github/workflows');
    const workflowFiles = readFiles(workflowPath, false);
    const addFolderSuffix = (files: string[]) =>
      files.map(f => `.github/workflows/${f}`);

    if (workflowFiles.some(f => f.includes('build'))) {
      return addFolderSuffix(workflowFiles.filter(f => f.includes('build')));
    } else {
      return addFolderSuffix(workflowFiles);
    }
  };
  gitlabWorkflow = (ciFileName = GITLAB_CI_FILENAME) => {
    const workflowPath = this.gitcwd();
    const workflowFilePath = path.join(workflowPath, ciFileName);
    const workflowFile = readFile(workflowFilePath);
    // console.log(ciFileName, workflowFile);

    return workflowFile;
  };
  checkIsRepo = () => {
    if (
      this.config &&
      this.config.core &&
      this.config.core.repositoryformatversion
    ) {
      Logger.success('You are inside a Git repository.');
      return true;
    } else {
      Logger.error('You are not inside a Git repository.');
      return false;
    }
  };
}
