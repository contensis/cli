/* eslint-disable no-console */
import chalk from 'chalk';
import dateFormat from 'dateformat';
import deepCleaner from 'deep-cleaner';
import {
  ansiEscapeCodes,
  first,
  partition,
  strlen,
} from 'printable-characters';
// import ProgressBar from 'progress';
import { isSysError, tryStringify } from '.';

type LogMethod = (content: string) => void;
type LogErrorMethod = (content: string, err?: any, newline?: string) => void;
type LogJsonMethod = (content: any, depth?: number, indent?: string) => void;
type LogJsonDepthMethod = (content: any, depth?: number) => void;
type LogArrayMethod = (contentArray: string[]) => void;
type LogErrorFunc = (
  err: any,
  msg?: string,
  level?: 'error' | 'critical'
) => void;

export class Logger {
  static isUserTerminal = !!process.stdout.columns;
  static getPrefix = () => {
    return Logger.isUserTerminal
      ? Logger.infoText(`[cli]`)
      : `[${dateFormat(new Date(), 'dd/mm HH:MM:ss')}]`;
  };
  static errorText = chalk.bold.red;
  static warningText = chalk.keyword('orange');
  static successText = chalk.keyword('green');
  static helpText = chalk.blue;
  static highlightText = chalk.yellow;
  static infoText = chalk.keyword('grey');
  static standardText = chalk.keyword('white');
  static boldText = chalk.bold;
  static critical: LogMethod = content => {
    const message = `${Logger.getPrefix()}  ${Logger.errorText(
      '[CRITICAL]'
    )} ${content}`;
    console.log(message);
  };
  static error: LogErrorMethod = (content, err, newline = '\n') => {
    const message = `${Logger.getPrefix()} ${Logger.errorText(
      `${Logger.isUserTerminal ? '❌' : '[ERROR]'} ${content}${
        err
          ? `\n\n${Logger.infoText(
              isSysError(err) ? err.toString() : JSON.stringify(err, null, 2)
            )}`
          : ''
      }`
    )}${newline}`;
    if (progress.active) progress.current.interrupt(message);
    else console.log(message);
  };
  static warning: LogMethod = content => {
    // if (process.env.DEBUG === 'true') {
    const message = `${Logger.getPrefix()} ${Logger.warningText(
      `${Logger.isUserTerminal ? '⚠️ ' : '[WARN]'} ${content}`
    )}\n`;
    if (progress.active) progress.current.interrupt(message);
    else console.log(message);
    // }
  };
  static success: LogMethod = content => {
    const message = `${Logger.getPrefix()} ${Logger.successText(
      `${Logger.isUserTerminal ? '✅' : '[OK]'} ${content}`
    )}`;
    if (progress.active) progress.current.interrupt(message);
    else console.log(message);
  };
  static info: LogMethod = content => {
    const message = `${Logger.getPrefix()} ${
      Logger.isUserTerminal ? chalk.bgCyan(' ℹ ') : '[INFO]'
    } ${Logger.infoText(content)}`;
    if (progress.active) progress.current.interrupt(message);
    else console.log(message);
  };
  static help: LogMethod = content => {
    const message = `${Logger.getPrefix()} ${chalk.blue(
      `${Logger.isUserTerminal ? '⏩' : '[HELP]'} ${content}`
    )}\n`;
    if (progress.active) progress.current.interrupt(message);
    else console.log(message);
  };
  static standard: LogMethod = content => {
    const message = `${Logger.getPrefix()} ${
      Logger.isUserTerminal ? '◻️' : '[STD]'
    } \n${Logger.standardText(content)}`;
    if (progress.active) progress.current.interrupt(message);
    else console.log(message);
    progress.current.interrupt(message);
  };
  static debug: LogMethod = content => {
    if (['true', '1'].includes(process.env.debug || '')) {
      const message = `${Logger.getPrefix()} ${
        Logger.isUserTerminal ? chalk.bgGrey(' ⚙ ') : '[DEBUG]'
      } ${Logger.infoText(content)}`;
      if (progress.active) progress.current.interrupt(message);
      else console.log(message);
    }
  };
  static json: LogJsonDepthMethod = (content, depth = 9) =>
    console.dir(deepCleaner(content), { colors: true, depth });
  static mixed: LogArrayMethod = contentArray =>
    console.log(`${Logger.getPrefix()} ${contentArray.join(' ')}`);
  static line = () =>
    Logger.raw(`  ${Logger.infoText(`-------------------------------------`)}`);

