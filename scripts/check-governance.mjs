import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

const governanceChecks = [
  ['AGENTS.md', 30],
  ['CLAUDE.md', 30],
  ['.agents/agent-guide.md', 120],
  ['.agents/tasks/TASKS.md', 30],
  ['.agents/tasks/DONE.md', 50],
  ['.agents/MEMORY.md', 40],
];

const stalePatterns = ['.Codex/tasks', '.claude/tasks', '.Codex/launch.json'];
const terminologyAllowlist = new Set([
  'docs/terminology.md',
  'scripts/check-governance.mjs',
]);
const terminologyPatterns = [
  {
    label: '単品',
    matches(line) {
      return line.includes('単品');
    },
  },
  {
    label: 'オリジナル種目',
    matches(line) {
      return line.includes('オリジナル種目');
    },
  },
  {
    label: 'オリジナルメニュー',
    matches(line) {
      return line.includes('オリジナルメニュー');
    },
  },
  {
    label: '個別種目',
    matches(line) {
      return line.includes('個別種目');
    },
  },
  {
    label: 'ひとつタブ',
    matches(line) {
      return line.includes('ひとつタブ') || line.includes('「ひとつ」タブ');
    },
  },
  {
    label: "label: 'ひとつ'",
    matches(line) {
      return line.includes("label: 'ひとつ'") || line.includes('label: "ひとつ"');
    },
  },
];
const scanExtensions = new Set([
  '.json',
  '.js',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);

const sourceGuardrails = [
  {
    label: 'React page / modal / editor',
    threshold: 500,
    matches(relativePath) {
      return (
        relativePath.startsWith('src/') &&
        relativePath.endsWith('.tsx') &&
        (relativePath.includes('/pages/') || /(Modal|Sheet|Editor)\.tsx$/.test(relativePath))
      );
    },
  },
  {
    label: 'Hook / service / data',
    threshold: 300,
    matches(relativePath) {
      return (
        relativePath.startsWith('src/') &&
        /\.(ts|tsx)$/.test(relativePath) &&
        /(\/hooks\/|\/lib\/|\/data\/|\/store\/|\/contexts\/)/.test(relativePath)
      );
    },
  },
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'dist' || entry.name === 'node_modules') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function toRelative(fullPath) {
  return path.relative(root, fullPath).replaceAll('\\', '/');
}

async function readUtf8(fullPath) {
  return readFile(fullPath, 'utf8');
}

async function countLines(relativePath) {
  const content = await readUtf8(path.join(root, relativePath));
  return content.split(/\r?\n/).length;
}

async function collectStaleRefs(files) {
  const matches = [];

  for (const fullPath of files) {
    const relativePath = toRelative(fullPath);
    if (relativePath === 'scripts/check-governance.mjs') {
      continue;
    }

    if (!scanExtensions.has(path.extname(relativePath))) {
      continue;
    }

    let content;
    try {
      content = await readUtf8(fullPath);
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      stalePatterns.forEach((pattern) => {
        if (line.includes(pattern)) {
          matches.push(`${relativePath}:${index + 1} -> ${pattern}`);
        }
      });
    });
  }

  return matches;
}

async function collectTerminologyIssues(files) {
  const issues = [];

  for (const fullPath of files) {
    const relativePath = toRelative(fullPath);
    if (terminologyAllowlist.has(relativePath)) {
      continue;
    }

    if (!scanExtensions.has(path.extname(relativePath))) {
      continue;
    }

    let content;
    try {
      content = await readUtf8(fullPath);
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      terminologyPatterns.forEach((pattern) => {
        if (pattern.matches(line)) {
          issues.push(`${relativePath}:${index + 1} -> ${pattern.label}`);
        }
      });
    });
  }

  return issues;
}

async function collectSourceWarnings(files) {
  const warnings = [];

  for (const fullPath of files) {
    const relativePath = toRelative(fullPath);
    const guardrail = sourceGuardrails.find((item) => item.matches(relativePath));
    if (!guardrail) {
      continue;
    }

    const lineCount = await countLines(relativePath);
    if (lineCount > guardrail.threshold) {
      warnings.push(
        `${relativePath}: ${lineCount} lines (threshold ${guardrail.threshold}, ${guardrail.label})`,
      );
    }
  }

  return warnings.sort();
}

async function collectLegacySkillIssues() {
  const issues = [];
  const canonicalRoot = path.join(root, '.agents', 'skills');
  const legacyRoot = path.join(root, '.claude', 'skills');

  const canonicalSkills = (await readdir(canonicalRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const skill of canonicalSkills) {
    const legacySkillPath = path.join(legacyRoot, skill, 'SKILL.md');
    try {
      const content = await readUtf8(legacySkillPath);
      const expected = `.agents/skills/${skill}/SKILL.md`;
      if (!content.includes('# Legacy Redirect') || !content.includes(expected)) {
        issues.push(`.claude/skills/${skill}/SKILL.md is not a redirect to ${expected}`);
      }
    } catch {
      issues.push(`.claude/skills/${skill}/SKILL.md is missing`);
    }
  }

  return issues;
}

async function main() {
  const files = await walk(root);
  const errors = [];

  console.log('Governance file sizes:');
  for (const [relativePath, threshold] of governanceChecks) {
    try {
      const lineCount = await countLines(relativePath);
      const status = lineCount > threshold ? 'warn' : 'ok';
      console.log(`- ${relativePath}: ${lineCount} lines (threshold ${threshold}) [${status}]`);
    } catch {
      console.log(`- ${relativePath}: missing (threshold ${threshold}) [error]`);
      errors.push(`${relativePath} is missing`);
    }
  }

  const staleRefs = await collectStaleRefs(files);
  console.log('\nStale path references:');
  if (staleRefs.length === 0) {
    console.log('- none');
  } else {
    staleRefs.forEach((entry) => console.log(`- ${entry}`));
    errors.push(...staleRefs.map((entry) => `stale path reference: ${entry}`));
  }

  const terminologyIssues = await collectTerminologyIssues(files);
  console.log('\nTerminology drift:');
  if (terminologyIssues.length === 0) {
    console.log('- none');
  } else {
    terminologyIssues.forEach((entry) => console.log(`- ${entry}`));
    errors.push(...terminologyIssues.map((entry) => `terminology drift: ${entry}`));
  }

  const legacySkillIssues = await collectLegacySkillIssues();
  console.log('\nLegacy skill redirects:');
  if (legacySkillIssues.length === 0) {
    console.log('- ok');
  } else {
    legacySkillIssues.forEach((entry) => console.log(`- ${entry}`));
    errors.push(...legacySkillIssues);
  }

  const sourceWarnings = await collectSourceWarnings(files);
  console.log('\nSource size warnings:');
  if (sourceWarnings.length === 0) {
    console.log('- none');
  } else {
    sourceWarnings.forEach((entry) => console.log(`- ${entry}`));
  }

  if (errors.length > 0) {
    console.error(`\nGovernance check failed with ${errors.length} issue(s).`);
    process.exitCode = 1;
    return;
  }

  console.log('\nGovernance check passed.');
}

await main();
