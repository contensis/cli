import { Role } from 'contensis-management-api/lib/models';

export const devKeyPermissions = {} as Partial<Role['permissions']>;

export const deployKeyPermissions = {
  blocks: { actions: ['push', 'release', 'view'] },
} as Role['permissions'];

export const devKeyRole = (
  keyName: string,
  roleName: string,
  description: string
): Partial<Role> => ({
  name: roleName,
  description,
  assignments: {
    apiKeys: [keyName],
  },
  permissions: devKeyPermissions,
  enabled: true,
});

export const deployKeyRole = (
  keyName: string,
  roleName: string,
  description: string
): Partial<Role> => ({
  name: roleName,
  description,
  assignments: {
    apiKeys: [keyName],
  },
  permissions: deployKeyPermissions,
  enabled: true,
});
