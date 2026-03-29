import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const homeDir = os.homedir();

function log(message) {
  console.log(`[ai:setup] ${message}`);
}

function run(command, args, options = {}) {
  log(`$ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status}`);
  }
}

function commandAvailable(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return !result.error && result.status === 0;
}

function setupClaude() {
  if (!commandAvailable('claude')) {
    log('Claude Code is not installed. Skipping Claude plugin setup.');
    return;
  }

  log('Installing project-scoped Claude plugins.');
  run('claude', ['plugins', 'marketplace', 'add', '--scope', 'project', 'nextlevelbuilder/ui-ux-pro-max-skill']);
  run('claude', ['plugins', 'install', '--scope', 'project', 'ui-ux-pro-max@ui-ux-pro-max-skill']);
  run('claude', ['plugins', 'marketplace', 'add', '--scope', 'project', 'thedotmack/claude-mem']);
  run('claude', ['plugins', 'install', '--scope', 'project', 'claude-mem@thedotmack']);
}

function setupCodex() {
  if (!commandAvailable('codex')) {
    log('Codex CLI is not installed. Skipping Codex skill setup.');
    return;
  }

  if (!commandAvailable('npx')) {
    throw new Error('npx is required to install the Codex UI skill.');
  }

  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'keepgoing-uipro-'));
  const generatedSkillRoot = path.join(tempDir, '.codex', 'skills', 'ui-ux-pro-max');
  const targetSkillRoot = path.join(homeDir, '.codex', 'skills', 'ui-ux-pro-max');

  writeFileSync(path.join(tempDir, 'package.json'), '{\n  "name": "keepgoing-ai-setup",\n  "private": true\n}\n');

  log('Generating the latest Codex UI/UX Pro Max skill in a temp workspace.');
  run('npx', ['-y', 'uipro-cli@latest', 'init', '--ai', 'codex', '--force'], { cwd: tempDir });

  if (!existsSync(generatedSkillRoot)) {
    throw new Error(`Generated Codex skill was not found at ${generatedSkillRoot}`);
  }

  mkdirSync(path.dirname(targetSkillRoot), { recursive: true });
  rmSync(targetSkillRoot, { recursive: true, force: true });
  cpSync(generatedSkillRoot, targetSkillRoot, { recursive: true, force: true });
  rmSync(path.join(targetSkillRoot, 'scripts', '__pycache__'), { recursive: true, force: true });

  log(`Copied Codex skill to ${targetSkillRoot}`);
}

setupClaude();
setupCodex();

log('Setup complete. Restart Claude Code and Codex to pick up plugin/skill changes.');
