import fs from 'fs';
import { Logger } from './logger';

export const mergeContentsToAddWithGitignore = (
  filename: string,
  contentsToAdd: string[]
) => {
  // Check if .gitignore file already exists
  if (fs.existsSync(filename)) {
    // Read the existing .gitignore file
    const existingContent = fs.readFileSync(filename, 'utf-8');

    // Split the existing content by newline and remove empty lines
    const existingLines = existingContent
      .split('\n')
      .filter(line => line.trim() !== '');

    // Merge the existing content with the new contents to add
    const mergedLines = [...existingLines, ...contentsToAdd];

    // Deduplicate and sort the lines
    const updatedContent = Array.from(new Set(mergedLines)).sort().join('\n');

    // Write the updated content back to .gitignore
    fs.writeFileSync(filename, updatedContent);

    Logger.success('.gitignore file updated');
  } else {
    // If .gitignore doesn't exist, create one and add the contents to add
    const gitignoreContent = contentsToAdd.join('\n');
    fs.writeFileSync(filename, gitignoreContent);

    Logger.success('.gitignore file created and updated');
  }
};
