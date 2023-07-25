import os from 'os';

export const winSlash = (str: string) =>
  os.platform() === 'win32' ? str.replaceAll('/', '\\') : str;

export const linuxSlash = (str: string) =>
  os.platform() === 'win32' ? str.replaceAll('\\', '/') : str;
