import { Role } from 'contensis-management-api/lib/models';
import { ApiKey, MigrateRequest } from 'migratortron';

import ContensisCli from './ContensisCliService';
import { OutputOptionsConstructorArg } from '~/models/CliService';

class ContensisRole extends ContensisCli {
  constructor(
    args: string[],
    outputOpts?: OutputOptionsConstructorArg,
    contensisOpts: Partial<MigrateRequest> = {}
  ) {
    super(args, outputOpts, contensisOpts);
  }

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
    name: string,
    description: string,
    assignments: Role['assignments'],
    permissions: Role['permissions']
  ) => {
    const { contensis, currentEnv, messages } = this;
    if (!contensis) throw new Error('shouldnt be here');

    if (existingRole) {
      // TODO: check is update needed?
      const [err, updated] = await contensis.roles.UpdateRole(existingRole.id, {
        ...existingRole,
        assignments,
        permissions,
      });
      if (err)
        throw new Error(messages.roles.failedSet(currentEnv, name), {
          cause: err,
        });
      return updated;
    } else {
      const [err, created] = await contensis.roles.CreateRole({
        name,
        description,
        enabled: true,
        assignments,
        permissions,
      } as Role);
      if (err)
        throw new Error(messages.roles.failedCreate(currentEnv, name), {
          cause: err,
        });

      return created;
    }
  };
}
export default ContensisRole;
