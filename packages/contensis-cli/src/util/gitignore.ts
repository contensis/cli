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

    // Create a Set from existing patterns for fast look-up
    const existingContentSet = new Set(
      existingContent.split('\n').filter(line => line.trim() !== '')
    );

    // Filter out patterns that already exist
    const newContents = contentsToAdd.filter(
      contentsItem => !existingContentSet.has(contentsItem)
    );

    if (newContents.length >= 1) {
      // Append the new patterns to the end of the existing .gitignore content
      fs.appendFileSync(filename, '\n' + newContents.join('\n'));
      Logger.success('.gitignore file updated');
    } else {
      Logger.success('.gitignore checked, nothing to update');
    }
  } else {
    // If .gitignore doesn't exist, create one and add the contents
    const gitignoreContent = contentsToAdd.join('\n');
    fs.writeFileSync(filename, gitignoreContent);

    Logger.success('.gitignore file created and updated');
  }
};
