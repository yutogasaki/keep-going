import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

function capture(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.error) {
    return { ok: false, output: result.error.message };
  }

  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
}

function assert(condition, message, failures) {
  if (!condition) {
    failures.push(message);
  }
}

const failures = [];
const claudeVersion = capture('claude', ['--version']);
const codexVersion = capture('codex', ['--version']);
const pythonVersion = capture('python3', ['--version']);

console.log(`Claude: ${claudeVersion.ok ? claudeVersion.output : 'missing'}`);
console.log(`Codex: ${codexVersion.ok ? codexVersion.output : 'missing'}`);
console.log(`Python: ${pythonVersion.ok ? pythonVersion.output : 'missing'}`);

const claudeSettingsPath = path.join(repoRoot, '.claude', 'settings.json');
const claudeSettings = JSON.parse(readFileSync(claudeSettingsPath, 'utf8'));
const enabledPlugins = claudeSettings.enabledPlugins ?? {};
const marketplaces = claudeSettings.extraKnownMarketplaces ?? {};

assert(Boolean(enabledPlugins['claude-mem@thedotmack']), 'Project settings are missing claude-mem enablement.', failures);
assert(Boolean(enabledPlugins['ui-ux-pro-max@ui-ux-pro-max-skill']), 'Project settings are missing ui-ux-pro-max enablement.', failures);
assert(Boolean(marketplaces.thedotmack), 'Project settings are missing thedotmack marketplace.', failures);
assert(Boolean(marketplaces['ui-ux-pro-max-skill']), 'Project settings are missing ui-ux-pro-max-skill marketplace.', failures);

if (claudeVersion.ok) {
  const pluginList = capture('claude', ['plugins', 'list']);
  assert(pluginList.output.includes('claude-mem@thedotmack'), 'Claude plugin list is missing claude-mem@thedotmack.', failures);
  assert(
    pluginList.output.includes('ui-ux-pro-max@ui-ux-pro-max-skill'),
    'Claude plugin list is missing ui-ux-pro-max@ui-ux-pro-max-skill.',
    failures,
  );
}

if (codexVersion.ok) {
  const codexSkillPath = path.join(os.homedir(), '.codex', 'skills', 'ui-ux-pro-max', 'SKILL.md');
  assert(existsSync(codexSkillPath), `Codex skill is missing at ${codexSkillPath}.`, failures);
}

if (failures.length > 0) {
  console.error('\nAI tooling check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('\nAI tooling check passed.');
