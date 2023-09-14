import inquirer from 'inquirer';
import { JSONPath, JSONPathOptions } from 'jsonpath-plus';
import { Document } from 'yaml';
import {
  GitHubActionPushBlockJob,
  GitHubActionPushBlockJobStep,
  GitLabPushBlockJobStage,
} from '~/models/DevService';
import { readFile } from '~/providers/file-provider';
import ContensisDev from '~/services/ContensisDevService';
import { diffFileContent } from '~/util/diff';
import { logError } from '~/util/logger';
import { normaliseLineEndings } from '~/util/os';
import { parseYamlDocument, validateWorkflowYaml } from '~/util/yaml';

type MappedWorkflowOutput = {
  existingWorkflow: string;
  newWorkflow: string;
  diff: string;
};

export const mapCIWorkflowContent = async (
  cli: ContensisDev
): Promise<MappedWorkflowOutput | undefined> => {
  // get existing workflow file
  //
  const workflowFile = readFile(cli.git.ciFilePath);
  if (!workflowFile) return undefined;

  const blockId = cli.git.name;

  // parse yaml to js
  const workflowDoc = parseYamlDocument(workflowFile);
  const workflowJS = workflowDoc.toJS();

  if (cli.git.type === 'github') {
    const newWorkflow = await mapGitHubActionCIWorkflowContent(
      cli,
      blockId,
      workflowDoc,
      workflowJS
    );
    return {
      existingWorkflow: workflowFile,
      newWorkflow,
      diff: diffFileContent(workflowFile, newWorkflow),
    };
  } else if (cli.git.type === 'gitlab') {
    const newWorkflow = await mapGitLabCIWorkflowContent(
      cli,
      blockId,
      workflowDoc,
      workflowJS
    );
    return {
      existingWorkflow: workflowFile,
      newWorkflow,
      diff: diffFileContent(workflowFile, newWorkflow),
    };
  }
};

const findExistingJobSteps = (
  path: string,
  json: any,
  resultType: JSONPathOptions['resultType']
) => {
  const existingJobStep = JSONPath({
    path,
    json,
    resultType: resultType,
  });

  return existingJobStep;
};

const setWorkflowElement = (
  workflowDoc: Document,
  path: string | any[],
  value: any
) => {
  const findPath =
    typeof path === 'string' && path.includes('.')
      ? path.split('.').map(p => (Number(p) || Number(p) !== 0 ? p : Number(p)))
      : path;

  if (workflowDoc.hasIn(findPath)) {
    workflowDoc.setIn(findPath, value);
  } else {
    workflowDoc.addIn(findPath, value);
  }
};

