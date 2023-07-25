import ContensisCli from '~/services/ContensisCliService';

interface ISiteConfigYaml {
  alias: string;
  projectId: string;
  accessToken: string;
  clientId: string;
  sharedSecret: string;
  blocks: {
    id: string;
    baseUri: string;
  }[];
}

export const mapSiteConfigYaml = async (cli: ContensisCli) => {
  const credentials = await cli.GetCredentials(cli.env.lastUserId);

  const blocks = [];
  const blocksRaw = await cli.PrintBlocks();

  for (const block of blocksRaw || []) {
    const versions = await cli.PrintBlockVersions(
      block.id,
      'default',
      'latest'
    );
    if (versions?.[0]) {
      blocks.push({
        id: versions[0].id,
        baseUri: versions[0].previewUrl,
      });
    }
  }

  const siteConfig: ISiteConfigYaml = {
    alias: cli.currentEnv,
    projectId: cli.currentProject,
    accessToken: '',
    clientId: credentials?.current?.account || '',
    sharedSecret: credentials?.current?.password || '',
    blocks,
  };
  return siteConfig;
};
