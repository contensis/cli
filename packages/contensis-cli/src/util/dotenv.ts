import { EnvContentsToAdd } from "~/models/DevService";

export const mergeDotEnvFileContents = (
  existingFileLines: string[],
  envContentsToAdd: EnvContentsToAdd
): string[] => {
  const envFileLines: string[] = []; // the new .env file
  if (existingFileLines.length === 0) {
    // There is no env file, just create one from envContentsToAdd
    envFileLines.push(
      ...Object.entries(envContentsToAdd).map(([k, v]) => `${k}=${v}`)
    );
  } else {
    const updatedEnvKeys: string[] = [];
    // Find lines in env that already exist for the keys in envContentsToAdd
    // update them if they exist and add them to envFileLines
    for (const ln of existingFileLines) {
      let newline = '';
      for (const [k, v] of Object.entries(envContentsToAdd))
        if (ln.startsWith(`${k}=`)) {
          newline = `${k}=${v}`;
          updatedEnvKeys.push(k);
        }
      // Ensure an updated line or other lines from the existing env file are re-added
      if (newline || ln) envFileLines.push(newline || ln);
    }

    // Add the envContentsToAdd lines to the file that did not previously exist or had an update
    for (const addKey of Object.keys(envContentsToAdd).filter(
      efl =>
        !updatedEnvKeys.find(uek => uek.startsWith(`${efl.split('=')?.[0]}`))
    ) as (keyof typeof envContentsToAdd)[]) {
      envFileLines.push(`${addKey}=${envContentsToAdd[addKey]}`);
    }
  }
  return envFileLines;
};