  static object: LogJsonMethod = content => {
    for (const [key, value] of Object.entries(content || {})) {
      if (value && typeof value === 'object') {
        Logger.raw(`  ${chalk.bold.grey(key)}:`);
        if (key === 'fields' && Array.isArray(value)) {
          for (const field of value || []) {
            Logger.raw(
              `    ${chalk.bold(field.id)}${
                field.id === content.entryTitleField
                  ? '**'
                  : field.validations.minCount?.value ||
                    typeof field.validations.required?.message !== 'undefined'
                  ? '*'
                  : ''
              }: ${chalk.grey(
                `${field.dataType}${
                  field.dataFormat
                    ? `<${
                        Array.isArray(
                          field.validations.allowedFieldTypes?.fields
                        )
                          ? `composer[${field.validations.allowedFieldTypes.fields
                              .map((f: any) => f.id)
                              .join(' | ')}]`
                          : field.dataFormat
                      }${
                        field.dataFormat === 'entry'
                          ? `, ${field.validations.allowedContentTypes.contentTypes.join(
                              ' | '
                            )}`
                          : ''
                      }>`
                    : ''
                }${
                  field.validations.maxLength?.value
                    ? `(${field.validations.maxLength.value})`
                    : ''
                }`
              )}`
            );
          }
        } else if (key === 'groups' && Array.isArray(value)) {
          for (const group of value || []) {
            const description =
              Object.keys(group.description).length &&
              Object.values(group.description)?.[0];
            Logger.raw(
              `    ${chalk.bold(group.id)}${
                description
                  ? `: ${chalk.grey(Object.values(group.description)?.[0])}`
                  : ''
              }`
            );
          }
        } else {
          Logger.objectRecurse(value, 3, '    ');
          // for (const [innerkey, innervalue] of Object.entries(value)) {
          //   if (innervalue && typeof innervalue === 'object') {
          //     Logger.raw(`    ${chalk.bold.grey(innerkey)}:`);
          //     console.table(innervalue);
          //   } else if (
          //     typeof innervalue !== 'undefined' &&
          //     innervalue !== null
          //   ) {
          //     Logger.raw(`    ${chalk.bold.grey(innerkey)}: ${innervalue}`);
          //   }
          // }
        }
      } else if (typeof value !== 'undefined' && value !== null) {
        const valueText =
          key === 'id' && typeof value === 'string'
            ? Logger.highlightText(value)
            : value;
        Logger.raw(`  ${chalk.bold.grey(key)}: ${valueText}`);
      }
    }
  };

