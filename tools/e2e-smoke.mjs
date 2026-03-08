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
const appStateVersion = 16;
const desktopSpeedMultiplier = 4;
const mobileSpeedMultiplier = 40;

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
            sessionDraft: {
                date: getTodayKey(),
                exerciseIds,
                userIds: [],
                returnTab: 'home',
            },
            joinedChallengeIds: {},
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
    await page.waitForSelector('text=最初は');
    await page.waitForSelector('text=最初は', { state: 'hidden' });
    await page.getByLabel('ストレッチを一時停止').waitFor({ state: 'visible' });

    await page.getByLabel('ストレッチを一時停止').click();
    await page.waitForSelector('text=一時停止中');
    await page.screenshot({ path: path.join(artifactsDir, 'session-desktop-paused.png') });

    await page.getByLabel('ストレッチを再開').click();
    await page.waitForSelector('text=一時停止中', { state: 'hidden' });
    await page.getByLabel('ストレッチを一時停止').waitFor({ state: 'visible' });
    await page.waitForTimeout(250);
    await switchVisibility(page, 'hidden');
    await page.waitForSelector('text=一時停止中');
    await switchVisibility(page, 'visible');
    await page.waitForSelector('text=最初は');
    await page.waitForSelector('text=最初は', { state: 'hidden' });
    await page.getByLabel('ストレッチを一時停止').waitFor({ state: 'visible' });
    await page.waitForSelector('text=一時停止中', { state: 'hidden' });
    await page.screenshot({ path: path.join(artifactsDir, 'session-desktop-resume.png') });

    await context.close();

    return {
        device: 'desktop',
        checks: ['footer navigation', 'pause / resume control', 'background resume countdown'],
    };
}

async function runMobileScenario(browser) {
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

    return {
        device: 'mobile',
        checks: ['footer navigation', 'big break modal', 'continue exits break modal'],
    };
}

async function main() {
    await ensureArtifactsDir();
    await runProjectCommand('npm run build');
    const previewServer = startPreviewServer();
    const report = {
        ranAt: new Date().toISOString(),
        baseUrl,
        artifactsDir,
        results: [],
    };

    try {
        await waitForServer(baseUrl);
        const desktopBrowser = await chromium.launch({ headless: true });
        try {
            report.results.push(await runDesktopScenario(desktopBrowser));
        } finally {
            await desktopBrowser.close();
        }

        const mobileBrowser = await chromium.launch({ headless: true });
        try {
            report.results.push(await runMobileScenario(mobileBrowser));
        } finally {
            await mobileBrowser.close();
        }

        await fs.writeFile(
            path.join(artifactsDir, 'session-smoke-report.json'),
            JSON.stringify(report, null, 2),
            'utf8',
        );
    } finally {
        await stopPreviewServer(previewServer);
    }
}

main().catch((error) => {
    console.error('[e2e-smoke] failed:', error);
    process.exitCode = 1;
});