const mapGitLabCIWorkflowContent = async (
  cli: ContensisDev,
  blockId: string,
  workflowDoc: Document,
  workflowJS: any
) => {
  const addGitLabJobStage: GitLabPushBlockJobStage = {
    stage: 'push-block',
    variables: {
      block_id: blockId,
      alias: cli.currentEnv,
      project_id: cli.currentProject,
      client_id:
        cli.clientDetailsLocation === 'env'
          ? cli.clientId
          : '$CONTENSIS_CLIENT_ID',
      shared_secret:
        cli.clientDetailsLocation === 'env'
          ? cli.clientSecret
          : '$CONTENSIS_SHARED_SECRET',
    },
  };

  const addAppImageUri = async () => {
    // Look in document level "variables"
    const appImageUri = await determineAppImageUri(
      cli,
      Object.entries(workflowJS.variables || {}),
      '$CI_REGISTRY_IMAGE/$CI_COMMIT_REF_NAME/app:build-$CI_PIPELINE_IID'
    );

    if (appImageUri.addVar)
      setWorkflowElement(
        workflowDoc,
        `variables.${appImageUri.var}`,
        appImageUri.uri
      );

    if (appImageUri.var)
      addGitLabJobStage.variables['image_uri'] = `\$${appImageUri.var}`;
  };

  // look for line in job
  //   jobname[stage: push-block]
  const existingJobStep = findExistingJobSteps(
    '$..[?(@property === "stage" && @.match(/^push-block/i))]^',
    workflowJS,
    'all'
  );

  // update job step
  if (existingJobStep.length) {
    // cli.log.json(existingJobStep);

    // The [0] index means we're only looking at updating the first instance in the file
    const step = existingJobStep[0];

    // Path looks like this "$['job_name']"
    // We want it to look like this "job_name"
    const stepPath = step.path
      .replace('$[', '')
      .replaceAll('][', '.')
      .replace(']', '')
      .replaceAll("'", '');

    cli.log.info(
      `Found existing Job step:
          ${stepPath}
            stage: ${step.value.stage}\n`
    );

    setWorkflowElement(
      workflowDoc,
      `${stepPath}.variables.alias`,
      cli.currentEnv
    );
    setWorkflowElement(
      workflowDoc,
      `${stepPath}.variables.project_id`,
      cli.currentProject
    );
    setWorkflowElement(workflowDoc, `${stepPath}.variables.block_id`, blockId);

    // This is likely not needed when updating an existing push-block job step
    // we are assuming this is a forked/copied workflow with an already working image-uri reference
    // await addAppImageUri();

    setWorkflowElement(
      workflowDoc,
      `${stepPath}.variables.client_id`,
      cli.clientDetailsLocation === 'env'
        ? cli.clientId
        : '$CONTENSIS_CLIENT_ID'
    );
    setWorkflowElement(
      workflowDoc,
      `${stepPath}.variables.shared_secret`,
      cli.clientDetailsLocation === 'env'
        ? cli.clientSecret
        : '$CONTENSIS_SHARED_SECRET'
    );
  } else {
    // create job with push step

    // Does a series of checks and prompts to determine the correct image-uri
    // for the app container build
    await addAppImageUri();

    // Add the new "job" to the Yaml Document
    workflowDoc.addIn(['stages'], 'push-block');
    workflowDoc.addIn([], {
      key: 'push-to-contensis',
      value: addGitLabJobStage,
    });
    setWorkflowElement(
      workflowDoc,
      `include`,
      'https://gitlab.zengenti.com/ops/contensis-ci/-/raw/main/push-block.yml'
    );
  }

  cli.log.debug(`New file content to write\n\n${workflowDoc}`);

  const newWorkflow = normaliseLineEndings(
    workflowDoc.toString({ lineWidth: 0 })
  );

  return newWorkflow;
};

