import { Node } from 'contensis-delivery-api/lib/models';
import dayjs from 'dayjs';
import { deconstructApiError } from './error';
import { Logger, addNewLines } from './logger';
import {
  BlockVersion,
  CopyFieldResult,
  EntriesMigrationResult,
  EntriesResult,
  MigrateModelsResult,
  MigrateNodesTree,
  MigrateStatus,
  NodesResult,
  ProjectNodesToMigrate,
} from 'migratortron';
import ContensisCli from '~/services/ContensisCliService';

const formatDate = (date: Date | string, format = 'DD/MM/YYYY HH:mm') =>
  dayjs(date).format(format);

export const printBlockVersion = (
  { log, messages }: ContensisCli,
  block: BlockVersion,
  printOptions = {
    showSource: true,
    showStatus: true,
    showStaticPaths: true,
    showImage: true,
  }
) => {
  console.log(
    `  ${log.standardText(`v${block.version.versionNo}`)} ${block.id}`
  );
  console.log(
    `    state: ${messages.blocks.runningStatus(
      block.status.broken ? 'broken' : block.status.running.global
    )}`
  );
  console.log(
    `    released: ${log.infoText(
      block.version.released
        ? `[${formatDate(block.version.released)}] ${block.version.releasedBy}`
        : 'no'
    )}`
  );
  if (block.version.madeLive)
    console.log(
      `    live: ${log.infoText(
        `[${formatDate(block.version.madeLive)}] ${block.version.madeLiveBy}`
      )}`
    );
  if (printOptions.showStatus) {
    console.log(`    status:`);
    console.log(`      deployment: ${log.infoText(block.status.deployment)}`);
    console.log(`      workflow: ${log.infoText(block.status.workflow)}`);
    console.log(
      `      running status: ${messages.blocks.runningStatus(
        block.status.running.global
      )}`
    );
    console.log(`      datacentres:`);
    console.log(
      `        hq: ${messages.blocks.runningStatus(
        block.status.running.dataCenters.hq
      )}`
    );
    console.log(
      `        london: ${messages.blocks.runningStatus(
        block.status.running.dataCenters.london
      )}`
    );
    console.log(
      `        manchester: ${messages.blocks.runningStatus(
        block.status.running.dataCenters.manchester
      )}`
    );
  }
  if (printOptions.showSource) {
    console.log(`    source:`);
    console.log(`      commit: ${log.helpText(block.source.commit.id)}`);
    console.log(
      `      message: ${log.infoText(
        block.source.commit.message
          ?.replaceAll('\n', '\\n')
          .replaceAll('\\n\\n', '\\n')
          .replaceAll('\\n', '; ')
      )}`
    );
    console.log(
      `      committed: ${log.infoText(
        `[${formatDate(block.source.commit.dateTime)}] ${
          block.source.commit.authorEmail
        }`
      )}`
    );
    console.log(
      `      pushed: ${log.infoText(
        `[${formatDate(block.version.pushed)}] ${block.version.pushedBy}`
      )}`
    );
    console.log(`      ${log.infoText(block.source.commit.commitUrl)}`);
  }
  if (printOptions.showImage) {
    console.log(`    image:`);
    console.log(`      uri: ${log.infoText(block.image.uri)}`);
    console.log(`      tag: ${log.helpText(block.image.tag)}`);
  }
  if (printOptions.showStaticPaths) {
    if (block.staticPaths?.length) {
      console.log(`    static paths:`);
      for (const path of block.staticPaths) console.log(`      - ${path}`);
    }
  }
  if (block.stagingUrl)
    console.log(`    staging url: ${log.infoText(block.stagingUrl)}`);
  console.log('');
};

