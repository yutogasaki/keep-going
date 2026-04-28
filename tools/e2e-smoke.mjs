import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { chromium, devices } from 'playwright';

const rootDir = process.cwd();
const previewPort = 4173 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${previewPort}`;
const artifactsDir = path.join(rootDir, 'artifacts', 'qa');
const storageKey = 'keepgoing-app-state';
const migrateSource = await fs.readFile(
    path.join(rootDir, 'src', 'store', 'use-app-store', 'migrate.ts'),
    'utf8',
);
const appStateVersionMatch = migrateSource.match(/APP_STATE_VERSION = (\d+)/);
if (!appStateVersionMatch) {
    throw new Error('Failed to read APP_STATE_VERSION from migrate.ts');
}
const appStateVersion = Number(appStateVersionMatch[1]);
const desktopSpeedMultiplier = 4;
const mobileSpeedMultiplier = 40;
const smokeEnv = {
    ...process.env,
    // Smoke should exercise local UI flows without requiring a live Supabase session.
    VITE_SUPABASE_URL: '',
    VITE_SUPABASE_ANON_KEY: '',
};

function logSmokeStep(message) {
    console.log(`[e2e-smoke] ${message}`);
}

function createLaunchOptions() {
    return {
        headless: true,
        timeout: 30000,
    };
}

function createUser() {
    return {
        id: 'qa-user-1',
        name: 'QA',
        classLevel: '初級',
        fuwafuwaBirthDate: '2026-03-01',
        fuwafuwaType: 1,
        fuwafuwaCycleCount: 1,
        fuwafuwaName: 'ふわ',
        pastFuwafuwas: [],
        notifiedFuwafuwaStages: [],
        dailyTargetMinutes: 20,
        excludedExercises: [],
        requiredExercises: [],
        consumedMagicSeconds: 0,
        challengeStars: 0,
        chibifuwas: [],
    };
}

function getTodayKey() {
    const now = new Date();
    const adjusted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const year = adjusted.getFullYear();
    const month = String(adjusted.getMonth() + 1).padStart(2, '0');
    const day = String(adjusted.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function createPersistedState(exerciseIds) {
    return {
        state: {
            users: [createUser()],
            onboardingCompleted: true,
            soundVolume: 0,
            ttsEnabled: false,
            bgmEnabled: false,
            hapticEnabled: false,
            notificationsEnabled: false,
            notificationTime: '21:00',
            hasSeenSessionControlsHint: true,
            dismissedHomeAnnouncementIds: [],
            homeVisitMemory: {
                soloByUserId: {},
                familyByUserSet: {},
            },
            sessionDraft: {
                kind: 'auto',
                date: getTodayKey(),
                exerciseIds,
                userIds: ['qa-user-1'],
                returnTab: 'home',
            },
            sessionUserIds: ['qa-user-1'],
            joinedChallengeIds: {},
            challengeEnrollmentWindows: {},
            debugFuwafuwaStage: null,
            debugFuwafuwaType: null,
            debugActiveDays: null,
            debugFuwafuwaScale: null,
        },
        version: appStateVersion,
    };
}

async function ensureArtifactsDir() {
    await fs.mkdir(artifactsDir, { recursive: true });
}

async function waitForServer(url, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const ok = await new Promise((resolve) => {
            const req = http.get(url, (res) => {
                res.resume();
                resolve(Boolean(res.statusCode && res.statusCode < 500));
            });
            req.on('error', () => resolve(false));
            req.setTimeout(2000, () => {
                req.destroy();
                resolve(false);
            });
        });

        if (ok) {
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(`Preview server did not start at ${url}`);
}

async function runProjectCommand(command) {
    const child = spawn(command, {
        cwd: rootDir,
        env: smokeEnv,
        stdio: 'inherit',
        shell: true,
        windowsHide: true,
    });

    await new Promise((resolve, reject) => {
        child.once('exit', (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(`Command failed (${code}): ${command}`));
        });
        child.once('error', reject);
    });
}

function startPreviewServer() {
    const command = process.platform === 'win32'
        ? `${process.env.ComSpec ?? 'cmd.exe'} /d /s /c "npm run preview -- --host 127.0.0.1 --port ${previewPort} --strictPort"`
        : `npm run preview -- --host 127.0.0.1 --port ${previewPort} --strictPort`;
    const child = spawn(command, {
        cwd: rootDir,
        env: smokeEnv,
        stdio: 'pipe',
        shell: true,
        windowsHide: true,
    });

    child.stdout.on('data', (chunk) => process.stdout.write(chunk));
    child.stderr.on('data', (chunk) => process.stderr.write(chunk));

    return child;
}

async function stopPreviewServer(child) {
    if (!child || child.killed) {
        return;
    }

    if (process.platform === 'win32' && child.pid) {
        await new Promise((resolve) => {
            const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
                stdio: 'ignore',
                windowsHide: true,
            });
            killer.once('exit', () => resolve());
            killer.once('error', () => resolve());
        });
        return;
    }

    child.kill('SIGTERM');
    await new Promise((resolve) => {
        child.once('exit', () => resolve());
        setTimeout(() => {
            if (!child.killed) {
                child.kill('SIGKILL');
            }
            resolve();
        }, 3000);
    });
}

function getInitScriptPayload(exerciseIds, speedMultiplier) {
    return {
        persisted: createPersistedState(exerciseIds),
        storageKey,
        speedMultiplier,
    };
}

async function preparePage(page, exerciseIds, speedMultiplier) {
    await page.addInitScript(({ persisted, storageKey: key, speed }) => {
        localStorage.setItem(key, JSON.stringify(persisted));

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel = () => {};
            window.speechSynthesis.speak = () => {};
            window.speechSynthesis.getVoices = () => [];
        }

        const originalSetTimeout = window.setTimeout.bind(window);
        const originalSetInterval = window.setInterval.bind(window);

        window.setTimeout = (handler, timeout = 0, ...args) => (
            originalSetTimeout(handler, Math.max(0, Number(timeout) / speed), ...args)
        );

        window.setInterval = (handler, timeout = 0, ...args) => (
            originalSetInterval(handler, Math.max(1, Number(timeout) / speed), ...args)
        );
    }, getInitScriptPayload(exerciseIds, speedMultiplier));

    await page.goto(baseUrl, { waitUntil: 'networkidle' });
}

async function switchVisibility(page, state) {
    await page.evaluate((nextState) => {
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => nextState,
        });
        document.dispatchEvent(new Event('visibilitychange'));
    }, state);
}

async function runDesktopScenario(browser) {
    logSmokeStep('desktop scenario: start');
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    const desktopExercises = ['S01', 'S02', 'S03'];
    await preparePage(page, desktopExercises, desktopSpeedMultiplier);

    await page.screenshot({ path: path.join(artifactsDir, 'home-desktop.png'), fullPage: true });

    await page.getByLabel('メニュー').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(artifactsDir, 'menu-desktop.png'), fullPage: true });

    await page.getByLabel('きろく').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(artifactsDir, 'record-desktop.png'), fullPage: true });

    await page.getByLabel('せってい').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(artifactsDir, 'settings-desktop.png'), fullPage: true });

    await page.getByLabel('ホーム').click();
    await page.getByLabel('ストレッチを始める').click();
    await page.getByLabel('ストレッチを終了する').waitFor({ state: 'visible' });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(artifactsDir, 'session-desktop-started.png') });

    await context.close();
    logSmokeStep('desktop scenario: complete');

    return {
        device: 'desktop',
        checks: ['footer navigation', 'session launch'],
    };
}

async function runMobileScenario(browser) {
    logSmokeStep('mobile scenario: start');
    const context = await browser.newContext({
        ...devices['Pixel 7'],
        locale: 'ja-JP',
    });
    const page = await context.newPage();
    const mobileExercises = Array.from({ length: 31 }, () => 'S01');
    await preparePage(page, mobileExercises, mobileSpeedMultiplier);

    await page.screenshot({ path: path.join(artifactsDir, 'home-mobile.png'), fullPage: true });

    await page.getByLabel('メニュー').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(artifactsDir, 'menu-mobile.png'), fullPage: true });

    await page.getByLabel('きろく').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(artifactsDir, 'record-mobile.png'), fullPage: true });

    await page.getByLabel('せってい').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(artifactsDir, 'settings-mobile.png'), fullPage: true });

    await page.getByLabel('ホーム').click();
    await page.getByLabel('ストレッチを始める').click();
    await page.getByLabel('ストレッチを終了する').waitFor({ state: 'visible' });
    await page.waitForSelector('text=ここで止まっていい。', { timeout: 20000 });
    await page.screenshot({ path: path.join(artifactsDir, 'session-mobile-big-break.png') });
    await page.getByRole('button', { name: 'つづける' }).click();
    await page.waitForSelector('text=ここで止まっていい。', { state: 'hidden' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactsDir, 'session-mobile-after-break-continue.png') });

    await context.close();
    logSmokeStep('mobile scenario: complete');

    return {
        device: 'mobile',
        checks: ['footer navigation', 'big break modal', 'continue exits break modal'],
    };
}

async function main() {
    logSmokeStep('preparing artifacts');
    await ensureArtifactsDir();
    logSmokeStep('building app');
    await runProjectCommand('npm run build');
    logSmokeStep('starting preview server');
    const previewServer = startPreviewServer();
    const report = {
        ranAt: new Date().toISOString(),
        baseUrl,
        artifactsDir,
        results: [],
    };

    try {
        logSmokeStep(`waiting for preview server at ${baseUrl}`);
        await waitForServer(baseUrl);
        logSmokeStep('launching desktop browser');
        const desktopBrowser = await chromium.launch(createLaunchOptions());
        try {
            report.results.push(await runDesktopScenario(desktopBrowser));
        } finally {
            logSmokeStep('closing desktop browser');
            await desktopBrowser.close();
        }

        logSmokeStep('launching mobile browser');
        const mobileBrowser = await chromium.launch(createLaunchOptions());
        try {
            report.results.push(await runMobileScenario(mobileBrowser));
        } finally {
            logSmokeStep('closing mobile browser');
            await mobileBrowser.close();
        }

        logSmokeStep('writing smoke report');
        await fs.writeFile(
            path.join(artifactsDir, 'session-smoke-report.json'),
            JSON.stringify(report, null, 2),
            'utf8',
        );
    } finally {
        logSmokeStep('stopping preview server');
        await stopPreviewServer(previewServer);
    }
    logSmokeStep('complete');
}

main().catch((error) => {
    console.error('[e2e-smoke] failed:', error);
    process.exitCode = 1;
});