const mapGitHubActionCIWorkflowContent = async (
  cli: ContensisDev,
  blockId: string,
  workflowDoc: Document,
  workflowJS: any
) => {
  const addGitHubActionJobStep: GitHubActionPushBlockJobStep = {
    name: 'Push block to Contensis',
    id: 'push-block',
    uses: 'contensis/block-push@v1',
    with: {
      'block-id': blockId,
      // 'image-uri': '${{ steps.build.outputs.image-uri }}',
      alias: cli.currentEnv,
      'project-id': cli.currentProject,
      'client-id':
        cli.clientDetailsLocation === 'env'
          ? '${{ env.CONTENSIS_CLIENT_ID }}'
          : '${{ secrets.CONTENSIS_CLIENT_ID }}',
      'shared-secret':
        cli.clientDetailsLocation === 'env'
          ? '${{ env.CONTENSIS_SHARED_SECRET }}'
          : '${{ secrets.CONTENSIS_SHARED_SECRET }}',
    },
  };

  const addAppImageUri = async () => {
    // Look in document level "env" vars
    const appImageUri = await determineAppImageUri(
      cli,
      Object.entries(workflowJS.env || {}),
      'ghcr.io/${{ github.repository }}/${{ github.ref_name }}/app'
    );

    if (appImageUri.addVar)
      setWorkflowElement(
        workflowDoc,
        `env.${appImageUri.var}`,
        appImageUri.uri
      );
    // workflowDoc.addIn(['env'], { [appImageUri.var]: appImageUri.uri });

    if (appImageUri.var)
      addGitHubActionJobStep.with[
        'image-uri'
      ] = `\${{ env.${appImageUri.var} }}:build-\${{ github.run_number }}`;
  };

  // look for line in job
  //   jobs.x.steps[uses: contensis/block-push]
  const existingJobStep = findExistingJobSteps(
    '$.jobs..steps.*[?(@property === "uses" && @.match(/^contensis\\/block-push/i))]^',
    workflowJS,
    'all'
  );

  // update job step
  if (existingJobStep.length) {
    //cli.log.json(existingJobStep);

    // The [0] index means we're only looking at updating the first instance in the file
    const step = existingJobStep[0];

    // Path looks like this "$['jobs']['build']['steps'][3]"
    // We want it to look like this "jobs.build.steps.3"
    const stepPath = step.path
      .replace('$[', '')
      .replaceAll('][', '.')
      .replace(']', '')
      .replaceAll("'", '');

    cli.log.info(
      `Found existing Job step: ${stepPath}
          - name: ${step.value.name}
            id: ${step.value.id}\n`
    );

    setWorkflowElement(workflowDoc, `${stepPath}.with.alias`, cli.currentEnv);
    setWorkflowElement(
      workflowDoc,
      `${stepPath}.with.project-id`,
      cli.currentProject
    );
    setWorkflowElement(workflowDoc, `${stepPath}.with.block-id`, blockId);

    // This is likely not needed when updating an existing push-block job step
    // we are assuming this is a forked/copied workflow with an already working image-uri reference
    // await addAppImageUri();

    setWorkflowElement(
      workflowDoc,
      `${stepPath}.with.client-id`,
      cli.clientDetailsLocation === 'env'
        ? '${{ env.CONTENSIS_CLIENT_ID }}'
        : '${{ secrets.CONTENSIS_CLIENT_ID }}'
    );
    setWorkflowElement(
      workflowDoc,
      `${stepPath}.with.shared-secret`,
      cli.clientDetailsLocation === 'env'
        ? '${{ env.CONTENSIS_SHARED_SECRET }}'
        : '${{ secrets.CONTENSIS_SHARED_SECRET }}'
    );
  } else {
    // create job with push step

    // is there already a job with a property name containing "build"?
    const existingBuildJobStep = findExistingJobSteps(
      '$.jobs[?(@property.match(/build/i))]',
      workflowJS,
      'all'
    ) as JSONPathOptions[]; // This isn't the correct type for this object

    let needs: string | undefined;
    // There are multiple jobs called *build*
    if (existingBuildJobStep.length > 1) {
      // prompt which build job we should depend on before pushing the block
      const choices = existingBuildJobStep.map(s => s.parentProperty);
      choices.push(new inquirer.Separator() as any);
      choices.push('none');
      if (choices.includes('build-app')) needs = 'build-app';
      else {
        ({ needs } = await inquirer.prompt([
          {
            type: 'list',
            prefix: '⌛',
            message: cli.messages.devinit.ciMultipleBuildJobChoices(),
            name: 'needs',
            choices,
            default: choices.find(
              s => typeof s === 'string' && s.includes('docker')
            ),
          },
        ]));
      }

      cli.log.raw('');
    } else if (existingBuildJobStep.length === 1)
      // Exactly one job step found containing a property name of *build*
      // we'll assume that is the one the push-block job depends on
      needs = existingBuildJobStep[0].parentProperty;

    if (existingBuildJobStep.length === 0 || needs === 'none') {
      // No existing build step found or chosen, offer all job steps in prompt
      const choices = Object.keys(workflowJS.jobs);
      choices.push(new inquirer.Separator() as any);
      choices.push('none');

      ({ needs } = await inquirer.prompt([
        {
          type: 'list',
          prefix: '⌛',
          message: cli.messages.devinit.ciMultipleJobChoices(),
          name: 'needs',
          choices,
          default: choices.find(
            j => typeof j === 'string' && j.includes('docker')
          ),
        },
      ]));
      if (needs === 'none') needs = undefined;
      cli.log.raw('');
    }

    // Does a series of checks and prompts to determine the correct image-uri
    // for the app container build
    await addAppImageUri();

    const newJob: GitHubActionPushBlockJob = {
      name: 'Deploy container image to Contensis',
      'runs-on': 'ubuntu-latest',
      needs,
      steps: [addGitHubActionJobStep],
    };

    // Add the new "job" to the Yaml Document
    workflowDoc.addIn(['jobs'], {
      key: 'deploy',
      value: newJob,
    });
  }

  // Workflow validation provided by @action-validator/core package
  const workflowIsValid = validateWorkflowYaml(workflowDoc.toString());

  // We could expand validation to check for having a build step to wait for
  // or if a valid image-uri attribute is set
  if (workflowIsValid === true) {
    cli.log.success(`GitHub workflow YAML is valid`);
    cli.log.debug(`New file content to write\n\n${workflowDoc}`);
  } else if (Array.isArray(workflowIsValid)) {
    // Errors
    logError(
      [
        ...workflowIsValid.map(
          res => new Error(`${res.code}: ${res.detail || res.title}`)
        ),
        workflowDoc.toString(),
      ],
      `GitHub workflow YAML did not pass validation check`
    );
  }

  // const newWorkflow = normaliseLineEndings(
  //   workflowDoc.toString({ lineWidth: 0 })
  // );

  const newWorkflow = workflowDoc.toString();

  return newWorkflow;
};