export const printEntriesMigrateResult = (
  service: ContensisCli,
  migrateResult: EntriesMigrationResult | EntriesResult | CopyFieldResult,
  {
    action = 'import',
    showDiff = false,
    showAll = false,
    showChanged = false,
  }: {
    action?: 'import' | 'update' | 'delete';
    showDiff?: boolean;
    showAll?: boolean;
    showChanged?: boolean;
  } = {}
) => {
  console.log(``);
  const { log, messages, currentProject } = service;
  for (const [contentTypeId, entryRes] of Object.entries(
    migrateResult.entriesToMigrate.entryIds
  ) as [string, any]) {
    for (const [originalId, entryStatus] of Object.entries(entryRes) as [
      string,
      any,
    ][]) {
      const projectStatus = Object.entries(
        Object.entries(entryStatus[currentProject])[0]
      )[1][1] as any;
      if (
        showAll ||
        (showChanged &&
          projectStatus.status !== 'no change' &&
          projectStatus.status !== 'ignore')
      ) {
        console.log(
          log.infoText(
            `${Object.entries(entryStatus || {})
              .filter(x => x[0] !== 'entryTitle')
              .map(([projectId, projectStatus]) => {
                const [targetGuid, { status }] = (Object.entries(
                  projectStatus || {}
                )?.[0] as [string, { status: MigrateStatus }]) || [
                  '',
                  { x: { status: undefined } },
                ];
                return `${messages.migrate.status(status)(
                  `${status}`
                )} ${originalId}${
                  targetGuid !== originalId ? ` -> ${targetGuid}\n  ` : ' '
                }`;
              })}`
          ) + `${log.helpText(contentTypeId)} ${entryStatus.entryTitle}`
        );

        for (const [projectId, projectStatus] of Object.entries(
          entryStatus
        ).filter(([key]) => key !== 'entryTitle') as [string, any][]) {
          const [targetGuid, { error, diff, status }] = Object.entries(
            projectStatus
          )[0] as [string, any];
          if (error) log.error(error);
          if (diff && showDiff) {
            console.log(
              `  ${log.infoText(`diff: ${highlightDiffText(diff)}`)}\n`
            );
          }
        }
      }
    }
  }
  if (showAll || showChanged) console.log(``);

  for (const [projectId, contentTypeCounts] of Object.entries(
    migrateResult.entries || {}
  ) as [string, any][]) {
    log.help(
      action === 'update'
        ? `update entries in project ${log.boldText(
            log.warningText(currentProject)
          )}`
        : `${action}${
            action === 'delete'
              ? ` from project ${log.warningText(currentProject)}`
              : `${projectId ? ` from project ${log.highlightText(projectId)}` : ''} to ${log.boldText(
                  log.warningText(currentProject)
                )}`
          }`
    );
    for (const [contentTypeId, count] of Object.entries(contentTypeCounts) as [
      string,
      number,
    ][]) {
      const isTotalCountRow = contentTypeId === 'totalCount';
      const migrateStatusAndCount =
        migrateResult.entriesToMigrate[currentProject][contentTypeId];
      const existingCount =
        migrateResult.existing?.[currentProject]?.[contentTypeId] || 0;
      const existingPercent = ((existingCount / count) * 100).toFixed(0);
      const noChangeOrTotalEntriesCount =
        typeof migrateStatusAndCount !== 'number'
          ? (migrateStatusAndCount?.['no change'] || 0) +
            (migrateStatusAndCount?.['ignore'] || 0)
          : migrateStatusAndCount;

      const changedPercentage = (
        (noChangeOrTotalEntriesCount / count) *
        100
      ).toFixed(0);

      const existingColor =
        existingPercent === '0' || action === 'delete'
          ? log.warningText
          : log.infoText;

      const changedColor = isTotalCountRow
        ? log.helpText
        : changedPercentage === '100'
          ? log.successText
          : log.warningText;

      if (isTotalCountRow && 'nodes' in migrateResult) {
        printNodesMigrateResult(service, migrateResult, {
          showAll,
          showDiff,
          showChanged,
          isEntriesMigration: true,
        });
      }
      console.log(
        `  - ${
          isTotalCountRow
            ? log.highlightText(
                `${contentTypeId}: ${noChangeOrTotalEntriesCount}`
              )
            : `${contentTypeId}: ${log.helpText(count)}`
        }${
          changedPercentage === '100' || isTotalCountRow
            ? ''
            : existingColor(` [existing: ${`${existingPercent}%`}]`)
        }${
          existingPercent === '0' || (action === 'import' && isTotalCountRow)
            ? ''
            : changedColor(
                ` ${
                  isTotalCountRow
                    ? `[to ${action}: ${noChangeOrTotalEntriesCount}]`
                    : changedPercentage === '100'
                      ? 'up to date'
                      : `[needs update: ${100 - Number(changedPercentage)}%]`
                }`
              )
        }`
      );
    }
  }
  if (migrateResult.errors?.length) {
    console.log(
      `  - ${log.errorText(`errors: ${migrateResult.errors.length}`)}\n`
    );
    // for (const error of migrateResult.errors)
    //   log.error(error.message, null, '');
  }
};

