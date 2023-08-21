import chalk from 'chalk';
import { Change, diffLines } from 'diff';
import { normaliseLineEndings } from './os';

export const diffLogStrings = (updates: string, previous: string) => {
  const lastFewLines = previous.split('\n').slice(-10);
  const incomingLines = updates.split('\n');

  // Find the line indices in the incoming lines
  // of the last few lines previously rendered
  const incomingLineIndices = [];
  for (const lastRenderedLine of lastFewLines) {
    if (lastRenderedLine.length > 10)
      incomingLineIndices.push(incomingLines.lastIndexOf(lastRenderedLine));
  }

  // Get the new lines from the next position on from the last of the already shown lines
  const differentFromPos = Math.max(...incomingLineIndices) + 1 || 0;
  // Return just the incoming lines from the position we matched
  return incomingLines.slice(differentFromPos).join('\n');
};

export const diffFileContent = (
  existingContent: string,
  newContent: string
) => {
  const existingContentNormalised = normaliseLineEndings(existingContent, '\n');
  const newContentNormalised = normaliseLineEndings(newContent, '\n');

  const diff = diffLines(existingContentNormalised, newContentNormalised, {
    newlineIsToken: true,
  });
  const diffRanges = addDiffPositionInfo(diff);

  // Create formatted output for console
  const output: string[] = [];
  const lnSpaceLength = Math.max(
    ...diffRanges.map(d => d.startLineNumber.toString().length)
  );

  const lnSpaces = Array(lnSpaceLength).join(' ');

  for (let i = 0; i < diffRanges.length; i++) {
    const part = diffRanges[i];
    if (part.added || part.removed) {
      const colour = part.added ? 'green' : part.removed ? 'red' : 'grey';

      if (part.value !== '\n')
        output.push(
          `\n${part.value
            .split('\n')
            .map((ln, idx) =>
              ln.trim() !== ''
                ? `${
                    part.startLineNumber ? part.startLineNumber + idx : lnSpaces
                  }${part.added ? '+' : part.removed ? '-' : ' '} ${chalk[
                    colour
                  ](`${ln}`)}`
                : ln
            )
            .join('\n')}`
        );
    }
  }

  return output.join('');
  // return retOutput.endsWith('\n') ? retOutput : `${retOutput}\n`;
};

const addDiffPositionInfo = (diff: Change[]) => {
  const diffRanges: (Change & {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  })[] = [];

  let lineNumber = 0;
  let column = 0;
  for (let partIndex = 0; partIndex < diff.length; partIndex++) {
    const part = diff[partIndex];

    // // Skip any parts that aren't in `after`
    // if (part.removed === true) {
    //   continue;
    // }

    const startLineNumber = lineNumber;
    const startColumn = column;

    // Split the part into lines. Loop throug these lines to find
    // the line no. and column at the end of this part.
    const substring = part.value;
    const lines = substring.split('\n');
    lines.forEach((line, lineIndex) => {
      // The first `line` is actually just a continuation of the last line
      if (lineIndex === 0) {
        column += line.length;
        // All other lines come after a line break.
      } else if (lineIndex > 0) {
        lineNumber += 1;
        column = line.length;
      }
    });

    // Save a range for all of the parts with position info added
    if (part.added === true || part.removed === true) {
      diffRanges.push({
        startLineNumber: startLineNumber + 1,
        startColumn: startColumn,
        endLineNumber: lineNumber,
        endColumn: column,
        ...part,
      });
    }
  }
  return diffRanges;
};
