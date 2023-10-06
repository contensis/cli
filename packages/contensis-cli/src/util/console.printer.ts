import { Node } from 'contensis-delivery-api/lib/models';
import dayjs from 'dayjs';
import {
  BlockVersion,
  EntriesResult,
  MigrateModelsResult,
  MigrateStatus,
  NodesResult,
} from 'migratortron';
import ContensisCli from '~/services/ContensisCliService';
import { Logger } from './logger';

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
  { log, messages, currentProject }: ContensisCli,
  migrateResult: EntriesResult,
  {
    action = 'import',
    showDiff = false,
    showAll = false,
    showChanged = false,
  }: {
    action?: 'import' | 'delete';
    showDiff?: boolean;
    showAll?: boolean;
    showChanged?: boolean;
  } = {}
) => {
  console.log(``);

  for (const [contentTypeId, entryRes] of Object.entries(
    migrateResult.entriesToMigrate.entryIds
  ) as [string, any]) {
    for (const [originalId, entryStatus] of Object.entries(entryRes) as [
      string,
      any
    ][]) {
      if (
        showAll ||
        (showChanged &&
          (
            Object.entries(
              Object.entries(entryStatus[currentProject])[0]
            )[1][1] as any
          ).status !== 'no change')
      ) {
        console.log(
          log.infoText(
            `${originalId} ${Object.entries(entryStatus || {})
              .filter(x => x[0] !== 'entryTitle')
              .map(([projectId, projectStatus]) => {
                const [targetGuid, { status }] = (Object.entries(
                  projectStatus || {}
                )?.[0] as [string, { status: MigrateStatus }]) || [
                  '',
                  { x: { status: undefined } },
                ];
                return `${messages.migrate.status(status)(`${status}`)}${
                  targetGuid !== originalId ? `-> ${targetGuid}` : ''
                }`;
              })}`
          ) + ` ${log.helpText(contentTypeId)} ${entryStatus.entryTitle}`
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
              `    ${log.highlightText(`diff:`)} ${log.infoText(
                highlightDiffText(diff)
              )}\n`
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
      `${action} from project ${
        action === 'delete'
          ? log.warningText(currentProject)
          : `${log.highlightText(projectId)} to ${log.boldText(
              log.warningText(currentProject)
            )}`
      }`
    );
    for (const [contentTypeId, count] of Object.entries(contentTypeCounts) as [
      string,
      number
    ][]) {
      const isTotalCountRow = contentTypeId === 'totalCount';
      const migrateStatusAndCount =
        migrateResult.entriesToMigrate[currentProject][contentTypeId];
      const existingCount =
        migrateResult.existing?.[currentProject]?.[contentTypeId] || 0;
      const existingPercent = ((existingCount / count) * 100).toFixed(0);
      const noChangeOrTotalEntriesCount =
        typeof migrateStatusAndCount !== 'number'
          ? migrateStatusAndCount?.['no change'] || 0
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
    for (const error of migrateResult.errors)
      log.error(error.message || error, null, '');
  }
};

export const printNodesMigrateResult = (
  { log, messages, currentProject }: ContensisCli,
  migrateResult: NodesResult,
  {
    action = 'import',
    showDiff = false,
    showAll = false,
    showChanged = false,
  }: {
    action?: 'import' | 'delete';
    showDiff?: boolean;
    showAll?: boolean;
    showChanged?: boolean;
  } = {}
) => {
  console.log(``);

  for (const [originalId, migrateNodeId] of Object.entries(
    migrateResult.nodesToMigrate.nodeIds
  )) {
    if (showAll || (showChanged && migrateNodeId.status !== 'no change')) {
      console.log(
        log.infoText(
          `${originalId} ${`${messages.migrate.status(migrateNodeId.status)(
            `${migrateNodeId.status}`
          )}${
            migrateNodeId.id !== originalId ? `-> ${migrateNodeId.id}` : ''
          }`}`
        ) + ` ${log.helpText(migrateNodeId.path)} ${migrateNodeId.displayName}`
      );

      if (migrateNodeId.diff && showDiff)
        console.log(
          `    ${log.highlightText(`diff:`)} ${log.infoText(
            highlightDiffText(migrateNodeId.diff)
          )}\n`
        );
    }
  }
  if (showAll || showChanged) console.log(``);

  for (const [projectId, counts] of Object.entries(migrateResult.nodes || {})) {
    log.help(
      `${action} from project ${
        action === 'delete'
          ? log.warningText(currentProject)
          : `${log.highlightText(projectId)} to ${log.boldText(
              log.warningText(currentProject)
            )}`
      }`
    );
    counts.totalCount;
    const migrateStatusAndCount = migrateResult.nodesToMigrate[currentProject];
    const existingCount =
      migrateResult.existing?.[currentProject]?.totalCount || 0;
    const existingPercent = ((existingCount / counts.totalCount) * 100).toFixed(
      0
    );
    const noChangeOrTotalEntriesCount =
      typeof migrateStatusAndCount !== 'number'
        ? migrateStatusAndCount?.['no change'] || 0
        : migrateStatusAndCount;
    const changedPercentage = (
      (noChangeOrTotalEntriesCount / counts.totalCount) *
      100
    ).toFixed(0);
    const existingColor =
      existingPercent === '0' || action === 'delete'
        ? log.warningText
        : log.infoText;

    const changedColor =
      changedPercentage === '100' ? log.successText : log.warningText;

    console.log(
      `  - ${log.highlightText(`totalCount: ${counts.totalCount}`)}${
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
    for (const error of migrateResult.errors)
      log.error(error.message || error, null, '');
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
    any
  ][]) {
    let mainOutput = log.standardText(`  - ${contentTypeId}`);
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
          any
        ][]) {
          mainOutput += log.infoText(
            ` [${messages.migrate.status(projectDetails.status)(
              `${projectId}: ${projectDetails.status}`
            )}] v${projectDetails.versionNo}`
          );
          if (projectDetails.diff)
            diffOutput += `      ${log.highlightText(`diff:`)} ${log.infoText(
              highlightDiffText(projectDetails.diff)
            )}\n`;
          if (projectDetails.error)
            errorOutput += `      ${log.highlightText(
              `error::`
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
    string[]
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
  { log }: ContensisCli,
  root: Node | undefined
) => {
  log.object({ ...root, children: undefined });
  log.raw('');
  log.info(
    `${log.highlightText('e')} = has entry; ${log.highlightText(
      'c'
    )} = canonical; ${log.highlightText('m')} = include in menu`
  );
  log.line();

  const outputNode = (node: Node | any, spaces: string) =>
    `${node.entry ? log.highlightText('e') : log.infoText('-')}${
      node.isCanonical ? log.highlightText('c') : log.infoText('-')
    }${
      node.includeInMenu ? log.highlightText('m') : log.infoText('-')
    }${spaces}${
      node.isCanonical ? log.boldText(`/${node.slug}`) : `/${node.slug}`
    }${node.entry ? ` ${log.helpText(node.entry.sys.contentTypeId)}` : ''}${
      node.childCount ? ` +${node.childCount}` : ``
    } ${log.infoText(node.displayName)}`;

  const outputChildren = (root: Node | undefined, depth = 2) => {
    let str = '';
    for (const node of (root as any)?.children as Node[]) {
      str += `${outputNode(node, Array(depth + 1).join('  '))}\n`;
      if ('children' in node) str += outputChildren(node, depth + 1);
    }
    return str;
  };

  const children = outputChildren(root);
  log.limits(
    `${outputNode(root, '  ')}${children ? `\n${children}` : ''}`,
    100
  );
};
