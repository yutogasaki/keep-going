import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const DEFAULT_SESSION_DAYS = 10;
const DEFAULT_LOG_MB = 256;

function parseArgs(argv) {
  const options = {
    apply: false,
    codexHome: path.join(os.homedir(), '.codex'),
    sessionDays: DEFAULT_SESSION_DAYS,
    logMb: DEFAULT_LOG_MB,
    top: 20,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--apply') {
      options.apply = true;
    } else if (arg === '--codex-home') {
      options.codexHome = path.resolve(argv[++index]);
    } else if (arg === '--session-days') {
      options.sessionDays = Number(argv[++index]);
    } else if (arg === '--log-mb') {
      options.logMb = Number(argv[++index]);
    } else if (arg === '--top') {
      options.top = Number(argv[++index]);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.sessionDays) || options.sessionDays < 1) {
    throw new Error('--session-days must be a positive number.');
  }
  if (!Number.isFinite(options.logMb) || options.logMb < 1) {
    throw new Error('--log-mb must be a positive number.');
  }
  if (!Number.isFinite(options.top) || options.top < 1) {
    throw new Error('--top must be a positive number.');
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/codex-maintenance.mjs [options]

Inspects ~/.codex by default. With --apply, archives old active session files
and rotates oversized Codex log databases. It never deletes files.

Options:
  --apply                 Perform archive/rotate actions. Refuses while Codex is running.
  --codex-home <path>     Override Codex home path. Default: ~/.codex
  --session-days <days>   Archive active sessions older than this. Default: ${DEFAULT_SESSION_DAYS}
  --log-mb <mb>           Rotate root logs_*.sqlite files above this size. Default: ${DEFAULT_LOG_MB}
  --top <count>           Number of largest files to show. Default: 20
  --help                  Show this help.
`);
}

function human(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)}${units[unitIndex]}`;
}

function safeStat(filePath) {
  try {
    return statSync(filePath);
  } catch {
    return null;
  }
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile()) {
        const stat = safeStat(entryPath);
        if (stat) {
          files.push({ path: entryPath, size: stat.size, mtimeMs: stat.mtimeMs });
        }
      }
    }
  }

  return files;
}

function directorySize(root) {
  return walkFiles(root).reduce((total, file) => total + file.size, 0);
}

function codexProcesses() {
  const result = spawnSync('ps', ['-axo', 'pid=,command='], { encoding: 'utf8' });
  if (result.error || result.status !== 0) return [];

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /\/Applications\/Codex\.app|codex app-server|Codex Helper/.test(line))
    .filter((line) => !line.includes('codex-maintenance.mjs'));
}

function sqliteQuickCheck(filePath) {
  if (!existsSync(filePath)) return 'missing';
  const result = spawnSync('sqlite3', [filePath, 'pragma quick_check;'], { encoding: 'utf8' });
  if (result.error) return 'sqlite3 missing';
  if (result.status !== 0) return `failed: ${result.stderr.trim()}`;
  return result.stdout.trim();
}

function findOldActiveSessions(codexHome, sessionDays) {
  const sessionsDir = path.join(codexHome, 'sessions');
  const cutoff = Date.now() - sessionDays * 24 * 60 * 60 * 1000;

  return walkFiles(sessionsDir)
    .filter((file) => file.path.endsWith('.jsonl'))
    .filter((file) => file.mtimeMs < cutoff)
    .sort((a, b) => b.size - a.size);
}

function findLargeLogs(codexHome, logMb) {
  if (!existsSync(codexHome)) return [];
  const threshold = logMb * 1024 * 1024;
  return readdirSync(codexHome, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => /^logs.*\.sqlite(?:-wal|-shm)?$/.test(entry.name))
    .map((entry) => {
      const filePath = path.join(codexHome, entry.name);
      const stat = statSync(filePath);
      return { path: filePath, size: stat.size, mtimeMs: stat.mtimeMs };
    })
    .filter((file) => file.size >= threshold)
    .sort((a, b) => b.size - a.size);
}

function copyIfExists(source, targetRoot) {
  if (!existsSync(source)) return null;
  const target = path.join(targetRoot, path.basename(source));
  const stat = statSync(source);
  if (stat.isDirectory()) {
    cpSync(source, target, { recursive: true, force: false, errorOnExist: true });
  } else {
    copyFileSync(source, target);
  }
  return target;
}