const determineAppImageUri = async (
  cli: ContensisDev,
  vars: [string, string][],
  defaultUri: string
) => {
  // Determine container image-uri via variables and/or prompts

  // Find vars including the word "image"
  const imageVars = vars.filter(([varname]) =>
    varname.toLowerCase().includes('image')
  );
  // Find vars named "image" that include the word "app"
  const appImageVars = imageVars.filter(
    ([varname, value]) =>
      !varname.toLowerCase().includes('builder_') &&
      (varname.toLowerCase().includes('app_') ||
        varname.toLowerCase().includes('build_') ||
        value?.toLowerCase().includes('/app'))
  );

  const appImageUriGuess = appImageVars?.[0];

  let appImageUri: string | undefined;
  let appImageVar: string | undefined;

  if (appImageUriGuess) {
    cli.log.success(
      `Found variable ${cli.log.standardText(
        appImageUriGuess[0]
      )} we'll use for pulling the block image from: ${cli.log.infoText(
        appImageUriGuess[1]
      )}`
    );
    appImageVar = appImageUriGuess[0];
  } else {
    // Could not find a suitable var to use for block image-uri
    // prompt for an app image uri
    const choices = vars.map(v => v[0]);
    const enterOwnMsg = 'enter my own / use default';

    choices.push(new inquirer.Separator() as any);
    choices.push(enterOwnMsg);
    choices.push(defaultUri);

    ({ appImageVar, appImageUri } = await inquirer.prompt([
      // First question determines if an existing env variable
      // already containes the tagged app image uri
      {
        type: 'list',
        prefix: '🐳',
        message: cli.messages.devinit.ciMultipleAppImageVarChoices(),
        name: 'appImageVar',
        choices,
        default: choices.find(
          v => typeof v === 'string' && v.toLowerCase().includes('image')
        ),
      },
      // Subsequent prompt allows input of an image-uri if needed
      {
        type: 'input',
        when(answers) {
          return [enterOwnMsg, defaultUri].includes(answers.appImageVar);
        },
        prefix: `\n \n🔗`,
        message: cli.messages.devinit.ciEnterOwnAppImagePrompt(cli.git),
        name: 'appImageUri',
        default: defaultUri,
      },
    ]));
    cli.log.raw('');

    // this indicates a uri has been added and we will add a new var
    // to the workflow to encourage users to update the docker tag part
    // of their build workflow to use the same var as the push-block job/step
    if ([enterOwnMsg, defaultUri].includes(appImageVar || ''))
      appImageVar = undefined;
  }

  if (appImageVar)
    appImageUri =
      cli.git.type === 'github'
        ? `\${{ env.${appImageVar} }}`
        : `\$${appImageVar}`;

  // TODO: prompt further for image tag

  return {
    addVar: !appImageVar,
    uri: appImageUri,
    var: appImageVar || 'BUILD_IMAGE',
  };
};
