type SessionCache = {
  currentEnvironment?: string;
  currentTimestamp: string;
  environments: {
    [alias: string]: EnvironmentCache;
  };
  history: string[];
};

type EnvironmentCache = {
  lastUserId: string;
  passwordFallback?: string;
  authToken?: string;
  currentProject?: string;
  projects: string[];
  history: CliCommand[];
  versionStatus: 'latest' | 'published';
};

type CliCommand = {
  createdDate: string;
  invokedBy: string;
  commandText: string;
  options: { [key: string]: string | boolean };
  result?: any;
};