export const printNodesMigrateResult = (
  { log, currentProject }: ContensisCli,
  migrateResult: EntriesMigrationResult | NodesResult,
  {
    action = 'import',
    logLimit = 50,
    showDiff = false,
    showAll = false,
    showChanged = false,
    isEntriesMigration = false,
  }: {
    action?: 'import' | 'delete';
    logLimit?: number;
    showDiff?: boolean;
    showAll?: boolean;
    showChanged?: boolean;
    isEntriesMigration?: boolean;
  } = {}
) => {
  if (!isEntriesMigration) log.raw(``);
  for (const [projectId, counts] of Object.entries(migrateResult.nodes || {})) {
    const importTitle =
      action === 'delete'
        ? `Delete from project ${log.warningText(currentProject)}`
        : `Import ${
            projectId && projectId !== 'null'
              ? `from project ${log.highlightText(projectId)} `
              : ''
          }to ${log.boldText(log.warningText(currentProject))}`;
    if (!isEntriesMigration) log.help(importTitle);

    const migrateStatusAndCount = migrateResult.nodesToMigrate[
      currentProject
    ] as ProjectNodesToMigrate;

    const existingCount = migrateResult.nodes?.[projectId]?.totalCount || 0;

    const totalCount = Object.keys(migrateResult.nodesToMigrate.nodeIds).length;
    const existingPercent = counts.totalCount
      ? ((existingCount / totalCount) * 100).toFixed(0)
      : '0';

    const noChangeCount = migrateStatusAndCount?.['no change'] || 0;

    const changedPercentage = counts.totalCount
      ? ((noChangeCount / totalCount) * 100).toFixed(0)
      : '0';

    const existingColor =
      existingPercent === '0' || action === 'delete'
        ? log.warningText
        : log.infoText;

    const changedColor =
      changedPercentage === '100' ? log.successText : log.warningText;

    if (!isEntriesMigration || migrateStatusAndCount.totalCount > 0)
      console.log(
        `  - ${log.highlightText(
          `${isEntriesMigration ? '  + nodes' : 'totalCount'}: ${
            migrateStatusAndCount.totalCount
          }`
        )}${
          changedPercentage === '100'
            ? ''
            : existingColor(` [existing: ${`${existingPercent}%`}]`)
        }${
          existingPercent === '0'
            ? ''
            : changedColor(
                ` ${
                  changedPercentage === '100'
                    ? 'up to date'
                    : `[needs update: ${100 - Number(changedPercentage)}%]`
                }`
              )
        }`
      );
  }
  if (migrateResult.errors?.length) {
    console.log(
      `  - ${log.errorText(`errors: ${migrateResult.errors.length}`)}\n`
    );

    log.limits(
      migrateResult.errors
        .map(error => {
          return log.errorText(deconstructApiError(error));
        })
        .join('\n'),
      logLimit
    );
  }
};

