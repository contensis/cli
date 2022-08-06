import { flatten } from 'flat';
import { Parser } from 'json2csv';
import cleaner from 'deep-cleaner';
import { Entry } from 'contensis-management-api/lib/models';

export const entriesToCsv = (entries: Entry[]) => {
  const flatEntries = [];
  for (const entry of entries) {
    flatEntries.push(flatten(cleaner(entry, ['workflow'])));
  }
  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(flatEntries);

  return csv;
};
