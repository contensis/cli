import dayjs from 'dayjs';
import { BlockVersion, MigrateModelsResult, MigrateStatus } from 'migratortron';
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

export const printMigrateResult = (
  { log, messages, contensis, currentProject }: ContensisCli,
  migrateResult: any,
  { action = 'import' }: { action?: 'import' | 'delete' } = {}
) => {
  if (Object.keys(migrateResult.entriesToMigrate.entryIds).length)
    console.log(``);

  for (const [contentTypeId, entryRes] of Object.entries(
    migrateResult.entriesToMigrate.entryIds
  ) as [string, any]) {
    for (const [originalId, entryStatus] of Object.entries(entryRes) as [
      string,
      any
    ][]) {
      console.log(`${log.helpText(contentTypeId)} ${entryStatus.entryTitle}`);
      console.log(
        log.infoText(
          `  ${originalId} ${Object.entries(entryStatus || {})
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
        )
      );

      for (const [projectId, projectStatus] of Object.entries(
        entryStatus
      ).filter(([key]) => key !== 'entryTitle') as [string, any][]) {
        const [targetGuid, { error, diff, status }] = Object.entries(
          projectStatus
        )[0] as [string, any];
        if (error) log.error(error);
        if (diff) {
          console.log(
            `    ${log.highlightText(`diff:`)} ${log.infoText(
              highlightDiffText(diff)
            )}\n`
          );
        }
      }
    }
    console.log(``);
  }
  if (
    contensis?.isPreview &&
    migrateResult.entriesToMigrate?.[currentProject]?.totalCount > 0 &&
    !migrateResult.errors
  ) {
    log.help(messages.entries.commitTip());
  }

  // Needs work
  // if (action === 'import') {
  //   for (const [projectId, contentTypeCounts] of Object.entries(
  //     migrateResult.entries || {}
  //   ) as [string, any][]) {
  //     console.log(
  //       `import from project ${log.highlightText(projectId)} to ${log.boldText(
  //         log.warningText(currentProject)
  //       )}`
  //     );
  //     for (const [contentTypeId, count] of Object.entries(
  //       contentTypeCounts
  //     ) as [string, number][]) {
  //       const entriesToMigrate =
  //         migrateResult.entriesToMigrate?.[projectId]?.[contentTypeId];

  //       console.log(
  //         `  - ${
  //           contentTypeId === 'totalCount'
  //             ? log.warningText(`${contentTypeId}: ${count}`)
  //             : `${contentTypeId}: ${log.helpText(count)}`
  //         } ${log.infoText`[existing: ${(
  //           ((migrateResult.existing?.[projectId]?.[contentTypeId] || 0) /
  //             count) *
  //           100
  //         ).toFixed(0)}%]`} [${
  //           typeof entriesToMigrate !== 'number' ? `unchanged` : `to update`
  //         }: ${(
  //           ((typeof entriesToMigrate !== 'number'
  //             ? entriesToMigrate?.['no change'] || 0
  //             : entriesToMigrate) /
  //             count) *
  //           100
  //         ).toFixed(0)}%]`
  //       );
  //     }
  //   }
  // }
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