const highlightDiffText = (str: string) => {
  const addedRegex = new RegExp(/<<\+>>(.*?)<<\/\+>>/, 'g');
  const removedRegex = new RegExp(/<<->>(.*?)<<\/->>/, 'g');
  return str
    .replace(addedRegex, match => {
      return Logger.successText(
        match.replace(/<<\+>>/g, '<+>').replace(/<<\/\+>>/g, '</+>')
      );
    })
    .replace(removedRegex, match => {
      return Logger.errorText(
        match.replace(/<<->>/g, '<->').replace(/<<\/->>/g, '</->')
      );
    });
};

export const printModelMigrationAnalysis = (
  { log, messages }: ContensisCli,
  result: any = {}
) => {
  for (const [contentTypeId, model] of Object.entries(result) as [
    string,
    any,
  ][]) {
    let mainOutput = log.standardText(
      `  - ${contentTypeId}${
        model.contentTypeId ? ` ${log.helpText(model.contentTypeId)}` : ''
      }`
    );
    let extraOutput = '';
    let errorOutput = '';
    let diffOutput = '';
    for (const [key, details] of Object.entries(model) as [string, any][]) {
      if (key === 'dependencies') {
        extraOutput += log.infoText(
          `      references: [${details?.join(', ')}]\n`
        );
      }
      if (key === 'dependencyOf') {
        extraOutput += log.infoText(
          `      required by: [${details?.join(', ')}]\n`
        );
      }
      if (key === 'projects') {
        for (const [projectId, projectDetails] of Object.entries(details) as [
          string,
          any,
        ][]) {
          mainOutput += log.infoText(
            ` [${messages.migrate.status(projectDetails.status)(
              `${projectId}: ${projectDetails.status}`
            )}]${
              projectDetails.versionNo ? ` v${projectDetails.versionNo}` : ''
            }`
          );
          if (projectDetails.diff)
            diffOutput += `      ${log.highlightText(`diff:`)} ${log.infoText(
              highlightDiffText(projectDetails.diff)
            )}`;
          if (projectDetails.error)
            errorOutput += `      ${log.highlightText(
              `error:`
            )} ${log.errorText(projectDetails.error)}`;
        }
      }
    }
    console.log(mainOutput);
    if (extraOutput) {
      const search = '\n';
      const replace = '';
      console.log(
        extraOutput.replace(
          new RegExp(search + '([^' + search + ']*)$'),
          replace + '$1'
        )
      );
    }
    if (diffOutput) console.log(diffOutput);
    if (errorOutput) console.log(errorOutput);
  }
};

type MigrateResultSummary = MigrateModelsResult['']['contentTypes'];
type MigrateResultStatus = keyof MigrateResultSummary;

export const printModelMigrationResult = (
  { log, messages }: ContensisCli,
  result: MigrateResultSummary
) => {
  for (const [status, ids] of Object.entries(result) as [
    MigrateResultStatus,
    string[],
  ][]) {
    if (ids?.length) {
      if (status === 'errors') {
        const errors: [string, MappedError][] = ids as any;
        log.raw(
          `  - ${status}: [ ${messages.migrate.models.result(status)(
            ids.map(id => id[0]).join(', ')
          )} ]\n`
        );
        for (const [contentTypeId, error] of errors)
          log.error(
            `${log.highlightText(contentTypeId)}: ${error.message}`,
            error
          );
      } else
        log.raw(
          `  - ${status}: [ ${messages.migrate.models.result(status)(
            ids.join(', ')
          )} ]`
        );
    }
  }
};

