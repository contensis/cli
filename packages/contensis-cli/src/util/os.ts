import os from 'os';

export const winSlash = (str: string) =>
  os.platform() === 'win32' ? str.replaceAll('/', '\\') : str;

export const linuxSlash = (str: string) =>
  os.platform() === 'win32' ? str.replaceAll('\\', '/') : str;

export const normaliseLineEndings = (
  str: string,
  lineEnd = os.platform() === 'win32' ? '\r\n' : 'n'
) => str.replace(/\r?\n/g, lineEnd);
