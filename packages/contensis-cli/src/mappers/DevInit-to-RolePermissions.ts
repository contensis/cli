import { Role } from 'contensis-management-api/lib/models';

export const devKeyPermissions = {} as Partial<Role['permissions']>;

export const deployKeyPermissions = {
  blocks: { actions: ['push', 'release', 'view'] },
} as Role['permissions'];

export const devKeyRole = (
  keyName: string,
  description: string
): Partial<Role> => ({
  name: keyName,
  description,
  assignments: {
    apiKeys: [keyName],
  },
  permissions: devKeyPermissions,
  enabled: true,
});

export const deployKeyRole = (
  keyName: string,
  description: string
): Partial<Role> => ({
  name: keyName,
  description,
  assignments: {
    apiKeys: [keyName],
  },
  permissions: deployKeyPermissions,
  enabled: true,
});
