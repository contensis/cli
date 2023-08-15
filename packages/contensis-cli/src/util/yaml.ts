import { validateWorkflow } from '@action-validator/core';

import { parse, parseDocument, stringify } from 'yaml';

export const parseYaml = parse;
export const parseYamlDocument = parseDocument;
export const stringifyYaml = stringify;

export const validateWorkflowYaml = (yaml: string) => {
  const { actionType, errors } = validateWorkflow(yaml);
  if (actionType && errors.length === 0) return true;
  return errors;
};