export const printNodeTreeOutput = (
  { log, messages }: ContensisCli,
  root: Node | Partial<MigrateNodesTree> | undefined,
  logDetail = 'errors',
  logLimit = 1000
) => {
  log.raw('');
  const statusColour = messages.migrate.status;

  if (root && 'status' in root)
    log.info(
      `Migrate status: ${statusColour('no change')(
        'N'
      )} [no change]; ${statusColour('create')('C')} [create]; ${statusColour(
        'update'
      )('U')} [update]; ${statusColour('delete')('D')} [delete]; ${statusColour(
        'error'
      )('E')} [error];`
    );
  log.info(
    `Node properties: ${log.highlightText(
      'e'
    )} = has entry; ${log.highlightText('c')} = canonical; ${log.highlightText(
      'm'
    )} = include in menu`
  );

  log.line();

  const outputNode = (
    node: Partial<Node | MigrateNodesTree>,
    spaces: string,
    isRoot = false
  ) => {
    const errorOutput =
      'error' in node && node.error && deconstructApiError(node.error);
    const fullOutput = logDetail === 'all';
    const changesOutput =
      logDetail === 'changes' &&
      'status' in node &&
      node.status &&
      ['create', 'update'].includes(node.status);

    const diffOutput =
      (fullOutput || changesOutput || errorOutput) &&
      'diff' in node &&
      node.diff?.replaceAll('\n', '');

    return `${
      'status' in node && node.status
        ? `${statusColour(node.status)(
            node.status.substring(0, 1).toUpperCase()
          )} `
        : ''
    }${node.entry ? log.highlightText('e') : log.infoText('-')}${
      'isCanonical' in node && node.isCanonical
        ? log.highlightText('c')
        : log.infoText('-')
    }${
      node.includeInMenu ? log.highlightText('m') : log.infoText('-')
    }${spaces}${log[
      'status' in node && node.status === 'no change'
        ? 'infoText'
        : 'standardText'
    ](
      'isCanonical' in node && node.isCanonical
        ? log.boldText(
            fullOutput || isRoot || !node.slug ? node.path : `/${node.slug}`
          )
        : fullOutput || isRoot || !node.slug
          ? node.path
          : `/${node.slug}`
    )}${node.entry ? ` ${log.helpText(node.entry.sys.contentTypeId)}` : ''}${
      node.childCount ? ` +${node.childCount}` : ``
    } ${'displayName' in node ? log.infoText(node.displayName) : ''}${
      fullOutput || (changesOutput && node.id !== node.originalId)
        ? `~n  ${log.infoText(`id:`)} ${
            !('originalId' in node) || node.id === node.originalId
              ? node.id
              : `${node.id} ${log.infoText(`<= ${node.originalId}`)}`
          }`
        : ''
    }${
      (fullOutput ||
        (changesOutput && node.parentId !== node.originalParentId)) &&
      node.parentId
        ? `~n  ${log.infoText(
            `parentId: ${
              !('originalParentId' in node) ||
              node.parentId === node.originalParentId
                ? node.parentId
                : `${node.parentId} <= ${node.originalParentId}`
            }`
          )}`
        : ''
    }${
      fullOutput && node.entry?.sys.id
        ? `~n  ${log.infoText(`entryId: ${node.entry.sys.id}`)}`
        : ''
    }${
      errorOutput
        ? `~n${addNewLines(`  ${log.errorText(errorOutput)}`, '~n')}`
        : ''
    }${
      diffOutput
        ? `~n${addNewLines(
            `  ${log.infoText(`diff: ${highlightDiffText(diffOutput)}`)}`,
            '~n'
          )}`
        : ''
    }`;
  };

  const outputChildren = (
    node: Partial<Node | MigrateNodesTree> | undefined,
    depth = 2
  ) => {
    let str = '';
    for (const child of ((node as any)?.children || []) as Node[]) {
      str += `${outputNode(child, Array(depth + 1).join('  '))}\n`;
      if ('children' in child) str += outputChildren(child, depth + 1);
    }
    return str;
  };

  const children = outputChildren(root);
  log.limits(
    `${outputNode(root || {}, ' ', true)}${children ? `\n${children}` : ''}`,
    logLimit
  );
};
