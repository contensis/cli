import { ContensisMigrationService } from 'migratortron';
import PQueue from 'p-queue';
import ContensisCli from '~/services/ContensisCliService';

type EndpointJson = {
  id: string;
  path: string;
};

type BlockJson = {
  id: string;
  baseUri: string;
  staticPaths: string[];
  endpoints: EndpointJson[];
  versionNo: number;
  branch: string;
};

type RendererJson = {
  id: string;
  name: string;
  rules: RendererRuleJson[];
  assignedContentTypes: string[];
};

type RendererRuleJson = {
  return?: {
    blockId?: string;
    endpointId?: string | null;
    version?: string;
  };
};
interface ISiteConfigYaml {
  alias: string;
  projectId: string;
  iisHostname: string;
  podClusterId: string;
  accessToken: string; // needed?
  clientId: string;
  sharedSecret: string;
  blocks: BlockJson[];
  renderers: RendererJson[];
}

class RequestHandlerArgs {
  private cli;
  args?: string[];
  siteConfig?: ISiteConfigYaml;

  constructor(cli: ContensisCli) {
    this.cli = cli;
  }

  Create = async () => {
    this.siteConfig = await this.buildSiteConfig();
    await this.cli.Login(this.cli.env.lastUserId, { silent: true }); // to hydrate the auth service
    this.args = this.getArgs();
  };

  buildSiteConfig = async () => {
    const { currentEnv, currentProject, env, log, messages, urls } = this.cli;
    const contensis = await this.cli.ConnectContensis();

    const siteConfig: ISiteConfigYaml = {
      alias: currentEnv,
      projectId: currentProject,
      iisHostname: urls?.iisPreviewWeb.split('//')[1] || '',
      podClusterId: 'hq',
      accessToken: '',
      clientId: '',
      sharedSecret: '',
      blocks: [],
      renderers: [],
    };

    const getBlocks = async (contensis: ContensisMigrationService) => {
      const [err, blocksRaw] = await contensis.blocks.GetBlocks();
      if (err)
        log.error(messages.blocks.noList(currentEnv, env.currentProject));

      // const blocksRaw = await cli.PrintBlocks();

      const blocks: BlockJson[] = [];
      const queue = new PQueue({ concurrency: 4 });
      for (const block of blocksRaw || []) {
        queue.add(async () => {
          // Retrieve block version
          const [err, versions] = await contensis.blocks.GetBlockVersions(
            block.id,
            'default',
            'latest'
          );
          if (err || versions?.length === 0)
            log.warning(
              messages.blocks.noGet(
                block.id,
                'default',
                'latest',
                currentEnv,
                env.currentProject
              )
            );
          if (versions?.[0]) {
            const v = versions[0];
            blocks.push({
              id: v.id,
              baseUri: v.previewUrl,
              staticPaths: v.staticPaths,
              endpoints: v.endpoints,
              versionNo: v.version.versionNo,
              branch: v.source.branch,
            });
          }
        });
      }

      await queue.onIdle();
      return blocks;
    };

    if (contensis) {
      const [blocks, renderers] = await Promise.all([
        getBlocks(contensis),
        contensis.renderers.GetRenderers(),
      ]);

      siteConfig.blocks = blocks;
      siteConfig.renderers = renderers?.[1]
        ?.filter(r => blocks.find(b => b.id === r.id))
        .map(r => ({
          id: r.id,
          name: r.name,
          assignedContentTypes: r.assignedContentTypes,
          rules: r.rules,
        }));
    }
    return siteConfig;
  };

  getArgs = (overrideArgs: string[] = []) => {
    const args = overrideArgs
      ? typeof overrideArgs?.[0] === 'string' &&
        overrideArgs[0].includes(' ', 2)
        ? overrideArgs[0].split(' ')
        : overrideArgs
      : []; // args could be [ '-c .\\site_config.yaml' ] or [ '-c', '.\\site_config.yaml' ]

    const { cli, siteConfig } = this;
    if (siteConfig) {
      // Add required args
      if (!args.find(a => a === '--alias'))
        args.push('--alias', cli.currentEnv);
      if (!args.find(a => a === '--project-api-id'))
        args.push('--project-api-id', cli.currentProject);
      if (!args.find(a => a === '--iis-hostname'))
        args.push('--iis-hostname', siteConfig.iisHostname);
      if (!args.find(a => a === '--pod-cluster-id'))
        args.push('--pod-cluster-id', siteConfig.podClusterId);
      if (!args.find(a => a === '--blocks-json'))
        args.push('--blocks-json', JSON.stringify(siteConfig.blocks));
      if (!args.find(a => a === '--renderers-json'))
        args.push('--renderers-json', JSON.stringify(siteConfig.renderers));
    }

    const client = cli.auth?.clientDetails;
    if (client) {
      if (!args.find(a => a === '--client-id') && 'clientId' in client)
        args.push('--client-id', client.clientId);
      if (!args.find(a => a === '--client-secret') && 'clientSecret' in client)
        args.push('--client-secret', client.clientSecret);
      if (!args.find(a => a === '--username') && 'username' in client)
        args.push('--username', client.username);
      if (!args.find(a => a === '--password') && 'password' in client)
        args.push('--password', client.password);
    }

    return args;
  };

  overrideBlock = (blockId: string, overrideUri: string) => {
    if (blockId && blockId !== 'none') {
      const blockIndex = this.siteConfig?.blocks.findIndex(
        b => b.id.toLowerCase() === blockId.toLowerCase()
      );
      if (
        typeof blockIndex === 'number' &&
        !isNaN(blockIndex) &&
        this.siteConfig?.blocks[blockIndex]
      ) {
        this.siteConfig.blocks[blockIndex].baseUri = overrideUri;
        // this.siteConfig.blocks[blockIndex].staticPaths.push(
        //   ...['/static/*', '/image-library/*']
        // );
        this.siteConfig.blocks[blockIndex].staticPaths.push('/*.js');
      }
    }
  };
}

export default RequestHandlerArgs;
