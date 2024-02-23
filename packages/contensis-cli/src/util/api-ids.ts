export const sanitiseId = (id: string) =>
  id
    .split('.')
    .map(part => toApiId(part, 'camelCase', true))
    .join('.');

export const sanitiseIds = (arr: string[]) => arr.map(sanitiseId);

// borrowed from packages\contensis\components\app\src\utils.ts

export function isApiId(id: string, mode: 'camelCase' | 'snake-case'): boolean {
  if (!id) {
    return false;
  }
  const validChars = mode === 'camelCase' ? /[^a-zA-Z0-9]/g : /[^a-z0-9-]/g;
  if (id !== id.replace(validChars, '')) {
    return false;
  }
  if (!id.substr(0, 1).replace(/[^a-z]/g, '')) {
    return false;
  }
  return true;
}

export function toApiId(
  name: string,
  mode: 'camelCase' | 'snake-case',
  isId: boolean
) {
  if (!name) {
    return name;
  }
  const validChars =
    mode === 'camelCase' ? /[^a-zA-Z0-9 ]/g : /[^a-zA-Z0-9 -]/g;
  let id = name.replace(validChars, '');
  id = id.replace(/-/g, ' ');
  id = id.trim();

  const noStart = '0123456789 '.split('');
  id = id
    .split('')
    .reduce(
      (prev, char) => (prev || !noStart.includes(char) ? prev + char : prev),
      ''
    );
  return mode === 'camelCase' ? toCamelCase(id, isId) : toSnakeCase(id);
}

function toSnakeCase(sentence: string): string {
  sentence = (sentence || '').trim();
  if (!sentence) {
    return sentence;
  }
  sentence = sentence.toLowerCase();
  return sentence
    .split(' ')
    .filter(w => !!w)
    .join('-');
}

function toCamelCase(sentence: string, isId: boolean): string {
  sentence = (sentence || '').trim();
  if (!sentence) {
    return sentence;
  }
  if (sentence.length < 2) {
    return sentence.toLowerCase();
  }
  const words = sentence.split(' ');
  if (isId && words.length === 1) {
    return words[0].substr(0, 1).toLowerCase() + words[0].substr(1);
  }
  const result = words
    .filter(w => !!w)
    .map((w, index) =>
      index === 0 ? firstWordToCamelCase(w) : wordToCamelCase(w)
    )
    .join('');

  return result
    .split('.')
    .map((w, index) => (index === 0 ? w : wordToCamelCase(w)))
    .join('.');
}

function firstWordToCamelCase(word: string) {
  return isUpperCase(word)
    ? word.toLowerCase()
    : lowerCaseInitialCapitalLettersExceptLast(word);
}

function wordToCamelCase(word: string) {
  return word.substr(0, 1).toUpperCase() + word.substr(1);
}

function lowerCaseInitialCapitalLettersExceptLast(value: string): string {
  return value.split('').reduce((prev, char, index) => {
    if (index === 0) {
      char = char.toLowerCase();
    } else if (isUpperCase(char)) {
      if (index + 1 < value.length && isUpperCase(value.charAt(index + 1))) {
        char = char.toLowerCase();
      }
    }
    return prev + char;
  }, '');
}

function isUpperCase(value: string): boolean {
  return value === value.toUpperCase();
}
