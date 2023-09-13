import { Role } from 'contensis-management-api/lib/models';
import { ApiKey, MigrateRequest } from 'migratortron';
import to from 'await-to-js';
import ContensisCli from './ContensisCliService';
import { OutputOptionsConstructorArg } from '~/models/CliService';
import { Logger } from '~/util/logger';

class ContensisRole extends ContensisCli {
  constructor(
    args: string[],
    outputOpts?: OutputOptionsConstructorArg,
    contensisOpts: Partial<MigrateRequest> = {}
  ) {
    super(args, outputOpts, contensisOpts);
  }

  GetDeliveryApiKey = async () => {
    const { contensis, currentEnv } = this;

    const CMS = `https://cms-${currentEnv}.cloud.contensis.com`;
    const API = 'api/contensis-cli/settings/defaultDeliveryApiAccessToken';

    if (contensis) {
      const [error, bearerToken] = await to(
        contensis.content.sourceRepo.repo.BearerToken()
      );
      if (error) Logger.error(error.message);

      const token = fetch(`${CMS}/${API}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearerToken}`,
        },
      })
        .then(repsonse => repsonse.json())
        .then(({ value }) => {
          if (value) return value;
        })
        .catch(error => {
          throw new Error(error);
        });

      return token;
    }
  };

  CreateOrUpdateApiKey = async (
    existingKey: ApiKey | undefined,
    name: string,
    description: string
  ) => {
    const { contensis, currentEnv, messages } = this;
    if (!contensis) throw new Error('shouldnt be here');
    if (existingKey) {
      const [err, key] = await contensis.apiKeys.UpdateKey(existingKey.id, {
        name,
        description,
      });

      if (err)
        throw new Error(messages.keys.failedUpdate(currentEnv, name), {
          cause: err,
        });
      return key;
    } else {
      const [err, key] = await contensis.apiKeys.CreateKey(name, description);
      if (err)
        throw new Error(messages.keys.failedCreate(currentEnv, name), {
          cause: err,
        });

      return key;
    }
  };

  CreateOrUpdateRole = async (
    existingRole: Role | undefined,
    role: Partial<Role>
  ) => {
    const { contensis, currentEnv, messages } = this;
    if (!contensis) throw new Error('shouldnt be here');

    if (existingRole) {
      // TODO: check is update needed?
      const [err, updated] = await contensis.roles.UpdateRole(existingRole.id, {
        ...existingRole,
        ...role,
      });
      if (err)
        throw new Error(messages.roles.failedSet(currentEnv, role.name), {
          cause: err,
        });
      return updated;
    } else {
      const [err, created] = await contensis.roles.CreateRole(
        role as Omit<Role, 'id'>
      );
      if (err)
        throw new Error(messages.roles.failedCreate(currentEnv, role.name), {
          cause: err,
        });

      return created;
    }
  };
}
export default ContensisRole;