  static objectRecurse: LogJsonMethod = (content, depth = 3, indent = '') => {
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item && typeof item === 'object') {
          if (Array.isArray(item) && depth > 3)
            Logger.raw(chalk.grey(`${indent}  [${item.join(', ')}]`));
          else Logger.objectRecurse(item, depth + 1, `${indent}  `);
        } else Logger.raw(`${indent}${item}`);
      }
    } else {
      let pos = 0;
      for (const [key, value] of Object.entries(content)) {
        const thisIndent =
          pos === 0 ? `${indent.substring(0, indent.length - 2)}- ` : indent;
        if (Array.isArray(value)) {
          if (value.length) Logger.raw(`${thisIndent}${chalk.bold.grey(key)}:`);
          for (const item of value) {
            if (item && typeof item === 'object') {
              if (Array.isArray(item) && depth > 3)
                Logger.raw(chalk.grey(`${indent}  [${item.join(', ')}]`));
              else Logger.objectRecurse(item, depth + 1, `${indent}  `);
            } else {
              Logger.raw(`${indent}  ${item}`);
            }
          }
        } else if (value && typeof value === 'object') {
          Logger.raw(`${indent}${chalk.bold.grey(key)}:`);

          Logger.objectRecurse(value, depth + 1, `${indent}  `);
          // console.table(value);
        } else if (typeof value !== 'undefined' && value !== null) {
          Logger.raw(`${thisIndent}${chalk.bold.grey(key)}: ${value}`);
        }
        pos++;
      }
    }
  };
  static raw: LogMethod = (content: string) => {
    if (progress.active) progress.current.interrupt(content);
    else console.log(content);
  };

  static limits = (
    content: string,
    displayLength = 30,
    consoleWidth = process.stdout.columns,
    logMethod: Function = console.info
  ) => {
    if (consoleWidth) {
      content
        .split('\n')
        .slice(0, consoleWidth ? displayLength : undefined)
        .map((line: string) =>
          logMethod(
            line
              .split('~n')
              .map(l =>
                consoleWidth && strlen(l) > consoleWidth
                  ? first(l, consoleWidth)
                  : l
              )
              .join('\n')
          )
        )
        .join('\n');
    } else {
      logMethod(content.replace(ansiEscapeCodes, ''));
    }

    const tableArray = content.split('\n');
    if (consoleWidth && tableArray.length > displayLength)
      console.info(
        `\n`,
        `- and ${tableArray.length - displayLength} more...\n`
      );
  };
}

export const logError: LogErrorFunc = (
  err = new Error('Undefined error'),
  msg,
  level = 'error'
) => {
  Logger[level](msg || err.message || err?.data?.message || err.Message);
  (Array.isArray(err) ? err : [err]).map((error: AppError) => {
    if (typeof error === 'string') {
      Logger.raw(`${Logger.infoText(error)}\n`);
      return;
    }
    if ('stack' in error) Logger.raw(`  ${Logger.infoText(error.stack)}\n`);
    if ('data' in error)
      Logger.raw(`  ${Logger.infoText(tryStringify(error.data))}\n`);
  });
  //Logger.line();
  return null;
};

export const addNewLines = (
  message = '',
  newLineSeparater = '\n',
  atPosition = process.stdout.columns
) => {
  if (message === '' || atPosition === 0) {
    return '';
  }

  let result = '';
  let lengthCounter = 0;

  // Partition the message string into an array of
  // [nonPrintable, printable][]
  const partitioned = partition(message);
  const addSeparater = () => {
    // If line length counter has exceeded the console width
    // add a new line separater and reset the line length counter
    if (lengthCounter >= atPosition) {
      result += newLineSeparater;
      lengthCounter = 0;
    }
  };

  // Loop through the partitioned message parts
  for (const [nonPrintable, printable] of partitioned) {
    // Convert string to array as this will provide accurate
    // lengths and splicing methods with all unicode chars
    const textParts = Array.from(printable);
    // Splice the remaining allowable line length from the text parts array
    const text = textParts.splice(0, atPosition - lengthCounter);
    // In the first iteration append the non printable unicode chars
    // to the beginning of the spliced text
    result += nonPrintable + text.join('');
    // Keep a count of the current line length
    // as one line of output could span multiple "partitions"
    lengthCounter += text.length;
    addSeparater();

    // Handle any remaining text in this "partition"
    while (textParts.length) {
      // Splice the remaining allowable line length from the text parts array
      const text = textParts.splice(0, atPosition - lengthCounter);
      // Append the spliced text to the result
      result += text.join('');
      // Increase line length counter
      lengthCounter += text.length;
      addSeparater();
    }
  }
  return result;
};

export const progress = {
  current: { interrupt: (x: string) => {} },
  active: false,
  // done: () => new ProgressBar('', 0),
  // colours: { green: '\u001b[42m \u001b[0m', red: '\u001b[41m \u001b[0m' },
  // current: new ProgressBar(`:bar`, {
  //   complete: '=',
  //   incomplete: ' ',
  //   width: 20,
  //   total: 100,
  // }),
};