function createBackup(codexHome, stamp) {
  const backupRoot = path.join(codexHome, 'backups', `maintenance-${stamp}`);
  mkdirSync(backupRoot, { recursive: true });

  const backupTargets = [
    'config.toml',
    'auth.json',
    '.codex-global-state.json',
    '.codex-global-state.json.bak',
    'session_index.jsonl',
    'state_5.sqlite',
    'state_5.sqlite-wal',
    'state_5.sqlite-shm',
    'memories',
    'rules',
    'ambient-suggestions',
    'skills',
    'plugins',
  ];

  const copied = [];
  for (const relativePath of backupTargets) {
    const copiedPath = copyIfExists(path.join(codexHome, relativePath), backupRoot);
    if (copiedPath) copied.push(copiedPath);
  }

  return { backupRoot, copied };
}

function moveIntoArchive(file, sourceRoot, archiveRoot) {
  const relativePath = path.relative(sourceRoot, file.path);
  const target = path.join(archiveRoot, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  renameSync(file.path, target);
  return target;
}

function inspect(options) {
  const { codexHome, sessionDays, logMb, top } = options;
  if (!existsSync(codexHome)) {
    throw new Error(`Codex home does not exist: ${codexHome}`);
  }

  const processes = codexProcesses();
  const allFiles = walkFiles(codexHome);
  const oldSessions = findOldActiveSessions(codexHome, sessionDays);
  const largeLogs = findLargeLogs(codexHome, logMb);
  const rootEntries = readdirSync(codexHome, { withFileTypes: true })
    .map((entry) => {
      const entryPath = path.join(codexHome, entry.name);
      const stat = statSync(entryPath);
      const size = stat.isDirectory() ? directorySize(entryPath) : stat.size;
      return { path: entryPath, size, isDirectory: stat.isDirectory() };
    })
    .sort((a, b) => b.size - a.size);

  console.log(`Codex home: ${codexHome}`);
  console.log(`Mode: ${options.apply ? 'apply' : 'inspect only'}`);
  console.log(`Codex running: ${processes.length > 0 ? 'yes' : 'no'}`);
  if (processes.length > 0) {
    console.log(`Codex processes: ${processes.length}`);
  }
  console.log(`Total size: ${human(allFiles.reduce((total, file) => total + file.size, 0))}`);
  console.log(`State DB quick_check: ${sqliteQuickCheck(path.join(codexHome, 'state_5.sqlite'))}`);
  console.log(`Logs DB quick_check: ${sqliteQuickCheck(path.join(codexHome, 'logs_2.sqlite'))}`);

  console.log('\nLargest root entries:');
  for (const entry of rootEntries.slice(0, top)) {
    console.log(`- ${human(entry.size).padStart(6)} ${path.relative(codexHome, entry.path)}${entry.isDirectory ? '/' : ''}`);
  }

  console.log(`\nOld active session candidates (>${sessionDays} days): ${oldSessions.length}, ${human(oldSessions.reduce((total, file) => total + file.size, 0))}`);
  for (const file of oldSessions.slice(0, top)) {
    console.log(`- ${human(file.size).padStart(6)} ${path.relative(codexHome, file.path)}`);
  }

  console.log(`\nLarge log candidates (>=${logMb}MB): ${largeLogs.length}, ${human(largeLogs.reduce((total, file) => total + file.size, 0))}`);
  for (const file of largeLogs) {
    console.log(`- ${human(file.size).padStart(6)} ${path.relative(codexHome, file.path)}`);
  }

  if (!options.apply) {
    console.log('\nNo files changed. Re-run with --apply after closing Codex to archive candidates.');
  }

  return { processes, oldSessions, largeLogs };
}

function applyMaintenance(options, plan) {
  if (plan.processes.length > 0) {
    console.error('\nRefusing to apply because Codex is running. Close Codex and run again.');
    process.exit(2);
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
  const { codexHome } = options;
  const { backupRoot, copied } = createBackup(codexHome, stamp);

  const sessionArchiveRoot = path.join(codexHome, 'archived_sessions', `maintenance-${stamp}`);
  const logArchiveRoot = path.join(codexHome, 'archived_logs', `maintenance-${stamp}`);

  const movedSessions = plan.oldSessions.map((file) =>
    moveIntoArchive(file, path.join(codexHome, 'sessions'), sessionArchiveRoot),
  );
  const movedLogs = plan.largeLogs.map((file) => moveIntoArchive(file, codexHome, logArchiveRoot));

  console.log('\nMaintenance applied.');
  console.log(`Backup: ${backupRoot} (${copied.length} item(s))`);
  console.log(`Archived sessions: ${movedSessions.length}`);
  console.log(`Rotated logs: ${movedLogs.length}`);
  console.log('Restart Codex so it can recreate fresh log files and refresh session state.');
}

try {
  const options = parseArgs(process.argv.slice(2));
  const plan = inspect(options);
  if (options.apply) {
    applyMaintenance(options, plan);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
