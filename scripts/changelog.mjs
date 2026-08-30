#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const HEADER = '# Changelog\n\n';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const lastTag = run('git describe --tags --abbrev=0');
const range = lastTag ? `${lastTag}..HEAD` : '';
const log = run(`git log ${range} --no-merges --pretty=format:%s`);
const commits = log ? log.split('\n').filter(Boolean) : [];

if (commits.length === 0) {
  console.log('No new commits since last release; skipping changelog entry.');
  process.exit(0);
}

const date = new Date().toISOString().slice(0, 10);
const entry = `## [${pkg.version}] - ${date}\n\n${commits.map((c) => `- ${c}`).join('\n')}\n\n`;
const existing = existsSync('CHANGELOG.md') ? readFileSync('CHANGELOG.md', 'utf8') : HEADER;
const body = existing.startsWith(HEADER) ? existing.slice(HEADER.length) : existing;

writeFileSync('CHANGELOG.md', HEADER + entry + body);
console.log(`Wrote CHANGELOG.md entry for v${pkg.version} (${commits.length} commits)`);
