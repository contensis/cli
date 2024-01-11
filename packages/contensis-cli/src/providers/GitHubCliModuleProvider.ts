import os from 'os';
import Zip from 'adm-zip';
import type { Endpoints } from '@octokit/types';
import HttpProvider from '~/providers/HttpProvider';
import {
  checkDir,
  joinPath,
  removeDirectory,
  removeFile,
} from './file-provider';
import { doRetry } from '~/util/fetch';

type GitHubApiRelease =
  Endpoints['GET /repos/{owner}/{repo}/releases/latest']['response']['data'];

class GitHubCliModuleProvider {
  http: HttpProvider;
  repo: string;
  baseUrl = 'https://api.github.com/repos';

  get releases_url() {
    return `${this.baseUrl}/${this.repo}/releases`;
  }
  get latest_release_url() {
    return `${this.baseUrl}/${this.repo}/releases/latest`;
  }

  download?: {
    tag: string;
    name: string;
    url: string;
    browser_url: string;
  };

  constructor(repo: string) {
    this.http = new HttpProvider();
    this.repo = repo;
  }

  async FindLatestRelease() {
    const { http, latest_release_url, releases_url } = this;
    // return latest tag version is:

    const responses = await Promise.all([
      http.get<GitHubApiRelease>(latest_release_url, {
        doRetry: doRetry({ silent: true }),
      }),
      http.get<GitHubApiRelease[]>(releases_url),
    ]);

    const [latestErr, latest, latestResponse] = responses[0];
    const [releasesErr, releases] = responses[1];

    if (releasesErr) {
      throw new Error(`Unable to get releases`, { cause: releasesErr });
    } else if (!releases || releases.length === 0)
      throw new Error(`No releases available`);
    else if (latestErr && !latest) {
      if (latestResponse?.status === 404 && releases?.length) {
        // No latest release, check releases for prerelease version, fallback to last release
        const release = releases.find(r => r.prerelease) || releases[0];

        if (release) {
          return release;
        }
      }
    } else {
      return latest;
    }
  }

  async DownloadRelease(
    release: GitHubApiRelease,
    {
      path,
      platforms,
      unzip = true,
    }: { path: string; unzip?: boolean; platforms: [NodeJS.Platform, string][] }
  ) {
    // find os-specific asset
    const platform = platforms.find(p => p[0] === os.platform()) || [
      os.platform(),
      os.platform(),
    ];

    const asset = release.assets.find(r =>
      r.name.toLowerCase().includes(platform[1])
    );

    // download asset
    if (asset) {
      const filePath = joinPath(path, asset.name);
      removeDirectory(path);
      checkDir(filePath);
      await this.http.downloadFile(asset.browser_download_url, filePath);

      if (unzip && asset.name.endsWith('.zip')) {
        // unzip the downloaded file
        const zipFile = new Zip(filePath);
        zipFile.extractAllTo(path);

        // delete the downloaded zip file
        removeFile(filePath);
      }
    } else
      throw new Error(
        `no asset found in release ${
          release.tag_name
        } for platform ${os.platform()}\n${release.html_url}`
      );
  }
}

export default GitHubCliModuleProvider;
