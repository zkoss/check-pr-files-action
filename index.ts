import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { PullsListFilesResponseData as PullsListFiles } from '@octokit/types';

function getInputAsList(label: string, opts?: core.InputOptions): string[] {
  return core.getInput(label, opts)
    .split("\n")
    .map(s => s.trim())
    .filter(x => x !== '');
}

function getFileNameOnly(fullPath: string): string {
  const lastSep = fullPath.lastIndexOf('/');
  return lastSep >= 0
    ? fullPath.substring(lastSep + 1)
    : fullPath;
}

async function getChangedFiles(client: InstanceType<typeof GitHub>,
                               prNumber: number): Promise<string[]> {
  const listFilesOptions = client.pulls.listFiles.endpoint.merge({
    ...github.context.repo,
    pull_number: prNumber
  });

  const listFilesResponse: PullsListFiles = await client.paginate(listFilesOptions);
  const changedFiles = listFilesResponse.map(v => v.filename);

  if (core.isDebug()) {
    core.debug('found changed files:');
    for (const file of changedFiles) {
      core.debug(` - ${file}`);
    }
  }

  return changedFiles;
}

async function run() {
  try {
    const pr = github.context.payload.pull_request;
    if (!pr) {
      core.warning('Not a PR. Skipped.');
      return;
    }

    const prTitle: string = pr.title;
    if (prTitle.toLowerCase().includes('refine')) {
      core.info('Ignored a refine PR.');
      return;
    }

    const token = core.getInput('token', {required: true});
    const octokit = github.getOctokit(token);
    const changedFiles = await getChangedFiles(octokit, pr.number);
    const files = getInputAsList('files', {required: true});

    const labels: string[] = [];
    for (let file of files) {
      let included = changedFiles.includes(file);
      core.debug(`${file}: included: ${included}`);
      if (!included) {
        labels.push(`need-${getFileNameOnly(file)}`);
      }
    }

    if (labels.length > 0) {
      core.info(`Will add labels: ${labels}`);
      octokit.issues.addLabels({
        ...github.context.repo,
        issue_number: pr.number,
        labels: labels
      });
    }
  } catch (e) {
    core.setFailed(`Error: ${e}`);
  }
}

run();
