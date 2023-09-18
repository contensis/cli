export type EnvContentsToAdd = {
  ALIAS: string;
  PROJECT_API_ID: string;
  ACCESS_TOKEN?: string;
  CONTENSIS_CLIENT_ID?: string;
  CONTENSIS_CLIENT_SECRET?: string;
  BLOCK_ID: string;
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

export type GitLabPushBlockJobStage = {
  stage: string;
  variables: {
    alias: string;
    project_id: string;
    block_id: string;
    image_uri?: string;
    client_id: string;
    shared_secret: string;
  };
};
