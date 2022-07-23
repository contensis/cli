import { Option } from 'commander';

export const output = new Option(
  '-o, --output <output>',
  'save output to a file e.g. --output ./output.txt'
);

export const format = new Option(
  '-f, --format <format>',
  'format output as csv, json or table (default)'
).choices(['csv', 'json', 'table']);
