import fs from 'fs';
import { homedir } from 'os';
import path from 'path';
import { tryParse } from '~/util';

const userHomeDir = homedir();
export const appRootDir = path.join(userHomeDir, '.contensis/');

export const readJsonFile = <T>(filePath: string) => {
  const file = readFile(filePath);
  if (file) return tryParse(file) as T | string;
  return undefined;
};
export const readFile = (filePath: string) => {
  const directoryPath = localPath(filePath);
  if (fs.existsSync(directoryPath)) {
    const file = fs.readFileSync(directoryPath, 'utf8');
    return file;
  } else {
    return undefined;
  }
};

export const readFiles = (directory: string) => {
  const directoryPath = localPath(directory);
  if (fs.existsSync(directoryPath)) {
    const files = fs.readdirSync(directoryPath);
    return files;
  } else {
    fs.mkdirSync(directoryPath, { recursive: true });
    return [];
  }
};

export const writeFile = (filePath: string, content: string) => {
  const directoryPath = localPath(filePath);
  fs.writeFileSync(directoryPath, content, { encoding: 'utf-8' });
};

export const removeFile = (filePath: string) => {
  const directoryPath = localPath(filePath);
  if (fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath);
  }
};

export const moveFile = (file: string, fromPath: string, toPath: string) => {
  const from = path.join(appRootDir, `${fromPath}${file}`);
  const to = path.join(appRootDir, `${toPath}${file}`);
  if (fs.existsSync(from)) {
    checkDir(toPath);
    // if (!fs.existsSync(toPath)) fs.mkdirSync(toPath, { recursive: true });

    fs.rename(from, to, err => {
      if (err)
        console.error(
          `Could not rename file "${file}" from: ${fromPath} to: ${toPath}`,
          err
        );
      console.info(`Renamed file "${file}" from: ${fromPath} to: ${toPath}`);
    });
  } else {
    console.error(
      `Could not rename file "${file}" from: ${fromPath} to: ${toPath}\nFile does not exist!`
    );
  }
};

export const checkDir = (filePath: string) => {
  const directoryPath = path.dirname(localPath(filePath));
  if (!fs.existsSync(directoryPath))
    fs.mkdirSync(directoryPath, { recursive: true });
};

export const localPath = (filePath: string) =>
  path.isAbsolute(filePath) ? filePath : path.join(appRootDir, filePath);
