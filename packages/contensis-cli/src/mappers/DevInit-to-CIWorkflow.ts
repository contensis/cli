import { JSONPath, JSONPathOptions } from 'jsonpath-plus';
import { readFile } from '~/providers/file-provider';
import ContensisDev from '~/services/ContensisDevService';
import { diffFileContent } from '~/util/diff';
import { GitHelper } from '~/util/git';
import { logError } from '~/util/logger';
import { normaliseLineEndings } from '~/util/os';
import { parseYamlDocument, validateWorkflowYaml } from '~/util/yaml';

type MappedWorkflowOutput = {
  existingWorkflow: string;
  newWorkflow: string;
  diff: string;
};

export const mapCIWorkflowContent = (
  cli: ContensisDev,
  git: GitHelper
): MappedWorkflowOutput | undefined => {
  // get existing workflow file
  const workflowFile = readFile(git.ciFilePath);
  if (!workflowFile) return undefined;

  const blockId = git.name;
  if (git.type === 'github') {
    const addGitHubActionJobStep = {
      name: 'Push block to Contensis',
      id: 'push-block',
      uses: 'contensis/block-push@v1',
      with: {
        'block-id': blockId,
        // 'image-uri': '${{ steps.build.outputs.image-uri }}',
        alias: cli.currentEnv,
        'project-id': cli.currentProject,
        'client-id': '${{ secrets.CONTENSIS_CLIENT_ID }}',
        'shared-secret': '${{ secrets.CONTENSIS_SHARED_SECRET }}',
      },
    };

    // parse yaml to js
    const workflowDoc = parseYamlDocument(workflowFile);
    const workflow = workflowDoc.toJS();
    const setWorkflowElement = (path: string | any[], value: any) => {
      const findPath =
        typeof path === 'string' && path.includes('.')
          ? path
              .split('.')
              .map(p => (Number(p) || Number(p) !== 0 ? p : Number(p)))
          : path;

      if (workflowDoc.hasIn(findPath)) {
        workflowDoc.setIn(findPath, value);
      } else {
        workflowDoc.addIn(findPath, value);
        // }
      }
    };
    const findExistingJobSteps = (
      resultType: JSONPathOptions['resultType']
    ) => {
      // look for line in job
      //   jobs.x.steps[uses: contensis/block-push]
      const path =
        git.type === 'github'
          ? '$.jobs..steps.*[?(@property === "uses" && @.match(/^contensis\\/block-push/i))]^'
          : // TODO: add jsonpath for gitlab file
            '';

      const existingJobStep = JSONPath({
        path,
        json: workflow,
        resultType: resultType,
      });

      return existingJobStep;
    };

    const existingJobStep = findExistingJobSteps('all');

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

      setWorkflowElement(`${stepPath}.with.alias`, cli.currentEnv);
      setWorkflowElement(`${stepPath}.with.project-id`, cli.currentProject);
      setWorkflowElement(`${stepPath}.with.block-id`, blockId);
      setWorkflowElement(
        `${stepPath}.with.client-id`,
        '${{ secrets.CONTENSIS_CLIENT_ID }}'
      );
      setWorkflowElement(
        `${stepPath}.with.shared-secret`,
        '${{ secrets.CONTENSIS_SHARED_SECRET }}'
      );
    } else {
      // create job with push step
      workflowDoc.addIn(['jobs'], {
        key: 'deploy',
        value: {
          name: 'Push image to Contensis',
          'runs-on': 'ubuntu-latest',
          steps: [addGitHubActionJobStep],
        },
      });
    }

    // Workflow validation provided by @action-validator/core package
    const workflowIsValid = validateWorkflowYaml(workflowDoc.toString());

    if (workflowIsValid === true) {
      cli.log.debug(
        `New file content to write to ${git.ciFilePath}\n\n${workflowDoc}`
      );
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
    const newWorkflow = normaliseLineEndings(
      workflowDoc.toString({ lineWidth: 0 })
    );

    return {
      existingWorkflow: workflowFile,
      newWorkflow,
      diff: diffFileContent(workflowFile, newWorkflow),
    };
  }
};
