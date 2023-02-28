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
