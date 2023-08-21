export type EnvContentsToAdd = {
  ALIAS: string;
  PROJECT: string;
  ACCESS_TOKEN?: string;
};

export type GitHubActionPushBlockJobStep = {
  name: string;
  id: 'push-block';
  uses: string;
  with: {
    'block-id': string;
    alias: string;
    'project-id': string;
    'client-id': string;
    'shared-secret': string;
    'image-uri'?: string;
  };
};

export type GitHubActionPushBlockJob = {
  name: string;
  'runs-on': string;
  needs?: string;
  steps: GitHubActionPushBlockJobStep[];
};
